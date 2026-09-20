/**
 * Phase 4 generalisation suite.
 *
 * Metamorphic paraphrases, scoring invariants, and adversarial wording that go
 * beyond the locked fixtures. Every accuracy fix in this release gets at least
 * one unseen paraphrase here, so the engine generalises rather than matching
 * the exact fixture sentence.
 */
import { analyse } from '../js/engine/analyzer.js';

const RANK = { low: 0, medium: 1, high: 2 };

export function registerGeneralisationTests(test, ok) {
  const priority = (text, expected) => {
    const list = Array.isArray(expected) ? expected : [expected];
    const result = analyse(text);
    const actual = result.assessmentStatus === 'assessed' ? result.suggestedPriority : null;
    return ok(list.includes(actual),
      actual + ' (' + result.impactLabel + '/' + result.urgencyLabel + ')' +
      (list.includes(actual) ? '' : ' - expected ' + list.join(' or ')));
  };

  // --- metamorphic paraphrases of this release's fixes ---------------------
  test('Generalisation', 'an unseen payroll-file failure before a cutoff is P1', () =>
    priority('The payroll file for 40 employees was never created and the cutoff is this afternoon.', 'P1'));

  test('Generalisation', 'a successfully created payroll file does not escalate', () =>
    priority('The payroll file was created for 40 employees and the cutoff is this afternoon.', ['P2', 'P3', 'P4']));

  test('Generalisation', 'an omitted sync batch is a data-integrity risk', () => {
    const result = analyse('The enrolment sync omitted nine rows for one year group; staff can re-enter them and the roll closes in two days.');
    return ok(result.risks.dataIntegrity === true && result.businessConsequence?.level === 'impaired',
      JSON.stringify({ dataIntegrity: result.risks.dataIntegrity, consequence: result.businessConsequence?.level }));
  });

  test('Generalisation', 'a bounded skipped batch is contained', () => {
    const result = analyse('The absence sync skipped six pupils in one class; the teacher can add them and the roll closes tomorrow.');
    return ok(result.eightFacets.i4Containment.containment.contained === true,
      JSON.stringify(result.eightFacets.i4Containment.containment));
  });

  test('Generalisation', 'an unseen keyboard barrier is a partial-access P3', () => {
    const result = analyse('A keyboard-only staff member cannot reach the submit button; a colleague clicks it for them, which is not an equivalent way to work.');
    return ok(result.symptom === 'action-blocked' && result.workaround === 'partial' && result.suggestedPriority === 'P3',
      JSON.stringify({ symptom: result.symptom, workaround: result.workaround, priority: result.suggestedPriority }));
  });

  test('Generalisation', 'an unseen recoverable loss keeps Medium impact and active harm', () => {
    const result = analyse("The term roll was deleted, but it can be rebuilt from Sunday's backup before Monday's classes.");
    return ok(result.impact === 'medium' && result.harmTiming.timing === 'active' && result.workaround === 'yes',
      JSON.stringify({ impact: result.impact, harm: result.harmTiming.timing, workaround: result.workaround }));
  });

  test('Generalisation', 'an unseen weekly cadence is recurring', () => {
    const result = analyse('Every Tuesday the timetable export drops the same two routes at West Campus; staff fix the entries before school and the next export is Thursday.');
    return ok(result.eightFacets.i4Containment.containment.recurring === true,
      JSON.stringify(result.eightFacets.i4Containment.containment));
  });

  test('Generalisation', 'an unseen stale display is incorrect data', () => {
    const result = analyse("The bus board is displaying last week's times for fourteen pupils, but the current portal page is accurate.");
    return ok(result.risks.dataIntegrity === true && result.businessConsequence?.level === 'impaired',
      JSON.stringify({ dataIntegrity: result.risks.dataIntegrity, consequence: result.businessConsequence?.level }));
  });

  test('Generalisation', 'an unseen manual re-keying duration is a cost', () => {
    const result = analyse('We are re-keying the invoices by hand, which takes about two hours, and the finance close is tomorrow.');
    return ok(Boolean(result.eightFacets.u7Workaround.costPerDay),
      JSON.stringify(result.eightFacets.u7Workaround));
  });

  // --- scoring and context invariants --------------------------------------
  test('Generalisation', 'a workaround cannot raise urgency', () => {
    const base = analyse('Canvas is down for the finance team and no deadline is stated.');
    const worked = analyse('Canvas is down for the finance team, but we can process manually and no deadline is stated.');
    return ok(RANK[worked.urgency] <= RANK[base.urgency],
      base.urgency + ' -> ' + worked.urgency);
  });

  test('Generalisation', 'a committed same-day deadline cannot lower urgency', () => {
    const base = analyse('The report is wrong for one user.');
    const urgent = analyse('The report is wrong for one user and it must be corrected today.');
    return ok(RANK[urgent.urgency] >= RANK[base.urgency],
      base.urgency + ' -> ' + urgent.urgency);
  });

  test('Generalisation', 'an unaffected comparator cannot expand scope', () => {
    const result = analyse('One teacher cannot open the portal, but all schools are working normally.');
    return ok(result.scope === 'individual', result.scope);
  });

  test('Generalisation', 'historical breadth cannot expand current scope', () => {
    const result = analyse('Last month every campus was down. Today one registrar cannot log in.');
    return ok(result.scope === 'individual', result.scope);
  });

  test('Generalisation', 'negation stays inside its clause', () => {
    const result = analyse('Canvas is slow for one user but not unavailable.');
    return ok(result.symptom === 'degraded', result.symptom);
  });

  test('Generalisation', 'unrecognised input stays unassessed with no suggestion', () => {
    const result = analyse('The widget needs attention.');
    return ok(result.assessmentStatus === 'unassessed' && result.suggestedPriority === null,
      result.assessmentStatus + ' / ' + result.suggestedPriority);
  });

  // --- adversarial wording --------------------------------------------------
  test('Generalisation', 'screaming with no consequence is not P1', () => {
    const result = analyse('URGENT!!! The printer is jammed!!!');
    return ok(result.suggestedPriority !== 'P1', result.suggestedPriority);
  });

  test('Generalisation', 'screaming with a workaround is not P1', () => {
    const result = analyse('URGENT: Laserfiche is broken but we can continue on paper for now.');
    return ok(result.suggestedPriority !== 'P1' && result.urgency === 'low',
      result.suggestedPriority + ' / ' + result.urgency);
  });

  test('Generalisation', 'a resolved history followed by a live failure escalates', () => {
    const result = analyse('The sync failure was fixed yesterday, but it has stopped again for all schools today.');
    return ok(result.impact === 'high' && result.urgency === 'high',
      result.impact + '/' + result.urgency);
  });

  test('Generalisation', 'UAT and test-case wording stays backlog work', () => {
    const result = analyse('In UAT, the enrolment form fails to load for every school; this is a test case.');
    return ok(result.suggestedPriority === 'P4', result.suggestedPriority);
  });

  test('Generalisation', 'a pasted log does not hide a live all-schools failure', () => {
    const result = analyse('java.sql.SQLException: connection refused\n  at db.pool.acquire\nThe reporting service is down for all schools; today\u2019s board report is due at 5pm.');
    return ok(result.impact === 'high' && result.scope === 'all-schools',
      result.impact + '/' + result.scope);
  });

  test('Generalisation', 'quoted history does not become the current scope', () => {
    const result = analyse('The previous Canvas outage affected all schools. Today one student cannot log in.');
    return ok(result.scope === 'individual', result.scope);
  });

  test('Generalisation', 'a document-only mention does not set a workaround cost', () => {
    const result = analyse('The guide says a manual process takes an hour.');
    return ok(!result.eightFacets.u7Workaround.costPerDay,
      JSON.stringify(result.eightFacets.u7Workaround));
  });
}
