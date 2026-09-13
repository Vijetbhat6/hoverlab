'use client'

/**
 * Boots every shader canvas on the page, wherever it came from.
 *
 * Effect markup reaches the DOM as a *string*. `EffectCard`,
 * `EffectStaticCard`, the detail stage, `/browse`, the category hubs, the
 * bundle drawer, the compare tray, the playground and the landing wall all
 * do the same thing with it: `dangerouslySetInnerHTML`. That is how 1,047
 * CSS effects render, and it works because CSS needs nothing but to be in
 * the document.
 *
 * A shader needs something to call `mountShader`. The obvious fix — make
 * each of those surfaces render a React component for shader effects and
 * inject html for the rest — is nine edits, nine branches, and a tenth
 * surface added next month that quietly shows a blank rectangle.
 *
 * So the markup carries `<canvas data-hoverlab-shader="aurora-veil">` and
 * this one component, mounted once at the root, finds them: on mount, and
 * on every DOM mutation after. A surface that renders effect HTML gets
 * working shaders without knowing shaders exist, and a surface this never
 * reaches shows the fallback gradient rather than a hole.
 *
 * ⚠️  Nothing here imports the programs statically. The registry is ~30 KB
 * of GLSL and most visits never see a shader canvas, so it arrives through
 * a dynamic `import()` the first time one appears. The only imports at the
 * top of this file are types, which compile away, and the two constants
 * naming the attribute.
 */

import * as React from 'react'

import { useReducedMotion } from '@/components/reduced-motion-provider'
import { SHADER_ATTR, SHADER_SELECTOR } from '@/lib/shaders/shader-types'
import type { ShaderHandle, ShaderProgram } from '@/lib/shaders/runtime'

type MountFn = typeof import('@/lib/shaders/runtime').mountShader
type LookupFn = typeof import('@/lib/shaders/registry').getShaderProgram

export function ShaderRuntime() {
  const { enabled: reducedMotion } = useReducedMotion()

  /*
   * Live state in refs, not state: each of these is read by the scanner,
   * and a re-render per theme flip would tear down and rebuild fifteen
   * WebGL contexts in order to change four uniforms.
   */
  const handles = React.useRef(new Map<HTMLCanvasElement, ShaderHandle>())
  const reducedRef = React.useRef(reducedMotion)

  React.useEffect(() => {
    let cancelled = false
    let mount: MountFn | null = null
    let lookup: LookupFn | null = null
    let loading = false
    let dark = document.documentElement.classList.contains('dark')

    const mounted = handles.current

    /**
     * Fetch the programs and the runtime together.
     *
     * One `Promise.all` rather than two awaits because the registry chunk
     * already pulls the runtime in — they are one network fetch, and asking
     * for both makes that explicit instead of accidental.
     */
    const load = () => {
      if (loading) return
      loading = true
      Promise.all([
        import('@/lib/shaders/registry'),
        import('@/lib/shaders/runtime'),
      ])
        .then(([registry, runtime]) => {
          if (cancelled) return
          lookup = registry.getShaderProgram
          mount = runtime.mountShader
          scan()
        })
        .catch(() => {
          // The canvases keep their CSS fallback, which is a gradient in
          // the design's own colours. Nothing to announce, and retrying a
          // chunk that failed to load will fail the same way.
          loading = false
        })
    }

    /** Attach the runtime to every canvas that does not have one yet. */
    const scan = () => {
      if (cancelled) return

      /*
       * Canvases that have left the document, first. React replaces a
       * preview's entire innerHTML when its effect changes, so on
       * `/playground` this is the normal path rather than an edge case —
       * and a WebGL context that is never destroyed counts against the
       * browser's per-page limit of about sixteen.
       */
      for (const [canvas, handle] of mounted) {
        if (!canvas.isConnected) {
          handle.destroy()
          mounted.delete(canvas)
        }
      }

      const canvases = document.querySelectorAll<HTMLCanvasElement>(SHADER_SELECTOR)
      if (canvases.length === 0) return
      if (!mount || !lookup) {
        load()
        return
      }

      for (const canvas of canvases) {
        if (mounted.has(canvas)) continue
        const id = canvas.getAttribute(SHADER_ATTR)
        if (!id) continue
        const program: ShaderProgram | undefined = lookup(id)
        if (!program) continue

        mounted.set(
          canvas,
          mount(canvas, program, {
            dark,
            reducedMotion: reducedRef.current,
            // The pointer follows the whole preview surface rather than the
            // canvas: the card's padding is part of the tile as far as a
            // visitor is concerned, and a grid distortion that stops
            // answering 8px from the edge reads as broken.
            pointerTarget: canvas.parentElement,
          }),
        )
      }
    }

    /*
     * One observer for the document. Cards mount, grids paginate, drawers
     * open — all of it arrives as mutations, and deferring to an animation
     * frame collapses a paginated grid's 24 insertions into one scan.
     */
    let pending = 0
    const queue = () => {
      if (pending !== 0) return
      pending = window.requestAnimationFrame(() => {
        pending = 0
        scan()
      })
    }

    const mutations = new MutationObserver(queue)
    mutations.observe(document.body, { childList: true, subtree: true })

    // Theme: the same `class` on <html> that `next-themes` writes.
    const theme = new MutationObserver(() => {
      const next = document.documentElement.classList.contains('dark')
      if (next === dark) return
      dark = next
      for (const handle of mounted.values()) handle.setTheme(next)
    })
    theme.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    scan()

    return () => {
      cancelled = true
      if (pending !== 0) window.cancelAnimationFrame(pending)
      mutations.disconnect()
      theme.disconnect()
      for (const handle of mounted.values()) handle.destroy()
      mounted.clear()
    }
  }, [])

  /*
   * The site's reduced-motion setting is not `prefers-reduced-motion`: it
   * is that plus a manual override in the header, and the override is the
   * whole point of having one. So the surfaces follow this rather than
   * reading the media query for themselves.
   */
  React.useEffect(() => {
    reducedRef.current = reducedMotion
    for (const handle of handles.current.values()) {
      handle.setReducedMotion(reducedMotion)
    }
  }, [reducedMotion])

  return null
}
