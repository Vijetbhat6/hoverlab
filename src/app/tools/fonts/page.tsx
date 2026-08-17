import { permanentRedirect } from 'next/navigation'

/**
 * The Font Pairings tool merged into the Typography Playground: two tools
 * were maintaining two overlapping pairing lists, and the playground is
 * where the type-scale half of the job already lived. The pairings (and the
 * next/font output this page used to emit) are all there now, sourced from
 * `@/lib/font-pairings`.
 */
export default function FontsToolPage() {
  permanentRedirect('/tools/typography')
}
