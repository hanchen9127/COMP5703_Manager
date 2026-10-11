# Review — PR #48, `CS57-Yi` (SCRUM-99, 100, 101; item reconciliation), second round

## Update — re-review at `c196b98` (2026-10-11)

**On GitHub:** five commits after `30dfdec`: `e79f14e` platform opener and Return → `pending`, `9a3541f` the
deprecated `review_notes` projection capped at 1,000, `1abb423` merge of `main` with #58, `49ed30d` merge of `main`
with #59 that also carries the any-of read check, `c196b98` `inconclusive` → `unresolved` and `reviewed` shown as
"Reconciliation". Yi replied on 10-09 11:10 (points 1–7) and 10-10 20:59. Jingwei requested changes on 10-10 at
`9935028` (arbitrator-only expert gets 403 on reads; #59's legacy-export guard), then **approved at `c196b98` on
10-11 02:27**. Hanchen's `30dfdec` permission point (below) was never posted; Jingwei raised the same thing. 0 commits
behind `main` (`fc20566`). 87 files, +10,022 / −1,169.

**Checked locally at `c196b98`:** API on SQLite **1,439 passed, 9 skipped, 207 subtests** (Jingwei: same; PostgreSQL
1,448). Web not rerun (Jingwei: 45 files, 442 tests, `tsc` clean).

| Point | At `c196b98` |
| --- | --- |
| 1. History `description` length | ✅ (since `30dfdec`) |
| 2. Case lists filtered for the caller | ✅ (since `30dfdec`) |
| 3. Merge removed | ✅ Leftovers gone too: no `merge` in `db_models.py`, `annotation_versions.py`, the reconciliation service, schemas or the web type |
| `30dfdec` read-permission regression | ✅ List and detail accept any of `DISPUTE`, `ADJUDICATE`, `MANAGE_PROJECT` (`verify_user_can_perform_any_task_action`); opening a held case stays on `DISPUTE`, deciding on `ADJUDICATE` + independence. Test covers an arbitrator-only account (list and detail 200, open 403) and the task owner |
| Reconciliation opener | ✅ `opened_by_kind = "platform"`, null `opened_by` |
| Reconciliation Return | ✅ leaves `pending` from `reopen_task_item` |
| `expert_send_back` | ✅ said in the description: no new path writes it; the repair-on-read reads only escalation rows and `escalation_decided` audits, so the new `annotation_dispute_adjudicated` entries with `decision: return` don't feed it |
| #58 merge (`1abb423`) | ✅ Conflicts resolved keeping both sides: the correction import, `_review_history_values(...)` plus justification/feedback, `correction` beside the dispute flags on the adjustment read; the retired escalation web types dropped |
| `unresolved` rename | ✅ Matches the board's "unresolved / ambiguous" wording (SCRUM-99/100, H-stories) and #51's EV-012 (`item_status = "unresolved"`). Guards follow: `TERMINAL_TASK_ITEM_STATUSES` (draft writes refused), owner reopen, export eligibility, task completion (`canonicalized + unresolved == total`), not reviewable |
| Description | ⚠️ Stale after the last two commits — see below |

**Verdict at `c196b98`: Approve.** Nothing blocking. Three small things before merging, none needing another review:

1. **Description**: `inconclusive` three times (Annotation-level decisions, `reject_all` row, Export paragraph); the
   Permissions section still says "Dispute list/detail: `DISPUTE`"; Related Work's SCRUM-99 line doesn't mention
   reconciliation; verification figures are from an older head.
2. **`workflow_states.md` §4 (added by this PR) contradicts the code:** `Accept` "select one existing annotation as the
   resolved answer … and finalize the item" (`:187`) — it accepts the subject and continues item completion;
   `Return` "place the item in the expert send-back lane" (`:190`) — it goes to the author, and nothing writes
   `expert_send_back`; "every current submitted annotation" (`:196`) — the detail shows one subject.
3. **`api_surfaces.md` still describes the retired escalation routes as live:** `:798–804` (open escalation holds
   every submission; "if the client makes disputes per annotation" — it now does), `:831–846` (routing and deciding
   through `escalations/route` and `/decision`), `:923` (manual routing "through the existing escalation endpoint").

**Not raised on the PR:**
- `49ed30d` is a merge commit that also carries the permission fix and a test change, so `git log -p` hides them.
  Agree with Jingwei's commit-message nit; not worth a comment of its own.
- The adjudicate work queue (`task_work_queue_service.py:268`) offers open annotation disputes, not open
  reconciliations; its docstring still says "open escalations". Experts find reconciliations on the desk, so it
  works; worth a line in SCRUM-103's expert desk.
- Agree with Jingwei that the two permission checks duplicate the role query.

**For Hanchen (not on the PR):**
- Jingwei asked Hanchen to **open a ticket for the intake history bug**: a JSONL intake of
  `civil_comments_text_content_moderation_source_subset.jsonl` fails on PostgreSQL because its history
  `description` (first five item names) exceeds 255 characters. Fix direction: use `summary` for the line and keep the
  detail in `new_values`, as #57 split them.
- Jingwei's 10-10 note hands **accepting a reviewer's correction on an escalated answer to SCRUM-37 (Dishank, In
  Progress)**. That is scope on an in-progress ticket, against the 10-05 rule and against "SCRUM-37: nothing added"
  above. ADR 012 (#58) says a correction becomes the answer through an independent expert's Accept, but the
  annotation-level Accept here only accepts the disputed subject. Needs Hanchen's call on which ticket carries it.
- After #48 merges: EV-012 in #51 can be un-skipped against `unresolved`; SCRUM-121 can delete the send-back
  repair-on-read once dev databases are reset.

### Comment for GitHub (ready to paste)

**Posted (2026-10-11 02:37 UTC)** as Hanchen's **Approve** review at `c196b98`, text unchanged:
[review](https://github.com/USYD-CS-Capstone/hej/pull/48#pullrequestreview-5481629406).

**#48 merged at 02:37:33 UTC** (`41028db`), before Yi made the three doc fixes. Hanchen finished them himself the
same day: points 2 and 3 (`workflow_states.md`, `api_surfaces.md`) as commit `6e563fa` in #51, and point 1 by editing
#48's description with gh — `inconclusive` → `unresolved` (3 places), dispute reads on any of `DISPUTE`, `ADJUDICATE`,
`MANAGE_PROJECT`, SCRUM-99 including reconciliation, the merged head's figures, and an italic edit note at the end.
The description before the edit: `pr48-description-before-edit-2026-10-11.md`.

````
Thanks Yi. Re-checked at `c196b98`: the API suite passes locally on SQLite (1,439 passed, 9 skipped), the same as Jingwei's run.

Everything from my earlier comments is fixed:
- **History length and atomicity.** Fixed descriptions, the reason in `new_values`, and one commit with the decision.
- **Case lists.** Open cases are filtered through `adjudication_conflict_item_ids`, and an arbitrator-only expert can now read what they decide while opening a held case stays on `DISPUTE`.
- **Merge** is gone everywhere, constraint and version vocabularies included.
- **Reconciliation** is opened by the platform, and its Return leaves the item `pending`.
- The **#58 merge** kept the correction rules beside the dispute flags, and `unresolved` matches the board's wording for SCRUM-99/100.

**Approving.** Three small doc fixes before merging, no need for another review:

1. **The description** still says `inconclusive` in three places, lists dispute list/detail as `DISPUTE` only (it's now `DISPUTE`, `ADJUDICATE` or `MANAGE_PROJECT`), and its SCRUM-99 line doesn't mention reconciliation.
2. **`workflow_states.md` §4**, which this PR adds, describes the old item-level dispute: Accept "finalize[s] the item" (`:187`), Return goes to "the expert send-back lane" (`:190`), and the evidence view shows "every current submitted annotation" (`:196`). In the code, Accept accepts the subject and the item continues to completion or reconciliation, Return goes to the subject's author, and the detail shows the one subject.
3. **`api_surfaces.md`** still describes the retired escalation routes as live: `:798–804` (an open escalation holds every submission, "if the client makes disputes per annotation"), `:831–846` (routing and deciding through `escalations/route` and `/decision`) and `:923` (manual routing "through the existing escalation endpoint"). Pointing them at the annotation-dispute routes, or noting they return 410, is enough.
````

**On GitHub:** two commits after `9d97488` — `b03c257` justification length issue (09:54 UTC), `30dfdec` case list
conflict filtering and update annotation dispute access permission check (10:59). No reply comment, no new review,
description unchanged. 0 commits behind `main`.

**Checked locally:** API on SQLite **1,368 passed, 9 skipped**.

| Point | At `30dfdec` |
| --- | --- |
| 1. History `description` length | ✅ **Fixed, better than asked.** All three routes, and the ordinary review action too, write a fixed description, keep the justification (and feedback) in `new_values`, and record the history row **inside the decision's transaction** (`commit=False`, then one commit, rollback on error). So a failed history write now rolls the decision back instead of leaving it without history. Consequence, no change needed: the History drawer shows "Annotation dispute decision: accept" without the reason, as for reopens; `justification` is not a visible change field, so it also cannot leak to a blind reviewer; the reason stays on the dispute record and the desk |
| 2. Case lists filtered for the caller | ✅ Fixed — open cases filtered through `adjudication_conflict_item_ids` in both lists; the two list probes now pass |
| **New: read permission changed** | ❌ **Blocking regression.** `_verify_may_access_annotation_disputes` now requires `GovernedAction.DISPUTE` instead of `ADJUDICATE` or `MANAGE_PROJECT`. `DISPUTE` is held by reviewer, dispute participant and admin — not arbitrator, not task owner (`permissions.py:34–55`). Probe (`scratchpad/test_probe_pr48_access.py`), account with only the arbitrator role: list **403**, detail **403**, decision **200** (decides a case it cannot read); task owner's list **403**; a reviewer not involved in the item reads the detail **200**. The web hint `canManageAnnotationDisputes` was changed to match (admin, reviewer, dispute participant). The suite passes because its arbitrator test accounts also hold the reviewer role. Likely aim: let a reviewer open a held split from the panel (Jingwei's optional follow-up) |
| Merge leftovers | Not yet — check constraint (`db_models.py:701`), `RECONCILIATION_MERGE` / `MERGED` (`annotation_versions.py`) |
| Description, opener, `returned` | Not yet |

**Verdict at `30dfdec`: Request changes** on the permission regression only. Fix: reads (list, detail) back to
`ADJUDICATE` or `MANAGE_PROJECT`; the open endpoint may accept `DISPUTE` as well; the web hint in step; a test with an
arbitrator-only account.

## Update — check at `9d97488` (2026-10-09, evening)

**On GitHub:** Hanchen's comment (the `70cf9ea` version below, without the probe section) was **posted at 09:12 UTC**.
Yi's summary reply at 08:42 answers Jingwei's earlier rounds, not it. Three commits since `70cf9ea`: `17932dd` test:
guard retired escalation rejection (08:38), `506bffc` remove reconciliation merge decision (08:50), `9d97488` docs:
remove merge from reconciliation design (09:13). No new review. 0 commits behind `main`.

**Checked locally:** API on SQLite **1,359 passed, 9 skipped** (one new test: a legacy Reject on an incomplete first pass
gets 410 and leaves the item `disputed`).

| Point in the posted comment | At `9d97488` |
| --- | --- |
| 1. Justification into the 255-character history `description` | ❌ Not yet — `review_actions.py:1421`, `:1498`, `reconciliations.py:341` unchanged |
| 2. Case lists not filtered for the caller | ❌ Not yet — neither list function changed |
| 3. Remove Merge | ✅ Mostly. Gone from the request schema, the service, the decision route and the desk's input; a test pins that `merge` is refused (422). **Left behind:** the `ck_item_reconciliation_decision` check constraint still allows `'merge'` (`db_models.py:701`) — the comment asked for it; the read/response `Literal`s and the web read type still list `merge`; `merged_annotation_id` stays on the table; `RECONCILIATION_MERGE` / `RECONCILIATION_MERGED` remain in `DERIVATIONS` and `AUTHORITATIVE_CAUSES` (`annotation_versions.py`). Nothing reachable writes any of them, and dev databases are reset anyway |
| Smaller: reconciliation opener, `expert_send_back` note, `returned` override | Not yet |
| PR description | ❌ Not refreshed: still "Modify / merge", "No item-level vote, merge, or candidate reconciliation is implemented", no "After merging" reset note, no SCRUM-99 link for reconciliation |

**Reading:** Merge was removed before the comment was posted (`506bffc` at 08:50, after Jingwei's approval), so Yi
has probably not started on points 1 and 2 yet.

**Posted (2026-10-09):** a follow-up comment by Hanchen at head `9d97488`, listing points 1 and 2 as still open, the
Merge leftovers (check constraint, `annotation_versions.py` constants, read models, web read type,
`merged_annotation_id`), and the description refresh (tickets, `expert_send_back`, the reset under "After merging").
[Comment](https://github.com/USYD-CS-Capstone/hej/pull/48#issuecomment-6078893417).

## Update — re-review at `70cf9ea`, after Jingwei's approval (2026-10-09, afternoon)

**On GitHub:** five commits after `f20e454` — `a030564` legacy escalation route deprecated, `ef788e3` fix minor
issues, `2f58f2f` deduplication and query issues, `ac79dcc` evaluation issues, `70cf9ea` fix export's resolution
block. **Jingwei approved at 08:38 UTC** (his text says re-reviewed at `ac79dcc`; GitHub records `70cf9ea`), asking
only for the description refresh before merging. **The comment below has not been posted**: no PR comment since
10-08. Still 0 commits behind `main` (`891fc4b`). 84 files, +9383 / −1079.

**What changed:**
- **Legacy routes retired.** `POST …/escalations/route` and `…/escalations/decision` return 410; the work panel
  opens a held disagreement through `POST …/annotation-disputes/{id}/open`; the old bodies stay in
  `review_actions.py` as unregistered helpers that only tests call. This closes Jingwei's two blocking points.
- **The export's `resolution` block (`70cf9ea`)** now reads the authoritative answer whatever the `created_by`
  filter, and an inconclusive item's source is the latest rejecting decision since its last reopen; the extra queries
  run for inconclusive items only. **Both of Jingwei's export points are fixed** — his approval, written at
  `ac79dcc`, still lists them as open for SCRUM-37, which is out of date.
- Reconciliation candidates are submissions only (`is_review_submission`), ready for #58; `as_utc` replaces three
  `_utc` copies; user names loaded in one query; the open endpoint scoped to its task; `item_reconciled` filed under
  disputes; the desk shows who resolved a case and when; the six legacy expert-Return tests are back.

**Checked locally at `70cf9ea`:** API on SQLite **1,358 passed, 9 skipped, 207 subtests**. The six probes in the
appendix, rerun: **all six still fail**, unchanged.

| Finding | At `70cf9ea` |
| --- | --- |
| 1. Justification into the 255-character history `description` | ❌ Unchanged — `review_actions.py:1421`, `:1498`, `reconciliations.py:342` |
| 2. Case lists offer what the decision refuses | ❌ Unchanged (probe) |
| 3. Expert who accepted a candidate chooses it | ❌ Unchanged (probe). **Withdrawn** — decision 3 revised: accepted as a bias risk |
| 4. Agreeing answers wait; Merge unreviewed | ❌ Unchanged (probe). Jingwei's approval hands both to SCRUM-37. **Revised decision 1:** agreeing answers going to the expert is accepted; Merge is removed in #48 |
| 5. Reconciliation opened by a person | ❌ Unchanged (probe) |
| 6. `expert_send_back` decision | **Changed:** with the legacy decision retired, nothing reachable writes `expert_send_back` for new work — only the unregistered helper (`:1680`, `:1700`) and pre-reset rows. Still to say in the description. For SCRUM-121: the repair-on-read now only serves rows from before the reset, so it can be deleted rather than moved |
| 7. Legacy `GET /escalations/{id}` open to task members | Downgraded to a nit: no new escalation rows are created, so it only reads pre-reset data |
| 8. Reconciliation Return leaves `returned` | ❌ Unchanged (probe) |

**Verdict at `70cf9ea`: Request changes** on findings 1, 2 and Merge (from 4). Jingwei's approval stands for his own
points; these were never posted, and removing Merge is Hanchen's decision 1, which Jingwei's SCRUM-37 note contradicts
because nobody had told him. The comment for GitHub below is rewritten for this state.

---

2026-10-09. Head `f20e454` (= `f0c3a4e` plus `main` at `891fc4b`), base `main`, merge-base `891fc4b` (0 commits
behind). 76 files, +8256 / −924. Ready for review (no longer a draft). First round, 2026-10-03:
`../Break/review-cs57-yi-scrum-99-pr48-disputes.md`.

**On GitHub (checked with `gh pr view 48`, 2026-10-09):**
- Hanchen's combined comment of 2026-10-03 (with Jingwei's points).
- Jingwei: Changes requested three times — 2026-10-07 at `26d38b0` (six points), 2026-10-08 at `f0ca6d6` (Inconclusive
  not pushed; held manual-review split decided twice), 2026-10-09 04:46 UTC at `f20e454`, two points still blocking:
  1. a Reject on the legacy escalation route maps straight to `inconclusive`, skipping the first-pass check;
  2. last round's point 2 — a held split can still go through legacy routing and be opened again from the desk.
  Plus the export's `resolution` block (depends on the `created_by` filter; picks the inconclusive source in a fixed
  order) and the description refresh.
- Yi's response of 2026-10-08 (points 1–7, plus "8. leave reconciliation's open points to Dishank").

**Read before this review:** `mission.md`, `roadmap.md` (W9 groups 3, 4, 12; W10 groups 3, 9), `tech-stack.md`; the
first-round review; issues #40 (Yi's update of 10-03, Hanchen's A/B comment of 10-04, Jingwei's two-level proposal of
10-06) and #38; SCRUM-99, 100, 101, 37, 103 on the board export of 2026-10-09 01:03; the 10-07 meeting plan
(`../../sandbox/Break/meeting/2026-10-07-demo-and-board-walkthrough.md`); review rules of 2026-10-05.

**Client:** Hunter has **not** answered #40 or #38 in the thread. No record of an answer at the 10-07 meeting.

## Decided by Hanchen (2026-10-09)

1. **Merge is removed in #48, not handed to SCRUM-37** (revised after the `70cf9ea` re-review). SCRUM-37 (Dishank)
   is In Progress, and no scope is added to an in-progress ticket. The client never asked for Merge — R2-1 has
   Accept, Return and Reject — and as built the expert writes and approves the final answer with nobody reviewing it,
   so a bad merge would be released as the authoritative answer. **Agreeing answers still go to reconciliation**:
   answers with the same label may carry different rationales, and the expert chooses which becomes the item's
   answer. (The first version of this decision finalised agreeing answers by rule; withdrawn.)
2. **#48 no longer waits for #40.** It follows the two-level proposal the team posted on #40 on 10-06 ("the team
   would like to build it unless you see a problem"). It merges once the blocking points are fixed; if Hunter answers
   differently, the change is a follow-up. This lifts the 10-03 pause.
3. ~~Independence at reconciliation~~ **Withdrawn after the `70cf9ea` re-review.** The same expert may decide an
   answer dispute and then the item's reconciliation. It is a bias risk, not a rule breach (R2-8 covers annotating and
   reviewing), and the process does not require two experts.
4. **Item reconciliation belongs to SCRUM-99** (the item-level dispute: R2-1's "accept one of the existing
   judgements"). No new ticket; SCRUM-99's description gains a paragraph (draft below).
5. **Findings 1 and 2 are fixed in #48** (decided after the `70cf9ea` re-review). The history length is not solved
   by a 255-character limit in the web form, since the API accepts 2,000 and other clients bypass the form: the fix is a
   fixed description with the reason in `new_values`. The case-list filter stays in #48 rather than moving to
   SCRUM-103.

## Verdict

**Request changes.** Agree with Jingwei's two open points; four more blocking points below. Locally on SQLite: API
**1,330 passed, 9 skipped, 207 subtests** at `f20e454` — the same as Jingwei's run. Not run on PostgreSQL (no
local server). Web not run (Jingwei: 44 files, 431 tests, `tsc` clean).

## Earlier points (Hanchen, 2026-10-03)

| # | Point | At `f20e454` |
| --- | --- | --- |
| 1 | No item lock on the decision | ✅ The new decision locks the dispute row, then the item; the legacy route locks the item |
| 2 | Reject maps to `rejected` | ✅ `inconclusive`, terminal, with export and owner reopen |
| 3 | Adjudication on the escalation row | ✅ `annotation_disputes` and `item_reconciliations` are their own records |
| 4 | Reason in the 255-character history `description` | ❌ **Not fixed, and repeated on three new routes** — finding 1 |
| 5 | Stale evidence from `is_latest` | ✅ Pinned version, triggering review ids, review window |
| 6 | Evidence endpoint open to any task member | ✅ for the annotation-dispute routes (ADJUDICATE or MANAGE_PROJECT). The legacy `GET /escalations/{id}`, added by this PR, still checks task access only — finding 7 |
| 7 | Legacy `finalize` / `send_back` | ✅ Normalised. Legacy `reject` is Jingwei's point 1 |
| 8 | Return through the repair helpers | Answer-level Return is by design author-scoped (two-level proposal, #40 Q4). The legacy Return still goes through `expert_send_back`, and the repair now also matches `return` — finding 6 |
| — | Independence | ✅ `adjudication_conflict_item_ids` gains the dispute opener; the queue and both decisions share it. Gaps: findings 2 and 3 |

## Findings

Points 2–5 are reproduced with throwaway probes against the real routes
(`scratchpad/test_probe_pr48_review.py`, copied in the appendix); each fails at `f20e454`. Point 1 is read from the code.

### Blocking

**1. A justification over 255 characters is a 500 on PostgreSQL after the decision has committed.**
`open_pending_annotation_dispute` (`review_actions.py:1335–1341`), `decide_annotation_dispute` (`:1412–1418`) and
`decide_item_reconciliation` (`reconciliations.py:307–314`) pass `payload.justification` (`max_length=2000`) as the
history `description`, which is `audit_logs.description String(255)`. Each records history **after** `db.commit()`,
so on PostgreSQL the decision is saved, the history insert fails, the caller gets a 500 and the item has no history
row. SQLite does not enforce the length, so the suite passes. Fix as `record_item_reopened` does: a short fixed
description, and the reason in `new_values`. The legacy route's `decision_note` (`:1539`, `:1603`) has the same
problem, inherited from `main`.

**2. The case lists offer cases the decision refuses.** `GET /annotation-disputes` and `GET /item-reconciliations`
do not filter through `adjudication_conflict_item_ids`. Probe: an ADMIN who escalated the answer sees the open case
in the list; the adjudication queue shows 0; the decision returns 403. Same for a reconciliation whose candidate the
ADMIN approved. SCRUM-52's rule (the queue never offers what the decision refuses) and SCRUM-103's criterion ("an
expert is never offered a dispute on work they annotated or reviewed") — the desk reads these lists, not the queue.
Filter open cases for the caller as `list_adjudication_queue` does.

**3. The expert who accepted one candidate can choose it in reconciliation.** Two answers; FIRST escalates the
author's, SECOND accepts the peer's; ADMIN accepts the escalated one (200), which opens reconciliation with
`opened_by = ADMIN`; ADMIN then chooses that same answer (200). `adjudication_conflict_item_ids` has authors,
reviewers, routers and dispute openers, but not `AnnotationDisputeDB.adjudicated_by`, although
`item_judge_ids_by_item` already counts adjudicators as judges of the item. **Decision 3:** refuse at reconciliation
anyone who decided an answer dispute on the item, in the decision and in the list (point 2).

**4. Agreeing answers wait for an expert; Merge writes an unreviewed authoritative answer.** Probe: two approved
answers with identical `annotation_data` → item `reviewed`, one open reconciliation. `item_status_after_accept`
returns `reviewed` whenever `len(states) > 1`. Merge (`item_reconciliation_service.py:402–447`) creates a version by
the decider and marks it authoritative straight away. **Decision 1:** both are fixed here, not in SCRUM-37 — compare
by label or verdict (#40 Q3), finalise agreeing answers by the platform's rule, and take Merge out of the API, the
check constraint and the desk until #40's Q2 is answered. Put the comparison in one function that SCRUM-37 can call.

### Non-blocking

**5. A reconciliation is opened by a person.** `ItemReconciliationDB.opened_by` is non-null and gets the actor whose
action completed the item — the last reviewer (probe: SECOND) or the adjudicator. It is the platform's rule that opens
it, as with automatic disputes (SCRUM-101 criterion 3, Jingwei's round-1 point 3). Use `opened_by_kind` and a null
opener as `annotation_disputes` does; the list already falls back to "System".

**6. `expert_send_back` (SCRUM-99 criterion 7) is still not decided in the description.** The legacy Return keeps
`expert_send_back` and `ensure_expert_send_back_status`, and `task_item_status_resolution.py` now also matches the
decision `return` in its filters and audit fallback, so the repair-on-read grows. SCRUM-121 (Hanchen, W10) moves or
deletes that repair depending on this answer (roadmap W10, close collaboration 9 ↔ SCRUM-99). Write the decision into
the description: is `expert_send_back` still reached once the desk uses the annotation-dispute route?

**7. The legacy `GET /escalations/{escalation_id}` (new in this PR) checks task access only.** It filters answers
through `visible_to_caller` but returns every review of them. Gate it as the annotation-dispute detail is (round-1
point 6).

**8. A reconciliation Return leaves the item `returned` with no current answer** (probe: status `returned`, 0
current answers). `reopen_task_item` sets `pending`, which the owner's reopen and the adjudication Return keep;
`resolve_item_reconciliation` overrides it (`:461`). Drop the override.

### Not raised on the PR

- The reconciliation's `task_snapshot` and the dispute's `task_snapshot` are built by two copies of the same function
  (Jingwei's duplication point covers it).
- The changes to `blind_item_statuses`, the web desk and the export were not re-read beyond Jingwei's review.

## Board and records (for Hanchen, not on the PR)

- **SCRUM-99 description — add** (draft):
  > Added 2026-10-09 (Hanchen): SCRUM-99 also carries item reconciliation, the item-level dispute of the two-level
  > design posted on issue #40 (2026-10-06). When an item has several approved answers, an expert chooses one of
  > them as the item's answer (R2-1, "accept one of the existing judgements") — also when they agree, since their
  > rationales may differ — returns the item for new annotation and review, or rejects all, leaving the item
  > inconclusive. No merge until the client answers #40's second question. In PR #48.
- **SCRUM-37:** nothing added. Dishank builds the canonical rule on #48's authoritative marker once it merges.
- **SCRUM-101** is in #48 too; it moves with SCRUM-99/100 when #48 merges.
- **`roadmap.md` / `mission.md` at the next sync:** #48 is no longer paused on #40 (decision 2); W9 group 12 and the
  carry-over line; W10 group 9 (SCRUM-121): once #48 merges and dev databases are reset, nothing writes
  `expert_send_back`, so the repair-on-read can be deleted rather than moved (finding 6 at `70cf9ea`).
- **SCRUM-103 (Jingwei, W10):** #48 already retires the legacy decision route (410) and moves EV-001 onto the new one —
  two items on SCRUM-103's list are done here.
- **SCRUM-99's Return wording** ("not only to the original annotator") needs the two-level split: item-level Return
  reopens the item; answer-level Return goes to its author, pending #40.
- Tell Dishank (SCRUM-37) and Jingwei (SCRUM-103) that reconciliation stays in #48 under SCRUM-99, and that Merge is out.

## Comment for GitHub (ready to paste) — rewritten for `70cf9ea`

Supersedes the earlier `f20e454` version, which was never posted.

````
Thanks Yi. Retiring the legacy routes was a clean way to close Jingwei's two points, and the export's `resolution` block in `70cf9ea` now reads the authoritative answer whatever the filter and takes the latest rejecting decision since the last reopen, so both export points are fixed too. Re-reviewed at `70cf9ea`: the API suite passes locally on SQLite (1,358 passed, 9 skipped).

**Two decisions first:**
- **This PR no longer waits for #40.** It follows the two-level proposal the team posted there on 6 Oct, so it can merge once the points below are fixed. If Hunter answers differently, we change it in a follow-up.
- **Item reconciliation belongs to SCRUM-99.** It's the item-level dispute, R2-1's "accept one of the existing judgements". I'll add it to SCRUM-99's description, so please link SCRUM-99, 100 and 101 in the description. **Reconciliation stays as it is for agreeing answers:** they still go to the expert, because answers with the same label can carry different rationales and the expert chooses which becomes the item's answer. **Merge is removed in this PR, not SCRUM-37** (point 3). SCRUM-37 is in progress with Dishank, and we don't add scope to a ticket while someone is working on it, so the SCRUM-37 note in Jingwei's approval doesn't apply. Sorry, Jingwei, I hadn't posted this yet. @Dishankaswal, nothing moves to you; you can build on the authoritative marker this PR adds.

Three things before this can merge:

**1. A justification over 255 characters is a 500 on PostgreSQL, after the decision has committed.** This is the length point from the first round, now on the three new routes: opening a held dispute, deciding a dispute and deciding a reconciliation (`review_actions.py:1421`, `:1498`, `reconciliations.py:342`). Each writes the justification (up to 2,000 characters) into the history `description`, a 255-character column, and does so after `db.commit()`. On PostgreSQL the decision is saved, the history row fails, and the caller gets a 500. SQLite doesn't enforce the length, so the suite passes.
- **Fix:** a short fixed description, with the reason in `new_values`, as `record_item_reopened` does.

**2. The case lists offer cases the decision refuses.** `GET …/annotation-disputes` and `GET …/item-reconciliations` don't filter through `adjudication_conflict_item_ids`, and the desk reads these lists, not the adjudication queue. An administrator who escalated an answer sees its open case; the adjudication queue correctly shows nothing, and the decision returns 403. The same happens for a reconciliation whose candidate they approved. SCRUM-52's rule, which SCRUM-103 relies on, is that the queue never offers what the decision refuses.
- **Fix:** filter open cases for the caller, as `list_adjudication_queue` does.

**3. Remove Merge.** The client never asked for it. R2-1 gives the expert three actions: Accept "one of the existing judgements", Return when "none of the existing judgements is satisfactory", or Reject. Merge is our own open question 2 on #40. As built, it writes a new answer as the decider and marks it authoritative in the same step. So the expert both writes and approves the item's final answer, with nobody else reviewing it, and a wrong merge goes straight out as the released answer. That's the self-approval issue 7 is about. When none of the candidates is right, Return already covers it. Please take Merge out (API, check constraint and desk) until Hunter answers.

<details>
<summary>Smaller points</summary>

- **Who opens a reconciliation.** `opened_by` is the person whose action completed the item: the last reviewer, or the adjudicator. It's the platform's rule that opens it, as with automatic disputes, so use `opened_by_kind` and a null opener as `annotation_disputes` does.
- **`expert_send_back` (SCRUM-99 criterion 7).** With the legacy decision retired, nothing reachable writes it for new work any more. Could you say so in the description? SCRUM-121 (W10) can then delete the repair-on-read rather than move it.
- **A reconciliation Return leaves the item `returned`** with no current answer. `reopen_task_item` already sets `pending`, as the owner's reopen leaves it, so the override in `resolve_item_reconciliation` can go.
- **The description** also needs the development database reset under "After merging", as Jingwei asked.

</details>

<details>
<summary>Probes for point 2</summary>

They reuse the fixtures and helpers from `tests/test_independent_second_review.py`, with the reconciliation router added to the client. Each fails at `70cf9ea`.

```python
"""Throwaway probes for the PR #48 review. Not part of any commit."""
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

import tests.test_independent_second_review as base
from tests.test_independent_second_review import db  # noqa: F401  fixture
from app.api.routes import reconciliations, review_actions, tasks
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.db_models import AnnotationDB, ItemReconciliationDB, TaskDB

_answer, _policy, _review, _status, _user = base._answer, base._policy, base._review, base._status, base._user
ADMIN, FIRST, SECOND, PEER_AUTHOR, TASK = base.ADMIN, base.FIRST, base.SECOND, base.PEER_AUTHOR, base.TASK


@pytest.fixture
def client(db):
    app = FastAPI()
    for router in (tasks.router, review_actions.router, reconciliations.router):
        app.include_router(router, prefix="/tasks")
    app.dependency_overrides[get_db] = lambda: db
    with TestClient(app) as http:
        yield http


def _as(client, user):
    client.app.dependency_overrides[get_current_user] = lambda: _user(user)


def _two_answers(db):
    _policy(db, approvals=1, percentage=0, handling="open_dispute")
    db.get(TaskDB, TASK).required_annotators = 2
    db.commit()
    return _answer(db), _answer(db, id="peer_probe", author=PEER_AUTHOR)


def test_dispute_list_offers_a_case_its_reader_may_not_decide(db, client):  # point 2
    _policy(db, approvals=1, percentage=0, handling="open_dispute")
    own = _answer(db)
    _review(db, own, "escalate", ADMIN)
    _as(client, ADMIN)
    listed = client.get(f"/tasks/{TASK}/annotation-disputes", params={"status": "open"}).json()["items"]
    assert not listed


def test_reconciliation_list_offers_a_case_its_reader_may_not_decide(db, client):  # point 2
    own, peer = _two_answers(db)
    _review(db, own, "accept", ADMIN)
    _review(db, peer, "accept", SECOND)
    _as(client, ADMIN)
    assert not client.get(f"/tasks/{TASK}/item-reconciliations").json()["items"]

```

</details>
````

## Appendix — probes

`scratchpad/test_probe_pr48_review.py`, run from `apps/hej-api` inside `tests/`, then removed from the worktree.
Output at `f20e454`:

```
LIST 1 QUEUE 0 DECIDE 403                      # dispute list offers ADMIN a case the queue hides
LIST 1 DECIDE 403 OPENED_BY 64                 # reconciliation list offers it too; opened by SECOND
OPENED_BY 64 SECOND 64                         # reconciliation opener is the last reviewer
ACCEPT 200 RECON OPENED_BY 67 CHOOSE 200       # the expert who accepted A then chooses A
STATUS reviewed CASES 1                        # identical answers still open reconciliation
RETURN 200 STATUS returned CURRENT ANSWERS 0   # reconciliation Return leaves `returned`
```

```python
"""Throwaway probes for the PR #48 review. Not part of any commit."""
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

import tests.test_independent_second_review as base
from tests.test_independent_second_review import db  # noqa: F401  fixture
from app.api.routes import reconciliations, review_actions, tasks
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.db_models import AnnotationDB, ItemReconciliationDB, TaskDB

_answer, _policy, _review, _status, _user = base._answer, base._policy, base._review, base._status, base._user
ADMIN, FIRST, SECOND, PEER_AUTHOR, TASK = base.ADMIN, base.FIRST, base.SECOND, base.PEER_AUTHOR, base.TASK


@pytest.fixture
def client(db):
    app = FastAPI()
    for router in (tasks.router, review_actions.router, reconciliations.router):
        app.include_router(router, prefix="/tasks")
    app.dependency_overrides[get_db] = lambda: db
    with TestClient(app) as http:
        yield http


def _as(client, user):
    client.app.dependency_overrides[get_current_user] = lambda: _user(user)


def _two_answers(db):
    _policy(db, approvals=1, percentage=0, handling="open_dispute")
    db.get(TaskDB, TASK).required_annotators = 2
    db.commit()
    return _answer(db), _answer(db, id="peer_probe", author=PEER_AUTHOR)


def test_dispute_list_offers_a_case_its_reader_may_not_decide(db, client):  # point 2
    _policy(db, approvals=1, percentage=0, handling="open_dispute")
    own = _answer(db)
    _review(db, own, "escalate", ADMIN)
    _as(client, ADMIN)
    listed = client.get(f"/tasks/{TASK}/annotation-disputes", params={"status": "open"}).json()["items"]
    assert not listed


def test_reconciliation_list_offers_a_case_its_reader_may_not_decide(db, client):  # point 2
    own, peer = _two_answers(db)
    _review(db, own, "accept", ADMIN)
    _review(db, peer, "accept", SECOND)
    _as(client, ADMIN)
    assert not client.get(f"/tasks/{TASK}/item-reconciliations").json()["items"]


def test_expert_who_accepted_one_candidate_then_chooses_it(db, client):  # point 3
    own, peer = _two_answers(db)
    _review(db, peer, "accept", SECOND)
    _review(db, own, "escalate", FIRST)
    _as(client, ADMIN)
    [case] = client.get(f"/tasks/{TASK}/annotation-disputes", params={"status": "open"}).json()["items"]
    client.post(f"/tasks/{TASK}/annotation-disputes/{case['dispute_id']}/decision",
                json={"decision": "accept", "justification": "The escalated answer holds."})
    recon = db.query(ItemReconciliationDB).one()
    chosen = client.post(f"/tasks/{TASK}/item-reconciliations/{recon.id}/decision",
                         json={"decision": "choose_one", "justification": "Pick it.", "selected_annotation_id": own.id})
    assert chosen.status_code == 403


def test_agreeing_answers_are_finalised_without_an_expert(db, client):  # point 4
    own, peer = _two_answers(db)
    db.get(AnnotationDB, peer.id).annotation_data = dict(db.get(AnnotationDB, own.id).annotation_data)
    db.commit()
    _review(db, own, "accept", FIRST)
    _review(db, peer, "accept", SECOND)
    assert _status(db) == "canonicalized"
```
