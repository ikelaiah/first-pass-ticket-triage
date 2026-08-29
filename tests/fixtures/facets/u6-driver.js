export const facet = 'U6';
export const authoring = 'independent';
export const supportedStates = ['statutory', 'operational', 'preference', 'unknown'];

const caseWith = (id, text, driver, ...tags) => ({
  id, facet, text, expected: { driver },
  tags: [driver === 'unknown' ? 'negative' : 'positive', driver === 'unknown' ? 'contrast' : '', ...tags].filter(Boolean)
});

export const cases = [
  caseWith('u6-statutory-census', 'The census submission is a statutory requirement.', 'statutory', 'requirement'),
  caseWith('u6-statutory-government', 'Government reporting must be lodged by Friday.', 'statutory', 'requirement'),
  caseWith('u6-statutory-compliance', 'This is required for the compliance submission.', 'statutory', 'requirement'),
  caseWith('u6-statutory-audit', 'The audit deadline is next week.', 'statutory', 'requirement'),
  caseWith('u6-operational-payroll', 'The payroll cutoff is this afternoon.', 'operational', 'requirement'),
  caseWith('u6-operational-payrun', 'The pay run is due before close of business.', 'operational', 'requirement'),
  caseWith('u6-operational-class', 'The class starts at 9am, so access is needed first.', 'operational', 'requirement'),
  caseWith('u6-operational-vendor', 'The vendor cutoff is Friday.', 'operational', 'requirement'),
  caseWith('u6-operational-assessment', 'The assessment begins tomorrow morning.', 'operational', 'requirement'),
  caseWith('u6-preference-prefer', "I'd prefer this by Friday.", 'preference', 'preference'),
  caseWith('u6-preference-possible', 'Please do this today if possible.', 'preference', 'preference'),
  caseWith('u6-preference-convenience', 'It can be handled at your convenience.', 'preference', 'preference'),
  caseWith('u6-preference-nice', 'It would be nice to have this by next week.', 'preference', 'preference'),
  caseWith('u6-preference-requested', 'We would like the report by Friday, if possible.', 'preference', 'preference'),
  caseWith('u6-unknown-principal', 'The principal wants this today.', 'unknown', 'seniority', 'negative'),
  caseWith('u6-unknown-ceo', 'The CEO has escalated the request.', 'unknown', 'escalation', 'negative'),
  caseWith('u6-unknown-urgent', 'Urgent please; this is very important to me.', 'unknown', 'assertion', 'negative', 'noise'),
  caseWith('u6-unknown-meeting', 'The meeting is at 11am, but no work is required for it.', 'unknown', 'timestamp', 'negative'),
  caseWith('u6-unknown-deadline', 'This has a deadline, but the reason is not stated.', 'unknown', 'unknown-driver', 'negative'),
  caseWith('u6-unknown-date', 'The ticket mentions Friday, but not what depends on it.', 'unknown', 'unknown-driver', 'negative'),
];
