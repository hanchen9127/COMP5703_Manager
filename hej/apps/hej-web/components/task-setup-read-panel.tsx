"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ArrowRight, Settings2 } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { ResolvedPolicySummary } from "@/components/resolved-policy-summary"
import { TaskDatasetRegistrationPanel } from "@/components/task-dataset-registration-panel"
import { TaskSetupCollapsibleSection } from "@/components/task-setup-collapsible-section"
import {
  TaskSetupDataSourceBody,
  TaskSetupDefinitionBody,
  TaskSetupPolicyRefsGrid,
} from "@/components/task-setup-scaffold"
import { useTaskWorkspace } from "@/components/task-workspace-client-shell"
import { useTaskSetup } from "@/hooks/use-task-setup"
import { getOrganizationDetail, type ApiOrganizationPolicy } from "@/lib/api/organizations"
import { formatTaskClassLabel, formatTaskLabel, formatTaskStatusLabel } from "@/lib/task-format"

const DATA_SOURCE_SECTION_ID = "task-setup-data-source"

function SetupNotices({ notices }: { notices: string[] }) {
  if (notices.length === 0) return null

  return (
    <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 dark:border-amber-800/40 dark:bg-amber-950/20">
      <ul className="list-inside list-disc space-y-1 text-[13px] leading-5 text-amber-950 dark:text-amber-100">
        {notices.map((notice) => (
          <li key={notice}>{notice}</li>
        ))}
      </ul>
    </div>
  )
}

export function TaskSetupReadPanel() {
  const { view, retry, phase } = useTaskWorkspace()
  const { task, project, taskItems } = view
  const [organizationPolicy, setOrganizationPolicy] = useState<ApiOrganizationPolicy | null>(
    null,
  )
  const [orgPolicyLoaded, setOrgPolicyLoaded] = useState(false)
  const [revealDataSource, setRevealDataSource] = useState(false)

  const setup = useTaskSetup({
    workspaceTask: task,
    taskItems,
    organizationPolicy,
  })

  const setupUsesWorkspaceFallback = setup.source === "fallback"
  const workspaceIsUnavailable = phase === "unreachable"

  useEffect(() => {
    if (!setupUsesWorkspaceFallback) {
      setOrganizationPolicy(null)
      setOrgPolicyLoaded(false)
      return
    }

    let cancelled = false
    setOrgPolicyLoaded(false)

    async function loadOrgPolicy() {
      const result = await getOrganizationDetail(project.organizationId)
      if (cancelled) return
      if (result.ok && result.data.policy?.id != null) {
        setOrganizationPolicy(result.data.policy)
      } else {
        setOrganizationPolicy(null)
      }
      setOrgPolicyLoaded(true)
    }

    void loadOrgPolicy()
    return () => {
      cancelled = true
    }
  }, [setupUsesWorkspaceFallback, project.organizationId])

  const { definition, policy, pointerPreview } = setup.view
  const executionLabel = policy.executionMode === "ai_assisted" ? "AI-assisted" : "Human-first"
  const hasPointers = pointerPreview.length > 0
  const workLabel = definition.taskClass === "judgement" ? "Judge" : "Annotate"

  const usingMockPolicyBundle =
    setupUsesWorkspaceFallback || definition.id.startsWith("task_policy")

  const showOrgPolicyContextNote =
    setupUsesWorkspaceFallback &&
    orgPolicyLoaded &&
    !usingMockPolicyBundle &&
    organizationPolicy == null

  const setupNotices = useMemo(() => {
    const notices: string[] = []
    if (setup.error && setupUsesWorkspaceFallback) {
      notices.push(`Setup API unavailable (${setup.error}). Showing workspace fallback below.`)
    }
    if (workspaceIsUnavailable && setup.source === "live") {
      notices.push(
        "Task definition and data plane are loaded from the API. The item list may still reflect workspace cache until you retry above.",
      )
    } else if (workspaceIsUnavailable && setupUsesWorkspaceFallback) {
      notices.push(
        "Workspace fallback is active. Sign in and use Retry above to load live task fields and items.",
      )
    }
    if (showOrgPolicyContextNote) {
      notices.push(
        "Organization policy details were not loaded. Edit dispute and export refs on the project Policies page when permitted.",
      )
    }
    return notices
  }, [
    setup.error,
    setup.source,
    workspaceIsUnavailable,
    setupUsesWorkspaceFallback,
    showOrgPolicyContextNote,
  ])

  const handleRegistered = () => {
    setRevealDataSource(true)
    void retry()
    void setup.refresh()
  }

  const dataSourceSectionKey = revealDataSource ? "data-source-revealed" : "data-source-default"
  const dataSourceDefaultOpen = revealDataSource || !hasPointers

  return (
    <div className="space-y-4">
      {setup.loading ? (
        <p className="text-[13px] text-slate-500">Loading task setup from API…</p>
      ) : null}

      <SetupNotices notices={setupNotices} />

      <Card className="hej-surface-dark rounded-[1.25rem] border-slate-900/10 bg-white/80 shadow-[0_10px_26px_rgba(15,23,42,0.04)] dark:border-white/10">
        <CardContent className="flex flex-col gap-4 px-4 py-4 md:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-2">
              <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                {definition.title}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{formatTaskStatusLabel(policy.taskStatus)}</Badge>
                <Badge variant="outline">{formatTaskClassLabel(definition.taskClass)}</Badge>
                <Badge variant="outline">{formatTaskLabel(definition.taskType)}</Badge>
                <Badge className="bg-amber-300 text-slate-950">{executionLabel}</Badge>
                <Badge variant="outline">
                  {policy.storageProvider} · {policy.pointerStatus}
                </Badge>
                {setup.source === "live" ? (
                  <Badge className="bg-emerald-700 text-stone-100">Live setup</Badge>
                ) : null}
              </div>
              <p className="text-[13px] leading-5 text-slate-600">
                Read-only definition and data-plane preview. Policy refs are edited on the project{" "}
                <span className="font-medium text-slate-900">Policies</span> page when permitted.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/projects/${project.id}/policies`}>
                  <Settings2 className="mr-1.5 size-3.5" />
                  Project policies
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link href={`/tasks/${definition.id}/items`}>
                  Continue to Items
                  <ArrowRight className="ml-1.5 size-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <TaskDatasetRegistrationPanel
        taskId={definition.id}
        taskType={definition.taskType}
        taskStatus={policy.taskStatus}
        itemsHref={`/tasks/${definition.id}/items`}
        workHref={`/tasks/${definition.id}/annotate`}
        workLabel={workLabel}
        dataSourceSectionId={DATA_SOURCE_SECTION_ID}
        onRegistered={handleRegistered}
      />

      {setup.resolvedPolicy ? (
        <TaskSetupCollapsibleSection
          title="Effective policy"
          description="Executable review, dispute, and export rules for this task."
          defaultOpen
        >
          <ResolvedPolicySummary policy={setup.resolvedPolicy} />
        </TaskSetupCollapsibleSection>
      ) : !setup.loading ? (
        <TaskSetupCollapsibleSection
          title="Effective policy"
          description="Resolved rules from the task and organization policy stack."
          defaultOpen
        >
          <p className="text-[13px] leading-5 text-slate-600">
            Effective policy is unavailable. Sign in, open a live backend task, or use Retry above.
          </p>
        </TaskSetupCollapsibleSection>
      ) : null}

      <TaskSetupCollapsibleSection
        title="Policy references"
        description="Declared schema, review, dispute, and export bundle refs (read-only)."
        defaultOpen={!setup.resolvedPolicy}
      >
        <TaskSetupPolicyRefsGrid policy={policy} />
      </TaskSetupCollapsibleSection>

      <TaskSetupCollapsibleSection
        title="Task definition"
        description="Objective and shared instructions for annotators or judges."
        defaultOpen
      >
        <TaskSetupDefinitionBody definition={definition} />
      </TaskSetupCollapsibleSection>

      <div id={DATA_SOURCE_SECTION_ID}>
        <TaskSetupCollapsibleSection
          key={dataSourceSectionKey}
          title="Data source"
          description="Storage-backed source path, registered pointers, and launch metadata."
          defaultOpen={dataSourceDefaultOpen}
        >
          <TaskSetupDataSourceBody
            definition={definition}
            policy={policy}
            pointerPreview={pointerPreview}
          />
        </TaskSetupCollapsibleSection>
      </div>
    </div>
  )
}
