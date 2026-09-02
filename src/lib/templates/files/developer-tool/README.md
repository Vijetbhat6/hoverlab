# Developer Tool

A landing page for infrastructure, plus the docs and changelog behind it.
Install command above the fold, real code before any prose, and a usage
calculator instead of pricing tiers.

One runtime dependency — `lucide-react`.

## Run it

```bash
npm install
npm run dev
```

## Routes

| Path         | Screen                                              |
| ------------ | --------------------------------------------------- |
| `/`          | Landing — terminal hero, code, integrations, pricing |
| `/docs`      | Three-column docs frame                             |
| `/changelog` | Dated release entries                               |
| `/pricing`   | Plans, comparison matrix, pricing FAQ               |
| `not-found`  | 404, with the site chrome kept in place             |

## Why the code comes before the features

Every other template in this catalog argues before it demonstrates, because
most buyers need the frame first. This audience is the exception. A
developer evaluating a tool scans for the install command, then for the
code, and decides there — so `<CodeShowcase>` sits above `<FeatureRows>`.
A feature list read *before* any code is marketing; the same list read
*after* it is documentation. Moving one section changes which one it is.

The same logic put a calculator where the pricing tiers would be. Three
columns answer "which plan am I", which is the wrong question for a metered
product. `<PricingUsageCalculator>` answers "what will this cost me at my
volume" without a sales call.

## This template opens in dark mode

The theme script in `app/layout.tsx` defaults to dark rather than following
the OS, because this palette was designed dark-first and this audience
overwhelmingly runs dark. The toggle still works and a stored preference
still wins — only the fallback changed. If you would rather follow the
system, the one-line version is in any of the other templates:

```js
var dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
```

## Before you deploy

**Set `metadataBase` in `app/layout.tsx`.** It is `https://example.com`
right now, and every relative Open Graph image resolves against it.

**The pricing tiers in `app/page.tsx` are made up.** `pricePerUnitCents`
takes fractions of a cent and the block quotes sub-cent rates per thousand,
so you can put your real numbers in directly without scaling them.

**`<FooterStatusLocale>` hard-codes `status="operational"`.** It is a prop,
not a fetch. Wire it to your real status API before shipping — a status
indicator that is green because it is a string is worse than not having
one.

## Layout

```
app/            routes — one folder per screen
components/     the blocks each screen is built from
```

## Making it yours

Colours and radius live in `app/globals.css` as HSL channel triples, in the
**Graphite** palette — near-black buttons, cool grey neutrals, one green
terminal accent and 4px corners. The primary is deliberately not a hue: a
developer tool's primary button is not a brand moment, and the accent it
does spend goes on the green.

Note that the dark theme inverts the primary rather than shifting its hue —
light mode's primary is the darkest thing on the page, dark mode's is the
lightest. Picking a colour there instead would make the two themes look
like different products.

`tailwind.config.ts` maps those variables onto the class names; the two
files are a pair, and copying one without the other leaves everything
unstyled. Every foreground/background pair clears WCAG AA in both themes.
