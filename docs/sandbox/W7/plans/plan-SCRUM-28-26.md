# Sprint plan — SCRUM-28, SCRUM-26 (W7)

**Branches:** `CS57-Hanchen` (SCRUM-28, PR #19) and `CS57-Hanchen-scrum-26`, stacked on it (SCRUM-26) ·
**Story:** D5 — Finalised means finalised · **Baseline:** `origin/main` at `5070efd` for Commit 1; the
SCRUM-26 section gives its own baseline.

This plan revises Commits 2–5 of [`../../W6/plans/plan-SCRUM-25-26-28.md`](../../W6/plans/plan-SCRUM-25-26-28.md)
for the code and decisions as they stand now. The W6 plan keeps the background — why the guard sits in
the service layer, the stale-page reproduction, the D4 boundary — and is not restated here.

| Ticket | Closes | D5 criterion | Commits |
| --- | --- | --- | --- |
| SCRUM-28 — Prevent finalised annotations being overwritten | Issue 2 | 1 — new work against a finalised item is refused | 1 (docs included) |
| SCRUM-26 — Make draft submission atomic | Issue 11 | 3 — a submission completes fully or not at all | 2, 3, 4, 5 — **re-planned 2026-09-19**, see [SCRUM-26 (re-planned)](#scrum-26-re-planned-2026-09-19) |

D5 criterion 2 — reopening a finalised item — is not in either ticket. It waits on client follow-up F5
(`../../../info/client-question.md`).

---

## What changed since the W6 plan

- **`main` moved 20 commits.** PRs #9, #11 and #17 merged, among others. `CS57-Hanchen` is 1 commit
  ahead and 20 behind. Every W6 line number is stale.
- **PR #11 started the deferred-commit pattern.** `DraftRepository.create` (`db_store.py:1103`),
  `TaskItemRepository.save_many` (`:939`) and `DataPointerRepository.create` (`:815`) now take
  `commit: bool = True`. The three methods submission uses still commit unconditionally, so Commit 2 is
  still needed — and should copy PR #11's shape rather than invent one.
- **Client answers.** Q3: every author keeps their own version. Q4: an expert may not finalise; the
  item returns to the reviewer. Neither changes the refusal rule. Reopening is unanswered (F5), so this
  plan refuses and never reopens.
- **W6 Commit 5 is dropped from these tickets.** "One pending draft per item" was a team rule for one
  annotator per item. The client has since answered F4 (2026-09-17): several annotators per item, drafts
  not capped, submissions capped per task — and no assignment. The cap is SCRUM-48's, in `submit_draft`. Tracked as S8 in [`defects-SCRUM-25.md`](defects-SCRUM-25.md).
- **Per-author versioning stays out.** Resubmission still overwrites the author's own annotation in place
  (S5). Changing that changes what review and export pick, which is SCRUM-27's rule.

---

## Before you start

*Settled on 2026-09-16 — the three steps below are done, and what they found is recorded here.*

1. **The stash is gone.** `git stash list` is empty; nothing was lost.
2. **The branch already carries `main`.** Local `CS57-Hanchen` is exactly `origin/main` (`5070efd`).
   But `origin/CS57-Hanchen` holds one commit the local branch does not — `e2878b8`, the PR #15 merge,
   whose content is already in `main`. **A push would be refused as a non-fast-forward.** Before
   pushing, merge the remote branch in — a merge, not a rebase, and never a force push:
   ```powershell
   cd D:\COMP5703_Capstone\hej
   git fetch origin
   git merge origin/CS57-Hanchen
   ```

**Update 2026-09-18.** Commit 1 is `1adc707`; the remote branch was merged in (`65c8133`), pushed, and
PR #19 is open and awaiting review. `main` has since moved four commits — PR #16 among them — so the
branch is 3 ahead and 4 behind. Before PR #19 merges, merge `origin/main` in and rerun the suite; the
count will no longer be 235.

3. **Baseline recorded: 226 passed, 138 subtests** (2026-09-16, at `5070efd`).
   After Commit 1 it is **235 passed, 147 subtests**. Commit 2 must return to whatever the count is
   when it starts, with no test edits.
   ```powershell
   cd apps\hej-api ; .venv\Scripts\python -m pytest -q
   ```

---

## Order, and why

**Commit 1 first, then SCRUM-26's Commits 2–5** (order in [SCRUM-26 (re-planned)](#scrum-26-re-planned-2026-09-19)). The
refusal guard is small, and its test — a finalised annotation is unchanged after an attempted overwrite —
becomes the safety net for the atomic-submission refactor.

---

## Commit 1 — `fix(api): refuse new annotation work on finalised task items (SCRUM-28)` ✅ done

Closes issue 2, D5 criterion 1. **Built on 2026-09-16**, message drafted in
[`../commits/commits-SCRUM-28.md`](../commits/commits-SCRUM-28.md); docs (planned as Commit 4) went into
the same commit, so SCRUM-28 is one commit, not two.

### What the build changed against this plan

- **The helper takes the item, not its id**, and `DraftService._assert_task_item_accepts_writes` does the
  loading for all three call sites. An unknown item is `404` rather than the foreign-key `500` it used to
  be — agreed as in scope, since the guard has to load the item anyway.
- **No status normalisation was needed.** `TaskItemStatus` is a `StrEnum`, so set membership already
  matches a plain string; `test_reads_a_plain_string_status` pins that.
- **`reviewed` is asserted as *allowed*.** It is not in `TERMINAL_TASK_ITEM_STATUSES` but is in
  `FINALIZED_EXPORTABLE_TASK_ITEM_STATUSES` — issues 19 and 27. The test records today's behaviour on
  purpose, so SCRUM-43 turns it red when Dishank settles what "finished" means.

### What the manual walkthrough found (2026-09-16)

Both matter for SCRUM-26 and for the review stories, not just here:

- **The web app's save path hits `create_draft`, not `update_draft`.** Once a draft is `submitted`,
  `findPendingDraft` finds no pending row and `upsertDraft` posts a new draft instead of patching. This
  plan's claim that "`update_draft` matters most, because the web app saves through `PATCH /drafts/{id}`"
  holds only while a pending draft exists. Guarding all three paths is what made the refusal appear.
- **`submit_draft`'s guard is unreachable from the browser**, because the front end always saves before
  submitting and is refused at that first step. It is the API-level backstop, covered by tests only.
- **The stale page has to be re-opened from *Items*.** The sheet closes itself ~900 ms after a successful
  action, and the Annotate queue lists only Draft, Returned and Rejected — so a submitted item leaves it.
  `ITEMS_PAGE_FILTERS` has a Submitted group, and `canAnnotate("submitted")` is true, which is both how
  the walkthrough reproduces the race and why the race is real: an annotator may legitimately reopen
  submitted work while review is in flight.

### What is wrong

- `DraftService.submit_draft` (`app/services/draft_service.py:113`) checks only that the draft is
  `pending`. Nothing checks the task item.
- It then calls `_create_annotation_from_draft` (`:152`), which finds the author's existing annotation
  (`:184`) and overwrites `annotation_data` in place (`:191`).
- `_TASK_ITEM_STATUSES_SKIP_ANNOTATED_ON_SUBMIT` (`:16`) only stops the item's status moving; the
  content is still overwritten, so a `canonicalized` item keeps its status while its answer changes.
- `create_draft` (`:31`) and `update_draft` (`:64`) do not check the item either. `update_draft` matters
  most: the web app saves through `PATCH /drafts/{id}`.

### How an item becomes finalised

`canonicalized` is written by:
- a reviewer's `accept` — `_map_action_to_task_item_status` (`app/api/routes/review_actions.py:112`);
- dual sign-off reaching its approvals — `review_policy_enforcement.py:121`;
- an escalation decision of `finalize` — `_map_escalation_decision_to_task_item_status` (`review_actions.py:128`).

The last path goes away under client Q4; that is Parth's SCRUM-52 E3 part, not this ticket. The guard
does not care how an item got there.

### Do this

Add the guard beside its sibling `assert_task_item_status_update_allowed` (`app/services/task_service.py:113`),
reading the same `TERMINAL_TASK_ITEM_STATUSES` (`:96`), and match its message style:

```python
def assert_task_item_accepts_draft_writes(task_item: TaskItem) -> None:
    """Refuse new annotation work against an item whose result is final."""
    if task_item.status in TERMINAL_TASK_ITEM_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Task item {task_item.id} is finalised ({task_item.status}) and does not accept new "
                "annotation work. Reopening a finalised item is not available yet."
            ),
        )
```

Call it in the service layer — `create_draft`, `update_draft` and `submit_draft` — after loading the
item with `self.db_store.task_items.get(...)`, so every caller is covered. Leave `delete_draft` alone:
deleting a pending draft on a finalised item removes no annotation.

Item status may arrive as a `TaskItemStatus` enum or a plain string; compare the value, as
`_advance_task_item_to_annotated_on_submit` (`draft_service.py:158`) already does.

### Tests

- **`tests/test_task_item_lifecycle_guards.py`** — extend with unit tests for the helper, in the file's
  existing `SimpleNamespace` style: `canonicalized` is refused; `pending`, `annotated`, `returned`,
  `rejected`, `disputed` and `expert_send_back` are allowed.
- **`tests/test_finalised_item_writes.py`** (new) — real in-memory SQLite, copying the `setUp` of
  `tests/test_draft_ownership_routes.py` (`StaticPool`):
  1. `create_draft`, `update_draft` and `submit_draft` against a `canonicalized` item each return `409`.
  2. **The one that fails today:** seed a `canonicalized` item with an annotation and an approving
     `ReviewDB` row, attempt a submission, then assert `annotation_data`, `version`, `confirmed_by` and
     the review row are all unchanged.
  3. A `returned` and an `expert_send_back` item still accept a submission — the send-back loop must not
     be blocked.

Check each new test is red before the fix.

### In the PR description

- Closes D5 criterion 1 only. Criterion 2 waits on client follow-up F5; criterion 3 is SCRUM-26.
- "Finalised" means `canonicalized`. `FINALIZED_EXPORTABLE_TASK_ITEM_STATUSES` (`task_service.py:106`)
  also names `reviewed` and `approved` — that disagreement is issues 19 and 27, Dishank's SCRUM-43.

---

## SCRUM-26 (re-planned 2026-09-19)

This replaces the original Commits 2–4, which were written against `5070efd`. Three things have changed
since:

- **SCRUM-28 is PR #19**, open and unmerged. `origin/main` is at `17673c8`.
- **The finalised-item guard becomes a domain error** (agreed 2026-09-18 at the review of Michael's PR
  #22, and recorded in `roadmap.md`). The C2 worker applies the same guard and should not have to catch
  an HTTP exception to make a domain decision.
- **The route writes a history row after the service has committed** (`routes/drafts.py`, the
  `draft_submitted` record), so it sits outside the transaction this ticket creates. See decision D1.

Line numbers below are for `CS57-Hanchen` (`65c8133`) merged with `origin/main` (`17673c8`). The
repository layer is unchanged since `5070efd`, so the `db_store.py` numbers still hold.

### Branch (decided 2026-09-19)

A **new branch stacked on PR #19**, as Michael stacked #22 on #21. Commits pushed to `CS57-Hanchen`
would land in #19 and restart its review.

```powershell
cd D:\COMP5703_Capstone\hej
git fetch origin
git switch CS57-Hanchen
git merge origin/main              # the step this plan already required before #19 merges
cd apps\hej-api ; .venv\Scripts\python -m pytest -q ; cd ..\..
git push                           # updates PR #19 with the merge commit only
git switch -c CS57-Hanchen-scrum-26
```

Open the PR with base `CS57-Hanchen`, and retarget it to `main` once #19 merges. Merge order: #19, then
this one.

**Done 2026-09-19:** `origin/main` (`2fc9560`, now including PRs #20 and #21) merged into `CS57-Hanchen`
as `6c48bc6` and pushed to PR #19; `CS57-Hanchen-scrum-26` created from it.

**Baseline: 264 passed, 147 subtests** — the 247 first measured plus #21's 17 job-schema tests.

### Decision D1 — confirmed 2026-09-19

**D1 — does the `draft_submitted` history row join the transaction?** **Yes** (Hanchen, 2026-09-19).
- **Today:** `routes/drafts.py` calls `service.submit_draft(...)`, which commits, and then
  `TaskHistoryRecorder.record(...)`, which commits again. If the history write fails, the submission is
  already saved, yet the caller receives a `500`.
- **Why it belongs here:** D5 criterion 3 says a submission "completes fully or not at all", and
  SCRUM-62 (F1, Yi) must add its provenance event at exactly this point. The roadmap already says that
  event "must join Commit 3's transaction".
- **Cost:** `submit_draft` takes `commit: bool = True`. The route passes `False`, records the history
  row with `commit=False` (the recorder supports it), then commits once. About ten lines in the route;
  no other caller changes.

### Order

**2 → 3 → 4 → 5.** Commit 2 is small and independent of the others, and Michael's worker needs it
first. Commit 3 is mechanical and changes no behaviour, so the reviewer can see that the risky commit,
4, stands on a proven base.

---

### Commit 2 — `refactor(api): raise a domain error from the finalised-item guard (SCRUM-26)`

No behaviour change at any route.

**Do this**
- In `app/services/task_service.py`, next to `TERMINAL_TASK_ITEM_STATUSES` (`:96`), add:
  ```python
  class TaskItemFinalisedError(Exception):
      """A finalised task item refuses new annotation work (D5)."""

      def __init__(self, task_item: TaskItem) -> None:
          self.task_item_id = task_item.id
          self.status = task_item.status
          super().__init__(
              f"Task item {task_item.id} is finalised ({task_item.status}) and does not accept new "
              "annotation work. Reopening a finalised item is not available yet."
          )
  ```
- Make `assert_task_item_accepts_draft_writes` (`:137`) raise it instead of `HTTPException`. The message
  stays word for word the same.
- In `DraftService._assert_task_item_accepts_writes` (`draft_service.py:32`), catch the error and
  re-raise `HTTPException(status_code=409, detail=str(exc)) from exc`. That method is the only place the
  service layer calls the guard, so the three draft routes keep their `409` and its detail unchanged.
- **Not** a global `exception_handler` in `main.py`. Decided 2026-09-19: no new app-wide mechanism for
  one error.

**Tests**
- `tests/test_task_item_lifecycle_guards.py` (`:101`–`:137`): the helper's unit tests expect
  `TaskItemFinalisedError` instead of `HTTPException`. **This is the one intended test edit**, and it
  changes the contract under test. Also assert that `task_item_id` and `status` are set.
- `tests/test_finalised_item_writes.py`: **no edits.** Its route-level `409` assertions passing
  unchanged is the proof that the mapping holds.

**Tell Michael when it lands.** #22's `ai_batch_service.assert_task_item_accepts_draft_writes` catches
`HTTPException` from this guard. It then switches to `except TaskItemFinalisedError`, and its `getattr`
fallback can go (roadmap: *SCRUM-26 ↔ SCRUM-2*).

---

### Commit 3 — `refactor(api): let the submit path defer its commits`

No behaviour change. The enabler for Commit 4.

Add `commit: bool = True` to the four repository writes submission makes. Copy the shape of
`DraftRepository.create` (`db_store.py:1103`–`1121`): when `True`, commit via `_commit_or_rollback` and
refresh; when `False`, `flush()` and refresh.

| Method | Line |
| --- | --- |
| `TaskItemRepository.update` | `db_store.py:907` |
| `AnnotationRepository.create` | `:1012` |
| `AnnotationRepository.update` | `:1042` |
| `DraftRepository.update` | `:1127` |

**`flush()` is required, not a nicety.** The app's sessions run with `autoflush=False` (Michael hit this
in #22). `_create_annotation_from_draft` queries `find_by_item_and_creator` right after the draft update
claims `created_by`. Without a flush, that query cannot see the claim.

**The default stays `True`.** The suite must match the baseline — 264 / 147 — with **no test edits**.
That is the proof.

---

### Commit 4 — `fix(api): make draft submission atomic and record its annotation (SCRUM-26)`

Closes issue 11 and D5 criterion 3: subtask 2 (one transaction) and subtask 3 (persist the link).

**What is wrong** (`draft_service.py`)
1. **Three separate commits.** The draft update (`:174`), the annotation write (`:216` or `:226`) and the
   item status (`:196`) each commit on their own. A failure between them leaves a submitted draft with no
   annotation, or an item out of step with its draft.
2. **`draft.annotation_id` is never written.** `submit_draft` discards what
   `_create_annotation_from_draft` returns (`:177`). As a result `approve_draft` falls back to the
   item's first `is_latest` annotation (`:266`–`:271`), which may belong to another author (S7).

**Do this**

```python
def submit_draft(self, draft_id, payload=None, user_id=None, *, commit: bool = True):
    draft = self.get_draft(draft_id)
    self._assert_task_item_accepts_writes(draft.task_item_id)   # SCRUM-28, unchanged position
    # existing pending check (:154), then update_data as today, including _claim_fields
    try:
        draft = self.db_store.drafts.update(draft_id, commit=False, **update_data)
        annotation = self._create_annotation_from_draft(draft, confirmed_by=draft.created_by, commit=False)
        draft = self.db_store.drafts.update(draft_id, commit=False, annotation_id=annotation.id)
        self._advance_task_item_to_annotated_on_submit(draft.task_item_id, commit=False)
        if commit:
            self.db.commit()
    except Exception:
        self.db.rollback()
        raise
    if commit:
        self.db.refresh(draft)
    return draft
```

- Pass `commit` through `_create_annotation_from_draft` and `_advance_task_item_to_annotated_on_submit`
  to the Commit 3 parameters.
- **Refusal order in `submit_draft`**, to agree with Kanishka before either PR merges (roadmap risk
  *Parallel branches*):
  1. finalised item (SCRUM-28), then
  2. draft is `pending`, then
  3. her per-task submission limit (SCRUM-48).

  Checks 1 and 2 come before the `try`, so they never open a write. **Check 3 must run inside the
  `try`**, before the annotation is written, with the task item row locked
  (`with_for_update()`). A check made before the transaction lets two simultaneous submissions both
  take the last place (corrected 2026-09-19; this line first said all three came before). Leave a
  marked spot for it in Commit 4. Nobody's branch touches `submit_draft` yet (checked 2026-09-19).
- **D1 (confirmed):** in `routes/drafts.py`, call `service.submit_draft(..., commit=False)`, record the
  `draft_submitted` history row with `commit=False`, then `db.commit()`, with a `rollback()` on failure.
- **Scope boundary.** Write the link; do not change its consumers. `review_actions._latest_annotation`
  and `approve_draft`'s fallback stay as they are — that is SCRUM-27.

**Tests — `tests/test_draft_submission_atomicity.py` (new)**, real in-memory SQLite (`StaticPool`, the
`setUp` of `tests/test_finalised_item_writes.py`). Mocks cannot prove a rollback.

1. **Happy path:** after submission, `draft.annotation_id` points at the annotation it created.
2. **Resubmission by the same author:** `annotation_id` points at that author's existing annotation.
3. **Rollback — the one that fails today:** patch `TaskItemRepository.update` to raise. Afterwards the
   draft is still `pending` with no `submitted_at`, no annotation row exists for it, and the item's
   status is unchanged.
4. **Rollback, annotation step:** patch `AnnotationRepository.create` to raise. Same assertions. This
   proves the draft update is rolled back too.
5. **D1, route level (`TestClient`):** make `TaskHistoryRecorder.record` raise. The response is `500`,
   and the draft is still `pending`.

Check tests 1, 3, 4 and 5 are red on Commit 3 before writing Commit 4.

**Existing test to edit, and why.** `tests/test_draft_service_lifecycle.py:108` asserts
`task_items.update.assert_called_once_with("item_1", status=TaskItemStatus.ANNOTATED)`. The call now
carries `commit=False`, so add that argument. The test pins the call's shape, not its behaviour, and the
behaviour it guards — `expert_send_back` advances to `annotated` — is unchanged. Say so in the commit
body.

---

### Commit 5 — `docs: record atomic submission and the draft's annotation link (SCRUM-26)`

SCRUM-28's docs went into Commit 1. Only SCRUM-26's contract is new:

- `hej/docs/design/backend/api_surfaces.md` — submission is one transaction; the submitted draft
  carries `annotation_id`; the finalised-item refusal is a domain error mapped to `409`.
- `hej/docs/design/product/workflow_states.md` — submission moves draft, annotation and item together
  or not at all.

Confirm both paths exist on the branch before editing.

---

## Not in these tickets

| Item | Why not here | Where |
| --- | --- | --- |
| Reopening a finalised item (D5 criterion 2) | Client follow-up F5 | After the answer |
| Per-author versioning (S5) | Changes what review and export pick — SCRUM-27's rule, waiting on F1 | A separate commit after Commit 4 |
| One pending draft per item (W6 Commit 5) | Dropped: F4 answered 2026-09-17 — several annotators per item, drafts not capped. The per-task *submission* cap is SCRUM-48's | S8 in `defects-SCRUM-25.md` |
| Removing the expert's `finalize` (client Q4) | Adjudication flow | Parth, SCRUM-52 E3 part |
| `_latest_annotation` reading `annotation_id` | Which annotation review shows | SCRUM-27 |
| SCRUM-25 follow-ups S1–S4 and S9 | Draft ownership, not finalisation | `defects-SCRUM-25.md` |
| AI output as a submitted annotation authored by the AI (client answer 2026-09-17) | C2's routing to review, not D5. It should reuse Commit 4's transaction | Recommended for SCRUM-46 in the review of PR #22 — not yet decided |

---

## Coordinate this week

| Who | Why |
| --- | --- |
| Dishank — SCRUM-43 | He unifies "finished" for completion and export. Finished-for-export and locked-against-new-work may rightly differ, so agree on day one whether the guard keeps `TERMINAL_TASK_ITEM_STATUSES`. You both edit `task_service.py:96`–`135`; agree who merges first |
| Kanishka — SCRUM-48 API | Rescoped 2026-09-17: there is no assignment. Her per-task submission limit is a third refusal in `DraftService.submit_draft`, beside Commit 1's guard and Commit 4's transaction. Proposed order (Commit 4): finalised item, then draft is `pending` (both before the transaction), then her limit — inside the transaction, with the item row locked, so two people cannot both take the last place. Agree it, and who merges first. Commit 3 changes `TaskItemRepository.update`, which her queue may read |
| Yi — SCRUM-62 (F1) | Submission is a decision point that writes a provenance event. It must join Commit 4's transaction. D1 is confirmed, so the hook is the route: `submit_draft(commit=False)`, then the history row and Yi's event, then one commit |
| Michael — SCRUM-2 (PR #22) | His worker catches this guard's `HTTPException`. After Commit 2 he catches `TaskItemFinalisedError` instead and drops his `getattr` fallback. Tell him the day Commit 2 is pushed. If SCRUM-46 makes AI output a submitted annotation, it should go through `submit_draft`'s transaction too |
| Parth — SCRUM-94 | His only W7 ticket since 2026-09-18: PostgreSQL, which changes `app/core/database.py`. Commit 4's transaction runs on it — and on SQLite with WAL, which his first merge now carries — so merge `main` once it lands and rerun the suite. SCRUM-51 and SCRUM-86 — his `review_actions.py` work that needs to know about the guard — moved to W8 |

---

## Definition of done

**SCRUM-28 ◑ awaiting review (PR #19) · SCRUM-26 ○ planned 2026-09-19**

- [x] **SCRUM-28** demonstrable in the running app — `../tests/manual-test-SCRUM-28.md`, run on
      2026-09-16: the refusal appears in the browser on a stale page, for both save and submit.
- [ ] **SCRUM-26** demonstrable — extend that walkthrough: submit normally, and in the browser's network
      tab see the submit response's `annotation_id` set (`DraftRead` exposes it).
- [x] SCRUM-28's logic ships with tests in the same commit.
- [x] Issue 2 has a test that fails against the old behaviour — verified by reverting the three calls:
      5 of 6 red, then restored.
- [ ] Issue 11 has one — Commit 4 tests 3, 4 and 5, red on Commit 3.
- [x] SCRUM-28's docs updated in the same commit.
- [ ] Reviewed by someone other than you.

Run before every commit:

```powershell
cd D:\COMP5703_Capstone\hej\apps\hej-api ; .venv\Scripts\python -m pytest -q
```

---

## Risks

| Risk | Mitigation |
| --- | --- |
| `commit=False` leaks into other callers | Default `True`; Commit 3 matches the baseline with no test edits |
| The domain error changes a `409` detail or status | Commit 2 leaves `test_finalised_item_writes.py` untouched; its route assertions must pass unchanged |
| PR #19 merges after changes that conflict with the stacked branch | Merge `CS57-Hanchen` into `CS57-Hanchen-scrum-26` after every push to #19; never rebase |
| The guard blocks the send-back loop | Commit 1 test 3 covers `returned` and `expert_send_back` |
| SCRUM-43 redefines "finished" under the guard | Agree with Dishank on day one; the PR states the guard means `canonicalized` |
| Conflicts in `db_store.py` or `task_service.py` | Tell Kanishka and Dishank which lines you touch; merge `main` in before opening the PR |
| F5 never gets answered this sprint | Refusal ships alone; D5 criterion 2 carries over, and D5 stays working |
