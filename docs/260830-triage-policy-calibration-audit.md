# v0.8.0 Triage Policy Calibration Audit

**Release:** v0.8.0 — Triage Policy Calibration
**Baseline:** v0.7.1 `main` at `1c8af38bbffbf7e818e75a4ef06298c9ec0c3ba6`
**Audit rule:** policy decisions were made from extracted evidence and the
written policy. Corpus labels were not used as the policy source.

## Baseline

- Tests: 796 passed, 0 failed
- Catalogue: 206/206; 0 missing; 0 metadata mismatches; 0 duplicate literal aliases
- Evaluation: 81 cases; 79 assessed; 2 unassessed
- Priority: 65/79 (82.3%)
- Impact: 69/79 (87.3%)
- Urgency: 61/79 (77.2%)
- P1 precision: 14/18 (77.8%); P1 recall: 14/17 (82.4%)
- Under-prioritisation: 4; severe under-prioritisation: 0
- Reviewed mismatches: 7 acceptable ambiguities, 18 deferred policy disagreements
- Engine defects: 0; ground-truth defects: 0; unreviewed mismatches: 0

The complete baseline command was `npm test`. The exact raw output is retained
by the working-tree history and the release report records the final comparison.

## Final v0.8.0 measurement and complete-corpus delta

The same 81-case corpus was rerun after the policy implementation and expectation
updates. The 18 deferred policy disagreements are now resolved by named rules;
the seven acceptable ambiguities remain explicitly reviewed. The semantic facet
labels remain unchanged and every labelled facet remains fully correct.

| Measure | v0.7.1 baseline | v0.8.0 final | Delta |
| --- | ---: | ---: | ---: |
| Behavioural tests | 796 passed | 828 passed | +32 policy/recoverability assertions |
| Catalogue reconciliation | 206/206 | 206/206 | unchanged |
| Assessed cases | 79/81 | 79/81 | unchanged |
| Exact Priority | 65/79 (82.3%) | 75/79 (94.9%) | +10 |
| Impact | 69/79 (87.3%) | 75/79 (94.9%) | +6 |
| Urgency | 61/79 (77.2%) | 74/79 (93.7%) | +13 |
| P1 precision | 14/18 (77.8%) | 14/15 (93.3%) | +15.5pp |
| P1 recall | 14/17 (82.4%) | 14/16 (87.5%) | +5.1pp |
| Under-prioritisation | 4 | 3 | -1 |
| Severe under-prioritisation | 0 | 0 | unchanged |
| Reviewed mismatches | 25 | 7 | -18 |
| Deferred policy mismatches | 18 | 0 | -18 |
| Acceptable ambiguities | 7 | 7 | unchanged |
| Engine / ground-truth defects | 0 / 0 | 0 / 0 | unchanged |
| Unreviewed mismatches | 0 | 0 | unchanged |

The complete-corpus priority confusion changed from 14/18 P1 true positives,
with four P1 false positives, to 14/15 true positives, with one false positive.
Two former P1 propagation outcomes are intentionally P2 because propagation
alone now supplies Medium urgency; same-day confirmed processing failures,
active exposure, and other independent high-urgency evidence retain P1 behavior.

The only remaining mismatches are the seven acceptable ambiguity records listed
in the boundary-review section below. No final P1 depends on requester seniority,
platform category, passive privacy/security/payroll vocabulary, or a bare future
date.

## Audit notation

`I1–I4` means scope, blocked process, irreversibility/risk, and containment.
`U5–U8` means deadline, driver, workaround, and harm timing. `unknown` is a
legitimate extracted state. “Current contribution” summarises the v0.7.1
weighted contribution or modifier that made the disagreement visible.

## Deferred policy disagreements

### `isolated-canvas-can-wait`

- **Ticket:** “Canvas is unavailable for one teacher; classes are not affected and it can wait until next week.”
- **Extracted I1–I4:** individual; blocked process unknown; unavailable; containment unknown.
- **Extracted U5–U8:** weeks-1-2; driver unknown; workaround unknown; harm timing unknown.
- **Risk/modifier evidence:** no risk modifier; explicit wait language.
- **Current I/U/P:** Low / Medium / P3.
- **Current contribution:** active unavailable +1 urgency; future bucket +0.25; v0.7.1 future Medium floor.
- **Policy question:** Does explicit “can wait” override the future-deadline floor?
- **Decision:** Yes. “Can wait” is a soft timing signal; current output becomes Low urgency and P4.
- **Rationale:** The ticket explicitly says the consequence is not affecting classes and action can wait. A date-shaped phrase does not outweigh that statement.
- **Action:** Change policy composition; update the reviewed expected result to Low/Low/P4 under `deadline.soft`.

### `private-data-context`

- **Ticket:** “The fee report contains private student details, but no other ticket evidence describes an exposure.”
- **Extracted I1–I4:** unknown; blocked process unknown; privacy context; containment unknown.
- **Extracted U5–U8:** unknown; unknown; unknown; unknown.
- **Risk/modifier evidence:** privacy=true; exposureActive=false; cross-person=false.
- **Current I/U/P:** Medium / Low / P3.
- **Current contribution:** unknown scope +1; privacy noun +0.75.
- **Policy question:** Should passive private-data context raise Impact by itself?
- **Decision:** No. Passive privacy context is retained as evidence and a follow-up question, but has no standalone level effect.
- **Rationale:** No exposure, disclosure, or consequence is stated.
- **Action:** Change base policy contribution; expected result becomes Low/Low/P4 under `privacy.context`.

### `few-students-paper-copy`

- **Ticket:** “Only two students cannot open the assessment folder; a paper copy is available.”
- **Extracted I1–I4:** few-users; blocked process unknown; unavailable/action blocked; containment unknown.
- **Extracted U5–U8:** unknown; unknown; full workaround; harm timing unknown.
- **Risk/modifier evidence:** no critical risk; paper copy preserves access to the assessment.
- **Current I/U/P:** Medium / Low / P3.
- **Current contribution:** few-users +1; action-blocked symptom +0.75; full workaround -1.25 urgency.
- **Policy question:** Does a full workaround change Impact or only Urgency?
- **Decision:** Only Urgency. Impact remains Medium because the underlying access defect remains; Urgency remains Low because the assessment process can continue.
- **Rationale:** This is the recommended default: workaround changes time sensitivity more readily than consequence.
- **Action:** Expected result becomes Medium/Low/P3; mark the former Low impact/Medium urgency label as a corpus ground-truth disagreement resolved by `workaround.full`.

### `enrolment-spreadsheet-fallback`

- **Ticket:** “EnrolHQ cannot process enrolments for every school, but registrars can use a spreadsheet.”
- **Extracted I1–I4:** all-schools; enrolment processing blocked; unavailable/blocked; containment unknown.
- **Extracted U5–U8:** unknown; unknown; full workaround; harm timing unknown.
- **Risk/modifier evidence:** broad active failure; spreadsheet preserves processing but at operational cost not stated.
- **Current I/U/P:** High / Low / P2.
- **Current contribution:** all-schools +4; blocked process +0.75; full workaround -1.25 urgency.
- **Policy question:** Can a full workaround make a broad blocked process Low urgency?
- **Decision:** No. It lowers pressure, but a broad active blocked process receives a Medium floor.
- **Rationale:** All schools remain dependent on a manual replacement. The P2 result remains High Impact/Medium Urgency.
- **Action:** Change policy composition; expected result remains P2 with Medium urgency under `workaround.full` plus broad active failure.

### `all-school-dashboard-request`

- **Ticket:** “Could you add a dashboard button for all schools before the next term, if possible?”
- **Extracted I1–I4:** all-schools; blocked process unknown; no irreversibility; containment unknown.
- **Extracted U5–U8:** weeks-1-2; preference; workaround unknown; harm timing unknown.
- **Risk/modifier evidence:** feature request; “if possible” explicitly marks a preference.
- **Current I/U/P:** High / Low / P2.
- **Current contribution:** all-schools +4; preference -0.5.
- **Policy question:** Does a soft future preference receive the future Medium floor?
- **Decision:** No. Urgency remains Low; the High Impact + Low Urgency matrix cell is still P2.
- **Rationale:** Broad scope affects consequence, but no blocked process or hard requirement is stated.
- **Action:** No engine priority change; update the expected Urgency from Medium to Low and remove the deferred classification under `deadline.soft`.

### `deleted-list-restorable`

- **Ticket:** “The class list has already been deleted, but it can be restored from last night's backup; teaching resumes tomorrow.”
- **Extracted I1–I4:** unknown; blocked process unknown; data loss active and recoverable; containment unknown.
- **Extracted U5–U8:** tomorrow; driver unknown; workaround/recovery path unknown to v0.7.1; active.
- **Risk/modifier evidence:** deleted data; backup restoration; active loss; teaching resumes tomorrow.
- **Current I/U/P:** Medium / High / P2.
- **Current contribution:** unknown scope +1; data-loss symptom +0.75; recoverability-agnostic deletion +1; tomorrow +1.75; active loss +1.
- **Policy question:** Does recoverability make deletion High Impact?
- **Decision:** No. Recoverable deletion is a material Medium/contextual Impact; the restoration deadline keeps Urgency High.
- **Rationale:** The data is unavailable and the loss is real, but the backup is a recovery path. Time-to-restore still matters.
- **Action:** Add explicit recoverability evidence and retain Medium/High/P2; update the former High Impact expected label under `loss.recoverable`.

### `six-duplicate-payments`

- **Ticket:** “Fee payments are duplicated for five families and finance will process the corrections manually today with the issue contained to these families.”
- **Extracted I1–I4:** few-users; blocked process unknown; confirmed financial/duplicate harm; contained.
- **Extracted U5–U8:** today; driver unknown; full manual correction; harm timing unknown.
- **Risk/modifier evidence:** financial=true; dataIntegrity=true; contained=true; no propagation.
- **Current I/U/P:** High / High / P1.
- **Current contribution:** few-users +1; duplicate +0.5; financial +0.5; data integrity +0.5; today +3; workaround -1.25; same-day financial rule forced High Impact.
- **Policy question:** Should same-day financial topic plus a correction workaround force High Impact?
- **Decision:** No. Confirmed duplicate charges are real Medium-scope harm; containment and manual correction do not erase it. Urgency is High because correction is due today.
- **Rationale:** The ticket states affected families and a corrective process, not broad corruption or unpaid harm.
- **Action:** Remove topic-only same-day High Impact escalation; expected result remains P2 with Medium Impact/High Urgency under `financial.confirmed` and `containment.preserve`.

### `read-only-next-month`

- **Ticket:** “A read-only report can wait until next month; no records are being changed.”
- **Extracted I1–I4:** unknown; blocked process unknown; no irreversibility; containment unknown.
- **Extracted U5–U8:** weeks-1-2; unknown; unknown; harm timing unknown.
- **Risk/modifier evidence:** read-only; explicit wait language; no data change.
- **Current I/U/P:** Low / Medium / P3.
- **Current contribution:** future bucket +0.25 and future Medium floor.
- **Policy question:** Should “can wait” be subordinate to a future date?
- **Decision:** No. Low/Low/P4.
- **Rationale:** The request explicitly denies a near-term business consequence.
- **Action:** Change composition; update expected Urgency to Low under `deadline.soft`.

### `teams-notification-proposal`

- **Ticket:** “This is a proposed change to add Microsoft Teams notifications next semester.”
- **Extracted I1–I4:** unknown; blocked process unknown; no irreversibility; containment unknown.
- **Extracted U5–U8:** weeks-1-2; unknown; unknown; harm timing unknown.
- **Risk/modifier evidence:** proposed feature; no hard requirement or operational consequence.
- **Current I/U/P:** Low / Medium / P3.
- **Current contribution:** bare future bucket +0.25 and future Medium floor.
- **Policy question:** Does a bare future feature date create urgency?
- **Decision:** No. Low/Low/P4.
- **Rationale:** A future target without a requirement is not a deadline.
- **Action:** Change composition; update expected Urgency to Low under `deadline.timestamp`/soft target.

### `contained-family-next-week`

- **Ticket:** “The affected record is contained to one family and the correction can wait until next week.”
- **Extracted I1–I4:** individual; blocked process unknown; consequence unspecified; contained.
- **Extracted U5–U8:** weeks-1-2; unknown; unknown; harm timing unknown.
- **Risk/modifier evidence:** bounded extent; explicit wait language.
- **Current I/U/P:** Low / Medium / P3.
- **Current contribution:** future bucket +0.25 and future Medium floor.
- **Policy question:** Can contained, explicitly deferrable correction remain Low urgency?
- **Decision:** Yes. Low/Low/P4.
- **Rationale:** Containment preserves any existing consequence but there is no stated time-sensitive consequence.
- **Action:** Change composition; update expected Urgency to Low under `containment.preserve` and `deadline.soft`.

### `downstream-payment-propagation`

- **Ticket:** “Incorrect payment records continue to flow into downstream systems for every school.”
- **Extracted I1–I4:** all-schools; blocked process unknown; confirmed incorrect financial data; propagating and recurring.
- **Extracted U5–U8:** unknown; unknown; workaround unknown; harm timing unknown.
- **Risk/modifier evidence:** financial=true; dataIntegrity=true; propagating=true; recurrence=true.
- **Current I/U/P:** High / High / P1.
- **Current contribution:** all-schools +4; incorrect +0.5; recurrence +1; financial +0.5; data integrity +0.5; propagation +1.5; propagation modifier forced High Urgency.
- **Policy question:** Does propagation alone make Urgency High and therefore P1?
- **Decision:** No. Propagation raises urgency to a Medium floor and Impact remains High on the stated all-school extent: P2.
- **Rationale:** The consequence is increasing and deserves priority, but no immediate cutoff, blocked process, or active exposure is stated.
- **Action:** Change propagation composition from High/High to High/Medium under `propagation.active`; retain scope exactly as stated.

### `accessible-phone-process`

- **Ticket:** “The enrolment form's accessibility problem affects one user; a phone process is available.”
- **Extracted I1–I4:** individual; blocked process unknown; accessibility limitation; containment unknown.
- **Extracted U5–U8:** unknown; unknown; full alternative process; harm timing unknown.
- **Risk/modifier evidence:** compliance/accessibility context; phone process preserves enrollment but not equal digital access.
- **Current I/U/P:** Low / Low / P4.
- **Current contribution:** compliance +0.5; full workaround -1.25.
- **Policy question:** Does an accessibility barrier remain time-sensitive when a workaround exists?
- **Decision:** Yes, Medium Urgency but Low Impact: P3.
- **Rationale:** The workaround preserves the business process but not equivalent access; an accessibility obligation should not silently become backlog work. It is not an automatic High.
- **Action:** Add an accessibility policy floor under `safeguarding.pending`/compliance context; expected result remains P3 with Low/Medium.

### `pending-privacy-approval`

- **Ticket:** “No one is currently exposed to the data; the planned change could expose personal information if approved.”
- **Extracted I1–I4:** unknown; blocked process unknown; pending privacy consequence; containment unknown.
- **Extracted U5–U8:** unknown; unknown; workaround unknown; pending.
- **Risk/modifier evidence:** privacy=true; exposureActive=false; explicit current negation; pending conditional exposure.
- **Current I/U/P:** Medium / Low / P3.
- **Current contribution:** unknown scope +1; privacy context +0.75.
- **Policy question:** Should pending privacy harm create active Urgency?
- **Decision:** No. Keep contextual Medium Impact but Low Urgency: P3.
- **Rationale:** The approval gate is a meaningful risk review, but the ticket explicitly says no one is currently exposed.
- **Action:** Keep Impact contextual, remove any implied urgency elevation; update expected Urgency to Low under `harm.pending`.

### `edge-browser-stopgap`

- **Ticket:** “Chrome can be used for Canvas while Edge remains unavailable for two staff.”
- **Extracted I1–I4:** few-users; blocked process unknown; unavailable; containment unknown.
- **Extracted U5–U8:** unknown; unknown; full browser workaround; harm timing unknown.
- **Risk/modifier evidence:** alternative browser completes the stated work; no deadline or blocked consequence.
- **Current I/U/P:** Medium / Low / P3.
- **Current contribution:** few-users +1; unavailable +0.75; full workaround -1.25.
- **Policy question:** Should a full alternative browser lower Impact or only Urgency?
- **Decision:** Only Urgency. Medium Impact/Low Urgency/P3 is policy-correct.
- **Rationale:** The affected application remains unavailable in one supported path, but the business process can continue.
- **Action:** Update expected Impact/Urgency to Medium/Low; remove the deferred disagreement under `workaround.full`.

### `realistic-payroll-success-confirmation-delay`

- **Ticket:** “Payroll completed successfully this morning; finance are only asking whether the casual staff file will be ready before next month's processing cycle.”
- **Extracted I1–I4:** unknown; blocked process unknown; no active financial harm; containment unknown.
- **Extracted U5–U8:** weeks-1-2; driver unknown; workaround unknown; harm timing unknown.
- **Risk/modifier evidence:** successful payroll clears active payroll risk; future readiness is a question.
- **Current I/U/P:** Low / Medium / P3.
- **Current contribution:** future bucket +0.25 and future Medium floor despite successful payroll.
- **Policy question:** Does a future question with no hard driver receive the future floor?
- **Decision:** No. Low/Low/P4.
- **Rationale:** Successful current processing and an uncommitted readiness question do not establish a hard operational deadline.
- **Action:** Change future-floor eligibility; expected result remains Low/Low/P4 under `financial.topic` and `deadline.soft`.

### `realistic-four-records-propagating`

- **Ticket:** “Four new enrolments received duplicate IDs and the same bad IDs are now flowing into the class list and reports. We have not checked the rest of the intake.”
- **Extracted I1–I4:** few-users; blocked process unknown; incorrect data; propagating; extent partly unchecked.
- **Extracted U5–U8:** unknown; unknown; workaround unknown; harm timing unknown.
- **Risk/modifier evidence:** dataIntegrity=true; propagating=true; unknown remaining extent; no deadline.
- **Current I/U/P:** High / High / P1.
- **Current contribution:** few-users +1; duplicate +0.5; integrity +0.5; propagation +1.5; propagation modifier forced High Urgency.
- **Policy question:** Is active propagation by itself sufficient for High Urgency/P1?
- **Decision:** No. Impact is High because the data is actively spreading and the unchecked extent is material; Urgency is Medium without a time-bound consequence: P2.
- **Rationale:** Propagation requires prompt containment, but no same-day business cutoff or active safety/privacy exposure is stated.
- **Action:** Change propagation composition to a Medium urgency floor under `propagation.active`.

### `realistic-casual-import-payroll-cutoff`

- **Ticket:** “The new casual-staff import must be ready before next month's payroll cutoff; this is a required change, not a suggestion.”
- **Extracted I1–I4:** unknown; blocked process unknown; no active harm; containment unknown.
- **Extracted U5–U8:** weeks-1-2; operational; workaround unknown; harm timing unknown.
- **Risk/modifier evidence:** payroll domain; explicit required operational cutoff; no failure or unpaid evidence.
- **Current I/U/P:** Medium / Medium / P3.
- **Current contribution:** unknown scope +1; payroll topic +0.75; hard future bucket +0.25 floor.
- **Policy question:** Does payroll topic alone raise Impact for a future required change?
- **Decision:** No. Low Impact/Medium Urgency/P3.
- **Rationale:** The requirement is real and time-sensitive, but the ticket does not say payroll will fail or anyone will be unpaid.
- **Action:** Remove topic-only payroll Impact contribution; expected result remains P3 with Low/Medium under `financial.topic` and `deadline.hard-future`.

### `realistic-pending-payment-harm`

- **Ticket:** “The certificate will expire before Friday's payroll cutoff and could stop payments then; it is valid today.”
- **Extracted I1–I4:** unknown; blocked process unknown; potential financial consequence; containment unknown.
- **Extracted U5–U8:** days-2-5; operational; workaround unknown; pending.
- **Risk/modifier evidence:** payroll/financial topic; valid today; conditional future payment failure.
- **Current I/U/P:** Medium / Medium / P3.
- **Current contribution:** unknown scope +1; payroll +0.75; financial +0.35; hard future +1.25.
- **Policy question:** Does pending payment risk plus domain vocabulary establish Medium Impact?
- **Decision:** No. Low Impact/Medium Urgency/P3.
- **Rationale:** The credential is valid today and the payment consequence is conditional. The hard cutoff supplies time sensitivity; it does not prove current financial harm.
- **Action:** Remove topic-only payroll/financial Impact contribution; expected result remains P3 with Low/Medium under `harm.pending` and `financial.topic`.

### Additional recoverability calibration

`lost-assessment-submissions` is expected as High Impact / Medium Urgency / P2.
The ticket states that the account cannot be recovered and all assessment
submissions are lost. Under `loss.unrecoverable`, the policy preserves the High
Impact consequence even though the affected scope is individual; the matrix
then determines P2 because no urgent deadline is stated.

## Acceptable ambiguity and boundary review

### `casual-payroll-cutoff`

Missing pay-file production for 42 employees before this afternoon's cutoff
supports High Urgency. The wording implies payroll risk but does not say that
employees are definitely unpaid. The policy therefore keeps Medium Impact/P2
as the conservative engine result and retains P1 as a reviewed alternative.

### `team-pay-run-today`

A payment service outage, no workaround, and a pay run today support High
Urgency. Because the ticket does not state that payment failed or employees are
unpaid, policy keeps Medium Impact/P2; P1 remains a reviewed alternative if the
organisation confirms the pay run is blocked.

### `wrong-guardian-court-order`

Wrong guardian details are being sent broadly and court-order harm is credible,
so Impact is High. The wording says “could affect”, not that an excluded person
has accessed the record or that a deadline is active. Policy keeps Medium
Urgency/P2; P1 is a reviewed alternative if active access or a current breach is
confirmed.

### `realistic-current-narrow-after-broad-history`

The current statement narrows the affected population to one registrar after a
broad historical failure. The broad history must not manufacture current scope.
The current incident is P3; current-morning wording can support Medium or High
Urgency without changing the P3 matrix cell. Retain as a reviewed ambiguity.

### `realistic-login-paper-attendance`

The login failure is active, while paper attendance preserves the process. The
policy default is Medium Impact/Low Urgency/P3. A local team may treat the
manual process as sufficiently costly to use Medium Urgency, but both map to
P3; retain the reviewed alternative rather than invent certainty.

### `realistic-private-report-no-exposure`

Confidential data is present and current cross-person exposure is explicitly
ruled out. Passive privacy context has no standalone score, but the surrounding
report-remediation work can reasonably be treated as Low or Medium Impact and
Low or Medium Urgency; both reviewed outcomes remain P3. The policy requires
the exposure question to remain visible.

### `realistic-browser-workaround-admins`

Chrome completes the enrolment checks for two administrators while Edge is
unavailable. The default is Medium Impact/Low Urgency/P3. A local service may
classify the alternate path as Low Impact/Medium Urgency; both are P3 and the
case remains a reviewed alternative, not an engine defect.

## Audit conclusion

The 18 deferred cases are resolved by explicit rules above. The seven
acceptable-ambiguity cases remain reviewed boundaries where incomplete evidence
supports more than one defensible level, but none requires an unreviewed engine
defect. Final corpus labels and metrics are updated only after the policy tests
and implementation pass.
