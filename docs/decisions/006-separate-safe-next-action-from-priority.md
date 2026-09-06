# ADR-006: Separate Safe Next Action from priority

## Status

Accepted

## Date

2026-09-06

## Context

v0.8.0 froze broad NLP remediation and retained a deterministic, explainable priority path. Analysts still need a safe immediate next step, but deriving an action from a P-level would conflate consequence/time sensitivity with operational advice and encourage speculative escalation.

## Decision

Add a pure `js/engine/next-action.js` policy that consumes structured evidence after the v0.8 result is calculated. It supports only Clarify, Verify, Investigate, Contain, Escalate, and Plan. Consequential actions require current explicit or analyst-confirmed evidence; inferred evidence can only support an explanation or a Clarify result. The action result is returned beside, never into, the priority result and uses the existing refinement state.

## Alternatives considered

### Derive action from P1–P4

Rejected: tickets with the same priority can need different safe next steps, and this would make the advisory layer an implicit priority modifier.

### Add a broad NLP action taxonomy

Rejected: it violates the v0.8 capability boundary and cannot be safely qualified without compositional understanding the product does not claim.

### Execute or route recommendations

Rejected: First Pass remains local-only decision support, not an incident workflow, integration, or remediation tool.

## Consequences

- Every action has a stable rule/reason ID and explainable evidence.
- Material uncertainty is visible and conservative rather than hidden.
- Priority fixtures, scoring, policy, matrix, and locked validator remain unchanged; release qualification compares them separately.
