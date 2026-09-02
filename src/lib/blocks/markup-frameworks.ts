/**
 * The rendered markup as a valid file in a non-React framework.
 *
 * ── A DECISION REVERSED, AND WHY ────────────────────────────────────────
 *
 * `block-markup-panel.tsx` used to say this was deliberately not offered:
 * "wrapping this markup in `<template>` would produce a file that says Vue
 * and contains no Vue". That objection is half right, and the half it gets
 * wrong is the half that matters.
 *
 * A single-file component containing only a `<template>` is not a file
 * pretending to be Vue. It is a presentational Vue component — a complete,
 * valid, idiomatic one, of the kind every codebase has dozens of. The same
 * is true of a `.svelte` file that is only markup, and an `.astro` file
 * that is only markup is not merely valid, it is the *normal* shape of an
 * Astro component.
 *
 * So the dishonesty was never in the file format. It is in the claim, and
 * the claim is the thing to be careful about. What this produces is:
 *
 *   TRUE   "the block's markup, as a component file your framework compiles"
 *   FALSE  "the block, in Vue"
 *
 * Every wrapper therefore carries the caveat in a comment at the top of the
 * file itself, not only in the UI that offered it — because the file is
 * what gets pasted into a repo and read six months later by someone who
 * never saw the page it came from.
 *
 * ── WHAT MAKES THIS CHEAP AND SAFE ──────────────────────────────────────
 *
 * The input is HTML rendered by `react-dom/server`, so it already uses
 * `class=` rather than `className=`, real attributes, and no JSX. Vue,
 * Svelte and Astro templates all accept that essentially verbatim. This is
 * a file wrapper and a comment — not a translation, not a parse, and not a
 * second rendering path that could disagree with the first.
 */

export type MarkupFramework = 'html' | 'vue' | 'svelte' | 'astro'

export const MARKUP_FRAMEWORKS: readonly MarkupFramework[] = [
  'html',
  'vue',
  'svelte',
  'astro',
] as const

export function isMarkupFramework(value: string): value is MarkupFramework {
  return (MARKUP_FRAMEWORKS as readonly string[]).includes(value)
}

interface FrameworkMeta {
  id: MarkupFramework
  label: string
  extension: string
  /** Prism/highlighter language id. */
  language: string
}

export const MARKUP_FRAMEWORK_META: Record<MarkupFramework, FrameworkMeta> = {
  html: { id: 'html', label: 'HTML', extension: 'html', language: 'html' },
  vue: { id: 'vue', label: 'Vue', extension: 'vue', language: 'html' },
  svelte: { id: 'svelte', label: 'Svelte', extension: 'svelte', language: 'html' },
  astro: { id: 'astro', label: 'Astro', extension: 'astro', language: 'html' },
}

/** Indent every line, so the markup sits correctly inside a `<template>`. */
function indent(markup: string, by = '  '): string {
  return markup
    .split('\n')
    .map((line) => (line.trim() ? by + line : line))
    .join('\n')
}

/**
 * The caveat, unindented.
 *
 * Every line is flush left here and the indentation is applied once by the
 * caller, because each wrapper prefixes its own lines differently — two
 * spaces inside an HTML comment, `// ` inside Astro frontmatter. Baking
 * indentation into the text produced a comment indented twice in three of
 * the four formats.
 */
function caveat(name: string, isInteractive: boolean): string {
  const behaviour = isInteractive
    ? [
        'This block is interactive in React and the handlers are NOT here.',
        'Buttons, toggles and menus render in their initial state and do',
        'nothing until you wire them up.',
      ]
    : ['This block has no interactive behaviour, so nothing is missing.']

  return [
    `${name} — markup from the Hoverlab catalog.`,
    '',
    'This is the block rendered once to HTML and wrapped as a component',
    'file. It is not a port of the React source: the Tailwind classes carry',
    'the design, which is the part that took the work, and they are the same',
    'in every framework.',
    '',
    ...behaviour,
  ].join('\n')
}

/** Prefix every line of a block of text, leaving blank lines bare. */
function prefixLines(text: string, prefix: string): string {
  return text
    .split('\n')
    .map((line) => (line ? prefix + line : prefix.trimEnd()))
    .join('\n')
}

export interface WrappedMarkup {
  /** Suggested filename. */
  filename: string
  language: string
  code: string
}

/**
 * Wrap rendered markup as a file the target framework compiles.
 *
 * `id` becomes the filename and `name` the human label in the comment.
 * Nothing about the markup itself is altered — see the header for why that
 * is both safe and the entire point.
 */
export function wrapMarkup(
  markup: string,
  {
    framework,
    id,
    name,
    isInteractive = false,
  }: {
    framework: MarkupFramework
    id: string
    name: string
    isInteractive?: boolean
  },
): WrappedMarkup {
  const meta = MARKUP_FRAMEWORK_META[framework]
  const filename = `${id}.${meta.extension}`
  const note = caveat(name, isInteractive)

  if (framework === 'html') {
    return {
      filename,
      language: meta.language,
      // An HTML comment rather than none: this file is the one most likely
      // to be pasted somewhere with no surrounding context at all.
      code: `<!--\n${prefixLines(note, '  ')}\n-->\n${markup}\n`,
    }
  }

  if (framework === 'vue') {
    return {
      filename,
      language: meta.language,
      /*
       * `<template>` only. No `<script setup>` block, because an empty one
       * is noise and a populated one would be inventing behaviour that is
       * not in the rendered output.
       */
      code: `<!--\n${prefixLines(note, '  ')}\n-->\n<template>\n${indent(markup)}\n</template>\n`,
    }
  }

  if (framework === 'svelte') {
    return {
      filename,
      language: meta.language,
      // Svelte's comment syntax is HTML's, and a bare-markup .svelte file
      // is a complete component.
      code: `<!--\n${prefixLines(note, '  ')}\n-->\n${markup}\n`,
    }
  }

  return {
    filename,
    language: meta.language,
    /*
     * Astro frontmatter, empty but present. An `.astro` file with no `---`
     * fence is still valid, but the fence is where a reader adds props, and
     * leaving the door open is worth two lines.
     */
    code: `---\n${prefixLines(note, '// ')}\n---\n\n${markup}\n`,
  }
}
