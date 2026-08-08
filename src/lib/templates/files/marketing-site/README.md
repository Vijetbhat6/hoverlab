# Marketing Site

A three-route marketing site: landing page, pricing page and a 404. The
smallest thing you can put in front of a product and have it look
deliberate.

One runtime dependency — `lucide-react`.

## Run it

```bash
npm install
npm run dev
```

## Routes

| Path        | Screen                                        |
| ----------- | --------------------------------------------- |
| `/`         | Landing — hero, proof, features, price, FAQ   |
| `/pricing`  | Plans, comparison matrix, pricing FAQ         |
| `not-found` | 404, with the site chrome kept in place       |

## Before you deploy

**Set `metadataBase` in `app/layout.tsx`.** It is `https://example.com`
right now. Next resolves every relative Open Graph image against it, so
until you change it, shared links get a broken preview.

**The copy is placeholder.** Every block takes props, so the words live in
`app/page.tsx` rather than inside the components — change them there and
the layout does not move.

## Layout

```
app/            routes — one folder per screen
components/     the blocks each screen is built from
```

`app/page.tsx` is a running order: hero, then proof, then substance, then
price, then objections, then somewhere to go. That sequence is the part
worth keeping even if you replace every section in it.

## Making it yours

Colours and radius live in `app/globals.css` as HSL channel triples; change
`--primary` and every section follows. `tailwind.config.ts` maps those
variables onto the class names — the two files are a pair, and copying one
without the other leaves everything unstyled.

Dark mode is a `dark` class on `<html>`, applied before first paint by the
inline script in `app/layout.tsx`. Keep it blocking and in `<head>`, or you
get a white flash on every load.
