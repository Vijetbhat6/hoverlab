'use client'

/**
 * Designer Tools hub page — landing page for all the design utility tools.
 * Each tool gets a card with icon, name, description, and a "Open" link.
 *
 * The hub is intentionally simple: it's a navigation page. The actual
 * tool logic lives in /tools/<name>/page.tsx.
 */

import * as React from 'react'
import Link from 'next/link'
import {
  Palette,
  Pipette,
  Layers,
  Accessibility,
  Ruler,
  ArrowRight,
  Sparkles,
  Type,
  Square,
  Activity,
  Wine,
  Grid3x3,
  Zap,
  Image as ImageIcon,
  Search,
  Mail,
} from 'lucide-react'
import { BrandColorPicker } from '@/components/brand-color-picker'
import { SiteHeader } from '@/components/site-header'
import { useCommandPalette } from '@/components/command-palette'

interface ToolDef {
  href: string
  name: string
  description: string
  icon: React.ReactNode
  accent: string
}

const TOOLS: ToolDef[] = [
  {
    href: '/tools/tokens',
    name: 'Token Generator',
    description:
      'Build the CSS custom properties every block in the catalog is styled against — a full light and dark set in the shadcn convention. Colour maths in OKLCH, so one lightness scale works across every hue.',
    icon: <Palette className="h-6 w-6" />,
    accent: 'from-indigo-500 to-violet-500',
  },
  {
    href: '/tools/icons',
    name: 'Icon Browser',
    description:
      'Search the icon set every block already uses. Matches on keywords, not just names — "delete" finds Trash2. Click to copy the JSX.',
    icon: <Grid3x3 className="h-6 w-6" />,
    accent: 'from-slate-500 to-zinc-500',
  },
  {
    href: '/tools/fonts',
    name: 'Font Pairings',
    description:
      'Six pairs that work, previewed as a heading over a paragraph at real sizes — the only arrangement that tells you whether a pairing holds. Emits next/font, which self-hosts.',
    icon: <Type className="h-6 w-6" />,
    accent: 'from-amber-500 to-orange-500',
  },
  {
    href: '/tools/motion',
    name: 'Motion Presets',
    description:
      'Enter, exit and attention animations, each shipping with its prefers-reduced-motion guard already written. Preview what a reduced-motion visitor actually sees.',
    icon: <Zap className="h-6 w-6" />,
    accent: 'from-yellow-500 to-amber-500',
  },
  {
    href: '/tools/placeholders',
    name: 'Placeholders',
    description:
      'Placeholder images and initial avatars as SVG data URIs. No third-party request, works offline, and the avatar colour is derived from the name so it is stable everywhere.',
    icon: <ImageIcon className="h-6 w-6" />,
    accent: 'from-emerald-500 to-teal-500',
  },
  {
    href: '/tools/favicon',
    name: 'Favicon Generator',
    description:
      'A letter or emoji into an SVG icon plus every PNG size that still matters. Rasterized in your browser from the same SVG — nothing is uploaded.',
    icon: <Sparkles className="h-6 w-6" />,
    accent: 'from-fuchsia-500 to-pink-500',
  },
  {
    href: '/tools/meta',
    name: 'Meta & OG Builder',
    description:
      'The tags that get you indexed and the card your link turns into, with length counters and a search-result preview. Emits Next.js Metadata, not stray meta tags.',
    icon: <Search className="h-6 w-6" />,
    accent: 'from-sky-500 to-blue-500',
  },
  {
    href: '/tools/email',
    name: 'Email Templates',
    description:
      'Welcome, verify, reset and receipt — as nested tables with inline styles, because Outlook renders through Word. Text/plain version included.',
    icon: <Mail className="h-6 w-6" />,
    accent: 'from-rose-500 to-red-500',
  },
  {
    href: '/tools/palette',
    name: 'Palette Generator',
    description:
      'Build a 5-color palette from a base color. Supports analogous, complementary, triadic, split-complementary, tetradic, monochromatic, and shades & tints schemes. Export as CSS variables, Tailwind config, or JSON.',
    icon: <Palette className="h-6 w-6" />,
    accent: 'from-rose-500 to-orange-500',
  },
  {
    href: '/tools/gradient',
    name: 'Gradient Studio',
    description:
      'Visually compose multi-stop linear and radial gradients. Drag stops, set angles, preview live, and copy as CSS with all the vendor prefixes you need.',
    icon: <Pipette className="h-6 w-6" />,
    accent: 'from-violet-500 to-fuchsia-500',
  },
  {
    href: '/tools/shadow',
    name: 'Shadow Builder',
    description:
      'Layer multiple box-shadows with independent x/y/blur/spread/color/opacity controls. Save up to 8 layers and copy production-ready CSS.',
    icon: <Layers className="h-6 w-6" />,
    accent: 'from-sky-500 to-cyan-500',
  },
  {
    href: '/tools/contrast',
    name: 'Contrast Checker',
    description:
      'WCAG 2.1 AA / AAA contrast checker with live preview at three text sizes. Get a pass/fail verdict plus the exact ratio and suggested fixes.',
    icon: <Accessibility className="h-6 w-6" />,
    accent: 'from-emerald-500 to-teal-500',
  },
  {
    href: '/tools/units',
    name: 'Unit Converter',
    description:
      'Convert px ↔ rem ↔ em ↔ % ↔ vw ↔ vh in real time. Set the root font size, see every conversion at once, and copy whichever value you need.',
    icon: <Ruler className="h-6 w-6" />,
    accent: 'from-amber-500 to-yellow-500',
  },
  {
    href: '/tools/typography',
    name: 'Typography Playground',
    description:
      'Pick from 8 curated font pairings, tune weight / line-height / letter-spacing / paragraph-spacing, and generate a modular type scale with one of 5 ratio presets.',
    icon: <Type className="h-6 w-6" />,
    accent: 'from-indigo-500 to-purple-500',
  },
  {
    href: '/tools/border-radius',
    name: 'Border-radius & Squircle',
    description:
      'Three modes: standard per-corner radius, true squircle via superellipse SVG path, and fluid min()-based responsive radius. Copy as CSS or SVG path data.',
    icon: <Square className="h-6 w-6" />,
    accent: 'from-pink-500 to-rose-500',
  },
  {
    href: '/tools/easing',
    name: 'Easing Studio',
    description:
      'Visual cubic-bezier editor. Drag the two control points on the curve, watch live translateX / scale / opacity previews, and pick from 14 named presets.',
    icon: <Activity className="h-6 w-6" />,
    accent: 'from-cyan-500 to-blue-500',
  },
  {
    href: '/tools/glassmorphism',
    name: 'Glassmorphism Generator',
    description:
      'Tune backdrop-blur + saturation + opacity + border + shadow + inner highlight for a frosted-glass card. Includes @supports fallback for older browsers.',
    icon: <Wine className="h-6 w-6" />,
    accent: 'from-teal-500 to-emerald-500',
  },
]

export default function ToolsHubPage() {
  const { open: openCommandPalette } = useCommandPalette()

  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader actions={<BrandColorPicker />} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pt-16">
        {/* Hero */}
        <section className="mx-auto mb-12 max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {TOOLS.length} tools · zero dependencies · works offline
          </div>
          <h1 className="type-hub">
            Designer tools,<br className="hidden sm:inline" /> built into your browser.
          </h1>
          <p className="mt-5 text-pretty text-base text-body sm:text-lg">
            A focused toolkit that complements the effects library: generate palettes,
            compose gradients, layer shadows, check WCAG contrast, and convert CSS units —
            all without leaving Hoverlab.
          </p>
        </section>

        {/* Tool cards */}
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${tool.accent} text-white shadow-md`}
              >
                {tool.icon}
              </div>
              <h2 className="mb-2 text-lg font-semibold">{tool.name}</h2>
              <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                {tool.description}
              </p>
              <div className="flex items-center gap-1.5 text-sm font-medium text-primary">
                Open tool
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </section>

        {/* Footer note */}
        <section className="mt-16 rounded-xl border border-border/60 bg-muted/20 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            More tools coming soon. Have a request?{' '}
            <button
              type="button"
              onClick={openCommandPalette}
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Open the command palette (⌘K)
            </button>{' '}
            and search for what you need.
          </p>
        </section>
      </main>
    </div>
  )
}
