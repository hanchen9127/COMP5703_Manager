import { notFound } from "next/navigation"

import { TaskSummaryMetrics } from "@/components/task-summary-metrics"
import { TaskSetupScaffold } from "@/components/task-setup-scaffold"
import { getTaskSetupView } from "@/lib/mock-data"
import { formatTaskClassLabel, formatTaskLabel } from "@/lib/task-format"

type PageProps = {
  params: Promise<{
    taskId: string
  }>
}

export default async function TaskSetupPage({ params }: PageProps) {
  const { taskId } = await params
  const view = getTaskSetupView(taskId)

  if (!view) {
    notFound()
  }

  return (
    <div className="space-y-4">
      <TaskSummaryMetrics
        items={[
          {
            label: "Task class",
            value: formatTaskClassLabel(view.task.taskClass),
            iconName: "app-window",
          },
          {
            label: "Task type",
            value: formatTaskLabel(view.task.taskType),
            iconName: "file-check",
          },
          {
            label: "Execution mode",
            value:
              view.task.executionMode === "ai_assisted"
                ? "AI-assisted"
                : "Human-first",
            iconName: "git-branch",
          },
          {
            label: "Output schema",
            value: view.policy.outputSchemaRef,
            iconName: "file-check",
          },
          {
            label: "Data source",
            value: `${view.policy.storageProvider} · ${view.policy.pointerStatus}`,
            iconName: "database-zap",
          },
        ]}
        columnsClassName="md:grid-cols-4"
      />

      <TaskSetupScaffold
        task={view.task}
        policy={view.policy}
        pointerPreview={view.pointerPreview}
      />
    </div>
  )
}
