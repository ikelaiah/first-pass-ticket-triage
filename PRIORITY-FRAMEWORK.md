# Priority Framework

The canonical description of how First Pass decides what it suggests.

This document is written for humans first. The implementation in `js/engine/` follows
it, and the test suite in `tests/` asserts it.

---

## 1. The core principle

> **Do not classify tickets by how dramatic they sound. Classify them by business
> consequence and time sensitivity.**

Two tickets can contain identical symptoms and deserve completely different priorities:

| Ticket | Priority |
| ------ | -------- |
| "I cannot log into my Windows workstation." | P3 |
| "Nobody can log into the production server and all integration jobs have stopped." | P1 |

Same symptom. Different consequence.

---

## 2. The pipeline

```text
Ticket text
   ↓  normalise (lowercase, expand contractions, unify spelling)
   ↓  split into clauses (. ; ! ? and "but" / "however")
   ↓  match phrase dictionaries, honouring negation
Evidence — 9 signals
   ↓  Scope · Workaround (+daily cost) · Deadline · Symptom · Domain · Risks
   ↓  + Containment · Driver (requirement vs preference) · Harm timing (now vs pending)
   ↓  viewed as 8 Questions — Impact I1–I4 vs Urgency U5–U8
   ↓  I1 Scope  I2 Blocked process (Symptom+Domain)  I3 Wrong/exposed  I4 Contained?
   ↓  U5 When?  U6 Requirement vs preference?  U7 Daily cost?  U8 Now vs pending?
   ↓  weighted scoring
Impact  +  Urgency
   ↓  critical risk modifiers may raise or lower either value
Impact × Urgency
   ↓  the 3×3 matrix — the only place a P number is decided
P1 / P2 / P3 / P4
   ↓
Assessment confidence · Evidence completeness · Reasoning · Missing information · Follow-up questions
```

The natural-language engine **never** assigns a priority directly. If a rule wants a
ticket to be more urgent, it says so by raising urgency, and the matrix does the rest.
This keeps the tool auditable: every priority can be traced to two values and one table.

### Input relevance boundary

Before the matrix result is accepted as a meaningful triage suggestion, the request
must contain at least one recognised support signal: a system, technical symptom,
technical domain, work type, risk, or objective service-management fact such as an SLA
breach.

Scope, time words, and requester-declared priority are deliberately **not** support
signals. They answer useful questions only after the text has established what support
work exists. This means wording such as *"all users, P1, fix now"* cannot turn an
unrelated sentence into an IT incident.

Unrecognised text retains P4 for compatibility with the four-level result model, but it
is marked **unassessed**, receives Low confidence, and asks which IT system,
application, device, or service needs support. P4 in this state means "no valid triage
case was established," not "put this request in the backlog."

---

## 3. The matrix

|                    | Low impact | Medium impact | High impact |
| ------------------ | ---------- | ------------- | ----------- |
| **High urgency**   | P3         | P2            | P1          |
| **Medium urgency** | P3         | P3            | P2          |
| **Low urgency**    | P4         | P3            | P2          |

Note what the table refuses to do:

- High urgency alone never produces P1. A blocked individual is still P3.
- High impact alone never produces P1. A broad outage with no deadline is P2.
- P1 requires **both** — or a critical-risk modifier that legitimately raises both.

---

## 4. The eight questions — Impact vs Urgency

Priority is not judged from a symptom alone. It is judged from eight evidence questions, grouped under the two matrix inputs. The result card surfaces all eight in the **8 Questions — Impact vs Urgency** panel (`js/ui/render-result.js:eightQuestionsPanel`, `js/engine/analyzer.js:eightFacets`), the engine detects each one, and follow-up questions are limited to the unknowns that would actually change the priority.

> **Impact** — how much of the world is affected, and how badly.
> **Urgency** — what happens if we wait.

| # | Question | What it captures | How the engine reads it | Effect on scoring |
|---|---|---|---|---|
| **I1** | Who and how many are affected — one person, a team, a cohort, one school, several, or all 19? | Scope breadth. The largest single impact contributor, and the one most often left out. | `js/engine/scope.js` + `js/data/phrases.js:SCOPE_PHRASES` (`SCOPE_DEFINITIONS` rank 0–8, `impactWeight` 0–4.25). Numbers parsed (`35 casual staff` → team `scope.js:30`, `4 schools` → multiple `scope.js:37`) and broadest credible scope wins. Unknown lowers confidence `js/engine/confidence.js:61`. | Impact weight `js/engine/impact.js:61` +1.75 for `allUsers`. `Unknown → Low confidence` and first follow-up. |
| **I2** | What can they not do right now that they could do yesterday? | The blocked business process, not the symptom. "Canvas is slow" and "teachers cannot mark the roll" are different tickets. | `js/data/phrases.js:BLOCKED_PROCESS_PHRASES` identifies a small process vocabulary and `js/engine/analyzer.js:detectBlockedProcess` returns a sourced consequence fact. Configured system-status consequences in `js/config.js:statusConsequences` remain visibly inferred — for example, an Edumate `public contact` is excluded from class rolls and downstream education-system sync. | An **explicit** or **manual** blocked process adds +0.75 Impact and up to +1.75 Urgency through `impact.js` and `urgency.js`; an impaired process adds +0.25 Impact only. An **inferred** consequence remains explanatory and asks for confirmation, so a potential billing effect is not silently scored as a financial incident. |
| **I3** | Is anything wrong, exposed, lost, or unsafe — as opposed to merely unavailable? | The irreversibility test: bad data, money, privacy, safeguarding, safety. Wrong information is more dangerous than absent information, and this is the question that legitimately makes one affected student a P1. | `js/engine/risks.js` `RISK_DEFINITIONS` (`payroll`, `financial`, `privacy`, `safety`, `safeguarding`, `compliance`, `dataIntegrity`) + risk modifiers (`exposureActive`, `propagating`, `unpaidRisk`) `js/data/phrases.js:RISK_MODIFIERS`. Gated so "contains PII" alone ≠ incident `js/engine/risks.js:111`. | `js/engine/impact.js:121` payroll +0.75, `privacy` +0.75, `exposureActive` +1.5, `safety` +1, etc. `analyzer.js:applyRiskModifiers` may raise Impact and Urgency to High (e.g. active exposure `analyzer.js:256`, safety today `analyzer.js:273`). |
| **I4** | Is it contained, or is it spreading, recurring, or of unknown extent? | One bad record is remediation; a trigger writing bad records across every school is an emergency. Note this raises impact, not urgency — a recurring fault whose known instances are all corrected is high impact and low urgency. | `js/engine/containment.js` + `js/data/phrases.js:CONTAINED_PHRASES` (`contained to one family`, `not spreading`), `RISK_MODIFIERS.propagating` (`propagat`, `spreading` `phrases.js:989`), `RECURRENCE_PHRASES` (`keeps scrambling` `phrases.js:1059`), `UNDETECTED_PHRASES` (`we do not pick up` `phrases.js:1074`). | `js/engine/impact.js:93` recurrence +1, undetected +1.25, propagating +1.5 (impact, not urgency). Contained is informational — panel shows `appears contained`; no numeric discount. A contained recurring fault is P2 latent, not P1 `PRIORITY-FRAMEWORK.md:189`. |
| **U5** | When do you need this by? | The anchor. Everything else calibrates it. | `js/engine/deadline.js` `DEADLINE_BUCKETS` now(6,3.5) › today(5,3) › tomorrow(4,1.75) › 2–5d(3,1.25) › 1–2w(2,0.25) › none › unknown. `COMMITMENT_MARKERS` + `isObservationOnly` `deadline.js:52` separates "Today we discover…" (timestamp) from "must be rerun today" (commitment). | Urgency weight `js/engine/urgency.js:68` (`today` +3, `days-2-5` +1.25). `unknown` lowers confidence `confidence.js:65` and becomes first urgency question. |
| **U6** | What creates the deadline — a requirement or a preference? | What actually happens if missed, and whose rule is it? Statutory (census, NAPLAN), operational (payroll cutoff, class starts, report cards out) is a deadline. "We'd like it by Friday" is a preference with a calendar attached, and scores as one. | `js/engine/driver.js` + `js/data/phrases.js:DRIVER_PHRASES` (`statutory`: census/NAPLAN/nesa, `operational`: payroll cutoff/class starts, `preference`: would like/whenever suits) + `DRIVER_ACTOR_RE` for actor. Refine `index.html:refine-driver`. | Preference reduces urgency −0.5 `js/engine/urgency.js:135`; statutory/operational with timing keeps urgency. Requester seniority scores zero `impact.js:171` — who asked does not decide priority, the event does. |
| **U7** | Can work continue meanwhile — and what does the workaround cost per day? | Existence and sustainability. A workaround that three registrars feed all day is not relief; it is slower failure. | `js/engine/workaround.js` `WORKAROUND_PHRASES` yes/partial/no `phrases.js:212` + `WORKAROUND_COST_PATTERNS` (`three registrars`, `2 hours per day`, `feeding manually` `phrases.js`) → `costPerDay`/`sustainability`. Refine `index.html:refine-workaround`. | `js/engine/urgency.js:25` `yes −1.25 / partial −0.25 / no +1.75` on **urgency only** — impact untouched `PRIORITY-FRAMEWORK.md:275`. Cost displayed in panel/reasoning `analyzer.js:buildReasoning`; not separately weighted beyond existence (avoids FTE math on vague tickets). |
| **U8** | Is the harm happening now, or waiting to happen? | Expired versus expiring. Actively exposed versus wrongly linked but unseen. The line between "attend now" and "schedule properly." | `js/engine/harm-timing.js` generalises `expired-credential` vs `expiring-soon` `phrases.js:282` beyond certificates to any data: `HARM_TIMING_PHRASES` (`currently exposed` → active, `expires in 3 days` → pending) + `ACTIVE_NOW_PHRASES` `phrases.js:135`. Refine `index.html:refine-harm`. | Active exposure / expired credential raises urgency (via symptom severity `urgency.js:82` + modifier `analyzer.js:256`); pending/expiring with future deadline floors urgency to Medium `urgency.js:152` and asks `Is issue still occurring, or has it stopped?`. |

Each row shows a state in the UI: **✓ Answered** (explicit phrase found), **○ Inferred** (derived from symptom/domain/risk), **? Unknown** (no evidence — the follow-up question that would change the priority). Unknown lowers confidence and appears in `Missing information` `js/engine/analyzer.js:buildMissingInformation` capped to six questions.

---

## 5. Impact

Impact answers: **how much of the organisation is affected, and how serious is the
consequence?**

### Low impact

- One user, one student, one record, one report
- Documentation, how-to, cosmetic issues, minor inconvenience
- A simple enhancement with limited consequence

### Medium impact

- Multiple users, a team, a department, a cohort
- One school
- A business function impaired but still functioning
- Significant manual effort, a recurring issue, an important report

### High impact

- Multiple schools, all schools, corporation-wide
- A critical integration or shared pipeline
- Payroll or financial processing
- Security, privacy, safeguarding or compliance exposure
- Widespread bad data, or a broad application outage

### Impact is not scope alone

Scope is the largest single contributor, but never the only one:

> "One employee is about to miss today's pay."

One person — and not Low impact. When a small scope carries a serious, imminent
consequence (pay, an assessment, an enrolment deadline, a legal obligation), impact is
lifted accordingly.

Equally, a request that names a critical system is not automatically High impact:

> "Where can I find the documentation for the Canvas integration?"

Canvas is business-critical. This is still Low impact, because nothing is broken.

---

## 6. Urgency

Urgency answers: **what happens if we wait?**

### Low urgency

*Waiting does not create an immediate unacceptable consequence.*

Wording: "just reporting", "FYI", "please investigate when you get a chance", "no rush",
"we can work without it", "there is a workaround", "not blocking us", "future request",
"enhancement", "documentation", "sometime this week", "not needed immediately".

### Medium urgency

*Business can continue temporarily, but there is an approaching consequence.*

Wording: "need this in 2–5 days", "before Friday", "before next payroll", "before
enrolments close", "manual workaround available", "can continue for now", "becoming
difficult", "accumulating manual work", "this week".

A stated future deadline sets a floor of Medium urgency, even when a workaround is
holding things together — that is exactly the situation Medium describes.

### High urgency

*A serious business consequence is occurring now or is imminent.*

Wording: "need this now", "today", "this morning", "by 2pm", "no workaround", "users
cannot work", "completely blocked", "production stopped", "payroll today", "assessment
today", "class starting", "currently exposed", "active breach", "cutoff today", "data
continuing to propagate".

### Forwarded email chains

A six-line request routinely arrives wrapped in six thousand words of signature
blocks, disclaimers, image references and link wrappers. That packaging is
removed before analysis; the message is not — including quoted earlier messages,
which routinely carry the substance of the request.

Two wording patterns in email chains are read carefully:

- **A time reference after an observation verb is a timestamp, not a deadline.**
  "Today we discover…", "three schools logged this this morning", "he would have
  shown up on the roll this morning" all say when something was *noticed* or
  *supposed*, not when anything is *needed*. Add a commitment marker — "we
  noticed it failed and it must be rerun today" — and it is a deadline again.
- **"As discussed" means the deciding facts are not in the ticket.** It lowers
  confidence and becomes the first follow-up question.

### Recurrence and unknown extent

Two statements change what a ticket *is*, and both raise impact rather than urgency:

| Wording | Meaning |
| ------- | ------- |
| "this keeps scrambling", "continues to throw", "third time this term" | The ticket is about the **pattern**, not the instance. Correcting the record will not stop it, so impact is assessed on the cumulative reach of the fault — and the work type becomes Problem Investigation rather than Incident. |
| "there will be instances that we don't pick up" | The reported cases are a **sample**. The number of affected records is unknown and larger than those raised so far. |

Neither adds urgency. A recurring fault whose every known instance has already
been corrected is High impact and Low urgency — a P2 latent risk, not a P1
emergency.

Note the deliberate exclusion: *"we only found out because a school rang us"*
describes how **this** one surfaced. That is a monitoring gap, not evidence of
unquantified damage still out there.

### Two things that look like drama but are not

The rule against rewarding loud wording has one deliberate exception, and one
near-miss that is deliberately *not* an exception:

- **An SLA breach** adds urgency. "This ticket has breached its SLA" is a measurable
  statement about an agreed commitment, unlike "this is urgent".
- **Escalation** changes nothing. A principal or executive escalating tells you who
  is affected, not what breaks — and this framework is explicit that requester
  seniority does not determine priority. It is reported in the reasoning as
  context, and scores zero. An escalated ticket and an identical un-escalated one
  receive the same priority.

### Asserted urgency is not urgency

Words such as *urgent*, *critical*, *ASAP*, *broken*, *disaster* and *immediately* are
treated as **evidence that the requester is worried**, not as evidence of consequence.

> "URGENT!!! Canvas isn't working!!!"

produces a Medium/Medium assessment, low confidence, and this observation:

> Urgency was asserted in the wording, but no business consequence was stated.
> Asserted urgency alone does not raise priority.

with the follow-up question:

> What is the business consequence if this waits until tomorrow?

The engine distinguishes an **asserted** immediacy ("please fix immediately") from a
**committed** deadline ("must be processed this afternoon"). Only the latter carries
full weight.

---

## 7. Scope

| Scope | Typical wording |
| ----- | --------------- |
| Individual | one user, one student, a staff member, for me, my workstation |
| Few users | several users, a few staff, a handful |
| Team / Department | the registrar team, finance team, the office |
| Cohort | a class, a year group, the cohort |
| One school | our school, School X, one campus |
| Multiple schools | several schools, three schools, multiple sites |
| All schools | all schools, every school, all 19 schools |
| Corporation-wide | corporation-wide, everyone, all staff, the whole organisation |
| Unknown | *nothing in the ticket says* |

Numbers are parsed too: "35 casual staff" is read as a team-sized group, "two staff
members" as a few users, and "4 schools" as multiple schools.

**Unknown stays Unknown.** Scope is never guessed. An unknown scope lowers confidence
and produces the first follow-up question.

When several scopes appear, the broadest credible one wins: "one student reported it,
but all 19 schools are affected" is an all-schools ticket.

**Mentioned is not affected.** A scope named as a comparison is ignored:

> "New starter needs Laserfiche access with the same security group **as the rest of
> the registrar team**."

The registrar team is the reference, not the affected population — this is one
person, so it stays P4 instead of being inflated to a team-wide request.

Two wordings that look alike are also separated: "at Smith School" names one school,
while "no one **at any school** can open their documents" is every school.

---

## 8. Workaround

| Value | Meaning | Typical wording |
| ----- | ------- | --------------- |
| Yes | A manual or alternative process exists | "we can continue", "doing it manually", "temporary process exists", "not blocking us" |
| Partial | It works for some cases or some users | "partial workaround", "only some users", "works sometimes" |
| No | Nothing can proceed | "no workaround", "cannot continue", "completely blocked", "stopped entirely" |
| Unknown | Not stated | — |

A workaround **lowers urgency and leaves impact untouched**. The business is still
affected; it just has more time. This is why "corporation-wide outage with a manual
workaround" is P2 rather than P1.

Negation is handled: *"we do not have a workaround"* is read as **No**, not as **Yes**.

---

## 9. Deadline

| Bucket | Typical wording |
| ------ | --------------- |
| Now | now, immediately, within the hour, in 30 minutes |
| Today | today, this morning, this afternoon, by 2pm, end of day, cutoff today |
| Tomorrow | tomorrow, first thing tomorrow |
| 2–5 days | in three days, before Friday, this week, before next payroll |
| 1–2 weeks or later | next week, next month, next term, before the next enrolment cycle |
| No deadline | no rush, whenever, when you get a chance |
| Unknown | *nothing in the ticket says* |

Two distinctions matter:

1. **Committed vs bare.** "must be processed this afternoon" is a deadline.
   "hasn't appeared this morning" is a timestamp. Only the first is a commitment.
2. **Explicitly not needed.** "does not require Canvas today" removes time references in
   that clause instead of treating them as deadlines, and "not needed until next week"
   is read as a genuine 1–2 week deadline.

---

## 10. Work type

Classified independently of priority: Incident · Service Request · Problem Investigation
· Data Remediation · Feature Request · Enhancement · Project · Documentation / How-To ·
Security / Privacy · Compliance / Safeguarding · Payroll / Financial · Expected
Behaviour · Unknown.

Keeping work type separate from priority is what prevents strategic work from being
permanently parked at P4. A feature request runs through the same matrix as an outage:

> "We need a new feature that will be used by all 19 schools before the next enrolment cycle."

High impact + Medium urgency → **P2**.

---

## 11. Technical domain

Identity / Authentication · Access / Authorisation · Certificates / SSL ·
Application Availability · Application Performance · Windows / Server / Endpoint ·
Integration / API · Scheduled Job / Automation · Database / SQL ·
DevOps / CI-CD · Data Pipeline / Staging · Data Quality / Remediation ·
Documents / Attachments · Reporting / Power BI · Payroll / Finance ·
Licensing / Cost · Backup / Recovery · Academic Operations ·
Security / Privacy · Compliance / Safeguarding · Accessibility ·
Collaboration / Meetings · Email / Notifications · Helpdesk / ITSM ·
Network / Connectivity · Documentation · Feature / Enhancement ·
Project / Change · Vendor / External Dependency · Unknown.

Domain affects routing and explanation, not priority. Where no domain keyword appears,
the domain is inferred from the symptom (a login failure is an identity problem even if
the word "identity" never appears).

---

## 12. Symptom severity

| Severity | Symptoms |
| -------- | -------- |
| Outage | unavailable, cannot log in, stopped, keeps stopping, service down |
| Severe degradation | timing out, takes several minutes, unusably slow |
| Failure | failed, is failing, error, SQL error, scheduled job failed, expired credential, certificate/TLS error, access denied, action blocked, rejected / not accepted, not delivered, capacity exhausted |
| Data issue | missing, not recorded, not created, incorrect, duplicate, corrupt, stale, partial, values reverting (flip-flopping), backlog building, access not revoked, expiring soon |
| Degraded | slow, intermittent |
| Cosmetic | typo, alignment, display glitch |
| None | question, feature request |

Two distinctions carry real weight here:

- **Expired vs expiring.** "The certificate expired this morning and nobody can log in"
  is an outage. "The certificate expires in three days" is a *warning* — a lower
  severity symptom with a real deadline, which lands at P3 rather than P1.
- **A record missing vs a record wrong.** "The advance payment was not recorded"
  is missing data. "The advance payment was recorded against the wrong student"
  is a data-integrity *and* privacy question.

"Slow" is not "outage". The framework distinguishes three performance states:

- **Degraded** — "Laserfiche takes 8 seconds instead of 2"
- **Severely degraded** — "actions take several minutes"
- **Effectively unavailable** — "every request times out and work cannot be completed"

Only the third behaves like an outage.

---

## 13. Critical risk modifiers

Risks are detected as flags, then a small set of rules may raise or lower Impact and
Urgency *before* the matrix runs. Every rule that fires is listed in the result card.

### Payroll / Financial

Evaluated on: how many staff, whether people may be unpaid, the payroll cutoff, whether
manual recovery is possible, and downstream bank processing.

| Situation | Suggested |
| --------- | --------- |
| Payroll question, no deadline | P3 / P4 |
| One payroll record to correct before next week | P3 |
| One employee may miss today's pay | P2 or higher |
| 35 casual staff unpaid unless fixed before today's cutoff | P1 |
| ANZ has not received the ABA file, corporation-wide payroll processes today | P1 |

**Rule:** payroll or payment processing + a same-day deadline + an actual failure →
Impact High and Urgency High.

"Payroll" on its own never means P1. It is deliberately given a modest base weight,
because payroll wording trips both the payroll and the payments dictionaries and
double counting would make every payroll correction a High impact ticket. The
escalation comes from the modifiers — people unpaid, a same-day cutoff — not from
the noun. So "two staff members were paid twice in the last pay run" is P3, while
"35 casual staff will not be paid unless this is fixed before today's cutoff" is P1.

School fee handling runs through the same logic: advance payments, fee balances,
receipts and refunds are payment risks, and a fee payment recorded against the
wrong student is a payment risk *and* a privacy question.

### Security / Privacy

Detected: PII, personal information, breach, exposed data, wrong recipient,
unauthorised access, student/parent/staff data.

**Rule:** *active* exposure — information visible to, sent to, or accessible by the
wrong person right now — raises Impact and Urgency to High.

But "this system contains PII" is a statement of fact, not an incident, and
"no data breach has occurred" clears the flag entirely.

#### Wrong person, two different situations

School data is full of relationships — students to carers, payments to families —
so the engine separates two cases that look similar in a ticket but are not:

| Wording | Interpretation | Effect |
| ------- | -------------- | ------ |
| "some students are linked to another family's parent" | A record is attached to the wrong person | Privacy **flagged**, question asked: *has anyone actually seen it?* |
| "parents can see other families' balances" | Someone is looking at it right now | Privacy flagged **and** the active-exposure escalation applies |

The first is a data error that might become a privacy incident. The second already
is one. Both raise the Privacy flag even when the ticket never uses the word
"privacy" — a wrong carer link, a report card sent to the wrong address, or another
student's photo on a profile are all personal-information problems.

#### Security incidents

Three patterns escalate on their own, because in each the damage is already done or
is being done right now:

| Pattern | Effect |
| ------- | ------ |
| **Account compromise** — clicked a phishing link, entered credentials, suspicious sign-in, impossible travel, a new mailbox forwarding rule | Urgency High: an attacker is active |
| **Lost or stolen device** holding personal information | Impact and Urgency High |
| **Third-party consent granted** — an unapproved app given OAuth access to student data | Impact High: a data-sharing decision nobody approved |

#### Recoverability

Two symptoms are weighted for what they cost to *undo*, not for how severe they sound:

- **Deletion.** Data that has been deleted may simply be gone, so deletion carries
  impact beyond its symptom severity.
- **Backup failure.** Nothing is down, but the ability to recover from the next
  failure has been lost. On a business-critical system this alone is High impact —
  "the nightly Edumate backup has failed for five nights" is **P2** with no outage
  at all.

#### Privileged access

Requests for administrator, local admin, elevated or privileged access raise the
Security flag. This is not an escalation — "I need local admin on my laptop to
install a plugin" is still P4 — it exists so that access grants surface for
approval rather than being processed as routine.

A leaver who still has access after offboarding raises the same flag, and is
usually P3: low impact, but a control failure that should not sit in a backlog.

### Safety of people

A separate flag from safeguarding, because it is about *physical harm* rather than
child-protection obligations: allergies and anaphylaxis, medical alerts and health
care plans, medication, first aid, evacuation alarms, intercom and PA systems,
lockdown and duress, emergency calls, excursions, bus runs and roll calls.

**Rule:** safety-critical information or equipment that is missing, wrong or broken
raises Impact to High. If the consequence lands today — the excursion leaves this
morning, the drill is today — Urgency goes to High as well.

> "A student's severe allergy alert is not showing in Edumate and the excursion
> leaves this morning."

One student, no outage, nothing technically "down" — and a **P1**. This is the clearest
case of why impact cannot be read from scope.

A safety flag on its own does not escalate. "Please add a field to the excursion
consent form" raises the flag and stays P3/P4, because nothing is missing or broken.

### Compliance / Safeguarding

Detected: WWCC, Working With Children Check, safeguarding, compliance, invalid or
expired clearance, unauthorised worker, audit, **and family-law restrictions** —
court orders, parenting orders, custody and non-custodial arrangements, AVOs,
"must not see", "not permitted to access".

**Rule:** where a restriction exists *and* the excluded person still has access, both
Impact and Urgency go to High.

> "A court order says the non-custodial parent must not see the student record, but he
> still has portal access."

**P1** — the legal obligation is being breached right now.

**Rule:** an immediate safeguarding risk (an unauthorised worker on site, an expired
clearance today) raises Impact and Urgency to High. A historical clearance review for an
audit is P2/P3.

### Data integrity

Detected: wrong parent linked, sibling profiles swapped, duplicate profile, bad merge,
mismatched records, corruption, incorrect data, stale downstream data.

The framework distinguishes **one bad record** from **incorrect data actively
propagating across systems**.

**Rule:** data-integrity risk + propagation (across all schools, spreading, silently
writing) + more than one person affected → Impact and Urgency High.

> "SQL trigger failed for one student record." → P3
> "SQL trigger is silently writing incorrect payment records across all schools." → P1

### Decisions made on wrong data

> Incorrect information can be more dangerous than unavailable information.

When wrong figures are about to be used for an approval or a decision — a payroll
reconciliation dashboard showing incorrect totals immediately before payment approval —
impact rises even though nothing is technically "down".

### Critical integration

A shared integration or pipeline contributes to impact only when more than one school,
or every user of a system, depends on it. A pipeline failing for one school is a
one-school problem.

---

## 14. Diagnostic behaviour

Some of what the tool produces is not about priority at all. These four rules
change *what you do next*, and in practice they save more time than the
priority does.

### Missing downstream means check upstream first

Systems have a source of truth, configured in `dataFlows`: Canvas, Seesaw (via
Wonde), SendHQ and Wonde are sourced from **Edumate**; Edumate enrolments come
from **EnrolHQ**; ANZ and Calumo come from **Aurion**. SendHQ has no
customer-side settings — the integration is entirely on the vendor side.

When a record is *missing* from a downstream system — missing, wrong record
type, access denied, not synchronising — the first question becomes whether it
was ever correct upstream:

> "Is the record set up correctly in Edumate, which Canvas is synchronised from?"

together with the warning that matters:

> If the record is missing or incorrect in Edumate, the synchronisation will keep
> excluding it, and a manual change made directly in Canvas may be reversed at
> the next run.

A teacher never assigned the class in Edumate will never appear in Canvas, no
matter how many times the sync runs. Fixing Canvas by hand looks like a
resolution and is not one.

Three gates keep this from becoming noise: it applies only to "not here"
symptoms, never when both systems are already named in the ticket, and only to
flows that carry that kind of record — EnrolHQ carries students, so a missing
*staff* record in Edumate is not asked about EnrolHQ.

**Two real cases show why this matters:**

* **SendHQ/Mail Carers:** *“Update SendHQ to show parents with Mail Carers only from Edumate.”* The requester had never used SendHQ and did not know it has no customer-side settings. A bug on the SendHQ (vendor) side meant it was not reading the data correctly from Edumate. The vendor has since fixed the bug. The tool routes this to **Integration / API → Vendor / External Dependency** (`vendor bug`, `on SendHQ side`, `did not read correctly from Edumate`), suggests P3/P4 (resolved, no same-day block), and still asks the source-of-truth question: *“Is the record correct in Edumate, which SendHQ is synchronised from? If not, the vendor fix will keep reading the wrong source.”* Adding a SendHQ fix downstream would not have persisted. The `SendHQ → Edumate` flow entry is intentionally `critical: false` — a vendor-managed filter bug is not a corporation-wide payroll outage, but it is still a data remediation item.

* **Seesaw SS/JS English:** *“Sync SS English and JS English to Seesaw.”* Neither class is a roll-call class, so neither ever flows Edumate → Wonde → Seesaw (manual entry is the workaround). SS English was not found in Edumate at all — no class name, teachers or students to work with — while JS English was. One working and one failing rules out a system-wide outage; the diagnosis is per-record upstream data. The tool detects `not synchronising` (`never synced from Edumate to Wonde`), `one found / one not` differential → **Problem Investigation** not Incident, and asks *“What is different about the record that failed?”* It also warns that a manual Seesaw entry for a class absent in Edumate has no source to sustain it and may need recreation once the Edumate record is corrected.

### One works and one does not, so it is not the system

When a requester says a comparable record succeeded — "one student's documents
synced correctly, the other's didn't" — a system-wide cause is unlikely. The
difference is in the data.

That changes three things: the work type becomes **Problem Investigation**
rather than Incident, the breadth-of-failure urgency signal is suppressed, and
the leading question becomes *what is different about the record that failed*.

A working control is the single most useful fact a requester can give you.

### Some questions are already answered

Scheduled jobs in the configuration carry a plain-English note. When a ticket
asks a question those keywords match, the answer is shown on the card:

> **What time does the casual staff sync into Canvas?**
> Casual staff are synchronised to Canvas at 09:30 each day.

That is a ticket deflected rather than triaged. Every job you add to
`scheduledJobs` with a note becomes another one.

### A question is not a fault

Scope, deadline and workaround decide an *incident*. A question with no failure
behind it does not depend on them, so their absence is not uncertainty — "this
is a question, therefore P4" is one of the most confident calls the framework
makes, and the card reports it that way rather than at 27%.

Question tickets are also spared the incident interrogation. Asking "what
happens if this is not resolved today?" about "what time does the sync run?" is
noise.

## 15. Expected behaviour

Not every "it hasn't appeared" is an incident.

> "We added a casual staff member at 10am but they haven't appeared in Canvas."

The configured *Casual Staff Canvas Sync* runs at **09:30**. The record was created after
the scheduled run, only a missing-data symptom is present, and nothing indicates a
failure. The engine classifies this as:

- Work type: **Expected Behaviour**
- Impact: Low, Urgency: Low → **P4**
- Explanation: *"The record was created at 10am, after the 09:30 Casual Staff Canvas Sync
  run. There is currently no evidence that the integration failed."*
- Question: *"Is access required before the next scheduled run at 09:30?"*

If the ticket says they need it *now* to teach, the de-escalation does not apply and
urgency rises again.

Scheduled jobs are configured in `js/config.js`, not hard-coded in the engine.

---

## 16. Negation

Keyword matching without negation handling produces confident nonsense. Two forms are
handled, and neither crosses a clause boundary:

| Ticket wording | Interpretation |
| -------------- | -------------- |
| "Payroll is not affected." | Payroll risk cleared |
| "No data breach has occurred." | Security risk cleared |
| "There is no evidence of a data breach." | Security risk cleared |
| "Canvas is slow but not unavailable." | Degradation, not outage |
| "We do not have a workaround." | Workaround = No |
| "ANZ has not received today's ABA file." | A genuine failure — **not** negated |
| "Canvas is no longer syncing." | A genuine failure — **not** negated |

The last two matter most: a negation cue only cancels a phrase when nothing but linking
words sits between them. "has not **received** today's ABA file" keeps its meaning
because "received" breaks the link, and "no **longer**" is recognised as an assertion of
change rather than a negation.

---

## 17. Assessment confidence and evidence completeness

Assessment confidence is a qualitative description of how much decision-relevant
information the ticket actually contains. Evidence completeness is a numeric heuristic
for that coverage. Neither is a probability, a calibrated chance of correctness, or a
guarantee that the suggested priority is right.

Evidence completeness rises when scope, deadline, workaround, system and symptom are
stated, and when a human confirms inputs in the refinement panel.

Evidence completeness falls when:

- scope is unknown
- no deadline or business consequence is given
- workaround availability is unknown
- no system or symptom can be identified
- urgency is asserted with no stated consequence
- the request is very short
- signals conflict ("urgent" alongside a working workaround; high impact with no deadline)

| Assessment confidence band | Heuristic evidence completeness |
| ---- | ----- |
| High | 75%+ |
| Medium | 50–74% |
| Low | below 50% |

The heuristic is capped at 95%. The UI and handoff text label it as heuristic and not a
probability; the tool never claims certainty.

---

## 18. Missing information

When the ticket does not contain enough to decide, the tool says so plainly:

> The impact appears significant, but urgency cannot be determined confidently because no
> deadline or business consequence was provided.

and offers only the questions that are actually relevant:

- Is this affecting one person, one school, several schools or all 19 schools?
- Is there a workaround or manual process available?
- When is this required by? What happens if this is not resolved today?
- Is incorrect information visible to users or being used for decisions?
- Is the issue actively spreading?
- Is a payroll or payment cutoff affected, and when is it?
- Has anyone outside the intended audience actually seen the information?

**A good triage tool knows when it lacks sufficient information.**

### Ranked questions (v0.3.0)

Follow-up questions are capped at six and ranked in three kinds
(`js/engine/analyzer.js:buildMissingInformation`):

1. **Diagnostic** — changes what to do next: missing context ("as discussed"),
   source-of-truth checks, differentials, root cause, unknown extent, batch questions.
   These lead, because in practice they save more time than the priority does (§14).
2. **Priority** — an answer could move the matrix cell. The engine re-runs the full
   scoring with each hypothetical answer (`simulate()`) and tags a question *would
   change priority* only when the simulated P number differs from the current one.
   Example: "When is this required by?" on a High-impact outage, because *today*
   would make it P1.
3. **Confidence/evidence completeness** — narrows the assessment but keeps the cell
   (e.g. workaround daily cost on an active P1 exposure).

The same simulation marks the **key drivers** in the 8-question panel: the one or two
facets whose unknown answer could flip this ticket's cell get a *key driver* badge.
Answered facets never get it — it is a prompt to ask, not a verdict.

### Suggested reply and handoff

The card offers a neutral, audience-agnostic draft reply (`js/ui/reply.js`): what was
understood (I1/U5/I2), the suggested priority in one line, and at most the two
priority-changing questions. It is always labelled *Draft — refine before sending* and
ends with the advisory disclaimer. A markdown slip (`buildMarkdown`) and `.md`
download provide the same facts for ticketing systems. Neither stores nor transmits
anything; the share link (§PRIVACY) is the only channel and carries the ticket in a
`#t=` URL fragment, capped at 2000 characters.

---

## 19. Priority definitions

### P1 — Critical

Immediate attention recommended. High impact *and* high urgency: a critical business
operation is blocked now, serious security or privacy exposure, payroll/payment failure
with an immediate deadline, broad operational outage, data corruption actively
propagating, or an immediate safeguarding risk.

### P2 — High

Significant issue requiring priority attention. High impact with medium or low urgency,
or medium impact with high urgency. A corporation-wide outage with a workaround, a major
integration failure with recovery time remaining, a whole school blocked from a business
process, a payroll problem several days before cutoff, or strategic work affecting all
schools.

### P3 — Normal

Standard operational priority. Medium/medium, or low impact with medium or high urgency.
Routine operational support, isolated incidents, data remediation, single-school issues
where a workaround exists.

### P4 — Low / Backlog

Non-urgent work. Documentation, how-to requests, enhancements with no deadline, FYI,
cosmetic issues, expected system behaviour, and investigations with no meaningful
consequence.

---

## 20. Worked examples

| Ticket | Impact | Urgency | Priority |
| ------ | ------ | ------- | -------- |
| This is broken but I can work without it for now. | Medium | Low | P3 |
| Broken, needed in three days, we can process manually until then. | Medium | Medium | P3 |
| Just reporting an issue. Please investigate when possible. | Low | Low | P4 |
| Canvas sync stopped across all 19 schools, today's classes affected. | High | High | P1 |
| EnrolHQ→Edumate stopped for all schools, manual processing for three days. | High | Medium | P2 |
| ANZ has not received today's ABA file, payroll processes this afternoon. | High | High | P1 |
| One student missing from Canvas, not needed today. | Low | Low | P4 |
| One student cannot access Canvas, assessment in 30 minutes. | Medium | High | P2 |
| Casual staff member added at 10am, hasn't appeared in Canvas. | Low | Low | P4 |
| 35 casual staff timesheets failed, today's payroll cutoff approaching. | High | High | P1 |
| Entra ID token expired, Canvas sync stopped for all schools. | High | Medium | P2 |
| I cannot log into my Windows workstation. | Low | Medium | P3 |
| Nobody can log into the production server, all integration jobs stopped. | High | High | P1 |
| Laserfiche SSO not working for one user. | Low | Medium | P3 |
| Laserfiche SSO failed for every school. | High | Medium | P2 |
| Laserfiche SQL conversion error, one user needs it next week. | Low | Medium | P3 |
| Laserfiche not writing to staging for all schools since midnight. | High | Medium | P2 |
| Laserfiche slow for one user. | Low | Low | P4 |
| Laserfiche timing out for all schools, users cannot work. | High | High | P1 |
| Power BI refresh failed, yesterday's report available, needed next week. | Medium | Medium | P3 |
| Payroll dashboard showing incorrect totals before payment approval. | High | High | P1 |
| SQL trigger failed for one student record. | Low | Medium | P3 |
| SQL trigger silently writing incorrect payment records across all schools. | High | High | P1 |
| Where can I find the Canvas integration documentation? | Low | Low | P4 |
| New feature for all 19 schools before the next enrolment cycle. | High | Medium | P2 |

### School systems sweep

| Ticket | Priority | What decided it |
| ------ | -------- | --------------- |
| Registrar cannot see the Laserfiche enrolment repository, access level looks wrong | P3 | Access issue, one person |
| Increase my Laserfiche access level | P4 | Service request, no consequence |
| New starter needs the same access as the registrar team | P4 | The team is a comparison, not the scope |
| Laserfiche backend service keeps stopping, workflow tasks queuing | P3 | Outage symptom, scope unknown |
| Laserfiche workflow failing on the back end for all schools | P2 | All schools, no stated deadline |
| SSL certificate expires in three days | P3 | Expiring, not expired; real deadline |
| SSL certificate expired this morning, nobody can log in | P1 | Outage for every user, now |
| Local admin rights on my laptop | P4 | Security flagged for approval, not escalated |
| Leaver still has access after offboarding | P3 | Control failure, security flagged |
| Screen reader cannot use the enrolment form | P3 | One person, compliance obligation |
| Duplicate student records from the EnrolHQ sync | P3 | Data integrity, contained |
| Students flip-flopping between two campuses each sync | P2 | Recurring corruption across schools |
| Incorrect carers synced, students linked to another family | P3 | Privacy flagged, exposure not confirmed |
| Advance payment not recorded against the student | P3 | Missing data, payment risk |
| Advance payments on the wrong students, parents can see other families' balances | P1 | Active exposure |
| Two staff members paid twice | P3 | Payroll correction, nobody unpaid |
| Superannuation not lodged, deadline next Tuesday | P3 | Statutory deadline, days away |
| Report cards showing the wrong year level, out to parents tomorrow | P2 | Cohort, wrong data, hard deadline |
| NAPLAN sessions start at 9am, student list has not loaded | P2 | Cohort blocked, same-day statutory event |
| Seesaw accounts missing for Kindergarten, classes start tomorrow | P2 | Cohort, deadline, no workaround |
| Canvas courses for term 3 not created for any school | P2 | All schools, no stated deadline |
| Parent emails not delivered, 4000 queued | P3 | Delivery failure, scope unknown |
| Archive the 2019 records when you have time | P4 | No consequence, no deadline |
| Update SendHQ to show Mail Carers only (vendor bug, now fixed) | P3/P4 | Vendor-side integration, no customer settings, data not read correctly from Edumate — now resolved |
| Sync SS/JS English to Seesaw — non-roll-call never flows Edumate→Wonde→Seesaw; SS English absent in Edumate | P3/P4 | Source-of-truth gap; manual Seesaw entry is workaround, but no source data for SS English to add |
| Helpdesk is down — ticketing system for IT/Payroll/schools, restored after admin restarted server | P2/P3 | ITSM outage, corporation-wide scope but not payroll/teaching blocker; admin fix is recovery not user workaround — P1 only if still blocking payroll cutoff or live incident |
| Newsletter automation for a school is down — PowerAutomate (SIS/Edumate) → SharePoint news, 2 months wider community missed, slow fix in progress | P2/P3 | One school, but long outage with community-wide visibility gap; no system named initially — hidden dependency; P2 for duration/impact, P3 if workaround via SIS-only view is tolerated |
| How do I add a task in Azure DevOps User Story? (brief instruction given) | P4 | Documentation/how-to, devops-cicd domain; no failure — P4 even though Azure DevOps is in the text |
| Retrieve person info urgently for risk team — python script lookup | P2/P3 | Service request, individual scope, urgency via “urgently for risk team”, scripting-terminal domain; P2 if today deadline, P3 if next days |
| Statement of Service table outdated — update from files, database trigger sync | P3/P4 | Data remediation, reference table refresh via files + trigger updates; small scope, no data loss — P3/P4 |
| Clipboard timesheet uploaded in SharePoint — extracurricular CSV import for payroll | P2/P3 | Payroll-adjacent (extracurricular), SharePoint CSV → Clipboard → Aurion/Ascender; cryptic request needs multi-step import; P3 without stated cutoff, P2 if “get paid on time” implies today/fortnightly cutoff and manual steps have no workaround |

### Wonde, Azure DevOps, Teams and databases

The same two questions — how much is affected, how soon does it bite — produce a full
P1–P4 spread inside every platform:

| Ticket | Priority |
| ------ | -------- |
| Wonde has stopped sharing data with all 19 schools, today's Canvas rostering has stopped | P1 |
| Wonde revoked for three schools, registrars entering changes manually for a few days | P2 |
| One school's Wonde approval still pending, their new students missing from Seesaw | P3 |
| SS/JS English not roll-call — never synced Edumate→Wonde→Seesaw, manual Seesaw entry only | P3/P4 |
| SendHQ Mail Carers not read correctly from Edumate — vendor bug, no customer-side settings (now fixed) | P3/P4 |
| Newsletter automation down — PowerAutomate reading SIS → SharePoint news, 2 months, wider community missed, slow fix | P2/P3 |
| Clipboard timesheet in SharePoint — extracurricular CSV import to payroll (Clipboard) | P2/P3 |
| Document how the Wonde approval process works | P4 |
| Release pipeline deployed a broken build to production, enrolment API returning 500s for all schools | P1 |
| All Azure DevOps pipelines failing on an expired service connection, payroll fix due Friday | P2 |
| Pull request blocked by a branch policy needing a reviewer who has left | P3 |
| Add an Azure Boards query for the integration backlog, when you get a chance | P4 |
| Teams unavailable corporation-wide, today's parent-teacher interviews cannot run | P1 |
| Teams class teams not created at any school, lessons start next Monday | P2 |
| One teacher cannot join Teams meetings, audio fails | P3 |
| Set up a Teams channel for the integration project, no rush | P4 |
| DB2 locked, all Aurion payroll extracts failed, pay run due this afternoon | P1 |
| PostgreSQL replication lag at six hours, all-school reporting warehouse stale | P2 |
| PostgreSQL "relation does not exist" on one finance report | P3 |
| SQLite kiosk database logging a warning, no user impact | P4 |

Three engine behaviours are visible in that table:

- **A regression carries its own urgency.** A build that *we* deployed and that broke
  production is more urgent than the same symptom with an unknown cause, because the
  cause is known and waiting compounds it.
- **Never-created is not an outage.** Class teams missing across every school is High
  impact, but the urgency comes from when lessons start — not from the breadth.
- **Platform breadth is impact, not urgency.** "All pipelines are failing" means nothing
  can ship (High impact); whether that is urgent still depends on what is waiting to ship.

Each of these is asserted in `tests/tests.js`. Where the framework legitimately allows a
range, the test accepts the range rather than pretending there is one right answer.

---

## 21. Manual refinement

The analyst can confirm any of scope, business consequence, workaround, deadline,
containment, deadline driver, harm timing, impact, urgency and the critical-risk flags. Decision-relevant
answers recalculate the priority immediately, the card is marked *Manually refined*,
and confidence rises because a human has supplied the facts.

Only controls that have actually been changed are treated as overrides, so a detected
value is never silently promoted to a confirmed one.

An impact or urgency override wins over every automatic rule — the analyst has the last
word, and the tool records that they took it.

---

## 22. What this framework is not

- It is not an SLA. Response and resolution targets are a separate, local decision.
- It is not a queue. It suggests a priority; it does not assign, route or escalate.
- It is not a judgement of the requester. "Asserted urgency" is a description of
  wording, not a criticism of the person who wrote it.
- It is not infallible. When it is unsure, it says so — and that is the feature.

## 23. External calibration

The framework was compared with public, first-party IT service-management guidance on
27 August 2026. The sources use different priority counts and response targets, so the
tool adopts their decision concepts rather than copying their numeric matrices.

- [Atlassian: impact and urgency calculate priority](https://support.atlassian.com/jira-service-management-cloud/docs/how-impact-and-urgency-are-used-to-calculate-priority/)
  supports the core separation: impact measures business-process effect; urgency
  measures time until significant impact.
- [Atlassian: ITSM work categories](https://support.atlassian.com/jira-service-management-cloud/docs/what-are-ticket-categories/)
  distinguishes information/access/new-item service requests, unplanned service
  incidents, and recurring underlying problems. This informed the how-to, installation,
  incident, and recurrence tests.
- [Atlassian: major incidents](https://support.atlassian.com/jira-service-management-cloud/docs/what-are-major-incidents/)
  ties major-incident handling to significant business disruption, a critical service,
  or a defined affected-user threshold—not to dramatic wording.
- [Charles Darwin University MSLA](https://www.cdu.edu.au/files/2025-06/msla.pdf)
  provides concrete calibration cases: complete network failure, a critical email
  failure, a team printer fault with another printer available, an individual browser
  fault with an alternative browser, and software/setup service requests.
- [Deakin University IT Help prioritisation](https://help.deakin.edu.au/ithelp?id=it_kb_article&sysparm_article=KB0011360)
  reinforces breadth, business criticality, sustainable workarounds, data loss, and
  regulatory consequence as separate impact/urgency inputs.
- [University of Newcastle security incident guidelines](https://policies.newcastle.edu.au/document/view-current.php?id=258&version=2)
  reinforces that security escalation depends on confirmed or potential harm to
  confidentiality, integrity, or availability; a security noun alone is not proof of a
  major incident.

These comparisons support the existing architecture and matrix discipline. They also
exposed parsing gaps now covered by tests: plural *"crashes,"* conditional
*"whenever"* versus *"whenever you can,"* Mac how-to wording, installation requests,
alternative-device workarounds, and unrelated text containing fake priority claims.

---

## 24. Current decision context (v0.4.0)

Priority is calculated from the current asserted situation, not every incident-shaped
sentence in a pasted thread. Before evidence detection, strong explicit cues classify
the text as active/unspecified, resolved, or planned/test:

- A current resolution supersedes an older failure description.
- Quoted earlier messages are retained as context but excluded from scoring.
- Simulations, disaster-recovery exercises, design requirements and explicit test cases
  do not count as live incidents.
- A later explicit recurrence (for example, *"fixed this morning but down again"*)
  reopens the incident and is scored normally.

Ambiguous wording is not discarded. Without a strong inactive cue, the engine keeps the
text in the active/unspecified path and asks the analyst to confirm missing facts.

## 25. Assessment status and measured accuracy (v0.4.0)

An analysis now separates the internal matrix result from the actionable suggestion:

- `assessmentStatus: "assessed"` carries `suggestedPriority: "P1"` through `"P4"`.
- `assessmentStatus: "unassessed"` carries `suggestedPriority: null`.
- `priority` remains the internal matrix result for compatibility and explanation; it
  must not be treated as an actionable suggestion when the status is unassessed.

The offline evaluator accepts independently labelled JSON fixtures and reports exact
priority accuracy, impact and urgency accuracy, assessed coverage, P1 precision and
recall, any under-prioritisation, severe under-prioritisation (two or more priority
levels), P1 false negatives and false positives, abstentions, and a confusion matrix.
An abstention on a labelled assessed case is counted conservatively below P4 for the
under-prioritisation metrics. Mismatch reports identify only a case ID and
expected/actual facts; they never print ticket text or other ticket content. The
checked-in corpus is a schema example and regression gate, not evidence of production
accuracy. Meaningful calibration requires anonymised historical tickets labelled by
independent triagers and a holdout set that is not used to tune weights.

## 26. Business consequence and facet calibration (v0.4.1)

I2 is now an explicit evidence fact rather than a display-only phrase. It records a
level (`unknown`, `impaired`, or `blocked`), the named process where wording supports
one, the evidence quote, and its provenance:

- **Explicit**: the requester states a process such as attendance marking, enrolment,
  payroll/payment, teaching, emergency communication, or reporting cannot continue.
- **Inferred**: a configured system status has a known operational implication. It is
  visible in the result but does not change impact or urgency automatically.
- **Manual**: the analyst confirms the consequence using the refinement panel. It is
  recorded in the printed result and feeds the same scoring path as explicit wording.
- **Unknown**: a technical symptom does not itself prove a business consequence.

An explicit or manual `blocked` fact contributes to both impact and urgency through
the existing models; `impaired` makes only a small impact contribution. Neither fact
emits a priority—the unchanged matrix remains the sole P1–P4 decision point. This
means “Canvas is slow” remains a symptom, while “all schools cannot mark the roll in
Canvas today” states a business consequence.

The offline evaluator can optionally label and score each decision fact independently:
scope, consequence, deadline, deadline driver, workaround, and containment. Its
checked-in examples are synthetic plumbing tests, not a field-accuracy claim. Weight
calibration requires an approved, anonymised, independently labelled corpus and a
holdout set.

## 27. Release boundary notes (v0.5.0)

- Share links use `#t=` fragments, capped at 2000 characters. Legacy `?t=` links are
  accepted once and removed from the address bar after reading.
- Expected-behaviour scheduling is deliberately conservative: a clock time matters
  only when it is grammatically attached to a supported record creation/update event;
  unrelated meetings, access windows, reports, past dates and hypothetical text do not
  silently de-escalate an active incident.
- `priorityFor(impact, urgency)` is the raw matrix helper and validates both inputs.
  An actionable result requires `assessmentStatus: "assessed"` and a non-null
  `suggestedPriority`; the internal matrix cell is retained for explanation only when
  the engine abstains.
- Priority and queue state are separate concepts. This release has no queue workflow;
  a future queue state must not silently change impact or urgency, and ticket age must
  not silently escalate priority.
