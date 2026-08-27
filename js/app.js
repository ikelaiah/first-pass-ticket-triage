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
import { organisationConfig } from './config.js';

const dom = {
  input: document.getElementById('ticket-input'),
  analyseBtn: document.getElementById('analyse-btn'),
  clearBtn: document.getElementById('clear-btn'),
  exampleBtn: document.getElementById('example-btn'),
  exampleSelect: document.getElementById('example-select'),
  exampleNote: document.getElementById('example-note'),
  result: document.getElementById('result-region'),
  status: document.getElementById('result-status'),
  refinePanel: document.getElementById('refine-panel'),
  refineReset: document.getElementById('refine-reset'),
  matrix: document.getElementById('matrix-table'),
  matrixExplain: document.getElementById('matrix-explain'),
  definitions: document.getElementById('priority-definitions'),
  privacyToggle: document.getElementById('privacy-toggle'),
  privacyDetail: document.getElementById('privacy-detail'),
  schoolCount: document.querySelectorAll('[data-school-count]')
};

const state = { text: '', result: null };

function announce(result) {
  dom.status.textContent = statusSentence(result);
}

function render(refined) {
  renderResult(dom.result, state.result, { refined });
  renderMatrix(dom.matrix, dom.matrixExplain, state.result);
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
  state.text = '';
  state.result = null;
  refine.reset();
  render(false);
  dom.input.focus();
}

function loadExample() {
  const example = exampleById(dom.exampleSelect.value) || EXAMPLES[0];
  dom.input.value = example.text;
  dom.exampleNote.textContent = example.note;
  analyseFresh();
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
  dom.exampleNote.textContent = EXAMPLES[0].note;
}

function togglePrivacy() {
  const expanded = dom.privacyToggle.getAttribute('aria-expanded') === 'true';
  dom.privacyToggle.setAttribute('aria-expanded', String(!expanded));
  dom.privacyDetail.hidden = expanded;
}

function init() {
  for (const node of dom.schoolCount) {
    node.textContent = String(organisationConfig.schoolCount);
  }
  populateExamples();
  renderDefinitions(dom.definitions);
  refine.reset();
  render(false);

  dom.analyseBtn.addEventListener('click', analyseFresh);
  dom.clearBtn.addEventListener('click', clearAll);
  dom.exampleBtn.addEventListener('click', loadExample);
  dom.exampleSelect.addEventListener('change', () => {
    const example = exampleById(dom.exampleSelect.value);
    if (example) dom.exampleNote.textContent = example.note;
  });
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
