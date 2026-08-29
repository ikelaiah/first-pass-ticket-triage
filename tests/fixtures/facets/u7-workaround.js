export const facet = 'U7';
export const authoring = 'independent';
export const supportedStates = ['yes', 'partial', 'no', 'unknown'];

const caseWith = (id, text, value, ...tags) => ({
  id, facet, text, expected: { value },
  tags: [value === 'unknown' || value === 'no' ? 'negative' : 'positive',
    value === 'unknown' || value === 'no' ? 'contrast' : '', ...tags].filter(Boolean)
});

export const cases = [
  caseWith('u7-yes-manual', 'We can process the applications manually.', 'yes', 'manual'),
  caseWith('u7-yes-printer', 'Another printer works for the office.', 'yes', 'alternative'),
  caseWith('u7-yes-browser', "Chrome works even though Edge doesn't.", 'yes', 'alternative', 'contrast'),
  caseWith('u7-yes-spreadsheet', 'Staff can continue using the spreadsheet.', 'yes', 'manual'),
  caseWith('u7-yes-paper', 'We can use the paper form while the portal is down.', 'yes', 'manual'),
  caseWith('u7-yes-old-process', 'The old process remains available for now.', 'yes', 'alternative'),
  caseWith('u7-yes-cost', 'Two hours per day are needed to enter the records manually.', 'yes', 'cost'),
  caseWith('u7-partial-staff', 'The workaround works for staff but not students.', 'partial', 'partial'),
  caseWith('u7-partial-half', 'We can process half the cases manually.', 'partial', 'partial'),
  caseWith('u7-partial-urgent', 'Only urgent applications can be handled manually.', 'partial', 'partial'),
  caseWith('u7-partial-intermittent', 'The alternative works only sometimes.', 'partial', 'partial'),
  caseWith('u7-no-explicit', 'There is no workaround.', 'no', 'negation'),
  caseWith('u7-no-alternative', 'Nothing else works and manual processing is impossible.', 'no', 'negation'),
  caseWith('u7-no-fallback', 'There is no fallback for the failed service.', 'no', 'negation'),
  caseWith('u7-no-stopped', 'The workaround stopped working.', 'no', 'negation', 'contrast'),
  caseWith('u7-unknown-history', 'We used a workaround last week.', 'unknown', 'historical'),
  caseWith('u7-unknown-question', 'We have not established whether a workaround exists.', 'unknown', 'unknown'),
  caseWith('u7-unknown-topic', 'The ticket mentions a workaround but does not say whether it works now.', 'unknown', 'unknown', 'noise'),
  caseWith('u7-unknown-conditional', 'If there is a fallback, the team has not confirmed it.', 'unknown', 'unknown', 'hypothetical'),
  caseWith('u7-no-manual', 'There is no manual option for this process.', 'no', 'negation'),
  caseWith('u7-yes-on-paper', 'Teachers are still taking attendance on paper.', 'yes', 'manual'),
  caseWith('u7-no-paper-roll', 'There is no paper roll or other process available.', 'no', 'negation'),
  caseWith('u7-yes-browser-completes', 'Chrome lets two administrators complete the checks while Edge is down.', 'yes', 'alternative'),
  caseWith('u7-partial-paper-enrolments', 'The paper process works for some enrolments but not for the remaining cases.', 'partial', 'partial'),
];
