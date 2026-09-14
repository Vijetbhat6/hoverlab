# Conference Site

A conference site built around a date: the ticket step-up above the hero, a
two-day programme across three tracks, speakers, venue and a code of conduct.

One runtime dependency — `lucide-react`.

## Run it

```bash
npm install
npm run dev
```

## Routes

| Path         | Screen    |
| ------------ | --------- |
| `/`          | Home      |
| `/programme` | Programme |
| `/speakers`  | Speakers  |
| `/venue`     | Venue     |
| `/faq`       | FAQ       |
| `/conduct`   | Conduct   |
| `not-found`  | 404       |

## The agenda is the product

`components/event-agenda-grid.tsx` puts time down the side and tracks across,
with breaks spanning the full width. It renders twice — a grid above `lg`, a
linear list below — from one array, because a grid is the wrong shape on the
phone a delegate is holding in a corridor.

The two days on `/programme` deliberately have different headings. The block
hashes its `aria-labelledby` target from the heading, so two grids with
identical headings would announce the second day under the first day's title.

## Times are strings, and the zone is named

A conference happens in one city, in that city's time. Converting to the
reader's zone breaks somebody booking a train, and calling `toLocaleTimeString`
during render is a hydration mismatch. Set `timeZoneLabel` and pass strings.

## Tickets are a comparison, not a plan picker

`<ComparisonTable>`, not `<PricingTiers>` — pricing tiers carry a
monthly/yearly toggle that cannot be turned off, and a conference ticket is
bought once.

## Before you deploy

**Set `metadataBase` in `app/layout.tsx`.** It is `https://example.com`
right now. Next resolves every relative Open Graph image against it, so
until you change it, shared links get a broken preview.

Every string on every page is a prop with a default. Nothing here reads
from a CMS, an API or an environment variable, so search for the copy you
want to change and it will be in one file.
