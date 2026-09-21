# Changelog

All notable changes to the Hoverlab extension. Versions follow the extension's own `package.json`, not the `hoverlab` CLI package it depends on.

## 0.1.0

First release. Not yet listed on the Visual Studio Marketplace or Open VSX at the time of writing; see the README's Publishing section for the state of that.

- **Catalog sidebar** over all five tiers (effects, primitives, blocks, pages, templates), grouped by category, with the artifact id on every row.
- **Search** across all five tiers at once from the command palette, answered by the server so tags and descriptions match.
- **Preview** of primitives, blocks and pages in a tab, framing the same chrome-less render the website uses.
- **Install into the project**, delegated to the `hoverlab` package's own writer, so the result is identical to `npx hoverlab add`. Existing files are named before they are overwritten.
- **MCP server** offered to agent mode (`search_catalog`, `install_artifact`, `get_kit`, `match_design`, `init_template`, `get_design_dna`), feature-detected so editors without the API keep everything else. Turn it off with `hoverlab.registerMcpServer`.
- **Licence key** commands for the Pro templates, sharing `~/.hoverlab/config.json` with the CLI's `hoverlab login`.
- Settings: `hoverlab.apiUrl`, `hoverlab.framework`, `hoverlab.registerMcpServer`.
- Depends on the published `hoverlab` npm package (`^0.3.0`) rather than a sibling checkout, so the extension can be packaged with a plain `npm ci`.
