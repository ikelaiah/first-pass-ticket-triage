export const facet = 'I2';
export const authoring = 'independent';
export const supportedStates = [
  'attendance marking', 'enrolment processing', 'payroll or payment processing',
  'teaching and learning', 'emergency communication', 'reporting', 'unknown'
];

const blocked = (id, text, process, ...tags) => ({
  id, facet, text, expected: { state: 'blocked', process, source: 'explicit' },
  tags: ['positive', 'blocked-process', ...tags]
});
const notBlocked = (id, text, ...tags) => ({
  id, facet, text, expected: { state: 'unknown' },
  tags: ['negative', 'contrast', ...tags]
});

export const cases = [
  blocked('i2-attendance-cannot-mark', 'The teacher cannot mark the roll.', 'attendance marking', 'paraphrase'),
  blocked('i2-attendance-passive-roll', 'The roll cannot be marked.', 'attendance marking', 'passive-voice'),
  blocked('i2-attendance-entered', 'Attendance cannot be entered for the class.', 'attendance marking', 'passive-voice'),
  blocked('i2-attendance-take', "Teachers can't take attendance.", 'attendance marking', 'contraction'),
  blocked('i2-enrolment-processing', 'Admissions staff are unable to process enrolments.', 'enrolment processing', 'paraphrase'),
  blocked('i2-enrolment-passive', 'Student enrolments cannot be processed.', 'enrolment processing', 'passive-voice'),
  blocked('i2-enrolment-complete', 'We cannot complete the enrolment applications.', 'enrolment processing', 'synonym'),
  blocked('i2-payroll-run', 'The payroll team is unable to run payroll.', 'payroll or payment processing', 'paraphrase'),
  blocked('i2-payments-passive', 'Payments cannot be submitted through the gateway.', 'payroll or payment processing', 'passive-voice'),
  blocked('i2-timesheets-passive', 'Timesheets cannot be submitted.', 'payroll or payment processing', 'passive-voice'),
  blocked('i2-teaching-cannot', 'Teachers cannot teach their lessons.', 'teaching and learning', 'synonym'),
  blocked('i2-classes-start', 'Classes are unable to start this morning.', 'teaching and learning', 'passive-voice'),
  blocked('i2-learning-proceed', 'Learning cannot proceed in the classroom.', 'teaching and learning', 'synonym'),
  blocked('i2-beacon-used', 'The emergency beacon cannot be used.', 'emergency communication', 'passive-voice'),
  blocked('i2-beacon-access', 'Staff are unable to access Beacon for an emergency call.', 'emergency communication', 'paraphrase'),
  blocked('i2-emergency-communication', 'Emergency communication cannot be sent.', 'emergency communication', 'passive-voice'),
  blocked('i2-report-cards', 'Report cards cannot be sent to families.', 'reporting', 'passive-voice'),
  blocked('i2-reports-generated', 'The reports cannot be generated for the board.', 'reporting', 'passive-voice'),
  blocked('i2-reporting-unable', 'We are unable to generate the reports.', 'reporting', 'paraphrase'),
  notBlocked('i2-attendance-manual', 'The teacher can still mark the roll manually.', 'workaround'),
  notBlocked('i2-attendance-howto', 'How do I mark attendance?', 'how-to'),
  notBlocked('i2-attendance-history', 'Yesterday’s roll entry was completed by the teacher.', 'historical'),
  notBlocked('i2-attendance-unaffected', 'Attendance is not affected.', 'negation'),
  notBlocked('i2-login-only', 'The teacher cannot log into Seesaw.', 'technical-symptom', 'noise'),
  notBlocked('i2-reporting-question', 'How can I generate reports?', 'how-to'),
];
