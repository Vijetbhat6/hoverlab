'use client'

/**
 * <AiSlashMenu> — the "/" menu inside the editor, without stealing the caret.
 *
 * Inline AI Actions had the ghost suggestion, the selection toolbar, the
 * insight cards and the inspector — all of them things that appear *after*
 * you have written something. The slash menu is the opposite end: it is
 * how a person asks for an action before there is any text to act on, and
 * it is the surface a command palette cannot be. A palette is a modal over
 * the document; this one has to leave the caret where it was, because the
 * caret is the argument.
 *
 * THE ONE THING THIS GETS RIGHT THAT MOST DO NOT
 *
 * Focus never moves. The list is not focusable; the textarea keeps focus
 * the whole time and points at the highlighted option with
 * `aria-activedescendant`. Arrow keys are intercepted only while the menu
 * is open, so the moment it closes they go back to moving the caret. Every
 * slash menu that puts DOM focus in the popup breaks typing: the next
 * character lands in nothing, and a screen reader loses the editing
 * context it just announced.
 *
 * THE QUERY IS REAL TEXT, SO CLOSING HAS TO CLEAN UP
 *
 * "/rew" is in the document. It is not a floating input, however much it
 * behaves like one. So Escape deletes the trigger and its query rather
 * than just hiding the popup — otherwise the person is left with a stray
 * "/rew" they have to notice and backspace, which is the single most
 * common bug in shipped implementations. Selecting an item replaces the
 * same span.
 *
 * IT SAYS WHAT WILL HAPPEN TO WHAT
 *
 * Each row names its target: this paragraph, the whole document, the
 * selection. An action list that reads "Improve writing / Summarise /
 * Translate" is only unambiguous to the person who built it.
 *
 * A NOTE ON POSITION: this anchors under the editor. A production build
 * anchors to the caret rectangle, which in a textarea means measuring a
 * mirror element — a hidden div with the same font, padding and width,
 * holding the text up to the caret — and reading the offset of a span at
 * its end. That is a real technique, not a shortcut; contenteditable gets
 * it free from `getClientRects()`, and the choice between the two is the
 * actual decision behind this component.
 *
 * ACCESSIBILITY: `role="combobox"` on the textarea with `aria-expanded`
 * and `aria-controls`, `role="listbox"` on the popup and `role="option"`
 * with `aria-selected` on the rows. Hovering does not change the active
 * option — pointer and keyboard fighting over one highlight is how people
 * run an action they did not choose.
 */

import * as React from 'react'
import {
  CornerDownLeft,
  FileText,
  Languages,
  ListTree,
  Sparkles,
  Table,
  Wand2,
} from 'lucide-react'

export interface SlashAction {
  id: string
  label: string
  /** What it acts on — named per row, not assumed. */
  target: string
  keywords: string
  icon: React.ComponentType<{ className?: string }>
  /** Text it drops at the caret, so the demo does something real. */
  result: string
}

export interface AiSlashMenuProps {
  actions?: SlashAction[]
  initialText?: string
  className?: string
}

const DEFAULT_ACTIONS: SlashAction[] = [
  {
    id: 'rewrite',
    label: 'Rewrite',
    target: 'this paragraph',
    keywords: 'rewrite improve polish edit',
    icon: Wand2,
    result:
      'Support tickets are answered within one business day, and within four hours on a paid plan.',
  },
  {
    id: 'summarise',
    label: 'Summarise',
    target: 'the whole document',
    keywords: 'summarise summary tldr shorten',
    icon: ListTree,
    result:
      'In short: one-day replies as standard, four hours on paid plans, no queue after hours.',
  },
  {
    id: 'continue',
    label: 'Continue writing',
    target: 'from the caret',
    keywords: 'continue write more draft',
    icon: Sparkles,
    result:
      ' Outside those hours the queue is held rather than auto-answered, so nobody gets a reply written by a robot at 3am.',
  },
  {
    id: 'translate',
    label: 'Translate',
    target: 'this paragraph into French',
    keywords: 'translate french language',
    icon: Languages,
    result:
      'Les demandes d’assistance reçoivent une réponse sous un jour ouvré.',
  },
  {
    id: 'table',
    label: 'Turn into a table',
    target: 'the list above',
    keywords: 'table grid rows columns convert',
    icon: Table,
    result: '| Plan | First reply |\n| --- | --- |\n| Free | 1 business day |\n| Paid | 4 hours |',
  },
  {
    id: 'brief',
    label: 'Draft a brief',
    target: 'a new section below',
    keywords: 'brief outline plan section',
    icon: FileText,
    result: '## Support commitments\n\n- First reply targets\n- Out-of-hours policy\n- Escalation path',
  },
]

const LISTBOX_ID = 'slash-menu-listbox'

export function AiSlashMenu({
  actions = DEFAULT_ACTIONS,
  /*
    Ends with the trigger on purpose, so the block opens showing the thing
    it is about. A demo of a slash menu whose slash menu is shut is a demo
    of a textarea.
  */
  initialText = 'Our support team replies to every ticket. /',
  className = '',
}: AiSlashMenuProps) {
  const [text, setText] = React.useState(initialText)
  const [triggerAt, setTriggerAt] = React.useState<number | null>(() =>
    initialText.endsWith('/') ? initialText.length - 1 : null,
  )
  const [active, setActive] = React.useState(0)
  const editor = React.useRef<HTMLTextAreaElement>(null)

  /* The query is the document text between the "/" and the caret. */
  const query = triggerAt === null ? '' : text.slice(triggerAt + 1)
  const open = triggerAt !== null
  const matches = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return actions
    return actions.filter(
      (a) => a.label.toLowerCase().includes(q) || a.keywords.includes(q),
    )
  }, [actions, query])

  React.useEffect(() => setActive(0), [query])

  const closeAndClean = () => {
    /* Escape removes the trigger it inserted — see the note above. */
    if (triggerAt !== null) setText((t) => t.slice(0, triggerAt))
    setTriggerAt(null)
    editor.current?.focus()
  }

  const apply = (action: SlashAction) => {
    setText((t) => (triggerAt === null ? t : t.slice(0, triggerAt) + action.result))
    setTriggerAt(null)
    editor.current?.focus()
  }

  const onChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = event.target.value
    const caret = event.target.selectionStart
    setText(next)
    if (triggerAt === null) {
      /* Only at the start of a word — "and/or" must not open a menu. */
      const typed = next[caret - 1]
      const before = next[caret - 2]
      if (typed === '/' && (before === undefined || before === ' ' || before === '\n')) {
        setTriggerAt(caret - 1)
      }
      return
    }
    if (caret <= triggerAt || next[triggerAt] !== '/') setTriggerAt(null)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    /* Arrow keys belong to the caret unless the menu is open. */
    if (!open) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((i) => (matches.length ? (i + 1) % matches.length : 0))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((i) => (matches.length ? (i - 1 + matches.length) % matches.length : 0))
    } else if (event.key === 'Enter' && matches[active]) {
      event.preventDefault()
      apply(matches[active])
    } else if (event.key === 'Escape') {
      event.preventDefault()
      closeAndClean()
    }
  }

  return (
    /*
      Deep bottom padding, not a stray value: the popup is absolutely
      positioned, so it adds nothing to the section's height, and any
      container with `overflow: hidden` — including the preview frame on
      this site — clips whatever hangs past it. Reserve the room where the
      menu opens.
    */
    <section className={`mx-auto w-full max-w-2xl px-4 pb-36 pt-16 sm:px-6 ${className}`}>
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Release notes — draft</h2>
          <p className="text-xs text-muted-foreground">
            Type <kbd className="rounded border border-border bg-muted px-1 font-mono">/</kbd>{' '}
            for actions
          </p>
        </div>

        <div className="relative mt-3">
          <label htmlFor="slash-editor" className="sr-only">
            Document body
          </label>
          <textarea
            id="slash-editor"
            ref={editor}
            value={text}
            onChange={onChange}
            onKeyDown={onKeyDown}
            rows={3}
            role="combobox"
            aria-expanded={open}
            aria-controls={LISTBOX_ID}
            aria-autocomplete="list"
            aria-activedescendant={
              open && matches[active] ? `slash-option-${matches[active].id}` : undefined
            }
            className="w-full resize-y rounded-xl border border-field bg-background px-3 py-2.5 font-sans text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            placeholder="Write something, or press / to ask for help"
          />

          {open ? (
            <div
              /*
                Not focusable, and no tabindex anywhere in here. The caret
                stays in the textarea for the whole life of this popup.
              */
              id={LISTBOX_ID}
              role="listbox"
              aria-label="AI actions"
              className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-popover p-1 shadow-lg"
            >
              {matches.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Nothing matches &ldquo;{query}&rdquo;. Press Escape to keep typing
                  normally.
                </p>
              ) : (
                matches.map((action, i) => {
                  const Icon = action.icon
                  const isActive = i === active
                  return (
                    <div
                      key={action.id}
                      id={`slash-option-${action.id}`}
                      role="option"
                      aria-selected={isActive}
                      /*
                        Click applies; hover deliberately does not move the
                        highlight. Pointer and keyboard fighting over one
                        selection runs actions nobody chose.
                      */
                      onMouseDown={(event) => {
                        event.preventDefault()
                        apply(action)
                      }}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 ${
                        isActive ? 'bg-accent text-accent-foreground' : 'text-foreground'
                      }`}
                    >
                      <span
                        aria-hidden
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {action.label}
                        </span>
                        {/* Names its target, so no row is ambiguous. */}
                        <span className="block truncate text-xs text-muted-foreground">
                          {action.target}
                        </span>
                      </span>
                      {isActive ? (
                        <CornerDownLeft
                          aria-hidden
                          className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                        />
                      ) : null}
                    </div>
                  )
                })
              )}
            </div>
          ) : null}
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          {open
            ? 'Escape removes the slash and anything typed after it — it does not leave you to clean up.'
            : 'Nothing has been sent anywhere yet. Actions run on the paragraph the caret is in.'}
        </p>
      </div>
    </section>
  )
}
