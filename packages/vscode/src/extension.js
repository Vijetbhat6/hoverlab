/**
 * Hoverlab for VS Code, Cursor and Windsurf.
 *
 * ── THE GAP THIS CLOSES ─────────────────────────────────────────────────
 *
 * This catalog reaches developers three ways — a CLI, an MCP server and a
 * shadcn registry — and all three of them start with leaving the editor.
 * Shadcnblocks ships an extension for exactly these three editors that
 * searches and installs without doing that, and `/compare` had no answer
 * to it. Of everything in that table it was the one gap that mattered
 * most, because the editor is where the audience already is: the argument
 * the MCP server's own header makes — "developers increasingly do not
 * visit component sites, they ask the agent inside their editor" — applies
 * with equal force to the human holding the keyboard.
 *
 * ── WHAT IT IS, IN ONE LINE PER PART ────────────────────────────────────
 *
 *   A sidebar     five tiers, their categories, and everything in them.
 *   A search      one palette command across all five at once.
 *   A preview     the real component, framed from the site, in a tab.
 *   An install    the CLI's own writer, into the workspace folder.
 *   An MCP server offered to agent mode, with no config file to write.
 *
 * That last one is the reason this is not just a nicer CLI. VS Code lets an
 * extension *contribute* an MCP server, so installing this makes the whole
 * catalog searchable and installable by Copilot's agent mode without the
 * user hand-editing a JSON file — which is the step that loses most people
 * who would otherwise have used it.
 *
 * ── WHY THERE IS NO BUILD STEP ──────────────────────────────────────────
 *
 * Plain CommonJS, no bundler, no TypeScript. The CLI next door makes the
 * same choice for a stated reason (every dependency is latency a user
 * feels) and this one has its own: an extension is a thing people are
 * asked to trust with write access to their repo, and it should be
 * possible to read every line that ships without running a build first.
 * The cost is that `packages/cli` has to be `npm install`ed here — see
 * `catalog.js`, which is the only file that touches it.
 *
 * ── WHAT IT DELIBERATELY DOES NOT DO ────────────────────────────────────
 *
 * No account, no sign-in wall, no telemetry of its own. The catalog is
 * readable without a key and this surface does not change that: the licence
 * commands exist because the Pro templates need one, and they write to the
 * same `~/.hoverlab/config.json` that `hoverlab login` does, so the editor
 * and the terminal share one credential rather than each holding a copy.
 */

const vscode = require('vscode')

const catalog = require('./catalog')
const { CatalogTreeProvider } = require('./tree')
const { showPreview, openSource } = require('./preview')

/** The MCP server we offer to agent mode. Started on demand, by npx. */
const MCP_SERVER_LABEL = 'Hoverlab catalog'

function activate(context) {
  /*
   * Before anything can import the CLI. `DEFAULT_ORIGIN` is read from the
   * environment at module load, so a configured origin has to be in place
   * first or it would be ignored for the life of the window.
   */
  catalog.applyApiUrl()

  const tree = new CatalogTreeProvider()
  const view = vscode.window.createTreeView('hoverlab.catalog', {
    treeDataProvider: tree,
    showCollapseAll: true,
  })
  context.subscriptions.push(view)

  const register = (name, handler) => {
    context.subscriptions.push(
      vscode.commands.registerCommand(name, (...args) =>
        Promise.resolve(handler(...args)).catch((error) => report(error)),
      ),
    )
  }

  register('hoverlab.refresh', () => tree.refresh())
  register('hoverlab.search', () => search(context))
  register('hoverlab.preview', (node) => withNode(node, (level, entry) => showPreview(level, entry, context)))
  register('hoverlab.install', (node) => withNode(node, install))
  register('hoverlab.copySource', (node) => withNode(node, copySource))
  register('hoverlab.copyCommand', (node) => withNode(node, copyCommand))
  register('hoverlab.openOnWeb', (node) => withNode(node, openOnWeb))
  register('hoverlab.openBuilder', () => openBuilder())
  register('hoverlab.setLicenceKey', () => setLicenceKey())
  register('hoverlab.clearLicenceKey', () => clearLicenceKey())

  registerMcpServer(context)
}

function deactivate() {}

/* ------------------------------------------------------------------ *
 *  MCP
 * ------------------------------------------------------------------ */

/**
 * Offer `npx -y hoverlab mcp` to the editor's agent mode.
 *
 * ── WHY THIS IS THE MOST VALUABLE THING IN THE FILE ─────────────────────
 *
 * The MCP server has existed for a while and the instructions for using it
 * are two lines of JSON in a config file whose location differs per editor.
 * Every developer who would have used it and did not is lost at that step.
 * Contributing the server means installing this extension IS configuring
 * it, and the agent gets search, install, kit and design-matching tools
 * over all five tiers with nothing typed.
 *
 * ── WHY IT IS FEATURE-DETECTED RATHER THAN REQUIRED ─────────────────────
 *
 * `vscode.lm.registerMcpServerDefinitionProvider` is recent, and two of the
 * three editors this extension targets are forks that track upstream on
 * their own schedule. Guarding on the function's existence means Cursor and
 * Windsurf — and an older VS Code — get the sidebar, the search, the
 * preview and the install rather than a failed activation, which is what an
 * unguarded call would produce. The one part they lose is the part they can
 * still do by hand, and the README says so.
 *
 * `npx -y` rather than a bundled copy of the server on purpose: the tool
 * definitions teach an agent what the catalog can do, and a copy frozen at
 * extension-install time would teach it last quarter's answer.
 */
function registerMcpServer(context) {
  if (!vscode.workspace.getConfiguration('hoverlab').get('registerMcpServer')) return

  const lm = vscode.lm
  if (!lm || typeof lm.registerMcpServerDefinitionProvider !== 'function') return
  if (typeof vscode.McpStdioServerDefinition !== 'function') return

  try {
    context.subscriptions.push(
      lm.registerMcpServerDefinitionProvider('hoverlab.mcp', {
        provideMcpServerDefinitions() {
          return [
            new vscode.McpStdioServerDefinition(
              MCP_SERVER_LABEL,
              'npx',
              ['-y', 'hoverlab', 'mcp'],
              /*
               * The origin is forwarded so an agent reads the same catalog
               * the sidebar does. Without it, someone pointed at a preview
               * deployment would have a sidebar showing one catalog and an
               * agent installing from another.
               */
              process.env.HOVERLAB_API_URL
                ? { HOVERLAB_API_URL: process.env.HOVERLAB_API_URL }
                : undefined,
            ),
          ]
        },
      }),
    )
  } catch {
    /*
     * Swallowed, and this is the one place that is right. The provider is
     * an enhancement; an editor that accepts the call and then rejects the
     * definition shape must not take the sidebar down with it.
     */
  }
}

/* ------------------------------------------------------------------ *
 *  Search
 * ------------------------------------------------------------------ */

/**
 * One palette command across all five tiers.
 *
 * ── WHY A LIVE QUICK PICK AND NOT A PROMPT-THEN-LIST ────────────────────
 *
 * `showInputBox` then `showQuickPick` is two dialogs and one shot at the
 * query. The catalog's search requires every word to match, so the first
 * guess is often too specific — "a nice pricing table with a toggle"
 * returns nothing — and the fix is to shorten it, which in a two-dialog
 * flow means starting over. A live picker lets the reader watch the result
 * count fall and back off a word.
 *
 * ── THE RACE, WHICH IS THE ONLY SUBTLE PART ─────────────────────────────
 *
 * Keystrokes produce overlapping requests and they do not come back in
 * order, so a slow response to "pri" can land after a fast one to
 * "pricing" and replace the right answers with stale ones. Every request
 * carries a sequence number and a late one is dropped. Debounced too, so
 * typing a word is one request rather than seven.
 */
async function search(context) {
  const picker = vscode.window.createQuickPick()
  picker.title = 'Hoverlab — search the catalog'
  picker.placeholder = 'Two or three words: "pricing table", "combobox", "checkout page"'
  picker.matchOnDescription = true
  picker.matchOnDetail = true

  let sequence = 0
  let timer = null

  async function run(query) {
    const mine = ++sequence
    if (!query.trim()) {
      picker.items = []
      picker.busy = false
      return
    }

    picker.busy = true
    try {
      const results = await catalog.searchEverything(query)
      if (mine !== sequence) return

      picker.items = results.map((entry) => ({
        label: entry.name,
        description: `${entry.level} · ${entry.id}`,
        detail: entry.description,
        /*
         * The whole reason this list works.
         *
         * A QuickPick filters its own items against what is typed, which
         * is right when the items are a fixed list and wrong when they are
         * already a search result. The catalog matches on tags and
         * descriptions the row does not display, so searching "pricing"
         * returns `plan-comparison` — and the picker would then hide it for
         * not containing the word "pricing" anywhere on the row. Every
         * result the server chose is shown; the server did the matching.
         */
        alwaysShow: true,
        entry,
        level: entry.level,
      }))

      if (results.length === 0) {
        picker.items = [
          {
            label: `No match for "${query}"`,
            detail: 'Every word has to match, so try fewer or broader words.',
            alwaysShow: true,
          },
        ]
      }
    } catch (error) {
      if (mine !== sequence) return
      picker.items = [
        {
          label: 'Could not reach the catalog',
          detail: catalog.describeError(error).message,
          alwaysShow: true,
        },
      ]
    } finally {
      if (mine === sequence) picker.busy = false
    }
  }

  picker.onDidChangeValue((value) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => run(value), 200)
  })

  picker.onDidAccept(async () => {
    const chosen = picker.selectedItems[0]
    if (!chosen || !chosen.entry) return
    picker.hide()
    await showPreview(chosen.level, chosen.entry, context)
  })

  picker.onDidHide(() => {
    if (timer) clearTimeout(timer)
    picker.dispose()
  })

  picker.show()
}

/* ------------------------------------------------------------------ *
 *  Install
 * ------------------------------------------------------------------ */

/**
 * Write an artifact into the workspace.
 *
 * ── WHY IT ASKS WHICH FOLDER ────────────────────────────────────────────
 *
 * Only when there is more than one, and then always. A multi-root workspace
 * is usually an app and a package, or a frontend and an API, and guessing
 * the first one writes a React block into whichever happened to be added
 * first. One folder is not a question and is not asked.
 *
 * ── WHY THE CLASH IS A SECOND PROMPT AND NOT A FLAG ─────────────────────
 *
 * The CLI refuses to overwrite and lists what it would have hit, checking
 * the whole plan before writing anything — so a refusal means nothing was
 * half-installed and re-running with force is safe. That refusal is
 * surfaced as an Overwrite button rather than an `install --force` variant,
 * because the only moment a user can judge whether overwriting is fine is
 * after being told which files it would replace.
 */
async function install(level, entry) {
  const folder = await pickFolder()
  if (!folder) return

  if (level === 'template') return initTemplate(entry, folder)

  const result = await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: `Installing ${entry.name}…` },
    () => attemptInstall(entry, folder, false),
  )
  if (!result) return

  await announceInstall(entry, result)
}

/** Run the install, turning a clash into a prompt and a retry. */
async function attemptInstall(entry, folder, force) {
  try {
    return await catalog.install(entry.id, { cwd: folder.uri.fsPath, force })
  } catch (error) {
    const described = catalog.describeError(error)

    if (described.overwrite) {
      const choice = await vscode.window.showWarningMessage(
        described.message,
        { modal: true },
        'Overwrite',
      )
      if (choice !== 'Overwrite') return null
      return catalog.install(entry.id, { cwd: folder.uri.fsPath, force: true })
    }

    /*
     * `suggestInit` is the CLI telling us the id was a template and it
     * refuses to write a whole project over somebody's app. Acting on it
     * rather than reporting it, because from the sidebar the user clicked
     * install on a template and meant scaffold.
     *
     * Returns null afterwards, not the scaffold's result. Null is this
     * function's word for "nothing left to announce" — `initTemplate`
     * reports its own outcome, and handing its result back would get the
     * user two notifications for one action, the second of them counting
     * a project's files as though they had landed in their app.
     */
    if (error && error.suggestInit) {
      await initTemplate(entry, folder)
      return null
    }

    throw error
  }
}

/** What happened, and the two things a reader wants next. */
async function announceInstall(entry, result) {
  const files = result.files || []
  const missing = result.missingDeps || []

  const summary =
    `${entry.name} → ${files.length} file${files.length === 1 ? '' : 's'} in ` +
    shorten(result.directory) +
    (missing.length ? `. Install ${missing.join(', ')} to use it.` : '')

  const actions = files.length ? ['Open file'] : []
  if (missing.length) actions.push('Copy install command')

  const choice = await vscode.window.showInformationMessage(summary, ...actions)

  if (choice === 'Open file') {
    const document = await vscode.workspace.openTextDocument(vscode.Uri.file(files[0]))
    await vscode.window.showTextDocument(document)
  }

  if (choice === 'Copy install command') {
    await vscode.env.clipboard.writeText(`npm install ${missing.join(' ')}`)
    vscode.window.showInformationMessage('Copied.')
  }

  /*
   * Notes are the CLI's way of saying something true but not fatal — "this
   * is a React component and your project is not React", "a file with an
   * unsafe path was skipped". Shown separately so they are not lost in the
   * summary line, and only when there are any.
   */
  for (const note of result.notes || []) vscode.window.showWarningMessage(note)
}

/**
 * Scaffold a template into a directory of its own.
 *
 * A template is a project — its own package.json, its own tsconfig — and
 * writing those over an existing app is the most destructive thing this
 * extension could do. So the destination is a NEW folder inside the chosen
 * one, named after the template, and the name is confirmed.
 */
async function initTemplate(entry, folder) {
  const directory = await vscode.window.showInputBox({
    title: `Scaffold ${entry.name}`,
    prompt: `A new folder inside ${shorten(folder.uri.fsPath)}. A template is a whole project, so it never writes into an existing app.`,
    value: entry.id,
    validateInput: (value) =>
      /^[A-Za-z0-9._-]+$/.test(value.trim())
        ? null
        : 'A single folder name — letters, digits, dot, dash, underscore.',
  })
  if (!directory) return null

  const result = await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: `Scaffolding ${entry.name}…` },
    () => catalog.initTemplate(entry.id, { cwd: folder.uri.fsPath, directory: directory.trim() }),
  )

  const target = vscode.Uri.joinPath(folder.uri, directory.trim())
  const choice = await vscode.window.showInformationMessage(
    `${entry.name} scaffolded into ${directory.trim()} (${(result.files || []).length} files).`,
    'Open folder',
  )
  if (choice === 'Open folder') {
    await vscode.commands.executeCommand('vscode.openFolder', target, { forceNewWindow: true })
  }
  return result
}

/* ------------------------------------------------------------------ *
 *  The smaller commands
 * ------------------------------------------------------------------ */

async function copySource(level, entry) {
  const files = await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Window, title: `Fetching ${entry.name}…` },
    () => openSource(level, entry),
  )
  vscode.window.setStatusBarMessage(
    files.length === 1
      ? `${entry.name} — copied, and opened as an untitled file.`
      : `${entry.name} — ${files.length} files opened; the first is on the clipboard.`,
    5000,
  )
}

async function copyCommand(level, entry) {
  const command =
    level === 'template' ? `npx hoverlab init ${entry.id}` : `npx hoverlab add ${entry.id}`
  await vscode.env.clipboard.writeText(command)
  vscode.window.setStatusBarMessage(`Copied: ${command}`, 4000)
}

async function openOnWeb(level, entry) {
  const origin = await catalog.origin()
  await vscode.env.openExternal(vscode.Uri.parse(`${origin}/${level}/${entry.id}`))
}

/**
 * Open `/builder`, which is the one part of the catalog an extension should
 * not try to be.
 *
 * Dragging sections into a page needs a canvas that renders every block
 * live, and the honest place for that is the page that already does it — in
 * a browser, where the composition is a shareable URL. A webview
 * reimplementation would be a worse copy of a thing one click away.
 */
async function openBuilder() {
  const origin = await catalog.origin()
  await vscode.env.openExternal(vscode.Uri.parse(`${origin}/builder`))
}

async function setLicenceKey() {
  const existing = await catalog.licence()

  const key = await vscode.window.showInputBox({
    title: 'Hoverlab licence key',
    prompt: existing
      ? `Replacing ${existing.masked}. Only the Pro templates need this — everything else is readable without it.`
      : 'Only the Pro templates need this — every effect, primitive, block and page is readable without it.',
    password: true,
    placeHolder: 'hl_live_…',
    validateInput: (value) =>
      value.trim().startsWith('hl_live_') ? null : 'Keys start with `hl_live_`.',
  })
  if (!key) return

  const file = await catalog.saveLicence(key)
  vscode.window.showInformationMessage(
    `Key saved to ${shorten(file)} — the same one the hoverlab CLI reads, so your terminal has it too.`,
  )
}

async function clearLicenceKey() {
  const cleared = await catalog.clearLicence()
  vscode.window.showInformationMessage(
    cleared ? 'Licence key cleared.' : 'There was no stored key to clear.',
  )
}

/* ------------------------------------------------------------------ *
 *  Plumbing
 * ------------------------------------------------------------------ */

/**
 * Resolve the argument a command was invoked with.
 *
 * A tree row and the search picker both hand over a node. Nothing else
 * does — which is why these commands are hidden from the palette in
 * package.json, since a palette entry that can only ever say "pick
 * something first" is a menu item that does not work. This is the belt to
 * that braces: a keybinding or another extension can still invoke them
 * with nothing, and the answer has to be a sentence rather than a crash.
 */
function withNode(node, handler) {
  const resolved = node && node.entry ? node : null
  if (!resolved) {
    vscode.window.showInformationMessage(
      'Pick something in the Hoverlab sidebar first, or use Hoverlab: Search catalog.',
    )
    return undefined
  }
  return handler(resolved.level, resolved.entry)
}

/** The workspace folder to write into. Asks only when the answer is unclear. */
async function pickFolder() {
  const folders = vscode.workspace.workspaceFolders || []

  if (folders.length === 0) {
    vscode.window.showWarningMessage(
      'Open a folder first — installing writes files into your project.',
    )
    return null
  }

  if (folders.length === 1) return folders[0]

  return vscode.window.showWorkspaceFolderPick({
    placeHolder: 'Which folder should this be installed into?',
  })
}

/** Report an error with whatever button its kind deserves. */
async function report(error) {
  const described = catalog.describeError(error)
  const choice = await vscode.window.showErrorMessage(described.message, ...described.actions)

  if (choice === 'Set licence key') return setLicenceKey()

  if (choice === 'Get a licence') {
    const site = await catalog.siteUrl()
    return vscode.env.openExternal(vscode.Uri.parse(described.url || `${site}/pricing`))
  }

  if (choice === 'Open settings') {
    return vscode.commands.executeCommand('workbench.action.openSettings', 'hoverlab.apiUrl')
  }

  return undefined
}

/** A path short enough for a notification, with the home prefix dropped. */
function shorten(value) {
  const text = String(value || '')
  const folders = vscode.workspace.workspaceFolders || []
  for (const folder of folders) {
    const root = folder.uri.fsPath
    if (text.startsWith(root)) return text.slice(root.length).replace(/^[\\/]/, '') || '.'
  }
  return text
}

module.exports = { activate, deactivate }
