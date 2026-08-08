import * as React from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
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
 * holding every shown effect's `css`. Class names are globally unique per
 * effect (`fx-<slug>-<seq>`), so concatenating them cannot collide, and one
 * tag beats a <style> per card by a wide margin at 24 cards a page.
 */
export function EffectStaticCard({ effect }: { effect: Effect }) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card/60 transition-all hover:border-primary/40 hover:shadow-lg">
      <div
        className={cn(
          'flex min-h-[180px] items-center justify-center overflow-hidden p-6',
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
