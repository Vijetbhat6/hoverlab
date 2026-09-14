/**
 * Resolve every glossary term's example against the real catalog.
 *
 * `catalog.ts` names an artifact by `level` + `id` and nothing else — it
 * cannot carry a name, a href or a line of CSS without going stale the first
 * time an artifact is renamed. So the illustration is looked up here, at
 * render and at build, from the same modules `/block/<id>` and `/effect/<id>`
 * read. A term whose example no longer exists cannot render a wrong name; it
 * resolves to `undefined`, and `scripts/check-glossary.mts` fails the build
 * before anyone sees it.
 *
 * ⚠️  SERVER / BUILD-TIME ONLY — it imports `@/lib/effects`, which is the
 * full 1.6 MB catalog. See the warning at the top of that module. The page
 * that uses this is a server component and the checker is a build script, so
 * neither pays for it in a browser.
 *
 * WHAT "SOMETHING YOU CAN COPY" MEANS PER RUNG
 *
 * An effect is one element and one stylesheet, so the copyable thing is the
 * CSS itself — paste it and you have the thing in the picture. A primitive or
 * a block is several files of TSX with a dependency list, and pasting 300
 * lines out of a definition list is not a workflow; the copyable thing there
 * is the install command, which puts the real files in the real project.
 *
 * That split is the honest one rather than a uniform-looking one. The page
 * says which it is on every entry, so nobody presses Copy expecting source
 * and gets a command.
 */

import 'server-only'

import { getEffect } from '@/lib/effects'
import { getBlockMeta } from '@/lib/blocks/block-index'
import { getPrimitiveMeta } from '@/lib/primitives/primitive-index'
import { installCommandFor } from '@/lib/ai-handoff'
import type { Effect } from '@/lib/effect-types'

import { GLOSSARY_TERMS, type GlossaryTerm } from './catalog'

/** What the copy button on an entry hands over. */
export interface GlossaryCopyPayload {
  /** Button text — says what arrives on the clipboard. */
  label: string
  /** Named in the toast: "Copied the CSS". */
  noun: string
  code: string
  lang: 'css' | 'bash'
}

export interface ResolvedTerm {
  term: GlossaryTerm
  /** Display name of the illustrating artifact. */
  name: string
  /** Its detail page. */
  href: string
  copy: GlossaryCopyPayload
  /**
   * The full effect record, when the example is an effect — the page needs
   * `html` to render it inline and `css` for the document-level <style>.
   * Absent for every other rung, which renders through a preview registry.
   */
  effect?: Effect
}

/**
 * Resolve one term, or `undefined` if its example has gone.
 *
 * Returning `undefined` rather than throwing is deliberate: the checker wants
 * to report every broken term in one run, not stop at the first.
 */
export function resolveTerm(term: GlossaryTerm): ResolvedTerm | undefined {
  const { level, id } = term.example

  if (level === 'effect') {
    const effect = getEffect(id)
    if (!effect) return undefined
    return {
      term,
      name: effect.name,
      href: `/effect/${effect.id}`,
      effect,
      copy: {
        label: 'Copy the CSS',
        noun: 'the CSS',
        code: effect.css,
        lang: 'css',
      },
    }
  }

  const meta = level === 'block' ? getBlockMeta(id) : getPrimitiveMeta(id)
  if (!meta) return undefined

  return {
    term,
    name: meta.name,
    href: `/${level}/${id}`,
    copy: {
      label: 'Copy the install command',
      noun: 'the command',
      code: installCommandFor(level, id),
      lang: 'bash',
    },
  }
}

/** Every term, resolved, with the broken ones dropped. */
export function resolveGlossary(): ResolvedTerm[] {
  return GLOSSARY_TERMS.map(resolveTerm).filter(
    (entry): entry is ResolvedTerm => entry !== undefined,
  )
}
