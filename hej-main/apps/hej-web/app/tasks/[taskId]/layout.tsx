import { notFound } from "next/navigation"
import Link from "next/link"

import { Button } from "@workspace/ui/components/button"
import { PageHeader } from "@/components/page-header"
import { ScopedNav } from "@/components/scoped-nav"
import { getTaskView } from "@/lib/mock-data"
import { formatTaskClassLabel, formatTaskLabel } from "@/lib/task-format"

type LayoutProps = {
  children: React.ReactNode
  params: Promise<{
    taskId: string
  }>
}

export default async function TaskLayout({ children, params }: LayoutProps) {
  const { taskId } = await params
  const view = getTaskView(taskId)

  if (!view) {
    notFound()
  }

  const modeLabel =
    view.task.executionMode === "ai_assisted" ? "AI-assisted" : "Human-first"
  const classLabel = formatTaskClassLabel(view.task.taskClass)
  const workLabel = view.task.taskClass === "judgement" ? "Judge" : "Annotate"
  const description =
    view.task.executionMode === "ai_assisted"
      ? `AI-assisted ${classLabel.toLowerCase()} task. Configure launch settings, inspect task items, monitor model runs, and enter review only after outputs are ready.`
      : `Human-first ${classLabel.toLowerCase()} task. Configure launch settings, inspect task items, complete first-pass work, and enter review only after submission.`

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Task workspace"
        title={view.task.title}
        description={description}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/projects/${view.project.id}`}>Back to project</Link>
          </Button>
        }
        badges={[
          { label: view.task.status, tone: "outline" },
          { label: classLabel, tone: "outline" },
          { label: formatTaskLabel(view.task.taskType), tone: "accent" },
          { label: modeLabel, tone: "dark" },
          { label: view.project.name, tone: "dark" },
        ]}
      />
      <ScopedNav
        items={[
          { href: `/tasks/${taskId}`, label: "Overview" },
          { href: `/tasks/${taskId}/setup`, label: "Setup" },
          { href: `/tasks/${taskId}/items`, label: "Items" },
          { href: `/tasks/${taskId}/annotate`, label: workLabel },
          { href: `/tasks/${taskId}/review`, label: "Review" },
          { href: `/tasks/${taskId}/history`, label: "History" },
        ]}
      />
      {children}
    </div>
  )
}
