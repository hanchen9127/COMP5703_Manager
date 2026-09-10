# Jira task descriptions — CS-57

Generated from `exportable/story_src.csv`, so every description matches the backlog. Regenerate rather than editing both by hand.

One block per ticket: the name, a short description to paste into Jira, the backlog story it serves and the defect it closes. Acceptance criteria and subtasks are deliberately not repeated here — they live in the backlog (`exportable/story_src.csv` and the page beside it), so there is one place to change them.

---

## 1 · Descriptions for the tickets already on the board

### SCRUM-1 — Task queue: Create AI batch job and per-item job status models

The queue needs somewhere to record work before anything can run in the background. This is the data model only — no worker yet. Land it first — SCRUM-2, 3 and 5 all read and write the job row.

Story **C2** — A large batch of items gets AI-annotated reliably  
Issues none

---

### SCRUM-2 — Task queue: Execute task annotation asynchronously through a worker

Requesting AI annotation for a task must return immediately and let the project manager keep working, instead of blocking the request while every item is processed one at a time. Depends on SCRUM-1 for the job model and SCRUM-6 for something to call.

Story **C2** — A large batch of items gets AI-annotated reliably  
Issues none

---

### SCRUM-3 — Task queue: Retry failed items and preserve permanent failures

One failed item must not sink a batch of a thousand. Temporary failures retry; permanent ones stay visible as failed rather than disappearing. Do not copy the MVP's TaskRunner, which prints the error and drops the item from the output.

Story **C2** — A large batch of items gets AI-annotated reliably  
Issues none

---

### SCRUM-5 — Task queue: Display batch progress and per-item job status

With a thousand items running, the project manager needs to see how much of the batch is done, in flight or stuck. Depends on SCRUM-1 and SCRUM-2.

Story **C2** — A large batch of items gets AI-annotated reliably  
Issues none

---

### SCRUM-6 — AI-Provider: Integrate labeling_ai_assistnat_mvp as an AI provider

The client intends to move from a mock to open-source or self-hosted models later. The workflow must not be rebuilt when that happens. OVERSIZED — see the recommended split below. Also on the critical path: SCRUM-1, 2, 3 and 7 all need the interface this creates.

Story **C1** — The AI assistant can be swapped without disrupting my work  
Issues none

#### Recommended split for SCRUM-6

"Integrate" understates it. The MVP is not a dependency you can add: it is flat scripts with no package, it writes results to ./results/*.json instead of returning them, and it calls the network inside __init__. It is a source to port from, one analyzer at a time.

| New ticket | Backlog | Priority |
| --- | --- | --- |
| Define the AnnotationAssistant interface | C1 | P1 |
| Replace the Gemini call with an OpenAI-compatible client | C1 | P1 |
| Port the MVP's four text tasks behind the interface | C1 | P1 |

Descriptions for each are in section 2.

---

### SCRUM-30 — AI-Provider: Store & Display AI suggestions, failures and unavailable states

A reviewer must be able to tell "the AI suggested this" from "there is no AI result" at a glance. Today the two are indistinguishable. Pairs with SCRUM-7, which stops the fabrication at source.

Story **C3** — I'm told when the AI failed instead of being shown a fake answer  
Issues none

---

### SCRUM-7 — AI-Provider: Stop generating fake annotations when the AI provider fails

When the AI step fails or is switched off, the platform currently invents plausible-looking bounding boxes and stores them as an ordinary draft. A fabricated suggestion mistaken for a real one is worse than no suggestion. Highest-value ticket on the AI side — it removes fabricated data from the record.

Story **C3** — I'm told when the AI failed instead of being shown a fake answer  
Issues **20**

---

### SCRUM-8 — Organisation management: Invitation & acceptance

No invitation can be accepted at all today, so a second person cannot be onboarded through the normal route. This blocks any multi-user demo.

Story **G5** — I can actually invite someone into my organisation  
Issues **17**, **18**

---

### SCRUM-44 — Organisation Management: Users can only perform actions that are permitted by their roles

Being a member of the organisation is enough to do almost anything today, which makes the roles an administrator assigns decorative — nothing anywhere reads a role before an action. Land it before SCRUM-33: both change the same permission layer, and the reviewer-role check sits on top of the capability layer this creates. Note the third criterion the ticket description omits — adding a role later must not mean reworking the workflow.

Story **G1** — My role determines what I can do  
Issues **7**

---

### SCRUM-20 — Project & Policy: Configure project review and annotation policies

A low-risk labelling job and a safety-critical judgement task should not be governed identically. The manager sets approvals required, the cross-review share, and what happens when reviewers disagree. Scope is recording the choice faithfully. Enforcement is a separate story (G2) and is not currently on the board — see the missing list.

Story **B2** — I can decide how carefully my project's work gets reviewed  
Issues none

---

### SCRUM-21 — Task Lifecycle: Prevent cross-project task and task-item writes

Access to a single low-risk project currently lets someone modify tasks and items in projects they were never given access to.

Story **G3** — My work stays inside my project  
Issues **9**

---

### SCRUM-22 — Task Lifecycle: Validate task-item status before database commit

A nonsense status stored permanently makes counts, filters and progress figures lie from then on.

Story **G4** — The platform refuses states that can't exist  
Issues **10**

---

### SCRUM-23 — Task Lifecycle: Preserve lifecycle conflict responses as HTTP 409

A deliberate "intake is closed for this task" is currently converted into a 500, so clients and alerting cannot tell an invalid workflow transition from an outage. Small; pairs naturally with SCRUM-34.

Story **B5** — Loading a dataset either works or leaves nothing behind  
Issues **29**

---

### SCRUM-24 — Task Lifecycle: Implement valid task lifecycle transitions

A task stays a draft forever today, so dataset intake never closes and the in_review / ready / disputed states the export dashboard is built around can never occur. Raise the intended path with the client before implementing — issues.md flags this as a product decision.

Story **B4** — My task moves through real states, not just “draft”  
Issues **28**

---

### SCRUM-34 — Task Lifecycle: Make dataset registration transactional

A batch that half-loaded leaves a task nobody can trust and no way to tell which items are real.

Story **B5** — Loading a dataset either works or leaves nothing behind  
Issues **16**

---

### SCRUM-25 — Annotation: Enforce draft ownership

Any active member of the organisation can currently edit, delete or submit another user's unfinished draft — including submitting it before they are ready.

Story **D6** — My unfinished work is mine  
Issues **6**

---

### SCRUM-26 — Annotation: Make draft submission and annotation creation atomic

Draft status, the annotation and the item status are three separate commits today, and the draft's link back to its own annotation is never saved. The missing link is the same root cause as SCRUM-27, reached from the other direction.

Story **D5** — Finalised means finalised  
Issues **11**

---

### SCRUM-28 — Annotation: Preventing finalized annotations from being overwritten

A "locked" answer that a later submission can quietly change means no exported label can be defended.

Story **D5** — Finalised means finalised  
Issues **2**

---

### SCRUM-27 — Review / Annotation: Reviewer should be able to select the correct submitted annotation

On a double-annotated item the platform cannot reliably tell which annotation is the current one — the pick is effectively random. A reviewer could approve the wrong person's submission with no sign anything went wrong. BLOCKED on a client decision: one canonical annotation per item, or per-annotator submissions? SCRUM-37 and provenance both wait on the same answer.

Story **D4** — I know I'm reviewing the right person's work  
Issues **3**, **11**

---

### SCRUM-29 — Review: Retire or restrict legacy review mutation endpoints

A second, older set of review endpoints lets any organisation member edit or delete an approved review without touching item status, so approval history and official state can silently diverge.

Story **D2** — Approval history can't be rewritten behind my back  
Issues **8**

---

### SCRUM-31 — Review: Record verdict, feedback & justification

The client's stated purpose for collecting human judgement is capturing how people reason — not harvesting yes/no answers. Confirm with the client whether justification is required on accept, or only on reject, modify and dispute.

Story **C5** — I can record why I decided, not just what I decided  
Issues none

---

### SCRUM-32 — Review: Persist reviewer corrections as structured data

A reviewer can correct an item, watch it finalise, and find the correction nowhere in the result. It is appended as truncated text to a notes field while the item advances anyway. Depends on the same client decision as SCRUM-27 for who authors the corrected value.

Story **D3** — The correction I make is the answer that gets saved  
Issues **5**

---

### SCRUM-33 — Review: Permission, prevent self-review

A review one person can perform on their own work is not a review, and any dataset built on it is indefensible. This is the narrow slice. The general capability layer (G1) is not on the board — see the missing list.

Story **D1** — I can't approve my own work  
Issues **7**

---

### SCRUM-35 — Dispute / Annotation: Implement "Dispute & send back to annotator"

Not every dispute should be settled by an expert overruling — sometimes the right outcome is the original annotator redoing it with guidance. Users currently hit a placeholder. Smallest ticket on the board. The backend endpoint and the typed API client both already exist; only the click handler is missing.

Story **E2** — I can send an item back to the annotator  
Issues **15**

---

### SCRUM-36 — Dispute: Basic Functionality

Container ticket covering automatic disagreement detection, adjudication records, preserving disagreement, escalation posture and the dispute screens. OVERSIZED — carries five stories. Split before estimating; see the recommended split below.

Story **E1** — Disagreement is noticed without anyone reporting it  
Issues none

#### Recommended split for SCRUM-36

Five stories in one ticket. It cannot be estimated, finished in a sprint, or reviewed as one pull request.

| New ticket | Backlog | Priority |
| --- | --- | --- |
| Dispute: Detect reviewer disagreement automatically | E1 | P0 |
| Dispute: Record an expert adjudication as its own decision | E3 | P1 |
| Dispute: Keep the disagreement after the dispute is resolved | E4 | P1 |
| Dispute: Make the escalation posture configurable and enforced | E5 | P1 |
| Dispute: Connect the dispute and arbitration screens | E6 | P0 |

Descriptions for each are in section 2.

---

### SCRUM-37 — Provenance: Guarantee one canonical answer per task item

An export containing two conflicting "final" answers for the same item is unusable for training and indefensible to an auditor. Export tracks one slot per annotator rather than one canonical value per item. Depends on the SCRUM-27 client decision.

Story **H4** — Every released item has exactly one authoritative answer  
Issues **4**

---

### SCRUM-38 — Provenance: Preserve AI, annotator, reviewer and adjudicator outputs separately

Collapsing the AI suggestion, the human decision and the reviewer correction into one value destroys the only evidence of what human judgement actually contributed.

Story **F3** — The AI's suggestion, the human's answer and the reviewer's correction stay separate  
Issues **4**, **5**

---

### SCRUM-39 — Provenance: Item-level provenance timeline

A dataset that cannot answer "how did this label get here" can only be shipped, not defended. Only a generic activity log exists today, holding opaque before/after values. Large. The event model and writers are one ticket; the reviewer-facing timeline screen (F5) is worth splitting out.

Story **F1** — I can ask how any label came to exist  
Issues none

#### Recommended split for SCRUM-39

The event model and the reviewer-facing screen are separate pieces of work with different owners.

| New ticket | Backlog | Priority |
| --- | --- | --- |
| Provenance: Record the production history of every label | F1 | P0 |
| Provenance: Show an item's whole timeline on one screen | F5 | P1 |

Descriptions for each are in section 2.

---

### SCRUM-40 — Provenance: Record correct audit actor types

An audit trail that attributes automated steps to people is worse than none.

Story **F4** — History tells me who really did what  
Issues **21**

---

### SCRUM-41 — Provenance: Remove duplicate escalation audit changes

Escalation entries repeat their own summary as a change, which adds noise and makes real changes harder to spot. Small; pairs with SCRUM-40.

Story **F4** — History tells me who really did what  
Issues **22**

---

### SCRUM-42 — Release & Export: Basic functionality

Container ticket covering the release object, its manifest, the pre-release gate and the export screens. OVERSIZED — carries four stories, all P0, all net-new. Split before estimating; see the recommended split below.

Story **H1** — A release is a fixed thing I can point at  
Issues none

#### Recommended split for SCRUM-42

Four stories, all P0, all net-new. There is no release object in the codebase at all — today's export list is computed live from task status, so nothing is ever written or frozen. This is the largest greenfield build in the project.

| New ticket | Backlog | Priority |
| --- | --- | --- |
| Release: Create an immutable release artefact | H1 | P0 |
| Release: Produce a manifest for every release | H2 | P0 |
| Release: Refuse a release that fails its pre-release checks | H3 | P0 |
| Release: Show real releases, policy and history on the project screens | H6 | P0 |

Descriptions for each are in section 2.

---

### SCRUM-43 — Release & Export: Align task completion and export readiness

A task marked complete that reports zero finished items destroys confidence in every other number the platform shows. Deliberately one ticket across two stories. Task completion and export readiness must end up using the same rule, and splitting them is how two rules got written in the first place.

Stories **B6** — “Done” means the same thing everywhere I look · **H5** — Export figures agree with the rest of the platform  
Issues **19**, **27**, **14**

---

### SCRUM-85 — Task lifecycle: Create annotation and judgement tasks with a result shape

The client's two task categories need different work surfaces and different result shapes. Task creation already exists; the annotation-versus-judgement distinction and the result shape do not. The real work is `label_schema_ref`, today a string pointer nothing reads, which has to resolve into an actual result shape. Borrow the MVP's SchemaMerger idea but map fields explicitly rather than asking a model to infer them. Text is the committed demo path; image and video must not break.

Story **B3** — I can create a task for a specific piece of work  
Issues none

---

### SCRUM-86 — Review: Prevent self-review of own annotations

`review_actions.py:206` checks organisation membership only, so an annotator can approve their own work. A review one person can perform on their own output is not a review, and a dataset built on it is indefensible. Replaces SCRUM-33, which was deleted from the board and left this story uncovered. Scope it to the self-review identity check and the dispute-decision case — the role gate itself belongs to SCRUM-44, which cites the same defect.

Story **D1** — I can't approve my own work  
Issues **7**

---

### SCRUM-87 — Annotation: Configurable AI suggestion visibility

Seeing the machine's answer first changes the answer people give. The code has two modes; the client brief requires three — human-only, AI-first and blind-then-reveal. Test that the suggestion is absent from the API response before the human commits, not merely hidden in the interface. SCRUM-73 cannot produce a result unless this records which mode was in force against each item.

Story **C4** — I can control whether reviewers see the AI's answer first  
Issues none

---

### SCRUM-88 — Organisation Management: Stable organisation identifier and URL

The client's one concrete requirement in this area is being able to refer to an organisation unambiguously. A unique identifier and URL that do not change, and one organisation able to hold several accounts and use cases. Deliberately small.

Story **J1** — My organisation has a stable identity  
Issues none

---

### SCRUM-89 — Project: Overview of status and progress

A starting point, not an analytics product — the client asked that time not be spent making this comprehensive. Project status and item counts by state. The effort is in making the figures reconcile with the task and export screens, so do not start before SCRUM-43 settles the counting rule.

Story **J2** — I can see how my project is going at a glance  
Issues none

---

### SCRUM-90 — Organisation Management: Invite, remove and role-manage members

You cannot run governed review without the people who perform it. Invite a person, list pending invitations, remove a member, and change a role so that it takes effect on what that person can do. Blocked until SCRUM-8 repairs the underlying invitation flow — create it, but do not pull it into a sprint yet.

Story **J3** — I can invite and manage my team  
Issues **17**, **18**

---

### SCRUM-91 — Project lifecycle: Create a project scoped to an organisation

Projects hold related work — the client's own example is an "Autonomous Driving" project carrying several annotation and evaluation tasks. This is hardening rather than net-new: the capability exists, and what is missing is the organisation scoping and the proof of it. Confirm `POST /organizations/{org_id}/projects` scopes the new project to the caller's organisation, add a test that a project created in org A is invisible to a member of org B, and make `project-create-form.tsx` surface the API's validation errors rather than a generic failure. Pairs with SCRUM-45, which handles update and archive on the same object.

Story **B1** — I can create a project to hold related work  
Issues none

---

## 2 · Split tickets

Create these and close the container ticket, or convert the container into an epic and hang them under it.

### NEW — Define the AnnotationAssistant interface

MockAssistant as the default, GeminiPreannotator moved behind it, the MVP's candidate envelope as the return type. Unblocks SCRUM-1/2/3/7. Replaces part of SCRUM-6.

Story **C1** — The AI assistant can be swapped without disrupting my work  
Issues none

---

### NEW — Replace the Gemini call with an OpenAI-compatible client

One code path for a local Ollama model and a hosted provider, with one provider registry rather than the MVP's four. Replaces part of SCRUM-6.

Story **C1** — The AI assistant can be swapped without disrupting my work  
Issues none

---

### NEW — Port the MVP's four text tasks behind the interface

NER, classification, moderation and relation extraction. Drop the LLM-inferred field mapping and the writing of results to files. Replaces part of SCRUM-6.

Story **C1** — The AI assistant can be swapped without disrupting my work  
Issues none

---

### NEW — Dispute: Detect reviewer disagreement automatically

Disagreement you have to find manually is disagreement you will miss. Replaces part of SCRUM-36.

Story **E1** — Disagreement is noticed without anyone reporting it  
Issues none

---

### NEW — Dispute: Record an expert adjudication as its own decision

Who routed an item and who decided it are different facts; collapsing them destroys the audit trail. Replaces part of SCRUM-36.

Story **E3** — An expert's decision is recorded as its own decision  
Issues none

---

### NEW — Dispute: Keep the disagreement after the dispute is resolved

Disagreement is evidence about an item's difficulty. Deleting it hides exactly what the client most needs to know. Replaces part of SCRUM-36.

Story **E4** — Resolving a dispute doesn't erase the disagreement  
Issues none

---

### NEW — Dispute: Make the escalation posture configurable and enforced

A routine labelling task and an arbitration-ready project need different escalation rules. Replaces part of SCRUM-36.

Story **E5** — Escalation matches the assurance my project needs  
Issues none

---

### NEW — Dispute: Connect the dispute and arbitration screens

Verify rather than rebuild — the task desks already read live data. What remains is the three routes returning notFound(). Replaces part of SCRUM-36.

Story **E6** — The dispute and arbitration screens show my real cases  
Issues none

---

### NEW — Release: Create an immutable release artefact

A release that silently changes when someone edits an item afterwards is not something you can hand to anyone. Replaces part of SCRUM-42.

Story **H1** — A release is a fixed thing I can point at  
Issues none

---

### NEW — Release: Produce a manifest for every release

The client needs to verify a dataset independently rather than take its contents on trust. Depends on provenance and on guideline versioning. Replaces part of SCRUM-42.

Story **H2** — Every release explains what's in it  
Issues none

---

### NEW — Release: Refuse a release that fails its pre-release checks

The brief's sharpest requirement: gated before the release exists, and not satisfiable by an operator asserting that review happened. Replaces part of SCRUM-42.

Story **H3** — A release that shouldn't exist is refused  
Issues none

---

### NEW — Release: Show real releases, policy and history on the project screens

A screen showing sample data is worse than no screen — it tells you something confidently and it is not true. Replaces part of SCRUM-42.

Story **H6** — The export, policy and history screens show real data  
Issues none

---

### NEW — Provenance: Record the production history of every label

The event model and the writers on every workflow path. Replaces part of SCRUM-39.

Story **F1** — I can ask how any label came to exist  
Issues none

---

### NEW — Provenance: Show an item's whole timeline on one screen

Deciding without knowing that two people already disagreed is how bad decisions get made. Replaces part of SCRUM-39.

Story **F5** — I can see an item's whole story on one screen  
Issues none

---

## 3 · Evaluation — proposed tickets for Epic I

Epic I has nothing on the board and nothing in the codebase, and the brief is explicit that evaluation is a primary deliverable rather than a final-week activity. Eight tickets, at most two per story, each broken into subtasks.

Local ids only. The board numbering has gaps (4, and 9 through 19), so assign real keys on creation.

| # | Ticket | Story | Subtasks | Depends on |
| --- | --- | --- | --- | --- |
| EV1 | Evaluation: Scenario harness that drives the workflow end to end | **I1** — I can re-run the whole workflow against known cases | 6 | — |
| EV2 | Evaluation: Repeatable runs and regression reporting |  | 5 | EV1, A3 |
| EV3 | Evaluation: Casebook structure and the adversarial categories | **I2** — The platform is tested against cases designed to break it | 6 | EV1 |
| EV4 | Evaluation: Grow the casebook to 40–60 cases |  | 5 | EV3 |
| EV5 | Evaluation: Reviewer agreement and AI suggestion quality | **I3** — I can tell whether reviewers actually agree | 5 | EV2, D7 |
| EV6 | Evaluation: Measure what AI assistance does to human judgement | **I4** — I can see what AI assistance does to human judgement | 5 | EV2, F3, C4 |
| EV7 | Evaluation: Integrity checks on provenance, roles and releases | **I5** — I can prove the platform's records hold up | 4 | EV2, F1, H2 |
| EV8 | Evaluation: Findings record including negative results |  | 4 | EV2, EV4 |

**Start with EV1 and EV2.** Nothing else in the epic can be written until a scenario runs against a clean database and its result can be compared with the last one. **EV4** is a standing commitment from the week it lands rather than a block of work at the end — that is the difference between a casebook and a scramble.

### NEW — Evaluation: Scenario harness that drives the workflow end to end

Testing individual pieces says nothing about whether the workflow holds together. This is the runner and the step vocabulary it executes — project, policy, task, items, AI pass, annotate, review, dispute, adjudicate, release.

**Subtasks**

1. Build a harness that drives a scenario end to end without manual clicking.
2. Cover annotation, review, cross-validation, dispute and final judgement in a single run.
3. State the expected outcome per scenario and report pass or fail.
4. Define the scenario file format — named steps plus the outcome each one expects.
5. Have steps act as distinct seeded users, so role separation is exercised rather than bypassed.
6. Prove the loop with one trivial scenario before any real cases are written.

Story **I1** — I can re-run the whole workflow against known cases  
Issues none

---

### NEW — Evaluation: Repeatable runs and regression reporting

A run that cannot be repeated proves nothing, and a result nobody can compare hides regressions rather than revealing them. Depends on EV1, A3.

**Subtasks**

1. Keep results comparable across runs so a regression is visible.
2. Reset to a clean seeded database between runs — depends on A3.
3. Script the mock assistant's responses so a scenario has one correct outcome.
4. Emit a machine-readable result per case alongside the human summary.
5. Give each case a stable id and diff a run against the previous one.

Story **I1** — I can re-run the whole workflow against known cases  
Issues none

---

### NEW — Evaluation: Casebook structure and the adversarial categories

The seven categories the brief names, written as real cases against the gold fixture datasets. A system demonstrated on easy items proves nothing about the ones that matter. Depends on EV1.

**Subtasks**

1. Write the adversarial categories the brief names, starting with a confidently wrong AI suggestion.
2. Cover a genuinely ambiguous item, and reviewers who disagree with no guideline resolution.
3. Cover a guideline changed after annotation, and an item with missing provenance.
4. Cover an unreviewed item reaching a proposed release, and a release containing a superseded item.
5. Use the gold fixtures in labeling_ai_assistnat_mvp/app/data/text/ — four 200-item sets with ground truth, already shaped in hej's own vocabulary.
6. Define the case template — inputs, steps, expected outcome, category.

Story **I2** — The platform is tested against cases designed to break it  
Issues none

---

### NEW — Evaluation: Grow the casebook to 40–60 cases

A standing commitment from the week it lands, not a block of work at the end. Assembling the casebook in the final fortnight is the failure the brief warns about by name. Depends on EV3.

**Subtasks**

1. Grow toward the 40–60 cases the brief specifies, each ticket contributing the cases for its own surface as it lands.
2. Map each workflow surface to the cases it owes.
3. Add “lands its own cases” to the definition of done for every feature ticket.
4. Backfill cases for the surfaces already built.
5. Review the count against the 40–60 target at the weekly meeting.

Story **I2** — The platform is tested against cases designed to break it  
Issues none

---

### NEW — Evaluation: Reviewer agreement and AI suggestion quality

Raw percentage match flatters any task where one answer dominates. Report a real coefficient, and report whether the assistant's stated confidence tracks whether it was actually right. Depends on EV2, D7.

**Subtasks**

1. Report agreement with an established coefficient rather than raw percentage match.
2. Report per task and comparably across tasks.
3. Report AI suggestion quality and confidence calibration alongside human agreement.
4. Measure against the gold annotations in the fixture sets.
5. Depends on D7's cross-validation routing.

Story **I3** — I can tell whether reviewers actually agree  
Issues none

---

### NEW — Evaluation: Measure what AI assistance does to human judgement

The client's actual question — not whether assistance feels faster, but what it does to the answers people give. Impossible while the suggestion and the decision are collapsed into one value. Depends on EV2, F3, C4.

**Subtasks**

1. Report accept, modify and override rates per task.
2. Report time per item alongside them.
3. Compare results across the execution modes from C4.
4. Report how often a confidently wrong suggestion was accepted.
5. Impossible unless suggestion and decision stay separate — depends on F3.

Story **I4** — I can see what AI assistance does to human judgement  
Issues none

---

### NEW — Evaluation: Integrity checks on provenance, roles and releases

Integrity claimed is not integrity demonstrated. These are the checks that let someone outside the team verify a release rather than take it on trust. Depends on EV2, F1, H2.

**Subtasks**

1. Check that every released item has complete provenance.
2. Check that governed actions were performed by users holding the right role.
3. Reconstruct a release from its manifest and compare it against the original.
4. Fail the check loudly rather than warning, so an integrity gap cannot pass unnoticed.

Story **I5** — I can prove the platform's records hold up  
Issues none

---

### NEW — Evaluation: Findings record including negative results

Negative findings tell the client more about the platform's real limits than a list of features that worked, and the brief states plainly that they carry equal weight. Depends on EV2, EV4.

**Subtasks**

1. Record the findings, including what failed and why — negative results reported rather than dropped.
2. Trace each finding to a specific case so a reader can re-run it.
3. Report negative results rather than filtering them out.
4. Feed the technical report and the what-did-not-work record from this.

Story **I5** — I can prove the platform's records hold up  
Issues none

---

## 4 · Still without a ticket

Outside Epic I these stories have nothing on the board either. Ordered by consequence; each one already carries its acceptance criteria and subtasks in the backlog.

| Story | Suggested ticket | Pri | Issues | Why it matters |
| --- | --- | --- | --- | --- |
| **A4** — Platform credentials aren't sitting in shared code | Rotate the committed API key and fix configuration loading | P0 | **1** | Live credential in committed source. Ten minutes, no dependencies, exposure runs until done. |
| **A5** — A status means the same thing wherever I see it | Agree and write down the frontend, backend and AI contracts | P0 | none | The W6 milestone on the signed status form, and the third agreed objective. |
| **A3** — I can get a working copy of the platform running by myself | Make the platform runnable and resettable from a clean clone | P0 | **23**, **24** | Blocks all eight members and EV2. |
| **A2** — I can trust that a fix in one place hasn't broken another | Get the frontend build and both test suites green | P0 | **12**, **13**, **25**, **26** | No change can be validated before merge while these fail. |
| **A1** — Changes are reviewed before they reach the platform | Establish the pull-request and code-review workflow | P0 | none | The client asked for this by name at the 26-Aug status meeting. |
| **D8** — Work reaches the right person | Assign work to people | P0 | none | Task items have no assignee field at all. Send-back and cross-review routing both assume it. |
| **G2** — My project's governance posture actually governs | Make the governance posture actually govern | P1 | none | Dual sign-off, expert gate and arbitration-ready are recorded and never applied. |
| **F2** — Annotations remember which guideline they followed | Version guidelines and sources | P1 | none | No versioning of any kind exists, which is why the release gate's superseded check cannot be built. |
| **D7** — A defined share of items gets independently double-checked | Route a share of items to a second independent reviewer | P1 | none | The client's own 30% example. Blocks EV5. |
| **K4** — The end-to-end demonstration works when it matters | Rehearse the end-to-end demonstration | P0 | none | Risk 11 on the team's own register. |
| **K2** — Each of us can defend our own design decisions | Keep a per-member decision record | P1 | none | Arc has said every member will be asked to walk through their reasoning. |
| **K1** — A reader can understand the system without us in the room | Write the technical report progressively | P1 | none | Architecture, evaluation results, limitations, and the defects left unfixed. |
| **K3** — What didn't work is recorded as carefully as what did | Record what did not work | P1 | none | Negative findings carry equal weight. Draws on EV8. |

**G1** (a role determines what you can do) is covered by **SCRUM-44**, so it is not listed here.

## Not ticketed, deliberately

Nothing. Every story in the backlog that has not been dropped now carries at least one ticket on the board.

This section used to hold **B1**, **B3**, **J1**, **J2**, **J3** and **J4** — the first two because project and task creation already worked, the J group because the client called organisation management nice-to-have rather than urgent. All six have since been ticketed: **B1** is SCRUM-91, **B3** is SCRUM-85, **J1** is SCRUM-88, **J2** is SCRUM-89, **J3** is SCRUM-90 and **J4** is SCRUM-45.

Ticketed is not the same as scheduled. The J group stays P2 and stays behind the core workflow, and **J3** cannot be demonstrated until SCRUM-8 repairs the invitation flow.
