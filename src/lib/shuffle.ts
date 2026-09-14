/**
 * A shuffle you can link to.
 *
 * `Math.random()` is the obvious way to randomize a grid and it is wrong
 * for this one, for two separate reasons:
 *
 *  1. React re-renders. A sort computed from `Math.random()` inside a
 *     `useMemo` survives until a dependency changes, and then the whole
 *     grid silently rearranges under the reader's cursor — the card they
 *     were about to click is somewhere else. An order has to be a value
 *     that is held, not an effect that is re-run.
 *  2. A randomized grid is the one order nobody else can see. Every other
 *     sort on these hubs is in the URL, so "look at this one" is a link;
 *     an unseeded shuffle would be the single order that cannot be shared,
 *     which is a strange exception for the sort whose entire job is to
 *     surface things nobody has seen.
 *
 * So the seed is the state, the order is a pure function of it, and the
 * seed goes in the query string. Shuffling again means picking a new seed.
 *
 * The generator is mulberry32 — 32 bits of state, four lines, and a period
 * long past anything a catalog of 4,400 items needs. Not cryptographic and
 * not trying to be: the requirement is that the same seed gives the same
 * order in every browser, which `Math.random()` cannot promise even within
 * one.
 */

/** A deterministic [0, 1) generator seeded by a 32-bit integer. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * A copy of `items`, Fisher-Yates shuffled from `seed`.
 *
 * Copies rather than shuffling in place: every caller here is holding an
 * array that belongs to someone else — a server-rendered item list, a
 * filtered catalog — and the other sorts beside it are non-destructive
 * too. A shuffle that mutated would make the order depend on how many
 * times the reader had visited it.
 */
export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const out = items.slice()
  const rand = mulberry32(seed)
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * A fresh seed, in the range the query string round-trips cleanly.
 *
 * Capped at six digits so the URL stays readable — a seed is a number the
 * reader may well see and occasionally type, and 999,999 possible orders
 * of a 250-card grid is not the constraint on how random this feels.
 */
export function newSeed(): number {
  return Math.floor(Math.random() * 1_000_000)
}

/**
 * Read a seed out of a query string, or `null` when there is not a usable
 * one there.
 *
 * Strict on purpose. A malformed `?seed=` is not an occasion to invent a
 * number quietly: the caller mints a new one and writes it back, so the
 * URL that produced a broken order becomes a URL that produces a real one.
 */
export function parseSeed(value: string | null): number | null {
  // Digits and nothing else, rather than `Number()` plus a range check.
  // `Number` trims whitespace before parsing, so `" 12"` is 12 and — the
  // one that actually matters — `" "` is 0: a `?seed=%20` would have
  // produced a real, reproducible shuffle from what is plainly not a seed.
  // It also accepts `0x10`, `1e5` and `Infinity`, none of which should
  // round-trip back out of this into a URL.
  if (!value || !/^\d{1,9}$/.test(value)) return null
  return Number(value)
}

/**
 * A 32-bit seed derived from a string, for orders that are *per-item* stable
 * rather than per-visit random.
 *
 * The variations rail is the caller: every effect shows seven of them, drawn
 * from a pool, and the seven have to be the same seven on every request and
 * in every browser — these pages are statically generated and then cached,
 * so a selection that moved between the build and a rehydration would be a
 * hydration mismatch on 1,047 pages. Seeding from the effect's own id gets
 * that for free, and gets a *different* seven per effect, which is the
 * actual product requirement.
 *
 * FNV-1a: not a hash function anyone should authenticate with, and not
 * trying to be. The requirement is spread and determinism across engines,
 * and `Math.imul` keeps the multiply in 32 bits so V8 and JSC agree.
 */
export function seedFromString(value: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  // `>>> 0` because mulberry32 wants an unsigned 32-bit integer and the
  // multiply above routinely lands on a negative one.
  return h >>> 0
}
