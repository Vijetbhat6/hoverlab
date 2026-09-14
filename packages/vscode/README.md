# Hoverlab for VS Code

Search and install UI from the [Hoverlab catalog](https://hoverlab-xak9.vercel.app) without leaving the editor — and hand the whole catalog to your agent with nothing to configure.

Works in **VS Code**, **Cursor** and **Windsurf**.

## What it does

**A sidebar over the whole catalog.** Five tiers — effects, primitives, blocks, pages, templates — grouped by category, with the id on every row, because the id is what every other surface takes.

**One search across all five.** `Hoverlab: Search catalog` in the palette. Results come from the server, so they match on tags and descriptions the row does not show; a search for "pricing" finds `plan-comparison`.

**A real preview.** Clicking a primitive, block or page frames the same chrome-less render the website's own responsive preview uses. It is the actual component with the actual stylesheet — not a re-rendered copy that can drift from the source you are about to paste.

**Install into the project you are in.** The install action runs the same writer `npx hoverlab add` runs, so the file lands where the CLI would have put it, a page brings the blocks it imports, and an existing file is never clobbered without being named first.

**The MCP server, already configured.** This is the part worth installing it for. The catalog has had an MCP server for a while, and using it meant hand-editing a JSON file in a per-editor location — the step where most people stopped. The extension contributes the server, so agent mode gets `search_catalog`, `install_artifact`, `get_kit`, `match_design`, `init_template` and `get_design_dna` over all five tiers with nothing typed.

## Commands

| Command | What it does |
| --- | --- |
| `Hoverlab: Search catalog` | Live search across all five tiers |
| `Hoverlab: Install into this project` | Write the artifact into a workspace folder |
| `Hoverlab: Preview` | The real component, in a tab beside your code |
| `Hoverlab: Copy source` | Open it as untitled files and copy the first |
| `Hoverlab: Copy install command` | `npx hoverlab add <id>` |
| `Hoverlab: Open on hoverlab.dev` | The detail page, with the props table and the markup formats |
| `Hoverlab: Open the page builder` | `/builder`, in a browser — see below |
| `Hoverlab: Set licence key` | For the Pro templates. Nothing else needs one |

## Settings

| Setting | Default | What it is for |
| --- | --- | --- |
| `hoverlab.apiUrl` | *(empty)* | Read the catalog from a preview deployment or `http://localhost:3000`. **Needs a window reload** — see below |
| `hoverlab.framework` | `auto` | Output target for *effects*. `auto` reads it off the project's dependencies |
| `hoverlab.registerMcpServer` | `true` | Offer the MCP server to agent mode |

## The honest limits

**No account, no wall, no telemetry.** The catalog is readable without a key and this extension does not change that. The licence commands exist because the Pro templates need one, and they write to the same `~/.hoverlab/config.json` the CLI reads — one credential, whichever surface set it.

**Installing needs a workspace on disk.** It writes through the filesystem, by way of the CLI's own writer. Browsing and previewing work anywhere, including a remote or virtual workspace; installing does not.

**`hoverlab.apiUrl` needs a reload.** The origin is read once, when the catalog module is first loaded, because installs in the underlying package resolve it from a module constant. This only affects people pointing the extension at their own deployment.

**The MCP registration is feature-detected.** `registerMcpServerDefinitionProvider` is a recent API and Cursor and Windsurf track upstream on their own schedule. Where it is missing, everything else still works and the server can be added by hand:

```
npx -y hoverlab mcp
```

**There is no builder in here.** `/builder` composes blocks into a page by dragging them around a canvas that renders every one of them live, and the composition is a shareable URL. A webview reimplementation would be a worse copy of something one click away, so the command opens the real one.

## Development

```sh
cd packages/vscode
npm install        # links ../cli, which does the fetching and installing
code .             # then F5 to launch an Extension Development Host
```

No build step: plain CommonJS, no bundler, no TypeScript. An extension asks for write access to your repo, so every line that ships should be readable without running a build first.

## Packaging

The one runtime dependency is the `hoverlab` CLI package next door, and how it is installed decides whether a `.vsix` comes out usable.

**Once the CLI is on npm** — the end state, and one line of setup:

```sh
# in packages/vscode/package.json, swap file:../cli for the published range
npm install
npx @vscode/vsce package
```

**Until then**, `"hoverlab": "file:../cli"` installs as a *symlink*, and `vsce` packages the link rather than the files — so the extension ships with nothing to load. Pack the CLI and install the tarball instead, which is the same shape npm will serve later:

```sh
npm pack ../cli --pack-destination .
npm install ./hoverlab-0.3.0.tgz
npx @vscode/vsce package
```

That produces `hoverlab-vscode-0.1.0.vsix` (32 files, ~128 KB) with the CLI inside as real files. Install it with `code --install-extension hoverlab-vscode-0.1.0.vsix`, or from the Extensions view's "Install from VSIX…".

Afterwards, put the dev setup back — `npm install` against `file:../cli` again — so edits to the CLI are picked up live instead of frozen in a tarball.

Two things that look like fixes and are not. `npm install --install-links` does copy the dependency into place, but leaves the lockfile claiming `file:`, and `vsce` runs `npm list` which then calls the tree invalid. And `vsce package --no-dependencies` succeeds while producing an extension whose every command fails on the first call, because the code it needs was never included.

`"private": true` in the manifest blocks `vsce publish` on purpose; see the note beside it.
