# Code review — `CS-57-Yi` evaluated against SCRUM-6, SCRUM-7, SCRUM-30

**Branch:** `CS-57-Yi` · **Author:** Yi Geng
**Commits reviewed:**

| Commit | Date | Scope |
| --- | --- | --- |
| `337ca1a` — *MVP integration & update env file* | 2026-09-11 | **83 files, +9457 / −1636** — the substantive change |
| `a324b7d` — *Schema: Fix db setup issues* | 2026-09-09 | 1 file, +7 / −9 (`init_data.py`) |

**Evaluated against:** SCRUM-6 (story **C1**), SCRUM-7 + SCRUM-30 (story **C3**)

> Companion review: [`review-cs57-yi-db-setup-issues.md`](./review-cs57-yi-db-setup-issues.md) covers
> `a324b7d` against SCRUM-81 / story A3. Several of its open items are closed by `337ca1a` — tracked in
> [Knock-on effects](#knock-on-effects-on-a3-and-a4) below.

---

## Verdict

`337ca1a` is a large, genuine piece of Epic C work and it changes the picture completely from the
previous revision of this review.

| Story | Criteria met | Subtasks done | Movement |
| --- | --- | --- | --- |
| **C1 / SCRUM-6** | 1 of 3 substantially, 1 partial | ~2.5 of 6 | Was 0 / 0 |
| **C3 / SCRUM-7** (backend) | 1 of 2 backend criteria, 1 near | 4 of 4 backend subtasks (1 partial) | Was 0 / 0 |
| **C3 / SCRUM-30** (display) | 0 of 1 | 0 of 2 | Unchanged |

**The headline result: the fabricated-annotation defect (issue 20) is gone, and it is gone properly.**
`gemini_preannotator.py` is deleted outright, the hardcoded bounding boxes and the padding routine
went with it, and there is a test that fails if either comes back. That was the P0 of Epic C.

**The headline caveat: the storage and display half of the work is not done.** A failed AI run is still
written as an ordinary `status="pending"` draft attributed to the human operator who registered the
dataset, and the frontend never reads the status field that would tell a reviewer the AI failed. The
information now exists; nothing surfaces it.

**Three issues I would want addressed before merge**, all found in this commit and detailed below:
schema migration rewriting every task row on every application startup; synchronous per-item LLM calls
inside the dataset-registration request; and AI-produced drafts attributed to a human user.

There is also an **ownership problem worth raising at standup rather than in code review**: SCRUM-7 and
SCRUM-30 are allocated to Michael Max (`current_user_stories.md:407`), and this commit does most of
SCRUM-7's backend. That is a good outcome for the product and a bad one for the board — see
[Ownership](#ownership-raise-this-at-standup).

### Verification performed

| Check | Result |
| --- | --- |
| `pytest` (hej-api) | **152 passed, 1 failed, 1 collection error** — up from 118 passed. Both failures pre-existing (issues 22 and 14), reproduced on `main`. |
| `vitest` (hej-web) | **119 passed, 18 files, 0 failed** |
| `turbo typecheck` | **2 successful, 0 errors** |
| `migrate_db_schema()` on an already-migrated 5-task DB | **7 UPDATEs + 2 SELECTs issued** — see finding 1 |
| Fabrication greps (`MIN_IMAGE_BOXES`, `_ensure_min_image_boxes`, `_empty_result`, the `0.12`/`0.56` boxes) | **no matches anywhere in the tree** |
| Committed secrets | none — `.env.example` holds placeholders only, no `.env` tracked |

The collection error is `ImportError: cannot import name '_is_task_export_eligible' from
'app.api.routes.projects'` — issue 14, already fixed on `main` by `e0e642a`. **`CS-57-Yi` is 10 commits
behind `origin/main`**; rebasing clears both failures.

---

## SCRUM-6 — C1: "The AI assistant can be swapped without disrupting my work"

**P1 · BE · Allocated to: Yi Geng**

### Acceptance criteria

| # | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | The mock AI assistant can be replaced with a different one without changing review, dispute or export behaviour | ✅ **Substantially met** | Six providers (ollama, openai, qwen, deepseek, doubao, groq) resolve through one `OpenAICompatibleClient` (`analyzers/base.py:134`); provider and model are per-task configuration (`tasks.ai_provider`, `tasks.ai_model`); no review, dispute or export code changed. Gap: the assistant is still constructed concretely — `AIPreannotator(task)` at `task_service.py:573` — so swapping the *implementation* (as opposed to the model) still means editing the service. |
| 2 | Which assistant and version produced a suggestion is recorded against the item | ⚠️ **Partial** | `_ai_metadata` (`ai_preannotator.py:131`) writes `provider`, `model`, `status`, `task_subtype`, `schema_ref` and `schema` into `draft_data.metadata.ai` on every item. Three gaps: it records the **configured** model, not the model the response reported; there is no version field (`payload_schema_version` / `model_version` from the MVP envelope); and it lives in a JSON blob, so "which items came from qwen-plus" is not queryable. |
| 3 | Everything downstream treats an AI suggestion as a suggestion, never as a finished answer | ❌ **Not met** | `task_service.py:589-597` still writes the AI output as `status="pending"` with `created_by=operator_id`. At the database level an AI draft is indistinguishable from one a human started — see finding 3. |

### Subtasks

| # | Subtask | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Define an `AnnotationAssistant` protocol, `MockAssistant` default, provider behind it | ❌ | `JsonCompletionClient` (`analyzers/base.py:15`) is a `Protocol`, but it abstracts the *HTTP transport*, not the assistant. No `AnnotationAssistant`, no `MockAssistant` — `grep` finds neither. Consequence: there is no offline path. The text default is `ollama/llama3`, so a developer without a local Ollama server gets a `status="failed"` draft on every item. |
| 2 | Adopt the MVP candidate envelope (`payload_schema_version`, `model_version`, `candidates[]`) | ⚠️ Partial | `_unwrap_output` (`ai_preannotator.py:118`) accepts a `candidate_output` key, and drafts carry `"version": 1`. But there is no `payload_schema_version`, no `model_version`, and no `candidates[]` array — one item still maps to exactly one result. |
| 3 | Replace the hand-rolled urllib call with an OpenAI-compatible client | ✅ **Done** | `urllib` is gone with `gemini_preannotator.py`. `OpenAICompatibleClient` (`base.py:134`) uses the `openai` SDK with `response_format={"type": "json_object"}`; `resolve_provider_config` (`base.py:42`) puts local Ollama and hosted providers on one path, exactly as the subtask asks. |
| 4 | Record provider, model and version against every suggestion; keep the registry in one place | ✅ / ⚠️ | Registry **done** — `ai_capability_catalog.py` is the single source, with `list_ai_model_capabilities`, `default_ai_model_capability` and `validate_ai_model_capability` (`:65`, `:70`, `:84`), covered by `test_ai_capability_catalog.py`. That is the "MVP duplicates it four times" problem solved. Version still not recorded (AC 2). |
| 5 | Port `TextAnalyzer`'s text tasks, dropping LLM-inferred field mapping and file writes | ✅ **Done** | `analyzers/text_analyzer.py` supports eight task types (`:16-27`) — the four asked for plus four judgement variants. No file writing anywhere in `analyzers/` (the one `open()` in `audio_analyzer.py:99` reads audio for transcription). Field mapping is now explicit via `annotation_schemas.py`. |
| 6 | Check nothing downstream treats a suggestion as a finished answer | ❌ | Not done — see AC 3 and finding 3. |

**1 of 3 criteria substantially met (1 partial); ~2.5 of 6 subtasks.**

---

## SCRUM-7 + SCRUM-30 — C3: "I'm told when the AI failed instead of being shown a fake answer"

**P0 · BE · Allocated to: Michael Max** — the backend half is nonetheless delivered here.

### Acceptance criteria

| # | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | On failure or disablement the item is clearly marked as having no AI suggestion; the platform never invents one | ⚠️ **Mostly met** | `_failed_result` (`ai_preannotator.py:622`) returns genuinely empty containers per result kind (`{"boxes": []}`, `{"text_spans": []}`, `{"verdict": "", "rationale": ""}`, …) plus `metadata.ai.status = "failed"` and a truncated `error` string. Nothing is invented. Two gaps: **"disabled" is not modelled** — the only statuses are `completed` and `failed` (`:158`, `:625`), though the criterion names disablement explicitly; and the failed outcome is still stored as an ordinary pending draft. |
| 2 | Incomplete AI results are shown as-is, not padded out | ✅ **Met** | `MIN_IMAGE_BOXES` and `_ensure_min_image_boxes` are deleted with their file. `test_image_result_is_adapted_without_fabricating_boxes` pins it. |
| 3 | "AI said this" vs "no AI result available" is visible on the review screen | ❌ **Not met** | The web app carries `metadata` as an opaque `Record<string, unknown>` (`task-result-mapping.ts:26`, `:45`, `:73`) and never reads `metadata.ai.status`. `structured-task-result.tsx` contains zero occurrences of `metadata`; `task-item-workspace-sheet.tsx` reads only `metadata?.notes` (`:643`, `:650`). A reviewer opening a failed item sees an empty annotation with no explanation of why it is empty. |

### Subtasks

| # | Subtask | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Delete the fabricated bounding boxes from `_empty_result` | ✅ **Done** | File deleted; no `0.12`/`0.56` box literals remain in the tree. |
| 2 | Delete `_ensure_min_image_boxes` | ✅ **Done** | Same. |
| 3 | Return a failed assist outcome carrying no annotation, so a failure can never be stored as an ordinary draft | ⚠️ **Half done** | The outcome carries no annotation ✅. It is still stored as an ordinary draft ❌ — `task_service.py:589` writes it with `status="pending"` like any other. The subtask's stated purpose is not achieved. |
| 4 | Treat an unparseable model response as a failure, not a placeholder candidate | ✅ **Done** | `parse_json_object` (`base.py:107`) raises `ValueError("AI provider did not return a JSON object")`, caught at `ai_preannotator.py:89` into `_failed_result`. No placeholder verdict. |
| 5 | Show "no AI suggestion" as distinct from "the AI suggested this" | ❌ | See AC 3. |
| 6 | Test that a failing assist leaves the item with no AI draft | ⚠️ **Partial** | `test_analyzer_failure_creates_failed_empty_draft_not_fake_boxes` (`test_ai_preannotator.py:273`) asserts `boxes == []`, `status == "failed"` and the error text. But it tests the preannotator in isolation — there is no end-to-end test through `task_service`, and the item *does* still get a draft, so the subtask as written is not satisfied. |

**SCRUM-7 (backend fabrication): 4 of 4 subtasks, one partial. SCRUM-30 (store & display): stored ✅,
displayed ❌.**

### What a failed run looks like today

```
provider unavailable
   → ai_preannotator.py:89   except Exception → _failed_result(exc)
   → draft_data = {"kind": "image_bbox", "boxes": [], "version": 1,
                   "notes": "AI pre-annotation failed for ollama/llama3",
                   "metadata": {"ai": {"status": "failed", "provider": "ollama",
                                       "model": "llama3", "error": "RuntimeError: ..."}}}
   → task_service.py:589     db_draft_repo.create(status="pending",
                                                  created_by=operator_id)   ← the human
   → hej-web                 renders empty boxes. metadata.ai never read.
```

Compared with the previous revision this is a large improvement — the reviewer is no longer shown two
invented boxes. But the end state is still "an empty draft with no explanation," which is criterion 3's
target, not its resolution. The remaining work is small: surface `metadata.ai.status` in the workspace
sheet, and stop attributing the draft to the operator.

---

## Findings in this commit

### 1. `migrate_db_schema()` rewrites every task row on every application startup — verified

`database.py:70`. The previous `if not statements: return` early-exit was removed, so the function no
longer short-circuits on an already-migrated database. It now always opens a transaction, runs two
blanket `UPDATE`s, then `SELECT`s every row in `tasks` and issues **one `UPDATE` per task**.

`init_db()` is called at `app/main.py:31`, so this runs on every API boot. Measured against a seeded,
already-migrated database:

```
tasks in db: 5
--- migrate_db_schema() on an already-migrated db (simulates app restart) ---
statements issued: Counter({'UPDATE': 7, 'SELECT': 2, 'PRAGMA': 1})
```

Seven UPDATEs for five tasks, with nothing to migrate. That is O(N) writes per startup, and it grows
with the task table.

Two consequences beyond the cost:

- **The rewrite is silent.** `label_schema_ref` and `label_schema` are both in `TASK_POLICY_AUDIT_FIELDS`
  (`task_service.py:58-67`), so changing them through the service writes an audit record. The migration
  changes them with raw SQL and writes nothing. Given Epic F is about provenance, a policy field that
  can change with no audit trail is worth closing now rather than later.
- **The backfill heuristics are permanent, not one-shot.** Deriving `task_subtype` by string-parsing
  `description` (`instr(description, '/')`) is defensible as a one-time migration. Re-evaluating it on
  every boot is not.

Restoring a guard fixes all three — track whether any `ALTER` was actually needed, and skip the backfill
block when the columns were already present.

### 2. AI calls are synchronous, per item, inside the dataset-registration request

`task_service.py:573-597` loops over every item and calls `generate_for_item` inline. This structure
predates the commit, but the commit changes its risk profile substantially: it used to be one urllib
call with `gemini_timeout_seconds = 20`, and it is now a real provider round-trip at
`ai_timeout_seconds = 60` (`config.py`), including base64 image upload for vision models and
per-frame work for video.

A 100-item AI-assisted registration can now block a single HTTP request for up to 100 minutes, and any
failure part-way leaves a partially pre-annotated task.

This is C2/SCRUM-2's ticket and I am **not** asking for the queue here. But the exposure is materially
worse after this commit than before it, and it is worth either capping the per-request item count or
noting it explicitly on SCRUM-2 as a now-urgent dependency.

### 3. AI-produced drafts are attributed to the human operator

`task_service.py:596` — `created_by=operator_id`. The operator is the person who registered the
dataset; they did not produce the annotation. This is the concrete reason C1 AC 3 fails: nothing at the
database level separates "the AI drafted this" from "a person started this."

`metadata.ai.provider` is inside `draft_data` JSON, so it cannot be used for filtering, and it is absent
entirely from the non-AI branch (`:600-605`). Epic F (SCRUM-40, "record correct audit actor types") wants
this distinction too, so it is worth solving once — either a nullable `created_by_ai` / actor-type column
on `drafts`, or a system actor id.

### 4. No "disabled" state

C3 AC 1 covers "fails **or is disabled**." Today a non-AI task simply never reaches the preannotator
(`task_service.py:573`) and gets a `{"bboxes": {}, "labels": {}}` draft with no metadata at all
(`:600-605`). There is no way for the review screen to distinguish "AI was switched off for this task"
from "AI ran and returned nothing." Adding `status: "disabled"` to `_ai_metadata` and emitting it on the
non-AI branch is a small change and completes the criterion.

### 5. Commit hygiene

83 files, +9457/−1636, spanning backend integration, database schema, configuration, frontend
components, and docs, in a single commit titled *"MVP integration & update env file"*. That is not
reviewable as a unit, and it is not bisectable — if the migration in finding 1 causes a problem, there is
no way to revert it without reverting the whole AI provider layer.

It also **buries a security fix**: the hardcoded Gemini API key is removed here (see below). A credential
removal should be its own commit with its own message so it can be found, cherry-picked and audited.
`AGENTS.md` asks for semantic headlines; at minimum this wanted splitting into schema / provider /
frontend / config.

---

## Knock-on effects on A3 and A4

`337ca1a` closes several items the companion review left open, none of which are mentioned in the commit
message:

| Item | Was | Now |
| --- | --- | --- |
| **A3 subtask 3** — `env_file` in `config.py` so `.env` is read | ❌ | ✅ `env_file=API_ROOT / ".env"`, `env_file_encoding="utf-8"`, `extra="ignore"` |
| **A3 subtask 4** — `.env.example` says `DAP_`, code expects `HEJ_` | ❌ | ✅ 26 `HEJ_`-prefixed keys, zero `DAP_` remaining |
| **A4 / SCRUM-84** — hardcoded Gemini credential in `config.py` | ❌ Medium-severity exposure | ✅ **Removed.** All provider keys are now optional settings resolved from environment (`analyzers/base.py:42`). |
| Hardcoded JWT signing key in `security.py` | ❌ `"your-secret-key-change-in-production"` | ✅ Now `settings.secret_key` — a defect nobody had ticketed |
| **A3 subtask 1** — console-encoding crash in `init_data.py` | ❌ | ❌ **Still open.** No `sys.stdout.reconfigure`; all emoji prints remain. `--reset` still dies on a `gbk` console, and the error handler still dies while reporting it. |
| "Dropped N tables" over-reports (`init_data.py:945`) | ❌ | ❌ Still open. |

The credential removal is the most consequential thing in this commit after the fabrication fix, and it
deserves to be called out on SCRUM-84 rather than left inside an "MVP integration" diff. **The key is
still in git history** — rotating it is still required, and removing it from the working tree does not do
that.

---

## Ownership: raise this at standup

SCRUM-7 and SCRUM-30 are allocated to **Michael Max**. This commit delivers essentially all of SCRUM-7's
backend: `_empty_result` and `_ensure_min_image_boxes` deleted, a real failed-assist outcome, unparseable
responses treated as failures, and a regression test. Good for the product; a problem for the board, in
two ways:

1. If Michael is working on C3 now, he is working on a file (`gemini_preannotator.py`) that no longer
   exists. That should be said today, not discovered in a merge.
2. SCRUM-7 will look untouched on the board while being nearly done, and SCRUM-30 will look untouched
   while being exactly half done.

The clean split from here: **SCRUM-7 is backend-complete** apart from the "not stored as an ordinary
draft" half of subtask 3. **SCRUM-30 is now a frontend ticket** — read `metadata.ai.status` and render
the distinction. That is a well-shaped, self-contained piece of work for whoever picks it up.

---

## Recommendation

**Merge, after the three items below.** The direction is right, the provider layer is the correct shape,
the P0 defect is genuinely fixed with a test, and 152 backend plus 119 frontend tests pass.

Before merge:

1. **Restore the early-exit in `migrate_db_schema()`** (finding 1) so the backfill runs once rather than
   on every boot. This is the only finding I would call blocking — it is a startup-cost and
   silent-data-rewrite regression on a path that runs in every environment.
2. **Rebase onto `origin/main`** — 10 commits behind; clears both inherited test failures.
3. **Rotate the Gemini key.** It is removed from the tree but remains in git history. Note it on
   SCRUM-84 and close that ticket.

Soon after, in priority order:

4. **Attribute AI drafts to the AI** (finding 3) — unblocks C1 AC 3, and SCRUM-40 wants it anyway.
5. **Surface `metadata.ai.status` in the workspace sheet** — this is all that stands between the current
   state and SCRUM-30 being done, and the data is already flowing.
6. **Add `status: "disabled"`** to the non-AI branch (finding 4) to complete C3 AC 1.
7. **Add a `MockAssistant`** behind an `AnnotationAssistant` protocol (C1 subtask 1). Beyond closing the
   subtask, it gives the team an offline path — right now anyone without a local Ollama server sees every
   item fail.
8. **Cap or queue per-request AI work** (finding 2), or escalate SCRUM-2 as a blocking dependency.
9. **Finish A3** — `sys.stdout.reconfigure(encoding="utf-8", errors="replace")` in `init_data.py` is a
   one-liner and the last functional item on that story.
