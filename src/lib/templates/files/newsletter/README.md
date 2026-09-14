# Newsletter

A newsletter landing page where the archive is the argument: the hero carries the
field, the back issues sit above the testimonials, and the terms are content.

One runtime dependency — `lucide-react`.

## Run it

```bash
npm install
npm run dev
```

## Routes

| Path              | Screen  |
| ----------------- | ------- |
| `/`               | Home    |
| `/archive`        | Archive |
| `/archive/[slug]` | Issue   |
| `/about`          | About   |
| `/sponsor`        | Sponsor |
| `not-found`       | 404     |

## The archive does the selling

Nobody subscribes to a description of a newsletter. They subscribe after reading
one issue and wanting the next, so `<BlogPostGrid>` sits high on the page with
headlines specific enough to be worth clicking on their own. If your archive is
empty, this template is premature — write four issues first.

## Answer the three worries next to the form

How often, can I get out, will you sell my address. `<ProductSpecSplit>` carries
them as real content near the second signup. Measurably better than another
testimonial, and the only one of the three that is a design decision rather than
a promise is the first.

## No pricing table, on purpose

The paid tier is offered inside the emails, where a reader who already values
them can see the point. A pricing table on the landing page converts the free
signup worse and the paid one no better.

## Before you deploy

**Set `metadataBase` in `app/layout.tsx`.** It is `https://example.com`
right now. Next resolves every relative Open Graph image against it, so
until you change it, shared links get a broken preview.

Every string on every page is a prop with a default. Nothing here reads
from a CMS, an API or an environment variable, so search for the copy you
want to change and it will be in one file.
