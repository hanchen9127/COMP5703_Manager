import type { ApiOrganizationPolicy } from "@/lib/api/organizations"
import type { ApiResolvedPolicy } from "@/lib/api/policies"
import type { ApiTaskSetup, SetupRegistrationStatus } from "@/lib/api/task-setup"
import type { ApiAnnotationMode } from "@/lib/api/tasks"
import {
  formatDisputeGateLabel,
  formatExportPolicyLabel,
  formatReviewModeLabel,
} from "@/lib/resolved-policy"

import {
  displayPolicyRef,
  taskUsesOrgDisputeDefault,
  taskUsesOrgExportDefault,
} from "@/lib/policy-display"
import type { MockTask, MockTaskItem } from "@/lib/domain/task-types"

export type TaskSetupDefinition = {
  id: string
  title: string
  judgmentQuestion: string
  taskClass: "annotation" | "judgement"
  taskType: "text" | "image" | "audio"
  executionMode: ApiAnnotationMode
  dataSourceLabel: string
  annotationRules: string
}

export type TaskSetupPolicyBundle = {
  executionMode: ApiAnnotationMode
  outputSchemaRef: string
  reviewPolicyRef: string
  disputePolicyRef: string
  exportPolicyRef: string
  storageProvider: string
  pointerStatus: string
  advancedConfig: string
  taskStatus: string
}

export type TaskSetupView = {
  definition: TaskSetupDefinition
  policy: TaskSetupPolicyBundle
  pointerPreview: string[]
  resolvedPolicy: ApiResolvedPolicy | null
  registrationStatus: SetupRegistrationStatus
}

function inferStorageProvider(dataSourceLabel: string): string {
  const label = dataSourceLabel.toLowerCase()
  if (label.includes("s3://") || label.includes("aws")) return "AWS S3"
  if (label.includes("gcs") || label.includes("google")) return "Google Cloud Storage"
  if (label.includes("azure") || label.includes("blob")) return "Azure Blob Storage"
  if (label.includes("mock://")) return "Mock storage"
  return "Backend storage"
}

function formatRegistrationStatus(status: SetupRegistrationStatus): string {
  if (status === "registered") return "registered"
  if (status === "partial") return "partial_registration"
  return "pending_registration"
}

function mockTaskToDefinition(task: MockTask): TaskSetupDefinition {
  return {
    id: task.id,
    title: task.title,
    judgmentQuestion: task.judgmentQuestion,
    taskClass: task.taskClass,
    taskType: task.taskType,
    executionMode: task.executionMode,
    dataSourceLabel: task.dataSourceLabel,
    annotationRules: task.annotationRules,
  }
}

function policyBundleFromResolved(
  resolved: ApiResolvedPolicy,
  executionMode: ApiAnnotationMode,
  dataPlane: ApiTaskSetup["data_plane"],
  dataSourceLabel: string,
  taskStatus: string,
): TaskSetupPolicyBundle {
  return {
    executionMode,
    outputSchemaRef: resolved.label_schema_ref,
    reviewPolicyRef: formatReviewModeLabel(resolved),
    disputePolicyRef: formatDisputeGateLabel(resolved),
    exportPolicyRef: formatExportPolicyLabel(resolved),
    storageProvider: dataPlane.storage_provider_hint ?? inferStorageProvider(dataSourceLabel),
    pointerStatus: formatRegistrationStatus(dataPlane.registration_status),
    advancedConfig:
      dataPlane.item_count > 0
        ? `${dataPlane.item_count} task items · ${dataPlane.pointer_count} data pointers registered.`
        : `No task items yet. Register data via dataset registration for ${dataSourceLabel}.`,
    taskStatus,
  }
}

function buildPointerPreview(setup: ApiTaskSetup): string[] {
  const fromPointers = setup.data_pointers
    .map((pointer) => pointer.location_ref.trim())
    .filter((value) => value.length > 0)
  const fromItems = setup.task_items
    .map((item) => item.external_item_ref.trim() || (item.location_ref ?? "").trim())
    .filter((value) => value.length > 0)

  const combined = [...fromPointers, ...fromItems]
  const unique = Array.from(new Set(combined))
  return unique.slice(0, 8)
}

function primaryDataSourceLabel(setup: ApiTaskSetup): string {
  const pointer = setup.data_pointers[0]?.location_ref?.trim()
  if (pointer) return pointer
  const itemLocation = setup.task_items[0]?.location_ref?.trim()
  if (itemLocation) return itemLocation
  return setup.data_plane.storage_provider_hint ?? "Backend storage"
}

export function mapApiTaskSetupToView(setup: ApiTaskSetup): TaskSetupView {
  const { task, resolved_policy: resolved, data_plane: dataPlane } = setup
  const dataSourceLabel = primaryDataSourceLabel(setup)
  const definition: TaskSetupDefinition = {
    id: task.id,
    title: task.title,
    judgmentQuestion: task.judgment_question,
    taskClass: "annotation",
    taskType: task.task_type,
    executionMode: task.annotation_mode,
    dataSourceLabel,
    annotationRules: task.description?.trim() || task.judgment_question,
  }

  return {
    definition,
    policy: policyBundleFromResolved(
      resolved,
      task.annotation_mode,
      dataPlane,
      dataSourceLabel,
      task.status,
    ),
    pointerPreview: buildPointerPreview(setup),
    resolvedPolicy: resolved,
    registrationStatus: dataPlane.registration_status,
  }
}

/** Fallback path when workspace hydration is mock/fallback. */
export function buildTaskSetupViewFromWorkspace(input: {
  task: MockTask
  taskItems: MockTaskItem[]
  organizationPolicy?: ApiOrganizationPolicy | null
}): TaskSetupView {
  const { task, taskItems, organizationPolicy = null } = input
  const definition = mockTaskToDefinition(task)

  const pointerPreview = taskItems
    .map((item) => item.externalRef || item.preview)
    .filter((value) => value.trim().length > 0)
    .slice(0, 8)

  const disputeInherited = taskUsesOrgDisputeDefault(task)
  const exportInherited = taskUsesOrgExportDefault(task)

  const registrationStatus: SetupRegistrationStatus =
    taskItems.length > 0 ? "registered" : "pending_registration"

  const policy: TaskSetupPolicyBundle = {
    executionMode: task.executionMode,
    outputSchemaRef: task.outputSchemaRef,
    reviewPolicyRef: task.reviewPolicyRef,
    disputePolicyRef: displayPolicyRef(
      task.disputePolicyRef,
      disputeInherited && organizationPolicy
        ? `Org: ${organizationPolicy.dispute_escalation_gate} gate`
        : "Inherited from organization defaults",
    ),
    exportPolicyRef: displayPolicyRef(
      task.exportPolicyRef,
      exportInherited && organizationPolicy
        ? organizationPolicy.export_provenance_required
          ? "Org: provenance required"
          : "Org: export without provenance gate"
        : "Inherited from organization defaults",
    ),
    storageProvider: inferStorageProvider(task.dataSourceLabel),
    pointerStatus: formatRegistrationStatus(registrationStatus),
    advancedConfig:
      taskItems.length > 0
        ? `${taskItems.length} task items registered from ${task.dataSourceLabel}.`
        : `No task items yet. Connect data via upload or dataset registration for ${task.dataSourceLabel}.`,
    taskStatus: task.status,
  }

  return {
    definition,
    policy,
    pointerPreview,
    resolvedPolicy: null,
    registrationStatus,
  }
}

/** @deprecated Use buildTaskSetupViewFromWorkspace or mapApiTaskSetupToView */
export function buildTaskSetupView(input: {
  task: MockTask
  taskItems: MockTaskItem[]
  organizationPolicy?: ApiOrganizationPolicy | null
}): TaskSetupView {
  return buildTaskSetupViewFromWorkspace(input)
}
