/**
 * Minimal DOM helpers.
 *
 * Everything is built with createElement and textContent. Ticket wording is
 * quoted back to the user throughout the result card, so no user-supplied
 * string is ever interpolated into HTML.
 */

/**
 * el('p', { class: 'hint' }, 'text')
 * el('ul', {}, [el('li', {}, 'one'), el('li', {}, 'two')])
 */
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (value === true) node.setAttribute(key, '');
    else node.setAttribute(key, String(value));
  }
  const list = Array.isArray(children) ? children : [children];
  for (const child of list) {
    if (child === null || child === undefined || child === false) continue;
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

/** Remove every child of a node. */
export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

/** Replace a node's contents in one step. */
export function replace(node, children) {
  clear(node);
  const list = Array.isArray(children) ? children : [children];
  for (const child of list) {
    if (child === null || child === undefined || child === false) continue;
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

/** A definition-list row. */
export function fact(term, value, extraClass) {
  return [
    el('dt', {}, term),
    el('dd', { class: extraClass }, value)
  ];
}

/** "quoted evidence" rendered safely. */
export function quote(text) {
  return el('q', { class: 'quote' }, text);
}
