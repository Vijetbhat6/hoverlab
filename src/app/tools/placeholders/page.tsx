'use client'

/**
 * Placeholder images and avatars.
 *
 * Every generator of this kind is a remote service — placehold.co,
 * picsum.photos, ui-avatars.com — and every one of them is a third-party
 * request on a page that has not shipped yet. They rot, they rate-limit,
 * they occasionally go away, and they leak the fact that you are still
 * building to anyone reading your network tab.
 *
 * These are SVG data URIs. No request, no dependency, works offline, works
 * in an email, and pastes into a `src` attribute as-is. The cost is that
 * they are drawn rather than photographic — which is the honest thing for a
 * placeholder to look like anyway.
 */

import * as React from 'react'
import { ImageIcon } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CopyCssCard } from '@/components/designer-tools/copy-css-card'
import { ToolLayout } from '@/components/designer-tools/tool-layout'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'hoverlab:tool:placeholders'

type Mode = 'image' | 'avatar'

interface PlaceholderState {
  mode: Mode
  width: number
  height: number
  label: string
  name: string
  bg: string
  fg: string
}

const DEFAULT_STATE: PlaceholderState = {
  mode: 'image',
  width: 1200,
  height: 630,
  label: '',
  name: 'Ada Lovelace',
  bg: '#1e1b4b',
  fg: '#a5b4fc',
}

/**
 * A stable hue from a string.
 *
 * Same name, same colour, every time and on every machine — which is what
 * makes a list of avatars look designed rather than random. A hash rather
 * than an index because the list order is not stable either.
 */
function hueOf(text: string): number {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 360
  return h
}

/** Up to two initials, skipping the middle names. */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function buildImageSvg(s: PlaceholderState): string {
  const label = s.label || `${s.width} × ${s.height}`
  // Diagonals are the convention for "this is a placeholder" and they also
  // make a wrong aspect ratio obvious at a glance.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s.width}" height="${s.height}" viewBox="0 0 ${s.width} ${s.height}">
  <rect width="${s.width}" height="${s.height}" fill="${s.bg}"/>
  <path d="M0 0 L${s.width} ${s.height} M${s.width} 0 L0 ${s.height}" stroke="${s.fg}" stroke-opacity="0.25" stroke-width="2"/>
  <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle"
    font-family="system-ui, sans-serif" font-size="${Math.max(14, Math.min(s.width, s.height) * 0.09)}"
    font-weight="600" fill="${s.fg}">${escapeXml(label)}</text>
</svg>`
}

function buildAvatarSvg(name: string, size = 128): string {
  const hue = hueOf(name)
  const initials = initialsOf(name)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="a" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue} 65% 55%)"/>
      <stop offset="100%" stop-color="hsl(${(hue + 40) % 360} 65% 42%)"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size / 2}" fill="url(#a)"/>
  <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle"
    font-family="system-ui, sans-serif" font-size="${size * 0.4}" font-weight="700"
    fill="#fff">${escapeXml(initials)}</text>
</svg>`
}

const toDataUri = (svg: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`

const SAMPLE_NAMES = [
  'Ada Lovelace',
  'Grace Hopper',
  'Alan Turing',
  'Radia Perlman',
  'Katherine Johnson',
  'Linus Torvalds',
]

const PRESETS: Array<{ label: string; w: number; h: number }> = [
  { label: 'OG image', w: 1200, h: 630 },
  { label: 'Hero', w: 1600, h: 900 },
  { label: 'Card', w: 800, h: 600 },
  { label: 'Square', w: 600, h: 600 },
  { label: 'Banner', w: 1500, h: 500 },
]

export default function PlaceholdersToolPage() {
  const [state, setState] = React.useState<PlaceholderState>(DEFAULT_STATE)

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) setState({ ...DEFAULT_STATE, ...(JSON.parse(raw) as Partial<PlaceholderState>) })
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

  const svg = state.mode === 'image' ? buildImageSvg(state) : buildAvatarSvg(state.name)
  const uri = toDataUri(svg)

  return (
    <ToolLayout
      name="Placeholders"
      tagline="Images and avatars as SVG data URIs — no third-party request, works offline"
      icon={<ImageIcon className="h-5 w-5" />}
    >
      <div className="mb-6 inline-flex rounded-lg border border-border/60 p-1">
        {(['image', 'avatar'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setState((s) => ({ ...s, mode }))}
            aria-pressed={state.mode === mode}
            className={cn(
              'rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors',
              state.mode === mode
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {mode}s
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-5 rounded-2xl border border-border/60 bg-card/60 p-5">
          {state.mode === 'image' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="p-w">Width</Label>
                  <Input
                    id="p-w"
                    type="number"
                    value={state.width}
                    onChange={(e) =>
                      setState((s) => ({ ...s, width: Number(e.target.value) || 1 }))
                    }
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="p-h">Height</Label>
                  <Input
                    id="p-h"
                    type="number"
                    value={state.height}
                    onChange={(e) =>
                      setState((s) => ({ ...s, height: Number(e.target.value) || 1 }))
                    }
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setState((s) => ({ ...s, width: p.w, height: p.h }))}
                    className="rounded-full border border-border/60 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div>
                <Label htmlFor="p-label">Label</Label>
                <Input
                  id="p-label"
                  value={state.label}
                  placeholder={`${state.width} × ${state.height}`}
                  onChange={(e) => setState((s) => ({ ...s, label: e.target.value }))}
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    ['bg', 'Background'],
                    ['fg', 'Foreground'],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key}>
                    <Label htmlFor={`p-${key}`} className="text-xs">
                      {label}
                    </Label>
                    <input
                      id={`p-${key}`}
                      type="color"
                      value={state[key]}
                      onChange={(e) => setState((s) => ({ ...s, [key]: e.target.value }))}
                      className="mt-1.5 h-9 w-full cursor-pointer rounded-lg border border-border/60 bg-transparent"
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div>
              <Label htmlFor="p-name">Name</Label>
              <Input
                id="p-name"
                value={state.name}
                onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
                className="mt-2"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                The colour is derived from the name, so the same person is the
                same colour on every machine and in every list.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-border/60 bg-card/60 p-6">
            <img
              src={uri}
              alt=""
              className={cn(
                'max-h-[320px] max-w-full rounded-lg',
                state.mode === 'avatar' && 'h-32 w-32',
              )}
            />
          </div>

          {state.mode === 'avatar' ? (
            <div className="rounded-2xl border border-border/60 bg-card/60 p-5">
              <h2 className="mb-3 text-sm font-semibold">A row of them</h2>
              <div className="flex flex-wrap gap-3">
                {SAMPLE_NAMES.map((n) => (
                  <img
                    key={n}
                    src={toDataUri(buildAvatarSvg(n))}
                    alt=""
                    title={n}
                    className="h-12 w-12 rounded-full"
                  />
                ))}
              </div>
            </div>
          ) : null}

          <CopyCssCard
            code={`<img src="${uri}" alt="" />`}
            title="As a data URI"
            language="html"
          />
          <CopyCssCard code={svg} title="As SVG" language="html" />
        </div>
      </div>
    </ToolLayout>
  )
}
