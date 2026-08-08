/**
 * The account settings screen — nav, profile, team, keys, danger zone.
 *
 * Ordering here is a safety property, not a style choice. The danger zone
 * goes last, below the fold, after everything a user actually came to do.
 * Putting "Delete workspace" anywhere near "Change your name" is how it
 * gets clicked.
 *
 * All four panels render at once rather than switching on the nav
 * selection. That is deliberate for a template: it shows every panel in one
 * screenshot and lets you delete the ones you do not need. Wire the nav to
 * routes — `/settings/profile`, `/settings/members` — when you adopt it, so
 * each panel gets its own URL and back button.
 */

import * as React from 'react'
import { SettingsNavLayout } from '@/lib/blocks/sources/settings-nav-layout'
import { SettingsProfileForm } from '@/lib/blocks/sources/settings-profile-form'
import { SettingsTeamMembers } from '@/lib/blocks/sources/settings-team-members'
import { SettingsApiKeys } from '@/lib/blocks/sources/settings-api-keys'
import { SettingsDangerZone } from '@/lib/blocks/sources/settings-danger-zone'

export default function SettingsAccountPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SettingsNavLayout>
        <div className="space-y-6">
          <SettingsProfileForm />
          <SettingsTeamMembers />
          <SettingsApiKeys />

          {/* Last, always. */}
          <SettingsDangerZone />
        </div>
      </SettingsNavLayout>
    </main>
  )
}
