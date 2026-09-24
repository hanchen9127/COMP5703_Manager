# Roadmap

Weeks are intentionally small — each one is a shippable slice of work, independently reviewable and
testable. Stories set the priority and order; from W7 the unit of work is the **SCRUM task**, planned at
1.5u–3.5u per person a week. The full text of each story lives in `shared/story_src.csv`, read through
`shared/user-stories.html`.

---

## Planning Rules

**Calendar.** The mid-semester break is its own week between W8 and W9, with its own sprint on the board
(set 2026-09-18). **No new feature is built in it.** The week goes to scenario testing of the stories
already built, fixing their bugs, and building the evaluation harness and casebook. A bug found in a
member's own story gets a new ticket in that sprint. Only the evaluation work is planned in units; testing
and bug fixing are not counted.

**Sprints end on Wednesday** (decided 2026-09-19). The client meeting is on Wednesday evening, so a
sprint runs Thursday to Wednesday and closes after the meeting; the board's sprints use the same
boundaries. W7 absorbs the change and runs ten days. W12 ends with the project on 1 Nov, so it is four
days, not seven — see `mission.md` → Risks.

| Week | Dates |
| --- | --- |
| W6 | 7–13 Sep |
| W7 | 14–23 Sep (Mon–Wed, ten days) |
| W8 | 24–30 Sep |
| Break | 1–7 Oct (the sprint for the mid-semester break, 28 Sep–4 Oct) |
| W9 | 8–14 Oct |
| W10 | 15–21 Oct |
| W11 | 22–28 Oct |
| W12 | 29 Oct–1 Nov (four days; the project ends) |

**Week boundaries** (decided 2026-09-14). A ticket in review at the end of a week counts as that week's
work. Merging it the next week is listed in that week's plan as close-out, but not counted in its load
(decided 2026-09-14). **Unfinished carry-over is not counted either** (decided 2026-09-21): a ticket planned
for one week and still open at its end moves into the next week's plan, listed but outside its load.

**Who takes what.**
- **W7 keeps the assignments already on the Jira board** and names the assignee. Rows without one are
  picked at the W7 meeting.
- **From W8, work is packed into groups** and the team decides at each weekly meeting who takes which
  group. Where the board already has an assignee, the row says so.
- Record the result on the Jira board (assignee) and in the tracker; `tracking-sync` carries it into
  `story_src.csv` at Hanchen's next sync. Hanchen's project-management work sits outside the plan.
- W11 and W12 list their work without groups; they are formed at the preceding weekly meeting, once
  carry-over is known.

**Load.** Expected workload is measured in units (**u**). **1u is two to three subtasks**, at the size the
backlog writes them — so a story with five subtasks is 2u. The anchor is the subtask list, not a clock:
everyone's week is a different number of hours, but a subtask is the same piece of work whoever holds it.

Checked against the plan on 2026-09-18: the 41 scheduled stories carry 190 subtasks across 82.5 planned
units — a median of 2.5 subtasks per unit, with the middle half between 2.0 and 3.75. So the rule
describes how these weeks were already estimated rather than imposing a new scale. At the capacity below,
a person carries roughly four to nine subtasks a week.

Counting is a sanity check, not a formula. Where a story disagrees with it, the subtask list is the thing
to re-read: D8 (7 subtasks, 5u) and F1 (5 subtasks, 4u) carry subtasks far heavier than average, while
H5's remaining 0.5u still lists four that are nearly done. **A story needing many more subtasks than its
units suggest is usually under-estimated** — that disagreement is the signal worth acting on.

| Item | Load |
| --- | --- |
| Small story (S) | 1u |
| Medium story (M) | 2u |
| Large story (L), spread over two weeks | 2u in each week |
| Close-out of work that already has code or an open PR — review, tests, merge | 0.5u; not counted when the work was in review at the end of the previous week |
| Remaining part of a story already under way, estimated in 0.5u steps | 0.5u–1.5u |

**Capacity.** Each person carries **1.5u–3.5u** a week (decided 2026-09-14). There is no cap on the
team's total, so with eight people a week holds 12u–28u. Close-out of the previous week's review queue
is not counted. From W8 a group carries 2–3u; a 3u group needs a second person for part of the week.
Planned loads: W7 20.5u, W8 20.5u, the break 6.5u (evaluation, plus one minimal feature), W9 14.5u, W10 13u, W11 13.5u and W12 3u — W12 is kept almost free for
carry-over — only four days since sprints end on Wednesday, so carry-over must be small.

**Tickets.** A ticket shared by several stories — SCRUM-49, 50, 51 and 52 — is scheduled by story part,
so it can appear in more than one week. SCRUM-51's parts are D7 (first slice W8, finished W9) and E1 (W9). D8's queues are two tickets:
SCRUM-48, the API (W7), and SCRUM-93, the screens (W8). SCRUM-52's four parts
are D8 (W9, moved from W8 on 2026-09-18), E3 and E6 (W10), and G1, which is already complete. Stories and their tickets are listed in
the tracker's *Jira Statistics* tab.

**Close collaboration.** Each week lists the work that must be done closely together: it changes the same
code or schema, or one piece's output is the other's input. Such work agrees on the interface or data
shape at the start of the week, and its authors review each other's PRs. When several groups change the
database schema in one week, they agree one migration order on day one and each appends its step to
`migrate_db_schema()` in that order — there is no Alembic to reconcile them afterwards.

**Coverage.** All 59 stories are accounted for:
- 5 were complete before W6 — A2, A3, A4, B1 and B3. The board still has To Do tickets for two of
  them — SCRUM-91 (B1, organisation scoping) and SCRUM-85 (B3, annotation vs judgement result shape);
  review them at the W7 meeting and either close them or bring the gap into W11–W12 as carry-over;
- 48 are in the weekly plans W6–W12;
- 6 are set aside — A1, A5 and K1–K4 (see `mission.md` → Stories Set Aside). Those are not planned,
  grouped or counted here.

**Order.** Priority is P0 before P1 before P2, unless a dependency says otherwise. The dependencies below
are never scheduled out of order; where both land in the same week, the prerequisite is built first:

| Prerequisite | Unblocks |
| --- | --- |
| D5 | D4 — needs `draft.annotation_id` |
| D4 | F3, H4, I4. D3 no longer waits on it: the client's answer of 2026-09-15 unblocked D3 on its own |
| D8 | D7's sampling, E1, I3 — nothing can be routed without a queue to route it into. D7's blind second review and disagreement flag (W7) route nothing, so they go first. **Since 2026-09-17 this is a dependency on D8's queues, not on an assignee: there is none** |
| B2 | D7 — D7 routes on the cross-review percentage B2 defines; also G2, E5 |
| D7 | E1, I3 — disputes and agreement both need independent second reviews |
| F1 | F5, H2, H3 |
| F2 | H2, H3 |
| C1 | C2 — SCRUM-2 calls through the interface SCRUM-54 defines; inside C2, SCRUM-1's job model lands before SCRUM-2, 3 and 5 |
| C4 + F3 | I4 |
| B6 | B4, J2 — one completion rule before lifecycle and progress figures build on it |
| H1 + H2 | H6 |
| E1 | SCRUM-52's E3 part (W10) — authorising adjudicators needs disputes opened automatically. **Not E3/E4's record itself** (changed 2026-09-21): disputes opened by hand through escalation exist today, so SCRUM-58 and 59 build the adjudication record in W8, and E1 (W9) opens that same record |
| H4 | H3 — the gate refuses superseded versions by H4's canonical-value rule |
| G2 | E5 — E5 configures escalation; G2 is the enforcement it relies on |
| F4 + F5 + J3 | I5 — the integrity checks cover provenance and roles, so both must be final |
| G5 | J3 — the member screens call the fixed invitation API |

One exception to priority order (decided 2026-09-14): J3 (P2) is in W7. It puts G5's (P0) invitation flow
on screen, is built by G5's author straight after that merge, and displaces no P0 or P1 work, because
Yi takes B6.

**Replanning.** At each weekly meeting:
1. Mark finished tickets ✅.
2. Move unfinished tickets into next week's plan *before* pulling in new work, and rebalance within the
   1.5u–3.5u each person carries.
3. If a client decision slips, the blocked group takes the **fallback** named in its row, pulled forward
   from a later week. The blocked story comes back at the first meeting after the decision arrives, in
   place of unblocked work of equal load from the following week. Stories that depend on it take their
   own fallbacks meanwhile. If a fallback has already been used, fall back to this rule directly.

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

## W6 — Governance and data-integrity fixes (7–13 Sep)
*Work done or in review by the end of W6. Marks follow the code on `origin/main`, verified 2026-09-14; the board's record is noted where it differs. Owners are the board's assignees, as a record.*

| Story | Title | Owner | Status |
| --- | --- | --- | --- |
| **D6** (SCRUM-25) | My unfinished work is mine | Hanchen | ✅ PR #13 merged; ownership guard, required viewer and unclaimed AI drafts intact on `main` (verified) |
| **G1** (SCRUM-44) | My role determines what I can do | Jingwei | ✅ PR #4 merged |
| **G3** (SCRUM-21) | My work stays inside my project | Jingwei | ✅ PR #14 merged 2026-09-14 with cross-project write guards and tests, closing issue 9 (verified); reviewed by Michael |
| **C3** (SCRUM-7, 30) | Told when the AI failed | Michael | 🟡 PR #7 merged and fabrication removed (verified); close-out tests in W9 — board: Done |
| **D2** (SCRUM-29) | Approval history can't be rewritten | Jingwei | 🟡 PR #6 merged — all four legacy review writes return `410`, closing issue 8 (verified); subtasks 2 and 4 in W8 — board: Done |
| **C5** (SCRUM-31) | Record why I decided | Parth | 🟡 PR #17 merged 2026-09-14 (verified); closure check at the W7 meeting — board: Done |
| **E2** (SCRUM-35) | Send an item back to the annotator | Parth | 🟡 PR #17 merged 2026-09-14 (verified); confirm it closes issue 15 at the W7 meeting — board: Done |
| **G4** (SCRUM-22) | Refuse states that can't exist | Dishank | 🟡 PR #9 merged 2026-09-14 (verified); confirm it closes issues 10 and 29 — board: Done |
| **B5** (SCRUM-23, 34) | Loading a dataset is all-or-nothing | Dishank, Kanishka | 🟡 PRs #9 and #11 merged (verified on `origin/main`); confirm issues 16 and 29 are closed — board: Done |
| **G5** (SCRUM-8) | I can invite someone into my organisation | Tim Chung | ✅ PR #16 merged 2026-09-17 (`8f1a7a0`); issues 17 and 18 both closed on `main` (verified 2026-09-18) — the pending-invitation listing moved to its own `/invitations` router, so nothing shadows it |

**Also Done on the board:**
- SCRUM-47 — connect the text annotation page to live APIs; not linked to any story.
- SCRUM-54, 55, 56 — C1's subtasks. SCRUM-55 is on `main` via PR #8. No `AnnotationAssistant` interface
  (SCRUM-54) exists on any branch under that or any similar name (checked 2026-09-14), so C1 continues in W7.
- SCRUM-81, 82, 84 — schema and environment fixes: database setup, restored test cases, hardcoded
  credentials removed.

## W7 — Close W6 and lock down review data (14–23 Sep) · 20.5u

**W6 close-out — listed, not counted.** This was in review at the end of W6, so it is W6's work and merges
first, before new work piles onto the same files. PRs #9, #11 and #17 have merged; SCRUM-8 remains.

| Ticket | Story | Assigned on board | Work |
| --- | --- | --- | --- |
| SCRUM-31, 35 | C5, E2 | Parth | ✅ PR #17 merged 14 Sep, reviewed by Dishank. Remaining: confirm issue 15 is closed |
| SCRUM-22, 23 | G4, B5 | Dishank | ✅ PR #9 merged 14 Sep. Remaining: confirm issues 10 and 29 are closed |
| SCRUM-34 | B5 | Kanishka | ✅ PR #11 merged (verified on `origin/main`, `5070efd`). Remaining: confirm issue 16 is closed. It rewrote about 200 lines of `task_service.py`, which SCRUM-43 and SCRUM-48's API now build on |
| SCRUM-8 | G5 | Tim | ✅ PR #16 merged 2026-09-17, reviewed by Jingwei. It closed issue 18 as well. Nothing remaining |

**W7 work**

| Ticket | Story | Load | Assigned on board | Work |
| --- | --- | --- | --- | --- |
| SCRUM-28 | D5 | 1.5u | Hanchen | ✅ PR #19 merged 2026-09-20 (`29d9bba`), reviewed by Dishank. Refuses draft create, update and submit on a finalised item; **closes Critical issue 2** |
| SCRUM-26 | D5 | 2u | Hanchen | ✅ PR #23 merged 2026-09-20 into `CS57-Hanchen`, and into `main` with PR #19 (`29d9bba`). Submission is one transaction — draft, annotation, `draft.annotation_id` (which D4 reads), item status and the `draft_submitted` history row — and **closes issue 11**. The finalised-item guard became `TaskItemFinalisedError`, mapped to 409 by the draft service, as PR #22's review asked. The submit response now returns `annotation_id`. Marked places are left inside the transaction for SCRUM-48's limit and, before the commit, for SCRUM-62's event (`routes/drafts.py:267`). Manual walkthrough passed 2026-09-20; suite 269 passed. **Kanishka merged it with a comment rather than a formal Approve — the review record is that comment** |
| SCRUM-6, 54, 92 | C1 | 1.5u | Yi | First, on day one: SCRUM-54 is Done on the board, but no `AnnotationAssistant` interface exists on any branch — confirm or reopen it, and deliver it before Michael's worker needs it. SCRUM-92: make the MVP's output fit the existing annotation editing page. SCRUM-55 was delivered by PR #8 |
| SCRUM-1, 2 | C2 | 2u | Michael | Job models first — SCRUM-2, 3 and 5 all read and write the job row — then the worker, which calls through SCRUM-54's interface. ▶ **2026-09-18:** PRs #20 (docs) and #21 (SCRUM-1 tables) **merged unchanged**; #22 (SCRUM-2 worker) in review; reviews in `docs/reviews/W7/`. **Option B — a worker polling the job tables — confirmed at review of #20**, on the condition of WAL and `busy_timeout` on SQLite (carried by SCRUM-94). Follow-ups carried from the merged PRs: #20's §9 to be corrected to the answers given; #21 was approved with two nits, and a run's result must still be able to point at an annotation (the client's AI answer) — a `result_annotation_id` column, which now needs a `migrate_db_schema()` step and belongs with SCRUM-46 if the #22 review's recommendation is taken. #22: base branch still the merged `CS57-Michael-scrum-1-job-schema`, to be retargeted to `main`; changes requested — lease ownership on write, `max_attempts` enforced on reclaim, reclaim errors must not end the worker. The worker ships behind `HEJ_AI_EXECUTION_MODE`, default `inline` |
| SCRUM-20, 50 (B2 part) | B2 | 2u | Jingwei | Approvals required, cross-review percentage, disagreement rule; frozen per task. **Changed by the client's answer R1-7 (2026-09-21):** a policy may change after work starts, as a new version — new work follows it, and each item keeps the version that governed it. A freeze that refuses the change is not what the client asked for; it can stand only as the first step, before F2 adds versions (W9). Tell Jingwei before SCRUM-20 merges. D7 samples on this percentage in W9. PR #17 has merged, so the policy files are clear. Both tickets are In Progress on the board, but SCRUM-50's G2 part belongs to W11. SCRUM-48's API is built this week by Kanishka and reviewed by Jingwei; Kanishka builds its screens, SCRUM-93, in W8 |
| SCRUM-94 | C2 | 3u | Parth | **Added 2026-09-17, rescoped 2026-09-18; Parth's only W7 ticket.** ✅ **PR #24 merged 2026-09-20 (`1c0c874`), reviewed by Hanchen** — approved after `486d4a2` fixed the two blocking findings; review in `docs/reviews/W7/review-cs57-parth-scrum-94.md`. Move the platform onto PostgreSQL, **keeping SQLite working**. **PostgreSQL is the default everywhere, not only under Docker** (changed 2026-09-19 at Parth's request; it was an opt-in `DATABASE_URL`). **No automatic fallback** (decided 2026-09-20 at review of #24, replacing the fallback wording): the URL is built from `POSTGRES_USER`, `POSTGRES_PASSWORD` and `POSTGRES_DB` in `apps/hej-api/.env`, and with neither those nor a `DATABASE_URL` **startup stops with an error naming what to set** — a silent fallback would let someone believe they are testing Postgres when they are not. SQLite is selected explicitly with `DATABASE_URL=sqlite:///./hej_dev.db`, which always wins over the components; the test fixture still defaults to in-memory SQLite. **Everyone had to add the three `POSTGRES_*` values to their `.env` on merge day**, or set the SQLite URL; a stale `DATABASE_URL` in `.env` silently wins and has to be removed. Add the driver; set the session time zone to UTC so existing `DateTime` columns are not silently stored as local time — **alongside, not instead of, SCRUM-1's `UtcDateTime` column type**, which must not be stripped. Document a **setup path that does not need Docker**. Record what happens to a schema change from now on — Alembic, or dev databases are disposable and re-seeded — because `migrate_db_schema()` returns early for anything that is not SQLite. **Make the tests reach Postgres**: the 10 test files that touch a database all hard-code an in-memory SQLite engine, so a Postgres CI job would pass without testing Postgres at all. Add a shared fixture that takes the engine from `DATABASE_URL` (in-memory SQLite by default) with per-test isolation, move the 10 files onto it, and **add a CI workflow** running the suite on SQLite and on a Postgres service container on every push. This reopens A1 for CI only. **SQLite pragmas** (decided 2026-09-18 at review of PR #20): set `PRAGMA journal_mode=WAL` and an explicit `busy_timeout` in `database.py`'s `connect` hook — the condition on which C2's Option B was agreed, because a separate worker is the second SQLite writer that otherwise fails with `database is locked`. Missed from the board description and so missed by the first implementation; landed in `486d4a2` with tests that exercise the WAL guarantee, which unblocks `HEJ_AI_EXECUTION_MODE=worker`. **Two merges were planned on 2026-09-18 and not needed**: everything, including the 10 test files, landed in the single merge of 2026-09-20. Follow-ups carried out of the review, none blocking: the `LOCK TABLE` in `_add_with_explicit_id` is wider than the race it guards and does not close it (goes in the concurrency story Parth agreed with Dishank); `env_file` now passes the whole `.env`, provider keys included, into the postgres container; CI runs every job twice (`on: push` has no branch filter); no startup line names the database in use |
| SCRUM-39 → 62 | F1 | 2u | Yi (SCRUM-39; SCRUM-62 unassigned) | Start, after SCRUM-54: provenance event record, separate from the audit log. SCRUM-39's other subtask, SCRUM-63 (F5), is in the W7 sprint on the board but belongs to W11 — it needs F1's events and F3's supersession (W9) |
| SCRUM-43 | B6 | 2u | Dishank | One `is_item_finished()` rule for task completion and export readiness; closes issues 19 and 27. On PR #9's status validation and after PR #11. Agree the predicate's signature with Kanishka on day one |
| SCRUM-48 (API) | D8 | 2u | Kanishka; Jingwei reviews | After PR #11. **Rescoped 2026-09-17** — no assignee, no assignment endpoints, no reassignment: a task owner does not hand items to named accounts. Instead: role-checked queue endpoints, a task-level required-annotators count, and a server-side refusal of a submission once an item already has that many. **The count is of human submissions only** — the client answered on 2026-09-21 (R1-4) that an AI first pass is separate from the human annotator count, which withdraws our decision of 2026-09-18 that an AI submission counts toward it; and an annotator must not see earlier judgements on the item before submitting their own, enforced in the API. Finished items are never queued, using Dishank's `is_item_finished()` — not yet on any branch (checked 2026-09-19), so the two agree its signature and whoever merges first adds it. **The review queue's two exclusions are built here too** (decided 2026-09-19): a reviewer is never offered an item they submitted on, nor one they have already reviewed. The task-state restriction waits for B4 (W8). Moved forward from W8; SCRUM-68 moves to W8 in its place |
| SCRUM-90 | J3 | 2.5u | Tim | After SCRUM-8 merges — already In Progress on the board, so merge SCRUM-8 first. Administrator, on the members page: invite a person, see pending invitations, remove a member, assign and change roles, and a role change takes effect on what that person can do (G1). Invitee: see my pending invitations and accept one — G5's missing screen, added to J3's scope. No schema change expected. Moved forward from W11 |

**Load by person** — W7 work only; each person carries 1.5–3.5 units.

| Person | W7 work | Load (units) |
| --- | --- | --- |
| Hanchen | SCRUM-28, 26 | 3.5 |
| Yi | SCRUM-6, 54, 92, then SCRUM-62 (F1) | 3.5 |
| Parth | SCRUM-94 | 3 |
| Tim | SCRUM-90 | 2.5 |
| Michael | SCRUM-1, 2 | 2 |
| Jingwei | SCRUM-20, 50 (B2 part) | 2 |
| Dishank | SCRUM-43 | 2 |
| Kanishka | SCRUM-48 (API) | 2 |

With SCRUM-63 on the board as well, Yi would carry 5.5 — over the range; it moves back to W11.

**Why this order.** W6's review queue merges first — PRs #9, #11 and #17 already have, so B6 and SCRUM-48's API
start from the merged `task_service.py`. Assigned work stays where the board put it, except where a dependency does not allow it.
Parth's SCRUM-51 routing needs D8 and B2, so its first slice needs neither — and on 2026-09-18 that slice moved to W8, so Parth could take SCRUM-94 alone; SCRUM-52 waits
for D8 (its queue part is now W9); its E3 part is no longer blocked, but the client's answer changed its design (W10). Jingwei's three tickets would be about three person-weeks
in one. F1 is the longest chain in the plan — F5, H2, H3 and I5 sit behind it — B6 unblocks B4 in W8, and
D8's API lands a week early, so W8 builds the screen and the queues on it from day one — D7's sampling, E1, I3
and SCRUM-52 all wait on the queues. SCRUM-90 is the one exception to priority order: without it a second
person can only be onboarded through the API, Tim builds it straight after his own SCRUM-8 merge, and it
displaces no P0 or P1 work. Dishank and Kanishka pair on the task-item layer: B6 decides which items are
finished, and the queue API must never offer them.

**Close collaboration**

| Work | Why |
| --- | --- |
| SCRUM-54 ↔ SCRUM-2 | Michael's worker calls through Yi's interface — agree it on day one |
| PR #11 (merged) → SCRUM-43, SCRUM-48 (API) | Both build on PR #11's rewrite of `task_service.py` — merge `main` into both branches before continuing |
| SCRUM-43 ↔ SCRUM-48 (API) | Dishank and Kanishka: one `is_item_finished()` for completion, export and the queues — agree its signature on day one, and review each other's PRs |
| SCRUM-48 (API) ↔ SCRUM-51 | W9 samples the blind second review into this queue model, which must exclude the first reviewer — Parth reviews the API PR |
| SCRUM-48 (API) ↔ SCRUM-62 | Taking and submitting an item are provenance events and must use F1's record; F4 corrects actor types in W11. **Decided 2026-09-19:** "taking" is SCRUM-25's draft ownership — a user's own `create_draft`, or `_claim_fields` setting `created_by`. SCRUM-48 records it now as a `draft_started` history row through one helper (`record_item_taken`), and SCRUM-62 migrates that helper to F1's event record. Both change the schema — the task's required-annotators count and the event table: one migration order, agreed on day one |
| SCRUM-43 ↔ SCRUM-62 | F1's events record only states B6 and PR #9 treat as reachable — never the non-existent `approved` |
| SCRUM-26 ↔ SCRUM-62 | Submission is the first decision point that writes a provenance event |
| SCRUM-26 ↔ SCRUM-2 | Michael's worker applies SCRUM-28's finalised-item guard before writing AI output, and catches its `HTTPException`. When SCRUM-26 turns the guard into a domain error, the worker's `except` changes with it — tell Michael which PR lands first |
| SCRUM-8 → SCRUM-90 | The member screens call the fixed invitation API; SCRUM-8 merges first. If its review stalls, SCRUM-90 carries into W8 |
| SCRUM-90 ↔ SCRUM-48 (API) | Role-checked queues must reflect a role change at once — agree how current roles are read |
| SCRUM-90 ↔ SCRUM-62 | Invitations, removals and role changes are governance events F1 will record — agree the event fields |
| PR #17 ↔ SCRUM-62 | E2's send-back is a decision point F1 will record — agree the event fields. SCRUM-51's second review and SCRUM-86's guard join them in W8 |
| SCRUM-94 ↔ everyone | ▶ **Merged 2026-09-20.** It changed `app/core/database.py`, which every ticket runs on. Anyone with an open branch merges `main` and re-runs the suite, and adds the three `POSTGRES_*` values to `apps/hej-api/.env` (or an explicit SQLite `DATABASE_URL`) before the API will start. Open at the merge: #25 (Jingwei), which also touches `database.py`, `db_store.py`, `init_data.py` and `db_schema_strategy.md`, and #22 (Michael) |
| SCRUM-94 ↔ SCRUM-1, 2 | ▶ **Done 2026-09-20:** the WAL and `busy_timeout` pragmas shipped, so `HEJ_AI_EXECUTION_MODE=worker` is unblocked on SQLite, and `test_ai_job_schema.py` is on the shared fixture with its time-zone tests reaching Postgres. **#22 must now change two things**: its `ai-worker` compose service hard-codes `DATABASE_URL: sqlite:////data/hej_dev.db`, so merged as it stands the API runs on Postgres while the worker polls a SQLite file and no batch is ever picked up; and its new `tests/test_ai_batch_worker.py` builds its own in-memory SQLite engine, leaving the worker the one part of C2 the Postgres CI job does not cover |

**Project management (outside the plan):**
*Checked against the board and the tracker on 2026-09-18.*

- ✅ Client decisions on B4, D3 and E3 — answered between 2026-09-15 and 2026-09-17. **D4 remains**, now
  as follow-up F1: which version a release carries. Ask it at the next client meeting.
- ✅ SCRUM-62 assigned to Yi. ✅ Reviewers recorded for PRs #14 and #17, and PR #11 logged.
- ✅ SCRUM-48 and SCRUM-93 each have their own scope (rescoped 2026-09-17 and 2026-09-18, with no
  assignment).
- ✅ PRs #20, #21 and #22 (Michael, C2) reviewed on 2026-09-18 — `docs/reviews/W7/`.
- **Still open:**
  - ✅ Reviews sent: #21 approved and #20 answered (2026-09-18); #22 changes requested (2026-09-19), plus a
    comment on catching `TaskItemFinalisedError` from SCRUM-26. **Still to do:** tell Parth that SCRUM-94
    now carries the SQLite pragmas.
  - **Where the AI's output becomes a submitted annotation** (client answer of 2026-09-17). #22 keeps
    today's unclaimed pending draft. Decided 2026-09-19: SCRUM-46 (W8, group 5), together with the `result_annotation_id` column.
  - **SCRUM-54** is Done on the board, yet no `AnnotationAssistant` interface exists on any remote branch
    (checked again 2026-09-18). Yi confirms or reopens it.
  - **SCRUM-63** is still in the W7 sprint; it belongs to W11 (Yi).
  - **SCRUM-93** is not linked as blocked by SCRUM-48.
  - **SCRUM-90**'s description still lacks the invitee's acceptance screen.
  - **SCRUM-50, 51 and 52** are not split by story part; SCRUM-50 and 51 are In Progress as whole
    tickets. SCRUM-51 runs W8–W9; SCRUM-52's E3 and E6 parts are 4u in W10 and need a second person.

**Exit check:**
- ✅ The G5 fix is merged (PR #16); PRs #9, #11 and #17 already were.
- ✅ Critical issue 2 is closed (SCRUM-28, PR #19); 6 and 8 already were, and stay closed. High issue 11 is closed too (SCRUM-26, PR #23). **Issue 7 moves to W8** with SCRUM-86, to make room for the Postgres migration.
- The platform runs on PostgreSQL and on SQLite, CI runs the suite on both on every push, and how a schema change reaches a Postgres database is written down.
- ✅ Three of the four client decisions are answered and written down — B4, D3 and E3. D4 continues as
  follow-up F1.
- A task's review policy — approvals, cross-review percentage, disagreement rule — is set and recorded. A change after work starts is a new policy version, never an edit of the old one (client answer R1-7, 2026-09-21); the versioning itself is F2's (W9).
- F1 records its first decision point.
- An annotator, a reviewer and an adjudicator each see only the work their role allows, and an item stops being offered once it has as many human submissions as its task requires — the AI's first pass is not counted (R1-4).
- An administrator invites a colleague from the members page; the colleague accepts on screen and gains access.

## W8 — Work reaches the right person; history becomes real; disputes get their own record (24–30 Sep) · 21.5u

*Allocated 2026-09-21. Points are story points on the board and equal units (1u = two to three subtasks),
re-estimated from each ticket's current scope. Carry-over from W7 is listed but not counted (see Week
boundaries).*

| Group | Ticket | Story | Load | Owner | Work |
| --- | --- | --- | --- | --- | --- |
| **1** | SCRUM-93 | D8 | 2.5u | Kanishka | The available-work list, filtered to what the viewer's role allows; open an item directly; show how many are working it and how many have submitted, as 2 of 3, with Annotate greyed out at the limit — on W7's queue API. The web app's "X is annotating this item" block goes: several annotators per item is the rule now. **Also fixes S10** (found in SCRUM-26's walkthrough): on a returned item, Save draft reverts the editor to the previous submission, because `selectDraftForViewer` prefers the viewer's submitted draft over their pending one and the editor's effect is keyed on the whole item. 2u → 2.5u for S10 |
| **2** | SCRUM-86, SCRUM-51 (D7 part), D2 remainder (new ticket) | D1, D7, D2 | 3.5u | Parth | SCRUM-86 (1u), moved from W7: D1 criterion 3, the self-decision guard on escalation and dispute decisions, closing Critical issue 7, in `review_actions.py`. **Merge it in the first two days** — group 8 rewrites `decide_escalation` on top of it. SCRUM-51's first slice (1.5u), needing neither D8's queues nor B2's percentage: a second reviewer cannot see the first decision until their own is submitted, and two distinct reviewers' verdicts are compared to flag disagreement; W9's sampling builds on it. D2's subtasks 2 and 4 (1u, new ticket — SCRUM-29 is Done on the board but these have no code): the review-action path always moves item status, and a test proves state and history cannot diverge. Same file as SCRUM-86 |
| **3** | SCRUM-27 | D4 | 2u | Jingwei | The reviewer selects the correct submitted annotation, using SCRUM-26's `draft.annotation_id`; closes issue 3. Review can be built on per-author versions now; only the released-version rule waits on follow-up F1. Jingwei pulled it into the W7 sprint on the board; it is planned W8 work, so it counts here |
| **4** | SCRUM-101, SCRUM-111 | E1, B7 | 3u | Yi | **Changed on the board 2026-09-24** — F1 (SCRUM-98) left W8 for W11, unassigned; Yi takes these two instead. SCRUM-101 (1u, moved forward from W9): the disagreement flag opens a dispute automatically, on the same dispute record group 8 defines. SCRUM-111 (2u, moved forward from W11): JSONL import, one item per source record, the payload projected by the task (client answer R1-1) — **ADR first** |
| **5** | SCRUM-3, SCRUM-46 | C2 | 3u | Michael | SCRUM-3 (0.5u → 1.5u): retry with backoff and dead-letter policy, plus the five follow-ups from PR #22's review — test the lease fence's owner check, take `worker_id` from the claim, move the worker tests onto the shared fixture, re-check expiry in the sweep's UPDATEs, dead-letter analyzer failures at once with the real error. **Until the fixture and sweep items land, no worker mode on PostgreSQL and no second worker.** SCRUM-46 (1u → 1.5u): trigger a run, and AI output as an annotation submitted by the AI through SCRUM-26's atomic path, with `result_annotation_id` on `ai_item_jobs`. **Amended 2026-09-23 at review of PR #29:** the annotation's `created_by` stays NULL — it is an FK to `users`, and the model is recorded in `annotation_data.metadata.ai` instead; an AI author identity of its own moves to SCRUM-38 (F3). A dead-lettered item must also be re-runnable, which #29 does not do yet |
| **6** | SCRUM-89 | J2 | 2u | Tim | **Reassigned 2026-09-22** — Michael asked for SCRUM-5 back (he had already planned it as one piece with SCRUM-1–3, and its fields are still moving under his two open PRs) and counts it as his mid-semester-break allocation, delivered early; Tim agreed. SCRUM-89's own blocker cleared: SCRUM-43 (the counting rule the board description names) merged as PR #26 on 2026-09-20. Read-only project overview — status, item counts by state, basic workflow figures, reconciled with the task and export screens — deliberately limited, not an analytics product. Coordinate the state names with Dishank's SCRUM-24 (B4, same week); scope this week to what SCRUM-24 has landed by the time Tim builds it, finish the rest in W9 if it lands late |
| **7** | SCRUM-24 | B4 | 2.5u | Dishank | The task lifecycle is ours to define (client: "anything reasonable"): `draft → active → completed`, with `paused` from `active`, the project manager triggering each step, completion only once every item is finished, and no new items once active. Activate, pause, complete; intake closes; closes issue 28. Builds on Dishank's own B6 rule, and adds the task-state check to W7's queue API. **Issue 30** — deleting a task that has items — belongs here too, policy first. 2u → 2.5u for issue 30 |
| **8** | SCRUM-58, SCRUM-59 | E3, E4 | 2.5u | Hanchen | **Moved forward from W10 on 2026-09-21** — split out of the SCRUM-36 container. SCRUM-58 (1.5u): an adjudication is its own record, referencing the item, the dispute and the conflicting decisions it resolves; **rescoped 2026-09-24 by the client's answer R2-1, which corrects Q4:** the adjudication is final for the dispute and does **not** return to a reviewer. It records one of three outcomes with a required reason — **Accept** (one existing judgement becomes the resolved answer, canonicalised through the adjudication), **Return** (the item goes back to the open workflow; until D9's reopen lands in the break, it is set back to open work) or **Reject** (the dispute closes without a winner; the item stays unresolved). SCRUM-59 (1u): resolving adds a resolution and never overwrites or deletes the conflicting decisions; history shows the item was contested, and an *ambiguous/unresolved* resolution is recorded as its own outcome. Disputes opened by hand through escalation exist today, so this does not wait for E1; E1 (W9) then opens the same record automatically. Load unchanged |

**Carry-over from W7 — listed, not counted.** Each continues with its owner; its board points stay on the
ticket but are not part of the load above.

| Ticket | Story | Owner | Remaining |
| --- | --- | --- | --- |
| SCRUM-48 | D8 | Kanishka | The queue API; SCRUM-93 builds on it, so it merges first |
| SCRUM-90 | J3 | Tim | Member screens and the invitee's acceptance screen |
| SCRUM-50 (B2 part) | B2 | Jingwei | Phases 1, 2 and 5 of his plan: project policy as a resolver input, the new `ResolvedPolicy` fields, the published contract. Phases 3 and 4 go with G2 in W11. Board estimate 1 → 1.5 |
| SCRUM-39 (W7 start) | F1 | Yi | Superseded 2026-09-24: SCRUM-39 was replaced by SCRUM-98, which the board moved to W11 unassigned. Whatever of the W7 start is on a branch stays there until F1 resumes |

**Load by person** — counted W8 work only; each person carries 1.5–3.5 units.

| Person | W8 work | Load (units) |
| --- | --- | --- |
| Parth | SCRUM-86, SCRUM-51 (D7), D2 remainder | 3.5 |
| Michael | SCRUM-3, SCRUM-46 | 3 |
| Hanchen | SCRUM-58, SCRUM-59 | 2.5 |
| Kanishka | SCRUM-93 | 2.5 |
| Dishank | SCRUM-24 | 2.5 |
| Jingwei | SCRUM-27 | 2 |
| Yi | SCRUM-101, SCRUM-111 | 3 |
| Tim | SCRUM-89 | 2 |

Tim was kept below 1.5u on counted work by decision (2026-09-21): SCRUM-90's carry-over filled the rest of
his week, and nothing was added before it landed. **Superseded 2026-09-22** by the SCRUM-5 ↔ SCRUM-89 swap
above — SCRUM-90 is now In Review, so the same caution no longer applies at full strength; W8's total moves
19u → 20.5u (SCRUM-89 is 2u on the board, its full original estimate).

**Board changes for W8:** SCRUM-63 (F5) leaves the W8 sprint for W11 — it needs F1 and F3. SCRUM-36 is a
container with no points; its children carry them.

**Board changes of 2026-09-24** (the board is the source; roadmap follows): F1 (SCRUM-98) W8 → W11,
unassigned; E1 (SCRUM-101) W9 → W8, Yi; B7 (SCRUM-111) W11 → W8, Yi; D9 (SCRUM-110) and B8 (SCRUM-112)
into the break; SCRUM-52 W9/W10 → the break. **Risk:** H2 and H3 (W10) and F5 (W11) need F1's events, and
W10's release gate refuses a release with incomplete provenance — with F1 in W11, W10 builds against an
event record that does not exist yet. See W10 and W11.

**Subtasks that span sprints become tasks** (found 2026-09-21): Jira keeps a subtask in its parent's
sprint, so a parent's children cannot be planned into different weeks. Each child the roadmap places in a
different week from its siblings is converted to a Task whose description opens `Related to user story X`
(so `tracking-sync` still maps it) and then `Part of SCRUM-NN`. Now: SCRUM-58, 59 (from SCRUM-36) and
SCRUM-63 (from SCRUM-39). Before their weeks: SCRUM-57, 60, 61 (SCRUM-36) and SCRUM-64 to 67 (SCRUM-42).
SCRUM-62 stays a subtask of SCRUM-39, both in W8. SCRUM-36 and SCRUM-42 become containers — no points, no
sprint — and close once every task split from them is Done.

**Why this order.** D8 is the week's centre: D7, E1, E2's return-to-queue and I3 all need a queue to put
work into. Its API lands in W7, so the screen and the role-checked queues start on day one. D4 follows D5
from W7 and, with F1's events, fixes what every later review and release record points at. C2 finishes
the week after its job models, and B4 lands as soon as B6's completion rule exists. E3 and E4 come forward
so the break week's scenario tests can run review → escalation → adjudication → Accept, Return or Reject on
the right records; E1's automatic disputes follow in W9. The adjudicator queue and the second-review queue
(SCRUM-52's D8 part) follow in W9, where D7's sampling is their first user. I1 moved to the break week,
which the board gives to evaluation.

**Close collaboration**

| Groups | Why |
| --- | --- |
| 2 → 8 | SCRUM-86 and SCRUM-58 both change `decide_escalation`. SCRUM-86 merges in the first two days; group 8 builds on it |
| 8 ↔ W9's SCRUM-57 | E1 opens the dispute record E3 defines — agree its shape before W8 ends |
| 7 ↔ W7's SCRUM-48 API | Work is only offered in the task states B4 defines; group 7 adds that check |
| 3 ↔ 4 | D4 fixes which annotation a review points at; provenance events reference the same link |
| 6 ↔ 7 | SCRUM-89's status figures read the states SCRUM-24 (B4) defines — agree the names on day one; scope group 6 to what has landed if group 7 runs late |
| 1 ↔ W7's SCRUM-48 | SCRUM-93 is SCRUM-48's screen; S10's draft-selection fix is part of it |
| 3, 4, 5, 7, 8 | Five groups change the schema — review link, event table, job retry fields and `result_annotation_id`, task states, adjudication record. One migration path, agreed on day one |

**Exit check:**
- An annotator picks work from the available-work list, filtered to what their role allows, and Save draft on a returned item keeps what was typed.
- A second reviewer cannot see the first decision, and two reviewers' disagreement is flagged.
- A disagreement between independent reviews opens a dispute automatically, and a JSONL file imports as one item per record.
- A 1,000-item AI batch completes with failures shown, and its progress is visible.
- A task can be activated and completed, and the queues respect its state.
- An expert's adjudication is its own record with an Accept, Return or Reject outcome and a reason, is final for the dispute, and leaves the conflicting decisions visible.

## Break — Scenario testing, bug fixes and the evaluation harness (1–7 Oct) · 12u, minimal new feature

The mid-semester break has its own sprint on the board, and its goal is the plan: **minimal new feature
this week** (changed 2026-09-22; it was "no new feature"). Everyone scenario-tests the stories already
built and fixes what they find. A bug in your own story gets a new ticket in this sprint. The evaluation
harness and casebook are the one planned piece of build work, and groups 3–6 below are the recorded
exceptions to "minimal", with groups 4–6 added on 2026-09-24. Testing and bug fixing are not counted in units. Whoever is not in groups 1–6
spends the week on them.

| Group | Ticket | Story | Load | Work |
| --- | --- | --- | --- | --- |
| **1** | SCRUM-68, 69 | I1 | 3u | Moved from W8 and W9 on 2026-09-18, following the board. Harness skeleton, one scripted scenario against a seeded database; then repeatable runs, pass/fail per scenario, comparable across runs. A 3u group — two people for part of the week. No assignee on the board yet: pick at the W8 meeting |
| **2** | SCRUM-70 | I2 | 2u | Moved from W9. Casebook structure and the adversarial categories from the brief. Its first cases are the week's scenario tests, and the bugs they find. No assignee on the board yet |
| **3** | SCRUM-5 | C2 | 1.5u | **Added 2026-09-22.** Michael's own request: he'd already planned it as one piece with SCRUM-1–3, and wanted it delivered alongside them rather than handed to Tim mid-week (whose SCRUM-5 slot became SCRUM-89 in W8 instead). Batch progress and per-item job status — an endpoint and a view, reading the job tables his own W8 tickets change |
| **4** | SCRUM-110 | D9 | 1.5u | **Added 2026-09-24**, Hanchen (client answer R2-3). The project owner reopens a finalised item with a reason; the item returns to the open workflow and the finalised answer stays as a superseded version. Requests from other roles are out of scope. W8's Return (E3) switches to this path |
| **5** | SCRUM-112 | B8 | 2u | **Added 2026-09-24**, Yi (client answer R2-6). A task-level `annotation_type` picks the editor; subtypes become templates. ADR first |
| **6** | SCRUM-52 | D8, E3 | 2u | **Moved from W9 and W10 on the board, 2026-09-24**, Parth. The adjudicator queue and authorisation: only an arbitrator adjudicates, never on work they annotated or reviewed (R2-8); the second-review queue excludes the first reviewer. Builds on W8's dispute record |

**Why this order.** Evaluation is a primary deliverable and was at zero. Giving it a week with no feature
work alongside means I1 now finishes with W9 still between it and the W10 measurements that depend on
its repeatable runs (SCRUM-72 and 73) — a week of slack it did not have before. The scenario tests are also the casebook's first entries.

**Close collaboration**

| Groups | Why |
| --- | --- |
| 1 ↔ 2 | Casebook cases are harness scenarios. Agree the case format on day one |
| 1, 2 ↔ everyone testing | Each scenario test that finds a bug becomes a case, and its fix ticket names it |
| 1 ↔ W8's group 5 | C2's batch runs become harness scenarios. Failed and dead-letter items are casebook cases |
| 4 ↔ W8's group 8 | E3's Return adopts D9's reopen path |
| 6 ↔ W8's group 8 | The adjudicator check reads the dispute record E3 defines |

**Exit check:**
- Every story complete by W8 has been scenario-tested, and every bug found has a ticket in the break sprint.
- The harness runs one scenario, then runs repeatably and reports pass or fail per scenario.
- The casebook structure exists with its adversarial categories and its first cases.
- The project owner reopens a finalised item; the old answer stays in its history, and anyone else's reopen is refused.
- The adjudicator queue respects roles and independence.

## W9 — Cross-validation, supersession, release artefact (8–14 Oct) · 12.5u

| Group | Ticket | Story | Load | Work |
| --- | --- | --- | --- | --- |
| **1** | SCRUM-51 (D7 and E1 parts), SCRUM-57, 49 (E1 part) | D7, E1 | 2u | Board: Parth on SCRUM-51. D7 first: sample items by B2's cross-review percentage (W7) and place them in the second-review queue group 7 builds first this week, which excludes the first reviewer. **E1's automatic dispute (SCRUM-101) moved to W8 on 2026-09-24**; what stays here is E1's release exclusion. Then E1: the disagreement flag from W7 opens a dispute automatically; disputed items are excluded from release. A 3u group — two people for part of the week |
| **2** | SCRUM-32, 49 (D3 part) | D3 | 2u | **Unblocked 2026-09-15** — different authors keep different versions, so a reviewer's correction is a version authored by the reviewer, kept alongside the annotator's rather than superseding it. Closes issue 5. No fallback needed |
| **3** | SCRUM-38 | F3 | 2u | **Unblocked 2026-09-24** (follow-up F1 answered, R2-2): AI, annotator, reviewer and adjudicator outputs kept separate; at most one is marked the authoritative resolution, and every other version stays linked as provenance — "do not flatten the history into only the final answer". The AI model becomes a recorded field, not a note (R2-5). No fallback needed |
| **4** | SCRUM-87, 7, 30 | C4, C3 | 2.5u | Two production modes, human-only and AI-first; mode recorded per item. Blind-then-reveal is an evaluation protocol and moved to I4 (client answer R1-2, 2026-09-21). On the same review screen, C3's close-out tests: a failed assist leaves no draft, and "no AI suggestion" is visible |
| **5** | SCRUM-53 | F2 | 2u | Versioned guidelines, sources and review policies; guideline and source version recorded on every annotation, policy version on every item (R1-7). H2 and H3 need it by W10 |
| **6** | SCRUM-64 | H1 | 2u | Immutable release artefact with a stable id, unaffected by later edits |

**Why this order.** D7 needs both B2's percentage and D8's queues. W7 delivers the percentage, and group 7 builds the reviewer queue first; E1 follows in the same group because W7 already flags disagreement. D3, F3, C4
and F2 all change what is stored per annotation, so they share one week and one migration order. F3 and C4
are the two inputs I4 measures in W10, on the harness the break week built. H1 starts the release chain so H2, H3 and H4 have an artefact to work on.

**Close collaboration**

| Groups | Why |
| --- | --- |
| 1 ↔ 4 | Both control what a reviewer sees before deciding, on the same review screen |
| 2 ↔ 3 | One supersession model: D3 writes the superseding version, F3 keeps and displays both |
| 2, 3, 4, 5 | All four change the annotation record — superseding version, output separation, AI mode, guideline version. One migration order, agreed on day one |
| 3 ↔ 6 | A release must pin the authoritative version F3 marks |
| 4 ↔ harness (break) | C4's modes are the conditions I4 compares on the harness next week |

**Exit check:**
- A second review never reaches the first reviewer.
- 30% of items route to a second reviewer.
- A correction lands and the original stays visible.
- A release artefact exists.
- A disagreement between independent reviews opens a dispute.
- C3's close-out tests pass.

## W10 — Disputes end to end and the release gate (15–21 Oct) · 12u

| Group | Ticket | Story | Load | Work |
| --- | --- | --- | --- | --- |
| **1** | SCRUM-37 | H4 | 2u | **Unblocked 2026-09-24** (follow-up F1 answered, R2-2): at most one authoritative value per item — none for an item resolved as ambiguous — with every other version kept as superseded provenance; closes issue 4. No fallback needed |
| **2** | SCRUM-66 | H3 | 2u | Refuse a release with unreviewed items, incomplete provenance or superseded versions, before it exists. **At risk (2026-09-24):** "incomplete provenance" needs F1, now in W11 |
| **3** | SCRUM-65 | H2 | 2u | Manifest: counts, versions, producer, per-item provenance pointers. The client's minimum (R2-5): release id/version, included items, the resolution selected per item, and task, guideline and policy versions. **At risk (2026-09-24):** needs F1's events, now in W11 |
| **5** | SCRUM-61, 52 (E6 part) | E6 | 2u | Board: Parth on SCRUM-52. Real cases on the dispute and arbitration screens and the adjudicator queue; build or delete the three `notFound()` routes |
| **6** | SCRUM-73 | I4 | 2u | Accept, modify and override rates and time per item, by C4 mode; the blind-then-reveal protocol (independent judgement recorded, then the AI revealed, keep or revise) to measure anchoring and automation bias (R1-2) |
| **7** | SCRUM-71, 72 | I2, I3 | 2u | Casebook to 40 cases; reviewer agreement by coefficient, not raw match |

**Why this order.** Everything here consumes W9 (and E3/E4's record from W8): E6 needs the break's adjudicator queue and E1's disputes, H4 needs F3's
supersession, H2 and H3 need F1 and F2, I4 needs C4 and F3, and I3 needs D7 and I1's repeatable runs. Two
chains run inside the week — E6 on the break's adjudicator queue, and H4 → H3 → H2 — so the first days go to the upstream
group.

**Close collaboration**

| Groups | Why |
| --- | --- |
| 5 ↔ break group 6 | Adjudication decisions are made through E6's screens, on the adjudicator queue SCRUM-52 builds in the break; the disputes E1 opens from W8 are their input |
| 1 ↔ 2 | The gate refuses superseded versions using H4's canonical-value rule; disputed items (E1, W9) are another reason it refuses |
| 2 ↔ 3 | Same release pipeline: the manifest is written only after the gate passes |
| 6 ↔ 7 | Both measure on the same harness runs and casebook |

**Exit check:**
- A disagreement opens a dispute and settles through the real screens.
- A bad release is refused and names its causes.
- A good release carries a manifest and one answer per item.
- The casebook holds at least 40 cases.

## W11 — Finish the journey on real screens (22–28 Oct) · 15.5u, not yet grouped

What W7–W10 leaves. P0 first, then P1, then P2. Groups are formed at the W10 meeting. **At 15.5u with F1 moved in (2026-09-24), the week is above its usual load** — J1 and J2 are the first to move to W12 if it does not fit.

| Story | Ticket | Priority | Est. load | Why here |
| --- | --- | --- | --- | --- |
| **H6** — The export, policy and history screens show real data | SCRUM-67 | P0 | 2u | Displays what H1 (W9) and H2 (W10) produce. Built earlier, these screens would show sample data again — the defect this story exists to remove. First in the week because it is P0 |
| **I2** — casebook toward 60 cases | SCRUM-71 | P0 | 1u | A standing commitment: the minimum of 40 is met in W10; W11 adds the cases for the surfaces built this week |
| **F1** — I can ask how any label came to exist | SCRUM-98 | P0 | 2u | **Moved from W8 on the board, 2026-09-24**, unassigned. First in the week after H6: F5, H2's per-item provenance and H3's provenance check all read its events, and I5 checks them in W12 |
| **G2** — My project's governance posture actually governs | SCRUM-50 (G2 part) | P1 | 2u | Board: Jingwei. Needs B2's policy (W7), and the posture must govern points that only exist from W9–W10: second-review routing (D7), disputes (E1) and the release gate (H3). Enforced earlier, it would be reopened every time a new point lands. Widened 2026-09-24 by R2-7 and R2-8: expert-gate and adjudication-mandatory become explicit policy fields, no expert confirms or adjudicates their own work, and no item finalises on AI output alone — the load may need re-estimating. Before E5 in the week |
| **E5** — Escalation matches the assurance my project needs | SCRUM-60 | P1 | 2u | Configures how disputes escalate, and disputes only run end to end after E1, E3 and E4 in W10. Builds on G2's enforcement, so it follows G2 in the same week |
| **F4** — History tells me who really did what | SCRUM-40, 41 | P1 | 1u | F1 records the default actor from W8 until F4 separates system from user actions and removes duplicate escalation changes (issues 21, 22). Before I5 checks provenance |
| **F5** — I can see an item's whole story on one screen | SCRUM-63 | P1 | 2u | Yi, who builds F1 — on the board it sits in the W7 sprint and moves here. Needs F1 (W8) and shows supersession as F3 (W9) records it. Before I5 checks provenance |
| **H5** — Export figures agree with the rest of the platform | SCRUM-43 (H5 check) | P1 | 0.5u | SCRUM-43 lands in W7 with B6. The remaining check — figures matching the task — waits until H1–H4 have reshaped the export path in W9–W10; written earlier, the tests would be rewritten. Log it as a follow-up against SCRUM-43 |
| **J1** — My organisation has a stable identity | SCRUM-88 | P2 | 1u | Lowest priority. Changes the organisation URL every screen links to; doing it after the other screens settle avoids breaking routes still being built |
| **J2** — I can see how my project is going at a glance | SCRUM-89 | P2 | 2u | Lowest priority. Aggregates figures whose rules — B6 (W7), B4 and D8 (W8) — are final by now; the board note says not to start before SCRUM-43 settles the counting rule |

**Exit check:**
- Every P0 story meets its Definition of Done.
- The project screens show real releases, policy and history.
- Provenance shows the right actor for every event and an item's full timeline.
- The casebook holds 40–60 cases.

## W12 — The integrity check, and room for carry-over (29 Oct–1 Nov, four days) · 3u, not yet grouped

Kept almost free on purpose: 13u of the week absorb whatever W7–W11 did not finish. Groups are formed at
the W11 meeting. Dependencies outrank priority here: I5 is P1 but goes last because it checks work that is
final only in W11.

| Story | Ticket | Priority | Est. load | Why here |
| --- | --- | --- | --- | --- |
| **J4** — I can maintain a project after creating it | SCRUM-45 | P2 | 1u | Lowest priority. Updating or archiving a project must respect B4's lifecycle (W8) and H1's immutable releases (W9) |
| **I5** — I can prove the platform's records hold up | SCRUM-74, 75 | P1 | 2u | Last on purpose. Integrity checks cover provenance (F1–F5, final in W11), roles (J3, W7) and releases (H1–H4, W10); the board lists SCRUM-74 as depending on SCRUM-69, F1 and H2. The findings record summarises I2–I4 |

**Exit check:**
- Every story not set aside meets its Definition of Done.
- The containers SCRUM-36 and 42, and the parent SCRUM-39, can close: every task split from them, and SCRUM-39's subtasks, are Done.
- The integrity checks pass on provenance, roles and releases.
- The findings record includes negative results.

W13 is not planned.
