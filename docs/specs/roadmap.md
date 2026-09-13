# Roadmap

Weeks are intentionally small — each one is a shippable slice of work, independently reviewable and
testable. Stories set the priority and order; from W7 the unit of work is the **SCRUM task**, packed
into eight groups a week. The full text of each story lives in `shared/story_src.csv`, read through
`shared/user-stories.html`.

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
| W11 | 12–18 Oct |

**Groups, not owners.** From W7 nothing is pre-assigned. Each week's SCRUM tasks are split into
**eight groups of about equal expected workload**, and the team decides at the weekly meeting who
takes which group. Record the result on the Jira board (assignee) and in the tracker; `tracking-sync`
then carries it into `story_src.csv`. Hanchen's project-management work sits outside the groups.
W11 lists its work without groups; they are formed at the W10 meeting, once carry-over is known.

**Load.** Expected workload is measured in units (**u**); 1u is about half a person-week.

| Item | Load |
| --- | --- |
| Small story (S) | 1u |
| Medium story (M) | 2u |
| Large story (L), spread over two weeks | 2u in each week |
| Close-out of work that already has code or an open PR — review, tests, merge | 0.5u |

A group carries 2–3u. W9 and W10 are planned lighter (16u) than W7 (20u) and W8 (19u) to leave room
for carry-over and for the client-blocked items (⏳).

**Tickets.** A ticket shared by several stories — SCRUM-49, 50, 51 and 52 — is scheduled by story part,
so it can appear in more than one week. Stories and their tickets are listed in the tracker's *Jira
Statistics* tab. That tab also names nine official work bundles with owners; from W7 the weekly
meeting's group assignment decides, and the tracker records the outcome.

**Close collaboration.** Each week lists the groups that must work closely: they change the same code or
schema, or one group's output is the other's input. Such pairs agree on the interface or data shape at
the start of the week, and review each other's PRs.

**Coverage.** All 59 stories are accounted for:
- 5 were complete before W6 — A2, A3, A4, B1 and B3;
- 48 are in the weekly plans W6–W11;
- 6 are set aside — A1, A5 and K1–K4 (see `mission.md` → Stories Set Aside). Those are not planned,
  grouped or counted here.

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

**Replanning.** At each weekly meeting:
1. Mark finished tickets ✅.
2. Move unfinished tickets into next week's groups *before* pulling in new work, and rebalance the
   groups to 2–3u.
3. If a client decision slips, the affected group swaps in unblocked P0 work from the following week.

**Legend**

| Mark | Meaning |
| --- | --- |
| ✅ | On `main` and meets the Definition of Done |
| 🟡 | Merged or in PR, closure pending |
| ▶ | In progress |
| ⏳ | Blocked on a client decision |
| — | Not started |

---

## W6 — Governance and data-integrity fixes (7–13 Sep) ▶
*Record status from `shared/story_src.csv` (tracker and board); code notes verified against `origin/main` on 2026-09-13. W6 was allocated by person; the owners below are a record, not a plan.*

| Story | Title | Owner | Status |
| --- | --- | --- | --- |
| **D6** (SCRUM-25) | My unfinished work is mine | Hanchen | ✅ Complete — PR #13, merged |
| **G1** (SCRUM-44) | My role determines what I can do | Jingwei | ✅ Complete — PR #4, merged (board still In Review) |
| **C3** (SCRUM-7, 30) | Told when the AI failed | Michael | ✅ Complete — PR #7, merged; fabrication removed |
| **D2** (SCRUM-29) | Approval history can't be rewritten | Jingwei | 🟡 Complete in the tracker (PR #6, merged); `PATCH`/`DELETE /reviews/{id}` and `POST /reviews/{id}/submit` still live |
| **G3** (SCRUM-21) | My work stays inside my project | Jingwei | 🟡 Complete in the tracker (PR #14); PR not merged, no reviewer recorded |
| **D5** (SCRUM-26, 28) | Finalised means finalised | Hanchen, Yi | ▶ No code yet; carried to W7 |
| **G4** (SCRUM-22) | Refuse states that can't exist | Dishank | ▶ PR #9 logged, not merged |
| **G5** (SCRUM-8) | I can invite someone into my organisation | Tim (Tok Tin Chung) | ▶ Fix on `CS57-Tim`, no PR |
| **B5** (SCRUM-23, 34) | Loading a dataset is all-or-nothing | Kanishka, Dishank | ▶ PRs #9 and #11 logged, neither merged |
| **C1** (SCRUM-6) | Swappable AI assistant | Yi, Michael | ▶ PR #8 merged; SCRUM-54–56 open |
| **C5** (SCRUM-31) | Record why I decided | Parth | ▶ On the board; no code yet |
| **E2** (SCRUM-35) | Send an item back to the annotator | Parth | ▶ On the board; placeholder still on `main` |
| **I1** (SCRUM-68) | Re-run the workflow against known cases | *unassigned* | ▶ On the board, unassigned; no code |
| **D1** (SCRUM-86) | I can't approve my own work | *unassigned* | — Not started on the board; approval paths guarded via G1, dispute decisions not |
| **F1** (SCRUM-39) | How any label came to exist | *unassigned* | — Not started on the board |

## W7 — Close W6 and lock down review data (14–20 Sep) · 20u

| Group | Ticket | Story | Load | Work |
| --- | --- | --- | --- | --- |
| **1** | SCRUM-28 | D5 | 1.5u | Refuse writes to a finalised annotation; closes issue 11 |
| **1** | SCRUM-22 | G4 | 1u | Merge PR #9's status validation, or finish it: validate before commit, return the valid options; closes issue 10 |
| **2** | SCRUM-26 | D5 | 2u | Atomic draft submission and annotation creation, after SCRUM-28; closes issue 2 |
| **2** | SCRUM-21 | G3 | 0.5u | Review and merge PR #14 before SCRUM-26 lands — both change the draft routes |
| **3** | SCRUM-29 | D2 | 1u | Retire or lock the remaining `/reviews/{id}` writes; closes issue 8. Log as a follow-up PR — the tracker already marks D2 complete |
| **3** | SCRUM-86 | D1 | 1u | Criterion 3: self-decision guard on escalation and dispute decisions; closes issue 7 |
| **3** | SCRUM-8 | G5 | 0.5u | Open, review and merge the invitation fix from `CS57-Tim`; verify issue 18 |
| **4** | SCRUM-54, 55, 56 | C1 | 2u | Assistant interface, OpenAI-compatible client, the MVP's four text tasks behind it |
| **4** | SCRUM-7, 30 | C3 | 0.5u | Close-out tests: a failed assist leaves no draft; "no AI suggestion" visible on review |
| **5** | SCRUM-43 | B6 | 2u | One `is_item_finished()` rule for task completion and export readiness; closes issues 19 and 27 |
| **5** | SCRUM-23, 34 | B5 | 1u | Merge PR #11; keep lifecycle conflicts as 409 (issue 29) |
| **6** | SCRUM-62 | F1 | 2u | Start: provenance event record, separate from the audit log |
| **7** | SCRUM-68 | I1 | 2u | Start: harness skeleton, one scripted scenario against a seeded database |
| **8** | SCRUM-31, 49 (C5 part) | C5 | 2u | Structured rationale on judgement results, carried into export |
| **8** | SCRUM-35 | E2 | 1u | Wire the existing send-back API into the screen; closes issue 15 |

**Close collaboration**

| Groups | Why |
| --- | --- |
| 1 ↔ 2 | Same draft and annotation write path — SCRUM-28's guard lands first, then SCRUM-26 builds on it |
| 1 ↔ 5 | Status rules: G4's valid transitions and B6's single "finished" rule must agree |
| 2 ↔ 6 | Submission is the first decision point that writes a provenance event |
| 3 ↔ 8 | Same review actions: D1's self-decision guard covers C5's verdicts and E2's send-back |
| 4 ↔ 7 | The harness needs a deterministic assistant behind the new C1 interface |

**Project management (outside the groups):** get client decisions on B4, D4, D3 and E3; triage the PR
queue (#9, #11, #14, the G5 fix, stale #5).

**Exit check:**
- Every W6 PR is merged or closed.
- Critical issues 2, 6, 7 and 8 are closed.
- The four client decisions are written down.
- The harness runs one scenario.

## W8 — Work reaches the right person; history becomes real (21–27 Sep) · 19u

| Group | Ticket | Story | Load | Work |
| --- | --- | --- | --- | --- |
| **1** | SCRUM-48 (API), SCRUM-52 (D8 part) | D8 | 3u | Assignee on task items, individual and bulk assignment, role-checked queues, reassignment in history |
| **2** | SCRUM-48 (web) | D8 | 2u | "My work" queue; open an item directly; show who holds it |
| **3** | SCRUM-27 | D4 | 2u | ⏳ After the client decision: the reviewer selects the correct submitted annotation; closes issue 3 |
| **4** | SCRUM-62 | F1 | 2u | Finish: every decision point writes an ordered, attributed event |
| **4** | SCRUM-40, 41 | F4 | 1u | System versus user actor; no duplicate escalation changes; issues 21 and 22 |
| **5** | SCRUM-1, 2 | C2 | 2u | Start: choose the queue; batch and per-item job models with attempts and a dead-letter state; worker |
| **6** | SCRUM-69 | I1 | 2u | Finish: repeatable runs, pass/fail per scenario, comparable across runs |
| **6** | SCRUM-70 | I2 | 1u | Start: casebook structure and the adversarial categories from the brief |
| **7** | SCRUM-24 | B4 | 2u | ⏳ After the client decision: activate, pause, complete; intake closes; closes issue 28 |
| **8** | SCRUM-53 | F2 | 2u | Versioned guidelines and sources; version recorded on every annotation |

**Close collaboration**

| Groups | Why |
| --- | --- |
| 1 ↔ 2 | One feature split across API and screen — agree the assignment and queue contract on day one |
| 1 ↔ 4 | Reassignment is a provenance event and must use F1's record and F4's actor types |
| 3 ↔ 4 | D4 fixes which annotation a review points at; provenance events reference the same link |
| 3 ↔ 8 | Both change the annotation record (review link and guideline version) — one migration order |
| 1 ↔ 7 | Assignment is only allowed in the task states B4 defines |
| 5 ↔ 6 | Batch runs become harness scenarios; failed and dead-letter items are casebook cases |

**Exit check:**
- A project manager assigns items and an annotator works from "my work".
- An item's provenance events are recorded as work happens.
- A task can be activated and completed.

## W9 — Cross-validation, supersession, AI at scale (28 Sep–4 Oct) · 16u

| Group | Ticket | Story | Load | Work |
| --- | --- | --- | --- | --- |
| **1** | SCRUM-51 (D7 part) | D7 | 2u | Route the policy's cross-review percentage to an independent second reviewer; first decision hidden |
| **2** | SCRUM-32, 49 (D3 part) | D3 | 2u | ⏳ After the client decision: a correction saved as a superseding annotation version; closes issue 5 |
| **3** | SCRUM-38 | F3 | 2u | AI, annotator, reviewer and adjudicator outputs kept separate; visible supersession; authoritative value marked |
| **4** | SCRUM-3, 5, 46 | C2 | 2u | Finish: retry with backoff, batch progress, trigger a run and route to review; proven on 1,000 items |
| **5** | SCRUM-87 | C4 | 2u | Human-only, AI-first, blind-then-reveal; mode recorded per item |
| **6** | SCRUM-20, 50 (B2 part) | B2 | 2u | Approvals required, cross-review percentage, disagreement rule; frozen per task |
| **7** | SCRUM-64 | H1 | 2u | Immutable release artefact with a stable id, unaffected by later edits |
| **8** | SCRUM-63 | F5 | 2u | Item timeline from F1's events, reachable from review without losing place |

**Close collaboration**

| Groups | Why |
| --- | --- |
| 1 ↔ 6 | D7 routes on the cross-review percentage that B2 defines and freezes |
| 1 ↔ 5 | Both control what a reviewer sees before deciding, on the same review screen |
| 2 ↔ 3 | One supersession model: D3 writes the superseding version, F3 keeps and displays both |
| 3 ↔ 7 | A release must pin the authoritative version F3 marks |
| 3 ↔ 8 | The timeline shows supersession as F3 records it |
| 4 ↔ 5 | AI-first and blind-then-reveal depend on batch suggestions being ready and their failures visible |

**Exit check:**
- 30% of items route to a second reviewer.
- A correction lands and the original stays visible.
- A 1,000-item AI batch completes with failures shown.
- A release artefact exists.

## W10 — Disputes end to end and the release gate (5–11 Oct) · 16u

| Group | Ticket | Story | Load | Work |
| --- | --- | --- | --- | --- |
| **1** | SCRUM-57, 49 and 51 (E1 parts) | E1 | 2u | Conflicting independent reviews open a dispute automatically; disputed items excluded from release |
| **2** | SCRUM-37 | H4 | 2u | One canonical value per item, others shown as superseded; closes issue 4 |
| **3** | SCRUM-66 | H3 | 2u | Refuse a release with unreviewed items, incomplete provenance or superseded versions, before it exists |
| **4** | SCRUM-65 | H2 | 2u | Manifest: counts, versions, producer, per-item provenance pointers |
| **5** | SCRUM-58, 59 | E3, E4 | 2u | ⏳ E3 after the client decision: adjudication is its own decision; resolution adds, never overwrites |
| **6** | SCRUM-61, 52 (E6 part) | E6 | 2u | Real cases on the dispute and arbitration screens and the adjudicator queue; build or delete the three `notFound()` routes |
| **7** | SCRUM-73 | I4 | 2u | Accept, modify and override rates and time per item, by C4 mode |
| **8** | SCRUM-71, 72 | I2, I3 | 2u | Casebook to 40 cases; reviewer agreement by coefficient, not raw match |

**Close collaboration**

| Groups | Why |
| --- | --- |
| 1 ↔ 5 | A dispute opened by E1 is the input to adjudication |
| 5 ↔ 6 | Adjudication decisions are made through E6's screens |
| 1 ↔ 3 | Disputed items are one of the reasons the gate refuses a release |
| 2 ↔ 3 | The gate refuses superseded versions using H4's canonical-value rule |
| 3 ↔ 4 | Same release pipeline: the manifest is written only after the gate passes |
| 7 ↔ 8 | Both measure on the same harness runs and casebook |

**Exit check:**
- A disagreement opens a dispute and settles through the real screens.
- A bad release is refused and names its causes.
- A good release carries a manifest and one answer per item.
- The casebook holds at least 40 cases.

## W11 — Finish the journey on real screens (12–18 Oct) · about 15.5u, not yet grouped

What W7–W10 leaves. These go last because each one sits on top of work that only lands in W9 or W10:
built earlier, it would run on sample data or be rebuilt as the layers underneath change.

| Story | Ticket | Priority | Est. load | Why last |
| --- | --- | --- | --- | --- |
| **H6** — The export, policy and history screens show real data | SCRUM-67 | P0 | 2u | Displays what H1 and H2 produce, and H2 lands in W10. Built earlier, these screens would show sample data again — the defect this story exists to remove. First in the week because it is P0 |
| **G2** — My project's governance posture actually governs | SCRUM-50 (G2 part) | P1 | 2u | Needs B2's policy (W9), and the posture must govern points that only exist from W9–W10: second-review routing (D7), disputes (E1) and the release gate (H3). Enforced earlier, it would be reopened every time a new point lands |
| **E5** — Escalation matches the assurance my project needs | SCRUM-60 | P1 | 2u | Configures how disputes escalate, and disputes only run end to end after E1, E3 and E4 in W10. Applies policy the same way as G2, so the two should be built together |
| **H5** — Export figures agree with the rest of the platform | SCRUM-43 (H5 check) | P1 | 0.5u | SCRUM-43 lands in W7 with B6 and delivers the shared completion rule. The remaining check — export tests that really run, figures matching the task (issue 14) — waits until H1–H4 have reshaped the export path in W9–W10; written earlier, the tests would be rewritten. Log it as a follow-up against SCRUM-43 |
| **I5** — I can prove the platform's records hold up | SCRUM-74, 75 | P1 | 2u | Integrity checks cover provenance, roles and releases, so F1–F5 and H1–H4 must be finished first. The findings record summarises evaluation results from I2–I4 (W10) and depends on SCRUM-69 and SCRUM-71 |
| **I2** — casebook toward 60 cases | SCRUM-71 | P0 | 1u | A standing commitment: the minimum of 40 is met in W10; W11 adds the cases for the surfaces built this week |
| **J1** — My organisation has a stable identity | SCRUM-88 | P2 | 1u | Lowest priority. Changes the organisation URL every screen links to; doing it after the other screens settle avoids breaking routes still being built |
| **J2** — I can see how my project is going at a glance | SCRUM-89 | P2 | 2u | Lowest priority. Aggregates status and progress figures whose rules (B4, B6, D8) keep changing until W10 |
| **J3** — I can invite and manage my team | SCRUM-90 | P2 | 2u | Lowest priority. Extends G5's invitations and G1's roles; after those are merged it is additive |
| **J4** — I can maintain a project after creating it | SCRUM-45 | P2 | 1u | Lowest priority. Updating or archiving a project must respect B4's lifecycle and H1's immutable releases, both finished by W10 |

**Also this week:** SCRUM-47 (connect the text annotation page to live APIs) is not linked to any story.
Decide at a weekly meeting before W11 whether to link it to a story or close it.

**Exit check:**
- Every story not set aside meets its Definition of Done.
- The parent tickets SCRUM-36, 39 and 42 can close: all their subtasks are Done.
- The project screens show real releases, policy and history.
- The casebook holds 40–60 cases and the findings record includes negative results.

W12–W13 are not planned.
