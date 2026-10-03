/**
 * Adapter from the analysis result to the Safe Next Action contract.
 *
 * Safe Next Action consumes structured evidence only. This module packages the
 * already-extracted facts with their provenance; it never re-reads the ticket
 * and never influences Impact, Urgency or the priority.
 */
import { RISK_KEYS } from './risks.js';

/** @returns {object} the structured evidence `recommendNextAction` expects */
export function nextActionEvidence(context) {
  const {
    assessmentStatus,
    workTypeResult,
    blockedProcess,
    deadlineResult,
    workaroundResult,
    containment,
    harmTiming,
    symptom,
    risks,
    modifiers,
    urgencyResult,
    applied,
    decisionContext
  } = context;
  const selected = (value, authority) => ({ value, authority });
  const riskAuthority = (key) =>
    applied.risks && Object.prototype.hasOwnProperty.call(applied.risks, key)
      ? 'analyst-confirmed'
      : risks[key]
        ? 'explicit'
        : 'unknown';
  const events = [];
  const harmAuthority = harmTiming.timing === 'active' ? 'explicit' : 'inferred';
  if (modifiers.exposureActive)
    events.push({ kind: 'active-exposure', authority: harmAuthority, temporal: 'current' });
  if (modifiers.propagating)
    events.push({
      kind: 'propagation',
      authority: applied.contained === 'spreading' ? 'analyst-confirmed' : 'explicit',
      temporal: 'current'
    });
  if (modifiers.immediateSafeguarding)
    events.push({
      kind: 'safeguarding-consequence',
      authority: harmAuthority,
      temporal: 'current'
    });
  if (risks.safety && harmTiming.timing === 'active')
    events.push({ kind: 'safety-consequence', authority: harmAuthority, temporal: 'current' });
  if (modifiers.unpaidRisk && harmTiming.timing === 'active')
    events.push({
      kind: 'material-financial-consequence',
      authority: harmAuthority,
      temporal: 'current'
    });
  return {
    assessmentStatus,
    workType: workTypeResult.workType,
    businessConsequence: selected(
      blockedProcess?.level || 'unknown',
      applied.consequence
        ? 'analyst-confirmed'
        : blockedProcess?.source === 'explicit'
          ? 'explicit'
          : 'inferred'
    ),
    deadline: selected(
      deadlineResult.deadline,
      applied.deadline ? 'analyst-confirmed' : deadlineResult.committed ? 'explicit' : 'unknown'
    ),
    deadlineRelationship:
      deadlineResult.deadline !== 'unknown' &&
      deadlineResult.deadline !== 'none' &&
      !deadlineResult.committed
        ? 'unknown'
        : 'known',
    workaround: selected(
      workaroundResult.workaround,
      applied.workaround ? 'analyst-confirmed' : 'explicit'
    ),
    containment: selected(
      containment.propagating ? 'spreading' : containment.contained ? 'contained' : 'unknown',
      'explicit'
    ),
    harm: selected(
      harmTiming.timing,
      harmTiming.source === 'manual' ? 'analyst-confirmed' : 'explicit'
    ),
    currentFailure: selected(
      Boolean(symptom.hasFailure),
      symptom.hasFailure ? 'explicit' : 'unknown'
    ),
    risks: Object.fromEntries(
      RISK_KEYS.map((key) => [key, selected(Boolean(risks[key]), riskAuthority(key))])
    ),
    events,
    verification: null,
    canWait: Boolean(urgencyResult.lowUrgencySignal),
    temporalState: decisionContext.status === 'resolved' ? 'resolved' : 'current'
  };
}

export default nextActionEvidence;
