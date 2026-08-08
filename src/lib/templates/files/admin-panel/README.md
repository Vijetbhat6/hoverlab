# Admin Panel

The internal-tool half of a product: dashboard, list view, settings,
billing and a sign-in screen. No marketing pages.

One runtime dependency — `lucide-react`.

## Run it

```bash
npm install
npm run dev
```

## Routes

| Path         | Screen                               |
| ------------ | ------------------------------------ |
| `/`          | Dashboard — metrics, chart, activity |
| `/customers` | Sortable, filterable, paginated list |
| `/settings`  | Profile, team, API keys, danger zone |
| `/billing`   | Plan, usage meters, invoices         |
| `/login`     | Sign-in                              |
| `not-found`  | 404                                  |

## Before you deploy

**This template is `noindex` by default.** `app/layout.tsx` sets
`robots: { index: false }`. Keep it — an admin panel in a search index is a
disclosure, not a marketing win.

**None of this is access control.** Every screen renders regardless of who
is asking. Add real authorisation in middleware before there is anything
real behind these routes; the sign-in screen is a form, not a gate.

**The data is fixtures.** Each block defaults to plausible sample content so
it renders standalone. Search your app for `DEFAULT_` to find every
hard-coded array that needs replacing with a fetch.

## Layout

```
app/            routes — one folder per screen
components/     the blocks each screen is built from
```

`components/dashboard-shell.tsx` owns the sidebar, the top bar and the
scroll region; every screen renders inside it as `children`. Add a route by
adding a nav item there and a folder in `app/`.

## Making it yours

Colours and radius live in `app/globals.css`; `tailwind.config.ts` maps
them onto class names. The two files are a pair — copying one without the
other leaves everything unstyled.
