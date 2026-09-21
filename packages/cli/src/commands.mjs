/**
 * Command implementations for the `hoverlab` CLI.
 *
 * Output style: terse by default, because the common case is a developer
 * running `hoverlab add btn-gradient` mid-task who wants to know what
 * landed on disk and get back to work. Anything longer than a few lines is
 * behind a flag.
 *
 * Every command works across all five rungs of the catalog — effects,
 * primitives, blocks, pages, templates. The user types an id; which tier it
 * belongs to is the API's problem, not theirs.
 */

import path from 'node:path'
import { createRequire } from 'node:module'
import { mkdir, writeFile, readFile, rmdir, stat, unlink } from 'node:fs/promises'

import {
  assertUnlocked,
  FRAMEWORKS,
  LEVELS,
  LEVEL_PLURAL,
  SEARCH_ORDER,
  SITE_URL,
  getArtifact,
  getDna,
  getRevisions,
  reportInstall,
  getSkill,
  listSkills,
  searchAll,
  searchLevel,
} from './api.mjs'
import { detectFramework, findProjectRoot } from './detect.mjs'
import { runDoctor } from './doctor.mjs'
import { RULE_TARGETS, mergeManagedSection, removeManagedSection, renderRules } from './rules.mjs'
import { addCommand, detectPackageManager, installAllCommand, runScriptCommand } from './project.mjs'
import { confirm, runPackageManager } from './interactive.mjs'
import { runReview } from './review/run.mjs'
import { renderGitHub, renderJson, renderMarkdown, renderTerminal } from './review/report.mjs'
import { addArtifact } from './write.mjs'
import { initTemplate } from './scaffold.mjs'
import { readProjectConfig, brandCustomization } from './config.mjs'
import { readLock, recordInstall, removeFromLock, fileDigest, LOCK_NAME } from './lockfile.mjs'
import { planRemoval } from './remove.mjs'
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

/**
 * An artifact response's files, keyed by basename.
 *
 * `code` OR `source`, because the two endpoints disagree and always have:
 * an effect's files carry `code` (they are generated per framework) while a
 * block's carry `source` (they are files on disk). Reading only `source`
 * made `diff` report every effect as identical to the catalog no matter
 * what the local file said — the map came back empty, every lookup missed,
 * and the command printed its "matches the catalog" success line. A wrong
 * answer that looks like a right one, which is why this is a helper now
 * rather than a field access repeated at each call site.
 */
function catalogFilesOf(data) {
  return new Map(
    (data.files ?? []).map((file) => [path.basename(file.path), file.source ?? file.code]),
  )
}

/**
 * The revision on an artifact response.
 *
 * Effects put it on `effect`, everything else on `artifact`. There is no
 * top-level copy, so reading `data.revision` — which looks like the obvious
 * thing — silently yields undefined for every tier.
 */
function revisionOf(data) {
  return data.effect?.revision ?? data.artifact?.revision ?? null
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
  const missing = new Set()
  const missingOnDryRun = []

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

        /*
         * Record what landed, so `hoverlab outdated` has something to
         * compare against later. Awaited rather than fired and forgotten
         * like `reportInstall`: that one is telemetry we can afford to
         * lose, this is the only record that this project owns a copy of
         * this artifact, and losing it silently breaks the feature it
         * exists for.
         */
        await recordInstall({
          id: result.artifact.id,
          level: result.level,
          revision: result.artifact.revision,
          // Effects only — see the note in lockfile.mjs.
          framework: result.level === 'effect' ? result.framework : undefined,
          files: result.files ?? [],
        })
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

      // Collected, not printed per artifact: three blocks that all need
      // lucide-react want one install line at the end, not three.
      if (!result.dryRun) for (const dep of result.missingDeps) missing.add(dep)
      else if (result.missingDeps.length) missingOnDryRun.push(...result.missingDeps)
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

  await offerDependencies({ missing: [...missing], dryRunMissing: missingOnDryRun, flags })

  if (failures > 0 && failures === ids.length) {
    const err = new Error('Nothing was installed.')
    err.quiet = true
    throw err
  }
}

/**
 * The packages an install left missing: install them, or say the command.
 *
 * WHAT HAPPENS, AND WHEN
 *
 *   --yes                        install them, no question
 *   a person at a terminal       ask once, default yes
 *   a pipe, CI, an agent's shell print the command for the project's own
 *                                package manager and change nothing
 *   --no-install                 print the command, never ask
 *
 * The command is built for the manager the project uses — `pnpm add`, not the
 * `npm i` this used to print regardless, which in a pnpm or yarn workspace
 * either fails or writes a second lockfile beside the real one.
 *
 * A failed install is reported and does not fail the run: the files are on
 * disk and correct, and the user needs one command, not a stack trace.
 */
async function offerDependencies({ missing, dryRunMissing, flags }) {
  const cwd = process.cwd()

  if (dryRunMissing.length) {
    const manager = await detectPackageManager(cwd)
    const { display } = addCommand(manager.name, [...new Set(dryRunMissing)])
    out(`  ${yellow('!')} ${dim(`would need: ${display}`)}`)
  }
  if (missing.length === 0) return

  const manager = await detectPackageManager(cwd)
  const command = addCommand(manager.name, missing)

  const wantsInstall =
    flags['no-install'] === true
      ? false
      : await confirm(`Install ${missing.join(', ')} with ${manager.name}?`, {
          yes: flags.yes === true,
        })

  if (!wantsInstall) {
    out(`${yellow('!')} ${dim(`Still to install: ${command.display}`)}`)
    return
  }

  out(dim(`${manager.reason} — running ${command.display}`))
  try {
    const { code, error } = await runPackageManager({
      command: command.command,
      args: command.args,
      cwd: manager.root ?? cwd,
    })
    if (code !== 0) {
      out(`${yellow('!')} ${dim(error ?? `${command.display} exited ${code}. Run it yourself to see why.`)}`)
    }
  } catch (error) {
    out(`${yellow('!')} ${dim(error.message)}`)
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
  // The manager whoever ran this is using, not a hard-coded npm: a template
  // has no lockfile yet, so the only signals are `packageManager` in the
  // template, a lockfile in a parent workspace, or how this was launched
  // (`pnpm dlx hoverlab` says pnpm).
  const manager = (await detectPackageManager(result.directory)).name
  out(`    ${installAllCommand(manager).display}`)
  out(`    ${runScriptCommand(manager, 'dev').display}`)
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
  // hover effect, the input group, the form block, the page or the
  // storefront template, and only the user knows which — so show all five
  // and let them pick.
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

  /*
   * Assembly first. Someone searching "pricing" who can have the whole
   * pricing page should be told that before being shown nine buttons; a
   * primitive before an effect, because a primitive is a working control
   * and an effect is a style on one.
   *
   * This list has to hold every entry in `LEVELS`. When the primitive tier
   * was added to that array, the search started fetching primitives and
   * this loop kept silently dropping them — the header said "6 matches
   * across the catalog" and printed five, which is worse than not
   * searching the tier at all.
   */
  for (const level of SEARCH_ORDER) {
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
 *  outdated / diff
 * ------------------------------------------------------------------ */

/**
 * `hoverlab outdated` — which installed artifacts have moved on.
 *
 * WHY THIS COMMAND EXISTS. Hoverlab installs source you own, which is the
 * product and also the reason a fix could never reach anyone: the moment
 * the file is in your repo, the catalog has no idea it exists. Pro sells a
 * twelve-month update window and this is the first thing that makes it a
 * delivery mechanism rather than a sentence on a pricing page.
 *
 * IT NEVER TOUCHES YOUR FILES. Reporting is the whole job. There is no
 * `--fix`, deliberately: the file is yours, you have almost certainly
 * edited it, and a command that overwrote local changes on the strength of
 * a hash comparison would be the most destructive thing this CLI could do.
 * `hoverlab diff <id>` shows what changed; applying it is a person's call.
 *
 * NOTHING ABOUT YOUR PROJECT IS SENT. The revisions endpoint is asked for
 * everything and the comparison happens locally — see `getRevisions` for
 * why asking for less would tell the server more.
 */
export async function commandOutdated(_args, flags) {
  const lock = await readLock()
  const entries = Object.entries(lock.artifacts)

  if (entries.length === 0) {
    if (flags.json) {
      out(JSON.stringify({ tracked: 0, outdated: [], unknown: [] }, null, 2))
      return
    }
    out(dim(`No ${LOCK_NAME} here — nothing installed by this CLI to check.`))
    out(`${dim('It is written the next time you run')} ${cyan('hoverlab add <id>')}`)
    return
  }

  let catalog
  try {
    catalog = await getRevisions()
  } catch (error) {
    throw new Error(
      `Could not fetch catalog revisions: ${error.message}\n` +
        '  Your files are untouched — this command only reads.',
    )
  }

  const changed = []
  const unknown = []

  for (const [id, entry] of entries) {
    const current = catalog.artifacts?.[id]
    if (!current) {
      // Retired, renamed, or from a different deployment. Named rather than
      // dropped: an id that has left the catalog is worth knowing about.
      unknown.push(id)
      continue
    }
    if (current.revision !== entry.revision) {
      changed.push({
        id,
        level: entry.level,
        from: entry.revision,
        to: current.revision,
        updated: current.updated,
      })
    }
  }

  if (flags.json) {
    out(JSON.stringify({ tracked: entries.length, outdated: changed, unknown }, null, 2))
    return
  }

  if (changed.length === 0 && unknown.length === 0) {
    const plural = entries.length === 1 ? 'artifact is' : 'artifacts are'
    out(`${green('OK')} All ${entries.length} tracked ${plural} up to date.`)
    return
  }

  if (changed.length > 0) {
    out(`${yellow('!')} ${bold(String(changed.length))} of ${entries.length} have changed in the catalog:`)
    out()
    for (const item of changed) {
      out(`  ${cyan(item.id)} ${dim(`(${item.level})`)}`)
      const when = item.updated ? dim(`  ·  updated ${item.updated}`) : ''
      out(`    ${dim(`${item.from} -> ${item.to}`)}${when}`)
    }
    out()
    out(`${dim('See what changed:')} ${cyan(`hoverlab diff ${changed[0].id}`)}`)
    out(dim('Nothing has been written. Your copies are untouched.'))
  }

  if (unknown.length > 0) {
    out()
    const plural = unknown.length === 1 ? 'id is' : 'ids are'
    out(dim(`${unknown.length} tracked ${plural} not in the catalog: ${unknown.join(', ')}`))
    out(dim('They may have been renamed or retired.'))
  }
}

/**
 * `hoverlab diff <id>` — the catalog's current copy against yours.
 *
 * A line-level diff computed locally, with no diff library: the artifacts
 * here are a few hundred lines and a longest-common-subsequence over that
 * takes milliseconds, where a dependency would be a permanent cost to every
 * consumer of this package.
 *
 * Prints and exits. Same reasoning as `outdated`: the file is yours.
 */
export async function commandDiff(ids, flags) {
  if (ids.length === 0) {
    throw new Error('Which one? Try `hoverlab outdated` to see what has changed.')
  }

  if (flags.json) {
    // Deliberately unsupported. Anyone scripting this wants the machine
    // answer from `outdated --json`; a bespoke diff schema here would be a
    // second format to keep stable for no reader.
    out(dim('--json is not supported for diff — use `hoverlab outdated --json`.'))
  }

  const lock = await readLock()

  for (const id of ids) {
    const entry = lock.artifacts[id]
    if (!entry) {
      out(`${yellow('!')} ${cyan(id)} ${dim(`is not in ${LOCK_NAME} — nothing to compare.`)}`)
      continue
    }

    // Fetched in the framework this project installed, or the API's
    // default when the entry predates that being recorded.
    const data = assertUnlocked(
      await getArtifact(id, { deep: false, ...(entry.framework ? { framework: entry.framework } : {}) }),
    )
    const catalogFiles = catalogFilesOf(data)

    let printed = false

    for (const relative of entry.files) {
      let local
      try {
        local = await readFile(path.resolve(process.cwd(), relative), 'utf8')
      } catch {
        out(`${yellow('!')} ${dim(`${relative} is gone from disk.`)}`)
        continue
      }

      const current = catalogFiles.get(path.basename(relative))
      if (current === undefined) continue

      const lines = lineDiff(local, current)
      if (lines.length === 0) continue

      printed = true
      const plural = lines.length === 1 ? 'line' : 'lines'
      out(`${bold(relative)} ${dim(`— ${lines.length} changed ${plural}`)}`)
      for (const line of lines.slice(0, 60)) {
        out(line.startsWith('+') ? green(line) : yellow(line))
      }
      if (lines.length > 60) out(dim(`  ... ${lines.length - 60} more`))
      out()
    }

    if (!printed) {
      out(`${green('OK')} ${cyan(id)} ${dim('matches the catalog.')}`)
    }
  }
}

/**
 * `hoverlab update <id...>` — apply the catalog's newer copy, safely.
 *
 * ── WHY THIS IS NOT THE `--fix` `outdated` REFUSES TO HAVE ──────────────
 *
 * The header on `commandOutdated` rules out overwriting on the strength of
 * a hash comparison against the CATALOG, and it is right to: that
 * comparison says the upstream file changed, not that yours did not. This
 * command asks a different question, one the lockfile can now answer —
 * is your copy byte-for-byte what we wrote when you installed it?
 *
 * If it is, replacing it destroys nothing, because there is nothing there
 * to destroy that we did not put there ourselves. If it is not — you edited
 * it, a formatter touched it, or it predates the hashes and we simply
 * cannot tell — this refuses to touch it and points at `diff`. There is no
 * heuristic and no merge: every file is either provably untouched or left
 * alone.
 *
 * `--force` exists for the person who knows their edits are disposable, and
 * says so explicitly rather than as a side effect of running an update.
 * `--dry-run` prints the same report and writes nothing.
 */
export async function commandUpdate(ids, flags) {
  const lock = await readLock()
  const tracked = Object.keys(lock.artifacts)

  if (tracked.length === 0) {
    out(dim(`No ${LOCK_NAME} here — nothing installed by this CLI to update.`))
    out(`${dim('It is written the next time you run')} ${cyan('hoverlab add <id>')}`)
    return
  }

  // No ids means "everything the catalog has moved on from", which is the
  // shape of the question people arrive with after running `outdated`.
  let targets = ids
  if (targets.length === 0) {
    let catalog
    try {
      catalog = await getRevisions()
    } catch (error) {
      throw new Error(
        `Could not fetch catalog revisions: ${error.message}\n` +
          '  Your files are untouched — nothing was written.',
      )
    }
    targets = tracked.filter(
      (id) => catalog.artifacts?.[id] && catalog.artifacts[id].revision !== lock.artifacts[id].revision,
    )
    if (targets.length === 0) {
      out(`${green('OK')} Everything tracked is already up to date.`)
      return
    }
    out(dim(`${targets.length} outdated: ${targets.join(', ')}`))
    out()
  }

  const dryRun = flags['dry-run'] === true
  const force = flags.force === true
  let updated = 0
  let skipped = 0

  for (const id of targets) {
    const entry = lock.artifacts[id]
    if (!entry) {
      out(`${yellow('!')} ${cyan(id)} ${dim(`is not in ${LOCK_NAME} — use`)} ${cyan(`hoverlab add ${id}`)}`)
      skipped += 1
      continue
    }

    let data
    try {
      data = assertUnlocked(
        await getArtifact(id, { deep: false, ...(entry.framework ? { framework: entry.framework } : {}) }),
      )
    } catch (error) {
      out(`${yellow('!')} ${cyan(id)} ${dim(error.message)}`)
      skipped += 1
      continue
    }

    const catalogFiles = catalogFilesOf(data)

    /*
      Every file is checked before any file is written.

      A partial update is the one outcome worse than no update: half an
      artifact at the new revision and half at the old compiles, runs, and
      is wrong in a way nobody thinks to look for. So the loop below only
      decides, and the writes happen after — all of them or none.
    */
    const plan = []
    const blocked = []

    for (const relative of entry.files) {
      const absolute = path.resolve(process.cwd(), relative)
      const next = catalogFiles.get(path.basename(relative))
      if (next === undefined) continue

      let local
      try {
        local = await readFile(absolute, 'utf8')
      } catch {
        blocked.push({ relative, why: 'is gone from disk' })
        continue
      }

      if (local === next) continue // already current

      const recorded = entry.hashes?.[relative]
      if (!recorded) {
        blocked.push({
          relative,
          why: 'was installed before update tracking, so we cannot tell if you edited it',
        })
        continue
      }
      if (fileDigest(local) !== recorded) {
        blocked.push({ relative, why: 'has local changes' })
        continue
      }

      plan.push({ absolute, relative, next })
    }

    if (blocked.length > 0 && !force) {
      out(`${yellow('!')} ${cyan(id)} ${dim('not updated:')}`)
      for (const item of blocked) out(`    ${bold(item.relative)} ${dim(item.why)}`)
      out(`    ${dim('See what would change:')} ${cyan(`hoverlab diff ${id}`)}`)
      out(`    ${dim('Or overwrite anyway:')} ${cyan(`hoverlab update ${id} --force`)}`)
      skipped += 1
      continue
    }

    if (force) {
      // With --force the blocked files are written too, so they have to be
      // put back into the plan rather than merely reported.
      for (const item of blocked) {
        const next = catalogFiles.get(path.basename(item.relative))
        if (next === undefined) continue
        plan.push({
          absolute: path.resolve(process.cwd(), item.relative),
          relative: item.relative,
          next,
        })
      }
    }

    if (plan.length === 0) {
      /*
        Every file already matches the catalog, but the recorded revision
        may not — an artifact can be re-published with a new revision and
        byte-identical output (a description edit, a re-run of the build).
        Without this the lockfile keeps the old revision, `outdated` reports
        it forever, and running `update` appears to do nothing about it.
        Syncing the record is the actual update in that case.
      */
      const nextRevision = revisionOf(data)
      if (nextRevision && nextRevision !== entry.revision && !dryRun) {
        await recordInstall({
          id,
          level: entry.level,
          revision: nextRevision,
          framework: entry.framework,
          files: entry.files.map((relative) => path.resolve(process.cwd(), relative)),
        })
        out(`${green('✓')} ${cyan(id)} ${dim('files already matched — recorded the new revision.')}`)
        updated += 1
        continue
      }
      out(`${green('OK')} ${cyan(id)} ${dim('is already current.')}`)
      continue
    }

    if (dryRun) {
      out(`${cyan(id)} ${dim(`would update ${plan.length} file${plan.length === 1 ? '' : 's'}:`)}`)
      for (const item of plan) out(`    ${item.relative}`)
      updated += 1
      continue
    }

    for (const item of plan) await writeFile(item.absolute, item.next, 'utf8')

    /*
      Re-recorded with the artifact's WHOLE file list, not just the ones
      that changed. `recordInstall` replaces the entry outright, so passing
      only the plan would drop every untouched file out of the lockfile and
      leave `outdated` tracking a fraction of what is installed. Re-hashing
      all of them off disk is also what keeps the next `update` comparing
      against what is actually there rather than against an install from
      months ago.
    */
    await recordInstall({
      id,
      level: entry.level,
      revision: revisionOf(data),
      framework: entry.framework,
      files: entry.files.map((relative) => path.resolve(process.cwd(), relative)),
    })

    out(
      `${green('✓')} Updated ${cyan(id)} ${dim(
        `— ${plan.length} file${plan.length === 1 ? '' : 's'}${force && blocked.length ? ', overwriting local changes' : ''}`,
      )}`,
    )
    updated += 1
  }

  out()
  const verb = dryRun ? 'would be updated' : 'updated'
  out(dim(`${updated} ${verb}, ${skipped} skipped.`))
  if (skipped > 0 && !force) {
    out(dim('Skipped artifacts keep your edits. Nothing was overwritten.'))
  }
}

/**
 * Changed lines between two texts, as `+`/`-` prefixed strings.
 *
 * A plain longest-common-subsequence table. Bounded by the sizes this CLI
 * deals with — the largest block is under 400 lines, so the table is under
 * 160k cells and finishes instantly. Nothing points this at a large file.
 */
export function lineDiff(before, after) {
  /*
   * Line endings are normalised first, and this is not a detail.
   *
   * The catalog serves LF. A file written or touched on Windows — by an
   * editor, a formatter, or git's autocrlf — comes back CRLF, so every
   * single line differs by a trailing carriage return and the diff reports
   * the whole file as changed. The first run of this on Windows called a
   * two-line edit "376 changed lines", which is worse than no diff at all:
   * it teaches the reader to ignore the command.
   */
  const a = before.replace(/\r\n/g, '\n').split('\n')
  const b = after.replace(/\r\n/g, '\n').split('\n')

  const table = Array.from({ length: a.length + 1 }, () => new Uint32Array(b.length + 1))
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i][j] =
        a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1])
    }
  }

  const result = []
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++
      j++
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      result.push(`- ${a[i++]}`)
    } else {
      result.push(`+ ${b[j++]}`)
    }
  }
  while (i < a.length) result.push(`- ${a[i++]}`)
  while (j < b.length) result.push(`+ ${b[j++]}`)

  return result
}

/* ------------------------------------------------------------------ *
 *  help
 * ------------------------------------------------------------------ */


/* ------------------------------------------------------------------ *
 *  review
 * ------------------------------------------------------------------ */

/**
 * `hoverlab remove <id...>` — take an installed artifact back out.
 *
 * The lockfile is the whole basis for this: it records which files an `add`
 * wrote and the hash of each as it was written, so removal can prove a file
 * is still exactly what was installed before deleting it. Everything else is
 * kept and named — edited files, files another installed artifact also uses,
 * files something else still imports. See remove.mjs for why each.
 *
 * WHAT IT DOES NOT DO: uninstall packages. `lucide-react` is in your
 * package.json because your project uses it, not because a block did, and
 * the lockfile does not record which dependency an artifact brought.
 *
 * Nothing is deleted without a yes. A person at a terminal is asked once;
 * anywhere else the plan is printed and nothing changes until `--yes`.
 */
export async function commandRemove(ids, flags) {
  if (ids.length === 0) {
    throw new Error('Which one? `hoverlab outdated` lists what this project has installed.')
  }

  const cwd = process.cwd()
  const lock = await readLock(cwd)
  const plans = []

  for (const id of ids) {
    const entry = lock.artifacts[id]
    if (!entry) {
      out(
        `${yellow('!')} ${cyan(id)} ${dim(`is not in ${LOCK_NAME}, so there is no record of what to remove.`)}`,
      )
      out(dim('  Installed before the lockfile existed, or in another directory? Delete its files by hand.'))
      continue
    }
    plans.push(
      await planRemoval({ id, entry, artifacts: lock.artifacts, cwd, force: flags.force === true }),
    )
  }

  if (plans.length === 0) {
    process.exitCode = 1
    return
  }

  for (const plan of plans) {
    out(`${bold(plan.id)}`)
    for (const file of plan.remove) out(`  ${yellow('-')} ${dim(displayPath(file, cwd))}`)
    for (const file of plan.missing) out(`  ${dim(`· ${displayPath(file, cwd)} is already gone`)}`)
    for (const item of plan.keep) {
      out(`  ${green('=')} ${dim(`${displayPath(item.file, cwd)} — kept, ${item.why}: ${item.detail}`)}`)
    }
    for (const bad of plan.unsafe) out(`  ${yellow('!')} ${dim(`ignored an unsafe path in ${LOCK_NAME}: ${bad}`)}`)
  }

  const total = plans.reduce((n, plan) => n + plan.remove.length, 0)
  const kept = plans.reduce((n, plan) => n + plan.keep.length, 0)

  if (flags['dry-run'] === true) {
    out()
    out(dim(`Dry run: would delete ${total} file${total === 1 ? '' : 's'}, keep ${kept}. Nothing was changed.`))
    return
  }

  out()
  const go =
    total === 0
      ? true // nothing to delete: only the lockfile entry goes, which loses nothing
      : await confirm(`Delete ${total} file${total === 1 ? '' : 's'}?`, {
          yes: flags.yes === true,
          defaultYes: false,
        })

  if (!go) {
    out(dim('Nothing was removed.'))
    if (!process.stdin.isTTY || process.env.CI) out(dim('Not at a terminal — re-run with --yes to apply.'))
    process.exitCode = 1
    return
  }

  for (const plan of plans) {
    for (const file of plan.remove) await unlink(file)
    await pruneEmptyDirs(plan.remove, cwd)
    await removeFromLock(plan.id, cwd)
  }

  out(`${green('✓')} Removed ${total} file${total === 1 ? '' : 's'} and ${plans.length} lockfile entr${plans.length === 1 ? 'y' : 'ies'}.`)
  if (kept > 0) {
    out(dim(`  ${kept} kept file${kept === 1 ? ' is' : 's are'} yours now, or still tracked by something else. Re-run with --force to delete edited or imported ones.`))
  }
  out(dim('  Packages it needed stay in package.json — remove any that nothing else uses.'))
}

/**
 * Delete directories a removal emptied, and stop at the first that is not.
 *
 * `rmdir` rather than a recursive remove, deliberately: it fails on a
 * directory with anything left in it, which is the whole safety property. The
 * walk goes upward from each deleted file and never past the project root.
 */
async function pruneEmptyDirs(files, root) {
  const dirs = new Set(files.map((file) => path.dirname(file)))
  for (const start of dirs) {
    let dir = start
    while (dir.startsWith(root + path.sep)) {
      try {
        await rmdir(dir)
      } catch {
        break
      }
      dir = path.dirname(dir)
    }
  }
}

/* ------------------------------------------------------------------ *
 *  doctor
 * ------------------------------------------------------------------ */

const red = paint('31')

/**
 * `hoverlab doctor` — check that this project can run Hoverlab code.
 *
 * The checks and what each status means are in doctor.mjs; this only prints.
 * Exit 1 is reserved for `fail`, which is the CLI being unable to work here at
 * all. Everything a project can fix is a `warn` with the line that fixes it.
 */
export async function commandDoctor(_args, flags) {
  const version = createRequire(import.meta.url)('../package.json').version
  const { checks, summary } = await runDoctor({ offline: flags.offline === true, version })

  if (flags.json) {
    out(JSON.stringify({ checks, summary }, null, 2))
  } else {
    const glyph = {
      pass: green('✓'),
      warn: yellow('!'),
      fail: red('✗'),
      info: dim('·'),
    }
    for (const item of checks) {
      out(`${glyph[item.status]} ${item.title}`)
      if (item.detail) out(`    ${dim(item.detail)}`)
      if (item.fix) out(`    ${cyan('→')} ${item.fix}`)
    }
    out()
    out(
      `${summary.pass} ok · ${summary.warn} to look at · ${summary.fail} failed` +
        dim(summary.warn + summary.fail === 0 ? '' : '  — each has the line that fixes it'),
    )
  }

  if (summary.fail > 0) process.exitCode = 1
}

/* ------------------------------------------------------------------ *
 *  rules
 * ------------------------------------------------------------------ */

/**
 * Which rules targets a project has evidence of using.
 *
 * `AGENTS.md` is the fallback rather than a guess about the editor: it is the
 * one file most agents read, so writing it is right when nothing else says
 * which tool is in play.
 */
async function detectRuleTargets(root) {
  const has = async (relative) => {
    try {
      await stat(path.join(root, relative))
      return true
    } catch {
      return false
    }
  }
  const found = []
  if (await has('.cursor')) found.push('cursor')
  if (await has('.windsurf')) found.push('windsurf')
  if (await has('AGENTS.md')) found.push('agents')
  if ((await has('CLAUDE.md')) || (await has('.claude'))) found.push('claude')
  return found.length ? found : ['agents']
}

/**
 * `hoverlab rules [cursor|windsurf|agents|claude|all]`
 *
 * Writes the instruction files that tell an editor's agent to search the
 * catalog before it invents a component. Built from the published skill, so
 * there is one source of what an agent is told and no counts typed here.
 *
 * The shared files (AGENTS.md, CLAUDE.md) are the user's own, so only a
 * marked section is ever written and everything outside it is left alone —
 * rules.mjs is where that guarantee lives and is tested. Cursor's and
 * Windsurf's files are ours entirely and are simply rewritten.
 *
 *   --check    write nothing; exit 1 if any file is missing or out of date,
 *              for CI, since the files copy text that changes
 *   --remove   take the section (or file) back out
 *   --dry-run  print what would be written
 */
export async function commandRules(args, flags) {
  const cwd = process.cwd()
  const root = (await findProjectRoot(cwd)) ?? cwd

  const known = Object.keys(RULE_TARGETS)
  const named = args.filter((arg) => arg !== 'all')
  const unknown = named.filter((arg) => !known.includes(arg))
  if (unknown.length) {
    throw new Error(`Unknown target "${unknown[0]}". Pick from: ${known.join(', ')}, or all.`)
  }

  const targets = args.includes('all')
    ? known
    : named.length
      ? [...new Set(named)]
      : await detectRuleTargets(root)

  const readIfPresent = async (file) => {
    try {
      return await readFile(file, 'utf8')
    } catch {
      return null
    }
  }

  if (flags.remove) {
    for (const id of targets) {
      const target = RULE_TARGETS[id]
      const file = path.join(root, target.path)
      const existing = await readIfPresent(file)
      if (existing === null) {
        out(`${dim('·')} ${dim(`${target.path} does not exist`)}`)
        continue
      }
      if (target.managed) {
        const { text, found, empty } = removeManagedSection(existing)
        if (!found) {
          out(`${dim('·')} ${dim(`no Hoverlab section in ${target.path}`)}`)
          continue
        }
        if (flags['dry-run']) {
          out(`Would remove the Hoverlab section from ${target.path}`)
          continue
        }
        if (empty) await unlink(file)
        else await writeFile(file, text, 'utf8')
        out(`${green('✓')} Removed the Hoverlab section from ${target.path}${empty ? dim(' (the file is gone — nothing else was in it)') : ''}`)
      } else {
        if (flags['dry-run']) {
          out(`Would delete ${target.path}`)
          continue
        }
        const yes = await confirm(`Delete ${target.path}?`, { yes: flags.yes === true, defaultYes: false })
        if (!yes) {
          out(dim(`Kept ${target.path}. Re-run with --yes to delete it.`))
          continue
        }
        await unlink(file)
        out(`${green('✓')} Deleted ${target.path}`)
      }
    }
    return
  }

  const skill = await getSkill('hoverlab')
  let stale = 0

  for (const id of targets) {
    const rendered = renderRules(id, skill)
    const file = path.join(root, rendered.path)
    const existing = await readIfPresent(file)
    const next = rendered.managed
      ? mergeManagedSection(existing ?? '', rendered.content)
      : rendered.content

    if (existing === next) {
      out(`${green('✓')} ${rendered.path} ${dim('is already current')}`)
      continue
    }

    stale++

    if (flags.check) {
      out(`${yellow('!')} ${rendered.path} ${dim(existing === null ? 'is missing' : 'is out of date')}`)
      continue
    }
    if (flags['dry-run']) {
      out(`${dim('Would write')} ${rendered.path} ${dim(`(${rendered.size.chars} chars)`)}`)
      continue
    }

    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, next, 'utf8')
    out(
      `${green('✓')} ${existing === null ? 'Wrote' : 'Updated'} ${rendered.path} ` +
        dim(`(${RULE_TARGETS[id].label})`),
    )
    if (rendered.dropped.length) {
      out(`  ${dim(`left out to fit ${RULE_TARGETS[id].label}'s size limit: ${rendered.dropped.join(', ')}`)}`)
    }
  }

  if (flags.check && stale > 0) process.exitCode = 1
}

const REVIEW_FORMATS = ['terminal', 'github', 'markdown', 'md', 'json']

/**
 * The GitHub blob URL for the checked-out commit, when we are in Actions.
 *
 * Findings in a pull-request comment link to the line they are about. The
 * base is assembled from the variables the runner always sets, so the CLI
 * needs no `--repo` flag and outside Actions it simply returns nothing and
 * locations render as plain text.
 */
function githubBlobBase(env = process.env) {
  const { GITHUB_SERVER_URL: server, GITHUB_REPOSITORY: repo, GITHUB_SHA: sha } = env
  if (!server || !repo || !sha) return undefined
  return `${server}/${repo}/blob/${sha}`
}

/**
 * Review components for design defects.
 *
 * Which files and which findings is `review/run.mjs`; this is the printing.
 *
 * WHAT SETS THE EXIT CODE
 *
 * Violations only. Advisories are questions the rules cannot close from
 * source — a 20px tap target that may pass by the spacing exception, a glow
 * that may be lighting rather than layout — and blocking a merge on a
 * question is how a check gets deleted, taking the violations with it.
 */
export async function commandReview(paths, flags) {
  const cwd = process.cwd()

  if (flags.format && !REVIEW_FORMATS.includes(flags.format)) {
    throw new Error(`Unknown --format "${flags.format}". Pick one of: ${REVIEW_FORMATS.join(', ')}.`)
  }

  const { findings, scope, fileCount, fixed } = await runReview({
    paths,
    base: flags.base ? String(flags.base) : undefined,
    cwd,
    fix: flags.fix === true,
    allLines: flags['all-lines'] === true,
    violationsOnly: flags['violations-only'] === true,
  })

  const format = flags.json ? 'json' : flags.format

  if (fixed) {
    // stderr, so a machine format on stdout stays parseable.
    const say = format ? (line) => process.stderr.write(`${line}\n`) : out
    say(
      fixed.rewrites === 0
        ? dim('Nothing to rewrite — no physical spacing utilities found.')
        : green(
            `Rewrote ${fixed.rewrites} physical spacing utilit${fixed.rewrites === 1 ? 'y' : 'ies'} ` +
              `in ${fixed.files} file${fixed.files === 1 ? '' : 's'}.`,
          ),
    )
    say(
      dim(
        'Only the physical-to-logical spacing codemod is applied. Everything else here ' +
          'is either a judgement call or has more than one correct fix.',
      ),
    )
  }

  if (format === 'json') {
    out(renderJson(findings))
  } else if (format === 'markdown' || format === 'md') {
    // Always printed, clean or not: a sticky comment has to be able to say
    // "no findings" to replace the one that said otherwise on the last push.
    out(renderMarkdown(findings, { scope, fileCount, blobBase: githubBlobBase() }))
  } else if (format === 'github') {
    if (findings.length > 0) out(renderGitHub(findings))
  } else if (fileCount === 0) {
    out(dim(`Nothing to review in ${scope}.`))
  } else {
    out(dim(`Reviewing ${scope}.`))
    out(
      renderTerminal(findings, {
        bold,
        dim,
        green,
        yellow,
        cyan,
        width: process.stdout.columns,
      }),
    )
  }

  if (findings.some((finding) => finding.severity === 'violation')) {
    process.exitCode = 1
  }
}
export function commandHelp() {
  out(`${bold('hoverlab')} — install UI from the Hoverlab catalog

Five rungs, one command surface: ${dim('effects')} (one element), ${dim('primitives')} (one
control), ${dim('blocks')} (one section), ${dim('pages')} (one screen), ${dim('templates')} (a
whole project).

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
  outdated             List installed artifacts the catalog has since changed
  diff <id...>         Show what changed between your copy and the catalog
  update [id...]       Apply the catalog's newer copy. Only touches files
                       you have not edited since installing them; with no
                       ids, updates everything outdated lists.
  remove <id...>       Take an installed artifact back out. Deletes only
                       files still exactly as installed, that nothing else
                       imports and no other artifact shares; keeps and names
                       the rest. Aliases: rm, uninstall
  doctor               Check this project can run Hoverlab code: Tailwind
                       version and colour mapping, the @/ path alias,
                       React, components.json, what is installed
  rules [target...]    Write agent rules files that point Cursor, Windsurf,
                       Claude Code and AGENTS.md-aware tools at the catalog.
                       Targets: cursor, windsurf, agents, claude, all
  review [path...]     Review your components for design defects —
                       accessibility, right-to-left, reduced motion, and
                       layout escapes. With no paths, reviews what you have
                       changed. Runs entirely on your machine.
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
      --base <ref>     review: review what this branch changes against a
                       base branch, measured from the merge base
      --all-lines      review: report every finding in a changed file, not
                       only the ones the change is responsible for
      --violations-only
                       review: drop the advisories
      --fix            review: apply the physical-to-logical spacing
                       codemod. Nothing else is rewritten
      --format <f>     review: terminal (default) | github (annotations) |
                       markdown (a pull-request comment body) | json
  -y, --yes            Answer yes: install the packages an add needs, confirm
                       a remove. Without it, nothing is installed or deleted
                       unless a person at a terminal says so
      --no-install     add: print the install command, never run or ask
      --offline        doctor: skip the network checks
      --check          rules: write nothing, exit 1 if a file is stale
      --remove         rules: take the rules back out
      --brand <id>    dna: apply a brand preset's accent
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

${bold('Reviewing your own code')}
  ${cyan('hoverlab review')} checks components for the design defects that survive
  code review because they are invisible to the person writing them:

    accessibility  18 rules over 10 WCAG 2.2 AA criteria decidable from
                   source — unnamed icon buttons, labels pointing at
                   nothing, paste blocked on a password field
    right-to-left  physical utilities that pin a layout to the left, and
                   glyphs that point the wrong way in Arabic or Hebrew
    motion         animation that runs forever with no reduced-motion route
    layout         sr-only text escaping a scroll container, which scrolls
                   the whole page sideways on a phone

  These are the same checks that run over every component in this catalog on
  every build, which is why they are worth pointing at yours: each one has
  been shaken out against real code, and the rules that were only nearly
  right were deleted rather than kept.

    npx hoverlab review                    ${dim('# what you have changed')}
    npx hoverlab review --base main        ${dim('# what your branch proposes')}
    npx hoverlab review src/components     ${dim('# a directory, in full')}
    npx hoverlab review --fix              ${dim('# apply the safe rewrites')}

  It runs entirely on your machine — no account, no key, no upload. On a
  pull request, the GitHub Action posts one comment and edits it in place on
  every push, and annotates the diff:

    - uses: actions/checkout@v4
      with: { fetch-depth: 0 }
    - uses: Vijetbhat6/hoverlab/packages/review-action@main

  Without the Action, ${dim('--format github')} turns findings into annotations and
  ${dim('--format markdown')} prints the comment body. Both need the merge base in
  history, which a default shallow checkout does not have.

  Violations set a non-zero exit code. Advisories are questions the rules
  cannot close from source — is that glow lighting or layout? does that drag
  have a keyboard alternative? — and never fail a run.

${bold('Editor integration')}
  Teach your agent the catalog, so it installs the right piece instead of
  writing a worse one from scratch:

    npx hoverlab skill hoverlab

  Or write rules files for the editors that do not read skills — Cursor,
  Windsurf, and anything that reads AGENTS.md. Your own text in a shared
  file is never touched; only a marked section is written:

    npx hoverlab rules

  Register the MCP server so your editor's agent can search and install
  from the catalog directly:

    claude mcp add hoverlab -- npx -y hoverlab mcp

  Or add this to your MCP client's config:

    { "mcpServers": { "hoverlab": { "command": "npx", "args": ["-y", "hoverlab", "mcp"] } } }

${dim('Set HOVERLAB_API_URL to point at a different deployment.')}`)
}
