export type TaskClass = "annotation" | "judgement"

export type InitialTextSpanLabelOptions = Partial<Record<TaskClass, string[] | null | undefined>>

export function getDefaultTextSpanLabelOptions(taskClass: TaskClass) {
  return taskClass === "judgement"
    ? ["approve", "revise", "unsupported", "ambiguous"]
    : ["supports", "contradicts", "insufficient_evidence", "ambiguous"]
}

export function normalizeTextSpanLabelOptions(labels: string[]) {
  const seen = new Set<string>()
  const normalized: string[] = []

  for (const rawLabel of labels) {
    const label = rawLabel.trim()
    if (!label || label.length > 64) {
      throw new Error("Text span quick labels must be non-empty and 64 characters or fewer.")
    }

    const key = label.toLowerCase()
    if (seen.has(key)) {
      throw new Error("Text span quick labels cannot contain duplicates.")
    }

    seen.add(key)
    normalized.push(label)
  }

  if (normalized.length > 20) {
    throw new Error("Text span quick labels cannot contain more than 20 labels.")
  }

  return normalized
}

export function normalizeInitialTextSpanLabelOptions(
  labels: string[] | null | undefined,
): string[] | null {
  if (!labels || labels.length === 0) return null

  try {
    const normalized = normalizeTextSpanLabelOptions(labels)
    return normalized.length > 0 ? normalized : null
  } catch {
    return null
  }
}

export function getInitialTextSpanLabelOptions(
  taskClass: TaskClass,
  initialTextSpanLabelOptions?: InitialTextSpanLabelOptions,
): string[] {
  return (
    normalizeInitialTextSpanLabelOptions(initialTextSpanLabelOptions?.[taskClass]) ??
    getDefaultTextSpanLabelOptions(taskClass)
  )
}

export function textSpanLabelOptionsEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false
  return left.every((value, index) => value === right[index])
}
