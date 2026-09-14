/**
 * Rendering a ledger date — split out from `lib/recency` so that reading
 * one is not the same as importing the whole ledger.
 *
 * `recency.ts` imports `generated-catalog-recency.json`, 78 KB of ids and
 * dates that no bundler tree-shakes. `formatAdded` lived there, so a Client
 * Component that wanted to print "13 Sep 2026" shipped every date in the
 * catalog to do it. `lib/velocity` exists for exactly that reason and would
 * have undone itself by importing the formatter from the file it is
 * avoiding.
 *
 * `recency.ts` re-exports this, so every existing caller is unchanged and
 * there is still one implementation of the format.
 */

/**
 * Format a ledger date for display: "17 Aug 2026".
 *
 * Fixed to en-GB and UTC on purpose. These pages are statically rendered,
 * so a locale-dependent format would bake whatever the build machine
 * happened to be set to into HTML served to everyone — and a date parsed as
 * local time can land on the previous day west of UTC.
 */
export function formatAdded(date: string | undefined): string | null {
  if (!date) return null
  const parsed = new Date(`${date}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
