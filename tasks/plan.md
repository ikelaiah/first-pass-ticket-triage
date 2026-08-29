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
