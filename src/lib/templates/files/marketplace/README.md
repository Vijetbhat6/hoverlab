# Marketplace

A two-sided marketplace: search and real listings for buyers above the fold,
the seller economics below it, and a browse route behind both.

One runtime dependency — `lucide-react`.

## Run it

```bash
npm install
npm run dev
```

## Routes

| Path               | Screen                                       |
| ------------------ | -------------------------------------------- |
| `/`                | Home — search, categories, listings, sellers  |
| `/browse`          | Collection with filters and a toolbar        |
| `/products/[slug]` | A listing — gallery, buy box, reviews        |
| `/login`           | Sign in                                      |
| `not-found`        | 404, with the site chrome kept in place      |

## Wire the search first

`<HeroSearch>` takes `onSearch` and does nothing without it. It is the
primary conversion on the page — a buyer on a marketplace has already
decided to buy something, and the job is to get them to results in one
action.

```tsx
<HeroSearch onSearch={(q) => router.push(`/browse?q=${encodeURIComponent(q)}`)} />
```

Then make `/browse` actually read `q`. The `SearchAction` JSON-LD in
`app/layout.tsx` offers your search box directly inside a Google result for
the brand, and it points at `/browse?q=` — pointing it at a route that
ignores the query is worse than not shipping it.

## Why the buyer sections come first

Supply is the harder side to acquire and the temptation is to lead with it.
Do that and the buyer — who is the entire reason a seller would join —
bounces off a page about commission rates. So: buyers above the fold,
sellers below, and one seller link in the navbar for the people who came
looking for it.

That navbar carries **two** CTAs, which is a deliberate exception to the
one-ask rule the other templates follow. On a marketplace the two asks go to
genuinely different people, so splitting them costs nothing — the seller
link is not stealing buyer conversions, it is catching traffic the buyer
funnel would have dropped.

The seller pitch is `<StatsComparison>` — before-and-after economics, not
adjectives. And the testimonials are from **sellers**, not buyers: supply is
the harder sale, and a buyer saying "lovely mug" convinces a maker of
nothing.

The FAQ is `<FaqSearch>` rather than an accordion because the two audiences
ask entirely different questions, and a single list makes each of them
scroll past the other's.

## Before you deploy

**Set `metadataBase` in `app/layout.tsx`.** It is `https://example.com`.

**The `max-image-preview: large` robots directive is deliberate** — listing
results are chosen on the thumbnail and the default preview is a postage
stamp. Keep it.

**Every number is invented**, including the maker counts, the seller
economics and the "1,204 sellers" sample. The footnote under
`<StatsComparison>` admits that 18% of sellers left inside a year; if you
replace the figures, keep a caveat of that kind. A table of outcomes with no
sample and no attrition reads as marketing.

## Layout

```
app/            routes — one folder per screen
components/     the blocks each screen is built from
```

## Making it yours

Colours and radius live in `app/globals.css` as HSL channel triples, in the
**Moss** palette — dark olive on a warm off-white, 8px corners. Olive at 95°
rather than an emerald at 162°: made rather than manufactured, which is the
whole difference between a marketplace and a shop.

`tailwind.config.ts` maps those variables onto the class names; the two
files are a pair, and copying one without the other leaves everything
unstyled. Every foreground/background pair clears WCAG AA in both themes.
