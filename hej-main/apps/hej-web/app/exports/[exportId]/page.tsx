import { notFound } from "next/navigation"
import { Boxes, FileOutput, ShieldCheck } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { ExportPackagePanel } from "@/components/export-package-panel"
import { PageHeader } from "@/components/page-header"
import { getExportView } from "@/lib/mock-data"

type PageProps = {
  params: Promise<{
    exportId: string
  }>
}

export default async function ExportPage({ params }: PageProps) {
  const { exportId } = await params
  const view = getExportView(exportId)

  if (!view) {
    notFound()
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Export and delivery"
        title={view.exportPackage.id}
        description="Exports close the loop: canonical judgments and provenance leave the platform in an organization-owned package."
        badges={[
          { label: view.exportPackage.status, tone: "outline" },
          { label: view.exportPackage.format, tone: "accent" },
          { label: view.organization.displayName, tone: "dark" },
        ]}
      />

      <section className="grid gap-3 md:grid-cols-3">
        {[
          {
            label: "Task scope",
            value: view.task.title,
            icon: Boxes,
          },
          {
            label: "Package status",
            value: view.exportPackage.status,
            icon: FileOutput,
          },
          {
            label: "Lineage",
            value: view.exportPackage.includesProvenance ? "included" : "omitted",
            icon: ShieldCheck,
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

      <ExportPackagePanel
        exportPackage={view.exportPackage}
        task={view.task}
        activity={view.activity}
      />
    </div>
  )
}
