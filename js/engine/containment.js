/**
 * Containment detection — I4: is the fault contained, or spreading/recurring/unknown?
 *
 * Propagating/recurring/undetected already raise impact in impact.js; this module
 * adds the positive "contained" signal so the 8-question panel can show
 * "appears contained" vs "no evidence of spreading" vs active spreading.
 */
import { scanPositive } from './negation.js';
import { CONTAINED_PHRASES, RECURRENCE_PHRASES, UNDETECTED_PHRASES } from '../data/phrases.js';
import { RISK_MODIFIERS } from '../data/phrases.js';
import { isNegated } from './negation.js';

function hasModifier(doc, patterns) {
  for (const p of patterns) {
    const re = new RegExp(p.source, p.flags.includes('g') ? p.flags : p.flags + 'g');
    let m;
    while ((m = re.exec(doc.text)) !== null) {
      if (!m[0]) { re.lastIndex += 1; continue; }
      if (!isNegated(doc, m.index, m.index + m[0].length)) return { quote: m[0].trim() };
    }
  }
  return null;
}

// A phrase such as "does not show that data is spreading" is an evidence
// limitation, not a claim that the data is contained. Keep the answer unknown
// until the ticket states an affirmative containment fact.
function propagationIsUnasserted(doc) {
  return /\b(?:does not|doesn't|cannot|can not|not clear|cannot confirm|can not confirm|no evidence)\b[^.;!?]{0,70}\b(?:spread|spreading|propagat)/i.test(doc.text);
}

export function detectContainment(doc, risks = {}) {
  const containedHit = scanPositive(doc, CONTAINED_PHRASES);
  const recurringHit = scanPositive(doc, RECURRENCE_PHRASES);
  const undetectedHit = scanPositive(doc, UNDETECTED_PHRASES);
  const propagatingHit = propagationIsUnasserted(doc)
    ? null
    : hasModifier(doc, RISK_MODIFIERS.propagating);

  const propagating = Boolean(propagatingHit && risks.dataIntegrity);
  const rawPropagating = Boolean(propagatingHit);

  return {
    contained: containedHit.length > 0 && !propagating && recurringHit.length === 0,
    containedEvidence: containedHit[0] || null,
    propagating,
    propagatingEvidence: propagatingHit,
    rawPropagating,
    recurring: recurringHit.length > 0,
    recurringEvidence: recurringHit[0] || null,
    undetected: undetectedHit.length > 0,
    undetectedEvidence: undetectedHit[0] || null,
    summary: containedHit.length > 0 && !propagating
      ? 'appears contained'
      : propagating
        ? 'appears to be spreading'
        : recurringHit.length > 0
          ? 'recurring — pattern, not single instance'
          : undetectedHit.length > 0
            ? 'unknown extent — more may exist unreported'
            : 'no evidence of spreading'
  };
}
