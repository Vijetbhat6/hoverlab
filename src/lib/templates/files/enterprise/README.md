# Enterprise

A sales-led B2B site for software bought in a boardroom: numbers in the
hero, a comparison table that concedes rows, video references, and published
prices instead of a "contact sales" wall.

One runtime dependency — `lucide-react`.

## Run it

```bash
npm install
npm run dev
```

## Routes

| Path        | Screen                                          |
| ----------- | ----------------------------------------------- |
| `/`         | Home — metrics, comparison, references, pricing  |
| `/pricing`  | Plans, comparison matrix, pricing FAQ           |
| `/login`    | Sign in                                         |
| `/settings` | Account, preferences and team                   |
| `not-found` | 404, with the site chrome kept in place         |

## The reader cannot buy this

They are building an internal case for somebody else to sign, and the page's
job is to hand them the case rather than to convince them personally. Three
sections exist entirely for that:

**Numbers in the hero.** Everything above the fold gets pasted into a slide
by someone who needs their VP to care. A headline cannot be pasted; "31%
lower cost per close, median across 412 accounts" can.

**A comparison that loses two rows.** `<ComparisonTable>` names the
incumbent and concedes "works offline" and "nobody has to be trained on it"
to the alternatives. A table that wins every row is read as marketing and
discarded — losing two on purpose is what makes the other ten usable inside
the customer's own organisation, which is where the argument actually
happens.

**Video references.** Procurement will ask for them. `<TestimonialVideo>` is
the answer arriving before the question, and one of the three quotes says
the match rate was worse than the demo for two months. Keep that shape when
you replace the content; three unqualified endorsements are worth less than
two plus a caveat.

## Why prices are on it

"Contact sales" is the default at this tier and it costs more than it
protects: the champion cannot open a budget conversation without a number,
so the deal never starts. Publishing the floor — including the enterprise
one — also filters out buyers who were never going to clear it.

`<PricingTiers>` is used here rather than `<PricingPlanPicker>`, whose own
header talks you out of it: that block is the checkout step for someone who
has already decided to pay, and its prorated "charged today" line is
nonsense on a page nobody has an account on.

## This template opens in light mode

The theme script in `app/layout.tsx` starts light unless the visitor has
explicitly chosen dark, rather than following the OS. This traffic arrives
on managed corporate machines and gets screenshotted into decks and printed
into board packs, and a dark screenshot in a slide is a black rectangle. To
make it system-aware again, copy the `matchMedia` line from any other
template.

## Before you deploy

**Set `metadataBase` in `app/layout.tsx`.** On this site the link is being
shared internally, to the person who signs.

**Every figure is invented** — the metrics, the match rates, the customer
count, the renewal rate and the prices. `<StatsTimeline>` in particular is
answering "will you still exist when we renew", and a fabricated funding and
certification history is the worst thing on this page to leave as
placeholder.

**The compliance footer names two legal entities.** Replace both, or delete
the one you do not have.

## Layout

```
app/            routes — one folder per screen
components/     the blocks each screen is built from
```

## Making it yours

Colours and radius live in `app/globals.css` as HSL channel triples, in the
**Claret** palette — burgundy on a barely-warm white with 4px corners. The
register of institutions rather than products.

One thing to preserve if you retune it: `--destructive` sits at 14° — an
orange-red — rather than the 0–6° every other palette here uses. This is the
one palette whose primary is itself in the red family, and a destructive
button that is merely a lighter burgundy is a destructive button nobody
reads as a warning.

`tailwind.config.ts` maps those variables onto the class names; the two
files are a pair. Every foreground/background pair clears WCAG AA in both
themes.
