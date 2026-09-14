/**
 * The extension's one door to the catalog.
 *
 * ── WHY IT DELEGATES INSTEAD OF FETCHING ────────────────────────────────
 *
 * Everything here is a thin call into the `hoverlab` package — the same
 * module `npx hoverlab add` runs and the same one the MCP server runs. That
 * is deliberate and it is the whole reason this extension is ~600 lines
 * rather than ~1,500.
 *
 * The tempting alternative is to call `/api/v1` with `fetch` and write the
 * files with `vscode.workspace.fs`. It would be about forty lines, and
 * those forty lines would be a second answer to every question the CLI has
 * already answered: which directory a block goes in for a Next app versus a
 * Vite one, whether a page brings the blocks it imports, which of the five
 * tiers an id belongs to, what to do when a file already exists, whether a
 * response came back locked, and whether an API-supplied path is trying to
 * escape the destination. Getting any of those subtly different would mean
 * the sidebar and the terminal install the same block two ways — the exact
 * bug that is hardest to notice and worst to have.
 *
 * ── WHY THE IMPORT IS DYNAMIC ───────────────────────────────────────────
 *
 * The CLI is ESM (`"type": "module"`); a VS Code extension's entry point is
 * CommonJS. `require()` cannot load ESM, so the bridge is `await import()`,
 * which Node has supported from CJS for years. It happens lazily on the
 * first command rather than at activation, so opening a window costs
 * nothing, and it is wrapped once here so that if the environment ever
 * refuses it the failure is one legible message instead of an undefined
 * function call somewhere deeper.
 *
 * ── WHY THE ORIGIN IS AN ENVIRONMENT VARIABLE ───────────────────────────
 *
 * `DEFAULT_ORIGIN` in the CLI is read from `HOVERLAB_API_URL` at module
 * load, and `addArtifact` takes no origin argument — installs go wherever
 * that constant points. So `hoverlab.apiUrl` is applied by setting the
 * variable before the first import, and changing the setting needs a window
 * reload. Documented in the setting's own description rather than papered
 * over, because the alternative was passing an origin through five call
 * sites in a published package to serve one preview-deployment use case.
 */

const vscode = require('vscode')

/**
 * The five rungs, and their names.
 *
 * Hardcoded here and nowhere else, with a guard below that checks them
 * against the CLI's once it loads. They cannot simply be imported: the tree
 * renders its five top-level rows synchronously, before anything has
 * awaited the dynamic import, and a sidebar that was empty until a promise
 * settled would look broken on every window open.
 *
 * So this is a cache with an alarm on it rather than a second opinion. The
 * shape of the catalog changes about once a year; being silently wrong
 * about it for a release is what happened to the primitive tier, and
 * `assertLevelsMatch` is what makes that loud here.
 */
const LEVELS = ['effect', 'primitive', 'block', 'page', 'template']

const LEVEL_PLURAL = {
  effect: 'effects',
  primitive: 'primitives',
  block: 'blocks',
  page: 'pages',
  template: 'templates',
}

/** What each tier is, in the few words a tree item has room for. */
const LEVEL_BLURB = {
  effect: 'One element — a hover, a loader, a background',
  primitive: 'One control — segmented control, combobox, field',
  block: 'One section — pricing, FAQ, navbar, checkout',
  page: 'A whole screen, assembled from blocks',
  template: 'A multi-page project you can run',
}

/**
 * Assembly first, for a mixed result list.
 *
 * If a whole page or template answers the request, the reader should see
 * that before a list of blocks to stitch together — and a primitive before
 * an effect, because a primitive is a working control and an effect is a
 * style on one. The same order the MCP server presents its results in, for
 * the same reason.
 */
const SEARCH_ORDER = ['template', 'page', 'block', 'primitive', 'effect']

/**
 * Levels that have a chrome-less render on the site.
 *
 * Effects are absent because they have no `/preview/effect/...` route —
 * they are html plus css, and the panel builds a document for them instead.
 * Templates are absent because a template is a project, not a component,
 * and there is nothing to render on one screen.
 */
const FRAMED_LEVELS = new Set(['primitive', 'block', 'page'])

let cli = null

/** Load the CLI once. Every call in this file goes through it. */
async function load() {
  if (cli) return cli
  try {
    cli = await import('hoverlab')
  } catch (error) {
    throw new Error(
      'Could not load the Hoverlab package that does the fetching and installing. ' +
        'If you are running this extension from a checkout, run `npm install` in ' +
        `packages/vscode first. (${error && error.message})`,
    )
  }
  assertLevelsMatch(cli)
  return cli
}

/**
 * Complain, once, if the catalog has grown a tier this file does not know.
 *
 * A console warning rather than a thrown error: a sidebar missing one of
 * six tiers is worth telling a developer about and is not worth breaking
 * the five that work. The message goes to the extension host log, which is
 * where somebody debugging "why is my new tier not showing up" looks.
 */
let checked = false
function assertLevelsMatch(loaded) {
  if (checked) return
  checked = true

  const theirs = Array.isArray(loaded.LEVELS) ? loaded.LEVELS : []
  const missing = theirs.filter((level) => !LEVELS.includes(level))
  const extra = LEVELS.filter((level) => !theirs.includes(level))

  if (missing.length || extra.length) {
    console.warn(
      '[hoverlab] the sidebar and the catalog disagree about the tiers.' +
        (missing.length ? ` Not shown: ${missing.join(', ')}.` : '') +
        (extra.length ? ` Shown but gone: ${extra.join(', ')}.` : '') +
        ' Update LEVELS in packages/vscode/src/catalog.js.',
    )
  }
}

function config() {
  return vscode.workspace.getConfiguration('hoverlab')
}

/**
 * Apply the configured origin, before anything imports the CLI.
 *
 * Called from `activate`. A no-op when the setting is empty, which is the
 * case for everyone not working on the catalog itself — and deliberately
 * not written when empty, so it cannot clobber a `HOVERLAB_API_URL` the
 * developer set in their own shell.
 */
function applyApiUrl() {
  const configured = String(config().get('apiUrl') || '').trim()
  if (configured) process.env.HOVERLAB_API_URL = configured.replace(/\/+$/, '')
}

/** The origin in play, for building links and frame URLs. */
async function origin() {
  const { DEFAULT_ORIGIN } = await load()
  return DEFAULT_ORIGIN
}

/** The public site, which is where a licence is bought whatever we read. */
async function siteUrl() {
  const { SITE_URL } = await load()
  return SITE_URL
}

/* ------------------------------------------------------------------ *
 *  Reading
 * ------------------------------------------------------------------ */

/**
 * Every artifact on one rung, paged out in full.
 *
 * The tree needs the whole tier to group it by category, and the list
 * endpoints cap `limit` — so this walks. Bounded by `pages` rather than
 * trusting `total`, because a server that reported a total it does not
 * serve would otherwise spin here forever.
 */
async function listLevel(level, { signal } = {}) {
  const { searchLevel } = await load()
  const out = []
  let offset = 0

  for (let page = 0; page < 30; page += 1) {
    const result = await searchLevel({ level, limit: 100, offset }, { signal })
    out.push(...result.items)
    offset += result.items.length
    if (out.length >= result.total || result.items.length === 0) break
  }

  return out
}

/** Search every rung at once. Returns a flat list, assembly first. */
async function searchEverything(query, { signal } = {}) {
  const { searchAll } = await load()
  const { results, errors } = await searchAll({ query, limit: 12 }, { signal })

  // Nothing answered: surface the first failure rather than "no matches",
  // which would blame the query for an outage.
  if (results.length > 0 && errors.length === results.length) throw errors[0]

  const flat = []
  for (const level of SEARCH_ORDER) {
    const result = results.find((r) => r.level === level)
    if (!result) continue
    for (const item of result.items) flat.push({ ...item, level })
  }
  return flat
}

/** One artifact in full, whichever rung it sits on. */
async function getArtifact(id, { deep = false, framework } = {}) {
  const { getArtifact: fetchArtifact } = await load()
  return fetchArtifact(id, { deep, framework })
}

/**
 * The framework to emit an effect as.
 *
 * `auto` means "ask the CLI", which reads it off the project's
 * dependencies — a Vue app gets an SFC, a Svelte app a Svelte component.
 * Returning undefined is how you say auto to the CLI, so the setting's
 * default never has to be translated into a guess here.
 */
function configuredFramework() {
  const value = String(config().get('framework') || 'auto')
  return value === 'auto' ? undefined : value
}

/* ------------------------------------------------------------------ *
 *  Writing
 * ------------------------------------------------------------------ */

/**
 * Install one artifact into a workspace folder.
 *
 * `cwd` is the folder, not a file: the CLI walks up from it looking for a
 * package.json and decides the destination from what it finds, so handing
 * it the folder the user picked is exactly the input `npx hoverlab add`
 * gets when run there.
 */
async function install(id, { cwd, force = false, dryRun = false }) {
  const { addArtifact } = await load()
  return addArtifact({
    id,
    cwd,
    force,
    dryRun,
    framework: configuredFramework(),
  })
}

/**
 * Scaffold a template into a new directory.
 *
 * `cwd` is passed explicitly and always. The CLI resolves `directory`
 * against it and falls back to `process.cwd()`, which in an editor is
 * wherever the extension host happened to start — usually not the user's
 * project, and occasionally somewhere alarming.
 */
async function initTemplate(id, { cwd, directory, force = false }) {
  const { initTemplate: scaffold } = await load()
  return scaffold({ id, cwd, directory, force })
}

/* ------------------------------------------------------------------ *
 *  The licence key
 * ------------------------------------------------------------------ */

async function licence() {
  const { resolveKey, keySource, maskKey } = await load()
  const key = await resolveKey()
  if (!key) return null
  return { masked: maskKey(key), source: await keySource() }
}

async function saveLicence(key) {
  const { saveKey, looksLikeKey } = await load()
  if (!looksLikeKey(key)) {
    throw new Error('That does not look like a Hoverlab key — they start with `hl_live_`.')
  }
  return saveKey(key.trim())
}

async function clearLicence() {
  const { clearKey } = await load()
  return clearKey()
}

/* ------------------------------------------------------------------ *
 *  Errors
 * ------------------------------------------------------------------ */

/**
 * Turn one of the CLI's error classes into something worth showing.
 *
 * The three it throws are genuinely different situations with genuinely
 * different fixes, and collapsing them into "something went wrong" is how
 * a user ends up checking their network because a file already existed.
 * Returns `{ message, actions }`, where an action is a button label the
 * caller knows how to handle.
 */
function describeError(error) {
  const name = error && error.name
  const message = (error && error.message) || String(error)

  if (name === 'LicenseError') {
    return {
      message,
      actions: ['Set licence key', 'Get a licence'],
      licence: true,
      url: error.url,
    }
  }

  if (name === 'WriteError') {
    // The one recoverable write failure, and the only one worth a button:
    // the CLI checks the whole plan before writing anything, so nothing has
    // been half-installed.
    const clash = /already exist/i.test(message)
    return { message, actions: clash ? ['Overwrite'] : [], overwrite: clash }
  }

  if (name === 'ApiError' && error.status === 0) {
    return { message, actions: ['Open settings'], settings: true }
  }

  return { message, actions: [] }
}

module.exports = {
  LEVELS,
  LEVEL_PLURAL,
  LEVEL_BLURB,
  FRAMED_LEVELS,
  SEARCH_ORDER,
  applyApiUrl,
  clearLicence,
  describeError,
  getArtifact,
  initTemplate,
  install,
  licence,
  listLevel,
  origin,
  saveLicence,
  searchEverything,
  siteUrl,
}
