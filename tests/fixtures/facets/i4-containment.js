export const facet = 'I4';
export const authoring = 'independent';
export const supportedStates = ['contained', 'spreading', 'recurring', 'unknown-extent', 'unknown'];

const caseWith = (id, text, state, ...tags) => ({
  id, facet, text, expected: { state },
  tags: [state === 'unknown' ? 'negative' : 'positive', state === 'unknown' ? 'contrast' : '', ...tags].filter(Boolean)
});

export const cases = [
  caseWith('i4-contained-record', 'Only this one record is affected.', 'contained', 'contained'),
  caseWith('i4-contained-family', 'The fault is limited to one family.', 'contained', 'contained'),
  caseWith('i4-contained-students', 'Three students are affected, but the issue is contained to those records.', 'contained', 'contained', 'scope'),
  caseWith('i4-not-spreading', 'The incorrect data is not spreading to other records.', 'contained', 'negation', 'contained'),
  caseWith('i4-spreading-downstream', 'The incorrect data is being copied into downstream systems.', 'spreading', 'propagation'),
  caseWith('i4-spreading-records', 'New bad records are continuing to be created.', 'spreading', 'propagation'),
  caseWith('i4-spreading-more', 'Incorrect data is reaching more records each day.', 'spreading', 'propagation'),
  caseWith('i4-recurring-sync', 'We fix the record, but it changes back after every sync.', 'recurring', 'recurrence'),
  caseWith('i4-recurring-again', 'The same data problem has happened again this week.', 'recurring', 'recurrence'),
  caseWith('i4-recurring-intermittent', 'The sync succeeds sometimes and fails again on the next run.', 'recurring', 'recurrence'),
  caseWith('i4-recurring-import', 'The same problem happens again after each import.', 'recurring', 'recurrence'),
  caseWith('i4-unknown-count', "We don't know how many other records are affected.", 'unknown-extent', 'unknown-extent'),
  caseWith('i4-unreported', 'There may be more affected records that have gone unnoticed.', 'unknown-extent', 'unknown-extent'),
  caseWith('i4-unknown-scope', 'The problem is intermittent, but we have not established its extent.', 'unknown', 'boundary'),
  caseWith('i4-breadth-not-spread', 'Incorrect data affects three schools, but there is no evidence the error is spreading.', 'unknown', 'scope', 'boundary'),
  caseWith('i4-breadth-alone', 'Three schools are affected by the import failure.', 'unknown', 'scope', 'boundary'),
  caseWith('i4-comparator', 'One student works, but students at all 19 schools are otherwise failing.', 'unknown', 'comparison', 'boundary'),
  caseWith('i4-success-no-propagation', 'A successful test record does not show that the bad data is spreading.', 'unknown', 'comparison', 'negation'),
  caseWith('i4-no-spread-explicit', 'The incident is isolated and has not spread further.', 'contained', 'contained', 'negation'),
  caseWith('i4-unknown-boundary', 'The investigation has not yet confirmed whether other records are affected.', 'unknown', 'negation', 'boundary'),
];
