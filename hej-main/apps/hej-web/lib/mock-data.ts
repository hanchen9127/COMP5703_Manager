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

export type MockTask = {
  id: string
  projectId: string
  title: string
  judgmentQuestion: string
  taskClass: "annotation" | "judgement"
  taskType: string
  executionMode: "ai_assisted" | "human_first"
  dataSourceLabel: string
  annotationRules: string
  outputSchemaRef: string
  reviewPolicyRef: string
  status: string
  backlogCount?: number
}

export type MockTaskItem = {
  id: string
  taskId: string
  externalRef: string
  preview: string
  aiLabel: string
  confidence: string
  status: string
  candidateOutput?: string
  candidateConfidence?: string
  candidateRationale?: string
  draftVerdict?: string
  draftRationale?: string
  reviewDecision?: string
  reviewNote?: string
  canonicalVerdict?: string
  canonicalRationale?: string
  flags?: string[]
  responseA?: string
  responseB?: string
  preferredOption?: "A" | "B" | "tie"
  preferenceRationale?: string
}

export type WorkflowStep = {
  title: string
  description: string
  state: string
  tone?: "default" | "accent" | "dark"
}

export type TaskAssignment = {
  reviewer: string
  role: string
  workstream: string
  sla: string
}

export type ActivityEvent = {
  time: string
  actor: string
  action: string
  detail: string
}

export type MockUserProfile = {
  id: string
  displayName: string
  email: string
  status: string
  twoFactorEnabled: boolean
  memberships: string[]
  roles: string[]
}

export type MockAdminMember = {
  id: string
  displayName: string
  email: string
  organizationId: string
  organizationName: string
  roles: string[]
  status: string
  twoFactorEnabled: boolean
  lastSeen: string
}

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
  includesProvenance: boolean
  destination: string
}

export const mockData = {
  user: {
    id: "user_hunterxu",
    displayName: "Hunter Xu",
    email: "hunter@arc-intelligence.example",
    status: "active",
    twoFactorEnabled: true,
    memberships: ["org_arc-intelligence"],
    roles: ["task_owner", "reviewer", "admin"],
  } satisfies MockUserProfile,
  adminMembers: [
    {
      id: "user_hunterxu",
      displayName: "Hunter Xu",
      email: "hunter@arc-intelligence.example",
      organizationId: "org_arc-intelligence",
      organizationName: "Arc Intelligence",
      roles: ["task_owner", "reviewer", "admin"],
      status: "active",
      twoFactorEnabled: true,
      lastSeen: "2 min ago",
    },
    {
      id: "user_maya-chen",
      displayName: "Maya Chen",
      email: "maya@arc-intelligence.example",
      organizationId: "org_arc-intelligence",
      organizationName: "Arc Intelligence",
      roles: ["reviewer", "dispute_participant"],
      status: "active",
      twoFactorEnabled: true,
      lastSeen: "14 min ago",
    },
    {
      id: "user_arjun-patel",
      displayName: "Arjun Patel",
      email: "arjun@arc-intelligence.example",
      organizationId: "org_arc-intelligence",
      organizationName: "Arc Intelligence",
      roles: ["reviewer", "arbitrator"],
      status: "restricted",
      twoFactorEnabled: false,
      lastSeen: "1 day ago",
    },
    {
      id: "user_elena-rivera",
      displayName: "Dr. Elena Rivera",
      email: "elena@arc-intelligence.example",
      organizationId: "org_arc-intelligence",
      organizationName: "Arc Intelligence",
      roles: ["arbitrator", "admin"],
      status: "active",
      twoFactorEnabled: true,
      lastSeen: "7 min ago",
    },
  ] satisfies MockAdminMember[],
  organizations: [
    {
      id: "org_arc-intelligence",
      displayName: "Arc Intelligence",
      status: "active",
    },
  ] satisfies MockOrganization[],
  tenantPolicies: [
    {
      organizationId: "org_arc-intelligence",
      isolationMode: "strict tenant boundary",
      membershipApproval: "admin sign-off",
      reviewControl: "dual sign-off for governed tasks",
      exportControl: "provenance required",
      disputeRouting: "expert gate after secondary review",
      provenanceRetention: "append-preserving lineage for all finalized judgments",
    },
  ] satisfies MockTenantPolicy[],
  projects: [
    {
      id: "proj_human-judgment-lab",
      organizationId: "org_arc-intelligence",
      name: "Human Judgment Lab",
      description:
        "A governed annotation initiative for AI-assisted policy and reasoning tasks.",
      status: "active",
      governanceModel: "dual_signoff",
    },
    {
      id: "proj_reasoning-canon",
      organizationId: "org_arc-intelligence",
      name: "Reasoning Canon",
      description:
        "Evaluation-grade reasoning judgments with stricter reviewer gating and export controls.",
      status: "active",
      governanceModel: "expert_gate",
    },
    {
      id: "proj_safety-escalation-desk",
      organizationId: "org_arc-intelligence",
      name: "Safety Escalation Desk",
      description:
        "A dispute-heavy workstream for ambiguous policy and safety incidents that require arbitration-ready provenance.",
      status: "pilot",
      governanceModel: "arbitration_ready",
    },
  ] satisfies MockProject[],
  tasks: [
    {
      id: "task_policy-ner-v1",
      projectId: "proj_human-judgment-lab",
      title: "Policy Entity Review",
      judgmentQuestion:
        "Should the named entity candidate be accepted as a policy-relevant actor or corrected before governance review?",
      taskClass: "annotation",
      taskType: "text_annotation",
      executionMode: "ai_assisted",
      dataSourceLabel: "s3://arc-intelligence/policy-ner-v1/",
      annotationRules:
        "Mark every policy-relevant actor span, classify the actor type, and preserve uncertainty when the entity boundary or role is ambiguous.",
      outputSchemaRef: "schema_policy_actor_v1",
      reviewPolicyRef: "review_dual_signoff_v1",
      status: "active",
      backlogCount: 24,
    },
    {
      id: "task_claim-reasoning-v1",
      projectId: "proj_human-judgment-lab",
      title: "Claim Reasoning Verification",
      judgmentQuestion:
        "Does the evidence support the claim strongly enough for human-first canonical judgment?",
      taskClass: "judgement",
      taskType: "claim_support_judgement",
      executionMode: "human_first",
      dataSourceLabel: "gs://arc-intelligence/claim-reasoning-v1/",
      annotationRules:
        "Read the claim and evidence together, assign a support verdict, and write a short rationale that explains the judgment without hidden assumptions.",
      outputSchemaRef: "decision_claim_reasoning_v1",
      reviewPolicyRef: "review_expert_gate_v1",
      status: "draft",
      backlogCount: 8,
    },
    {
      id: "task_answer-eval-v1",
      projectId: "proj_human-judgment-lab",
      title: "Answer Quality Evaluation",
      judgmentQuestion:
        "Does the answer correctly address the question, stay grounded in the supplied evidence, and avoid unsafe overclaiming?",
      taskClass: "judgement",
      taskType: "llm_answer_evaluation",
      executionMode: "ai_assisted",
      dataSourceLabel: "s3://arc-intelligence/answer-eval-v1/",
      annotationRules:
        "Read the question, answer, and evidence together. Choose a verdict, capture a short rationale, and flag unsupported or unsafe claims before anything enters review.",
      outputSchemaRef: "decision_answer_eval_v1",
      reviewPolicyRef: "review_answer_eval_gate_v1",
      status: "active",
      backlogCount: 19,
    },
    {
      id: "task_evidence-grounding-v2",
      projectId: "proj_reasoning-canon",
      title: "Evidence Grounding Audit",
      judgmentQuestion:
        "Is the cited evidence specific enough to support the reasoning chain without hidden inference leaps?",
      taskClass: "judgement",
      taskType: "reasoning_quality_judgement",
      executionMode: "ai_assisted",
      dataSourceLabel: "azure://reasoning-canon/grounding-audit-v2/",
      annotationRules:
        "Check whether cited evidence grounds the reasoning chain directly, and annotate every unsupported leap or missing citation link.",
      outputSchemaRef: "decision_grounding_audit_v2",
      reviewPolicyRef: "review_expert_gate_v2",
      status: "active",
      backlogCount: 31,
    },
    {
      id: "task_policy-safety-flags-v1",
      projectId: "proj_safety-escalation-desk",
      title: "Policy Safety Flag Triage",
      judgmentQuestion:
        "Should the candidate safety flag remain with the item, be downgraded, or escalate into arbitration?",
      taskClass: "annotation",
      taskType: "image_annotation",
      executionMode: "ai_assisted",
      dataSourceLabel: "mock://safety-escalation-desk/policy-safety-flags-v1",
      annotationRules:
        "Check the proposed safety flag against the visible evidence, keep flags precise, and avoid escalating unless the evidence remains materially ambiguous.",
      outputSchemaRef: "schema_safety_flag_v1",
      reviewPolicyRef: "review_arbitration_entry_v1",
      status: "pilot",
      backlogCount: 13,
    },
    {
      id: "task_preference-ranking-v1",
      projectId: "proj_reasoning-canon",
      title: "Response Preference Ranking",
      judgmentQuestion:
        "Which response is better aligned with the prompt, evidence, and policy constraints?",
      taskClass: "judgement",
      taskType: "preference_judgement",
      executionMode: "human_first",
      dataSourceLabel: "s3://reasoning-canon/preference-ranking-v1/",
      annotationRules:
        "Read the prompt, compare response A and response B, choose the preferred answer or mark a tie, and write a short rationale that explains the tradeoff.",
      outputSchemaRef: "decision_preference_ranking_v1",
      reviewPolicyRef: "review_preference_gate_v1",
      status: "active",
      backlogCount: 14,
    },
  ] satisfies MockTask[],
  taskItems: [
    {
      id: "item_001",
      taskId: "task_policy-ner-v1",
      externalRef: "record://policy/001",
      preview:
        "Memo excerpt references the Department of Transportation and a private freight operator in the same paragraph.",
      aiLabel: "AGENCY, COMPANY",
      confidence: "0.91",
      status: "under_review",
    },
    {
      id: "item_002",
      taskId: "task_policy-ner-v1",
      externalRef: "record://policy/002",
      preview:
        "Internal note mentions a public health board but the acronym is ambiguous across jurisdictions.",
      aiLabel: "AGENCY",
      confidence: "0.62",
      status: "disputed",
    },
    {
      id: "item_003",
      taskId: "task_policy-ner-v1",
      externalRef: "record://policy/003",
      preview:
        "The source names a regulator and an advocacy group with clearly separated roles.",
      aiLabel: "REGULATOR, NGO",
      confidence: "0.95",
      status: "finalized",
    },
    {
      id: "item_004",
      taskId: "task_policy-ner-v1",
      externalRef: "record://policy/004",
      preview:
        "Task item is queued for import after dataset pointer registration.",
      aiLabel: "PENDING_AI_IMPORT",
      confidence: "n/a",
      status: "annotation_in_progress",
    },
    {
      id: "item_101",
      taskId: "task_claim-reasoning-v1",
      externalRef: "record://claims/101",
      preview:
        "Claim states that the subsidy reduced emissions by 30%, but the evidence packet cites only a regional pilot and one before-after chart.",
      aiLabel: "supports_with_gap_note",
      confidence: "human draft",
      status: "ready",
      draftVerdict: "supports_with_gap_note",
      draftRationale:
        "The pilot evidence points in the same direction as the claim, but it does not justify the stronger 30% generalization without wider coverage.",
      flags: ["limited_evidence", "generalization_gap"],
    },
    {
      id: "item_102",
      taskId: "task_claim-reasoning-v1",
      externalRef: "record://claims/102",
      preview:
        "Evidence includes two conflicting sources with different time windows and a missing methodology appendix.",
      aiLabel: "needs_human_annotation",
      confidence: "human in progress",
      status: "annotation_in_progress",
      draftVerdict: "ambiguous",
      draftRationale:
        "The conflicting time windows and missing appendix prevent a stable support judgement until the methodology is clarified.",
      flags: ["conflicting_sources", "missing_methodology"],
    },
    {
      id: "item_103",
      taskId: "task_claim-reasoning-v1",
      externalRef: "record://claims/103",
      preview:
        "The evidence packet quotes the full study and the supporting data table, but omits one counterexample raised in peer review.",
      aiLabel: "supports_with_counterpoint",
      confidence: "awaiting review",
      status: "under_review",
      draftVerdict: "supports_with_counterpoint",
      draftRationale:
        "The main study supports the claim, but the missing counterexample should remain visible in the rationale before canonicalization.",
      reviewDecision: "revise",
      reviewNote:
        "Keep the support verdict, but require the omitted counterexample to be carried into the final rationale.",
      flags: ["counterpoint_present"],
    },
    {
      id: "item_201",
      taskId: "task_answer-eval-v1",
      externalRef: "record://answers/201",
      preview:
        "Question asks whether the emissions target was met. The model answer says yes, citing one report excerpt and adding an uncited claim about sector-wide compliance.",
      aiLabel: "revise_with_grounding_gap",
      confidence: "0.74",
      status: "under_review",
      candidateOutput: "revise_with_grounding_gap",
      candidateConfidence: "0.74",
      candidateRationale:
        "The answer appears directionally correct, but it overreaches from a single cited report into sector-wide compliance.",
      reviewDecision: "revise",
      reviewNote:
        "The answer should be revised to remove the uncited sector-wide claim while preserving the cited target result.",
      flags: ["grounding_gap", "overclaim"],
    },
    {
      id: "item_202",
      taskId: "task_answer-eval-v1",
      externalRef: "record://answers/202",
      preview:
        "Question asks if the policy applies nationally. The answer says it does, but the evidence packet only covers two jurisdictions and one draft memo.",
      aiLabel: "unsupported_overclaim",
      confidence: "0.82",
      status: "ready",
      candidateOutput: "unsupported_overclaim",
      candidateConfidence: "0.82",
      candidateRationale:
        "The answer generalizes from partial jurisdictional evidence and a draft memo, so the national-scope claim is unsupported.",
      flags: ["unsupported", "scope_overclaim"],
    },
    {
      id: "item_203",
      taskId: "task_answer-eval-v1",
      externalRef: "record://answers/203",
      preview:
        "Question asks for the correct filing deadline. The answer cites the official guidance and reproduces the exact date with one minor wording mismatch.",
      aiLabel: "approve_with_minor_edit",
      confidence: "0.89",
      status: "annotation_in_progress",
      candidateOutput: "approve_with_minor_edit",
      candidateConfidence: "0.89",
      candidateRationale:
        "The answer is grounded in the official filing guidance and only needs a minor wording correction to match the source exactly.",
      flags: ["minor_edit"],
    },
    {
      id: "item_301",
      taskId: "task_preference-ranking-v1",
      externalRef: "record://prefs/301",
      preview:
        "Prompt asks for a concise answer about national policy scope with explicit evidence grounding and no unsupported extrapolation.",
      aiLabel: "prefer_response_b",
      confidence: "human draft",
      status: "ready",
      draftVerdict: "prefer_response_b",
      draftRationale:
        "Response B stays closer to the supplied evidence and avoids the unsupported national-scope leap made by response A.",
      responseA:
        "The policy applies nationally and covers all jurisdictions under the 2025 directive.",
      responseB:
        "The evidence only confirms application in two jurisdictions, so national coverage should not be claimed.",
      preferredOption: "B",
      preferenceRationale:
        "Response B is more grounded and avoids overclaiming beyond the cited evidence.",
      flags: ["preference_judgement", "grounding_sensitive"],
    },
    {
      id: "item_302",
      taskId: "task_preference-ranking-v1",
      externalRef: "record://prefs/302",
      preview:
        "Prompt asks for a safe explanation of filing requirements with one answer optimized for brevity and one for caution.",
      aiLabel: "prefer_response_a",
      confidence: "under review",
      status: "under_review",
      draftVerdict: "prefer_response_a",
      draftRationale:
        "Response A is shorter but still grounded in the official filing guidance and avoids the speculative wording present in response B.",
      reviewDecision: "accept",
      reviewNote:
        "The preference is accepted because response A balances brevity and policy safety without omitting required caveats.",
      responseA:
        "File by March 31 using the official portal; late submissions require a waiver request.",
      responseB:
        "You can probably file by March 31, though agencies may accept later submissions in some cases.",
      preferredOption: "A",
      preferenceRationale:
        "Response A is clearer and safer because it stays within the official guidance.",
      flags: ["preference_judgement", "safety_sensitive"],
    },
  ] satisfies MockTaskItem[],
  workflow: [
    {
      title: "Annotation intake",
      description: "Task items are created from dataset pointers without ingesting raw source payloads.",
      state: "stable",
      tone: "default",
    },
    {
      title: "Reviewer action",
      description: "Accept, edit, or reject remains explicit and attributable.",
      state: "interactive",
      tone: "accent",
    },
    {
      title: "Disagreement escalation",
      description: "Conflicts are preserved and can route into dispute or arbitration.",
      state: "next",
      tone: "dark",
    },
  ] satisfies WorkflowStep[],
  assignments: [
    {
      reviewer: "Maya Chen",
      role: "Lead reviewer",
      workstream: "policy-priority",
      sla: "4h",
    },
    {
      reviewer: "Arjun Patel",
      role: "Dispute backup",
      workstream: "governance-escalation",
      sla: "1 business day",
    },
  ] satisfies TaskAssignment[],
  activity: [
    {
      time: "09:20",
      actor: "system",
      action: "dataset registered",
      detail: "4 task items generated from external pointers",
    },
    {
      time: "10:05",
      actor: "gpt-4.1",
      action: "candidate imported",
      detail: "AI suggestion attached to item_001 and item_002",
    },
    {
      time: "10:44",
      actor: "Maya Chen",
      action: "review started",
      detail: "Opened item_001 in reviewer workbench",
    },
    {
      time: "11:12",
      actor: "Maya Chen",
      action: "disagreement flagged",
      detail: "item_002 routed for secondary review due to ambiguity",
    },
  ] satisfies ActivityEvent[],
  taskPolicies: [
    {
      taskId: "task_policy-ner-v1",
      executionMode: "ai_assisted",
      outputSchemaRef: "schema_policy_actor_v1",
      reviewPolicyRef: "review_dual_signoff_v1",
      disputePolicyRef: "dispute_escalation_policy_v1",
      exportPolicyRef: "export_authoritative_with_provenance_v1",
      pointerStatus: "registered",
      storageProvider: "AWS S3",
      advancedConfig: "Auto-import enabled, confidence threshold 0.70, provenance required on export.",
      taskStatus: "active",
    },
    {
      taskId: "task_claim-reasoning-v1",
      executionMode: "human_first",
      outputSchemaRef: "decision_claim_reasoning_v1",
      reviewPolicyRef: "review_expert_gate_v1",
      disputePolicyRef: "dispute_reasoning_policy_v1",
      exportPolicyRef: "export_reasoning_bundle_v1",
      pointerStatus: "pending_registration",
      storageProvider: "Google Cloud Storage",
      advancedConfig: "Human-first launch, expert review gate, rationale required before submit.",
      taskStatus: "draft",
    },
    {
      taskId: "task_answer-eval-v1",
      executionMode: "ai_assisted",
      outputSchemaRef: "decision_answer_eval_v1",
      reviewPolicyRef: "review_answer_eval_gate_v1",
      disputePolicyRef: "dispute_answer_eval_policy_v1",
      exportPolicyRef: "export_answer_eval_bundle_v1",
      pointerStatus: "registered",
      storageProvider: "AWS S3",
      advancedConfig: "Answer candidate import enabled, unsafe-overclaim flag required, expert review on low-grounding verdicts.",
      taskStatus: "active",
    },
    {
      taskId: "task_evidence-grounding-v2",
      executionMode: "ai_assisted",
      outputSchemaRef: "decision_grounding_audit_v2",
      reviewPolicyRef: "review_expert_gate_v2",
      disputePolicyRef: "dispute_grounding_policy_v2",
      exportPolicyRef: "export_grounding_bundle_v2",
      pointerStatus: "registered",
      storageProvider: "Azure Blob Storage",
      advancedConfig: "Human-first launch, evidence span capture required, expert review on low-agreement items.",
      taskStatus: "active",
    },
    {
      taskId: "task_policy-safety-flags-v1",
      executionMode: "ai_assisted",
      outputSchemaRef: "schema_safety_flag_v1",
      reviewPolicyRef: "review_arbitration_entry_v1",
      disputePolicyRef: "dispute_safety_policy_v1",
      exportPolicyRef: "export_safety_bundle_v1",
      pointerStatus: "mock_connected",
      storageProvider: "Mock storage",
      advancedConfig: "AI-first launch, escalation on low-confidence safety flags, arbitration packet on dispute.",
      taskStatus: "pilot",
    },
    {
      taskId: "task_preference-ranking-v1",
      executionMode: "human_first",
      outputSchemaRef: "decision_preference_ranking_v1",
      reviewPolicyRef: "review_preference_gate_v1",
      disputePolicyRef: "dispute_preference_policy_v1",
      exportPolicyRef: "export_preference_bundle_v1",
      pointerStatus: "registered",
      storageProvider: "AWS S3",
      advancedConfig: "Preference A/B choice required, tie allowed, rationale mandatory before submit.",
      taskStatus: "active",
    },
  ] satisfies MockTaskPolicy[],
  disputes: [
    {
      id: "dispute_policy-002",
      taskId: "task_policy-ner-v1",
      taskItemId: "item_002",
      status: "open",
      severity: "high",
      openedBy: "Maya Chen",
      assignedTo: "Arjun Patel",
      disagreementSummary:
        "AI classified the actor as AGENCY while the reviewer marked the span as jurisdictionally ambiguous.",
    },
    {
      id: "dispute_policy-004",
      taskId: "task_policy-ner-v1",
      taskItemId: "item_004",
      status: "queued",
      severity: "medium",
      openedBy: "system",
      assignedTo: "Unassigned",
      disagreementSummary:
        "Imported suggestion lacks enough source context to finalize without second-pass review.",
    },
  ] satisfies MockDisputeCase[],
  arbitration: [
    {
      id: "arb_policy-002",
      disputeCaseId: "dispute_policy-002",
      taskId: "task_policy-ner-v1",
      arbitrator: "Dr. Elena Rivera",
      status: "awaiting_ruling",
      rulingSummary:
        "Evidence packet assembled; domain expert reviewing jurisdiction-specific agency naming standards.",
      canonicalOutcome: "Pending",
    },
  ] satisfies MockArbitrationCase[],
  exports: [
    {
      id: "exp_policy-ner-v1",
      organizationId: "org_arc-intelligence",
      projectId: "proj_human-judgment-lab",
      taskId: "task_policy-ner-v1",
      status: "assembling",
      format: "jsonl",
      itemCount: 24,
      includesProvenance: true,
      destination: "s3://arc-intelligence/exports/policy-ner-v1/",
    },
    {
      id: "exp_grounding-v2",
      organizationId: "org_arc-intelligence",
      projectId: "proj_reasoning-canon",
      taskId: "task_evidence-grounding-v2",
      status: "draft",
      format: "parquet",
      itemCount: 31,
      includesProvenance: true,
      destination: "gs://reasoning-canon/grounding-audit-v2/",
    },
  ] satisfies MockExportPackage[],
}

export function getOrganizationView(organizationId: string) {
  const organization = mockData.organizations.find((item) => item.id === organizationId)

  if (!organization) {
    return null
  }

  const projects = mockData.projects.filter(
    (project) => project.organizationId === organizationId
  )

  return {
    organization,
    projects,
  }
}

export function getProjectsOverviewView() {
  const accessibleOrganizations = mockData.organizations.filter((organization) =>
    mockData.user.memberships.includes(organization.id)
  )

  const organizationIds = new Set(accessibleOrganizations.map((organization) => organization.id))
  const projects = mockData.projects.filter((project) => organizationIds.has(project.organizationId))
  const statuses = Array.from(new Set(projects.map((project) => project.status)))

  return {
    user: mockData.user,
    organizations: accessibleOrganizations,
    projects,
    tasks: mockData.tasks.filter((task) =>
      projects.some((project) => project.id === task.projectId)
    ),
    statuses,
  }
}

export function getProjectView(projectId: string) {
  const project = mockData.projects.find((item) => item.id === projectId)

  if (!project) {
    return null
  }

  const organization = mockData.organizations.find(
    (item) => item.id === project.organizationId
  )

  if (!organization) {
    return null
  }

  const tasks = mockData.tasks.filter((task) => task.projectId === projectId)
  const disputes = mockData.disputes.filter((item) => item.taskId && tasks.some((task) => task.id === item.taskId))
  const exports = mockData.exports.filter((item) => item.projectId === projectId)

  return {
    organization,
    project,
    tasks,
    disputes,
    exports,
  }
}

export function getTaskView(taskId: string) {
  const task = mockData.tasks.find((item) => item.id === taskId)

  if (!task) {
    return null
  }

  const project = mockData.projects.find((item) => item.id === task.projectId)

  if (!project) {
    return null
  }

  const taskItems = mockData.taskItems.filter((item) => item.taskId === taskId)
  const policy = mockData.taskPolicies.find((item) => item.taskId === taskId)
  const disputes = mockData.disputes.filter((item) => item.taskId === taskId)
  const arbitration = mockData.arbitration.filter((item) => item.taskId === taskId)
  const exports = mockData.exports.filter((item) => item.taskId === taskId)
  const isDraft = task.status === "draft"
  const isAiAssisted = task.executionMode === "ai_assisted"
  const executionNoun = task.taskClass === "judgement" ? "judgement" : "annotation"

  const workflow = isDraft
    ? [
        {
          title: "Task setup",
          description:
            "Choose task class, task type, data source, execution mode, and shared rules before launch.",
          state: "in progress",
          tone: "accent" as const,
        },
        {
          title: "Launch readiness",
          description:
            "Storage connection, output format, and workflow rules must be ready before items can enter production.",
          state: "pending",
          tone: "default" as const,
        },
        {
          title: "Review and dispute",
          description:
            "Governance starts after first-pass work exists. It should not lead the task framing.",
          state: "later",
          tone: "dark" as const,
        },
      ]
    : isAiAssisted
      ? [
          {
            title: "Data source ready",
            description:
              "Task items sync from external storage without making the platform the raw data owner.",
            state: "stable",
            tone: "default" as const,
          },
          {
            title: "AI annotation running",
            description:
              task.taskClass === "judgement"
                ? "Candidate judgements are generated in the background and added back onto queued task items."
                : "Candidate annotations are generated in the background and added back onto queued task items.",
            state: "running",
            tone: "accent" as const,
          },
          {
            title: "Review and dispute",
            description:
              `Human governance starts after ${executionNoun} outputs are available or ambiguity requires escalation.`,
            state: "next",
            tone: "dark" as const,
          },
        ]
      : [
          {
            title: "Data source ready",
            description:
              `Task items sync from external storage and stay available for direct human ${executionNoun} work.`,
            state: "stable",
            tone: "default" as const,
          },
          {
            title: "Human annotation running",
            description:
              task.taskClass === "judgement"
                ? "Operators open task items directly from the items desk and produce the first-pass verdict with rationale."
                : "Annotators open task items directly from the items desk and produce the first-pass output.",
            state: "running",
            tone: "accent" as const,
          },
          {
            title: "Review and dispute",
            description:
              `Governance starts only after first-pass ${executionNoun} is submitted.`,
            state: "next",
            tone: "dark" as const,
          },
        ]

  const assignments = isDraft
    ? [
        {
          reviewer: "Hunter Xu",
          role: "Task owner",
          workstream: "draft configuration",
          sla: "Before launch",
        },
      ]
    : isAiAssisted
      ? [
          {
            reviewer: "Maya Chen",
            role: "Lead reviewer",
            workstream: "policy-priority",
            sla: "4h",
          },
          {
            reviewer: "Arjun Patel",
            role: "Dispute backup",
            workstream: "governance-escalation",
            sla: "1 business day",
          },
        ]
      : [
          {
            reviewer: "Hunter Xu",
            role: "Lead annotator",
            workstream: "human-annotation",
            sla: "same day",
          },
          {
            reviewer: "Maya Chen",
            role: "Review owner",
            workstream: "expert-gate",
            sla: "next business day",
          },
        ]

  const activity = isDraft
    ? [
        {
          time: "09:10",
          actor: "Hunter Xu",
          action: "task draft created",
          detail: "Task shell created under the Human Judgment Lab project.",
        },
        {
          time: "09:24",
          actor: "Hunter Xu",
          action: "shared rules drafted",
          detail:
            task.taskClass === "judgement"
              ? "Shared judgement instructions added for claim support, rationale, and ambiguity handling."
              : "Shared annotation instructions added for labels, rationale, and ambiguity handling.",
        },
        {
          time: "09:42",
          actor: "system",
          action: "storage pending",
          detail: "Google Cloud Storage path is saved but external validation has not completed yet.",
        },
      ]
    : isAiAssisted
      ? [
          {
            time: "09:20",
            actor: "system",
            action: "dataset registered",
            detail: "4 task items generated from external pointers",
          },
          {
            time: "10:05",
            actor: "gpt-4.1",
            action: "candidate imported",
            detail:
              task.taskClass === "judgement"
                ? "AI answer candidates attached to the next judgement batch."
                : "AI suggestion attached to item_001 and item_002",
          },
          {
            time: "10:44",
            actor: "Maya Chen",
            action: "review started",
            detail: "Opened item_001 after candidate generation reached review threshold.",
          },
          {
            time: "11:12",
            actor: "Maya Chen",
            action: "disagreement flagged",
            detail: "item_002 routed for secondary review due to ambiguity",
          },
        ]
      : [
          {
            time: "09:18",
            actor: "system",
            action: "dataset registered",
            detail: "3 task items linked from the external storage path.",
          },
          {
            time: "09:47",
            actor: "Hunter Xu",
            action: task.taskClass === "judgement" ? "judgement started" : "annotation started",
            detail:
              task.taskClass === "judgement"
                ? "Opened item_102 directly from the items desk for first-pass human judgement."
                : "Opened item_102 directly from the items desk for first-pass human annotation.",
          },
          {
            time: "10:11",
            actor: "Hunter Xu",
            action: task.taskClass === "judgement" ? "judgement saved" : "annotation saved",
            detail:
              task.taskClass === "judgement"
                ? "Draft verdict and rationale recorded and queued for expert review once submission is complete."
                : "Draft rationale recorded and queued for expert review once submission is complete.",
          },
          {
            time: "10:36",
            actor: "Maya Chen",
            action: "review staged",
            detail: "item_103 marked ready for downstream governance after annotation submission.",
          },
        ]

  return {
    project,
    task,
    taskItems,
    policy,
    workflow,
    assignments,
    activity,
    disputes,
    arbitration,
    exports,
  }
}

export function getAccessView() {
  const organization = mockData.organizations[0]

  if (!organization) {
    return null
  }

  return {
    user: mockData.user,
    organization,
  }
}

export function getAdminView() {
  const organization = mockData.organizations[0]
  const policy = organization
    ? mockData.tenantPolicies.find((item) => item.organizationId === organization.id) ?? null
    : null

  if (!organization) {
    return null
  }

  return {
    user: mockData.user,
    organization,
    members: mockData.adminMembers,
    organizations: mockData.organizations,
    policy,
  }
}

export function getTaskSetupView(taskId: string) {
  const base = getTaskView(taskId)

  if (!base || !base.policy) {
    return null
  }

  return {
    project: base.project,
    task: base.task,
    policy: base.policy,
    pointerPreview:
      base.task.executionMode === "ai_assisted"
        ? [
            "record://policy/001",
            "record://policy/002",
            "record://policy/003",
            "record://policy/004",
          ]
        : [
            "record://claims/101",
            "record://claims/102",
            "record://claims/103",
          ],
  }
}

export function getDisputeView(disputeId: string) {
  const dispute = mockData.disputes.find((item) => item.id === disputeId)

  if (!dispute) {
    return null
  }

  const task = mockData.tasks.find((item) => item.id === dispute.taskId)
  const taskItem = mockData.taskItems.find((item) => item.id === dispute.taskItemId)

  if (!task || !taskItem) {
    return null
  }

  const project = mockData.projects.find((item) => item.id === task.projectId)

  if (!project) {
    return null
  }

  const arbitrationCase = mockData.arbitration.find(
    (item) => item.disputeCaseId === dispute.id
  )

  return {
    dispute,
    task,
    taskItem,
    project,
    activity: mockData.activity,
    arbitrationCase,
  }
}

export function getArbitrationView(arbitrationId: string) {
  const arbitrationCase = mockData.arbitration.find((item) => item.id === arbitrationId)

  if (!arbitrationCase) {
    return null
  }

  const dispute = mockData.disputes.find(
    (item) => item.id === arbitrationCase.disputeCaseId
  )
  const task = mockData.tasks.find((item) => item.id === arbitrationCase.taskId)

  if (!dispute || !task) {
    return null
  }

  const taskItem = mockData.taskItems.find((item) => item.id === dispute.taskItemId)
  const project = mockData.projects.find((item) => item.id === task.projectId)

  if (!taskItem || !project) {
    return null
  }

  return {
    arbitrationCase,
    dispute,
    task,
    taskItem,
    project,
    activity: mockData.activity,
  }
}

export function getExportView(exportId: string) {
  const exportPackage = mockData.exports.find((item) => item.id === exportId)

  if (!exportPackage) {
    return null
  }

  const organization = mockData.organizations.find(
    (item) => item.id === exportPackage.organizationId
  )
  const project = mockData.projects.find((item) => item.id === exportPackage.projectId)
  const task = mockData.tasks.find((item) => item.id === exportPackage.taskId)

  if (!organization || !project || !task) {
    return null
  }

  return {
    exportPackage,
    organization,
    project,
    task,
    activity: mockData.activity,
  }
}
