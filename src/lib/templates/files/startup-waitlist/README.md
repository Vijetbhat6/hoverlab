# Startup Waitlist

A pre-launch site for a product you cannot buy yet: one email field, a
journal to keep the list warm, and no pricing section to be held to later.

One runtime dependency — `lucide-react`.

## Run it

```bash
npm install
npm run dev
```

## Routes

| Path           | Screen                                            |
| -------------- | ------------------------------------------------- |
| `/`            | Waitlist — hero form, proof, features, FAQ, CTA    |
| `/blog`        | Journal index                                     |
| `/blog/[slug]` | A post                                            |
| `not-found`    | 404, with the site chrome kept in place           |

## Wire up the form first

`<HeroWaitlist>` takes an `onSubmit` prop and does nothing with the email
without one. Until you pass it, the form shows its success state and
discards the address — which is fine for a demo and a disaster on a live
page, so this is the first thing to change.

```tsx
<HeroWaitlist
  onSubmit={async (email) => {
    await fetch('/api/waitlist', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }}
/>
```

The block handles the pending and success states itself; your handler only
has to store the address and throw if it could not.

## Why the page is shaped like this

The running order in `app/page.tsx` is not the SaaS page with pricing
deleted. A product nobody can buy has a different argument to make:
scarcity and momentum instead of adoption, one named beta user instead of a
testimonial grid, and a FAQ answering *when*, *what will it cost* and *what
happens to my data* rather than feature questions.

Two absences are deliberate and worth keeping:

- **No pricing.** Naming a number before the product exists converts worse
  than "free for the first cohort", and commits you to it publicly.
- **No screenshot hero.** A mock of an unfinished product is the one thing
  beta users reliably remember and hold you to.

Every button on the page does the same thing, on purpose. A pre-launch page
with a second call to action splits its only metric across two funnels.

## Before you deploy

**Set `metadataBase` in `app/layout.tsx`.** It is `https://example.com`
right now. A pre-launch site is shared far more than it is searched, so the
Open Graph card is the load-bearing metadata here — and until you change
this, every shared link previews broken.

**Replace the numbers.** The waitlist count, the cohort size and the beta
testimonial in `app/page.tsx` are placeholders. Inventing social proof is
the fastest way to lose the audience this page is for.

## Layout

```
app/            routes — one folder per screen
components/     the blocks each screen is built from
```

## Making it yours

Colours and radius live in `app/globals.css` as HSL channel triples, in the
**Ultraviolet** palette — saturated violet on a cool near-white, with 16px
corners. Change `--primary` and `--ring` together and every section follows.
`tailwind.config.ts` maps those variables onto the class names; the two
files are a pair, and copying one without the other leaves everything
unstyled.

Every foreground/background pair in that file clears WCAG AA in both
themes. If you retune one, check the pair rather than trusting the eye —
mid-lightness accents are the ones that fail.

Dark mode is a `dark` class on `<html>`, applied before first paint by the
inline script in `app/layout.tsx`. Keep it blocking and in `<head>`, or you
get a white flash on every load.
