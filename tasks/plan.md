# Implementation Plan: v0.5.0 reliability, privacy, and safety pass

## Overview

Deliver a focused release pass while preserving the local-first deterministic
pipeline: ticket text → evidence → Impact + Urgency → authoritative matrix →
suggested priority and explainable follow-up information.

## Architecture decisions

- New share links use the URL fragment (`#t=`), which is not sent in HTTP
  requests. Legacy `?t=` links remain readable and are removed from the address
  bar after a valid read.
- Expected scheduled behaviour requires a same-clause creation/update event
  explicitly associated with a clock time. Unrelated times and explicitly past
  dates remain assessable instead of being de-escalated.
- `priority` remains the raw matrix result for compatibility; ordinary tests and
  user-facing recommendation paths use `assessmentStatus` plus `suggestedPriority`.
- The priority matrix validates its controlled inputs and throws on programmer
  errors instead of silently selecting P4.
- Queue state remains a future, separate concern from priority. No ageing,
  reminders, SLAs, or workflow state machine are added in this release.
- Existing organisation-specific configuration remains replaceable and public;
  the release documents that boundary rather than hiding working settings.

## Task list

### Phase 1: Red tests and high-risk contracts

- [x] Add share fragment, legacy-link, storage-boundary, matrix-validation, and
  user-facing priority-helper regressions.
- [x] Add adversarial scheduled-time and current-decision-context regressions.
- [x] Add evaluator metric expectations for any/severe under-prioritisation and
  P1 misses/false positives.

### Phase 2: Minimal implementation slices

- [x] Move new sharing to `#t=`, preserve the cap/base64url format, and clean
  legacy query parameters.
- [x] Make scheduled-behaviour detection conservative around clause, event, and
  date semantics.
- [x] Make `priorityFor()` fail loudly for invalid levels and update normal test
  assertions to require an assessed suggested priority.
- [x] Extend evaluator reporting without printing ticket text.

### Phase 3: User-facing and release documentation

- [x] Clarify heuristic evidence-completeness wording in the result, reply, and
  status announcement.
- [x] Update README, PRIVACY, PRIORITY-FRAMEWORK, CHANGELOG, version metadata,
  configuration notes, and add the minimal GitHub Actions test workflow.
- [x] Add the future queue-separation design note and keep no queue workflow
  behaviour in the application.

### Checkpoint: release candidate

- [x] `npm test` passes.
- [x] Changed modules pass syntax checks and the privacy scan finds no new network
  or remote-asset behavior.
- [x] Static-site wiring and share-link behavior are manually reviewed.
- [x] The diff is reviewed for matrix, privacy, accessibility, and architecture
  regressions.

## Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| A broad time regex de-escalates a genuine incident | High | Require same-clause event grammar and reject explicit past-date markers. |
| Raw P-values are mistaken for actionable recommendations | High | Centralize normal test helper semantics and preserve explicit unassessed fields. |
| Share text remains in a legacy query string | High | Prefer fragments and remove `?t=` after legacy reads. |
| Privacy documentation drifts from storage behavior | High | Test the share module with storage access traps and update both documents together. |
| Organisation settings are hidden or broken | Medium | Keep the working config, mark it as public/replaceable, and defer a split. |

## Deferred by design

- No queue workflow engine, ticket ageing, reminders, SLA state, or `nextAction`.
- No AI/LLM, server, telemetry, external dependency, build step, or ticket store.

## v0.5.1 patch plan: differential scope safety

### Context

The differential detector is useful for diagnosis, but its current wording and
urgency interaction treat one working comparator as evidence against a broad fault.
This patch keeps diagnosis separate from explicit scope: a differential may suggest
record-specific investigation, but it cannot erase stated breadth.

### Ordered tasks

1. **Add red regressions** for small comparators, broad partial failures, explicit
   all-school scope, large majorities failing, and broad partial success. Assert the
   diagnostic question, retained scope, retained broad-failure contribution, and
   absence of the old unconditional wording.
2. **Update differential evidence** with deterministic comparator patterns and a
   scope-aware explanation: conditional/record-specific for narrow or unknown scope;
   conditional-but-broad for explicit multiple-school/all-school scope.
3. **Fix urgency interaction** so the broad-failure contribution depends on explicit
   broad scope plus failure severity, not on the absence of a differential.
4. **Update only release metadata/docs required for v0.5.1**, then run the complete
   test, syntax, privacy, and diff review gates.

### Acceptance criteria

- [x] Explicit broad scope remains broad when a comparator succeeds.
- [x] Small two-record comparators remain diagnostic and do not invent broad scope.
- [x] Broad failures retain the existing breadth urgency contribution.
- [x] No reasoning says “system-wide failure is unlikely” for broad-scope cases.
- [x] The matrix, local-first boundary, and no-queue architecture remain unchanged.

### Verification checkpoint

- [x] `npm test` passes with all new adversarial cases.
- [x] No new dependencies, network APIs, remote assets, storage, build steps, or
  persistence are introduced.

## v0.6.0 complete Pre-K–12 platform catalogue

### Overview

Expand platform recognition from the organisation-specific system list to the
authoritative sections 1–22 of the checked-in Pre-K–12 catalogue. Generic
platform identity, source categories, safe aliases and entity types will live
in a dedicated catalogue module; organisation-specific criticality, schedules,
source-of-truth relationships and status consequences will remain in
`js/config.js`. The result model will expose category context without feeding
category membership into impact, urgency or the priority matrix.

### Architecture decisions

- Keep `js/config.js` as the organisation profile and add
  `js/data/platform-catalogue.js` for generic catalogue entities.
- Use one canonical entity for repeated products and explicit module/family
  mappings for branded variants; retain every source row and category in the
  reconciliation mapping.
- Use guarded aliases or catalogue-only entries for ambiguous names such as
  Clever, Compass, Formative, Flat, Oliver, Scratch, Teams, Classroom, Forms,
  Moodle, Canva and similar ordinary words.
- Reconcile the Markdown source in a Node test that reports source assignments,
  unique source names, canonical coverage, missing entities and missing
  category memberships.
- Keep technical domains and business categories as separate result fields.

### Task list

#### Phase 1: Source inventory and red tests

- [x] Parse sections 1–22 programmatically and record the 206 source category
  assignments and 184 unique source names.
- [x] Add failing catalogue reconciliation, representative recognition,
  ambiguous-name, multi-category and category-neutral-priority tests.
- [x] Add the supplied Markdown under `docs/` without rewriting it.

#### Phase 2: Catalogue foundation

- [x] Add the generic catalogue data with stable IDs, canonical names, safe
  aliases, entity types, source categories and source-name mappings.
- [x] Merge generic entries into system detection without changing existing
  organisation IDs, critical flags, scheduled jobs or data-flow lookups.
- [x] Expose categories and entity types on detected system details and the
  result model; render concise category context in the classification panel.

#### Phase 3: Coverage and safety

- [x] Make every source assignment reconcile to a canonical entity and category.
- [x] Verify representative detection across all 22 source categories,
  historical names explicitly supplied by the source, and product modules.
- [x] Verify ordinary ambiguous wording does not create false platform hits and
  category membership contributes zero to impact, urgency and P1–P4.
- [x] Verify existing organisation-specific flows, schedules and critical flags
  remain intact.

#### Phase 4: Documentation and release

- [x] Document the catalogue architecture, safe alias policy, category/domain
  separation and reconciliation test in README/architecture documentation.
- [x] Bump package/changelog from 0.5.1 to 0.6.0.
- [x] Run the full suite, syntax/privacy/static checks, and code review.
- [x] Commit, push, merge through the existing PR workflow, tag `v0.6.0`, and
  publish the GitHub release only after all reconciliation and CI gates pass.

### Acceptance criteria

- [x] Source category assignments: 206; unique source names: 184.
- [x] Missing canonical entities: 0; missing category assignments: 0.
- [x] All existing tests pass with no unjustified priority expectation changes.
- [x] Platform categories appear as context only and have no scoring weight.
- [x] No new dependencies, network calls, backend, build framework, or invented
  organisation data flows are introduced.

### Verification

- [x] `npm test`
- [x] JavaScript syntax checks and `git diff --check`
- [x] Automated Markdown-to-catalogue reconciliation report
- [x] Existing scheduled-job, source-of-truth and critical-flag tests
- [x] GitHub Actions green on the release PR

### Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| 206 rows are manually transcribed incorrectly | High | Parse the checked-in Markdown in a failing automated reconciliation test. |
| Short product names create ordinary-language false positives | High | Use exact branded phrases, contextual regexes and negative tests. |
| Generic metadata changes organisation behaviour | High | Preserve config IDs/flags and keep catalogue categories out of scoring. |
| Family/module normalisation hides a source row | Medium | Store every source name and category mapping and report normalisations. |

## v0.6.1 catalogue-correctness patch

### Overview

Correct the Markdown-to-catalogue field mapping and strengthen reconciliation so
every source-provided metadata field is verified. Merge the duplicate BrainPOP
catalogue family, remove generic ReadSpeaker aliases, and add literal-alias
integrity checks without changing triage scoring or organisation configuration.

### Architecture decisions

- Derive source-record fields from each Markdown table's headers. A missing
  Typical Level/Environment/Role column is represented as `null`, while the URL
  remains the source URL.
- Keep source records category-specific and preserve every source row even when
  several rows map to one canonical family.
- Treat literal catalogue aliases case-insensitively with collapsed whitespace;
  each literal alias must belong to one canonical ID. Regex/contextual aliases
  are outside this deterministic ownership check.
- Keep generic categories as context only. Do not change impact, urgency, the
  priority matrix, organisation criticality, schedules, or data flows.

### Ordered tasks

#### Phase 1: Red tests and source audit

- [x] Add three-/four-column parser regressions and metadata-fidelity assertions.
- [x] Add BrainPOP family, alias-integrity, and ReadSpeaker regressions.
- [x] Confirm the untouched v0.6.0 baseline and record affected source rows.

#### Phase 2: Minimal catalogue fixes

- [x] Make the reconciliation parser header-driven and report metadata matches,
  table shapes, and duplicate literal aliases.
- [x] Correct all 47 malformed source records and their affected catalogue-level
  metadata; merge BrainPOP source rows into one canonical entity.
- [x] Remove only the generic `screen reader`/`reader` ReadSpeaker aliases and
  review the listed ambiguous bare aliases for necessary guards.

#### Phase 3: Documentation and release verification

- [x] Update README, ADR-003 if needed, CHANGELOG, package version, and release
  task tracking with the narrow v0.6.1 invariant.
- [x] Run `npm test`, syntax/privacy/static checks, metadata URL checks, and a
  final five-axis code review.
- [x] Confirm priority expectations, organisation configuration, and dependency
  boundaries are unchanged before release operations.

### Checkpoints

- **After Phase 1:** new regressions fail for the current parser/catalogue.
- **After Phase 2:** catalogue reconciliation is 206/206 with zero metadata
  mismatches and duplicate literal aliases; the full suite remains green.
- **Release candidate:** version is 0.6.1, diff is narrowly scoped, all checks
  pass, and the existing PR/tag workflow is available.

### Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| A three-column URL is retained as a level/environment | High | Header-driven parser plus a catalogue-wide URL-in-level assertion. |
| Merging BrainPOP changes detection identity | High | Keep both source rows/categories and assert one ID for BrainPOP and BrainPOP Jr. |
| Generic accessibility wording identifies a product | Medium | Remove only unbranded ReadSpeaker aliases and add positive/negative tests. |
| Catalogue metadata changes triage | High | Keep category fields out of scoring and compare before/after priority expectations. |

## v0.7.0 systematic eight-facet NLP robustness

### Overview

Add a maintainable, dependency-free semantic corpus for I1–I4 and U5–U8,
independently authored from production phrase dictionaries. The corpus will use
positive paraphrase families, negative/contrast families, deterministic
metamorphic checks, facet-orthogonality checks, realistic compositions, and a
larger labelled evaluation set. Detector changes are made only where the red
corpus demonstrates a concrete false negative, with regression checks for
nearby false positives. Impact/Urgency scoring and the authoritative matrix
remain unchanged.

Baseline recorded before the v0.7.0 corpus and detector edits: the v0.6.1 tag
(`875fa9b`) passed 532 behavioural assertions; catalogue reconciliation remained
206/206 source assignments with no missing entities, category assignments, or
metadata mismatches. The initial red semantic run was retained as the detector
gap list rather than changing expectations to fit the implementation.

### Architecture decisions

- Keep fixture data as plain ES modules so Node and `tests/tests.html` consume the
  same readable cases without a Node-only format.
- Keep the fixture wording independently authored; production dictionaries may
  define the semantic states under test but never generate fixture sentences.
- Put stable assertion adapters in `tests/facet-test-helpers.js`; assert machine
  fields and flags rather than explanation prose.
- Add a small corpus reporter used by the Node runner and browser page. Its
  counts measure semantic breadth by facet and tag, not an arbitrary test-count
  target.
- Extend the offline evaluator with I3, I4, and U8 labels while preserving the
  legacy scope/consequence/deadline/driver/workaround/containment fields and
  report denominators for every metric.
- Preserve current priority scoring, platform/category neutrality, privacy
  scanning, catalogue reconciliation, and current-decision-context behavior.

### Ordered tasks

#### Phase 1: Baseline and red corpus

- [x] Add eight declarative fixture modules with 20–40 meaningful cases per
  facet, positive/negative tags, coverage metadata, and independently authored
  wording.
- [x] Add facet helpers, corpus coverage invariants, metamorphic and
  orthogonality tests, contradiction/history cases, and compositional tickets.
- [x] Wire the semantic corpus into both Node and browser runners and record
  the v0.6.1 pass/fail baseline before production detector edits.
- [x] Expand the independent evaluation corpus to approximately 40–80 labelled
  realistic tickets and extend metric reporting to all eight facets.

#### Checkpoint: red corpus

- [x] New semantic cases fail only where v0.6.1 lacks the requested recognition;
  fixture expectations are not changed to match implementation.
- [x] Existing 532-test regression suite and catalogue gate remain green.

#### Phase 2: Minimal detector slices

- [x] Fix the smallest demonstrated detector gaps, one semantic family at a
  time, beginning with normalisation/context/negation-sensitive cases.
- [x] For every detector fix, keep positive paraphrases and add nearby negative,
  historical, hypothetical, workaround, or comparator guards as applicable.
- [x] Run the focused family, full regression suite, priority-drift comparison,
  privacy scan, and syntax checks after each slice.

#### Phase 3: Reporting and documentation

- [x] Print compact per-facet case/tag counts and supported-state coverage from
  Node and show the same report on the browser test page.
- [x] Update README with semantic-family, contrast, metamorphic,
  orthogonality, composition, evaluation, and contributor guidance.
- [x] Bump package/changelog from 0.6.1 to 0.7.0 and document added/improved/
  unchanged behavior. Add an ADR only if the final test architecture needs a
  durable design record.

#### Phase 4: Release candidate gate

- [x] All pre-v0.7.0 tests, semantic cases, evaluator checks, catalogue
  reconciliation, matrix checks, and privacy scan pass.
- [x] Browser test runner loads with no page console errors or runtime exceptions
  and Node runner remains green. The configured browser automation surface was
  unavailable, so the gate was verified with isolated local headless Chrome/CDP.
- [x] Review every priority change against the v0.6.1 baseline and explain it
  as newly recognised explicit evidence; unexplained drift blocks release.
- [x] Review the final diff for dependency, network, backend, persistence,
  framework, scoring, category-neutrality, and feature-creep regressions.

### Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Fixtures mirror production phrases and make tests circular | High | Independently author all sentence text; add a review check against dictionary exports. |
| Broad wording changes create false business consequences | High | Pair every positive family with contrast/negation/history guards and keep unknown conservative. |
| New extraction changes priority unexpectedly | High | Capture baseline outputs and diff facet/Impact/Urgency/Priority for every changed case. |
| Browser and Node suites diverge | Medium | Import the same ES-module fixtures/helpers in both runners and verify the browser page. |
| Coverage numbers reward trivial variations | Medium | Report positive/negative/other tags and supported-state invariants; do not gate on a global count. |

### Deferred by design

- No LLM, embeddings, probabilistic classifier, network call, backend,
  telemetry, dependency, build framework, persistence, or scoring redesign.
- No unrestricted English parser; the target remains deterministic support-ticket
  English and human-reviewed evidence.

## v0.7.0 remediation pass: evidence and evaluation correctness

### Overview

Continue v0.7.0 without release operations. Fix only confirmed evidence/context
defects, correct objectively inconsistent expected priorities, reword the four
duplicated semantic cases, and make the evaluator explain every remaining
mismatch. Leave documented scoring-policy disagreements unchanged.

### Architecture decisions

- Extend the existing risk-modifier and decision-context phrase families rather
  than adding new scoring rules or parallel classifiers.
- Treat explicit negated, resolved, historical, and pending wording as context
  that gates active evidence; retain topical domain/risk recognition where it is
  still useful.
- Make the expected-priority matrix invariant a corpus validation error so
  invalid ground truth cannot silently affect accuracy metrics.
- Keep mismatch classifications explicit and conservative: engine defect,
  ground-truth defect, acceptable ambiguity, or policy disagreement deferred.
- Preserve the v0.6.1 comparison path, scoring weights, thresholds, matrix, and
  release gate. No release branch or publication is allowed while a known
  engine defect or unexplained regression remains.

### Ordered tasks

#### Phase 1: Reproduce and guard confirmed defects

- [x] Add failing positive/contrast regressions for active unauthorised access,
  resolved access, pending/hypothetical exposure, and negated current exposure.
- [x] Add failing payroll topic-versus-harm contrast regressions.
- [x] Add a failing read-only-report regression and identify the exact false
  `missing-data` phrase match.
- [x] Fix the smallest existing phrase/context/modifier families and run the
  focused regressions plus the full legacy suite.

#### Phase 2: Ground truth and test independence

- [x] Add the expected-priority matrix invariant to corpus validation.
- [x] Correct objectively inconsistent priorities, including
  `multi-school-attendance-block` and `lost-assessment-submissions`.
- [x] Reword `i2-attendance-history`, `u5-now-need`, `u5-today-payroll`, and
  `u5-weeks-until` without changing their semantic expectations.
- [x] Re-run the independence and orthogonality checks.

#### Phase 3: Evaluator reporting

- [x] Report assessed/unassessed counts and denominators for impact, urgency,
  and priority alongside every percentage.
- [x] Report mismatch counts by the four required classifications.
- [x] Report acceptable alternative priorities only where explicitly reviewed;
  do not infer alternatives from implementation output.
- [x] Mark each remaining mismatch as engine defect, ground-truth defect,
  acceptable ambiguity, or policy disagreement deferred.

#### Checkpoint: remediation verification

- [x] Full semantic corpus passes.
- [x] All legacy tests pass.
- [x] Catalogue reconciliation remains 206/206.
- [x] The 57-case evaluator and v0.6.1 → v0.7.0 comparison run cleanly.
- [x] Every remaining P1 false positive/negative and priority mismatch has an
  explicit classification and no unexplained regression remains.

#### Phase 4: Release gate (conditional)

- [x] Browser runtime is verified; GitHub Actions and Pages remain pending.
- [ ] A release branch, commit, PR, merge, tag, and publication are created only
  after the remediation checkpoint is clean and no known engine defect remains.

### Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Negation/context guards hide a genuine active incident | High | Pair every guard with active positive cases and run the full corpus. |
| Correct labels are changed to fit current implementation | High | Validate expected priorities against the authoritative matrix before scoring. |
| Reporting disguises policy disagreements as regressions | Medium | Require one explicit classification for every mismatch and defer policy items. |
| Existing dirty v0.7.0 work is overwritten | High | Preserve unrelated changes and modify only the scoped modules, fixtures, and evaluator. |

## v0.7.1 NLP Evaluation Integrity & Regression Hardening

### Overview

Harden the labelled evaluation corpus as release-gating data, add an
independently authored realistic-ticket pack, protect fixture independence, and
make only the smallest deterministic NLP fixes demonstrated by a pre-fix
baseline. Preserve the v0.7.0 scoring, priority matrix, policy semantics,
catalogue neutrality, and dependency-free Node/browser architecture.

### Architecture decisions

- Keep corpus validation in the existing offline evaluator and make it reject
  duplicate IDs, duplicate normalised ticket text, invalid controlled values,
  matrix-inconsistent labels, malformed alternatives, and unknown review
  classifications.
- Keep quality statistics separate from accuracy metrics, with explicit labelled
  denominators for each facet and review category.
- Store the new realistic tickets as hand-authored fixture data; do not derive
  wording from production phrase dictionaries or mechanically paraphrase old
  cases.
- Use the existing analyser as the v0.7.0 baseline before any production edit;
  classify each new-case mismatch as engine defect, expected-label defect,
  acceptable ambiguity, or existing policy disagreement.
- Treat a detector change as release-worthy only when a failing regression proves
  an evidence/context defect and paired negative or contrast coverage guards the
  neighbouring semantics.

### Ordered tasks

#### Phase 1: Baseline and red contracts

- [x] Confirm clean `main`, package version `0.7.0`, the 775-test baseline,
  catalogue 206/206 reconciliation, and the 57-case evaluation metrics.
- [x] Add failing evaluator tests for duplicate IDs/text, all controlled enums,
  matrix consistency, reviewed alternatives, unknown classifications, and
  missing mismatch classifications.
- [x] Add failing/reporting expectations for corpus-quality denominators and
  reviewed/unreviewed mismatch counts.

#### Phase 2: Corpus and regression coverage

- [x] Add 15–25 independently authored realistic evaluation tickets spanning
  scope/context, I2, I3, I4, U5/U6, U7, and U8 composition challenges.
- [x] Run those new tickets against the untouched v0.7.0 analyser and record
  the required fully-correct/facet-mismatch/Impact/Urgency/Priority counts plus
  a classification for every mismatch.
- [x] Add lightweight checks that semantic fixtures do not import production
  phrase dictionaries and that exact normalised copy/paste duplicates across
  semantic, evaluation, and legacy regression corpora fail clearly.
- [x] Add targeted cross-facet and v0.7.0 major-fix regressions without
  duplicating existing exact wording.

#### Checkpoint: integrity and baseline classification

- [x] Integrity tests fail for each invalid corpus mutation and pass for the
  reviewed corpus.
- [x] The new-ticket baseline is captured before any production detector edit.
- [x] Every mismatch is classified; no policy disagreement is silently changed.

#### Phase 3: Minimal detector fixes

- [x] For each confirmed engine defect, add a semantic positive family and
  negative/history/negation/comparator guard as appropriate.
- [x] Implement only the smallest production evidence-extraction/context fix;
  do not change weights, matrix cells, future-deadline, workaround,
  containment, privacy, financial, safeguarding, criticality, or category rules.
- [x] Re-run focused regressions and compare v0.7.0/v0.7.1 behaviour across the
  complete evaluation corpus, classifying every changed facet/result.

#### Phase 4: Release documentation and final gate

- [x] Extend the Node report with all requested corpus-quality statistics and
  keep browser reporting aligned.
- [x] Update README/CHANGELOG and version metadata to 0.7.1 only after
  meaningful patch improvements are complete; document unchanged policy and
  scoring architecture without overstating accuracy.
- [x] Run full tests, catalogue reconciliation, syntax/privacy checks, browser
  verification, integrity validation, and the behavioural-difference gate.
- [x] Confirm unresolved engine defects and unexplained regressions are zero,
  severe under-prioritisation does not regress, and no dependencies/network/
  backend/telemetry were introduced.

### Verification commands

- `npm test`
- `node tests/evaluate.mjs tests/fixtures/accuracy-corpus.json`
- `node --check` for changed JavaScript modules
- `git diff --check`
- Browser runner `tests/tests.html` with a clean console/runtime
- Catalogue reconciliation output: 206/206, zero metadata mismatches, zero
  duplicate literal aliases

### Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Corpus validation rejects legacy data unexpectedly | High | Add mutation tests first and preserve the checked-in corpus classifications. |
| Realistic tickets encode policy opinions as engine defects | High | Capture v0.7.0 output and classify before production edits; defer policy cases. |
| New wording copies production or old fixtures | Medium | Add exact normalised cross-corpus duplicate checks and review provenance. |
| A context fix changes unrelated facets | High | Record complete facet/Impact/Urgency/Priority diffs and require zero unexplained regressions. |
| Browser and Node reports drift | Medium | Reuse shared fixtures/helpers and run both release gates. |

## v0.8.0 Triage Policy Calibration

### Overview

Make Impact and Urgency a documented, testable policy decision over the
structured evidence already extracted by v0.7.1. Keep the 3x3 matrix as the
only Priority authority, keep semantic extraction separate from policy, and
judge the evaluation corpus against the written policy rather than tuning the
policy to its labels.

### Architecture decisions

- Add `js/engine/policy.js` as a pure policy layer over structured evidence and
  base Impact/Urgency levels. It owns calibration rules, policy rule IDs, and a
  machine-readable decision table; it does not parse ticket text.
- Keep `impact.js`, `urgency.js`, and the existing detectors responsible for
  evidence-weighted base scores. Policy adjustments occur before
  `priorityFor()` and are visible in reasoning.
- Treat passive privacy/security/payroll/financial vocabulary as context. Only
  active exposure, confirmed harm, blocked processing, or a documented
  consequence can produce the corresponding escalation.
- Treat hard statutory/operational deadlines as time-sensitive; soft targets,
  preferences, explicit `can wait` wording, unresolved future questions, and
  historical timestamps do not receive the future-deadline floor.
- Preserve harm already occurred when containment or recoverability is present;
  containment can reduce urgency but does not erase impact. Propagation raises
  impact and urgency to a bounded Medium floor unless independent evidence makes
  High urgency appropriate.
- Use direct policy tests with structured evidence, plus separate end-to-end
  corpus and semantic tests. No new dependency, network call, framework,
  backend, persistence, or LLM is allowed.

### Ordered tasks

#### Phase 1: Baseline and policy audit

- [x] Record the clean v0.7.1 baseline, catalogue reconciliation, complete
  evaluation metrics, and all 18 deferred plus 7 acceptable-ambiguity cases.
- [x] Add `docs/triage-policy.md` with the definitions, policy table, and
  explicit decisions for workaround, deadline, harm timing, privacy/security,
  payroll/finance, recoverability, containment/propagation/recurrence,
  criticality, safeguarding, safety, and compliance.
- [x] Add `docs/260830-triage-policy-calibration-audit.md` with one structured
  audit record per reviewed corpus disagreement and ambiguity boundary.
- [x] Add this plan and the task checklist before production scoring changes.

#### Phase 2: Red policy contracts

- [x] Add direct structured-input policy tests for every documented rule and
  monotonicity/invariance that follows from the policy.
- [x] Add regression tests for explicit `can wait`, hard versus soft future
  deadlines, passive versus pending/active harm, recoverable versus
  unrecoverable loss, payment/payroll consequence gating, and bounded
  propagation urgency.
- [x] Confirm the new tests fail against the v0.7.1 implementation before
  changing scoring/composition code.

#### Checkpoint: policy contract

- [x] Policy prose, machine-readable decisions, and red tests agree.
- [x] Matrix cells and semantic detector expectations remain unchanged at this
  checkpoint.

#### Phase 3: Incremental policy implementation

- [x] Implement the pure policy layer and integrate it into normal analysis and
  hypothetical follow-up simulation.
- [x] Calibrate deadline/workaround composition and the explicit low-urgency
  signal without inventing calendar arithmetic.
- [x] Calibrate passive/active risk, payroll/financial harm, recoverability,
  containment/propagation, accessibility, and critical-system composition.
- [x] Run focused policy tests, existing behavioral tests, syntax checks, and
  the evaluator after each slice; record every changed case.

#### Phase 4: Corpus and release evidence

- [x] Re-evaluate all 18 deferred disagreements and 7 ambiguity cases against
  named policy rules; update only labels that the policy justifies.
- [x] Compare v0.7.1 and v0.8.0 outputs for all 81 cases, including semantic
  facets, and classify every change with zero unexplained behavior.
- [x] Add the release report, update README/PRIORITY-FRAMEWORK/CHANGELOG,
  package version, and relevant ADR documentation.
- [x] Audit every final P1 for independently justified High Impact and High
  Urgency; check inflation/suppression risks.

#### Phase 5: Release gate

- [x] All tests, browser runtime, catalogue, metadata, privacy/static scan,
  policy, semantic, evaluation-integrity, and matrix gates pass.
- [x] Unreviewed mismatches, unresolved engine defects, and unexplained
  behavioral changes are zero; severe under-prioritisation does not regress
  without an explicit policy rationale.
- [x] Confirm matrix unchanged, no dependencies/network/backend/telemetry/LLM,
  and no NLP feature creep.
- [x] Create the local release branch and commit only after the gate; external
  PR/merge/tag/Pages verification requires the repository's normal GitHub
  permissions and must occur after merge.

### Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Policy layer becomes a second hidden priority engine | High | It returns only Impact/Urgency; every P value still comes from `priorityFor()`. |
| Corpus labels drive calibration | High | Complete the audit and red structured policy tests before changing labels or scoring. |
| Workarounds suppress genuine urgency | High | Distinguish full/partial/high-cost/temporary workarounds and preserve floors for broad or costly work. |
| Passive risk vocabulary inflates P1 | High | Gate escalation on active/confirmed consequence evidence and audit every final P1. |
| Future dates are mistaken for hard deadlines | High | Require committed statutory/operational evidence; explicit soft/wait wording overrides the floor. |
| Propagation creates unjustified P1s | High | Preserve scope, raise impact independently, and cap propagation-only urgency at Medium. |
| Recoverability is confused with data loss | Medium | Add explicit recoverability evidence and direct tests for recoverable/unrecoverable states. |
