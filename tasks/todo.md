# v0.5.0 reliability, privacy, and safety checklist

- [x] Add red regressions for fragments, legacy links, storage, matrix inputs,
  assessed suggestions, scheduled times, and evaluator safety metrics.
- [x] Implement and verify fragment sharing with legacy cleanup.
- [x] Harden expected-behaviour detection around unrelated times and past dates.
- [x] Make matrix input errors explicit and normal priority assertions user-facing.
- [x] Add evaluator under-prioritisation and P1 metrics.
- [x] Clarify evidence-completeness terminology in UI and docs.
- [x] Add CI, config boundary note, queue-separation note, version bump, and release docs.
- [x] Run full tests, privacy scan, syntax checks, static-site review, and final code review.

## v0.5.1 differential scope safety

- [x] Add red regressions for narrow and broad differential cases.
- [x] Make differential reasoning conditional without erasing explicit breadth.
- [x] Retain broad-failure urgency contribution for broad partial failures.
- [x] Update focused changelog/version metadata only.
- [x] Run `npm test`, syntax/privacy checks, and final review.
- [x] Commit, merge, tag, and publish the `v0.5.1` release.
