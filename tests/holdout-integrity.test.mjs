/* Integrity gate for the development and final evaluation holdouts. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import development from './fixtures/accuracy-holdout-v0.8.0.json' with { type: 'json' };
import finalHoldout from './fixtures/accuracy-holdout-final-v0.8.0.json' with { type: 'json' };
import corpus from './fixtures/accuracy-corpus.json' with { type: 'json' };

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
    expectedBytes: 12657,
    expectedSha256: '02e1d9668ad1192f81f9d6c58671d6f59869d2ff1ab193dc4323200bcddfb7f0',
    fixture: finalHoldout
  }
];

function normalise(text) {
  return String(text).replace(/\s+/g, ' ').trim().toLowerCase();
}

const allKnownTexts = new Set([
  ...corpus.cases.map((item) => normalise(item.text)),
  ...development.cases.map((item) => normalise(item.text))
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

assert.equal(finalHoldout.metadata.evaluated, false, 'final holdout must remain untouched');
assert.equal(finalHoldout.metadata.labelledBeforeEvaluation, true,
  'final holdout must be labelled before evaluation');
for (const ticket of finalHoldout.cases) {
  assert(!allKnownTexts.has(normalise(ticket.text)),
    'final holdout ticket duplicates an existing evaluation case: ' + ticket.id);
}

console.log('PASS - holdout integrity: development 26 frozen bytes, final 24 untouched cases');
