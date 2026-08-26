"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
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
import { listOrganizations, type ApiOrganization } from "@/lib/api/organizations"
import { createProject } from "@/lib/api/projects"
import {
  getGovernanceModelMeta,
  governanceModelOptions,
  type GovernanceModel,
} from "@/lib/governance-model"

export function ProjectCreateForm() {
  const router = useRouter()
  const [organizations, setOrganizations] = useState<ApiOrganization[]>([])
  const [isLoadingOrganizations, setIsLoadingOrganizations] = useState(true)
  const primaryOrganization = organizations[0] ?? null
  const [projectName, setProjectName] = useState("")
  const [projectDescription, setProjectDescription] = useState(
    "A governed work program for policy, reasoning, and escalation-sensitive judgment tasks."
  )
  const [governanceModel, setGovernanceModel] = useState<GovernanceModel>("dual_signoff")
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "error">("idle")
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [projectNameError, setProjectNameError] = useState<string | null>(null)
  const governanceModelMeta = getGovernanceModelMeta(governanceModel)

  useEffect(() => {
    let isMounted = true

    async function loadOrganizations() {
      setIsLoadingOrganizations(true)
      const result = await listOrganizations()

      if (!isMounted) {
        return
      }

      if (result.ok) {
        setOrganizations(result.data)
      } else {
        setOrganizations([])
      }
      setIsLoadingOrganizations(false)
    }

    void loadOrganizations()

    return () => {
      isMounted = false
    }
  }, [])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedName = projectName.trim()

    if (!trimmedName) {
      setProjectNameError("Project name is required.")
      return
    }

    if (!primaryOrganization) {
      setSubmitState("error")
      setSubmitError("Live organization is required before creating a project.")
      return
    }

    if (isLoadingOrganizations) {
      setSubmitState("error")
      setSubmitError("Live organization is required before creating a project.")
      return
    }

    setSubmitState("submitting")
    setSubmitError(null)
    setProjectNameError(null)

    try {
      const result = await createProject(String(primaryOrganization.id), {
        name: trimmedName,
        description: projectDescription.trim(),
        governance_model: governanceModel,
      })

      if (!result.ok) {
        throw new Error(result.error.message || "Project creation failed.")
      }

      router.push(`/projects/${result.data.id}`)
      router.refresh()
    } catch (error) {
      setSubmitState("error")
      setSubmitError(error instanceof Error ? error.message : "Project creation failed.")
    }
  }

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.38fr)_minmax(260px,0.62fr)]">
      <Card className="hej-surface-dark rounded-[1.3rem] border-slate-900/10 bg-white/84 shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-white/10">
        <CardHeader className="px-4 py-4 md:px-5 md:py-4">
          <CardTitle className="text-xl font-semibold tracking-tight text-slate-950">
            Project details
          </CardTitle>
          <CardDescription className="mt-1 max-w-2xl text-[13px] leading-5 text-slate-600">
            Keep the setup lightweight while making ownership and governance intent easy to read.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 px-4 pb-4 md:px-5 md:pb-5">
          <form className="space-y-3" onSubmit={handleSubmit}>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-slate-700">Owning organization</label>
              <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <Building2 className="size-3.5 shrink-0 text-slate-500" />
                  <span className="truncate font-medium">
                    {primaryOrganization ? String(primaryOrganization.name) : "No live organization available"}
                  </span>
                </div>
              </div>
              <p className="text-[12px] leading-5 text-slate-500">
                {isLoadingOrganizations
                  ? "Loading live organizations..."
                  : primaryOrganization
                    ? "Only one eligible organization is available."
                    : "Live organization is required before creating a project."}
              </p>
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-slate-700">Project name</label>
              <Input
                placeholder="Human Judgment Program"
                value={projectName}
                onChange={(event) => {
                  setProjectName(event.target.value)
                  if (projectNameError) {
                    setProjectNameError(null)
                  }
                }}
                required
              />
              {projectNameError ? (
                <p className="text-[12px] leading-5 text-rose-700">{projectNameError}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">Project description</label>
              <Textarea
                value={projectDescription}
                onChange={(event) => setProjectDescription(event.target.value)}
                className="min-h-24"
              />
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-slate-700">Governance model</label>
              <Select
                value={governanceModel}
                onValueChange={(value) => setGovernanceModel(value as GovernanceModel)}
              >
                <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-slate-50 text-sm text-slate-700 shadow-sm focus-visible:border-slate-900/25 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200">
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
              <p className="text-[12px] leading-5 text-slate-500">
                Records the governance intent for this project. You can expand the policy structure later without changing the project entry point.
              </p>
            </div>
            <p className="text-[12px] leading-5 text-slate-500">
              Initial status: <span className="font-medium text-slate-700 dark:text-slate-200">Draft</span> · Set automatically after project creation.
            </p>

            <div className="flex flex-wrap gap-3 pt-1">
              <Button
                type="submit"
                className="bg-slate-900 text-stone-100"
                disabled={!primaryOrganization || isLoadingOrganizations || submitState === "submitting"}
              >
                <FolderPlus />
                {isLoadingOrganizations || submitState === "submitting" ? "Creating..." : "Create project"}
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
        <Card className="hej-surface-dark rounded-[1.3rem] border-slate-900/10 bg-white/84 shadow-[0_12px_30px_rgba(15,23,42,0.05)] dark:border-white/10">
          <CardHeader className="px-4 py-4 md:px-5 md:py-4">
            <CardTitle className="text-lg font-semibold tracking-tight text-slate-950">
              Guidance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-4 pb-4 pt-0 md:px-5 md:pb-5">
            <ul className="space-y-2 text-[13px] leading-5 text-slate-600">
              <li className="flex items-start gap-2.5">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" />
                <span>Keep ownership explicit</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" />
                <span>Set governance tone early</span>
              </li>
            </ul>

            <div className="rounded-xl border border-slate-900/8 bg-slate-50/70 p-3.5 text-[13px] leading-5 text-slate-600 shadow-none dark:border-white/8 dark:bg-white/[0.03]">
              <div className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                Next step
              </div>
              <div className="mt-2 space-y-1">
                <div>Create project</div>
                <div>→ Project overview</div>
                <div>→ Create task</div>
                <div>→ Configure setup/items/review</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
