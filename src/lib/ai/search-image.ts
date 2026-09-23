/**
 * Validating a screenshot before it is charged for and sent to a model.
 *
 * ── WHY THE BYTES, NOT THE LABEL ────────────────────────────────────────
 *
 * A data URL announces its own type — `data:image/png;base64,…` — and that
 * announcement is written by whoever made the request. Trusting it means
 * a client can send an SVG (which can carry script and external references),
 * a PDF, an executable or a 40 MB TIFF under a `png` label, and this route
 * would forward it to a paid API and bill the user's daily allowance for the
 * privilege. So the declared type is only ever a claim to *check*: the first
 * bytes of the decoded payload — the file's magic number — decide what it is,
 * and a declared type that disagrees with them is rejected outright rather
 * than quietly corrected, because a request whose label is wrong is a request
 * that is not what it says.
 *
 * Only the three raster formats the vision API accepts and browsers can
 * produce from a canvas: PNG, JPEG, WebP. Not GIF (animated, and rarely a
 * screenshot), not SVG (a document, not pixels), not HEIC.
 *
 * ── WHY THE SIZE IS CHECKED FIRST, AND ON THE ENCODED LENGTH ────────────
 *
 * Decoding a multi-megabyte string to find out it is too big is the work the
 * cap exists to avoid. The decoded size of base64 is known from its length
 * and its padding, so that is computed first and the payload is never
 * decoded past its first sixteen bytes — enough for every magic number here.
 *
 * Pure and dependency-free (`atob` only), so it runs identically in the
 * route, in the browser for an early "too large" message, and in tests.
 */

/** Hard ceiling on the decoded image, in bytes. */
export const MAX_IMAGE_BYTES = 1_500_000

export const IMAGE_MEDIA_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const
export type ImageMediaType = (typeof IMAGE_MEDIA_TYPES)[number]

export interface ValidImage {
  /** What the bytes actually are — from the magic number, not the label. */
  mediaType: ImageMediaType
  /** Base64 with the data-URL prefix and any whitespace removed. */
  data: string
  /** Decoded size. */
  bytes: number
}

export type ImageRejection =
  | 'not-a-string'
  | 'empty'
  | 'malformed'
  | 'unsupported-type'
  | 'too-large'
  | 'type-mismatch'
  | 'not-an-image'

export type ImageCheck =
  | ({ ok: true } & ValidImage)
  | { ok: false; reason: ImageRejection; message: string }

const MESSAGES: Record<ImageRejection, string> = {
  'not-a-string': 'The image must be sent as a data URL or base64 string.',
  empty: 'The image is empty.',
  malformed: 'The image is not valid base64.',
  'unsupported-type': 'Only PNG, JPEG and WebP screenshots are supported.',
  'too-large': `The image is too large — the limit is ${(MAX_IMAGE_BYTES / 1_000_000).toFixed(1)} MB.`,
  'type-mismatch': 'The image does not match the type it declares.',
  'not-an-image': 'That file is not a PNG, JPEG or WebP image.',
}

function reject(reason: ImageRejection): ImageCheck {
  return { ok: false, reason, message: MESSAGES[reason] }
}

/** What the first bytes say the file is, or null. */
export function sniffImageType(head: Uint8Array): ImageMediaType | null {
  if (
    head.length >= 8 &&
    head[0] === 0x89 &&
    head[1] === 0x50 &&
    head[2] === 0x4e &&
    head[3] === 0x47 &&
    head[4] === 0x0d &&
    head[5] === 0x0a &&
    head[6] === 0x1a &&
    head[7] === 0x0a
  ) {
    return 'image/png'
  }
  if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
    return 'image/jpeg'
  }
  // RIFF <4-byte size> WEBP
  if (
    head.length >= 12 &&
    head[0] === 0x52 &&
    head[1] === 0x49 &&
    head[2] === 0x46 &&
    head[3] === 0x46 &&
    head[8] === 0x57 &&
    head[9] === 0x45 &&
    head[10] === 0x42 &&
    head[11] === 0x50
  ) {
    return 'image/webp'
  }
  return null
}

function normaliseDeclared(type: string): string {
  const t = type.trim().toLowerCase()
  return t === 'image/jpg' || t === 'image/pjpeg' ? 'image/jpeg' : t
}

/**
 * Check an untrusted image value.
 *
 * Accepts a `data:` URL, or bare base64 (the type is then whatever the bytes
 * say). Never throws.
 */
export function validateImage(input: unknown): ImageCheck {
  if (typeof input !== 'string') return reject('not-a-string')

  // Cheap ceiling before any scan: base64 is 4/3 of the decoded size, and a
  // data-URL header is well under 200 characters.
  if (input.length > Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 200) return reject('too-large')

  let declared: string | null = null
  let payload = input

  if (input.startsWith('data:')) {
    const comma = input.indexOf(',')
    if (comma === -1) return reject('malformed')
    const header = input.slice(5, comma)
    const parts = header.split(';')
    if (parts[parts.length - 1]?.toLowerCase() !== 'base64') return reject('malformed')
    declared = normaliseDeclared(parts[0] ?? '')
    payload = input.slice(comma + 1)
  }

  payload = payload.replace(/\s+/g, '')
  if (payload.length === 0) return reject('empty')
  if (payload.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(payload)) return reject('malformed')

  if (declared !== null && !(IMAGE_MEDIA_TYPES as readonly string[]).includes(declared)) {
    return reject('unsupported-type')
  }

  const padding = payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0
  const bytes = (payload.length / 4) * 3 - padding
  if (bytes > MAX_IMAGE_BYTES) return reject('too-large')

  // First 24 base64 characters = 18 bytes, enough for every signature above.
  let head: Uint8Array
  try {
    const binary = atob(payload.slice(0, 24))
    head = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  } catch {
    return reject('malformed')
  }

  const actual = sniffImageType(head)
  if (actual === null) return reject('not-an-image')
  if (declared !== null && declared !== actual) return reject('type-mismatch')

  return { ok: true, mediaType: actual, data: payload, bytes }
}
