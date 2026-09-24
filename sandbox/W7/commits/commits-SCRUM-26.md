# Commits — SCRUM-26 (D5, atomic submission)

Branch `CS57-Hanchen-scrum-26`, stacked on PR #19 (`CS57-Hanchen` at `6c48bc6`). Plan:
[`../plans/plan-SCRUM-28-26.md`](../plans/plan-SCRUM-28-26.md) → *SCRUM-26 (re-planned 2026-09-19)*.

**Baseline:** 264 passed, 147 subtests (2026-09-19, after merging `origin/main` `2fc9560`).

| # | Commit | Message file | Status | Suite after |
| --- | --- | --- | --- | --- |
| 2 | `refactor(api): raise a domain error from the finalised-item guard (SCRUM-26)` | `commit-SCRUM-26-1-refactor-finalised-domain-error.txt` | ✅ `620e7dd`, pushed 2026-09-19 | 264 / 147 |
| 3 | `refactor(api): let the submit path defer its commits (SCRUM-26)` | `commit-SCRUM-26-2-refactor-defer-submit-commits.txt` | ✅ `5b764aa`, pushed 2026-09-19 | 264 / 147, no test edits |
| 4 | `fix(api): make draft submission atomic and record its annotation (SCRUM-26)` | `commit-SCRUM-26-3-fix-atomic-submission.txt` | ✅ `404ffda`, pushed 2026-09-20 | 269 / 147 (+5 new tests) |
| 5 | `docs: record atomic submission and the draft's annotation link (SCRUM-26)` | `commit-SCRUM-26-4-docs-atomic-submission.txt` | ✅ `48fb057`, pushed 2026-09-20 | docs only |
| — | `docs: several annotators may work one item (D8, client answer 2026-09-17)` | `commit-D8-docs-several-annotators.txt` | ✅ `a54a343`, pushed 2026-09-20 | docs only; not SCRUM-26 — see below |

## Commit 2 — what it touched

- `app/services/task_service.py` — new `TaskItemFinalisedError(task_item)` with `task_item_id` and `status`.
  `assert_task_item_accepts_draft_writes` raises it; the message is word for word the same.
- `app/services/draft_service.py` — `_assert_task_item_accepts_writes` catches it and raises
  `HTTPException(409, detail=str(exc)) from exc`. This is the only call site in the service layer.
- `tests/test_task_item_lifecycle_guards.py` — **the one intended test edit.** Two unit tests expect
  `TaskItemFinalisedError` and assert its `task_item_id` and `status`.

**Evidence.**
- With the code changed and the tests not yet edited, exactly those two unit tests failed, and
  `test_finalised_item_writes.py` (route level: `409`, detail contains "finalised") passed unedited.
- After the test edit: **264 passed, 147 subtests**, the baseline.

**Cross-PR hazard, told to Michael:** PR #22's `record_result` catches `HTTPException` from this guard.
Once this lands, that `except` no longer matches. See `../message-michael-finalised-error.md`.

## Commit 3 — what it touched

- `app/repositories/db_store.py` only — `TaskItemRepository.update`, `AnnotationRepository.create`,
  `AnnotationRepository.update` and `DraftRepository.update` take `commit: bool = True`. With `False` they
  `flush()` instead, in the shape `DraftRepository.create` has had since PR #11. It is keyword-only on the
  three `update` methods, which take `**kwargs`, where a stray `commit` would be silently dropped as an
  unknown field.

**Evidence.**
- Suite unchanged: **264 passed, 147 subtests**, with no test edits, so the default path is unchanged.
- The `commit=False` path had no caller yet, so it was probed in a throwaway script on a file database,
  with the three submit writes made at `commit=False`:
  - the same session saw them;
  - a second connection did not;
  - after `commit`, a fresh connection saw them, and after `rollback` all three were undone.
- Commit 4's rollback tests cover the path formally.

## Commit 4 — what it touched

- `app/services/draft_service.py`:
  - `submit_draft(..., *, commit=True)` makes all its writes with `commit=False` and commits once,
    rolling back on any error;
  - it writes `draft.annotation_id`;
  - with `commit=False`, the caller owns the transaction ("whoever commits also rolls back");
  - `_create_annotation_from_draft` and `_advance_task_item_to_annotated_on_submit` pass `commit` on;
  - a marked place for SCRUM-48's limit sits inside the transaction, before the annotation is written.
- `app/api/routes/drafts.py`:
  - **D1:** `submit_draft(commit=False)`, then the `draft_submitted` history row with `commit=False`,
    then one `db.commit()`, with `rollback()` on any error;
  - F1's hook is the comment at line 267, just before `db.commit()` at line 268;
  - **Decision A (2026-09-20):** the response adds `annotation_id`. The web type
    `ApiDraftSubmitResponse` is unchanged, so the extra field is ignored until D4 needs it.
- `tests/test_draft_service_lifecycle.py` — **the one intended edit:** the mock assertion at line 108
  gains `commit=False`. It guards `expert_send_back` → `annotated`, which is unchanged.
- `tests/test_draft_submission_atomicity.py` (new) — five tests on real SQLite with
  `autoflush=False`, as `SessionLocal` has:
  - the link is recorded;
  - a resubmission links to the author's existing annotation;
  - a failure injected at the item status, at the annotation and at the history row leaves nothing.

**Evidence.**
- **Red:** the new file, run on `5b764aa` in a scratch worktree, fails 5 of 5, each for the reason
  it names — `annotation_id` is `None` (2), or the draft is already `submitted` after the failure (3).
- **Green:** 5 of 5 on `404ffda`. The full suite is **269 passed, 147 subtests**.
- Throwaway probes before the tests existed showed the same:
  - old code: `submitted`, `annotation_id` `None`, 1 annotation, item still `pending`;
  - new code: nothing written.

## Commit 5 and the D8 docs fix

- **Commit 5** (`48fb057`):
  - `api_surfaces.md` gets two paragraphs after SCRUM-28's: the domain error and its 409 mapping, with
    the warning that an unmapped caller gives 500; and submission as one transaction, returning
    `annotation_id`.
  - `workflow_states.md` gets one TaskItem lifecycle note and one invariant.
- **D8 docs fix** (`a54a343`), done at Hanchen's request, 2026-09-20:
  - `workflow_states.md` §3 said "one annotator works an item at a time"; it now follows the client's
    2026-09-17 answer — several annotators per item, drafts uncapped, submissions limited per task, no
    assignment.
  - It is not SCRUM-26, so it is its own commit. It sat in the same file as Commit 5, so Commit 5 was
    staged with `git hash-object` + `git update-index --cacheinfo`, from HEAD plus only its two lines,
    and the diff of each commit was checked before committing.

## Commands (run by Hanchen)

```powershell
cd D:\COMP5703_Capstone\hej
git add apps/hej-api/app/services/task_service.py apps/hej-api/app/services/draft_service.py apps/hej-api/tests/test_task_item_lifecycle_guards.py
git commit -F D:\COMP5703_Capstone\docs\sandbox\W7\commits\commit-SCRUM-26-1-refactor-finalised-domain-error.txt
git push -u origin CS57-Hanchen-scrum-26
```

Opened as draft **PR #23** (base `CS57-Hanchen`) on 2026-09-19. Leaves draft when Commit 4
lands, so Michael can see the class name now. Retarget it to `main` once #19 merges.
