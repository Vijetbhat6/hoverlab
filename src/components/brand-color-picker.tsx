'use client'

/**
 * Brand color picker — popover with preset palette grid + custom
 * hue/chroma/lightness sliders + reset button. Recolors the entire
 * app instantly via the use-brand-color hook.
 *
 * The trigger button shows a Palette icon with a small dot in the
 * current brand color so users can see their selection at a glance.
 *
 * Triggered from:
 *  - Header button on /library, /playground, /effect/[slug]
 *  - Command palette "Change brand color" action
 *  - Keyboard shortcut `Shift+P` (P for palette; bare `P` is taken)
 *
 * The curated presets and the sliders are free — recolouring the catalog is
 * how you check an effect against your own palette, and a catalog you cannot
 * preview in your own colours is a worse catalog. What Pro adds is the
 * "Your brands" strip below them: naming a colour and keeping it, on the
 * account rather than in this browser. See `lib/brand-library.ts`.
 */

import * as React from 'react'
import Link from 'next/link'
import { Palette, RotateCcw, Check, Lock, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { useBrandColor } from '@/hooks/use-brand-color'
import { useBrandLibrary } from '@/hooks/use-brand-library'
import { useTeamBrandLibrary } from '@/hooks/use-team-brand-library'
import { BRAND_LIBRARY_LIMITS, savedBrandSwatch, type SavedBrand } from '@/lib/brand-library'
import { track } from '@/lib/analytics'
import {
  BRAND_PRESETS,
  DEFAULT_BRAND_COLOR,
  findMatchingPreset,
  type BrandColor,
} from '@/lib/brand-presets'

export interface BrandColorPickerHandle {
  /** Open the popover programmatically (e.g. from the command palette). */
  open: () => void
}

const BrandColorPickerInner = React.forwardRef<
  BrandColorPickerHandle,
  { className?: string }
>(function BrandColorPicker({ className }, ref) {
  const { color, set, reset, isCustomized } = useBrandColor()
  const library = useBrandLibrary()
  const teamLibrary = useTeamBrandLibrary()
  const [open, setOpen] = React.useState(false)

  React.useImperativeHandle(ref, () => ({
    open: () => setOpen(true),
  }))

  // Listen for the command-palette "open brand color" event.
  React.useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener('hoverlab:open-brand-color', handler)
    return () => window.removeEventListener('hoverlab:open-brand-color', handler)
  }, [])

  // Local working copy so slider drags don't thrash localStorage on every
  // pixel of movement. We commit to the hook on `onValueCommit`.
  const [draft, setDraft] = React.useState<BrandColor>(color)
  React.useEffect(() => {
    if (open) setDraft(color)
  }, [open, color])

  const matchingPreset = findMatchingPreset(color)

  const commitDraft = React.useCallback(
    (next: BrandColor) => {
      setDraft(next)
      set(next)
    },
    [set],
  )

  // The trigger dot uses the current color so the user can see what's
  // selected without opening the popover.
  const swatchStyle = {
    backgroundColor: `oklch(${color.lightL} ${color.chroma} ${color.hue})`,
  } as React.CSSProperties

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label={`Brand color: ${matchingPreset?.name ?? 'Custom'} — click to change (Shift+P)`}
              title={`Brand color: ${matchingPreset?.name ?? 'Custom'} — click to change (Shift+P)`}
              className={cn(
                'relative rounded-full border-border/60 bg-background/60 backdrop-blur',
                className,
              )}
            >
              <Palette className="h-[1.1rem] w-[1.1rem]" />
              <span
                aria-hidden
                className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-background"
                style={swatchStyle}
              />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Brand color — Shift+P</TooltipContent>
      </Tooltip>

      <PopoverContent align="end" className="w-80 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <div className="text-sm font-semibold">Brand color</div>
            <div className="text-xs text-muted-foreground">
              {matchingPreset?.name ?? 'Custom'}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={reset}
            disabled={!isCustomized}
            className="h-7 gap-1 px-2 text-xs"
            title="Reset to default Emerald"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
        </div>

        {/* Preset grid */}
        <div className="grid grid-cols-6 gap-2">
          {BRAND_PRESETS.map((preset) => {
            const isSelected = matchingPreset?.id === preset.id
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() =>
                  commitDraft({
                    hue: preset.hue,
                    chroma: preset.chroma,
                    lightL: preset.lightL,
                    darkL: preset.darkL,
                  })
                }
                title={preset.name}
                aria-label={`Use ${preset.name} brand color`}
                aria-pressed={isSelected}
                className={cn(
                  'relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isSelected ? 'border-foreground' : 'border-transparent',
                )}
                style={{ backgroundColor: preset.swatch }}
              >
                {isSelected && (
                  <Check className="h-4 w-4 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]" />
                )}
              </button>
            )
          })}
        </div>

        {/* Saved brands — the Pro strip. */}
        <SavedBrands
          library={library}
          current={color}
          onApply={(next) => commitDraft(next)}
        />

        {/*
          The shared strip, under the personal one.

          Rendered only for a live Team subscription rather than shown
          locked to everyone. The personal strip earns its paywall by being
          a thing any visitor might want; a shared workspace palette is
          meaningless to someone with no workspace, and a second locked
          block in the same popover would read as the product nagging.
        */}
        {teamLibrary.locked ? null : (
          <SavedBrands
            library={teamLibrary}
            current={color}
            onApply={(next) => commitDraft(next)}
            variant="team"
          />
        )}

        {/* Custom sliders */}
        <div className="mt-4 space-y-3 border-t pt-3">
          <div className="text-xs font-medium text-muted-foreground">Custom</div>

          <SliderRow
            label="Hue"
            description="Where the brand colour sits on the wheel. Everything tinted by it — buttons, focus rings, links — moves with this."
            value={draft.hue}
            min={0}
            max={360}
            step={1}
            display={`${Math.round(draft.hue)}°`}
            onChange={(v) => setDraft({ ...draft, hue: v })}
            onCommit={(v) => commitDraft({ ...draft, hue: v })}
            trackGradient="linear-gradient(to right, oklch(0.6 0.2 0), oklch(0.6 0.2 60), oklch(0.6 0.2 120), oklch(0.6 0.2 180), oklch(0.6 0.2 240), oklch(0.6 0.2 300), oklch(0.6 0.2 360))"
          />

          <SliderRow
            label="Chroma"
            description="How vivid the colour is. 0 is grey; past roughly 0.25 many hues fall outside what a standard display can show."
            value={draft.chroma}
            min={0}
            max={0.32}
            step={0.005}
            display={draft.chroma.toFixed(3)}
            onChange={(v) => setDraft({ ...draft, chroma: v })}
            onCommit={(v) => commitDraft({ ...draft, chroma: v })}
          />

          <SliderRow
            label="Light (L)"
            description="Lightness of the brand colour in the light theme. Lower it if white text on your primary button is hard to read."
            value={draft.lightL}
            min={0.2}
            max={0.85}
            step={0.01}
            display={draft.lightL.toFixed(2)}
            onChange={(v) => setDraft({ ...draft, lightL: v })}
            onCommit={(v) => commitDraft({ ...draft, lightL: v })}
          />

          <SliderRow
            label="Dark (L)"
            description="Lightness in the dark theme. It sits higher than the light-theme value on purpose — a colour needs more lightness to read on a dark background."
            value={draft.darkL}
            min={0.4}
            max={0.9}
            step={0.01}
            display={draft.darkL.toFixed(2)}
            onChange={(v) => setDraft({ ...draft, darkL: v })}
            onCommit={(v) => commitDraft({ ...draft, darkL: v })}
          />
        </div>

        {/* Preview + set-to-defaults footer */}
        <div className="mt-4 flex items-center gap-2 border-t pt-3">
          <div
            className="flex h-8 flex-1 items-center justify-center rounded-md text-xs font-medium text-primary-foreground"
            style={{
              backgroundColor: `oklch(${draft.lightL} ${draft.chroma} ${draft.hue})`,
            }}
          >
            Preview
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 text-xs"
            onClick={() => commitDraft({ ...DEFAULT_BRAND_COLOR })}
            title="Set sliders to default values"
          >
            Defaults
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
})

export const BrandColorPicker = React.memo(BrandColorPickerInner)

/**
 * What the strip below needs from a library, and nothing more.
 *
 * Declared structurally so the personal and the shared library can both be
 * passed to one component without either hook importing the other. Adding
 * a member here is a decision to make both libraries provide it.
 */
interface BrandLibraryLike {
  brands: Array<SavedBrand & { createdBy?: string | null }>
  loading: boolean
  locked: boolean
  signedOut: boolean
  canSave: boolean
  /**
   * Returns the saved preset, or null when the name was empty or the
   * library is full. Narrowed to the one field the strip renders rather
   * than to SavedBrand, so a library that carries extra fields (the shared
   * one carries `createdBy`) still satisfies this.
   */
  save: (name: string, color: BrandColor) => { name: string } | null
  remove: (id: string) => void
}

/* ============================================================
 *  Saved brands — the Pro strip
 * ========================================================== */

/**
 * The account's named brand colours, under the curated row.
 *
 * Shown to everyone, including signed-out visitors, as one line of copy and
 * a link. A Pro feature the free tier never sees is a Pro feature nobody
 * buys — and this one is otherwise invisible, since it lives inside a
 * popover behind a keyboard shortcut.
 */
function SavedBrands({
  library,
  current,
  onApply,
  variant = 'personal',
}: {
  /*
   * Structurally typed rather than tied to one hook. The personal and the
   * team library expose the same six members on purpose, and this strip is
   * the reason — the UI for "a list of named colours you can apply, save to
   * and delete from" should not exist twice.
   */
  library: BrandLibraryLike
  current: BrandColor
  onApply: (color: BrandColor) => void
  /** Which library this is. Changes only the copy and the paywall target. */
  variant?: 'personal' | 'team'
}) {
  const team = variant === 'team'
  const [naming, setNaming] = React.useState(false)
  const [draftName, setDraftName] = React.useState('')

  /*
   * Counted on render rather than on a click, and that is the right moment
   * here: Radix unmounts popover content when closed, so this fires exactly
   * once per time a free visitor opens the picker and is shown the strip.
   * That is the number the funnel wants — how many people saw it — not how
   * many clicked a link there is only one of.
   */
  const gated = library.signedOut || library.locked
  React.useEffect(() => {
    if (gated) {
      track('paywall_hit', {
        feature: team ? 'team_brand_library' : 'brand_library',
        plan_required: team ? 'team' : 'pro',
      })
    }
  }, [gated, team])

  if (gated) {
    return (
      <div className="mt-4 border-t pt-3">
        <div className="flex items-start gap-2">
          <Lock aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <p className="text-[11px] leading-snug text-muted-foreground">
            {library.signedOut ? (
              <>
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Sign in
                </Link>{' '}
                to name a colour and keep it across machines.
              </>
            ) : team ? (
              <>
                Agree a palette once and have it appear for everyone on the{' '}
                <Link href="/#pricing" className="font-medium text-primary hover:underline">
                  Team plan
                </Link>
                . Your own saved colours stay yours either way.
              </>
            ) : (
              <>
                Save a colour under a name — “Northwind blue”, “Acme orange” —
                and keep it on your account with{' '}
                <Link href="/#pricing" className="font-medium text-primary hover:underline">
                  Pro
                </Link>
                .
              </>
            )}
          </p>
        </div>
      </div>
    )
  }

  function saveCurrent(event: React.FormEvent) {
    event.preventDefault()
    const saved = library.save(draftName, current)
    if (!saved) {
      toast.error(
        draftName.trim()
          ? `You can keep up to ${BRAND_LIBRARY_LIMITS.perAccount} brands.`
          : 'Give the colour a name first.',
      )
      return
    }
    setDraftName('')
    setNaming(false)
    toast.success(`Saved “${saved.name}”`)
  }

  return (
    <div className="mt-4 space-y-2 border-t pt-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {team ? 'Shared with your team' : 'Your brands'}
        </span>
        <button
          type="button"
          onClick={() => setNaming((v) => !v)}
          disabled={!library.canSave}
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-40"
        >
          <Plus className="h-3 w-3" />
          Save this colour
        </button>
      </div>

      {naming ? (
        <form onSubmit={saveCurrent} className="flex gap-1.5">
          <Input
            autoFocus
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder="Name this colour…"
            maxLength={BRAND_LIBRARY_LIMITS.nameLength}
            aria-label="Brand colour name"
            className="h-7 text-xs"
          />
          <Button type="submit" size="sm" variant="secondary" className="h-7 px-2 text-xs">
            Save
          </Button>
        </form>
      ) : null}

      {library.brands.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {library.brands.map((brand) => (
            <li key={brand.id} className="group relative">
              <button
                type="button"
                onClick={() =>
                  onApply({
                    hue: brand.hue,
                    chroma: brand.chroma,
                    lightL: brand.lightL,
                    darkL: brand.darkL,
                  })
                }
                title={brand.name}
                aria-label={`Use ${brand.name}`}
                className="flex max-w-[9rem] items-center gap-1.5 rounded-full border border-border/60 py-0.5 pl-1 pr-2 text-[11px] transition-colors hover:border-primary/40"
              >
                <span
                  aria-hidden
                  className="h-4 w-4 shrink-0 rounded-full"
                  style={{ backgroundColor: savedBrandSwatch(brand) }}
                />
                <span className="truncate">{brand.name}</span>
              </button>
              <button
                type="button"
                onClick={() => library.remove(brand.id)}
                aria-label={`Delete ${brand.name}`}
                /* Visible on hover and on keyboard focus — focus-within on
                   the row would not cover it, since this button IS the
                   focused element. */
                className="absolute -right-1 -top-1 hidden rounded-full border border-border bg-background p-0.5 text-muted-foreground group-hover:block focus:block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : !naming ? (
        <p className="text-[11px] text-muted-foreground">
          {team
            ? 'Nothing shared yet. Anything saved here appears for everyone on the workspace.'
            : 'Nothing saved yet. Tune the sliders below, then name the result.'}
        </p>
      ) : null}
    </div>
  )
}

/* ============================================================
 *  Slider row helper
 * ========================================================== */

interface SliderRowProps {
  label: string
  /**
   * One line on what the control does. Required, matching
   * <SliderField> — an unexplained slider is what this replaces.
   */
  description: string
  value: number
  min: number
  max: number
  step: number
  display: string
  onChange: (v: number) => void
  onCommit: (v: number) => void
  /** Optional CSS gradient string painted on the slider track. */
  trackGradient?: string
}

let sliderRowInstanceCounter = 0

function SliderRow({
  label,
  description,
  value,
  min,
  max,
  step,
  display,
  onChange,
  onCommit,
  trackGradient,
}: SliderRowProps) {
  // Unique per-instance class so the optional gradient track only
  // affects THIS slider, not every slider on the page.
  const [instanceClass] = React.useState(
    () => `brand-slider-${++sliderRowInstanceCounter}`,
  )
  const descriptionId = `${instanceClass}-description`

  return (
    <div className={instanceClass}>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="font-mono text-xs tabular-nums">{display}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        aria-label={label}
        aria-describedby={descriptionId}
        onValueChange={(arr) => onChange(arr[0])}
        onValueCommit={(arr) => onCommit(arr[0])}
      />
      <p id={descriptionId} className="mt-1 text-[11px] leading-snug text-muted-foreground">
        {description}
      </p>
      {trackGradient && (
        <style jsx>{`
          :global(.${instanceClass} [data-slot='slider-track']) {
            background: ${trackGradient} !important;
          }
        `}</style>
      )}
    </div>
  )
}
