# Hej Delivery Backlog

**CS-57 · Client: Hunter Xu (Arc Intelligence)**

Current state exported 2026-09-13 from story_src.csv. 59 stories, covering all 29 defects in `plans/issues.md`.

| Completed | Working | Discarded | Not started |
| --- | --- | --- | --- |
| 5 | 13 | 6 | 35 |

## Where the platform stands today

| Pillar | Gap |
| --- | --- |
| **Govern** | Roles are labels. Nothing checks them on any action. No guideline versioning. |
| **Assist** | One hardcoded AI call, run synchronously. No queue. On failure it invents fake annotations. |
| **Record** | Generic activity log only. Reviewer corrections are thrown away. |
| **Adjudicate** | Finalised results can be silently overwritten. Two review APIs disagree. Can't tell whose work you're reviewing. |
| **Release** | “Export” is a status label computed on the fly. No manifest, no immutability, no gate. |
| **Evaluate** | Doesn't exist. |
| **Plus** | No task queue, no work assignment, 7 screens still on mock data. |

## Epics

| Epic | Stories | Completed |
| --- | --- | --- |
| A — Trustworthy Foundations | 5 | 3 |
| B — Setting Up Work | 6 | 2 |
| C — AI-Assisted First Pass | 5 | 0 |
| D — Review & Cross-Validation | 8 | 0 |
| E — Disagreement & Dispute | 6 | 0 |
| F — Provenance & History | 5 | 0 |
| G — Roles, Permissions & Organisations | 5 | 0 |
| H — Release & Export | 6 | 0 |
| I — Evaluation | 5 | 0 |
| J — Organisations & Dashboard | 4 | 0 |
| K — Evidence & Handover | 4 | 0 |

## Board coverage

| Ticket | Name | Stories |
| --- | --- | --- |
| **SCRUM-1** | Task queue: Create AI batch job and per-item job status models | C2 |
| **SCRUM-2** | Task queue: Execute task annotation asynchronously through a worker | C2 |
| **SCRUM-3** | Task queue: Retry failed items and preserve permanent failures | C2 |
| **SCRUM-5** | Task queue: Display batch progress and per-item job status | C2 |
| **SCRUM-6** | AI-Provider: Integrate labeling_ai_assistnat_mvp as an AI provider | C1 |
| **SCRUM-7** | AI-Provider: Stop generating fake annotations when the AI provider fails | C3 |
| **SCRUM-8** | Organisation management:  Invitation & acceptance | G5 |
| **SCRUM-20** | Project & Policy: Configure project review and annotation policies | B2 |
| **SCRUM-21** | Task Lifecycle: Prevent cross-project task and task-item writes | G3 |
| **SCRUM-22** | Task Lifecycle: Validate task-item status before database commit | G4 |
| **SCRUM-23** | Task Lifecycle: Preserve lifecycle conflict responses as HTTP 409 | B5 |
| **SCRUM-24** | Task Lifecycle: Implement valid task lifecycle transitions | B4 |
| **SCRUM-25** | Annotation: Enforce draft ownership | D6 |
| **SCRUM-26** | Annotation: Make draft submission and annotation creation atomic | D5 |
| **SCRUM-27** | Review / Annotation: Reviewer should be able to select the correct submitted annotation | D4 |
| **SCRUM-28** | Annotation: Preventing finalized annotations from being overwritten | D5 |
| **SCRUM-29** | Review: Retire or restrict legacy review mutation endpoints | D2 |
| **SCRUM-30** | AI-Provider: Store & Display AI suggestions, failures and unavailable states | C3 |
| **SCRUM-31** | Review: Record verdict, feedback & justification | C5 |
| **SCRUM-32** | Review: Persist reviewer corrections as structured data | D3 |
| **SCRUM-34** | Task Lifecycle: Make dataset registration transactional | B5 |
| **SCRUM-35** | Dispute / Annotation: Implement "Dispute & send back to annotator" | E2 |
| **SCRUM-36** | Dispute: Basic Functionality | E1, E3, E4, E5, E6 _(split it)_ |
| **SCRUM-37** | Provenance: Guarantee one canonical answer per task item | H4 |
| **SCRUM-38** | Provenance: Preserve AI, annotator, reviewer and adjudicator outputs separately | F3 |
| **SCRUM-39** | Provenance: Item-level provenance timeline | F1, F5 |
| **SCRUM-40** | Provenance: Record correct audit actor types | F4 |
| **SCRUM-41** | Provenance: Remove duplicate escalation audit changes | F4 |
| **SCRUM-42** | Release & Export: Basic functionality | H1, H2, H3, H6 _(split it)_ |
| **SCRUM-43** | Release & Export: Align task completion and export readiness | B6, H5 |
| **SCRUM-44** | Organisation Management: Users can only perform actions that are permitted by their roles. | G1 |
| **SCRUM-45** | Project lifecycle: Update and archive a project | J4 |
| **SCRUM-46** | Task queue: Trigger an AI run and route completed items to review | C2 |
| **SCRUM-47** | Annotation: Connect the existing text annotation page to live APIs | — |
| **SCRUM-48** | Review: Assign or claim work and provide role queues | D8 |
| **SCRUM-49** | Review: Execute accept, adjust, reject and dispute transitions | C5, D3, E1 _(split it)_ |
| **SCRUM-50** | Policy: Apply configured governance rules | B2, G2 |
| **SCRUM-51** | Review: Independent second reviewer | D7, E1 |
| **SCRUM-52** | Dispute: Adjudicator queue and authorization | D8, E3, E6, G1 _(split it)_ |
| **SCRUM-53** | Provenance: Source versioning | F2 |
| **SCRUM-68** | Evaluation1: Scenario harness that drives the workflow end to end | I1 |
| **SCRUM-69** | Evaluation2: Repeatable runs and regression reporting | I1 |
| **SCRUM-70** | Evaluation3: Casebook structure and the adversarial categories | I2 |
| **SCRUM-71** | Evaluation4: Grow the casebook to 40–60 cases | I2 |
| **SCRUM-72** | Evaluation5: Reviewer agreement and AI suggestion quality | I3 |
| **SCRUM-73** | Evaluation6: Measure what AI assistance does to human judgement | I4 |
| **SCRUM-74** | Evaluation7: Integrity checks on provenance, roles and releases | I5 |
| **SCRUM-75** | Evaluation8: Findings record including negative results | I5 |
| **SCRUM-81** | Schema: Fix db setup issues | A3 |
| **SCRUM-82** | Schema: Restore existing testcases | A2 |
| **SCRUM-84** | Schema: Replace hardcoded credentials | A4 |
| **SCRUM-85** | Task lifecycle: Create annotation and judgement tasks with a result shape | B3 |
| **SCRUM-86** | Review: Prevent self-review of own annotations | D1 |
| **SCRUM-87** | Annotation: Configurable AI suggestion visibility | C4 |
| **SCRUM-88** | Organisation Management: Stable organisation identifier and URL | J1 |
| **SCRUM-89** | Project: Overview of status and progress | J2 |
| **SCRUM-90** | Organisation Management: Invite, remove and role-manage members | J3 |
| **SCRUM-91** | Project lifecycle: Create a project scoped to an organisation | B1 |

Stories with no ticket yet: A1, A5, K1, K2, K3, K4 — descriptions are in docs/task.md, section 3.

---

## Epic A — Trustworthy Foundations

*Do these first. Nothing else is safe or demonstrable until they hold.*

### A1 — Changes are reviewed before they reach the platform

**P0** · Owner: **Lead** · Status: ✕ Discarded

As a project manager, I want every change to the platform to be reviewed by a second person before it goes live, because the previous team's uncoordinated changes overwrote each other and I need to trust that what I'm demonstrating is what was agreed.

**Acceptance criteria**
1. No change reaches the main branch without an approving review from someone other than its author.
2. Every change is traceable to the user story it implements.
3. Automated checks must pass before a change can be merged.

**Subtasks**
1. [ ] Protect `main`: require one approving review from someone other than the author, and passing checks, before merge.
2. [ ] Add a PR template carrying the story id, the defect it closes, and how it was verified.
3. [ ] Add a CI workflow running backend pytest plus frontend typecheck and tests on every pull request.
4. [ ] Agree a branch naming convention (story/D3-reviewer-corrections) and write it into docs/team-discipline/dev-workflow.md.
5. [ ] Set a review rota so no pull request sits waiting on one person.

**Related issues**
- No open defects — this is the process control that stops new defects of the kind catalogued in issues.md from re-entering, which the client asked for by name at the status meeting.

### A2 — I can trust that a fix in one place hasn't broken another

**P0** · Owner: **SC** · Ticket: **SCRUM-82** · Status: ✓ Completed · Allocated to: Hanchen Wang

As a client, I want the platform's automated checks to genuinely pass before anything ships, because otherwise a change to the review screen can silently break annotation and nobody finds out until the demo.

**Acceptance criteria**
1. The web application's checks and test suite pass cleanly, so a broken change is caught before merge rather than after.
2. Tests that claim to check something actually check it — a test named for image-annotation loading must fail if that loading breaks.
3. Test setup does not imply behaviour the platform doesn't have.

**Subtasks**
1. [ ] Run `npm run typecheck` in apps/hej-web and fix the TaskItemTable prop mismatch and the missing judgementSignal field (issue 12).
2. [ ] Run `npm test` in apps/hej-web and fix the annotate-payload test that has drifted from its component (issue 13).
3. [ ] Replace the placeholder assertion in the image-annotation "hydrates from draft" test so it fails when hydration breaks (issue 25).
4. [ ] Delete the unused mock wiring in the admin-IAM backend test that implies a DB lookup the code never makes (issue 26).
5. [ ] Wire both suites into the A1 CI workflow so a red build blocks merge.

**Related issues**
- **Issues 12 & 13** (frontend fails typecheck; test suite failing) — this story's definition of done is a green frontend build and suite, so both are resolved by the work itself rather than tracked separately.
- **Issue 25** (a frontend test passes even when the behaviour it names is broken) — replacing the placeholder assertion with a real one is exactly what “tests genuinely pass” requires here.
- **Issue 26** (misleading mock setup in a backend test) — removed while making the suite trustworthy, so a future reader isn't misled about what the code does.

### A3 — I can get a working copy of the platform running by myself

**P0** · Owner: **SC** · Ticket: **SCRUM-81** · Status: ✓ Completed · Allocated to: Yi Geng

As a team member, I should be able to set up and reset a working local copy of the platform with seeded demo accounts in one step, because I can't contribute to or demonstrate a system I can't start.

**Acceptance criteria**
1. Following the documented setup steps produces a running platform with the seeded Admin, Reviewer and Annotator accounts.
2. Resetting the demo data works repeatedly, including against an already-seeded database.
3. Configuration supplied by a team member (ports, keys, environment) is actually picked up by the platform.
4. A setup failure reports what went wrong instead of failing silently or crashing while reporting.

**Subtasks**
1. [ ] Fix the console-encoding crash in init_data.py --reset on a stock Windows terminal, including the error handler that crashes while reporting it (issue 24).
2. [ ] Drop tables in foreign-key-safe order so --reset works repeatedly against an already-seeded database instead of half-dropping the schema (issue 24).
3. [ ] Add env_file to model_config in app/core/config.py:19 so a .env file is actually read (issue 23).
4. [ ] Correct apps/hej-api/.env.example from the DAP_ prefix to HEJ_, which is what Settings expects (issue 23).
5. [ ] Write the setup path in the README and have a second person follow it from a clean clone to seeded Admin, Reviewer and Annotator accounts.

**Related issues**
- **Issue 24** (init_data.py --reset broken two ways) — the story requires reset to work repeatedly on a stock Windows terminal, which closes both the console-encoding crash and the foreign-key failure that currently leaves the database half-dropped.
- **Issue 23** (.env config silently ignored) — “configuration is actually picked up” is the acceptance criterion, so the wrong-prefix and never-read-the-file defects both have to go for this story to pass.

### A4 — Platform credentials aren't sitting in shared code

**P0** · Owner: **SC** · Ticket: **SCRUM-84** · Status: ✓ Completed · Allocated to: Yi Geng

As an organisation administrator, I want the platform's service credentials kept out of the shared codebase, because a key that ships inside every copy of the code is a key I can't control, revoke or attribute.

**Acceptance criteria**
1. No live credential is readable in the source code.
2. Credentials are supplied per environment and can be rotated without a code change.
3. The exposed key is rotated at the provider, not merely removed from the code.

**Subtasks**
1. [ ] Rotate the committed Gemini key at the provider — it is public in every existing clone and fork (issue 1).
2. [ ] Remove the key default from gemini_api_key in app/core/config.py:15 so a missing key fails loudly (issue 1).
3. [ ] Confirm the key is read from the environment only, and that the app starts with a clear error when it is absent.
4. [ ] Add the key names to .env.example with placeholder values and a note on where the real key lives.
5. [ ] Sequence after A3 — configuration has to load before a key can be supplied any other way.

**Related issues**
- **Issue 1** (live API key hardcoded in committed source) — this story's first criterion removes it, and the rotation criterion covers the part a code fix alone can't: the key is already public in every existing clone. Depends on **A3**, since configuration must actually load before a key can be supplied any other way.

### A5 — A status means the same thing wherever I see it

**P0** · Owner: **SC** · Status: ✕ Discarded

As a project manager, I want a status, role or result to mean one thing across every screen, the API and the export, because the same item currently has different state names in different places and I can't tell whether two screens disagree because of a bug or because they're using different words for the same thing.

**Acceptance criteria**
1. One agreed set of task states and one agreed set of item states, used by the screens, the API and the export alike.
2. Where our design documents and the running code currently disagree, the difference is resolved deliberately and the documents updated to match what was built.
3. A state a user can see is a state the workflow can actually reach.
4. The frontend–backend contract and the AI-assistant contract are written down and reviewed before the workflow work in Epics C–H begins.

**Subtasks**
1. [ ] Write docs/contracts/lifecycle.md: the authoritative task and task-item status sets, and the legal transitions between them.
2. [ ] Resolve the drift — docs/design says draft/active/paused/completed/archived and FINALIZED; the code says draft/ready/in_review/disputed/completed and canonicalized.
3. [ ] Split the writing by surface — one owner per contract file under docs/contracts/ — covering request and response shape, legal enum values and error codes.
4. [ ] Consolidate the contract files into docs/contracts/integration-gaps.md — this is the W6 milestone artefact.
5. [ ] Add a schema test that fails when the backend enum and the frontend lib/api/status-mapping.ts drift apart.
6. [ ] Update docs/design and docs/terminology to match what was agreed, in the same change.

**Related issues**
- No open defects catalogued — but this is the third of the four objectives agreed with the client, and the drift is real: our design documents describe task states draft/active/paused/completed/archived and a FINALIZED item state, while the code implements draft/ready/in_review/disputed/completed and canonicalized. Our own risk register lists this drift as Risk 4 and Risk 10.
- Sequenced first because **B4**, **B6**, **G4** and **H5** all resolve disagreements between screens, and doing that three separate times against three different vocabularies is how the disagreement returns.

> **A5 matters more than it looks.** Docs say draft/active/paused/completed/archived; code says draft/ready/in_review/disputed/completed. Four later stories fix screen disagreements — doing that against three vocabularies means it comes back.

## Epic B — Setting Up Work

*Project → policy → task → items. The client's own critical path starts here.*

### B1 — I can create a project to hold related work

**P0** · Owner: **BE/FE** · Ticket: **SCRUM-91** · Status: ✓ Completed

As a project manager, I want to create a project with a name, description and objective inside my organisation, because my work comes in programmes — the client's own example is an “Autonomous Driving” project holding several different annotation and evaluation tasks.

**Acceptance criteria**
1. I can create a project and see it listed in my organisation.
2. A project belongs to exactly one organisation and is visible only to that organisation's members.
3. I can open a project and see the tasks inside it.

**Subtasks**
1. [ ] Confirm POST /organizations/{org_id}/projects scopes the new project to the caller's organisation.
2. [ ] Confirm the projects list shows only projects in the caller's organisation.
3. [ ] Add a test that a project created in org A is invisible to a member of org B.
4. [ ] Check project-create-form.tsx surfaces the API's validation errors rather than a generic failure.

**Related issues**
- No open defects — the capability exists and works; it is listed because the workflow depends on it and because **J4** later extends it with lifecycle operations.

### B2 — I can decide how carefully my project's work gets reviewed

**P0** · Owner: **BE** · Ticket: **SCRUM-20, SCRUM-50**

As a project manager, I want to set how many reviewers an item needs, how many review rounds run, and what share of items get independently double-checked, because a low-risk labelling job and a safety-critical judgement task shouldn't be governed identically.

**Acceptance criteria**
1. When creating a project or task I can set: the number of approvals required, the proportion of items requiring independent cross-review (the client's example: 30%), and what happens when reviewers disagree.
2. The settings I choose are visible on the project afterwards and can be corrected before work starts.
3. The workflow actually behaves according to what I set — this is not a label recorded and ignored.

**Subtasks**
1. [ ] Add the policy fields a manager sets: approvals required, cross-review percentage, and what happens when reviewers disagree.
2. [ ] Put them on the project and task setup forms, with the client's 30% cross-review as the worked example.
3. [ ] Show the policy in force on the project afterwards, correctable until the first task goes active.
4. [ ] Freeze the resolved policy against the task so a later policy change cannot rewrite finished work.
5. [ ] Stop at recording the choice faithfully — enforcement is G2.

**Related issues**
- No open defects — policy settings partially exist in the data model, but nothing enforces them. Enforcement is **G2**.

### B3 — I can create a task for a specific piece of work

**P0** · Owner: **BE/FE** · Ticket: **SCRUM-85** · Status: ✓ Completed

As a project manager, I want to create a task stating whether it is an annotation task or a judgement task and what kind of data it covers, because the client's two task categories need different work surfaces and different result shapes.

**Acceptance criteria**
1. I can create a task under a project, choosing annotation or judgement and the task type.
2. The task records what a finished result should look like (labels for annotation, verdict plus reasoning for judgement).
3. Text tasks are fully workable end-to-end; image and video tasks can be created without breaking, but are not committed demo paths in this phase.

**Subtasks**
1. [ ] Add the annotation-versus-judgement distinction to TaskCreate and the task form.
2. [ ] Resolve label_schema_ref into an actual result shape — today it is a string pointer nothing reads.
3. [ ] Record what a finished result looks like: labels for annotation, verdict plus reasoning for judgement.
4. [ ] Borrow the merged-schema idea from the MVP's SchemaMerger, but map fields explicitly rather than asking a model to infer them.
5. [ ] Keep image and audio task creation working without breaking; text is the committed demo path.
6. [ ] Add a test that a judgement task rejects a result with no verdict.

**Related issues**
- No open defects — task creation exists; what's missing is the lifecycle (**B4**) and the schema/policy binding that makes it meaningful.

### B4 — My task moves through real states, not just “draft”

**P0** · Owner: **BE** · Ticket: **SCRUM-24**

As a project manager, I want to start a task, pause it and complete it, because right now a task stays a draft forever — which means the item list is never closed and I can never tell from the outside whether work is in progress.

**Acceptance criteria**
1. I can move a task from draft into active work, and from active into complete.
2. Once a task is active, new items can no longer be quietly added to it mid-review.
3. The state shown on the project screen, the task screen and the export list agree with each other.

**Subtasks**
1. [ ] Raise the intended lifecycle path and who may trigger each step with the client — issues.md flags this as a product decision.
2. [ ] Add status to TaskUpdate in app/schemas/tasks.py:61 — the field is absent, which is why a task can never leave draft (issue 28).
3. [ ] Add an activation endpoint and implement the transition table agreed in A5.
4. [ ] Close dataset intake once a task is active so items cannot be added mid-review.
5. [ ] Wire Activate / Pause / Complete into the task page, disabled with a reason when the transition is illegal.
6. [ ] Check the state agrees across the project screen, the task screen and the export list.

**Related issues**
- **Issue 28** (a task can never leave draft, so intake never closes) — the story's whole point is the missing activation step; adding it also makes the in_review / ready / disputed states reachable, which the export dashboard is already built around but can never currently display. issues.md flags this as needing a product decision first, so this story includes agreeing the intended path with the client.

### B5 — Loading a dataset either works or leaves nothing behind

**P0** · Owner: **BE** · Ticket: **SCRUM-23, SCRUM-34** · Status: ○ Working · Allocated to: Kanishka Kathait

As a project manager, I want registering a batch of items to either fully succeed or fully fail, because a batch that half-loaded leaves me with a task I can't trust and no way to tell which items are real.

**Acceptance criteria**
1. If item registration fails partway, no partial items, pointers or drafts remain.
2. I can load a task with hundreds or thousands of items — the client's example is 1,000 video recordings under one task.
3. If I try to load items at a point in the workflow that doesn't allow it, I'm told that clearly (“intake is closed for this task”), not shown a generic server error.

**Subtasks**
1. [ ] Wrap register_dataset (app/services/task_service.py:403) so pointers, items and drafts commit together or not at all (issue 16).
2. [ ] Stop the blanket except in the registration route turning the deliberate 409 into a 500 (issue 29).
3. [ ] Render "intake is closed for this task" on the dataset panel instead of a generic server error.
4. [ ] Move the per-item AI call out of the intake path — it runs synchronously inside registration today (see C2).
5. [ ] Test that a mid-batch failure leaves no partial pointers, items or drafts behind.
6. [ ] Load one of the 200-item fixture sets from labeling_ai_assistnat_mvp/app/data/text/ end to end.

**Related issues**
- **Issue 16** (dataset registration isn't transactional) — “leaves nothing behind on failure” is precisely the missing all-or-nothing behaviour, so implementing this story removes the partial-state cleanup problem.
- **Issue 29** (lifecycle conflicts reported as server errors) — the clear-message criterion requires the deliberate “intake closed” response to survive instead of being converted into a 500.

### B6 — “Done” means the same thing everywhere I look

**P1** · Owner: **BE** · Ticket: **SCRUM-43**

As a project manager, I want a completed task to report the same progress on every screen, because a task marked complete that reports zero finished items destroys my confidence in every other number the platform shows me.

**Acceptance criteria**
1. The rule for “this item is finished” is the same rule used by task completion and by the export list.
2. A completed task never shows a contradictory item count.
3. Status values shown to me correspond to states the workflow can actually reach.

**Subtasks**
1. [ ] Write one is_item_finished() predicate and use it for both task completion and export eligibility.
2. [ ] Reconcile task_service.py:82 (accepts reviewed, approved and canonicalized) with project_exports_service.py:55 (counts only canonicalized) (issue 19).
3. [ ] Remove "approved" from FINALIZED_EXPORTABLE_TASK_ITEM_STATUSES at task_service.py:83 — it is not a member of the status enum (issue 27).
4. [ ] Add a test that a task marked complete never reports zero completed items in its export package.

**Related issues**
- **Issue 19** (task completion and export readiness disagree on “done”) — the story cannot pass while two different definitions exist, so the two rules must be unified into one.
- **Issue 27** (export-eligibility list names an impossible “approved” status) — cleaned up in the same change, since the story requires the states shown to be states that can genuinely occur.

## Epic C — AI-Assisted First Pass

*The client's stated #1 engineering gap: the connective layer between platform, queue and AI.*

### C1 — The AI assistant can be swapped without disrupting my work

**P1** · Owner: **BE** · Ticket: **SCRUM-6** · Status: ○ Working · Allocated to: Yi Geng

As a project manager, I want the platform's AI assistant to be replaceable, because the client intends to move from a mock to open-source or self-hosted models later and I don't want the workflow rebuilt when that happens.

**Acceptance criteria**
1. The mock AI assistant can be replaced with a different one without changing any review, dispute or export behaviour.
2. Which assistant and version produced a suggestion is recorded against the item.
3. Everything downstream treats an AI suggestion as a suggestion, never as a finished answer.

**Subtasks**
1. [ ] Define an AnnotationAssistant protocol, with MockAssistant as the default and GeminiPreannotator moved behind it.
2. [ ] Adopt the MVP's candidate envelope as the return type: payload_schema_version, model_version, and candidates carrying task_item_id plus candidate_output.
3. [ ] Replace the hand-rolled urllib call to Gemini with an OpenAI-compatible client so a local Ollama model and a hosted provider share one path.
4. [ ] Record provider, model and version against every suggestion, and keep the registry in one place — the MVP duplicates it four times.
5. [ ] Port TextAnalyzer's four text tasks from labeling_ai_assistnat_mvp, dropping its LLM-inferred field mapping and its writing of results to files.
6. [ ] Check nothing downstream treats a suggestion as a finished answer.

**Related issues**
- No open defects — this is net-new capability the brief calls for (“a replaceable, typed model interface, with mock and live modes interchangeable”).

### C2 — A large batch of items gets AI-annotated reliably

**P0** · Owner: **BE** · Ticket: **SCRUM-1, SCRUM-2, SCRUM-3, SCRUM-5, SCRUM-46**

As a project manager, I want to request AI annotation across a whole task and have it complete reliably in the background, because with a thousand items I can't sit and wait, and one failed item must not sink the batch.

**Acceptance criteria**
1. I can trigger AI annotation for a task and keep working while it runs.
2. Temporary failures are retried automatically; items that permanently fail are shown to me as failed rather than dropped.
3. I can see how much of the batch is done, in progress or stuck.

**Subtasks**
1. [ ] Choose the queue — a DB-backed job table with a worker loop, or a broker — and write the decision down.
2. [ ] Add a job table carrying attempt count, last error and a terminal state.
3. [ ] Move the assist call out of task_service.py:445, where it runs synchronously inside dataset registration.
4. [ ] Retry transient failures with backoff; send permanent failures to a dead-letter state that stays visible rather than dropped.
5. [ ] Expose batch progress per task: done, in flight, failed.
6. [ ] Prove it on a 1,000-item batch — one failed item must not sink the run. Do not copy the MVP's TaskRunner, which prints the error and drops the item.

**Related issues**
- No open defects — net-new. The client raised this as the central engineering requirement (retries, failed jobs, dead-letter handling, “a classic distributed system problem”), and there is currently no queue of any kind.

### C3 — I'm told when the AI failed instead of being shown a fake answer

**P0** · Owner: **BE** · Ticket: **SCRUM-7, SCRUM-30** · Status: ○ Working · Allocated to: Michael Max

As a reviewer, I want to know when the AI step failed or was switched off, because a fabricated suggestion I mistake for a real one is worse than no suggestion at all.

**Acceptance criteria**
1. If the AI step fails or is disabled, the item is clearly marked as having no AI suggestion — the platform never invents one.
2. Where an AI result was incomplete, what was actually returned is shown as-is rather than padded out.
3. The distinction between “AI said this” and “no AI result available” is visible on the review screen.

**Subtasks**
1. [ ] Delete the fabricated bounding boxes from _empty_result at gemini_preannotator.py:233 (issue 20).
2. [ ] Delete _ensure_min_image_boxes at gemini_preannotator.py:273, which pads real results with invented ones (issue 20).
3. [ ] Return a failed assist outcome carrying no annotation, so a failure can never be stored as an ordinary draft.
4. [ ] Treat an unparseable model response as a failure, not as a candidate with a placeholder verdict.
5. [ ] Show "no AI suggestion" as distinct from "the AI suggested this" on the review screen.
6. [ ] Test that a failing assist leaves the item with no AI draft at all.

**Related issues**
- **Issue 20** (AI failures produce fake annotations disguised as real ones) — the platform currently fabricates fixed bounding boxes on failure and pads short results with more of them, stored as an ordinary draft. This story's first two criteria make that behaviour impossible to keep.

### C4 — I can control whether reviewers see the AI's answer first

**P1** · Owner: **BE/FE** · Ticket: **SCRUM-87**

As a project manager, I want to choose whether a task shows the AI suggestion up front, hides it until the human has committed, or runs human-only, because seeing the machine's answer first changes the answer people give.

**Acceptance criteria**
1. I can select human-only, AI-first, or blind-then-reveal when setting up a task.
2. In blind-then-reveal, the reviewer cannot see the AI suggestion until their own answer is recorded.
3. Which mode was in force is recorded against the item, so results from different modes can be compared later (see I4).

**Subtasks**
1. [ ] Add human-only, AI-first and blind-then-reveal to task setup — the code has two modes, the brief requires three.
2. [ ] Hold the suggestion back in blind-then-reveal until the human's own answer is recorded.
3. [ ] Record the mode in force against each item so results from different modes can be compared later (see I4).
4. [ ] Test that the suggestion is absent from the API response before the human commits, not merely hidden in the UI.

**Related issues**
- No open defects — net-new, and worth flagging as a gap between our own documents: the inherited design describes only two modes, while the client brief requires three. Neither is implemented today.

### C5 — I can record why I decided, not just what I decided

**P1** · Owner: **BE/FE** · Ticket: **SCRUM-31, SCRUM-49** · Status: ○ Working · Allocated to: Parth

As a reviewer working on a judgement task, I want to record my reasoning alongside my verdict, because the client's stated purpose for collecting human judgement is capturing how people reason — not harvesting yes/no answers.

**Acceptance criteria**
1. Judgement tasks capture a structured justification alongside the verdict, not an optional comment box.
2. My reasoning is retrievable later, attached to the item and distinct from the verdict itself.
3. Reasoning is carried into the export with the decision it explains.

**Subtasks**
1. [ ] Add a structured rationale alongside verdict on judgement results — required, not an optional comment box.
2. [ ] Wire the field into the annotate workspace; task-item-workspace-sheet.tsx:997 already destructures the judgement fields.
3. [ ] Keep the reasoning retrievable separately from the verdict it explains.
4. [ ] Carry reasoning into the export alongside the decision.
5. [ ] Settle with the client whether justification is required on accept, or only on reject, modify and dispute.

**Related issues**
- No open defects — net-new. Client examples of what this must capture: why an AI answer is wrong, why one answer is preferred, how a person broke the problem down.

## Epic D — Review & Cross-Validation

*Highest-severity defects live here — two are named in the client's own brief.*

### D1 — I can't approve my own work

**P0** · Owner: **BE** · Ticket: **SCRUM-86** · Status: ○ Working

As a reviewer, I should not be able to approve an item I annotated myself, because a review that one person can perform on their own work is not a review, and any dataset built on it is indefensible.

**Acceptance criteria**
1. Attempting to review my own annotation is refused, with a clear explanation.
2. Only users holding a reviewer or expert role can perform review actions at all.
3. The same restriction applies to dispute decisions, not just first-line review.

**Subtasks**
1. [ ] Refuse a review when the reviewer created the annotation under review — review_actions.py:206 checks organisation access only (issue 7).
2. [ ] Require a reviewer or expert capability to call the review endpoint at all.
3. [ ] Apply the same restriction to dispute decisions, not only first-line review.
4. [ ] Return a refusal that explains why, rather than a bare 403.
5. [ ] Test that an annotator cannot approve their own item and that a reviewer can.

**Related issues**
- **Issue 7** (annotators can approve their own work) — the review endpoint currently checks only that you belong to the organisation. This story's first two criteria are exactly the two missing checks, so the defect closes as the story lands.

### D2 — Approval history can't be rewritten behind my back

**P0** · Owner: **BE** · Ticket: **SCRUM-29** · Allocated to: Jingwei Lin

As a project manager, I want an approval decision to be permanent and consistent with the item's actual state, because if an approval can be flipped or deleted afterwards, the record of who signed off on what is worthless.

**Acceptance criteria**
1. There is one way to record a review decision, and it always moves the item's state with it.
2. An existing approval cannot be edited or deleted into a different outcome by an ordinary member.
3. Item state and review history always agree with each other.

**Subtasks**
1. [ ] Retire or lock the legacy review-mutation endpoints at annotations.py:319, :364 and :426 (issue 8).
2. [ ] Make the review-action path the only way to record a decision, and have it always move item status with it.
3. [ ] Refuse edits and deletions of an existing review by an ordinary member.
4. [ ] Test that item state and review history cannot diverge.

**Related issues**
- **Issue 8** (a second, legacy review API can rewrite approval history) — an older set of endpoints lets any organisation member change or delete a review without touching item status. The “one way to record a decision” criterion requires retiring or locking down that path, which is the fix.

### D3 — The correction I make is the answer that gets saved

**P0** · Owner: **BE** · Ticket: **SCRUM-32, SCRUM-49**

As a reviewer, when I correct an annotation I want my corrected value to become the stored answer, because at the moment I can correct an item, watch it finalise, and my correction is nowhere in the result.

**Acceptance criteria**
1. A corrected value submitted with a review replaces the stored answer for that item.
2. Re-opening the item afterwards shows my correction, not the original.
3. The exported dataset carries the corrected value.
4. The original annotation is still visible in the item's history — corrected, not erased.

**Subtasks**
1. [ ] Stop truncating final_payload into review_notes at review_actions.py:235 (issue 5).
2. [ ] Create a superseding annotation version carrying the corrected value.
3. [ ] Show the correction, not the original, when the item is reopened.
4. [ ] Carry the corrected value into the exported dataset.
5. [ ] Keep the original annotation visible in history — corrected, not erased (with F3).
6. [ ] Blocked until the client says who authors a reviewer's correction.

**Related issues**
- **Issue 5** (reviewer corrections aren't actually saved) — corrections are currently appended as truncated text to a notes field while the item advances anyway. Criteria 1–3 are unimplementable without fixing this; criterion 4 keeps the fix consistent with the provenance requirement in **F3**.

### D4 — I know I'm reviewing the right person's work

**P0** · Owner: **BE** · Ticket: **SCRUM-27**

As a reviewer, I want certainty that the annotation in front of me belongs to the annotator it says it does, because on a double-annotated item the platform currently can't reliably tell, and I could approve or reject the wrong person's submission without any sign anything went wrong.

**Acceptance criteria**
1. Opening an item for review always shows a specific, identified annotator's submission.
2. On an item annotated by two people, both submissions are individually addressable — I never get an arbitrary one of the two.
3. My decision is recorded against the submission I actually looked at.

**Subtasks**
1. [ ] Settle with the client: one canonical annotation per item, or per-annotator submissions with an explicit canonical pick.
2. [ ] Replace the effectively random "latest annotation" pick with the defined choice (issue 3).
3. [ ] Make both submissions individually addressable on a double-annotated item.
4. [ ] Record the decision against the submission the reviewer actually opened — impossible while draft.annotation_id is never written, the same root cause as issue 11.
5. [ ] Test that a two-annotator item returns a specific, identified submission every time.

**Related issues**
- **Issue 3** (reviewers can get shown the wrong annotator's work) — the “which annotation is current” pick is effectively random on multi-annotator items. This story requires a defined answer, which is the fix; issues.md notes the choice between one canonical annotation per item and per-annotator submissions is a product decision to settle with the client first.
- **Issue 11** (draft submission isn't atomic and drafts don't link to their annotation) — the missing draft-to-annotation link is the same root cause reached from the other direction; restoring it is what makes criterion 3 possible.

### D5 — Finalised means finalised

**P0** · Owner: **BE** · Ticket: **SCRUM-26, SCRUM-28** · Status: ○ Working · Allocated to: Hanchen Wang

As a client, I want a finalised result to stay finalised unless someone deliberately reopens it, because a “locked” answer that a later submission can quietly change means no exported label can be defended.

**Acceptance criteria**
1. Submitting new work against a finalised item is refused, or explicitly reopens review — never silently applied.
2. Reopening a finalised item is a visible, attributable action.
3. A submission either completes fully or not at all — it never leaves an item half-updated.

**Subtasks**
1. [ ] Refuse a draft submission against a canonicalized item instead of updating the annotation row in place — draft_service.py:145 (issue 2).
2. [ ] Make submit_draft one transaction; draft status, the annotation and the item status are three separate commits today (issue 11).
3. [ ] Persist draft.annotation_id, which is declared on the model and never written (issue 11).
4. [ ] Make reopening a finalised item an explicit, attributed action rather than a side effect.
5. [ ] Test that a finalised item cannot be changed by a later submission.

**Related issues**
- **Issue 2** (a finalised annotation can be silently overwritten) — currently a new draft updates the same record in place with no check on whether the item is already finalised. Criterion 1 is the missing check.
- **Issue 11** (draft submission is not one transaction) — criterion 3 requires the three separate writes involved in submitting work to succeed or fail together.

### D6 — My unfinished work is mine

**P0** · Owner: **BE** · Ticket: **SCRUM-25** · Status: ○ Working · Allocated to: Hanchen Wang

As an annotator, I want my in-progress draft to be editable only by me, because right now anyone in the organisation can change, submit or delete my unfinished work — including submitting it before I'm ready.

**Acceptance criteria**
1. Only I can edit, delete or submit my own draft.
2. Someone else attempting it is refused, with a clear message.
3. An administrator or reviewer override, if we allow one, is explicit and recorded in the item's history.

**Subtasks**
1. [ ] Check draft ownership on update, delete and submit — drafts.py:177, :205 and :240, where update, delete and submit had checked org and project membership only (issue 6).
2. [ ] Refuse another member's attempt with a message that says why.
3. [ ] Decide whether an administrator override exists; if it does, record it in the item's history.
4. [ ] Test that a second organisation member cannot submit someone else's pending draft.

**Related issues**
- **Issue 6** (drafts have no ownership enforcement) — draft access is currently checked against organisation and project membership only, never against who owns the draft. This story's first criterion is that missing check.

### D7 — A defined share of items gets independently double-checked

**P1** · Owner: **BE** · Ticket: **SCRUM-51**

As a project manager, I want the proportion of items I set in my policy to be routed to a second, independent reviewer, because sampling for cross-validation is how I find out whether my reviewers actually agree.

**Acceptance criteria**
1. The cross-validation percentage set in B2 determines how many items are routed for a second independent review.
2. The second reviewer cannot see the first reviewer's decision before recording their own.
3. I can see, per task, how many items were double-reviewed and how often the two reviewers agreed.

**Subtasks**
1. [ ] Route the cross-review percentage set in B2 to a second, independent reviewer.
2. [ ] Hide the first reviewer's decision from the second until the second is recorded.
3. [ ] Report per task how many items were double-reviewed and how often the two reviewers agreed.
4. [ ] Depends on D8 — there is no assignee to route an item to yet.

**Related issues**
- No open defects — net-new. This is the mechanism the client described (30% independently reviewed) and it feeds the agreement metrics in **I3**.

### D8 — Work reaches the right person

**P0** · Owner: **BE/FE** · Ticket: **SCRUM-48, SCRUM-52**

As an annotator, I want to open the platform and see the items that are mine to work on, because otherwise there is no answer to “what should I do next” — and as a project manager I need to give specific work to specific people rather than hoping the right person picks it up.

**Acceptance criteria**
1. I can see a list of items assigned to me, and open one directly from it.
2. A project manager can assign items to an annotator, a reviewer or an expert, individually or in bulk.
3. An item shows who it is currently with, and moving it to someone else is recorded in its history.
4. Assignment respects roles — an item needing review is not assigned to someone who cannot review.

**Subtasks**
1. [ ] Add an assignee to TaskItemDB — the concept is absent from the data model, not merely broken.
2. [ ] Add assignment endpoints, individually and in bulk.
3. [ ] Build a "my work" queue an annotator can open an item directly from.
4. [ ] Show who an item is currently with, and record every reassignment in its history.
5. [ ] Refuse assigning a review to someone without the reviewer capability (see G1).

**Related issues**
- No open defects catalogued, because the concept is absent rather than broken: task items have no assignee at all in the data model, so there is nothing to attribute a defect to.
- This is a prerequisite the rest of the epic quietly assumes. **D7** routes a share of items to “a second independent reviewer” and **E2** sends an item “back to the annotator” — neither is implementable without assignment existing first.

> **D8 is bigger than it reads.** Task items have no assignee field at all — the concept is absent, not broken. D7 and E2 both assume it exists. Factor this into the W9–10 estimate.

## Epic E — Disagreement & Dispute

### E1 — Disagreement is noticed without anyone reporting it

**P0** · Owner: **BE** · Ticket: **SCRUM-36, SCRUM-49, SCRUM-51**

As a project manager, I want the platform to detect when two reviewers disagree and open a dispute automatically, because disagreement I have to find manually is disagreement I will miss.

**Acceptance criteria**
1. When independent reviews on the same item conflict, a dispute is raised automatically.
2. The dispute shows both conflicting decisions and who made them.
3. Disputed items are visible in one place and are excluded from release until resolved.

**Subtasks**
1. [ ] Detect conflicting independent reviews on the same item and open a dispute without anyone reporting it.
2. [ ] Show both conflicting decisions and who made them on the dispute.
3. [ ] List disputed items in one place, scoped to what the viewer may see.
4. [ ] Exclude disputed items from release until they are resolved.

**Related issues**
- No open defects — net-new. Our own design notes are explicit that dispute should default to auto-detected disagreement rather than being a complaint button.

### E2 — I can send an item back to the annotator

**P0** · Owner: **FE** · Ticket: **SCRUM-35** · Status: ○ Working · Allocated to: Parth

As an expert, I want to send a disputed item back to its annotator with a note, because not every dispute should be settled by me overruling — sometimes the right outcome is the original annotator redoing it with guidance.

**Acceptance criteria**
1. “Send back to annotator” works from the dispute screen and is not a placeholder.
2. The item returns to the annotator's queue with my note attached.
3. The send-back appears in the item's history with who sent it back and why.

**Subtasks**
1. [ ] Replace the "not wired yet" guard at task-dispute-desk.tsx:93 with the call the page already has (issue 15).
2. [ ] No backend work — POST /tasks/{id}/task-items/{id}/escalations/decision already accepts send_back, and lib/api/review-actions.ts:55 already types it.
3. [ ] Attach the expert's note and return the item to the annotator's queue.
4. [ ] Record who sent it back and why in the item's history.
5. [ ] Test the round trip: the item reaches expert_send_back and shows as "Returned" in the annotate queue.

**Related issues**
- **Issue 15** (dispute “send back to annotator” isn't implemented) — users currently hit a placeholder message. issues.md confirms the platform already fully supports this behind the screen and has a ready client function for it, so this is a frontend-only story: wiring the existing button to the existing capability closes the defect.

### E3 — An expert's decision is recorded as its own decision

**P1** · Owner: **BE** · Ticket: **SCRUM-36, SCRUM-52**

As an expert, I want my adjudication recorded as a distinct decision that references the dispute it settles, because “who routed this to me” and “who decided it” are different facts and collapsing them destroys the audit trail.

**Acceptance criteria**
1. An adjudication is a separate record from the routing that requested it.
2. It references the item, the dispute, and the conflicting decisions it resolves.
3. The annotator's original label, the reviewers' decisions and my adjudication all remain individually visible afterwards.

**Subtasks**
1. [ ] Record an adjudication as its own record, separate from the escalation routing that requested it.
2. [ ] Reference the item, the dispute, and the conflicting decisions it resolves.
3. [ ] Keep the annotator's label, the reviewers' decisions and the adjudication individually visible afterwards.
4. [ ] Blocked until the client says where an item goes once a dispute is settled.

**Related issues**
- No open defects — net-new. This is the brief's requirement that annotator label, reviewer decision and adjudicated judgment are “preserved rather than collapsed into one final answer field.”

### E4 — Resolving a dispute doesn't erase the disagreement

**P1** · Owner: **BE** · Ticket: **SCRUM-36**

As a client, I want a resolved item to still show that people disagreed and how it was settled, because disagreement is evidence about the item's difficulty, and deleting it hides exactly what I most need to know.

**Acceptance criteria**
1. Resolving a dispute adds a resolution; it never deletes or overwrites the conflicting decisions.
2. A resolved item's history still shows the original disagreement.
3. Reports can distinguish items that were contested from items that were unanimous.

**Subtasks**
1. [ ] Add a resolution rather than overwriting or deleting the conflicting decisions.
2. [ ] Keep the original disagreement visible in the item's history after resolution.
3. [ ] Let reports tell a contested item from a unanimous one.
4. [ ] Test that resolving a dispute deletes nothing.

**Related issues**
- No open defects — net-new, and a stated non-negotiable in our governance documents (“disagreement is first-class… must be preserved, not collapsed”).

### E5 — Escalation matches the assurance my project needs

**P1** · Owner: **BE** · Ticket: **SCRUM-36**

As a project manager, I want to configure whether disputes must reach an expert, may reach one, or never do, because a routine labelling task and an arbitration-ready project need different escalation rules.

**Acceptance criteria**
1. I can set the escalation posture when configuring the project or task.
2. Where an expert gate is required, an item cannot complete without an expert decision.
3. The posture in force is visible on the project.

**Subtasks**
1. [ ] Make the escalation posture selectable when configuring a project or task.
2. [ ] Where an expert gate is required, block completion until an expert has decided.
3. [ ] Show the posture in force on the project.
4. [ ] The gate values already exist on OrganizationPolicyDB and are never enforced — the enforcement itself is G2.

**Related issues**
- No open defects — net-new. The escalation gate values exist internally but are not selectable or enforced; see **G2** for the wider posture enforcement this depends on.

### E6 — The dispute and arbitration screens show my real cases

**P0** · Owner: **FE** · Ticket: **SCRUM-36, SCRUM-52**

As an expert, I want the dispute and arbitration screens to show the actual disputed items from my projects, because they currently display sample data — so everything Epic E builds underneath is invisible to the person who has to act on it.

**Acceptance criteria**
1. The project dispute list, the individual dispute view and the arbitration view all show real cases from the backend, scoped to what I'm allowed to see.
2. The task-level dispute and finalised views show that task's real items.
3. Actions taken on these screens change real state, and the change is visible on refresh.
4. No screen in the dispute or arbitration path renders placeholder content.

**Subtasks**
1. [ ] Verify rather than rebuild: the task dispute and finalized desks already read live data.
2. [ ] Build or delete the three routes that return notFound() — /disputes/[id], /arbitration/[id] and /exports/[id] — and record which and why.
3. [ ] Scope every dispute list to what the viewer is allowed to see.
4. [ ] Confirm an action taken on these screens changes real state and survives a refresh.

**Related issues**
- No open defects catalogued — the screens work, they're just not connected. Verified: tasks/[taskId]/dispute, tasks/[taskId]/finalized, projects/[projectId]/disputes and the standalone dispute/arbitration views contain no live-data calls at all, while the overview, items, annotate and review screens do.
- This is the second of the four agreed objectives (“every screen backed by real, correctly-scoped data rather than partially-wired endpoints”) and without it Epic E is backend work nobody can see.

## Epic F — Provenance & History

*The brief's test: “how did this label get here” — and refuse to release when it can't answer.*

### F1 — I can ask how any label came to exist

**P0** · Owner: **BE** · Ticket: **SCRUM-39** · Status: ○ Working

As a client, I want to open any item in a delivered dataset and see the full sequence that produced its label, because a dataset that can't answer that can only be shipped, not defended.

**Acceptance criteria**
1. Each item shows an ordered record of: what it came from, what the AI suggested, what the human did with that suggestion (accepted, modified, rejected or replaced), every review decision, and any dispute or adjudication.
2. Each entry names who did it and when.
3. The record is captured as the work happens, not reconstructed afterwards.

**Subtasks**
1. [ ] Add a provenance event record distinct from AuditLogDB (db_models.py:127), which holds opaque before/after blobs.
2. [ ] Cover the ordered kinds: source registered, AI suggested, human responded, reviewed, disputed, adjudicated, released.
3. [ ] Distinguish the human response — accepted, modified, rejected or replaced.
4. [ ] Write events at the point of decision rather than reconstructing them afterwards.
5. [ ] Name the actor and the time on every entry.

**Related issues**
- No open defects — net-new. Only a generic activity log exists today, holding opaque before/after values rather than a structured account of the workflow.

### F2 — Annotations remember which guideline they followed

**P1** · Owner: **BE** · Ticket: **SCRUM-53**

As a project manager, I want to update annotation guidelines without rewriting history, because when I revise a guideline mid-project I need to know which items were labelled under the old one.

**Acceptance criteria**
1. Updating a guideline or source creates a new version rather than replacing the current one.
2. Every annotation records the guideline and source version in force when it was made.
3. I can see which items were annotated under a superseded version.

**Subtasks**
1. [ ] Version guidelines and sources instead of replacing them in place — there is no versioning of any kind today.
2. [ ] Record the guideline and source version in force on every annotation.
3. [ ] Let a manager see which items were annotated under a superseded version.
4. [ ] Sequence before H3 — its superseded-version check cannot be built until this exists.

**Related issues**
- No open defects — net-new. There is no versioning of any kind today, which is also what makes the “superseded version” release check in **H3** impossible to build until this exists.

### F3 — The AI's suggestion, the human's answer and the reviewer's correction stay separate

**P0** · Owner: **BE** · Ticket: **SCRUM-38**

As a client, I want to see the AI's suggestion, the annotator's decision on it and any reviewer correction as three distinct facts, because collapsing them into one value destroys the only evidence of what human judgement actually contributed.

**Acceptance criteria**
1. All three are individually retrievable for any item.
2. A later correction never overwrites the earlier record — it supersedes it visibly.
3. The export identifies which value is authoritative and shows what it superseded.

**Subtasks**
1. [ ] Keep the AI suggestion, the annotator's decision and any reviewer correction individually retrievable.
2. [ ] Make a later correction supersede visibly rather than overwrite — D3 makes the correction land, this keeps the original (issue 5).
3. [ ] Mark which value is authoritative in the export, and show what it superseded — the missing concept behind issue 4.
4. [ ] Depends on the canonical-annotation decision taken in D4.

**Related issues**
- **Issue 5** (reviewer corrections aren't saved) — **D3** makes corrections land; this story makes them land without destroying the original, which is the other half of the same defect.
- **Issue 4** (a finalised item can export more than one conflicting answer) — “the export identifies which value is authoritative” is precisely the missing concept; see **H4** for the export-side change.

### F4 — History tells me who really did what

**P1** · Owner: **BE** · Ticket: **SCRUM-40, SCRUM-41**

As a project manager, I want the history to distinguish what a person did from what the platform did automatically, because an audit trail that attributes automated steps to people is worse than none.

**Acceptance criteria**
1. Automated actions are shown as system actions, not attributed to a user.
2. The history reads cleanly — one entry per thing that happened, without a change entry repeating what the summary already says.
3. I can filter an item's history to just the human decisions.

**Subtasks**
1. [ ] Set actor_kind from what actually happened — task_audit_log_query.py:255 hardcodes "user" even when the display name is System (issue 21).
2. [ ] Stop escalation entries repeating their own summary as a change (issue 22).
3. [ ] Let an item's history be filtered to human decisions only.
4. [ ] Test that a system-generated entry is never attributed to a person.

**Related issues**
- **Issue 21** (audit log always shows “user” as the actor) — criterion 1 requires the actor to reflect what actually happened, which is the fix.
- **Issue 22** (escalation entries duplicate their own summary as a change) — criterion 2 removes exactly this noise from the history view.

### F5 — I can see an item's whole story on one screen

**P1** · Owner: **FE** · Ticket: **SCRUM-39**

As a reviewer, I want to see an item's full timeline before I make a decision, because deciding without knowing that two people already disagreed about it is how bad decisions get made.

**Acceptance criteria**
1. The item view shows its history in order: annotation, reviews, disputes, adjudication.
2. Each entry shows who, when and what changed.
3. I can reach the item's history from the review screen without losing my place.

**Subtasks**
1. [ ] Show the item's timeline in order: annotation, reviews, disputes, adjudication.
2. [ ] Show who, when and what changed on each entry.
3. [ ] Reach the item's history from the review screen without losing your place.
4. [ ] Sequence after F1 — the timeline has nothing to read until provenance events are being written.

**Related issues**
- No open defects — net-new; depends on **F1**.

## Epic G — Roles, Permissions & Organisations

### G1 — My role determines what I can do

**P0** · Owner: **BE** · Ticket: **SCRUM-44, SCRUM-52** · Status: ○ Working · Allocated to: Jingwei Lin

As an organisation administrator, I want a person's role to determine which actions they can take, because at the moment being a member of the organisation is enough to do almost anything, which makes the roles I assign decorative.

**Acceptance criteria**
1. Approving, disputing, adjudicating and releasing each require the appropriate role.
2. A user without the required role is refused with a clear message rather than silently allowed.
3. Adding a new role later doesn't require reworking the workflow.

**Subtasks**
1. [ ] Add a capability check that reads RoleAssignmentDB.role_key — app/core/permissions.py verifies tenancy only, and nothing anywhere checks a role before an action.
2. [ ] Require the appropriate capability for approving, disputing, adjudicating and releasing, so issue 7 cannot reappear on the next endpoint.
3. [ ] Refuse without it, with a message that says what was needed, rather than allowing it silently.
4. [ ] Keep the model extensible so adding a role later does not mean reworking the workflow.
5. [ ] Coordinate with G3 — both stories change the same permission layer.

**Related issues**
- **Issue 7** (annotators can approve their own work) — **D1** blocks self-review specifically; this story generalises the same enforcement across every governed action so the gap doesn't simply reappear on the next endpoint.

### G2 — My project's governance posture actually governs

**P1** · Owner: **BE** · Ticket: **SCRUM-50**

As a project manager, I want choosing dual sign-off, expert gate or arbitration-ready to genuinely change what the workflow requires, because otherwise I've selected a label that reassures me and enforces nothing.

**Acceptance criteria**
1. Dual sign-off requires the configured number of approvals from different reviewers before an item can finalise.
2. Expert gate prevents completion until an expert has approved.
3. Arbitration-ready guarantees unresolved disagreement reaches arbitration rather than quietly defaulting.
4. The posture in force is visible on the project and in the export record.

**Subtasks**
1. [ ] Enforce dual sign-off: the configured number of approvals from different reviewers before an item can finalise.
2. [ ] Enforce the expert gate: no completion until an expert has approved.
3. [ ] Enforce arbitration-ready: unresolved disagreement reaches arbitration rather than quietly defaulting.
4. [ ] Show the posture in force on the project and in the export record.
5. [ ] The three postures are recorded and never applied — docs/terminology calls them "signals, not separate workflow engines".

**Related issues**
- No open defects — net-new enforcement. Our own terminology documents describe these three postures as “signals, not separate workflow engines,” which is an accurate description of the gap: they are recorded and never applied.

### G3 — My work stays inside my project

**P0** · Owner: **BE** · Ticket: **SCRUM-21** · Status: ○ Working · Allocated to: Jingwei Lin

As an organisation administrator, I want a person with access to one project to be unable to change anything in another, because access to a single low-risk project currently lets someone modify tasks and items in projects they were never given access to.

**Acceptance criteria**
1. Changing or deleting a task fails unless it genuinely belongs to the project it was requested under.
2. The same applies to changing an item within a task.
3. Attempts across a boundary are refused, not silently applied.

**Subtasks**
1. [ ] Delete the shadowing duplicate PUT and DELETE /projects/{id}/tasks/{id} at projects.py:176 and :213 (issue 9).
2. [ ] Keep the tasks.py:56 version, which checks the task belongs to the project named in the URL; projects.py is mounted first and wins today.
3. [ ] Apply the same ownership check to task-item updates.
4. [ ] Test that a member of project A cannot update or delete a task, or patch an item, in project B.

**Related issues**
- **Issue 9** (cross-project/cross-org write bypass) — a duplicated route means the check that would catch this is never reached. The story's criteria can only pass once the live path performs the ownership check, which also removes the shadowed duplicate.

### G4 — The platform refuses states that can't exist

**P1** · Owner: **BE/SC** · Ticket: **SCRUM-22** · Status: ○ Working · Allocated to: Dishank Aswal

As a project manager, I want the platform to reject an impossible item state outright, because a nonsense status stored permanently makes my counts, filters and progress figures lie from then on.

**Acceptance criteria**
1. An invalid status is rejected before anything is stored.
2. The rejection explains what the valid options were.
3. No item can be left in a state the workflow doesn't recognise.

**Subtasks**
1. [ ] Type TaskItemStatusUpdate.status — it is a bare str at app/api/routes/tasks.py:52 (issue 10).
2. [ ] Validate before writing rather than after the commit; the bad value survives in the database today.
3. [ ] Return the valid options in the rejection so the caller can correct it.
4. [ ] Test that an invalid status never reaches the database.

**Related issues**
- **Issue 10** (invalid task status values get saved to the database) — the value is currently committed first and only rejected when the response is built, so the bad data survives. Criterion 1 inverts that order, which is the fix.

### G5 — I can actually invite someone into my organisation

**P0** · Owner: **BE** · Ticket: **SCRUM-8** · Status: ○ Working · Allocated to: Jingwei Lin

As an organisation administrator, I want to invite a colleague and have them successfully join, because today no invitation can be accepted at all — which means I cannot onboard a second person through the normal route.

**Acceptance criteria**
1. I can send an invitation and see it listed as pending.
2. The invited person can accept it and gain access.
3. What I'm shown about an invitation's state matches its real state.

**Subtasks**
1. [ ] Stop creating invitations as already accepted — invite_member sets membership ACTIVE with accepted_at while the response says pending (issue 17).
2. [ ] Issue a real invitation token carrying the org_id and sub claims the accept endpoint at members.py:205 reads (issue 17).
3. [ ] Confirm the pending-invitation list is reachable now the router mounts invitations at its own prefix (issue 18 looks closed — verify).
4. [ ] Test the whole route: invite, shows pending, accepted by the invitee, access granted.

**Related issues**
- **Issue 17** (organisation invitations are completely broken) — invitations are created as already-accepted internally while reporting “pending,” and acceptance always fails on a broken token contract. Criteria 2 and 3 cannot pass while either remains.
- **Issue 18** (pending-invitation listing unreachable behind a duplicate route) — criterion 1 requires the pending list to be reachable; issues.md notes neither defect is testable end-to-end without the other, so they are fixed together here.

## Epic H — Release & Export

*Biggest genuine build gap — today's export is a placeholder, not a partial implementation.*

### H1 — A release is a fixed thing I can point at

**P0** · Owner: **BE** · Ticket: **SCRUM-42**

As a client, I want a release to be a permanent, unchanging artefact, because a “release” that silently changes when someone edits an item afterwards is not something I can hand to anyone.

**Acceptance criteria**
1. Releasing a dataset produces a stored artefact capturing the items as they were at that moment.
2. Later changes to the underlying items do not alter an existing release.
3. Each release is identifiable and re-downloadable unchanged.

**Subtasks**
1. [ ] Add a release record storing the items as they were at the moment of release.
2. [ ] Make later changes to the underlying items leave an existing release untouched.
3. [ ] Give each release a stable identifier and an artefact that can be downloaded again unchanged.
4. [ ] Today's export list is derived live from task status in project_exports_service.py:20 — nothing is ever written or frozen.

**Related issues**
- No open defects — net-new. Today's export list is derived live from task status; nothing is ever written or frozen, so there is no defect to fix, only a capability to build.

### H2 — Every release explains what's in it

**P0** · Owner: **BE** · Ticket: **SCRUM-42**

As a client, I want each release to come with a manifest describing exactly what it contains, because I need to verify a dataset independently rather than take its contents on trust.

**Acceptance criteria**
1. The manifest lists item count, the guideline and source versions covered, when it was produced and by whom.
2. Each item in the release points to its provenance record.
3. The release's contents can be checked against its manifest.

**Subtasks**
1. [ ] Write a manifest carrying item count, the guideline and source versions covered, when it was produced and by whom.
2. [ ] Point each item in the release at its provenance record.
3. [ ] Let the release contents be checked against the manifest independently.
4. [ ] Sequence after F1 and F2 — the provenance pointers and the version list both come from them.

**Related issues**
- No open defects — net-new; depends on **F1** and **F2**.

### H3 — A release that shouldn't exist is refused

**P0** · Owner: **BE** · Ticket: **SCRUM-42**

As a client, I want the platform to refuse to produce a release containing unreviewed items, missing provenance or superseded versions, because a warning attached to a bad release is not a safeguard — by then the bad release exists.

**Acceptance criteria**
1. The checks run before anything is produced, and failure means no release is created.
2. I'm told which items caused the refusal and why.
3. The gate cannot be satisfied by someone asserting that review happened — it is checked against the recorded decisions.

**Subtasks**
1. [ ] Run the checks before anything is produced — a failure must mean no release is created.
2. [ ] Refuse on unreviewed items, incomplete provenance, or superseded versions.
3. [ ] Name the items that caused the refusal and why.
4. [ ] Check against the recorded decisions, never against an operator asserting that review happened.

**Related issues**
- No open defects — net-new, and the brief's sharpest requirement: gated “before the release exists,” and explicitly not satisfiable “by an operator asserting that review happened.”

### H4 — Every released item has exactly one authoritative answer

**P0** · Owner: **BE** · Ticket: **SCRUM-37**

As a client, I want each item in a release to carry one answer marked as the authoritative one, because an export containing two conflicting “final” answers for the same item is unusable for training and indefensible to an auditor.

**Acceptance criteria**
1. Each released item carries exactly one authoritative value.
2. Where other submissions existed, they appear as superseded history — never as competing answers.
3. The authoritative value matches what the review and adjudication record says it should be.

**Subtasks**
1. [ ] Carry exactly one authoritative value per released item (issue 4).
2. [ ] Show other submissions as superseded history, never as competing answers.
3. [ ] Match the authoritative value to what the review and adjudication record says it should be.
4. [ ] The export tracks one slot per creator rather than one canonical value per item, which is how two answers reach one item.
5. [ ] Depends on D4's canonical decision and F3's supersession model.

**Related issues**
- **Issue 4** (a finalised item can export more than one conflicting answer) — the export currently tracks one slot per annotator rather than one canonical value per item. Criterion 1 makes that impossible; it depends on the canonical-answer decision taken in **D4** and the supersession model in **F3**.

### H5 — Export figures agree with the rest of the platform

**P1** · Owner: **BE** · Ticket: **SCRUM-43**

As a project manager, I want the export list to report the same progress I see on the task, because two screens disagreeing about the same task tells me one of them is wrong and I don't know which.

**Acceptance criteria**
1. Export readiness and item counts use the same completion rule as the task itself.
2. A task marked complete never produces an export reporting zero completed items.
3. Export behaviour is covered by tests that actually run, so this can't silently regress.

**Subtasks**
1. [ ] Use the same completion rule as the task itself, unified in B6.
2. [ ] Make sure a task marked complete never produces an export reporting zero completed items (issue 19), and drop the impossible "approved" status while unifying the rule (issue 27).
3. [ ] Confirm tests/test_task_exports.py runs — all three helpers it imports now exist, so issue 14 looks closed; verify it.
4. [ ] Add tests covering export eligibility so this cannot silently regress.

**Related issues**
- **Issue 19** (completion and export readiness disagree on “done”) — resolved jointly with **B6**, which unifies the rule; this story is the export-side half.
- **Issue 27** (impossible “approved” status in the eligibility list) — removed while unifying the rule.
- **Issue 14** (backend export tests fail to even run) — criterion 3 requires working export tests, which means implementing the missing helper the existing test file already specifies; until then export behaviour is entirely unverified.

### H6 — The export, policy and history screens show real data

**P0** · Owner: **FE** · Ticket: **SCRUM-42**

As a project manager, I want the export, policy and history screens to show my project's actual releases, actual policy and actual activity, because a screen showing sample data is worse than no screen — it tells me something confidently and it isn't true.

**Acceptance criteria**
1. The project export list and individual export view show real releases produced by H1.
2. The project policy screen shows the policy actually in force, as set in B2, and the governance posture from G2.
3. The task history and setup screens show that task's real activity and real configuration.
4. Figures on these screens agree with the task screen and the dashboard.

**Subtasks**
1. [ ] Show the real releases produced by H1 on the project export list and the individual export view.
2. [ ] Show the policy actually in force, as set in B2, and the governance posture from G2.
3. [ ] Verify rather than rebuild — the task history and setup screens already read that task's real activity.
4. [ ] Reconcile the figures on these screens with the task screen and the dashboard.
5. [ ] Depends on H1 and H2; there are no real releases to display until they exist.

**Related issues**
- No open defects catalogued — same situation as **E6**: verified that projects/[projectId]/exports, projects/[projectId]/policies, tasks/[taskId]/history and tasks/[taskId]/setup contain no live-data calls.
- Completes the second agreed objective alongside **E6** and **D8**. Depends on **H1** and **H2**, since there are no real releases to display until they exist.

## Epic I — Evaluation

*Primary deliverable, not a final-week activity. Currently zero exists.*

### I1 — I can re-run the whole workflow against known cases

**P0** · Owner: **GOV** · Ticket: **SCRUM-68, SCRUM-69**

As a quality lead, I want to run a scripted scenario through the entire workflow and check the outcome against what should have happened, because testing individual pieces tells me nothing about whether the workflow holds together.

**Acceptance criteria**
1. A scenario can run end-to-end — annotation, review, cross-validation, dispute, final judgement — without manual clicking.
2. Each scenario states its expected outcome and reports pass or fail.
3. Results are comparable across runs, so a regression is visible.

**Subtasks**
1. [ ] Build a harness that drives a scenario end to end without manual clicking.
2. [ ] Cover annotation, review, cross-validation, dispute and final judgement in a single run.
3. [ ] State the expected outcome per scenario and report pass or fail.
4. [ ] Keep results comparable across runs so a regression is visible.
5. [ ] Reset to a clean seeded database between runs — depends on A3.

**Related issues**
- No open defects — net-new; nothing of this kind exists.

### I2 — The platform is tested against cases designed to break it

**P0** · Owner: **GOV** · Ticket: **SCRUM-70, SCRUM-71**

As a quality lead, I want a casebook of deliberately difficult cases, because a system demonstrated on easy items proves nothing about the ones that matter.

**Acceptance criteria**
1. The casebook covers, at minimum: a confidently wrong AI suggestion; a genuinely ambiguous item; reviewers who disagree with no guideline resolution; a guideline that changes after annotation; missing provenance; an unreviewed item reaching a proposed release; a release containing a superseded item.
2. Each case has a stated expected outcome and runs through I1.
3. The casebook grows toward the 40–60 cases the brief specifies.

**Subtasks**
1. [ ] Write the adversarial categories the brief names, starting with a confidently wrong AI suggestion.
2. [ ] Cover a genuinely ambiguous item, and reviewers who disagree with no guideline resolution.
3. [ ] Cover a guideline changed after annotation, and an item with missing provenance.
4. [ ] Cover an unreviewed item reaching a proposed release, and a release containing a superseded item.
5. [ ] Use the gold fixtures in labeling_ai_assistnat_mvp/app/data/text/ — four 200-item sets with ground truth, already shaped in hej's own vocabulary.
6. [ ] Grow toward the 40–60 cases the brief specifies, each ticket contributing the cases for its own surface as it lands.

**Related issues**
- No open defects — net-new. These adversarial categories are taken directly from the brief.

### I3 — I can tell whether reviewers actually agree

**P1** · Owner: **GOV** · Ticket: **SCRUM-72**

As a quality lead, I want reviewer agreement measured properly rather than as a raw match percentage, because raw agreement flatters any task where one answer dominates.

**Acceptance criteria**
1. Agreement is reported using an established coefficient, not percentage match.
2. Agreement is reported per task and comparable across tasks.
3. AI suggestion quality and confidence calibration are reported alongside human agreement.

**Subtasks**
1. [ ] Report agreement with an established coefficient rather than raw percentage match.
2. [ ] Report per task and comparably across tasks.
3. [ ] Report AI suggestion quality and confidence calibration alongside human agreement.
4. [ ] Measure against the gold annotations in the fixture sets.
5. [ ] Depends on D7's cross-validation routing.

**Related issues**
- No open defects — net-new; depends on the cross-validation routing in **D7**.

### I4 — I can see what AI assistance does to human judgement

**P1** · Owner: **GOV** · Ticket: **SCRUM-73**

As a quality lead, I want to measure how often reviewers accept, modify or override AI suggestions and how long they take, because the client's question is what AI assistance actually does to human judgement — not whether it feels faster.

**Acceptance criteria**
1. Acceptance, modification and override rates are reported per task.
2. Time per item is reported alongside them.
3. Results can be compared across the execution modes from C4, including how often confidently-wrong AI suggestions were accepted.

**Subtasks**
1. [ ] Report accept, modify and override rates per task.
2. [ ] Report time per item alongside them.
3. [ ] Compare results across the execution modes from C4.
4. [ ] Report how often a confidently wrong suggestion was accepted.
5. [ ] Impossible unless suggestion and decision stay separate — depends on F3.

**Related issues**
- No open defects — net-new; depends on **C4** and **F3**, since the measurement is impossible if suggestion and decision are collapsed into one value.

### I5 — I can prove the platform's records hold up

**P1** · Owner: **GOV** · Ticket: **SCRUM-74, SCRUM-75**

As a quality lead, I want automated checks that provenance is complete, permissions were enforced and a release matches its manifest, because integrity claimed is not integrity demonstrated.

**Acceptance criteria**
1. Checks confirm every released item has complete provenance.
2. Checks confirm governed actions were performed by users holding the right role.
3. A release can be reconstructed from its manifest and compared against the original.
4. Findings — including what failed and why — are recorded, with negative results reported rather than dropped.

**Subtasks**
1. [ ] Check that every released item has complete provenance.
2. [ ] Check that governed actions were performed by users holding the right role.
3. [ ] Reconstruct a release from its manifest and compare it against the original.
4. [ ] Record the findings, including what failed and why — negative results reported rather than dropped.

**Related issues**
- No open defects — net-new; exercises the gates from **H3** and the records from **F1**.

## Epic J — Organisations & Dashboard

*Client explicitly said nice-to-have. Do not over-invest.*

### J1 — My organisation has a stable identity

**P2** · Owner: **BE** · Ticket: **SCRUM-88**

As an organisation administrator, I want my organisation to have a unique identifier and address, because the client's one concrete requirement in this area is being able to refer to an organisation unambiguously.

**Acceptance criteria**
1. Each organisation has a unique identifier and URL that don't change.
2. An organisation can hold multiple accounts and use cases.

**Subtasks**
1. [ ] Give each organisation a unique identifier and URL that do not change.
2. [ ] Let one organisation hold multiple accounts and use cases.
3. [ ] Keep it small — this is the client's one concrete requirement in this area.

**Related issues**
- No open defects — net-new.

### J2 — I can see how my project is going at a glance

**P2** · Owner: **FE** · Ticket: **SCRUM-89**

As a project manager, I want a simple overview of project status and progress, because I want a starting point — not an analytics product.

**Acceptance criteria**
1. Shows project status, item counts by state and basic workflow statistics.
2. Figures agree with the task and export screens (see B6).
3. Deliberately limited in scope — the client asked that time not be spent making this comprehensive.

**Subtasks**
1. [ ] Show project status and item counts by state.
2. [ ] Reconcile the figures with the task and export screens (see B6).
3. [ ] Keep it deliberately limited — the client asked that time not be spent making this comprehensive.

**Related issues**
- No open defects — net-new.

### J3 — I can invite and manage my team

**P2** · Owner: **BE/FE** · Ticket: **SCRUM-90**

As an organisation administrator, I want to invite colleagues and manage their membership and roles, because I can't run governed review without the people who perform it.

**Acceptance criteria**
1. I can invite a person, see pending invitations, and remove a member.
2. I can assign and change a member's role.
3. Role changes take effect on what that person can do (see G1).

**Subtasks**
1. [ ] Invite a person, list pending invitations, and remove a member.
2. [ ] Assign and change a member's role.
3. [ ] Make a role change take effect on what that person can actually do (see G1).
4. [ ] Cannot be demonstrated until G5 fixes the invitation flow (issue 17) and the pending-invitation listing (issue 18).

**Related issues**
- **Issues 17 & 18** (invitations broken; pending list unreachable) — **G5** fixes the underlying flow; this story is the administrator-facing capability built on top of it and cannot be demonstrated until those are closed.

### J4 — I can maintain a project after creating it

**P2** · Owner: **BE/FE** · Ticket: **SCRUM-45**

As a project manager, I want to rename a project, update its policy or team, and archive it when finished, because a project I can only create and never adjust doesn't survive contact with real work.

**Acceptance criteria**
1. I can rename a project and update its description, policy, team and storage settings.
2. I can archive a completed project; archived projects are read-only but still viewable.
3. Changes are recorded in the project's history.

**Subtasks**
1. [ ] Rename a project and update its description, policy, team and storage settings.
2. [ ] Archive a completed project; archived projects stay viewable but read-only.
3. [ ] Record every change in the project's history.

**Related issues**
- No open defects — net-new. Client's own list: rename, update, update policy, update team settings, update storage location, archive.

## Epic K — Evidence & Handover

*Not code, but assessed. Left to the final fortnight, this is what turns a working platform into an average submission.*

### K1 — A reader can understand the system without us in the room

**P1** · Owner: **Lead** · Status: ✕ Discarded

As a client, I want a technical report covering the architecture, the evaluation results, the limitations and the known failure cases, because I have to maintain this platform after the team disperses.

**Acceptance criteria**
1. Covers architecture, the evaluation results from Epic I, limitations, and failure cases we know about and did not fix.
2. States what was consciously deferred and why — including which of the 29 defects were left, with justification.
3. Written progressively across the project, not assembled in the final week.

**Subtasks**
1. [ ] Draft the architecture section as the workflow lands, not in the final week.
2. [ ] Fold in the evaluation results from Epic I as they arrive.
3. [ ] Record the limitations and the failure cases known and not fixed.
4. [ ] State which of the 29 defects were left unfixed, with the argument for each.

**Related issues**
- No open defects — but the deferred-defect record is what closes out issues.md honestly; any of the 29 not fixed by a story above needs an explicit, argued decision rather than silence.

### K2 — Each of us can defend our own design decisions

**P1** · Owner: **all** · Status: ✕ Discarded

As a team member, I want my significant design and technical decisions recorded with the alternatives I considered, because Arc has said explicitly that I will be asked to walk through my reasoning, and reconstructing it at the end is neither honest nor convincing.

**Acceptance criteria**
1. Each member keeps a decision record covering their significant choices, the alternatives, and why they chose as they did.
2. Records are written when the decision is made, not retrospectively.
3. Where an AI tool was used, the member can still explain and defend the result independently of it.

**Subtasks**
1. [ ] Every member keeps a decision record from week one, written when the decision is made.
2. [ ] Record the option chosen, the alternatives considered, and why.
3. [ ] Where an AI tool was used, be able to explain and defend the result independently of it.
4. [ ] Review the records at the weekly meeting so nobody is reconstructing them from memory.

**Related issues**
- No open defects — this is a stated project requirement, and the brief is blunt that an agent-authored rewrite “needs the same prior justification as a hand-written one.”

### K3 — What didn't work is recorded as carefully as what did

**P1** · Owner: **GOV** · Status: ✕ Discarded

As a client, I want the findings documentation to include what we tried that failed and why, because negative findings tell me more about this platform's real limits than a list of features that worked.

**Acceptance criteria**
1. Findings record what was tried, what worked, what failed, and why.
2. Negative results from the evaluation casebook are reported, not filtered out.
3. Results are traceable to specific cases in I2 so a reader can re-run them.

**Subtasks**
1. [ ] Record what was tried, what worked, what failed and why.
2. [ ] Report the negative results from the casebook rather than filtering them out.
3. [ ] Trace each finding to a specific case in I2 so a reader can re-run it.

**Related issues**
- No open defects — the brief states plainly that “negative findings carry equal weight.”

### K4 — The end-to-end demonstration works when it matters

**P0** · Owner: **Lead** · Status: ✕ Discarded

As a client, I want to watch the full journey run end-to-end on realistic data, because that demonstration is where I find out whether the platform is genuinely finished or merely feature-complete on paper.

**Acceptance criteria**
1. One canonical demo dataset and a fixed sequence of roles are agreed and frozen ahead of time.
2. The full journey runs: project → policy → task → items → AI first pass → review → cross-validation → dispute → adjudication → release.
3. The run is rehearsed against a clean environment (A3) before it is performed.
4. A recorded fallback exists in case the live run fails.

**Subtasks**
1. [ ] Agree and freeze the demo dataset and the sequence of roles ahead of time.
2. [ ] Rehearse the full journey: project, policy, task, items, AI first pass, review, cross-validation, dispute, adjudication, release.
3. [ ] Rehearse against a clean environment from A3, not a developer's working database.
4. [ ] Record a fallback run in case the live demonstration fails.
5. [ ] Start rehearsing from W9 rather than the week of the demo — this is Risk 11 on the team's own register.

**Related issues**
- No open defects — but our own risk register lists “demo failure despite working components” as Risk 11, with exactly these mitigations. This story is that mitigation made someone's explicit responsibility.

---

## Defect coverage

Every defect in `plans/issues.md`, attached to the story that closes it.

| # | Issue | Severity | Closed by |
| --- | --- | --- | --- |
| 1 | Live API key hardcoded in committed source | Medium | **A4** |
| 2 | Finalised annotation can be silently overwritten | Critical | **D5** |
| 3 | Reviewers can be shown the wrong annotator's work | High | **D4** |
| 4 | Finalised item can export conflicting answers | Critical | **H4** |
| 5 | Reviewer corrections aren't saved | Critical | **D3** |
| 6 | Drafts have no ownership enforcement | Critical | **D6** |
| 7 | Annotators can approve their own work | Critical | **D1** |
| 8 | Legacy review API can rewrite approval history | Critical | **D2** |
| 9 | Cross-project / cross-org write bypass | High | **G3** |
| 10 | Invalid status values saved to the database | High | **G4** |
| 11 | Draft submission not atomic; draft–annotation link never saved | High | **D5** |
| 12 | Frontend fails typecheck | High | **A2** |
| 13 | Frontend test suite failing | High | **A2** |
| 14 | Backend export tests fail to run | High | **H5** |
| 15 | Dispute “send back to annotator” not implemented | High | **E2** |
| 16 | Dataset registration isn't transactional | High | **B5** |
| 17 | Organisation invitations completely broken | High | **G5** |
| 18 | Pending-invitation listing unreachable | High | **G5** |
| 19 | Completion and export readiness disagree on “done” | High | **B6** |
| 20 | AI failures produce fake annotations | High | **C3** |
| 21 | Audit log always shows “user” as actor | Medium | **F4** |
| 22 | Escalation entries duplicate their summary | Medium | **F4** |
| 23 | Backend .env config silently broken | Medium | **A3** |
| 24 | init_data.py --reset broken two ways | High | **A3** |
| 25 | Frontend test doesn't test what it claims | Low | **A2** |
| 26 | Backend test has misleading setup | Low | **A2** |
| 27 | Export-eligibility list names an impossible status | Low | **B6** |
| 28 | Task can never leave draft | High | **B4** |
| 29 | Lifecycle conflicts reported as server errors | Medium | **B5** |

## Where to start

1. **A1–A5** — process, build, environment, credentials, vocabulary. Everything downstream depends on these.
2. **D3, D4, D5** — protect authoritative data.
3. **D1, D6, D8** — restore multi-user governance, get work to the right people.
4. **D2, G3, G4** — close the legacy review path and the cross-project bypass.
5. Then B → C → E/F → G → H → I in parallel by workstream, with **K2 running from day one**.

## Client decisions needed first

- **B4** — what the intended task lifecycle path is, and who may trigger each step.
- **D4** — one canonical annotation per item, or per-annotator submissions kept side by side.

Both block implementation and shouldn't be decided by us alone.

## Definition of done

- Demonstrable **in the running app**, not just the API.
- New workflow logic ships **with tests in the same change**.
- Any listed defect has a test that **fails against the old behaviour**.
- Docs for changed states or contracts updated in the same change.
- Reviewed by someone **other than the author**.

## Out of scope

Real model training or fine-tuning · Label Studio integration · every modality at once (**text first**) · a generic workflow engine or universal ontology · formal compliance claims · marketplace, trust, billing or payout · fixing all 29 defects as a separate cleanup phase — each one is attached to the story that closes it.
