import { notFound } from "next/navigation"
import { CircleGauge, ShieldAlert, Users } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { DisputeCaseBoard } from "@/components/dispute-case-board"
import { PageHeader } from "@/components/page-header"
import { getDisputeView } from "@/lib/mock-data"

type PageProps = {
  params: Promise<{
    disputeId: string
  }>
}

export default async function DisputePage({ params }: PageProps) {
  const { disputeId } = await params
  const view = getDisputeView(disputeId)

  if (!view) {
    notFound()
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Dispute handling"
        title={view.dispute.id}
        description="Disagreement is first-class. This page scaffolds the case review, participant assignment, and escalation path into arbitration."
        badges={[
          { label: view.dispute.status, tone: "outline" },
          { label: view.dispute.severity, tone: "accent" },
          { label: view.project.name, tone: "dark" },
        ]}
      />

      <section className="grid gap-3 md:grid-cols-3">
        {[
          {
            label: "Task item",
            value: view.taskItem.id,
            icon: CircleGauge,
          },
          {
            label: "Opened by",
            value: view.dispute.openedBy,
            icon: Users,
          },
          {
            label: "Escalation",
            value: view.arbitrationCase ? "arbitration linked" : "case review",
            icon: ShieldAlert,
          },
        ].map(({ label, value, icon: Icon }) => (
          <Card
            key={label}
            className="hej-surface-dark gap-3 rounded-[1.1rem] border-slate-900/10 bg-white/80 shadow-[0_10px_24px_rgba(15,23,42,0.04)] dark:border-white/10"
          >
            <CardHeader className="px-4 md:px-5">
              <CardTitle className="text-lg font-semibold tracking-tight text-slate-900">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between px-4 md:px-5">
              <p className="text-sm font-semibold text-slate-950">{value}</p>
              <div className="rounded-lg bg-slate-900 p-2 text-stone-100">
                <Icon className="size-3.5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <DisputeCaseBoard
        dispute={view.dispute}
        task={view.task}
        taskItem={view.taskItem}
        activity={view.activity}
        arbitrationCase={view.arbitrationCase}
      />
    </div>
  )
}
