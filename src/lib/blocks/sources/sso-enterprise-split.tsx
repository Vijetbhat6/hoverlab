/**
 * <SsoEnterpriseSplit> — What SSO actually covers, written for the person who has to configure it rather than the person who asked for it.
 *
 * On a pricing page SSO is one word. To the person configuring it, it is
 * four features that vendors bundle inconsistently, and the layout problem
 * is that the reader who cares cannot tell from a checkmark which four they
 * are getting.
 *
 * The obvious wrong answer is a checkmark in a comparison table. It cannot
 * distinguish SAML-only from SAML plus SCIM, and that distinction is the
 * entire difference between a working offboarding process and a manual one.
 *
 * So the four points are named separately, and the second is the one that
 * matters most: deprovisioning. Provisioning users automatically is a
 * convenience; removing them automatically when someone leaves the company
 * is the security control, and it is the half that is usually missing.
 *
 * The fourth point is a position rather than a feature. Charging for the
 * control that makes offboarding safe is a security tax, and saying that on
 * the page is a commitment the pricing table then has to honour.
 *
 * Accessibility: the tick is an inline `<svg>` marked `aria-hidden` with
 * `fill="currentColor"`, so it inherits the text colour and is skipped
 * entirely rather than announced four times as nothing. The section takes
 * its accessible name from the heading via `aria-labelledby`, and the points
 * are a real `<ul>` so their number is announced before they are read.
 *
 * The right-hand panel is drawn rather than an image — nothing to host, no
 * layout shift, and it follows the theme. Pass `media` to replace it with a
 * real screenshot of the provider configuration screen, which is the one
 * place a screenshot beats a drawing here.
 */

import * as React from 'react'

export interface SsoEnterpriseSplitPoint {
  label: string
  detail?: string
}

export interface SsoEnterpriseSplitProps {
  eyebrow?: string
  heading?: string
  intro?: string
  points?: SsoEnterpriseSplitPoint[]
  /** Your own visual. Omit for the drawn panel, which needs no asset. */
  media?: React.ReactNode
  className?: string
}

const POINTS: SsoEnterpriseSplitPoint[] = [
  { label: "SAML 2.0 and OIDC", detail: "Both, against any provider. Okta, Entra and Google are documented step by step." },
  { label: "SCIM provisioning", detail: "Users appear and disappear with your directory. Deprovisioning is the half that matters." },
  { label: "Enforced, not optional", detail: "Password login can be switched off per domain, so a bypass is not one setting away." },
  { label: "Included, not an upsell", detail: "On every paid plan. Charging for the control that makes offboarding safe is a security tax." },
]

/*
  Per-instance id, hashed from props that differ between instances.

  A literal id is a latent duplicate the moment this block is rendered
  twice on one document -- two pages on a catalog hub, or one page using
  the section twice. `aria-labelledby` pointing at a duplicated id resolves
  to whichever element comes first, so the second copy is announced with
  the first copy's label. Server component, so no `useId`: hashing props
  gives each instance its own target and stays stable across server and
  client renders in a way a counter would not.
*/
function instanceId(...parts: (string | undefined)[]): string {
  const text = parts.filter(Boolean).join('|')
  let hash = 0
  for (let i = 0; i < text.length; i++) hash = (Math.imul(hash, 31) + text.charCodeAt(i)) | 0
  return (hash >>> 0).toString(36).slice(0, 6)
}

export function SsoEnterpriseSplit({
  eyebrow = "Single sign-on",
  heading = "Your directory, your rules",
  intro = "SSO on a pricing page is one word. To the person configuring it, it is four separate features that vendors bundle inconsistently — so this names them.",
  points = POINTS,
  media,
  className,
}: SsoEnterpriseSplitProps) {
  const uid = instanceId(heading)

  return (
    <section
      aria-labelledby={`sso-enterprise-split-heading-${uid}`}
      className={`w-full bg-background px-6 py-16 sm:py-24 ${className ?? ''}`}
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-primary">{eyebrow}</p>
          <h2
            id={`sso-enterprise-split-heading-${uid}`}
            className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          >
            {heading}
          </h2>
          <p className="mt-4 text-base text-muted-foreground">{intro}</p>

          <ul className="mt-8 space-y-4">
            {points.map((point) => (
              <li key={point.label} className="flex gap-3">
                {/*
                  currentColor, not a token in a raw colour function. These
                  are complete oklch() values, so hsl(var(--primary)) is not
                  a colour and the declaration is dropped silently.
                */}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  className="mt-0.5 size-5 shrink-0 text-primary"
                  fill="currentColor"
                >
                  <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z" />
                </svg>
                <span>
                  <span className="block text-sm font-medium text-foreground">{point.label}</span>
                  {point.detail ? (
                    <span className="mt-0.5 block text-sm text-muted-foreground">
                      {point.detail}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/*
          The drawn panel rather than an <img>. No asset to host, no layout
          shift while it loads, and it themes with the rest of the page —
          which a screenshot of somebody's light-mode dashboard does not.
        */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {media ?? (
            <div aria-hidden="true" className="space-y-3">
              <div className="h-3 w-1/3 rounded bg-primary/30 border border-transparent" />
              <div className="h-24 rounded-lg bg-muted border border-transparent" />
              <div className="grid grid-cols-3 gap-3">
                <div className="h-14 rounded-lg bg-muted border border-transparent" />
                <div className="h-14 rounded-lg bg-muted border border-transparent" />
                <div className="h-14 rounded-lg bg-muted border border-transparent" />
              </div>
              <div className="h-3 w-2/3 rounded bg-muted border border-transparent" />
              <div className="h-3 w-1/2 rounded bg-muted border border-transparent" />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
