# v0.8.0 — Triage Policy Calibration Release Report

**Date:** 2026-08-30
**Baseline:** v0.7.1 `main` at `1c8af38bbffbf7e818e75a4ef06298c9ec0c3ba6`
**Scope:** local deterministic triage policy calibration

## Executive summary

v0.8.0 makes Impact and Urgency policy explicit after structured evidence
extraction. The authoritative 3×3 matrix is unchanged. A pure policy layer
calibrates the existing levels, exports stable rule IDs, and leaves the matrix
as the only source of P1–P4 values.

The release removes topic-only escalation for passive privacy, security,
payroll, financial, and critical-platform context. It distinguishes hard
deadlines from preferences and explicit can-wait signals, separates active from
pending harm, models recoverability, preserves consequence under containment,
and bounds propagation-only urgency at Medium. Confirmed same-day processing
failures, active exposure, safety/safeguarding harm, and unrecoverable material
loss retain evidence-based escalation.

## Policy and audit artifacts

- [Normative policy table](triage-policy.md)
- [Per-case calibration audit](260830-triage-policy-calibration-audit.md)
- [ADR-004: Calibrate triage policy after evidence extraction](decisions/004-calibrate-triage-policy-after-evidence-extraction.md)

The audit covers all 18 deferred policy disagreements and all seven acceptable
ambiguities. The 18 deferred cases are resolved by named policy rules. The seven
acceptable ambiguities remain reviewed; none is an engine or ground-truth defect.

## Implementation

- Added `js/engine/policy.js`, a text-free structured policy layer with
  `TRIAGE_POLICY_DECISIONS` and traceable `policyIds`.
- Added `js/engine/recoverability.js` for explicit recoverable/unrecoverable
  evidence with provenance.
- Integrated policy calibration into normal analysis and hypothetical
  follow-up simulations without changing the matrix API.
- Removed standalone Impact contributions from passive privacy/security/payroll/
  financial vocabulary; retained explicit consequence and active-harm rules.
- Added direct structured policy, monotonicity, invariance, and policy-ID tests.
- Updated the accuracy corpus only where the written v0.8.0 policy justified the
  change; preserved the seven reviewed ambiguity boundaries.

No dependency, network call, backend, persistence, telemetry, LLM, or new NLP
architecture was added.

## Complete evaluator delta

| Measure | v0.7.1 | v0.8.0 | Change |
| --- | ---: | ---: | ---: |
| Corpus cases | 81 | 81 | unchanged |
| Assessed / unassessed | 79 / 2 | 79 / 2 | unchanged |
| Exact Priority | 65/79 (82.3%) | 75/79 (94.9%) | +10 cases |
| Impact | 69/79 (87.3%) | 75/79 (94.9%) | +6 cases |
| Urgency | 61/79 (77.2%) | 74/79 (93.7%) | +13 cases |
| P1 precision | 14/18 (77.8%) | 14/15 (93.3%) | +15.5pp |
| P1 recall | 14/17 (82.4%) | 14/16 (87.5%) | +5.1pp |
| Under-prioritisation | 4 | 3 | -1 |
| Severe under-prioritisation | 0 | 0 | unchanged |
| Unreviewed mismatches | 0 | 0 | unchanged |

All eight labelled semantic facets remain 100% accurate. Final corpus review:
seven acceptable ambiguities, zero deferred mismatches, zero engine defects,
zero ground-truth defects, and zero unreviewed mismatches.

## Verification gates

- `npm test` — PASS
- Behavioural/policy suite — 828 passed, 0 failed
- Catalogue — 206/206, no missing entities, metadata mismatches, or duplicate
  literal aliases
- Corpus integrity — 81 unique cases, 0 unreviewed mismatches
- Matrix invariant — every assessed result equals `priorityFor(impact, urgency)`
- Static privacy scan — no fetch, XHR, WebSocket, beacon, or remote asset
  references
- Syntax and browser runtime — PASS: changed JavaScript modules pass `node
  --check`, and Chrome headless renders `tests/tests.html` as `PASS — 828 tests`
  through the documented local Python server. Chrome DevTools MCP is not
  configured in this environment, so page-console diagnostics were unavailable;
  the browser emitted no application failure in the rendered test result.

## Release workflow status

The local implementation was prepared from the clean v0.7.1 `main` baseline and
committed after the final gates passed:

- Branch: `release/v0.8.0-triage-policy-calibration`
- Commit: local commit `Calibrate triage policy after evidence extraction`
- Remote pull request, merge, tag, push, and Pages URL: not created or observed

The remaining remote steps require the repository's normal GitHub permissions
and should occur only after review and merge.
