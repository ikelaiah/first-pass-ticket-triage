/**
 * Recoverability evidence for data-loss policy decisions.
 *
 * This is intentionally a small evidence adapter, not a general language
 * model: only explicit recovery/no-recovery statements are trusted.
 */
const UNRECOVERABLE = [
  /\bpermanently\s+(?:deleted|lost|wiped)\b/i,
  /\b(?:can not|cannot|will not|won't)\s+be\s+recovered\b/i,
  /\bno\s+(?:usable\s+)?(?:backup|restore point)\b/i,
  /\b(?:irretrievable|unrecoverable|lost forever)\b/i
];

const RECOVERABLE = [
  /\bcan\s+be\s+restored\b/i,
  /\brecoverable\b/i,
  /\b(?:restore|restored)\b[^.;!?]{0,45}\bbackup\b/i,
  /\bbackup\s+(?:exists|is available|is usable)\b/i,
  /\bfrom\s+(?:last|a|the)\s+[^.;!?]{0,25}\bbackup\b/i,
  /\b(?:recycle bin|snapshot)\b/i
];

function firstMatch(text, patterns) {
  for (const pattern of patterns) {
    const match = String(text).match(pattern);
    if (match) return match[0].trim();
  }
  return null;
}

/** @returns {{ value: 'recoverable'|'unrecoverable'|'unknown', quote: string|null, evidence: object[] }} */
export function detectRecoverability(doc) {
  const unrecoverable = firstMatch(doc?.text, UNRECOVERABLE);
  if (unrecoverable) {
    return {
      value: 'unrecoverable',
      quote: unrecoverable,
      evidence: [{ quote: unrecoverable, meaning: 'data is explicitly not recoverable', source: 'recoverability' }]
    };
  }
  const recoverable = firstMatch(doc?.text, RECOVERABLE);
  if (recoverable) {
    return {
      value: 'recoverable',
      quote: recoverable,
      evidence: [{ quote: recoverable, meaning: 'a recovery path is explicitly available', source: 'recoverability' }]
    };
  }
  return { value: 'unknown', quote: null, evidence: [] };
}

export default detectRecoverability;
