/**
 * Decide which parts of a pasted message describe the current work.
 *
 * Phrase detectors should not have to understand email chronology or whether a
 * scenario is an exercise. This preprocessor keeps strong, explicit inactive
 * contexts out of automatic scoring and records what it ignored.
 */
import { createDocument } from './negation.js';

const QUOTED_HISTORY_RE =
  /\bprevious message\s*:|^\s*-{2,}\s*original message\s*-{2,}\s*$|^\s*on .{1,100} wrote:\s*$/im;

const RESOLVED_RE =
  /(?:^resolved\b|\b(?:is|was|has been|now) (?:fixed|resolved|restored|recovered)\b|\b(?:working again|back online|no action required|access (?:has|had|was) been removed|issue (?:is|was) contained)\b)/g;

const REOPENED_RE =
  /\b(?:not (?:fixed|resolved|restored)|still (?:down|failing|failed|broken|blocked|unavailable)|(?:down|failed|failing|broken|blocked|unavailable) again|remains? (?:down|broken|blocked|unavailable)|continues? to fail)\b/g;

const PLANNED_TEST_RE =
  /\b(?:test case|simulate|simulation|disaster recovery exercise|dr exercise|tabletop exercise|acceptance test|the design must|design requirement|example scenario|hypothetical)\b/;

const PRODUCTION_FAILURE_RE =
  /(?:\b(?:fails?|failed|failing|down|broken|blocked|unavailable|stopped)\b[^.!?]{0,40}\bin production\b|\bin production\b[^.!?]{0,40}\b(?:fails?|failed|failing|down|broken|blocked|unavailable|stopped)\b)/;

function lastMatchIndex(text, pattern) {
  const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
  let last = -1;
  let match;
  while ((match = re.exec(text)) !== null) {
    last = match.index;
    if (!match[0]) re.lastIndex += 1;
  }
  return last;
}

function lastResolutionIndex(doc) {
  const re = new RegExp(RESOLVED_RE.source, RESOLVED_RE.flags);
  let last = -1;
  let match;
  while ((match = re.exec(doc.text)) !== null) {
    const clause = doc.clauses.find((candidate) =>
      match.index >= candidate.start && match.index < candidate.end);
    const prefix = clause ? doc.text.slice(clause.start, match.index) : '';
    const conditional = /\b(?:unless|if|until|before|need|needs|needed|required|must|should|can not|cannot)\b/.test(prefix);
    if (!conditional) last = match.index;
    if (!match[0]) re.lastIndex += 1;
  }
  return last;
}

function currentMessage(rawText) {
  const raw = String(rawText == null ? '' : rawText);
  const boundary = QUOTED_HISTORY_RE.exec(raw);
  if (!boundary || boundary.index === 0) return { text: raw, ignored: [] };

  const history = raw.slice(boundary.index).trim();
  return {
    text: raw.slice(0, boundary.index).trim(),
    ignored: history
      ? [{
          kind: 'quoted-history',
          quote: history.slice(0, 160),
          meaning: 'Quoted earlier messages were retained as context but excluded from scoring'
        }]
      : []
  };
}

function fromResolutionClause(doc, resolutionIndex) {
  const clause = doc.clauses.find((candidate) =>
    resolutionIndex >= candidate.start && resolutionIndex < candidate.end);
  if (!clause) return doc.text;
  return doc.text.slice(clause.start).trim();
}

export function prepareDecisionContext(rawText) {
  const current = currentMessage(rawText);
  const doc = createDocument(current.text);
  const resolvedAt = lastResolutionIndex(doc);
  const reopenedAt = lastMatchIndex(doc.text, REOPENED_RE);
  const resolved = resolvedAt >= 0 && reopenedAt < resolvedAt;
  const plannedTest = PLANNED_TEST_RE.test(doc.text) && !PRODUCTION_FAILURE_RE.test(doc.text);

  if (plannedTest) {
    return {
      status: 'planned-test',
      decisionText: current.text,
      ignored: current.ignored,
      evidence: [{
        quote: doc.text.match(PLANNED_TEST_RE)?.[0] || 'test scenario',
        meaning: 'The failure wording describes a design, simulation, exercise, or test, not a live incident',
        source: 'decision-context'
      }]
    };
  }

  if (resolved) {
    const decisionText = fromResolutionClause(doc, resolvedAt);
    const historical = doc.text.slice(0, Math.max(0, doc.text.indexOf(decisionText))).trim();
    const ignored = current.ignored.slice();
    if (historical) {
      ignored.unshift({
        kind: 'superseded-history',
        quote: historical.slice(0, 160),
        meaning: 'Earlier incident state was superseded by a later resolution update'
      });
    }
    return {
      status: 'resolved',
      decisionText,
      ignored,
      evidence: [{
        quote: doc.text.slice(resolvedAt).match(RESOLVED_RE)?.[0] || 'resolved',
        meaning: 'The latest explicit status says the incident is resolved or contained',
        source: 'decision-context'
      }]
    };
  }

  return {
    status: 'active-or-unspecified',
    decisionText: current.text,
    ignored: current.ignored,
    evidence: []
  };
}

export default prepareDecisionContext;
