/**
 * Follow-up questions and missing information.
 *
 * The questions are ranked in three kinds: diagnostic (changes what to do
 * next), priority (an answer could move the matrix cell, verified by re-running
 * the scoring with each hypothetical answer), and confidence (narrows the
 * assessment but keeps the cell). The list is capped at six.
 */
import { has } from './negation.js';
import { deploymentProfile } from '../deployment.js';
import { SEVERITY } from './symptom.js';
import { priorityFor } from './priority-matrix.js';
import { CONTEXT_ELSEWHERE_PHRASES } from '../data/phrases.js';

/** @returns {{ missing: string[], questions: string[], meta: object[], summary: string }} */
export function buildMissingInformation(context) {
  const {
    scopeResult,
    deadlineResult,
    workaroundResult,
    systemResult,
    symptom,
    risks,
    modifiers,
    urgencyResult,
    impactResult,
    doc,
    isQuestion,
    inScope,
    containment,
    driver,
    harmTiming,
    blockedProcess,
    simulate,
    currentPriority,
    currentImpact
  } = context;

  const missing = [];
  const questions = [];
  const meta = [];
  const pq = (tests) =>
    simulate && tests.some((t) => simulate(t) !== currentPriority) ? 'priority' : 'confidence';
  const addQuestion = (q, kind = 'confidence') => {
    if (questions.includes(q)) return;
    questions.push(q);
    meta.push({ text: q, kind });
  };

  if (!inScope) {
    return {
      missing: ['Whether this describes an IT or application-support request'],
      questions: ['What IT system, application, device, or service needs support?'],
      meta: [
        { text: 'What IT system, application, device, or service needs support?', kind: 'priority' }
      ],
      summary:
        'No IT system, technical symptom or support topic was recognised. Treat this ' +
        'as unassessed rather than as a valid low-priority ticket.'
    };
  }

  if (isQuestion) {
    return {
      missing: ['Whether the answer is needed for something with a deadline'],
      questions: [
        'Is this general information, or is it needed for something with a deadline?',
        'Is anything currently blocked while waiting for the answer?'
      ],
      meta: [
        {
          text: 'Is this general information, or is it needed for something with a deadline?',
          kind: 'priority'
        },
        { text: 'Is anything currently blocked while waiting for the answer?', kind: 'confidence' }
      ],
      summary:
        'This reads as a question rather than a fault, so the usual incident facts ' +
        '(scope, workaround, outage) do not decide it.'
    };
  }

  if (doc && has(doc, CONTEXT_ELSEWHERE_PHRASES)) {
    missing.push('The background the request refers to is not in the ticket');
    addQuestion(
      'What was previously discussed or agreed that this request refers to?',
      'diagnostic'
    );
  }
  if (!blockedProcess && symptom.severity >= SEVERITY.FAILURE) {
    addQuestion(
      'What can they not do right now that they could do yesterday? (the blocked business process, not just the symptom)',
      'diagnostic'
    );
  }
  if (!scopeResult.explicit) {
    missing.push('How many users, teams or schools are affected');
    addQuestion(
      'Is this affecting one person, one school, several schools or all ' +
        deploymentProfile.schoolCount +
        ' schools?',
      pq([{ scope: 'all-schools' }, { scope: 'one-school' }])
    );
  }
  if (deadlineResult.deadline === 'unknown') {
    missing.push('When the work is required by');
    addQuestion('When is this required by?', pq([{ deadline: 'today' }, { deadline: 'days-2-5' }]));
    addQuestion('What happens if this is not resolved today?', pq([{ deadline: 'today' }]));
  }
  if (workaroundResult.workaround === 'unknown') {
    missing.push('Whether a workaround or manual process exists');
    addQuestion(
      'Is there a workaround or manual process available?',
      pq([{ workaround: 'no' }, { workaround: 'yes' }])
    );
  }
  if (!systemResult.primary) {
    missing.push('Which system or application is affected');
    addQuestion('Which system or application is affected?');
  }
  if (urgencyResult.claimedOnly) {
    missing.push('The business consequence behind the stated urgency');
    addQuestion(
      'What is the business consequence if this waits until tomorrow?',
      pq([{ deadline: 'today' }])
    );
  }
  if (symptom.isDataIssue && !modifiers.propagating) {
    addQuestion(
      'Is incorrect information visible to users, or being used for decisions?',
      pq([{ exposureActive: true }])
    );
    addQuestion('Is the issue still occurring, or has it stopped?');
  }
  if ((risks.payroll || risks.financial) && deadlineResult.deadline === 'unknown') {
    missing.push('The next payroll or payment cutoff');
    addQuestion(
      'Is a payroll or payment cutoff affected, and when is it?',
      pq([{ deadline: 'today' }])
    );
  }
  if ((risks.privacy || risks.security) && !modifiers.exposureActive) {
    missing.push('Whether anyone has actually accessed the information');
    addQuestion(
      'Has anyone outside the intended audience actually seen the information?',
      pq([{ exposureActive: true }])
    );
  }
  if (symptom.isDegraded) {
    addQuestion('Can users still complete their work, or is it effectively unavailable?');
  }
  if (
    driver &&
    driver.driver === 'unknown' &&
    deadlineResult.deadline !== 'unknown' &&
    deadlineResult.deadline !== 'none'
  ) {
    addQuestion(
      'What creates the deadline — a requirement (statutory/operational) or a preference?',
      urgencyResult.floorApplied && priorityFor(currentImpact, 'low') !== currentPriority
        ? 'priority'
        : 'confidence'
    );
  }
  if (workaroundResult.workaround === 'yes' && !workaroundResult.costPerDay) {
    addQuestion(
      'What does the workaround cost per day — how many staff or hours does manual processing take?'
    );
  }
  if (
    harmTiming &&
    harmTiming.timing === 'unknown' &&
    (risks.privacy || risks.security || symptom.severity >= SEVERITY.DATA)
  ) {
    addQuestion(
      'Is harm happening now, or waiting to happen? (expired/active vs expiring/pending)',
      pq([{ exposureActive: true }])
    );
  }
  if (
    containment &&
    !containment.propagating &&
    !containment.contained &&
    (symptom.isDataIssue || risks.dataIntegrity)
  ) {
    addQuestion(
      'Is this contained to one record/family, or could it be spreading?',
      pq([{ propagating: true }])
    );
  }

  let summary = '';
  if (missing.length) {
    const impactKnown = impactResult.impact !== 'low' || scopeResult.explicit;
    summary =
      impactKnown && deadlineResult.deadline === 'unknown'
        ? 'The impact can be estimated, but urgency cannot be determined confidently because no ' +
          'deadline or business consequence was provided.'
        : 'Some information needed for a confident assessment is missing. The suggestion is based ' +
          'on what the request actually states.';
  }

  const KIND_ORDER = { diagnostic: 0, priority: 1, confidence: 2 };
  const paired = meta.map((m, i) => [m, i]);
  paired.sort((a, b) => KIND_ORDER[a[0].kind] - KIND_ORDER[b[0].kind] || a[1] - b[1]);
  const top = paired.slice(0, 6);
  return { missing, questions: top.map(([m]) => m.text), meta: top.map(([m]) => m), summary };
}

export default buildMissingInformation;
