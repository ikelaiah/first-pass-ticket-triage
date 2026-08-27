/**
 * Work type classification.
 *
 * Work type is independent of priority: a feature request and an outage both
 * run through the same matrix. Keeping them separate is what stops strategic
 * work from being permanently parked at P4.
 */
import { scan } from './negation.js';
import { WORK_TYPES } from '../data/phrases.js';
import { SEVERITY } from './symptom.js';

const BY_ID = new Map(WORK_TYPES.map((t) => [t.id, t]));

export function workTypeLabel(id) {
  const t = BY_ID.get(id);
  return t ? t.label : 'Unknown';
}

const ENTRIES = WORK_TYPES.map((t) => ({ m: t.m, v: t.id, label: t.label }));

/**
 * @param {object} doc
 * @param {object} context { symptom, risks, modifiers, expectedBehaviour }
 * @returns {{ workType, label, scores, evidence }}
 */
export function detectWorkType(doc, context = {}) {
  const symptom = context.symptom || { hasFailure: false, isDataIssue: false, severity: 0 };
  const risks = context.risks || {};
  const modifiers = context.modifiers || {};

  const scores = new Map();
  const quotes = new Map();
  for (const hit of scan(doc, ENTRIES)) {
    if (hit.negated) continue;
    scores.set(hit.entry.v, (scores.get(hit.entry.v) || 0) + 1);
    if (!quotes.has(hit.entry.v)) quotes.set(hit.entry.v, hit.quote);
  }

  const score = (id) => scores.get(id) || 0;
  let workType = null;
  let reason = '';

  if (context.expectedBehaviour) {
    workType = 'expected-behaviour';
    reason = 'matches a known scheduled process';
  } else if (score('documentation') > 0 && !symptom.hasFailure) {
    workType = 'documentation';
    reason = 'a question or documentation request';
  } else if (!symptom.hasFailure && (score('feature-request') > 0 || score('enhancement') > 0)) {
    workType = score('feature-request') >= score('enhancement') ? 'feature-request' : 'enhancement';
    reason = 'new or improved functionality requested';
  } else if (!symptom.hasFailure && score('service-request') > 0 &&
             score('service-request') >= score('compliance-safeguarding') &&
             score('service-request') >= score('security-privacy')) {
    // "Please provide an extract for the audit" is a request, not a compliance case.
    workType = 'service-request';
    reason = 'someone is asking for something to be provided or set up';
  } else if (score('security-privacy') > 0 && (risks.security || risks.privacy) && modifiers.exposureActive) {
    workType = 'security-privacy';
    reason = 'information appears to be exposed';
  } else if (score('compliance-safeguarding') > 0 && (risks.safeguarding || risks.compliance)) {
    workType = 'compliance-safeguarding';
    reason = 'a compliance or safeguarding obligation is involved';
  } else if (context.differential && score('problem-investigation') > 0) {
    // One record fails while a comparable one works: that is a diagnosis job,
    // not a service-restoration job.
    workType = 'problem-investigation';
    reason = 'one record behaves differently from a comparable one';
  } else if (symptom.hasFailure) {
    workType = 'incident';
    reason = 'something that was working has failed';
  } else if (score('data-remediation') > 0) {
    workType = 'data-remediation';
    reason = 'existing data needs correcting';
  } else if (scores.size) {
    workType = [...scores.entries()].sort((a, b) => b[1] - a[1])[0][0];
    reason = 'best match on the request wording';
  } else if (symptom.severity >= SEVERITY.DEGRADED) {
    workType = 'incident';
    reason = 'a technical symptom was described';
  } else {
    workType = 'unknown';
    reason = 'not enough information to classify the request';
  }

  return {
    workType,
    label: workTypeLabel(workType),
    reason,
    scores,
    evidence: quotes.has(workType)
      ? [{ quote: quotes.get(workType), meaning: workTypeLabel(workType), source: 'work-type' }]
      : []
  };
}
