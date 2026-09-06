/*
 * Re-runnable independent release validation for v0.8.0.
 *
 * The fixture is frozen before this harness is run. Static provenance checks
 * happen before any analyzer call. evaluateCases receives a capture callback,
 * so each ticket is analysed exactly once and the full result is persisted.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { allFacetCases } from './fixtures/facets/index.js';
import { analyse } from '../js/engine/analyzer.js';
import { evaluateCases, normaliseEvaluationText, printReport, validateCorpus } from './evaluate.mjs';
import { adjudicateDivergences } from './release-validation-adjudication.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = join(ROOT, 'fixtures', 'accuracy-release-validation-v0.8.0.json');
const outputIndex = process.argv.indexOf('--output');
const requestedOutput = outputIndex >= 0 ? process.argv[outputIndex + 1] : null;
assert.ok(!requestedOutput || requestedOutput !== '--output', '--output requires a path');
const RESULT_PATH = requestedOutput
  ? (isAbsolute(requestedOutput) ? requestedOutput : resolve(process.cwd(), requestedOutput))
  : join(ROOT, '..', 'artifacts', 'validation', 'final-release-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json');
const EXPECTED_BYTES = 29784;
const EXPECTED_SHA256 = '44c3c7902dcdb33f50eedef915581f72af89ca7bd676ef004f9337e0d6db3b53';

const fixtureBytes = readFileSync(FIXTURE_PATH);
const fixtureSha256 = createHash('sha256').update(fixtureBytes).digest('hex');
assert.equal(fixtureBytes.length, EXPECTED_BYTES, 'release-validation fixture bytes changed');
assert.equal(fixtureSha256, EXPECTED_SHA256, 'release-validation fixture checksum changed');

const corpus = JSON.parse(fixtureBytes.toString('utf8'));
validateCorpus(corpus);
assert.equal(corpus.metadata.labelledBeforeEvaluation, true);
assert.equal(corpus.metadata.evaluated, false, 'fixture must be marked not evaluated before the run');

const priorFixtures = [
  join(ROOT, 'fixtures', 'accuracy-corpus.json'),
  join(ROOT, 'fixtures', 'accuracy-holdout-v0.8.0.json'),
  join(ROOT, 'fixtures', 'accuracy-holdout-final-v0.8.0.json')
].map((path) => JSON.parse(readFileSync(path, 'utf8')));
const priorTexts = new Set([
  ...priorFixtures.flatMap((fixture) => fixture.cases.map((item) => normaliseEvaluationText(item.text))),
  ...allFacetCases.map((item) => normaliseEvaluationText(item.text))
]);
const crossCorpusExactCopies = corpus.cases
  .filter((item) => priorTexts.has(normaliseEvaluationText(item.text)))
  .map((item) => item.id);
assert.deepEqual(crossCorpusExactCopies, [], 'release-validation ticket duplicates prior corpus text');

const capturedResults = new Map();
let analyzerCalls = 0;
const report = evaluateCases(corpus.cases, (text) => {
  analyzerCalls += 1;
  const result = analyse(text);
  capturedResults.set(text, result);
  return result;
});
assert.equal(analyzerCalls, corpus.cases.length, 'each validation ticket must be analysed exactly once');
assert.equal(capturedResults.size, corpus.cases.length);

const exactDivergenceIds = new Set([
  ...report.mismatches,
  ...report.facetMismatches,
  ...report.eightFacetMismatches
].map((mismatch) => mismatch.id));
const adjudication = adjudicateDivergences(exactDivergenceIds);
assert.equal(adjudication.capability.length + adjudication.ambiguity.length +
  adjudication.unadjudicated.length, exactDivergenceIds.size,
  'every exact release divergence must have one release adjudication');

const persisted = {
  validation: {
    title: 'v0.8.0 — Triage Policy Calibration & Semantic Evidence Resolution',
    fixture: 'tests/fixtures/accuracy-release-validation-v0.8.0.json',
    bytes: fixtureBytes.length,
    sha256: fixtureSha256,
    analyzerCalls,
    crossCorpusExactCopies,
    evaluated: true,
    releaseStatus: null
  },
  report,
  adjudication: {
    exactSemanticDivergences: exactDivergenceIds.size,
    adjudicatedCapabilityBoundaries: adjudication.capability,
    reviewedAmbiguities: adjudication.ambiguity,
    unadjudicatedDivergences: adjudication.unadjudicated,
    categories: adjudication.categories
  },
  cases: corpus.cases.map((item) => ({
    id: item.id,
    text: item.text,
    expected: item.expected,
    labelBasis: item.labelBasis,
    review: item.review || null,
    actual: capturedResults.get(item.text)
  }))
};
const blockingFailures = {
  unsafeUnderPrioritisation: report.unsafeUnderPrioritisation,
  severeUnsafeUnderPrioritisation: report.severeUnsafeUnderPrioritisation,
  abstentionsOnAssessed: report.abstentionsOnAssessed,
  severeUnderPrioritisation: report.severeUnderPrioritisation,
  p1FalseNegatives: report.p1.falseNegative,
  unadjudicatedDivergences: adjudication.unadjudicated.length
};
const releaseReady = Object.values(blockingFailures).every((value) => value === 0);
persisted.validation.releaseStatus = releaseReady ? 'PASS' : 'BLOCKING FAILURE';
persisted.validation.blockingFailures = blockingFailures;
mkdirSync(dirname(RESULT_PATH), { recursive: true });
writeFileSync(RESULT_PATH, JSON.stringify(persisted, null, 2) + '\n', 'utf8');

printReport(report);
console.log('Release adjudication');
console.log('Locked cases: ' + corpus.cases.length);
console.log('Exact semantic divergences: ' + exactDivergenceIds.size);
console.log('Adjudicated capability-boundary divergences: ' + adjudication.capability.length);
console.log('Reviewed ambiguities: ' + adjudication.ambiguity.length);
console.log('Unadjudicated divergences: ' + adjudication.unadjudicated.length);
console.log('Capability-boundary categories: B=' + adjudication.categories.B +
  ', C=' + adjudication.categories.C + ', D=' + adjudication.categories.D);
console.log('Safety blockers: ' + Object.values(blockingFailures).filter((value) => value !== 0).length);
console.log('Release safety gate: ' + (releaseReady ? 'PASS' : 'BLOCKING FAILURE'));
console.log(JSON.stringify({
  validation: persisted.validation,
  resultPath: RESULT_PATH,
  analyzerCalls
}, null, 2));
if (!releaseReady) {
  console.error('BLOCKING FAILURE: final release safety validation did not qualify this commit.');
  process.exitCode = 1;
}
