# Jira updates — 2026-10-24

Three tickets:
- SCRUM-121: rewrite;
- SCRUM-132: three edits;
- one new ticket.

Each block between the rules is the whole field: select all in Jira and paste. The descriptions keep the board's
`{noformat}` wrapper.

---

## 1. SCRUM-121 (Hanchen, In Progress, W11) — replace

**Summary:**

```
Performance: Reads never write, and the project and overview pages read once per organisation
```

**Story points:** 1 → **2** suggested. It grew from 4 commits to 7: the project page (commit 5) and the overview pages
(6, 7) came in on 2026-10-24.

**Description:**

```
{noformat}Related to user story A6

BACKEND AND FRONTEND. W11. PR #98. A6's remainder: its criteria 3 (reading never writes) and 4 (pages do not repeat per-task work), and the same per-project repetition on the Dashboard and Projects pages (added 2026-10-24, after Jingwei reported the Dashboard as slow). SCRUM-119 (PR #54) delivered the drafts read and left these out of scope.

Measured before (A6 perf bed):
- GET /tasks/{id}/task-items and GET /tasks/{id}/setup repaired expert send-back statuses on every read: on df7c05a, 235 statements and 176 ms on a 200-item task with legacy Return history, and a write on every read.
- The project page called getTaskSetup once per task to count its items.
- The Dashboard and Projects pages listed each project's tasks with one request per project, and the Dashboard asked each overseen project's item status counts for Canonical Decisions, so both slowed down with the number of projects.

# GET /tasks/{id}/task-items and GET /tasks/{id}/setup return stored statuses and issue no INSERT, UPDATE or DELETE. A route test counts the statements each runs and fails on any write.
# The read-time repair is deleted, not moved (decided 2026-10-23). The writes already set the status they cause (submission, review verdict, dispute decision through item_status_after_accept). The history the repair read is written only by decide_escalation, whose route answers 410 since #48. A probe that failed whenever the repair would change anything never tripped across both suites, the casebook and a fresh seed. SCRUM-120's reopen cutoff still holds.
# Dropped: the one-off repair in migrate_db_schema(). #88 made every development database reset, so it would have nothing to repair.
# The project page reads every task's item count in one request: the organisation's task-item-counts (from #97, all of a task's items, as Setup reports), not one getTaskSetup per task. It falls back to a task's setup only when the counts fail or don't list it.
# The Dashboard and Projects pages read per organisation: GET /organizations/{id}/tasks (any member, as GET /projects/{id}/tasks) and GET /organizations/{id}/item-status-counts (OVERSEE, as the per-project counts). Each organisation's projects, tasks and counts are asked together. Each batched read falls back to the per-project path if it fails.
# Delete the unused apps/hej-web/components/use-hydrated-task-items.ts.
# Measured on the perf bed, before and after in the PR (main ffc42abd):
#* task-items on the 200-item task with history: 59 → 37 ms, 0 writes. The statement count no longer grows with items or history; what is left is D7's blind-review statuses, read in batches. The 20 ms target predates those reads.
#* the project page with 8 tasks: 119 → 49 ms (−59%).
#* the Dashboard: 519 → 89 ms (−83%) at 51 projects, 9 requests at any number of projects (107 before).
# Tests, each failing on the old behaviour where there was one: task-items and setup issue no write and run the same statements for 10 and 40 items; a Return and a resubmission show on the next read; a Return before a reopen does not come back; the organisation reads run the same statements for 2 and 12 projects and equal the per-project reads; the pages send one request per organisation whatever the number of projects.

Out of scope: the annotate work queue request (about 520 ms on a 200-item task, #52); the project page's "Your work" card, which asks each task's annotate work queue twice; decide_escalation and the item-level escalation records; the expert_send_back status (SCRUM-134).

Collaboration:
- SCRUM-128 (Jingwei): dashboard-canonical-count and its two tests now use the organisation read; rules and assertions unchanged.
- SCRUM-134: retires expert_send_back after this merges.
- Evaluation harness: the casebook passes unchanged, 87/87.{noformat}
```

---

## 2. SCRUM-132 (Yi, PR #99) — full description

These follow the review of #99 posted on 2026-10-24: findings 1, 2 and 4. The text is built on the board export of
2026-10-24 00:08, with the edits applied. The Display and Tests criteria follow those edits too.

```
{noformat}Related to user story C1

FULL STACK. W11. Added 2026-10-22 (found while tracing the seeded-answer bug). PR #99. Changed 2026-10-24 by the review of PR #99: structured results state no platform score, judgement-class image tasks are covered, and a reviewer's verdict correction drops the confidence it copied.

On an annotation task, confidence is the model's statement about its own output. Three things disagree with that on main fd35571:

1. The output schemas and the AI adapter disagree on where confidence lives. Classification and structured results ask for a top-level score, which the adapter reads. image_bbox asks for a top-level score, which the adapter drops: it reads each box's instead. text_spans, audio_segments, video_segments and video_tracking ask for none, while the adapter reads one per entity, segment or keyframe, so a part's confidence exists only when a model adds it unasked. The schema format cannot mark a nested field optional: optional_fields is top-level only, the prompt tells the model nested objects are required structure, and the validator requires every nested field.
2. The screen shows the first part's confidence as the whole answer's. firstResultConfidence takes the top-level value, or else the first span's, box's or segment's, and shows it in the AI-assisted list's Confidence column, the AI candidate preview and the review panel's AI evidence note. The other parts' values appear only in raw JSON; a video track's are never read.
3. People are asked for a confidence on annotation surfaces. The classification editor's "Confidence (0 to 1)", and the video segment's and keyframe's fields, let an annotator or reviewer type one; nothing but the export reads it. A person who starts from an AI draft keeps the AI's confidence in their own submission.

# Schemas (v1 presets, backend and web, edited in place): score is a required field whose value may be null ("your confidence from 0 to 1, or null if you cannot judge"), at the level the model judges: classification at the top level; text_spans on each entity; image_bbox on each box (image_bbox is a judgement-class surface), its top-level score removed; audio_segments and video_segments on each segment; video_tracking on each track. structured_result states no platform score: its fields are the task's own (decided 2026-10-24). A missing key fails the run as any other missing field does; null is a stated "cannot judge". Required-but-nullable is used because the validator cannot express an optional field inside a nested object, not because a value is mandatory.
# Adapter: reads score or confidence at those levels and stores confidence; a null stays empty, never 0. video_tracking reads a track's instead of each keyframe's.
# Display: on an AI submission each span's, box's, segment's and track's confidence is shown read-only beside it. The answer-level confidence (list column, candidate preview, AI evidence note) is shown only where the model stated one for the whole answer: on classification and judgement surfaces, decided by the surface, not the task class. On surfaces with per-part confidence, judgement-class image tasks included, the AI-assisted list has no Confidence column. No aggregate (minimum, mean) is computed.
# People: the web no longer offers a confidence field on an annotation result (classification, video segment, video keyframe), and the hint "Select a classification label and record confidence and rationale." changes. The API removes confidence, top-level and per part, from a person's annotation result on draft save, submission and correction, including one started from an AI draft. On judgement-class image tasks, a box's confidence is removed too; only the verdict's own top-level confidence is kept.
# Unchanged: judgement. The judgement schema's optional score, the judgement adapter, and a person's own confidence under blind-then-reveal (SCRUM-73), which the evaluation compares before and after the reveal. Except: a reviewer's verdict correction drops the confidence of the answer it corrects, AI or person, since that number was stated for a different verdict (decided 2026-10-24). A correction is never a blind-then-reveal stage, and the evaluation reads the round's final answer, never a correction. Not covered: annotations.confidence, the integer column.
# Tests: the presets' score fields, and none on structured_result; the adapter keeps per-part values and leaves a null empty; a person's annotation result is stored without confidence and a judgement keeps it; on a judgement image task, a person's and a reviewer's boxes are stored without confidence; a reviewer's verdict correction is stored without a confidence; the list, preview and evidence note show no answer-level confidence for a per-part surface, judgement-class image tasks included.

Collaboration:
- SCRUM-73 (blind-then-reveal) and SCRUM-71/74 (evaluation): the blind and final judgements keep the person's confidence; two follow-ups are raised in the PR for their owner.
- SCRUM-128 (UI declutter): edits the same work panel file; merged (#97), and #99 is level with it.
- New ticket (judgement image task offers a person only a verdict): found in the same review, not in this ticket.{noformat}
```

<details><summary>The three edits on their own (superseded by the full text above)</summary>

Change only these lines; everything else stays.

**In "# Schemas", replace the clause that lists the levels with:**

```
at the level the model judges: classification at the top level; text_spans on each entity; image_bbox on each box (image_bbox is a judgement-class surface), its top-level score removed; audio_segments and video_segments on each segment; video_tracking on each track. structured_result states no platform score: its fields are the task's own (decided 2026-10-24).
```

**In "# People", append:**

```
On judgement-class image tasks, a box's confidence is removed too; only the verdict's own top-level confidence is kept.
```

**In "# Unchanged", after "a person's own confidence under blind-then-reveal (SCRUM-73), which the evaluation compares before and after the reveal", add:**

```
Except: a reviewer's verdict correction drops the confidence of the answer it corrects, AI or person, since that number was stated for a different verdict (decided 2026-10-24). A correction is never a blind-then-reveal stage, and the evaluation reads the round's final answer, never a correction.
```

</details>

---

## 3. New ticket — a judgement image task offers a person only a verdict

The full draft, with the code references, is `jira-new-judgement-image-boxes-not-saved.md`. The fields:

| Field | Value |
| --- | --- |
| Type | Bug |
| Summary | `Annotation: a judgement image task asks the AI for boxes but offers a person only a verdict` |
| Sprint | W11 if it fits before 28 Oct, otherwise none (handover backlog) |
| Assignee | Open |
| Story points | 1 for the check and the decision; 2 more if a person is to draw boxes |
| Link | relates to SCRUM-132 |

**Description:**

```
{noformat}Found while reviewing PR #99 (SCRUM-132). Checked in code at 421ae198; not yet run in the app.

On a judgement image task the AI is asked for bounding boxes, but a person is offered only a verdict and a rationale, so the two sides answer different questions.
- image_bbox is offered only to the judgement task class on image tasks, and is their default (annotation_types.py:67-70, :108).
- The AI answers with boxes: the image_bbox preset asks for boxes, and the adapter reads each one.
- A person gets no box editor: isJudgement selects the judgement layout (task-item-workspace-sheet.tsx:3060), and ImageBBoxAnnotator is only in the non-judgement branch.
- The submission sends only {verdict, rationale}: the result payload checks isJudgement before the image case (:2105-2113).
- The API accepts boxes from a person; only the web never sends them.

# Check in the running app (after init_data.py --reset): create a judgement image task and answer an item as a person in both production modes; record what the panel shows, what the API stores, and whether review and export read it.
# Decide what a person does on a judgement image task: (a) draw or correct boxes, starting from the AI's on AI-assisted tasks, which matches the preset; or (b) judge the AI's boxes with a verdict, with the preset or the task class mapping saying so and the image shown beside the verdict form.
# Build the chosen option, with a test that fails on today's behaviour.{noformat}
```
