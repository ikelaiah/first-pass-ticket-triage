/**
 * Driver detection — U6: what creates the deadline and who/what set it.
 * Distinguishes statutory / operational / preference and captures the actor.
 */
import { scanPositive } from './negation.js';
import { DRIVER_PHRASES, DRIVER_ACTOR_RE } from '../data/phrases.js';

export function detectDriver(doc) {
  for (const entry of DRIVER_PHRASES) {
    const hit = scanPositive(doc, [entry]);
    if (hit.length) {
      const actorMatch = doc.text.match(DRIVER_ACTOR_RE);
      return {
        driver: entry.driver,
        label: entry.label,
        quote: hit[0].quote,
        actor: actorMatch ? actorMatch[0].trim() : null,
        // statutory/operational with timing are commitments; preference is not
        committed: entry.driver !== 'preference'
      };
    }
  }
  // Also try to capture actor even without driver phrase
  const actorMatch = doc.text.match(DRIVER_ACTOR_RE);
  if (actorMatch) {
    return { driver: 'unknown', label: 'deadline actor mentioned', quote: actorMatch[0].trim(), actor: actorMatch[0].trim(), committed: false };
  }
  return { driver: 'unknown', label: null, quote: null, actor: null, committed: false };
}
