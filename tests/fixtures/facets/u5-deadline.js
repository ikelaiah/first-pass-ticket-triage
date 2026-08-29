export const facet = 'U5';
export const authoring = 'independent';
export const supportedStates = ['now', 'today', 'tomorrow', 'days-2-5', 'weeks-1-2', 'none', 'unknown'];

const caseWith = (id, text, value, committed, ...tags) => ({
  id, facet, text, expected: { value, committed },
  tags: [value === 'unknown' || value === 'none' ? 'negative' : 'positive',
    value === 'unknown' || value === 'none' ? 'contrast' : '', ...tags].filter(Boolean)
});

export const cases = [
  caseWith('u5-now-need', 'The correction must be ready immediately.', 'now', true, 'committed'),
  caseWith('u5-now-hour', 'Payroll must be finished within the hour.', 'now', true, 'committed'),
  caseWith('u5-today-payroll', 'The pay run must be completed before close of business.', 'today', true, 'committed'),
  caseWith('u5-today-assessment', "This must be completed before today's assessment.", 'today', true, 'committed'),
  caseWith('u5-today-class', 'The class starts at 9am.', 'today', true, 'committed'),
  caseWith('u5-today-cutoff', 'The operational cutoff is by 5pm.', 'today', true, 'committed'),
  caseWith('u5-tomorrow-required', 'This is required by tomorrow.', 'tomorrow', true, 'committed'),
  caseWith('u5-tomorrow-run', 'The next run has to complete tomorrow morning.', 'tomorrow', true, 'committed'),
  caseWith('u5-days-friday', 'The report is due Friday.', 'days-2-5', true, 'committed'),
  caseWith('u5-days-three', 'We need the correction within three days.', 'days-2-5', true, 'committed'),
  caseWith('u5-days-week', 'Please have this ready by the end of the week.', 'days-2-5', true, 'committed'),
  caseWith('u5-weeks-next', 'The change is needed next week.', 'weeks-1-2', true, 'committed'),
  caseWith('u5-weeks-until', 'The revised extract is not required until next week.', 'weeks-1-2', true, 'committed'),
  caseWith('u5-weeks-next-term', 'This can wait until next term.', 'weeks-1-2', false, 'deferred'),
  caseWith('u5-none-no-deadline', 'There is no deadline for this request.', 'none', true, 'no-deadline'),
  caseWith('u5-none-no-rush', 'Please investigate when possible; there is no rush.', 'none', true, 'no-deadline'),
  caseWith('u5-observed-morning', 'We noticed the failure this morning.', 'unknown', false, 'timestamp', 'negative', 'noise'),
  caseWith('u5-reported-clock', 'The issue was reported at 9am.', 'unknown', false, 'timestamp', 'negative'),
  caseWith('u5-login-yesterday', 'The teacher logged in yesterday.', 'unknown', false, 'timestamp', 'historical'),
  caseWith('u5-meeting-clock', 'The meeting is at 11am.', 'unknown', false, 'timestamp', 'negative'),
  caseWith('u5-discovered-today', 'Today we discovered the import problem.', 'unknown', false, 'timestamp', 'negative'),
];
