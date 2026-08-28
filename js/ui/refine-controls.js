/**
 * Manual refinement panel.
 *
 * Only controls the analyst has actually touched are sent back as overrides,
 * so re-analysing a ticket never silently converts a *detected* value into a
 * *confirmed* one.
 */
const SELECT_KEYS = ['scope', 'workaround', 'deadline'];
const LEVEL_KEYS = ['impact', 'urgency'];
const FACET_KEYS = ['contained', 'driver', 'harm'];

/**
 * @param {HTMLElement} root      the panel element
 * @param {Function}    onChange  called whenever the analyst changes anything
 */
export function initRefineControls(root, onChange) {
  const fields = {};
  for (const key of [...SELECT_KEYS, ...LEVEL_KEYS, ...FACET_KEYS]) {
    fields[key] = root.querySelector('#refine-' + key);
  }
  const riskInputs = Array.from(root.querySelectorAll('input[data-risk]'));
  const dirty = new Set();

  for (const [key, node] of Object.entries(fields)) {
    if (!node) continue;
    node.addEventListener('change', () => {
      dirty.add(key);
      onChange();
    });
  }
  for (const input of riskInputs) {
    input.addEventListener('change', () => {
      dirty.add('risk:' + input.dataset.risk);
      onChange();
    });
  }

  const api = {
    /** Overrides for analyse(). Untouched controls are omitted. */
    read() {
      const overrides = {};
      for (const key of SELECT_KEYS) {
        if (dirty.has(key) && fields[key]) overrides[key] = fields[key].value;
      }
      for (const key of LEVEL_KEYS) {
        if (fields[key] && fields[key].value !== 'auto') overrides[key] = fields[key].value;
      }
      for (const key of FACET_KEYS) {
        if (dirty.has(key) && fields[key] && fields[key].value !== 'auto') overrides[key] = fields[key].value;
      }
      const risks = {};
      for (const input of riskInputs) {
        if (dirty.has('risk:' + input.dataset.risk)) risks[input.dataset.risk] = input.checked;
      }
      if (Object.keys(risks).length) overrides.risks = risks;
      return overrides;
    },

    /** Show what the engine detected, and forget previous manual edits. */
    sync(result) {
      dirty.clear();
      if (!result || result.empty) {
        api.reset();
        return;
      }
      for (const key of SELECT_KEYS) {
        if (fields[key]) fields[key].value = result[key];
      }
      for (const key of LEVEL_KEYS) {
        if (fields[key]) fields[key].value = 'auto';
      }
      for (const key of FACET_KEYS) {
        if (fields[key]) fields[key].value = 'auto';
      }
      for (const input of riskInputs) {
        input.checked = Boolean(result.risks[input.dataset.risk]);
      }
    },

    /** Back to defaults. */
    reset() {
      dirty.clear();
      if (fields.scope) fields.scope.value = 'unknown';
      if (fields.workaround) fields.workaround.value = 'unknown';
      if (fields.deadline) fields.deadline.value = 'unknown';
      for (const key of [...LEVEL_KEYS, ...FACET_KEYS]) {
        if (fields[key]) fields[key].value = 'auto';
      }
      for (const input of riskInputs) input.checked = false;
    },

    /** True when the analyst has changed at least one control. */
    isRefined() {
      if (dirty.size > 0) return true;
      return LEVEL_KEYS.some((key) => fields[key] && fields[key].value !== 'auto');
    }
  };

  return api;
}
