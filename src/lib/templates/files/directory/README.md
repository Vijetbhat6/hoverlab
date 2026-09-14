# Directory

A faceted index with a listing page that compares each entry against its
alternatives, a paid submission route, and a published removal rate.

One runtime dependency — `lucide-react`.

## Run it

```bash
npm install
npm run dev
```

## Routes

| Path              | Screen  |
| ----------------- | ------- |
| `/`               | Index   |
| `/listing/[slug]` | Listing |
| `/search`         | Search  |
| `/submit`         | Submit  |
| `/about`          | About   |
| `not-found`       | 404     |

## Facet by what buyers filter on

Pricing model, hosting and compliance. Category is the facet every directory
leads with and nobody uses, because the reader already knows the category — it
is why they are here. Categories are a navigation section further down instead.

## Publish the removal rate

Freshness and independence are the only things separating a useful directory
from a link farm, and both are claims that can be checked. The band on the index
page carries when the index was last rechecked, how many entries were removed
last month, and how many placements are paid. A directory that only ever grows
is not maintained.

## No affiliate links

The listing page compares each entry against the two obvious alternatives,
which is against the vendor's interest and exactly in the reader's. That is only
credible while there is no buy button, so there is not one.

## Before you deploy

**Set `metadataBase` in `app/layout.tsx`.** It is `https://example.com`
right now. Next resolves every relative Open Graph image against it, so
until you change it, shared links get a broken preview.

Every string on every page is a prop with a default. Nothing here reads
from a CMS, an API or an environment variable, so search for the copy you
want to change and it will be in one file.
