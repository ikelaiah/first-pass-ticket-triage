# ADR-004: Calibrate triage policy after evidence extraction

## Status

Accepted

## Date

2026-08-30

## Context

The v0.7.1 analyser extracted useful evidence, but several policy choices were
implicit in weighted scoring and risk modifiers. Topic words such as payroll,
privacy, and critical platform names could contribute before the ticket proved
a consequence. Future dates, workarounds, recoverability, and propagation also
needed explicit boundaries so that similar evidence produced explainable
Impact/Urgency decisions.

## Decision

Add `js/engine/policy.js` as a pure, text-free calibration layer between the
base Impact/Urgency scorers and `priorityFor()`. It consumes structured evidence
with provenance and returns calibrated Impact/Urgency levels, applied rule IDs,
and a floor marker. The 3x3 matrix remains the only authority that produces a
P1–P4 value.

The policy treats consequence and time sensitivity independently. Passive risk
vocabulary is contextual; active exposure, confirmed financial harm, active
safety/safeguarding harm, unrecoverable material loss, and committed deadlines
are evidence-dependent escalators. Workarounds normally reduce Urgency only.
Containment preserves incurred Impact, while active propagation raises Impact
and provides a Medium urgency floor without making propagation alone a P1.

The decision table is exported as `TRIAGE_POLICY_DECISIONS`, and direct tests use
structured evidence rather than phrase text. The policy is local, deterministic,
dependency-free, and does not add a backend, network call, telemetry, LLM, or
new NLP architecture.

## Alternatives considered

### Keep policy implicit in weighted scoring

Rejected because topic weights and special cases were difficult to audit,
re-use in hypothetical simulations, or explain as an organisational decision.

### Let each risk modifier name a priority

Rejected because it would create a second priority engine and bypass the matrix.
Risk evidence may calibrate Impact/Urgency, but only the matrix can name P1–P4.

### Tune directly to corpus labels

Rejected because the corpus contains reviewed ambiguities and deferred policy
disagreements. The written policy and structured red tests precede expectation
changes, and every resulting mismatch is classified.

### Add a remote rules service or machine-learning classifier

Rejected because the application is intentionally local-first and privacy
preserving, and the change does not require a new inference architecture.

## Consequences

- Policy decisions are named, testable, and visible in result details.
- Impact and Urgency can be calibrated without changing matrix cells or making
  semantic detectors responsible for priority.
- Some v0.7.1 P1 propagation expectations are intentionally P2 under the new
  propagation-only boundary and are recorded in the calibration audit.
- Future policy changes must update the normative table, direct policy tests,
  evaluator classifications, and release report together.
