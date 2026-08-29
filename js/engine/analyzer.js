/**
 * The analysis pipeline.
 *
 *   ticket text
 *      -> evidence          (systems, scope, workaround, deadline, symptom, domain, risks)
 *      -> Impact + Urgency  (weighted scoring, then critical-risk modifiers)
 *      -> priority matrix   (the only place a P number is decided)
 *      -> explanation       (reasoning, missing information, follow-up questions)
 *
 * Everything happens in this browser. No network call exists in this module or
 * anywhere else in the application.
 */
import { createDocument, has, scanPositive } from './negation.js';
import { organisationConfig } from '../config.js';
import { detectSystems, describeSystems } from '../data/systems.js';
import { detectScope, scopeDefinition, scopeLabel } from './scope.js';
import { detectWorkaround, workaroundLabel } from './workaround.js';
import { detectDeadline, deadlineLabel } from './deadline.js';
import { detectSymptom, SEVERITY } from './symptom.js';
import { detectDomain, domainLabel } from './domain.js';
import { detectWorkType, workTypeLabel } from './work-type.js';
import { detectRisks, emptyRisks, RISK_LABELS } from './risks.js';
import { assessImpact } from './impact.js';
import { assessUrgency } from './urgency.js';
import { assessConfidence } from './confidence.js';
import {
  priorityFor, priorityDefinition, raiseLevel, lowerLevel, LEVEL_LABELS
} from './priority-matrix.js';
import {
  IMMEDIATE_NEED_PATTERNS, CONTEXT_ELSEWHERE_PHRASES,
  WORKING_COMPARATOR_PHRASES, CONTRAST_PHRASES,
  ACTIVE_INCIDENT_PHRASES, ESCALATION_PHRASES,
  RECURRENCE_PHRASES, UNDETECTED_PHRASES, SLA_BREACH_PHRASES,
  BLOCKED_PROCESS_PHRASES
} from '../data/phrases.js';
import { detectContainment } from './containment.js';
import { detectDriver } from './driver.js';
import { detectHarmTiming } from './harm-timing.js';
import { prepareDecisionContext } from './context.js';

const TIME_12H = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/g;
const TIME_24H = /\b([01]?\d|2[0-3]):([0-5]\d)\b/g;
const CLOCK_TOKEN = '(?:\\d{1,2}(?::\\d{2})?\\s*(?:am|pm)|(?:[01]?\\d|2[0-3]):[0-5]\\d)';
const SCHEDULE_EVENT_TIME = new RegExp(
  '\\b(?:added|created|updated|entered|registered|enrolled|assigned|provisioned|' +
  'imported|uploaded|set\\s+up)\\b' +
  '(?=[^.!?;\\n]{0,90}\\b(?:staff|account|record|user|student|enrolment|application|' +
  'employee|teacher|class|member|contact)\\b)' +
  '(?:(?!\\b(?:but|and|because|while|although)\\b)[^.!?;\\n]){0,90}?' +
  '\\bat\\s+(' + CLOCK_TOKEN + ')\\b', 'g'
);
const PAST_DATE_MARKER = /\b(?:yesterday|last\s+(?:night|evening|week|month|monday|tuesday|wednesday|thursday|friday|saturday|sunday)|previous(?:ly)?|earlier|the day before)\b/;
const EVENT_NEGATION = /\b(?:not|never|no|did\s+not|didn['’]t|was\s+not|wasn['’]t|were\s+not|weren['’]t)\s+(?:\w+\s+){0,3}$/;

function toMinutes(hours, minutes, meridiem) {
  let h = hours % 12;
  if (meridiem === 'pm') h += 12;
  if (!meridiem) h = hours;
  return h * 60 + (minutes || 0);
}

function parseClockTimes(text) {
  const found = [];
  let m;
  TIME_12H.lastIndex = 0;
  while ((m = TIME_12H.exec(text)) !== null) {
    found.push({
      quote: m[0],
      minutes: toMinutes(parseInt(m[1], 10), parseInt(m[2] || '0', 10), m[3])
    });
  }
  TIME_24H.lastIndex = 0;
  while ((m = TIME_24H.exec(text)) !== null) {
    found.push({
      quote: m[0],
      minutes: toMinutes(parseInt(m[1], 10), parseInt(m[2], 10), null)
    });
  }
  return found;
}

function scheduledTimeToMinutes(value) {
  const [h, min] = String(value).split(':').map((n) => parseInt(n, 10));
  return (h || 0) * 60 + (min || 0);
}

function hasMissingRecordSignal(symptom, text) {
  const missingIds = ['missing-data', 'partial-data', 'not-synchronising', 'not-writing'];
  return symptom.all.some((item) => missingIds.includes(item.id)) ||
    /\b(?:not|never)\s+(?:in|on|showing in|appearing in)\s+(?:canvas|edumate)\b/.test(text);
}

function findScheduledCreationTime(text, job, scheduled) {
  const clauses = text.split(/[.!?;\n]+/);
  for (const clause of clauses) {
    if (PAST_DATE_MARKER.test(clause)) continue;
    SCHEDULE_EVENT_TIME.lastIndex = 0;
    let match;
    while ((match = SCHEDULE_EVENT_TIME.exec(clause)) !== null) {
      const event = match[0];
      const beforeEvent = clause.slice(0, match.index);
      if (EVENT_NEGATION.test(beforeEvent)) continue;
      if (!job.keywords.some((keyword) => event.includes(keyword))) continue;
      if (/\b(?:meeting|appointment|lesson|assessment|access)\b/.test(event)) continue;
      const time = parseClockTimes(match[1])[0];
      if (time && time.minutes > scheduled) return time;
    }
  }
  return null;
}

/**
 * "Added at 10am, hasn't appeared yet" - when the record was created after the
 * scheduled run, nothing has failed yet.
 */
export function detectExpectedBehaviour(doc, symptom, config = organisationConfig) {
  if (symptom.severity > SEVERITY.DATA) return null;
  if (!hasMissingRecordSignal(symptom, doc.text)) return null;

  for (const job of config.scheduledJobs) {
    const hits = job.keywords.filter((k) => doc.text.includes(k)).length;
    const needed = job.minKeywords || job.keywords.length;
    if (hits < needed) continue;

    const scheduled = scheduledTimeToMinutes(job.scheduledTime);
    const after = findScheduledCreationTime(doc.text, job, scheduled);
    if (!after) continue;

    return {
      job,
      quote: after.quote,
      scheduledTime: job.scheduledTime,
      note: job.note,
      reason:
        'The record was created at ' + after.quote + ', after the ' + job.scheduledTime +
        ' "' + job.name + '" run. There is currently no evidence that the ' +
        'integration failed.'
    };
  }
  return null;
}

/**
 * Some questions are already answered by the configuration. "What time does the
 * casual staff sync run?" is a P4 - and the answer is in `scheduledJobs`, so the
 * tool says so instead of making someone go and look it up.
 */
export function findKnownAnswer(doc, isQuestion, config = organisationConfig) {
  if (!isQuestion) return null;
  for (const job of config.scheduledJobs) {
    if (!job.note) continue;
    const hits = job.keywords.filter((k) => doc.text.includes(k)).length;
    if (hits >= (job.minKeywords || job.keywords.length)) {
      return { job: job.name, scheduledTime: job.scheduledTime, answer: job.note };
    }
  }
  return null;
}

/**
 * Symptoms that mean "this is not here" rather than "this broke". For these,
 * the record may never have existed correctly upstream - which is a different
 * investigation from a failing integration.
 */
const SOURCE_CHECK_SYMPTOMS = [
  'missing-data', 'wrong-record-type', 'access-denied', 'not-synchronising',
  'partial-data', 'not-writing', 'action-blocked'
];

/**
 * "Missing from Canvas" is usually a question about Edumate.
 * Returns the upstream system to check first, if there is one.
 */
export function findSourceOfTruth(systemResult, symptom, config = organisationConfig, doc = null) {
  if (!SOURCE_CHECK_SYMPTOMS.includes(symptom.symptom)) return null;

  const present = new Set((systemResult.systems || []).map((s) => s.id));
  for (const flow of config.dataFlows || []) {
    // Only useful when the downstream system is the one being complained about
    // and the upstream one has not already been named as the problem.
    if (present.has(flow.downstream) && !present.has(flow.source)) {
      // Some flows only carry certain kinds of record.
      if (flow.entities && doc &&
          !flow.entities.some((e) => new RegExp('\\b' + e + '\\b').test(doc.text))) continue;
      const downstream = config.systems[flow.downstream];
      const source = config.systems[flow.source];
      if (!downstream || !source) continue;
      return {
        downstream: downstream.name,
        source: source.name,
        note: flow.note
      };
    }
  }
  return null;
}

/**
 * One record works, a comparable one does not. This changes the diagnostic
 * question, but it must not overrule explicit evidence about breadth.
 */
export function detectDifferential(doc, symptom, scopeResult = null) {
  const working = scanPositive(doc, WORKING_COMPARATOR_PHRASES);
  const contrast = scanPositive(doc, CONTRAST_PHRASES);
  const hasComparatorPair = working.length > 0 && contrast.length > 0;
  if (symptom.severity < SEVERITY.DATA && !hasComparatorPair) return null;
  if (!working.length && !contrast.length) return null;
  const effectiveScope = scopeResult || detectScope(doc);
  const broad = scopeDefinition(effectiveScope.scope).rank >=
    scopeDefinition('multiple-schools').rank;
  return {
    quote: (working[0] || contrast[0]).quote,
    reason: broad
      ? 'At least one comparable record is working, so the failure may be conditional ' +
        'rather than total. The reported broad scope remains valid and must still drive ' +
        'impact and urgency.'
      : 'A comparable record is working while another is failing, suggesting the fault ' +
        'may depend on record-specific or conditional factors. Compare the successful ' +
        'and failing records before assuming the wider cause.'
  };
}

function hasImmediateNeed(doc) {
  return IMMEDIATE_NEED_PATTERNS.some((re) => re.test(doc.text));
}

/**
 * Scope, deadlines and claimed urgency do not establish that text is an IT
 * ticket. They are deliberately excluded so unrelated or manipulative wording
 * such as "all users, P1, fix now" cannot manufacture a support incident.
 */
function assessInputRelevance(context) {
  const {
    doc, systemResult, symptom, domainResult, workTypeResult, risks, serviceManagementSignal
  } = context;
  const signals = [];
  // "This is broken" tells us neither what "this" is nor whether it belongs
  // to support. Its domain and incident are inferred from the generic failure,
  // so neither may bootstrap the relevance decision. This deliberately does
  // not discard a concrete statement such as "Printing is not working".
  const unanchoredGenericFailure = symptom.symptom === 'failed' &&
    /\b(?:this|it)\s+(?:is|was|has|keeps)\s+(?:broken|not working|failing|failed)\b|\b(?:this|it)\s+(?:doesn't|does not|didn't|did not)\s+work\b/i.test(doc.text);

  if (systemResult.primary) signals.push('system');
  if (symptom.severity > SEVERITY.NONE && !unanchoredGenericFailure) signals.push('symptom');
  if (domainResult.domain !== 'unknown' && !domainResult.inferred) signals.push('domain');
  if (workTypeResult.workType !== 'unknown' && workTypeResult.workType !== 'incident') {
    signals.push('work-type');
  }
  if (Object.values(risks).some(Boolean)) signals.push('risk');
  if (serviceManagementSignal) signals.push('service-management');

  return { inScope: signals.length > 0, signals };
}

/** Critical risk modifiers, applied to Impact/Urgency *before* the matrix. */
function applyRiskModifiers(context) {
  const {
    risks, modifiers, symptom, deadlineResult, scopeResult,
    expectedBehaviour, immediateNeed, workTypeResult
  } = context;

  let impact = context.impact;
  let urgency = context.urgency;
  const rules = [];

  const lower = (nextImpact, nextUrgency, label) => {
    const before = { impact, urgency };
    if (nextImpact) impact = lowerLevel(impact, nextImpact);
    if (nextUrgency) urgency = lowerLevel(urgency, nextUrgency);
    if (before.impact !== impact || before.urgency !== urgency) {
      rules.push({ label, impact, urgency, direction: 'lower' });
    }
  };
  const raise = (nextImpact, nextUrgency, label) => {
    const before = { impact, urgency };
    if (nextImpact) impact = raiseLevel(impact, nextImpact);
    if (nextUrgency) urgency = raiseLevel(urgency, nextUrgency);
    if (before.impact !== impact || before.urgency !== urgency) {
      rules.push({ label, impact, urgency, direction: 'raise' });
    }
  };

  // --- de-escalation ----------------------------------------------------
  if (context.decisionContext.status === 'resolved') {
    lower('low', 'low', 'The latest explicit update says the incident is resolved or contained.');
    return { impact, urgency, rules };
  }
  if (context.decisionContext.status === 'planned-test') {
    lower('low', 'low', 'The failure wording describes a design, simulation, exercise, or test.');
    return { impact, urgency, rules };
  }
  if (!context.inScope) {
    lower('low', 'low',
      'No IT system, application-support request or technical symptom was recognised.');
    return { impact, urgency, rules };
  }
  if (expectedBehaviour && !immediateNeed) {
    lower('low', 'low', 'This matches expected scheduled behaviour, not a failure.');
  }
  if (workTypeResult.workType === 'documentation' && !symptom.hasFailure &&
      deadlineResult.deadline === 'unknown' && !context.activeIncident) {
    lower('low', 'low', 'A documentation or how-to request with no stated deadline.');
  }

  // --- escalation -------------------------------------------------------
  const sameDay = ['now', 'today'].includes(deadlineResult.deadline);
  if ((risks.payroll || risks.financial) && sameDay &&
      (modifiers.unpaidRisk || symptom.hasFailure || symptom.isDataIssue)) {
    raise('high', 'high',
      'Payroll or payment processing is failing against a same-day deadline.');
  }
  if (modifiers.unpaidRisk && (risks.payroll || risks.financial)) {
    raise('high', null, 'People may not be paid.');
  }
  if (modifiers.exposureActive) {
    raise('high', 'high', 'Information appears to be actively exposed to the wrong people.');
  }
  if (modifiers.immediateSafeguarding) {
    raise('high', 'high', 'An immediate safeguarding risk was described.');
  }

  // Work that is holding up an incident already in progress inherits its
  // priority - it is not a separate low-priority request.
  if (context.activeIncident) {
    raise('high', 'high',
      'This is needed to recover from an incident already in progress, so it ' +
      'carries the priority of that incident rather than its own.');
  }

  // --- safety of people -------------------------------------------------
  // Missing or wrong safety information is not an ordinary data problem.
  if (risks.safety && symptom.severity >= SEVERITY.DATA) {
    raise('high', null, 'Safety-critical information or equipment is affected.');
    if (sameDay) {
      raise(null, 'high', 'The safety consequence arrives today.');
    }
  }

  // A person a court order excludes still has access to the record.
  if (risks.safeguarding &&
      (symptom.symptom === 'access-not-revoked' || modifiers.crossPersonVisibility)) {
    raise('high', 'high',
      'A person who should be excluded still appears to have access.');
  }

  // --- security incidents ----------------------------------------------
  if (symptom.symptom === 'account-compromise') {
    raise('medium', 'high', 'An account appears to be compromised and the attacker is active.');
  }
  if (symptom.symptom === 'device-lost' && (risks.privacy || risks.security)) {
    raise('high', 'high', 'A lost or stolen device may hold personal information.');
  }
  if (symptom.symptom === 'consent-granted' && (risks.privacy || risks.security)) {
    raise('high', null, 'A third party appears to have been granted access to personal data.');
  }
  if (modifiers.propagating && scopeResult.scope !== 'individual') {
    raise('high', 'high', 'Incorrect data appears to be actively propagating across systems.');
  }
  if (risks.compliance && sameDay) {
    raise('medium', null, 'A compliance or regulatory deadline falls today.');
  }
  if (modifiers.decisionRisk && (risks.payroll || risks.financial) && sameDay) {
    raise('high', null, 'Financial decisions may be made on incorrect information.');
  }

  return { impact, urgency, rules };
}

function inferStatusConsequence(doc, systemResult, symptom) {
  for (const consequence of organisationConfig.statusConsequences || []) {
    if (consequence.symptom !== symptom.symptom) continue;
    if (!systemResult.systems.some((system) => system.id === consequence.system)) continue;
    const phrase = consequence.phrases.find((candidate) => doc.text.includes(candidate));
    if (phrase) return { ...consequence, quote: phrase };
  }
  return null;
}

function detectBlockedProcess(doc, domainResult, symptom, systemResult) {
  const hit = scanPositive(doc, BLOCKED_PROCESS_PHRASES);
  if (hit.length) return {
    level: 'blocked', process: hit[0].entry.process, label: hit[0].entry.label,
    quote: hit[0].quote, source: 'explicit', hit: hit[0],
    evidence: [{ quote: hit[0].quote, meaning: hit[0].entry.label, source: 'consequence' }]
  };
  if (has(doc, BLOCKED_PROCESS_PHRASES)) return null;
  const statusConsequence = inferStatusConsequence(doc, systemResult, symptom);
  if (statusConsequence) {
    return {
      level: 'blocked', process: statusConsequence.blockedProcess,
      label: statusConsequence.blockedProcess, quote: statusConsequence.quote,
      source: 'inferred', inferred: true,
      note: statusConsequence.note,
      followUpQuestion: statusConsequence.followUpQuestion,
      evidence: [{ quote: statusConsequence.quote, meaning: statusConsequence.blockedProcess,
        source: 'consequence-inferred' }]
    };
  }
  // Fallback: infer blocked process from domain + symptom when explicit BLOCKED phrase present
  // but no named process — the panel will show symptom label instead.
  return null;
}

function buildMissingInformation(context) {
  const {
    scopeResult, deadlineResult, workaroundResult, systemResult, symptom,
    risks, modifiers, urgencyResult, impactResult, expectedBehaviour,
    doc, domainResult, isQuestion, knownAnswer, sourceOfTruth, differential,
    recurring, undetected, inScope, containment, driver, harmTiming, blockedProcess,
    simulate, currentPriority, currentImpact
  } = context;

  const missing = [];
  const questions = [];
  const meta = [];
  // kind: "diagnostic" = changes what to do next (source of truth, differential,
  // root cause, missing context); "priority" = answering could move the matrix
  // cell; "confidence" = narrows the assessment but keeps the cell.
  const pq = (tests) =>
    (simulate && tests.some((t) => simulate(t) !== currentPriority)) ? 'priority' : 'confidence';
  const addQuestion = (q, kind = 'confidence') => {
    if (questions.includes(q)) return;
    questions.push(q);
    meta.push({ text: q, kind });
  };

  if (!inScope) {
    return {
      missing: ['Whether this describes an IT or application-support request'],
      questions: ['What IT system, application, device, or service needs support?'],
      meta: [{ text: 'What IT system, application, device, or service needs support?', kind: 'priority' }],
      summary: 'No IT system, technical symptom, service request, or support topic ' +
        'was recognised. Treat this result as unassessed rather than as a valid ' +
        'low-priority ticket.'
    };
  }

  // A how-to does not need the incident questions. Asking "what happens if this
  // is not resolved today?" about "what time does the sync run?" is noise.
  if (isQuestion) {
    if (knownAnswer) {
      return {
        missing: [],
        questions: ['Does the requester need access before the next run at ' +
          knownAnswer.scheduledTime + '?'],
        meta: [{ text: 'Does the requester need access before the next run at ' +
          knownAnswer.scheduledTime + '?', kind: 'priority' }],
        summary: 'This looks like a question rather than a fault. The configured ' +
          'answer is shown above; confirm it still matches the environment.'
      };
    }
    return {
      missing: ['Whether the answer is needed for something with a deadline'],
      questions: [
        'Is this general information, or is it needed for something with a deadline?',
        'Is anything currently blocked while waiting for the answer?'
      ],
      meta: [
        { text: 'Is this general information, or is it needed for something with a deadline?', kind: 'priority' },
        { text: 'Is anything currently blocked while waiting for the answer?', kind: 'confidence' }
      ],
      summary: 'This reads as a question rather than a fault, so the usual incident ' +
        'facts (scope, workaround, outage) do not apply.'
    };
  }

  // The most decision-relevant questions first. A ticket that leans on a
  // conversation we cannot see is missing its most important fact.
  if (doc && has(doc, CONTEXT_ELSEWHERE_PHRASES)) {
    missing.push('The background the request refers to is not in the ticket');
    addQuestion('What was previously discussed or agreed that this request refers to?', 'diagnostic');
  }
  if (expectedBehaviour) {
    addQuestion('Is access required before the next scheduled run at ' +
      expectedBehaviour.scheduledTime + '?', 'diagnostic');
  }
  if (recurring) {
    missing.push('Why the fault recurs - the root cause is not yet known');
    addQuestion('What is the root cause, and what stops this happening to the next record?', 'diagnostic');
  }
  if (undetected) {
    missing.push('How many other records are affected but unreported');
    addQuestion('How many other records may be affected without anyone noticing, ' +
      'and can they be found in bulk?', 'diagnostic');
  }
  if (differential) {
    missing.push('What is different about the record that failed');
    addQuestion('What is different about the record that failed - document type, ' +
      'size, upload time, or a recent status change?', 'diagnostic');
  }
  if (sourceOfTruth) {
    missing.push('Whether the record is correct in ' + sourceOfTruth.source +
      ', the system ' + sourceOfTruth.downstream + ' is synchronised from');
    addQuestion('Is the record set up correctly in ' + sourceOfTruth.source +
      ', which ' + sourceOfTruth.downstream + ' is synchronised from?', 'diagnostic');
  }
  if (blockedProcess?.followUpQuestion) {
    addQuestion(
      blockedProcess.followUpQuestion,
      pq([{ deadline: 'today' }])
    );
  }
  if (!scopeResult.explicit) {
    missing.push('How many users, teams or schools are affected');
    addQuestion(
      'Is this affecting one person, one school, several schools or all ' +
      organisationConfig.schoolCount + ' schools?',
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
    addQuestion('Is there a workaround or manual process available?',
      pq([{ workaround: 'no' }, { workaround: 'yes' }]));
  }
  if (!systemResult.primary) {
    missing.push('Which system or application is affected');
    addQuestion('Which system or application is affected?');
  }
  // One bad record is often the visible corner of a bad batch.
  const BATCH_DOMAINS = ['data-quality', 'data-pipeline', 'integration-api', 'academic-ops'];
  if (['individual', 'few-users'].includes(scopeResult.scope) &&
      domainResult && BATCH_DOMAINS.includes(domainResult.domain)) {
    addQuestion('Are other records from the same intake or batch affected?', 'diagnostic');
  }

  if (urgencyResult.claimedOnly) {
    missing.push('The business consequence behind the stated urgency');
    addQuestion('What is the business consequence if this waits until tomorrow?',
      pq([{ deadline: 'today' }]));
  }
  if (symptom.isDataIssue && !modifiers.decisionRisk && !expectedBehaviour) {
    missing.push('Whether incorrect data is visible to users');
    addQuestion('Is incorrect information visible to users or being used for decisions?',
      pq([{ exposureActive: true }, { decisionRisk: true, deadline: 'today' }]));
  }
  if (symptom.isDataIssue && !modifiers.propagating && !expectedBehaviour) {
    addQuestion('Is the issue still occurring, or has it stopped?');
  }
  if ((risks.payroll || risks.financial) && deadlineResult.deadline === 'unknown') {
    missing.push('The next payroll or payment cutoff');
    addQuestion('Is a payroll or payment cutoff affected, and when is it?',
      pq([{ deadline: 'today' }]));
  }
  if ((risks.privacy || risks.security) && !modifiers.exposureActive) {
    missing.push('Whether anyone has actually accessed the information');
    addQuestion('Has anyone outside the intended audience actually seen the information?',
      pq([{ exposureActive: true }]));
  }
  if (symptom.isDegraded) {
    addQuestion('Can users still complete their work, or is it effectively unavailable?');
  }
  if (impactResult.impact === 'high' && deadlineResult.deadline === 'unknown') {
    addQuestion('When does business processing next depend on this?',
      pq([{ deadline: 'today' }, { deadline: 'days-2-5' }]));
  }

  // 8-question framework — only ask when current facets are unknown
  if (!blockedProcess && symptom.severity >= 2 && !isQuestion) {
    addQuestion('What can they not do right now that they could do yesterday? (blocked business process, not just symptom)');
  }
  if (containment && containment.contained) {
    // contained is good news — no question, but keep reasoning
  } else if (containment && !containment.propagating && !recurring && !undetected) {
    // Only ask containment if no other spread signal
    if (['individual', 'few-users'].includes(scopeResult.scope) && symptom.isDataIssue) {
      addQuestion('Is this contained to one record/family, or could it be spreading?',
        pq([{ propagating: true }]));
    }
  }
  if (driver && driver.driver === 'unknown' && deadlineResult.deadline !== 'unknown' && deadlineResult.deadline !== 'none') {
    addQuestion('What creates the deadline — a requirement (statutory/operational) or a preference? What actually happens if it is missed?',
      (urgencyResult.floorApplied && priorityFor(currentImpact, 'low') !== currentPriority) ? 'priority' : 'confidence');
  }
  if (driver && driver.driver === 'preference') {
    addQuestion('Is "by Friday" a requirement (statutory/operational) or a preference? Preferences score lower.');
  }
  if (workaroundResult.workaround === 'yes' && !workaroundResult.costPerDay) {
    addQuestion('What does the workaround cost per day — how many staff/hours does manual processing take?');
  }
  if (harmTiming && harmTiming.timing === 'pending') {
    addQuestion('Is harm waiting to happen (expiring) rather than happening now (expired/active exposure)?');
  } else if (harmTiming && harmTiming.timing === 'unknown' && (risks.privacy || risks.security || symptom.severity >= 1.5)) {
    addQuestion('Is harm happening now, or waiting to happen? (expired/active vs expiring/pending)',
      pq([{ exposureActive: true }]));
  }

  let summary = '';
  if (missing.length) {
    const impactKnown = impactResult.impact !== 'low' || scopeResult.explicit;
    summary = impactKnown && deadlineResult.deadline === 'unknown'
      ? 'The impact can be estimated, but urgency cannot be determined confidently ' +
        'because no deadline or business consequence was provided.'
      : 'Some of the information needed for a confident assessment is missing. ' +
        'The suggestion below is based on what the request actually states.';
  }

  // Diagnostic questions first (they change what to do next), then
  // priority-changing ones, then confidence-only (stable within each kind),
  // capped at six.
  const KIND_ORDER = { diagnostic: 0, priority: 1, confidence: 2 };
  const paired = meta.map((m, i) => [m, i]);
  paired.sort((a, b) =>
    (KIND_ORDER[a[0].kind] - KIND_ORDER[b[0].kind]) || (a[1] - b[1]));
  const top = paired.slice(0, 6);
  return {
    missing,
    questions: top.map(([m]) => m.text),
    meta: top.map(([m]) => m),
    summary
  };
}

function buildReasoning(context) {
  const {
    scopeResult, systemResult, domainResult, symptom, workaroundResult,
    deadlineResult, impactResult, urgencyResult, rules, priority,
    impact, urgency, expectedBehaviour, urgencyBase, impactBase, knownAnswer, isQuestion,
    sourceOfTruth, differential, escalated, recurring, undetected, inScope,
    containment, driver, harmTiming, blockedProcess, decisionContext
  } = context;

  const reasoning = [];

  if (!inScope) {
    const unassessedReasoning = [
      'This does not appear to describe an IT or application-support request.',
      'Scope, deadlines and requester-declared priority are ignored until a ' +
        'support system, symptom, work type, technical domain or risk is recognised.'
    ];
    if (rules.some((rule) => rule.direction === 'manual')) {
      unassessedReasoning.push(
        'The analyst-refined impact or urgency was retained, but the input is still unassessed.'
      );
    }
    unassessedReasoning.push(
      'Impact ' + LEVEL_LABELS[impact].toUpperCase() + ' and urgency ' +
        LEVEL_LABELS[urgency].toUpperCase() + ' map to ' + priority +
        ' in the priority matrix; treat this suggestion as unassessed.'
    );
    return unassessedReasoning;
  }
  if (decisionContext.status === 'resolved') {
    reasoning.push(
      'The latest explicit update says the incident is resolved or contained. Earlier ' +
      'failure wording is retained as history but does not describe current urgency.'
    );
  } else if (decisionContext.status === 'planned-test') {
    reasoning.push(
      'The failure wording describes a design, simulation, exercise, or test rather ' +
      'than a live production incident.'
    );
  }

  if (systemResult.primary) {
    reasoning.push(describeSystems(systemResult.systems) + ' was identified as the affected system.');
  }
  if (symptom.severity > 0) {
    reasoning.push(
      domainResult.domain === 'unknown'
        ? 'The reported symptom is "' + symptom.label.toLowerCase() +
          '", but the technical domain could not be determined.'
        : 'The reported symptom is "' + symptom.label.toLowerCase() + '" in the ' +
          domainResult.label + ' domain' +
          (domainResult.inferred ? ', inferred from the symptom.' : '.')
    );
  }
  // Scope and deadline decide incidents. Reciting their absence on a how-to
  // just buries the one line that matters.
  if (!isQuestion) {
    reasoning.push(
      scopeResult.explicit
        ? 'The request describes ' + scopeResult.label.toLowerCase() + ' as affected.'
        : 'The request does not state how many people or schools are affected, ' +
          'so scope is treated as unknown.'
    );
  } else {
    reasoning.push('This reads as a question rather than a fault report.');
  }
  if (workaroundResult.workaround !== 'unknown') {
    reasoning.push(
      workaroundResult.workaround === 'no'
        ? 'No workaround is available, so waiting has an immediate cost.'
        : 'A ' + workaroundResult.label.toLowerCase() + ' workaround was described, ' +
          'which reduces urgency without reducing impact.'
    );
  }
  if (!isQuestion || deadlineResult.deadline !== 'unknown') {
    reasoning.push(
      deadlineResult.deadline === 'unknown'
        ? 'No business deadline was found in the request.'
        : 'The stated timing is "' + deadlineResult.label.toLowerCase() + '"' +
          (deadlineResult.committed ? ' and is expressed as a commitment.' : '.')
    );
  }
  if (expectedBehaviour) {
    reasoning.push(expectedBehaviour.reason);
  }
  if (knownAnswer) {
    reasoning.push('This appears to be answered by the configured "' + knownAnswer.job +
      '": ' + knownAnswer.answer);
  }
  if (differential) {
    reasoning.push(differential.reason);
  }
  if (recurring) {
    reasoning.push('This has happened before. The ticket is about the pattern, not ' +
      'the instance - correcting the affected record will not stop it recurring, ' +
      'so impact is assessed on the cumulative reach of the fault.');
  }
  if (undetected) {
    reasoning.push('The requester has said that affected records may exist without ' +
      'being reported. The number of records involved is therefore unknown and ' +
      'larger than the ones raised so far.');
  }
  if (escalated) {
    reasoning.push('The request has been escalated by a stakeholder. That is recorded ' +
      'as context only: who asked does not change what breaks, so it has not ' +
      'altered the impact or urgency above.');
  }
  if (sourceOfTruth) {
    reasoning.push(sourceOfTruth.note + ' If the record is missing or incorrect in ' +
      sourceOfTruth.source + ', the synchronisation will keep excluding it, and a manual ' +
      'change made directly in ' + sourceOfTruth.downstream +
      ' may be reversed at the next run.');
  }
  if (urgencyResult.claimedOnly) {
    reasoning.push(
      'Urgency was asserted in the wording, but no business consequence was stated. ' +
      'Asserted urgency alone does not raise priority.'
    );
  }
  if (urgencyResult.floorApplied) {
    reasoning.push(
      'A future deadline was stated, so urgency is treated as at least Medium ' +
      'even though the business can continue for now.'
    );
  }
  if (blockedProcess) {
    reasoning.push('Blocked process: ' + blockedProcess.quote + ' — ' + blockedProcess.label + '.');
    if (blockedProcess.note) reasoning.push(blockedProcess.note);
  }
  if (containment) {
    if (containment.contained) reasoning.push('Containment: ' + containment.summary + ' (' + (containment.containedEvidence?.quote || '') + ').');
    else if (containment.propagating) reasoning.push('Containment: ' + containment.summary + ' — raises impact, not urgency.');
    else if (containment.recurring || containment.undetected) reasoning.push('Containment: ' + containment.summary + '.');
  }
  if (driver && driver.driver !== 'unknown') {
    const who = driver.actor ? ' (' + driver.actor + ')' : '';
    reasoning.push('Driver: ' + driver.label + who + (driver.quote ? ' — "' + driver.quote + '"' : '') + '.');
  }
  if (harmTiming && harmTiming.timing !== 'unknown') {
    reasoning.push('Harm timing: ' + harmTiming.label + (harmTiming.quote ? ' — "' + harmTiming.quote + '"' : '') + '.');
  }
  if (workaroundResult.costPerDay) {
    reasoning.push('Workaround cost: ' + workaroundResult.costPerDay + ' — ' + (workaroundResult.sustainability || 'manual effort') + '.');
  }
  for (const rule of rules) {
    reasoning.push('Modifier applied: ' + rule.label);
  }
  if (impactBase !== impact) {
    reasoning.push('Impact adjusted from ' + LEVEL_LABELS[impactBase] + ' to ' + LEVEL_LABELS[impact] + '.');
  }
  if (urgencyBase !== urgency) {
    reasoning.push('Urgency adjusted from ' + LEVEL_LABELS[urgencyBase] + ' to ' + LEVEL_LABELS[urgency] + '.');
  }
  reasoning.push(
    'Impact ' + LEVEL_LABELS[impact].toUpperCase() + ' and urgency ' +
    LEVEL_LABELS[urgency].toUpperCase() + ' map to ' + priority + ' in the priority matrix.'
  );

  return reasoning;
}

/**
 * The one-sentence justification from the TASC guide, section 10:
 * "All 19 schools affected; manual workaround available; classes not yet
 *  blocked; recovery needed before tomorrow morning -> High Impact +
 *  Medium Urgency -> P2."
 *
 * Written to be pasted straight into the ticket when the call may be challenged.
 */
function buildJustification(context) {
  const {
    scopeResult, workaroundResult, deadlineResult, symptom, riskFlags,
    impact, urgency, priority
  } = context;

  if (!context.inScope) {
    return 'No IT or application-support context recognised -> ' +
      LEVEL_LABELS[impact] + ' Impact + ' + LEVEL_LABELS[urgency] + ' Urgency -> ' +
      priority + ' (unassessed)';
  }

  const facts = [];
  if (scopeResult.explicit) facts.push(scopeResult.label + ' affected');
  else facts.push('scope not stated');

  if (symptom.severity > 0) facts.push(symptom.label.toLowerCase());

  if (workaroundResult.workaround === 'yes') facts.push('workaround available');
  else if (workaroundResult.workaround === 'partial') facts.push('partial workaround only');
  else if (workaroundResult.workaround === 'no') facts.push('no workaround');

  if (deadlineResult.deadline === 'unknown') facts.push('no deadline stated');
  else if (deadlineResult.deadline === 'none') facts.push('no deadline required');
  else facts.push('needed ' + deadlineResult.label.toLowerCase());

  for (const flag of riskFlags.slice(0, 2)) facts.push(flag.label.toLowerCase() + ' involved');

  return facts.join('; ') + ' -> ' + LEVEL_LABELS[impact] + ' Impact + ' +
    LEVEL_LABELS[urgency] + ' Urgency -> ' + priority;
}

const LEVEL_VALUES = ['low', 'medium', 'high'];

function normaliseOverrides(overrides = {}) {
  const clean = {};
  const take = (key, allowed) => {
    const value = overrides[key];
    if (value === undefined || value === null || value === '' || value === 'auto') return;
    if (allowed && !allowed.includes(value)) return;
    clean[key] = value;
  };
  take('scope');
  take('workaround', ['yes', 'partial', 'no', 'unknown']);
  take('deadline');
  take('contained', ['contained', 'spreading', 'unknown']);
  take('driver', ['statutory', 'operational', 'preference', 'none']);
  take('harm', ['active', 'pending', 'unknown']);
  take('consequence', ['impaired', 'blocked', 'unknown']);
  take('impact', LEVEL_VALUES);
  take('urgency', LEVEL_VALUES);
  if (overrides.risks && typeof overrides.risks === 'object') {
    const risks = {};
    for (const [key, value] of Object.entries(overrides.risks)) {
      if (typeof value === 'boolean') risks[key] = value;
    }
    if (Object.keys(risks).length) clean.risks = risks;
  }
  return clean;
}

/**
 * Analyse a ticket.
 *
 * @param {string} rawText
 * @param {object} overrides  manual refinements from the UI
 * @returns {object} result model
 */
export function analyse(rawText, overrides = {}) {
  const originalDoc = createDocument(rawText);
  if (!originalDoc.text) {
    return { empty: true, priority: null, reasoning: [], evidence: [] };
  }
  const preparedContext = prepareDecisionContext(rawText);
  const { decisionText, ...decisionContext } = preparedContext;
  const doc = createDocument(decisionText);

  const applied = normaliseOverrides(overrides);
  const overridesApplied = Object.keys(applied).length > 0;

  // --- evidence ---------------------------------------------------------
  const systemResult = detectSystems(doc);
  const symptom = detectSymptom(doc);
  const domainResult = detectDomain(doc, systemResult, symptom);

  const detectedScope = detectScope(doc);
  const detectedWorkaround = detectWorkaround(doc);
  const detectedDeadline = detectDeadline(doc);
  const riskResult = detectRisks(doc, { symptom, scope: detectedScope });

  // --- manual refinements ----------------------------------------------
  let scopeResult = applied.scope
    ? {
        ...detectedScope,
        scope: applied.scope,
        label: scopeLabel(applied.scope),
        explicit: applied.scope !== 'unknown',
        evidence: [{ quote: 'manual input', meaning: 'Scope confirmed by the analyst', source: 'scope' }]
      }
    : detectedScope;

  let workaroundResult = applied.workaround
    ? {
        ...detectedWorkaround,
        workaround: applied.workaround,
        label: workaroundLabel(applied.workaround),
        evidence: [{ quote: 'manual input', meaning: 'Workaround confirmed by the analyst', source: 'workaround' }]
      }
    : detectedWorkaround;

  let deadlineResult = applied.deadline
    ? {
        ...detectedDeadline,
        deadline: applied.deadline,
        label: deadlineLabel(applied.deadline),
        committed: applied.deadline !== 'unknown',
        evidence: [{ quote: 'manual input', meaning: 'Deadline confirmed by the analyst', source: 'deadline' }]
      }
    : detectedDeadline;

  const risks = { ...emptyRisks(), ...riskResult.risks, ...(applied.risks || {}) };
  // Re-gate modifiers against the (possibly overridden) risk flags.
  const raw = riskResult.rawModifiers;
  let modifiers = {
    ...riskResult.modifiers,
    unpaidRisk: raw.unpaidRisk && (risks.payroll || risks.financial),
    exposureActive: raw.exposureActive && (risks.privacy || risks.security),
    propagating: raw.propagating && risks.dataIntegrity,
    decisionRisk: raw.decisionRisk && (symptom.isDataIssue || risks.dataIntegrity),
    immediateSafeguarding: raw.immediateSafeguarding && risks.safeguarding
  };

  // --- expected behaviour ----------------------------------------------
  const expectedBehaviour = detectExpectedBehaviour(doc, symptom);
  const immediateNeed = hasImmediateNeed(doc);

  // A fault that repeats, and one whose full reach is unknown, both change
  // what kind of ticket this is - so they are established before work type.
  const recurring = has(doc, RECURRENCE_PHRASES);
  const undetected = has(doc, UNDETECTED_PHRASES);
  let containment = detectContainment(doc, risks);
  let driver = detectDriver(doc);
  let harmTiming = detectHarmTiming(doc, symptom);
  let blockedProcess = detectBlockedProcess(doc, domainResult, symptom, systemResult);
  // Facet overrides — analyst confirmed values
  if (applied.contained) {
    if (applied.contained === 'contained') containment = { ...containment, contained: true, propagating: false, recurring: false, undetected: false, summary: 'appears contained (manually confirmed)' };
    else if (applied.contained === 'spreading') containment = { ...containment, contained: false, propagating: true, summary: 'appears to be spreading (manually confirmed)' };
    else if (applied.contained === 'unknown') containment = { ...containment, contained: false, propagating: false, recurring: false, undetected: true, summary: 'unknown extent (manually confirmed)' };
  }
  if (applied.driver) {
    if (applied.driver !== 'auto') {
      const labelMap = { statutory: 'a statutory or compliance deadline drives timing', operational: 'an operational or business event drives timing', preference: 'a preference rather than a deadline was expressed', none: 'no deadline driver' };
      driver = { driver: applied.driver, label: labelMap[applied.driver] || applied.driver, quote: 'manual input', actor: driver.actor, committed: applied.driver !== 'preference' && applied.driver !== 'none' };
    }
  }
  if (applied.harm) {
    if (applied.harm !== 'auto') {
      const labelMap = { active: 'harm is happening now', pending: 'harm is waiting to happen', unknown: null };
      harmTiming = { timing: applied.harm, label: labelMap[applied.harm], quote: applied.harm === 'unknown' ? null : 'manual input', source: 'manual' };
    }
  }
  if (applied.consequence) {
    const labelMap = {
      impaired: 'business process is impaired',
      blocked: 'business process is blocked',
      unknown: 'business consequence is unknown'
    };
    blockedProcess = {
      level: applied.consequence,
      process: null,
      label: labelMap[applied.consequence],
      quote: 'manual input',
      source: 'manual',
      evidence: [{ quote: 'manual input', meaning: labelMap[applied.consequence], source: 'consequence' }]
    };
  }

  // Confirmed facets are scoring inputs, not display-only annotations. They
  // remain gated by the matching risk so a refinement cannot manufacture a
  // data, privacy, security, or safeguarding concern that was never present.
  if (applied.contained) {
    modifiers = {
      ...modifiers,
      propagating: applied.contained === 'spreading' && risks.dataIntegrity
    };
  }
  if (applied.harm) {
    const active = applied.harm === 'active';
    modifiers = {
      ...modifiers,
      exposureActive: active && (risks.privacy || risks.security),
      immediateSafeguarding: active && risks.safeguarding
    };
  }
  const effectiveRisk = { ...riskResult, risks, modifiers };

  const workTypeResult = detectWorkType(doc, {
    symptom,
    risks,
    modifiers,
    expectedBehaviour: Boolean(expectedBehaviour),
    differential: Boolean(detectDifferential(doc, symptom, scopeResult)) || recurring
  });

  // A question with no failure behind it is a different kind of ticket: the
  // facts that decide an incident simply do not apply to it.
  const isQuestion =
    (workTypeResult.workType === 'documentation' || symptom.symptom === 'question') &&
    !symptom.hasFailure;
  const knownAnswer = findKnownAnswer(doc, isQuestion);
  const sourceOfTruth = findSourceOfTruth(systemResult, symptom, organisationConfig, doc);
  const differential = detectDifferential(doc, symptom, scopeResult);
  const activeIncident = has(doc, ACTIVE_INCIDENT_PHRASES);
  const escalated = has(doc, ESCALATION_PHRASES);
  const slaBreached = has(doc, SLA_BREACH_PHRASES);
  const relevance = assessInputRelevance({
    doc, systemResult, symptom, domainResult, workTypeResult, risks,
    serviceManagementSignal: activeIncident || slaBreached ||
      decisionContext.status !== 'active-or-unspecified'
  });
  const inScope = relevance.inScope;

  // Without a recognised support subject, pronouns such as "this" and "it"
  // have no safe referent. Do not let their surrounding scope, deadline, or
  // workaround language answer a triage question; an analyst's explicit
  // refinement remains authoritative.
  if (!inScope) {
    if (!applied.scope) {
      scopeResult = {
        ...scopeResult, scope: 'unknown', label: scopeLabel('unknown'), explicit: false,
        allUsers: false, evidence: []
      };
    }
    if (!applied.workaround) {
      workaroundResult = {
        ...workaroundResult, workaround: 'unknown', label: workaroundLabel('unknown'), evidence: []
      };
    }
    if (!applied.deadline) {
      deadlineResult = {
        ...deadlineResult, deadline: 'unknown', label: deadlineLabel('unknown'),
        committed: false, asserted: false, evidence: []
      };
    }
    if (!applied.driver) {
      driver = { driver: 'unknown', label: null, quote: null, actor: null, committed: false };
    }
  }

  // --- impact and urgency ----------------------------------------------
  const impactResult = assessImpact(doc, {
    scopeResult, symptom, riskResult: effectiveRisk, deadlineResult, systemResult,
    consequence: blockedProcess
  });
  const urgencyResult = assessUrgency(doc, {
    deadlineResult, workaroundResult, symptom, scopeResult, riskResult: effectiveRisk,
    differential, driver, harmTiming, consequence: blockedProcess
  });

  const impactBase = impactResult.impact;
  const urgencyBase = urgencyResult.urgency;

  const modified = applyRiskModifiers({
    impact: impactBase,
    urgency: urgencyBase,
    risks,
    modifiers,
    symptom,
    deadlineResult,
    scopeResult,
    workTypeResult,
    expectedBehaviour,
    immediateNeed,
    activeIncident,
    decisionContext,
    inScope
  });

  // The analyst's explicit call wins over every automatic rule.
  const impact = applied.impact || modified.impact;
  const urgency = applied.urgency || modified.urgency;
  const priority = priorityFor(impact, urgency);

  // Re-run the scoring with a hypothetical answer, to rank follow-up questions
  // by whether they could move the matrix cell ("would change priority").
  const simulate = (ov = {}) => {
    const scopeR = ov.scope
      ? { ...scopeResult, scope: ov.scope, label: scopeLabel(ov.scope), explicit: true, allUsers: false }
      : scopeResult;
    const deadlineR = ov.deadline
      ? { ...deadlineResult, deadline: ov.deadline, label: deadlineLabel(ov.deadline), committed: true, asserted: false }
      : deadlineResult;
    const workaroundR = ov.workaround
      ? { ...workaroundResult, workaround: ov.workaround, label: workaroundLabel(ov.workaround) }
      : workaroundResult;
    const consequenceR = ov.consequence
      ? { level: ov.consequence, quote: 'hypothetical answer', source: 'manual' }
      : blockedProcess;
    const mods = {
      ...modifiers,
      propagating: Boolean(modifiers.propagating || (ov.propagating && risks.dataIntegrity)),
      exposureActive: Boolean(modifiers.exposureActive || (ov.exposureActive && (risks.privacy || risks.security))),
      decisionRisk: Boolean(modifiers.decisionRisk || (ov.decisionRisk && (symptom.isDataIssue || risks.dataIntegrity)))
    };
    const riskSim = { ...effectiveRisk, modifiers: mods };
    const imp = assessImpact(doc, {
      scopeResult: scopeR, symptom, riskResult: riskSim, deadlineResult: deadlineR, systemResult,
      consequence: consequenceR
    });
    const urg = assessUrgency(doc, {
      deadlineResult: deadlineR, workaroundResult: workaroundR, symptom,
      scopeResult: scopeR, riskResult: riskSim, differential, driver, harmTiming,
      consequence: consequenceR
    });
    const mod = applyRiskModifiers({
      impact: imp.impact, urgency: urg.urgency, risks, modifiers: mods, symptom,
      deadlineResult: deadlineR, scopeResult: scopeR, workTypeResult, expectedBehaviour,
      immediateNeed, activeIncident, decisionContext, inScope
    });
    return priorityFor(mod.impact, mod.urgency);
  };

  // The one or two facets whose unknown answer could flip this ticket's cell.
  const keyFacets = [];
  {
    const changes = (tests) => tests.some((t) => simulate(t) !== priority);
    if (!scopeResult.explicit && changes([{ scope: 'all-schools' }, { scope: 'one-school' }])) keyFacets.push('i1');
    if ((!blockedProcess || blockedProcess.level === 'unknown') &&
        changes([{ consequence: 'blocked' }])) keyFacets.push('i2');
    if (deadlineResult.deadline === 'unknown' && changes([{ deadline: 'today' }, { deadline: 'days-2-5' }])) keyFacets.push('u5');
    if (workaroundResult.workaround === 'unknown' && changes([{ workaround: 'no' }, { workaround: 'yes' }])) keyFacets.push('u7');
    if (risks.dataIntegrity && !modifiers.propagating && changes([{ propagating: true }])) keyFacets.push('i4');
    if ((risks.privacy || risks.security) && !modifiers.exposureActive && changes([{ exposureActive: true }])) keyFacets.push('u8');
    if (driver.driver === 'unknown' && deadlineResult.deadline !== 'unknown' &&
        deadlineResult.deadline !== 'none' && urgencyResult.floorApplied &&
        priorityFor(impact, 'low') !== priority) keyFacets.push('u6');
  }

  // --- explanation ------------------------------------------------------
  const confidenceResult = assessConfidence(doc, {
    scopeResult, deadlineResult, workaroundResult, symptom, systemResult,
    impactResult, urgencyResult, overridesApplied, isQuestion, inScope,
    consequence: blockedProcess
  });

  // Almost nothing was recognised. That is not evidence of low priority - it
  // is evidence that the ticket cannot be assessed yet, and the card must say
  // so rather than quietly returning P4.
  const sparseUnrecognisedRequest =
    decisionContext.status === 'active-or-unspecified' &&
    symptom.severity === 0 &&
    !scopeResult.explicit &&
    !systemResult.primary &&
    deadlineResult.deadline === 'unknown' &&
    !Object.values(risks).some(Boolean) &&
    workTypeResult.workType === 'unknown' &&
    doc.wordCount < 10 &&
    !isQuestion;
  const insufficientInformation = !inScope || sparseUnrecognisedRequest;
  const assessmentStatus = insufficientInformation ? 'unassessed' : 'assessed';
  const suggestedPriority = insufficientInformation ? null : priority;

  const missingInfo = buildMissingInformation({
    scopeResult, deadlineResult, workaroundResult, systemResult, symptom,
    risks, modifiers, urgencyResult, impactResult, expectedBehaviour,
    doc, domainResult, isQuestion, knownAnswer, sourceOfTruth, differential,
    recurring, undetected, inScope, containment, driver, harmTiming, blockedProcess,
    simulate, currentPriority: priority, currentImpact: impact
  });

  const rules = modified.rules.slice();
  if (applied.impact) {
    rules.push({ label: 'Impact manually set to ' + LEVEL_LABELS[applied.impact] + '.', direction: 'manual' });
  }
  if (applied.urgency) {
    rules.push({ label: 'Urgency manually set to ' + LEVEL_LABELS[applied.urgency] + '.', direction: 'manual' });
  }

  const reasoning = buildReasoning({
    scopeResult, systemResult, domainResult, symptom, workaroundResult,
    deadlineResult, impactResult, urgencyResult, rules, priority,
    impact, urgency, expectedBehaviour, impactBase, urgencyBase, knownAnswer, isQuestion,
    sourceOfTruth, differential, escalated, recurring, undetected, inScope,
    containment, driver, harmTiming, blockedProcess, decisionContext
  });

  const evidenceDetail = [
    ...decisionContext.evidence,
    ...systemResult.evidence,
    ...scopeResult.evidence,
    ...symptom.evidence,
    ...domainResult.evidence,
    ...workaroundResult.evidence,
    ...deadlineResult.evidence,
    ...(blockedProcess?.evidence || []),
    ...effectiveRisk.evidence
  ];

  // 8-question facets for the dedicated panel
  const eightFacets = {
    i1Scope: { question: 'Who and how many are affected?', answer: scopeResult.label, value: scopeResult.scope, explicit: scopeResult.explicit, quote: scopeResult.evidence[0]?.quote || null },
    // I2 is the business process that cannot continue. A technical symptom can
    // identify the failure mode, but must not be relabelled as its consequence.
    i2Blocked: { question: 'What can they not do that they could do yesterday?', answer: blockedProcess ? blockedProcess.label : 'Not stated', quote: blockedProcess?.quote || null, blockedProcess },
    i3Irreversibility: { question: 'Wrong / exposed / lost / unsafe vs merely unavailable?', answer: modifiers.exposureActive ? 'Exposed' : risks.dataIntegrity && modifiers.propagating ? 'Wrong + spreading' : risks.dataIntegrity ? 'Wrong data' : risks.privacy ? 'Privacy risk' : risks.safety ? 'Safety' : symptom.severity >= 3 ? 'Unavailable/outage' : 'No irreversibility flagged', risks: Object.keys(risks).filter(k => risks[k]), modifiers },
    i4Containment: { question: 'Contained or spreading / recurring / unknown extent?', answer: containment.summary, containment },
    u5Deadline: { question: 'When do you need this by?', answer: deadlineResult.label, value: deadlineResult.deadline, committed: deadlineResult.committed, quote: deadlineResult.evidence[0]?.quote || null },
    u6Driver: { question: 'What creates the deadline — a requirement or a preference?', answer: driver.driver === 'unknown' ? 'Not stated' : driver.label, driver },
    u7Workaround: { question: 'Can work continue — and at what daily cost?', answer: workaroundResult.label + (workaroundResult.costPerDay ? ' (' + workaroundResult.costPerDay + ')' : ''), workaround: workaroundResult.workaround, costPerDay: workaroundResult.costPerDay },
    u8HarmTiming: { question: 'Harm happening now or waiting to happen? (expired vs expiring)', answer: harmTiming.timing === 'unknown' ? 'Not stated' : harmTiming.label, harmTiming }
  };

  const riskFlags = Object.entries(risks)
    .filter(([, value]) => value)
    .map(([key]) => ({ key, label: RISK_LABELS[key] || key }));

  return {
    empty: false,

    // headline
    priority,
    suggestedPriority,
    assessmentStatus,
    justification: buildJustification({
      scopeResult, workaroundResult, deadlineResult, symptom,
      riskFlags: Object.entries(risks).filter(([, v]) => v)
        .map(([k]) => ({ key: k, label: RISK_LABELS[k] || k })),
      impact, urgency, priority, inScope
    }),
    priorityName: priorityDefinition(priority).name,
    priorityHeadline: priorityDefinition(priority).headline,

    // matrix inputs
    impact,
    urgency,
    impactLabel: LEVEL_LABELS[impact],
    urgencyLabel: LEVEL_LABELS[urgency],

    // classification
    workType: workTypeResult.workType,
    workTypeLabel: workTypeLabel(workTypeResult.workType),
    technicalDomain: domainResult.domain,
    technicalDomainLabel: domainLabel(domainResult.domain),
    symptom: symptom.symptom,
    symptomLabel: symptom.label,
    system: systemResult.primary ? systemResult.primary.name : null,
    systems: systemResult.systems.map((s) => s.name),
    scope: scopeResult.scope,
    scopeLabel: scopeResult.label,
    workaround: workaroundResult.workaround,
    workaroundLabel: workaroundResult.label,
    deadline: deadlineResult.deadline,
    deadlineLabel: deadlineResult.label,
    consequence: blockedProcess?.level || 'unknown',
    businessConsequence: blockedProcess || {
      level: 'unknown', process: null, label: 'Business consequence not stated',
      quote: null, source: 'unknown', evidence: []
    },

    // risk
    risks,
    riskFlags,
    riskModifiers: modifiers,
    dismissedRisks: riskResult.dismissed,

    // confidence and explanation
    confidence: confidenceResult.confidence,
    confidenceBand: confidenceResult.band,
    confidenceLabel: confidenceResult.label,
    confidenceNotes: confidenceResult.negatives,
    conflicts: confidenceResult.conflicts,

    isQuestion,
    inScope,
    decisionContext,
    insufficientInformation,
    knownAnswer,
    strippedChars: originalDoc.strippedChars,
    sourceOfTruth,
    differential,
    recurring,
    undetected,
    containment,
    driver,
    harmTiming,
    blockedProcess,
    eightFacets,

    evidence: evidenceDetail.map((e) => e.meaning),
    evidenceDetail,
    reasoning,
    appliedRules: rules,
    missingInformation: missingInfo.missing,
    missingInformationSummary: missingInfo.summary,
    followUpQuestions: missingInfo.questions,
    followUpQuestionMeta: missingInfo.meta,
    keyFacets,

    // explainability chain
    chain: {
      evidence: evidenceDetail.slice(0, 6),
      impact: {
        level: impact,
        label: LEVEL_LABELS[impact],
        score: impactResult.score,
        drivers: impactResult.contributions
          .filter((c) => c.value !== 0)
          .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
          .slice(0, 4)
      },
      urgency: {
        level: urgency,
        label: LEVEL_LABELS[urgency],
        score: urgencyResult.score,
        drivers: urgencyResult.contributions
          .filter((c) => c.value !== 0)
          .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
          .slice(0, 4)
      },
      modifiers: modified.rules,
      priority
    },

    // raw detail, useful for tests and for the "show working" panel
    detail: {
      scope: scopeResult,
      deadline: deadlineResult,
      workaround: workaroundResult,
      symptom,
      domain: domainResult,
      workTypeResult,
      impactResult,
      urgencyResult,
      expectedBehaviour,
      immediateNeed,
      relevance,
      overridesApplied: applied,
      wordCount: doc.wordCount,
      normalisedText: doc.text,
      decisionText
    }
  };
}

export default analyse;
