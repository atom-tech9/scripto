/**
 * Deterministic randomness for the handwriting engine.
 *
 * Every jitter value must be a pure function of `(seed, index)` — never
 * `Math.random()`. Three reasons, any one of which is disqualifying:
 *
 *  1. Paged.js re-renders on every pagination. Fresh randomness would mean
 *     different word widths, and therefore different page breaks every time
 *     Print Preview is opened.
 *  2. `preview === PDF` would break: the preview and the export would jitter
 *     differently.
 *  3. The preview would visibly shimmer on every keystroke re-render.
 */

/** mulberry32 — small, fast, and good enough for visual jitter. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** FNV-1a. Turns a document id into a stable numeric seed. */
export function hashSeed(input: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/**
 * The jitter bucket for one word.
 *
 * Buckets exist so variation costs a handful of CSS rules rather than an inline
 * style on every word: a 100-page document would otherwise carry ~50,000 style
 * attributes into the DOM, the export clone and the paginator.
 */
export function bucketFor(seed: number, index: number, buckets: number): number {
  // Mix the index into the seed rather than advancing a shared generator, so a
  // word's bucket never depends on how many words came before it. That keeps
  // editing the top of a document from reshuffling the bottom of it.
  const mixed = mulberry32((seed ^ Math.imul(index + 1, 0x9e3779b1)) >>> 0)
  return Math.floor(mixed() * buckets) % buckets
}
