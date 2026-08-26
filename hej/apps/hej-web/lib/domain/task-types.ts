import type { AnnotationData } from "@/lib/annotation-data"
import type {
  MockTaskItemStatus,
  MockTaskStatus,
} from "@/lib/domain/task-status"

/** Task modality/type supported by the annotation workflow. */
export type MockTaskType = "image" | "text" | "audio"

/** Task master record: one annotation/judgement task and its policy summary. */
export type MockTask = {
  id: string
  projectId: string
  title: string
  judgmentQuestion: string
  taskClass: "annotation" | "judgement"
  taskType: MockTaskType
  taskSubtype?: string
  executionMode: "ai_assisted" | "human_first"
  dataSourceLabel: string
  annotationRules: string
  outputSchemaRef: string
  textSpanLabelOptions?: string[] | null
  reviewPolicyRef: string
  disputePolicyRef?: string | null
  exportPolicyRef?: string | null
  status: MockTaskStatus
  backlogCount?: number
}

/** One work item under a task, including model output, human draft/review, and canonical result fields. */
export type MockTaskItem = {
  id: string
  taskId: string
  externalRef: string
  /** Resolved data pointer location (uploads/... or mock://fixtures/...). */
  locationRef?: string
  preview: string
  aiLabel: string
  confidence: string
  status: MockTaskItemStatus
  candidateOutput?: string
  candidateConfidence?: string
  candidateRationale?: string
  draftVerdict?: string
  draftRationale?: string
  draftPayloadText?: string
  draftNotes?: string
  draftAnnotationData?: AnnotationData
  reviewDecision?: string
  reviewNote?: string
  canonicalVerdict?: string
  canonicalRationale?: string
  flags?: string[]
  responseA?: string
  responseB?: string
  preferredOption?: "A" | "B" | "tie"
  preferenceRationale?: string
  /** When API returns an unknown status string, we map to Draft but keep the raw value for UI/debug. */
  apiOriginalStatus?: string
}

export type WorkflowStep = {
  title: string
  description: string
  state: string
  tone?: "default" | "accent" | "dark"
}

export type TaskAssignment = {
  reviewer: string
  role: string
  workstream: string
  sla: string
}
