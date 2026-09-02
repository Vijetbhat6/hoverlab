/**
 * Saving a tool's output to a file.
 *
 * Four tools had written this themselves — the favicon generator, the code
 * screenshotter, the SVG toolkit and, half of it, the palette tool — and
 * only one of them had the revoke timing right. That one comment is the
 * reason this module exists: the bug it describes reproduces on a slow
 * machine and never on the machine the code was written on, so it is not
 * the kind of thing four independent copies converge on by testing.
 *
 * Everything here is client-only and DOM-dependent. There is no server
 * fallback and no `typeof window` guard — a caller that reaches this from
 * the server has a bug that a silent no-op would hide.
 */

/**
 * Hand a blob to the browser as a download.
 *
 * The anchor is never inserted into the document. It does not need to be —
 * `click()` works on a detached element in every browser this app supports
 * — and appending it means a stray node if anything between here and the
 * removal throws.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  /*
    Revoked on a timer, not immediately.

    `click()` on an object URL starts the download asynchronously, and
    revoking in the same statement occasionally cancels it before the
    browser has finished reading the blob. The failure is timing-dependent:
    it shows up on a slow machine, on a large file, and never in
    development. One second is far longer than the read needs and costs
    nothing but a held reference.
  */
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Save a string as a file, with the MIME type the extension implies. */
export function downloadText(text: string, filename: string, type: string): void {
  downloadBlob(new Blob([text], { type: `${type};charset=utf-8` }), filename)
}

/**
 * Render an SVG string to a PNG at a chosen pixel size.
 *
 * Goes through an `Image` and a canvas rather than any library, and the
 * data URI matters: loading the SVG from an object URL taints the canvas in
 * some browsers, and a tainted canvas throws on `toBlob`. Encoding it
 * inline keeps the whole thing same-origin.
 *
 * Resolves null rather than throwing if the SVG will not parse, so a caller
 * can report it in the UI without a try/catch around every use.
 */
export async function svgToPngBlob(
  svg: string,
  width: number,
  height: number,
): Promise<Blob | null> {
  const encoded = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`

  const image = await new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = encoded
  })
  if (!image) return null

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(image, 0, 0, width, height)

  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
}

/**
 * A pane of CSS rendered to PNG, at a given size.
 *
 * The trick is `<foreignObject>`: a canvas cannot paint a CSS gradient
 * directly, but it can paint an SVG, and an SVG can carry an HTML div
 * carrying whatever declarations the tool just produced. That means the
 * exported file comes from the exact CSS the copy button emits, rather than
 * from a second implementation of the gradient that would drift from it.
 *
 * `declarations` is a CSS declaration LIST — `background-color:#111;
 * background-image:radial-gradient(…)` — not a single `background`
 * shorthand value. That distinction cost a silent bug worth recording: the
 * `background` shorthand only accepts a colour in its FINAL layer, so
 * `background: #0b1120 radial-gradient(…), radial-gradient(…)` is invalid
 * and the browser drops the whole declaration. The export came out a flat
 * rectangle while the preview beside it looked perfect, because the preview
 * sets `backgroundColor` and `backgroundImage` as separate properties and
 * was never subject to the shorthand's rule.
 *
 * Escaped for XML — an unescaped `&` in a gradient (rare, but legal inside
 * a url()) makes the whole document fail to parse, and that failure looks
 * like a broken export rather than like malformed markup.
 */
export async function cssPaneToPngBlob(
  declarations: string,
  width: number,
  height: number,
): Promise<Blob | null> {
  const escaped = declarations
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;${escaped}"></div>
  </foreignObject>
</svg>`

  return svgToPngBlob(svg, width, height)
}

/** A filename-safe slug, so a tool can name a file after what is in it. */
export function fileSlug(input: string, fallback = 'hoverlab'): string {
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
  return slug || fallback
}
