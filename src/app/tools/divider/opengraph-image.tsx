import { OG_SIZE, toolOgAlt, toolOgImage } from '@/lib/tool-og'

/** Share card for /tools/divider, drawn from the designer-tools registry. */

export const runtime = 'nodejs'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = toolOgAlt('/tools/divider')

export default function OpenGraphImage() {
  return toolOgImage('/tools/divider')
}
