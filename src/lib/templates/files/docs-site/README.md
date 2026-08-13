# Docs Site

A documentation site: the three-column docs frame — sidebar, article,
on-this-page rail — plus a changelog and a 404. The part of the product
that wants to be found by a search for an error message.

One runtime dependency — `lucide-react`.

## Run it

```bash
npm install
npm run dev
```

## Routes

| Path         | Screen                                          |
| ------------ | ----------------------------------------------- |
| `/`          | Docs — sidebar, article, on-this-page rail      |
| `/changelog` | Release timeline with a subscribe form          |
| `not-found`  | 404, with the site chrome kept in place         |

## Wiring real content

`app/page.tsx` renders one hard-coded article. In your project the route
becomes `app/docs/[[...slug]]/page.tsx`: read the slug, load the article
from wherever your writing lives (MDX is the usual answer), and pass the
nav tree, breadcrumb, body and toc into `<DocsLayout>` as props. The frame
never changes per page — that is the whole point of a docs frame.

The changelog works the same way: `<ChangelogTimeline>` takes its releases
as props, so publishing a release is appending one object, not editing
markup.

## Before you deploy

**Set `metadataBase` in `app/layout.tsx`.** It is `https://example.com`
right now. Next resolves every relative Open Graph image against it, so
until you change it, shared links get a broken preview.

**Keep docs crawlable.** This template deliberately ships without a robots
override — half of all docs traffic is a search result. If you fork it for
internal docs, add `robots: { index: false }` to the root metadata.

## Layout

```
app/            routes — one folder per screen
components/     the blocks each screen is built from
```

## Making it yours

Colours and radius live in `app/globals.css` as HSL channel triples; change
`--primary` and every section follows. `tailwind.config.ts` maps those
variables onto the class names — the two files are a pair, and copying one
without the other leaves everything unstyled.

Dark mode is a `dark` class on `<html>`, applied before first paint by the
inline script in `app/layout.tsx`. Keep it blocking and in `<head>`, or you
get a white flash on every load.
