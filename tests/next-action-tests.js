import { recommendNextAction, NEXT_ACTIONS } from '../js/engine/next-action.js';

const unknown = { value: 'unknown', authority: 'unknown' };
const known = (value, authority = 'explicit') => ({ value, authority });
const base = () => ({
  assessmentStatus: 'assessed',
  workType: 'incident',
  businessConsequence: known('blocked'),
  deadline: known('none'),
  workaround: known('no'),
  containment: known('contained'),
  harm: known('unknown'),
  currentFailure: known(true),
  risks: {},
  events: []
});

function action(input) {
  return recommendNextAction({ ...base(), ...input });
}

export function registerNextActionTests(test, ok) {
  test('Safe Next Action', 'exports exactly the six supported actions', () =>
    ok(JSON.stringify(NEXT_ACTIONS) === JSON.stringify(['clarify', 'verify', 'investigate', 'contain', 'escalate', 'plan']),
      JSON.stringify(NEXT_ACTIONS)));

  const clarifyCases = [
    ['unknown business consequence', { businessConsequence: unknown }, 'NA-CLARIFY-CONSEQUENCE'],
    ['ambiguous required-by relationship', { deadline: known('tomorrow'), deadlineRelationship: 'unknown' }, 'NA-CLARIFY-DEADLINE'],
    ['unknown workaround equivalence', { workaround: unknown }, 'NA-CLARIFY-WORKAROUND'],
    ['unknown containment for exposure', { containment: unknown, events: [{ kind: 'active-exposure', authority: 'explicit', temporal: 'current' }] }, 'NA-CLARIFY-CONTAINMENT'],
    ['inferred-only privacy exposure', { events: [{ kind: 'active-exposure', authority: 'inferred', temporal: 'current' }], risks: { privacy: known(true, 'inferred') } }, 'NA-CLARIFY-AUTHORITY'],
    ['unresolved cross-clause composition', { composition: 'unknown' }, 'NA-CLARIFY-COMPOSITION'],
    ['unassessed input', { assessmentStatus: 'unassessed' }, 'NA-CLARIFY-UNASSESSED'],
    ['historical/current ambiguity', { temporalState: 'ambiguous' }, 'NA-CLARIFY-HARM-TIMING'],
    ['future/pending harm ambiguity', { harm: known('pending'), temporalState: 'ambiguous' }, 'NA-CLARIFY-HARM-TIMING']
  ];
  for (const [name, input, ruleId] of clarifyCases) {
    test('Safe Next Action — Clarify', name, () => {
      const result = action(input);
      return ok(result.action === 'clarify' && result.ruleId === ruleId, JSON.stringify(result));
    });
  }

  const actionCases = [
    ['Verify', 'authoritative status check', { verification: 'source' }, 'NA-VERIFY-SOURCE'],
    ['Verify', 'affected population source check', { verification: 'scope' }, 'NA-VERIFY-SCOPE'],
    ['Verify', 'data/configuration mismatch', { verification: 'configuration' }, 'NA-VERIFY-SOURCE'],
    ['Investigate', 'established current technical failure', {}, 'NA-INVESTIGATE-CURRENT-FAILURE'],
    ['Contain', 'analyst-confirmed active privacy exposure', { containment: known('spreading', 'analyst-confirmed'), events: [{ kind: 'active-exposure', authority: 'analyst-confirmed', temporal: 'current' }], risks: { privacy: known(true, 'analyst-confirmed') } }, 'NA-CONTAIN-ACTIVE-EXPOSURE'],
    ['Contain', 'explicit current unauthorised access', { containment: known('spreading'), events: [{ kind: 'unauthorised-access', authority: 'explicit', temporal: 'current' }], risks: { security: known(true) } }, 'NA-CONTAIN-ACTIVE-EXPOSURE'],
    ['Contain', 'explicit ongoing corruption', { containment: known('spreading'), events: [{ kind: 'propagation', authority: 'explicit', temporal: 'current' }], risks: { dataIntegrity: known(true) } }, 'NA-CONTAIN-PROPAGATION'],
    ['Escalate', 'explicit safeguarding consequence', { events: [{ kind: 'safeguarding-consequence', authority: 'explicit', temporal: 'current' }], risks: { safeguarding: known(true) } }, 'NA-ESCALATE-SAFETY'],
    ['Escalate', 'explicit safety consequence', { events: [{ kind: 'safety-consequence', authority: 'explicit', temporal: 'current' }], risks: { safety: known(true) } }, 'NA-ESCALATE-SAFETY'],
    ['Escalate', 'explicit serious security consequence', { events: [{ kind: 'serious-security-consequence', authority: 'explicit', temporal: 'current' }], risks: { security: known(true) } }, 'NA-ESCALATE-SECURITY'],
    ['Escalate', 'explicit material payroll consequence', { events: [{ kind: 'material-financial-consequence', authority: 'explicit', temporal: 'current' }], risks: { payroll: known(true) } }, 'NA-ESCALATE-FINANCIAL'],
    ['Plan', 'feature request with usable current state', { workType: 'feature', currentFailure: known(false), businessConsequence: known('none'), workaround: known('yes') }, 'NA-PLAN-NONIMMEDIATE'],
    ['Plan', 'documentation work', { workType: 'documentation', currentFailure: known(false), businessConsequence: known('none') }, 'NA-PLAN-NONIMMEDIATE'],
    ['Plan', 'explicit can wait', { currentFailure: known(false), businessConsequence: known('none'), deadline: known('none'), canWait: true }, 'NA-PLAN-NONIMMEDIATE']
  ];
  for (const [expected, name, input, ruleId] of actionCases) {
    test('Safe Next Action — ' + expected, name, () => {
      const result = action(input);
      return ok(result.action === expected.toLowerCase() && result.ruleId === ruleId, JSON.stringify(result));
    });
  }

  test('Safe Next Action', 'analyst confirmation transitions an inferred exposure from Clarify to Contain', () => {
    const inferred = action({ containment: known('spreading'), events: [{ kind: 'active-exposure', authority: 'inferred', temporal: 'current' }], risks: { privacy: known(true, 'inferred') } });
    const confirmed = action({ containment: known('spreading', 'analyst-confirmed'), events: [{ kind: 'active-exposure', authority: 'analyst-confirmed', temporal: 'current' }], risks: { privacy: known(true, 'analyst-confirmed') } });
    return ok(inferred.action === 'clarify' && confirmed.action === 'contain', JSON.stringify({ inferred, confirmed }));
  });

  test('Safe Next Action', 'never emits a destructive or system-specific instruction', () => {
    const results = [
      action({ containment: known('spreading'), events: [{ kind: 'active-exposure', authority: 'explicit', temporal: 'current' }], risks: { privacy: known(true) } }),
      action({ events: [{ kind: 'safety-consequence', authority: 'explicit', temporal: 'current' }], risks: { safety: known(true) } })
    ];
    const unsafe = /\b(?:disable|restart|delete|restore|roll\s*back|reset|firewall|account|database)\b/i;
    return ok(results.every((result) => !unsafe.test(result.reason)), JSON.stringify(results));
  });
}
