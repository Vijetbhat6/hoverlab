# hoverlab

Install UI from the [Hoverlab](https://hoverlab.dev) catalog straight into your project — and expose the catalog to your editor's AI agent over MCP.

```bash
npx hoverlab search checkout          # every tier at once
npx hoverlab add checkout-form        # one section
npx hoverlab init storefront ./shop   # a whole project
```

No install, no config, no dependencies.

## Four tiers

The catalog is a ladder, and the CLI reaches every rung. You type an id; which tier it belongs to is worked out for you.

| Tier | What it is | Install with |
| --- | --- | --- |
| **effect** | One element — a button hover, a loader, a skeleton. Plain CSS. | `add` |
| **block** | One complete section — a pricing table, a checkout form, a sortable data table. React + Tailwind. | `add` |
| **page** | One composed screen, assembled from blocks. | `add` |
| **template** | A whole runnable Next.js project — routing, layout, theme tokens, every page. | `init` |

Effects are written as plain CSS, so the same effect can be handed to you as React, Vue, Svelte, styled-components, Tailwind utilities, or raw CSS. Blocks and above are React and ship as written — a machine translation of three hundred lines of hooks and event handlers would be a worse component claiming to be the same one.

Adding a page brings the blocks it is built from, so the result compiles instead of leaving broken imports:

```
$ npx hoverlab add checkout-page
✓ Added Checkout (checkout-page) as page
  → rooted at src/, since the project has src/app
  includes 2 blocks: checkout-form, order-summary-panel
  src/app/checkout-page.tsx
  src/components/checkout-form.tsx
  src/components/order-summary-panel.tsx
  ! npm i lucide-react
```

## Commands

| Command | What it does |
| --- | --- |
| `add <id...>` | Write an effect, block or page into your project |
| `init [template] [dir]` | Scaffold a template into a new directory. With no template, lists them. |
| `search <words...>` | Search every tier at once (`--level` to narrow) |
| `show <id...>` | Print an artifact's code without writing files |
| `categories` | List the categories, per tier |
| `mcp` | Run the MCP server over stdio |

## Scaffolding a project

```bash
npx hoverlab init            # list the templates
npx hoverlab init storefront ./shop
cd shop && npm install && npm run dev
```

`init` refuses to write into a directory that already has files in it unless you pass `--force`, so it cannot land on top of an existing project. A directory holding nothing but `.git` counts as empty — `git init` first is a normal thing to do.

## Where files land

| Tier | Destination |
| --- | --- |
| effect | A `hoverlab/` folder inside your existing components directory (or styles directory, for CSS output) |
| block, page | Their own paths — `components/x.tsx`, `app/y.tsx` — rooted at your project, or at `src/` if you use that layout |
| template | A new directory named after the template, or the one you name |

Those block paths are not a suggestion: every page source imports `@/components/<block-id>`, so flattening them would break the imports. `--dir` overrides the root in all three cases.

## Framework detection

For effects, `add` reads your `package.json` and picks the right output automatically:

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

## Customizing on the way in

Effects only. The same four knobs the website's sliders drive are available as flags, so a recoloured effect can be installed directly rather than copied by hand:

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

Register the MCP server and your editor's agent can search and install from the catalog itself — no context-switch to a website.

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

The server exposes eight tools. Four cover the whole catalog:

- **`search_catalog`** — free-text search across all four tiers at once
- **`match_design`** — rank blocks and pages against a described design region (a Figma frame, a screenshot, a spec)
- **`install_artifact`** — fetch an effect, block or page and write it into the project
- **`init_template`** — scaffold a whole project from a template

And four are the original effect-only surface, kept because they carry the framework and recolouring knobs:

- **`search_effects`**, **`get_effect`**, **`install_effect`**, **`list_categories`**

Then just ask: *"find me a shimmering skeleton loader and add it"*, or *"build me a storefront"*.

### Pairing with Figma

Register Figma's Dev Mode MCP server (enable it in the Figma desktop app's preferences) next to Hoverlab's:

```bash
claude mcp add --transport http figma http://127.0.0.1:3845/mcp
claude mcp add hoverlab -- npx -y hoverlab mcp
```

Then select a frame and ask: *"rebuild my selected Figma frame — find the closest Hoverlab blocks, install them, and match my colours and type"*. The agent reads the frame's structure from Figma, calls `match_design` per region — it translates designer vocabulary ("navbar", "modal", "plan cards") and ranks partial matches, where plain search requires every word to hit — installs the winners, and restyles the plain React + Tailwind it installed to the design's tokens. No Figma needed, strictly: a pasted screenshot or a written spec drives `match_design` just as well.

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
import { searchAll, searchLevel, getArtifact, addArtifact, initTemplate } from 'hoverlab'

// Every tier at once
const { results } = await searchAll({ query: 'checkout' })

// One tier
const { items } = await searchLevel({ level: 'block', query: 'pricing' })

// One artifact, whichever tier it is on
const data = await getArtifact('checkout-page', { deep: true })

// Or write it straight to disk
await addArtifact({ id: 'pricing-tiers' })
await initTemplate({ id: 'storefront', directory: './shop' })
```

The effect-only helpers (`searchEffects`, `getEffect`, `writeEffectFiles`) are still exported unchanged.

## Configuration

| Variable | Purpose |
| --- | --- |
| `HOVERLAB_API_URL` | Point at a different deployment (default `https://hoverlab.dev`) |
| `NO_COLOR` | Disable coloured output |

## Requirements

Node 18.17 or newer.

## License

MIT
