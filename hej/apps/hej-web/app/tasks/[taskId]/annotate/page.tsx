/**
 * 路由：/tasks/[taskId]/annotate（Annotate 子页）
 *
 * Task metadata and task items come from the parent layout's `useTaskWorkspace`
 * hydration (same path as Overview / Items). This page only mounts the annotate UI.
 */
import { TaskAnnotationWorkspaceWithRealData } from "@/components/task-annotation-workspace-with-real-data"
import { TaskWorkspacePage } from "@/components/task-workspace-shell"

export const dynamic = "force-dynamic"
export const revalidate = 0

type PageProps = {
  searchParams: Promise<{
    item?: string
    filter?: string
  }>
}

export default async function TaskAnnotatePage({ searchParams }: PageProps) {
  const { item, filter } = await searchParams

  return (
    <TaskWorkspacePage>
      <TaskAnnotationWorkspaceWithRealData initialItemId={item} initialFilter={filter} />
    </TaskWorkspacePage>
  )
}
