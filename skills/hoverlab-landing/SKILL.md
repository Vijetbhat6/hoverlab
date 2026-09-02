---
name: hoverlab-landing
description: Compose a marketing or landing page out of Hoverlab blocks with a house style that reads as designed rather than assembled — section order, spacing rhythm, type scale, motion budget and the specific block ids to reach for. Use when asked for a landing page, marketing site, product page, waitlist page or "a page that sells this".
---

# Landing pages, Hoverlab house style

A landing page assembled from good sections still looks assembled. What makes
it read as designed is order, rhythm and restraint — three things a catalog
cannot decide for you. This is how to decide them.

Requires the `hoverlab` skill for the install mechanics.

## Start from the page, not the blocks

There is already a composed screen for the common cases. Install it, then cut
and replace sections:

```bash
npx hoverlab add saas-landing-page     # or pricing-page, docs-page, blog-index-page
```

Compose from scratch only when the shape genuinely differs. Editing down from
a working page is faster than assembling upward, and the spacing rhythm comes
for free.

## Section order

A landing page answers four questions in this order: *what is it, why believe
you, what does it cost, what do I do now.* Sections that answer the same
question cluster; a page that alternates between them feels padded.

A default that works:

1. **Nav** — `navbar-simple`. `navbar-mega-menu` only if there is genuinely a
   product family to navigate. A mega menu over four links reads as bloat.
2. **Hero** — one, and it sets the whole page's register. See below.
3. **Proof** — `logo-cloud` or `stats-band`. Immediately after the hero, small.
   Never both.
4. **What it does** — `bento-features` for a product with distinct surfaces,
   `feature-tabs` when the surfaces are variations of one screen,
   `code-showcase` when the audience is developers and the code *is* the pitch.
5. **Why believe you** — `testimonial-spotlight` for one strong quote,
   `testimonial-grid` when volume is the argument. One or the other.
6. **Price** — `pricing-tiers`, and `comparison-table` under it only for a
   genuinely complicated ladder.
7. **Objections** — `faq-accordion`. This is where "is it secure / can I
   cancel / do I own the code" goes, not into feature copy.
8. **Close** — `cta-split-panel` or `newsletter-signup`, then `footer-minimal`.
   `footer-mega` only if the site has the pages to fill it.

Six to eight sections. If it runs past nine, two of them are making the same
argument.

## Choosing a hero

The hero is a thesis, not a slot. Pick by what is most convincing about the
product:

- the interface itself is the pitch → `hero-screenshot` or `hero-media-overlay`
- it is a developer tool → `hero-terminal`
- the numbers are the pitch → `hero-metrics`
- a customer's words are → `hero-testimonial`
- nothing is built yet → `hero-waitlist`
- price is the differentiator → `hero-price-anchor`
- the product is a catalog or search surface → `hero-search`
- it is a mobile app → `hero-app-download`
- when in doubt → `hero-split` (copy left, visual right) or `hero-centered`

One hero. A second full-bleed statement section immediately after reads as two
heroes and halves both.

## Rhythm

- **Alternate density.** A dense section (bento, table, grid) then a light one
  (a single quote, a stats band). Two dense sections in a row is where a page
  starts to feel like a spreadsheet.
- **Keep vertical padding on one scale.** The blocks ship at a consistent
  `py-16 sm:py-24`. Do not hand-tune individual sections — if one needs air,
  the section above it is too heavy.
- **Full-bleed sparingly.** One or two banded backgrounds across the page, to
  mark the transitions between the four questions. Every-other-section banding
  is stripes, not structure.
- **One accent.** Every block reads `--primary` from the project tokens. Set it
  once; do not give a section its own accent because it "needs to pop".

## Type

- One display face, one text face. Blocks inherit whatever the project sets, so
  choose in `globals.css` rather than per section.
- Headline lengths should vary down the page: a short hero headline, then
  longer section headings. Equal-length headings on every section is what makes
  a page read as a template.
- `text-wrap: balance` on headings is already in the blocks. Leave it.

## Motion

The budget for a whole landing page is roughly:

- one orchestrated entrance in the hero,
- reveal-on-scroll for sections, staggered and short (under ~400ms),
- hover states everywhere they are useful.

That is it. Parallax on three sections, counters that spin on every stat and a
marquee on the logo cloud add up to a page that is exhausting before it is
persuasive. Every animated effect ships with a `prefers-reduced-motion` guard —
keep it, and guard anything you add.

Effects worth spending motion on, from `search_effects`: a hero background
(Backgrounds), one entrance for the headline (Entrance Animations), and button
hovers (Buttons). Search the catalog rather than writing keyframes.

## Copy

Write it before you place the sections; the copy decides which sections exist.

- Headline says what it *is*, not how it feels. "Install UI from a catalog of
  1111 effects" beats "Ship faster than ever".
- Every feature line names an outcome, not a mechanism.
- One CTA verb, used everywhere on the page. Not "Get started" in the hero,
  "Try it free" mid-page and "Sign up" at the close — that is three products to
  a skim-reader.
- No lorem, ever. Half-real copy makes layout decisions that fall apart when
  the real words arrive.

## Before you call it done

- Read it in both themes.
- Read it at 390px wide. Heroes and bentos are where mobile breaks first.
- Tab through it: every interactive element needs a visible focus state.
- Count the arguments. If two sections make the same one, delete the weaker.
