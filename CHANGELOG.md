# Changelog

## [0.7.1] - 2026-08-29 — NLP Evaluation Integrity & Regression Hardening

### Added

- Hardened the offline evaluation corpus with unique IDs and normalised ticket
  text, controlled-value validation, authoritative matrix checks, reviewed
  alternatives, explicit mismatch classifications, and visible quality
  denominators.
- Added 24 independently authored realistic regression tickets, cross-facet
  invariants, legacy regression sentences, and semantic/evaluation/legacy
  exact-copy independence checks.
- Added a complete v0.7.0 baseline comparison report; all 57 pre-existing
  evaluation cases retain the same facet and outcome projections.

### Fixed

- Corrected historical/current and unaffected-comparison scope extraction,
  written-number and administrator counts, paper/browser workaround wording,
  passive exposure negation, pending `reveal` harm, contained/propagating/
  unknown-extent context, explicit no-deadline timestamps, and remaining
  enrolment blocked-process wording.

### Unchanged

- Impact/Urgency scoring, all scoring weights, the authoritative 3×3 P1–P4
  matrix, policy semantics, catalogue neutrality, and the dependency-free,
  local-only browser architecture remain unchanged. The evaluation report does
  not claim that policy disagreements are engine defects.

## [0.7.0] - 2026-08-29 — Eight-Facet NLP Robustness Hardening

### Added

- Added an independently authored, dependency-free semantic corpus for all eight
  triage facets: I1 scope, I2 blocked process, I3 irreversibility/risk, I4
  containment, U5 deadline, U6 driver, U7 workaround, and U8 harm timing.
- Added positive, contrast, negation, noise, history, comparator, contradiction,
  metamorphic, orthogonality, and composition coverage with supported-state
  invariants and a compact Node/browser coverage report.
- Expanded the labelled offline evaluation fixture to 57 realistic-style examples
  and added eight-facet accuracy denominators and mismatch reporting while keeping
  the existing priority safety metrics.
- Added corpus validation for the authoritative Impact/Urgency/Priority matrix and
  explicit review classifications for remaining outcome mismatches, including
  acceptable alternative priorities and deferred policy disagreements.

### Improved

- Hardened deterministic recognition for passive blocked-process wording, scope
  comparisons and descriptor phrases, privacy/access negation, risk-family overlap,
  recurrence, pending harm, data loss, and manual-workaround variants.
- Corrected active-access, resolved-context, current-exposure-negation, payroll
  success, and read-only-report evidence handling without changing scoring policy.
- Preserved evidence provenance and conservative Unknown answers for historical,
  hypothetical, and evidence-limited wording.

### Unchanged

- No AI, network call, backend, dependency, framework, persistence, or build step
  was added. Impact/Urgency scoring and the authoritative 3×3 P1–P4 matrix remain
  the only priority path; platform catalogue membership remains scoring-neutral.

## [0.6.1] - 2026-08-29

### Fixed

- Corrected the Markdown catalogue reconciliation parser for three-column tables;
  all 47 affected source rows now retain their URL without inventing a typical level.
- Reconciled all 206 source assignments against source-provided metadata, including
  main use, level/environment/role where present, and URL.
- Merged BrainPOP and BrainPOP Jr. into one canonical family while retaining both
  source rows and categories.
- Added catalogue-wide duplicate literal-alias validation and removed generic
  `screen reader`/`reader` inference for ReadSpeaker.
- Guarded the reviewed bare Clipboard, Sora, and Quill aliases against ordinary
  language false positives.
- Recognised explicit attendance-blocking wording such as `cannot mark roll`,
  including optional articles, equivalent action verbs, and normalised
  `can't`/`unable to` forms, without inferring a consequence from a login symptom.

### Unchanged

- Impact, Urgency, the authoritative P1–P4 matrix, organisation criticality,
  scheduled jobs, source-of-truth flows, and result-model compatibility.

## [0.6.0] - 2026-08-29

### Added

- Complete Pre-K–12 platform catalogue coverage for all 206 category assignments
  across reference sections 1–22, with 162 canonical entities and multi-category
  membership preserved.
- Category-aware result metadata for platform context, including accurate standard
  and provisioning-method entity types.
- Automated Markdown-to-catalogue reconciliation, representative recognition tests,
  and negative tests for ambiguous product names.

### Changed

- Generic platform identity is separated from organisation-specific systems,
  critical flags, schedules, source-of-truth relationships and status consequences.
- Platform families and modules are normalised visibly while retaining every source
  name and category assignment.
- Alias handling is conservative for ordinary words such as Clever, Compass,
  Formative, Flat, Oliver, Scratch, Teams, Classroom, Forms, Moodle and Canva.

### Unchanged

- Platform category membership has no scoring weight. Priority remains
  Evidence → Impact + Urgency → the authoritative 3×3 matrix → P1–P4.

## [0.5.1] - 2026-08-29

### Fixed

- Differential evidence now distinguishes partial or conditional failures from
  isolated comparisons without erasing explicitly broad scope.
- A working comparator no longer suppresses the broad-failure urgency contribution
  when many schools or records are reported as affected.

## [0.5.0] - 2026-08-29

### Added

- Fragment-based share links (`#t=`), with a 2000-character cap and one-time cleanup
  for legacy `?t=` links.
- Reliability regressions for conservative schedule detection, adversarial context,
  assessment abstention, matrix validation, share privacy and heuristic confidence
  wording.
- GitHub Actions coverage for `npm test` on pushes and pull requests.

### Changed

- Assessment confidence and evidence completeness are labelled as heuristic signals,
  never as probabilities.
- Unassessed results no longer present the internal P4 matrix cell as an actionable
  suggestion; the raw matrix result remains available for explanation.
- Evaluation reports any and severe under-prioritisation, P1 false negatives and
  false positives, while keeping mismatch reports privacy-safe.
- Organisation-specific configuration remains public and replaceable; secrets do not
  belong in the static application.

### Fixed

- Clock times only de-escalate when grammatically associated with a supported record
  creation/update event, not an unrelated meeting, access window or report timestamp.
- Invalid impact or urgency values now fail with a useful error instead of producing an
  undefined matrix result.

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
