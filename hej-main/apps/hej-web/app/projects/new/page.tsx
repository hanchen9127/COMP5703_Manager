import { FolderPlus, ShieldCheck } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { ProjectCreateForm } from "@/components/project-create-form"
import { getProjectsOverviewData } from "@/lib/project-data"

export default async function NewProjectPage() {
  const view = await getProjectsOverviewData()

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Projects"
        title="Create project"
        description="Create a new governed work program under an existing organization. In MVP this flow should stay lightweight, but it still needs to preserve organization ownership and governance intent."
        badges={[
          { label: "new project", tone: "outline" },
          { label: `${view.organizations.length} eligible organizations`, tone: "accent" },
          { label: "mvp setup path", tone: "dark" },
        ]}
      />

      <section className="grid gap-3 md:grid-cols-2">
        {[
          {
            label: "Accessible organizations",
            value: view.organizations.length.toString(),
          },
          {
            label: "Existing projects",
            value: view.projects.length.toString(),
          },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="hej-surface-dark flex items-center justify-between rounded-[1.1rem] border border-slate-900/10 bg-white/80 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)] dark:border-white/10"
          >
            <div>
              <p className="text-sm font-medium text-slate-600">{label}</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
            </div>
            <div className="rounded-lg bg-slate-900 p-2 text-stone-100">
              {label === "Accessible organizations" ? (
                <ShieldCheck className="size-3.5" />
              ) : (
                <FolderPlus className="size-3.5" />
              )}
            </div>
          </div>
        ))}
      </section>

      <ProjectCreateForm organizations={view.organizations} />
    </div>
  )
}
