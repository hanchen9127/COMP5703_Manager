import type { ApiTaskType } from "@/lib/api/tasks"

const TEXT_UPLOAD_ACCEPT = ".txt,.json,.jsonl,.csv,text/*,application/json,application/jsonl,text/csv"
const IMAGE_UPLOAD_ACCEPT = "image/*"
const AUDIO_UPLOAD_ACCEPT = "audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg,.webm"

export function getAcceptedFileTypesForTask(taskType: ApiTaskType): string {
  switch (taskType) {
    case "image":
      return IMAGE_UPLOAD_ACCEPT
    case "audio":
      return AUDIO_UPLOAD_ACCEPT
    case "text":
    default:
      return TEXT_UPLOAD_ACCEPT
  }
}
