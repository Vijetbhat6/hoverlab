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
import { mkdir, writeFile } from 'node:fs/promises'

import {
  FRAMEWORKS,
  LEVELS,
  SITE_URL,
  getArtifact,
  getDna,
  reportInstall,
  getSkill,
  listSkills,
  searchAll,
  searchLevel,
} from './api.mjs'
import { detectFramework } from './detect.mjs'
import { addArtifact } from './write.mjs'
import { initTemplate } from './scaffold.mjs'
import { readProjectConfig, brandCustomization } from './config.mjs'
import {
  CONFIG_FILE,
  clearKey,
  keySource,
  looksLikeKey,
  maskKey,
  resolveKey,
  saveKey,
} from './auth.mjs'

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

  /*
   * The project's brand, when there is a hoverlab.config.json above the
   * working directory and the caller has not asked for a specific tint.
   *
   * Explicit flags win. Someone who typed `--hue 40` is overriding the
   * project default on purpose, and silently adding the brand rotation on
   * top would give them neither the number they asked for nor the brand.
   */
  const explicitTint = flags.hue !== undefined || flags.sat !== undefined
  const projectConfig = explicitTint ? null : await readProjectConfig()
  const brand = projectConfig ? brandCustomization(projectConfig) : null

  if (brand) {
    customization.hue = brand.hue
    customization.sat = brand.saturation
    out(
      `${dim('Using your project brand')}${
        brand.name ? ` ${dim(`(${brand.name})`)}` : ''
      }${dim(` from ${displayPath(projectConfig.path)}`)}`,
    )
    // Said once, up front, rather than per artifact. The rotation is an
    // approximation — see config.mjs — and a user who is going to be
    // surprised by it should be told before the files land, not after.
    out(`${dim('  Effects are hue-rotated to match; blocks and above follow your tokens.')}`)
  }

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

      // Counted after the files are on disk, and only for a real install:
      // a dry run is someone deciding, not someone using.
      if (!result.dryRun) {
        void reportInstall([result.artifact.id, ...(result.included ?? [])])
      }

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
      if (error?.name === 'LicenseError') {
        printLicenseNotice(error)
      } else {
        out(`${yellow('✗')} ${id}: ${error.message}`)
      }
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
  let result
  try {
    result = await initTemplate({
      id,
      directory: flags.dir ?? positionalDir,
      force: flags.force === true,
      dryRun: flags['dry-run'] === true,
    })
  } catch (error) {
    if (error?.name !== 'LicenseError') throw error
    // Handled rather than rethrown so the offer prints as output, not as a
    // stderr line the shell colours red. `quiet` keeps the top-level
    // handler from printing the message a second time, while still exiting
    // non-zero — a scripted `hoverlab init` must not look like it worked.
    printLicenseNotice(error)
    const err = new Error(error.message)
    err.quiet = true
    throw err
  }

  if (flags.json) {
    out(JSON.stringify(result, null, 2))
    return
  }

  if (!result.dryRun) void reportInstall([result.template.id])

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

/**
 * Print a licence refusal as an offer rather than as an error.
 *
 * The person reading this asked for something specific and got told no,
 * which is the highest-intent moment the CLI has. It should end with the
 * two things they need — where to buy it, and what to run once they have —
 * and not with a stack trace.
 */
function printLicenseNotice(error) {
  out(`${yellow('✗')} ${error.message}`)
  if (error.url) out(`  ${dim(error.url)}`)
  out(`  ${dim('Already bought it?')} ${cyan('npx hoverlab login <key>')}`)
  out(`  ${dim('Free to try:')} ${cyan('npx hoverlab init marketing-site')}`)
}

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
 *  skill
 * ------------------------------------------------------------------ */

/**
 * Where an agent skill goes.
 *
 * `.claude/skills/<name>/SKILL.md` is what Claude Code and Claude Desktop
 * read, and it is a plain markdown file — an agent that keeps its skills
 * somewhere else can be pointed at the same file, which is why `--dir`
 * exists rather than a list of per-agent special cases.
 */
const SKILLS_DIR = path.join('.claude', 'skills')

export async function commandSkill(args, flags) {
  const [id] = args

  if (!id) {
    const skills = await listSkills()
    if (flags.json) {
      out(JSON.stringify(skills, null, 2))
      return
    }
    out(bold('Agent skills') + dim(' — free, and they never expire'))
    out()
    for (const skill of skills) {
      out(`  ${cyan(skill.id)}`)
      out(`    ${skill.description}`)
      out()
    }
    out(dim('Install one with: hoverlab skill hoverlab'))
    return
  }

  const skill = await getSkill(id)

  const root = flags.dir ? path.resolve(flags.dir) : path.join(process.cwd(), SKILLS_DIR)
  const target = path.join(root, skill.id, 'SKILL.md')

  if (flags['dry-run']) {
    out(`${yellow('would write')} ${displayPath(target)}`)
    return
  }

  // Overwriting is the right default here, unlike for catalog files: a
  // skill is a copy of ours, not something the user has edited, and the
  // reason to run this again is almost always to pick up a newer one.
  await mkdir(path.dirname(target), { recursive: true })
  await writeFile(target, skill.markdown, 'utf8')

  out(`${green('✓')} Installed ${bold(skill.name)}`)
  out(`  ${displayPath(target)}`)
  out()
  out(dim('Restart your agent, or start a new session, for it to load.'))
}

/* ------------------------------------------------------------------ *
 *  dna
 * ------------------------------------------------------------------ */

/**
 * Print or write a Design DNA document.
 *
 * Prints by default rather than writing: the common use is piping it into
 * a prompt or an agent's context, and a command that silently created a
 * file for that would be surprising. `--out` writes when a file is wanted.
 */
export async function commandDna(args, flags) {
  const id = args[0] ?? 'catalog'
  const doc = await getDna(id, { brand: flags.brand })

  if (flags.json) {
    out(JSON.stringify(doc, null, 2))
    return
  }

  if (!flags.out) {
    out(doc.markdown)
    return
  }

  const target = path.resolve(flags.out)
  await mkdir(path.dirname(target), { recursive: true })
  await writeFile(target, doc.markdown, 'utf8')
  out(`${green('✓')} ${doc.title}`)
  out(`  ${displayPath(target)}`)
}

/* ------------------------------------------------------------------ *
 *  login / logout / whoami
 * ------------------------------------------------------------------ */

/**
 * Store a licence key for this machine.
 *
 * Takes the key as an argument rather than prompting for it. A prompt
 * would have to read from a TTY, which rules out the two places this is
 * most useful — a CI step and a copy-pasted setup line — and the key is
 * not a password: it is already on the customer's clipboard from
 * /account.
 *
 * Deliberately does NOT verify the key against the API. A network check
 * here would turn `login` into a command that fails while offline, and the
 * first real request reports an invalid key perfectly well. What it does
 * check is the shape, because a pasted email address or a truncated key is
 * worth catching before it is written to a file the user then forgets
 * about.
 */
export async function commandLogin(args) {
  const key = args[0] ?? process.env.HOVERLAB_KEY

  if (!key) {
    out(`${bold('hoverlab login')} — save a licence key for this machine`)
    out()
    out('  npx hoverlab login hl_live_xxxxxxxx')
    out()
    out(dim(`Get one at ${SITE_URL}/account. Only Pro templates need it —`))
    out(dim('every effect, block and page works without a key.'))
    return
  }

  if (!looksLikeKey(key)) {
    throw new Error(
      `That does not look like a Hoverlab key. They start with \`hl_live_\` and are issued at ${SITE_URL}/account.`,
    )
  }

  const file = await saveKey(key)
  out(`${green('✓')} Saved ${cyan(maskKey(key))}`)
  out(`  ${dim(displayPath(file))}`)
  out()
  out(dim('HOVERLAB_KEY in your environment still wins over this file.'))
}

export async function commandLogout() {
  const cleared = await clearKey()
  out(
    cleared
      ? `${green('✓')} Key removed from ${dim(displayPath(CONFIG_FILE))}`
      : `${dim('No stored key to remove.')}`,
  )
  if (process.env.HOVERLAB_KEY) {
    // Removing the file while the environment still exports a key would
    // otherwise look like the logout silently failed.
    out(`  ${yellow('!')} ${dim('HOVERLAB_KEY is still set in this shell — unset it too.')}`)
  }
}

export async function commandWhoami() {
  const key = await resolveKey()
  if (!key) {
    out(`${dim('No licence key. Everything free still works —')} ${cyan('hoverlab add btn-gradient')}`)
    out(`${dim('Pro templates need one:')} ${cyan('hoverlab login <key>')}`)
    return
  }
  const source = await keySource()
  out(`${green('✓')} ${cyan(maskKey(key))}`)
  out(`  ${dim(`from ${source === 'HOVERLAB_KEY' ? 'HOVERLAB_KEY' : displayPath(source)}`)}`)
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
  skill [id]           Install an agent skill into .claude/skills.
                       With no id, lists the ones available.
  dna [id]             Print the Design DNA for an artifact — the tokens,
                       shape, motion and rules, ready to paste into an AI
                       tool. With no id, the whole system.
  mcp                  Run the MCP server over stdio (for editor agents)
  login <key>          Save a licence key for this machine
  logout               Forget the stored key
  whoami               Show which key is in play, and where it came from
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
      --brand <id>     dna: apply a brand preset's accent
      --out <path>     dna: write to a file instead of printing
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

${bold('Your brand')}
  Put a ${cyan('hoverlab.config.json')} in your project root — the design system
  export at ${dim(`${SITE_URL.replace('https://', '')}/design-system`)} writes one — and ${dim('add')} tints effects
  to match it. Blocks, pages and templates need nothing: they style
  themselves through the tokens in your ${cyan('tokens.css')}. An explicit
  ${dim('--hue')} or ${dim('--sat')} overrides the project brand.

${bold('Licences')}
  Everything here is free to install: every effect, every block, every page,
  and the ${cyan('marketing-site')} template. The other templates are part of Pro —
  ${dim('hoverlab init')} will say so and link the purchase. Once bought, run
  ${cyan('hoverlab login <key>')} once, or export ${dim('HOVERLAB_KEY')} in CI.

${bold('Where files land')}
  Effects go into a hoverlab/ folder inside your components or styles
  directory. Blocks and pages keep their own paths — components/x.tsx,
  app/y.tsx — rooted at your project (or src/, if you use it), because
  that is what the page sources import against. ${dim('--dir')} overrides both.

${bold('Editor integration')}
  Teach your agent the catalog, so it installs the right piece instead of
  writing a worse one from scratch:

    npx hoverlab skill hoverlab

  Register the MCP server so your editor's agent can search and install
  from the catalog directly:

    claude mcp add hoverlab -- npx -y hoverlab mcp

  Or add this to your MCP client's config:

    { "mcpServers": { "hoverlab": { "command": "npx", "args": ["-y", "hoverlab", "mcp"] } } }

${dim('Set HOVERLAB_API_URL to point at a different deployment.')}`)
}
