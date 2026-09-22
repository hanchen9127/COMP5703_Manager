# Code review — PR #21 `feat(SCRUM-1): AI batch job and per-item job status tables`

**PR:** #21 · **Head:** `5daa36e` (2 commits: `6a9d90c`, `5daa36e`) ·
**Branch:** `CS57-Michael-scrum-1-job-schema` · **Author:** Michael Max (`mike-ad`) ·
**Reviewed:** 2026-09-18
**Scope:** 4 files, +670 / −1 · **Story:** C2 / SCRUM-1 · **Depends on:** #20 (docs)

> **Approved and merged 2026-09-18** (`2fc9560`) at `5daa36e`. *Summary* and *Findings* are the review
> as posted on the PR. *Not raised on the PR* keeps the points from the earlier draft and from
> Hanchen's first review that were left out of the posted version, with where each one now sits.

---

## Summary

**Approve.** The change is additive: two new tables, no change to an existing model, nothing calls it
yet, and `create_all()` adds the tables to existing databases. Every delete rule, default and index in
the schema doc (#20) is in the model, and the tests pin them. `UtcDateTime` and `utcnow()` are small
and correct, and they fix, for these tables, the Postgres time-zone problem that SCRUM-94 has to fix
for every table.

Two nits and one follow-up. None of them blocks the merge.

### Evidence

| Check | Result |
| --- | --- |
| Backend suite at `5daa36e` | **255 passed**, 138 subtests — matches the description |
| Models against schema doc §2.1–§2.3 | ✅ All columns, FKs (`CASCADE` ×3, `SET NULL` ×2), `NOT NULL` + server defaults, `uq_ai_item_jobs_batch_item` and both named composite indexes |
| Existing models changed | None — `db_models.py`'s only other change is the import line |
| `migrate_db_schema()` | Untouched, as the description says; new tables need no migration step |
| Postgres behaviour | **Not run** — no server available here either. Same boundary as the author states |
| Mutation claims ("7 of 17", "3 timezone tests") | Not re-run; #22's equivalent claims were, and held |

---

## Checking the PR description

| Claim | Verdict |
| --- | --- |
| Two ORM classes; no existing model changes | ✅ Correct |
| `create_all()` picks the tables up; `migrate_db_schema()` untouched | ✅ Correct |
| Delete behaviour, required `next_attempt_at`, DB defaults, named constraints — pinned by tests | ✅ Read in `test_ai_job_schema.py`; matches |
| UTC on Postgres: `UtcDateTime` strips aware values, including in comparisons | ✅ Correct: `process_bind_param` applies to comparison literals too, which #22's `lease_expires_at < moment` relies on |
| `utcnow()`: `CURRENT_TIMESTAMP` on SQLite, `TIMEZONE('utc', CURRENT_TIMESTAMP)` on Postgres, fails elsewhere | ✅ Correct; the unsupported-dialect path raises `CompileError` at DDL time |
| 255 passed + 138 subtests | ✅ Reproduced |
| "Postgres verified without a running server" | ✅ Honestly stated. Treat it as unverified until SCRUM-94's CI runs this file on Postgres |

---

## Findings

### 1. The item status comment omits `skipped` (nit)

`db_models.py`, `AiItemJobDB.status`:

```python
# queued, running, retry_wait, succeeded, dead_letter
```

The schema doc §3, since `e7f4d03`, and #22's `ITEM_SKIPPED` both add `skipped` as a terminal state that
is not a failure. Add it here, so the model agrees with its own docstring reference.

### 2. The batch row has no `updated_at` (nit)

`ai_item_jobs` has `updated_at`, but `ai_batch_jobs`, whose `status` changes from `queued` to `running`
to a terminal state, does not. `started_at` and `finished_at` cover the two transitions that exist
today. SCRUM-46 adds cancellation, which is a third. Adding a column to an existing table is exactly the
expensive later change §6 of the schema doc warns about, so it is cheaper to add it now. It is the
author's call.

### 3. Run this file on Postgres once SCRUM-94's CI exists (follow-up)

The Postgres half of this PR rests on generated SQL and documentation. SCRUM-94's first merge adds a
Postgres CI job, and its second moves the database test files onto the shared fixture. **Make sure
`test_ai_job_schema.py` is among the files moved**, or the timezone tests will keep running on SQLite
only. Parth and Michael should agree this before SCRUM-94's second merge.

---

## Close collaboration to flag

- **SCRUM-94 (Parth)** must keep `UtcDateTime` and `utcnow()` when it adds the session-level UTC
  setting. The roadmap already says so. Mentioning it in SCRUM-94's PR costs nothing.
- **W8 schema changes.** These are two new tables, not columns added to an existing table, so they
  need no place in W8's migration order.

---

## Not raised on the PR

Points from Hanchen's first review (`sandbox/W7/message-michael-c2-review.md`) and from the earlier
draft of this review, left out of the posted version. None was applied before merge.

| Point | Where it sits now |
| --- | --- |
| **A run's result must be able to point at an annotation.** Under the client's AI answer (2026-09-17) and Hanchen's decision that an AI submission counts toward required annotators (2026-09-18), a successful run is a submitted annotation, but `ai_item_jobs` has only `result_draft_id` | Belongs with the change that first writes it: SCRUM-46, if the #22 review's recommendation is taken. The table now exists on every database that pulled `main`, and `create_all()` does not add columns to an existing table, so `result_annotation_id` (nullable, FK → `annotations.id`, `ON DELETE SET NULL`, indexed) needs a `migrate_db_schema()` step on SQLite, plus whatever SCRUM-94 decides for Postgres. Record the choice in the schema doc's §8.1 |
| `status` and `last_error_kind` are unvalidated strings — the shape of issue 10 | Open. #22 already defines the values as constants in `ai_batch_service.py`; turning them into `StrEnum`s is a code-only change, no migration |
| Docs Sync: `domain_model.md`, `domain_model_relations.md`, `db_schema_strategy.md` | Open. Only `db_schema_blueprint.md` changed |
| `UtcDateTime` has no `process_result_value`; values read back naive | Harmless today: #22 compares only in SQL, so the `TypeError` never happens. A trap for the next Python-side comparison. Add it, or say in the docstring that reads are naive UTC |
| No index on `ai_batch_jobs.status` | Open. SCRUM-5's progress view will list runs by status |
