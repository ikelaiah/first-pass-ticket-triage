import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { platformCatalogue, platformCatalogueBySourceName } from '../js/data/platform-catalogue.js';

const SOURCE = new URL('../docs/pre-k12-teaching-learning-school-operations-platforms-complete.md', import.meta.url);
const EXPECTED_SECTION_COUNT = 22;

function cleanCell(value) {
  return value
    .trim()
    .replaceAll('**', '')
    .replaceAll('*', '')
    .replaceAll('🇦🇺/NZ', '')
    .replaceAll('🇦🇺/UK', '')
    .replaceAll('🇦🇺', '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function readCatalogueRows(markdown) {
  const rows = [];
  let section = null;
  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    const heading = line.match(/^# ([0-9]+)\. (.+)$/);
    if (heading) {
      const number = Number(heading[1]);
      section = number >= 1 && number <= EXPECTED_SECTION_COUNT
        ? { number, name: heading[2] }
        : null;
      continue;
    }
    if (!section || !line.startsWith('| **')) continue;
    const cells = line.split('|');
    rows.push({
      section: section.number,
      category: section.name,
      name: cleanCell(cells[1]),
      mainUse: cleanCell(cells[2]),
      typicalLevel: cleanCell(cells[3]),
      url: cleanCell(cells[4])
    });
  }
  return rows;
}

function buildReport(rows) {
  const sourceNames = new Set(rows.map((row) => row.name));
  const missingEntities = rows.filter((row) => !platformCatalogueBySourceName.has(row.name));
  const missingCategoryAssignments = rows.filter((row) => {
    const entity = platformCatalogueBySourceName.get(row.name);
    return entity && !entity.categories.includes(row.category);
  });
  const byCategory = new Map();
  for (const row of rows) {
    const current = byCategory.get(row.category) || { rows: 0, covered: 0 };
    current.rows += 1;
    if (platformCatalogueBySourceName.has(row.name) &&
        platformCatalogueBySourceName.get(row.name).categories.includes(row.category)) {
      current.covered += 1;
    }
    byCategory.set(row.category, current);
  }
  const normalisations = platformCatalogue
    .filter((entity) => entity.sourceNames.length > 1)
    .map((entity) => ({ canonical: entity.name, sourceNames: entity.sourceNames }));
  const guarded = platformCatalogue
    .filter((entity) => entity.guardedAliases?.length)
    .map((entity) => entity.name);
  const conservative = [...guarded, 'Microsoft Teams for Education', 'Google Classroom',
    'Microsoft Forms', 'Google Forms'];

  return {
    sourceCategoryAssignments: rows.length,
    uniqueSourceNames: sourceNames.size,
    canonicalEntities: platformCatalogue.length,
    representedEntities: new Set(rows
      .map((row) => platformCatalogueBySourceName.get(row.name)?.id)
      .filter(Boolean)).size,
    missingEntities,
    missingCategoryAssignments,
    normalisations,
    guarded,
    conservative,
    byCategory: [...byCategory.entries()].map(([category, values]) => ({ category, ...values }))
  };
}

const rows = readCatalogueRows(readFileSync(SOURCE, 'utf8'));
const report = buildReport(rows);

assert.equal(report.sourceCategoryAssignments, 206);
assert.equal(report.uniqueSourceNames, 184);
assert.equal(report.missingEntities.length, 0,
  report.missingEntities.map((row) => row.name + ' [' + row.category + ']').join('\n'));
assert.equal(report.missingCategoryAssignments.length, 0,
  report.missingCategoryAssignments.map((row) => row.name + ' [' + row.category + ']').join('\n'));
assert.equal(report.representedEntities, report.canonicalEntities,
  'some catalogue entities are not reachable from the source inventory');
assert(report.normalisations.length > 0, 'family/module normalisations are not recorded');
assert(report.guarded.includes('Clever'));
assert(report.guarded.includes('Compass'));
assert(report.guarded.includes('Formative'));
assert(report.guarded.includes('Flat for Education'));
assert(report.guarded.includes('Oliver'));
assert(report.guarded.includes('Scratch'));

console.log('\n== Catalogue reconciliation ======================================');
for (const item of report.byCategory) {
  console.log(item.category.padEnd(52) + String(item.rows).padStart(4) + ' ' + String(item.covered).padStart(7));
}
console.log('TOTAL'.padEnd(52) + String(report.sourceCategoryAssignments).padStart(4) + ' ' +
  String(report.sourceCategoryAssignments).padStart(7));
console.log('Unique source names: ' + report.uniqueSourceNames);
console.log('Canonical catalogue entities: ' + report.canonicalEntities);
console.log('Represented entities: ' + report.representedEntities);
console.log('Missing entities: ' + report.missingEntities.length);
console.log('Missing category assignments: ' + report.missingCategoryAssignments.length);
console.log('Family/module normalisations: ' + report.normalisations.length);
for (const item of report.normalisations) {
  console.log('  ' + item.canonical + ' <= ' + item.sourceNames.join(' | '));
}
console.log('Guarded/brand-only ambiguous names: ' + report.conservative.join(', '));
console.log('PASS - source sections 1–22 reconcile completely');
