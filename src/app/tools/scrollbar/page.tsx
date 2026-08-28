'use client'

/**
 * Scrollbar Styler.
 *
 * Scrollbar styling is in the middle of a standards transition, and that is
 * the entire reason this tool is worth having rather than being a two-line
 * snippet. There are two mechanisms:
 *
 *   `scrollbar-width` / `scrollbar-color` are the standard. Two properties,
 *   no pseudo-elements, work in Firefox and now everywhere else — but they
 *   accept a thickness keyword rather than a number, and exactly two
 *   colours. You cannot round the thumb or give it a border.
 *
 *   `::-webkit-scrollbar` is the old WebKit set. Full control — radius,
 *   borders, hover states, separate track and corner — and no standards
 *   track. Firefox never implemented it.
 *
 * Which means the correct answer today is *both*, in that order, and a
 * generator that emits only one of them ships something that looks wrong in
 * half the browsers. So this emits both from one set of controls, and says
 * which half each browser will honour.
 *
 * The other thing worth saying out loud, and said on the page: a scrollbar
 * that is 4px wide and low-contrast is a scrollbar people with imprecise
 * pointing cannot grab and people with low vision cannot find. The tool
 * warns rather than forbids — but it warns.
 */

import * as React from 'react'
import { Rows3 } from 'lucide-react'

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
import { ToolLayout } from '@/components/designer-tools/tool-layout'
import { ToolPresetsBar } from '@/components/designer-tools/tool-presets-bar'
import { UseInCatalog } from '@/components/designer-tools/use-in-catalog'
import { ToolWorkbench } from '@/components/designer-tools/tool-workbench'
import { useToolState } from '@/hooks/use-tool-state'
import { cn } from '@/lib/utils'

const TOOL = '/tools/scrollbar'

type Width = 'auto' | 'thin' | 'none'

interface ScrollbarState {
  /** Pixels, for the WebKit half. The standard half only takes a keyword. */
  size: number
  thumb: string
  thumbHover: string
  track: string
  radius: number
  /** Inset border in the thumb's own colour — how a floating thumb is faked. */
  inset: number
  standardWidth: Width
  scopeToClass: boolean
  hideUntilHover: boolean
}

const DEFAULT_STATE: ScrollbarState = {
  size: 10,
  thumb: '#94a3b8',
  thumbHover: '#64748b',
  track: '#f1f5f9',
  radius: 8,
  inset: 2,
  standardWidth: 'thin',
  scopeToClass: true,
  hideUntilHover: false,
}

/**
 * `scrollbar-width` takes a keyword, not a length — so a 14px scrollbar
 * cannot be expressed in the standard properties at all. Rather than emit
 * something that silently disagrees with the WebKit half, the keyword is
 * derived from the pixel size and the mismatch is stated on the page.
 */
function impliedKeyword(size: number): Width {
  if (size === 0) return 'none'
  return size <= 10 ? 'thin' : 'auto'
}

export default function ScrollbarToolPage() {
  const tool = useToolState<ScrollbarState>(TOOL, DEFAULT_STATE)
  const { state, setState } = tool

  const update = (patch: Partial<ScrollbarState>) => setState((s) => ({ ...s, ...patch }))

  const sel = state.scopeToClass ? '.scroll-area' : 'html'
  const implied = impliedKeyword(state.size)
  const keywordDisagrees = state.standardWidth !== implied

  /*
    Two blocks, standard first.

    Order matters for more than tidiness: a browser that supports both reads
    both, and the WebKit pseudo-elements are more specific, so putting them
    second means the richer styling wins where it exists and the standard
    properties are the floor everywhere else.
  */
  const standardCss = `/* The standard properties. Firefox, and every modern engine.
   Note that scrollbar-width takes a keyword — there is no way to
   say "${state.size}px" here, which is why the WebKit block below exists. */
${sel} {
  scrollbar-width: ${state.standardWidth};
  scrollbar-color: ${state.thumb} ${state.track};
}`

  const webkitCss =
    state.size === 0
      ? `/* WebKit / Blink — hide it entirely. */
${sel}::-webkit-scrollbar {
  display: none;
}`
      : `/* WebKit / Blink — the half that can round a thumb. */
${sel}::-webkit-scrollbar {
  width: ${state.size}px;
  height: ${state.size}px;
}

${sel}::-webkit-scrollbar-track {
  background: ${state.track};
}

${sel}::-webkit-scrollbar-thumb {
  background: ${state.thumb};
  border-radius: ${state.radius}px;${
    state.inset > 0
      ? `
  /* A transparent border plus background-clip is how a "floating" thumb
     with padding around it is done — there is no padding on a scrollbar. */
  border: ${state.inset}px solid transparent;
  background-clip: content-box;`
      : ''
  }
}

${sel}::-webkit-scrollbar-thumb:hover {
  background: ${state.thumbHover};
}

${sel}::-webkit-scrollbar-corner {
  background: ${state.track};
}`

  const hoverCss = state.hideUntilHover
    ? `

/* Reveal on hover only. Read the warning: on a touch device there is no
   hover, and for anyone navigating by pointer this removes the only
   visual cue that the region scrolls at all. */
${sel} {
  scrollbar-color: transparent transparent;
}

${sel}:hover,
${sel}:focus-within {
  scrollbar-color: ${state.thumb} ${state.track};
}

${sel}::-webkit-scrollbar-thumb {
  background: transparent;
}

${sel}:hover::-webkit-scrollbar-thumb,
${sel}:focus-within::-webkit-scrollbar-thumb {
  background: ${state.thumb};
}`
    : ''

  const cssBlock = `${standardCss}\n\n${webkitCss}${hoverCss}`

  /*
    The preview cannot use the emitted class — the page's own stylesheet
    would need it at build time — so the same values are injected as a
    scoped <style> against a unique class. Same declarations, same order.
  */
  const previewCss = cssBlock.replace(new RegExp(sel.replace('.', '\\.'), 'g'), '.sb-preview')

  const tooThin = state.size > 0 && state.size < 8
  const hidden = state.size === 0

  return (
    <ToolLayout
      name="Custom Scrollbar CSS Generator"
      tagline="Both mechanisms from one set of controls — the standard properties and the WebKit pseudo-elements, in the order that makes them agree"
      icon={<Rows3 className="h-5 w-5" />}
    >
      <ToolWorkbench controlsWidth="380px">
        <div className="space-y-4">
          <style>{previewCss}</style>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <Label className="mb-3 block text-sm font-medium">Live, in both axes</Label>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sb-preview h-64 overflow-auto rounded-lg border border-border bg-background p-4">
                <p className="text-sm font-semibold">Vertical</p>
                {Array.from({ length: 14 }, (_, i) => (
                  <p key={i} className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    Line {i + 1}. Scroll this panel to see the thumb at its real size.
                    A scrollbar is judged at the size it ships, not in a swatch —
                    which is why this is a real overflowing region rather than a
                    picture of one.
                  </p>
                ))}
              </div>
              <div className="sb-preview h-64 overflow-auto rounded-lg border border-border bg-background p-4">
                <div className="w-[700px]">
                  <p className="text-sm font-semibold">Horizontal</p>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    The WebKit block sets <code className="font-mono">height</code> as
                    well as <code className="font-mono">width</code>, because a
                    horizontal scrollbar takes its thickness from the height. Setting
                    only the width is the reason a custom scrollbar so often looks
                    right vertically and default horizontally.
                  </p>
                  {Array.from({ length: 8 }, (_, i) => (
                    <p key={i} className="mt-2 text-xs text-muted-foreground">
                      A wide row of content that forces this panel to scroll sideways —
                      row {i + 1}.
                    </p>
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Rendering in your browser, so what you see is what your engine
              honours — the two blocks below do not both apply everywhere.
            </p>
          </div>

          {tooThin || hidden || state.hideUntilHover ? (
            <div
              role="status"
              className="space-y-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-700 dark:text-amber-300"
            >
              {hidden ? (
                <p>
                  <strong className="font-semibold">The scrollbar is hidden.</strong> The
                  region still scrolls with a wheel, a trackpad and the keyboard, but
                  there is now nothing on screen saying it can be scrolled and no way to
                  drag it. Reserve this for a region whose scrollability is obvious some
                  other way — a carousel with arrows, say — and never for the page.
                </p>
              ) : null}
              {tooThin ? (
                <p>
                  <strong className="font-semibold">{state.size}px is a hard target.</strong>{' '}
                  Anything under about 8px is difficult to hit for anyone using a
                  trackpad imprecisely, a touchscreen, or a head or eye pointer.
                  Thin looks tidy in a screenshot and costs real people the ability
                  to drag it.
                </p>
              ) : null}
              {state.hideUntilHover ? (
                <p>
                  <strong className="font-semibold">Hover-only has no touch equivalent.</strong>{' '}
                  On a phone or tablet there is no hover state to enter, so the
                  scrollbar simply never appears. The emitted CSS pairs it with{' '}
                  <code className="font-mono">:focus-within</code>, which at least
                  brings it back for keyboard users.
                </p>
              ) : null}
            </div>
          ) : null}

          {keywordDisagrees ? (
            <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
              Heads up: <code className="font-mono">scrollbar-width: {state.standardWidth}</code>{' '}
              does not match a {state.size}px WebKit scrollbar — the closest keyword
              would be <code className="font-mono">{implied}</code>. The standard
              property has no length form, so the two halves will differ by a few
              pixels between engines. Usually fine; worth knowing before you chase it.
            </p>
          ) : null}

          <CopyCssCard code={cssBlock} title="CSS" language="css" />

          <UseInCatalog tool={TOOL} />
        </div>

        {/* Controls */}
        <div className="space-y-5">
          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <Label className="block text-sm font-medium">Size and shape</Label>
            <SliderField
              label="Thickness"
              description="Width for a vertical bar, height for a horizontal one — the emitted CSS sets both. Zero hides it entirely. WebKit only; the standard property takes a keyword instead."
              value={state.size}
              min={0}
              max={24}
              step={1}
              display={state.size === 0 ? 'hidden' : `${state.size}px`}
              onChange={(v) => update({ size: v })}
            />
            <SliderField
              label="Thumb radius"
              description="Rounds the draggable part. This is the single thing the standard properties cannot express, and the main reason the WebKit block is still worth emitting."
              value={state.radius}
              min={0}
              max={12}
              step={1}
              display={`${state.radius}px`}
              onChange={(v) => update({ radius: v })}
              disabled={state.size === 0}
            />
            <SliderField
              label="Thumb inset"
              description="Space between the thumb and the edge of the track, faked with a transparent border and background-clip — scrollbar parts take no padding. An inset of 2–3px is what makes a thumb read as floating rather than filling."
              value={state.inset}
              min={0}
              max={6}
              step={1}
              display={`${state.inset}px`}
              onChange={(v) => update({ inset: v })}
              disabled={state.size === 0}
            />
          </div>

          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <Label className="block text-sm font-medium">Colour</Label>
            <ColorRow
              label="Thumb"
              hint="The part you drag"
              value={state.thumb}
              onChange={(thumb) => update({ thumb })}
            />
            <ColorRow
              label="Thumb, hovered"
              hint="WebKit only"
              value={state.thumbHover}
              onChange={(thumbHover) => update({ thumbHover })}
            />
            <ColorRow
              label="Track"
              hint="The groove behind it"
              value={state.track}
              onChange={(track) => update({ track })}
            />
            <p className="text-[11px] leading-snug text-muted-foreground">
              These are literals, which means one theme. For a scrollbar that
              follows light and dark, replace them with the custom properties
              from the token generator once you have pasted the rule.
            </p>
          </div>

          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <Label className="block text-sm font-medium">Scope and behaviour</Label>
            <div className="space-y-1.5">
              <Label htmlFor="sb-width" className="font-mono text-xs font-semibold">
                scrollbar-width
              </Label>
              <Select
                value={state.standardWidth}
                onValueChange={(v) => update({ standardWidth: v as Width })}
              >
                <SelectTrigger id="sb-width" aria-label="scrollbar-width keyword">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">auto — the platform default</SelectItem>
                  <SelectItem value="thin">thin</SelectItem>
                  <SelectItem value="none">none — hidden, still scrollable</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] leading-snug text-muted-foreground">
                The standard property, and it only accepts these three. Keep it in
                step with the thickness above or the two blocks will disagree
                between engines.
              </p>
            </div>
            <ToggleField
              label="Scope to a class"
              description="Emits `.scroll-area` rather than `html`. Styling the document scrollbar is a decision about the whole site, including pages you have not designed yet; a class is the version you can undo."
              checked={state.scopeToClass}
              onChange={(v) => update({ scopeToClass: v })}
            />
            <ToggleField
              label="Show only on hover"
              description="Fades the thumb out until the pointer is over the region. Fashionable, and it costs touch users the scrollbar entirely — see the warning that appears when you turn it on."
              checked={state.hideUntilHover}
              onChange={(v) => update({ hideUntilHover: v })}
            />
          </div>

          <ToolPresetsBar tool={tool} noun="scrollbar" />
        </div>
      </ToolWorkbench>
    </ToolLayout>
  )
}

function ColorRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint: string
  value: string
  onChange: (value: string) => void
}) {
  const id = React.useId()
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id} className="text-xs font-semibold">
          {label}
        </Label>
        <span className="text-[11px] text-muted-foreground">{hint}</span>
      </div>
      <div className="flex gap-2">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 shrink-0 cursor-pointer rounded-md border border-border bg-background p-1"
        />
        <input
          type="text"
          aria-label={`${label} hex`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-2 font-mono text-xs uppercase',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
        />
      </div>
    </div>
  )
}
