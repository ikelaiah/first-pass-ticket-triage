# Privacy

**Ticket content never leaves the browser.**

---

## What this application does

First Pass analyses text that you paste into the page. All of that
analysis happens in your browser, using deterministic JavaScript rules that ship with
the site.

- **No AI provider.** No OpenAI, Microsoft Copilot, Azure OpenAI, Anthropic, Gemini,
  Hugging Face, or any other model API — local or remote.
- **No server.** There is no backend, no API, no database and nothing to log into.
- **No analytics or telemetry.** No Google Analytics, no Application Insights, no
  tracking pixel, no error-reporting SDK, no beacon.
- **No cookies.** The application sets none.
- **No remote storage.** Nothing is uploaded, synced or backed up.
- **No user accounts.** No sign-in, no identity, no API key.
- **No ticket persistence.** Ticket text is held in memory only.

---

## What happens to your ticket text

1. You paste text into the textarea.
2. JavaScript already loaded in the page reads it from the DOM.
3. Phrase dictionaries and scoring rules run against it, in memory.
4. The result is written back into the page.

That is the entire lifecycle. When you press **Clear**, refresh the tab, navigate away or
close the browser, the text is gone. There is no undo, no history and no draft recovery,
because nothing is saved anywhere.

The application only writes the theme preference (`localStorage` key `theme` = `auto`/`light`/`dark`) and only if you use the System/Light/Dark switcher. Ticket text is never written to `localStorage`, `sessionStorage` or IndexedDB. Should an opt-in ticket-save feature ever be added, it would be explicit, off by default, and documented here.

### The one thing that does carry ticket text: the share link

**Share Link** puts the ticket (first 2000 characters) into the page URL fragment as
`#t=` so a colleague can open the same analysis. Fragments are not sent in the HTTP
request, so the ticket is not written to server access logs by this link. However,
anyone you give the link to can read it, and it may remain in browser history or copied
messages. **Do not use Share Link for sensitive tickets.** Clearing the box removes the
fragment from the address bar. Legacy `?t=` links are accepted once and cleaned from
the address bar after reading, but their ticket text was already part of the initial
HTTP request and may therefore be in server logs; cleanup cannot undo that exposure.
Prefer the fragment format. Downloading the `.md` slip keeps everything on your device.

---

## The one honest caveat

This page is delivered over the network like any other web page. When you first open it,
your browser requests `index.html`, `css/styles.css` and the files under `js/` from
whatever host serves the site — GitHub Pages, an internal web server, or your own
machine. That request is visible to that host, as any web request is.

**We do not claim that GitHub Pages involves no network communication.** The accurate
claim is narrower and stronger:

> **Ticket content never leaves the browser.**

Once the page has loaded, the application makes no further network requests of any kind.
You can disconnect from the network entirely and every feature still works.

---

## How to verify this yourself

You do not have to take any of the above on trust. Three checks, each under a minute.

### 1. Watch the network

1. Open the page.
2. Open your browser's developer tools (**F12**) and select the **Network** tab.
3. Reload, then clear the request list.
4. Paste a ticket and select **Analyse Priority**. Refine it. Load an example.
5. **The request list stays empty.** No request is made, so no ticket content is sent.

### 2. Pull the plug

1. Load the page.
2. Go offline — switch on airplane mode, disconnect the network, or tick **Offline** in
   the developer tools Network tab.
3. Keep using the application. Analysis, refinement and the matrix all continue to work,
   because everything needed is already in the page.

An application that phones home cannot do this.

### 3. Read the source

The whole application is plain, unminified, unbundled JavaScript. There is no build step,
so what you read in the repository is exactly what your browser runs.

Search the repository for any way to send data out:

```bash
grep -rniE "fetch\(|XMLHttpRequest|WebSocket|sendBeacon|EventSource|navigator\.send" \
  index.html css js
```

The only matches are in the privacy explanation text itself, which names these APIs in
order to say they are not used.

Check for remote assets:

```bash
grep -rniE "https?://" index.html css js
```

The only match is the inline SVG namespace declaration inside the favicon data URI
(`http://www.w3.org/2000/svg`) — a specification identifier that browsers never fetch.
Every other reference in the page is a relative path.

Check for storage:

```bash
grep -rniE "localStorage|sessionStorage|indexedDB|document\.cookie" index.html css js
```

The only `localStorage` hit is the theme switcher (`theme` = `auto`/`light`/`dark` in `js/app.js`) — no ticket content, no `sessionStorage`, no `indexedDB`, no `document.cookie`.

An automated version of these checks runs as part of the test suite
(`node tests/run.mjs`) and fails if any network call, remote asset or beacon is ever
introduced.

---

## What is loaded from where

| Asset | Origin |
| ----- | ------ |
| `index.html` | the host serving the site |
| `css/styles.css` | the host serving the site |
| `js/**/*.js` | the host serving the site |
| Fonts | none — the page uses fonts already installed on your device |
| Icons | none — the favicon is an inline SVG data URI |
| Third-party scripts | none |
| CDN resources | none |

There is nothing in the repository that is fetched from a third party, at load time or
afterwards.

---

## If you self-host

Hosting the folder yourself changes nothing about how the analysis works. Copy the
repository onto any static web server — IIS, nginx, Apache, an internal SharePoint-hosted
site, or a folder served by `python -m http.server` — and the privacy position is
identical.

Your web server will record the usual access log entries for the page and its assets. It
will not record ticket content, because ticket content is never sent to it.

---

## Reporting a concern

If you find anything in this repository that contradicts this document — any code path
that transmits, stores or persists ticket content — treat it as a defect and raise it.
The privacy position is the point of the tool, not a feature of it.
