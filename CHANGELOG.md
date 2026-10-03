# Changelog

## [0.13.0] - 2026-10-03 — Usable and Learnable

The usability release. It keeps the v0.12 model unchanged and reshapes the result
card and inputs around the workflow the tool exists for: get a priority, then ask
for the facts the ticket did not state.

### Added

- **Ask the requester** — a prominent panel directly under the verdict that lists
  the ranked unknowns which could change the priority, with a **Copy all
  questions** button. It merges the follow-up questions and the Safe Next Action
  clarifications, so the same question is never shown twice.
- A sticky **jump-to** bar indexing every result panel (Verdict, Ask the
  requester, Next action, 8 Questions, Why this priority, Handoff, Reply,
  Details).
- A live **refine verdict chip** and an **open-question count** in the refine
  summary, so a recalculation is visible right where the analyst is working.
- **Featured example** buttons (one per priority band) and example loading on
  selection, replacing the two-step picker.
- In-app **How this works** empty state with links to the framework and user
  guide.
- README screenshots (result card, input, mobile), CI/release/licence badges and
  a 60-second quickstart.

### Changed

- The result card is reordered for scanning: verdict → Ask the requester → Safe
  Next Action → Why → 8 Questions → Handoff → Reply → details. Everything stays
  visible; nothing is hidden behind a collapse.
- The refine panel is grouped into **Impact** and **Urgency** fieldsets, with the
  risk flags in their own fieldset.
- **Assessment confidence** now explains that its percentage is a heuristic
  evidence-completeness score, not a probability.
- All copy actions share one implementation (`js/ui/clipboard.js`) with a single
  polite live region, so screen readers hear "… copied".
- CI/formatting is cross-platform (`prettier` `endOfLine: auto`).

### Fixed

- The unassessed banner no longer renders “— — Unassessed”; it shows a plain
  _Unassessed_ label with the reason.
- Focus moves to the result heading after analysis, and the matrix scroll
  container is keyboard-focusable with a visible focus outline.
- The header privacy block is slimmer; the detail is one click away.
- Copy buttons have larger touch targets.

### Verified

- `npm run check` green: ESLint, Prettier, `tsc --noEmit` and 85 acceptance
  assertions plus the privacy source scan.
- Headless-Chrome checks: the P1 card renders the Ask block, jump nav and refine
  chip; the unassessed path renders without the doubled dash; the no-ticket page
  shows the How this works state and featured examples.
- `docsprout check` passes (3 sections, 7 pages).

## [0.12.1] - 2026-10-03 — Hygiene, Tooling and Docs

A maintenance release on top of the v0.12.0 simplification: remove dead weight,
add development checks, and document the project properly. No user-facing
behaviour change except the two bug fixes noted below.

### Added

- Development-only tooling: ESLint, Prettier and TypeScript (`checkJs`) with a
  `npm run check` aggregate that runs lint, format check, type check and tests.
  The shipped application stays dependency-free and buildless.
- `.editorconfig`, `.prettierrc.json`, `eslint.config.js`, `tsconfig.json`, and
  a `package-lock.json` for reproducible dev installs.
- Developer documentation under `docs/`: a user guide, architecture, glossary,
  contributing and extending guides, plus a framework pointer, configured for
  local preview and checks with DocSprout. Docs are not deployed; they are read
  on GitHub.
- A separate CI job that runs `docsprout check`; the app checks are split into
  distinct lint, format, type and test steps.

### Changed

- `js/data/examples.js` is now the single source of truth for worked examples;
  the test suite imports it instead of keeping a duplicate list that had already
  drifted. The 56 examples are asserted directly.
- Restored the documented `criticality.failure` calibration: a shared delivery
  pipeline with an active build failure is High impact (the "all Azure DevOps
  pipelines failing before a payroll fix" example is P2 again).
- School-count displays derive from `js/config.js` rather than hardcoding "19".
- `js/data/examples.js` expectations for the two examples whose behaviour the
  v0.12.0 simplification intentionally changed are now explicit: the
  after-the-sync casual staff record is P3 (no scheduled-run inference), and the
  bare feature request with no named system is unassessed.

### Removed

- Dead code and exports: `sourceOfTruth`, `differential`, `technicalDomain`,
  `platformCategories`, `confidenceNotes`, `appliedRules`, `matrixCells`,
  `negatedSymptoms`, `rawPropagating`, `strippedChars`, `IMPACT_LEVELS`,
  `URGENCY_LEVELS`, `scope._internal`, `dom.fact`, unused imports, and several
  unused phrase dictionaries left over from the removed inference layers.
- Dead CSS (`.tagline`, `.known-answer`, `.stripped-note`, and a conflicting
  duplicate `.justification-text` block).
- The stale `tests/fixtures` reference in `.gitattributes`.

### Fixed

- The "About this example" note no longer appears before any example is loaded
  (a first-run staleness bug).
- **Share Link** now explains itself when the input is empty instead of silently
  doing nothing, and its feedback is announced to assistive technology.

### Verified

- `npm run check` is green: ESLint, Prettier, `tsc --noEmit` and 85 acceptance
  assertions, plus the privacy source scan.
- `docsprout check` passes (3 sections, 7 pages).
- Headless-Chrome load of a shared ticket still renders the full result card
  with no console errors.

## [0.12.0] - 2026-10-03 — Core Simplification

A deliberate reduction of the project to the eight-question model and the
3x3 matrix. The tool now detects what the ticket states and asks about the
rest, instead of inferring facts from configuration and prose.

### Removed

- Removed the generic Pre-K-12 platform catalogue (`js/data/platform-catalogue.js`,
  ~1,960 lines) and its source document and reconciliation test. Platform
  categories never contributed to Impact, Urgency or the matrix; unrecognised
  platforms now lower confidence and become a follow-up question.
- Removed the inference layers: decision-context history (`context.js`),
  technical-domain classifier (`domain.js`), work-type classifier
  (`work-type.js`), support-context detector (`support-context.js`), the
  scheduled-job "expected behaviour" and "known answer" logic, source-of-truth
  flows, differential diagnosis, continuity fallback and status-consequence
  inference.
- Removed the organisation-config blocks that fed those layers:
  `scheduledJobs`, `dataFlows`, `statusConsequences` and `businessCycles`.
- Removed the v0.8.0 policy table (34 rules) except the hard-safety floor.
- Removed the evaluation, holdout, facet, catalogue and per-feature test
  machinery, all frozen corpora, and the historical `docs/` and `tasks/`
  documents.

### Changed

- Rewrote the pipeline (`js/engine/analyzer.js`) to: normalise text, read the
  eight decision questions and symptom severity, score Impact and Urgency, apply
  a small safety calibration, then resolve P1–P4 only through the matrix. Every
  unknown that could move the cell becomes a ranked follow-up question.
- Kept one context rule: an explicit "resolved" update is not scored as live.
- Simplified `policy.js` to the safety floor (resolution, confirmed same-day
  financial failure, active exposure, compromised account, lost device,
  safety/safeguarding, propagation, unrecoverable loss, costly workaround,
  active-incident recovery).
- Decoupled system detection from the catalogue; it now uses only the
  organisation's configured aliases.
- Retained Safe Next Action, Triage Handoff and the suggested reply as pure
  projections that cannot change Impact, Urgency or the priority.
- Added a coverage fix so "visible to the wrong person" flags privacy and
  active exposure.

### Verified

- 51 acceptance assertions pass: the matrix, each of the eight questions,
  21 framework worked examples, the hard safety invariants, the advisory
  projections and the share link.
- Static privacy scan passes; headless-Chrome load of a shared ticket renders
  the full result card with no console errors.

### Behaviour change

- A subject-less report (for example "Just reporting an issue") and a bare
  feature request with no named system are now **unassessed** with a follow-up
  question, rather than being scored as P4. This is the intended "ask, don't
  guess" contract.

## [0.11.1] - 2026-09-21 — Replacement Holdout Measurement

### Added

- Added `tests/fixtures/accuracy-holdout-v0.11.1.json`, an independently
  authored and labelled 24-case replacement holdout with I3/U8 facet fields, and
  `tests/validate-holdout.mjs`, a safe work-in-progress validator.
- Added `tests/replacement-holdout-evaluation.mjs` and
  `docs/260920-replacement-holdout-qualification.md`, recording the one-time
  unseal and its post-fix regression.

### Changed

- Unsealed the replacement holdout once. **The first look is the verdict:
  14/24 exact priority, three P1 false negatives, four severe
  under-prioritisations, one abstention — a safety-gate failure.** Twenty-two
  mismatches were adjudicated as engine defects and fixed; one is a deferred
  urgency-floor policy question.
- Safety fixes: chemical hazards are inside the support boundary, "can still
  send" is access-not-revoked, erased/destroyed loss with no recovery path is
  unrecoverable, "neither … nor … available" is no workaround, and "in ninety
  minutes" / "in two hours" are same-day deadlines.
- Evidence and facet fixes: regulator statutory driver, export/feed failure
  impairment, individual receptionist scope, "no substitute", partial
  "works for six, the remaining two have none", manual daily cost, paused-feed
  continuity, "N days from now" bucketing, bare-participle deletion as active
  harm, explicit "a preference" and "fine to leave it until later",
  "no account change" is not missing data, pending "awaiting review / has never
  run", learning-support privacy context, and a soft-continuation signal.

### Verified

- 1068 behavioural assertions pass; the checked-in corpus reads 78/79 exact
  priority with all safety metrics zero; the locked validator is unchanged at 13
  divergences (B=0, C=7, D=4) with zero safety blockers.
- Replacement holdout post-fix regression: 24/24 exact priority, impact 24/24,
  P1 precision and recall 6/6, zero unsafe under-prioritisation, zero
  abstentions. The consumed final holdout recheck remains 23/24 with zero safety
  blockers.

## [0.11.0] - 2026-09-20 — Capability-Boundary Burn-Down, Generalisation, and Holdout Unseal

### Added

- Added `docs/260919-safety-boundary-adjudication.md`, which resolves four
  disputed evaluation cases against the written policy before safety metrics
  become release-blocking.
- Added a safety release gate to `node tests/evaluate.mjs`: any unsafe
  under-prioritisation, severe under-prioritisation, P1 false negative, or
  assessed-ticket abstention now fails the gate, with evaluator self-tests for
  the blocker list.
- Added `tests/generalisation-tests.js`, a Phase 4 suite of unseen-paraphrase,
  invariant, and adversarial assertions: every accuracy fix in this release is
  re-tested with wording that is not in any locked fixture, alongside urgency
  monotonicity, comparator/history scope, clause-local negation, screaming
  without consequence, resolved-then-live wording, UAT test cases, pasted logs,
  and quoted history.

### Changed

- Corrected two evaluation labels under the written payroll and safeguarding
  rules: a same-day payment processing failure is P1, and potential harm without
  active access is P2. Added an erratum to the v0.8.0 calibration report.

### Fixed

- A payroll/payment file reported as "not produced" is now missing-data
  evidence, so a same-day processing failure escalates through the existing
  `financial.confirmed` policy instead of stopping at P2.
- Politeness hedges such as "if possible" and "if you can" no longer mark a
  stated population as hypothetical, so an explicit "all schools" scope survives
  into I1; real conditionals such as "if the change is approved" remain
  hypothetical.
- U8 harm timing now reads absence from a *current* process ("absent from the
  current pay run") as active harm, while historical and future clauses stay
  filtered by the clause temporal classifier. This resolves locked capability
  boundary `release-21-casual-pay-missing`; the case was removed from the
  ledger so a regression becomes an unadjudicated divergence and blocks again.
- A record-skipping import or job now feeds three dimensions from one shared
  pattern: data-integrity risk (I3), bounded containment when the skip is
  limited to one named group (I4), and active harm for records missing now
  (U8). A register close is an operational deadline driver (U6). This resolves
  locked capability boundary `release-35-small-group-absence-import`; a skipped
  process *step* is not a record-skip, and a spreading skip is not contained.
- An accessibility barrier where a keyboard user cannot land on a form control
  is now an action-blocked symptom (I3 unavailable) and an impaired process
  (I2); a non-equivalent assisted path is a partial workaround (U7); and an
  impaired process with only a partial path is active harm (U8). The ticket
  routes to the Accessibility domain. This resolves locked capability boundary
  `release-07-keyboard-accommodation`; a working form is not a barrier.
- A disappeared data batch is now data-loss (I3), an impaired process (I2), and
  active harm (U8); an explicit loss with a usable recovery path is a full
  workaround (U7). The written `loss.recoverable` policy is now implemented: a
  recovery path caps Impact at Medium but does not stop the clock, so a near
  restoration need that is not marked soft keeps High Urgency, while an
  unstated loss event does not raise restoration urgency. This resolves locked
  capability boundary `release-23-enrolment-restore-lock`.
- A weekly cadence that drops the same records is now an I4 recurrence without
  extra cumulative weight (Impact now uses the strongest recurrence evidence),
  and dropped records raise the data-integrity risk (I3). A repair-before-classes
  routine is an operational driver (U6) and a full workaround (U7), while the
  next scheduled run stays a schedule rather than a required-by (U5 none). This
  resolves locked capability boundary `release-25-timetable-repeating-campus`.
- Counted offices are now a team-scale population (I1); a refusal to lodge
  attendance adjustments is a blocked process (I2) and an action-blocked symptom
  (I3 unavailable); "rejects every attempt" leaves no workaround (U7), so the
  blocked process is active harm (U8). A state-adverb "now" before a modal is no
  longer an immediate deadline (U5 today), and the blocked-action symptom is no
  longer double-counted with the blocked process in Impact. This resolves locked
  capability boundary `release-32-retired-phone-workaround`.
- Students using the affected room, lab or space are now a cohort-scale
  population (I1); a dry or failed eyewash or safety control blocks safe use of
  that space (I2), and "no replacement unit on site" leaves no workaround (U7),
  so the blocked safety process is active harm (U8). This resolves locked
  capability boundary `release-17-lab-eyewash-control`.
- Manual effort measured in hours, in a manual-work context, is now a
  workaround cost (U7). A failing finance process with costly manual work before
  a committed operational close is High urgency and active harm, because the
  work is already under way, while Impact stays Medium. An impaired process now
  counts as an active failure for the costly-workaround floor. This resolves
  locked capability boundary `release-10-invoice-entry-cost`.
- A board or display still showing yesterday's values is now stale-display
  evidence: an impaired process (I2) and a data-integrity risk (I3
  incorrect-data), with a current board no longer classified as historical. A
  live accurate page or coordinator-posted current times is a full workaround
  (U7). This closes the remaining engine gaps in locked case
  `release-11-stale-bus-arrivals`; its residual I1 divergence is re-adjudicated
  as a reviewed scope-band label defect (twelve pupils is `team` per the
  counting band and three checked-in fixtures, while the frozen label says
  `few-users`).
- Deadline parsing now treats a state "works now" as a current condition rather
  than an immediate deadline, and reads "in eight/ten days" as a one-to-two-week
  deadline. A replaced certificate with a future requirement is pending harm
  rather than active harm, and an unusable storage snapshot leaves no
  workaround. The unique extent question now also covers active exposure and
  explicit loss at cohort scale. This resolves locked D case
  `release-28-certificate-grant-window` and adds tested clarification paths for
  `release-14`, `release-15`, `release-24`, and `release-36`.
- Phase 3 composition pass resolves locked C cases `release-09`, `release-26`,
  and `release-27`: "covers X but cannot do Y" is a partial workaround; a
  consequence word inside a system name is no longer an imminent-consequence
  escalation; "still being copied" is active propagation with Medium-bounded
  urgency; a bad mapping is a data-integrity risk; an empty view is unavailable
  and impaired; "everyone else is unaffected" is comparator containment; a
  complete CSV extract is a workaround; and the continuity deadline demotion no
  longer applies to outage-grade symptoms. Also adds `would like` as a
  preference driver, a failing analytics job as impaired, "can use the CSV
  extract" as a workaround, and a comparator guard for forward negation. The
  seven remaining C cases are documented policy/label boundaries with
  clarification coverage tested.
- Phase 4 generalisation fixes from the new suite: an omitted sync batch is an
  impaired process, "can be rebuilt from a backup" is a recovery path,
  "displaying last week's" is a stale display, written-number manual durations
  are costs, and "stopped again" reopens a resolved incident.
- Unsealed the frozen 24-case final holdout once and recorded the honest
  first-look verdict: 11/24 exact priority, two P1 false negatives and one
  severe under-prioritisation, failing the safety gate. Fourteen mismatches were
  adjudicated as engine defects and fixed (active disclosure to another
  household, access-not-revoked wording, printed-copy and shortcut workarounds,
  resolved-since and scheduled-renewal context, pending privacy drafts,
  data-integrity wording, negated service failures, paused-job continuity, and
  an unrecoverable-loss urgency floor); one remains a deferred policy
  question. The post-fix regression reads 23/24 with P1 precision and recall
  4/4 and zero safety blockers. The consumed fixture keeps its first-look
  metadata and checksum; a replacement holdout is required before the next
  release measurement. See
  [the holdout qualification](docs/260920-final-holdout-qualification.md).

### Verified

- 1060 behavioural assertions pass, and the checked-in corpus reads 78/79 exact
  priority with zero unsafe under-prioritisation, zero severe
  under-prioritisation, zero P1 false negatives, and zero assessed-ticket
  abstentions.
- The locked v0.8.0 validator reports 13 exact semantic divergences: 11
  capability boundaries (B=0, C=7, D=4), one acceptable ambiguity, and one
  reviewed scope-band label defect, with zero unadjudicated divergences and zero
  safety blockers.
- The consumed final holdout records an 11/24 first look and a 23/24 post-fix
  regression; the first look remains the out-of-sample verdict.

## [0.10.0] - 2026-09-07 — Triage Handoff MVP

### Added

- Added a deterministic, local-only Triage Handoff projection with plain-text and
  Markdown output for internal/onward-facing comments, messages, email, and docs.
- Added Known, Unknown, and Ask sections sourced only from existing result fields,
  including the existing Safe Next Action and ranked follow-up questions.
- Added a dedicated result panel with Copy handoff, Copy Markdown, and Download `.md`.

### Changed

- Kept Suggested Reply requester-facing with Copy reply only; internal Markdown
  controls now live in the Triage Handoff panel.

### Unchanged

- Evidence extraction, Eight Questions, Impact, Urgency, policy calibration, the
  priority matrix, P1–P4, and Safe Next Action make no new decisions for this release.
- No dependencies, backend, API, integration, persistence, telemetry, or AI/LLM
  summarization were added.

## [0.9.1] - 2026-09-06 — Eight-Question Model Consistency

### Clarified

- Standardized the analyst-facing model as exactly eight Decision Questions: I1–I4
  and U5–U8, with multiple internal evidence signals allowed to support each one.
- Removed fixed-count internal-signal wording and distinguished decision evidence from
  context/provenance gates and policy metadata.
- Placed explicit recoverability under I3, alongside wrong/exposed/lost/unsafe
  consequence evidence; no ninth question was added.
- Updated the I3 result and reply wording so known recoverability is visible without
  changing scoring semantics.

### Unchanged

- The v0.8/v0.9 evidence extraction, Impact, Urgency, policy, 3×3 matrix, P1–P4,
  Safe Next Action, dependencies, backend, and deployment model remain unchanged.

## [0.9.0] - 2026-09-06 — Safe Next Action

### Added

- Added a deterministic, local-only Safe Next Action layer with exactly six
  advisory actions: Clarify, Verify, Investigate, Contain, Escalate, and Plan.
- Added structured provenance, stable rule IDs, uncertainty blockers, and
  clarification questions; inferred-only evidence cannot trigger Contain or
  Escalate.
- Added a separate result card and direct/adversarial Node/browser tests.

### Unchanged

- The v0.8 evidence, Impact, Urgency, policy, priority matrix, and P1–P4 path
  remain unchanged. No dependency, backend, network call, AI, telemetry,
  persistence, framework, or build system was added.

## [0.8.0] - 2026-08-30 — Triage Policy Calibration

### Added

- Added the normative, machine-readable triage policy layer between structured
  evidence and the unchanged Impact × Urgency matrix.
- Added explicit recoverability evidence and direct policy, monotonicity,
  invariance, policy-ID, and recoverability tests.
- Added the policy, ADR, per-case audit, and release report documentation.

### Changed

- Separated consequence from time sensitivity for workaround, deadline, harm,
  privacy/security, payroll/financial, recoverability, containment/propagation,
  critical-system, safety, safeguarding, compliance, and accessibility cases.
- Passive topic vocabulary no longer creates standalone Impact escalation;
  confirmed consequences and active harm remain evidence-dependent.
- Propagation-only cases now receive High Impact with a Medium urgency floor;
  same-day confirmed processing failures and active exposures retain P1 behavior.
- Updated the labelled corpus to reflect the written v0.8.0 policy, leaving the
  seven acceptable ambiguity boundaries explicitly reviewed.

### Verification

- 828 behavioral assertions pass; catalogue reconciliation remains 206/206.
- Complete 81-case evaluator: 75/79 exact Priority, 75/79 Impact, 74/79
  Urgency, zero unreviewed mismatches, zero severe under-prioritisation.

### Evidence-reliability qualification

- Added a bounded Category-A evidence pass for historical explanatory requests,
  explicit population versus organisational actors, and observation/event versus
  required-by timing; no policy, scoring, matrix, or fixture changed.
- The frozen 36-case release validator now reports raw exact divergences apart
  from adjudicated capability boundaries: 25 exact differences, 24 documented
  boundaries, one reviewed ambiguity, and zero unadjudicated or safety-blocking
  cases.
- Documented the deterministic evidence boundary and a v0.9 clarification-first
  Next Action direction that never changes P1–P4.

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
