"use client"

import Link from "next/link"

import { HistoryDrawer } from "@/components/history-drawer"
import { useTaskAuditFeed } from "@/hooks/use-task-audit-feed"
import { mapTaskHistoryToActivityEvents } from "@/lib/map-task-history-events"

type HistoryDrawerWithLiveDataProps = {
  taskId: string
}

export function HistoryDrawerWithLiveData({ taskId }: HistoryDrawerWithLiveDataProps) {
  const feed = useTaskAuditFeed(taskId, { limit: 12 })
  const events = mapTaskHistoryToActivityEvents(feed.events)

  return (
    <HistoryDrawer
      events={events}
      loading={feed.loading}
      error={feed.error}
      taskId={taskId}
      totalCount={feed.totalCount}
      footerLink={
        <Link
          href={`/tasks/${taskId}/history`}
          className="text-xs font-medium text-slate-700 underline-offset-2 hover:underline"
        >
          Open full History
        </Link>
      }
    />
  )
}
