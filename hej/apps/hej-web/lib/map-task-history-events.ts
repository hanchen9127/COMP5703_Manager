import type { TaskHistoryEvent } from "@/lib/api/task-history"

import { formatApiDatetimeLocal } from "@/lib/format-api-datetime"
import type { ActivityEvent } from "@/lib/domain/admin-types"

/** Map audit API events to the legacy ActivityEvent shape used by drawers and side panels. */
export function mapTaskHistoryToActivityEvents(events: TaskHistoryEvent[]): ActivityEvent[] {
  return events.map((event) => ({
    time: formatApiDatetimeLocal(event.occurred_at, {
      dateStyle: "short",
      timeStyle: "short",
    }),
    actor: `${event.actor.display_name} · ${event.category}`,
    action: event.summary,
    detail: event.detail ?? "",
  }))
}
