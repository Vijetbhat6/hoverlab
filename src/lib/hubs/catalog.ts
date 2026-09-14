/**
 * Intent hubs — one landing page per phrase somebody actually types.
 *
 * The catalog already has three kinds of hub, and all three are named the
 * way *we* think about the catalog rather than the way anyone searches for
 * it. `/category/glow-neon` is our taxonomy. `/blocks/pricing` is our
 * taxonomy. `/browse?q=glassmorphism` is a query string, which makes a weak
 * canonical and renders nothing a crawler keeps.
 *
 * Nobody types "glow & neon". They type "css neon glow", "glassmorphism
 * cards", "tailwind loaders", "react pricing table". Those phrases cut
 * across our taxonomy — a glassmorphism query wants cards *and* modals
 * *and* backgrounds, and a "react pricing table" query wants a block, a
 * page and a template in one view. An intent hub is a saved query with
 * editorial copy around it, published at a stable URL.
 *
 * DATA-ONLY on purpose, in the same way `paths/catalog.ts` is. The
 * filters are declarative and `hubs/resolve.ts` runs them against
 * `BROWSE_INDEX`, so a hub can never list an artifact the catalog does not
 * contain, and a category rename shows up as an empty hub in
 * `scripts/check-hubs.mts` rather than as a dead page in production.
 *
 * ── WHAT MAKES ONE OF THESE NOT A DOORWAY PAGE ──────────────────────────
 *
 * Sixty-odd near-identical pages generated off a keyword list is the
 * textbook definition of the thing Google demotes, and the difference is
 * not subtle: every one of these has to carry something that is true only
 * of it. Concretely, each entry here owns
 *
 *   `lede`  two or three sentences written for this phrase, about what the
 *           thing *is* and when to reach for it — not a mad-lib over the
 *           slug;
 *   `faq`   at least two hand-written questions that only make sense on
 *           this page (the render adds two more computed from the actual
 *           matches, which also differ per hub);
 *   `filter` a query whose results are genuinely different from its
 *           neighbours' — `scripts/check-hubs.mts` fails the build when two
 *           hubs resolve to near-identical sets.
 *
 * If you cannot write those three for a phrase, the phrase does not get a
 * page. That is the whole editorial rule.
 */

import type { ArtifactLevel } from '@/lib/artifact-types'

/* ------------------------------------------------------------------ *
 *  Shapes
 * ------------------------------------------------------------------ */

/**
 * A declarative query over the flattened catalog.
 *
 * Axes are ANDed, values within an axis are ORed: `{ categories: ['Buttons'],
 * match: ['gradient', 'conic'] }` means "a button whose text mentions a
 * gradient or a conic", which is what "gradient buttons" means to the
 * person typing it.
 *
 * Every axis is optional, but `check-hubs` rejects a filter with none set —
 * a hub that matches the whole catalog is the front page with a different
 * title on it.
 */
export interface HubFilter {
  /** Rungs of the ladder to consider. Absent means all five. */
  levels?: ArtifactLevel[]
  /**
   * Exact category names, from any level's taxonomy. They are matched
   * case-insensitively but otherwise literally, so a renamed category
   * fails the build instead of quietly emptying a page.
   */
  categories?: string[]
  /** Exact tags, matched case-insensitively against an artifact's own tags. */
  tags?: string[]
  /** Substrings, matched against name + id + description + tags. */
  match?: string[]
  /**
   * Substrings that disqualify a match, applied last.
   *
   * The reason this exists: "loaders" matches every skeleton in the
   * catalog, and a page titled "CSS spinners" that opens on eleven
   * shimmer placeholders has answered a different question than the one
   * asked.
   */
  exclude?: string[]
}

export interface HubFaq {
  /** Phrased as somebody would ask it, not as a heading. */
  q: string
  a: string
}

export interface IntentHub {
  /** URL segment under /ui. The phrase, hyphenated. */
  slug: string
  /** The <h1>. The phrase as typed, in sentence case. */
  title: string
  /** One line under the h1. What the page holds, not what it sells. */
  tagline: string
  /**
   * The paragraph. Two or three sentences of real editorial about the
   * technique or the section — written for this phrase and no other.
   */
  lede: string
  /** The saved query this page is. */
  filter: HubFilter
  /**
   * Which rung leads the page. The grid opens on this level and the other
   * matching levels follow as rails.
   *
   * Explicit rather than "whichever level matched most": "landing page
   * templates" matches far more blocks than templates, and opening that
   * page on blocks answers the wrong question.
   */
  lead: ArtifactLevel
  /** Hand-written and hub-specific. Two minimum — see the header. */
  faq: HubFaq[]
  /** Extra query terms for `keywords`, beyond the ones in the title. */
  keywords?: string[]
  /**
   * Sibling hubs worth a link. Optional: `resolve.ts` fills the rest from
   * how much two hubs' result sets actually overlap, which keeps the
   * cross-links honest as the catalog grows.
   */
  related?: string[]
}

/* ------------------------------------------------------------------ *
 *  The CSS layer — effects, and the phrases people search them by
 * ------------------------------------------------------------------ */

const CSS_HUBS: IntentHub[] = [
  {
    slug: 'glassmorphism-cards',
    title: 'Glassmorphism cards',
    tagline: 'Frosted panels with a blurred backdrop, in copy-paste CSS.',
    lede: 'Glassmorphism is one property doing the work — `backdrop-filter: blur()` over a semi-transparent fill, with a hairline light border to fake the edge of the pane. It only reads as glass when there is something behind it to blur, so every one of these assumes a busy background and most of them ship one. The effect is expensive to composite, so use it on a handful of surfaces rather than a whole grid.',
    filter: { match: ['glass', 'frosted', 'backdrop'] },
    lead: 'effect',
    keywords: ['glassmorphism css', 'frosted glass card', 'backdrop-filter blur', 'glass ui'],
    faq: [
      {
        q: 'Does backdrop-filter work everywhere?',
        a: 'Every current browser supports it, but Firefox only unflagged it in version 103 and it is still the single most expensive thing on this page to paint. Give the panel a solid fallback background first and let the blur be the enhancement, which is how these are written.',
      },
      {
        q: 'Why does my glass panel look grey instead of glassy?',
        a: 'Almost always because there is nothing behind it. A blurred backdrop over a flat background colour is that same colour — you need an image, a gradient or an overlapping element underneath before the effect exists at all.',
      },
    ],
    related: ['animated-backgrounds', 'card-hover-effects'],
  },
  {
    slug: 'neon-glow-effects',
    title: 'CSS neon glow effects',
    tagline: 'Layered shadows that read as light rather than as a border.',
    lede: 'A convincing neon is three or four `box-shadow` layers at increasing blur and decreasing opacity, all in the same hue, plus a near-white core so the tube looks lit from inside. Text glows use `text-shadow` the same way. The trap is saturation: pure `#f0f` glows muddy, and a slightly desaturated hue with a white core reads brighter than a more saturated one.',
    filter: { categories: ['Glow & Neon'] },
    lead: 'effect',
    keywords: ['neon css', 'glowing button css', 'neon text effect', 'css glow'],
    faq: [
      {
        q: 'Why does the glow look flat on a white background?',
        a: 'Neon is a light source, and a light source only shows against something darker than it. These are all built on dark surfaces for that reason; on a light page the same shadows read as a soft drop shadow, which is a different effect.',
      },
      {
        q: 'Do the animated ones cost anything at runtime?',
        a: 'Animating `box-shadow` repaints on every frame, so the pulsing variants are the heaviest thing here. Where it mattered we animate `opacity` on a duplicated glow layer instead, which the compositor can handle without repainting.',
      },
    ],
    related: ['css-buttons', 'gradient-text'],
  },
  {
    slug: 'tailwind-loaders',
    title: 'Tailwind loaders',
    tagline: 'Spinners, bars, dots and skeletons — no JavaScript in any of them.',
    lede: 'A loader is the one component where the honest version beats the clever one: if you know the progress, show a bar; if you do not, show something that does not pretend to. These are pure CSS keyframes, so they start the moment the markup parses rather than after a bundle loads — which is the whole point of a loading state.',
    filter: { categories: ['Loaders', 'Skeletons & Shimmers'] },
    lead: 'effect',
    keywords: ['tailwind spinner', 'css loading animation', 'loading indicator', 'tailwind loading'],
    faq: [
      {
        q: 'How do I use these with Tailwind rather than plain CSS?',
        a: 'Each one ships as a class plus its keyframes. Paste the keyframes into your stylesheet (or a `@theme` block) and the markup is ordinary utility classes — nothing here needs a plugin or a config change.',
      },
      {
        q: 'Which loader should I actually reach for?',
        a: 'Under about a second, none: a spinner that flashes for 300ms reads as a glitch. Past that, a bar if you can measure the work and a skeleton if the shape of the result is predictable, because a skeleton tells the reader what is coming.',
      },
    ],
    related: ['skeleton-loaders', 'css-spinners', 'progress-bars'],
  },
  {
    slug: 'css-spinners',
    title: 'CSS spinners',
    tagline: 'Rotating loaders built from borders, conic gradients and dots.',
    lede: 'Nearly every spinner here is one element: a transparent border with one coloured side, or a conic gradient masked into a ring, rotated forever. That matters more than it sounds — a spinner is what renders while the rest of the page is still arriving, so it cannot depend on anything that has not arrived yet.',
    filter: { match: ['spinner', 'spin'], exclude: ['skeleton', 'shimmer'] },
    lead: 'effect',
    keywords: ['css loading spinner', 'pure css spinner', 'loading circle css'],
    faq: [
      {
        q: 'How do I stop these for people who get motion sick?',
        a: 'Wrap the animation in `@media (prefers-reduced-motion: no-preference)`, which is what every spinner here does. The fallback is a static ring, so the element still communicates "busy" without moving.',
      },
      {
        q: 'Does a spinner need an ARIA role?',
        a: 'The spinner itself should be `aria-hidden`, with the live region on the thing it is standing in for — `role="status"` on the container and a short "Loading results" inside it. A rotating div announced as an image helps nobody.',
      },
    ],
    related: ['tailwind-loaders', 'progress-bars'],
  },
  {
    slug: 'skeleton-loaders',
    title: 'Skeleton loaders',
    tagline: 'Shimmering placeholders shaped like the content that replaces them.',
    lede: 'A skeleton is a promise about layout: the grey blocks should sit exactly where the real text and images will, so nothing jumps when the data lands. The shimmer is a moving gradient, not an opacity pulse, because a sweep reads as "working" while a fade reads as "broken". Match the number of lines to the typical result, not the longest one.',
    filter: { categories: ['Skeletons & Shimmers'] },
    lead: 'effect',
    keywords: ['skeleton screen css', 'shimmer loading', 'content placeholder', 'loading skeleton'],
    faq: [
      {
        q: 'Skeleton or spinner?',
        a: 'Skeleton when you know the shape of what is coming — a list, a card, an article. Spinner when you do not, or when the wait is for an action rather than for content. A skeleton that guesses the layout wrong is worse than a spinner, because it moves twice.',
      },
      {
        q: 'Why is my shimmer invisible in dark mode?',
        a: 'The sweep is usually a white gradient at low opacity, which disappears against a dark placeholder. These use a translucent highlight over the surface token rather than a fixed colour, so they keep contrast in both themes.',
      },
    ],
    related: ['tailwind-loaders', 'empty-states'],
  },
  {
    slug: 'css-buttons',
    title: 'CSS button styles',
    tagline: 'Solid, outline, ghost, gradient and glow — every state included.',
    lede: 'A button is the most-clicked element you will ship and the one most often shipped with three of its five states missing. Everything here defines hover, active, focus-visible and disabled, not just the resting state, because a button that only looks right at rest is a button that feels broken under the cursor.',
    filter: { categories: ['Buttons'] },
    lead: 'effect',
    keywords: ['button css', 'tailwind button', 'css button hover', 'button styles'],
    faq: [
      {
        q: 'Why focus-visible and not focus?',
        a: '`:focus` fires on mouse clicks too, which is why so many sites remove the ring entirely and break keyboard use for everyone. `:focus-visible` shows the ring only when the browser thinks it will help — keyboard, mostly — so you keep the accessibility without the clicked-button halo.',
      },
      {
        q: 'Can I use these on an anchor instead of a button?',
        a: 'Yes, and the styles do not care, but the semantics do: use `<a>` when it navigates and `<button>` when it acts. If you must style a link as a button, keep the underline removal but leave the href — screen readers announce the difference and users rely on it.',
      },
    ],
    related: ['css-hover-effects', 'neon-glow-effects', 'animated-borders'],
  },
  {
    slug: 'animated-backgrounds',
    title: 'Animated backgrounds',
    tagline: 'Gradients, waves, particles and meshes that move without JavaScript.',
    lede: 'An animated background is the cheapest way to make a static page feel alive and the easiest place to burn a laptop battery. The rule these follow: animate `transform` and `opacity` on a small number of layers, never `background-position` on a full-viewport element, and give everything a `prefers-reduced-motion` exit.',
    filter: { categories: ['Backgrounds'] },
    lead: 'effect',
    keywords: ['css animated background', 'moving background css', 'hero background animation'],
    faq: [
      {
        q: 'Will one of these slow down my landing page?',
        a: 'The gradient and mesh ones are effectively free — one composited layer. The particle and wave variants animate several elements at once, so keep them to a single hero rather than repeating them down the page, and never run two at the same time.',
      },
      {
        q: 'How do I put content on top and keep it readable?',
        a: 'Add a scrim: a solid or gradient overlay at 40–60% between the background and the text. Every one of these is written to sit behind a scrim rather than directly behind copy, because animated contrast is contrast you cannot measure.',
      },
    ],
    related: ['gradient-backgrounds', 'background-patterns', 'glassmorphism-cards'],
  },
  {
    slug: 'gradient-backgrounds',
    title: 'CSS gradient backgrounds',
    tagline: 'Linear, radial, conic and mesh ramps you can paste into a hero.',
    lede: 'Most bad gradients are two saturated colours interpolated through the grey in the middle of sRGB. The fix is either a third stop that keeps the path out of the mud, or interpolation in a perceptual space — `in oklch` — which modern browsers support directly. Both approaches are in here, and the mesh variants are stacked radials rather than an image.',
    filter: {
      categories: ['Backgrounds', 'Patterns & Textures'],
      match: ['gradient', 'mesh', 'aurora', 'conic', 'radial'],
    },
    lead: 'effect',
    keywords: ['css gradient background', 'mesh gradient css', 'aurora gradient', 'oklch gradient'],
    faq: [
      {
        q: 'What is banding and how do I get rid of it?',
        a: 'Visible stripes across a smooth ramp, from 8-bit colour on a large area. A faint noise texture over the gradient breaks it up — the grain overlays on this site are there for exactly that — and so does a slight hue shift along the ramp.',
      },
      {
        q: 'Why does the same gradient look different in Safari?',
        a: 'Colour interpolation defaults differ, and Safari has historically been more aggressive about display-P3. If it matters, state the space explicitly with `linear-gradient(in oklab, …)` rather than relying on the default.',
      },
    ],
    related: ['animated-backgrounds', 'gradient-text', 'background-patterns'],
  },
  {
    slug: 'background-patterns',
    title: 'CSS background patterns',
    tagline: 'Grids, dots, stripes and checkerboards from gradients alone.',
    lede: 'Every pattern here is a repeating gradient, not an image: nothing to download, nothing to go blurry on a retina screen, and the colour is a variable you can retheme. They are best at very low contrast — a grid you notice is a grid competing with your content — and they tile at whatever `background-size` you give them.',
    filter: { categories: ['Patterns & Textures'] },
    lead: 'effect',
    keywords: ['css pattern background', 'grid background css', 'dot pattern', 'stripes css'],
    faq: [
      {
        q: 'How do I fade a pattern out at the edges?',
        a: 'Mask it: `mask-image: radial-gradient(ellipse at center, black, transparent 70%)`. That is how the hero grids on most sites stop cleanly instead of hitting the viewport edge mid-square.',
      },
      {
        q: 'Do these cost more than a tiled PNG?',
        a: 'No, and usually less. A repeating gradient is painted once and cached as a tile, with no request, no decode and no second asset for dark mode — you change a custom property instead.',
      },
    ],
    related: ['gradient-backgrounds', 'blend-mode-effects'],
  },
  {
    slug: 'css-text-animations',
    title: 'CSS text animations',
    tagline: 'Reveals, shimmers, glitches and per-letter staggers.',
    lede: 'Text animation is the effect most likely to hurt: it delays the one thing on the page somebody came to read. The ones worth using either finish inside about 600ms or apply to a heading nobody is mid-sentence on. Everything here keeps the text in the DOM as text — no images, no canvas — so it stays selectable, translatable and readable by a screen reader.',
    filter: { categories: ['Text'] },
    lead: 'effect',
    keywords: ['text animation css', 'animated heading', 'css typing effect', 'letter animation'],
    faq: [
      {
        q: 'How do the per-letter ones work without JavaScript?',
        a: 'The markup wraps each letter in a span with an incrementing custom property, and the CSS uses it as an `animation-delay` multiplier. You do have to split the text — either in your template or with one line of JS — but nothing about the animation itself needs a runtime.',
      },
      {
        q: 'Will a reveal animation hurt my LCP?',
        a: 'It can. If the heading is your largest contentful paint, an animation that starts at `opacity: 0` delays LCP by its full duration. Animate a transform from a nearly-visible state instead, or leave the hero heading alone and animate what follows it.',
      },
    ],
    related: ['gradient-text', 'entrance-animations'],
  },
  {
    slug: 'gradient-text',
    title: 'Gradient text',
    tagline: 'Clipped fills, animated ramps and shine sweeps on headings.',
    lede: 'Gradient text is `background-clip: text` with a transparent fill — three lines, and the same three lines everywhere. What varies is the taste: it works on one short heading and looks like a template on every heading, and it destroys contrast if the ramp runs into the page background. Keep the darkest stop within reach of the text colour you would otherwise have used.',
    filter: {
      categories: ['Text'],
      match: ['gradient', 'shine', 'shimmer', 'holographic', 'chrome'],
    },
    lead: 'effect',
    keywords: ['gradient text css', 'background-clip text', 'animated text gradient'],
    faq: [
      {
        q: 'Does a screen reader still read gradient text?',
        a: 'Yes — it is ordinary text with a transparent fill, so nothing about the accessibility tree changes. That is the reason to do it this way rather than shipping a heading as an image.',
      },
      {
        q: 'How do I check contrast on text that is more than one colour?',
        a: 'Measure the lightest stop against the background and treat that as the whole heading. It is the conservative reading and it is the one an auditor will take; if the lightest stop fails, the heading fails.',
      },
    ],
    related: ['css-text-animations', 'gradient-backgrounds'],
  },
  {
    slug: 'css-hover-effects',
    title: 'CSS hover effects',
    tagline: 'What happens under the cursor, across inputs, links and tiles.',
    lede: 'Hover states are the cheapest affordance in interface design: they tell you a thing is interactive before you commit to clicking it. The ones collected here are deliberately small — a lift, a tint, an underline that draws itself — because a hover effect that redraws half the screen is an animation with a pointer trigger, not feedback.',
    filter: { categories: ['Inputs & Hover', 'Micro-interactions'] },
    lead: 'effect',
    keywords: ['css hover animation', 'hover transition', 'link hover effect'],
    faq: [
      {
        q: 'Do hover effects need a keyboard equivalent?',
        a: 'If the hover reveals information, yes — pair it with `:focus-visible` or the content is invisible to anyone not using a mouse. If it is purely decorative, hover alone is fine.',
      },
      {
        q: 'Why does the underline animation jump on the second line?',
        a: 'A background-size underline is painted per line box, so a wrapped link animates each fragment separately. Use `text-decoration-thickness` and `text-underline-offset` for multi-line links, or keep the animated version for single-line ones.',
      },
    ],
    related: ['css-buttons', 'card-hover-effects', 'micro-interactions'],
  },
  {
    slug: 'card-hover-effects',
    title: 'Card hover effects',
    tagline: 'Lifts, tilts, spotlights and border reveals on a card surface.',
    lede: 'A card is a click target the size of a paragraph, so its hover state has to do more work than a button\'s: it needs to say "this whole rectangle is one link". Lift-and-shadow is the reliable answer; spotlight and tilt are the memorable ones. All three are here, and all three keep the transform on the card rather than on its contents, which is what stops the text reflowing mid-hover.',
    filter: { categories: ['Cards'] },
    lead: 'effect',
    keywords: ['card hover css', 'hover card animation', 'tailwind card hover', 'spotlight card'],
    faq: [
      {
        q: 'How do I make the whole card a link without nesting anchors?',
        a: 'Put the anchor on the title and stretch it: `.card { position: relative }` and `.card a::after { position: absolute; inset: 0 }`. One link, full-card target, and the accessible name is still the heading rather than "card".',
      },
      {
        q: 'How does the spotlight follow the cursor with no JavaScript?',
        a: 'It does not, quite — the spotlight variants read two custom properties for the pointer position, and setting those is two lines of JS. The gradient, the mask and the fade are all CSS; only the coordinates come from outside.',
      },
    ],
    related: ['glassmorphism-cards', '3d-card-effects', 'css-hover-effects'],
  },
  {
    slug: '3d-card-effects',
    title: '3D card effects',
    tagline: 'Perspective, tilt and depth from transforms alone.',
    lede: 'Everything in 3D CSS comes from two properties: `perspective` on the parent and `transform-style: preserve-3d` on the child. Get those wrong and your rotations look like a flat image being squashed, which is the usual symptom. Keep the perspective distance large (800–1200px) unless you want the exaggerated, close-up look — small values read as a fisheye.',
    filter: { categories: ['3D & Perspective'] },
    lead: 'effect',
    keywords: ['css 3d transform', 'tilt card css', 'perspective css', '3d hover effect'],
    faq: [
      {
        q: 'Why does my back face show through?',
        a: '`backface-visibility: hidden` on both faces, and make sure the parent has `preserve-3d` — a `transform` on an intermediate element flattens the whole subtree and is the usual culprit.',
      },
      {
        q: 'Are 3D transforms expensive?',
        a: 'They are composited on the GPU, so the rotation itself is cheap, but each 3D element gets its own layer. A grid of forty tilting cards will eat memory; a hero with one will not.',
      },
    ],
    related: ['flip-cards', 'card-hover-effects'],
  },
  {
    slug: 'flip-cards',
    title: 'CSS flip cards',
    tagline: 'Two faces, one element, rotated on hover or focus.',
    lede: 'A flip card is a stack of two absolutely-positioned faces rotated 180° apart inside a `preserve-3d` parent. The part people get wrong is not the rotation, it is the content: whatever is on the back is invisible to anyone who does not hover, so it cannot be the only place important information lives.',
    filter: { match: ['flip'] },
    lead: 'effect',
    keywords: ['flip card css', 'card flip animation', 'hover flip', '3d flip'],
    faq: [
      {
        q: 'How do I make a flip card keyboard accessible?',
        a: 'Trigger on `:focus-within` as well as `:hover` and make the front face contain a real focusable element. Better still, treat the flip as decoration and repeat the back-face content somewhere permanent.',
      },
      {
        q: 'Why is the text on the back mirrored?',
        a: 'The back face needs its own `rotateY(180deg)` so it is already flipped before the parent flips it. Without that, you are reading the back of the front face.',
      },
    ],
    related: ['3d-card-effects', 'card-hover-effects'],
  },
  {
    slug: 'animated-borders',
    title: 'Animated CSS borders',
    tagline: 'Gradient outlines, running lights, dashes and glow rings.',
    lede: 'A real animated border needs a trick, because `border-color` alone cannot hold a gradient. The two that work are a conic gradient on a pseudo-element rotated behind the box, and `background-clip: padding-box` over a gradient background. Both are here, and both cost one extra layer — worth it once, on a featured card, and not worth it on every row of a table.',
    filter: { categories: ['Borders & Outlines'] },
    lead: 'effect',
    keywords: ['animated border css', 'gradient border', 'glowing border', 'border animation'],
    faq: [
      {
        q: 'How do I get a gradient border with rounded corners?',
        a: 'The conic-gradient-behind-the-box approach handles radii correctly; `border-image` does not, which is the whole reason the pseudo-element version exists. Match the pseudo-element\'s radius to the card\'s and inset it by the border width.',
      },
      {
        q: 'Can I animate the border without `@property`?',
        a: 'You can rotate the whole gradient layer, which is what the no-`@property` variants do. Interpolating an angle directly needs `@property --angle { syntax: "<angle>" }`, which is supported everywhere current but degrades to a static border in older engines.',
      },
    ],
    related: ['css-buttons', 'neon-glow-effects'],
  },
  {
    slug: 'section-dividers',
    title: 'CSS section dividers',
    tagline: 'Waves, slants, zigzags and fades between page sections.',
    lede: 'A divider\'s job is to make two stacked sections read as two sections without a hard rule across the page. The shaped ones — waves, slants, curves — are a clip-path or an inline SVG on a sibling element rather than a background image, so they recolour with your tokens and stay crisp at any width. Keep them to one or two per page; a landing page with six is a page made of edges.',
    filter: { categories: ['Dividers & Separators'] },
    lead: 'effect',
    keywords: ['section divider css', 'wave divider', 'svg divider', 'diagonal section'],
    faq: [
      {
        q: 'Why does my wave divider leave a hairline gap?',
        a: 'Sub-pixel rounding between the divider and the next section. Pull the divider up by a pixel with a negative margin and give it the same background colour as the section it leads into, which is how these are set up.',
      },
      {
        q: 'Should a divider be in the markup at all?',
        a: 'Only as decoration — `aria-hidden` on the element, and never as the only signal that a new section started. The `<section>` and its heading do that job for anyone not looking at the page.',
      },
    ],
    related: ['background-patterns', 'clip-path-shapes'],
  },
  {
    slug: 'clip-path-shapes',
    title: 'CSS clip-path shapes',
    tagline: 'Blobs, polygons, arrows and reveal masks, all in one property.',
    lede: '`clip-path` turns a rectangle into any shape you can describe, and `mask-image` does the same with a gradient so the edge can be soft. The animatable case is the useful one: interpolating between two polygons with the same number of points gives you a reveal that no amount of transform work can fake. Keep point counts equal or the transition snaps.',
    filter: { categories: ['Masks & Clip Paths'] },
    lead: 'effect',
    keywords: ['clip-path css', 'css mask', 'blob shape css', 'polygon clip path'],
    faq: [
      {
        q: 'Does clipping hurt text selection or clicks?',
        a: 'Yes — `clip-path` clips hit-testing too, so anything outside the shape is both invisible and unclickable. That is usually what you want; when it is not, clip a decorative pseudo-element rather than the element carrying the content.',
      },
      {
        q: 'Why does my blob animation jump between shapes?',
        a: 'Different numbers of points. `polygon()` interpolates point-by-point, so both keyframes need the same count — repeat a coordinate to pad the shorter one out.',
      },
    ],
    related: ['section-dividers', 'blend-mode-effects'],
  },
  {
    slug: 'blend-mode-effects',
    title: 'CSS blend mode effects',
    tagline: 'Duotones, colour burns, knockout text and filter stacks.',
    lede: 'Blend modes let one layer react to what is under it: `multiply` for shadows and duotones, `screen` for light and glow, `difference` for the knockout text trick where a heading inverts against whatever it crosses. The catch is stacking context — a blend mode only sees inside its own, so an unexpected `transform` or `opacity` on an ancestor will silently isolate it.',
    filter: { categories: ['Filters & Blend Modes'] },
    lead: 'effect',
    keywords: ['mix-blend-mode', 'css duotone', 'knockout text css', 'css filter effects'],
    faq: [
      {
        q: 'Why does my blend mode stop working inside a card?',
        a: 'Something in the ancestry created a stacking context — `transform`, `filter`, `opacity` below 1, or `isolation: isolate`. The blend only composites against layers in the same context, so it blends against the card instead of the page.',
      },
      {
        q: 'Do blend modes work in dark mode?',
        a: 'They work, but they invert in meaning: `multiply` darkens, which is invisible on a dark surface, and `screen` lightens, which is invisible on a light one. The duotones here swap the mode with the theme rather than swapping the colours.',
      },
    ],
    related: ['background-patterns', 'clip-path-shapes'],
  },
  {
    slug: 'scroll-animations',
    title: 'CSS scroll animations',
    tagline: 'Reveal-on-scroll, parallax, sticky stacks and progress bars.',
    lede: 'Scroll-driven animation used to mean an IntersectionObserver and a scroll listener; `animation-timeline: view()` and `scroll()` now do most of it in CSS, off the main thread. These use the native version where it is supported and degrade to the visible end state where it is not — which is the right fallback, because a reveal that never fires leaves your content invisible.',
    filter: { categories: ['Scroll & Sticky'] },
    lead: 'effect',
    keywords: ['scroll animation css', 'reveal on scroll', 'parallax css', 'scroll timeline'],
    faq: [
      {
        q: 'What happens in a browser without scroll-driven animations?',
        a: 'The element renders in its final state. Every one of these is written so the animation is the enhancement rather than the thing that makes content appear — the opposite order is how sites end up blank in Firefox.',
      },
      {
        q: 'Is this better than an IntersectionObserver?',
        a: 'For pure visual reveals, yes: it runs on the compositor and does not fire a JS callback per element. You still need the observer for anything with a side effect, like lazy-loading or analytics.',
      },
    ],
    related: ['entrance-animations', 'navbar-components'],
  },
  {
    slug: 'entrance-animations',
    title: 'Entrance animations',
    tagline: 'Fades, slides, scales and staggered list reveals.',
    lede: 'An entrance animation buys you two things: it draws the eye to what just arrived, and it hides the moment a layout settles. Both are short-lived, so these run 200–400ms and none of them move more than about 24px — a long slide from off-screen reads as a transition between pages, not as an element appearing.',
    filter: { categories: ['Entrance Animations'] },
    lead: 'effect',
    keywords: ['fade in animation css', 'slide in css', 'stagger animation', 'appear animation'],
    faq: [
      {
        q: 'How do I stagger a list without writing forty delays?',
        a: 'Set `--i` on each item in the template and use `animation-delay: calc(var(--i) * 60ms)`. Sixty milliseconds is about the shortest gap that still reads as a sequence rather than as one blur.',
      },
      {
        q: 'Do entrance animations affect Cumulative Layout Shift?',
        a: 'Transform and opacity do not — they do not affect layout. Animating height, margin or top does, and will show up in your CLS score, which is why none of these do.',
      },
    ],
    related: ['scroll-animations', 'css-text-animations', 'micro-interactions'],
  },
  {
    slug: 'micro-interactions',
    title: 'Micro-interactions',
    tagline: 'Small confirmations: checks, likes, copies, ripples and nudges.',
    lede: 'A micro-interaction is the sub-second reply an interface gives when you do something — the tick after a copy, the heart that fills, the shake on a wrong password. They matter out of proportion to their size because they are the only proof the click registered. Keep them under 300ms, and make sure the state they announce is real rather than optimistic.',
    filter: { categories: ['Micro-interactions'] },
    lead: 'effect',
    keywords: ['micro interaction css', 'button feedback animation', 'like animation', 'ripple effect'],
    faq: [
      {
        q: 'Should the animation wait for the server?',
        a: 'Show it immediately and reconcile after. An optimistic tick that occasionally reverts feels faster than a spinner that always tells the truth — as long as the revert is visible and says what went wrong.',
      },
      {
        q: 'How do these behave with reduced motion?',
        a: 'They swap movement for a colour or opacity change rather than disappearing. Removing the feedback entirely would take the confirmation away from the people most likely to need it.',
      },
    ],
    related: ['css-buttons', 'toast-notifications', 'css-hover-effects'],
  },
  {
    slug: 'progress-bars',
    title: 'CSS progress bars',
    tagline: 'Determinate bars, rings, meters and step indicators.',
    lede: 'If you can measure the work, show the measurement — a determinate bar is the single most effective way to make a wait feel shorter. The ring variants are a conic gradient or an SVG `stroke-dasharray`; both take the percentage as one custom property, so wiring them to real progress is one line rather than a component.',
    filter: { categories: ['Progress & Meters'] },
    lead: 'effect',
    keywords: ['progress bar css', 'circular progress css', 'css meter', 'loading bar'],
    faq: [
      {
        q: 'Should I use `<progress>` or a div?',
        a: 'Use `<progress>` when you have a real value — it is announced correctly and it works before your CSS loads. Styling it is awkward across engines, so the div versions here carry `role="progressbar"` and the three `aria-value*` attributes instead.',
      },
      {
        q: 'What about progress I cannot measure?',
        a: 'Use an indeterminate bar — a segment that sweeps — rather than a fake percentage. A bar that sits at 90% for thirty seconds does more damage to trust than a spinner ever does.',
      },
    ],
    related: ['tailwind-loaders', 'css-spinners', 'css-timelines'],
  },
  {
    slug: 'toggle-switches',
    title: 'CSS toggle switches',
    tagline: 'Checkbox-backed switches, segmented toggles and theme flips.',
    lede: 'A switch is a checkbox with a different shape, and building it any other way is how you lose keyboard support. Everything here is a real `<input type="checkbox">` with the visual built from its sibling, so space toggles it, the label clicks it, and the state is in the DOM rather than in a class you have to keep in sync.',
    filter: { categories: ['Toggles & Switches'] },
    lead: 'effect',
    keywords: ['toggle switch css', 'ios switch css', 'checkbox toggle', 'theme toggle css'],
    faq: [
      {
        q: 'Switch or checkbox?',
        a: 'A switch takes effect immediately; a checkbox is a value you submit. If the change only lands when the user presses Save, it is a checkbox, and styling it as a switch is a promise the form does not keep.',
      },
      {
        q: 'Does it need `role="switch"`?',
        a: 'It helps — screen readers then announce "on/off" rather than "checked". Put it on the input itself, keep the native type, and the behaviour stays free.',
      },
    ],
    related: ['form-input-styles', 'form-controls'],
  },
  {
    slug: 'css-tooltips',
    title: 'CSS tooltips',
    tagline: 'Hover and focus tips with arrows, no positioning library.',
    lede: 'A pure-CSS tooltip is a positioned pseudo-element with an arrow made from a rotated square. It cannot flip when it hits the viewport edge, which is exactly the line where you should reach for a real popover library instead — but for a tip on an icon button in the middle of a toolbar, the CSS version is a tenth of the weight.',
    filter: { categories: ['Tooltips & Popovers'] },
    lead: 'effect',
    keywords: ['css tooltip', 'tooltip without javascript', 'tooltip arrow css', 'hover tooltip'],
    faq: [
      {
        q: 'How do I make a tooltip accessible?',
        a: 'Show it on `:focus-visible` as well as `:hover`, give the tip an id and point at it with `aria-describedby`. A tooltip that only exists on hover is invisible to keyboard and screen reader users both.',
      },
      {
        q: 'When do I need a real popover instead?',
        a: 'When it must flip or shift to stay on screen, when it contains interactive content, or when it can be dismissed. At that point use the native `popover` attribute or a positioning library — CSS alone cannot measure the viewport.',
      },
    ],
    related: ['css-modals', 'micro-interactions'],
  },
  {
    slug: 'css-modals',
    title: 'CSS modals and overlays',
    tagline: 'Backdrops, sheets, drawers and dialog transitions.',
    lede: 'The `<dialog>` element solved most of this: focus trapping, the backdrop pseudo-element, Escape to close and inert content behind it, all without JavaScript beyond `showModal()`. What is left is the look, which is what these are — backdrop blurs, entrance transitions and the bottom-sheet variant that a phone expects instead of a centred box.',
    filter: { categories: ['Modals & Overlays'] },
    lead: 'effect',
    keywords: ['css modal', 'dialog styling', 'overlay css', 'bottom sheet css'],
    faq: [
      {
        q: 'How do I animate a `<dialog>` in and out?',
        a: 'Transition `opacity` and `transform` with `display` in `transition-behavior: allow-discrete`, plus `@starting-style` for the entry frame. Without those two the open animation is skipped and only the close plays.',
      },
      {
        q: 'Do I still need a focus trap?',
        a: 'Not with `showModal()` — the browser makes everything outside the dialog inert. You do still need to return focus to the trigger on close, which the platform does not do for you.',
      },
    ],
    related: ['modals-and-drawers', 'glassmorphism-cards'],
  },
  {
    slug: 'toast-notifications',
    title: 'Toast notification styles',
    tagline: 'Alerts, banners and stacked toasts with timed dismissal.',
    lede: 'A toast is a message that appears without being asked for and leaves without being dismissed, which makes it the wrong container for anything the user needs. These cover the four states everyone actually ships — info, success, warning, error — with the entrance and the timed exit as CSS rather than as a timer you have to cancel.',
    filter: { categories: ['Alerts & Toasts'] },
    lead: 'effect',
    keywords: ['toast css', 'notification banner', 'alert component css', 'snackbar css'],
    faq: [
      {
        q: 'How long should a toast stay up?',
        a: 'Around four seconds for a confirmation, longer for anything with a link in it, and never for an error the user has to act on — that belongs inline, next to the thing that failed.',
      },
      {
        q: 'How do screen readers announce these?',
        a: 'Put the toast container in the DOM up front with `role="status"` (or `role="alert"` for errors) and insert the message into it. Adding the live region at the same moment as the text means it is often not announced at all.',
      },
    ],
    related: ['notification-components', 'micro-interactions'],
  },
  {
    slug: 'tabs-and-accordions',
    title: 'CSS tabs and accordions',
    tagline: 'Disclosure patterns built on details, radios and checkboxes.',
    lede: 'Accordions are `<details>`/`<summary>` — keyboard support, the open state and now a smooth height transition via `interpolate-size` all come free. Tabs need radio inputs to hold the selection, and the honest caveat is that a CSS-only tab strip does not implement arrow-key roving focus, so use the native pattern when the tabs are the main navigation of a screen.',
    filter: { categories: ['Accordions & Tabs'] },
    lead: 'effect',
    keywords: ['css tabs', 'accordion css', 'details summary styling', 'faq accordion css'],
    faq: [
      {
        q: 'Can I animate an accordion open now?',
        a: 'Yes — `interpolate-size: allow-keywords` lets you transition to `height: auto`, and `::details-content` gives you something to transition. Where that is not supported the panel still opens, just instantly.',
      },
      {
        q: 'Should an FAQ be an accordion at all?',
        a: 'Only if it is long. Collapsed answers are invisible to a skimmer and, if they are rendered lazily, to a crawler — for six questions, leave them open and let the page be longer.',
      },
    ],
    related: ['faq-sections', 'css-modals'],
  },
  {
    slug: 'avatar-styles',
    title: 'Avatar and image styles',
    tagline: 'Rings, stacks, statuses, frames and hover reveals.',
    lede: 'Avatars are a solved shape with three unsolved details: what shows before the image loads, what shows when it never loads, and how you stack a group without the overlap eating the faces. These cover all three — initials fallback, a ring that survives dark mode, and a stack whose z-order runs the way the eye reads.',
    filter: { categories: ['Avatars & Images'] },
    lead: 'effect',
    keywords: ['avatar css', 'profile picture css', 'avatar group', 'image hover effect'],
    faq: [
      {
        q: 'What should an avatar\'s alt text say?',
        a: 'The person\'s name, if the avatar is the only thing identifying them. If the name is already next to it, the image is decorative and `alt=""` is correct — otherwise every row announces the name twice.',
      },
      {
        q: 'How do I stop a stacked group from looking like a smear?',
        a: 'Give each avatar a ring in the surface colour, not a border — the ring separates it from the one behind without changing its size — and cap the stack at four with a "+n" chip.',
      },
    ],
    related: ['badge-styles', 'form-controls'],
  },
  {
    slug: 'badge-styles',
    title: 'Badge and tag styles',
    tagline: 'Status pills, counters, chips and label variants.',
    lede: 'Badges carry meaning through colour, which is exactly why they need a second signal: an icon or the word itself, so the difference between "failed" and "passed" survives colour blindness and a greyscale print. These pair a hue with a text label in every variant, and the counter versions keep a minimum width so a 1 and a 12 do not resize the row.',
    filter: { categories: ['Badges & Tags'] },
    lead: 'effect',
    keywords: ['badge css', 'status pill', 'tailwind badge', 'chip component css'],
    faq: [
      {
        q: 'What contrast ratio does a badge need?',
        a: 'Its text needs 4.5:1 against the badge fill, and the fill needs 3:1 against the page if the fill is the only thing distinguishing it. Tinted backgrounds at 10% opacity almost always fail the first test — use a darker text tone, not a lighter fill.',
      },
      {
        q: 'Should a count badge be announced?',
        a: 'Give it a visually hidden label — "3 unread" rather than a bare "3". A number alone in the accessibility tree is a number without a noun.',
      },
    ],
    related: ['avatar-styles', 'toast-notifications'],
  },
  {
    slug: 'css-charts',
    title: 'CSS charts and data visuals',
    tagline: 'Bars, sparklines, gauges and heat grids without a chart library.',
    lede: 'A chart library is the right call for anything with axes, tooltips and a legend. For a sparkline in a table cell or a bar in a stat tile it is 40KB to draw six rectangles, and these are the alternative: gradients, grids and custom properties that take the numbers directly. They stop where interactivity starts, which is the honest boundary.',
    filter: { categories: ['Charts & Data'] },
    lead: 'effect',
    keywords: ['css bar chart', 'sparkline css', 'css gauge', 'chart without library'],
    faq: [
      {
        q: 'How do I make a CSS chart accessible?',
        a: 'Put the numbers in the markup — a visually hidden table or a `<figcaption>` with the values — and mark the visual `aria-hidden`. A bar chart made of divs is, to a screen reader, nothing at all.',
      },
      {
        q: 'When should I give up and use a real library?',
        a: 'Axes that need labels, more than one series, hover inspection, or anything the user can zoom. Below that line, CSS is smaller, faster and does not have to hydrate.',
      },
    ],
    related: ['stats-sections', 'dashboard-components', 'css-tables'],
  },
  {
    slug: 'css-tables',
    title: 'CSS table styles',
    tagline: 'Sticky headers, zebra rows, density variants and responsive stacks.',
    lede: 'Two things make a data table usable and neither is decoration: a header that stays put while you scroll, and a column alignment convention — numbers right, text left, and tabular figures so digits line up. Both are here. The responsive variants reflow to a stacked card layout rather than scrolling sideways, which is the difference between a table you can read on a phone and one you can only pan.',
    filter: { categories: ['Tables & Data Grids'] },
    lead: 'effect',
    keywords: ['css table styling', 'sticky table header', 'responsive table css', 'zebra striping'],
    faq: [
      {
        q: 'How do I keep a header row stuck without breaking the borders?',
        a: '`position: sticky` on the `<th>` rather than the `<thead>`, and draw the bottom rule with a `box-shadow` — sticky cells clip their own borders away as they detach, which is the artefact everyone hits first.',
      },
      {
        q: 'What is the accessible way to make a table scroll?',
        a: 'Wrap it in a focusable region: `tabindex="0"` with `role="region"` and an `aria-label`. Otherwise the horizontal scroll exists only for a mouse.',
      },
    ],
    related: ['react-data-tables', 'css-charts'],
  },
  {
    slug: 'css-timelines',
    title: 'CSS timelines and steppers',
    tagline: 'Vertical histories, horizontal steps and progress trails.',
    lede: 'A timeline is a list with a line drawn through it, and it should be an `<ol>` in the markup for exactly that reason. The connector is a pseudo-element on each item rather than a separate div, so the line ends where the list ends instead of hanging past the final entry — which is the bug in most implementations.',
    filter: { categories: ['Timelines & Steps'] },
    lead: 'effect',
    keywords: ['css timeline', 'stepper css', 'vertical timeline', 'progress steps'],
    faq: [
      {
        q: 'How should the current step be announced?',
        a: '`aria-current="step"` on the active item. Colour alone tells a sighted user where they are and tells nobody else.',
      },
      {
        q: 'How do I stop the connector overshooting the last item?',
        a: 'Draw it with `::before` on each item and suppress it on `:last-child`. A single absolutely-positioned line has to know the list height, which it never does.',
      },
    ],
    related: ['progress-bars', 'onboarding-flows'],
  },
  {
    slug: 'css-carousels',
    title: 'CSS sliders and carousels',
    tagline: 'Scroll-snap tracks, marquees and logo tickers.',
    lede: 'Scroll snapping made the carousel a CSS problem: a flex row with `scroll-snap-type: x mandatory` gives you swipe, keyboard scrolling and momentum for free, and it degrades to an ordinary scroller. The infinite marquee variants duplicate their content and translate the track, which is the only way to loop without a gap at the seam.',
    filter: { categories: ['Sliders & Carousels'] },
    lead: 'effect',
    keywords: ['css carousel', 'scroll snap slider', 'infinite marquee css', 'logo ticker'],
    faq: [
      {
        q: 'Do I need JavaScript for the dots and arrows?',
        a: 'For the arrows, one `scrollBy` call. The dots can be pure CSS with anchor links, but reflecting which slide is active needs either a scroll listener or `scroll-driven` animations — the arrow-free versions here avoid the question entirely.',
      },
      {
        q: 'Is an auto-playing marquee an accessibility problem?',
        a: 'Yes, if it never stops: WCAG 2.2 requires a pause control for motion that lasts more than five seconds. These pause on hover and on focus, and stop entirely under `prefers-reduced-motion`.',
      },
    ],
    related: ['logo-clouds', 'scroll-animations'],
  },
  {
    slug: 'form-input-styles',
    title: 'CSS form input styles',
    tagline: 'Floating labels, filled and outlined fields, focus rings.',
    lede: 'An input has five states and a form design that only covers two is the most common reason a form feels cheap. These define rest, hover, focus, filled and error on every variant. The floating-label versions use `:placeholder-shown` rather than JavaScript, so the label position follows the actual value instead of a class somebody forgot to remove.',
    filter: { categories: ['Forms & Validation', 'Inputs & Hover'], exclude: ['hover card'] },
    lead: 'effect',
    keywords: ['input css', 'floating label css', 'form field styling', 'tailwind input'],
    faq: [
      {
        q: 'Is a floating label better than a placeholder?',
        a: 'Much — a placeholder disappears the moment someone types, taking the only description of the field with it. If you use one, it is an example of the format, not the label.',
      },
      {
        q: 'Can I restyle the focus ring safely?',
        a: 'Yes, as long as you replace it rather than remove it, and the replacement has 3:1 contrast against both the field and the page. `outline: none` with nothing after it is the single most common accessibility failure in form CSS.',
      },
    ],
    related: ['form-validation-states', 'form-controls', 'contact-forms'],
  },
  {
    slug: 'form-validation-states',
    title: 'Form validation states',
    tagline: 'Error, success and required styling driven by CSS selectors.',
    lede: 'The platform already knows whether a field is valid — `:user-invalid` fires only after somebody has actually interacted, which is the difference between helpful and hostile. These lean on that rather than on a class the framework toggles, so an empty form does not light up red before the user has typed anything.',
    filter: {
      categories: ['Forms & Validation'],
      match: ['valid', 'error', 'required', 'invalid', 'success', 'validation'],
    },
    lead: 'effect',
    keywords: ['form validation css', 'user-invalid css', 'error state input', 'inline validation'],
    faq: [
      {
        q: 'Why `:user-invalid` and not `:invalid`?',
        a: '`:invalid` matches on first paint, so every required field is red before the form is touched. `:user-invalid` waits until the field has been edited and blurred, which is when a person expects to be told.',
      },
      {
        q: 'Is a red border enough to signal an error?',
        a: 'No. Pair it with text describing the problem, connect that text with `aria-describedby`, and set `aria-invalid` — colour alone fails both colour-blind users and anyone not looking at the field.',
      },
    ],
    related: ['form-input-styles', 'contact-forms'],
  },
  {
    slug: 'dropdown-menus',
    title: 'CSS dropdown menus',
    tagline: 'Navigation bars, mega menus, context menus and flyouts.',
    lede: 'A hover-only dropdown is a menu that does not exist on a touchscreen, so everything here opens on click or focus as well. The mega-menu variants are grids rather than nested lists, which is what lets a wide panel lay out in columns without the markup pretending to be a tree it is not.',
    filter: { categories: ['Navigation & Menus'] },
    lead: 'effect',
    keywords: ['css dropdown menu', 'mega menu css', 'navbar dropdown', 'flyout menu'],
    faq: [
      {
        q: 'What keyboard behaviour does a menu need?',
        a: 'Enter or Space to open, Escape to close and return focus to the trigger, and arrow keys to move between items. Tab alone through a long menu is technically usable and practically awful.',
      },
      {
        q: 'Should the trigger be a link or a button?',
        a: 'A button with `aria-expanded`, unless the top-level item is itself a destination. A link that opens a panel instead of navigating breaks middle-click and Ctrl-click, which is how a lot of people browse.',
      },
    ],
    related: ['navbar-components', 'command-palette'],
  },
  {
    slug: 'icon-hover-effects',
    title: 'Icon hover effects',
    tagline: 'Draw-on strokes, morphs, spins and shape reveals.',
    lede: 'Icons are the one place a 200ms animation is nearly free: they are small, they are usually vector, and the motion reads as a response rather than as a transition. The stroke-drawing variants animate `stroke-dashoffset`, which works on any single-path SVG you already have, and the morph variants cross-fade two paths rather than interpolating them — which is what makes them reliable.',
    filter: { categories: ['Icons & Shapes'] },
    lead: 'effect',
    keywords: ['icon animation css', 'svg stroke animation', 'animated icons', 'icon hover css'],
    faq: [
      {
        q: 'How do I animate an SVG I did not draw?',
        a: 'If it has a single stroked path, `stroke-dasharray`/`stroke-dashoffset` will draw it with no editing. Filled icons cannot be drawn that way — scale, rotate or mask them instead.',
      },
      {
        q: 'Do animated icons need alt text?',
        a: 'Same as static ones: `aria-hidden` when a text label sits next to them, a `<title>` and `role="img"` when the icon is the only label. The animation changes nothing about that.',
      },
    ],
    related: ['micro-interactions', 'css-buttons'],
  },
]

/* ------------------------------------------------------------------ *
 *  The section layer — blocks, and the phrases people search them by
 * ------------------------------------------------------------------ */

const SECTION_HUBS: IntentHub[] = [
  {
    slug: 'pricing-tables',
    title: 'React pricing tables',
    tagline: 'Tiers, toggles, comparison grids and the single-plan case.',
    lede: 'A pricing section has one job — make the choice obvious — and the layout does most of that work: three tiers with the middle one visually recommended converts better than four equal columns, because four columns is a spreadsheet. These ship with the monthly/annual toggle, the feature comparison and the enterprise row already wired, since those are the three pieces everybody adds a week later.',
    filter: { categories: ['Pricing'] },
    lead: 'block',
    keywords: ['pricing table component', 'tailwind pricing section', 'saas pricing page', 'pricing tiers react'],
    faq: [
      {
        q: 'How many tiers should I show?',
        a: 'Three, in almost every case, plus a contact row if you sell upward. Two makes the cheaper one look like a trap and four makes people compare instead of choose.',
      },
      {
        q: 'Do these handle the annual discount maths?',
        a: 'The toggle switches the displayed figure and the per-period label; the numbers themselves are props. Keep the annual price as a real monthly equivalent with the billing terms next to it — "$20/mo billed annually" — rather than a total, which reads as a price rise.',
      },
    ],
    related: ['pricing-page-examples', 'faq-sections', 'cta-sections'],
  },
  {
    slug: 'hero-sections',
    title: 'Hero sections',
    tagline: 'Centred, split, screenshot-led and waitlist variants.',
    lede: 'The hero is one sentence and one action, and everything else on it is negotiable. Centred works when you have no product shot yet; split works when you do; the screenshot variants exist because a picture of the actual interface outsells any amount of adjective. All of them keep the headline as real text so it can be your largest contentful paint rather than an image.',
    filter: { categories: ['Heroes'] },
    lead: 'block',
    keywords: ['hero section react', 'tailwind hero', 'landing page hero', 'hero component'],
    faq: [
      {
        q: 'Should the hero have one call to action or two?',
        a: 'One primary, and at most one secondary that is visually quieter — a ghost button or a text link. Two equal buttons split attention exactly in half, which is the one outcome nobody wants.',
      },
      {
        q: 'How do I keep a hero image from wrecking my LCP?',
        a: 'Give it explicit dimensions, mark it `priority` so Next.js preloads it, and never fade it in from opacity zero. An animated hero image is an LCP measured at the end of the animation.',
      },
    ],
    related: ['cta-sections', 'landing-page-templates', 'animated-backgrounds'],
  },
  {
    slug: 'faq-sections',
    title: 'FAQ sections',
    tagline: 'Accordions, two-column lists and category-grouped questions.',
    lede: 'An FAQ is the highest-leverage section on a marketing page and the one most often written last. It exists to answer the objection the price just created, in the words a customer would use — not "What is your SLA" but "What happens if it goes down". These ship with the accordion, the always-open list and the grouped variant for when the questions outgrow one column.',
    filter: { categories: ['FAQ'] },
    lead: 'block',
    keywords: ['faq component react', 'accordion faq tailwind', 'faq section', 'questions section'],
    faq: [
      {
        q: 'Do collapsed answers still get indexed?',
        a: 'If they are in the HTML, yes — `<details>` content is crawled whether or not it is open. What does not get indexed is an answer fetched on click, which is the argument against building an FAQ as a lazy-loaded component.',
      },
      {
        q: 'Is FAQ structured data worth adding?',
        a: 'It is cheap and it occasionally earns extra space in a result. Mark up only questions that genuinely appear on the page — fabricated FAQ markup is a manual-action category, not a grey area.',
      },
    ],
    related: ['tabs-and-accordions', 'pricing-tables', 'contact-forms'],
  },
  {
    slug: 'testimonial-sections',
    title: 'Testimonial sections',
    tagline: 'Quote walls, single-feature quotes, logo-plus-quote rows.',
    lede: 'A testimonial is only worth the space if it is attributable: a name, a role, a company and ideally a face. Anonymous praise reads as invented, because most of it is. These lay out for real quotes of uneven length — the grid is masonry-ish rather than fixed-height — so you are not padding a good quote to match a long one.',
    filter: { categories: ['Testimonials'] },
    lead: 'block',
    keywords: ['testimonial component', 'review section tailwind', 'quote wall', 'social proof section'],
    faq: [
      {
        q: 'What if I do not have testimonials yet?',
        a: 'Then do not ship the section. A placeholder quote from a made-up person is the fastest way to lose a technical audience, and it is a prohibited practice under EU consumer law rather than a stylistic slip.',
      },
      {
        q: 'Where does this go on the page?',
        a: 'Directly after the claim it is backing, and before the price. Proof works when it answers a doubt that has just formed, not when it is collected in a testimonials ghetto at the bottom.',
      },
    ],
    related: ['logo-clouds', 'hero-sections', 'stats-sections'],
  },
  {
    slug: 'cta-sections',
    title: 'Call-to-action sections',
    tagline: 'Closing bands, inline prompts, newsletter and waitlist captures.',
    lede: 'The closing CTA is the section people scroll to when they have already decided. It should restate the offer in one line and ask for exactly one thing — an email, a signup, a demo — with no navigation competing next to it. The variants here cover the full-bleed band, the boxed card and the inline prompt for the middle of a long page.',
    filter: { categories: ['CTA Sections'] },
    lead: 'block',
    keywords: ['cta section tailwind', 'call to action component', 'newsletter signup section', 'conversion section'],
    faq: [
      {
        q: 'How many CTAs should a landing page have?',
        a: 'One offer repeated, not several competing. The same action in the hero, once mid-page and once at the end outperforms three different asks, because each new ask restarts the decision.',
      },
      {
        q: 'Do these include the form handling?',
        a: 'They are the markup and the states — idle, submitting, success, error — with the submit handler as a prop. Wiring them to a real endpoint is yours, deliberately: everybody\'s capture destination is different.',
      },
    ],
    related: ['hero-sections', 'pricing-tables', 'contact-forms'],
  },
  {
    slug: 'website-footers',
    title: 'Website footers',
    tagline: 'Mega footers, minimal bars, newsletter and sitemap columns.',
    lede: 'The footer is where the rest of your site becomes reachable — it is usually the only place every page links to every section, which is what lets a crawler and a lost visitor find the long tail. The mega variants take four to six columns; the minimal one is for apps, where a fat footer under a dashboard is dead weight.',
    // By word rather than by category: the footer category holds five
    // blocks, and the pages and templates that ship a footer are part of
    // the answer to "website footer" too.
    filter: { match: ['footer'] },
    lead: 'block',
    keywords: ['footer component react', 'tailwind footer', 'mega footer', 'site footer'],
    faq: [
      {
        q: 'What has to be in a footer legally?',
        a: 'It varies, but the practical set is a link to your terms, your privacy policy, a way to contact you, and — if you sell in the EU — your company identity. A cookie or consent link belongs there too if you set anything beyond strictly necessary.',
      },
      {
        q: 'How many links is too many?',
        a: 'Past about forty, the footer stops being navigation and becomes a sitemap, which is fine if it is grouped under real headings. Ungrouped, it dilutes the internal links that matter.',
      },
    ],
    related: ['navbar-components', 'landing-page-templates'],
  },
  {
    slug: 'navbar-components',
    title: 'Navbars and menus',
    tagline: 'Top bars, mega menus, mobile drawers and app sidebars.',
    lede: 'A navbar has to survive three widths, a logged-in state and a scroll. These cover the marketing bar with a mega menu, the app bar with a workspace switcher, and the mobile drawer — which is a separate component rather than the same one squashed, because a hamburger that opens a desktop menu at phone width is how sites end up with unreachable links.',
    filter: {
      levels: ['block', 'page', 'primitive'],
      match: ['navbar', 'navigation', 'nav ', 'menu', 'sidebar', 'header'],
    },
    lead: 'block',
    keywords: ['navbar react', 'tailwind navigation bar', 'mobile menu drawer', 'header component'],
    faq: [
      {
        q: 'Where should the mobile breakpoint be?',
        a: 'Wherever the links stop fitting, not at a fixed device width. Measure with your real link text — a nav that fits in English at 768px often does not in German.',
      },
      {
        q: 'Does the drawer need a focus trap?',
        a: 'Yes, plus Escape to close and focus returned to the hamburger. A drawer that leaves focus behind it on the page is the most common keyboard bug in a mobile nav.',
      },
    ],
    related: ['dropdown-menus', 'scroll-animations', 'website-footers'],
  },
  {
    slug: 'login-forms',
    title: 'Login and signup forms',
    tagline: 'Email, OAuth, magic link, OTP and two-factor screens.',
    lede: 'Auth is the screen with the highest abandonment and the least room for cleverness. What matters is boring: the password field has a reveal toggle, the email field has `autocomplete="email"` so the browser fills it, errors say which field failed, and the OAuth buttons are above the form rather than below it. All of that is wired here.',
    filter: { categories: ['Authentication', 'Auth Screens'] },
    lead: 'block',
    keywords: ['login form react', 'signup form tailwind', 'auth screen component', 'magic link form'],
    faq: [
      {
        q: 'What autocomplete attributes do these set?',
        a: '`username`/`email` on the identifier, `current-password` on login and `new-password` on signup, and `one-time-code` on OTP fields. Password managers and iOS autofill key off exactly those values.',
      },
      {
        q: 'Should the error say which field was wrong?',
        a: 'For validation, yes — per field. For the credentials themselves, no: "email or password is incorrect" keeps you from confirming which accounts exist, which is an enumeration vector.',
      },
    ],
    related: ['form-input-styles', 'onboarding-flows', 'settings-screens'],
  },
  {
    slug: 'contact-forms',
    title: 'Contact forms',
    tagline: 'Support requests, sales enquiries, split map-and-form layouts.',
    lede: 'A contact form is a promise about a reply, so the useful ones say when to expect it and offer an alternative for people who would rather not fill anything in. These carry the full state machine — idle, submitting, success, and an error that keeps what the user typed — which is the part most hand-built forms are missing when the network drops.',
    filter: { categories: ['Contact & Forms'] },
    lead: 'block',
    keywords: ['contact form react', 'tailwind contact section', 'enquiry form', 'support form component'],
    faq: [
      {
        q: 'How do I keep spam out without a CAPTCHA?',
        a: 'A honeypot field hidden from humans, a timestamp check that rejects sub-second submissions, and rate limiting per IP will clear most of it. Add a challenge only when that stops being enough — every CAPTCHA costs real submissions.',
      },
      {
        q: 'What is the minimum accessible form?',
        a: 'A visible `<label>` per field, errors linked with `aria-describedby`, and a success message in a live region. Placeholder-as-label fails all three at once.',
      },
    ],
    related: ['form-validation-states', 'cta-sections', 'form-input-styles'],
  },
  {
    slug: 'dashboard-components',
    title: 'Dashboard components',
    tagline: 'Stat rows, chart cards, activity feeds and admin shells.',
    lede: 'A dashboard answers "is anything wrong" in under three seconds and "why" in the next thirty. That means the top row is comparisons rather than raw numbers — a figure with no baseline is trivia — and the charts sit below it. These are the shells and the tiles; they take your data and your chart library rather than bundling one.',
    filter: { categories: ['Dashboards', 'Charts & Metrics'] },
    lead: 'block',
    keywords: ['react dashboard components', 'admin dashboard tailwind', 'analytics dashboard ui', 'kpi cards'],
    faq: [
      {
        q: 'Which chart library do these assume?',
        a: 'None. The chart cards take a `children` slot, so Recharts, Chart.js or a plain SVG all drop in — the card owns the frame, the title, the empty state and the loading state, which is the part you would rewrite per chart otherwise.',
      },
      {
        q: 'What should a metric tile show when there is no data yet?',
        a: 'A dash and a sentence, not a zero. A hard zero on a new account reads as a broken integration, which generates support tickets that a two-word empty state prevents.',
      },
    ],
    related: ['stats-sections', 'react-data-tables', 'admin-dashboard-templates'],
  },
  {
    slug: 'react-data-tables',
    title: 'React data tables',
    tagline: 'Sortable grids, bulk selection, filters, pagination and row actions.',
    lede: 'The table itself is easy; the shell around it is the work — selection that survives pagination, a filter bar that says how many rows it removed, and an empty state that distinguishes "no data" from "no matches". These carry that shell. Sorting and filtering are callbacks, so a server-paginated table uses the same markup as a client-side one.',
    filter: { categories: ['Data Tables'] },
    lead: 'block',
    keywords: ['react data table component', 'sortable table tailwind', 'data grid react', 'table with filters'],
    faq: [
      {
        q: 'How should sorting be announced?',
        a: '`aria-sort` on the active header cell, and the button inside the header rather than a click handler on the `<th>`. Without it, the order changes silently for anyone not watching the arrows.',
      },
      {
        q: 'Pagination or infinite scroll?',
        a: 'Pagination for anything people cite, bookmark or audit — an infinite list has no addressable position. Infinite scroll suits feeds, where nobody needs to find row 4,120 again.',
      },
    ],
    related: ['css-tables', 'admin-crud-panels', 'dashboard-components'],
  },
  {
    slug: 'file-upload-components',
    title: 'File upload components',
    tagline: 'Dropzones, progress lists, image pickers and paste-to-upload.',
    lede: 'Upload is one of the few interactions where the happy path is the easy half. What these get right is the rest: per-file progress, a cancel that actually aborts the request, a rejection message that names the reason, and a drop target big enough to hit. Drag-and-drop is an enhancement over a real `<input type="file">`, never a replacement.',
    // Section-level only. The picker controls themselves are
    // /ui/file-and-media-pickers, one rung down.
    filter: { levels: ['block'], categories: ['File Upload'] },
    lead: 'block',
    keywords: ['file upload react', 'drag and drop upload tailwind', 'dropzone component', 'image upload ui'],
    faq: [
      {
        q: 'Is a drag-and-drop zone keyboard accessible?',
        a: 'Only if there is still a real file input underneath — which there is in all of these. The dropzone is a label for it, so Enter opens the picker and the browser handles the rest.',
      },
      {
        q: 'Where should validation happen?',
        a: 'Both ends. Client-side checks on type and size give instant feedback; the server has to repeat them, because the client check is a convenience and not a control.',
      },
    ],
    related: ['form-input-styles', 'file-and-media-pickers'],
  },
  {
    slug: 'stats-sections',
    title: 'Stats and metrics sections',
    tagline: 'Number rows, KPI tiles, trend deltas and counters.',
    lede: 'A number without a comparison is decoration. These lay out the figure, the label and the delta as one unit, so "12,480" arrives as "12,480 requests, up 8% on last week" — which is the only form a reader can act on. The marketing variants are the same shape with bigger type and fewer of them.',
    filter: { categories: ['Stats', 'Charts & Metrics'] },
    lead: 'block',
    keywords: ['stats section tailwind', 'kpi component react', 'metrics row', 'counter section'],
    faq: [
      {
        q: 'Should the numbers count up on scroll?',
        a: 'On a marketing page, occasionally — it draws the eye once. In a dashboard, never: a figure that animates is a figure you cannot read at a glance, and it re-animates on every re-render.',
      },
      {
        q: 'How do I show a metric that got worse?',
        a: 'Same tile, different colour and an arrow that points down — and do not invert the colour for metrics where down is good (churn, latency) without saying so. The delta needs a text label either way, because colour is not a direction.',
      },
    ],
    related: ['dashboard-components', 'css-charts', 'testimonial-sections'],
  },
  {
    slug: 'feature-sections',
    title: 'Feature sections',
    tagline: 'Bento grids, alternating rows, icon lists and tabbed showcases.',
    lede: 'Feature sections fail in one of two ways: a uniform grid where nothing is more important than anything else, or a wall of icons and adjectives. The bento layouts here solve the first by letting one cell be visibly the main one, and the alternating rows solve the second by giving each feature a screenshot and a sentence instead of a noun.',
    filter: { categories: ['Feature Sections'] },
    lead: 'block',
    keywords: ['feature section tailwind', 'bento grid react', 'features component', 'product features section'],
    faq: [
      {
        q: 'How many features should a landing page show?',
        a: 'Three to six, ranked. Beyond that you are writing documentation on a sales page — link to it instead, which converts better than scrolling past twelve equal boxes.',
      },
      {
        q: 'Do bento grids reflow sensibly on mobile?',
        a: 'These do — the grid collapses to a single column in a defined order rather than letting the browser choose. A bento that reads correctly only at desktop width is a desktop-only section.',
      },
    ],
    related: ['hero-sections', 'stats-sections', 'landing-page-templates'],
  },
  {
    slug: 'logo-clouds',
    title: 'Logo clouds',
    tagline: 'Customer logo rows, marquees and greyscale-on-hover grids.',
    lede: 'A logo wall is social proof at a glance, and the layout problem is that logos come in wildly different aspect ratios — a wordmark next to a square icon looks broken unless each one is normalised to the same optical weight. These fix the row height and let the width vary, which is the convention that makes mixed logos sit still.',
    // The blocks, plus the marquee and ticker effects — which is what a
    // logo row usually turns into once there are more than eight of them.
    filter: { match: ['logo', 'marquee', 'ticker', 'brand strip'] },
    lead: 'block',
    keywords: ['logo cloud tailwind', 'customer logos section', 'trusted by section', 'logo marquee'],
    faq: [
      {
        q: 'Do I need permission to show a customer\'s logo?',
        a: 'Usually yes — most enterprise contracts have a marketing clause, and using a mark without it is a trademark problem rather than an etiquette one. Ask, and keep the answer.',
      },
      {
        q: 'Should logos be greyscale?',
        a: 'It makes a mixed row look deliberate and keeps the eye on the headline. Just avoid the hover-to-colour trick as the only way to see them properly — touch devices never get that state.',
      },
    ],
    related: ['testimonial-sections', 'css-carousels', 'hero-sections'],
  },
  {
    slug: 'empty-states',
    title: 'Empty and error states',
    tagline: 'First-run screens, no-results, 404s, permission walls and failures.',
    lede: 'Empty states are the first screen a new user sees and the last one anybody designs. The useful ones distinguish the four cases that look identical in a wireframe: nothing created yet, nothing matched your filter, you are not allowed, and something broke. Each needs different words and a different button, which is how these are split.',
    // Blocks only. The page-level System Pages are /ui/error-pages, and
    // letting both hubs take both levels made them the same document.
    filter: { levels: ['block'], categories: ['Empty & Error States'] },
    lead: 'block',
    keywords: ['empty state component', 'no results ui', '404 page react', 'error state tailwind'],
    faq: [
      {
        q: 'What belongs in a first-run empty state?',
        a: 'One sentence on what this screen will hold, and the button that creates the first one. Not an illustration and a shrug — the empty state is the onboarding step you get for free.',
      },
      {
        q: 'How should an error state differ from an empty one?',
        a: 'It says what failed, whether it is worth retrying, and gives a retry control. "Something went wrong" with no action is the error equivalent of a blank page.',
      },
    ],
    related: ['error-pages', 'skeleton-loaders', 'onboarding-flows'],
  },
  {
    slug: 'onboarding-flows',
    title: 'Onboarding flows',
    tagline: 'Multi-step wizards, checklists, tours and welcome screens.',
    lede: 'Onboarding is a sequence of small commitments, and the two things that keep people in it are visible progress and a way out that does not lose their work. These cover the stepper wizard, the persistent setup checklist — which outperforms a tour because it survives a refresh — and the welcome screen that asks one question instead of six.',
    filter: { categories: ['Onboarding'] },
    lead: 'block',
    keywords: ['onboarding flow react', 'multi step form tailwind', 'setup checklist ui', 'wizard component'],
    faq: [
      {
        q: 'How many steps is too many?',
        a: 'More than about four without a visible finish line. If you need more, group them and show the group progress — people abandon on an unknown remaining count, not on effort.',
      },
      {
        q: 'Should onboarding be skippable?',
        a: 'Always, and the skip should be honest rather than a guilt-tripped "no thanks, I like being confused". Put the checklist somewhere permanent so skipping is deferring, not losing.',
      },
    ],
    related: ['login-forms', 'empty-states', 'css-timelines'],
  },
  {
    slug: 'settings-screens',
    title: 'Settings screens',
    tagline: 'Profile, preferences, team, security and danger zones.',
    lede: 'Settings is a screen shape, not a feature: a nav of sections, a form per section, and a save model that is either per-field autosave or an explicit bar — never both on the same page. These pick one and stay consistent, and the destructive section is separated and type-to-confirm, which is the one place friction is the feature.',
    filter: { categories: ['Settings', 'Account & Billing'] },
    lead: 'block',
    keywords: ['settings page react', 'account settings ui', 'preferences screen tailwind', 'profile settings'],
    faq: [
      {
        q: 'Autosave or a save button?',
        a: 'Autosave for toggles, an explicit save for anything typed. A text field that saves as you type will save half a word to somebody\'s profile, and a toggle with a save button feels broken.',
      },
      {
        q: 'How much confirmation does a destructive action need?',
        a: 'Type the resource name for anything unrecoverable, a plain confirm for anything reversible. And say what happens to the data — "deleted immediately" and "kept for 30 days" are different promises.',
      },
    ],
    related: ['login-forms', 'billing-screens', 'form-input-styles'],
  },
  {
    slug: 'notification-components',
    title: 'Notification centres',
    tagline: 'Inboxes, unread badges, grouped feeds and preference panels.',
    lede: 'A notification list is a read/unread state machine with a feed on top, and the details that make it usable are grouping (five likes, not five rows), a mark-all that does not require aim, and a preferences panel in reach of the bell. These carry all three, plus the empty state — which, for a notification centre, is the state most users see most days.',
    filter: { categories: ['Notifications'] },
    lead: 'block',
    keywords: ['notification center react', 'notification bell ui', 'activity feed component', 'inbox notifications'],
    faq: [
      {
        q: 'When does something count as read?',
        a: 'On open of the panel is too aggressive and on click is too conservative. Marking a group read when it has been visible for a beat is the compromise most products land on — and an explicit mark-all covers the rest.',
      },
      {
        q: 'Should the badge show a count or a dot?',
        a: 'A dot for "something happened", a count when the number is actionable. A badge reading 247 has stopped being information and become wallpaper.',
      },
    ],
    related: ['toast-notifications', 'inbox-and-messaging', 'badge-styles'],
  },
  {
    slug: 'command-palette',
    title: 'Command palette and search',
    tagline: 'Cmd-K dialogs, search results, filter rails and facets.',
    lede: 'A command palette is the power-user surface that pays for itself on the second use: one shortcut, a fuzzy list, and navigation without the mouse. What separates a good one is result grouping, recent items when the query is empty, and arrow-key handling that does not fight the browser. The search surfaces here cover the results page and the facet rail as well.',
    filter: { categories: ['Command & Search'] },
    lead: 'block',
    keywords: ['command palette react', 'cmdk component', 'search ui tailwind', 'search filters component'],
    faq: [
      {
        q: 'What keyboard contract should a palette honour?',
        a: 'Cmd/Ctrl-K to open, Escape to close, arrows to move, Enter to run, and focus returned where it started. Also do not swallow Cmd-K when a text field has focus and the user meant something else.',
      },
      {
        q: 'How should results be announced?',
        a: 'The input owns `aria-activedescendant` pointing at the highlighted option, with the list as a `listbox`. Moving real focus into the list breaks typing, which is the mistake most hand-rolled palettes make.',
      },
    ],
    related: ['dropdown-menus', 'react-data-tables'],
  },
  {
    slug: 'checkout-flows',
    title: 'Cart and checkout',
    tagline: 'Carts, address forms, payment steps and order summaries.',
    lede: 'Checkout is where an ecommerce build either converts or leaks, and most of the leak is avoidable: a total that changes at the last step, a forced account, or a card field that rejects spaces in the number. These lay out the cart, the address and payment steps and the persistent order summary — with shipping and tax shown as early as you can honestly show them.',
    filter: { categories: ['Cart & Checkout'] },
    lead: 'block',
    keywords: ['checkout ui react', 'shopping cart component', 'ecommerce checkout tailwind', 'order summary'],
    faq: [
      {
        q: 'One page or multiple steps?',
        a: 'Steps for a long form with an address and shipping options; one page when there are four fields. Either way show the whole cost before the last click, because an unexpected total is the single biggest cause of abandonment.',
      },
      {
        q: 'Do these handle a payment provider?',
        a: 'No — they leave a slot for the provider\'s own element. Card fields belong to Stripe, Adyen or whoever you use, both because their iframe handles PCI scope and because their validation is better than anything you would write.',
      },
    ],
    related: ['product-listings', 'billing-screens', 'ecommerce-templates'],
  },
  {
    slug: 'product-listings',
    title: 'Product listing and detail pages',
    tagline: 'Grids, filter rails, galleries, variant pickers and buy boxes.',
    lede: 'A listing page is a filtering problem and a detail page is a persuasion problem, so they are different components with different failure modes. These cover the grid with its facet rail — including the count of what the filter removed — and the detail layout with a gallery, variant selection and a buy box that stays reachable while you scroll the description.',
    filter: { categories: ['Product Listings', 'Product Detail'] },
    lead: 'block',
    keywords: ['product grid react', 'ecommerce product page', 'product card tailwind', 'variant selector ui'],
    faq: [
      {
        q: 'Where should filters live on mobile?',
        a: 'In a bottom sheet with an apply button, not a collapsed accordion above the results. Applying filters one at a time on a phone means a full result reload per tap.',
      },
      {
        q: 'What does a variant picker need to get right?',
        a: 'Unavailable combinations have to be visibly unavailable rather than silently failing on add-to-cart, and the price and image must update with the selection. Both are wired through props here.',
      },
    ],
    related: ['checkout-flows', 'ecommerce-templates', 'orders-and-reviews'],
  },
  {
    slug: 'billing-screens',
    title: 'Billing and usage screens',
    tagline: 'Plan cards, invoices, payment methods, usage meters and limits.',
    lede: 'Billing UI is where trust is won or lost quietly. The things that matter are unglamorous: the current plan is obvious, the next charge has a date and an amount, invoices are downloadable, and usage against a limit is a bar rather than a sentence. Approaching-limit and over-limit both get their own state here, because they need different words.',
    filter: { categories: ['Billing & Usage'] },
    lead: 'block',
    keywords: ['billing page react', 'subscription ui tailwind', 'usage meter component', 'invoice list ui'],
    faq: [
      {
        q: 'How should a plan downgrade be presented?',
        a: 'Say what is lost and when it takes effect — at period end, not immediately, in most billing models. A downgrade that silently deletes data on click is the worst button in SaaS.',
      },
      {
        q: 'What should a usage meter do at 100%?',
        a: 'Change state before it gets there. Warn at around 80% with the upgrade path in reach; at the limit, say plainly what is now blocked, since a full bar with no sentence is a mystery outage.',
      },
    ],
    related: ['pricing-tables', 'settings-screens', 'checkout-flows'],
  },
  {
    slug: 'ai-chat-ui',
    title: 'AI chat interfaces',
    tagline: 'Message threads, streaming states, composers and citations.',
    lede: 'Chat UI for a model is not messaging UI with a robot avatar. The differences are structural: responses stream token by token, they can be stopped, they carry sources worth linking, and a regenerate is a first-class action. These handle the streaming cursor, the stop button, the error-mid-stream case and the thread that has to stay scroll-anchored while text arrives.',
    filter: { categories: ['Agent Chat', 'Agent Reasoning'] },
    lead: 'block',
    keywords: ['ai chat ui react', 'chatbot interface tailwind', 'streaming chat component', 'llm chat ui'],
    faq: [
      {
        q: 'How do I keep the view pinned while tokens stream in?',
        a: 'Anchor to the bottom only while the user is already at the bottom, and stop the moment they scroll up. Forcing scroll during a stream is the fastest way to make a long answer unreadable.',
      },
      {
        q: 'Should the model\'s output be rendered as Markdown?',
        a: 'Yes, and sanitised — model output is untrusted input. Render incrementally so a half-finished code fence does not flash as raw text, which the streaming variants here handle.',
      },
    ],
    related: ['ai-agent-components', 'inbox-and-messaging'],
  },
  {
    slug: 'ai-agent-components',
    title: 'AI agent components',
    tagline: 'Tool-call traces, approval gates, context panels and inline actions.',
    lede: 'An agent interface has a problem a chatbox does not: the model is about to do something, and a person needs to see what, and sometimes say no. These are the surfaces that make that legible — the tool-call trace, the diff-and-approve gate, the retrieved-context panel that shows what was actually read, and the inline "rewrite this" actions that live inside an editor rather than in a sidebar.',
    filter: { categories: ['Human in the Loop', 'Inline AI Actions', 'Retrieval & Context'] },
    lead: 'block',
    keywords: ['ai agent ui', 'tool call ui react', 'human in the loop ui', 'rag citation component'],
    faq: [
      {
        q: 'What does a human-in-the-loop gate need to show?',
        a: 'The exact action, its arguments, and what changes if it runs — a diff where there is one. "Allow the agent to continue?" with no payload is a consent dialog with the consent removed.',
      },
      {
        q: 'How should retrieved sources be displayed?',
        a: 'Next to the claim they support, linked, with enough of the snippet to judge relevance. Citations collected at the bottom get read by nobody and verified by no one.',
      },
    ],
    related: ['ai-chat-ui', 'command-palette'],
  },
  {
    slug: 'modals-and-drawers',
    title: 'Modals and drawers',
    tagline: 'Dialogs, side panels, bottom sheets and confirmations.',
    lede: 'The choice between a modal and a drawer is about context: a modal takes the screen and demands an answer, a drawer keeps the page visible so you can compare against it. Detail views want drawers; destructive confirmations want modals. These cover both, plus the phone case, where a bottom sheet is what the platform has trained people to expect.',
    filter: { categories: ['Modals & Drawers'] },
    lead: 'block',
    keywords: ['modal component react', 'drawer ui tailwind', 'side panel component', 'confirmation dialog'],
    faq: [
      {
        q: 'Should a drawer be dismissible by clicking outside?',
        a: 'Yes for a read-only panel, no when it contains an unsaved form — or prompt on dismiss. Losing a half-written form to a stray click is the complaint that follows every "just close it" implementation.',
      },
      {
        q: 'Can I nest a modal inside a modal?',
        a: 'You can, and it is nearly always a sign the first one is doing too much. If you must, the second has to stack above the first and return focus to it on close rather than to the page.',
      },
    ],
    related: ['css-modals', 'notification-components', 'settings-screens'],
  },
  {
    slug: 'calendar-scheduling',
    title: 'Calendar and scheduling UI',
    tagline: 'Month grids, availability pickers, booking flows and time slots.',
    lede: 'Scheduling is a timezone problem wearing a calendar costume. The interface work is to make the zone explicit at the moment of choice — "3:00 PM your time (10:00 PM in Berlin)" — and to keep slot buttons big enough to hit on a phone. These cover the month view, the availability picker and the confirmation step.',
    // The flow, not the field — see the note on /ui/date-pickers.
    filter: {
      levels: ['block', 'page'],
      match: ['calendar', 'schedul', 'booking', 'appointment', 'availability', 'time slot'],
    },
    lead: 'block',
    keywords: ['calendar component react', 'booking ui tailwind', 'time slot picker', 'scheduling interface'],
    faq: [
      {
        q: 'How do I avoid timezone mistakes?',
        a: 'Store UTC, render in the viewer\'s zone via the Intl API, and always print the zone next to the time. Never do arithmetic on a date string — a slot that shifts by an hour twice a year is a DST bug someone will notice before you do.',
      },
      {
        q: 'How accessible is a calendar grid?',
        a: 'It needs to be a real grid with arrow-key navigation and the selected date announced with its full name. A table of buttons where only Tab works is technically operable and practically unusable for a month view.',
      },
    ],
    related: ['date-pickers', 'form-controls'],
  },
  {
    slug: 'admin-crud-panels',
    title: 'CRUD admin panels',
    tagline: 'List-edit-delete screens, inline editing, bulk actions and audit rows.',
    lede: 'Nearly every internal tool is the same four screens — list, detail, create, edit — plus a delete confirmation, and building them from scratch each time is how a week disappears. These are that set, with the parts that usually get skipped: optimistic updates that roll back visibly, bulk selection that survives a filter change, and an audit column so "who changed this" has an answer.',
    filter: { categories: ['CRUD'] },
    lead: 'block',
    keywords: ['crud ui react', 'admin panel components', 'internal tool ui', 'resource management ui'],
    faq: [
      {
        q: 'Inline editing or a detail form?',
        a: 'Inline for one or two fields people change often; a form for anything with validation across fields. Inline editing that silently fails on save is the failure mode to design against — show the row in an error state rather than reverting it quietly.',
      },
      {
        q: 'What should bulk delete confirm?',
        a: 'The count and the type — "Delete 14 customers?" — and it should list them if there are few enough. A bulk action whose scope is invisible is one selection bug away from a bad day.',
      },
    ],
    related: ['react-data-tables', 'dashboard-components', 'admin-dashboard-templates'],
  },
  {
    slug: 'blog-components',
    title: 'Blog and content sections',
    tagline: 'Article layouts, post grids, author bylines and reading progress.',
    lede: 'A content page is a typography problem first: a measure of 60–75 characters, real vertical rhythm, and headings that can be scanned without reading. These handle the article shell, the post grid with its cards, and the peripheral pieces — byline, table of contents, reading progress, related posts — that keep a reader moving to a second page.',
    filter: { categories: ['Content & Blog'] },
    lead: 'block',
    keywords: ['blog layout react', 'article component tailwind', 'post grid ui', 'blog template components'],
    faq: [
      {
        q: 'How wide should the body text be?',
        a: 'About 65 characters per line — `max-width: 65ch` gets you there in any font. Full-width body copy on a desktop monitor is the most common reason a long post does not get read.',
      },
      {
        q: 'Is a table of contents worth it?',
        a: 'Over roughly a thousand words, yes, and it should highlight the current section as you scroll. Under that it is navigation for a page you can already see the end of.',
      },
    ],
    related: ['content-pages', 'css-text-animations'],
  },
  {
    slug: 'inbox-and-messaging',
    title: 'Inbox and messaging UI',
    tagline: 'Thread lists, conversation views, composers and presence.',
    lede: 'A messaging interface is two panes with one hard problem between them: keeping the list, the thread and the unread counts consistent while messages arrive. These lay out the list-and-thread split, the composer with its attachment and draft states, and the read receipts and typing indicators that make a conversation feel live.',
    filter: { categories: ['Communication'] },
    lead: 'block',
    keywords: ['chat ui react', 'inbox component tailwind', 'messaging interface', 'conversation view ui'],
    faq: [
      {
        q: 'How should a new message behave if I am scrolled up?',
        a: 'Do not jump. Show a "new messages" pill that scrolls down on click — auto-scrolling away from what someone is reading is the fastest way to lose their place in a long thread.',
      },
      {
        q: 'Where do drafts belong?',
        a: 'Per conversation, persisted locally, restored on return. A composer that clears when you switch threads loses work in a way people do not forgive.',
      },
    ],
    related: ['ai-chat-ui', 'notification-components'],
  },
  {
    slug: 'orders-and-reviews',
    title: 'Orders, reviews and support',
    tagline: 'Order history, tracking, returns, ratings and help centres.',
    lede: 'Everything after the purchase is the part that decides whether there is a second one, and it is the part most component libraries skip entirely. These cover order history and its tracking timeline, the return and refund flow, review submission and display with rating distributions, and the help-centre shell — the screens a support team lives in.',
    filter: { categories: ['Orders & Reviews', 'After-Sale Service'] },
    lead: 'block',
    keywords: ['order history ui', 'review component react', 'returns flow ui', 'help center tailwind'],
    faq: [
      {
        q: 'How should a rating summary be displayed?',
        a: 'The average, the count, and the distribution across stars. An average with no count is unreadable — 5.0 from one review and 4.6 from nine hundred are different facts.',
      },
      {
        q: 'What does an order tracking timeline need?',
        a: 'The current state, the states already passed, and a date on each. An estimated next step helps; a progress bar with no dates is decoration on top of a question people came to answer.',
      },
    ],
    related: ['checkout-flows', 'product-listings', 'css-timelines'],
  },
]

/* ------------------------------------------------------------------ *
 *  The screen layer — pages and templates, and the "template" queries
 * ------------------------------------------------------------------ */

const SCREEN_HUBS: IntentHub[] = [
  {
    slug: 'landing-page-templates',
    title: 'Landing page templates',
    tagline: 'Whole marketing pages, assembled and ready to clone.',
    lede: 'A landing page is a running order before it is a design: hook, proof, what it does, proof from people, price, objections, footer. These are complete pages in that order rather than a folder of sections, so what you clone already works end to end — and every section in them is a block you can swap for a sibling.',
    filter: {
      levels: ['template', 'page'],
      categories: ['Landing Pages', 'Marketing', 'Marketing Pages'],
    },
    lead: 'template',
    keywords: ['landing page template react', 'nextjs landing page', 'tailwind landing template', 'saas landing page'],
    faq: [
      {
        q: 'What is the difference between a page and a template here?',
        a: 'A page is one composed screen you can drop into an existing app. A template is a runnable project — routes, layout, config — that you clone and edit. If you already have a site, take the page.',
      },
      {
        q: 'Are these responsive out of the box?',
        a: 'Yes, and they are checked rather than claimed: every block in them goes through the repo\'s own overflow and RTL gates, which fail the build on a section that scrolls sideways at phone width.',
      },
    ],
    related: ['hero-sections', 'saas-website-templates', 'feature-sections'],
  },
  {
    slug: 'saas-website-templates',
    title: 'SaaS website templates',
    tagline: 'Marketing site, pricing, docs shell and auth, as one project.',
    lede: 'A SaaS site is more than a landing page: it is the landing page plus pricing, plus the legal pages a payment processor asks for, plus login and a first-run screen. These bundle that set so the parts nobody enjoys building are already there and consistent with the parts they do.',
    filter: {
      levels: ['template'],
      categories: ['Marketing', 'Full Product', 'Account & Access', 'Internal Tools'],
    },
    lead: 'template',
    keywords: ['saas template nextjs', 'saas starter kit', 'saas website template tailwind'],
    faq: [
      {
        q: 'Do these include authentication or a database?',
        a: 'They include the screens, not the backend. Auth forms, billing pages and settings are wired to props and callbacks so you can drop in your own provider — a template that picked one for you would be wrong for most people.',
      },
      {
        q: 'How much of this is Next.js specific?',
        a: 'The routing and the layout files. The components are React with Tailwind, and the CLI can convert the markup to Vue, Svelte, Astro or plain HTML if the rest of your stack is not Next.',
      },
    ],
    related: ['landing-page-templates', 'pricing-page-examples', 'login-forms'],
  },
  {
    slug: 'admin-dashboard-templates',
    title: 'Admin dashboard templates',
    tagline: 'App shells with navigation, tables, settings and detail screens.',
    lede: 'An admin template is worth more than a dashboard screenshot because the value is the shell: the sidebar, the responsive collapse, the breadcrumb, the place a table goes and the place a detail drawer comes from. These give you that frame with real screens in it rather than a single pretty overview page.',
    filter: {
      levels: ['template', 'page'],
      categories: ['Internal Tools', 'App Screens', 'Full Product'],
    },
    lead: 'template',
    keywords: ['admin dashboard template react', 'nextjs admin panel', 'tailwind dashboard template', 'internal tool template'],
    faq: [
      {
        q: 'Is there a chart library baked in?',
        a: 'No. Chart slots take children, so you bring Recharts, Chart.js or an SVG — which keeps the template from carrying a dependency you would immediately replace.',
      },
      {
        q: 'Does the sidebar work on a phone?',
        a: 'It collapses to a drawer with a focus trap and Escape-to-close. An admin shell that assumes a desktop is the most common thing wrong with dashboard templates.',
      },
    ],
    related: ['dashboard-components', 'admin-crud-panels', 'react-data-tables'],
  },
  {
    slug: 'ecommerce-templates',
    title: 'Ecommerce templates',
    tagline: 'Storefronts, product pages, cart and checkout as whole screens.',
    lede: 'Storefront UI is a sequence, and the leaks are at the joins: a product page that forgets the variant on the way to the cart, a cart that reveals shipping at the last step. These are composed screens for the whole sequence — listing, detail, cart, checkout, confirmation — so the joins already line up.',
    filter: {
      levels: ['template', 'page'],
      categories: ['Commerce', 'Commerce Pages'],
    },
    // Pages lead, not templates: the catalog has one commerce template and
    // nine commerce screens, and a grid of one is not a landing page.
    lead: 'page',
    keywords: ['ecommerce template react', 'shopify style storefront tailwind', 'online store template', 'product page template'],
    faq: [
      {
        q: 'Will these work with Shopify or Stripe?',
        a: 'They are presentation only, with data as props, so either works — you supply products and a checkout session. The payment step leaves a slot for the provider\'s own element rather than styling a card field.',
      },
      {
        q: 'Is the cart state included?',
        a: 'No, deliberately. Cart logic belongs to your commerce backend; what these carry is every screen it needs to render, including the empty cart and the failed-payment state.',
      },
    ],
    related: ['checkout-flows', 'product-listings', 'orders-and-reviews'],
  },
  {
    slug: 'error-pages',
    title: '404 and error pages',
    tagline: 'Not found, server error, maintenance, offline and permission walls.',
    lede: 'System pages are the ones users reach when something already went wrong, which makes a clever joke the wrong instinct: what they need is to know where they are and how to leave. These say what happened, offer search and the two or three most useful destinations, and keep the site chrome so the page still feels like your site.',
    // Whole pages only — the block-level empty states are /ui/empty-states.
    filter: { levels: ['page'], categories: ['System Pages'] },
    lead: 'page',
    keywords: ['404 page template', 'error page design react', 'maintenance page', '500 page tailwind'],
    faq: [
      {
        q: 'What status code should a custom 404 return?',
        a: '404, not 200. A "soft 404" — a not-found page served with a success status — teaches search engines that the URL is real and keeps it in the index indefinitely.',
      },
      {
        q: 'What belongs on a 404?',
        a: 'A short explanation, a search box, and links to the main sections. Not a sitemap dump, and not only a "go home" button — the person was looking for something specific.',
      },
    ],
    related: ['empty-states', 'content-pages'],
  },
  {
    slug: 'pricing-page-examples',
    title: 'Pricing page examples',
    tagline: 'Whole pricing screens — tiers, comparison, FAQ and the close.',
    lede: 'A pricing page is not a pricing table: it is the table, plus the comparison for people who need the detail, plus the FAQ that answers the objection the number created, plus a final call to action. These are the assembled page in that order, which is why they convert better than dropping a tier grid onto a blank route.',
    filter: { match: ['pricing', 'plans', 'subscription'], levels: ['page', 'template', 'block'] },
    lead: 'page',
    keywords: ['pricing page template', 'saas pricing page example', 'pricing page react', 'plans page tailwind'],
    faq: [
      {
        q: 'Should I show prices at all if I sell enterprise?',
        a: 'Show something — a starting figure or a range. A pricing page with only "Contact sales" reads as expensive and loses the buyers who would have self-served at the bottom tier.',
      },
      {
        q: 'Where does the FAQ go on a pricing page?',
        a: 'Directly under the tiers, before the final CTA. It exists to answer the doubts the price just created, and those are freshest immediately after the number.',
      },
    ],
    related: ['pricing-tables', 'faq-sections', 'billing-screens'],
  },
  {
    slug: 'content-pages',
    title: 'Blog and content page layouts',
    tagline: 'Article pages, post indexes, changelogs and documentation shells.',
    lede: 'Content layouts are judged by whether a long piece gets finished, and that comes down to measure, rhythm and orientation — knowing where you are in a page. These carry the article shell with its table of contents and progress, the index grid, and the changelog and docs shells that reuse the same typography.',
    filter: { match: ['blog', 'article', 'changelog', 'docs', 'guide'], levels: ['page', 'template'] },
    lead: 'page',
    keywords: ['blog template react', 'documentation site template', 'article page layout', 'changelog page'],
    faq: [
      {
        q: 'Do these work with MDX?',
        a: 'Yes — the article shell styles a content slot rather than parsing anything, so MDX, a CMS payload or plain children all render the same. The prose styles are scoped to that slot rather than applied globally.',
      },
      {
        q: 'What structured data should an article carry?',
        a: '`Article` with a headline, an author and both dates. It is cheap, it is accurate if you generate it from frontmatter, and it is the difference between a bare result and one with a byline.',
      },
    ],
    related: ['blog-components', 'error-pages'],
  },
]

/* ------------------------------------------------------------------ *
 *  The control layer — primitives, which is where form queries land
 * ------------------------------------------------------------------ */

const CONTROL_HUBS: IntentHub[] = [
  {
    slug: 'form-controls',
    title: 'React form controls',
    tagline: 'Inputs, selects, checkboxes, radios and segmented controls.',
    lede: 'The layer between a CSS input style and a whole form: real components with props, states and keyboard behaviour, but small enough to compose. A block answers "what goes in this part of the page"; a control answers "what goes in this part of the form", and that is the gap most catalogs skip straight over.',
    filter: { levels: ['primitive'], categories: ['Form Controls', 'Selection'] },
    lead: 'primitive',
    keywords: ['react form components', 'input group component', 'segmented control react', 'select component tailwind'],
    faq: [
      {
        q: 'Are these built on a headless library?',
        a: 'They use Radix primitives where the accessibility work is genuinely hard — combobox, select — and plain elements where it is not. The dependency list is on each control\'s page, so nothing arrives unannounced.',
      },
      {
        q: 'Do they work with React Hook Form?',
        a: 'Yes. Each one forwards its ref and takes `value`/`onChange`, which is all a `Controller` needs — and the uncontrolled ones work with a plain `register`.',
      },
    ],
    related: ['form-input-styles', 'toggle-switches', 'date-pickers'],
  },
  {
    slug: 'date-pickers',
    title: 'Date and time pickers',
    tagline: 'Calendars, ranges, time fields and duration inputs.',
    lede: 'Date input is the control people most often get wrong, usually by making a typist use a calendar. The right answer is both: a text field that accepts what someone types alongside a picker for browsing. These do that, and they keep the range case — where the second date depends on the first — from being two unrelated fields.',
    /*
     * The control itself, at both levels that have one: the primitive
     * date and time fields, and the CSS-only date UI in the effect
     * catalog's own "Dates & Time" category (a different string from the
     * primitives' "Date & Time", which is why both are listed).
     *
     * The booking *flow* is /ui/calendar-scheduling. Until these were
     * split by level the two hubs resolved to an identical set.
     */
    filter: { levels: ['primitive', 'effect'], categories: ['Date & Time', 'Dates & Time'] },
    lead: 'primitive',
    keywords: ['react date picker', 'date range picker tailwind', 'time input component', 'calendar input react'],
    faq: [
      {
        q: 'Why not just use `<input type="date">`?',
        a: 'For a single date with no range logic, do — it is free, accessible and native on mobile. You outgrow it when you need a range, disabled dates, or a consistent look across browsers, which is what these are for.',
      },
      {
        q: 'How is the date format handled?',
        a: 'Through `Intl.DateTimeFormat` with the user\'s locale rather than a hardcoded pattern, so 03/04 does not mean two different days to two different readers.',
      },
    ],
    related: ['calendar-scheduling', 'form-controls'],
  },
  {
    slug: 'file-and-media-pickers',
    title: 'File and media pickers',
    tagline: 'File fields, image croppers, colour pickers and media selectors.',
    lede: 'Picking something — a file, a colour, an image region — is a distinct interaction from typing one, and it has its own failure modes: no preview, no way to remove a choice, no keyboard path. These cover the picker controls with all three handled, including the crop-and-preview step that turns a 4MB phone photo into an avatar.',
    filter: { levels: ['primitive'], categories: ['Pickers & Media'] },
    lead: 'primitive',
    keywords: ['react file picker', 'image cropper component', 'color picker react', 'media selector ui'],
    faq: [
      {
        q: 'Can a colour picker be accessible?',
        a: 'Only with a text field next to it. A saturation square is a two-dimensional drag with no keyboard equivalent, so the hex input is not a fallback — it is the accessible path, and these keep the two in sync.',
      },
      {
        q: 'Should cropping happen in the browser?',
        a: 'The choice, yes; the resize, ideally also — a canvas resize before upload saves bandwidth and time. Re-encode on the server too, because client-side image processing is a convenience, not a sanitiser.',
      },
    ],
    related: ['file-upload-components', 'form-controls'],
  },
  {
    slug: 'device-mockups',
    title: 'Device mockups and frames',
    tagline: 'Browser chrome, phone frames, terminals and screenshot surrounds.',
    lede: 'A screenshot in a frame reads as a product; the same screenshot bare reads as a diagram. These are the frames — browser chrome with a URL bar, phone and tablet bodies, a terminal window — as CSS rather than as PNGs, so they recolour with your theme and stay sharp at any resolution.',
    filter: {
      levels: ['primitive', 'effect'],
      match: ['frame', 'mockup', 'browser', 'phone', 'terminal', 'device', 'screenshot'],
    },
    lead: 'primitive',
    keywords: ['browser mockup css', 'device frame component', 'phone mockup react', 'screenshot frame'],
    faq: [
      {
        q: 'Should the frame be visible to a screen reader?',
        a: 'No — mark it `aria-hidden` and let the screenshot inside carry the alt text. A decorative chrome announced as "browser window" adds noise to every hero on the page.',
      },
      {
        q: 'Do these fake a specific device?',
        a: 'They are generic on purpose: rounded bodies and neutral chrome rather than a recognisable manufacturer\'s hardware, which is a trademark and likeness question nobody needs on a marketing page.',
      },
    ],
    related: ['hero-sections', 'landing-page-templates'],
  },
]

/* ------------------------------------------------------------------ *
 *  The published set
 * ------------------------------------------------------------------ */

/**
 * Every hub, in the order the index page lists them.
 *
 * Grouped by which layer of the catalog the phrase reaches for rather than
 * alphabetically: somebody scanning /ui is deciding what kind of thing they
 * need before they decide which one, and CSS effects, page sections, whole
 * screens and form controls are four different answers to that.
 */
export const HUBS: IntentHub[] = [...CSS_HUBS, ...SECTION_HUBS, ...SCREEN_HUBS, ...CONTROL_HUBS]

/** The four bands the index page renders under. */
export const HUB_GROUPS: Array<{
  id: string
  title: string
  blurb: string
  hubs: IntentHub[]
}> = [
  {
    id: 'css',
    title: 'CSS effects and techniques',
    blurb: 'Single elements: the hover state, the loader, the gradient, the shape.',
    hubs: CSS_HUBS,
  },
  {
    id: 'sections',
    title: 'Page sections',
    blurb: 'The parts a page is assembled from — pricing, hero, table, checkout.',
    hubs: SECTION_HUBS,
  },
  {
    id: 'screens',
    title: 'Whole pages and templates',
    blurb: 'Composed screens and runnable projects, not folders of sections.',
    hubs: SCREEN_HUBS,
  },
  {
    id: 'controls',
    title: 'Form controls and primitives',
    blurb: 'The layer between a styled input and a finished form.',
    hubs: CONTROL_HUBS,
  },
]

/** One hub by slug, or undefined. */
export function getHub(slug: string): IntentHub | undefined {
  return HUBS.find((hub) => hub.slug === slug)
}
