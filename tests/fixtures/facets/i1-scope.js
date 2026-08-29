export const facet = 'I1';
export const authoring = 'independent';
export const supportedStates = [
  'unknown', 'individual', 'few-users', 'team', 'cohort', 'one-school',
  'multiple-schools', 'all-schools', 'corporation-wide'
];

const positive = (id, text, value, ...tags) => ({
  id, facet, text, expected: { value }, tags: ['positive', ...tags]
});
const contrast = (id, text, value = 'unknown', ...tags) => ({
  id, facet, text, expected: { value }, tags: ['negative', 'contrast', ...tags]
});

export const cases = [
  positive('i1-individual-teacher', 'One teacher cannot log in.', 'individual', 'paraphrase'),
  positive('i1-individual-student', 'A student cannot open Canvas.', 'individual', 'paraphrase'),
  positive('i1-individual-bursar', 'Only the bursar is affected.', 'individual', 'role-wording'),
  positive('i1-individual-parent', 'This parent cannot see the portal.', 'individual', 'paraphrase'),
  positive('i1-few-two-teachers', 'Two teachers are affected.', 'few-users', 'singular-plural'),
  positive('i1-few-three-students', 'Three students cannot log in.', 'few-users', 'singular-plural'),
  positive('i1-few-handful-staff', 'A handful of staff have reported the problem.', 'few-users', 'synonym'),
  positive('i1-few-several-parents', 'Several parents have reported the same issue.', 'few-users', 'synonym'),
  positive('i1-team-finance', 'The finance team cannot process payments.', 'team', 'role-wording'),
  positive('i1-team-registrars', 'All registrars are affected.', 'team', 'role-wording'),
  positive('i1-team-payroll', 'The payroll team is blocked.', 'team', 'role-wording'),
  positive('i1-team-reception', 'Reception staff cannot use the system.', 'team', 'role-wording'),
  positive('i1-cohort-year', 'The whole Year 8 cohort is affected.', 'cohort', 'cohort'),
  positive('i1-cohort-class', 'One class cannot access the lesson.', 'cohort', 'cohort'),
  positive('i1-cohort-kindergarten', 'All Kindergarten students are missing.', 'cohort', 'cohort'),
  positive('i1-cohort-level', 'The entire year level is affected.', 'cohort', 'cohort'),
  contrast('i1-year-teacher-not-cohort', 'The Year 9 Geography teacher is affected.', 'individual', 'boundary'),
  contrast('i1-class-roll-not-cohort', 'The class roll is wrong.', 'unknown', 'boundary', 'noise'),
  positive('i1-one-school-campus', 'The outage is limited to one campus.', 'one-school', 'site-wording'),
  positive('i1-one-school-name', 'Nobody at Smith School can sign in.', 'one-school', 'site-wording'),
  positive('i1-one-school-site', 'Only this school is affected.', 'one-school', 'site-wording'),
  positive('i1-multiple-two-schools', 'Two schools are affected by the import failure.', 'multiple-schools', 'count'),
  positive('i1-multiple-campuses', 'Several campuses cannot use the service.', 'multiple-schools', 'synonym'),
  positive('i1-multiple-sites', 'The fault affects more than one school.', 'multiple-schools', 'paraphrase'),
  positive('i1-all-schools', 'All schools are affected.', 'all-schools', 'breadth'),
  positive('i1-every-school', 'Every school has lost access.', 'all-schools', 'breadth'),
  positive('i1-all-counted', 'All 19 schools remain affected.', 'all-schools', 'count', 'comparison'),
  positive('i1-organisation-schools', "The failure is present across the organisation's schools.", 'all-schools', 'breadth'),
  positive('i1-corporation-staff', 'All staff are affected.', 'corporation-wide', 'breadth'),
  positive('i1-corporation-everyone', 'Everyone is unable to use the portal.', 'corporation-wide', 'breadth'),
  positive('i1-corporation-organisation', 'The whole organisation is affected.', 'corporation-wide', 'breadth'),
  positive('i1-corporation-hyphen', 'This is a corporation-wide outage.', 'corporation-wide', 'punctuation'),
  contrast('i1-comparator-individual', "My account fails but everyone else's works.", 'individual', 'comparison'),
  positive('i1-comparator-broad', 'One test account succeeds while all 19 schools remain affected.', 'all-schools', 'comparison'),
  positive('i1-comparator-other-schools', 'One school works but the other schools fail.', 'multiple-schools', 'comparison'),
  contrast('i1-year-report-not-population', 'The Year 8 report is missing.', 'unknown', 'boundary'),
  positive('i1-current-narrow-after-history', 'Yesterday every campus timed out. This morning only one registrar cannot submit.', 'individual', 'history', 'comparison'),
  contrast('i1-unaffected-numbered-comparison', 'One teacher cannot open Seesaw, but the other 26 teachers are working normally.', 'individual', 'comparison', 'boundary'),
  positive('i1-spelled-number-team', 'Twelve students have the wrong year level in the register.', 'team', 'count'),
  positive('i1-spelled-number-enrolments', 'Four new enrolments have duplicate IDs.', 'few-users', 'count'),
  positive('i1-numbered-administrators', 'Two administrators cannot use the browser.', 'few-users', 'count'),
];
