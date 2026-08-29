export const facet = 'I3';
export const authoring = 'independent';
export const supportedStates = [
  'privacy-exposure', 'privacy-context', 'incorrect-data', 'lost-data',
  'financial-harm', 'security-compromise', 'safety', 'safeguarding', 'unavailable'
];

const positive = (id, text, expected, ...tags) => ({
  id, facet, text, expected, tags: ['positive', ...tags]
});
const contrast = (id, text, expected, ...tags) => ({
  id, facet, text, expected, tags: ['negative', 'contrast', ...tags]
});

export const cases = [
  positive('i3-privacy-sees-family', "A parent can see another family's information.",
    { risks: ['privacy'], modifiers: { exposureActive: true } }, 'privacy', 'active'),
  positive('i3-privacy-family-balance', 'Parents are currently viewing another family\'s fee balances.',
    { risks: ['privacy'], modifiers: { exposureActive: true } }, 'privacy', 'active'),
  positive('i3-privacy-wrong-student', 'The portal shows a different student\'s details to a parent.',
    { risks: ['privacy'], modifiers: { exposureActive: true } }, 'privacy', 'active'),
  positive('i3-privacy-wrong-recipient', 'The report was sent to the wrong family.',
    { risks: ['privacy'], modifiers: { exposureActive: true } }, 'privacy', 'active'),
  contrast('i3-privacy-context-only', 'The system contains parent information.',
    { risks: ['privacy'], modifiers: { exposureActive: false } }, 'privacy', 'boundary'),
  contrast('i3-confidential-context', 'The report contains confidential student data.',
    { risks: ['privacy'], modifiers: { exposureActive: false } }, 'privacy', 'boundary', 'noise'),
  positive('i3-wrong-data', 'The student records contain incorrect information.',
    { risks: ['dataIntegrity'] }, 'data-integrity'),
  positive('i3-wrong-payment', 'The wrong payment amount was sent.',
    { risks: ['dataIntegrity', 'financial'] }, 'financial'),
  contrast('i3-payment-unavailable', 'The payment screen will not load.',
    { risksAbsent: ['dataIntegrity'], modifiers: { exposureActive: false } }, 'availability', 'boundary'),
  positive('i3-deleted-folder', 'The Year 12 folder was deleted.',
    { symptom: 'data-loss' }, 'lost-data'),
  contrast('i3-unavailable-folder', 'The Year 12 folder is temporarily unavailable.',
    { risksAbsent: ['dataIntegrity'], symptom: 'unavailable' }, 'availability', 'boundary'),
  positive('i3-unpaid-staff', 'Staff have not been paid.',
    { risks: ['payroll'], modifiers: { unpaidRisk: true } }, 'financial', 'active'),
  positive('i3-security-compromise', 'An attacker has taken over a staff account.',
    { risks: ['security'], symptom: 'account-compromise' }, 'security'),
  positive('i3-privacy-wrong-address', 'A parent can open another family\'s address in the portal.',
    { risks: ['privacy'], modifiers: { exposureActive: true } }, 'privacy', 'active'),
  positive('i3-safeguarding', 'A worker without a valid clearance is supervising children.',
    { risks: ['safeguarding'] }, 'safeguarding'),
  positive('i3-safety-alert', 'The allergy alert is missing during today\'s excursion.',
    { risks: ['safety'] }, 'safety'),
  contrast('i3-safety-planned-update', 'Please update the allergy information for next term.',
    { risks: ['safety'], modifiers: { immediateSafeguarding: false } }, 'safety', 'planned'),
  contrast('i3-pending-exposure', 'The change could expose records if deployed tomorrow.',
    { risks: ['privacy'], modifiers: { exposureActive: false } }, 'privacy', 'pending'),
  contrast('i3-hypothetical-loss', 'The test plan asks whether files could be deleted.',
    { risksAbsent: ['dataIntegrity'] }, 'hypothetical', 'boundary'),
  contrast('i3-no-unsafe-effect', 'The certificate will not cause unsafe access before renewal.',
    { modifiers: { exposureActive: false } }, 'negation', 'boundary'),
  contrast('i3-no-one-shown-details', "The report contains confidential details, but nobody has been shown another student's information.",
    { risks: ['privacy'], modifiers: { exposureActive: false } }, 'negation', 'boundary'),
  contrast('i3-pending-reveal', 'A planned export could reveal student addresses if deployed next quarter.',
    { risks: ['privacy'], risksAbsent: ['security'], modifiers: { exposureActive: false } }, 'pending', 'boundary'),
];
