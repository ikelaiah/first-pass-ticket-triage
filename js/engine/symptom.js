/**
 * Symptom detection - *what* is happening technically.
 *
 * Severity is a property of the symptom, not of the priority: "slow" and
 * "unavailable" are different symptoms even when the ticket wording is
 * identical, and neither one decides a priority on its own.
 */
import { scan } from './negation.js';
import { SYMPTOMS } from '../data/phrases.js';

export const SEVERITY = {
  OUTAGE: 3,
  SEVERE: 2.5,
  FAILURE: 2,
  DATA: 1.5,
  DEGRADED: 1,
  COSMETIC: 0.5,
  NONE: 0
};

const BY_ID = new Map(SYMPTOMS.map((s) => [s.id, s]));

export function symptomLabel(id) {
  const s = BY_ID.get(id);
  return s ? s.label : 'Not identified';
}

/**
 * @returns {{
 *   symptom, label, severity, all, evidence,
 *   hasFailure, isOutage, isDataIssue, isDegraded, negatedSymptoms
 * }}
 */
export function detectSymptom(doc) {
  const hits = scan(doc, SYMPTOMS);
  const positive = hits.filter((h) => !h.negated);
  const negated = hits.filter((h) => h.negated);

  const seen = new Map();
  for (const hit of positive) {
    const id = hit.entry.id;
    if (!seen.has(id)) {
      seen.set(id, {
        id,
        label: hit.entry.label,
        severity: hit.entry.severity,
        quote: hit.quote,
        index: hit.start
      });
    }
  }

  const all = [...seen.values()].sort(
    (a, b) => b.severity - a.severity || a.index - b.index
  );
  const primary = all[0] || null;

  return {
    symptom: primary ? primary.id : 'unknown',
    label: primary ? primary.label : 'Not identified',
    severity: primary ? primary.severity : SEVERITY.NONE,
    all,
    hasFailure: all.some((s) => s.severity >= SEVERITY.FAILURE),
    isOutage: all.some((s) => s.severity >= SEVERITY.OUTAGE),
    isDataIssue: all.some((s) => s.severity === SEVERITY.DATA),
    isDegraded: Boolean(primary) && primary.severity <= SEVERITY.DEGRADED && primary.severity > 0,
    negatedSymptoms: negated.map((h) => ({ quote: h.quote, meaning: h.entry.label })),
    evidence: all.slice(0, 3).map((s) => ({
      quote: s.quote,
      meaning: s.label + ' detected',
      source: 'symptom'
    }))
  };
}
