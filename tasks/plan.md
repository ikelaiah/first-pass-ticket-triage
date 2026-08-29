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
