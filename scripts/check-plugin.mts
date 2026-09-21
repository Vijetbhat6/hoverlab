/**
 * Fail the build when the Claude Code plugin bundle has drifted from the
 * things it is a copy of.
 *
 *   npx tsx scripts/check-plugin.mts
 *   npx tsx scripts/check-plugin.mts --fix     # recopy skills/ into the plugin
 *
 * WHY THIS EXISTS
 *
 * `plugins/hoverlab/skills/hoverlab/SKILL.md` is a COPY of
 * `skills/hoverlab/SKILL.md`, not a link: Windows checkouts do not reliably
 * honour symlinks, and a plugin that installs as a dangling link installs as
 * no skill at all, silently. A copy is the single source of truth's worst
 * failure mode - it works until somebody edits one side - so this check is
 * what makes the copy safe to have. The counts in that file are guarded by
 * `check-claimed-counts.mts`, which reads `skills/`; this check guarantees
 * the plugin ships what that one guards.
 *
 * It also holds the plugin manifest to the facts it restates:
 *
 *   - the version, which must be the CLI's (`packages/cli/package.json`). The
 *     plugin's `.mcp.json` runs `npx -y hoverlab mcp`, so plugin 0.3.0 and
 *     CLI 0.3.0 are one release. An explicit `version` also PINS the plugin:
 *     users only receive an update when it changes, so a SKILL.md edit that
 *     does not ride a version bump never reaches an installed plugin.
 *   - homepage and licence, which are the CLI package's.
 *   - every path the manifests name, which must exist.
 *
 * And it refuses hand-typed catalog counts anywhere in the bundle outside
 * the copied skill. The description in `plugin.json` is the one line users
 * read before installing; a number there has no `--fix`.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const MARKETPLACE = join(ROOT, '.claude-plugin', 'marketplace.json')
const CLI_PACKAGE = join(ROOT, 'packages', 'cli', 'package.json')

/** Skills the plugin must ship, by id under `skills/`. */
const SHIPPED_SKILLS = ['hoverlab']

const fix = process.argv.includes('--fix')
const problems: string[] = []
const notes: string[] = []
let recopied = 0

const rel = (path: string) => relative(ROOT, path).replace(/\\/g, '/')
const fail = (message: string) => problems.push(`  ${message}`)

function readJson(path: string): any {
  if (!existsSync(path)) {
    fail(`${rel(path)} does not exist.`)
    return null
  }
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    fail(`${rel(path)} is not valid JSON: ${(error as Error).message}`)
    return null
  }
}

/** Front matter as flat `key: value` pairs; enough to check presence. */
function frontMatter(text: string): Record<string, string> | null {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)
  if (!match) return null
  const fields: Record<string, string> = {}
  for (const line of match[1]!.split(/\r?\n/)) {
    const kv = /^([A-Za-z_-]+):\s*(.*)$/.exec(line)
    if (kv) fields[kv[1]!] = kv[2]!.trim()
  }
  return fields
}

/** Line endings differ by checkout on Windows; content is what must match. */
const lf = (text: string) => text.replace(/\r\n?/g, '\n')

/** A path a manifest names: must be `./`-relative, forward-slashed, inside its base. */
function resolveManifestPath(base: string, value: unknown, where: string): string | null {
  if (typeof value !== 'string') {
    fail(`${where} must be a string path.`)
    return null
  }
  if (value.includes('\\')) fail(`${where} "${value}" uses a backslash; write forward slashes.`)
  if (!value.startsWith('./')) fail(`${where} "${value}" must start with "./".`)
  if (value.split('/').includes('..')) fail(`${where} "${value}" must not use "..".`)
  const full = join(base, value)
  if (!existsSync(full)) {
    fail(`${where} "${value}" does not exist (${rel(full)}).`)
    return null
  }
  return full
}

/* ------------------------------------------------------------------ *
 *  The CLI package: the version and metadata everything else follows
 * ------------------------------------------------------------------ */

const cli = readJson(CLI_PACKAGE)
const cliName: string | undefined = cli?.name
const cliVersion: string | undefined = cli?.version
if (cli && (!cliName || !cliVersion)) fail(`${rel(CLI_PACKAGE)} has no name or version.`)

/* ------------------------------------------------------------------ *
 *  Marketplace
 * ------------------------------------------------------------------ */

const marketplace = readJson(MARKETPLACE)
const pluginDirs: string[] = []

if (marketplace) {
  if (typeof marketplace.name !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(marketplace.name)) {
    fail(`marketplace.json "name" must be kebab-case.`)
  }
  if (!marketplace.owner?.name) fail(`marketplace.json needs owner.name.`)
  if (!Array.isArray(marketplace.plugins) || marketplace.plugins.length === 0) {
    fail(`marketplace.json needs a non-empty plugins array.`)
  }

  for (const [index, entry] of (marketplace.plugins ?? []).entries()) {
    const where = `marketplace.json plugins[${index}]`
    if (!entry?.name) fail(`${where} has no name.`)
    if (typeof entry?.source !== 'string') {
      fail(`${where}.source must be a relative path string for a same-repo plugin.`)
      continue
    }
    // Relative sources resolve against the marketplace root: the directory
    // that CONTAINS .claude-plugin/, not .claude-plugin/ itself.
    const dir = resolveManifestPath(ROOT, entry.source, `${where}.source`)
    if (!dir) continue
    pluginDirs.push(dir)

    const manifest = readJson(join(dir, '.claude-plugin', 'plugin.json'))
    if (manifest && manifest.name !== entry.name) {
      fail(`${where} is named "${entry.name}" but its plugin.json says "${manifest.name}".`)
    }
    if (manifest && entry.version !== undefined && entry.version !== manifest.version) {
      // plugin.json wins at install time, so a stale entry version is a lie
      // shown in the listing, not a working override.
      fail(`${where}.version "${entry.version}" disagrees with plugin.json "${manifest.version}". Drop it from the entry.`)
    }
  }
}

/* ------------------------------------------------------------------ *
 *  Each plugin
 * ------------------------------------------------------------------ */

const COUNT_CLAIM = /\b\d[\d,]*\s+(?:CSS |shader |React )?(?:effects?|blocks?|pages?|templates?|primitives?|components?)\b/i

function scanForCounts(file: string) {
  const text = readFileSync(file, 'utf8')
  const hit = COUNT_CLAIM.exec(text)
  if (hit) {
    fail(
      `${rel(file)} states a catalog count ("${hit[0]}"). Counts live in skills/, where check-claimed-counts guards them; here they go stale unseen.`,
    )
  }
}

function listFiles(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? listFiles(join(dir, entry.name)) : [join(dir, entry.name)],
  )
}

for (const dir of pluginDirs) {
  const label = rel(dir)
  const manifestPath = join(dir, '.claude-plugin', 'plugin.json')
  const manifest = readJson(manifestPath)

  if (manifest) {
    if (!manifest.name) fail(`${rel(manifestPath)} has no name.`)
    if (!manifest.version) {
      fail(`${rel(manifestPath)} has no version; it must match ${rel(CLI_PACKAGE)}.`)
    } else if (cliVersion && manifest.version !== cliVersion) {
      fail(
        `${rel(manifestPath)} version is ${manifest.version} but ${rel(CLI_PACKAGE)} is ${cliVersion}. ` +
          `Bump them together; the plugin runs \`npx -y ${cliName} mcp\`.`,
      )
    }
    if (cli?.homepage && manifest.homepage && manifest.homepage !== cli.homepage) {
      fail(`${rel(manifestPath)} homepage "${manifest.homepage}" is not the CLI's "${cli.homepage}".`)
    }
    if (cli?.license && manifest.license && manifest.license !== cli.license) {
      fail(`${rel(manifestPath)} license "${manifest.license}" is not the CLI's "${cli.license}".`)
    }
    if (typeof manifest.description !== 'string' || !manifest.description.trim()) {
      fail(`${rel(manifestPath)} needs a description.`)
    }

    // Component paths declared in the manifest, when it declares any.
    for (const key of ['skills', 'commands', 'agents']) {
      const value = manifest[key]
      if (value === undefined) continue
      for (const item of Array.isArray(value) ? value : [value]) {
        resolveManifestPath(dir, item, `${rel(manifestPath)} "${key}"`)
      }
    }
    if (typeof manifest.mcpServers === 'string') {
      resolveManifestPath(dir, manifest.mcpServers, `${rel(manifestPath)} "mcpServers"`)
    }
  }

  /* -------- skills: shipped, present, and identical to skills/ -------- */

  for (const id of SHIPPED_SKILLS) {
    const source = join(ROOT, 'skills', id, 'SKILL.md')
    const copy = join(dir, 'skills', id, 'SKILL.md')

    if (!existsSync(source)) {
      fail(`skills/${id}/SKILL.md does not exist, so the plugin has nothing to copy.`)
      continue
    }
    const sourceText = readFileSync(source, 'utf8')

    if (!existsSync(copy) || lf(readFileSync(copy, 'utf8')) !== lf(sourceText)) {
      if (fix) {
        mkdirSync(dirname(copy), { recursive: true })
        writeFileSync(copy, sourceText)
        recopied += 1
        notes.push(`recopied ${rel(source)} -> ${rel(copy)}`)
      } else {
        fail(
          existsSync(copy)
            ? `${rel(copy)} has drifted from ${rel(source)}. Run: npx tsx scripts/check-plugin.mts --fix`
            : `${rel(copy)} is missing. Run: npx tsx scripts/check-plugin.mts --fix`,
        )
      }
    }
  }

  // Anything else under skills/ must at least be a well-formed skill whose
  // folder is its name; an unmanaged extra would ship unchecked.
  const skillsRoot = join(dir, 'skills')
  if (existsSync(skillsRoot)) {
    for (const entry of readdirSync(skillsRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const file = join(skillsRoot, entry.name, 'SKILL.md')
      if (!existsSync(file)) {
        fail(`${rel(join(skillsRoot, entry.name))} has no SKILL.md.`)
        continue
      }
      const fields = frontMatter(readFileSync(file, 'utf8'))
      if (!fields?.name || !fields.description) {
        fail(`${rel(file)} needs front matter with name and description.`)
      } else if (fields.name !== entry.name) {
        fail(`${rel(file)} declares name "${fields.name}" but its folder is "${entry.name}".`)
      }
      if (!SHIPPED_SKILLS.includes(entry.name)) {
        fail(`${rel(file)} is not in SHIPPED_SKILLS, so nothing checks it against skills/. Add it or remove it.`)
      }
    }
  }

  /* -------- commands: parseable and permissioned -------- */

  const commandsDir = join(dir, 'commands')
  const commands = existsSync(commandsDir)
    ? readdirSync(commandsDir).filter((name) => name.endsWith('.md'))
    : []
  if (commands.length === 0) fail(`${rel(commandsDir)} has no commands.`)
  for (const name of commands) {
    const file = join(commandsDir, name)
    const fields = frontMatter(readFileSync(file, 'utf8'))
    if (!fields) {
      fail(`${rel(file)} has no front matter.`)
      continue
    }
    if (!fields.description) fail(`${rel(file)} needs a description.`)
    if (!fields['allowed-tools']) fail(`${rel(file)} needs allowed-tools, or every step prompts.`)
    // `npx hoverlab` without -y stops to ask "Ok to proceed?" in a shell
    // that has no keyboard, and the command hangs.
    if (/npx (?!-y )hoverlab/.test(readFileSync(file, 'utf8'))) {
      fail(`${rel(file)} runs \`npx hoverlab\` without -y; it would wait for a prompt nobody can answer.`)
    }
  }

  /* -------- MCP server: runs the package this repo publishes -------- */

  const mcpPath = join(dir, '.mcp.json')
  const mcp = readJson(mcpPath)
  if (mcp) {
    // Plugin .mcp.json wraps servers in "mcpServers".
    const servers = mcp.mcpServers
    if (!servers || typeof servers !== 'object' || Object.keys(servers).length === 0) {
      fail(`${rel(mcpPath)} needs a "mcpServers" object with at least one server.`)
    } else {
      for (const [key, server] of Object.entries<any>(servers)) {
        if (!server?.command) fail(`${rel(mcpPath)} server "${key}" has no command.`)
        const args: string[] = Array.isArray(server?.args) ? server.args : []
        if (server?.command === 'npx' && cliName && !args.includes(cliName)) {
          fail(`${rel(mcpPath)} server "${key}" runs npx without the "${cliName}" package.`)
        }
        if (server?.command === 'npx' && !args.includes('-y')) {
          fail(`${rel(mcpPath)} server "${key}" runs npx without -y; it would wait on an install prompt.`)
        }
        if (!args.includes('mcp')) fail(`${rel(mcpPath)} server "${key}" does not run the "mcp" subcommand.`)
      }
    }
  }

  /* -------- no hand-typed counts anywhere except the guarded copy -------- */

  for (const file of listFiles(dir)) {
    if (file.startsWith(join(dir, 'skills'))) continue // guarded by check-claimed-counts via skills/
    if (!/\.(json|md|mdx|txt)$/.test(file)) continue
    scanForCounts(file)
  }

  if (!existsSync(join(dir, 'README.md'))) fail(`${label}/README.md is missing.`)
}
if (marketplace) scanForCounts(MARKETPLACE)

/* ------------------------------------------------------------------ *
 *  Report
 * ------------------------------------------------------------------ */

for (const note of notes) console.log(`check-plugin: ${note}`)

if (fix) {
  console.log(`check-plugin: recopied ${recopied} file${recopied === 1 ? '' : 's'}.`)
  if (problems.length === 0) process.exit(0)
}

if (problems.length > 0) {
  console.error(
    '\ncheck-plugin: the Claude Code plugin bundle is not what it claims to be.\n\n' +
      problems.join('\n') +
      '\n',
  )
  process.exit(1)
}

console.log(
  `check-plugin: ${pluginDirs.length} plugin${pluginDirs.length === 1 ? '' : 's'} checked ` +
    `(version ${cliVersion}, ${SHIPPED_SKILLS.length} skill${SHIPPED_SKILLS.length === 1 ? '' : 's'} identical to skills/).`,
)
