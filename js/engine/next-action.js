/**
 * Safe Next Action policy.
 *
 * This module is deliberately separate from Impact, Urgency and the priority
 * matrix. It accepts structured evidence only and returns an advisory next
 * step; it has no imports from the triage scoring path.
 */

export const NEXT_ACTIONS = Object.freeze([
  'clarify', 'verify', 'investigate', 'contain', 'escalate', 'plan'
]);

const CONSEQUENTIAL_AUTHORITIES = new Set(['explicit', 'analyst-confirmed']);

function detail(value, fallback = 'unknown') {
  if (value && typeof value === 'object' && 'value' in value) return value;
  return { value: value === undefined ? fallback : value, authority: 'unknown' };
}

function supported(value) {
  return CONSEQUENTIAL_AUTHORITIES.has(detail(value).authority);
}

function current(event) {
  return event && event.temporal === 'current' &&
    CONSEQUENTIAL_AUTHORITIES.has(event.authority);
}

function risk(input, key) {
  const item = detail(input.risks?.[key], false);
  return item.value === true && supported(item);
}

function event(input, kinds) {
  return (input.events || []).find((item) => kinds.includes(item.kind));
}

function result(action, ruleId, reason, evidenceUsed = [], blockers = [], questions = []) {
  return Object.freeze({
    action,
    ruleId,
    reasonId: ruleId,
    reason,
    evidenceUsed,
    blockers,
    clarificationQuestions: questions,
    provenance: evidenceUsed.map((item) => item.authority || 'unknown')
  });
}

function clarify(ruleId, blocker, question, evidence = []) {
  return result('clarify', ruleId,
    'There is not yet enough defensible evidence to recommend intervention safely.',
    evidence, [blocker], [question]);
}

/**
 * Recommend the safest useful next action from already-structured evidence.
 * Inferred evidence is explanatory only: it can require clarification, but it
 * cannot justify Contain or Escalate.
 */
export function recommendNextAction(input = {}) {
  if (input.assessmentStatus !== 'assessed') {
    return clarify('NA-CLARIFY-UNASSESSED', 'The input has not been assessed as a support request.',
      'What system, service, or support outcome needs assessment?');
  }

  const consequence = detail(input.businessConsequence);
  const deadline = detail(input.deadline);
  const workaround = detail(input.workaround);
  const containment = detail(input.containment);
  const harm = detail(input.harm);
  const failure = detail(input.currentFailure, false);
  const exposure = event(input, ['active-exposure', 'unauthorised-access']);
  const propagation = event(input, ['propagation']);
  const consequentialEvent = event(input, [
    'active-exposure', 'unauthorised-access', 'propagation',
    'safeguarding-consequence', 'safety-consequence',
    'serious-security-consequence', 'serious-compliance-consequence',
    'material-financial-consequence'
  ]);

  // Established non-immediate work does not need incident facts before it can
  // be planned. This deliberately precedes the incident uncertainty gates.
  if (input.workType === 'feature' || input.workType === 'documentation' || input.canWait === true) {
    return result('plan', 'NA-PLAN-NONIMMEDIATE',
      'The request describes established, non-immediate work that can be planned.', [], [], []);
  }

  if (input.temporalState === 'ambiguous' || (harm.value === 'pending' && input.temporalState !== 'current')) {
    return clarify('NA-CLARIFY-HARM-TIMING', 'It is unclear whether harm is current, historical, or only possible.',
      'Is harm occurring now, already resolved, or only a future possibility?');
  }
  if (input.verification === 'source' || input.verification === 'configuration') {
    return result('verify', 'NA-VERIFY-SOURCE',
      'Check the authoritative source or current configuration before intervening.');
  }
  if (input.verification === 'scope') {
    return result('verify', 'NA-VERIFY-SCOPE',
      'Verify the affected population from an authoritative current source before intervening.');
  }
  if (failure.value !== true && !consequentialEvent) {
    return result('plan', 'NA-PLAN-NONIMMEDIATE',
      'No current operational failure is established, so this non-immediate work can be planned.');
  }

  if (consequence.value === 'unknown') {
    return clarify('NA-CLARIFY-CONSEQUENCE', 'The business consequence is unknown.',
      'What business operation is blocked or impaired?');
  }
  if (deadline.value !== 'unknown' && deadline.value !== 'none' && input.deadlineRelationship === 'unknown') {
    return clarify('NA-CLARIFY-DEADLINE', 'The stated date is not yet linked to a required-by relationship.',
      'Is that date a required-by deadline, and what happens if it is missed?');
  }
  if (workaround.value === 'unknown') {
    return clarify('NA-CLARIFY-WORKAROUND', 'Whether a usable workaround exists is unknown.',
      'Can the same business operation still be completed, and at what practical cost?');
  }
  if ((exposure || propagation) && containment.value === 'unknown') {
    return clarify('NA-CLARIFY-CONTAINMENT', 'The extent or containment of the reported harm is unknown.',
      'Is the issue still occurring or spreading, and what population may be affected?');
  }
  if (input.composition === 'unknown') {
    return clarify('NA-CLARIFY-COMPOSITION', 'The relationship between material facts cannot be established safely.',
      'Do these facts describe the same current incident and affected operation?');
  }
  if (consequentialEvent && !current(consequentialEvent)) {
    return clarify('NA-CLARIFY-AUTHORITY', 'Consequential evidence is inferred or is not current.',
      'Can an analyst confirm the current condition and its extent?');
  }
  if (risk(input, 'privacy') === false && exposure?.authority === 'inferred') {
    return clarify('NA-CLARIFY-AUTHORITY', 'Privacy exposure is inferred rather than confirmed.',
      'Can an analyst confirm whether information is currently exposed?');
  }

  const safeguarding = event(input, ['safeguarding-consequence']);
  const safety = event(input, ['safety-consequence']);
  const seriousSecurity = event(input, ['serious-security-consequence']);
  const seriousCompliance = event(input, ['serious-compliance-consequence']);
  const materialFinancial = event(input, ['material-financial-consequence']);
  if ((current(safeguarding) && risk(input, 'safeguarding')) ||
      (current(safety) && risk(input, 'safety'))) {
    return result('escalate', 'NA-ESCALATE-SAFETY',
      'A current safety or safeguarding consequence is established and needs appropriate authority involvement.',
      [safeguarding || safety]);
  }
  if (current(seriousSecurity) && risk(input, 'security')) {
    return result('escalate', 'NA-ESCALATE-SECURITY',
      'A current serious security consequence is established and needs appropriate authority involvement.',
      [seriousSecurity]);
  }
  if (current(seriousCompliance) && risk(input, 'compliance')) {
    return result('escalate', 'NA-ESCALATE-COMPLIANCE',
      'A current serious compliance consequence is established and needs appropriate authority involvement.',
      [seriousCompliance]);
  }
  if (current(materialFinancial) && (risk(input, 'payroll') || risk(input, 'financial'))) {
    return result('escalate', 'NA-ESCALATE-FINANCIAL',
      'A current material payroll or payment consequence is established and needs appropriate authority involvement.',
      [materialFinancial]);
  }
  if (current(exposure) && (risk(input, 'privacy') || risk(input, 'security'))) {
    return result('contain', 'NA-CONTAIN-ACTIVE-EXPOSURE',
      'Prevent further exposure while the issue is investigated.', [exposure]);
  }
  if (current(propagation) && risk(input, 'dataIntegrity')) {
    return result('contain', 'NA-CONTAIN-PROPAGATION',
      'Limit further propagation while the issue is investigated.', [propagation]);
  }
  if (failure.value === true && supported(failure) && consequence.value !== 'unknown') {
    return result('investigate', 'NA-INVESTIGATE-CURRENT-FAILURE',
      'A current failure and affected business operation are established; begin diagnosis.',
      [failure, consequence]);
  }
  return clarify('NA-CLARIFY-CONSEQUENCE', 'The safest operational starting point is not established.',
    'What is currently happening, and what operation does it affect?');
}
