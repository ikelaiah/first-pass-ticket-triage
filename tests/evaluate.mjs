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

const PRIORITIES = ['P1', 'P2', 'P3', 'P4'];
const OUTPUT_LABELS = [...PRIORITIES, 'UNASSESSED'];
const LEVELS = ['low', 'medium', 'high'];
const PRIORITY_RANK = { P1: 4, P2: 3, P3: 2, P4: 1 };

function ratio(numerator, denominator) {
  return denominator ? numerator / denominator : null;
}

function assert(condition, message) {
  if (!condition) throw new Error('Invalid accuracy corpus: ' + message);
}

export function validateCorpus(corpus) {
  assert(corpus && Array.isArray(corpus.cases), 'top-level `cases` must be an array');
  assert(corpus.cases.length > 0, '`cases` must not be empty');
  const ids = new Set();

  for (const [index, item] of corpus.cases.entries()) {
    const at = 'cases[' + index + ']';
    assert(item && typeof item === 'object', at + ' must be an object');
    assert(typeof item.id === 'string' && item.id.trim(), at + '.id must be a non-empty string');
    assert(!ids.has(item.id), at + '.id must be unique (' + item.id + ')');
    ids.add(item.id);
    assert(typeof item.text === 'string' && item.text.trim(), at + '.text must be a non-empty string');
    assert(item.expected && typeof item.expected === 'object', at + '.expected must be an object');
    assert(['assessed', 'unassessed'].includes(item.expected.assessmentStatus),
      at + '.expected.assessmentStatus must be assessed or unassessed');
    if (item.expected.assessmentStatus === 'assessed') {
      assert(PRIORITIES.includes(item.expected.priority),
        at + '.expected.priority must be P1, P2, P3, or P4');
    }
    if (item.expected.impact !== undefined) {
      assert(LEVELS.includes(item.expected.impact), at + '.expected.impact is invalid');
    }
    if (item.expected.urgency !== undefined) {
      assert(LEVELS.includes(item.expected.urgency), at + '.expected.urgency is invalid');
    }
  }
  return corpus;
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
  let actionable = 0;
  let statusCorrect = 0;
  let assessedExpected = 0;
  let priorityCorrect = 0;
  let impactExpected = 0;
  let impactCorrect = 0;
  let urgencyExpected = 0;
  let urgencyCorrect = 0;
  let p1TruePositive = 0;
  let p1FalsePositive = 0;
  let p1FalseNegative = 0;
  let dangerousUnderPrioritisation = 0;
  let abstentionsOnAssessed = 0;

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
    confusion[expectedPriority][actualPriority] += 1;

    if (expectedStatus === 'assessed') {
      assessedExpected += 1;
      if (result.suggestedPriority === item.expected.priority) priorityCorrect += 1;
      if (!result.suggestedPriority) abstentionsOnAssessed += 1;
      if (result.suggestedPriority &&
          PRIORITY_RANK[item.expected.priority] - PRIORITY_RANK[result.suggestedPriority] >= 2) {
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

    const expectedP1 = expectedPriority === 'P1';
    const actualP1 = actualPriority === 'P1';
    if (expectedP1 && actualP1) p1TruePositive += 1;
    else if (!expectedP1 && actualP1) p1FalsePositive += 1;
    else if (expectedP1 && !actualP1) p1FalseNegative += 1;

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
        }
      });
    }
  }

  return {
    total: cases.length,
    coverage: ratio(actionable, cases.length),
    assessmentStatusAccuracy: ratio(statusCorrect, cases.length),
    exactPriorityAccuracy: ratio(priorityCorrect, assessedExpected),
    impactAccuracy: ratio(impactCorrect, impactExpected),
    urgencyAccuracy: ratio(urgencyCorrect, urgencyExpected),
    p1: {
      precision: ratio(p1TruePositive, p1TruePositive + p1FalsePositive),
      recall: ratio(p1TruePositive, p1TruePositive + p1FalseNegative),
      truePositive: p1TruePositive,
      falsePositive: p1FalsePositive,
      falseNegative: p1FalseNegative
    },
    dangerousUnderPrioritisation,
    abstentionsOnAssessed,
    confusion,
    mismatches
  };
}

function percent(value) {
  return value === null ? 'n/a' : (value * 100).toFixed(1) + '%';
}

export function printReport(report, write = console.log) {
  write('Accuracy corpus: ' + report.total + ' cases');
  write('Coverage: ' + percent(report.coverage));
  write('Assessment status accuracy: ' + percent(report.assessmentStatusAccuracy));
  write('Exact priority accuracy: ' + percent(report.exactPriorityAccuracy));
  write('Impact accuracy: ' + percent(report.impactAccuracy));
  write('Urgency accuracy: ' + percent(report.urgencyAccuracy));
  write('P1 precision / recall: ' + percent(report.p1.precision) + ' / ' + percent(report.p1.recall));
  write('Dangerous under-prioritisations: ' + report.dangerousUnderPrioritisation);
  write('Abstentions on assessed tickets: ' + report.abstentionsOnAssessed);
  write('Mismatches: ' + report.mismatches.length);
  for (const mismatch of report.mismatches) {
    write('- ' + mismatch.id + ': expected ' + mismatch.expected.priority +
      ', got ' + mismatch.actual.priority);
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
      printReport(evaluateCases(corpus.cases));
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}
