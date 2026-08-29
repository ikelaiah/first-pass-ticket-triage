# v0.7.0 — Eight-Facet NLP Robustness Hardening

This is the final release-readiness report for v0.7.0. The initial audit snapshot below was captured before remediation; the current remediation, release-gate, and post-release verification results are recorded below. v0.7.0 has since been released successfully.

> Historical readiness gate: implementation, offline comparison, and local browser/runtime checks were clean when this report was written. The completed post-release verification is recorded at the end.

## Initial audit snapshot: baseline and aggregate comparison

The temporary v0.6.1 archive passed:

```text
532 passed
0 failed
```

The original eight-case evaluation corpus was 100% correct under v0.6.1.

| Metric | v0.6.1 | v0.7.0 pre-remediation |
|---|---:|---:|
| Evaluation cases | 57 | 57 |
| Priority | 37/55 | 40/55 |
| Impact | 40/55 | 44/55 |
| Urgency | 42/55 | 40/55 |
| P1 precision | 76.9% | 78.6% |
| P1 recall | 71.4% | 78.6% |
| Under-prioritisation | 7 | 5 |
| Severe under-prioritisation | 2 | 1 |
| P1 false negatives | 4 | 3 |
| P1 false positives | 3 | 3 |
| Assessment status | 57/57 | 57/57 |

The pre-remediation tree passed `744 passed, 0 failed`, with catalogue reconciliation at 206/206.

## Why facet accuracy and outcome accuracy differ

The eight facet metrics measure only explicitly labelled semantic fields. They do not assert that Impact and Urgency must be derived from those eight values alone.

Current denominators:

| Field | Correct / labelled |
|---|---:|
| Assessment status | 57/57 |
| Assessed cases | 55/55 |
| Unassessed cases | 2/2 |
| I1 | 31/31 |
| I2 | 7/7 |
| I3 | 20/20 |
| I4 | 9/9 |
| U5 | 26/26 |
| U6 | 15/15 |
| U7 | 10/10 |
| U8 | 14/14 |
| Impact | 44/55 |
| Urgency | 40/55 |
| Priority | 40/55 |

The corpus has no separate expected `riskModifiers`, `symptom`, `domain`, or `workType` labels.

Impact/Urgency additionally use:

- technical symptom severity;
- critical-system configuration;
- risk flags and modifiers;
- recurrence and unknown extent;
- blocked-process evidence;
- data-loss/recoverability;
- work-type and decision context;
- workaround effects;
- future-deadline floors;
- explicit low-urgency or preference wording.

Examples:

- `administrator-account-compromise` has correct I1, I3, and U8 labels, but misses the active-exposure modifier, leaving Impact/Urgency too low.
- `pending-privacy-approval` correctly identifies privacy-context and pending harm, but pending harm does not itself create urgency under current policy.
- `six-duplicate-payments` has correct semantic facets, but financial plus data-integrity evidence raises Impact under the existing scoring rules.
- `resolved-outage-context` has no active facet evidence, but the context detector fails to recognise “previously resolved”.

## Pre-remediation mismatch audit

Facet vectors use this order:

```text
I1 / I2 / I3 / I4 / U5 / U6 / U7 / U8
```

`—` means the corpus did not label that field.

### Impact, urgency, or priority mismatches

1. `casual-payroll-cutoff` — “The casual staff payroll file was not produced for 42 employees and the payroll cutoff is this afternoon.”

   - Expected: `team / — / financial-harm / — / today / operational / — / —`; Impact/ Urgency/Priority `high/high/P1`.
   - Actual: `team / unknown / financial-harm / unknown / today / operational / unknown / unknown`; risk `payroll`; symptom `unknown`; domain `payroll-finance`; work type `payroll-financial`; `medium/high/P2`.
   - Contributions: team scope and payroll involvement.
   - Classification: impact-scoring consequence plus ambiguous ground truth. The ticket does not explicitly say employees will be unpaid, although that is a reasonable inference.

2. `isolated-canvas-can-wait` — “Canvas is unavailable for one teacher; classes are not affected and it can wait until next week.”

   - Expected: `individual / — / unavailable / — / weeks-1-2 / — / — / —`; `low/low/P4`.
   - Actual: `individual / unknown / unavailable / unknown / weeks-1-2 / unknown / unknown / unknown`; symptom `unavailable`; `low/medium/P3`.
   - Contributions: active unavailable symptom and future deadline.
   - Classification: urgency-policy/evaluation-label issue. Current policy floors a genuine future deadline at Medium unless it is explicitly a preference or no-deadline case.

3. `multi-school-attendance-block` — “Canvas is unavailable across several schools and teachers cannot mark attendance.”

   - Expected: `multiple-schools / blocked / unavailable / — / — / — / — / —`; `high/high/P2`.
   - Actual: `multiple-schools / blocked / unavailable / unknown / unknown / unknown / unknown / unknown`; explicit attendance-blocked process; `high/high/P1`.
   - Contributions: multiple-school scope, unavailable symptom, blocked process, broad failure.
   - Classification: evaluation-label problem. The expected `high/high` values map to P1 under the unchanged matrix.

4. `private-data-context` — “The fee report contains private student details, but no other ticket evidence describes an exposure.”

   - Expected: I3 `privacy-context`; `low/low/P3`.
   - Actual: I3 `privacy-context`; risk `privacy`; domain `reporting-bi`; `medium/low/P3`.
   - Contributions: unknown scope and personal-information involvement.
   - Classification: impact-policy/evaluation-label issue.

5. `few-students-paper-copy` — “Only two students cannot open the assessment folder; a paper copy is available.”

   - Expected: I1 `few-users`, U7 `yes`; `low/medium/P3`.
   - Actual: same labelled facets; symptom `action-blocked`; domain `academic-ops`; `medium/low/P3`.
   - Contributions: few-user scope, action-blocked symptom, functioning workaround.
   - Classification: impact/urgency label disagreement. Existing policy lowers urgency for a workaround but does not lower impact.

6. `enrolment-spreadsheet-fallback` — “EnrolHQ cannot process enrolments for every school, but registrars can use a spreadsheet.”

   - Expected: `all-schools / blocked / — / — / — / — / yes / —`; `high/medium/P2`.
   - Actual: same labelled facets; `high/low/P2`.
   - Contributions: broad scope, blocked process, functioning workaround.
   - Classification: urgency-policy/evaluation-label issue.

7. `team-pay-run-today` — “The payment service is down for the finance team, there is no workaround, and the pay run is due today.”

   - Expected: I1 `team`, U5 `today`, U6 `operational`, U7 `no`; `medium/high/P2`.
   - Actual: I3 `financial-harm`; risks `payroll, financial`; symptom `unavailable`; `high/high/P1`.
   - Contributions: team scope, unavailable payment service, payroll/financial risks, no workaround, today deadline.
   - Classification: ambiguous ground truth and impact-policy review. P1 is defensible under current policy, but the text does not explicitly say payments will fail or staff will be unpaid.

8. `all-school-dashboard-request` — “Could you add a dashboard button for all schools before the next term, if possible?”

   - Expected: I1 `all-schools`, U5 `weeks-1-2`, U6 `preference`; `high/medium/P2`.
   - Actual: same labelled facets; `high/low/P2`.
   - Contributions: preference driver suppresses deadline urgency.
   - Classification: urgency-policy/evaluation-label issue.

9. `resolved-outage-context` — “The previously resolved Canvas outage is included for context; no action is required.”

   - Expected: U8 `unknown`; `low/low/P4`.
   - Actual: I3 `unavailable`; symptom `unavailable`; domain `application-availability`; work type `incident`; `medium/medium/P3`.
   - Contributions: unknown scope, unavailable symptom, critical-system configuration, active symptom urgency.
   - Classification: pre-existing composition/context problem. “Previously resolved” and “no action is required” are not recognised as a resolved current state.

10. `deleted-list-restorable` — “The class list has already been deleted, but it can be restored from last night's backup; teaching resumes tomorrow.”

   - Expected: I3 `lost-data`, U5 `tomorrow`, U8 `active`; `high/high/P2`.
   - Actual: same labelled facets; symptom `data-loss`; domain `academic-ops`; `medium/high/P2`.
   - Contributions: unknown scope, deletion/recoverability, data-loss symptom, tomorrow deadline.
   - Classification: impact-policy/evaluation-label issue.

11. `administrator-account-compromise` — “A suspicious sign-in compromised one staff account; unauthorised access is happening now and has not been revoked.”

   - Expected: `individual / — / security-compromise / — / — / — / — / active`; `high/high/P1`.
   - Actual: `individual / unknown / security-compromise / unknown / now / unknown / unknown / active`; risk `security`; symptom `access-not-revoked`; domain `security-privacy`; `low/medium/P3`.
   - Contributions: security concern and active access-not-revoked symptom; no `exposureActive` modifier.
   - Classification: risk/modifier problem and current P1 false negative. This is the clearest engine weakness found.

12. `six-duplicate-payments` — “Fee payments are duplicated for five families and finance will process the corrections manually today with the issue contained to these families.”

   - Expected: `few-users / — / financial-harm / contained / today / — / yes / —`; `medium/high/P2`.
   - Actual: same labelled facets; risks `financial,dataIntegrity`; symptom `duplicate-data`; `high/high/P1`.
   - Contributions: five-family scope, duplicate-data symptom, financial and data-integrity evidence, same-day deadline, workaround.
   - Classification: evaluation-label/policy issue. Containment and workaround do not reduce Impact under the established policy.

13. `pay-date-question` — “Staff are still paid correctly; this is a question about next month's pay date.”

   - Expected: U8 `unknown`; `low/low/P4`.
   - Actual: I3 `financial-harm`; risk `payroll`; U5 `weeks-1-2`; `medium/medium/P3`.
   - Contributions: unknown scope, payroll noun, future date.
   - Classification: risk/intent extraction problem. Explicitly correct payroll is being treated as active payroll risk.

14. `resolved-privacy-review` — “A privacy breach was reported yesterday and access was removed; please document the review.”

   - Expected: I3 `privacy-context`, U8 `unknown`; `low/low/P4`.
   - Actual: I3 `privacy-context`; risks `privacy,security`; domain `security-privacy`; `medium/low/P3`.
   - Contributions: unknown scope, privacy and security risk nouns.
   - Classification: pre-existing composition/context problem. “Access was removed” is not matched by the current resolution grammar.

15. `wrong-guardian-court-order` — “Wrong guardian details are being sent to all schools and could affect court orders.”

   - Expected: `all-schools / — / safeguarding / unknown / — / — / — / —`; `high/high/P1`.
   - Actual: `all-schools / unknown / safeguarding / unknown / unknown / unknown / unknown / unknown`; risks `privacy,safeguarding,dataIntegrity`; modifier `crossPersonLink`; symptom `incorrect-data`; `high/medium/P2`.
   - Contributions: all-school scope, safeguarding, privacy, incorrect data.
   - Classification: ambiguous/evaluation-label issue. “Could affect” is hypothetical and no deadline or active safeguarding consequence is stated.

16. `read-only-next-month` — “A read-only report can wait until next month; no records are being changed.”

   - Expected: U5 `weeks-1-2`; `low/low/P4`.
   - Actual: symptom `missing-data`; domain `reporting-bi`; `low/medium/P3`.
   - Contributions: unknown scope, incorrectly detected missing-data symptom, future deadline.
   - Classification: symptom-extraction plus urgency-policy problem.

17. `teams-notification-proposal` — “This is a proposed change to add Microsoft Teams notifications next semester.”

   - Expected: U5 `weeks-1-2`, U6 `unknown`; `low/low/P4`.
   - Actual: same labelled facets; domain `collaboration`; `low/medium/P3`.
   - Contributions: future deadline floor.
   - Classification: evaluation-label/policy issue for a low-urgency feature proposal.

18. `contained-family-next-week` — “The affected record is contained to one family and the correction can wait until next week.”

   - Expected: I1 `individual`, I4 `contained`, U5 `weeks-1-2`; `low/low/P4`.
   - Actual: same labelled facets; `low/medium/P3`.
   - Contributions: future deadline floor.
   - Classification: urgency-policy/evaluation-label issue.

19. `downstream-payment-propagation` — “Incorrect payment records continue to flow into downstream systems for every school.”

   - Expected: `all-schools / — / financial-harm / spreading / — / — / — / —`; `high/medium/P1`.
   - Actual: same canonical facets; risks `financial,dataIntegrity`; modifier `propagating`; symptom `incorrect-data`; `high/high/P1`.
   - Contributions: broad scope, propagation, recurrence, active incorrect-data symptom.
   - Classification: pre-existing urgency-policy/evaluation-label issue.

20. `accessible-phone-process` — “The enrolment form's accessibility problem affects one user; a phone process is available.”

   - Expected: I1 `individual`, U7 `yes`; `low/medium/P3`.
   - Actual: same labelled facets; risk `compliance`; domain `accessibility`; `low/low/P4`.
   - Contributions: compliance obligation and functioning workaround.
   - Classification: evaluation-label/policy issue.

21. `pending-privacy-approval` — “No one is currently exposed to the data; the planned change could expose personal information if approved.”

   - Expected: I3 `privacy-context`, U8 `pending`; `medium/medium/P3`.
   - Actual: same canonical facets; risk `privacy`; no active modifier; `medium/low/P3`.
   - Contributions: unknown scope, privacy context, a stray “issue is happening now” contribution from the negated “currently exposed” clause.
   - Classification: risk/negation problem plus label review. The current P3 is preferable to the v0.6.1 P1, but the urgency contribution should be investigated.

22. `lost-assessment-submissions` — “A student account was deleted and cannot be recovered; all assessment submissions are lost.”

   - Expected: I1 `individual`, I3 `lost-data`, U8 `active`; `medium/medium/P2`.
   - Actual: same labelled facets; symptom `data-loss`; `medium/medium/P3`.
   - Contributions: data-loss evidence only; medium/medium maps to P3.
   - Classification: evaluation-label problem unless the corpus intends unrecoverable assessment loss to be High Impact.

23. `edge-browser-stopgap` — “Chrome can be used for Canvas while Edge remains unavailable for two staff.”

   - Expected: I1 `few-users`, U7 `yes`; `low/medium/P3`.
   - Actual: same labelled facets; symptom `unavailable`; domain `application-availability`; `medium/low/P3`.
   - Contributions: few-user scope, unavailable symptom, critical-system configuration, functioning workaround.
   - Classification: evaluation-label/policy issue.

Primary mismatch grouping:

| Category | Cases |
|---|---:|
| Impact-scoring consequence | 6 |
| Urgency-scoring consequence | 9 |
| Composition/context | 2 |
| Risk/modifier | 3 |
| Evaluation-label/policy | 3 |

Categories overlap; this is a primary classification.

## Pre-remediation priority disagreements

No labels were changed.

| Case | Expected → actual | Resolution |
|---|---|---|
| casual-payroll-cutoff | P1 → P2 | C/D: requires judgement; payroll failure is implied but not explicit |
| isolated-canvas-can-wait | P4 → P3 | B: expected label conflicts with future-deadline policy |
| multi-school-attendance-block | P2 → P1 | B: expected P2 conflicts with labelled High/High |
| team-pay-run-today | P2 → P1 | C/D: P1 is defensible but explicit payment harm is absent |
| resolved-outage-context | P4 → P3 | A: pre-existing resolution-context bug |
| administrator-account-compromise | P1 → P3 | A: missing active-exposure modifier |
| six-duplicate-payments | P2 → P1 | B: expected P2 conflicts with current Impact policy |
| pay-date-question | P4 → P3 | A: topical payroll evidence is scored despite explicit “paid correctly” |
| resolved-privacy-review | P4 → P3 | A: pre-existing resolution-context bug |
| wrong-guardian-court-order | P1 → P2 | C/D: hypothetical urgency and no deadline |
| read-only-next-month | P4 → P3 | A/B: false missing-data symptom plus future-deadline floor |
| teams-notification-proposal | P4 → P3 | B: low-urgency feature label conflicts with future-deadline floor |
| contained-family-next-week | P4 → P3 | B: same future-deadline policy conflict |
| accessible-phone-process | P3 → P4 | B: functioning workaround and no deadline support P4 |
| lost-assessment-submissions | P2 → P3 | B: Medium/Medium maps to P3 under the unchanged matrix |

## Pre-remediation P1 false positives and false negatives

Current P1 false negatives:

- `casual-payroll-cutoff`: expected P1, actual P2; Impact is Medium because the engine sees team scope and payroll involvement but not explicit unpaid harm.
- `administrator-account-compromise`: expected P1, actual P3; active unauthorised access was not converted to `exposureActive`.
- `wrong-guardian-court-order`: expected P1, actual P2; the current engine sees safeguarding and broad scope but no immediate deadline or active exposure.

Current P1 false positives:

- `multi-school-attendance-block`: expected P2, actual P1; labelled High Impact + High Urgency necessarily maps to P1.
- `team-pay-run-today`: expected P2, actual P1; payment/payroll risk, no workaround, and a same-day pay run produce High/High.
- `six-duplicate-payments`: expected P2, actual P1; active financial and data-integrity evidence produce High/High.

The v0.7.0 changes did fix two P1 errors from v0.6.1:

- `active-family-exposure`: P4 → P1, a desirable privacy-exposure improvement.
- `pending-privacy-approval`: P1 → P3, a desirable correction of negated/current-vs-planned exposure.

## Pre-remediation v0.6.1 → v0.7.0 behavioural delta

27/57 cases changed in the audited fields. The remaining 30 were unchanged. No assessment status changed.

All changes:

- `active-family-exposure`: privacy/exposure absent → active privacy exposure; P4 → P1. Correct improvement.
- `multi-school-attendance-block`: scope unknown → multiple-schools; Medium → High; P2 → P1. Correct scope extraction; expected P2 requires label review.
- `certificate-next-enrolment`: U6 unknown → operational. Correct.
- `emergency-messages-down`: I2 unknown → explicit emergency-communication blocked. Correct.
- `clearance-missing-campus`: U6 unknown → statutory. Correct.
- `few-students-paper-copy`: U7 unknown → yes; urgency Medium → Low. Correct workaround extraction; expected urgency requires review.
- `enrolment-spreadsheet-fallback`: U7 unknown → yes; urgency Medium → Low. Correct.
- `team-pay-run-today`: U6 unknown → operational. Correct; outcome unchanged.
- `all-school-dashboard-request`: U6 unknown → preference; urgency Medium → Low. Correct.
- `single-wrong-student-record`: I3 absent → incorrect-data. Correct.
- `deleted-list-restorable`: U8 unknown → active. Correct.
- `audit-whenever-convenient`: U6 unknown → preference. Correct.
- `vendor-release-risk`: U8 active → pending. Correct active-vs-future distinction.
- `six-duplicate-payments`: scope unknown → few-users. Correct.
- `all-school-paper-rolls`: U7 unknown → yes. Correct.
- `resolved-privacy-review`: I3 security-only → privacy plus security. Correct risk recognition, but context handling remains defective.
- `assessment-in-thirty-minutes`: U6 unknown → operational. Correct.
- `backup-fails-five-nights`: I4 unknown → recurring; Impact Medium → High; P3 → P2; work type incident → problem investigation. Correct recurrence improvement under existing policy.
- `service-token-two-days`: U6 unknown → operational. Correct.
- `downstream-payment-propagation`: I3 data-integrity → financial plus data-integrity. Correct risk-family overlap; urgency disagreement is pre-existing.
- `accessible-phone-process`: U7 unknown → yes. Correct.
- `scheduled-refresh-can-wait`: U6 unknown → operational. Correct.
- `pending-privacy-approval`: active exposure/P1 → planned privacy context/P3. Correct correction of negation and pending harm.
- `principal-timetable-preference`: U6 unknown → preference; urgency High → Low; P3 → P4. Correct.
- `lost-assessment-submissions`: U8 unknown → active. Correct.
- `large-fee-direct-debit`: U6 unknown → operational. Correct.
- `edge-browser-stopgap`: U7 unknown → yes; urgency Medium → Low. Correct workaround extraction.

No unexplained v0.7.0 regression was found in this comparison, but the unresolved context and modifier problems above block release.

## Independence and overfitting audit

- No fixture imports production phrase dictionaries.
- No exact semantic fixture text duplicates a production dictionary string.
- Four semantic cases exactly duplicate existing test wording:
  - `i2-attendance-history`
  - `u5-now-need`
  - `u5-today-payroll`
  - `u5-weeks-until`
- The original eight evaluation cases are intentionally retained as legacy compatibility cases.
- The four duplicated semantic cases should be independently reworded before release; they were not changed during this audit.

Detector coverage is not single-case overfit:

| Detector area | Positive coverage | Negative/guard coverage | Evaluation cases |
|---|---|---|---|
| Scope/comparators | I1 role, count, school, organisation cases | Year-report, comparator, unaffected-school cases | `multi-school-attendance-block`, `six-duplicate-payments` |
| Blocked process | I2 attendance, enrolment, payroll, teaching, emergency, reporting | login-only, how-to, history, manual continuation | `emergency-messages-down`, `enrolment-spreadsheet-fallback` |
| Risks/modifiers | I3 privacy, financial, security, safety, safeguarding, data-integrity | context-only, hypothetical, negated, unavailable | `active-family-exposure`, `administrator-account-compromise`, `pending-privacy-approval` |
| Containment | I4 contained, spreading, recurring, unknown extent | breadth-only and “no evidence of spreading” | `backup-fails-five-nights`, `downstream-payment-propagation` |
| Workarounds | U7 manual, alternative, paper, phone, spreadsheet, partial | history, question, stopped workaround, uncertainty | `few-students-paper-copy`, `edge-browser-stopgap` |
| Harm timing | U8 expired, expiring, active exposure, pending exposure, deletion | negated, resolved, historical, hypothetical | `deleted-list-restorable`, `vendor-release-risk`, `pending-privacy-approval` |

## Pre-remediation reporting and release blockers

At the initial snapshot, the evaluator reported eight-facet denominators and field-level mismatch details, but it still needed future work to report:

- explicit assessed/unassessed counts;
- Impact/Urgency/Priority denominators directly in the printed report;
- mismatch counts by category;
- acceptable priority alternatives;
- reviewed ambiguity versus unambiguous regression.

Those changes should follow this audit; they were intentionally not implemented yet.

Remaining release blockers:

1. Active unauthorised-access modifier needs a reviewed detector fix.
2. Resolved-current-context and negated “currently” cases need investigation.
3. Four duplicated semantic cases need independent wording.
4. Priority-label disagreements require independent policy review.
5. Browser runtime, GitHub Actions, and Pages deployment remain unverified.

Scoring weights, Impact/Urgency thresholds, the 3×3 matrix, and category neutrality remain unchanged. No branch, commit, PR, merge, tag, or release was created.

## Remediation pass: current status

The accepted remediation pass was completed without changing the scoring policy or releasing v0.7.0.

### Confirmed engine fixes

- Active unauthorised access now uses the existing security/exposure modifier architecture, including positive active wording, revoked/secured negatives, and pending/hypothetical wording.
- Resolved context recognises `previously resolved`, `has been resolved`, `was resolved yesterday`, removed/revoked access, fixed issues, `no action is required`, and historical-context wording. Later active wording still reopens the context.
- Current-state negation prevents `no one`, `nobody`, and `not currently occurring` from producing active-now evidence.
- Explicit payroll success clears unsupported payroll/financial harm while retaining payroll-finance domain routing. Active payroll failures remain risks.
- The read-only report regression was traced to the `no records` symptom root phrase. Its matcher now excludes records explicitly described as unchanged, while a report that contains no records still maps to `missing-data`.

Focused tests cover each of these families, including the exact audit examples.

### Label and fixture corrections

All 57 expected records were checked against the authoritative matrix. Five objectively inconsistent expected priorities were corrected:

| Case | Expected Impact/Urgency | Corrected priority |
|---|---|---:|
| `multi-school-attendance-block` | high / high | P1 |
| `lost-assessment-submissions` | medium / medium | P3 |
| `private-data-context` | low / low | P4 |
| `deleted-list-restorable` | high / high | P1 |
| `downstream-payment-propagation` | high / medium | P2 |

The evaluator now rejects any future record whose supplied Impact/Urgency/Priority triple violates the matrix. The four duplicated semantic cases were independently reworded without changing their intended states. Future-deadline floors, workaround effects, containment, privacy context, financial/data-integrity impact, hypothetical safeguarding, and recoverable-deletion policy remain unchanged and are marked for deferred policy review where they disagree with expected outcomes.

### Same-corpus comparison

The tagged v0.6.1 engine was run against the current 57-case fixture so the denominators and corrected labels are identical.

| Metric | v0.6.1 | v0.7.0 after remediation |
|---|---:|---:|
| Full tagged/current regression suite | 532 passed | 775 passed |
| Catalogue reconciliation | 206/206 | 206/206 |
| Evaluation cases | 57 | 57 |
| Coverage | 55/57 (96.5%) | 55/57 (96.5%) |
| Assessment status | 57/57 (100.0%) | 57/57 (100.0%) |
| Priority | 34/55 (61.8%) | 43/55 (78.2%) |
| Impact | 40/55 (72.7%) | 48/55 (87.3%) |
| Urgency | 42/55 (76.4%) | 43/55 (78.2%) |
| P1 precision | 9/13 (69.2%) | 12/15 (80.0%) |
| P1 recall | 9/15 (60.0%) | 12/15 (80.0%) |
| Under-prioritisation | 8 | 4 |
| Severe under-prioritisation | 2 | 0 |
| P1 false negatives | 6 | 3 |
| P1 false positives | 4 | 3 |
| Reviewed outcome mismatches | — | 17/17 |

The current result is intentionally not presented as 100%: exact priority accuracy is 43/55, and the remaining disagreements are visible and classified.

### Current evaluator report

The evaluator prints assessed/unassessed counts, every metric denominator, Impact/Urgency/Priority denominators, P1 denominators, confusion-matrix cells, mismatch details, acceptable alternative priorities, and review classifications. The current 17 Impact/Urgency/Priority outcome mismatches are classified exactly once:

| Classification | Cases |
|---|---:|
| engine defect | 0 |
| ground-truth defect | 0 |
| acceptable ambiguity | 3 |
| policy disagreement deferred | 14 |
| Unreviewed | 0 |

The three acceptable-ambiguity cases are `casual-payroll-cutoff`, `team-pay-run-today`, and `wrong-guardian-court-order`; each explicitly records its reviewed alternative priority. The 14 remaining cases are policy questions deferred without changing scoring. No unexplained regression remains.

The 17 remaining outcome mismatches are individually classified as follows. In the evaluator schema, `acceptable ambiguity` is the top-level class for a reviewed alternative; the alternative priority is recorded separately. There are no remaining `ground-truth limitation` cases: the five matrix-inconsistent labels were corrected before this final comparison.

| Case | Final classification | Reviewed alternative / disposition |
|---|---|---|
| `casual-payroll-cutoff` | acceptable ambiguity | P1 is acceptable alongside actual P2; payroll harm is implied, not explicit |
| `isolated-canvas-can-wait` | policy disagreement deferred | Future-deadline floor remains under policy review |
| `private-data-context` | policy disagreement deferred | Privacy context without stated exposure remains policy review |
| `few-students-paper-copy` | policy disagreement deferred | Workaround lowers urgency; impact treatment remains policy review |
| `enrolment-spreadsheet-fallback` | policy disagreement deferred | Broad blocked process with spreadsheet fallback remains policy review |
| `team-pay-run-today` | acceptable ambiguity | P1 is acceptable alongside actual P2; payment harm is not explicit |
| `all-school-dashboard-request` | policy disagreement deferred | Preference wording suppresses urgency under current policy |
| `deleted-list-restorable` | policy disagreement deferred | Recoverable deletion and teaching deadline remain policy review |
| `six-duplicate-payments` | policy disagreement deferred | Financial plus data-integrity evidence produces High Impact under current policy |
| `wrong-guardian-court-order` | acceptable ambiguity | P1 is acceptable alongside actual P2; consequence is hypothetical |
| `read-only-next-month` | policy disagreement deferred | Low-impact future report treatment remains policy review |
| `teams-notification-proposal` | policy disagreement deferred | Future feature proposal and deadline-floor treatment remain policy review |
| `contained-family-next-week` | policy disagreement deferred | Containment plus future deadline remains policy review |
| `downstream-payment-propagation` | policy disagreement deferred | Propagating financial/data-integrity harm and urgency remain policy review |
| `accessible-phone-process` | policy disagreement deferred | Compliance impact with a phone workaround remains policy review |
| `pending-privacy-approval` | policy disagreement deferred | Planned exposure is not active urgency under current policy |
| `edge-browser-stopgap` | policy disagreement deferred | Small scope plus functioning browser fallback remains policy review |

Therefore: unresolved engine defects = 0; ground-truth defects/limitations among the remaining mismatches = 0; reviewed alternatives = 3; deferred policy disagreements = 14; unexplained regressions = 0. The evaluator reports 17/17 reviewed outcome mismatches and rejects any unclassified mismatch.

P1 review is also explicit. The three remaining false negatives are `casual-payroll-cutoff`, `deleted-list-restorable`, and `wrong-guardian-court-order`; the three false positives are `team-pay-run-today`, `six-duplicate-payments`, and `downstream-payment-propagation`. The former active-access false negative, resolved-context errors, payroll-success error, and read-only symptom error are fixed.

### Release gate

Offline remediation checks are clean: `npm test` passes with 775/775 tests, catalogue reconciliation is 206/206, the 57-case evaluator has zero unreviewed outcome mismatches, and the v0.6.1 comparison found no new unexplained regression. The semantic corpus contains 182 facet cases and 12 cross-facet cases, with complete supported-state coverage and 100% labelled accuracy for I1–I4/U5–U8.

The browser gate was run in isolated headless Chrome against the local server because the configured Chrome DevTools MCP/in-app browser bridge was unavailable. The test page rendered `775 passed, 0 failed, 775 total` and `All assertions pass.` A representative I1–I4/U5–U8 ticket rendered all eight facet rows and P1; `Teacher can't mark roll in Seesaw.` rendered I2 as `attendance marking is blocked` and P3. Both application navigations had no page console entries or runtime exceptions, and the local module requests completed without import errors.

The earlier audit's v0.7.0 `40/55` priority result was a pre-remediation snapshot against the then-current fixture. The final `43/55` result is after the detector fixes and against the normalized 57-case fixture. The `34/55` v0.6.1 result is a reproducible same-corpus rerun of the tagged v0.6.1 engine against that same normalized fixture, not a replacement of the historical baseline: five matrix-inconsistent expected labels were corrected before the normalized comparison (`multi-school-attendance-block`, `lost-assessment-submissions`, `private-data-context`, `deleted-list-restorable`, and `downstream-payment-propagation`). Reviewed alternatives classify three remaining disagreements but do not alter expected labels or inflate exact accuracy. The original v0.6.1 `37/55` figure remains in the initial historical table; the `34/55` figure is explicitly comparable to final v0.7.0 `43/55` because both use the same 55 assessed cases and corrected labels.

Matrix, Impact weights, Urgency weights, category neutrality, organisation criticality/config separation, dependency state, network behavior, backend/persistence/telemetry state, and absence of an LLM/AI API are unchanged. At the time this readiness gate was written, the branch, commit, PR, merge, tag, release, GitHub Actions, and Pages checks were still pending; the post-release verification below records their completed outcome.

## Post-release verification

v0.7.0 — Eight-Facet NLP Robustness Hardening was released successfully.

- PR: [#11](https://github.com/ikelaiah/first-pass-ticket-triage/pull/11)
- Merge commit: `3c2953bd7c54c3ebf542fa0f42949190a3d8948a`
- Tag: `v0.7.0`
- Release: [v0.7.0](https://github.com/ikelaiah/first-pass-ticket-triage/releases/tag/v0.7.0)
- Tests: 775/775
- Catalogue reconciliation: 206/206
- Semantic facet cases: 182
- Cross-facet cases: 12
- Evaluation cases: 57, including 55 assessed cases
- Priority accuracy: 43/55 (78.2%)
- Impact accuracy: 48/55 (87.3%)
- Urgency accuracy: 43/55 (78.2%)
- P1 precision: 12/15 (80.0%)
- P1 recall: 12/15 (80.0%)
- Under-prioritisation: 4
- Severe under-prioritisation: 0
- Remaining reviewed mismatches: 17/17
- Unresolved engine defects: 0
- Unexplained regressions: 0
- GitHub Actions: PASS on `main` and the `v0.7.0` tag
- GitHub Pages deployment: PASS
- Browser/runtime verification: PASS

The scoring weights and authoritative 3×3 matrix remained unchanged.

The application remains local-first, deterministic, dependency-free, backend-free, persistence-free, telemetry-free, and does not use an LLM/AI API.
