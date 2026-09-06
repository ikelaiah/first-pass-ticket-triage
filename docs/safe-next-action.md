# Safe Next Action

**Release:** v0.9.0 — Safe Next Action
**Status:** normative advisory policy

Safe Next Action answers: “Given what we actually know, what is the safest useful thing for the analyst to do next?” It is deterministic, local-only, explainable, and advisory. It is a separate downstream output from the frozen v0.8 evidence → Impact/Urgency → matrix path. It never changes Impact, Urgency, policy evaluation, the matrix, or P1–P4.

## Actions

Only these six actions exist in v0.9.0:

| Action | Use when |
| --- | --- |
| `Clarify` | A material fact required for safe operational advice is uncertain. This is the conservative fallback. |
| `Verify` | Authoritative/current state should be checked before intervention. |
| `Investigate` | A current failure and affected business operation are established, with no containment or escalation action dominating. |
| `Contain` | Explicit or analyst-confirmed current exposure, ongoing harm, or propagation makes limiting further harm safest. |
| `Escalate` | Explicit or analyst-confirmed current safety, safeguarding, serious security/compliance, or material payroll/payment consequence needs appropriate authority involvement. |
| `Plan` | Established non-immediate work, such as an improvement, feature, documentation, maintenance, usable-current-state enhancement, or explicit can-wait request. |

Containment wording is deliberately high-level. The engine never emits implementation-specific or destructive remediation instructions, recipients, assignments, commands, or workflow execution.

## Evidence authority and precedence

Evidence is `explicit`, `analyst-confirmed`, or `inferred`. Only explicit and analyst-confirmed current evidence can justify `Contain` or `Escalate`. Inferred evidence can explain why a clarification is needed, but cannot make a consequential operational recommendation.

`Clarify` takes precedence where the engine cannot safely establish business consequence, deadline relationship, workaround equivalence, containment/extent, multi-clause composition, evidence authority, current versus historical harm, or current versus possible future harm. A meeting date is not a deadline; an observed exposure is not proof of total extent; a spreadsheet is not proof of an equivalent workaround; and a hypothetical risk is not active harm.

## Result contract

`recommendNextAction()` is a pure structured-input function in `js/engine/next-action.js`. It returns stable action/rule/reason IDs plus its rationale, evidence used, blockers, clarification questions, and provenance. The analyzer adapts existing clause-level evidence and analyst refinements into this contract only after the priority result is complete. The UI displays all of these elements.

## Boundaries

v0.9.0 adds no ticket assignment, integration, remote service, persistence, notification, action execution, autonomous workflow, SLA calculation, routing, knowledge retrieval, LLM, analytics, telemetry, dependency, backend, or build system. It does not expand v0.8’s frozen broad NLP capability boundary; where wording cannot establish a fact, analyst confirmation remains the safe path.
