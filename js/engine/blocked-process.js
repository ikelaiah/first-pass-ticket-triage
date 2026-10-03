/**
 * I2 — the business process that cannot continue, not the technical symptom.
 *
 * "Canvas is slow" and "teachers cannot mark the roll" are different tickets.
 * Only explicit blocked/impaired-process wording is read here; a technical
 * symptom alone is never relabelled as a business consequence.
 */
import { scanPositive } from './negation.js';
import { BLOCKED_PROCESS_PHRASES, IMPAIRED_PROCESS_PHRASES } from '../data/phrases.js';

/** @returns {any} a blocked/impaired consequence fact, or null */
export function detectBlockedProcess(doc) {
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

export default detectBlockedProcess;
