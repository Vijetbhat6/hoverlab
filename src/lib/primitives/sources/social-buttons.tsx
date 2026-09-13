'use client'

/**
 * <SocialButtons> — the row above every sign-in form.
 *
 * The brand marks are inline SVG rather than an icon package, and that is
 * the substance of this component rather than an optimisation. Lucide does
 * not carry brand logos, `react-icons` is 1.2 MB to draw four glyphs, and
 * every provider's brand guidelines require their own mark drawn their own
 * way — Google's is four-colour and may not be recoloured, Apple's is
 * monochrome and must invert with the theme. A `<Chrome />` icon standing
 * in for Google, which is what most catalogs ship, is both wrong and
 * against the terms.
 *
 * The wording is a rule, not a preference: "Continue with Google", never
 * "Sign in with Google". The same button has to serve a new user and a
 * returning one — you do not know which until the OAuth round-trip
 * finishes — and "Sign up" in front of an existing account reads as an
 * error the user is about to make.
 */

import * as React from 'react'
import { Loader2, Mail } from 'lucide-react'

export type SocialProvider = 'google' | 'github' | 'apple' | 'microsoft' | 'email'

export interface SocialButtonsProps {
  providers?: SocialProvider[]
  onSelect?: (provider: SocialProvider) => void
  /** Which one is mid-redirect. Only that button spins; the rest disable. */
  pending?: SocialProvider | null
  /** Side by side once there are more than two, which is the usual case. */
  layout?: 'stack' | 'grid'
  className?: string
}

const LABELS: Record<SocialProvider, string> = {
  google: 'Google',
  github: 'GitHub',
  apple: 'Apple',
  microsoft: 'Microsoft',
  email: 'email',
}

export function SocialButtons({
  providers = ['google', 'github', 'apple'],
  onSelect,
  pending = null,
  layout = 'stack',
  className = '',
}: SocialButtonsProps) {
  return (
    <div
      className={[
        'grid gap-2',
        layout === 'grid' ? 'grid-cols-2' : 'grid-cols-1',
        className,
      ].join(' ')}
    >
      {providers.map((provider) => {
        const isPending = pending === provider
        return (
          <button
            key={provider}
            type="button"
            onClick={() => onSelect?.(provider)}
            // Every button disables while any one of them is redirecting:
            // a second OAuth window opened during the first is a state
            // neither provider handles well.
            disabled={pending !== null}
            aria-busy={isPending || undefined}
            className="inline-flex h-10 items-center justify-center gap-2.5 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />
            ) : (
              <ProviderMark provider={provider} />
            )}
            Continue with {LABELS[provider]}
          </button>
        )
      })}
    </div>
  )
}

/**
 * The marks, drawn at 16px on a 24-unit grid.
 *
 * Apple and GitHub use `currentColor` so they invert with the theme, which
 * is what both sets of brand guidelines ask for. Google does not: its mark
 * is four fixed colours and recolouring it is explicitly disallowed, so it
 * looks identical in light and dark — which is correct, not an oversight.
 */
function ProviderMark({ provider }: { provider: SocialProvider }) {
  const common = { width: 16, height: 16, viewBox: '0 0 24 24', 'aria-hidden': true } as const

  if (provider === 'google') {
    return (
      <svg {...common}>
        <path
          fill="#4285F4"
          d="M23.06 12.25c0-.82-.07-1.6-.21-2.36H12v4.47h6.2a5.3 5.3 0 0 1-2.3 3.48v2.9h3.72c2.18-2 3.44-4.96 3.44-8.49Z"
        />
        <path
          fill="#34A853"
          d="M12 23.5c3.11 0 5.72-1.03 7.62-2.79l-3.72-2.89c-1.03.69-2.35 1.1-3.9 1.1-3 0-5.55-2.03-6.46-4.76H1.69v2.98A11.5 11.5 0 0 0 12 23.5Z"
        />
        <path
          fill="#FBBC05"
          d="M5.54 14.16a6.9 6.9 0 0 1 0-4.32V6.86H1.69a11.5 11.5 0 0 0 0 10.28l3.85-2.98Z"
        />
        <path
          fill="#EA4335"
          d="M12 5.08c1.69 0 3.2.58 4.4 1.72l3.3-3.3C17.72 1.62 15.11.5 12 .5A11.5 11.5 0 0 0 1.69 6.86l3.85 2.98C6.45 7.11 9 5.08 12 5.08Z"
        />
      </svg>
    )
  }

  if (provider === 'github') {
    return (
      <svg {...common} fill="currentColor">
        <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.55v-2.1c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.5 3.17-1.18 3.17-1.18.63 1.59.24 2.76.12 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.4-5.27 5.69.41.36.78 1.06.78 2.14v3.17c0 .3.21.66.8.55A11.5 11.5 0 0 0 12 .5Z" />
      </svg>
    )
  }

  if (provider === 'apple') {
    return (
      <svg {...common} fill="currentColor">
        <path d="M17.05 12.7c-.03-2.6 2.12-3.85 2.22-3.91-1.21-1.77-3.1-2.02-3.77-2.04-1.6-.17-3.13.94-3.94.94-.82 0-2.07-.92-3.4-.9-1.75.03-3.36 1.02-4.26 2.58-1.82 3.15-.46 7.8 1.3 10.36.87 1.25 1.9 2.66 3.25 2.6 1.31-.05 1.8-.84 3.38-.84 1.57 0 2.02.84 3.4.82 1.4-.03 2.29-1.27 3.14-2.53.99-1.45 1.4-2.86 1.42-2.93-.03-.01-2.72-1.04-2.74-4.14ZM14.47 4.5c.72-.87 1.2-2.08 1.07-3.29-1.03.04-2.28.69-3.02 1.56-.66.77-1.24 2-1.09 3.18 1.15.09 2.32-.58 3.04-1.45Z" />
      </svg>
    )
  }

  if (provider === 'microsoft') {
    return (
      <svg {...common}>
        <path fill="#F25022" d="M2 2h9.5v9.5H2z" />
        <path fill="#7FBA00" d="M12.5 2H22v9.5h-9.5z" />
        <path fill="#00A4EF" d="M2 12.5h9.5V22H2z" />
        <path fill="#FFB900" d="M12.5 12.5H22V22h-9.5z" />
      </svg>
    )
  }

  return <Mail className="h-4 w-4" aria-hidden />
}
