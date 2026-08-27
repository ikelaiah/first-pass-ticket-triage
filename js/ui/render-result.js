/**
 * Result card rendering.
 *
 * The explanation is the product, not a footnote: every card shows the
 * evidence, the two matrix inputs it produced, and the matrix step itself.
 */
import { el, replace, quote } from './dom.js';
import {
  priorityDefinition, MATRIX, IMPACT_ORDER, URGENCY_ORDER
} from '../engine/priority-matrix.js';
import { organisationConfig } from '../config.js';

/** Non-colour severity indicator: four blocks, filled by severity. */
function severityBlocks(priority) {
  const filled = { P1: 4, P2: 3, P3: 2, P4: 1 }[priority] || 1;
  const blocks = [];
  for (let i = 0; i < 4; i += 1) {
    blocks.push(el('span', {
      class: 'blocks-item' + (i < filled ? ' is-filled' : ''),
      'aria-hidden': 'true'
    }));
  }
  return el('span', { class: 'blocks', role: 'presentation' }, blocks);
}

/**
 * The matrix, small enough to sit beside the verdict. Showing where the ticket
 * landed is more useful than making someone scroll to the full table, and it
 * keeps the point visible: the priority came from two values, not a hunch.
 */
function miniMatrix(result) {
  const cells = [];
  for (const urgency of URGENCY_ORDER) {
    for (const impact of IMPACT_ORDER) {
      const priority = MATRIX[urgency][impact];
      const isCurrent = impact === result.impact && urgency === result.urgency;
      cells.push(el('span', {
        class: 'mini-cell priority-' + priority + (isCurrent ? ' is-current' : '')
      }, isCurrent ? priority : ''));
    }
  }
  return el('div', {
    class: 'mini-matrix',
    role: 'img',
    'aria-label': result.impactLabel + ' impact with ' + result.urgencyLabel.toLowerCase() +
      ' urgency gives ' + result.priority
  }, [
    el('span', { class: 'mini-grid', 'aria-hidden': 'true' }, cells),
    el('span', { class: 'mini-caption', 'aria-hidden': 'true' }, 'urgency ↓ / impact →')
  ]);
}

/** The three numbers that decided it. */
function heroLevels(result) {
  const items = [
    ['Impact', result.impactLabel, 'level-' + result.impact],
    ['Urgency', result.urgencyLabel, 'level-' + result.urgency],
    ['Confidence', result.confidence + '%', 'level-conf band-' + result.confidenceBand]
  ];
  return el('ul', { class: 'hero-levels' }, items.map(([key, value, cls]) =>
    el('li', { class: cls }, [
      el('span', { class: 'level-key' }, key),
      el('span', { class: 'level-value' }, value)
    ])
  ));
}

/** Classification detail, scannable rather than a ten-row table. */
function factChips(result) {
  const chips = [
    ['Scope', result.scopeLabel],
    ['System', result.system || 'Not identified'],
    ['Domain', result.technicalDomainLabel],
    ['Symptom', result.symptomLabel],
    ['Work type', result.workTypeLabel],
    ['Workaround', result.workaroundLabel],
    ['Deadline', result.deadlineLabel]
  ];
  return el('ul', { class: 'chips' }, chips.map(([key, value]) =>
    el('li', { class: 'chip' }, [
      el('span', { class: 'chip-key' }, key),
      el('span', { class: 'chip-value' }, value)
    ])
  ));
}

function evidenceList(result) {
  if (!result.evidenceDetail.length) {
    return el('p', { class: 'muted' }, 'No specific evidence phrases were recognised in this request.');
  }
  const seen = new Set();
  const items = [];
  for (const item of result.evidenceDetail) {
    const key = item.meaning + '|' + item.quote;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(el('li', {}, [
      el('span', { class: 'tick', 'aria-hidden': 'true' }, '✓'),
      quote(item.quote),
      el('span', { class: 'arrow', 'aria-hidden': 'true' }, ' → '),
      el('span', { class: 'meaning' }, item.meaning)
    ]));
  }
  return el('ul', { class: 'evidence' }, items.slice(0, 12));
}

function driverList(drivers) {
  if (!drivers.length) return el('p', { class: 'muted' }, 'No weighted signals.');
  return el('ul', { class: 'drivers' }, drivers.map((d) =>
    el('li', {}, [
      el('span', {
        class: 'weight ' + (d.value > 0 ? 'weight-up' : 'weight-down')
      }, (d.value > 0 ? '+' : '') + d.value),
      el('span', {}, d.label)
    ])
  ));
}

function chainSection(result) {
  const chain = result.chain;
  return el('div', { class: 'chain' }, [
    el('div', { class: 'chain-step' }, [
      el('h4', {}, 'Evidence'),
      evidenceList(result)
    ]),
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
          el('ul', {}, chain.modifiers.map((m) =>
            el('li', {}, [
              el('span', {
                class: 'pill pill-' + m.direction,
                'aria-hidden': 'true'
              }, m.direction === 'raise' ? '↑' : '↓'),
              el('span', {}, m.label)
            ])
          ))
        ])
      : null,
    el('div', { class: 'chain-arrow', 'aria-hidden': 'true' }, '↓'),
    el('div', { class: 'chain-step chain-result' }, [
      el('p', {}, [
        el('strong', {}, chain.impact.label.toUpperCase() + ' impact'),
        ' + ',
        el('strong', {}, chain.urgency.label.toUpperCase() + ' urgency'),
        ' → ',
        el('strong', { class: 'priority-inline priority-' + result.priority }, result.priority)
      ])
    ])
  ]);
}

function reasoningSection(result) {
  return el('ul', { class: 'reasoning' }, result.reasoning.map((line) => el('li', {}, line)));
}

function riskSection(result) {
  if (!result.riskFlags.length) {
    return el('p', { class: 'muted' }, 'No critical business risks were detected in this request.');
  }
  return el('ul', { class: 'risk-flags' }, result.riskFlags.map((flag) =>
    el('li', { class: 'risk-flag' }, [
      el('span', { class: 'risk-dot', 'aria-hidden': 'true' }),
      flag.label
    ])
  ));
}

function missingSection(result) {
  const nodes = [];
  if (result.missingInformationSummary) {
    nodes.push(el('p', {}, result.missingInformationSummary));
  }
  if (result.missingInformation.length) {
    nodes.push(el('h4', {}, 'Not stated in the request'));
    nodes.push(el('ul', { class: 'missing' },
      result.missingInformation.map((item) => el('li', {}, item))));
  }
  if (result.followUpQuestions.length) {
    nodes.push(el('h4', {}, 'Suggested follow-up questions'));
    nodes.push(el('ul', { class: 'questions' },
      result.followUpQuestions.map((q) => el('li', {}, q))));
  }
  if (!nodes.length) {
    nodes.push(el('p', { class: 'muted' },
      'The request contains the scope, timing and workaround information needed for triage.'));
  }
  return el('div', {}, nodes);
}

function confidenceSection(result) {
  const nodes = [
    el('p', { class: 'confidence-line' }, [
      el('strong', {}, result.confidenceLabel + ' confidence'),
      ' — ' + result.confidence + '%'
    ]),
    el('div', {
      class: 'meter',
      role: 'img',
      'aria-label': 'Confidence ' + result.confidence + ' percent'
    }, el('span', { class: 'meter-fill', style: 'width:' + result.confidence + '%' }))
  ];
  if (result.conflicts.length) {
    nodes.push(el('ul', { class: 'conflicts' },
      result.conflicts.map((c) => el('li', {}, c))));
  }
  if (result.dismissedRisks && result.dismissedRisks.length) {
    nodes.push(el('p', { class: 'muted' }, 'Ruled out by the wording: ' +
      result.dismissedRisks.map((d) => d.meaning).join('; ') + '.'));
  }
  return el('div', {}, nodes);
}

function panel(title, body, extraClass) {
  return el('section', { class: 'panel ' + (extraClass || '') }, [
    el('h3', {}, title),
    body
  ]);
}

/** Short sentence announced to assistive technology. */
export function statusSentence(result) {
  if (!result || result.empty) return 'No ticket text to analyse.';
  const def = priorityDefinition(result.priority);
  return 'Suggested priority ' + result.priority + ', ' + def.name + '. ' +
    result.impactLabel + ' impact, ' + result.urgencyLabel + ' urgency. ' +
    result.confidenceLabel + ' confidence. ' +
    (result.followUpQuestions.length
      ? result.followUpQuestions.length + ' follow-up questions suggested.'
      : '');
}

/**
 * Render the result card into `container`.
 * @param {HTMLElement} container
 * @param {object|null} result
 * @param {object} options { refined: boolean }
 */
export function renderResult(container, result, options = {}) {
  if (!result || result.empty) {
    replace(container, el('div', { class: 'card empty-state' }, [
      el('div', { class: 'empty-copy' }, [
        el('h2', {}, 'No analysis yet'),
        el('p', {}, 'Paste a ticket, email or work request above and select ' +
          '"Analyse Priority". Nothing you paste leaves this browser.'),
        el('ol', { class: 'empty-steps' }, [
          el('li', {}, 'Evidence is read from the wording — scope, deadline, workaround, symptom.'),
          el('li', {}, 'That evidence produces an Impact and an Urgency.'),
          el('li', {}, 'The matrix turns those two into P1–P4. Nothing else decides it.')
        ]),
        el('p', { class: 'muted' }, organisationConfig.disclaimer)
      ]),
      el('div', { class: 'empty-matrix' }, [
        el('div', { class: 'mini-grid mini-grid-legend', 'aria-hidden': 'true' },
          URGENCY_ORDER.flatMap((urgency) => IMPACT_ORDER.map((impact) =>
            el('span', { class: 'mini-cell is-legend priority-' + MATRIX[urgency][impact] },
              MATRIX[urgency][impact])
          ))),
        el('span', { class: 'mini-caption', 'aria-hidden': 'true' }, 'urgency ↓ / impact →')
      ])
    ]));
    return;
  }

  const def = priorityDefinition(result.priority);

  const banner = el('div', { class: 'banner priority-' + result.priority }, [
    el('div', { class: 'banner-main' }, [
      el('p', { class: 'banner-eyebrow' }, [
        'Suggested priority',
        el('span', { class: 'refined-tag' },
          options.refined ? 'manually refined' : 'automatic')
      ]),
      el('p', { class: 'banner-priority' }, [
        el('span', { class: 'banner-code' }, result.priority),
        el('span', { class: 'banner-sep', 'aria-hidden': 'true' }, ' — '),
        el('span', { class: 'banner-name' }, def.name)
      ]),
      el('p', { class: 'banner-headline' }, def.headline),
      heroLevels(result),
      severityBlocks(result.priority)
    ]),
    el('div', { class: 'banner-side' }, miniMatrix(result))
  ]);

  replace(container, el('div', { class: 'result' }, [
    banner,
    result.knownAnswer
      ? el('section', { class: 'known-answer' }, [
          el('h3', {}, 'This may already be answered'),
          el('p', { class: 'known-answer-text' }, result.knownAnswer.answer),
          el('p', { class: 'muted' },
            'From the configured "' + result.knownAnswer.job + '" schedule. ' +
            'Confirm it still matches the environment before replying.')
        ])
      : null,
    result.justification
      ? el('p', { class: 'justification-line' }, result.justification)
      : null,
    result.insufficientInformation
      ? el('section', { class: 'unassessed' }, [
          el('h3', {}, 'Not enough detail to assess'),
          el('p', {}, 'Almost nothing in this request could be recognised. Treat the ' +
            'suggestion below as unassessed rather than as low priority - a request ' +
            'this thin can still turn out to be serious.'),
          el('p', { class: 'muted' }, 'The questions below are the ones worth asking first.')
        ])
      : null,
    result.strippedChars > 200
      ? el('p', { class: 'stripped-note' },
          'Ignored about ' + result.strippedChars.toLocaleString() +
          ' characters of email signatures, disclaimers and image references.')
      : null,
    // The reasoning chain is the point of the tool, and it holds a two-column
    // split of its own, so it gets the full width rather than half of it.
    panel('Why ' + result.priority + '?', chainSection(result), 'panel-chain'),
    el('div', { class: 'result-grid' }, [
      el('div', { class: 'result-col' }, [
        panel('Classification', factChips(result), 'panel-facts'),
        panel('Confidence', confidenceSection(result)),
        panel('Risk flags', riskSection(result))
      ]),
      el('div', { class: 'result-col' }, [
        panel('Reasoning', reasoningSection(result)),
        panel('Missing information', missingSection(result), 'panel-missing')
      ])
    ]),
    el('p', { class: 'advisory' }, organisationConfig.disclaimer)
  ]));
}
