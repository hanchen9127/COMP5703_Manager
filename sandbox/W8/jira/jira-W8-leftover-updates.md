# W8 leftover tickets — description updates (SCRUM-111, 113, 114, 51, 109)

2026-09-30. From a live board export taken the same evening (saved to the scratchpad; `shared/Jira.csv` not
replaced) and checked against `main` `e367ebd`. Nine W8 tickets are not Done. SCRUM-24 and SCRUM-93 already
carry today's descriptions, and SCRUM-115 is still accurate. The five below need updating. SCRUM-86 waits for
Hanchen's decision on its overlap with SCRUM-116 and SCRUM-99.

For each ticket, replace the whole description with its block. The first line stays, because `tracking-sync`
maps the ticket to its story by it. Points, sprint and assignee are unchanged. Moving the unfinished tickets out
of the W8 sprint is a board step of its own.

**What changed and why**

| Ticket | Change | Why |
| --- | --- | --- |
| SCRUM-111 (B7, Yi) | Scope line; criteria 1, 3, 4 and 5 rewritten; a "Decided during review" section; a test added | The review of PR #42 accepted three departures from the ticket: per-upload projection, `full_record` and evaluation fields as the uploader's responsibility, and generated `file#N` refs. The old criteria say the opposite. Also recorded: the source file must not be reachable, and the audit JSON change |
| SCRUM-113 (Hanchen) | Criterion 1 rewritten; hydration fallback added as a criterion; "Blocked by SCRUM-93" replaced | #44 is stacked on #43 (SCRUM-114), not on SCRUM-93: the Review tab reads the review queue itself. #44 also removed hydration's fallback to a colleague's draft (`29ac0f0`), which the ticket did not mention |
| SCRUM-114 (Hanchen) | Criterion 3 and the last line | The fallback removal is SCRUM-113's (#44), not this PR's, as #43's own description says. SCRUM-113 is W8 and PR #44, stacked on this one, not W9 |
| SCRUM-51 (D7, Parth) | Status note; both slices rewritten per submission; collaboration | Not started at the end of W8. Since PR #35 review is per submission. The second-review queue is SCRUM-52 and the automatic dispute is SCRUM-101, both now in the break. SCRUM-101 depends on this ticket's flag |
| SCRUM-109 (D2, Parth) | Status note and a collaboration section; criteria unchanged | Not started at the end of W8. In the break, SCRUM-116, SCRUM-99 and SCRUM-110 change the same review function and item-status computation, and PR #41 adds the active-only check there |

---

## SCRUM-111 — Task lifecycle: Import a JSONL dataset as one item per record

```
{noformat}Related to user story B7

BACKEND AND FRONTEND (the browser intake workflow — select, configure, preview, submit — was added in PR #42; the ticket first said backend only)

Added 2026-09-24 from the client's follow-up answer to R1-1. Found by Yi: the text picker lists .jsonl, but upload_texts (app/api/routes/uploads.py:272) makes one task item per uploaded file — the whole file becomes one payload_preview and external_item_ref is the file name. FewNERD records had to be copied into separate .txt files by hand.

Client answer: "Direct import of the provided JSONL datasets should be in scope. A JSONL file should not be treated as one task item. [...] each record should become an item." And: "The annotation target should be determined by the task/schema, not by the AI." The model is: source record -> task/schema projection -> annotation payload. No universal data-mapping engine.

Updated 2026-09-30 at review of PR #42: criteria 3–5 changed by the decisions recorded at the end.

# An ADR in docs/adr/ (the client's required format, adr00N_short_title.md). The ticket offered two options: the task owner names the payload field in the task configuration, or supported task types ship a fixed adapter. PR #42 chose a third: the uploader picks the fields per file at upload time, recorded on each item. The ADR records that choice, its trade-off against the other two (the task itself does not state its input, and two uploads to one task may project differently), and the departures below.
# A .jsonl upload creates one task item per record, not one per file; JSON arrays and CSV rows likewise. A malformed line fails the whole upload with the line number — registration stays all-or-nothing through register_dataset (B5).
# Each item can be traced to its exact source record. The source file is stored once, and each item records it together with the record number and SHA-256 hashes of the source and of the projected input. Items are named file#N; the record's own external_item_ref, split and source_record_id are recovered from the stored source by record number rather than copied onto the item.
# The payload given to the annotator and sent to the AI is the projection chosen for that file: selected fields, or the full record.
# Evaluation-only fields such as gold_annotations are the uploader's responsibility for now: the platform does not detect or exclude them, and the ADR says so. Whatever is selected, the stored source file — which holds every record's evaluation fields — is never reachable by annotators or reviewers, neither through item or review reads nor through the unauthenticated /uploads download. It stays available to the evaluation harness (I1, SCRUM-68/69) through the source reference and record number.
# The source reference identifies the exact source and version used: source_version_ref records the source file's hash, the record number and the input hash, not "v1" (client answer R2-5).
# Plain .txt uploads keep working as today: one file, one item.
# Tests with the FewNERD sample (dataset/text_dataset/fewnerd in the capstone folder, outside the repo — copy a few records into a test fixture): N records give N items; with payload_preview.text selected, it is the annotation payload and no item input contains gold_annotations; the source file cannot be fetched by an annotator; a malformed line leaves nothing behind.

Decided during review of PR #42 (2026-09-30):
- Projection is chosen per file at upload time and recorded per item, not stored on the task.
- full_record, and selecting evaluation-only fields, are allowed; keeping them out is the uploader's responsibility. A task-level exclusion list is a possible follow-up.
- Items are named file#N; the record's own identifiers stay in the stored source.
- The intake audit row lists every item name, which overflows String(4000) on PostgreSQL. audit_logs.old_values and new_values become JSON (JSONB on PostgreSQL). The startup migration that converts them changes the rule that development PostgreSQL databases are disposable, so db_schema_strategy.md is updated in the same change.
{noformat}
```

---

## SCRUM-113 — Review: choose which submission to review on a multi-annotator item (WEB)

```
{noformat}Related to user story D8, D4

FRONTEND

Split from SCRUM-93 on 2026-09-26. An item holds one submission per annotator, each reviewed on its own, and one reviewer may review every submission on an item they did not annotate (decisions of 2026-09-25). The review panel today shows one submission per item and cannot move to another.

# The panel's Review tab reads the review queue itself (GET /tasks/{task_id}/work-queue/review) and lists the item's submissions that await the reviewer (awaiting_review_annotation_ids), by author. A failed read is shown as a failure, not as "nothing awaits you" — a caller without the review capability gets 403.
# The reviewer picks one. The panel opens it with GET /tasks/{task_id}/task-items/{item_id}/adjustment?annotation_id=<id>, which returns that submission's answer, its author and its own latest review.
# The decision is sent with that annotation_id, so it is recorded against the submission on screen.
# After a decision, the panel moves to the next awaiting submission on the item, or back to the queue when none is left. An accept that leaves the item open returns next_ui_status "awaiting_other_submissions" (already handled since PR #35).
# Item hydration no longer falls back to a colleague's draft when the viewer has none: the Review tab reads the chosen submission instead, so no colleague's name or answer reaches the item lists.
# A reviewer who annotated the item is never offered it, and the API refuses naming a submission that is not current on the item (404). The screen needs no rule of its own for either.
# A web test: an item with two awaiting submissions; the reviewer decides on the second one, and the request carries its annotation_id.

PR #44, stacked on PR #43 (SCRUM-114), because both edit components/task-item-workspace-sheet.tsx; it is retargeted to main once #43 merges. Built on PR #35 (queue rows, per-submission review) and PR #34 (review names its annotation). It does not depend on SCRUM-93's list: the list opens an item and hands the panel nothing else.

D7 (SCRUM-51) samples items for a second review into this same per-submission review queue, so a second reviewer uses this screen too.{noformat}
```

---

## SCRUM-114 — Work queues: item workspace panel — independence, refusals and S10 (WEB)

```
{noformat}Related to user story D8

FRONTEND

Split from SCRUM-93 on 2026-09-26: this ticket is the item workspace panel that an item opens in. The available-work list is SCRUM-93 (Kanishka). To keep the two branches apart, this ticket changes only components/task-item-workspace-sheet.tsx, lib/task-workspace-data.ts and lib/api/task-items.ts, and does not build the list.

# The existing "X is annotating this item" block is removed: several annotators per item is the rule now, each with their own draft.
# Fix S10: on a returned or rejected item, Save draft must keep what the annotator typed.
# An annotator does not see other annotators' submissions on the item before submitting their own (client answer, 2026-09-21). The API already hides them (PR #35), and the panel does not show another person's draft, read-only or otherwise. Hydration's fallback to a colleague's draft when the viewer has none is removed by SCRUM-113 (PR #44), which gives the Review tab its own read.
# Show the refusals the API gives, in its own words. A submission on a full item is refused (409, "Human annotation submission limit reached for this item (2/2)."), and so is a person's submission on an AI-assisted item the AI has annotated (409). The panel must not report either as submitted, nor update the item as if it were.

S10, found in SCRUM-26's manual walkthrough: on a returned item, editing the answer and clicking Save draft reverts the editor to the previously submitted answer and saves that instead; submitting directly works. Two causes:
- selectDraftForViewer (lib/task-workspace-data.ts) prefers the viewer's submitted draft over their pending one, and after rework an item has both. Prefer the viewer's own pending draft.
- The editor's initialising effect (components/task-item-workspace-sheet.tsx) is keyed on the whole item object, so any re-render discards unsaved typing. Key it on item.id, or leave the editor alone once it is dirty.
With several annotators per item, picking the wrong draft could show another annotator's work.

Already done in PR #35, so not part of this ticket: the panel sends the submission it shows (from #34), and shows "awaiting_other_submissions" without marking the item approved.

PR #43. Built on PR #35 (independence on reads, refusals on submit). SCRUM-113 (W8, PR #44) edits this same panel and is stacked on this PR.{noformat}
```

---

## SCRUM-51 — Review: Independent second reviewer

```
{noformat}Related to user story D7 and E1

ONLY BACKEND

This ticket runs over two weeks. Its first slice needs neither D8's queues nor B2's percentage, and the sampling builds on it. Not started by the end of W8 (2026-09-30), so the first slice is carried over. SCRUM-101 (E1, Yi, break) opens its dispute from this slice's flag, so the flag comes first.

Updated 2026-09-30: since PR #35 each submission is reviewed on its own, so "the same item" below became "the same submission"; the second-review queue is SCRUM-52 and the automatic dispute SCRUM-101.

First slice (1.5 points):
# A reviewer cannot see another reviewer's decision on the same submission until their own is submitted. Today the adjustment read returns the submission's own latest review (PR #34), so a second reviewer under dual sign-off sees the first decision.
# Two distinct reviewers' verdicts on the same submission are compared, and disagreement between them is flagged. Define disagreement in the PR — for example, one accepts while the other returns or rejects (a reject means redo, decision of 2026-09-26).
# The blind review and the flag follow B2's approvals and disagreement rule, read through resolve_for_task (review_required_approvals, disagreement_handling: manual_review or open_dispute) — not from the policy tables directly.

Second slice (W9):
# Sample items by the cross-review percentage set in B2 and place them in the second-review queue SCRUM-52 builds (Parth, break). The review queue already never offers a submission's second approval to its first approver (PR #35); sampling decides which submissions need a second review at all.
# E1's automatic dispute is SCRUM-101 (Yi, break); it opens from the flag above, on the dispute record SCRUM-99 defines.

Verdicts come from ReviewDB.verdict (PR #17).

Collaboration:
- SCRUM-101 (E1, Yi): needs this flag. Agree the flag's shape with Yi before either starts.
- SCRUM-52 (D8/E3, Parth): the second-review queue the sampling feeds.
- SCRUM-113 (PR #44): the screen a second reviewer picks the submission on.
{noformat}
```

---

## SCRUM-109 — Review: Review actions always move item status, and state cannot diverge from history

```
{noformat}Related to user story D2

ONLY BACKEND

SCRUM-29 closed D2's first part: the legacy review writes return 410 (PR #6). D2's subtasks 2 and 4 have no code yet, so this ticket carries them. Not started by the end of W8 (2026-09-30); carried over.

# Every review action moves the task item to the status it implies, in the same write — no action leaves the item where it was.
# A test proves item status and review history cannot diverge: after any sequence of review actions, the item's status matches what its latest decision implies.

Same file as SCRUM-86 (review_actions.py): land after SCRUM-86, or in the same PR.

------------------------------------------------------------------
Added 2026-09-27 from the D8 browser walkthrough on CS57-KANISHKA: a submission also moves item status, and it currently ignores the item's other submissions.

# A submission sets the item's status from all of its submissions, the same way an accept does: "returned" or "rejected" while any submission is back with its author, otherwise "annotated". Today _advance_task_item_to_annotated_on_submit sets "annotated" regardless, so an item whose one submission is returned reads "annotated" as soon as another annotator submits. The accept path already computes it (item_status_after_accept): share that computation with the human and AI submission paths.
# The divergence test covers sequences of submissions as well as review actions: return one submission, then another annotator submits — the item stays "returned".

The queues are not affected (they read review states), but the item's status, the panel's notices and SCRUM-89's figures read it.

------------------------------------------------------------------
Collaboration (added 2026-09-30): four other changes touch submit_task_item_review_action and the item-status computation. Agree the merge order before starting.
- SCRUM-116 (break): refuses a decision on a submission that does not await the caller, and any decision on a finalised item.
- SCRUM-99 (E3, Yi, break): the adjudication record; its Return sends the item back to open work.
- SCRUM-110 (D9, break): the owner's reopen. It makes status and counts read only the current round of work, so the shared status computation here must use the same rounds.
- SCRUM-24 (B4, Dishank, PR #41): adds assert_task_accepts_work to the review action (active tasks only).
{noformat}
```
