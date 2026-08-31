'use client'

/**
 * <DashboardAlertRules> — thresholds that page someone, listed honestly.
 *
 * The dashboard tier can show you a number going wrong. It cannot tell you
 * that a number went wrong at 3am on Sunday, and every product that reaches
 * a second customer grows alert rules for exactly that reason.
 *
 * THE THING ALERT UIs USUALLY GET WRONG
 *
 * They render a rule as a sentence and a toggle, and omit the two facts
 * that decide whether the rule is any good: how often it has fired, and
 * where it goes. A rule that fired 140 times last month is not a rule, it
 * is noise with a cron attached — and the person who muted the channel it
 * posts to is the only one who knows. Both are on the row here, and a rule
 * over the noise threshold is visibly marked rather than left for someone
 * to notice.
 *
 * MUTED IS NOT OFF
 *
 * The third state is the important one. A rule can be enabled and still
 * deliver nowhere, because its channel was muted somewhere else entirely.
 * Most UIs show that rule as a healthy green toggle. Here it renders as its
 * own state with its own sentence, because "on but going nowhere" is the
 * state that gets an incident missed.
 *
 * NO DESTRUCTIVE DEFAULT. Deleting a rule is behind the row menu rather
 * than a trash icon sitting under the cursor's natural resting place, and
 * disabling is offered first — a rule that is wrong at 3am is usually
 * wrong in its threshold, not in its existence.
 *
 * ACCESSIBILITY: the toggles are real checkboxes with `role="switch"` so
 * their state is announced rather than implied by colour; the firing counts
 * carry a visually hidden qualifier so "140" is read as "140 times in the
 * last 30 days"; and severity is a word as well as a colour.
 */

import * as React from 'react'
import { AlertTriangle, BellOff, Hash, Mail, MoreHorizontal, Webhook } from 'lucide-react'

export type AlertSeverity = 'critical' | 'warning' | 'info'
export type AlertChannel = 'email' | 'slack' | 'webhook'

export interface AlertRule {
  id: string
  metric: string
  comparator: 'above' | 'below'
  threshold: string
  /** Window the threshold is evaluated over, e.g. "5 minutes". */
  window: string
  severity: AlertSeverity
  channel: AlertChannel
  channelTarget: string
  enabled: boolean
  /** True when the destination is muted elsewhere — see the header. */
  channelMuted?: boolean
  /** Times this rule fired in the last 30 days. */
  firedCount: number
}

export interface DashboardAlertRulesProps {
  rules?: AlertRule[]
  /** Firings above which a rule is called out as noisy. */
  noisyThreshold?: number
  className?: string
}

const DEFAULT_RULES: AlertRule[] = [
  {
    id: 'error-rate',
    metric: 'API error rate',
    comparator: 'above',
    threshold: '2%',
    window: '5 minutes',
    severity: 'critical',
    channel: 'slack',
    channelTarget: '#incidents',
    enabled: true,
    firedCount: 3,
  },
  {
    id: 'p95',
    metric: 'p95 latency',
    comparator: 'above',
    threshold: '800ms',
    window: '15 minutes',
    severity: 'warning',
    channel: 'slack',
    channelTarget: '#platform-alerts',
    enabled: true,
    channelMuted: true,
    firedCount: 27,
  },
  {
    id: 'signups',
    metric: 'Signups per hour',
    comparator: 'below',
    threshold: '4',
    window: '1 hour',
    severity: 'warning',
    channel: 'email',
    channelTarget: 'growth@acme.com',
    enabled: true,
    firedCount: 142,
  },
  {
    id: 'queue',
    metric: 'Job queue depth',
    comparator: 'above',
    threshold: '5,000',
    window: '10 minutes',
    severity: 'critical',
    channel: 'webhook',
    channelTarget: 'pagerduty.com/…/v2',
    enabled: true,
    firedCount: 1,
  },
  {
    id: 'storage',
    metric: 'Storage used',
    comparator: 'above',
    threshold: '85%',
    window: '1 day',
    severity: 'info',
    channel: 'email',
    channelTarget: 'ops@acme.com',
    enabled: false,
    firedCount: 0,
  },
]

const SEVERITY_STYLES: Record<AlertSeverity, string> = {
  critical: 'bg-destructive/10 text-destructive',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  info: 'bg-muted text-muted-foreground',
}

const CHANNEL_ICON: Record<AlertChannel, typeof Mail> = {
  email: Mail,
  slack: Hash,
  webhook: Webhook,
}

export function DashboardAlertRules({
  rules = DEFAULT_RULES,
  noisyThreshold = 30,
  className = '',
}: DashboardAlertRulesProps) {
  const [state, setState] = React.useState(rules)

  const toggle = (id: string) =>
    setState((current) =>
      current.map((rule) => (rule.id === id ? { ...rule, enabled: !rule.enabled } : rule)),
    )

  const active = state.filter((rule) => rule.enabled).length
  const undelivered = state.filter((rule) => rule.enabled && rule.channelMuted).length

  return (
    <section
      className={`rounded-2xl border border-border bg-card text-card-foreground ${className}`}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5 sm:p-6">
        <div>
          <h2 className="text-base font-semibold">Alert rules</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {active} of {state.length} active
            {undelivered > 0 ? (
              <>
                {' · '}
                <span className="font-medium text-amber-600 dark:text-amber-400">
                  {undelivered} delivering nowhere
                </span>
              </>
            ) : null}
          </p>
        </div>
        <button
          type="button"
          className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          New rule
        </button>
      </header>

      <ul className="divide-y divide-border">
        {state.map((rule) => {
          const ChannelIcon = CHANNEL_ICON[rule.channel]
          const noisy = rule.firedCount >= noisyThreshold
          const dark = rule.enabled && rule.channelMuted

          return (
            <li key={rule.id} className="flex flex-wrap items-start gap-4 p-5 sm:p-6">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${SEVERITY_STYLES[rule.severity]}`}
                  >
                    {rule.severity}
                  </span>
                  <h3 className="text-sm font-semibold">{rule.metric}</h3>
                </div>

                {/* The rule as a sentence — the form people actually verify. */}
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Alert when {rule.metric} stays{' '}
                  <span className="font-medium text-foreground">
                    {rule.comparator} {rule.threshold}
                  </span>{' '}
                  for {rule.window}.
                </p>

                <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <ChannelIcon aria-hidden className="h-3.5 w-3.5" />
                    {rule.channelTarget}
                  </span>
                  <span className={noisy ? 'font-medium text-amber-600 dark:text-amber-400' : ''}>
                    Fired {rule.firedCount}
                    <span className="sr-only"> times in the last 30 days</span>
                    <span aria-hidden> × / 30d</span>
                  </span>
                </div>

                {/*
                  The two states worth a sentence of their own. Both are
                  conditions a green toggle would otherwise hide.
                */}
                {dark ? (
                  <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-500/10 p-2.5 text-xs text-amber-700 dark:text-amber-300">
                    <BellOff aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    This rule is on, but {rule.channelTarget} is muted — nothing has been
                    delivered since it was muted.
                  </p>
                ) : null}

                {noisy && !dark ? (
                  <p className="mt-3 flex items-start gap-2 rounded-lg bg-muted p-2.5 text-xs text-muted-foreground">
                    <AlertTriangle aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Firing {rule.firedCount} times a month is usually a threshold problem
                    rather than an incident. Consider raising it before muting the channel.
                  </p>
                ) : null}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  role="switch"
                  aria-checked={rule.enabled}
                  aria-label={`${rule.enabled ? 'Disable' : 'Enable'} ${rule.metric} alert`}
                  onClick={() => toggle(rule.id)}
                  className={`relative h-5 w-9 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    rule.enabled ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                >
                  <span
                    aria-hidden
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-background transition-transform ${
                      rule.enabled ? 'translate-x-[18px]' : 'translate-x-[2px]'
                    }`}
                  />
                </button>
                <button
                  type="button"
                  aria-label={`More actions for ${rule.metric}`}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <MoreHorizontal aria-hidden className="h-4 w-4" />
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
