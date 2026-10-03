/**
 * Manual refinement overrides.
 *
 * Only values the analyst actually changed are accepted, so re-analysing a
 * ticket never silently promotes a detected value to a confirmed one. Unknown
 * or invalid values are dropped rather than coerced.
 */
const LEVEL_VALUES = ['low', 'medium', 'high'];

/** @returns {Record<string, any>} the clean subset of overrides to apply */
export function normaliseOverrides(overrides = {}) {
  const clean = {};
  const take = (key, allowed) => {
    const value = overrides[key];
    if (value === undefined || value === null || value === '' || value === 'auto') return;
    if (allowed && !allowed.includes(value)) return;
    clean[key] = value;
  };
  take('scope');
  take('workaround', ['yes', 'partial', 'no', 'unknown']);
  take('deadline');
  take('contained', ['contained', 'spreading', 'unknown']);
  take('driver', ['statutory', 'operational', 'preference', 'none']);
  take('harm', ['active', 'pending', 'unknown']);
  take('consequence', ['impaired', 'blocked', 'unknown']);
  take('impact', LEVEL_VALUES);
  take('urgency', LEVEL_VALUES);
  if (overrides.risks && typeof overrides.risks === 'object') {
    const risks = {};
    for (const [key, value] of Object.entries(overrides.risks)) {
      if (typeof value === 'boolean') risks[key] = value;
    }
    if (Object.keys(risks).length) clean.risks = risks;
  }
  return clean;
}

export default normaliseOverrides;
