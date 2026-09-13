/**
 * /assets/animated-icons, /assets/avatars, /assets/logos, /assets/illustrations
 *
 * Four routes, one file. The families differ in what they render and in the
 * options they offer, and not at all in what the page around them has to do.
 *
 * There is deliberately **no per-asset route.** `/assets/avatars/face-amara-okonkwo`
 * would be 2,194 prerendered pages across the four families for content that
 * takes a browser 200µs to generate, and this repo has already had one build
 * fill a disk. The selection lives in the query string instead, which is
 * shareable, which is what "linkable" actually required — and the `?item=`
 * link is one of the buttons on the panel.
 */

import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'

import { AssetBrowser, type AssetBrowserState } from '@/components/assets/asset-browser'
import {
  ASSET_FAMILIES,
  ASSET_FAMILY_META,
  type AssetFamily,
} from '@/lib/assets/asset-types'
import { absoluteUrl } from '@/lib/site'

import { FAMILY_COUNT } from '../page'

export function generateStaticParams() {
  return ASSET_FAMILIES.map((family) => ({ family }))
}

export const dynamicParams = false

interface PageProps {
  params: Promise<{ family: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function isFamily(value: string): value is AssetFamily {
  return (ASSET_FAMILIES as readonly string[]).includes(value)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { family } = await params
  if (!isFamily(family)) return { title: 'Assets not found — Hoverlab' }

  const meta = ASSET_FAMILY_META[family]
  const count = FAMILY_COUNT[family]
  const title = `${count.total.toLocaleString('en-GB')} free ${meta.label.many} — Hoverlab`

  return {
    title,
    description: meta.blurb,
    alternates: { canonical: `/assets/${family}` },
    openGraph: {
      url: absoluteUrl(`/assets/${family}`),
      title,
      description: meta.blurb,
      type: 'website',
      siteName: 'Hoverlab',
    },
    twitter: { card: 'summary_large_image', title, description: meta.blurb },
  }
}

/** Query values are strings or arrays; the browser wants one typed object. */
function initialState(
  query: Record<string, string | string[] | undefined>,
): Partial<AssetBrowserState> {
  const one = (key: string): string | undefined => {
    const value = query[key]
    return Array.isArray(value) ? value[0] : value
  }
  const out: Partial<AssetBrowserState> = {}
  const q = one('q')
  if (q) out.q = q
  const palette = one('palette')
  if (palette) out.palette = palette
  const scheme = one('scheme')
  if (scheme === 'light' || scheme === 'dark' || scheme === 'auto') out.scheme = scheme
  const motion = one('motion')
  if (motion) out.motion = motion as AssetBrowserState['motion']
  const style = one('style')
  if (style) out.style = style as AssetBrowserState['style']
  const lockup = one('lockup')
  if (lockup) out.lockup = lockup as AssetBrowserState['lockup']
  if (one('mono') === 'true') out.mono = true
  const item = one('item')
  if (item) out.item = item
  return out
}

export default async function AssetFamilyPage({ params, searchParams }: PageProps) {
  const { family } = await params
  if (!isFamily(family)) notFound()

  const meta = ASSET_FAMILY_META[family]
  const count = FAMILY_COUNT[family]
  const query = await searchParams

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/assets"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft aria-hidden className="size-4 rtl:rotate-180" />
          All free assets
        </Link>

        <header className="mt-5 max-w-3xl">
          <h1 className="type-hub capitalize">
            {count.total.toLocaleString('en-GB')} {meta.label.many}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">{meta.blurb}</p>
          {/* The shape reads as a fragment on the hub card ("372 · four
              styles × 93 names") and as a sentence here, so the capital is
              added at the point of use rather than baked into the string. */}
          <p className="mt-2 text-sm text-muted-foreground">
            {count.shape.charAt(0).toUpperCase() + count.shape.slice(1)}.
          </p>
        </header>

        <div className="mt-8">
          <AssetBrowser family={family} initial={initialState(query)} />
        </div>
      </div>
    </div>
  )
}
