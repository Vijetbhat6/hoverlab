'use client'

/**
 * Header toggle button for the reduced-motion setting.
 *
 * Cycles auto → on → off → auto. Shows a different icon depending on state:
 *   - auto: a subtle "Zap" icon (motion is on, following OS)
 *   - on:   a "ZapOff" icon (motion is reduced)
 *   - off:  a "Zap" icon highlighted (motion is forced on, overriding OS)
 *
 * Tooltip + aria-label explain the current state. The state itself is
 * managed by <ReducedMotionProvider /> at the app root.
 */

import * as React from 'react'
import { Zap, ZapOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useReducedMotion } from '@/components/reduced-motion-provider'

export function ReducedMotionToggle() {
  const { pref, enabled, cycle } = useReducedMotion()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  // SSR-safe: render a placeholder until mounted so the icon doesn't flip.
  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="rounded-full border-border/60 bg-background/60 backdrop-blur"
        aria-label="Reduced motion setting"
        disabled
      >
        <Zap className="h-[1.1rem] w-[1.1rem]" />
      </Button>
    )
  }

  const label =
    pref === 'auto'
      ? `Motion: auto (follows OS — currently ${enabled ? 'reduced' : 'on'})`
      : pref === 'on'
        ? 'Motion: reduced (animations disabled)'
        : 'Motion: forced on'

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={cycle}
      aria-label={label}
      title={`${label} — click to cycle`}
      className="rounded-full border-border/60 bg-background/60 backdrop-blur"
    >
      {enabled ? (
        <ZapOff className="h-[1.1rem] w-[1.1rem] text-amber-500" />
      ) : (
        <Zap className="h-[1.1rem] w-[1.1rem]" />
      )}
    </Button>
  )
}
