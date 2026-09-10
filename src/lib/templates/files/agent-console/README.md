# Agent Console

The operator's half of an agent product. The approval queue it opens on, a
run trace that shows reasoning, tool calls, retries and cost in the order
you would debug them, and the chat surface behind both.

One runtime dependency — `lucide-react`.

## Run it

```bash
npm install
npm run dev
```

## Routes

| Path         | Screen                                                    |
| ------------ | --------------------------------------------------------- |
| `/`          | Approvals — queue, escalations, and the policies behind them |
| `/runs/[id]` | Run detail — thinking, tool calls, retries, cost           |
| `/chat`      | The assistant surface, with sources and insights           |
| `/settings`  | Profile, team, API keys, danger zone                       |
| `/login`     | Sign in                                                    |
| `not-found`  | 404                                                        |

## Three decisions worth keeping

**The queue is home, not the run list.** An operator opens this product to
find what is waiting on *them*. A list of runs is what they consult after
answering that question, which is why the trace lives under a dynamic
segment reached from the queue rather than at the root.

**The policies are at the bottom of the approvals screen, not on their own
page.** Every time somebody approves something they are asking, silently,
"why is this even in front of me". The rule that routed it there is the
answer, and it costs one scroll instead of one navigation.

**The run trace is ordered for debugging, not for reading.** Intent, then
actions, then failures, then cost. The natural instinct is to lead with the
cost summary because it is the smallest thing on the page; do that and
everyone scrolls past the reason the run went wrong to reach it.

## Wiring it up

`/runs/[id]` is a real dynamic segment. In your project the page reads
`params`, fetches the run and passes it down as props — the blocks all take
their data as props and default to fixtures only so they render standalone.

Streaming is the part that will not be a drop-in. The trace and the chat
answer both render a finished state; a live run needs an event source and a
reducer, and the shape of that depends on your runtime. Render the finished
state first and stream into it — starting from a streaming component and
trying to get the static case out of it is the harder direction.

## Before you deploy

**This template is `noindex`.** Run traces contain prompts, and prompts
contain whatever a customer pasted into them. A trace in a search index is a
disclosure of somebody else's data, not of yours.

**An approval UI is not an approval system.** Approving here changes local
state. The check that a given person may approve a given action belongs on
the server, and it has to be the same check whether the request arrives from
this screen or from your API.

**Cost figures need a source.** The breakdown reads as authoritative because
it is itemised. Point it at real token accounting before anybody makes a
budget decision from it.

**The data is fixtures.** Each block defaults to plausible sample content so
it renders standalone. Search your app for `DEFAULT_` to find every
hard-coded array that needs replacing with a fetch.

## Layout

```
app/            routes — one folder per screen
components/     the blocks each screen is built from
```

`components/dashboard-shell.tsx` owns the sidebar and the scroll region for
the chat surface. Add a route by adding a nav item there and a folder in
`app/`.

## Making it yours

Colours and radius live in `app/globals.css`; `tailwind.config.ts` maps
them onto class names. The two files are a pair — copying one without the
other leaves everything unstyled.
