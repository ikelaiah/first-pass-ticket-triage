# Priority Framework

**Release:** v0.12.0 — Core Simplification
**Status:** the authoritative, human-readable contract. The implementation in
`js/engine/` follows it, and `tests/triage.test.mjs` asserts it.

This is the one document that defines everything the priority is calculated
from: the eight decision questions, the two matrix inputs they project onto,
and the 3x3 matrix. Nothing else may name a priority.

> The tool is deliberately small. It reads what the ticket states for the eight
> questions and, where a question is unanswered, asks. It does not infer a
> deadline, a business consequence, an upstream system or a platform category
> from configuration or from prose the requester did not write.

---

## 1. The core principle

> **Do not classify tickets by how dramatic they sound. Classify them by
> business consequence and time sensitivity.**

| Ticket                                                                             | Priority |
| ---------------------------------------------------------------------------------- | -------- |
| "I cannot log into my Windows workstation."                                        | P3       |
| "Nobody can log into the production server and all integration jobs have stopped." | P1       |

Same symptom. Different consequence.

---

## 2. The pipeline

```text
Ticket text
   ↓  normalise (lowercase, expand contractions, unify spelling)
   ↓  split into clauses (. ; ! ? and "but" / "however")
   ↓  match phrase dictionaries, honouring negation
Structured evidence
   ↓  the eight Decision Questions — Impact I1–I4 vs Urgency U5–U8
   ↓  I1 Scope   I2 Blocked process   I3 Wrong/exposed/lost/unsafe — recoverable?   I4 Contained?
   ↓  U5 When?   U6 Requirement or preference?   U7 Workaround/cost?   U8 Harm now or pending?
   ↓  weighted scoring
Impact + Urgency
   ↓  a small hard-safety calibration
Impact × Urgency
   ↓  the 3×3 matrix — the only place a P number is decided
P1 / P2 / P3 / P4
   ↓  Assessment confidence · Reasoning · Missing information · Follow-up questions
   ↓  Safe Next Action · Triage Handoff · Suggested reply   (advisory projections only)
```

The natural-language engine **never** assigns a priority directly. If a rule
wants a ticket to be more urgent, it says so by raising urgency, and the matrix
does the rest. Every priority can be traced to two values and one table.

### Input relevance boundary

Before a result is accepted as a meaningful suggestion, the request must contain
at least one recognised support signal: a configured system, a technical symptom,
or a critical-risk flag (or an SLA breach). Scope, time words and
requester-declared priority are deliberately **not** support signals, so
_"all users, P1, fix now"_ cannot manufacture an IT incident.

Text with no support signal is marked **unassessed**, receives no actionable
priority, and asks which IT system, application, device or service needs
support. This is not a P4 — it is "no valid triage case was established yet."

---

## 3. The matrix

|                    | Low impact | Medium impact | High impact |
| ------------------ | ---------- | ------------- | ----------- |
| **High urgency**   | P3         | P2            | P1          |
| **Medium urgency** | P3         | P3            | P2          |
| **Low urgency**    | P4         | P3            | P2          |

- High urgency alone never produces P1. A blocked individual is still P3.
- High impact alone never produces P1. A broad outage with no deadline is P2.
- P1 requires **both**, or a safety calibration that legitimately raises both.

---

## 4. The eight Decision Questions

Priority is judged from eight analyst-facing questions. The result card surfaces
all eight and the follow-up questions are limited to the unknowns that would
actually change the priority.

| #      | Question                                                              | What it captures                                                                                                                      | Where it is read                                                                                                          |
| ------ | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **I1** | Who and how many are affected?                                        | Scope breadth. Numbers are parsed ("35 casual staff" is a team; "4 schools" is multiple). Unknown stays unknown.                      | `js/engine/scope.js`, `SCOPE_PHRASES`                                                                                     |
| **I2** | What can they not do right now that they could do yesterday?          | The blocked business process, not the symptom.                                                                                        | `js/engine/analyzer.js:detectBlockedProcess`, `BLOCKED_PROCESS_PHRASES`, `IMPAIRED_PROCESS_PHRASES`                       |
| **I3** | Is anything wrong, exposed, lost or unsafe — and can it be recovered? | Payroll/payments, privacy, security, safety, safeguarding, data integrity, deletion, recoverability.                                  | `js/engine/risks.js`, `js/engine/recoverability.js`, `RISK_DEFINITIONS`, `RISK_MODIFIERS`                                 |
| **I4** | Is it contained, or spreading, recurring, or of unknown extent?       | One bad record versus a fault propagating across systems.                                                                             | `js/engine/containment.js`, `CONTAINED_PHRASES`, `RECURRENCE_PHRASES`, `UNDETECTED_PHRASES`, `RISK_MODIFIERS.propagating` |
| **U5** | When do you need this by?                                             | The anchor. `now › today › tomorrow › 2–5d › 1–2w › none`. A bare time reference after an observation is a timestamp, not a deadline. | `js/engine/deadline.js`, `DEADLINE_BUCKETS`                                                                               |
| **U6** | What creates the deadline — a requirement or a preference?            | Statutory (census, NAPLAN), operational (payroll cutoff, class starts), or preference. Requester seniority scores zero.               | `js/engine/driver.js`, `DRIVER_PHRASES`                                                                                   |
| **U7** | Can work continue — and what does the workaround cost per day?        | Existence and sustainability. A workaround lowers urgency and leaves impact untouched.                                                | `js/engine/workaround.js`, `WORKAROUND_PHRASES`, `WORKAROUND_COST_PATTERNS`                                               |
| **U8** | Is the harm happening now, or waiting to happen?                      | Expired versus expiring. Active exposure versus a pending risk.                                                                       | `js/engine/harm-timing.js`, `HARM_TIMING_PHRASES`                                                                         |

Each question reports a state: **✓ Answered** (explicit wording), **○ Inferred**
(derived from symptom/risk), or **? Unknown** (no evidence — the follow-up
question that would change the priority). Unknown lowers confidence.

The eight questions are projections over evidence, not eight raw detectors.
Recoverability belongs to I3. Context and gating (input relevance, an explicit
resolution) determine whether evidence is admissible; they are not extra
questions.

---

## 5. Impact

Impact answers: **how much of the organisation is affected, and how serious is
the consequence?**

- **Low** — one user, one student, one record, one report; documentation and
  cosmetic issues; an enhancement with limited consequence.
- **Medium** — multiple users, a team, a department, a cohort, one school; a
  business function impaired but still functioning; a recurring issue.
- **High** — multiple schools, all schools, corporation-wide; a critical shared
  pipeline; payroll or financial processing; security, privacy, safeguarding or
  compliance exposure; widespread bad data or a broad outage.

Scope is the largest single contributor, but never the only one: _"One employee
is about to miss today's pay"_ is one person and not Low impact. Equally, naming
a critical system is not High impact when nothing is broken.

---

## 6. Urgency

Urgency answers: **what happens if we wait?**

- **Low** — waiting creates no immediate unacceptable consequence. "FYI", "no
  rush", "there is a workaround", "we can work without it", "future request".
- **Medium** — the business can continue temporarily, but there is an
  approaching consequence. "Need this in 2–5 days", "before Friday", "before
  next payroll", "manual workaround available".
- **High** — a serious consequence is occurring now or is imminent. "Now",
  "today", "by 2pm", "no workaround", "completely blocked", "currently exposed",
  "cutoff today".

A committed statutory or operational future deadline sets a Medium floor;
preferences and "can wait" wording do not.

**A sole-instance system is a single point of failure.** When the organisation
has exactly one of a system (for example the only LMS), a current failure has no
alternative path, so it raises urgency — never impact — unless the ticket scopes
the problem to one person, states a workaround, or says it is resolved. This is
why _"Canvas is down"_ is not P3.

**Asserted urgency is not urgency.** Words such as _urgent_, _critical_, _ASAP_
and _immediately_ are treated as evidence that the requester is worried, not as
evidence of consequence. An SLA breach is different: it is a measurable
statement about an agreed commitment and does add urgency. **Escalation changes
nothing** — who asked does not determine what breaks, and scores zero.

---

## 7. Scope

| Scope             | Typical wording                                               |
| ----------------- | ------------------------------------------------------------- |
| Individual        | one user, one student, a staff member, for me, my workstation |
| Few users         | several users, a few staff, a handful                         |
| Team / Department | the registrar team, finance team, the office                  |
| Cohort            | a class, a year group, the cohort                             |
| One school        | our school, School X, one campus                              |
| Multiple schools  | several schools, three schools, multiple sites                |
| All schools       | all schools, every school, all 19 schools                     |
| Corporation-wide  | corporation-wide, everyone, all staff, the whole organisation |
| Unknown           | _nothing in the ticket says_                                  |

Numbers are parsed. The broadest credible scope wins. **Unknown stays Unknown**
— scope is never guessed; it lowers confidence and produces a follow-up
question. A scope named only as a comparison is ignored.

### Deployment facts that shape scope and floor

Some scope and priority behaviour comes from how the organisation actually runs
a system, not from the ticket wording. These live in the deployment profile,
`js/deployment.js` ([docs/deployment.md](docs/deployment.md)):

- **Shared instance.** When every tenant shares one instance of a platform (for
  example 18 schools on one Canvas), a confirmed failure reported for a single
  tenant means the shared instance is down for all of them. The affected scope
  widens to all tenants. A stated workaround, a resolved incident, or a problem
  scoped to one or two people does not widen.
- **Sole instance.** The organisation has exactly one of the system, so a
  current failure has no alternative path and raises urgency.
- **Failure floor.** A confirmed failure of a system marked with a floor sets a
  minimum priority immediately — one school's instance down is still P1. The
  student information system (Edumate) and the payroll system (Aurion) floor at
  **P1**; payment gateways (Tyro, FatZebra, BPay) floor at **P2**, because they
  are vendor-dependent and escalated rather than fixed in-house. Slow/degraded, a
  resolved incident, a holding workaround and a mere mention do not trigger the
  floor.

---

## 8. Workaround

| Value   | Meaning                                                             |
| ------- | ------------------------------------------------------------------- |
| Yes     | A manual or alternative process completes the same business process |
| Partial | It works for some cases or some users                               |
| No      | Nothing can proceed                                                 |
| Unknown | Not stated                                                          |

A workaround **lowers urgency and leaves impact untouched**. Negation is handled:
_"we do not have a workaround"_ reads as **No**. A costly workaround that consumes
material daily effort cannot be treated as Low urgency merely because a path exists.

---

## 9. Deadline

| Bucket             | Typical wording                                       |
| ------------------ | ----------------------------------------------------- |
| Now                | now, immediately, within the hour, in 30 minutes      |
| Today              | today, this morning, by 2pm, end of day, cutoff today |
| Tomorrow           | tomorrow, first thing tomorrow                        |
| 2–5 days           | in three days, before Friday, this week               |
| 1–2 weeks or later | next week, next month, next term                      |
| No deadline        | no rush, whenever, when you get a chance              |
| Unknown            | _nothing in the ticket says_                          |

A referenced time after an observation verb ("today we discovered…") is a
timestamp, not a deadline. "Not needed until next week" is a genuine 1–2 week
deadline.

---

## 10. Critical risk and the safety floor

Risks are flags; a small hard-safety calibration may raise Impact and Urgency
before the matrix. Every rule that fires is listed on the result card.

- **Payroll / financial** — vocabulary alone proves nothing. A same-day
  confirmed processing failure or unpaid people raises Impact and Urgency High.
- **Security / privacy** — sensitive data _context_ is not an incident. _Active_
  exposure (information visible to, sent to, or accessible by the wrong person
  now) raises both to High. "No data breach has occurred" clears the flag.
- **Safety of people** — missing or broken safety-critical information or
  equipment raises Impact to High; if the consequence lands today, Urgency High
  as well.
- **Compliance / safeguarding** — a restriction that is still being breached, or
  an immediate safeguarding risk, raises both to High.
- **Data integrity** — one bad record is remediation; incorrect data actively
  propagating raises Impact and sets a Medium urgency floor, not High by itself.
- **Recoverability** — deletion may be permanent, and a failed backup removes the
  ability to recover. Unrecoverable material loss raises Impact; a usable
  recovery path removes the permanent-loss dimension but not the time pressure.
- **Compromised account / lost device / unapproved consent** — each escalates on
  the active harm already done.

---

## 11. Negation

Keyword matching without negation handling produces confident nonsense. Two
forms are handled, and neither crosses a clause boundary:

| Ticket wording                           | Interpretation                      |
| ---------------------------------------- | ----------------------------------- |
| "Payroll is not affected."               | Payroll risk cleared                |
| "No data breach has occurred."           | Security risk cleared               |
| "Canvas is slow but not unavailable."    | Degradation, not outage             |
| "We do not have a workaround."           | Workaround = No                     |
| "ANZ has not received today's ABA file." | A genuine failure — **not** negated |
| "Canvas is no longer syncing."           | A genuine failure — **not** negated |

---

## 12. Assessment confidence and missing information

Confidence is a qualitative description of how much decision-relevant
information the ticket contains, backed by a heuristic completeness percentage.
It is **not** a probability or a correctness guarantee. It falls when scope,
deadline, workaround, system or symptom are missing, when urgency is asserted
with no consequence, when the request is very short, and when signals conflict.

When the ticket does not contain enough to decide, the tool says so and offers
only the questions that matter, ranked:

1. **Diagnostic** — changes what to do next.
2. **Priority** — answering could move the matrix cell (verified by re-running
   the scoring with each hypothetical answer).
3. **Confidence** — narrows the assessment but keeps the cell.

Follow-up questions are capped at six.

---

## 13. Priority definitions

- **P1 — Critical.** High impact **and** high urgency: a critical operation
  blocked now, serious security or privacy exposure, payroll/payment failure on
  an immediate deadline, broad outage, propagating corruption, or an immediate
  safeguarding risk.
- **P2 — High.** High impact with medium/low urgency, or medium impact with high
  urgency. A corporation-wide outage with a workaround, a major integration
  failure with recovery time left, strategic work affecting all schools.
- **P3 — Normal.** Medium/medium, or low impact with medium/high urgency.
  Routine support, isolated incidents, data remediation, single-school issues.
- **P4 — Low / Backlog.** Documentation, how-to, FYI, cosmetic issues,
  enhancements with no deadline, expected behaviour.

---

## 14. Manual refinement and clarification

The analyst can confirm scope, workaround, business consequence, deadline,
containment, deadline driver, harm timing, critical risks, and override Impact
or Urgency. Decision-relevant answers recalculate the priority immediately, the
card is marked _manually refined_, and confidence rises. Only controls that were
actually changed are treated as overrides. An Impact or Urgency override wins
over every automatic rule.

When a question is Unknown, the intended workflow is to **ask the requester**
(or answer it in the refinement panel) rather than let the tool guess.

---

## 15. Worked examples

| Ticket                                                                                  | Priority |
| --------------------------------------------------------------------------------------- | -------- |
| This is broken but I can work without it for now.                                       | P3       |
| Canvas sync stopped across all 19 schools, today's classes affected.                    | P1       |
| EnrolHQ→Edumate stopped for all schools, manual processing for three days.              | P2       |
| ANZ has not received today's ABA file, payroll processes this afternoon.                | P1       |
| One student missing from Canvas, not needed today.                                      | P4       |
| One student cannot access Canvas, assessment in 30 minutes.                             | P2       |
| 35 casual staff timesheets failed, today's payroll cutoff approaching.                  | P1       |
| I cannot log into my Windows workstation.                                               | P3       |
| Nobody can log into the production server, all integration jobs stopped.                | P1       |
| Laserfiche SSO not working for one user.                                                | P3       |
| Laserfiche SSO failed for every school.                                                 | P2       |
| Laserfiche slow for one user.                                                           | P4       |
| Laserfiche timing out for all schools, users cannot work.                               | P1       |
| Where can I find the Canvas integration documentation?                                  | P4       |
| SSL certificate expires in three days.                                                  | P3       |
| SSL certificate expired this morning, nobody can log in.                                | P1       |
| Local admin rights on my laptop.                                                        | P4       |
| Screen reader cannot use the enrolment form.                                            | P3       |
| Two staff members paid twice.                                                           | P3       |
| Report cards showing the wrong year level, out to parents tomorrow.                     | P2       |
| A student's severe allergy alert is not showing, and the excursion leaves this morning. | P1       |
| Student records are currently visible to the wrong person.                              | P1       |
| A SQL trigger is silently writing incorrect payment records across all schools.         | P2       |
| Canvas sync failed this morning across all schools but it is fixed now.                 | P4       |

A request that states no system, symptom or risk — _"Just reporting an issue"_ —
is **unassessed** and asks which system is affected. A bare feature request with
no named system is treated the same way: the tool would rather ask than score it
as P4.

---

## 16. What this framework is not

- It is not an SLA, a queue, or a routing rule.
- It is not a judgement of the requester.
- It is not a natural-language model. It recognises wording and asks about the
  rest. When it is unsure, it says so — and that is the feature.
