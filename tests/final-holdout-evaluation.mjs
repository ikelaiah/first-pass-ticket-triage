/*
 * Re-runnable evaluation for the consumed final holdout.
 *
 * The first unseal on 2026-09-20 is the holdout verdict and is recorded in the
 * fixture metadata and docs/260920-final-holdout-qualification.md. Later runs
 * are post-fix regressions, not fresh holdout measurements. The fixture
 * checksum is verified before any analyzer call and the run is recorded.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyse } from '../js/engine/analyzer.js';
import {
  evaluateCases, formatSafetyBlockers, printReport, safetyBlockers, validateCorpus
} from './evaluate.mjs';
import { allFacetCases } from './fixtures/facets/index.js';

const ROOT = dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = join(ROOT, 'fixtures', 'accuracy-holdout-final-v0.8.0.json');
const EXPECTED_BYTES = 18276;
const EXPECTED_SHA256 = 'b9ef96acf69efdb76b67b158697bba4299a3a1c1cca318b27c94a661125b2d1b';
const outputIndex = process.argv.indexOf('--output');
const requestedOutput = outputIndex >= 0 ? process.argv[outputIndex + 1] : null;
const RESULT_PATH = requestedOutput
  ? (isAbsolute(requestedOutput) ? requestedOutput : resolve(process.cwd(), requestedOutput))
  : join(ROOT, '..', 'artifacts', 'validation',
    'final-holdout-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json');

const fixtureBytes = readFileSync(FIXTURE_PATH);
const fixtureSha256 = createHash('sha256').update(fixtureBytes).digest('hex');
assert.equal(fixtureBytes.length, EXPECTED_BYTES, 'final holdout bytes changed before evaluation');
assert.equal(fixtureSha256, EXPECTED_SHA256, 'final holdout checksum changed before evaluation');

const corpus = JSON.parse(fixtureBytes.toString('utf8'));
validateCorpus(corpus);
assert.equal(corpus.metadata.labelledBeforeEvaluation, true,
  'final holdout must be labelled before evaluation');
assert.equal(corpus.metadata.evaluated, true,
  'this is a post-fix regression run against the consumed holdout');
console.log('First-look holdout result (the verdict): ' +
  corpus.metadata.firstLook.exactPriority + ' exact priority, ' +
  corpus.metadata.firstLook.p1FalseNegatives + ' P1 false negatives, ' +
  corpus.metadata.firstLook.severeUnderPrioritisation + ' severe under-prioritisation.');
console.log('Post-fix regression baseline: ' + corpus.metadata.postFixRegression.exactPriority + ' exact priority.');

const priorFixtures = [
  'accuracy-corpus.json', 'accuracy-holdout-v0.8.0.json', 'accuracy-release-validation-v0.8.0.json'
].map((name) => JSON.parse(readFileSync(join(ROOT, 'fixtures', name), 'utf8')));
const normalise = (text) => String(text).replace(/\s+/g, ' ').trim().toLowerCase();
const priorTexts = new Set([
  ...priorFixtures.flatMap((fixture) => fixture.cases.map((item) => normalise(item.text))),
  ...allFacetCases.map((item) => normalise(item.text))
]);
const duplicates = corpus.cases.filter((item) => priorTexts.has(normalise(item.text))).map((item) => item.id);
assert.deepEqual(duplicates, [], 'final holdout duplicates prior corpus text');

const captured = new Map();
let analyzerCalls = 0;
const report = evaluateCases(corpus.cases, (text) => {
  analyzerCalls += 1;
  const result = analyse(text);
  captured.set(text, result);
  return result;
});
assert.equal(analyzerCalls, corpus.cases.length, 'each holdout ticket must be analysed exactly once');
assert.equal(captured.size, corpus.cases.length);

printReport(report);
const blockers = safetyBlockers(report);
console.log('Safety blockers: ' + (blockers.length ? formatSafetyBlockers(blockers) : 'none'));
console.log('Safety gate: ' + (blockers.length ? 'BLOCKING FAILURE' : 'PASS'));

const persisted = {
  evaluation: {
    fixture: 'tests/fixtures/accuracy-holdout-final-v0.8.0.json',
    bytes: fixtureBytes.length,
    sha256: fixtureSha256,
    analyzerCalls,
    evaluatedAt: new Date().toISOString(),
    releaseStatus: blockers.length ? 'BLOCKING FAILURE' : 'PASS',
    safetyBlockers: blockers
  },
  report,
  cases: corpus.cases.map((item) => ({
    id: item.id,
    text: item.text,
    expected: item.expected,
    actual: captured.get(item.text)
  }))
};
mkdirSync(dirname(RESULT_PATH), { recursive: true });
writeFileSync(RESULT_PATH, JSON.stringify(persisted, null, 2) + '\n', 'utf8');
console.log('Result written to ' + RESULT_PATH);
if (blockers.length) {
  console.error('BLOCKING FAILURE: the final holdout reported unsafe under-prioritisation.');
  process.exitCode = 1;
}
