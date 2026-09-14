/**
 * The MCP server's tool surface, as the website is allowed to describe it.
 *
 * WHY THIS FILE EXISTS AT ALL.
 *
 * The tools are defined once, in `packages/cli/src/mcp.mjs`, which is a
 * separately published npm package. Until this file existed, the website's
 * account of them was a hand-typed table inside `/docs/mcp` — ten rows of
 * prose with no relationship to the server except that somebody had read
 * it once. That is the exact shape of failure this repo has already paid
 * for twice: a count baked into a description that was wrong within one
 * release, and generated JSON that shipped stale to the API, the CLI and
 * the registry at the same time.
 *
 * A marketing page makes it worse, not better. `/docs/mcp` was read by
 * people who had already decided; `/mcp` is read by people deciding, and
 * the whole argument it makes is a count — how many tools, and how many of
 * them write files. A number in that position cannot be a number somebody
 * typed.
 *
 * So the names live here, the summaries live here, and
 * `mcp-tools.test.ts` reads the published server and fails when the two
 * sets differ in either direction. Adding a tool to the server without
 * describing it here is a red test; describing one here that the server
 * does not serve is the same red test. The counts on the page are then
 * `MCP_TOOLS.length` and a filter, which cannot be typed wrong.
 *
 * WHY `kind` IS THE FIELD THAT MATTERS.
 *
 * The page's one real claim is that this server writes to your disk and
 * the others hand you something to paste. That is a claim about a
 * *property of each tool*, not a slogan, so it is stored as one: `write`
 * means the tool's own description promises files on disk, `read` means it
 * returns data. Three tools are `write`. If a fourth is ever added, the
 * page's "three of them" becomes "four of them" without anyone editing
 * copy, and if the writing tools are ever removed the claim disappears
 * with them rather than outliving them.
 *
 * WHAT IS DELIBERATELY NOT MIRRORED HERE. The input schemas. They are long,
 * they change for reasons that do not concern a reader deciding whether to
 * install this, and duplicating them would create the second source of
 * truth this file exists to prevent. The agent reads them from the server;
 * a person reads the summary.
 */

export type McpToolKind = 'read' | 'write'

export interface McpTool {
  /** Exact tool name as the server advertises it over stdio. */
  name: string
  /**
   * `write` when the tool puts files in the user's project. The distinction
   * the whole page turns on, so it is data rather than prose.
   */
  kind: McpToolKind
  /** One line, for the table. Plain enough to skim a column of ten. */
  summary: string
  /** When you would reach for it rather than its neighbour. */
  detail: string
}

/**
 * In the order the server advertises them, which is also roughly the order
 * an agent uses them: find, then look, then write.
 */
export const MCP_TOOLS: McpTool[] = [
  {
    name: 'search_effects',
    kind: 'read',
    summary: 'Search the effects catalog',
    detail:
      'Hover states, loaders, entrances — anything that is one element rather than one section. Returns metadata; the code comes from the next two.',
  },
  {
    name: 'get_effect',
    kind: 'read',
    summary: 'Read one effect as source',
    detail:
      'Returns ready-to-paste code in the framework you ask for, plus the caveats for that target. For showing the user, or adapting it yourself.',
  },
  {
    name: 'install_effect',
    kind: 'write',
    summary: 'Write an effect into the project',
    detail:
      'Detects the framework from the project, picks the directory, writes the files, and reports the paths. Recolour and retime it on the way in.',
  },
  {
    name: 'list_categories',
    kind: 'read',
    summary: 'List the category vocabulary',
    detail:
      'The exact spellings a search will accept. Cheap, and it stops an agent guessing a category that does not exist.',
  },
  {
    name: 'search_catalog',
    kind: 'read',
    summary: 'Search all five tiers at once',
    detail:
      'Effects, primitives, blocks, pages and templates in one call. The right first move when the ask is bigger than one element.',
  },
  {
    name: 'get_kit',
    kind: 'read',
    summary: 'Get everything for one kind of product',
    detail:
      'A curated answer to "build me a storefront" — the template, the screens and the sections, as a ready-made list of ids rather than a search the agent has to assemble.',
  },
  {
    name: 'install_artifact',
    kind: 'write',
    summary: 'Write a block or a page into the project',
    detail:
      'A page brings the blocks it is composed of, so what lands compiles instead of leaving broken imports. Returns the paths and any packages still to install.',
  },
  {
    name: 'match_design',
    kind: 'read',
    summary: 'Rank the catalog against a design',
    detail:
      'A Figma frame, a screenshot or a written spec, one region at a time. Unlike search, designer vocabulary is translated and partial matches still rank.',
  },
  {
    name: 'init_template',
    kind: 'write',
    summary: 'Scaffold a whole runnable project',
    detail:
      'Routing, layout, theme tokens, every page and every block, into a new directory. Refuses a non-empty directory unless forced.',
  },
  {
    name: 'get_design_dna',
    kind: 'read',
    summary: 'Hand over the design system',
    detail:
      'Tokens for both themes, radius, spacing, type and motion rules. Called before the agent writes UI of its own, so it does not invent a second palette.',
  },
]

export const MCP_TOOL_COUNT = MCP_TOOLS.length

/** The tools that put files on disk. The page's central claim, counted. */
export const MCP_WRITE_TOOLS = MCP_TOOLS.filter((t) => t.kind === 'write')
export const MCP_READ_TOOLS = MCP_TOOLS.filter((t) => t.kind === 'read')

export const MCP_WRITE_COUNT = MCP_WRITE_TOOLS.length
export const MCP_READ_COUNT = MCP_READ_TOOLS.length

/**
 * The registration commands, in one place because three surfaces print
 * them — `/mcp`, `/figma`, and the llms.txt entry — and a package rename
 * that updated two of them would be worse than one that updated none.
 */
export const MCP_ADD_COMMAND = 'claude mcp add hoverlab -- npx -y hoverlab mcp'

export const MCP_CLIENT_CONFIG = `{
  "mcpServers": {
    "hoverlab": {
      "command": "npx",
      "args": ["-y", "hoverlab", "mcp"]
    }
  }
}`

/** Figma's own Dev Mode server, registered alongside ours for the pairing. */
export const MCP_FIGMA_ADD_COMMAND =
  'claude mcp add --transport http figma http://127.0.0.1:3845/mcp'
