'use client'

/**
 * Code Converter — HTML to JSX, Vue, Svelte, styled-components, Tailwind.
 *
 * The engine under this page is not new. `lib/export/` has converted every
 * effect in the catalog to five frameworks for months; the detail pages,
 * the ZIP builder, `/api/v1`, the CLI and the MCP server all call it. What
 * was missing was a door: the conversion only ever ran on *our* markup,
 * reachable only by someone already looking at a Hoverlab effect.
 *
 * This is the door, and the reason to open it is that "html to jsx" is the
 * single biggest search term in this category — a person with a snippet
 * and a React app, who has never heard of us and does not want a component
 * library. They get the real converter, ungated, on their own code.
 *
 * WHY NOTHING HERE IS BEHIND THE PAYWALL
 *
 * The catalog's export menu gates Vue, Svelte, styled-components and
 * Tailwind behind Pro, and that gate is about *the catalog's* artifacts —
 * translations of work we did. Nothing on this page is our work. Charging
 * to convert a visitor's own paste would be charging rent on their code,
 * which is a different and much worse proposition than the one /license
 * sells.
 *
 * WHAT MAKES IT WORTH USING TWICE
 *
 * The warnings. Every converter in the search results will rename `class`
 * to `className`; the failures that cost an afternoon are the ones that
 * compile and then misbehave — a dropped `<script>`, an `onclick` that
 * never fires, `!important` that cannot survive a React style object. All
 * of those are computed from the actual input in `lib/export/convert.ts`
 * and shown next to the output rather than as a footnote.
 */

import * as React from 'react'
import Link from 'next/link'
import { AlertTriangle, Braces, Info, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { CopyCssCard } from '@/components/designer-tools/copy-css-card'
import { ToolLayout } from '@/components/designer-tools/tool-layout'
import { ToolPresetsBar } from '@/components/designer-tools/tool-presets-bar'
import { UseInCatalog } from '@/components/designer-tools/use-in-catalog'
import { useToolState } from '@/hooks/use-tool-state'
import {
  CONVERT_TARGETS,
  type ConvertTarget,
  convertSource,
  isConvertTarget,
} from '@/lib/export/convert'
import { cn } from '@/lib/utils'

const TOOL = '/tools/convert'

interface ConvertState {
  html: string
  css: string
  name: string
  target: ConvertTarget
}

/**
 * The example is chosen to fail interestingly.
 *
 * A clean `<div class="card">` would convert without a single warning,
 * which teaches a first-time visitor nothing about what this does that a
 * regex would not. This one has an inline style, an `onclick`, an SVG with
 * camelCase that must survive, and a `for` on a label — so the warnings
 * panel has something to say the moment the page loads.
 */
const SAMPLE_HTML = `<div class="card" style="--accent: #6d28d9; padding: 24px">
  <svg class="card__icon" viewBox="0 0 24 24" fill="none" stroke-width="2">
    <defs>
      <linearGradient id="g" gradientUnits="userSpaceOnUse">
        <stop stop-color="#6d28d9" />
      </linearGradient>
    </defs>
    <path d="M12 2 L22 20 H2 Z" stroke="url(#g)" stroke-linecap="round" />
  </svg>
  <h3 class="card__title">Ship it</h3>
  <p class="card__body">Paste markup on the left. Take a component away.</p>
  <label class="card__check" for="ok">
    <input id="ok" type="checkbox" checked>
    Ready to go
  </label>
  <button class="card__btn" onclick="ship()">Deploy</button>
</div>`

const SAMPLE_CSS = `.card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
}

.card__title {
  font-size: 1.125rem;
  font-weight: 700;
}

.card__btn {
  align-self: flex-start;
  border-radius: 8px;
  padding: 8px 16px;
  color: #ffffff;
  background: var(--accent);
  transition: transform 150ms ease;
}

.card__btn:hover {
  transform: translateY(-1px);
}`

const DEFAULT_STATE: ConvertState = {
  html: SAMPLE_HTML,
  css: SAMPLE_CSS,
  name: 'Card',
  target: 'react',
}

const TARGET_LABEL: Record<ConvertTarget, string> = {
  react: 'JSX / React',
  vue: 'Vue',
  svelte: 'Svelte',
  'styled-components': 'styled-components',
  tailwind: 'Tailwind',
}

const TARGET_BLURB: Record<ConvertTarget, string> = {
  react:
    'A single .tsx file that runs as .jsx too — there are no type annotations to strip. Attributes are renamed, inline styles become objects, and the stylesheet ships in a <style> tag so your selectors resolve exactly as they did.',
  vue: 'A single-file component with scoped styles. The template keeps HTML spelling, so class and for stay as you wrote them.',
  svelte:
    'Markup plus a scoped <style>. Svelte prunes selectors it cannot statically match — wrap those in :global(...) if the compiler complains.',
  'styled-components':
    'The root class becomes &, keyframes are hoisted into keyframes helpers so their names cannot collide, and the whole stylesheet nests inside the component.',
  tailwind:
    'Your markup with utility classes applied in place. Anything without a utility becomes an arbitrary value or an arbitrary property rather than being dropped — a companion stylesheet carries whatever genuinely cannot be a class.',
}

export default function ConvertToolPage() {
  const tool = useToolState<ConvertState>(TOOL, DEFAULT_STATE)
  const { state, setState } = tool

  const update = (patch: Partial<ConvertState>) => setState((s) => ({ ...s, ...patch }))

  // A stored preference from an older visit could name a target that no
  // longer exists; fall back rather than throwing in the switch.
  const target: ConvertTarget = isConvertTarget(state.target) ? state.target : 'react'

  const result = React.useMemo(
    () => convertSource({ html: state.html, css: state.css, name: state.name }, target),
    [state.html, state.css, state.name, target],
  )

  const empty = !state.html.trim()

  return (
    <ToolLayout
      name="HTML to JSX Converter"
      tagline="Paste markup and CSS, take away a component — React, Vue, Svelte, styled-components or Tailwind"
      icon={<Braces className="h-5 w-5" />}
    >
      <div className="space-y-6">
        {/* Target first: it changes what the output pane means, so it
            cannot sit underneath it. */}
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4">
          <div
            role="group"
            aria-label="Output framework"
            className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-5"
          >
            {CONVERT_TARGETS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => update({ target: id })}
                aria-pressed={target === id}
                className={cn(
                  'rounded-lg border px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  target === id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-muted/50',
                )}
              >
                {TARGET_LABEL[id]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="cv-name" className="text-xs text-muted-foreground">
              Component
            </Label>
            <input
              id="cv-name"
              value={state.name}
              onChange={(e) => update({ name: e.target.value })}
              spellCheck={false}
              className="h-9 w-36 rounded-md border border-border bg-background px-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Input */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="cv-html" className="text-sm font-medium">
                  HTML
                </Label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    onClick={() => update({ html: SAMPLE_HTML, css: SAMPLE_CSS, name: 'Card' })}
                  >
                    Load an example
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    onClick={() => update({ html: '', css: '' })}
                  >
                    <Trash2 className="h-3 w-3" /> Clear
                  </button>
                </div>
              </div>
              <textarea
                id="cv-html"
                spellCheck={false}
                value={state.html}
                onChange={(e) => update({ html: e.target.value })}
                rows={18}
                placeholder="Paste a fragment, or a whole page — the <style> is lifted out for you and the document shell is dropped."
                className="w-full resize-y rounded-lg border border-border bg-background p-4 font-mono text-xs leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="cv-css" className="text-sm font-medium">
                  CSS <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Link
                  href="/tools/tailwind"
                  className="text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  Stylesheet on its own? Use the Tailwind translator
                </Link>
              </div>
              <textarea
                id="cv-css"
                spellCheck={false}
                value={state.css}
                onChange={(e) => update({ css: e.target.value })}
                rows={12}
                placeholder="Leave empty to convert markup only — the class names are kept either way."
                className="w-full resize-y rounded-lg border border-border bg-background p-4 font-mono text-xs leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          {/* Output */}
          <div className="space-y-4">
            {empty ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/20 px-5 py-12 text-center">
                <p className="text-sm font-medium">Nothing to convert yet</p>
                <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
                  Paste markup on the left. Everything runs in this tab — nothing you
                  paste is uploaded, logged or sent anywhere.
                </p>
              </div>
            ) : (
              result.files.map((file) => (
                <CopyCssCard
                  key={file.path}
                  code={file.code}
                  title={file.path}
                  language={file.language}
                />
              ))
            )}

            {/* The findings. These are about the paste, and they are the
                reason to use this rather than a find-and-replace. */}
            {result.warnings.length ? (
              <div className="overflow-hidden rounded-xl border border-amber-500/40 bg-amber-500/5">
                <div className="flex items-center gap-2 border-b border-amber-500/30 px-4 py-2.5">
                  <AlertTriangle
                    className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400"
                    aria-hidden
                  />
                  <h2 className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                    What changed on the way through
                  </h2>
                </div>
                <ul className="divide-y divide-amber-500/20">
                  {result.warnings.map((warning, i) => (
                    <li
                      key={i}
                      className="px-4 py-2.5 text-[11px] leading-relaxed text-amber-900 dark:text-amber-200"
                    >
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            ) : !empty ? (
              <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-[11px] leading-relaxed text-emerald-800 dark:text-emerald-300">
                Converted with nothing lost and nothing rewritten beyond attribute
                names — no scripts, no inline handlers, no style strings in this input.
              </p>
            ) : null}

            {result.notes.length && !empty ? (
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2.5">
                  <Info className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                  <h2 className="text-xs font-semibold">
                    Worth knowing about {TARGET_LABEL[target]}
                  </h2>
                </div>
                <ul className="divide-y divide-border/60">
                  {result.notes.map((note, i) => (
                    <li
                      key={i}
                      className="px-4 py-2.5 text-[11px] leading-relaxed text-muted-foreground"
                    >
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {TARGET_BLURB[target]}
            </p>
          </div>
        </div>

        {/* Said once, plainly. Every converter in the search results claims
            to be lossless; this one says where the edges are. */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-muted/20 px-5 py-4">
            <h2 className="text-sm font-semibold">It runs in your tab</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              No request is made with what you paste. The same module runs in our API
              and CLI, so the conversion here is byte-for-byte the one an agent gets —
              it is just running on your machine instead of ours.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-muted/20 px-5 py-4">
            <h2 className="text-sm font-semibold">It is not a compiler</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              Markup and CSS convert. JavaScript does not: a{' '}
              <code className="font-mono">&lt;script&gt;</code> is removed and inline
              handlers become arrow functions around your original code, which still
              needs whatever it referred to before.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-muted/20 px-5 py-4">
            <h2 className="text-sm font-semibold">Free, and staying that way</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              Every target here is ungated. The catalog gates some of its own exports;
              this page is your code, and charging rent on your paste is not a business
              we are in.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
          <UseInCatalog tool={TOOL} />
          <ToolPresetsBar tool={tool} noun="snippet" />
        </div>
      </div>
    </ToolLayout>
  )
}
