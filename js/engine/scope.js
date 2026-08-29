/**
 * Scope detection - how many people, teams or schools are affected.
 *
 * Scope is deliberately allowed to stay "unknown". Inventing a scope is the
 * fastest way to produce a confident and wrong priority.
 */
import { scan, scanPositive } from './negation.js';
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
const PEOPLE_COUNT = /\b(\d{1,4})\s+(?:casual\s+|part[- ]time\s+|full[- ]time\s+|new\s+|additional\s+|affected\s+)?(staff|users|employees|teachers|students|people|parents|accounts|administrators|admins|registrar|registrars|timesheets|records|mailboxes|girls|boys|children|kids|pupils|applicants|enrolments|families|treaties)\b/g;

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
  '(staff|users|employees|teachers|students|people|parents|accounts|administrators|admins|registrar|registrars|timesheets|records|mailboxes|girls|boys|children|kids|pupils|applicants|enrolments|families|treaties)\\b', 'g'
);

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
  /\b(?:yesterday|last\s+(?:night|evening|week|month|monday|tuesday|wednesday|thursday|friday|saturday|sunday)|previous(?:ly)?|earlier|the day before)\b/i;
const CURRENT_SCOPE_MARKER =
  /\b(?:today|this\s+(?:morning|afternoon|evening)|currently|right now|at present|still)\b/i;

function isHistoricalOnlyHit(doc, start) {
  const clause = doc.clauses.find((candidate) => start >= candidate.start && start < candidate.end);
  if (!clause) return false;
  const before = clause.text.slice(0, start - clause.start);
  if (!HISTORICAL_SCOPE_MARKER.test(before)) return false;
  const current = clause.text.search(CURRENT_SCOPE_MARKER);
  return current < 0 || current > before.length;
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

function isUnaffectedComparison(doc, end) {
  return UNAFFECTED_COMPARISON_SUFFIX.test(doc.text.slice(end, end + 80));
}

/**
 * @returns {{
 *   scope: string, label: string, explicit: boolean, allUsers: boolean,
 *   candidates: Array, evidence: Array
 * }}
 */
export function detectScope(doc) {
  const candidates = [];

  for (const hit of scanPositive(doc, SCOPE_PHRASES)) {
    if (isComparison(doc, hit.start, hit.end)) continue;
    if (isHistoricalOnlyHit(doc, hit.start)) continue;
    if (isValueNotPopulation(doc, hit.quote, hit.start, hit.end)) continue;

    if (isUnaffectedComparison(doc, hit.end)) {
      candidates.push({
        scope: 'individual',
        rank: scopeDefinition('individual').rank,
        weight: 3,
        quote: hit.quote + ' else',
        meaning: 'everyone except the requester is unaffected'
      });
      continue;
    }

    candidates.push({
      scope: hit.entry.v,
      rank: scopeDefinition(hit.entry.v).rank,
      weight: hit.entry.w || 1,
      quote: hit.quote,
      meaning: hit.entry.label
    });
  }

  let m;
  PEOPLE_COUNT.lastIndex = 0;
  while ((m = PEOPLE_COUNT.exec(doc.text)) !== null) {
    const count = parseInt(m[1], 10);
    if (!Number.isFinite(count) || count === 0) continue;
    if (isHistoricalOnlyHit(doc, m.index) || isUnaffectedCount(doc, m.index, m.index + m[0].length)) continue;
    const scope = scopeForPeople(count);
    candidates.push({
      scope,
      rank: scopeDefinition(scope).rank,
      weight: 3,
      quote: m[0],
      meaning: count + ' ' + m[2] + ' affected'
    });
  }

  PEOPLE_WORD_COUNT.lastIndex = 0;
  while ((m = PEOPLE_WORD_COUNT.exec(doc.text)) !== null) {
    const count = WRITTEN_NUMBER_VALUES.get(m[1]);
    if (!count || isHistoricalOnlyHit(doc, m.index) || isUnaffectedCount(doc, m.index, m.index + m[0].length)) continue;
    const scope = scopeForPeople(count);
    candidates.push({
      scope,
      rank: scopeDefinition(scope).rank,
      weight: 3,
      quote: m[0],
      meaning: count + ' ' + m[2] + ' affected'
    });
  }

  SCHOOL_COUNT.lastIndex = 0;
  while ((m = SCHOOL_COUNT.exec(doc.text)) !== null) {
    const count = parseInt(m[1], 10);
    if (!Number.isFinite(count) || count === 0) continue;
    const scope = scopeForSchools(count);
    candidates.push({
      scope,
      rank: scopeDefinition(scope).rank,
      weight: 3,
      quote: m[0],
      meaning: count + ' schools affected'
    });
  }

  // The broadest credible scope wins: a ticket that mentions one student *and*
  // all schools is an all-schools ticket.
  let chosen = null;
  for (const candidate of candidates) {
    if (!chosen || candidate.rank > chosen.rank ||
        (candidate.rank === chosen.rank && candidate.weight > chosen.weight)) {
      chosen = candidate;
    }
  }

  const allUsersHits = scanPositive(doc, ALL_USERS_PHRASES);
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

/** Exported for the test suite. */
export const _internal = { scopeForPeople, scopeForSchools, scan };
