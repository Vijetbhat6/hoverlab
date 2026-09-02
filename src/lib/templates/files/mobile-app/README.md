# Mobile App

A consumer app's website, built around one conversion: the store install.
Badges and the App Store rating above the fold, a single price, and an
account area for the subscription.

One runtime dependency — `lucide-react`.

## Run it

```bash
npm install
npm run dev
```

## Routes

| Path        | Screen                                            |
| ----------- | ------------------------------------------------- |
| `/`         | Landing — store badges, ratings, features, price   |
| `/pricing`  | Plans, comparison matrix, pricing FAQ             |
| `/login`    | Sign in                                           |
| `/account`  | Profile, preferences and subscription             |
| `not-found` | 404, with the site chrome kept in place           |

## Replace the store links first

`iosHref` and `androidHref` in `app/page.tsx` are `#`. They are the only
conversion on the page — ship them unset and the entire site does nothing.

## Why the page is shaped like this

A B2B page opens its proof with customer logos. A consumer has never heard
of your customers and has absolutely heard of the App Store, so
`<TestimonialRatings>` takes that slot: the star breakdown is the only
social proof on the page they already know how to read, and nothing
competes with it.

Pricing is a single card, not tiers. A consumer app with three plans is a
consumer app nobody subscribes to — the decision it forces costs more
conversions than the extra revenue captures. `<PricingSingle>` states the
number, the annual saving and what is included, and asks once.

The FAQ answers cancellation, family sharing and offline use before the
visitor goes and reads the store's own review section, where those are the
three complaints.

## What `app/layout.tsx` sets that the others do not

- **`appleWebApp.capable`** — stops iOS Safari showing browser chrome when
  somebody adds the page to their home screen, which people do with an
  app's site.
- **`formatDetection.telephone: false`** — iOS turns anything that looks
  like a phone number into a call link, and version strings and rating
  counts look exactly like phone numbers.

## Before you deploy

**Set `metadataBase` in `app/layout.tsx`.** It is `https://example.com`,
and every relative Open Graph image resolves against it.

**The ratings are invented.** The score, the review count and the star
breakdown in `app/page.tsx` are placeholders. Store ratings are checkable
in about four seconds, so this is the worst page on the site to leave
fictional.

## Layout

```
app/            routes — one folder per screen
components/     the blocks each screen is built from
```

## Making it yours

Colours and radius live in `app/globals.css` as HSL channel triples, in the
**Signal** palette — deep emerald with a teal accent and 16px corners.

The primary sits at 24% lightness rather than the 30% it started at. Green
is the hue where white-on-fill fails soonest: at 30% it measured 4.21:1
against the 4.5:1 AA floor, and the same colour as link text on `--muted`
was 3.82:1. If you shift the hue, re-check both — a green that looks fine
is routinely a green that fails.

`tailwind.config.ts` maps those variables onto the class names; the two
files are a pair, and copying one without the other leaves everything
unstyled.
