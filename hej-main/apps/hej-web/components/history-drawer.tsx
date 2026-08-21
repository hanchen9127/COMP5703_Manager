"use client"

import { useState } from "react"
import { ChevronRight, History } from "lucide-react"

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
import type { ActivityEvent } from "@/lib/mock-data"

type HistoryDrawerProps = {
  events: ActivityEvent[]
}

export function HistoryDrawer({ events }: HistoryDrawerProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="pointer-events-none fixed top-24 right-2 z-30 hidden h-[calc(100vh-7rem)] 2xl:block">
        <div
          className={cn(
            "pointer-events-auto relative h-full w-[300px] max-w-[calc(100vw-1rem)] transition-transform",
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
                <History className="size-4" />
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">History</p>
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Persistent activity panel for provenance and audit traces.
              </p>
            </div>

            <div className="flex min-h-0 flex-1 flex-col p-4">
              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                <div className="space-y-3">
                  {events.map((event) => (
                    <div
                      key={`${event.time}-${event.action}-${event.actor}`}
                      className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 p-3 dark:border-white/10"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{event.action}</p>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{event.time}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{event.actor}</p>
                      <p className="mt-2 text-[13px] leading-5 text-slate-600 dark:text-slate-300">
                        {event.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <Button
                variant="outline"
                className="mt-4 w-full shrink-0"
                onClick={() => setOpen(false)}
              >
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
              <History className="size-4" />
              History
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
                  <History className="size-4 text-slate-700 dark:text-slate-300" />
                  <SheetTitle>History</SheetTitle>
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
              <SheetDescription>
                Persistent activity panel for provenance and audit traces.
              </SheetDescription>
            </SheetHeader>
            <SheetBody className="max-h-[calc(100%-4.5rem)]">
              <div className="space-y-3">
                {events.map((event) => (
                  <div
                    key={`${event.time}-${event.action}-${event.actor}-mobile`}
                    className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 p-3 dark:border-white/10"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{event.action}</p>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{event.time}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{event.actor}</p>
                    <p className="mt-2 text-[13px] leading-5 text-slate-600 dark:text-slate-300">
                      {event.detail}
                    </p>
                  </div>
                ))}
              </div>
            </SheetBody>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
