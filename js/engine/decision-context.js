/**
 * Decision context — the one context rule kept from the old engine.
 *
 * A ticket that explicitly says the incident is now resolved must not be scored
 * as live. It is deliberately small; the analyst can always correct it in the
 * refine panel.
 */

const RESOLVED_RE =
  // "is/was/has been (since/already/now) fixed|resolved|restored|recovered|sorted|solved"
  /\b(?:is|was|has been|have been|now|since)\s+(?:since\s+|already\s+|just\s+|been\s+|now\s+)?(?:fixed|resolved|restored|recovered|sorted|solved)\b|\b(?:fixed|resolved|restored|recovered|sorted|solved)\s+(?:now|again|itself)\b|\b(?:problem|issue|matter)\s+(?:(?:is|was|has been)\s+)?(?:solved|sorted|fixed|resolved|restored)\b|\b(?:it|that|this)\s+(?:is|was|has been)\s+(?:solved|sorted|fixed|resolved|restored)\b|\bworking again\b|\bback (?:online|up|to normal)\b|\bup and running\b|\ball good now\b|\bback to normal\b|\bno action (?:is )?required\b|\baccess (?:has|had|was) (?:been )?(?:removed|revoked)\b|\bissue (?:is|was) contained\b/;
const REOPENED_RE =
  /\b(?:not (?:fixed|resolved|restored|recovered|sorted|solved)|never (?:fixed|resolved|restored)|still (?:down|failing|failed|broken|blocked|unavailable|not working)|(?:down|failed|failing|broken|blocked|unavailable|stopped|recurred|resurfaced) again|\brecurred\b|\bresurfaced\b|continues? to (?:fail|be)|remains? (?:down|broken|unavailable|unresolved))\b/;

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
