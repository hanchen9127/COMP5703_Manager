"use client"

import { useState } from "react"
import {
  Activity,
  CheckCheck,
  ChevronRight,
  Cpu,
  DatabaseZap,
  LoaderCircle,
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet"
import { cn } from "@workspace/ui/lib/utils"

import { formatTaskLabel } from "@/lib/task-format"
import type { MockTask } from "@/lib/domain/task-types"
import type { ActivityEvent } from "@/lib/domain/admin-types"

type ModelRunDrawerProps = {
  taskType: MockTask["taskType"]
  isJudgement: boolean
  batchInFlightCount: number
  candidateCount: number
  readyForReviewCount: number
  batchTimeline: ActivityEvent[]
}

export function ModelRunDrawer({
  taskType,
  isJudgement,
  batchInFlightCount,
  candidateCount,
  readyForReviewCount,
  batchTimeline,
}: ModelRunDrawerProps) {
  const [open, setOpen] = useState(false)
  const summaryCards = [
    {
      icon: LoaderCircle,
      label: "Batches in flight",
      value: batchInFlightCount.toString(),
      text: isJudgement
        ? "Items still running through AI judgement."
        : "Items still running through AI annotation.",
    },
    {
      icon: CheckCheck,
      label: "Candidates ready",
      value: candidateCount.toString(),
      text: isJudgement
        ? "Items already carrying model answers or candidate verdicts."
        : "Items already carrying model output.",
    },
    {
      icon: Activity,
      label: "Ready for review",
      value: readyForReviewCount.toString(),
      text: "Items that can move into governed review now.",
    },
  ]

  const description = isJudgement
    ? "AI judgement runs as a background production step. Open any item into the work panel for batch detail and verdict handling."
    : "AI annotation runs as a background production step. Open any item into the work panel for batch detail and output handling."

  return (
    <>
      <div className="pointer-events-none fixed top-24 right-2 z-30 hidden h-[calc(100vh-7rem)] 2xl:block">
        <div
          className={cn(
            "pointer-events-auto relative h-full w-[360px] max-w-[calc(100vw-1rem)] transition-transform",
            open ? "translate-x-0" : "translate-x-[calc(100%-42px)]"
          )}
        >
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="absolute top-4 -left-10 flex h-10 w-10 items-center justify-center rounded-l-xl border border-r-0 border-slate-900/10 bg-white text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
          >
            <ChevronRight className={cn("size-4 transition-transform", open && "rotate-180")} />
          </button>

          <div className="hej-surface-dark flex h-full flex-col overflow-hidden rounded-[1.1rem] border border-slate-900/10 bg-white/94 shadow-[0_18px_50px_rgba(15,23,42,0.12)] dark:border-white/10 dark:shadow-[0_18px_50px_rgba(2,6,23,0.45)]">
            <div className="border-b border-slate-900/10 px-4 py-4 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Cpu className="size-4" />
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Model run</p>
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p>
            </div>

            <div className="flex min-h-0 flex-1 flex-col p-4">
              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                <div className="space-y-4">
                  <section className="grid gap-3">
                    {summaryCards.map(({ icon: Icon, label, value, text }) => (
                      <div
                        key={label}
                        className="hej-surface-soft rounded-xl border border-slate-900/10 bg-white/84 p-4 dark:border-white/10"
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-slate-900 p-2 text-stone-100 dark:bg-white dark:text-slate-950">
                            <Icon className="size-4" />
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                              {label}
                            </p>
                            <p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-slate-100">{value}</p>
                          </div>
                        </div>
                        <p className="mt-3 text-[13px] leading-5 text-slate-600 dark:text-slate-300">{text}</p>
                      </div>
                    ))}
                  </section>

                  <div className="hej-surface-soft rounded-[1.25rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Runtime posture</p>
                    <p className="mt-1 text-[13px] leading-5 text-slate-600 dark:text-slate-300">
                      Use this area to inspect batch status before handing selected items into review.
                    </p>
                    <div className="mt-4 grid gap-3">
                      <div className="rounded-xl border border-dashed border-slate-900/15 p-3.5 dark:border-white/10">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          Batch source
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                          External task items synced from storage-backed source
                        </p>
                      </div>
                      <div className="rounded-xl border border-dashed border-slate-900/15 p-3.5 dark:border-white/10">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          Candidate gate
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {isJudgement
                            ? "Send to review only when candidate verdicts are ready"
                            : "Send to review only when batch output is ready"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="hej-surface-soft rounded-[1.25rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <DatabaseZap className="size-4 text-slate-600 dark:text-slate-300" />
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Batch notes</p>
                    </div>
                    <div className="hej-surface-soft mt-4 rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        Runtime summary
                      </p>
                      <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                        <p>{`Task type: ${formatTaskLabel(taskType)}`}</p>
                        <p>{`Current items in flight: ${batchInFlightCount}`}</p>
                        <p>{`Candidate outputs ready: ${candidateCount}`}</p>
                        <p>{`Ready for review: ${readyForReviewCount}`}</p>
                      </div>
                    </div>
                  </div>

                  {batchTimeline.length > 0 ? (
                    <div className="hej-surface-soft rounded-[1.25rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <Activity className="size-4 text-slate-600 dark:text-slate-300" />
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Batch timeline</p>
                      </div>
                      <div className="mt-4 space-y-3">
                        {batchTimeline.map((event, index) => (
                          <div key={`${event.time}-${event.action}-drawer`} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className="flex size-7 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-stone-100 dark:bg-white dark:text-slate-950">
                                {index + 1}
                              </div>
                              {index < batchTimeline.length - 1 ? (
                                <div className="mt-2 h-full w-px bg-slate-200 dark:bg-slate-700" />
                              ) : null}
                            </div>
                            <div className="min-w-0 pb-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{event.action}</p>
                                <span className="rounded-full border border-slate-900/10 px-2 py-0.5 text-xs text-slate-600 dark:border-white/10 dark:text-slate-300">
                                  {event.time}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{event.actor}</p>
                              <p className="mt-2 text-[13px] leading-5 text-slate-600 dark:text-slate-300">
                                {event.detail}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
              <Button variant="outline" className="mt-4 w-full shrink-0" onClick={() => setOpen(false)}>
                Collapse drawer
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed right-4 bottom-4 z-30 2xl:hidden">
        <Sheet open={open} onOpenChange={setOpen} modal={false}>
          <SheetTrigger asChild>
            <Button className="bg-slate-950 text-stone-100 shadow-[0_12px_30px_rgba(15,23,42,0.16)] hover:bg-slate-900 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100">
              <Cpu className="size-4" />
              Model run
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="2xl:hidden"
            overlayClassName="bg-transparent backdrop-blur-0"
          >
            <SheetHeader>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Cpu className="size-4 text-slate-700 dark:text-slate-300" />
                  <SheetTitle>Model run</SheetTitle>
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
              <SheetDescription>{description}</SheetDescription>
            </SheetHeader>
            <SheetBody>
              <div className="space-y-4">
                {summaryCards.map(({ icon: Icon, label, value, text }) => (
                  <div
                    key={`${label}-mobile`}
                    className="hej-surface-soft rounded-xl border border-slate-900/10 bg-white/84 p-4 dark:border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-slate-900 p-2 text-stone-100 dark:bg-white dark:text-slate-950">
                        <Icon className="size-4" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          {label}
                        </p>
                        <p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-slate-100">{value}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-[13px] leading-5 text-slate-600 dark:text-slate-300">{text}</p>
                  </div>
                ))}

                <div className="hej-surface-soft rounded-[1.25rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Runtime posture</p>
                  <p className="mt-1 text-[13px] leading-5 text-slate-600 dark:text-slate-300">
                    Use this area to inspect batch status before handing selected items into review.
                  </p>
                  <div className="mt-4 grid gap-3">
                    <div className="rounded-xl border border-dashed border-slate-900/15 p-3.5 dark:border-white/10">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        Batch source
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                        External task items synced from storage-backed source
                      </p>
                    </div>
                    <div className="rounded-xl border border-dashed border-slate-900/15 p-3.5 dark:border-white/10">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        Candidate gate
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {isJudgement
                          ? "Send to review only when candidate verdicts are ready"
                          : "Send to review only when batch output is ready"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="hej-surface-soft rounded-[1.25rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <DatabaseZap className="size-4 text-slate-600 dark:text-slate-300" />
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Batch notes</p>
                  </div>
                  <div className="hej-surface-soft mt-4 rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Runtime summary
                    </p>
                    <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                      <p>{`Task type: ${formatTaskLabel(taskType)}`}</p>
                      <p>{`Current items in flight: ${batchInFlightCount}`}</p>
                      <p>{`Candidate outputs ready: ${candidateCount}`}</p>
                      <p>{`Ready for review: ${readyForReviewCount}`}</p>
                    </div>
                  </div>
                </div>

                {batchTimeline.length > 0 ? (
                  <div className="hej-surface-soft rounded-[1.25rem] border border-slate-900/10 bg-white/84 p-4 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <Activity className="size-4 text-slate-600 dark:text-slate-300" />
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Batch timeline</p>
                    </div>
                    <div className="mt-4 space-y-3">
                      {batchTimeline.map((event, index) => (
                        <div key={`${event.time}-${event.action}-drawer-mobile`} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="flex size-7 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-stone-100 dark:bg-white dark:text-slate-950">
                              {index + 1}
                            </div>
                            {index < batchTimeline.length - 1 ? (
                              <div className="mt-2 h-full w-px bg-slate-200 dark:bg-slate-700" />
                            ) : null}
                          </div>
                          <div className="min-w-0 pb-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{event.action}</p>
                              <span className="rounded-full border border-slate-900/10 px-2 py-0.5 text-xs text-slate-600 dark:border-white/10 dark:text-slate-300">
                                {event.time}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{event.actor}</p>
                            <p className="mt-2 text-[13px] leading-5 text-slate-600 dark:text-slate-300">
                              {event.detail}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </SheetBody>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
