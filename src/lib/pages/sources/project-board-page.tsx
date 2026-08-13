/**
 * The project board screen — a kanban view living inside the app shell.
 *
 * The header does the work that keeps the board honest: the tabs say this
 * is one view of the project among several (board, timeline, backlog), and
 * the primary action is "New task" because on this screen creating work is
 * the point — filtering it is the secondary path.
 *
 * The board itself owns its horizontal overflow. The shell must not; a
 * page that scrolls sideways because one child is wide is the bug, and
 * keeping the scroll container inside <KanbanBoard> is what prevents it.
 */

import * as React from 'react'
import { Plus, SlidersHorizontal } from 'lucide-react'
import { DashboardShell } from '@/lib/blocks/sources/dashboard-shell'
import { DashboardPageHeader } from '@/lib/blocks/sources/dashboard-page-header'
import { KanbanBoard } from '@/lib/blocks/sources/kanban-board'

export default function ProjectBoardPage() {
  return (
    <DashboardShell activeLabel="Overview">
      <DashboardPageHeader
        title="Launch: v2 rollout"
        description="Everything between here and the August release, by stage."
        crumbs={[{ label: 'Projects', href: '#' }, { label: 'v2 rollout' }]}
        tabs={[{ label: 'Board' }, { label: 'Timeline' }, { label: 'Backlog' }]}
        activeTab="Board"
        primaryAction={{ label: 'New task', icon: <Plus className="h-4 w-4" /> }}
        secondaryAction={{
          label: 'Filter',
          icon: <SlidersHorizontal className="h-4 w-4" />,
        }}
      />

      <div className="mt-6">
        <KanbanBoard />
      </div>
    </DashboardShell>
  )
}
