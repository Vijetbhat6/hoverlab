import { toolMetadata } from '@/lib/designer-tools'
import { ToolSchema } from '@/components/designer-tools/tool-schema'

export const metadata = toolMetadata('/tools/border-radius')

export default function ToolLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <ToolSchema href="/tools/border-radius" />
      {children}
    </>
  )
}
