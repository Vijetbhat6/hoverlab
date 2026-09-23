/**
 * Turning whatever the visitor pasted, dropped or picked into something the
 * search route will accept — in the browser.
 *
 * A retina screenshot is routinely 2-6 MB as PNG, and the route's ceiling is
 * 1.5 MB decoded. Telling someone their screenshot is "too large" when the
 * cause is their display's pixel density would make the feature fail for
 * exactly the people most likely to use it, so this scales the picture down
 * (the longest side to 1280px, more than a model needs to read a UI) and
 * re-encodes it as JPEG, stepping the quality down until it fits. A screenshot
 * of an interface loses nothing a ranking model can use; a photo of one would
 * lose more, and would still fit.
 *
 * Re-encoding also means the server only ever sees a JPEG this canvas
 * produced, however odd the original — it does not make the server's own
 * magic-number check redundant, which is written to distrust the client
 * entirely, but it means an honest client never trips it.
 *
 * Browser-only (canvas, FileReader). Everything decision-shaped that can be
 * tested without a DOM is in `@/lib/ai/search-image`.
 */

import { MAX_IMAGE_BYTES, validateImage } from '@/lib/ai/search-image'

/** What the file picker offers. SVG is left out on purpose: it is a document. */
export const ACCEPTED_IMAGE_TYPES = 'image/png,image/jpeg,image/webp'

/** Refuse to even decode anything past this — a 200 MB file is not a screenshot. */
const MAX_INPUT_BYTES = 20_000_000
const MAX_SIDE = 1280
const QUALITIES = [0.85, 0.72, 0.6, 0.48]

export type PrepareResult =
  | { ok: true; dataUrl: string }
  | { ok: false; message: string }

export function isImageFile(file: Blob): boolean {
  return /^image\/(png|jpe?g|webp|gif|bmp|avif)$/i.test(file.type)
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
}

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the image'))
    reader.readAsDataURL(blob)
  })
}

export async function prepareScreenshot(file: Blob): Promise<PrepareResult> {
  if (!isImageFile(file)) {
    return { ok: false, message: 'Use a PNG, JPEG or WebP screenshot.' }
  }
  if (file.size > MAX_INPUT_BYTES) {
    return { ok: false, message: 'That image is too large to use — try a smaller screenshot.' }
  }

  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const ctx = canvas.getContext('2d')
    if (!ctx) return { ok: false, message: 'This browser cannot process images.' }
    // JPEG has no alpha; a transparent PNG would otherwise flatten to black.
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close?.()

    for (const quality of QUALITIES) {
      const blob = await toBlob(canvas, quality)
      if (!blob) continue
      if (blob.size <= MAX_IMAGE_BYTES * 0.95) {
        const dataUrl = await readAsDataUrl(blob)
        const checked = validateImage(dataUrl)
        return checked.ok ? { ok: true, dataUrl } : { ok: false, message: checked.message }
      }
    }
    return { ok: false, message: 'That screenshot is too detailed to send — try a smaller crop.' }
  } catch {
    return { ok: false, message: 'Could not read that image.' }
  }
}
