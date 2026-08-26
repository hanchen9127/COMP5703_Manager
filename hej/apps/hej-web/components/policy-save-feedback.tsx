export type PolicyFeedback = { kind: "error" | "success" | "info"; message: string }

type PolicySaveFeedbackProps = {
  feedback: PolicyFeedback | null
}

export function PolicySaveFeedback({ feedback }: PolicySaveFeedbackProps) {
  if (!feedback) {
    return null
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={
        feedback.kind === "error"
          ? "rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900"
          : feedback.kind === "info"
            ? "rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            : "rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
      }
    >
      {feedback.message}
    </div>
  )
}
