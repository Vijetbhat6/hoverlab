import { after, before, describe, test } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import type { AddressInfo } from 'node:net'
import zlib from 'node:zlib'

import {
  BlockedTargetError,
  FetchFailedError,
  checkTarget,
  createFetcher,
  fetchText,
  guardedLookup,
  isPublicAddress,
} from './safe-fetch'

/**
 * This is the file that decides whether "paste a URL" is a feature or a
 * vulnerability, so it tests the refusals harder than the successes.
 *
 * The behaviour tests run against a real HTTP server on 127.0.0.1 rather than
 * a mock. A mocked socket would prove the fetcher calls the guard; only a real
 * loopback server proves the production fetcher REFUSES to connect to it,
 * which is the property that matters. The permissive fetcher used for the
 * redirect, size and decoding cases is built with `createFetcher` and an
 * allow-loopback guard, and is never what the route imports.
 */

const html = '<!doctype html><title>hi</title>'

let server: http.Server
let base: string

before(async () => {
  server = http.createServer((req, res) => {
    const path = req.url ?? '/'
    if (path === '/ok') {
      res.writeHead(200, { 'content-type': 'text/html' })
      return res.end(html)
    }
    if (path === '/redirect-ok') {
      res.writeHead(302, { location: '/ok' })
      return res.end()
    }
    if (path === '/redirect-metadata') {
      res.writeHead(302, { location: 'http://169.254.169.254/latest/meta-data/' })
      return res.end()
    }
    if (path === '/redirect-scheme') {
      res.writeHead(302, { location: 'file:///etc/passwd' })
      return res.end()
    }
    if (path === '/redirect-loop') {
      res.writeHead(302, { location: '/redirect-loop' })
      return res.end()
    }
    if (path === '/json') {
      res.writeHead(200, { 'content-type': 'application/json' })
      return res.end('{"a":1}')
    }
    if (path === '/500') {
      res.writeHead(500, { 'content-type': 'text/html' })
      return res.end('nope')
    }
    if (path === '/big') {
      res.writeHead(200, { 'content-type': 'text/html' })
      return res.end('x'.repeat(200_000))
    }
    if (path === '/bomb') {
      // 5MB of zeros compresses to a few KB: the classic decompression bomb.
      res.writeHead(200, { 'content-type': 'text/html', 'content-encoding': 'gzip' })
      return res.end(zlib.gzipSync(Buffer.alloc(5_000_000, 0x61)))
    }
    if (path === '/gzip') {
      res.writeHead(200, { 'content-type': 'text/html', 'content-encoding': 'gzip' })
      return res.end(zlib.gzipSync(html))
    }
    if (path === '/hang') {
      // Never answers.
      return
    }
    res.writeHead(404).end()
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})

after(() => {
  server.closeAllConnections()
  server.close()
})

/**
 * The fetcher with this test server's random port allowed, and exactly one
 * address: 127.0.0.1. A redirect to 10.x or 169.254.x is still refused.
 */
function local() {
  const port = (server.address() as AddressInfo).port
  return createFetcher({ guard: (a) => a === '127.0.0.1', ports: [port] })
}

const options = { maxBytes: 100_000, timeoutMs: 3000, accept: /^text\/html/ }

describe('which addresses are public', () => {
  const blocked = [
    '127.0.0.1',
    '127.255.255.254',
    '10.0.0.1',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.1.1',
    '169.254.169.254', // cloud metadata
    '100.64.0.1', // carrier-grade NAT
    '0.0.0.0',
    '224.0.0.1',
    '255.255.255.255',
    '::1',
    '::',
    'fe80::1',
    'fc00::1',
    'fd12:3456::1',
    '::ffff:127.0.0.1', // loopback in an IPv6 coat
    '::ffff:10.0.0.1',
    '2001:db8::1',
    '2002:7f00:1::', // 6to4 wrapping 127.0.0.1
    'not an address',
    '',
  ]
  for (const address of blocked) {
    test(`refuses ${JSON.stringify(address)}`, () => assert.equal(isPublicAddress(address), false))
  }

  const allowed = ['8.8.8.8', '1.1.1.1', '93.184.216.34', '172.32.0.1', '2606:4700:4700::1111']
  for (const address of allowed) {
    test(`allows ${address}`, () => assert.equal(isPublicAddress(address), true))
  }
})

describe('what a URL may be', () => {
  const refused = [
    'file:///etc/passwd',
    'gopher://example.com/',
    'ftp://example.com/',
    'http://localhost/',
    'http://foo.localhost/',
    'http://printer.local/',
    'http://db.internal/',
    'http://127.0.0.1/',
    'http://[::1]/',
    'http://169.254.169.254/latest/meta-data/',
    'http://2130706433/', // 127.0.0.1 as a single integer
    'http://0x7f.1/', // hex-encoded loopback
    'http://user:pw@example.com/',
    'http://example.com:6379/',
    'https://example.com:8443/',
  ]
  for (const url of refused) {
    test(`refuses ${url}`, () => assert.throws(() => checkTarget(new URL(url)), BlockedTargetError))
  }

  test('allows an ordinary public address', () => {
    assert.doesNotThrow(() => checkTarget(new URL('https://example.com/path?q=1')))
    assert.doesNotThrow(() => checkTarget(new URL('http://93.184.216.34/')))
  })
})

describe('the connect-time check', () => {
  test('a hostname that resolves to loopback is refused by the lookup itself', async () => {
    // `localhost` resolves to 127.0.0.1/::1 on every OS. This is the DNS
    // rebinding case in miniature: the name looks harmless, the answer is not.
    const error = await new Promise<Error | null>((resolve) =>
      guardedLookup(isPublicAddress)('localhost', {}, (e) => resolve(e as Error | null)),
    )
    assert.ok(error instanceof BlockedTargetError)
  })

  test('the same lookup passes when the guard allows the answer', async () => {
    const result = await new Promise<{ error: Error | null; address: unknown }>((resolve) =>
      guardedLookup(() => true)('localhost', {}, (error, address) =>
        resolve({ error: error as Error | null, address }),
      ),
    )
    assert.equal(result.error, null)
    assert.ok(result.address)
  })
})

describe('the production fetcher', () => {
  test('refuses a real server on loopback', async () => {
    // The whole point. A live 127.0.0.1 server, the shipped fetcher: no bytes.
    await assert.rejects(fetchText(`${base}/ok`, options), BlockedTargetError)
  })

  test('refuses a metadata-service address', async () => {
    await assert.rejects(fetchText('http://169.254.169.254/latest/meta-data/', options), BlockedTargetError)
  })
})

describe('fetching, once the address is allowed', () => {
  test('returns the body and the final URL', async () => {
    const result = await local()(`${base}/ok`, options)
    assert.equal(result.status, 200)
    assert.equal(result.body, html)
    assert.equal(result.truncated, false)
  })

  test('follows a redirect', async () => {
    const result = await local()(`${base}/redirect-ok`, options)
    assert.equal(result.url, `${base}/ok`)
    assert.equal(result.body, html)
  })

  test('a redirect to a private address is refused, not followed', async () => {
    await assert.rejects(local()(`${base}/redirect-metadata`, options), BlockedTargetError)
  })

  test('a redirect to a non-web scheme is refused', async () => {
    await assert.rejects(local()(`${base}/redirect-scheme`, options), BlockedTargetError)
  })

  test('a redirect loop ends', async () => {
    await assert.rejects(local()(`${base}/redirect-loop`, options), FetchFailedError)
  })

  test('refuses a content type it did not ask for, before reading it', async () => {
    await assert.rejects(local()(`${base}/json`, options), /did not return a web page/)
  })

  test('a non-2xx status is a failure, not a body', async () => {
    await assert.rejects(local()(`${base}/500`, options), /500/)
  })

  test('cuts an oversize body at the cap and says so', async () => {
    const result = await local()(`${base}/big`, { ...options, maxBytes: 10_000 })
    assert.equal(result.truncated, true)
    assert.equal(result.body.length, 10_000)
  })

  test('decodes gzip', async () => {
    const result = await local()(`${base}/gzip`, options)
    assert.equal(result.body, html)
  })

  test('a decompression bomb stops at the cap, not at memory', async () => {
    const result = await local()(`${base}/bomb`, { ...options, maxBytes: 50_000 })
    assert.equal(result.truncated, true)
    assert.equal(result.body.length, 50_000)
  })

  test('a server that never answers hits the deadline', async () => {
    const started = Date.now()
    await assert.rejects(local()(`${base}/hang`, { ...options, timeoutMs: 300 }), /too long/)
    assert.ok(Date.now() - started < 2000, 'gave up promptly')
  })
})
