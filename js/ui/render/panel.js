/**
 * A titled result panel. The single wrapper every result section uses, so the
 * card has one consistent structure and the jump-to links can target panels.
 */
import { el } from '../dom.js';

export function panel(title, body, extraClass, id) {
  return el('section', { class: 'panel ' + (extraClass || ''), id }, [el('h3', {}, title), body]);
}
