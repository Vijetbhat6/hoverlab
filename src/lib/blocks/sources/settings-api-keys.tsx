'use client'

/**
 * <SettingsApiKeys> — issue, reveal, copy and revoke API keys.
 *
 * The security model is the design here:
 *
 *  - Stored keys are shown masked, with only the prefix and last four
 *    characters. A settings page that renders live secrets in full puts
 *    them into screen shares, screenshots and shoulder-surfing range.
 *  - A newly created key is shown in full exactly once, in a panel that
 *    says so. That is the only moment the plaintext should exist in the UI,
 *    and users need to be told they cannot come back for it.
 *  - Revoke is immediate and irreversible, so it asks first.
 *
 * `navigator.clipboard` is guarded — it is undefined on insecure origins,
 * and an unguarded call throws where the page is served over plain HTTP.
 */

import * as React from 'react'
import { Copy, Check, Trash2, Plus, KeyRound, TriangleAlert } from 'lucide-react'

export interface ApiKey {
  id: string
  name: string
  /** Visible prefix, e.g. `sk_live_`. */
  prefix: string
  last4: string
  created: string
  lastUsed?: string
}

export interface SettingsApiKeysProps {
  keys?: ApiKey[]
  onCreate?: (name: string) => Promise<string>
  onRevoke?: (id: string) => void
  className?: string
}

const DEFAULT_KEYS: ApiKey[] = [
  {
    id: '1',
    name: 'Production server',
    prefix: 'sk_live_',
    last4: '4f2a',
    created: '12 Mar 2026',
    lastUsed: '2 hours ago',
  },
  {
    id: '2',
    name: 'CI pipeline',
    prefix: 'sk_live_',
    last4: '9c1e',
    created: '3 Jun 2026',
    lastUsed: 'Yesterday',
  },
  {
    id: '3',
    name: 'Local development',
    prefix: 'sk_test_',
    last4: 'b7d0',
    created: '28 Jul 2026',
  },
]

export function SettingsApiKeys({
  keys: initialKeys = DEFAULT_KEYS,
  onCreate,
  onRevoke,
  className = '',
}: SettingsApiKeysProps) {
  const [keys, setKeys] = React.useState(initialKeys)
  const [freshKey, setFreshKey] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)
  const [confirmingId, setConfirmingId] = React.useState<string | null>(null)

  async function copy(value: string) {
    // Undefined on insecure origins — never assume it is there.
    if (!navigator.clipboard) return
    await navigator.clipboard.writeText(value)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  async function create() {
    const name = `Key ${keys.length + 1}`
    const secret = (await onCreate?.(name)) ?? `sk_live_${Math.random().toString(36).slice(2, 10)}fake`
    setFreshKey(secret)
    setKeys((prev) => [
      ...prev,
      {
        id: String(prev.length + 1),
        name,
        prefix: secret.slice(0, 8),
        last4: secret.slice(-4),
        created: 'Just now',
      },
    ])
  }

  function revoke(id: string) {
    setKeys((prev) => prev.filter((k) => k.id !== id))
    setConfirmingId(null)
    onRevoke?.(id)
  }

  return (
    <div className={`overflow-hidden rounded-2xl border border-border/60 bg-card/60 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-6 py-4">
        <div>
          <h2 className="font-semibold tracking-tight">API keys</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Keys carry full account access. Treat them like passwords.
          </p>
        </div>

        <button
          type="button"
          onClick={create}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus aria-hidden className="h-4 w-4" />
          Create key
        </button>
      </div>

      {/* The one and only time the plaintext is shown. */}
      {freshKey ? (
        <div className="border-b border-border/60 bg-amber-500/5 px-6 py-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
            <TriangleAlert aria-hidden className="h-4 w-4" />
            Copy this key now — it will not be shown again
          </p>

          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded-xl border border-border/60 bg-background px-3 py-2 font-mono text-sm">
              {freshKey}
            </code>
            <button
              type="button"
              onClick={() => copy(freshKey)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              {copied ? (
                <Check aria-hidden className="h-4 w-4 text-emerald-500" />
              ) : (
                <Copy aria-hidden className="h-4 w-4" />
              )}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setFreshKey(null)}
            className="mt-3 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            I have saved it — dismiss
          </button>
        </div>
      ) : null}

      <ul className="divide-y divide-border/40">
        {keys.map((key) => (
          <li key={key.id} className="flex flex-wrap items-center gap-3 px-6 py-3.5">
            <span
              aria-hidden
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
            >
              <KeyRound className="h-4 w-4" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{key.name}</p>
              <p className="font-mono text-xs text-muted-foreground">
                {key.prefix}
                {'•'.repeat(12)}
                {key.last4}
              </p>
            </div>

            <div className="text-end text-xs text-muted-foreground">
              <p>Created {key.created}</p>
              <p>{key.lastUsed ? `Last used ${key.lastUsed}` : 'Never used'}</p>
            </div>

            {confirmingId === key.id ? (
              <span className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => revoke(key.id)}
                  className="rounded-lg bg-destructive px-2.5 py-1.5 text-xs font-semibold text-destructive-foreground"
                >
                  Revoke
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingId(null)}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingId(key.id)}
                aria-label={`Revoke ${key.name}`}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 aria-hidden className="h-4 w-4" />
              </button>
            )}
          </li>
        ))}

        {keys.length === 0 ? (
          <li className="px-6 py-10 text-center text-sm text-muted-foreground">
            No API keys yet.
          </li>
        ) : null}
      </ul>
    </div>
  )
}
