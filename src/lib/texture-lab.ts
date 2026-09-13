/**
 * Texture Lab — an image in, a texture out.
 *
 * ── WHY THESE FOUR, AND WHY THEY BELONG TOGETHER ────────────────────────
 *
 * Dither, halftone and ASCII are the same operation wearing three hats:
 * throw away almost all the tonal information, and buy it back with
 * structure. That is why they sit in one file and share one luminance pass
 * — the expensive part is reading the pixels, and doing it once means the
 * preview can switch between them without re-decoding anything.
 *
 * Grain is the odd one out and is deliberately not here: the existing
 * generator makes it from `feTurbulence` with no image at all, and merging
 * the two would mean an image-less mode pretending to have an input.
 *
 * ── EVERY FUNCTION HERE IS PURE, AND THAT IS THE POINT ──────────────────
 *
 * Not one of them touches a canvas, a DOM node or a File. They take a
 * luminance plane and return an array or a string. It is what makes the
 * whole pipeline testable in Node — dithering is the kind of code that is
 * subtly wrong for months, because the output always looks plausibly like
 * dithering — and it is what lets the halftone render to a canvas for the
 * preview and to an SVG for the export from one set of numbers.
 *
 * ── NOTHING HERE LEAVES THE BROWSER ─────────────────────────────────────
 *
 * There is no upload, no endpoint and no key. The image is decoded in the
 * page, processed by this file, and re-encoded by the canvas. Worth stating
 * in the UI as well as here: "drop your image in" is a sentence people are
 * right to be suspicious of, and the honest answer is a feature.
 */

/** A luminance plane — one 0–1 value per pixel, row-major. */
export interface Plane {
  width: number
  height: number
  /** Length is exactly `width * height`. */
  values: Float32Array
}

/** Rec. 709 luma weights — the ones that match how bright things look. */
const R_WEIGHT = 0.2126
const G_WEIGHT = 0.7152
const B_WEIGHT = 0.0722

/**
 * RGBA bytes → a luminance plane.
 *
 * Alpha is composited against white rather than ignored. A PNG with a
 * transparent background otherwise reads as black — its RGB bytes are
 * usually zero where it is clear — and the texture comes out as a solid
 * slab with the subject punched out of it, which looks like a broken
 * decode rather than like a choice.
 */
export function toPlane(data: Uint8ClampedArray, width: number, height: number): Plane {
  const values = new Float32Array(width * height)
  for (let i = 0, p = 0; p < values.length; i += 4, p++) {
    const alpha = data[i + 3] / 255
    const r = data[i] * alpha + 255 * (1 - alpha)
    const g = data[i + 1] * alpha + 255 * (1 - alpha)
    const b = data[i + 2] * alpha + 255 * (1 - alpha)
    values[p] = (R_WEIGHT * r + G_WEIGHT * g + B_WEIGHT * b) / 255
  }
  return { width, height, values }
}

/** Brightness and contrast, applied before any of the four processes. */
export function adjust(plane: Plane, brightness: number, contrast: number): Plane {
  // Both arrive as -100..100 and mean "none" at 0.
  const b = brightness / 100
  const c = 1 + contrast / 100
  const values = new Float32Array(plane.values.length)
  for (let i = 0; i < values.length; i++) {
    // Contrast pivots on mid-grey, so raising it darkens shadows and lifts
    // highlights instead of just brightening everything.
    values[i] = Math.min(1, Math.max(0, (plane.values[i] - 0.5) * c + 0.5 + b))
  }
  return { width: plane.width, height: plane.height, values }
}

export type DitherMethod = 'floyd-steinberg' | 'atkinson' | 'ordered' | 'threshold'

/**
 * The 8×8 Bayer matrix, as thresholds in 0–1.
 *
 * Generated rather than typed out: the recurrence is three lines and a
 * hand-typed 64-entry matrix is a transcription error waiting to happen —
 * one wrong cell shows up as a single bright pixel in a repeating grid,
 * which is exactly the kind of thing that survives review.
 */
export function bayerMatrix(order: number): number[][] {
  let matrix = [[0]]
  for (let size = 1; size < order; size *= 2) {
    const next: number[][] = []
    for (let y = 0; y < size * 2; y++) next.push(new Array(size * 2).fill(0))
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const v = matrix[y][x] * 4
        next[y][x] = v
        next[y][x + size] = v + 2
        next[y + size][x] = v + 3
        next[y + size][x + size] = v + 1
      }
    }
    matrix = next
  }
  const n = matrix.length * matrix.length
  return matrix.map((row) => row.map((v) => (v + 0.5) / n))
}

/**
 * Quantise a plane to `levels` tones, diffusing or ordering the error.
 *
 * Returns levels as integers 0..levels-1 rather than as greys, so the
 * caller decides what the tones look like — two-tone ink on paper for the
 * texture, or a grey ramp for a preview — without this having to know.
 *
 * `threshold` is included deliberately even though it is not dithering: it
 * is the control case. Seeing hard banding next to the same image
 * error-diffused is what makes it obvious what dithering bought, and it is
 * genuinely the right choice for high-contrast line art.
 */
export function dither(plane: Plane, method: DitherMethod, levels = 2): Uint8Array {
  const { width, height } = plane
  const steps = Math.max(2, Math.round(levels))
  const out = new Uint8Array(width * height)

  // Error diffusion mutates as it walks, so it works on a copy — otherwise
  // switching methods in the UI would degrade the source a little more on
  // every toggle, and the image would slowly fall apart for no reason
  // anyone could see.
  const values = Float32Array.from(plane.values)

  const quantise = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * (steps - 1))

  if (method === 'threshold') {
    for (let i = 0; i < values.length; i++) out[i] = quantise(values[i])
    return out
  }

  if (method === 'ordered') {
    const matrix = bayerMatrix(8)
    const size = matrix.length
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x
        // The matrix biases the value before quantising, which is what
        // turns a flat band into a stable crosshatch.
        const bias = (matrix[y % size][x % size] - 0.5) / (steps - 1)
        out[i] = quantise(values[i] + bias)
      }
    }
    return out
  }

  /*
    Error diffusion. Floyd-Steinberg spreads the whole error over four
    neighbours; Atkinson spreads only 6/8 of it over six, which throws some
    away and is why it looks lighter and cleaner — it is the classic
    early-Macintosh look, and it is the better of the two on photographs
    with large flat areas.
  */
  const kernel: [number, number, number][] =
    method === 'atkinson'
      ? [
          [1, 0, 1 / 8],
          [2, 0, 1 / 8],
          [-1, 1, 1 / 8],
          [0, 1, 1 / 8],
          [1, 1, 1 / 8],
          [0, 2, 1 / 8],
        ]
      : [
          [1, 0, 7 / 16],
          [-1, 1, 3 / 16],
          [0, 1, 5 / 16],
          [1, 1, 1 / 16],
        ]

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      const old = values[i]
      const level = quantise(old)
      out[i] = level
      const error = old - level / (steps - 1)

      for (const [dx, dy, weight] of kernel) {
        const nx = x + dx
        const ny = y + dy
        if (nx < 0 || nx >= width || ny >= height) continue
        values[ny * width + nx] += error * weight
      }
    }
  }

  return out
}

export interface Dot {
  x: number
  y: number
  /** Radius, already scaled so the darkest cell fills its cell. */
  r: number
}

export interface HalftoneOptions {
  /** Cell size in source pixels. Bigger cells, bigger dots, fewer of them. */
  cell: number
  /** Screen angle in degrees. 45 is the traditional one for a single ink. */
  angle: number
  /** Treat bright as ink instead of dark, for a negative screen. */
  invert?: boolean
}

/**
 * Sample the plane on a rotated grid and return one dot per cell.
 *
 * ── WHY THE GRID ROTATES RATHER THAN THE IMAGE ──────────────────────────
 *
 * A halftone screen at 0° puts its dots in horizontal rows, and horizontal
 * rows beat against every horizontal edge in the picture — the moiré that
 * makes an un-angled screen look like a printing fault. 45° is the angle
 * print uses for a single ink because it is the one furthest from both
 * axes. Rotating the sampling grid gets that for free; rotating the image
 * would resample it twice and soften everything first.
 *
 * The grid is generated over the diagonal so that a rotated lattice still
 * covers the corners — at 45° a grid sized to the image leaves two
 * triangles of it bare, which reads as a crop nobody asked for.
 */
export function halftoneDots(plane: Plane, options: HalftoneOptions): Dot[] {
  const { width, height, values } = plane
  const cell = Math.max(2, options.cell)
  const radians = (options.angle * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)

  const reach = Math.ceil(Math.hypot(width, height) / cell) + 1
  const cx = width / 2
  const cy = height / 2

  const dots: Dot[] = []
  const maxRadius = (cell / 2) * Math.SQRT2

  for (let j = -reach; j <= reach; j++) {
    for (let i = -reach; i <= reach; i++) {
      // Lattice point in screen space, rotated back into image space.
      const u = i * cell
      const v = j * cell
      const x = cx + u * cos - v * sin
      const y = cy + u * sin + v * cos
      if (x < 0 || x >= width || y < 0 || y >= height) continue

      const sample = values[Math.floor(y) * width + Math.floor(x)]
      const ink = options.invert ? sample : 1 - sample
      // Area, not radius, is proportional to ink coverage — a dot of twice
      // the radius is four times the ink, and scaling the radius linearly
      // makes every midtone far too dark.
      const r = maxRadius * Math.sqrt(Math.min(1, Math.max(0, ink)))
      if (r < 0.15) continue
      dots.push({ x, y, r })
    }
  }

  return dots
}

/** The dots as a standalone SVG — a halftone that stays sharp at any size. */
export function halftoneSvg(
  dots: Dot[],
  width: number,
  height: number,
  ink = '#000000',
  paper = 'none',
): string {
  const circles = dots
    .map((d) => `<circle cx="${d.x.toFixed(1)}" cy="${d.y.toFixed(1)}" r="${d.r.toFixed(2)}"/>`)
    .join('')
  const background =
    paper === 'none' ? '' : `<rect width="100%" height="100%" fill="${paper}"/>`
  return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${background}<g fill="${ink}">${circles}</g></svg>`
}

/**
 * Character ramps, darkest-last.
 *
 * Ordered by how much ink each glyph puts on the page rather than by any
 * character code, which is the whole trick — get one character out of order
 * and the image develops a band of noise at exactly that tone.
 */
export const ASCII_RAMPS: Record<string, string> = {
  standard: " .:-=+*#%@",
  blocks: " ░▒▓█",
  minimal: " .:*#",
  long: " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
}

export interface AsciiOptions {
  /** Output width in characters. Height follows from the aspect ratio. */
  columns: number
  /** One of `ASCII_RAMPS`, or any string ordered light → dark. */
  ramp: string
  /** Swap light and dark, for pale text on a dark ground. */
  invert?: boolean
}

/**
 * The plane as text.
 *
 * ── THE 0.5 ────────────────────────────────────────────────────────────
 *
 * A monospace cell is about twice as tall as it is wide, so sampling on a
 * square grid returns an image stretched to twice its height. Halving the
 * row count is the correction, and its absence is the single most common
 * bug in ASCII-art code — it looks wrong in a way people blame on the
 * font.
 *
 * Each cell averages the source pixels under it rather than point-sampling
 * one. At these reduction ratios a point sample is essentially picking a
 * random pixel per character, which is why naive versions look noisy
 * rather than soft.
 */
export function asciiArt(plane: Plane, options: AsciiOptions): string {
  const ramp = options.ramp.length > 1 ? options.ramp : ASCII_RAMPS.standard
  const columns = Math.max(8, Math.round(options.columns))
  const { width, height, values } = plane

  const cellWidth = width / columns
  const cellHeight = cellWidth * 2
  const rows = Math.max(1, Math.floor(height / cellHeight))

  const lines: string[] = []
  for (let row = 0; row < rows; row++) {
    let line = ''
    for (let col = 0; col < columns; col++) {
      const x0 = Math.floor(col * cellWidth)
      const x1 = Math.min(width, Math.ceil((col + 1) * cellWidth))
      const y0 = Math.floor(row * cellHeight)
      const y1 = Math.min(height, Math.ceil((row + 1) * cellHeight))

      let sum = 0
      let count = 0
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          sum += values[y * width + x]
          count++
        }
      }
      const mean = count === 0 ? 1 : sum / count
      const tone = options.invert ? mean : 1 - mean
      const index = Math.min(ramp.length - 1, Math.max(0, Math.round(tone * (ramp.length - 1))))
      line += ramp[index]
    }
    lines.push(line)
  }

  return lines.join('\n')
}

/**
 * A quantised plane back into RGBA bytes, in two colours.
 *
 * Intermediate levels are interpolated between paper and ink, so a 4-level
 * dither renders as four real tones rather than as black and white with
 * two of the levels invisible.
 */
export function toRgba(
  levels: Uint8Array,
  width: number,
  height: number,
  steps: number,
  ink: [number, number, number],
  paper: [number, number, number],
  /*
    The buffer type is spelled out because `ImageData` will not take a
    `Uint8ClampedArray<ArrayBufferLike>` — it has to know the buffer is not
    shared. Left to inference the return widens to `ArrayBufferLike` and the
    one caller that matters, the canvas, rejects it.
  */
): Uint8ClampedArray<ArrayBuffer> {
  const out = new Uint8ClampedArray(width * height * 4)
  const span = Math.max(1, steps - 1)
  for (let p = 0, i = 0; p < levels.length; p++, i += 4) {
    const t = levels[p] / span
    out[i] = paper[0] + (ink[0] - paper[0]) * (1 - t)
    out[i + 1] = paper[1] + (ink[1] - paper[1]) * (1 - t)
    out[i + 2] = paper[2] + (ink[2] - paper[2]) * (1 - t)
    out[i + 3] = 255
  }
  return out
}

/** `#rrggbb` → bytes. Falls back to black rather than throwing on junk. */
export function hexToRgb(hex: string): [number, number, number] {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!match) return [0, 0, 0]
  const n = parseInt(match[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
