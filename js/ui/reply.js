/**
 * Customer-facing reply draft.
 *
 * One polite, short, succinct template that works for any audience (teaching
 * staff, IT, finance, principal, registrar, vendor). It is explicitly a draft:
 * the analyst refines it before sending. No audience switcher — the wording
 * stays neutral and blame-free.
 */

const FOOTER =
  'Draft — refine before sending. Priority is advisory; local policy and agreed ' +
  'service levels prevail.';

export function buildReply(result) {
  if (!result || result.empty) return '';

  if (!result.inScope) {
    return [
      'Thanks for getting in touch.',
      '',
      'We could not yet identify the affected system or what is happening. ' +
        'Could you add which application, device or service is affected, and ' +
        'what you see when you try?',
      '',
      FOOTER
    ].join('\n');
  }

  const f = result.eightFacets;
  const understood = [];
  understood.push(
    f.i1Scope.explicit
      ? 'who is affected (' + f.i1Scope.answer.toLowerCase() + ')'
      : 'who is affected (not yet confirmed)'
  );
  if (f.u5Deadline.value !== 'unknown' && f.u5Deadline.value !== 'none') {
    understood.push('when it is needed (' + f.u5Deadline.answer.toLowerCase() + ')');
  }
  if (f.i2Blocked.blockedProcess) {
    understood.push('what is blocked (' + f.i2Blocked.blockedProcess.label + ')');
  }

  const priorityQs = (result.followUpQuestionMeta || [])
    .filter((m) => m.kind === 'priority')
    .slice(0, 2)
    .map((m) => m.text);

  const lines = [
    'Thanks for raising this — here is where it stands.',
    '',
    'What we understood so far: ' + understood.join('; ') + '.',
    'Suggested priority: ' + result.priority + ' (' + result.impactLabel +
      ' impact, ' + result.urgencyLabel + ' urgency).',
    priorityQs.length
      ? 'To confirm or change this, we still need: ' + priorityQs.join(' ')
      : 'The information provided is enough to proceed; no blocking questions remain.',
    '',
    FOOTER
  ];
  return lines.join('\n');
}

/** Markdown triage slip for handoff into tickets, docs or email. */
export function buildMarkdown(result) {
  if (!result || result.empty) return '';
  const f = result.eightFacets || {};
  const facet = (id, label) => {
    const item = f[id];
    if (!item) return '| ' + label + ' | — |';
    return '| ' + label + ' | ' + String(item.answer).replace(/\|/g, '\\|') + ' |';
  };
  const out = [];
  out.push('# Triage — ' + result.priority + ' (' + result.priorityName + ')');
  out.push('');
  out.push('- Impact: ' + result.impactLabel);
  out.push('- Urgency: ' + result.urgencyLabel);
  out.push('- Confidence: ' + result.confidence + '% (' + result.confidenceLabel + ')');
  if (result.justification) out.push('- Justification: ' + result.justification);
  out.push('');
  out.push('| Question | Answer |');
  out.push('| -------- | ------ |');
  out.push(facet('i1Scope', 'I1 Who & how many?'));
  out.push(facet('i2Blocked', 'I2 Blocked process'));
  out.push(facet('i3Irreversibility', 'I3 Wrong/exposed/lost/unsafe?'));
  out.push(facet('i4Containment', 'I4 Contained or spreading?'));
  out.push(facet('u5Deadline', 'U5 When needed?'));
  out.push(facet('u6Driver', 'U6 Requirement or preference?'));
  out.push(facet('u7Workaround', 'U7 Workaround & daily cost'));
  out.push(facet('u8HarmTiming', 'U8 Harm now or waiting?'));
  if (result.followUpQuestions.length) {
    out.push('');
    out.push('## Follow-up questions');
    for (const m of result.followUpQuestionMeta || []) {
      out.push('- [' + m.kind + '] ' + m.text);
    }
  }
  out.push('');
  out.push('_Advisory only; local policy and agreed service levels prevail._');
  return out.join('\n');
}
