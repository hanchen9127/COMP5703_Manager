# SCRUM-85: a task's result shape is checked, and its annotator count is set in the app (plan)

**Date:** 8 October 2026
**Ticket:** SCRUM-85, "Task lifecycle: Create annotation and judgement tasks with a result shape" (story B3; W9;
Jingwei), plus the annotator count from story D8 subtask 2, added 08/10 (Hanchen will put it in Jira)
**Base:** `origin/main` `1dcbcdf`. **Branch:** `CS57-Jingwei-scrum-85`. **One PR**, separate commits; merged with a merge
commit, never squashed
**Breakdown:** [`2026-10-08-scrum-85-feature-and-commit-breakdown.md`](2026-10-08-scrum-85-feature-and-commit-breakdown.md)
**Scope note:** [`2026-10-08-scrum-85-scope.md`](2026-10-08-scrum-85-scope.md). **Background:** the
[judgement-task report](../analysis/2026-10-08-judgement-task-explained.md)
**Schema change:** none. `required_annotators` already exists on tasks

---

## 1. The ticket's criteria, checked on `main` (08/10)

| B3 / SCRUM-85 criterion | On `main` | Result |
| --- | --- | --- |
| 1. Create a task under a project, choosing annotation or judgement and the task type | `TaskCreate.task_class` and `task_type`; the form's "Task class" step | **Holds.** Commit 1 pins it with tests |
| 2. The task records what a finished result looks like: labels for annotation, verdict plus reasoning for judgement | It is **recorded**: `label_schema` / `label_schema_ref` resolved to required and optional fields, `text_span_label_options`, `label_definitions`. It is **not checked** on a person's result: `validate_annotation_output` runs only on the AI's output | **Gap.** A judgement can be submitted without a verdict or rationale through the API, since only the web panel refuses it. An annotation can use a label the task doesn't define |
| 3. Text tasks work end to end; image and video tasks can be created without breaking | Text: the casebook (EV-000 to EV-003). Image and video: creatable through the templates; no test pins it | **Holds.** Commit 1 pins image and video creation |

So the ticket's "build only the gap" means the two rules of part A.

Story C5 also asks that the judgement rationale be "required, not an optional comment box". Part A delivers that on the
API.

---

## 2. Decisions (Jingwei's, 08/10)

| # | Question | Decision |
| --- | --- | --- |
| S1 | How deep the check on a person's result goes | **The ticket's two rules.** A judgement needs a non-empty `verdict` and `rationale`. An annotation's labels must all be among the task's defined labels, when it defines any. Not a full schema check |
| S2 | When it is checked | **On submit only.** Saving a draft stays free, since half-finished work is normal. Submitting is refused with 422 and a message naming what's wrong |
| S3 | Whether the annotator count can change after activation | **Fixed once activated.** Editable while the task is a draft. A change after activation is 409; resending the same value is fine. Matches the client ("chosen when the task is created") and SCRUM-87's M2 |
| S4 | PRs | **One PR, separate commits**: part A (API checks), then part B (count: API, then web) |

---

## 3. What changes

### Part A: a person's result must have the task's shape (on submit)

**Where:** `DraftService.submit_draft`, before the annotation is written, with the item already locked (it takes the lock
today). One function, `assert_result_matches_task(task, draft_data)` (`app/services/result_shape.py`, new), checks:

- **Judgement tasks** (`task_class = judgement`): `verdict` and `rationale` must be non-empty after trimming. The web
  sends `{verdict, rationale}` for every judgement, whatever the surface. 422 messages: "A judgement needs a verdict." /
  "A judgement needs a rationale: the reasoning is part of the record."
- **Annotation tasks with defined labels:**
  - the defined labels are `text_span_label_options` ∪ the keys of `label_definitions`;
  - every label the answer uses must be one of them, or 422 "Label 'x' is not one of this task's labels: a, b, c";
  - labels are read from `draft_data.output` through the same per-surface reading the normalized export uses: a
    classification's label(s), each span's label, each box's label, each segment's label, each track's label. A
    `structured_result` answer has no labels to check;
  - a task that defines no labels isn't checked.
- **People only.** The AI's submission (no author, `ai_model`) is already validated against the output contract
  (`validate_annotation_output`) and is left as it is. Corrections (SCRUM-32) aren't submissions and don't pass here.
- **One reading of shapes:** the label reading is extracted from the export's normalizers (`_normalize_*_annotation` in
  `routes/tasks.py`) into the new module, and the export calls it, so the check and the export can't disagree about
  where a label is.

### Part B: the required-annotators count, set in the app

- **API:** `TaskUpdate.required_annotators` (1–10, as at creation).
  - `update_task` refuses a change on a task that has left draft (409: "A task's required annotators are fixed once it
    is activated: items are counted against the number in force when work started.");
  - the same value is accepted.
- **Web, create form:** a "Required annotators" number field (1–10, default 1) in the task definition step, sent as
  `required_annotators`.
- **Web, task Setup:** the task card shows the count; editable while the task is a draft, read-only afterwards with the
  reason. The card resends the value it holds, so the API's "same value is fine" rule covers it.
- **Web data:** the task mapping reads `required_annotators` from the task read, which already carries it.

---

## 4. Coordination

- **SCRUM-87 (#59, mine, in review)** adds `assert_annotation_mode_change_allowed` in the same place in `update_task`.
  Part B's lock follows the same pattern. Whichever merges second folds the two "fixed once activated" checks into one
  helper (a small conflict in `task_service.py`).
- **Kanishka (SCRUM-48):** part B finishes D8 subtask 2's web half; nothing in her code changes.
- **Hanchen:** add part B to SCRUM-85 in Jira (agreed 08/10).
- **Yi (#48):** reconciliation and disputes read submissions after this check, so they only ever see well-shaped
  results. Nothing to change on his side.

---

## 5. Risks

- **Existing tests that submit a judgement without a rationale,** or an annotation with a label outside its task's list,
  will now get 422. They're fixed to submit a valid result, and each is named in its commit body. The casebook's tasks
  define no labels, so their answers aren't checked.
- **The web's payload shapes differ by surface.** The label reading follows the export's normalizers, which already
  handle them. Each surface gets a prove test with the web's own payload shape.
- **Judgement on the image-box surface** sends `{verdict, rationale}` like any judgement, so it's covered by the
  judgement rule.

---

## 6. Docs Sync

`api_surfaces.md`: the submit refusals (422) and the task update contract (`required_annotators`, 409 after
activation). No ADR: S1–S4 go in the PR description's *Decisions to review*.
