# Review — PR #29, `CS57-Michael-scrum-46-ai-trigger` (SCRUM-46, C2)

2026-09-23. Head `8397270`, base `main` at `23e62a9` (#22 merged). One commit, 12 files, +765 / −38.
No reviews or comments on GitHub yet (checked with `gh pr view 29`).

**Recommendation: request changes.** Finding 1 must be fixed before merge. Finding 2 needs Hanchen's
decision. Findings 3–5 can be done in this PR or recorded as follow-ups.

## Verified

- Backend suite at `8397270`: **421 passed + 147 subtests, 4 skipped**, matching the description. CI is
  green on SQLite and PostgreSQL.
- The trigger, the routing through `submit_draft(commit=False)`, the lease fence over the submission,
  and the pre-call precondition check all behave as described.
- Checked against SCRUM-46's acceptance criteria (the W8 board description):

| # | Criterion | Status |
| --- | --- | --- |
| 1 | Task owner starts a run at any time; returns the batch id; a repeat cannot double-charge | ✅ `POST /tasks/{id}/ai-runs` → 202; 409 while a run is open |
| 2 | A successful item becomes a submitted annotation **authored by the AI**, through SCRUM-26's path; item moves to review | ⚠️ Submitted and in review, but `created_by` is NULL. See finding 2 |
| 3 | The AI annotation does not count toward required annotators (R1-4) | ⏳ Nothing counts yet. SCRUM-48 is not merged, so this holds only until it lands. See heads-up |
| 4 | `result_annotation_id` on `ai_item_jobs`, with a migration step | ✅ SQLite: yes. PostgreSQL: see finding 5 |
| 5 | Failed items stay visible as failed and submit nothing | ✅ But they can never be re-run. See finding 1 |

## Fix before merge

### 1. A dead-lettered item can never be re-run, so "retrying failures creates a new batch" does not work

The PR says a retry of failures is a new batch. But a dead-lettered item keeps its failed draft:
`pending`, `created_by NULL`, `revision_notes = "AI pre-annotation"`. `_has_meaningful_draft` counts
that as annotation work. So `items_needing_ai` leaves the item out, and `evaluate_item_precondition`
would skip it anyway.

Probe, using the PR's own fixture:

```text
run_next_item(..., generate=failed)   -> dead_letter
failed draft: [('pending', None, 'AI pre-annotation')]
items_needing_ai(task_1)              -> []
start_run(task_1)                     -> AiRunConflictError: No task items need AI annotation ...
```

Once an item fails, only a human can move it forward, by claiming the failed draft. On an AI-first task
that is the opposite of the intended route. Also, a 1,000-item run that hit a provider outage can never
be retried.

**Fix:** stop counting the AI's own failed, unclaimed draft as annotation work: `created_by IS NULL`
and `metadata.ai.status == "failed"`. Apply this in both `items_needing_ai` and
`evaluate_item_precondition`. Then decide what the new run does with the old failed draft. Replacing it
is simplest; keeping it adds a second `pending` unclaimed draft to the item. Add one test: dead-letter
an item, call `start_run`, and check it covers that item and ends `succeeded`.

PR #30 relies on the same mechanism: its retry writes no draft *because* a failed draft would count
as meaningful. Whichever PR merges second has to keep both consistent.

## Needs Hanchen's decision

### 2. The AI annotation has no author, and criterion 2 says "authored by the AI"

The client's answer of 2026-09-17 says the version's author is the AI model. The ticket's criterion 2
repeats this. The PR keeps `created_by = NULL`, identifies AI annotations by `created_by IS NULL`, and
leaves a real AI identity to SCRUM-38 / SCRUM-40. The reasoning is sound and written down:
`created_by` is an FK to `users`, and inventing a user would falsify provenance. The model itself is
still traceable, because `annotation_data.metadata.ai` carries `provider` and `model`.

What it costs:
- a second model on the same item cannot be represented, and the run refuses to write one, which is
  correct;
- "is this an AI annotation?" means "does it have no author?", and every later reader has to know that:
  SCRUM-48's count, D4's review screen, and H-epic exports.

Options:
- **A — accept as an interim step:** SCRUM-46's criterion 2 is amended to read "submitted by the AI,
  model recorded in `metadata.ai`", and SCRUM-38 explicitly takes on "AI as a first-class author".
- **B — require it here:** for example, a nullable `ai_model_ref` or `author_kind` column on
  `annotations`, set by the worker. That is another schema change in W8.

**Decided (Hanchen, 2026-09-23): A.** The client's multi-model case is explicitly not the default
(R1-4). The model is already recorded. And B would put yet another schema change into a week that
already has several. To do: amend SCRUM-46's criterion 2 on the board, and add "AI as a first-class
author" to SCRUM-38.

## Should fix (here or as a follow-up)

### 3. An AI submission writes no history, and F1's event hook will not see it

A human submission writes `TaskHistoryRecorder` `draft_submitted` in the same transaction
(`routes/drafts.py:254`). SCRUM-62's provenance event also hooks in at that route
(`routes/drafts.py:267`). The worker calls `DraftService.submit_draft` directly, so an AI submission
leaves **no history row and no event**. The trigger records no "AI run started" either. For a Record
pillar story, the AI's first pass then disappears from the item's history.

Fix: write a history row inside `record_result`'s transaction, using `requested_by` as the operator.
F4 (SCRUM-40) later separates system actors from user actors. Also tell Yi that SCRUM-62 must hook the
worker path, not only the route.

### 4. "Decisions taken with the client, recorded here" — not raised (decided 2026-09-23)

The description lists five decisions under that heading. Our client records (`info/client-question.md`)
support only one of them: one AI annotation per item, unless the task defines a multi-model experiment
(R1-4). Nothing in our records shows the other four came from the client:
- a retry is a new batch;
- a run is refused with 409 while another is open;
- the trigger ignores `HEJ_AI_EXECUTION_MODE`;
- a run is refused on a non-AI task.

**Hanchen's decision: not raised.** All four are reasonable in themselves, and they are taken as design
Michael settled with the client directly. Same call as the unasked question on #22 ("the client resolved
both"). Recorded here so a later reader knows the four are not in our own client record.

### 5. PostgreSQL dev databases need a reset after merge

`migrate_db_schema()` returns early on anything other than SQLite (decided at #24: Postgres dev
databases are disposable). The PR checks the migration only on SQLite. Add a line to the description,
and to the merge-day message, saying everyone on Postgres re-seeds after merging.

## Notes, no change needed

- `except HTTPException` around `submit_draft` in the worker is acknowledged in the PR as a follow-up.
  It is acceptable, because `DraftService` maps `TaskItemFinalisedError` to 409 and the handler rolls
  back before `_finish`.
- On a task registered in `inline` mode, items already carry a pending, unclaimed AI draft, so the
  trigger leaves them out. This is consistent, but worth one sentence in `api_surfaces.md`.
- API only. The ticket says ONLY BACKEND. The screen for C2 comes through SCRUM-5 (#32).

## Heads-up for other tickets

- **Kanishka, SCRUM-48:** the submission cap must count human submissions only (R1-4). With this PR,
  an AI submission is an annotation with `created_by IS NULL`, attached to a `submitted` draft that also
  has `created_by IS NULL`. The count must exclude those rows, or the AI takes a human place.
- **Merge order with #30:** they conflict in three files (the PR says 6 hunks, none semantic).
  Suggested order: #30 first, since it is ready. Then #29 rebases, with finding 1 fixed on top of #30's
  retry rule.

---

# Re-review — `2c2bd51` (2026-09-23)

Michael merged `main` in rather than rebasing, so `8397270` — the commit reviewed above — is untouched
and `git diff 8397270..HEAD` is the response. `main` now carries #30, merged 2026-09-23.

**Recommendation: approve.** All four findings are addressed, and each was checked here rather than
read.

## Verified on `2c2bd51`

- Suite: **454 passed + 147 subtests, 4 skipped** (was 421 at `8397270`), matching the description.
  CI green on SQLite and PostgreSQL on this head.
- **Finding 1 — fixed.** `_is_unclaimed_ai_failure` (`created_by IS NULL` *and*
  `metadata.ai.status == "failed"`) is consulted by both `items_needing_ai` and
  `evaluate_item_precondition`. Probe, replacing the one from the first round:

  ```text
  run -> dead_letter (permanent)
  items_needing_ai      -> ['item_1']        (was [])
  start_run             -> batch, total_items 1
  second run            -> succeeded
  drafts                -> one only: submitted, unowned, linked to its annotation
  jobs                  -> [dead_letter/permanent, result_draft_id NULL] then [succeeded, both ids set]
  item                  -> annotated,  annotations -> 1
  ```

  The earlier run's `result_draft_id` goes NULL through `ON DELETE SET NULL`, as he says. That FK is
  enforced at runtime too: `database.py` sets `PRAGMA foreign_keys=ON` for SQLite, and PostgreSQL
  enforces it natively.
- **Finding 2 — done in this PR, not deferred.** `_record_ai_submission` writes `draft_submitted`
  inside `record_result`'s transaction, attributed to `requested_by`. Probes: the row appears on
  success; a run with `requested_by = None` writes none and still succeeds; and a worker whose lease
  lapsed leaves **0 audit rows, 0 drafts, 0 annotations** — the history row is discarded with the rest.
- **Finding 3 — in the description**, with the reason (`migrate_db_schema()` returns early off SQLite).
- **Finding 4 — in `api_surfaces.md`**, including the exception the fix created: an item whose inline
  pass failed is now picked up.
- **Mutation checks**, both claims reproduced: making `_is_unclaimed_ai_failure` return `False` fails
  `test_a_dead_lettered_item_can_be_retried_by_a_later_run`; removing the `_record_ai_submission` call
  fails `test_the_ai_submission_appears_in_the_item_history`. Nothing else fails either way.
- Two new tests guard the edges: `test_a_human_draft_still_stops_a_later_run` (the exemption cannot
  widen to human work) and `test_a_failed_item_writes_no_submission_history`.
- The stale comment in `record_result` about why a retry writes no draft was rewritten rather than left
  to contradict the new rule.

## Carried forward, not blocking

- #30 merged with its four non-blocking points open: parse failures classified `permanent`,
  `try_claim_candidate` not re-checking `next_attempt_at`, an analyzer failure writing no draft, and
  the duplicate classifier with #31. They now need a home — SCRUM-3 is closed by the merge, so either
  a follow-up ticket or C2's remaining work.
- SCRUM-46's criterion 2 and SCRUM-38 were amended on the board on 2026-09-23 (see
  `../../sandbox/W8/jira/jira-scrum-46-38-ai-author.md`).
