import { ImageResponse } from 'next/og'
import { siteUrl } from '@/lib/site'
import type { ArtifactLevel } from '@/lib/artifact-types'

/**
 * The shared Open Graph card, rendered by every tier's
 * `opengraph-image.tsx`.
 *
 * Next.js picks up an `opengraph-image` file in a route segment and serves
 * the rendered PNG at /<segment>/opengraph-image, wiring it into that
 * segment's `openGraph.images` automatically. Four tiers plus three hubs
 * means seven of those files, and the alternative to this module was seven
 * copies of the same 200 lines of inline styles — which in practice means
 * six of them drifting out of date.
 *
 * Design: 1200×630 (the de-facto OG size). Dark gradient, tier-tinted
 * glow, category chip, large name, description, brand wordmark. No live
 * preview of the artifact itself: `ImageResponse` renders through Satori,
 * which has no DOM and supports only a subset of CSS, so a block's real
 * markup can't be trusted to render — and a card that renders *wrongly*
 * is worse than one that doesn't try. Typography and brand identity are
 * what make a card recognizable in a crowded Slack feed anyway.
 *
 * Satori notes for anyone editing the layout below:
 *   - every element with more than one child needs an explicit `display`
 *   - there is no `text-overflow`, hence `clamp()` on the copy
 *   - `position: absolute` works, but z-order follows document order
 */

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'

/**
 * Per-tier accent, so the four rungs of the ladder are distinguishable at
 * thumbnail size. Shared hue family with the brand, different anchor —
 * a template card should not be mistakable for an effect card when three
 * of them land in the same channel.
 */
const ACCENTS: Record<ArtifactLevel, { glow: string; wash: string; chip: string; text: string }> = {
  effect: { glow: '99,102,241', wash: '236,72,153', chip: '99,102,241', text: '#c7d2fe' },
  block: { glow: '16,185,129', wash: '99,102,241', chip: '16,185,129', text: '#a7f3d0' },
  page: { glow: '245,158,11', wash: '236,72,153', chip: '245,158,11', text: '#fde68a' },
  template: { glow: '168,85,247', wash: '244,63,94', chip: '168,85,247', text: '#e9d5ff' },
}

/**
 * Host shown in the card's bottom-right, derived from the canonical origin
 * rather than hard-coded.
 *
 * A literal here would be a third place the production domain is written
 * down, and the one nobody thinks to update — the card would keep quoting
 * a dead host long after the real one moved. See `src/lib/site.ts`.
 */
const HOST = siteUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '')

/** Trim copy to what fits two comfortable lines, on a word boundary. */
function clamp(text: string, max = 150): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}

export interface OgCardOptions {
  /** Which rung — picks the accent and nothing else. */
  level: ArtifactLevel
  /** Chip text, usually the artifact's category. */
  badge: string
  /** Short label beside the chip, e.g. "React block". */
  kind: string
  /** The visual anchor — artifact or hub name. */
  name: string
  description: string
  /** Path shown bottom-right, e.g. `/block/pricing-tiers`. */
  path: string
}

export function ogCard({
  level,
  badge,
  kind,
  name,
  description,
  path,
}: OgCardOptions): ImageResponse {
  const accent = ACCENTS[level]

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #0b1020 0%, #1e1b4b 50%, #0b1020 100%)',
          color: '#f8fafc',
          padding: '64px',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Decorative glow circles */}
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            right: '-120px',
            width: '480px',
            height: '480px',
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(${accent.glow},0.35) 0%, rgba(${accent.glow},0) 70%)`,
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
            background: `radial-gradient(circle, rgba(${accent.wash},0.25) 0%, rgba(${accent.wash},0) 70%)`,
            display: 'flex',
          }}
        />

        {/* Top row: category chip + kind label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 20px',
              borderRadius: '999px',
              background: `rgba(${accent.chip}, 0.15)`,
              border: `1px solid rgba(${accent.chip}, 0.4)`,
              color: accent.text,
              fontSize: '22px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {badge}
          </div>
          <div style={{ display: 'flex', color: '#94a3b8', fontSize: '22px', fontWeight: 500 }}>
            {kind}
          </div>
        </div>

        {/* Name — the visual anchor */}
        <div
          style={{
            display: 'flex',
            fontSize: name.length > 34 ? '60px' : '76px',
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
          {clamp(description)}
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
                background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
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
            {HOST}
            {path}
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE },
  )
}
