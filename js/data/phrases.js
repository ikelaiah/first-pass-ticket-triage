/**
 * Phrase dictionaries, grouped by facet.
 *
 * Every list is re-exported here so the engine can keep importing from one
 * place; a facet can be split, moved or reordered without touching call sites.
 * Matchers shared by more than one facet live in `./phrases/shared.js`.
 *
 * Entries are usually `{ m: ['phrase', /regex/], ...payload }`, where `m` is the
 * matcher and the rest of the object describes the fact it establishes. Write
 * phrases in lowercase: `normalise()` lowercases, expands contractions and
 * unifies spelling before matching.
 */
export * from './phrases/scope.js';
export * from './phrases/urgency.js';
export * from './phrases/deadline.js';
export * from './phrases/workaround.js';
export * from './phrases/symptoms.js';
export * from './phrases/risks.js';
export * from './phrases/framework.js';
