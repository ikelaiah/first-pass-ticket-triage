import { applyTriagePolicy, TRIAGE_POLICY_DECISIONS } from '../js/engine/policy.js';

const EMPTY_RISKS = {
  payroll: false, financial: false, privacy: false, security: false,
  safety: false, safeguarding: false, compliance: false,
  dataIntegrity: false, criticalIntegration: false
};

const EMPTY_MODIFIERS = {
  unpaidRisk: false, crossPersonVisibility: false, crossPersonLink: false,
  exposureActive: false, propagating: false, decisionRisk: false,
  immediateSafeguarding: false, systemicJobs: false
};

const BASE_EVIDENCE = {
  inScope: true,
  decisionContext: 'active-or-unspecified',
  expectedBehaviour: false,
  immediateNeed: false,
  activeIncident: false,
  workType: 'incident',
  scope: 'individual',
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
  risks: { ...EMPTY_RISKS },
  modifiers: { ...EMPTY_MODIFIERS },
  criticalSystem: false,
  technicalDomain: 'unknown',
  containment: { contained: false, propagating: false, recurring: false, undetected: false }
};

function policy(overrides = {}) {
  const evidence = { ...BASE_EVIDENCE, ...overrides };
  return applyTriagePolicy({ impact: 'low', urgency: 'low', evidence });
}

export function registerPolicyTests(test, ok) {
  test('v0.8.0 policy', 'applied policy IDs are unique and come from the exported decision table', () => {
    const known = new Set(TRIAGE_POLICY_DECISIONS.map((decision) => decision.id));
    const result = policy({
      deadline: 'weeks-1-2',
      deadlineCommitted: true,
      deadlineDriver: 'operational',
      scope: 'all-schools',
      modifiers: { ...EMPTY_MODIFIERS, propagating: true },
      risks: { ...EMPTY_RISKS, dataIntegrity: true }
    });
    return ok(result.policyIds.length === new Set(result.policyIds).size &&
      result.policyIds.every((id) => known.has(id)), JSON.stringify(result.policyIds));
  });

  test('v0.8.0 policy', 'broader scope cannot reduce urgency for an active workaround case', () => {
    const base = { workaround: 'yes', symptom: { id: 'unavailable', severity: 3, hasFailure: true, isDataIssue: false } };
    const individual = policy({ ...base, scope: 'individual' });
    const broad = policy({ ...base, scope: 'all-schools' });
    const ranks = { low: 0, medium: 1, high: 2 };
    return ok(ranks[broad.urgency] >= ranks[individual.urgency],
      individual.urgency + ' -> ' + broad.urgency);
  });

  test('v0.8.0 policy', 'hard future operational deadlines receive a Medium floor', () => {
    const result = policy({ deadline: 'weeks-1-2', deadlineCommitted: true, deadlineDriver: 'operational' });
    return ok(result.urgency === 'medium' && result.floorApplied === true,
      result.urgency + ' / floor=' + result.floorApplied);
  });

  test('v0.8.0 policy', 'explicit can-wait wording overrides a future deadline floor', () => {
    const result = policy({ deadline: 'weeks-1-2', deadlineCommitted: true, deadlineDriver: 'operational', lowUrgencySignal: true });
    return ok(result.urgency === 'low' && result.floorApplied === false, JSON.stringify(result));
  });

  test('v0.8.0 policy', 'can-wait wording does not erase an active broad failure', () => {
    const result = policy({
      scope: 'all-schools',
      deadline: 'weeks-1-2',
      deadlineCommitted: true,
      deadlineDriver: 'operational',
      lowUrgencySignal: true,
      symptom: { id: 'not-synchronising', severity: 2, hasFailure: true, isDataIssue: false }
    });
    return ok(result.urgency === 'medium', JSON.stringify(result));
  });

  test('v0.8.0 policy', 'a soft preference remains Low urgency even with a future date', () => {
    const result = policy({ deadline: 'weeks-1-2', deadlineCommitted: true, deadlineDriver: 'preference' });
    return ok(result.urgency === 'low', result.urgency);
  });

  test('v0.8.0 policy', 'a full workaround does not lower Impact', () => {
    const result = applyTriagePolicy({
      impact: 'medium', urgency: 'medium',
      evidence: { ...BASE_EVIDENCE, workaround: 'yes' }
    });
    return ok(result.impact === 'medium', result.impact);
  });

  test('v0.8.0 policy', 'a broad active blocked process with a workaround stays at least Medium urgency', () => {
    const result = policy({ scope: 'all-schools', consequence: 'blocked', workaround: 'yes', symptom: { id: 'unknown', severity: 0, hasFailure: false, isDataIssue: false } });
    return ok(result.urgency === 'medium', result.urgency);
  });

  test('v0.8.0 policy', 'a high-cost workaround does not suppress active urgency below Medium', () => {
    const result = policy({ workaround: 'yes', workaroundCost: '3 registrars per day', symptom: { id: 'unavailable', severity: 3, hasFailure: true, isDataIssue: false } });
    return ok(result.urgency === 'medium', result.urgency);
  });

  test('v0.8.0 policy', 'partial workaround preserves active process pressure', () => {
    const result = policy({ workaround: 'partial', consequence: 'blocked', symptom: { id: 'action-blocked', severity: 2, hasFailure: true, isDataIssue: false } });
    return ok(result.urgency === 'medium', result.urgency);
  });

  test('v0.8.0 policy', 'active exposure raises both dimensions to High', () => {
    const result = policy({
      harmTiming: 'active',
      risks: { ...EMPTY_RISKS, privacy: true },
      modifiers: { ...EMPTY_MODIFIERS, exposureActive: true }
    });
    return ok(result.impact === 'high' && result.urgency === 'high', JSON.stringify(result));
  });

  test('v0.8.0 policy', 'pending exposure can affect Impact without creating active Urgency', () => {
    const result = policy({
      harmTiming: 'pending',
      risks: { ...EMPTY_RISKS, privacy: true }
    });
    return ok(result.impact === 'medium' && result.urgency === 'low', JSON.stringify(result));
  });

  test('v0.8.0 policy', 'passive privacy context does not elevate either level', () => {
    const result = policy({ risks: { ...EMPTY_RISKS, privacy: true } });
    return ok(result.impact === 'low' && result.urgency === 'low', JSON.stringify(result));
  });

  test('v0.8.0 policy', 'payroll topic without a consequence does not elevate Impact', () => {
    const result = policy({ risks: { ...EMPTY_RISKS, payroll: true } });
    return ok(result.impact === 'low', result.impact);
  });

  test('v0.8.0 policy', 'confirmed unpaid risk raises financial consequence to High', () => {
    const result = policy({
      risks: { ...EMPTY_RISKS, payroll: true },
      modifiers: { ...EMPTY_MODIFIERS, unpaidRisk: true }
    });
    return ok(result.impact === 'high', result.impact);
  });

  test('v0.8.0 policy', 'a failed financial process against today raises both dimensions', () => {
    const result = policy({
      deadline: 'today',
      risks: { ...EMPTY_RISKS, financial: true },
      symptom: { id: 'failed', severity: 2, hasFailure: true, isDataIssue: false }
    });
    return ok(result.impact === 'high' && result.urgency === 'high', JSON.stringify(result));
  });

  test('v0.8.0 policy', 'a failed payroll process against today raises both dimensions', () => {
    const result = policy({
      deadline: 'today',
      risks: { ...EMPTY_RISKS, payroll: true },
      symptom: { id: 'failed', severity: 2, hasFailure: true, isDataIssue: false }
    });
    return ok(result.impact === 'high' && result.urgency === 'high', JSON.stringify(result));
  });

  test('v0.8.0 policy', 'contained duplicate charges remain contextual despite a same-day correction', () => {
    const result = applyTriagePolicy({
      impact: 'medium', urgency: 'high',
      evidence: {
        ...BASE_EVIDENCE,
        deadline: 'today',
        risks: { ...EMPTY_RISKS, financial: true, dataIntegrity: true },
        symptom: { id: 'duplicate-data', severity: 1.5, hasFailure: false, isDataIssue: true },
        containment: { contained: true }
      }
    });
    return ok(result.impact === 'medium' && result.urgency === 'high', JSON.stringify(result));
  });

  test('v0.8.0 policy', 'recoverable loss remains contextual rather than High', () => {
    const result = applyTriagePolicy({
      impact: 'medium', urgency: 'high', evidence: { ...BASE_EVIDENCE, recoverability: 'recoverable' }
    });
    return ok(result.impact === 'medium', result.impact);
  });

  test('v0.8.0 policy', 'unrecoverable material loss cannot lower Impact', () => {
    const result = policy({ recoverability: 'unrecoverable', symptom: { id: 'data-loss', severity: 3, hasFailure: true, isDataIssue: true } });
    return ok(result.impact === 'high', result.impact);
  });

  test('v0.8.0 policy', 'containment preserves existing Impact', () => {
    const result = applyTriagePolicy({
      impact: 'high', urgency: 'high', evidence: { ...BASE_EVIDENCE, containment: { contained: true, propagating: false, recurring: false, undetected: false } }
    });
    return ok(result.impact === 'high', result.impact);
  });

  test('v0.8.0 policy', 'propagation raises urgency to Medium but not automatically to High', () => {
    const result = policy({
      scope: 'few-users',
      modifiers: { ...EMPTY_MODIFIERS, propagating: true },
      risks: { ...EMPTY_RISKS, dataIntegrity: true }
    });
    return ok(result.impact === 'high' && result.urgency === 'medium', JSON.stringify(result));
  });

  test('v0.8.0 policy', 'broad propagation keeps the Medium urgency ceiling without a deadline', () => {
    const result = policy({
      scope: 'all-schools',
      modifiers: { ...EMPTY_MODIFIERS, propagating: true },
      risks: { ...EMPTY_RISKS, financial: true, dataIntegrity: true }
    });
    return ok(result.impact === 'high' && result.urgency === 'medium', JSON.stringify(result));
  });

  test('v0.8.0 policy', 'a failed critical integration raises Impact but does not invent urgency', () => {
    const result = policy({
      risks: { ...EMPTY_RISKS, criticalIntegration: true },
      symptom: { id: 'build-failed', severity: 2, hasFailure: true, isDataIssue: false },
      criticalSystem: true,
      technicalDomain: 'devops-cicd'
    });
    return ok(result.impact === 'high' && result.urgency === 'low', JSON.stringify(result));
  });

  test('v0.8.0 policy', 'recurrence does not manufacture urgency', () => {
    const result = policy({ containment: { contained: false, propagating: false, recurring: true, undetected: false } });
    return ok(result.urgency === 'low', result.urgency);
  });

  test('v0.8.0 policy', 'accessibility limitation with a workaround remains Medium urgency', () => {
    const result = policy({ workaround: 'yes', technicalDomain: 'accessibility', accessibilityIssue: true });
    return ok(result.impact === 'low' && result.urgency === 'medium', JSON.stringify(result));
  });

  test('v0.8.0 policy', 'critical-system context alone changes nothing', () => {
    const result = policy({ criticalSystem: true });
    return ok(result.impact === 'low' && result.urgency === 'low', JSON.stringify(result));
  });

  test('v0.8.0 policy', 'requester seniority and platform category are neutral', () => {
    const plain = policy();
    const decorated = policy({ requesterSeniority: 'principal', platformCategory: 'Learning Management Systems (LMS)' });
    return ok(plain.impact === decorated.impact && plain.urgency === decorated.urgency,
      JSON.stringify({ plain, decorated }));
  });

  test('v0.8.0 policy', 'resolved harm is not more urgent than identical active harm', () => {
    const active = policy({ harmTiming: 'active', risks: { ...EMPTY_RISKS, privacy: true }, modifiers: { ...EMPTY_MODIFIERS, exposureActive: true } });
    const resolved = policy({ decisionContext: 'resolved', harmTiming: 'active', risks: { ...EMPTY_RISKS, privacy: true }, modifiers: { ...EMPTY_MODIFIERS, exposureActive: true } });
    const ranks = { low: 0, medium: 1, high: 2 };
    return ok(ranks[resolved.urgency] <= ranks[active.urgency], active.urgency + ' / ' + resolved.urgency);
  });
}
