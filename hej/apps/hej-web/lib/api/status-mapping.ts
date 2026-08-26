/**
 * Backend → frontend task-item status mapping.
 *
 *   Backend TaskItemStatus: pending | annotated | returned | rejected | reviewed | disputed | expert_send_back | canonicalized
 *   Frontend UiTaskItemStatus: unstarted | in_progress | submitted | returned | rejected | approved | disputed
 *
 * Review adjust/revise → item `returned` (send back for adjustment).
 * Review reject → item `rejected` (hard reject, resubmit from annotation).
 * Dispute send_back → backend `expert_send_back`, shown in UI as `returned` (Annotate queue).
 */
import type { ApiTaskItemStatus } from "./task-items"

export type UiTaskItemStatus =
  | "unstarted"
  | "in_progress"
  | "submitted"
  | "returned"
  | "rejected"
  | "approved"
  | "disputed"

export type CompatibilityTaskItemStatus = ApiTaskItemStatus | UiTaskItemStatus | string

const BACKEND_TO_UI_STATUS: Record<ApiTaskItemStatus, UiTaskItemStatus> = {
  pending: "unstarted",
  annotated: "submitted",
  returned: "returned",
  rejected: "rejected",
  reviewed: "approved",
  disputed: "disputed",
  expert_send_back: "returned",
  canonicalized: "approved",
}

const UI_STATUS_LABELS: Record<UiTaskItemStatus, string> = {
  unstarted: "Not started",
  in_progress: "Draft",
  submitted: "Submitted",
  returned: "Returned",
  rejected: "Rejected",
  approved: "Approved",
  disputed: "Disputed",
}

export function mapBackendItemStatus(status: ApiTaskItemStatus): UiTaskItemStatus {
  return BACKEND_TO_UI_STATUS[status]
}

export function normalizeTaskItemStatus(status: CompatibilityTaskItemStatus): UiTaskItemStatus {
  switch (status) {
    case "unstarted":
    case "in_progress":
    case "submitted":
    case "returned":
    case "rejected":
    case "approved":
    case "disputed":
      return status
    case "expert_send_back":
      return "returned"
    case "pending":
    case "annotated":
    case "reviewed":
    case "canonicalized":
      return mapBackendItemStatus(status)
    default:
      return "unstarted"
  }
}

export function getTaskItemStatusDisplayLabel(status: CompatibilityTaskItemStatus): string {
  return UI_STATUS_LABELS[normalizeTaskItemStatus(status)]
}

export function mapBackendItemStatusOrDefault(
  status: ApiTaskItemStatus | string | null | undefined,
  fallback: UiTaskItemStatus = "unstarted"
): UiTaskItemStatus {
  if (typeof status !== "string") return fallback
  const normalized = normalizeTaskItemStatus(status)
  return normalized ?? fallback
}

export function isTaskItemActionAllowed(
  status: CompatibilityTaskItemStatus,
  allowedStatuses: readonly UiTaskItemStatus[]
): boolean {
  return allowedStatuses.includes(normalizeTaskItemStatus(status))
}
