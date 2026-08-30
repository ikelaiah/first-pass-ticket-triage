# Triage Policy

**Release:** v0.8.0 — Triage Policy Calibration
**Status:** normative policy for the deterministic analyser

This document defines the decision made after evidence extraction. It is not a
phrase dictionary and it does not replace the eight semantic questions.

## Core model

```text
Impact  = consequence: how bad is the effect if it exists?
Urgency = time sensitivity: how quickly must action occur?
Priority = matrix(Impact, Urgency)
```

Impact and Urgency are independent. A broad problem can have low urgency when a
reliable process keeps work moving. A one-person problem can have high urgency
when a serious consequence arrives today. Neither a risk noun, requester
seniority, platform category, nor a requested priority can name a P1.

The authoritative matrix is unchanged:

|                    | Low impact | Medium impact | High impact |
| ------------------ | ---------- | ------------- | ----------- |
| **High urgency**   | P3         | P2            | P1         |
| **Medium urgency** | P3         | P3            | P2         |
| **Low urgency**    | P4         | P3            | P2         |

The analyser first extracts evidence with provenance (`explicit`, `inferred`,
`manual`, or `unknown`). Base weighted scores are calculated from that evidence.
The policy layer then calibrates Impact and Urgency. Only `priorityFor()` maps
the final two levels to a priority.

## Policy decision table

The table is also exported as `TRIAGE_POLICY_DECISIONS` from
`js/engine/policy.js`, so the tests and this document share stable rule IDs.

| Rule | Evidence | Impact effect | Urgency effect | Rationale |
| ---- | -------- | ------------- | -------------- | --------- |
| `workaround.full` | Full alternative completes the same business process | Normally unchanged | Reduce when the process can continue | A workaround buys time, but the underlying defect remains |
| `workaround.partial` | Only some cases/users can continue | Unchanged | At most a modest reduction; preserve active process pressure | Part of the business cost remains |
| `workaround.costly` | Manual/high-cost workaround consumes material daily effort | Unchanged | Do not reduce an active issue below Medium solely because of the workaround | Work can continue, but at a material operational cost |
| `workaround.temporary` | Temporary workaround is valid now | Unchanged | May reduce while valid; restore normal pressure when it expires | Temporary continuity is not resolution |
| `workaround.unknown` | No workaround evidence | Unchanged | No adjustment | Unknown is not no workaround |
| `deadline.hard-near` | Committed now/today/tomorrow requirement | Unchanged | Medium or High according to active consequence, blocking, and recovery time | Proximity makes waiting consequential |
| `deadline.hard-future` | Committed statutory/operational event in days or weeks | Unchanged | At least Medium; High requires independent immediate consequence | A real future requirement is not the same as a preference |
| `deadline.soft` | Preference, “if possible”, “whenever convenient”, “can wait”, or “no rush” | Unchanged | Low unless independent active harm requires more | A target is not a hard business cutoff |
| `deadline.timestamp` | Mere timestamp, historical date, or observation | Unchanged | No increase | When the ticket was seen is not when work is needed |
| `harm.active` | Confirmed harm/exposure is occurring now | Raise to High for serious risk | Raise to High where the risk is time-sensitive | Waiting permits ongoing harm |
| `harm.pending` | Credible future/potential harm | Contextual; may raise Impact when severity is credible | No automatic active-harm increase | Potential severity matters, but harm is not occurring yet |
| `harm.resolved` | Harm/access was revoked, fixed, or closed | Current work may be Low while historical consequence remains visible | Do not exceed the active equivalent | Resolved harm is not more urgent than active harm |
| `privacy.context` | Sensitive/private information is present but exposure is not evidenced | No standalone elevation | No standalone elevation | Privacy nouns are context, not proof of a breach |
| `privacy.active` | Cross-person disclosure, active exposure, or confirmed unauthorised access | High | High | Actual exposure is a current consequence |
| `financial.topic` | Payroll/payment/finance is mentioned | No standalone elevation | No standalone elevation | Domain alone does not establish financial harm |
| `financial.confirmed` | Incorrect payments, duplicate charges, missed pay, or corrupted financial records are confirmed | Contextual to High based on scope/propagation | Deadline and active processing determine urgency | Consequence, not vocabulary, drives severity |
| `loss.recoverable` | Deleted/unavailable data can be restored | Moderate/contextual; never lower because it is “just unavailable” | Restoration deadline and time-to-restore determine urgency | A backup is recovery evidence and may be a workaround |
| `loss.unrecoverable` | Permanent deletion, no usable backup, or irretrievable loss | Raise to High when the consequence is material | Consequence deadline determines urgency | Permanent loss cannot be undone |
| `containment.preserve` | Affected extent is bounded | Preserve consequence already incurred | May lower urgency if work can continue | Containment stops growth; it does not erase harm |
| `propagation.active` | Incorrect data is continuing to spread | Raise Impact as supported by stated scope | Raise to at least Medium; do not manufacture High from propagation alone | Increasing consequence needs attention, but scope and deadlines remain separate |
| `recurrence.pattern` | Fault repeatedly returns | Increase cumulative Impact as supported | No automatic urgency increase | Recurrence is breadth over time, not necessarily immediate time pressure |
| `criticality.context` | Configured critical system is named | No effect alone; small support only with actual failure | No effect alone | Criticality cannot manufacture a blocked process |
| `safety.active` | Active safety consequence or broken safety control | High | High when people are exposed now or the event is imminent | Safety is a consequence and a time-sensitive risk |
| `safeguarding.active` | Active safeguarding breach or excluded person still has access | High | High | The obligation is being breached now |
| `safeguarding.pending` | Potential safeguarding/compliance harm | Contextual | Deadline/approval/event controls urgency | Potential harm is not automatically an emergency |
| `seniority.neutral` | Principal, executive, or other requester seniority | Unchanged | Unchanged | Who asks does not change what breaks |
| `platform.neutral` | Generic catalogue/platform category changes | Unchanged | Unchanged | Catalogue metadata is routing context only |

## Workarounds

The evidence value `yes` means a full workaround unless the ticket says it is
partial or materially costly. A full workaround must preserve the relevant
business process end-to-end, not merely provide a way to view a screen. A
paper roll, spreadsheet, Chrome fallback, phone process, or manual finance
correction can therefore be a full workaround when the stated process can
actually complete.

`partial` means that some users, records, or steps still fail. It can reduce
Urgency modestly but cannot erase a blocked process. A high-cost/manual
workaround is still `yes` for provenance, but its daily cost prevents the
issue from being treated as Low urgency merely because a path exists.

Temporary workarounds affect the current assessment while they are available.
An historical workaround that has been retired is not current evidence; it is
Unknown. A workaround normally changes Urgency, not Impact. Impact changes only
when the alternative explicitly prevents the underlying consequence or shows
that the stated consequence was never present.

## Deadlines and time sensitivity

The deadline detector keeps its buckets (`now`, `today`, `tomorrow`,
`days-2-5`, `weeks-1-2`, `none`, `unknown`). Policy distinguishes a genuine
hard requirement from a date-shaped phrase:

- Immediate operational requirements and same-day hard cutoffs can be High
  urgency when a process is blocked, harm is active, or no recovery path
  exists. Otherwise they are at least Medium.
- Tomorrow and 2–5 day hard requirements are normally Medium and can be High
  when active harm, blocked work, or restoration time makes waiting unsafe.
- A committed statutory or operational requirement in the `weeks-1-2` bucket
  receives a Medium floor. The policy does not perform calendar arithmetic.
- Preferences (`if possible`, `would like`, `nice to have`), “can wait”, “no
  rush”, “whenever convenient”, and similar soft targets are Low urgency on
  their own, even when a future date is named.
- A timestamp (“logged at 8:30”, “this morning we noticed”) and a historical
  date do not create a deadline. Unknown driver remains Unknown; it is not
  silently promoted to an operational requirement.

An independently active outage or safety/security consequence can still make a
soft-deadline ticket Medium or High. The soft wording does not erase a real
consequence; it only prevents the date from supplying urgency by itself.

## Active, potential, resolved, and historical harm

Active harm is happening now: information is visible to the wrong person,
employees are unpaid, safety information is missing during use, or incorrect
data is being acted on. Pending harm is credible but conditional: a change
could expose data, a credential will expire, or a payment may fail at a future
cutoff. Resolved and historical harm is evidence about what happened, not an
active reason to raise current Urgency. Negated harm is not harm evidence.

Potential severity can contribute contextual Impact when the ticket describes a
credible, material consequence. It does not automatically add active Urgency.
Safeguarding, safety, security, and statutory deadlines remain exceptions only
when their own active or time-bound evidence is present.

## Privacy and security

Sensitive information, privacy, security, PII, or breach vocabulary alone does
not mean maximum severity. A report containing confidential data with no
exposure is a privacy context. A pending approval that could expose data is
pending/contextual. A cross-person disclosure, currently visible record,
confirmed unauthorised access, or an attacker with live access is active and
receives High Impact and High Urgency. Revoked or resolved access is not active
exposure.

## Payroll and financial harm

Payroll, pay runs, payment gateways, invoices, and finance are domains and risk
context. They do not establish financial harm by themselves. Conservative
inference applies when evidence is incomplete:

- A processing question, successful payroll, or future readiness question is
  Low unless another consequence is stated.
- A failed pay file or payment service with a hard cutoff and no workaround is
  at least time-sensitive, but remains Medium Impact unless the ticket says
  pay is missed, processing is blocked, or a material payment consequence is
  confirmed.
- Confirmed unpaid employees, duplicate charges, incorrect payment records, or
  financial corruption propagating downstream can be High Impact according to
  scope and breadth. A same-day cutoff can make Urgency High.

## Data loss and recoverability

Unavailable data, a missing display, an incorrect record, deletion, duplication,
corruption, and propagation are separate facts. “Unavailable” is not “lost”.
Recoverable deletion remains a real active consequence, but restoration
evidence can keep Impact contextual/Medium; the time to restore and any hard
teaching, payroll, or reporting event determine Urgency. Permanent loss or no
usable backup can raise material Impact to High. A backup is recovery evidence
and may also be a workaround; it does not make the original deletion vanish.

## Breadth, propagation, recurrence, and containment

- Breadth is how many people, records, schools, or systems are stated as
  affected. It is never invented from propagation.
- Propagation means the consequence is continuing to move or be written into
  downstream systems. It raises Impact on the stated extent and provides a
  Medium urgency floor, but it does not automatically create a P1.
- Recurrence is a repeated pattern. It increases cumulative Impact as
  supported, but does not alone mean the current instance is time-critical.
- Containment means the affected extent is bounded and no longer increasing.
  It can reduce Urgency when work can continue, but preserves harm already
  incurred and does not lower Impact merely because spread stopped.

## Critical systems, safety, safeguarding, and compliance

Configured criticality is supporting evidence only. A critical platform name
without an actual failure, affected process, scope, or deadline has no scoring
effect. Actual consequence, affected scope, and time sensitivity remain
independent inputs.

An active safety issue, active safeguarding breach, or excluded person retaining
access is High Impact and normally High Urgency. A potential safeguarding
consequence, compliance context, or accessibility limitation is contextual.
An accessibility barrier with a workaround may still be Medium urgency because
the workaround can preserve operations while failing an equal-access
obligation; it is not automatically High. Statutory deadlines are governed by
the deadline rules above, not by the word “compliance” alone.

## Required invariants

The following are policy invariants, tested against structured inputs:

- A stronger workaround cannot make Urgency higher solely because it exists.
- Active harm is never less urgent than the otherwise identical resolved harm.
- A preference cannot outrank an equivalent operational requirement.
- Adding active propagation cannot reduce Urgency.
- Increasing stated scope cannot reduce Impact solely because scope increased.
- Making loss unrecoverable cannot lower Impact.
- Requester seniority, platform category, and critical-system labels alone do
  not change Priority.
- Broad scope does not manufacture propagation.
- Containment does not erase Impact already incurred.
- Only the matrix produces Priority, and every result satisfies
  `priorityFor(impact, urgency)`.
