/**
 * Impact assessment - how much the organisation is affected.
 *
 * Impact is scored from weighted evidence rather than looked up from keywords,
 * because the same words mean different things in different tickets. Scope is
 * the largest single contributor, but it is never the only one: one person
 * about to miss today's pay is not a Low impact ticket.
 */
import { scanPositive } from './negation.js';
import {
  IMPACT_HIGH_PHRASES,
  IMPACT_LOW_PHRASES,
  SERIOUS_CONSEQUENCE_PHRASES,
  BLOCKED_PHRASES,
  ESCALATION_PHRASES,
  RECURRENCE_PHRASES,
  UNDETECTED_PHRASES,
  CONTAINED_PHRASES
} from '../data/phrases.js';
import { scopeDefinition } from './scope.js';
import { SEVERITY } from './symptom.js';

export const IMPACT_LEVELS = ['low', 'medium', 'high'];
export const IMPACT_THRESHOLDS = { high: 3.5, medium: 1.75 };
export const IMPACT_RANGE = { min: 0, max: 6 };

/** Impact contribution of a symptom, by severity. */
const SEVERITY_IMPACT = new Map([
  [SEVERITY.OUTAGE, 0.75],
  [SEVERITY.SEVERE, 0.6],
  [SEVERITY.FAILURE, 0.75],
  [SEVERITY.DATA, 0.5],
  [SEVERITY.DEGRADED, 0.3],
  [SEVERITY.COSMETIC, -0.5],
  [SEVERITY.NONE, 0]
]);

export function impactLevelFromScore(score) {
  if (score >= IMPACT_THRESHOLDS.high) return 'high';
  if (score >= IMPACT_THRESHOLDS.medium) return 'medium';
  return 'low';
}

/**
 * @param {object} doc
 * @param {object} ctx { scopeResult, symptom, riskResult, deadlineResult, systemResult, consequence }
 * @returns {{ impact, score, contributions, seriousConsequence }}
 */
export function assessImpact(doc, ctx) {
  const { scopeResult, symptom, riskResult, deadlineResult, systemResult, consequence } = ctx;
  const risks = riskResult.risks;
  const modifiers = riskResult.modifiers;
  const scopeDef = scopeDefinition(scopeResult.scope);
  const contributions = [];

  const add = (value, label, quote) => {
    if (!value) return;
    contributions.push({ value: Math.round(value * 100) / 100, label, quote });
  };

  // --- scope -----------------------------------------------------------
  add(
    scopeDef.impactWeight,
    scopeResult.explicit
      ? 'Scope: ' + scopeResult.label
      : 'Scope not stated - treated as a single unresolved area',
    scopeResult.evidence[0] ? scopeResult.evidence[0].quote : undefined
  );

  if (scopeResult.allUsers && !scopeResult.explicit) {
    add(1.75, 'Every user of the affected system appears to be affected');
  }
  if (modifiers.systemicJobs) {
    add(1.5, 'System-wide processing has stopped');
  }

  // --- technical symptom ----------------------------------------------
  if (symptom.severity) {
    add(
      SEVERITY_IMPACT.get(symptom.severity) || 0,
      'Symptom: ' + symptom.label,
      symptom.evidence[0] ? symptom.evidence[0].quote : undefined
    );
  }

  const blocked = scanPositive(doc, BLOCKED_PHRASES);
  if (blocked.length) {
    add(0.75, 'A business process is blocked', blocked[0].quote);
  }
  if (!blocked.length && consequence?.level === 'blocked' && consequence.source !== 'inferred') {
    add(0.75, 'Business process is blocked', consequence.quote);
  } else if (consequence?.level === 'impaired' && consequence.source !== 'inferred') {
    add(0.25, 'Business process is impaired', consequence.quote);
  }

  // A fault that repeats has a larger cumulative reach than the instance in
  // front of you, and one the requester says they cannot always spot has a
  // reach nobody knows.
  const recurrence = scanPositive(doc, RECURRENCE_PHRASES);
  if (recurrence.length) {
    add(recurrence[0].entry.w, recurrence[0].entry.label, recurrence[0].quote);
  }
  const undetected = scanPositive(doc, UNDETECTED_PHRASES);
  if (undetected.length) {
    add(undetected[0].entry.w, undetected[0].entry.label, undetected[0].quote);
  }

  // Contained vs spreading — contained does not reduce impact (still a fault)
  // but is recorded for the 8-question panel; spreading already +1.5 via propagating.
  const contained = scanPositive(doc, CONTAINED_PHRASES);
  if (contained.length) {
    // No numeric change — containment is informational, not a discount.
    // The panel shows "appears contained" and missing-info avoids asking about spread.
  }

  // Deletion and lost backups are about *recoverability*, which the ordinary
  // severity table does not capture: the work may simply be gone.
  if (symptom.symptom === 'data-loss') {
    add(1, 'Data has been deleted and may not be recoverable');
  }
  if (symptom.symptom === 'backup-failed') {
    add(
      systemResult.criticalSystem ? 2 : 1,
      systemResult.criticalSystem
        ? 'A business-critical system currently has no reliable backup'
        : 'The ability to recover from a further failure is reduced'
    );
  }

  // --- critical business risks ----------------------------------------
  // Payroll and payments are correlated: "pay run" trips both dictionaries.
  // Counting them at full weight twice turns every payroll correction into a
  // High impact ticket, which the framework explicitly says it is not. The
  // escalation for payroll comes from the modifiers below, not from the noun.
  if (risks.payroll) add(0.75, 'Payroll is involved');
  if (modifiers.unpaidRisk) add(1, 'People may not be paid');
  if (risks.financial) add(risks.payroll ? 0.35 : 0.5, 'Payments or financial processing are involved');
  if (risks.privacy) add(0.75, 'Personal information is involved');
  if (risks.security) add(0.75, 'A security concern was raised');
  if (modifiers.exposureActive) add(1.5, 'Information appears to be actively exposed');
  if (risks.safety) add(1, 'The safety of students or staff is involved');
  if (risks.safeguarding) add(1, 'A safeguarding obligation is involved');
  if (modifiers.immediateSafeguarding) add(1.5, 'Immediate safeguarding concern');
  if (risks.compliance) add(0.5, 'A compliance obligation is involved');
  if (risks.dataIntegrity) {
    // "incorrect totals" already counted once as the symptom; the risk flag
    // adds the business dimension, not a second copy of the same evidence.
    const alreadyCounted = ['incorrect-data', 'duplicate-data', 'corrupt-data', 'unstable-data']
      .includes(symptom.symptom);
    add(alreadyCounted ? 0.5 : 0.75, 'Data integrity is in question');
  }
  if (modifiers.propagating) add(1.5, 'Incorrect data appears to be spreading');
  if (modifiers.decisionRisk) add(1, 'Decisions may be made on incorrect information');

  // A shared integration matters most when more than one school depends on it.
  const sharedScope =
    scopeDef.rank >= scopeDefinition('multiple-schools').rank ||
    scopeResult.allUsers ||
    modifiers.systemicJobs;
  if (risks.criticalIntegration && sharedScope) {
    add(0.75, 'A shared integration or pipeline is affected');
  }

  // --- explicit wording ------------------------------------------------
  let highBonus = 0;
  for (const hit of scanPositive(doc, IMPACT_HIGH_PHRASES)) {
    if (highBonus >= 2) break;
    const value = Math.min(hit.entry.w, 2 - highBonus);
    highBonus += value;
    add(value, hit.entry.label, hit.quote);
  }

  let lowPenalty = 0;
  for (const hit of scanPositive(doc, IMPACT_LOW_PHRASES)) {
    if (lowPenalty <= -2) break;
    const value = Math.max(hit.entry.w, -2 - lowPenalty);
    lowPenalty += value;
    add(value, hit.entry.label, hit.quote);
  }

  if (systemResult.criticalSystem && symptom.hasFailure) {
    add(0.25, 'A business-critical system is affected');
  }

  // Escalation is deliberately NOT scored. The TASC guide is explicit:
  // "Requester seniority does not determine priority." Who asked tells you who
  // cares, not what breaks. It is reported as context in the reasoning instead.

  // --- one person, serious consequence ---------------------------------
  const smallScope = ['individual', 'few-users'].includes(scopeResult.scope);
  const urgentDeadline = ['now', 'today'].includes(deadlineResult.deadline);
  const serious = scanPositive(doc, SERIOUS_CONSEQUENCE_PHRASES);
  const seriousConsequence = smallScope && urgentDeadline && serious.length > 0;
  if (seriousConsequence) {
    add(1.75, 'A serious consequence for the individual is imminent', serious[0].quote);
  }

  const raw = contributions.reduce((sum, c) => sum + c.value, 0);
  const score = Math.max(IMPACT_RANGE.min, Math.min(IMPACT_RANGE.max, raw));

  return {
    impact: impactLevelFromScore(score),
    score: Math.round(score * 100) / 100,
    rawScore: Math.round(raw * 100) / 100,
    contributions,
    seriousConsequence,
    blocked: blocked.length > 0
  };
}
