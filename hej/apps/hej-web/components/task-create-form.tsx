"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  ArrowLeft,
  Bot,
  Check,
  ChevronRight,
  FileQuestion,
  FolderPlus,
  Image,
  MessageSquareQuote,
  Mic,
  Scale,
  Settings2,
  Sparkles,
  Tags,
  Type,
  UserRoundPen,
  Video,
} from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import { createTask, type CreateTaskPayload } from "@/lib/api/tasks"

import { defaultTaskPolicyRefs, resolveApiTaskType } from "@/lib/policy-catalog"
import type { MockProject } from "@/lib/domain/project-types"
import {
  getDefaultTextSpanLabelOptions,
  getInitialTextSpanLabelOptions,
  normalizeInitialTextSpanLabelOptions,
  normalizeTextSpanLabelOptions,
  type InitialTextSpanLabelOptions,
  type TaskClass,
} from "@/lib/text-span-label-options"

export {
  getDefaultTextSpanLabelOptions,
  getInitialTextSpanLabelOptions,
  normalizeInitialTextSpanLabelOptions,
  normalizeTextSpanLabelOptions,
}
export type { InitialTextSpanLabelOptions, TaskClass }

type TaskCreateFormProps = {
  project: MockProject
  initialTextSpanLabelOptions?: InitialTextSpanLabelOptions
}

type ExecutionMode = "ai_assisted" | "human_first"
type TaskType = "image" | "text" | "audio" | "video"
type TaskSubtypeOption = {
  id: string
  label: string
  taskType: TaskType
  icon: React.ComponentType<{ className?: string }>
}

const annotationTypeOptions = [
  { id: "text_annotation", label: "Text annotation", taskType: "text", icon: Type },
  { id: "image_annotation", label: "Image annotation", taskType: "image", icon: Image },
  { id: "audio_annotation", label: "Audio annotation", taskType: "audio", icon: Mic },
  { id: "video_annotation", label: "Video annotation", taskType: "video", icon: Video },
] as const satisfies readonly TaskSubtypeOption[]

const judgementTypeOptions = [
  { id: "llm_answer_evaluation", label: "LLM answer evaluation", taskType: "text", icon: MessageSquareQuote },
  { id: "claim_support_judgement", label: "Claim support judgement", taskType: "text", icon: Scale },
  { id: "policy_decision_judgement", label: "Policy decision judgement", taskType: "text", icon: FileQuestion },
  { id: "reasoning_quality_judgement", label: "Reasoning quality judgement", taskType: "text", icon: Sparkles },
] as const satisfies readonly TaskSubtypeOption[]

function formatTypeLabel(value: string) {
  return value.replaceAll("_", " ")
}

const DEFAULT_TITLES: Record<TaskClass, string> = {
  annotation: "",
  judgement: "",
}

const DEFAULT_OBJECTIVES: Record<TaskClass, string> = {
  annotation: "",
  judgement: "",
}

export function TaskCreateForm({
  project,
  initialTextSpanLabelOptions,
}: TaskCreateFormProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [taskTitleError, setTaskTitleError] = useState<string | null>(null)
  const [taskObjectiveError, setTaskObjectiveError] = useState<string | null>(null)
  const [taskTypeError, setTaskTypeError] = useState<string | null>(null)
  const [step, setStep] = useState(0)
  const [taskClass, setTaskClass] = useState<TaskClass>("annotation")
  const [taskSubtypeId, setTaskSubtypeId] = useState<string>(annotationTypeOptions[0].id)
  const [taskType, setTaskType] = useState<TaskType>(annotationTypeOptions[0].taskType)
  const [executionMode, setExecutionMode] = useState<ExecutionMode>("ai_assisted")
  const [executionNotes, setExecutionNotes] = useState(
    "OpenAI adapter enabled, batch candidate generation, confidence threshold 0.72, fallback to human-first if import fails."
  )
  const [rulesText, setRulesText] = useState(
    taskClass === "judgement"
      ? "Describe how the item should be judged, what verdicts are allowed, how to handle ambiguity, and what rationale is required. This instruction set should be reusable by both humans and AI."
      : "Describe how the item should be annotated, what labels are allowed, how to handle ambiguity, and what minimum rationale is required. This instruction set should be reusable by both humans and AI."
  )
  const [schemaText, setSchemaText] = useState(
    taskClass === "judgement"
      ? "Output schema: verdict + rationale + policy note. Workflow rules: draft -> active -> annotate -> review -> dispute if unresolved."
      : "Output schema: label + rationale + evidence span. Workflow rules: draft -> active -> annotate -> review -> dispute if unresolved."
  )
  const [advancedConfig, setAdvancedConfig] = useState(
    "Optional: batching strategy, assignment defaults, review threshold, export bundle options, integration notes, and provenance requirements."
  )
  const [textSpanLabelOptions, setTextSpanLabelOptions] = useState<string[]>(() =>
    getInitialTextSpanLabelOptions("annotation", initialTextSpanLabelOptions),
  )
  const [textSpanLabelInput, setTextSpanLabelInput] = useState("")
  const [textSpanLabelError, setTextSpanLabelError] = useState<string | null>(null)
  const [textSpanLabelsDirty, setTextSpanLabelsDirty] = useState(false)
  // Controlled so the submit handler can read current values without a form ref.
  // Switching taskClass overwrites these from the new class defaults (see changeTaskClass).
  const [taskTitle, setTaskTitle] = useState<string>(DEFAULT_TITLES.annotation)
  const [taskObjective, setTaskObjective] = useState<string>(DEFAULT_OBJECTIVES.annotation)

  const steps = [
    "Task class",
    "Task type",
    "Execution mode",
    "Shared rules",
    "Launch options",
  ]

  const step1Summary = `${taskClass === "judgement" ? "Judgement" : "Annotation"} · ${formatTypeLabel(taskSubtypeId)} · ${executionMode === "ai_assisted" ? "AI-assisted" : "Human-first"}`

  const modeOptions = [
    {
      id: "ai_assisted" as const,
      title: "AI-assisted",
      text:
        taskClass === "judgement"
          ? "AI can draft answer evaluations or verdict candidates first, then humans govern the outputs."
          : "AI annotates in the background first, then humans govern the outputs.",
    },
    {
      id: "human_first" as const,
      title: "Human-first",
      text:
        taskClass === "judgement"
          ? "Humans open task items directly, make the first structured judgement, and hand the result into review afterwards."
          : "Humans annotate task items directly, then downstream review and dispute remain available.",
    },
  ]

  const taskTypeOptions =
    taskClass === "judgement" ? judgementTypeOptions : annotationTypeOptions
  const rulesLabel =
    taskClass === "judgement" ? "Shared judgement instructions" : "Shared annotation rules"
  const rulesDescription =
    taskClass === "judgement"
      ? "Describe how the item should be judged, what verdicts are allowed, how to handle ambiguity, and what rationale is required. This instruction set should be reusable by both humans and AI."
      : "Describe how the item should be annotated, what labels are allowed, how to handle ambiguity, and what minimum rationale is required. This instruction set should be reusable by both humans and AI."
  const schemaLabel =
    "Output schema and workflow rules"
  const schemaDescription =
    taskClass === "judgement"
      ? "Output schema: verdict + rationale + policy note. Workflow rules: draft -> active -> annotate -> review -> dispute if unresolved."
      : "Output schema: label + rationale + evidence span. Workflow rules: draft -> active -> annotate -> review -> dispute if unresolved."

  function changeTaskClass(nextClass: TaskClass) {
    setTaskClass(nextClass)
    const nextOption =
      nextClass === "judgement" ? judgementTypeOptions[0] : annotationTypeOptions[0]
    setTaskSubtypeId(nextOption.id)
    setTaskType(nextOption.taskType)
    setTaskTitle(DEFAULT_TITLES[nextClass])
    setTaskObjective(DEFAULT_OBJECTIVES[nextClass])
    setRulesText(
      nextClass === "judgement"
        ? "Describe how the item should be judged, what verdicts are allowed, how to handle ambiguity, and what rationale is required. This instruction set should be reusable by both humans and AI."
        : "Describe how the item should be annotated, what labels are allowed, how to handle ambiguity, and what minimum rationale is required. This instruction set should be reusable by both humans and AI."
    )
    setSchemaText(
      nextClass === "judgement"
        ? "Output schema: verdict + rationale + policy note. Workflow rules: draft -> active -> annotate -> review -> dispute if unresolved."
        : "Output schema: label + rationale + evidence span. Workflow rules: draft -> active -> annotate -> review -> dispute if unresolved."
    )
    if (!textSpanLabelsDirty) {
      setTextSpanLabelOptions(getInitialTextSpanLabelOptions(nextClass, initialTextSpanLabelOptions))
    }
    setTextSpanLabelError(null)
    setTextSpanLabelInput("")
  }

  function addTextSpanLabel() {
    if (taskType !== "text") return

    const label = textSpanLabelInput.trim()
    if (!label) {
      setTextSpanLabelError("Please enter a label.")
      return
    }
    if (label.length > 64) {
      setTextSpanLabelError("Each label must be 64 characters or fewer.")
      return
    }
    if (textSpanLabelOptions.length >= 20) {
      setTextSpanLabelError("You can add up to 20 labels.")
      return
    }
    if (textSpanLabelOptions.some((existing) => existing.trim().toLowerCase() === label.toLowerCase())) {
      setTextSpanLabelError("This label already exists.")
      return
    }

    setTextSpanLabelOptions((current) => [...current, label])
    setTextSpanLabelInput("")
    setTextSpanLabelError(null)
    setTextSpanLabelsDirty(true)
  }

  function removeTextSpanLabel(labelToRemove: string) {
    setTextSpanLabelOptions((current) => current.filter((label) => label !== labelToRemove))
    setTextSpanLabelsDirty(true)
    setTextSpanLabelError(null)
  }

  function resetTextSpanLabelOptions() {
    setTextSpanLabelOptions(getInitialTextSpanLabelOptions(taskClass, initialTextSpanLabelOptions))
    setTextSpanLabelsDirty(false)
    setTextSpanLabelInput("")
    setTextSpanLabelError(null)
  }

  function handleNextStep() {
    if (step === 1) {
      const hasTitle = taskTitle.trim().length > 0
      const hasObjective = taskObjective.trim().length > 0
      const hasTaskType = Boolean(taskSubtypeId)

      setTaskTitleError(hasTitle ? null : "Please enter a task title.")
      setTaskObjectiveError(hasObjective ? null : "Please enter a task objective.")
      setTaskTypeError(hasTaskType ? null : "Please select a task type.")

      if (!hasTitle || !hasObjective || !hasTaskType) {
        return
      }
    }

    setStep((currentStep) => Math.min(currentStep + 1, steps.length - 1))
  }

  const handleCreateTask = async () => {
    if (submitting) return

    const trimmedTitle = taskTitle.trim()
    if (!trimmedTitle) {
      setTaskTitleError("Please enter a task title.")
      return
    }

    const apiTaskType = resolveApiTaskType(taskType)
    const policyDefaults = defaultTaskPolicyRefs(apiTaskType)

    let normalizedTextSpanLabelOptions: string[] = []
    if (taskType === "text") {
      try {
        normalizedTextSpanLabelOptions = normalizeTextSpanLabelOptions(textSpanLabelOptions)
      } catch (error) {
        setTextSpanLabelError(error instanceof Error ? error.message : "Invalid text span labels.")
        return
      }
    }

    setSubmitting(true)
    setSubmitError(null)
    setTaskTitleError(null)

    const payload: CreateTaskPayload = {
      title: trimmedTitle,
      description: `${taskClass} / ${taskSubtypeId}`,
      judgment_question: taskObjective.trim() || DEFAULT_OBJECTIVES[taskClass],
      task_type: apiTaskType,
      annotation_mode: executionMode || policyDefaults.annotation_mode,
      label_schema_ref: policyDefaults.label_schema_ref,
      ...(taskType === "text"
        ? {
            text_span_label_options:
              normalizedTextSpanLabelOptions.length > 0 ? normalizedTextSpanLabelOptions : null,
          }
        : {}),
      review_policy_ref: policyDefaults.review_policy_ref,
      dispute_policy_ref: policyDefaults.dispute_policy_ref,
      export_policy_ref: policyDefaults.export_policy_ref,
    }

    try {
      const result = await createTask(project.id, payload)
      if (!result.ok) {
        setSubmitError(result.error.message)
        return
      }
      router.push(`/tasks/${result.data.id}/setup`)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to create task")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid items-start gap-4">
      <Card className="hej-surface-dark rounded-[1.3rem] border-slate-900/10 bg-white/84 shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-white/10">
        <CardHeader className="px-4 py-4 md:px-5 md:py-4">
          <CardTitle className="text-xl font-semibold tracking-tight text-slate-950">
            Create a task
          </CardTitle>
          <CardDescription className="mt-1 max-w-2xl text-[13px] leading-5 text-slate-600">
            Create the task shell in five steps. Add task items on the task Setup page (Data intake).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-4 pb-4 md:px-5 md:pb-5">
          <div className="grid gap-2.5">
            <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 px-3.5 py-2.5 text-[12px] leading-5 text-slate-500 dark:border-white/10 dark:bg-white/[0.03]">
              Project context: <span className="font-medium text-slate-700 dark:text-slate-200">{project.name}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {steps.map((label, index) => {
                const complete = index < step
                const active = index === step

                return (
                  <div key={label} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setStep(index)}
                      className={`flex items-center gap-2 rounded-full border px-2.5 py-1.25 text-[13px] transition-[color,background-color,border-color,transform] duration-150 ease-out active:scale-[0.97] ${
                        active
                          ? "border-slate-950 bg-slate-950 text-stone-100"
                          : complete
                            ? "border-amber-300 bg-amber-300 text-slate-950"
                            : "border-slate-900/10 bg-white text-slate-700 dark:border-white/10 dark:text-slate-300"
                      }`}
                    >
                      <span className="flex size-5 items-center justify-center rounded-full bg-black/10 text-xs font-semibold">
                        {complete ? <Check className="size-3.5" /> : index + 1}
                      </span>
                      <span>{label}</span>
                    </button>
                    {index < steps.length - 1 ? (
                      <ChevronRight className="size-4 text-slate-300" />
                    ) : null}
                  </div>
                )
              })}
            </div>
            <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 px-3.5 py-2.5 text-[13px] text-slate-700 dark:border-white/10 dark:text-slate-300">
              {`Step ${step + 1} of ${steps.length}: ${steps[step]}`}
            </div>
          </div>

          {step === 0 ? (
            <div className="grid gap-3">
              <label className="text-sm font-medium text-slate-700">Task class</label>
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  {
                    id: "annotation" as const,
                    title: "Annotation",
                    text: "Produce labels, spans, classifications, or multimodal markings.",
                    icon: Tags,
                  },
                  {
                    id: "judgement" as const,
                    title: "Judgement",
                    text: "Evaluate an answer, claim, or decision and produce a verdict with rationale.",
                    icon: Scale,
                  },
                ].map(({ id, title, text, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => changeTaskClass(id)}
                    className={`rounded-xl border p-4 text-left transition-[color,background-color,border-color,transform] duration-150 ease-out active:scale-[0.98] ${
                      taskClass === id
                        ? "border-slate-950 bg-slate-950 text-stone-100"
                        : "hej-surface-soft border-slate-900/10 bg-stone-50/88 text-slate-900 hover:bg-stone-100 dark:border-white/10 dark:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-base font-semibold">{title}</h3>
                      <div
                        className={`rounded-lg p-2 ${
                          taskClass === id ? "bg-white/12" : "bg-slate-900 text-stone-100"
                        }`}
                      >
                        <Icon className="size-4" />
                      </div>
                    </div>
                    <p className="mt-2 text-[13px] leading-5 opacity-90">{text}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="grid gap-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">Task title</label>
                <Input
                  value={taskTitle}
                  onChange={(event) => {
                    setTaskTitle(event.target.value)
                    if (taskTitleError) setTaskTitleError(null)
                  }}
                  placeholder="Enter a task title"
                  required
                />
                {taskTitleError ? (
                  <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] font-medium leading-5 text-rose-700">
                    {taskTitleError}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">Task objective</label>
                <Textarea
                  value={taskObjective}
                  onChange={(event) => {
                    setTaskObjective(event.target.value)
                    if (taskObjectiveError) setTaskObjectiveError(null)
                  }}
                  className="min-h-28"
                  placeholder="Describe what the task should accomplish"
                />
                {taskObjectiveError ? (
                  <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] font-medium leading-5 text-rose-700">
                    {taskObjectiveError}
                  </p>
                ) : null}
              </div>
              <label className="text-sm font-medium text-slate-700">Task type</label>
              {taskTypeError ? (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] font-medium leading-5 text-rose-700">
                  {taskTypeError}
                </p>
              ) : null}
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {taskTypeOptions.map(({ id, label, taskType: optionTaskType, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setTaskSubtypeId(id)
                      setTaskType(optionTaskType)
                      if (taskTypeError) setTaskTypeError(null)
                    }}
                    className={`rounded-xl border p-3 text-left transition-[color,background-color,border-color,transform] duration-150 ease-out active:scale-[0.98] ${
                      taskSubtypeId === id
                        ? "border-slate-950 bg-slate-950 text-stone-100"
                        : "hej-surface-soft border-slate-900/10 bg-stone-50/88 text-slate-900 hover:bg-stone-100 dark:border-white/10 dark:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-lg p-2 ${
                          taskSubtypeId === id ? "bg-white/12" : "bg-slate-900 text-stone-100"
                        }`}
                      >
                        <Icon className="size-4" />
                      </div>
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step > 1 ? (
            <div className="rounded-xl border border-slate-900/10 bg-slate-50/70 px-3.5 py-2.5 text-[12px] leading-5 text-slate-600 dark:border-white/10 dark:bg-white/[0.03]">
              {step1Summary}
            </div>
          ) : null}

          {step >= 1 ? (
            <div className="rounded-xl border border-slate-900/10 bg-stone-50/88 px-3.5 py-2.5 text-[13px] leading-5 text-slate-700 dark:border-white/10">
              Task items are connected after creation on the task{" "}
              <span className="font-medium text-slate-900">Setup</span> page via{" "}
              <span className="font-medium text-slate-900">Data intake</span> (upload, register
              pointers, or batch import). Items in one task can use different sources.
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-4">
              <div className="grid gap-3">
                <label className="text-sm font-medium text-slate-700">Execution mode</label>
                <div className="grid gap-3 md:grid-cols-2">
                  {modeOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setExecutionMode(option.id)}
                      className={`rounded-xl border p-4 text-left transition-[color,background-color,border-color,transform] duration-150 ease-out active:scale-[0.98] ${
                        executionMode === option.id
                          ? "border-slate-950 bg-slate-950 text-stone-100"
                        : "hej-surface-soft border-slate-900/10 bg-stone-50/88 text-slate-900 hover:bg-stone-100 dark:border-white/10 dark:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-base font-semibold">{option.title}</h3>
                        <div
                          className={`rounded-lg p-2 ${
                            executionMode === option.id
                              ? "bg-white/12"
                              : "bg-slate-900 text-stone-100"
                          }`}
                        >
                          {option.id === "ai_assisted" ? (
                            <Sparkles className="size-4" />
                          ) : (
                            <UserRoundPen className="size-4" />
                          )}
                        </div>
                      </div>
                      <p className="mt-2 text-[13px] leading-5 opacity-90">{option.text}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">
                  {executionMode === "ai_assisted"
                    ? taskClass === "judgement"
                      ? "AI judgement options"
                      : "AI annotation options"
                    : taskClass === "judgement"
                      ? "Human judgement options"
                      : "Human annotation options"}
                </label>
                <Textarea
                  value={executionNotes}
                  onChange={(event) => setExecutionNotes(event.target.value)}
                  className="min-h-32"
                />
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">{rulesLabel}</label>
                <Textarea value={rulesText} onChange={(event) => setRulesText(event.target.value)} className="min-h-40" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">{schemaLabel}</label>
                <Textarea value={schemaText} onChange={(event) => setSchemaText(event.target.value)} className="min-h-28" />
              </div>

              {taskType === "text" ? (
                <div className="grid gap-3 rounded-xl border border-slate-900/10 bg-stone-50/88 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                      Text span quick labels
                    </label>
                    <p className="text-[13px] leading-5 text-slate-600">
                      Used as quick-label buttons when annotating text spans.
                    </p>
                  </div>

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
                    <Button type="button" onClick={addTextSpanLabel}>
                      Add
                    </Button>
                    <Button type="button" variant="outline" onClick={resetTextSpanLabelOptions}>
                      Reset defaults
                    </Button>
                  </div>

                  {textSpanLabelError ? (
                    <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] font-medium leading-5 text-rose-700">
                      {textSpanLabelError}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    {textSpanLabelOptions.map((label) => (
                      <Badge
                        key={label}
                        variant="outline"
                        className="flex items-center gap-1.5 border-slate-900/10 bg-white/80 text-slate-700"
                      >
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
          ) : null}

          {step === 4 ? (
            <div className="grid gap-4">
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-600">
                Default policy refs for this modality will be applied on create. Adjust them
                anytime under the project{" "}
                <span className="font-medium text-slate-900">Policies</span> tab after creation.
              </p>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">
                  Advanced configuration
                </label>
                <Textarea
                  value={advancedConfig}
                  onChange={(event) => setAdvancedConfig(event.target.value)}
                  className="min-h-28"
                />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  { label: "Task class", value: taskClass },
                  { label: "Task type", value: formatTypeLabel(taskSubtypeId) },
                  {
                    label: "Execution",
                    value: executionMode === "ai_assisted" ? "AI-assisted" : "Human-first",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10"
                  >
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      {item.label}
                    </p>
                    <p className="mt-2 text-sm font-semibold capitalize text-slate-900">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">
                  Policy bundles (applied on create)
                </label>
                <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 p-4 dark:border-white/10">
                  <p className="font-mono text-sm font-medium text-slate-900">
                    {defaultTaskPolicyRefs(resolveApiTaskType(taskType)).label_schema_ref}
                  </p>
                  <p className="mt-2 text-[13px] leading-5 text-slate-600">
                    Review:{" "}
                    {defaultTaskPolicyRefs(resolveApiTaskType(taskType)).review_policy_ref}. Dispute
                    and export inherit organization defaults until you set refs on Policies.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            {step > 0 ? (
              <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            ) : null}
            {step < steps.length - 1 ? (
              <Button
                type="button"
                className="bg-slate-900 text-stone-100"
                onClick={handleNextStep}
              >
                Next step
                <ChevronRight />
              </Button>
            ) : (
              <Button
                className="bg-slate-900 text-stone-100"
                type="button"
                disabled={submitting}
                onClick={handleCreateTask}
              >
                <FolderPlus />
                {submitting ? "Submitting\u2026" : "Create Task Draft"}
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href={`/projects/${project.id}/tasks`}>
                <ArrowLeft />
                Back to project tasks
              </Link>
            </Button>
          </div>

          {submitError ? (
            <div className="rounded-xl border border-red-300 bg-red-50 px-3.5 py-3 text-[13px] leading-5 text-red-900">
              Could not create task: {submitError}
            </div>
          ) : null}

          {step === steps.length - 1 ? (
            <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 px-3.5 py-3 text-[13px] leading-5 text-slate-600 dark:border-white/10 dark:text-slate-300">
              After create you will land on <span className="font-medium text-slate-900">Setup</span> to
              add items. Then open Items or Annotate when registration is complete.
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <Card className="hej-surface-dark rounded-[1.3rem] border-slate-900/10 bg-white/84 shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-white/10">
          <CardHeader className="px-4 py-4 md:px-5 md:py-4">
            <CardTitle className="text-lg font-semibold tracking-tight text-slate-950">
              Task creation path
            </CardTitle>
            <CardDescription className="mt-1 text-[13px] leading-5 text-slate-600">
              Compact guidance for the five setup decisions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-4 pt-0 md:px-5 md:pb-5">
            <div className="rounded-xl border border-slate-900/10 bg-slate-50/70 px-3.5 py-3 text-[13px] leading-5 text-slate-600 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="space-y-1">
                <div>1. Task class</div>
                <div>2. Task type</div>
                <div>3. Execution mode</div>
                <div>4. Shared rules</div>
                <div>5. Launch options</div>
                <div className="mt-2 border-t border-slate-900/10 pt-2 text-slate-500">
                  Data intake (upload, pointers, batch) runs on task Setup after create.
                </div>
              </div>
            </div>

            <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-slate-50/88 p-3.5 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-slate-900 p-2 text-stone-100">
                  <Settings2 className="size-3.5" />
                </div>
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                    Current draft
                  </p>
                  <p className="text-sm font-medium text-slate-900">{step1Summary}</p>
                </div>
              </div>
              <p className="mt-2 text-[12px] leading-5 text-slate-500">
                Project {project.name} · backend id {project.id}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
