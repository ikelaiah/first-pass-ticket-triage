# The priority framework

The authoritative, human-readable contract is
[PRIORITY-FRAMEWORK.md](https://github.com/ikelaiah/first-pass-ticket-triage/blob/main/PRIORITY-FRAMEWORK.md) at the repository root. This
page is a short pointer; the contract itself is the source of truth.

## In one paragraph

Priority is calculated from two values — **Impact** (how much of the
organisation is affected, and how serious the consequence is) and **Urgency**
(what happens if we wait). Neither is read from how dramatic the wording sounds.
Impact and Urgency are projected from eight decision questions, optionally
raised or lowered by a small hard-safety calibration, and then mapped through a
single 3×3 matrix. The matrix is the only place a P1–P4 is decided.

## The matrix

|                    | Low impact | Medium impact | High impact |
| ------------------ | ---------- | ------------- | ----------- |
| **High urgency**   | P3         | P2            | P1          |
| **Medium urgency** | P3         | P3            | P2          |
| **Low urgency**    | P4         | P3            | P2          |

## The eight questions

I1 who and how many · I2 what is blocked · I3 wrong/exposed/lost/unsafe and
recoverable · I4 contained or spreading · U5 when needed · U6 requirement or
preference · U7 workaround and cost · U8 harm now or waiting.

See [PRIORITY-FRAMEWORK.md](https://github.com/ikelaiah/first-pass-ticket-triage/blob/main/PRIORITY-FRAMEWORK.md) for definitions, wording
cues, the safety calibration and worked examples.
