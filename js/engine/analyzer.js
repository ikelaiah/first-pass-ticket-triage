/**
 * The analysis pipeline.
 *
 *   ticket text
 *      > evidence          (system, symptom, the eight decision questions, risks)
 *      > Impact + Urgency  (weighted scoring, then a small safety calibration)
 *      > priority matrix   (the only place a P number is decided)
 *      > explanation       (reasoning, missing information, follow-up questions)
 *
 * This file is the orchestrator. The focused pieces live alongside it:
 * decision-context, blocked-process, input-relevance, facets,
 * follow-up-questions, reasoning, next-action-evidence, policy-evidence and
 * overrides. The engine detects what the ticket states for the eight questions
 * and, when a question is unknown, asks rather than guessing.
 *
 * Everything happens in this browser. No network call exists in this module or
 * anywhere else in the application.
 */
import { createDocument, has } from './negation.js';
import { createEvidenceLedger } from './evidence.js';
import { detectSystems, failingFloor } from '../data/systems.js';
import { extractScopeEvidence, projectScope, scopeLabel, scopeDefinition } from './scope.js';
import { extractWorkaroundEvidence, projectWorkaround, workaroundLabel } from './workaround.js';
import { detectDeadline, deadlineLabel } from './deadline.js';
import { detectSymptom } from './symptom.js';
import { detectRisks, emptyRisks, RISK_LABELS } from './risks.js';
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
import { detectDecisionContext } from './decision-context.js';
import { detectBlockedProcess } from './blocked-process.js';
import { assessInputRelevance } from './input-relevance.js';
import { policyEvidence } from './policy-evidence.js';
import { buildEightFacets } from './facets.js';
import { buildMissingInformation } from './follow-up-questions.js';
import { buildReasoning, buildJustification } from './reasoning.js';
import { nextActionEvidence } from './next-action-evidence.js';
import { normaliseOverrides } from './overrides.js';
import {
  RECURRENCE_PHRASES,
  UNDETECTED_PHRASES,
  ACTIVE_INCIDENT_PHRASES,
  ESCALATION_PHRASES
} from '../data/phrases.js';

/**
 * Analyse a ticket.
 * @param {string} rawText
 * @param {object} [overrides]  manual refinements from the UI
 * @returns {any} the result model
 */
export function analyse(rawText, overrides = {}) {
  const doc = createDocument(rawText);
  if (!doc.text) {
    return { empty: true, priority: null, reasoning: [], evidence: [] };
  }
  const evidenceLedger = createEvidenceLedger(doc);
  const applied = normaliseOverrides(overrides);
  const overridesApplied = Object.keys(applied).length > 0;

  // --- evidence ---------------------------------------------------------
  const decisionContext = detectDecisionContext(doc);
  const systemResult = detectSystems(doc);
  const symptom = detectSymptom(doc);
  const recoverability = detectRecoverability(doc);
  // The floor belongs to the system actually failing, not any system mentioned.
  const failureFloor = failingFloor(systemResult, symptom);

  const scopeEvidence = extractScopeEvidence(doc, evidenceLedger);
  let detectedScope = projectScope(scopeEvidence);

  const workaroundEvidence = extractWorkaroundEvidence(doc, evidenceLedger);
  const detectedWorkaround = projectWorkaround(workaroundEvidence);

  // Shared-instance blast radius: when a platform runs on one instance shared by
  // every tenant, a confirmed failure reported for a single tenant means the
  // shared instance is down for all of them. Widen the affected scope so the
  // impact reflects the true population. Guarded: only a real failure (not
  // slow/degraded), not a resolved incident, not a problem scoped to one or two
  // people, and not one a stated workaround is already absorbing.
  const narrowIndividualScope = ['individual', 'few-users'].some((s) => s === detectedScope.scope);
  const workaroundAbsorbing =
    detectedWorkaround.workaround === 'yes' || detectedWorkaround.workaround === 'partial';
  const sharedInstanceFailure =
    systemResult.sharedInstanceSystem &&
    symptom.hasFailure &&
    !narrowIndividualScope &&
    !workaroundAbsorbing &&
    decisionContext.status !== 'resolved';
  if (
    sharedInstanceFailure &&
    scopeDefinition(detectedScope.scope).rank < scopeDefinition('all-schools').rank
  ) {
    detectedScope = {
      ...detectedScope,
      scope: 'all-schools',
      label: scopeLabel('all-schools'),
      // The escalation is evidence-backed (a shared instance), so the scope is
      // definite even though the ticket did not literally state "all schools".
      // Marking it explicit keeps the impact label honest instead of reading
      // "scope not stated" next to an all-schools weight.
      explicit: true,
      escalated: true,
      sharedInstanceEscalated: true,
      evidence: [
        ...detectedScope.evidence,
        {
          quote: systemResult.primary ? systemResult.primary.name : 'shared platform',
          meaning:
            'A shared-instance platform failure for one tenant affects every ' +
            'tenant that uses the same instance',
          source: 'system'
        }
      ]
    };
  }

  const detectedDeadline = detectDeadline(doc);
  const riskResult = detectRisks(doc, { symptom, scope: detectedScope });

  // --- manual refinements ----------------------------------------------
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

  // --- impact and urgency ----------------------------------------------
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
    consequence: blockedProcess,
    systemResult,
    decisionContext
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
      blockedProcess,
      systemResult,
      failureFloor
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

  // Re-run the scoring with a hypothetical answer, to rank follow-up questions
  // by whether they could move the matrix cell.
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
      consequence: blockedProcess,
      systemResult,
      decisionContext
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

  // --- explanation ------------------------------------------------------
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

  // Advisory-only: downstream of the scoring path.
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
