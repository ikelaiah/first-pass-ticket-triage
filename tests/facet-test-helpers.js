import { analyse } from '../js/engine/analyzer.js';
import { createDocument } from '../js/engine/negation.js';
import { detectScope } from '../js/engine/scope.js';
import { detectDeadline } from '../js/engine/deadline.js';
import { detectWorkaround } from '../js/engine/workaround.js';
import { detectRisks } from '../js/engine/risks.js';
import { detectContainment } from '../js/engine/containment.js';
import { detectDriver } from '../js/engine/driver.js';
import { detectHarmTiming } from '../js/engine/harm-timing.js';
import { detectSymptom } from '../js/engine/symptom.js';

function fail(message) {
  return { pass: false, message };
}

function pass(message) {
  return { pass: true, message };
}

function i1(result) {
  return result;
}

function i2(result) {
  return result.eightFacets.i2Blocked;
}

function detectorResult(item) {
  const doc = createDocument(item.text);
  if (item.facet === 'I1') return detectScope(doc);
  if (item.facet === 'U5') return detectDeadline(doc);
  if (item.facet === 'U6') return detectDriver(doc);
  if (item.facet === 'U7') return detectWorkaround(doc);
  if (item.facet === 'U8') {
    const symptom = detectSymptom(doc);
    return detectHarmTiming(doc, symptom);
  }
  if (item.facet === 'I3') {
    const symptom = detectSymptom(doc);
    return { ...detectRisks(doc, { symptom }), symptom: symptom.symptom };
  }
  if (item.facet === 'I4') {
    const symptom = detectSymptom(doc);
    const riskResult = detectRisks(doc, { symptom });
    return detectContainment(doc, riskResult.risks);
  }
  return null;
}

function assertFlags(actual, expected, label) {
  for (const key of expected || []) {
    if (!actual.includes(key)) return fail(label + ' missing ' + key + ' in ' + actual.join(', '));
  }
  return null;
}

function assertI3(result, expected) {
  const facet = result.risks
    ? { risks: Object.keys(result.risks).filter((key) => result.risks[key]), modifiers: result.modifiers }
    : result.eightFacets.i3Irreversibility;
  const flags = facet.risks || [];
  const required = assertFlags(flags, expected.risks, 'I3 risks');
  if (required) return required;
  const unexpected = (expected.risksAbsent || []).filter((key) => flags.includes(key));
  if (unexpected.length) return fail('I3 unexpectedly has ' + unexpected.join(', '));
  if (expected.symptom && (result.symptom || result.id) !== expected.symptom) {
    return fail('I3 symptom = ' + (result.symptom || result.id) + ' - expected ' + expected.symptom);
  }
  for (const [key, value] of Object.entries(expected.modifiers || {})) {
    if (Boolean(facet.modifiers?.[key]) !== value) {
      return fail('I3 modifier ' + key + ' = ' + Boolean(facet.modifiers?.[key]) + ' - expected ' + value);
    }
  }
  return pass((expected.risks || []).join(', ') || 'no prohibited I3 signal');
}

function assertI4(result, expected) {
  const containment = result.containment || result;
  const actual = containment.propagating ? 'spreading'
    : containment.recurring ? 'recurring'
      : containment.undetected ? 'unknown-extent'
        : containment.contained ? 'contained' : 'unknown';
  return actual === expected.state
    ? pass(actual)
    : fail('I4 = ' + actual + ' - expected ' + expected.state);
}

function assertU5(result, expected) {
  const actual = result.eightFacets.u5Deadline;
  const value = actual.value ?? actual.deadline;
  return value === expected.value && actual.committed === expected.committed
    ? pass(value + (actual.committed ? ' / committed' : ' / uncommitted'))
    : fail('U5 = ' + value + ' / committed=' + actual.committed +
      ' - expected ' + expected.value + ' / committed=' + expected.committed);
}

function assertU6(result, expected) {
  const actual = result.eightFacets.u6Driver.driver.driver;
  return actual === expected.driver
    ? pass(actual)
    : fail('U6 = ' + actual + ' - expected ' + expected.driver);
}

function assertU7(result, expected) {
  const actual = result.eightFacets.u7Workaround.workaround;
  return actual === expected.value
    ? pass(actual)
    : fail('U7 = ' + actual + ' - expected ' + expected.value);
}

function assertU8(result, expected) {
  const actual = result.eightFacets.u8HarmTiming.harmTiming.timing;
  return actual === expected.timing
    ? pass(actual)
    : fail('U8 = ' + actual + ' - expected ' + expected.timing);
}

export function assertFacetCase(item) {
  const result = item.facet === 'I2' ? analyse(item.text) : detectorResult(item);
  const expected = item.expected;

  if (item.facet === 'I1') {
    const actual = i1(result);
    return actual.scope === expected.value
      ? pass(actual.scope)
      : fail('I1 = ' + actual.scope + ' - expected ' + expected.value);
  }

  if (item.facet === 'I2') {
    const actual = i2(result).blockedProcess;
    const actualState = actual?.level || 'unknown';
    const process = actual?.process || null;
    if (actualState !== expected.state) {
      return fail('I2 state = ' + actualState + ' - expected ' + expected.state);
    }
    if (expected.process && process !== expected.process) {
      return fail('I2 process = ' + process + ' - expected ' + expected.process);
    }
    if (expected.source && actual.source !== expected.source) {
      return fail('I2 source = ' + actual.source + ' - expected ' + expected.source);
    }
    return pass(actualState + (process ? ' / ' + process : ''));
  }

  if (item.facet === 'I3') return assertI3(result, expected);
  if (item.facet === 'I4') return assertI4(result, expected);
  if (item.facet === 'U5') return assertU5({ eightFacets: { u5Deadline: result } }, expected);
  if (item.facet === 'U6') return assertU6({ eightFacets: { u6Driver: { driver: result } } }, expected);
  if (item.facet === 'U7') return assertU7({ eightFacets: { u7Workaround: result } }, expected);
  if (item.facet === 'U8') return assertU8({ eightFacets: { u8HarmTiming: { harmTiming: result } } }, expected);

  return fail('No assertion adapter for ' + item.facet);
}

export function facetResult(result, facet) {
  if (facet === 'I1') return result.scope;
  if (facet === 'I2') return result.eightFacets.i2Blocked.blockedProcess?.level || 'unknown';
  if (facet === 'I3') return result.eightFacets.i3Irreversibility;
  if (facet === 'I4') return result.containment;
  if (facet === 'U5') return result.eightFacets.u5Deadline.value;
  if (facet === 'U6') return result.eightFacets.u6Driver.driver.driver;
  if (facet === 'U7') return result.eightFacets.u7Workaround.workaround;
  if (facet === 'U8') return result.eightFacets.u8HarmTiming.harmTiming.timing;
  throw new Error('No facet result adapter for ' + facet);
}

export function tagCounts(cases) {
  return cases.reduce((counts, item) => {
    // Count cases carrying a tag, rather than duplicate tag entries supplied
    // by a fixture helper and its call site.
    for (const tag of new Set(item.tags || [])) counts[tag] = (counts[tag] || 0) + 1;
    return counts;
  }, {});
}

export function coverageForFixture(fixture) {
  const states = new Set(fixture.cases.map((item) => {
    if (item.facet === 'I1') return item.expected.value;
    if (item.facet === 'I2') return item.expected.process || item.expected.state;
    if (item.facet === 'I3') {
      if (item.expected.modifiers?.exposureActive) return 'privacy-exposure';
      if (item.expected.symptom === 'data-loss') return 'lost-data';
      if (item.expected.symptom === 'unavailable') return 'unavailable';
      if (item.expected.risks?.includes('privacy')) return 'privacy-context';
      if (item.expected.risks?.includes('dataIntegrity')) return 'incorrect-data';
      if (item.expected.risks?.includes('financial') || item.expected.risks?.includes('payroll') || item.expected.modifiers?.unpaidRisk) return 'financial-harm';
      if (item.expected.risks?.includes('security')) return 'security-compromise';
      if (item.expected.risks?.includes('safety')) return 'safety';
      if (item.expected.risks?.includes('safeguarding')) return 'safeguarding';
      return null;
    }
    if (item.facet === 'I4') return item.expected.state;
    if (item.facet === 'U5') return item.expected.value;
    if (item.facet === 'U6') return item.expected.driver;
    if (item.facet === 'U7') return item.expected.value;
    if (item.facet === 'U8') return item.expected.timing;
    return null;
  }));
  return fixture.supportedStates.filter((state) => states.has(state));
}
