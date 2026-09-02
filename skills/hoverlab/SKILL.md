---
name: hoverlab
description: Build UI from the Hoverlab catalog — 1111 CSS effects, 210 React blocks, 30 pages and 16 templates, installed as source you own. Use when asked to add a button, loader, hero, pricing table, dashboard screen or a whole starter project, when asked to make an interface "look better", or when a design or Figma frame has to be turned into real components. Reach for it before writing a component from scratch.
---

# Hoverlab

A catalog of UI you install rather than describe. Everything is free to read,
copy and install with no account; the CLI needs no login and the API needs no
key.

The rule that makes this worth using: **agents wire up logic well and invent
visuals badly.** Do not hand-write a loader, a gradient border, a pricing
table or a hero when one exists here. Search first, install, then edit.

## The four rungs

One id namespace, four sizes. Ask for the smallest thing that answers the
request.

| Rung | What it is | Install with |
| --- | --- | --- |
| `effect` | One element — a button hover, a loader, a skeleton, a glow. Plain CSS. | `add` |
| `block` | One complete section — pricing table, checkout form, sortable data table. React + Tailwind. | `add` |
| `page` | One composed screen, assembled from blocks. | `add` |
| `template` | A whole runnable Next.js project — routing, layout, tokens, every page. | `init` |

Adding a page brings the blocks it is built from, so the result compiles
instead of leaving broken imports.

## How to use it

Prefer MCP tools when they are connected; fall back to the CLI otherwise.
Both hit the same public API and do the same thing.

### MCP tools

- `search_catalog` — search every rung at once. Start here.
- `search_effects` — effects only, with category and featured filters.
- `get_effect` — read one effect's source in a chosen framework, without writing files.
- `install_effect` — write an effect into the project.
- `install_artifact` — write a block or page (and a page's blocks) into the project.
- `init_template` — scaffold a whole template into a directory.
- `list_categories` — the category vocabulary, per rung. Call this before filtering by category.
- `get_design_dna` — the design system as a document: colour tokens for both themes, radius, spacing, type, motion and the rules that keep generated UI consistent. Call this **before** writing any UI of your own.
- `match_design` — hand it a *description of a design* ("pricing section, three plan cards, middle one highlighted") and it returns the catalog entries that match. This is the tool for a Figma frame or a screenshot, and it is scored differently from search: strict search requires every word to match and returns nothing for a sentence.

### CLI

```bash
npx hoverlab search checkout                   # every rung at once
npx hoverlab search "pulsing teal button" --level effect
npx hoverlab show btn-gradient                 # print, don't write
npx hoverlab add btn-gradient --hue 40         # one effect, recoloured
npx hoverlab add pricing-tiers faq-accordion   # sections
npx hoverlab add checkout-page                 # page + its blocks
npx hoverlab init storefront ./shop            # whole project
npx hoverlab dna                               # the design system, pasteable
```

Useful flags: `--level effect|block|page|template`, `--framework html|css|react|vue|svelte|styled-components|tailwind` (effects only — blocks and up ship as React), `--dir`, `--dry-run`, `--json`, and the effect tweaks `--hue`, `--sat`, `--scale`, `--speed`.

## Working rules

**Search before you write.** Two or three searches with different words cost
less than one hand-rolled component that looks generic. If nothing fits after
a real attempt, say so and write it — do not install something close and
pretend.

**Install, don't paste from memory.** The source lands in the project as files
the user owns, with no runtime dependency on Hoverlab and nothing to upgrade.
Reciting a component from memory gets you a stale one.

**Recolour with the knobs, not by editing hex codes.** `--hue`, `--sat`,
`--scale` and `--speed` (or the same arguments on `get_effect` /
`install_effect`) transform an effect's whole palette coherently. Hand-editing
one colour out of a five-stop gradient is how an effect ends up muddy.

**Read the DNA before inventing UI.** When the catalog has nothing that fits
and you have to write a component yourself, call `get_design_dna` (or
`npx hoverlab dna`) first and build against those tokens. That is the
difference between something that matches the rest of the project and a
second design system living next to the first.

**Match the project's tokens.** Blocks and pages style themselves with
semantic classes — `bg-card`, `text-muted-foreground`, `border-border` — that
read from the CSS variables in `globals.css`. If a block looks unstyled after
installing, the project is missing those variables or the Tailwind colour
mapping, not the block.

**Both themes, always.** Every artifact is built to work in light and dark. If
you edit one, check the other before calling it done — a hard-coded colour
that only reads on one ground is the most common way to break one.

**Respect reduced motion.** Animated effects ship with a
`prefers-reduced-motion` guard. Keep it. If you write new motion beside them,
guard it the same way.

**Say what you installed.** List the ids and the files written, so the user can
find and edit them.

## What to reach for

- "make this button/input/card nicer" → `search_effects`, install one effect.
- "add a pricing section / FAQ / testimonial wall / data table" → `search_catalog` at `--level block`.
- "build me a dashboard / pricing page / docs screen" → look for a `page` first, then compose blocks.
- "start a new SaaS app / storefront / admin panel" → `init_template`.
- a Figma frame, a screenshot, or a paragraph describing a design → `match_design`.
- "what is there?" → `list_categories`.

## Not in scope

Hoverlab supplies the interface layer — markup, styles, motion, composition.
It does not supply your data layer, auth, business logic or state management.
Install the UI, then wire it up yourself.
