/**
 * The MCP server's other two primitives: resources and prompts.
 *
 * WHY THESE EXIST WHEN TOOLS ALREADY COVER THE CATALOG
 *
 * Tools are what a model *calls*. Resources are what a client can *attach*,
 * and prompts are what a person can *pick*, and both are surfaces a tools-only
 * server simply does not appear on:
 *
 *   - A user who types `@` in Claude Code or Cursor gets the resource list.
 *     "Attach the design system" becomes a click rather than hoping the
 *     agent remembers to call `get_design_dna` before it writes a hex value.
 *   - Prompts show up as slash commands (`/mcp__hoverlab__add-section`).
 *     They are the recommended workflows — search, install, restyle, review —
 *     written once by the people who know the tool order, instead of being
 *     rediscovered per conversation.
 *
 * Nothing here is a second implementation. Every resource reads through the
 * same `api.mjs` the tools use, so an attached document and a tool result can
 * never disagree about what the catalog says.
 *
 * NO COUNTS IN ANY TEXT HERE. The catalog moves on the site's clock and this
 * package on npm's; a number typed into a prompt is wrong within a release and
 * stays wrong (see the test in mcp-args.test.mjs that guards the tool
 * descriptions for the same reason).
 */

import { getArtifact, getDna, getSkill, listKits, listSkills } from './api.mjs'

const SCHEME = 'hoverlab://'

/* ------------------------------------------------------------------ *
 *  Resources
 * ------------------------------------------------------------------ */

/**
 * The resources that always exist.
 *
 * Skills are appended per call because the set is served, not bundled — a
 * skill added to the site should appear in the picker without a new release
 * of this package.
 */
const STATIC_RESOURCES = [
  {
    uri: `${SCHEME}dna`,
    name: 'design-dna',
    title: 'Hoverlab design system (Design DNA)',
    description:
      'Colour tokens for both themes, radius, spacing, type, motion rules and the rules that keep generated UI consistent. Attach this before asking for any UI so nothing is invented against a second palette.',
    mimeType: 'text/markdown',
  },
  {
    uri: `${SCHEME}kits`,
    name: 'kits',
    title: 'Kits — ready-made sets for a kind of product',
    description:
      'Curated lists of templates, pages and blocks for a whole product ("a storefront", "a SaaS dashboard"). Each kit names the ids to install together.',
    mimeType: 'text/markdown',
  },
]

/**
 * Parameterised resources a client may fill in.
 *
 * Templates rather than a listing of every id: the catalog is hundreds of
 * entries and a picker with hundreds of rows is a worse search box than the
 * `search_catalog` tool the agent already has.
 */
export const RESOURCE_TEMPLATES = [
  {
    uriTemplate: `${SCHEME}artifact/{id}`,
    name: 'artifact-source',
    title: 'Source of one catalog artifact',
    description:
      'The code of any effect, primitive, block or page by id, as it would be installed. For reading, not writing — use install_artifact to put it in the project.',
    mimeType: 'text/markdown',
  },
  {
    uriTemplate: `${SCHEME}dna/{id}`,
    name: 'design-dna-for-artifact',
    title: 'Design DNA as one artifact uses it',
    description: 'The design system as it applies to a single catalog artifact.',
    mimeType: 'text/markdown',
  },
  {
    uriTemplate: `${SCHEME}kit/{slug}`,
    name: 'kit',
    title: 'One kit, with its install list',
    description: 'A kit in full, including the precomputed list of ids to hand to install_artifact.',
    mimeType: 'text/markdown',
  },
]

/**
 * The resource list, with the published skills appended.
 *
 * A failed skills fetch must not fail the list: the two static entries are
 * still useful, and an editor that cannot populate its `@` picker because the
 * network blinked has been made worse by this server existing.
 */
export async function listResources() {
  let skills = []
  try {
    skills = await listSkills()
  } catch {
    // Offline or the site is down; the static entries stand alone.
  }

  return [
    ...STATIC_RESOURCES,
    ...skills.map((skill) => ({
      uri: `${SCHEME}skill/${skill.id}`,
      name: `skill-${skill.id}`,
      title: `Agent skill: ${skill.name ?? skill.id}`,
      description: skill.description ?? 'An agent skill published with the catalog.',
      mimeType: 'text/markdown',
    })),
  ]
}

/** An artifact response as one markdown document a model can read. */
export function artifactMarkdown(data) {
  const meta = data.effect ?? data.artifact
  const lines = [`# ${meta.name} (\`${meta.id}\`)`, '']
  lines.push(`${data.level} · ${meta.category} — ${meta.description}`)
  if (meta.url) lines.push('', meta.url)
  if (data.deps?.length) lines.push('', `Dependencies: ${data.deps.join(', ')}`)

  for (const file of data.files ?? []) {
    const code = file.code ?? file.source ?? ''
    const ext = String(file.path).split('.').pop() ?? ''
    lines.push('', `## ${file.path}`, '', '```' + ext, code.trimEnd(), '```')
  }
  for (const note of data.notes ?? []) lines.push('', `> ${note}`)
  return lines.join('\n')
}

function kitMarkdown(kit) {
  const lines = [`# ${kit.name ?? kit.slug}`, '']
  if (kit.description) lines.push(kit.description, '')
  for (const group of kit.contents ?? []) {
    lines.push(`## ${group.level}s`, '')
    for (const item of group.items ?? []) {
      lines.push(`- ${item.id}${item.name ? ` — ${item.name}` : ''}`)
    }
    lines.push('')
  }
  lines.push(
    'Blocks and pages install with install_artifact, one id per call. A template is a whole project and goes through init_template instead.',
  )
  return lines.join('\n')
}

/** A resource read that named nothing we serve. Mapped to JSON-RPC -32002. */
export class ResourceNotFound extends Error {
  constructor(uri) {
    super(`Resource not found: ${uri}`)
    this.name = 'ResourceNotFound'
    this.uri = uri
  }
}

/**
 * Read one resource by URI.
 *
 * The path segment is decoded and used only as an id handed to the API, never
 * as a filesystem path — a `hoverlab://artifact/../../etc/passwd` is just an
 * id the API will not recognise.
 */
export async function readResource(uri) {
  if (typeof uri !== 'string' || !uri.startsWith(SCHEME)) throw new ResourceNotFound(uri)

  const [kind, ...rest] = uri.slice(SCHEME.length).split('/')
  let id
  try {
    id = rest.length ? decodeURIComponent(rest.join('/')) : undefined
  } catch {
    throw new ResourceNotFound(uri)
  }

  const respond = (text) => ({ contents: [{ uri, mimeType: 'text/markdown', text }] })

  try {
    switch (kind) {
      case 'dna':
        return respond((await getDna(id || 'catalog')).markdown)

      case 'skill': {
        if (!id) throw new ResourceNotFound(uri)
        return respond((await getSkill(id)).markdown)
      }

      case 'artifact': {
        if (!id) throw new ResourceNotFound(uri)
        return respond(artifactMarkdown(await getArtifact(id, { framework: 'react' })))
      }

      case 'kits': {
        const kits = await listKits()
        const lines = ['# Kits', '']
        for (const kit of kits) {
          lines.push(`- **${kit.slug}** — ${kit.name ?? ''}${kit.tagline ? `: ${kit.tagline}` : ''}`)
        }
        return respond(lines.join('\n'))
      }

      case 'kit': {
        if (!id) throw new ResourceNotFound(uri)
        return respond(kitMarkdown(await listKits({ slug: id })))
      }

      default:
        throw new ResourceNotFound(uri)
    }
  } catch (error) {
    if (error instanceof ResourceNotFound) throw error
    // The API's own 404 for an unknown id is "not found" to the client too,
    // rather than an internal error it would retry.
    if (error?.status === 404) throw new ResourceNotFound(uri)
    throw error
  }
}

/* ------------------------------------------------------------------ *
 *  Prompts
 * ------------------------------------------------------------------ */

/**
 * The workflows worth a slash command.
 *
 * Each names the tools in the order that works, because the failure this
 * exists to prevent is an agent that installs a block and then hand-edits it
 * blind, or writes a section from scratch when one is installed for free.
 * `review_code` closes each loop: whatever the agent just produced gets
 * checked by the same rules that gate the catalog.
 */
export const PROMPTS = [
  {
    name: 'add-section',
    title: 'Add a section from the catalog',
    description: 'Find the closest catalog block for something you describe, install it, and check it.',
    arguments: [
      {
        name: 'what',
        description: 'The section you want, in plain words — e.g. "pricing table with a monthly/yearly toggle".',
        required: true,
      },
    ],
    text: ({ what }) =>
      `Add this to the project: ${what}\n\n` +
      'Work in this order and do not write the section from scratch:\n' +
      '1. Call get_design_dna so anything you adapt matches the design system.\n' +
      '2. Call search_catalog with two to four descriptive words. If nothing fits, try one synonym before giving up.\n' +
      '3. Install the closest block or page with install_artifact and report the file paths it wrote.\n' +
      '4. Install any missing packages it lists, then wire it into the right route or layout.\n' +
      '5. Edit the installed source to fit the request — it is plain React and Tailwind meant to be changed.\n' +
      '6. Call review_code on the files you touched and fix every violation before you report back.',
  },
  {
    name: 'build-from-design',
    title: 'Build from a design',
    description: 'Turn a Figma frame, screenshot or written spec into components, matching each region to the catalog.',
    arguments: [
      {
        name: 'design',
        description:
          'What the design shows — or leave a note like "the selected Figma frame" if a design tool is connected.',
        required: true,
      },
    ],
    text: ({ design }) =>
      `Build this design: ${design}\n\n` +
      '1. If a design tool is connected, read the frame\'s structure first; otherwise work from what was shared.\n' +
      '2. Split it into regions. Call match_design once per region, describing what it is and listing the elements you can see.\n' +
      '3. Install the best match for each with install_artifact.\n' +
      '4. Call get_design_dna, then restyle the installed code to the design\'s colours, spacing and type.\n' +
      '5. Call review_code on everything you wrote or changed and resolve the violations.',
  },
  {
    name: 'scaffold-project',
    title: 'Scaffold a whole project',
    description: 'Start a new project from a kit or template instead of assembling one section at a time.',
    arguments: [
      {
        name: 'idea',
        description: 'What you are building — e.g. "a storefront for a small ceramics shop".',
        required: true,
      },
    ],
    text: ({ idea }) =>
      `Start a new project: ${idea}\n\n` +
      '1. Call get_kit for the closest kind of product; it returns a ready-made list rather than a search you have to assemble.\n' +
      '2. If a template fits, scaffold it with init_template into a new directory. Never scaffold over an existing project.\n' +
      '3. Otherwise install the kit\'s pages and blocks with install_artifact.\n' +
      '4. Run the project\'s install and dev commands and confirm it starts before you say it is done.',
  },
  {
    name: 'review-changes',
    title: 'Review my changes for design defects',
    description:
      'Check what you have changed for accessibility, right-to-left, reduced-motion and overflow defects, then fix them.',
    arguments: [
      {
        name: 'base',
        description: 'A branch to compare against (e.g. "main"). Leave empty to review uncommitted changes.',
        required: false,
      },
    ],
    text: ({ base }) =>
      `Review ${base ? `what this branch changes against ${base}` : 'my uncommitted changes'} for design defects.\n\n` +
      `1. Call review_code${base ? ` with base "${base}"` : ' with no arguments'}.\n` +
      '2. Fix every violation. Advisories are questions, not defects: read each one, fix it if it is real, and say why if you leave it.\n' +
      '3. Call review_code again to confirm the violations are gone, and list anything you deliberately left.',
  },
]

/**
 * Resolve a prompt to the messages a client shows.
 *
 * A missing required argument is an error the client can display, rather than
 * a prompt with "undefined" spliced into the middle of it — the same failure
 * `validateArgs` exists to stop for tool calls.
 */
export function getPrompt(name, args = {}) {
  const prompt = PROMPTS.find((p) => p.name === name)
  if (!prompt) throw new Error(`Unknown prompt "${name}". Available: ${PROMPTS.map((p) => p.name).join(', ')}.`)

  const values = {}
  for (const arg of prompt.arguments) {
    const raw = args?.[arg.name]
    const value = typeof raw === 'string' ? raw.trim() : ''
    if (arg.required && !value) {
      throw new Error(`Prompt "${name}" needs "${arg.name}" — ${arg.description}`)
    }
    values[arg.name] = value
  }

  return {
    description: prompt.description,
    messages: [{ role: 'user', content: { type: 'text', text: prompt.text(values) } }],
  }
}

/** Prompt metadata as `prompts/list` returns it — without the renderer. */
export function listPrompts() {
  return PROMPTS.map(({ text: _text, ...meta }) => meta)
}
