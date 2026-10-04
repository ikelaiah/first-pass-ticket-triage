/**
 * System detection.
 *
 * System names are *topical*: "Canvas is not broken" is still a Canvas ticket,
 * so matching here deliberately ignores negation.
 */
import { deploymentProfile } from '../deployment.js';
import { scan } from '../engine/negation.js';
import { platformCatalogue, platformCatalogueById } from './platform-catalogue.js';

function catalogueMetadata(id, system) {
  return (
    platformCatalogueById.get(id) ||
    platformCatalogue.find((entry) => entry.name === system.name) ||
    null
  );
}

function safeCatalogueAliases(catalogue) {
  if (!catalogue) return [];
  const guarded = catalogue.guardedAliases || [];
  if (!guarded.length) return catalogue.aliases || [];

  // A guarded one-word brand must not also retain its unsafe bare alias. Full
  // product/module names remain safe and continue to match normally.
  const canonical = catalogue.name.toLowerCase();
  return (catalogue.aliases || []).filter(
    (alias) => alias.toLowerCase() !== canonical || alias.includes(' ')
  );
}

/** Build dictionary entries from the deployment profile plus generic catalogue data. */
export function buildSystemEntries(config = deploymentProfile) {
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
      soleInstance: Boolean(system.soleInstance),
      sharedInstance: Boolean(system.sharedInstance),
      failureFloor: system.failureFloor || null,
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
  if (config !== deploymentProfile) return configured;

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
      soleInstance: false,
      sharedInstance: false,
      failureFloor: null,
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
 * @returns {{ systems: any[], primary: any, criticalSystem: boolean,
 *   soleInstanceSystem: boolean, sharedInstanceSystem: boolean,
 *   failureFloor: (string|null), mentions: any[], evidence: any[] }}
 */
export function detectSystems(doc, config = deploymentProfile) {
  const entries = config === deploymentProfile ? ENTRIES : buildSystemEntries(config);
  const hits = scan(doc, entries, { negate: false });

  const byId = new Map();
  for (const hit of hits) {
    const id = hit.entry.v;
    const mention = {
      id,
      name: hit.entry.name,
      failureFloor: hit.entry.failureFloor,
      start: hit.start,
      end: hit.end,
      quote: hit.quote
    };
    const existing = byId.get(id);
    if (existing) {
      existing.count += 1;
      existing.mentions.push(mention);
      // Prefer the longest alias as the quote ("power bi" over "pbi").
      if (hit.quote.length > existing.quote.length) existing.quote = hit.quote;
    } else {
      byId.set(id, {
        id,
        name: hit.entry.name,
        critical: hit.entry.critical,
        soleInstance: hit.entry.soleInstance,
        sharedInstance: hit.entry.sharedInstance,
        failureFloor: hit.entry.failureFloor,
        entityType: hit.entry.entityType,
        categories: hit.entry.categories || [],
        sourceNames: hit.entry.sourceNames || [],
        url: hit.entry.url,
        typicalLevel: hit.entry.typicalLevel,
        mainUse: hit.entry.mainUse,
        quote: hit.quote,
        count: 1,
        firstIndex: hit.start,
        mentions: [mention]
      });
    }
  }

  const systems = [...byId.values()].sort(
    (a, b) => b.count - a.count || a.firstIndex - b.firstIndex
  );

  const mentions = systems.flatMap((s) => s.mentions);

  return {
    systems,
    primary: systems[0] || null,
    criticalSystem: systems.some((s) => s.critical),
    sharedInstanceSystem: systems.some((s) => s.sharedInstance),
    soleInstanceSystem: systems.some((s) => s.soleInstance),
    // The strongest floor of any *mentioned* system. Callers that need the floor
    // of the system that is actually failing must use failingFloor() instead.
    failureFloor: systems.reduce((floor, s) => {
      if (!s.failureFloor) return floor;
      if (floor === 'P1') return floor;
      return s.failureFloor;
    }, null),
    mentions,
    evidence: systems.map((s) => ({
      quote: s.quote,
      meaning: s.name + ' identified',
      source: 'system'
    }))
  };
}

/**
 * The failure floor of the system *actually failing*, not merely mentioned.
 *
 * System matching deliberately ignores negation, so a benign mention
 * ("Edumate is fine, but Tyro payments are failing") must not lend Edumate's
 * P1 floor to a Tyro failure. For each failure/outage symptom, this finds the
 * floored system mention closest to it and attributes that floor. When no
 * floored system is near a failure, there is no floor.
 *
 * @param {any} systemResult  result of detectSystems()
 * @param {any} symptom       result of detectSymptom()
 * @returns {string|null} the floor of the failing system, or null
 */
export function failingFloor(systemResult, symptom) {
  if (!systemResult || !symptom || !symptom.hasFailure) return null;
  const failing = (symptom.all || []).filter((s) => s.severity >= 2);
  if (!failing.length) return null;

  const floored = (systemResult.mentions || []).filter((m) => m.failureFloor);
  if (!floored.length) return null;

  let best = null;
  let bestDistance = Infinity;
  for (const mention of floored) {
    for (const sym of failing) {
      // Distance between the system mention and the failure wording. Overlap
      // (0) is closest; a distant mention is a weaker attribution.
      const distance = Math.max(0, Math.max(mention.start - sym.index, sym.index - mention.end));
      if (distance < bestDistance || (distance === bestDistance && mention.failureFloor === 'P1')) {
        bestDistance = distance;
        best = mention.failureFloor;
      }
    }
  }
  return best;
}

/** Human-readable list: "Canvas and Edumate". */
export function describeSystems(systems) {
  if (!systems.length) return 'Not identified';
  if (systems.length === 1) return systems[0].name;
  const names = systems.map((s) => s.name);
  return names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
}
