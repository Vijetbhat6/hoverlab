/**
 * Turning an ISO country code into something a person recognises.
 *
 * Used by the PPP bar, which is handed a two-letter code by
 * /api/billing/pricing and has to open with the visitor's own country
 * rather than with the band name. "Band A" is an internal fact about our
 * pricing table; "Nigeria" is the thing that makes somebody believe the
 * number beside it applies to them.
 *
 * Nothing here decides a price. See `lib/billing/region.ts` for the code
 * that does, and note that twenty-one countries share 'ppp-a' — so a
 * country name is never enough to work out what anyone is charged.
 */

/** First regional indicator symbol, 🇦, which stands in for 'A'. */
const REGIONAL_INDICATOR_A = 0x1f1e6
const LATIN_A = 'A'.charCodeAt(0)

/**
 * The flag emoji for a country code, or null.
 *
 * A flag emoji is two regional indicator symbols, and every pair is valid
 * to build even where no flag exists for it — "ZZ" produces 🇿🇿, which
 * renders as two boxed letters. So this validates the shape first and
 * leaves the caller to have validated the country.
 *
 * WHAT THIS LOOKS LIKE ON WINDOWS
 *
 * Windows ships no flag glyphs, and Chrome and Edge on it do not substitute
 * any — so 🇮🇳 renders there as a boxed "IN" rather than as a flag. That is
 * not a bug to route around with an SVG flag set (thirty-six files, each a
 * political assertion somebody will file an issue about). It degrades to
 * the country's own two letters, sitting immediately beside the country's
 * full name in the sentence, which is legible. Every caller must therefore
 * treat this as decoration: `aria-hidden`, and never the only thing saying
 * where the visitor is.
 */
export function flagFor(country: string | null | undefined): string | null {
  const code = country?.trim().toUpperCase()
  if (!code || !/^[A-Z]{2}$/.test(code)) return null
  return String.fromCodePoint(
    ...[...code].map((ch) => REGIONAL_INDICATOR_A + ch.charCodeAt(0) - LATIN_A),
  )
}

/**
 * The country's name, in the reader's own language where the browser knows
 * it, falling back to the bare code.
 *
 * `Intl.DisplayNames` rather than a map of thirty-six names, because a map
 * is thirty-six English strings that go stale and a naming argument per
 * row (see the "Turkey"/"Türkiye" change, which landed in ICU and would
 * have sat in a hand-written table until somebody complained). The browser
 * already ships the list the rest of the OS uses.
 *
 * Falls back to the code rather than to a guess: "IN" beside a flag is a
 * country abbreviation, which is thin but true, and the price in the same
 * sentence is the part that has to be right.
 *
 * THE "UNKNOWN REGION" TRAP
 *
 * A well-formed code with no country behind it does not come back
 * undefined. CLDR has an entry for the unassigned range, so `of('ZZ')`
 * returns the localised string "Unknown Region" — and `?? code` never
 * fires, because a name was found. Left alone, a visitor whose header
 * carried something unassigned would read "Pricing for Unknown Region"
 * above a real discount, which reads as a broken site rather than as a
 * missing country.
 *
 * So the unknown name is looked up in the same locale and compared against.
 * Deriving it rather than matching the English string keeps this working in
 * whatever language the reader's browser picked, which is the whole reason
 * `Intl` is doing the naming in the first place.
 */
export function countryNameFor(
  country: string | null | undefined,
  locales?: string | string[],
): string | null {
  const code = country?.trim().toUpperCase()
  if (!code || !/^[A-Z]{2}$/.test(code)) return null
  try {
    // Not every runtime ships the `region` type — it is optional in the
    // spec's smallest profile — and a missing one throws rather than
    // returning undefined.
    const names = new Intl.DisplayNames(locales ?? 'en', { type: 'region' })
    const name = names.of(code)
    if (!name || name === code) return code
    // 'ZZ' is the code CLDR files every unassigned region under, so its
    // display name IS the unknown-region string for this locale.
    return name === names.of('ZZ') ? code : name
  } catch {
    return code
  }
}
