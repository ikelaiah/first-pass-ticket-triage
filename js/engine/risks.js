/**
 * Critical risk detection.
 *
 * Risks are *modifiers*: they can raise impact or urgency before the matrix is
 * applied, but they never map straight to a priority. "This system contains
 * PII" is not an incident; "parent details are visible to another parent" is.
 */
import { scan, isNegated } from './negation.js';
import { RISK_DEFINITIONS, RISK_MODIFIERS } from '../data/phrases.js';

export const RISK_KEYS = RISK_DEFINITIONS.map((r) => r.key);

export const RISK_LABELS = RISK_DEFINITIONS.reduce((acc, r) => {
  acc[r.key] = r.label;
  return acc;
}, {});

export function emptyRisks() {
  return RISK_KEYS.reduce((acc, key) => {
    acc[key] = false;
    return acc;
  }, {});
}

/** Run a modifier pattern list, honouring negation. */
function matchModifier(doc, patterns) {
  for (const pattern of patterns) {
    const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
    let m;
    while ((m = re.exec(doc.text)) !== null) {
      if (m[0] === '') { re.lastIndex += 1; continue; }
      if (!isNegated(doc, m.index, m.index + m[0].length)) {
        return { quote: m[0].trim(), index: m.index };
      }
    }
  }
  return null;
}

/**
 * @param {object} doc
 * @param {object} context  { symptom, scope }
 * @returns {{ risks, modifiers, evidence, dismissed }}
 */
export function detectRisks(doc, context = {}) {
  const symptom = context.symptom || { hasFailure: false, isDataIssue: false };
  const risks = emptyRisks();
  const evidence = [];
  const dismissed = [];

  const entries = RISK_DEFINITIONS.map((r) => ({ m: r.m, v: r.key, label: r.label }));
  for (const hit of scan(doc, entries)) {
    if (hit.negated) {
      dismissed.push({ quote: hit.quote, meaning: hit.entry.label + ' explicitly ruled out' });
      continue;
    }
    if (!risks[hit.entry.v]) {
      risks[hit.entry.v] = true;
      evidence.push({
        quote: hit.quote,
        meaning: hit.entry.label + ' risk referenced',
        source: 'risk',
        key: hit.entry.v
      });
    }
  }

  // A shared integration is only a *risk* when something has actually failed.
  // Clear the evidence too, or the card cites a flag it is not raising.
  if (risks.criticalIntegration && !symptom.hasFailure) {
    risks.criticalIntegration = false;
    for (let i = evidence.length - 1; i >= 0; i -= 1) {
      if (evidence[i].key === 'criticalIntegration') evidence.splice(i, 1);
    }
  }

  const modifiers = {};
  for (const [key, patterns] of Object.entries(RISK_MODIFIERS)) {
    const found = matchModifier(doc, patterns);
    modifiers[key] = Boolean(found);
    if (found) {
      evidence.push({
        quote: found.quote,
        meaning: MODIFIER_MEANINGS[key] || key,
        source: 'risk-modifier',
        key
      });
    }
  }

  // Someone seeing another family's information, or a record attached to the
  // wrong person, *is* a personal-information concern even when the ticket
  // never uses the word "privacy".
  if ((modifiers.crossPersonVisibility || modifiers.crossPersonLink) && !risks.privacy) {
    risks.privacy = true;
    evidence.push({
      quote: 'wrong person',
      meaning: modifiers.crossPersonVisibility
        ? 'Personal information may be visible to the wrong person'
        : 'A record appears to be attached to the wrong person',
      source: 'risk',
      key: 'privacy'
    });
  }

  // Keep the ungated flags so the analyzer can re-gate them after the user
  // manually ticks or clears a risk in the refinement panel.
  const rawModifiers = { ...modifiers };

  // Constrain modifiers to the risks they qualify.
  modifiers.unpaidRisk = modifiers.unpaidRisk && (risks.payroll || risks.financial);
  modifiers.exposureActive = modifiers.exposureActive && (risks.privacy || risks.security);
  modifiers.propagating = modifiers.propagating && risks.dataIntegrity;
  modifiers.decisionRisk = modifiers.decisionRisk && (symptom.isDataIssue || risks.dataIntegrity);
  modifiers.immediateSafeguarding = modifiers.immediateSafeguarding && risks.safeguarding;

  return {
    risks,
    modifiers,
    rawModifiers,
    dismissed,
    evidence: evidence.filter(
      (e) => e.source !== 'risk-modifier' || modifiers[e.key]
    )
  };
}

const MODIFIER_MEANINGS = {
  unpaidRisk: 'people may not be paid',
  exposureActive: 'information is actively exposed',
  crossPersonVisibility: 'someone can see another person\'s information',
  crossPersonLink: 'a record is attached to the wrong person',
  propagating: 'incorrect data appears to be spreading',
  decisionRisk: 'data may be used to make a decision',
  immediateSafeguarding: 'immediate safeguarding concern',
  systemicJobs: 'system-wide processing has stopped'
};

export { MODIFIER_MEANINGS };
