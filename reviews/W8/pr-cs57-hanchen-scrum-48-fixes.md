## Summary

Fixes for #33 (SCRUM-48, story D8), stacked on `CS57-KANISHKA`. When this merges into Kanishka's branch, #33 picks the commits up. It answers @Jingwei-Lin's review of #33 (Changes requested, 25/09). Some of the problems came from my own instructions, so I'm fixing them here rather than handing them back.

**Complete as of 26/09.** The last two planned commits waited for #34 (a review names the annotation it acts on). #34 merged on 25/09, `main` is merged in, and both commits are here.

Four product decisions shape this PR, all made by me because the review turned on them:

- **A. AI-assisted items skip human annotation.** On an `ai_assisted` task, a successful AI annotation is the item's whole first pass (client, 17/09). The item goes straight to review, and a person's submission on it is refused. An item whose AI run failed is annotated by people, as on a human-first task. My message of 23/09 told Kanishka the opposite, and that was wrong.
- **B/C. Each submission is reviewed on its own.** One reviewer may review every submission on an item they did not annotate, and an item is reviewable from its first submission.
- **D. An accept completes the submission it names, not the item.** The item is canonical only when its first pass is complete and every current submission has the approvals its policy requires. Before this, the first accept canonicalised the item, and the finalised-item guard then refused the remaining annotators.
- **E. A reviewer's reject means "redo this", like a return** (26/09). It keeps its existing meaning: the API accepts the resubmission, and the web app tells the author to revise and resubmit. Neither the client's answers nor the design docs make it final. The client's final Reject (R2-1) belongs to the expert, on a dispute.

## Where each review point went

| Review point | Commit |
| --- | --- |
| 1. Draft list hides AI output and colleagues' work | `3dceb42` |
| 2. AI work never reaches a reviewer | `adca6cc` (decision A) |
| 3. Privacy bypass: `GET /drafts/{id}` | `3dceb42` |
| 3. Privacy bypass: `GET .../adjustment` | `0b9b6ca` |
| 4. Review starts before N judgements are in | `11992a2` (queue, decisions B/C) and `4d79cd6` (accept rule, decision D) |
| 5. Counts SCRUM-93 needs | `05365c5` |
| Recording takes | `b05435f` (`record_item_taken`, called from `create_draft` too) |
| Schema: migration, seed, bound, Docs Sync | `295d895`, `5647c03` |
| Lock test | `73d1bcc` |
| Follow-up: rework | `7404afb` and `38e7f4f` (annotator side), `11992a2` (reviewer side) |
| Follow-up: N+1 | `05365c5` |
| Nits: `user_has_governed_action`, `_to_draft_read` docstring, upper bound | `3dceb42`, `295d895` |

**Also found and fixed:** on `1e4eb4a`, all three work-queue routes returned **500 whenever the queue held an item**. They serialised the database row with `task_item_to_read`, which reads a `location_ref` that `TaskItemDB` does not have. The service tests called the service directly, and the route tests only checked role refusals, so nothing reached it (`05365c5`, with a route test using real roles).

## Changes by layer

**Rules** (`app/services/submission_rules.py`, new). It is the one owner of:
- "is this a human submission or the AI's". There were five copies, and SCRUM-38 would have had to find them all;
- "what counts as an approval" (`approvers_of`). The review action's `distinct_approved_reviewers` keeps its name and delegates here;
- the first-pass rule for both annotation modes;
- the per-submission review state;
- `item_complete`.

**Services**
- `DraftService.submit_draft`: the human limit runs under the row lock, followed by the AI-assisted refusal. `create_draft` takes `commit`.
- `AnnotationService`: one visibility predicate (`is_peer_work`, `visible_to_caller`, `assert_visible_to_caller`).
- `TaskWorkQueueService`: rebuilt on grouped queries, so the number of statements does not grow with items. Rows are now `WorkQueueItemRead`. The review queue decides per submission, and the annotate queue hands returned or rejected work back to its annotator.
- `review_policy_enforcement`:
  - `item_status_after_accept` decides the item's status for every accept, single or dual sign-off;
  - `dual_signoff_accept_outcome_after_review` becomes `submission_accept_outcome`, and answers for one submission only.
- `task_history_recorder.record_item_taken`: the helper SCRUM-98 (F1) will move onto its event record.

**Routes and schema**
- The draft list, `GET /drafts/{id}` and the review adjustment read apply the visibility rule.
- The annotation reads use the service predicate, and `total_count` counts everyone's submissions again.
- The queue routes return `WorkQueueItemRead`.
- An accept that leaves the item open returns `next_ui_status = "awaiting_other_submissions"`.
- `user_has_governed_action` now calls the verifying check, so it no longer skips the membership test.

**Web** (`task-item-workspace-sheet.tsx`): on `awaiting_other_submissions`, the panel says the submission was approved and leaves the item's status alone, as it already does for `pending_second_review`. Without this, it would mark the item approved locally.

**Data**
- `migrate_db_schema()` adds `tasks.required_annotators`.
- The seed sets it to 2 on the tasks whose items it gives two annotators.
- The field accepts 1-10.

**Docs**: `api_surfaces.md`, `domain_model.md`, `db_schema_blueprint.md` and `workflow_states.md`.

## Decisions for review

- **A, B/C, D and E**, above.
- **When an item stays open, its status says where the work is.** It is `returned` or `rejected` if any submission is back with its annotator, otherwise `annotated`, so the web app's existing notices still reach the right person.
- **Approvals are counted over a submission's whole history**, as dual sign-off counts them. Rejections and returns count only since its last submission. A resubmission rewrites its annotation in place, so `annotations.updated_at` marks the last submission. The effect is that the reviewer who returned or rejected work may review the resubmission, but someone who already approved it will not be offered it again (`assert_can_add_approval` would refuse them).
- **Visibility treats machine output and the unclaimed placeholder draft as nobody's judgement**, so both stay visible to everyone.
- **The adjustment read never refuses an unnamed request.** An annotator who hasn't submitted gets the pick made among their own and the AI's submissions. The web app asks with no name until they have one, so a 403 there would hide their rework notice. Naming a peer's submission is refused with 403.
- **An annotation list's `total_count` counts every submission**, even when the list itself is filtered. The client allows the count but not the answers.

## Testing

- Backend suite, SQLite: **587 passed, 5 skipped**. Before these commits it was 512 passed, 4 skipped.
- Backend suite, PostgreSQL: **592 passed**, locally (Docker) and in CI. CI is green on both backends for every commit.
- Web: **230 tests pass**, `tsc --noEmit` is clean, and eslint reports 0 errors. The 3 warnings in `task-item-workspace-sheet.tsx` are pre-existing. CI runs the backend only, so these were run locally.
- Each fix commit's new tests were run against the previous commit and fail there. The commit messages list which ones, and which tests are guards that pass both ways.
- The lock test was also checked by deleting `.with_for_update()`: it fails with `'submitted' == 409`.
- Existing tests changed, and why:
  - `test_annotator_list_only_returns_their_own_drafts` is replaced, because the rule it pinned was issue 1.
  - The privacy test's `total_count` changes from 0 to 2 (review point 5).
  - `test_different_reviewer_is_offered_second_review` now sets dual sign-off, because a single-pass task has no second review.
  - One mocked `setUp` gets a real `required_annotators`.
  - The mocked final-approval route test patches the two collaborators it now calls; its assertions are unchanged.
- **Not done yet:** a manual walkthrough in the running app.

## Notes for reviewers

- Read it commit by commit. Each commit is one fix, and its message says what was wrong, what changed and which tests fail before it.
- **The diff includes #32 and #34**, because I merged `main` into this branch and `CS57-KANISHKA` has neither. These 20 files are identical to `main` and already reviewed there, so please skip them:
  - #32: `ai_runs.py`, `ai_batch_service.py`, `test_ai_run_progress.py`, `ai-run-progress-panel*`, `task-overview-panel-with-real-data.tsx`, `lib/api/ai-runs*`, and the two AI batch docs;
  - #34: `schemas/review_actions.py`, `test_review_annotation_selection.py`, `test_development_seed.py`, `lib/api/review-actions*`, `lib/domain/task-types.ts`, `lib/task-workspace-data*`.

  `review_actions.py`, `tasks.py` and `api_surfaces.md` mix both, so the per-commit view is clearest there.
- The merge of `main` (`ea3cb71`) had one conflict, the imports of `test_draft_ownership_routes.py`, resolved by keeping both.

## Known limitations

- Which of several approved submissions is the item's authoritative answer belongs to D4/H4 (SCRUM-37; client R2-2).
- Role-keyed exemption: anyone holding `review` reads peers' answers, including an annotator who also reviews. This is left as a follow-up.
- Arbitrator independence (R2-8) is SCRUM-52's. The adjudication queue checks the role only.
- `ai_batch_service` still filters on `created_by IS NULL` directly. SCRUM-38 should switch it to `submission_rules`.
- `expert_send_back` is untouched. SCRUM-58 replaces it (R2-1).
- `review_policy_enforcement.py` still imports `ReviewDB`, now unused. The line sits next to #37's import changes, so removing it now would make #37 conflict; it goes after #37 merges.
- PostgreSQL dev databases need `init_data.py --reset` after merge, because there is no additive migration there.
