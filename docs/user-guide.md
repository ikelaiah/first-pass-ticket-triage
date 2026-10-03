# User guide

First Pass turns a messy ticket into a suggested P1–P4 priority, the evidence
behind it, and the questions worth asking next.

Everything runs in your browser. Nothing is uploaded, stored or sent anywhere.
See [PRIVACY.md](https://github.com/ikelaiah/first-pass-ticket-triage/blob/main/PRIVACY.md).

## The workflow

1. **Paste the ticket** exactly as it arrived — email chain, signature blocks and
   all. The email furniture is stripped, the message is not.
2. **Select _Analyse Priority_** (or press <kbd>Ctrl</kbd>+<kbd>Enter</kbd>).
3. **Read the verdict**, then the **8 Questions** panel, then the **follow-up
   questions**.
4. **Ask the requester** the follow-up questions that would change the priority.
5. If you already know an answer, **refine it** and the priority recalculates.

## Reading the result

The card shows, in order:

- **Suggested priority** — P1–P4, or _Unassessed_ when nothing recognisable was
  stated.
- **Impact** and **Urgency** — the two inputs the matrix uses.
- **Safe Next Action** — a suggestion of what to do next (Clarify, Verify,
  Investigate, Contain, Escalate, Plan). It is advisory and never changes the
  priority.
- **8 Questions — Impact vs Urgency** — each question is _Answered_,
  _Inferred_ or _Unknown_, with the quote that decided it.
- **Why P#?** — the evidence → Impact/Urgency → matrix chain.
- **Missing information** — the ranked questions that would change the answer.
- **Triage Handoff**, **Suggested reply**, **Classification**,
  **Assessment confidence**, **Risk flags** and **Reasoning**.

## The eight questions

| #   | Question                                                              |
| --- | --------------------------------------------------------------------- |
| I1  | Who and how many are affected?                                        |
| I2  | What can they not do that they could do yesterday?                    |
| I3  | Is anything wrong, exposed, lost or unsafe — and can it be recovered? |
| I4  | Is it contained, or spreading, recurring, or of unknown extent?       |
| U5  | When do you need this by?                                             |
| U6  | What creates the deadline — a requirement or a preference?            |
| U7  | Can work continue — and what does the workaround cost per day?        |
| U8  | Is the harm happening now, or waiting to happen?                      |

The full definitions are in [PRIORITY-FRAMEWORK.md](https://github.com/ikelaiah/first-pass-ticket-triage/blob/main/PRIORITY-FRAMEWORK.md).

## Ask, don't guess

When a question is **Unknown**, the tool does not invent an answer. It lowers
confidence and lists the questions that would actually change the priority. Ask
the requester, then refine the answer if needed.

If the ticket states no system, symptom or risk at all, the result is
**unassessed** — the tool asks which IT system, application, device or service
needs support. That is not a P4.

## Refine the assessment

Open **Refine assessment** to confirm scope, business consequence, workaround,
deadline, containment, deadline driver, harm timing or critical risks, or to
override Impact/Urgency. Only values you actually change are treated as
confirmed, and the priority recalculates immediately.

## Share a ticket

**Share Link** puts the ticket (first 2000 characters) into the URL fragment
(`#t=…`). The fragment is not sent to the server, but anyone with the link can
read it — do not share sensitive tickets this way.
