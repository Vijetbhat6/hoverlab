# Estate Agency

Property search with results already in it, a listing page that puts tenure and
EPC above the prose, the agents, and a valuation route for the other half of the
business.

One runtime dependency — `lucide-react`.

## Run it

```bash
npm install
npm run dev
```

## Routes

| Path               | Screen    |
| ------------------ | --------- |
| `/`                | Search    |
| `/property/[slug]` | Property  |
| `/agents`          | Agents    |
| `/valuation`       | Valuation |
| `/about`           | About     |
| `not-found`        | 404       |

## The map is decorative, deliberately

`components/listing-map-split.tsx` draws an inline SVG map with price pins and
marks the whole pane `aria-hidden`, with nothing focusable in it. A picture
carries no information to a reader who cannot see it, and pins duplicating the
list beside them make a keyboard user tab through every property twice.

When you swap in a real map library, keep that shape: markers should stay out of
the tab order unless they do something the list cannot.

## Swapping the drawn map for a real one

Replace the `<svg>` inside `DrawnMap` with your map component and keep the
absolutely positioned pins, which are already placed from per-cent `x`/`y` on
each listing. The pane holds its exact final size at every breakpoint, so
there is no layout shift when tiles load.

## Publish your own numbers

The `MARKET` band on `app/page.tsx` carries time-to-sell, achieved-against-
asking and fall-through rate. These are the four figures that separate one agent
from another and almost nobody prints them. If you replace them with adjectives
you have removed the only reason the page is persuasive.

## Before you deploy

**Set `metadataBase` in `app/layout.tsx`.** It is `https://example.com`
right now. Next resolves every relative Open Graph image against it, so
until you change it, shared links get a broken preview.

Every string on every page is a prop with a default. Nothing here reads
from a CMS, an API or an environment variable, so search for the copy you
want to change and it will be in one file.
