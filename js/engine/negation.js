/**
 * Text normalisation, clause segmentation and negation-aware phrase matching.
 *
 * This module is the foundation of the engine. Every detector matches phrases
 * through `scan()` so that negation ("payroll is *not* affected") is handled
 * consistently rather than being re-implemented in each detector.
 *
 * Two negation forms are handled:
 *
 *   1. Backward  - a negation cue appears shortly BEFORE the phrase, with only
 *                  "linker" words in between:  "no evidence of a data breach".
 *   2. Forward   - a cancelling predicate appears shortly AFTER the phrase:
 *                  "payroll is not affected".
 *
 * Negation never crosses a clause boundary, which is why
 * "Canvas is slow but not unavailable" keeps "slow" and drops "unavailable".
 */

/** Words that negate a nearby phrase. */
const NEGATION_CUES = new Set([
  'no', 'not', 'never', 'without', 'none', 'lacking', 'lacks', 'lack', 'excluding'
]);

/**
 * Words permitted between a negation cue and the phrase it negates.
 * Anything else (especially a content verb) breaks the negation link, which is
 * what keeps "has not received today's ABA file" a genuine failure report.
 */
const NEGATION_LINKERS = new Set([
  'a', 'an', 'the', 'any', 'of', 'been', 'be', 'is', 'are', 'was', 'were',
  'currently', 'actually', 'really', 'yet', 'to', 'that', 'this', 'these',
  'those', 'our', 'their', 'its', 'his', 'her', 'my', 'your', 'other',
  'apparent', 'known', 'evidence', 'sign', 'signs', 'indication', 'indications',
  'report', 'reports', 'further', 'more', 'real', 'actual', 'in',
  'have', 'has', 'had', 'got', 'get'
]);

/** Cancels a preceding phrase: "<phrase> is not affected". */
const FORWARD_CANCEL = new RegExp(
  '^[^.;!?]{0,44}?\\b(?:' +
    'not (?:affected|impacted|involved|broken|down|failing|at risk|an issue|a problem|a concern|the issue|the problem|the cause)' +
    '|unaffected|unimpacted' +
    '|(?:is|are|was|were|seems|seem|looks|look) (?:fine|ok|okay|healthy|normal|unaffected)' +
    '|working (?:fine|normally|as expected|correctly)' +
  ')\\b'
);

/** Contractions expanded so dictionaries only need one spelling. */
const CONTRACTIONS = [
  [/\bcannot\b/g, 'can not'],
  [/\bcan[’']t\b/g, 'can not'],
  [/\bwon[’']t\b/g, 'will not'],
  [/\bshan[’']t\b/g, 'shall not'],
  [/\bdon[’']t\b/g, 'do not'],
  [/\bdoesn[’']t\b/g, 'does not'],
  [/\bdidn[’']t\b/g, 'did not'],
  [/\bisn[’']t\b/g, 'is not'],
  [/\baren[’']t\b/g, 'are not'],
  [/\bwasn[’']t\b/g, 'was not'],
  [/\bweren[’']t\b/g, 'were not'],
  [/\bhasn[’']t\b/g, 'has not'],
  [/\bhaven[’']t\b/g, 'have not'],
  [/\bhadn[’']t\b/g, 'had not'],
  [/\bcouldn[’']t\b/g, 'could not'],
  [/\bshouldn[’']t\b/g, 'should not'],
  [/\bwouldn[’']t\b/g, 'would not'],
  [/\bain[’']t\b/g, 'is not'],
  [/\bunable to\b/g, 'can not'],
  [/\bit[’']s\b/g, 'it is'],
  [/\bthat[’']s\b/g, 'that is'],
  [/\bwe[’']re\b/g, 'we are'],
  [/\bthey[’']re\b/g, 'they are'],
  [/\bi[’']m\b/g, 'i am'],
  [/\bwe[’']ve\b/g, 'we have'],
  [/\bthere[’']s\b/g, 'there is']
];

/** US -> AU/UK spelling for the handful of stems this domain actually uses. */
const SPELLING = [
  [/\b(synchroni|organi|prioriti|authori|recogni|categori|normali|minimi|maximi|utili|analy|apologi|summari|standardi)z/g, '$1s'],
  [/\benrollments\b/g, 'enrolments'],
  [/\benrollment\b/g, 'enrolment'],
  [/\blicense\b/g, 'licence']
];

/** Lowercase, de-smarten quotes, expand contractions, unify spelling. */
export function normalise(text) {
  let out = String(text == null ? '' : text)
    .toLowerCase()
    .replace(/[‘’‛]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/ /g, ' ');
  for (const [re, to] of CONTRACTIONS) out = out.replace(re, to);
  for (const [re, to] of SPELLING) out = out.replace(re, to);
  return out.replace(/[ \t]+/g, ' ').trim();
}

/**
 * Split into clauses. Negation and "commitment" context never cross these.
 * Coordinating contrasts ("but", "however") are boundaries; plain "and" is not.
 */
export function splitClauses(text) {
  const boundary = /[.;!?\n]+|\s+(?:but|however|although|though|whereas|otherwise)\s+/g;
  const clauses = [];
  let start = 0;
  let m;
  while ((m = boundary.exec(text)) !== null) {
    const end = m.index;
    if (end > start) clauses.push({ start, end, text: text.slice(start, end) });
    start = boundary.lastIndex;
  }
  if (start < text.length) clauses.push({ start, end: text.length, text: text.slice(start) });
  if (!clauses.length) clauses.push({ start: 0, end: text.length, text });
  return clauses;
}

/**
 * Email furniture: signature blocks, inline image references, link wrappers,
 * external-sender banners, disclaimers and attachment lists.
 *
 * Forwarded chains are a normal input here, and a six-line request can arrive
 * wrapped in six thousand words of footer. This removes the packaging without
 * touching the message - including quoted earlier messages, which routinely
 * carry the substance of the request.
 */
const EMAIL_FURNITURE = [
  /\[cid:[^\]]*\]/gi,                                  // inline image references
  /<mailto:[^>]*>/gi,                                  // duplicated mail links
  /<https?:\/\/[^>]*>/gi,                              // duplicated web links
  /https?:\/\/urldefense\.com\/\S+/gi,                 // link-rewriting wrappers
  /^\s*caution:.*$/gim,                                // external-sender banners
  /^\s*unless explicitly attributed.*$/gim,            // corporate disclaimer
  // Confidentiality footers only - matched on their stock phrasing, never on
  // the bare word "confidential", which is exactly what a privacy ticket says.
  /^.*if you are not the intended recipient.*$/gim,
  /^.*this (?:e-?mail|message) and any attachments.*$/gim,
  /^.*(?:e-?mail|message) is confidential and.*$/gim,
  /^.*please notify the sender.*$/gim,
  /^\s*image\d+\.(?:png|jpe?g|gif)\s*\([^)]*\)\s*$/gim, // attachment listings
  /^\s*-{3,}\s*original message\s*-{3,}\s*$/gim,
  /^\s*_{5,}\s*$/gm,                                   // separator rules
  /^\s*0\d{1,2}\s?\d{4}\s?\d{4}\s*$/gm,                // landline on its own line
  /^\s*04\d{2}\s?\d{3}\s?\d{3}\s*$/gm,                 // mobile on its own line
  /^\s*level\s+\d+,\s*\d+\s+\w+.*$/gim,                // "Level 3, 8 Woodville St"
  /^\s*[a-z' ]+\s+(?:nsw|vic|qld|wa|sa|tas|act|nt)\s+\d{4}\s*$/gim,
  /^\s*office address\s*$/gim,
  /^\s*www\.\S+\s*$/gim
];

/** Remove the packaging, keep the message. */
export function stripEmailFurniture(text) {
  let out = String(text == null ? '' : text);
  for (const pattern of EMAIL_FURNITURE) out = out.replace(pattern, ' ');
  return out;
}

/** Build the document object every detector receives. */
export function createDocument(rawText) {
  const raw = String(rawText == null ? '' : rawText);
  const stripped = stripEmailFurniture(raw);
  const text = normalise(stripped);
  const clauses = splitClauses(text);
  return {
    raw,
    text,
    clauses,
    // How much of the paste was packaging rather than request.
    strippedChars: Math.max(0, raw.replace(/\s+/g, ' ').length -
      stripped.replace(/\s+/g, ' ').length),
    wordCount: text ? text.split(/\s+/).filter(Boolean).length : 0
  };
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const compiledCache = new Map();

/** Compile a dictionary entry's matcher (string phrase or RegExp) once. */
function compile(pattern) {
  if (pattern instanceof RegExp) {
    const flags = pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g';
    return new RegExp(pattern.source, flags);
  }
  const key = String(pattern);
  if (!compiledCache.has(key)) {
    const norm = normalise(key);
    const pre = /^[a-z0-9]/.test(norm) ? '\\b' : '';
    const post = /[a-z0-9]$/.test(norm) ? '\\b' : '';
    compiledCache.set(key, pre + escapeRegExp(norm) + post);
  }
  return new RegExp(compiledCache.get(key), 'g');
}

function clauseAt(doc, index) {
  for (let i = 0; i < doc.clauses.length; i += 1) {
    const c = doc.clauses[i];
    if (index >= c.start && index < c.end) return { clause: c, clauseIndex: i };
  }
  const last = doc.clauses[doc.clauses.length - 1];
  return { clause: last, clauseIndex: doc.clauses.length - 1 };
}

function tokenise(str) {
  return str.split(/[^a-z0-9']+/).filter(Boolean);
}

/**
 * Decide whether a match spanning [start, end) is negated.
 * Exported so the test suite can assert negation behaviour directly.
 */
export function isNegated(doc, start, end) {
  const { clause } = clauseAt(doc, start);
  const before = doc.text.slice(clause.start, start);
  const after = doc.text.slice(end, clause.end);

  // Backward: cue, then up to four linker words, then the phrase.
  const tokens = tokenise(before);
  for (let back = 1; back <= 5 && back <= tokens.length; back += 1) {
    const token = tokens[tokens.length - back];
    const between = tokens.slice(tokens.length - back + 1);
    if (NEGATION_CUES.has(token)) {
      // "no longer working" asserts the failure, it does not negate it.
      if (token === 'no' && between[0] === 'longer') break;
      if (between.every((t) => NEGATION_LINKERS.has(t))) return true;
      break;
    }
    if (!NEGATION_LINKERS.has(token)) break;
  }

  // Forward: "<phrase> ... is not affected".
  return FORWARD_CANCEL.test(after);
}

/**
 * Match dictionary entries against the document.
 *
 * @param {object} doc      document from createDocument()
 * @param {Array}  entries  [{ m: string|RegExp|Array, ...payload }]
 * @param {object} options  { negate: false } for topical dictionaries (system
 *                          names, technical domains) where a nearby negation
 *                          does not change what the ticket is *about*.
 * @returns {Array} [{ entry, quote, match, start, end, negated, clauseIndex }]
 */
export function scan(doc, entries, options = {}) {
  const applyNegation = options.negate !== false;
  const longestMatch = options.longestMatch !== false;
  const hits = [];
  for (const entry of entries) {
    const patterns = Array.isArray(entry.m) ? entry.m : [entry.m];
    for (const pattern of patterns) {
      const re = compile(pattern);
      let m;
      while ((m = re.exec(doc.text)) !== null) {
        if (m[0] === '') { re.lastIndex += 1; continue; }
        const start = m.index;
        const end = start + m[0].length;
        const negated = applyNegation && entry.negate !== false && isNegated(doc, start, end);
        const { clauseIndex } = clauseAt(doc, start);
        hits.push({ entry, quote: m[0].trim(), match: m, start, end, negated, clauseIndex });
      }
    }
  }
  const ordered = hits.sort((a, b) => a.start - b.start);
  if (!longestMatch) return ordered;

  // Longest match wins: "no data breach" must not also register as "breach",
  // or the negated phrase would be cancelled out by the word inside it.
  return ordered.filter((hit) => !ordered.some((other) =>
    other !== hit &&
    other.start <= hit.start &&
    other.end >= hit.end &&
    (other.end - other.start) > (hit.end - hit.start)
  ));
}

/** Convenience: only the hits that were not negated. */
export function scanPositive(doc, entries, options) {
  return scan(doc, entries, options).filter((hit) => !hit.negated);
}

/** True when at least one entry matches without being negated. */
export function has(doc, entries, options) {
  return scanPositive(doc, entries, options).length > 0;
}

/** Index of the clause containing a character offset. */
export function clauseIndexOf(doc, index) {
  return clauseAt(doc, index).clauseIndex;
}
