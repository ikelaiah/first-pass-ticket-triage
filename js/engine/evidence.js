/*
 * Clause-level evidence ledger.
 *
 * Detectors normally know more than their final scalar result: where a fact
 * came from, whether the phrase was negated, and which clause said it. This
 * module preserves that information until a facet projection chooses what can
 * legitimately contribute to an answer. It deliberately contains no scoring
 * or priority policy.
 */

const HISTORICAL = /\b(?:yesterday|last\s+(?:term|week|month|year|night|monday|tuesday|wednesday|thursday|friday)|previous(?:ly)?|earlier|formerly|was|were)\b/i;
const RESOLVED = /\b(?:resolved|fixed|restored|recovered|working again|completed successfully|no longer at risk)\b/i;
const HYPOTHETICAL = /\b(?:if|unless|could|may|might|would|planned|proposed|queued|will)\b/i;

const VALID_AUTHORITY = new Set(['explicit', 'inferred', 'analyst-confirmed']);
const VALID_POLARITY = new Set(['positive', 'negated']);
const VALID_TEMPORAL = new Set(['current', 'historical', 'resolved', 'hypothetical']);
const VALID_CONTEXT = new Set(['primary', 'quoted']);
const VALID_ROLE = new Set(['primary', 'alternative-path', 'comparator', 'observation', 'requirement']);

function oneOf(value, values, fallback) {
  return values.has(value) ? value : fallback;
}

/** Classify a clause conservatively; callers can always provide a known value. */
export function temporalForClause(doc, clauseIndex) {
  const clause = Number.isInteger(clauseIndex) ? doc?.clauses?.[clauseIndex] : null;
  const text = clause?.text || '';
  if (RESOLVED.test(text) && !HYPOTHETICAL.test(text)) return 'resolved';
  if (HYPOTHETICAL.test(text)) return 'hypothetical';
  if (HISTORICAL.test(text) && !/\b(?:today|currently|right now|at present|still)\b/i.test(text)) {
    return 'historical';
  }
  return 'current';
}

/** Normalize a detector fact without discarding its local clause metadata. */
export function normaliseEvidenceFact(doc, fact = {}) {
  const hit = fact.hit || null;
  const clauseIndex = Number.isInteger(fact.clauseIndex)
    ? fact.clauseIndex
    : Number.isInteger(hit?.clauseIndex) ? hit.clauseIndex : null;
  const clause = clauseIndex === null ? null : doc?.clauses?.[clauseIndex] || null;
  const temporal = oneOf(fact.temporal, VALID_TEMPORAL, temporalForClause(doc, clauseIndex));
  const polarity = oneOf(fact.polarity, VALID_POLARITY, hit?.negated ? 'negated' : 'positive');

  return Object.freeze({
    type: String(fact.type || 'unknown'),
    value: fact.value === undefined || fact.value === null ? 'unknown' : String(fact.value),
    quote: String(fact.quote || hit?.quote || '').trim(),
    clauseIndex,
    clause: clause ? clause.text : null,
    start: Number.isInteger(fact.start) ? fact.start : Number.isInteger(hit?.start) ? hit.start : null,
    end: Number.isInteger(fact.end) ? fact.end : Number.isInteger(hit?.end) ? hit.end : null,
    authority: oneOf(fact.authority, VALID_AUTHORITY, 'explicit'),
    polarity,
    temporal,
    context: oneOf(fact.context, VALID_CONTEXT, 'primary'),
    role: oneOf(fact.role, VALID_ROLE, 'primary')
  });
}

/**
 * Create a deterministic, local-only evidence collection for one document.
 * The ledger does not decide a facet; `currentPrimary()` merely exposes the
 * facts that a future projector is allowed to consider for a current answer.
 */
export function createEvidenceLedger(doc) {
  const facts = [];

  function add(fact) {
    const normalised = normaliseEvidenceFact(doc, fact);
    facts.push(normalised);
    return normalised;
  }

  function addFromHit(fact) {
    return add(fact);
  }

  function all() {
    return facts.slice();
  }

  function byType(type) {
    return facts.filter((fact) => fact.type === type);
  }

  function currentPrimary(type) {
    return byType(type).filter((fact) =>
      fact.temporal === 'current' &&
      fact.polarity === 'positive' &&
      fact.context === 'primary' &&
      fact.role === 'primary'
    );
  }

  return Object.freeze({ add, addFromHit, all, byType, currentPrimary });
}

export default createEvidenceLedger;
