/**
 * Result card rendering.
 *
 * This module composes the card from the focused render modules in ./render/.
 * The explanation is the product: every card shows the evidence, the two matrix
 * inputs it produced, and the matrix step itself.
 */
import { el, replace } from './dom.js';
import { copyButton } from './clipboard.js';
import {
  priorityDefinition,
  MATRIX,
  IMPACT_ORDER,
  URGENCY_ORDER
} from '../engine/priority-matrix.js';
import { deploymentProfile } from '../deployment.js';
import { panel } from './render/panel.js';
import { askSection, jumpNav } from './render/ask.js';
import { severityBlocks, miniMatrix, heroLevels, factChips, refinedLine } from './render/banner.js';
import {
  chainSection,
  reasoningSection,
  riskSection,
  confidenceSection,
  missingSection
} from './render/chain.js';
import { eightQuestionsPanel } from './render/eight-questions.js';
import { nextActionSection, handoffSection, replySection } from './render/projections.js';

/** Short sentence announced to assistive technology. */
export function statusSentence(result) {
  if (!result || result.empty) return 'No ticket text to analyse.';
  const actionable = result.assessmentStatus === 'assessed' && Boolean(result.suggestedPriority);
  if (!actionable) {
    return (
      'Assessment is unassessed; no actionable priority is suggested. Internal matrix result ' +
      result.priority +
      '. Assessment confidence: ' +
      result.confidenceLabel +
      '. Evidence completeness: ' +
      result.confidence +
      '% (heuristic).' +
      (result.followUpQuestions.length
        ? ' ' + result.followUpQuestions.length + ' follow-up questions suggested.'
        : '')
    );
  }
  const def = priorityDefinition(result.suggestedPriority);
  return (
    'Suggested priority ' +
    result.suggestedPriority +
    ', ' +
    def.name +
    '. ' +
    result.impactLabel +
    ' impact, ' +
    result.urgencyLabel +
    ' urgency. ' +
    'Assessment confidence: ' +
    result.confidenceLabel +
    '. Evidence completeness: ' +
    result.confidence +
    '% (heuristic). ' +
    (result.followUpQuestions.length
      ? result.followUpQuestions.length + ' follow-up questions suggested.'
      : '')
  );
}

/**
 * Render the result card into `container`.
 * @param {HTMLElement} container
 * @param {any} result
 * @param {any} options { refined: boolean }
 */
export function renderResult(container, result, options = {}) {
  if (!result || result.empty) {
    replace(
      container,
      el('div', { class: 'card empty-state' }, [
        el('div', { class: 'empty-copy' }, [
          el('h2', {}, 'How this works'),
          el(
            'p',
            {},
            'Paste a ticket, email or work request above and select "Analyse Priority". ' +
              'Nothing you paste leaves this browser.'
          ),
          el('ol', { class: 'empty-steps' }, [
            el(
              'li',
              {},
              'Evidence is read from the wording — scope, deadline, workaround, symptom.'
            ),
            el('li', {}, 'That evidence produces an Impact and an Urgency.'),
            el('li', {}, 'The matrix turns those two into P1–P4. Nothing else decides it.'),
            el('li', {}, 'Any unknown that could change the priority becomes a question to ask.')
          ]),
          el('p', {}, [
            el(
              'a',
              {
                href: 'https://github.com/ikelaiah/first-pass-ticket-triage/blob/main/PRIORITY-FRAMEWORK.md',
                target: '_blank',
                rel: 'noopener'
              },
              'Read the framework'
            ),
            ' · ',
            el(
              'a',
              {
                href: 'https://github.com/ikelaiah/first-pass-ticket-triage/blob/main/docs/user-guide.md',
                target: '_blank',
                rel: 'noopener'
              },
              'User guide'
            )
          ]),
          el('p', { class: 'muted' }, deploymentProfile.disclaimer)
        ]),
        el('div', { class: 'empty-matrix' }, [
          el(
            'div',
            { class: 'mini-grid mini-grid-legend', 'aria-hidden': 'true' },
            URGENCY_ORDER.flatMap((urgency) =>
              IMPACT_ORDER.map((impact) =>
                el(
                  'span',
                  { class: 'mini-cell is-legend priority-' + MATRIX[urgency][impact] },
                  MATRIX[urgency][impact]
                )
              )
            )
          ),
          el('span', { class: 'mini-caption', 'aria-hidden': 'true' }, 'urgency ↓ / impact →')
        ])
      ])
    );
    return;
  }

  const assessed = result.assessmentStatus === 'assessed' && Boolean(result.suggestedPriority);
  const displayPriority = assessed ? result.suggestedPriority : null;
  const def = displayPriority
    ? priorityDefinition(displayPriority)
    : { name: 'Unassessed', headline: 'More information needed before assigning a priority' };

  const banner = el(
    'div',
    {
      id: 'verdict',
      class: 'banner ' + (displayPriority ? 'priority-' + displayPriority : 'priority-unassessed')
    },
    [
      el('div', { class: 'banner-main' }, [
        el('p', { class: 'banner-eyebrow' }, [
          displayPriority ? 'Suggested priority' : 'Assessment status',
          el('span', { class: 'refined-tag' }, options.refined ? 'manually refined' : 'automatic')
        ]),
        displayPriority
          ? el('p', { class: 'banner-priority' }, [
              el('span', { class: 'banner-code' }, displayPriority),
              el('span', { class: 'banner-sep', 'aria-hidden': 'true' }, ' — '),
              el('span', { class: 'banner-name' }, def.name)
            ])
          : el('p', { class: 'banner-priority' }, [el('span', { class: 'banner-name' }, def.name)]),
        el('p', { class: 'banner-headline' }, def.headline),
        heroLevels(result),
        refinedLine(result),
        displayPriority ? severityBlocks(displayPriority) : null
      ]),
      el('div', { class: 'banner-side' }, miniMatrix(result))
    ]
  );

  replace(
    container,
    el('div', { class: 'result' }, [
      banner,
      jumpNav(result),
      askSection(result),
      nextActionSection(result),
      result.justification
        ? el('div', { class: 'justification-line' }, [
            el('span', { class: 'justification-text' }, result.justification),
            copyButton(result.justification, 'Copy', {
              class: 'justification-copy',
              ariaLabel: 'Copy justification',
              announce: 'Justification'
            })
          ])
        : null,
      result.insufficientInformation
        ? el('section', { class: 'unassessed' }, [
            el('h3', {}, 'Not enough detail to assess'),
            el(
              'p',
              {},
              'Almost nothing in this request could be recognised. No actionable ' +
                'priority is suggested yet - a request this thin can still turn out to be serious.'
            ),
            el('p', { class: 'muted' }, 'The questions above are the ones worth asking first.')
          ])
        : null,
      // The reasoning chain holds a two-column split of its own, so it gets the
      // full width rather than half of it.
      panel(
        displayPriority ? 'Why ' + displayPriority + '?' : 'How the matrix assessed this request',
        chainSection(result),
        'panel-chain',
        'why'
      ),
      panel('8 Questions — Impact vs Urgency', eightQuestionsPanel(result), 'panel-eight', 'eight'),
      panel('Triage Handoff', handoffSection(result), 'panel-handoff', 'handoff'),
      panel('Suggested reply (draft)', replySection(result), 'panel-reply', 'reply'),
      el('div', { class: 'result-grid', id: 'details' }, [
        el('div', { class: 'result-col' }, [
          panel('Classification', factChips(result), 'panel-facts'),
          panel('Assessment confidence', confidenceSection(result)),
          panel('Risk flags', riskSection(result))
        ]),
        el('div', { class: 'result-col' }, [
          panel('Reasoning', reasoningSection(result)),
          panel('Missing information', missingSection(result), 'panel-missing')
        ])
      ]),
      el('p', { class: 'advisory' }, deploymentProfile.disclaimer)
    ])
  );
}
