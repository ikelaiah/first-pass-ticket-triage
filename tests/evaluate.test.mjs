import assert from 'node:assert/strict';
import { evaluateCases, validateCorpus } from './evaluate.mjs';

const cases = [
  { id: 'critical-correct', text: 'a', expected: { assessmentStatus: 'assessed', priority: 'P1', impact: 'high', urgency: 'high' } },
  { id: 'critical-under', text: 'b', expected: { assessmentStatus: 'assessed', priority: 'P1', impact: 'high', urgency: 'high' } },
  { id: 'normal-over', text: 'c', expected: { assessmentStatus: 'assessed', priority: 'P3', impact: 'medium', urgency: 'medium' } },
  { id: 'unassessed-correct', text: 'd', expected: { assessmentStatus: 'unassessed' } },
  { id: 'high-abstained', text: 'e', expected: { assessmentStatus: 'assessed', priority: 'P2', impact: 'high', urgency: 'medium' } }
];

const actual = {
  a: { assessmentStatus: 'assessed', suggestedPriority: 'P1', impact: 'high', urgency: 'high' },
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
assert.equal(report.dangerousUnderPrioritisation, 1);
assert.equal(report.confusion.P1.P3, 1);
assert.equal(report.confusion.P2.UNASSESSED, 1);
assert.equal(report.confusion.UNASSESSED.UNASSESSED, 1);

console.log('PASS - evaluation metrics self-test');
