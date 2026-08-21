"use client"

import {
  AppWindow,
  CircleCheckBig,
  CirclePlay,
  DatabaseZap,
  FileCheck2,
  GitBranchPlus,
  ListTodo,
  LoaderCircle,
  PencilLine,
  Scale,
  Tags,
  type LucideIcon,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

type TaskSummaryMetric = {
  label: string
  value: string
  iconName:
    | "app-window"
    | "circle-check"
    | "circle-play"
    | "database-zap"
    | "file-check"
    | "git-branch"
    | "list-todo"
    | "loader-circle"
    | "pencil-line"
    | "scale"
    | "tags"
}

type TaskSummaryMetricsProps = {
  items: TaskSummaryMetric[]
  columnsClassName?: string
}

export function TaskSummaryMetrics({
  items,
  columnsClassName = "md:grid-cols-4",
}: TaskSummaryMetricsProps) {
  const iconMap: Record<TaskSummaryMetric["iconName"], LucideIcon> = {
    "app-window": AppWindow,
    "circle-check": CircleCheckBig,
    "circle-play": CirclePlay,
    "database-zap": DatabaseZap,
    "file-check": FileCheck2,
    "git-branch": GitBranchPlus,
    "list-todo": ListTodo,
    "loader-circle": LoaderCircle,
    "pencil-line": PencilLine,
    scale: Scale,
    tags: Tags,
  }

  return (
    <section className={`grid gap-3 ${columnsClassName}`}>
      {items.map(({ label, value, iconName }) => {
        const Icon = iconMap[iconName]

        return (
          <Card
            key={label}
            className="hej-surface-dark gap-3 rounded-[1.1rem] border-slate-900/10 bg-white/80 shadow-[0_10px_24px_rgba(15,23,42,0.04)] dark:border-white/10 dark:shadow-[0_12px_30px_rgba(2,6,23,0.28)]"
          >
            <CardHeader className="px-4 md:px-5">
              <CardTitle className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between px-4 md:px-5">
              <p className="text-sm font-semibold text-slate-950 dark:text-slate-100">{value}</p>
              <div className="rounded-lg bg-slate-900 p-2 text-stone-100 dark:bg-white dark:text-slate-950">
                <Icon className="size-3.5" />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </section>
  )
}
