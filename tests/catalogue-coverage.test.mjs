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

function splitRow(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '')
    .split('|').map((cell) => cell.trim());
}

function headerField(value) {
  const header = cleanCell(value).toLowerCase();
  if (/^platform(?:\s*\/\s*standard)?$/.test(header)) return 'name';
  if (header === 'main use') return 'mainUse';
  if (header.startsWith('typical ')) return 'typicalLevel';
  if (header === 'url') return 'url';
  return null;
}

function readTableSchema(line) {
  if (!line.startsWith('|')) return null;
  const fields = splitRow(line).map(headerField);
  return fields.includes('name') && fields.includes('mainUse') && fields.includes('url')
    ? fields
    : null;
}

export function readCatalogueRows(markdown) {
  const rows = [];
  let section = null;
  let schema = null;
  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();
    const heading = line.match(/^# ([0-9]+)\. (.+)$/);
    if (heading) {
      const number = Number(heading[1]);
      section = number >= 1 && number <= EXPECTED_SECTION_COUNT
        ? { number, name: heading[2] }
        : null;
      schema = null;
      continue;
    }
    if (!section || !line.startsWith('|')) continue;
    const nextSchema = readTableSchema(line);
    if (nextSchema) {
      schema = nextSchema;
      continue;
    }
    if (!schema || /^\|?\s*:?-{2,}/.test(line)) continue;
    const cells = splitRow(line);
    if (!cells[0].startsWith('**')) continue;
    const values = Object.fromEntries(schema.map((field, index) =>
      field ? [field, cleanCell(cells[index] || '')] : []
    ));
    const row = {
      section: section.number,
      category: section.name,
      name: values.name,
      mainUse: values.mainUse,
      typicalLevel: schema.includes('typicalLevel') ? values.typicalLevel : null,
      url: values.url
    };
    Object.defineProperties(row, {
      hasTypicalLevel: { value: schema.includes('typicalLevel') },
      tableColumns: { value: schema.length }
    });
    rows.push(row);
  }
  return rows;
}

function normaliseLiteralAlias(value) {
  return typeof value === 'string'
    ? value.replace(/\s+/g, ' ').trim().toLowerCase()
    : null;
}

function duplicateLiteralAliases(catalogue) {
  const owners = new Map();
  for (const entity of catalogue) {
    for (const value of [entity.name, ...(entity.aliases || [])]) {
      const alias = normaliseLiteralAlias(value);
      if (!alias) continue;
      const values = owners.get(alias) || [];
      values.push({ id: entity.id, value });
      owners.set(alias, values);
    }
  }
  return [...owners.entries()]
    .filter(([, values]) => new Set(values.map((value) => value.id)).size > 1)
    .map(([alias, values]) => ({
      alias: values[0].value,
      normalizedAlias: alias,
      ids: [...new Set(values.map((value) => value.id))],
      values
    }));
}

function sourceRecordFor(entity, row) {
  return entity?.sourceRecords?.find((record) =>
    record.category === row.category && record.name === row.name
  ) || null;
}

function metadataMismatchesFor(row, record) {
  if (!record) {
    return [{
      name: row.name,
      category: row.category,
      field: 'sourceRecord',
      expected: 'source record retained',
      actual: null
    }];
  }
  const mismatches = [];
  const expectedFields = ['mainUse', 'url'];
  for (const field of expectedFields) {
    if (record[field] !== row[field]) {
      mismatches.push({
        name: row.name,
        category: row.category,
        field,
        expected: row[field],
        actual: record[field] ?? null
      });
    }
  }
  if (row.hasTypicalLevel) {
    if (record.typicalLevel !== row.typicalLevel) {
      mismatches.push({
        name: row.name,
        category: row.category,
        field: 'typicalLevel',
        expected: row.typicalLevel,
        actual: record.typicalLevel ?? null
      });
    }
  } else if (record.typicalLevel != null) {
    mismatches.push({
      name: row.name,
      category: row.category,
      field: 'typicalLevel',
      expected: null,
      actual: record.typicalLevel
    });
  }
  return mismatches;
}

function buildReport(rows) {
  const sourceNames = new Set(rows.map((row) => row.name));
  const missingEntities = rows.filter((row) => !platformCatalogueBySourceName.has(row.name));
  const missingCategoryAssignments = rows.filter((row) => {
    const entity = platformCatalogueBySourceName.get(row.name);
    return entity && !entity.categories.includes(row.category);
  });
  const identityCategoryCovered = rows.filter((row) => {
    const entity = platformCatalogueBySourceName.get(row.name);
    return entity && entity.categories.includes(row.category);
  }).length;
  const metadataChecks = rows.map((row) => {
    const entity = platformCatalogueBySourceName.get(row.name);
    const record = sourceRecordFor(entity, row);
    const mismatches = metadataMismatchesFor(row, record);
    return { record, mismatches };
  });
  const metadataMismatches = metadataChecks.flatMap((check) => check.mismatches);
  const metadataMatched = metadataChecks.filter((check) =>
    check.record && check.mismatches.length === 0
  ).length;
  const sourceUrlInTypicalLevel = platformCatalogue.flatMap((entity) =>
    (entity.sourceRecords || []).filter((record) => /^https?:\/\//.test(record.typicalLevel || ''))
      .map((record) => ({ ...record, entity: entity.id }))
  );
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
    sourceSections: new Set(rows.map((row) => row.section)).size,
    identityCategoryCovered,
    metadataMatched,
    metadataMismatches,
    sourceUrlInTypicalLevel,
    threeColumnRows: rows.filter((row) => row.tableColumns === 3).length,
    fourColumnRows: rows.filter((row) => row.tableColumns === 4).length,
    canonicalEntities: platformCatalogue.length,
    representedEntities: new Set(rows
      .map((row) => platformCatalogueBySourceName.get(row.name)?.id)
      .filter(Boolean)).size,
    missingEntities,
    missingCategoryAssignments,
    duplicateLiteralAliases: duplicateLiteralAliases(platformCatalogue),
    normalisations,
    guarded,
    conservative,
    byCategory: [...byCategory.entries()].map(([category, values]) => ({ category, ...values }))
  };
}

const rows = readCatalogueRows(readFileSync(SOURCE, 'utf8'));
const report = buildReport(rows);

const threeColumnExample = readCatalogueRows([
  '# 15. Example',
  '',
  '| Platform | Main use | URL |',
  '|---|---|---|',
  '| **SchoolTV** | Wellbeing resources | https://schooltv.me/ |'
].join('\n'));
assert.deepEqual(threeColumnExample[0], {
  section: 15,
  category: 'Example',
  name: 'SchoolTV',
  mainUse: 'Wellbeing resources',
  typicalLevel: null,
  url: 'https://schooltv.me/'
}, 'three-column rows must leave typicalLevel absent');

const fourColumnExample = readCatalogueRows([
  '# 1. Example',
  '',
  '| Platform | Main use | Typical level | URL |',
  '|---|---|---|---|',
  '| **Canvas LMS** | Full LMS | K–12 | https://example.test/canvas |'
].join('\n'));
assert.deepEqual(fourColumnExample[0], {
  section: 1,
  category: 'Example',
  name: 'Canvas LMS',
  mainUse: 'Full LMS',
  typicalLevel: 'K–12',
  url: 'https://example.test/canvas'
}, 'four-column rows must preserve all fields');

assert.equal(metadataMismatchesFor(threeColumnExample[0], {
  mainUse: 'Wellbeing resources',
  typicalLevel: null,
  url: 'https://schooltv.me/'
}).length, 0, 'an absent source level is allowed when catalogue level is null');
assert.deepEqual(metadataMismatchesFor(threeColumnExample[0], {
  mainUse: 'Wellbeing resources',
  typicalLevel: 'K–12',
  url: 'https://schooltv.me/'
}).map((mismatch) => mismatch.field), ['typicalLevel'],
  'a fabricated catalogue level must be reported');

assert.equal(report.sourceCategoryAssignments, 206);
assert.equal(report.uniqueSourceNames, 184);
assert.equal(report.sourceSections, 22);
assert.equal(report.identityCategoryCovered, 206);
assert.equal(report.metadataMatched, 206);
assert.equal(report.metadataMismatches.length, 0,
  report.metadataMismatches.map((mismatch) => JSON.stringify(mismatch)).join('\n'));
assert.equal(report.sourceUrlInTypicalLevel.length, 0,
  report.sourceUrlInTypicalLevel.map((row) => row.name + ' [' + row.category + ']').join('\n'));
assert.equal(report.threeColumnRows, 47);
assert.equal(report.fourColumnRows, 159);
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
assert.equal(report.duplicateLiteralAliases.length, 0,
  report.duplicateLiteralAliases.map((item) => {
    return 'Alias "' + item.alias + '" belongs to: ' + item.ids.join(', ');
  }).join('\n'));

console.log('\n== Catalogue reconciliation ======================================');
for (const item of report.byCategory) {
  console.log(item.category.padEnd(52) + String(item.rows).padStart(4) + ' ' + String(item.covered).padStart(7));
}
console.log('TOTAL'.padEnd(52) + String(report.sourceCategoryAssignments).padStart(4) + ' ' +
  String(report.sourceCategoryAssignments).padStart(7));
console.log('Source category assignments: ' + report.sourceCategoryAssignments);
console.log('Source sections: ' + report.sourceSections);
console.log('Unique source names: ' + report.uniqueSourceNames);
console.log('Canonical catalogue entities: ' + report.canonicalEntities);
console.log('Represented entities: ' + report.representedEntities);
console.log('Identity/category covered: ' + report.identityCategoryCovered);
console.log('Missing entities: ' + report.missingEntities.length);
console.log('Missing category assignments: ' + report.missingCategoryAssignments.length);
console.log('Metadata matched: ' + report.metadataMatched);
console.log('Metadata mismatches: ' + report.metadataMismatches.length);
console.log('Duplicate literal aliases: ' + report.duplicateLiteralAliases.length);
console.log('Three-column source rows: ' + report.threeColumnRows);
console.log('Four-column source rows: ' + report.fourColumnRows);
console.log('Family/module normalisations: ' + report.normalisations.length);
for (const item of report.normalisations) {
  console.log('  ' + item.canonical + ' <= ' + item.sourceNames.join(' | '));
}
console.log('Guarded/brand-only ambiguous names: ' + report.conservative.join(', '));
console.log('PASS - source sections 1–22 reconcile completely');
console.log('PASS - source metadata reconciles completely');
console.log('PASS - literal alias ownership is unique');
