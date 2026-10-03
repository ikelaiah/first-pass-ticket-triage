# Extending the rules

The engine is designed so that most changes are a dictionary or configuration
edit, not an engine change. After any change, run `npm run check`.

## Add wording for an existing question

Most settings live in `js/data/phrases.js`, grouped by facet. Add an entry to the
relevant list:

| You want to detect                               | Edit                                                  |
| ------------------------------------------------ | ----------------------------------------------------- |
| Affected population                              | `SCOPE_PHRASES`                                       |
| A blocked or impaired process                    | `BLOCKED_PROCESS_PHRASES`, `IMPAIRED_PROCESS_PHRASES` |
| A risk                                           | `RISK_DEFINITIONS`                                    |
| A risk qualifier (exposure, propagation, unpaid) | `RISK_MODIFIERS`                                      |
| When it is needed                                | `DEADLINE_PHRASES`                                    |
| What creates the deadline                        | `DRIVER_PHRASES`                                      |
| A workaround                                     | `WORKAROUND_PHRASES`                                  |
| Harm now vs later                                | `HARM_TIMING_PHRASES`                                 |
| A technical symptom                              | `SYMPTOMS`                                            |

Entries are usually `{ m: ['phrase', /regex/], ...payload }`, where `m` is the
matcher and the rest describes the fact. `normalise()` lowercases, expands
contractions and unifies spelling, so write phrases in lowercase.

Then add a case to `tests/triage.test.mjs` that fails before your change.

## Add a risk

1. Add an entry to `RISK_DEFINITIONS` in `js/data/phrases.js` with a `key`,
   `label` and `m` matchers.
2. Decide its base contribution in `js/engine/impact.js` (and `urgency.js` if it
   is time-sensitive).
3. If it needs a safety escalation, add a rule to `js/engine/policy.js` and
   document it in `TRIAGE_POLICY_DECISIONS`.
4. Add it to the risk checkboxes in `index.html` if the analyst should be able
   to confirm it.
5. Update `PRIORITY-FRAMEWORK.md` and add a test.

## Add or change a worked example

Edit `js/data/examples.js`. `expected` is a list of defensible priorities (ranges
are allowed); use `'unassessed'` when the tool should ask a question instead of
scoring. The test suite asserts every example against this list, so keep the
expectation honest.

## Add a system or alias

Edit `js/config.js`. Add `{ name, aliases, critical }`. No engine change is
needed. `critical` only means the system tends to block a business process; it
does not decide priority by itself.

## Change scoring

Base weights live in `js/engine/impact.js` and `js/engine/urgency.js`; the
hard-safety calibration lives in `js/engine/policy.js`; the matrix itself is
`js/engine/priority-matrix.js`. Keep the matrix authoritative: nothing else may
name a priority.
