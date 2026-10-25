# New ticket — a judgement image task asks for boxes but the work panel offers only a verdict (2026-10-24)

**Not yet on the board.** Drafted by Hanchen's review of PR #99 (SCRUM-132), `../../../reviews/W11/review-cs57-yi-scrum-132-pr99-model-confidence.md`.

**Why.** Found while reviewing #99. On a judgement image task the AI is asked for bounding boxes, but a person is
offered only a verdict and a rationale, so the platform's two sides answer different questions. Outside SCRUM-132, so
it is not added to that ticket.

**Checked 2026-10-24 in code, at `421ae198` (#99, on `main` `ffc42abd`); not yet run in the app:**
- **The surface is judgement-only.** `image_bbox` is offered only to the judgement task class on image tasks, and is
  their default (`apps/hej-api/app/core/annotation_types.py:67`–`:70`, `:108`). Annotation image tasks get
  classification or structured result (`:39`–`:44`).
- **The AI answers with boxes.** The `image_bbox` preset asks for `boxes` (`annotation_schemas.py`), and the adapter
  reads each box (`ai_preannotator.py:568`).
- **A person gets no box editor.** In `task-item-workspace-sheet.tsx`, `isJudgement` selects the judgement layout
  (`:3060`). That layout shows the item's preview text, the instruction, the version history and the verdict form. The
  media viewport with `ImageBBoxAnnotator` (`mode="annotate"`, `:3262`, `:4403`) is only in the non-judgement branch
  (`:3229`).
- **The submission sends only the verdict.** The `result` payload checks `isJudgement` before `isImageAnnotateItem`
  (`:2105`–`:2113`), so `{verdict, rationale}` is sent even where box state exists.
- **The API accepts boxes.** A test probe in the #99 review submitted a person's `boxes` answer through the routes on a
  judgement image task, and it was stored. Only the web never sends one.

**To decide before building (Hanchen):** what a person does on a judgement image task.
- **(a)** Draw or correct boxes. The panel shows the image editor and sends `boxes`, starting from the AI's boxes on
  AI-assisted tasks. This matches the preset.
- **(b)** Judge the AI's boxes with a verdict. Then the preset, or the task class mapping, should say so, and the image
  should be shown beside the verdict form.

**To check first, in the running app** (after `init_data.py --reset`): create a judgement image task, then answer an
item as a person in both production modes. Record what the panel shows, what the API stores, and whether review and
export read it.

---

## Board steps

| Field | Value |
| --- | --- |
| Type | Bug |
| Epic | Annotation surfaces (the epic SCRUM-132 sits under) |
| Story | none, or the story that owns image annotation if one fits |
| Sprint | **W11** if it fits before 28 Oct, otherwise none (handover backlog) |
| Assignee | **Open** |
| Story points | **1** for the check and the decision; **2** more if (a) is chosen |
| Links | relates to SCRUM-132 (PR #99) |

**Summary:** `Annotation: a judgement image task asks the AI for boxes but offers a person only a verdict`
