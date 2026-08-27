/**
 * Workaround detection.
 *
 * Negation flips the polarity: "we have a workaround" and "we do not have a
 * workaround" share the same keyword and must not share the same answer.
 */
import { scan } from './negation.js';
import { WORKAROUND_PHRASES } from '../data/phrases.js';

const LABELS = {
  yes: 'Yes',
  partial: 'Partial',
  no: 'No',
  unknown: 'Unknown'
};

export function workaroundLabel(id) {
  return LABELS[id] || LABELS.unknown;
}

/** A negated "workaround exists" claim becomes "no workaround", and vice versa. */
function flip(value) {
  if (value === 'yes') return 'no';
  if (value === 'no') return 'yes';
  return value;
}

/**
 * @returns {{ workaround, label, evidence, votes }}
 */
export function detectWorkaround(doc) {
  const votes = { yes: 0, partial: 0, no: 0 };
  const evidence = [];

  for (const hit of scan(doc, WORKAROUND_PHRASES)) {
    const value = hit.negated ? flip(hit.entry.v) : hit.entry.v;
    if (!votes.hasOwnProperty(value)) continue;
    votes[value] += 1;
    evidence.push({
      quote: hit.quote,
      meaning: hit.negated
        ? 'negated: ' + hit.entry.label.replace(/^no /, 'no ')
        : hit.entry.label,
      source: 'workaround',
      value
    });
  }

  let workaround = 'unknown';
  if (votes.no > 0) workaround = 'no';
  else if (votes.partial > 0) workaround = 'partial';
  else if (votes.yes > 0) workaround = 'yes';

  return {
    workaround,
    label: workaroundLabel(workaround),
    votes,
    // Only keep the evidence that supports the conclusion.
    evidence: evidence.filter((e) => e.value === workaround)
  };
}
