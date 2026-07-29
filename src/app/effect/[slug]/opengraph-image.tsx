import { ImageResponse } from 'next/og'
import { EFFECTS } from '@/lib/effects'

/**
 * Dynamic Open Graph image for each effect detail page.
 *
 * Next.js automatically picks up `opengraph-image.tsx` in a route
 * segment and serves the rendered image at /<segment>/opengraph-image.
 * The image is referenced by the `openGraph.images` metadata field
 * (set in page.tsx's generateMetadata) so that sharing /effect/<slug>
 * on Slack, Twitter, LinkedIn, etc. shows a rich card with the effect
 * name, category, and description.
 *
 * Design: 1200×630 (the de-facto OG image size). Dark gradient
 * background, large effect name, category badge, description, and a
 * "Hoverlab" wordmark in the bottom-right. No live preview — the
 * effect's HTML/CSS can't be safely rendered in the Satori/edge
 * runtime that powers ImageResponse (no DOM, limited CSS subset).
 * Instead we lean on typography + brand identity, which is what makes
 * a card recognizable in a crowded Slack/Discord feed.
 */

export const runtime = 'nodejs'
export const alt = 'Hoverlab effect'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

interface OGImageProps {
  params: Promise<{ slug: string }>
}

export default async function EffectOGImage({ params }: OGImageProps) {
  const { slug } = await params
  const effect = EFFECTS.find((e) => e.id === slug)

  // If the effect doesn't exist, render a generic "not found" card
  // rather than throwing — Next.js will still serve the image.
  const name = effect?.name ?? 'Effect not found'
  const category = effect?.category ?? 'Hoverlab'
  const description =
    effect?.description ??
    'A curated, open-source library of beautiful CSS effects.'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background:
            'linear-gradient(135deg, #0b1020 0%, #1e1b4b 50%, #0b1020 100%)',
          color: '#f8fafc',
          padding: '64px',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Decorative glow circles in the background */}
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            right: '-120px',
            width: '480px',
            height: '480px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(99,102,241,0.35) 0%, rgba(99,102,241,0) 70%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-180px',
            left: '-80px',
            width: '420px',
            height: '420px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(236,72,153,0.25) 0%, rgba(236,72,153,0) 70%)',
            display: 'flex',
          }}
        />

        {/* Top row: category badge + "CSS effect" label */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 20px',
              borderRadius: '999px',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              color: '#c7d2fe',
              fontSize: '22px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {category}
          </div>
          <div
            style={{
              display: 'flex',
              color: '#94a3b8',
              fontSize: '22px',
              fontWeight: 500,
            }}
          >
            CSS effect
          </div>
        </div>

        {/* Effect name — the visual anchor */}
        <div
          style={{
            display: 'flex',
            fontSize: '76px',
            fontWeight: 700,
            lineHeight: 1.1,
            marginTop: '40px',
            letterSpacing: '-0.02em',
            maxWidth: '1000px',
          }}
        >
          {name}
        </div>

        {/* Description */}
        <div
          style={{
            display: 'flex',
            fontSize: '28px',
            lineHeight: 1.4,
            color: '#cbd5e1',
            marginTop: '24px',
            maxWidth: '920px',
          }}
        >
          {description}
        </div>

        {/* Bottom row: brand wordmark + URL */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 'auto',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '32px',
              fontWeight: 700,
              color: '#f8fafc',
            }}
          >
            <div
              style={{
                display: 'flex',
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background:
                  'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
              }}
            >
              H
            </div>
            Hoverlab
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: '24px',
              color: '#64748b',
              fontFamily: 'monospace',
            }}
          >
            hoverlab.app/effect/{slug}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  )
}
