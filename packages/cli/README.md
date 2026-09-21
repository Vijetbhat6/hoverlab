# hoverlab

Install UI from the [Hoverlab](https://hoverlab5.netlify.app) catalog straight into your project — and expose the catalog to your editor's AI agent over MCP.

```bash
npx hoverlab search checkout          # every tier at once
npx hoverlab add checkout-form        # one section
npx hoverlab init storefront ./shop   # a whole project
```

No install, no config, no dependencies.

## Five tiers

The catalog is a ladder, and the CLI reaches every rung. You type an id; which tier it belongs to is worked out for you.

| Tier | What it is | Install with |
| --- | --- | --- |
| **effect** | One element — a button hover, a loader, a skeleton. Plain CSS. | `add` |
| **primitive** | One control — a segmented control, a combobox, an input group, a field wrapper. A single React + Tailwind file, usually with no dependencies. | `add` |
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
Install lucide-react with pnpm? [Y/n]
```

## Commands

| Command | What it does |
| --- | --- |
| `add <id...>` | Write an effect, primitive, block or page into your project, and offer to install the packages it needs |
| `remove <id...>` | Take an installed artifact back out — only files still exactly as installed, that nothing else imports and no other artifact shares (aliases: `rm`, `uninstall`) |
| `init [template] [dir]` | Scaffold a template into a new directory. With no template, lists them. |
| `doctor` | Check the project can run Hoverlab code: Tailwind version and colour mapping, the `@/` alias, React, `components.json`, what is installed |
| `search <words...>` | Search every tier at once (`--level` to narrow) |
| `show <id...>` | Print an artifact's code without writing files |
| `categories` | List the categories, per tier |
| `outdated` | List installed artifacts the catalog has since changed |
| `diff <id...>` | Show what changed between your copy and the catalog |
| `update [id...]` | Apply the catalog's newer copy — only to files you have not edited since installing them |
| `review [path...]` | Review your components for design defects. With no paths, reviews what you changed. |
| `rules [target...]` | Write agent rules files for Cursor, Windsurf, Claude Code and `AGENTS.md`-aware tools |
| `skill [id]` | Install an agent skill into `.claude/skills`. With no id, lists them. |
| `dna [id]` | Print the Design DNA — tokens, shape, motion, rules — for pasting into an AI tool |
| `login <key>` / `logout` / `whoami` | Manage the licence key for the Pro templates |
| `mcp` | Run the MCP server over stdio |

## Scaffolding a project

```bash
npx hoverlab init            # list the templates
npx hoverlab init storefront ./shop
cd shop && npm install && npm run dev    # or pnpm / yarn / bun — it prints yours
```

## Your project, read before anything is written

The CLI looks at the project it is standing in and adapts instead of assuming.

**Package manager.** From the `packageManager` field, then the nearest lockfile (searched upward, so a workspace root counts), then whatever launched the CLI (`pnpm dlx hoverlab` says pnpm). Install hints and `init`'s next steps use it: `pnpm add lucide-react`, not a hard-coded `npm i`.

**Installing what an artifact needs.** After `add`, missing packages are collected into one line. At a terminal you are asked once. Anywhere else — a pipe, CI, an agent's shell — nothing is installed and the command is printed. `--yes` (`-y`) answers for you, and `--no-install` never asks:

```bash
npx hoverlab add pricing-tiers faq-accordion --yes
```

**Tailwind v3 or v4.** Read from what is installed, then `package.json`, then a `@tailwindcss/*` plugin or a `tailwind.config.*`. The two differ in where `bg-primary` gets its meaning — a `@theme` block in v4, `theme.extend.colors` in v3 — and a block installed into a project that maps neither renders as unstyled boxes with no error anywhere. `add` says so, and `doctor` names the fix.

**`components.json` and the `@/*` alias.** Every page imports `@/components/<block>`, so blocks and pages are rooted at the directory `@/*` points at in your `tsconfig.json` (or `tsconfig.app.json`, as Vite scaffolds put it) rather than guessed from whether a `src/` folder exists. If there is no such alias, the install says so and gives the line to add. A `components.json` is read for its stylesheet path and component alias; it is never written.

```bash
npx hoverlab doctor           # what an install will trip on, each with the line that fixes it
npx hoverlab doctor --json    # the same, for a script
```

Only two things make `doctor` exit non-zero: no `package.json` to install into, and a Node too old to run the CLI. A project without React or Tailwind is a warning, because effects still work there.

## Removing what you installed

`add` records every file and a hash of it in `hoverlab.lock.json`. `remove` uses that record to prove a file is still exactly what was installed before it deletes it, and keeps and names everything else:

| Kept because | Meaning |
| --- | --- |
| edited | The file changed since install — it is yours now |
| shared | Another installed artifact lists it (a page brings its blocks; the same block installed on its own is not the page's to delete) |
| in use | Something outside the removal imports it |

```bash
npx hoverlab remove pricing-tiers --dry-run   # the plan, nothing changed
npx hoverlab remove pricing-tiers             # asks once, at a terminal
npx hoverlab remove pricing-tiers --yes       # in a script
```

Without a terminal and without `--yes`, nothing is deleted and the exit code is 1. `--force` overrides *edited* and *in use*, never *shared*. Packages the artifact needed stay in `package.json` — the lockfile does not record which dependency a block brought, and `lucide-react` is probably yours by now.

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

## Reviewing your own code

`hoverlab review` checks components for the class of design defect that survives code review because it is invisible to the person writing it — and in most cases invisible to everyone on the team, because nobody is testing the site in Arabic, with a screen reader, on a phone, with reduced motion switched on.

```bash
npx hoverlab review                 # what you have changed
npx hoverlab review --base main     # what your branch proposes
npx hoverlab review src/components  # a directory, in full
npx hoverlab review --fix           # apply the rewrites that need no judgement
```

It runs entirely on your machine. No account, no key, nothing uploaded — the rules are in the package you just installed.

### What it looks for

| Family | Examples |
| --- | --- |
| **Accessibility** | 18 rules over 10 WCAG 2.2 AA criteria that can be decided from source: an icon-only button with no accessible name, `<label htmlFor>` pointing at an id nothing has, a password field that blocks paste, `aria-hidden` on something a keyboard can still reach |
| **Right-to-left** | `pl-4` and friends, which stay on the left in Arabic, Hebrew, Farsi and Urdu; an `<ArrowRight>` beside "Next" that keeps pointing away from next; a `translate-x` that slides a switch knob out of its own track |
| **Motion** | An animation that runs forever with no `motion-safe:` or `motion-reduce:` route out |
| **Layout** | `sr-only` text inside a horizontal scroller that is not positioned — it escapes, and scrolls the whole page sideways on a phone, pointing at nothing anyone can see |

These are the checks that run over the Hoverlab catalog's own components on every build. That is the reason they are worth pointing at your code rather than a rule list assembled from a spec: every one has been run over hundreds of real components, and the ones that turned out to be only *nearly* right were deleted rather than kept. A rule that is nearly right produces confident, specific, wrong findings, and one of those teaches you to skim the other forty.

### Violations and advisories

A **violation** means the rule is confident and the thing is broken. Violations set a non-zero exit code.

An **advisory** is a question the rule cannot close from source. A 20×20px tap target might pass 2.5.8 by the spacing exception, and spacing is a rendered property. A `left-6` might be a search icon that should follow the text, or a blurred glow in a corner that is lighting rather than layout. A `draggable` handle might have a keyboard alternative three components away. Advisories never fail a run — a reviewer that blocks a merge on a question is a reviewer that gets switched off, and then the violations go unread too.

`--violations-only` drops them.

### On a pull request

The GitHub Action in [`packages/review-action`](https://github.com/Vijetbhat6/hoverlab/tree/main/packages/review-action) posts **one comment and edits it in place** on every push, annotates the diff, and fails the check on violations. It handles shallow checkouts itself and does not fail on fork PRs, where the token cannot write:

```yaml
permissions:
  contents: read
  pull-requests: write
steps:
  - uses: actions/checkout@v4
    with:
      fetch-depth: 0
  - uses: Vijetbhat6/hoverlab/packages/review-action@main
```

Pin a tag once one exists. Nothing is uploaded: the review runs on the runner.

Without the Action, two formats are available, and both need the merge base in history:

- `--format github` emits workflow commands, which the runner turns into annotations on the diff itself, so a finding lands on the line that caused it.
- `--format markdown` prints a comment body whose first line is a hidden marker, always — even when clean — so a poster can find its previous comment and replace it rather than add another.

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0            # review needs the merge base
- run: npx hoverlab review --base origin/${{ github.base_ref }} --format github
```

`--format json` is the machine form, with the list of what was never checked.

By default only findings the change is responsible for are reported — the files the diff touched, and within them the findings on or beside a touched line. Pointed at a mature repository with that filter off, these rules will return hundreds of findings that all predate the pull request, which is a backlog rather than a review. `--all-lines` turns the filter off when you want it.

`--base` measures from the merge base rather than the tip of the base branch, so commits other people landed while your branch was open are not reported as yours.

### `--fix`

Only the physical-to-logical spacing codemod is applied: `pl-4` → `ps-4`, `text-right` → `text-end`, `rounded-tl-lg` → `rounded-ss-lg` and the rest of that set. Those have exactly one correct answer and no effect left-to-right.

Nothing else is rewritten, and the restraint is deliberate. Everything else here is either a judgement call or has more than one correct shape — an infinite animation wants *stopping* if it is decorative and *slowing* if it is a status spinner, and a fixer that guesses wrong writes a stopped spinner next to "Signing in", which reads as a hung request. The finding says which is which; you decide.

### What it cannot see

A large share of WCAG AA is not decidable without rendering, without resolved colour, or without a human: contrast, focus order, reflow, reading order, and whether help is in the same place across a site. `--json` lists every one of them with the reason it is out of reach.

That list ships with every report on purpose. A tool that reports what passed and stays silent about what it never looked at reads as full coverage, and that silence is the part that misleads. `hoverlab review` produces evidence about your source. It is not a conformance claim and cannot be used as one.

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

The server speaks all three MCP primitives.

**Tools.** These cover the whole catalog:

- **`search_catalog`** — free-text search across all five tiers at once
- **`get_kit`** — a ready-made list of ids for a kind of product, instead of a search the agent has to assemble
- **`match_design`** — rank blocks and pages against a described design region (a Figma frame, a screenshot, a spec)
- **`install_artifact`** — fetch an effect, primitive, block or page and write it into the project
- **`init_template`** — scaffold a whole project from a template
- **`get_design_dna`** — hand the agent the design system before it writes UI of its own
- **`review_code`** — check code for accessibility, right-to-left, reduced-motion and overflow defects: on source the agent has not saved yet (`source`), on named files (`paths`, kept inside the project), or on what git says changed (`base`). Read-only and local; nothing is uploaded. The agent is told to run it before it says UI work is done.

And four are the original effect-only surface, kept because they carry the framework and recolouring knobs: **`search_effects`**, **`get_effect`**, **`install_effect`**, **`list_categories`**.

Every tool carries a title and honest annotations — `readOnlyHint`, `destructiveHint`, `openWorldHint` — which is what clients grant permission by. The three that write files (`install_effect`, `install_artifact`, `init_template`) say so, and say they can overwrite behind `force`.

**Resources** — what you can `@`-attach rather than hope the agent remembers to fetch. `hoverlab://dna` is the design system; `hoverlab://kits` lists the kits; the published skills appear as `hoverlab://skill/<id>`; and templates cover `hoverlab://artifact/<id>`, `hoverlab://dna/<id>` and `hoverlab://kit/<slug>`.

**Prompts** — the workflows written once by the people who know the tool order, shown as slash commands in clients that support them: `add-section`, `build-from-design`, `scaffold-project`, `review-changes`.

Then just ask: *"find me a shimmering skeleton loader and add it"*, or *"build me a storefront"*.

The server is stdio only — it runs on your machine, on demand, from `npx`. There is no hosted endpoint. It is listed for the [MCP registry](https://registry.modelcontextprotocol.io) by [`server.json`](./server.json) as `io.github.Vijetbhat6/hoverlab`.

### Rules files, for editors that do not read skills

```bash
npx hoverlab rules              # the tools you appear to use (.cursor/, .windsurf/, AGENTS.md, CLAUDE.md)
npx hoverlab rules cursor windsurf
npx hoverlab rules all --check  # in CI: exit 1 if a file is missing or stale
npx hoverlab rules --remove
```

| Target | File | Notes |
| --- | --- | --- |
| `cursor` | `.cursor/rules/hoverlab.mdc` | Applied when the request is about UI, not when a `.tsx` file happens to be open |
| `windsurf` | `.windsurf/rules/hoverlab.md` | Kept under Windsurf's per-file size limit; sections dropped to fit are reported |
| `agents` | `AGENTS.md` | Read by Codex, Cursor, Copilot, Zed and others |
| `claude` | `CLAUDE.md` | |

They are generated from the same published skill `hoverlab skill` installs, so there is one source for what an agent is told. In `AGENTS.md` and `CLAUDE.md` your own text is never touched: only the section between `<!-- hoverlab:start -->` and `<!-- hoverlab:end -->` is written, and running it twice changes nothing. The copy is a snapshot, so re-run it — or use `--check` in CI — when the catalog moves.

### Claude Code plugin

The repository is also a Claude Code plugin marketplace: `/plugin marketplace add Vijetbhat6/hoverlab`, then `/plugin install hoverlab@hoverlab`. It bundles the MCP server, the skill, and `/hoverlab:review` and `/hoverlab:add`.

### Teaching the agent

MCP gives an agent the tools; a skill gives it the judgement about when to reach for them. Install one and it stops hand-rolling components the catalog already has:

```bash
npx hoverlab skill hoverlab
```

That writes `.claude/skills/hoverlab/SKILL.md` — plain markdown, so any agent that reads a file can use it. `npx hoverlab skill` lists what is available; all of them are free.

### Design DNA

When there is genuinely nothing in the catalog and the agent has to write a component itself, it should still build against the same design system:

```bash
npx hoverlab dna                     # the whole system
npx hoverlab dna saas-starter        # as that template uses it
npx hoverlab dna --brand indigo --out design-dna.md
```

Colour tokens for both themes, radius, spacing, motion and the rules that keep generated UI consistent — plus the command that installs the real source. Agents get the same document from `get_design_dna`.

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
| `HOVERLAB_API_URL` | Point at a different deployment (default `https://hoverlab5.netlify.app`) |
| `HOVERLAB_KEY` | Licence key for the Pro templates, e.g. in CI. Everything else installs without one |
| `HOVERLAB_NO_TELEMETRY` | Set to `1` to stop reporting installed ids, which is what feeds Trending. Nothing else is sent |
| `NO_COLOR` | Disable coloured output |
| `CI` | When set, nothing is ever prompted for, whatever the terminal |

`hoverlab.config.json` in your project carries your brand (the design system export at `/design-system` writes one), and effects are hue-rotated to match. `hoverlab.lock.json` records what `add` wrote; commit it.

## Requirements

Node 18.17 or newer.

## License

MIT
