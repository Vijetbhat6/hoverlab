/**
 * Editorial copy for each category.
 *
 * The category hub pages exist to rank for head terms ("css loaders",
 * "css glassmorphism card") and then hand the visitor off to a specific
 * effect. Both halves of that need prose: a search result with no
 * description gets skipped, and a page that is only a grid of previews
 * gives a crawler nothing to match a query against.
 *
 * Keyed by the category name so a missing entry is a type error the
 * moment a category is added to CATEGORIES.
 */

import type { EffectCategory } from './effect-types'

export interface CategoryMeta {
  /** One sentence, used as the meta description and the page lede. */
  blurb: string
  /** What someone would actually search for. Feeds the keywords tag. */
  keywords: string[]
}

export const CATEGORY_META: Record<EffectCategory, CategoryMeta> = {
  Buttons: {
    blurb:
      'Copy-paste CSS buttons — solid fills, gradients, outlines, glow and lift-on-hover states, in every size and color.',
    keywords: ['css button', 'button hover effect', 'gradient button', 'animated button css'],
  },
  Loaders: {
    blurb:
      'Pure-CSS spinners, dots, bars and pulse loaders that need no SVG, no images and no JavaScript.',
    keywords: ['css loader', 'css spinner', 'loading animation css', 'pure css loader'],
  },
  Cards: {
    blurb:
      'Card surfaces with hover lifts, gradient borders, glassmorphism and glow — ready to drop into any grid.',
    keywords: ['css card', 'card hover effect', 'glassmorphism card', 'card design css'],
  },
  Text: {
    blurb:
      'Gradient text, typewriter reveals, shimmer headings and outline type — all with plain CSS.',
    keywords: ['css text effect', 'gradient text css', 'animated text css', 'text shimmer'],
  },
  Backgrounds: {
    blurb:
      'Animated gradients, mesh blurs, auroras and moving washes for full-page or hero backgrounds.',
    keywords: ['css background animation', 'animated gradient background', 'css mesh gradient'],
  },
  'Inputs & Hover': {
    blurb:
      'Form fields and hover interactions — floating labels, focus glows, underline reveals and fill transitions.',
    keywords: ['css input focus', 'floating label css', 'input animation css', 'hover effect css'],
  },
  'Navigation & Menus': {
    blurb:
      'Nav bars, link underlines, dropdown reveals and menu indicators built from CSS alone.',
    keywords: ['css navbar', 'nav link hover', 'css menu animation', 'underline hover effect'],
  },
  'Dividers & Separators': {
    blurb:
      'Section breaks with gradients, animated rules, dotted runs and decorative ornaments.',
    keywords: ['css divider', 'section separator css', 'gradient hr css'],
  },
  'Badges & Tags': {
    blurb:
      'Status pills, count badges and label chips — solid, outlined, glowing and animated.',
    keywords: ['css badge', 'status pill css', 'tag chip css', 'notification badge'],
  },
  'Toggles & Switches': {
    blurb:
      'Checkbox-driven switches, segmented toggles and day/night flips that work without any JavaScript.',
    keywords: ['css toggle switch', 'pure css switch', 'checkbox toggle css', 'ios switch css'],
  },
  'Tooltips & Popovers': {
    blurb:
      'Hover tooltips and small popovers positioned with pseudo-elements — no positioning library required.',
    keywords: ['css tooltip', 'pure css tooltip', 'popover css', 'tooltip arrow css'],
  },
  'Skeletons & Shimmers': {
    blurb:
      'Loading placeholders with sweeping shimmer gradients for text lines, avatars and cards.',
    keywords: ['css skeleton loader', 'shimmer effect css', 'skeleton screen', 'content placeholder'],
  },
  'Entrance Animations': {
    blurb:
      'Fade-ups, scale-ins, slides and flips for elements arriving on the page.',
    keywords: ['css entrance animation', 'fade in css', 'slide in animation css', 'css keyframes'],
  },
  'Borders & Outlines': {
    blurb:
      'Animated gradient borders, marching-ant dashes, corner brackets and expanding focus outlines.',
    keywords: ['css animated border', 'gradient border css', 'marching ants border', 'css outline animation'],
  },
  'Progress & Meters': {
    blurb:
      'Determinate and indeterminate bars, conic progress rings, segmented meters and usage gauges.',
    keywords: ['css progress bar', 'circular progress css', 'conic gradient progress', 'css meter'],
  },
  'Avatars & Images': {
    blurb:
      'Avatar rings, initials tiles, stacked groups, image zooms and grayscale-to-color reveals.',
    keywords: ['css avatar', 'avatar ring css', 'image hover zoom css', 'avatar group css'],
  },
  'Modals & Overlays': {
    blurb:
      'Dialogs, bottom sheets, blurred backdrops and product-tour spotlights, styled in pure CSS.',
    keywords: ['css modal', 'bottom sheet css', 'backdrop blur modal', 'css overlay'],
  },
  'Alerts & Toasts': {
    blurb:
      'Inline alerts, gradient toasts, countdown notifications and live status pills.',
    keywords: ['css alert', 'toast notification css', 'css snackbar', 'status pill css'],
  },
  'Accordions & Tabs': {
    blurb:
      'Tab rows with sliding indicators plus JavaScript-free accordions built on the <details> element.',
    keywords: ['css tabs', 'pure css accordion', 'details accordion css', 'segmented control css'],
  },
  '3D & Perspective': {
    blurb:
      'Tilt cards, flip panels, extruded push buttons and rotating cubes using real CSS 3D transforms.',
    keywords: ['css 3d transform', 'css flip card', 'tilt card css', 'perspective css'],
  },
  'Glow & Neon': {
    blurb:
      'Neon tube text, glowing borders, breathing orbs and flickering signs for dark interfaces.',
    keywords: ['css neon text', 'glow effect css', 'neon border css', 'css text shadow glow'],
  },
  'Patterns & Textures': {
    blurb:
      'Dot grids, diagonal stripes, checkerboards, graph paper and contour maps — gradients only, no image files.',
    keywords: ['css background pattern', 'css dot grid', 'striped background css', 'css graph paper'],
  },
  'Masks & Clip Paths': {
    blurb:
      'Clip-path reveals, hexagon tiles, morphing blobs and edge-fade masks.',
    keywords: ['css clip-path', 'mask-image css', 'css hexagon', 'blob shape css'],
  },
  'Charts & Data': {
    blurb:
      'Bar charts, conic donuts, sparklines, KPI tiles and heat grids drawn entirely in CSS.',
    keywords: ['css chart', 'css bar chart', 'conic gradient pie chart', 'css sparkline'],
  },
  'Timelines & Steps': {
    blurb:
      'Vertical activity timelines, checkout steppers and pipeline progress rails.',
    keywords: ['css timeline', 'css stepper', 'progress steps css', 'checkout steps ui'],
  },
}
