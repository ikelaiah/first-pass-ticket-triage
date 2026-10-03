# Contributing

Thanks for helping. This project values small, readable changes and a green
check before anything is merged.

## Prerequisites

- **Node.js LTS** — for the test runner, linter, formatter and type checker.
- Optionally **Python 3.10–3.14** — only to preview the docs with DocSprout.

The application itself needs neither: it is a static site with no build step.

## Run locally

```bash
python -m http.server 8000    # or: npx serve .
# open http://localhost:8000
```

On Windows, double-click `serve.bat`. ES modules do not load from `file://`.

## Before you open a pull request

```bash
npm install     # once
npm run check   # lint + format check + type check + tests
```

`npm run check` runs:

| Script                 | What it does                                      |
| ---------------------- | ------------------------------------------------- |
| `npm run lint`         | ESLint over the whole repository                  |
| `npm run format:check` | Prettier check                                    |
| `npm run typecheck`    | `tsc --noEmit` (JavaScript type checking)         |
| `npm test`             | The acceptance suite plus the privacy source scan |

Use `npm run format` to apply Prettier automatically.

## The tests

`tests/run.mjs` runs `tests/triage.test.mjs` and then a static privacy scan. The
suite asserts the matrix, each of the eight questions, every worked example in
`js/data/examples.js`, the safety invariants and the advisory projections.

The examples are the single source of truth: `EXAMPLES` is shared by the UI
picker and the tests, so a change to an example's `expected` is a change to the
test. Keep them honest rather than changing them to match a bug.

Open `tests/tests.html` to run the same suite in a browser.

## Documentation

Developer docs live in `docs/` and are plain Markdown. To preview them with
DocSprout:

```bash
python -m pip install "https://github.com/ikelaiah/docsprout/archive/refs/tags/v1.3.1.zip"
docsprout serve        # local preview
docsprout check        # validate navigation and links
```

`docs/layout.json` decides what is published; `docs/docsprout.json` decides how
it looks. The docs are not deployed — they are read on GitHub and previewed
locally.

## Pull requests

- Keep the change focused, with a short factual description.
- Run `npm run check` and make sure it is green.
- If you change behaviour, update `PRIORITY-FRAMEWORK.md`, the relevant docs
  page, and `CHANGELOG.md`.
- Never add a network call, remote asset or ticket persistence to the
  application. The privacy scan will fail, correctly.
