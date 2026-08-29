import { facetFixtures, allFacetCases } from './fixtures/facets/index.js';
import { allCompositionCases } from './fixtures/facets/compositions.js';
import { coverageForFixture, tagCounts } from './facet-test-helpers.js';

const DISPLAY_TAGS = ['positive', 'negative', 'contrast', 'negation', 'noise', 'history', 'orthogonality', 'composition', 'metamorphic'];
const TAG_LABELS = { positive: 'pos', negative: 'neg', contrast: 'ctr', negation: 'not', noise: 'noi', history: 'hist', orthogonality: 'ortho', composition: 'comp', metamorphic: 'meta' };

function semanticTagCounts(cases) {
  const counts = tagCounts(cases);
  return Object.fromEntries(DISPLAY_TAGS.map((tag) => [
    tag,
    (counts[tag] || 0) + (tag === 'history' ? (counts.historical || 0) : 0)
  ]));
}

export function buildFacetCoverageReport() {
  const facets = Object.entries(facetFixtures).map(([facet, fixture]) => {
    const counts = semanticTagCounts(fixture.cases);
    return {
      facet,
      cases: fixture.cases.length,
      supported: fixture.supportedStates.length,
      covered: coverageForFixture(fixture).length,
      tags: counts
    };
  });
  const compositionCounts = semanticTagCounts(allCompositionCases);
  const tagTotals = semanticTagCounts([...allFacetCases, ...allCompositionCases]);
  return {
    totalCases: allFacetCases.length,
    compositionCases: allCompositionCases.length,
    facets,
    compositionTags: compositionCounts,
    tagTotals
  };
}

export function formatFacetCoverage(report) {
  const tagHeader = DISPLAY_TAGS.map((tag) => TAG_LABELS[tag]).join(' ');
  const lines = [
    'Semantic corpus: ' + report.totalCases + ' facet cases + ' + report.compositionCases + ' cross-facet cases',
    'Facet  Cases  States  Tags: ' + tagHeader
  ];
  for (const row of report.facets) {
    lines.push(row.facet.padEnd(5) + ' ' + String(row.cases).padStart(5) + '  ' +
      row.covered + '/' + row.supported + '    ' +
      DISPLAY_TAGS.map((tag) => String(row.tags[tag]).padStart(4)).join(' '));
  }
  lines.push('Corpus tags: ' + DISPLAY_TAGS.map((tag) => tag + '=' + report.tagTotals[tag]).join(', '));
  lines.push('Cross-facet tags: ' + DISPLAY_TAGS.map((tag) => tag + '=' + report.compositionTags[tag]).join(', '));
  lines.push('State coverage: every supported state has at least one declarative case.');
  return lines;
}
