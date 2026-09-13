import {
  GENERATED_UI_RULES,
  MOTION,
  SHAPE_AND_TYPE,
  TOKEN_FORMAT_NOTE,
  tokenCss,
} from './design-system-doc'

/**
 * "Copy for AI" — one artifact, formatted as a prompt.
 *
 * ── THE GAP THIS CLOSES ─────────────────────────────────────────────────
 *
 * Every piece of this already existed and none of it was in one place. The
 * component's source is on the detail page. Its props are in a table under
 * that. The tokens are at `/api/v1/dna/…`. The install command is in the
 * sticky bar. An agent rail as deep as this one, and the person deciding
 * whether to use a piece had to assemble four surfaces by hand — so in
 * practice they pasted the source alone, the agent had no system to build
 * against, and it invented one. The catalog's whole advantage evaporated at
 * the exact moment someone tried to use it.
 *
 * ── WHY THE INSTALL COMMAND COMES FIRST, ABOVE THE SOURCE ───────────────
 *
 * An agent with a shell should run `npx hoverlab add`, not paste a code
 * fence: the CLI writes the file at the right path, pulls the block's
 * dependencies, and — for a page or template — brings the children with it.
 * A fence can do none of that. But an agent in a browser tab has no shell,
 * and telling it to run a command it cannot run is a dead end, so the
 * source follows immediately under a heading that says when to use it.
 * Both, in that order, is the only arrangement that works for both readers.
 *
 * ── WHY A TEMPLATE DOES NOT INLINE ITS SOURCE ───────────────────────────
 *
 * Templates run to tens of thousands of lines across dozens of files. A
 * prompt that large is not a prompt — it is a context window spent before
 * the question is asked, and most models will truncate it silently. For
 * that rung the honest handoff is the `init` command plus the list of what
 * it composes, and `SOURCE_BUDGET` enforces the same ceiling everywhere
 * else rather than trusting that no page ever grows.
 *
 * ── WHAT THIS DELIBERATELY IS NOT ───────────────────────────────────────
 *
 * Not gated, not an account prompt, not a truncated teaser that asks the
 * reader to upgrade for the rest. The same reasoning as the tool funnel:
 * everything here is already public at `/api/v1`, and a handoff a paying
 * customer alone can produce is a handoff nobody's agent has heard of. The
 * licence line at the bottom is a statement of fact, not a wall.
 */

/** Which rung of the catalog the subject sits on. */
export type HandoffLevel = 'effect' | 'primitive' | 'block' | 'page' | 'template'

/** One prop, as `lib/blocks/props-table.ts` parses it out of the source. */
export interface HandoffProp {
  name: string
  type: string
  required: boolean
  defaultValue: string | null
  description: string | null
}

/** A source file to inline, as the catalog stores it. */
export interface HandoffFile {
  path: string
  source: string
}

export interface HandoffSubject {
  level: HandoffLevel
  id: string
  name: string
  description: string
  /** Catalog category, when the rung has one. Effects always do. */
  category?: string
  /** Effect tier: the markup the preview renders. */
  html?: string
  /** Effect tier: the stylesheet, already carrying any customisation. */
  css?: string
  /** React tiers: the file a reader would actually paste. */
  file?: HandoffFile | null
  /** Props parsed from that file. Empty is normal and prints nothing. */
  props?: HandoffProp[]
  /** npm packages the artifact needs beyond the framework. */
  deps?: string[]
  /** Child artifact ids — blocks for a page, pages for a template. */
  composedOf?: string[]
  /**
   * Whether the code being handed over carries the visitor's own edits.
   *
   * Only the effect tier can be true here, and it changes what the prompt
   * has to say: an agent told to `npx hoverlab add` an effect the visitor
   * has just recoloured would install the original and quietly discard the
   * reason they copied it.
   */
  customized?: boolean
}

export interface HandoffOptions {
  /** Absolute site origin, for the links. */
  origin: string
}

/**
 * How much source a single prompt will inline, in characters.
 *
 * ~24k characters is roughly 600 lines of TSX — comfortably more than any
 * block or page in the catalog, and far short of the point where a model
 * starts dropping the middle of its context. A file over the budget is
 * linked rather than truncated: half a component in a code fence is worse
 * than none, because the agent will confidently finish it wrong.
 */
export const SOURCE_BUDGET = 24_000

/** The CLI command that installs this artifact. */
export function installCommandFor(level: HandoffLevel, id: string): string {
  return level === 'template' ? `npx hoverlab init ${id} ./my-app` : `npx hoverlab add ${id}`
}

/** Detail-page path for an artifact on a given rung. */
function detailPath(level: HandoffLevel, id: string): string {
  return `/${level}/${id}`
}

/**
 * One prop as a markdown bullet.
 *
 * The three states are genuinely different and an agent acts on the
 * difference: it must pass a required prop, it may leave a defaulted one
 * alone, and an optional one with no default renders nothing until it is
 * given something. Collapsing the last two into "default `undefined`" reads
 * as a value and invites an agent to pass the string "undefined".
 */
function propLine(prop: HandoffProp): string {
  const state = prop.required
    ? 'required'
    : prop.defaultValue
      ? `default \`${prop.defaultValue}\``
      : 'optional, no default'
  const tail = prop.description ? ` — ${prop.description}` : ''
  return `- \`${prop.name}\`: \`${prop.type}\` (${state})${tail}`
}

/**
 * Build the prompt for one artifact.
 *
 * Pure and catalog-free: every value it needs arrives in `subject`, which
 * is what lets the effect page build this in the browser from state the
 * visitor has just edited, while the block, page and template pages build
 * the same string on the server at render time.
 */
export function buildAiHandoff(subject: HandoffSubject, options: HandoffOptions): string {
  const origin = options.origin.replace(/\/$/, '')
  const url = `${origin}${detailPath(subject.level, subject.id)}`
  const install = installCommandFor(subject.level, subject.id)
  const props = (subject.props ?? []).filter((p) => p.name !== 'className')
  const deps = subject.deps ?? []
  const composedOf = subject.composedOf ?? []

  const lines: string[] = []

  lines.push(`# ${subject.name}`)
  lines.push('')
  lines.push(
    `Use the ${subject.level} below in my project, and follow the design system ` +
      'it belongs to for anything you add around it.',
  )
  lines.push('')
  lines.push(`- **Source**: ${url}`)
  lines.push(`- **Id**: \`${subject.id}\` (${subject.level}${subject.category ? `, ${subject.category}` : ''})`)
  lines.push(`- **What it is**: ${subject.description}`)
  if (composedOf.length) {
    lines.push(
      `- **Composed of**: ${composedOf.map((id) => `\`${id}\``).join(', ')} — ` +
        'the install command brings these with it.',
    )
  }
  lines.push('')

  /* ── Install ──────────────────────────────────────────────────────── */

  lines.push('## Install it')
  lines.push('')
  if (subject.customized) {
    /*
      The customised effect is the one case where the command is wrong.

      Saying so plainly beats omitting it: a reader who knows the CLI exists
      will reach for it anyway, and an agent told "this code is already
      modified" will stop trying to reconcile the two.
    */
    lines.push(
      'This copy carries edits made in the browser, so use the code below ' +
        'rather than the CLI — `' +
        install +
        '` would install the unmodified original.',
    )
  } else {
    lines.push('If you can run commands, this is the whole job:')
    lines.push('')
    lines.push('```bash')
    lines.push(install)
    lines.push('```')
    lines.push('')
    lines.push(
      'It writes the source into the project at the right path, with no ' +
        'account and no API key. If you cannot run commands, use the source below instead.',
    )
  }
  if (deps.length) {
    lines.push('')
    lines.push(`Dependencies: ${deps.map((d) => `\`${d}\``).join(', ')}.`)
  }
  lines.push('')

  /* ── The code ─────────────────────────────────────────────────────── */

  if (subject.level === 'effect' && subject.html && subject.css) {
    lines.push('## The code')
    lines.push('')
    lines.push('Markup:')
    lines.push('')
    lines.push('```html')
    lines.push(subject.html.trim())
    lines.push('```')
    lines.push('')
    lines.push('Stylesheet — the class names match the markup above, keep them in step:')
    lines.push('')
    lines.push('```css')
    lines.push(subject.css.trim())
    lines.push('```')
    lines.push('')
  } else if (subject.file) {
    lines.push('## The source')
    lines.push('')
    if (subject.file.source.length > SOURCE_BUDGET) {
      lines.push(
        `\`${subject.file.path}\` is ${subject.file.source.length.toLocaleString('en-US')} ` +
          'characters — too long to paste usefully. Run the install command above, ' +
          `or read it at ${url}.`,
      )
    } else {
      lines.push(`Goes at \`${subject.file.path}\`:`)
      lines.push('')
      lines.push('```tsx')
      lines.push(subject.file.source.trim())
      lines.push('```')
    }
    lines.push('')
  } else if (subject.level === 'template') {
    lines.push('## The source')
    lines.push('')
    lines.push(
      'A template is a whole project — too many files to paste. The `init` ' +
        `command above scaffolds it; the file list is at ${url}.`,
    )
    lines.push('')
  }

  /* ── Props ────────────────────────────────────────────────────────── */

  if (props.length) {
    lines.push('## Props')
    lines.push('')
    lines.push(
      'Read out of the component\'s own type, so this cannot drift from the ' +
        'source. Every prop has a default — it renders standalone before you ' +
        'pass it anything.',
    )
    lines.push('')
    for (const prop of props) lines.push(propLine(prop))
    lines.push('')
  }

  /* ── The system ───────────────────────────────────────────────────── */

  lines.push('## The design system it expects')
  lines.push('')
  lines.push(
    'This is styled against semantic CSS custom properties, not literal ' +
      'colours. If the project does not have these, add them — otherwise the ' +
      'component will not theme with the rest of your app.',
  )
  lines.push('')
  lines.push(TOKEN_FORMAT_NOTE)
  lines.push('')
  lines.push('```css')
  lines.push(tokenCss())
  lines.push('```')
  lines.push('')
  for (const line of SHAPE_AND_TYPE) lines.push(`- ${line}`)
  lines.push('')
  for (const line of MOTION) lines.push(`- ${line}`)
  lines.push('')

  lines.push('## Rules for anything you add around it')
  lines.push('')
  GENERATED_UI_RULES.forEach((rule, i) => lines.push(`${i + 1}. ${rule}`))
  lines.push('')

  /* ── Where to get more ────────────────────────────────────────────── */

  lines.push('## More of the same system')
  lines.push('')
  lines.push('```bash')
  lines.push('npx hoverlab search "pricing section"   # find another piece')
  lines.push('npx hoverlab skill hoverlab             # teach yourself the whole catalog')
  lines.push('```')
  lines.push('')
  /*
    The catalog's DNA document, not this artifact's.

    `/api/v1/dna/{id}` resolves through `resolveArtifact`, which only knows
    the rungs wired into it — so a tier that ships on the site before it is
    added there returns 404. That is not hypothetical: the day the primitive
    tier landed, `/api/v1/dna/button` 404'd while `/primitive/button`
    rendered, and every prompt copied from that page carried a dead link an
    agent would have followed.

    Nothing is lost by pointing at `catalog`. The per-artifact document adds
    a title, a description and the `composedOf` list on top of the system,
    and this prompt already carries all three above — so the id-specific URL
    was buying a coupling and no content.
  */
  lines.push(
    `Full design system as markdown: ${origin}/api/v1/dna/catalog?format=raw · ` +
      `API: ${origin}/api/v1`,
  )
  lines.push('')
  lines.push(
    'Free to browse, customise and copy with no account. A licence is only ' +
      'needed to ship it commercially.',
  )
  lines.push('')

  return lines.join('\n')
}
