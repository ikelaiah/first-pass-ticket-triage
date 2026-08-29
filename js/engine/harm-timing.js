/**
 * Harm timing — U8: is harm happening now (expired/active) vs waiting to happen (expiring/pending).
 * Generalises the existing expired vs expiring distinction beyond certificates.
 */
import { scanPositive, isCurrentStateNegated, isNegated } from './negation.js';
import { HARM_TIMING_PHRASES, ACTIVE_NOW_PHRASES } from '../data/phrases.js';

function matchesAny(doc, patterns) {
  for (const p of patterns) {
    if (typeof p === 'string') {
      const needle = p.toLowerCase();
      let start = doc.text.indexOf(needle);
      while (start >= 0) {
        const end = start + needle.length;
        if (!isNegated(doc, start, end) && !explicitlyNegated(doc, start)) {
          return { quote: doc.text.slice(start, end).trim() };
        }
        start = doc.text.indexOf(needle, start + 1);
      }
    } else {
      const re = new RegExp(p.source, p.flags.includes('g') ? p.flags : p.flags + 'g');
      let m;
      while ((m = re.exec(doc.text)) !== null) {
        if (!m[0]) { re.lastIndex += 1; continue; }
        if (!isNegated(doc, m.index, m.index + m[0].length) &&
            !explicitlyNegated(doc, m.index)) {
          return { quote: m[0].trim() };
        }
      }
    }
  }
  return null;
}

function explicitlyNegated(doc, start) {
  const clause = doc.clauses.find((candidate) => start >= candidate.start && start < candidate.end);
  const before = clause ? doc.text.slice(clause.start, start) : doc.text.slice(0, start);
  return isCurrentStateNegated(doc, start) ||
    /\b(?:no one|nobody|nothing|not|never)\b[^.;!?]{0,42}$/i.test(before);
}

export function detectHarmTiming(doc, symptom) {
  const symptomId = symptom?.symptom || symptom?.id;
  const isExpired = symptomId === 'expired-credential';
  const isExpiring = symptomId === 'expiring-soon';
  const isDataLoss = symptomId === 'data-loss';

  const historicalResolution = /\b(?:last|previous|earlier|yesterday)\b[\s\S]{0,60}\b(?:renewed|replaced|restored|fixed|valid|resolved)\b/i.test(doc.text);
  if (isExpired && historicalResolution) {
    return { timing: 'unknown', label: null, quote: null, source: null };
  }
  if (isExpired) return { timing: 'active', label: 'harm is happening now — already expired', quote: symptom.evidence[0]?.quote || 'expired', source: 'symptom' };
  if (isExpiring) return { timing: 'pending', label: 'harm is waiting — expiring soon', quote: symptom.evidence[0]?.quote || 'expiring', source: 'symptom' };
  if (isDataLoss && /\b(?:already(?:\s+been)?|has been|have been|was|were)\s+(?:deleted|wiped|lost|overwritten)\b/i.test(doc.text)) {
    return { timing: 'active', label: 'harm is happening now — data was lost', quote: symptom.evidence[0]?.quote || 'deleted', source: 'symptom' };
  }

  const activeHit = matchesAny(doc, HARM_TIMING_PHRASES.active);
  if (activeHit) return { timing: 'active', label: 'harm is happening now', quote: activeHit.quote, source: 'harm-phrase' };

  const pendingHit = matchesAny(doc, HARM_TIMING_PHRASES.pending);
  if (pendingHit) return { timing: 'pending', label: 'harm is waiting to happen', quote: pendingHit.quote, source: 'harm-phrase' };

  const nowHit = scanPositive(doc, ACTIVE_NOW_PHRASES)
    .filter((hit) => !explicitlyNegated(doc, hit.start));
  if (nowHit.length) return { timing: 'active', label: 'issue is happening now', quote: nowHit[0].quote, source: 'active-now' };

  return { timing: 'unknown', label: null, quote: null, source: null };
}
