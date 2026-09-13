/**
 * A block's props, parsed out of its own source.
 *
 * ── WHY THIS IS A TABLE AND NOT A PLAYGROUND ────────────────────────────
 *
 * The obvious version of this feature is interactive: sliders and text
 * fields that re-render the preview with different props, and a copy button
 * that emits the call. It is not what shipped, and the reason is structural
 * rather than a lack of appetite.
 *
 * `blocks/registry.tsx` maps ids to *elements* — `<HeroSplit />`, already
 * constructed — not to component types. That is deliberate and documented:
 * building elements at module load is what makes their identity stable, and
 * looking a component type out of a map to instantiate inside a render is
 * the exact pattern `react-hooks/static-components` exists to catch. An
 * interactive playground needs component types, so it needs that registry
 * inverted, and inverting it would trade a real correctness property for a
 * control.
 *
 * A props table is what component libraries actually ship, it answers the
 * question people open the page with — "what can I change?" — and being
 * derived from the source means it cannot drift from the code the way a
 * hand-written table does. That is worth more than sliders.
 *
 * ── WHY PARSED AND NOT DECLARED ─────────────────────────────────────────
 *
 * Every block already states its props twice: once in an exported interface
 * and once as destructuring defaults in the signature. A third declaration,
 * in the catalog, would be a copy that goes stale the first time somebody
 * renames a prop — and nothing would report it. Reading the two that already
 * exist means the table is either correct or absent.
 *
 * ── WHAT IT DOES NOT HANDLE ─────────────────────────────────────────────
 *
 * A regex is not a TypeScript parser and this does not pretend to be one.
 * Multi-line object types, generics with line breaks and conditional types
 * are skipped rather than mangled — `parseBlockProps` returns only rows it
 * is confident about, and the caller renders nothing when it finds none.
 * The catalog is written in a consistent house style, so in practice that
 * covers all of it; the failure mode when it does not is a missing row, not
 * a wrong one.
 */

export interface BlockProp {
  name: string
  /** The declared type, as written. */
  type: string
  required: boolean
  /** Default from the destructuring signature, as written, or null. */
  defaultValue: string | null
  /** The `/** … *\/` comment above the prop, flattened to one line. */
  description: string | null
}

/** Find the body of a brace-delimited block starting at `open`. */
function blockBody(source: string, open: number): string | null {
  let depth = 0
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++
    else if (source[i] === '}') {
      depth--
      if (depth === 0) return source.slice(open + 1, i)
    }
  }
  return null
}

/**
 * The props declaration body, or bodies.
 *
 * ── THE THREE SHAPES THIS HAS TO READ ───────────────────────────────────
 *
 * This was anchored on `export interface <Something>Props {`, which is what
 * every *block* in the catalog uses. The primitive tier writes props three
 * other ways, and each one silently produced an empty table:
 *
 *     export interface BadgeProps extends React.HTMLAttributes<…> {
 *     export interface InputGroupProps
 *       extends Omit<React.InputHTMLAttributes<…>, 'size'> {
 *     export type ButtonProps = BaseProps & (…)
 *
 * The first two are one fix: allow a heritage clause, across a line break,
 * before the brace. A heritage clause cannot contain a `{`, so `[^{]` skips
 * it without any attempt to parse generics.
 *
 * ── WHY AN ALIAS RESOLVES ONE HOP, AND NOT INTO ITS INLINE OBJECTS ──────
 *
 * `ButtonProps` holds no members of its own; they live in the `BaseProps`
 * alias it intersects. So an alias is followed to the local types it names
 * and their object bodies are read.
 *
 * What is deliberately not read is an inline object literal in the alias —
 * the `({ size: 'icon'; 'aria-label': string } | { size?: … })` union on
 * Button. Those branches are single-line and semicolon-separated, and the
 * line reader below would turn the first into a prop named `size` whose
 * type is `'icon'; 'aria-label': string`. Worse, a union declares the same
 * prop twice with different types, so rendering it honestly means two
 * contradictory rows.
 *
 * The cost is that Button's `size` is missing from its table. That is this
 * file's documented failure mode — a missing row, never a wrong one — and
 * it is the right side to err on.
 */
function propsInterface(source: string): string[] {
  const bodies: string[] = []

  const declared = /export interface \w*Props(?:\s+extends\s+[^{]+)?\s*\{/.exec(source)
  if (declared) {
    const body = blockBody(source, declared.index + declared[0].length - 1)
    if (body) bodies.push(body)
    return bodies
  }

  /*
    The alias runs to the next blank line or top-level declaration — or to
    the end of the file, which is the `$` and is not decoration: a source
    whose last line is the alias matched none of the other terminators and
    came back with no props at all.
  */
  const alias = /export type (\w*Props)\s*=([\s\S]*?)(?:\n\n|\nexport |\nfunction |$)/.exec(source)
  if (!alias) return bodies

  /*
    Every locally declared type the alias names, in the order it names them.

    Restricted to identifiers that actually have a `type X = … {` of their
    own in this file, so `Omit`, `Exclude`, `React` and the like are skipped
    by simply never matching.
  */
  const seen = new Set<string>()
  for (const [, name] of alias[2].matchAll(/\b([A-Z]\w*)\b/g)) {
    if (seen.has(name) || name === alias[1]) continue
    seen.add(name)
    /*
      `[^{\n]` and not `[^{]`: the brace must open on the declaration's own
      line.

      Unbounded, this walks past a type that has no object body at all and
      binds to the next `{` anywhere below it. On Button that meant
      `type Size = 'sm' | 'md' | …` matching forward into the
      `const VARIANTS = {` style map, and the table sprouted rows called
      `primary`, `secondary`, `outline` and `ghost` — CSS class names
      presented as props. Wrong rows, which is the one thing this file
      promises never to produce.
    */
    const local = new RegExp(String.raw`(?:export )?type ${name}\s*=[^{\n]*\{`).exec(source)
    if (!local) continue
    const body = blockBody(source, local.index + local[0].length - 1)
    if (body) bodies.push(body)
  }

  return bodies
}

/**
 * Defaults, from the component's destructuring signature.
 *
 * `name = 'value'` at one level of nesting only. A default that is itself an
 * object or an arrow function spans lines and is skipped — the type column
 * already tells the reader it is an object, and a truncated default is worse
 * than none.
 */
function defaultsFrom(source: string): Map<string, string> {
  const out = new Map<string, string>()

  const match = /export function \w+\(\s*\{/.exec(source)
  if (!match) return out

  const body = blockBody(source, match.index + match[0].length - 1)
  if (!body) return out

  /*
   * Rejoin a default that the formatter wrapped.
   *
   * Prettier breaks after the `=` when the value is long, which is common
   * for the prose defaults this catalog uses:
   *
   *     subheading =
   *       'One toolkit for the parts every project needs, …',
   *
   * Read line by line, that is a name with no value followed by an orphan
   * string, and the prop came back with no default at all.
   */
  const joined = body.replace(/=\s*\n\s*/g, '= ')

  for (const line of joined.split('\n')) {
    const entry = /^\s*(\w+)\s*=\s*(.+?),?\s*$/.exec(line)
    if (!entry) continue

    const [, name, raw] = entry
    const value = raw.replace(/,$/, '').trim()

    // An unbalanced value is the first line of a multi-line default.
    const balanced =
      (value.match(/\{/g)?.length ?? 0) === (value.match(/\}/g)?.length ?? 0) &&
      (value.match(/\(/g)?.length ?? 0) === (value.match(/\)/g)?.length ?? 0) &&
      (value.match(/\[/g)?.length ?? 0) === (value.match(/\]/g)?.length ?? 0)

    if (balanced && value.length <= 80) out.set(name, value)
  }

  return out
}

/**
 * Flatten a `/** … *\/` comment to one line of prose.
 *
 * Each line is stripped of its leading `*` BEFORE the lines are joined. The
 * first version joined first and then ran the strip with the `m` flag, which
 * matches line starts — and after joining there are none, so every
 * continuation marker survived into the middle of the sentence.
 */
function flattenDoc(lines: string[]): string | null {
  const text = lines
    .map((line) =>
      line
        .replace(/^\/\*\*/, '')
        .replace(/\*\/$/, '')
        .replace(/^\s*\*\s?/, '')
        .trim(),
    )
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()

  return text || null
}

export function parseBlockProps(source: string): BlockProp[] {
  const bodies = propsInterface(source)
  if (bodies.length === 0) return []

  const defaults = defaultsFrom(source)
  const props: BlockProp[] = []
  // An alias can name two locals that both declare the same prop.
  // First declaration wins, so no prop can appear in the table twice.
  const claimed = new Set<string>()

  let pendingDoc: string[] = []
  let inComment = false

  for (const rawLine of bodies.join('\n').split('\n')) {
    const line = rawLine.trim()
    if (!line) continue

    // Comment accumulation. Both `/** one line */` and the block form.
    if (line.startsWith('/**')) {
      pendingDoc = [line]
      inComment = !line.includes('*/')
      continue
    }
    if (inComment) {
      pendingDoc.push(line)
      if (line.includes('*/')) inComment = false
      continue
    }
    if (line.startsWith('//')) continue

    const entry = /^(\w+)(\?)?:\s*(.+?);?$/.exec(line)
    if (!entry) {
      // Not a prop we understand — an opening brace of a nested object type,
      // a continuation line. Drop any comment so it cannot attach to the
      // wrong prop further down.
      pendingDoc = []
      continue
    }

    const [, name, optional, type] = entry
    if (claimed.has(name)) {
      pendingDoc = []
      continue
    }
    claimed.add(name)

    props.push({
      name,
      type: type.trim(),
      required: !optional,
      defaultValue: defaults.get(name) ?? null,
      description: flattenDoc(pendingDoc),
    })

    pendingDoc = []
  }

  return props
}

/**
 * Props worth showing, in the order they are worth showing.
 *
 * `className` is on every block and is the least interesting thing about
 * any of them, so it sorts last rather than appearing first by alphabet or
 * by declaration. Nothing is hidden — a table that quietly omitted a prop
 * would send someone to the source to find out why it did not work.
 */
export function sortBlockProps(props: BlockProp[]): BlockProp[] {
  return [...props].sort((a, b) => {
    if (a.name === 'className') return 1
    if (b.name === 'className') return -1
    if (a.required !== b.required) return a.required ? -1 : 1
    return 0
  })
}
