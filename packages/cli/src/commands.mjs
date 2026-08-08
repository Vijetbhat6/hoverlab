/**
 * Command implementations for the `hoverlab` CLI.
 *
 * Output style: terse by default, because the common case is a developer
 * running `hoverlab add btn-gradient` mid-task who wants to know what
 * landed on disk and get back to work. Anything longer than a few lines is
 * behind a flag.
 *
 * Every command works across all four rungs of the catalog — effects,
 * blocks, pages, templates. The user types an id; which tier it belongs to
 * is the API's problem, not theirs.
 */

import path from 'node:path'

import { FRAMEWORKS, LEVELS, getArtifact, searchAll, searchLevel } from './api.mjs'
import { detectFramework } from './detect.mjs'
import { addArtifact } from './write.mjs'
import { initTemplate } from './scaffold.mjs'

/* ------------------------------------------------------------------ *
 *  Output helpers
 * ------------------------------------------------------------------ */

const useColor =
  process.stdout.isTTY && !process.env.NO_COLOR && process.env.TERM !== 'dumb'

const paint = (code) => (text) => (useColor ? `[${code}m${text}[0m` : text)
export const bold = paint('1')
export const dim = paint('2')
export const green = paint('32')
export const yellow = paint('33')
export const cyan = paint('36')

function out(line = '') {
  process.stdout.write(line + '\n')
}

/** Relative path when it stays inside the cwd, absolute otherwise. */
function displayPath(absolute, cwd = process.cwd()) {
  const relative = path.relative(cwd, absolute)
  return relative && !relative.startsWith('..') ? relative : absolute
}

/** Plural labels, for headings. */
const LEVEL_PLURAL = {
  effect: 'effects',
  block: 'blocks',
  page: 'pages',
  template: 'templates',
}

function validateLevel(level) {
  if (level && !LEVELS.includes(level)) {
    throw new Error(`Unknown level "${level}". Pick one of: ${LEVELS.join(', ')}.`)
  }
  return level
}

/** Pull the four customization knobs out of a flags object. */
function readCustomization(flags) {
  const customization = {}
  for (const key of ['hue', 'sat', 'scale', 'speed']) {
    if (flags[key] !== undefined) customization[key] = flags[key]
  }
  return customization
}

/* ------------------------------------------------------------------ *
 *  add
 * ------------------------------------------------------------------ */

export async function commandAdd(ids, flags) {
  if (ids.length === 0) {
    throw new Error('Which one? Try `hoverlab search button` to find something.')
  }

  const customization = readCustomization(flags)
  let failures = 0

  for (const id of ids) {
    try {
      const result = await addArtifact({
        id,
        framework: flags.framework,
        directory: flags.dir,
        force: flags.force === true,
        dryRun: flags['dry-run'] === true,
        customization,
      })

      const verb = result.dryRun ? 'Would add' : 'Added'
      const target = result.level === 'effect' ? cyan(result.framework) : cyan(result.level)
      out(
        `${green('✓')} ${verb} ${bold(result.artifact.name)} ` +
          `${dim(`(${result.artifact.id})`)} as ${target}`,
      )

      if (result.frameworkReason && !flags.framework) {
        out(`  ${dim(`→ ${result.frameworkReason}`)}`)
      }
      if (result.included.length) {
        out(
          `  ${dim(
            `includes ${result.included.length} block${result.included.length === 1 ? '' : 's'}: ` +
              `${result.included.join(', ')}`,
          )}`,
        )
      }

      for (const file of result.files) out(`  ${dim(displayPath(file))}`)

      if (result.missingDeps.length) {
        out(`  ${yellow('!')} ${dim(`npm i ${result.missingDeps.join(' ')}`)}`)
      }
      for (const note of result.notes) out(`  ${yellow('!')} ${dim(note)}`)
    } catch (error) {
      failures++
      out(`${yellow('✗')} ${id}: ${error.message}`)
    }
  }

  if (failures > 0 && failures === ids.length) {
    const err = new Error('Nothing was installed.')
    err.quiet = true
    throw err
  }
}

/* ------------------------------------------------------------------ *
 *  init
 * ------------------------------------------------------------------ */

export async function commandInit(args, flags) {
  const [id, positionalDir] = args

  if (!id) {
    const { items } = await searchLevel({ level: 'template', limit: 50 })

    if (flags.json) {
      out(JSON.stringify(items, null, 2))
      return
    }

    out(`${bold('Templates')} — each one scaffolds a whole runnable project.`)
    out()
    for (const template of items) {
      out(`  ${bold(template.id)}${template.featured ? ` ${yellow('★')}` : ''}`)
      out(`  ${dim(`${template.category} · ${template.fileCount} files · ${template.routes?.length ?? 0} routes`)}`)
      out(`  ${dim(template.description)}`)
      out()
    }
    out(dim(`Scaffold one with: hoverlab init ${items[0]?.id ?? '<template>'}`))
    return
  }

  // `hoverlab init storefront ./shop` reads better than forcing --dir for
  // the one argument this command almost always takes.
  const result = await initTemplate({
    id,
    directory: flags.dir ?? positionalDir,
    force: flags.force === true,
    dryRun: flags['dry-run'] === true,
  })

  if (flags.json) {
    out(JSON.stringify(result, null, 2))
    return
  }

  const verb = result.dryRun ? 'Would scaffold' : 'Scaffolded'
  out(
    `${green('✓')} ${verb} ${bold(result.template.name)} ${dim(`(${result.template.id})`)} ` +
      `— ${result.files.length} files`,
  )
  out(`  ${dim(displayPath(result.directory))}`)

  if (result.routes.length) {
    out()
    out(`  ${dim('Routes')}`)
    for (const route of result.routes) {
      out(`  ${dim(`  ${route.path.padEnd(20)} ${route.label}`)}`)
    }
  }

  for (const skipped of result.skipped) {
    out(`  ${yellow('!')} ${dim(`skipped unsafe path: ${skipped}`)}`)
  }

  if (result.dryRun) return

  out()
  const where = displayPath(result.directory)
  out(bold('  Next:'))
  if (where !== '.') out(`    cd ${where}`)
  out('    npm install')
  out('    npm run dev')
}

/* ------------------------------------------------------------------ *
 *  search
 * ------------------------------------------------------------------ */

/** One search result, two lines. */
function printResult(item) {
  const badge = item.featured ? ` ${yellow('★')}` : ''
  out(`  ${bold(item.id)}${badge}`)
  out(`  ${dim(`${item.category} · ${item.description}`)}`)
  out()
}

export async function commandSearch(terms, flags) {
  const query = terms.join(' ').trim()
  const level = validateLevel(flags.level)
  const limit = flags.limit ?? 20

  if (level) {
    const result = await searchLevel({
      level,
      query,
      category: flags.category,
      featured: flags.featured === true,
      limit,
    })

    if (flags.json) {
      out(JSON.stringify(result, null, 2))
      return
    }

    if (!result.items.length) {
      out(`No ${LEVEL_PLURAL[level]} matched ${bold(query)}.`)
      out(dim(EVERY_WORD_HINT))
      return
    }

    const shown = result.items.length
    out(
      `${result.total} ${LEVEL_PLURAL[level]}` +
        `${shown < result.total ? `, showing ${shown}` : ''}:`,
    )
    out()
    for (const item of result.items) printResult(item)
    out(dim(installHint(level, result.items[0].id)))
    return
  }

  // Unified: the whole ladder at once. "checkout" could reasonably mean the
  // hover effect, the form block, the page or the storefront template, and
  // only the user knows which — so show all four and let them pick.
  // The upper tiers are capped tighter: there are 76 of them in total, and
  // a wall of blocks would bury the effects someone was probably after.
  const { results, total, errors } = await searchAll({
    query,
    category: flags.category,
    featured: flags.featured === true,
    limit,
  })

  if (flags.json) {
    out(JSON.stringify({ total, results }, null, 2))
    return
  }

  if (errors.length === results.length) {
    throw errors[0]
  }

  if (total === 0) {
    out(`Nothing in the catalog matched ${bold(query)}.`)
    out(dim(EVERY_WORD_HINT))
    return
  }

  out(`${total} match${total === 1 ? '' : 'es'} across the catalog:`)
  out()

  // Assembly first. Someone searching "pricing" who can have the whole
  // pricing page should be told that before being shown nine buttons.
  for (const level of ['template', 'page', 'block', 'effect']) {
    const result = results.find((r) => r.level === level)
    if (!result?.items.length) continue

    const cap = level === 'effect' ? limit : Math.min(limit, 6)
    const shown = result.items.slice(0, cap)

    out(
      bold(LEVEL_PLURAL[level].toUpperCase()) +
        dim(` (${result.total}${shown.length < result.total ? `, showing ${shown.length}` : ''})`),
    )
    for (const item of shown) printResult(item)
  }

  out(dim('Install one with: hoverlab add <id>'))
  out(dim('Scaffold a template with: hoverlab init <id>'))
  out(dim('Narrow the search with: --level block'))
}

const EVERY_WORD_HINT =
  'Every word has to match, so try fewer or broader terms — "teal glow" rather than "subtle teal glowing button".'

function installHint(level, id) {
  return level === 'template'
    ? `Scaffold one with: hoverlab init ${id}`
    : `Install one with: hoverlab add ${id}`
}

/* ------------------------------------------------------------------ *
 *  show
 * ------------------------------------------------------------------ */

export async function commandShow(ids, flags) {
  if (ids.length === 0) throw new Error('Which one? e.g. `hoverlab show btn-gradient`')

  const framework = flags.framework ?? (await detectFramework()).framework
  const customization = readCustomization(flags)

  for (const id of ids) {
    const data = await getArtifact(id, {
      framework,
      customization,
      deep: flags.deep === true,
    })

    if (flags.json) {
      out(JSON.stringify(data, null, 2))
      continue
    }

    // Effects name their summary `effect`; every tier above it `artifact`.
    const meta = data.effect ?? data.artifact

    out(`${bold(meta.name)} ${dim(`(${meta.id})`)}`)
    out(dim(`${meta.category} · ${meta.description}`))
    out(dim(meta.url))
    out()

    if (data.level !== 'effect' && data.deps?.length) {
      out(dim(`Dependencies: ${data.deps.join(', ')}`))
      out()
    }

    for (const file of data.files) {
      // Effects come back as `{ path, code }` from the framework codegen;
      // everything else as `{ path, source }` straight from the catalog.
      const code = file.code ?? file.source
      out(dim(`── ${file.path} ${'─'.repeat(Math.max(0, 60 - file.path.length))}`))
      out(code.trimEnd())
      out()
    }

    for (const note of data.notes ?? []) {
      out(`${yellow('!')} ${dim(note)}`)
    }
  }
}

/* ------------------------------------------------------------------ *
 *  categories
 * ------------------------------------------------------------------ */

export async function commandCategories(_args, flags) {
  const level = validateLevel(flags.level)
  const levels = level ? [level] : LEVELS

  const listed = await Promise.all(
    levels.map(async (l) => ({ level: l, categories: (await searchLevel({ level: l, limit: 1 })).categories })),
  )

  if (flags.json) {
    out(
      JSON.stringify(
        level ? listed[0].categories : Object.fromEntries(listed.map((l) => [l.level, l.categories])),
        null,
        2,
      ),
    )
    return
  }

  for (const entry of listed) {
    out(bold(LEVEL_PLURAL[entry.level].toUpperCase()))
    for (const category of entry.categories) out(`  ${category}`)
    out()
  }
  out(dim('Filter with: hoverlab search glow --level block --category Pricing'))
}

/* ------------------------------------------------------------------ *
 *  help
 * ------------------------------------------------------------------ */

export function commandHelp() {
  out(`${bold('hoverlab')} — install UI from the Hoverlab catalog

Four rungs, one command surface: ${dim('effects')} (one element), ${dim('blocks')} (one
section), ${dim('pages')} (one screen), ${dim('templates')} (a whole project).

${bold('Usage')}
  npx hoverlab <command> [options]

${bold('Commands')}
  add <id...>          Write an effect, block or page into your project
  init [template] [dir]
                       Scaffold a template into a new project directory.
                       With no template, lists the ones available.
  search <words...>    Search every tier at once
  show <id...>         Print an artifact's code without writing files
  categories           List the categories, per tier
  mcp                  Run the MCP server over stdio (for editor agents)
  help                 Show this message

${bold('Options')}
  -l, --level <t>      ${LEVELS.join(' | ')}
                       Restrict search / categories to one tier
  -f, --framework <t>  ${FRAMEWORKS.join(' | ')}
                       Effects only — blocks and above ship as React.
                       Auto-detected from your project when omitted
  -d, --dir <path>     Destination directory
      --force          Overwrite existing files / scaffold into a non-empty dir
      --dry-run        Show what would be written, write nothing
      --category <c>   Restrict a search to one category
      --featured       Only curated, hand-written entries
      --limit <n>      Maximum search results per tier (default 20)
      --deep           show: include the blocks a page is built from
      --json           Machine-readable output
      --hue <deg>      Effects only — hue rotation, -180 to 180
      --sat <pct>      Effects only — saturation shift, -100 to 100
      --scale <n>      Effects only — px/rem multiplier, 0.5 to 1.5
      --speed <n>      Effects only — animation speed multiplier, 0.25 to 3

${bold('Examples')}
  npx hoverlab search checkout
  npx hoverlab search "pulsing teal button" --level effect
  npx hoverlab add btn-gradient --hue 40 --speed 1.5
  npx hoverlab add pricing-tiers faq-accordion
  npx hoverlab add checkout-page          ${dim('# page + every block it uses')}
  npx hoverlab init storefront ./shop

${bold('Where files land')}
  Effects go into a hoverlab/ folder inside your components or styles
  directory. Blocks and pages keep their own paths — components/x.tsx,
  app/y.tsx — rooted at your project (or src/, if you use it), because
  that is what the page sources import against. ${dim('--dir')} overrides both.

${bold('Editor integration')}
  Register the MCP server so your editor's agent can search and install
  from the catalog directly:

    claude mcp add hoverlab -- npx -y hoverlab mcp

  Or add this to your MCP client's config:

    { "mcpServers": { "hoverlab": { "command": "npx", "args": ["-y", "hoverlab", "mcp"] } } }

${dim('Set HOVERLAB_API_URL to point at a different deployment.')}`)
}
