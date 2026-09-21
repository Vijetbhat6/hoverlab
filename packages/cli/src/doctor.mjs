/**
 * `hoverlab doctor` — is this project one that Hoverlab code will work in?
 *
 * The question people actually have, after `add` succeeds and the page
 * renders as unstyled boxes, is "what did I miss?" It is never the CLI's
 * file-writing. It is the four things around the files: Tailwind has to
 * exist and know what `bg-primary` means, `@/*` has to point where the
 * imports look, React has to be there, and the tokens have to be defined.
 * Each is a one-line fix once named, and a half-hour of staring at a
 * stylesheet before that.
 *
 * WHAT A CHECK MAY SAY
 *
 *   pass   verified, from a file or a response, not inferred
 *   warn   something an install will trip on, with the line that fixes it
 *   fail   the CLI itself cannot work here: no package.json to install into,
 *          or a Node too old to run it
 *   info   a fact worth knowing that is not a defect
 *
 * Only `fail` sets the exit code, and it is kept for those two on purpose.
 * A project without React is not broken — it can still install effects — and
 * a missing `hoverlab.config.json` or an unreachable network is not a reason
 * for a CI job to go red. It is the same argument as advisories in `review`,
 * and the same way to get a check switched off.
 *
 * Everything is a data record so the terminal, `--json` and a test read the
 * same answer. Nothing here prints.
 */

import { readFile, access } from 'node:fs/promises'
import { constants } from 'node:fs'
import path from 'node:path'

import { DEFAULT_ORIGIN, SITE_URL, searchLevel } from './api.mjs'
import { keySource } from './auth.mjs'
import { detectFramework, detectReactSupport } from './detect.mjs'
import { readLock, LOCK_NAME, fileDigest } from './lockfile.mjs'
import { findUp, inspectProject } from './project.mjs'

/** Same floor as `engines` in package.json. */
const MIN_NODE = [18, 17]

const exists = async (file) => {
  try {
    await access(file, constants.F_OK)
    return true
  } catch {
    return false
  }
}

const check = (id, status, title, detail, fix) => ({
  id,
  status,
  title,
  ...(detail ? { detail } : {}),
  ...(fix ? { fix } : {}),
})

/** Compare `18.17` style floors against `process.versions.node`. */
function nodeAtLeast(version, [major, minor]) {
  const [maj, min] = version.split('.').map(Number)
  return maj > major || (maj === major && min >= minor)
}

/**
 * The newest published version, or null when it cannot be learned in 3s.
 *
 * Short timeout and total tolerance for failure: this runs in the middle of
 * a diagnostic, and a slow registry must not be the reason `doctor` hangs.
 */
async function latestPublished(fetchImpl) {
  try {
    const response = await fetchImpl('https://registry.npmjs.org/hoverlab/latest', {
      signal: AbortSignal.timeout(3000),
      headers: { accept: 'application/json' },
    })
    if (!response.ok) return null
    return (await response.json()).version ?? null
  } catch {
    return null
  }
}

/** Whether `a` is an older semver than `b`. Numeric parts only. */
function isOlder(a, b) {
  const pa = String(a).split('.').map((n) => parseInt(n, 10) || 0)
  const pb = String(b).split('.').map((n) => parseInt(n, 10) || 0)
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) < (pb[i] ?? 0)
  }
  return false
}

/** Files that register the MCP server with an editor, per project. */
const MCP_CONFIGS = ['.mcp.json', '.cursor/mcp.json', '.vscode/mcp.json', '.windsurf/mcp.json']

/**
 * Run every check.
 *
 * @param {object} [options]
 * @param {string} [options.cwd]
 * @param {boolean} [options.offline]  skip the two network checks
 * @param {string} [options.version]   this CLI's version, for the freshness check
 * @param {typeof fetch} [options.fetchImpl]
 * @returns {Promise<{ checks: ReturnType<typeof check>[], summary: { fail: number, warn: number, pass: number, info: number } }>}
 */
export async function runDoctor({
  cwd = process.cwd(),
  offline = false,
  version,
  fetchImpl = fetch,
} = {}) {
  const checks = []
  const add = (...args) => checks.push(check(...args))

  /* ---------------------------------------------------------------- *
   *  The tool itself
   * ---------------------------------------------------------------- */

  if (nodeAtLeast(process.versions.node, MIN_NODE)) {
    add('node', 'pass', `Node ${process.versions.node}`)
  } else {
    add(
      'node',
      'fail',
      `Node ${process.versions.node} is older than ${MIN_NODE.join('.')}`,
      'The CLI and the MCP server need fetch, AbortSignal.timeout and node:test.',
      `Upgrade Node to ${MIN_NODE[0]}.${MIN_NODE[1]} or newer.`,
    )
  }

  if (version && !offline) {
    const latest = await latestPublished(fetchImpl)
    if (latest && isOlder(version, latest)) {
      add('version', 'warn', `hoverlab ${version} — ${latest} is available`, undefined, 'npx hoverlab@latest doctor')
    } else if (latest) {
      add('version', 'pass', `hoverlab ${version} is the latest`)
    } else {
      add('version', 'info', `hoverlab ${version}`, 'Could not reach the npm registry to compare.')
    }
  }

  /* ---------------------------------------------------------------- *
   *  The project
   * ---------------------------------------------------------------- */

  const project = await inspectProject(cwd)

  if (!project.root) {
    add(
      'project',
      'fail',
      'No package.json found here or in any parent directory',
      'Hoverlab code installs into a JavaScript project.',
      'Run this from your project, or scaffold one: npx hoverlab init <template>',
    )
    return finish(checks)
  }

  add('project', 'pass', `Project at ${path.basename(project.root) || project.root}`, project.root)
  add('package-manager', 'info', `Package manager: ${project.manager.name}`, project.manager.reason)

  const framework = await detectFramework(cwd)
  const react = await detectReactSupport(cwd)
  if (react.react) {
    add('react', 'pass', 'React is a dependency', framework.reason)
  } else {
    // A warn, not a fail: a Vue or plain-CSS project can still install
    // effects, and calling that project broken would be wrong.
    add(
      'react',
      'warn',
      'React is not a dependency',
      `${react.reason}. Blocks, pages and templates are React components and ship as written; effects still work as ${framework.framework}.`,
      `${project.manager.name === 'npm' ? 'npm install' : `${project.manager.name} add`} react react-dom`,
    )
  }

  /* ---------------------------------------------------------------- *
   *  Tailwind and the tokens
   * ---------------------------------------------------------------- */

  const { tailwind } = project

  if (!tailwind) {
    add(
      'tailwind',
      'warn',
      'Tailwind CSS is not installed',
      'Blocks and pages are styled entirely with Tailwind classes and render as unstyled boxes without it.',
      'https://tailwindcss.com/docs/installation',
    )
  } else {
    const label = tailwind.major ? `Tailwind v${tailwind.major}` : 'Tailwind (version unreadable)'
    add('tailwind', tailwind.major ? 'pass' : 'warn', label, tailwind.source)

    if (tailwind.entryCss === null) {
      add(
        'stylesheet',
        'warn',
        'Could not find the stylesheet that imports Tailwind',
        'Looked where Next, Vite and Remix scaffolds put it, and at components.json tailwind.css.',
        'Set "tailwind.css" in components.json to its path.',
      )
    }

    const themeFile = tailwind.major === 3 ? 'tailwind-theme.v3.ts' : 'tailwind-theme.css'
    const themeWhere =
      tailwind.major === 3
        ? `${tailwind.configFile ?? 'tailwind.config.*'} (theme.extend.colors)`
        : (tailwind.entryCss ?? 'your stylesheet')

    if (!tailwind.mapsColors) {
      add(
        'colors',
        'warn',
        'bg-primary, text-foreground and the other semantic colours are not mapped',
        `Every catalog component is styled in these names. ${themeWhere} does not define them, so they compile to nothing.`,
        `Export your design system at ${SITE_URL}/design-system and use its ${themeFile}` +
          (tailwind.major === 3 ? '' : ' — import it after tokens.css'),
      )
    } else if (!tailwind.tokensResolve) {
      add(
        'tokens',
        'warn',
        '--primary is not defined',
        `${themeWhere} maps bg-primary to var(--primary), but no stylesheet the entry imports declares it — buttons and links will have no colour.`,
        `Add the :root and .dark blocks from tokens.css at ${SITE_URL}/design-system`,
      )
    } else {
      add('colors', 'pass', 'Semantic colours resolve', `mapped in ${themeWhere}`)
    }
  }

  /* ---------------------------------------------------------------- *
   *  components.json and the path alias
   * ---------------------------------------------------------------- */

  const { componentsJson, atAlias } = project

  if (atAlias) {
    add('alias', 'pass', `"@/*" points at ${path.relative(project.root, atAlias.dir).split(path.sep).join('/') || '.'}/`, atAlias.from)
  } else {
    add(
      'alias',
      'warn',
      'No "@/*" path alias',
      'Pages import blocks as "@/components/<block>". Without the alias those imports do not resolve.',
      'In tsconfig.json compilerOptions: "paths": { "@/*": ["./src/*"] }  (or ["./*"] if you have no src/)',
    )
  }

  if (componentsJson) {
    const componentsAlias = componentsJson.aliases.components
    if (componentsAlias && componentsAlias !== '@/components') {
      add(
        'components-alias',
        'warn',
        `components.json puts components at ${componentsAlias}`,
        'Catalog pages import from "@/components/…", so blocks installed from them will not resolve against that alias.',
        'Keep blocks under @/components, or rewrite the imports after installing.',
      )
    }
    const cssPath = componentsJson.tailwind.css
    if (cssPath && !(await exists(path.resolve(componentsJson.dir, cssPath)))) {
      add(
        'components-css',
        'warn',
        `components.json points at ${cssPath}, which does not exist`,
        undefined,
        'Fix "tailwind.css" in components.json.',
      )
    } else {
      add(
        'components-json',
        'pass',
        'components.json found',
        [componentsJson.style, componentsJson.iconLibrary].filter(Boolean).join(' · ') || undefined,
      )
    }
  } else {
    add('components-json', 'info', 'No components.json', 'Not needed. Only shadcn/ui projects have one.')
  }

  /* ---------------------------------------------------------------- *
   *  What is already installed
   * ---------------------------------------------------------------- */

  const lock = await readLock(cwd)
  const entries = Object.entries(lock.artifacts)

  if (entries.length === 0) {
    add('installed', 'info', `Nothing tracked yet in ${LOCK_NAME}`, 'It is written by the next hoverlab add.')
  } else {
    let missing = 0
    let edited = 0
    for (const [, entry] of entries) {
      for (const relative of entry.files ?? []) {
        let text
        try {
          text = await readFile(path.resolve(cwd, relative), 'utf8')
        } catch {
          missing++
          continue
        }
        const recorded = entry.hashes?.[relative]
        if (recorded && fileDigest(text) !== recorded) edited++
      }
    }

    add(
      'installed',
      missing ? 'warn' : 'pass',
      `${entries.length} artifact${entries.length === 1 ? '' : 's'} tracked`,
      `${edited} edited since install (yours now)${missing ? `, ${missing} file${missing === 1 ? '' : 's'} missing from disk` : ''}`,
      missing ? 'hoverlab remove <id> to forget one you deleted by hand, or hoverlab add <id> --force to restore it.' : undefined,
    )

    // The one package almost every block and page imports. Checked only when
    // something that imports it is installed, so a project using effects
    // alone is not told to install an icon library.
    const usesIcons = entries.some(([, entry]) => entry.level !== 'effect')
    if (usesIcons && !project.deps['lucide-react']) {
      add(
        'lucide',
        'warn',
        'lucide-react is not installed',
        'Installed blocks and pages import their icons from it.',
        `${project.manager.name === 'npm' ? 'npm install' : `${project.manager.name} add`} lucide-react`,
      )
    }
  }

  const brandFile = await findUp('hoverlab.config.json', cwd)
  if (brandFile) {
    add('brand', 'pass', 'Brand config found', path.relative(cwd, brandFile).split(path.sep).join('/') || 'hoverlab.config.json')
  } else {
    add('brand', 'info', 'No hoverlab.config.json', `Optional. Effects follow your brand when it exists. Make one at ${SITE_URL}/design-system`)
  }

  /* ---------------------------------------------------------------- *
   *  The agent side
   * ---------------------------------------------------------------- */

  let registered = null
  for (const config of MCP_CONFIGS) {
    const file = path.join(project.root, config)
    if (await exists(file)) {
      const text = await readFile(file, 'utf8').catch(() => '')
      if (/hoverlab/.test(text)) {
        registered = config
        break
      }
    }
  }
  add(
    'mcp',
    registered ? 'pass' : 'info',
    registered ? `MCP server registered in ${registered}` : 'MCP server not registered in this project',
    registered ? undefined : 'Your editor may still have it globally.',
    registered ? undefined : 'claude mcp add hoverlab -- npx -y hoverlab mcp',
  )

  const ruleFiles = [
    '.claude/skills/hoverlab/SKILL.md',
    '.cursor/rules/hoverlab.mdc',
    '.windsurf/rules/hoverlab.md',
    'AGENTS.md',
    'CLAUDE.md',
  ]
  const present = []
  for (const file of ruleFiles) {
    if (!(await exists(path.join(project.root, file)))) continue
    // The shared files are the user's own; only ours counts as ours.
    if (file === 'AGENTS.md' || file === 'CLAUDE.md') {
      const text = await readFile(path.join(project.root, file), 'utf8').catch(() => '')
      if (!text.includes('<!-- hoverlab:start -->')) continue
    }
    present.push(file)
  }
  add(
    'rules',
    present.length ? 'pass' : 'info',
    present.length ? `Agent rules present: ${present.join(', ')}` : 'No agent rules installed',
    present.length ? undefined : 'Tells Cursor, Windsurf, Claude Code and others to reach for the catalog first.',
    present.length ? undefined : 'npx hoverlab rules',
  )

  /* ---------------------------------------------------------------- *
   *  The network, last and never fatal
   * ---------------------------------------------------------------- */

  if (!offline) {
    const started = Date.now()
    try {
      await searchLevel({ level: 'effect', limit: 1 })
      add('api', 'pass', `Catalog reachable (${Date.now() - started} ms)`, DEFAULT_ORIGIN)
    } catch (error) {
      add(
        'api',
        'warn',
        'Catalog unreachable',
        error.message,
        'Check your connection, or HOVERLAB_API_URL if you set it.',
      )
    }
  }

  const source = await keySource()
  add(
    'licence',
    'info',
    source ? `Licence key in use (from ${source})` : 'No licence key',
    source ? undefined : 'Everything except the Pro templates installs without one.',
  )

  return finish(checks)
}

function finish(checks) {
  const summary = { fail: 0, warn: 0, pass: 0, info: 0 }
  for (const item of checks) summary[item.status]++
  return { checks, summary }
}
