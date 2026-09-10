# Customer Portal

The self-serve half of a paid product: the account, this period's usage with
the overage rate stated on it, every invoice as a PDF, the plan and the card
— plus the 403 that a portal reaches more often than any other screen.

One runtime dependency — `lucide-react`.

## Run it

```bash
npm install
npm run dev
```

## Routes

| Path         | Screen                                                  |
| ------------ | ------------------------------------------------------- |
| `/`          | Account — profile, team, API keys, danger zone          |
| `/usage`     | Meters, credit balance, plan limits, overage notice     |
| `/invoices`  | History, one invoice in detail, payment method          |
| `/billing`   | Plan summary, usage, invoice history                    |
| `/no-access` | 403, naming the people who can grant what was refused   |
| `/login`     | Sign in                                                 |
| `not-found`  | 404                                                     |

## The one seam to close first

**Three of these screens wear different chrome.** `/` renders inside
`settings-nav-layout`, `/billing` inside `dashboard-shell`, and `/usage` and
`/invoices` inside neither. Each is right on its own — they are pages built
to stand alone — and together they read as three products.

Pick one and apply it in a route group rather than per page:

```
app/
  (portal)/
    layout.tsx      ← the shell, once
    page.tsx        ← account
    usage/page.tsx
    invoices/page.tsx
    billing/page.tsx
```

Then strip the inner shell from `/billing`. Doing it in a layout rather than
in four pages is what keeps the navigation from drifting the first time you
add a fifth screen.

## Three decisions worth keeping

**The overage notice states the rate, not the percentage.** "128 of 100 GB"
tells a customer they are over. "$0.09 per GB beyond the included 100"
tells them what it costs, which is the only version they can act on. The
notice and the meter below it are pointed at the same metric on purpose —
two billing components disagreeing about which quota is over reads as a bug
in the product, not as two components with independent demo data.

**The 403 names people.** A permission screen that says you cannot do
something and stops is accurate and useless; the reader's next question is
always "then who can". The roster underneath answers it. Filter that list to
people who can grant the *specific* permission — everyone in the workspace
is the same dead end with more names on it.

**Invoices are downloadable without an account on the product.** The person
who needs the PDF is in finance and has never logged in. If your invoice
links require a session, they will ask your customer to forward it every
month, forever.

## Before you deploy

**This template is `noindex`.** An invoice URL carries a company name, an
address and an amount. Indexed once, it is cached by parties you cannot ask
to forget it.

**`/no-access` must be a real authorisation result, not a route people can
type.** Every screen here renders regardless of who is asking. The 403 is a
design, not a check — add the check in middleware.

**Currency is pinned to `en-US`/USD** in `components/billing-invoice-detail.tsx`
and `components/usage-meter-panel.tsx`. Change it there, and always pass an
explicit locale: dropping the argument makes the number depend on the
visitor's browser, which is both a support ticket and a hydration mismatch.

**The data is fixtures.** Each block defaults to plausible sample content so
it renders standalone. Search your app for `DEFAULT_` to find every
hard-coded array that needs replacing with a fetch.

## Layout

```
app/            routes — one folder per screen
components/     the blocks each screen is built from
```

## Making it yours

Colours and radius live in `app/globals.css`; `tailwind.config.ts` maps
them onto class names. The two files are a pair — copying one without the
other leaves everything unstyled.
