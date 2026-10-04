# Review — PR #48, `CS57-Yi` (SCRUM-99/100, E3/E4; design touching SCRUM-101)

2026-10-03. Head `fbbba0c` (one commit, "dispute prototype based on R2-1", 2026-09-28), base `main`;
merge-base `3a87ee3`, **66 commits behind** `main` (`66b7ff6`). 16 files, +1661 / −176. **Draft.**

**On GitHub (checked with `gh pr view 48`):** opened as a draft "design and implementation draft"; no
reviews, no comments. The description asks for design comments. Yi also commented on issue #40 today
(08:16), "Update after team discussion", with the same annotation-scoped design. The 2026-09-28
rewrite of #40 (`sandbox/W8/msg/issue-40-rewrite.md`) was **never applied**: #40 still has Yi's title.

**Read before this review:**
- client answers R2-1, R2-2, R2-4, R2-7 and R2-8 (`info/client-question.md`);
- Hanchen's answers to Yi's questions (`sandbox/W8/msg/questions_from_Yi.md`, 2026-09-28);
- the SCRUM-99 description (`sandbox/W8/jira/jira-scrum-99-r2-1.md`, plus the break edits);
- SCRUM-101's move to W9 (`sandbox/Break/jira/jira-scrum-101-to-W9.md`);
- the authoritative-marker message to Yi (`sandbox/Break/msg/message-yi-scrum-38-helper.md`).

No record of the "team discussion" was found in `docs/`.

**Decided by Hanchen (2026-10-03):** the dispute's scope goes to the client (on #40, labelled QA; no new issue) before anyone
builds on either reading. Draft: `../../sandbox/Break/msg/qa-dispute-scope.md`. Until the answer comes:
- **pause** the scope-dependent parts;
- **go ahead** with the parts that hold under either reading;
- **drop** the two parts that belong to other tickets.

**Recommendation: comment, no approval.** This is a design review: the code is the 9-28 prototype and
does not implement the description.

## What the PR is

- **The code (`fbbba0c`)** is the item-level R2-1 prototype that `questions_from_Yi.md` already
  referred to. In it:
  - `decide_escalation` takes `accept | return | reject` (and still accepts `finalize` and `send_back`);
  - Accept selects an `annotation_id`;
  - a reason is required;
  - outcome columns are added to the escalation row;
  - there is a new `GET /tasks/{id}/escalations/{escalation_id}` evidence endpoint and a rebuilt
    dispute desk.
- **The description** proposes a different design that is not built yet:
  - a dispute is about one immutable annotation version;
  - Accept does not choose the item's answer;
  - Return and Reject reopen only that annotation;
  - differing answers from different annotators become "candidate reconciliation", later and out of
    scope;
  - plus a reviewer-action matrix for Arbitration-ready and rules for comparing reviewer verdicts by
    review round.

## The design against the record

| # | PR description | On record | Verdict |
| --- | --- | --- | --- |
| D1 | A dispute concerns one annotation version. The item is `disputed` only for routing | Q1 (2026-09-28): the scope is the whole item, even when one annotation triggers it. R2-8: "If those judgements disagree, **the item** enters dispute". PR #35: one open escalation per item, and the whole item is held | **To the client** (QA issue) |
| D2 | Accept marks that annotation review-resolved, without selecting the item's answer. Whether it calls `mark_authoritative` is left open | R2-1: "Accept: accept **one of the existing judgements** as the resolved answer". SCRUM-99: Accept names an annotation id and canonicalises through the adjudication. Message of 2026-10-02: Accept calls #47's `mark_authoritative` | Follows D1 → **client** |
| D3 | Return reopens only the subject annotation; other annotations keep their reviews | R2-1: "return **the item** … to the normal open workflow". Q57, Q58: the whole item, earlier approvals void | Follows D1 → **client** |
| D4 | **Reject closes the dispute and reopens work** | R2-1: Reject "does not proceed automatically to another review stage … **Only a Return reopens the item**". Q55: the item stays unresolved, and the project owner decides next (R2-3's reopen) | **Conflicts with the client's answer under either scope.** Reject must not reopen anything |
| D5 | Arbitration-ready reviewers get `accept`, `request_minor_revision` and `escalate`, with **no generic `reject`**, enforced by the backend policy resolver | R2-4 names accept, reject, modify and escalate. Decision E: reject means "redo". Enforcing Arbitration-ready is E5 (SCRUM-107, W11) on G2 (SCRUM-118, W10) | **Not this ticket.** It changes the review contract for one policy and adds a new action. Drop it from #48, or raise it as a proposal on SCRUM-107 |
| D6 | Compare final reviewer verdicts per "review round" once the round is complete, with any minor revision first | SCRUM-101 (E1, **W9**) opens disputes automatically and calls SCRUM-51's (Parth) comparison. Since #45 (`review_refusal`), a disagreement can only be "approve, then return or reject". The code has no "review round" | **Not this ticket.** Agree it with Parth for SCRUM-51/101 at the start of W9. Do not introduce "round" without an owner |
| D7 | Different answers from different annotators → "candidate reconciliation", out of scope, with no owner | Q24, Q25, Q27, Q37, Q40: waiting for the client. Issue #40 constraint: no item becomes `canonicalized` without one recorded answer. R2-2: at most one authoritative output | **To the client** (same QA issue). If it stays out of scope, it must name an owner (H4, SCRUM-37, W9 is the natural one) rather than leave the issue-40 conflict open |
| D8 | The dispute pins the exact annotation version (#47's id), the triggering review ids, the review window and the policy and guideline snapshot; evidence is never looked up through "latest" | Q5, Q9, Q65, Q66, R2-5 | ✅ **Adopt under either scope.** This is the strongest part of the design |
| D9 | Opening is atomic; a duplicate open dispute is refused; stale review writes get 409 | PR #35, `route_escalation`'s 409 | ✅ Consistent |
| D10 | Every expert action requires a reason | R2-4 | ✅ (already in the prototype) |

## The prototype code (`fbbba0c`)

Not run: the head is 66 commits behind and most of it will change. Run the suites after the sync.

**Sync.** A trial merge with `main` (`git merge-tree`) has **one textual conflict**, in
`app/api/routes/review_actions.py`. On `main`, `decide_escalation` has since gained
`assert_task_accepts_work` (#41), and the file imports `reopen_task_item` (#46). The schema order agreed
for the break is #46 (merged) → SCRUM-38 (#47, open) → SCRUM-99, so the adjudication table's migration
goes after #47's columns in `migrate_db_schema()`.

### Carry forward under either scope

1. **The adjudication is stored on the escalation row** (`resolution_outcome` and
   `accepted_annotation_id` on `task_item_escalations`, `db_models.py`). SCRUM-99 criterion 1 requires
   a record of its own, separate from the escalation that requested it. That record is also where D8's
   pinned evidence belongs.
2. **Reject sets the item to `rejected`** (`_map_escalation_decision_to_task_item_status`). Under
   decision E, `rejected` means "redo", so the item returns to the annotation queues. That is exactly
   what R2-1 rules out (D4). Q55 and Q60 propose a terminal `unresolved` state that counts as closed.
   Also, `resolution_outcome` lets the caller choose `rejected` or `ambiguous_unresolved` for one
   client action. Either justify two outcomes or collapse them into one.
3. **No adjudicator independence check** (R2-8, SCRUM-99 criterion 6). It should be one helper shared
   with SCRUM-52 (Parth, branch `CS57-Parth`): the queue must never offer what the decision refuses.
   `DraftService._assert_not_a_judge_of_item` (#45) is the annotator-side counterpart on `main`.
4. **The evidence endpoint reads `is_latest` annotations.** After #47, a resubmission is a new version,
   so this can show a version the reviewers never saw. Read the pinned version (D8), not the latest.

### Scope-dependent (pause until the client answers)

5. **Return goes through `expert_send_back`.** It also extends the repair-on-read helpers in
   `task_item_status_resolution.py` to the new `return` value. `main` now has
   `reopen_task_item(..., cause=ADJUDICATION_RETURN)` (#46), which SCRUM-99 says Return should use. Item
   scope: call it. Annotation scope: it supersedes every answer on the item, so it cannot be called
   unchanged (the PR says so too). Either way, SCRUM-99 asks to decide whether `expert_send_back` is
   still reached and to remove `ensure_expert_send_back_status` if not. Those repair passes run on
   every `GET /task-items` (see the performance plan, H2).
6. **Accept sets `canonicalized` directly** and does not call `mark_authoritative` (#47), as agreed on
   2026-10-02. Under item scope it should call it. Under annotation scope it cannot canonicalise a
   multi-annotation item at all.

### Non-blocking

7. `GET /escalations/{escalation_id}` checks only task access (`verify_user_task_access`). It returns
   reviewer names, verdicts and justifications to any member who can see the task. Consider requiring
   `ADJUDICATE` (or project owner), to match the desk's audience.
8. `tasks.py` `_finalization_export_block`: `getattr(escalation, "resolution_outcome", None)` and
   `getattr(escalation, "accepted_annotation_id", None)` can be plain attributes, since the columns
   exist (and will move to the adjudication record, per point 1).

## Jingwei's review (`2026-10-03-scrum-99-pr48-comment_from_Jingwei.md`, local, not posted)

Checked against `fbbba0c` and `main` on 2026-10-03. **Decided by Hanchen:** the two reviews are posted as
one comment by Hanchen, crediting Jingwei; the client question on #40 keeps Option A vs B.

**Design.** Agrees on Reject (D4), on splitting off the review-side contract (D5 and D6), on keeping
per-annotation evidence (D8), and on the missing independence check. Jingwei proposes settling "outcome
per item, evidence per annotation" now; Hanchen's decision keeps the scope with the client, so the
merged comment presents it as Option A of the question on #40. **Jingwei's point 3 is the strongest argument
for A:** under annotation scope, two approved answers that differ never reach a dispute, and the
"candidate reconciliation" meant to catch them has no ticket before 1 Nov.

**Code — new points, verified:**

| Jingwei | Check | Verdict |
| --- | --- | --- |
| 2. No item lock | `decide_escalation` calls `_load_task_item(db, task_id, task_item_id)` without `for_update=True`, then `_open_escalation`; `route_escalation` locks (`:418`) | ✅ **Real; the most serious code issue.** Missed in this review |
| 4. PostgreSQL lengths | `audit_logs.description` is `String(255)` and receives `decision_note`; `EscalationDecisionRequest.note` has no `max_length`. On `main`, `record_item_reopened` keeps the reason in `new_values` for this reason | ✅ Real. Missed here |
| 6. Legacy aliases | The reason check runs before normalising, so `send_back` without a note gets 422; `finalize` without `annotation_id` goes through `_resolve_review_target` | ✅ As described |
| 7. Return re-forced after Reject | `_audit_send_back_timestamps` keeps the latest `return`/`send_back` regardless of later decisions; the item is forced back only if no draft was submitted after the Return | ⚠️ Edge case: needs a re-escalation **before** any resubmission. Moot once Return uses `reopen_task_item` and the repair-on-read goes |
| Desk (SCRUM-103 overlap): decision posted item-scoped, stale `feedback`, `closeDispute` after submit, raw `media_url` | Not run; consistent with the diff | Plausible; Jingwei owns SCRUM-103 |

**Code point 1, corrected.** Jingwei: `rejected` is "not offered in any queue … blocks task completion
forever". The second half holds (`TERMINAL_TASK_ITEM_STATUSES = {"canonicalized"}`, `task_service.py:206`).
The first half is unlikely: on `main` the annotation queue excludes only export-eligible items
(`task_work_queue_service.py:106`) and offers rework from submission review states, and the escalating
review is `needs_revision`, which counts as a return (`submission_rules.py:246`). So the author is probably
**offered the item back as rework** — which is exactly what R2-1 rules out. Read from the code, not run;
the fix is the same either way: a terminal unresolved state.

## Board effect (for Hanchen, not on the PR)

SCRUM-99 and SCRUM-100 are break tickets, and the break closes on 7 Oct. With the scope-dependent parts
paused, at most the scope-independent half (points 1–4, D4, D8) can be in review by then. Expect
SCRUM-99 to carry into W9, alongside SCRUM-101 (W9) and SCRUM-52 (Parth). W10's E6 (SCRUM-103, the
desk) and H4 (SCRUM-37, W9) both read the answer to D1/D7.

## Comment for GitHub (ready to paste) — merged with Jingwei's review

**Decided by Hanchen (2026-10-03):** no new QA issue. Yi's #40 and #38 go to Hunter where they are,
each with a completing comment and the `QA` label. Comments and commands are in
`../../sandbox/Break/msg/qa-dispute-scope.md`; post them before this one. #38 stays out of this PR's
scope.

Supersedes the first draft. Posted by Hanchen, one comment for both reviewers.

```
Thanks Yi, this is a careful write-up. Jingwei and I both reviewed it, the design in the description and the prototype code, and this comment combines our points so you get one list. The strongest part, which we'd keep whatever else changes, is pinning the dispute to the exact annotation version from #47, with its triggering review ids, the review window and the policy snapshot.

## Design

**Scope: one annotation vs the whole item. Going to the client on your #40, labelled QA for Hunter.** The description differs from what the tickets and #47 are built on. R2-1 says Accept takes "one of the existing judgements as the resolved answer" and Return sends back "the item"; R2-8 says "the item enters dispute"; SCRUM-99 and the answers on #40 follow that, and #47 already does: Accept calls `mark_authoritative(cause=ADJUDICATION_ACCEPT)`, Return clears the marker through `reopen_task_item`, Reject marks nothing. Rather than settle it among ourselves, we'll take the client's answer. The two readings as we see them:
- **A**: outcome per item, evidence per annotation. Jingwei's suggestion: the dispute records the subject version(s) and triggering reviews, the desk shows them first, and the expert decides for the item. That also answers your concern about unrelated annotations.
- **B**: your annotation scope, with the item's single answer chosen later.

One thing to weigh, from Jingwei: under B, two approved answers that differ never become a dispute, and the "candidate reconciliation" that would catch them has no ticket before the project ends on 1 Nov. R2-8 says the opposite for Dual sign-off ("If those judgements disagree, the item enters dispute").

Until the client answers, please pause what depends on it: what Accept selects, Return's scope, and the desk's candidate view.

**Reject is settled whichever way the scope goes.** R2-1: Reject "does not proceed automatically to another review stage … Only a Return reopens the item", and an item "may be resolved as genuinely ambiguous/unresolved". So Reject closes the dispute and leaves the item unresolved; it must not reopen work.

**Out of this PR's tickets.** The review-side contract (`request_minor_revision`, no `reject` under Arbitration-ready, a "review round complete" signal) changes #45's `review_refusal` (ADR 007), SCRUM-51/109 and project policy. It needs its own ticket; SCRUM-107 (E5) / SCRUM-118 (G2) are the natural homes. SCRUM-101 (W9) uses the simpler definition, one accepts while the other returns or rejects; worth agreeing with Parth then. Could you take both out of this description?

**Missing: adjudicator independence.** R2-8: "An arbitrator should not arbitrate a dispute involving work that they annotated or reviewed themselves." It is a SCRUM-99 criterion, and issue 7 (Critical) closes with it. `item_author_ids` (any round) plus the item's reviewers give the set, and #45's wording can be reused. Please make it one helper shared with Parth's SCRUM-52 queue, so the queue never offers what the decision refuses.

## Code: what carries over to the rewrite

The prototype predates #45, #46 and #47 (66 commits behind; a trial merge conflicts in `review_actions.py`). These apply whatever the design:

1. **No item lock.** `decide_escalation` loads the item and the open escalation without `for_update=True`. Two experts deciding at once both get 200, and the second silently overwrites the first while both audit rows remain. Lock, then re-read the escalation; `tests/test_review_lock_postgres.py` has a two-thread pattern.
2. **Reject maps to `rejected`.** That isn't terminal, so the task can never complete, and since the escalating review counts as a return, the author is likely offered the item back as rework, which is what R2-1 rules out. It needs a defined unresolved state, export marking, and the owner's reopen as the way out.
3. **The adjudication lives on the escalation row.** SCRUM-99 criterion 1 asks for its own record, separate from the escalation; that record is where the pinned version, triggering review ids and reason belong. The migration goes after #47's columns (order #46 → SCRUM-38 → SCRUM-99), and your ADR is **010**, since #47 takes 009.
4. **PostgreSQL limits.** The reason goes into the history `description`, a 255-character column, so a longer one is a 500 on PostgreSQL (SQLite stores it, so the tests pass), and `note` has no `max_length` against a `String(2000)` column. Put the reason in `new_values` with a short fixed description, as `record_item_reopened` does, and add `Field(max_length=2000)`.
5. **Stale evidence.** The detail endpoint reads `is_latest` annotations and attaches every review with no `submitted_at` window. After #47 a resubmission is a new version, so read the pinned version and apply the window from your description.
6. **The evidence endpoint is too open.** `GET /tasks/{id}/escalations/{esc_id}` checks only task access, so any annotator on the task can read every reviewer's verdict and justification. Gate it on ADJUDICATE, like the queue and the decision.
7. **Legacy values.** `finalize` and `send_back` are documented as accepted, but `send_back` with no note now gets 422 and `finalize` with no `annotation_id` gets 409/400. Either keep them working until SCRUM-103 switches the desk, or say they're removed. A one-time update in `migrate_db_schema()` and one `SEND_BACK_DECISIONS` constant would spare every reader both spellings (export currently emits both).
8. **Return via the repair helpers.** Return still goes through `expert_send_back`. The audit fallback in `task_item_status_resolution.py` can also force an old Return back after a later Reject, if the item was re-escalated before anyone resubmitted. `reopen_task_item(..., cause=ADJUDICATION_RETURN)` from #46 is the path SCRUM-99 names; under scope A it removes both problems.

<details>
<summary>Smaller points, and the web desk (overlaps Jingwei's SCRUM-103)</summary>

- `task-dispute-desk.tsx`:
  - It loads evidence by `escalation_id` but posts the decision to the item-scoped route, which acts on whichever escalation is open at submit time. If the dispute was resolved and re-routed in between, the decision lands on evidence the expert never saw. Send the escalation id and have the server check it.
  - `openDispute` / `closeDispute` never clear `feedback`, so one dispute's error shows in the next.
  - `submitDecision` calls `closeDispute()` when the request finishes, closing whichever sheet is open by then and dropping its draft.
  - `SubmissionPreview` passes the raw `media_url` while `SourcePreview` resolves it with `resolveMediaUrl`, so bounding-box overlays break on relative URLs.
- `task-finalized-desk.tsx:147` still tells users to use "the `finalize` decision".
- `tasks.py:806` uses `getattr(..., None)` on mapped columns only so a `SimpleNamespace` fixture passes. Give the fixture the attributes instead.
- Duplication:
  - `_escalation_resolution_outcome`, `_map_escalation_decision_to_task_item_status` and the `if decision == "return"` branch each encode the same mapping.
  - `resolveMediaUrl` copies the helper in `task-item-workspace-sheet.tsx`.
  - `get_escalation_detail` re-implements `_current_annotations` and repeats the user-label fallback three times.

</details>

## Next step

1. Take `main`, then #47 when it merges.
2. Keep this PR to SCRUM-99/100 on the backend: the adjudication record, independence, the lock, and Reject as unresolved. These hold under either scope.
3. Add Accept and Return once Hunter has answered on #40.
4. SCRUM-101 and the desk follow.

Separately, your #38 (who reworks a returned or rejected AI first pass) is labelled QA too. I added a note correcting its background: on `main` such an item is currently stuck, not sent to a person. Nothing in this PR waits on it.
```

## Posted (2026-10-03)

- PR #48: the merged comment was first posted by Hanchen at 13:18 UTC with the `#<QA>` placeholder, then **edited in place** at 13:37 UTC to the version above (pointing at #40 and noting #38). [Comment](https://github.com/USYD-CS-Capstone/hej/pull/48#issuecomment-5969542815).
- Issue #40: labelled `QA`. The client question (Options A/B + Q2) was posted, shortened, then **deleted by Hanchen** as unnecessary. #40 stands as Yi wrote it.
- Issue #38: the background correction was [posted](https://github.com/USYD-CS-Capstone/hej/issues/38#issuecomment-5969697511) and labelled `QA`.
- The `QA` label did not exist in the repo; it was created the same day.
- Jingwei's local review was not posted separately.
- PR #48 comment edited again at 13:51 UTC, after the #40 comment was deleted: it no longer claims both readings and Q2 were added to #40.
