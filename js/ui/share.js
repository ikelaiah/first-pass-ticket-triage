/**
 * Share link — the URL carries the ticket, nothing is stored.
 *
 * base64url of the UTF-8 ticket text, capped at 2000 characters so the link
 * stays inside practical URL limits. New links use a fragment so the ticket is
 * not sent in the HTTP request. The link IS the ticket: do not share sensitive
 * tickets this way (documented in PRIVACY.md).
 */

export const SHARE_LIMIT = 2000;

export function tooLongForShare(text) {
  return String(text == null ? '' : text).length > SHARE_LIMIT;
}

export function encodeTicket(text) {
  const capped = String(text == null ? '' : text).slice(0, SHARE_LIMIT);
  const b64 = btoa(unescape(encodeURIComponent(capped)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeTicket(encoded) {
  try {
    let b64 = String(encoded == null ? '' : encoded).replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    return decodeURIComponent(escape(atob(b64)));
  } catch {
    return null;
  }
}

function queryWithoutTicket(search) {
  const params = new URLSearchParams(search || '');
  params.delete('t');
  const query = params.toString();
  return query ? '?' + query : '';
}

function locationBase(loc) {
  return (loc.pathname || '') + queryWithoutTicket(loc.search);
}

function readFragmentTicket(hash) {
  const value = String(hash || '').replace(/^#/, '');
  const params = new URLSearchParams(value);
  const encoded = params.get('t');
  return encoded ? decodeTicket(encoded) : null;
}

function removeLegacyTicket(loc) {
  if (typeof window === 'undefined' || !window.history?.replaceState) return;
  window.history.replaceState(null, '', locationBase(loc) + (loc.hash || ''));
}

export function readTicketFromLocation(loc) {
  try {
    const fragmentTicket = readFragmentTicket(loc.hash);
    if (fragmentTicket !== null) return fragmentTicket;

    const params = new URLSearchParams(loc.search);
    const encoded = params.get('t');
    if (!encoded) return null;
    const ticket = decodeTicket(encoded);
    if (ticket !== null) removeLegacyTicket(loc);
    return ticket;
  } catch {
    return null;
  }
}

export function writeTicketToLocation(text) {
  try {
    const base = locationBase(window.location);
    const url = text ? base + '#t=' + encodeTicket(text) : base;
    window.history.replaceState(null, '', url);
  } catch {
    // history may be unavailable (file://, sandboxed iframe) — sharing then
    // simply does not persist; the tool still works.
  }
}
