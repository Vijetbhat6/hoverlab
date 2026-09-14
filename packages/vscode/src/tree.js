/**
 * The Hoverlab sidebar: five tiers, their categories, and what is in them.
 *
 * ── WHY A TREE AND NOT A SEARCH BOX ALONE ───────────────────────────────
 *
 * Search answers "where is the pricing table". A tree answers the question
 * a developer cannot phrase — "what is in here" — and that is the question
 * a catalog has to answer first. Somebody who has never seen this catalog
 * does not know it has a primitive tier, or that there are thirty-odd
 * categories of block; typing at it would only ever return what they
 * already knew to ask for. Both exist, and the palette command is the fast
 * path for people who do know.
 *
 * ── WHY IT LOADS A TIER AT A TIME ───────────────────────────────────────
 *
 * Children are fetched when a node is expanded, not at activation.
 * Collapsed, this view costs one nothing: five static rows and no network.
 * Expanded, one tier is a couple of hundred rows of metadata off an
 * edge-cached endpoint. Fetching all five up front would be most of the
 * catalog's metadata pulled into an editor that may only ever be asked for
 * a footer.
 *
 * Each tier's fetch is memoised until Refresh, because the categories under
 * it are derived from the same response — expanding two categories must not
 * be two requests for the same tier.
 */

const vscode = require('vscode')

const catalog = require('./catalog')

/**
 * Icons per tier, from the built-in codicon set.
 *
 * Codicons rather than bundled SVGs so the sidebar matches whatever theme
 * the user is running, including the high-contrast ones. `symbol-color` for
 * effects, `symbol-field` for primitives, `layout` for blocks,
 * `browser` for pages, `package` for templates.
 */
const LEVEL_ICON = {
  effect: 'symbol-color',
  primitive: 'symbol-field',
  block: 'layout',
  page: 'browser',
  template: 'package',
}

class CatalogTreeProvider {
  constructor() {
    this._emitter = new vscode.EventEmitter()
    /** Fired to make the view re-ask for children. */
    this.onDidChangeTreeData = this._emitter.event
    /** level -> Promise<items>, cleared by refresh(). */
    this._tiers = new Map()
  }

  refresh() {
    this._tiers.clear()
    this._emitter.fire(undefined)
  }

  /** Items for one tier, fetched at most once between refreshes. */
  _items(level) {
    if (!this._tiers.has(level)) {
      /*
       * The rejected promise is dropped from the cache so that a tier which
       * failed because the machine was offline can be retried by collapsing
       * and expanding it — without this, one failure would persist until
       * the user found the Refresh button.
       */
      const pending = catalog.listLevel(level).catch((error) => {
        this._tiers.delete(level)
        throw error
      })
      this._tiers.set(level, pending)
    }
    return this._tiers.get(level)
  }

  getTreeItem(node) {
    return node.item
  }

  async getChildren(node) {
    if (!node) return catalog.LEVELS.map(tierNode)

    if (node.kind === 'tier') {
      let items
      try {
        items = await this._items(node.level)
      } catch (error) {
        return [messageNode(catalog.describeError(error).message)]
      }

      /*
       * Templates skip the category layer. There are a few dozen of them
       * across a handful of categories, and a tree that makes you open
       * "Marketing" to find two templates has added a click to hide
       * nothing. Every other tier has enough in it that the grouping is
       * the only thing making it readable.
       */
      if (node.level === 'template') {
        return items.map((entry) => artifactNode(entry, node.level))
      }

      const byCategory = new Map()
      for (const entry of items) {
        const key = entry.category || 'Uncategorised'
        if (!byCategory.has(key)) byCategory.set(key, [])
        byCategory.get(key).push(entry)
      }

      if (byCategory.size === 0) return [messageNode('Nothing in this tier yet.')]

      return [...byCategory.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([name, entries]) => categoryNode(node.level, name, entries))
    }

    if (node.kind === 'category') {
      return node.entries.map((entry) => artifactNode(entry, node.level))
    }

    return []
  }
}

/* ------------------------------------------------------------------ *
 *  Nodes
 * ------------------------------------------------------------------ */

function tierNode(level) {
  const item = new vscode.TreeItem(
    capitalise(catalog.LEVEL_PLURAL[level]),
    vscode.TreeItemCollapsibleState.Collapsed,
  )
  item.description = catalog.LEVEL_BLURB[level]
  item.iconPath = new vscode.ThemeIcon(LEVEL_ICON[level])
  item.contextValue = 'hoverlab.tier'
  return { kind: 'tier', level, item }
}

function categoryNode(level, name, entries) {
  const item = new vscode.TreeItem(name, vscode.TreeItemCollapsibleState.Collapsed)
  item.description = String(entries.length)
  item.iconPath = new vscode.ThemeIcon('folder')
  item.contextValue = 'hoverlab.category'
  return { kind: 'category', level, entries, item }
}

function artifactNode(entry, level) {
  const item = new vscode.TreeItem(entry.name, vscode.TreeItemCollapsibleState.None)

  /*
   * The id in the row, not only in the tooltip. It is what every other
   * surface takes — `npx hoverlab add <id>`, the API, the MCP tools — so a
   * sidebar that showed only display names would be a list of things you
   * cannot refer to anywhere else.
   */
  item.description = entry.id
  item.tooltip = new vscode.MarkdownString(
    `**${entry.name}** \`${entry.id}\`\n\n${entry.description || ''}\n\n` +
      `_${entry.category}_` +
      (entry.deps && entry.deps.length
        ? `\n\nDependencies: \`${entry.deps.join('`, `')}\``
        : '\n\nNo dependencies.') +
      (typeof entry.lines === 'number' ? `\n\n${entry.lines} lines` : ''),
  )
  item.iconPath = new vscode.ThemeIcon(entry.featured ? 'star-full' : LEVEL_ICON[level])
  item.contextValue = 'hoverlab.artifact'

  /*
   * Clicking the row previews it rather than installing it. Install is the
   * irreversible one — it writes files into somebody's repo — and a
   * single click is not consent for that.
   */
  item.command = {
    command: 'hoverlab.preview',
    title: 'Preview',
    arguments: [{ kind: 'artifact', level, entry }],
  }

  return { kind: 'artifact', level, entry, item }
}

/** A row that is not an artifact: an error, or an empty tier. */
function messageNode(text) {
  const item = new vscode.TreeItem(text, vscode.TreeItemCollapsibleState.None)
  item.iconPath = new vscode.ThemeIcon('warning')
  return { kind: 'message', item }
}

function capitalise(value) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

module.exports = { CatalogTreeProvider }
