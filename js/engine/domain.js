/**
 * Technical domain classification.
 *
 * Domains are topical, so negation is ignored here: "this is not a Power BI
 * problem" is still a Power BI ticket for routing purposes. Weighted keywords
 * are summed and the highest scoring domain wins, with declaration order as
 * the tie-break.
 */
import { scan } from './negation.js';
import { DOMAINS } from '../data/phrases.js';

const ENTRIES = DOMAINS.flatMap((domain) =>
  domain.m.map((keyword) => ({
    m: keyword.p,
    v: domain.id,
    w: keyword.w,
    negate: false,
    label: domain.label
  }))
);

const BY_ID = new Map(DOMAINS.map((d) => [d.id, d]));
const ORDER = new Map(DOMAINS.map((d, i) => [d.id, i]));

export function domainLabel(id) {
  const d = BY_ID.get(id);
  return d ? d.label : 'Unknown';
}

/**
 * When no domain keyword appears, the symptom itself implies where the work
 * belongs: "it is broken" with no other clue is an availability problem.
 */
const SYMPTOM_FALLBACK = {
  unavailable: 'application-availability',
  stopped: 'application-availability',
  failed: 'application-availability',
  'action-blocked': 'application-availability',
  'authentication-failed': 'identity-auth',
  'expired-credential': 'identity-auth',
  'access-denied': 'access-authorisation',
  timeout: 'application-performance',
  degraded: 'application-performance',
  intermittent: 'application-performance',
  'not-synchronising': 'integration-api',
  'not-writing': 'data-pipeline',
  'sql-error': 'database-sql',
  'job-failed': 'scheduled-job',
  'missing-data': 'data-quality',
  'incorrect-data': 'data-quality',
  'unstable-data': 'data-quality',
  rejected: 'data-quality',
  'not-delivered': 'messaging',
  backlog: 'integration-api',
  'access-not-revoked': 'access-authorisation',
  'certificate-error': 'certificates-ssl',
  capacity: 'endpoint-server',
  'duplicate-data': 'data-quality',
  'corrupt-data': 'data-quality',
  'stale-data': 'data-quality',
  'partial-data': 'data-quality',
  'build-failed': 'devops-cicd',
  'merge-blocked': 'devops-cicd',
  'meeting-failure': 'collaboration',
  'replication-lag': 'database-sql',
  'feature-request': 'feature-enhancement',
  question: 'documentation'
};

/**
 * Where a named system is unambiguous about its domain, it beats the symptom
 * fallback: "Wonde has stopped" is an integration problem, not a generic
 * availability problem. Systems whose domain depends on the ticket (Laserfiche,
 * Canvas, Edumate) are deliberately absent.
 */
const SYSTEM_DOMAIN_FALLBACK = {
  wonde: 'integration-api',
  azuredevops: 'devops-cicd',
  teams: 'collaboration',
  db2: 'database-sql',
  postgres: 'database-sql',
  sqlite: 'database-sql',
  sql: 'database-sql',
  powerbi: 'reporting-bi',
  entra: 'identity-auth',
  aurion: 'payroll-finance',
  anz: 'payroll-finance',
  calumo: 'payroll-finance',
  helpdesk: 'helpdesk-itsm',
  powerautomate: 'scheduled-job'
};

/**
 * @param {object} doc
 * @param {object} systemResult  result of detectSystems(), used as a nudge
 * @param {object} symptom       result of detectSymptom(), used as a fallback
 * @returns {{ domain, label, scores, ranked, evidence, inferred }}
 */
export function detectDomain(doc, systemResult = { systems: [] }, symptom = null) {
  const scores = new Map();
  const quotes = new Map();

  for (const hit of scan(doc, ENTRIES, { negate: false })) {
    const id = hit.entry.v;
    scores.set(id, (scores.get(id) || 0) + hit.entry.w);
    if (!quotes.has(id)) quotes.set(id, hit.quote);
  }

  // A recognised system is a weak nudge towards its usual domain.
  const SYSTEM_HINTS = {
    powerbi: 'reporting-bi',
    laserfiche: 'data-pipeline',
    aurion: 'payroll-finance',
    anz: 'payroll-finance',
    calumo: 'payroll-finance',
    entra: 'identity-auth',
    helpdesk: 'helpdesk-itsm',
    sql: 'database-sql',
    powerautomate: 'scheduled-job'
  };
  for (const system of systemResult.systems || []) {
    const hint = SYSTEM_HINTS[system.id];
    if (hint && scores.has(hint)) scores.set(hint, scores.get(hint) + 0.5);
  }

  const ranked = [...scores.entries()]
    .map(([id, score]) => ({ id, label: domainLabel(id), score, quote: quotes.get(id) }))
    .sort((a, b) => b.score - a.score || ORDER.get(a.id) - ORDER.get(b.id));

  const primary = ranked[0] || null;
  if (primary) {
    return {
      domain: primary.id,
      label: primary.label,
      inferred: false,
      scores,
      ranked,
      evidence: [{ quote: primary.quote, meaning: primary.label + ' domain', source: 'domain' }]
    };
  }

  for (const system of systemResult.systems || []) {
    const viaSystem = SYSTEM_DOMAIN_FALLBACK[system.id];
    if (!viaSystem) continue;
    return {
      domain: viaSystem,
      label: domainLabel(viaSystem),
      inferred: true,
      scores,
      ranked,
      evidence: [{
        quote: system.quote,
        meaning: domainLabel(viaSystem) + ' domain (inferred from ' + system.name + ')',
        source: 'domain'
      }]
    };
  }

  const fallback = symptom && SYMPTOM_FALLBACK[symptom.symptom];
  if (fallback) {
    return {
      domain: fallback,
      label: domainLabel(fallback),
      inferred: true,
      scores,
      ranked,
      evidence: symptom.evidence.length
        ? [{
            quote: symptom.evidence[0].quote,
            meaning: domainLabel(fallback) + ' domain (inferred from the symptom)',
            source: 'domain'
          }]
        : []
    };
  }

  return { domain: 'unknown', label: 'Unknown', inferred: false, scores, ranked, evidence: [] };
}
