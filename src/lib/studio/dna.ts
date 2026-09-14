/**
 * The studio's output: one document, describing the customer's system.
 *
 * ── WHY THE OUTPUT IS A DOCUMENT AND NOT A CSS FILE ─────────────────────
 *
 * `lib/dna.ts` already builds a DNA document, for a catalog artifact, and
 * the idea is the same one: an agent asked for "a pricing page" with no
 * design system invents one, and handing it the tokens up front is the
 * difference between output that looks generic and output that looks like
 * the product. What that document cannot do is describe a system that is
 * not ours — it reads `generated-dna.json`, which is parsed out of this
 * repo's own `globals.css`.
 *
 * This builds the same shape for a system somebody just made in the
 * studio. It is the reason the studio exists rather than being three tools
 * in a row: a token file is the *cheapest* part of a design system to hand
 * over and the least load-bearing. Tokens stop an agent picking a random
 * grey. They do nothing at all about the copy, and copy is most of what an
 * agent generates — so the parts of the document that come from the
 * Identity fields are the parts that change the output most, and they are
 * the parts no generator could have produced.
 *
 * ── WHY THE ANTI-PATTERNS ARE A SEPARATE NUMBERED SECTION ───────────────
 *
 * They could have been folded into the voice paragraph, and they are not,
 * because the two are read differently. Prose describing a voice is
 * something a model averages into a style; a numbered list of prohibitions
 * is something it checks against. Keeping them apart, last, and
 * numbered — after the positive rules, so the numbering continues rather
 * than restarting — is the arrangement that actually gets followed.
 *
 * ── WHAT IS DELIBERATELY NOT IN HERE ────────────────────────────────────
 *
 * A component list. The studio does not know which blocks a project will
 * use, and a document that guessed would be teaching an agent about
 * sections that are not installed. What it ends with instead is the
 * commands that find and install real ones — the same ending
 * `lib/dna.ts` argues for at length: tokens without the components is a
 * style guide, tokens plus `npx hoverlab add` is a build.
 *
 * Pure. No catalog imports, no `document`, no fetch — so the Agent tab can
 * build it on every keystroke and a test can run it in Node.
 */

import {
  BORDERS_RULE,
  GENERATED_UI_RULES,
  MOTION,
  SPACING_RULE,
} from '@/lib/design-system-doc'
import { fontById, themeCss } from '@/lib/theme-studio'
import { tokenBlockCss } from '@/lib/tools/token-css'
import { hueName } from '@/lib/tools/permalinks/tokens'
import {
  NEUTRAL_HUE_NOTE,
  accentOklch,
  radiusStopName,
  studioTokenOverrides,
  studioTokenState,
  type StudioState,
} from '@/lib/studio/state'
import { identityCoverage, identitySlug, type StudioIdentity } from '@/lib/studio/identity'

/**
 * `origin` is required, and that is deliberate.
 *
 * `lib/dna.ts` carries a long note about the day its default origin was the
 * literal `https://hoverlab.dev` — a domain that does not resolve — and an
 * unattributed document handed an agent install commands and fetch URLs
 * aimed at nothing. The fix there was to default to `siteUrl`. That is not
 * available to this module: `lib/site.ts` reads server-only runtime
 * variables and says so, and both builders here run in the browser on
 * every keystroke of the Agent tab.
 *
 * So rather than invent a second plausible-looking default that can be
 * wrong, the origin is a required argument. The server page reads `siteUrl`
 * and hands it down as a prop — the value the sitemap and every canonical
 * tag already use, resolved on the side that can resolve it.
 */
export interface StudioDnaOptions {
  /** Absolute site origin, for the links at the foot of the document. */
  origin: string
}

export interface StudioDna {
  /** `# heading` of the document, and the studio's own page title. */
  title: string
  /** The document. Markdown, because that is what an agent reads best. */
  markdown: string
  /** The same content as data, for anything that would rather not parse prose. */
  json: StudioDnaJson
  /** What to call the file when it is saved. */
  filename: string
  /**
   * How complete the document is, so the tab can say so.
   *
   * Carried on the result rather than recomputed by the UI: the document
   * and the claim about the document should not be able to disagree.
   */
  coverage: ReturnType<typeof identityCoverage>
}

export interface StudioDnaJson {
  name: string
  identity: StudioIdentity
  theme: {
    accent: { hue: number; chroma: number; light: string; dark: string }
    neutrals: { warmHue: number; coolHue: number; chroma: number }
    font: { id: string; name: string; stack: string }
    radius: string
  }
  /** The nine theme-independent inputs, as CSS. */
  variablesCss: string
  /** The finished shadcn block, as CSS. */
  tokensCss: string
  rules: string[]
  neverDo: string[]
  install: string[]
}

/**
 * The document's name.
 *
 * Falls back to a description of the look rather than to the word
 * "Untitled": someone who has set a hue and no product name has still made
 * something specific, and "Violet, 12px corners — Design DNA" is a better
 * thing to find in a downloads folder than "Untitled — Design DNA".
 */
function documentName(state: StudioState): string {
  const { identity, theme } = state
  if (identity.product) return identity.product
  const stop = radiusStopName(theme.radiusRem)
  const shape = stop ? `${stop.toLowerCase()} corners` : `${theme.radiusRem}rem corners`
  return `${hueName(theme.accent.hue)}, ${shape}`
}

/**
 * A prose sentence for the neutrals, because three numbers are not a fact
 * anyone can act on.
 *
 * The multiplier is the part worth translating: `base.chroma` is a factor
 * on the per-token amounts in the stylesheet, so 0 is a true grey and 1 is
 * what ships, and an agent handed the bare number `2.5` would have no way
 * to know whether that is a lot.
 */
function neutralSentence(state: StudioState): string {
  const { warmHue, coolHue, chroma } = state.theme.base
  if (chroma === 0) {
    return 'Neutrals are true greys — no hue at all. Nothing but the accent carries colour.'
  }
  const strength =
    chroma < 0.75 ? 'barely tinted' : chroma <= 1.5 ? 'subtly tinted' : 'visibly tinted'
  return (
    `Neutrals are ${strength}: surfaces lean warm (hue ${warmHue}) and ink leans ` +
    `cool (hue ${coolHue}) in the light theme, and the two swap in dark. This is ` +
    'what stops the greys reading as default grey — do not replace them with ' +
    '`neutral-*` or `gray-*` from the Tailwind palette.'
  )
}

/**
 * Build the studio's DNA document.
 *
 * Every section is present whether or not the identity fields are filled —
 * except the identity sections themselves, which are omitted rather than
 * emitted empty. A heading followed by nothing tells an agent the field
 * exists and was left blank, which invites it to fill the gap with its own
 * assumption; leaving the heading out says nothing, and nothing is what we
 * actually know.
 */
export function buildStudioDna(state: StudioState, options: StudioDnaOptions): StudioDna {
  const origin = options.origin.replace(/\/$/, '')
  const { identity, theme } = state
  const font = fontById(theme.fontId)
  const name = documentName(state)
  const title = `${name} — Design DNA`
  const tokenState = studioTokenState(state)
  const stop = radiusStopName(theme.radiusRem)

  const variablesCss = themeCss(theme)
  /*
    Overridden, so the `## Colour` section above and the token block below
    state the same accent.

    Before this they did not, and it was the worst defect in the document:
    the prose quoted the accent's own lightness while the block emitted the
    shadcn ladder's. An agent handed one file saying the accent is
    `oklch(0.55 0.2 160)` and, forty lines later, `--primary: oklch(0.520
    0.200 160.0)` picks one of the two, and there is no telling which — the
    same failure the radius test guards against.
  */
  const tokensCss = tokenBlockCss(
    tokenState,
    `${name} — design tokens
   A complete light and dark set in the shadcn convention. Every
   Hoverlab block is styled against these names.`,
    (dark) => studioTokenOverrides(theme, dark),
  )

  const rules = [...GENERATED_UI_RULES]
  const lines: string[] = []

  lines.push(`# ${title}`)
  lines.push('')
  lines.push(
    'Paste this into your AI tool before asking it for UI. Everything it ' +
      'generates will follow this system instead of inventing one.',
  )
  lines.push('')

  /* ── Identity ─────────────────────────────────────────────────────── */

  if (identity.product) {
    lines.push('## What this is')
    lines.push('')
    lines.push(identity.product)
    lines.push('')
  }

  if (identity.audience) {
    lines.push('## Who it is for')
    lines.push('')
    lines.push(identity.audience)
    lines.push('')
    lines.push(
      'Write for this reader. It sets the vocabulary, how much is explained, ' +
        'and whether a term is a shortcut or a wall.',
    )
    lines.push('')
  }

  if (identity.voice) {
    lines.push('## Voice and tone')
    lines.push('')
    lines.push(identity.voice)
    lines.push('')
    lines.push(
      'This applies to every string you write — headings, button labels, ' +
        'empty states, error messages and helper text. Placeholder copy is ' +
        'copy; write it in this voice too.',
    )
    lines.push('')
  }

  /* ── The look ─────────────────────────────────────────────────────── */

  lines.push('## Colour')
  lines.push('')
  lines.push(
    `One accent: \`${accentOklch(theme)}\` in the light theme, ` +
      `\`${accentOklch(theme, true)}\` in dark. The same hue and chroma at two ` +
      'lightnesses, because a single accent lightness that reads on white ' +
      'disappears on a dark ground — those are the values `--primary` and ' +
      '`--ring` carry in both code blocks below, so do not reach for a third. ' +
      'It is the only chromatic colour in the system.',
  )
  lines.push('')
  lines.push(neutralSentence(state))
  lines.push('')

  lines.push('## Shape and type')
  lines.push('')
  lines.push(
    `**Radius**: \`--radius: ${theme.radiusRem}rem\`${stop ? ` (${stop.toLowerCase()})` : ''}. ` +
      'Tailwind maps `rounded-lg` to it, with `md` and `sm` derived 2px and 4px ' +
      'tighter. Do not hand-pick radii per component.',
  )
  lines.push(
    `**Type**: ${font.name}, set once on \`body\` and inherited — \`--app-font-sans: ${font.stack}\`. ` +
      'Headings carry `text-wrap: balance`; body text stays near 65 characters.',
  )
  lines.push(SPACING_RULE)
  lines.push(BORDERS_RULE)
  lines.push('')

  lines.push('## Motion')
  lines.push('')
  for (const line of MOTION) lines.push(`- ${line}`)
  lines.push('')

  /* ── The variables ────────────────────────────────────────────────── */

  lines.push('## The variables')
  lines.push('')
  lines.push(
    'Two spellings of the same theme, and which one you want depends on ' +
      'what you already have.',
  )
  lines.push('')
  lines.push(
    '**If the project was scaffolded from a Hoverlab template**, it already ' +
      'derives its tokens from these nine inputs. Paste only these:',
  )
  lines.push('')
  lines.push('```css')
  lines.push(variablesCss)
  lines.push('```')
  lines.push('')
  lines.push(
    '**If the project has no tokens at all**, paste the finished set instead — ' +
      'a complete light and dark block in the shadcn convention:',
  )
  lines.push('')
  lines.push('```css')
  lines.push(tokensCss.trimEnd())
  lines.push('```')
  lines.push('')
  lines.push(`Note: ${NEUTRAL_HUE_NOTE}`)
  lines.push('')

  /* ── The rules ────────────────────────────────────────────────────── */

  lines.push('## Rules for generated UI')
  lines.push('')
  rules.forEach((rule, i) => lines.push(`${i + 1}. ${rule}`))

  /*
    The anti-patterns continue the numbering rather than starting a second
    list at 1. Two lists both beginning at 1 read as two documents stapled
    together, and the second one — the one written by the person whose
    product this is — is the one that gets skimmed.
  */
  if (identity.antiPatterns.length) {
    identity.antiPatterns.forEach((rule, i) =>
      lines.push(`${rules.length + i + 1}. **Never**: ${rule}`),
    )
  }
  lines.push('')

  if (identity.antiPatterns.length) {
    lines.push(
      'The **Never** rules are constraints, not preferences. If following ' +
        'one makes a sentence worse, rewrite the sentence — do not break ' +
        'the rule.',
    )
    lines.push('')
  }

  /* ── The exit ─────────────────────────────────────────────────────── */

  lines.push('## Get components that already follow this')
  lines.push('')
  lines.push(
    'This document is the system. The components are free, and land in your ' +
      'project as source you own rather than as a dependency:',
  )
  lines.push('')
  lines.push('```bash')
  lines.push('npx hoverlab search "pricing section"   # find a section')
  lines.push('npx hoverlab add pricing-three-tier     # write it into your project')
  lines.push('npx hoverlab skill hoverlab             # teach your agent the catalog')
  lines.push('```')
  lines.push('')
  lines.push(`Catalog: ${origin} · API: ${origin}/api/v1 · No account needed for any of it.`)
  lines.push('')

  return {
    title,
    markdown: lines.join('\n'),
    filename: `${identitySlug(identity)}-dna.md`,
    coverage: identityCoverage(identity),
    json: {
      name,
      identity,
      theme: {
        accent: {
          hue: theme.accent.hue,
          chroma: theme.accent.chroma,
          light: accentOklch(theme),
          dark: accentOklch(theme, true),
        },
        neutrals: { ...theme.base },
        font: { id: font.id, name: font.name, stack: font.stack },
        radius: `${theme.radiusRem}rem`,
      },
      variablesCss,
      tokensCss,
      rules,
      neverDo: identity.antiPatterns,
      install: [
        'npx hoverlab search "pricing section"',
        'npx hoverlab add pricing-three-tier',
        'npx hoverlab skill hoverlab',
      ],
    },
  }
}

/**
 * The same system as a rules file an editor agent reads on its own.
 *
 * ── WHY A SECOND FORMAT AT ALL ──────────────────────────────────────────
 *
 * The Markdown above is pasted into a chat and lasts one conversation. A
 * rules file is committed, and then every future request in that repo is
 * already governed by it — which is the difference between handing an agent
 * the design system once and the project having one. Cursor reads
 * `.cursor/rules/*.mdc`, Claude Code and several others read `AGENTS.md`
 * or `CLAUDE.md`, and all of them read Markdown with optional frontmatter,
 * so one file serves the lot.
 *
 * ── WHY IT IS SHORTER THAN THE DOCUMENT ─────────────────────────────────
 *
 * A rules file is prepended to *every* request in the repo, so its length
 * is a tax on all of them. The eighty-line finished token block is dropped:
 * once it has been pasted into `globals.css` it is in the project, and
 * repeating it in the rules file spends context restating a file the agent
 * can read. The nine inputs stay, because they are short and they say what
 * the theme *is*, and everything about voice stays — that is the part that
 * has to be re-read on every request, because it governs output that is
 * generated fresh each time.
 */
export function buildAgentRules(
  state: StudioState,
  options: StudioDnaOptions,
): { filename: string; content: string } {
  const origin = options.origin.replace(/\/$/, '')
  const { identity, theme } = state
  const font = fontById(theme.fontId)
  const name = documentName(state)

  const lines: string[] = []

  /*
    Frontmatter, and `alwaysApply` in particular, is Cursor's `.mdc`
    convention; every other reader treats the block as inert text at the
    top of a Markdown file. Including it costs nothing where it is ignored
    and is the difference between a rule that loads and one that sits in a
    directory where nothing reads it.
  */
  lines.push('---')
  lines.push(`description: Design system and voice for ${name}`)
  lines.push('alwaysApply: true')
  lines.push('---')
  lines.push('')
  lines.push(`# Design rules — ${name}`)
  lines.push('')

  if (identity.product) lines.push(`**Product**: ${identity.product}`)
  if (identity.audience) lines.push(`**Audience**: ${identity.audience}`)
  if (identity.voice) lines.push(`**Voice**: ${identity.voice}`)
  if (identity.product || identity.audience || identity.voice) lines.push('')

  lines.push('## Theme')
  lines.push('')
  lines.push('```css')
  lines.push(themeCss(theme))
  lines.push('```')
  lines.push('')
  lines.push(
    `Typeface ${font.name}. Radius ${theme.radiusRem}rem. One accent — ` +
      `\`${accentOklch(theme)}\` light, \`${accentOklch(theme, true)}\` dark — and it is ` +
      'the only chromatic colour in the system.',
  )
  lines.push('')

  lines.push('## Always')
  lines.push('')
  for (const rule of GENERATED_UI_RULES) lines.push(`- ${rule}`)
  lines.push('')

  if (identity.antiPatterns.length) {
    lines.push('## Never')
    lines.push('')
    for (const rule of identity.antiPatterns) lines.push(`- ${rule}`)
    lines.push('')
    lines.push('These are constraints, not preferences. Rewrite the sentence instead.')
    lines.push('')
  }

  lines.push(
    `Sections that already follow all of this: \`npx hoverlab search "<what you need>"\` (${origin}).`,
  )
  lines.push('')

  return { filename: 'AGENTS.md', content: lines.join('\n') }
}
