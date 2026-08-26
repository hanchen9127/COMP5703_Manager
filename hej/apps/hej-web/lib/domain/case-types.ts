export type MockDisputeCase = {
  id: string
  taskId: string
  taskItemId: string
  status: string
  severity: string
  openedBy: string
  assignedTo: string
  disagreementSummary: string
}

export type MockArbitrationCase = {
  id: string
  disputeCaseId: string
  taskId: string
  arbitrator: string
  status: string
  rulingSummary: string
  canonicalOutcome: string
}

export type MockExportPackage = {
  id: string
  organizationId: string
  projectId: string
  taskId: string
  status: string
  format: string
  itemCount: number
  completedItemCount: number
  includesProvenance: boolean
  destination: string
  exportScope: "current_finalized" | "full_project"
  isFullProjectReady: boolean
  finalizedItemCount: number
  totalItemCount: number
}
