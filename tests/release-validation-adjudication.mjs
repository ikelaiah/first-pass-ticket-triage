/*
 * Release-only capability-boundary ledger. This is deliberately separate from
 * the frozen labelled corpus: it documents exact evaluator differences without
 * changing a label, an expected priority, or the evaluator's raw metrics.
 */
export const capabilityBoundaries = Object.freeze({
  'release-07-keyboard-accommodation': 'B',
  'release-10-invoice-entry-cost': 'B',
  'release-11-stale-bus-arrivals': 'B',
  'release-17-lab-eyewash-control': 'B',
  'release-21-casual-pay-missing': 'B',
  'release-23-enrolment-restore-lock': 'B',
  'release-25-timetable-repeating-campus': 'B',
  'release-32-retired-phone-workaround': 'B',
  'release-35-small-group-absence-import': 'B',
  'release-09-three-tutors-assessment-submit': 'C',
  'release-12-wellbeing-report-request': 'C',
  'release-13-approved-permissions-draft': 'C',
  'release-19-transport-claim-cutoff': 'C',
  'release-20-payroll-reconcile-separation': 'C',
  'release-22-corrected-pay-history': 'C',
  'release-26-year-group-spread': 'C',
  'release-27-current-narrow-after-history': 'C',
  'release-33-household-records-separated': 'C',
  'release-34-potential-export-and-analytics': 'C',
  'release-14-disciplinary-note-cross-department': 'D',
  'release-15-volunteer-welfare-account': 'D',
  'release-24-permission-forms-no-snapshot': 'D',
  'release-28-certificate-grant-window': 'D',
  'release-36-submission-reference-only': 'D'
});

export const reviewedAmbiguities = Object.freeze({
  'release-18-campus-drill-roster': 'acceptable ambiguity'
});

export function adjudicateDivergences(ids) {
  const capability = [];
  const ambiguity = [];
  const unadjudicated = [];
  for (const id of ids) {
    if (capabilityBoundaries[id]) capability.push({ id, category: capabilityBoundaries[id] });
    else if (reviewedAmbiguities[id]) ambiguity.push({ id, classification: reviewedAmbiguities[id] });
    else unadjudicated.push(id);
  }
  const categories = Object.fromEntries(['B', 'C', 'D'].map((category) => [category,
    capability.filter((item) => item.category === category).length
  ]));
  return { capability, ambiguity, unadjudicated, categories };
}
