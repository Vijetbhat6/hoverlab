/**
 * The designer-tools registry — the single list of every tool under /tools.
 *
 * Both the hub page (/tools) and the command palette render from this, so a
 * new tool added here shows up in both places at once. Before this file the
 * hub had its own inline array and the palette had nothing: the hub footer
 * told users to search ⌘K for tools that ⌘K had never heard of.
 *
 * `keywords` exists for the palette's fuzzy matcher: the words a user types
 * when they want the tool but don't know what we named it ("wcag" for the
 * contrast checker, "og" for the meta builder).
 */

import type { Metadata } from 'next'
import {
  Accessibility,
  Activity,
  ALargeSmall,
  Blend,
  Film,
  Grid3x3,
  Image as ImageIcon,
  Layers,
  Mail,
  Palette,
  Pipette,
  Ruler,
  Search,
  Shapes,
  Sparkles,
  Square,
  StretchHorizontal,
  SwatchBook,
  Wine,
  Zap,
  type LucideIcon,
} from 'lucide-react'

export interface DesignerTool {
  href: string
  name: string
  description: string
  icon: LucideIcon
  /** Tailwind gradient stops for the hub card's icon tile. */
  accent: string
  /** Extra search terms for the command palette's fuzzy matcher. */
  keywords: string
  /**
   * The <title> for the tool's page. Search-phrased rather than brand-phrased
   * — the tools are the public, indexable part of the site (the catalog is
   * gated), so each title says what someone would type into a search engine.
   */
  seoTitle: string
}

/**
 * Metadata for a tool's route, for the per-tool layout.tsx files. The pages
 * are client components and cannot export metadata themselves.
 */
export function toolMetadata(href: string): Metadata {
  const tool = DESIGNER_TOOLS.find((t) => t.href === href)
  if (!tool) throw new Error(`Unknown designer tool: ${href}`)
  return { title: tool.seoTitle, description: tool.description }
}

export const DESIGNER_TOOLS: DesignerTool[] = [
  {
    href: '/tools/tokens',
    name: 'Token Generator',
    description:
      'Build the CSS custom properties every block in the catalog is styled against — a full light and dark set in the shadcn convention. Colour maths in OKLCH, so one lightness scale works across every hue.',
    icon: SwatchBook,
    accent: 'from-indigo-500 to-violet-500',
    keywords: 'design tokens css variables custom properties shadcn theme oklch dark mode',
    seoTitle: 'Design Token Generator — shadcn CSS Variables in OKLCH — Hoverlab',
  },
  {
    href: '/tools/icons',
    name: 'Icon Browser',
    description:
      'Search the icon set every block already uses. Matches on keywords, not just names — "delete" finds Trash2. Click to copy the JSX.',
    icon: Grid3x3,
    accent: 'from-slate-500 to-zinc-500',
    keywords: 'icons lucide svg search copy jsx',
    seoTitle: 'Icon Browser — Search Lucide Icons, Copy JSX — Hoverlab',
  },
  {
    href: '/tools/motion',
    name: 'Motion Presets',
    description:
      'Enter, exit and attention animations, each shipping with its prefers-reduced-motion guard already written. Preview what a reduced-motion visitor actually sees.',
    icon: Zap,
    accent: 'from-yellow-500 to-amber-500',
    keywords: 'motion animation presets enter exit keyframes prefers-reduced-motion',
    seoTitle: 'CSS Animation Presets with Reduced-Motion Guards — Hoverlab',
  },
  {
    href: '/tools/placeholders',
    name: 'Placeholders',
    description:
      'Placeholder images and initial avatars as SVG data URIs. No third-party request, works offline, and the avatar colour is derived from the name so it is stable everywhere.',
    icon: ImageIcon,
    accent: 'from-emerald-500 to-teal-500',
    keywords: 'placeholder image avatar initials svg data uri mock',
    seoTitle: 'Placeholder Image & Avatar Generator — SVG Data URIs — Hoverlab',
  },
  {
    href: '/tools/favicon',
    name: 'Favicon Generator',
    description:
      'A letter or emoji into an SVG icon plus every PNG size that still matters. Rasterized in your browser from the same SVG — nothing is uploaded.',
    icon: Sparkles,
    accent: 'from-fuchsia-500 to-pink-500',
    keywords: 'favicon app icon emoji png svg apple touch',
    seoTitle: 'Favicon Generator — Letter or Emoji to SVG + PNG — Hoverlab',
  },
  {
    href: '/tools/meta',
    name: 'Meta & OG Builder',
    description:
      'The tags that get you indexed and the card your link turns into, with length counters and a search-result preview. Emits Next.js Metadata, not stray meta tags.',
    icon: Search,
    accent: 'from-sky-500 to-blue-500',
    keywords: 'seo meta tags open graph og twitter card social preview',
    seoTitle: 'Meta Tag & Open Graph Builder for Next.js — Hoverlab',
  },
  {
    href: '/tools/email',
    name: 'Email Templates',
    description:
      'Welcome, verify, reset and receipt — as nested tables with inline styles, because Outlook renders through Word. Text/plain version included.',
    icon: Mail,
    accent: 'from-rose-500 to-red-500',
    keywords: 'email html template transactional welcome verify reset receipt outlook',
    seoTitle: 'HTML Email Templates — Outlook-Safe Nested Tables — Hoverlab',
  },
  {
    href: '/tools/palette',
    name: 'Palette Generator',
    description:
      'Build a 5-color palette from a base color. Supports analogous, complementary, triadic, split-complementary, tetradic, monochromatic, and shades & tints schemes. Export as CSS variables, Tailwind config, or JSON — or send the base straight to the Token Generator.',
    icon: Palette,
    accent: 'from-rose-500 to-orange-500',
    keywords: 'color palette scheme analogous complementary triadic tailwind harmony',
    seoTitle: 'Color Palette Generator — CSS, Tailwind & JSON Export — Hoverlab',
  },
  {
    href: '/tools/color',
    name: 'Color Converter',
    description:
      'Paste a color in any CSS format — hex, rgb(), hsl(), or oklch() — and get all four back, one copy button each. OKLCH math is done properly through linear-light OKLab, and out-of-gamut colors are clamped to sRGB and flagged instead of silently shifted.',
    icon: Blend,
    accent: 'from-orange-500 to-rose-500',
    keywords: 'color convert converter hex rgb hsl oklch format css',
    seoTitle: 'Color Format Converter — HEX, RGB, HSL, OKLCH — Hoverlab',
  },
  {
    href: '/tools/gradient',
    name: 'Gradient Studio',
    description:
      'Visually compose multi-stop linear and radial gradients. Drag stops, set angles, preview live, and copy as CSS with all the vendor prefixes you need.',
    icon: Pipette,
    accent: 'from-violet-500 to-fuchsia-500',
    keywords: 'gradient linear radial css background color stops',
    seoTitle: 'CSS Gradient Generator — Linear & Radial — Hoverlab',
  },
  {
    href: '/tools/shadow',
    name: 'Shadow Builder',
    description:
      'Layer multiple box-shadows or text-shadows with independent x/y/blur/spread/color/opacity controls. Save up to 8 layers and copy production-ready CSS.',
    icon: Layers,
    accent: 'from-sky-500 to-cyan-500',
    keywords: 'box-shadow text-shadow shadow elevation depth layers css',
    seoTitle: 'Box-Shadow & Text-Shadow Generator — Layered CSS — Hoverlab',
  },
  {
    href: '/tools/contrast',
    name: 'Contrast Checker',
    description:
      'WCAG 2.1 AA / AAA contrast checker with live preview at three text sizes. Get a pass/fail verdict plus the exact ratio and suggested fixes.',
    icon: Accessibility,
    accent: 'from-emerald-500 to-teal-500',
    keywords: 'wcag contrast accessibility a11y ratio aa aaa color text',
    seoTitle: 'WCAG Contrast Checker — AA & AAA — Hoverlab',
  },
  {
    href: '/tools/units',
    name: 'Unit Converter',
    description:
      'Convert px ↔ rem ↔ em ↔ % ↔ vw ↔ vh in real time. Set the root font size, see every conversion at once, and copy whichever value you need.',
    icon: Ruler,
    accent: 'from-amber-500 to-yellow-500',
    keywords: 'px rem em vw vh percent convert units css font size',
    seoTitle: 'CSS Unit Converter — px to rem, em, vw, vh — Hoverlab',
  },
  {
    href: '/tools/typography',
    name: 'Typography Playground',
    description:
      'Pick from 11 curated font pairings — each with the reasoning written down — tune weight / line-height / letter-spacing / paragraph-spacing, and generate a modular type scale with one of 5 ratio presets. Emits next/font, which self-hosts.',
    icon: ALargeSmall,
    accent: 'from-indigo-500 to-purple-500',
    keywords:
      'typography type scale modular line height letter spacing font size ratio fonts pairing typeface google fonts next/font heading body',
    seoTitle: 'Typography Playground — Font Pairings & Type Scale — Hoverlab',
  },
  {
    href: '/tools/spacing',
    name: 'Spacing Scale',
    description:
      'Generate a whole spacing ladder from two decisions: a base unit and a progression — linear multiples or one of the same five modular ratios the typography tool uses. Every step is drawn at its actual size, so you see whether neighbours are distinguishable before you commit. Export as CSS variables, Tailwind spacing config, or JSON.',
    icon: StretchHorizontal,
    accent: 'from-lime-500 to-emerald-500',
    keywords: 'spacing scale margin padding gap rhythm tokens tailwind css variables',
    seoTitle: 'Spacing Scale Generator — CSS Variables & Tailwind — Hoverlab',
  },
  {
    href: '/tools/border-radius',
    name: 'Border-radius & Squircle',
    description:
      'Three modes: standard per-corner radius, true squircle via superellipse SVG path, and fluid min()-based responsive radius. Copy as CSS or SVG path data.',
    icon: Square,
    accent: 'from-pink-500 to-rose-500',
    keywords: 'border radius squircle superellipse rounded corners css',
    seoTitle: 'Border-Radius & Squircle Generator — Hoverlab',
  },
  {
    href: '/tools/clip-path',
    name: 'Clip-path & Blob',
    description:
      'Eleven classic polygon() shapes — chevrons, stars, arrows, speech bubbles — each with its own tunable parameters, plus a seeded organic blob generator with 3–12 control points and a randomness dial. Copy as CSS clip-path or raw SVG path data.',
    icon: Shapes,
    accent: 'from-purple-500 to-indigo-500',
    keywords: 'clip-path polygon blob organic shape mask svg path css',
    seoTitle: 'CSS Clip-Path & Blob Shape Generator — Hoverlab',
  },
  {
    href: '/tools/easing',
    name: 'Easing Studio',
    description:
      'Visual cubic-bezier editor. Drag the two control points on the curve, watch live translateX / scale / opacity previews, and pick from 14 named presets.',
    icon: Activity,
    accent: 'from-cyan-500 to-blue-500',
    keywords: 'easing cubic-bezier curve animation timing function transition',
    seoTitle: 'Cubic-Bezier Easing Editor — Hoverlab',
  },
  {
    href: '/tools/glassmorphism',
    name: 'Glassmorphism Generator',
    description:
      'Tune backdrop-blur + saturation + opacity + border + shadow + inner highlight for a frosted-glass card. Includes @supports fallback for older browsers.',
    icon: Wine,
    accent: 'from-teal-500 to-emerald-500',
    keywords: 'glassmorphism glass frosted backdrop-filter blur card',
    seoTitle: 'Glassmorphism CSS Generator — Hoverlab',
  },
  {
    href: '/tools/noise',
    name: 'Noise Texture',
    description:
      "Film-grain and noise textures from the browser's own feTurbulence — a seamlessly tiling SVG data URI, previewed over a gradient and a card with the real blend mode. No PNG asset, no request, works offline.",
    icon: Film,
    accent: 'from-stone-500 to-zinc-600',
    keywords: 'noise grain texture feturbulence svg film overlay background',
    seoTitle: 'SVG Noise Texture Generator — Grain via feTurbulence — Hoverlab',
  },
]
