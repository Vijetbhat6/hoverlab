'use client'

/**
 * SEO meta + Open Graph builder.
 *
 * Two things at once, because they are the same job: the tags a page needs
 * to be indexed, and the card it turns into when someone pastes the link.
 * Getting the second wrong is invisible until a link is already in a Slack
 * channel looking broken.
 *
 * The previews are approximations and say so. Google rewrites titles more
 * often than not, and every platform truncates at a different width — what
 * the counters give you is "this is comfortably inside" versus "this will be
 * cut", which is the only question worth answering here.
 *
 * Emits Next.js Metadata as well as raw tags. Hand-writing `<meta>` in an
 * App Router project is a bug: Next dedupes and overrides through the
 * Metadata API, and a stray literal tag ends up duplicated.
 */

import * as React from 'react'
import { Search } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CopyCssCard } from '@/components/designer-tools/copy-css-card'
import { ToolLayout } from '@/components/designer-tools/tool-layout'
import { ToolPresetsBar } from '@/components/designer-tools/tool-presets-bar'
import { UseInCatalog } from '@/components/designer-tools/use-in-catalog'
import { ToolWorkbench } from '@/components/designer-tools/tool-workbench'
import { useToolState } from '@/hooks/use-tool-state'
import { cn } from '@/lib/utils'

const TOOL = '/tools/meta'

interface MetaState {
  title: string
  description: string
  url: string
  siteName: string
  image: string
  twitter: string
}

const DEFAULT_STATE: MetaState = {
  title: 'Acme — Ship your next idea before the weekend',
  description:
    'Everything you need to launch: auth, billing, analytics and a dashboard your customers will actually understand.',
  url: 'https://acme.com',
  siteName: 'Acme',
  image: 'https://acme.com/og.png',
  twitter: '@acme',
}

/** Where each field stops being safe. Not hard limits — display budgets. */
const LIMITS = { title: 60, description: 155 }

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

function buildHtml(s: MetaState): string {
  return `<title>${escapeAttr(s.title)}</title>
<meta name="description" content="${escapeAttr(s.description)}" />
<link rel="canonical" href="${escapeAttr(s.url)}" />

<!-- Open Graph -->
<meta property="og:type" content="website" />
<meta property="og:site_name" content="${escapeAttr(s.siteName)}" />
<meta property="og:title" content="${escapeAttr(s.title)}" />
<meta property="og:description" content="${escapeAttr(s.description)}" />
<meta property="og:url" content="${escapeAttr(s.url)}" />
<meta property="og:image" content="${escapeAttr(s.image)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="${escapeAttr(s.twitter)}" />
<meta name="twitter:title" content="${escapeAttr(s.title)}" />
<meta name="twitter:description" content="${escapeAttr(s.description)}" />
<meta name="twitter:image" content="${escapeAttr(s.image)}" />`
}

function buildNextMetadata(s: MetaState): string {
  const q = (v: string) => JSON.stringify(v)
  return `import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL(${q(s.url)}),
  title: ${q(s.title)},
  description: ${q(s.description)},
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: ${q(s.siteName)},
    title: ${q(s.title)},
    description: ${q(s.description)},
    url: ${q(s.url)},
    images: [{ url: ${q(s.image)}, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    site: ${q(s.twitter)},
    title: ${q(s.title)},
    description: ${q(s.description)},
    images: [${q(s.image)}],
  },
}`
}

/** Character counter that turns amber before it turns red. */
function Counter({ value, limit }: { value: string; limit: number }) {
  const n = value.length
  const state = n > limit ? 'over' : n > limit * 0.9 ? 'near' : 'ok'
  return (
    <span
      className={cn(
        'font-mono text-xs',
        state === 'over' && 'text-rose-500',
        state === 'near' && 'text-amber-500',
        state === 'ok' && 'text-muted-foreground',
      )}
    >
      {n}/{limit}
    </span>
  )
}

export default function MetaToolPage() {
  // Working state stays local and ungated; named presets need an account.
  // See `use-tool-state.ts` for why the two layers are separate.
  const tool = useToolState<MetaState>(TOOL, DEFAULT_STATE)
  const { state, setState } = tool

  const field =
    <K extends keyof MetaState>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setState((s) => ({ ...s, [key]: e.target.value }))

  const host = state.url.replace(/^https?:\/\//, '').replace(/\/+$/, '')

  return (
    <ToolLayout
      name="Meta & OG Builder"
      tagline="The tags that get you indexed, and the card your link turns into"
      icon={<Search className="h-5 w-5" />}
    >
      <ToolWorkbench previewSide="right" controlsWidth="380px">
        {/* Form */}
        <div className="space-y-4 rounded-2xl border border-border/60 bg-card/60 p-5">
          <div>
            <div className="flex items-baseline justify-between">
              <Label htmlFor="m-title">Title</Label>
              <Counter value={state.title} limit={LIMITS.title} />
            </div>
            <Input id="m-title" value={state.title} onChange={field('title')} className="mt-2" />
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <Label htmlFor="m-desc">Description</Label>
              <Counter value={state.description} limit={LIMITS.description} />
            </div>
            <Textarea
              id="m-desc"
              value={state.description}
              onChange={field('description')}
              rows={3}
              className="mt-2"
            />
          </div>

          {(
            [
              ['url', 'Canonical URL'],
              ['siteName', 'Site name'],
              ['image', 'OG image URL (1200×630)'],
              ['twitter', 'Twitter handle'],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <Label htmlFor={`m-${key}`}>{label}</Label>
              <Input
                id={`m-${key}`}
                value={state[key]}
                onChange={field(key)}
                className="mt-2"
              />
            </div>
          ))}

          {/* After the fields, never before them — the ask lands once the
              tags exist rather than in front of them. */}
          <ToolPresetsBar tool={tool} noun="tag set" />
        </div>

        {/* Previews + output */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/60 bg-card/60 p-5">
            <h2 className="mb-4 text-sm font-semibold">Search result</h2>
            <div className="max-w-xl">
              <div className="truncate text-xs text-muted-foreground">{host}</div>
              <div className="mt-0.5 truncate text-lg text-[#1a0dab] dark:text-[#8ab4f8]">
                {state.title || 'Untitled'}
              </div>
              <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                {state.description}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/60 p-5">
            <h2 className="mb-4 text-sm font-semibold">Link card</h2>
            <div className="max-w-md overflow-hidden rounded-xl border border-border/60">
              <div className="flex aspect-[1200/630] items-center justify-center bg-muted/50 text-xs text-muted-foreground">
                {/* Not loaded: the URL is usually not live yet, and a broken
                    image icon would read as "your tag is wrong". */}
                {state.image ? '1200 × 630 — og:image' : 'No og:image set'}
              </div>
              <div className="p-3">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {host}
                </div>
                <div className="mt-1 line-clamp-1 text-sm font-semibold">{state.title}</div>
                <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {state.description}
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Approximate. Every platform truncates at a different width — the
              counters tell you whether you are comfortably inside.
            </p>
          </div>

          <CopyCssCard code={buildNextMetadata(state)} title="app/layout.tsx" language="tsx" />
          <CopyCssCard code={buildHtml(state)} title="Raw tags" language="html" />

          {/* No `brand`: meta tags are text, and `theme-color` is a chrome
              colour rather than a stated identity. */}
          <UseInCatalog tool={TOOL} />
        </div>
      </ToolWorkbench>
    </ToolLayout>
  )
}
