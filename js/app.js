/**
 * Application wiring.
 *
 * The rules engine lives in js/engine/. This file only moves data between the
 * DOM and `analyse()`. There is no network code here or anywhere else: the
 * ticket text never leaves this page.
 */
import { analyse } from './engine/analyzer.js';
import { EXAMPLES, exampleGroups, exampleById } from './data/examples.js';
import { renderResult, statusSentence } from './ui/render-result.js';
import { renderMatrix, renderDefinitions } from './ui/render-matrix.js';
import { initRefineControls } from './ui/refine-controls.js';
import { deploymentProfile } from './deployment.js';
import { readTicketFromLocation, writeTicketToLocation, tooLongForShare } from './ui/share.js';
import { CLAIMED_URGENCY_PHRASES, BLOCKED_PHRASES } from './data/phrases.js';
import { has, createDocument } from './engine/negation.js';

/** @type {Record<string, any>} */
const dom = {
  input: document.getElementById('ticket-input'),
  analyseBtn: document.getElementById('analyse-btn'),
  shareBtn: document.getElementById('share-btn'),
  clearBtn: document.getElementById('clear-btn'),
  relevanceHint: document.getElementById('relevance-hint'),
  exampleSelect: document.getElementById('example-select'),
  exampleNote: document.getElementById('example-note'),
  exampleNoteWrap: document.querySelector('.example-note-wrap'),
  featured: document.getElementById('featured-examples'),
  themeSelect: document.getElementById('theme-select'),
  result: document.getElementById('result-region'),
  resultHeading: document.getElementById('result-heading'),
  status: document.getElementById('result-status'),
  refinePanel: document.getElementById('refine-panel'),
  refineReset: document.getElementById('refine-reset'),
  refineVerdict: document.getElementById('refine-verdict'),
  refineCount: document.getElementById('refine-count'),
  matrix: document.getElementById('matrix-table'),
  matrixExplain: document.getElementById('matrix-explain'),
  definitions: document.getElementById('priority-definitions'),
  privacyToggle: document.getElementById('privacy-toggle'),
  privacyDetail: document.getElementById('privacy-detail'),
  schoolCount: document.querySelectorAll('[data-school-count]'),
  deploymentProfile: document.querySelectorAll('[data-deployment-profile]')
};

const state = { text: '', result: null };

function announce(result) {
  dom.status.textContent = statusSentence(result);
}

/** Keep the refine summary in step with the current result. */
function syncRefineSummary() {
  const result = state.result;
  if (dom.refineVerdict) {
    const priority = result && !result.empty ? result.suggestedPriority || 'Unassessed' : '';
    dom.refineVerdict.textContent = priority;
    dom.refineVerdict.className =
      'refine-verdict ' +
      (result && result.suggestedPriority
        ? 'priority-' + result.suggestedPriority
        : 'priority-unassessed');
    dom.refineVerdict.hidden = !priority;
  }
  if (dom.refineCount) {
    const unknown = document.querySelectorAll('#eight .facet-row.facet--unknown').length;
    dom.refineCount.textContent = unknown
      ? unknown + (unknown === 1 ? ' unknown to confirm' : ' unknowns to confirm')
      : 'the key facts are present';
  }
}

function render(refined) {
  renderResult(dom.result, state.result, { refined });
  renderMatrix(dom.matrix, dom.matrixExplain, state.result);
  syncRefineSummary();
  announce(state.result);
}

/** Analyse the textarea from scratch and reset the refinement controls. */
function analyseFresh() {
  state.text = dom.input.value;
  state.result = analyse(state.text);
  refine.sync(state.result);
  render(false);
  if (!state.result.empty) {
    requestAnimationFrame(() => {
      if (dom.resultHeading) dom.resultHeading.focus({ preventScroll: true });
      dom.result.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
  }
}

/** Recalculate using the analyst's manual refinements. */
function reanalyse() {
  if (!state.text.trim()) return;
  state.result = analyse(state.text, refine.read());
  render(refine.isRefined());
}

const refine = initRefineControls(dom.refinePanel, reanalyse);

function clearAll() {
  dom.input.value = '';
  dom.exampleNote.textContent = '';
  if (dom.exampleNoteWrap) dom.exampleNoteWrap.hidden = true;
  if (dom.relevanceHint) dom.relevanceHint.hidden = true;
  state.text = '';
  state.result = null;
  refine.reset();
  writeTicketToLocation('');
  render(false);
  dom.input.focus();
}

/** The URL fragment is the only share channel; it carries the ticket text. */
function shareLink() {
  if (!dom.input.value.trim()) {
    flashShare('Paste a ticket first, then create a share link.');
    return;
  }
  if (tooLongForShare(dom.input.value)) {
    flashShare('Too long to share — links hold the first 2000 characters.');
    return;
  }
  writeTicketToLocation(dom.input.value);
  const url = window.location.href;
  const done = () => flashShare('Link copied — it contains the ticket text.');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(done);
  } else {
    done();
  }
}

let shareTimer = null;
function flashShare(message) {
  const hint = document.getElementById('share-hint');
  if (!hint) return;
  hint.textContent = message;
  clearTimeout(shareTimer);
  shareTimer = setTimeout(() => {
    hint.textContent =
      'The share link contains ticket text in the URL fragment — fragments are not sent to the server; do not use it for sensitive tickets.';
  }, 3000);
}

/** Inline nudge: urgency/blocked wording without a support signal. */
let nudgeTimer = null;
function updateRelevanceHint() {
  clearTimeout(nudgeTimer);
  nudgeTimer = setTimeout(() => {
    const text = dom.input.value;
    if (!dom.relevanceHint) return;
    if (!text.trim() || text.trim().length < 12) {
      dom.relevanceHint.hidden = true;
      return;
    }
    const doc = createDocument(text);
    const loud = has(doc, CLAIMED_URGENCY_PHRASES) || has(doc, BLOCKED_PHRASES);
    const result = analyse(text);
    if (loud && !result.inScope) {
      dom.relevanceHint.textContent =
        'This reads as urgent or blocked, but no IT system, symptom or technical ' +
        'domain was recognised yet. Add the affected system or what happens ' +
        '(e.g. "Canvas", "cannot log in") so it can be assessed — scope and urgency ' +
        'words alone do not establish an incident.';
      dom.relevanceHint.hidden = false;
    } else {
      dom.relevanceHint.hidden = true;
    }
  }, 400);
}

function loadExampleById(id) {
  const example = exampleById(id);
  if (!example) return;
  dom.input.value = example.text;
  dom.exampleNote.textContent = example.note;
  if (dom.exampleNoteWrap) dom.exampleNoteWrap.hidden = false;
  dom.input.focus();
}

/** One example per priority band, so a first impression covers the range. */
function featuredExamples() {
  const out = [];
  for (const wanted of ['P1', 'P2', 'P3', 'P4']) {
    const found = EXAMPLES.find((example) => example.expected.includes(wanted));
    if (found) out.push(found);
  }
  return out;
}

function populateFeatured() {
  if (!dom.featured) return;
  for (const example of featuredExamples()) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-quiet featured-example';
    button.textContent = example.title;
    button.addEventListener('click', () => loadExampleById(example.id));
    dom.featured.appendChild(button);
  }
}

function populateExamples() {
  for (const group of exampleGroups()) {
    const optgroup = document.createElement('optgroup');
    optgroup.label = group.name;
    for (const example of group.items) {
      const option = document.createElement('option');
      option.value = example.id;
      option.textContent = example.title;
      optgroup.appendChild(option);
    }
    dom.exampleSelect.appendChild(optgroup);
  }
}

function togglePrivacy() {
  const expanded = dom.privacyToggle.getAttribute('aria-expanded') === 'true';
  dom.privacyToggle.setAttribute('aria-expanded', String(!expanded));
  dom.privacyDetail.hidden = expanded;
}

function applyTheme(value) {
  if (value === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', value);
  try {
    localStorage.setItem('theme', value);
  } catch {}
}

function initTheme() {
  if (!dom.themeSelect) return;
  let saved = 'auto';
  try {
    saved = localStorage.getItem('theme') || 'auto';
  } catch {}
  if (!['auto', 'light', 'dark'].includes(saved)) saved = 'auto';
  dom.themeSelect.value = saved;
  applyTheme(saved);
  dom.themeSelect.addEventListener('change', () => applyTheme(dom.themeSelect.value));
}

function init() {
  for (const node of dom.schoolCount) {
    node.textContent = String(deploymentProfile.schoolCount);
  }
  for (const node of dom.deploymentProfile) {
    node.textContent = deploymentProfile.profileName;
  }
  initTheme();
  populateExamples();
  populateFeatured();
  renderDefinitions(dom.definitions);
  refine.reset();
  render(false);

  // A shared link (#t=…) restores the ticket and analyses it immediately.
  // Legacy ?t= links are accepted by share.js and cleaned from the address bar.
  const shared = readTicketFromLocation(window.location);
  if (shared) {
    dom.input.value = shared;
    state.text = shared;
    state.result = analyse(shared);
    refine.sync(state.result);
    render(false);
  }

  dom.analyseBtn.addEventListener('click', analyseFresh);
  dom.shareBtn.addEventListener('click', shareLink);
  dom.clearBtn.addEventListener('click', clearAll);
  dom.input.addEventListener('input', updateRelevanceHint);
  dom.exampleSelect.addEventListener('change', () => loadExampleById(dom.exampleSelect.value));
  dom.refineReset.addEventListener('click', () => {
    refine.sync(analyse(state.text));
    reanalyse();
  });
  dom.privacyToggle.addEventListener('click', togglePrivacy);

  dom.input.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      analyseFresh();
    }
  });
}

init();
