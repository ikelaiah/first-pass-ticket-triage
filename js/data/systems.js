/**
 * System detection.
 *
 * System names are *topical*: "Canvas is not broken" is still a Canvas ticket,
 * so matching here deliberately ignores negation.
 */
import { organisationConfig } from '../config.js';
import { scan } from '../engine/negation.js';

/** Build dictionary entries from the organisation configuration. */
export function buildSystemEntries(config = organisationConfig) {
  return Object.entries(config.systems).map(([id, system]) => ({
    m: system.aliases,
    v: id,
    name: system.name,
    critical: Boolean(system.critical),
    negate: false,
    label: system.name + ' referenced'
  }));
}

const ENTRIES = buildSystemEntries();

/**
 * @returns {{ systems: Array, primary: (object|null), criticalSystem: boolean, evidence: Array }}
 */
export function detectSystems(doc, config = organisationConfig) {
  const entries = config === organisationConfig ? ENTRIES : buildSystemEntries(config);
  const hits = scan(doc, entries, { negate: false });

  const byId = new Map();
  for (const hit of hits) {
    const id = hit.entry.v;
    const existing = byId.get(id);
    if (existing) {
      existing.count += 1;
      // Prefer the longest alias as the quote ("power bi" over "pbi").
      if (hit.quote.length > existing.quote.length) existing.quote = hit.quote;
    } else {
      byId.set(id, {
        id,
        name: hit.entry.name,
        critical: hit.entry.critical,
        quote: hit.quote,
        count: 1,
        firstIndex: hit.start
      });
    }
  }

  const systems = [...byId.values()].sort(
    (a, b) => b.count - a.count || a.firstIndex - b.firstIndex
  );

  return {
    systems,
    primary: systems[0] || null,
    criticalSystem: systems.some((s) => s.critical),
    evidence: systems.map((s) => ({
      quote: s.quote,
      meaning: s.name + ' identified',
      source: 'system'
    }))
  };
}

/** Human-readable list: "Canvas and Edumate". */
export function describeSystems(systems) {
  if (!systems.length) return 'Not identified';
  if (systems.length === 1) return systems[0].name;
  const names = systems.map((s) => s.name);
  return names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
}
