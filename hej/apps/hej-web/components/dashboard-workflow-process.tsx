import { Bot, ShieldCheck, Sparkles } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

const processSteps = [
  {
    title: "Identity and access",
    description:
      "Authenticate the user, resolve organization membership, and expose only role-permitted actions.",
    state: "Scaffolded",
  },
  {
    title: "Task definition",
    description:
      "Define judgment question, annotation mode, label schema, and review policy.",
    state: "Scaffolded",
  },
  {
    title: "Dataset registration",
    description:
      "Attach external data pointers, generate task items, keep raw data outside the platform.",
    state: "M1 live",
  },
  {
    title: "Annotation workspace",
    description:
      "Route work into Label Studio or a custom workspace without moving governance authority.",
    state: "Scaffolded",
  },
  {
    title: "Review and dispute",
    description:
      "Preserve disagreement, escalate ambiguities, and route unresolved cases to arbitration.",
    state: "Scaffolded",
  },
  {
    title: "Canonical export",
    description:
      "Assemble authoritative judgments plus provenance into an organization-owned delivery package.",
    state: "Scaffolded",
  },
]

export function DashboardWorkflowProcess() {
  return (
    <section className="grid gap-4 lg:grid-cols-[7fr_5fr]">
      <Card className="hej-surface-dark rounded-[1.25rem] border-slate-900/10 bg-white/76 shadow-[0_10px_26px_rgba(15,23,42,0.04)] dark:border-white/10">
        <CardHeader className="px-4 md:px-5">
          <CardTitle className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Workflow process
          </CardTitle>
          <CardDescription className="mt-1 max-w-2xl text-[13px] leading-5 text-slate-600 dark:text-slate-300">
            The UI is organized around the same stateful judgment pipeline described in the docs.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 md:px-5">
          <div className="space-y-3">
            {processSteps.map((step, index) => (
              <div
                key={step.title}
                className="hej-surface-soft flex gap-3 rounded-xl border border-slate-900/10 bg-stone-50/80 p-3.5 dark:border-white/10"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-stone-100 dark:bg-white dark:text-slate-950">
                  {index + 1}
                </div>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      {step.title}
                    </h3>
                    <Badge variant="outline" className="uppercase tracking-[0.18em]">
                      {step.state}
                    </Badge>
                  </div>
                  <p className="text-[13px] leading-5 text-slate-600 dark:text-slate-300">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="hej-surface-dark rounded-[1.25rem] border-slate-900/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(245,235,214,0.9))] shadow-[0_10px_26px_rgba(15,23,42,0.04)] dark:border-white/10">
        <CardHeader className="px-4 md:px-5">
          <CardTitle className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Document alignment
          </CardTitle>
          <CardDescription className="mt-1 max-w-2xl text-[13px] leading-5 text-slate-600 dark:text-slate-300">
            This screen was laid out against the project docs, not against a generic admin dashboard pattern.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 md:px-5">
          <div className="grid gap-3">
            {[
              {
                icon: ShieldCheck,
                title: "Canon",
                text: "Human judgment is treated as infrastructure, not as anonymous throughput.",
              },
              {
                icon: Bot,
                title: "Annotation strategy",
                text: "AI-assisted and human-first modes sit side by side without changing governance.",
              },
              {
                icon: Sparkles,
                title: "Demo scenarios",
                text: "Create organization, project, task, register data pointers, and display task items in-browser.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="hej-surface-soft rounded-xl border border-slate-900/10 bg-white/82 p-3.5 dark:border-white/10"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-amber-200 p-1.5 text-slate-900 dark:bg-amber-300">
                    <Icon className="size-3.5" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
                </div>
                <p className="mt-2 text-[13px] leading-5 text-slate-600 dark:text-slate-300">{text}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
