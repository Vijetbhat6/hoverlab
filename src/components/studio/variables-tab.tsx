'use client'

/**
 * Variables — the same theme in the four spellings someone actually needs.
 *
 * ── WHY FOUR AND NOT ONE ────────────────────────────────────────────────
 *
 * Because there are four different people downstream and they cannot use
 * each other's file.
 *
 *   The nine inputs       for a project scaffolded from a Hoverlab
 *                         template, which already derives its tokens from
 *                         them. Nine declarations that keep working when
 *                         the derivation improves, rather than eighty that
 *                         freeze today's arithmetic into someone else's
 *                         stylesheet.
 *
 *   The finished block    for a project with no tokens at all. Eighty-odd
 *                         `oklch()` declarations in the shadcn convention,
 *                         which is what most Tailwind projects already
 *                         speak.
 *
 *   DTCG JSON, per mode   for the designer. It is what Figma's variable
 *                         import and every plugin that does the same job
 *                         actually read.
 *
 * Handing everyone the union of those and letting them find their own line
 * is how a "copy CSS" button becomes a thing nobody trusts.
 *
 * ── THE LOSSY STEP IS ON SCREEN, NOT IN A COMMENT ───────────────────────
 *
 * The finished block is derived from the live theme through
 * `tokenGeneratorState`, and one thing does not survive: the warm/cool
 * neutral pair flattens to a single tint toward the accent hue. That is
 * stated next to the block rather than in a docblock, because the person
 * who needs to know is the one about to paste it.
 */

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight, Download } from 'lucide-react'

import { CopyCssCard } from '@/components/designer-tools/copy-css-card'
import { themeCss } from '@/lib/theme-studio'
import { tokenBlockCss, tokenDtcg, tokenScheme } from '@/lib/tools/token-css'
import { downloadText } from '@/lib/download'
import { identitySlug } from '@/lib/studio/identity'
import { TOKEN_PURPOSE } from '@/lib/studio/token-purpose'
import {
  NEUTRAL_HUE_NOTE,
  studioTokenOverrides,
  studioTokenState,
  type StudioState,
} from '@/lib/studio/state'

export interface VariablesTabProps {
  state: StudioState
}

/**
 * The token table.
 *
 * Present because the CSS blocks above answer "what do I paste" and not
 * "what is `--muted-foreground` actually for", and the second question is
 * the one that stops an agent — or a person — reaching for `bg-white`. The
 * pairing is the part worth showing: every surface token has exactly one
 * foreground token, and the table is where that becomes visible rather than
 * being a rule in a list. The lines themselves live in
 * `lib/studio/token-purpose.ts`, so a test can assert there are no gaps.
 */
function TokenTable({ state }: { state: StudioState }) {
  const tokenState = studioTokenState(state)
  /*
    Overridden the same way the CSS above is. A table that showed the
    derived `--primary` beside a code block emitting the overridden one
    would be the exact contradiction the overrides exist to remove.
  */
  const light = tokenScheme(tokenState, false, studioTokenOverrides(state.theme, false))
  const dark = tokenScheme(tokenState, true, studioTokenOverrides(state.theme, true))
  const darkValue = (name: string) => dark.tokens.find((t) => t.name === name)?.value ?? '—'

  return (
    /*
      An overflow container, and the wrapper carries `relative`. A
      `position: absolute` sr-only element inside a `static`
      `overflow-x-auto` is positioned against the nearest positioned
      ancestor instead of this box, which scrolls the whole page sideways —
      the bug this repo has already hit once.
    */
    <div className="relative overflow-x-auto rounded-xl border border-border/60">
      <table className="w-full min-w-[40rem] text-left text-xs">
        <caption className="sr-only">
          Every token, its value in each theme, and what it is for
        </caption>
        <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
          {/*
            Purpose second, the two values after it.

            The table is wider than the column it sits in, so something is
            always off the right edge and scrolled to. What was off the edge
            was "what it is for" — the only column answering the question
            this table exists for, while two columns of `oklch(0.922 0.006
            290.0)` sat in full view. The exact value is the detail; whether
            `--muted-foreground` is for captions is the point.
          */}
          <tr>
            <th scope="col" className="px-3 py-2 font-bold">
              Token
            </th>
            <th scope="col" className="px-3 py-2 font-bold">
              What it is for
            </th>
            <th scope="col" className="px-3 py-2 font-bold">
              Light
            </th>
            <th scope="col" className="px-3 py-2 font-bold">
              Dark
            </th>
          </tr>
        </thead>
        <tbody>
          {light.tokens
            .filter((t) => t.name !== '--radius')
            .map((token) => (
              <tr key={token.name} className="border-t border-border/60">
                <th scope="row" className="whitespace-nowrap px-3 py-1.5 font-mono font-normal">
                  {token.name}
                </th>
                <td className="min-w-[16rem] px-3 py-1.5 text-muted-foreground">
                  {TOKEN_PURPOSE[token.name] ?? ''}
                </td>
                <td className="whitespace-nowrap px-3 py-1.5">
                  <span className="flex items-center gap-1.5">
                    <span
                      aria-hidden
                      className="h-3.5 w-3.5 shrink-0 rounded border border-black/10"
                      style={{ background: token.value }}
                    />
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {token.value}
                    </span>
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-1.5">
                  <span className="flex items-center gap-1.5">
                    <span
                      aria-hidden
                      className="h-3.5 w-3.5 shrink-0 rounded border border-white/20 bg-neutral-900"
                      style={{ background: darkValue(token.name) }}
                    />
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {darkValue(token.name)}
                    </span>
                  </span>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}

export function VariablesTab({ state }: VariablesTabProps) {
  const slug = identitySlug(state.identity)
  const tokenState = studioTokenState(state)
  const inputs = themeCss(state.theme)
  const finished = tokenBlockCss(tokenState, undefined, (dark) =>
    studioTokenOverrides(state.theme, dark),
  )
  const name = state.identity.product || undefined
  const lightJson = tokenDtcg(tokenState, false, name, studioTokenOverrides(state.theme, false))
  const darkJson = tokenDtcg(tokenState, true, name, studioTokenOverrides(state.theme, true))

  /*
    A download rather than only a clipboard, for the two JSON files
    specifically. Figma's variable import takes a *file*; a designer handed
    a copy button has to paste it into an editor and save it under the right
    extension before Figma will look at it, and half of them will save it as
    `.txt`.
  */
  const downloads: Array<[string, string]> = [
    [`${slug}.tokens.light.json`, lightJson],
    [`${slug}.tokens.dark.json`, darkJson],
  ]

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-sm font-semibold">Paste into your stylesheet</h2>
        <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
          Two spellings of the same theme. Which one you want depends on what the
          project already has.
        </p>

        <div className="mt-3 space-y-4">
          <div>
            <CopyCssCard
              code={inputs}
              title="Nine inputs — for a project scaffolded from a Hoverlab template"
              language="css"
            />
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              These are the values the stylesheet derives its tokens from, not the
              tokens themselves — so they keep working when the derivation is
              improved, where eighty finished declarations would freeze today&rsquo;s
              arithmetic into your stylesheet.
            </p>
          </div>

          <div>
            <CopyCssCard
              code={finished}
              title="globals.css — the complete set, for a project with no tokens"
              language="css"
            />
            <p className="mt-1.5 text-[11px] text-muted-foreground">{NEUTRAL_HUE_NOTE}</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold">Import into Figma</h2>
        <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
          W3C Design Tokens (DTCG) — what Figma&rsquo;s own variable import reads when
          you drag the file in, and what Tokens Studio and the rest accept. One file
          per mode, because DTCG has no settled syntax for modes and every tool
          invented its own.
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {downloads.map(([filename, content]) => (
            <button
              key={filename}
              type="button"
              onClick={() => downloadText(content, filename, 'application/json')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Download aria-hidden className="h-3.5 w-3.5" />
              {filename}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Hex, not OKLCH — Figma has no OKLCH variable type, so an OKLCH value would
          import as a string a rectangle cannot use. The original is carried in each
          token&rsquo;s <code className="font-mono">$description</code>, so nothing is
          lost.
        </p>
      </section>

      <section>
        <h2 className="text-sm font-semibold">What each token is for</h2>
        <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
          Every surface token pairs with exactly one foreground token. That pairing is
          the whole reason both themes work without a single conditional.
        </p>
        <div className="mt-3">
          <TokenTable state={state} />
        </div>
      </section>

      <p className="border-t border-border/60 pt-4 text-xs text-muted-foreground">
        Every block, page and template in the catalog is already styled against these
        names — so pasting the block above themes all of it at once.{' '}
        <Link
          href="/blocks"
          className="inline-flex items-center gap-1 font-medium text-foreground underline underline-offset-4"
        >
          See the catalog
          <ArrowRight aria-hidden className="h-3 w-3" />
        </Link>
      </p>
    </div>
  )
}
