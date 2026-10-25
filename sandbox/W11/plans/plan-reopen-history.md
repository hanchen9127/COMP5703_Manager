# Plan — a reopen's history entry carries its reason, cause and superseded answers

2026-10-25. Story D9. Ticket: `../jira/jira-new-reopen-history-detail.md` (number once created). Found by Yi in
the review of #102. Worktree `hej-reopen`, branch `CS57-Hanchen-reopen-history` from `main` `ab457205` (renamed to
`CS57-Hanchen-scrum-<n>` once the ticket exists).

**Working:** as for SCRUM-134. One subagent per commit edits the worktree and never stages, commits or pushes. Claude
verifies, then commits (no AI trailer). Pushing waits for Hanchen. Messages in `commits/reopen-<n>-<slug>.txt`.

## The defect

| Where | What it does |
| --- | --- |
| `task_history_recorder.record_item_reopened` | stores `previous_status`, `status`, `cause`, `reason`, `superseded_annotation_ids` on the F1 event |
| `task_audit_log_query.py` ~:394–:418 | turns the event into a history row: `new_values` = the details without `previous_status`, plus `reopen_id` |
| `_should_include_change_field` / `_USER_VISIBLE_CHANGE_FIELDS` (~:70, :98) | keeps only fixed fields and `*_status`: `status` survives, the other three do not |
| `reopen-history-detail.tsx` `readReopenEvent` | reads `reason`, `cause`, `superseded_annotation_ids` from `changes`: all missing, so no reason, the owner's label, 0 answers and no Show button |
| `task-history-board.tsx:196` | renders `ReopenHistoryDetail` in place of the change rows for `item_reopened` only, so extra fields on that entry never show as generic rows |

Broken since D9's web history (`38223372`, 2026-10-01); the web test feeds `changes` by hand, and the backend test
(`test_the_task_history_still_reads_a_reopen_from_its_provenance_event`) checks only the `status` change.

## Decisions (2026-10-25, Hanchen)

| Decision | Why |
| --- | --- |
| A new ticket, fixed now | Found in #102's review, outside its scope |
| **`adjudication_return` goes too** (commit 3) | Nothing writes it; the current design has no reopen on a dispute Return |
| Wording: summary "An expert's reconciliation returned the item to open work"; web "Returned to open work by an expert's reconciliation" | Same pattern as the existing labels |

## Status (2026-10-25)

| Commit | Hash | State |
| --- | --- | --- |
| 1 — history entry fields + reconciliation summary | `c63e9864` | committed (2,493 passed, casebook unchanged) |
| 2 — web label (+ neutral "Reopened" for an unknown cause) | `608579d1` | committed (web 1,049) |
| 3 — no `adjudication_return` (+ `api_surfaces.md:1249`, `domain_model.md:264`) | `cfe499a8` | committed (2,493 passed, web 1,048) |

**SCRUM-139** (created by Hanchen 2026-10-25). Subjects rewritten from `SCRUM-XXX` (tree unchanged): `68bce5be`,
`8f278bd4`, `2e7b2673`, plus `fb3aaace` (the ticket map row). Branch `CS57-Hanchen-scrum-139`, pushed;
**PR #104, draft**, opened 2026-10-25 at Hanchen's request.
Then: merge of `main` with #101 (`2404b383`, one test-comment conflict); the ticket map brought to the board
(`c9e9bcc2`); merge of `main` with #103 (`720691c5`, conflicts in three reopen-cause comments and the map); the map's
stories for SCRUM-128 (K4), 133/135/136 (K1) and 134 (A5) (`7649e893`); `record_item_reopened`'s docstring
(`36d36602`). All pushed; #104 is the last open PR, MERGEABLE. SCRUM-139 is Done on the board ahead of the merge.
Left as found: `story_src.csv` D9's `scrum` lacks SCRUM-139 (the next sync after the merge adds it, if the board's
description is read as D9), and the map lists more stories than `story_src.csv` for SCRUM-32, 37, 46 and 99.

## Review round 1 (Yi, 2026-10-25 13:30, on `36d36602`): Changes requested

**Finding 1, verified:** the History entry now gives every task member a reopen's `reason`, but the item timeline
(`list_item_events`) drops an `item_reopened` event for a reader who is blind on the item or may not see an answer
it superseded. A reconciliation Return's reason is the expert's whole justification, which can name a hidden
answer (Yi's repro: Dana reads "Charlie chose politics" while Charlie's answer is hidden from her). New with #104.
**Minor 1, verified:** `evaluation/harness/integrity.py:170-171` still says "an adjudication's Return reopens it".

**Decided 2026-10-26 (Hanchen): option 2.** A reader who would not see the reopen on the timeline gets the entry
without `reason` and `superseded_annotation_ids` (cause and status stay) and is told so: the web shows the cause's
label and "The reason and the earlier answers are hidden until you may see this item's answers", with no count and
no Show button. Rejected: label only (readers would take it for a bug); hiding the whole entry (changes `main`'s
behaviour and breaks the paged `total_count`).

### 8. `fix(api)`: a reopen's reason and earlier answers reach only readers who may see the reopen
- `list_for_task`: for each `item_reopened` entry, the timeline's two checks for the reader (blind on the item;
  every superseded answer visible through `AnnotationService.visible_to_caller`). If either fails, drop the
  `reason` and `superseded_annotation_ids` changes and set an additive flag on the entry (`details_withheld`).
- Tests: Yi's case (Dana reads the reconciliation Return's entry: no reason, no ids, flag set; Hannah: all three);
  an owner's reopen read by a still-blind co-annotator; Guard: the owner reads it whole.
- `api_surfaces.md`: the sentence on the reopen entry says who gets the fields.

### 9. `fix(web)`: the reopen detail says when its reason and earlier answers are hidden
- `task-history.ts`: the flag on the event type. `reopen-history-detail.tsx`: with the flag, the label and the
  hidden sentence, no count, no Show button.

### 10. `docs(evaluation)`: integrity.py's reopen comment names the reconciliation Return

**Done 2026-10-26:** `34255d0a` (api, shared `may_see_reopen` / `reopens_seen`), `a1b80e45` (web notice),
`dd28358a` (comment); backend 2,495, casebook unchanged, web 1,050. Pushed; description updated; reply to Yi
posted asking for a re-review.

**Merged 2026-10-26** (01:01 Sydney): Yi approved and merged #104 (`6951781`). Every PR is merged. The board sync
of 2026-10-26 03:37 allocated D9 to Jingwei and Hanchen; the board still links SCRUM-139 to no story (the ticket map
gives D9), so `story_src.csv` D9's `scrum` stays without it, a record check for the weekly sync.

## Ground rules

As for SCRUM-134: each commit green on its own (backend suite, casebook `--exact`, web checks when the web
changes); a Prove test fails on `main`; no other operation's history entry changes; new comments name stories or
PRs, not SCRUM numbers.

## Commits

### 1. `fix(api)`: a reopen's history entry carries its reason, cause and superseded answers

- `task_audit_log_query.py`: a per-operation list of detail fields that become changes, holding `item_reopened`:
  `reason`, `cause`, `superseded_annotation_ids`. `_USER_VISIBLE_CHANGE_FIELDS` and every other operation stay as
  they are; `reopen_id` stays out.
- The summary names `reconciliation_return` (wording decided below) instead of "Item reopened".
- Tests, in `test_task_item_reopen.py` beside the existing history test:
  - Prove: the owner's reopen of an item with one answer reads, through `list_task_audit_logs`, `reason`, `cause`
    `owner_reopen` and `superseded_annotation_ids` equal to the reopen's (fails on `main`);
  - Prove: a reconciliation Return's entry has cause `reconciliation_return` and its summary;
  - Guard: another operation's entry (a review action) has the same changes as before.
- `api_surfaces.md`: the audit-log section says the reopen entry carries the three fields, if it lists fields.

### 2. `fix(web)`: the reopen detail names the reconciliation Return

- `reopen-history-detail.tsx`: a `reconciliation_return` label (wording below); the owner's label for
  `owner_reopen`.
- Test from the API's real shape: the entry as commit 1's read returns it (three changes beside `status`).

### 3. `refactor(api,web)`: remove the unused reopen cause adjudication_return

- `task_item_reopen_service.py`: `ADJUDICATION_RETURN` and its place in `REOPEN_CAUSES`; the comment above names
  the owner's reopen and the reconciliation Return.
- `task_audit_log_query.py`: its summary entry. `reopen-history-detail.tsx`: its label branch.
- `db_models.py:1180`: the `cause` comment lists `owner_reopen` and `reconciliation_return`.
- Tests: `test_task_item_reopen.py` `test_a_return_style_reopen_after_a_send_back_stays_open` uses
  `RECONCILIATION_RETURN` (the rule it checks, that the cause doesn't matter, is live);
  `test_evaluation_integrity_roles.py:268` uses `reconciliation_return`; `reopen-history-detail.test.tsx:130`
  checks the reconciliation label instead.
- Docs: ADR 008 decision 2 gets a dated `Amended by` note; `db_schema_blueprint.md:274` lists the two causes.
- Safe: no application code writes it (`git log -S ADJUDICATION_RETURN -- apps/hej-api/app` finds only its
  definition), and a fresh seed holds no such row.

## Done when

A real reopen's History entry, read through the API, shows its reason, the right cause and its superseded answers
with the Show button; `git grep adjudication_return` finds only the ADR 008 note; the backend suite, the casebook
and the web checks pass.
