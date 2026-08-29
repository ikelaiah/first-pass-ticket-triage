/*
 * Cross-facet cases are intentionally kept separate from the eight state
 * tables. They exercise invariants between answers, not another dictionary of
 * production wording.
 */

export const metamorphicCases = [
  {
    id: 'meta-punctuation-and-politeness',
    facet: 'I1',
    variants: [
      'Canvas is unavailable for one teacher.',
      'Please help — Canvas is unavailable for one teacher!',
      'Hi team, Canvas is unavailable for one teacher. Thanks.'
    ],
    expected: 'individual',
    tags: ['metamorphic', 'normalisation']
  },
  {
    id: 'meta-clause-order',
    facet: 'I1',
    variants: [
      'Canvas is unavailable for all schools because classes cannot start.',
      'Classes cannot start because Canvas is unavailable for all schools.'
    ],
    expected: 'all-schools',
    tags: ['metamorphic', 'composition']
  },
  {
    id: 'meta-contraction-process',
    facet: 'I2',
    variants: [
      'The teacher cannot mark the roll in Canvas.',
      "The teacher can't mark the roll in Canvas.",
      'The teacher is unable to mark the roll in Canvas.'
    ],
    expected: 'blocked',
    tags: ['metamorphic', 'normalisation', 'positive']
  },
  {
    id: 'meta-email-footer',
    facet: 'U5',
    variants: [
      'Canvas is unavailable for one teacher and is required today.',
      'Canvas is unavailable for one teacher and is required today.\n\nRegards,\nIT Support'
    ],
    expected: 'today',
    tags: ['metamorphic', 'email-furniture']
  }
];

export const orthogonalityCases = [
  {
    id: 'ortho-scope-only',
    text: 'Canvas is unavailable for one teacher.',
    expected: { I1: 'individual', I2: 'unknown', I3: 'unavailable', I4: 'unknown', U5: 'unknown', U6: 'unknown', U7: 'unknown', U8: 'unknown' },
    tags: ['orthogonality', 'boundary']
  },
  {
    id: 'ortho-scope-and-deadline',
    text: "Canvas is unavailable for all schools and is required for today's assessment.",
    expected: { I1: 'all-schools', I2: 'unknown', I3: 'unavailable', I4: 'unknown', U5: 'today', U6: 'unknown', U7: 'unknown', U8: 'unknown' },
    tags: ['orthogonality', 'composition']
  },
  {
    id: 'ortho-workaround-does-not-change-scope',
    text: 'Canvas is unavailable for one teacher, but the teacher can continue with a paper form.',
    expected: { I1: 'individual', I2: 'unknown', I3: 'unavailable', I4: 'unknown', U5: 'unknown', U6: 'unknown', U7: 'yes', U8: 'unknown' },
    tags: ['orthogonality', 'workaround', 'contrast']
  }
];

export const compositionCases = [
  {
    id: 'compose-blocked-deadline',
    text: "Canvas is unavailable for all schools, classes cannot start, and today's lessons are affected.",
    expected: { I1: 'all-schools', I2: 'blocked', I3: 'unavailable', U5: 'today', U7: 'unknown' },
    tags: ['composition', 'positive']
  },
  {
    id: 'compose-no-workaround',
    text: 'One teacher cannot access Canvas, and there is no workaround.',
    expected: { I1: 'individual', I2: 'unknown', I3: 'unavailable', I4: 'unknown', U5: 'unknown', U6: 'unknown', U7: 'no', U8: 'unknown' },
    tags: ['composition', 'negative', 'contrast']
  },
  {
    id: 'compose-comparator-does-not-expand',
    text: "My Canvas account fails, but everyone else's works.",
    expected: { I1: 'individual', I2: 'unknown', I3: 'none', U5: 'unknown', U7: 'unknown' },
    tags: ['composition', 'comparison', 'contrast']
  },
  {
    id: 'compose-history-is-not-current',
    text: 'The certificate expired last month; it was renewed afterwards.',
    expected: { U8: 'unknown' },
    tags: ['composition', 'history', 'contrast']
  },
  {
    id: 'compose-active-versus-pending',
    text: 'The report could expose personal information if it is sent tomorrow.',
    expected: { I3: 'privacy-context', U8: 'pending', U5: 'tomorrow' },
    tags: ['composition', 'hypothetical', 'pending']
  }
];

export const allCompositionCases = [
  ...metamorphicCases,
  ...orthogonalityCases,
  ...compositionCases
];
