'use client'

/**
 * Renders Google's own "Sign in with Google" button via Identity Services.
 *
 * Deliberately Google's own chrome (`renderButton`), not a custom-styled
 * button like the ones in lib/primitives/sources/social-buttons.tsx: that
 * component is a catalog demo, and this one triggers a real credential —
 * Google's branding terms require their rendered button (or their exact
 * mark) for the flow that actually authenticates someone.
 *
 * The script talks to accounts.google.com, not identitytoolkit.googleapis.com
 * — that hop to Google is unavoidable for OAuth consent, but it stops there.
 * The credential this hands back goes to our own /api/auth/google, which is
 * the only thing that ever talks to Firebase. See lib/firebase/rest.ts.
 */

import * as React from 'react'
import Script from 'next/script'

interface GoogleCredentialResponse {
  credential: string
}

interface GoogleIdentityServices {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string
        callback: (response: GoogleCredentialResponse) => void
      }) => void
      renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void
    }
  }
}

declare global {
  interface Window {
    google?: GoogleIdentityServices
  }
}

export function GoogleSignInButton({
  clientId,
  onCredential,
  disabled = false,
}: {
  clientId: string
  onCredential: (credential: string) => void
  disabled?: boolean
}) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [scriptReady, setScriptReady] = React.useState(false)

  const handleCredential = React.useCallback(
    (response: GoogleCredentialResponse) => onCredential(response.credential),
    [onCredential],
  )

  React.useEffect(() => {
    if (!scriptReady || !containerRef.current || !window.google) return
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredential,
    })
    window.google.accounts.id.renderButton(containerRef.current, {
      theme: 'outline',
      size: 'large',
      shape: 'rectangular',
      text: 'continue_with',
      logo_alignment: 'left',
      width: 336,
    })
  }, [scriptReady, clientId, handleCredential])

  return (
    <>
      {/* onReady, not onLoad: fires on every mount, including a navigation
          back to a page that mounts this component with the script already
          cached from a previous one. */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <div
        ref={containerRef}
        aria-disabled={disabled || undefined}
        className={disabled ? 'pointer-events-none opacity-60' : undefined}
      />
    </>
  )
}
