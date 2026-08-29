# v0.7.1 — NLP Evaluation Integrity & Regression Hardening

This release hardens the offline evaluation data and regression gates while
preserving the v0.7.0 policy, scoring weights, priority matrix, catalogue
neutrality, and local-only architecture.

## Baselines and results

The existing 57-case corpus was unchanged by the detector work. Its v0.7.0 and
v0.7.1 results are identical:

| Metric | v0.7.0 | v0.7.1 |
| --- | ---: | ---: |
| Cases / assessed | 57 / 55 | 57 / 55 |
| Priority accuracy | 43/55 | 43/55 |
| Impact accuracy | 48/55 | 48/55 |
| Urgency accuracy | 43/55 | 43/55 |
| P1 precision / recall | 80.0% (12/15) / 80.0% (12/15) | 80.0% (12/15) / 80.0% (12/15) |
| Under-prioritisation / severe | 4 / 0 | 4 / 0 |
| Engine defects / regressions | 0 / 0 | 0 / 0 |

Twenty-four independently authored realistic tickets were then run against the
untouched v0.7.0 analyser before production edits:

| Metric | v0.7.0 baseline | v0.7.1 |
| --- | ---: | ---: |
| Fully correct cases | 8/24 | 16/24 |
| Facet mismatches | 26 | 0 |
| Impact correct | 15/24 | 21/24 |
| Urgency correct | 19/24 | 18/24 |
| Priority correct | 19/24 | 22/24 |

The remaining eight v0.7.1 outcome mismatches are explicitly reviewed policy
ambiguities or deferred policy disagreements. There are no unreviewed
mismatches. The lower v0.7.1 urgency count is transparent: the corrected
workaround and no-exposure contexts remove urgency evidence, while the corpus
retains four intentional policy-label disagreements for review.

The complete 81-case comparison changed only the 24 newly added cases; all 57
pre-existing cases have identical facet, risk/modifier, Impact, Urgency,
Priority, and assessment-status projections. On the complete corpus:

- v0.7.0: priority 62/79, impact 63/79, urgency 62/79; P1 precision 14/19 and
  recall 14/17; under-prioritisation 5; severe 0.
- v0.7.1: priority 65/79, impact 69/79, urgency 61/79; P1 precision 14/18 and
  recall 14/17; under-prioritisation 4; severe 0.

## Integrity controls

`tests/evaluate.mjs` now rejects duplicate IDs, duplicate normalised ticket
text, invalid controlled values for assessment status, I1–I4, U5–U8,
Impact/Urgency/Priority, matrix-inconsistent labels, invalid or silently
matching acceptable alternatives, and missing review reasons. The CLI gate
fails if any mismatch lacks a review classification.

The report separates corpus quality from accuracy: case counts, assessed versus
unassessed counts, unique-text counts, every facet-label denominator, reviewed
alternatives, and mismatch-classification counts are printed before accuracy
metrics. `tests/corpus-integrity.test.mjs` checks fixture independence,
cross-corpus exact-copy collisions, matrix/result invariants, no priority on
unassessed output, and incompatible contained/spreading states.

## Confirmed detector/context fixes

Only red semantic or regression cases drove production changes. The fixes cover
historical-versus-current scope, unaffected comparison counts, written and
administrator counts, paper/browser workaround wording, passive negation for
exposure, pending `reveal` harm, contained import batches, propagation and
unknown-extent wording, a timestamp with an explicit no-deadline statement, and
blocked remaining enrolments. Each change has positive and contrast/negation or
history coverage. No policy thresholds, scoring weights, matrix cells, or
catalogue behaviour changed.

Run the release gate with:

```text
npm test
node tests/evaluate.mjs tests/fixtures/accuracy-corpus.json
```

Both commands are dependency-free and operate entirely on local files.
