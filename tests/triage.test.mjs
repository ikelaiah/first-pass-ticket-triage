/**
 * v0.12.0 acceptance suite.
 *
 * This replaces the v0.8–v0.11 evaluation, holdout, facet and catalogue
 * machinery. It asserts the contract the simplified tool actually makes:
 *
 *   - the 3x3 matrix is the only thing that names a priority;
 *   - each of the eight decision questions is detected from clear wording;
 *   - the framework's worked examples land where the framework says;
 *   - the hard safety invariants hold;
 *   - the advisory projections (next action, handoff, reply) never change P.
 */
import { createDocument } from '../js/engine/negation.js';
import { priorityFor, MATRIX, IMPACT_ORDER, URGENCY_ORDER } from '../js/engine/priority-matrix.js';
import { analyse } from '../js/engine/analyzer.js';
import { detectScope } from '../js/engine/scope.js';
import { detectDeadline } from '../js/engine/deadline.js';
import { detectWorkaround } from '../js/engine/workaround.js';
import { detectDriver } from '../js/engine/driver.js';
import { detectSymptom } from '../js/engine/symptom.js';
import { detectRisks } from '../js/engine/risks.js';
import { detectContainment } from '../js/engine/containment.js';
import { detectHarmTiming } from '../js/engine/harm-timing.js';
import { recommendNextAction, NEXT_ACTIONS } from '../js/engine/next-action.js';
import { buildHandoffText, buildHandoffMarkdown } from '../js/ui/handoff.js';
import { buildReply, buildMarkdown } from '../js/ui/reply.js';
import { encodeTicket, decodeTicket, tooLongForShare, SHARE_LIMIT } from '../js/ui/share.js';

const results = [];
let currentGroup = 'General';

function group(name) {
  currentGroup = name;
}

function test(name, fn) {
  let pass = true;
  let message = 'ok';
  try {
    const outcome = fn();
    if (outcome === false) { pass = false; message = 'returned false'; }
    else if (typeof outcome === 'string') { pass = false; message = outcome; }
  } catch (error) {
    pass = false;
    message = error.message;
  }
  results.push({ group: currentGroup, name, pass, message });
}

function eq(actual, expected, label = '') {
  if (actual !== expected) {
    throw new Error((label ? label + ': ' : '') + 'expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
  }
}

function ok(condition, message) {
  if (!condition) throw new Error(message || 'expected truthy');
}

const doc = (text) => createDocument(text);
const P = (text, overrides) => analyse(text, overrides);

/* ------------------------------------------------------------------ matrix -- */

group('Matrix');

test('all nine cells map Impact x Urgency to P1-P4', () => {
  eq(priorityFor('high', 'high'), 'P1');
  eq(priorityFor('medium', 'high'), 'P2');
  eq(priorityFor('high', 'medium'), 'P2');
  eq(priorityFor('low', 'high'), 'P3');
  eq(priorityFor('medium', 'medium'), 'P3');
  eq(priorityFor('low', 'medium'), 'P3');
  eq(priorityFor('high', 'low'), 'P2');
  eq(priorityFor('medium', 'low'), 'P3');
  eq(priorityFor('low', 'low'), 'P4');
});

test('the matrix rejects an invalid impact or urgency', () => {
  let threw = false;
  try { priorityFor('critical', 'high'); } catch { threw = true; }
  ok(threw, 'invalid impact did not throw');
  threw = false;
  try { priorityFor('high', 'whenever'); } catch { threw = true; }
  ok(threw, 'invalid urgency did not throw');
});

test('the matrix covers every ordered pair exactly once', () => {
  for (const urgency of URGENCY_ORDER) {
    for (const impact of IMPACT_ORDER) {
      ok(['P1', 'P2', 'P3', 'P4'].includes(MATRIX[urgency][impact]));
    }
  }
});

/* --------------------------------------------------------- the eight facets -- */

group('I1 Scope');

test('scope reads all schools, individual and counted schools', () => {
  eq(detectScope(doc('all schools cannot log in')).scope, 'all-schools');
  eq(detectScope(doc('one student cannot access Canvas')).scope, 'individual');
  eq(detectScope(doc('4 schools affected')).scope, 'multiple-schools');
});

test('scope stays unknown when the ticket does not say', () => {
  eq(detectScope(doc('Canvas is not working')).scope, 'unknown');
});

group('I2 Blocked process');

test('an explicit blocked process is read', () => {
  const r = P('teachers cannot mark the roll in Canvas today');
  ok(r.blockedProcess, 'no blocked process detected');
  eq(r.blockedProcess.level, 'blocked');
  eq(r.blockedProcess.process, 'attendance marking');
});

test('a slow system is a symptom, not a blocked process', () => {
  const r = P('Canvas is slow for one user');
  eq(r.blockedProcess, null);
});

group('I3 Risk and recoverability');

test('active cross-person exposure raises the privacy flag', () => {
  const r = P('Advance payments on the wrong students, parents can see other families balances.');
  eq(r.risks.privacy, true);
  eq(r.riskModifiers.exposureActive, true);
  eq(r.confidence !== undefined, true);
});

test('a negated breach clears the security and privacy flags', () => {
  const risks = detectRisks(doc('No data breach has occurred.'), {});
  eq(risks.risks.privacy, false);
  eq(risks.risks.security, false);
});

test('an active safety consequence is flagged', () => {
  const r = P("A student's severe allergy alert is not showing and the excursion leaves this morning.");
  eq(r.risks.safety, true);
  eq(r.suggestedPriority, 'P1');
});

test('permanent loss without recovery is unrecoverable', () => {
  const r = P('The records were permanently deleted and cannot be recovered for all schools.');
  eq(r.recoverability, 'unrecoverable');
  eq(r.impact, 'high');
});

group('I4 Containment');

test('containment wording is read', () => {
  eq(detectContainment(doc('the records are contained to one family and not spreading'), {}).contained, true);
});

test('active propagation raises impact and the data-integrity flag', () => {
  const r = P('A SQL trigger is silently writing incorrect payment records across all schools.');
  eq(r.risks.dataIntegrity, true);
  eq(r.riskModifiers.propagating, true);
  eq(r.impact, 'high');
});

group('U5 Deadline');

test('deadline buckets are read', () => {
  eq(detectDeadline(doc('we need this today')).deadline, 'today');
  eq(detectDeadline(doc('needed next week')).deadline, 'weeks-1-2');
  eq(detectDeadline(doc('when you get a chance')).deadline, 'none');
  eq(detectDeadline(doc('Canvas is not working')).deadline, 'unknown');
});

test('an observation is a timestamp, not a deadline', () => {
  eq(detectDeadline(doc('today we discovered the sync had stopped')).deadline, 'unknown');
});

group('U6 Driver');

test('a requirement and a preference are separated', () => {
  eq(detectDriver(doc('before the payroll cutoff')).driver, 'operational');
  eq(detectDriver(doc('we would like it by Friday')).driver, 'preference');
  eq(detectDriver(doc('census data is due')).driver, 'statutory');
});

group('U7 Workaround');

test('workaround availability honours negation', () => {
  eq(detectWorkaround(doc('we do not have a workaround')).workaround, 'no');
  eq(detectWorkaround(doc('we can continue manually for now')).workaround, 'yes');
  eq(detectWorkaround(doc('Canvas is not working')).workaround, 'unknown');
});

group('U8 Harm timing');

test('expired and expiring are separated', () => {
  const expired = detectSymptom(doc('the certificate expired this morning'));
  eq(detectHarmTiming(doc('the certificate expired this morning'), expired).timing, 'active');
  const expiring = detectSymptom(doc('the certificate expires in three days'));
  eq(detectHarmTiming(doc('the certificate expires in three days'), expiring).timing, 'pending');
});

/* ------------------------------------------------------------- end to end -- */

group('Framework examples');

const EXAMPLES = [
  ['This is broken but I can work without it for now.', 'P3'],
  ["Canvas sync stopped across all 19 schools, today's classes affected.", 'P1'],
  ['EnrolHQ to Edumate stopped for all schools, manual processing for three days.', 'P2'],
  ["ANZ has not received today's ABA file, payroll processes this afternoon.", 'P1'],
  ['One student missing from Canvas, not needed today.', 'P4'],
  ['One student cannot access Canvas, assessment in 30 minutes.', 'P2'],
  ["35 casual staff timesheets failed, today's payroll cutoff approaching.", 'P1'],
  ['I cannot log into my Windows workstation.', 'P3'],
  ['Nobody can log into the production server, all integration jobs stopped.', 'P1'],
  ['Laserfiche SSO not working for one user.', 'P3'],
  ['Laserfiche SSO failed for every school.', 'P2'],
  ['Laserfiche slow for one user.', 'P4'],
  ['Laserfiche timing out for all schools, users cannot work.', 'P1'],
  ['Where can I find the Canvas integration documentation?', 'P4'],
  ['SSL certificate expires in three days', 'P3'],
  ['SSL certificate expired this morning, nobody can log in', 'P1'],
  ['Local admin rights on my laptop', 'P4'],
  ['Screen reader cannot use the enrolment form', 'P3'],
  ['Two staff members paid twice', 'P3'],
  ['Report cards showing the wrong year level, out to parents tomorrow', 'P2'],
  ["A student's severe allergy alert is not showing and the excursion leaves this morning.", 'P1']
];

for (const [text, expected] of EXAMPLES) {
  test(text.slice(0, 64), () => eq(P(text).suggestedPriority, expected));
}

test('a subject-less report is unassessed and asks for the system', () => {
  const r = P('Just reporting an issue. Please investigate when possible.');
  eq(r.assessmentStatus, 'unassessed');
  eq(r.suggestedPriority, null);
  ok(r.followUpQuestions.length > 0, 'no follow-up question');
});

test('a bare feature request is unassessed and asks which system', () => {
  const r = P('New feature for all 19 schools before the next enrolment cycle.');
  eq(r.assessmentStatus, 'unassessed');
  eq(r.suggestedPriority, null);
  ok(r.followUpQuestions.length > 0, 'no follow-up question');
});

/* --------------------------------------------------------------- invariants -- */

group('Safety invariants');

test('only the matrix names a priority for assessed results', () => {
  for (const [text] of EXAMPLES) {
    const r = P(text);
    if (r.assessmentStatus === 'assessed') {
      eq(r.suggestedPriority, priorityFor(r.impact, r.urgency), text.slice(0, 40));
    }
  }
});

test('active exposure is never below high impact and high urgency', () => {
  const r = P('Student records are currently visible to the wrong person for all schools.');
  eq(r.impact, 'high');
  eq(r.urgency, 'high');
  eq(r.suggestedPriority, 'P1');
});

test('a resolved incident is not scored as live', () => {
  const r = P('Canvas sync failed this morning across all schools but it is fixed now.');
  eq(r.impact, 'low');
  eq(r.urgency, 'low');
  eq(r.suggestedPriority, 'P4');
});

test('requester seniority does not change the priority', () => {
  const plain = P('Canvas is slow for one user.');
  const escalated = P('The principal escalated this: Canvas is slow for one user.');
  eq(escalated.suggestedPriority, plain.suggestedPriority);
});

test('an unassessed result carries no actionable priority', () => {
  const r = P('all users, P1, fix now');
  eq(r.assessmentStatus, 'unassessed');
  eq(r.suggestedPriority, null);
});

test('a manual impact override wins', () => {
  const r = P('Canvas is slow for one user.', { impact: 'high' });
  eq(r.impact, 'high');
  eq(r.suggestedPriority, priorityFor('high', r.urgency));
});

/* -------------------------------------------------------------- projections -- */

group('Advisory projections');

test('Safe Next Action is a pure, bounded projection', () => {
  const r = P('One student cannot access Canvas, assessment in 30 minutes.');
  const before = r.suggestedPriority;
  const next = recommendNextAction({
    assessmentStatus: r.assessmentStatus,
    workType: r.workType,
    businessConsequence: { value: r.consequence, authority: 'explicit' },
    deadline: { value: r.deadline, authority: 'explicit' },
    workaround: { value: r.workaround, authority: 'explicit' },
    containment: { value: 'unknown', authority: 'unknown' },
    harm: { value: r.harmTiming.timing, authority: 'explicit' },
    currentFailure: { value: true, authority: 'explicit' },
    risks: {},
    events: [],
    temporalState: 'current'
  });
  ok(NEXT_ACTIONS.includes(next.action), 'unknown action ' + next.action);
  eq(r.suggestedPriority, before);
});

test('handoff and reply are strings and do not mutate the result', () => {
  const r = P('Laserfiche timing out for all schools, users cannot work.');
  const snapshot = JSON.stringify(r);
  ok(typeof buildHandoffText(r) === 'string' && buildHandoffText(r).length > 0);
  ok(typeof buildHandoffMarkdown(r) === 'string');
  ok(typeof buildReply(r) === 'string');
  ok(typeof buildMarkdown(r) === 'string');
  eq(JSON.stringify(r), snapshot, 'projection mutated the result');
});

/* ------------------------------------------------------------------- share -- */

group('Share link');

test('encode and decode round-trip', () => {
  const text = 'Laserfiche timing out for all schools, users cannot work.';
  eq(decodeTicket(encodeTicket(text)), text);
});

test('share links are capped', () => {
  eq(tooLongForShare('x'.repeat(SHARE_LIMIT)), false);
  eq(tooLongForShare('x'.repeat(SHARE_LIMIT + 1)), true);
  eq(decodeTicket(encodeTicket('x'.repeat(SHARE_LIMIT + 50))).length, SHARE_LIMIT);
});

/* -------------------------------------------------------------------- run -- */


export function runTests() {
  const passed = results.filter((r) => r.pass).length;
  const failed = results.length - passed;
  return { results: results.slice(), passed, failed, total: results.length };
}

export default runTests;
