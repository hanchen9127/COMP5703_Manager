"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ArrowRight } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { EntityFilters } from "@/components/entity-filters"
import { formatGovernanceModelLabel } from "@/lib/governance-model"
import type { MockProject, MockTask } from "@/lib/mock-data"

type OrganizationProjectTableProps = {
  projects: MockProject[]
  tasks: MockTask[]
  showOrganization?: boolean
}

export function OrganizationProjectTable({
  projects,
  tasks,
  showOrganization = false,
}: OrganizationProjectTableProps) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")

  const filteredProjects = useMemo(() => {
    const normalized = query.trim().toLowerCase()

    return projects.filter((project) => {
      const matchesQuery =
        !normalized ||
        project.name.toLowerCase().includes(normalized) ||
        project.description.toLowerCase().includes(normalized) ||
        formatGovernanceModelLabel(project.governanceModel).toLowerCase().includes(normalized)

      const matchesStatus = status === "all" || project.status === status

      return matchesQuery && matchesStatus
    })
  }, [projects, query, status])

  return (
    <div className="space-y-3">
      <EntityFilters
        title="Project filters"
        query={query}
        onQueryChange={setQuery}
        visibleCount={filteredProjects.length}
        placeholder="Search projects, governance models, or descriptions"
        options={["all", "active", "pilot"]}
        activeOption={status}
        onOptionChange={setStatus}
      />

      <Table>
        <TableHeader>
          <TableRow className="border-slate-900/10 dark:border-white/10">
            <TableHead>Project</TableHead>
            {showOrganization ? <TableHead>Organization</TableHead> : null}
            <TableHead>Status</TableHead>
            <TableHead>Governance</TableHead>
            <TableHead>Tasks</TableHead>
            <TableHead>Backlog</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredProjects.map((project) => {
            const projectTasks = tasks.filter((task) => task.projectId === project.id)
            const backlogCount = projectTasks.reduce(
              (sum, task) => sum + (task.backlogCount ?? 0),
              0
            )

            return (
              <TableRow key={project.id} className="border-slate-900/10 dark:border-white/10">
                <TableCell className="min-w-[280px]">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{project.name}</p>
                    <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-slate-600 dark:text-slate-300">
                      {project.description}
                    </p>
                  </div>
                </TableCell>
                {showOrganization ? (
                  <TableCell className="text-sm text-slate-600 dark:text-slate-300">
                    {project.organizationId.replace("org_", "").replaceAll("-", " ")}
                  </TableCell>
                ) : null}
                <TableCell>
                  <Badge variant="outline">{project.status}</Badge>
                </TableCell>
                <TableCell className="text-sm text-slate-600 dark:text-slate-300">
                  {formatGovernanceModelLabel(project.governanceModel)}
                </TableCell>
                <TableCell className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {projectTasks.length}
                </TableCell>
                <TableCell className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {backlogCount} items
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/projects/${project.id}/tasks`}>Tasks</Link>
                    </Button>
                    <Button asChild size="sm" className="bg-slate-900 text-stone-100 dark:bg-white dark:text-slate-950">
                      <Link href={`/projects/${project.id}`}>
                        Open
                        <ArrowRight />
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
