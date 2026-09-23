import 'server-only'

import { extractBrand, type BrandExtraction } from './extract'
import {
  BlockedTargetError,
  createFetcher,
  fetchText as publicFetch,
} from './safe-fetch'

/**
 * A URL in, a brand out.
 *
 * The network half of the feature: fetch the page, find the stylesheets it
 * links, fetch those, hand all of it to the pure extractor. Everything
 * dangerous about it is in `safe-fetch.ts`; this file decides *what* to
 * fetch, not how.
 *
 * BUDGET. Netlify's function timeout is ten seconds and a visitor is waiting,
 * so the page gets five and the stylesheets share four in parallel. A
 * stylesheet that is slow is dropped, not waited for: a brand read from four
 * of five files is a better answer than a timeout. Six files and 600KB each
 * is the ceiling — a real site's CSS is one to three files and under 300KB.
 */

const HTML_BYTES = 1_500_000
const CSS_BYTES = 600_000
const MAX_STYLESHEETS = 6

export class InvalidUrlError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidUrlError'
  }
}

/**
 * What a visitor typed → a URL.
 *
 * People paste `stripe.com` far more often than `https://stripe.com`, and
 * refusing the first is a bounce for no safety benefit — the fetcher
 * validates the result either way.
 */
export function normalizeInput(raw: string): URL {
  const text = raw.trim()
  if (!text || text.length > 2048) throw new InvalidUrlError('Enter a website address.')
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `https://${text}`
  let url: URL
  try {
    url = new URL(withScheme)
  } catch {
    throw new InvalidUrlError('That does not look like a web address.')
  }
  if (!url.hostname.includes('.') && !/^\[.*\]$/.test(url.hostname)) {
    throw new InvalidUrlError('That does not look like a web address.')
  }
  return url
}

/** `href`s of the page's stylesheets, resolved, deduplicated, in page order. */
export function stylesheetUrls(html: string, base: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const tag of html.matchAll(/<link\b[^>]*>/gi)) {
    const text = tag[0]
    const rel = /\brel\s*=\s*["']?([^"'>\s]+(?:\s+[^"'>\s]+)*)/i.exec(text)?.[1]?.toLowerCase() ?? ''
    const as = /\bas\s*=\s*["']?(\w+)/i.exec(text)?.[1]?.toLowerCase()
    const isStyle = rel.split(/\s+/).includes('stylesheet') || (rel.includes('preload') && as === 'style')
    if (!isStyle) continue
    const href = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(text)
    const raw = href?.[1] ?? href?.[2] ?? href?.[3]
    if (!raw) continue
    try {
      const resolved = new URL(raw.replace(/&amp;/g, '&'), base).href
      if (!seen.has(resolved) && /^https?:/i.test(resolved)) {
        seen.add(resolved)
        out.push(resolved)
      }
    } catch {
      /* A malformed href is one stylesheet lost, not a failed read. */
    }
  }
  return out.slice(0, MAX_STYLESHEETS)
}

export async function extractBrandFromUrl(
  raw: string,
  fetcher: ReturnType<typeof createFetcher> = publicFetch,
): Promise<BrandExtraction> {
  const target = normalizeInput(raw)

  const page = await fetcher(target, {
    maxBytes: HTML_BYTES,
    timeoutMs: 5000,
    accept: /^(?:text\/html|application\/xhtml)/i,
  })

  const hrefs = stylesheetUrls(page.body, page.url)
  const settled = await Promise.allSettled(
    hrefs.map((href) =>
      fetcher(href, { maxBytes: CSS_BYTES, timeoutMs: 4000, accept: /^text\/css|^text\/plain|^application\/octet-stream/i }),
    ),
  )

  const stylesheets: Array<{ url: string; css: string }> = []
  for (const [i, result] of settled.entries()) {
    if (result.status === 'fulfilled') stylesheets.push({ url: result.value.url, css: result.value.body })
    // A blocked stylesheet is not swallowed like a slow one: a page that links
    // an internal address is either a mistake or a probe, and either way the
    // request that revealed it should say so rather than return a plausible
    // partial answer.
    else if (result.reason instanceof BlockedTargetError) {
      console.warn(`[brand-extract] refused a stylesheet address: ${hrefs[i]}`)
    }
  }

  const extraction = extractBrand({ url: page.url, html: page.body, stylesheets })
  if (page.truncated) {
    extraction.notes.push('The page was very large and only its first part was read.')
  }
  if (hrefs.length > stylesheets.length) {
    extraction.notes.push(
      `${hrefs.length - stylesheets.length} of ${hrefs.length} stylesheets could not be read, so some of the site's colours may be missing.`,
    )
  }
  return extraction
}
