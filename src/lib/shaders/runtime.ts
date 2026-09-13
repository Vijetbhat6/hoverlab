/**
 * The shader runtime — one implementation, shared by every surface.
 *
 * This file is framework-free on purpose. Three very different callers need
 * to put a shader on screen and they must not each get their own copy:
 *
 *   ShaderSurface        the React component a buyer pastes into their app
 *   <ShaderRuntime/>     the DOM scanner that boots the catalog's previews,
 *                        wherever `dangerouslySetInnerHTML` dropped a canvas
 *   scripts/shot-*       the screenshot harness, which drives it headless
 *
 * The catalog injects effect markup as a string — that is how all 1,047 CSS
 * effects render, on cards this page never knew about. A shader effect's
 * markup is therefore also a string, and what it contains is a `<canvas
 * data-hoverlab-shader="aurora">`. Something has to find those canvases and
 * start them. That something calls `mountShader`, and so does the React
 * component, so preview and product cannot drift.
 *
 * SHIPPED FILE. This is one of the three files a buyer copies (see
 * `scripts/build-shader-sources.mts`), which is why it imports nothing.
 */

/* ------------------------------------------------------------------ *
 *  Program types
 * ------------------------------------------------------------------ */

/**
 * The four colours every program is given, as CSS hex.
 *
 * A shader that hardcodes its colours can only look right on one
 * background, and the catalog's standing rule is that an effect holds up in
 * both themes. Rather than trust that per design, the contract removes the
 * choice: a program gets `u_c0`, `u_c1`, `u_c2` and `u_bg` and may not name
 * a colour of its own. Switching theme swaps four vec3s and redraws — it
 * does not recompile, and it cannot miss a stray `vec3(0.1)` in a highlight.
 */
export interface ShaderPalette {
  /** Primary — the colour a visitor would name if asked what this is. */
  c0: string
  /** Secondary: the second band, the other ball, the far end of a ramp. */
  c1: string
  /** Accent, used sparingly — rims, sparks, the hot centre. */
  c2: string
  /** The surface the effect sits on. Also what the CSS fallback paints. */
  bg: string
}

interface ProgramBase {
  /** Matches the catalog id and the `data-hoverlab-shader` attribute. */
  id: string
  light: ShaderPalette
  dark: ShaderPalette
  /**
   * Multiplier on `u_time`. Authored per design rather than baked into the
   * shader, so one number is what a slider moves and what the
   * reduced-motion path freezes.
   */
  speed?: number
  /**
   * Whether the design reads `u_pointer`. Opt-in: tracking costs a
   * `pointermove` listener per surface, and most designs never read it.
   */
  pointer?: boolean
  /**
   * The moment a reduced-motion surface is frozen at, in seconds.
   *
   * Defaults to `STILL_TIME`, which is late enough that every continuous
   * design has settled into what it actually is. Designs with discrete
   * events override it: lightning is dark between strikes, so freezing it
   * at an arbitrary second has a good chance of showing an empty sky, and
   * "reduced motion" does not mean "shown nothing".
   */
  stillTime?: number
}

/**
 * A fragment shader over a fullscreen triangle.
 *
 * `fragment` defines `vec4 render(vec2 uv)` — plus any helpers it wants —
 * and nothing else. Uniforms, noise and `main()` come from `GLSL_PRELUDE`
 * and `GLSL_EPILOGUE` below, which is how a design stays 30 lines instead
 * of 130 and how fifteen designs agree on what `uv` means.
 *
 * `render` returns straight (non-premultiplied) alpha. The epilogue
 * premultiplies, once, so no design has to remember to.
 */
export interface GLProgram extends ProgramBase {
  kind: 'webgl'
  fragment: string
}

/** One frame's state, handed to a 2D program's `draw`. */
export interface Canvas2DFrame {
  /** CSS pixels — the context is already scaled for device pixel ratio. */
  width: number
  height: number
  /** Seconds since mount, advancing only while the surface is on screen. */
  time: number
  /** Pointer in 0..1 surface space, smoothed; centre when never moved. */
  pointer: { x: number; y: number }
  /** The active palette, theme-resolved, as CSS colour strings. */
  palette: ShaderPalette
  /** True when the dark palette is in use. */
  dark: boolean
}

/**
 * A 2D draw call per frame.
 *
 * Two of the fifteen designs live here, both for the same reason: they draw
 * *things*, not fields. ASCII needs glyphs — a fragment shader can fake
 * them with bit-packed bitmaps, and the result is a shader nobody can edit.
 * Particles need a list that survives between frames. Everything that is
 * genuinely a per-pixel function is a shader.
 */
export interface Canvas2DProgram extends ProgramBase {
  kind: 'canvas'
  /**
   * Per-surface state, created once at mount. Particle positions live here
   * rather than in module scope, so two cards showing the same effect do
   * not share one swarm.
   */
  init?: (frame: Canvas2DFrame) => unknown
  draw: (ctx: CanvasRenderingContext2D, frame: Canvas2DFrame, state: unknown) => void
}

export type ShaderProgram = GLProgram | Canvas2DProgram

/* ------------------------------------------------------------------ *
 *  The GLSL contract
 * ------------------------------------------------------------------ */

/**
 * Everything a design may assume exists, prepended to its `fragment`.
 *
 * Targets GLSL ES 1.00 (WebGL 1) rather than 3.00: WebGL 2 is everywhere
 * that matters now, but a WebGL 1 shader runs on both and the designs use
 * nothing that would benefit from the newer language. Loop bounds are
 * constant throughout for the same reason — ES 1.00 only guarantees
 * constant-expression bounds, and a driver that rejects a dynamic one does
 * it at compile time on somebody else's phone.
 *
 * `highp` is requested and `mediump` accepted: precision qualifiers are not
 * guaranteed in fragment shaders on WebGL 1, and the fallback is the
 * difference between banding and a blank canvas.
 */
export const GLSL_PRELUDE = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_pointer;
uniform vec3  u_c0;
uniform vec3  u_c1;
uniform vec3  u_c2;
uniform vec3  u_bg;

const float PI = 3.141592653589793;

mat2 rot(float a) {
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c);
}

/** One of the three palette colours, by index. Avoids arrays in ES 1.00. */
vec3 palette(float i) {
  return i < 0.5 ? u_c0 : (i < 1.5 ? u_c1 : u_c2);
}

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}

/** Value noise. Cheaper than gradient noise and indistinguishable under fbm. */
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

/** Five octaves, each rotated so the lattice never shows as a grid. */
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * vnoise(p);
    p = rot(0.5) * p * 2.02;
    a *= 0.5;
  }
  return v;
}

/** 0..1 uv to aspect-corrected -1..1, so circles stay circular. */
vec2 aspect(vec2 uv) {
  vec2 p = uv * 2.0 - 1.0;
  p.x *= u_resolution.x / u_resolution.y;
  return p;
}

/** Ordered-dither thresholds, used by more than one design. */
float bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2.0 + a.y * a.y * 0.75);
}
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }
`

/** `main()`, appended after the design's `render`. */
export const GLSL_EPILOGUE = `
void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec4 c = render(uv);
  gl_FragColor = vec4(clamp(c.rgb, 0.0, 1.0) * c.a, c.a);
}
`

const VERTEX_SOURCE = `attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`

/* ------------------------------------------------------------------ *
 *  The fallback
 * ------------------------------------------------------------------ */

/**
 * What the surface shows when the shader cannot run.
 *
 * Every shader effect paints this behind its canvas, and a canvas with no
 * context is a transparent rectangle — so a visitor with WebGL disabled, a
 * driver on a blocklist, a browser in a lockdown mode, or simply a slow
 * first paint sees a gradient in the design's own colours rather than a
 * hole in the page.
 *
 * Derived from the palette rather than authored per design, which is the
 * point: a hand-written fallback is a second copy of the design's colours,
 * and it goes stale the first time somebody retunes a palette and does not
 * think about the case they cannot see.
 */
export function fallbackBackground(palette: ShaderPalette): string {
  return `linear-gradient(145deg, ${palette.bg} 0%, ${palette.c0} 58%, ${palette.c1} 100%)`
}

/* ------------------------------------------------------------------ *
 *  Noise, for the 2D programs
 * ------------------------------------------------------------------ */

/**
 * The same value noise the prelude gives shaders, in JavaScript.
 *
 * The two 2D designs need a coherent field just as much as the thirteen
 * shaders do, and they cannot reach into GLSL for it. Kept here rather than
 * copied into each: it is shipped alongside them either way, and two
 * hand-tuned hash constants that drift apart is a bug nobody would find.
 */
export function hash2D(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return s - Math.floor(s)
}

/** Value noise in 2D, smoothstep-interpolated. Range 0..1. */
export function noise2D(x: number, y: number): number {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const fx = x - ix
  const fy = y - iy
  const ux = fx * fx * (3 - 2 * fx)
  const uy = fy * fy * (3 - 2 * fy)

  const a = hash2D(ix, iy)
  const b = hash2D(ix + 1, iy)
  const c = hash2D(ix, iy + 1)
  const d = hash2D(ix + 1, iy + 1)

  return (a + (b - a) * ux) * (1 - uy) + (c + (d - c) * ux) * uy
}

/** Four octaves of `noise2D`. Range 0..1. */
export function fbm2D(x: number, y: number): number {
  let v = 0
  let a = 0.5
  let px = x
  let py = y
  for (let i = 0; i < 4; i++) {
    v += a * noise2D(px, py)
    // Rotate between octaves so the lattice never shows as a grid.
    const nx = px * 1.74 - py * 1.02
    py = px * 1.02 + py * 1.74
    px = nx
    a *= 0.5
  }
  return v
}

/* ------------------------------------------------------------------ *
 *  Mounting
 * ------------------------------------------------------------------ */

export interface MountOptions {
  /** Which palette to use. Flip it with `setTheme`, not by remounting. */
  dark: boolean
  /**
   * Freeze on a single representative frame instead of animating.
   *
   * Not "render nothing": a still aurora is still an aurora, and the
   * visitor who asked for less motion still came to look at the catalog.
   * See `STILL_TIME`.
   */
  reducedMotion?: boolean
  /**
   * Element whose pointer position drives `u_pointer`. Defaults to the
   * canvas; card previews pass the whole card, so the effect answers the
   * pointer anywhere on the tile rather than only over the canvas itself.
   */
  pointerTarget?: HTMLElement | null
  /**
   * Called when the surface cannot run at all — no WebGL, a shader that
   * failed to compile, a context that was lost and never came back. The
   * caller's job is to leave the CSS fallback visible; every shader
   * effect's markup paints one behind the canvas for exactly this.
   */
  onFallback?: (reason: string) => void
}

export interface ShaderHandle {
  setTheme: (dark: boolean) => void
  setReducedMotion: (reduced: boolean) => void
  /** Render one frame now, whatever the run state. Used by the screenshotter. */
  redraw: () => void
  destroy: () => void
}

/**
 * The moment a frozen surface is rendered at.
 *
 * Zero is the wrong choice: most of these designs start from a symmetric or
 * empty state — the metaballs are stacked, the lightning has not struck,
 * the particles are on their seed lattice — and freezing there shows the
 * one frame that does not look like the effect. A few seconds in, every
 * design has settled into what it actually is.
 */
const STILL_TIME = 6.2

/** Device pixel ratio is capped: a 3x aurora is invisible and costs 9x. */
const MAX_DPR = 2

const NOOP_HANDLE: ShaderHandle = {
  setTheme: () => {},
  setReducedMotion: () => {},
  redraw: () => {},
  destroy: () => {},
}

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.trim().replace('#', '')
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  const n = Number.parseInt(h, 16)
  if (!Number.isFinite(n)) return [0, 0, 0]
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

/**
 * Start a program on a canvas. Returns a handle; call `destroy` on unmount.
 *
 * Safe to call with a canvas that is off screen, zero-sized, or in a
 * document that never becomes visible — nothing is drawn until an
 * `IntersectionObserver` says the surface is on screen, and nothing keeps
 * running once it leaves. A 24-card grid of shaders therefore costs the
 * frames of the four cards a visitor can actually see.
 */
export function mountShader(
  canvas: HTMLCanvasElement,
  program: ShaderProgram,
  opts: MountOptions,
): ShaderHandle {
  if (typeof window === 'undefined') return NOOP_HANDLE

  let dark = opts.dark
  let reduced = opts.reducedMotion === true
  let disposed = false

  /* -- Shared frame state ------------------------------------------ */

  let width = 0
  let height = 0
  let dpr = 1
  let time = 0
  let lastFrame = 0
  let raf = 0
  let onScreen = false
  const pointer = { x: 0.5, y: 0.5 }
  const pointerTarget = { x: 0.5, y: 0.5 }
  const speed = program.speed ?? 1

  const fail = (reason: string) => {
    canvas.dataset.shaderState = 'fallback'
    opts.onFallback?.(reason)
    return NOOP_HANDLE
  }

  /**
   * Match the drawing buffer to the element's CSS box.
   *
   * Returns whether anything changed, because for WebGL a resize means a
   * new viewport and for 2D it means the transform has to be re-applied —
   * and on a card that never resizes, both are wasted work every frame.
   */
  const resize = (): boolean => {
    const rect = canvas.getBoundingClientRect()
    const nextDpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
    const w = Math.max(1, Math.round(rect.width))
    const h = Math.max(1, Math.round(rect.height))
    if (w === width && h === height && nextDpr === dpr) return false
    width = w
    height = h
    dpr = nextDpr
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    return true
  }

  /* -- Per-kind renderers ------------------------------------------ */

  const renderers = {
    webgl: () => setupGL(canvas, program as GLProgram, fail),
    canvas: () => setupCanvas2D(canvas, program as Canvas2DProgram, fail),
  }
  const backend = renderers[program.kind]()
  if (!backend) return NOOP_HANDLE

  const draw = () => {
    if (disposed) return
    resize()
    if (width === 0 || height === 0) return
    backend.draw({
      width,
      height,
      dpr,
      time,
      pointer,
      palette: dark ? program.dark : program.light,
      dark,
    })
    canvas.dataset.shaderState = 'running'
  }

  /* -- The loop ----------------------------------------------------- */

  const tick = (now: number) => {
    raf = 0
    if (disposed) return
    const dt = lastFrame === 0 ? 0 : Math.min((now - lastFrame) / 1000, 1 / 15)
    lastFrame = now
    time += dt * speed
    if (program.pointer) {
      // Exponential ease rather than a hard set: a pointer that jumps
      // 400px between two frames should drag the effect with it, not
      // teleport it.
      pointer.x += (pointerTarget.x - pointer.x) * 0.12
      pointer.y += (pointerTarget.y - pointer.y) * 0.12
    }
    draw()
    schedule()
  }

  const schedule = () => {
    if (disposed || raf !== 0) return
    if (reduced || !onScreen || document.hidden) return
    raf = window.requestAnimationFrame(tick)
  }

  const stop = () => {
    if (raf !== 0) {
      window.cancelAnimationFrame(raf)
      raf = 0
    }
    lastFrame = 0
  }

  const start = () => {
    if (reduced) {
      // One frame, at a moment that looks like the effect, then nothing.
      time = program.stillTime ?? STILL_TIME
      draw()
      return
    }
    schedule()
  }

  /* -- What starts and stops it ------------------------------------- */

  const io = new IntersectionObserver(
    (entries) => {
      const next = entries.some((e) => e.isIntersecting)
      if (next === onScreen) return
      onScreen = next
      if (onScreen) start()
      else stop()
    },
    { rootMargin: '120px' },
  )
  io.observe(canvas)

  const ro =
    typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(() => {
          // A resize while frozen still has to repaint: the frame on screen
          // was drawn for a box that no longer exists.
          if (reduced || !onScreen) draw()
        })
  ro?.observe(canvas)

  const onVisibility = () => {
    if (document.hidden) stop()
    else if (onScreen) start()
  }
  document.addEventListener('visibilitychange', onVisibility)

  /* -- Pointer ------------------------------------------------------ */

  const target = opts.pointerTarget ?? canvas
  const onPointerMove = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    pointerTarget.x = (e.clientX - rect.left) / rect.width
    // Flipped: GL's origin is bottom-left, the DOM's is top-left, and a
    // design that reacts to the pointer should react upward when the
    // pointer moves up.
    pointerTarget.y = 1 - (e.clientY - rect.top) / rect.height
  }
  const onPointerLeave = () => {
    pointerTarget.x = 0.5
    pointerTarget.y = 0.5
  }
  if (program.pointer) {
    target.addEventListener('pointermove', onPointerMove)
    target.addEventListener('pointerleave', onPointerLeave)
  }

  /* -- Context loss -------------------------------------------------- */

  const onContextLost = (e: Event) => {
    // Without preventDefault the context is never restored, and the card is
    // blank for the rest of the session.
    e.preventDefault()
    stop()
    canvas.dataset.shaderState = 'lost'
  }
  const onContextRestored = () => {
    if (disposed) return
    if (!backend.restore()) {
      fail('context restore failed')
      return
    }
    width = 0
    height = 0
    if (onScreen) start()
  }
  canvas.addEventListener('webglcontextlost', onContextLost)
  canvas.addEventListener('webglcontextrestored', onContextRestored)

  return {
    setTheme: (nextDark: boolean) => {
      if (nextDark === dark) return
      dark = nextDark
      // Repaint immediately even when frozen or off screen: a theme switch
      // that only lands on the next scroll reads as a broken preview.
      draw()
    },
    setReducedMotion: (nextReduced: boolean) => {
      if (nextReduced === reduced) return
      reduced = nextReduced
      stop()
      if (onScreen) start()
    },
    redraw: draw,
    destroy: () => {
      disposed = true
      stop()
      io.disconnect()
      ro?.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      if (program.pointer) {
        target.removeEventListener('pointermove', onPointerMove)
        target.removeEventListener('pointerleave', onPointerLeave)
      }
      canvas.removeEventListener('webglcontextlost', onContextLost)
      canvas.removeEventListener('webglcontextrestored', onContextRestored)
      backend.destroy()
    },
  }
}

/* ------------------------------------------------------------------ *
 *  Backends
 * ------------------------------------------------------------------ */

interface DrawState {
  width: number
  height: number
  dpr: number
  time: number
  pointer: { x: number; y: number }
  palette: ShaderPalette
  dark: boolean
}

interface Backend {
  draw: (s: DrawState) => void
  /** Rebuild after a lost context. False means give up and fall back. */
  restore: () => boolean
  destroy: () => void
}

function setupGL(
  canvas: HTMLCanvasElement,
  program: GLProgram,
  fail: (reason: string) => ShaderHandle,
): Backend | null {
  // `alpha: true` with `premultipliedAlpha: true` is what lets a design
  // return alpha < 1 and sit over whatever the page put behind it — the
  // orb and the lightning both do, and compositing them onto an opaque
  // black square would defeat the point of the CSS fallback underneath.
  const attrs: WebGLContextAttributes = {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: true,
    powerPreference: 'low-power',
    preserveDrawingBuffer: true,
  }

  const gl =
    (canvas.getContext('webgl', attrs) as WebGLRenderingContext | null) ??
    (canvas.getContext('experimental-webgl', attrs) as WebGLRenderingContext | null)

  if (!gl) {
    fail('no webgl context')
    return null
  }

  let glProgram: WebGLProgram | null = null
  let buffer: WebGLBuffer | null = null
  let uniforms: Record<string, WebGLUniformLocation | null> = {}
  let lastW = -1
  let lastH = -1

  const compile = (type: number, source: string): WebGLShader | null => {
    const shader = gl.createShader(type)
    if (!shader) return null
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      // Kept as a warning rather than a throw: one design failing to
      // compile on one driver should cost that card its animation, not the
      // page its render.
      console.warn(
        `[hoverlab] shader "${program.id}" failed to compile:\n${gl.getShaderInfoLog(shader)}`,
      )
      gl.deleteShader(shader)
      return null
    }
    return shader
  }

  const build = (): boolean => {
    const vs = compile(gl.VERTEX_SHADER, VERTEX_SOURCE)
    const fs = compile(
      gl.FRAGMENT_SHADER,
      GLSL_PRELUDE + program.fragment + GLSL_EPILOGUE,
    )
    if (!vs || !fs) return false

    const p = gl.createProgram()
    if (!p) return false
    gl.attachShader(p, vs)
    gl.attachShader(p, fs)
    gl.linkProgram(p)
    // The shader objects are referenced by the program now; keeping them
    // alive leaks one pair per card in a grid that scrolls.
    gl.deleteShader(vs)
    gl.deleteShader(fs)
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      console.warn(`[hoverlab] shader "${program.id}" failed to link:\n${gl.getProgramInfoLog(p)}`)
      gl.deleteProgram(p)
      return false
    }

    glProgram = p
    gl.useProgram(p)

    // A fullscreen *triangle*, not a quad: two triangles meeting on the
    // diagonal make the GPU shade that seam twice, and one oversized
    // triangle clipped to the viewport covers the same pixels once.
    buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    )
    const loc = gl.getAttribLocation(p, 'a_pos')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    uniforms = {}
    for (const name of ['u_resolution', 'u_time', 'u_pointer', 'u_c0', 'u_c1', 'u_c2', 'u_bg']) {
      uniforms[name] = gl.getUniformLocation(p, name)
    }
    lastW = -1
    lastH = -1
    return true
  }

  if (!build()) {
    fail('shader build failed')
    return null
  }

  return {
    draw: (s) => {
      if (!glProgram || gl.isContextLost()) return
      const w = canvas.width
      const h = canvas.height
      if (w !== lastW || h !== lastH) {
        gl.viewport(0, 0, w, h)
        lastW = w
        lastH = h
      }
      gl.useProgram(glProgram)
      gl.uniform2f(uniforms.u_resolution, w, h)
      gl.uniform1f(uniforms.u_time, s.time)
      gl.uniform2f(uniforms.u_pointer, s.pointer.x, s.pointer.y)
      const c0 = hexToRgb(s.palette.c0)
      const c1 = hexToRgb(s.palette.c1)
      const c2 = hexToRgb(s.palette.c2)
      const bg = hexToRgb(s.palette.bg)
      gl.uniform3f(uniforms.u_c0, c0[0], c0[1], c0[2])
      gl.uniform3f(uniforms.u_c1, c1[0], c1[1], c1[2])
      gl.uniform3f(uniforms.u_c2, c2[0], c2[1], c2[2])
      gl.uniform3f(uniforms.u_bg, bg[0], bg[1], bg[2])
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    },
    restore: build,
    destroy: () => {
      if (gl.isContextLost()) return
      if (buffer) gl.deleteBuffer(buffer)
      if (glProgram) gl.deleteProgram(glProgram)
      // Frees the drawing buffer now rather than whenever the GC gets to
      // it. Browsers cap live contexts at ~16; a catalog grid scrolled for
      // a minute will hit that.
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
  }
}

function setupCanvas2D(
  canvas: HTMLCanvasElement,
  program: Canvas2DProgram,
  fail: (reason: string) => ShaderHandle,
): Backend | null {
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    fail('no 2d context')
    return null
  }

  let state: unknown = null
  let seededFor = ''

  return {
    draw: (s) => {
      const frame: Canvas2DFrame = {
        width: s.width,
        height: s.height,
        time: s.time,
        pointer: s.pointer,
        palette: s.palette,
        dark: s.dark,
      }
      // Re-seed on a real resize, not on every frame: a particle field laid
      // out for a 320px card is wrong at 900px, and re-seeding every frame
      // is a field that never moves.
      const key = `${s.width}x${s.height}`
      if (key !== seededFor) {
        state = program.init ? program.init(frame) : null
        seededFor = key
      }
      ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0)
      /*
       * The backend paints the palette's background before the program
       * draws, rather than clearing to transparent.
       *
       * A fragment shader covers every pixel it is given, so a WebGL design
       * is opaque by construction. A 2D program draws a few hundred glyphs
       * or dots and leaves the rest alone — so clearing left both 2D
       * designs showing whatever was behind the canvas, which is the CSS
       * *fallback* gradient. A fallback that is load-bearing for two of the
       * fifteen is not a fallback, and the two designs looked wrong in
       * light mode for exactly that reason: their background was a gradient
       * tuned to stand in for them, not to sit under them.
       */
      ctx.fillStyle = s.palette.bg
      ctx.fillRect(0, 0, s.width, s.height)
      program.draw(ctx, frame, state)
    },
    restore: () => true,
    destroy: () => {
      state = null
    },
  }
}
