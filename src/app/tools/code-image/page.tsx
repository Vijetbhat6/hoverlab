'use client'

/**
 * Code → image.
 *
 * A snippet as a PNG, for the places that will not take a code block: a
 * release note, a slide, a social card, a changelog entry. The honest framing
 * is that this serves the people publishing more than the people building —
 * an image of code cannot be copied, searched or read by a screen reader, and
 * anywhere a real code block fits, a real code block is better. So the tool
 * says so on the page, next to the buttons that produce the file, rather than
 * leaving the accessibility question to whoever pastes it.
 *
 * The preview is the same canvas the export draws to, at 1×.
 *
 * That is worth more than it sounds. Every other tool of this kind styles a
 * `<pre>` and then rasterises the DOM through an SVG `foreignObject`, which
 * re-flows under whatever fonts the rasteriser can see and hands back a file
 * that does not match what was approved on screen. Here there is one layout
 * function (`lib/code-image.ts`), called once for the preview and once at
 * export scale, so "what you see" and "what you get" are the same code path
 * rather than two implementations kept in sync by hope.
 *
 * Nothing is uploaded — the highlighter is ours and runs in the tab. That is
 * the site's standing claim about the tools, and it matters more here than
 * anywhere else on it, because the input is somebody's source code.
 */

import * as React from 'react'
import { Code2, Check, Download, ImageDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SliderField, ToggleField } from '@/components/control-field'
import { ToolLayout } from '@/components/designer-tools/tool-layout'
import { ToolPresetsBar } from '@/components/designer-tools/tool-presets-bar'
import { UseInCatalog } from '@/components/designer-tools/use-in-catalog'
import { ToolWorkbench } from '@/components/designer-tools/tool-workbench'
import { useToolState } from '@/hooks/use-tool-state'
import {
  CODE_THEMES,
  LANGUAGES,
  downloadName,
  render,
  type BackdropKind,
  type CodeImageOptions,
  type CodeLanguage,
} from '@/lib/code-image'
import { cn } from '@/lib/utils'

const TOOL = '/tools/code-image'

const SAMPLE = `export function useDebounced<T>(value: T, ms = 200) {
  const [settled, setSettled] = useState(value)

  useEffect(() => {
    // Clearing on re-run is the whole trick — without it every
    // keystroke leaves its own timer running to completion.
    const id = setTimeout(() => setSettled(value), ms)
    return () => clearTimeout(id)
  }, [value, ms])

  return settled
}`

interface CodeImageState {
  code: string
  language: CodeLanguage
  themeId: string
  fontSize: number
  padding: number
  inset: number
  radius: number
  chrome: boolean
  title: string
  lineNumbers: boolean
  maxChars: number
  backdrop: BackdropKind
  backdropColor: string
  shadow: boolean
  /** Export multiplier. The preview is always 1× so it is honest about size. */
  scale: number
}

const DEFAULT_STATE: CodeImageState = {
  code: SAMPLE,
  language: 'tsx',
  themeId: 'midnight',
  fontSize: 15,
  padding: 48,
  inset: 24,
  radius: 14,
  chrome: true,
  title: 'use-debounced.ts',
  lineNumbers: false,
  maxChars: 78,
  backdrop: 'theme',
  backdropColor: '#e2e8f0',
  shadow: true,
  scale: 2,
}

/** State into the renderer's options, resolving the theme id. */
function optionsFrom(state: CodeImageState): CodeImageOptions {
  return {
    ...state,
    theme: CODE_THEMES.find((t) => t.id === state.themeId) ?? CODE_THEMES[0]!,
  }
}

/**
 * Draw at `scale` into a canvas sized for it.
 *
 * Sizing happens here rather than in the renderer because a canvas resize
 * clears it and resets the context — doing both in one place is what keeps a
 * stale frame from surviving a settings change.
 */
function paint(
  canvas: HTMLCanvasElement,
  state: CodeImageState,
  scale: number,
): { width: number; height: number } | null {
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const opts = optionsFrom(state)

  // A first pass to learn the size, then the real one.
  //
  // The size depends on the text metrics, the metrics need a context with the
  // font already set, and setting the canvas dimensions clears it — so the
  // order has to be measure, resize, draw. At these sizes the wasted pass is
  // a fraction of a frame, and the alternative is a second copy of the layout
  // maths that can disagree with the one that paints.
  const probe = render(ctx, opts, 1)

  canvas.width = Math.ceil(probe.width * scale)
  canvas.height = Math.ceil(probe.height * scale)
  canvas.style.width = `${probe.width}px`
  canvas.style.height = `${probe.height}px`

  render(ctx, opts, scale)
  return { width: probe.width, height: probe.height }
}

export default function CodeImageToolPage() {
  const tool = useToolState<CodeImageState>(TOOL, DEFAULT_STATE)
  const { state } = tool
  const setState = tool.setState

  const update = (patch: Partial<CodeImageState>) =>
    setState((s) => ({ ...s, ...patch }))

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const [size, setSize] = React.useState<{ width: number; height: number } | null>(null)
  const [copied, setCopied] = React.useState(false)
  const [copyError, setCopyError] = React.useState<string | null>(null)

  /*
    The preview redraws at the device pixel ratio, not at 1×.

    A canvas laid out at CSS pixels and backed by CSS pixels is soft on every
    laptop made in the last decade, and soft type in a tool whose entire
    output is type reads as a rendering bug. The exported file uses the scale
    control instead, which is the number the visitor actually chose.
  */
  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = Math.min(3, Math.max(1, window.devicePixelRatio || 1))
    setSize(paint(canvas, state, dpr))
  }, [state])

  /** Redraw off-screen at the export scale, so the file is not the preview's DPR. */
  const toBlob = React.useCallback(async (): Promise<Blob | null> => {
    const offscreen = document.createElement('canvas')
    if (!paint(offscreen, state, state.scale)) return null
    return new Promise((resolve) => offscreen.toBlob((b) => resolve(b), 'image/png'))
  }, [state])

  async function handleDownload() {
    const blob = await toBlob()
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = downloadName(state)
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleCopy() {
    setCopyError(null)
    const blob = await toBlob()
    if (!blob) return
    try {
      // Feature-detected rather than assumed: Firefox has only recently
      // grown image support here, and a silent no-op on a copy button is
      // the worst possible failure — the visitor pastes the last thing they
      // copied and blames the paste.
      if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
        throw new Error('unsupported')
      }
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopyError('This browser will not copy images to the clipboard. Download instead.')
    }
  }

  const lineCount = state.code.split('\n').length
  const theme = optionsFrom(state).theme

  return (
    <ToolLayout
      name="Code to Image"
      tagline="A snippet as a PNG for the places that will not take a code block — drawn in the tab, nothing uploaded"
      icon={<Code2 className="h-5 w-5" />}
    >
      <ToolWorkbench controlsWidth="380px">
        <div className="space-y-4">
          {/* The stage. Scrolls in both directions rather than scaling the
              canvas down, so what is on screen is the real pixel size. */}
          <div className="overflow-auto rounded-xl border border-border bg-[repeating-conic-gradient(theme(colors.muted/60)_0_25%,transparent_0_50%)] bg-[length:16px_16px] p-4">
            <canvas
              ref={canvasRef}
              className="mx-auto block max-w-none"
              role="img"
              aria-label={`Preview of the ${state.language} snippet as an image`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4">
            <Button onClick={() => void handleDownload()} size="sm" className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> Download PNG
            </Button>
            <Button
              onClick={() => void handleCopy()}
              size="sm"
              variant="outline"
              className="gap-1.5"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <ImageDown className="h-3.5 w-3.5" />
              )}
              {copied ? 'Copied' : 'Copy image'}
            </Button>
            <span className="ml-auto font-mono text-[11px] text-muted-foreground">
              {size
                ? `${Math.round(size.width * state.scale)} × ${Math.round(
                    size.height * state.scale,
                  )} px at ${state.scale}×`
                : '—'}
            </span>
          </div>

          {copyError ? (
            <p role="alert" className="text-sm text-destructive">
              {copyError}
            </p>
          ) : null}

          <div className="space-y-2 rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="ci-code" className="text-sm font-medium">
                Code
              </Label>
              <span className="font-mono text-[11px] text-muted-foreground">
                {lineCount} {lineCount === 1 ? 'line' : 'lines'}
              </span>
            </div>
            <textarea
              id="ci-code"
              value={state.code}
              onChange={(e) => update({ code: e.target.value })}
              spellCheck={false}
              rows={14}
              className="w-full resize-y rounded-md border border-border bg-background p-3 font-mono text-xs leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-[11px] leading-snug text-muted-foreground">
              Tabs become two spaces, because a canvas has no tab stops. Lines
              longer than the wrap width break with a hanging indent rather
              than running off the edge.
            </p>
          </div>

          {/*
            The caveat, in the tool rather than in a blog post nobody reads.

            An image of code is unsearchable, uncopyable and unreadable to a
            screen reader. That is a real cost, and a tool that hands out the
            image without mentioning it is choosing for the person publishing.
          */}
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4">
            <p className="text-xs leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">
                Use a real code block where one fits.
              </span>{' '}
              An image cannot be copied, searched, or read aloud, and it does
              not reflow on a phone. This is for the places that genuinely will
              not take one — slides, social cards, release notes in tools with
              no code formatting. Where you do post it, give it alt text saying
              what the code does rather than transcribing it.
            </p>
          </div>

          <UseInCatalog tool={TOOL} />
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <Label className="block text-sm font-medium">Appearance</Label>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ci-lang" className="text-xs font-semibold">
                  Language
                </Label>
                <Select
                  value={state.language}
                  onValueChange={(v) => update({ language: v as CodeLanguage })}
                >
                  <SelectTrigger id="ci-lang" aria-label="Language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l.id} value={l.id} className="text-xs">
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ci-scale" className="text-xs font-semibold">
                  Export scale
                </Label>
                <Select
                  value={String(state.scale)}
                  onValueChange={(v) => update({ scale: Number(v) })}
                >
                  <SelectTrigger id="ci-scale" aria-label="Export scale">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1× — as previewed</SelectItem>
                    <SelectItem value="2">2× — retina, the safe default</SelectItem>
                    <SelectItem value="3">3× — print or a big slide</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Theme</Label>
              <div className="grid grid-cols-2 gap-2">
                {CODE_THEMES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => update({ themeId: t.id })}
                    aria-pressed={state.themeId === t.id}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      state.themeId === t.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:bg-muted/50',
                    )}
                  >
                    <span
                      aria-hidden
                      className="h-4 w-4 shrink-0 rounded-full border border-black/10"
                      style={{ backgroundColor: t.bg }}
                    />
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            <ToggleField
              label="Window chrome"
              description="The three dots and a title bar. Reads as a screenshot rather than a graphic, which is either exactly what you want or exactly what you do not."
              checked={state.chrome}
              onChange={(v) => update({ chrome: v })}
            />

            {state.chrome ? (
              <div className="space-y-1.5">
                <Label htmlFor="ci-title" className="text-xs font-semibold">
                  Title
                </Label>
                <Input
                  id="ci-title"
                  value={state.title}
                  onChange={(e) => update({ title: e.target.value })}
                  placeholder="filename.ts"
                  className="h-9 font-mono text-xs"
                />
                <p className="text-[11px] leading-snug text-muted-foreground">
                  Also the download filename. A path here tells the reader where
                  the snippet lives, which is the one thing a screenshot of code
                  usually leaves out.
                </p>
              </div>
            ) : null}

            <ToggleField
              label="Line numbers"
              description="Only worth it when the surrounding text refers to a line. Otherwise they are a column of noise the reader has to look past."
              checked={state.lineNumbers}
              onChange={(v) => update({ lineNumbers: v })}
            />
            <ToggleField
              label="Drop shadow"
              description="Lifts the card off the backdrop. Turn it off with a transparent backdrop, or the shadow lands on nothing and shows up as a grey smear wherever the image is placed."
              checked={state.shadow}
              onChange={(v) => update({ shadow: v })}
            />
          </div>

          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <Label className="block text-sm font-medium">Backdrop</Label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ['theme', 'Themed'],
                  ['solid', 'Solid'],
                  ['none', 'None'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => update({ backdrop: value })}
                  aria-pressed={state.backdrop === value}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    state.backdrop === value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-muted/50',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {state.backdrop === 'solid' ? (
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={state.backdropColor}
                  onChange={(e) => update({ backdropColor: e.target.value })}
                  aria-label="Backdrop colour"
                  className="h-8 w-9 cursor-pointer rounded border border-border bg-transparent"
                />
                <Input
                  value={state.backdropColor}
                  onChange={(e) => update({ backdropColor: e.target.value })}
                  className="h-8 flex-1 font-mono text-xs"
                />
              </div>
            ) : null}

            {state.backdrop === 'none' ? (
              <p className="text-[11px] leading-snug text-muted-foreground">
                Transparent, so the card sits on whatever it is placed over.
                The chequerboard behind the preview is this page, not the file.
              </p>
            ) : (
              <p className="text-[11px] leading-snug text-muted-foreground">
                {state.backdrop === 'theme'
                  ? `A gradient derived from ${theme.name} — the card and its ground stay one thing.`
                  : 'One flat colour. Match it to the slide and the card looks placed rather than pasted.'}
              </p>
            )}

            <SliderField
              label="Outer padding"
              description="The margin around the card. Generous is right for a social card, where the crop is out of your hands; tight is right when you are placing it yourself."
              value={state.padding}
              min={0}
              max={140}
              step={4}
              display={`${state.padding}px`}
              onChange={(v) => update({ padding: v })}
            />
          </div>

          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <Label className="block text-sm font-medium">Type &amp; card</Label>
            <SliderField
              label="Font size"
              description="Set it for where the image will be read. A snippet on a slide wants 18–22px; one inline in a release note is fine at 14."
              value={state.fontSize}
              min={10}
              max={28}
              step={1}
              display={`${state.fontSize}px`}
              onChange={(v) => update({ fontSize: v })}
            />
            <SliderField
              label="Wrap width"
              description="Where a long line breaks, in characters. Under about 60 the wrapping starts doing more damage to legibility than the long line did."
              value={state.maxChars}
              min={32}
              max={160}
              step={2}
              display={`${state.maxChars} ch`}
              onChange={(v) => update({ maxChars: v })}
            />
            <SliderField
              label="Card padding"
              description="Inside the card, around the text. This is also the left offset of the window dots, so the two stay aligned."
              value={state.inset}
              min={8}
              max={64}
              step={2}
              display={`${state.inset}px`}
              onChange={(v) => update({ inset: v })}
            />
            <SliderField
              label="Corner radius"
              description="Zero reads as a document, sixteen as an app window. Nothing in between reads as either."
              value={state.radius}
              min={0}
              max={32}
              step={1}
              display={`${state.radius}px`}
              onChange={(v) => update({ radius: v })}
            />
          </div>

          <ToolPresetsBar tool={tool} noun="snippet style" />
        </div>
      </ToolWorkbench>
    </ToolLayout>
  )
}
