# Storefront

The whole purchase funnel as a Next.js project: browse, product, bag,
checkout, confirmation, and a customer account area.

One runtime dependency — `lucide-react`. No commerce SDK, no payment
provider, no state library.

## Run it

```bash
npm install
npm run dev
```

## Routes

| Path                 | Screen                                     |
| -------------------- | ------------------------------------------ |
| `/`                  | Collection — filters, sort, product grid   |
| `/products/[slug]`   | Product detail — gallery, buy box, reviews |
| `/cart`              | Bag — editable lines and order summary     |
| `/checkout`          | Address and payment                        |
| `/orders/confirmed`  | Order confirmation                         |
| `/account/orders`    | Order history                              |
| `not-found`          | 404                                        |

## What this is not

**There is no backend.** Every block renders from hard-coded sample data so
it works standalone. Search for `DEFAULT_` to find every fixture that needs
replacing with a real fetch.

**Checkout does not take money.** `components/checkout-form.tsx` is a form
with correct autocomplete tokens and validation affordances — it collects
card details into local state and does nothing with them. Wire it to Stripe
Elements, Checkout, or your provider's SDK before it goes anywhere near a
real customer. **Never post raw card numbers to your own server.**

**Cart state is per-component.** Each block holds its own state so it
previews on its own. Lift it into a context, a store, or the URL when you
connect this to a real catalogue.

## Money

Prices are **integer minor units** throughout — `8900` is £89.00 — and are
formatted with `Intl.NumberFormat` only at the point of display. Keep it
that way. Floating point is how `19.99 × 3` becomes `59.97000000000001` in
a cart total, and it is always found in production rather than in review.

Totals are derived from the line items on every render, never stored. A
cart that keeps its own `total` field drifts the first time a quantity
changes on a path that forgot to recompute it.

## Images

Product images are Tailwind gradient placeholders, not remote URLs — the
blocks work offline and in a sandbox. Swap them for `next/image` with a
fixed `aspect-ratio` when you have real photography. Keeping the ratio is
what stops the gallery pushing the buy box down the page as images load.

## Making it yours

Colours and radius live in `app/globals.css`; `tailwind.config.ts` maps them
onto the class names. The two files are a pair — neither works alone.

Set `metadataBase` in `app/layout.tsx` to your real domain before deploying,
or shared links get a broken Open Graph preview.
