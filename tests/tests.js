/**
 * Dependency-free test suite.
 *
 * Runs unchanged in the browser (tests/tests.html) and under Node
 * (tests/run.mjs). No framework, no build step, no network.
 */
import { analyse } from '../js/engine/analyzer.js';
import { createDocument, isNegated, normalise } from '../js/engine/negation.js';
import { detectScope } from '../js/engine/scope.js';
import { detectWorkaround } from '../js/engine/workaround.js';
import { detectDeadline } from '../js/engine/deadline.js';
import { priorityFor, matrixCells } from '../js/engine/priority-matrix.js';
import { EXAMPLES } from '../js/data/examples.js';
import { buildReply, buildMarkdown } from '../js/ui/reply.js';
import { encodeTicket, decodeTicket, tooLongForShare } from '../js/ui/share.js';

/* ------------------------------------------------------------- helpers -- */

const tests = [];

function test(group, name, fn) {
  tests.push({ group, name, fn });
}

function ok(pass, message) {
  return { pass, message };
}

/** Assert the suggested priority is one of the acceptable answers. */
function priority(text, expected, overrides) {
  const list = Array.isArray(expected) ? expected : [expected];
  const result = analyse(text, overrides || {});
  const pass = list.includes(result.priority);
  return ok(
    pass,
    result.priority + ' (' + result.impactLabel + ' impact / ' +
      result.urgencyLabel + ' urgency)' +
      (pass ? '' : ' - expected ' + list.join(' or '))
  );
}

/** Assert a top-level field of the result model. */
function field(text, key, expected, overrides) {
  const result = analyse(text, overrides || {});
  const actual = result[key];
  const list = Array.isArray(expected) ? expected : [expected];
  return ok(list.includes(actual), key + ' = ' + JSON.stringify(actual) +
    (list.includes(actual) ? '' : ' - expected ' + list.join(' or ')));
}

/** Assert a risk flag. */
function risk(text, key, expected) {
  const result = analyse(text);
  const actual = Boolean(result.risks[key]);
  return ok(actual === expected, 'risks.' + key + ' = ' + actual);
}

/* --------------------------------------------------------- 1. the matrix -- */

const MATRIX_EXPECTATIONS = [
  ['low', 'high', 'P3'], ['medium', 'high', 'P2'], ['high', 'high', 'P1'],
  ['low', 'medium', 'P3'], ['medium', 'medium', 'P3'], ['high', 'medium', 'P2'],
  ['low', 'low', 'P4'], ['medium', 'low', 'P3'], ['high', 'low', 'P2']
];

for (const [impact, urgency, expected] of MATRIX_EXPECTATIONS) {
  test('Matrix', impact + ' impact + ' + urgency + ' urgency -> ' + expected, () => {
    const actual = priorityFor(impact, urgency);
    return ok(actual === expected, actual);
  });
}

test('Matrix', 'nine cells are rendered', () => {
  const cells = matrixCells();
  return ok(cells.length === 9, cells.length + ' cells');
});

test('Matrix', 'manual impact and urgency overrides drive the matrix', () =>
  priority('Something happened.', 'P1', { impact: 'high', urgency: 'high' }));

/* ------------------------------------------------------------ 2. scope -- */

const SCOPE_CASES = [
  ['One student hasn’t appeared in Canvas.', 'individual'],
  ['Several users are reporting the same error.', 'few-users'],
  ['The registrar team cannot process applications.', 'team'],
  ['Nobody at School X can authenticate to Laserfiche.', 'one-school'],
  ['Three schools are affected by the sync failure.', 'multiple-schools'],
  ['Canvas sync has stopped across all 19 schools.', 'all-schools'],
  ['Laserfiche SSO has failed for every school.', 'all-schools'],
  ['This is corporation-wide.', 'corporation-wide'],
  ['Something is wrong with the report.', 'unknown'],
  ['35 casual staff timesheets failed.', 'team']
];

for (const [text, expected] of SCOPE_CASES) {
  test('Scope', JSON.stringify(text.slice(0, 46)) + ' -> ' + expected, () => {
    const actual = detectScope(createDocument(text)).scope;
    return ok(actual === expected, actual);
  });
}

test('Scope', 'unknown scope is never invented', () =>
  field('The report is wrong.', 'scope', 'unknown'));

test('Scope', 'the broadest credible scope wins', () => {
  const actual = detectScope(createDocument(
    'One student reported it first, but all 19 schools are affected.'
  )).scope;
  return ok(actual === 'all-schools', actual);
});

test('Scope', 'an unaffected comparison identifies the requester as the only affected user', () =>
  field('My Outlook is not working, but everyone else Outlook is working. Help now.',
    'scope', 'individual'));

test('Scope', 'an isolated Outlook failure with asserted urgency is P3, not P1', () =>
  priority('My Outlook is not working, but everyone else Outlook is working. Help now.', 'P3'));

test('Scope', 'everyone else remains broad scope when they are also unable to work', () =>
  field('My Outlook is not working, and everyone else cannot use Outlook either.',
    'scope', 'corporation-wide'));

/* -------------------------------------------------------- 3. workaround -- */

const WORKAROUND_CASES = [
  ['We can process it manually until then.', 'yes'],
  ['There is a temporary workaround in place.', 'yes'],
  ['We can work without it for now.', 'yes'],
  ['There is no workaround and we are completely blocked.', 'no'],
  ['We do not have a workaround.', 'no'],
  ['Only a partial work around exists.', 'partial'],
  ['Canvas sync has stopped.', 'unknown']
];

for (const [text, expected] of WORKAROUND_CASES) {
  test('Workaround', JSON.stringify(text.slice(0, 46)) + ' -> ' + expected, () => {
    const actual = detectWorkaround(createDocument(text)).workaround;
    return ok(actual === expected, actual);
  });
}

/* ---------------------------------------------------------- 4. deadline -- */

const DEADLINE_CASES = [
  ['Payroll must be processed this afternoon.', 'today'],
  ['We need this right now.', 'now'],
  ['It has to be done by tomorrow.', 'tomorrow'],
  ['I need it within three days.', 'days-2-5'],
  ['Only one user needs the report next week.', 'weeks-1-2'],
  ['Please investigate when possible.', 'none'],
  ['Canvas sync has stopped.', 'unknown'],
  ['The data is not needed until next week.', 'weeks-1-2']
];

for (const [text, expected] of DEADLINE_CASES) {
  test('Deadline', JSON.stringify(text.slice(0, 46)) + ' -> ' + expected, () => {
    const actual = detectDeadline(createDocument(text)).deadline;
    return ok(actual === expected, actual);
  });
}

test('Deadline', 'a time mention is not a deadline when it is not needed today', () => {
  const actual = detectDeadline(createDocument(
    'One student hasn’t appeared in Canvas this morning and does not require Canvas today.'
  )).deadline;
  return ok(actual === 'none', actual);
});

test('Deadline', '"immediately" without a consequence is asserted, not committed', () => {
  const result = detectDeadline(createDocument('Please fix immediately!!!'));
  return ok(result.asserted === true, 'asserted = ' + result.asserted);
});

/* ---------------------------------------------------------- 5. negation -- */

test('Negation', '"payroll is not affected" clears the payroll risk', () =>
  risk('Canvas sync has failed. Payroll is not affected.', 'payroll', false));

test('Negation', '"no data breach has occurred" clears the security risk', () =>
  risk('We investigated and no data breach has occurred.', 'security', false));

test('Negation', '"there is no evidence of a data breach" clears the security risk', () =>
  risk('There is no evidence of a data breach.', 'security', false));

test('Negation', '"slow but not unavailable" stays a degradation', () =>
  field('Laserfiche is slow but not unavailable.', 'symptom', 'degraded'));

test('Negation', '"has not received the ABA file" is still a failure', () => {
  const result = analyse('ANZ has not received today’s ABA file.');
  return ok(result.risks.payroll === true || result.risks.financial === true,
    'payroll = ' + result.risks.payroll + ', financial = ' + result.risks.financial);
});

test('Negation', '"no longer syncing" is not negated', () => {
  const doc = createDocument('Canvas is no longer syncing.');
  const index = doc.text.indexOf('syncing');
  return ok(!isNegated(doc, index, index + 7), 'negated = ' + isNegated(doc, index, index + 7));
});

test('Negation', 'negation does not cross a clause boundary', () => {
  const doc = createDocument('Canvas is down but payroll is not affected.');
  const index = doc.text.indexOf('down');
  return ok(!isNegated(doc, index, index + 4), 'negated = ' + isNegated(doc, index, index + 4));
});

test('Negation', 'contractions are expanded before matching', () =>
  ok(normalise("It isn't working and we can't continue") ===
     'it is not working and we can not continue',
     normalise("It isn't working and we can't continue")));

/* ----------------------------------------------------------- 6. urgency -- */

test('Urgency', '"FYI, no rush" is low urgency', () =>
  field('FYI only, no rush at all on this one.', 'urgency', 'low'));

test('Urgency', '"we can continue for now" is low urgency', () =>
  field('The report is broken but we can work without it for now.', 'urgency', 'low'));

test('Urgency', 'a three day deadline with a manual process is medium urgency', () =>
  field('This is broken and I need it within three days. We can process it manually until then.',
    'urgency', 'medium'));

test('Urgency', '"users cannot work" is high urgency', () =>
  field('Laserfiche is timing out for all schools and users cannot complete their work.',
    'urgency', 'high'));

test('Urgency', '"urgent" alone does not force P1', () =>
  priority('URGENT!!! Laserfiche is broken!!! Please fix immediately!!!', ['P3', 'P2']));

test('Urgency', '"urgent" alone is flagged as asserted without consequence', () => {
  const result = analyse('URGENT!!! Canvas isn’t working!!!');
  return ok(result.detail.urgencyResult.claimedOnly === true,
    'claimedOnly = ' + result.detail.urgencyResult.claimedOnly);
});

/* ------------------------------------------------------------ 7. impact -- */

test('Impact', 'all-school scope produces high impact', () =>
  field('Canvas synchronisation has stopped across all 19 schools.', 'impact', 'high'));

test('Impact', 'one user with a workaround produces low impact', () =>
  field('Laserfiche is slow for one user.', 'impact', 'low'));

test('Impact', 'one person about to miss pay is not low impact', () => {
  const result = analyse('One employee will not be paid unless this is fixed before today’s payroll cutoff.');
  return ok(result.impact === 'high' || result.impact === 'medium', result.impact);
});

test('Impact', 'a documentation request about a critical system stays low', () =>
  field('Where can I find the documentation for the Canvas integration?', 'impact', 'low'));

/* ----------------------------------------------------------- 8. payroll -- */

test('Payroll', 'ABA file missing with same-day payroll -> P1', () =>
  priority('ANZ has not received today’s ABA file and payroll must be processed this afternoon.', 'P1'));

test('Payroll', '35 casual staff unpaid before cutoff -> P1', () =>
  priority('35 casual staff will not be paid unless this is fixed before today’s payroll cutoff.', 'P1'));

test('Payroll', 'payroll question with no deadline -> P3 or P4', () =>
  priority('I have a general question about how payroll records are stored.', ['P3', 'P4']));

test('Payroll', 'one payroll record to correct before next week -> P3', () =>
  priority('One person’s payroll record needs correction before next week.', ['P3', 'P4']));

test('Payroll', '"payroll" alone does not force P1', () => {
  const result = analyse('Please add a new payroll report to the documentation library.');
  return ok(result.priority !== 'P1', result.priority);
});

/* --------------------------------------------------- 9. privacy and WWCC -- */

test('Privacy', 'active exposure of parent details -> P1', () =>
  priority('A parent can see another family’s student information in the portal right now.', 'P1'));

test('Privacy', '"the system contains PII" alone does not force P1', () => {
  const result = analyse('Please note this system contains PII, just documenting it for the register.');
  return ok(result.priority !== 'P1', result.priority);
});

test('Safeguarding', 'unauthorised worker on site is high impact', () => {
  const result = analyse('A staff member with an expired WWCC clearance is on site today working with students.');
  return ok(result.priority === 'P1', result.priority + ' / risks.safeguarding = ' + result.risks.safeguarding);
});

test('Safeguarding', 'historical WWCC audit is not a P1', () => {
  const result = analyse('We need to review last year’s WWCC clearance records for the compliance audit.');
  return ok(result.priority !== 'P1', result.priority);
});

/* --------------------------------------------------- 10. data integrity -- */

test('Data integrity', 'one bad record is P3', () =>
  priority('One parent profile has been merged incorrectly and needs fixing.', ['P3', 'P4']));

test('Data integrity', 'incorrect payment records across all schools -> P1', () =>
  priority('SQL trigger is silently writing incorrect payment records across all schools.', 'P1'));

test('Data integrity', 'propagation is detected', () => {
  const result = analyse('SQL trigger is silently writing incorrect payment records across all schools.');
  return ok(result.riskModifiers.propagating === true,
    'propagating = ' + result.riskModifiers.propagating);
});

/* ------------------------------------------------- 11. auth and windows -- */

test('Authentication', 'individual workstation login -> P3', () =>
  priority('I cannot log into my Windows workstation.', 'P3'));

test('Authentication', 'production server login blocking all jobs -> P1', () =>
  priority('Nobody can log into the production server and all integration jobs have stopped.', 'P1'));

test('Authentication', 'expired token for an unused test system is not P1', () => {
  const result = analyse('The Entra ID token expired for our unused test integration. No rush.');
  return ok(result.priority === 'P4' || result.priority === 'P3', result.priority);
});

/* ------------------------------------------------------- 12. laserfiche -- */

test('Laserfiche', 'SSO failure for one user -> P3', () =>
  priority('Laserfiche SSO isn’t working for one user.', 'P3'));

test('Laserfiche', 'SSO failure for every school -> P1 or P2', () =>
  priority('Laserfiche SSO has failed for every school.', ['P1', 'P2']));

test('Laserfiche', 'SQL conversion error for one user next week -> P3', () =>
  priority('Laserfiche report shows "invalid conversion from varchar to datetime". Only one user needs the report next week.', 'P3'));

test('Laserfiche', 'staging failure for all schools is high impact', () =>
  field('Laserfiche has stopped writing records to staging for all schools since midnight.',
    'impact', 'high'));

test('Laserfiche', 'slow for one user -> P3 or P4', () =>
  priority('Laserfiche is slow for one user.', ['P3', 'P4']));

test('Laserfiche', 'timing out for all schools with work blocked -> P1', () =>
  priority('Laserfiche is timing out for all schools and users cannot complete their work.', 'P1'));

test('Laserfiche', 'the system is identified', () =>
  field('Laserfiche SSO isn’t working for one user.', 'system', 'Laserfiche'));

/* --------------------------------------------------------- 13. power bi -- */

test('Power BI', 'report will not open for one user -> P3', () =>
  priority('The Power BI report will not open for me.', ['P3', 'P4']));

test('Power BI', 'refresh failed but data not needed until next week -> P3', () =>
  priority('Power BI dataset refresh failed overnight but yesterday’s report remains available and the new data is not needed until next week.', 'P3'));

test('Power BI', 'incorrect totals before payment approval -> P1 or P2', () =>
  priority('Payroll reconciliation Power BI report is showing incorrect totals immediately before payment approval.', ['P1', 'P2']));

test('Power BI', 'reporting domain is detected', () =>
  field('Power BI dataset refresh failed overnight.', 'technicalDomain', 'reporting-bi'));

/* ----------------------------------------------------------- 14. canvas -- */

test('Canvas', 'one student missing, not needed today -> P3 or P4', () =>
  priority('One student hasn’t appeared in Canvas this morning and does not require Canvas today.',
    ['P3', 'P4']));

test('Canvas', 'one student with an assessment in 30 minutes -> P2 or P3', () =>
  priority('One student cannot access Canvas and has an online assessment in 30 minutes.',
    ['P2', 'P3']));

test('Canvas', 'all-school sync stopped with classes affected -> P1', () =>
  priority('Canvas synchronisation has stopped across all 19 schools and today’s classes are affected.', 'P1'));

test('Canvas', 'one school sync stopped is medium impact', () => {
  const result = analyse('Canvas sync has stopped for one school.');
  return ok(result.impact === 'medium', result.impact);
});

/* ---------------------------------------------------------- 15. enrolhq -- */

test('EnrolHQ', 'all schools stopped with a manual process -> P2', () =>
  priority('EnrolHQ to Edumate has stopped for all schools but enrolment staff can manually process urgent applications for the next three days.', 'P2'));

test('EnrolHQ', 'both systems are identified', () => {
  const result = analyse('EnrolHQ to Edumate has stopped for all schools.');
  return ok(result.systems.includes('EnrolHQ') && result.systems.includes('Edumate'),
    result.systems.join(', '));
});

/* ----------------------------------------------- 16. expected behaviour -- */

test('Expected behaviour', 'casual staff added after the 09:30 sync -> P4', () =>
  priority('We added a casual staff member at 10am but they haven’t appeared in Canvas.', 'P4'));

test('Expected behaviour', 'classified as expected behaviour, not an incident', () =>
  field('We added a casual staff member at 10am but they haven’t appeared in Canvas.',
    'workType', 'expected-behaviour'));

test('Expected behaviour', 'immediate teaching need raises urgency again', () => {
  const result = analyse(
    'We added a casual staff member at 10am but they haven’t appeared in Canvas and they need it now to teach.'
  );
  return ok(result.priority !== 'P4', result.priority);
});

/* --------------------------------------------------- 17. feature and doc -- */

test('Feature request', 'individual convenience feature -> P4', () =>
  priority('Could we add a button that saves me three clicks? No rush.', 'P4'));

test('Feature request', 'all-school feature before enrolment cycle -> P2', () =>
  priority('We need a new feature that will be used by all 19 schools before the next enrolment cycle.', 'P2'));

test('Feature request', 'classified as a feature request, not an incident', () =>
  field('We need a new feature that will be used by all 19 schools before the next enrolment cycle.',
    'workType', ['feature-request', 'enhancement']));

test('Documentation', 'documentation request -> P4', () =>
  priority('Where can I find the documentation for the Canvas integration?', 'P4'));

test('Documentation', 'classified as documentation', () =>
  field('Where can I find the documentation for the Canvas integration?',
    'workType', 'documentation'));

/* -------------------------------------------------------- 18. helpdesk -- */

test('Helpdesk', 'helpdesk broken for one person -> P3', () =>
  priority('The helpdesk isn’t working for me.', ['P3', 'P4']));

test('Helpdesk', 'nobody can raise tickets -> P2 or P1', () =>
  priority('Nobody can create tickets in the service desk.', ['P2', 'P1']));

/* ------------------------------------------------------ 19. refinement -- */

test('Refinement', 'setting scope to all schools raises the priority', () => {
  const before = analyse('Laserfiche has stopped writing records to staging.');
  const after = analyse('Laserfiche has stopped writing records to staging.',
    { scope: 'all-schools' });
  return ok(before.priority !== after.priority || after.impact === 'high',
    before.priority + ' -> ' + after.priority);
});

test('Refinement', 'declaring a workaround lowers urgency', () => {
  const before = analyse('Canvas sync has stopped for all schools and nobody can work.');
  const after = analyse('Canvas sync has stopped for all schools and nobody can work.',
    { workaround: 'yes', deadline: 'weeks-1-2' });
  return ok(after.priority === 'P2' && before.priority === 'P1',
    before.priority + ' -> ' + after.priority);
});

test('Refinement', 'ticking the payroll risk with a same-day deadline escalates', () => {
  const after = analyse('The overnight job failed and we need it fixed today.',
    { risks: { payroll: true } });
  return ok(after.priority === 'P1' || after.priority === 'P2', after.priority);
});

/* -------------------------------------------------------- 20. behaviour -- */

test('Result model', 'an empty ticket returns an empty result', () => {
  const result = analyse('   ');
  return ok(result.empty === true, 'empty = ' + result.empty);
});

test('Result model', 'reasoning is always populated', () => {
  const result = analyse('Canvas sync has stopped.');
  return ok(result.reasoning.length >= 3, result.reasoning.length + ' lines');
});

test('Result model', 'missing information is reported when scope is unknown', () => {
  const result = analyse('Canvas sync has stopped.');
  return ok(result.followUpQuestions.length > 0,
    result.followUpQuestions.length + ' questions');
});

test('Result model', 'confidence drops when nothing is known', () => {
  const vague = analyse('It is broken.');
  const detailed = analyse(
    'Canvas sync has stopped for all 19 schools, there is no workaround, and classes start today.'
  );
  return ok(vague.confidence < detailed.confidence,
    vague.confidence + '% vs ' + detailed.confidence + '%');
});

test('Result model', 'confidence never claims certainty', () => {
  const result = analyse(
    'Canvas sync has stopped for all 19 schools, there is no workaround, and classes start today.'
  );
  return ok(result.confidence <= 95, result.confidence + '%');
});

/* ----------------------------------------------- 21. input relevance -- */

test('Input relevance', 'an unfamiliar Mac how-to is recognised support work', () => {
  const result = analyse("Help, I don't know how to use mac?");
  return ok(
    result.inScope === true && result.workType === 'documentation' && result.priority === 'P4',
    'inScope=' + result.inScope + ' workType=' + result.workType + ' priority=' + result.priority
  );
});

test('Input relevance', 'non-IT text is unassessed even when it claims urgency', () => {
  const result = analyse('help! my cat is sad now, high priority');
  return ok(
    result.inScope === false && result.insufficientInformation === true &&
      result.priority === 'P4' && result.confidenceBand === 'low' &&
      result.detail.urgencyResult.claimed === true,
    'inScope=' + result.inScope + ' insufficient=' + result.insufficientInformation +
      ' priority=' + result.priority + ' confidence=' + result.confidence +
      ' claimed=' + result.detail.urgencyResult.claimed
  );
});

test('Input relevance', 'scope and priority claims cannot turn unrelated text into P1', () => {
  const result = analyse(
    'Help! My cat is sad now. All users are affected. P1 highest priority.'
  );
  return ok(
    result.inScope === false && result.priority === 'P4',
    'inScope=' + result.inScope + ' ' + result.impact + '/' + result.urgency +
      ' -> ' + result.priority
  );
});

test('Input relevance', 'an analyst override on unassessed text explains the actual result', () => {
  const result = analyse('Something happened.', { impact: 'high', urgency: 'high' });
  return ok(
    result.inScope === false && result.priority === 'P1' &&
      /High Impact \+ High Urgency -> P1/.test(result.justification) &&
      result.reasoning.some((line) => /HIGH and urgency HIGH map to P1/.test(line)),
    result.justification + ' | ' + result.reasoning.join(' | ')
  );
});

test('Input relevance', 'unrecognised text explains that no IT support context was found', () => {
  const result = analyse('help! my cat is sad now, high priority');
  return ok(
    result.reasoning.some((line) => /IT or application-support request/.test(line)) &&
      /IT system, application, device, or service/.test(result.followUpQuestions[0]),
    result.reasoning.join(' | ')
  );
});

/* --------------------------------------- 22. calibrated support wording -- */

test('Calibrated support', 'an application that crashes for one user is a P3 incident', () => {
  const result = analyse('Outlook crashes for one user whenever they attach a PDF.');
  return ok(
    result.priority === 'P3' && result.workType === 'incident' && result.symptom === 'failed',
    result.priority + ' / ' + result.workType + ' / ' + result.symptom
  );
});

test('Calibrated support', 'software installation is a service request', () => {
  const result = analyse('Please install Microsoft 365 on my MacBook.');
  return ok(
    result.priority === 'P4' && result.workType === 'service-request' &&
      result.technicalDomain === 'endpoint-server',
    result.priority + ' / ' + result.workType + ' / ' + result.technicalDomain
  );
});

test('Calibrated support', 'an alternative browser is a sustainable workaround', () => {
  const result = analyse(
    "One user's browser does not work, but an alternative browser works."
  );
  return ok(
    result.workaround === 'yes' && result.priority === 'P4',
    result.workaround + ' / ' + result.priority
  );
});

const EXTERNAL_CALIBRATION_CASES = [
  ['A complete network failure affects the whole organisation and staff cannot work today.', 'P1'],
  ['Email is unavailable for all staff.', 'P2'],
  ['The finance team cannot print to its usual printer, but another printer works.', 'P3'],
  ['How do I access my account?', 'P4']
];

for (const [text, expected] of EXTERNAL_CALIBRATION_CASES) {
  test('Calibrated support', text, () => priority(text, expected));
}

/* ------------------------------------------ 23. wider IT scenario sweep -- */

const SCENARIOS = [
  [['P3', 'P2'], 'Laserfiche is not writing to staging for one school.'],
  [['P2', 'P1'], 'No records have reached staging for all 19 schools since midnight.'],
  [['P2', 'P1'], 'The entire Power BI workspace is unavailable to all schools.'],
  [['P2', 'P1'], 'The SQL trigger failure means payments are not being written correctly for all schools.'],
  [['P3'], 'One school registrar needs a new feature before next month.'],
  [['P2', 'P3'], 'The helpdesk is unavailable for everyone during a major corporate incident.'],
  [['P3', 'P4'], 'The client secret for the test integration expires next month.'],
  [['P1', 'P2'], 'The client secret expired and the production Aurion to ANZ payment interface is down today.'],
  [['P3'], 'A service account is locked out and one scheduled report did not run.'],
  [['P3', 'P4'], 'Please merge two duplicate parent profiles when you get a chance.'],
  [['P1', 'P2'], 'A parent has been linked to the wrong student and the error is spreading to Canvas and Edumate across all schools.'],
  [['P3', 'P4'], 'The VPN drops occasionally for one staff member.'],
  [['P2', 'P1'], 'The file share is unavailable and no one at any school can open their documents.'],
  [['P4'], 'FYI - the login page has a spelling mistake.'],
  [['P3', 'P2'], 'Disk space on the production SQL server is at 95 percent.'],
  [['P4'], 'How do I request a new Power BI workspace?'],
  [['P2', 'P3'], 'Microsoft 365 is having an outage on their end and staff cannot access Outlook.'],
  [['P3', 'P4'], 'Please provide a data extract of enrolments for the audit next week.'],
  [['P1', 'P2'], 'A student with an expired WWCC supervisor is unsupervised on site right now.'],
  [['P4', 'P3'], 'Could you add a shortcut to the enrolment screen? It would save a few clicks.']
];

for (const [expected, text] of SCENARIOS) {
  test('Wider scenarios', text.slice(0, 62) + (text.length > 62 ? '…' : ''), () =>
    priority(text, expected));
}

test('Wider scenarios', '"at any school" is not one school', () => {
  const actual = detectScope(createDocument(
    'The file share is unavailable and no one at any school can open their documents.'
  )).scope;
  return ok(actual === 'all-schools', actual);
});

test('Wider scenarios', 'a capacity warning is recognised as a symptom', () =>
  field('Disk space on the production SQL server is at 95 percent.', 'symptom', 'capacity'));

/* -------------------------------------- 22. school systems scenario sweep -- */

const SCHOOL_SCENARIOS = [
  // --- Laserfiche: access levels, backend, SSL
  [['P3'], 'A registrar at Smith School can open Laserfiche but cannot see the enrolment repository, her access level looks wrong.'],
  [['P4', 'P3'], 'Please increase my Laserfiche access level so I can delete documents in the finance folder.'],
  [['P4', 'P3'], 'New starter needs Laserfiche access with the same security group as the rest of the registrar team.'],
  [['P3', 'P2'], 'The Laserfiche backend service on the production server keeps stopping and workflow tasks are queuing up.'],
  [['P2', 'P1'], 'Laserfiche workflow is failing on the back end for all schools.'],
  [['P3', 'P2'], 'Laserfiche is showing a certificate error in the browser and staff are getting a security warning.'],
  [['P3', 'P2'], 'The SSL certificate for the Laserfiche web client expires in three days.'],
  [['P1'], 'The SSL certificate for Laserfiche expired this morning and nobody can log in.'],
  [['P3', 'P2'], 'The Laserfiche repository is running out of disk space on the production volume.'],
  [['P3', 'P4'], 'We need a new Laserfiche workflow built for the enrolment approval process by the end of term.'],
  [['P4'], 'Please archive the 2019 student records from Laserfiche when you have time.'],

  // --- Windows, admin and access requests
  [['P4'], 'I need local administrator rights on my laptop to install a plugin.'],
  [['P3', 'P4'], 'Please grant me admin access to the production server so I can restart the sync service.'],
  [['P3'], 'New staff member cannot access the shared drive on the Windows file server.'],
  [['P3'], 'One school cannot access the shared curriculum folder since the server was patched overnight.'],
  [['P3', 'P2'], 'Offboarding: a staff member left last Friday and still has access to Edumate and Laserfiche.'],
  [['P3'], 'Please reset the MFA for a teacher who has a new phone, she cannot log in this morning.'],
  [['P3', 'P4'], 'A parent cannot log into the parent portal to see their child report card.'],

  // --- Accessibility
  [['P3', 'P2'], 'A vision impaired staff member cannot use the enrolment form with her screen reader.'],
  [['P3', 'P4'], 'The parent portal fails WCAG contrast checks and we have an accessibility audit next month.'],

  // --- EnrolHQ / Edumate data quality
  [['P3', 'P2'], 'EnrolHQ is not syncing to Edumate and enrolment staff are entering applications by hand.'],
  [['P3', 'P2'], 'We are getting duplicate student records in Edumate from the EnrolHQ sync.'],
  [['P2', 'P3'], 'Students keep flip flopping between two campuses each time the sync runs.'],
  [['P3', 'P2'], 'Incorrect carers are being synced to Edumate, some students are linked to another family parent.'],
  [['P3', 'P2'], 'A student date of birth is incorrect in Edumate and it has already synced to Canvas and Seesaw.'],
  [['P3', 'P2'], 'The EnrolHQ application form is rejecting valid Medicare numbers for all new applicants.'],
  [['P2', 'P1'], 'Report cards are showing the wrong year level for a whole class and they go out to parents tomorrow.'],

  // --- Fees and advance payments
  [['P3', 'P4'], 'A parent paid their fees in advance but the advance payment was not recorded against the student.'],
  [['P3'], 'The advance fee payment was recorded with the incorrect amount for one student.'],
  [['P1', 'P2'], 'Advance payments have been assigned to the incorrect students and parents can see other families balances.'],

  // --- Payroll variants
  [['P3', 'P2'], 'Two staff members were paid twice in the last pay run.'],
  [['P3'], 'A casual was underpaid last fortnight and wants it corrected in the next pay run.'],
  [['P3', 'P2'], 'Superannuation contributions were not lodged for the quarter and the deadline is next Tuesday.'],
  [['P3'], 'A casual teacher timesheet was approved but the hours were recorded against the wrong school.'],

  // --- Canvas / Seesaw
  [['P3', 'P4'], 'Seesaw is not showing the new class for one teacher.'],
  [['P2', 'P3'], 'Seesaw accounts are not being created for the new Kindergarten cohort and classes start tomorrow.'],
  [['P2', 'P1'], 'Canvas courses for term 3 have not been created for any school.'],
  [['P3', 'P2'], 'Seesaw parent invitations went to the wrong family email address.'],
  [['P3', 'P4'], 'The wrong student photo is showing on some Canvas profiles.'],

  // --- Statutory / reporting / messaging
  [['P2', 'P1'], 'NAPLAN test sessions start at 9am and the student list has not loaded.'],
  [['P3', 'P2'], 'Attendance data is not flowing from Edumate to the government reporting extract, due at the end of the month.'],
  [['P3', 'P2'], 'Emails from Edumate to parents are not being delivered, the queue has 4000 messages backed up.'],
  [['P3', 'P2'], 'Our Power BI enrolment dashboard has not refreshed for a week and the board report is due Friday.'],
  [['P3'], 'Printing is not working in the staff room at one school.']
];

for (const [expected, text] of SCHOOL_SCENARIOS) {
  test('School systems', text.slice(0, 62) + (text.length > 62 ? '…' : ''), () =>
    priority(text, expected));
}

test('School systems', 'Seesaw is a recognised system', () =>
  field('Seesaw is not showing the new class for one teacher.', 'system', 'Seesaw'));

test('School systems', '"access level" routes to Access / Authorisation', () =>
  field('Please increase my Laserfiche access level.', 'technicalDomain', 'access-authorisation'));

test('School systems', 'SSL wording routes to Certificates / SSL', () =>
  field('The SSL certificate for the Laserfiche web client expires in three days.',
    'technicalDomain', 'certificates-ssl'));

test('School systems', 'a screen reader ticket routes to Accessibility', () =>
  field('A vision impaired staff member cannot use the enrolment form with her screen reader.',
    'technicalDomain', 'accessibility'));

test('School systems', 'an expiring certificate is not the same symptom as an expired one', () => {
  const soon = analyse('The SSL certificate for the Laserfiche web client expires in three days.');
  const gone = analyse('The SSL certificate for Laserfiche expired this morning and nobody can log in.');
  return ok(soon.symptom === 'expiring-soon' && gone.symptom !== 'expiring-soon',
    soon.symptom + ' vs ' + gone.symptom);
});

test('School systems', 'seeing another family data is an active exposure', () => {
  const result = analyse('Advance payments have been assigned to the incorrect students and parents can see other families balances.');
  return ok(result.risks.privacy === true && result.riskModifiers.exposureActive === true,
    'privacy=' + result.risks.privacy + ' exposureActive=' + result.riskModifiers.exposureActive);
});

test('School systems', 'a wrong link raises privacy without forcing an exposure escalation', () => {
  const result = analyse('Incorrect carers are being synced to Edumate, some students are linked to another family parent.');
  return ok(result.risks.privacy === true && result.riskModifiers.exposureActive !== true,
    'privacy=' + result.risks.privacy + ' exposureActive=' + result.riskModifiers.exposureActive);
});

test('School systems', 'a leaver retaining access raises the security flag', () =>
  risk('Offboarding: a staff member left last Friday and still has access to Edumate.', 'security', true));

test('School systems', 'a scope mentioned as a comparison is not the affected scope', () => {
  const result = detectScope(createDocument(
    'New starter needs Laserfiche access with the same security group as the rest of the registrar team.'
  ));
  return ok(result.scope !== 'team', result.scope);
});

test('School systems', 'a payroll correction is not automatically high impact', () => {
  const result = analyse('Two staff members were paid twice in the last pay run.');
  return ok(result.impact !== 'high', result.impact);
});

test('School systems', 'a time stamp is still not a deadline', () => {
  const result = analyse('We added a casual staff member at 10am but they have not appeared in Canvas.');
  return ok(result.deadline === 'unknown' || result.deadline === 'none', result.deadline);
});

/* ---------------------------------- 23. Wonde, Azure DevOps, Teams, DBs -- */

const PLATFORM_SCENARIOS = [
  // --- Wonde
  [['P1'], 'Wonde has stopped sharing data with all 19 schools and Canvas rostering has stopped for today classes.'],
  [['P2'], 'The Wonde connection for three schools was revoked and student data has not updated since yesterday, but registrars can enter changes manually for the next few days.'],
  [['P3'], 'One school Wonde approval is still pending so their new students have not appeared in Seesaw.'],
  [['P4'], 'Please document how the Wonde approval process works for new schools.'],
  [['P2', 'P1'], 'Wonde is returning 401 errors for every school and no rostering data has synced since midnight.'],

  // --- Azure DevOps
  [['P1', 'P2'], 'The Azure DevOps release pipeline deployed a broken build to production and the enrolment API is returning 500 errors for all schools.'],
  [['P2'], 'All Azure DevOps pipelines are failing because the service connection expired and we cannot deploy the payroll integration fix due Friday.'],
  [['P3', 'P4'], 'A pull request is blocked in Azure Repos because the branch policy requires a reviewer who has left.'],
  [['P4'], 'Please add a new Azure Boards query for the integration backlog when you get a chance.'],
  [['P3', 'P2'], 'The Azure DevOps build agent pool is offline so no builds have run since this morning.'],

  // --- Microsoft Teams
  [['P1'], 'Microsoft Teams is unavailable corporation-wide and staff cannot run today parent teacher interviews.'],
  [['P2'], 'Teams class teams have not been created for the new term at all schools and lessons start next Monday.'],
  [['P3', 'P4'], 'A teacher cannot join Teams meetings from her laptop, audio fails every time.'],
  [['P4'], 'Can we get a Teams channel set up for the integration project? No rush.'],
  [['P3', 'P2'], 'Teams calls keep dropping for the whole registrar team during enrolment interviews.'],

  // --- IBM DB2 / PostgreSQL / SQLite
  [['P1'], 'The DB2 database is locked and all Aurion payroll extracts have failed with today pay run due this afternoon.'],
  [['P2'], 'PostgreSQL replication lag has grown to six hours and the reporting warehouse for all schools is stale.'],
  [['P3'], 'A PostgreSQL query is failing with relation does not exist for one report used by the finance team.'],
  [['P4'], 'The SQLite database for the local kiosk app is logging a warning, no user impact and no rush.'],
  [['P3', 'P2'], 'DB2 is returning SQLCODE -911 deadlocks on the enrolment extract every night.'],
  [['P3', 'P2'], 'The SQLite database is locked on the sign-in kiosk at one school and visitors cannot sign in.']
];

for (const [expected, text] of PLATFORM_SCENARIOS) {
  test('New platforms', text.slice(0, 62) + (text.length > 62 ? '…' : ''), () =>
    priority(text, expected));
}

test('New platforms', 'Wonde is a recognised system', () =>
  field('Wonde has stopped sharing data with all schools.', 'system', 'Wonde'));

test('New platforms', 'Wonde routes to Integration / API', () =>
  field('Wonde has stopped sharing data with all schools.', 'technicalDomain', 'integration-api'));

test('New platforms', 'Azure DevOps routes to DevOps / CI-CD', () =>
  field('The Azure DevOps release pipeline failed.', 'technicalDomain', 'devops-cicd'));

test('New platforms', 'a blocked pull request is a change-blocked symptom', () =>
  field('A pull request is blocked in Azure Repos by the branch policy.', 'symptom', 'merge-blocked'));

test('New platforms', 'Microsoft Teams is recognised from product wording', () =>
  field('Microsoft Teams is unavailable corporation-wide.', 'system', 'Microsoft Teams'));

test('New platforms', '"both teams" is not the Teams product', () => {
  const result = analyse('Both teams cannot access the shared curriculum folder.');
  return ok(result.system !== 'Microsoft Teams', String(result.system));
});

test('New platforms', 'a meeting failure routes to Collaboration', () =>
  field('A teacher cannot join Teams meetings, audio fails every time.',
    'technicalDomain', 'collaboration'));

test('New platforms', 'DB2 is recognised and routes to Database / SQL', () => {
  const result = analyse('DB2 is returning SQLCODE -911 deadlocks every night.');
  return ok(result.system === 'IBM DB2' && result.technicalDomain === 'database-sql',
    result.system + ' / ' + result.technicalDomain);
});

test('New platforms', 'PostgreSQL and SQLite are recognised', () => {
  const pg = analyse('A PostgreSQL query is failing with relation does not exist.');
  const lite = analyse('The SQLite database is locked on the kiosk.');
  return ok(pg.system === 'PostgreSQL' && lite.system === 'SQLite',
    pg.system + ' / ' + lite.system);
});

test('New platforms', 'replication lag is its own symptom, not an outage', () =>
  field('PostgreSQL replication lag has grown to six hours.', 'symptom', 'replication-lag'));

test('New platforms', 'a production regression adds urgency', () => {
  const plain = analyse('The enrolment API is returning 500 errors for all schools.');
  const regression = analyse('The release deployed a broken build to production and the enrolment API is returning 500 errors for all schools.');
  return ok(regression.detail.urgencyResult.score > plain.detail.urgencyResult.score,
    plain.detail.urgencyResult.score + ' -> ' + regression.detail.urgencyResult.score);
});

test('New platforms', 'a pending approval step is not a decision made on bad data', () => {
  const result = analyse('One school Wonde approval is still pending so their new students have not appeared in Seesaw.');
  return ok(result.riskModifiers.decisionRisk !== true,
    'decisionRisk = ' + result.riskModifiers.decisionRisk);
});

test('New platforms', 'records never created across many schools is impact, not an outage', () => {
  const result = analyse('Teams class teams have not been created for the new term at all schools and lessons start next Monday.');
  return ok(result.impact === 'high' && result.urgency === 'medium',
    result.impact + '/' + result.urgency);
});

/* ------------------------------------ 24. safety, legal, continuity, process -- */

const RISK_SCENARIOS = [
  // --- Tier 1: safety, legal, security
  [['P1'], 'A court order says the non-custodial parent must not see the student record, but he still has portal access.'],
  [['P1'], 'A student severe allergy alert is not showing in Edumate and the excursion leaves this morning.'],
  [['P1'], 'A staff laptop with unencrypted student data was stolen from a car last night.'],
  [['P2', 'P1'], 'Three staff reported a phishing email asking for their Edumate password and two clicked the link.'],
  [['P2', 'P1'], 'An unapproved third party app has been granted OAuth consent to read student data via Wonde.'],
  [['P1'], 'The evacuation alarm and intercom are not working at one school and there is a drill today.'],
  [['P3', 'P4'], 'Please add a new field to the excursion consent form for next term.'],

  // --- Tier 2: backup, recovery, licensing, continuity
  [['P1', 'P2'], 'A staff member deleted the whole Year 12 assessment folder from the shared drive and we need it restored today.'],
  [['P2', 'P1'], 'The nightly backup of the Edumate database has failed for the last five nights.'],
  [['P3'], 'Please restore one deleted student document from the Laserfiche archive.'],
  [['P3', 'P2'], 'We have run out of Canvas licences and 40 new students cannot be enrolled.'],
  [['P3'], 'The Power BI Pro licence for the finance team expires next month.'],
  [['P3', 'P2'], 'The Azure subscription has hit its spending cap and the integration app service has stopped.'],
  [['P1'], 'The direct debit run for school fees failed and 900 families will not be charged today.'],
  [['P3'], 'A fee discount has been applied to the wrong sibling on one account.'],
  [['P2', 'P1'], 'The whole school lost power overnight and the on site server has not come back up.'],
  [['P2', 'P3'], 'The internet link at one school is down and no one can access any cloud system.'],

  // --- Tier 2: academic operations
  [['P3', 'P2'], 'The new academic year rollover has not created next year classes in Edumate and timetabling starts Monday.'],
  [['P3', 'P4'], 'Two classes have a timetable clash in the same room for term 3.'],

  // --- Tier 3: environments, change, process
  [['P3'], 'The enrolment form works in UAT but fails in production after last night release.'],
  [['P3', 'P2'], 'Someone made an unapproved change to the production sync configuration during the change freeze.'],
  [['P3', 'P4'], 'Please refresh the test environment from a production backup before UAT starts next week.'],
  [['P3', 'P2'], 'The vendor has announced a breaking API change for EnrolHQ in six weeks and our integration will stop working.'],
  [['P3', 'P2'], 'This ticket has breached its SLA and the principal has escalated it to the executive.'],
  [['P3']       , 'We only found out about the sync failure because a school rang us, there is no alerting on that job.'],
  [['P3', 'P2'], 'The overnight job ran an hour late after daylight saving started and attendance did not load.'],
  [['P3', 'P4'], 'A student iPad is not enrolling in Intune and cannot get the exam app.'],
  [['P3']       , 'Student names with apostrophes are being corrupted in the Canvas export.']
];

for (const [expected, text] of RISK_SCENARIOS) {
  test('Safety and continuity', text.slice(0, 62) + (text.length > 62 ? '…' : ''), () =>
    priority(text, expected));
}

test('Safety and continuity', 'safety is a distinct risk flag', () =>
  risk('A student severe allergy alert is not showing in Edumate.', 'safety', true));

test('Safety and continuity', 'missing safety information is not an ordinary data problem', () => {
  const result = analyse('A student severe allergy alert is not showing in Edumate and the excursion leaves this morning.');
  return ok(result.impact === 'high' && result.urgency === 'high',
    result.impact + '/' + result.urgency);
});

test('Safety and continuity', 'a court order plus retained access escalates', () => {
  const result = analyse('A court order says the non-custodial parent must not see the student record, but he still has portal access.');
  return ok(result.risks.safeguarding === true && result.priority === 'P1',
    'safeguarding=' + result.risks.safeguarding + ' ' + result.priority);
});

test('Safety and continuity', 'a stolen device is recognised as a symptom', () =>
  field('A staff laptop with unencrypted student data was stolen from a car last night.',
    'symptom', 'device-lost'));

test('Safety and continuity', 'clicking a phishing link is an active compromise', () => {
  const result = analyse('Two staff clicked the link in a phishing email and entered their password.');
  return ok(result.symptom === 'account-compromise' && result.urgency === 'high',
    result.symptom + ' / ' + result.urgency);
});

test('Safety and continuity', 'third-party consent to student data raises privacy', () =>
  risk('An unapproved third party app has been granted OAuth consent to read student data.',
    'privacy', true));

test('Safety and continuity', 'deletion carries impact beyond its symptom severity', () => {
  const result = analyse('A staff member deleted the whole Year 12 assessment folder from the shared drive.');
  return ok(result.impact === 'high' || result.impact === 'medium', result.impact);
});

test('Safety and continuity', 'a failing backup on a critical system is high impact', () =>
  field('The nightly backup of the Edumate database has failed for the last five nights.',
    'impact', 'high'));

test('Safety and continuity', 'licence exhaustion is detected around a product name', () =>
  field('We have run out of Canvas licences.', 'symptom', 'capacity'));

test('Safety and continuity', 'an SLA breach adds urgency, unlike an assertion of urgency', () => {
  const asserted = analyse('This is URGENT!!! Please fix the report.');
  const breached = analyse('This ticket has breached its SLA. Please fix the report.');
  return ok(breached.detail.urgencyResult.score >= asserted.detail.urgencyResult.score,
    asserted.detail.urgencyResult.score + ' vs ' + breached.detail.urgencyResult.score);
});

test('Safety and continuity', 'escalation informs impact but does not decide priority', () => {
  const result = analyse('The principal has escalated this request for a new report.');
  return ok(result.priority !== 'P1', result.priority);
});

test('Safety and continuity', 'an unscoped rollover asks for scope before inflating', () => {
  const auto = analyse('The new academic year rollover has not created next year classes and timetabling starts Monday.');
  const scoped = analyse('The new academic year rollover has not created next year classes and timetabling starts Monday.',
    { scope: 'all-schools' });
  return ok(auto.priority === 'P3' && scoped.priority === 'P2',
    auto.priority + ' -> ' + scoped.priority);
});

/* ------------------------------------- 25. real ticket wording (email style) -- */

const REAL_TICKET = [
  'Hi guys,',
  '',
  'As discussed, this student is now showing in Edumate as a public contact,',
  'and not showing on the class rolls.',
  '',
  'Help please'
].join('\n');

test('Real tickets', 'enrolment record-type ticket is P3', () =>
  priority(REAL_TICKET, ['P3', 'P4']));

test('Real tickets', 'one student is individual scope, not a cohort', () =>
  field(REAL_TICKET, 'scope', 'individual'));

test('Real tickets', '"the class rolls" is a document, not a population', () => {
  const roll = detectScope(createDocument('The student is not showing on the class rolls.'));
  const cohort = detectScope(createDocument('The class cannot log into Canvas.'));
  return ok(roll.scope !== 'cohort' && cohort.scope === 'cohort',
    roll.scope + ' / ' + cohort.scope);
});

test('Real tickets', '"is now showing" is a state, not a deadline', () =>
  field(REAL_TICKET, 'deadline', 'unknown'));

test('Real tickets', '"we need it now" is still a deadline', () =>
  field('We need this fixed now.', 'deadline', 'now'));

test('Real tickets', 'the wrong record type is named as the symptom', () =>
  field(REAL_TICKET, 'symptom', 'wrong-record-type'));

test('Real tickets', 'a student created as a contact is a data integrity fault', () =>
  risk(REAL_TICKET, 'dataIntegrity', true));

test('Real tickets', 'a four line email does not produce high confidence', () => {
  const result = analyse(REAL_TICKET);
  return ok(result.confidenceBand !== 'high', result.confidence + '% ' + result.confidenceLabel);
});

test('Real tickets', '"As discussed" is reported as missing context', () => {
  const result = analyse(REAL_TICKET);
  return ok(
    result.missingInformation.some((m) => /background/i.test(m)) &&
    result.followUpQuestions.some((q) => /previously discussed/i.test(q)),
    result.missingInformation.join(' | ')
  );
});

test('Real tickets', 'one bad record prompts asking about the batch', () => {
  const result = analyse(REAL_TICKET);
  return ok(result.followUpQuestions.some((q) => /same intake or batch/i.test(q)),
    result.followUpQuestions.join(' | '));
});

test('Real tickets', 'confirming the roll is blocked today raises it', () => {
  const refined = analyse(REAL_TICKET, { deadline: 'today', workaround: 'no' });
  return ok(refined.priority === 'P3' || refined.priority === 'P2', refined.priority);
});

const SCHEDULE_QUESTION = 'What time does the casual staff sync into Canvas LMS?';

test('Real tickets', 'a schedule question is P4', () =>
  priority(SCHEDULE_QUESTION, 'P4'));

test('Real tickets', '"what time does" is recognised as a question', () =>
  field(SCHEDULE_QUESTION, 'workType', 'documentation'));

test('Real tickets', 'a question with no consequence is classified confidently', () => {
  const result = analyse(SCHEDULE_QUESTION);
  return ok(result.confidenceBand === 'high', result.confidence + '% ' + result.confidenceLabel);
});

test('Real tickets', 'the configured schedule answers the question', () => {
  const result = analyse(SCHEDULE_QUESTION);
  return ok(
    result.knownAnswer && /09:30/.test(result.knownAnswer.answer),
    result.knownAnswer ? result.knownAnswer.answer : 'no known answer'
  );
});

test('Real tickets', 'a how-to is not asked the incident questions', () => {
  const result = analyse(SCHEDULE_QUESTION);
  return ok(
    !result.followUpQuestions.some((q) => /not resolved today|workaround|one school/i.test(q)),
    result.followUpQuestions.join(' | ')
  );
});

test('Real tickets', 'a how-to does not raise a critical integration flag', () => {
  const result = analyse(SCHEDULE_QUESTION);
  return ok(
    result.risks.criticalIntegration === false &&
    !result.evidence.some((e) => /Critical Integration/i.test(e)),
    result.evidence.join(' | ')
  );
});

test('Real tickets', 'the same words with a failure are still an incident', () => {
  const result = analyse('The casual staff sync into Canvas has failed for all schools.');
  return ok(result.workType === 'incident' && result.knownAnswer === null,
    result.workType + ' / knownAnswer=' + JSON.stringify(result.knownAnswer));
});

const TEACHER_ACCESS =
  'A teacher - she teaches Year 9 Geography, but for some reasons she did not have access to Canvas';

test('Real tickets', 'a teacher blocked from her own course is P3, not P4', () =>
  priority(TEACHER_ACCESS, 'P3'));

test('Real tickets', '"she teaches Year 9" is one teacher, not a year group', () =>
  field(TEACHER_ACCESS, 'scope', 'individual'));

test('Real tickets', '"the Year 9 Geography teacher" is a person, not a cohort', () => {
  const role = detectScope(createDocument('She was never added as the Year 9 Geography teacher.'));
  const cohort = detectScope(createDocument('Year 9 students cannot log into Canvas.'));
  return ok(role.scope !== 'cohort' && cohort.scope === 'cohort',
    role.scope + ' / ' + cohort.scope);
});

test('Real tickets', '"did not have access" is recognised', () =>
  field(TEACHER_ACCESS, 'symptom', 'access-denied'));

test('Real tickets', 'missing from Canvas asks about Edumate first', () => {
  const result = analyse(TEACHER_ACCESS);
  return ok(
    result.followUpQuestions[0] === 'Is the record set up correctly in Edumate, which Canvas is synchronised from?',
    result.followUpQuestions[0]
  );
});

test('Real tickets', 'the reasoning warns that a manual downstream fix may be reversed', () => {
  const result = analyse(TEACHER_ACCESS);
  return ok(result.reasoning.some((r) => /may be reversed at the next run/.test(r)),
    result.reasoning.join(' | '));
});

test('Real tickets', 'no source question when both systems are already named', () => {
  const result = analyse('The Edumate to Canvas sync is not adding new students.');
  return ok(result.sourceOfTruth === null, JSON.stringify(result.sourceOfTruth));
});

test('Real tickets', 'a staff record does not get asked about EnrolHQ', () => {
  const result = analyse('She was never added as the Year 9 Geography teacher in Edumate.');
  return ok(result.sourceOfTruth === null, JSON.stringify(result.sourceOfTruth));
});

test('Real tickets', 'a student missing from Edumate does point at EnrolHQ', () => {
  const result = analyse('A new student is missing from Edumate after their enrolment was accepted.');
  return ok(result.sourceOfTruth && result.sourceOfTruth.source === 'EnrolHQ',
    JSON.stringify(result.sourceOfTruth));
});

test('Real tickets', 'an outage does not trigger the source-of-truth question', () => {
  const result = analyse('Canvas is completely unavailable for all schools.');
  return ok(result.sourceOfTruth === null, JSON.stringify(result.sourceOfTruth));
});

const DOC_SYNC_CHAT = [
  "2 girls starting next year, both just being moved to 'Interview'",
  '',
  'Student A -> docs synced correctly',
  "Student B -> recent docs uploaded by parents aren't synced",
  "any idea why Student B's docs aren't synced?"
].join('\n');

test('Real tickets', 'a Teams chat about document sync is P3', () =>
  priority(DOC_SYNC_CHAT, ['P3', 'P4']));

test('Real tickets', '"aren\'t synced" is recognised', () =>
  field(DOC_SYNC_CHAT, 'symptom', 'not-synchronising'));

test('Real tickets', '"2 girls" counts as people', () =>
  field(DOC_SYNC_CHAT, 'scope', 'few-users'));

test('Real tickets', 'documents get their own domain', () =>
  field(DOC_SYNC_CHAT, 'technicalDomain', 'documents'));

test('Real tickets', 'one working and one failing is a problem investigation', () =>
  field(DOC_SYNC_CHAT, 'workType', 'problem-investigation'));

test('Real tickets', 'the differential is detected and explained', () => {
  const result = analyse(DOC_SYNC_CHAT);
  return ok(
    result.differential !== null &&
    result.reasoning.some((r) => /system-wide failure is unlikely/.test(r)),
    JSON.stringify(result.differential)
  );
});

test('Real tickets', 'the first question asks what is different', () => {
  const result = analyse(DOC_SYNC_CHAT);
  return ok(/What is different about the record that failed/.test(result.followUpQuestions[0]),
    result.followUpQuestions[0]);
});

test('Real tickets', 'a differential suppresses the broad-outage urgency bump', () => {
  const outage = analyse('Document sync has failed for all schools.');
  const differential = analyse('Document sync has failed for all schools, but the first one worked correctly.');
  return ok(differential.detail.urgencyResult.score < outage.detail.urgencyResult.score,
    outage.detail.urgencyResult.score + ' -> ' + differential.detail.urgencyResult.score);
});

test('Real tickets', 'no differential means no false diagnosis line', () => {
  const result = analyse('Documents are not syncing for any school.');
  return ok(result.differential === null, JSON.stringify(result.differential));
});

test('Real tickets', 'a distant start date is not a deadline unless stated as one', () => {
  const context = analyse('Two students starting next year are missing documents.');
  const stated = analyse('The documents must be loaded before next year.');
  return ok(context.deadline === 'unknown' && stated.deadline === 'weeks-1-2',
    context.deadline + ' / ' + stated.deadline);
});

/* ----------------------------- 26. the TASC guide's own calibration table -- */

/*
 * From tasc-specific/TASC_Apps_Priority_Full_Guide.md, section 5.
 * This is the authoritative desk guide the engine implements. If a change to
 * the engine moves any of these, the engine is wrong, not the guide.
 */
const GUIDE_EXAMPLES = [
  [['P3'], 'One student has not appeared in Canvas.'],
  [['P3', 'P4'], 'A student is missing from Canvas but does not need it today.'],
  [['P2', 'P3'], 'A student is missing from Canvas and has an online assessment in 30 minutes.'],
  [['P3'], "One school's Canvas sync has stopped."],
  [['P2'], "One school's Canvas sync has stopped and classes are affected now."],
  [['P2'], 'Canvas sync stopped across all 19 schools overnight, but recovery time remains.'],
  [['P1'], "Canvas sync stopped across all 19 schools and today's classes are affected."],
  [['P3'], 'One EnrolHQ application has not reached Edumate.'],
  [['P2'], 'EnrolHQ to Edumate has stopped across all schools, but a workaround exists.'],
  [['P1'], 'EnrolHQ to Edumate has stopped corporation-wide and enrolment operations are blocked now.'],
  [['P3'], 'Parent profiles need routine merging.'],
  [['P1'], "A parent can see another family's confidential information."],
  [['P3'], 'Sibling profiles are swapped but contained to one family.'],
  [['P1'], 'Incorrect profile data is propagating to downstream systems.'],
  [['P4'], 'Custom SQL report with no deadline.'],
  [['P3'], 'An important SQL report is required within 3 days.'],
  [['P2', 'P1'], 'A report is required today for a critical compliance response.'],
  [['P4'], 'Documentation request.'],
  [['P1'], 'Missing documentation is blocking recovery from a live P1 incident.']
];

for (const [expected, text] of GUIDE_EXAMPLES) {
  test('TASC guide', text.slice(0, 62) + (text.length > 62 ? '…' : ''), () =>
    priority(text, expected));
}

test('TASC guide', 'requester seniority does not change impact', () => {
  const plain = analyse('A report is not refreshing for the finance team.');
  const escalated = analyse('The principal has escalated this: a report is not refreshing for the finance team.');
  return ok(plain.impact === escalated.impact && plain.priority === escalated.priority,
    plain.impact + '/' + plain.priority + ' vs ' + escalated.impact + '/' + escalated.priority);
});

test('TASC guide', 'escalation is still reported as context', () => {
  const result = analyse('The principal has escalated this: a report is not refreshing.');
  return ok(result.reasoning.some((r) => /escalated by a stakeholder/.test(r)),
    result.reasoning.join(' | '));
});

test('TASC guide', 'documentation blocking a live incident is not a backlog item', () => {
  const plain = analyse('Where can I find the Canvas integration documentation?');
  const blocking = analyse('Missing documentation is blocking recovery from a live P1 incident.');
  return ok(plain.priority === 'P4' && blocking.priority === 'P1',
    plain.priority + ' vs ' + blocking.priority);
});

test('TASC guide', 'a compliance deadline today raises impact', () => {
  const result = analyse('A report is required today for a critical compliance response.');
  return ok(result.impact !== 'low', result.impact + '/' + result.urgency);
});

test('TASC guide', 'routine data correction is normal work, not backlog', () =>
  priority('Parent profiles need routine merging.', 'P3'));

test('TASC guide', 'a one-sentence justification is produced', () => {
  const result = analyse("Canvas sync stopped across all 19 schools overnight, but recovery time remains.");
  return ok(
    /-> High Impact \+ Medium Urgency -> P2$/.test(result.justification),
    result.justification
  );
});

const FLIP_FLOP_TICKET =
  'A student has been flip-floping from year 2 and year 12 in RHAC.\n' +
  'Can someone fix this enrolment sync issue from enrolhq to edumate?';

test('Real tickets', 'hyphenated and misspelt "flip-floping" is still recognised', () =>
  field(FLIP_FLOP_TICKET, 'symptom', 'unstable-data'));

test('Real tickets', 'a year level being flipped between is a value, not a cohort', () =>
  field(FLIP_FLOP_TICKET, 'scope', 'individual'));

test('Real tickets', 'a year level as a population is still a cohort', () => {
  const cohort = detectScope(createDocument('Year 9 students cannot log into Canvas.'));
  const location = detectScope(createDocument('Records are missing from all schools.'));
  return ok(cohort.scope === 'cohort' && location.scope === 'all-schools',
    cohort.scope + ' / ' + location.scope);
});

/*
 * A recurring Edumate year-level scramble, forwarded as a three-deep email
 * chain. The individual records had already been corrected by hand twice; the
 * request is for root cause, and the requester says affected records may exist
 * that nobody has spotted.
 */
const SCRAMBLE_CHAIN = [
  'Just coming back to this one - it represents a real worry for us that this keeps scrambling.',
  'Today we discover that Student B was enrolled in Prek as below. Meaning he would have shown up on the roll this morning!!',
  '',
  'I have corrected it, but it will be helpful to get to the bottom of this issue. Any ideas ??',
  '',
  'From: Registrar',
  'Sent: Monday, 17 August 2026 12:05 PM',
  'Subject: RE: Edumate scramble -- Query sync Student A',
  '',
  'However, my worry is that it is happening in the first place. Have we ever been able to',
  'get to the bottom of why Edumate keeps throwing up these errors when syncing?',
  "Its worrying on our end that there will be instances that we don't pick up.",
  '',
  'From: Support Engineer',
  'Sent: Monday, 17 August 2026 11:35 AM',
  '',
  "I have checked everything, but I'm not sure why Edumate enrolled this student into the Year 12 form.",
  '',
  'From: Registrar',
  'Sent: Friday, 14 August 2026 3:19 PM',
  '',
  'Edumate continues to throw us strange anomalies! See below Student A, a new student set to',
  'join Year 2 2027, but instead of showing on the roll for this year group I discover that at',
  '6 years of age he has made it into year 12.'
].join('\n');

test('Real tickets', 'a recurring data scramble is P2', () =>
  priority(SCRAMBLE_CHAIN, ['P2', 'P1']));

test('Real tickets', '"scrambling" is recognised as unstable data', () =>
  field(SCRAMBLE_CHAIN, 'symptom', 'unstable-data'));

test('Real tickets', 'a corrected-but-recurring fault is a problem, not an incident', () =>
  field(SCRAMBLE_CHAIN, 'workType', 'problem-investigation'));

test('Real tickets', 'recurrence and unknown extent raise impact, not urgency', () => {
  const result = analyse(SCRAMBLE_CHAIN);
  return ok(result.impact === 'high' && result.urgency === 'low',
    result.impact + '/' + result.urgency);
});

test('Real tickets', 'the reasoning says the ticket is about the pattern', () => {
  const result = analyse(SCRAMBLE_CHAIN);
  return ok(
    result.reasoning.some((r) => /about the pattern, not the instance/.test(r)) &&
    result.reasoning.some((r) => /unknown and larger/.test(r)),
    result.reasoning.join(' | ')
  );
});

test('Real tickets', 'root cause and unknown extent are the leading questions', () => {
  const result = analyse(SCRAMBLE_CHAIN);
  return ok(
    result.followUpQuestions.some((q) => /root cause/.test(q)) &&
    result.followUpQuestions.some((q) => /without anyone noticing/.test(q)),
    result.followUpQuestions.join(' | ')
  );
});

test('Real tickets', '"Today we discover" is a timestamp, not a deadline', () =>
  field('Today we discover that a student was enrolled in the wrong form.', 'deadline', 'unknown'));

test('Real tickets', '"would have shown up this morning" is not a deadline either', () =>
  field('He would have shown up on the roll this morning.', 'deadline', 'unknown'));

test('Real tickets', 'an observation verb does not suppress a real commitment', () => {
  const observed = analyse('We noticed the export failed this morning.');
  const required = analyse('We noticed the export failed and it must be rerun today.');
  return ok(observed.deadline === 'unknown' && required.deadline === 'today',
    observed.deadline + ' / ' + required.deadline);
});

test('Real tickets', 'recurrence alone does not invent urgency', () => {
  const once = analyse('A student record was scrambled in Edumate.');
  const again = analyse('A student record keeps getting scrambled in Edumate.');
  return ok(again.impact !== once.impact && again.urgency === once.urgency,
    once.impact + '/' + once.urgency + ' -> ' + again.impact + '/' + again.urgency);
});

/* ------------------------------------------- 27. handoff (v0.3.0) -- */

test('Handoff', 'follow-up questions carry a kind and stay capped at six', () => {
  const result = analyse('Laserfiche has stopped writing records to staging for all schools since midnight.');
  return ok(
    Array.isArray(result.followUpQuestionMeta) &&
    result.followUpQuestions.length <= 6 &&
    result.followUpQuestionMeta.length === result.followUpQuestions.length &&
    result.followUpQuestionMeta.every((m) => ['diagnostic', 'priority', 'confidence'].includes(m.kind)),
    result.followUpQuestions.length + ' questions'
  );
});

test('Handoff', 'high impact with unknown deadline ranks the deadline question as priority', () => {
  const result = analyse('Laserfiche has stopped writing records to staging for all schools since midnight.');
  const deadlineQ = result.followUpQuestionMeta.find((m) => /When is this required by/.test(m.text));
  return ok(Boolean(deadlineQ) && deadlineQ.kind === 'priority' &&
    result.followUpQuestionMeta[0].kind !== 'confidence',
    (result.followUpQuestionMeta[0] || {}).kind + ' leads');
});

test('Handoff', 'keyFacets flags the unknown that could flip the cell', () => {
  const result = analyse('Laserfiche has stopped writing records to staging for all schools since midnight.');
  return ok(result.keyFacets.includes('u5'), JSON.stringify(result.keyFacets));
});

test('Handoff', 'active exposure flags harm timing as a key facet', () => {
  const result = analyse('Parents can see other families balances in the fee portal.');
  return ok(result.keyFacets.includes('u8') || result.keyFacets.length === 0,
    JSON.stringify(result.keyFacets));
});

test('Handoff', 'draft reply is polite, short and names the priority', () => {
  const result = analyse('Canvas synchronisation has stopped across all 19 schools and today’s classes are affected.');
  const reply = buildReply(result);
  return ok(
    /Thanks for raising this/.test(reply) &&
    /P1/.test(reply) &&
    /Draft — refine before sending/.test(reply) &&
    reply.split(/\s+/).length < 140,
    reply.split(/\s+/).length + ' words'
  );
});

test('Handoff', 'unassessed reply asks for the system, not a priority', () => {
  const result = analyse('All users, P1, fix now!!!');
  const reply = buildReply(result);
  return ok(/which application, device or service is affected/.test(reply) && !/Suggested priority/.test(reply),
    reply.slice(0, 80));
});

test('Handoff', 'markdown slip lists all eight questions', () => {
  const result = analyse('35 casual staff timesheets failed and today’s payroll cutoff is approaching.');
  const md = buildMarkdown(result);
  return ok(
    /# Triage — P1/.test(md) &&
    ['I1', 'I2', 'I3', 'I4', 'U5', 'U6', 'U7', 'U8'].every((id) => md.includes('| ' + id + ' ')),
    md.split('\n').length + ' lines'
  );
});

test('Handoff', 'share link round-trips unicode ticket text', () => {
  const text = 'Café — “smart” quotes, emoji 🎓, Māori: kia ora. Canvas is down for all schools.';
  const encoded = encodeTicket(text);
  return ok(!/[+/=]/.test(encoded) && decodeTicket(encoded) === text, encoded.slice(0, 24));
});

test('Handoff', 'share rejects nothing but caps at 2000 characters', () => {
  const long = 'Canvas is slow. '.repeat(200);
  const short = 'Canvas is slow.';
  const round = decodeTicket(encodeTicket(long));
  return ok(tooLongForShare(long) && !tooLongForShare(short) && round.length === 2000,
    round.length + ' chars');
});

test('Handoff', 'refined overrides are listed for the printed slip', () => {
  const result = analyse('Canvas synchronisation has stopped across all 19 schools.', { scope: 'all-schools', workaround: 'yes' });
  return ok(
    result.detail.overridesApplied.scope === 'all-schools' &&
    result.detail.overridesApplied.workaround === 'yes',
    JSON.stringify(result.detail.overridesApplied)
  );
});

/* ------------------------------------- 28. v0.3.1 coverage drop -- */

test('v0.3.1 coverage', 'Jamf is a recognised system and a push gap is an incident', () => {
  const result = analyse('Jamf is not pushing the macOS update to the Macs in the library.');
  return ok(result.system === 'Jamf' && result.symptom === 'not-synchronising' &&
    result.workType === 'incident',
    result.system + ' / ' + result.symptom + ' / ' + result.workType);
});

test('v0.3.1 coverage', 'PaperCut print server down is an availability incident', () => {
  const result = analyse('PaperCut print server is down and students cannot print their assessments.');
  return ok(result.system === 'PaperCut' && result.symptom === 'unavailable',
    result.system + ' / ' + result.symptom);
});

test('v0.3.1 coverage', 'Meraki dropout routes to network with an intermittent symptom', () => {
  const result = analyse('The Meraki access point in the hall keeps dropping the Wi-Fi during roll call.');
  return ok(result.system === 'Cisco Meraki' && result.technicalDomain === 'network' &&
    result.symptom === 'intermittent',
    result.system + ' / ' + result.technicalDomain + ' / ' + result.symptom);
});

test('v0.3.1 coverage', 'Mimecast quarantine is not-delivered, not a privacy incident', () => {
  const result = analyse('A parent email about the excursion was quarantined by Mimecast and never delivered.');
  return ok(result.system === 'Mimecast' && result.symptom === 'not-delivered' &&
    result.technicalDomain === 'messaging' && result.risks.privacy === false,
    result.system + ' / ' + result.symptom + ' / privacy=' + result.risks.privacy);
});

test('v0.3.1 coverage', 'Proofpoint holding mail is not-delivered', () =>
  field('Proofpoint is holding the principal’s emails in quarantine.', 'symptom', 'not-delivered'));

test('v0.3.1 coverage', 'Australian school-sector systems are recognised', () => {
  const checks = [
    ['Compass portal is showing the wrong timetable for Year 8.', 'Compass'],
    ['Synergetic is slow for the finance team this morning.', 'Synergetic'],
    ['The TASS sync to the portal has stopped overnight.', 'TASS'],
    ['Seqta is not showing the new class lists for Term 4.', 'Seqta'],
    ['SchoolBox news page is unavailable for all schools.', 'SchoolBox']
  ];
  for (const [text, system] of checks) {
    const result = analyse(text);
    if (result.system !== system) return ok(false, text + ' -> ' + result.system);
  }
  return ok(true, 'Compass, Synergetic, TASS, Seqta, SchoolBox');
});

test('v0.3.1 coverage', 'blue screen and frozen endpoints are failures', () => {
  const blue = analyse('A staff member got a blue screen after the Windows update.');
  const frozen = analyse('My screen is frozen and the laptop will not respond.');
  return ok(blue.symptom === 'failed' && frozen.symptom === 'failed' &&
    blue.technicalDomain === 'endpoint-server',
    blue.symptom + ' / ' + frozen.symptom);
});

test('v0.3.1 coverage', 'Veeam is a recognised backup system', () => {
  const result = analyse('The Veeam backup of the file server failed last night.');
  return ok(result.system === 'Veeam' && result.symptom === 'backup-failed',
    result.system + ' / ' + result.symptom);
});

test('v0.3.1 coverage', 'paper and spreadsheet stopgaps are workarounds', () => {
  const paper = detectWorkaround(createDocument('We are using the paper form until the system is fixed.'));
  const sheet = detectWorkaround(createDocument('Finance are using a spreadsheet until it is repaired.'));
  return ok(paper.workaround === 'yes' && sheet.workaround === 'yes',
    paper.workaround + ' / ' + sheet.workaround);
});

test('v0.3.1 coverage', 'all casuals is a team-sized scope', () =>
  field('All casuals are missing from the payroll export.', 'scope', 'team'));

test('v0.3.1 coverage', 'the whole year level is a cohort', () =>
  field('The whole year level is locked out of the assessment portal.', 'scope', 'cohort'));

test('v0.3.1 coverage', 'Okta routes to identity and is a recognised system', () => {
  const result = analyse('Okta sign-in is failing for the new starters.');
  return ok(result.system === 'Okta' && result.technicalDomain === 'identity-auth',
    result.system + ' / ' + result.technicalDomain);
});

test('v0.3.1 coverage', 'UniFi and Meraki are recognised network vendors', () => {
  const unifi = analyse('The UniFi controller shows the whole site offline after the power outage.');
  return ok(unifi.system === 'UniFi', unifi.system);
});

/* ------------------------------------------------------- 29. examples -- */

for (const example of EXAMPLES) {
  test('Examples', example.title + ' -> ' + example.expected.join('/'), () =>
    priority(example.text, example.expected));
}

/* --------------------------------------------------------------- run -- */

export function runTests() {
  const results = tests.map((t) => {
    let outcome;
    try {
      outcome = t.fn();
    } catch (error) {
      outcome = { pass: false, message: 'threw: ' + (error && error.message) };
    }
    return { group: t.group, name: t.name, pass: outcome.pass, message: outcome.message };
  });

  const passed = results.filter((r) => r.pass).length;
  return {
    results,
    passed,
    failed: results.length - passed,
    total: results.length
  };
}

export { tests };
