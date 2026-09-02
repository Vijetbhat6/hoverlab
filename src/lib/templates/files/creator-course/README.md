# Creator Course

One person selling one course. A student testimonial as the hero because a
course cannot demo, a long instructor section, one price, and the refund
policy on the page rather than in the terms.

One runtime dependency — `lucide-react`.

## Run it

```bash
npm install
npm run dev
```

## Routes

| Path           | Screen                                        |
| -------------- | --------------------------------------------- |
| `/`            | Course — hero, outcomes, curriculum, price     |
| `/blog`        | Journal index                                 |
| `/blog/[slug]` | A post                                        |
| `/login`       | Student sign-in                               |
| `not-found`    | 404, with the site chrome kept in place       |

## Three decisions worth keeping

**A testimonial is the hero.** A course cannot demo. Screenshots of lecture
slides sell nothing and the headline claim is unfalsifiable by definition.
The nearest thing to a demo is somebody who finished it saying what changed,
which is why `<HeroTestimonial>` is at the top rather than three sections
down where testimonials usually live.

**The instructor section is long.** `<TeamGrid>` with a single member reads
oddly on a company site and is exactly right here — the decision being made
is whether to spend nine weeks listening to this particular person. A
two-line bio under a headshot is the most common reason a good course does
not sell.

**The refund policy is in the pricing block.** It is the single biggest
objection to a several-hundred-pound purchase from an individual with no
brand behind them, and it belongs where the decision is made rather than in
a terms page nobody opens. Note the shape: specific, generous, and it names
how many people have used it. "11 of 340" does more than "no quibble
guarantee" ever will.

## Before you deploy

**Set `metadataBase` in `app/layout.tsx`.** A course from an individual is
sold almost entirely by being shared — a post, a newsletter, a message in a
group chat. The Open Graph card *is* the top of the funnel here, so a broken
preview does not degrade acquisition, it removes it.

**Keep the `Course` JSON-LD in step with the page.** `offers.availabilityEnds`
is the early-bird date and it appears twice — in `app/layout.tsx` and in the
pricing note in `app/page.tsx`. Structured data claiming a discount that has
ended is a mismatch that gets a rich result withdrawn, and a promise to a
customer either way.

**Replace the numbers and the person.** Cohort dates, student count, refund
count, the places past students work, and the whole instructor bio are
placeholders.

## Layout

```
app/            routes — one folder per screen
components/     the blocks each screen is built from
```

## Making it yours

Colours and radius live in `app/globals.css` as HSL channel triples, in the
**Plum** palette — magenta-plum with 20px corners, the softest shape in the
Hoverlab set. Personal and a little expensive, for a product that is one
person rather than a company.

`tailwind.config.ts` maps those variables onto the class names; the two
files are a pair, and copying one without the other leaves everything
unstyled. Every foreground/background pair clears WCAG AA in both themes.
