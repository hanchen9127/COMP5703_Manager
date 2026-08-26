"use client"

import { useTaskHistory } from "@/hooks/use-task-history"
import { useTaskWorkspace } from "@/components/task-workspace-client-shell"
import { TaskHistoryBoard } from "@/components/task-history-board"
import type { HistoryCategory } from "@/lib/api/task-history"

const CATEGORY_OPTIONS: { value: HistoryCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "setup", label: "Setup" },
  { value: "policy", label: "Policy" },
  { value: "data", label: "Data" },
  { value: "annotation", label: "Annotation" },
  { value: "review", label: "Review" },
  { value: "dispute", label: "Dispute" },
  { value: "system", label: "System" },
]

export function TaskHistoryReadPanel() {
  const { taskId } = useTaskWorkspace()
  const history = useTaskHistory(taskId)

  return (
    <TaskHistoryBoard
      taskId={taskId}
      logs={history.logs}
      totalCount={history.totalCount}
      loadedCount={history.rawLogs?.length ?? 0}
      hasMore={history.hasMore}
      loadingMore={history.loadingMore}
      lineage={history.lineage}
      auditLoading={history.auditLoading}
      workflowLoading={history.workflowLoading}
      auditError={history.auditError}
      workflowError={history.workflowError}
      category={history.category}
      workflowStepKey={history.workflowStepKey}
      categoryOptions={CATEGORY_OPTIONS}
      onCategoryChange={history.setCategory}
      onWorkflowStepSelect={history.selectWorkflowStep}
      onLoadMore={() => void history.loadMoreAudit()}
      onRefresh={() => void history.refresh()}
    />
  )
}
