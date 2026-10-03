/**
 * Decision context — the one context rule kept from the old engine.
 *
 * A ticket that explicitly says the incident is now resolved must not be scored
 * as live. It is deliberately small; the analyst can always correct it in the
 * refine panel.
 */

const RESOLVED_RE =
  /\b(?:is|was|has been|now)\s+(?:fixed|resolved|restored|recovered)\b|\bworking again\b|\bback online\b|\bno action (?:is )?required\b|\baccess (?:has|had|was) (?:been )?(?:removed|revoked)\b|\bissue (?:is|was) contained\b/;
const REOPENED_RE =
  /\b(?:not (?:fixed|resolved|restored)|still (?:down|failing|failed|broken|blocked|unavailable)|(?:down|failed|failing|broken|blocked|unavailable|stopped|recurred) again|continues? to fail)\b/;

/** @returns {{ status: 'resolved'|'active-or-unspecified', evidence: object[] }} */
export function detectDecisionContext(doc) {
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

export default detectDecisionContext;
