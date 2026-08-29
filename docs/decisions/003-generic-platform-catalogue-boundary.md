# ADR-003: Separate generic platform catalogue from organisation configuration

## Status

Accepted

## Date

2026-08-29

## Context

The application originally kept all recognisable systems in `js/config.js`. That
worked for a single organisation’s operational profile, but it made a complete
Pre-K–12 platform landscape difficult to maintain and encouraged generic product
knowledge to become mixed with organisation-specific criticality, schedules and
data flows. The reference catalogue also includes repeated products, branded
modules, standards, and provisioning methods that should be represented without
pretending they are all vendors.

## Decision

Keep generic platform identity in `js/data/platform-catalogue.js`. Each canonical
entity records a stable ID, display name, safe detection aliases, entity type,
source categories, source names, and source metadata. Repeated products and obvious
families use one canonical entity with explicit source-name/module mappings and the
union of all source categories.

`js/config.js` remains the organisation profile. Its IDs, critical flags, scheduled
jobs, source-of-truth relationships, and status consequences remain authoritative.
System detection combines both layers while preserving configured IDs and criticality.
The result model exposes platform details and categories as routing context, but the
impact and urgency engines do not read category membership. Technical domains remain
a separate classification.

The checked-in Markdown reference is parsed by an automated Node reconciliation test.
The test proves every source category assignment maps to a catalogue entity and that
the entity retains that category. It also reports family/module normalisations and
guarded ambiguous names.

## Alternatives considered

### Append all names to `js/config.js`

Rejected because it mixes reusable product knowledge with deployment facts and makes
category metadata, standards, and module relationships hard to audit.

### Use one independent entity for every source row

Rejected because repeated products and obvious product families would lose their
multi-category relationship and create misleading duplicate systems.

### Let categories influence priority

Rejected because a payment, wellbeing, or integrity platform does not prove a
business consequence. Priority remains evidence-driven and matrix-based.

### Depend on external product research or a remote resolver

Rejected because the supplied Markdown is authoritative and the application remains
local-first, deterministic, dependency-free, and privacy-preserving.

## Consequences

- New generic platforms can be added without changing organisation flows or flags.
- Catalogue categories are available to UI/support routing without priority drift.
- Ambiguous names require contextual aliases or deliberate false-negative coverage.
- The reconciliation test must be kept with the source document whenever the source
  inventory changes.
