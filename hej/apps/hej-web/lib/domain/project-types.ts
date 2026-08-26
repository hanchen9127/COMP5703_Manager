import type { GovernanceModel } from "@/lib/governance-model"

export type MockOrganization = {
  id: string
  displayName: string
  status: string
}

export type MockProject = {
  id: string
  organizationId: string
  name: string
  description: string
  status: string
  governanceModel: GovernanceModel
}
