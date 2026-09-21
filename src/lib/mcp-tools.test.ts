import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  MCP_ADD_COMMAND,
  MCP_CLIENT_CONFIG,
  MCP_READ_COUNT,
  MCP_TOOLS,
  MCP_TOOL_COUNT,
  MCP_WRITE_COUNT,
  MCP_WRITE_TOOLS,
} from './mcp-tools'

/**
 * What is at risk here is the same thing `/frameworks` risks: an agreement
 * between a page and the thing it describes, where both halves are
 * individually valid and the pair is a lie.
 *
 * `/mcp` is a sales page whose entire argument is a count — ten tools,
 * three of which write files. The server that actually serves those tools
 * is a separately published npm package in `packages/cli`, on its own
 * release clock. Nothing in tsc, eslint or the prebuild chain connects the
 * two: a tool added to the server ships a page that undersells it, a tool
 * removed from the server ships a page that promises a tool an agent will
 * be told does not exist, and both compile perfectly.
 *
 * So the check is deliberately set-equality in both directions, and
 * deliberately reads the published file rather than importing it — the
 * server module opens stdio transports at import time, which a test run
 * has no business doing.
 */

const HERE = dirname(fileURLToPath(import.meta.url))
const SERVER = join(HERE, '..', '..', 'packages', 'cli', 'src', 'mcp.mjs')

/**
 * Tool names as the server advertises them.
 *
 * A text scan rather than a parse, for the same reason `check-canonical`
 * is one: the alternative is executing a module that expects to own the
 * process's stdin. It reads `name:` entries inside the TOOLS array only —
 * the file also carries a `serverInfo.name`, which is not a tool and must
 * not be counted as one.
 */
function serverToolNames(): string[] {
  const src = readFileSync(SERVER, 'utf8')

  const start = src.indexOf('const TOOL_DEFINITIONS = [')
  assert.notEqual(start, -1, 'mcp.mjs no longer declares `const TOOL_DEFINITIONS = [`')

  // The tool definitions run to the first line that closes the array at
  // column 0. Every entry inside is indented, so this cannot end early.
  const end = src.indexOf('\n]', start)
  assert.notEqual(end, -1, 'could not find the end of the TOOLS array')

  const body = src.slice(start, end)
  return [...body.matchAll(/^\s{4}name: '([a-z_]+)',$/gm)].map((m) => m[1])
}

test('every tool the server serves is described on the site', () => {
  const served = serverToolNames()
  // A regex that matched nothing would make every assertion below pass
  // vacuously, which is the one way this test could be worse than absent.
  assert.ok(served.length > 0, 'scanned no tool names out of mcp.mjs')

  const described = MCP_TOOLS.map((t) => t.name)

  assert.deepEqual(
    [...described].sort(),
    [...served].sort(),
    'MCP_TOOLS and packages/cli/src/mcp.mjs disagree about which tools exist',
  )
  assert.equal(MCP_TOOL_COUNT, served.length)
})

test('names are unique and in the order the server lists them', () => {
  const described = MCP_TOOLS.map((t) => t.name)
  assert.equal(new Set(described).size, described.length, 'duplicate tool name')
  // Order is not correctness, but the table reads as the server's own list
  // and a silent reordering would make a reader think a tool had moved
  // tiers. Cheap to hold, so hold it.
  assert.deepEqual(described, serverToolNames())
})

/**
 * For each tool the site calls `write`, the words in the server's own
 * description that make it one.
 *
 * A phrase per tool rather than one clever regex over all three. The regex
 * version passed because `get_effect` says "when the code should be
 * written to disk" — a sentence about the *other* tool — which is exactly
 * the near-miss that makes a loose pattern worse than no pattern. Naming
 * the evidence makes the failure legible too: if one of these stops
 * matching, the message says which promise the server withdrew.
 */
const WRITE_EVIDENCE: Record<string, string> = {
  install_effect: "write its files into the user's project",
  install_artifact: "write its files into the user's project",
  init_template: 'Scaffold a complete, runnable Next.js project',
}

test('the write tools are the ones that promise files on disk', () => {
  // `\'` in the source file, `'` once read as a string.
  const src = readFileSync(SERVER, 'utf8').replaceAll("\\'", "'")

  assert.deepEqual(
    MCP_WRITE_TOOLS.map((t) => t.name).sort(),
    Object.keys(WRITE_EVIDENCE).sort(),
    'a tool changed kind without its evidence being restated',
  )

  for (const tool of MCP_WRITE_TOOLS) {
    assert.ok(
      src.includes(WRITE_EVIDENCE[tool.name]),
      `${tool.name} is described here as writing files, but the server no longer promises "${WRITE_EVIDENCE[tool.name]}"`,
    )
  }

  // The page says "three of them write files" by rendering this number.
  // Asserting it here is not redundant with the loop above: the loop
  // proves each claim is honest, this proves the split is what the page's
  // argument was written around.
  assert.equal(MCP_WRITE_COUNT + MCP_READ_COUNT, MCP_TOOL_COUNT)
  assert.ok(MCP_WRITE_COUNT >= 3, 'the install-and-scaffold claim needs three')
})

test('the registration snippets name the published package', () => {
  // Both forms invoke the same binary. A rename that updated one and not
  // the other would leave half the page working.
  assert.match(MCP_ADD_COMMAND, /npx -y hoverlab mcp$/)

  const config = JSON.parse(MCP_CLIENT_CONFIG) as {
    mcpServers: Record<string, { command: string; args: string[] }>
  }
  assert.deepEqual(config.mcpServers.hoverlab, {
    command: 'npx',
    args: ['-y', 'hoverlab', 'mcp'],
  })
})
