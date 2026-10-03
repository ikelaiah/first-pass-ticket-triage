/**
 * Clipboard helper.
 *
 * One implementation for every copy affordance, with consistent button
 * feedback and a single polite live region (`#copy-status`) so assistive
 * technology hears the result. Clipboard access is optional; if it is
 * unavailable, a hidden textarea and `execCommand` are used as a fallback.
 */
import { el } from './dom.js';

/** Per-button label-restore timers. */
const copyTimers = new WeakMap();

/** Announce a short message to the shared status region, if present. */
export function announceCopy(message) {
  const region = document.getElementById('copy-status');
  if (!region) return;
  region.textContent = '';
  // Re-setting the text on the next frame makes some screen readers re-announce.
  window.requestAnimationFrame(() => {
    region.textContent = message;
  });
}

/**
 * Copy `text` to the clipboard, flash the button and announce the outcome.
 * @param {string} text
 * @param {HTMLButtonElement|null} button
 * @param {string} label  what was copied, used in the announcement
 */
export function copyText(text, button, label = 'Text') {
  const done = () => {
    if (button) {
      const prev = button.dataset.label || button.textContent || 'Copy';
      button.dataset.label = prev;
      button.textContent = 'Copied';
      clearTimeout(copyTimers.get(button));
      copyTimers.set(
        button,
        setTimeout(() => {
          button.textContent = prev;
        }, 1600)
      );
    }
    announceCopy(label + ' copied to clipboard.');
  };

  const fallback = () => {
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.top = '-1000px';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(area);
      if (ok) done();
      else announceCopy('Copy failed — select the text and copy manually.');
    } catch {
      announceCopy('Copy failed — select the text and copy manually.');
    }
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(fallback);
  } else {
    fallback();
  }
}

/**
 * Build a copy button.
 * @param {string} text       the text to copy
 * @param {string} label      the visible button label
 * @param {any} [options]     { announce, ariaLabel, class }
 */
export function copyButton(text, label, options = {}) {
  return el(
    'button',
    {
      class: 'btn btn-quiet btn-copy' + (options.class ? ' ' + options.class : ''),
      type: 'button',
      'aria-label': options.ariaLabel || label,
      onClick: (event) => copyText(text, event.currentTarget, options.announce || label)
    },
    label
  );
}
