/**
 * Parse API datetimes for display. Backend stores UTC; SQLite returns naive ISO
 * strings without a zone suffix — treat those as UTC before local formatting.
 */
export function parseApiUtcDatetime(iso: string): Date {
  const s = iso.trim()
  if (!s) {
    return new Date(NaN)
  }
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(s)) {
    return new Date(s)
  }
  const normalized = s.includes("T") ? s : `${s}T00:00:00`
  return new Date(`${normalized}Z`)
}

export function formatApiDatetimeLocal(
  iso: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = parseApiUtcDatetime(iso)
  if (Number.isNaN(date.getTime())) {
    return iso
  }
  return date.toLocaleString(
    undefined,
    options ?? { dateStyle: "medium", timeStyle: "medium" },
  )
}
