import type { MockTask, MockTaskItem } from "@/lib/mock-data"

export function formatTaskLabel(value: string) {
  return value.replaceAll("_", " ")
}

export function formatTaskClassLabel(value: "annotation" | "judgement") {
  return value === "judgement" ? "Judgement" : "Annotation"
}

export function getJudgementDisplayValue(item: MockTaskItem) {
  return (
    item.canonicalVerdict ??
    item.reviewDecision ??
    item.draftVerdict ??
    item.candidateOutput ??
    item.aiLabel
  )
}

export function getJudgementSignalValue(item: MockTaskItem) {
  return item.candidateConfidence ?? item.confidence
}

export function getJudgementRationale(item: MockTaskItem) {
  return (
    item.canonicalRationale ??
    item.reviewNote ??
    item.draftRationale ??
    item.candidateRationale ??
    ""
  )
}

export function getTaskItemValue(task: MockTask, item: MockTaskItem) {
  if (task.taskClass === "judgement") {
    return getJudgementDisplayValue(item)
  }

  return item.aiLabel
}

export function getTaskItemSignal(task: MockTask, item: MockTaskItem) {
  if (task.taskClass === "judgement") {
    return getJudgementSignalValue(item)
  }

  return item.confidence
}
