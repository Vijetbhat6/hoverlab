#!/usr/bin/env node

/**
 * `hoverlab` CLI entry point.
 *
 * Dispatch only — the commands live in ../src so the MCP server can reuse
 * the same implementations without shelling out.
 */

import { createRequire } from 'node:module'

import {
  commandAdd,
  commandCategories,
  commandDna,
  commandHelp,
  commandInit,
  commandLogin,
  commandLogout,
  commandSearch,
  commandShow,
  commandSkill,
  commandWhoami,
} from '../src/commands.mjs'
import { FRAMEWORKS } from '../src/api.mjs'

const require = createRequire(import.meta.url)
const { version } = require('../package.json')

/** Flags that take a value; everything else is boolean. */
const VALUE_FLAGS = new Set([
  'framework', 'dir', 'category', 'limit', 'level', 'hue', 'sat', 'scale', 'speed',
  'brand', 'out',
])

/** Flags parsed as numbers rather than strings. */
const NUMERIC_FLAGS = new Set(['limit', 'hue', 'sat', 'scale', 'speed'])

const ALIASES = {
  f: 'framework',
  d: 'dir',
  h: 'help',
  v: 'version',
  c: 'category',
  n: 'limit',
  l: 'level',
}

/**
 * Minimal argv parser: long flags, single-char aliases, `--flag=value`,
 * and `--` to stop parsing. Enough for this surface, and one fewer
 * dependency between the user and their effect.
 */
function parseArgs(argv) {
  const positional = []
  const flags = {}

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]

    if (arg === '--') {
      positional.push(...argv.slice(i + 1))
      break
    }

    if (!arg.startsWith('-') || arg === '-') {
      positional.push(arg)
      continue
    }

    const isLong = arg.startsWith('--')
    let body = isLong ? arg.slice(2) : arg.slice(1)
    let inlineValue = null

    const equals = body.indexOf('=')
    if (equals !== -1) {
      inlineValue = body.slice(equals + 1)
      body = body.slice(0, equals)
    }

    const name = isLong ? body : (ALIASES[body] ?? body)

    if (VALUE_FLAGS.has(name)) {
      const raw = inlineValue ?? argv[++i]
      if (raw === undefined) {
        throw new Error(`--${name} needs a value`)
      }
      if (NUMERIC_FLAGS.has(name)) {
        const parsed = Number(raw)
        if (!Number.isFinite(parsed)) {
          throw new Error(`--${name} expects a number, got "${raw}"`)
        }
        flags[name] = parsed
      } else {
        flags[name] = raw
      }
      continue
    }

    flags[name] = inlineValue === null ? true : inlineValue !== 'false'
  }

  return { positional, flags }
}

async function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2))

  if (flags.version) {
    process.stdout.write(`${version}\n`)
    return
  }

  const [command, ...rest] = positional

  if (!command || flags.help || command === 'help') {
    commandHelp()
    return
  }

  if (flags.framework && !FRAMEWORKS.includes(flags.framework)) {
    throw new Error(
      `Unknown framework "${flags.framework}". Pick one of: ${FRAMEWORKS.join(', ')}.`,
    )
  }

  switch (command) {
    case 'add':
    case 'install':
      await commandAdd(rest, flags)
      return

    case 'init':
    case 'create':
    case 'new':
      await commandInit(rest, flags)
      return

    case 'search':
    case 'find':
      await commandSearch(rest, flags)
      return

    case 'show':
    case 'view':
      await commandShow(rest, flags)
      return

    case 'categories':
    case 'list':
      await commandCategories(rest, flags)
      return

    case 'skill':
    case 'skills':
      await commandSkill(rest, flags)
      return

    case 'dna':
      await commandDna(rest, flags)
      return

    case 'login':
      await commandLogin(rest, flags)
      return

    case 'logout':
      await commandLogout(rest, flags)
      return

    case 'whoami':
      await commandWhoami(rest, flags)
      return

    case 'mcp': {
      // Imported lazily: starting the server takes over stdin, and none of
      // the other commands should pay for loading it.
      const { startMcpServer } = await import('../src/mcp.mjs')
      await startMcpServer()
      return
    }

    default:
      throw new Error(`Unknown command "${command}". Run \`hoverlab help\` to see the options.`)
  }
}

main().catch((error) => {
  if (!error?.quiet) {
    process.stderr.write(`${error?.message ?? error}\n`)
  }
  process.exitCode = 1
})
