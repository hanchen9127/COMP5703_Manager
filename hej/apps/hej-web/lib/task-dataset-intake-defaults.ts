import type { ApiTaskType } from "@/lib/api/tasks"

export type IntakeFormDefaults = {
  csvText: string
  s3KeysText: string
  locationPlaceholder: string
  externalRefPlaceholder: string
  previewPlaceholder: string
  schemeHint: string
  fixtureExampleLabel: string
  batchCsvHint: string
  s3KeyPlaceholder: string
}

const TEXT_DEFAULTS: IntakeFormDefaults = {
  csvText: [
    "external_item_ref,location_ref",
    "feedback_row_001,mock://fixtures/text/item_001.json",
    "feedback_row_002,mock://fixtures/text/item_002.json",
  ].join("\n"),
  s3KeysText: "item_001.json\nitem_002.json",
  locationPlaceholder: "mock://fixtures/text/item_002.json",
  externalRefPlaceholder: "feedback_row_001",
  previewPlaceholder:
    '{"preview":"Short summary","text":"Optional fallback if content resolve fails"}',
  schemeHint:
    "uploads/texts/… (after Upload), mock://fixtures/text/…. s3:// registers only — content resolve not supported in MVP.",
  fixtureExampleLabel: "Fill text fixture example",
  batchCsvHint:
    "Use mock://fixtures/text/… or uploads/texts/… for Annotate content. Each row becomes one item.",
  s3KeyPlaceholder: "item_001.json",
}

const IMAGE_DEFAULTS: IntakeFormDefaults = {
  csvText: [
    "external_item_ref,location_ref",
    "image_demo_001,mock://fixtures/images/demo_item.png",
  ].join("\n"),
  s3KeysText: "demo_item.png\nphoto_002.jpg",
  locationPlaceholder: "mock://fixtures/images/demo_item.png",
  externalRefPlaceholder: "image_demo_001",
  previewPlaceholder: '{"preview":"Image pointer fallback label"}',
  schemeHint:
    "uploads/images/… (after Upload), mock://fixtures/images/…. s3:// registers only — content resolve not supported in MVP.",
  fixtureExampleLabel: "Fill image fixture example",
  batchCsvHint:
    "Use mock://fixtures/images/… or uploads/images/… so Annotate can load an image. Each row becomes one item.",
  s3KeyPlaceholder: "demo_item.png",
}

export function getIntakeFormDefaults(taskType: ApiTaskType): IntakeFormDefaults {
  return taskType === "image" ? IMAGE_DEFAULTS : TEXT_DEFAULTS
}

export function getFixturePointerExample(taskType: ApiTaskType): {
  externalRef: string
  locationRef: string
  previewText: string
} {
  if (taskType === "image") {
    return {
      externalRef: "image_pointer_demo",
      locationRef: "mock://fixtures/images/demo_item.png",
      previewText: '{"preview":"Image fixture pointer — Annotate loads via media_url."}',
    }
  }
  return {
    externalRef: "feedback_row_pointer_002",
    locationRef: "mock://fixtures/text/item_002.json",
    previewText:
      '{"preview":"Fixture item 002 for pointer registration.","text":"Fallback only — Annotate loads body from location ref."}',
  }
}

export function validatePointerLocationRef(
  value: string,
  taskType: ApiTaskType,
): string | null {
  const trimmed = value.trim()
  if (!trimmed) return "Location ref is required."

  const supported =
    trimmed.startsWith("uploads/") || trimmed.startsWith("mock://fixtures/")
  if (!supported) {
    return "Use uploads/... (after Upload) or mock://fixtures/... (repo fixtures). s3:// is not supported in MVP."
  }

  if (taskType === "image") {
    if (trimmed.startsWith("uploads/texts/") || trimmed.includes("fixtures/text/")) {
      return "Image tasks should use uploads/images/... or mock://fixtures/images/..."
    }
  } else {
    if (trimmed.startsWith("uploads/images/") || trimmed.includes("fixtures/images/")) {
      return "Text tasks should use uploads/texts/... or mock://fixtures/text/..."
    }
  }

  return null
}
