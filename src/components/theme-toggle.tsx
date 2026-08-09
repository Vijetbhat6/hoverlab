'use client'

/**
 * Theme control — light / dark / system.
 *
 * This was a two-state flip: `setTheme(theme === 'dark' ? 'light' : 'dark')`.
 * Two problems came out of that. The OS preference was unreachable — once
 * anyone touched the button, `theme` was pinned to a concrete value forever
 * and a machine that switches to dark at sunset stopped being followed. And
 * the button read the wrong state: it branched on `theme`, which is the
 * literal stored string, so while the site was on "system" it compared
 * `'system' === 'dark'`, fell to the else, and showed the moon on a page
 * that was already dark.
 *
 * A three-item menu instead of a three-state cycle because cycling makes the
 * user click through a state they don't want to reach the one they do, and
 * gives no way to see which is active without watching the page change.
 * `resolvedTheme` drives the icon, so the trigger always reflects what is
 * actually on screen rather than what is stored.
 */

import * as React from 'react'
import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // next-themes can't know the stored/OS theme until it runs on the client,
  // so the server render and the first client render would disagree. Held
  // back a tick, as elsewhere in this codebase.
  React.useEffect(() => setMounted(true), [])

  // Before mount, render the dark-mode icon rather than nothing: it keeps
  // the header from reflowing when the real icon arrives.
  const Icon = !mounted ? Sun : resolvedTheme === 'dark' ? Sun : Moon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={
            mounted ? `Theme: ${theme ?? 'system'}. Change theme` : 'Change theme'
          }
          title="Change theme"
          className="rounded-full border-border/60 bg-background/60 backdrop-blur"
        >
          <Icon className="h-[1.1rem] w-[1.1rem]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {OPTIONS.map((option) => {
          const OptionIcon = option.icon
          const active = mounted && (theme ?? 'system') === option.value
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setTheme(option.value)}
              className="gap-2"
            >
              <OptionIcon className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1">{option.label}</span>
              <Check
                aria-hidden
                className={cn('h-4 w-4 text-primary', !active && 'invisible')}
              />
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
