/**
 * Harm timing — U8: is harm happening now (expired/active) vs waiting to happen (expiring/pending).
 * Generalises the existing expired vs expiring distinction beyond certificates.
 */
import { scanPositive } from './negation.js';
import { HARM_TIMING_PHRASES, ACTIVE_NOW_PHRASES } from '../data/phrases.js';

function matchesAny(doc, patterns) {
  for (const p of patterns) {
    if (typeof p === 'string') {
      if (doc.text.includes(p.toLowerCase())) return { quote: p };
    } else {
      const re = new RegExp(p.source, p.flags.includes('g') ? p.flags : p.flags + 'g');
      let m;
      while ((m = re.exec(doc.text)) !== null) {
        if (!m[0]) { re.lastIndex += 1; continue; }
        // harm timing phrases are not negated via isNegated — active wording
        // like "not currently exposed" is already handled by risks.js gating
        return { quote: m[0].trim() };
      }
    }
  }
  return null;
}

export function detectHarmTiming(doc, symptom) {
  const isExpired = symptom && symptom.id === 'expired-credential';
  const isExpiring = symptom && symptom.id === 'expiring-soon';

  if (isExpired) return { timing: 'active', label: 'harm is happening now — already expired', quote: symptom.evidence[0]?.quote || 'expired', source: 'symptom' };
  if (isExpiring) return { timing: 'pending', label: 'harm is waiting — expiring soon', quote: symptom.evidence[0]?.quote || 'expiring', source: 'symptom' };

  const activeHit = matchesAny(doc, HARM_TIMING_PHRASES.active);
  if (activeHit) return { timing: 'active', label: 'harm is happening now', quote: activeHit.quote, source: 'harm-phrase' };

  const pendingHit = matchesAny(doc, HARM_TIMING_PHRASES.pending);
  if (pendingHit) return { timing: 'pending', label: 'harm is waiting to happen', quote: pendingHit.quote, source: 'harm-phrase' };

  const nowHit = scanPositive(doc, ACTIVE_NOW_PHRASES);
  if (nowHit.length) return { timing: 'active', label: 'issue is happening now', quote: nowHit[0].quote, source: 'active-now' };

  return { timing: 'unknown', label: null, quote: null, source: null };
}
