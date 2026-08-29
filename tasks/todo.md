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

## v0.6.0 complete Pre-K–12 platform catalogue

- [x] Programmatically reconcile sections 1–22 of the reference document.
- [x] Add red catalogue coverage, recognition, ambiguity, and priority-neutrality tests.
- [x] Add the generic platform catalogue and preserve organisation-specific config.
- [x] Expose platform categories/entity types without scoring category membership.
- [x] Add representative coverage across all 22 source categories and module mappings.
- [x] Update README/architecture docs, changelog, and version to 0.6.0.
- [x] Run full verification and code review.
- [x] Commit, merge, tag, and publish the `v0.6.0` release.

## v0.6.1 catalogue-correctness patch

- [x] Confirm the untouched v0.6.0 suite and audit the source table shapes.
- [x] Add red parser, metadata reconciliation, BrainPOP, alias-integrity, and
  ReadSpeaker regressions.
- [x] Correct all 47 malformed three-column source rows without inventing levels.
- [x] Merge BrainPOP / BrainPOP Jr. into one canonical family while retaining
  both source rows and categories.
- [x] Remove generic `screen reader` and `reader` ReadSpeaker aliases.
- [x] Prove category metadata remains scoring-neutral and priority expectations do
  not change.
- [x] Update release documentation/version and run the full verification suite.
- [x] Review the focused diff before the existing PR, merge, tag, and release
  workflow.
