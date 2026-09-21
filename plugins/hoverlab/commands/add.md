---
description: Find a UI piece in the Hoverlab catalog and install it into this project
argument-hint: "<what you want, e.g. pricing table>"
allowed-tools: Bash(npx -y hoverlab search *) Bash(npx -y hoverlab show *) Bash(npx -y hoverlab add *) Read Glob
disable-model-invocation: true
---

Add this to the project from the Hoverlab catalog: $ARGUMENTS

If that is empty, ask what the user wants and stop.

## Search first

```bash
npx -y hoverlab search "<what the user asked for>"
```

This searches every rung at once. Rungs, smallest first: `effect` (one element, plain CSS), `block` (one section, React and Tailwind), `page` (a composed screen), `template` (a whole project).

If nothing fits, search again with different words, twice at most. If nothing fits after that, tell the user, and do not install something merely close.

## Choose the smallest thing that answers the request

- One button, loader or glow: an `effect`.
- A pricing table, FAQ, form or data table: a `block`.
- A whole screen: a `page` (its blocks come with it).
- A whole new app: a `template`. That scaffolds a directory with `npx -y hoverlab init <id> <dir>`, which is outside this command's pre-approved tools. Confirm the directory with the user first.

When two or three entries fit, show them and let the user choose. Use `npx -y hoverlab show <id>` to print one without writing anything.

## Install

```bash
npx -y hoverlab add <id> [<id> ...]
```

Effects can be recoloured with `--hue`, `--sat`, `--scale` and `--speed`. Prefer those to editing hex codes by hand.

## Then

- List the ids you installed and the files that were written.
- Blocks and pages style themselves with semantic classes such as `bg-card` and `text-muted-foreground`. If one looks unstyled, the project is missing those CSS variables or the Tailwind colour mapping; the block is not at fault.
- Check both light and dark before calling it done.
- Hoverlab supplies the interface layer only. Wiring data, auth and state is left to you.
