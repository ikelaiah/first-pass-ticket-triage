/**
 * Advisory projections: Safe Next Action, Triage Handoff and the suggested
 * reply. Each reads the existing analysis and never changes it.
 */
import { el } from '../dom.js';
import { copyButton } from '../clipboard.js';
import { buildReply } from '../reply.js';
import { buildHandoffText, buildHandoffMarkdown } from '../handoff.js';

const ACTION_NAMES = {
  clarify: 'Clarify',
  verify: 'Verify',
  investigate: 'Investigate',
  contain: 'Contain',
  escalate: 'Escalate',
  plan: 'Plan'
};
const ACTION_ICONS = {
  clarify: '❓',
  verify: '✓',
  investigate: '🔎',
  contain: '⛔',
  escalate: '↑',
  plan: '□'
};

export function nextActionSection(result) {
  const next = result.nextAction;
  if (!next) return null;
  const evidence = (next.evidenceUsed || [])
    .map((item) => item.quote || item.value || item.kind)
    .filter(Boolean);
  const nodes = [
    el('p', { class: 'next-action-name' }, [
      el('span', { 'aria-hidden': 'true' }, ACTION_ICONS[next.action] || '•'),
      ' ' + (ACTION_NAMES[next.action] || next.action)
    ]),
    el('p', {}, next.reason)
  ];
  if (evidence.length) {
    nodes.push(el('h4', {}, 'Evidence used'));
    nodes.push(
      el(
        'ul',
        { class: 'evidence' },
        evidence.map((item) =>
          el('li', {}, [el('span', { class: 'tick', 'aria-hidden': 'true' }, '✓'), item])
        )
      )
    );
  }
  if (next.blockers?.length) {
    nodes.push(el('h4', {}, 'Still unknown'));
    nodes.push(
      el(
        'ul',
        { class: 'missing' },
        next.blockers.map((item) => el('li', {}, item))
      )
    );
  }
  nodes.push(
    el('details', { class: 'next-action-diagnostic' }, [
      el('summary', {}, 'Diagnostic rule'),
      el('code', {}, next.ruleId)
    ])
  );
  return el('section', { class: 'panel panel-next-action', id: 'next-action' }, [
    el('h3', {}, 'Safe Next Action'),
    el('div', {}, nodes)
  ]);
}

function downloadMarkdown(markdown, filename) {
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Internal, onward-facing summary built from the existing analysis result. */
export function handoffSection(result) {
  const text = buildHandoffText(result);
  const markdown = buildHandoffMarkdown(result);
  const filename =
    'triage-handoff-' +
    (result.assessmentStatus === 'assessed' && result.suggestedPriority
      ? result.suggestedPriority
      : 'unassessed') +
    '.md';
  return el('div', {}, [
    el('pre', { class: 'handoff-box' }, text),
    el('div', { class: 'actions' }, [
      copyButton(text, 'Copy handoff'),
      copyButton(markdown, 'Copy Markdown'),
      el(
        'button',
        {
          class: 'btn btn-quiet',
          type: 'button',
          onClick: () => downloadMarkdown(markdown, filename)
        },
        'Download .md'
      )
    ]),
    el(
      'p',
      { class: 'hint muted' },
      'Internal, channel-neutral summary. Nothing is stored or transmitted.'
    )
  ]);
}

/** Polite, short, audience-neutral draft reply. */
export function replySection(result) {
  const reply = buildReply(result);
  return el('div', {}, [
    el('pre', { class: 'reply-box' }, reply),
    el('div', { class: 'actions' }, [copyButton(reply, 'Copy reply')]),
    el(
      'p',
      { class: 'hint muted' },
      'Requester-facing draft — refine before sending. Nothing is stored or transmitted.'
    )
  ]);
}
