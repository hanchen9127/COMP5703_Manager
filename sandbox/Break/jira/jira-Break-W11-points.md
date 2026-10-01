# Story points — Break to W11 tickets

2026-10-01. Board export of 2026-10-01 18:20 (W9–W11) and 18:33 (the break), with SCRUM-87 (C4) moving to W9
and SCRUM-106 (F5) to W10 as decided the same day. Code checked on `origin/main` (`dd91758`, after #42).
The break section was added later the same day; the W9–W11 section is as Hanchen set it on the board.

## Scale

Points are the roadmap's units: **1 point ≈ half a person-week ≈ 2–3 subtasks** at the backlog's size
(`specs/roadmap.md` → Load). Each estimate starts from the subtask count of the ticket's part of the story,
then moves in 0.5 steps:

- **Complexity +0.5 to +1** — net-new tables or modules, many call sites, a protocol the API must enforce,
  or front end and back end in one ticket. **−0.5 to −1** when `main` already holds most of it.
- **Risk +0.5** — a Critical defect, a schema change shared with other tickets in the same week, or a chain
  where later tickets read this one's output. Risk raises the estimate; it does not move the ticket.

Subtasks that only state a sequencing rule ("sequence after F1") are not counted.

## Mid-semester Break (1–7 Oct)

The twelve tickets in the break sprint. A container is 0. Points describe each ticket's whole work, also for
one already in progress.

| Ticket | Story | Owner | Board | Proposed | Subtasks | Complexity | Risk | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCRUM-38 | F3 | Hanchen | — | **3** | 2 + roadmap scope | High | High | The AI becomes an author without a user account: `annotations.created_by` is a foreign key to users and annotation lookup is keyed by `(task_item_id, created_by)` across services, so this is a schema change with many call sites. Two models on one item without overwriting; AI, annotator, reviewer and adjudicator outputs kept apart, the model a recorded field (R2-5). D3, H4, I4 and D9 all build on its model |
| SCRUM-110 | D9 | Jingwei | 2 | **3** | 6 | High | High | Back end and front end. A reopen action limited to `MANAGE_PROJECT` on an active task, with a reason; the finished round superseded, never edited; and every place that counts submissions reading only the new round — `human_submitter_ids` (and its per-item form), `first_pass_complete`, the review queue and the approvals-since-submission rule. Uses F3's supersession model; SCRUM-99's Return calls its function |
| SCRUM-99 | E3, D1 | Yi | 1.5 | **2.5** | 5 | High | High | A new adjudication record replacing the decision written onto the escalation row; three outcomes, each with a required reason, each moving the item differently (accept canonicalises through the adjudication, return reopens, reject leaves it unresolved); and SCRUM-86's deciding half — no one decides on work they annotated or reviewed, administrators included (R2-8). Closes half of Critical issue 7 |
| SCRUM-69 | I1 | — | — | **2** | 5 | Medium | Medium | Repeatable runs: a clean seeded database between runs, scripted mock responses, machine-readable results with stable case ids, and a diff against the previous run. I3 and I4 (W10) measure on it |
| SCRUM-70 | I2 | — | — | **2** | 6 | Medium | Medium | The case template and the brief's seven adversarial categories as real cases on the gold fixtures. Categories whose surfaces arrive later — a changed guideline (F2), missing provenance (F1), a release with a superseded item (H1–H4) — are written now with their expected outcome and run once those land |
| SCRUM-68 | I1 | Jingwei | 1.5 | 1.5 | 6 | Medium | Low | In review as PR #39 (41 scenario tests). Left: activate tasks in the harness — since PR #41 a draft task refuses work, so 14 of its tests fail on `main` — then review and merge |
| SCRUM-101 | E1 | Yi | 1 | **1.5** | 3 | Medium | High | Conflicting independent reviews open a dispute on E3's record, showing both decisions, listed in one scoped place. Risk: it builds on SCRUM-51's disagreement flag, which was not started in W8. Its release exclusion moved to H3 (W10) |
| SCRUM-116 | D1, D5, D8 | Jingwei | 1 | **1.5** | 7 | Medium | Medium | The review action applies the queue's own rule (`awaits_review_by`) after the item lock; self-review refused for every action; `route_escalation` refuses one's own item (SCRUM-86's routing half); no administrator override; five refusal tests. The rule exists, so it is reuse, but it touches the busiest function on the review path. First in the break's merge order |
| SCRUM-117 | D8 | Hanchen | 1 | **1.5** | 3 | Medium | Medium | Back end and front end: the draft service refuses a resubmission the rule does not allow (409), and the workspace panel offers the editor only where the viewer may submit, not by item status. The rule is to be confirmed at the weekly meeting before building |
| SCRUM-52 | D8, E3 | Parth | 2 | **1** | 2 | Low | Medium | `list_adjudication_queue` is on `main` already, and the second-review queue's exclusion of the first approver came with PR #35. Left: the adjudicator queue never offers an item the caller annotated or reviewed (R2-8), and only `ADJUDICATE` reaches it. The deciding-side refusal is SCRUM-99's |
| SCRUM-100 | E4 | Yi | 1 | 1 | 3 | Low | Low | Mostly falls out of SCRUM-99's separate record: resolving adds a resolution and overwrites nothing, the history still shows the disagreement, reports tell contested from unanimous, and a test proves nothing is deleted |
| SCRUM-86 | D1 | — | 0 | 0 | — | — | — | Container, folded into SCRUM-116 and 99 on 2026-09-30. Close when both are Done |

**Total: 20.5u on twelve tickets** (board today: 11u, with SCRUM-38, 69 and 70 unpointed). The roadmap planned
the break at 7.5u — evaluation plus one minimal feature — so the break has become a full feature week, at the
reduced capacity the team agreed on 21 Sep.

**By owner** (the person cap is 3.5u a week):

| Owner | Break tickets | Load | Also carried from W8 |
| --- | --- | --- | --- |
| Jingwei | SCRUM-110, 116, 68 | **6u** | — |
| Yi | SCRUM-99, 100, 101 | **5u** | — |
| Hanchen | SCRUM-38, 117 | **4.5u** | PRs #43, #44 (SCRUM-113, 114) in review |
| Parth | SCRUM-52 | 1u | SCRUM-51 first slice, SCRUM-109 (3u) |
| Unassigned | SCRUM-69, 70 | 4u | — |

Jingwei, Yi and Hanchen are over the cap; Michael, Dishank, Kanishka (after SCRUM-93) and Tim (SCRUM-115) have
room, and SCRUM-69/70 have no owner. Moving work to them is a weekly-meeting decision; whatever is still open
on 7 Oct enters W9 as carry-over, listed but not counted, on top of W9's 19.5u.

**Carried over from W8**, moving into the break when the W8 sprint closes — points checked, unchanged except
one:

| Ticket | Story | Owner | Board | Proposed | Why |
| --- | --- | --- | --- | --- | --- |
| SCRUM-51 (first slice) | D7, E1 | Parth | 1.5 | 1.5 | Blind second review and the disagreement flag, read through `resolve_for_task`. SCRUM-101 waits on it |
| SCRUM-109 | D2 | Parth | 1.5 | 1.5 | Review actions always move item status, and a test that state and history cannot diverge |
| SCRUM-93 | D8 | Kanishka | 1.5 | 1.5 | The available-work list, in progress |
| SCRUM-115 | J3 | Tim | 2 | 2 | Invitee accepts a pending invitation |
| SCRUM-114 | D8 | Hanchen | 1.5 | 1.5 | PR #43, approved |
| SCRUM-113 | D8, D4 | Hanchen | 1 | **1.5** | PR #44 grew in review: the chooser plus the failed-read refusal and the queue-not-status rule (2026-10-01) |

## W9 to W11 — proposed points

| Ticket | Story | Week | Board | Proposed | Subtasks | Complexity | Risk | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCRUM-98 | F1 | W9 | 2 | **3** | 5 | High | High | A new event record written at every decision point — draft submission (inside its transaction), review actions, escalation and adjudication, the AI worker, intake, release — each a separate call site. The roadmap's own load check flagged F1 as under-estimated (5 heavy subtasks). H2, H3, F5 and I5 all read it |
| SCRUM-53 | F2 | W9 | 2 | **3** | 3 | High | Medium | Nothing is versioned today: no guideline entity at all, no version on policies. Three things to version, the version recorded on every annotation and item, and a view of items under a superseded version. Schema change in the same week as F1, D3 and C4 |
| SCRUM-32 | D3 | W9 | 2 | **2.5** | 5 | Medium | High | Stop truncating into `review_notes`, a reviewer-authored version beside the annotator's, show it on reopen, carry it into export. Closes Critical issue 5; shares the annotation record with F3 (break) and F1 |
| SCRUM-102 | H1 | W9 | 2 | 2 | 3 | Medium | Medium | Net-new release record and frozen item copy; the export list is derived live today. Starts the release chain |
| SCRUM-51 slice 2 | D7 | W9 | — | 1.5 | 2 | Medium | Low | Sampling by B2's percentage into SCRUM-52's queue, plus the double-review report. If split into its own ticket (see the replan file), SCRUM-51 keeps 1.5 for slice 1 |
| SCRUM-89 | J2 | W9 | 2 | **1.5** | 2 | Low | Low | Status and counts by state, reconciled with the task and export screens; the client asked for it to stay limited. Counting rule (SCRUM-43) and task states (SCRUM-24) already merged |
| SCRUM-87 | C4 | W9 | 2 | **1** | 3 | Low | Low | `annotation_mode` (human_first / ai_assisted) already exists on the task and in the resolved policy, and SCRUM-46 built the AI-first path. Left: record the mode on each item, and test that a human-only item never carries an AI suggestion in the API |
| SCRUM-49 | C5, D3, E1 | W9 | — | **0** | — | — | — | Umbrella; its parts are SCRUM-32 and SCRUM-101. Close when both are Done |
| SCRUM-73 | I4 | W10 | 2 | **3** | 6 | High | Medium | Rates and time per item, plus blind-then-reveal as a protocol: a stored pre-reveal judgement, the API withholding the suggestion until it exists (tested), and anchoring/automation-bias figures against the reference. Needs C4 and F3 |
| SCRUM-37 | H4 | W10 | 2 | **2.5** | 4 | Medium | High | Rework the export from one slot per annotator to one authoritative value per item, with the rest as superseded history, matching review and adjudication. Closes Critical issue 4; first link of the H4 → H3 → H2 chain |
| SCRUM-71 | I2 | W10 | 1.5 | **2** | 5 | Medium | Medium | From the break's first cases to 40, across the brief's adversarial categories, each a harness scenario. The top-up toward 60 in W11 rides on the same ticket |
| SCRUM-103 | E6 | W10 | 2 | 2 | 4 | Medium | Medium | Verify the live desks, build or delete three `notFound()` routes, scope lists, and the expert's Accept / Return / Reject on the arbitration view, on SCRUM-99's backend |
| SCRUM-104 | H2 | W10 | 2 | 2 | 3 | Medium | Medium | Manifest with counts, versions, producer and per-item provenance pointers, checkable independently. Reads F1 and F2 |
| SCRUM-105 | H3 | W10 | 2 | 2 | 4 | Medium | Medium | Checks run before anything is written; refuses on unreviewed, incomplete provenance, superseded or disputed items, naming them. Reads F1, F2 and H4 |
| SCRUM-106 | F5 | W10 | 2 | **1.5** | 3 | Medium | Low | A front-end timeline over F1's read-back; who, when, what on each entry; reachable from the review screen |
| SCRUM-72 | I3 | W10 | 1 | **1.5** | 4 | Medium | Low | An established agreement coefficient per task, AI suggestion quality and calibration against the gold fixtures. More than one point of statistics and reporting |
| SCRUM-45 | J4 | W10 | 1 | **1.5** | 3 | Medium | Low | Update (name, description, policy, team, storage), archive as read-only — enforced on every write route, not just hidden — and history. `archived` already exists as a status |
| SCRUM-40 | F4 | W10 | — | **1** | 3 | Low | Low | `actor_kind` from what happened (issue 21), the human-decisions-only filter, and the test that system entries are never attributed to a person |
| SCRUM-41 | F4 | W10 | 0.5 | 0.5 | 1 | Low | Low | Escalation entries stop repeating their summary as a change (issue 22) |
| SCRUM-85 | B3 | W10 | — | **0.5** | 6 | Low | Low | Verify first: `task_class`, `annotation_type` and the annotation surfaces (#27, #36) cover most of it. 0.5 for the gap that remains — `label_schema_ref` resolving to a result shape, and the judgement-without-verdict test — or close it |
| SCRUM-91 | B1 | W10 | — | **0.5** | 4 | Low | Low | Hardening, not net-new: org scoping confirmed by a cross-org test, and the form showing the API's errors |
| SCRUM-108 | H6 | W11 | 2 | 2 | 4 | Medium | Medium | Real releases, policy and posture on the project screens, reconciled with the task screen and dashboard. Verify rather than rebuild where screens already read live data |
| SCRUM-107 | E5 | W11 | 2 | 2 | 3 | Medium | Medium | Posture selectable, expert gate blocks completion, posture shown. **3** if G2's enforcement part is folded in (open decision in the replan file) |
| SCRUM-74 | I5 | W11 | 1 | **1.5** | 3 | Medium | Medium | Three integrity checks — provenance complete on every released item, roles on governed actions, a release rebuilt from its manifest and compared. Last sprint, so no slack if an upstream ticket slips |
| SCRUM-75 | I5 | W11 | 1 | 1 | 1 | Low | Low | The findings record, negative results included, summarising I2–I4 |
| SCRUM-88 | J1 | W11 | 1 | **0.5** | 2 | Low | Low | Organisations already have a unique `slug`. Left: confirm the URL uses it everywhere and never changes, and multiple accounts per organisation |

## Totals

| Week | Board now | Proposed | Change |
| --- | --- | --- | --- |
| W9 (with C4, without SCRUM-51 slice 2) | 12 | 13 | F1 +1, F2 +1, D3 +0.5, J2 −0.5, C4 −1 |
| W9 with SCRUM-51 slice 2 | — | 14.5 | |
| W10 (with F5) | 16 + unpointed | 20.5 | I4 +1, H4 +0.5, I2 +0.5, I3 +0.5, J4 +0.5, F5 −0.5; SCRUM-40, 85, 91 pointed for the first time |
| W11 | 9 | 7 | I5 +0.5, J1 −0.5; F5 moved out (−2) |

**W10 is now the heavy week** (20.5 against W11's 7). Inside the 12–28 range for eight people, but two moves
would even it out without breaking a dependency:
- **SCRUM-45 (J4, P2) to W11.** It needs only H1 (W9) and B4. W10 19, W11 8.5.
- **SCRUM-85 and 91 to W11** if the verification does not close them, as the roadmap already says.
  W10 18, W11 9.5.

Both are Hanchen's call; the roadmap is updated once the points and weeks are settled.

**Decided later on 2026-10-01:** Hanchen set these points on the board, and moved SCRUM-37 (H4), SCRUM-40,
41 (F4) and SCRUM-85, 91 (B3, B1) **W10 → W9** instead — none reads anything W9 produces. Result: W9 18 on
the board (19.5 with SCRUM-51's second slice), W10 15.5, W11 7. J4 stays in W10.

**Split later on 2026-10-01:** G2's enforcement left SCRUM-107 as **SCRUM-118 (G2, W10, 2 points)**; SCRUM-107
(E5, W11) goes back to 2 points. W10 17.5, W11 7. Descriptions: `jira-W11-descriptions.md`.
