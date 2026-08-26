import type { DatasetItemPayload } from "@/lib/api/tasks"

function splitCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ""
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '"') {
      const next = line[index + 1]
      if (inQuotes && next === '"') {
        current += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (char === "," && !inQuotes) {
      cells.push(current.trim())
      current = ""
      continue
    }
    current += char
  }

  cells.push(current.trim())
  return cells
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replaceAll(/\s+/g, "_")
}

export function parseCsvDatasetRows(csvText: string): { items: DatasetItemPayload[]; error?: string } {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))

  if (lines.length === 0) {
    return { items: [], error: "Paste at least one CSV row." }
  }

  const firstLine = lines[0]
  if (firstLine === undefined) {
    return { items: [], error: "Paste at least one CSV row." }
  }

  const firstCells = splitCsvLine(firstLine)
  const headerLike =
    firstCells.length >= 2 &&
    (firstCells.some((cell) => normalizeHeader(cell).includes("external")) ||
      firstCells.some((cell) => normalizeHeader(cell).includes("location")))

  let startIndex = 0
  let externalIndex = 0
  let locationIndex = 1

  if (headerLike) {
    const headers = firstCells.map(normalizeHeader)
    const extIdx = headers.findIndex((h) => h.includes("external"))
    const locIdx = headers.findIndex((h) => h.includes("location"))
    if (extIdx < 0 || locIdx < 0) {
      return {
        items: [],
        error: "CSV header must include external_item_ref and location_ref columns.",
      }
    }
    externalIndex = extIdx
    locationIndex = locIdx
    startIndex = 1
  }

  const items: DatasetItemPayload[] = []
  for (let rowIndex = startIndex; rowIndex < lines.length; rowIndex += 1) {
    const line = lines[rowIndex]
    if (line === undefined) {
      continue
    }
    const cells = splitCsvLine(line)
    const externalRef = cells[externalIndex]?.trim() ?? ""
    const locationRef = cells[locationIndex]?.trim() ?? ""
    if (!externalRef || !locationRef) {
      return {
        items: [],
        error: `Row ${rowIndex + 1} is missing external ref or location ref.`,
      }
    }
    items.push({
      external_item_ref: externalRef,
      location_ref: locationRef,
      payload_preview: { preview: externalRef, source: "csv_batch" },
    })
  }

  return { items }
}

export function buildS3PrefixDatasetItems(
  prefix: string,
  keysText: string,
): { items: DatasetItemPayload[]; error?: string } {
  const trimmedPrefix = prefix.trim()
  if (!trimmedPrefix) {
    return { items: [], error: "S3 prefix is required." }
  }
  if (!/^s3:\/\//i.test(trimmedPrefix)) {
    return { items: [], error: "S3 prefix must start with s3://." }
  }

  const normalizedPrefix = trimmedPrefix.endsWith("/") ? trimmedPrefix : `${trimmedPrefix}/`
  const keys = keysText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))

  if (keys.length === 0) {
    return { items: [], error: "Add at least one object key (one per line)." }
  }

  const items: DatasetItemPayload[] = []
  for (const key of keys) {
    const objectKey = key.replace(/^\/+/, "")
    const externalRef = objectKey.split("/").pop() || objectKey
    items.push({
      external_item_ref: externalRef,
      location_ref: `${normalizedPrefix}${objectKey}`,
      payload_preview: { preview: externalRef, source: "s3_batch", prefix: normalizedPrefix },
    })
  }

  return { items }
}
