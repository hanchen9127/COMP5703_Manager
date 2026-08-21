"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Building2, FolderPlus, ShieldCheck } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Textarea } from "@workspace/ui/components/textarea"
import { hejApiBaseUrl } from "@/lib/api-config"
import {
  getGovernanceModelMeta,
  governanceModelOptions,
  type GovernanceModel,
} from "@/lib/governance-model"
import type { MockOrganization } from "@/lib/mock-data"

type ProjectCreateFormProps = {
  organizations: MockOrganization[]
}

export function ProjectCreateForm({ organizations }: ProjectCreateFormProps) {
  const router = useRouter()
  const primaryOrganization = organizations[0] ?? null
  const [projectName, setProjectName] = useState("Cross-domain Review Program")
  const [projectDescription, setProjectDescription] = useState(
    "A governed work program for policy, reasoning, and escalation-sensitive judgment tasks."
  )
  const [governanceModel, setGovernanceModel] = useState<GovernanceModel>("dual_signoff")
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "error">("idle")
  const [submitError, setSubmitError] = useState<string | null>(null)
  const governanceModelMeta = getGovernanceModelMeta(governanceModel)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!primaryOrganization) {
      setSubmitState("error")
      setSubmitError("No accessible organization is available for project creation.")
      return
    }

    setSubmitState("submitting")
    setSubmitError(null)

    try {
      const response = await fetch(
        `${hejApiBaseUrl}/organizations/${primaryOrganization.id}/projects`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: projectName.trim(),
            description: projectDescription.trim(),
            governance_model: governanceModel,
          }),
        }
      )

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as
          | { detail?: string }
          | null
        throw new Error(errorBody?.detail ?? "Project creation failed.")
      }

      const project = (await response.json()) as { id: string }
      router.push(`/projects/${project.id}`)
      router.refresh()
    } catch (error) {
      setSubmitState("error")
      setSubmitError(error instanceof Error ? error.message : "Project creation failed.")
    }
  }

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
      <Card className="hej-surface-dark rounded-[1.3rem] border-slate-900/10 bg-white/84 shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-white/10">
        <CardHeader className="px-4 md:px-5">
          <CardTitle className="text-xl font-semibold tracking-tight text-slate-950">
            Create project
          </CardTitle>
          <CardDescription className="mt-1 max-w-2xl text-[13px] leading-5 text-slate-600">
            Project creation should be lightweight in MVP, but organization ownership and governance posture still need to remain visible.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-4 md:px-5">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">Owning organization</label>
              <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 px-3 py-2.5 text-sm text-slate-900 dark:border-white/10 dark:text-slate-200">
                {primaryOrganization?.displayName ?? "No accessible organization"}
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">Project name</label>
              <Input
                placeholder="Human Judgment Program"
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">Project description</label>
              <Textarea
                value={projectDescription}
                onChange={(event) => setProjectDescription(event.target.value)}
                className="min-h-32"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">Governance model</label>
                <Select
                  value={governanceModel}
                  onValueChange={(value) => setGovernanceModel(value as GovernanceModel)}
                >
                  <SelectTrigger className="h-9 rounded-lg border-slate-900/12 bg-white/92 text-sm text-slate-900 shadow-xs focus-visible:border-slate-900/25 dark:border-white/10 dark:bg-slate-950/80 dark:text-slate-100">
                    <SelectValue placeholder="Select governance posture" />
                  </SelectTrigger>
                  <SelectContent>
                    {governanceModelOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">Initial status</label>
                <div className="hej-surface-soft flex h-9 items-center rounded-lg border border-slate-900/10 bg-stone-50/88 px-3 text-sm text-slate-900 dark:border-white/10 dark:text-slate-200">
                  Draft
                </div>
              </div>
            </div>
            <p className="text-[12px] leading-5 text-slate-500">
              {governanceModelMeta.description}
            </p>

            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                className="bg-slate-900 text-stone-100"
                disabled={!primaryOrganization || submitState === "submitting"}
              >
                <FolderPlus />
                {submitState === "submitting" ? "Creating..." : "Create project"}
              </Button>
              <Button asChild variant="outline">
                <Link href="/projects">
                  <ArrowLeft />
                  Back to projects
                </Link>
              </Button>
            </div>
            {submitError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {submitError}
              </div>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <Card className="hej-surface-dark rounded-[1.3rem] border-slate-900/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(245,235,214,0.92))] shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-white/10">
          <CardHeader className="px-4 md:px-5">
            <CardTitle className="text-xl font-semibold tracking-tight text-slate-950">
              Creation guidance
            </CardTitle>
            <CardDescription className="mt-1 text-[13px] leading-5 text-slate-600">
              Project creation is the program-level start point. It should not be hidden inside Admin because it leads directly into task execution.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-4 md:px-5">
            {[
              {
                icon: Building2,
                title: "Keep ownership explicit",
                text: "A project always belongs to an organization, even if the user starts from a global projects portfolio.",
              },
              {
                icon: ShieldCheck,
                title: "Set governance tone early",
                text: `${governanceModelMeta.label} is a project-level posture signal. It should guide how users read review and escalation expectations without becoming a hidden rules engine.`,
              },
            ].map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="hej-surface-soft rounded-xl border border-slate-900/10 bg-white/88 p-3.5 dark:border-white/10"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-slate-900 p-2 text-stone-100">
                    <Icon className="size-3.5" />
                  </div>
                  <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                </div>
                <p className="mt-2 text-[13px] leading-5 text-slate-600">{text}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="hej-surface-dark rounded-[1.3rem] border-slate-900/10 bg-white/84 shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-white/10">
          <CardHeader className="px-4 md:px-5">
            <CardTitle className="text-xl font-semibold tracking-tight text-slate-950">
              Next expected step
            </CardTitle>
            <CardDescription className="mt-1 text-[13px] leading-5 text-slate-600">
              After creation, the normal flow should move into project overview and then project tasks, not back into generic settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-4 md:px-5 text-[13px] leading-5 text-slate-700">
            <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 p-3.5 dark:border-white/10">
              Create project
              <br />
              Enter project overview
              <br />
              Create task
              <br />
              Configure setup, items, review, and history flow
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
