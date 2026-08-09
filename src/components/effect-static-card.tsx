import * as React from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PEEK_CLASS } from '@/lib/hover-peek-css'
import type { Effect } from '@/lib/effects'

/**
 * Server-rendered effect preview card.
 *
 * The client `<EffectCard>` is the full instrument — favorites, bundle,
 * compare, live customization — and it needs a whole `Effect` plus four
 * hooks to render one tile. This is the read-only counterpart for surfaces
 * that only need to *show* an effect and link to it: the category hubs and
 * `/browse`. It ships no JavaScript.
 *
 * The card is a plain <div> and the link is a stretched anchor over the
 * title, rather than an <a> wrapping the whole thing. Effect markup
 * routinely contains buttons, <details>, and its own anchors — nesting
 * those inside an <a> is invalid, and the parser restructures the DOM to
 * fix it, which shows up as a hydration mismatch on every card.
 *
 * The caller is responsible for the CSS: emit one document-level <style>
 * holding every shown effect's `css`, plus `hoverPeekCssFor(...)` for the
 * hover-to-play behaviour below. Class names are globally unique per effect
 * (`fx-<slug>-<seq>`), so concatenating them cannot collide, and one tag
 * beats a <style> per card by a wide margin at 24 cards a page.
 *
 * The card carries `PEEK_CLASS`, which is what lets the effect play its
 * hover state when the pointer is anywhere on the tile rather than exactly
 * on a 40px button in the middle of it. See `lib/hover-peek-css`.
 */
export function EffectStaticCard({ effect }: { effect: Effect }) {
  return (
    <div
      className={cn(
        PEEK_CLASS,
        'group relative flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card/60 transition-all hover:border-primary/40 hover:shadow-lg',
      )}
    >
      <div
        className={cn(
          // Grows on hover so the played effect has somewhere to go —
          // several of these translate or scale on hover and were being
          // clipped by a preview box sized for their resting state.
          'flex min-h-[180px] items-center justify-center overflow-hidden p-6 transition-[min-height] duration-300 group-hover:min-h-[220px] group-focus-within:min-h-[220px]',
          effect.darkSurface ? 'bg-slate-950' : effect.previewClass ?? 'bg-muted/30',
        )}
        // The preview is decoration; the stretched link below is the real
        // control, so nothing in here should take focus or be announced.
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: effect.html }}
      />
      <div className="border-t border-border/60 p-3">
        <div className="flex items-center gap-2">
          <h2 className="truncate text-sm font-semibold group-hover:text-primary">
            <Link
              href={`/effect/${effect.id}`}
              className="after:absolute after:inset-0 after:content-['']"
            >
              {effect.name}
            </Link>
          </h2>
          {effect.featured ? (
            <Badge variant="secondary" className="shrink-0 text-[10px]">
              Featured
            </Badge>
          ) : null}
        </div>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{effect.description}</p>
      </div>
    </div>
  )
}
