/**
 * <SelectionAiToolbar> — highlight a passage, hand it to the model.
 *
 * The pattern that puts AI into an existing editor without a chat panel. It
 * is mostly a positioning problem, and the positioning is where every
 * implementation breaks:
 *
 *  - The toolbar is placed from `getBoundingClientRect()` on the selection
 *    range, converted into coordinates relative to the *container*, not the
 *    viewport. Absolute-positioning against the viewport looks right until
 *    the page scrolls one pixel.
 *  - It is clamped inside the container, so selecting a word at the left
 *    edge does not push the toolbar off-screen.
 *  - `onMouseDown` calls `preventDefault` on every button. Without it, the
 *    press collapses the selection before the click handler runs, and the
 *    toolbar acts on nothing — the single most common bug in this pattern.
 *  - Selection is read on `selectionchange`, filtered to ranges inside this
 *    block. A `mouseup` handler misses keyboard selection (Shift-Arrow)
 *    entirely, which is most of the users who need this to be reachable.
 *
 * Accessibility: the toolbar is a `role="toolbar"` with roving `tabIndex`,
 * so it is one tab stop and arrow keys move along it — the ARIA toolbar
 * pattern. Escape dismisses it and returns focus to the passage. A keyboard
 * user can therefore select text, Tab once, and act, which a hover-only
 * popover never allows.
 */

'use client'

import * as React from 'react'
import { Languages, Maximize2, Minimize2, MoreHorizontal, Sparkles, SpellCheck } from 'lucide-react'

export interface SelectionAction {
  id: string
  label: string
  icon: 'explain' | 'expand' | 'shorten' | 'tone' | 'grammar'
}

export interface SelectionAiToolbarProps {
  /** The document body. Selecting inside it raises the toolbar. */
  passage?: string
  actions?: SelectionAction[]
  /**
   * Phrase to pre-select on load, so the block demonstrates itself. Set to
   * an empty string for the real behaviour, where nothing shows until the
   * user selects something.
   */
  demoPhrase?: string
  className?: string
}

const ACTION_ICON = {
  explain: Sparkles,
  expand: Maximize2,
  shorten: Minimize2,
  tone: Languages,
  grammar: SpellCheck,
} as const

const DEFAULT_ACTIONS: SelectionAction[] = [
  { id: 'explain', label: 'Explain', icon: 'explain' },
  { id: 'improve', label: 'Improve', icon: 'expand' },
  { id: 'shorten', label: 'Shorten', icon: 'shorten' },
  { id: 'tone', label: 'Tone', icon: 'tone' },
  { id: 'grammar', label: 'Grammar', icon: 'grammar' },
]

const DEFAULT_PASSAGE =
  'The renewal conversation should start ninety days out, not thirty. By the time a customer is thirty days from renewal they have already formed a view, and the only lever left is discount. Teams that open the conversation at ninety days spend it on scope instead of price, and close at a materially higher rate — the difference in our own book was eleven points last year.'

/**
 * On the first line on purpose.
 *
 * The toolbar floats above its selection, which is correct — and means a
 * demo selection on line two covers line one, so the block previews as
 * though it were broken. Anchoring the default to the opening words puts
 * the toolbar in the container's top padding instead of over the prose.
 */
const DEMO_PHRASE = 'The renewal conversation'

export function SelectionAiToolbar({
  passage = DEFAULT_PASSAGE,
  actions = DEFAULT_ACTIONS,
  demoPhrase = DEMO_PHRASE,
  className = '',
}: SelectionAiToolbarProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const passageRef = React.useRef<HTMLParagraphElement>(null)

  const [selection, setSelection] = React.useState<string>(demoPhrase)
  const [position, setPosition] = React.useState<{ top: number; left: number } | null>(null)
  const [focused, setFocused] = React.useState(0)
  const [ran, setRan] = React.useState<string | null>(null)

  /** Place the toolbar over a rect, clamped inside the container. */
  const place = React.useCallback((rect: DOMRect) => {
    const box = containerRef.current?.getBoundingClientRect()
    if (!box) return
    const centre = rect.left + rect.width / 2 - box.left
    setPosition({
      top: rect.top - box.top,
      // Half the toolbar's own width is unknown before it renders, so the
      // clamp uses a fixed inset rather than a measured one — close enough
      // for a bar of this size, and it never leaves the container.
      left: Math.min(Math.max(centre, 130), box.width - 130),
    })
  }, [])

  // The demo selection, measured after layout so the rect is real.
  React.useEffect(() => {
    if (!demoPhrase) return
    const node = passageRef.current?.querySelector<HTMLElement>('[data-demo-span]')
    if (node) place(node.getBoundingClientRect())
  }, [demoPhrase, place])

  React.useEffect(() => {
    function onSelectionChange() {
      const sel = window.getSelection()
      const text = sel?.toString().trim() ?? ''

      // Only ranges that start inside this block. Without the containment
      // check, selecting text anywhere else on the page raises this
      // toolbar — which is exactly what happens on a page of previews.
      const anchor = sel?.anchorNode
      const inside = anchor ? passageRef.current?.contains(anchor) : false

      if (!text || !inside || sel?.isCollapsed) return

      const rect = sel?.getRangeAt(0).getBoundingClientRect()
      if (!rect || rect.width === 0) return

      setSelection(text)
      setRan(null)
      setFocused(0)
      place(rect)
    }

    document.addEventListener('selectionchange', onSelectionChange)
    return () => document.removeEventListener('selectionchange', onSelectionChange)
  }, [place])

  /** Roving focus along the toolbar — the ARIA toolbar pattern. */
  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Escape') {
      setPosition(null)
      passageRef.current?.focus()
      return
    }
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return

    event.preventDefault()
    const next =
      event.key === 'ArrowRight'
        ? (focused + 1) % actions.length
        : (focused - 1 + actions.length) % actions.length
    setFocused(next)
    containerRef.current
      ?.querySelectorAll<HTMLButtonElement>('[data-toolbar-item]')
      [next]?.focus()
  }

  const marked = demoPhrase ? passage.split(demoPhrase) : [passage]

  return (
    <div className={`mx-auto w-full max-w-2xl p-6 ${className}`}>
      {/* Extra head room so a toolbar raised from the first line lands in
          padding rather than on top of the text. */}
      <div
        ref={containerRef}
        className="relative rounded-2xl border border-border/60 bg-card p-6 pt-16"
      >
        <p
          ref={passageRef}
          tabIndex={-1}
          className="text-sm leading-loose outline-none"
        >
          {marked.length === 2 ? (
            <>
              {marked[0]}
              <span data-demo-span className="rounded bg-primary/20 px-0.5">
                {demoPhrase}
              </span>
              {marked[1]}
            </>
          ) : (
            passage
          )}
        </p>

        {/* -- Toolbar ---------------------------------------------------- */}
        {position && selection ? (
          <div
            role="toolbar"
            aria-label={`Actions for the selected text`}
            aria-orientation="horizontal"
            onKeyDown={onKeyDown}
            style={{ top: position.top, left: position.left }}
            className="absolute z-20 flex -translate-x-1/2 -translate-y-[calc(100%+8px)] items-center gap-0.5 rounded-xl border border-border/60 bg-card p-1 shadow-2xl"
          >
            {actions.map((action, i) => {
              const Icon = ACTION_ICON[action.icon]
              return (
                <button
                  key={action.id}
                  type="button"
                  data-toolbar-item
                  tabIndex={i === focused ? 0 : -1}
                  // Without this the press collapses the selection before
                  // the click lands, and the action runs on nothing.
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setRan(action.label)}
                  onFocus={() => setFocused(i)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Icon aria-hidden className="h-3.5 w-3.5" />
                  {action.label}
                </button>
              )
            })}

            <span aria-hidden className="mx-0.5 h-5 w-px bg-border" />

            <button
              type="button"
              data-toolbar-item
              tabIndex={-1}
              onMouseDown={(e) => e.preventDefault()}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <MoreHorizontal aria-hidden className="h-3.5 w-3.5" />
              <span className="sr-only">More actions</span>
            </button>
          </div>
        ) : null}
      </div>

      {/* -- Result ------------------------------------------------------- */}
      <p role="status" className="mt-3 min-h-5 text-xs text-muted-foreground">
        {ran ? (
          <>
            <span className="font-medium text-foreground">{ran}</span> — sent “
            {selection.length > 60 ? `${selection.slice(0, 60)}…` : selection}” to the model.
          </>
        ) : (
          'Select any text above to raise the toolbar. Shift-Arrow works too.'
        )}
      </p>
    </div>
  )
}
