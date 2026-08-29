/**
 * System detection.
 *
 * System names are *topical*: "Canvas is not broken" is still a Canvas ticket,
 * so matching here deliberately ignores negation.
 */
import { organisationConfig } from '../config.js';
import { scan } from '../engine/negation.js';
import { platformCatalogue, platformCatalogueById } from './platform-catalogue.js';

function catalogueMetadata(id, system) {
  return platformCatalogueById.get(id) ||
    platformCatalogue.find((entry) => entry.name === system.name) || null;
}

function safeCatalogueAliases(catalogue) {
  if (!catalogue) return [];
  const guarded = catalogue.guardedAliases || [];
  if (!guarded.length) return catalogue.aliases || [];

  // A guarded one-word brand must not also retain its unsafe bare alias. Full
  // product/module names remain safe and continue to match normally.
  const canonical = catalogue.name.toLowerCase();
  return (catalogue.aliases || []).filter((alias) =>
    alias.toLowerCase() !== canonical || alias.includes(' '));
}

/** Build dictionary entries from organisation config plus generic catalogue data. */
export function buildSystemEntries(config = organisationConfig) {
  const configured = Object.entries(config.systems).map(([id, system]) => {
    const catalogue = catalogueMetadata(id, system);
    return {
      m: [
        ...(system.aliases || []),
        ...safeCatalogueAliases(catalogue),
        ...(catalogue?.guardedAliases || []).map((source) => new RegExp(source, 'i'))
      ],
      v: id,
      name: system.name,
      critical: Boolean(system.critical),
      entityType: catalogue?.entityType || 'system',
      categories: catalogue?.categories || [],
      sourceNames: catalogue?.sourceNames || [],
      url: catalogue?.url,
      typicalLevel: catalogue?.typicalLevel,
      mainUse: catalogue?.mainUse,
      negate: false,
      label: system.name + ' referenced'
    };
  });

  // Custom configs are deliberately isolated: callers supplying a deployment
  // profile still get exactly that profile, while the default app combines it
  // with generic catalogue identity.
  if (config !== organisationConfig) return configured;

  const configuredIds = new Set(configured.map((entry) => entry.v));
  const generic = platformCatalogue
    .filter((catalogue) => !configuredIds.has(catalogue.id))
    .map((catalogue) => ({
      m: [
        ...safeCatalogueAliases(catalogue),
        ...(catalogue.guardedAliases || []).map((source) => new RegExp(source, 'i'))
      ],
      v: catalogue.id,
      name: catalogue.name,
      critical: false,
      entityType: catalogue.entityType,
      categories: catalogue.categories,
      sourceNames: catalogue.sourceNames,
      url: catalogue.url,
      typicalLevel: catalogue.typicalLevel,
      mainUse: catalogue.mainUse,
      negate: false,
      label: catalogue.name + ' referenced'
    }));

  return configured.concat(generic);
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
        entityType: hit.entry.entityType,
        categories: hit.entry.categories || [],
        sourceNames: hit.entry.sourceNames || [],
        url: hit.entry.url,
        typicalLevel: hit.entry.typicalLevel,
        mainUse: hit.entry.mainUse,
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
