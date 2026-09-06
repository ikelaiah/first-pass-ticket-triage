import { analyse } from '../js/engine/analyzer.js';
import { buildHandoffMarkdown, buildHandoffText } from '../js/ui/handoff.js';

const ASSESSED_TEXT = 'A SQL trigger is writing wrong payment records across all schools; containment is unknown.';
const UNASSESSED_TEXT = 'All users, P1, fix now!!!';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function registerHandoffTests(test, ok) {
  test('Triage Handoff', 'is deterministic for an identical result', () => {
    const result = analyse(ASSESSED_TEXT);
    return ok(buildHandoffText(result) === buildHandoffText(result) &&
      buildHandoffMarkdown(result) === buildHandoffMarkdown(result), 'outputs are stable');
  });

  test('Triage Handoff', 'reports the existing priority, Impact, Urgency and action exactly', () => {
    const result = analyse(ASSESSED_TEXT);
    const handoff = buildHandoffText(result);
    return ok(handoff.includes('Priority: ' + result.suggestedPriority + ' — ' + result.priorityName) &&
      handoff.includes('Impact: ' + result.impactLabel + ' · Urgency: ' + result.urgencyLabel) &&
      handoff.includes('Safe Next Action: Clarify') &&
      handoff.includes(result.nextAction.reason), handoff);
  });

  test('Triage Handoff', 'does not mutate or reanalyse the existing result', () => {
    const result = analyse(ASSESSED_TEXT);
    const before = clone(result);
    buildHandoffText(result);
    buildHandoffMarkdown(result);
    return ok(JSON.stringify(result) === JSON.stringify(before), 'analysis result unchanged');
  });

  test('Triage Handoff', 'is a projection of supplied fields rather than ticket detection', () => {
    const result = {
      empty: false,
      assessmentStatus: 'assessed',
      suggestedPriority: 'P2',
      priorityName: 'High',
      impactLabel: 'High',
      urgencyLabel: 'Medium',
      nextAction: { action: 'investigate', reason: 'Begin diagnosis.', blockers: [], clarificationQuestions: [] },
      eightFacets: {},
      followUpQuestions: [],
      missingInformation: [],
      detail: {},
      system: 'A ticket-shaped <script>alert(1)</script> value'
    };
    const text = buildHandoffText(result);
    return ok(text.includes('Priority: P2 — High') && text.includes('A ticket-shaped') &&
      !text.includes('P1'), text);
  });

  test('Triage Handoff', 'does not export an actionable priority for unassessed input', () => {
    const result = analyse(UNASSESSED_TEXT);
    const handoff = buildHandoffText(result);
    return ok(handoff.includes('Assessment: Unassessed') &&
      !handoff.includes('Priority: P4') && !handoff.includes('Priority: P1') &&
      handoff.includes('No actionable priority has been assigned.'), handoff);
  });

  test('Triage Handoff', 'makes Clarify non-operational readiness explicit', () => {
    const result = analyse(ASSESSED_TEXT);
    return ok(result.nextAction.action === 'clarify' &&
      buildHandoffText(result).includes('No operational action recommended until these facts are confirmed.'),
    buildHandoffText(result));
  });

  test('Triage Handoff', 'keeps unknown and inferred facts from becoming known facts', () => {
    const result = analyse('Canvas synchronisation has stopped across all 19 schools and today’s classes are affected.');
    const handoff = buildHandoffText(result);
    return ok(handoff.includes('Known') && handoff.includes('Scope: All 19 Schools') &&
      !handoff.includes('Known\n• Required-by') && !handoff.includes('Known\n• Workaround:'), handoff);
  });

  test('Triage Handoff', 'marks analyst-confirmed values where relevant', () => {
    const result = analyse('Canvas is slow for teachers.', { scope: 'all-schools' });
    return ok(buildHandoffText(result).includes('Scope: All 19 Schools (analyst confirmed)'),
      buildHandoffText(result));
  });

  test('Triage Handoff', 'reuses the ranked follow-up questions and caps Ask at three', () => {
    const result = analyse(ASSESSED_TEXT);
    const handoff = buildHandoffText(result);
    const askStart = handoff.indexOf('\nAsk\n');
    const askEnd = askStart < 0 ? -1 : handoff.indexOf('\n\n', askStart + 5);
    const asks = (askStart >= 0 ? handoff.slice(askStart, askEnd < 0 ? undefined : askEnd) : '')
      .split('\n').filter((line) => line.startsWith('• '));
    const firstThree = result.followUpQuestions.slice(0, 3);
    return ok(firstThree.every((question) => handoff.includes(question)) && asks.length <= 3,
      asks.join(' | '));
  });

  test('Triage Handoff', 'escapes Markdown ticket-derived characters safely', () => {
    const result = analyse(ASSESSED_TEXT);
    result.system = '<script>alert("x")</script> *unsafe*';
    const markdown = buildHandoffMarkdown(result);
    return ok(markdown.includes('&lt;script&gt;') && !markdown.includes('<script>') &&
      markdown.includes('\\*unsafe\\*'), markdown);
  });

  test('Triage Handoff', 'collapses empty optional sections', () => {
    const result = {
      empty: false,
      assessmentStatus: 'assessed',
      suggestedPriority: 'P3',
      priorityName: 'Normal',
      impactLabel: 'Low',
      urgencyLabel: 'Low',
      nextAction: { action: 'plan', reason: 'Plan the non-immediate work.', blockers: [], clarificationQuestions: [] },
      eightFacets: {},
      followUpQuestions: [],
      missingInformation: [],
      detail: {}
    };
    const text = buildHandoffText(result);
    return ok(!text.includes('\nKnown\n') && !text.includes('\nUnknown\n') && !text.includes('\nAsk\n'), text);
  });

  test('Triage Handoff', 'Markdown and plain text share the same decision values', () => {
    const result = analyse(ASSESSED_TEXT);
    const markdown = buildHandoffMarkdown(result);
    return ok(markdown.includes('**' + result.suggestedPriority + ' — ' + result.priorityName + '**') &&
      markdown.includes('Impact: ' + result.impactLabel + ' · Urgency: ' + result.urgencyLabel) &&
      markdown.includes('Safe Next Action: Clarify'), markdown);
  });
}
