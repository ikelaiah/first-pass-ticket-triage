/**
 * Workaround detection.
 *
 * Negation flips the polarity: "we have a workaround" and "we do not have a
 * workaround" share the same keyword and must not share the same answer.
 */
import { clauseIndexOf, scan } from './negation.js';
import { createEvidenceLedger } from './evidence.js';
import { WORKAROUND_PHRASES, WORKAROUND_COST_PATTERNS } from '../data/phrases.js';

const LABELS = {
  yes: 'Yes',
  partial: 'Partial',
  no: 'No',
  unknown: 'Unknown'
};

export function workaroundLabel(id) {
  return LABELS[id] || LABELS.unknown;
}

/** A negated "workaround exists" claim becomes "no workaround", and vice versa. */
function flip(value) {
  if (value === 'yes') return 'no';
  if (value === 'no') return 'yes';
  return value;
}

function isUncertainClaim(doc, hit) {
  const clause = doc.clauses[hit.clauseIndex];
  if (!clause) return false;
  const before = doc.text.slice(clause.start, hit.start);
  const after = doc.text.slice(hit.end, clause.end);
  return /\b(?:whether|if|unsure|unknown|not established|does not say|do not know)\b/i.test(before) ||
    /\b(?:whether|if|unsure|unknown|not established|does not say|do not know)\b/i.test(after);
}

/**
 * @returns {{ workaround, label, evidence, votes }}
 */
export function extractWorkaroundEvidence(doc, ledger = createEvidenceLedger(doc)) {
  const costs = [];

  for (const hit of scan(doc, WORKAROUND_PHRASES)) {
    if (isUncertainClaim(doc, hit)) continue;
    const value = hit.negated ? flip(hit.entry.v) : hit.entry.v;
    if (!LABELS[value]) continue;
    // The normalized value is an affirmative claim about availability (or its
    // absence), even where the surface phrase used a negation.
    ledger.addFromHit({
      type: 'workaround', value, hit, polarity: 'positive',
      role: value === 'no' ? 'primary' : 'alternative-path'
    });
  }

  // Cost / sustainability: e.g. "3 registrars feeding all day", "2 hours per day"
  for (const re of WORKAROUND_COST_PATTERNS) {
    const m = doc.text.match(re);
    if (m) {
      const quote = m[0].trim();
      const start = m.index;
      const fact = ledger.add({
        type: 'workaround', value: 'yes', quote, start, end: start + quote.length,
        clauseIndex: clauseIndexOf(doc, start), role: 'alternative-path'
      });
      costs.push({
        fact,
        costPerDay: quote,
        sustainability: /per day|a day|each day|all day/i.test(quote) ? 'daily cost' : 'sustainability noted'
      });
      break;
    }
  }

  return { ledger, costs };
}

/** Project U7 from normalized, clause-level workaround evidence. */
export function projectWorkaround(extraction) {
  const facts = extraction.ledger.byType('workaround').filter((fact) =>
    (fact.temporal === 'current' || fact.temporal === 'future') &&
    fact.polarity === 'positive' &&
    fact.context === 'primary' &&
    fact.role !== 'comparator'
  );
  const votes = { yes: 0, partial: 0, no: 0 };
  for (const fact of facts) votes[fact.value] += 1;

  let workaround = 'unknown';
  if (votes.no > 0) workaround = 'no';
  else if (votes.partial > 0) workaround = 'partial';
  else if (votes.yes > 0) workaround = 'yes';

  const cost = extraction.costs.find((item) => facts.includes(item.fact));
  return {
    workaround,
    label: workaroundLabel(workaround),
    votes,
    costPerDay: cost?.costPerDay || null,
    sustainability: cost?.sustainability || null,
    evidence: facts
      .filter((fact) => fact.value === workaround)
      .map((fact) => ({ quote: fact.quote, meaning: LABELS[fact.value], source: 'workaround', value: fact.value }))
  };
}

export function detectWorkaround(doc, ledger) {
  return projectWorkaround(extractWorkaroundEvidence(doc, ledger));
}
