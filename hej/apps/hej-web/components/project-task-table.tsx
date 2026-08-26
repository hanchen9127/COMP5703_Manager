"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ListTodo } from "lucide-react"

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

import { formatTaskClassLabel, formatTaskLabel } from "@/lib/task-format"
import type { MockTask } from "@/lib/domain/task-types"

type ProjectTaskTableProps = {
  tasks: MockTask[]
}

export function ProjectTaskTable({ tasks }: ProjectTaskTableProps) {
  const [query, setQuery] = useState("")
  const [mode, setMode] = useState("all")
  const [taskClassFilter, setTaskClassFilter] = useState("all")

  const filteredTasks = useMemo(() => {
    const normalized = query.trim().toLowerCase()

    return tasks.filter((task) => {
      const matchesQuery =
        !normalized ||
        task.title.toLowerCase().includes(normalized) ||
        task.judgmentQuestion.toLowerCase().includes(normalized) ||
        task.status.toLowerCase().includes(normalized) ||
        task.executionMode.toLowerCase().includes(normalized) ||
        task.taskClass.toLowerCase().includes(normalized) ||
        task.taskType.toLowerCase().includes(normalized)

      const matchesMode = mode === "all" || task.executionMode === mode
      const matchesTaskClass = taskClassFilter === "all" || task.taskClass === taskClassFilter

      return matchesQuery && matchesMode && matchesTaskClass
    })
  }, [mode, query, taskClassFilter, tasks])

  return (
    <div className="space-y-3">
      <EntityFilters
        title="Task filters"
        query={query}
        onQueryChange={setQuery}
        visibleCount={filteredTasks.length}
        placeholder="Search tasks, statuses, or judgment questions"
        options={["all", "ai_assisted", "human_first"]}
        activeOption={mode}
        onOptionChange={setMode}
      />

      <div className="hej-surface-soft flex flex-wrap items-center gap-2 rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10">
        <p className="text-sm font-medium text-slate-900">Task class</p>
        {(["all", "annotation", "judgement"] as const).map((option) => (
          <Button
            key={option}
            type="button"
            variant={taskClassFilter === option ? "default" : "outline"}
            size="sm"
            className={
              taskClassFilter === option
                ? "bg-slate-900 text-stone-100 dark:bg-white dark:text-slate-950"
                : "hej-surface-soft bg-white/90 dark:border-white/10 dark:text-slate-300"
            }
            onClick={() => setTaskClassFilter(option)}
          >
            {option === "all" ? "all" : formatTaskClassLabel(option)}
          </Button>
        ))}
      </div>

      <Table>
        <TableHeader>
            <TableRow className="border-slate-900/10">
              <TableHead>Task</TableHead>
              <TableHead>Class / Type</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Task items</TableHead>
              <TableHead>Policy</TableHead>
              <TableHead className="text-right">Workspace entry</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTasks.map((task) => (
            <TableRow key={task.id} className="border-slate-900/10">
              <TableCell className="min-w-[280px]">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                  <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-slate-600">
                    {task.judgmentQuestion}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{formatTaskClassLabel(task.taskClass)}</Badge>
                  <Badge variant="outline">{formatTaskLabel(task.taskType)}</Badge>
                </div>
              </TableCell>
              <TableCell>
                <Badge className="bg-amber-300 text-slate-950">{task.executionMode}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{task.status}</Badge>
              </TableCell>
              <TableCell className="text-sm font-medium text-slate-900">
                {task.backlogCount ?? 0} items
              </TableCell>
              <TableCell className="text-sm text-slate-600">
                {task.reviewPolicyRef}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex flex-wrap justify-end gap-2">
                  <Button asChild size="sm" className="bg-slate-900 text-stone-100">
                    <Link href={`/tasks/${task.id}`}>
                      <ListTodo />
                      Open
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
