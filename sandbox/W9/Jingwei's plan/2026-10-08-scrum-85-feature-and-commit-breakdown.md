# SCRUM-85 Feature and Commit Breakdown

**Date:** 8 October 2026
**Plan:** [`2026-10-08-scrum-85-result-shape-and-annotator-count-plan.md`](2026-10-08-scrum-85-result-shape-and-annotator-count-plan.md)
(decisions S1–S4)
**Branch:** `CS57-Jingwei-scrum-85`, from `origin/main` (`1dcbcdf`)
**Delivery:** one PR, six commits; merged with a merge commit, never squashed. No schema change

---

## As built

| # | Commit | State | Revert check | Suite after |
| --- | --- | --- | --- | --- |
| — | Baseline, `origin/main` `1dcbcdf` | — | — | to run: SQLite, PostgreSQL `hej_test` (parallel method), web |
| 1–6 | see below | not started | | |

---

## 0. Before commit 1

1. **Branch:** `git switch main && git pull`, then `git switch -c CS57-Jingwei-scrum-85 --no-track origin/main`.
2. **Baseline:** the API suite on both databases, and the web suite and `tsc`. Record the counts.
3. **Tests:** a new file, `tests/test_task_result_shape.py`, on the shared conftest, driving the real routes:
   - users: an owner, two annotators and a reviewer;
   - tasks: a judgement text task, an annotation text task with labels, an annotation text task without labels, and image
     and audio annotation tasks with labels.

For every **prove** test: run it against the parent commit, see it fail, and record the failure.

---

## Commit 1: Pin what a task records about its result (criteria 1 and 3)

**Feature.** The verification the ticket asks for, as guards.

**Tests (guards, green before and after):**
- annotation and judgement tasks can each be created for text, image, audio and video, with each pair's default surface;
- the task read returns `task_class`, `task_type`, `annotation_type`, the resolved required and optional fields,
  `text_span_label_options`, `label_definitions` and `required_annotators`;
- an unsupported surface for a class and type is 422 (as today).

```bash
git add apps/hej-api/tests/test_task_result_shape.py
git commit -m "test(api): pin what a task records about its result" -m "Annotation and judgement tasks can be created for every data type with their default surface, and a task's read returns the result shape and labels it was created with." -m "SCRUM-85 asks to check its criteria on main before building anything; these tests are that check, and they keep it true."
```

---

## Commit 2: Refuse a judgement submitted without a verdict or rationale

**Feature.** Criterion 2 for judgement tasks; story C5's "required, not an optional comment box".

**Required changes**
- `app/services/result_shape.py` (new): `assert_result_matches_task(task, draft_data)`, the judgement half (trimmed
  `verdict` and `rationale` required; 422 with the plan's messages).
- `DraftService.submit_draft`: call it for a human author's draft (not the AI's), before the annotation is written.
- Docs: `api_surfaces.md`, the submit refusal.

**Tests**
- **Prove:** a judgement submitted with an empty verdict → 422; with an empty rationale → 422; nothing is written (no
  annotation, the draft still pending).
- **Guards:**
  - a complete judgement is submitted as today;
  - saving a draft without a rationale is still allowed;
  - the AI's judgement draft is submitted as today.
- Existing tests submitting incomplete judgements are fixed; name each in the commit body.

```bash
git add apps/hej-api/app/services/result_shape.py apps/hej-api/app/services/draft_service.py apps/hej-api/tests/ docs/design/backend/api_surfaces.md
git commit -m "fix(api): refuse a judgement submitted without a verdict or rationale" -m "Submitting a judgement now needs both a verdict and the reasoning behind it, on the API as well as in the work panel; a draft can still be saved unfinished." -m "The reasoning is what a judgement task exists to collect, and only the panel required it, so any other client could submit a bare verdict or nothing at all."
```

---

## Commit 3: Refuse an annotation whose labels aren't the task's

**Feature.** Criterion 2 for annotation tasks.

**Required changes**
- `result_shape.py`:
  - `defined_labels(task)`: `text_span_label_options` ∪ `label_definitions` keys;
  - `labels_used(annotation_type, output)`, extracted from the export's per-surface normalizers (classification,
    text spans, image boxes, audio and video segments, video tracks; `structured_result` has none);
  - the annotation half of `assert_result_matches_task` (422 naming the label and the allowed list).
- `routes/tasks.py`: the normalized export reads labels through `labels_used`, so both use one reading.

**Tests**
- **Prove:** with the web's own payload shape for each surface, a label outside the task's list → 422, for
  classification, text spans, image boxes and audio segments; nothing is written.
- **Guards:**
  - every label in the list → submitted;
  - a task with no labels defined → not checked;
  - the normalized export of an existing answer is unchanged.

```bash
git add apps/hej-api/app/services/result_shape.py apps/hej-api/app/api/routes/tasks.py apps/hej-api/tests/ docs/design/backend/api_surfaces.md
git commit -m "fix(api): refuse an annotation whose labels aren't the task's" -m "Submitting an annotation now checks every label it uses against the labels its task defines, for every annotation surface, and names the label and the allowed list when one is not; a task that defines no labels is not checked." -m "A task records the labels a finished result may use, but nothing held a person's answer to them, so a label the guideline never defined could reach review and the export."
```

---

## Commit 4: Let a draft task change its required annotators, fixed once activated

**Feature.** Part B, API (decision S3).

**Required changes**
- `TaskUpdate.required_annotators: int | None` (`ge=1, le=10`).
- `task_service.update_task`, both branches: a change on a task that has left draft → 409 with the plan's message; the
  same value is accepted.
- Docs: `api_surfaces.md`, the task update contract.

**Tests**
- **Prove:**
  - a draft task's count changes from 1 to 2, and after activation an item takes two submissions before review is
    complete;
  - an active task's change → 409, with nothing changed.
- **Guards:**
  - resending the same count on an active task saves other fields;
  - out of range → 422.

```bash
git add apps/hej-api/app/schemas/tasks.py apps/hej-api/app/services/task_service.py apps/hej-api/tests/ docs/design/backend/api_surfaces.md
git commit -m "feat(api): let a draft task change its required annotators" -m "A task's required annotators can now be changed while it is a draft, and is fixed once it is activated (409); resending the same value still saves the rest of the form." -m "The count was settable only when creating a task through the API, and the client asks for it to be chosen when the task is set up; fixing it at activation keeps every item counted against the number in force when its work started."
```

---

## Commit 5: Choose the required annotators when creating a task (web)

**Required changes**
- `components/task-create-form.tsx`: a "Required annotators" number input (1–10, default 1) in the task definition step,
  with a one-line hint ("How many people answer each item independently").
- `lib/api/tasks.ts`: `required_annotators` in the create payload type and body.

**Tests (Vitest):**
- the field defaults to 1 and is sent;
- a chosen 2 is sent;
- values outside 1–10 can't be submitted.

```bash
git add apps/hej-web/components/task-create-form.tsx apps/hej-web/components/task-create-form.test.tsx apps/hej-web/lib/api/tasks.ts
git commit -m "feat(web): choose the required annotators when creating a task" -m "The task creation form now asks how many people answer each item independently, from 1 to 10, and sends it with the task." -m "The API counted submissions against this number from the start, but the form never sent it, so every task created in the app had one annotator per item."
```

---

## Commit 6: Show and edit the required annotators in task setup (web)

**Required changes**
- `lib/task-workspace-data.ts` (task mapping): read `required_annotators`.
- `components/task-policy-card.tsx` (task Setup):
  - show the count;
  - editable while the task is a draft;
  - read-only after activation, with "Fixed once the task is activated";
  - sent with the card's save.

**Tests (Vitest):**
- a draft task's card edits and sends the count;
- an active task's card shows it read-only with the reason;
- the API's 409 message is shown if it comes back.

```bash
git add apps/hej-web/components/task-policy-card.tsx apps/hej-web/components/task-policy-card.test.tsx apps/hej-web/lib/task-workspace-data.ts apps/hej-web/lib/api/tasks.ts
git commit -m "feat(web): show and edit the required annotators in task setup" -m "A task's setup now shows how many annotators each item needs, editable while the task is a draft and read-only, with the reason, once it is activated." -m "Owners had no way to see or correct the number after creating a task; the API now fixes it at activation, so the screen says so instead of offering an edit that would be refused."
```

---

## Delivery notes

- **PR:** `feat(SCRUM-85): check a task's result shape on submit, and set its annotator count in the app`, against
  `main`. Reviewer: Hanchen.
- **The description** is reviewer-first. It records the criteria check (§1 of the plan), with *Decisions to review*
  S1–S4, and part B as D8 subtask 2's web half.
- **Checks:** the API suite on both databases (parallel method), the web suite and `tsc`.
- **After merge:** Jira to Done, the tracker row, story B3 complete, and D8 subtask 2 done.
