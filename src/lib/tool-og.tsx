import { ImageResponse } from 'next/og'
import { DESIGNER_TOOLS } from '@/lib/designer-tools'

/**
 * The shared Open Graph card for the designer tools, rendered by the
 * `opengraph-image.tsx` file in each tool's route segment.
 *
 * The catalog tiers already have `src/lib/og-card.tsx`; the tools get their
 * own card for the same reason the tiers share one — twenty near-identical
 * inline layouts would drift. The design difference is deliberate: tool cards
 * are keyed by each tool's accent gradient from the registry, so the share
 * card matches the hub tile a visitor will land on.
 *
 * Satori notes (ImageResponse renders through Satori, not a DOM):
 *   - every element with more than one child needs an explicit `display: flex`
 *   - there is no `text-overflow`, hence `clampText()` on the copy
 *   - `position: absolute` works, but z-order follows document order
 */

export const OG_SIZE = { width: 1200, height: 630 }

/**
 * Tailwind gradient stop → hex, for the accent strings in the registry
 * (`from-indigo-500 to-violet-500` …). Only the stops the registry actually
 * uses are listed; anything unmapped falls back to a neutral slate so a new
 * accent degrades to a grey card instead of a crash.
 */
const STOP_HEX: Record<string, string> = {
  'indigo-500': '#6366f1',
  'violet-500': '#8b5cf6',
  'slate-500': '#64748b',
  'zinc-500': '#71717a',
  'zinc-600': '#52525b',
  'yellow-500': '#eab308',
  'amber-500': '#f59e0b',
  'orange-500': '#f97316',
  'emerald-500': '#10b981',
  'teal-500': '#14b8a6',
  'lime-500': '#84cc16',
  'fuchsia-500': '#d946ef',
  'pink-500': '#ec4899',
  'rose-500': '#f43f5e',
  'red-500': '#ef4444',
  'sky-500': '#0ea5e9',
  'blue-500': '#3b82f6',
  'cyan-500': '#06b6d4',
  'purple-500': '#a855f7',
  'stone-500': '#78716c',
}

const NEUTRAL = '#64748b'

/** `'from-indigo-500 to-violet-500'` → `['#6366f1', '#8b5cf6']`. */
function accentHex(accent: string): [string, string] {
  const from = /from-([a-z]+-\d+)/.exec(accent)?.[1]
  const to = /to-([a-z]+-\d+)/.exec(accent)?.[1]
  return [STOP_HEX[from ?? ''] ?? NEUTRAL, STOP_HEX[to ?? ''] ?? NEUTRAL]
}

/** `#rrggbb` → `r,g,b`, for rgba() glows. */
function rgb(hex: string): string {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(',')
}

/** Trim copy to what fits two comfortable lines, on a word boundary. */
function clampText(text: string, max = 140): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}

function findTool(href: string) {
  const tool = DESIGNER_TOOLS.find((t) => t.href === href)
  if (!tool) throw new Error(`Unknown designer tool: ${href}`)
  return tool
}

/** The `alt` text for a tool's OG image — its search-phrased page title. */
export function toolOgAlt(href: string): string {
  return findTool(href).seoTitle
}

/** Render the 1200×630 share card for the tool at `href`. */
export function toolOgImage(href: string): ImageResponse {
  const tool = findTool(href)
  const [from, to] = accentHex(tool.accent)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#0a0a0f',
          color: '#f8fafc',
          padding: '64px',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Accent bar across the top edge */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '1200px',
            height: '12px',
            background: `linear-gradient(90deg, ${from} 0%, ${to} 100%)`,
            display: 'flex',
          }}
        />

        {/* Corner glow in the accent's "from" color */}
        <div
          style={{
            position: 'absolute',
            top: '-160px',
            right: '-160px',
            width: '520px',
            height: '520px',
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(${rgb(from)},0.28) 0%, rgba(${rgb(from)},0) 70%)`,
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-200px',
            left: '-120px',
            width: '440px',
            height: '440px',
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(${rgb(to)},0.18) 0%, rgba(${rgb(to)},0) 70%)`,
            display: 'flex',
          }}
        />

        {/* Accent tile — the hub card's icon tile, minus the icon */}
        <div
          style={{
            display: 'flex',
            width: '72px',
            height: '72px',
            borderRadius: '18px',
            background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
            position: 'relative',
          }}
        />

        {/* Tool name — the visual anchor */}
        <div
          style={{
            display: 'flex',
            fontSize: tool.name.length > 22 ? '64px' : '76px',
            fontWeight: 700,
            lineHeight: 1.1,
            marginTop: '44px',
            letterSpacing: '-0.02em',
            maxWidth: '1000px',
            position: 'relative',
          }}
        >
          {tool.name}
        </div>

        {/* Description, clamped to ~2 lines */}
        <div
          style={{
            display: 'flex',
            fontSize: '28px',
            lineHeight: 1.4,
            color: '#94a3b8',
            marginTop: '24px',
            maxWidth: '920px',
            position: 'relative',
          }}
        >
          {clampText(tool.description)}
        </div>

        {/* Footer brand line */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            marginTop: 'auto',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: 700,
              color: '#f8fafc',
            }}
          >
            H
          </div>
          <div style={{ display: 'flex', fontSize: '24px', color: '#cbd5e1', fontWeight: 600 }}>
            Hoverlab
          </div>
          <div style={{ display: 'flex', fontSize: '24px', color: '#64748b' }}>
            — free designer tools
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE },
  )
}
