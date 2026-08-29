/* Release gate for corpus provenance, labels, and cross-facet invariants. */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyse } from '../js/engine/analyzer.js';
import { priorityFor } from '../js/engine/priority-matrix.js';
import { allFacetCases } from './fixtures/facets/index.js';
import { legacyRegressionCases } from './fixtures/legacy-regressions.js';
import corpus from './fixtures/accuracy-corpus.json' with { type: 'json' };
import { evaluateCases, normaliseEvaluationText, validateCorpus } from './evaluate.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));

function duplicateGroups(items) {
  const byText = new Map();
  for (const item of items) {
    const key = normaliseEvaluationText(item.text);
    const group = byText.get(key) || [];
    group.push(item);
    byText.set(key, group);
  }
  return [...byText.values()].filter((group) => group.length > 1);
}

function assertNoCrossCorpusDuplicates() {
  const groups = [
    ['semantic', allFacetCases],
    ['evaluation', corpus.cases],
    ['legacy', legacyRegressionCases]
  ];
  for (let left = 0; left < groups.length; left += 1) {
    for (let right = left + 1; right < groups.length; right += 1) {
      const rightByText = new Map(groups[right][1].map((item) => [
        normaliseEvaluationText(item.text), item.id
      ]));
      const collisions = groups[left][1]
        .filter((item) => rightByText.has(normaliseEvaluationText(item.text)))
        .map((item) => item.id + ' / ' + rightByText.get(normaliseEvaluationText(item.text)));
      assert.deepEqual(collisions, [], 'duplicate text across ' + groups[left][0] + ' and ' + groups[right][0]);
    }
  }
}

validateCorpus(corpus);
assertNoCrossCorpusDuplicates();

const semanticDuplicates = duplicateGroups(allFacetCases);
assert(semanticDuplicates.every((group) => new Set(group.map((item) => item.facet)).size === group.length),
  'semantic duplicate text must not repeat within one facet');
assert.equal(duplicateGroups(corpus.cases).length, 0, 'evaluation corpus contains duplicate text');
assert.equal(duplicateGroups(legacyRegressionCases).length, 0, 'legacy regression corpus contains duplicate text');

const facetFixtureDir = join(ROOT, 'fixtures', 'facets');
const dictionaryImports = readdirSync(facetFixtureDir)
  .filter((name) => name.endsWith('.js'))
  .map((name) => ({ name, source: readFileSync(join(facetFixtureDir, name), 'utf8') }))
  .filter(({ source }) => /(?:from|import)\s+[^;]*js\/data\/phrases\.js/.test(source));
assert.deepEqual(dictionaryImports, [], 'semantic fixtures must not import production phrase dictionaries');

const report = evaluateCases(corpus.cases);
assert.equal(report.quality.uniqueTicketTexts, report.quality.evaluationCases);
assert.equal(report.quality.duplicateTicketTexts, 0);
assert.equal(report.unreviewedMismatchCount, 0,
  'every evaluated mismatch must have an explicit review classification');
for (const facet of ['i1', 'i2', 'i3', 'i4', 'u5', 'u6', 'u7', 'u8']) {
  assert(report.quality.labels[facet] > 0, facet + ' has no labelled evaluation cases');
}

for (const item of corpus.cases) {
  const result = analyse(item.text);
  if (result.assessmentStatus === 'assessed') {
    assert.equal(result.suggestedPriority, priorityFor(result.impact, result.urgency),
      item.id + ' violates the result matrix invariant');
  } else {
    assert.equal(result.suggestedPriority, null, item.id + ' must not recommend a priority when unassessed');
  }
  const i3 = result.eightFacets?.i3Irreversibility;
  if (i3?.modifiers?.exposureActive) {
    assert(i3.risks.includes('privacy') || i3.risks.includes('security'),
      item.id + ' exposes data without a privacy or security risk');
  }
  const i4 = result.eightFacets?.i4Containment?.containment;
  if (i4?.contained) {
    assert(!i4.propagating && !i4.recurring,
      item.id + ' is both contained and spreading/recurring');
  }
}

console.log('PASS - corpus integrity: ' + report.quality.evaluationCases +
  ' evaluation cases, ' + report.quality.uniqueTicketTexts + ' unique texts, ' +
  report.quality.unreviewedMismatches + ' unreviewed mismatches');
