# ADR-001: Filter inactive context before evidence detection

## Status

Accepted

## Date

2026-08-28

## Context

Tickets commonly contain quoted earlier messages, resolution updates, post-incident
requests, design requirements, UAT simulations, and exercise scenarios. The same words
that correctly identify a live outage or exposure appear in those inactive contexts.

Adding exceptions to each scope, symptom, deadline, and risk dictionary would duplicate
chronology rules and allow different detectors to disagree about which incident is
current. Sending ticket text to an external language service would violate the local-
only privacy boundary.

## Decision

Run a small deterministic context preprocessor before the existing detectors. It uses
only strong explicit cues to classify the current decision context as:

- `active-or-unspecified`
- `resolved`
- `planned-test`

Quoted or superseded history remains available as explainable ignored evidence, but does
not feed automatic impact or urgency. An explicit later failure reopens a resolved
incident. Manual impact and urgency overrides remain authoritative.

## Alternatives considered

### Add exclusions to every phrase dictionary

Rejected because chronology would be duplicated across modules and become difficult to
test consistently.

### Score the full email and de-escalate afterward

Rejected because stale scope and risk flags would remain visible and could still affect
follow-up simulations or later modifiers.

### Use an external language model

Rejected because it would add nondeterminism, dependencies, network processing, and a
privacy model that conflicts with this project.

## Consequences

- Strong inactive cues reduce false escalation without changing the priority matrix.
- Ambiguous tense remains active-or-unspecified rather than being silently discarded.
- The preprocessor requires positive and nearby counterexample tests whenever a new
  status or modality phrase is added.
- Complex threads with multiple simultaneous live incidents still require human review.
