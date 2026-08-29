/**
 * Offline evaluator for independently labelled triage tickets.
 *
 * Ticket text is read from a local JSON file, analysed in-process, and never
 * transmitted or persisted elsewhere.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { analyse } from '../js/engine/analyzer.js';
import { priorityFor } from '../js/engine/priority-matrix.js';

const PRIORITIES = ['P1', 'P2', 'P3', 'P4'];
const OUTPUT_LABELS = [...PRIORITIES, 'UNASSESSED'];
const LEVELS = ['low', 'medium', 'high'];
const PRIORITY_RANK = { P1: 4, P2: 3, P3: 2, P4: 1 };
export const REVIEW_CLASSIFICATIONS = [
  'engine defect',
  'ground-truth defect',
  'acceptable ambiguity',
  'policy disagreement deferred'
];
const FACET_DEFINITIONS = {
  scope: ['unknown', 'individual', 'few-users', 'team', 'cohort', 'one-school',
    'multiple-schools', 'all-schools', 'corporation-wide'],
  consequence: ['unknown', 'impaired', 'blocked'],
  deadline: ['unknown', 'now', 'today', 'tomorrow', 'days-2-5', 'weeks-1-2', 'none'],
  driver: ['unknown', 'statutory', 'operational', 'preference', 'none'],
  workaround: ['unknown', 'yes', 'partial', 'no'],
  containment: ['unknown', 'contained', 'spreading']
};
const EIGHT_FACET_DEFINITIONS = {
  i1: FACET_DEFINITIONS.scope,
  i2: FACET_DEFINITIONS.consequence,
  i3: ['unknown', 'privacy-context', 'privacy-exposure', 'incorrect-data', 'lost-data',
    'financial-harm', 'security-compromise', 'safety', 'safeguarding', 'unavailable'],
  i4: ['unknown', 'contained', 'spreading', 'recurring', 'unknown-extent'],
  u5: FACET_DEFINITIONS.deadline,
  u6: FACET_DEFINITIONS.driver,
  u7: FACET_DEFINITIONS.workaround,
  u8: ['unknown', 'active', 'pending']
};
const EIGHT_FACET_ALIASES = {
  i1: ['i1', 'scope'], i2: ['i2', 'consequence'], i3: ['i3'], i4: ['i4', 'containment'],
  u5: ['u5', 'deadline'], u6: ['u6', 'driver'], u7: ['u7', 'workaround'], u8: ['u8']
};

function ratio(numerator, denominator) {
  return denominator ? numerator / denominator : null;
}

function assert(condition, message) {
  if (!condition) throw new Error('Invalid accuracy corpus: ' + message);
}

export function normaliseEvaluationText(text) {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function validateCorpus(corpus) {
  assert(corpus && Array.isArray(corpus.cases), 'top-level `cases` must be an array');
  assert(corpus.cases.length > 0, '`cases` must not be empty');
  const ids = new Set();
  const ticketTexts = new Set();

  for (const [index, item] of corpus.cases.entries()) {
    const at = 'cases[' + index + ']';
    assert(item && typeof item === 'object', at + ' must be an object');
    assert(typeof item.id === 'string' && item.id.trim(), at + '.id must be a non-empty string');
    const normalisedId = item.id.trim().toLowerCase();
    assert(!ids.has(normalisedId), at + '.id must be unique (' + item.id + ')');
    ids.add(normalisedId);
    assert(typeof item.text === 'string' && item.text.trim(), at + '.text must be a non-empty string');
    const normalisedText = normaliseEvaluationText(item.text);
    assert(!ticketTexts.has(normalisedText), at + '.text must be unique after normalisation');
    ticketTexts.add(normalisedText);
    assert(item.expected && typeof item.expected === 'object', at + '.expected must be an object');
    assert(['assessed', 'unassessed'].includes(item.expected.assessmentStatus),
      at + '.expected.assessmentStatus must be assessed or unassessed');
    if (item.expected.priority !== undefined) {
      assert(PRIORITIES.includes(item.expected.priority), at + '.expected.priority is invalid');
    }
    if (item.expected.assessmentStatus === 'assessed') {
      assert(PRIORITIES.includes(item.expected.priority),
        at + '.expected.priority must be P1, P2, P3, or P4 for assessed cases');
    } else {
      assert(item.expected.priority === undefined,
        at + '.expected.priority is only allowed for assessed cases');
    }
    if (item.expected.impact !== undefined) {
      assert(LEVELS.includes(item.expected.impact), at + '.expected.impact is invalid');
    }
    if (item.expected.urgency !== undefined) {
      assert(LEVELS.includes(item.expected.urgency), at + '.expected.urgency is invalid');
    }
    if (item.expected.priority !== undefined &&
        item.expected.impact !== undefined &&
        item.expected.urgency !== undefined) {
      const matrixPriority = priorityFor(item.expected.impact, item.expected.urgency);
      assert(item.expected.priority === matrixPriority,
        at + '.expected.priority must match the authoritative matrix (' +
        item.expected.impact + '/' + item.expected.urgency + ' -> ' + matrixPriority + ')');
    }
    if (item.review !== undefined) {
      assert(item.review && typeof item.review === 'object',
        at + '.review must be an object');
      assert(REVIEW_CLASSIFICATIONS.includes(item.review.classification),
        at + '.review.classification must be one of: ' + REVIEW_CLASSIFICATIONS.join(', '));
      assert(typeof item.review.note === 'string' && item.review.note.trim(),
        at + '.review.note must be a non-empty review reason');
      if (item.review.acceptablePriorities !== undefined) {
        assert(Array.isArray(item.review.acceptablePriorities) &&
          item.review.acceptablePriorities.length > 0 &&
          item.review.acceptablePriorities.every((priority) => PRIORITIES.includes(priority)),
        at + '.review.acceptablePriorities must contain only P1, P2, P3, or P4');
        assert(item.expected.assessmentStatus === 'assessed',
          at + '.review.acceptablePriorities requires an assessed case');
        assert(item.review.acceptablePriorities.every((priority) => priority !== item.expected.priority),
          at + '.review acceptable alternatives must differ from the expected priority');
        assert(new Set(item.review.acceptablePriorities).size === item.review.acceptablePriorities.length,
          at + '.review.acceptablePriorities must not contain duplicates');
      }
    }
    for (const [facet, values] of Object.entries(FACET_DEFINITIONS)) {
      if (item.expected[facet] !== undefined) {
        assert(values.includes(item.expected[facet]),
          at + '.expected.' + facet + ' is invalid');
      }
    }
    for (const [facet, values] of Object.entries(EIGHT_FACET_DEFINITIONS)) {
      for (const alias of EIGHT_FACET_ALIASES[facet]) {
        if (item.expected[alias] !== undefined) {
          assert(values.includes(item.expected[alias]),
            at + '.expected.' + alias + ' is invalid');
        }
      }
    }
  }
  return corpus;
}

function actualFacet(result, facet) {
  if (facet === 'driver') return result.driver?.driver || 'unknown';
  if (facet === 'containment') {
    if (result.containment?.propagating || result.containment?.recurring) return 'spreading';
    if (result.containment?.contained) return 'contained';
    return 'unknown';
  }
  return result[facet] || 'unknown';
}

function actualEightFacet(result, facet) {
  if (facet === 'i1') return result.eightFacets?.i1Scope?.value || actualFacet(result, 'scope');
  if (facet === 'i2') return result.eightFacets?.i2Blocked?.blockedProcess?.level || actualFacet(result, 'consequence');
  if (facet === 'i3') {
    const value = result.eightFacets?.i3Irreversibility;
    if (!value) return 'unknown';
    if (value.modifiers?.exposureActive && value.risks?.includes('privacy')) return 'privacy-exposure';
    if (value.risks?.includes('safeguarding')) return 'safeguarding';
    if (value.risks?.includes('payroll') || value.risks?.includes('financial')) return 'financial-harm';
    if (value.risks?.includes('privacy')) return 'privacy-context';
    if (value.risks?.includes('dataIntegrity')) return 'incorrect-data';
    if (value.risks?.includes('security')) return 'security-compromise';
    if (value.risks?.includes('safety')) return 'safety';
    if (result.symptom === 'data-loss') return 'lost-data';
    if (result.symptom === 'unavailable') return 'unavailable';
    return 'unknown';
  }
  if (facet === 'i4') {
    const containment = result.eightFacets?.i4Containment?.containment || result.containment;
    if (!containment) return actualFacet(result, 'containment');
    if (containment.propagating) return 'spreading';
    if (containment.recurring) return 'recurring';
    if (containment.undetected) return 'unknown-extent';
    if (containment.contained) return 'contained';
    return 'unknown';
  }
  if (facet === 'u5') return result.eightFacets?.u5Deadline?.value || actualFacet(result, 'deadline');
  if (facet === 'u6') return result.eightFacets?.u6Driver?.driver?.driver || actualFacet(result, 'driver');
  if (facet === 'u7') return result.eightFacets?.u7Workaround?.workaround || actualFacet(result, 'workaround');
  if (facet === 'u8') return result.eightFacets?.u8HarmTiming?.harmTiming?.timing || result.harmTiming?.timing || 'unknown';
  return 'unknown';
}

function expectedEightFacet(item, facet) {
  return EIGHT_FACET_ALIASES[facet].map((alias) => item.expected[alias])
    .find((value) => value !== undefined);
}

function emptyConfusion() {
  return Object.fromEntries(OUTPUT_LABELS.map((expected) => [
    expected,
    Object.fromEntries(OUTPUT_LABELS.map((actual) => [actual, 0]))
  ]));
}

export function evaluateCases(cases, analyseTicket = analyse) {
  const confusion = emptyConfusion();
  const mismatches = [];
  const textCounts = new Map();
  for (const item of cases) {
    const text = normaliseEvaluationText(item.text);
    textCounts.set(text, (textCounts.get(text) || 0) + 1);
  }
  const duplicateTicketTexts = [...textCounts.values()].filter((count) => count > 1).length;
  const labelCount = (aliases) => cases.filter((item) =>
    aliases.some((alias) => item.expected[alias] !== undefined)).length;
  const labels = {
    i1: labelCount(EIGHT_FACET_ALIASES.i1),
    i2: labelCount(EIGHT_FACET_ALIASES.i2),
    i3: labelCount(EIGHT_FACET_ALIASES.i3),
    i4: labelCount(EIGHT_FACET_ALIASES.i4),
    u5: labelCount(EIGHT_FACET_ALIASES.u5),
    u6: labelCount(EIGHT_FACET_ALIASES.u6),
    u7: labelCount(EIGHT_FACET_ALIASES.u7),
    u8: labelCount(EIGHT_FACET_ALIASES.u8),
    impact: cases.filter((item) => item.expected.impact !== undefined).length,
    urgency: cases.filter((item) => item.expected.urgency !== undefined).length,
    priority: cases.filter((item) => item.expected.priority !== undefined).length
  };
  let actionable = 0;
  let statusCorrect = 0;
  let actualAssessed = 0;
  let assessedExpected = 0;
  let priorityCorrect = 0;
  let impactExpected = 0;
  let impactCorrect = 0;
  let urgencyExpected = 0;
  let urgencyCorrect = 0;
  let p1TruePositive = 0;
  let p1FalsePositive = 0;
  let p1FalseNegative = 0;
  let underPrioritisation = 0;
  let severeUnderPrioritisation = 0;
  let dangerousUnderPrioritisation = 0;
  let abstentionsOnAssessed = 0;
  const mismatchClassifications = Object.fromEntries(
    REVIEW_CLASSIFICATIONS.map((classification) => [classification, 0])
  );
  let unreviewedMismatchCount = 0;
  let acceptableAlternativeCount = 0;
  const facets = Object.fromEntries(Object.keys(FACET_DEFINITIONS).map((facet) => [
    facet, { labelled: 0, correct: 0, accuracy: null }
  ]));
  const facetMismatches = [];
  const eightFacets = Object.fromEntries(Object.keys(EIGHT_FACET_DEFINITIONS).map((facet) => [
    facet, { labelled: 0, correct: 0, accuracy: null }
  ]));
  const eightFacetMismatches = [];

  for (const item of cases) {
    const result = analyseTicket(item.text);
    const expectedStatus = item.expected.assessmentStatus;
    const actualStatus = result.assessmentStatus;
    const expectedPriority = expectedStatus === 'assessed'
      ? item.expected.priority
      : 'UNASSESSED';
    const actualPriority = result.suggestedPriority || 'UNASSESSED';

    if (result.suggestedPriority) actionable += 1;
    if (actualStatus === expectedStatus) statusCorrect += 1;
    if (actualStatus === 'assessed') actualAssessed += 1;
    confusion[expectedPriority][actualPriority] += 1;

    if (expectedStatus === 'assessed') {
      assessedExpected += 1;
      if (result.suggestedPriority === item.expected.priority) priorityCorrect += 1;
      if (!result.suggestedPriority) abstentionsOnAssessed += 1;
      // Treat abstention on an assessed expected case as below P4. This keeps
      // safety reporting conservative: no actionable priority is still a miss.
      const priorityGap = PRIORITY_RANK[item.expected.priority] -
        (PRIORITY_RANK[actualPriority] || 0);
      if (priorityGap > 0) underPrioritisation += 1;
      if (priorityGap >= 2) severeUnderPrioritisation += 1;
      if (priorityGap >= 2) {
        dangerousUnderPrioritisation += 1;
      }
    }

    if (item.expected.impact !== undefined) {
      impactExpected += 1;
      if (result.impact === item.expected.impact) impactCorrect += 1;
    }
    if (item.expected.urgency !== undefined) {
      urgencyExpected += 1;
      if (result.urgency === item.expected.urgency) urgencyCorrect += 1;
    }

    const facetMismatchStart = facetMismatches.length;
    for (const facet of Object.keys(FACET_DEFINITIONS)) {
      if (item.expected[facet] === undefined) continue;
      const expected = item.expected[facet];
      const actual = actualFacet(result, facet);
      facets[facet].labelled += 1;
      if (actual === expected) facets[facet].correct += 1;
      else facetMismatches.push({ id: item.id, facet, expected, actual });
    }
    const eightFacetMismatchStart = eightFacetMismatches.length;
    for (const facet of Object.keys(EIGHT_FACET_DEFINITIONS)) {
      const expected = expectedEightFacet(item, facet);
      if (expected === undefined) continue;
      const actual = actualEightFacet(result, facet);
      eightFacets[facet].labelled += 1;
      if (actual === expected) eightFacets[facet].correct += 1;
      else eightFacetMismatches.push({ id: item.id, facet, expected, actual });
    }
    const caseFacetMismatches = facetMismatches.slice(facetMismatchStart);
    const caseEightFacetMismatches = eightFacetMismatches.slice(eightFacetMismatchStart);

    const expectedP1 = expectedPriority === 'P1';
    const actualP1 = actualPriority === 'P1';
    if (expectedP1 && actualP1) p1TruePositive += 1;
    else if (!expectedP1 && actualP1) p1FalsePositive += 1;
    else if (expectedP1 && !actualP1) p1FalseNegative += 1;

    const outcomeMismatch =
      expectedStatus === 'assessed' &&
      (expectedPriority !== actualPriority ||
        (item.expected.impact !== undefined && item.expected.impact !== result.impact) ||
        (item.expected.urgency !== undefined && item.expected.urgency !== result.urgency));
    const review = item.review || {};
    const acceptablePriorities = Array.isArray(review.acceptablePriorities)
      ? review.acceptablePriorities : [];
    const acceptableAlternative =
      outcomeMismatch &&
      actualPriority !== expectedPriority &&
      acceptablePriorities.includes(actualPriority);
    if (acceptableAlternative) acceptableAlternativeCount += 1;
    const anyMismatch = outcomeMismatch || caseFacetMismatches.length > 0 ||
      caseEightFacetMismatches.length > 0;
    const classification = REVIEW_CLASSIFICATIONS.includes(review.classification)
      ? review.classification : null;
    if (anyMismatch) {
      if (classification) mismatchClassifications[classification] += 1;
      else unreviewedMismatchCount += 1;
      for (const mismatch of [...caseFacetMismatches, ...caseEightFacetMismatches]) {
        mismatch.classification = classification;
      }
    }

    if (expectedStatus !== actualStatus || expectedPriority !== actualPriority ||
        (item.expected.impact !== undefined && item.expected.impact !== result.impact) ||
        (item.expected.urgency !== undefined && item.expected.urgency !== result.urgency)) {
      mismatches.push({
        id: item.id,
        expected: {
          assessmentStatus: expectedStatus,
          priority: expectedPriority,
          impact: item.expected.impact,
          urgency: item.expected.urgency
        },
        actual: {
          assessmentStatus: actualStatus,
          priority: actualPriority,
          impact: result.impact,
          urgency: result.urgency,
          confidence: result.confidence
        },
        classification: outcomeMismatch ? classification : null,
        acceptablePriorities,
        acceptableAlternative
      });
    }
  }

  for (const facet of Object.values(facets)) {
    facet.accuracy = ratio(facet.correct, facet.labelled);
  }
  for (const facet of Object.values(eightFacets)) {
    facet.accuracy = ratio(facet.correct, facet.labelled);
  }

  const quality = {
    evaluationCases: cases.length,
    assessed: assessedExpected,
    unassessed: cases.length - assessedExpected,
    uniqueTicketTexts: textCounts.size,
    duplicateTicketTexts,
    labels,
    reviewedAlternatives: cases.filter((item) =>
      Array.isArray(item.review?.acceptablePriorities) && item.review.acceptablePriorities.length > 0).length,
    reviewedAlternativesDenominator: cases.length,
    reviewedMismatchCases: REVIEW_CLASSIFICATIONS.reduce((sum, classification) =>
      sum + mismatchClassifications[classification], 0) + unreviewedMismatchCount,
    acceptableAmbiguities: mismatchClassifications['acceptable ambiguity'],
    policyDisagreements: mismatchClassifications['policy disagreement deferred'],
    engineDefects: mismatchClassifications['engine defect'],
    groundTruthDefects: mismatchClassifications['ground-truth defect'],
    unreviewedMismatches: unreviewedMismatchCount
  };

  return {
    total: cases.length,
    actionable,
    coverage: ratio(actionable, cases.length),
    statusCorrect,
    assessmentStatusAccuracy: ratio(statusCorrect, cases.length),
    assessmentCounts: {
      expected: {
        assessed: assessedExpected,
        unassessed: cases.length - assessedExpected
      },
      actual: {
        assessed: actualAssessed,
        unassessed: cases.length - actualAssessed
      }
    },
    assessedExpected,
    unassessedExpected: cases.length - assessedExpected,
    actualAssessed,
    actualUnassessed: cases.length - actualAssessed,
    priorityCorrect,
    exactPriorityAccuracy: ratio(priorityCorrect, assessedExpected),
    impactCorrect,
    impactExpected,
    impactAccuracy: ratio(impactCorrect, impactExpected),
    urgencyCorrect,
    urgencyExpected,
    urgencyAccuracy: ratio(urgencyCorrect, urgencyExpected),
    p1: {
      precision: ratio(p1TruePositive, p1TruePositive + p1FalsePositive),
      recall: ratio(p1TruePositive, p1TruePositive + p1FalseNegative),
      truePositive: p1TruePositive,
      falsePositive: p1FalsePositive,
      falseNegative: p1FalseNegative,
      precisionDenominator: p1TruePositive + p1FalsePositive,
      recallDenominator: p1TruePositive + p1FalseNegative
    },
    underPrioritisation,
    severeUnderPrioritisation,
    // Backwards-compatible alias retained for consumers of the old report.
    dangerousUnderPrioritisation,
    abstentionsOnAssessed,
    facets,
    facetMismatches,
    eightFacets,
    eightFacetMismatches,
    mismatchClassifications,
    unreviewedMismatchCount,
    acceptableAlternativeCount,
    quality,
    confusion,
    mismatches
  };
}

function percent(value) {
  return value === null ? 'n/a' : (value * 100).toFixed(1) + '%';
}

function metric(correct, denominator) {
  return correct + '/' + denominator + ' (' + percent(ratio(correct, denominator)) + ')';
}

export function printReport(report, write = console.log) {
  const quality = report.quality;
  write('Evaluation cases: ' + quality.evaluationCases);
  write('Assessed / unassessed: ' + quality.assessed + ' / ' + quality.unassessed);
  write('Unique ticket texts: ' + quality.uniqueTicketTexts + '/' + quality.evaluationCases);
  write('Duplicate normalised ticket texts: ' + quality.duplicateTicketTexts);
  for (const facet of ['i1', 'i2', 'i3', 'i4', 'u5', 'u6', 'u7', 'u8']) {
    write('Cases with ' + facet.toUpperCase() + ' labels: ' + quality.labels[facet] + '/' + quality.evaluationCases);
  }
  write('Impact-labelled cases: ' + quality.labels.impact + '/' + quality.evaluationCases);
  write('Urgency-labelled cases: ' + quality.labels.urgency + '/' + quality.evaluationCases);
  write('Priority-labelled cases: ' + quality.labels.priority + '/' + quality.evaluationCases);
  write('Reviewed alternatives: ' + quality.reviewedAlternatives + '/' + quality.reviewedAlternativesDenominator);
  write('Acceptable ambiguities: ' + quality.acceptableAmbiguities + '/' + quality.reviewedMismatchCases + ' mismatches');
  write('Policy disagreements: ' + quality.policyDisagreements + '/' + quality.reviewedMismatchCases + ' mismatches');
  write('Engine defects: ' + quality.engineDefects + '/' + quality.reviewedMismatchCases + ' mismatches');
  write('Ground-truth defects: ' + quality.groundTruthDefects + '/' + quality.reviewedMismatchCases + ' mismatches');
  write('Unreviewed mismatches: ' + quality.unreviewedMismatches + '/' + quality.reviewedMismatchCases + ' mismatches');
  write('Accuracy corpus: ' + report.total + ' cases');
  write('Coverage: ' + metric(report.actionable, report.total));
  write('Assessment status counts: expected assessed ' + report.assessmentCounts.expected.assessed +
    ', unassessed ' + report.assessmentCounts.expected.unassessed +
    '; actual assessed ' + report.assessmentCounts.actual.assessed +
    ', unassessed ' + report.assessmentCounts.actual.unassessed);
  write('Assessment status accuracy: ' + metric(report.statusCorrect, report.total));
  write('Exact priority accuracy: ' + metric(report.priorityCorrect, report.assessedExpected));
  write('Impact accuracy: ' + metric(report.impactCorrect, report.impactExpected));
  write('Urgency accuracy: ' + metric(report.urgencyCorrect, report.urgencyExpected));
  write('P1 precision / recall: ' +
    metric(report.p1.truePositive, report.p1.precisionDenominator) + ' / ' +
    metric(report.p1.truePositive, report.p1.recallDenominator));
  write('Under-prioritisation (any): ' + report.underPrioritisation);
  write('Severe under-prioritisation (two or more levels): ' + report.severeUnderPrioritisation);
  write('P1 misses (false negatives): ' + report.p1.falseNegative);
  write('P1 false positives: ' + report.p1.falsePositive);
  write('Abstentions on assessed tickets: ' + report.abstentionsOnAssessed);
  for (const [name, facet] of Object.entries(report.facets || {})) {
    write(name[0].toUpperCase() + name.slice(1) + ' accuracy: ' + percent(facet.accuracy) +
      ' (' + facet.labelled + ' labelled)');
  }
  write('Eight-facet labelled metrics (correct / denominator)');
  for (const [name, facet] of Object.entries(report.eightFacets || {})) {
    write(name.toUpperCase() + ': ' + facet.correct + '/' + facet.labelled +
      ' (' + percent(facet.accuracy) + ')');
  }
  write('Mismatch classifications');
  for (const classification of REVIEW_CLASSIFICATIONS) {
    write('- ' + classification + ': ' + report.mismatchClassifications[classification]);
  }
  write('Acceptable alternative priorities: ' + report.acceptableAlternativeCount);
  write('Unreviewed mismatch gate: ' + report.unreviewedMismatchCount);
  write('Mismatches: ' + report.mismatches.length);
  write('Confusion matrix (expected rows, actual columns)');
  write(['expected', ...OUTPUT_LABELS].join('\t'));
  for (const expected of OUTPUT_LABELS) {
    write([expected, ...OUTPUT_LABELS.map((actual) => report.confusion[expected][actual])].join('\t'));
  }
  for (const mismatch of report.mismatches) {
    const fields = Object.keys(mismatch.expected)
      .filter((field) => mismatch.expected[field] !== undefined &&
        mismatch.expected[field] !== mismatch.actual[field]);
    const classification = mismatch.classification ? ' [' + mismatch.classification + ']' : '';
    const alternatives = mismatch.acceptablePriorities.length
      ? ' (acceptable alternatives: ' + mismatch.acceptablePriorities.join(', ') + ')' : '';
    write('- ' + mismatch.id + classification + alternatives + ': ' +
      fields.map((field) => field + ' expected ' +
        mismatch.expected[field] + ', got ' + mismatch.actual[field]).join('; '));
  }
  for (const mismatch of report.facetMismatches || []) {
    const classification = mismatch.classification ? ' [' + mismatch.classification + ']' : '';
    write('- ' + mismatch.id + ' / ' + mismatch.facet + classification + ': expected ' +
      mismatch.expected + ', got ' + mismatch.actual);
  }
  for (const mismatch of report.eightFacetMismatches || []) {
    const classification = mismatch.classification ? ' [' + mismatch.classification + ']' : '';
    write('- ' + mismatch.id + ' / ' + mismatch.facet + classification + ': expected ' +
      mismatch.expected + ', got ' + mismatch.actual);
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : null;
if (invokedPath === import.meta.url) {
  const corpusPath = process.argv[2];
  if (!corpusPath) {
    console.error('Usage: node tests/evaluate.mjs <corpus.json>');
    process.exitCode = 2;
  } else {
    try {
      const corpus = validateCorpus(JSON.parse(readFileSync(resolve(corpusPath), 'utf8')));
      const report = evaluateCases(corpus.cases);
      if (report.unreviewedMismatchCount) {
        throw new Error('Invalid accuracy corpus: ' + report.unreviewedMismatchCount +
          ' mismatch(es) lack an explicit review classification');
      }
      printReport(report);
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}
