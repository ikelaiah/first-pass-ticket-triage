# Safety-boundary adjudication — payroll cutoff and potential-harm labels

**Date:** 2026-09-19
**Baseline:** v0.10.0 `main`, checked-in `tests/fixtures/accuracy-corpus.json`
**Scope:** label and classification decisions only; no engine, scoring, matrix, or
eight-question model change.

This memo resolves the four disputed evaluation cases before safety metrics are
made release-blocking. It uses only the existing eight Decision Questions
(I1–I4, U5–U8) and the written policy in
[`docs/triage-policy.md`](triage-policy.md) and
[`PRIORITY-FRAMEWORK.md`](../PRIORITY-FRAMEWORK.md). No ninth dimension is added.

## Baseline measurement

`node tests/evaluate.mjs tests/fixtures/accuracy-corpus.json` on the adjudication
baseline reported 74/79 exact priority, 8 reviewed mismatches, one unsafe
under-prioritisation, two P1 false negatives, and one P1 false positive. Every
mismatch carried a review classification, so the evidence gap was not the
engine's exact-match count; it was that three of the classifications hid a
label or extraction defect behind an "acceptable ambiguity" or "policy
disagreement deferred" note.

## Adjudications

| Case | Baseline label | Actual | Adjudication | Rule and reason |
| --- | --- | --- | --- | --- |
| `casual-payroll-cutoff` | P1/high/high; acceptable P2 | P2/medium/high | **Engine defect.** Label unchanged. | `financial.confirmed` already escalates a same-day payroll/payment processing failure. "The payroll file was not produced for 42 employees and the payroll cutoff is this afternoon" is an actual failed processing path with a named population; the written rule does not require the word "unpaid". The symptom detector does not recognise "was not produced", so no failure or data-issue symptom reaches I3 and the policy cannot fire. Fix is evidence extraction, not a label change. |
| `team-pay-run-today` | P2/medium/high; acceptable P1 | P1/high/high | **Ground-truth defect.** Label corrected to P1/high/high. | Same rule as above. "The payment service is down for the finance team, there is no workaround, and the pay run is due today" is a payment processing failure against a same-day deadline. The old label demanded explicit unpaid harm; the written rule does not. Both payroll cases must be read by one boundary, so they are adjudicated together. |
| `wrong-guardian-court-order` | P1/high/high; acceptable P2 | P2/high/medium | **Ground-truth defect.** Label corrected to P2/high/medium. | `safeguarding.active` requires a stated restriction and current excluded-person access. The ticket states neither: "wrong guardian details" describes incorrect data (I3 = wrong data / safeguarding context, I4 unknown) and "could affect court orders" is potential, not active, harm. High impact with Medium urgency keeps the serious consequence visible and the existing clarification questions ask whether anyone actually accessed the information. |
| `all-school-dashboard-request` | P2/high/low; policy disagreement deferred | P4/low/low | **Engine defect.** Label unchanged. | Scope detection marks the clause hypothetical because it contains "if possible", so the explicit "all schools" population is dropped from I1. Confirming scope manually reproduces the expected high impact and P2. "If possible" is a preference marker (U6), not a real conditional; treating it as hypothetical also contradicts the preference read the label already records. Fix is I1 scope-temporal handling. |

## Measurement effects after correction

The two relabelled cases now match engine output. The two engine defects remain
visible and are the only remaining non-ambiguity mismatches in the corpus:

- `casual-payroll-cutoff` — engine defect, fixed in the payroll evidence change.
- `all-school-dashboard-request` — engine defect, fixed in the scope change.

After those two fixes the corpus safety metrics are expected to read:

| Measure | After adjudication |
| --- | ---: |
| Unsafe under-prioritisation | 0 |
| Severe unsafe under-prioritisation | 0 |
| P1 false negatives | 0 |
| P1 false positives | 0 |
| Abstentions on assessed | 0 |
| Reviewed acceptable ambiguities | 4 |
| Engine defects | 0 |

## Gate decision

Safety metrics become release-blocking for the checked-in corpus: any unsafe
under-prioritisation, severe unsafe under-prioritisation, severe
under-prioritisation, P1 false negative, or assessed-ticket abstention fails
`npm test`. Reviewed acceptable alternatives do
**not** exempt a high-consequence miss; if a future case needs that exemption,
it must be argued in a memo like this one before the gate is changed. Exact
priority, impact, urgency, and the four remaining acceptable ambiguities stay
informational for now.

## Follow-up work authorised by this memo

1. Payroll evidence extraction: recognise a not-produced payroll/payment file
   as a failure symptom, with contrast guards for payroll questions and resolved
   history (I3 and the payroll branch of policy calibration).
2. Scope temporal handling: treat politeness hedges such as "if possible" as
   preference wording, not hypothetical context, with negative guards for real
   conditionals ("if the record is missing", "if approved").
3. Re-run the evaluator and the locked 36-case validator after each change and
   record the delta.

Neither change introduces a new question, signal family, or scoring dimension;
both feed the existing I1 and I3 projections.

## Outcome — 2026-09-19

Both engine defects were fixed on the same day:

- `missing-data` now recognises "not produced", so the payroll file failure
  reaches I3 and `financial.confirmed` escalates the same-day cutoff.
- Scope temporal projection ignores politeness hedges before testing for
  conditional wording, so "if possible" no longer hides the stated population.

Measured results after the fixes:

| Measure | Baseline | After |
| --- | ---: | ---: |
| Exact priority | 74/79 (93.7%) | **78/79 (98.7%)** |
| Reviewed mismatches | 8 (7 ambiguity + 1 deferred) | **4 (4 ambiguity)** |
| Unsafe under-prioritisation | 1 | **0** |
| Severe under-prioritisation | 1 | **0** |
| P1 false negatives | 2 | **0** |
| P1 false positives | 1 | **0** |
| Abstentions on assessed | 0 | 0 |
| Reviewed acceptable ambiguities | 7 | 4 |

The suite grew from 952 to 956 behavioural assertions, all passing. The safety
gate is wired into `node tests/evaluate.mjs` and covered by the evaluator
self-test.

The locked v0.8.0 validator is unchanged by these edits: 25 exact semantic
divergences, 24 adjudicated capability boundaries (B=9, C=10, D=5), one reviewed
ambiguity, zero unadjudicated divergences, zero safety blockers, release safety
gate PASS. The four remaining corpus ambiguities are unchanged and stay
informational; the next work is the Category B capability-boundary burn-down.

