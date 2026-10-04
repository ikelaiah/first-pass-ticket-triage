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

Edit `js/config.js`. Add `{ name, aliases, critical, soleInstance, sharedInstance, failureFloor }`.
No engine change is needed.

- `critical` only means the system tends to block a business process; it does
  not decide priority by itself.
- `soleInstance` marks a system the organisation has exactly one of, so a
  current failure has no alternative path and raises urgency (never impact)
  unless the ticket scopes it to one person, states a workaround, or says it is
  resolved.
- `sharedInstance` marks a platform every tenant shares. A confirmed failure
  reported for one tenant widens the affected scope to all tenants, because they
  run on the same instance.
- `failureFloor` (for example `'P1'`) marks a system whose confirmed failure sets
  a minimum priority regardless of scope or deadline. Use `'P1'` for the student
  information and payroll systems; use `'P2'` for vendor-dependent payment
  gateways. Slow/degraded, a resolved incident, a holding workaround and a mere
  mention do not trigger it.

These are deployment facts: a university reusing the site would mark its LMS
`sharedInstance` and its SIS `failureFloor: 'P1'`, exactly as a K-12
corporation marks its own.

Organisation-specific systems take precedence. Generic Pre-K-12 platforms live in
`js/data/platform-catalogue.js`, which is reconciled against the checked-in
source inventory
(`docs/pre-k12-teaching-learning-school-operations-platforms-complete.md`) by
`tests/catalogue-coverage.test.mjs`. To add a generic platform, add the row to the
source document first, then the matching catalogue entity; the test proves
identity, categories and metadata reconcile and that no literal alias has two
owners. Categories are routing context only — they never affect scoring.

## Change scoring

Base weights live in `js/engine/impact.js` and `js/engine/urgency.js`; the
hard-safety calibration lives in `js/engine/policy.js`; the matrix itself is
`js/engine/priority-matrix.js`. Keep the matrix authoritative: nothing else may
name a priority.
