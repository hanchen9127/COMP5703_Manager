"use client"

import {
  Bot,
  CheckCircle2,
  CircleHelp,
  Clapperboard,
  FileSearch,
  FileText,
  Image as ImageIcon,
  ListTodo,
  MessageSquareQuote,
  Mic,
  PencilLine,
  Scale,
  ShieldCheck,
  Sparkles,
  Tags,
  XCircle,
} from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { Textarea } from "@workspace/ui/components/textarea"
import type {
  ActivityEvent,
  MockTask,
  MockTaskItem,
} from "@/lib/mock-data"
import {
  formatTaskClassLabel,
  formatTaskLabel,
  getJudgementDisplayValue,
  getJudgementRationale,
  getJudgementSignalValue,
} from "@/lib/task-format"

type WorkspaceTab = "details" | "annotate" | "review"

type TaskItemWorkspaceSheetProps = {
  task: MockTask
  item: MockTaskItem | null
  activity: ActivityEvent[]
  open: boolean
  initialTab: WorkspaceTab
  onOpenChange: (open: boolean) => void
}

export function TaskItemWorkspaceSheet({
  task,
  item,
  activity,
  open,
  initialTab,
  onOpenChange,
}: TaskItemWorkspaceSheetProps) {
  const isJudgement = task.taskClass === "judgement"
  const isAiAssisted = task.executionMode === "ai_assisted"
  const humanLabelOptions = isJudgement
    ? ["approve", "revise", "unsupported", "ambiguous"]
    : ["supports", "contradicts", "insufficient_evidence", "ambiguous"]

  if (!item) {
    return null
  }

  const mediaWorkspaceLabel = getMediaWorkspaceLabel(task.taskType)
  const judgementValue = getJudgementDisplayValue(item)
  const judgementSignal = getJudgementSignalValue(item)
  const judgementRationale = getJudgementRationale(item)
  const workLabel = isJudgement ? "Judge" : "Annotate"
  const isPreferenceJudgement = task.taskType === "preference_judgement"
  const judgementStages = [
    {
      label: "Candidate output",
      value: item.candidateOutput,
      note: item.candidateConfidence ? `Confidence ${item.candidateConfidence}` : undefined,
    },
    {
      label: "Draft verdict",
      value: item.draftVerdict,
      note: item.draftRationale,
    },
    {
      label: "Review decision",
      value: item.reviewDecision,
      note: item.reviewNote,
    },
    {
      label: "Canonical verdict",
      value: item.canonicalVerdict,
      note: item.canonicalRationale,
    },
  ].filter((stage) => stage.value || stage.note)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[calc(100vw-2rem)] max-w-none">
        <SheetHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle>Work panel</SheetTitle>
              <SheetDescription>
                Open the selected item, complete first-pass work, and move it into review from one place.
              </SheetDescription>
            </div>
            <SheetClose asChild>
              <button
                type="button"
                className="rounded-md border border-slate-900/10 px-2 py-1 text-xs text-slate-600 dark:border-white/10 dark:text-slate-300"
              >
                Close
              </button>
            </SheetClose>
          </div>
        </SheetHeader>

        <SheetBody className="space-y-4">
          <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 p-4 dark:border-white/10">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{item.externalRef}</Badge>
              <Badge variant="outline">{formatTaskClassLabel(task.taskClass)}</Badge>
              <Badge variant="outline">{formatTaskLabel(task.taskType)}</Badge>
              <Badge className="bg-slate-950 text-stone-100">
                {isAiAssisted ? "AI-assisted" : "Human-first"}
              </Badge>
              <Badge variant="outline">{item.status}</Badge>
            </div>
            <p className="mt-3 text-[13px] leading-6 text-slate-700">{item.preview}</p>
          </div>

          <Tabs key={`${item.id}-${initialTab}-${open ? "open" : "closed"}`} defaultValue={initialTab}>
            <TabsList>
              <TabsTrigger value="details">
                <ListTodo className="size-3.5" />
                Item details
              </TabsTrigger>
              <TabsTrigger value="annotate">
                <PencilLine className="size-3.5" />
                {workLabel}
              </TabsTrigger>
              <TabsTrigger value="review">
                <Scale className="size-3.5" />
                Review
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <div className="space-y-3">
                <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Item summary
                  </p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-slate-900/10 p-3.5">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        Current status
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{item.status}</p>
                    </div>
                    <div className="rounded-xl border border-slate-900/10 p-3.5">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        Latest output
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {isJudgement ? judgementValue : item.aiLabel}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {isJudgement ? judgementSignal : item.confidence}
                      </p>
                    </div>
                  </div>
                </div>
                {isJudgement ? (
                  <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <MessageSquareQuote className="size-4 text-slate-600" />
                      <p className="text-sm font-semibold text-slate-900">
                        Judgement lineage
                      </p>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {judgementStages.map((stage) => (
                        <div
                          key={stage.label}
                          className="rounded-xl border border-slate-900/10 p-3.5"
                        >
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                            {stage.label}
                          </p>
                          {stage.value ? (
                            <p className="mt-2 text-sm font-semibold text-slate-900">
                              {stage.value}
                            </p>
                          ) : null}
                          {stage.note ? (
                            <p className="mt-2 text-[13px] leading-5 text-slate-600">
                              {stage.note}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {isPreferenceJudgement && item.responseA && item.responseB ? (
                  <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <Scale className="size-4 text-slate-600" />
                      <p className="text-sm font-semibold text-slate-900">
                        Preference pair
                      </p>
                    </div>
                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      <div className="rounded-xl border border-slate-900/10 p-3.5">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          Response A
                        </p>
                        <p className="mt-2 text-[13px] leading-6 text-slate-700">
                          {item.responseA}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-900/10 p-3.5">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          Response B
                        </p>
                        <p className="mt-2 text-[13px] leading-6 text-slate-700">
                          {item.responseB}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-slate-900/10 p-3.5">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          Preferred option
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {item.preferredOption ? `Response ${item.preferredOption}` : "Not set"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-900/10 p-3.5">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          Preference rationale
                        </p>
                        <p className="mt-2 text-[13px] leading-5 text-slate-600">
                          {(item.preferenceRationale ?? judgementRationale) ||
                            "No rationale recorded yet."}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
                {isJudgement && item.flags?.length ? (
                  <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <Tags className="size-4 text-slate-600" />
                      <p className="text-sm font-semibold text-slate-900">Judgement flags</p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {item.flags.map((flag) => (
                        <Badge key={flag} variant="outline">
                          {flag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Execution posture
                  </p>
                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    {isAiAssisted
                      ? isJudgement
                        ? "AI candidate judgement generation is active."
                        : "AI candidate annotation generation is active."
                      : isJudgement
                        ? "Humans create first-pass judgements item by item."
                        : "Humans create first-pass annotations item by item."}
                  </p>
                  <p className="mt-3 text-[13px] leading-5 text-slate-600">
                    {task.annotationRules}
                  </p>
                </div>
                <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Recent execution events
                  </p>
                  <div className="mt-3 space-y-2">
                    {activity.slice(0, 3).map((event) => (
                      <div key={`${event.time}-${event.action}-sheet-details`} className="text-sm">
                        <p className="font-medium text-slate-900">{event.action}</p>
                        <p className="text-[13px] leading-5 text-slate-600">{event.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="annotate">
              {isJudgement ? (
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(280px,0.92fr)]">
                  <div className="space-y-4">
                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <FileText className="size-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-900">Source material</p>
                      </div>
                      <div className="hej-surface-soft mt-4 rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          External reference
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {item.externalRef}
                        </p>
                      </div>
                      <div className="mt-3 rounded-xl border border-slate-900/10 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          Primary evidence
                        </p>
                        <p className="mt-3 text-[13px] leading-6 text-slate-700">{item.preview}</p>
                      </div>
                    </div>

                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <CircleHelp className="size-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-900">Task question</p>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-700">
                        {task.judgmentQuestion}
                      </p>
                    </div>

                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="size-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-900">
                          Shared judgement instructions
                        </p>
                      </div>
                      <p className="mt-3 text-[13px] leading-6 text-slate-700">
                        {task.annotationRules}
                      </p>
                    </div>

                    {isAiAssisted ? (
                      <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                        <div className="flex items-center gap-2">
                          <Bot className="size-4 text-slate-600" />
                          <p className="text-sm font-semibold text-slate-900">
                            Candidate verdict
                          </p>
                        </div>
                        <div className="hej-surface-soft mt-4 rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10">
                          <p className="text-sm font-semibold text-slate-900">
                            {item.candidateOutput ?? item.aiLabel}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">{`Confidence ${judgementSignal}`}</p>
                          {item.candidateRationale ? (
                            <p className="mt-3 text-[13px] leading-5 text-slate-600">
                              {item.candidateRationale}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-4">
                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <MessageSquareQuote className="size-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-900">Response schema</p>
                      </div>
                      <p className="mt-2 text-[13px] leading-5 text-slate-600">
                        Produce the first-pass judgement that will move into governed review.
                      </p>

                      <div className="mt-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          Quick verdicts
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {humanLabelOptions.map((label) => (
                            <button
                              key={label}
                              type="button"
                              className="hej-surface-soft rounded-full border border-slate-900/10 bg-stone-50/88 px-3 py-1.5 text-sm text-slate-700 transition-colors hover:bg-stone-100 dark:border-white/10 dark:text-slate-200"
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3">
                        <div className="grid gap-2">
                          <label className="text-sm font-medium text-slate-700">Verdict</label>
                          <Input defaultValue={judgementValue} />
                        </div>
                        <div className="grid gap-2">
                          <label className="text-sm font-medium text-slate-700">Rationale</label>
                          <Textarea
                            defaultValue={
                              judgementRationale ||
                              "Write a short rationale explaining the verdict clearly enough for downstream review."
                            }
                            className="min-h-36"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <Tags className="size-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-900">Operator checks</p>
                      </div>
                      <div className="mt-4 space-y-3">
                        {[
                          "The decision is grounded in the visible evidence.",
                          "The rationale is short enough for review, but specific enough to audit.",
                          "Ambiguity is preserved instead of silently guessed away.",
                        ].map((line) => (
                          <div
                            key={line}
                            className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 px-3.5 py-3 text-sm text-slate-700 dark:border-white/10 dark:text-slate-200"
                          >
                            {line}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <Sparkles className="size-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-900">Actions</p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button className="bg-slate-900 text-stone-100">
                          <CheckCircle2 />
                          Save draft
                        </Button>
                        <Button variant="outline">Submit judgement</Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.18fr)_minmax(280px,0.82fr)]">
                  <div className="space-y-4">
                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          {renderMediaIcon(task.taskType)}
                          <p className="text-sm font-semibold text-slate-900">
                            {mediaWorkspaceLabel}
                          </p>
                        </div>
                        <Badge variant="outline">{item.externalRef}</Badge>
                      </div>
                      <p className="mt-2 text-[13px] leading-5 text-slate-600">
                        A media-first annotation surface would live here. For MVP this stays a structured mock, but this is the slot that could later host Label Studio or a task-specific renderer.
                      </p>

                      <div className="hej-surface-soft mt-4 rounded-[1rem] border border-dashed border-slate-900/15 bg-stone-50/88 p-4 dark:border-white/10">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                            Active viewport
                          </p>
                          <Badge variant="outline">{formatTaskLabel(task.taskType)}</Badge>
                        </div>
                        <div className="mt-4 flex min-h-72 items-center justify-center rounded-[0.95rem] border border-slate-900/10 bg-white text-center">
                          <div className="max-w-sm px-6 py-8">
                            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-900 text-stone-100">
                              {renderMediaIcon(task.taskType, "size-5")}
                            </div>
                            <p className="mt-4 text-sm font-semibold text-slate-900">
                              {mediaWorkspaceLabel}
                            </p>
                            <p className="mt-2 text-[13px] leading-6 text-slate-600">
                              {item.preview}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        {["Select", "Span/Box", "Adjust"].map((tool) => (
                          <div
                            key={tool}
                            className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 px-3.5 py-3 text-sm font-medium text-slate-700 dark:border-white/10 dark:text-slate-200"
                          >
                            {tool}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="size-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-900">
                          Shared annotation rules
                        </p>
                      </div>
                      <p className="mt-3 text-[13px] leading-6 text-slate-700">
                        {task.annotationRules}
                      </p>
                    </div>

                    {isAiAssisted ? (
                      <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                        <div className="flex items-center gap-2">
                          <Bot className="size-4 text-slate-600" />
                          <p className="text-sm font-semibold text-slate-900">
                            Candidate output
                          </p>
                        </div>
                        <div className="hej-surface-soft mt-4 rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10">
                          <p className="text-sm font-semibold text-slate-900">{item.aiLabel}</p>
                          <p className="mt-1 text-xs text-slate-500">{`Confidence ${item.confidence}`}</p>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-4">
                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <Tags className="size-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-900">Output schema</p>
                      </div>
                      <p className="mt-2 text-[13px] leading-5 text-slate-600">
                        Select the label set and produce the first-pass annotation payload.
                      </p>

                      <div className="mt-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          Quick labels
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {humanLabelOptions.map((label) => (
                            <button
                              key={label}
                              type="button"
                            className="hej-surface-soft rounded-full border border-slate-900/10 bg-stone-50/88 px-3 py-1.5 text-sm text-slate-700 transition-colors hover:bg-stone-100 dark:border-white/10 dark:text-slate-200"
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3">
                        <div className="grid gap-2">
                          <label className="text-sm font-medium text-slate-700">
                            Annotation output
                          </label>
                          <Textarea
                            defaultValue='{"label":"supports","span_start":18,"span_end":42}'
                            className="min-h-28 font-mono text-xs"
                          />
                        </div>
                        <div className="grid gap-2">
                          <label className="text-sm font-medium text-slate-700">Notes</label>
                          <Textarea
                            defaultValue="Capture a short note for review when the boundary, timestamp, or object extent remains uncertain."
                            className="min-h-32"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <MessageSquareQuote className="size-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-900">Workspace guidance</p>
                      </div>
                      <div className="mt-4 space-y-3">
                        {[
                          "Primary evidence should stay visible while labels are applied.",
                          "Annotation tools should change by media type, not by workflow stage.",
                          "Escalate ambiguity into notes instead of hiding it inside the output.",
                        ].map((line) => (
                          <div
                            key={line}
                            className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 px-3.5 py-3 text-sm text-slate-700 dark:border-white/10 dark:text-slate-200"
                          >
                            {line}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <Sparkles className="size-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-900">Actions</p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button className="bg-slate-900 text-stone-100">
                          <CheckCircle2 />
                          Save draft
                        </Button>
                        <Button variant="outline">Submit annotation</Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="review">
              {isJudgement ? (
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.04fr)_minmax(280px,0.96fr)]">
                  <div className="space-y-4">
                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <FileSearch className="size-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-900">Evidence under review</p>
                      </div>
                      <div className="hej-surface-soft mt-4 rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          External reference
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {item.externalRef}
                        </p>
                      </div>
                      <div className="mt-3 rounded-xl border border-slate-900/10 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          Source context
                        </p>
                        <p className="mt-3 text-[13px] leading-6 text-slate-700">{item.preview}</p>
                      </div>
                    </div>

                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <Bot className="size-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-900">Submitted judgement</p>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                            Proposed verdict
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">
                            {item.reviewDecision ?? judgementValue}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">{`Confidence ${judgementSignal}`}</p>
                          {judgementRationale ? (
                            <p className="mt-3 text-[13px] leading-5 text-slate-600">
                              {judgementRationale}
                            </p>
                          ) : null}
                        </div>
                        <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                            Reviewer focus
                          </p>
                          <p className="mt-2 text-sm text-slate-700">
                            Confirm whether the verdict is grounded in the visible evidence and whether the rationale can survive escalation.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="size-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-900">Review history</p>
                      </div>
                      <div className="mt-4 space-y-3">
                        {activity.slice(0, 3).map((event) => (
                          <div
                            key={`${event.time}-${event.action}-review-judgement`}
                            className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-slate-900">{event.action}</p>
                              <Badge variant="outline">{event.time}</Badge>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">{event.actor}</p>
                            <p className="mt-2 text-[13px] leading-5 text-slate-600">{event.detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <Scale className="size-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-900">Review decision</p>
                      </div>
                      <p className="mt-2 text-[13px] leading-5 text-slate-600">
                        Confirm, revise, or reject the submitted judgement. Escalate only when review cannot resolve the disagreement.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {["accept", "revise", "reject", "escalate"].map((action) => (
                          <button
                            key={action}
                            type="button"
                            className="hej-surface-soft rounded-full border border-slate-900/10 bg-stone-50/88 px-3 py-1.5 text-sm text-slate-700 transition-colors hover:bg-stone-100 dark:border-white/10 dark:text-slate-200"
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                      <div className="mt-4 grid gap-3">
                        <div className="grid gap-2">
                          <label className="text-sm font-medium text-slate-700">Final verdict</label>
                          <Input defaultValue={item.canonicalVerdict ?? item.reviewDecision ?? judgementValue} />
                        </div>
                        <div className="grid gap-2">
                          <label className="text-sm font-medium text-slate-700">Review note</label>
                          <Textarea
                            defaultValue={
                              item.reviewNote ??
                              "Document whether the submitted judgement is accepted, revised, or rejected, and explain why."
                            }
                            className="min-h-32"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <Tags className="size-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-900">Governance checks</p>
                      </div>
                      <div className="mt-4 space-y-3">
                        {[
                          "The final verdict reflects the visible evidence, not reviewer preference.",
                          "The review note is specific enough for a later dispute or audit.",
                          "Escalation is reserved for unresolved ambiguity, not routine corrections.",
                        ].map((line) => (
                          <div
                            key={line}
                            className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 px-3.5 py-3 text-sm text-slate-700 dark:border-white/10 dark:text-slate-200"
                          >
                            {line}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <Sparkles className="size-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-900">Actions</p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button className="bg-slate-900 text-stone-100">
                          <CheckCircle2 />
                          Accept
                        </Button>
                        <Button variant="outline">
                          <PencilLine />
                          Revise
                        </Button>
                        <Button variant="outline">
                          <XCircle />
                          Reject
                        </Button>
                        <Button variant="outline">Escalate</Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.12fr)_minmax(280px,0.88fr)]">
                  <div className="space-y-4">
                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          {renderMediaIcon(task.taskType)}
                          <p className="text-sm font-semibold text-slate-900">
                            {mediaWorkspaceLabel}
                          </p>
                        </div>
                        <Badge variant="outline">{item.externalRef}</Badge>
                      </div>
                      <p className="mt-2 text-[13px] leading-5 text-slate-600">
                        Review uses the same evidence pane as annotation, but the reviewer edits or confirms the submitted result instead of producing it from scratch.
                      </p>
                      <div className="hej-surface-soft mt-4 rounded-[1rem] border border-dashed border-slate-900/15 bg-stone-50/88 p-4 dark:border-white/10">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                            Active viewport
                          </p>
                          <Badge variant="outline">{formatTaskLabel(task.taskType)}</Badge>
                        </div>
                        <div className="mt-4 flex min-h-72 items-center justify-center rounded-[0.95rem] border border-slate-900/10 bg-white text-center">
                          <div className="max-w-sm px-6 py-8">
                            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-900 text-stone-100">
                              {renderMediaIcon(task.taskType, "size-5")}
                            </div>
                            <p className="mt-4 text-sm font-semibold text-slate-900">
                              {mediaWorkspaceLabel}
                            </p>
                            <p className="mt-2 text-[13px] leading-6 text-slate-600">
                              {item.preview}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <Bot className="size-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-900">
                          Submitted annotation
                        </p>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                            Proposed output
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">{item.aiLabel}</p>
                          <p className="mt-1 text-xs text-slate-500">{`Confidence ${item.confidence}`}</p>
                        </div>
                        <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                            Reviewer focus
                          </p>
                          <p className="mt-2 text-sm text-slate-700">
                            Confirm label boundaries, object extents, or media timestamps before accepting the submitted annotation.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="size-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-900">Review history</p>
                      </div>
                      <div className="mt-4 space-y-3">
                        {activity.slice(0, 3).map((event) => (
                          <div
                            key={`${event.time}-${event.action}-review-annotation`}
                            className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-slate-900">{event.action}</p>
                              <Badge variant="outline">{event.time}</Badge>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">{event.actor}</p>
                            <p className="mt-2 text-[13px] leading-5 text-slate-600">{event.detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <Scale className="size-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-900">Review decision</p>
                      </div>
                      <p className="mt-2 text-[13px] leading-5 text-slate-600">
                        Confirm, adjust, or reject the submitted annotation. Escalate only when disagreement cannot be resolved inside review.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {["accept", "adjust", "reject", "escalate"].map((action) => (
                          <button
                            key={action}
                            type="button"
                            className="hej-surface-soft rounded-full border border-slate-900/10 bg-stone-50/88 px-3 py-1.5 text-sm text-slate-700 transition-colors hover:bg-stone-100 dark:border-white/10 dark:text-slate-200"
                          >
                            {action}
                          </button>
                        ))}
                      </div>

                      <div className="mt-4 grid gap-3">
                        <div className="grid gap-2">
                          <label className="text-sm font-medium text-slate-700">
                            Final annotation payload
                          </label>
                          <Textarea
                            defaultValue='{"label":"supports","span_start":18,"span_end":42}'
                            className="min-h-28 font-mono text-xs"
                          />
                        </div>
                        <div className="grid gap-2">
                          <label className="text-sm font-medium text-slate-700">Review note</label>
                          <Textarea
                            defaultValue="Document whether the annotation is accepted, adjusted, or rejected, and explain any boundary or schema corrections."
                            className="min-h-32"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <Tags className="size-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-900">Governance checks</p>
                      </div>
                      <div className="mt-4 space-y-3">
                        {[
                          "The final payload follows the task schema, not reviewer shorthand.",
                          "Adjustments preserve uncertainty instead of forcing a clean answer.",
                          "Escalation is used only when reviewer correction is not enough.",
                        ].map((line) => (
                          <div
                            key={line}
                            className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 px-3.5 py-3 text-sm text-slate-700 dark:border-white/10 dark:text-slate-200"
                          >
                            {line}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="hej-surface-soft rounded-[1.1rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <Sparkles className="size-4 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-900">Actions</p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button className="bg-slate-900 text-stone-100">
                          <CheckCircle2 />
                          Accept
                        </Button>
                        <Button variant="outline">
                          <PencilLine />
                          Adjust
                        </Button>
                        <Button variant="outline">
                          <XCircle />
                          Reject
                        </Button>
                        <Button variant="outline">Escalate</Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}

function getMediaWorkspaceLabel(taskType: string) {
  if (taskType.includes("image")) return "Image annotation workspace"
  if (taskType.includes("audio")) return "Audio annotation workspace"
  if (taskType.includes("video")) return "Video annotation workspace"
  return "Text annotation workspace"
}

function renderMediaIcon(taskType: string, className = "size-4") {
  if (taskType.includes("image")) {
    return <ImageIcon className={className} />
  }
  if (taskType.includes("audio")) {
    return <Mic className={className} />
  }
  if (taskType.includes("video")) {
    return <Clapperboard className={className} />
  }
  return <FileText className={className} />
}
