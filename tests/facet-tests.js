import { facetFixtures, allFacetCases, supportedFacetStates } from './fixtures/facets/index.js';
import { metamorphicCases, orthogonalityCases, compositionCases } from './fixtures/facets/compositions.js';
import { analyse } from '../js/engine/analyzer.js';
import { assertFacetCase, coverageForFixture, tagCounts } from './facet-test-helpers.js';

function stateFor(result, facet) {
  if (facet === 'I1') return result.eightFacets.i1Scope.value;
  if (facet === 'I2') return result.eightFacets.i2Blocked.blockedProcess?.level || 'unknown';
  if (facet === 'I3') {
    const value = result.eightFacets.i3Irreversibility;
    if (value.modifiers.exposureActive && value.risks.includes('privacy')) return 'privacy-exposure';
    if (value.risks.includes('safeguarding')) return 'safeguarding';
    if (value.risks.includes('payroll') || value.risks.includes('financial')) return 'financial-harm';
    if (value.risks.includes('privacy')) return 'privacy-context';
    if (value.risks.includes('dataIntegrity')) return 'incorrect-data';
    if (value.risks.includes('security')) return 'security-compromise';
    if (value.risks.includes('safety')) return 'safety';
    if (result.symptom === 'data-loss') return 'lost-data';
    if (result.symptom === 'unavailable') return 'unavailable';
    return 'none';
  }
  if (facet === 'I4') {
    const value = result.eightFacets.i4Containment.containment;
    return value.propagating ? 'spreading' : value.recurring ? 'recurring' :
      value.undetected ? 'unknown-extent' : value.contained ? 'contained' : 'unknown';
  }
  if (facet === 'U5') return result.eightFacets.u5Deadline.value;
  if (facet === 'U6') return result.eightFacets.u6Driver.driver.driver;
  if (facet === 'U7') return result.eightFacets.u7Workaround.workaround;
  if (facet === 'U8') return result.eightFacets.u8HarmTiming.harmTiming.timing;
  return 'unknown';
}

export function registerFacetTests(test, ok) {
  for (const item of allFacetCases) {
    test('v0.7.0 semantic corpus', item.id + ' [' + item.tags.join(', ') + ']', () => {
      const outcome = assertFacetCase(item);
      return ok(outcome.pass, outcome.message);
    });
  }

  for (const [facet, fixture] of Object.entries(facetFixtures)) {
    test('v0.7.0 coverage invariants', facet + ' covers every supported semantic state', () => {
      const covered = coverageForFixture(fixture);
      const missing = fixture.supportedStates.filter((state) => !covered.includes(state));
      return ok(missing.length === 0, missing.length ? 'missing ' + missing.join(', ') : covered.join(', '));
    });
    test('v0.7.0 coverage invariants', facet + ' has positive and contrast cases', () => {
      const counts = tagCounts(fixture.cases);
      return ok(counts.positive > 0 && counts.contrast > 0,
        JSON.stringify({ positive: counts.positive || 0, contrast: counts.contrast || 0 }));
    });
  }

  test('v0.7.0 coverage invariants', 'fixture metadata is independent and complete', () => {
    const validFacets = Object.keys(supportedFacetStates);
    const invalid = allFacetCases.filter((item) =>
      !validFacets.includes(item.facet) || !item.id || !item.text || !item.tags?.length);
    const independent = Object.values(facetFixtures).every((fixture) => fixture.authoring === 'independent');
    return ok(invalid.length === 0 && independent,
      invalid.length + ' malformed cases' + (independent ? '' : '; fixture authoring marker missing'));
  });

  test('v0.7.0 coverage invariants', 'each facet has at least 20 authored cases', () => {
    const undersized = Object.entries(facetFixtures)
      .filter(([, fixture]) => fixture.cases.length < 20)
      .map(([facet, fixture]) => facet + '=' + fixture.cases.length);
    return ok(undersized.length === 0, undersized.join(', ') || 'all facets meet the minimum');
  });

  for (const item of metamorphicCases) {
    test('v0.7.0 metamorphic', item.id + ' preserves ' + item.facet + ' across equivalent wording', () => {
      const actual = item.variants.map((text) => stateFor(analyse(text), item.facet));
      return ok(actual.every((value) => value === item.expected), JSON.stringify(actual));
    });
  }

  for (const item of [...orthogonalityCases, ...compositionCases]) {
    test('v0.7.0 composition', item.id + ' keeps independent facet answers explicit', () => {
      const result = analyse(item.text);
      const mismatches = Object.entries(item.expected)
        .filter(([facet, expected]) => stateFor(result, facet) !== expected)
        .map(([facet, expected]) => facet + '=' + stateFor(result, facet) + ' expected ' + expected);
      return ok(mismatches.length === 0, mismatches.join('; ') || 'all expected facet states');
    });
  }
}
