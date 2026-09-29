# Review — PR #36, `CS57-Yi` (SCRUM-112, B8)

2026-09-27. Head `5ea9eab`, base `main`; merge-base `2fab5ec`, before #34, #33, #35 and #37. `main` is now at
`d1764d8` (#37 merged 10:20). Four commits, 78 files, +2741 / −1864. **DIRTY** on GitHub.

**On GitHub (checked with `gh pr view 36`):** open since 2026-09-25, no reviews, no comments. CI green on the
head (before `main` moved).

**Read before this review:** SCRUM-112 on the board (7 criteria, "ADR first", "no new editors"); story B8;
client answer R2-6 (`annotation_type` is the annotation surface, the subtype a starting template) and
Hunter's R1 follow-up in `shared/client-qa.md` (a task = data + instructions/examples + output schema; no
hard-coded subtype needed). Earlier messages to Yi (`sandbox/W8/msg/message-pr29-followups-kanishka-yi.md`)
are about SCRUM-62, not this ticket. Jingwei noted on #33 that #36's rename breaks 7 of #33's test files.

**Recommendation: request changes — three items.** The design matches R2-6 and the ticket: a backend-owned
surface catalog, validation by class × modality, schema compatibility checked at creation, AI batches
snapshot their surface. Before merge: take `main`; make human submissions map by the task's surface (the
export mislabels them today, and drops text-classification labels); add the ADR.

## Verified

- PR head alone: backend SQLite **470 passed, 4 skipped**; web `tsc` clean, lint 0 errors (34 warnings),
  vitest **231 passed**. Matches the description.
- Trial merge of `main` (`d1764d8`): **4 conflicts** — `task_service.py`, `test_project_policy_read_contract.py`,
  `task-policy-card.tsx`, `policy-catalog.ts` (all from #37). After them, `judgment_question` remains in 14
  test files (23 uses: #33, #35, #37) and `task_subtype` in 7 files (19 uses, including `task_service.py`).

## Scope — SCRUM-112 on the board, point by point

| # | Board description | On `5ea9eab` |
| --- | --- | --- |
| 1 | First, an ADR in `docs/adr/`: `annotation_type` is the surface, the subtype a template; the supported types and the schema shape each accepts | ❌ **No ADR.** The PR description holds the content; `docs/adr/` now has adr001–003 from #37 |
| 2 | `TaskDB.annotation_type`, chosen on the task form; existing tasks migrated so nothing changes for them | ✅ Column, form, SQLite migration from the subtype (PostgreSQL reset) |
| 3 | Result mapping and the editor both read the task's `annotation_type`; drafts and annotations take it from the task | ⚠️ Editor ✅ (requires the task's surface). Dataset-registration placeholders ✅. **Human drafts and annotations don't:** the web still sends `annotation_type: "annotation"`/`"judgement"`, the API stores it, and the export maps by the annotation's own column — see finding 2 |
| 4 | Subtype presets stay as optional, editable starting points | ✅ Frontend-only templates that prefill instruction, surface and schema |
| 5 | An incompatible schema is refused at creation with a clear reason | ✅ `resolve_annotation_schema` → `validate_annotation_schema_for_annotation_type` in `TaskCreate` and on update |
| 6 | No new editors are built here | ✅ as far as I can tell: `structured_result` maps to the existing JSON editor |
| 7 | Tests: drafts and review page use the surface's editor; incompatible schema refused; a pre-migration task still opens in its editor | ✅ web mapping tests, schema tests, legacy SQLite migration test |

**Beyond the ticket:** `judgment_question` → `task_instruction`, task `description` removed, AI model
selection moved to Setup (with a default model at creation), a capability-catalog endpoint, label import,
`ai_batch_jobs.annotation_type_snapshot`. The snapshot is a good provenance call. The renames are a
breaking API contract (the description says so) and are the reason for most of the merge work.

## Fix before merge

### 1. Take `main`

The four conflicts, then the old names in the files #33, #35 and #37 added (list above). Our own helper
`docs/sandbox/W8/scripts/sandbox-SCRUM-48.py` also sends `judgment_question`; it changes with this merge.

### 2. Human submissions are exported by the wrong surface

`export_annotations` calls `_normalize_annotation_payload(task.task_type, annotation.annotation_type, …)`.
A human draft's `annotation_type` is whatever the web sends — `"annotation"` or `"judgement"`
(`lib/api/task-items.ts`) — and the submission copies it. `"annotation"` hits the first fallback branch
(`annotation_type_lower == "annotation"`), which normalizes as text whatever the modality. Probe on the PR
head:

- image task, surface `classification`, human `{"label": "cat", "labels": ["cat"]}` → `modality: text`,
  `kind: text_json`;
- text task, surface `classification`, human `{"label": "positive"}` → `kind: text_json` with
  `labels: None` — **the label is lost**;
- the same image payload mapped by `"classification"` → `modality: image`, `kind: classification`, correct.

This is criterion 3's "result mapping reads the task's `annotation_type`" and "drafts and annotations take
their annotation_type from the task". **Fix:** map the export by `task.annotation_type`, and set a draft's
`annotation_type` from its task when it is created (the web value can then be ignored). Test: a human
classification submission on an image task exports as `classification`, and a text one keeps its label.

### 3. The ADR

Criterion 1. It should also record the contract changes that are not in R2-6 — the `task_instruction`
rename, dropping `description`, the model moving to Setup — since they break every client of the task API.
It would be `adr004`.

## Non-blocking

- `video_timeline` is a surface with a schema preset and an empty draft, but no class × modality offers it.
  Either offer it or drop it.
- The SQLite migration drops `description` without carrying its text anywhere. It looks auto-generated
  (`'judgement / %'`), so probably nothing is lost; worth a line in the ADR.
- The description's test counts are from the old base.

## Comment for GitHub (ready to paste)

````markdown
Thanks @DIQI26 — the design follows R2-6 closely. The backend owns the surface catalog, surfaces are validated by class × modality, an incompatible schema is refused at creation, and AI batches snapshot their surface (a good provenance call). On the PR head: backend 470 + 4 skipped; web `tsc` clean, lint 0 errors, vitest 231.

**Three things before merge:**

1. **Take `main`.** With #37 in, there are four conflicts: `task_service.py`, `test_project_policy_read_contract.py`, `task-policy-card.tsx` and `policy-catalog.ts`. After those, the files #33, #35 and #37 added still use the old names: `judgment_question` in 14 test files (23 uses) and `task_subtype` in 7 files (19 uses, including `task_service.py`).

2. **Human submissions are exported by the wrong surface.** `export_annotations` maps by `annotation.annotation_type`, but a human draft's type is whatever the web sends (`"annotation"` or `"judgement"`, from `lib/api/task-items.ts`), and `"annotation"` falls into the text branch whatever the modality. On the PR head:
   - an image task with surface `classification` and a human `{"label": "cat", "labels": ["cat"]}` exports as `modality: text, kind: text_json`;
   - a text classification `{"label": "positive"}` exports with `labels: None`, so the label is lost;
   - mapped by `"classification"`, the image one comes out right.

   That's SCRUM-112 criterion 3: mapping reads the task's `annotation_type`, and drafts and annotations take it from the task. Mapping the export by `task.annotation_type`, and setting a draft's type from its task when it's created, would cover both. A test that a human classification submission exports as `classification` would pin it.

3. **The ADR.** Criterion 1 asks for it first. It's also where the contract changes beyond R2-6 belong: the `task_instruction` rename, dropping `description`, and the model moving to Setup, because they break every client of the task API. It would be `adr004`, since #37 took 001–003.

**Non-blocking:**
- `video_timeline` has a schema preset and an empty draft, but no class × modality offers it. Offer it or drop it.
- The SQLite migration drops `description` without carrying its text over. It looks auto-generated, so probably nothing is lost, but it's worth a line in the ADR.
````

## Round 2 — `3a87ee3` (2026-09-28)

**Posted:** the round-1 comment above as a **Request changes** review (2026-09-27 11:35, at `5ea9eab`). Yi
pushed `984d0f0` (merge of `main`) and `3a87ee3`, and replied point by point (18:24).

| Round-1 point | Checked on `3a87ee3` |
| --- | --- |
| 1. Take `main` | `main` (`d1764d8`) is an ancestor; GitHub CLEAN. `judgment_question` remains only in the SQLite migration and its test; `task_subtype` only in legacy-table fixtures and `assertNotIn` checks |
| 2. Human submissions by the task's surface | `DraftService._annotation_type_for_task_item` sets a draft's type from its task on create, update and submit; the export maps by `task.annotation_type`. **End-to-end probe:** a human draft sent as `"annotation"` on an image/text classification task is stored as `classification` and exports as `kind: classification` with its labels (the round-1 probe lost the text label). Draft tests added (`test_create_uses_the_task_annotation_surface`, `test_update_ignores_a_client_annotation_surface`); no export test for this case |
| 3. ADR | `docs/adr/adr004_task_level_annotation_surfaces.md`: decision, rejected alternatives, the contract changes beyond R2-6, migration |
| `video_timeline` unreachable | Renamed `video_segments` and offered for annotation + video; the old name stays as a migration alias |
| `description` dropped | Recorded in the ADR and the reply: it was generated from class and subtype, not user guidance |

**Verified** on `3a87ee3`: backend SQLite **672 passed, 6 skipped**; PostgreSQL 18 (Sydney session) **678
passed**; web `tsc` clean, lint 0 errors, vitest **250 passed**. CI green.

**Left, not blocking:** a test pinning the export case (a human classification submission exports as
`classification` and keeps its label); the probe above is the shape.

**After merge (ours):** `docs/sandbox/W8/scripts/sandbox-SCRUM-48.py` sends `judgment_question`, and
`seed_test_roles.py` may too; both change to `task_instruction`.

**Recommendation: approve.**

### Approval comment (ready to paste)

```markdown
Thanks @DIQI26 — all three are in, and the two non-blocking ones too. Re-checked on `3a87ee3`: SQLite 672 + 6 skipped, PostgreSQL 678 (Sydney session), web `tsc` clean, lint 0 errors, vitest 250.

- `main` is merged cleanly. The old names now appear only in the SQLite migration and in tests that build legacy tables or assert they're gone.
- The surface fix holds end to end. I created a human draft sent as `"annotation"` on an image and on a text classification task: both are stored as `classification`, and both export as `kind: classification` with their labels. The text label was lost before.
- adr004 records the decision and the contract changes beyond R2-6, and the `video_segments` rename and the `description` note read well.

One small follow-up, not for this PR: a test pinning that export case (a human classification submission exports as `classification` and keeps its label), since the draft tests cover the stored type but not the mapping.

Approving.
```

## Merged (2026-09-28)

Approved and merged by Hanchen at 05:27 (`c5b428b`). Follow-ups done the same day, outside the repo: the
sandbox helper `sandbox-SCRUM-48.py` sends `task_instruction`; `seed_test_roles.py` sends
`task_instruction`, names `annotation_type: text_spans` with `text_spans_schema_v1` (the old
`text_span_schema_v1` preset no longer exists, and without the surface the task defaulted to
classification), and no longer sends `description`. Both were run against `main` on a throwaway
PostgreSQL. Still open: the export regression test suggested in the approval.
