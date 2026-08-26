"use client"

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"

export type ImageBBox = {
  id: string
  label: string
  x: number
  y: number
  width: number
  height: number
}

export type ImageBBoxDraftState = {
  boxes: ImageBBox[]
  notes: string
  activeBoxId: string | null
}

export type ImageBBoxAnnotatorProps = {
  mediaUrl: string
  alt?: string
  initialBoxes?: ImageBBox[]
  initialNotes?: string
  initialLabel?: string
  disabled?: boolean
  resetKey?: string
  onChange?: (state: ImageBBoxDraftState) => void
  onSaveRequest?: () => void
  onSubmitRequest?: () => void
}

type DragState = {
  startX: number
  startY: number
  currentX: number
  currentY: number
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

function newBoxId() {
  return `box_${Math.random().toString(36).slice(2, 10)}`
}

function normalizeBox(box: ImageBBox): ImageBBox {
  return {
    ...box,
    x: clamp01(box.x),
    y: clamp01(box.y),
    width: clamp01(box.width),
    height: clamp01(box.height),
  }
}

function getInitialState(initialBoxes: ImageBBox[] | undefined, initialNotes: string | undefined) {
  const normalizedBoxes = (initialBoxes ?? []).map(normalizeBox)
  return {
    boxes: normalizedBoxes,
    notes: initialNotes ?? "",
    activeBoxId: normalizedBoxes[0]?.id ?? null,
  }
}

export function ImageBBoxAnnotator({
  mediaUrl,
  alt = "image annotation",
  initialBoxes,
  initialNotes,
  initialLabel = "object",
  disabled = false,
  resetKey,
  onChange,
  onSaveRequest,
  onSubmitRequest,
}: ImageBBoxAnnotatorProps) {
  const [imageError, setImageError] = useState(false)
  const [boxes, setBoxes] = useState<ImageBBox[]>(() => getInitialState(initialBoxes, initialNotes).boxes)
  const [notes, setNotes] = useState(() => getInitialState(initialBoxes, initialNotes).notes)
  const [activeBoxId, setActiveBoxId] = useState<string | null>(
    () => getInitialState(initialBoxes, initialNotes).activeBoxId,
  )
  const [labelDraft, setLabelDraft] = useState(initialLabel)
  const [drag, setDrag] = useState<DragState | null>(null)
  const lastResetRef = useRef<string | null>(null)
  const lastEmittedSignatureRef = useRef<string | null>(null)

  const selectedBox = useMemo(
    () => boxes.find((box) => box.id === activeBoxId) ?? null,
    [activeBoxId, boxes],
  )

  useEffect(() => {
    const resetSignal = resetKey ?? "__default__"
    if (lastResetRef.current === resetSignal) return
    lastResetRef.current = resetSignal
    const normalizedInitialBoxes = (initialBoxes ?? []).map(normalizeBox)
    setBoxes(normalizedInitialBoxes)
    setNotes(initialNotes ?? "")
    setActiveBoxId(normalizedInitialBoxes[0]?.id ?? null)
    setLabelDraft(initialLabel)
    setImageError(false)
    setDrag(null)
    lastEmittedSignatureRef.current = null
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resetKey is the explicit hydration boundary for annotator state.
  }, [resetKey])

  useEffect(() => {
    const signature = JSON.stringify({ boxes, notes, activeBoxId })
    if (lastEmittedSignatureRef.current === signature) return
    lastEmittedSignatureRef.current = signature
    onChange?.({ boxes, notes, activeBoxId })
  }, [activeBoxId, boxes, notes, onChange])

  function updateBoxes(nextBoxes: ImageBBox[], nextActiveBoxId: string | null) {
    setBoxes(nextBoxes)
    setActiveBoxId(nextActiveBoxId)
  }

  function handleMouseDown(event: MouseEvent<HTMLImageElement>) {
    if (disabled) return
    const rect = event.currentTarget.getBoundingClientRect()
    const startX = event.clientX - rect.left
    const startY = event.clientY - rect.top
    setDrag({ startX, startY, currentX: startX, currentY: startY })
  }

  function handleMouseMove(event: MouseEvent<HTMLImageElement>) {
    if (disabled || !drag) return
    const rect = event.currentTarget.getBoundingClientRect()
    const currentX = event.clientX - rect.left
    const currentY = event.clientY - rect.top
    setDrag((current) => (current ? { ...current, currentX, currentY } : current))
  }

  function handleMouseUp(event: MouseEvent<HTMLImageElement>) {
    if (disabled || !drag) return
    const rect = event.currentTarget.getBoundingClientRect()
    const widthPx = Math.max(rect.width, 1)
    const heightPx = Math.max(rect.height, 1)
    const endX = event.clientX - rect.left
    const endY = event.clientY - rect.top
    const minX = Math.min(drag.startX, endX)
    const minY = Math.min(drag.startY, endY)
    const width = Math.abs(endX - drag.startX) / widthPx
    const height = Math.abs(endY - drag.startY) / heightPx
    if (width > 0.01 && height > 0.01) {
      const box: ImageBBox = {
        id: newBoxId(),
        label: labelDraft.trim() || "object",
        x: clamp01(minX / widthPx),
        y: clamp01(minY / heightPx),
        width: clamp01(width),
        height: clamp01(height),
      }
      updateBoxes([...boxes, box], box.id)
      setLabelDraft(box.label)
    }
    setDrag(null)
  }

  function updateSelectedBox(updater: (box: ImageBBox) => ImageBBox) {
    if (!selectedBox) return
    const nextBoxes = boxes.map((box) => (box.id === selectedBox.id ? updater(box) : box))
    setBoxes(nextBoxes)
  }

  function handleDeleteSelected() {
    if (!selectedBox || disabled) return
    const nextBoxes = boxes.filter((box) => box.id !== selectedBox.id)
    const nextActiveBoxId = nextBoxes[0]?.id ?? null
    updateBoxes(nextBoxes, nextActiveBoxId)
  }

  const dragStyle = drag
    ? {
        left: `${Math.min(drag.startX, drag.currentX)}px`,
        top: `${Math.min(drag.startY, drag.currentY)}px`,
        width: `${Math.abs(drag.currentX - drag.startX)}px`,
        height: `${Math.abs(drag.currentY - drag.startY)}px`,
      }
    : null

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div>
        <div className="relative overflow-hidden rounded-xl border border-slate-900/10 bg-black/5">
          {imageError ? (
            <div className="p-6 text-sm text-slate-600">Failed to load image.</div>
          ) : (
            <img
              src={mediaUrl}
              alt={alt}
              className="block w-full select-none"
              onError={() => setImageError(true)}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => setDrag(null)}
              draggable={false}
            />
          )}
          {boxes.map((box) => (
            <button
              key={box.id}
              type="button"
              disabled={disabled}
              onClick={() => setActiveBoxId(box.id)}
              className={`absolute border-2 transition-colors ${
                activeBoxId === box.id ? "border-emerald-500 bg-emerald-500/10" : "border-amber-400 bg-amber-400/10"
              }`}
              style={{
                left: `${box.x * 100}%`,
                top: `${box.y * 100}%`,
                width: `${box.width * 100}%`,
                height: `${box.height * 100}%`,
              }}
              aria-label={`Select box ${box.label}`}
            />
          ))}
          {dragStyle ? (
            <div
              className="pointer-events-none absolute border border-sky-500 bg-sky-400/20"
              style={dragStyle}
            />
          ) : null}
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-slate-900/10 bg-white p-4">
        <div>
          <div className="text-sm font-medium text-slate-900">Selected box</div>
          {selectedBox ? (
            <div className="mt-3 grid gap-3">
              <Input
                value={selectedBox.label}
                disabled={disabled}
                onChange={(event) => {
                  const nextLabel = event.target.value
                  setLabelDraft(nextLabel)
                  updateSelectedBox((box) => ({ ...box, label: nextLabel }))
                }}
              />
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                <div className="rounded-lg border border-slate-900/10 bg-slate-50 px-3 py-2">
                  x: {selectedBox.x.toFixed(3)}
                </div>
                <div className="rounded-lg border border-slate-900/10 bg-slate-50 px-3 py-2">
                  y: {selectedBox.y.toFixed(3)}
                </div>
                <div className="rounded-lg border border-slate-900/10 bg-slate-50 px-3 py-2">
                  w: {selectedBox.width.toFixed(3)}
                </div>
                <div className="rounded-lg border border-slate-900/10 bg-slate-50 px-3 py-2">
                  h: {selectedBox.height.toFixed(3)}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-2 text-sm text-slate-500">No box selected.</div>
          )}
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-2">
            <label className="text-sm font-medium text-slate-700">New box label</label>
            <Button
              type="button"
              variant="outline"
              onClick={handleDeleteSelected}
              className="border-slate-300 text-slate-700 hover:bg-slate-100"
              disabled={disabled || !selectedBox}
            >
              Delete
            </Button>
          </div>
          <Input
            value={labelDraft}
            disabled={disabled}
            onChange={(event) => setLabelDraft(event.target.value)}
            placeholder="object"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700">Notes</label>
          <Textarea
            value={notes}
            disabled={disabled}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Capture context or uncertainty notes."
            className="min-h-32"
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {onSaveRequest ? (
            <Button type="button" onClick={onSaveRequest} disabled={disabled}>
              Save draft
            </Button>
          ) : null}
          {onSubmitRequest ? (
            <Button type="button" variant="outline" onClick={onSubmitRequest} disabled={disabled}>
              Submit
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
