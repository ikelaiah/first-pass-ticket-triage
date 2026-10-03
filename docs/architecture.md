# Architecture

First Pass is a static site: plain HTML, CSS and vanilla JavaScript ES modules,
with no build step and no runtime dependencies. The only development-time
dependencies are ESLint, Prettier and TypeScript (for JavaScript type checking).

## Pipeline

```text
ticket text
   ↓  normalise + clause split + negation-aware phrase matching   (negation.js)
   ↓  the eight decision questions                                (scope, symptom, risks,
   ↓                                                              recoverability, containment,
   ↓                                                              deadline, driver, workaround,
   ↓                                                              harm-timing)
Impact + Urgency  (weighted, then a hard-safety calibration)      (impact.js, urgency.js, policy.js)
   ↓
3x3 matrix — the only place a P number is decided                 (priority-matrix.js)
   ↓
P1–P4 + confidence + reasoning + ranked follow-up questions       (analyzer.js, confidence.js)
   ↓  pure projections that cannot change P
Safe Next Action · Triage Handoff · Suggested reply               (next-action.js, ui/handoff.js, ui/reply.js)
```

`analyse(text, overrides)` in `js/engine/analyzer.js` is the single entry point.
It returns a plain object that the UI renders.

## Module map

| Path                                | Responsibility                                                                                                                   |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `js/engine/negation.js`             | Normalisation, contraction/spelling expansion, clause splitting, negation-aware phrase matching (`scan`, `scanPositive`, `has`). |
| `js/engine/evidence.js`             | The evidence ledger: records each fact with authority, temporal state, polarity, context and role.                               |
| `js/engine/scope.js`                | I1 — affected population, parsed counts, comparison guards.                                                                      |
| `js/engine/symptom.js`              | Technical symptom and severity bands.                                                                                            |
| `js/engine/risks.js`                | I3 — payroll, payments, privacy, security, safety, safeguarding, data integrity, plus risk modifiers.                            |
| `js/engine/recoverability.js`       | I3 — explicit recoverable vs unrecoverable loss.                                                                                 |
| `js/engine/containment.js`          | I4 — contained, spreading, recurring, unknown extent.                                                                            |
| `js/engine/deadline.js`             | U5 — now … no deadline, and committed vs bare timing.                                                                            |
| `js/engine/driver.js`               | U6 — statutory, operational or preference.                                                                                       |
| `js/engine/workaround.js`           | U7 — availability and daily cost, honouring negation.                                                                            |
| `js/engine/harm-timing.js`          | U8 — active vs pending harm.                                                                                                     |
| `js/engine/impact.js`, `urgency.js` | Weighted scoring of the two matrix inputs.                                                                                       |
| `js/engine/policy.js`               | The hard-safety calibration applied before the matrix.                                                                           |
| `js/engine/priority-matrix.js`      | The authoritative Impact × Urgency table and `priorityFor`.                                                                      |
| `js/engine/confidence.js`           | Heuristic evidence completeness and conflicts.                                                                                   |
| `js/engine/next-action.js`          | Safe Next Action policy (structured evidence in, advisory out).                                                                  |
| `js/engine/analyzer.js`             | The pipeline and the result model.                                                                                               |
| `js/data/phrases.js`                | Every phrase dictionary, grouped by facet.                                                                                       |
| `js/data/systems.js`                | Configured system detection.                                                                                                     |
| `js/data/examples.js`               | The worked examples — also the test oracle.                                                                                      |
| `js/config.js`                      | Organisation settings: school count and systems.                                                                                 |
| `js/ui/*`                           | Rendering, the matrix, refinement controls, reply, handoff, share.                                                               |

## Invariants

These hold for every result and are asserted in `tests/triage.test.mjs`:

1. **Only the matrix names a priority.** For an assessed result,
   `suggestedPriority === priorityFor(impact, urgency)`.
2. **Projections cannot feed back.** Safe Next Action, the handoff and the reply
   read the analysis and never change Impact, Urgency or the priority.
3. **Unknown is not invented.** A missing scope, deadline, workaround or
   consequence stays unknown, lowers confidence and becomes a question.
4. **Input relevance is required.** Scope, time words and declared urgency are
   not support signals; without a recognised system, symptom or risk the result
   is unassessed.
5. **Negation is honoured.** A negation cue cancels a nearby phrase but never
   crosses a clause boundary.

## Privacy boundary

There is no `fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon` or `EventSource`
anywhere in the application, and no external asset. A static source scan in
`tests/run.mjs` fails the build if one is ever introduced.
