export type MockTenantPolicy = {
  organizationId: string
  isolationMode: string
  membershipApproval: string
  reviewControl: string
  exportControl: string
  disputeRouting: string
  provenanceRetention: string
}

export type MockTaskPolicy = {
  taskId: string
  executionMode: "ai_assisted" | "human_first"
  outputSchemaRef: string
  reviewPolicyRef: string
  disputePolicyRef: string
  exportPolicyRef: string
  pointerStatus: string
  storageProvider: string
  advancedConfig: string
  taskStatus: string
}
