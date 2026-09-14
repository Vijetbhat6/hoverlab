/**
 * /assets — the free files.
 *
 * A separate surface from the four artifact tiers, and deliberately so. An
 * effect, primitive, block, page or template is code you install: it carries
 * a licence tier, a registry entry, a props table and an a11y evidence row.
 * An avatar is a file. Putting files through that machinery would cost more
 * to maintain than the files are worth, and the point of this surface is that
 * it costs nothing to keep.
 *
 * What it is for, plainly: these are the cheapest things on the site to link
 * to and the cheapest to keep. Nobody arrives at a component catalog looking
 * for a component; they arrive looking for one avatar, one empty-state
 * drawing, one animated spinner. The hub exists so that arrival has somewhere
 * to land, and so the catalog is one click from it.
 *
 * Every count on this page is computed from the generators, never typed. The
 * headline number for the animated set is a multiplication and is rendered as
 * one, because "1,632 animated icons" is a claim and "136 icons × 12 motions"
 * is a fact the reader can check on the next page.
 */

import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, Gift } from 'lucide-react'

import { ASSET_FAMILIES, ASSET_FAMILY_META } from '@/lib/assets/asset-types'
import { ICON_GEOMETRY, ICON_MOTIONS, animatedIconCount, buildAnimatedIconSvg, buildAnimatedIconCss, iconBySlug } from '@/lib/assets/animated-icons'
import { AVATAR_SET, AVATAR_STYLES, buildAvatarSvg } from '@/lib/assets/avatars'
import { LOGO_SET, buildLogoSvg } from '@/lib/assets/logos'
import { SCENES, buildIllustrationSvg } from '@/lib/assets/illustrations'
import { absoluteUrl } from '@/lib/site'
import { ASSET_TOTAL as TOTAL, FAMILY_COUNT } from '@/lib/assets/family-count'



const TITLE = 'Free assets — animated icons, avatars, logos and illustrations — Hoverlab'
const DESCRIPTION =
  'Generated SVG assets, free for any use with no attribution: animated icons crossed from the icon browser and the motion catalog, seeded avatars that are nobody’s face, invented company logos, and isometric illustrations that adapt to light and dark in one file.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'free svg icons',
    'animated svg icons',
    'free avatars svg',
    'placeholder logos',
    'free illustrations svg',
    'dark mode illustrations',
  ],
  alternates: { canonical: '/assets' },
  openGraph: {
    url: absoluteUrl('/assets'),
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    siteName: 'Hoverlab',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

/** A few real assets per family, rendered on the server as the card art. */
function familyPreview(family: string): string[] {
  if (family === 'animated-icons') {
    return ['bell', 'heart', 'cloud', 'search'].map((slug) =>
      buildAnimatedIconSvg({ icon: iconBySlug(slug)!, motion: 'draw', size: 28 }),
    )
  }
  if (family === 'avatars') {
    return AVATAR_SET.filter((a) => a.style === 'face')
      .slice(0, 4)
      .map((a) => buildAvatarSvg({ seed: a.seed, style: a.style, size: 44 }))
  }
  if (family === 'logos') {
    return LOGO_SET.slice(0, 4).map((l) =>
      buildLogoSvg({ name: l.name, family: l.family, lockup: 'mark', height: 30 }),
    )
  }
  return SCENES.slice(0, 3).map((s) => buildIllustrationSvg({ sceneId: s.id, width: 74 }))
}

export default function AssetsHubPage() {
  // One stylesheet for the card art's motion — see `motionClass`: the class is
  // keyed by family, so four icons need one rule between them.
  const iconCss = buildAnimatedIconCss({ icon: ICON_GEOMETRY[0], motion: 'draw' })

  return (
    <div className="min-h-screen bg-background text-foreground">
      <style>{iconCss}</style>
      <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Gift aria-hidden className="h-3.5 w-3.5" />
            Free assets
          </span>
          <h1 className="type-hub mt-5">
            {TOTAL.toLocaleString('en-GB')} files nobody has to maintain
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Every asset here is generated rather than drawn one at a time, which is why the set can
            be this large and still be free. No sign-up, no attribution, no watermark — and no
            photographs of real people standing in for your fictional users.
          </p>
        </header>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {ASSET_FAMILIES.map((family) => {
            const meta = ASSET_FAMILY_META[family]
            const count = FAMILY_COUNT[family]
            return (
              <li key={family}>
                <Link
                  href={`/assets/${family}`}
                  className="group flex h-full flex-col gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
                >
                  <div className="flex min-h-16 flex-wrap items-center gap-4">
                    {familyPreview(family).map((svg, i) => (
                      <span
                        key={i}
                        className="flex items-center justify-center text-foreground"
                        // Generated in this module from a closed set of
                        // parameters — nothing here comes from a request.
                        dangerouslySetInnerHTML={{ __html: svg }}
                      />
                    ))}
                  </div>

                  <div>
                    <h2 className="flex items-center gap-2 text-base font-semibold capitalize">
                      {meta.label.many}
                      <ArrowRight
                        aria-hidden
                        className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:rotate-180"
                      />
                    </h2>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {meta.blurb}
                    </p>
                  </div>

                  <p className="mt-auto text-xs text-muted-foreground">
                    <strong className="font-semibold text-foreground">
                      {count.total.toLocaleString('en-GB')}
                    </strong>{' '}
                    · {count.shape} · {meta.formats.join(', ').toUpperCase()}
                  </p>
                </Link>
              </li>
            )
          })}
        </ul>

        <section className="mt-12 rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold">Why these are generated and not drawn</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            A hand-made set of 370 avatars is 370 files, and a palette change is 370 edits. A set
            that ships light and dark separately is two files per picture and one permanent way to
            link the wrong one. Here each family is a renderer plus a table of parameters: the
            catalog’s size is a number in a loop, light and dark are decided by the reader inside a
            single file, and the seed you pass is the asset you get back, forever.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            If you need something the options do not cover, the components that build these ship in
            the catalog too — the{' '}
            <Link className="underline underline-offset-4" href="/primitives">
              frames and mocks
            </Link>{' '}
            wrap your own screenshots, and{' '}
            <Link className="underline underline-offset-4" href="/tools/icons">
              the icon browser
            </Link>{' '}
            is where the animated set gets its geometry.
          </p>
        </section>
      </div>
    </div>
  )
}
