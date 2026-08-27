/**
 * Confidence scoring.
 *
 * Confidence describes how much of the *decision-relevant* information the
 * ticket actually contained. A tool that is confidently wrong is worse than a
 * tool that says "I need three more facts".
 */
import { scanPositive } from './negation.js';
import { CONSEQUENCE_PHRASES, CONTEXT_ELSEWHERE_PHRASES } from '../data/phrases.js';

export const BANDS = [
  { id: 'high', label: 'High', min: 75 },
  { id: 'medium', label: 'Medium', min: 50 },
  { id: 'low', label: 'Low', min: 0 }
];

export function bandFor(score) {
  return BANDS.find((b) => score >= b.min) || BANDS[BANDS.length - 1];
}

/**
 * @param {object} doc
 * @param {object} ctx  detector results plus impact/urgency assessments
 * @returns {{ confidence, band, label, positives, negatives, conflicts }}
 */
export function assessConfidence(doc, ctx) {
  const {
    scopeResult, deadlineResult, workaroundResult, symptom,
    systemResult, impactResult, urgencyResult, overridesApplied, isQuestion
  } = ctx;

  let score = 55;
  const positives = [];
  const negatives = [];
  const conflicts = [];

  const credit = (value, message) => {
    score += value;
    (value >= 0 ? positives : negatives).push(message);
  };

  // Scope, deadline and workaround decide an *incident*. A question with no
  // failure behind it does not depend on them, so their absence is not
  // uncertainty - and "this is a question, so it is P4" is a confident call.
  if (isQuestion) {
    credit(20, 'A question with no stated consequence does not depend on scope, ' +
      'deadline or workaround');
  } else {
    if (scopeResult.explicit) credit(12, 'Scope is stated (' + scopeResult.label + ')');
    else if (scopeResult.allUsers) credit(4, 'Wording implies all users of the system are affected');
    else credit(-8, 'Scope was not stated');

    if (deadlineResult.deadline === 'unknown') credit(-8, 'No deadline or business consequence was given');
    else if (deadlineResult.committed) credit(14, 'A business deadline is stated');
    else credit(7, 'A time reference was found, but not stated as a deadline');

    if (workaroundResult.workaround === 'unknown') credit(-5, 'Workaround availability is unknown');
    else credit(10, 'Workaround availability is stated (' + workaroundResult.label + ')');
  }

  if (symptom.severity > 0) credit(8, 'A technical symptom is identifiable (' + symptom.label + ')');
  else if (!isQuestion) credit(-5, 'No clear technical symptom was described');

  if (systemResult.primary) credit(6, 'The affected system is named (' + systemResult.primary.name + ')');
  else credit(-4, 'No system or application was named');

  if (scanPositive(doc, CONSEQUENCE_PHRASES).length) {
    credit(6, 'The business consequence is described');
  }

  if (urgencyResult.claimedOnly) {
    credit(-14, 'Urgency was asserted without a stated consequence');
  }

  if (scanPositive(doc, CONTEXT_ELSEWHERE_PHRASES).length) {
    credit(-10, 'The request refers to a conversation that is not in the ticket');
  }

  if (doc.wordCount > 0 && doc.wordCount < 8) {
    credit(-10, 'The request is very short');
  }

  if (overridesApplied) {
    credit(10, 'A human has confirmed some of the inputs');
  }

  // --- conflicting signals ---------------------------------------------
  if (urgencyResult.claimed && workaroundResult.workaround === 'yes') {
    conflicts.push('Urgency was asserted, but a workaround was also described.');
  }
  if (impactResult.impact === 'high' && deadlineResult.deadline === 'unknown') {
    conflicts.push('The impact appears significant, but no deadline or consequence was given.');
  }
  if (
    urgencyResult.contributions.some((c) => c.value <= -1) &&
    ['now', 'today'].includes(deadlineResult.deadline)
  ) {
    conflicts.push('The request contains both "this can wait" and "needed today" wording.');
  }
  if (!scopeResult.explicit && symptom.severity === 0 && !isQuestion) {
    conflicts.push('Neither the scope nor a technical symptom could be identified.');
  }
  score -= conflicts.length * 8;
  for (const conflict of conflicts) negatives.push(conflict);

  const confidence = Math.max(20, Math.min(95, Math.round(score)));
  const band = bandFor(confidence);

  return {
    confidence,
    band: band.id,
    label: band.label,
    positives,
    negatives,
    conflicts
  };
}
