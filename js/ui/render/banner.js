/**
 * The verdict banner and its supporting bits: the priority, the two matrix
 * inputs, the mini matrix and the classification chips.
 */
import { el } from '../dom.js';
import { MATRIX, IMPACT_ORDER, URGENCY_ORDER } from '../../engine/priority-matrix.js';

/** Non-colour severity indicator: four blocks, filled by severity. */
export function severityBlocks(priority) {
  const filled = { P1: 4, P2: 3, P3: 2, P4: 1 }[priority] || 1;
  const blocks = [];
  for (let i = 0; i < 4; i += 1) {
    blocks.push(
      el('span', {
        class: 'blocks-item' + (i < filled ? ' is-filled' : ''),
        'aria-hidden': 'true'
      })
    );
  }
  return el('span', { class: 'blocks', role: 'presentation' }, blocks);
}

/**
 * The matrix, small enough to sit beside the verdict. Showing where the ticket
 * landed keeps the point visible: the priority came from two values.
 */
export function miniMatrix(result) {
  const actionable = result.assessmentStatus === 'assessed' && Boolean(result.suggestedPriority);
  const cells = [];
  for (const urgency of URGENCY_ORDER) {
    for (const impact of IMPACT_ORDER) {
      const priority = MATRIX[urgency][impact];
      const isCurrent = impact === result.impact && urgency === result.urgency;
      cells.push(
        el(
          'span',
          { class: 'mini-cell priority-' + priority + (isCurrent ? ' is-current' : '') },
          isCurrent ? priority : ''
        )
      );
    }
  }
  return el(
    'div',
    {
      class: 'mini-matrix',
      role: 'img',
      'aria-label':
        result.impactLabel +
        ' impact with ' +
        result.urgencyLabel.toLowerCase() +
        ' urgency gives internal matrix result ' +
        result.priority +
        (actionable ? '' : '; no actionable priority')
    },
    [
      el('span', { class: 'mini-grid', 'aria-hidden': 'true' }, cells),
      el('span', { class: 'mini-caption', 'aria-hidden': 'true' }, 'urgency ↓ / impact →')
    ]
  );
}

/** The three numbers that decided it. */
export function heroLevels(result) {
  const items = [
    ['Impact', result.impactLabel, 'level-' + result.impact],
    ['Urgency', result.urgencyLabel, 'level-' + result.urgency],
    ['Assessment confidence', result.confidenceLabel, 'level-conf band-' + result.confidenceBand]
  ];
  return el(
    'ul',
    { class: 'hero-levels' },
    items.map(([key, value, cls]) =>
      el('li', { class: cls }, [
        el('span', { class: 'level-key' }, key),
        el('span', { class: 'level-value' }, value)
      ])
    )
  );
}

/** Classification detail, scannable rather than a ten-row table. */
export function factChips(result) {
  const chips = [
    ['Scope', result.scopeLabel],
    ['System', result.system || 'Not identified'],
    ['Symptom', result.symptomLabel],
    ['Work type', result.workTypeLabel],
    ['Workaround', result.workaroundLabel],
    [
      'Consequence',
      result.businessConsequence.label + ' (' + result.businessConsequence.source + ')'
    ],
    ['Deadline', result.deadlineLabel]
  ];
  return el(
    'ul',
    { class: 'chips' },
    chips.map(([key, value]) =>
      el('li', { class: 'chip' }, [
        el('span', { class: 'chip-key' }, key),
        el('span', { class: 'chip-value' }, value)
      ])
    )
  );
}

/** One line listing what the analyst overrode. */
export function refinedLine(result) {
  const applied = result.detail && result.detail.overridesApplied;
  if (!applied || !Object.keys(applied).length) return null;
  const names = {
    scope: 'Scope',
    workaround: 'Workaround',
    deadline: 'Deadline',
    consequence: 'Business consequence',
    contained: 'Containment',
    driver: 'Driver',
    harm: 'Harm timing',
    impact: 'Impact',
    urgency: 'Urgency'
  };
  const parts = [];
  for (const [key, value] of Object.entries(applied)) {
    if (key === 'risks') {
      const on = Object.entries(value)
        .filter(([, v]) => v)
        .map(([k]) => k);
      if (on.length) parts.push('Risks: ' + on.join(', '));
    } else {
      parts.push((names[key] || key) + ' = ' + value);
    }
  }
  if (!parts.length) return null;
  return el('p', { class: 'refined-line' }, 'Refined by analyst: ' + parts.join(' · '));
}
