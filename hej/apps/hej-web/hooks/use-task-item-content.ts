"use client"

import { useEffect, useState } from "react"

import {
  getTaskItemContent,
  type ApiTaskItemContent,
} from "@/lib/api/task-item-content"

export function useTaskItemContent(input: {
  taskId: string
  taskItemId: string | null
  locationRef?: string | null
  enabled: boolean
}) {
  const { taskId, taskItemId, locationRef, enabled } = input
  const [content, setContent] = useState<ApiTaskItemContent | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !taskItemId || !locationRef) {
      setContent(null)
      setError(null)
      setLoading(false)
      return
    }

    let cancelled = false
    const requestKey = `${taskId}:${taskItemId}:${locationRef}`
    setLoading(true)
    setError(null)

    void getTaskItemContent(taskId, taskItemId).then((result) => {
      if (cancelled) return
      setLoading(false)
      if (!result.ok) {
        setContent(null)
        setError(result.error.message)
        return
      }
      if (requestKey !== `${taskId}:${taskItemId}:${locationRef}`) return
      setContent(result.data)
    })

    return () => {
      cancelled = true
    }
  }, [taskId, taskItemId, locationRef, enabled])

  return { content, loading, error }
}
