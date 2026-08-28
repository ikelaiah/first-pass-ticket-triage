# Implementation Plan: v0.4.1 evidence calibration

## Overview

Deliver a measured, explainable improvement to the evidence model. The release makes
business consequence a first-class fact, lets an analyst confirm it when missing, and
extends the existing offline evaluator so tuning begins from facet-level errors rather
than guesses about English grammar or final priority alone.

See `tasks/v0.4.1-evidence-calibration-spec.md` for the release contract and unresolved
calibration decisions.

## Architecture decisions

- Keep the Impact × Urgency matrix and its policy unchanged; improve only the evidence
  that flows into it.
- Treat business consequence as a fact with a level (`unknown` / `impaired` / `blocked`),
  optional process name, evidence, and provenance—not as another priority keyword.
- Reuse existing system-status inferences, but expose them as `inferred` and never let
  an important system name alone create a consequence.
- Add corpus expectations as optional fields so approved future datasets can be
  incrementally labelled and evaluated without weakening the existing schema.
- Default to conservative scoring: calibration data must justify any changed weight;
  the matrix is not a shortcut around missing business context.

## Dependency graph

```text
Facet schema + evaluator diagnostics
       ↓
Consequence fact contract + contrast tests
       ↓
Scoring, confidence, question simulation
       ↓
Analyst consequence refinement + result presentation
       ↓
Corpus expansion, release documentation, full verification
```

## Task list

### Phase 1: Measure the right facts

## Task 1: Extend the labelled-corpus contract and evaluator

**Description:** Add optional expectations for the facts that drive a priority—scope,
consequence, deadline, driver, workaround, and risk/containment where supported. The
evaluator will validate those fields, calculate only applicable per-facet metrics, and
report a case ID plus expected/actual values rather than ticket text.

**Acceptance criteria:**

- [x] Existing minimal corpus entries remain valid without facet labels.
- [x] Facet metrics show labelled coverage, accuracy, and mismatch counts; invalid
  facet values fail validation with a clear field path.
- [x] Evaluator output remains local and never prints a case's ticket text.

**Verification:**

- [x] Add evaluator self-tests for valid optional labels, invalid labels, partial
  coverage, and privacy-safe mismatch output.
- [x] Run `npm test`.

**Dependencies:** None.

**Files likely touched:**

- `tests/evaluate.mjs`
- `tests/evaluate.test.mjs`
- `tests/fixtures/accuracy-corpus.json`
- `tasks/v0.4.1-evidence-calibration-spec.md`

**Estimated scope:** Medium (3–4 files).

## Task 2: Define and detect business-consequence facts

**Description:** Establish an auditable consequence contract that recognises explicit
process impairment/blocking, preserves configured system-status consequences as
inferences, and rejects generic technical symptoms as insufficient evidence. Start
with a focused set of high-value school operations rather than a broad ontology.

**Acceptance criteria:**

- [x] The result exposes a consequence level, optional process label, evidence, and
  `explicit`/`inferred`/`unknown` provenance.
- [x] “Teachers cannot mark the roll” is explicit blocked attendance work; a system
  name or “Canvas is slow” alone is not a blocked process.
- [x] Existing status-derived consequences stay visible but are marked inferred.

**Verification:**

- [x] Add RED/green contrast tests for each initial process phrase and its nearby
  non-consequence wording.
- [x] Run `node --check` on changed engine modules and `npm test`.

**Dependencies:** Task 1 establishes the evaluation label contract.

**Files likely touched:**

- `js/engine/consequence.js` (new) or a small extracted equivalent
- `js/engine/analyzer.js`
- `js/data/phrases.js`
- `tests/tests.js`

**Estimated scope:** Medium (4 files).

### Checkpoint: fact contract

- [x] Existing corpus remains valid and evaluator reports facet coverage.
- [x] New consequence facts are explainable and nearby counterexamples stay unchanged.
- [ ] `npm test` and source hygiene are green.

### Phase 2: Use consequence conservatively

## Task 3: Connect consequence to scoring, confidence, and follow-up ranking

**Description:** Consume the new fact through documented contributions to impact and
urgency, not direct priority rules. Make missing business consequence a ranked
follow-up when it could change the matrix cell. Simulated answers must use the same
consequence contract as manual refinement will use.

**Acceptance criteria:**

- [x] Explicit `blocked` adds only the approved, documented contributions; no priority
  can rise from a consequence phrase without supporting scope/risk/time evidence.
- [x] `impaired` is either a minimal approved contribution or explanatory only, as
  resolved in the spec's open question; its behaviour is test-covered.
- [x] A consequence question appears ahead of lower-value questions only when a
  hypothetical answer changes priority or increases confidence.

**Verification:**

- [x] Test impact, urgency, final priority, confidence, and ranked questions for
  explicit, inferred, and unknown consequence cases.
- [x] Run `npm test`.

**Dependencies:** Task 2.

**Files likely touched:**

- `js/engine/analyzer.js`
- `js/engine/impact.js`
- `js/engine/urgency.js`
- `js/engine/confidence.js`
- `tests/tests.js`

**Estimated scope:** Large (5 files); split into impact/urgency and question-ranking
subtasks if the first implementation exceeds one focused session.

## Task 4: Add analyst consequence confirmation

**Description:** Add a refinement control for `unknown` / `impaired` / `blocked` that
is dirty-tracked like the existing controls. The confirmation must be passed into the
same analysis path, visibly labelled manual, and reset when a different ticket is
analysed.

**Acceptance criteria:**

- [x] An untouched control creates no override; a changed control recalculates using
  `source: 'manual'` and is reported in the reasoning/printed result.
- [x] Reset and fresh-ticket behaviour clear the manual consequence rather than
  retaining it invisibly.
- [x] Keyboard and label behaviour follow the existing refinement controls.

**Verification:**

- [x] Add focused analysis/UI-control tests for manual consequence result states;
  consequence result states.
- [ ] Manually verify recomputation in the browser with a ticket missing consequence.
- [x] Run `npm test`.

**Dependencies:** Task 3.

**Files likely touched:**

- `index.html`
- `js/ui/refine-controls.js`
- `js/engine/analyzer.js`
- `js/ui/render-result.js`
- `tests/tests.js`

**Estimated scope:** Medium (5 files).

### Checkpoint: end-to-end evidence path

- [x] Explicit, inferred, and manual consequence cases show distinct provenance.
- [x] Final priority remains traceable to impact, urgency, and the unchanged matrix.
- [x] A fresh analysis contains no stale manual evidence.

### Phase 3: Calibrate, document, and release

## Task 5: Add a balanced calibration fixture and regression contrasts

**Description:** Expand the schema example with synthetic, non-production pairs that
exercise scope, consequence, deadline, workaround, and critical risk independently.
This verifies evaluator plumbing and protects against regression; it is explicitly not
used to claim field accuracy.

**Acceptance criteria:**

- [x] Each new pair differs in one decision-relevant fact and declares the expected
  final decision and labelled facets.
- [x] The fixture contains no real names, school identifiers, contact details, or
  copied ticket content.
- [x] The evaluator output identifies facet mismatches useful for future approved data.

**Verification:**

- [x] Run `node tests/evaluate.mjs tests/fixtures/accuracy-corpus.json`.
- [x] Run `npm test`.

**Dependencies:** Tasks 1–4.

**Files likely touched:**

- `tests/fixtures/accuracy-corpus.json`
- `tests/tests.js`
- `tests/evaluate.test.mjs`

**Estimated scope:** Small (3 files).

## Task 6: Publish release documentation and complete the verification gate

**Description:** Update the framework, README, changelog, and version metadata to
describe consequence provenance, facet-level evaluation, the approved-corpus workflow,
and v0.4.1's deliberate limits.

**Acceptance criteria:**

- [x] Documentation describes the new fact and analyst confirmation accurately.
- [x] Documentation distinguishes synthetic schema examples from independently
  labelled production calibration data.
- [x] Version and changelog consistently identify v0.4.1.

**Verification:**

- [ ] Run `npm test`, changed-file syntax checks, and `git -c core.whitespace=cr-at-eol diff --check`.
- [ ] Manually inspect an explicit, inferred, unknown, and manual consequence result.
- [ ] Complete code review before merge.

**Dependencies:** Tasks 1–5.

**Files likely touched:**

- `README.md`
- `PRIORITY-FRAMEWORK.md`
- `CHANGELOG.md`
- `package.json`

**Estimated scope:** Medium (4 files).

### Checkpoint: release candidate

- [ ] Full test suite and privacy scan pass.
- [ ] Corpus evaluator and schema fixture pass locally.
- [ ] Source hygiene passes.
- [ ] Reviewer confirms matrix policy, privacy boundary, and provenance are preserved.

## Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Generic failure language is mistaken for a blocked business process | High | Require process-specific wording or configured status evidence; add close counterexamples. |
| Consequence gets double-counted through symptom and blocked wording | High | List each scoring contribution and assert score/priority contrasts. |
| Synthetic fixtures look like a production accuracy claim | Medium | Mark every fixture as schema-only; publish no percentage as a field result. |
| Manual confirmation leaks into a different ticket | High | Preserve dirty-state/reset tests and reset controls on fresh analysis. |
| New UI control obscures analyst judgement | Medium | Label manual provenance in reasoning and keep direct impact/urgency overrides available. |
| Unapproved corpus contains sensitive school data | High | Keep corpus external/local until an explicit approval and anonymisation procedure exists. |

## Open questions for approval

- Approve the proposed initial consequence levels (`unknown`, `impaired`, `blocked`)
  and the narrow first process vocabulary (attendance, payroll, enrolment, reporting,
  teaching/learning access).
- Decide whether `impaired` should change impact in v0.4.1 or stay explanatory until a
  labelled corpus supports a safe calibration.
