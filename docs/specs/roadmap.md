# Roadmap

Weeks are intentionally small — each one is a shippable slice of work, independently reviewable and
testable. Stories are the unit of scheduling; the full text of each lives in
`stories/current_user_stories.md`.

---

## Planning Rules

**Calendar.** The mid-semester break is worked as a normal week.

| Week | Dates |
| --- | --- |
| W6 | 7–13 Sep |
| W7 | 14–20 Sep |
| W8 | 21–27 Sep (mid-semester break) |
| W9 | 28 Sep–4 Oct |
| W10 | 5–11 Oct |

**Capacity.** Eight people, about one medium story (**M**) or two small stories (**S**) each per week.
A large story (**L**) spans two weeks and counts as an M in each. W7 is deliberately heavier on paper:
most of its S items close work that already has code or an open PR — review, tests, merge — and cost
about half a normal S. Owners are **suggestions** that continue each person's W6 area; confirm them at
the weekly sync.

| Person | Area |
| --- | --- |
| Hanchen | Annotation data integrity, plus project management |
| Jingwei | Review governance and permissions |
| Yi | AI assistant and queue |
| Michael | AI failure states and evaluation |
| Kanishka | Task lifecycle, policy and release gate |
| Dishank | Status rules, audit and versioning, release artefacts |
| Tim | Invitations, provenance and adjudication |
| Parth | Frontend |

**Order.** Priority is P0 before P1 before P2. The dependencies below are never scheduled out of order:

| Prerequisite | Unblocks |
| --- | --- |
| D5 | D4 (needs `draft.annotation_id`) |
| D4 | F3, H4, I4 |
| D8 | D7, E1, I3 |
| F1 | F5, H2, H3 |
| F2 | H2, H3 |
| C1 | C2 |
| C4 + F3 | I4 |
| B2 | G2, E5 |
| H1 + H2 | H6 |
| B6 | B4 |

**Replanning.** After each weekly sync:
1. Mark finished stories ✅.
2. Move unfinished stories to the next week *before* pulling in new ones.
3. If a client decision slips, swap in an unblocked P0 story from the same owner.

**Legend**

| Mark | Meaning |
| --- | --- |
| ✅ | On `main` and meets the Definition of Done |
| 🟡 | Merged or in PR, closure pending |
| ▶ | In progress |
| ⏳ | Blocked on a client decision |

---

## W6 — Governance and data-integrity fixes (7–13 Sep) ▶
*Status verified against `origin/main` on 2026-09-13.*

| Story | Title | Owner | Status |
| --- | --- | --- | --- |
| **D6** (SCRUM-25) | My unfinished work is mine | Hanchen | 🟡 Merged to `main`; story status and second review outstanding |
| **D5** (SCRUM-26, 28) | Finalised means finalised | Hanchen, Yi | ▶ Not started; carried to W7 |
| **G1** (SCRUM-44) | My role determines what I can do | Jingwei | 🟡 Capability checks merged; in review |
| **D2** (SCRUM-29) | Approval history can't be rewritten | Jingwei | ▶ Partial — `PATCH`/`DELETE /reviews/{id}` and `POST /reviews/{id}/submit` still live |
| **G3** (SCRUM-21) | My work stays inside my project | Jingwei | 🟡 PR #14 reviewed, awaiting merge |
| **G4** (SCRUM-22) | Refuse states that can't exist | Dishank | 🟡 PR #9 open |
| **G5** (SCRUM-8) | I can invite someone into my organisation | Tim | ▶ Fix on `CS57-Tim`, no PR |
| **B5** (SCRUM-23, 34) | Loading a dataset is all-or-nothing | Kanishka | 🟡 PR #11 open (issue 16); issue 29 unconfirmed |
| **C1** (SCRUM-6) | Swappable AI assistant | Yi | ▶ Multi-provider client merged; SCRUM-54–56 open |
| **C3** (SCRUM-7, 30) | Told when the AI failed | Michael | 🟡 SCRUM-30 merged; fabrication removed; story tests to confirm |
| **C5** (SCRUM-31) | Record why I decided | Parth | ▶ No code yet |
| **E2** (SCRUM-35) | Send an item back to the annotator | Parth | ▶ Placeholder still on `main` |
| **D1** (SCRUM-86) | I can't approve my own work | *unassigned* | ▶ Approval paths guarded; dispute decisions not |
| **F1** (SCRUM-39) | How any label came to exist | *unassigned* | ▶ Marked Working, no code |
| **I1** (SCRUM-68) | Re-run the workflow against known cases | *unassigned* | ▶ Jira "In Progress", no code |

## W7 — Close W6 and lock down review data (14–20 Sep)

| Story | Title | Size | Owner | Notes |
| --- | --- | --- | --- | --- |
| **D5** | Finalised means finalised | M | Hanchen | SCRUM-28 refusal first, then SCRUM-26 atomic submit; closes issues 2 and 11 |
| — | Client decisions | S | Hanchen | Get answers for B4, D4, D3 and E3; triage the PR queue: merge #9, #11, #14, open G5's PR, close stale #5 |
| **D2** | Approval history can't be rewritten | S | Jingwei | Retire or lock the remaining `/reviews/{id}` writes; closes issue 8 |
| **D1** | I can't approve my own work | S | Jingwei | Criterion 3: self-decision guard on escalation and dispute decisions; closes issue 7 |
| **C1** | Swappable AI assistant | M | Yi | SCRUM-54–56: assistant interface, provider recorded against every suggestion |
| **C3** | Told when the AI failed | S | Michael | Close-out tests: failed assist leaves no draft; "no AI suggestion" visible on review |
| **I1** | Re-run the workflow against known cases | L | Michael | Start: harness skeleton, one scripted scenario against a seeded database |
| **B5** | Loading a dataset is all-or-nothing | S | Kanishka | Merge PR #11; fix the intake 409 → 500 (issue 29) |
| **B6** | "Done" means the same thing everywhere | M | Kanishka | One `is_item_finished()` rule; closes issues 19 and 27 |
| **G4** | Refuse states that can't exist | S | Dishank | Validate before commit, return the valid options, test; closes issue 10 |
| **F4** | History tells me who really did what | S | Dishank | System versus user actor; de-duplicated escalation entries; issues 21 and 22 |
| **G5** | I can invite someone into my organisation | S | Tim | PR, review and merge; verify issue 18 |
| **F1** | How any label came to exist | L | Tim | Start: provenance event record separate from the audit log |
| **E2** | Send an item back to the annotator | S | Parth | Wire the existing send-back API; closes issue 15 |
| **C5** | Record why I decided | M | Parth | Structured rationale on judgement results, carried into export |

**Exit check:**
- Every W6 PR is merged or closed.
- Critical issues 2, 6, 7 and 8 are closed.
- The four client decisions are written down.
- The harness runs one scenario.

## W8 — Work reaches the right person; history becomes real (21–27 Sep)

| Story | Title | Size | Owner | Notes |
| --- | --- | --- | --- | --- |
| **D8** | Work reaches the right person — backend | L | Jingwei | Assignee on task items, individual and bulk assignment, role-checked, reassignment in history |
| **D8** | Work reaches the right person — frontend | M | Parth | "My work" queue; open an item directly; show who holds it |
| **D4** | I know I'm reviewing the right person's work | M | Hanchen | ⏳ After the client decision; closes issue 3 |
| **F1** | How any label came to exist | L | Tim | Finish: every decision point writes an ordered, attributed event |
| **C2** | Large AI batches run reliably | L | Yi | Start: decide the queue, job table with attempts and a dead-letter state |
| **I1** | Re-run the workflow against known cases | L | Michael | Finish: pass/fail per scenario, comparable across runs |
| **I2** | Cases designed to break the platform | S | Michael | Start: casebook structure and the adversarial categories from the brief |
| **B4** | My task moves through real states | M | Kanishka | ⏳ After the client decision; activate, pause, complete; intake closes; closes issue 28 |
| **F2** | Annotations remember their guideline | M | Dishank | Versioned guidelines and sources; version recorded on every annotation |

**Exit check:**
- A project manager assigns items and an annotator works from "my work".
- An item's provenance events are recorded as work happens.
- A task can be activated and completed.

## W9 — Cross-validation, supersession, AI at scale (28 Sep–4 Oct)

| Story | Title | Size | Owner | Notes |
| --- | --- | --- | --- | --- |
| **D7** | A share of items gets double-checked | M | Jingwei | Route the policy's cross-review percentage to a second reviewer; first decision hidden |
| **D3** | My correction is the answer that gets saved | M | Hanchen | ⏳ After the client decision; superseding annotation version; closes issue 5 |
| **F3** | AI suggestion, human answer and correction stay separate | M | Tim | Visible supersession, never overwrite; authoritative value marked |
| **C2** | Large AI batches run reliably | L | Yi | Finish: retry with backoff, batch progress, proven on 1,000 items |
| **C4** | Control whether reviewers see the AI first | M | Michael | Human-only, AI-first, blind-then-reveal; mode recorded per item |
| **B2** | Decide how carefully work gets reviewed | M | Kanishka | Approvals required, cross-review percentage, disagreement rule; frozen per task |
| **H1** | A release is a fixed thing I can point at | M | Dishank | Stored release artefact with a stable id, unaffected by later edits |
| **F5** | An item's whole story on one screen | M | Parth | Timeline from F1, reachable from review without losing place |

**Exit check:**
- 30% of items route to a second reviewer.
- A correction lands and the original stays visible.
- A 1,000-item AI batch completes with failures shown.
- A release artefact exists.

## W10 — Disputes end to end and the release gate (5–11 Oct)

| Story | Title | Size | Owner | Notes |
| --- | --- | --- | --- | --- |
| **E1** | Disagreement is noticed automatically | M | Jingwei | Conflicting independent reviews open a dispute; disputed items excluded from release |
| **H4** | Every released item has one authoritative answer | M | Hanchen | One canonical value per item, others shown as superseded; closes issue 4 |
| **H3** | A release that shouldn't exist is refused | M | Kanishka | Gate on unreviewed items, incomplete provenance and superseded versions, before the release exists |
| **H2** | Every release explains what's in it | M | Dishank | Manifest: counts, versions, producer, per-item provenance pointers |
| **E3 + E4** | Adjudication is its own decision; disagreement is preserved | M | Tim | ⏳ E3 after the client decision; resolution adds, never overwrites |
| **E6** | Dispute and arbitration screens show real cases | M | Parth | Replace sample data; build or delete the three `notFound()` routes |
| **I4** | What AI assistance does to human judgement | M | Yi | Accept, modify and override rates and time per item, by C4 mode |
| **I2 + I3** | Casebook to 40 cases; reviewer agreement | M | Michael | Every merged story contributes its cases; agreement by coefficient, not raw match |

**Exit check:**
- A disagreement opens a dispute and settles through the real screens.
- A bad release is refused and names its causes.
- A good release carries a manifest and one answer per item.
- The casebook holds at least 40 cases.

---

Later phases (not yet planned): H6 real export, policy and history screens (P0, after H1–H2) · G2
governance posture enforcement · E5 escalation posture · H5 export figures and tests · I5 integrity
checks and findings · I2 growth to 60 cases · J1–J4 organisation identity, dashboard, member
management and project maintenance (P2).
