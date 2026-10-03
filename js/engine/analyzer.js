/**
 * The analysis pipeline — v0.12.0 core.
 *
 *   ticket text
 *      > evidence          (system, symptom, the eight decision questions, risks)
 *      > Impact + Urgency  (weighted scoring, then a small safety calibration)
 *      > priority matrix   (the only place a P number is decided)
 *      > explanation       (reasoning, missing information, follow-up questions)
 *
 * The engine is deliberately small. It detects what the ticket states for the
 * eight questions, and when a question is unknown it asks rather than guessing.
 * The removed inference layers (scheduled-job expected behaviour, known answers,
 * source-of-truth flows, differential diagnosis, status consequences, domain and
 * work-type classifiers, generic platform catalogue) all tried to answer a
 * question the ticket had not answered. That is now a follow-up question.
 *
 * Everything happens in this browser. No network call exists in this module or
 * anywhere else in the application.
 */
import { createDocument, has, scanPositive } from './negation.js';
import { createEvidenceLedger } from './evidence.js';
import { organisationConfig } from '../config.js';
import { detectSystems, describeSystems } from '../data/systems.js';
import { extractScopeEvidence, projectScope, scopeLabel } from './scope.js';
import { extractWorkaroundEvidence, projectWorkaround, workaroundLabel } from './workaround.js';
import { detectDeadline, deadlineLabel } from './deadline.js';
import { detectSymptom, SEVERITY } from './symptom.js';
import { detectRisks, emptyRisks, RISK_LABELS, RISK_KEYS } from './risks.js';
import { assessImpact } from './impact.js';
import { assessUrgency } from './urgency.js';
import { applyTriagePolicy } from './policy.js';
import { recommendNextAction } from './next-action.js';
import { detectRecoverability } from './recoverability.js';
import { assessConfidence } from './confidence.js';
import { priorityFor, priorityDefinition, LEVEL_LABELS } from './priority-matrix.js';
import { detectContainment } from './containment.js';
import { detectDriver } from './driver.js';
import { extractHarmTimingEvidence, projectHarmTiming } from './harm-timing.js';
import {
  CONTEXT_ELSEWHERE_PHRASES,
  BLOCKED_PROCESS_PHRASES,
  IMPAIRED_PROCESS_PHRASES,
  RECURRENCE_PHRASES,
  UNDETECTED_PHRASES,
  ACTIVE_INCIDENT_PHRASES,
  ESCALATION_PHRASES
} from '../data/phrases.js';

const LEVEL_VALUES = ['low', 'medium', 'high'];

/* ------------------------------------------------------ decision context -- */

/**
 * The one context rule kept from the old decision-context engine: a ticket that
 * explicitly says the incident is now resolved should not be scored as live. It
 * is deliberately small. The user can always correct it in the refine panel.
 */
const RESOLVED_RE =
  /\b(?:is|was|has been|now)\s+(?:fixed|resolved|restored|recovered)\b|\bworking again\b|\bback online\b|\bno action (?:is )?required\b|\baccess (?:has|had|was) (?:been )?(?:removed|revoked)\b|\bissue (?:is|was) contained\b/;
const REOPENED_RE =
  /\b(?:not (?:fixed|resolved|restored)|still (?:down|failing|failed|broken|blocked|unavailable)|(?:down|failed|failing|broken|blocked|unavailable|stopped|recurred) again|continues? to fail)\b/;

function detectDecisionContext(doc) {
  const resolved = RESOLVED_RE.test(doc.text);
  const reopened = REOPENED_RE.test(doc.text);
  if (resolved && !reopened) {
    return {
      status: 'resolved',
      evidence: [
        {
          quote: doc.text.match(RESOLVED_RE)[0],
          meaning: 'The latest explicit status says the incident is resolved or contained',
          source: 'decision-context'
        }
      ]
    };
  }
  return { status: 'active-or-unspecified', evidence: [] };
}

/* -------------------------------------------------------------- evidence -- */

/** I2 — the business process that cannot continue, not the technical symptom. */
function detectBlockedProcess(doc) {
  const blocked = scanPositive(doc, BLOCKED_PROCESS_PHRASES);
  const impaired = scanPositive(doc, IMPAIRED_PROCESS_PHRASES);
  const chosen = blocked[0] || impaired[0];
  if (!chosen) return null;
  const level = blocked.length ? 'blocked' : 'impaired';
  return {
    level,
    process: chosen.entry.process,
    label: chosen.entry.label,
    quote: chosen.quote,
    source: 'explicit',
    evidence: [{ quote: chosen.quote, meaning: chosen.entry.label, source: 'consequence' }]
  };
}

/** Input relevance: at least one recognised support signal must be present. */
function assessInputRelevance({ systemResult, symptom, risks, serviceManagementSignal }) {
  const signals = [];
  if (systemResult.primary) signals.push('system');
  if (symptom.severity > SEVERITY.NONE) signals.push('symptom');
  if (Object.values(risks).some(Boolean)) signals.push('risk');
  if (serviceManagementSignal) signals.push('service-management');
  return { inScope: signals.length > 0, signals };
}

function policyEvidence(context) {
  const {
    risks,
    modifiers,
    symptom,
    deadlineResult,
    scopeResult,
    workaroundResult,
    activeIncident,
    decisionContext,
    inScope,
    driver,
    harmTiming,
    recoverability,
    containment,
    urgencyResult,
    blockedProcess
  } = context;
  return {
    risks,
    modifiers,
    symptom: { ...symptom, id: symptom.symptom },
    deadline: deadlineResult.deadline,
    deadlineCommitted: deadlineResult.committed,
    deadlineDriver: driver?.driver || 'unknown',
    lowUrgencySignal: Boolean(urgencyResult?.lowUrgencySignal),
    scope: scopeResult.scope,
    consequence: blockedProcess?.level || 'unknown',
    workaround: workaroundResult.workaround,
    workaroundCost: workaroundResult.costPerDay,
    decisionContext: decisionContext.status,
    activeIncident: Boolean(activeIncident),
    inScope,
    harmTiming: harmTiming?.timing || 'unknown',
    recoverability: recoverability?.value || 'unknown',
    containment: containment || {}
  };
}

/* --------------------------------------------------------- eight questions -- */

function irreversibilityAnswer(symptom, risks, modifiers, recoverability) {
  let answer =
    symptom.symptom === 'data-loss'
      ? 'Lost data'
      : modifiers.exposureActive
        ? 'Exposed'
        : risks.dataIntegrity && modifiers.propagating
          ? 'Wrong + spreading'
          : risks.dataIntegrity
            ? 'Wrong data'
            : risks.privacy
              ? 'Privacy risk'
              : risks.safety
                ? 'Safety'
                : symptom.severity >= SEVERITY.FAILURE
                  ? 'Unavailable/outage'
                  : 'No irreversibility flagged';
  if (recoverability.value === 'recoverable') {
    answer =
      answer === 'No irreversibility flagged'
        ? 'Recovery available'
        : answer + ' — recovery available';
  } else if (recoverability.value === 'unrecoverable') {
    answer =
      answer === 'No irreversibility flagged'
        ? 'Recovery unavailable'
        : answer + ' — recovery unavailable';
  }
  return answer;
}

function buildEightFacets({
  scopeResult,
  blockedProcess,
  symptom,
  risks,
  modifiers,
  recoverability,
  containment,
  deadlineResult,
  driver,
  workaroundResult,
  harmTiming
}) {
  return {
    i1Scope: {
      question: 'Who and how many are affected?',
      answer: scopeResult.label,
      value: scopeResult.scope,
      explicit: scopeResult.explicit,
      quote: scopeResult.evidence[0]?.quote || null
    },
    i2Blocked: {
      question: 'What can they not do that they could do yesterday?',
      answer: blockedProcess ? blockedProcess.label : 'Not stated',
      quote: blockedProcess?.quote || null,
      blockedProcess
    },
    i3Irreversibility: {
      question: 'Is anything wrong, exposed, lost or unsafe — and can it be recovered?',
      answer: irreversibilityAnswer(symptom, risks, modifiers, recoverability),
      risks: Object.keys(risks).filter((k) => risks[k]),
      modifiers,
      recoverability: { value: recoverability.value, quote: recoverability.quote }
    },
    i4Containment: {
      question: 'Contained or spreading / recurring / unknown extent?',
      answer: containment.summary,
      containment
    },
    u5Deadline: {
      question: 'When do you need this by?',
      answer: deadlineResult.label,
      value: deadlineResult.deadline,
      committed: deadlineResult.committed,
      quote: deadlineResult.evidence[0]?.quote || null
    },
    u6Driver: {
      question: 'What creates the deadline — a requirement or a preference?',
      answer: driver.driver === 'unknown' ? 'Not stated' : driver.label,
      driver
    },
    u7Workaround: {
      question: 'Can work continue — and at what daily cost?',
      answer:
        workaroundResult.label +
        (workaroundResult.costPerDay ? ' (' + workaroundResult.costPerDay + ')' : ''),
      workaround: workaroundResult.workaround,
      costPerDay: workaroundResult.costPerDay
    },
    u8HarmTiming: {
      question: 'Harm happening now or waiting to happen? (expired vs expiring)',
      answer: harmTiming.timing === 'unknown' ? 'Not stated' : harmTiming.label,
      harmTiming
    }
  };
}

/* ------------------------------------------------------- follow-up questions -- */

function buildMissingInformation(context) {
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
        organisationConfig.schoolCount +
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

/* ------------------------------------------------------------- reasoning -- */

function buildReasoning(context) {
  const {
    scopeResult,
    systemResult,
    symptom,
    workaroundResult,
    deadlineResult,
    rules,
    priority,
    impact,
    urgency,
    impactBase,
    urgencyBase,
    isQuestion,
    recurring,
    undetected,
    inScope,
    containment,
    driver,
    harmTiming,
    blockedProcess,
    escalated,
    decisionContext,
    riskFlags
  } = context;

  const reasoning = [];
  if (!inScope) {
    return [
      'This does not appear to describe an IT or application-support request.',
      'Scope, deadlines and requester-declared priority are ignored until a support ' +
        'system, symptom or risk is recognised.',
      'Impact ' +
        LEVEL_LABELS[impact].toUpperCase() +
        ' and urgency ' +
        LEVEL_LABELS[urgency].toUpperCase() +
        ' map to ' +
        priority +
        ' in the priority matrix; treat this suggestion as unassessed.'
    ];
  }
  if (decisionContext.status === 'resolved') {
    reasoning.push(
      'The latest explicit update says the incident is resolved or contained, so it is not scored as live.'
    );
  }
  if (systemResult.primary)
    reasoning.push(
      describeSystems(systemResult.systems) + ' was identified as the affected system.'
    );
  if (symptom.severity > 0)
    reasoning.push('The reported symptom is "' + symptom.label.toLowerCase() + '".');
  if (isQuestion) reasoning.push('This reads as a question rather than a fault report.');
  else {
    reasoning.push(
      scopeResult.explicit
        ? 'The request describes ' + scopeResult.label.toLowerCase() + ' as affected.'
        : 'The request does not state how many people or schools are affected, so scope is unknown.'
    );
  }
  if (blockedProcess)
    reasoning.push(
      'Blocked process: "' + blockedProcess.quote + '" — ' + blockedProcess.label + '.'
    );
  if (workaroundResult.workaround !== 'unknown') {
    reasoning.push(
      workaroundResult.workaround === 'no'
        ? 'No workaround is available, so waiting has an immediate cost.'
        : 'A ' +
            workaroundResult.label.toLowerCase() +
            ' workaround was described, which reduces urgency without reducing impact.'
    );
  }
  if (workaroundResult.costPerDay)
    reasoning.push('Workaround cost: ' + workaroundResult.costPerDay + '.');
  if (!isQuestion || deadlineResult.deadline !== 'unknown') {
    reasoning.push(
      deadlineResult.deadline === 'unknown'
        ? 'No business deadline was found in the request.'
        : 'The stated timing is "' +
            deadlineResult.label.toLowerCase() +
            '"' +
            (deadlineResult.committed ? ' and is expressed as a commitment.' : '.')
    );
  }
  if (driver && driver.driver !== 'unknown')
    reasoning.push(
      'Driver: ' + driver.label + (driver.actor ? ' (' + driver.actor + ')' : '') + '.'
    );
  if (harmTiming && harmTiming.timing !== 'unknown')
    reasoning.push('Harm timing: ' + harmTiming.label + '.');
  if (containment) {
    if (containment.propagating)
      reasoning.push('Containment: ' + containment.summary + ' — raises impact, not urgency.');
    else if (containment.contained) reasoning.push('Containment: ' + containment.summary + '.');
    else if (containment.recurring || containment.undetected)
      reasoning.push('Containment: ' + containment.summary + '.');
  }
  if (recurring)
    reasoning.push(
      'This has happened before. The ticket is about the pattern, not the instance, so impact is assessed on the cumulative reach.'
    );
  if (undetected)
    reasoning.push(
      'The requester said affected records may exist without being reported, so the number involved is unknown.'
    );
  if (escalated)
    reasoning.push(
      'The request was escalated by a stakeholder. That is context only: who asked does not change what breaks.'
    );
  for (const flag of riskFlags) reasoning.push('Risk flagged: ' + flag.label + '.');
  if (context.urgencyResult?.claimedOnly)
    reasoning.push(
      'Urgency was asserted in the wording, but no business consequence was stated. Asserted urgency alone does not raise priority.'
    );
  for (const rule of rules) reasoning.push('Modifier applied: ' + rule.label);
  if (impactBase !== impact)
    reasoning.push(
      'Impact adjusted from ' + LEVEL_LABELS[impactBase] + ' to ' + LEVEL_LABELS[impact] + '.'
    );
  if (urgencyBase !== urgency)
    reasoning.push(
      'Urgency adjusted from ' + LEVEL_LABELS[urgencyBase] + ' to ' + LEVEL_LABELS[urgency] + '.'
    );
  reasoning.push(
    'Impact ' +
      LEVEL_LABELS[impact].toUpperCase() +
      ' and urgency ' +
      LEVEL_LABELS[urgency].toUpperCase() +
      ' map to ' +
      priority +
      ' in the priority matrix.'
  );
  return reasoning;
}

function buildJustification({
  scopeResult,
  workaroundResult,
  deadlineResult,
  symptom,
  riskFlags,
  impact,
  urgency,
  priority,
  inScope
}) {
  if (!inScope) {
    return (
      'No IT or application-support context recognised -> ' +
      LEVEL_LABELS[impact] +
      ' Impact + ' +
      LEVEL_LABELS[urgency] +
      ' Urgency -> ' +
      priority +
      ' (unassessed)'
    );
  }
  const facts = [];
  facts.push(scopeResult.explicit ? scopeResult.label + ' affected' : 'scope not stated');
  if (symptom.severity > 0) facts.push(symptom.label.toLowerCase());
  if (workaroundResult.workaround === 'yes') facts.push('workaround available');
  else if (workaroundResult.workaround === 'partial') facts.push('partial workaround only');
  else if (workaroundResult.workaround === 'no') facts.push('no workaround');
  if (deadlineResult.deadline === 'unknown') facts.push('no deadline stated');
  else if (deadlineResult.deadline === 'none') facts.push('no deadline required');
  else facts.push('needed ' + deadlineResult.label.toLowerCase());
  for (const flag of riskFlags.slice(0, 2)) facts.push(flag.label.toLowerCase() + ' involved');
  return (
    facts.join('; ') +
    ' -> ' +
    LEVEL_LABELS[impact] +
    ' Impact + ' +
    LEVEL_LABELS[urgency] +
    ' Urgency -> ' +
    priority
  );
}

/* ------------------------------------------------------- next-action input -- */

function nextActionEvidence(context) {
  const {
    assessmentStatus,
    workTypeResult,
    blockedProcess,
    deadlineResult,
    workaroundResult,
    containment,
    harmTiming,
    symptom,
    risks,
    modifiers,
    urgencyResult,
    applied,
    decisionContext
  } = context;
  const selected = (value, authority) => ({ value, authority });
  const riskAuthority = (key) =>
    applied.risks && Object.prototype.hasOwnProperty.call(applied.risks, key)
      ? 'analyst-confirmed'
      : risks[key]
        ? 'explicit'
        : 'unknown';
  const events = [];
  const harmAuthority = harmTiming.timing === 'active' ? 'explicit' : 'inferred';
  if (modifiers.exposureActive)
    events.push({ kind: 'active-exposure', authority: harmAuthority, temporal: 'current' });
  if (modifiers.propagating)
    events.push({
      kind: 'propagation',
      authority: applied.contained === 'spreading' ? 'analyst-confirmed' : 'explicit',
      temporal: 'current'
    });
  if (modifiers.immediateSafeguarding)
    events.push({
      kind: 'safeguarding-consequence',
      authority: harmAuthority,
      temporal: 'current'
    });
  if (risks.safety && harmTiming.timing === 'active')
    events.push({ kind: 'safety-consequence', authority: harmAuthority, temporal: 'current' });
  if (modifiers.unpaidRisk && harmTiming.timing === 'active')
    events.push({
      kind: 'material-financial-consequence',
      authority: harmAuthority,
      temporal: 'current'
    });
  return {
    assessmentStatus,
    workType: workTypeResult.workType,
    businessConsequence: selected(
      blockedProcess?.level || 'unknown',
      applied.consequence
        ? 'analyst-confirmed'
        : blockedProcess?.source === 'explicit'
          ? 'explicit'
          : 'inferred'
    ),
    deadline: selected(
      deadlineResult.deadline,
      applied.deadline ? 'analyst-confirmed' : deadlineResult.committed ? 'explicit' : 'unknown'
    ),
    deadlineRelationship:
      deadlineResult.deadline !== 'unknown' &&
      deadlineResult.deadline !== 'none' &&
      !deadlineResult.committed
        ? 'unknown'
        : 'known',
    workaround: selected(
      workaroundResult.workaround,
      applied.workaround ? 'analyst-confirmed' : 'explicit'
    ),
    containment: selected(
      containment.propagating ? 'spreading' : containment.contained ? 'contained' : 'unknown',
      'explicit'
    ),
    harm: selected(
      harmTiming.timing,
      harmTiming.source === 'manual' ? 'analyst-confirmed' : 'explicit'
    ),
    currentFailure: selected(
      Boolean(symptom.hasFailure),
      symptom.hasFailure ? 'explicit' : 'unknown'
    ),
    risks: Object.fromEntries(
      RISK_KEYS.map((key) => [key, selected(Boolean(risks[key]), riskAuthority(key))])
    ),
    events,
    verification: null,
    canWait: Boolean(urgencyResult.lowUrgencySignal),
    temporalState: decisionContext.status === 'resolved' ? 'resolved' : 'current'
  };
}

/* --------------------------------------------------------------- overrides -- */

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

/* ------------------------------------------------------------------ analyse -- */

export function analyse(rawText, overrides = {}) {
  const originalDoc = createDocument(rawText);
  if (!originalDoc.text) {
    return { empty: true, priority: null, reasoning: [], evidence: [] };
  }
  const doc = originalDoc;
  const evidenceLedger = createEvidenceLedger(doc);
  const applied = normaliseOverrides(overrides);
  const overridesApplied = Object.keys(applied).length > 0;

  const decisionContext = detectDecisionContext(doc);
  const systemResult = detectSystems(doc);
  const symptom = detectSymptom(doc);
  const recoverability = detectRecoverability(doc);

  const scopeEvidence = extractScopeEvidence(doc, evidenceLedger);
  const detectedScope = projectScope(scopeEvidence);
  const workaroundEvidence = extractWorkaroundEvidence(doc, evidenceLedger);
  const detectedWorkaround = projectWorkaround(workaroundEvidence);
  const detectedDeadline = detectDeadline(doc);
  const riskResult = detectRisks(doc, { symptom, scope: detectedScope });

  let scopeResult = applied.scope
    ? {
        ...detectedScope,
        scope: applied.scope,
        label: scopeLabel(applied.scope),
        explicit: applied.scope !== 'unknown',
        evidence: [
          { quote: 'manual input', meaning: 'Scope confirmed by the analyst', source: 'scope' }
        ]
      }
    : detectedScope;

  let workaroundResult = applied.workaround
    ? {
        ...detectedWorkaround,
        workaround: applied.workaround,
        label: workaroundLabel(applied.workaround),
        evidence: [
          {
            quote: 'manual input',
            meaning: 'Workaround confirmed by the analyst',
            source: 'workaround'
          }
        ]
      }
    : detectedWorkaround;
  if (applied.workaround) {
    evidenceLedger.add({
      type: 'workaround',
      value: applied.workaround,
      quote: 'manual input',
      authority: 'analyst-confirmed',
      temporal: 'current',
      role: applied.workaround === 'no' ? 'primary' : 'alternative-path'
    });
  }

  let deadlineResult = applied.deadline
    ? {
        ...detectedDeadline,
        deadline: applied.deadline,
        label: deadlineLabel(applied.deadline),
        committed: applied.deadline !== 'unknown',
        evidence: [
          {
            quote: 'manual input',
            meaning: 'Deadline confirmed by the analyst',
            source: 'deadline'
          }
        ]
      }
    : detectedDeadline;

  const risks = { ...emptyRisks(), ...riskResult.risks, ...(applied.risks || {}) };
  const raw = riskResult.rawModifiers;
  let modifiers = {
    ...riskResult.modifiers,
    unpaidRisk: raw.unpaidRisk && (risks.payroll || risks.financial),
    exposureActive: raw.exposureActive && (risks.privacy || risks.security),
    propagating: raw.propagating && risks.dataIntegrity,
    decisionRisk: raw.decisionRisk && (symptom.isDataIssue || risks.dataIntegrity),
    immediateSafeguarding: raw.immediateSafeguarding && risks.safeguarding
  };

  const recurring = has(doc, RECURRENCE_PHRASES);
  const undetected = has(doc, UNDETECTED_PHRASES);
  let containment = detectContainment(doc, risks);
  let driver = detectDriver(doc);
  let blockedProcess = detectBlockedProcess(doc);
  const harmTimingEvidence = extractHarmTimingEvidence(
    doc,
    symptom,
    {
      modifiers,
      blockedProcess,
      workaround: workaroundResult.workaround,
      workaroundCost: workaroundResult.costPerDay
    },
    evidenceLedger
  );
  let harmTiming = projectHarmTiming(harmTimingEvidence);

  if (applied.contained) {
    if (applied.contained === 'contained')
      containment = {
        ...containment,
        contained: true,
        propagating: false,
        recurring: false,
        undetected: false,
        summary: 'appears contained (manually confirmed)'
      };
    else if (applied.contained === 'spreading')
      containment = {
        ...containment,
        contained: false,
        propagating: true,
        summary: 'appears to be spreading (manually confirmed)'
      };
    else if (applied.contained === 'unknown')
      containment = {
        ...containment,
        contained: false,
        propagating: false,
        recurring: false,
        undetected: true,
        summary: 'unknown extent (manually confirmed)'
      };
  }
  if (applied.driver && applied.driver !== 'auto') {
    const labelMap = {
      statutory: 'a statutory or compliance deadline drives timing',
      operational: 'an operational or business event drives timing',
      preference: 'a preference rather than a deadline was expressed',
      none: 'no deadline driver'
    };
    driver = {
      driver: applied.driver,
      label: labelMap[applied.driver] || applied.driver,
      quote: 'manual input',
      actor: driver.actor,
      committed: applied.driver !== 'preference' && applied.driver !== 'none'
    };
  }
  if (applied.harm && applied.harm !== 'auto') {
    const labelMap = {
      active: 'harm is happening now',
      pending: 'harm is waiting to happen',
      unknown: null
    };
    harmTiming = {
      timing: applied.harm,
      label: labelMap[applied.harm],
      quote: applied.harm === 'unknown' ? null : 'manual input',
      source: 'manual'
    };
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
      evidence: [
        { quote: 'manual input', meaning: labelMap[applied.consequence], source: 'consequence' }
      ]
    };
  }
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
  const isQuestion = symptom.symptom === 'question' && !symptom.hasFailure;
  const workTypeResult = {
    workType: isQuestion ? 'question' : 'incident',
    label: isQuestion ? 'Question' : 'Incident'
  };

  const activeIncident = has(doc, ACTIVE_INCIDENT_PHRASES);
  const escalated = has(doc, ESCALATION_PHRASES);
  const relevance = assessInputRelevance({
    systemResult,
    symptom,
    risks,
    serviceManagementSignal: activeIncident || decisionContext.status !== 'active-or-unspecified'
  });
  const inScope = relevance.inScope;

  if (!inScope) {
    if (!applied.scope)
      scopeResult = {
        ...scopeResult,
        scope: 'unknown',
        label: scopeLabel('unknown'),
        explicit: false,
        allUsers: false,
        evidence: []
      };
    if (!applied.workaround)
      workaroundResult = {
        ...workaroundResult,
        workaround: 'unknown',
        label: workaroundLabel('unknown'),
        evidence: []
      };
    if (!applied.deadline)
      deadlineResult = {
        ...deadlineResult,
        deadline: 'unknown',
        label: deadlineLabel('unknown'),
        committed: false,
        asserted: false,
        evidence: []
      };
    if (!applied.driver)
      driver = { driver: 'unknown', label: null, quote: null, actor: null, committed: false };
  }

  const impactResult = assessImpact(doc, {
    scopeResult,
    symptom,
    riskResult: effectiveRisk,
    deadlineResult,
    systemResult,
    consequence: blockedProcess,
    harmTiming
  });
  let urgencyResult = assessUrgency(doc, {
    deadlineResult,
    workaroundResult,
    symptom,
    scopeResult,
    riskResult: effectiveRisk,
    driver,
    harmTiming,
    consequence: blockedProcess
  });

  const impactBase = impactResult.impact;
  const urgencyBase = urgencyResult.urgency;

  const modified = applyTriagePolicy({
    impact: impactBase,
    urgency: urgencyBase,
    evidence: policyEvidence({
      risks,
      modifiers,
      symptom,
      deadlineResult,
      scopeResult,
      workaroundResult,
      activeIncident,
      decisionContext,
      inScope,
      driver,
      harmTiming,
      recoverability,
      containment,
      urgencyResult,
      blockedProcess
    })
  });
  urgencyResult = {
    ...urgencyResult,
    urgency: modified.urgency,
    floorApplied: modified.floorApplied,
    policyIds: modified.policyIds
  };

  const impact = applied.impact || modified.impact;
  const urgency = applied.urgency || modified.urgency;
  const priority = priorityFor(impact, urgency);

  const simulate = (ov = {}) => {
    const scopeR = ov.scope
      ? {
          ...scopeResult,
          scope: ov.scope,
          label: scopeLabel(ov.scope),
          explicit: true,
          allUsers: false
        }
      : scopeResult;
    const deadlineR = ov.deadline
      ? {
          ...deadlineResult,
          deadline: ov.deadline,
          label: deadlineLabel(ov.deadline),
          committed: true,
          asserted: false
        }
      : deadlineResult;
    const workaroundR = ov.workaround
      ? { ...workaroundResult, workaround: ov.workaround, label: workaroundLabel(ov.workaround) }
      : workaroundResult;
    const mods = {
      ...modifiers,
      propagating: Boolean(modifiers.propagating || (ov.propagating && risks.dataIntegrity)),
      exposureActive: Boolean(
        modifiers.exposureActive || (ov.exposureActive && (risks.privacy || risks.security))
      ),
      decisionRisk: Boolean(
        modifiers.decisionRisk || (ov.decisionRisk && (symptom.isDataIssue || risks.dataIntegrity))
      )
    };
    const riskSim = { ...effectiveRisk, modifiers: mods };
    const imp = assessImpact(doc, {
      scopeResult: scopeR,
      symptom,
      riskResult: riskSim,
      deadlineResult: deadlineR,
      systemResult,
      consequence: blockedProcess,
      harmTiming
    });
    const urg = assessUrgency(doc, {
      deadlineResult: deadlineR,
      workaroundResult: workaroundR,
      symptom,
      scopeResult: scopeR,
      riskResult: riskSim,
      driver,
      harmTiming,
      consequence: blockedProcess
    });
    return priorityFor(imp.impact, urg.urgency);
  };

  const keyFacets = [];
  const changes = (tests) => tests.some((t) => simulate(t) !== priority);
  if (!scopeResult.explicit && changes([{ scope: 'all-schools' }, { scope: 'one-school' }]))
    keyFacets.push('i1');
  if (
    (!blockedProcess || blockedProcess.level === 'unknown') &&
    changes([{ consequence: 'blocked' }])
  )
    keyFacets.push('i2');
  if (
    deadlineResult.deadline === 'unknown' &&
    changes([{ deadline: 'today' }, { deadline: 'days-2-5' }])
  )
    keyFacets.push('u5');
  if (
    workaroundResult.workaround === 'unknown' &&
    changes([{ workaround: 'no' }, { workaround: 'yes' }])
  )
    keyFacets.push('u7');
  if (risks.dataIntegrity && !modifiers.propagating && changes([{ propagating: true }]))
    keyFacets.push('i4');
  if (
    (risks.privacy || risks.security) &&
    !modifiers.exposureActive &&
    changes([{ exposureActive: true }])
  )
    keyFacets.push('u8');

  const confidenceResult = assessConfidence(doc, {
    scopeResult,
    deadlineResult,
    workaroundResult,
    symptom,
    systemResult,
    impactResult,
    urgencyResult,
    overridesApplied,
    isQuestion,
    inScope,
    consequence: blockedProcess
  });

  const sparseUnrecognisedRequest =
    decisionContext.status === 'active-or-unspecified' &&
    symptom.severity === 0 &&
    !scopeResult.explicit &&
    !systemResult.primary &&
    deadlineResult.deadline === 'unknown' &&
    !Object.values(risks).some(Boolean) &&
    doc.wordCount < 10 &&
    !isQuestion;
  const insufficientInformation = !inScope || sparseUnrecognisedRequest;
  const assessmentStatus = insufficientInformation ? 'unassessed' : 'assessed';
  const suggestedPriority = insufficientInformation ? null : priority;

  const missingInfo = buildMissingInformation({
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
    currentPriority: priority,
    currentImpact: impact
  });

  const nextAction = recommendNextAction(
    nextActionEvidence({
      assessmentStatus,
      workTypeResult,
      blockedProcess,
      deadlineResult,
      workaroundResult,
      containment,
      harmTiming,
      symptom,
      risks,
      modifiers,
      urgencyResult,
      applied,
      decisionContext
    })
  );

  const rules = modified.rules.slice();
  if (applied.impact)
    rules.push({
      label: 'Impact manually set to ' + LEVEL_LABELS[applied.impact] + '.',
      direction: 'manual'
    });
  if (applied.urgency)
    rules.push({
      label: 'Urgency manually set to ' + LEVEL_LABELS[applied.urgency] + '.',
      direction: 'manual'
    });

  const riskFlags = Object.entries(risks)
    .filter(([, value]) => value)
    .map(([key]) => ({ key, label: RISK_LABELS[key] || key }));

  const reasoning = buildReasoning({
    scopeResult,
    systemResult,
    symptom,
    workaroundResult,
    deadlineResult,
    rules,
    priority,
    impact,
    urgency,
    impactBase,
    urgencyBase,
    isQuestion,
    recurring,
    undetected,
    inScope,
    containment,
    driver,
    harmTiming,
    blockedProcess,
    escalated,
    decisionContext,
    riskFlags,
    urgencyResult
  });

  const evidenceDetail = [
    ...decisionContext.evidence,
    ...systemResult.evidence,
    ...scopeResult.evidence,
    ...symptom.evidence,
    ...workaroundResult.evidence,
    ...deadlineResult.evidence,
    ...recoverability.evidence,
    ...(blockedProcess?.evidence || []),
    ...effectiveRisk.evidence
  ];

  const eightFacets = buildEightFacets({
    scopeResult,
    blockedProcess,
    symptom,
    risks,
    modifiers,
    recoverability,
    containment,
    deadlineResult,
    driver,
    workaroundResult,
    harmTiming
  });

  return {
    empty: false,
    priority,
    suggestedPriority,
    assessmentStatus,
    nextAction,
    justification: buildJustification({
      scopeResult,
      workaroundResult,
      deadlineResult,
      symptom,
      riskFlags,
      impact,
      urgency,
      priority,
      inScope
    }),
    priorityName: priorityDefinition(priority).name,
    priorityHeadline: priorityDefinition(priority).headline,

    impact,
    urgency,
    impactLabel: LEVEL_LABELS[impact],
    urgencyLabel: LEVEL_LABELS[urgency],

    workType: workTypeResult.workType,
    workTypeLabel: workTypeResult.label,
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
    recoverability: recoverability.value,
    consequence: blockedProcess?.level || 'unknown',
    businessConsequence: blockedProcess || {
      level: 'unknown',
      process: null,
      label: 'Business consequence not stated',
      quote: null,
      source: 'unknown',
      evidence: []
    },

    risks,
    riskFlags,
    riskModifiers: modifiers,
    dismissedRisks: riskResult.dismissed,

    confidence: confidenceResult.confidence,
    confidenceBand: confidenceResult.band,
    confidenceLabel: confidenceResult.label,
    conflicts: confidenceResult.conflicts,

    isQuestion,
    inScope,
    decisionContext,
    insufficientInformation,
    recurring,
    undetected,
    containment,
    driver,
    harmTiming,
    blockedProcess,
    eightFacets,

    evidence: evidenceDetail.map((e) => e.meaning),
    evidenceDetail,
    evidenceFacts: evidenceLedger.all(),
    reasoning,
    missingInformation: missingInfo.missing,
    missingInformationSummary: missingInfo.summary,
    followUpQuestions: missingInfo.questions,
    followUpQuestionMeta: missingInfo.meta,
    keyFacets,

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

    detail: {
      scope: scopeResult,
      deadline: deadlineResult,
      recoverability,
      workaround: workaroundResult,
      symptom,
      impactResult,
      urgencyResult,
      relevance,
      overridesApplied: applied,
      wordCount: doc.wordCount,
      normalisedText: doc.text,
      evidenceFacts: evidenceLedger.all()
    }
  };
}

export default analyse;
