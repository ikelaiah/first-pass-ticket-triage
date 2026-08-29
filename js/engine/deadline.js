/**
 * Deadline detection.
 *
 * A bare time word is weaker evidence than a stated commitment. "hasn't
 * appeared this morning" is a timestamp; "must be processed this afternoon"
 * is a deadline. The difference is tracked as `committed`.
 */
import { createDocument, scanPositive } from './negation.js';
import {
  DEADLINE_BUCKETS,
  DEADLINE_PHRASES,
  COMMITMENT_MARKERS,
  NOT_NEEDED_PATTERNS,
  NOT_NEEDED_UNTIL,
  OBSERVATION_VERBS
} from '../data/phrases.js';

const BY_ID = new Map(DEADLINE_BUCKETS.map((b) => [b.id, b]));

export function deadlineDefinition(id) {
  return BY_ID.get(id) || BY_ID.get('unknown');
}

export function deadlineLabel(id) {
  return deadlineDefinition(id).label;
}

/** Time words that express feeling rather than a business commitment. */
const ASSERTED_TIME_WORDS = [
  'now', 'right now', 'immediately', 'straight away', 'this minute', 'any minute'
];

const COMMITMENT_RE = new RegExp(
  '\\b(?:' + COMMITMENT_MARKERS.map((w) => w.replace(/[-]/g, '[- ]')).join('|') + ')\\b'
);

const OBSERVATION_RE = new RegExp(
  '\\b(?:' + OBSERVATION_VERBS.join('|').replace(/ /g, '\\s+') + ')\\b'
);

/**
 * "he would have shown up on the roll this morning" describes what *would*
 * have happened, not what is required. A counterfactual carries no deadline.
 */
const COUNTERFACTUAL_RE = /\b(?:would have|could have|might have|would be|should have)\b/;
const QUESTION_ABOUT_RE = /\b(?:a |the )?(?:question|enquiry|inquiry)\s+about\b/;

/**
 * "Today we discover..." and "three schools logged this this morning" state
 * when something was *noticed*, not when anything is *needed*. A clause that
 * only observes or supposes, with no commitment marker, carries no deadline.
 */
function isObservationOnly(clauseText) {
  if (COMMITMENT_RE.test(clauseText)) return false;
  if (QUESTION_ABOUT_RE.test(clauseText)) return true;
  return OBSERVATION_RE.test(clauseText) || COUNTERFACTUAL_RE.test(clauseText);
}

/** Clause indices where the requester said it is NOT needed yet. */
function findNotNeededClauses(doc) {
  const indices = new Set();
  doc.clauses.forEach((clause, index) => {
    if (NOT_NEEDED_PATTERNS.some((re) => re.test(clause.text))) indices.add(index);
  });
  return indices;
}

/** Parse a fragment such as "next week" into a bucket id. */
function bucketOfFragment(fragment) {
  const mini = createDocument(fragment);
  const hits = scanPositive(mini, DEADLINE_PHRASES);
  let best = null;
  for (const hit of hits) {
    const def = deadlineDefinition(hit.entry.v);
    if (!best || def.rank > best.def.rank) best = { def, hit };
  }
  return best;
}

/**
 * @returns {{ deadline, label, committed, notNeededNow, evidence, candidates }}
 */
export function detectDeadline(doc) {
  const notNeeded = findNotNeededClauses(doc);
  const candidates = [];

  // "not needed until next week" - the tail carries the real deadline.
  const untilMatch = NOT_NEEDED_UNTIL.exec(doc.text);
  if (untilMatch) {
    const parsed = bucketOfFragment(untilMatch[1]);
    if (parsed) {
      candidates.push({
        bucket: parsed.def.id,
        rank: parsed.def.rank,
        committed: true,
        quote: untilMatch[0].trim(),
        meaning: 'explicitly not needed until ' + untilMatch[1].trim()
      });
    }
  }

  for (const hit of scanPositive(doc, DEADLINE_PHRASES)) {
    const def = deadlineDefinition(hit.entry.v);
    const clause = doc.clauses[hit.clauseIndex];
    const clauseText = clause ? clause.text : doc.text;
    const suppressed = def.id !== 'none' &&
      (notNeeded.has(hit.clauseIndex) || isObservationOnly(clauseText));
    if (suppressed) continue;
    candidates.push({
      bucket: def.id,
      rank: def.rank,
      committed: def.id === 'none' || COMMITMENT_RE.test(clause ? clause.text : doc.text),
      quote: hit.quote,
      meaning: hit.entry.label
    });
  }

  const committed = candidates.filter((c) => c.committed && c.bucket !== 'none');
  const bare = candidates.filter((c) => !c.committed && c.bucket !== 'none');
  const none = candidates.filter((c) => c.bucket === 'none');

  let chosen = null;
  const pickSoonest = (list) => list.reduce((a, b) => (!a || b.rank > a.rank ? b : a), null);

  if (committed.length) chosen = pickSoonest(committed);
  else if (bare.length) chosen = pickSoonest(bare);
  else if (none.length) chosen = none[0];
  else if (notNeeded.size) {
    chosen = {
      bucket: 'none',
      rank: 1,
      committed: true,
      quote: doc.clauses[[...notNeeded][0]].text.trim(),
      meaning: 'requester stated it is not needed yet'
    };
  }

  const deadline = chosen ? chosen.bucket : 'unknown';

  // "Please fix immediately" states a feeling, not a deadline. Flagging it lets
  // the urgency model discount it instead of treating it as a business cutoff.
  const asserted = Boolean(
    chosen && !chosen.committed && ASSERTED_TIME_WORDS.includes(chosen.quote)
  );

  return {
    deadline,
    asserted,
    label: deadlineLabel(deadline),
    committed: Boolean(chosen && chosen.committed),
    notNeededNow: notNeeded.size > 0,
    candidates,
    evidence: chosen
      ? [{ quote: chosen.quote, meaning: chosen.meaning, source: 'deadline' }]
      : []
  };
}
