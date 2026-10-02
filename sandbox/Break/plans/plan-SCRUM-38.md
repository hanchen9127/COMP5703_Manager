# Plan — SCRUM-38 (F3: outputs stay separate, every write a version)

2026-10-02. Hanchen's ticket, in the **Mid-semester Break** sprint on the board, 3 points. The break
sprint closes after the client meeting on Wednesday 7 Oct. The PR must be **open for review by then**
to count as break work (roadmap → Week boundaries), and ideally merged, because SCRUM-99 and W9's
day-one schema order wait on it.

- **Spec (the big picture):**
  `../../../specs/2026-10-02-F3-separate-versioned-outputs/` — `requirements.md`, `plan.md`,
  `validation.md`. This file is how it gets built, commit by commit, and does not repeat the
  decisions.
- **Ticket text:** `../jira/jira-break-descriptions.md` → SCRUM-38 (2026-10-01).
- **Branch:** `CS57-Hanchen-scrum-38`, from `main` **after PR #46 merges**. #45 and #46 change the same
  files (`submission_rules.py`, `draft_service.py`, `db_models.py`, `database.py`, `db_store.py`).
  Branching earlier means resolving their conflicts by hand.
- **One PR** (Hanchen, 2026-10-02). Commits are ordered so the authoritative-marker helper is on the
  pushed branch early. Yi can then read the real signature, not only the agreed one.

## Before the first commit

| # | What | With |
| --- | --- | --- |
| 1 | Agree the authoritative-marker helper's signature (proposal below) | Yi (SCRUM-99) |
| 2 | Agree the schema order for the break: #46 → SCRUM-38 → SCRUM-99. PostgreSQL dev databases reset after each | Jingwei, Yi |
| 3 | Check that #39's evaluation cases (Jingwei, `apps/hej-api/evaluation/cases/`) and SCRUM-109 (Parth) do not hold an annotation id across a resubmission | Jingwei, Parth |

**Helper proposal** (`app/services/annotation_versions.py`):

```python
def mark_authoritative(db, annotation, *, actor_id: int | None, cause: str) -> None
    # Marks one current version on its item. Refuses (409) if another version on the
    # item is already marked. Refuses if the version is not current. cause is one of
    # "adjudication_accept" (SCRUM-99) and "canonical_rule" (H4, W9). Writes into the
    # caller's transaction and never commits.

def clear_authoritative(db, task_item_id: str) -> str | None
    # Removes the item's marker, returning the id it was on. Called by reopen_task_item (#46).
```

The marker records who set it, when and why: `authoritative_by`, `authoritative_at`,
`authoritative_cause`. F1 (W9) can then turn each marker into an event without reconstructing it.

## What the code does (checked on #46's head `ce951c3`, 2026-10-02)

- **`AnnotationDB`** (`app/models/db_models.py:337`) has:
  - `base_annotation_id` (the version group's root; `create()` points a first version at itself);
  - `version`, `is_latest`, `created_by` (FK `users`, NULL for AI);
  - `submitted_at` (#35);
  - `superseded_by_reopen_id` and `superseded_at` (#46).

  It has no author role, no model and no derivation link.
- **`AnnotationRepository.create()`** (`db_store.py:1446`) takes no role or link. **`update()`** skips
  `None` values. It is the path by which a resubmission rewrites content.
- **Machine authorship is `created_by IS NULL`** in:
  - `submission_rules.py:33-39`: `HUMAN_AUTHORED`, `MACHINE_AUTHORED`, `is_machine_annotation`, used at
    `:55` and `:171`;
  - `ai_batch_service.py:180` (`ai_annotation_for_item`) and `:235` (`items_needing_ai`);
  - `annotation_service.py:25`.

  `drafts.py:198`, `resource_scope.py:82` and `submission_rules.py:199` are about **drafts** (an
  unclaimed draft), not authorship. Leave them.
- **The AI writes through people's path.** `ai_batch_service.py` creates a draft with
  `created_by=None` and calls `DraftService.submit_draft`. Then `_create_annotation_from_draft` calls
  `find_by_item_and_creator(item, None)`, which renders as `IS NULL` and finds *any* AI row. **That is
  why a second model would overwrite the first.** The precondition at `:886`
  (`ai_annotation_for_item`) stops it today by skipping the item.
- **`metadata.ai`** (`integrations/ai_preannotator.py:228`) has `status`, `provider`, `model`, the
  schema, labels and, on failure, the error fields. There is **no model version**. The version column
  is filled only when a provider reports one, and is otherwise NULL, including in the backfill.
- **A resubmission rewrites in place**: `draft_service.py:388-401`, where `update()` sets
  `annotation_data`, `submitted_at` and `confidence=90`. Five tests pin this, each to be flipped and
  named in its commit:
  - `test_draft_submission_atomicity.py:195`;
  - `test_item_completion.py:140`;
  - `test_review_decision_refusals.py:158`;
  - `test_task_work_queues.py:540`;
  - `test_task_item_reopen.py:562` (`test_a_resubmission_within_a_round_still_rewrites_in_place`).

  `test_finalised_item_writes.py` documents the old overwrite as the bug it guards against. Re-read
  it, but its assertion should still hold.
- **The history read is broken.** `GET /annotations/{id}/history` → `AnnotationRepository.list_all_versions`
  (`db_store.py:1541`) filters `AnnotationDB.id == annotation_id`, so it always returns one row.
- **The normalised export** (`tasks.py:1300-1335`) keeps one annotation per `(item, created_by)`. Two AI
  models share `created_by = NULL`, so one would hide the other. The key needs the model.

## Commits

### Commit 1 — `feat(api): record each annotation's author role and model (SCRUM-38)`

- `AnnotationDB` gains:
  - `author_role` (`annotator` | `reviewer` | `ai_model`, not null, default `annotator`);
  - `model_provider`, `model_name` and `model_version` (nullable).
- `AnnotationRepository.create()` takes them. `_create_annotation_from_draft` sets them: `ai_model`
  plus the values from `draft_data.metadata.ai` when `draft.created_by is None`, `annotator` otherwise.
- `migrate_db_schema()` adds the four columns to existing SQLite databases and backfills them in the
  same block:
  - `created_by IS NULL` → `ai_model`, with the model read from the JSON;
  - every other row stays `annotator`.
- **Tests:** a new AI submission records its role and model; the SQLite migration backfills an old AI
  row's model from `metadata.ai`; human rows read as `annotator`.

### Commit 2 — `feat(api): one authoritative version per item (SCRUM-38)`

- `AnnotationDB` gains `is_authoritative` (not null, default false), `authoritative_by`,
  `authoritative_at` and `authoritative_cause`. There is one unique index on `task_item_id` limited to
  rows where the marker is true, declared with `sqlite_where` and `postgresql_where`. The SQLite
  migration creates it as `CREATE UNIQUE INDEX … WHERE is_authoritative = 1`.
- `app/services/annotation_versions.py`: `mark_authoritative` and `clear_authoritative`, as agreed with
  Yi. `reopen_task_item` (#46) calls `clear_authoritative` before it supersedes the round.
- **Push the branch after this commit**, so Yi can build SCRUM-99 against it.
- **Tests:**
  - marking succeeds;
  - a second marker on the item is refused by the helper (409);
  - a raw insert of a second marker is refused by the database, on SQLite and PostgreSQL (run the
    PostgreSQL case in a throwaway container — never the shared dev volume);
  - marking a superseded version is refused;
  - a reopen clears the marker.

### Commit 3 — `refactor(api): read machine authorship from the author role (SCRUM-38)`

- `HUMAN_AUTHORED` becomes `author_role == 'annotator'`, which also keeps D3's future corrections out
  of the counts. `MACHINE_AUTHORED` becomes `author_role == 'ai_model'`. `is_machine_annotation` reads
  the role.
- `ai_batch_service.py:180` and `:235` and `annotation_service.py:25` read the role too.
- `submission_rules.py`'s module docstring is updated: it says SCRUM-38 is where this changes.
- Behaviour does not change. The suite stays green on both databases with no test edits. That is the
  proof the switch is pure.

**As built (2026-10-02):**
- **"No test edits" did not hold, but "no assertion changed" did.** Nine test files wrote AI rows with
  no role and got `annotator`. Hanchen chose both of the following:
  - name `ai_model` in each file's test data;
  - add a fallback default in `db_models.py`: a row written without a role takes it from `created_by`.
    A named role always wins.

  The test data was fixed first, so the fallback could not hide a missing role. The fallback has its own
  failing-first test.
- **The switch found a real bug.** `is_peer_work` also receives drafts, which have no role. The check is
  now `isinstance(record, AnnotationDB)` for the role, and the missing author for drafts.
- Suites: SQLite 825 passed, 8 skipped. PostgreSQL 833 passed.

### Commit 4 — `feat(api): keep one AI answer per model, not one per item (SCRUM-38)`

- In `_create_annotation_from_draft`, an AI draft looks up the current row for **its own model** (role
  plus provider plus name), not `created_by IS NULL`. A second model creates its own row.
- `ai_annotation_for_item` keeps its meaning, "the AI has had its pass on this item". The refusal at
  `ai_batch_service.py:886` moves into one named rule, e.g. `ai_answers_allowed_per_item(task) -> int`,
  returning 1. A multi-model setting is I4's, with nothing added here.
- In the export (`tasks.py:1300-1335`), the per-creator key includes the model for AI rows.
- **Tests:**
  - two models' answers on one item, written through the submission path with the rule patched to 2,
    both survive with their own model, and the item's first pass counts once;
  - with the default rule, the second run still skips the item. That test exists already and must
    still pass.

### Commit 5 — `feat(api): link each version to the one it derives from (SCRUM-38)`

- `AnnotationDB` gains `derived_from_annotation_id` (FK `annotations.id`, nullable) and `derivation`
  (`resubmission` | `reanswer_after_reopen` | `reviewer_correction`, nullable).
- The vocabulary is a constant in `annotation_versions.py`, with `SUPERSEDING_DERIVATIONS` (the first
  two). I4 later adds `revised_after_reveal`.
- `annotation_versions.create_version(...)` is the one place a version is written:
  - it sets the group (`base_annotation_id`), `version + 1`, the link and the reason;
  - for a superseding reason, it sets the predecessor's `is_latest = False` and leaves everything else on
    the predecessor alone.
- #46's re-answer path (`draft_service.py:403-430`) goes through it with `reanswer_after_reopen`. The
  migration backfills the link for existing re-answers: same group, `version - 1`.
- **Tests:**
  - a re-answer after a reopen names its predecessor and the reason;
  - the predecessor's content, `submitted_at`, reviews and `superseded_by_reopen_id` are unchanged;
  - `is_latest` agrees with the links.

### Commit 6 — `fix(api): a resubmission is a new version, not an overwrite (SCRUM-38)`

- In `_create_annotation_from_draft`, when the author already has a current row, it calls
  `create_version(..., derivation="resubmission")` instead of `update()`.
- `draft.annotation_id` then points at the new row, which `submit_draft` already does with whatever the
  helper returns.
- **Check, before flipping tests**, the readers that assumed a stable id across a resubmission. Each
  should already follow the current row:
  - review states, `back_with_author` and `approvers_of` (approvals belong to the old row, so the new
    one starts at none — the intent of "since it was last submitted");
  - the review queue's awaiting ids;
  - `_resolve_review_target`;
  - `item_complete`.
- Flip the five in-place tests listed above, naming each in the commit message.
- **The new test that fails on the parent:** a reviewer returns an answer with feedback, and the author
  resubmits. The returned version keeps its content and its review, and is not current. The new one is
  current with no reviews, and is derived from it with reason `resubmission`.
- Re-run #39's evaluation cases on top. If one pins an id, tell Jingwei rather than editing her case.
- **#45's nit, if Hanchen takes it here** (Jingwei asked on #46, 2026-10-02):
  - `assert_may_decide` (`review_policy_enforcement.py`) refuses with 409, "not a current submission",
    when the named submission has no review state, instead of returning;
  - this commit changes what "current" means, so this is where the guard matters;
  - add one test that calls `assert_may_decide` directly with a superseded version. Through the route,
    `_resolve_review_target` already returns 404 for it.

### Commit 7 — `feat(api): read an item's whole version history (SCRUM-38)`

- `list_all_versions` returns the whole group: the row's `base_annotation_id`, ordered by `version`.
- `GET /annotations/{id}/history` adds to each version:
  - role and model;
  - the derivation link and reason;
  - `superseded_by_reopen_id`;
  - the marker.
- An item-level read of every version, current or superseded. Prefer a query flag on the existing list
  (`include_superseded=true`) to a new resource, so `api_surfaces.md` changes in one row.
- Both reads go through `assert_visible_to_caller`, which applies the existing independence rule.
- `AnnotationRead` gains the same fields.
- **Tests:**
  - the history of a resubmitted answer returns both versions. This fails on the parent, which returns
    one row;
  - the item-level read lists superseded rows;
  - an annotator who has not answered is refused another person's versions.

### Commit 8 — `feat(api): export each version's role, model, lineage and authority (SCRUM-38)`

- Every annotation the task export emits carries:
  - `author_role`, the model, `derived_from_annotation_id` and `derivation`;
  - `superseded_by_reopen_id`;
  - `is_authoritative`.

  Which value a release carries stays H4's.
- **Test:** an export of an item with a resubmission and a marked version shows both versions with
  their links and the marker on one.
- **Open, found in commit 4 (decide here): the legacy export also hides a second model.** Its
  `annotations_by_creator` is a dict keyed by `creator_id`, and two AI answers share `None`. Commit 4
  fixes only the normalized export, whose shape (a list per item) does not change. Fixing the legacy
  shape changes its keys, which its consumers may read. Check who reads it before choosing.

### Commit 9 — `docs: record that every write is a version (SCRUM-38)`

- `docs/adr/adr009_every_write_is_a_version.md`. It builds on ADR 008 and records:
  - the role;
  - the model columns and why `metadata.ai` stays;
  - the derivation link and its reasons;
  - the marker and its partial index;
  - the seams for SCRUM-99, D3, H4, F1, F4 and I4.
- `domain_model.md`, `domain_model_relations.md`, `db_schema_strategy.md`, `db_schema_blueprint.md`
  and `api_surfaces.md`.
- `workflow_states.md`: check whether what resubmission means changes on screen, and say so in the
  PR either way.

## After the commits

- `npm run check`, plus the backend suite on a throwaway PostgreSQL. CI green.
- Write `../tests/manual-test-SCRUM-38.md` from the spec's `validation.md` §1, then walk it in the
  running app on a reset PostgreSQL database, with two browsers.
- Draft the PR description in `../../../reviews/Break/pr-cs57-hanchen-scrum-38.md`. It includes the
  helper's final signature for Yi, the five flipped tests, and the reset reminder.
- **Merge day:** remind the team to run `init_data.py --reset` on PostgreSQL dev databases, and tell Yi
  that SCRUM-99 can rebase.

## If time runs short

The PR is one piece by decision, so nothing is split off silently. If it cannot open by Tuesday
6 Oct, raise it at the Wednesday meeting with the remaining commits listed, before W9's schema order
is agreed. Commits 1–3 are what SCRUM-99 and the W9 groups need first, which is why they come first.
