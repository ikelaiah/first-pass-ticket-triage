# Glossary

**Impact** — how much of the organisation is affected, and how serious the
consequence is. One of the two matrix inputs.

**Urgency** — what happens if we wait. The other matrix input.

**Priority** — P1–P4, produced only by the 3×3 matrix from Impact × Urgency.

**Facet / Decision Question** — one of the eight analyst-facing questions:
I1–I4 (Impact) and U5–U8 (Urgency). A facet is a projection over evidence, not a
single detector.

**Key driver** — an unknown facet whose answer could change this ticket's matrix
cell. Shown with a _key driver_ badge to prompt a question.

**Answered / Inferred / Unknown** — the state of a facet: explicit wording was
found; evidence was derived from a symptom or risk; nothing was found.

**Evidence ledger** — the internal record of every detected fact, each with:

- **authority** — `explicit`, `inferred`, `manual` (analyst-confirmed) or
  `unknown`;
- **temporal** — `current`, `historical`, `future` or `hypothetical`;
- **polarity** — `positive` or negated;
- **context** — `primary` or quoted/background;
- **role** — `primary`, `alternative-path`, `comparator` or `observation`.

**Committed vs asserted** — a committed deadline ("must be processed this
afternoon") is a real cutoff; asserted urgency ("please fix immediately") is a
feeling and is discounted.

**Safety calibration** — the small set of rules in `policy.js` that raise or
lower Impact/Urgency before the matrix for active exposure, safeguarding,
safety, confirmed same-day financial failure, propagation, unrecoverable loss
and costly workarounds.

**Assessment confidence** — a heuristic description of how much
decision-relevant information the ticket contained. Not a probability.

**Unassessed** — no valid triage case was established (no system, symptom or
risk). There is no actionable suggested priority; the tool asks a question.

**Projection** — Safe Next Action, Triage Handoff and the suggested reply. They
summarise the analysis and cannot change it.

**Clause** — a segment of text split on `. ; ! ?` and contrast words ("but",
"however"). Negation and context never cross a clause boundary.
