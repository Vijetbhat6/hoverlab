# Local Service

A site for a business people let into their house or sit down in front of:
a booking widget above the fold, every price published, and the
registrations a regulated trade has to show.

One runtime dependency — `lucide-react`.

## Run it

```bash
npm install
npm run dev
```

## Routes

| Path           | Screen                                          |
| -------------- | ----------------------------------------------- |
| `/`            | Home — booking, prices, reviews, FAQ, contact    |
| `/blog`        | News index — the local-SEO surface              |
| `/blog/[slug]` | A post                                          |
| `not-found`    | 404, with the site chrome kept in place         |

## The three things to do before this goes near a customer

**1. Wire the booking widget.** `<HeroBooking>` takes `onBook` and its
`days` are placeholders. Until you connect it, the most valuable element on
the site is a decoration.

```tsx
<HeroBooking
  days={await getAvailability()}
  onBook={async (day) => {
    await fetch('/api/appointments', { method: 'POST', body: JSON.stringify(day) })
  }}
/>
```

**2. Fix the structured data in `app/layout.tsx`.** The `Dentist` JSON-LD
carries your address, phone, opening hours, coordinates and rating. This is
what populates the map result, which is where a local business is actually
found — worth more than every other line of SEO on the site put together.

Wrong opening hours in structured data are *worse* than none: people turn up
to a closed door and leave the review about it. Make `openingHoursSpecification`
match what the contact section says, and take the `aggregateRating` out
entirely unless you have real reviews to back it.

**3. Replace the prices.** They are invented. The price list is the single
highest-leverage section on this page and a wrong number is a complaint.

## Why the page is shaped like this

Local services habitually hide prices behind a consultation, and the visitor
reads that as expensive. Publishing the list — including the awkward rows —
is most of the difference between this page and the one it replaces. A list
with the uncomfortable items missing is read as a list with something to
hide.

That section is a `<ComparisonTable>` rather than `<PricingTiers>`, which was
the obvious block and is the wrong one: its monthly/yearly toggle is not
optional, and "save 20% by paying annually" on a filling is nonsense.

The navbar's secondary slot is a `tel:` link rather than a sign-in. Nobody
has an account here, and a good share of this traffic would rather ring than
type. The contact form near the bottom is for the same reason — roughly half
of these visitors will not book online however good the widget is.

`<FooterCompliance>` is passed a single region rather than its default
three. A one-site practice rendering a UK/EU/US switcher is claiming to be a
multinational, and the regulator line is the part that has to be right.

## Layout

```
app/            routes — one folder per screen
components/     the blocks each screen is built from
```

## Making it yours

Colours and radius live in `app/globals.css` as HSL channel triples, in the
**Harbour** palette — deep teal on a cool near-white, 10px corners. Calm and
clinical without going grey.

`tailwind.config.ts` maps those variables onto the class names; the two
files are a pair, and copying one without the other leaves everything
unstyled. Every foreground/background pair clears WCAG AA in both themes.
