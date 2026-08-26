/**
 * Task lifecycle constants shared by backend-mapped runtime code and legacy mock fixtures.
 *
 * Keep these in the domain layer so production UI can use task status values
 * without importing mock fixture data.
 */
export const TASK_STATUS = {
  DRAFT: "draft",
  ACTIVE: "active",
  UNDER_REVIEW: "under_review",
  PILOT: "pilot",
} as const

export type MockTaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS]

export const TASK_ITEM_STATUS = {
  UNSTARTED: "unstarted",
  IN_PROGRESS: "in_progress",
  SUBMITTED: "submitted",
  RETURNED: "returned",
  APPROVED: "approved",
  REJECTED: "rejected",
  DISPUTED: "disputed",
} as const

export type MockTaskItemStatus =
  (typeof TASK_ITEM_STATUS)[keyof typeof TASK_ITEM_STATUS]

export const MOCK_TASK_ITEM_STATUS_ORDER = [
  TASK_ITEM_STATUS.UNSTARTED,
  TASK_ITEM_STATUS.IN_PROGRESS,
  TASK_ITEM_STATUS.SUBMITTED,
  TASK_ITEM_STATUS.RETURNED,
  TASK_ITEM_STATUS.APPROVED,
  TASK_ITEM_STATUS.REJECTED,
  TASK_ITEM_STATUS.DISPUTED,
] as const satisfies readonly MockTaskItemStatus[]
