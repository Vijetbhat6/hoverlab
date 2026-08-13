/**
 * Hoverlab MCP server (stdio transport).
 *
 * This is the point of the whole CLI. Developers increasingly do not visit
 * component sites — they ask the agent inside their editor. An MCP server
 * makes the catalog something Cursor / Claude Code / Zed can *search and
 * install from* directly, which is distribution rather than a feature.
 *
 * The tool list is in two halves. `search_catalog` / `match_design` /
 * `install_artifact` / `init_template` cover all four tiers and are what an
 * agent should reach for — `match_design` being the entry point when the
 * request arrives as a design (a Figma frame read over the Figma MCP
 * server, a screenshot) rather than as words. The four effect-specific
 * tools predate them and stay because they carry the framework and
 * recolouring knobs the generic ones do not.
 *
 * The protocol is hand-implemented rather than pulled from the official
 * SDK, deliberately: this package's headline command is
 * `npx hoverlab add btn-gradient`, and every dependency is latency a user
 * feels before they get their effect. MCP's stdio transport is
 * newline-delimited JSON-RPC 2.0, and the surface we need — initialize,
 * tools/list, tools/call — is small enough to implement exactly.
 *
 * Hard rule: stdout carries protocol frames and nothing else. Every
 * diagnostic goes to stderr, or it corrupts the stream.
 */

import { addArtifact, writeEffectFiles } from './write.mjs'
import { initTemplate } from './scaffold.mjs'
import { DESIGN_LEVELS, matchDesign } from './design.mjs'
import {
  DEFAULT_ORIGIN,
  FRAMEWORKS,
  LEVELS,
  getEffect,
  searchAll,
  searchEffects,
  searchLevel,
} from './api.mjs'

const SERVER_NAME = 'hoverlab'
const SERVER_VERSION = '0.2.0'

/**
 * Protocol revisions this server understands. We echo back whichever one
 * the client asks for when we know it, and otherwise answer with our
 * newest — which is what the spec prescribes for version negotiation.
 */
const SUPPORTED_PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05']
const LATEST_PROTOCOL_VERSION = SUPPORTED_PROTOCOL_VERSIONS[0]

/* JSON-RPC 2.0 reserved error codes. */
const PARSE_ERROR = -32700
const INVALID_REQUEST = -32600
const METHOD_NOT_FOUND = -32601
const INTERNAL_ERROR = -32603

function log(...args) {
  process.stderr.write(`[hoverlab-mcp] ${args.join(' ')}\n`)
}

/* ------------------------------------------------------------------ *
 *  Tool definitions
 * ------------------------------------------------------------------ */

const TOOLS = [
  {
    name: 'search_effects',
    description:
      'Search the Hoverlab catalog of 1,600+ hand-tuned CSS effects (buttons, loaders, cards, backgrounds, toggles, skeletons, text and entrance animations). Returns matching effects as metadata — id, name, category, description, tags. Call get_effect or install_effect afterwards to obtain the actual code. Use this whenever the user asks for a UI effect, animation, or interaction style rather than writing the CSS from scratch.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'Free-text search, e.g. "pulsing teal button", "shimmer skeleton", "glassmorphism card". Every word must match something, so prefer 2-4 descriptive words.',
        },
        category: {
          type: 'string',
          description:
            'Restrict to one category. Call list_categories for the exact values.',
        },
        featured: {
          type: 'boolean',
          description:
            'Only return the curated, hand-written effects. Good default when the user wants quality over breadth.',
        },
        limit: {
          type: 'integer',
          description: 'Maximum results, 1-100. Defaults to 20.',
          minimum: 1,
          maximum: 100,
        },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_effect',
    description:
      'Fetch one effect by id and return ready-to-paste source code in the framework you ask for, plus any caveats for that target. Use this when you want to show the user the code or adapt it yourself. Use install_effect instead when the code should be written to disk.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Effect id, as returned by search_effects (e.g. "btn-gradient").',
        },
        framework: {
          type: 'string',
          enum: FRAMEWORKS,
          description:
            'Output target. "css" returns the stylesheet plus the markup it expects; "tailwind" rewrites the markup as utility classes. Defaults to "css".',
        },
        hue: {
          type: 'number',
          description: 'Hue rotation in degrees, -180 to 180. Use to recolour an effect to match a brand.',
        },
        sat: { type: 'number', description: 'Saturation shift in percentage points, -100 to 100.' },
        scale: { type: 'number', description: 'Size multiplier for every px/rem value, 0.5 to 1.5.' },
        speed: { type: 'number', description: 'Animation speed multiplier, 0.25 to 3.' },
      },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'install_effect',
    description:
      'Fetch an effect and write its files into the user\'s project. Returns the paths written. Prefer this over get_effect when the user asks to "add", "install" or "use" an effect. The framework is auto-detected from the project when not specified.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Effect id, as returned by search_effects.' },
        framework: {
          type: 'string',
          enum: FRAMEWORKS,
          description: 'Output target. Auto-detected from the project when omitted.',
        },
        directory: {
          type: 'string',
          description:
            'Destination directory. Defaults to a hoverlab/ folder inside the project\'s existing components (or styles) directory.',
        },
        force: {
          type: 'boolean',
          description: 'Overwrite files that already exist. Defaults to false, which fails instead.',
        },
        hue: { type: 'number', description: 'Hue rotation in degrees, -180 to 180.' },
        sat: { type: 'number', description: 'Saturation shift in percentage points, -100 to 100.' },
        scale: { type: 'number', description: 'Size multiplier, 0.5 to 1.5.' },
        speed: { type: 'number', description: 'Animation speed multiplier, 0.25 to 3.' },
      },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'list_categories',
    description:
      'List the catalog categories with the exact spellings accepted by search_effects. Cheap; call it before guessing a category name.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'search_catalog',
    description:
      'Search the whole Hoverlab catalog across all four tiers at once: effects (a single element — a button hover, a loader), blocks (a complete section — a pricing table, a checkout form, a sortable data table), pages (a composed screen — a full landing page, a product detail page) and templates (a whole runnable Next.js project). Prefer this over search_effects whenever the user is asking for something larger than one element: "build me a pricing page", "I need a checkout form", "scaffold a storefront". Returns metadata only; follow up with install_artifact or init_template.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'Free-text search, e.g. "checkout", "pricing table", "sortable table with filters". Every word must match something, so prefer 2-4 descriptive words.',
        },
        level: {
          type: 'string',
          enum: LEVELS,
          description:
            'Restrict to one tier. Omit to search all four, which is usually right — the user rarely knows which tier holds what they want.',
        },
        category: {
          type: 'string',
          description: 'Restrict to one category. Requires level. Call list_categories for values.',
        },
        featured: { type: 'boolean', description: 'Only the curated, hand-written entries.' },
        limit: {
          type: 'integer',
          description: 'Maximum results per tier, 1-100. Defaults to 10.',
          minimum: 1,
          maximum: 100,
        },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },
  {
    name: 'install_artifact',
    description:
      'Fetch any catalog artifact by id — effect, block or page — and write its files into the user\'s project. Returns the paths written and any packages that still need installing. This is the right tool for "add the pricing section", "use that checkout form", "install btn-gradient". A page brings the blocks it is built from, so the result compiles rather than leaving broken imports. Templates are NOT installable this way: they are whole projects, so use init_template.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Artifact id, as returned by search_catalog.' },
        directory: {
          type: 'string',
          description:
            'Destination root. Blocks and pages keep their own relative paths (components/x.tsx) beneath it. Defaults to the project root, or src/ when the project uses that layout.',
        },
        framework: {
          type: 'string',
          enum: FRAMEWORKS,
          description:
            'Effects only — blocks and pages are React and ship as written. Auto-detected when omitted.',
        },
        force: {
          type: 'boolean',
          description: 'Overwrite files that already exist. Defaults to false, which fails instead.',
        },
      },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'match_design',
    description:
      'Find the catalog artifacts closest to a design the user has shared — a Figma frame (read it first through a Figma/design MCP tool if one is connected), a screenshot, a mockup, or a written spec. Call it once per distinct region of the design, describing what the region is and what is visible in it. Unlike search_catalog, not every word must match: designer vocabulary ("navbar", "modal", "plan cards") is translated to catalog vocabulary, and partial matches rank by how much of the description they cover. Returns ranked blocks and pages with the reasons they matched. Follow up with install_artifact, then restyle the installed code to the design\'s colours, spacing and type — it is plain React + Tailwind, meant to be edited.',
    inputSchema: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          description:
            'What this region of the design is and how it is arranged, in plain words — e.g. "pricing section, three plan cards side by side, middle card emphasised" or "full sign-in screen with social buttons".',
        },
        elements: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Distinct UI elements visible in the region, each a short phrase — e.g. ["monthly/yearly toggle", "check list", "CTA button"]. These weigh more than description words, so list what you actually see.',
        },
        level: {
          type: 'string',
          enum: DESIGN_LEVELS,
          description:
            'Restrict to one tier: a single section of a screen is a block, a whole screen is a page. Omit to search both, which is usually right.',
        },
        limit: {
          type: 'integer',
          description: 'Maximum results, 1-20. Defaults to 8.',
          minimum: 1,
          maximum: 20,
        },
      },
      required: ['description'],
      additionalProperties: false,
    },
  },
  {
    name: 'init_template',
    description:
      'Scaffold a complete, runnable Next.js project from a template into a new directory — routing, layout, theme tokens, every page and every block it uses. Use this when the user wants to start something rather than add to it: "build me a SaaS starter", "scaffold a storefront". Refuses to write into a non-empty directory unless forced, so it will not overwrite an existing project.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description:
            'Template id, as returned by search_catalog with level "template" (e.g. "saas-starter", "storefront").',
        },
        directory: {
          type: 'string',
          description: 'Destination directory. Defaults to ./<template-id>.',
        },
        force: {
          type: 'boolean',
          description:
            'Scaffold into a directory that already has files in it. Defaults to false. Ask the user before setting this.',
        },
      },
      required: ['id'],
      additionalProperties: false,
    },
  },
]

/* ------------------------------------------------------------------ *
 *  Tool implementations
 * ------------------------------------------------------------------ */

/** Pull the four customization knobs out of a tool argument object. */
function readCustomization(args) {
  const out = {}
  for (const key of ['hue', 'sat', 'scale', 'speed']) {
    if (typeof args[key] === 'number' && Number.isFinite(args[key])) out[key] = args[key]
  }
  return out
}

async function runSearchEffects(args) {
  const result = await searchEffects({
    query: args.query,
    category: args.category,
    featured: args.featured === true,
    limit: typeof args.limit === 'number' ? args.limit : 20,
  })

  if (result.effects.length === 0) {
    return (
      `No effects matched "${args.query}"${args.category ? ` in ${args.category}` : ''}.\n\n` +
      'Search requires every word to match, so try fewer or broader words — ' +
      '"teal glow" rather than "a subtle teal glowing button effect".'
    )
  }

  const lines = [
    `${result.total} effect${result.total === 1 ? '' : 's'} matched "${args.query}"` +
      `${result.effects.length < result.total ? `, showing the top ${result.effects.length}` : ''}:`,
    '',
  ]
  for (const effect of result.effects) {
    lines.push(`- ${effect.id}  ${effect.featured ? '(curated) ' : ''}— ${effect.name}`)
    lines.push(`    ${effect.category} · ${effect.description}`)
    if (effect.tags.length) lines.push(`    tags: ${effect.tags.join(', ')}`)
  }
  lines.push('', 'Use get_effect or install_effect with one of these ids.')
  return lines.join('\n')
}

async function runGetEffect(args) {
  const framework = args.framework || 'css'
  const data = await getEffect(args.id, {
    framework,
    customization: readCustomization(args),
  })

  const lines = [
    `${data.effect.name} (${data.effect.id}) — ${data.effect.category}`,
    data.effect.description,
    `Source: ${data.effect.url}`,
    '',
    `Framework: ${data.framework}`,
  ]
  if (data.effect.darkSurface) {
    lines.push('Note: this effect is designed for a dark background.')
  }
  lines.push('')

  for (const file of data.files) {
    lines.push(`--- ${file.path} ---`)
    lines.push('```' + file.language)
    lines.push(file.code.trimEnd())
    lines.push('```')
    lines.push('')
  }

  if (data.notes?.length) {
    lines.push('Caveats for this target:')
    for (const note of data.notes) lines.push(`- ${note}`)
  }

  return lines.join('\n')
}

async function runInstallEffect(args) {
  const written = await writeEffectFiles({
    id: args.id,
    framework: args.framework,
    directory: args.directory,
    force: args.force === true,
    customization: readCustomization(args),
  })

  const lines = [
    `Installed ${written.effect.name} (${written.effect.id}) as ${written.framework}.`,
    written.frameworkReason ? `Framework auto-detected: ${written.frameworkReason}.` : null,
    '',
    'Files written:',
    ...written.files.map((f) => `- ${f}`),
  ].filter((line) => line !== null)

  if (written.notes?.length) {
    lines.push('', 'Caveats for this target:')
    for (const note of written.notes) lines.push(`- ${note}`)
  }

  return lines.join('\n')
}

async function runListCategories() {
  // The list endpoint returns the category vocabulary alongside results,
  // so a zero-result search is the cheapest way to ask for just that.
  const result = await searchEffects({ limit: 1 })
  return ['Catalog categories:', '', ...result.categories.map((c) => `- ${c}`)].join('\n')
}

/* ---------------------- The other three tiers -------------------- */

/** One search hit, as the two lines a model should read. */
function describe(item) {
  const lines = [`- ${item.id}${item.featured ? '  (curated)' : ''} — ${item.name}`]
  lines.push(`    ${item.category} · ${item.description}`)
  if (item.composedOf?.length) {
    lines.push(`    built from: ${item.composedOf.join(', ')}`)
  }
  if (item.fileCount) {
    lines.push(`    ${item.fileCount} files, ${item.routes?.length ?? 0} routes`)
  }
  return lines
}

const LEVEL_BLURB = {
  effect: 'EFFECTS — one element',
  block: 'BLOCKS — one complete section',
  page: 'PAGES — one composed screen',
  template: 'TEMPLATES — a whole runnable project',
}

async function runSearchCatalog(args) {
  const limit = typeof args.limit === 'number' ? args.limit : 10
  const params = {
    query: args.query,
    category: args.category,
    featured: args.featured === true,
    limit,
  }

  if (args.level) {
    const result = await searchLevel({ ...params, level: args.level })
    if (!result.items.length) {
      return `No ${args.level}s matched "${args.query}". Search requires every word to match, so try fewer or broader words.`
    }
    return [
      `${result.total} ${args.level}${result.total === 1 ? '' : 's'} matched "${args.query}":`,
      '',
      ...result.items.flatMap(describe),
      '',
      args.level === 'template'
        ? 'Use init_template with one of these ids.'
        : 'Use install_artifact with one of these ids.',
    ].join('\n')
  }

  const { results, total, errors } = await searchAll(params)
  if (errors.length === results.length) throw errors[0]

  if (total === 0) {
    return (
      `Nothing in the catalog matched "${args.query}".\n\n` +
      'Search requires every word to match, so try fewer or broader words — ' +
      '"checkout form" rather than "a nice checkout form with address fields".'
    )
  }

  const lines = [`${total} match${total === 1 ? '' : 'es'} for "${args.query}":`, '']

  // Assembly first: if a whole page or template answers the request, the
  // model should see that before it starts stitching blocks together.
  for (const level of ['template', 'page', 'block', 'effect']) {
    const result = results.find((r) => r.level === level)
    if (!result?.items.length) continue
    lines.push(`${LEVEL_BLURB[level]} (${result.total})`)
    for (const item of result.items) lines.push(...describe(item))
    lines.push('')
  }

  lines.push(
    'Use install_artifact for an effect, block or page; init_template for a template.',
  )
  return lines.join('\n')
}

async function runInstallArtifact(args) {
  let written
  try {
    written = await addArtifact({
      id: args.id,
      framework: args.framework,
      directory: args.directory,
      force: args.force === true,
    })
  } catch (error) {
    // The underlying message points at the CLI command, which is the wrong
    // advice for a client holding the tool that does the same job.
    if (error.suggestInit) {
      throw new Error(
        `${args.id} is a template — a whole project, not a component. ` +
          `Call init_template with id "${error.suggestInit}" instead.`,
      )
    }
    throw error
  }

  const lines = [
    `Installed ${written.artifact.name} (${written.artifact.id}) — ${written.level}.`,
    written.frameworkReason ? `Resolved from the project: ${written.frameworkReason}.` : null,
    written.included.length
      ? `Included the ${written.included.length} blocks it is built from: ${written.included.join(', ')}.`
      : null,
    '',
    'Files written:',
    ...written.files.map((f) => `- ${f}`),
  ].filter((line) => line !== null)

  if (written.missingDeps.length) {
    lines.push('', `Still needed: npm i ${written.missingDeps.join(' ')}`)
  }
  if (written.notes?.length) {
    lines.push('', 'Notes:')
    for (const note of written.notes) lines.push(`- ${note}`)
  }

  return lines.join('\n')
}

async function runMatchDesign(args) {
  const { groups, results } = await matchDesign({
    description: args.description,
    elements: Array.isArray(args.elements) ? args.elements : [],
    level: args.level,
    limit: typeof args.limit === 'number' ? args.limit : 8,
  })

  const concepts = groups.map((g) => g.token)
  if (!results.length) {
    return (
      `Nothing in the catalog resembles that region (looked for: ${concepts.join(', ')}).\n\n` +
      'Describe it by function rather than appearance — "checkout form" rather than ' +
      '"white panel with fields" — or match its parent region instead and build this piece by hand.'
    )
  }

  const lines = [
    `Closest matches for the region (concepts: ${concepts.join(', ')}):`,
    '',
  ]
  for (const { artifact, matched, coverage } of results) {
    lines.push(
      `- ${artifact.id}  [${artifact.level}]${artifact.featured ? ' (curated)' : ''} — ${artifact.name}`,
    )
    lines.push(`    ${artifact.category} · ${artifact.description}`)
    lines.push(
      `    matched ${matched.length}/${groups.length} concepts: ${matched.join(', ')}`,
    )
    if (coverage < 0.5) {
      lines.push('    (partial match — check it against the design before installing)')
    }
  }
  lines.push(
    '',
    'Next: install_artifact with the best id, then edit the installed files to match the ' +
      "design's colours, spacing and type — they are plain React + Tailwind. " +
      'If the design also implies motion (hovers, loaders), search_effects covers that separately.',
  )
  return lines.join('\n')
}

async function runInitTemplate(args) {
  const result = await initTemplate({
    id: args.id,
    directory: args.directory,
    force: args.force === true,
  })

  const lines = [
    `Scaffolded ${result.template.name} (${result.template.id}) into ${result.directory}.`,
    `${result.files.length} files.`,
    '',
  ]

  if (result.routes.length) {
    lines.push('Routes:')
    for (const route of result.routes) {
      lines.push(`- ${route.path} → ${route.file} (${route.label})`)
    }
    lines.push('')
  }

  lines.push('Next: npm install, then npm run dev.')
  if (result.notes?.length) {
    lines.push('', 'Notes:')
    for (const note of result.notes) lines.push(`- ${note}`)
  }

  return lines.join('\n')
}

const HANDLERS = {
  search_effects: runSearchEffects,
  get_effect: runGetEffect,
  install_effect: runInstallEffect,
  list_categories: runListCategories,
  search_catalog: runSearchCatalog,
  match_design: runMatchDesign,
  install_artifact: runInstallArtifact,
  init_template: runInitTemplate,
}

/* ------------------------------------------------------------------ *
 *  JSON-RPC plumbing
 * ------------------------------------------------------------------ */

function send(message) {
  process.stdout.write(JSON.stringify(message) + '\n')
}

function sendResult(id, result) {
  send({ jsonrpc: '2.0', id, result })
}

function sendError(id, code, message, data) {
  send({ jsonrpc: '2.0', id, error: { code, message, ...(data ? { data } : {}) } })
}

async function handleToolCall(id, params) {
  const name = params?.name
  const handler = HANDLERS[name]

  if (!handler) {
    // An unknown tool name is the client's mistake, not a protocol fault:
    // report it as a tool error so the model can recover by listing tools.
    sendResult(id, {
      content: [
        {
          type: 'text',
          text: `Unknown tool "${name}". Available: ${Object.keys(HANDLERS).join(', ')}.`,
        },
      ],
      isError: true,
    })
    return
  }

  try {
    const text = await handler(params.arguments ?? {})
    sendResult(id, { content: [{ type: 'text', text }], isError: false })
  } catch (error) {
    // Tool failures are results, not JSON-RPC errors — the model should
    // see the message and be able to correct course (bad id, file exists).
    sendResult(id, {
      content: [{ type: 'text', text: `${name} failed: ${error.message}` }],
      isError: true,
    })
  }
}

async function handleMessage(message) {
  const { id, method, params } = message
  const isNotification = id === undefined || id === null

  switch (method) {
    case 'initialize': {
      const requested = params?.protocolVersion
      const protocolVersion = SUPPORTED_PROTOCOL_VERSIONS.includes(requested)
        ? requested
        : LATEST_PROTOCOL_VERSION
      sendResult(id, {
        protocolVersion,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
        instructions:
          'Search the Hoverlab catalog and install from it. The catalog has four tiers: ' +
          'effects (one element, plain CSS, emittable as React/Vue/Svelte/styled-components/' +
          'Tailwind/raw CSS), blocks (one complete section, React + Tailwind), pages (one ' +
          'composed screen) and templates (a whole runnable Next.js project). ' +
          'Start with search_catalog, which covers all four — the user usually does not know ' +
          'which tier holds what they asked for. Then install_artifact to write an effect, ' +
          'block or page into the project, or init_template to scaffold a project. ' +
          'Reach for a block before hand-writing a section: they are hundreds of lines of ' +
          'accessible, keyboard-complete React that would take far longer to reproduce. ' +
          'When the user shares a design — a Figma frame via a design MCP tool, a screenshot, ' +
          'a mockup — do not search with literal text from it. Read its structure, then call ' +
          'match_design once per distinct region; it tolerates designer vocabulary and partial ' +
          'matches where search_catalog does not. Install the closest match and restyle it to ' +
          "the design's tokens.",
      })
      return
    }

    // Post-initialize notifications carry no reply.
    case 'notifications/initialized':
    case 'initialized':
      return

    case 'ping':
      if (!isNotification) sendResult(id, {})
      return

    case 'tools/list':
      sendResult(id, { tools: TOOLS })
      return

    case 'tools/call':
      await handleToolCall(id, params)
      return

    default:
      // Notifications never get a response, even an error one.
      if (!isNotification) {
        sendError(id, METHOD_NOT_FOUND, `Method not found: ${method}`)
      }
  }
}

/**
 * Start the server. Resolves when stdin closes, which is how an MCP client
 * signals shutdown.
 */
export function startMcpServer() {
  log(`serving ${TOOLS.length} tools against ${DEFAULT_ORIGIN}`)

  return new Promise((resolve) => {
    let buffer = ''
    // Messages must be processed in order; a slow install_effect must not
    // let a later request overtake it.
    let queue = Promise.resolve()

    process.stdin.setEncoding('utf8')

    process.stdin.on('data', (chunk) => {
      buffer += chunk

      let newline
      while ((newline = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newline).trim()
        buffer = buffer.slice(newline + 1)
        if (!line) continue

        let message
        try {
          message = JSON.parse(line)
        } catch {
          sendError(null, PARSE_ERROR, 'Invalid JSON')
          continue
        }

        if (message.jsonrpc !== '2.0' || typeof message.method !== 'string') {
          // A response to something we sent (we send none) or junk.
          if (message.method === undefined && message.id !== undefined) continue
          sendError(message.id ?? null, INVALID_REQUEST, 'Expected a JSON-RPC 2.0 request')
          continue
        }

        queue = queue.then(() =>
          handleMessage(message).catch((error) => {
            log('handler crashed:', error?.stack || error?.message || String(error))
            if (message.id !== undefined && message.id !== null) {
              sendError(message.id, INTERNAL_ERROR, error?.message ?? 'Internal error')
            }
          }),
        )
      }
    })

    process.stdin.on('end', () => {
      queue.then(resolve)
    })
    process.stdin.on('close', () => {
      queue.then(resolve)
    })
  })
}

export { TOOLS }
