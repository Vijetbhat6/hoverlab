/**
 * Identity — the half of a design system that is not in the CSS.
 *
 * ── WHY THESE FOUR FIELDS AND NOT A BRAND QUESTIONNAIRE ─────────────────
 *
 * Everything else in this repo is derivable. Tokens come out of
 * `globals.css`; the block list comes out of the registry; the rules in
 * `design-system-doc.ts` are true of the catalog whether anyone writes them
 * down or not. Hand an agent all of it and it will still produce something
 * that is correctly styled and wrong — a security product that writes like
 * a toy, a developer tool that opens on "Unleash your potential", a
 * hospital dashboard with a confetti animation. Those are not token
 * failures. They are the failures you get when the only thing you handed
 * over was the token file.
 *
 * So: four fields, and each one has to earn its place by being something no
 * generator can infer and something an agent measurably acts on.
 *
 *   product      one line of what the thing is. Cheap, and it is the
 *                anchor the other three hang off.
 *   audience     who is reading. Changes vocabulary, reading level, how
 *                much is explained, whether jargon is a shortcut or a wall.
 *   voice        how it sounds. The single field with the most leverage
 *                over generated copy, and the one nobody writes down
 *                because it feels obvious to the person who has it in
 *                their head.
 *   antiPatterns the things never to do. Listed separately from `voice`
 *                and deliberately so: a positive brief is aspiration and
 *                models treat it as a suggestion, while "never use an
 *                exclamation mark" is a constraint they follow. Half of
 *                what a design system is, in practice, is a list of
 *                things the team stopped doing — and that list lives in
 *                code review comments and nowhere a machine can read.
 *
 * Nothing wider. Mission, values, positioning statements and a colour
 * psychology paragraph are things a brand deck has and an agent cannot act
 * on, and a form long enough to hold them is a form nobody finishes.
 *
 * ── EVERY FIELD IS OPTIONAL ─────────────────────────────────────────────
 *
 * The studio has to be useful on the first keystroke, so a blank identity
 * produces a valid document — just a thinner one. `identityCoverage` is how
 * the UI says so without a validation error: it counts what is filled and
 * names what is missing, which is a prompt rather than a gate.
 *
 * DATA-FREE and dependency-free, so a client component can import it.
 */

/** The non-visual half of a design system. */
export interface StudioIdentity {
  /** One line: what the product is. */
  product: string
  /** Who is reading — the field that sets vocabulary and reading level. */
  audience: string
  /** How it sounds. Free prose; the highest-leverage field for copy. */
  voice: string
  /** Things never to do. Constraints, not aspirations. */
  antiPatterns: string[]
}

/**
 * Length caps, and they are not arbitrary.
 *
 * Two budgets bound this state and the smaller one wins. A shared `#s=`
 * link has to stay under `SHARE_URL_MAX` (4,000 characters) once
 * base64-encoded, which costs about a third on top; a saved preset has to
 * stay under `TOOL_PRESET_LIMITS.stateBytes` (8 KB). The caps below total
 * ~1,640 characters of prose, which lands around 2,600 characters of URL
 * with the theme and palette alongside — comfortably inside both, with room
 * for the state to grow a field later.
 *
 * They are also a content decision. An `audience` that runs past 200
 * characters has stopped being an audience and become a persona document,
 * and a voice brief longer than a paragraph is one an agent will average
 * out rather than follow. The cap is doing the same work the field label
 * does.
 */
export const IDENTITY_LIMITS = {
  product: 80,
  audience: 200,
  voice: 400,
  /** One anti-pattern. A rule that needs more than this is two rules. */
  antiPattern: 120,
  /**
   * How many anti-patterns travel.
   *
   * Eight because a list this is read off has to be read off in one go. A
   * prompt carrying thirty prohibitions gets the first few followed and the
   * rest averaged into a vague sense of caution, which is worse than eight
   * that land.
   */
  antiPatterns: 8,
} as const

export const IDENTITY_DEFAULTS: StudioIdentity = {
  product: '',
  audience: '',
  voice: '',
  antiPatterns: [],
}

/**
 * What each field is for, in the words of someone filling it in.
 *
 * Kept next to the type rather than in the component because the Agent tab
 * quotes the same descriptions when a field is empty — "no audience set"
 * is less useful to a reader than the question that would have filled it.
 */
export interface IdentityFieldMeta {
  key: 'product' | 'audience' | 'voice'
  label: string
  /** The question the field is really asking. */
  prompt: string
  /** A real answer, not a shape — see the note on EXAMPLES below. */
  placeholder: string
  /** Why an agent needs it. Shown under the field, once. */
  why: string
  multiline: boolean
  max: number
}

export const IDENTITY_FIELDS: IdentityFieldMeta[] = [
  {
    key: 'product',
    label: 'Product',
    prompt: 'What is it, in one line?',
    placeholder: 'A deployment dashboard for infrastructure teams',
    why: 'Anchors everything else. An agent that knows this stops writing generic SaaS copy.',
    multiline: false,
    max: IDENTITY_LIMITS.product,
  },
  {
    key: 'audience',
    label: 'Audience',
    prompt: 'Who reads this, and what do they already know?',
    placeholder:
      'Platform engineers on call. They know Kubernetes; they do not want it explained.',
    why: 'Sets vocabulary and reading level — whether jargon is a shortcut or a wall.',
    multiline: true,
    max: IDENTITY_LIMITS.audience,
  },
  {
    key: 'voice',
    label: 'Voice & tone',
    prompt: 'How does it sound? Name the register, not the adjectives.',
    placeholder:
      'Direct and calm. Short sentences. States what happened and what to do about it. Never reassuring about something that is broken.',
    why: 'The field with the most leverage over generated copy, and the one nobody writes down.',
    multiline: true,
    max: IDENTITY_LIMITS.voice,
  },
]

/**
 * Anti-patterns worth offering as one click.
 *
 * A blank list beside the words "anti-patterns" gets skipped; the same list
 * with eight chips above it gets one tapped and then three typed, which is
 * the point. These are the ones that come up in review on almost every
 * product — chosen because each is checkable by a machine reading generated
 * output, which is the difference between a rule and a mood.
 *
 * Offered, never applied. A default list of prohibitions would be this
 * repo's taste shipped as the customer's constraint.
 */
export const ANTI_PATTERN_SUGGESTIONS: string[] = [
  'No exclamation marks',
  'Never call the product "powerful", "seamless" or "revolutionary"',
  'No emoji in UI copy',
  'Do not open a heading with a gerund ("Unlocking…", "Building…")',
  'No gradient text',
  'Never more than one accent colour on a screen',
  'No testimonials or logo walls we cannot source',
  'Do not use "simply" or "just" — it blames the reader',
]

/**
 * Worked identities, as starting points.
 *
 * Three, and they are deliberately far apart: the blank-page problem here
 * is not "what do I type" but "how specific is specific enough", and that
 * only answers itself next to an example that is more specific than the
 * user expected. Loading one replaces the identity and nothing else — the
 * look is a separate decision, made on a separate tab.
 */
export interface IdentityPreset extends StudioIdentity {
  id: string
  name: string
  note: string
}

export const IDENTITY_PRESETS: IdentityPreset[] = [
  {
    id: 'infra',
    name: 'Infrastructure tool',
    note: 'Technical, on-call, allergic to marketing language.',
    product: 'A deployment dashboard for infrastructure teams',
    audience:
      'Platform engineers, often mid-incident. They know the domain and are reading under time pressure.',
    voice:
      'Direct and calm. Short sentences, active voice. Says what happened, then what to do. Never reassuring about something that is still broken.',
    antiPatterns: [
      'No exclamation marks',
      'Never call the product "powerful" or "seamless"',
      'Do not use "simply" or "just" — it blames the reader',
      'No emoji in UI copy',
    ],
  },
  {
    id: 'consumer',
    name: 'Consumer app',
    note: 'Warm, plain-spoken, talking to someone who did not ask for software.',
    product: 'A shared budget app for couples',
    audience:
      'Two people who do not enjoy talking about money. No finance background, low patience for setup.',
    voice:
      'Warm and plain. Second person. Explains the money, never the app. Short enough to read on a phone at the end of the day.',
    antiPatterns: [
      'No financial jargon — say "money you have left", not "residual balance"',
      'Never imply the reader is behind or bad with money',
      'No exclamation marks',
      'Do not call it a "journey"',
    ],
  },
  {
    id: 'health',
    name: 'Clinical product',
    note: 'Precise, unhurried, and where the anti-patterns do the most work.',
    product: 'A medication schedule for outpatient clinics',
    audience:
      'Nurses and pharmacists, plus patients reading a printed copy. Mixed expertise, high consequence.',
    voice:
      'Precise and unhurried. Names doses and times exactly. Prefers the longer word if it is the unambiguous one. Never chatty.',
    antiPatterns: [
      'No celebratory language or animation anywhere near a dose',
      'Never abbreviate a drug name or a unit',
      'No colour as the only signal — it must survive greyscale',
      'Do not soften a warning to make it read nicer',
    ],
  },
]

/** Trim, collapse runs of whitespace, and cap. */
function clip(value: unknown, max: number): string {
  if (typeof value !== 'string') return ''
  return value.replace(/\s+/g, ' ').trim().slice(0, max)
}

/**
 * Narrow an unknown value into an identity.
 *
 * Runs on anything that came off a shared link or out of `localStorage`.
 * `shapeMatched` has already guaranteed the shape by the time this is
 * called on a link, so what is left is the part no generic guard can do:
 * the caps, and dropping empty or duplicate rules.
 *
 * Newlines are collapsed on the way in. They survive a round trip fine, but
 * this prose is pasted into a Markdown document as list items and bare
 * paragraphs — a newline inside one silently splits it in two, and the
 * reader gets half a rule.
 */
export function coerceIdentity(raw: unknown): StudioIdentity {
  const v = (raw ?? {}) as Partial<Record<keyof StudioIdentity, unknown>>
  const seen = new Set<string>()
  const antiPatterns: string[] = []

  for (const item of Array.isArray(v.antiPatterns) ? v.antiPatterns : []) {
    const rule = clip(item, IDENTITY_LIMITS.antiPattern)
    const key = rule.toLowerCase()
    if (!rule || seen.has(key)) continue
    seen.add(key)
    antiPatterns.push(rule)
    if (antiPatterns.length >= IDENTITY_LIMITS.antiPatterns) break
  }

  return {
    product: clip(v.product, IDENTITY_LIMITS.product),
    audience: clip(v.audience, IDENTITY_LIMITS.audience),
    voice: clip(v.voice, IDENTITY_LIMITS.voice),
    antiPatterns,
  }
}

export interface IdentityCoverage {
  /** How many of the four slots carry something. */
  filled: number
  total: number
  /** The names of the empty ones, for a nudge rather than an error. */
  missing: string[]
  /** True when nothing at all has been filled in. */
  empty: boolean
}

/**
 * What is filled and what is not.
 *
 * Four slots, weighted equally, and anti-patterns count as one however many
 * are listed — a count that rewarded a longer list would turn the field
 * into a score to farm. The UI shows this as "2 of 4", which is honest
 * about a document being thin without refusing to build it.
 */
export function identityCoverage(identity: StudioIdentity): IdentityCoverage {
  const slots: Array<[string, boolean]> = [
    ['product', identity.product.length > 0],
    ['audience', identity.audience.length > 0],
    ['voice & tone', identity.voice.length > 0],
    ['anti-patterns', identity.antiPatterns.length > 0],
  ]
  const missing = slots.filter(([, done]) => !done).map(([name]) => name)
  return {
    filled: slots.length - missing.length,
    total: slots.length,
    missing,
    empty: missing.length === slots.length,
  }
}

/**
 * A file-name-safe slug for the identity, or a fallback.
 *
 * Used to name the downloaded files, so the three artifacts a session
 * produces land in the downloads folder under the product's name rather
 * than as three copies of `tokens.json`.
 */
export function identitySlug(identity: StudioIdentity): string {
  const slug = identity.product
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  return slug || 'design-system'
}
