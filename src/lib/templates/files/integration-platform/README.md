# Integration Platform

A site for a unified-API product: the connector names in the hero, a
catalogue with honest live/beta/planned status, four SDK languages, credit
pricing and a dated roadmap.

One runtime dependency — `lucide-react`.

## Run it

```bash
npm install
npm run dev
```

## Routes

| Path         | Screen                                            |
| ------------ | ------------------------------------------------- |
| `/`          | Home — catalogue, code, pricing, roadmap, FAQ      |
| `/docs`      | Three-column docs frame                           |
| `/changelog` | Dated release entries                             |
| `not-found`  | 404, with the site chrome kept in place           |

## This is not the Developer Tool template again

The question that decides a developer tool is "is this any good". The
question that decides an integration platform is **"is my thing on the
list"**, and a visitor who cannot answer that in ten seconds leaves however
good the product is. Everything follows from that:

- The connector names are in the hero, above the pitch.
- The catalogue is the second section, not a page behind a nav link.
- The roadmap is on the landing page, because most visitors will *not* find
  their system in the catalogue — and without a roadmap that is a dead end,
  while with one it is a date and a mailing list. Cheapest section on the
  page, catches the majority of the traffic.

## Keep the `planned` statuses honest

`<IntegrationGrid>` takes `live | beta | planned` and the temptation is to
mark everything live. Do that and the first developer who hits a beta
connector in production stops believing the rest of the list. Four entries
here are marked `planned` and two `beta` on purpose: it costs a few signups
and buys the credibility that makes the other thirty-odd worth anything.

## Keep the catalogue server-rendered

Every connector name has to be in the HTML that arrives, not assembled after
hydration — the entire acquisition strategy for this kind of product is
being the answer to a query containing somebody else's product name. That is
why the keywords in `app/layout.tsx` are connector names rather than
"integration platform", which nobody searches for.

If you replace the catalogue with an interactive filtered grid, render the
full list first and filter on top of it.

## Why credits and not seats

Integration volume is bursty — a customer's migration month is fifty times a
normal one. A seat price makes the quiet months feel like a rip-off and the
busy ones like a penalty. `<PricingCredits>` fits the actual shape of the
usage, and the assurances under it ("retries after our own failures are
never charged", "hard caps available") answer the two objections credit
pricing always raises.

## Before you deploy

**Set `metadataBase` in `app/layout.tsx`.**

**Every connector, status and price is invented.** The status field is the
one to be most careful with, for the reason above.

**The FAQ answers "can we self-host" with a plain no.** That is a real
answer written down rather than a sales process that ends in the same place;
keep the shape even if your answer differs.

## Layout

```
app/            routes — one folder per screen
components/     the blocks each screen is built from
```

## Making it yours

Colours and radius live in `app/globals.css` as HSL channel triples, in the
**Cobalt** palette — high-chroma blue at 212° with a lighter azure accent to
keep it off the navy end, and 12px corners.

`tailwind.config.ts` maps those variables onto the class names; the two
files are a pair, and copying one without the other leaves everything
unstyled. Every foreground/background pair clears WCAG AA in both themes.
