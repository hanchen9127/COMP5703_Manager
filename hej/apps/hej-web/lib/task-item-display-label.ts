/**
 * Human-readable labels for task items in operational desks (dispute, finalized, history).
 * Prefer dataset filename / external ref; fall back to platform task_item id.
 */
export function formatTaskItemDisplayLabel(input: {
  taskItemId: string
  externalItemRef?: string | null
}): string {
  const ref = input.externalItemRef?.trim()
  if (ref) {
    return ref
  }
  return input.taskItemId
}

/** Secondary monospace id when the primary label is a filename/external ref. */
export function taskItemIdSecondaryLabel(input: {
  taskItemId: string
  externalItemRef?: string | null
}): string | null {
  const ref = input.externalItemRef?.trim()
  if (ref && ref !== input.taskItemId) {
    return input.taskItemId
  }
  return null
}
