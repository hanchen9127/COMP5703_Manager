"use client"

import { CheckCircle2, PencilLine, XCircle } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { ReviewPanelTabs } from "@/components/review-panel-tabs"

import type { MockTask, MockTaskItem } from "@/lib/domain/task-types"
import type { ActivityEvent } from "@/lib/domain/admin-types"

type ReviewAction = "accept" | "edit" | "reject"

const actionCopy: Record<ReviewAction, string> = {
  accept: "Accept current annotation output",
  edit: "Edit annotation before final review",
  reject: "Reject and escalate",
}

type TaskReviewConsoleProps = {
  task: MockTask
  selectedItem: MockTaskItem
  activity: ActivityEvent[]
  reviewAction: ReviewAction
  onReviewActionChange: (action: ReviewAction) => void
}

export function TaskReviewConsole({
  task,
  selectedItem,
  activity,
  reviewAction,
  onReviewActionChange,
}: TaskReviewConsoleProps) {
  return (
    <Card className="hej-surface-dark min-w-0 rounded-[1.25rem] border-slate-900/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(245,235,214,0.9))] shadow-[0_10px_26px_rgba(15,23,42,0.04)] dark:border-white/10">
      <CardHeader className="px-4 md:px-5">
        <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">
          Review and dispute console
        </CardTitle>
        <CardDescription className="mt-1 max-w-2xl text-[13px] leading-5 text-slate-600">
          Review begins only after first-pass work exists. Inspect the current output, choose the next governance action, and preserve ambiguity when conflict remains.
        </CardDescription>
        <CardAction>
          <Badge className="bg-slate-950 text-stone-100">
            {task.executionMode === "ai_assisted" ? "AI-assisted" : "Human-first"}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="px-4 md:px-5">
        <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                Current item
              </p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">
                {selectedItem.externalRef}
              </h3>
            </div>
            <Badge variant="outline">{selectedItem.status}</Badge>
          </div>
          <p className="mt-3 text-[13px] leading-5 text-slate-600">
            {selectedItem.preview}
          </p>
          <ReviewPanelTabs item={selectedItem} activity={activity} />

          <div className="mt-4 flex flex-wrap gap-2.5">
            <Button
              variant={reviewAction === "accept" ? "default" : "outline"}
              className={reviewAction === "accept" ? "bg-slate-900 text-stone-100" : ""}
              onClick={() => onReviewActionChange("accept")}
            >
              <CheckCircle2 />
              Accept
            </Button>
            <Button
              variant={reviewAction === "edit" ? "default" : "outline"}
              className={reviewAction === "edit" ? "bg-slate-900 text-stone-100" : ""}
              onClick={() => onReviewActionChange("edit")}
            >
              <PencilLine />
              Edit
            </Button>
            <Button
              variant={reviewAction === "reject" ? "default" : "outline"}
              className={reviewAction === "reject" ? "bg-slate-900 text-stone-100" : ""}
              onClick={() => onReviewActionChange("reject")}
            >
              <XCircle />
              Reject
            </Button>
          </div>

          <div className="mt-4 rounded-xl border border-dashed border-slate-900/15 p-3.5">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
              Pending transition
            </p>
            <p className="mt-2 text-[13px] leading-5 text-slate-700">
              {actionCopy[reviewAction]}. In production, this action will post to the governance backend, preserve provenance, and open dispute handling when the annotation outcome cannot be resolved locally.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
