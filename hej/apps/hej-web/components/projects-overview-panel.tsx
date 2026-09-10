"use client"

import Link from "next/link"
import { useState } from "react"
import { FolderPlus, LayoutGrid, TableProperties } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { OrganizationProjectTable } from "@/components/organization-project-table"
import { formatGovernanceModelLabel } from "@/lib/governance-model"

import { formatTaskClassLabel } from "@/lib/task-format"
import type { MockTask } from "@/lib/domain/task-types"
import type { MockOrganization, MockProject } from "@/lib/domain/project-types"

type ProjectsOverviewPanelProps = {
  organizations: MockOrganization[]
  projects: MockProject[]
  tasks: MockTask[]
}

type ViewMode = "cards" | "table"
type TaskClassFilter = "all" | "annotation" | "judgement"

export function ProjectsOverviewPanel({
  organizations,
  projects,
  tasks,
}: ProjectsOverviewPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("cards")
  const [taskClassFilter, setTaskClassFilter] = useState<TaskClassFilter>("all")

  const activeProjects = projects.filter((project) => project.status === "active").length
  const pilotProjects = projects.filter((project) => project.status === "pilot").length
  const backlogCount = tasks.reduce((sum, task) => sum + (task.backlogCount ?? 0), 0)
  const annotationTaskCount = tasks.filter((task) => task.taskClass === "annotation").length
  const judgementTaskCount = tasks.filter((task) => task.taskClass === "judgement").length
  const organizationMap = new Map(
    organizations.map((organization) => [organization.id, organization.displayName])
  )
  const visibleProjects = projects.filter((project) => {
    if (taskClassFilter === "all") {
      return true
    }

    return tasks.some(
      (task) => task.projectId === project.id && task.taskClass === taskClassFilter
    )
  })

  return (
    <Card className="hej-surface-dark rounded-[1.3rem] border-slate-900/10 bg-white/84 shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-white/10">
      <CardHeader className="px-4 md:px-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <CardTitle className="text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
              Project portfolio
            </CardTitle>
            <CardDescription className="mt-1 max-w-2xl text-[13px] leading-5 text-slate-600 dark:text-slate-300">
              This is the main projects page surface. Create project, understand portfolio state, and enter the right workspace from here.
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild className="bg-slate-900 text-stone-100 dark:bg-white dark:text-slate-950">
              <Link href="/projects/new">
                <FolderPlus />
                Create project
              </Link>
            </Button>
            <Button
              type="button"
              variant={viewMode === "cards" ? "default" : "outline"}
              className={viewMode === "cards" ? "bg-slate-900 text-stone-100 dark:bg-white dark:text-slate-950" : ""}
              onClick={() => setViewMode("cards")}
            >
              <LayoutGrid />
              Cards
            </Button>
            <Button
              type="button"
              variant={viewMode === "table" ? "default" : "outline"}
              className={viewMode === "table" ? "bg-slate-900 text-stone-100 dark:bg-white dark:text-slate-950" : ""}
              onClick={() => setViewMode("table")}
            >
              <TableProperties />
              Table
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-4 md:px-5">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            {
              label: "Project count",
              value: projects.length.toString(),
            },
            {
              label: "In governed scope",
              value: organizations.length.toString(),
            },
            {
              label: "Open task items",
              value: backlogCount.toString(),
            },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 px-4 py-3 dark:border-white/10"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</p>
                <p className="text-2xl font-semibold text-slate-950 dark:text-slate-100">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { label: "active", value: activeProjects },
            { label: "pilot", value: pilotProjects },
            { label: "organizations", value: organizations.length },
            { label: "annotation tasks", value: annotationTaskCount },
            { label: "judgement tasks", value: judgementTaskCount },
          ].map(({ label, value }) => (
            <Badge key={label} variant="outline" className="bg-white hej-surface-soft dark:text-slate-300 dark:border-white/10">
              {label}: {value}
            </Badge>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Portfolio mix</p>
          {(["all", "annotation", "judgement"] as const).map((option) => (
            <Button
              key={option}
              type="button"
              variant={taskClassFilter === option ? "default" : "outline"}
              size="sm"
              className={taskClassFilter === option ? "bg-slate-900 text-stone-100 dark:bg-white dark:text-slate-950" : "hej-surface-soft bg-white/90 dark:text-slate-300 dark:border-white/10"}
              onClick={() => setTaskClassFilter(option)}
            >
              {option === "all" ? "All projects" : formatTaskClassLabel(option)}
            </Button>
          ))}
        </div>

        {viewMode === "cards" ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleProjects.map((project) => {
              const projectTasks = tasks.filter((task) => task.projectId === project.id)
              const projectBacklogCount = projectTasks.reduce(
                (sum, task) => sum + (task.backlogCount ?? 0),
                0
              )
              const annotationCount = projectTasks.filter(
                (task) => task.taskClass === "annotation"
              ).length
              const judgementCount = projectTasks.filter(
                (task) => task.taskClass === "judgement"
              ).length

              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex h-full flex-col rounded-[1.15rem] border border-slate-900/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(247,240,227,0.82))] p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-900/20 hover:shadow-[0_18px_34px_rgba(15,23,42,0.10)] hej-surface-dark dark:border-white/10 dark:hover:border-white/20 dark:hover:shadow-[0_20px_40px_rgba(2,6,23,0.38)]"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">{project.name}</h2>
                    <Badge variant="outline">{project.status}</Badge>
                  </div>
                  <p className="mt-2 text-[13px] leading-5 text-slate-600 dark:text-slate-300">
                    {project.description}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 dark:text-slate-400">Tasks</span>
                      <span className="font-semibold text-slate-950 dark:text-slate-100">{projectTasks.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 dark:text-slate-400">Backlog</span>
                      <span className="font-semibold text-slate-950 dark:text-slate-100">{projectBacklogCount}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant="outline">annotation: {annotationCount}</Badge>
                    <Badge variant="outline">judgement: {judgementCount}</Badge>
                  </div>

                  <div className="mt-auto pt-6 flex flex-wrap items-center gap-2">
                    <Badge className="bg-amber-300 text-slate-950">
                      {formatGovernanceModelLabel(project.governanceModel)}
                    </Badge>
                    <Badge variant="outline" className="dark:bg-white/5 dark:text-slate-300 dark:border-white/10">
                      {organizationMap.get(project.organizationId) ?? project.organizationId}
                    </Badge>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <OrganizationProjectTable
            projects={visibleProjects}
            tasks={tasks}
            showOrganization={organizations.length > 1}
          />
        )}
      </CardContent>
    </Card>
  )
}
