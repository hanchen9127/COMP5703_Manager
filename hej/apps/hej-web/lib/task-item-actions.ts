import {
  saveDraft,
  submitTaskItem,
  type DraftActionData,
  type MutationResult,
} from "@/lib/api/task-items"
import { isTaskItemActionAllowed } from "@/lib/api/status-mapping"

export type AnnotateAction = "save_draft" | "submit"

export type AnnotateActionPayload = {
  taskId: string
  itemId: string
  action: AnnotateAction
  itemStatus?: string
  result: {
    verdict?: string
    rationale?: string
    payloadText?: string
    notes?: string
  }
}

export type ReviewDecision = "approve" | "reject"

export type ReviewAction = "accept_review" | "revise_review" | "adjust_review" | "reject_review" | "escalate_review"

export type ReviewActionPayload = {
  taskId: string
  itemId: string
  action: ReviewAction
  decision: ReviewDecision
  finalVerdict?: string
  finalPayload?: string
  comment?: string
}

export type TaskActionCompleteEvent = {
  taskId: string
  itemId: string
  transitionAction:
    | "save_draft"
    | "submit_annotation"
    | "submit_judgement"
    | "accept_review"
    | "revise_review"
    | "adjust_review"
    | "reject_review"
    | "escalate_review"
}

const ANNOTATE_ALLOWED = [
  "unstarted",
  "in_progress",
  "returned",
  "rejected",
  "submitted",
] as const
const REVIEW_ALLOWED = ["submitted", "disputed", "approved"] as const

export function canAnnotate(status: string) {
  return isTaskItemActionAllowed(status, ANNOTATE_ALLOWED)
}

export function canReview(status: string) {
  return isTaskItemActionAllowed(status, REVIEW_ALLOWED)
}

export function runAnnotateAction(
  payload: AnnotateActionPayload
): Promise<MutationResult<DraftActionData>> {
  if (payload.action === "save_draft") {
    return saveDraft(payload.taskId, payload.itemId, payload)
  }
  return submitTaskItem(payload.taskId, payload.itemId, payload)
}
