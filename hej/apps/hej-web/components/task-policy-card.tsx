"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { Input } from "@workspace/ui/components/input"
import { ExternalLink, FileCode2, FileOutput, GitBranchPlus, ShieldAlert } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { PolicyRefField } from "@/components/policy-ref-field"
import { PolicySaveFeedback } from "@/components/policy-save-feedback"
import { ResolvedPolicySummary } from "@/components/resolved-policy-summary"
import type { ApiResolvedPolicy } from "@/lib/api/policies"
import type { ApiOrganizationPolicy } from "@/lib/api/organizations"
import { getTask, updateTask } from "@/lib/api/tasks"

import {
  describeReviewOverride,
  labelSchemaRefsForTaskType,
  POLICY_DISPUTE_REFS,
  POLICY_EXPORT_REFS,
  POLICY_REVIEW_REFS,
} from "@/lib/policy-catalog"
import {
  displayPolicyRef,
  ORG_ANNOTATION_MODES,
  taskPolicyFormFromInputs,
  taskPolicyFormFromTask,
  taskPolicyFormsEqual,
  taskPolicyRefsEditable,
  taskUsesOrgDisputeDefault,
  taskUsesOrgExportDefault,
  validateOptionalPolicyRefId,
  validatePolicyRefId,
  type TaskPolicyFormSnapshot,
} from "@/lib/policy-display"
import { usePolicyNotice } from "@/hooks/use-policy-notice"
import { formatTaskClassLabel, formatTaskLabel, formatTaskStatusLabel } from "@/lib/task-format"
import {
  normalizeInitialTextSpanLabelOptions,
  normalizeTextSpanLabelOptions,
  textSpanLabelOptionsEqual,
} from "@/lib/text-span-label-options"
import type { MockTask } from "@/lib/domain/task-types"

type TaskPolicyForm = {
  label_schema_ref: string
  review_policy_ref: string
  dispute_policy_ref: string
  export_policy_ref: string
  annotation_mode: "ai_assisted" | "human_first"
  text_span_label_options: string[]
}

type TaskPolicyCardProps = {
  projectId: string
  task: MockTask
  organizationPolicy: ApiOrganizationPolicy | null
  resolvedPolicy?: ApiResolvedPolicy | null
  canEdit: boolean
  onSaved?: () => void
}

function taskToForm(task: MockTask): TaskPolicyForm {
  return {
    label_schema_ref: task.outputSchemaRef,
    review_policy_ref: task.reviewPolicyRef,
    dispute_policy_ref: task.disputePolicyRef ?? "",
    export_policy_ref: task.exportPolicyRef ?? "",
    annotation_mode: task.executionMode,
    text_span_label_options:
      normalizeInitialTextSpanLabelOptions(task.textSpanLabelOptions) ?? [],
  }
}

export function TaskPolicyCard({
  projectId,
  task,
  organizationPolicy,
  resolvedPolicy = null,
  canEdit,
  onSaved,
}: TaskPolicyCardProps) {
  const editable = canEdit && taskPolicyRefsEditable(task)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<TaskPolicyForm>(() => taskToForm(task))
  const [pending, setPending] = useState(false)
  const { feedback, showNotice, clearNotice } = usePolicyNotice()
  const baselineRef = useRef<TaskPolicyFormSnapshot | null>(null)
  const baselineLabelsRef = useRef<string[] | null>(null)
  const [textSpanLabelInput, setTextSpanLabelInput] = useState("")
  const [textSpanLabelError, setTextSpanLabelError] = useState<string | null>(null)

  useEffect(() => {
    setForm(taskToForm(task))
  }, [task])

  const inheritedDispute = taskUsesOrgDisputeDefault(task)
  const inheritedExport = taskUsesOrgExportDefault(task)
  const apiTaskType = task.taskType === "image" ? "image" : "text"
  const reviewOverrideHint = organizationPolicy
    ? describeReviewOverride(task.reviewPolicyRef, organizationPolicy.review_dual_sign_off)
    : ""

  function beginEditing() {
    const initial = taskToForm(task)
    baselineRef.current = taskPolicyFormFromTask(task)
    baselineLabelsRef.current = normalizeInitialTextSpanLabelOptions(task.textSpanLabelOptions) ?? []
    setForm(initial)
    setTextSpanLabelInput("")
    setTextSpanLabelError(null)
    clearNotice()
    setEditing(true)
  }

  function addTextSpanLabel() {
    const label = textSpanLabelInput.trim()
    if (!label) {
      setTextSpanLabelError("Please enter a label.")
      return
    }
    if (label.length > 64) {
      setTextSpanLabelError("Each label must be 64 characters or fewer.")
      return
    }
    if (form.text_span_label_options.length >= 20) {
      setTextSpanLabelError("You can add up to 20 labels.")
      return
    }
    if (form.text_span_label_options.some((existing) => existing.trim().toLowerCase() === label.toLowerCase())) {
      setTextSpanLabelError("This label already exists.")
      return
    }

    try {
      const normalized = normalizeTextSpanLabelOptions([...form.text_span_label_options, label])
      setForm((prev) => ({ ...prev, text_span_label_options: normalized }))
      setTextSpanLabelInput("")
      setTextSpanLabelError(null)
    } catch (error) {
      setTextSpanLabelError(error instanceof Error ? error.message : "Invalid text span labels.")
    }
  }

  function removeTextSpanLabel(labelToRemove: string) {
    setForm((prev) => ({
      ...prev,
      text_span_label_options: prev.text_span_label_options.filter((label) => label !== labelToRemove),
    }))
    setTextSpanLabelError(null)
  }

  async function handleSave() {
    if (!baselineRef.current) return

    const validationErrors = [
      validatePolicyRefId(form.label_schema_ref, "Output schema"),
      validatePolicyRefId(form.review_policy_ref, "Review policy"),
      validateOptionalPolicyRefId(form.dispute_policy_ref, "Dispute policy"),
      validateOptionalPolicyRefId(form.export_policy_ref, "Export policy"),
    ].filter((message): message is string => message !== null)

    if (validationErrors.length > 0) {
      showNotice({ kind: "error", message: validationErrors[0] || "Invalid policy reference." })
      return
    }

    let normalizedLabels: string[]
    try {
      normalizedLabels = normalizeTextSpanLabelOptions(form.text_span_label_options)
    } catch (error) {
      showNotice({
        kind: "error",
        message: error instanceof Error ? error.message : "Invalid text span labels.",
      })
      return
    }

    const nextSnapshot = taskPolicyFormFromInputs(form)
    const labelsChanged = !textSpanLabelOptionsEqual(normalizedLabels, baselineLabelsRef.current ?? [])
    if (taskPolicyFormsEqual(nextSnapshot, baselineRef.current) && !labelsChanged) {
      setEditing(false)
      baselineRef.current = null
      baselineLabelsRef.current = null
      setTextSpanLabelInput("")
      setTextSpanLabelError(null)
      showNotice({ kind: "info", message: "No changes to save." })
      return
    }

    setPending(true)
    clearNotice()

    const current = await getTask(task.id)
    if (!current.ok) {
      setPending(false)
      showNotice({ kind: "error", message: current.error.message })
      return
    }

    const apiTask = current.data
    const result = await updateTask(projectId, task.id, {
      title: apiTask.title,
      description: apiTask.description,
      judgment_question: apiTask.judgment_question,
      task_type: apiTask.task_type,
      annotation_mode: form.annotation_mode,
      label_schema_ref: form.label_schema_ref.trim(),
      review_policy_ref: form.review_policy_ref.trim() || null,
      dispute_policy_ref: form.dispute_policy_ref.trim() || null,
      export_policy_ref: form.export_policy_ref.trim() || null,
      text_span_label_options:
        apiTask.task_type === "text"
          ? normalizedLabels.length > 0
            ? normalizedLabels
            : null
          : apiTask.text_span_label_options ?? null,
    })

    setPending(false)
    if (!result.ok) {
      showNotice({ kind: "error", message: result.error.message })
      return
    }

    showNotice({ kind: "success", message: "Task policy refs updated." })
    setEditing(false)
    baselineRef.current = null
    baselineLabelsRef.current = null
    setTextSpanLabelInput("")
    setTextSpanLabelError(null)
    onSaved?.()
  }

  const reviewPolicyInherited = !task.reviewPolicyRef || task.reviewPolicyRef.trim() === ""
  const reviewPolicyModeLabel =
    resolvedPolicy?.review_mode === "dual_signoff" ? "Dual sign-off" : "Single pass"
  const reviewPolicyApprovalsLabel =
    resolvedPolicy == null
      ? ""
      : `${resolvedPolicy.review_required_approvals} ${
          resolvedPolicy.review_required_approvals === 1 ? "approval required" : "approvals required"
        }`
  const reviewPolicyInheritanceLabel = reviewPolicyInherited
    ? "Inherits organization default"
    : "Overrides organization default"

  const readRows = [
    {
      icon: FileCode2,
      label: "Output schema",
      value: task.outputSchemaRef,
    },
    {
      icon: GitBranchPlus,
      label: "Review policy",
      value: task.reviewPolicyRef,
    },
    {
      icon: ShieldAlert,
      label: "Dispute policy",
      value: displayPolicyRef(
        task.disputePolicyRef,
        "Inherited from organization defaults",
      ),
    },
    {
      icon: FileOutput,
      label: "Export policy",
      value: displayPolicyRef(task.exportPolicyRef, "Inherited from organization defaults"),
    },
  ]

  return (
    <Card className="hej-surface-dark rounded-[1.2rem] border-slate-900/10 bg-white/80 shadow-[0_10px_24px_rgba(15,23,42,0.04)] dark:border-white/10">
      <CardHeader className="flex flex-col gap-3 px-4 md:flex-row md:items-start md:justify-between md:px-5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-lg font-semibold tracking-tight text-slate-900">
              {task.title}
            </CardTitle>
            <Badge variant="outline">{formatTaskStatusLabel(task.status)}</Badge>
            <Badge variant="outline">{formatTaskClassLabel(task.taskClass)}</Badge>
            <Badge className="bg-slate-900 text-white">
              {formatTaskLabel(task.taskType)}
            </Badge>
          </div>
          {resolvedPolicy ? (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] leading-5 text-slate-600">
              <Badge
                variant="outline"
                className="border-slate-900/10 bg-slate-50 text-slate-700"
              >
                {reviewPolicyModeLabel}
              </Badge>
              <Badge
                variant="outline"
                className="border-slate-900/10 bg-slate-50 text-slate-700"
              >
                {reviewPolicyApprovalsLabel}
              </Badge>
              <Badge
                variant="outline"
                className={
                  reviewPolicyInherited
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-amber-200 bg-amber-50 text-amber-800"
                }
              >
                {reviewPolicyInheritanceLabel}
              </Badge>
            </div>
          ) : null}
          <CardDescription className="text-[13px] leading-5 text-slate-600">
            Task-declared policy refs. Dispute and export fall back to organization defaults when
            unset.
            <span className="mt-1 block text-slate-500">
              Task items inherit this task&apos;s review policy.
            </span>
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/tasks/${task.id}/setup`}>
              Setup
              <ExternalLink className="ml-1 size-3" />
            </Link>
          </Button>
          {editable ? (
            editing ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() => {
                    setEditing(false)
                    setForm(taskToForm(task))
                    baselineRef.current = null
                    baselineLabelsRef.current = null
                    setTextSpanLabelInput("")
                    setTextSpanLabelError(null)
                    clearNotice()
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="bg-slate-900 text-stone-100"
                  disabled={pending}
                  onClick={() => void handleSave()}
                >
                  {pending ? "Saving…" : "Save refs"}
                </Button>
              </>
            ) : (
              <Button type="button" variant="outline" size="sm" onClick={beginEditing}>
                Edit refs
              </Button>
            )
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-4 md:px-5">
        <PolicySaveFeedback feedback={feedback} />

        {resolvedPolicy && !editing ? (
          <ResolvedPolicySummary policy={resolvedPolicy} />
        ) : null}

        {!editable && canEdit ? (
          <p className="text-[12px] text-slate-500">
            Policy refs are locked while the task is in review or completed.
          </p>
        ) : null}

        {!canEdit ? (
          <p className="text-[12px] text-slate-500">Task owner or org admin access required.</p>
        ) : null}

        {editing ? (
          <div className="grid gap-3">
            <PolicyRefField
              id={`${task.id}-label-schema`}
              label="Output schema"
              value={form.label_schema_ref}
              suggestions={labelSchemaRefsForTaskType(apiTaskType)}
              onChange={(value) => setForm((prev) => ({ ...prev, label_schema_ref: value }))}
            />
            <PolicyRefField
              id={`${task.id}-review-policy`}
              label="Review policy"
              value={form.review_policy_ref}
              suggestions={POLICY_REVIEW_REFS}
              onChange={(value) => setForm((prev) => ({ ...prev, review_policy_ref: value }))}
            />
            <PolicyRefField
              id={`${task.id}-dispute-policy`}
              label="Dispute policy ref"
              value={form.dispute_policy_ref}
              suggestions={POLICY_DISPUTE_REFS}
              placeholder="Leave empty to inherit org defaults"
              onChange={(value) => setForm((prev) => ({ ...prev, dispute_policy_ref: value }))}
            />
            <PolicyRefField
              id={`${task.id}-export-policy`}
              label="Export policy ref"
              value={form.export_policy_ref}
              suggestions={POLICY_EXPORT_REFS}
              placeholder="Leave empty to inherit org defaults"
              onChange={(value) => setForm((prev) => ({ ...prev, export_policy_ref: value }))}
            />
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Execution mode
              </p>
              <Select
                value={form.annotation_mode}
                onValueChange={(value: "ai_assisted" | "human_first") =>
                  setForm((prev) => ({ ...prev, annotation_mode: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORG_ANNOTATION_MODES.map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {mode === "ai_assisted" ? "AI-assisted" : "Human-first"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {task.taskType === "text" ? (
              <div className="grid gap-2 rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Text span quick labels</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    value={textSpanLabelInput}
                    onChange={(event) => {
                      setTextSpanLabelInput(event.target.value)
                      if (textSpanLabelError) setTextSpanLabelError(null)
                    }}
                    placeholder="Add a label"
                    className="max-w-56"
                  />
                  <Button type="button" onClick={addTextSpanLabel}>Add</Button>
                </div>
                {textSpanLabelError ? (
                  <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] font-medium leading-5 text-rose-700">
                    {textSpanLabelError}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  {form.text_span_label_options.map((label) => (
                    <Badge key={label} variant="outline" className="flex items-center gap-1.5 border-slate-900/10 bg-white/80 text-slate-700">
                      {label}
                      <button
                        type="button"
                        onClick={() => removeTextSpanLabel(label)}
                        className="ml-1 rounded-full px-1 text-slate-500 hover:text-slate-900"
                        aria-label={`Remove ${label}`}
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-3">
            {readRows.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="hej-surface-soft flex items-center gap-3 rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10"
              >
                <div className="rounded-lg bg-slate-900 p-2 text-stone-100">
                  <Icon className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
                  <p className="mt-1 break-all text-sm font-medium text-slate-900">{value}</p>
                  {label === "Review policy" && reviewOverrideHint ? (
                    <p className="mt-1 text-[11px] text-amber-800">{reviewOverrideHint}</p>
                  ) : null}
                  {label === "Review policy" && resolvedPolicy ? (
                    <p className="mt-1 text-[11px] text-slate-500">
                      {reviewPolicyModeLabel} · {reviewPolicyApprovalsLabel}
                    </p>
                  ) : null}
                  {label === "Dispute policy" && inheritedDispute ? (
                    <p className="mt-1 text-[11px] text-slate-500">Org default applies</p>
                  ) : null}
                  {label === "Export policy" && inheritedExport ? (
                    <p className="mt-1 text-[11px] text-slate-500">Org default applies</p>
                  ) : null}
                </div>
              </div>
            ))}
            <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Execution mode</p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {task.executionMode === "ai_assisted" ? "AI-assisted" : "Human-first"}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
