# Eight-Question Decision Model

**Release:** v0.9.1 — Eight-Question Model Consistency  
**Status:** normative analyst-facing model

The triage engine keeps one stable analyst-facing model: four Impact questions and
four Urgency questions. The model is deliberately smaller than the internal evidence
graph. It is a way to explain the decision, not a count of detectors.

```text
Ticket
  ↓
Structured evidence + context/provenance gates
  ↓
I1 I2 I3 I4  +  U5 U6 U7 U8
  ↓
Impact + Urgency
  ↓
Policy calibration → 3×3 matrix → P1–P4

Safe Next Action is a separate downstream advisory.
```

## The stable questions

| ID | Decision Question | Primary ownership |
| --- | --- | --- |
| I1 | Who and how many are affected? | Scope and breadth |
| I2 | What business process is blocked? | Symptom, system/domain, known status, and explicit or inferred consequence |
| I3 | Is anything wrong, exposed, lost, or unsafe — and can it be recovered? | Risks, active consequence, loss, and explicit recoverability |
| I4 | Is the issue contained, or spreading, recurring, or of unknown extent? | Containment, propagation, recurrence, and extent |
| U5 | When is the outcome needed? | Deadline and commitment timing |
| U6 | What creates the deadline: a requirement or a preference? | Statutory, operational, or preference driver |
| U7 | Can work continue, and what does the workaround cost per day? | Workaround availability, completeness, and daily cost |
| U8 | Is the harm happening now, or waiting to happen? | Active, pending, or resolved harm timing |

I2 is about the business process, not merely the technical symptom: “Canvas is
slow” and “teachers cannot mark the roll” can be different evidence. I3 owns
recoverability; a usable backup can make loss recoverable, but it does not create a
new question.

## Evidence boundaries

Many internal evidence signals can support one question. Decision evidence includes
scope, blocked process, symptom, system/domain, consequence, risk, recoverability,
containment, propagation, recurrence, deadlines, drivers, workarounds, daily cost,
and harm timing.

Context and gating evidence includes input relevance, current versus historical or
hypothetical framing, provenance and authority, expected behaviour, work type, and
configuration knowledge. These gates determine whether evidence is admissible; they
are not additional questions. Policy metadata and modifiers calibrate Impact and
Urgency after the eight projections. Therefore the model has exactly eight IDs—there
is no ninth signal, dimension, or question in the analyst-facing panel.

The scoring, policy, matrix, P1–P4 result, and Safe Next Action contracts remain
unchanged by this conceptual boundary.
