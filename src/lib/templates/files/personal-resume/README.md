# Personal Resume

A minimal personal site whose home page is the CV itself — printable, indexable,
and therefore the copy that actually stays current.

One runtime dependency — `lucide-react`.

## Run it

```bash
npm install
npm run dev
```

## Routes

| Path        | Screen  |
| ----------- | ------- |
| `/`         | Résumé  |
| `/work`     | Work    |
| `/writing`  | Writing |
| `/about`    | About   |
| `/contact`  | Contact |
| `not-found` | 404     |

## It prints, and that is the point

Open the home page and press Ctrl/Cmd-P. The `print:` layer in
`components/resume-document.tsx` forces black on white, keeps each role from
splitting across a page break, and hides the print button itself.

That is why the CV is HTML here rather than a PDF behind a download link. A PDF
is a second artefact, and the second artefact is always the stale one.

## Five routes is the design

Every instinct is to add — a testimonial rail, a skills chart, a logo cloud of
former employers. All of them push the second job below the fold and none of
them are read. A hiring manager gives this page under a minute and spends it on
the roles, so nothing interrupts them.

## Before you deploy

**Set `metadataBase` in `app/layout.tsx`.** It is `https://example.com`
right now. Next resolves every relative Open Graph image against it, so
until you change it, shared links get a broken preview.

Every string on every page is a prop with a default. Nothing here reads
from a CMS, an API or an environment variable, so search for the copy you
want to change and it will be in one file.
