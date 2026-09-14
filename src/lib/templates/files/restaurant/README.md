# Restaurant

A restaurant's whole site: hours and phone above the fold, the menu typeset as a
bill of fare, a real reservation flow, the room and the way to find it.

One runtime dependency — `lucide-react`.

## Run it

```bash
npm install
npm run dev
```

## Routes

| Path        | Screen  |
| ----------- | ------- |
| `/`         | Home    |
| `/menu`     | Menu    |
| `/book`     | Book    |
| `/about`    | About   |
| `/gallery`  | Gallery |
| `/contact`  | Find us |
| `not-found` | 404     |

## The menu is the website

`components/menu-course-list.tsx` renders courses as headings and dishes as one
line each, with a dotted leader across to the price. The leader is a border on a
flex spacer rather than a row of literal dots — a string of "..." is read out
character by character by a screen reader.

Prices are strings, not numbers, so "market price" and "9 / 16" both work. A
numeric type and a currency formatter cannot express either.

## Dietary marks, not emoji

Marks are abbreviations with a key at the foot of the menu, each carrying an
`abbr title`. A green dot meaning vegetarian says nothing to a reader who cannot
see green and nothing at all to a screen reader. Edit `MARK_MEANINGS` in the
block to change the vocabulary.

## Hours and phone are a section, not a footer

`app/page.tsx` puts them in a `<StatsBand>` directly under the hero. Around 70%
of visits to a local business site are someone asking "are you open and where
are you", often on a phone, often standing outside. It is the cheapest
high-value decision on the page.

## Before you deploy

**Set `metadataBase` in `app/layout.tsx`.** It is `https://example.com`
right now. Next resolves every relative Open Graph image against it, so
until you change it, shared links get a broken preview.

Every string on every page is a prop with a default. Nothing here reads
from a CMS, an API or an environment variable, so search for the copy you
want to change and it will be in one file.
