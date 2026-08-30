/**
 * v0.8.0 triage policy.
 *
 * This module consumes structured evidence and base Impact/Urgency levels. It
 * deliberately does not inspect ticket text: phrase matching belongs to the
 * semantic detectors, while this module records the organisation's policy
 * decision about already-extracted evidence.
 */
import { raiseLevel, lowerLevel, LEVEL_RANK } from './priority-matrix.js';

export const TRIAGE_POLICY_DECISIONS = Object.freeze([
  { id: 'workaround.full', impact: 'unchanged', urgency: 'reduce', rationale: 'Work can continue through the same business process.' },
  { id: 'workaround.partial', impact: 'unchanged', urgency: 'modest-reduction', rationale: 'Some business cost remains.' },
  { id: 'workaround.costly', impact: 'unchanged', urgency: 'minimum-medium', rationale: 'Material manual effort remains time-sensitive.' },
  { id: 'workaround.temporary', impact: 'unchanged', urgency: 'temporary-reduction', rationale: 'Temporary continuity is not resolution.' },
  { id: 'workaround.unknown', impact: 'unchanged', urgency: 'unchanged', rationale: 'Unknown is not no workaround.' },
  { id: 'deadline.hard-near', impact: 'unchanged', urgency: 'consequence-dependent', rationale: 'Proximity makes waiting consequential.' },
  { id: 'deadline.hard-future', impact: 'unchanged', urgency: 'minimum-medium', rationale: 'A committed statutory or operational event is time-sensitive.' },
  { id: 'deadline.soft', impact: 'unchanged', urgency: 'low-unless-independent-harm', rationale: 'A preference or explicit wait signal is not a hard cutoff.' },
  { id: 'deadline.timestamp', impact: 'unchanged', urgency: 'unchanged', rationale: 'A timestamp or historical date is not a required-by date.' },
  { id: 'context.unassessed', impact: 'lower', urgency: 'lower', rationale: 'Unrecognised input is not scored as an IT consequence.' },
  { id: 'context.expected-behaviour', impact: 'lower', urgency: 'lower', rationale: 'Expected scheduled behaviour is not a failure.' },
  { id: 'context.documentation', impact: 'lower', urgency: 'lower', rationale: 'A documentation request without a failure or deadline is backlog work.' },
  { id: 'context.active-incident', impact: 'raise', urgency: 'raise', rationale: 'Recovery work inherits the incident consequence.' },
  { id: 'harm.active', impact: 'raise', urgency: 'raise', rationale: 'Harm is occurring now.' },
  { id: 'harm.pending', impact: 'contextual', urgency: 'no-active-raise', rationale: 'Potential harm is not active harm.' },
  { id: 'harm.resolved', impact: 'current-context', urgency: 'no-active-raise', rationale: 'Resolved harm is not more urgent than active harm.' },
  { id: 'privacy.context', impact: 'unchanged', urgency: 'unchanged', rationale: 'Sensitive data context is not proof of exposure.' },
  { id: 'privacy.active', impact: 'high', urgency: 'high', rationale: 'Actual exposure is a current consequence.' },
  { id: 'security.active', impact: 'contextual', urgency: 'high', rationale: 'A compromised account requires rapid containment.' },
  { id: 'financial.topic', impact: 'unchanged', urgency: 'unchanged', rationale: 'Payroll/payment vocabulary alone does not prove harm.' },
  { id: 'financial.confirmed', impact: 'contextual-to-high', urgency: 'evidence-dependent', rationale: 'Confirmed financial consequence controls severity.' },
  { id: 'loss.recoverable', impact: 'contextual', urgency: 'restoration-dependent', rationale: 'A usable recovery path reduces irreversibility but not time pressure.' },
  { id: 'loss.unrecoverable', impact: 'high', urgency: 'consequence-dependent', rationale: 'Permanent material loss cannot be undone.' },
  { id: 'containment.preserve', impact: 'preserve', urgency: 'may-reduce', rationale: 'Containment stops growth but does not erase harm.' },
  { id: 'propagation.active', impact: 'raise', urgency: 'minimum-medium', rationale: 'Increasing consequence needs attention without inventing a P1.' },
  { id: 'recurrence.pattern', impact: 'cumulative', urgency: 'unchanged', rationale: 'Recurrence is reach over time, not immediate time pressure.' },
  { id: 'criticality.context', impact: 'failure-only-support', urgency: 'unchanged', rationale: 'Criticality cannot manufacture a blocked process.' },
  { id: 'criticality.failure', impact: 'raise', urgency: 'unchanged', rationale: 'A failed shared delivery pipeline supports High Impact only with failure evidence.' },
  { id: 'safety.active', impact: 'high', urgency: 'high-when-imminent', rationale: 'Active safety consequence is severe and time-sensitive.' },
  { id: 'safeguarding.active', impact: 'high', urgency: 'high', rationale: 'An active safeguarding breach is occurring now.' },
  { id: 'safeguarding.pending', impact: 'contextual', urgency: 'deadline-dependent', rationale: 'Potential safeguarding harm is not automatically an emergency.' },
  { id: 'seniority.neutral', impact: 'unchanged', urgency: 'unchanged', rationale: 'Requester seniority does not change the consequence.' },
  { id: 'platform.neutral', impact: 'unchanged', urgency: 'unchanged', rationale: 'Catalogue metadata is routing context only.' }
]);

const SCOPE_RANK = {
  unknown: 0, individual: 1, 'few-users': 2, team: 3, cohort: 4,
  'one-school': 5, 'multiple-schools': 6, 'all-schools': 7, 'corporation-wide': 8
};

const DEFAULT_EVIDENCE = {
  inScope: true,
  decisionContext: 'active-or-unspecified',
  expectedBehaviour: false,
  immediateNeed: false,
  activeIncident: false,
  workType: 'incident',
  scope: 'unknown',
  consequence: 'unknown',
  workaround: 'unknown',
  workaroundCost: null,
  deadline: 'unknown',
  deadlineCommitted: false,
  deadlineDriver: 'unknown',
  lowUrgencySignal: false,
  harmTiming: 'unknown',
  recoverability: 'unknown',
  symptom: { id: 'unknown', severity: 0, hasFailure: false, isDataIssue: false },
  risks: {},
  modifiers: {},
  criticalSystem: false,
  technicalDomain: 'unknown',
  accessibilityIssue: false,
  containment: { contained: false, propagating: false, recurring: false, undetected: false }
};

function mergedEvidence(value = {}) {
  return {
    ...DEFAULT_EVIDENCE,
    ...value,
    symptom: { ...DEFAULT_EVIDENCE.symptom, ...(value.symptom || {}) },
    risks: { ...DEFAULT_EVIDENCE.risks, ...(value.risks || {}) },
    modifiers: { ...DEFAULT_EVIDENCE.modifiers, ...(value.modifiers || {}) },
    containment: { ...DEFAULT_EVIDENCE.containment, ...(value.containment || {}) }
  };
}

function addRule(rules, ids, id, before, impact, urgency, label, direction) {
  if (before.impact === impact && before.urgency === urgency) return;
  rules.push({ id, policyId: id, label, impact, urgency, direction });
  if (!ids.includes(id)) ids.push(id);
}

/**
 * Apply policy to already-scored levels.
 *
 * @param {{impact: string, urgency: string, evidence?: object}} context
 * @returns {{impact: string, urgency: string, rules: object[], policyIds: string[], floorApplied: boolean}}
 */
export function applyTriagePolicy(context) {
  const evidence = mergedEvidence(context?.evidence || {});
  let impact = context?.impact;
  let urgency = context?.urgency;
  const rules = [];
  const policyIds = [];
  let floorApplied = false;

  const lower = (nextImpact, nextUrgency, id, label) => {
    const before = { impact, urgency };
    if (nextImpact) impact = lowerLevel(impact, nextImpact);
    if (nextUrgency) urgency = lowerLevel(urgency, nextUrgency);
    addRule(rules, policyIds, id, before, impact, urgency, label, 'lower');
  };
  const raise = (nextImpact, nextUrgency, id, label) => {
    const before = { impact, urgency };
    if (nextImpact) impact = raiseLevel(impact, nextImpact);
    if (nextUrgency) urgency = raiseLevel(urgency, nextUrgency);
    addRule(rules, policyIds, id, before, impact, urgency, label, 'raise');
  };
  const minimumUrgency = (level, id, label) => {
    const before = { impact, urgency };
    if (LEVEL_RANK[urgency] < LEVEL_RANK[level]) urgency = level;
    if (before.urgency !== urgency) {
      rules.push({ id, policyId: id, label, impact, urgency, direction: 'raise' });
      if (!policyIds.includes(id)) policyIds.push(id);
    }
  };

  if (evidence.decisionContext === 'resolved') {
    lower('low', 'low', 'harm.resolved', 'The latest explicit update says the incident is resolved or contained.');
    return { impact, urgency, rules, policyIds, floorApplied };
  }
  if (evidence.decisionContext === 'planned-test') {
    lower('low', 'low', 'harm.resolved', 'The failure wording describes a design, simulation, exercise, or test.');
    return { impact, urgency, rules, policyIds, floorApplied };
  }
  if (!evidence.inScope) {
    lower('low', 'low', 'context.unassessed', 'No IT system, application-support request or technical symptom was recognised.');
    return { impact, urgency, rules, policyIds, floorApplied };
  }
  if (evidence.expectedBehaviour && !evidence.immediateNeed) {
    lower('low', 'low', 'context.expected-behaviour', 'This matches expected scheduled behaviour, not a failure.');
  }
  if (evidence.workType === 'documentation' && !evidence.symptom.hasFailure &&
      evidence.deadline === 'unknown' && !evidence.activeIncident) {
    lower('low', 'low', 'context.documentation', 'A documentation or how-to request with no stated deadline.');
  }

  const sameDay = ['now', 'today'].includes(evidence.deadline);
  const hardFuture = evidence.deadlineCommitted &&
    ['statutory', 'operational'].includes(evidence.deadlineDriver) &&
    ['tomorrow', 'days-2-5', 'weeks-1-2'].includes(evidence.deadline);
  const softTiming = evidence.lowUrgencySignal || evidence.deadlineDriver === 'preference' ||
    evidence.deadlineSoft === true;
  if (hardFuture && !softTiming && urgency === 'low') {
    urgency = 'medium';
    floorApplied = true;
    rules.push({
      id: 'deadline.hard-future',
      policyId: 'deadline.hard-future',
      label: 'A committed statutory or operational deadline sets a Medium urgency floor.',
      impact,
      urgency,
      direction: 'raise'
    });
    if (!policyIds.includes('deadline.hard-future')) policyIds.push('deadline.hard-future');
  }

  const risks = evidence.risks;
  const modifiers = evidence.modifiers;
  const symptom = evidence.symptom;
  const broad = (SCOPE_RANK[evidence.scope] || 0) >= SCOPE_RANK['multiple-schools'];
  const activeFailure = symptom.hasFailure || evidence.consequence === 'blocked' || modifiers.systemicJobs;
  const contained = Boolean(evidence.containment?.contained);
  const financialProcessingFailure =
    (risks.financial || risks.payroll) &&
    (symptom.hasFailure || symptom.isOutage || (symptom.isDataIssue && !contained) || modifiers.unpaidRisk ||
      evidence.consequence === 'blocked');
  const confirmedFinancialHarm = modifiers.unpaidRisk ||
    ((risks.financial || risks.payroll) &&
      (symptom.hasFailure || symptom.isOutage || (symptom.isDataIssue && !contained))) ||
    (evidence.consequence === 'blocked' && (risks.payroll || risks.financial));

  if (broad && activeFailure && softTiming) {
    minimumUrgency('medium', 'deadline.soft',
      'A can-wait signal reduces urgency, but does not erase an active broad failure.');
  }

  // Payroll/payment vocabulary is deliberately not enough. A same-day
  // escalation needs a blocked/failed processing path or confirmed harm.
  if (sameDay && (financialProcessingFailure || confirmedFinancialHarm)) {
    raise('high', 'high', 'financial.confirmed', 'Payroll or payment processing is failing against a same-day deadline.');
  }
  if (modifiers.unpaidRisk && (risks.payroll || risks.financial)) {
    raise('high', null, 'financial.confirmed', 'People may not be paid.');
  }
  if (modifiers.exposureActive && (risks.privacy || risks.security)) {
    raise('high', 'high', 'privacy.active', 'Information appears to be actively exposed to the wrong people.');
  }
  if (evidence.activeIncident) {
    raise('high', 'high', 'context.active-incident',
      'This is needed to recover from an incident already in progress, so it carries the priority of that incident rather than its own.');
  }

  if (risks.criticalIntegration && symptom.id === 'build-failed' && symptom.hasFailure) {
    raise('high', null, 'criticality.failure',
      'A shared delivery pipeline has an active build failure; criticality supports the consequence assessment only with failure evidence.');
  }

  if (evidence.harmTiming === 'pending' &&
      (risks.privacy || risks.security || risks.safety || risks.safeguarding)) {
    raise('medium', null, 'harm.pending', 'A credible potential harm is present, but it is not active harm.');
  }
  if (evidence.recoverability === 'unrecoverable') {
    raise('high', null, 'loss.unrecoverable', 'Material data loss is not recoverable.');
  }

  if (risks.safety && symptom.severity >= 1.5) {
    raise('high', null, 'safety.active', 'Safety-critical information or equipment is affected.');
    if (sameDay) raise(null, 'high', 'safety.active', 'The safety consequence arrives today.');
  }
  if (modifiers.immediateSafeguarding) {
    raise('high', 'high', 'safeguarding.active', 'An immediate safeguarding risk was described.');
  }
  if (risks.safeguarding &&
      (symptom.id === 'access-not-revoked' || modifiers.crossPersonVisibility)) {
    raise('high', 'high', 'safeguarding.active', 'A person who should be excluded still appears to have access.');
  }
  if (symptom.id === 'account-compromise') {
    raise('medium', 'high', 'security.active', 'An account appears to be compromised and the attacker is active.');
  }
  if (symptom.id === 'device-lost' && (risks.privacy || risks.security)) {
    raise('high', 'high', 'privacy.active', 'A lost or stolen device may hold personal information.');
  }
  if (symptom.id === 'consent-granted' && (risks.privacy || risks.security)) {
    raise('high', null, 'privacy.active', 'A third party appears to have been granted access to personal data.');
  }

  if (modifiers.propagating && evidence.scope !== 'individual') {
    raise('high', null, 'propagation.active', 'Incorrect data appears to be actively propagating across systems.');
    minimumUrgency('medium', 'propagation.active', 'Active propagation requires prompt containment, but does not by itself create High urgency.');
  }
  if (risks.compliance && sameDay) {
    raise('medium', null, 'safeguarding.pending', 'A compliance or regulatory deadline falls today.');
  }
  if (modifiers.decisionRisk && (risks.payroll || risks.financial) && sameDay) {
    raise('high', null, 'financial.confirmed', 'Financial decisions may be made on incorrect information.');
  }

  const workaroundIsCostly = Boolean(evidence.workaroundCost);
  if (workaroundIsCostly && activeFailure) {
    minimumUrgency('medium', 'workaround.costly', 'A material manual workaround cost remains.');
  }
  if (evidence.workaround === 'partial' && activeFailure) {
    minimumUrgency('medium', 'workaround.partial', 'A partial workaround leaves an active business cost.');
  }
  if (evidence.workaround === 'yes' && broad && activeFailure) {
    minimumUrgency('medium', 'workaround.full', 'A full workaround preserves work, but a broad active failure remains operationally significant.');
  }
  if ((evidence.accessibilityIssue || evidence.technicalDomain === 'accessibility') &&
      evidence.workaround === 'yes') {
    minimumUrgency('medium', 'safeguarding.pending', 'A workaround preserves operations but not equivalent accessibility.');
  }

  return { impact, urgency, rules, policyIds, floorApplied };
}

export default applyTriagePolicy;
