# Spec: Application-support triage accuracy

## Objective

Improve the deterministic triage engine for a live demonstration. The engine must
distinguish incidents, service requests, how-to questions, and text that does not
describe IT or application-support work. Dramatic wording must not manufacture a
critical incident.

## Tech stack

Vanilla JavaScript ES modules, static HTML/CSS, and the dependency-free test harness
in `tests/tests.js`.

## Commands

- Test: `npm test`
- Syntax check: `node --check <changed-js-file>`
- Source hygiene: `git -c core.whitespace=cr-at-eol diff --check`
- Development server: `./serve.ps1`

There is no build or lint command.

## Project structure

- `js/engine/`: detectors, scoring, modifiers, and the priority matrix
- `js/data/phrases.js`: deterministic language coverage
- `tests/tests.js`: shared Node/browser behavior tests
- `PRIORITY-FRAMEWORK.md`: canonical decision framework

## Code style

Use small pure functions and evidence records that explain every decision:

```javascript
return {
  inScope: signals.length > 0,
  signals
};
```

Priority labels must never be emitted by phrase detectors. Detectors establish facts;
impact and urgency are scored; only `priority-matrix.js` maps them to P1-P4.

## Testing strategy

- Add behavior tests before implementation.
- Cover both positive examples and a nearby counterexample.
- Include source-calibrated cases for broad outages, isolated faults, sustainable
  workarounds, service requests, and how-to questions.
- Run the complete suite and privacy scan after each implementation slice.

## Boundaries

- Always: preserve local-only processing, explainability, manual overrides, and the
  authoritative matrix.
- Ask first: change the P1-P4 matrix, add dependencies, or introduce network calls.
- Never: treat requester-supplied words such as `urgent`, `P1`, or `high priority` as
  proof of business impact; silently invent scope or business consequences.

## Success criteria

- `Help, I don't know how to use mac?` is a recognised how-to request and remains P4.
- `help! my cat is sad now, high priority` is marked outside recognised IT/support
  scope, low confidence, and cannot rise above P4.
- Scope and urgency claims alone cannot make irrelevant text an IT ticket.
- Common application wording such as `Outlook crashes` is recognised as an incident.
- Software installation and alternative-browser/device wording are classified as
  service-request and workaround evidence respectively.
- Existing behavior and the privacy source scan remain green.

## Open questions

None blocking. The project remains advisory: novel phrasing and deliberate attempts
that include convincing technical details may still require human review.
