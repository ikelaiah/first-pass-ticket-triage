/*
 * Small, hand-written v0.7.0 regression set. These sentences are deliberately
 * kept outside the semantic fixtures and accuracy corpus so a phrase-level
 * edit cannot silently make every test share the same wording.
 */
export const legacyRegressionCases = [
  {
    id: 'legacy-one-teacher-seesaw',
    text: 'One teacher cannot open Seesaw, but the rest of the staff can continue teaching.',
    expected: { i1: 'individual' }
  },
  {
    id: 'legacy-all-schools-portal',
    text: 'All 19 schools cannot access the parent portal and teachers cannot mark attendance.',
    expected: { i1: 'all-schools', i2: 'blocked' }
  },
  {
    id: 'legacy-active-family-exposure',
    text: "Parents can currently see another family's fee balance.",
    expected: { i3: 'privacy-exposure', u8: 'active' }
  },
  {
    id: 'legacy-direct-debit-cutoff',
    text: 'The direct debit run is due today and families will not be charged.',
    expected: { u5: 'today', u6: 'operational' }
  },
  {
    id: 'legacy-no-workaround',
    text: 'Staff cannot generate reports and there is no workaround.',
    expected: { i2: 'blocked', u7: 'no' }
  },
  {
    id: 'legacy-contained-record',
    text: 'Only one record is wrong and the import is contained to that record.',
    expected: { i3: 'incorrect-data', i4: 'contained' }
  },
  {
    id: 'legacy-recurring-sync',
    text: 'The sync fails again after every sync.',
    expected: { i4: 'recurring' }
  }
];
