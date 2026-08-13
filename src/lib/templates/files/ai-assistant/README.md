# AI Assistant

An agent product's working surface: the assistant screen — transcript,
reasoning, tool calls and the one card that can act — plus sign-in,
settings and a 404. The blocks are the layout and state patterns; wiring
them to a model is your half.

One runtime dependency — `lucide-react`.

## Run it

```bash
npm install
npm run dev
```

## Routes

| Path        | Screen                                            |
| ----------- | ------------------------------------------------- |
| `/`         | Assistant — transcript, reasoning, approval card  |
| `/settings` | Account settings inside the same shell            |
| `/login`    | Sign in, nothing else on the page                 |
| `not-found` | 404, with the app chrome kept in place            |

## Wiring a real model

Every AI block renders fixed demo state on purpose: a streaming answer,
an expanded reasoning trace, a pending approval. Each one takes its
content as props, so the integration point is always the same — hold the
conversation in your own state (a reducer, a store, an SDK's hook), map
it to props, and replace the demo data. The blocks never fetch; that is
what keeps them portable across providers.

The approval card is the piece to keep honest: it renders *before* the
action runs, and the "Approve" handler is where your tool execution
belongs. An agent UI that executes first and renders the card after is
theater, and users can tell.

## Before you deploy

**This template ships `noindex`.** A signed-in workspace has no business
in a search result; if you later add public marketing routes, move the
`robots` override off the root layout and onto the private segment.

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
