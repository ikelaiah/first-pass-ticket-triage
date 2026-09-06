/**
 * Scope detection - how many people, teams or schools are affected.
 *
 * Scope is deliberately allowed to stay "unknown". Inventing a scope is the
 * fastest way to produce a confident and wrong priority.
 */
import { clauseIndexOf, scan, scanPositive } from './negation.js';
import { createEvidenceLedger } from './evidence.js';
import { SCOPE_DEFINITIONS, SCOPE_PHRASES, ALL_USERS_PHRASES } from '../data/phrases.js';
import { organisationConfig } from '../config.js';

const BY_ID = new Map(SCOPE_DEFINITIONS.map((d) => [d.id, d]));

/** Definition record for a scope id (falls back to Unknown). */
export function scopeDefinition(id) {
  return BY_ID.get(id) || BY_ID.get('unknown');
}

export function scopeLabel(id) {
  const def = scopeDefinition(id);
  if (def.id === 'all-schools') return 'All ' + organisationConfig.schoolCount + ' Schools';
  return def.label;
}

/** People counts: "35 casual staff" -> team. Also "1847 records affected" -> cohort for batch data validation. */
const PEOPLE_COUNT = /\b(\d{1,4})\s+(?:casual\s+|part[- ]time\s+|full[- ]time\s+|new\s+|additional\s+|affected\s+)?(staff|users|employees|teachers|students|people|parents|accounts|administrators|admins|adviser|advisers|registrar|registrars|timesheets|records|mailboxes|girls|boys|children|kids|pupils|applicants|enrolments|families|treaties)\b/g;

const WRITTEN_NUMBER_VALUES = new Map([
  ['one', 1], ['two', 2], ['three', 3], ['four', 4], ['five', 5],
  ['six', 6], ['seven', 7], ['eight', 8], ['nine', 9], ['ten', 10],
  ['eleven', 11], ['twelve', 12], ['thirteen', 13], ['fourteen', 14],
  ['fifteen', 15], ['sixteen', 16], ['seventeen', 17], ['eighteen', 18],
  ['nineteen', 19], ['twenty', 20]
]);
const PEOPLE_WORD_COUNT = new RegExp(
  '\\b(' + [...WRITTEN_NUMBER_VALUES.keys()].join('|') +
  ')\\s+(?:(?:casual|part[- ]time|full[- ]time|new|additional|affected)\\s+)?' +
  '(staff|users|employees|teachers|students|people|parents|accounts|administrators|admins|adviser|advisers|registrar|registrars|timesheets|records|mailboxes|girls|boys|children|kids|pupils|applicants|enrolments|families|treaties)\\b', 'g'
);

// Rows and submitted forms are a batch of records, rather than a team of
// people. Their count does not change the fact that the affected object is a
// cohort of records that needs coordinated remediation.
const BATCH_RECORD_COUNT = /\b(\d{1,4}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\s+(?:submitted\s+)?(?:(?:enrolment|permission)\s+)?(?:rows?|forms?)\b/g;

/** School counts: "three schools" is handled by phrases, "4 schools" here. */
const SCHOOL_COUNT = /\b(\d{1,3})\s+schools\b/g;

function scopeForPeople(n) {
  if (n <= 1) return 'individual';
  if (n <= 9) return 'few-users';
  if (n <= 99) return 'team';
  return 'cohort';
}

function scopeForSchools(n) {
  if (n <= 1) return 'one-school';
  if (n >= organisationConfig.schoolCount) return 'all-schools';
  return 'multiple-schools';
}

/**
 * "the same access as the rest of the registrar team" mentions a team as a
 * *comparison*, not as the affected population. Scope phrases that follow one
 * of these are ignored.
 */
const COMPARISON_CONTEXT =
  /\b(?:same(?:\s+\w+){0,3}\s+as|as the rest of|like the|similar to|matching|equivalent to|copy of|mirror(?:ing)?|in line with|consistent with)\s+(?:the\s+|our\s+|a\s+)?$/;

/**
 * "she teaches Year 9 Geography" names the class she teaches, not the people
 * affected - the affected person is the teacher. A group named as *what someone
 * teaches or looks after* is a descriptor, not a scope.
 */
const DESCRIPTOR_CONTEXT =
  /\b(?:teaches|teaching|teacher (?:of|for)|takes|runs|coordinates|coordinator (?:of|for)|assigned to|timetabled for|delivers|responsible for|in charge of)\s+(?:the\s+|our\s+|a\s+)?$/;

/**
 * "flip-flopping from year 2 and year 12" names the values a record is moving
 * between, not the people affected.
 *
 * Deliberately narrow: it only applies to a bare year level, because those are
 * the scope words that double as a *field value*. "missing from all schools"
 * is a location and must keep its scope.
 */
const BARE_YEAR = /^year \d{1,2}$/;
const MOVEMENT_NEARBY =
  /\b(?:from|between|to|into|enrolled in|placed in|moved in|ended up in|made it into)\b[^.;!?]{0,40}$/;
const NON_POPULATION_SUFFIX =
  /^\s+(?:report|reports|folder|folders|document|documents|file|files|roll|rolls|class list|class lists)\b/;

function isValueNotPopulation(doc, quote, start, end) {
  if (!BARE_YEAR.test(quote)) return false;
  return MOVEMENT_NEARBY.test(doc.text.slice(Math.max(0, start - 60), start)) ||
    NON_POPULATION_SUFFIX.test(doc.text.slice(end, end + 40));
}

/**
 * "the Year 9 Geography teacher" describes one person by the class they take.
 * A group followed by a *person role* is naming an individual, not a cohort.
 */
const ROLE_SUFFIX =
  /^(?:\s+\w+){0,2}\s+(?:teacher|teachers|coordinator|coordinators|head|tutor|mentor|supervisor|convenor)\b/;

/**
 * "everyone else Outlook is working" names the unaffected comparison group,
 * not the affected population. In that construction, the requester is the
 * only person reported as affected.
 */
const UNAFFECTED_COMPARISON_SUFFIX =
  /^\s+else(?:['’]s)?\b[^.;!?]{0,48}\b(?:(?:is|are|was|were)\s+(?:still\s+)?(?:working|fine|ok|okay|healthy|normal|unaffected|unimpacted)|works?|can\s+(?:still\s+)?(?:work|use|access|log in|sign in|proceed))\b/;

const HISTORICAL_SCOPE_MARKER =
  /\b(?:yesterday|last\s+(?:term|night|evening|week|month|monday|tuesday|wednesday|thursday|friday|saturday|sunday|spring|summer|autumn|fall|winter)|previous(?:ly)?|earlier|the day before)\b/i;
const CURRENT_SCOPE_MARKER =
  /\b(?:today|this\s+(?:morning|afternoon|evening)|currently|right now|at present|still)\b/i;

function isHistoricalOnlyHit(doc, start) {
  const clause = doc.clauses.find((candidate) => start >= candidate.start && start < candidate.end);
  if (!clause) return false;
  const before = clause.text.slice(0, start - clause.start);
  if (!HISTORICAL_SCOPE_MARKER.test(before)) return false;
  // A current display can show yesterday's values.  The possessive timestamp
  // qualifies the displayed data, not when the stated population is affected.
  if (/\b(?:is|are|remain|remains|still)\s+(?:showing|displaying|listing)\b/i.test(before)) return false;
  const current = clause.text.search(CURRENT_SCOPE_MARKER);
  return current < 0 || current > before.length;
}

function isDeadlineActorOnly(doc, hit) {
  if (hit.entry.v !== 'team') return false;
  const clause = doc.clauses[hit.clauseIndex];
  if (!clause) return false;
  const after = clause.text.slice(hit.end - clause.start);
  return /^\s+has\s+(?:\w+\s+){0,4}(?:before|until|by)\b/i.test(after);
}

function scopeTemporal(doc, start) {
  const clause = doc.clauses.find((candidate) => start >= candidate.start && start < candidate.end);
  const text = clause?.text || '';
  if (isHistoricalOnlyHit(doc, start)) return 'historical';
  if (/\b(?:if|unless|planned|proposed|queued)\b/i.test(text)) return 'hypothetical';
  return 'current';
}

function isUnaffectedCount(doc, start, end) {
  const before = doc.text.slice(Math.max(0, start - 24), start);
  const after = doc.text.slice(end, end + 80);
  return /\b(?:other|remaining)\s*$/i.test(before) &&
    /\b(?:working|works|fine|normal|normally|unaffected|unimpacted)\b/i.test(after);
}

function isComparison(doc, start, end) {
  const before = doc.text.slice(Math.max(0, start - 48), start);
  if (COMPARISON_CONTEXT.test(before) || DESCRIPTOR_CONTEXT.test(before)) return true;
  if (/^\s+(?:and|but|while)\b/i.test(doc.text.slice(end, end + 24))) return false;
  return ROLE_SUFFIX.test(doc.text.slice(end, end + 40));
}

// "One teacher at North campus" identifies a person's location, not an
// affected campus.  Keep the individual scope unless the ticket says the
// campus itself is affected.
function isIndividualLocationDescriptor(doc, hit) {
  if (hit.entry.v !== 'one-school' || !/^at\s+.+\s+campus$/i.test(hit.quote)) return false;
  const clause = doc.clauses[hit.clauseIndex];
  const before = doc.text.slice(clause?.start || 0, hit.start);
  return /\b(?:one|a)\s+(?:teacher|tutor|coordinator|staff member|student|employee|parent|guardian|user)\s*$/i.test(before);
}

function isUnaffectedComparison(doc, end) {
  return UNAFFECTED_COMPARISON_SUFFIX.test(doc.text.slice(end, end + 80));
}

/**
 * @returns {{
 *   scope: string, label: string, explicit: boolean, allUsers: boolean,
 *   candidates: Array, evidence: Array
 * }}
 */
export function extractScopeEvidence(doc, ledger = createEvidenceLedger(doc)) {
  const candidates = [];
  const addCandidate = (candidate) => {
    const fact = ledger.addFromHit({
      type: 'scope', value: candidate.scope, quote: candidate.quote,
      hit: candidate.hit, start: candidate.start, end: candidate.end,
      clauseIndex: candidate.clauseIndex, authority: candidate.authority,
      temporal: candidate.temporal, role: candidate.role || 'primary'
    });
    candidates.push({ ...candidate, fact });
  };

  for (const hit of scanPositive(doc, SCOPE_PHRASES)) {
    if (isComparison(doc, hit.start, hit.end)) {
      ledger.addFromHit({ type: 'scope', value: hit.entry.v, hit, role: 'comparator' });
      continue;
    }
    if (isIndividualLocationDescriptor(doc, hit)) continue;
    if (isValueNotPopulation(doc, hit.quote, hit.start, hit.end)) continue;
    if (isDeadlineActorOnly(doc, hit)) {
      ledger.addFromHit({ type: 'scope', value: hit.entry.v, hit, role: 'observation' });
      continue;
    }

    if (isUnaffectedComparison(doc, hit.end)) {
      addCandidate({
        scope: 'individual',
        rank: scopeDefinition('individual').rank,
        weight: 3,
        quote: hit.quote + ' else',
        meaning: 'everyone except the requester is unaffected',
        hit, temporal: scopeTemporal(doc, hit.start)
      });
      continue;
    }

    addCandidate({
      scope: hit.entry.v,
      rank: scopeDefinition(hit.entry.v).rank,
      weight: hit.entry.w || 1,
      quote: hit.quote,
      meaning: hit.entry.label,
      hit, temporal: scopeTemporal(doc, hit.start)
    });
  }

  let m;
  PEOPLE_COUNT.lastIndex = 0;
  while ((m = PEOPLE_COUNT.exec(doc.text)) !== null) {
    const count = parseInt(m[1], 10);
    if (!Number.isFinite(count) || count === 0) continue;
    if (isUnaffectedCount(doc, m.index, m.index + m[0].length)) continue;
    const scope = scopeForPeople(count);
    addCandidate({
      scope,
      rank: scopeDefinition(scope).rank,
      weight: 3,
      quote: m[0],
      meaning: count + ' ' + m[2] + ' affected',
      start: m.index, end: m.index + m[0].length, clauseIndex: clauseIndexOf(doc, m.index), temporal: scopeTemporal(doc, m.index)
    });
  }

  PEOPLE_WORD_COUNT.lastIndex = 0;
  while ((m = PEOPLE_WORD_COUNT.exec(doc.text)) !== null) {
    const count = WRITTEN_NUMBER_VALUES.get(m[1]);
    if (!count || isUnaffectedCount(doc, m.index, m.index + m[0].length)) continue;
    const scope = scopeForPeople(count);
    addCandidate({
      scope,
      rank: scopeDefinition(scope).rank,
      weight: 3,
      quote: m[0],
      meaning: count + ' ' + m[2] + ' affected',
      start: m.index, end: m.index + m[0].length, clauseIndex: clauseIndexOf(doc, m.index), temporal: scopeTemporal(doc, m.index)
    });
  }

  BATCH_RECORD_COUNT.lastIndex = 0;
  while ((m = BATCH_RECORD_COUNT.exec(doc.text)) !== null) {
    const count = /^\d+$/.test(m[1]) ? parseInt(m[1], 10) : WRITTEN_NUMBER_VALUES.get(m[1]);
    if (!count || isUnaffectedCount(doc, m.index, m.index + m[0].length)) continue;
    addCandidate({
      scope: 'cohort',
      rank: scopeDefinition('cohort').rank,
      weight: 3,
      quote: m[0],
      meaning: count + ' records affected as a batch',
      start: m.index, end: m.index + m[0].length, clauseIndex: clauseIndexOf(doc, m.index), temporal: scopeTemporal(doc, m.index)
    });
  }

  SCHOOL_COUNT.lastIndex = 0;
  while ((m = SCHOOL_COUNT.exec(doc.text)) !== null) {
    const count = parseInt(m[1], 10);
    if (!Number.isFinite(count) || count === 0) continue;
    const scope = scopeForSchools(count);
    addCandidate({
      scope,
      rank: scopeDefinition(scope).rank,
      weight: 3,
      quote: m[0],
      meaning: count + ' schools affected',
      start: m.index, end: m.index + m[0].length, clauseIndex: clauseIndexOf(doc, m.index), temporal: scopeTemporal(doc, m.index)
    });
  }

  return { ledger, candidates, allUsersHits: scanPositive(doc, ALL_USERS_PHRASES) };
}

/** Project I1 from current, positive, primary clause evidence. */
export function projectScope(extraction) {
  const candidates = extraction.candidates.filter(({ fact }) =>
    fact.temporal === 'current' && fact.polarity === 'positive' &&
    fact.context === 'primary' && fact.role === 'primary'
  );
  // The broadest credible current scope wins; history and comparators are
  // preserved in the ledger but cannot expand the current affected population.
  let chosen = null;
  for (const candidate of candidates) {
    if (!chosen || candidate.rank > chosen.rank ||
        (candidate.rank === chosen.rank && candidate.weight > chosen.weight)) {
      chosen = candidate;
    }
  }

  const allUsersHits = extraction.allUsersHits;
  const scope = chosen ? chosen.scope : 'unknown';

  const evidence = [];
  if (chosen) {
    evidence.push({ quote: chosen.quote, meaning: chosen.meaning, source: 'scope' });
  }
  for (const hit of allUsersHits) {
    evidence.push({ quote: hit.quote, meaning: hit.entry.label, source: 'scope' });
  }

  return {
    scope,
    label: scopeLabel(scope),
    explicit: Boolean(chosen),
    allUsers: allUsersHits.length > 0,
    candidates,
    evidence
  };
}

export function detectScope(doc, ledger) {
  return projectScope(extractScopeEvidence(doc, ledger));
}

/** Exported for the test suite. */
export const _internal = { scopeForPeople, scopeForSchools, scan };
