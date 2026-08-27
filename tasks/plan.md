# Implementation Plan: Application-support triage accuracy

## Overview

Calibrate the existing deterministic engine without changing its priority matrix.
First protect the input boundary, then expand common support-language coverage, and
finally document the external comparison and remaining limitations.

## Architecture decisions

- Keep the existing evidence -> impact/urgency -> matrix pipeline.
- Define relevance from support evidence, excluding scope, deadlines, and claimed
  urgency because those words can appear in unrelated or manipulative text.
- Treat unrecognised text as unassessed and force its matrix inputs to Low/Low, while
  retaining P4 for compatibility with the current result model.
- Extend phrase data for wording variants; change engine code only for relevance,
  confidence, and explanation behavior.

## Task list

### Phase 1: Input boundary

- [x] Add adversarial and out-of-scope regression tests.
- [x] Add explicit relevance assessment and low-confidence unassessed handling.

### Checkpoint: Input boundary

- [x] Exact nuisance cases stay P4 and are visibly unassessed.
- [x] Existing generic-but-valid incident behavior is preserved.

### Phase 2: Support-language coverage

- [x] Recognise how-to uncertainty, Mac endpoints, application crashes, installation
  requests, claimed priorities, and sustainable alternative-device workarounds.
- [x] Add source-calibrated application-support scenarios.

### Checkpoint: Coverage

- [x] Focus cases and full suite pass.
- [x] No P1-P4 values are introduced outside the matrix.

### Phase 3: Documentation and review

- [x] Record external calibration in `PRIORITY-FRAMEWORK.md`.
- [x] Review correctness, readability, architecture, security, and performance.
- [x] Run syntax, whitespace, full-suite, and privacy checks.

## Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Relevance gate rejects terse real incidents | High | A recognised symptom alone remains support evidence |
| New phrases create false positives | Medium | Add nearby negative/counterexample tests |
| External frameworks use different P scales | Medium | Calibrate concepts, not copy their numeric matrix |
| Presentation behavior becomes hard to explain | Medium | Keep evidence and modifier reasoning explicit |

## Open questions

- None blocking; the existing four-level organisational matrix remains authoritative.
