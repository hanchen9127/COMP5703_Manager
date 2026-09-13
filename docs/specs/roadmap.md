# Roadmap

Weeks are intentionally small — each one is a shippable slice of work, independently reviewable and
testable. Stories set the priority and order; from W7 the unit of work is the **SCRUM task**, packed
into groups that fill at most 16u a week. The full text of each story lives in `shared/story_src.csv`,
read through `shared/user-stories.html`.

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
| W12 | 19–25 Oct |

**Groups, not owners.** From W7 nothing is pre-assigned. Each week's SCRUM tasks are split into groups,
and the team decides at the weekly meeting who takes which group. Record the result on the Jira board
(assignee) and in the tracker; `tracking-sync` carries it into `story_src.csv` at Hanchen's next sync.
Hanchen's project-management work sits outside the groups. W11 and W12 list their work without groups;
they are formed at the preceding weekly meeting, once carry-over is known.

**Load.** Expected workload is measured in units (**u**); 1u is about half a person-week.

| Item | Load |
| --- | --- |
| Small story (S) | 1u |
| Medium story (M) | 2u |
| Large story (L), spread over two weeks | 2u in each week |
| Close-out of work that already has code or an open PR — review, tests, merge | 0.5u |
| Remaining part of a story already under way, estimated in 0.5u steps | 0.5u–1.5u |

**Capacity.** A week holds at most **16u** — eight people at about 2u each (decided 2026-09-14). A group
carries 2–3u, so a week has seven or eight groups, and a 3u group needs a second person for part of the
week. W7–W10 are planned to the cap. W11 (13.5u) and W12 (8u) are planned below it, so carry-over from
earlier weeks has somewhere to go.

**Tickets.** A ticket shared by several stories — SCRUM-49, 50, 51 and 52 — is scheduled by story part,
so it can appear in more than one week. SCRUM-52's four parts are D8 (W8), E3 and E6 (W10), and G1,
which is already complete. Stories and their tickets are listed in the tracker's *Jira Statistics* tab.
That tab also names nine official work bundles with owners; from W7 the weekly meeting's group
assignment decides, and the tracker records the outcome.

**Close collaboration.** Each week lists the groups that must work closely: they change the same code or
schema, or one group's output is the other's input. Such groups agree on the interface or data shape at
the start of the week, and review each other's PRs. When several groups change the database schema in
one week, they agree one migration order on day one and each appends its step to `migrate_db_schema()`
in that order — there is no Alembic to reconcile them afterwards.

**Coverage.** All 59 stories are accounted for:
- 5 were complete before W6 — A2, A3, A4, B1 and B3;
- 48 are in the weekly plans W6–W12;
- 6 are set aside — A1, A5 and K1–K4 (see `mission.md` → Stories Set Aside). Those are not planned,
  grouped or counted here.

**Order.** Priority is P0 before P1 before P2, unless a dependency says otherwise. The dependencies below
are never scheduled out of order; where both land in the same week, the prerequisite is built first:

| Prerequisite | Unblocks |
| --- | --- |
| D5 | D4 — needs `draft.annotation_id` |
| D4 | F3, H4, I4 — and D3 waits on the same client decision |
| D8 | D7, E1, I3 — nothing can be routed without an assignee |
| B2 | D7 — D7 routes on the cross-review percentage B2 defines; also G2, E5 |
| D7 | E1, I3 — disputes and agreement both need independent second reviews |
| F1 | F5, H2, H3 |
| F2 | H2, H3 |
| C1 | C2 — and inside C2, SCRUM-1's job model lands before SCRUM-2, 3 and 5 |
| C4 + F3 | I4 |
| B6 | B4, J2 — one completion rule before lifecycle and progress figures build on it |
| H1 + H2 | H6 |
| E1 | E3, E4 — adjudication needs a dispute to exist |
| H4 | H3 — the gate refuses superseded versions by H4's canonical-value rule |
| G2 | E5 — E5 configures escalation; G2 is the enforcement it relies on |
| F4 + F5 + J3 | I5 — the integrity checks cover provenance and roles, so both must be final |

**Replanning.** At each weekly meeting:
1. Mark finished tickets ✅.
2. Move unfinished tickets into next week's groups *before* pulling in new work, and rebalance to 2–3u
   groups within the 16u cap.
3. If a client decision slips, the blocked group takes the **fallback** named in its row, pulled forward
   from a later week. The blocked story comes back at the first meeting after the decision arrives, in
   place of unblocked work of equal load from the following week. Stories that depend on it take their
   own fallbacks meanwhile.

**Legend**

| Mark | Meaning |
| --- | --- |
| ✅ | On `main` and meets the Definition of Done |
| 🟡 | Merged or in PR, closure pending |
| ▶ | In progress |
| ⏳ | Blocked on a client decision, directly or through a story it depends on |
| — | Not started |

Marks follow the code on `origin/main`, not the tracker (decided 2026-09-14). Where the tracker records
a story as complete and the code does not bear it out, the row keeps the mark the code earns and notes
the record. The records view is `shared/story_src.csv` and `mission.md` → *By epic* — Hanchen's
client-facing copy, which lags the Jira board and the tracker. PR numbers refer to
`USYD-CS-Capstone/hej`.

---

## W6 — Governance and data-integrity fixes (7–13 Sep) ▶
*Marks follow the code on `origin/main`, verified 2026-09-13 and 2026-09-14; the tracker's record is noted where it differs. W6 was allocated by person; the owners below are a record, not a plan.*

| Story | Title | Owner | Status |
| --- | --- | --- | --- |
| **D6** (SCRUM-25) | My unfinished work is mine | Hanchen | ✅ PR #13 merged; ownership guard, required viewer and unclaimed AI drafts intact on `main` (verified 2026-09-14) |
| **G1** (SCRUM-44) | My role determines what I can do | Jingwei | ✅ Complete — PR #4, merged (board still In Review) |
| **C3** (SCRUM-7, 30) | Told when the AI failed | Michael | 🟡 PR #7 merged and fabrication removed (verified); close-out tests pending in W7 group 4 — tracker: complete |
| **D2** (SCRUM-29) | Approval history can't be rewritten | Jingwei | 🟡 PR #6 merged — all four legacy review writes return `410`, closing issue 8 (verified 2026-09-14); subtasks 2 and 4 remain — tracker: complete |
| **G3** (SCRUM-21) | My work stays inside my project | Jingwei | 🟡 PR #14 not merged, no reviewer recorded — tracker: complete |
| **D5** (SCRUM-26, 28) | Finalised means finalised | Hanchen, Yi | ▶ No code yet; carried to W7 |
| **G4** (SCRUM-22) | Refuse states that can't exist | Dishank | ▶ PR #9 logged, not merged |
| **G5** (SCRUM-8) | I can invite someone into my organisation | Tim (Tok Tin Chung) | ▶ Fix on `CS57-Tim`, no PR; issue 18 still open on `main` (verified 2026-09-14) |
| **B5** (SCRUM-23, 34) | Loading a dataset is all-or-nothing | Kanishka, Dishank | ▶ PRs #9 and #11 logged, neither merged |
| **C1** (SCRUM-6) | Swappable AI assistant | Yi, Michael | ▶ PR #8 merged; SCRUM-54–56 open |
| **C5** (SCRUM-31) | Record why I decided | Parth | ▶ On the board; no code yet |
| **E2** (SCRUM-35) | Send an item back to the annotator | Parth | ▶ On the board; placeholder still on `main` |
| **I1** (SCRUM-68) | Re-run the workflow against known cases | *unassigned* | ▶ On the board, unassigned; no code |
| **D1** (SCRUM-86) | I can't approve my own work | *unassigned* | — Not started on the board; approval paths guarded via G1, dispute decisions not |
| **F1** (SCRUM-39) | How any label came to exist | *unassigned* | — Not started on the board |

## W7 — Close W6 and lock down review data (14–20 Sep) · 16u

| Group | Ticket | Story | Load | Work |
| --- | --- | --- | --- | --- |
| **1** | SCRUM-28 | D5 | 1.5u | Refuse writes to a finalised annotation; closes issue 2 |
| **1** | SCRUM-8 | G5 | 0.5u | Open, review and merge the invitation fix from `CS57-Tim`; confirm it also closes issue 18, still open on `main` |
| **2** | SCRUM-26 | D5 | 2u | Atomic draft submission and annotation creation, after SCRUM-28; closes issue 11 |
| **3** | SCRUM-86 | D1 | 1u | Criterion 3: self-decision guard on escalation and dispute decisions; closes issue 7 |
| **3** | SCRUM-35 | E2 | 1u | Wire the existing send-back API into the screen; closes issue 15 |
| **4** | SCRUM-54, 55, 56 | C1 | 1.5u | Define the `AnnotationAssistant` interface, which does not exist on `main`, and put the text analyzers behind it (SCRUM-54, 56); close SCRUM-55 — PR #8 already replaced Gemini with the OpenAI-compatible client |
| **4** | SCRUM-7, 30 | C3 | 0.5u | Close-out tests: a failed assist leaves no draft; "no AI suggestion" visible on review |
| **5** | SCRUM-43 | B6 | 2u | One `is_item_finished()` rule for task completion and export readiness; closes issues 19 and 27 |
| **6** | SCRUM-62 | F1 | 2u | Start: provenance event record, separate from the audit log |
| **7** | SCRUM-68 | I1 | 2u | Start: harness skeleton, one scripted scenario against a seeded database |
| **8** | SCRUM-21 | G3 | 0.5u | Merge train, first: review and merge PR #14 — it must be on `main` before SCRUM-26, which changes the same draft routes |
| **8** | SCRUM-22, 23 | G4, B5 | 1u | PR #9 carries both fixes: status validated before commit, with the valid options returned (issue 10), and lifecycle conflicts kept as 409 (issue 29). Review, finish if needed, merge |
| **8** | SCRUM-34 | B5 | 0.5u | Review and merge PR #11: dataset registration all-or-nothing (issue 16) |

**Why this order.** W7 closes the W6 PR queue before new work piles onto the same files, and starts the
three longest chains — provenance (F1), evaluation (I1) and the assistant interface (C1) — because
everything in W8–W12 sits at the end of one of them. D5 goes first on the review path: D4 (W8) cannot
select the right annotation until SCRUM-26 records `draft.annotation_id`. B6 stays in W7 because B4 and
J2 both build on its completion rule.

**Moved out to meet the 16u cap:** C5 (SCRUM-31, 49 C5 part) — P1, and nothing downstream depends on it;
D2's subtasks 2 and 4 (SCRUM-29) — hardening with no dependents. Both go to W11. C1 is re-estimated at
1.5u because PR #8 already delivered SCRUM-55, and PR #9's two tickets share one close-out.

**Close collaboration**

| Groups | Why |
| --- | --- |
| 8 → 1, 2 | The merge train runs first: PR #14 lands before SCRUM-26, and PRs #9 and #11 both change `tasks.py` and `task_service.py`, so one group merges them in order |
| 1 ↔ 2 | Same draft and annotation write path — SCRUM-28's guard lands first, then SCRUM-26 builds on it |
| 8 ↔ 5 | Status rules: PR #9's valid transitions and B6's single "finished" rule must agree |
| 2 ↔ 6 | Submission is the first decision point that writes a provenance event |
| 3 ↔ 6 | D1's escalation guard and E2's send-back are decision points F1 will record — agree the event fields |
| 4 ↔ 7 | The harness needs a deterministic assistant behind the new C1 interface |

**Project management (outside the groups):** get client decisions on B4, D4, D3 and E3 — **D4 first**,
because it alone gates D4, D3, F3 and H4; triage the PR queue (#9, #11, #14, the G5 fix, stale #5).

**Exit check:**
- Every W6 PR is merged or closed.
- Critical issues 2 and 7 are closed; 6 and 8 already are, and stay closed.
- The four client decisions are written down.
- The harness runs one scenario.

## W8 — Work reaches the right person; history becomes real (21–27 Sep) · 16u

| Group | Ticket | Story | Load | Work |
| --- | --- | --- | --- | --- |
| **1** | SCRUM-48 (API), SCRUM-52 (D8 part) | D8 | 3u | Assignee on task items, individual and bulk assignment, role-checked queues, reassignment in history. No task-state check yet — B4 adds it in W9 |
| **2** | SCRUM-48 (web) | D8 | 2u | "My work" queue; open an item directly; show who holds it |
| **3** | SCRUM-27 | D4 | 2u | ⏳ After the client decision: the reviewer selects the correct submitted annotation; closes issue 3. **Fallback:** F4 (SCRUM-40, 41) and D2's subtasks 2 and 4 (SCRUM-29), both from W11 |
| **4** | SCRUM-62 | F1 | 2u | Finish: every decision point writes an ordered, attributed event |
| **5** | SCRUM-1, 2 | C2 | 2u | Start: choose the queue; SCRUM-1's batch and per-item job models first — SCRUM-2, 3 and 5 all read and write the job row — then the worker |
| **6** | SCRUM-69, 70 | I1, I2 | 3u | Finish I1: repeatable runs, pass/fail per scenario, comparable across runs. Start I2: casebook structure and the adversarial categories from the brief |
| **7** | SCRUM-20, 50 (B2 part) | B2 | 2u | Approvals required, cross-review percentage, disagreement rule; frozen per task. Here rather than W9 because D7 routes on this percentage |

**Why this order.** D8 is the week's centre: D7, E1, E2's return-to-queue and I3 all route work to a
person, and none of that exists until items have an assignee. D4 follows D5 and, together with F1's
events, fixes what every later review and release record points at. B2 lands one week ahead of D7, which
reads its cross-review percentage. I1 finishes here because SCRUM-72, 73 and 74 all depend on its
repeatable runs.

**Moved out to meet the 16u cap:** F4 (SCRUM-40, 41, P1) to W11 — F1 records the default actor until F4
corrects it; B4 (SCRUM-24, ⏳) to W9 — its prerequisite B6 is done in W7, and D8 builds assignment
without a task-state check that B4 adds later. F2 moved to W9 to make room for B2; H2 and H3 still get
it before W10.

**Close collaboration**

| Groups | Why |
| --- | --- |
| 1 ↔ 2 | One feature split across API and screen — agree the assignment and queue contract on day one |
| 1 ↔ 4 | Reassignment is a provenance event and must use F1's record; F4 corrects actor types in W11 |
| 3 ↔ 4 | D4 fixes which annotation a review points at; provenance events reference the same link |
| 5 ↔ 6 | Batch runs become harness scenarios; failed and dead-letter items are casebook cases |
| 1, 3, 4, 5, 7 | Five groups change the schema — task-item assignee, review link, event table, job tables, policy fields. One migration order, agreed on day one |
| 7 → W9 group 1 | B2's frozen percentage is D7's input next week |

**Exit check:**
- A project manager assigns items and an annotator works from "my work".
- An item's provenance events are recorded as work happens.
- The harness runs repeatably and reports pass or fail per scenario.
- A task's review policy — approvals, cross-review percentage, disagreement rule — is set and frozen.

## W9 — Cross-validation, supersession, AI at scale (28 Sep–4 Oct) · 16u

| Group | Ticket | Story | Load | Work |
| --- | --- | --- | --- | --- |
| **1** | SCRUM-51 (D7 part) | D7 | 2u | Route B2's cross-review percentage to an independent second reviewer; first decision hidden |
| **2** | SCRUM-32, 49 (D3 part) | D3 | 2u | ⏳ After the client decision: a correction saved as a superseding annotation version; closes issue 5. **Fallback:** F5 (SCRUM-63) from W11 |
| **3** | SCRUM-38 | F3 | 2u | ⏳ Through D4's decision: AI, annotator, reviewer and adjudicator outputs kept separate; visible supersession; authoritative value marked. **Fallback:** C5 (SCRUM-31, 49 C5 part) from W11 |
| **4** | SCRUM-3, 5, 46 | C2 | 2u | Finish: retry with backoff, batch progress, trigger a run and route to review; proven on 1,000 items |
| **5** | SCRUM-87 | C4 | 2u | Human-only, AI-first, blind-then-reveal; mode recorded per item |
| **6** | SCRUM-53 | F2 | 2u | Versioned guidelines and sources; version recorded on every annotation. H2 and H3 need it by W10 |
| **7** | SCRUM-64 | H1 | 2u | Immutable release artefact with a stable id, unaffected by later edits |
| **8** | SCRUM-24 | B4 | 2u | ⏳ After the client decision: activate, pause, complete; intake closes; adds the task-state check to W8's assignment; closes issue 28. **Fallback:** J3 (SCRUM-90) from W12 |

**Why this order.** D7 needs both D8's assignee and B2's percentage, which W8 delivers. D3, F3 and F2 all
change the annotation record, so they share one week and one migration order rather than three. F3 and
C4 are the two inputs I4 measures in W10. H1 starts the release chain now so H2, H3 and H4 have an
artefact to work on. B4 takes F5's place because it is P0 and F5 is P1.

**Close collaboration**

| Groups | Why |
| --- | --- |
| 1 ↔ 5 | Both control what a reviewer sees before deciding, on the same review screen |
| 2 ↔ 3 | One supersession model: D3 writes the superseding version, F3 keeps and displays both |
| 2, 3, 6 | All three change the annotation record — superseding version, output separation, guideline version. One migration order, agreed on day one |
| 3 ↔ 7 | A release must pin the authoritative version F3 marks |
| 4 ↔ 5 | AI-first and blind-then-reveal depend on batch suggestions being ready and their failures visible |
| 8 ↔ W8 group 1 | B4 adds the task-state rule to the assignment D8 built |

**Exit check:**
- 30% of items route to a second reviewer.
- A correction lands and the original stays visible.
- A 1,000-item AI batch completes with failures shown.
- A release artefact exists.
- A task can be activated and completed.

## W10 — Disputes end to end and the release gate (5–11 Oct) · 16u

| Group | Ticket | Story | Load | Work |
| --- | --- | --- | --- | --- |
| **1** | SCRUM-57, 49 and 51 (E1 parts) | E1 | 2u | Conflicting independent reviews open a dispute automatically; disputed items excluded from release |
| **2** | SCRUM-37 | H4 | 2u | ⏳ Through D4's decision: one canonical value per item, others shown as superseded; closes issue 4. **Fallback:** J1 (SCRUM-88) from W12 and I2's casebook growth toward 60 (SCRUM-71) from W11 — neither depends on another story, so this holds even if B4 is still blocked |
| **3** | SCRUM-66 | H3 | 2u | Refuse a release with unreviewed items, incomplete provenance or superseded versions, before it exists |
| **4** | SCRUM-65 | H2 | 2u | Manifest: counts, versions, producer, per-item provenance pointers |
| **5** | SCRUM-58, 59, 52 (E3 part) | E3, E4 | 2u | ⏳ E3 after the client decision: adjudication is its own decision; resolution adds, never overwrites. **Fallback for E3:** E4 (SCRUM-59) continues; F4 (SCRUM-40, 41) from W11 fills E3's share — if W8's fallback already took F4, replanning rule 3 applies |
| **6** | SCRUM-61, 52 (E6 part) | E6 | 2u | Real cases on the dispute and arbitration screens and the adjudicator queue; build or delete the three `notFound()` routes |
| **7** | SCRUM-73 | I4 | 2u | Accept, modify and override rates and time per item, by C4 mode |
| **8** | SCRUM-71, 72 | I2, I3 | 2u | Casebook to 40 cases; reviewer agreement by coefficient, not raw match |

**Why this order.** Everything here consumes W9: E1 needs D7's independent reviews, H4 needs F3's
supersession, H2 and H3 need F1 and F2, I4 needs C4 and F3, and I3 needs D7. Two chains run inside the
week — E1 → E3/E4 → E6 and H4 → H3 → H2 — so each group builds on the one before it and the first days
go to the upstream group.

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

## W11 — Finish the journey on real screens (12–18 Oct) · 13.5u, not yet grouped

What W7–W10 leaves, plus the work moved out of W7–W9 to meet the 16u cap. P0 first. Groups are formed at
the W10 meeting.

| Story | Ticket | Priority | Est. load | Why here |
| --- | --- | --- | --- | --- |
| **H6** — The export, policy and history screens show real data | SCRUM-67 | P0 | 2u | Displays what H1 (W9) and H2 (W10) produce. Built earlier, these screens would show sample data again — the defect this story exists to remove. First in the week because it is P0 |
| **D2** — Approval history can't be rewritten behind my back | SCRUM-29 | P0 | 1u | Subtasks 2 and 4, moved from W7 for the cap: the review-action path always moves item status with the decision, and a test proves state and history cannot diverge. No story depends on it; issue 8 is already closed |
| **I2** — casebook toward 60 cases | SCRUM-71 | P0 | 1u | A standing commitment: the minimum of 40 is met in W10; W11 adds the cases for the surfaces built this week |
| **G2** — My project's governance posture actually governs | SCRUM-50 (G2 part) | P1 | 2u | Needs B2's policy (W8), and the posture must govern points that only exist from W9–W10: second-review routing (D7), disputes (E1) and the release gate (H3). Enforced earlier, it would be reopened every time a new point lands. Before E5 in the week |
| **E5** — Escalation matches the assurance my project needs | SCRUM-60 | P1 | 2u | Configures how disputes escalate, and disputes only run end to end after E1, E3 and E4 in W10. Builds on G2's enforcement, so it follows G2 in the same week |
| **F4** — History tells me who really did what | SCRUM-40, 41 | P1 | 1u | Moved from W8 for the cap. F1 records the default actor until F4 separates system from user actions and removes duplicate escalation changes (issues 21, 22). Must land before I5 checks provenance |
| **F5** — I can see an item's whole story on one screen | SCRUM-63 | P1 | 2u | Moved from W9 so P0 B4 could take its place. Needs only F1 (W8), and shows supersession as F3 (W9) records it. Must land before I5 checks provenance |
| **C5** — I can record why I decided, not just what I decided | SCRUM-31, 49 (C5 part) | P1 | 2u | Moved from W7 for the cap; nothing depends on it. Structured rationale on judgement results, carried into export |
| **H5** — Export figures agree with the rest of the platform | SCRUM-43 (H5 check) | P1 | 0.5u | SCRUM-43 landed in W7 with B6. The remaining check — figures matching the task — waits until H1–H4 have reshaped the export path in W9–W10; written earlier, the tests would be rewritten. Log it as a follow-up against SCRUM-43 |

**Also this week:** SCRUM-47 (connect the text annotation page to live APIs) is not linked to any story.
Decide at a weekly meeting before W11 whether to link it to a story or close it.

**Exit check:**
- Every P0 story meets its Definition of Done.
- The project screens show real releases, policy and history.
- Provenance shows the right actor for every event and an item's full timeline.
- The casebook holds 40–60 cases.

## W12 — Organisation polish and the integrity check (19–25 Oct) · 8u, not yet grouped

Lowest priority last, then the integrity check, which has to see the finished system. Groups are formed
at the W11 meeting. Dependencies outrank priority here: I5 is P1 but goes after the P2 stories because it
checks the roles J3 changes.

| Story | Ticket | Priority | Est. load | Why here |
| --- | --- | --- | --- | --- |
| **J1** — My organisation has a stable identity | SCRUM-88 | P2 | 1u | Lowest priority. Changes the organisation URL every screen links to; doing it after the other screens settle avoids breaking routes still being built |
| **J2** — I can see how my project is going at a glance | SCRUM-89 | P2 | 2u | Lowest priority. Aggregates status and progress figures whose rules (B4, B6, D8) are final only after W9; the board note says not to start before SCRUM-43 settles the counting rule |
| **J3** — I can invite and manage my team | SCRUM-90 | P2 | 2u | Lowest priority. Extends G5's invitations (W7) and G1's roles; blocked by SCRUM-8 on the board until then. Before I5, which checks roles |
| **J4** — I can maintain a project after creating it | SCRUM-45 | P2 | 1u | Lowest priority. Updating or archiving a project must respect B4's lifecycle and H1's immutable releases, both from W9 |
| **I5** — I can prove the platform's records hold up | SCRUM-74, 75 | P1 | 2u | Last on purpose. Integrity checks cover provenance (F1–F5, final in W11), roles (J3, this week) and releases (H1–H4, W10); the board lists SCRUM-74 as depending on SCRUM-69, F1 and H2. The findings record summarises I2–I4 |

**Exit check:**
- Every story not set aside meets its Definition of Done.
- The parent tickets SCRUM-36, 39 and 42 can close: all their subtasks are Done.
- The integrity checks pass on provenance, roles and releases.
- The findings record includes negative results.

W13 is not planned.
