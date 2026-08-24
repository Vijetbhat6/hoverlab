'use client'

/**
 * Favicon generator.
 *
 * Everything here happens in the browser. A favicon generator that uploads
 * your logo to someone's server to hand back a zip is the wrong shape for
 * this problem — the input is a letter or an emoji and the output is an SVG,
 * so there is nothing a round trip would add.
 *
 * SVG first, PNG as the fallback. A modern browser takes `icon.svg` and
 * scales it to any size, which is one file instead of six and stays sharp on
 * a display that did not exist when you shipped. The PNG export is here for
 * the places that still refuse SVG — Safari's touch icon, and older Android.
 *
 * The PNG is rasterized through a canvas from the same SVG, so the two can
 * never drift.
 */

import * as React from 'react'
import { Download, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { CopyCssCard } from '@/components/designer-tools/copy-css-card'
import { ToolLayout } from '@/components/designer-tools/tool-layout'

const STORAGE_KEY = 'hoverlab:tool:favicon'

interface FaviconState {
  text: string
  bgFrom: string
  bgTo: string
  fg: string
  radius: number
  bold: boolean
}

const DEFAULT_STATE: FaviconState = {
  text: 'H',
  bgFrom: '#6366f1',
  bgTo: '#ec4899',
  fg: '#ffffff',
  radius: 22,
  bold: true,
}

/** Sizes worth emitting, and what each is actually for. */
const PNG_SIZES: Array<{ size: number; use: string }> = [
  { size: 32, use: 'Browser tab' },
  { size: 180, use: 'iOS home screen' },
  { size: 192, use: 'Android / PWA' },
  { size: 512, use: 'PWA splash' },
]

/**
 * Build the icon as an SVG string.
 *
 * `textLength` is deliberately absent: emoji and letters have wildly
 * different advance widths, and forcing a width distorts one to fix the
 * other. Centring on both axes with `dominant-baseline` handles both.
 */
function buildSvg(state: FaviconState, size = 512): string {
  const { text, bgFrom, bgTo, fg, radius, bold } = state
  const r = (radius / 100) * size
  // Emoji render at their own colours; a letter takes the foreground.
  const isEmoji = /\p{Extended_Pictographic}/u.test(text)

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bgFrom}"/>
      <stop offset="100%" stop-color="${bgTo}"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${r}" fill="url(#g)"/>
  <text
    x="50%" y="50%"
    dominant-baseline="central"
    text-anchor="middle"
    font-family="system-ui, -apple-system, 'Segoe UI', sans-serif"
    font-size="${size * (isEmoji ? 0.6 : 0.56)}"
    font-weight="${bold ? '700' : '400'}"
    ${isEmoji ? '' : `fill="${fg}"`}
  >${escapeXml(text)}</text>
</svg>`
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Rasterize the SVG at one size, in the browser. */
async function svgToPng(svg: string, size: number): Promise<Blob | null> {
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  const img = new Image()
  img.width = size
  img.height = size

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('svg failed to load'))
    img.src = url
  })

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(img, 0, 0, size, size)

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}

function download(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

const HTML_SNIPPET = `<link rel="icon" href="/icon.svg" type="image/svg+xml" />
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
<link rel="manifest" href="/manifest.webmanifest" />`

export default function FaviconToolPage() {
  const [state, setState] = React.useState<FaviconState>(DEFAULT_STATE)
  const [busy, setBusy] = React.useState(false)

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) setState({ ...DEFAULT_STATE, ...(JSON.parse(raw) as Partial<FaviconState>) })
    } catch {
      /* ignore */
    }
  }, [])

  React.useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* ignore */
    }
  }, [state])

  const svg = buildSvg(state)
  const dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`

  async function downloadPng(size: number) {
    setBusy(true)
    try {
      const blob = await svgToPng(buildSvg(state, size), size)
      if (blob) download(`icon-${size}.png`, blob)
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolLayout
      name="Favicon Generator"
      tagline="A letter or an emoji into an SVG icon and every PNG size that still matters"
      icon={<Sparkles className="h-5 w-5" />}
    >
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-5 rounded-2xl border border-border/60 bg-card/60 p-5">
          <div>
            <Label htmlFor="fav-text">Letter or emoji</Label>
            <Input
              id="fav-text"
              value={state.text}
              maxLength={2}
              onChange={(e) => setState((s) => ({ ...s, text: e.target.value }))}
              className="mt-2"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              One or two characters. An emoji keeps its own colours.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {(
              [
                ['bgFrom', 'From'],
                ['bgTo', 'To'],
                ['fg', 'Text'],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <Label htmlFor={`fav-${key}`} className="text-xs">
                  {label}
                </Label>
                <input
                  id={`fav-${key}`}
                  type="color"
                  value={state[key]}
                  onChange={(e) => setState((s) => ({ ...s, [key]: e.target.value }))}
                  className="mt-1.5 h-9 w-full cursor-pointer rounded-lg border border-field/60 bg-transparent"
                />
              </div>
            ))}
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <Label htmlFor="fav-radius">Corner radius</Label>
              <span className="font-mono text-xs text-muted-foreground">{state.radius}%</span>
            </div>
            <Slider
              id="fav-radius"
              value={[state.radius]}
              onValueChange={(v) => setState((s) => ({ ...s, radius: v[0] ?? 0 }))}
              min={0}
              max={50}
              step={1}
              className="mt-3"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Rounding on the icon, as a percentage of its size — so it holds
              at every exported resolution. 50% gives you a circle; most
              platforms mask the corners themselves anyway.
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={state.bold}
              onChange={(e) => setState((s) => ({ ...s, bold: e.target.checked }))}
              className="h-4 w-4 rounded border-border"
            />
            Bold
          </label>
        </div>

        <div className="space-y-6">
          {/* Previews at the sizes it will actually be seen at. A 512px
              preview tells you nothing about whether the letter survives
              at 16. */}
          <div className="rounded-2xl border border-border/60 bg-card/60 p-6">
            <div className="flex flex-wrap items-end gap-6">
              {[16, 32, 64, 128].map((size) => (
                <div key={size} className="text-center">
                  <img
                    src={dataUri}
                    alt=""
                    width={size}
                    height={size}
                    style={{ width: size, height: size }}
                  />
                  <div className="mt-2 font-mono text-[10px] text-muted-foreground">
                    {size}px
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/60 p-5">
            <h2 className="text-sm font-semibold">Download</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() =>
                  download('icon.svg', new Blob([svg], { type: 'image/svg+xml' }))
                }
              >
                <Download className="h-3.5 w-3.5" /> icon.svg
              </Button>
              {PNG_SIZES.map(({ size, use }) => (
                <Button
                  key={size}
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  disabled={busy}
                  title={use}
                  onClick={() => void downloadPng(size)}
                >
                  <Download className="h-3.5 w-3.5" /> {size}px
                </Button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Rasterized in your browser from the same SVG, so they cannot
              drift apart. Nothing is uploaded anywhere.
            </p>
          </div>

          <CopyCssCard code={svg} title="icon.svg" language="html" />
          <CopyCssCard code={HTML_SNIPPET} title="Put this in your <head>" language="html" />
        </div>
      </div>
    </ToolLayout>
  )
}
