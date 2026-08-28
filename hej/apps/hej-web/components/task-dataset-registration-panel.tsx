"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import {
  ArrowRight,
  DatabaseZap,
  FileUp,
  Layers,
  Link2,
  ListTodo,
  PlayCircle,
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { Textarea } from "@workspace/ui/components/textarea"
import { uploadTaskFiles } from "@/lib/api/task-uploads"
import type { ApiTaskType } from "@/lib/api/tasks"
import { registerTaskDataset } from "@/lib/api/tasks"
import {
  buildS3PrefixDatasetItems,
  parseCsvDatasetRows,
} from "@/lib/task-dataset-batch"
import {
  getFixturePointerExample,
  getIntakeFormDefaults,
  validatePointerLocationRef,
} from "@/lib/task-dataset-intake-defaults"
import { getAcceptedFileTypesForTask } from "@/lib/task-upload-accept"

export type DatasetRegistrationResult = {
  createdCount: number
}

type IntakeTab = "upload" | "pointers" | "batch"
type BatchMode = "csv" | "s3"

type TaskDatasetRegistrationPanelProps = {
  taskId: string
  taskType: ApiTaskType
  taskStatus: string
  itemsHref: string
  workHref: string
  workLabel?: string
  dataSourceSectionId?: string
  onRegistered?: (result: DatasetRegistrationResult) => void
}


function IntakeSuccessBlock({
  lastSuccess,
  itemsHref,
  workHref,
  workLabel,
  onViewPointers,
}: {
  lastSuccess: DatasetRegistrationResult
  itemsHref: string
  workHref: string
  workLabel: string
  onViewPointers: () => void
}) {
  return (
    <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-3 dark:border-emerald-800/40 dark:bg-emerald-950/25">
      <p className="text-sm font-medium text-emerald-950 dark:text-emerald-100">Next steps</p>
      <p className="mt-1 text-[13px] leading-5 text-emerald-900 dark:text-emerald-200">
        {lastSuccess.createdCount} item{lastSuccess.createdCount === 1 ? "" : "s"} are ready. Open
        Items to inspect rows, or start first-pass work when your queue is ready.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button asChild size="sm" className="bg-slate-900 text-stone-100">
          <Link href={itemsHref}>
            <ListTodo className="mr-1.5 size-3.5" />
            Open Items
            <ArrowRight className="ml-1.5 size-3.5" />
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href={workHref}>
            <PlayCircle className="mr-1.5 size-3.5" />
            {workLabel}
          </Link>
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onViewPointers}>
          View data pointers
        </Button>
      </div>
    </div>
  )
}

function IntakeFeedback({ feedback }: { feedback: { kind: "error" | "success"; message: string } }) {
  return (
    <p
      className={
        feedback.kind === "error" ? "text-sm text-red-700" : "text-sm text-emerald-800"
      }
    >
      {feedback.message}
    </p>
  )
}

export function TaskDatasetRegistrationPanel({
  taskId,
  taskType,
  taskStatus,
  itemsHref,
  workHref,
  workLabel = "Annotate",
  dataSourceSectionId = "task-setup-data-source",
  onRegistered,
}: TaskDatasetRegistrationPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [activeTab, setActiveTab] = useState<IntakeTab>("upload")
  const [batchMode, setBatchMode] = useState<BatchMode>("csv")

  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [externalRef, setExternalRef] = useState("")
  const [locationRef, setLocationRef] = useState("")
  const [previewText, setPreviewText] = useState("")
  const [locationRefError, setLocationRefError] = useState<string | null>(null)
  const intakeDefaults = getIntakeFormDefaults(taskType)
  const [csvText, setCsvText] = useState(() => getIntakeFormDefaults(taskType).csvText)
  const [s3Prefix, setS3Prefix] = useState("s3://bucket/dataset/v1/")
  const [s3KeysText, setS3KeysText] = useState(() => getIntakeFormDefaults(taskType).s3KeysText)

  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState<{ kind: "error" | "success"; message: string } | null>(
    null,
  )
  const [lastSuccess, setLastSuccess] = useState<DatasetRegistrationResult | null>(null)

  const uploadAccept = getAcceptedFileTypesForTask(taskType)
  const uploadEndpointLabel =
    taskType === "image" ? "POST /tasks/{id}/upload-images" : "POST /tasks/{id}/upload-texts"
  const mediaLabel = taskType === "image" ? "image" : "text"
  const DATASET_INTAKE_DISABLED_MESSAGE =
    "Dataset intake is only available while the task is in draft or ready status."
  const canIntakeDataset = taskStatus === "draft" || taskStatus === "ready"

  useEffect(() => {
    const defaults = getIntakeFormDefaults(taskType)
    setCsvText(defaults.csvText)
    setS3KeysText(defaults.s3KeysText)
    setLocationRefError(null)
  }, [taskType])

  function scrollToDataSource() {
    document
      .getElementById(dataSourceSectionId)
      ?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  function reportSuccess(createdCount: number, message: string) {
    const success: DatasetRegistrationResult = { createdCount }
    setLastSuccess(success)
    setFeedback({ kind: "success", message })
    onRegistered?.(success)
  }

  async function registerItems(
    items: Array<{
      external_item_ref: string
      location_ref: string
      payload_preview?: Record<string, unknown>
    }>,
    successMessage: (count: number) => string,
  ) {
    if (!canIntakeDataset) {
      setFeedback({
        kind: "error",
        message: DATASET_INTAKE_DISABLED_MESSAGE,
      })
      return
    }
    if (items.length === 0) {
      setFeedback({ kind: "error", message: "No items to register." })
      return
    }

    setPending(true)
    setFeedback(null)
    setLastSuccess(null)

    const result = await registerTaskDataset(taskId, items)
    setPending(false)

    if (!result.ok) {
      setFeedback({ kind: "error", message: result.error.message })
      return
    }

    const createdCount = result.data.created_task_items.length
    reportSuccess(createdCount, successMessage(createdCount))
  }

  function handleFileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    setSelectedFiles(files)
    if (files.length > 0 && feedback?.kind === "error") {
      setFeedback(null)
    }
  }

  async function handleUploadFiles() {
    if (!canIntakeDataset) {
      setFeedback({
        kind: "error",
        message: DATASET_INTAKE_DISABLED_MESSAGE,
      })
      return
    }
    if (selectedFiles.length === 0) {
      setFeedback({ kind: "error", message: "Select one or more files (one file = one item)." })
      return
    }

    setPending(true)
    setFeedback(null)
    setLastSuccess(null)

    const result = await uploadTaskFiles(taskId, taskType, selectedFiles)
    setPending(false)

    if (!result.ok) {
      setFeedback({ kind: "error", message: result.error.message })
      return
    }

    const createdCount = result.data.created_task_items
    reportSuccess(
      createdCount,
      `Uploaded ${selectedFiles.length} file${selectedFiles.length === 1 ? "" : "s"} and registered ${createdCount} item${createdCount === 1 ? "" : "s"}.`,
    )
    setSelectedFiles([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  function fillFixturePointerExample() {
    const example = getFixturePointerExample(taskType)
    setExternalRef(example.externalRef)
    setLocationRef(example.locationRef)
    setPreviewText(example.previewText)
    setLocationRefError(null)
  }

  function applyBatchTemplate() {
    const defaults = getIntakeFormDefaults(taskType)
    setCsvText(defaults.csvText)
    setS3KeysText(defaults.s3KeysText)
    setFeedback(null)
  }

  async function handleRegisterPointer() {
    if (!canIntakeDataset) {
      setFeedback({
        kind: "error",
        message: DATASET_INTAKE_DISABLED_MESSAGE,
      })
      return
    }
    const ref = externalRef.trim()
    const location = locationRef.trim()
    if (!ref || !location) {
      setFeedback({ kind: "error", message: "External ref and location ref are required." })
      return
    }

    const locationError = validatePointerLocationRef(location, taskType)
    if (locationError) {
      setLocationRefError(locationError)
      setFeedback({ kind: "error", message: locationError })
      return
    }
    setLocationRefError(null)

    let payloadPreview: Record<string, unknown> = { preview: previewText.trim() || ref }
    if (previewText.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(previewText) as Record<string, unknown>
        if (parsed && typeof parsed === "object") {
          payloadPreview = parsed
        }
      } catch {
        setFeedback({ kind: "error", message: "Preview JSON is invalid." })
        return
      }
    }

    await registerItems(
      [
        {
          external_item_ref: ref,
          location_ref: location,
          payload_preview: payloadPreview,
        },
      ],
      (count) =>
        `Registered ${count} task item${count === 1 ? "" : "s"}. Open the item in Annotate to load content from location ref.`,
    )
    setExternalRef("")
    setLocationRef("")
    setPreviewText("")
  }

  async function handleBatchImport() {
    if (!canIntakeDataset) {
      setFeedback({
        kind: "error",
        message: DATASET_INTAKE_DISABLED_MESSAGE,
      })
      return
    }
    if (batchMode === "csv") {
      const parsed = parseCsvDatasetRows(csvText)
      if (parsed.error) {
        setFeedback({ kind: "error", message: parsed.error })
        return
      }
      await registerItems(
        parsed.items,
        (count) =>
          `Imported ${count} item${count === 1 ? "" : "s"} from CSV via dataset-registration.`,
      )
      return
    }

    const built = buildS3PrefixDatasetItems(s3Prefix, s3KeysText)
    if (built.error) {
      setFeedback({ kind: "error", message: built.error })
      return
    }
    await registerItems(
      built.items,
      (count) =>
        `Registered ${count} item${count === 1 ? "" : "s"} under S3 prefix ${s3Prefix.trim()}.`,
    )
  }

  return (
    <Card className="hej-surface-dark rounded-[1.2rem] border-slate-900/10 bg-white/80 shadow-[0_10px_24px_rgba(15,23,42,0.04)] dark:border-white/10">
      <CardHeader className="px-4 md:px-5">
        <div className="flex items-center gap-2">
          <DatabaseZap className="size-4 text-slate-700" />
          <CardTitle className="text-lg font-semibold tracking-tight text-slate-900">
            Data intake
          </CardTitle>
        </div>
        <CardDescription className="mt-1 text-[13px] leading-5 text-slate-600">
          Add task items via file upload, manual pointers, or batch import. Each path writes dataset
          registration (and upload endpoints where applicable).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-4 md:px-5">
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value as IntakeTab)
            setFeedback(null)
          }}
        >
          <TabsList className="w-full flex-wrap">
            <TabsTrigger value="upload" className="gap-1.5">
              <FileUp className="size-3.5" />
              Upload files
            </TabsTrigger>
            <TabsTrigger value="pointers" className="gap-1.5">
              <Link2 className="size-3.5" />
              Register pointers
            </TabsTrigger>
            <TabsTrigger value="batch" className="gap-1.5">
              <Layers className="size-3.5" />
              Batch import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-3">
            <p className="text-[13px] leading-5 text-slate-600">
              Upload local files for this {taskType} task. One file registers as one task item via{" "}
              <span className="font-mono text-xs text-slate-800">{uploadEndpointLabel}</span>.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={uploadAccept}
              className="hidden"
              onChange={handleFileInputChange}
              disabled={!canIntakeDataset}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canIntakeDataset}
                onClick={() => fileInputRef.current?.click()}
              >
                Choose files
              </Button>
              {selectedFiles.length > 0 ? (
                <span className="text-[13px] text-slate-600">
                  {selectedFiles.length} file{selectedFiles.length === 1 ? "" : "s"} selected
                </span>
              ) : (
                <span className="text-[13px] text-slate-500">No files selected</span>
              )}
            </div>
            {selectedFiles.length > 0 ? (
              <ul className="max-h-28 list-inside list-disc overflow-y-auto text-[13px] text-slate-700">
                {selectedFiles.map((file) => (
                  <li key={`${file.name}-${file.size}`}>{file.name}</li>
                ))}
              </ul>
            ) : null}
            <Button
              type="button"
              className="bg-slate-900 text-stone-100"
              disabled={pending || !canIntakeDataset}
              onClick={() => void handleUploadFiles()}
            >
              {pending ? "Uploading…" : "Upload and register"}
            </Button>
          </TabsContent>

          <TabsContent value="pointers" className="space-y-3">
            <p className="text-[13px] leading-5 text-slate-600">
              Manually attach one external ref and location ref (no file upload). Annotate resolves{" "}
              <span className="font-mono text-xs">location_ref</span> via the content API; preview
              is only a fallback.
            </p>
            <div className="hej-surface-soft rounded-xl border border-slate-900/10 bg-stone-50/88 px-3.5 py-2.5 text-[12px] leading-5 text-slate-600 dark:border-white/10">
              <span className="font-medium text-slate-800">
                Supported schemes ({mediaLabel} task):
              </span>{" "}
              {intakeDefaults.schemeHint}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canIntakeDataset}
              onClick={fillFixturePointerExample}
            >
              {intakeDefaults.fixtureExampleLabel}
            </Button>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  External item ref
                </label>
                <Input
                  value={externalRef}
                  onChange={(event) => setExternalRef(event.target.value)}
                  placeholder={intakeDefaults.externalRefPlaceholder}
                  disabled={!canIntakeDataset}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Location ref
                </label>
                <Input
                  value={locationRef}
                  onChange={(event) => {
                    setLocationRef(event.target.value)
                    if (locationRefError) setLocationRefError(null)
                  }}
                  placeholder={intakeDefaults.locationPlaceholder}
                  disabled={!canIntakeDataset}
                />
                {locationRefError ? (
                  <p className="text-[13px] text-red-700">{locationRefError}</p>
                ) : null}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Preview text or JSON (optional fallback)
              </label>
              <Input
                value={previewText}
                onChange={(event) => setPreviewText(event.target.value)}
                placeholder={intakeDefaults.previewPlaceholder}
                disabled={!canIntakeDataset}
              />
            </div>
            <Button
              type="button"
              className="bg-slate-900 text-stone-100"
              disabled={pending || !canIntakeDataset}
              onClick={() => void handleRegisterPointer()}
            >
              {pending ? "Registering…" : "Register item"}
            </Button>
          </TabsContent>

          <TabsContent value="batch" className="space-y-3">
            <p className="text-[13px] leading-5 text-slate-600">
              Register many {mediaLabel} items at once via multi-line CSV or an S3 prefix plus
              object keys ({taskType} task).
            </p>
            <Button type="button" variant="outline" size="sm" onClick={applyBatchTemplate}>
              Reset {mediaLabel} batch template
            </Button>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: "csv" as const, label: "CSV" },
                  { id: "s3" as const, label: "S3 prefix" },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  disabled={!canIntakeDataset}
                  onClick={() => setBatchMode(mode.id)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-[color,background-color,border-color,transform] duration-150 ease-out active:scale-[0.97] disabled:active:scale-100 ${
                    batchMode === mode.id
                      ? "border-slate-950 bg-slate-950 text-stone-100"
                      : "hej-surface-soft border-slate-900/10 bg-white text-slate-700 hover:bg-stone-100 dark:border-white/10 dark:text-slate-300"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {batchMode === "csv" ? (
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  CSV rows
                </label>
                <Textarea
                  value={csvText}
                  onChange={(event) => setCsvText(event.target.value)}
                  className="min-h-32 font-mono text-xs"
                  placeholder="external_item_ref,location_ref"
                  disabled={!canIntakeDataset}
                />
                <p className="text-[12px] leading-5 text-slate-500">
                  {intakeDefaults.batchCsvHint}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    S3 prefix
                  </label>
                  <Input
                    value={s3Prefix}
                    onChange={(event) => setS3Prefix(event.target.value)}
                    placeholder="s3://bucket/dataset/v1/"
                    disabled={!canIntakeDataset}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Object keys (one per line)
                  </label>
                  <Textarea
                    value={s3KeysText}
                    onChange={(event) => setS3KeysText(event.target.value)}
                    className="min-h-28 font-mono text-xs"
                    placeholder={intakeDefaults.s3KeyPlaceholder}
                    disabled={!canIntakeDataset}
                  />
                  <p className="text-[12px] leading-5 text-slate-500">
                    S3 prefix mode registers pointers only; MVP cannot resolve s3:// in Annotate.
                    Prefer CSV with mock://fixtures/ or uploads/ paths for {mediaLabel} tasks.
                  </p>
                </div>
              </div>
            )}

            <Button
              type="button"
              className="bg-slate-900 text-stone-100"
              disabled={pending || !canIntakeDataset}
              onClick={() => void handleBatchImport()}
            >
              {pending ? "Importing…" : "Import batch"}
            </Button>
          </TabsContent>
        </Tabs>

        {!canIntakeDataset ? (
          <p className="text-sm text-amber-700">{DATASET_INTAKE_DISABLED_MESSAGE}</p>
        ) : null}

        {feedback ? <IntakeFeedback feedback={feedback} /> : null}

        {lastSuccess ? (
          <IntakeSuccessBlock
            lastSuccess={lastSuccess}
            itemsHref={itemsHref}
            workHref={workHref}
            workLabel={workLabel}
            onViewPointers={scrollToDataSource}
          />
        ) : null}
      </CardContent>
    </Card>
  )
}
