/**
 * Public surface of the onboarding components.
 *
 * Not a client module, on purpose: `first-run-checklist.tsx` is one, and a
 * value exported from a client module reaches a Server Component as a client
 * reference. The pure functions are re-exported here from `lib/`, so an
 * import from this file works from either kind of component.
 */

export {
  FirstRunChecklist,
  FirstRunChecklistReopen,
  type FirstRunChecklistProps,
} from './first-run-checklist'

export {
  CHECKLIST_SOURCES,
  CHECKLIST_STEP_IDS,
  checklistView,
  computeChecklist,
  type ChecklistResult,
  type ChecklistState,
  type ChecklistStep,
  type ChecklistStepId,
  type ChecklistView,
} from '@/lib/onboarding/checklist'
