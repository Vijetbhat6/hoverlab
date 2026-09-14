# Open Source

A project site for a library: install command above the hero, the API in twenty
lines, docs, changelog, roadmap, community, and who funds it said plainly.

One runtime dependency — `lucide-react`.

## Run it

```bash
npm install
npm run dev
```

## Routes

| Path         | Screen    |
| ------------ | --------- |
| `/`          | Home      |
| `/docs`      | Docs      |
| `/changelog` | Changelog |
| `/roadmap`   | Roadmap   |
| `/community` | Community |
| `/sponsor`   | Sponsor   |
| `not-found`  | 404       |

## Install first, above the hero

The reader has already decided the category is interesting. They want the
command, then enough code to judge the API. Everything a SaaS page opens with —
value proposition, social proof, book a demo — costs them a scroll and buys
nothing, so `<CodeTabsPanel>` is literally the first element on the page.

## Say who funds it

"What happens if the sponsors stop" is the question that decides whether a team
takes a dependency, and almost no project answers it. The `<StatsNarrative>`
section names the sponsors, the days a week they fund, and the largest single
share of commits. If your answer is "nobody, it is a hobby", say that — it is
still better than silence.

## No pricing section here

Sponsorship lives on `/sponsor`. Putting a pricing table on the project home
page changes what the project reads as, and the one commercial fact that belongs
here is framed as disclosure rather than as a pitch.

## Before you deploy

**Set `metadataBase` in `app/layout.tsx`.** It is `https://example.com`
right now. Next resolves every relative Open Graph image against it, so
until you change it, shared links get a broken preview.

Every string on every page is a prop with a default. Nothing here reads
from a CMS, an API or an environment variable, so search for the copy you
want to change and it will be in one file.
