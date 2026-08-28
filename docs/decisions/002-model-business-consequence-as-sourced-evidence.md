# ADR-002: Model business consequence as sourced evidence

## Status

Accepted

## Date

2026-08-29

## Context

Technical symptoms and business consequence are not interchangeable. “Canvas is slow”
does not establish what work is affected, while “teachers cannot mark the roll” does.
The previous I2 implementation displayed selected blocked-process phrases and
configured system-status implications, but did not give the evaluator a stable fact to
measure or analysts a focused way to confirm the missing information.

Treating every important system or technical failure as a blocked business process
would escalate tickets without evidence. Conversely, sending ticket text to a language
model or parser would conflict with the project’s local-only, deterministic, and
explainable constraints.

## Decision

Represent the consequence as a sourced fact with a level (`unknown`, `impaired`, or
`blocked`), optional named process, evidence quote, and provenance (`explicit`,
`inferred`, `manual`, or `unknown`).

Explicit phrase matches and manual confirmation are eligible for small, documented
impact/urgency contributions. Configured status consequences are `inferred`: they are
shown to guide an analyst, but are deliberately not scored automatically. A generic
symptom never manufactures a consequence. The P1–P4 matrix remains unchanged.

The offline evaluator accepts optional labels for the consequence and other decision
facets, and reports only case identifiers and fact mismatches.

## Alternatives considered

### Keep I2 display-only

Rejected because it leaves a decision-relevant fact unmeasured and does not support a
focused analyst confirmation.

### Infer consequence from system criticality or symptom severity

Rejected because an important system can have a low-impact request, and a symptom
alone does not prove a process is blocked.

### Use an external grammar or language-model service

Rejected because it would add network handling, nondeterminism, dependencies, and
unexplained classifications for sensitive school-support tickets.

## Consequences

- The result model has a new `consequence` value and `businessConsequence` detail.
- Phrase coverage stays small and auditable; each added wording requires a positive and
  nearby counterexample test.
- The analyst can provide missing consequence evidence without directly overriding
  impact or urgency.
- Inferred system knowledge remains useful but cannot silently raise priority.
- Production weight calibration remains deferred until an approved labelled corpus is
  available.
