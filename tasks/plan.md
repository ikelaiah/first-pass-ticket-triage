# Implementation Plan: v0.4.0 priority accuracy

## Overview

Deliver accuracy improvements in risk-first slices: first make analyst-confirmed facets
authoritative, then prevent inactive text from driving an active incident, then add a
repeatable offline evaluation boundary and explicit unassessed state. Finish with release
documentation and a five-axis review.

## Architecture decisions

- Keep the P1-P4 matrix unchanged and improve only its evidence inputs.
- Represent document context as a preprocessing result used by all existing detectors,
  rather than adding inactive-language checks to every phrase dictionary.
- Preserve inactive text in the result for explanation, but exclude it from automatic
  scoring.
- Keep `priority` compatible for assessed tickets; expose `suggestedPriority: null` and
  `assessmentStatus: unassessed` when there is not enough support context.
- Make the evaluation harness generic and dependency-free; do not ship real ticket data.

## Task list

### Phase 1: Decision facets

- [x] Add failing tests for containment, deadline-driver, and harm-timing refinements.
- [x] Feed effective facet values into impact, urgency, modifiers, and simulation.

### Checkpoint: facets

- [x] Focus tests pass and existing refinement behaviour remains green.

### Phase 2: Current incident context

- [x] Add contrast tests for resolved updates, quoted history, hypotheses, design text,
  exercises, and UAT/test scenarios.
- [x] Add a pure context preprocessor and score only active asserted clauses.
- [x] Explain ignored inactive context in the result.

### Checkpoint: context

- [x] New contrasts and the complete regression suite pass.

### Phase 3: Measured accuracy

- [ ] Add explicit assessed/unassessed output semantics.
- [ ] Add corpus schema, evaluator, metrics, and evaluator self-tests.

### Phase 4: Release and review

- [ ] Update README, framework, version metadata, and changelog.
- [ ] Run syntax, tests, privacy scan, source hygiene, and five-axis review.

## Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Context filtering hides a real incident | High | Require strong inactive cues and add active counterexamples |
| A current `resolved` word suppresses an unresolved incident | High | Scope status to clauses and prefer the latest explicit update |
| Manual facets create unconditional escalation | Medium | Gate them to matching risks and preserve matrix policy |
| Compatibility break for existing UI | Medium | Add fields; keep assessed-ticket `priority` unchanged |
| Metrics imply unsupported accuracy | Medium | Ship only schema/example fixtures and document corpus limits |

## Open questions

- None blocking for implementation. Real calibration numbers require a future labelled
  corpus supplied by the organisation.
