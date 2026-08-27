'use client'

/**
 * <DesignSystemPanel> — pick a brand, get your design system as files.
 *
 * The whole point of this screen is that the preview is the product. A
 * customer choosing a brand should see the palette move before they
 * download anything, because the decision they are making is a visual one
 * and a list of hex codes is not how anyone makes it.
 *
 * Three states, and the middle one matters most:
 *
 *   signed out    the swatches and the sliders, live, with no export. The
 *                 brand system is free to play with — that is how you find
 *                 out whether the catalog looks right in your colours.
 *   free account  same, plus what the export contains and what it costs.
 *   Pro           the files.
 *
 * That split follows the rule the rest of the product follows: nothing is
 * taken away from browsing. What Pro buys is the artifact — the files
 * derived from a brand nobody else has — not permission to look.
 *
 * The brand applied here is the real one, through `useBrandColor`, so the
 * page recolours around you as you drag. It is not a mock: the same four
 * custom properties drive `--primary` everywhere in the app.
 */

import * as React from 'react'
import Link from 'next/link'
import { Check, Copy, Download, FileCode, Loader2, Lock, Palette } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/components/auth-provider'
import { useEntitlements } from '@/hooks/use-entitlements'
import { useBrandColor } from '@/hooks/use-brand-color'
import { BrandColorPicker } from '@/components/brand-color-picker'
import { CopyForFigma } from '@/components/copy-for-figma'
import { downloadBlob, downloadTextFile } from '@/lib/bundle-export'
import { track } from '@/lib/analytics'
import type { DesignSystemExport } from '@/lib/export/design-system'

/** What each file is for, in one line, for the free-tier explanation. */
const CONTENTS: Array<{ path: string; blurb: string }> = [
  { path: 'tokens.css', blurb: 'Every colour token in your brand, light and dark.' },
  { path: 'tailwind-theme.ts', blurb: 'Maps them onto class names — bg-primary and the rest.' },
  {
    path: 'tokens.light.json',
    blurb: 'W3C design tokens — what Figma’s variable import reads.',
  },
  { path: 'tokens.dark.json', blurb: 'The same, for dark mode. Figma splits modes by file.' },
  { path: 'hoverlab.config.json', blurb: 'So the CLI installs artifacts already in your brand.' },
  { path: 'README.md', blurb: 'What to do with the four files above.' },
]

export function DesignSystemPanel() {
  const { user } = useAuth()
  const { entitlements } = useEntitlements()
  const { color: brandColor } = useBrandColor()
  const [name, setName] = React.useState('')
  const [result, setResult] = React.useState<DesignSystemExport | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [copied, setCopied] = React.useState<string | null>(null)

  const licensed = entitlements?.canUseProFeatures ?? false

  /*
   * The result is cleared whenever the brand changes.
   *
   * Without this, dragging a slider after generating would leave a file
   * list on screen describing the previous colour — and someone who then
   * pressed Download would get a zip that did not match what the page was
   * showing them. Better to make them press the button again.
   */
  React.useEffect(() => {
    setResult(null)
  }, [brandColor])

  async function generate() {
    setBusy(true)
    try {
      const res = await fetch('/api/design-system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ brand: brandColor, name: name.trim() || undefined }),
      })

      if (res.status === 402) {
        track('paywall_hit', { feature: 'design_system_export', plan_required: 'pro' })
        toast.error('The design system export is part of Pro')
        return
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const body = (await res.json()) as DesignSystemExport
      setResult(body)
      track('design_system_generated', { name: body.name })
    } catch {
      toast.error('Could not build that', { description: 'Try again in a moment.' })
    } finally {
      setBusy(false)
    }
  }

  async function downloadZip() {
    if (!result) return
    // Same dynamic import the bundle ZIP uses — jszip is large and nobody
    // who only copied a token file should pay for it.
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    const folder = zip.folder('design-system') ?? zip
    for (const file of result.files) folder.file(file.path, file.code)
    const blob = await zip.generateAsync({ type: 'blob' })
    downloadBlob(`${result.name.toLowerCase().replace(/\s+/g, '-')}-design-system.zip`, blob)
  }

  async function copyFile(path: string, code: string) {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(path)
      window.setTimeout(() => setCopied(null), 2000)
    } catch {
      toast.error('Could not copy')
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      {/* Left: the brand, live. Free for everyone. */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette aria-hidden className="h-4 w-4 text-primary" />
            Your brand
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Pick a preset or tune the hue, chroma and lightness. The whole page
            recolours as you go — this is the same token that drives every
            effect, block and page in the catalog, so what you see here is what
            the catalog looks like in your colours.
          </p>
          <BrandColorPicker />
        </CardContent>
      </Card>

      {/* Right: the export. */}
      <Card className="lg:sticky lg:top-24 lg:self-start">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileCode aria-hidden className="h-4 w-4 text-primary" />
            Export
            {!licensed ? (
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                <Lock aria-hidden className="h-3 w-3" /> Pro
              </span>
            ) : null}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {licensed ? (
            <>
              <div>
                <label
                  htmlFor="ds-name"
                  className="mb-1.5 block text-xs font-medium text-muted-foreground"
                >
                  Name it
                </label>
                <input
                  id="ds-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Northwind"
                  maxLength={60}
                  className="h-9 w-full rounded-md border border-border/60 bg-background px-3 text-sm outline-none transition-colors focus-visible:border-primary/50"
                />
              </div>

              <Button onClick={generate} disabled={busy} className="w-full gap-1.5">
                {busy ? (
                  <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                ) : (
                  <FileCode aria-hidden className="h-4 w-4" />
                )}
                {busy ? 'Building' : 'Build my design system'}
              </Button>

              {result ? (
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    onClick={downloadZip}
                    className="w-full gap-1.5"
                  >
                    <Download aria-hidden className="h-4 w-4" /> Download all{' '}
                    {result.files.length}
                  </Button>

                  <ul className="space-y-1.5">
                    {result.files.map((file) => (
                      <li
                        key={file.path}
                        className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2"
                      >
                        <span className="min-w-0 flex-1 truncate font-mono text-xs">
                          {file.path}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyFile(file.path, file.code)}
                          className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                          aria-label={`Copy ${file.path}`}
                        >
                          {copied === file.path ? (
                            <Check aria-hidden className="h-3.5 w-3.5" />
                          ) : (
                            <Copy aria-hidden className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            downloadTextFile(file.path, file.code, 'text/plain')
                          }
                          className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                          aria-label={`Download ${file.path}`}
                        >
                          <Download aria-hidden className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>

                  {/* Clipping is stated, not swallowed. A customer whose
                      brand cannot be represented exactly in sRGB should
                      hear it from us rather than notice it later. */}
                  {result.warnings.map((warning) => (
                    <p
                      key={warning}
                      className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground"
                    >
                      {warning}
                    </p>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Everything below, derived from whatever brand you land on:
              </p>
              <ul className="space-y-2">
                {CONTENTS.map((item) => (
                  <li key={item.path} className="text-sm">
                    <span className="font-mono text-xs text-foreground">{item.path}</span>
                    <span className="block text-xs text-muted-foreground">{item.blurb}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="w-full">
                <Link href="/#pricing">See Pro</Link>
              </Button>
              {user ? null : (
                <p className="text-center text-xs text-muted-foreground">
                  <Link href="/login" className="underline underline-offset-2">
                    Sign in
                  </Link>{' '}
                  if you already bought it.
                </p>
              )}
            </>
          )}

          {/* Outside the Pro branch on purpose: the clipboard path is free
              for everybody. The zip is derived per-customer and is the
              thing worth charging for; this is two seconds of proof that
              the palette is real, aimed at the designer who is the one
              who actually picks a component library. */}
          <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold">Straight into Figma</span>
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Free
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Both palettes, the radius scale and the type as editable layers —
              paste onto any canvas. No plugin, no file, no account.
            </p>
            <CopyForFigma className="w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
