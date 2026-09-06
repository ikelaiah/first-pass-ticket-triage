# ADR-005: Separate clause evidence from facet projection

## Status

Proposed

## Date

2026-09-06

## Context

The v0.8.0 locked release corpus is frozen. After two generalized remediation
cycles on `release/v0.8.0-evidence-reliability`, the unreviewed gate moved from
27 to 26 cases. The safety gates remained zero throughout: unsafe
under-prioritisation, severe unsafe under-prioritisation, and abstentions on
assessed tickets are all zero.

The cycles were deliberately narrow:

- `82a0d58` made U8 active only where a blocked process has independent
  continuity evidence; it improved U8 from 21/36 to 24/36 without changing
  the case-count gate.
- `f91969f` stopped an exposed view being treated as a workaround; it resolved
  `release-16` and raised U7 from 21/36 to 22/36.

The second result is a one-case reduction. Under the release instruction, two
consecutive generalized cycles below three cases require an architectural
review before any further vocabulary is added.

The current first-divergence evidence is not one missing dictionary. The
unreviewed facet groups are:

| Facet | Cases | IDs |
| --- | ---: | --- |
| I1 scope | 6 | 11, 13, 17, 21, 32, 34 |
| I2 process | 8 | 07, 11, 17, 23, 26, 27, 32, 34 |
| I3 risk state | 12 | 07, 11, 12, 13, 19, 23, 25, 26, 27, 32, 33, 35 |
| I4 containment | 8 | 14, 15, 24, 25, 26, 27, 33, 35 |
| U5 deadline | 9 | 15, 20, 24, 25, 26, 28, 29, 32, 33 |
| U6 driver | 9 | 05, 12, 22, 25, 26, 29, 34, 35, 36 |
| U7 continuity | 13 | 07, 09, 11, 12, 17, 19, 23, 24, 25, 26, 27, 32, 34 |
| U8 harm timing | 11 | 07, 09, 10, 17, 19, 21, 23, 26, 28, 32, 35 |

The current analyzer has a `continuityHit` path that writes several projected
facet values together: inferred process impairment, workaround availability,
containment, deadline, and driver. This coupling made the U8 correction depend
on workaround evidence. It also prevents independently correcting continuity
without changing I2/I4/U5/U6 behavior expected by existing frozen cases such as
`release-02` and `release-06`.

Equivalent facts consequently receive different authority depending on which
detector found them, and an alternative path can accidentally become evidence
of bounded extent or an absent deadline. The current scalar facet fields do
not retain enough clause, polarity, role, or provenance information to resolve
that centrally.

## Decision

Do not add further phrase vocabulary for the v0.8.0 mismatch set until the
analyzer has a clause-level evidence representation and facets project from it
independently.

Introduce an internal evidence record with at least:

```text
kind            alternative-path | blocked-operation | affected-population |
                risk-state | deadline | driver | containment | harm-state
value           facet-specific normalized value
quote           exact source text
clauseIndex     normalized-document clause
polarity        affirmed | negated | conditional | historical | resolved
authority       explicit | inferred | analyst-confirmed
role            primary-path | alternative-path | observation | requirement
```

Facet projection must consume only compatible records:

- U7 may use an affirmed, current `alternative-path` record.
- I4 requires affirmative extent/no-growth evidence; it cannot inherit U7.
- U5/U6 require a requirement/event record; they cannot inherit U7.
- I2 distinguishes the failed primary business operation from a technical
  symptom and from an available alternative.
- U8 requires active harm evidence or an explicit blocked primary operation
  whose continuity state proves an active operational consequence.

All detectors producing equivalent evidence must emit the same authority. An
inferred alternative must never become confirmed merely by crossing a facet
boundary, and an analyst refinement remains higher authority than either
automatic detector.

## Alternatives considered

### Continue adding U7/U8 phrases

Rejected. The two remediation cycles were below the release threshold, and
phrase additions cannot express whether a statement is a primary failure,
alternative path, condition, timestamp, or historical observation.

### Remove all continuity-derived projections immediately

Rejected. The frozen release corpus currently relies on some historical
continuity projections. Removing them produced new locked disagreements in
`release-02` and `release-06`; that would trade an audited defect for a wider
regression without a replacement model.

### Escalate priorities to hide missing facet evidence

Rejected. It violates the no-blanket-escalation rule and would not preserve the
safety metrics as meaningful measurements.

## Consequences

- The remaining 26-case release gate stays blocking; no release workflow is
  authorised.
- The next implementation unit is an evidence-model migration, not a broad
  fixture or vocabulary rewrite.
- Tests must first cover provenance equivalence and clause role before moving
  any existing detector to the new records.
- Migration must keep the 3x3 priority matrix as the sole priority authority
  and preserve the current zero values for unsafe under-prioritisation, severe
  unsafe under-prioritisation, and assessed-ticket abstentions.
- Once the representation exists, attack the ranked mechanisms in this order:
  primary-operation/continuity/harm state; affected-population scope; risk
  state; then time/containment projection.
