'use client'

/**
 * The React surface a shader is drawn on.
 *
 * Thin on purpose: it owns a canvas, a ref and three effects, and every
 * decision about *what* to draw is in `./runtime`. That split is what lets
 * the catalog's DOM scanner and a buyer's React tree run the same code.
 *
 * SHIPPED FILE. One of the three a buyer copies, so it imports nothing but
 * React and the runtime, and it reads the theme off the DOM rather than
 * from a provider — `next-themes`, `class-variance-authority` and a
 * hand-rolled context all end up setting `class="dark"` on <html>, and that
 * is the one thing they agree on.
 */

import * as React from 'react'

import {
  fallbackBackground,
  mountShader,
  type ShaderHandle,
  type ShaderProgram,
} from './runtime'

export interface ShaderSurfaceProps {
  program: ShaderProgram
  /**
   * Force a palette instead of following the document's theme. Useful for a
   * section that is dark whatever the page around it is doing.
   */
  dark?: boolean
  className?: string
  style?: React.CSSProperties
  /**
   * Content drawn over the shader. Positioned by the caller; the surface
   * only guarantees it sits above the canvas and takes pointer events.
   */
  children?: React.ReactNode
}

/** True when the document is in dark mode, by the convention every setup shares. */
function readDocumentDark(): boolean {
  if (typeof document === 'undefined') return false
  return document.documentElement.classList.contains('dark')
}

/**
 * Follow the document's theme class.
 *
 * A `MutationObserver` rather than a media query: the site has a manual
 * toggle, so the OS preference is not the answer — what the toggle writes
 * is. Returns `override` unchanged when the caller pinned a palette.
 */
function useDocumentDark(override?: boolean): boolean {
  const [dark, setDark] = React.useState(false)

  React.useEffect(() => {
    if (override !== undefined) return
    const sync = () => setDark(readDocumentDark())
    sync()
    const mo = new MutationObserver(sync)
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => mo.disconnect()
  }, [override])

  return override ?? dark
}

/** Follow `prefers-reduced-motion`. */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false)

  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return reduced
}

export function ShaderSurface({
  program,
  dark: darkOverride,
  className,
  style,
  children,
}: ShaderSurfaceProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const hostRef = React.useRef<HTMLDivElement>(null)
  const handleRef = React.useRef<ShaderHandle | null>(null)

  const dark = useDocumentDark(darkOverride)
  const reduced = usePrefersReducedMotion()

  /*
   * Mount once per program. Theme and reduced-motion go through the handle
   * rather than the dependency list: both change while the visitor is
   * looking at the surface, and remounting would recompile the shader and
   * restart time from zero — a theme toggle that makes the aurora jump.
   */
  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const handle = mountShader(canvas, program, {
      dark: readDocumentDark(),
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      // The pointer follows the whole surface, not just the canvas, so
      // content laid over the shader does not cut a hole in the tracking.
      pointerTarget: hostRef.current,
    })
    handleRef.current = handle
    return () => {
      handle.destroy()
      handleRef.current = null
    }
  }, [program])

  React.useEffect(() => {
    handleRef.current?.setTheme(dark)
  }, [dark])

  React.useEffect(() => {
    handleRef.current?.setReducedMotion(reduced)
  }, [reduced])

  const palette = dark ? program.dark : program.light

  return (
    <div
      ref={hostRef}
      className={className}
      style={{ position: 'relative', isolation: 'isolate', ...style }}
    >
      <canvas
        ref={canvasRef}
        /*
         * The fallback is on the canvas itself rather than on a sibling: a
         * canvas with no context — no WebGL, a driver that refused the
         * shader, a browser that blocked it — is a transparent rectangle,
         * and it still has its own background behind it. Nothing to
         * coordinate, nothing to hide on success.
         */
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          background: fallbackBackground(palette),
        }}
        // Decoration. The content over it is what anybody reads.
        aria-hidden="true"
      />
      {children != null && <div style={{ position: 'relative' }}>{children}</div>}
    </div>
  )
}
