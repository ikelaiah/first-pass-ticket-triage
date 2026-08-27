/**
 * The interactive priority matrix.
 *
 * The current cell is highlighted. Selecting a cell explains that cell - it
 * never overrides the analysis, because a matrix click is not evidence.
 */
import { el, replace } from './dom.js';
import {
  MATRIX, IMPACT_ORDER, URGENCY_ORDER, LEVEL_LABELS,
  priorityFor, priorityDefinition
} from '../engine/priority-matrix.js';

/**
 * @param {HTMLElement} container   table wrapper
 * @param {HTMLElement} explainer   region that receives the cell explanation
 * @param {object|null} result      current analysis, or null
 */
export function renderMatrix(container, explainer, result) {
  const activeImpact = result && !result.empty ? result.impact : null;
  const activeUrgency = result && !result.empty ? result.urgency : null;

  const head = el('thead', {}, el('tr', {}, [
    el('th', { scope: 'col' }, el('span', { class: 'sr-only' }, 'Urgency by impact')),
    ...IMPACT_ORDER.map((impact) =>
      el('th', { scope: 'col' }, LEVEL_LABELS[impact] + ' impact'))
  ]));

  const body = el('tbody', {}, URGENCY_ORDER.map((urgency) =>
    el('tr', {}, [
      el('th', { scope: 'row' }, LEVEL_LABELS[urgency] + ' urgency'),
      ...IMPACT_ORDER.map((impact) => {
        const priority = MATRIX[urgency][impact];
        const isCurrent = impact === activeImpact && urgency === activeUrgency;
        const cellButton = el('button', {
          type: 'button',
          class: 'matrix-cell priority-' + priority + (isCurrent ? ' is-current' : ''),
          'aria-label': priority + ': ' + LEVEL_LABELS[impact] + ' impact with ' +
            LEVEL_LABELS[urgency].toLowerCase() + ' urgency' +
            (isCurrent ? ', the current assessment' : '') + '. Explain this cell.',
          'aria-describedby': explainer.id,
          onclick: () => explainCell(explainer, impact, urgency, isCurrent)
        }, [
          el('span', { class: 'matrix-code' }, priority),
          isCurrent ? el('span', { class: 'matrix-current' }, 'Current') : null
        ]);
        return el('td', isCurrent ? { 'aria-current': 'true' } : {}, cellButton);
      })
    ])
  ));

  replace(container, el('table', { class: 'matrix' }, [
    el('caption', { class: 'sr-only' },
      'Priority matrix: impact across the columns, urgency down the rows'),
    head,
    body
  ]));

  if (activeImpact) {
    explainCell(explainer, activeImpact, activeUrgency, true);
  } else {
    replace(explainer, el('p', { class: 'muted' },
      'Analyse a ticket to see which cell applies. Selecting a cell explains it; ' +
      'it does not change the assessment.'));
  }
}

function explainCell(explainer, impact, urgency, isCurrent) {
  const priority = priorityFor(impact, urgency);
  const def = priorityDefinition(priority);
  replace(explainer, [
    el('p', {}, [
      el('strong', {}, LEVEL_LABELS[impact] + ' impact + ' + LEVEL_LABELS[urgency] + ' urgency'),
      ' → ',
      el('strong', { class: 'priority-inline priority-' + priority }, priority + ' ' + def.name),
      isCurrent ? el('span', { class: 'current-tag' }, 'current assessment') : null
    ]),
    el('p', {}, def.summary),
    el('ul', { class: 'cell-examples' }, def.examples.map((x) => el('li', {}, x)))
  ]);
}

/** Static P1-P4 definitions, rendered once. */
export function renderDefinitions(container) {
  replace(container, ['P1', 'P2', 'P3', 'P4'].map((id) => {
    const def = priorityDefinition(id);
    return el('div', { class: 'definition' }, [
      el('h4', {}, [
        el('span', { class: 'priority-inline priority-' + id }, id),
        ' ' + def.name + ' — ' + def.headline
      ]),
      el('p', {}, def.summary),
      el('ul', {}, def.characteristics.map((c) => el('li', {}, c)))
    ]);
  }));
}
