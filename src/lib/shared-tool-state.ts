/**
 * The `#s=` codec the designer tools share state with.
 *
 * This is only the base64url-JSON half. The window plumbing — reading the
 * live hash, stripping it afterwards, building a URL against the current
 * origin, refusing a payload too long to survive a chat client — stays in
 * `components/designer-tools/share-link.tsx`, which is where it was and
 * where it belongs.
 *
 * It is split out because the encode half is now also wanted by callers who
 * are *not* a tool: the theme pills in the landing hero build a link into
 * /tools/tokens carrying the theme somebody just picked. Importing
 * `share-link` for that would drag `sonner`, `copyWithToast` and a Button
 * into the bundle of the highest-traffic page on the site to do forty lines
 * of base64 — so the forty lines live here, dependency-free and
 * framework-free, and `share-link` imports them back.
 *
 * Deliberately NOT `'use client'`. There is nothing browser-specific in
 * here: `TextEncoder`, `btoa` and `atob` are all available on the server
 * too, so a server component that wants to build a shared link can.
 */

/**
 * Encode a state object as the `#s=…` fragment, or null if it cannot be.
 *
 * Null rather than a throw or a truncation, because the only two honest
 * outcomes are a link that works and no link at all. A truncated payload
 * decodes to nothing on the far end while still looking like a working
 * link, which is the failure the recipient cannot diagnose.
 */
export function encodeSharedState(state: unknown): string | null {
  try {
    const bytes = new TextEncoder().encode(JSON.stringify(state))
    let bin = ''
    for (const b of bytes) bin += String.fromCharCode(b)
    const encoded = btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    return `#s=${encoded}`
  } catch {
    // A state carrying something JSON cannot express (a cycle, a BigInt).
    // No caller does this today; if one starts, it fails here rather than
    // producing a link that decodes to garbage.
    return null
  }
}

/**
 * Decode a `#s=…` fragment back to whatever was put in it, or null.
 *
 * The result is `unknown` by contract even though the signature is generic:
 * it came off a URL a stranger may have edited. Every caller runs it
 * through `shapeMatched` against the tool's own defaults before it reaches
 * state — see `hooks/use-tool-state.ts`.
 */
export function decodeSharedState<T>(hash: string): T | null {
  const m = /^#s=([A-Za-z0-9_-]+)$/.exec(hash)
  if (!m) return null
  try {
    const bin = atob(m[1]!.replace(/-/g, '+').replace(/_/g, '/'))
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes)) as T
  } catch {
    return null
  }
}

/**
 * The longest `#s=` payload we will put on a clipboard.
 *
 * Moved here from `share-link.tsx` so a Node test can import it without
 * pulling a client component — and `next/link` through it — into the
 * process. It also puts both ceilings a tool state has to live under in
 * libs a test can reach: this one and `TOOL_PRESET_LIMITS.stateBytes`.
 * `/studio` is the first state large enough for either to bind.
 *
 * Browsers take far more than this, but a link is shared through things
 * that do not: chat clients wrap it, some mail clients hard-break it, and a
 * URL that arrives split is worse than one that never arrived — the
 * recipient sees a link, clicks it, and lands on a tool showing defaults
 * with no indication anything was lost. 4,000 characters clears every
 * mainstream client with room to spare, and every tool's real state is an
 * order of magnitude under it. The tools that could exceed it are the ones
 * holding pasted documents (the code screenshotter), and for those the
 * honest answer is that a link is the wrong transport.
 */
export const SHARE_URL_MAX = 4000
