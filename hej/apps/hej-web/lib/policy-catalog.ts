import type { ApiAnnotationMode, ApiTaskType } from "@/lib/api/tasks"

/** Known policy bundle ids aligned with demo seed data (`init_data.py`). */
export const POLICY_LABEL_SCHEMA_REFS = {
  image: ["image_detection_schema_v1"],
  text: ["sentiment_classification_schema_v1"],
  audio: ["sentiment_classification_schema_v1"],
} as const

export const POLICY_REVIEW_REFS = ["review_dual_signoff_v1", "review_single_pass_v1"] as const

export const POLICY_DISPUTE_REFS = ["dispute_escalation_policy_v1"] as const

export const POLICY_EXPORT_REFS = ["export_authoritative_with_provenance_v1"] as const

export function labelSchemaRefsForTaskType(taskType: ApiTaskType): string[] {
  const typed = POLICY_LABEL_SCHEMA_REFS[taskType]
  return [...typed, ...POLICY_LABEL_SCHEMA_REFS.image, ...POLICY_LABEL_SCHEMA_REFS.text].filter(
    (value, index, array) => array.indexOf(value) === index,
  )
}

export function allKnownPolicyRefs(): string[] {
  return [
    ...POLICY_LABEL_SCHEMA_REFS.image,
    ...POLICY_LABEL_SCHEMA_REFS.text,
    ...POLICY_REVIEW_REFS,
    ...POLICY_DISPUTE_REFS,
    ...POLICY_EXPORT_REFS,
  ]
}

export type DefaultTaskPolicyRefs = {
  label_schema_ref: string
  review_policy_ref: string
  dispute_policy_ref: string | null
  export_policy_ref: string | null
  annotation_mode: ApiAnnotationMode
}

export function defaultTaskPolicyRefs(taskType: ApiTaskType): DefaultTaskPolicyRefs {
  if (taskType === "image") {
    return {
      label_schema_ref: "image_detection_schema_v1",
      review_policy_ref: "review_dual_signoff_v1",
      dispute_policy_ref: null,
      export_policy_ref: null,
      annotation_mode: "human_first",
    }
  }

  return {
    label_schema_ref: "sentiment_classification_schema_v1",
    review_policy_ref: "review_dual_signoff_v1",
    dispute_policy_ref: null,
    export_policy_ref: null,
    annotation_mode: "ai_assisted",
  }
}

/** Maps create-form modality to API task_type (video still falls back to text). */
export function resolveApiTaskType(
  taskType: "image" | "text" | "audio" | "video",
): ApiTaskType {
  if (taskType === "image") return "image"
  if (taskType === "audio") return "audio"
  return "text"
}

export function taskReviewOverridesOrgDefault(
  reviewPolicyRef: string,
  orgReviewDualSignOff: boolean,
): boolean {
  const taskRequiresDual = reviewPolicyRef.trim() === "review_dual_signoff_v1"
  return taskRequiresDual !== orgReviewDualSignOff
}

export function describeReviewOverride(
  reviewPolicyRef: string,
  orgReviewDualSignOff: boolean,
): string {
  if (!taskReviewOverridesOrgDefault(reviewPolicyRef, orgReviewDualSignOff)) {
    return ""
  }
  if (orgReviewDualSignOff) {
    return "This task uses a lighter review bundle than the organization default."
  }
  return "This task requires stricter review than the organization default."
}
