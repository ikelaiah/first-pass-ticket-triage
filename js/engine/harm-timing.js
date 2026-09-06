/**
 * Harm timing — U8: is harm happening now (expired/active) vs waiting to happen (expiring/pending).
 * Generalises the existing expired vs expiring distinction beyond certificates.
 */
import { clauseIndexOf, scanPositive, isCurrentStateNegated, isNegated } from './negation.js';
import { createEvidenceLedger } from './evidence.js';
import { HARM_TIMING_PHRASES, ACTIVE_NOW_PHRASES } from '../data/phrases.js';

function matchesAny(doc, patterns) {
  for (const p of patterns) {
    if (typeof p === 'string') {
      const needle = p.toLowerCase();
      let start = doc.text.indexOf(needle);
      while (start >= 0) {
        const end = start + needle.length;
        if (!isNegated(doc, start, end) && !explicitlyNegated(doc, start)) {
          return { quote: doc.text.slice(start, end).trim(), start, end, clauseIndex: clauseIndexOf(doc, start) };
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
          return { quote: m[0].trim(), start: m.index, end: m.index + m[0].length, clauseIndex: clauseIndexOf(doc, m.index) };
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

function quoteHit(doc, quote) {
  const start = doc.text.indexOf(String(quote || '').toLowerCase());
  return start < 0 ? {} : { start, end: start + quote.length, clauseIndex: clauseIndexOf(doc, start) };
}

function addCandidate(extraction, details) {
  const fact = extraction.ledger.add({
    type: 'harm-timing', value: details.timing, quote: details.quote,
    start: details.start, end: details.end, clauseIndex: details.clauseIndex,
    authority: details.authority || 'explicit', temporal: details.temporal,
    role: details.role || 'primary'
  });
  extraction.candidates.push({ ...details, fact });
}

/** Capture each harm-timing signal before selecting the U8 answer. */
export function extractHarmTimingEvidence(doc, symptom, context = {}, ledger = createEvidenceLedger(doc)) {
  const extraction = { ledger, candidates: [] };
  const symptomId = symptom?.symptom || symptom?.id;
  const isExpired = symptomId === 'expired-credential';
  const isExpiring = symptomId === 'expiring-soon';
  const isDataLoss = symptomId === 'data-loss';

  const historicalResolution = /\b(?:last|previous|earlier|yesterday)\b[\s\S]{0,60}\b(?:renewed|replaced|restored|fixed|valid|resolved)\b/i.test(doc.text);
  if (isExpired && historicalResolution) {
    return extraction;
  }
  if (isExpired) {
    const quote = symptom.evidence[0]?.quote || 'expired';
    addCandidate(extraction, { timing: 'active', label: 'harm is happening now — already expired', quote, source: 'symptom', ...quoteHit(doc, quote) });
  }
  if (isExpiring) {
    const quote = symptom.evidence[0]?.quote || 'expiring';
    addCandidate(extraction, { timing: 'pending', label: 'harm is waiting — expiring soon', quote, source: 'symptom', ...quoteHit(doc, quote) });
  }
  if (isDataLoss && /\b(?:already(?:\s+been)?|has been|have been|was|were)\s+(?:deleted|wiped|lost|overwritten)\b/i.test(doc.text)) {
    const quote = symptom.evidence[0]?.quote || 'deleted';
    addCandidate(extraction, {
      timing: 'active', label: 'harm is happening now — data was lost', quote,
      source: 'symptom', temporal: 'current', ...quoteHit(doc, quote)
    });
  }

  const activeHit = matchesAny(doc, HARM_TIMING_PHRASES.active);
  if (activeHit) addCandidate(extraction, { timing: 'active', label: 'harm is happening now', source: 'harm-phrase', ...activeHit });

  const pendingHit = matchesAny(doc, HARM_TIMING_PHRASES.pending);
  if (pendingHit) addCandidate(extraction, { timing: 'pending', label: 'harm is waiting to happen', source: 'harm-phrase', ...pendingHit });

  const pendingChange = /\b(?:proposed|queued|planned)\b[\s\S]{0,120}\b(?:could|may|might|would)\b/i.test(doc.text) &&
    /\b(?:if\s+(?:the\s+)?approval|not\s+(?:live|enabled)|has not been enabled)\b/i.test(doc.text);
  if (pendingChange) {
    const start = doc.text.search(/\b(?:proposed|queued|planned)\b/i);
    addCandidate(extraction, {
      timing: 'pending', label: 'harm is waiting to happen', quote: 'proposed change pending approval',
      source: 'pending-change', temporal: 'hypothetical', start,
      end: start < 0 ? null : start + 'proposed'.length,
      clauseIndex: start < 0 ? null : clauseIndexOf(doc, start)
    });
  }

  const nowHit = scanPositive(doc, ACTIVE_NOW_PHRASES)
    .filter((hit) => !explicitlyNegated(doc, hit.start));
  for (const hit of nowHit) {
    addCandidate(extraction, { timing: 'active', label: 'issue is happening now', source: 'active-now', ...hit });
  }

  if (context.modifiers?.exposureActive) {
    const quote = context.blockedProcess?.quote || 'active exposure';
    addCandidate(extraction, { timing: 'active', label: 'harm is happening now — exposure is active', quote, source: 'risk-modifier', authority: 'inferred', temporal: 'current', ...quoteHit(doc, quote) });
  }
  if (context.blockedProcess?.level === 'blocked' &&
      (context.workaround === 'no' || context.workaround === 'partial')) {
    const quote = context.blockedProcess.quote;
    addCandidate(extraction, { timing: 'active', label: 'harm is happening now — work is currently affected', quote, source: 'business-consequence', authority: 'inferred', temporal: 'current', ...quoteHit(doc, quote) });
  }

  return extraction;
}

/** Project U8 in evidence-source order, excluding stale active-harm facts. */
export function projectHarmTiming(extraction) {
  const candidates = extraction.candidates.filter(({ fact, timing }) =>
    fact.polarity === 'positive' && fact.context === 'primary' && fact.role !== 'comparator' &&
    (timing === 'pending'
      ? !['historical', 'resolved'].includes(fact.temporal)
      : fact.temporal === 'current')
  );
  // Extraction preserves the legacy semantic order: a direct harm phrase or
  // symptom outranks a pending phrase, which in turn outranks generic
  // "currently" wording such as "currently valid" or "currently working".
  const chosen = candidates[0];
  if (chosen) return { timing: chosen.timing, label: chosen.label, quote: chosen.quote, source: chosen.source };
  return { timing: 'unknown', label: null, quote: null, source: null };
}

export function detectHarmTiming(doc, symptom, context = {}, ledger) {
  return projectHarmTiming(extractHarmTimingEvidence(doc, symptom, context, ledger));
}
