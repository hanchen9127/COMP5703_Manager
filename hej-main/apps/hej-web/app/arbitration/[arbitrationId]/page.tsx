import { notFound } from "next/navigation"
import { Gavel, Scale, ShieldQuestion } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { ArbitrationDecisionPanel } from "@/components/arbitration-decision-panel"
import { PageHeader } from "@/components/page-header"
import { getArbitrationView } from "@/lib/mock-data"

type PageProps = {
  params: Promise<{
    arbitrationId: string
  }>
}

export default async function ArbitrationPage({ params }: PageProps) {
  const { arbitrationId } = await params
  const view = getArbitrationView(arbitrationId)

  if (!view) {
    notFound()
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Expert arbitration"
        title={view.arbitrationCase.id}
        description="Arbitration converts unresolved dispute context into an authoritative outcome while preserving all earlier disagreement evidence."
        badges={[
          { label: view.arbitrationCase.status, tone: "outline" },
          { label: view.arbitrationCase.arbitrator, tone: "accent" },
          { label: view.project.name, tone: "dark" },
        ]}
      />

      <section className="grid gap-3 md:grid-cols-3">
        {[
          {
            label: "Dispute source",
            value: view.dispute.id,
            icon: ShieldQuestion,
          },
          {
            label: "Arbitrator",
            value: view.arbitrationCase.arbitrator,
            icon: Gavel,
          },
          {
            label: "Canonical target",
            value: view.arbitrationCase.canonicalOutcome,
            icon: Scale,
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

      <ArbitrationDecisionPanel
        arbitrationCase={view.arbitrationCase}
        dispute={view.dispute}
        taskItem={view.taskItem}
        activity={view.activity}
      />
    </div>
  )
}
