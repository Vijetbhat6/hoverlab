/**
 * Adobe Swatch Exchange (.ase) encoding.
 *
 * The palette tool emitted CSS variables, a Tailwind config and JSON — three
 * formats for the same audience, and none for the one that asks for a
 * palette file by name. `.ase` is what opens a palette in Photoshop,
 * Illustrator, InDesign, Figma, Sketch and Affinity, and it is the single
 * export the tools this competes with lead with.
 *
 * THE FORMAT
 *
 * Adobe never published a spec; this follows the one the ecosystem
 * converged on, which every reader above implements. Everything is
 * big-endian.
 *
 *   "ASEF"                      4 bytes, the signature
 *   version                     uint16 major, uint16 minor — 1.0
 *   block count                 uint32
 *   blocks:
 *     type                      uint16 — 0x0001 colour, 0xC001 group open,
 *                               0xC002 group close
 *     length                    uint32, of the block body that follows
 *     body, for a colour entry:
 *       name length             uint16, in UTF-16 code units, INCLUDING
 *                               the terminating null
 *       name                    UTF-16BE, null-terminated
 *       model                   4 ASCII bytes — "RGB ", "CMYK", "LAB ",
 *                               "Gray". The trailing space in "RGB " is
 *                               part of the format, not a typo.
 *       channels                float32BE each — three for RGB, 0..1
 *       colour type             uint16 — 0 global, 1 spot, 2 normal
 *
 * Two details are where hand-rolled encoders usually go wrong, and both are
 * asserted in the tests: the name length counts UTF-16 code units rather
 * than bytes or characters, and it counts the null terminator. Get either
 * wrong and Photoshop reads the file without complaint and shows garbage
 * swatch names, which is a bug report that arrives months later.
 */

/** One swatch: a display name and an `#rrggbb` colour. */
export interface AseSwatch {
  name: string
  hex: string
}

/** `#rgb` or `#rrggbb` to three 0–255 channels, or null if it is neither. */
function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.trim().replace(/^#/, '')
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null
  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
  }
}

/**
 * A colour block's body, ready to be prefixed with its type and length.
 *
 * Built separately from the header because the header carries the body's
 * length, and computing that any way other than by measuring the finished
 * body is how the two drift apart.
 */
function colorBlockBody(swatch: AseSwatch): Uint8Array | null {
  const rgb = parseHex(swatch.hex)
  if (!rgb) return null

  /*
    The name in UTF-16 CODE UNITS, which is what `String.length` gives and
    what the format counts. A name outside the Basic Multilingual Plane —
    an emoji, say — is two code units, and a reader that was handed a
    character count would then run off the end of the string and misparse
    every block after it.
  */
  const units: number[] = []
  for (let i = 0; i < swatch.name.length; i++) units.push(swatch.name.charCodeAt(i))
  // The terminator is part of the declared length.
  const nameLength = units.length + 1

  const size = 2 + nameLength * 2 + 4 + 3 * 4 + 2
  const body = new Uint8Array(size)
  const view = new DataView(body.buffer)
  let o = 0

  view.setUint16(o, nameLength, false)
  o += 2
  for (const unit of units) {
    view.setUint16(o, unit, false)
    o += 2
  }
  view.setUint16(o, 0, false) // null terminator
  o += 2

  // "RGB " — the trailing space is required; the field is a fixed four bytes.
  for (const ch of 'RGB ') {
    body[o] = ch.charCodeAt(0)
    o += 1
  }

  view.setFloat32(o, rgb.r / 255, false)
  o += 4
  view.setFloat32(o, rgb.g / 255, false)
  o += 4
  view.setFloat32(o, rgb.b / 255, false)
  o += 4

  // 2 = "normal". Global and spot colours carry behaviour in the host app
  // that a palette exported from a web tool has no business asserting.
  view.setUint16(o, 2, false)

  return body
}

/**
 * Encode swatches as a `.ase` file.
 *
 * Swatches whose hex will not parse are skipped rather than encoded as
 * black: a palette file silently containing a colour the user never chose
 * is worse than one containing fewer swatches than they expected, because
 * only the second is visible.
 */
export function encodeAse(swatches: AseSwatch[]): Uint8Array {
  const bodies = swatches
    .map(colorBlockBody)
    .filter((b): b is Uint8Array => b !== null)

  const total =
    4 + // "ASEF"
    2 + // version major
    2 + // version minor
    4 + // block count
    bodies.reduce((sum, b) => sum + 2 + 4 + b.length, 0)

  const out = new Uint8Array(total)
  const view = new DataView(out.buffer)
  let o = 0

  for (const ch of 'ASEF') {
    out[o] = ch.charCodeAt(0)
    o += 1
  }
  view.setUint16(o, 1, false)
  o += 2
  view.setUint16(o, 0, false)
  o += 2
  view.setUint32(o, bodies.length, false)
  o += 4

  for (const body of bodies) {
    view.setUint16(o, 0x0001, false) // colour entry
    o += 2
    view.setUint32(o, body.length, false)
    o += 4
    out.set(body, o)
    o += body.length
  }

  return out
}
