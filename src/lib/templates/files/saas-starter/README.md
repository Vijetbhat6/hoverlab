# SaaS Starter

A complete Next.js project: marketing site, auth, dashboard, settings and
billing. Eight routes, assembled from blocks you can open and edit
individually.

One runtime dependency — `lucide-react`, for icons. No component library,
no CSS-in-JS, no animation library.

## Run it

```bash
npm install
npm run dev
```

## Routes

| Path         | Screen                                   |
| ------------ | ---------------------------------------- |
| `/`          | Marketing landing page                   |
| `/pricing`   | Plans, comparison matrix, pricing FAQ    |
| `/login`     | Sign-in                                  |
| `/dashboard` | Metrics, chart, activity feed            |
| `/customers` | Sortable, filterable, paginated list     |
| `/settings`  | Profile, team, API keys, danger zone     |
| `/billing`   | Plan, usage meters, invoice history      |
| `not-found`  | 404, with the site chrome kept in place  |

## Layout

```
app/            routes — one folder per screen
components/     the blocks each screen is built from
```

Every page in `app/` is a running order: it imports blocks from
`components/` and arranges them. Nothing else. To change what a section
says, pass different props; to change how it looks, edit the block.

## Making it yours

**Colours and radius** live in `app/globals.css` as HSL channel triples.
Change `--primary` and the whole project follows — every block styles
itself with `bg-primary`, `text-muted-foreground` and friends rather than
literal colours.

`app/globals.css` and `tailwind.config.ts` are a pair. The config maps the
class names onto the variables; without it, `bg-card` is not a class and
everything renders unstyled.

**Dark mode** is a `dark` class on `<html>`, applied before first paint by
the inline script in `app/layout.tsx`. That script has to stay in `<head>`
and stay blocking — move it and you get a white flash on every load.

**Deleting things.** Each route is self-contained. Remove `app/billing/`
and nothing else breaks; the only shared pieces are the layout, the theme
provider and whichever blocks that route used.

## Accessibility

Blocks ship with focus rings, `aria-*` wiring on the interactive ones, and
`motion-safe:` guards on every animation. `app/globals.css` adds a global
`prefers-reduced-motion` backstop for anything you add later.

The one thing you must do yourself: check contrast if you change
`--primary`. Nothing here can verify that your brand colour clears 4.5:1
against your background.
