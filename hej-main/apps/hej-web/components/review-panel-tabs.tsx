"use client"

import { Bot, FileText, History } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import type { ActivityEvent, MockTaskItem } from "@/lib/mock-data"

type ReviewPanelTabsProps = {
  item: MockTaskItem
  activity: ActivityEvent[]
}

const tabs = [
  { key: "candidate", label: "Candidate", icon: Bot },
  { key: "payload", label: "Payload", icon: FileText },
  { key: "history", label: "History", icon: History },
] as const

export function ReviewPanelTabs({ item, activity }: ReviewPanelTabsProps) {
  return (
    <div className="mt-4">
      <Tabs defaultValue="candidate">
        <TabsList>
          {tabs.map(({ key, label, icon: Icon }) => (
            <TabsTrigger key={key} value={key}>
              <Icon className="size-3.5" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="candidate">
          <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-700 dark:text-slate-300">
              <Bot className="size-3.5" />
              AI candidate
            </div>
            <p className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">
              {item.aiLabel}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Confidence {item.confidence}
            </p>
          </div>
        </TabsContent>

        <TabsContent value="payload">
          <div className="hej-surface-soft rounded-xl border border-dashed border-slate-900/12 bg-white/80 p-3.5 dark:border-white/10">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              External payload preview
            </p>
            <p className="mt-2 text-[13px] leading-5 text-slate-700 dark:text-slate-300">
              {item.preview}
            </p>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="space-y-2">
            {activity.slice(0, 3).map((event) => (
              <div
                key={`${event.time}-${event.action}`}
                className="hej-surface-soft flex items-start justify-between gap-3 rounded-xl border border-slate-900/10 bg-stone-50/88 p-3 dark:border-white/10"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {event.action}
                  </p>
                  <p className="mt-1 text-[13px] leading-5 text-slate-600 dark:text-slate-300">
                    {event.detail}
                  </p>
                </div>
                <Badge variant="outline">{event.time}</Badge>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
