/* Integrity gate for the development and final evaluation holdouts. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import development from './fixtures/accuracy-holdout-v0.8.0.json' with { type: 'json' };
import finalHoldout from './fixtures/accuracy-holdout-final-v0.8.0.json' with { type: 'json' };
import replacementHoldout from './fixtures/accuracy-holdout-v0.11.1.json' with { type: 'json' };
import corpus from './fixtures/accuracy-corpus.json' with { type: 'json' };
import { allFacetCases } from './fixtures/facets/index.js';

const ROOT = dirname(fileURLToPath(import.meta.url));
const ATTRIBUTES_PATH = join(ROOT, '..', '.gitattributes');
const FROZEN = [
  {
    name: 'development holdout',
    path: join(ROOT, 'fixtures', 'accuracy-holdout-v0.8.0.json'),
    expectedCases: 26,
    expectedBytes: 13282,
    expectedSha256: 'a1028527e0c744945b447e24479b0419f236443a6218f49e3a6b94d87f4d81cd',
    fixture: development
  },
  {
    name: 'final holdout',
    path: join(ROOT, 'fixtures', 'accuracy-holdout-final-v0.8.0.json'),
    expectedCases: 24,
    expectedBytes: 18276,
    expectedSha256: 'b9ef96acf69efdb76b67b158697bba4299a3a1c1cca318b27c94a661125b2d1b',
    fixture: finalHoldout
  },
  {
    name: 'replacement holdout',
    path: join(ROOT, 'fixtures', 'accuracy-holdout-v0.11.1.json'),
    expectedCases: 24,
    expectedBytes: 31552,
    expectedSha256: '33b6aff1ec1f2eda48924ffd67c2698e03348067c9ab8bb312a42c44666bb6b5',
    fixture: replacementHoldout
  }
];

function normalise(text) {
  return String(text).replace(/\s+/g, ' ').trim().toLowerCase();
}

const allKnownTexts = new Set([
  ...corpus.cases.map((item) => normalise(item.text)),
  ...development.cases.map((item) => normalise(item.text)),
  ...allFacetCases.map((item) => normalise(item.text))
]);
const replacementForbidden = new Set([
  ...allKnownTexts,
  ...finalHoldout.cases.map((item) => normalise(item.text))
]);

for (const item of FROZEN) {
  const bytes = readFileSync(item.path);
  assert.equal(item.fixture.cases.length, item.expectedCases, item.name + ' case count changed');
  assert.equal(bytes.length, item.expectedBytes, item.name + ' byte length changed');
  assert.equal(createHash('sha256').update(bytes).digest('hex'), item.expectedSha256,
    item.name + ' checksum changed');
  assert.equal(bytes.includes(Buffer.from('\r\n')), false,
    item.name + ' must retain LF bytes; .gitattributes prevents Windows checkout conversion');
  assert.equal(new Set(item.fixture.cases.map((ticket) => ticket.id)).size, item.fixture.cases.length,
    item.name + ' contains duplicate IDs');
  assert.equal(new Set(item.fixture.cases.map((ticket) => normalise(ticket.text))).size,
    item.fixture.cases.length, item.name + ' contains duplicate ticket text');
}

assert.match(readFileSync(ATTRIBUTES_PATH, 'utf8'), /tests\/fixtures\/\*\.json text eol=lf/,
  'fixture JSON must enforce LF bytes across Windows and Linux checkouts');

assert.equal(finalHoldout.metadata.evaluated, true,
  'the final holdout is consumed; its first-look result must stay recorded');
assert.equal(finalHoldout.metadata.labelledBeforeEvaluation, true,
  'final holdout must be labelled before evaluation');
assert.equal(finalHoldout.metadata.firstLook.exactPriority, '11/24',
  'the first-look holdout result must stay recorded');
assert.equal(finalHoldout.metadata.postFixRegression.exactPriority, '23/24',
  'the post-fix regression result must stay recorded');
for (const ticket of finalHoldout.cases) {
  assert(!allKnownTexts.has(normalise(ticket.text)),
    'final holdout ticket duplicates an existing evaluation case: ' + ticket.id);
}

assert.equal(replacementHoldout.metadata.evaluated, true,
  'the replacement holdout is consumed; its first-look result must stay recorded');
assert.equal(replacementHoldout.metadata.labelledBeforeEvaluation, true,
  'replacement holdout must be labelled before evaluation');
assert.equal(replacementHoldout.metadata.firstLook.exactPriority, '14/24',
  'the replacement first-look result must stay recorded');
assert.equal(replacementHoldout.metadata.firstLook.p1FalseNegatives, 3,
  'the replacement first-look safety finding must stay recorded');
assert.equal(replacementHoldout.metadata.postFixRegression.exactPriority, '24/24',
  'the replacement post-fix regression must stay recorded');
assert.equal(replacementHoldout.metadata.postFixRegression.safetyBlockers, 0,
  'the replacement post-fix safety result must stay recorded');
for (const ticket of replacementHoldout.cases) {
  assert(!replacementForbidden.has(normalise(ticket.text)),
    'replacement holdout ticket duplicates an existing evaluation case: ' + ticket.id);
}

console.log('PASS - holdout integrity: development 26 frozen, final 24 consumed, replacement 24 consumed with recorded first look');
