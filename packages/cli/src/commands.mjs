/**
 * Command implementations for the `hoverlab` CLI.
 *
 * Output style: terse by default, because the common case is a developer
 * running `hoverlab add btn-gradient` mid-task who wants to know what
 * landed on disk and get back to work. Anything longer than a few lines is
 * behind a flag.
 */

import path from 'node:path'

import { FRAMEWORKS, searchEffects, getEffect } from './api.mjs'
import { detectFramework } from './detect.mjs'
import { writeEffectFiles } from './write.mjs'

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

/* ------------------------------------------------------------------ *
 *  add
 * ------------------------------------------------------------------ */

export async function commandAdd(ids, flags) {
  if (ids.length === 0) {
    throw new Error('Which effect? Try `hoverlab search button` to find one.')
  }

  const customization = {}
  for (const key of ['hue', 'sat', 'scale', 'speed']) {
    if (flags[key] !== undefined) customization[key] = flags[key]
  }

  let failures = 0

  for (const id of ids) {
    try {
      const result = await writeEffectFiles({
        id,
        framework: flags.framework,
        directory: flags.dir,
        force: flags.force === true,
        dryRun: flags['dry-run'] === true,
        customization,
      })

      const verb = result.dryRun ? 'Would write' : 'Added'
      out(
        `${green('✓')} ${verb} ${bold(result.effect.name)} ${dim(`(${result.effect.id})`)} as ${cyan(result.framework)}`,
      )
      if (result.frameworkReason && !flags.framework) {
        out(`  ${dim(`framework auto-detected — ${result.frameworkReason}`)}`)
      }
      for (const file of result.files) {
        out(`  ${dim(displayPath(file))}`)
      }
      for (const note of result.notes) {
        out(`  ${yellow('!')} ${dim(note)}`)
      }
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
 *  search
 * ------------------------------------------------------------------ */

export async function commandSearch(terms, flags) {
  const query = terms.join(' ').trim()

  const result = await searchEffects({
    query,
    category: flags.category,
    featured: flags.featured === true,
    limit: flags.limit ?? 20,
  })

  if (flags.json) {
    out(JSON.stringify(result, null, 2))
    return
  }

  if (result.effects.length === 0) {
    out(`No effects matched ${bold(query)}.`)
    out(
      dim(
        'Every word has to match, so try fewer or broader terms — "teal glow" rather than "subtle teal glowing button".',
      ),
    )
    return
  }

  const shown = result.effects.length
  out(
    `${result.total} match${result.total === 1 ? '' : 'es'}${shown < result.total ? `, showing ${shown}` : ''}:`,
  )
  out()
  for (const effect of result.effects) {
    const badge = effect.featured ? ` ${yellow('★')}` : ''
    out(`  ${bold(effect.id)}${badge}`)
    out(`  ${dim(`${effect.category} · ${effect.description}`)}`)
    out()
  }
  out(dim(`Install one with: hoverlab add ${result.effects[0].id}`))
}

/* ------------------------------------------------------------------ *
 *  show
 * ------------------------------------------------------------------ */

export async function commandShow(ids, flags) {
  if (ids.length === 0) throw new Error('Which effect? e.g. `hoverlab show btn-gradient`')

  const framework = flags.framework ?? (await detectFramework()).framework
  const customization = {}
  for (const key of ['hue', 'sat', 'scale', 'speed']) {
    if (flags[key] !== undefined) customization[key] = flags[key]
  }

  for (const id of ids) {
    const data = await getEffect(id, { framework, customization })

    if (flags.json) {
      out(JSON.stringify(data, null, 2))
      continue
    }

    out(`${bold(data.effect.name)} ${dim(`(${data.effect.id})`)}`)
    out(dim(`${data.effect.category} · ${data.effect.description}`))
    out(dim(data.effect.url))
    out()
    for (const file of data.files) {
      out(dim(`── ${file.path} ${'─'.repeat(Math.max(0, 60 - file.path.length))}`))
      out(file.code.trimEnd())
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
  const result = await searchEffects({ limit: 1 })
  if (flags.json) {
    out(JSON.stringify(result.categories, null, 2))
    return
  }
  out('Categories:')
  out()
  for (const category of result.categories) out(`  ${category}`)
  out()
  out(dim('Filter with: hoverlab search glow --category Buttons'))
}

/* ------------------------------------------------------------------ *
 *  help
 * ------------------------------------------------------------------ */

export function commandHelp() {
  out(`${bold('hoverlab')} — install CSS effects from the Hoverlab catalog

${bold('Usage')}
  npx hoverlab <command> [options]

${bold('Commands')}
  add <id...>          Write an effect into your project
  search <words...>    Search the catalog
  show <id...>         Print an effect's code without writing files
  categories           List the catalog categories
  mcp                  Run the MCP server over stdio (for editor agents)
  help                 Show this message

${bold('Options')}
  -f, --framework <t>  ${FRAMEWORKS.join(' | ')}
                       Auto-detected from your project when omitted
  -d, --dir <path>     Destination directory
      --force          Overwrite files that already exist
      --dry-run        Show what would be written, write nothing
      --category <c>   Restrict a search to one category
      --featured       Only curated, hand-written effects
      --limit <n>      Maximum search results (default 20)
      --json           Machine-readable output
      --hue <deg>      Recolour: hue rotation, -180 to 180
      --sat <pct>      Recolour: saturation shift, -100 to 100
      --scale <n>      Resize: multiplier for px/rem values, 0.5 to 1.5
      --speed <n>      Retime: animation speed multiplier, 0.25 to 3

${bold('Examples')}
  npx hoverlab search "pulsing teal button"
  npx hoverlab add btn-gradient
  npx hoverlab add btn-gradient --framework vue --dir src/components
  npx hoverlab add btn-gradient --hue 40 --speed 1.5
  npx hoverlab show btn-gradient --framework tailwind

${bold('Editor integration')}
  Register the MCP server so your editor's agent can search and install
  effects directly:

    claude mcp add hoverlab -- npx -y hoverlab mcp

  Or add this to your MCP client's config:

    { "mcpServers": { "hoverlab": { "command": "npx", "args": ["-y", "hoverlab", "mcp"] } } }

${dim('Set HOVERLAB_API_URL to point at a different deployment.')}`)
}
