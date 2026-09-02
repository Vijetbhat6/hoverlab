/**
 * The block wave pipeline — scaffold, wire, gate, promote or roll back.
 *
 * ── THE PROBLEM THIS SOLVES ─────────────────────────────────────────────
 *
 * The catalog is 210 blocks. Shadcnblocks ships 1,858. That gap does not
 * close by hand-authoring: at the rate a wave actually lands here it is
 * years, and the arithmetic does not improve by trying harder.
 *
 * The reason nobody sane generates UI components in volume is that volume
 * and quality trade off — a hundred generated blocks is a hundred chances
 * to ship something that throws on click, renders invisible, or fails a
 * contrast check, and the person who generated them will not open a
 * hundred browser tabs to find out.
 *
 * But this repo already built the thing that makes that trade go away.
 * `test-blocks.mts` hydrates every block in a real browser, clicks its
 * first control and fails on any console error; `audit-a11y` and
 * `audit-block-motion` read the source; `build-block-markup` server-renders
 * all of them. Five checks, and nothing was wired to them except a human
 * remembering to run them. **The gate is what makes volume safe rather than
 * reckless**, so this script exists to make the gate mandatory rather than
 * remembered.
 *
 * ── WHAT IT DOES NOT DO ─────────────────────────────────────────────────
 *
 * It does not write the docblock, and it will not let you ship without one.
 *
 * Every block in this catalog carries an explanation of the decisions
 * inside it — why `role="status"` is conditional, why the dismissal
 * persists, why the popup needs bottom padding. That is the half a
 * template cannot produce and is most of why these blocks are worth
 * copying. So `scaffold` writes the mechanical 80% — the structure, the
 * props, the token-correct classes, the accessible markup — and leaves a
 * literal `TODO(wave)` marker where the reasoning goes. The gate greps for
 * that marker and refuses. A pipeline that would happily emit 200 hollow
 * components is the reckless version of this, and it is one `if` away.
 *
 * ── ROLLBACK IS THE POINT ───────────────────────────────────────────────
 *
 * Wiring a block touches three files, two of which every other block also
 * lives in. A failed wave that leaves half its blocks wired is worse than
 * no wave: `build-artifact-sources` fails on the orphan, and the next
 * person is unpicking a catalog by hand. So `catalog.ts` and `registry.tsx`
 * are snapshotted before the first edit and restored verbatim if anything
 * downstream fails. Nothing is left behind on a red gate.
 *
 * ── USAGE ───────────────────────────────────────────────────────────────
 *
 *   npm run blocks:wave -- --spec=scripts/block-specs/example.json
 *   npm run blocks:wave -- --spec=… --scaffold-only   drafts only, wire nothing
 *   npm run blocks:wave -- --gate-only --ids=a,b      re-run the gate
 *   npm run blocks:wave -- --spec=… --keep            leave a red wave wired
 *
 * `test:blocks` needs a dev server. Start one and pass BASE if it is not on
 * 3007. Without it the browser gate is skipped and the run says so loudly —
 * it does not quietly pass.
 */

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { BLOCK_CATEGORIES, type BlockCategory } from '../src/lib/blocks/block-types.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')
const BLOCKS_DIR = join(ROOT, 'src', 'lib', 'blocks')
const SOURCES_DIR = join(BLOCKS_DIR, 'sources')
const CATALOG = join(BLOCKS_DIR, 'catalog.ts')
const REGISTRY = join(BLOCKS_DIR, 'registry.tsx')

/**
 * Where a scaffold waits while a human writes the half a template cannot.
 *
 * NOT `sources/`, and this is the one piece of layout in here that is a
 * correctness decision rather than tidiness. `build-artifact-sources.mjs`
 * fails the build on any file in `sources/` with no catalog entry, so a
 * scaffold parked there un-wired breaks `npm run build` for everyone on the
 * repo until it is either finished or deleted. Drafts live outside the
 * catalog's world entirely and are copied in only when the wave runs.
 */
const DRAFTS_DIR = join(HERE, 'block-drafts')

const BASE = process.env.BASE ?? 'http://localhost:3007'

/* ------------------------------------------------------------------ *
 *  Arguments
 * ------------------------------------------------------------------ */

const args = process.argv.slice(2)
const has = (flag: string) => args.includes(flag)
const value = (flag: string) =>
  args.find((a) => a.startsWith(`${flag}=`))?.slice(flag.length + 1)

const specPath = value('--spec')
const scaffoldOnly = has('--scaffold-only')
const gateOnly = has('--gate-only')
const keepOnFailure = has('--keep')
const skipShots = has('--no-shots')
const idsArg = value('--ids')

/* ------------------------------------------------------------------ *
 *  The spec
 * ------------------------------------------------------------------ */

/**
 * The four shapes a scaffold can take.
 *
 * Deliberately few. Each one is a layout problem with its own answer —
 * a metric row, a list with state, a form with a submit lifecycle, a
 * two-column feature — and a fifth that is a variation of one of these
 * produces blocks that look generated because they are. Widening this list
 * is how a catalog turns into filler; the categories that need something
 * genuinely new need a hand-written block, and that is fine.
 */
export type BlockShape = 'stat-band' | 'list-panel' | 'form-card' | 'split-feature'

const SHAPES: BlockShape[] = ['stat-band', 'list-panel', 'form-card', 'split-feature']

interface BlockSpec {
  id: string
  name: string
  category: BlockCategory
  description: string
  tags: string[]
  shape: BlockShape
  /** npm packages beyond React. `lucide-react` for anything with an icon. */
  deps?: string[]
  /** Copy. Absent fields become TODO markers that the gate refuses. */
  content?: {
    eyebrow?: string
    heading?: string
    intro?: string
    /** stat-band: the tiles. list-panel: the rows. split-feature: the points. */
    items?: Array<{ label: string; value?: string; detail?: string; tone?: string }>
    /** form-card: the fields. */
    fields?: Array<{ name: string; label: string; type?: string; hint?: string }>
    cta?: string
  }
}

function readSpec(path: string): BlockSpec[] {
  const raw = JSON.parse(readFileSync(resolve(ROOT, path), 'utf8')) as unknown
  if (!Array.isArray(raw)) throw new Error(`${path} must be a JSON array of block specs.`)

  const seen = new Set<string>()
  const specs = raw as BlockSpec[]

  for (const spec of specs) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(spec.id ?? '')) {
      throw new Error(`Bad id ${JSON.stringify(spec.id)} — kebab-case, lowercase, no leading digit run.`)
    }
    if (seen.has(spec.id)) throw new Error(`Duplicate id in spec: ${spec.id}`)
    seen.add(spec.id)

    if (!BLOCK_CATEGORIES.includes(spec.category)) {
      throw new Error(`${spec.id}: unknown category ${JSON.stringify(spec.category)}.`)
    }
    if (!SHAPES.includes(spec.shape)) {
      throw new Error(`${spec.id}: shape must be one of ${SHAPES.join(', ')}.`)
    }
    if (!spec.name || !spec.description) {
      throw new Error(`${spec.id}: name and description are required — they are the catalog card.`)
    }
    if (!Array.isArray(spec.tags) || spec.tags.length < 3) {
      throw new Error(`${spec.id}: at least three tags. They are how the block is found.`)
    }
    if (existsSync(join(SOURCES_DIR, `${spec.id}.tsx`))) {
      throw new Error(`${spec.id}: sources/${spec.id}.tsx already exists. Pick another id.`)
    }
    if (!spec.content && !existsSync(join(DRAFTS_DIR, `${spec.id}.tsx`))) {
      /*
       * Not fatal. A spec with no copy is a legitimate first pass — the
       * scaffold is precisely what you run to get something to edit. Said
       * out loud because the gate WILL refuse it, and finding that out
       * after a typecheck and a browser run is a slow way to learn it.
       */
      console.warn(`  note: ${spec.id} has no content and no draft — it will scaffold as a draft.`)
    }
  }

  return specs
}

/* ------------------------------------------------------------------ *
 *  Scaffolding
 * ------------------------------------------------------------------ */

/** `agent-tool-calls` → `AgentToolCalls`. */
function pascal(id: string): string {
  return id
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

/** The marker the gate refuses to ship. One string, checked in one place. */
const DRAFT_MARKER = 'TODO(wave)'

function todo(what: string): string {
  return `${DRAFT_MARKER}: ${what}`
}

/**
 * The docblock every source opens with.
 *
 * Written as a prompt rather than as filler: the headings are the questions
 * this catalog's blocks actually answer, so whoever finishes it is told
 * what is missing rather than left to guess why the file has a TODO in it.
 */
function docblock(spec: BlockSpec, component: string): string {
  return `/**
 * <${component}> — ${spec.description}
 *
 * ${todo('replace this block with the reasoning')}
 *
 * The catalog's blocks explain the decisions inside them, because that is
 * the half a reader cannot recover from the markup. Answer at least:
 *
 *   - What is the layout problem here, and what is the obvious wrong answer?
 *   - Which accessibility decision is non-obvious? (the live region, the
 *     label association, the focus order, the reason a role is conditional)
 *   - What state does the demo default to, and why that one?
 *
 * Then delete these three lines and the marker above.
 */`
}

/** Placeholder text, marked so the gate can find it. */
function copy(given: string | undefined, what: string): string {
  return given ?? todo(what)
}

interface Scaffold {
  source: string
  /** True when nothing needs a browser — lets the block stay a server component. */
  server: boolean
}

function scaffoldStatBand(spec: BlockSpec, component: string): Scaffold {
  const items = spec.content?.items ?? []
  const tiles =
    items.length > 0
      ? items
      : [{ label: todo('metric label'), value: todo('value'), detail: todo('what changed') }]

  return {
    server: true,
    source: `${docblock(spec, component)}

export interface ${component}Metric {
  label: string
  value: string
  /** One clause on what moved, or omit for a bare figure. */
  detail?: string
}

export interface ${component}Props {
  eyebrow?: string
  heading?: string
  intro?: string
  metrics?: ${component}Metric[]
  className?: string
}

const METRICS: ${component}Metric[] = [
${tiles
  .map(
    (tile) =>
      `  { label: ${JSON.stringify(tile.label)}, value: ${JSON.stringify(
        tile.value ?? todo('value'),
      )}${tile.detail ? `, detail: ${JSON.stringify(tile.detail)}` : ''} },`,
  )
  .join('\n')}
]

export function ${component}({
  eyebrow = ${JSON.stringify(copy(spec.content?.eyebrow, 'eyebrow'))},
  heading = ${JSON.stringify(copy(spec.content?.heading, 'heading'))},
  intro = ${JSON.stringify(copy(spec.content?.intro, 'one sentence of intro'))},
  metrics = METRICS,
  className,
}: ${component}Props) {
  return (
    <section
      aria-labelledby="${spec.id}-heading"
      className={\`w-full bg-background px-6 py-16 sm:py-20 \${className ?? ''}\`}
    >
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-medium text-primary">{eyebrow}</p>
        <h2
          id="${spec.id}-heading"
          className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
        >
          {heading}
        </h2>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground">{intro}</p>

        {/*
          A <dl>, not a grid of divs. Each tile is a term and its value, and
          a screen reader reading "Uptime, 99.98%" is the whole point of the
          section — a div soup reads as five unrelated numbers.
        */}
        <dl className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-${Math.min(
          Math.max(tiles.length, 2),
          4,
        )}">
          {metrics.map((metric) => (
            <div key={metric.label} className="bg-card p-6">
              <dt className="text-sm font-medium text-muted-foreground">{metric.label}</dt>
              <dd className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-foreground">
                {metric.value}
              </dd>
              {metric.detail ? (
                <p className="mt-1 text-sm text-muted-foreground">{metric.detail}</p>
              ) : null}
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
`,
  }
}

function scaffoldListPanel(spec: BlockSpec, component: string): Scaffold {
  const rows = spec.content?.items ?? []
  const seed =
    rows.length > 0
      ? rows
      : [{ label: todo('row label'), detail: todo('row detail'), tone: 'neutral' }]

  return {
    server: false,
    source: `'use client'

${docblock(spec, component)}

import * as React from 'react'

type Tone = 'neutral' | 'positive' | 'warning' | 'critical'

export interface ${component}Row {
  id: string
  label: string
  detail?: string
  tone?: Tone
}

export interface ${component}Props {
  heading?: string
  intro?: string
  rows?: ${component}Row[]
  className?: string
}

/*
  Tones as complete utility classes, never assembled from fragments.
  Tailwind scans source text, so \`text-\${tone}-foreground\` produces no
  class at all — the same failure as an undefined token, and just as
  invisible in review.
*/
const TONE_CLASS: Record<Tone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  positive: 'bg-primary/10 text-primary',
  warning: 'bg-accent text-accent-foreground',
  critical: 'bg-destructive/10 text-destructive',
}

const ROWS: ${component}Row[] = [
${seed
  .map(
    (row, index) =>
      `  { id: ${JSON.stringify(`row-${index + 1}`)}, label: ${JSON.stringify(
        row.label,
      )}, detail: ${JSON.stringify(row.detail ?? todo('row detail'))}, tone: ${JSON.stringify(
        (row.tone as string) ?? 'neutral',
      )} },`,
  )
  .join('\n')}
]

export function ${component}({
  heading = ${JSON.stringify(copy(spec.content?.heading, 'panel heading'))},
  intro = ${JSON.stringify(copy(spec.content?.intro, 'one sentence of intro'))},
  rows = ROWS,
  className,
}: ${component}Props) {
  const [selected, setSelected] = React.useState<string | null>(rows[0]?.id ?? null)

  return (
    <section
      aria-labelledby="${spec.id}-heading"
      className={\`w-full bg-background px-6 py-16 \${className ?? ''}\`}
    >
      <div className="mx-auto max-w-3xl">
        <h2
          id="${spec.id}-heading"
          className="text-2xl font-semibold tracking-tight text-foreground"
        >
          {heading}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{intro}</p>

        <ul className="mt-8 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {rows.map((row) => {
            const isSelected = row.id === selected
            return (
              <li key={row.id}>
                {/*
                  A button, not a div with onClick. The row is operable, so
                  it has to be reachable by keyboard and announce its
                  selected state — aria-pressed is what carries that.
                */}
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelected(row.id)}
                  className={\`flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset \${
                    isSelected ? 'bg-muted/40' : ''
                  }\`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {row.label}
                    </span>
                    {row.detail ? (
                      <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                        {row.detail}
                      </span>
                    ) : null}
                  </span>
                  <span
                    className={\`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium \${
                      TONE_CLASS[row.tone ?? 'neutral']
                    }\`}
                  >
                    {row.tone ?? 'neutral'}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
`,
  }
}

function scaffoldFormCard(spec: BlockSpec, component: string): Scaffold {
  const fields =
    spec.content?.fields ?? [{ name: 'email', label: todo('field label'), type: 'email' }]

  return {
    server: false,
    source: `'use client'

${docblock(spec, component)}

import * as React from 'react'

export interface ${component}Props {
  heading?: string
  intro?: string
  submitLabel?: string
  /** Called with the collected values. Resolve to accept, throw to reject. */
  onSubmit?: (values: Record<string, string>) => Promise<void> | void
  className?: string
}

type Status = 'idle' | 'pending' | 'done' | 'error'

/*
  A typed array rather than \`as const\`. With \`as const\` the entries have
  different shapes - some carry a hint, some do not - so \`field.hint\` is a
  type error on the members that lack it, and the \`'hint' in field\` dance
  needed to work around that is worse than declaring the field optional once.
*/
interface ${component}Field {
  name: string
  label: string
  type: string
  hint?: string
}

const FIELDS: ${component}Field[] = [
${fields
  .map(
    (field) =>
      `  { name: ${JSON.stringify(field.name)}, label: ${JSON.stringify(
        field.label,
      )}, type: ${JSON.stringify(field.type ?? 'text')}${
        field.hint ? `, hint: ${JSON.stringify(field.hint)}` : ''
      } },`,
  )
  .join('\n')}
]

export function ${component}({
  heading = ${JSON.stringify(copy(spec.content?.heading, 'form heading'))},
  intro = ${JSON.stringify(copy(spec.content?.intro, 'why someone would fill this in'))},
  submitLabel = ${JSON.stringify(copy(spec.content?.cta, 'submit label'))},
  onSubmit,
  className,
}: ${component}Props) {
  const [status, setStatus] = React.useState<Status>('idle')
  const [message, setMessage] = React.useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const values = Object.fromEntries(
      FIELDS.map((field) => [field.name, String(data.get(field.name) ?? '')]),
    )

    setStatus('pending')
    try {
      await onSubmit?.(values)
      setStatus('done')
      setMessage('Thanks — that came through.')
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'That did not go through.')
    }
  }

  return (
    <section
      aria-labelledby="${spec.id}-heading"
      className={\`w-full bg-background px-6 py-16 \${className ?? ''}\`}
    >
      <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <h2
          id="${spec.id}-heading"
          className="text-xl font-semibold tracking-tight text-card-foreground"
        >
          {heading}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{intro}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {FIELDS.map((field) => (
            <div key={field.name}>
              {/*
                htmlFor / id rather than a wrapping label, so the hint can
                sit outside the label and still be announced — that is what
                aria-describedby is for.
              */}
              <label
                htmlFor={\`${spec.id}-\${field.name}\`}
                className="block text-sm font-medium text-foreground"
              >
                {field.label}
              </label>
              <input
                id={\`${spec.id}-\${field.name}\`}
                name={field.name}
                type={field.type}
                required
                aria-describedby={field.hint ? \`${spec.id}-\${field.name}-hint\` : undefined}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {field.hint ? (
                <p
                  id={\`${spec.id}-\${field.name}-hint\`}
                  className="mt-1 text-xs text-muted-foreground"
                >
                  {field.hint}
                </p>
              ) : null}
            </div>
          ))}

          <button
            type="submit"
            disabled={status === 'pending'}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          >
            {status === 'pending' ? 'Working…' : submitLabel}
          </button>

          {/*
            The live region is always in the DOM and starts empty. A region
            mounted at the moment it gets text is frequently not announced —
            the assistive tech never saw it become live.
          */}
          <p
            role="status"
            aria-live="polite"
            className={\`min-h-5 text-sm \${
              status === 'error' ? 'text-destructive' : 'text-muted-foreground'
            }\`}
          >
            {message}
          </p>
        </form>
      </div>
    </section>
  )
}
`,
  }
}

function scaffoldSplitFeature(spec: BlockSpec, component: string): Scaffold {
  const points = spec.content?.items ?? []
  const seed =
    points.length > 0 ? points : [{ label: todo('point'), detail: todo('one clause of detail') }]

  return {
    server: true,
    source: `${docblock(spec, component)}

import * as React from 'react'

export interface ${component}Point {
  label: string
  detail?: string
}

export interface ${component}Props {
  eyebrow?: string
  heading?: string
  intro?: string
  points?: ${component}Point[]
  /** Your own visual. Omit for the drawn panel, which needs no asset. */
  media?: React.ReactNode
  className?: string
}

const POINTS: ${component}Point[] = [
${seed
  .map(
    (point) =>
      `  { label: ${JSON.stringify(point.label)}, detail: ${JSON.stringify(
        point.detail ?? todo('one clause of detail'),
      )} },`,
  )
  .join('\n')}
]

export function ${component}({
  eyebrow = ${JSON.stringify(copy(spec.content?.eyebrow, 'eyebrow'))},
  heading = ${JSON.stringify(copy(spec.content?.heading, 'heading'))},
  intro = ${JSON.stringify(copy(spec.content?.intro, 'one sentence of intro'))},
  points = POINTS,
  media,
  className,
}: ${component}Props) {
  return (
    <section
      aria-labelledby="${spec.id}-heading"
      className={\`w-full bg-background px-6 py-16 sm:py-24 \${className ?? ''}\`}
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-primary">{eyebrow}</p>
          <h2
            id="${spec.id}-heading"
            className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          >
            {heading}
          </h2>
          <p className="mt-4 text-base text-muted-foreground">{intro}</p>

          <ul className="mt-8 space-y-4">
            {points.map((point) => (
              <li key={point.label} className="flex gap-3">
                {/*
                  currentColor, not a token in a raw colour function. These
                  are complete oklch() values, so hsl(var(--primary)) is not
                  a colour and the declaration is dropped silently.
                */}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  className="mt-0.5 size-5 shrink-0 text-primary"
                  fill="currentColor"
                >
                  <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z" />
                </svg>
                <span>
                  <span className="block text-sm font-medium text-foreground">{point.label}</span>
                  {point.detail ? (
                    <span className="mt-0.5 block text-sm text-muted-foreground">
                      {point.detail}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/*
          The drawn panel rather than an <img>. No asset to host, no layout
          shift while it loads, and it themes with the rest of the page —
          which a screenshot of somebody's light-mode dashboard does not.
        */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {media ?? (
            <div aria-hidden="true" className="space-y-3">
              <div className="h-3 w-1/3 rounded bg-primary/30" />
              <div className="h-24 rounded-lg bg-muted" />
              <div className="grid grid-cols-3 gap-3">
                <div className="h-14 rounded-lg bg-muted" />
                <div className="h-14 rounded-lg bg-muted" />
                <div className="h-14 rounded-lg bg-muted" />
              </div>
              <div className="h-3 w-2/3 rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
`,
  }
}

const SCAFFOLDS: Record<BlockShape, (spec: BlockSpec, component: string) => Scaffold> = {
  'stat-band': scaffoldStatBand,
  'list-panel': scaffoldListPanel,
  'form-card': scaffoldFormCard,
  'split-feature': scaffoldSplitFeature,
}

/* ------------------------------------------------------------------ *
 *  Wiring
 * ------------------------------------------------------------------ */

/**
 * Read a repo file as LF, remembering how it was stored.
 *
 * `catalog.ts` and `registry.tsx` are CRLF on this checkout and the source
 * files under `sources/` are LF, which is a detail nobody should have to
 * think about — except that every anchor in this file is a multi-line
 * string, and `
    category: 'Stats',
` silently matches nothing in a
 * CRLF file. The first version of this script did exactly that: it found no
 * existing record for the category, took the "new category" branch, and
 * wrote a duplicate banner into a file that already had one. It threw no
 * error. Normalising on the way in and restoring on the way out is the
 * only version of this that cannot go quietly wrong.
 */
const CRLF = '\r\n'
const LF = '\n'

function readText(path: string): { text: string; eol: string } {
  const raw = readFileSync(path, 'utf8')
  return {
    text: raw.split(CRLF).join(LF),
    eol: raw.includes(CRLF) ? CRLF : LF,
  }
}

function writeText(path: string, text: string, eol: string) {
  writeFileSync(path, eol === LF ? text : text.split(LF).join(eol))
}

/**
 * A catalog record, formatted exactly as the file's own records are.
 *
 * The indentation is load-bearing, not cosmetic:
 * `build-artifact-sources.mjs` finds ids with `/^\s{4}id: '(…)',$/gm`. A
 * record indented differently is a block the build cannot see, which
 * surfaces later as "in sources/ with no catalog.ts entry".
 */
function catalogRecord(spec: BlockSpec): string {
  const deps = spec.deps ?? []
  return `  {
    id: '${spec.id}',
    name: ${JSON.stringify(spec.name)},
    category: '${spec.category}',
    description:
      ${JSON.stringify(spec.description)},
    tags: [${spec.tags.map((t) => JSON.stringify(t)).join(', ')}],
    previewComponent: '${spec.id}',
    deps: [${deps.map((d) => JSON.stringify(d)).join(', ')}],
  },
`
}

/**
 * Insert a record into the group its category already occupies.
 *
 * Appending at the end of the array would typecheck and would quietly
 * scramble a file whose whole organisation is the banner comments. So the
 * anchor is the LAST existing record in that category, and a category with
 * no members yet gets a banner of its own before the closing bracket.
 */
function insertCatalogRecord(source: string, spec: BlockSpec): string {
  const record = catalogRecord(spec)
  const marker = `\n    category: '${spec.category}',\n`
  const last = source.lastIndexOf(marker)

  if (last === -1) {
    const close = source.lastIndexOf('\n]')
    if (close === -1) throw new Error('catalog.ts: could not find the end of BLOCK_CATALOG.')
    const banner = `\n  /* ---------------------------- ${spec.category} ${'-'.repeat(
      Math.max(4, 50 - spec.category.length),
    )} */\n`
    return `${source.slice(0, close)}\n${banner}${record}${source.slice(close)}`
  }

  const end = source.indexOf('\n  },\n', last)
  if (end === -1) throw new Error(`catalog.ts: could not find the end of the last ${spec.category} record.`)
  const at = end + '\n  },\n'.length
  return `${source.slice(0, at)}${record}${source.slice(at)}`
}

function insertRegistryEntry(source: string, spec: BlockSpec, component: string): string {
  const importLine = `import { ${component} } from './sources/${spec.id}'\n`
  const anchor = "\nexport const BLOCK_PREVIEWS: Record<string, React.ReactNode> = {\n"
  const at = source.indexOf(anchor)
  if (at === -1) throw new Error('registry.tsx: could not find BLOCK_PREVIEWS.')

  // The import goes after the last existing one, which is the line before
  // the two blank lines preceding the map.
  const withImport = `${source.slice(0, at)}${importLine}${source.slice(at)}`

  const mapStart = withImport.indexOf(anchor) + anchor.length
  const mapEnd = withImport.indexOf('\n}\n', mapStart)
  if (mapEnd === -1) throw new Error('registry.tsx: could not find the end of BLOCK_PREVIEWS.')

  const entry = `  '${spec.id}': <${component} />,\n`
  return `${withImport.slice(0, mapEnd + 1)}${entry}${withImport.slice(mapEnd + 1)}`
}

/* ------------------------------------------------------------------ *
 *  The gate
 * ------------------------------------------------------------------ */

interface Step {
  name: string
  run: () => void | Promise<void>
  /** Explains what a failure here means, printed on red. */
  meaning: string
}

function sh(command: string, commandArgs: string[]) {
  execFileSync(command, commandArgs, { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' })
}

/**
 * Is a dev server answering? The browser gate is worthless without one.
 *
 * `/api/v1/revisions?level=template` rather than the homepage: it is a
 * route handler over seven ids, so it answers in milliseconds instead of
 * compiling the landing page. The timeout is generous anyway, because a
 * cold `next dev` can spend twenty seconds on its first request and a
 * probe that gives up at five would report "no server" to someone who is
 * looking straight at one.
 */
async function devServerUp(): Promise<boolean> {
  /*
   * Three attempts, because "the connection was refused" and "the server is
   * not running" are different things and only one of them is worth
   * reporting. A `next dev` that has just been handed a changed catalog
   * tears its socket down while it recompiles, and a single-shot probe
   * lands in that window often enough to be the normal outcome rather than
   * the unlucky one — the previous version of this reported no server to
   * someone whose curl in the next terminal returned 200.
   */
  let lastError = ''

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${BASE}/api/v1/revisions?level=template`, {
        signal: AbortSignal.timeout(60_000),
      })
      if (res.ok) return true
      lastError = `HTTP ${res.status}`
    } catch (error) {
      lastError = (error as { cause?: { code?: string } }).cause?.code ?? (error as Error).message
    }
    if (attempt < 3) await new Promise((done) => setTimeout(done, 2000))
  }

  console.warn(`  (probe of ${BASE} failed three times: ${lastError})`)
  return false
}

/**
 * Wait for `/block/{slug}` to exist.
 *
 * `/block/[slug]` sets `dynamicParams = false`, so a block added to the
 * catalog 404s on its detail page for 30-60 seconds while the dev server
 * regenerates the route. That is not a wiring mistake and it is not
 * something to retry the whole gate over - but it looked exactly like a
 * broken block the first time this pipeline hit it, because the light
 * screenshot came back 404 and the dark one, taken seconds later, came back
 * 200. Polling is the documented answer; guessing a sleep is not.
 */
async function waitForBlockRoutes(ids: string[], timeoutMs = 180_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  const pending = new Set(ids)

  while (pending.size > 0 && Date.now() < deadline) {
    for (const id of [...pending]) {
      try {
        const res = await fetch(`${BASE}/block/${id}`, { signal: AbortSignal.timeout(60_000) })
        if (res.ok) {
          pending.delete(id)
          console.log(`  route live   /block/${id}`)
        }
      } catch {
        /* mid-recompile; the loop is the retry */
      }
    }
    if (pending.size > 0) await new Promise((done) => setTimeout(done, 3000))
  }

  if (pending.size > 0) {
    throw new Error(
      `/block/{id} never came up for: ${[...pending].join(', ')}. ` +
        'Either the route failed to regenerate or the block is not in the catalog.',
    )
  }
}

function gateSteps(ids: string[], browser: boolean): Step[] {
  const files = ids.map((id) => `src/lib/blocks/sources/${id}.tsx`)

  return [
    {
      name: 'drafts',
      meaning:
        'A scaffold still carries its TODO(wave) markers. The structure is done; the ' +
        'reasoning and the copy are not, and that is the half worth copying.',
      run: () => {
        const unfinished: string[] = []
        for (const id of ids) {
          const path = join(SOURCES_DIR, `${id}.tsx`)
          if (!existsSync(path)) continue
          if (readFileSync(path, 'utf8').includes(DRAFT_MARKER)) unfinished.push(id)
        }
        if (unfinished.length) {
          throw new Error(
            `still drafts: ${unfinished.join(', ')}\n\n` +
              `Each one has ${DRAFT_MARKER} markers in it. Finish the docblock and the copy, ` +
              `then re-run with --gate-only --ids=${unfinished.join(',')}.`,
          )
        }
      },
    },
    {
      name: 'typecheck',
      meaning: 'The generated source does not compile against the repo.',
      run: () => sh('npx', ['tsc', '--noEmit']),
    },
    {
      name: 'lint',
      meaning: 'ESLint rejected the new sources — often a hook rule or an unused prop.',
      run: () => sh('npx', ['eslint', ...files]),
    },
    {
      name: 'sources',
      meaning:
        'The catalog and sources/ disagree. Usually a wiring bug: an id in one place ' +
        'and not the other.',
      run: () => sh('node', ['scripts/build-artifact-sources.mjs']),
    },
    {
      name: 'server render',
      meaning: 'A block throws during a server render. Nothing downstream can pass.',
      run: () => sh('npx', ['tsx', 'scripts/build-block-markup.mts']),
    },
    {
      name: 'ids',
      meaning: 'An id collides with an existing block, page or effect.',
      run: () => sh('npx', ['tsx', 'scripts/check-duplicate-ids.mts']),
    },
    {
      name: 'registry',
      meaning:
        'A block imports something the registry cannot serve — it would compile here ' +
        'and fail in the user’s project after `shadcn add`.',
      run: () => sh('npx', ['tsx', 'scripts/check-registry.mts']),
    },
    {
      name: 'motion',
      meaning:
        'An infinite animation with no motion-safe: / motion-reduce: escape. That is a ' +
        'vestibular-safety failure, not a style note.',
      run: () => sh('npx', ['tsx', 'scripts/audit-block-motion.mts']),
    },
    {
      name: 'a11y',
      meaning: 'The accessibility audit found a violation in the new source text.',
      run: () => sh('npx', ['tsx', 'scripts/audit-a11y.mts']),
    },
    ...(browser
      ? [
          {
            name: 'browser',
            meaning:
              'THE gate. A block hydrated, was clicked, and produced a console error — ' +
              'or rendered nothing at all. This is the check that makes volume safe, and ' +
              'the only one that runs the block’s client code.',
            run: () => sh('npx', ['tsx', 'scripts/test-blocks.mts', ...ids]),
          },
          {
            name: 'routes',
            meaning:
              'The detail page for a new block never regenerated. Everything before ' +
              'this passed, so the block is fine and the dev server is not.',
            run: () => waitForBlockRoutes(ids),
          },
          ...(skipShots
            ? []
            : [
                {
                  name: 'screenshots',
                  meaning:
                    'Light and dark shots failed to capture. An invalid colour or a ' +
                    'non-200 detail page.',
                  run: () => sh('npx', ['tsx', 'scripts/shot-blocks.mts', ...ids]),
                },
              ]),
        ]
      : []),
  ]
}

/* ------------------------------------------------------------------ *
 *  Run
 * ------------------------------------------------------------------ */

function bail(message: string): never {
  console.error(`\n${message}\n`)
  process.exit(1)
}

if (!specPath && !gateOnly) {
  bail(
    'Nothing to do.\n\n' +
      '  npm run blocks:wave -- --spec=scripts/block-specs/<wave>.json\n' +
      '  npm run blocks:wave -- --gate-only --ids=a,b,c',
  )
}

/* -- gate-only ---------------------------------------------------------- */

if (gateOnly) {
  const ids = (idsArg ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  if (ids.length === 0) bail('--gate-only needs --ids=a,b,c.')

  const browser = await devServerUp()
  if (!browser) {
    console.warn(
      `\n⚠  No dev server at ${BASE} — the browser gate will be SKIPPED.\n` +
        `   That is the check that makes this safe. Start one and re-run.\n`,
    )
  }

  for (const step of gateSteps(ids, browser)) {
    console.log(`\n── ${step.name} ──────────────────────────────────────────\n`)
    try {
      await step.run()
    } catch (error) {
      console.error(`\n✗ ${step.name} failed.\n\n  ${step.meaning}\n`)
      console.error(`  ${(error as Error).message.split('\n')[0]}\n`)
      process.exit(1)
    }
  }

  console.log(`\n✓ ${ids.length} block(s) passed the gate${browser ? '' : ' (browser SKIPPED)'}.\n`)
  process.exit(browser ? 0 : 1)
}

/* -- full wave ---------------------------------------------------------- */

const specs = readSpec(specPath!)
console.log(`\n${specs.length} block(s) in ${specPath}\n`)

/*
 * Probe BEFORE touching anything.
 *
 * The first version of this asked after wiring, and got a false negative
 * every time: writing catalog.ts trips the dev server's watcher, and the
 * probe landed mid-invalidation on a socket that was being torn down. It
 * reported "no server" to someone with a server right in front of them,
 * and then rolled back a wave for no reason. Asking first is both more
 * accurate and strictly better behaviour - a wave that cannot be gated
 * should never have edited the tree in the first place.
 */
const browser = await devServerUp()

if (!browser) {
  bail(
    `No dev server at ${BASE}.

  The browser gate is the check that makes a wave safe rather than reckless,
  so this refuses to wire anything without one. Nothing has been touched.

      npm run dev          then re-run
      BASE=http://localhost:3000 npm run blocks:wave -- ...`,
  )
}


/* Snapshot before the first edit - the raw bytes, so a restore is
   byte-for-byte rather than "close enough". This is what makes a red gate a
   non-event rather than a cleanup job. */
const snapshot = {
  catalog: readFileSync(CATALOG),
  registry: readFileSync(REGISTRY),
}

const catalogFile = readText(CATALOG)
const registryFile = readText(REGISTRY)

const written: string[] = []
let wired = false

function rollback() {
  writeFileSync(CATALOG, snapshot.catalog)
  writeFileSync(REGISTRY, snapshot.registry)
  for (const path of written) rmSync(path, { force: true })

  /*
   * Only worth doing if the catalog was actually written. Before that point
   * the generated JSON still matches what is on disk, and rebuilding it
   * would be a no-op that can only fail.
   */
  if (!wired) return

  try {
    sh('node', ['scripts/build-artifact-sources.mjs'])
  } catch {
    console.error('  (could not regenerate sources after rollback - run npm run prebuild)')
  }
}

let catalogSource = catalogFile.text
let registrySource = registryFile.text

/*
 * --scaffold-only stops here, and writes to the drafts directory rather
 * than into the catalog. That is the first half of the workflow: get a
 * structurally-correct file, write the reasoning into it by hand, then run
 * the wave for real, which picks the finished draft up from here.
 */
if (scaffoldOnly) {
  mkdirSync(DRAFTS_DIR, { recursive: true })
  for (const spec of specs) {
    const component = pascal(spec.id)
    const { source } = SCAFFOLDS[spec.shape](spec, component)
    writeFileSync(join(DRAFTS_DIR, `${spec.id}.tsx`), source)
    console.log(`  drafted  ${spec.id.padEnd(34)} ${spec.shape}  ->  ${spec.category}`)
  }
  console.log(
    `\n${specs.length} draft(s) in scripts/block-drafts/, wired to nothing.\n\n` +
      `Write the docblock and the copy into each one - the gate refuses any file that\n` +
      `still contains ${DRAFT_MARKER} - then run the wave without --scaffold-only.\n`,
  )
  process.exit(0)
}

/*
 * Wiring can throw - an anchor that no longer matches, an unwritable path -
 * and a throw here is the worst place for one: sources have been written
 * into the catalog's directory and `build-artifact-sources` fails the build
 * for everyone on any file in there with no catalog entry. So the loop
 * cleans up after itself rather than leaving that for the next person.
 */
try {
  for (const spec of specs) {
    const component = pascal(spec.id)
    const draft = join(DRAFTS_DIR, `${spec.id}.tsx`)
    const fromDraft = existsSync(draft)
    const path = join(SOURCES_DIR, `${spec.id}.tsx`)

    /*
     * A finished draft wins over a fresh scaffold. Regenerating over the top
     * of a file someone spent an hour writing the reasoning into is the
     * single worst thing this script could do, so a draft is authoritative
     * whenever one exists.
     */
    const source = fromDraft
      ? readFileSync(draft, 'utf8')
      : SCAFFOLDS[spec.shape](spec, component).source

    writeFileSync(path, source)
    written.push(path)

    catalogSource = insertCatalogRecord(catalogSource, spec)
    registrySource = insertRegistryEntry(registrySource, spec, component)

    console.log(
      `  ${fromDraft ? 'from draft' : 'scaffolded'}  ${spec.id.padEnd(34)} ${spec.shape}  ->  ${spec.category}`,
    )
  }
} catch (error) {
  console.error(`\n✗ wiring failed: ${(error as Error).message}\n`)
  rollback()
  console.error('  Rolled back. Nothing was left behind.\n')
  process.exit(1)
}

writeText(CATALOG, catalogSource, catalogFile.eol)
writeText(REGISTRY, registrySource, registryFile.eol)
wired = true
console.log(`\n  wired into catalog.ts and registry.tsx\n`)

const ids = specs.map((s) => s.id)
for (const step of gateSteps(ids, true)) {
  console.log(`\n── ${step.name} ──────────────────────────────────────────\n`)
  try {
    await step.run()
  } catch (error) {
    console.error(`\n✗ ${step.name} failed — the wave is NOT promoted.\n`)
    console.error(`  ${step.meaning}\n`)
    console.error(`  ${(error as Error).message.split('\n').slice(0, 6).join('\n  ')}\n`)

    if (keepOnFailure) {
      console.error(
        `  --keep, so the ${ids.length} block(s) are left wired for you to fix.\n` +
          `  Re-run the gate with:  npm run blocks:wave -- --gate-only --ids=${ids.join(',')}\n`,
      )
    } else {
      rollback()
      console.error(`  Rolled back. catalog.ts and registry.tsx are as they were.\n`)
    }
    process.exit(1)
  }
}

/*
 * The draft has been copied into the catalog, so the copy under
 * scripts/block-drafts/ is now a second version of a shipped block that
 * nothing keeps in step. Delete it: a stale duplicate of a source file is
 * exactly the drift this repo spends its build step avoiding.
 */
for (const id of ids) rmSync(join(DRAFTS_DIR, `${id}.tsx`), { force: true })

console.log(`\n✓ ${ids.length} block(s) promoted.\n`)
console.log(`Still to do, in this same commit:\n`)
console.log(`  npm run prebuild        stats, revisions, skills, DNA, claimed counts`)
console.log(`  look at the screenshots — an invisible colour passes every check above\n`)
