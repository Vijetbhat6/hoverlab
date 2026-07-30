# hoverlab

Install CSS effects from the [Hoverlab](https://hoverlab.dev) catalog straight into your project — and expose the catalog to your editor's AI agent over MCP.

The catalog is 1,600+ effects written as plain CSS. Because they aren't coupled to a component framework, the same effect can be handed to you as React, Vue, Svelte, styled-components, Tailwind utilities, or raw CSS.

```bash
npx hoverlab search "pulsing teal button"
npx hoverlab add glow-pulse-teal-sm-button-0332
```

No install, no config, no dependencies.

## Commands

| Command | What it does |
| --- | --- |
| `add <id...>` | Write an effect into your project |
| `search <words...>` | Search the catalog |
| `show <id...>` | Print an effect's code without writing files |
| `categories` | List the catalog categories |
| `mcp` | Run the MCP server over stdio |

## Framework detection

`add` reads your `package.json` and picks the right output automatically:

| Found | Output |
| --- | --- |
| `styled-components` | Styled component, keyframes hoisted, root scoped to `&` |
| `svelte` / `@sveltejs/kit` | `.svelte` component with scoped styles |
| `vue` / `nuxt` | `.vue` single-file component with scoped styles |
| `react` / `next` | Self-contained function component (valid as `.jsx` or `.tsx`) |
| `tailwindcss` | Markup rewritten as utility classes |
| *(nothing)* | Plain `.css` + the markup it expects |

Override it with `--framework`:

```bash
npx hoverlab add btn-gradient --framework tailwind
```

Files land in a `hoverlab/` folder inside your existing components directory (or styles directory, for CSS output). Override with `--dir`.

## Customizing on the way in

The same four knobs the website's sliders drive are available as flags, so a recoloured effect can be installed directly rather than copied by hand:

```bash
npx hoverlab add btn-gradient --hue 40 --sat 15 --scale 1.2 --speed 1.5
```

| Flag | Range | Effect |
| --- | --- | --- |
| `--hue` | -180 to 180 | Rotate every colour around the wheel |
| `--sat` | -100 to 100 | Boost or mute colour intensity |
| `--scale` | 0.5 to 1.5 | Multiply every `px` / `rem` value |
| `--speed` | 0.25 to 3 | Multiply every animation duration |

## Editor integration (MCP)

Register the MCP server and your editor's agent can search and install effects itself — no context-switch to a website.

**Claude Code**

```bash
claude mcp add hoverlab -- npx -y hoverlab mcp
```

**Cursor, Zed, or any MCP client**

```json
{
  "mcpServers": {
    "hoverlab": {
      "command": "npx",
      "args": ["-y", "hoverlab", "mcp"]
    }
  }
}
```

The server exposes four tools:

- **`search_effects`** — free-text search over the catalog, returns metadata
- **`get_effect`** — one effect as ready-to-paste code in any supported framework
- **`install_effect`** — fetch and write the files into the project
- **`list_categories`** — the category vocabulary

Then just ask: *"find me a shimmering skeleton loader and add it to the project."*

## Tailwind output

Tailwind conversion resolves structural selectors against the effect's own markup, so `.card .title` and `span:nth-child(2)` are applied directly to the right elements, and only genuinely dynamic state survives as variants:

| Source CSS | Output |
| --- | --- |
| `.btn:hover` | `hover:` |
| `.btn::before` | `before:` |
| `.card:hover .title` | `group` on the card, `group-hover:` on the title |
| `input:checked + .track` | `peer` on the input, `peer-checked:` on the track |

Every declaration converts — common properties become real utilities, the rest use arbitrary values or arbitrary properties. `@keyframes` has no class form, so it lands in a companion `.css` file alongside the markup, as does the occasional selector Tailwind can't name (such as "peer of my ancestor"). Those cases are reported rather than silently approximated, and the original class names they depend on are preserved so the result still renders correctly.

## Programmatic use

```js
import { searchEffects, getEffect } from 'hoverlab'

const { effects } = await searchEffects({ query: 'glassmorphism card' })
const { files } = await getEffect(effects[0].id, { framework: 'react' })
```

## Configuration

| Variable | Purpose |
| --- | --- |
| `HOVERLAB_API_URL` | Point at a different deployment (default `https://hoverlab.dev`) |
| `NO_COLOR` | Disable coloured output |

## Requirements

Node 18.17 or newer.

## License

MIT
