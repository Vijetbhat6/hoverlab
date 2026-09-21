# Hoverlab for Claude Code

A UI catalog your agent installs from instead of writing components from memory. This plugin gives Claude Code three things:

- **The skill.** Teaches the agent to search the catalog before hand-writing a button, loader, pricing table or hero, to install source you then own, and to read the design tokens before inventing UI.
- **The MCP server.** Runs `npx -y hoverlab mcp`, so the agent can search, read and install straight from the catalog. Needs Node 18.17 or newer.
- **Two slash commands**, listed below.

Everything is free to use. There is no account and no API key.

## Install

In Claude Code:

```shell
/plugin marketplace add Vijetbhat6/hoverlab
/plugin install hoverlab@hoverlab
```

Then run `/reload-plugins` if Claude Code says the plugin needs activating. The MCP server starts when the plugin is enabled; Claude Code asks you to approve it the first time.

## Commands

| Command | What it does |
| --- | --- |
| `/hoverlab:add <what>` | Searches the catalog for what you describe, picks the smallest piece that answers it, installs it, and tells you which files it wrote. |
| `/hoverlab:review [base branch]` | Runs `npx -y hoverlab review --base <branch>` on what your branch changes, then explains each finding: accessibility, right-to-left, motion and layout defects that are decidable from source. Defaults to the repository's default branch. |

`review` runs on your machine and uploads nothing. It reports evidence about your source, not a conformance claim.

## Not using Claude Code?

`npx hoverlab rules` writes the same guidance as rules files for Cursor, Windsurf, `AGENTS.md` and `CLAUDE.md`.

## Updating

The plugin declares a version, and Claude Code only offers an update when that version changes. It tracks the `hoverlab` npm package's version, since the MCP server is that package.

## Maintaining this plugin

`skills/hoverlab/SKILL.md` here is a copy of the one at the repository root, which is the single source of truth. Edit the root file, then run:

```bash
npx tsx scripts/check-plugin.mts --fix   # recopy
npx tsx scripts/check-plugin.mts         # verify
```

The check also fails when the plugin's version disagrees with `packages/cli/package.json`, when a manifest names a file that does not exist, or when a hand-typed catalog count appears outside the skill.
