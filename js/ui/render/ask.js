/**
 * "Ask the requester" — the single, prominent place to see and copy the
 * unknowns that could change the priority — and the sticky jump-to index.
 *
 * The ranked follow-up questions and the Safe Next Action clarifications are
 * merged here so the same question is never shown twice.
 */
import { el } from '../dom.js';
import { copyButton } from '../clipboard.js';

function askQuestions(result) {
  const list = [];
  const push = (q) => {
    const text = String(q || '').trim();
    if (text && !list.includes(text)) list.push(text);
  };
  const metaBy = new Map((result.followUpQuestionMeta || []).map((m) => [m.text, m.kind]));
  for (const q of result.followUpQuestions || []) push(q);
  for (const q of result.nextAction?.clarificationQuestions || []) push(q);
  return list.map((text) => ({ text, kind: metaBy.get(text) || 'confidence' }));
}

function kindLabel(kind) {
  return kind === 'diagnostic'
    ? 'changes what to do next'
    : kind === 'priority'
      ? 'would change priority'
      : 'raises confidence';
}

export function askSection(result) {
  const questions = askQuestions(result);
  if (!questions.length) return null;
  const asText = questions.map((q, i) => i + 1 + '. ' + q.text).join('\n');
  return el('section', { class: 'panel panel-ask', id: 'ask' }, [
    el('h3', {}, 'Ask the requester'),
    el(
      'p',
      { class: 'hint muted' },
      'The unknowns that could change this priority. Send them as they are, or answer ' +
        'them in Refine assessment below.'
    ),
    el(
      'ol',
      { class: 'ask-list' },
      questions.map((q) =>
        el('li', {}, [el('span', { class: 'q-tag q-tag--' + q.kind }, kindLabel(q.kind)), q.text])
      )
    ),
    el('div', { class: 'actions' }, [
      copyButton(asText, 'Copy all questions', {
        announce: 'Questions',
        ariaLabel: 'Copy all follow-up questions'
      })
    ])
  ]);
}

/** A sticky, keyboard-friendly index of the result panels. */
export function jumpNav(result) {
  const links = [
    ['verdict', 'Verdict'],
    ...(askQuestions(result).length ? [['ask', 'Ask the requester']] : []),
    ['next-action', 'Next action'],
    ['eight', '8 Questions'],
    ['why', 'Why this priority'],
    ['handoff', 'Handoff'],
    ['reply', 'Reply'],
    ['details', 'Details']
  ];
  return el(
    'nav',
    { class: 'jump-nav', 'aria-label': 'Jump to result section' },
    links.map(([id, label]) => el('a', { href: '#' + id }, label))
  );
}
