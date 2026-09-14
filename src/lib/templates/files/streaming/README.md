# Streaming

A subscription video service: catalogue rails, a real watch screen with chapters
and a transcript, one plan at one price, and the account behind it.

One runtime dependency — `lucide-react`.

## Run it

```bash
npm install
npm run dev
```

## Routes

| Path            | Screen  |
| --------------- | ------- |
| `/`             | Home    |
| `/watch/[slug]` | Watch   |
| `/plans`        | Plans   |
| `/login`        | Sign in |
| `/account`      | Account |
| `not-found`     | 404     |

## The player ships no playback, deliberately

`components/video-player-shell.tsx` is furniture: a ratio-locked stage, a
control bar with every state drawn including the buffered layer, the metadata
row and the up-next rail. Every streaming product wires playback differently —
HLS or DASH, a DRM licence round-trip, an ad break that pauses the timeline — so
picking one would be wrong for everyone and would drag a large dependency into a
project whose whole claim is one runtime dependency.

Drop a `video` element into the stage and point your player's state at the
props.

## The scrubber is a progressbar, not a slider

A `role="slider"` that does not move promises arrow keys that do nothing. As a
shell it reports position and stops there. When you wire real seeking, promote
it to a slider **and** implement the keys — both, or neither.

## The stage is dark in both themes

A player is a cinema: the surround stays black so nothing competes with the
picture. That is why the stage does not follow the palette, and it is what every
streaming product ships.

## Before you deploy

**Set `metadataBase` in `app/layout.tsx`.** It is `https://example.com`
right now. Next resolves every relative Open Graph image against it, so
until you change it, shared links get a broken preview.

Every string on every page is a prop with a default. Nothing here reads
from a CMS, an API or an environment variable, so search for the copy you
want to change and it will be in one file.
