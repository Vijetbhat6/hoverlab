# Content Site

A publication that happens to belong to a company: blog index, article,
careers page and a 404. The site for when the writing is the product — or
the marketing.

One runtime dependency — `lucide-react`.

## Run it

```bash
npm install
npm run dev
```

## Routes

| Path           | Screen                                          |
| -------------- | ----------------------------------------------- |
| `/`            | Blog index — featured post, grid, subscribe     |
| `/blog/[slug]` | Article — header, byline, prose, subscribe      |
| `/careers`     | Team, openings by department, candidate FAQ     |
| `not-found`    | 404, with the site chrome kept in place         |

## Wiring real posts

`app/blog/[slug]/page.tsx` renders one hard-coded article. In your project
the segment is real: read `params.slug`, fetch the post from wherever your
writing lives (MDX, a CMS, a database), and pass it into `<ArticleHeader>`
as props. The index cards in `app/page.tsx` take their content the same
way — the layout never has to know where the words come from.

## Before you deploy

**Set `metadataBase` in `app/layout.tsx`.** It is `https://example.com`
right now. Next resolves every relative Open Graph image against it, so
until you change it, shared links get a broken preview.

**The copy is placeholder.** Every block takes props, so the words live in
the route files rather than inside the components — change them there and
the layout does not move.

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
