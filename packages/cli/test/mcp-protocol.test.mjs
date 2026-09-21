/**
 * The MCP server, spoken to the way a client speaks to it.
 *
 * `mcp-args.test.mjs` pins the argument checking by importing the module.
 * This spawns the real process and exchanges newline-delimited JSON-RPC over
 * stdio, because the things that matter here are properties of the wire, not
 * of any one function: the version a client sees, the capabilities it is
 * told about, that resources and prompts answer at all, and that stdout
 * carries frames and nothing else.
 *
 * The API origin is pointed at a closed port so nothing here touches the
 * network. Every case is either answered locally or is meant to fail — and
 * one, `resources/list`, is meant to *survive* the failure.
 */

import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))
const BIN = path.join(here, '..', 'bin', 'hoverlab.mjs')
const { version } = createRequire(import.meta.url)('../package.json')

/** A running server and a way to ask it things. */
function startServer() {
  const child = spawn(process.execPath, [BIN, 'mcp'], {
    env: { ...process.env, HOVERLAB_API_URL: 'http://127.0.0.1:9', HOVERLAB_NO_TELEMETRY: '1' },
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  const pending = new Map()
  const stray = []
  let buffer = ''

  child.stdout.setEncoding('utf8')
  child.stdout.on('data', (chunk) => {
    buffer += chunk
    let newline
    while ((newline = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newline)
      buffer = buffer.slice(newline + 1)
      if (!line.trim()) continue
      let message
      try {
        message = JSON.parse(line)
      } catch {
        // Anything on stdout that is not a JSON frame corrupts the stream.
        stray.push(line)
        continue
      }
      pending.get(message.id)?.(message)
      pending.delete(message.id)
    }
  })

  let nextId = 1
  const request = (method, params) =>
    new Promise((resolve, reject) => {
      const id = nextId++
      const timer = setTimeout(() => reject(new Error(`${method} timed out`)), 10_000)
      pending.set(id, (message) => {
        clearTimeout(timer)
        resolve(message)
      })
      child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`)
    })

  const call = async (name, args) => (await request('tools/call', { name, arguments: args })).result

  return { child, request, call, stray, stop: () => child.kill() }
}

describe('the server over stdio', () => {
  let server

  before(async () => {
    server = startServer()
    await server.request('initialize', { protocolVersion: '2025-06-18', capabilities: {} })
  })

  after(() => server.stop())

  test('reports the version of the package it ships in', async () => {
    const { result } = await server.request('initialize', { protocolVersion: '2025-06-18' })
    assert.equal(result.serverInfo.version, version)
    assert.equal(result.serverInfo.name, 'hoverlab')
  })

  test('advertises tools, resources and prompts', async () => {
    const { result } = await server.request('initialize', { protocolVersion: '2025-06-18' })
    assert.ok(result.capabilities.tools)
    assert.ok(result.capabilities.resources)
    assert.ok(result.capabilities.prompts)
  })

  test('every tool carries a title and honest annotations', async () => {
    const { result } = await server.request('tools/list')
    assert.ok(result.tools.length > 0)

    for (const tool of result.tools) {
      assert.ok(tool.title, `${tool.name} has no title`)
      assert.equal(typeof tool.annotations.readOnlyHint, 'boolean', `${tool.name} readOnlyHint`)
      assert.equal(typeof tool.annotations.openWorldHint, 'boolean', `${tool.name} openWorldHint`)
    }

    // The property clients grant permission by. A writer marked read-only
    // would let an agent put files on disk without being asked.
    const writers = ['install_effect', 'install_artifact', 'init_template']
    for (const name of writers) {
      const tool = result.tools.find((t) => t.name === name)
      assert.equal(tool.annotations.readOnlyHint, false, `${name} writes files`)
      assert.equal(tool.annotations.destructiveHint, true, `${name} can overwrite with force`)
    }
    const readers = result.tools.filter((t) => !writers.includes(t.name))
    for (const tool of readers) {
      assert.equal(tool.annotations.readOnlyHint, true, `${tool.name} should not be a writer`)
    }
  })

  test('review_code stays on the machine', async () => {
    const { result } = await server.request('tools/list')
    const review = result.tools.find((t) => t.name === 'review_code')
    assert.ok(review, 'review_code is listed')
    assert.equal(review.annotations.openWorldHint, false)
  })

  test('review_code finds a defect in source that was never saved', async () => {
    const result = await server.call('review_code', {
      source: 'export const A = () => <button className="p-2"><svg /></button>',
      path: 'components/a.tsx',
    })
    assert.equal(result.isError, false)
    const text = result.content[0].text
    assert.match(text, /components\/a\.tsx/)
    assert.match(text, /violation/i)
  })

  test('review_code says so when the source is clean', async () => {
    const result = await server.call('review_code', {
      source: 'export const A = () => <button aria-label="Close"><svg aria-hidden="true" /></button>',
    })
    assert.equal(result.isError, false)
    assert.match(result.content[0].text, /No design defects found/)
  })

  test('review_code refuses source with a path that is not a component file', async () => {
    const result = await server.call('review_code', { source: 'x', path: 'notes.txt' })
    assert.equal(result.isError, true)
    assert.match(result.content[0].text, /\.tsx or \.jsx/)
  })

  test('review_code refuses to read outside the project', async () => {
    const result = await server.call('review_code', { paths: ['../../../etc/passwd'] })
    assert.equal(result.isError, true)
    assert.match(result.content[0].text, /outside the project/)
  })

  test('review_code refuses source and paths together', async () => {
    const result = await server.call('review_code', { source: 'x', paths: ['a.tsx'] })
    assert.equal(result.isError, true)
  })

  test('resources/list survives an unreachable catalog', async () => {
    const { result } = await server.request('resources/list')
    const uris = result.resources.map((r) => r.uri)
    assert.ok(uris.includes('hoverlab://dna'))
    assert.ok(uris.includes('hoverlab://kits'))
  })

  test('resource templates name the parameterised URIs', async () => {
    const { result } = await server.request('resources/templates/list')
    const templates = result.resourceTemplates.map((t) => t.uriTemplate)
    assert.ok(templates.includes('hoverlab://artifact/{id}'))
  })

  test('an unknown resource is -32002, not an internal error', async () => {
    const { error } = await server.request('resources/read', { uri: 'hoverlab://nonsense/x' })
    assert.equal(error.code, -32002)
  })

  test('a foreign URI scheme is not found either', async () => {
    const { error } = await server.request('resources/read', { uri: 'file:///etc/passwd' })
    assert.equal(error.code, -32002)
  })

  test('prompts list and resolve', async () => {
    const { result: list } = await server.request('prompts/list')
    const names = list.prompts.map((p) => p.name)
    for (const expected of ['add-section', 'build-from-design', 'scaffold-project', 'review-changes']) {
      assert.ok(names.includes(expected), `missing prompt ${expected}`)
    }
    // The renderer is an implementation detail, not part of the wire shape.
    assert.ok(list.prompts.every((p) => p.text === undefined))

    const { result } = await server.request('prompts/get', {
      name: 'add-section',
      arguments: { what: 'a pricing table' },
    })
    const text = result.messages[0].content.text
    assert.match(text, /a pricing table/)
    assert.match(text, /review_code/)
  })

  test('a prompt missing its required argument is invalid params', async () => {
    const { error } = await server.request('prompts/get', { name: 'add-section', arguments: {} })
    assert.equal(error.code, -32602)
    assert.match(error.message, /what/)
  })

  test('an unknown prompt is invalid params and lists the real ones', async () => {
    const { error } = await server.request('prompts/get', { name: 'nope' })
    assert.equal(error.code, -32602)
    assert.match(error.message, /add-section/)
  })

  test('stdout carried frames and nothing else', () => {
    assert.deepEqual(server.stray, [])
  })
})

describe('prompt text', () => {
  test('states no catalog counts', async () => {
    const { PROMPTS } = await import('../src/mcp-extras.mjs')
    for (const prompt of PROMPTS) {
      const text = prompt.text(Object.fromEntries(prompt.arguments.map((a) => [a.name, 'x'])))
      // "one to two" is fine; "291 blocks" is the thing that goes stale.
      assert.ok(!/\d{2,}\s+(effects|blocks|pages|templates)/i.test(text), `${prompt.name} states a count`)
    }
  })
})

describe('registry manifest', () => {
  const pkg = createRequire(import.meta.url)('../package.json')
  const manifest = createRequire(import.meta.url)('../server.json')

  test('server.json describes the package it ships beside', () => {
    // The registry publishes what server.json says, and rejects a package
    // whose mcpName differs. A drifted version publishes a listing that
    // installs something other than what it names.
    assert.equal(manifest.version, pkg.version)
    assert.equal(manifest.packages[0].version, pkg.version)
    assert.equal(manifest.packages[0].identifier, pkg.name)
    assert.equal(manifest.name, pkg.mcpName)
  })

  test('the description fits the registry limit', () => {
    assert.ok(manifest.description.length <= 100, `${manifest.description.length} chars`)
  })

  test('the launch arguments are the ones the CLI actually accepts', () => {
    const args = manifest.packages[0].packageArguments.map((a) => a.value)
    assert.deepEqual(args, ['mcp'])
  })
})
