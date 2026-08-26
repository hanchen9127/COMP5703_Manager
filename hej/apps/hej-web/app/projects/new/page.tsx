import { PageHeader } from "@/components/page-header"
import { ProjectCreateForm } from "@/components/project-create-form"

export default async function NewProjectPage() {
  return (
    <div className="space-y-3">
      <PageHeader
        eyebrow="Projects"
        title="Create project"
        description="Create a governed work program with clear ownership and light setup."
        badges={[{ label: "Eligible organizations · existing projects", tone: "accent" }]}
      />

      <ProjectCreateForm />
    </div>
  )
}
