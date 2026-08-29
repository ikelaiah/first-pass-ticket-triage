export const facet = 'U8';
export const authoring = 'independent';
export const supportedStates = ['active', 'pending', 'unknown'];

const caseWith = (id, text, timing, ...tags) => ({
  id, facet, text, expected: { timing },
  tags: [timing === 'unknown' ? 'negative' : 'positive', timing === 'unknown' ? 'contrast' : '', ...tags].filter(Boolean)
});

export const cases = [
  caseWith('u8-active-expired', 'The certificate expired this morning.', 'active', 'active'),
  caseWith('u8-pending-expiring', 'The certificate expires tomorrow.', 'pending', 'pending'),
  caseWith('u8-active-exposure', "Parents are currently seeing another family's records.", 'active', 'active', 'privacy'),
  caseWith('u8-pending-exposure', 'The change could expose records if deployed tomorrow.', 'pending', 'pending', 'privacy'),
  caseWith('u8-active-pay', 'Staff have not been paid.', 'active', 'active', 'financial'),
  caseWith('u8-pending-pay', "Payroll will fail tomorrow if this isn't fixed.", 'pending', 'pending', 'financial'),
  caseWith('u8-active-safety', "The allergy alert is missing during today's excursion.", 'active', 'active', 'safety'),
  caseWith('u8-pending-safety', "The allergy alert must be fixed before next month's excursion.", 'pending', 'pending', 'safety'),
  caseWith('u8-active-deletion', 'Files have already been deleted.', 'active', 'active', 'lost-data'),
  caseWith('u8-pending-deletion', 'Files are at risk of being deleted.', 'pending', 'pending', 'lost-data'),
  caseWith('u8-pending-would-expose', 'The records would be exposed by next week\'s deployment.', 'pending', 'pending', 'privacy'),
  caseWith('u8-active-breach', 'The privacy breach is active and ongoing.', 'active', 'active', 'privacy'),
  caseWith('u8-unknown-negated-exposure', 'No one is currently exposed to another family\'s records.', 'unknown', 'negation', 'boundary'),
  caseWith('u8-unknown-resolved', 'The data was exposed yesterday, but access has now been removed.', 'unknown', 'historical', 'resolved'),
  caseWith('u8-unknown-history', 'The certificate expired last month; it was renewed afterwards.', 'unknown', 'historical'),
  caseWith('u8-unknown-risk', 'There is a risk that a problem could happen later.', 'unknown', 'hypothetical'),
  caseWith('u8-unknown-description', 'The system stores private student information.', 'unknown', 'boundary', 'noise'),
  caseWith('u8-active-incorrect-use', 'Incorrect payment data is being used now.', 'active', 'active', 'data-integrity'),
  caseWith('u8-active-current', 'The wrong student details are currently visible.', 'active', 'active', 'privacy'),
  caseWith('u8-unknown-description-2', 'The service records a potential exposure for review.', 'unknown', 'boundary', 'hypothetical'),
];
