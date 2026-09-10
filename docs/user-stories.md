# Hej Platform — Gap Analysis & User Story Backlog

**Group:** CS-57 · **Client:** Hunter Xu (Arc Intelligence) · **Prepared for:** Week 5 milestone — *"Scope broken down into user stories and prioritised against the committed core workflow"*

## 0. Sources

| # | Document | What it contributed |
|---|---|---|
| 1 | `Human–AI Data Annotation, Provenance, and Dataset Evaluation Platform.pdf` (project brief) | The six goal pillars (Govern/Assist/Record/Adjudicate/Release/Evaluate), scope of work, explicit non-goals, evaluation requirements |
| 2 | `COMP5703-(GP)-Proposal_Report_template.docx` (our draft proposal) | The four agreed objectives, methodology, milestone schedule, workstream split |
| 3 | `Meeting Notes – first-client-meeting.pdf` (13 pages) | Client's own priority ordering, project/task/item hierarchy examples, explicit "do this / don't do this" instructions |
| 4 | `CS57_Status_Checking_1.docx` (status form, 26-Aug-2026) | Client's directive to prioritise new feature work over standalone defect cleanup; confirmed W5 = user-story breakdown |
| 5 | `plans/issues.md` — our 29-defect audit (verified against the code) | The defect register every story below is traced against |
| 6 | `hej-main/` codebase and its `docs/` design set | Ground truth of what is actually built vs. only specified |

---

## 1. Gap Summary — Goal vs. Current State

The brief frames the platform around six pillars. This is the gap on each, checked against the actual `hej-main` code rather than its documentation:

| Pillar | Goal (per brief) | Current state | Core gap |
|---|---|---|---|
| **Govern** | Organisations, projects, roles, capability-based permissions, versioned guidelines | The organisation → project → task → item hierarchy exists. Roles are stored labels checked only for organisation membership — no action anywhere checks whether the user holds the right *role* to perform it. Guidelines/sources have no versioning at all. | Enforce roles on actions, not just tenancy; add guideline and source versioning. |
| **Assist** | Suggestions from a replaceable, typed model interface; human-only / AI-first / blind-then-reveal modes | One hardcoded AI integration, called synchronously in the request path. No mode selection exists. When the AI fails, the platform invents plausible-looking annotations rather than reporting failure. | Build a swappable model interface, a real processing queue, the three modes, and honest failure reporting. |
| **Record** | Every item's source and guideline version, annotation attempts, and whether the human accepted / modified / rejected / replaced the AI's suggestion — captured as it happens | Only a generic activity log with opaque before/after blobs. Reviewer corrections are appended as truncated free text and never applied to the stored answer. | Build a structured provenance record distinct from the activity log. |
| **Adjudicate** | Configurable review, disagreement and adjudication; annotator's label, reviewer's decision and adjudicated judgment kept distinct | Finalised results can be silently overwritten; a second, legacy review API can rewrite approval history without changing item status; the platform cannot reliably tell which annotator's work a reviewer is looking at. | One canonical judgment per item, one review path, enforced role separation. |
| **Release** | Immutable releases with export manifests, gated *before* the release exists on unreviewed items, missing provenance and superseded versions | "Export" is a status label computed live from task status. There is no manifest, no immutability, and no gate of any kind. | Build release generation, manifests and a real pre-release gate. This is a placeholder today, not a partial implementation. |
| **Evaluate** | Reusable harness and 40–60 case casebook measuring quality, collaboration and integrity | Nothing exists. Backend unit tests cover individual services; there is no workflow-level scenario or regression harness. | Build from zero — a net-new deliverable, not a fix. |

**Additional client-driven requirement:** a reliable **task queue** for AI annotation — retries, dead-letter handling, stable processing across hundreds or thousands of items. The client raised this repeatedly and framed it as the core engineering problem. Currently absent entirely.

---

## 2. Explicit Non-Goals

Kept out of the backlog deliberately, per the brief and the client meeting:

- Rebuilding the annotation interface, or integrating Label Studio (client: *learn from* how it organises the UI, don't integrate it).
- Training or fine-tuning an AI model — the AI step stays a deterministic mock behind a swappable interface.
- A universal annotation ontology or a generic workflow engine.
- All modalities at once — **text first**; image and video stay schema-compatible but are not committed demo paths.
- Formal privacy or legal compliance claimed through software features alone.
- Exhaustive role/permission coverage on day one — the client asked for an *extensible* model, not every rule enforced now.
- A comprehensive dashboard or full organisation-management suite — both explicitly "nice-to-have."
- Fixing all 29 defects as a standalone cleanup phase. Per the client's direction at the 26-Aug status meeting, **defects are only fixed where they block a committed story** — which is why every defect below sits inside the story that closes it, rather than in a separate bug backlog.

---

## 3. How to Read the Backlog

Each story has three parts:

- **The story** — written from the perspective of the person who wants the outcome: *As a …, I want / should be able to …, because …*
- **Acceptance criteria** — what that person can observe when the story is done. Written as behaviour, not implementation.
- **Related issues** — which of the 29 defects in `plans/issues.md` this story closes, and why implementing the story necessarily fixes them. Stories marked *No open defects* build capability that doesn't exist yet, so there is nothing catalogued to fix.

**Priority:** `P0` blocks the committed core end-to-end workflow · `P1` strengthens it within agreed scope · `P2` explicitly lower priority per client.

**Owner (suggested):** the workstream from our proposal's role split — **BE** Backend/Core Engine · **FE** Frontend/Integration · **SC** Schema & Contracts/QA · **GOV** Governance & Evaluation · **Lead** Team Lead/Client Liaison.

**Roles used in stories:** Annotator · Reviewer · Expert (arbitrator) · Project Manager (task owner) · Organisation Administrator · Client (dataset consumer) · Team Member (running the platform locally) · Quality Lead.

---

## 4. Epic Index

| Epic | Pillar | Stories | Issues closed |
|---|---|---|---|
| A — Trustworthy Foundations | cross-cutting | 5 | 1, 12, 13, 23, 24, 25, 26 |
| B — Setting Up Work | Govern | 6 | 16, 19, 27, 28, 29 |
| C — AI-Assisted First Pass | Assist | 5 | 20 |
| D — Review & Cross-Validation | Adjudicate | 8 | 2, 3, 5, 6, 7, 8, 11 |
| E — Disagreement & Dispute | Adjudicate | 6 | 15 |
| F — Provenance & History | Record | 5 | 4, 5, 21, 22 |
| G — Roles, Permissions & Organisations | Govern | 5 | 7, 9, 10, 17, 18 |
| H — Release & Export | Release | 6 | 4, 14, 19, 27 |
| I — Evaluation | Evaluate | 5 | — |
| J — Organisations & Dashboard | nice-to-have | 4 | 17, 18 |
| K — Evidence & Handover | assessed deliverables | 4 | — |

**59 stories.** All 29 catalogued defects are covered — see the coverage map in Section 6.

**A note on completeness.** This backlog covers the *product*. Four of the objectives agreed with the client are represented by Epics B–H (workflow), Epic G (governance), Epic A5 (contracts) and the screen-integration stories in D8/E6/H6 (full-stack integration). Epic K covers the deliverables the capstone is assessed on that are not code. Nothing here is optional if the outcome is meant to be a *high-quality deliverable* rather than a working prototype.

---

## Epic A — Trustworthy Foundations

*Nothing else can be safely built, demonstrated or trusted until these hold. The client explicitly directed the team to establish its own review workflow after identifying the previous team's lack of one as the cause of conflicting, overwritten work.*

### A1 — Changes are reviewed before they reach the platform
**P0** · Owner: **Lead** / all

As a **project manager**, I want every change to the platform to be reviewed by a second person before it goes live, because the previous team's uncoordinated changes overwrote each other and I need to trust that what I'm demonstrating is what was agreed.

**Acceptance criteria**
- No change reaches the main branch without an approving review from someone other than its author.
- Every change is traceable to the user story it implements.
- Automated checks must pass before a change can be merged.

**Related issues**
- No open defects — this is the process control that stops new defects of the kind catalogued in `issues.md` from re-entering, which the client asked for by name at the status meeting.

### A2 — I can trust that a fix in one place hasn't broken another
**P0** · Owner: **SC**

As a **client**, I want the platform's automated checks to genuinely pass before anything ships, because otherwise a change to the review screen can silently break annotation and nobody finds out until the demo.

**Acceptance criteria**
- The web application's checks and test suite pass cleanly, so a broken change is caught before merge rather than after.
- Tests that claim to check something actually check it — a test named for image-annotation loading must fail if that loading breaks.
- Test setup does not imply behaviour the platform doesn't have.

**Related issues**
- **Issue 12 & 13** (frontend fails typecheck; frontend test suite failing) — this story's definition of done is a green frontend build and suite, so both are resolved by the work itself rather than tracked separately.
- **Issue 25** (a frontend test passes even when the behaviour it names is broken) — replacing the placeholder assertion with a real one is exactly what "tests genuinely pass" requires here.
- **Issue 26** (misleading mock setup in a backend test) — removed while making the suite trustworthy, so a future reader isn't misled about what the code does.

### A3 — I can get a working copy of the platform running by myself
**P0** · Owner: **SC**

As a **team member**, I should be able to set up and reset a working local copy of the platform with seeded demo accounts in one step, because I can't contribute to or demonstrate a system I can't start.

**Acceptance criteria**
- Following the documented setup steps produces a running platform with the seeded Admin, Reviewer and Annotator accounts.
- Resetting the demo data works repeatedly, including against an already-seeded database.
- Configuration supplied by a team member (ports, keys, environment) is actually picked up by the platform.
- A setup failure reports what went wrong instead of failing silently or crashing while reporting.

**Related issues**
- **Issue 24** (`init_data.py --reset` broken two ways) — the story requires reset to work repeatedly on a stock Windows terminal, which closes both the console-encoding crash and the foreign-key failure that currently leaves the database half-dropped.
- **Issue 23** (`.env` config silently ignored) — "configuration is actually picked up" is the acceptance criterion, so the wrong-prefix and never-read-the-file defects both have to go for this story to pass.

### A4 — Platform credentials aren't sitting in shared code
**P0** · Owner: **SC**

As an **organisation administrator**, I want the platform's service credentials kept out of the shared codebase, because a key that ships inside every copy of the code is a key I can't control, revoke or attribute.

**Acceptance criteria**
- No live credential is readable in the source code.
- Credentials are supplied per environment and can be rotated without a code change.
- The exposed key is rotated at the provider, not merely removed from the code.

**Related issues**
- **Issue 1** (live API key hardcoded in committed source) — this story's first criterion removes it, and the rotation criterion covers the part that a code fix alone can't: the key is already public in every existing clone. Depends on **A3**, since configuration must actually load before a key can be supplied any other way.

### A5 — A status means the same thing wherever I see it
**P0** · Owner: **SC**

As a **project manager**, I want a status, role or result to mean one thing across every screen, the API and the export, because the same item currently has different state names in different places and I can't tell whether two screens disagree because of a bug or because they're using different words for the same thing.

**Acceptance criteria**
- One agreed set of task states and one agreed set of item states, used by the screens, the API and the export alike.
- Where our design documents and the running code currently disagree, the difference is resolved deliberately and the documents updated to match what was built.
- A state a user can see is a state the workflow can actually reach.
- The frontend–backend contract and the AI-assistant contract are written down and reviewed before the workflow work in Epics C–H begins.

**Related issues**
- No open defects catalogued — but this is the third of the four objectives agreed with the client, and the drift is real: our design documents describe task states `draft/active/paused/completed/archived` and a `FINALIZED` item state, while the code implements `draft/ready/in_review/disputed/completed` and `canonicalized`. Our own risk register lists this drift as Risk 4 and Risk 10.
- Sequenced first because **B4**, **B6**, **G4** and **H5** all resolve disagreements between screens, and doing that three separate times against three different vocabularies is how the disagreement returns.

---

## Epic B — Setting Up Work

*The client's own description of the critical path starts here: "Create Project → Configure Policy → Create Task → Add Items/Dataset."*

### B1 — I can create a project to hold related work
**P0** · Owner: **BE/FE**

As a **project manager**, I want to create a project with a name, description and objective inside my organisation, because my work comes in programmes — the client's own example is an "Autonomous Driving" project holding several different annotation and evaluation tasks.

**Acceptance criteria**
- I can create a project and see it listed in my organisation.
- A project belongs to exactly one organisation and is visible only to that organisation's members.
- I can open a project and see the tasks inside it.

**Related issues**
- No open defects — the capability exists and works; it is listed because the workflow depends on it and because **J4** later extends it with lifecycle operations.

### B2 — I can decide how carefully my project's work gets reviewed
**P0** · Owner: **BE**

As a **project manager**, I want to set how many reviewers an item needs, how many review rounds run, and what share of items get independently double-checked, because a low-risk labelling job and a safety-critical judgement task shouldn't be governed identically.

**Acceptance criteria**
- When creating a project or task I can set: the number of approvals required, the proportion of items requiring independent cross-review (the client's example: **30%**), and what happens when reviewers disagree.
- The settings I choose are visible on the project afterwards and can be corrected before work starts.
- The workflow actually behaves according to what I set — this is not a label recorded and ignored.

**Related issues**
- No open defects — policy settings partially exist in the data model, but nothing enforces them. Enforcement is **G2**.

### B3 — I can create a task for a specific piece of work
**P0** · Owner: **BE/FE**

As a **project manager**, I want to create a task stating whether it is an **annotation** task or a **judgement** task and what kind of data it covers, because the client's two task categories need different work surfaces and different result shapes.

**Acceptance criteria**
- I can create a task under a project, choosing annotation or judgement and the task type.
- The task records what a finished result should look like (labels for annotation, verdict plus reasoning for judgement).
- Text tasks are fully workable end-to-end; image and video tasks can be created without breaking, but are not committed demo paths in this phase.

**Related issues**
- No open defects — task creation exists; what's missing is the lifecycle (**B4**) and the schema/policy binding that makes it meaningful.

### B4 — My task moves through real states, not just "draft"
**P0** · Owner: **BE**

As a **project manager**, I want to start a task, pause it and complete it, because right now a task stays a draft forever — which means the item list is never closed and I can never tell from the outside whether work is in progress.

**Acceptance criteria**
- I can move a task from draft into active work, and from active into complete.
- Once a task is active, new items can no longer be quietly added to it mid-review.
- The state shown on the project screen, the task screen and the export list agree with each other.

**Related issues**
- **Issue 28** (a task can never leave `draft`, so intake never closes) — the story's whole point is the missing activation step; adding it also makes the `in_review` / `ready` / `disputed` states reachable, which the export dashboard is already built around but can never currently display. `issues.md` flags this as needing a product decision first, so this story includes agreeing the intended path with the client.

### B5 — Loading a dataset either works or leaves nothing behind
**P0** · Owner: **BE**

As a **project manager**, I want registering a batch of items to either fully succeed or fully fail, because a batch that half-loaded leaves me with a task I can't trust and no way to tell which items are real.

**Acceptance criteria**
- If item registration fails partway, no partial items, pointers or drafts remain.
- I can load a task with hundreds or thousands of items — the client's example is 1,000 video recordings under one task.
- If I try to load items at a point in the workflow that doesn't allow it, I'm told that clearly ("intake is closed for this task"), not shown a generic server error.

**Related issues**
- **Issue 16** (dataset registration isn't transactional) — "leaves nothing behind on failure" is precisely the missing all-or-nothing behaviour, so implementing this story removes the partial-state cleanup problem.
- **Issue 29** (lifecycle conflicts reported as server errors) — the clear-message criterion requires the deliberate "intake closed" response to survive instead of being converted into a `500`.

### B6 — "Done" means the same thing everywhere I look
**P1** · Owner: **BE**

As a **project manager**, I want a completed task to report the same progress on every screen, because a task marked complete that reports zero finished items destroys my confidence in every other number the platform shows me.

**Acceptance criteria**
- The rule for "this item is finished" is the same rule used by task completion and by the export list.
- A completed task never shows a contradictory item count.
- Status values shown to me correspond to states the workflow can actually reach.

**Related issues**
- **Issue 19** (task completion and export readiness disagree on "done") — the story cannot pass while two different definitions exist, so the two rules must be unified into one.
- **Issue 27** (export-eligibility list names an impossible `"approved"` status) — cleaned up in the same change, since the story requires the states shown to be states that can genuinely occur.

---

## Epic C — AI-Assisted First Pass

*The client's priority: the platform must reliably trigger AI annotation, receive the result and move it into human review — with the model itself mocked. Their stated diagnosis of the previous team's biggest gap was exactly this connective layer.*

### C1 — The AI assistant can be swapped without disrupting my work
**P1** · Owner: **BE**

As a **project manager**, I want the platform's AI assistant to be replaceable, because the client intends to move from a mock to open-source or self-hosted models later and I don't want the workflow rebuilt when that happens.

**Acceptance criteria**
- The mock AI assistant can be replaced with a different one without changing any review, dispute or export behaviour.
- Which assistant and version produced a suggestion is recorded against the item.
- Everything downstream treats an AI suggestion as a *suggestion*, never as a finished answer.

**Related issues**
- No open defects — this is net-new capability the brief calls for ("a replaceable, typed model interface, with mock and live modes interchangeable").

### C2 — A large batch of items gets AI-annotated reliably
**P0** · Owner: **BE**

As a **project manager**, I want to request AI annotation across a whole task and have it complete reliably in the background, because with a thousand items I can't sit and wait, and one failed item must not sink the batch.

**Acceptance criteria**
- I can trigger AI annotation for a task and keep working while it runs.
- Temporary failures are retried automatically; items that permanently fail are shown to me as failed rather than dropped.
- I can see how much of the batch is done, in progress or stuck.

**Related issues**
- No open defects — net-new. The client raised this as the central engineering requirement (retries, failed jobs, dead-letter handling, "a classic distributed system problem"), and there is currently no queue of any kind.

### C3 — I'm told when the AI failed instead of being shown a fake answer
**P0** · Owner: **BE**

As a **reviewer**, I want to know when the AI step failed or was switched off, because a fabricated suggestion I mistake for a real one is worse than no suggestion at all.

**Acceptance criteria**
- If the AI step fails or is disabled, the item is clearly marked as having no AI suggestion — the platform never invents one.
- Where an AI result was incomplete, what was actually returned is shown as-is rather than padded out.
- The distinction between "AI said this" and "no AI result available" is visible on the review screen.

**Related issues**
- **Issue 20** (AI failures produce fake annotations disguised as real ones) — the platform currently fabricates fixed bounding boxes on failure and pads short results with more of them, stored as an ordinary draft. This story's first two criteria make that behaviour impossible to keep.

### C4 — I can control whether reviewers see the AI's answer first
**P1** · Owner: **BE/FE**

As a **project manager**, I want to choose whether a task shows the AI suggestion up front, hides it until the human has committed, or runs human-only, because seeing the machine's answer first changes the answer people give.

**Acceptance criteria**
- I can select human-only, AI-first, or blind-then-reveal when setting up a task.
- In blind-then-reveal, the reviewer cannot see the AI suggestion until their own answer is recorded.
- Which mode was in force is recorded against the item, so results from different modes can be compared later (see **I4**).

**Related issues**
- No open defects — net-new, and worth flagging as a gap between our own documents: the inherited design describes only two modes, while the client brief requires three. Neither is implemented today.

### C5 — I can record why I decided, not just what I decided
**P1** · Owner: **BE/FE**

As a **reviewer working on a judgement task**, I want to record my reasoning alongside my verdict, because the client's stated purpose for collecting human judgement is capturing *how people reason* — not harvesting yes/no answers.

**Acceptance criteria**
- Judgement tasks capture a structured justification alongside the verdict, not an optional comment box.
- My reasoning is retrievable later, attached to the item and distinct from the verdict itself.
- Reasoning is carried into the export with the decision it explains.

**Related issues**
- No open defects — net-new. Client examples of what this must capture: why an AI answer is wrong, why one answer is preferred, how a person broke the problem down.

---

## Epic D — Review & Cross-Validation

*Adjudicate pillar, first half. The highest-severity defects in the register live here — two of them are named in the client's own project brief as the definition of the problem this project exists to fix.*

### D1 — I can't approve my own work
**P0** · Owner: **BE**

As a **reviewer**, I should not be able to approve an item I annotated myself, because a review that one person can perform on their own work is not a review, and any dataset built on it is indefensible.

**Acceptance criteria**
- Attempting to review my own annotation is refused, with a clear explanation.
- Only users holding a reviewer or expert role can perform review actions at all.
- The same restriction applies to dispute decisions, not just first-line review.

**Related issues**
- **Issue 7** (annotators can approve their own work) — the review endpoint currently checks only that you belong to the organisation. This story's first two criteria are exactly the two missing checks, so the defect closes as the story lands.

### D2 — Approval history can't be rewritten behind my back
**P0** · Owner: **BE**

As a **project manager**, I want an approval decision to be permanent and consistent with the item's actual state, because if an approval can be flipped or deleted afterwards, the record of who signed off on what is worthless.

**Acceptance criteria**
- There is one way to record a review decision, and it always moves the item's state with it.
- An existing approval cannot be edited or deleted into a different outcome by an ordinary member.
- Item state and review history always agree with each other.

**Related issues**
- **Issue 8** (a second, legacy review API can rewrite approval history) — an older set of endpoints lets any organisation member change or delete a review without touching item status. The "one way to record a decision" criterion requires retiring or locking down that path, which is the fix.

### D3 — The correction I make is the answer that gets saved
**P0** · Owner: **BE**

As a **reviewer**, when I correct an annotation I want my corrected value to become the stored answer, because at the moment I can correct an item, watch it finalise, and my correction is nowhere in the result.

**Acceptance criteria**
- A corrected value submitted with a review replaces the stored answer for that item.
- Re-opening the item afterwards shows my correction, not the original.
- The exported dataset carries the corrected value.
- The original annotation is still visible in the item's history — corrected, not erased.

**Related issues**
- **Issue 5** (reviewer corrections aren't actually saved) — corrections are currently appended as truncated text to a notes field while the item advances anyway. Criteria 1–3 are unimplementable without fixing this; criterion 4 keeps the fix consistent with the provenance requirement in **F3**.

### D4 — I know I'm reviewing the right person's work
**P0** · Owner: **BE**

As a **reviewer**, I want certainty that the annotation in front of me belongs to the annotator it says it does, because on a double-annotated item the platform currently can't reliably tell, and I could approve or reject the wrong person's submission without any sign anything went wrong.

**Acceptance criteria**
- Opening an item for review always shows a specific, identified annotator's submission.
- On an item annotated by two people, both submissions are individually addressable — I never get an arbitrary one of the two.
- My decision is recorded against the submission I actually looked at.

**Related issues**
- **Issue 3** (reviewers can get shown the wrong annotator's work) — the "which annotation is current" pick is effectively random on multi-annotator items. This story requires a defined answer, which is the fix; `issues.md` notes the choice between one canonical annotation per item and per-annotator submissions is a product decision to settle with the client first.
- **Issue 11** (draft submission isn't atomic and drafts don't link to their annotation) — the missing draft-to-annotation link is the same root cause reached from the other direction; restoring it is what makes criterion 3 possible.

### D5 — Finalised means finalised
**P0** · Owner: **BE**

As a **client**, I want a finalised result to stay finalised unless someone deliberately reopens it, because a "locked" answer that a later submission can quietly change means no exported label can be defended.

**Acceptance criteria**
- Submitting new work against a finalised item is refused, or explicitly reopens review — never silently applied.
- Reopening a finalised item is a visible, attributable action.
- A submission either completes fully or not at all — it never leaves an item half-updated.

**Related issues**
- **Issue 2** (a finalised annotation can be silently overwritten) — currently a new draft updates the same record in place with no check on whether the item is already finalised. Criterion 1 is the missing check.
- **Issue 11** (draft submission is not one transaction) — criterion 3 requires the three separate writes involved in submitting work to succeed or fail together.

### D6 — My unfinished work is mine
**P0** · Owner: **BE**

As an **annotator**, I want my in-progress draft to be editable only by me, because right now anyone in the organisation can change, submit or delete my unfinished work — including submitting it before I'm ready.

**Acceptance criteria**
- Only I can edit, delete or submit my own draft.
- Someone else attempting it is refused, with a clear message.
- An administrator or reviewer override, if we allow one, is explicit and recorded in the item's history.

**Related issues**
- **Issue 6** (drafts have no ownership enforcement) — draft access is currently checked against organisation and project membership only, never against who owns the draft. This story's first criterion is that missing check.

### D7 — A defined share of items gets independently double-checked
**P1** · Owner: **BE**

As a **project manager**, I want the proportion of items I set in my policy to be routed to a second, independent reviewer, because sampling for cross-validation is how I find out whether my reviewers actually agree.

**Acceptance criteria**
- The cross-validation percentage set in **B2** determines how many items are routed for a second independent review.
- The second reviewer cannot see the first reviewer's decision before recording their own.
- I can see, per task, how many items were double-reviewed and how often the two reviewers agreed.

**Related issues**
- No open defects — net-new. This is the mechanism the client described (30% independently reviewed) and it feeds the agreement metrics in **I3**.

### D8 — Work reaches the right person
**P0** · Owner: **BE/FE**

As an **annotator**, I want to open the platform and see the items that are mine to work on, because otherwise there is no answer to "what should I do next" — and as a **project manager** I need to give specific work to specific people rather than hoping the right person picks it up.

**Acceptance criteria**
- I can see a list of items assigned to me, and open one directly from it.
- A project manager can assign items to an annotator, a reviewer or an expert, individually or in bulk.
- An item shows who it is currently with, and moving it to someone else is recorded in its history.
- Assignment respects roles — an item needing review is not assigned to someone who cannot review.

**Related issues**
- No open defects catalogued, because the concept is absent rather than broken: task items have no assignee at all in the data model, so there is nothing to attribute a defect to.
- This is a prerequisite the rest of the epic quietly assumes. **D7** routes a share of items to "a second independent reviewer" and **E2** sends an item "back to the annotator" — neither is implementable without assignment existing first.

---

## Epic E — Disagreement & Dispute

*Adjudicate pillar, second half. The client's description: when reviewers give different judgements, the item enters reconciliation, and a higher-level user or expert provides the final decision.*

### E1 — Disagreement is noticed without anyone reporting it
**P0** · Owner: **BE**

As a **project manager**, I want the platform to detect when two reviewers disagree and open a dispute automatically, because disagreement I have to find manually is disagreement I will miss.

**Acceptance criteria**
- When independent reviews on the same item conflict, a dispute is raised automatically.
- The dispute shows both conflicting decisions and who made them.
- Disputed items are visible in one place and are excluded from release until resolved.

**Related issues**
- No open defects — net-new. Our own design notes are explicit that dispute should default to auto-detected disagreement rather than being a complaint button.

### E2 — I can send an item back to the annotator
**P0** · Owner: **FE**

As an **expert**, I want to send a disputed item back to its annotator with a note, because not every dispute should be settled by me overruling — sometimes the right outcome is the original annotator redoing it with guidance.

**Acceptance criteria**
- "Send back to annotator" works from the dispute screen and is not a placeholder.
- The item returns to the annotator's queue with my note attached.
- The send-back appears in the item's history with who sent it back and why.

**Related issues**
- **Issue 15** (dispute "send back to annotator" isn't implemented) — users currently hit a placeholder message. `issues.md` confirms the platform already fully supports this behind the screen and has a ready client function for it, so this is a frontend-only story: wiring the existing button to the existing capability closes the defect.

### E3 — An expert's decision is recorded as its own decision
**P1** · Owner: **BE**

As an **expert**, I want my adjudication recorded as a distinct decision that references the dispute it settles, because "who routed this to me" and "who decided it" are different facts and collapsing them destroys the audit trail.

**Acceptance criteria**
- An adjudication is a separate record from the routing that requested it.
- It references the item, the dispute, and the conflicting decisions it resolves.
- The annotator's original label, the reviewers' decisions and my adjudication all remain individually visible afterwards.

**Related issues**
- No open defects — net-new. This is the brief's requirement that annotator label, reviewer decision and adjudicated judgment are "preserved rather than collapsed into one final answer field."

### E4 — Resolving a dispute doesn't erase the disagreement
**P1** · Owner: **BE**

As a **client**, I want a resolved item to still show that people disagreed and how it was settled, because disagreement is evidence about the item's difficulty, and deleting it hides exactly what I most need to know.

**Acceptance criteria**
- Resolving a dispute adds a resolution; it never deletes or overwrites the conflicting decisions.
- A resolved item's history still shows the original disagreement.
- Reports can distinguish items that were contested from items that were unanimous.

**Related issues**
- No open defects — net-new, and a stated non-negotiable in our governance documents ("disagreement is first-class... must be preserved, not collapsed").

### E5 — Escalation matches the assurance my project needs
**P1** · Owner: **BE**

As a **project manager**, I want to configure whether disputes must reach an expert, may reach one, or never do, because a routine labelling task and an arbitration-ready project need different escalation rules.

**Acceptance criteria**
- I can set the escalation posture when configuring the project or task.
- Where an expert gate is required, an item cannot complete without an expert decision.
- The posture in force is visible on the project.

**Related issues**
- No open defects — net-new. The escalation gate values exist internally but are not selectable or enforced; see **G2** for the wider posture enforcement this depends on.

### E6 — The dispute and arbitration screens show my real cases
**P0** · Owner: **FE**

As an **expert**, I want the dispute and arbitration screens to show the actual disputed items from my projects, because they currently display sample data — so everything Epic E builds underneath is invisible to the person who has to act on it.

**Acceptance criteria**
- The project dispute list, the individual dispute view and the arbitration view all show real cases from the backend, scoped to what I'm allowed to see.
- The task-level dispute and finalised views show that task's real items.
- Actions taken on these screens change real state, and the change is visible on refresh.
- No screen in the dispute or arbitration path renders placeholder content.

**Related issues**
- No open defects catalogued — the screens work, they're just not connected. Verified: `tasks/[taskId]/dispute`, `tasks/[taskId]/finalized`, `projects/[projectId]/disputes` and the standalone dispute/arbitration views contain no live-data calls at all, while the overview, items, annotate and review screens do.
- This is the second of the four agreed objectives ("every screen backed by real, correctly-scoped data rather than partially-wired endpoints") and without it Epic E is backend work nobody can see.

---

## Epic F — Provenance & History

*Record pillar. The brief's test: a released dataset must be able to answer, for any item, "how did this label get here" — and refuse to release when it can't.*

### F1 — I can ask how any label came to exist
**P0** · Owner: **BE**

As a **client**, I want to open any item in a delivered dataset and see the full sequence that produced its label, because a dataset that can't answer that can only be shipped, not defended.

**Acceptance criteria**
- Each item shows an ordered record of: what it came from, what the AI suggested, what the human did with that suggestion (accepted, modified, rejected or replaced), every review decision, and any dispute or adjudication.
- Each entry names who did it and when.
- The record is captured as the work happens, not reconstructed afterwards.

**Related issues**
- No open defects — net-new. Only a generic activity log exists today, holding opaque before/after values rather than a structured account of the workflow.

### F2 — Annotations remember which guideline they followed
**P1** · Owner: **BE**

As a **project manager**, I want to update annotation guidelines without rewriting history, because when I revise a guideline mid-project I need to know which items were labelled under the old one.

**Acceptance criteria**
- Updating a guideline or source creates a new version rather than replacing the current one.
- Every annotation records the guideline and source version in force when it was made.
- I can see which items were annotated under a superseded version.

**Related issues**
- No open defects — net-new. There is no versioning of any kind today, which is also what makes the "superseded version" release check in **H3** impossible to build until this exists.

### F3 — The AI's suggestion, the human's answer and the reviewer's correction stay separate
**P0** · Owner: **BE**

As a **client**, I want to see the AI's suggestion, the annotator's decision on it and any reviewer correction as three distinct facts, because collapsing them into one value destroys the only evidence of what human judgement actually contributed.

**Acceptance criteria**
- All three are individually retrievable for any item.
- A later correction never overwrites the earlier record — it supersedes it visibly.
- The export identifies which value is authoritative and shows what it superseded.

**Related issues**
- **Issue 5** (reviewer corrections aren't saved) — **D3** makes corrections land; this story makes them land *without* destroying the original, which is the other half of the same defect.
- **Issue 4** (a finalised item can export more than one conflicting answer) — "the export identifies which value is authoritative" is precisely the missing concept; see **H4** for the export-side change.

### F4 — History tells me who really did what
**P1** · Owner: **BE**

As a **project manager**, I want the history to distinguish what a person did from what the platform did automatically, because an audit trail that attributes automated steps to people is worse than none.

**Acceptance criteria**
- Automated actions are shown as system actions, not attributed to a user.
- The history reads cleanly — one entry per thing that happened, without a change entry repeating what the summary already says.
- I can filter an item's history to just the human decisions.

**Related issues**
- **Issue 21** (audit log always shows "user" as the actor) — criterion 1 requires the actor to reflect what actually happened, which is the fix.
- **Issue 22** (escalation entries duplicate their own summary as a change) — criterion 2 removes exactly this noise from the history view.

### F5 — I can see an item's whole story on one screen
**P1** · Owner: **FE**

As a **reviewer**, I want to see an item's full timeline before I make a decision, because deciding without knowing that two people already disagreed about it is how bad decisions get made.

**Acceptance criteria**
- The item view shows its history in order: annotation, reviews, disputes, adjudication.
- Each entry shows who, when and what changed.
- I can reach the item's history from the review screen without losing my place.

**Related issues**
- No open defects — net-new; depends on **F1**.

---

## Epic G — Roles, Permissions & Organisations

*Govern pillar. The client's position: the four roles are already understood, they don't need every rule enforced immediately, but the model must be extensible — and today none of it is actually enforced.*

### G1 — My role determines what I can do
**P0** · Owner: **BE**

As an **organisation administrator**, I want a person's role to determine which actions they can take, because at the moment being a member of the organisation is enough to do almost anything, which makes the roles I assign decorative.

**Acceptance criteria**
- Approving, disputing, adjudicating and releasing each require the appropriate role.
- A user without the required role is refused with a clear message rather than silently allowed.
- Adding a new role later doesn't require reworking the workflow.

**Related issues**
- **Issue 7** (annotators can approve their own work) — **D1** blocks self-review specifically; this story generalises the same enforcement across every governed action so the gap doesn't simply reappear on the next endpoint.

### G2 — My project's governance posture actually governs
**P1** · Owner: **BE**

As a **project manager**, I want choosing dual sign-off, expert gate or arbitration-ready to genuinely change what the workflow requires, because otherwise I've selected a label that reassures me and enforces nothing.

**Acceptance criteria**
- Dual sign-off requires the configured number of approvals from *different* reviewers before an item can finalise.
- Expert gate prevents completion until an expert has approved.
- Arbitration-ready guarantees unresolved disagreement reaches arbitration rather than quietly defaulting.
- The posture in force is visible on the project and in the export record.

**Related issues**
- No open defects — net-new enforcement. Our own terminology documents describe these three postures as "signals, not separate workflow engines," which is an accurate description of the gap: they are recorded and never applied.

### G3 — My work stays inside my project
**P0** · Owner: **BE**

As an **organisation administrator**, I want a person with access to one project to be unable to change anything in another, because access to a single low-risk project currently lets someone modify tasks and items in projects they were never given access to.

**Acceptance criteria**
- Changing or deleting a task fails unless it genuinely belongs to the project it was requested under.
- The same applies to changing an item within a task.
- Attempts across a boundary are refused, not silently applied.

**Related issues**
- **Issue 9** (cross-project/cross-org write bypass) — a duplicated route means the check that would catch this is never reached. The story's criteria can only pass once the live path performs the ownership check, which also removes the shadowed duplicate.

### G4 — The platform refuses states that can't exist
**P1** · Owner: **BE/SC**

As a **project manager**, I want the platform to reject an impossible item state outright, because a nonsense status stored permanently makes my counts, filters and progress figures lie from then on.

**Acceptance criteria**
- An invalid status is rejected before anything is stored.
- The rejection explains what the valid options were.
- No item can be left in a state the workflow doesn't recognise.

**Related issues**
- **Issue 10** (invalid task status values get saved to the database) — the value is currently committed first and only rejected when the response is built, so the bad data survives. Criterion 1 inverts that order, which is the fix.

### G5 — I can actually invite someone into my organisation
**P0** · Owner: **BE**

As an **organisation administrator**, I want to invite a colleague and have them successfully join, because today no invitation can be accepted at all — which means I cannot onboard a second person through the normal route.

**Acceptance criteria**
- I can send an invitation and see it listed as pending.
- The invited person can accept it and gain access.
- What I'm shown about an invitation's state matches its real state.

**Related issues**
- **Issue 17** (organisation invitations are completely broken) — invitations are created as already-accepted internally while reporting "pending," and acceptance always fails on a broken token contract. Criteria 2 and 3 cannot pass while either remains.
- **Issue 18** (pending-invitation listing unreachable behind a duplicate route) — criterion 1 requires the pending list to be reachable; `issues.md` notes neither defect is testable end-to-end without the other, so they are fixed together here.

---

## Epic H — Release & Export

*Release pillar. This is the largest genuine build gap on the platform: what exists today is a status label computed on the fly, not a release.*

### H1 — A release is a fixed thing I can point at
**P0** · Owner: **BE**

As a **client**, I want a release to be a permanent, unchanging artefact, because a "release" that silently changes when someone edits an item afterwards is not something I can hand to anyone.

**Acceptance criteria**
- Releasing a dataset produces a stored artefact capturing the items as they were at that moment.
- Later changes to the underlying items do not alter an existing release.
- Each release is identifiable and re-downloadable unchanged.

**Related issues**
- No open defects — net-new. Today's export list is derived live from task status; nothing is ever written or frozen, so there is no defect to fix, only a capability to build.

### H2 — Every release explains what's in it
**P0** · Owner: **BE**

As a **client**, I want each release to come with a manifest describing exactly what it contains, because I need to verify a dataset independently rather than take its contents on trust.

**Acceptance criteria**
- The manifest lists item count, the guideline and source versions covered, when it was produced and by whom.
- Each item in the release points to its provenance record.
- The release's contents can be checked against its manifest.

**Related issues**
- No open defects — net-new; depends on **F1** and **F2**.

### H3 — A release that shouldn't exist is refused
**P0** · Owner: **BE**

As a **client**, I want the platform to refuse to produce a release containing unreviewed items, missing provenance or superseded versions, because a warning attached to a bad release is not a safeguard — by then the bad release exists.

**Acceptance criteria**
- The checks run before anything is produced, and failure means no release is created.
- I'm told which items caused the refusal and why.
- The gate cannot be satisfied by someone asserting that review happened — it is checked against the recorded decisions.

**Related issues**
- No open defects — net-new, and the brief's sharpest requirement: gated "before the release exists," and explicitly not satisfiable "by an operator asserting that review happened."

### H4 — Every released item has exactly one authoritative answer
**P0** · Owner: **BE**

As a **client**, I want each item in a release to carry one answer marked as the authoritative one, because an export containing two conflicting "final" answers for the same item is unusable for training and indefensible to an auditor.

**Acceptance criteria**
- Each released item carries exactly one authoritative value.
- Where other submissions existed, they appear as superseded history — never as competing answers.
- The authoritative value matches what the review and adjudication record says it should be.

**Related issues**
- **Issue 4** (a finalised item can export more than one conflicting answer) — the export currently tracks one slot per annotator rather than one canonical value per item. Criterion 1 makes that impossible; it depends on the canonical-answer decision taken in **D4** and the supersession model in **F3**.

### H5 — Export figures agree with the rest of the platform
**P1** · Owner: **BE**

As a **project manager**, I want the export list to report the same progress I see on the task, because two screens disagreeing about the same task tells me one of them is wrong and I don't know which.

**Acceptance criteria**
- Export readiness and item counts use the same completion rule as the task itself.
- A task marked complete never produces an export reporting zero completed items.
- Export behaviour is covered by tests that actually run, so this can't silently regress.

**Related issues**
- **Issue 19** (completion and export readiness disagree on "done") — resolved jointly with **B6**, which unifies the rule; this story is the export-side half.
- **Issue 27** (impossible `"approved"` status in the eligibility list) — removed while unifying the rule.
- **Issue 14** (backend export tests fail to even run) — criterion 3 requires working export tests, which means implementing the missing helper the existing test file already specifies; until then export behaviour is entirely unverified.

### H6 — The export, policy and history screens show real data
**P0** · Owner: **FE**

As a **project manager**, I want the export, policy and history screens to show my project's actual releases, actual policy and actual activity, because a screen showing sample data is worse than no screen — it tells me something confidently and it isn't true.

**Acceptance criteria**
- The project export list and individual export view show real releases produced by **H1**.
- The project policy screen shows the policy actually in force, as set in **B2**, and the governance posture from **G2**.
- The task history and setup screens show that task's real activity and real configuration.
- Figures on these screens agree with the task screen and the dashboard.

**Related issues**
- No open defects catalogued — same situation as **E6**: verified that `projects/[projectId]/exports`, `projects/[projectId]/policies`, `tasks/[taskId]/history` and `tasks/[taskId]/setup` contain no live-data calls.
- Completes the second agreed objective alongside **E6** and **D8**. Depends on **H1** and **H2**, since there are no real releases to display until they exist.

---

## Epic I — Evaluation

*Evaluate pillar. Confirmed to not exist in any form. Per the brief: "Evaluation is a primary deliverable, not a final-week activity."*

### I1 — I can re-run the whole workflow against known cases
**P0** · Owner: **GOV**

As a **quality lead**, I want to run a scripted scenario through the entire workflow and check the outcome against what should have happened, because testing individual pieces tells me nothing about whether the workflow holds together.

**Acceptance criteria**
- A scenario can run end-to-end — annotation, review, cross-validation, dispute, final judgement — without manual clicking.
- Each scenario states its expected outcome and reports pass or fail.
- Results are comparable across runs, so a regression is visible.

**Related issues**
- No open defects — net-new; nothing of this kind exists.

### I2 — The platform is tested against cases designed to break it
**P0** · Owner: **GOV**

As a **quality lead**, I want a casebook of deliberately difficult cases, because a system demonstrated on easy items proves nothing about the ones that matter.

**Acceptance criteria**
- The casebook covers, at minimum: a confidently wrong AI suggestion; a genuinely ambiguous item; reviewers who disagree with no guideline resolution; a guideline that changes after annotation; missing provenance; an unreviewed item reaching a proposed release; a release containing a superseded item.
- Each case has a stated expected outcome and runs through **I1**.
- The casebook grows toward the 40–60 cases the brief specifies.

**Related issues**
- No open defects — net-new. These adversarial categories are taken directly from the brief.

### I3 — I can tell whether reviewers actually agree
**P1** · Owner: **GOV**

As a **quality lead**, I want reviewer agreement measured properly rather than as a raw match percentage, because raw agreement flatters any task where one answer dominates.

**Acceptance criteria**
- Agreement is reported using an established coefficient, not percentage match.
- Agreement is reported per task and comparable across tasks.
- AI suggestion quality and confidence calibration are reported alongside human agreement.

**Related issues**
- No open defects — net-new; depends on the cross-validation routing in **D7**.

### I4 — I can see what AI assistance does to human judgement
**P1** · Owner: **GOV**

As a **quality lead**, I want to measure how often reviewers accept, modify or override AI suggestions and how long they take, because the client's question is what AI assistance actually does to human judgement — not whether it feels faster.

**Acceptance criteria**
- Acceptance, modification and override rates are reported per task.
- Time per item is reported alongside them.
- Results can be compared across the execution modes from **C4**, including how often confidently-wrong AI suggestions were accepted.

**Related issues**
- No open defects — net-new; depends on **C4** and **F3**, since the measurement is impossible if suggestion and decision are collapsed into one value.

### I5 — I can prove the platform's records hold up
**P1** · Owner: **GOV**

As a **quality lead**, I want automated checks that provenance is complete, permissions were enforced and a release matches its manifest, because integrity claimed is not integrity demonstrated.

**Acceptance criteria**
- Checks confirm every released item has complete provenance.
- Checks confirm governed actions were performed by users holding the right role.
- A release can be reconstructed from its manifest and compared against the original.
- Findings — including what failed and why — are recorded, with negative results reported rather than dropped.

**Related issues**
- No open defects — net-new; exercises the gates from **H3** and the records from **F1**.

---

## Epic J — Organisations & Dashboard

*Explicitly lower priority. The client called organisation management "nice-to-have rather than urgent" and asked that a basic dashboard not be over-invested in. Sequenced last.*

### J1 — My organisation has a stable identity
**P2** · Owner: **BE**

As an **organisation administrator**, I want my organisation to have a unique identifier and address, because the client's one concrete requirement in this area is being able to refer to an organisation unambiguously.

**Acceptance criteria**
- Each organisation has a unique identifier and URL that don't change.
- An organisation can hold multiple accounts and use cases.

**Related issues**
- No open defects — net-new.

### J2 — I can see how my project is going at a glance
**P2** · Owner: **FE**

As a **project manager**, I want a simple overview of project status and progress, because I want a starting point — not an analytics product.

**Acceptance criteria**
- Shows project status, item counts by state and basic workflow statistics.
- Figures agree with the task and export screens (see **B6**).
- Deliberately limited in scope — the client asked that time not be spent making this comprehensive.

**Related issues**
- No open defects — net-new.

### J3 — I can invite and manage my team
**P2** · Owner: **BE/FE**

As an **organisation administrator**, I want to invite colleagues and manage their membership and roles, because I can't run governed review without the people who perform it.

**Acceptance criteria**
- I can invite a person, see pending invitations, and remove a member.
- I can assign and change a member's role.
- Role changes take effect on what that person can do (see **G1**).

**Related issues**
- **Issues 17 & 18** (invitations broken; pending list unreachable) — **G5** fixes the underlying flow; this story is the administrator-facing capability built on top of it and cannot be demonstrated until those are closed.

### J4 — I can maintain a project after creating it
**P2** · Owner: **BE/FE**

As a **project manager**, I want to rename a project, update its policy or team, and archive it when finished, because a project I can only create and never adjust doesn't survive contact with real work.

**Acceptance criteria**
- I can rename a project and update its description, policy, team and storage settings.
- I can archive a completed project; archived projects are read-only but still viewable.
- Changes are recorded in the project's history.

**Related issues**
- No open defects — net-new. Client's own list: rename, update, update policy, update team settings, update storage location, archive.

---

## Epic K — Evidence & Handover

*Not code, but assessed. The brief lists these as deliverables in their own right, and Arc states that every member "will be asked to walk through the reasoning behind their recorded decisions during reviews." Written as stories because they carry the same weekly delivery discipline as everything else — left to the final fortnight, they are what turns a working platform into an average submission.*

### K1 — A reader can understand the system without us in the room
**P1** · Owner: **Lead** / all

As a **client**, I want a technical report covering the architecture, the evaluation results, the limitations and the known failure cases, because I have to maintain this platform after the team disperses.

**Acceptance criteria**
- Covers architecture, the evaluation results from Epic I, limitations, and failure cases we know about and did not fix.
- States what was consciously deferred and why — including which of the 29 defects were left, with justification.
- Written progressively across the project, not assembled in the final week.

**Related issues**
- No open defects — but the deferred-defect record is what closes out `issues.md` honestly; any of the 29 not fixed by a story above needs an explicit, argued decision rather than silence.

### K2 — Each of us can defend our own design decisions
**P1** · Owner: **all**

As a **team member**, I want my significant design and technical decisions recorded with the alternatives I considered, because Arc has said explicitly that I will be asked to walk through my reasoning, and reconstructing it at the end is neither honest nor convincing.

**Acceptance criteria**
- Each member keeps a decision record covering their significant choices, the alternatives, and why they chose as they did.
- Records are written when the decision is made, not retrospectively.
- Where an AI tool was used, the member can still explain and defend the result independently of it.

**Related issues**
- No open defects — this is a stated project requirement, and the brief is blunt that an agent-authored rewrite "needs the same prior justification as a hand-written one."

### K3 — What didn't work is recorded as carefully as what did
**P1** · Owner: **GOV**

As a **client**, I want the findings documentation to include what we tried that failed and why, because negative findings tell me more about this platform's real limits than a list of features that worked.

**Acceptance criteria**
- Findings record what was tried, what worked, what failed, and why.
- Negative results from the evaluation casebook are reported, not filtered out.
- Results are traceable to specific cases in **I2** so a reader can re-run them.

**Related issues**
- No open defects — the brief states plainly that "negative findings carry equal weight."

### K4 — The end-to-end demonstration works when it matters
**P0** · Owner: **Lead** / all

As a **client**, I want to watch the full journey run end-to-end on realistic data, because that demonstration is where I find out whether the platform is genuinely finished or merely feature-complete on paper.

**Acceptance criteria**
- One canonical demo dataset and a fixed sequence of roles are agreed and frozen ahead of time.
- The full journey runs: project → policy → task → items → AI first pass → review → cross-validation → dispute → adjudication → release.
- The run is rehearsed against a clean environment (**A3**) before it is performed.
- A recorded fallback exists in case the live run fails.

**Related issues**
- No open defects — but our own risk register lists "demo failure despite working components" as Risk 11, with exactly these mitigations. This story is that mitigation made someone's explicit responsibility.

---

## 5. Definition of Done

A story is not done when the feature appears to work. For every story above:

- The behaviour in the acceptance criteria is demonstrable in the running application, not just at the API.
- New workflow logic ships with automated tests in the same change — the proposal commits to "automated test coverage for the corrected and newly-implemented workflow logic," and the inherited codebase is what a team without this rule produces.
- Any defect listed under *Related issues* has a test that fails against the old behaviour.
- Documents that describe changed behaviour (states, contracts, API surfaces) are updated in the same change, per **A5**.
- The change has been reviewed and approved by someone other than its author (**A1**).

---

## 6. Issue Coverage Map

Every defect in `plans/issues.md` mapped to the story that closes it. Priority order in `issues.md` is preserved in the numbering.

| # | Issue | Severity | Closed by |
|---|---|---|---|
| 1 | Live API key hardcoded in committed source | Medium | **A4** |
| 2 | Finalised annotation can be silently overwritten | Critical | **D5** |
| 3 | Reviewers can be shown the wrong annotator's work | High | **D4** |
| 4 | Finalised item can export conflicting answers | Critical | **H4** (with **F3**) |
| 5 | Reviewer corrections aren't saved | Critical | **D3** (with **F3**) |
| 6 | Drafts have no ownership enforcement | Critical | **D6** |
| 7 | Annotators can approve their own work | Critical | **D1** (generalised by **G1**) |
| 8 | Legacy review API can rewrite approval history | Critical | **D2** |
| 9 | Cross-project/cross-org write bypass | High | **G3** |
| 10 | Invalid status values saved to the database | High | **G4** |
| 11 | Draft submission not atomic; draft–annotation link never saved | High | **D5** (with **D4**) |
| 12 | Frontend fails typecheck | High | **A2** |
| 13 | Frontend test suite failing | High | **A2** |
| 14 | Backend export tests fail to run | High | **H5** |
| 15 | Dispute "send back to annotator" not implemented | High | **E2** |
| 16 | Dataset registration isn't transactional | High | **B5** |
| 17 | Organisation invitations completely broken | High | **G5** (surfaced by **J3**) |
| 18 | Pending-invitation listing unreachable | High | **G5** (surfaced by **J3**) |
| 19 | Completion and export readiness disagree on "done" | High | **B6** + **H5** |
| 20 | AI failures produce fake annotations | High | **C3** |
| 21 | Audit log always shows "user" as actor | Medium | **F4** |
| 22 | Escalation entries duplicate their summary | Medium | **F4** |
| 23 | Backend `.env` config silently broken | Medium | **A3** |
| 24 | `init_data.py --reset` broken two ways | High | **A3** |
| 25 | Frontend test doesn't test what it claims | Low | **A2** |
| 26 | Backend test has misleading setup | Low | **A2** |
| 27 | Export-eligibility list names an impossible status | Low | **B6** + **H5** |
| 28 | Task can never leave `draft` | High | **B4** |
| 29 | Lifecycle conflicts reported as server errors | Medium | **B5** |

**Sequencing note.** `issues.md` recommends rotating the committed key first (**A4**, independent of all code work), then protecting authoritative data (**D3**, **D4**, **D5**), then restoring multi-user governance (**D1**, **D6**), then closing the legacy review path (**D2**). That order is consistent with the P0 stories above and with the client's direction that defect work stays attached to the feature it blocks. Two items — **B4** (issue 28) and **D4** (issue 3) — need a product decision from the client before implementation, and should be raised at a weekly meeting rather than decided by the team alone.

---

## 7. Deliberately Deferred

Not stories in this backlog, and not to be added without re-scoping with the client: real (non-mock) model integration or fine-tuning; image and video as committed demo paths; a generic workflow engine or universal ontology; formal compliance claims; and any marketplace, trust, billing or payout capability.
