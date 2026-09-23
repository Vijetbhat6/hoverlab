/**
 * The catalog's one search engine.
 *
 * ── WHY THIS EXISTS ─────────────────────────────────────────────────────
 *
 * Search here used to be three different things that disagreed with each
 * other. `/library` matched a lowercased substring against five fields,
 * `/browse` ranked substrings by which field they landed in, and the command
 * palette ran a subsequence matcher that finds "btgr" in "Button Gradient"
 * and "ocean" in "Cascading Cool Neon" for the same reason: it only asks
 * whether the letters appear in order. None of them survives a typo. "buton"
 * finds nothing on either page, and nothing on either page says that the
 * problem was the spelling rather than the catalog.
 *
 * This is the replacement: tokenised, prefix-aware, typo-tolerant and
 * weighted by field, with a short curated synonym table. It is pure — no
 * DOM, no React, no network — so the same function ranks a keystroke in the
 * palette, a query string on /browse and the candidate pool the AI route
 * sends to a model.
 *
 * ── HOW A QUERY IS MATCHED ──────────────────────────────────────────────
 *
 * The index is inverted: every distinct word in the catalog maps to the
 * documents that contain it and the weight of the best field it appeared in.
 * A query word is resolved against that vocabulary, not against every
 * document, so cost tracks vocabulary size (a few thousand words) and not
 * catalog size. That is what keeps a fuzzy match affordable on ~1,100
 * effects on every keystroke.
 *
 * A query word resolves, in order of preference, to:
 *
 *   1. the exact word                              quality 1.0
 *   2. words it is a prefix of ("butt" → "button")  quality 0.8
 *   3. words within a bounded edit distance         quality 0.65 / 0.5
 *
 * and stops at the first rung that finds anything. That ordering is the
 * whole false-positive story. "card" is one substitution from "cart", and a
 * search that offered carts to someone who typed "card" would be worse than
 * one with no fuzzy matching at all — so a word that exists in the catalog
 * is never "corrected". Edits are only tried for a word nothing else
 * explains, which is exactly the typo case.
 *
 * The edit budget is deliberately stingy: 0 edits below four characters, 1
 * for four to seven, 2 from eight up. Short words are where a single edit
 * turns one real word into another ("tab"/"tag", "nav"/"nap"), and a match
 * on the first letter is required before any edit is considered, because a
 * typo almost never lands on the first character and requiring it removes
 * most accidental neighbours ("host" for "ghost").
 *
 * ── SCORING ─────────────────────────────────────────────────────────────
 *
 * Per query word, per document: the best (field weight × match quality ×
 * rarity) across the document's words. Best, not sum — summing lets a
 * description that repeats a word outrank a name that says it once, which is
 * the mistake the previous `/browse` scorer already documented refusing.
 * Then summed across the query's words, so a document matching more of what
 * was typed ranks higher. Whole-name matches get a bonus on top, and the
 * caller supplies a small `boost` per document (featured, tier).
 *
 * Rarity is a mild inverse-document-frequency factor. The catalog has 488
 * effects tagged "ocean" and 26 tagged "glow"; without it a query for
 * "ocean glow" ranks by the word that says the least.
 *
 * Two modes. `all` (every query word must match — the right default for a
 * search box, and what makes a second word narrow the results) and `any`
 * (a document needs only one, ranked by how many — what the AI route wants,
 * where the goal is a pool of plausible candidates for a model to sort, not
 * a precise answer).
 */

/* ------------------------------------------------------------------ *
 *  Documents and options
 * ------------------------------------------------------------------ */

/** The fields every searchable thing carries, whatever tier it is. */
export interface SearchDoc {
  id: string
  name: string
  category: string
  description: string
  tags: readonly string[]
  /**
   * Added to the score after matching, for tie-breaking between documents
   * that match equally well — featured, or a higher tier. Kept small on
   * purpose: a boost that outweighs a field weight stops being a tiebreak
   * and starts overriding relevance.
   */
  boost?: number
}

export interface SearchOptions<T extends SearchDoc> {
  /** `all` (default): every word must match. `any`: one is enough. */
  mode?: 'all' | 'any'
  /** Stop after this many hits. Absent means every match. */
  limit?: number
  /** Expand words through the curated synonym table. Default true. */
  synonyms?: boolean
  /** Applied to matches, before `limit`. */
  filter?: (doc: T) => boolean
}

export interface SearchHit<T extends SearchDoc> {
  doc: T
  /** Position of `doc` in the array the index was built from. */
  index: number
  score: number
}

/* ------------------------------------------------------------------ *
 *  Tokenising
 * ------------------------------------------------------------------ */

/**
 * Field weights. Name over tags and category over description, per the
 * brief and per how a catalog is actually searched: a word in the name is
 * the thing itself, a word in the description is something it mentions.
 *
 * `id` sits between category and description. Ids are mostly the name
 * again, so they add little — but for the effects whose name is a
 * paraphrase of the id, and for a person who pastes an id, they are the
 * only field that matches.
 */
const FIELD_WEIGHT = {
  name: 10,
  tag: 6,
  category: 6,
  id: 4,
  description: 2,
} as const

/** Quality multipliers by how a query word reached a vocabulary word. */
const QUALITY = {
  exact: 1,
  prefix: 0.8,
  edit1: 0.65,
  edit2: 0.5,
  synonym: 0.6,
} as const

/**
 * Words a natural-language query is padded with and a catalog is not.
 * Dropped from queries only, never from the index. Small on purpose:
 * removing "like" or "make" from a query about a hover effect that feels
 * like something is a judgement, and a short list keeps the judgement
 * inspectable.
 */
const STOPWORDS = new Set([
  'a', 'an', 'the', 'of', 'for', 'with', 'and', 'or', 'to', 'in', 'on', 'at',
  'that', 'this', 'my', 'me', 'i', 'it', 'is', 'are', 'be', 'some', 'something',
  'want', 'need', 'show', 'give', 'make', 'looking', 'find',
])

/** Lowercase, and everything that is not a letter or digit becomes a gap. */
export function tokenize(text: string): string[] {
  const out: string[] = []
  const lower = text.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
  for (const t of lower.split(/[^a-z0-9]+/)) if (t) out.push(t)
  return out
}

/**
 * Collapse a plural onto its singular.
 *
 * Only the regular cases. "glass", "focus", "radius" and "analysis" all end
 * in s and none of them is a plural, so `ss`, `us` and `is` endings are left
 * alone; irregular plurals and -es endings are not attempted, because a rule
 * that is wrong one time in ten is worse than the typo tolerance that
 * already catches "boxe".
 */
export function stem(token: string): string {
  if (token.length > 4 && token.endsWith('ies')) return `${token.slice(0, -3)}y`
  if (
    token.length > 3 &&
    token.endsWith('s') &&
    !token.endsWith('ss') &&
    !token.endsWith('us') &&
    !token.endsWith('is')
  ) {
    return token.slice(0, -1)
  }
  return token
}

/* ------------------------------------------------------------------ *
 *  Edit distance
 * ------------------------------------------------------------------ */

/** How many edits a word of this length may be from a match. */
export function maxEditsFor(length: number): 0 | 1 | 2 {
  if (length >= 8) return 2
  if (length >= 4) return 1
  return 0
}

/**
 * Damerau-Levenshtein distance (optimal string alignment: insert, delete,
 * substitute, and swap two neighbours, each costing one), abandoned as soon
 * as it cannot come in under `max`.
 *
 * Returns `max + 1` for "too far", never the true distance, because the
 * caller only asks whether a word is close enough — and stopping early is
 * what makes it affordable to ask about every word in the vocabulary.
 */
export function editDistance(a: string, b: string, max: number): number {
  if (a === b) return 0
  const la = a.length
  const lb = b.length
  if (Math.abs(la - lb) > max) return max + 1
  if (la === 0 || lb === 0) return Math.max(la, lb) > max ? max + 1 : Math.max(la, lb)

  let prev2: number[] = new Array<number>(lb + 1).fill(0)
  let prev: number[] = Array.from({ length: lb + 1 }, (_, j) => j)

  for (let i = 1; i <= la; i++) {
    const cur: number[] = new Array<number>(lb + 1)
    cur[0] = i
    let rowMin = i
    for (let j = 1; j <= lb; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1
      let v = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + cost)
      if (
        i > 1 &&
        j > 1 &&
        a.charCodeAt(i - 1) === b.charCodeAt(j - 2) &&
        a.charCodeAt(i - 2) === b.charCodeAt(j - 1)
      ) {
        v = Math.min(v, prev2[j - 2]! + 1)
      }
      cur[j] = v
      if (v < rowMin) rowMin = v
    }
    if (rowMin > max) return max + 1
    prev2 = prev
    prev = cur
  }
  const d = prev[lb]!
  return d > max ? max + 1 : d
}

/* ------------------------------------------------------------------ *
 *  Synonyms
 * ------------------------------------------------------------------ */

/**
 * Curated equivalences, and nothing else.
 *
 * Each row is a set of words a person might use for the same thing. A member
 * with a space is a phrase: a document must contain every word of it. The
 * bar for a row is "would I be surprised to be shown the other word's
 * results", and it is deliberately high — a synonym that is only usually
 * right puts the wrong thing above the right one, quietly, in a place
 * nobody looks. Things that are related but not the same ("hero" and
 * "banner", "card" and "tile", "dropdown" and "select", "input" and "field")
 * are not here.
 *
 * `call action` is written without the "to" on purpose: the phrase is
 * matched as words, and "to" is a stopword on the query side.
 */
const SYNONYM_GROUPS: readonly (readonly string[])[] = [
  ['btn', 'button'],
  ['nav', 'navbar', 'navigation'],
  ['cta', 'call action'],
  ['modal', 'dialog', 'popup'],
  ['toggle', 'switch'],
  ['loader', 'spinner', 'loading', 'skeleton', 'shimmer'],
  ['glass', 'glassmorphism', 'frosted'],
  ['neon', 'glow'],
  ['toast', 'snackbar'],
  ['accordion', 'collapsible', 'collapse'],
  ['carousel', 'slider', 'slideshow'],
  ['login', 'signin', 'sign in'],
  ['signup', 'register', 'sign up'],
  ['textarea', 'text area'],
]

/** Every alternative for a word, each as the list of words it needs. */
const SYNONYM_MAP: ReadonlyMap<string, readonly (readonly string[])[]> = (() => {
  const map = new Map<string, (readonly string[])[]>()
  for (const group of SYNONYM_GROUPS) {
    for (const member of group) {
      // Only a single-word member is a lookup key. A phrase is reached from
      // the other members, and matching "sign in" typed as two words would
      // mean a two-word query silently becoming a synonym lookup.
      if (member.includes(' ')) continue
      const key = stem(member)
      const alts = map.get(key) ?? []
      for (const other of group) {
        if (other === member) continue
        const words = tokenize(other).map(stem)
        if (words.length > 0) alts.push(words)
      }
      map.set(key, alts)
    }
  }
  return map
})()

/** The alternatives the table holds for a word, for tests and for callers. */
export function synonymsFor(word: string): string[] {
  const alts = SYNONYM_MAP.get(stem(word.toLowerCase())) ?? []
  return alts.map((a) => a.join(' '))
}

/* ------------------------------------------------------------------ *
 *  The index
 * ------------------------------------------------------------------ */

interface Posting {
  docs: number[]
  weights: number[]
}

export interface SearchIndex<T extends SearchDoc> {
  readonly docs: readonly T[]
  /** word → the documents containing it, with the best field weight each. */
  readonly terms: ReadonlyMap<string, Posting>
  /** Every distinct word, for prefix and edit scans. */
  readonly vocab: readonly string[]
  /** Whole names, normalised, for the exact-name bonus. */
  readonly names: readonly string[]
  /** Memo of word → matching vocabulary, keyed by word and prefix flag. */
  readonly resolved: Map<string, readonly TermMatch[]>
}

interface TermMatch {
  term: string
  quality: number
}

/**
 * Build the index. O(total words); a few milliseconds for the ~1,100
 * effects, and done once — callers keep the result.
 */
export function createSearchIndex<T extends SearchDoc>(docs: readonly T[]): SearchIndex<T> {
  const building = new Map<string, Posting>()
  const names: string[] = []

  docs.forEach((doc, i) => {
    const best = new Map<string, number>()
    const add = (text: string, weight: number, skipNumbers = false) => {
      for (const raw of tokenize(text)) {
        if (skipNumbers && /^\d+$/.test(raw)) continue
        const term = stem(raw)
        if (best.get(term) === undefined || best.get(term)! < weight) best.set(term, weight)
      }
    }
    add(doc.name, FIELD_WEIGHT.name)
    for (const tag of doc.tags) add(tag, FIELD_WEIGHT.tag)
    add(doc.category, FIELD_WEIGHT.category)
    // The trailing four-digit counter on generated ids ("…-button-0040")
    // is not a word anybody searches for.
    add(doc.id, FIELD_WEIGHT.id, true)
    add(doc.description, FIELD_WEIGHT.description)

    for (const [term, weight] of best) {
      let p = building.get(term)
      if (!p) {
        p = { docs: [], weights: [] }
        building.set(term, p)
      }
      p.docs.push(i)
      p.weights.push(weight)
    }
    names.push(tokenize(doc.name).join(' '))
  })

  return {
    docs,
    terms: building,
    vocab: [...building.keys()],
    names,
    resolved: new Map(),
  }
}

/* ------------------------------------------------------------------ *
 *  Resolving a query word
 * ------------------------------------------------------------------ */

function resolveTerm<T extends SearchDoc>(
  index: SearchIndex<T>,
  word: string,
  allowPrefix: boolean,
): readonly TermMatch[] {
  const key = `${allowPrefix ? 'p' : 'x'}:${word}`
  const cached = index.resolved.get(key)
  if (cached) return cached

  let out: TermMatch[] = []
  if (index.terms.has(word)) out = [{ term: word, quality: QUALITY.exact }]

  if (allowPrefix) {
    for (const term of index.vocab) {
      if (term !== word && term.startsWith(word)) out.push({ term, quality: QUALITY.prefix })
    }
  }

  // Edits only for a word nothing else explains. See the file header.
  if (out.length === 0) {
    const budget = maxEditsFor(word.length)
    if (budget > 0) {
      for (const term of index.vocab) {
        if (term.charCodeAt(0) !== word.charCodeAt(0)) continue
        const d = editDistance(word, term, budget)
        if (d <= budget) out.push({ term, quality: d === 1 ? QUALITY.edit1 : QUALITY.edit2 })
      }
    }
  }

  index.resolved.set(key, out)
  return out
}

/** Rarity factor in (0.4, 1]: commoner words say less. */
function rarity(total: number, df: number): number {
  const idf = Math.log(1 + total / df) / Math.log(1 + total)
  return 0.4 + 0.6 * idf
}

/** Score every document a single word reaches, keeping the best per document. */
function scoreWord<T extends SearchDoc>(
  index: SearchIndex<T>,
  word: string,
  allowPrefix: boolean,
): Map<number, number> {
  const out = new Map<number, number>()
  for (const { term, quality } of resolveTerm(index, word, allowPrefix)) {
    const posting = index.terms.get(term)!
    const factor = quality * rarity(index.docs.length, posting.docs.length)
    for (let k = 0; k < posting.docs.length; k++) {
      const s = posting.weights[k]! * factor
      const d = posting.docs[k]!
      if (s > (out.get(d) ?? 0)) out.set(d, s)
    }
  }
  return out
}

/** A phrase alternative: every word must reach the document. */
function scorePhrase<T extends SearchDoc>(
  index: SearchIndex<T>,
  words: readonly string[],
): Map<number, number> {
  let acc: Map<number, number> | null = null
  for (const w of words) {
    const m = scoreWord(index, w, false)
    if (acc === null) {
      acc = m
      continue
    }
    const next = new Map<number, number>()
    for (const [d, s] of acc) {
      const t = m.get(d)
      if (t !== undefined) next.set(d, Math.min(s, t))
    }
    acc = next
    if (acc.size === 0) break
  }
  return acc ?? new Map()
}

/* ------------------------------------------------------------------ *
 *  Search
 * ------------------------------------------------------------------ */

interface QueryWord {
  word: string
  allowPrefix: boolean
}

/**
 * Split a query into the words that will be matched.
 *
 * The last word is a prefix ("butt" while someone is still typing "button");
 * earlier words only when they are three characters or more. A word that
 * stemming changed is never a prefix, so "tabs" means the plural of "tab"
 * and not "tab…", which would be "table" and "tablet".
 */
export function parseQuery(query: string): { words: QueryWord[]; normalized: string } {
  const raw = tokenize(query)
  const normalized = raw.join(' ')
  const kept = raw.filter((t) => !STOPWORDS.has(t))
  // A query made only of stopwords ("the") is still a query.
  const source = kept.length > 0 ? kept : raw
  const words = source.map((token, i) => {
    const stemmed = stem(token)
    const isLast = i === source.length - 1
    const allowPrefix = stemmed === token && (token.length >= 3 || (isLast && token.length >= 2))
    return { word: stemmed, allowPrefix }
  })
  return { words, normalized }
}

/**
 * Rank the documents in `index` against `query`.
 *
 * Returns `[]` for an empty query — what "no query" should show is the
 * caller's decision (the palette shows actions, /library shows everything),
 * and an engine that guessed would be wrong for one of them.
 */
export function search<T extends SearchDoc>(
  index: SearchIndex<T>,
  query: string,
  options: SearchOptions<T> = {},
): SearchHit<T>[] {
  const { words, normalized } = parseQuery(query)
  if (words.length === 0) return []

  const mode = options.mode ?? 'all'
  const useSynonyms = options.synonyms !== false

  let acc: Map<number, number> | null = null
  for (const { word, allowPrefix } of words) {
    const wordScores = scoreWord(index, word, allowPrefix)

    if (useSynonyms) {
      for (const alt of SYNONYM_MAP.get(word) ?? []) {
        const altScores = alt.length === 1 ? scoreWord(index, alt[0]!, false) : scorePhrase(index, alt)
        for (const [d, s] of altScores) {
          const v = s * QUALITY.synonym
          if (v > (wordScores.get(d) ?? 0)) wordScores.set(d, v)
        }
      }
    }

    if (acc === null) {
      acc = wordScores
    } else if (mode === 'all') {
      const next = new Map<number, number>()
      for (const [d, s] of acc) {
        const t = wordScores.get(d)
        if (t !== undefined) next.set(d, s + t)
      }
      acc = next
    } else {
      for (const [d, s] of wordScores) acc.set(d, (acc.get(d) ?? 0) + s)
    }
    if (mode === 'all' && acc.size === 0) return []
  }
  if (!acc || acc.size === 0) return []

  const hits: SearchHit<T>[] = []
  for (const [i, base] of acc) {
    const doc = index.docs[i]!
    if (options.filter && !options.filter(doc)) continue
    let score = base + (doc.boost ?? 0)
    const name = index.names[i]!
    if (normalized.length >= 2) {
      if (name === normalized) score += 100
      else if (name.startsWith(`${normalized} `) || name.startsWith(normalized)) score += 30
      else if (name.includes(normalized)) score += 15
    }
    hits.push({ doc, index: i, score })
  }

  hits.sort((a, b) => b.score - a.score || a.index - b.index)
  return options.limit !== undefined ? hits.slice(0, options.limit) : hits
}

/* ------------------------------------------------------------------ *
 *  Highlighting
 * ------------------------------------------------------------------ */

/**
 * Character positions in `text` that the query matched, for a highlighted
 * label.
 *
 * Word-level rather than letter-level: it marks the leading part of each
 * word a query word is a prefix of (or the singular of), which is what a
 * reader sees the search do. The old palette lit up scattered letters —
 * every "b", "u", "t" of "button" in whatever order — which reads as noise
 * and is wrong for a search that no longer works that way.
 */
export function matchedIndices(text: string, query: string): number[] {
  const { words } = parseQuery(query)
  if (words.length === 0) return []
  const out: number[] = []
  const lower = text.toLowerCase()
  const re = /[a-z0-9]+/g
  let m: RegExpExecArray | null
  while ((m = re.exec(lower)) !== null) {
    const word = m[0]
    const stemmed = stem(word)
    let len = 0
    for (const q of words) {
      if (stemmed === q.word) len = Math.max(len, word.length)
      else if (q.allowPrefix && word.startsWith(q.word)) len = Math.max(len, q.word.length)
    }
    for (let k = 0; k < len; k++) out.push(m.index + k)
  }
  return out
}
