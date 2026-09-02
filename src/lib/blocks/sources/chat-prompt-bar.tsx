/**
 * <ChatPromptBar> — the composer, with `@` sources, `/` commands, a model
 * picker and attachment chips.
 *
 * This is the block people underestimate. A textarea and a send button take
 * five minutes; the trigger menus take a day, and this is what they need:
 *
 *  - The menu opens only when the trigger character starts a *token* — after
 *    a space or at position zero. Without that check, typing an email
 *    address opens the mention menu halfway through `you@example.com`, and
 *    every `and/or` opens the command menu.
 *  - The query is the text between the trigger and the caret, so the menu
 *    closes by itself when the user types past a match or backspaces over
 *    the trigger. No separate "is the menu open" state to get out of sync.
 *  - Focus never leaves the textarea. The menu is a `listbox` addressed by
 *    `aria-activedescendant`, the combobox pattern — moving real focus into
 *    the list would stop the user typing to filter it.
 *  - Arrow keys, Enter and Tab are intercepted only while the menu is open,
 *    and Escape closes the menu rather than clearing the draft.
 *  - Enter sends, Shift-Enter breaks the line, and `isComposing` is checked
 *    so committing an IME candidate does not send a half-typed message.
 *
 * The textarea grows with its content by resetting `height` to `auto` before
 * reading `scrollHeight` — skip the reset and it only ever grows, never
 * shrinks back when the draft is deleted.
 */

'use client'

import * as React from 'react'
import {
  ArrowUp,
  AtSign,
  ChevronDown,
  Database,
  FileText,
  Globe,
  Mic,
  Paperclip,
  Slash,
  Sparkles,
  X,
} from 'lucide-react'

export interface PromptSource {
  id: string
  label: string
  hint?: string
  kind?: 'file' | 'table' | 'web'
}

export interface PromptCommand {
  id: string
  label: string
  hint?: string
}

export interface ChatPromptBarProps {
  placeholder?: string
  sources?: PromptSource[]
  commands?: PromptCommand[]
  models?: string[]
  /** Chips shown above the field, as if already attached. */
  attachments?: string[]
  className?: string
}

const DEFAULT_SOURCES: PromptSource[] = [
  { id: 'q3-report', label: 'Q3-forecast.xlsx', hint: 'Sheet · 3 tabs', kind: 'file' },
  { id: 'orders', label: 'warehouse.orders', hint: 'Table · 2.1M rows', kind: 'table' },
  { id: 'accounts', label: 'warehouse.accounts', hint: 'Table · 48k rows', kind: 'table' },
  { id: 'handbook', label: 'Pricing handbook', hint: 'Doc · updated Tuesday', kind: 'file' },
  { id: 'status', label: 'status.acme.com', hint: 'Web · live', kind: 'web' },
]

const DEFAULT_COMMANDS: PromptCommand[] = [
  { id: 'summarise', label: '/summarise', hint: 'Condense the attached sources' },
  { id: 'chart', label: '/chart', hint: 'Plot the last result' },
  { id: 'compare', label: '/compare', hint: 'Diff two periods' },
  { id: 'explain', label: '/explain', hint: 'Walk through the reasoning' },
]

const DEFAULT_MODELS = ['Fast', 'Balanced', 'Deep reasoning']

const KIND_ICON = {
  file: FileText,
  table: Database,
  web: Globe,
} as const

export function ChatPromptBar({
  placeholder = 'Ask anything — @ for sources, / for commands',
  sources = DEFAULT_SOURCES,
  commands = DEFAULT_COMMANDS,
  models = DEFAULT_MODELS,
  attachments = ['Q3-forecast.xlsx'],
  className = '',
}: ChatPromptBarProps) {
  const [draft, setDraft] = React.useState('')
  const [caret, setCaret] = React.useState(0)
  const [highlight, setHighlight] = React.useState(0)
  /** Trigger position the user pressed Escape on, so it stays closed. */
  const [dismissed, setDismissed] = React.useState<number | null>(null)
  const [model, setModel] = React.useState(models[1] ?? models[0] ?? '')
  const [modelOpen, setModelOpen] = React.useState(false)
  const [chips, setChips] = React.useState(attachments)
  const [dictating, setDictating] = React.useState(false)

  const fieldRef = React.useRef<HTMLTextAreaElement>(null)

  /**
   * The active trigger, derived from the draft and caret rather than stored.
   *
   * Deriving it is what makes the menu close on its own: backspace over the
   * `@` and there is no trigger to find, so there is no state left behind
   * claiming the menu is open.
   */
  const trigger = React.useMemo(() => {
    const before = draft.slice(0, caret)
    const match = /(^|\s)([@/])([^\s@/]*)$/.exec(before)
    if (!match) return null
    return { char: match[2] as '@' | '/', query: match[3], start: caret - match[3].length - 1 }
  }, [draft, caret])

  const results = React.useMemo(() => {
    if (!trigger) return []
    const term = trigger.query.toLowerCase()
    const pool =
      trigger.char === '@'
        ? sources.map((s) => ({ id: s.id, label: s.label, hint: s.hint, kind: s.kind }))
        : commands.map((c) => ({ id: c.id, label: c.label, hint: c.hint, kind: undefined }))
    return pool.filter((item) => item.label.toLowerCase().includes(term))
  }, [trigger, sources, commands])

  const open = trigger !== null && results.length > 0 && trigger.start !== dismissed

  // A highlight left at index 4 after the list filters down to two selects
  // the wrong row on Enter.
  React.useEffect(() => {
    setHighlight(0)
  }, [trigger?.char, trigger?.query])

  function grow(el: HTMLTextAreaElement) {
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  function accept(index: number) {
    const item = results[index]
    if (!item || !trigger) return

    if (trigger.char === '@') {
      // Sources become chips, not text — the model gets a reference and the
      // user gets something they can remove without editing their sentence.
      setChips((list) => (list.includes(item.label) ? list : [...list, item.label]))
    }

    const inserted = trigger.char === '@' ? '' : `${item.label} `
    const next = draft.slice(0, trigger.start) + inserted + draft.slice(caret)
    setDraft(next)

    const position = trigger.start + inserted.length
    setCaret(position)
    requestAnimationFrame(() => {
      const el = fieldRef.current
      if (!el) return
      el.focus()
      el.setSelectionRange(position, position)
      grow(el)
    })
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (open) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setHighlight((i) => (i + 1) % results.length)
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setHighlight((i) => (i - 1 + results.length) % results.length)
        return
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault()
        accept(highlight)
        return
      }
      if (event.key === 'Escape') {
        // Dismiss this one trigger. Escape must never clear the draft, and
        // it must not simply toggle a flag either — starting a *new* `@`
        // later has to reopen the menu without any extra bookkeeping, which
        // recording the dismissed position gives for free.
        event.preventDefault()
        setDismissed(trigger.start)
        return
      }
    }

    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      setDraft('')
      requestAnimationFrame(() => {
        if (fieldRef.current) grow(fieldRef.current)
      })
    }
  }

  /** Keep the derived trigger in step with every caret move, not just typing. */
  function syncCaret(event: React.SyntheticEvent<HTMLTextAreaElement>) {
    setCaret(event.currentTarget.selectionStart ?? 0)
  }

  const listId = React.useId()

  return (
    <div className={`mx-auto w-full max-w-2xl p-6 ${className}`}>
      <div className="relative">
        {/* -- Trigger menu, above the field so it never covers the draft -- */}
        {open ? (
          <div
            id={listId}
            role="listbox"
            aria-label={trigger?.char === '@' ? 'Sources' : 'Commands'}
            className="absolute bottom-full left-0 z-20 mb-2 max-h-60 w-full overflow-y-auto rounded-xl border border-border/60 bg-card p-1.5 shadow-2xl"
          >
            <p className="px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {trigger?.char === '@' ? 'Attach a source' : 'Run a command'}
            </p>

            {results.map((item, i) => {
              const Icon = item.kind ? KIND_ICON[item.kind] : Slash
              const active = i === highlight

              return (
                <div
                  key={item.id}
                  id={`${listId}-${item.id}`}
                  role="option"
                  aria-selected={active}
                  onMouseEnter={() => setHighlight(i)}
                  // Mouse down, not click: click fires after blur, and blur
                  // has already torn the menu down.
                  onMouseDown={(e) => {
                    e.preventDefault()
                    accept(i)
                  }}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm ${
                    active ? 'bg-primary/10 text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  <Icon aria-hidden className={`h-4 w-4 shrink-0 ${active ? 'text-primary' : ''}`} />
                  <span className="truncate font-medium text-foreground">{item.label}</span>
                  {item.hint ? (
                    <span className="ms-auto shrink-0 truncate text-xs text-muted-foreground">
                      {item.hint}
                    </span>
                  ) : null}
                </div>
              )
            })}
          </div>
        ) : null}

        <div className="rounded-2xl border border-border/60 bg-card p-2 shadow-sm focus-within:ring-2 focus-within:ring-ring">
          {/* -- Attachment chips ------------------------------------- */}
          {chips.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5 px-1.5 pb-2 pt-1">
              {chips.map((chip) => (
                <li key={chip}>
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/60 py-1 ps-2 pe-1 text-xs">
                    <FileText aria-hidden className="h-3 w-3 text-muted-foreground" />
                    {chip}
                    <button
                      type="button"
                      onClick={() => setChips((list) => list.filter((c) => c !== chip))}
                      className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <X aria-hidden className="h-3 w-3" />
                      <span className="sr-only">Remove {chip}</span>
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          <textarea
            ref={fieldRef}
            rows={1}
            value={draft}
            role="combobox"
            aria-expanded={open}
            aria-controls={open ? listId : undefined}
            aria-activedescendant={open ? `${listId}-${results[highlight]?.id}` : undefined}
            aria-autocomplete="list"
            aria-label={placeholder}
            placeholder={placeholder}
            onChange={(e) => {
              setDraft(e.target.value)
              setCaret(e.target.selectionStart ?? 0)
              grow(e.target)
            }}
            onKeyUp={syncCaret}
            onClick={syncCaret}
            onKeyDown={onKeyDown}
            className="max-h-40 w-full resize-none bg-transparent px-2 py-1.5 text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
          />

          {/* -- Toolbar ---------------------------------------------- */}
          <div className="flex items-center gap-1 px-1 pt-1">
            <ToolbarButton icon={<Paperclip className="h-4 w-4" />} label="Attach a file" />
            <ToolbarButton
              icon={<AtSign className="h-4 w-4" />}
              label="Mention a source"
              onClick={() => {
                const next = `${draft}${draft.endsWith(' ') || draft === '' ? '' : ' '}@`
                setDraft(next)
                setCaret(next.length)
                fieldRef.current?.focus()
              }}
            />

            {/* -- Model picker -------------------------------------- */}
            <div className="relative">
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={modelOpen}
                // Same shape as the combobox above: only while the list is
                // mounted, so the IDREF always resolves.
                aria-controls={modelOpen ? `${listId}-models` : undefined}
                onClick={() => setModelOpen((v) => !v)}
                onBlur={() => setModelOpen(false)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Sparkles aria-hidden className="h-3.5 w-3.5" />
                {model}
                <ChevronDown aria-hidden className="h-3 w-3" />
              </button>

              {modelOpen ? (
                <ul
                  id={`${listId}-models`}
                  role="listbox"
                  aria-label="Model"
                  className="absolute bottom-full left-0 z-20 mb-1.5 w-44 rounded-xl border border-border/60 bg-card p-1 shadow-2xl"
                >
                  {models.map((name) => (
                    <li key={name}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={name === model}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          setModel(name)
                          setModelOpen(false)
                        }}
                        className={`w-full rounded-lg px-2.5 py-1.5 text-start text-xs transition-colors hover:bg-muted ${
                          name === model ? 'font-semibold text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        {name}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="ms-auto flex items-center gap-1">
              <button
                type="button"
                aria-pressed={dictating}
                onClick={() => setDictating((v) => !v)}
                className={`rounded-lg p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  dictating
                    ? 'bg-rose-500/10 text-rose-500'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Mic aria-hidden className="h-4 w-4" />
                <span className="sr-only">{dictating ? 'Stop dictation' : 'Dictate'}</span>
              </button>

              <button
                type="button"
                disabled={draft.trim().length === 0}
                onClick={() => setDraft('')}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <ArrowUp aria-hidden className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-2 px-1 text-center text-xs text-muted-foreground">
        <kbd className="rounded border border-border/60 bg-muted px-1 py-0.5 font-mono">Enter</kbd>{' '}
        to send ·{' '}
        <kbd className="rounded border border-border/60 bg-muted px-1 py-0.5 font-mono">
          Shift↵
        </kbd>{' '}
        for a new line
      </p>
    </div>
  )
}

function ToolbarButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span aria-hidden>{icon}</span>
      <span className="sr-only">{label}</span>
    </button>
  )
}
