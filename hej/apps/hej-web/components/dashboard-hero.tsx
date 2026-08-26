import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { TaskLaunchpad } from "@/components/task-launchpad"

type DashboardHeroProps = {
  projectId: string
}

export function DashboardHero({ projectId }: DashboardHeroProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
      <div className="overflow-hidden rounded-[1.6rem] border border-slate-900/10 bg-[linear-gradient(135deg,rgba(30,41,59,0.97),rgba(61,44,31,0.92))] p-6 text-stone-100 shadow-[0_22px_60px_rgba(15,23,42,0.14)]">
        <div className="flex flex-wrap items-center gap-3">
          <Badge className="bg-slate-950 text-stone-100">MVP scaffold</Badge>
          <Badge className="bg-amber-300 text-slate-950">Governance-first</Badge>
        </div>
        <div className="mt-5 max-w-2xl space-y-3">
          <p className="text-xs uppercase tracking-[0.26em] text-stone-300">
            Human Evaluation & Judgment Infrastructure
          </p>
          <h1 className="max-w-3xl text-3xl leading-tight font-semibold tracking-tight text-balance md:text-[2.65rem]">
            Orchestrate AI suggestion, human review, dispute, and canonical
            judgment in one control plane.
          </h1>
          <p className="max-w-xl text-sm leading-6 text-stone-300 md:text-base">
            This frontend mirrors the project canon: the platform governs
            workflow and provenance, while annotation remains only one stage
            of the process.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild className="bg-amber-300 text-slate-950 hover:bg-amber-200">
            <Link href={`/projects/${projectId}`}>
              Open project workspace
              <ArrowRight />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-stone-400/30 bg-white/5 text-stone-100 hover:bg-white/10"
          >
            <Link href="/admin">Inspect admin surface</Link>
          </Button>
        </div>
      </div>

      <TaskLaunchpad />
    </section>
  )
}
