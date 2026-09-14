# Crypto Exchange

A crypto and fintech front end: a live price rail, a public markets screen, the
custody facts, the full fee schedule and the risk warning as a section.

One runtime dependency — `lucide-react`.

## Run it

```bash
npm install
npm run dev
```

## Routes

| Path        | Screen   |
| ----------- | -------- |
| `/`         | Home     |
| `/markets`  | Markets  |
| `/security` | Security |
| `/status`   | Status   |
| `/legal`    | Legal    |
| `/login`    | Sign in  |
| `/signup`   | Sign up  |
| `not-found` | 404      |

## The risk warning is not optional

`app/page.tsx` renders it as a `<PricingValueSplit>` section, not as footer
small print. Most jurisdictions that regulate this category require a prominent
risk warning and several require it above the fold. Check what yours demands
before you move it, and do not delete it because it reads as negative — the
industry is distrusted precisely because everybody else buries it.

## Replace the compliance footer before you deploy

`<FooterCompliance>` in `app/page.tsx` is passed three fictional regions with
invented company numbers, registrations and VAT lines. Those are the fields a
regulated business is legally required to get right. Replace all three, or
remove the regions you do not operate in.

## The prices are not live

`<PriceTickerStrip>` and `<MetricSparklineCards>` take pre-formatted strings.
That is deliberate: formatting numbers during render with the server's locale
is a hydration mismatch. Format upstream where you know the user's locale, and
wire the arrays to your own socket.

## Before you deploy

**Set `metadataBase` in `app/layout.tsx`.** It is `https://example.com`
right now. Next resolves every relative Open Graph image against it, so
until you change it, shared links get a broken preview.

Every string on every page is a prop with a default. Nothing here reads
from a CMS, an API or an environment variable, so search for the copy you
want to change and it will be in one file.
