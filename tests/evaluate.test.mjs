import assert from 'node:assert/strict';
import { evaluateCases, printReport, validateCorpus } from './evaluate.mjs';

const cases = [
  { id: 'critical-correct', text: 'a', expected: { assessmentStatus: 'assessed', priority: 'P1', impact: 'high', urgency: 'high', scope: 'all-schools', consequence: 'blocked', deadline: 'today', driver: 'operational', workaround: 'no' } },
  { id: 'critical-under', text: 'b', expected: { assessmentStatus: 'assessed', priority: 'P1', impact: 'high', urgency: 'high' }, review: { classification: 'engine defect' } },
  { id: 'normal-over', text: 'c', expected: { assessmentStatus: 'assessed', priority: 'P3', impact: 'medium', urgency: 'medium' }, review: { classification: 'policy disagreement deferred', acceptablePriorities: ['P1'] } },
  { id: 'unassessed-correct', text: 'd', expected: { assessmentStatus: 'unassessed' } },
  { id: 'high-abstained', text: 'e', expected: { assessmentStatus: 'assessed', priority: 'P2', impact: 'high', urgency: 'medium' }, review: { classification: 'engine defect' } }
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
assert.equal(report.assessedExpected, 4);
assert.equal(report.unassessedExpected, 1);
assert.equal(report.actualAssessed, 3);
assert.equal(report.actualUnassessed, 2);
assert.equal(report.priorityCorrect, 1);
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
assert.equal(report.mismatchClassifications['engine defect'], 2);
assert.equal(report.mismatchClassifications['policy disagreement deferred'], 1);
assert.equal(report.unreviewedMismatchCount, 0);
assert.equal(report.acceptableAlternativeCount, 1);

assert.throws(() => validateCorpus({
  cases: [{ id: 'bad-facet', text: 'test', expected: { assessmentStatus: 'assessed', priority: 'P4', scope: 'planet' } }]
}), /scope/);

assert.throws(() => validateCorpus({
  cases: [{
    id: 'inconsistent-priority',
    text: 'test',
    expected: { assessmentStatus: 'assessed', priority: 'P2', impact: 'high', urgency: 'high' }
  }]
}), /priority.*matrix|matrix.*priority/i);

const output = [];
printReport(report, (line) => output.push(line));
assert(output.some((line) => line.startsWith('Confusion matrix')));
assert(output.some((line) => line.includes('P1') && line.includes('UNASSESSED')));
assert(output.some((line) => line.startsWith('Scope accuracy:')));
assert(output.some((line) => line === 'Exact priority accuracy: 1/4 (25.0%)'));
assert(output.some((line) => line === 'Unreviewed outcome mismatches: 0'));
assert(output.some((line) => line.includes('normal-over') && line.includes('acceptable alternatives: P1')));
assert(output.some((line) => line.includes('critical-under') && line.includes('priority expected P1, got P3')));
assert(!output.some((line) => line.includes('critical-correct: a')));

const eightCase = {
  id: 'eight-facet-labelled',
  text: 'ticket',
  expected: {
    assessmentStatus: 'assessed', priority: 'P4',
    i3: 'privacy-context', i4: 'contained', u8: 'active'
  }
};
validateCorpus({ cases: [eightCase] });
const eightReport = evaluateCases([eightCase], () => ({
  assessmentStatus: 'assessed', suggestedPriority: 'P4', impact: 'low', urgency: 'low',
  eightFacets: {
    i3Irreversibility: { risks: ['privacy'], modifiers: { exposureActive: false } },
    i4Containment: { containment: { contained: true, propagating: false, recurring: false, undetected: false } },
    u8HarmTiming: { harmTiming: { timing: 'active' } }
  }
}));
assert.equal(eightReport.eightFacets.i3.labelled, 1);
assert.equal(eightReport.eightFacets.i3.accuracy, 1);
assert.equal(eightReport.eightFacets.i4.accuracy, 1);
assert.equal(eightReport.eightFacets.u8.accuracy, 1);
const eightOutput = [];
printReport(eightReport, (line) => eightOutput.push(line));
assert(eightOutput.some((line) => line === 'I3: 1/1 (100.0%)'));

const securityExposureCase = {
  id: 'security-exposure-labelled',
  text: 'ticket',
  expected: {
    assessmentStatus: 'assessed', priority: 'P4',
    i3: 'security-compromise'
  }
};
const securityExposureReport = evaluateCases([securityExposureCase], () => ({
  assessmentStatus: 'assessed', suggestedPriority: 'P4', impact: 'low', urgency: 'low',
  eightFacets: {
    i3Irreversibility: { risks: ['security'], modifiers: { exposureActive: true } }
  }
}));
assert.equal(securityExposureReport.eightFacets.i3.accuracy, 1);

console.log('PASS - evaluation metrics self-test');
