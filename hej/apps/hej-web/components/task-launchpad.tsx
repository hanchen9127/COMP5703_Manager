"use client"

/**
 * Dashboard 首页 — Task launchpad
 *
 * This component intentionally does not read mock task data in production.
 * It keeps the workflow-mode controls visible while backend-backed launch data
 * is unavailable.
 */
import { useState } from "react"
import { Bot, Play, UserRoundPen } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

export function TaskLaunchpad() {
  const [mode, setMode] = useState<"ai_assisted" | "human_first">("ai_assisted")
  const modeLabel = mode === "ai_assisted" ? "AI-assisted" : "Human-first"

  return (
    <Card className="hej-surface-dark rounded-[1.25rem] border-slate-900/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(245,235,214,0.9))] shadow-[0_10px_26px_rgba(15,23,42,0.04)] dark:border-white/10">
      <CardHeader className="px-4 md:px-5">
        <CardTitle className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Task launchpad
        </CardTitle>
        <CardDescription className="mt-1 max-w-2xl text-[13px] leading-5 text-slate-600 dark:text-slate-300">
          Select a workflow mode. Backend-backed task previews will appear here when task data is available.
        </CardDescription>
        <CardAction>
          <Badge variant="outline">No task selected</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="px-4 md:px-5">
        <div className="flex flex-wrap gap-3">
          <Button
            variant={mode === "ai_assisted" ? "default" : "outline"}
            className={
              mode === "ai_assisted"
                ? "bg-slate-900 text-stone-100 dark:bg-white dark:text-slate-950"
                : ""
            }
            onClick={() => setMode("ai_assisted")}
          >
            <Bot />
            AI-assisted
          </Button>
          <Button
            variant={mode === "human_first" ? "default" : "outline"}
            className={
              mode === "human_first"
                ? "bg-slate-900 text-stone-100 dark:bg-white dark:text-slate-950"
                : ""
            }
            onClick={() => setMode("human_first")}
          >
            <UserRoundPen />
            Human-first
          </Button>
        </div>

        <div className="hej-surface-soft mt-4 rounded-xl border border-slate-900/10 bg-white/82 p-4 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-200 p-1.5 text-slate-900 dark:bg-amber-300">
              <Play className="size-3.5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                Selected workflow
              </p>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {modeLabel}
              </h3>
            </div>
          </div>
          <p className="mt-3 text-[13px] leading-5 text-slate-600 dark:text-slate-300">
            No backend task has been selected for this dashboard preview. Open a real project or task workspace to launch annotation work.
          </p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Output schema
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                Backend task required
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Review policy
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                Backend policy required
              </dd>
            </div>
          </dl>
        </div>
      </CardContent>
    </Card>
  )
}
