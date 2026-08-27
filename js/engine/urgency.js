/**
 * Urgency assessment - how quickly a consequence arrives.
 *
 * Urgency answers "what happens if we wait?", not "how loudly was this
 * reported?". Asserted urgency ("URGENT!!!") contributes very little on its
 * own and is reported separately so the user can see it was discounted.
 */
import { scanPositive } from './negation.js';
import {
  LOW_URGENCY_PHRASES,
  BLOCKED_PHRASES,
  CLAIMED_URGENCY_PHRASES,
  ACTIVE_NOW_PHRASES,
  REGRESSION_PHRASES,
  SLA_BREACH_PHRASES
} from '../data/phrases.js';
import { deadlineDefinition } from './deadline.js';
import { scopeDefinition } from './scope.js';
import { SEVERITY } from './symptom.js';

export const URGENCY_LEVELS = ['low', 'medium', 'high'];
export const URGENCY_THRESHOLDS = { high: 2.5, medium: 0.75 };
export const URGENCY_RANGE = { min: -4, max: 6 };

const WORKAROUND_WEIGHT = { yes: -1.25, partial: -0.25, no: 1.75, unknown: 0 };

const SEVERITY_URGENCY = new Map([
  [SEVERITY.OUTAGE, 1],
  [SEVERITY.SEVERE, 0.9],
  [SEVERITY.FAILURE, 1],
  [SEVERITY.DATA, 0.75],
  [SEVERITY.DEGRADED, 0.5],
  [SEVERITY.COSMETIC, 0],
  [SEVERITY.NONE, 0]
]);

/** Deadlines that create an approaching, but not immediate, consequence. */
const APPROACHING = ['tomorrow', 'days-2-5', 'weeks-1-2'];

export function urgencyLevelFromScore(score) {
  if (score >= URGENCY_THRESHOLDS.high) return 'high';
  if (score >= URGENCY_THRESHOLDS.medium) return 'medium';
  return 'low';
}

/**
 * @param {object} doc
 * @param {object} ctx { deadlineResult, workaroundResult, symptom, scopeResult, riskResult }
 * @returns {{ urgency, score, contributions, claimedOnly, floorApplied }}
 */
export function assessUrgency(doc, ctx) {
  const { deadlineResult, workaroundResult, symptom, scopeResult, riskResult } = ctx;
  const modifiers = riskResult.modifiers;
  const contributions = [];

  const add = (value, label, quote) => {
    if (!value) return;
    contributions.push({ value: Math.round(value * 100) / 100, label, quote });
  };

  // --- deadline ---------------------------------------------------------
  const deadlineDef = deadlineDefinition(deadlineResult.deadline);
  const assertedOnly = deadlineResult.asserted === true;
  const deadlineQuote = deadlineResult.evidence[0] ? deadlineResult.evidence[0].quote : undefined;
  if (assertedOnly) {
    add(0.5, 'Immediacy was asserted, but no business consequence was stated', deadlineQuote);
  } else if (deadlineDef.urgencyWeight) {
    add(deadlineDef.urgencyWeight, 'Deadline: ' + deadlineDef.label, deadlineQuote);
  }

  // --- workaround -------------------------------------------------------
  const workaroundWeight = WORKAROUND_WEIGHT[workaroundResult.workaround] || 0;
  if (workaroundWeight) {
    add(
      workaroundWeight,
      'Workaround: ' + workaroundResult.label,
      workaroundResult.evidence[0] ? workaroundResult.evidence[0].quote : undefined
    );
  }

  // --- what is happening now -------------------------------------------
  if (symptom.severity) {
    add(
      SEVERITY_URGENCY.get(symptom.severity) || 0,
      'An active symptom was reported: ' + symptom.label,
      symptom.evidence[0] ? symptom.evidence[0].quote : undefined
    );
  }

  const blocked = scanPositive(doc, BLOCKED_PHRASES);
  if (blocked.length) {
    // "no workaround" and "completely blocked" describe the same fact once,
    // and a confirmed workaround means work is not, in fact, fully blocked.
    const blockedWeight =
      workaroundResult.workaround === 'yes' ? 0 :
      workaroundResult.workaround === 'no' ? 0.75 : 1.75;
    add(blockedWeight, 'Work is currently blocked', blocked[0].quote);
  }

  // Breadth only adds urgency when something is actually failing. Records that
  // were never created across many schools are a big *impact*; they are not an
  // outage in progress, and the deadline decides how soon they matter.
  const broad =
    scopeDefinition(scopeResult.scope).rank >= scopeDefinition('multiple-schools').rank;
  // If a comparable record is working, this is not a broad outage.
  if (broad && symptom.severity >= SEVERITY.FAILURE && !ctx.differential) {
    add(1, 'A failure is affecting many schools at once');
  }
  if (scopeResult.allUsers && !scopeResult.explicit) {
    add(1, 'No user of the affected system can proceed');
  }
  if (modifiers.systemicJobs) {
    add(1, 'System-wide processing has stopped');
  }

  const regression = scanPositive(doc, REGRESSION_PHRASES);
  if (regression.length) {
    add(regression[0].entry.w, regression[0].entry.label, regression[0].quote);
  }

  const slaBreach = scanPositive(doc, SLA_BREACH_PHRASES);
  if (slaBreach.length) {
    add(slaBreach[0].entry.w, slaBreach[0].entry.label, slaBreach[0].quote);
  }

  let activeBonus = 0;
  for (const hit of scanPositive(doc, ACTIVE_NOW_PHRASES)) {
    if (activeBonus >= 0.5) break;
    activeBonus += hit.entry.w;
    add(hit.entry.w, hit.entry.label, hit.quote);
  }

  // --- the requester says it can wait -----------------------------------
  let lowTotal = 0;
  for (const hit of scanPositive(doc, LOW_URGENCY_PHRASES)) {
    if (lowTotal <= -3) break;
    const value = Math.max(hit.entry.w, -3 - lowTotal);
    lowTotal += value;
    add(value, hit.entry.label, hit.quote);
  }

  // --- the requester says it is urgent ----------------------------------
  const claimed = scanPositive(doc, CLAIMED_URGENCY_PHRASES);
  if (claimed.length) {
    add(0.75, 'Urgency was asserted by the requester', claimed[0].quote);
  }

  const raw = contributions.reduce((sum, c) => sum + c.value, 0);
  let score = Math.max(URGENCY_RANGE.min, Math.min(URGENCY_RANGE.max, raw));
  let urgency = urgencyLevelFromScore(score);

  // A stated future deadline means a consequence is approaching, even when
  // a workaround is holding things together in the meantime.
  let floorApplied = false;
  if (urgency === 'low' && APPROACHING.includes(deadlineResult.deadline)) {
    urgency = 'medium';
    floorApplied = true;
  }

  // Urgency claimed, but nothing corroborates it.
  const corroborated =
    (deadlineResult.deadline !== 'unknown' && !assertedOnly) ||
    workaroundResult.workaround === 'no' ||
    blocked.length > 0 ||
    scopeResult.explicit;

  return {
    urgency,
    score: Math.round(score * 100) / 100,
    rawScore: Math.round(raw * 100) / 100,
    contributions,
    floorApplied,
    claimed: claimed.length > 0,
    claimedOnly: claimed.length > 0 && !corroborated,
    blocked: blocked.length > 0
  };
}
