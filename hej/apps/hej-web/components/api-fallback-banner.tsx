import { AlertTriangle } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

type ApiFallbackBannerProps = {
  show: boolean
  onRetry?: () => void
  isRetrying?: boolean
  message?: string
  badgeLabel?: string
  state?: "unauthenticated" | "not-found" | "unreachable"
}

/**
 * Shows a live-data warning when hydration is degraded or partially failed.
 */
export function ApiFallbackBanner({
  show,
  onRetry,
  isRetrying = false,
  message = "Live data is partially unavailable.",
  badgeLabel = "Degraded",
  state,
}: ApiFallbackBannerProps) {
  if (!show) {
    return null
  }

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-300/80 bg-amber-50/90 px-4 py-2.5 text-sm text-amber-950 shadow-sm dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-100"
      data-state={state}
    >
      <AlertTriangle className="size-4 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden />
      <span className="font-medium">{message}</span>
      <Badge variant="outline" className="border-amber-700/40 bg-white/60 text-amber-900 dark:border-amber-500/40 dark:bg-black/20 dark:text-amber-100">
        {badgeLabel}
      </Badge>
      {onRetry ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="ml-auto border-amber-800/30 bg-white/70 text-amber-950 hover:bg-white dark:border-amber-500/40 dark:bg-black/20 dark:text-amber-100"
          onClick={onRetry}
          disabled={isRetrying}
        >
          {isRetrying ? "Retrying…" : "Retry"}
        </Button>
      ) : null}
    </div>
  )
}
