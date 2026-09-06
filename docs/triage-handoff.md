# Triage Handoff

**Release:** v0.10.0 — Triage Handoff MVP  
**Status:** normative result-projection contract

## Purpose

Triage Handoff is a compact internal/onward-facing summary that an analyst can
paste into a helpdesk comment, Teams message, Azure DevOps work item, email, or
document. It is channel-neutral and available as plain text or Markdown.

The handoff contains the existing suggested Priority, Impact, Urgency, Safe Next
Action, useful Known facts, material Unknown facts, and up to three existing Ask
questions. It is intentionally shorter than the reasoning chain and the full
Eight Questions panel.

## Projection-only boundary

The formatter reads the existing analysis result. It does not call the analyser,
perform NLP, infer facts, rank new questions, reinterpret priority, or mutate the
result. Priority is copied from `suggestedPriority`, Impact and Urgency from their
existing labels, and Safe Next Action from the existing `nextAction` object. A
Clarify handoff explicitly says that operational action is not recommended until
the listed facts are confirmed. An unassessed handoff never exports an actionable
priority.

Known facts prefer established scope, process, system, symptom, consequence,
containment, timing, workaround, and harm values. Unknown facts reuse existing Safe
Next Action blockers, missing information, and key facets. Ask reuses the existing
ranked follow-up questions; the handoff does not create a second question engine.
Analyst-confirmed values remain labelled where that distinction is available.

## Controls and privacy

The result card has a dedicated Triage Handoff panel with Copy handoff, Copy
Markdown, and Download `.md`. Suggested Reply remains a separate requester-facing
draft with Copy reply. Plain text and Markdown use the same projection; no JSON,
HTML, rich clipboard, PDF, channel-specific template, API, or integration is added.

All formatting is local and deterministic. Ticket content is not sent to a server,
stored as case history, or passed to an AI service. The handoff is advisory only;
human judgement, local policy, and agreed service levels prevail.
