# Hoverlab for VS Code

Search and install UI from the [Hoverlab catalog](https://hoverlab5.netlify.app) without leaving the editor — and hand the whole catalog to your agent with nothing to configure.

Works in **VS Code**, **Cursor**, **Windsurf** and **VSCodium**. VS Code installs extensions from the Visual Studio Marketplace; Cursor, Windsurf and VSCodium install from [Open VSX](https://open-vsx.org), so this one is built to be published to both. It is not listed on either yet: until it is, install the `.vsix` (see [Install a .vsix](#install-a-vsix) below).

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
npm install        # installs the published hoverlab package, which does the fetching and installing
code .             # then F5 to launch an Extension Development Host
```

No build step: plain CommonJS, no bundler, no TypeScript. An extension asks for write access to your repo, so every line that ships should be readable without running a build first.

The extension depends on the published `hoverlab` range in `package.json`, not on the checkout next door, so what you run is what a user gets. To try unreleased CLI changes from `packages/cli`, link them without touching the manifest or the lockfile, and undo it with a plain `npm install`:

```sh
npm install --no-save ../cli    # a symlink: fine for F5, wrong for packaging
npm install                     # back to the published package
```

Do not package while the symlink is in place. `vsce` packages the link rather than the files, so the extension would ship with nothing to load.

## Install a .vsix

Until the extension is listed on a marketplace, or to test a build before it is published, install the file directly:

```sh
npm ci
npm run package                                   # writes hoverlab-vscode-<version>.vsix beside this file
code --install-extension hoverlab-vscode-0.1.0.vsix
```

`code` can be `cursor`, `windsurf` or `codium`. Or use the Extensions view, **...** menu, **Install from VSIX...**. `npm run package` is `vsce package`; `@vscode/vsce` is a dev dependency and does not end up in the `.vsix`. Check what would ship with `npx vsce ls`.

## Publishing

The extension is published from CI, to the Visual Studio Marketplace (VS Code) and to Open VSX (Cursor, Windsurf, VSCodium), by [`.github/workflows/publish-vscode.yml`](../../.github/workflows/publish-vscode.yml). Nothing has been published yet: the one-time steps below need accounts that only a person can create.

### One-time setup (needs a human)

**Visual Studio Marketplace**

1. Sign in at [marketplace.visualstudio.com/manage](https://marketplace.visualstudio.com/manage) with a Microsoft account and create a publisher with the id `hoverlab`. The id must match `"publisher"` in `package.json`. This needs an Azure DevOps organisation, which the first sign-in offers to create.
2. In Azure DevOps, create a personal access token (User settings, Personal access tokens) with organisation **All accessible organizations** and scope **Marketplace, Manage**.
3. Save it as the repository secret `VSCE_PAT` (Settings, Secrets and variables, Actions).

**Open VSX**

1. Sign in at [open-vsx.org](https://open-vsx.org) with GitHub, open your profile and agree to the Publisher Agreement.
2. Create an access token at [open-vsx.org/user-settings/tokens](https://open-vsx.org/user-settings/tokens).
3. Create the namespace once: `npx ovsx create-namespace hoverlab -p <token>`. Publishing fails until the namespace exists. Claiming the namespace as its verified owner is a separate request described on the Open VSX wiki; publishing works without it, but the listing shows as unverified.
4. Save the token as the repository secret `OVSX_PAT`.

Either half can be set up alone. A marketplace whose secret is missing is skipped with a notice in the run log, not failed.

### Cut a release

1. Bump `"version"` in `package.json` and add an entry to `CHANGELOG.md`. Commit and push.
2. Tag and push, using exactly `vscode-v` plus the version:

   ```sh
   git tag vscode-v0.1.0
   git push origin vscode-v0.1.0
   ```

The workflow refuses to run past its first step if the tag and the manifest version disagree. Otherwise it builds the `.vsix`, checks that the `hoverlab` package is inside as real files and that nothing stray is, uploads it as a workflow artifact and as a GitHub release asset, then publishes that same file to each marketplace that has a token.

To rehearse without publishing, run the workflow by hand from the Actions tab. **dry-run** defaults to on: it builds and inspects the `.vsix` and stops. Turning it off publishes for real, and only when run against a `vscode-v*` tag.

### Notes

- The `hoverlab` dependency is a normal semver range (`^0.3.0`), so a release picks up the newest compatible CLI at install time and the lockfile pins what CI actually packages. If the extension starts calling something newer than the range allows, raise the range.
- A version can be published to each marketplace once. Fix a bad release by bumping the version, not by re-tagging.
- `npm install --install-links` and `vsce package --no-dependencies` both look like shortcuts and are not: the first leaves a lockfile that `vsce` calls invalid, and the second builds an extension whose every command fails on first use because the code it needs was never included.
