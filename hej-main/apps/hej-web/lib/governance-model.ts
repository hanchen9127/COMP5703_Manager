export const governanceModelOptions = [
  {
    value: "standard",
    label: "Standard",
    description: "Balanced project posture for normal review and delivery workflows.",
  },
  {
    value: "dual_signoff",
    label: "Dual sign-off",
    description: "Higher review assurance with aligned approvals before outputs are treated as ready.",
  },
  {
    value: "expert_gate",
    label: "Expert gate",
    description: "Critical points expect expert review or approval before completion or delivery.",
  },
  {
    value: "arbitration_ready",
    label: "Arbitration-ready",
    description: "The project is expected to preserve unresolved disagreement for formal escalation.",
  },
] as const

export type GovernanceModel = (typeof governanceModelOptions)[number]["value"]

const governanceModelMap = new Map(
  governanceModelOptions.map((option) => [option.value, option])
)

export function getGovernanceModelMeta(model: GovernanceModel | null | undefined) {
  if (!model) {
    return governanceModelMap.get("standard")!
  }

  return governanceModelMap.get(model) ?? governanceModelMap.get("standard")!
}

export function formatGovernanceModelLabel(model: GovernanceModel | null | undefined) {
  return getGovernanceModelMeta(model).label
}
