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
  Aperture,
  Blend,
  Box,
  Braces,
  Brush,
  Clapperboard,
  Code2,
  Eye,
  Film,
  Grid3x3,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  LoaderCircle,
  Mail,
  Palette,
  Pipette,
  Rows3,
  Ruler,
  Search,
  Shapes,
  Sparkles,
  Square,
  StretchHorizontal,
  StretchVertical,
  SwatchBook,
  Wand2,
  Waves,
  Wind,
  Wine,
  Zap,
  type LucideIcon,
} from 'lucide-react'

/**
 * The five shelves the hub sorts itself into.
 *
 * Thirty-six cards in one undifferentiated grid is a list you scan rather
 * than a place you navigate, and the hub's own footer used to admit as much
 * by telling people to press ⌘K instead. These are the categories someone
 * arrives with — "I need a colour thing", "I need to ship an asset" —
 * rather than a taxonomy of CSS properties.
 *
 * Order matters: it is the order the shelves render in, and it runs from
 * the tools most people come for to the ones you only find once you are
 * already here.
 */
export const TOOL_GROUPS = [
  'Colour',
  'Layout & spacing',
  'Type & icons',
  'Effects & motion',
  'Ship it',
] as const

export type ToolGroup = (typeof TOOL_GROUPS)[number]

export interface DesignerTool {
  href: string
  name: string
  description: string
  icon: LucideIcon
  /** Tailwind gradient stops for the hub card's icon tile. */
  accent: string
  /** Which shelf this sits on at /tools. */
  group: ToolGroup
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

/*
  Layout first, then paint.

  The registry order is the hub's order, and for a long time the hub opened
  on tokens and icons — the things you reach for once the boxes are already
  in the right places. Nothing in the first twenty tools touched layout at
  all, which is both the wrong teaching order and the wrong merchandising
  one: "css grid generator" and "flexbox generator" are the two highest
  -volume queries this whole section can answer.
*/
export const DESIGNER_TOOLS: DesignerTool[] = [
  {
    href: '/tools/grid',
    group: 'Layout & spacing',
    name: 'Grid Generator',
    description:
      'Paint a page layout onto a grid and copy the CSS, with grid-template-areas checked for the rectangle rule as you go — the rule that silently voids the whole declaration when you break it. Explicit tracks or a responsive auto-fit wall.',
    icon: LayoutGrid,
    accent: 'from-blue-500 to-indigo-500',
    keywords:
      'grid css grid generator layout template areas columns rows gap auto-fit minmax fr responsive',
    seoTitle: 'CSS Grid Generator — Template Areas, Tracks & auto-fit — Hoverlab',
  },
  {
    href: '/tools/flexbox',
    group: 'Layout & spacing',
    name: 'Flexbox Playground',
    description:
      'Every flex container and flex item property on one screen, against a live row you can add to and resize. Shows the three-part flex shorthand as the browser actually resolves it, including the basis-versus-width trap.',
    icon: StretchVertical,
    accent: 'from-teal-500 to-cyan-500',
    keywords:
      'flexbox flex generator playground layout justify-content align-items flex-grow shrink basis wrap gap',
    seoTitle: 'Flexbox Playground & Generator — Every Property, Live — Hoverlab',
  },
  {
    href: '/tools/tokens',
    group: 'Colour',
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
    group: 'Type & icons',
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
    group: 'Effects & motion',
    name: 'Motion Presets',
    description:
      'Enter, exit and attention animations, each shipping with its prefers-reduced-motion guard already written — and each one opening in the keyframes editor when the preset is only nearly right. Preview what a reduced-motion visitor actually sees.',
    icon: Zap,
    accent: 'from-yellow-500 to-amber-500',
    keywords:
      'motion animation presets enter exit keyframes prefers-reduced-motion editable timeline',
    seoTitle: 'CSS Animation Presets with Reduced-Motion Guards — Hoverlab',
  },
  {
    href: '/tools/placeholders',
    group: 'Ship it',
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
    group: 'Ship it',
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
    group: 'Ship it',
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
    group: 'Ship it',
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
    group: 'Colour',
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
    group: 'Colour',
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
    group: 'Colour',
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
    group: 'Effects & motion',
    name: 'Shadow Builder',
    description:
      'Layer up to 8 box-shadows or text-shadows with independent x/y/blur/spread/color/opacity controls, or start from an elevation ramp, an inset well, or neumorphism computed from the surface colour — with the contrast caveat that style carries said out loud.',
    icon: Layers,
    accent: 'from-sky-500 to-cyan-500',
    keywords:
      'box-shadow text-shadow shadow elevation depth layers css neumorphism neumorphic soft ui inset inner',
    seoTitle: 'Box-Shadow, Inset & Neumorphism Generator — Hoverlab',
  },
  {
    href: '/tools/contrast',
    group: 'Colour',
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
    group: 'Layout & spacing',
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
    group: 'Type & icons',
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
    group: 'Layout & spacing',
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
    group: 'Layout & spacing',
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
    group: 'Effects & motion',
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
    group: 'Effects & motion',
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
    group: 'Effects & motion',
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
    group: 'Effects & motion',
    name: 'Noise Texture',
    description:
      "Film-grain and noise textures from the browser's own feTurbulence — a seamlessly tiling SVG data URI, previewed over a gradient and a card with the real blend mode. No PNG asset, no request, works offline.",
    icon: Film,
    accent: 'from-stone-500 to-zinc-600',
    keywords: 'noise grain texture feturbulence svg film overlay background',
    seoTitle: 'SVG Noise Texture Generator — Grain via feTurbulence — Hoverlab',
  },
  {
    href: '/tools/keyframes',
    group: 'Effects & motion',
    name: 'Keyframes Editor',
    description:
      'Author a multi-stop animation on a timeline instead of hand-typing percentages. Transform, opacity and blur per stop, playback controls, and the prefers-reduced-motion guard written for you — with the stricter guard when the animation loops.',
    icon: Clapperboard,
    accent: 'from-orange-500 to-amber-500',
    keywords:
      'keyframes animation css editor timeline transform opacity easing duration reduced-motion',
    seoTitle: 'CSS @keyframes Editor — Multi-stop Animation Builder — Hoverlab',
  },
  {
    href: '/tools/divider',
    group: 'Layout & spacing',
    name: 'Section Divider',
    description:
      'Waves, tilts, notches and arcs for the seam between two full-width bands, as scalable SVG. Emits currentColor so one snippet works in both themes, with the baseline gap and the antialiased hairline already handled.',
    icon: Waves,
    accent: 'from-cyan-500 to-sky-500',
    keywords:
      'divider wave svg section separator shape curve tilt slant hero background transition',
    seoTitle: 'SVG Section Divider Generator — Waves, Tilts & Curves — Hoverlab',
  },
  {
    href: '/tools/mesh',
    group: 'Colour',
    name: 'Mesh Gradient',
    description:
      'The soft multi-colour wash every hero uses, as stacked CSS radial gradients rather than a 400KB PNG. Drag the blobs on the canvas; fades avoid the grey halo that `transparent` gives every one of them.',
    icon: Blend,
    accent: 'from-violet-500 to-pink-500',
    keywords:
      'mesh gradient blob radial hero background css multi-colour wash aurora blur',
    seoTitle: 'CSS Mesh Gradient Generator — No Image, No Request — Hoverlab',
  },
  {
    href: '/tools/filter',
    group: 'Effects & motion',
    name: 'Filter & Blend',
    description:
      'Every filter function, backdrop-filter, and all sixteen blend modes on a subject drawn in CSS. Order is preserved because blur-then-brighten is a different picture from brighten-then-blur, and nothing is loaded from anywhere.',
    icon: Aperture,
    accent: 'from-rose-500 to-fuchsia-500',
    keywords:
      'filter backdrop-filter blend mode blur brightness contrast saturate hue-rotate drop-shadow duotone',
    seoTitle: 'CSS Filter & Blend Mode Playground — Live Preview — Hoverlab',
  },
  {
    href: '/tools/transform',
    group: 'Effects & motion',
    name: '3D Transform',
    description:
      'rotateX, rotateY, translateZ and the three parent properties that have to agree before any of it works — perspective, transform-style and backface-visibility. Includes the card flip everyone is really trying to build.',
    icon: Box,
    accent: 'from-indigo-500 to-blue-600',
    keywords:
      'transform 3d perspective rotate translate scale skew backface transform-style card flip',
    seoTitle: 'CSS 3D Transform & Perspective Playground — Hoverlab',
  },
  {
    href: '/tools/scrollbar',
    group: 'Effects & motion',
    name: 'Scrollbar Styler',
    description:
      'Both mechanisms from one set of controls — the standard scrollbar-width and scrollbar-color, plus the ::-webkit- pseudo-elements — in the order that makes them agree. Warns when the result gets too thin to grab.',
    icon: Rows3,
    accent: 'from-slate-500 to-slate-700',
    keywords:
      'scrollbar custom css webkit scrollbar-width scrollbar-color thumb track hide overflow',
    seoTitle: 'Custom Scrollbar CSS Generator — Standard + WebKit — Hoverlab',
  },
  {
    href: '/tools/colorblind',
    group: 'Colour',
    name: 'Colour Blindness Simulator',
    description:
      'Which pairs in your palette become the same colour under each type of colour blindness — the failure a contrast checker cannot see. Reports collisions, not just recoloured swatches.',
    icon: Eye,
    accent: 'from-emerald-500 to-lime-500',
    keywords:
      'colour blindness colorblind simulator deuteranopia protanopia tritanopia accessibility palette a11y contrast',
    seoTitle: 'Colour Blindness Simulator — Find Palette Collisions — Hoverlab',
  },
  {
    href: '/tools/tailwind',
    group: 'Ship it',
    name: 'Tailwind ↔ CSS',
    description:
      'Translate a stylesheet into utilities or a className back into CSS, with a verdict on every line — exact, arbitrary value, arbitrary property, or why it could not be placed. Nothing is dropped in silence.',
    icon: Wind,
    accent: 'from-sky-600 to-teal-500',
    keywords:
      'tailwind css converter translate utilities class arbitrary values convert stylesheet',
    seoTitle: 'Tailwind to CSS Converter — Both Directions — Hoverlab',
  },
  {
    href: '/tools/svg',
    group: 'Ship it',
    name: 'SVG Toolkit',
    description:
      'The four SVG jobs that are always four different websites — optimise, convert to JSX or a data URI, generate a pattern, generate a wave — with one source shared between them, so the file you clean is the file you convert.',
    icon: Wand2,
    accent: 'from-purple-500 to-blue-500',
    keywords:
      'svg optimizer optimiser minify svgo jsx react component data uri base64 pattern background wave generator convert icon',
    seoTitle: 'SVG Optimizer, SVG to JSX, Pattern & Wave Generator — Hoverlab',
  },
  {
    href: '/tools/palette-preview',
    group: 'Colour',
    name: 'Live Palette Preview',
    description:
      'Your palette on real components — a navbar, a hero, pricing, a dashboard, a footer — repainted as you drag, in both themes, with the contrast of every token pair checked while you do it. Not swatches next to lorem ipsum.',
    icon: Brush,
    accent: 'from-rose-500 to-violet-500',
    keywords:
      'palette preview live colors realtime theme tokens brand colour scheme components blocks dark mode contrast wcag',
    seoTitle: 'Live Colour Palette Preview on Real UI — Hoverlab',
  },
  {
    href: '/tools/loader',
    group: 'Effects & motion',
    name: 'Loader Generator',
    description:
      'Spinners, dots, bars, pulses and progress rings as pure CSS, tuned on sliders and seeded from the loaders already in the catalog. Every one ships with its reduced-motion guard and the accessible status role written in.',
    icon: LoaderCircle,
    accent: 'from-cyan-500 to-indigo-500',
    keywords:
      'loader spinner loading animation css generator dots bars pulse progress ring skeleton reduced-motion aria-busy',
    seoTitle: 'CSS Loader & Spinner Generator — Pure CSS, No SVG — Hoverlab',
  },
  {
    href: '/tools/convert',
    group: 'Ship it',
    name: 'HTML to JSX',
    description:
      'Paste markup and a stylesheet, take away a component — React, Vue, Svelte, styled-components or Tailwind. The same engine the catalog exports through, pointed at your own code, and it says what changed on the way through rather than leaving you to find out.',
    icon: Braces,
    accent: 'from-violet-500 to-purple-600',
    keywords:
      'html jsx react vue svelte styled-components convert converter transform markup component paste',
    seoTitle: 'HTML to JSX Converter — Also Vue, Svelte, styled-components — Hoverlab',
  },
  {
    href: '/tools/shadcn',
    group: 'Colour',
    name: 'shadcn Theme Editor',
    description:
      'Tune a shadcn/ui theme against real components in light and dark at once, then install it with one command — the export is a registry item the CLI reads, not a block of CSS to paste and hope.',
    icon: SwatchBook,
    accent: 'from-zinc-600 to-zinc-900',
    keywords:
      'shadcn theme editor generator registry cli tweakcn oklch css variables radius light dark preview',
    seoTitle: 'shadcn/ui Theme Editor — Live Preview, One-Command Install — Hoverlab',
  },
  {
    href: '/tools/code-image',
    group: 'Ship it',
    name: 'Code to Image',
    description:
      'A snippet as a PNG for the places that will not take a code block — slides, social cards, release notes. Drawn on a canvas in your tab, so the preview is the file rather than a DOM screenshot that reflows under different fonts, and nothing is uploaded.',
    icon: Code2,
    accent: 'from-violet-500 to-purple-600',
    keywords:
      'code image screenshot snippet png carbon ray so social card slide syntax highlight export share',
    seoTitle: 'Code to Image — Snippet Screenshots as PNG, Offline — Hoverlab',
  },
]

/**
 * Words too common across the registry to say anything about relatedness.
 *
 * Nearly every tool's keywords contain "css"; a term that appears on most
 * of the list carries no signal and, worse, drowns the terms that do —
 * two tools sharing only "css" would outrank two sharing "contrast" and
 * "wcag" purely on ordering luck.
 */
const RELATED_STOPWORDS = new Set(['css', 'and', 'the', 'for', 'to', 'of', 'in', 'a'])

/** A tool's keyword line as a set of comparable terms. */
function keywordSet(tool: DesignerTool): Set<string> {
  return new Set(
    tool.keywords
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 1 && !RELATED_STOPWORDS.has(word)),
  )
}

/**
 * The tools most worth showing next to this one.
 *
 * Derived from shared keywords rather than a hand-maintained `related`
 * field on every entry, for the reason the registry exists at all: a new
 * tool added to the list should appear everywhere it belongs without
 * twenty other entries having to be edited to mention it. A hand-kept
 * graph of twenty nodes is a graph that is wrong within two additions.
 *
 * Ties break on registry order, which makes the output deterministic —
 * these render into statically generated pages, and a rail that reshuffled
 * between builds would churn the HTML for nothing.
 *
 * Every tool gets `limit` neighbours even when the overlap is zero: the
 * section is titled as more tools rather than as a claim of similarity, so
 * the weakest case is a plain list rather than a wrong one.
 */
export function relatedTools(href: string, limit = 3): DesignerTool[] {
  const self = DESIGNER_TOOLS.find((tool) => tool.href === href)
  if (!self) return DESIGNER_TOOLS.slice(0, limit)

  const mine = keywordSet(self)

  return DESIGNER_TOOLS.filter((tool) => tool.href !== href)
    .map((tool, index) => {
      let shared = 0
      for (const word of keywordSet(tool)) if (mine.has(word)) shared++
      return { tool, shared, index }
    })
    .sort((a, b) => (b.shared === a.shared ? a.index - b.index : b.shared - a.shared))
    .slice(0, limit)
    .map((scored) => scored.tool)
}
