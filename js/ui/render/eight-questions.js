/**
 * The 8 Questions — Impact vs Urgency panel.
 *
 * Each of I1–I4 and U5–U8 is shown as Answered, Inferred or Unknown with the
 * quote that decided it. Unknowns that could flip the matrix cell carry a
 * "key driver" badge.
 */
import { el } from '../dom.js';
import { deploymentProfile } from '../../deployment.js';

export function eightQuestionsPanel(result) {
  if (!result.eightFacets) return null;
  const f = result.eightFacets;
  const badge = (state) => {
    const map = { answered: '✓ Answered', inferred: '○ Inferred', unknown: '? Unknown' };
    const cls =
      state === 'answered'
        ? 'facet-badge--ok'
        : state === 'inferred'
          ? 'facet-badge--mid'
          : 'facet-badge--unknown';
    return el('span', { class: 'facet-badge ' + cls }, map[state] || state);
  };
  const keySet = new Set(result.keyFacets || []);
  const row = (num, title, value, state, quote, hint) => {
    const key = keySet.has(num.toLowerCase());
    return el('li', { class: 'facet-row facet--' + state + (key ? ' facet--key' : '') }, [
      el('div', { class: 'facet-head' }, [
        el('span', { class: 'facet-num' }, num),
        el('span', { class: 'facet-title' }, title),
        key ? el('span', { class: 'facet-badge facet-badge--key' }, 'key driver') : null,
        badge(state)
      ]),
      el('div', { class: 'facet-value' }, value || '—'),
      quote ? el('div', { class: 'facet-quote' }, '"' + quote + '"') : null,
      hint ? el('div', { class: 'facet-hint muted' }, hint) : null
    ]);
  };

  const i1State = f.i1Scope.explicit ? 'answered' : 'unknown';
  const i2State = f.i2Blocked.blockedProcess
    ? f.i2Blocked.blockedProcess.inferred
      ? 'inferred'
      : 'answered'
    : f.i2Blocked.quote
      ? 'inferred'
      : 'unknown';
  const i3 = f.i3Irreversibility;
  const recoveryKnown = i3.recoverability?.value && i3.recoverability.value !== 'unknown';
  const hasIrrev =
    i3.risks.length > 0 || i3.modifiers.exposureActive || i3.modifiers.propagating || recoveryKnown;
  const i3State = hasIrrev ? 'answered' : 'unknown';
  const c = f.i4Containment.containment;
  const i4State =
    c.contained || c.propagating || c.recurring || c.undetected ? 'answered' : 'unknown';
  const u5State =
    f.u5Deadline.value !== 'unknown' && f.u5Deadline.value !== 'none'
      ? 'answered'
      : f.u5Deadline.value === 'none'
        ? 'inferred'
        : 'unknown';
  const u6State =
    f.u6Driver.driver.driver !== 'unknown' && f.u6Driver.driver.driver !== 'none'
      ? 'answered'
      : 'unknown';
  const u7State =
    f.u7Workaround.workaround !== 'unknown'
      ? f.u7Workaround.costPerDay
        ? 'answered'
        : 'inferred'
      : 'unknown';
  const u8State = f.u8HarmTiming.harmTiming.timing !== 'unknown' ? 'answered' : 'unknown';

  const impactList = el('ul', { class: 'facet-list' }, [
    row(
      'I1',
      'Who & how many?',
      f.i1Scope.answer,
      i1State,
      f.i1Scope.quote,
      i1State === 'unknown'
        ? 'Ask: one person / team / cohort / one school / several / all ' +
            deploymentProfile.schoolCount +
            '?'
        : null
    ),
    row(
      'I2',
      'What can they not do (blocked process)?',
      f.i2Blocked.answer,
      i2State,
      f.i2Blocked.quote,
      i2State === 'unknown'
        ? 'Not the symptom — the business process. "Canvas is slow" vs "cannot mark the roll".'
        : null
    ),
    row(
      'I3',
      'Wrong / exposed / lost / unsafe — and recoverable?',
      i3.answer,
      i3State,
      i3.recoverability?.quote || null,
      hasIrrev
        ? 'Data integrity, privacy, safety, loss, and whether the harm can be reversed or restored.'
        : 'No wrong/exposed/lost/unsafe flag — merely unavailable?'
    ),
    row(
      'I4',
      'Contained or spreading / recurring / unknown?',
      f.i4Containment.answer,
      i4State,
      f.i4Containment.containment.containedEvidence?.quote ||
        f.i4Containment.containment.propagatingEvidence?.quote ||
        null,
      c.summary.includes('no evidence')
        ? 'Recurring but corrected = high impact, low urgency (P2 latent).'
        : null
    )
  ]);
  const urgencyList = el('ul', { class: 'facet-list' }, [
    row(
      'U5',
      'When do you need this by?',
      f.u5Deadline.answer,
      u5State,
      f.u5Deadline.quote,
      u5State === 'unknown' ? 'The anchor — everything else calibrates it.' : null
    ),
    row(
      'U6',
      'What creates the deadline — requirement or preference?',
      f.u6Driver.answer + (f.u6Driver.driver.actor ? ' — ' + f.u6Driver.driver.actor : ''),
      u6State,
      f.u6Driver.driver.quote,
      u6State === 'unknown'
        ? 'Statutory (census/NAPLAN), operational (payroll cutoff/class starts), or preference ("would like by Friday")? What actually happens if missed?'
        : null
    ),
    row(
      'U7',
      'Can work continue — daily cost?',
      f.u7Workaround.answer,
      u7State,
      f.u7Workaround.costPerDay || null,
      u7State === 'inferred'
        ? 'Exists but sustainability/cost unknown — "three registrars all day" = slower failure.'
        : u7State === 'unknown'
          ? 'No workaround stated.'
          : null
    ),
    row(
      'U8',
      'Harm now or waiting? (expired vs expiring)',
      f.u8HarmTiming.answer,
      u8State,
      f.u8HarmTiming.harmTiming.quote,
      u8State === 'unknown'
        ? 'Expired/active exposure = attend now; expiring/pending = schedule properly.'
        : null
    )
  ]);
  return el('div', { class: 'eight-questions' }, [
    el('div', { class: 'eight-col' }, [el('h4', {}, 'Impact — how much / how badly'), impactList]),
    el('div', { class: 'eight-col' }, [
      el('h4', {}, 'Urgency — what happens if we wait'),
      urgencyList
    ])
  ]);
}
