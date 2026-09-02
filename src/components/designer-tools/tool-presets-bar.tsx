'use client'

/**
 * Save / restore bar for a designer tool.
 *
 * Placed under a tool's controls, not above them. The order matters: this
 * asks for an account, and asking before someone has made anything is a
 * toll booth on a road that is supposed to be free. After they have tuned a
 * scale for ten minutes, "keep this" is an offer rather than a demand.
 *
 * Signed out, it does not hide and it does not nag — it says what an account
 * would add, once, in the place the button would be. A hidden affordance
 * teaches nobody that the feature exists, and a modal teaches them to close
 * modals.
 *
 * It also carries undo, redo and the share link, in both states, because
 * none of the three is something an account buys. Putting "copy link" only
 * in the signed-in branch would turn the one action whose whole purpose is
 * to reach someone who has never been here into a reason to sign up — the
 * exact toll booth the paragraph above rejects, and undoing a slider is not
 * a premium feature in any world.
 *
 * They live in this component for a duller reason than they look: it is the
 * one thing every tool already mounts. Undo and share are properties of a
 * tool's state, `useToolState` owns that state, and this bar is the only
 * place all thirty-odd tools already hand that hook to something. Wiring
 * either of them here made them universal without touching a single tool.
 */

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bookmark, Check, Loader2, Redo2, Trash2, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ShareLinkButton } from '@/components/designer-tools/share-link'
import { cn } from '@/lib/utils'
import type { ToolPreset } from '@/lib/tool-presets'
import type { ToolPresetsApi } from '@/hooks/use-tool-state'

interface ToolPresetsBarProps {
  /**
   * The tool's state hook, passed whole.
   *
   * Typed as the preset half only — see `ToolPresetsApi`. Nothing here reads
   * the working state, so a tool's own state type never has to travel.
   */
  tool: ToolPresetsApi
  /** What one saved thing is called here — "token set", "scale", "pairing". */
  noun: string
  className?: string
}

export function ToolPresetsBar({ tool, noun, className }: ToolPresetsBarProps) {
  const pathname = usePathname() ?? '/tools'
  const [name, setName] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [justSaved, setJustSaved] = React.useState(false)

  const {
    canSave,
    presets,
    loadingPresets,
    presetError,
    savePreset,
    applyPreset,
    deletePreset,
    shareUrl,
    undo,
    redo,
    canUndo,
    canRedo,
  } = tool

  /*
    Undo, redo and share, in that order, in both branches below.

    They are grouped because they are the three things you do to a state
    rather than with it, and none of them is gated on an account. The
    shortcut is named on the tooltip rather than printed beside the icon:
    ⌘Z already works everywhere on the page, and the button is here for the
    people who would never have tried it.
  */
  const stateActions = (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={undo}
        disabled={!canUndo}
        title="Undo (⌘Z)"
      >
        <Undo2 aria-hidden className="h-3.5 w-3.5" />
        <span className="sr-only">Undo</span>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={redo}
        disabled={!canRedo}
        title="Redo (⇧⌘Z)"
      >
        <Redo2 aria-hidden className="h-3.5 w-3.5" />
        <span className="sr-only">Redo</span>
      </Button>
      <ShareLinkButton url={shareUrl} className="h-8 gap-1.5" />
    </>
  )

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const saved = await savePreset(name)
    setSaving(false)
    if (saved) {
      setName('')
      setJustSaved(true)
      window.setTimeout(() => setJustSaved(false), 2000)
    }
  }

  if (!canSave) {
    return (
      <div
        className={cn(
          'rounded-2xl border border-border/60 bg-card/60 p-4 text-sm',
          className,
        )}
      >
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">Keep this {noun}.</span>{' '}
          This browser remembers what you last had open. A free account
          remembers the ones you name, on every machine you use.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button asChild size="sm">
            {/*
              Back to this exact tool afterwards. Signing up and landing on
              the library would lose the thing they signed up to keep.
            */}
            <Link href={`/signup?redirect=${encodeURIComponent(pathname)}`}>
              Create a free account
            </Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link href={`/login?redirect=${encodeURIComponent(pathname)}`}>Sign in</Link>
          </Button>
          {stateActions}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn('rounded-2xl border border-border/60 bg-card/60 p-4', className)}
    >
      <form onSubmit={handleSave} className="flex flex-wrap items-center gap-2">
        <label htmlFor="preset-name" className="sr-only">
          Name this {noun}
        </label>
        <Input
          id="preset-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`Name this ${noun}`}
          className="h-9 flex-1 min-w-[12rem]"
          aria-describedby={presetError ? 'preset-error' : undefined}
        />
        <Button type="submit" size="sm" disabled={saving || !name.trim()}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : justSaved ? (
            <Check className="h-4 w-4" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )}
          {justSaved ? 'Saved' : 'Save'}
        </Button>
        {/*
          Inside the form element but not submit buttons: every one of them
          sets `type="button"`, so Enter in the name field still means
          "save" and not "undo". They sit here rather than in a row of
          their own so the verbs for "I am done tuning this" are adjacent.
        */}
        {stateActions}
      </form>

      {presetError ? (
        <p id="preset-error" role="alert" className="mt-2 text-sm text-destructive">
          {presetError}
        </p>
      ) : null}

      {loadingPresets ? (
        <p className="mt-3 text-sm text-muted-foreground">Loading your {noun}s…</p>
      ) : presets.length ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {presets.map((preset: ToolPreset) => (
            <li key={preset.id} className="flex items-center rounded-lg border border-border/60">
              <button
                type="button"
                onClick={() => applyPreset(preset)}
                className="rounded-l-lg px-3 py-1.5 text-sm hover:bg-muted"
              >
                {preset.name}
              </button>
              <button
                type="button"
                onClick={() => void deletePreset(preset.id)}
                aria-label={`Delete ${preset.name}`}
                className="rounded-r-lg border-l border-border/60 px-2 py-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
              >
                <Trash2 aria-hidden className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          Nothing saved yet. Name what you have and it will be here on every
          machine you sign in from.
        </p>
      )}
    </div>
  )
}
