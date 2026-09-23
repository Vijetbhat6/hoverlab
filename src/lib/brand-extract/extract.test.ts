import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { extractBrand, parseCssColor } from './extract'
import { AA_DARK_L, AA_LIGHT_L, nearestFontId, themeFromExtraction } from './to-theme'
import { contrastRatio, oklchToRgb, rgbToHex } from '@/lib/color-tools'
import { stylesheetUrls, normalizeInput, InvalidUrlError } from './from-url'
import { DEFAULT_THEME } from '@/lib/theme-studio'

/**
 * A brand reader is only worth having if it is right where it can be and
 * silent where it cannot. So the cases here are the sites built to fool it —
 * a Tailwind default, a white theme-color, a monochrome brand, a stylesheet
 * of resets — not the friendly ones.
 */

function read(css: string, html = '<html><head><title>Acme</title></head></html>') {
  // Pad past the thin-CSS threshold so the note under test is the one wanted.
  return extractBrand({
    url: 'https://acme.test/',
    html,
    stylesheets: [{ url: 'https://acme.test/a.css', css: `${css}\n/*${' '.repeat(4200)}*/` }],
  })
}

describe('colour values', () => {
  const rgbOf = (input: string) => parseCssColor(input)?.rgb

  test('hex in every length', () => {
    assert.deepEqual(rgbOf('#f00'), { r: 255, g: 0, b: 0 })
    assert.deepEqual(rgbOf('#ff0000'), { r: 255, g: 0, b: 0 })
    assert.deepEqual(rgbOf('#ff0000cc'), { r: 255, g: 0, b: 0 })
    assert.equal(parseCssColor('#ff000080')?.alpha.toFixed(2), '0.50')
  })

  test('rgb() in the comma, space and percent forms', () => {
    assert.deepEqual(rgbOf('rgb(109, 40, 217)'), { r: 109, g: 40, b: 217 })
    assert.deepEqual(rgbOf('rgb(109 40 217)'), { r: 109, g: 40, b: 217 })
    assert.deepEqual(rgbOf('rgb(109 40 217 / 0.4)'), { r: 109, g: 40, b: 217 })
    assert.equal(parseCssColor('rgb(109 40 217 / 0.4)')?.alpha, 0.4)
    assert.deepEqual(rgbOf('rgb(100% 0% 0%)'), { r: 255, g: 0, b: 0 })
  })

  test('hsl(), and the bare channels shadcn puts in --primary', () => {
    assert.deepEqual(rgbOf('hsl(0 100% 50%)'), { r: 255, g: 0, b: 0 })
    assert.deepEqual(rgbOf('hsl(120, 100%, 25%)'), { r: 0, g: 128, b: 0 })
    assert.deepEqual(rgbOf('0 100% 50%'), { r: 255, g: 0, b: 0 })
  })

  test('oklch()', () => {
    const rgb = rgbOf('oklch(0.55 0.2 160)')
    assert.ok(rgb && rgb.g > rgb.r && rgb.g > rgb.b, 'a green')
  })

  test('things that are not literal colours are refused, not guessed', () => {
    for (const value of ['var(--x)', 'currentColor', 'transparent', 'red', 'color-mix(in srgb, red, blue)', '', 'hsl(var(--primary))']) {
      assert.equal(parseCssColor(value), null, value)
    }
  })
})

describe('the brand colour', () => {
  test('a declared --primary beats a colour that is merely used more', () => {
    const e = read(`
      :root { --primary: #6d28d9; }
      .a { color: #d97706 } .b { color: #d97706 } .c { background: #d97706 } .d { color: #d97706 }
      .btn { background-color: #d97706 } .btn2 { background-color: #d97706 }
    `)
    assert.equal(e.primary?.value.hex, '#6d28d9')
    assert.equal(e.primary?.confidence, 'high')
    assert.match(e.primary!.source, /--primary/)
  })

  test('Tailwind\'s default blue ring is not a brand', () => {
    const e = read(`*, ::before { --tw-ring-color: rgb(59 130 246 / .5); --tw-shadow-color: #3b82f6; }`)
    assert.equal(e.primary, null)
  })

  test('a white theme-color is nothing; a coloured one is a medium-confidence answer', () => {
    assert.equal(read('', '<meta name="theme-color" content="#ffffff">').primary, null)
    const e = read('', '<meta name="theme-color" content="#0f766e">')
    assert.equal(e.primary?.value.hex, '#0f766e')
    assert.equal(e.primary?.confidence, 'medium')
  })

  test('shadcn bare-channel variables are understood', () => {
    const e = read(':root { --primary: 262 83% 58%; --background: 0 0% 100%; }')
    assert.ok(e.primary)
    assert.equal(e.primary.confidence, 'high')
  })

  test('counting is the last resort, and says it is a guess', () => {
    const e = read(`
      .btn { background: #e11d48 } .btn-lg { background: #e11d48 } .cta { background-color: #e11d48 }
      a { color: #e11d48 } body { color: #111 }
    `)
    assert.equal(e.primary?.value.hex, '#e11d48')
    assert.equal(e.primary?.confidence, 'low')
    assert.ok(e.notes.some((n) => /guess/i.test(n)))
  })

  test('a monochrome site yields no colour and says why', () => {
    // Enough neutral colour declarations that this reads as a deliberate
    // black-and-white site, not a runtime-styled one with nothing to read.
    const greys = Array.from({ length: 10 }, (_, i) => `.g${i}{color:#${i}${i}${i}}`).join('')
    const e = read(`body { color: #111; background: #fff } ${greys}`)
    assert.equal(e.primary, null)
    assert.ok(e.notes.some((n) => /monochrome/i.test(n)))
  })

  test('a site with almost no colour in its CSS is reported as runtime-styled, not monochrome', () => {
    const e = read('body { margin: 0 } .a { display: flex }')
    assert.equal(e.primary, null)
    assert.ok(e.notes.some((n) => /runtime from JavaScript/i.test(n)))
    assert.ok(!e.notes.some((n) => /looks monochrome/i.test(n)))
  })

  test('near-identical shades merge instead of splitting the vote', () => {
    const e = read('.a{color:#2563eb}.b{color:#2564eb}.c{color:#2662eb}.d{color:#16a34a}')
    assert.equal(e.palette.filter((p) => /^#2[56]/.test(p.hex)).length, 1)
  })

  test('translucent colours are ignored: a 10% wash is not a brand', () => {
    assert.equal(read('.a{background:rgb(37 99 235 / 0.08)}').primary, null)
  })

  test('a colour buried in a background shorthand is found', () => {
    const e = read('.btn{background:#7c3aed url(x.png) no-repeat}.btn2{background:#7c3aed}.btn3{background:#7c3aed}')
    assert.equal(e.primary?.value.hex, '#7c3aed')
  })

  test('the palette never contains a grey', () => {
    const e = read(':root{--primary:#6d28d9}.a{color:#777}.b{color:#eee}.c{color:#0f766e}')
    for (const entry of e.palette) assert.notEqual(entry.hex, '#777777')
  })
})

describe('fonts', () => {
  test('the base font-family wins, and system fallbacks are skipped', () => {
    const e = read(`body { font-family: "Inter", system-ui, sans-serif }`)
    assert.equal(e.bodyFont?.value.name, 'Inter')
    assert.equal(e.bodyFont?.value.kind, 'sans')
    assert.equal(e.bodyFont?.confidence, 'medium')
  })

  test('next/font\'s hashed names are cleaned', () => {
    const e = read(`body { font-family: '__Inter_a1b2c3d4', '__Inter_Fallback_a1b2c3d4', system-ui }`)
    assert.equal(e.bodyFont?.value.name, 'Inter')
  })

  test('icon fonts are not the brand typeface', () => {
    const e = read(`.i { font-family: "Font Awesome 6 Free" } .j { font-family: "Material Icons" } body { font-family: Lora, serif }`)
    assert.equal(e.bodyFont?.value.name, 'Lora')
    assert.equal(e.bodyFont?.value.kind, 'serif')
  })

  test('a different heading face is reported separately', () => {
    const e = read(`body { font-family: Inter, sans-serif } h1, h2 { font-family: "Playfair Display", serif }`)
    assert.equal(e.headingFont?.value.name, 'Playfair Display')
    assert.equal(e.headingFont?.value.kind, 'serif')
  })

  test('a heading in the same face as the body is not reported twice', () => {
    const e = read(`body { font-family: Inter } h1 { font-family: Inter }`)
    assert.equal(e.headingFont, null)
  })

  test('Google Fonts links count as a deliberate choice', () => {
    const e = read('', `<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;700&display=swap" rel="stylesheet">`)
    assert.equal(e.bodyFont?.value.name, 'DM Sans')
  })

  test('nothing declared means nothing claimed', () => {
    assert.equal(read('.x{color:red}').bodyFont, null)
  })
})

describe('corner radius', () => {
  test('a --radius variable is a high-confidence answer', () => {
    const e = read(':root { --radius: 0.5rem }')
    assert.equal(e.radius?.value.rem, 0.5)
    assert.equal(e.radius?.confidence, 'high')
  })

  test('the modal component radius wins when there is no variable', () => {
    const e = read('.btn{border-radius:8px}.card{border-radius:8px}.input{border-radius:8px}.x{border-radius:4px}')
    assert.equal(e.radius?.value.rem, 0.5)
    assert.equal(e.radius?.confidence, 'low')
  })

  test('a reset\'s border-radius: 0 is not a square brand', () => {
    const e = read('*,::before{border-radius:0}img{border-radius:0}.x{border-radius:0}')
    assert.equal(e.radius, null)
  })

  test('deliberately square buttons and cards are square', () => {
    const e = read('.btn{border-radius:0}.card{border-radius:0}.button-x{border-radius:0}')
    assert.equal(e.radius?.value.rem, 0)
  })

  test('pill buttons are recognised', () => {
    const e = read('.btn{border-radius:9999px}.btn-2{border-radius:999px}.button{border-radius:9999px}')
    assert.equal(e.radius?.value.label, 'pill')
  })

  test('a 50% avatar circle is not a radius', () => {
    assert.equal(read('.avatar{border-radius:50%}.avatar2{border-radius:50%}').radius, null)
  })
})

describe('what it says about itself', () => {
  test('too little CSS reads as a runtime-styled site', () => {
    const e = extractBrand({ url: 'https://spa.test/', html: '<html></html>', stylesheets: [] })
    assert.ok(e.notes.some((n) => /JavaScript/.test(n)))
  })

  test('the title and the size of what was read are reported', () => {
    const e = read('')
    assert.equal(e.title, 'Acme')
    assert.equal(e.scanned.stylesheets, 1)
  })
})

describe('applying it', () => {
  test('hue and chroma come from the site; lightness is pinned to the AA-tuned values', () => {
    const e = read(':root{--primary:#6d28d9}')
    const { theme, applied } = themeFromExtraction(e)
    assert.ok(applied.includes('accent'))
    assert.equal(theme.accent.lightL, AA_LIGHT_L)
    assert.equal(theme.accent.darkL, AA_DARK_L)
    assert.notEqual(theme.accent.hue, DEFAULT_THEME.accent.hue)
  })

  test('the pinned lightness clears AA for every hue a site could hand us', () => {
    // White text on the primary (a button), and the primary as text on the
    // dark theme's page. Chroma at the ceiling, because that is where sRGB
    // clipping pulls lightness around the most.
    for (let hue = 0; hue < 360; hue += 10) {
      for (const chroma of [0.07, 0.14, 0.2, 0.3]) {
        const light = rgbToHex(oklchToRgb({ l: AA_LIGHT_L, c: chroma, h: hue }))
        const dark = rgbToHex(oklchToRgb({ l: AA_DARK_L, c: chroma * 0.9, h: hue }))
        const onLight = contrastRatio('#ffffff', light) ?? 0
        const onDark = contrastRatio(dark, '#09090b') ?? 0
        assert.ok(onLight >= 4.5, `white on primary, hue ${hue} chroma ${chroma}: ${onLight.toFixed(2)}`)
        assert.ok(onDark >= 4.5, `primary on dark page, hue ${hue} chroma ${chroma}: ${onDark.toFixed(2)}`)
      }
    }
  })

  test('the pinned values are the ones the stylesheet ships', async () => {
    const { readFile } = await import('node:fs/promises')
    const css = await readFile(new URL('../../app/globals.css', import.meta.url), 'utf8')
    assert.match(css, new RegExp(`--brand-light-l:\\s*${AA_LIGHT_L}\\b`))
    assert.match(css, new RegExp(`--brand-dark-l:\\s*${AA_DARK_L}\\b`))
  })

  test('nothing found leaves the theme exactly as it was', () => {
    const e = read('body{color:#111}')
    const { theme, applied, studioHref } = themeFromExtraction(e)
    assert.deepEqual(theme, DEFAULT_THEME)
    assert.deepEqual(applied, [])
    assert.equal(studioHref, '/studio')
  })

  test('an unshipped typeface is substituted, and the substitution is reported', () => {
    const e = read('body{font-family:Inter,sans-serif}')
    const result = themeFromExtraction(e)
    assert.equal(result.theme.fontId, 'geist')
    assert.equal(result.substitutions.length, 1)
    assert.match(result.substitutions[0]!, /Inter/)
  })

  test('a shipped typeface is applied exactly, with no substitution note', () => {
    const e = read('body{font-family:"Space Grotesk",sans-serif}')
    const result = themeFromExtraction(e)
    assert.equal(result.theme.fontId, 'grotesk')
    assert.deepEqual(result.substitutions, [])
  })

  test('nearestFontId maps by kind, and system stacks to the system option', () => {
    assert.deepEqual(nearestFontId('Georgia', 'serif', false), { id: 'serif', exact: false })
    assert.deepEqual(nearestFontId('Fira Code', 'mono', false), { id: 'mono', exact: false })
    assert.deepEqual(nearestFontId('Helvetica', 'sans', true), { id: 'system', exact: false })
    assert.deepEqual(nearestFontId('Geist', 'sans', false), { id: 'geist', exact: true })
  })

  test('the Studio link carries the same axes the theme has', () => {
    const e = read(':root{--primary:#6d28d9;--radius:0.5rem}body{font-family:Lora,serif}')
    const { studioHref, theme } = themeFromExtraction(e)
    const params = new URL(studioHref, 'https://x.test').searchParams
    assert.equal(Number(params.get('hue')), theme.accent.hue)
    assert.equal(Number(params.get('radius')), 0.5)
    assert.equal(params.get('font'), 'serif')
  })
})

/**
 * Each of these was a wrong answer on a real site, found by running the
 * extractor against stripe.com, ui.shadcn.com, vercel.com and others, not by
 * anticipating it. They are here so it stays fixed.
 */
describe('learned from real sites', () => {
  test('a theme class\'s --primary is not the site\'s: only the default scope speaks', () => {
    const e = read(`
      :root { --primary: #0f766e }
      .theme-rose { --primary: #e11d48 } .theme-violet { --primary: #7c3aed }
    `)
    assert.equal(e.primary?.value.hex, '#0f766e')
  })

  test('a neutral --primary is an answer: counting does not crown a chart colour after it', () => {
    const e = read(`
      :root { --primary: 0 0% 9% }
      .chart-1 { background: #e11d48 } .chart-2 { background: #e11d48 } .chart-3 { background: #e11d48 }
      .btn { background: #e11d48 } .btn2 { background: #e11d48 }
    `)
    assert.equal(e.primary, null)
    assert.ok(e.notes.some((n) => /neutral/i.test(n) && /--primary/.test(n)))
  })

  test('a dark-mode :root does not override the light one', () => {
    const e = read(`
      :root { --primary: #0f766e }
      @media (prefers-color-scheme: dark) { :root { --primary: #f97316 } }
    `)
    assert.equal(e.primary?.value.hex, '#0f766e')
  })

  test('dark media stripping is balanced: rules after the block are still read', () => {
    const e = read(`
      @media (prefers-color-scheme: dark) { a { color: red } .x { .y { color: blue } } }
      :root { --primary: #0f766e }
    `)
    assert.equal(e.primary?.value.hex, '#0f766e')
  })

  test('--accent is read but never called declared, and --primary beats it', () => {
    const accentOnly = read(':root { --accent: #32b279 }')
    assert.equal(accentOnly.primary?.confidence, 'medium')
    const both = read(':root { --accent: #32b279; --primary: #6d28d9 }')
    assert.equal(both.primary?.value.hex, '#6d28d9')
    assert.equal(both.primary?.confidence, 'high')
  })

  test('var(--x) is followed for colours', () => {
    const e = read(':root { --brand-500: #6d28d9; --primary: var(--brand-500) }')
    assert.equal(e.primary?.value.hex, '#6d28d9')
  })

  test('font-weight and font-size variables are not typefaces', () => {
    const e = read(':root { --font-weight-light: 300; --font-weight-bold: 700; --font-size-lg: 18px; --font-display: swap }')
    assert.equal(e.bodyFont, null)
  })

  test('body { font-family: var(--font-sans) } resolves through next/font\'s generated class', () => {
    const e = read(`
      html, body { font-family: var(--font-sans), system-ui }
      .__variable_a1b2c3 { --font-sans: '__Geist_a1b2c3d4', '__Geist_Fallback_a1b2c3d4', system-ui }
    `)
    assert.equal(e.bodyFont?.value.name, 'Geist')
    assert.equal(e.bodyFont?.confidence, 'medium')
  })

  test('next/font\'s lower-cased single word is capitalised', () => {
    const e = read(`body { font-family: '__inter_a1b2c3d4', system-ui }`)
    assert.equal(e.bodyFont?.value.name, 'Inter')
  })

  test('a --radius on a theme class is not the site\'s radius', () => {
    const e = read('.theme-sharp { --radius: 0 } .theme-round { --radius: 1rem }')
    assert.equal(e.radius, null)
  })

  test('a --radius on :root is, including through camelCase names', () => {
    assert.equal(read(':root { --radius: 0.625rem }').radius?.value.rem, 0.625)
    const primer = read(':root { --borderRadius-medium: 6px }')
    assert.equal(primer.radius?.value.rem, 0.375)
    assert.equal(primer.radius?.confidence, 'high')
  })

  test('a component-local radius variable is not the site\'s radius', () => {
    // Stripe declares these; reading either as the site's corners reported a
    // square brand for one of the roundest sites on the web.
    const e = read(':root { --navigation-border-radius: 0; --card-radius: 0; --hole-radius: 0px }')
    assert.equal(e.radius, null)
  })

  test('a chained light-theme attribute is the default scope (github.com)', () => {
    const e = read('[data-color-mode="light"][data-light-theme="light"] { --fgcolor-accent: #0969da }')
    assert.equal(e.primary?.value.hex, '#0969da')
  })

  test('a monospace face is not the brand when nothing better is declared', () => {
    const e = read(':root { --font-mono: "Geist Mono", monospace; --font-plex: "IBM Plex Sans", sans-serif }')
    assert.equal(e.bodyFont?.value.name, 'IBM Plex Sans')
  })

  test('--font-sans outranks --font-mono on count alone', () => {
    const e = read(':root { --font-mono: "Fira Code"; --font-mono2: "Fira Code"; --font-sans: "Inter" }')
    assert.equal(e.bodyFont?.value.name, 'Inter')
  })

  test('build-tool camelCase names are spaced', () => {
    assert.equal(read("body { font-family: GeistSans, sans-serif }").bodyFont?.value.name, 'Geist Sans')
    assert.equal(read("body { font-family: SpotifyMixUI, sans-serif }").bodyFont?.value.name, 'Spotify Mix UI')
  })

  test('a site on the system font is reported as one, not as having no font', () => {
    const e = read('body { font-family: system-ui, -apple-system, sans-serif }')
    assert.equal(e.bodyFont?.value.name, 'System UI')
    assert.equal(e.bodyFont?.value.system, true)
  })

  test('a var()-valued border-radius is resolved', () => {
    const e = read(':root { --r: 8px } .btn{border-radius:var(--r)}.card{border-radius:var(--r)}.input{border-radius:var(--r)}')
    assert.equal(e.radius?.value.rem, 0.5)
  })
})

describe('reading the page', () => {
  test('stylesheets are resolved against the final URL, deduplicated, in page order', () => {
    const html = `
      <link rel="stylesheet" href="/a.css">
      <link href="b.css" rel="stylesheet">
      <link rel="preload" as="style" href="/a.css">
      <link rel="icon" href="/favicon.ico">
      <link rel="stylesheet" href="https://cdn.test/c.css?x=1&amp;y=2">`
    assert.deepEqual(stylesheetUrls(html, 'https://acme.test/deep/page'), [
      'https://acme.test/a.css',
      'https://acme.test/deep/b.css',
      'https://cdn.test/c.css?x=1&y=2',
    ])
  })

  test('no more than six are ever followed', () => {
    const html = Array.from({ length: 20 }, (_, i) => `<link rel="stylesheet" href="/${i}.css">`).join('')
    assert.equal(stylesheetUrls(html, 'https://acme.test/').length, 6)
  })

  test('a bare domain gets a scheme; nonsense is refused', () => {
    assert.equal(normalizeInput('stripe.com').href, 'https://stripe.com/')
    assert.equal(normalizeInput(' http://example.com/x ').href, 'http://example.com/x')
    for (const bad of ['', '   ', 'not a url', 'localhost', 'a'.repeat(3000)]) {
      assert.throws(() => normalizeInput(bad), InvalidUrlError, JSON.stringify(bad.slice(0, 20)))
    }
  })
})
