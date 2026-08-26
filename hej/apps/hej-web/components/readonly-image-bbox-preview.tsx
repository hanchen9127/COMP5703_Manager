"use client"

import type { ImageBBox } from "@/components/image-bbox-annotator"

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

function normalizeBox(box: ImageBBox) {
  const x = clamp01(box.x)
  const y = clamp01(box.y)
  const width = clamp01(box.width)
  const height = clamp01(box.height)
  return {
    ...box,
    x,
    y,
    width: Math.min(width, 1 - x),
    height: Math.min(height, 1 - y),
  }
}

export type ReadonlyImageBBoxPreviewProps = {
  mediaUrl: string
  alt?: string
  boxes: ImageBBox[]
  notes?: string
}

export function ReadonlyImageBBoxPreview({ mediaUrl, alt = "image annotation", boxes, notes }: ReadonlyImageBBoxPreviewProps) {
  const normalizedBoxes = boxes.map(normalizeBox)

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl border border-slate-900/10 bg-black/5">
        <img src={mediaUrl} alt={alt} className="block w-full select-none" draggable={false} />
        {normalizedBoxes.map((box) => (
          <div
            key={box.id ?? `${box.label}-${box.x}-${box.y}`}
            className="absolute border-2 border-sky-500 bg-sky-500/10"
            style={{
              left: `${box.x * 100}%`,
              top: `${box.y * 100}%`,
              width: `${box.width * 100}%`,
              height: `${box.height * 100}%`,
            }}
          >
            <div className="absolute -top-2 left-0 rounded-full bg-sky-600 px-2 py-0.5 text-[11px] font-medium text-white shadow-sm">
              {box.label || "object"}
            </div>
          </div>
        ))}
      </div>
      {notes?.trim() ? (
        <div className="rounded-lg border border-slate-900/10 bg-stone-50/80 px-3 py-2 text-sm text-slate-700">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Notes</p>
          <p className="mt-1 whitespace-pre-wrap leading-6">{notes}</p>
        </div>
      ) : null}
    </div>
  )
}
