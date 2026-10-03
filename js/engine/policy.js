/**
 * Triage safety calibration — v0.12.0.
 *
 * The base Impact and Urgency scores already carry the day-to-day weighting.
 * This module is deliberately small: it applies only the hard-safety decisions
 * that must hold no matter how the words were phrased. It never inspects ticket
 * text; it receives structured evidence only.
 *
 * The long per-rule table of v0.8.0 (34 rules) was removed because it largely
 * re-expressed the base weights. What remains is the safety floor.
 */
import { raiseLevel, lowerLevel, LEVEL_RANK } from './priority-matrix.js';

/** Documented rule ids, kept for the contract doc and tests. */
export const TRIAGE_POLICY_DECISIONS = Object.freeze([
  { id: 'context.resolved', impact: 'lower', urgency: 'lower', rationale: 'An explicit resolution is not live work.' },
  { id: 'context.unassessed', impact: 'lower', urgency: 'lower', rationale: 'Unrecognised input is not scored as an IT consequence.' },
  { id: 'deadline.hard-future', impact: 'unchanged', urgency: 'minimum-medium', rationale: 'A committed statutory or operational event is time-sensitive.' },
  { id: 'financial.confirmed', impact: 'high', urgency: 'high', rationale: 'A same-day confirmed payroll or payment failure.' },
  { id: 'privacy.active', impact: 'high', urgency: 'high', rationale: 'Actual exposure is a current consequence.' },
  { id: 'security.active', impact: 'medium', urgency: 'high', rationale: 'A compromised account requires rapid containment.' },
  { id: 'safety.active', impact: 'high', urgency: 'high-when-imminent', rationale: 'Active safety consequence is severe and time-sensitive.' },
  { id: 'safeguarding.active', impact: 'high', urgency: 'high', rationale: 'An active safeguarding breach is occurring now.' },
  { id: 'propagation.active', impact: 'high', urgency: 'minimum-medium', rationale: 'Increasing consequence needs attention without inventing a P1.' },
  { id: 'loss.unrecoverable', impact: 'high', urgency: 'consequence-dependent', rationale: 'Permanent material loss cannot be undone.' },
  { id: 'loss.recoverable', impact: 'lower-high-to-medium', urgency: 'unchanged', rationale: 'A usable recovery path removes the permanent-loss dimension.' },
  { id: 'workaround.costly', impact: 'unchanged', urgency: 'minimum-medium', rationale: 'Material manual effort keeps an active issue time-sensitive.' },
  { id: 'context.active-incident', impact: 'high', urgency: 'high', rationale: 'Recovery work inherits the incident consequence.' }
]);

const SCOPE_RANK = {
  unknown: 0, individual: 1, 'few-users': 2, team: 3, cohort: 4,
  'one-school': 5, 'multiple-schools': 6, 'all-schools': 7, 'corporation-wide': 8
};

const DEFAULT_EVIDENCE = {
  inScope: true,
  decisionContext: 'active-or-unspecified',
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
  symptom: { id: 'unknown', severity: 0, hasFailure: false, isDataIssue: false, isOutage: false },
  risks: {},
  modifiers: {},
  criticalSystem: false,
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

/**
 * Apply the safety floor to already-scored levels.
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

  const record = (id, label, direction) => {
    rules.push({ id, policyId: id, label, impact, urgency, direction });
    if (!policyIds.includes(id)) policyIds.push(id);
  };
  const raise = (nextImpact, nextUrgency, id, label) => {
    if (nextImpact) impact = raiseLevel(impact, nextImpact);
    if (nextUrgency) urgency = raiseLevel(urgency, nextUrgency);
    record(id, label, 'raise');
  };
  const lower = (nextImpact, nextUrgency, id, label) => {
    if (nextImpact) impact = lowerLevel(impact, nextImpact);
    if (nextUrgency) urgency = lowerLevel(urgency, nextUrgency);
    record(id, label, 'lower');
  };
  const minimumUrgency = (level, id, label) => {
    if (LEVEL_RANK[urgency] < LEVEL_RANK[level]) {
      urgency = level;
      record(id, label, 'raise');
    }
  };

  if (evidence.decisionContext === 'resolved') {
    lower('low', 'low', 'context.resolved', 'The latest explicit update says the incident is resolved or contained.');
    return { impact, urgency, rules, policyIds, floorApplied };
  }
  if (!evidence.inScope) {
    lower('low', 'low', 'context.unassessed', 'No IT system, application-support request or technical symptom was recognised.');
    return { impact, urgency, rules, policyIds, floorApplied };
  }

  // A committed statutory or operational future deadline sets a Medium floor.
  const hardFuture = evidence.deadlineCommitted &&
    ['statutory', 'operational'].includes(evidence.deadlineDriver) &&
    ['tomorrow', 'days-2-5', 'weeks-1-2'].includes(evidence.deadline);
  if (hardFuture && urgency === 'low') {
    urgency = 'medium';
    floorApplied = true;
    record('deadline.hard-future', 'A committed statutory or operational deadline sets a Medium urgency floor.', 'raise');
  }

  const risks = evidence.risks;
  const modifiers = evidence.modifiers;
  const symptom = evidence.symptom;
  const sameDay = ['now', 'today'].includes(evidence.deadline);
  const contained = Boolean(evidence.containment?.contained);

  const financialFailure = (risks.financial || risks.payroll) &&
    (symptom.hasFailure || symptom.isOutage || (symptom.isDataIssue && !contained) ||
      modifiers.unpaidRisk || evidence.consequence === 'blocked');
  if (sameDay && financialFailure) {
    raise('high', 'high', 'financial.confirmed', 'Payroll or payment processing is failing against a same-day deadline.');
  } else if (modifiers.unpaidRisk && (risks.payroll || risks.financial)) {
    raise('high', null, 'financial.confirmed', 'People may not be paid.');
  }

  if (modifiers.exposureActive && (risks.privacy || risks.security)) {
    raise('high', 'high', 'privacy.active', 'Information appears to be actively exposed to the wrong people.');
  }
  if (evidence.activeIncident) {
    raise('high', 'high', 'context.active-incident', 'This is needed to recover from an incident already in progress.');
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

  if (risks.safety && symptom.severity >= 1.5) {
    raise('high', null, 'safety.active', 'Safety-critical information or equipment is affected.');
    if (sameDay) raise(null, 'high', 'safety.active', 'The safety consequence arrives today.');
  }
  if (modifiers.immediateSafeguarding) {
    raise('high', 'high', 'safeguarding.active', 'An immediate safeguarding risk was described.');
  }
  if (risks.safeguarding && (symptom.id === 'access-not-revoked' || modifiers.crossPersonVisibility)) {
    raise('high', 'high', 'safeguarding.active', 'A person who should be excluded still appears to have access.');
  }

  if (modifiers.propagating && evidence.scope !== 'individual') {
    raise('high', null, 'propagation.active', 'Incorrect data appears to be actively propagating across systems.');
    minimumUrgency('medium', 'propagation.active', 'Active propagation requires prompt containment, but does not by itself create High urgency.');
  }

  if (evidence.recoverability === 'unrecoverable') {
    raise('high', null, 'loss.unrecoverable', 'Material data loss is not recoverable.');
  }
  if (evidence.recoverability === 'recoverable' && impact === 'high') {
    lower('medium', null, 'loss.recoverable', 'A usable recovery path removes the permanent-loss dimension from Impact.');
  }

  if (evidence.workaroundCost) {
    minimumUrgency('medium', 'workaround.costly', 'A material manual workaround cost remains.');
  }

  return { impact, urgency, rules, policyIds, floorApplied };
}

export default applyTriagePolicy;
