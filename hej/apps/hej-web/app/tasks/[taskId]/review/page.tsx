/**
 * Route: /tasks/[taskId]/review
 *
 * Task metadata and task items come from the parent layout's `useTaskWorkspace`
 * hydration (same path as Overview / Items / Annotate).
 */
import { TaskWorkbenchWithRealData } from "@/components/task-workbench"
import { TaskWorkspacePage } from "@/components/task-workspace-shell"

export const dynamic = "force-dynamic"
export const revalidate = 0

type PageProps = {
  searchParams: Promise<{
    item?: string
  }>
}

export default async function TaskReviewPage({ searchParams }: PageProps) {
  const { item } = await searchParams

  return (
    <TaskWorkspacePage>
      <TaskWorkbenchWithRealData initialItemId={item} />
    </TaskWorkspacePage>
  )
}
