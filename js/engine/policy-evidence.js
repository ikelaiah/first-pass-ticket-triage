/**
 * Adapter from detector results to the policy layer's evidence shape.
 *
 * The policy layer never inspects ticket text; this module reduces the
 * structured results to exactly the fields the safety calibration reads.
 */
/** @returns {object} the evidence object `applyTriagePolicy` expects */
export function policyEvidence(context) {
  const {
    risks,
    modifiers,
    symptom,
    deadlineResult,
    scopeResult,
    workaroundResult,
    activeIncident,
    decisionContext,
    inScope,
    driver,
    harmTiming,
    recoverability,
    containment,
    urgencyResult,
    blockedProcess,
    systemResult,
    failureFloor
  } = context;
  return {
    risks,
    modifiers,
    symptom: { ...symptom, id: symptom.symptom },
    deadline: deadlineResult.deadline,
    deadlineCommitted: deadlineResult.committed,
    deadlineDriver: driver?.driver || 'unknown',
    lowUrgencySignal: Boolean(urgencyResult?.lowUrgencySignal),
    scope: scopeResult.scope,
    consequence: blockedProcess?.level || 'unknown',
    workaround: workaroundResult.workaround,
    workaroundCost: workaroundResult.costPerDay,
    decisionContext: decisionContext.status,
    activeIncident: Boolean(activeIncident),
    inScope,
    harmTiming: harmTiming?.timing || 'unknown',
    recoverability: recoverability?.value || 'unknown',
    containment: containment || {},
    failureFloor: failureFloor || systemResult?.failureFloor || null
  };
}

export default policyEvidence;
