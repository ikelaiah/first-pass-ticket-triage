/**
 * Optional Node runner for the same test suite the browser page uses.
 *
 *   node tests/run.mjs
 *
 * The application itself never needs Node. This file exists so the suite can
 * run in a terminal or in CI as well as in tests/tests.html.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runTests } from './tests.js';
import { buildFacetCoverageReport, formatFacetCoverage } from './facet-report.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

const { results, passed, failed, total } = runTests();

let currentGroup = '';
for (const result of results) {
  if (result.group !== currentGroup) {
    currentGroup = result.group;
    console.log('\n== ' + currentGroup + ' ' + '='.repeat(Math.max(0, 60 - currentGroup.length)));
  }
  const status = result.pass ? 'PASS' : 'FAIL';
  console.log(status + ' - ' + result.name + '  [' + result.message + ']');
}

console.log('\n== v0.7.0 semantic corpus coverage ' + '='.repeat(23));
for (const line of formatFacetCoverage(buildFacetCoverageReport())) console.log(line);

/* --- static privacy check: the app must contain no network calls --------- */

const FORBIDDEN = [
  /\bfetch\s*\(/,
  /XMLHttpRequest/,
  /\bWebSocket\b/,
  /navigator\.sendBeacon/,
  /EventSource/,
  /import\s*\(\s*['"]https?:/,
  /src\s*=\s*['"]https?:/i,
  /href\s*=\s*['"]https?:\/\/(?!(?:www\.)?(?:github\.com|opensource\.org|developer\.mozilla\.org))/i
];

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === '.git' || entry === 'node_modules') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, files);
    else if (/\.(js|mjs|html|css)$/.test(entry)) files.push(full);
  }
  return files;
}

/** Prose *about* network APIs is not a network call: drop comments and <code>. */
function stripNonCode(source) {
  return source
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<code>[\s\S]*?<\/code>/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const SELF = fileURLToPath(import.meta.url);
const violations = [];
for (const file of walk(ROOT)) {
  if (file === SELF) continue;
  const source = stripNonCode(readFileSync(file, 'utf8'));
  for (const pattern of FORBIDDEN) {
    if (pattern.test(source)) {
      violations.push(relative(ROOT, file) + ' matches ' + pattern);
    }
  }
}

console.log('\n== Privacy (static source scan) ' + '='.repeat(29));
if (violations.length) {
  for (const violation of violations) console.log('FAIL - ' + violation);
} else {
  console.log('PASS - no fetch, XHR, WebSocket, beacon or remote asset references found');
}

console.log('\n' + passed + ' passed, ' + failed + ' failed, ' + total + ' total');
process.exitCode = failed === 0 && violations.length === 0 ? 0 : 1;
