'use client'

/**
 * The browser for one family of free assets.
 *
 * One component for all four families rather than four pages, because the
 * shape of the task is identical every time: pick options, scan a grid, take
 * one away in a format. What differs is the options row and the renderer, and
 * those are the only things switched on.
 *
 * Three decisions worth keeping:
 *
 * 1. **The grid renders generated strings through `dangerouslySetInnerHTML`,
 *    and that is safe here for a specific reason** — the markup is built in
 *    this bundle by `buildAvatarSvg` and friends from a closed set of
 *    parameters. Nothing a visitor types reaches it: the search box filters,
 *    it never becomes markup. (A tool that renders *pasted* SVG must sanitise
 *    first, which is why `/tools/svg` calls `sanitizeSvgForPreview` and this
 *    does not.)
 *
 * 2. **State is mirrored into the URL with `replaceState`, not the router.**
 *    Every option here is a preview setting, so a selection is worth sharing
 *    but is not worth a history entry each — a router push per palette click
 *    turns the back button into an undo stack for a dropdown. `replaceState`
 *    gives a copyable URL and leaves history alone.
 *
 * 3. **The grid is capped and says so.** 1,632 pairings is the point of the
 *    crossing, and also 1,632 live DOM subtrees with 1,632 running animations
 *    if rendered at once. The cap is lifted by a button, and the count next
 *    to it is the real total rather than the rendered one.
 */

import * as React from 'react'
import { Check, Copy, Link2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CopyCssCard } from '@/components/designer-tools/copy-css-card'
import { DownloadBar } from '@/components/designer-tools/download-bar'
import { downloadText, svgToPngBlob, downloadBlob } from '@/lib/download'
import { cn } from '@/lib/utils'

import {
  ASSET_FAMILY_META,
  ASSET_PALETTES,
  type AssetFamily,
  type AssetScheme,
} from '@/lib/assets/asset-types'
import {
  ICON_LICENSE,
  ICON_MOTIONS,
  LUCIDE_VERSION,
  animatedIconCount,
  animatedIconFileName,
  buildAnimatedIconCss,
  buildAnimatedIconJsx,
  buildAnimatedIconSvg,
  motionById,
  motionClass,
  searchIcons,
  type IconMotionId,
} from '@/lib/assets/animated-icons'
import {
  AVATAR_SET,
  AVATAR_STYLES,
  avatarFileName,
  avatarPlaceholderRow,
  buildAvatarDataUri,
  buildAvatarJsx,
  buildAvatarSvg,
  searchAvatars,
  type AvatarStyle,
} from '@/lib/assets/avatars'
import {
  LOGO_FAMILIES,
  LOGO_LOCKUPS,
  LOGO_SET,
  buildLogoDataUri,
  buildLogoJsx,
  buildLogoSvg,
  logoFileName,
  searchLogos,
  type LogoLockup,
} from '@/lib/assets/logos'
import {
  SCENES,
  buildIllustrationDataUri,
  buildIllustrationJsx,
  buildIllustrationSvg,
  illustrationFileName,
  searchScenes,
} from '@/lib/assets/illustrations'

/* ------------------------------------------------------------------ */

export interface AssetBrowserState {
  q: string
  palette: string
  scheme: AssetScheme
  motion: IconMotionId
  style: AvatarStyle
  lockup: LogoLockup
  mono: boolean
  /** The selected item's id, or '' for none. */
  item: string
}

export const DEFAULT_BROWSER_STATE: AssetBrowserState = {
  q: '',
  palette: 'indigo',
  scheme: 'auto',
  motion: 'draw',
  style: 'face',
  lockup: 'horizontal',
  mono: false,
  item: '',
}

const GRID_CAP = 72

/** One selectable option row. Plain buttons — a select hides the choices. */
function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { id: T; name: string }[]
  onChange: (next: T) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex flex-wrap gap-1">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            aria-pressed={value === o.id}
            className={cn(
              'rounded-md border px-2.5 py-1 text-xs transition-colors',
              value === o.id
                ? 'border-primary bg-primary/10 font-medium text-foreground'
                : 'border-border text-muted-foreground hover:bg-muted',
            )}
          >
            {o.name}
          </button>
        ))}
      </div>
    </div>
  )
}

export function AssetBrowser({
  family,
  initial,
}: {
  family: AssetFamily
  initial: Partial<AssetBrowserState>
}) {
  const [state, setState] = React.useState<AssetBrowserState>({
    ...DEFAULT_BROWSER_STATE,
    ...initial,
  })
  const [showAll, setShowAll] = React.useState(false)
  const meta = ASSET_FAMILY_META[family]

  const set = React.useCallback(<K extends keyof AssetBrowserState>(key: K, value: AssetBrowserState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }))
  }, [])

  // See the header: a shareable URL without a history entry per click.
  React.useEffect(() => {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(state)) {
      const fallback = DEFAULT_BROWSER_STATE[k as keyof AssetBrowserState]
      if (v !== fallback && v !== '') params.set(k, String(v))
    }
    const query = params.toString()
    window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname)
  }, [state])

  /* ---------------- the rows each family shows ---------------- */

  const rows = React.useMemo(() => {
    if (family === 'animated-icons') {
      return searchIcons(state.q).map((icon) => ({
        id: icon.slug,
        label: icon.name,
        svg: buildAnimatedIconSvg({ icon, motion: state.motion, size: 32 }),
      }))
    }
    if (family === 'avatars') {
      return searchAvatars(state.q)
        .filter((a) => a.style === state.style)
        .map((a) => ({
          id: a.id,
          label: a.name,
          svg: buildAvatarSvg({
            seed: a.seed,
            style: a.style,
            size: 56,
            paletteId: state.palette,
            scheme: state.scheme,
          }),
        }))
    }
    if (family === 'logos') {
      return searchLogos(state.q).map((l) => ({
        id: l.id,
        label: `${l.name} · ${l.family}`,
        svg: buildLogoSvg({
          name: l.name,
          family: l.family,
          lockup: state.lockup,
          mono: state.mono,
          height: 26,
          paletteId: state.palette,
          scheme: state.scheme,
        }),
      }))
    }
    return searchScenes(state.q).map((s) => ({
      id: s.id,
      label: s.name,
      svg: buildIllustrationSvg({
        sceneId: s.id,
        width: 150,
        paletteId: state.palette,
        scheme: state.scheme,
      }),
    }))
  }, [family, state.q, state.motion, state.style, state.lockup, state.mono, state.palette, state.scheme])

  const selectedId = state.item && rows.some((r) => r.id === state.item) ? state.item : rows[0]?.id
  const shown = showAll ? rows : rows.slice(0, GRID_CAP)

  /* ---------------- the formats for the selection ---------------- */

  const detail = React.useMemo(() => {
    if (!selectedId) return null
    const common = { paletteId: state.palette, scheme: state.scheme }

    if (family === 'animated-icons') {
      const icon = searchIcons('').find((i) => i.slug === selectedId)
      if (!icon) return null
      const motion = motionById(state.motion)
      return {
        title: `${icon.name} · ${motion.name}`,
        note: motion.note,
        preview: buildAnimatedIconSvg({ icon, motion: state.motion, size: 96 }),
        file: animatedIconFileName(icon, state.motion),
        svg: buildAnimatedIconSvg({ icon, motion: state.motion, standalone: true, ...common }),
        jsx: buildAnimatedIconJsx({ icon, motion: state.motion }),
        css: buildAnimatedIconCss({ icon, motion: state.motion }),
        dataUri: null as string | null,
        extra: null as string | null,
      }
    }
    if (family === 'avatars') {
      const entry = AVATAR_SET.find((a) => a.id === selectedId)
      if (!entry) return null
      const opts = { seed: entry.seed, style: entry.style, ...common }
      return {
        title: `${entry.name} · ${entry.style}`,
        note: AVATAR_STYLES.find((s) => s.id === entry.style)?.note ?? '',
        preview: buildAvatarSvg({ ...opts, size: 120 }),
        file: avatarFileName(entry),
        svg: buildAvatarSvg({ ...opts, size: 256 }),
        jsx: buildAvatarJsx(opts),
        css: null,
        dataUri: buildAvatarDataUri({ ...opts, size: 64 }),
        extra: avatarPlaceholderRow(entry),
      }
    }
    if (family === 'logos') {
      const entry = LOGO_SET.find((l) => l.id === selectedId)
      if (!entry) return null
      const opts = {
        name: entry.name,
        family: entry.family,
        lockup: state.lockup,
        mono: state.mono,
        ...common,
      }
      return {
        title: `${entry.name} · ${entry.family}`,
        note: `${entry.industry}. ${LOGO_FAMILIES.find((f) => f.id === entry.family)?.note ?? ''}`,
        preview: buildLogoSvg({ ...opts, height: 48 }),
        file: logoFileName(entry, state.lockup, state.mono),
        svg: buildLogoSvg({ ...opts, height: 64 }),
        jsx: buildLogoJsx(opts),
        css: null,
        dataUri: buildLogoDataUri({ ...opts, height: 32 }),
        extra: null,
      }
    }
    const scene = SCENES.find((s) => s.id === selectedId)
    if (!scene) return null
    return {
      title: scene.name,
      note: scene.use,
      preview: buildIllustrationSvg({ sceneId: scene.id, width: 260, ...common }),
      file: illustrationFileName(scene, state.palette),
      svg: buildIllustrationSvg({ sceneId: scene.id, width: 480, ...common }),
      jsx: buildIllustrationJsx({ sceneId: scene.id, ...common }),
      css: null,
      dataUri: buildIllustrationDataUri({ sceneId: scene.id, width: 320, ...common }),
      extra: null,
    }
  }, [family, selectedId, state.motion, state.palette, state.scheme, state.lockup, state.mono])

  /*
    The animated-icon grid needs the family's stylesheet present in the page
    to animate at all — the tiles carry the class, the rule lives here. One
    <style> for the whole grid rather than one per tile is the same decision
    the emitter makes about the class being family-keyed.
  */
  const gridCss = family === 'animated-icons' ? buildAnimatedIconCss({ icon: searchIcons('')[0], motion: state.motion }) : ''

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${what} copied`)
    } catch {
      toast.error('Clipboard refused — select the code and copy manually')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {gridCss ? <style>{gridCss}</style> : null}

      {/* ----------------------- controls ----------------------- */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex min-w-52 flex-1 flex-col gap-1.5">
            <Label htmlFor="asset-search" className="text-xs text-muted-foreground">
              Search
            </Label>
            <Input
              id="asset-search"
              value={state.q}
              onChange={(e) => set('q', e.target.value)}
              placeholder={
                family === 'animated-icons'
                  ? 'bell, delete, spinner…'
                  : family === 'logos'
                    ? 'name or industry'
                    : 'name or use'
              }
            />
          </div>

          {family !== 'animated-icons' ? (
            <Choice
              label="Palette"
              value={state.palette}
              options={ASSET_PALETTES.map((p) => ({ id: p.id, name: p.name }))}
              onChange={(v) => set('palette', v)}
            />
          ) : null}

          <Choice
            label="Scheme"
            value={state.scheme}
            options={[
              { id: 'auto' as const, name: 'Adapts' },
              { id: 'light' as const, name: 'Light' },
              { id: 'dark' as const, name: 'Dark' },
            ]}
            onChange={(v) => set('scheme', v)}
          />
        </div>

        {family === 'animated-icons' ? (
          <Choice
            label="Motion"
            value={state.motion}
            options={ICON_MOTIONS.map((m) => ({ id: m.id, name: m.name }))}
            onChange={(v) => set('motion', v)}
          />
        ) : null}

        {family === 'avatars' ? (
          <Choice
            label="Style"
            value={state.style}
            options={AVATAR_STYLES.map((s) => ({ id: s.id, name: s.name }))}
            onChange={(v) => set('style', v)}
          />
        ) : null}

        {family === 'logos' ? (
          <div className="flex flex-wrap items-end gap-4">
            <Choice
              label="Lockup"
              value={state.lockup}
              options={LOGO_LOCKUPS.map((l) => ({ id: l.id, name: l.name }))}
              onChange={(v) => set('lockup', v)}
            />
            <Choice
              label="Colour"
              value={state.mono ? 'mono' : 'brand'}
              options={[
                { id: 'brand', name: 'Brand' },
                { id: 'mono', name: 'One ink' },
              ]}
              onChange={(v) => set('mono', v === 'mono')}
            />
          </div>
        ) : null}
      </div>

      {/* ------------------------- grid ------------------------- */}
      <div>
        <p className="mb-2 text-xs text-muted-foreground">
          {rows.length.toLocaleString('en-GB')} shown
          {family === 'animated-icons'
            ? ` · ${animatedIconCount().toLocaleString('en-GB')} pairings across all motions`
            : ''}
        </p>

        {rows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Nothing matches “{state.q}”.
          </p>
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-2">
            {shown.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => set('item', row.id)}
                  aria-pressed={row.id === selectedId}
                  title={row.label}
                  className={cn(
                    'flex h-24 w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-lg border p-2 transition-colors',
                    row.id === selectedId
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted',
                  )}
                >
                  <span
                    /*
                      The generated SVG carries its own width and height, and
                      a 480px-wide illustration in an 84px tile paints over
                      the label underneath it rather than overflowing
                      visibly. Overriding both dimensions here keeps one grid
                      working for four families whose natural sizes differ by
                      an order of magnitude.
                    */
                    className="flex min-h-0 flex-1 items-center justify-center overflow-hidden [&>svg]:h-auto [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:max-w-full"
                    // Safe: this markup is generated in this bundle, never pasted.
                    dangerouslySetInnerHTML={{ __html: row.svg }}
                  />
                  <span className="w-full truncate text-center text-[10px] text-muted-foreground">
                    {row.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {!showAll && rows.length > GRID_CAP ? (
          <Button variant="outline" className="mt-3" onClick={() => setShowAll(true)}>
            Show the other {(rows.length - GRID_CAP).toLocaleString('en-GB')}
          </Button>
        ) : null}
      </div>

      {/* ------------------------ detail ------------------------ */}
      {detail ? (
        <div className="grid gap-4 rounded-xl border border-border bg-card p-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <div className="flex flex-col gap-3">
            <div
              className={cn(
                'flex min-h-44 items-center justify-center rounded-lg border border-border p-6',
                state.scheme === 'dark' ? 'bg-slate-900' : 'bg-background',
              )}
              dangerouslySetInnerHTML={{ __html: detail.preview }}
            />
            <div>
              <h2 className="text-sm font-semibold">{detail.title}</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{detail.note}</p>
            </div>

            <DownloadBar
              actions={[
                {
                  label: 'SVG',
                  run: () => downloadText(detail.svg, detail.file, 'image/svg+xml'),
                },
                ...(detail.dataUri
                  ? [
                      {
                        label: 'PNG',
                        title: 'Rasterised at 512px',
                        run: async () => {
                          // A fixed raster size rather than a multiple of the
                          // preview: the preview scales with the panel, and a
                          // download whose resolution depends on the width of
                          // the reader's browser is a download nobody can
                          // reason about.
                          const blob = await svgToPngBlob(detail.svg, 512, 512)
                          if (!blob) return false
                          downloadBlob(blob, detail.file.replace(/\.svg$/, '.png'))
                        },
                      },
                    ]
                  : []),
              ]}
            />

            <div className="flex flex-wrap gap-2">
              {detail.dataUri ? (
                <Button variant="outline" size="sm" onClick={() => copy(detail.dataUri!, 'Data URI')}>
                  <Copy className="size-3.5" /> Data URI
                </Button>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                onClick={() => copy(window.location.href, 'Link')}
              >
                <Link2 className="size-3.5" /> Copy link
              </Button>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-3">
            <CopyCssCard code={detail.svg} title="SVG" language="html" />
            <CopyCssCard code={detail.jsx} title="React component" language="tsx" />
            {detail.css ? (
              <>
                <CopyCssCard code={detail.css} title="CSS" language="css" />
                <p className="text-xs text-muted-foreground">
                  The markup above carries{' '}
                  <code className="rounded bg-muted px-1">{motionClass(state.motion)}</code>; the
                  rule belongs in your stylesheet once, not once per icon. The downloaded{' '}
                  <code className="rounded bg-muted px-1">.svg</code> has it inlined so the file
                  animates on its own.
                </p>
              </>
            ) : null}
            {detail.extra ? (
              <CopyCssCard code={detail.extra} title="As placeholder data" language="ts" />
            ) : null}
          </div>
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">
        <Check className="me-1 inline size-3.5 align-text-bottom" />
        {meta.derivation}. Free for anything, including commercial work, with no attribution.
        {family === 'animated-icons' ? ` Geometry: ${ICON_LICENSE} (v${LUCIDE_VERSION}).` : ''}
      </p>
    </div>
  )
}
