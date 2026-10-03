/**
 * The "why this priority" chain and its supporting detail panels:
 * evidence → Impact/Urgency → matrix, plus confidence, risks and what is
 * missing. The explanation is the product, not a footnote.
 */
import { el, quote } from '../dom.js';

function evidenceList(result) {
  if (!result.evidenceDetail.length) {
    return el(
      'p',
      { class: 'muted' },
      'No specific evidence phrases were recognised in this request.'
    );
  }
  const seen = new Set();
  const items = [];
  for (const item of result.evidenceDetail) {
    const key = item.meaning + '|' + item.quote;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(
      el('li', {}, [
        el('span', { class: 'tick', 'aria-hidden': 'true' }, '✓'),
        quote(item.quote),
        el('span', { class: 'arrow', 'aria-hidden': 'true' }, ' → '),
        el('span', { class: 'meaning' }, item.meaning)
      ])
    );
  }
  return el('ul', { class: 'evidence' }, items.slice(0, 12));
}

function driverList(drivers) {
  if (!drivers.length) return el('p', { class: 'muted' }, 'No weighted signals.');
  return el(
    'ul',
    { class: 'drivers' },
    drivers.map((d) =>
      el('li', {}, [
        el(
          'span',
          { class: 'weight ' + (d.value > 0 ? 'weight-up' : 'weight-down') },
          (d.value > 0 ? '+' : '') + d.value
        ),
        el('span', {}, d.label)
      ])
    )
  );
}

export function chainSection(result) {
  const chain = result.chain;
  const actionable = result.assessmentStatus === 'assessed' && Boolean(result.suggestedPriority);
  const matrixResult = actionable
    ? result.priority
    : 'Internal matrix result ' + result.priority + ' (not actionable)';
  return el('div', { class: 'chain' }, [
    el('div', { class: 'chain-step' }, [el('h4', {}, 'Evidence'), evidenceList(result)]),
    el('div', { class: 'chain-arrow', 'aria-hidden': 'true' }, '↓'),
    el('div', { class: 'chain-step chain-split' }, [
      el('div', {}, [
        el('h4', {}, 'Impact: ' + chain.impact.label.toUpperCase()),
        driverList(chain.impact.drivers)
      ]),
      el('div', {}, [
        el('h4', {}, 'Urgency: ' + chain.urgency.label.toUpperCase()),
        driverList(chain.urgency.drivers)
      ])
    ]),
    chain.modifiers.length
      ? el('div', { class: 'chain-step chain-modifiers' }, [
          el('h4', {}, 'Critical risk modifiers applied before the matrix'),
          el(
            'ul',
            {},
            chain.modifiers.map((m) =>
              el('li', {}, [
                el(
                  'span',
                  { class: 'pill pill-' + m.direction, 'aria-hidden': 'true' },
                  m.direction === 'raise' ? '↑' : '↓'
                ),
                el('span', {}, m.label)
              ])
            )
          )
        ])
      : null,
    el('div', { class: 'chain-arrow', 'aria-hidden': 'true' }, '↓'),
    el('div', { class: 'chain-step chain-result' }, [
      el('p', {}, [
        el('strong', {}, chain.impact.label.toUpperCase() + ' impact'),
        ' + ',
        el('strong', {}, chain.urgency.label.toUpperCase() + ' urgency'),
        ' → ',
        el(
          'strong',
          {
            class:
              'priority-inline ' +
              (actionable ? 'priority-' + result.priority : 'priority-unassessed')
          },
          matrixResult
        )
      ])
    ])
  ]);
}

export function reasoningSection(result) {
  return el(
    'ul',
    { class: 'reasoning' },
    result.reasoning.map((line) => el('li', {}, line))
  );
}

export function riskSection(result) {
  if (!result.riskFlags.length) {
    return el('p', { class: 'muted' }, 'No critical business risks were detected in this request.');
  }
  return el(
    'ul',
    { class: 'risk-flags' },
    result.riskFlags.map((flag) =>
      el('li', { class: 'risk-flag' }, [
        el('span', { class: 'risk-dot', 'aria-hidden': 'true' }),
        flag.label
      ])
    )
  );
}

export function confidenceSection(result) {
  const nodes = [
    el('p', { class: 'confidence-line' }, [
      el('strong', {}, 'Assessment confidence: ' + result.confidenceLabel)
    ]),
    el('p', { class: 'muted' }, [
      'Evidence completeness: ' +
        result.confidence +
        '% — a heuristic for how much decision-relevant information the ticket contained, not a probability.'
    ]),
    el(
      'div',
      {
        class: 'meter',
        role: 'img',
        'aria-label':
          'Evidence completeness ' +
          result.confidence +
          ' percent; heuristic score, not a probability'
      },
      el('span', { class: 'meter-fill', style: 'width:' + result.confidence + '%' })
    )
  ];
  if (result.conflicts.length) {
    nodes.push(
      el(
        'ul',
        { class: 'conflicts' },
        result.conflicts.map((c) => el('li', {}, c))
      )
    );
  }
  if (result.dismissedRisks && result.dismissedRisks.length) {
    nodes.push(
      el(
        'p',
        { class: 'muted' },
        'Ruled out by the wording: ' + result.dismissedRisks.map((d) => d.meaning).join('; ') + '.'
      )
    );
  }
  return el('div', {}, nodes);
}

export function missingSection(result) {
  const nodes = [];
  if (result.missingInformationSummary) {
    nodes.push(el('p', {}, result.missingInformationSummary));
  }
  if (result.missingInformation.length) {
    nodes.push(el('h4', {}, 'Not stated in the request'));
    nodes.push(
      el(
        'ul',
        { class: 'missing' },
        result.missingInformation.map((item) => el('li', {}, item))
      )
    );
  }
  if (!nodes.length) {
    nodes.push(
      el(
        'p',
        { class: 'muted' },
        'The request contains the scope, timing and workaround information needed for triage.'
      )
    );
  }
  return el('div', {}, nodes);
}
