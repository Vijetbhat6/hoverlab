# Agency Studio

A design studio's site: full-bleed hero, client list, engagements described
as engagements, the actual team, a journal and a careers page. No pricing,
on purpose.

One runtime dependency — `lucide-react`.

## Run it

```bash
npm install
npm run dev
```

## Routes

| Path           | Screen                                          |
| -------------- | ----------------------------------------------- |
| `/`            | Studio — hero, clients, outcomes, services, team |
| `/blog`        | Journal index                                   |
| `/blog/[slug]` | A post                                          |
| `/careers`     | Open roles                                      |
| `not-found`    | 404, with the site chrome kept in place         |

## Put a real image in the hero

`<HeroMediaOverlay>` takes `children` as its media layer and falls back to a
gradient. Drop an `<Image>` in and the scrim, the type and the buttons keep
working — that is why the media is a slot rather than a `src` prop:

```tsx
<HeroMediaOverlay heading="…">
  <Image src="/studio.jpg" alt="" fill priority />
</HeroMediaOverlay>
```

For a studio this is the one section that gets to demonstrate rather than
assert, so the gradient is a placeholder in a stronger sense than usual.

## Why there is no pricing section

A studio that publishes a day rate gets shopped on it. The engagement
descriptions do the qualifying instead — someone who reads "eight to twelve
weeks" and leaves was never going to be a fit, and that section is doing
its job when they do.

The team section is the one part of this page that is not optional. Every
other template in this catalog could drop it; a studio cannot. The client
is buying named individuals, and a studio page that hides who works there
reads as a reseller.

## The structured data in `app/layout.tsx`

A studio's site is found by name — somebody was given a recommendation and
typed it — so the layout emits `ProfessionalService` JSON-LD with the name,
addresses and contact. It is in the layout rather than on the page so the
journal and careers pages carry it too, which is where a search engine
resolves "who are these people" from.

**Replace every field in it before deploying.** Structured data describing
a fictional studio is worse than none.

## Before you deploy

**Set `metadataBase` in `app/layout.tsx`.** It is `https://example.com`,
and every relative Open Graph image resolves against it.

**The outcomes are invented.** The numbers in `<StatsNarrative>` come with
their sample sizes attached, which is the point of that block and also what
makes fabricating them worse than usual. Use your own or cut the section.

**`<TeamGrid>` ships with six placeholder people.** Initials avatars rather
than photos, so there is no asset pipeline to set up — just replace the
names, roles and one-line bios.

## Layout

```
app/            routes — one folder per screen
components/     the blocks each screen is built from
```

## Making it yours

Colours and radius live in `app/globals.css` as HSL channel triples, in the
**Sandstone** palette — terracotta on warm paper neutrals with 6px corners,
and no blue in it anywhere. That last part is most of why it reads as a
studio rather than a product; if you shift the hue, shift the neutrals with
it or the warmth goes and takes the character with it.

`--card` is warmer than pure white rather than neutral, so cards lift off
the page without introducing the only cool surface in the palette.

`tailwind.config.ts` maps those variables onto the class names; the two
files are a pair, and copying one without the other leaves everything
unstyled. Every foreground/background pair clears WCAG AA in both themes.
