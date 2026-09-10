/**
 * Notifications, from the receiving end.
 *
 * `alerting-page` is the same subject for the person configuring the
 * system. This one is for the person being notified by it, and the split
 * matters because the two want opposite things: one is trying to make sure
 * nothing is missed, the other is trying to make it stop.
 *
 * The inbox is first because it is the thing the user came here from.
 * Someone opens notification settings immediately after being interrupted,
 * with the interruption still on screen, and a settings page that opens on
 * a grid of switches makes them go back and look again at what they were
 * trying to turn off.
 *
 *   inbox        the bell panel, with the unread count in the accessible
 *                name rather than only in a coloured dot
 *   preferences  per-event, per-channel — the coarse control
 *   matrix       every event against every channel, with required rows
 *                locked and *explained*, which is the part that stops the
 *                grid reading as a broken switch
 *   push         the soft ask, before the browser dialog you get one shot at
 *   toasts       the least interruptive channel, and the one people forget
 *                counts as a notification at all
 *
 * The push prompt is fourth and not first, which is the entire argument of
 * that block: asking for the permission at the moment of arrival is how you
 * get denied permanently, and the browser gives no second chance. It
 * belongs after someone has decided they want to be told things.
 */

import * as React from 'react'
import { NotificationInbox } from '@/lib/blocks/sources/notification-inbox'
import { NotificationPreferences } from '@/lib/blocks/sources/notification-preferences'
import { SettingsNotificationMatrix } from '@/lib/blocks/sources/settings-notification-matrix'
import { PushPermissionPrompt } from '@/lib/blocks/sources/push-permission-prompt'
import { ToastStack } from '@/lib/blocks/sources/toast-stack'

export default function NotificationSettingsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-5xl px-6 pb-2 pt-12">
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          What you were just interrupted by, then every control for deciding
          whether it happens again.
        </p>
      </section>

      <NotificationInbox />
      <NotificationPreferences />
      <SettingsNotificationMatrix />

      {/* Asked after the decision, not before it. */}
      <PushPermissionPrompt />
      <ToastStack />
    </main>
  )
}
