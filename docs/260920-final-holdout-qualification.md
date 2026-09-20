# Final holdout qualification — v0.11.0

**Date:** 2026-09-20
**Fixture:** `tests/fixtures/accuracy-holdout-final-v0.8.0.json` (24 independently
labelled, anonymised-style tickets, frozen before evaluation)
**Process:** unsealed once on 2026-09-20; the first look is the holdout verdict.
Later runs are post-fix regressions, not fresh holdout measurements.

This document records the honest out-of-sample result. It does not change a
label, an expected priority, or an evaluator metric. The fixture remains in the
repository as a consumed historical record with a checksum enforced by
`tests/holdout-integrity.test.mjs`.

## First look — the holdout verdict

| Measure | Result |
| --- | ---: |
| Exact priority | 11/24 (45.8%) |
| Impact | 14/24 (58.3%) |
| Urgency | 13/24 (54.2%) |
| P1 precision / recall | 2/3 (66.7%) / 2/4 (50.0%) |
| Under-prioritisation (any) | 6 |
| Severe under-prioritisation | 1 |
| P1 false negatives | 2 |
| P1 false positives | 1 |
| Abstentions on assessed | 0 |
| Mismatches | 15 |

**Safety blockers: 2** (one severe under-prioritisation and two P1 false
negatives). The holdout failed the safety gate on its first look. Note that the
`unsafe under-prioritisation` metric read zero because the holdout labels do not
carry the I3/U8 facet fields that metric needs; the severe and P1-false-negative
gates did the safety work. A replacement holdout should include those facet
labels.

### Safety-critical findings

- `final-05-family-balance-disclosure` — "The billing portal currently shows one
  household's balance to another household, and support has no way to revoke the
  viewing session." Expected P1; the engine said P3. Present-tense disclosure to
  another household was not recognised as active exposure.
- `final-11-expired-welfare-access` — "A relief worker whose clearance ended last
  week can still open student wellbeing notes this morning." Expected P1; the
  engine said P2. "Can still open" was not recognised as access-not-revoked, so
  the active safeguarding rule could not fire.

## Adjudication of the 15 first-look mismatches

Fourteen were engine defects (now fixed and guarded); one is a deferred policy
disagreement.

| Case | Classification | Cause |
| --- | --- | --- |
| `final-01-library-barcode-paper-path` | Engine defect | Paper-register fallback and individual librarian scope missing |
| `final-04-draft-adjustment-permission` | Engine defect | Proposed permission over disability adjustments not pending privacy context |
| `final-05-family-balance-disclosure` | Engine defect (safety) | Disclosure to another household not active exposure |
| `final-09-unrecoverable-audit-archive` | Engine defect | Unrecoverable loss with a future need had no Medium urgency floor |
| `final-10-critical-connector-not-failing` | Engine defect | "No service failure" not negated |
| `final-11-expired-welfare-access` | Engine defect (safety) | "Can still open" not access-not-revoked |
| `final-12-evacuation-map-drill` | Engine defect | Posted printed copies not a workaround |
| `final-13-screen-reader-keyboard-route` | Engine defect | Alternate shortcut not a workaround |
| `final-15-resolved-student-sync` | Engine defect | "Has operated normally since" not resolved context |
| `final-16-contained-address-correction` | Engine defect | "Written incorrectly" not data-integrity |
| `final-18-unconfirmed-duplicate-charge` | Policy disagreement deferred | Suspected charge with unconfirmed account remains P3 vs P4 |
| `final-20-certificate-renewal-planned` | Engine defect | Scheduled renewal not resolved context; state "today" read as a deadline |
| `final-22-paused-repeated-address-import` | Engine defect | Paused job not a continuity alternative; wrong suburb not data-integrity |
| `final-23-draft-api-scope` | Engine defect | Draft role over private fields not pending privacy context |
| `final-24-photo-upload-how-to` | Engine defect | "No submission error" not negated; instructions request not documentation work |

## Post-fix regression (not a fresh holdout measurement)

After the fixes above, re-running the same consumed fixture gives:

| Measure | First look | Post-fix |
| --- | ---: | ---: |
| Exact priority | 11/24 (45.8%) | **23/24 (95.8%)** |
| Impact | 14/24 | **24/24** |
| Urgency | 13/24 | 23/24 |
| P1 precision / recall | 2/3 / 2/4 | **4/4 / 4/4** |
| Under-prioritisation (any) | 6 | **0** |
| Severe under-prioritisation | 1 | **0** |
| P1 false negatives | 2 | **0** |
| P1 false positives | 1 | **0** |
| Safety blockers | 2 | **0** |

The remaining mismatch is the deferred `final-18` policy question
(speculative financial charge: expected P4, engine P3 — an over-prioritisation,
not unsafe). Every fix is additionally guarded by unseen paraphrases in
`tests/generalisation-tests.js`, so the improvement does not depend on the
holdout sentences.

## Contract for the next measurement

1. This fixture is consumed. Do not present the post-fix number as an
   out-of-sample accuracy claim.
2. Before the next release measurement, freeze a **replacement** holdout of
   independently labelled tickets, labelled before evaluation, and include the
   I3 and U8 facet fields so the unsafe-under-prioritisation metric can fire.
3. Keep the safety gate first: the first look is published regardless of the
   result, and a safety blocker stops the release.
