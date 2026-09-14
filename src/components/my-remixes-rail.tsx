'use client'

/**
 * <MyRemixesRail> — the private lane beneath the public one.
 *
 * ── WHAT CHANGED ────────────────────────────────────────────────────────
 *
 * This used to be the whole feature: a rail of the visitor's localStorage
 * remixes, intended for /library, mounted on no page, seen by nobody. The
 * published seven now live in `<VariationsRail>`, which is server-rendered
 * and public, and this is what is left of the original job — showing a person
 * the remixes they saved themselves.
 *
 * It is scoped to one effect now rather than being a global list, because it
 * renders directly under that effect's published variations and a strip of
 * remixes of six other effects underneath them would read as more of the
 * same seven. The same entries are still in one store, keyed by effect.
 *
 * ── WHY IT IS HONEST ABOUT WHOSE THEY ARE ───────────────────────────────
 *
 * Same reason the public rail carries a byline: these sit inches below seven
 * cards that say "by Hoverlab", so the heading says "Yours" and each card is
 * marked "Saved by you". A rail of unlabelled remixes next to a rail of
 * attributed ones invites the reader to assume the top row is community work
 * and the bottom row is ours, which is exactly backwards.
 *
 * Nothing here is published. These never leave the browser — `use-remixes`
 * is localStorage with no sync — and the copy says so, because "your remixes"
 * next to a public rail could easily be read as "your remixes, now public".
 *
 * ── THE MOUNT GATE ──────────────────────────────────────────────────────
 *
 * `useRemixes` reads localStorage in a `useState` initializer, which runs on
 * the server too (returning nothing) and again on the client's first render
 * (returning entries). On the pages this was written for that was survivable.
 * This one is statically generated, so the server HTML is fixed at build time
 * and a first client render that disagreed with it is a hydration error — and
 * worse, React would discard the whole tree and re-render it, which on this
 * page means the seven scoped previews above blink. So the first client render
 * deliberately matches the build: nothing, until after mount.
 */

import * as React from 'react'
import Link from 'next/link'
import { Check, Copy, User, Wand2, X } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRemixes, type RemixEntry } from '@/hooks/use-remixes'
import { optsToHash } from '@/lib/customize'
import { namespaceKeyframes, scopeCss } from '@/lib/scope-css'
import { cn } from '@/lib/utils'

export function MyRemixesRail({ effectId }: { effectId: string }) {
  const { entries, remove } = useRemixes()

  // See the header: the build emitted nothing here, so the first client
  // render has to agree before localStorage is allowed to change the page.
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const mine = React.useMemo(
    () => entries.filter((e) => e.effectId === effectId),
    [entries, effectId],
  )

  if (!mounted || mine.length === 0) return null

  return (
    <div className="mt-5">
      <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1">
        <Wand2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <h3 className="text-sm font-semibold tracking-tight">Yours</h3>
        <Badge variant="outline" className="font-mono text-[10px]">
          {mine.length}
        </Badge>
        <p className="w-full text-xs text-muted-foreground sm:w-auto">
          Saved in this browser only — nothing here is published.
        </p>
      </div>

      {/* `relative` for the same containing-block reason as the public rail. */}
      <ul
        className="fx-no-scrollbar relative -mx-1 flex list-none gap-3 overflow-x-auto px-1 pb-2"
        role="list"
      >
        {mine.map((entry) => (
          <RemixCard
            key={entry.id}
            entry={entry}
            onRemove={() => {
              remove(entry.id)
              toast.success(`Removed your ${entry.effectName} remix`)
            }}
          />
        ))}
      </ul>
    </div>
  )
}

/* ============================================================
 *  One saved remix
 * ========================================================== */

function RemixCard({ entry, onRemove }: { entry: RemixEntry; onRemove: () => void }) {
  /*
   * `useId`, not a module-level counter. The counter this file used to carry
   * kept climbing for the life of the server process while the browser
   * restarted it at 1, so the class React rendered never matched the one it
   * hydrated against. Colons are legal in an id and not in a class name.
   */
  const wrapper = `fx-remix-${React.useId().replace(/[^a-zA-Z0-9]/g, '')}`

  /*
   * `scopeCss` from lib, not the regex this file used to inline. That regex
   * prefixed at-rule preludes as if they were selectors, producing
   * `.fx-remix-1 @keyframes spin { … }` — which browsers drop whole, so every
   * animated remix rendered frozen while still pointing at keyframes that no
   * longer existed. The shared version handles at-rules explicitly.
   */
  const scoped = React.useMemo(
    // Namespaced as well as scoped, and for a reason this lane hits sooner
    // than the public one: two saved remixes of the SAME effect declare the
    // same keyframe names at different values, and the later card's
    // definition would win for both — and for the effect's main preview above
    // them. See lib/scope-css.ts.
    () => scopeCss(namespaceKeyframes(entry.customizedCss, wrapper), wrapper),
    [entry.customizedCss, wrapper],
  )

  const summary = React.useMemo(() => {
    const parts: string[] = []
    if (entry.opts.hue !== 0) parts.push(`hue ${entry.opts.hue}°`)
    if (entry.opts.saturation !== 0) parts.push(`sat ${entry.opts.saturation}%`)
    if (entry.opts.scale !== 1) parts.push(`size ${entry.opts.scale}×`)
    if (entry.opts.speed !== 1) parts.push(`speed ${entry.opts.speed}×`)
    return parts.join(' · ') || 'default'
  }, [entry.opts])

  const [copied, setCopied] = React.useState(false)
  React.useEffect(() => {
    if (!copied) return
    const t = window.setTimeout(() => setCopied(false), 1600)
    return () => window.clearTimeout(t)
  }, [copied])

  function handleCopy() {
    const snippet = [
      '<!-- HTML -->',
      entry.html.trim(),
      '',
      '/* CSS */',
      entry.customizedCss.trim(),
    ].join('\n')
    void navigator.clipboard
      .writeText(snippet)
      .then(() => {
        setCopied(true)
        toast.success(`Copied your ${entry.effectName} remix`, {
          description: 'HTML + CSS ready to paste.',
        })
        window.dispatchEvent(new CustomEvent('hoverlab:copy-history-changed'))
      })
      .catch(() => {
        toast.error('Clipboard blocked', {
          description: 'Your browser denied clipboard access.',
        })
      })
  }

  const hash = optsToHash(entry.opts)
  const href = hash ? `/effect/${entry.effectId}#${hash}` : `/effect/${entry.effectId}`

  return (
    <li className="flex w-56 shrink-0 flex-col overflow-hidden rounded-xl border border-dashed border-border/70 bg-card/60 transition-colors hover:border-primary/40">
      {/* Decoration, like the public cards: the controls below are the real ones. */}
      <div
        inert
        aria-hidden="true"
        className={cn(
          'flex h-28 items-center justify-center overflow-hidden',
          entry.darkSurface ? 'bg-slate-950' : 'bg-muted/30',
        )}
      >
        <style dangerouslySetInnerHTML={{ __html: scoped }} />
        <div
          className={wrapper}
          style={{ transform: 'scale(0.55)', transformOrigin: 'center' }}
          dangerouslySetInnerHTML={{ __html: entry.html }}
        />
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex items-start justify-between gap-1.5">
          <h4 className="min-w-0 flex-1 truncate text-sm font-semibold">
            <Link href={href} scroll={false} className="hover:text-primary">
              {entry.effectName}
            </Link>
          </h4>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Delete your ${entry.effectName} remix`}
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-500"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        </div>

        {/* The byline, in the same slot and shape as the public cards'. */}
        <p className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <User className="h-2.5 w-2.5" aria-hidden="true" />
          Saved by you
        </p>

        <p className="truncate font-mono text-[10px] text-muted-foreground/80" title={summary}>
          {summary}
        </p>

        <Button
          size="sm"
          variant="outline"
          className="mt-auto h-7 gap-1.5 text-xs"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" /> Copy
            </>
          )}
        </Button>
      </div>
    </li>
  )
}
