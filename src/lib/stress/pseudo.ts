/**
 * Text transforms for the data and language stresses.
 *
 * Pure string functions, no DOM, so each one has a unit test and the
 * frame and the tests cannot disagree about what they do.
 *
 * ── DETERMINISM ─────────────────────────────────────────────────────────
 *
 * Every function is a pure function of its input. The harness compares a
 * stressed run to a baseline by structural key, and a transform that
 * varied between runs would make a layout that is identical look different.
 */

/**
 * IBM's published expansion allowance for translated UI strings, by length
 * of the English source. It is the standard reference for "how much longer
 * can this get" and it is the reason the multiplier here is not a flat 35%:
 * a flat factor under-tests the short strings (a button label routinely
 * doubles) and over-tests the paragraphs.
 */
const EXPANSION: ReadonlyArray<readonly [maxLength: number, factor: number]> = [
  [10, 3.0],
  [20, 1.8],
  [30, 1.6],
  [50, 1.4],
  [70, 1.31],
  [Number.POSITIVE_INFINITY, 1.3],
]

export function expansionFactor(length: number): number {
  for (const [max, factor] of EXPANSION) if (length <= max) return factor
  return 1.3
}

const ACCENT: Readonly<Record<string, string>> = {
  a: 'à', e: 'é', i: 'í', o: 'ö', u: 'ü', y: 'ý', c: 'ç', n: 'ñ', s: 'š', z: 'ž',
  A: 'Å', E: 'É', I: 'Î', O: 'Ö', U: 'Ü', Y: 'Ý', C: 'Ç', N: 'Ñ', S: 'Š', Z: 'Ž',
}

const FILLER = 'ééöüä'

/**
 * A German-length, accented version of `text`.
 *
 * Accents matter as much as length: they pull in fallback glyphs and taller
 * line boxes that plain ASCII padding never does. The extra length is
 * distributed across the words rather than tacked on the end, because
 * German gets longer word by word (compounds) and a single long tail would
 * wrap differently from real translated copy.
 */
export function expandText(text: string): string {
  const trimmed = text.trim()
  if (trimmed.length < 2 || !/\p{L}/u.test(trimmed)) return text
  // Initials ("AL"), units ("180ms", "2.4B") and abbreviations are not
  // translated, so tripling them would report a defect no translator can
  // cause. Four letters is the shortest word that really is a word.
  if ((trimmed.match(/\p{L}/gu) ?? []).length < 4) return text

  const lead = text.slice(0, text.length - text.trimStart().length)
  const trail = text.slice(text.trimEnd().length)

  const target = Math.ceil(trimmed.length * expansionFactor(trimmed.length))
  const extra = target - trimmed.length
  const words = trimmed.split(/(\s+)/)
  const realWords = words.filter((word) => /\p{L}/u.test(word)).length
  if (realWords === 0) return text

  const each = Math.floor(extra / realWords)
  let remainder = extra - each * realWords
  let cursor = 0

  const out = words.map((word) => {
    if (!/\p{L}/u.test(word)) return word
    const accented = Array.from(word, (char) => ACCENT[char] ?? char).join('')
    let add = each + (remainder > 0 ? 1 : 0)
    if (remainder > 0) remainder -= 1
    let pad = ''
    while (add > 0) {
      pad += FILLER[cursor % FILLER.length]
      cursor += 1
      add -= 1
    }
    return accented + pad
  })

  return lead + out.join('') + trail
}

/** A pool of common UI kanji, cycled. Fixed so a run is reproducible. */
const CJK = '表示文字幅確認画面設定保存送信検索一覧詳細通知履歴利用者情報更新削除追加'

/**
 * `text` with its words replaced by CJK characters and its spaces removed.
 *
 * Digits and punctuation survive so a price or a date still reads as one,
 * and a CJK character is about twice the width of a Latin one, so two
 * source letters become one character rather than one-for-one.
 */
export function cjkText(text: string): string {
  if (!/\p{L}/u.test(text)) return text

  const lead = text.slice(0, text.length - text.trimStart().length)
  const trail = text.slice(text.trimEnd().length)
  let cursor = 0

  const body = text
    .trim()
    .split(/(\s+)/)
    .map((word) => {
      if (/^\s+$/.test(word)) return ''
      if (!/\p{L}/u.test(word)) return word
      const letters = Array.from(word).filter((char) => /\p{L}/u.test(char)).length
      const count = Math.max(1, Math.ceil(letters / 2))
      let run = ''
      for (let i = 0; i < count; i++) {
        run += CJK[cursor % CJK.length]
        cursor += 1
      }
      // Keep the non-letter characters that were glued to the word.
      const edge = word.match(/^[^\p{L}]*/u)?.[0] ?? ''
      const tail = word.match(/[^\p{L}]*$/u)?.[0] ?? ''
      return edge + run + tail
    })
    .join('')

  return lead + body + trail
}

/**
 * The word appended by the long-names stress.
 *
 * 36 characters and no break opportunity. A hyphen would give the browser
 * somewhere to wrap and turn the test into a pass for the wrong reason;
 * real surnames, hostnames and IDs are the things that have none.
 */
export const LONG_WORD = 'Wolfeschlegelsteinhausenbergerdorff'

/**
 * Short data-like strings get the long word; long prose is left alone.
 *
 * "Data-like" is a length and word-count heuristic: a name, a product
 * title, a city. A sentence is already long and a stress that doubled it
 * would test paragraph wrapping, which the German stress already covers.
 */
export function longName(text: string): string {
  const trimmed = text.trim()
  if (trimmed.length < 3 || trimmed.length > 32) return text
  if (!/\p{L}/u.test(trimmed)) return text
  // A string with a digit is a measurement ("2h 14m", "180ms", "+108 more"),
  // not a name, and a 36-character surname does not belong on it.
  if (/\d/.test(trimmed)) return text
  if (trimmed.split(/\s+/).length > 4) return text
  // Already a number, currency or time, not a name.
  if (/^[\s\d.,:/%$€£¥+\-–—]+$/u.test(trimmed)) return text

  const lead = text.slice(0, text.length - text.trimStart().length)
  const trail = text.slice(text.trimEnd().length)
  return `${lead}${trimmed} ${LONG_WORD}${trail}`
}

const SIX_DIGITS = ',000,000'

/**
 * Every standalone number gains six digits: `$4,200` to `$4,200,000,000`.
 *
 * Six, not more: thousands become billions, which is a real ceiling for a
 * revenue or a follower count. Twelve extra digits would fail layouts that
 * no customer's data will ever reach and bury the ones that fail sooner.
 *
 * Years, times and dates are left alone. A copyright year that became
 * 2,026,000,000,000 would be noise in the report, not a stress: those are
 * not quantities and they do not grow.
 */
export function hugeNumbers(text: string): string {
  // A lone one- or two-digit number is a calendar day, a page number or a
  // step counter: an ordinal, not a quantity that can reach a billion.
  if (/^\s*\d{1,2}\s*$/.test(text)) return text

  return text.replace(
    /(?<![\d:/.,-])(\d{1,3}(?:,\d{3})*|\d+)(\.\d+)?(?![\d:/,-]|\.\d)/g,
    (match, whole: string, fraction: string | undefined, offset: number, source: string) => {
      const digits = whole.replace(/,/g, '')
      // A four-digit 19xx/20xx with no separators is a year.
      if (/^(19|20)\d{2}$/.test(digits) && !whole.includes(',') && !fraction) return match
      // A number that is part of an identifier ("h2", "v2", "3xl") is not a quantity.
      const before = source[offset - 1]
      const after = source[offset + match.length]
      // A percentage cannot grow: 72% is a fraction, and "72,000,000%" is
      // not something any product displays.
      if (after === '%') return match
      if ((before && /[A-Za-z_-]/.test(before)) || (after && /[A-Za-z_]/.test(after) && !/[kKmMbB]/.test(after))) {
        return match
      }
      // A leading zero ("0.8%") would become "0,000,000.8", which no
      // formatter produces; a nine keeps the width without the nonsense.
      const grouped = digits.startsWith('0')
        ? '9'
        : whole.includes(',')
          ? whole
          : Number(digits).toLocaleString('en-US')
      return `${grouped}${SIX_DIGITS}${fraction ?? ''}`
    },
  )
}

/** Blank data text. Whitespace-only nodes are left so markup stays valid. */
export function emptyText(text: string): string {
  return text.trim() === '' ? text : ''
}
