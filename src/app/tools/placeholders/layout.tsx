import { toolMetadata } from '@/lib/designer-tools'

export const metadata = toolMetadata('/tools/placeholders')

export default function ToolLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
