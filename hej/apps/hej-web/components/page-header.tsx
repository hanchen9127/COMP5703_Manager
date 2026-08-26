import { Badge } from "@workspace/ui/components/badge"

type PageHeaderProps = {
  eyebrow: string
  title: string
  description: string
  actions?: React.ReactNode
  badges?: Array<{
    label: string
    tone?: "outline" | "accent" | "dark"
  }>
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  badges = [],
}: PageHeaderProps) {
  return (
    <section className="hej-surface-dark rounded-[1.3rem] border border-slate-900/10 bg-white/84 p-6 shadow-[0_12px_32px_rgba(15,23,42,0.05)] dark:border-white/10 dark:shadow-[0_16px_40px_rgba(2,6,23,0.28)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.26em] text-slate-500 dark:text-slate-400">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
            {title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            {description}
          </p>
        </div>
        {actions || badges.length > 0 ? (
          <div className="flex flex-col items-start gap-3 lg:items-end">
            {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
            {badges.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2.5 lg:justify-end">
                {badges.map((badge, index) => (
                  <Badge
                    key={`${badge.label}-${badge.tone ?? "default"}-${index}`}
                    variant={badge.tone === "outline" ? "outline" : "default"}
                    className={
                      badge.tone === "accent"
                        ? "bg-amber-300 text-slate-950"
                        : badge.tone === "dark"
                          ? "bg-slate-950 text-stone-100 dark:bg-white dark:text-slate-950"
                          : ""
                    }
                  >
                    {badge.label}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  )
}
