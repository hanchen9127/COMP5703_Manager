# D9、B7、B8 三张新票（可直接粘贴）

2026-09-24。三个新 story 来自客户第二轮书面答复（`../../../info/client-question.md` → Round 2），已写入
`../../../shared/story_src.csv` 和 `../../../specs/roadmap.md`。代码位置在 `origin/main` `fd273b9` 上核对过。

- 每段第一行都是 `Related to user story X`，`tracking-sync` 靠它把票号填进 CSV，不能删。
- 编号列表用 `# `，整段放在 `{noformat}` 里，和看板上其他票一致。
- 三张都是 **Task**，Priority **Medium**，暂不指定负责人（D9 在 W8 周会上定）。
- 建好票后跑一次 `tracking-sync`，`story_src.csv` 的 `scrum` 列才会填上。

| 票 | Story | Epic (Parent) | Sprint | 点数 | 负责人 |
| --- | --- | --- | --- | --- | --- |
| Review: Project owner reopens a finalised item | D9 | SCRUM-13 Annotation & Human Judgement | W9 | 1.5 | 待定 |
| Task lifecycle: Import a JSONL dataset as one item per record | B7 | SCRUM-11 Project, Policy & Task Lifecycle | W11 | 2 | 待定 |
| Task lifecycle: Choose the annotation surface per task (annotation_type) | B8 | SCRUM-11 Project, Policy & Task Lifecycle | W11 | 1.5 | 待定 |

Epic 的选法：D9 跟 D5 的 SCRUM-28 放一起；B7 跟 B5 的 SCRUM-23 放一起；B8 跟 B3 的 SCRUM-85 放一起。

---

## D9 — Review: Project owner reopens a finalised item

```
{noformat}Related to user story D9

BACKEND AND FRONTEND

Added 2026-09-24 from the client's answer R2-3. D5 (SCRUM-26, SCRUM-28) built the refusal: a finalised item refuses every new draft, edit and submission. This ticket builds the deliberate way back.

Client answer: "The project owner may reopen a finalised item directly. [...] A reopened item returns to the normal open workflow, rather than simply resuming at the previous review step. The previous finalised answer must remain in history as a superseded version. It should never be overwritten."

Out of scope (Hanchen's reply to the client, 2026-09-24): requests to reopen from annotators, reviewers and experts. Only the project owner reopens.

# A reopen action on a canonicalized task item, allowed only to a user holding the MANAGE_PROJECT capability (app/core/permissions.py — task_owner and admin today). Everyone else is refused on the backend with 403, not only hidden in the UI.
# The reopen requires a reason and records who reopened, when and why.
# The finalised answer is marked superseded, never edited or deleted. It stays visible in the item's history.
# The item leaves canonicalized and returns to the open workflow: it appears in the available-work list (D8, SCRUM-48/93) for new annotation, and its annotation and review requirements count afresh for the new round.
# The finalised-item guard (TaskItemFinalisedError, app/services/task_service.py:188) still refuses writes to items that are finalised; its message "Reopening a finalised item is not available yet." is updated to point at the reopen action.
# The reopen is recorded as a provenance event on F1's event record (SCRUM-62), not only in the activity log.
# Frontend: a Reopen button on the finalised-item view, shown to the project owner only, asking for a reason. The superseded answer is shown in the item's history.
# Tests: a reviewer's or annotator's reopen is refused; the owner's reopen keeps the old answer as superseded and makes the item claimable again; a reopen without a reason is refused.

Collaboration:
- SCRUM-99 (E3, W8): the expert's Return outcome sends an item back to the open workflow the same way (client answer R2-1). W8 sets the item back to open work directly; once this ticket lands, Return calls this path. Agree the function with Hanchen.
- SCRUM-38 (F3, W9): "superseded" must be the same supersession model F3 records.
{noformat}
```

---

## B7 — Task lifecycle: Import a JSONL dataset as one item per record

```
{noformat}Related to user story B7

ONLY BACKEND (plus the upload hint on the dataset panel)

Added 2026-09-24 from the client's follow-up answer to R1-1. Found by Yi: the text picker lists .jsonl, but upload_texts (app/api/routes/uploads.py:272) makes one task item per uploaded file — the whole file becomes one payload_preview and external_item_ref is the file name. FewNERD records had to be copied into separate .txt files by hand.

Client answer: "Direct import of the provided JSONL datasets should be in scope. A JSONL file should not be treated as one task item. [...] each record should become an item." And: "The annotation target should be determined by the task/schema, not by the AI." The model is: source record -> task/schema projection -> annotation payload. No universal data-mapping engine.

# First, an ADR in docs/adr/ (the client's required format, adr00N_short_title.md): does the task owner name the payload field (for example payload_preview.text) in the task configuration, or do supported task types ship a fixed adapter? Recommend one, with the trade-off, before coding.
# A .jsonl upload creates one task item per record, not one per file. A malformed line fails the whole upload with the line number — registration stays all-or-nothing through register_dataset (app/services/task_service.py:626, B5).
# Each item keeps its full source record for provenance. external_item_ref, split and source_record_id stay attached to the item; external_item_ref comes from the record, not the file name.
# The payload given to the annotator and sent to the AI is only the part the task defines (the projection) — never the whole record.
# gold_annotations (and any other evaluation-only field the task names) is stored but never shown in the annotate or review views and never sent to the AI. It stays available to the evaluation harness (I1, SCRUM-68/69).
# The source reference is stable enough to identify the exact source and version used — DataPointer.source_version_ref is hard-coded to "v1" by every upload route today (uploads.py:361 for text); record a real source version instead (client answer R2-5).
# Plain .txt uploads keep working as today: one file, one item.
# Tests with the FewNERD sample (dataset/text_dataset/fewnerd in the capstone folder, outside the repo — copy a few records into a test fixture): N records give N items; payload_preview.text is the annotation payload; gold_annotations never reaches the AI prompt or the annotator's view; a malformed line leaves nothing behind.
{noformat}
```

---

## B8 — Task lifecycle: Choose the annotation surface per task (annotation_type)

```
{noformat}Related to user story B8

BACKEND AND FRONTEND

Added 2026-09-24 from the client's answer R2-6, which accepted our proposal. Follow-on to B3 (SCRUM-85).

Today task_class, task_type and task_subtype decide the result format and which previewer and editor the draft and review pages use. Drafts and annotations already carry an annotation_type column (DraftDB, AnnotationDB), and _normalize_annotation_payload (app/api/routes/tasks.py:711) already maps results by it — but annotation_type is not a task-level setting. Subtype presets live in app/core/annotation_schemas.py and TASK_SUBTYPE_OPTIONS in components/task-create-form.tsx.

Client answer: "The subtype can therefore become an optional starting template rather than part of the task ontology. Using a task-level annotation_type to select the compatible renderer/editor is reasonable. I would think of this as the human annotation surface / result representation, not as the task itself. A genuinely new type only needs explicit implementation when it requires a new interaction surface or different system behaviour."

# First, an ADR in docs/adr/: annotation_type is the annotation surface, the subtype is a template. List the supported annotation types — one per editor that exists today — and the output-schema shape each accepts.
# TaskDB gains annotation_type, chosen on the task form from the supported list. Existing tasks are migrated from their current subtype so nothing changes for them.
# Backend result mapping and the frontend editor choice on the draft and review pages both read the task's annotation_type instead of task_subtype. Drafts and annotations take their annotation_type from the task.
# Subtype presets stay as optional, editable starting points for instructions and output schema. Choosing one no longer fixes the editor.
# A task whose output schema the chosen editor cannot render is refused at creation with a clear reason.
# No new editors are built here.
# Tests: a task's drafts and review page use the editor its annotation_type names; an incompatible schema is refused; a task created before the migration still opens in the editor it used before.
{noformat}
```

---

## 另外：SCRUM-99 的描述已经过时

SCRUM-99（E3，你的票）的第 3 条还写着"the item returns to the reviewer"，最后一行还写着 F2 未答复。客户 R2-1
已经推翻了这一点。要替换的话告诉我，我按 Accept / Return / Reject 重写整段。
