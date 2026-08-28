# Changelog

## [0.4.0] - 2026-08-28

### Added

- Current-decision context preprocessing for resolved updates, quoted history,
  simulations, exercises, design requirements, and test cases.
- Explicit `assessmentStatus` and `suggestedPriority` result fields so unassessed input
  is not mistaken for an actionable P4 suggestion.
- Dependency-free offline corpus evaluation with priority, impact, urgency, P1 safety,
  abstention, coverage, and confusion-matrix metrics.
- Contrast tests for inactive wording and nearby active production incidents.

### Fixed

- Manual containment, deadline-driver, and harm-timing refinements now affect scoring
  instead of changing only the displayed evidence.
- An isolated one-student record-status error remains low urgency without a stated
  deadline or active business consequence.
- An Edumate student shown as a public contact now explains the resulting class-roll
  and downstream education-system exclusion, while asking whether a billing or
  invoicing deadline is actually affected.
- Resolved or contained history no longer escalates a current update as though harm were
  still active.
- Hypothetical failures in exercises, UAT simulations, designs, and test cases no longer
  manufacture live incidents.

### Changed

- `npm test` now runs behavioural tests, the privacy scan, evaluator metric self-tests,
  and the local schema-example corpus.
