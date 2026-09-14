# Job Board

A two-sided board where candidates get the whole site and employers get one
section and a price. Listings grouped by craft, each with a real range.

One runtime dependency — `lucide-react`.

## Run it

```bash
npm install
npm run dev
```

## Routes

| Path           | Screen     |
| -------------- | ---------- |
| `/`            | Board      |
| `/jobs/[slug]` | Listing    |
| `/post`        | Post a job |
| `/search`      | Search     |
| `/faq`         | FAQ        |
| `not-found`    | 404        |

## The rules are the product

A salary range on every listing, no agencies, remote with the countries named,
and the interview process published. A board without those rules is the same
board as every other one, and the rules only work if they are enforced — about
one posting in six gets rejected on the salary rule alone.

## Grouped by craft, not ranked

`components/job-listing-board.tsx` groups by department so a designer reads
three rows instead of forty. At scale the headers do more work rather than less,
which is why this is the right shape for a whole board and not just a careers
page.

## Only one side is reading

Candidates outnumber employers by orders of magnitude and arrive from a search
for a job title, so they get the whole page. The employer section sits near the
bottom with the price in the heading — somebody who wants to post will scroll to
find it.

## Before you deploy

**Set `metadataBase` in `app/layout.tsx`.** It is `https://example.com`
right now. Next resolves every relative Open Graph image against it, so
until you change it, shared links get a broken preview.

Every string on every page is a prop with a default. Nothing here reads
from a CMS, an API or an environment variable, so search for the copy you
want to change and it will be in one file.
