/**
 * <QrCode> — a real, scannable QR code, with no dependency.
 *
 * Every other catalog's QR component wraps `qrcode.react` or `qrcode`, and
 * the honest version of their card would say "installs a package". This one
 * encodes the symbol itself: bit stream, Reed-Solomon error correction over
 * GF(256), block interleaving, all eight data masks scored by the standard
 * penalty rules, and BCH-coded format and version information.
 *
 * That is about 200 lines, which is a lot for a primitive, and it is the
 * whole point of the primitive. A QR component that cannot produce a
 * scannable symbol is a picture of a QR code, and this tier's claim is that
 * what you paste has no dependencies and no runtime you did not read.
 *
 * SCOPE, stated rather than discovered:
 *   - byte mode only (UTF-8), which covers URLs, vCards and plain text
 *   - error correction level M (~15% recoverable), the usual default
 *   - versions 1 to 10, so up to 213 bytes — a long URL with room to spare
 * A longer string throws rather than silently truncating, because a QR code
 * that encodes half a URL scans perfectly and goes to the wrong place.
 *
 * Rendered as one `<path>` of SVG rectangles rather than a grid of
 * elements: a version-10 symbol is 57×57, and 3,249 `<rect>` nodes is a
 * real layout cost for something that is one shape.
 *
 * It does not theme. See the note on `color` — a dark-mode QR code with
 * light modules is out of spec, and the phones it still works on are the
 * ones that try inverting.
 */

import * as React from 'react'

/* ------------------------------------------------------------------ *
 *  GF(256) — the field Reed-Solomon works in
 * ------------------------------------------------------------------ */

const EXP = new Uint8Array(512)
const LOG = new Uint8Array(256)

{
  let x = 1
  for (let i = 0; i < 255; i++) {
    EXP[i] = x
    LOG[x] = i
    // The QR standard's primitive polynomial, x^8 + x^4 + x^3 + x^2 + 1.
    x <<= 1
    if (x & 0x100) x ^= 0x11d
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]
}

function mul(a: number, b: number): number {
  return a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]
}

/** The generator polynomial for `degree` error-correction codewords. */
function rsGenerator(degree: number): number[] {
  let poly = [1]
  for (let i = 0; i < degree; i++) {
    const next = new Array<number>(poly.length + 1).fill(0)
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j]
      next[j + 1] ^= mul(poly[j], EXP[i])
    }
    poly = next
  }
  return poly
}

/** The `ecLen` error-correction codewords for one block of data. */
export function rsEncode(data: number[], ecLen: number): number[] {
  const gen = rsGenerator(ecLen)
  const res = new Array<number>(ecLen).fill(0)
  for (const byte of data) {
    const factor = byte ^ res[0]
    res.shift()
    res.push(0)
    for (let i = 0; i < ecLen; i++) res[i] ^= mul(gen[i + 1], factor)
  }
  return res
}

/* ------------------------------------------------------------------ *
 *  The version tables, for error-correction level M
 * ------------------------------------------------------------------ */

interface VersionSpec {
  /** Byte-mode capacity in characters. */
  capacity: number
  /** Error-correction codewords per block. */
  ecPerBlock: number
  /** [blockCount, dataCodewordsPerBlock] for each group. */
  groups: [number, number][]
  /** Centres of the alignment patterns, as coordinates on both axes. */
  alignment: number[]
  /** Bits of padding after the interleaved stream. */
  remainderBits: number
}

const VERSIONS: Record<number, VersionSpec> = {
  1: { capacity: 14, ecPerBlock: 10, groups: [[1, 16]], alignment: [], remainderBits: 0 },
  2: { capacity: 26, ecPerBlock: 16, groups: [[1, 28]], alignment: [6, 18], remainderBits: 7 },
  3: { capacity: 42, ecPerBlock: 26, groups: [[1, 44]], alignment: [6, 22], remainderBits: 7 },
  4: { capacity: 62, ecPerBlock: 18, groups: [[2, 32]], alignment: [6, 26], remainderBits: 7 },
  5: { capacity: 84, ecPerBlock: 24, groups: [[2, 43]], alignment: [6, 30], remainderBits: 7 },
  6: { capacity: 106, ecPerBlock: 16, groups: [[4, 27]], alignment: [6, 34], remainderBits: 7 },
  7: { capacity: 122, ecPerBlock: 18, groups: [[4, 31]], alignment: [6, 22, 38], remainderBits: 0 },
  8: { capacity: 152, ecPerBlock: 22, groups: [[2, 38], [2, 39]], alignment: [6, 24, 42], remainderBits: 0 },
  9: { capacity: 180, ecPerBlock: 22, groups: [[3, 36], [2, 37]], alignment: [6, 26, 46], remainderBits: 0 },
  10: { capacity: 213, ecPerBlock: 26, groups: [[4, 43], [1, 44]], alignment: [6, 28, 50], remainderBits: 0 },
}

/* ------------------------------------------------------------------ *
 *  Encoding
 * ------------------------------------------------------------------ */

class BitBuffer {
  bits: number[] = []
  push(value: number, length: number) {
    for (let i = length - 1; i >= 0; i--) this.bits.push((value >>> i) & 1)
  }
  get length() {
    return this.bits.length
  }
  toBytes(): number[] {
    const out: number[] = []
    for (let i = 0; i < this.bits.length; i += 8) {
      let byte = 0
      for (let j = 0; j < 8; j++) byte = (byte << 1) | (this.bits[i + j] ?? 0)
      out.push(byte)
    }
    return out
  }
}

/** The interleaved data + error-correction codewords for a value. */
export function encodeToCodewords(value: string): { version: number; codewords: number[] } {
  const bytes = Array.from(new TextEncoder().encode(value))

  const version = Number(
    Object.keys(VERSIONS).find((v) => bytes.length <= VERSIONS[Number(v)].capacity),
  )
  if (!version) {
    throw new Error(
      `QrCode: ${bytes.length} bytes is more than version 10 holds at error-correction level M (213).`,
    )
  }

  const spec = VERSIONS[version]
  const totalData = spec.groups.reduce((sum, [count, size]) => sum + count * size, 0)

  const buffer = new BitBuffer()
  buffer.push(0b0100, 4) // byte mode
  // The character-count indicator is 8 bits below version 10 and 16 from
  // version 10 up. Getting this boundary wrong produces a symbol that
  // scans as garbage rather than failing.
  buffer.push(bytes.length, version < 10 ? 8 : 16)
  for (const byte of bytes) buffer.push(byte, 8)

  // Terminator: up to four zero bits, then pad to a byte boundary.
  const capacityBits = totalData * 8
  buffer.push(0, Math.min(4, capacityBits - buffer.length))
  while (buffer.length % 8 !== 0) buffer.push(0, 1)

  const data = buffer.toBytes()
  // The two standard pad codewords, alternating, until the block is full.
  const PADS = [0xec, 0x11]
  for (let i = 0; data.length < totalData; i++) data.push(PADS[i % 2])

  /* -- Split into blocks, compute EC, interleave -- */

  const dataBlocks: number[][] = []
  const ecBlocks: number[][] = []
  let offset = 0
  for (const [count, size] of spec.groups) {
    for (let i = 0; i < count; i++) {
      const block = data.slice(offset, offset + size)
      offset += size
      dataBlocks.push(block)
      ecBlocks.push(rsEncode(block, spec.ecPerBlock))
    }
  }

  /*
   * Interleaving is column-wise across blocks: the first codeword of every
   * block, then the second of every block, and so on. It is what makes a
   * scratch across the symbol damage a few codewords in every block rather
   * than destroying one block completely — which is more than its error
   * correction could repair.
   */
  const codewords: number[] = []
  const maxData = Math.max(...dataBlocks.map((b) => b.length))
  for (let i = 0; i < maxData; i++) {
    for (const block of dataBlocks) if (i < block.length) codewords.push(block[i])
  }
  for (let i = 0; i < spec.ecPerBlock; i++) {
    for (const block of ecBlocks) codewords.push(block[i])
  }

  return { version, codewords }
}

/* ------------------------------------------------------------------ *
 *  The matrix
 * ------------------------------------------------------------------ */

type Grid = (0 | 1 | null)[][]

const MASKS: ((r: number, c: number) => boolean)[] = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (_, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
]

/** BCH(15,5) format information, XOR-masked as the standard requires. */
function formatBits(mask: number): number {
  // 0b00 is error-correction level M.
  let value = (0b00 << 3) | mask
  let rem = value
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537)
  value = ((value << 10) | rem) ^ 0x5412
  return value
}

/** BCH(18,6) version information. Only present from version 7. */
function versionBits(version: number): number {
  let rem = version
  for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25)
  return (version << 12) | rem
}

/** The finished module grid for a value: `true` is a dark module. */
export function buildMatrix(value: string): boolean[][] {
  const { version, codewords } = encodeToCodewords(value)
  const spec = VERSIONS[version]
  const size = version * 4 + 17

  const grid: Grid = Array.from({ length: size }, () => new Array(size).fill(null))
  const reserved: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false))

  const set = (r: number, c: number, dark: boolean) => {
    grid[r][c] = dark ? 1 : 0
    reserved[r][c] = true
  }

  /* -- Finder patterns and their separators -- */
  const finder = (top: number, left: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = top + r
        const cc = left + c
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue
        const inRing = r >= 0 && r <= 6 && c >= 0 && c <= 6
        const isDark =
          inRing &&
          ((r === 0 || r === 6 || c === 0 || c === 6) ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4))
        set(rr, cc, isDark)
      }
    }
  }
  finder(0, 0)
  finder(0, size - 7)
  finder(size - 7, 0)

  /* -- Timing patterns -- */
  for (let i = 8; i < size - 8; i++) {
    set(6, i, i % 2 === 0)
    set(i, 6, i % 2 === 0)
  }

  /* -- Alignment patterns, skipping the three that collide with finders -- */
  for (const r of spec.alignment) {
    for (const c of spec.alignment) {
      const nearFinder =
        (r <= 8 && c <= 8) || (r <= 8 && c >= size - 9) || (r >= size - 9 && c <= 8)
      if (nearFinder) continue
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          set(r + dr, c + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1)
        }
      }
    }
  }

  /* -- Reserve the format and version areas before laying data -- */
  for (let i = 0; i < 9; i++) {
    if (grid[8][i] === null) reserved[8][i] = true
    if (grid[i][8] === null) reserved[i][8] = true
  }
  for (let i = 0; i < 8; i++) {
    reserved[8][size - 1 - i] = true
    reserved[size - 1 - i][8] = true
  }
  // The always-dark module, which is part of the format area.
  set(size - 8, 8, true)

  if (version >= 7) {
    for (let i = 0; i < 18; i++) {
      const r = Math.floor(i / 3)
      const c = i % 3
      reserved[size - 11 + c][r] = true
      reserved[r][size - 11 + c] = true
    }
  }

  /* -- Data, in the standard two-column zigzag from the bottom right -- */
  const bits: number[] = []
  for (const codeword of codewords) {
    for (let i = 7; i >= 0; i--) bits.push((codeword >>> i) & 1)
  }
  for (let i = 0; i < spec.remainderBits; i++) bits.push(0)

  let bitIndex = 0
  let upward = true
  for (let col = size - 1; col > 0; col -= 2) {
    // Column 6 is the vertical timing pattern; the data columns step over
    // it rather than through it.
    if (col === 6) col--
    for (let i = 0; i < size; i++) {
      const row = upward ? size - 1 - i : i
      for (const c of [col, col - 1]) {
        if (reserved[row][c]) continue
        grid[row][c] = ((bits[bitIndex] ?? 0) as 0 | 1) || 0
        bitIndex++
      }
    }
    upward = !upward
  }

  /* -- Try all eight masks, keep the least penalised -- */
  let best: boolean[][] | null = null
  let bestScore = Infinity
  let bestMask = 0

  for (let mask = 0; mask < 8; mask++) {
    const candidate = grid.map((row, r) =>
      row.map((cell, c) => {
        const dark = cell === 1
        // Function modules are never masked.
        return reserved[r][c] ? dark : dark !== MASKS[mask](r, c)
      }),
    )
    applyFormat(candidate, reserved, mask, version, size)
    const score = penalty(candidate)
    if (score < bestScore) {
      bestScore = score
      best = candidate
      bestMask = mask
    }
  }
  void bestMask

  return best!
}

/** Write the format (and, from version 7, version) information. */
function applyFormat(
  grid: boolean[][],
  reserved: boolean[][],
  mask: number,
  version: number,
  size: number,
) {
  void reserved
  const format = formatBits(mask)
  for (let i = 0; i < 15; i++) {
    const bit = ((format >>> i) & 1) === 1

    // Copy one: around the top-left finder, stepping over the timing row
    // and column.
    if (i < 6) grid[i][8] = bit
    else if (i < 8) grid[i + 1][8] = bit
    else if (i === 8) grid[8][7] = bit
    else grid[8][14 - i] = bit

    // Copy two: split between the other two finders, so a symbol with one
    // corner destroyed is still readable.
    if (i < 8) grid[8][size - 1 - i] = bit
    else grid[size - 15 + i][8] = bit
  }

  if (version >= 7) {
    const bits = versionBits(version)
    for (let i = 0; i < 18; i++) {
      const bit = ((bits >>> i) & 1) === 1
      const r = Math.floor(i / 3)
      const c = i % 3
      grid[size - 11 + c][r] = bit
      grid[r][size - 11 + c] = bit
    }
  }
}

/**
 * The standard's four penalty rules.
 *
 * The mask is chosen to minimise this, and the rules exist because some
 * patterns are hard for a scanner: long runs confuse the edge detector,
 * 2×2 blocks look like alignment marks, the 1:1:3:1:1 sequence is the
 * finder pattern itself, and a symbol that is mostly one colour has no
 * contrast to threshold against.
 */
function penalty(grid: boolean[][]): number {
  const size = grid.length
  let score = 0

  // Rule 1 — runs of five or more.
  for (let i = 0; i < size; i++) {
    for (const line of [grid[i], grid.map((row) => row[i])]) {
      let run = 1
      for (let j = 1; j < size; j++) {
        if (line[j] === line[j - 1]) {
          run++
        } else {
          if (run >= 5) score += 3 + (run - 5)
          run = 1
        }
      }
      if (run >= 5) score += 3 + (run - 5)
    }
  }

  // Rule 2 — 2x2 blocks of one colour.
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const v = grid[r][c]
      if (v === grid[r][c + 1] && v === grid[r + 1][c] && v === grid[r + 1][c + 1]) score += 3
    }
  }

  // Rule 3 — the finder-like sequence, in either orientation.
  const PATTERN = [true, false, true, true, true, false, true]
  const matches = (line: boolean[], at: number) => {
    for (let k = 0; k < 7; k++) if (line[at + k] !== PATTERN[k]) return false
    const before = line.slice(Math.max(0, at - 4), at)
    const after = line.slice(at + 7, at + 11)
    const quiet = (part: boolean[]) => part.length === 4 && part.every((v) => !v)
    return quiet(before) || quiet(after)
  }
  for (let i = 0; i < size; i++) {
    const row = grid[i]
    const col = grid.map((r) => r[i])
    for (let j = 0; j + 7 <= size; j++) {
      if (matches(row, j)) score += 40
      if (matches(col, j)) score += 40
    }
  }

  // Rule 4 — how far the dark proportion is from half.
  const dark = grid.flat().filter(Boolean).length
  const percent = (dark * 100) / (size * size)
  score += Math.floor(Math.abs(percent - 50) / 5) * 10

  return score
}

/* ------------------------------------------------------------------ *
 *  The component
 * ------------------------------------------------------------------ */

export interface QrCodeProps {
  /** What the code encodes — a URL, a vCard, plain text. */
  value: string
  /** Rendered size in pixels. The symbol scales; the modules stay crisp. */
  size?: number
  /** Quiet zone in modules. Four is the standard minimum; below it, scanners fail. */
  quietZone?: number
  /**
   * Module and background colours.
   *
   * They default to black on white and do NOT follow the theme, which is
   * deliberate. A QR symbol is a machine-readable target, not chrome: the
   * standard specifies dark modules on a light background, and an inverted
   * one is read by phone cameras that try both polarities and refused by
   * plenty of scanners that do not. A code that themes itself is a code
   * that stops working for some of the people pointing a device at it.
   *
   * Override them if you know the scanner — but keep the dark/light
   * relationship and keep the contrast high.
   */
  color?: string
  background?: string
  /** What the code is, for a screen reader. The value itself if omitted. */
  label?: string
  className?: string
}

export function QrCode({
  value,
  size = 160,
  quietZone = 4,
  color = '#000000',
  background = '#ffffff',
  label,
  className = '',
}: QrCodeProps) {
  const matrix = React.useMemo(() => buildMatrix(value), [value])
  const modules = matrix.length
  const total = modules + quietZone * 2

  /*
   * One path for the whole symbol. A version-10 code is 57x57 — 3,249
   * elements if each module is its own <rect>, which is a real cost for
   * something that is one shape and never animates.
   */
  const path = React.useMemo(() => {
    const parts: string[] = []
    for (let r = 0; r < modules; r++) {
      for (let c = 0; c < modules; c++) {
        if (matrix[r][c]) parts.push(`M${c + quietZone} ${r + quietZone}h1v1h-1z`)
      }
    }
    return parts.join('')
  }, [matrix, modules, quietZone])

  return (
    <svg
      viewBox={`0 0 ${total} ${total}`}
      width={size}
      height={size}
      role="img"
      aria-label={label ?? `QR code for ${value}`}
      // `crispEdges` so module boundaries land on pixels at any size.
      shapeRendering="crispEdges"
      className={className}
    >
      <rect width={total} height={total} fill={background} />
      <path d={path} fill={color} />
    </svg>
  )
}
