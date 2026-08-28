# Changelog

## [0.4.1] - 2026-08-29

### Added

- Business-consequence facts for named attendance, enrolment, payroll/payment,
  teaching, emergency communication, and reporting processes.
- Consequence provenance (`explicit`, `inferred`, `manual`, or `unknown`) in the
  result, evidence, explanation, and analyst refinement flow.
- A Business consequence refinement with `impaired` and `blocked` choices.
- Optional labelled-facet evaluation for scope, consequence, deadline, driver,
  workaround, and containment; mismatch reports identify cases but never echo ticket
  text.
- Synthetic explicit-consequence and generic-symptom calibration examples.

### Changed

- Explicit or analyst-confirmed blocked work now contributes through the existing
  impact and urgency models, rather than assigning a priority directly.
- Configured system-status consequences remain explanatory inferences and do not
  automatically increase scoring until an analyst confirms them.
- Example tickets now state the business scope, consequence, and deadline used to
  assess them; operator-only background knowledge is not used as ticket evidence.

### Fixed

- I2 no longer presents a technical symptom such as an SSO failure as though it were a
  stated blocked business process; it remains Unknown until the process is described
  or confirmed.
- An unanchored claim such as "This is broken" no longer treats the pronoun or a
  generic failure as evidence of an incident, workaround, deadline, or impact.

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
