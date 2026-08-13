/**
 * Design-to-catalog matching — the logic behind the `match_design` MCP tool.
 *
 * The public search endpoints require every query token to match, which is
 * the right contract for "teal glow button" and exactly the wrong one for a
 * design handed over from Figma. A frame description reads like "pricing
 * section, three plan cards side by side, middle card highlighted" — no
 * catalog entry matches all nine words, so the strict search returns
 * nothing and the agent gives up or guesses.
 *
 * So this module fetches catalog *metadata* (small — names, tags,
 * descriptions; never source) and ranks locally with two relaxations:
 *
 *  1. OR-scoring with a coverage penalty. Tokens that match add up; tokens
 *     that don't merely dilute. "three plan cards side by side" still finds
 *     Pricing even though "side" matches nothing.
 *  2. A designer→catalog vocabulary map. Designs are described in the
 *     designer's words ("navbar", "modal", "plan cards"); the catalog is
 *     tagged in the developer's ("navigation", "dialog", "pricing"). The
 *     map lives here, in one place, rather than being smeared across a
 *     hundred blocks' tag lists.
 *
 * Kept separate from mcp.mjs so the ranking is testable without a protocol
 * loop, and dependency-free like everything else in this package.
 */

import { searchLevel } from './api.mjs'

/**
 * Words that carry no signal about *which* artifact is meant. Includes the
 * connective tissue of layout descriptions ("side by side", "at the top") —
 * position words say where a region sits in the frame, not what it is.
 */
const STOPWORDS = new Set([
  'a', 'an', 'the', 'this', 'that', 'these', 'those', 'it', 'its',
  'and', 'or', 'of', 'in', 'on', 'at', 'to', 'for', 'from', 'as', 'by',
  'is', 'are', 'was', 'has', 'have', 'be', 'been',
  'with', 'without', 'within', 'into', 'over', 'under', 'per', 'each',
  'one', 'two', 'three', 'four', 'five', 'six', 'some', 'few', 'several',
  'side', 'left', 'right', 'top', 'bottom', 'middle', 'center', 'centre',
  'above', 'below', 'beside', 'between', 'across', 'inside', 'around',
  'section', 'area', 'region', 'part', 'frame', 'screen', 'design', 'ui',
  'layout', 'component', 'element', 'container', 'wrapper', 'group',
  'big', 'small', 'large', 'wide', 'tall', 'main', 'primary',
  'highlighted', 'shown', 'visible', 'containing', 'showing',
])

/**
 * Designer vocabulary → catalog vocabulary.
 *
 * Each entry maps a token someone would use describing a mockup to the
 * words the catalog actually uses in names, tags and categories. The
 * original token is always tried too, so a mapping can only widen a match,
 * never lose one. Variants are tried as alternatives and the best one
 * counts — they are synonyms, not additional requirements.
 *
 * Deliberately modest: only mappings where the designer word and the
 * catalog word genuinely diverge. "footer" already matches "Footers" by
 * substring; it does not need an entry.
 */
const SYNONYMS = {
  navbar: ['navigation', 'nav', 'header'],
  menubar: ['navigation', 'nav'],
  menu: ['navigation', 'nav', 'drawer'],
  hamburger: ['navigation', 'drawer', 'mobile'],
  masthead: ['hero'],
  banner: ['hero', 'announcement'],
  jumbotron: ['hero'],
  plan: ['pricing', 'tier'],
  plans: ['pricing', 'tiers'],
  price: ['pricing'],
  prices: ['pricing'],
  quote: ['testimonial'],
  quotes: ['testimonials'],
  review: ['testimonial', 'reviews'],
  accordion: ['faq', 'collapsible'],
  logos: ['logo', 'cloud'],
  brands: ['logo', 'cloud'],
  partners: ['logo', 'cloud'],
  modal: ['dialog', 'drawer', 'overlay'],
  popup: ['dialog', 'modal', 'overlay'],
  dialog: ['modal', 'drawer'],
  signin: ['login', 'auth', 'authentication'],
  login: ['auth', 'authentication', 'sign'],
  signup: ['register', 'auth', 'authentication'],
  register: ['signup', 'auth'],
  password: ['auth', 'authentication'],
  otp: ['two-factor', 'code', 'auth'],
  avatar: ['user', 'profile', 'account'],
  avatars: ['user', 'profile', 'testimonials'],
  graph: ['chart', 'metrics'],
  graphs: ['charts', 'metrics'],
  kpi: ['stats', 'metrics'],
  kpis: ['stats', 'metrics'],
  numbers: ['stats', 'metrics'],
  spreadsheet: ['table', 'data'],
  rows: ['table', 'list'],
  columns: ['table', 'pricing'],
  toggle: ['switch', 'tabs'],
  stepper: ['steps', 'onboarding', 'wizard'],
  wizard: ['steps', 'onboarding'],
  toast: ['notification', 'alert'],
  toasts: ['notifications', 'alerts'],
  spotlight: ['command', 'search', 'palette'],
  omnibar: ['command', 'search', 'palette'],
  dropzone: ['upload', 'file'],
  basket: ['cart'],
  bag: ['cart'],
  payment: ['checkout', 'billing'],
  pay: ['checkout', 'billing'],
  conversation: ['chat', 'thread', 'messages'],
  chatbot: ['chat', 'agent', 'assistant'],
  assistant: ['agent', 'chat', 'ai'],
  copilot: ['agent', 'ai', 'inline'],
  reasoning: ['thinking', 'agent', 'trace'],
  gallery: ['grid', 'listings', 'products'],
  storefront: ['products', 'listings', 'commerce'],
  breadcrumbs: ['navigation'],
  '404': ['error', 'empty'],
  placeholder: ['empty', 'skeleton'],
  wysiwyg: ['editor', 'content'],
}

/**
 * Weights mirror `scoreToken` on the site's API, so that where the strict
 * search and this matcher overlap they agree on what a good match is. The
 * one addition is `nameWord` — a whole-word hit in the name — because with
 * OR-scoring a bare substring match ("in" inside "pricing") must not be
 * worth as much as a real word.
 */
function scoreVariant(candidate, token) {
  if (candidate.id === token) return 1000
  let score = 0
  if (candidate.id.includes(token)) score += 40
  if (candidate.name === token) score += 80
  else if (candidate.nameWords.includes(token)) score += 50
  else if (candidate.name.includes(token)) score += 20
  if (candidate.tags.includes(token)) score += 25
  else if (candidate.tags.some((t) => t.includes(token))) score += 12
  if (candidate.category.includes(token)) score += 15
  if (candidate.description.includes(token)) score += 8
  return score
}

/** Lowercase, strip punctuation, split, drop noise, dedupe. */
export function tokenize(text) {
  const seen = new Set()
  const out = []
  for (const raw of String(text ?? '').toLowerCase().split(/[^a-z0-9-]+/)) {
    const word = raw.replace(/^-+|-+$/g, '')
    if (word.length < 2 && !/^\d/.test(word)) continue
    if (STOPWORDS.has(word)) continue
    if (seen.has(word)) continue
    seen.add(word)
    out.push(word)
  }
  return out
}

/** A token plus its synonym variants — one "concept" to be matched. */
function toGroup(token, weight) {
  const variants = [token]
  for (const alt of SYNONYMS[token] ?? []) {
    if (!variants.includes(alt)) variants.push(alt)
  }
  // "cards" should also try "card" — the catalog tags in the singular.
  if (token.endsWith('s') && token.length > 3 && !variants.includes(token.slice(0, -1))) {
    variants.push(token.slice(0, -1))
  }
  return { token, variants, weight }
}

/**
 * Build the concept groups for one match request. Element entries outrank
 * description words: "a toggle" in the elements list is a deliberate
 * observation, the same word inside a rambling description may not be.
 */
export function buildGroups({ description, elements = [] }) {
  const groups = []
  const claimed = new Set()

  for (const element of elements) {
    for (const token of tokenize(element)) {
      if (claimed.has(token)) continue
      claimed.add(token)
      groups.push(toGroup(token, 1.5))
    }
  }
  for (const token of tokenize(description)) {
    if (claimed.has(token)) continue
    claimed.add(token)
    groups.push(toGroup(token, 1))
  }
  return groups
}

/**
 * Rank catalog summaries against concept groups.
 *
 * Score = (sum of each group's best variant score × its weight) × coverage,
 * where coverage is the fraction of groups that matched at all. The
 * multiplication is the whole design: an artifact matching three of eight
 * concepts strongly still surfaces, but one matching eight of eight ranks
 * above it even if each hit is weaker — being *about* the design beats
 * accidentally containing one of its words.
 */
export function rankCandidates(artifacts, groups, { limit = 8, preferLevel } = {}) {
  if (!groups.length) return []

  const ranked = []
  for (const artifact of artifacts) {
    const candidate = {
      id: (artifact.id ?? '').toLowerCase(),
      name: (artifact.name ?? '').toLowerCase(),
      nameWords: (artifact.name ?? '').toLowerCase().split(/[^a-z0-9]+/),
      category: (artifact.category ?? '').toLowerCase(),
      description: (artifact.description ?? '').toLowerCase(),
      tags: (artifact.tags ?? []).map((t) => t.toLowerCase()),
    }

    let sum = 0
    const matched = []
    for (const group of groups) {
      let best = 0
      for (const variant of group.variants) {
        const s = scoreVariant(candidate, variant)
        if (s > best) best = s
      }
      if (best > 0) {
        sum += best * group.weight
        matched.push(group.token)
      }
    }

    if (!matched.length) continue
    const coverage = matched.length / groups.length
    let score = sum * coverage
    // The describer named the tier ("pricing screen", "checkout page").
    // Doubling means the named tier wins any contest closer than 2:1 while
    // a barely-matching page still loses to a dead-on block.
    if (preferLevel && artifact.level === preferLevel) score *= 2
    if (artifact.featured) score += 5
    ranked.push({ artifact, score, matched, coverage })
  }

  ranked.sort((a, b) => b.score - a.score)
  return ranked.slice(0, limit)
}

/** Levels a static design can depict. Effects are motion — invisible in a mockup. */
export const DESIGN_LEVELS = ['block', 'page']

/**
 * Did the describer say which tier they meant? "pricing screen" and
 * "checkout page" name a whole composed screen; the words are dropped as
 * concepts ("screen" is a stopword, "page" matches page ids anyway) but
 * kept as a ranking preference. Only page-tier hints exist: nobody calls a
 * mockup region a "block", and the section words people do use ("panel",
 * "card") are too ambiguous to act on.
 */
function detectLevelHint(description) {
  return /\bscreens?\b|\bpages?\b/i.test(String(description ?? '')) ? 'page' : undefined
}

/**
 * Fetch every summary at one level. The list endpoints page at 100; the
 * catalog is a few hundred entries at most, so a short loop with a hard
 * stop covers it without trusting `total` from a hostile origin.
 */
async function fetchAllAtLevel(level) {
  const items = []
  for (let offset = 0; offset < 1000; offset += 100) {
    const page = await searchLevel({ level, limit: 100, offset })
    items.push(...page.items)
    if (items.length >= page.total || page.items.length === 0) break
  }
  return items
}

/**
 * Match a described design region against the catalog.
 *
 * Returns `{ groups, results }` where each result carries the summary, the
 * concepts it matched, and its coverage — the caller renders that into
 * text, because *why* something matched is what lets a model decide
 * between the top three.
 */
export async function matchDesign({ description, elements = [], level, limit = 8 }) {
  if (!description || !String(description).trim()) {
    throw new Error('Describe the design region — what it is and what is in it.')
  }
  if (level && !DESIGN_LEVELS.includes(level)) {
    throw new Error(`Unknown level "${level}". Designs match blocks or pages; effects are motion and are not visible in a static design.`)
  }

  const groups = buildGroups({ description, elements })
  if (!groups.length) {
    throw new Error('The description contained no usable words. Say what the region is: "pricing cards", "login form", "chat thread".')
  }

  const levels = level ? [level] : DESIGN_LEVELS
  const perLevel = await Promise.all(levels.map(fetchAllAtLevel))
  const artifacts = perLevel.flat()

  // An explicit level from the caller already filtered; only infer when
  // both tiers are in play.
  const preferLevel = level ? undefined : detectLevelHint(description)

  return { groups, results: rankCandidates(artifacts, groups, { limit, preferLevel }) }
}
