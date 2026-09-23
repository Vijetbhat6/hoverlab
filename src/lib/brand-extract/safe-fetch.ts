import 'server-only'
import dns from 'node:dns'
import http from 'node:http'
import https from 'node:https'
import net from 'node:net'
import zlib from 'node:zlib'

/**
 * A fetch that will only talk to the public internet.
 *
 * ── WHY THIS FILE EXISTS ────────────────────────────────────────────────
 *
 * "Paste a URL and we read it" hands every visitor a request-forger that
 * runs from inside our network. Pointed at `http://169.254.169.254/` it asks
 * the cloud metadata service for credentials; pointed at `http://localhost`
 * it reads whatever the function host exposes. That is server-side request
 * forgery, and a plain `fetch(userUrl)` is exactly the bug. Everything below
 * is here to make the one call this feature needs safe to expose.
 *
 * ── THE ADDRESS CHECK RUNS WHERE THE CONNECTION IS MADE ─────────────────
 *
 * The obvious defence — resolve the hostname, check the address, then fetch
 * — is broken by DNS rebinding: a name can resolve to a public address for
 * the check and a private one for the fetch a millisecond later. So the
 * check is inside the `lookup` function the socket itself uses to connect.
 * The address that was checked is the address that is dialled, because they
 * are the same call. Every hop of a redirect goes through it too, since each
 * hop is a new request.
 *
 * What `lookup` cannot see is an IP *literal* (`http://10.0.0.1/`): Node does
 * not resolve those, so it never calls `lookup`. Those are checked up front.
 *
 * ── THE REST OF THE FENCE ───────────────────────────────────────────────
 *
 *   schemes    http and https only — no `file:`, no `gopher:`.
 *   ports      80 and 443 only. A public host's port 6379 is somebody's Redis.
 *   userinfo   refused. `http://user:pw@host` is credentials the visitor
 *              typed into a URL bar and we would forward.
 *   redirects  followed by hand, at most four, each re-validated.
 *   size       the *decoded* body is capped, so a 20KB gzip that inflates to
 *              2GB stops at the cap instead of at an out-of-memory.
 *   time       one wall-clock deadline for the whole call, not per socket.
 *   cookies    none sent, none kept. Nothing about the visitor is forwarded.
 *
 * WHAT IT DOES NOT PROMISE. It stops us reaching private space. It does not
 * stop a public site learning that Hoverlab fetched it, and it does not make
 * the returned text safe to render — the caller treats it as untrusted data.
 */

export class BlockedTargetError extends Error {
  constructor(message = 'That address is not reachable from the public internet.') {
    super(message)
    this.name = 'BlockedTargetError'
  }
}

export class FetchFailedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FetchFailedError'
  }
}

/* ------------------------------------------------------------------ *
 *  Which addresses are public
 * ------------------------------------------------------------------ */

/** Ranges that are never the public internet. */
const V4_DENY: Array<[string, number]> = [
  ['0.0.0.0', 8], // "this network"
  ['10.0.0.0', 8], // private
  ['100.64.0.0', 10], // carrier-grade NAT, and some clouds' internal space
  ['127.0.0.0', 8], // loopback
  ['169.254.0.0', 16], // link-local — the cloud metadata address lives here
  ['172.16.0.0', 12], // private
  ['192.0.0.0', 24], // IETF protocol assignments
  ['192.0.2.0', 24], // documentation
  ['192.88.99.0', 24], // 6to4 relay
  ['192.168.0.0', 16], // private
  ['198.18.0.0', 15], // benchmarking
  ['198.51.100.0', 24], // documentation
  ['203.0.113.0', 24], // documentation
  ['224.0.0.0', 4], // multicast
  ['240.0.0.0', 4], // reserved, including broadcast
]

/**
 * IPv6 is an allow-list: global unicast (2000::/3) minus the ranges inside it
 * that are not the public internet. An allow-list because the space outside
 * 2000::/3 is mostly things that should not be dialled and the failure mode
 * of forgetting one deny entry is an SSRF, while the failure mode of a
 * missing allow entry is a public host refused.
 */
const V6_DENY: Array<[string, number]> = [
  ['2001::', 32], // Teredo
  ['2001:db8::', 32], // documentation
  ['2002::', 16], // 6to4 — embeds an IPv4 address we would have to re-check
  ['3ffe::', 16], // the retired 6bone
]

const deny = new net.BlockList()
for (const [address, prefix] of V4_DENY) deny.addSubnet(address, prefix, 'ipv4')
for (const [address, prefix] of V6_DENY) deny.addSubnet(address, prefix, 'ipv6')

const v6Global = new net.BlockList()
v6Global.addSubnet('2000::', 3, 'ipv6')

/** True only for an address on the public internet. */
export function isPublicAddress(address: string): boolean {
  const family = net.isIP(address)
  if (family === 4) return !deny.check(address, 'ipv4')
  if (family === 6) {
    // `::ffff:127.0.0.1` is loopback wearing an IPv6 coat, and it is not in
    // 2000::/3, so the allow-list refuses it without a special case.
    return v6Global.check(address, 'ipv6') && !deny.check(address, 'ipv6')
  }
  return false
}

/* ------------------------------------------------------------------ *
 *  The request
 * ------------------------------------------------------------------ */

export interface FetchOptions {
  /** Cap on the DECODED body. Past it the body is cut and `truncated` is set. */
  maxBytes: number
  /** One deadline for the whole call, redirects included. */
  timeoutMs: number
  /** Accepted `Content-Type`s; anything else is refused before it is read. */
  accept: RegExp
  maxRedirects?: number
}

export interface FetchResult {
  /** The URL after redirects. */
  url: string
  status: number
  body: string
  truncated: boolean
}

type Guard = (address: string) => boolean

const USER_AGENT = 'HoverlabBrandReader/1.0 (+https://hoverlab5.netlify.app/themes)'

/** The only ports a public web page is read from. */
const WEB_PORTS = [80, 443]

/** Validate everything about a URL that does not need the network. */
export function checkTarget(
  url: URL,
  guard: Guard = isPublicAddress,
  ports: readonly number[] = WEB_PORTS,
): void {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new BlockedTargetError('Only http and https addresses can be read.')
  }
  if (url.username || url.password) {
    throw new BlockedTargetError('Addresses with a username or password are not accepted.')
  }
  const port = url.port ? Number(url.port) : url.protocol === 'https:' ? 443 : 80
  if (!ports.includes(port)) {
    throw new BlockedTargetError('Only the standard web ports can be read.')
  }
  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase()
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    throw new BlockedTargetError()
  }
  // Literals skip `lookup`, so they are the one thing checked here.
  if (net.isIP(host) && !guard(host)) throw new BlockedTargetError()
}

/** Exported so the connect-time check can be tested without a network. */
export function guardedLookup(guard: Guard): net.LookupFunction {
  return (hostname, options, callback) => {
    dns.lookup(hostname, { all: true, verbatim: true }, (error, addresses) => {
      if (error) return callback(error, '', 4)
      // Every address, not the first: a name with one public and one
      // private record would otherwise be a coin flip on which is dialled.
      if (addresses.length === 0 || addresses.some((a) => !guard(a.address))) {
        return callback(new BlockedTargetError(), '', 4)
      }
      if ((options as { all?: boolean }).all) {
        return (callback as unknown as (e: null, a: dns.LookupAddress[]) => void)(null, addresses)
      }
      return callback(null, addresses[0]!.address, addresses[0]!.family)
    })
  }
}

function decoder(encoding: string | undefined): zlib.Gunzip | zlib.Inflate | zlib.BrotliDecompress | null {
  switch (encoding?.trim().toLowerCase()) {
    case 'gzip':
    case 'x-gzip':
      return zlib.createGunzip()
    case 'deflate':
      return zlib.createInflate()
    case 'br':
      return zlib.createBrotliDecompress()
    default:
      return null
  }
}

interface Hop {
  status: number
  location: string | null
  body: string
  truncated: boolean
}

function requestOnce(url: URL, options: FetchOptions, guard: Guard, deadline: number): Promise<Hop> {
  return new Promise((resolve, reject) => {
    const remaining = deadline - Date.now()
    if (remaining <= 0) return reject(new FetchFailedError('The site took too long to answer.'))

    const lib = url.protocol === 'https:' ? https : http
    const request = lib.request(
      {
        method: 'GET',
        hostname: url.hostname.replace(/^\[|\]$/g, ''),
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        headers: {
          'user-agent': USER_AGENT,
          accept: 'text/html,application/xhtml+xml,text/css;q=0.9,*/*;q=0.1',
          'accept-encoding': 'gzip, deflate, br',
          'accept-language': 'en',
        },
        // A fresh connection every time: no keep-alive pool for a checked
        // address to leak from one visitor's request into another's.
        agent: false,
        lookup: guardedLookup(guard),
      },
      (response) => {
        const status = response.statusCode ?? 0
        const location = response.headers.location ?? null
        if (status >= 300 && status < 400 && location) {
          response.resume()
          return resolve({ status, location, body: '', truncated: false })
        }

        const type = String(response.headers['content-type'] ?? '')
        if (status < 200 || status >= 300) {
          response.resume()
          return reject(new FetchFailedError(`The site answered ${status}.`))
        }
        if (!options.accept.test(type)) {
          response.resume()
          return reject(new FetchFailedError('That address did not return a web page.'))
        }

        const chunks: Buffer[] = []
        let total = 0
        let truncated = false
        let done = false
        const finish = () => {
          if (done) return
          done = true
          resolve({ status, location: null, body: Buffer.concat(chunks).toString('utf8'), truncated })
        }
        const source = decoder(response.headers['content-encoding'])
        // Piped streams do not forward errors, and an unhandled 'error' on
        // the raw response — which is what `request.destroy()` after the cap
        // produces — would take the whole process down.
        response.on('error', (error) => {
          if (truncated) return finish()
          reject(new FetchFailedError(`The response could not be read: ${error.message}`))
        })
        const stream: NodeJS.ReadableStream = source ? response.pipe(source) : response

        stream.on('data', (chunk: Buffer) => {
          if (truncated) return
          const room = options.maxBytes - total
          if (chunk.length >= room) {
            chunks.push(chunk.subarray(0, room))
            total += room
            truncated = true
            request.destroy()
            return finish()
          }
          chunks.push(chunk)
          total += chunk.length
        })
        stream.on('end', finish)
        stream.on('error', (error: Error) => {
          // A cut-off decoder after we stopped reading is expected.
          if (truncated) return finish()
          reject(new FetchFailedError(`The response could not be read: ${error.message}`))
        })
      },
    )

    request.setTimeout(remaining, () => request.destroy(new FetchFailedError('The site took too long to answer.')))
    request.on('error', (error) => {
      if (error instanceof BlockedTargetError || error instanceof FetchFailedError) return reject(error)
      // `dns.lookup` failures and refused connections surface as codes.
      const code = (error as NodeJS.ErrnoException).code
      if (code === 'ENOTFOUND' || code === 'EAI_AGAIN') {
        return reject(new FetchFailedError('That address could not be found.'))
      }
      reject(new FetchFailedError('The site could not be reached.'))
    })
    request.end()
  })
}

export interface FetcherConfig {
  guard?: Guard
  ports?: readonly number[]
}

/**
 * Build a fetcher around an address guard and a port list.
 *
 * Both are parameters so the redirect, size and decoding behaviour can be
 * tested against a server on 127.0.0.1 on a random port without weakening the
 * exported default — the only one the route uses, and one nothing can
 * reconfigure after import.
 */
export function createFetcher({ guard = isPublicAddress, ports = WEB_PORTS }: FetcherConfig = {}) {
  return async function fetchText(rawUrl: string | URL, options: FetchOptions): Promise<FetchResult> {
    const deadline = Date.now() + options.timeoutMs
    const maxRedirects = options.maxRedirects ?? 4
    let current: URL
    try {
      current = new URL(rawUrl)
    } catch {
      throw new BlockedTargetError('That does not look like a web address.')
    }

    for (let hop = 0; hop <= maxRedirects; hop += 1) {
      checkTarget(current, guard, ports)
      const result = await requestOnce(current, options, guard, deadline)
      if (!result.location) return { url: current.href, ...result }

      try {
        current = new URL(result.location, current)
      } catch {
        throw new FetchFailedError('The site redirected somewhere that is not an address.')
      }
    }
    throw new FetchFailedError('The site redirected too many times.')
  }
}

/** The fetcher the route uses: public addresses only. */
export const fetchText = createFetcher()
