# Final Engineering Delivery & Acceptance Brief

**Project:** Human–AI Data Annotation, Provenance, and Dataset Evaluation Platform
**Client:** Arc Intelligence
**University:** The University of Sydney
**Semester:** Semester 2, 2026
**Document:** Final Delivery Requirements
**Version:** 1.0 — 28 October 2026

---

## 1. Purpose

This document defines the final engineering deliverables and client acceptance expectations for the project.

The objective is not merely to demonstrate a working annotation application. It is to deliver an integrated, reproducible, and verifiable system that another engineering team can understand, evaluate, operate, and continue developing.

The central question is:

**What evidence demonstrates that the delivered system behaves as required, within its stated conditions and limitations?**

A working interface, completed feature list, passing tests, or successful demonstration is useful, but none is sufficient on its own.

The final delivery must include both:

1. **The engineering artefact** — the implemented system and its supporting resources.
2. **The engineering evidence** — reproducible observations, evaluations, decisions, and limitations that justify accepting the artefact.

This brief supplements the original project proposal. It does not replace the agreed project scope or the University's formal assessment requirements. Existing client-approved scope changes remain applicable.

## A Note on Final Delivery

**We seek an honest account, not an exhaustive implementation.**

This brief is intended to guide your final delivery, not to introduce new development requirements.

You may use it to prioritise your remaining work, but **do not rush to implement missing features simply to satisfy this brief.**

If something is incomplete, unverified, or unsuccessful, report it as such. Explain what was achieved, what evidence supports it, what remains unresolved, and why.

**The goal is not to demonstrate that everything is finished, but to establish an accurate and defensible account of what has been delivered.**

## 2. Delivery Principles

The following principles apply to all submissions.

**2.1 Evidence over assertion**

Statements such as "the system is secure", "the tests pass", or "the release process works" must be supported by evidence that another person can inspect or reproduce.

For each significant claim, identify what was tested, under which conditions, what was observed, and what remains unverified.

**2.2 Acceptance is not implementation**

Completing a feature does not automatically establish that it meets its requirements. Implementation, verification, and client acceptance are distinct activities.

**2.3 Independent verification**

Critical system properties must be checked against requirements and invariants, not solely against tests or assumptions produced by the feature's implementer.

Where practical, verification cases should be reviewed or executed by a team member who did not implement the corresponding feature.

**2.4 Failures are engineering evidence**

Unsuccessful experiments, failed tests, incorrect assumptions, and unsuccessful design choices should be retained when they help explain the system.

A documented failure followed by a justified correction and successful re-evaluation is preferable to an unsupported claim that no problems occurred.

**2.5 Accountability remains human**

AI-assisted development is permitted. However, every submitted artefact, design decision, test result, and engineering claim must have an identifiable human owner who can explain and defend it.

**2.6 Scope and limitations must be explicit**

The team is expected to distinguish completed, partially completed, and unimplemented requirements. No feature should be represented as verified or production-ready without adequate evidence.

---

## 3. Required Delivery Packages

The final submission consists of four packages.

### D1 — Integrated System

**Objective:** Deliver a functional, reproducible implementation of the agreed platform.

The integrated system must demonstrate the following capabilities, subject to documented and approved scope changes.

| Area            | Expected capability                                                                                   |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| Governance      | Organisations, projects, user roles, permissions, and controlled operations                           |
| Data management | Dataset sources, source versions, and versioned annotation guidelines                                 |
| Annotation      | Human-only, AI-first, and blind-then-reveal workflows                                                 |
| AI integration  | Typed, replaceable model interface with deterministic mock and live provider modes                    |
| Provenance      | Traceable annotation attempts, AI suggestions, human decisions, review actions, and relevant versions |
| Review          | Reviewer decisions, disagreement handling, and adjudication workflows                                 |
| Release         | Validation gates, immutable dataset releases, export manifests, and reproducibility                   |
| Evaluation      | Integrated support for evaluating annotation quality, human–AI collaboration, and data integrity      |

The system must preserve the conceptual distinction between an annotator's label, a reviewer's decision, and an adjudicated canonical judgment.

**Required submission:**

- Complete source code, configuration, dependency definitions, and database migrations.
- Reproducible installation and execution instructions.
- Test accounts, fixtures, and suitable demonstration datasets.
- A documented end-to-end workflow.
- An architecture overview identifying major components, interfaces, and data flows.
- A record of modifications to the pre-existing platform.

The existing UI design language, authentication, and functioning features remain stable by default. Any replacement must have a documented justification and appropriate prior review or approval.

**Acceptance expectation:**

An independent reviewer should be able to set up the system and complete a representative source-to-release workflow without relying on undocumented developer knowledge.

### D2 — Evaluation & System Assurance

**Objective:** Demonstrate the system's behaviour through reproducible, risk-oriented verification.

Evaluation is a primary deliverable, not an optional appendix.

#### 3.2.1 Evaluation harness and casebook

Provide a reusable evaluation harness with approximately **40–60 substantive test scenarios**, consistent with the original proposal.

The casebook must include normal operations, boundary conditions, and adversarial scenarios. It must not consist solely of trivial unit tests or repeated variations of the same happy path.

Each substantive scenario should record:

- Scenario ID and purpose.
- Requirement or invariant under examination.
- Input data and initial conditions.
- Execution procedure or command.
- Expected observable behaviour.
- Actual observed behaviour.
- Pass/fail outcome and supporting evidence.
- Relevant limitations or unresolved findings.

The team may organise related scenarios into suites. Unit tests may support the casebook but do not automatically count as substantive end-to-end cases.

#### 3.2.2 Required assurance areas

The evaluation must cover:

**A. Quality**

Annotation accuracy, inter-annotator agreement, reviewer agreement, AI suggestion quality, and calibration where applicable.

**B. Human–AI collaboration**

Acceptance, modification, rejection and override behaviour; annotation time; review burden; and evidence of possible anchoring or automation bias.

Human-only and AI-assisted conditions should be compared using a documented evaluation procedure. Relevant differences in datasets, participant assignment, task order, and other potential confounders must be explained.

**C. System integrity**

Permission enforcement, provenance completeness, workflow correctness, version consistency, release validation, and reproducibility.

**D. Reliability and failure handling**

Relevant component failures, unavailable or incorrect model responses, interrupted operations, and recovery or safe degradation.

#### 3.2.3 Mandatory adversarial scenarios

At minimum, the casebook must address:

1. A confidently incorrect AI suggestion.
2. A genuinely ambiguous annotation item.
3. Disagreement between annotators or reviewers.
4. Guidelines that do not resolve an observed disagreement.
5. A guideline or source version change after annotation.
6. Missing, incomplete, or invalid provenance.
7. Unreviewed items entering a proposed release.
8. A proposed release containing superseded or incompatible items.
9. An unauthorised user attempting a protected operation.
10. An unavailable or failing AI provider.

For each critical refusal case, provide a corresponding valid positive case wherever applicable.

For example, demonstrate both that a correctly reviewed dataset can be released and that an equivalent dataset with missing required provenance is refused.

The release validation gate must be demonstrated rejecting invalid candidates **before an accepted release is created**. A successful release alone is not evidence of effective validation.

#### 3.2.4 Measured evidence

Provide raw or machine-readable results supporting the evaluation conclusions.

Relevant measurements may include:

- Accuracy and agreement metrics.
- Acceptance, modification, and override rates.
- Task completion time and review effort.
- Provenance completeness and validation results.
- Execution latency, error rates, and resource or model costs.
- Failure detection and recovery behaviour.

Measurements must identify the dataset, environment, sample size, conditions, and relevant versions.

Claims must be no broader than the evidence supports. Numerical performance thresholds should follow previously agreed requirements rather than being invented retrospectively.

**Acceptance expectation:**

A reviewer must be able to execute the evaluation, inspect its outputs, reproduce representative failures and successes, and determine which claims the results support.

### D3 — Engineering Report & Decision Records

**Objective:** Explain and defend the engineering work, including its reasoning, evidence, trade-offs, and limitations.

Submit one consolidated **Final Engineering Report** covering:

**A. Problem and scope**

- Original problem, intended users, and system objectives.
- Implemented scope and deviations from the proposal.
- Requirements that remain incomplete or unresolved.

**B. System architecture**

- Component architecture and responsibility boundaries.
- Data model, provenance representation, and versioning.
- Permission and authority model.
- Annotation, review, adjudication, and release lifecycle.
- External integrations and trust boundaries.

**C. Engineering decisions**

- Significant design choices and alternatives considered.
- Reasons for retaining, modifying, or replacing existing components.
- Consequences and trade-offs of major decisions.

**D. Verification and evaluation**

- Evaluation methodology and datasets.
- Summary of tests and assurance evidence.
- Quantitative findings with supporting data.
- Negative results, identified failure mechanisms, and corrections.

**E. Limitations and risks**

- Known defects and unresolved issues.
- Untested conditions and assumptions.
- Security, reliability, data integrity, and operational risks.
- What would be necessary before broader or production use.

#### Claim–Evidence Matrix

Include a concise matrix linking important system claims to verification evidence.

| Claim                                  | Evidence                           | Reproduction              | Limitations                                         |
| -------------------------------------- | ---------------------------------- | ------------------------- | --------------------------------------------------- |
| Example: invalid releases are rejected | Negative release-gate test results | Test command and fixtures | Tested under documented workflow conditions         |
| Example: source versions are traceable | Provenance lineage inspection      | Reproduction script       | Migration of historical records not fully evaluated |

The entries above are illustrative. The submitted matrix must reference actual implemented behaviour and real evidence.

#### Project Management & Delivery Records

Include relevant planning and project management artefacts, such as project plans, Jira boards, sprint backlogs, Scrum records, milestone reviews, and progress reports.

These should help explain how the team organised its work, tracked progress, managed changes, and responded to challenges.

Existing records are sufficient; there is no need to reconstruct or retrospectively create documentation solely for this submission.

Briefly identify significant deviations from the original plan, their causes, and their consequences for the final delivery.

#### Individual Decision Records

Each team member must provide a brief record of significant engineering decisions they personally owned or contributed to.

Each record should explain:

- The problem or decision.
- Alternatives considered.
- The chosen approach and justification.
- Evidence supporting the decision.
- Limitations, consequences, and revisions.
- The member's actual responsibility.

These records are not activity diaries or counts of commits, prompts, or lines of code.

**Acceptance expectation:**

The report must enable an engineering reviewer to understand not only what was built, but why it was built that way, what is known about its behaviour, and what remains uncertain.

### D4 — Handover & Engineering Sign-off

**Objective:** Ensure that the delivered system can be evaluated, maintained, and extended without dependence on its original developers.

The handover package must contain:

- Installation, configuration, and deployment instructions.
- Required environment variables and external service dependencies, without exposing secrets.
- Database initialization and migration procedures.
- Running instructions for the application and evaluation harness.
- Test data, fixtures, and account setup instructions.
- Operational guidance for relevant failure and recovery scenarios.
- Known issues, unresolved risks, and recommended next steps.
- Final engineering sign-off records.

A reviewer should be able to identify the system version being delivered and the evidence associated with that version.

**Individual sign-off**

Each member must identify:

1. The artefacts and decisions for which they accept responsibility.
2. The critical claims they can substantiate.
3. The known limitations of their work.
4. Any unresolved risks that should affect acceptance or future use.

Sign-off is an assertion of responsible engineering judgment within stated limits. It is not a declaration that the system is flawless or universally production-ready.

---

## 4. Required Final Demonstration

The final demonstration must follow a coherent end-to-end journey, using a realistic dataset.

The core sequence is:

**Source → Annotation → Review → Adjudication → Release Validation → Dataset Release → Audit / Reproduction**

The team must demonstrate:

**Scenario A — Successful release**

Create or load a project, apply versioned guidelines, perform annotations, conduct review and adjudication, validate the release candidate, export a dataset, and inspect its manifest and provenance.

**Scenario B — Invalid release**

Introduce a missing or invalid provenance relationship, an unreviewed item, or an incompatible version. Demonstrate that the release gate rejects the candidate and identifies the reason.

**Scenario C — AI-assisted judgment**

Demonstrate the difference between human-only and AI-assisted annotation. Show a case in which an AI suggestion is modified or rejected and the resulting provenance is preserved.

**Scenario D — Authority boundary**

Attempt an operation with an identity lacking the required authority. Demonstrate the refusal and confirm that an appropriately authorised operation succeeds.

**Scenario E — Failure handling**

Introduce a relevant model-provider or service failure. Demonstrate the observed effect, error handling, and recovery or safe fallback where implemented.

**Scenario F — Reproduction**

Use an existing release manifest to reconstruct or verify the released dataset and demonstrate the applicable integrity checks.

The client may request additional probes within the documented project requirements and invariants.

A recorded demonstration may supplement the submission but must not substitute for reproducible artefacts or verifiable system behaviour.

---

## 5. Submission Structure

The recommended submission structure is:

```text
final-delivery/
├── README.md
├── system/
│   └── source, configuration, migrations, fixtures
├── docs/
│   ├── architecture.md
│   ├── deployment.md
│   ├── operations.md
│   └── change-record.md
├── evaluation/
│   ├── casebook/
│   ├── harness/
│   ├── results/
│   └── evidence/
├── assurance/
│   ├── claim-evidence-matrix.md
│   ├── invariant-verification.md
│   ├── failure-study.md
│   └── limitations-and-risks.md
├── decisions/
│   └── individual-member-records/
├── project-management/
│   └── project plans, Jira boards, sprint backlogs, Scrum records, milestone reviews, progress reports
├── handover/
│   ├── known-issues.md
│   └── signoff.md
└── final-engineering-report.pdf
```

Equivalent repository layouts are acceptable if the required artefacts are clearly identified and accessible.

The top-level README must explain how to:

1. Install and start the application.
2. Initialize the required data and accounts.
3. Run the automated tests.
4. Run the evaluation harness.
5. Reproduce the primary demonstration scenarios.
6. Locate the results, evidence, and known limitations.

Commands must be executable in the stated environment. Any setup step requiring manual intervention must be documented.

Temporary cloud deployments or access to private infrastructure may support the demonstration but must not be the sole means of evaluating the submission.

## 6. Final Acceptance Review

The client review will examine the delivered system and its supporting evidence, rather than judging presentation quality alone.

A suggested review structure is:

| Activity                        | Purpose                                                    |
| ------------------------------- | ---------------------------------------------------------- |
| Integrated demonstration        | Observe the complete intended workflow                     |
| Independent verification        | Execute selected positive, negative, and failure scenarios |
| Evidence review                 | Inspect measurements, evaluation results, and limitations  |
| Individual technical discussion | Examine engineering decisions and personal accountability  |
| Acceptance decision             | Record findings and any required corrective actions        |

The review will distinguish four questions:

**Justification:** Why should the system or change exist?

**Authority:** Who or what is permitted to act, and within which boundaries?

**Verification:** What reproducible evidence demonstrates the required behaviour?

**Admission:** On what basis should the delivered work be accepted into the client's system?

These questions must not be treated as interchangeable.

### Final Client Evaluation & Feedback

The final review will focus on understanding the delivered system, examining supporting evidence, and discussing the team's engineering decisions.

Client feedback will address:

- **Delivery:** What was achieved relative to the original project goals.
- **Verification:** What has been demonstrated and supported by reproducible evidence.
- **Engineering judgment:** How the team handled design decisions, trade-offs, challenges, and limitations.
- **Handover:** How effectively the work can be understood, reproduced, and continued.

The review will identify strengths, gaps, unresolved risks, and recommended next steps.

### Client acceptance outcomes

**Accept**

The agreed critical requirements are demonstrated with adequate evidence, and the delivered artefacts are reproducible, documented, and suitable for the agreed handover purpose. Non-critical limitations may remain if clearly disclosed and accepted.

**Borderline / Return for correction**

The delivery contains identifiable omissions, insufficient verification, failed requirements, or incomplete handover material that require correction and reassessment.

**Reject**

The submission is materially inconsistent with the agreed requirements, cannot be meaningfully verified, or contains fundamental integrity or accountability problems that prevent acceptance in its submitted form.

The team should make its own evidence-based assessment before the review. The client's decision remains separate from the University's formal academic marking and grading process. **It does not constitute a separate acceptance gate or require further development after submission.**

---

## 7. Responsible AI-Assisted Engineering

Students may use AI coding agents and other AI tools as part of their engineering process.

The client does not assess engineering quality by the proportion of code written manually, the number of prompts submitted, or the sophistication of the tools used.

What matters is whether the resulting engineering work is justified, verifiable, maintainable, and responsibly owned.

Every member must be able to explain:

- What their contribution was intended to accomplish.
- Which constraints and requirements governed the work.
- How they evaluated the resulting implementation.
- Which errors, incorrect suggestions, or design issues were discovered.
- Why the final result should be trusted within its stated boundaries.

Agent-generated tests and self-assessments may contribute evidence, but cannot be the sole basis for accepting critical system properties.

Unauthorised replacement of existing working components remains unacceptable regardless of whether the replacement was written manually or generated by an agent.

The client does not require complete transcripts of AI interactions. Relevant engineering decisions, verification evidence, and accountable ownership are the required records.

---

## 8. Completion Checklist

Before submission, the team should confirm that:

- [ ] The integrated system can be installed and run using the provided instructions.
- [ ] The agreed source-to-release workflow is demonstrated end to end.
- [ ] AI assistance, human review, adjudication, and provenance behave as documented.
- [ ] The release validation gate has been observed both accepting valid candidates and rejecting invalid ones.
- [ ] Release manifests and version information support the claimed reproducibility.
- [ ] The evaluation casebook and executable harness are included.
- [ ] Original evaluation outputs and supporting evidence are available.
- [ ] Critical permissions, workflow invariants, and failure conditions have been examined.
- [ ] Architecture, design decisions, modifications, and migration considerations are documented.
- [ ] Known failures, limitations, and incomplete requirements are disclosed.
- [ ] Individual engineering decision records are included.
- [ ] Deployment, operation, and handover instructions are complete.
- [ ] Each member can explain and defend their contribution and has provided a sign-off.

Any unchecked item must be identified in the final report with its status, impact, and proposed next action. The existence of this checklist does not override critical acceptance requirements.

## 9. Final Standard

The team is not expected to demonstrate that the system is perfect.

The team is expected to demonstrate that it understands the system it has built, can substantiate its engineering claims, can identify the conditions under which those claims hold, and can explain where they do not.

The final presentation should therefore answer five questions:

**1. What did you build?**

**2. Why was it built this way?**

**3. How do you know it behaves as required?**

**4. What happens when assumptions fail?**

**5. What, precisely, are you prepared to take responsibility for?**

A smaller, well-evidenced delivery is preferable to an impressive but unverified collection of features. However, transparent limitations do not waive previously agreed critical requirements.

The objective is not to claim readiness. It is to establish, with evidence, what the system is ready for.

**Build the system. Demonstrate its behaviour. Defend the evidence. State its limits. Hand it over responsibly.**

---

*Arc Intelligence — Client Engineering Delivery Requirements*

*Submission dates, academic marking criteria, and official assessment procedures remain governed by the University of Sydney's relevant unit requirements.*
