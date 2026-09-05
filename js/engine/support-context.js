/*
 * Explicit support-context recognition for incidents whose system name is not
 * configured. This is a relevance boundary, not a priority policy: it records
 * that a concrete digital/control/service failure was stated without inventing
 * scope, consequence, or authority for the downstream scorers.
 */
const CONTEXTS = [
  {
    id: 'keyboard-operability',
    pattern: /\bkeyboard\b[^.!?;]{0,80}\b(?:can not|cannot|unable to|will not|does not)\b[^.!?;]{0,80}\b(?:activate|reach|select|use|save|submit|approve|approval|control|button)\b/i
  },
  {
    id: 'stale-operational-display',
    pattern: /\b(?:arrival |departure |live )?(?:display|board|screen)\b[^.!?;]{0,80}\b(?:showing|shows|is)\b[^.!?;]{0,80}\b(?:stale|yesterday(?:'s)?|out[- ]of[- ]date)\b/i
  },
  {
    id: 'former-user-sensitive-access',
    pattern: /\b(?:former|retired|departed|left)\b[^.!?;]{0,80}\b(?:volunteer|staff|contractor|worker|user|account)\b[^.!?;]{0,100}\b(?:still|continues to)\b[^.!?;]{0,60}\b(?:opens?|access|sign in|view)\b[^.!?;]{0,100}\b(?:welfare|wellbeing|case notes?|medical|student records?)\b|\b(?:volunteer|staff|contractor|worker|user|account)\b[^.!?;]{0,80}\b(?:former|retired|departed|left)\b[^.!?;]{0,100}\b(?:still|continues to)\b[^.!?;]{0,60}\b(?:opens?|access|sign in|view)\b[^.!?;]{0,100}\b(?:welfare|wellbeing|case notes?|medical|student records?)\b/i
  },
  {
    id: 'digital-safety-control',
    pattern: /\b(?:digital|online|electronic)\b[^.!?;]{0,40}\b(?:panel|control|status)\b[^.!?;]{0,120}\b(?:eyewash|emergency|safety)\b|\b(?:safety panel|safety control)\b[^.!?;]{0,120}\b(?:eyewash|emergency)\b[^.!?;]{0,100}\b(?:dry|failed|not working|unavailable)\b/i
  },
  {
    id: 'real-defect-discovered-in-drill',
    pattern: /\b(?:during|today(?:'s)?)\s+(?:an?\s+)?(?:emergency\s+)?drill\b[^.!?;]{0,120}\b(?:roster|list)\b[^.!?;]{0,80}\b(?:can not|cannot|unable to|will not|does not)\s+(?:be\s+)?(?:open(?:ed)?|load(?:ed)?|display)\b|\b(?:drill|emergency)\s+(?:roster|list)\b[^.!?;]{0,80}\b(?:can not|cannot|unable to|will not|does not)\s+(?:be\s+)?(?:open(?:ed)?|load(?:ed)?|display)\b/i,
    reject: /\b(?:simulate|simulation|for next|next month)\b/i
  },
  {
    id: 'business-submission-service',
    pattern: /\b(?:service|portal|system)\b[^.!?;]{0,100}\b(?:rejects?|rejected)\b[^.!?;]{0,100}\b(?:submit|submission|submissions|lodg(?:e|ing))\b/i
  }
];

export function detectExplicitSupportContext(doc) {
  const text = String(doc?.text || '');
  for (const context of CONTEXTS) {
    const match = text.match(context.pattern);
    if (match && (!context.reject || !context.reject.test(text))) {
      return {
        id: context.id,
        quote: match[0].trim(),
        evidence: [{ quote: match[0].trim(), meaning: 'explicit support context', source: 'support-context' }]
      };
    }
  }
  return null;
}

export default detectExplicitSupportContext;
