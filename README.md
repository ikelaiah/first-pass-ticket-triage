# First Pass: Ticket Triage

> Local-first, explainable P1–P4 suggestions for IT and application support.

Paste a messy ticket, email or work request. Get a suggested priority, the evidence
behind it, the facts that are missing, and the questions worth asking next.

Built for an Application Specialist / IT support role servicing multiple schools and
internal business teams. Plain HTML, CSS and vanilla JavaScript — no framework, no
build step, no backend, no dependencies.

---

## 🔒 Privacy

**Ticket content never leaves the browser.**

All analysis is performed locally using deterministic JavaScript rules. No AI provider,
no server, no analytics, no telemetry, no cookies, no account, no API key.

The page is served over the network like any other web page — that part is unavoidable.
What *is* guaranteed is that nothing you paste is transmitted anywhere. The application
contains no `fetch()`, `XMLHttpRequest`, `WebSocket`, `sendBeacon` or `EventSource` call,
loads no external font, script or stylesheet, and writes nothing to `localStorage`.

Ticket text lives in memory only and disappears when you refresh or close the tab.

Ticket text lives in memory only and disappears when you refresh or close the tab. The only key ever written to `localStorage` is the theme preference (`theme` = `auto`/`light`/`dark`).

See [PRIVACY.md](PRIVACY.md) for how to verify this yourself in about a minute.

---

## ✨ Features

- **Natural-language ticket input** — paste the request exactly as it arrived
- **Input relevance check** — unrelated text is marked unassessed; urgency and scope
  words alone cannot manufacture an IT incident
- **Deterministic rules** — same text in, same answer out, every time
- **P1–P4 suggestion** driven by a single authoritative 3×3 matrix
- **Scope detection** — individual, team, cohort, one school, multiple schools, all schools, corporation-wide
- **Urgency detection** — deadlines, blocking language, "can wait" language
- **Impact detection** — scope plus business consequence, not scope alone
- **Deadline detection** — now, today, tomorrow, 2–5 days, 1–2 weeks, none
- **Workaround detection** — including negation ("we do *not* have a workaround")
- **IT-domain classification** — identity, integration, SQL, data pipeline, Power BI, payroll, and more
- **Critical-risk flags** — payroll, payments, security, privacy, student/staff safety, WWCC/safeguarding, compliance, data integrity, critical integration
- **Explainable decisions** — evidence → impact → urgency → matrix → priority, shown in full
- **8 Questions — Impact vs Urgency** — I1 Who/how many? · I2 Blocked process? · I3 Wrong/exposed/lost/unsafe? · I4 Contained or spreading? · U5 When needed? · U6 Deadline driver (requirement vs preference)? · U7 Workaround daily cost? · U8 Harm now or waiting? — each shown as Answered/Inferred/Unknown with row-aligned cards
- **Confidence scoring** — the tool says when it does not know enough
- **Missing information + follow-up questions** — the questions that would actually change the answer
- **Manual refinement** — confirm scope, workaround, deadline, containment, driver, harm timing or risk and watch the priority recalculate
- **Interactive priority matrix** — the current cell is highlighted; clicking a cell explains it
- **Accessible** — semantic HTML, labelled controls, keyboard operable, no colour-only meaning
- **Offline capable** — once the files are downloaded, it works with the network off

---

## 🎯 Scenario coverage

The engine is tuned for school-sector IT support. It recognises:

| Area | Covered wording |
| ---- | --------------- |
| **Devices** | Intune/MDM, Chromebooks, iPads, BYOD, device enrolment, lockdown browsers, imaging |
| **Systems** | Canvas, Seesaw, Edumate, EnrolHQ, Wonde, Laserfiche, Power BI, Entra ID, Aurion, Ascender Pay, ANZ/ABA, Calumo, Clipboard, Microsoft 365, Outlook, Office suite, Microsoft Copilot, Microsoft Teams, Google Classroom, Canva, SoundTrap, Flexischools, CompliSpace, Moodle, ReadSpeaker, Clever, PortalHQ, Wherescape, Inlogik, APValet, FatZebra, Tyro, BPay, Azure DevOps, SQL Server, SQL Server Management Studio, DBeaver, IBM DB2, PostgreSQL, SQLite, Power Automate, PowerShell, Python, Bash/Linux terminal, Confluence, helpdesk/ITSM |
| **DevOps** | Azure Repos / Pipelines / Boards, build and release failures, broken builds in production, expired service connections, offline agents, blocked pull requests, branch policies, merge conflicts, work items |
| **Collaboration** | Teams meetings and calls, join failures, audio/video, screen sharing, channels, class teams, guest access, recordings |
| **Databases** | SQL Server, DB2 (SQLCODE, tablespaces, deadlocks), PostgreSQL (replication lag, vacuum, connection pools, "relation does not exist"), SQLite (locked database, malformed file) |
| **Access** | access levels, security groups, repository/folder access, admin and privileged access, onboarding, offboarding, leavers who still have access, MFA, SSO, service accounts |
| **Certificates** | expired vs expiring certificates, SSL/TLS errors, client secrets, API keys, licences |
| **Integration** | sync stopped, partial batches, retry backlogs, API 401/403/500, rate limits, vendor outages, staging pipelines |
| **Data quality** | duplicates, bad merges, wrong carers/guardians, wrong year level, wrong photo, incorrect amounts, values flip-flopping between syncs, corruption spreading downstream |
| **Education apps** | Google Classroom, Canva, SoundTrap, Flexischools, CompliSpace, Moodle, ReadSpeaker, Clever |
| **AI** | Microsoft Copilot |
| **Payments gateway** | Inlogik, APValet, FatZebra, Tyro, BPay, Ascender Pay |
| **Data warehouse** | Wherescape, PortalHQ, Aquia Data Studio |
| **Scripting / Terminal** | Bash, Git Bash, Linux, PowerShell, Python, DBeaver, SQL Server Management Studio, Confluence, database triggers |
| **Money** | payroll, timesheets, Clipboard (extracurricular), ABA files, superannuation, school fees, advance payments, fee balances, receipts, refunds, over/underpayment |
| **Safety** | allergies, anaphylaxis, medical alerts, health care plans, medication, first aid, evacuation alarms, intercom/PA, lockdown, duress, emergency calls, excursions, bus runs |
| **Legal** | court orders, parenting orders, custody and non-custodial arrangements, AVOs, "must not see", restricted parties who still have access |
| **Security incidents** | phishing clicks, credential compromise, suspicious sign-ins, impossible travel, mailbox rules, lost or stolen devices, unapproved OAuth consent to student data |
| **Recoverability** | deletion and data loss, failed backups, restore and point-in-time requests, retention, DR |
| **Continuity** | licence exhaustion, spending caps, subscription expiry, site outages, power and internet loss, vendor deprecation and breaking changes |
| **Academic ops** | year rollover, class lists, timetable clashes, subject selection, report cards, attendance, excursions, NAPLAN |
| **Process** | change freezes and unapproved changes, SLA breaches, stakeholder escalation, UAT vs production, monitoring gaps, daylight-saving drift |
| **Statutory** | WWCC/safeguarding, compliance audits, government and attendance reporting, NAPLAN, census |
| **Accessibility** | WCAG, screen readers, keyboard navigation, contrast, assistive technology |
| **Infrastructure** | Windows/servers, shared drives, file servers, printing, disk and storage capacity, network, DNS, VPN, firewall |
| **Messaging** | email and notification delivery, SMS, invitations, queue backlogs |
| **Email chains** | signature blocks, disclaimers, image references and link wrappers stripped before analysis; observation verbs and counterfactuals distinguished from real deadlines |
| **Problem signals** | recurrence, unknown extent, a working control ("one synced, one didn't"), source-of-truth checks, known answers from config |
| **Everything else** | performance degradation, SQL errors, scheduled jobs, Power BI refresh, feature requests, documentation, expected scheduled behaviour |

Coverage is asserted, not asserted-to: `tests/tests.js` runs every one of these
scenario families and fails if a change moves them. Adding a new wording means adding
a phrase to `js/data/phrases.js` and a case to the suite — no engine change.

## ⚙️ How it works

```text
Ticket
   ↓
Natural-language evidence
   ↓  Evidence (Scope · Workaround · Deadline · Symptom · Domain · Risk
   ↓          · Containment · Driver · Harm timing) — 9 signals
   ↓  viewed as 8 Questions — Impact I1–I4 vs Urgency U5–U8
   ↓  I1 Scope  I2 Blocked process (Symptom+Domain)  I3 Wrong/exposed  I4 Contained?
   ↓  U5 When?  U6 Requirement vs preference?  U7 Daily cost?  U8 Now vs pending?
   ↓
Impact + Urgency  (weighted, then critical-risk modifiers)
   ↓
3×3 Priority Matrix  (only place a P number is decided)
   ↓
P1 / P2 / P3 / P4  + Confidence · Reasoning · Missing info
```

The natural-language engine never picks a priority. It establishes **Impact** and
**Urgency** from evidence; critical-risk modifiers may raise or lower those two values;
and only then does the matrix decide.

|                    | Low impact | Medium impact | High impact |
| ------------------ | ---------- | ------------- | ----------- |
| **High urgency**   | P3         | P2            | P1          |
| **Medium urgency** | P3         | P3            | P2          |
| **Low urgency**    | P4         | P3            | P2          |

The full framework — impact and urgency definitions, wording cues, payroll, privacy,
safeguarding, data-integrity and expected-behaviour rules — is documented in
[PRIORITY-FRAMEWORK.md](PRIORITY-FRAMEWORK.md).

### 🔍 Worked example

> "Laserfiche has stopped writing records to staging for all schools since midnight."

```text
"all schools"        → every school affected
"has stopped"        → outage symptom
"staging"            → shared data pipeline
        ↓
Impact: HIGH   (all-school scope + shared pipeline + outage)
Urgency: MEDIUM (broad outage in progress, but no deadline was stated)
        ↓
Matrix
        ↓
P2 — High
```

…together with the questions that would change the answer:

- When is this required by? What happens if it is not resolved today?
- Is there a workaround or manual process available?
- When does business processing next depend on this?

---

## 🧭 Design principles

1. 🎭 **Classify by business consequence and time sensitivity, not by how dramatic the
   wording is.** "URGENT!!! Laserfiche is broken!!!" is not a P1 — it is a request for
   more information.
2. 🧮 **The matrix is authoritative.** Nothing else in the codebase is allowed to name a
   priority.
3. 🤷 **Never invent facts.** Unknown scope stays Unknown, and it lowers confidence.
4. 🔎 **Explain everything.** A priority with no visible reasoning is not useful in a
   triage conversation.
5. 🤝 **Advisory only.** The tool supports a human decision; it does not make one.

---

## 🚀 Running locally

The application is a static site, but it uses ES modules, so browsers will refuse to
load it directly from `file://`. Serve the folder over HTTP:

```bash
# Python 3
python -m http.server 8000

# Node
npx serve .

# PHP
php -S localhost:8000
```

Then open <http://localhost:8000>.

### 🪟 On Windows, with none of those installed

Double-click **`serve.bat`**, or run it from a prompt:

```bat
serve.bat              :: http://localhost:8000, opens your browser
serve.bat -Port 8080   :: different port
```

The batch file is a thin wrapper around `serve.ps1`. It exists because PowerShell
blocks scripts by default, and the wrapper bypasses that **for one run only** — it
changes no system setting.

If you would rather run the PowerShell script directly:

```powershell
.\serve.ps1
```

…and if that fails with *"running scripts is disabled on this system"*, either use
`serve.bat`, or allow local scripts once and for all (no admin required):

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

`RemoteSigned` lets local scripts run while still requiring a signature on anything
downloaded. Check `Get-ExecutionPolicy -List` first — if `MachinePolicy` or
`UserPolicy` shows a value, Group Policy is enforcing it and you should use
`serve.bat` instead.

In VS Code, the **Live Server** extension works too: right-click `index.html` →
*Open with Live Server*.

### 🛑 Stopping the server

Press <kbd>Ctrl</kbd> + <kbd>C</kbd> in the terminal, or close the terminal window.

If a server is ever left running, **find it by command line, not by port**:

```powershell
Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" |
  Where-Object { $_.CommandLine -like '*serve.ps1*' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
```

⚠️ Do not look up "what owns port 8000" and stop that. It reports as **`System`,
PID 4** — the Windows kernel HTTP driver that `HttpListener` runs behind. Killing it
bluescreens the machine.

> 🛠️ `serve.bat` and `serve.ps1` are development conveniences only. Neither is part of
> the application and neither is deployed — the published site is plain static files.

### 🧪 Tests

Open <http://localhost:8000/tests/tests.html> — the suite runs in the page and prints a
PASS/FAIL line for every assertion.

With Node available, the same suite runs in a terminal:

```bash
node tests/run.mjs      # or: npm test
```

The Node runner also performs a static source scan that fails the build if any
`fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon` or remote asset reference is ever
introduced.

> `package.json` exists only so Node can load the ES modules for that optional runner.
> The application itself has no dependencies and needs no Node, npm or build step.

---

## 🌐 GitHub Pages

1. Commit the repository, including `.nojekyll` (it stops Pages from post-processing
   the `css/` and `js/` folders).
2. Push to GitHub.
3. **Settings → Pages → Build and deployment**
   - Source: **Deploy from a branch**
   - Branch: `main`, folder: `/ (root)`
4. Save. The site publishes at `https://<user>.github.io/<repo>/`.

No build step, no workflow file and no secrets are required. The site works from a
project subpath because every asset reference is relative.

---

## 📁 Project structure

```text
first-pass-triage/
├── index.html                  entry point and page structure
├── css/styles.css              the only stylesheet
├── js/
│   ├── app.js                  DOM wiring only
│   ├── config.js               organisation-specific settings (schools, systems, jobs)
│   ├── engine/
│   │   ├── analyzer.js         the pipeline: evidence → impact/urgency → matrix
│   │   ├── negation.js         normalisation, clause splitting, negation-aware matching
│   │   ├── scope.js            individual … corporation-wide
│   │   ├── deadline.js         now … no deadline, and asserted vs committed
│   │   ├── workaround.js       yes / partial / no / unknown + daily cost
│   │   ├── containment.js      contained vs spreading / recurring / unknown
│   │   ├── driver.js           deadline driver — requirement or preference
│   │   ├── harm-timing.js      expired vs expiring — harm now or waiting
│   │   ├── symptom.js          what is happening technically
│   │   ├── domain.js           identity, integration, SQL, data pipeline, BI, …
│   │   ├── work-type.js        incident, request, feature, documentation, …
│   │   ├── risks.js            payroll, privacy, safeguarding, data integrity, …
│   │   ├── impact.js           weighted impact scoring
│   │   ├── urgency.js          weighted urgency scoring
│   │   ├── confidence.js       how much was actually known
│   │   └── priority-matrix.js  the authoritative Impact × Urgency table
│   ├── data/
│   │   ├── phrases.js          every phrase dictionary
│   │   ├── systems.js          system detection from config
│   │   └── examples.js         the example tickets
│   └── ui/
│       ├── dom.js              small createElement helpers
│       ├── render-result.js    the result card
│       ├── render-matrix.js    the interactive matrix
│       └── refine-controls.js  the manual refinement panel
├── tests/
│   ├── tests.html              browser test page
│   ├── tests.js                the assertions (shared)
│   └── run.mjs                 optional Node runner + privacy source scan
├── serve.bat                   double-click launcher for the dev server
├── serve.ps1                   local dev server for Windows (not deployed)
├── README.md
├── PRIORITY-FRAMEWORK.md
├── PRIVACY.md
└── LICENSE
```

---

## 🔧 Configuration

Organisation-specific values live in one file: [`js/config.js`](js/config.js).

```javascript
export const organisationConfig = {
  schoolCount: 19,
  systems: {
    canvas: { name: 'Canvas', aliases: ['canvas', 'lms'], critical: true },
    // …
  },
  scheduledJobs: [
    { name: 'Casual Staff Canvas Sync', scheduledTime: '09:30',
      keywords: ['casual', 'canvas', 'staff'], minKeywords: 3 }
  ]
};
```

Adding a system, an alias or a scheduled job needs no engine changes.

## 🧩 Extending the rules

- **New wording** → add a phrase to the relevant list in `js/data/phrases.js`.
- **New risk** → add an entry to `RISK_DEFINITIONS`, then decide its weight in
  `js/engine/impact.js` and, if it can escalate, in `applyRiskModifiers()`.
- **New scenario** → add it to `js/data/examples.js` with the priorities you consider
  defensible; the test suite asserts every example automatically.

Weights are deliberately in two small files (`impact.js`, `urgency.js`) so tuning is a
readable diff rather than a hunt.

---

## ⚠️ Limitations

- 🤖 **This is not AI.** It is a deterministic phrase and weighting engine. It does not
  understand your ticket; it recognises wording.
- 💬 **Natural-language understanding is imperfect.** Sarcasm, unusual phrasing, heavy
  abbreviation and pasted log dumps will all reduce accuracy.
- 🧑‍⚖️ **It is advisory.** Human judgement, local policy and agreed service levels always
  take precedence.
- ❓ **Ambiguous requests need conversation.** When the tool reports low confidence and a
  list of questions, the questions are the output that matters.
- 🧠 **It has no memory.** Nothing is stored, so there is no history, no trend and no
  learning from your corrections — by design.

---

## 📄 Licence

[MIT](LICENSE).
