/**
 * Share link — the URL carries the ticket, nothing is stored.
 *
 * base64url of the UTF-8 ticket text, capped at 2000 characters so the link
 * stays inside practical URL limits. The link IS the ticket: do not share
 * sensitive tickets this way (documented in PRIVACY.md).
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

export function readTicketFromLocation(loc) {
  try {
    const params = new URLSearchParams(loc.search);
    const t = params.get('t');
    return t ? decodeTicket(t) : null;
  } catch {
    return null;
  }
}

export function writeTicketToLocation(text) {
  try {
    const url = text
      ? '?t=' + encodeTicket(text)
      : window.location.pathname;
    window.history.replaceState(null, '', url);
  } catch {
    // history may be unavailable (file://, sandboxed iframe) — sharing then
    // simply does not persist; the tool still works.
  }
}
