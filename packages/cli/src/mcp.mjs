/**
 * Hoverlab MCP server (stdio transport).
 *
 * This is the point of the whole CLI. Developers increasingly do not visit
 * component sites — they ask the agent inside their editor. An MCP server
 * makes the catalog something Cursor / Claude Code / Zed can *search and
 * install from* directly, which is distribution rather than a feature.
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

import { writeEffectFiles } from './write.mjs'
import { DEFAULT_ORIGIN, FRAMEWORKS, getEffect, searchEffects } from './api.mjs'

const SERVER_NAME = 'hoverlab'
const SERVER_VERSION = '0.1.0'

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

const HANDLERS = {
  search_effects: runSearchEffects,
  get_effect: runGetEffect,
  install_effect: runInstallEffect,
  list_categories: runListCategories,
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
          'Search the Hoverlab CSS effect catalog and install effects into the user\'s project. ' +
          'Start with search_effects to find candidates, then install_effect to write files ' +
          '(or get_effect to inspect the code first). The effects are plain CSS, so they can be ' +
          'emitted as React, Vue, Svelte, styled-components, Tailwind utilities, or raw CSS.',
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
