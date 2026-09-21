# Replacement holdout qualification — v0.11.1

**Date:** 2026-09-20
**Fixture:** `tests/fixtures/accuracy-holdout-v0.11.1.json` (24 independently
authored and labelled tickets, labelled before evaluation)
**Process:** unsealed once on 2026-09-20; the first look is the holdout verdict.
Later runs are post-fix regressions, not fresh holdout measurements.

This is the replacement holdout required by the v0.11.0 release contract. It
includes the I3 and U8 facet fields the consumed final holdout lacked, so the
unsafe-under-prioritisation gate can fire. The fixture keeps its first-look
metadata, per-case adjudication, and checksum enforced by
`tests/holdout-integrity.test.mjs`.

## First look — the holdout verdict

| Measure | Result |
| --- | ---: |
| Exact priority | 14/24 (58.3%) |
| Impact | 19/24 (79.2%) |
| Urgency | 12/24 (50.0%) |
| P1 precision / recall | 3/3 (100.0%) / 3/6 (50.0%) |
| Under-prioritisation (any) | 7 |
| Severe under-prioritisation | 4 |
| Unsafe under-prioritisation | 3/7 actionable high-consequence cases |
| Severe unsafe under-prioritisation | 3/7 |
| P1 false negatives | 3 |
| P1 false positives | 0 |
| Abstentions on assessed tickets | 1 |
| Mismatches | 23 |

**Safety blockers: 5 metric lines** (unsafe 3, severe unsafe 3, severe
under-prioritisation 4, P1 false negatives 3, one assessed-ticket abstention).
The holdout failed the safety gate on its first look.

### Safety-critical findings

- `holdout-03` — chemical store access opening for student cards during a
  lesson, staff unable to secure it. The hazard was outside the recognised
  support boundary and the ticket abstained. Expected P1.
- `holdout-04` — a suspended teacher under a safeguarding restriction could
  still receive and answer pupils' private messages. "Still allows … receive"
  was not access-not-revoked. Expected P1.
- `holdout-06` — assessment portfolios permanently erased with no surviving
  copy, needed in two hours. "Permanently erased" was not data-loss and the
  two-hour deadline was missed. Expected P1.
- `holdout-08` — irreplaceable board minutes destroyed with no restoration
  path. "Destroyed" and "cannot be restored" were not loss evidence. Expected
  P2, engine said P4 (severe under).
- `holdout-11` — students unable to access an assessment because an integration
  stopped, with *neither* manual enrolment *nor* an alternative route
  available. The engine read that as a workaround. Expected P2.
- `holdout-12` — statutory attendance return failing for every record, the
  regulator portal closing in ninety minutes, no manual route. Expected P2.

## Adjudication of the 23 first-look mismatches

Twenty-two are engine defects (all fixed and guarded); one is a deferred policy
disagreement.

- **Engine defects fixed:** chemical-hazard boundary, access-not-revoked
  wording, erased/destroyed loss with no recovery path, "neither … nor …" as no
  workaround, "in ninety minutes"/"in two hours" deadlines, regulator statutory
  driver, `no manual submission route`, export/feed failure impairment,
  individual receptionist scope, "no substitute", partial "works for six, the
  remaining two have none", manual daily cost, paused-feed continuity,
  "N days from now" bucketing, bare-participle deletion as active harm,
  explicit "a preference" and "fine to leave it until later", "no account
  change" no longer missing data, pending "awaiting review / has never run",
  learning-support privacy context, and a soft-continuation signal that keeps
  the timeline from being priced as an imminent restoration.
- **`holdout-10` — policy disagreement deferred:** a corporation-wide outage
  with an indefinite full workaround. The written policy keeps a Medium urgency
  floor for a broad active failure; the label reads the explicit can-wait
  wording as Low. This remains open for a future calibration decision.

## Post-fix regression (not a fresh holdout measurement)

| Measure | First look | Post-fix |
| --- | ---: | ---: |
| Exact priority | 14/24 (58.3%) | **24/24 (100%)** |
| Impact | 19/24 | **24/24** |
| Urgency | 12/24 | 22/24 |
| P1 precision / recall | 3/3 / 3/6 | **6/6 / 6/6** |
| Unsafe under-prioritisation | 3 | **0** |
| Severe under-prioritisation | 4 | **0** |
| P1 false negatives | 3 | **0** |
| Abstentions on assessed | 1 | **0** |
| Safety blockers | 5 | **0** |

The two remaining urgency differences are the deferred `holdout-10` policy
question and `holdout-17` (a conditional restriction over-reads urgency as
Medium instead of Low — an over-prioritisation, not unsafe). The remaining
facet residuals are conservative U8 "unknown" projections, I3 risk-order
preferences, and a few U5/U6/U7 facet gaps; none affects priority, impact, or
safety. Every safety fix is additionally guarded by unseen paraphrases in
`tests/generalisation-tests.js`.

## Contract for the next measurement

1. This fixture is consumed. Do not present the post-fix number as an
   out-of-sample accuracy claim.
2. Freeze another replacement holdout of independently labelled tickets before
   the next release measurement.
3. Keep the safety gate first: the first look is published regardless of the
   result, and a safety blocker stops the release.
4. Next accuracy work, in order: U8 active-harm projection from current
   failures, I3 risk-order precision, and the `holdout-10` urgency-floor policy
   question.
