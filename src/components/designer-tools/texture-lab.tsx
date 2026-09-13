'use client'

/**
 * Texture Lab — drop an image in, take a texture out.
 *
 * ── WHY THE IMAGE IS NOT IN THE TOOL STATE ──────────────────────────────
 *
 * Every other designer tool persists its whole state to localStorage and
 * can put it in a shareable `#s=` link. A decoded photograph is megabytes;
 * it would blow the 4,000-character share budget on the first image and
 * fill the origin's storage quota on the second.
 *
 * So the split is deliberate and is stated in the UI rather than left to be
 * discovered: the *settings* persist and travel, the picture does not. A
 * shared link opens Texture Lab tuned exactly as the sender had it, waiting
 * for the recipient's own image. That is a more useful thing to send than a
 * copy of a photo, and it is the only version of this that can exist.
 *
 * ── NOTHING IS UPLOADED ─────────────────────────────────────────────────
 *
 * The file is read by the browser, decoded to a canvas, processed by
 * `lib/texture-lab.ts` and re-encoded by the same canvas. There is no
 * request, no endpoint and no account. "Drop your image in" is a sentence
 * people are right to be suspicious of, so the page says so plainly.
 *
 * ── WHY EVERYTHING IS RESAMPLED TO A WORKING SIZE ───────────────────────
 *
 * Error diffusion is inherently serial — each pixel's error feeds its
 * neighbours, so it cannot be vectorised or split — and a 24-megapixel
 * phone photo is several seconds of blocked main thread per slider frame.
 * `WORKING_MAX` caps the long edge, which puts a redraw in single-digit
 * milliseconds and keeps the controls live under the hand.
 *
 * It also happens to be the right artistic answer. A dither at full camera
 * resolution has a dot pitch finer than the screen can show: it greys out
 * into a smooth photo and none of the structure that makes it a dither is
 * visible at all.
 */

import * as React from 'react'
import { ImageUp, RotateCcw, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SliderField, ToggleField } from '@/components/control-field'
import { CopyCssCard } from '@/components/designer-tools/copy-css-card'
import { DownloadBar, type DownloadAction } from '@/components/designer-tools/download-bar'
import { copyWithToast } from '@/components/designer-tools/tool-layout'
import { downloadBlob, downloadText } from '@/lib/download'
import {
  ASCII_RAMPS,
  adjust,
  asciiArt,
  dither,
  halftoneDots,
  halftoneSvg,
  hexToRgb,
  toPlane,
  toRgba,
  type DitherMethod,
  type Plane,
} from '@/lib/texture-lab'
import { cn } from '@/lib/utils'

/** Longest edge the image is resampled to before any processing. */
const WORKING_MAX = 1100

/** Refuse a file larger than this before decoding it. */
const MAX_FILE_BYTES = 20 * 1024 * 1024

export type TextureProcess = 'dither' | 'halftone' | 'ascii'

export interface TextureSettings {
  process: TextureProcess
  method: DitherMethod
  levels: number
  cell: number
  angle: number
  columns: number
  rampId: string
  brightness: number
  contrast: number
  invert: boolean
  ink: string
  paper: string
}

export const DEFAULT_TEXTURE: TextureSettings = {
  process: 'dither',
  method: 'floyd-steinberg',
  levels: 2,
  cell: 8,
  angle: 45,
  columns: 110,
  rampId: 'standard',
  brightness: 0,
  contrast: 15,
  invert: false,
  ink: '#0b1120',
  paper: '#ffffff',
}

/** The fields the share-link shape guard cannot check. See the tool page. */
export function sanitizeTexture(texture: TextureSettings): TextureSettings {
  const processes: TextureProcess[] = ['dither', 'halftone', 'ascii']
  const methods: DitherMethod[] = ['floyd-steinberg', 'atkinson', 'ordered', 'threshold']
  return {
    ...texture,
    process: processes.includes(texture.process) ? texture.process : DEFAULT_TEXTURE.process,
    method: methods.includes(texture.method) ? texture.method : DEFAULT_TEXTURE.method,
    rampId: texture.rampId in ASCII_RAMPS ? texture.rampId : DEFAULT_TEXTURE.rampId,
  }
}

const METHOD_LABEL: Record<DitherMethod, string> = {
  'floyd-steinberg': 'Floyd–Steinberg',
  atkinson: 'Atkinson',
  ordered: 'Ordered (Bayer)',
  threshold: 'Hard threshold',
}

interface LoadedImage {
  name: string
  width: number
  height: number
  plane: Plane
}

export interface TextureLabProps {
  settings: TextureSettings
  onChange: (patch: Partial<TextureSettings>) => void
}

export function TextureLab({ settings, onChange }: TextureLabProps) {
  const [image, setImage] = React.useState<LoadedImage | null>(null)
  const [dragging, setDragging] = React.useState(false)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  /* ── Loading ──────────────────────────────────────────────────────── */

  const load = React.useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('That is not an image file')
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      toast.error('That image is over 20MB — try a smaller one')
      return
    }

    /*
      createImageBitmap takes the File directly.

      It decodes off the main thread and, crucially, it does not go through
      a URL at all: a 20MB data URI is 27MB of base64 that has to be built,
      assigned and parsed before anything can be drawn, and an object URL
      has to be revoked or it holds the whole file alive for the life of the
      document. This used to create and revoke one anyway — dead work that
      flatly contradicted the comment above it.
    */
    try {
      const bitmap = await createImageBitmap(file)
      const scale = Math.min(1, WORKING_MAX / Math.max(bitmap.width, bitmap.height))
      const width = Math.max(1, Math.round(bitmap.width * scale))
      const height = Math.max(1, Math.round(bitmap.height * scale))

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) throw new Error('no 2d context')
      ctx.drawImage(bitmap, 0, 0, width, height)
      bitmap.close()

      const { data } = ctx.getImageData(0, 0, width, height)
      setImage({ name: file.name, width, height, plane: toPlane(data, width, height) })
    } catch {
      toast.error('Could not read that image')
    }
  }, [])

  /* ── Processing ───────────────────────────────────────────────────── */

  // Brightness and contrast are their own memo so that changing the
  // process — the cheap switch people make most — does not redo the
  // per-pixel adjustment pass as well.
  const adjusted = React.useMemo(
    () => (image ? adjust(image.plane, settings.brightness, settings.contrast) : null),
    [image, settings.brightness, settings.contrast],
  )

  const dots = React.useMemo(
    () =>
      adjusted && settings.process === 'halftone'
        ? halftoneDots(adjusted, {
            cell: settings.cell,
            angle: settings.angle,
            invert: settings.invert,
          })
        : null,
    [adjusted, settings.process, settings.cell, settings.angle, settings.invert],
  )

  const ascii = React.useMemo(
    () =>
      adjusted && settings.process === 'ascii'
        ? asciiArt(adjusted, {
            columns: settings.columns,
            ramp: ASCII_RAMPS[settings.rampId] ?? ASCII_RAMPS.standard,
            invert: settings.invert,
          })
        : null,
    [adjusted, settings.process, settings.columns, settings.rampId, settings.invert],
  )

  /*
    The canvas is painted in an effect rather than derived.

    A canvas is not a value — React cannot render one from state — so the
    memoised planes above are the derivation and this is the single place
    that touches pixels. Both raster processes paint here so that the
    export path and the preview path cannot diverge.
  */
  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !adjusted || !image) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = image.width
    canvas.height = image.height
    const ink = hexToRgb(settings.ink)
    const paper = hexToRgb(settings.paper)

    if (settings.process === 'dither') {
      const levels = dither(adjusted, settings.method, settings.levels)
      const rgba = toRgba(
        levels,
        image.width,
        image.height,
        settings.levels,
        settings.invert ? paper : ink,
        settings.invert ? ink : paper,
      )
      ctx.putImageData(new ImageData(rgba, image.width, image.height), 0, 0)
      return
    }

    if (settings.process === 'halftone' && dots) {
      ctx.fillStyle = settings.paper
      ctx.fillRect(0, 0, image.width, image.height)
      ctx.fillStyle = settings.ink
      for (const dot of dots) {
        ctx.beginPath()
        ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }, [adjusted, dots, image, settings])

  /* ── Exports ──────────────────────────────────────────────────────── */

  const exports = React.useMemo<DownloadAction[]>(() => {
    if (!image) return []

    const png: DownloadAction = {
      label: 'PNG',
      title: `${image.width} x ${image.height}`,
      run: async () => {
        const canvas = canvasRef.current
        if (!canvas) return false
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, 'image/png'),
        )
        if (!blob) return false
        downloadBlob(blob, 'texture.png')
      },
    }

    if (settings.process === 'halftone' && dots) {
      return [
        png,
        {
          label: 'SVG',
          // The reason to reach for a halftone in the first place: a screen
          // made of real circles stays sharp at poster size, where the PNG
          // is already at its working resolution.
          title: 'Real circles — sharp at any size, unlike the PNG',
          run: () =>
            downloadText(
              halftoneSvg(dots, image.width, image.height, settings.ink, settings.paper),
              'halftone.svg',
              'image/svg+xml',
            ),
        },
      ]
    }

    if (settings.process === 'ascii' && ascii) {
      return [
        {
          label: 'Text',
          title: 'Plain text, in a monospace font',
          run: () => downloadText(ascii, 'texture.txt', 'text/plain'),
        },
      ]
    }

    return [png]
  }, [image, settings.process, settings.ink, settings.paper, dots, ascii])

  const reset = () => onChange({ ...DEFAULT_TEXTURE })

  /* ── Render ───────────────────────────────────────────────────────── */

  return (
    <div className="space-y-4">
      {/* Stage */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          const file = e.dataTransfer.files[0]
          if (file) void load(file)
        }}
        className={cn(
          'flex min-h-[400px] items-center justify-center rounded-xl border p-4 transition-colors',
          dragging ? 'border-primary bg-primary/5' : 'border-border',
        )}
      >
        {!image ? (
          <div className="max-w-sm text-center">
            <ImageUp aria-hidden className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">Drop an image here</p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              It is decoded and processed in this tab. Nothing is uploaded, there
              is no account, and the image never reaches a server.
            </p>
            <Button
              type="button"
              size="sm"
              className="mt-4"
              onClick={() => inputRef.current?.click()}
            >
              Choose an image
            </Button>
            {/*
              Named and taken out of the tab order.

              `sr-only` hides it visually but leaves it focusable and in
              the accessibility tree, so without a name it announced as
              an unlabelled file field — and it was a second tab stop
              doing exactly what the visible button beside it does.
            */}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              tabIndex={-1}
              aria-label="Choose an image to turn into a texture"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void load(file)
                // Cleared so re-picking the same file fires change again.
                e.target.value = ''
              }}
            />
          </div>
        ) : settings.process === 'ascii' ? (
          <pre
            tabIndex={0}
            role="region"
            aria-label="The image as ASCII"
            className="max-h-[520px] w-full overflow-auto whitespace-pre font-mono text-[5px] leading-[1.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:text-[7px]"
            style={{ color: settings.ink, background: settings.paper }}
          >
            {ascii}
          </pre>
        ) : (
          <canvas
            ref={canvasRef}
            className="max-h-[520px] max-w-full object-contain"
            /* The texture is decorative scaffolding around the controls and
               the export; the alt text that matters is the one the visitor
               writes wherever they use the file. */
            aria-label={`${settings.process} texture from ${image.name}`}
            role="img"
          />
        )}
      </div>

      {image ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {image.name} · {image.width}×{image.height}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => setImage(null)}
            >
              <X className="h-3 w-3" /> Remove
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={reset}
            >
              <RotateCcw className="h-3 w-3" /> Reset settings
            </Button>
          </div>

          {settings.process === 'ascii' && ascii ? (
            <CopyCssCard
              code={ascii.split('\n').slice(0, 12).join('\n')}
              title="ASCII (first 12 rows — the download has all of it)"
              language="text"
            />
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <DownloadBar actions={exports} />
            {settings.process === 'ascii' && ascii ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => void copyWithToast(ascii, 'ASCII copied')}
              >
                Copy all of it
              </Button>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  )
}

/**
 * The controls, exported separately so the page can put them in the
 * workbench's controls column while the stage above sits in the preview
 * one. Splitting a component in two to straddle a grid is not lovely, but
 * the alternative is a stage that scrolls away from its own sliders, which
 * is the exact failure `<ToolWorkbench>` exists to prevent.
 */
export function TextureLabControls({ settings, onChange }: TextureLabProps) {
  const set = onChange

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-5">
      <div>
        <Label className="mb-2 block text-sm font-medium">Process</Label>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ['dither', 'Dither'],
              ['halftone', 'Halftone'],
              ['ascii', 'ASCII'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => set({ process: id })}
              aria-pressed={settings.process === id}
              className={cn(
                'rounded-md border px-2 py-2 text-sm font-medium transition-colors',
                settings.process === id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:bg-muted',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {settings.process === 'dither' ? (
        <>
          <div>
            <Label className="mb-2 block text-sm font-medium">Method</Label>
            <Select
              value={settings.method}
              onValueChange={(v) => set({ method: v as DitherMethod })}
            >
              <SelectTrigger className="h-9" aria-label="Dithering method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(METHOD_LABEL) as DitherMethod[]).map((m) => (
                  <SelectItem key={m} value={m}>
                    {METHOD_LABEL[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-2 text-xs text-muted-foreground">
              Floyd–Steinberg spreads the whole error over four neighbours;
              Atkinson throws a quarter of it away, which is lighter and cleaner
              on photographs. Ordered gives a stable crosshatch that tiles.
              Hard threshold is the control case — no dithering at all.
            </p>
          </div>
          <SliderField
            label="Tones"
            description="How many levels the image is reduced to. Two is pure ink and paper; more keeps some modelling while still reading as a dither."
            value={settings.levels}
            min={2}
            max={8}
            step={1}
            display={String(settings.levels)}
            onChange={(v) => set({ levels: v })}
          />
        </>
      ) : null}

      {settings.process === 'halftone' ? (
        <>
          <SliderField
            label="Dot spacing"
            description="Distance between dot centres, in pixels of the working image. Larger cells give the coarse newsprint look."
            value={settings.cell}
            min={3}
            max={28}
            step={1}
            display={`${settings.cell}px`}
            onChange={(v) => set({ cell: v })}
          />
          <SliderField
            label="Screen angle"
            description="45° is what print uses for a single ink: it is the angle furthest from both axes, so the dot grid does not beat against horizontal and vertical edges."
            value={settings.angle}
            min={0}
            max={90}
            step={1}
            display={`${settings.angle}°`}
            onChange={(v) => set({ angle: v })}
          />
        </>
      ) : null}

      {settings.process === 'ascii' ? (
        <>
          <SliderField
            label="Columns"
            description="Characters across. Each one covers a cell twice as tall as it is wide, which is corrected for — so the picture keeps its proportions."
            value={settings.columns}
            min={30}
            max={220}
            step={2}
            display={String(settings.columns)}
            onChange={(v) => set({ columns: v })}
          />
          <div>
            <Label className="mb-2 block text-sm font-medium">Character ramp</Label>
            <Select value={settings.rampId} onValueChange={(v) => set({ rampId: v })}>
              <SelectTrigger className="h-9" aria-label="Character ramp">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(ASCII_RAMPS).map((id) => (
                  <SelectItem key={id} value={id}>
                    <span className="capitalize">{id}</span>
                    <span className="ms-2 font-mono text-xs text-muted-foreground">
                      {ASCII_RAMPS[id].slice(0, 10)}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      ) : null}

      <SliderField
        label="Brightness"
        description="Shifts every tone up or down before the process runs."
        value={settings.brightness}
        min={-100}
        max={100}
        step={1}
        display={String(settings.brightness)}
        onChange={(v) => set({ brightness: v })}
      />
      <SliderField
        label="Contrast"
        description="Pivots on mid-grey, so more of it deepens the shadows as well as lifting the highlights. Most photographs need some before they dither well."
        value={settings.contrast}
        min={-100}
        max={100}
        step={1}
        display={String(settings.contrast)}
        onChange={(v) => set({ contrast: v })}
      />
      <ToggleField
        label="Invert"
        description="Ink where the picture is light rather than dark — a negative."
        checked={settings.invert}
        onChange={(v) => set({ invert: v })}
      />

      <div className="space-y-3">
        <Label className="block text-sm font-medium">Colours</Label>
        {(
          [
            { key: 'ink', label: 'Ink' },
            { key: 'paper', label: 'Paper' },
          ] as const
        ).map(({ key, label }) => (
          <div key={key} className="flex items-center gap-3">
            <Label className="w-12 text-xs text-muted-foreground">{label}</Label>
            <input
              type="color"
              value={settings[key]}
              onChange={(e) => set({ [key]: e.target.value })}
              className="h-8 w-9 cursor-pointer rounded border border-field bg-transparent"
              aria-label={`${label} colour`}
            />
            <span className="font-mono text-xs text-muted-foreground">{settings[key]}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        A preset or a shared link carries these settings, not the picture —
        the image never leaves this tab, so there is nothing to put in a URL.
      </p>
    </div>
  )
}
