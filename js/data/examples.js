/**
 * Example tickets.
 *
 * `expected` lists the priorities that are defensible for each example. Where
 * the framework documentation gives a range ("P3/P2 depending on impact"), the
 * range is preserved here rather than pretending there is one right answer.
 * The test suite asserts against exactly this list.
 */
export const EXAMPLES = [
  {
    id: 'ex01',
    title: 'Known system, but a workaround exists',
    group: 'Urgency wording',
    text: 'Canvas is broken but I can work without it for now.',
    expected: ['P3'],
    note: 'Workaround detected, low urgency, scope unknown.'
  },
  {
    id: 'ex02',
    title: 'Needed in three days, manual process available',
    group: 'Urgency wording',
    text: 'Canvas is broken and I need it within three days. We can process it manually until then.',
    expected: ['P3', 'P2'],
    note: 'Medium urgency: a workaround is holding, but a deadline is approaching.'
  },
  {
    id: 'ex03',
    title: 'Known system, please investigate when possible',
    group: 'Urgency wording',
    text: 'Canvas has an issue. Please investigate when possible.',
    expected: ['P4'],
    note: 'A named system but no stated consequence, deadline, or workaround.'
  },
  {
    id: 'ex04',
    title: 'All-school Canvas sync stopped, classes affected',
    group: 'Integration',
    text: 'Canvas synchronisation has stopped across all 19 schools and today’s classes are affected.',
    expected: ['P1'],
    note: 'High impact and high urgency.'
  },
  {
    id: 'ex05',
    title: 'EnrolHQ to Edumate stopped, manual processing for three days',
    group: 'Integration',
    text: 'EnrolHQ to Edumate has stopped for all schools but enrolment staff can manually process urgent applications for the next three days.',
    expected: ['P2'],
    note: 'High impact, medium urgency because a manual process is holding.'
  },
  {
    id: 'ex06',
    title: 'ABA file missing, payroll must process today',
    group: 'Payroll',
    text: 'ANZ has not received today’s ABA file and payroll must be processed this afternoon.',
    expected: ['P1'],
    note: 'Payroll failure against a same-day cutoff.'
  },
  {
    id: 'ex07',
    title: 'One student missing from Canvas, not needed today',
    group: 'Canvas',
    text: 'One student hasn’t appeared in Canvas this morning and does not require Canvas today.',
    expected: ['P3', 'P4'],
    note: 'Individual scope with the requester stating there is no immediate need.'
  },
  {
    id: 'ex08',
    title: 'One student, assessment in 30 minutes',
    group: 'Canvas',
    text: 'One student cannot access Canvas and has an online assessment in 30 minutes.',
    expected: ['P2', 'P3'],
    note: 'Small scope, but a serious consequence is imminent.'
  },
  {
    id: 'ex09',
    title: 'Casual staff member added after the scheduled sync',
    group: 'Expected behaviour',
    text: 'We added a casual staff member at 10am but they haven’t appeared in Canvas.',
    expected: ['P4'],
    note: 'The casual staff sync runs at 09:30 - nothing has failed yet.'
  },
  {
    id: 'ex10',
    title: '35 casual staff timesheets failed before cutoff',
    group: 'Payroll',
    text: '35 casual staff timesheets failed and today’s payroll cutoff is approaching.',
    expected: ['P1'],
    note: 'Payroll, same-day cutoff, people may not be paid.'
  },
  {
    id: 'ex11',
    title: 'Entra ID token expired, all-school sync stopped',
    group: 'Identity',
    text: 'Entra ID token expired for a production API and Canvas synchronisation stopped for all schools.',
    expected: ['P1', 'P2'],
    note: 'Expired credential with a broad downstream consequence.'
  },
  {
    id: 'ex12',
    title: 'Cannot log into my Windows workstation',
    group: 'Identity',
    text: 'I cannot log into my Windows workstation.',
    expected: ['P3'],
    note: 'Individual scope, authentication failure.'
  },
  {
    id: 'ex13',
    title: 'Nobody can log into the production server',
    group: 'Identity',
    text: 'Nobody can log into the production server and all integration jobs have stopped.',
    expected: ['P1'],
    note: 'Same symptom as the previous example, very different consequence.'
  },
  {
    id: 'ex14',
    title: 'Laserfiche SSO failing for one user',
    group: 'Laserfiche',
    text: 'Laserfiche SSO isn’t working for one user.',
    expected: ['P3'],
    note: 'Individual authentication failure.'
  },
  {
    id: 'ex15',
    title: 'Laserfiche SSO failing for every school',
    group: 'Laserfiche',
    text: 'Laserfiche SSO has failed for every school.',
    expected: ['P1', 'P2'],
    note: 'High impact; urgency depends on what is blocked right now.'
  },
  {
    id: 'ex16',
    title: 'Laserfiche SQL conversion error, one user, next week',
    group: 'Laserfiche',
    text: 'Laserfiche report shows "invalid conversion from varchar to datetime". Only one user needs the report next week.',
    expected: ['P3'],
    note: 'A technical-sounding error is not the same as a business consequence.'
  },
  {
    id: 'ex17',
    title: 'Nothing written to staging for all schools since midnight',
    group: 'Data pipeline',
    text: 'Laserfiche has stopped writing records to staging for all schools since midnight.',
    expected: ['P2', 'P1'],
    note: 'High impact; the downstream deadline is the missing fact.'
  },
  {
    id: 'ex18',
    title: 'Laserfiche slow for one user',
    group: 'Performance',
    text: 'Laserfiche is slow for one user.',
    expected: ['P4', 'P3'],
    note: 'Degraded performance is not an outage.'
  },
  {
    id: 'ex19',
    title: 'Laserfiche timing out for all schools',
    group: 'Performance',
    text: 'Laserfiche is timing out for all schools and users cannot complete their work.',
    expected: ['P1'],
    note: 'Effectively unavailable, work is blocked.'
  },
  {
    id: 'ex20',
    title: 'Power BI refresh failed, data not needed until next week',
    group: 'Power BI',
    text: 'Power BI dataset refresh failed overnight but yesterday’s report remains available and the new data is not needed until next week.',
    expected: ['P3'],
    note: 'Stale but usable data, with an explicit future deadline.'
  },
  {
    id: 'ex21',
    title: 'Payroll dashboard shows incorrect totals before approval',
    group: 'Power BI',
    text: 'Payroll reconciliation Power BI report is showing incorrect totals immediately before payment approval.',
    expected: ['P1', 'P2'],
    note: 'Incorrect information can be more dangerous than missing information.'
  },
  {
    id: 'ex22',
    title: 'SQL trigger failed for one record',
    group: 'Database',
    text: 'SQL trigger failed for one student record.',
    expected: ['P3'],
    note: 'The word "trigger" does not decide the priority.'
  },
  {
    id: 'ex23',
    title: 'SQL trigger writing incorrect payment records everywhere',
    group: 'Database',
    text: 'SQL trigger is silently writing incorrect payment records across all schools.',
    expected: ['P2'],
    note: 'Data integrity risk that is actively propagating; without a time-bound consequence, the policy sets a Medium urgency floor.'
  },
  {
    id: 'ex24',
    title: 'Where is the Canvas integration documentation?',
    group: 'Documentation',
    text: 'Where can I find the documentation for the Canvas integration?',
    expected: ['P4'],
    note: 'A how-to request about a critical system is still a how-to request.'
  },
  {
    id: 'ex25',
    title: 'New feature for all schools before the next enrolment cycle',
    group: 'Feature request',
    text: 'We need a new feature that will be used by all 19 schools before the next enrolment cycle.',
    expected: ['P2'],
    note: 'Strategic work is prioritised through the same matrix.'
  },
  {
    id: 'ex26',
    title: 'Urgency asserted with no stated consequence',
    group: 'Urgency wording',
    text: 'URGENT!!! Laserfiche is broken!!! Please fix immediately!!!',
    expected: ['P3', 'P2'],
    note: 'Asserted urgency alone does not produce a P1.'
  },
  {
    id: 'ex27',
    title: 'SSL certificate expiring in three days',
    group: 'Access and identity',
    text: 'The SSL certificate for the Laserfiche web client expires in three days.',
    expected: ['P3', 'P2'],
    note: 'Expiring is a different symptom from expired - nothing has broken yet.'
  },
  {
    id: 'ex28',
    title: 'Leaver still has access after offboarding',
    group: 'Access and identity',
    text: 'Offboarding: a staff member left last Friday and still has access to Edumate and Laserfiche.',
    expected: ['P3', 'P2'],
    note: 'Low impact, but the security flag is what makes this worth escalating.'
  },
  {
    id: 'ex29',
    title: 'Incorrect carers synced to Edumate',
    group: 'Data quality',
    text: 'Incorrect carers are being synced to Edumate, some students are linked to another family parent.',
    expected: ['P3', 'P2'],
    note: 'Privacy is flagged because a record is attached to the wrong person - but nobody has been shown to have seen it yet.'
  },
  {
    id: 'ex30',
    title: 'Parents can see other families’ fee balances',
    group: 'Data quality',
    text: 'Advance payments have been assigned to the incorrect students and parents can see other families balances.',
    expected: ['P1', 'P2'],
    note: 'Same data error as the previous example, but information is actively visible to the wrong people.'
  },
  {
    id: 'ex31',
    title: 'Seesaw accounts missing before classes start',
    group: 'Canvas',
    text: 'Seesaw accounts are not being created for the new Kindergarten cohort and classes start tomorrow.',
    expected: ['P2', 'P3'],
    note: 'A cohort, a real deadline, and no workaround stated.'
  },
  {
    id: 'ex32',
    title: 'Screen reader cannot use the enrolment form',
    group: 'Accessibility',
    text: 'A vision impaired staff member cannot use the enrolment form with her screen reader.',
    expected: ['P3', 'P2'],
    note: 'Individual scope, but accessibility carries a compliance obligation.'
  },
  {
    id: 'ex33',
    title: 'Wonde connection revoked for three schools',
    group: 'Integration',
    text: 'The Wonde connection for three schools was revoked and student data has not updated since yesterday, but registrars can enter changes manually for the next few days.',
    expected: ['P2'],
    note: 'Multiple schools, but a manual process is holding and there are days of recovery time.'
  },
  {
    id: 'ex34',
    title: 'Broken build deployed to production',
    group: 'DevOps',
    text: 'The Azure DevOps release pipeline deployed a broken build to production and the enrolment API is returning 500 errors for all schools.',
    expected: ['P1', 'P2'],
    note: 'A regression carries urgency of its own: the cause is known and waiting compounds it.'
  },
  {
    id: 'ex35',
    title: 'All pipelines blocked before a payroll fix',
    group: 'DevOps',
    text: 'All Azure DevOps pipelines are failing because the service connection expired and we cannot deploy the payroll integration fix due Friday.',
    expected: ['P2'],
    note: 'Nothing can ship, but Friday is days away - high impact, medium urgency.'
  },
  {
    id: 'ex36',
    title: 'Teams class teams missing before term',
    group: 'Collaboration',
    text: 'Teams class teams have not been created for the new term at all schools and lessons start next Monday.',
    expected: ['P2'],
    note: 'Records that were never created are a big impact, not an outage in progress.'
  },
  {
    id: 'ex37',
    title: 'DB2 locked before today’s pay run',
    group: 'Database',
    text: 'The DB2 database is locked and all Aurion payroll extracts have failed with today pay run due this afternoon.',
    expected: ['P1'],
    note: 'Payroll processing failing against a same-day cutoff.'
  },
  {
    id: 'ex38',
    title: 'PostgreSQL query failing for one report',
    group: 'Database',
    text: 'A PostgreSQL query is failing with relation does not exist for one report used by the finance team.',
    expected: ['P3'],
    note: 'A technical-sounding database error with a contained business consequence.'
  },
  {
    id: 'ex39',
    title: 'Court order breached by retained portal access',
    group: 'Safety and legal',
    text: 'A court order says the non-custodial parent must not see the student record, but he still has portal access.',
    expected: ['P1'],
    note: 'One person, no outage - and a legal obligation being breached right now.'
  },
  {
    id: 'ex40',
    title: 'Allergy alert missing before an excursion',
    group: 'Safety and legal',
    text: 'A student severe allergy alert is not showing in Edumate and the excursion leaves this morning.',
    expected: ['P1'],
    note: 'Missing safety information is not an ordinary data problem.'
  },
  {
    id: 'ex41',
    title: 'Laptop with student data stolen',
    group: 'Safety and legal',
    text: 'A staff laptop with unencrypted student data was stolen from a car last night.',
    expected: ['P1'],
    note: 'Nothing is broken. The exposure is the incident.'
  },
  {
    id: 'ex42',
    title: 'Unapproved app granted access to student data',
    group: 'Safety and legal',
    text: 'An unapproved third party app has been granted OAuth consent to read student data via Wonde.',
    expected: ['P2', 'P1'],
    note: 'A consent grant is a data-sharing decision that nobody approved.'
  },
  {
    id: 'ex43',
    title: 'Year 12 assessment folder deleted',
    group: 'Backup and recovery',
    text: 'A staff member deleted the whole Year 12 assessment folder from the shared drive and we need it restored today.',
    expected: ['P1', 'P2'],
    note: 'Deletion is weighted for recoverability, not just for severity.'
  },
  {
    id: 'ex48',
    title: 'Edumate year levels keep scrambling',
    group: 'Real ticket wording',
    text: 'Just coming back to this one - it represents a real worry for us that this keeps scrambling.\nToday we discover that Student B was enrolled in Prek as below. Meaning he would have shown up on the roll this morning!!\n\nI have corrected it, but it will be helpful to get to the bottom of this issue. Any ideas ??\n\nFrom: Registrar\nSent: Monday, 17 August 2026 12:05 PM\nSubject: RE: Edumate scramble -- Query sync Student A\n\nHowever, my worry is that it is happening in the first place. Have we ever been able to get to the bottom of why Edumate keeps throwing up these errors when syncing?\nIts worrying on our end that there will be instances that we don’t pick up.\n\nFrom: Support Engineer\nSent: Monday, 17 August 2026 11:35 AM\n\nI have checked everything, but I’m not sure why Edumate enrolled this student into the Year 12 form.\n\nFrom: Registrar\nSent: Friday, 14 August 2026 3:19 PM\n\nEdumate continues to throw us strange anomalies! See below Student A, a new student set to join Year 2 2027, but instead of showing on the roll for this year group I discover that at 6 years of age he has made it into year 12.',
    expected: ['P2', 'P1'],
    note: 'A three-deep email chain. Both records were already corrected by hand — the request is root cause, and the requester says affected records may exist that nobody has spotted. That is what makes it P2, not the instance in front of you.'
  },
  {
    id: 'ex47',
    title: 'One student’s documents synced, the other’s didn’t',
    group: 'Real ticket wording',
    text: "2 girls starting next year, both just being moved to 'Interview'\n\nStudent A -> docs synced correctly\nStudent B -> recent docs uploaded by parents aren't synced\nany idea why Student B's docs aren't synced?",
    expected: ['P3', 'P4'],
    note: 'A chat message, not a ticket. One record works and one does not, which rules out a system-wide fault and changes what you investigate first.'
  },
  {
    id: 'ex46',
    title: 'What time does the casual staff sync run?',
    group: 'Real ticket wording',
    text: 'What time does the casual staff sync into Canvas LMS?',
    expected: ['P4'],
    note: 'A question, not a fault - and the configured schedule already answers it.'
  },
  {
    id: 'ex45',
    title: 'Student showing as a public contact',
    group: 'Real ticket wording',
    text: 'Hi guys,\n\nAs discussed, this student is now showing in Edumate as a public contact, and not showing on the class rolls.\n\nHelp please',
    expected: ['P3', 'P4'],
    note: 'A real four-line email: shorthand, no deadline, and the context is in a conversation you cannot see. Note the confidence and the questions.'
  },
  {
    id: 'ex44',
    title: 'Nightly backup failing for five nights',
    group: 'Backup and recovery',
    text: 'The nightly backup of the Edumate database has failed for the last five nights.',
    expected: ['P2', 'P1'],
    note: 'Nothing is down - but the ability to recover from the next failure is gone.'
  },
  {
    id: 'ex49',
    title: 'SendHQ Mail Carers filter request',
    group: 'Integration',
    text: 'Update SendHQ to show parents with Mail Carers only from Edumate',
    expected: ['P4'],
    note: 'A low-urgency configuration request. The ticket states no failure, scope, or deadline.'
  },
  {
    id: 'ex50',
    title: 'Seesaw class-sync request',
    group: 'Real ticket wording',
    text: 'I was told I could use Seesaw to share Photos with students and Parents safely; sync SS English and JS English to Seesaw',
    expected: ['P4'],
    note: 'A request to sync two named classes. The ticket gives no deadline, outage, or stated business consequence.'
  },
  {
    id: 'ex51',
    title: 'Helpdesk is down — ticketing system',
    group: 'Helpdesk / ITSM',
    text: 'Helpdesk is down!',
    expected: ['P3'],
    note: 'A named ticketing system is unavailable, but the ticket states no affected population, deadline, or blocked process.'
  },
  {
    id: 'ex52',
    title: 'Newsletter automation down for one school',
    group: 'Integration',
    text: 'Newsletter automation for a school is down! (has been down for weeks!)',
    expected: ['P3'],
    note: 'One-school automation outage with no stated deadline, workaround, or documented downstream harm.'
  },
  {
    id: 'ex53',
    title: 'How to add a task in Azure DevOps User Story',
    group: 'Documentation',
    text: 'How do I add a task in a Azure DevOps User Story?',
    expected: ['P4'],
    note: 'How-to/documentation for Azure DevOps Boards — no failure, no deadline. Your follow-up brief instruction is outside quoted request; ticket alone stays P4 Documentation, not Incident.'
  },
  {
    id: 'ex54',
    title: 'Approved worker missing from school records',
    group: 'Safeguarding and compliance',
    text: 'Risk team approved a person to work with children, but their record cannot be found in the school records and exists only in HR. Please investigate today: they may be working without verified approval, or using our company WWCC to work elsewhere.',
    expected: ['P2'],
    note: 'A same-day safeguarding and compliance investigation. The potential harm is serious, but the ticket does not confirm the person is currently working with children; confirm that before treating it as an active P1 exposure.'
  },
  {
    id: 'ex55',
    title: 'Statement of Service figures incorrect',
    group: 'Data quality',
    text: 'Please refresh the Statement of Service table in Laserfiche from the attached payroll-system CSV exports. The figures are incorrect for employment-service reporting and entitlement decisions, including Long Service Leave and teaching-staff promotion assessments.',
    expected: ['P3'],
    note: 'Incorrect payroll-derived figures affect employment-service reporting and entitlement decisions. No deadline or affected population is stated.'
  },
  {
    id: 'ex56',
    title: 'Clipboard CSV timesheets must reach Aurion before payroll cutoff',
    group: 'Payroll',
    text: 'A school has uploaded a Clipboard CSV timesheet for casual staff, music staff, and sports coaches. The Apps team must complete the manual validation and import steps into Aurion before today’s payroll cutoff or those staff will be paid late.',
    expected: ['P2'],
    note: 'A one-school payroll-processing task with a same-day operational cutoff. The manual validation and import steps are the required work, not evidence of a workaround.'
  },
];

export function exampleById(id) {
  return EXAMPLES.find((e) => e.id === id) || null;
}

export function exampleGroups() {
  const groups = new Map();
  for (const example of EXAMPLES) {
    if (!groups.has(example.group)) groups.set(example.group, []);
    groups.get(example.group).push(example);
  }
  return [...groups.entries()].map(([name, items]) => ({ name, items }));
}
