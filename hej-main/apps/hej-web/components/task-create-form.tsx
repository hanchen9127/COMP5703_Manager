"use client"

import Link from "next/link"
import { useState } from "react"
import {
  ArrowLeft,
  Bot,
  Check,
  ChevronRight,
  DatabaseZap,
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
import type { MockProject } from "@/lib/mock-data"

type TaskCreateFormProps = {
  project: MockProject
}

type TaskClass = "annotation" | "judgement"
type ExecutionMode = "ai_assisted" | "human_first"

const annotationTypeOptions = [
  { id: "text_annotation", label: "Text annotation", icon: Type },
  { id: "image_annotation", label: "Image annotation", icon: Image },
  { id: "audio_annotation", label: "Audio annotation", icon: Mic },
  { id: "video_annotation", label: "Video annotation", icon: Video },
] as const

const judgementTypeOptions = [
  { id: "llm_answer_evaluation", label: "LLM answer evaluation", icon: MessageSquareQuote },
  { id: "claim_support_judgement", label: "Claim support judgement", icon: Scale },
  { id: "policy_decision_judgement", label: "Policy decision judgement", icon: FileQuestion },
  { id: "reasoning_quality_judgement", label: "Reasoning quality judgement", icon: Sparkles },
] as const

function formatTypeLabel(value: string) {
  return value.replaceAll("_", " ")
}

export function TaskCreateForm({ project }: TaskCreateFormProps) {
  const [step, setStep] = useState(0)
  const [taskClass, setTaskClass] = useState<TaskClass>("annotation")
  const [taskType, setTaskType] = useState<string>(annotationTypeOptions[0].id)
  const [executionMode, setExecutionMode] = useState<ExecutionMode>("ai_assisted")
  const [storageProvider, setStorageProvider] = useState("AWS S3")
  const [storagePath, setStoragePath] = useState(
    "s3://arc-intelligence/reasoning-conflict-resolution/"
  )

  const steps = [
    "Task class",
    "Task type",
    "Data source",
    "Execution mode",
    "Shared rules",
    "Launch options",
  ]

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

  const storageOptions = ["AWS S3", "Google Cloud Storage", "Azure Blob", "Mock source"]
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
    const nextType =
      nextClass === "judgement" ? judgementTypeOptions[0].id : annotationTypeOptions[0].id
    setTaskType(nextType)
  }

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
      <Card className="hej-surface-dark rounded-[1.3rem] border-slate-900/10 bg-white/84 shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-white/10">
        <CardHeader className="px-4 md:px-5">
          <CardTitle className="text-xl font-semibold tracking-tight text-slate-950">
            Create task
          </CardTitle>
          <CardDescription className="mt-1 max-w-2xl text-[13px] leading-5 text-slate-600">
            Build the task in the same order the work will happen: choose task class, pick the concrete type, connect data, choose AI-assisted or human-first execution, write shared rules, then set launch options.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 px-4 md:px-5">
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {steps.map((label, index) => {
                const complete = index < step
                const active = index === step

                return (
                  <div key={label} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setStep(index)}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
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
            <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 px-3.5 py-3 text-sm text-slate-700 dark:border-white/10 dark:text-slate-300">
              {`Step ${step + 1} of ${steps.length}: ${steps[step]}`}
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">Project</label>
            <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 px-3 py-2.5 text-sm text-slate-900 dark:border-white/10 dark:text-slate-200">
              {project.name}
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">Task title</label>
            <Input
              defaultValue={
                taskClass === "judgement"
                  ? "Reasoning Answer Evaluation"
                  : "Reasoning Conflict Resolution"
              }
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">Task objective</label>
            <Textarea
              defaultValue={
                taskClass === "judgement"
                  ? "Judge whether the answer is correct, well-supported, and safe enough for canonical publication."
                  : "Detect the correct label structure and preserve ambiguity before anything enters governed review."
              }
              className="min-h-32"
            />
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
                    className={`rounded-xl border p-4 text-left transition-colors ${
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
              <label className="text-sm font-medium text-slate-700">Task type</label>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {taskTypeOptions.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTaskType(id)}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      taskType === id
                        ? "border-slate-950 bg-slate-950 text-stone-100"
                        : "hej-surface-soft border-slate-900/10 bg-stone-50/88 text-slate-900 hover:bg-stone-100 dark:border-white/10 dark:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-lg p-2 ${
                          taskType === id ? "bg-white/12" : "bg-slate-900 text-stone-100"
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

          {step === 2 ? (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">
                  Data source and storage
                </label>
                <div className="flex flex-wrap gap-2">
                  {storageOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setStorageProvider(option)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                        storageProvider === option
                          ? "border-slate-950 bg-slate-950 text-stone-100"
                          : "hej-surface-soft border-slate-900/10 bg-white text-slate-700 hover:bg-stone-100 dark:border-white/10 dark:text-slate-300"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">
                  Storage path or URI
                </label>
                <Input
                  value={storagePath}
                  onChange={(event) => setStoragePath(event.target.value)}
                  aria-label="Storage path"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">Upload notes</label>
                <Textarea
                  defaultValue="Mock upload is acceptable in MVP. Later this can connect directly to Google Cloud, AWS, or Azure readers."
                  className="min-h-24"
                />
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid gap-4">
              <div className="grid gap-3">
                <label className="text-sm font-medium text-slate-700">Execution mode</label>
                <div className="grid gap-3 md:grid-cols-2">
                  {modeOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setExecutionMode(option.id)}
                      className={`rounded-xl border p-4 text-left transition-colors ${
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
                  defaultValue={
                    executionMode === "ai_assisted"
                      ? taskClass === "judgement"
                        ? "OpenAI adapter enabled, answer import active, candidate verdict threshold 0.72, fallback to human-first if generation fails."
                        : "OpenAI adapter enabled, batch candidate generation, confidence threshold 0.72, fallback to human-first if import fails."
                      : taskClass === "judgement"
                        ? "Open task items directly from the items desk, require verdict + rationale before submit, and route low-agreement items to expert review."
                        : "Open task items directly from the items desk, require rationale before submit, and send low-agreement items to expert review."
                  }
                  className="min-h-32"
                />
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">{rulesLabel}</label>
                <Textarea defaultValue={rulesDescription} className="min-h-40" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">{schemaLabel}</label>
                <Textarea defaultValue={schemaDescription} className="min-h-28" />
              </div>
            </div>
          ) : null}

          {step === 5 ? (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">
                  Advanced configuration
                </label>
                <Textarea
                  defaultValue={
                    taskClass === "judgement"
                      ? "Optional: batch size, answer source mapping, score calibration, review threshold, export bundle options, provenance requirements, and integration notes."
                      : "Optional: batching strategy, assignment defaults, review threshold, export bundle options, integration notes, and provenance requirements."
                  }
                  className="min-h-28"
                />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  { label: "Task class", value: taskClass },
                  { label: "Task type", value: formatTypeLabel(taskType) },
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
                onClick={() => setStep(step + 1)}
              >
                Next step
                <ChevronRight />
              </Button>
            ) : (
              <Button className="bg-slate-900 text-stone-100">
                <FolderPlus />
                Create task draft
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href={`/projects/${project.id}/tasks`}>
                <ArrowLeft />
                Back to project tasks
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <Card className="hej-surface-dark rounded-[1.3rem] border-slate-900/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(245,235,214,0.92))] shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-white/10">
          <CardHeader className="px-4 md:px-5">
            <CardTitle className="text-xl font-semibold tracking-tight text-slate-950">
              Task creation path
            </CardTitle>
            <CardDescription className="mt-1 text-[13px] leading-5 text-slate-600">
              The task should be created in the same order operators think about the work.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-4 md:px-5">
            {[
              {
                icon: taskClass === "judgement" ? Scale : Tags,
                title: "1. Choose task class",
                text:
                  taskClass === "judgement"
                    ? "This task will produce structured verdicts and rationales."
                    : "This task will produce labels, spans, or multimodal annotations.",
              },
              {
                icon:
                  taskClass === "judgement"
                    ? judgementTypeOptions.find((option) => option.id === taskType)?.icon ?? Scale
                    : annotationTypeOptions.find((option) => option.id === taskType)?.icon ?? Type,
                title: "2. Choose task type",
                text: `Current selection: ${formatTypeLabel(taskType)}.`,
              },
              {
                icon: DatabaseZap,
                title: "3. Connect data source",
                text: `Current selection: ${storageProvider}. This can later come from AWS, Google Cloud, Azure, or mock storage.`,
              },
              {
                icon: executionMode === "ai_assisted" ? Bot : UserRoundPen,
                title: "4. Pick execution mode",
                text:
                  executionMode === "ai_assisted"
                    ? taskClass === "judgement"
                      ? "AI can draft answer evaluations first, then humans govern the outputs."
                      : "AI annotates first in the background, then humans review."
                    : taskClass === "judgement"
                      ? "Humans make the first judgement directly from task items."
                      : "Humans annotate directly, then downstream review begins.",
              },
              {
                icon: Sparkles,
                title: "5. Write shared rules",
                text:
                  taskClass === "judgement"
                    ? "One judgement rubric should guide both human decisions and future AI parsing."
                    : "One instruction set should guide both human annotation and future AI parsing.",
              },
              {
                icon: Settings2,
                title: "6. Set launch options",
                text: "Keep advanced controls available without blocking the primary creation path.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="hej-surface-soft rounded-xl border border-slate-900/10 bg-white/88 p-3.5 dark:border-white/10"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-slate-900 p-2 text-stone-100">
                    <Icon className="size-3.5" />
                  </div>
                  <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                </div>
                <p className="mt-2 text-[13px] leading-5 text-slate-600">{text}</p>
              </div>
            ))}

            <div className="rounded-xl border border-slate-900/10 bg-slate-950 p-4 text-stone-100">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-stone-300">
                    Current draft
                  </p>
                  <p className="mt-1 text-base font-semibold capitalize">{taskClass}</p>
                  <p className="mt-1 text-sm text-stone-300">{formatTypeLabel(taskType)}</p>
                  <p className="mt-1 text-sm text-stone-300">{storagePath}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className="bg-amber-300 text-slate-950">
                    {executionMode === "ai_assisted" ? "AI-assisted" : "Human-first"}
                  </Badge>
                  <Badge variant="outline" className="border-white/20 text-stone-100">
                    {project.name}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
