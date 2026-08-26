import { TASK_ITEM_STATUS, type MockTaskItemStatus } from "@/lib/domain/task-status"

export type StatusVisualSegment = {
  status: MockTaskItemStatus | string
  label: string
  count: number
  barClassName: string
  dotClassName: string
  /** Stage filter key when this segment maps to a tab filter (Annotate / Items). */
  filterKey?: string
}

const STATUS_VISUALS: Record<
  MockTaskItemStatus,
  Pick<StatusVisualSegment, "barClassName" | "dotClassName">
> = {
  [TASK_ITEM_STATUS.UNSTARTED]: {
    barClassName: "bg-slate-300",
    dotClassName: "bg-slate-400",
  },
  [TASK_ITEM_STATUS.IN_PROGRESS]: {
    barClassName: "bg-sky-500",
    dotClassName: "bg-sky-500",
  },
  [TASK_ITEM_STATUS.SUBMITTED]: {
    barClassName: "bg-amber-400",
    dotClassName: "bg-amber-400",
  },
  [TASK_ITEM_STATUS.RETURNED]: {
    barClassName: "bg-rose-500",
    dotClassName: "bg-rose-500",
  },
  [TASK_ITEM_STATUS.APPROVED]: {
    barClassName: "bg-emerald-500",
    dotClassName: "bg-emerald-500",
  },
  [TASK_ITEM_STATUS.REJECTED]: {
    barClassName: "bg-red-400",
    dotClassName: "bg-red-400",
  },
  [TASK_ITEM_STATUS.DISPUTED]: {
    barClassName: "bg-violet-500",
    dotClassName: "bg-violet-500",
  },
}

export function statusVisualFor(
  status: MockTaskItemStatus,
  label: string,
  count: number,
): StatusVisualSegment {
  const visual = STATUS_VISUALS[status] ?? {
    barClassName: "bg-slate-300",
    dotClassName: "bg-slate-400",
  }
  return {
    status,
    label,
    count,
    barClassName: visual.barClassName,
    dotClassName: visual.dotClassName,
  }
}
