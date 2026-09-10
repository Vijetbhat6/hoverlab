# Project Tracker

A board, a search that works across it, settings and a sign-in — plus the
two screens every internal tool needs and nobody builds: a real error
boundary and a 404.

One runtime dependency — `lucide-react`.

## Run it

```bash
npm install
npm run dev
```

## Routes

| Path             | Screen                                                |
| ---------------- | ----------------------------------------------------- |
| `/`              | Board — columns, cards, drag affordances              |
| `/search`        | Recents, applied filters, facets and results          |
| `/settings`      | Profile, team, API keys, danger zone                  |
| `/server-error`  | The 500 screen, openable as an ordinary page          |
| `not-found`      | 404                                                   |
| `error.tsx`      | The boundary Next renders when a segment throws       |

## The 500 ships twice, and both copies earn their place

`app/error.tsx` is what the framework actually renders when something
throws. It must be a client component taking `{ error, reset }`, and it
wires `reset` to the retry button — which re-renders the failed segment in
place rather than reloading the page, so the board keeps its scroll position
and anything typed elsewhere on screen survives.

`/server-error` is the same screen as an ordinary route, so you can open it,
restyle it and screenshot it without breaking the app to see it. Delete it
once the design has settled; keep `error.tsx`.

Two details in `error.tsx` worth not undoing:

- **`error.digest` goes on the screen.** It is the id Next writes into the
  server log. On the screen it turns "it broke" in a support message into
  one grep.
- **Both `detail` and `errorId` are passed as `''`, never `undefined`.** The
  block hides each section when the value is falsy, but a default parameter
  only applies to `undefined` — pass that and a real customer sees the
  block's demo stack trace and its placeholder reference id.

## Three decisions worth keeping

**Search opens on recents, because empty is the common state.** The screen
someone sees most often here is the one before they have typed anything, and
a blank panel with a cursor in it is a worse answer than the four things
they looked at yesterday.

**Facets sit beside results on a wide screen and above them on a narrow
one.** That order is deliberate on mobile: filtering happens before
scrolling, and facets underneath a list of results is a filter nobody finds.

**The board header carries the tabs, not the sidebar.** Board, Timeline and
Backlog are views of one project rather than separate destinations, and
putting them in the sidebar makes a person lose their place every time they
switch.

## Before you deploy

**This template is `noindex`.** An internal tool has no business in a search
result, and a board carries customer names in its card titles.

**Drag and drop is not wired.** The board renders columns and cards with the
affordances in place; the reordering, the persistence and the optimistic
update are yours. Pick the library after you know whether cards move between
columns or only within them — it changes the answer.

**The data is fixtures.** Each block defaults to plausible sample content so
it renders standalone. Search your app for `DEFAULT_` to find every
hard-coded array that needs replacing with a fetch.

## Layout

```
app/            routes — one folder per screen
components/     the blocks each screen is built from
```

`components/dashboard-shell.tsx` owns the sidebar, the top bar and the
scroll region; every screen renders inside it as `children`. Add a route by
adding a nav item there and a folder in `app/`.

## Making it yours

Colours and radius live in `app/globals.css`; `tailwind.config.ts` maps
them onto class names. The two files are a pair — copying one without the
other leaves everything unstyled.
