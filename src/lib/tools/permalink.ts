/**
 * Readable, server-visible permalinks for the designer tools.
 *
 * ── WHAT WAS ALREADY THERE, AND WHY IT WAS NOT THIS ─────────────────────
 *
 * The tools have been shareable for a while, via `#s=<base64url JSON>` —
 * see `lib/shared-tool-state.ts`. That link works, and it was built to be
 * invisible on purpose: a hash is never sent to the server, so it costs no
 * prerender variance and shows up in no log.
 *
 * Which is also exactly why it cannot be the answer here. A fragment is
 * invisible to the server, so the page cannot say in its <title> what the
 * link contains; invisible to a crawler, so the link is not a document; and
 * opaque to a human, so nobody can tell two links apart, edit one by hand,
 * or diff two of them in a pull request. `/builder` had all three
 * properties from its first commit for one reason — its state is in the
 * query string — and the tools did not.
 *
 * So this module is the `?b=` idea applied to the tools: the state travels
 * as named parameters a person can read.
 *
 *     /tools/contrast?fg=0f172a&bg=f8fafc
 *     /tools/gradient?type=conic&angle=90&stops=f43f5e@0,10b981@100
 *     /tools/typography?pair=fraunces-inter&base=18&scale=1.333
 *
 * The `#s=` codec stays, and is still read first-class on the way IN. Links
 * already pasted into other people's channels have to keep working, and the
 * two tools whose state is genuinely not expressible as readable parameters
 * (the code screenshotter holds a pasted document) have nothing better.
 * What changed is what we now hand out.
 *
 * ── WHY ONLY NON-DEFAULT FIELDS ARE WRITTEN ─────────────────────────────
 *
 * `toolQuery` omits every field still at its default, which is what keeps
 * the URLs legible — a contrast pair is two parameters, not eleven. It also
 * buys the property the canonical tag needs: one state has exactly one
 * spelling, and the tool's bare URL and its all-defaults URL are the same
 * string rather than two documents with identical content.
 *
 * Equality is decided on the SERIALIZED values rather than on the values
 * themselves, which is not a shortcut — it is the only comparison that is
 * correct here. Two states that serialize the same ARE the same permalink,
 * whatever their in-memory shape; `0.6250001` and `0.625` are one URL, and
 * an array of stops compares without a deep-equality helper.
 *
 * ── DELIBERATELY FRAMEWORK-FREE ─────────────────────────────────────────
 *
 * No React, no `next/*`, and above all no `lib/site` — that module reads
 * server-only environment variables and says so in its own docblock, and
 * this one is imported by client components. Everything here returns a path
 * or a query string; a caller that needs an origin joins one on, which the
 * server does with `absoluteUrl` and the browser does with
 * `window.location.origin`.
 *
 * It also makes the whole surface testable as pure functions — see
 * `permalink.test.ts`, which is what `compose.test.ts` is for `/builder`.
 */

/**
 * How one field of a tool's state crosses the URL.
 *
 * `fromParam` returns null for anything it cannot read, and every caller
 * treats that as "this field was not in the link" rather than as an error.
 * The input is a URL a stranger can type, so the only acceptable behaviour
 * for garbage is the tool's default — the same posture `parseComposition`
 * takes in `lib/builder/compose.ts`.
 */
export interface Codec<V> {
  toParam(value: V): string
  fromParam(raw: string): V | null
}

/** One state property, and the parameter name it travels under. */
export interface Field<V> {
  param: string
  codec: Codec<V>
}

/**
 * The fields of a tool's state that travel in the URL.
 *
 * Partial on purpose: state that is a working detail rather than part of
 * the design — a row id minted from a counter, a "which tab is open" —
 * has no business in a permalink, and leaving it out of this map is how a
 * tool says so.
 */
export type Fields<T> = { [K in keyof T]?: Field<T[K]> }

/** A curated permalink: one worth linking to and putting in the sitemap. */
export interface GalleryEntry<T> {
  /**
   * Stable slug. Not part of the URL — the parameters are — but it keys the
   * entry for tests and gives the sitemap something to sort on.
   */
  slug: string
  /** Link text. Says what the values ARE, not what they are for. */
  name: string
  /** One line of why someone would open it. */
  note: string
  /** Merged over the tool's defaults, so an entry names only what it changes. */
  state: Partial<T>
}

export interface ToolPermalink<T extends object> {
  /** The tool's route, e.g. `/tools/palette`. */
  href: string
  /** The state a bare visit starts from. */
  defaults: T
  /** Which properties travel, and under what names. Order fixes query order. */
  fields: Fields<T>
  /**
   * The <title> and <meta description> for a state that arrived on the URL.
   *
   * This is the entire point of moving off the hash. A permalink whose title
   * is the tool's generic one is a duplicate document; one that says
   * "#0f172a on #f8fafc — 16.5:1, passes AAA" is an answer to a query
   * somebody actually typed.
   */
  describe(state: T): { title: string; description: string }
  /**
   * Up to six colours standing for this state, for the gallery card.
   *
   * Empty is a legitimate answer — the type-scale tool has no colours in it
   * — and the card falls back to type for those.
   */
  swatches(state: T): string[]
  /** Curated, indexable permalinks. See `TOOL_PERMALINK_GALLERY_NOTE`. */
  gallery: readonly GalleryEntry<T>[]
}

/* ------------------------------------------------------------------ *
   Codecs

   Small enough to be obvious, and shared because the alternative is six
   copies of "parse a number, clamp it, round it" that drift.
 * ------------------------------------------------------------------ */

/**
 * A colour, as six hex digits with no `#`.
 *
 * The hash is dropped rather than escaped because `%23` in a query string
 * is the single ugliest thing that can happen to a URL that is supposed to
 * be readable, and it would appear in every colour parameter on the site.
 * Three-digit shorthand is expanded on the way in so `f00` and `ff0000`
 * are one permalink rather than two.
 */
export const hex: Codec<string> = {
  toParam: (value) => value.replace(/^#/, '').toLowerCase(),
  fromParam: (raw) => {
    const text = raw.replace(/^#/, '').trim().toLowerCase()
    if (/^[0-9a-f]{3}$/.test(text)) {
      return `#${text[0]!}${text[0]!}${text[1]!}${text[1]!}${text[2]!}${text[2]!}`
    }
    return /^[0-9a-f]{6}$/.test(text) ? `#${text}` : null
  },
}

/**
 * A number, clamped to a range and rounded to a fixed number of decimals.
 *
 * Rounding on the way OUT as well as in is what makes the permalink stable:
 * a slider bound to a step of 0.01 still produces 0.30000000000000004, and
 * without this the same visible state would produce a different URL
 * depending on which direction the slider was dragged from.
 *
 * Clamping rather than rejecting, because every one of these values feeds a
 * CSS declaration or a colour conversion, and the honest reading of
 * `?angle=9999` is 360 rather than "no gradient at all".
 */
export function num(min: number, max: number, decimals = 2): Codec<number> {
  const round = (n: number) => {
    const f = 10 ** decimals
    return Math.round(n * f) / f
  }
  const clamp = (n: number) => round(Math.min(max, Math.max(min, n)))
  return {
    // `String(0.5)` is "0.5" and `(0.5).toFixed(2)` is "0.50" — the first is
    // what belongs in a URL somebody is going to read.
    toParam: (value) => String(clamp(value)),
    fromParam: (raw) => {
      const n = Number(raw)
      return Number.isFinite(n) ? clamp(n) : null
    },
  }
}

/** A whole number, clamped. */
export function int(min: number, max: number): Codec<number> {
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n)))
  return {
    toParam: (value) => String(clamp(value)),
    fromParam: (raw) => {
      const n = Number(raw)
      return Number.isFinite(n) ? clamp(n) : null
    },
  }
}

/**
 * One of a fixed set of strings.
 *
 * Unlike the numeric codecs this one rejects rather than clamps: there is no
 * nearest valid value to a `type=squiggle`, and quietly picking `linear`
 * would show the reader a gradient the link did not ask for without saying
 * so.
 */
export function oneOf<V extends string>(values: readonly V[]): Codec<V> {
  return {
    toParam: (value) => value,
    fromParam: (raw) => {
      const text = raw.trim().toLowerCase()
      return values.find((v) => v.toLowerCase() === text) ?? null
    },
  }
}

/** A flag, as `1` / `0`. Also reads `true` / `false`, which people type. */
export const flag: Codec<boolean> = {
  toParam: (value) => (value ? '1' : '0'),
  fromParam: (raw) => {
    const text = raw.trim().toLowerCase()
    if (text === '1' || text === 'true' || text === 'yes') return true
    if (text === '0' || text === 'false' || text === 'no') return false
    return null
  },
}

/**
 * A comma-separated list of items, each encoded by `item`.
 *
 * An item that fails to decode drops out rather than failing the list, and
 * the whole field fails only if fewer than `min` survive. That is the
 * difference between a link that lost one stop and a link that lost its
 * gradient.
 */
export function list<V>(item: Codec<V>, min = 1, max = 32): Codec<V[]> {
  return {
    toParam: (value) => value.slice(0, max).map(item.toParam).join(','),
    fromParam: (raw) => {
      const parts = raw.split(',').map((s) => s.trim()).filter(Boolean).slice(0, max)
      const out: V[] = []
      for (const part of parts) {
        const parsed = item.fromParam(part)
        if (parsed !== null) out.push(parsed)
      }
      return out.length >= min ? out : null
    },
  }
}

/* ------------------------------------------------------------------ *
   Reading and writing
 * ------------------------------------------------------------------ */

/** What Next hands a page as `searchParams`. */
export type SearchParams = Record<string, string | string[] | undefined>

/** A repeated parameter takes its first value, the way `/builder` does. */
function first(raw: string | string[] | undefined): string | undefined {
  return Array.isArray(raw) ? raw[0] : raw
}

export interface ParsedToolState<T> {
  /** Defaults, with every field the URL supplied applied over them. */
  state: T
  /**
   * True when at least one field actually came off the URL.
   *
   * The caller needs this and cannot recover it from `state`: a link that
   * spells out the defaults is indistinguishable from no link by value, and
   * the two mean different things downstream. A real link must outrank this
   * browser's stored state; a bare visit must not.
   */
  fromLink: boolean
  /**
   * Parameters that were present and unreadable, by name.
   *
   * Surfaced rather than swallowed, for the reason `parseComposition`
   * surfaces dropped block ids: a shared link outlives the tool it points
   * at, and telling the reader which control did not survive is the
   * difference between a broken link and a lossy one.
   */
  dropped: string[]
}

/**
 * Read a tool's state out of a query string.
 *
 * Total by construction — every malformed field falls back to that field's
 * default, and a URL of pure garbage produces the same state as a bare
 * visit. This runs during a server render whose input is a URL anyone can
 * type.
 */
export function parseToolState<T extends object>(
  spec: ToolPermalink<T>,
  params: SearchParams,
): ParsedToolState<T> {
  const state = { ...spec.defaults }
  const dropped: string[] = []
  let fromLink = false

  for (const key of Object.keys(spec.fields) as (keyof T)[]) {
    const field = spec.fields[key]
    if (!field) continue
    const raw = first(params[field.param])
    if (raw === undefined || raw === '') continue
    const parsed = field.codec.fromParam(raw)
    if (parsed === null) {
      dropped.push(field.param)
      continue
    }
    state[key] = parsed
    fromLink = true
  }

  return { state, fromLink, dropped }
}

/**
 * Write a tool's state as a query string — fields at their default omitted,
 * no leading `?`, and `''` when nothing differs from the defaults.
 *
 * Values are not percent-encoded, and that is checked rather than assumed:
 * every codec above emits only characters RFC 3986 allows in a query
 * unescaped (hex digits, digits, `.`, `-`, `,`, `@`, and lowercase ASCII
 * from the enums). Running `encodeURIComponent` over them would turn the
 * commas in a stop list into `%2C` and undo the readability this whole
 * module exists for. `assertUrlSafe` below is the guard that keeps that
 * true as tools add fields.
 */
export function toolQuery<T extends object>(spec: ToolPermalink<T>, state: T): string {
  const parts: string[] = []

  for (const key of Object.keys(spec.fields) as (keyof T)[]) {
    const field = spec.fields[key]
    if (!field) continue
    const value = field.codec.toParam(state[key])
    if (value === field.codec.toParam(spec.defaults[key])) continue
    parts.push(`${field.param}=${assertUrlSafe(value, field.param)}`)
  }

  return parts.join('&')
}

/**
 * The characters a permalink value may contain unescaped.
 *
 * `@` and `,` are `sub-delims` and `/` is named explicitly in the grammar
 * for a query component (`query = *( pchar / "/" / "?" )`); the rest are
 * unreserved. Anything outside this set gets percent-encoded rather than
 * being emitted raw, so a tool that adds a free-text field produces an ugly
 * URL instead of a broken one.
 *
 * `/` is here because the shadow tool needs it, and its absence was a real
 * bug rather than a theoretical one: every layer value came out as
 * `0%2F1%2F2%2F0`, which is both unreadable and — since nothing decodes it
 * on the way back in — unparseable. The round-trip test in
 * `permalink.test.ts` is what caught it and is what keeps it caught.
 */
const URL_SAFE = /^[A-Za-z0-9._~@,/-]*$/

function assertUrlSafe(value: string, param: string): string {
  if (URL_SAFE.test(value)) return value
  // Not a throw: a malformed value should degrade the URL, not take down a
  // server render. The parameter name is in the encoded output nowhere, so
  // it is named here only for whoever is reading a stack in development.
  void param
  return encodeURIComponent(value)
}

/** The tool's href carrying `state`, e.g. `/tools/contrast?fg=0f172a`. */
export function toolHref<T extends object>(spec: ToolPermalink<T>, state: T): string {
  const query = toolQuery(spec, state)
  return query ? `${spec.href}?${query}` : spec.href
}

/** A gallery entry's full state — its own fields over the tool's defaults. */
export function galleryState<T extends object>(
  spec: ToolPermalink<T>,
  entry: GalleryEntry<T>,
): T {
  return { ...spec.defaults, ...entry.state }
}

/**
 * The curated entry a state corresponds to, if any.
 *
 * Compared on the query string rather than on the objects, for the same
 * reason `toolQuery` compares serialized values: the question being asked
 * is "is this the same permalink", and the query string is the permalink.
 *
 * This is what decides whether a parameterized URL is self-canonical. See
 * `toolPageMetadata`.
 *
 * The empty query is a legitimate match, and the early return that used to
 * reject it was wrong. A tool's curated set includes its own defaults —
 * that state deserves a card, being the one everybody starts in — and a
 * link that spells the defaults out (`?scheme=analogous`) must resolve to
 * that entry, self-canonicalising to the bare tool URL. Rejecting it sent
 * the most-linked state in the set to the "variant" branch instead.
 *
 * Nothing calls this for a bare visit: `toolPageMetadata` returns before it
 * on `!fromLink`. And the test file holds each tool to at most one
 * default-valued entry, so the match stays unambiguous.
 */
export function matchingGalleryEntry<T extends object>(
  spec: ToolPermalink<T>,
  state: T,
): GalleryEntry<T> | null {
  const query = toolQuery(spec, state)
  return (
    spec.gallery.find((entry) => toolQuery(spec, galleryState(spec, entry)) === query) ?? null
  )
}

/** Every curated permalink for one tool, as site-relative hrefs. */
export function galleryHrefs<T extends object>(spec: ToolPermalink<T>): string[] {
  return spec.gallery.map((entry) => toolHref(spec, galleryState(spec, entry)))
}
