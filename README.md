# First Pass: Ticket Triage

> Local-first, explainable P1–P4 suggestions for IT and application support.

v0.12.0: **Core simplification.** The project was reduced to the eight-question
model and the 3×3 matrix. It now detects what a ticket states and asks about the
rest, instead of inferring deadlines, consequences, upstream systems and
platform categories from configuration.

Paste a messy ticket, email or work request. Get a suggested priority, the
evidence behind it, the facts that are missing, and the questions worth asking
next. Plain HTML, CSS and vanilla JavaScript — no framework, no build step, no
backend, no dependencies.

The full contract — every input the priority is calculated from, and the eight
decision questions — is [PRIORITY-FRAMEWORK.md](PRIORITY-FRAMEWORK.md).

---

## 🔒 Privacy

**Ticket content never leaves the browser.**

All analysis is performed locally using deterministic JavaScript rules. No AI
provider, no server, no analytics, no telemetry, no cookies, no account, no API
key. The application contains no `fetch()`, `XMLHttpRequest`, `WebSocket`,
`sendBeacon` or `EventSource` call, and loads no external font, script or
stylesheet. Ticket text lives in memory only and disappears when you refresh or
close the tab. See [PRIVACY.md](PRIVACY.md) to verify this yourself.

---

## ✨ Features

- **Natural-language ticket input** — paste the request exactly as it arrived
- **Input relevance check** — unrelated text is marked unassessed; urgency and
  scope words alone cannot manufacture an IT incident
- **Deterministic rules** — same text in, same answer out, every time
- **P1–P4 suggestion** driven by a single authoritative 3×3 matrix
- **8 Questions — Impact vs Urgency** — I1 Who/how many? · I2 Blocked process? ·
  I3 Wrong/exposed/lost/unsafe — recoverable? · I4 Contained or spreading? ·
  U5 When needed? · U6 Requirement vs preference? · U7 Workaround cost? ·
  U8 Harm now or waiting? — each shown as Answered / Inferred / Unknown, with
  *key driver* badges on the unknowns that could flip the cell
- **Ask, don't guess** — an unknown that could change the priority becomes a
  ranked follow-up question instead of an inference
- **Manual refinement** — confirm any question and watch the priority
  recalculate immediately
- **Reasoning chain** — evidence → Impact/Urgency → matrix → P, shown in full
- **Critical-risk safety floor** — payroll, payments, privacy, security, safety,
  safeguarding, data integrity and recoverability
- **Assessment confidence** — a heuristic for how much the ticket actually said,
  clearly labelled as not a probability
- **Safe Next Action** — a separate Clarify / Verify / Investigate / Contain /
  Escalate / Plan advisory; it never changes the suggested priority
- **Triage Handoff** — a compact Known · Unknown · Ask summary with Copy,
  Copy Markdown and Download .md
- **Suggested reply (draft)** — a short requester-facing draft
- **Share link** — `#t=` URL fragment carries the ticket (2000-char cap);
  fragments are not sent to the server, nothing is stored
- **Accessible, offline capable** — semantic HTML, labelled controls, no
  colour-only meaning; works with the network off once downloaded

---

## ⚙️ How it works

```text
Ticket
   ↓
Structured evidence (the eight decision questions)
   ↓  I1 Scope · I2 Blocked process · I3 Risk/recoverability · I4 Containment
   ↓  U5 Deadline · U6 Driver · U7 Workaround · U8 Harm timing
   ↓
Impact + Urgency  (weighted, then a small safety calibration)
   ↓
3×3 Priority Matrix  (the only place a P number is decided)
   ↓
P1 / P2 / P3 / P4  +  confidence · reasoning · missing info · follow-up questions
```

The engine never picks a priority. It establishes **Impact** and **Urgency**;
the safety calibration may raise or lower those two values; only then does the
matrix decide. Safe Next Action, the handoff and the reply are pure projections
that cannot feed back into the priority.

---

## 🚀 Running locally

The application is a static site, but it uses ES modules, so browsers will refuse
to load it directly from `file://`. Serve the folder over HTTP:

```bash
python -m http.server 8000      # Python 3
npx serve .                     # Node
php -S localhost:8000           # PHP
```

Then open <http://localhost:8000>.

On Windows, double-click **`serve.bat`** (a thin wrapper around `serve.ps1`).
The dev server is not part of the application and is not deployed.

### 🧪 Tests

```bash
node tests/run.mjs      # 51 acceptance assertions + privacy source scan
npm test                # same
```

Open <http://localhost:8000/tests/tests.html> to run the suite in a browser.

The Node runner also performs a static source scan that fails the build if any
`fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon` or remote asset reference is
ever introduced.

---

## 📁 Project structure

```text
first-pass-triage/
├── index.html                  entry point and page structure
├── css/styles.css              the only stylesheet
├── js/
│   ├── app.js                  DOM wiring only
│   ├── config.js               organisation-specific settings (systems)
│   ├── engine/
│   │   ├── analyzer.js         the pipeline: evidence → impact/urgency → matrix
│   │   ├── negation.js         normalisation, clause splitting, negation-aware matching
│   │   ├── evidence.js         the evidence ledger (temporal/polarity/authority)
│   │   ├── scope.js            I1  individual … corporation-wide
│   │   ├── symptom.js          what is happening technically
│   │   ├── risks.js            I3  payroll, privacy, security, safety, safeguarding, data integrity
│   │   ├── recoverability.js   I3  recoverable vs unrecoverable loss
│   │   ├── containment.js      I4  contained vs spreading / recurring / unknown
│   │   ├── deadline.js         U5  now … no deadline
│   │   ├── driver.js           U6  requirement or preference
│   │   ├── workaround.js       U7  yes / partial / no / unknown + daily cost
│   │   ├── harm-timing.js      U8  expired vs expiring — harm now or waiting
│   │   ├── impact.js           weighted impact scoring
│   │   ├── urgency.js          weighted urgency scoring
│   │   ├── policy.js           the hard-safety calibration
│   │   ├── confidence.js       how much was actually known
│   │   ├── next-action.js      Safe Next Action advisory
│   │   └── priority-matrix.js  the authoritative Impact × Urgency table
│   ├── data/
│   │   ├── phrases.js          every phrase dictionary
│   │   ├── systems.js          configured system detection
│   │   └── examples.js         the example tickets
│   └── ui/                     render-result, render-matrix, refine-controls,
│                               reply, handoff, share, dom
├── tests/
│   ├── tests.html              browser test page
│   ├── triage.test.mjs         the acceptance assertions
│   └── run.mjs                 Node runner + privacy source scan
├── serve.bat / serve.ps1       local dev server for Windows (not deployed)
├── PRIORITY-FRAMEWORK.md       the authoritative contract
├── PRIVACY.md
└── CHANGELOG.md
```

---

## 🔧 Configuration

Organisation-specific values live in [`js/config.js`](js/config.js): the school
count and the known systems and their aliases. Adding a system or an alias needs
no engine changes.

---

## 🧩 Extending the rules

- **New wording** → add a phrase to the relevant list in `js/data/phrases.js`.
- **New risk** → add an entry to `RISK_DEFINITIONS`, decide its base evidence
  contribution in `js/engine/impact.js`, and any safety escalation in
  `js/engine/policy.js`.
- **New example** → add it to `js/data/examples.js`.

Base weights live in two small files (`impact.js`, `urgency.js`) and the safety
calibration in `policy.js`, so tuning is a readable diff.

---

## ⚠️ Limitations

- 🤖 **This is not AI.** It is a deterministic phrase and weighting engine. It
  recognises wording; it does not understand your ticket.
- 🧭 **Clarification is a safety feature.** A question the ticket does not answer
  stays Unknown and becomes a follow-up question rather than a guess.
- 💬 **Natural-language understanding is imperfect.** Sarcasm, heavy
  abbreviation and pasted log dumps reduce accuracy.
- 🧑‍⚖️ **It is advisory.** Human judgement, local policy and agreed service
  levels always take precedence.
- 🧠 **It has no memory.** Nothing is stored, so there is no history or learning
  from corrections — by design.
- 🔗 **The share link is the ticket.** It contains the pasted text (first 2000
  characters); do not use it for sensitive tickets.

Queue management is deliberately separate from priority and is not implemented.
Ticket age must not silently increase impact or urgency.

---

## 📄 Licence

[MIT](LICENSE).
