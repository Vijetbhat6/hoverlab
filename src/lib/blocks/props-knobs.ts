/**
 * Which of a block's props can be turned into a control, and what their
 * defaults actually are.
 *
 * `props-table.ts` reads a block's props out of its own source and hands
 * back the TYPE and the DEFAULT as they were WRITTEN — `"'Ship faster'"`,
 * `"3"`, `"true"`, strings every one of them, because they came out of a
 * file rather than out of a module. A table can print those as-is. A
 * control cannot: a text field needs `Ship faster` without the quotes, a
 * switch needs a boolean, and a number input needs a number.
 *
 * So this is the second half of that parse — source text to a value — and
 * it is deliberately separate from the first. `props-table.ts` is about
 * what a block accepts and is read by a table that must never be wrong;
 * this is about what a panel can safely offer, and its correct answer is
 * often "nothing", which would be a bug in the other one.
 *
 * ── WHAT IT REFUSES ─────────────────────────────────────────────────────
 *
 * A prop becomes a knob only when its type is one of four shapes AND its
 * default parses cleanly. Everything else — arrays, objects, render props,
 * callbacks, `React.ReactNode`, anything whose default spans lines — is
 * left to the table below the panel.
 *
 * That is not a gap to be closed later. A `Facet[]` needs a JSON editor to
 * be worth anything, and a JSON editor inside a card on a detail page is a
 * worse way to edit an array than the reader's own editor, where the array
 * is going anyway. The panel's job is to answer "what does this look like
 * with my words in it", which the four simple shapes cover.
 *
 * A prop with no parseable default is refused too, even when its type
 * fits. The panel renders the real component, and starting it from a
 * guessed value would show the reader a block that does not match the
 * source printed underneath it.
 */

import type { BlockProp } from './props-table'

export type Knob =
  | { name: string; kind: 'string'; value: string; description: string | null }
  | { name: string; kind: 'number'; value: number; description: string | null }
  | { name: string; kind: 'boolean'; value: boolean; description: string | null }
  | {
      name: string
      kind: 'enum'
      value: string
      options: string[]
      description: string | null
    }

/** `'Ship faster'` or `"Ship faster"` → `Ship faster`. */
function stringLiteral(raw: string): string | null {
  // `[\s\S]` rather than the `s` flag: this file compiles to a target older
  // than es2018, where `dotAll` is a syntax error.
  const match = /^(['"])([\s\S]*)\1$/.exec(raw.trim())
  if (!match) return null
  // Only the escapes a catalog string actually uses. A general unescaper
  // here would be pretending to be a parser again.
  return match[2].replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\')
}

/** The members of `'a' | 'b' | 'c'`, or null when it is not that shape. */
function unionMembers(type: string): string[] | null {
  const parts = type.split('|').map((part) => part.trim())
  if (parts.length < 2) return null

  const members: string[] = []
  for (const part of parts) {
    const value = stringLiteral(part)
    if (value === null) return null
    members.push(value)
  }
  return members
}

/**
 * The knobs for one block's props, in the order they should be rendered.
 *
 * `className` is dropped rather than offered as a text field: typing
 * Tailwind classes into a box to see them applied is a worse version of
 * the editor the reader already has, and it is the one prop that can break
 * the panel's own layout.
 */
export function knobsFor(props: BlockProp[]): Knob[] {
  const knobs: Knob[] = []

  for (const prop of props) {
    if (prop.name === 'className') continue
    if (!prop.defaultValue) continue

    const type = prop.type.trim()
    const raw = prop.defaultValue.trim()
    const description = prop.description

    if (type === 'string') {
      const value = stringLiteral(raw)
      if (value !== null) knobs.push({ name: prop.name, kind: 'string', value, description })
      continue
    }

    if (type === 'number') {
      const value = Number(raw)
      if (raw !== '' && Number.isFinite(value)) {
        knobs.push({ name: prop.name, kind: 'number', value, description })
      }
      continue
    }

    if (type === 'boolean') {
      if (raw === 'true' || raw === 'false') {
        knobs.push({ name: prop.name, kind: 'boolean', value: raw === 'true', description })
      }
      continue
    }

    const options = unionMembers(type)
    if (options) {
      const value = stringLiteral(raw)
      // A default outside its own union means the parse went wrong
      // somewhere — a select whose current value is not one of its options
      // is a broken control, so the prop goes to the table instead.
      if (value !== null && options.includes(value)) {
        knobs.push({ name: prop.name, kind: 'enum', value, options, description })
      }
    }
  }

  return knobs
}

/**
 * One attribute, as it would be written in the JSX — including the `=`.
 *
 * Booleans never reach here: they are the one kind whose off state is not
 * an assignment at all, so `jsxCall` writes them itself.
 */
function attribute(knob: Knob, value: unknown): string {
  if (knob.kind === 'number') return `${knob.name}={${value}}`
  const text = String(value).replace(/"/g, '&quot;')
  return `${knob.name}="${text}"`
}

/**
 * The call the reader would write to get what they are looking at.
 *
 * Only props they have actually CHANGED appear. A call listing all
 * fourteen props at their defaults is not the shortest thing that
 * reproduces the preview, and it teaches the reader that the block needs
 * fourteen props when the whole design is that it needs none.
 *
 * A boolean turned on prints as the bare prop (`dark`), which is how it is
 * written; turned off it prints `dark={false}`, which is only reached when
 * the block's own default was true.
 */
export function jsxCall(
  exportName: string,
  knobs: Knob[],
  values: Record<string, unknown>,
): string {
  const changed = knobs.filter((knob) => values[knob.name] !== knob.value)

  if (changed.length === 0) return `<${exportName} />`

  const attrs = changed.map((knob) => {
    const value = values[knob.name]
    if (knob.kind === 'boolean') return value ? knob.name : `${knob.name}={false}`
    return attribute(knob, value)
  })

  // One per line past the first: a hero with three prose props on one line
  // is a 300-character line nobody can read in a code block.
  if (attrs.length === 1) return `<${exportName} ${attrs[0]} />`
  return `<${exportName}\n  ${attrs.join('\n  ')}\n/>`
}
