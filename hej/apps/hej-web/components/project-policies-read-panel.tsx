"use client"

import { useCallback, useMemo } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { OrgPolicySection } from "@/components/org-policy-section"
import { TaskPolicyCard } from "@/components/task-policy-card"
import { useProjectWorkspace } from "@/components/project-workspace-client-shell"
import {
  canEditOrganizationPolicy,
  canEditTaskPolicy,
} from "@/lib/auth-organization-context"

export function ProjectPoliciesReadPanel() {
  const { view, projectId, refresh } = useProjectWorkspace()
  const { organization, project, tasks, organizationPolicy, resolvedPoliciesByTaskId } = view

  const canEditOrg = useMemo(
    () => canEditOrganizationPolicy(organization.id),
    [organization.id],
  )
  const canEditTasks = useMemo(
    () => canEditTaskPolicy(organization.id),
    [organization.id],
  )

  const handlePolicySaved = useCallback(() => {
    void refresh()
  }, [refresh])

  return (
    <div className="space-y-4">
      <Card className="hej-surface-dark rounded-[1.3rem] border-slate-900/10 bg-white/80 shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-white/10">
        <CardHeader className="px-4 md:px-5">
          <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">
            Policies
          </CardTitle>
          <CardDescription className="mt-1 max-w-2xl text-[13px] leading-5 text-slate-600">
            Organization defaults apply across {project.name}. Each task declares schema and
            review refs; dispute and export can override or inherit tenant controls.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 md:px-5">
          <p className="text-[13px] text-slate-600">
            Data source and launch configuration live on each task&apos;s{" "}
            <span className="font-medium text-slate-900">Setup</span> page.
          </p>
        </CardContent>
      </Card>

      <OrgPolicySection
        organizationId={organization.id}
        organizationName={organization.displayName}
        policy={organizationPolicy}
        canEdit={canEditOrg}
        onSaved={handlePolicySaved}
      />

      <section className="space-y-3">
        <div className="px-1">
          <h2 className="text-base font-semibold text-slate-900">Task policy refs</h2>
          <p className="mt-1 text-[13px] text-slate-600">
            Per-task declarations for schema, review, dispute, and export bundles in this project.
          </p>
        </div>

        {tasks.length === 0 ? (
          <Card className="hej-surface-dark rounded-[1.2rem] border border-dashed border-slate-900/15 bg-stone-50/80 dark:border-white/10">
            <CardContent className="px-4 py-10 text-center md:px-5">
              <p className="text-sm font-medium text-slate-900">No tasks in this project</p>
              <p className="mt-1 text-[13px] text-slate-600">
                Create a task to declare policy refs at the task level.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {tasks.map((task) => (
              <TaskPolicyCard
                key={task.id}
                projectId={projectId}
                task={task}
                organizationPolicy={organizationPolicy}
                resolvedPolicy={resolvedPoliciesByTaskId[task.id] ?? null}
                canEdit={canEditTasks}
                onSaved={handlePolicySaved}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
