# Developer Portfolio

A developer's personal site. A terminal hero instead of a gradient, real code on the
home page, six projects with the constraint named, and a printable CV.

One runtime dependency — `lucide-react`.

## Run it

```bash
npm install
npm run dev
```

## Routes

| Path              | Screen   |
| ----------------- | -------- |
| `/`               | Home     |
| `/projects`       | Projects |
| `/writing`        | Writing  |
| `/writing/[slug]` | Post     |
| `/cv`             | CV       |
| `/about`          | About    |
| `/contact`        | Contact  |
| `not-found`       | 404      |

## Making it yours

Three files carry almost everything personal. `app/page.tsx` has the terminal
output (`OUTPUT`), the projects (`PROJECTS`, `FEATURED`) and the code sample
(`SAMPLE`). `app/cv/page.tsx` renders `<ResumeDocument>` — pass it your own
`roles`, `skills` and `sections` props rather than editing the component.

The code sample is the part people skip and should not. Thirty legible lines of
your own work does more than six project links, because almost nobody clicks
through to a repository to judge you.

## The excerpts are the work

Every project excerpt names an outcome and a constraint — the deadline, the
legacy system, the budget. "A booking flow rebuilt in six weeks against a fixed
launch date" is something a reader can map onto their own problem. "A bold,
modern experience" is not, and a portfolio made entirely of the second kind
gives nobody a reason to open anything.

## Before you deploy

**Set `metadataBase` in `app/layout.tsx`.** It is `https://example.com`
right now. Next resolves every relative Open Graph image against it, so
until you change it, shared links get a broken preview.

Every string on every page is a prop with a default. Nothing here reads
from a CMS, an API or an environment variable, so search for the copy you
want to change and it will be in one file.
