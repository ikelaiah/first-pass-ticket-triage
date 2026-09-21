/*
 * Validation helper for a work-in-progress holdout fixture.
 *
 *   node tests/validate-holdout.mjs tests/fixtures/accuracy-holdout-v0.11.1.json
 *
 * It checks schema, enum values, unique IDs and texts, and the matrix invariant.
 * It does not evaluate, so it is safe to run while labels are still being
 * filled in. Per-case problems are listed together so the author can fix a
 * whole batch at once.
 */
import { readFileSync } from 'node:fs';
import { validateCorpus } from './evaluate.mjs';

const path = process.argv[2];
if (!path) {
  console.error('Usage: node tests/validate-holdout.mjs <fixture.json>');
  process.exitCode = 2;
} else {
  let corpus;
  try {
    corpus = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    console.error('FAIL - not valid JSON: ' + error.message);
    process.exitCode = 1;
  }
  if (corpus) {
    const errors = [];
    let wholeCorpusPasses = true;
    try {
      validateCorpus(corpus);
    } catch {
      wholeCorpusPasses = false;
      for (const [index, item] of corpus.cases.entries()) {
        try {
          validateCorpus({ metadata: corpus.metadata, cases: [item] });
        } catch (caseError) {
          errors.push(caseError.message
            .replace(/^Invalid accuracy corpus: /, '')
            .replace(/^cases\[0\]/, 'cases[' + index + ']'));
        }
      }
      const ids = new Map();
      const texts = new Map();
      corpus.cases.forEach((item, index) => {
        const id = String(item.id || '').trim().toLowerCase();
        const text = String(item.text || '').trim().toLowerCase().replace(/\s+/g, ' ');
        if (ids.has(id)) errors.push('cases[' + index + '] duplicate id ' + item.id);
        else ids.set(id, index);
        if (text && texts.has(text)) {
          errors.push('cases[' + index + '] duplicate text of cases[' + texts.get(text) + ']');
        } else if (text) {
          texts.set(text, index);
        }
      });
    }
    if (wholeCorpusPasses) {
      const filled = corpus.cases.filter((item) => item.text && item.text.trim()).length;
      console.log('PASS - ' + corpus.cases.length + ' cases validate (' + filled + ' with text)');
      if (filled < corpus.cases.length) {
        console.log('NOTE - ' + (corpus.cases.length - filled) + ' cases still have empty text');
      }
    } else {
      for (const line of errors) console.error('FAIL - ' + line);
      console.error(errors.length + ' problem(s) found in ' + corpus.cases.length + ' cases');
      process.exitCode = 1;
    }
  }
}
