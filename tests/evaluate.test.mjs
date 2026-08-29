import assert from 'node:assert/strict';
import { evaluateCases, printReport, validateCorpus } from './evaluate.mjs';

const cases = [
  { id: 'critical-correct', text: 'a', expected: { assessmentStatus: 'assessed', priority: 'P1', impact: 'high', urgency: 'high', scope: 'all-schools', consequence: 'blocked', deadline: 'today', driver: 'operational', workaround: 'no' } },
  { id: 'critical-under', text: 'b', expected: { assessmentStatus: 'assessed', priority: 'P1', impact: 'high', urgency: 'high' } },
  { id: 'normal-over', text: 'c', expected: { assessmentStatus: 'assessed', priority: 'P3', impact: 'medium', urgency: 'medium' } },
  { id: 'unassessed-correct', text: 'd', expected: { assessmentStatus: 'unassessed' } },
  { id: 'high-abstained', text: 'e', expected: { assessmentStatus: 'assessed', priority: 'P2', impact: 'high', urgency: 'medium' } }
];

const actual = {
  a: { assessmentStatus: 'assessed', suggestedPriority: 'P1', impact: 'high', urgency: 'high', scope: 'all-schools', consequence: 'blocked', deadline: 'today', driver: { driver: 'operational' }, workaround: 'no' },
  b: { assessmentStatus: 'assessed', suggestedPriority: 'P3', impact: 'low', urgency: 'medium' },
  c: { assessmentStatus: 'assessed', suggestedPriority: 'P1', impact: 'high', urgency: 'high' },
  d: { assessmentStatus: 'unassessed', suggestedPriority: null, impact: 'low', urgency: 'low' },
  e: { assessmentStatus: 'unassessed', suggestedPriority: null, impact: 'low', urgency: 'low' }
};

validateCorpus({ cases });
assert.throws(() => validateCorpus({ cases: [{ id: 'broken' }] }), /text/);

const report = evaluateCases(cases, (text) => actual[text]);
assert.equal(report.total, 5);
assert.equal(report.coverage, 0.6);
assert.equal(report.assessmentStatusAccuracy, 0.8);
assert.equal(report.exactPriorityAccuracy, 0.25);
assert.equal(report.p1.precision, 0.5);
assert.equal(report.p1.recall, 0.5);
assert.equal(report.underPrioritisation, 2);
assert.equal(report.severeUnderPrioritisation, 2);
assert.equal(report.dangerousUnderPrioritisation, 2);
assert.equal(report.p1.falseNegative, 1);
assert.equal(report.p1.falsePositive, 1);
assert.equal(report.confusion.P1.P3, 1);
assert.equal(report.confusion.P2.UNASSESSED, 1);
assert.equal(report.confusion.UNASSESSED.UNASSESSED, 1);
assert.equal(report.facets.scope.labelled, 1);
assert.equal(report.facets.scope.accuracy, 1);
assert.equal(report.facets.consequence.accuracy, 1);
assert.equal(report.facets.driver.accuracy, 1);
assert.equal(report.facetMismatches.length, 0);

assert.throws(() => validateCorpus({
  cases: [{ id: 'bad-facet', text: 'test', expected: { assessmentStatus: 'assessed', priority: 'P4', scope: 'planet' } }]
}), /scope/);

const output = [];
printReport(report, (line) => output.push(line));
assert(output.some((line) => line.startsWith('Confusion matrix')));
assert(output.some((line) => line.includes('P1') && line.includes('UNASSESSED')));
assert(output.some((line) => line.startsWith('Scope accuracy:')));
assert(!output.some((line) => line.includes('critical-correct: a')));

console.log('PASS - evaluation metrics self-test');
