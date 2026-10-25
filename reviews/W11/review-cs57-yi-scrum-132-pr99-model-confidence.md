# Review — PR #99, `CS57-Yi-scrum-132` (SCRUM-132, C1: a confidence is the model's, asked for and shown where it judges)

<https://github.com/USYD-CS-Capstone/hej/pull/99> · reviewed 2026-10-24 at `421ae198` (5 commits, 31 files, +743/−123) · `main` at `ffc42abd` (#97 merged) merged in locally · reviewer Hanchen Wang

**Posted 2026-10-24 as Request changes** on `421ae198` (everything from "Verdict" down to the horizontal rule, unchanged; GitHub time 2026-10-23T15:21:49Z UTC). "Not for the PR" below the rule is for Hanchen only.

Read from GitHub first:
- **The PR is a draft**, `OPEN`, `MERGEABLE`, base `main`, head `421ae198`.
- **No comments, no reviews**, no review decision.
- **CI at `421ae198`:** `sqlite` pass (6 min), `web` pass (4 min), `postgresql` skipping.
- **It is level with `main`.** The merge base is `ffc42abd` (#97), so the local merge of `origin/main` was "Already up to date": no conflicts.
- **ADR 025 is free.** `main` ends at ADR 024 (#97), and the only other open PR, #98, touches no ADR.

Prior context read:
- SCRUM-132's Jira description (Hanchen, 2026-10-22) and story C1 in `shared/story_src.csv`;
- `specs/mission.md`, `specs/tech-stack.md` (commits, the PR title rule of 2026-10-23, Definition of Done) and roadmap W11;
- our earlier reviews of Yi's PRs, #85 (SCRUM-106) and #76 (SCRUM-118), and the two messages to Yi of 2026-10-15 in `sandbox/W10/msg/`;
- client issue #72 (blind-then-reveal, the annotator's own confidence), and `info/client-qa.md` / `client-question.md` (no client decision on confidence);
- ADRs 004, 016, 019, 024 and the new 025.

## Verdict: request changes

Thanks, Yi. Most of this is right and well built. The presets ask for `score` at the level the model judges, in both
catalogues. The adapter reads a track's confidence from the track and keeps a null as none. The web shows each span's,
box's, segment's and track's confidence beside it and no longer offers a person a confidence field. The API strips a
person's confidence on every write path that stores a result, and leaves the AI's own submission alone. The suites pass,
and the three route tests do fail without the write-point checks: I checked by disabling them.

One blocking point and three should-fix points:

1. **Bounding boxes are a judgement-class surface**, so nothing in this PR reaches them: the API never strips a box's
   confidence, and the Confidence column still shows on image tasks. The tests use a task class and surface pair that
   cannot exist (finding 1).
2. **A structured result's `score` is asked for but never stored as a confidence**, and a person who starts from the AI's
   structured result keeps it. We've decided to stop asking for it (finding 2).
3. **"Candidates ready" counts 0** on every AI-assisted span, box, segment or track task (finding 3).
4. **A reviewer's verdict correction keeps the confidence of the answer it corrects.** This is outside the ticket's
   text, which kept judgement unchanged, but it is the same problem and a small fix, so I'm asking for it here. I'll
   update SCRUM-132 to match (finding 4).

## Checked

| Check | Result |
| --- | --- |
| Worktree `D:\COMP5703_Capstone\hej-review-99` at `421ae198`, `origin/main` (`ffc42abd`) merged in | Already contained, no conflicts. Main checkout untouched |
| Backend, SQLite, full suite (`pytest -n 6`) | ✅ 2,552 passed, 63 skipped, 204 subtests (1 min 48 s), the same as the PR body |
| Casebook, `--baseline evaluation/baseline.json --exact` | ✅ 87/87 passed, 1 skipped; 88 unchanged, no regression |
| Web, `npm ci`, then `test:web` | ✅ 109 files, 1,019 tests |
| `typecheck:web` / `lint:web` | ✅ clean / 0 errors, 38 warnings |
| PostgreSQL | Not run here. CI skipped it. The PR reports 2,612 passed on PostgreSQL |
| Fail before fix: the four write-point calls disabled (`draft_service.py` create, update and submit; `review_actions.py:703`) | ✅ 4 fail: the three route tests in `test_stated_confidence.py` and `test_an_answer_sent_as_a_bare_label_has_its_label_corrected`. 61 pass. Restored afterwards |
| Probe: the AI's own span submission (`created_by=None`, `submit_draft` with no user) | ✅ annotation and draft both keep the span's `confidence: 0.8` |
| Probe: a person's `image_bbox` answer, sent through the routes on a judgement image task | ❌ stored with the box's `confidence: 0.7` (finding 1) |
| Probe: a person's structured answer that holds the AI's `result.score` | ❌ stored with `score: 0.9` (finding 2) |
| Probe (web): an AI span answer's item, and `hasAnswerLevelConfidence({judgement, image_bbox})` | `item.confidence` is `"n/a"` (finding 3); the gate is `true` (finding 1) |
| Overlap with #97 | The PR sits on #97's merge. Shared files (`task-item-workspace-sheet.tsx`, `task-annotation-workspace.tsx`, `task-items-board.tsx`, `task-workbench.tsx`, `task-format(.test).ts`) merge cleanly, and #97's tests pass |
| Commits, PR title, ADR format | ✅ Five coherent commits, `type(scope): … (SCRUM-132)` headlines, title in the 2026-10-23 format, ADR 025 in the 024 header format (Status, Date, Author, Stories, amends) |

The temporary probe tests were deleted afterwards. The worktree is clean at `421ae198`.

## The ticket, criterion by criterion

| # | Criterion | Result |
| --- | --- | --- |
| 1 | Schemas: `score` required, may be null, at the level the model judges; image top-level `score` removed | ✅ `annotation_schemas.py:41` (`_score`), `:61`, `:77`, `:96`, `:115`, `:132`, `:148`, `:186`; the image top-level `score` is gone (`:100`). The web catalogue matches (`annotation-schema-catalog.ts:37`–`:148`). The judgement preset is untouched (`:176`). Note: these presets are shared with judgement-class image and structured tasks, which now also require `score` |
| 2 | Adapter reads `score`/`confidence` at those levels, null stays empty, track instead of keyframe | ⚠️ Spans `ai_preannotator.py:483`, boxes `:568`, audio `:621`, video segments `:670`, track `:727`–`:729`, classification `:367`, null or out of range → `None` (`:424`). ❌ **structured_result**: the score stays inside `draft_data.result` and is never stored as `confidence` (finding 2) |
| 3 | Per-part confidence shown read-only; answer-level only on classification and judgement; no column on per-part surfaces; no aggregate | ⚠️ Per-part display is in: `readonly-text-spans-preview.tsx:172`, `readonly-image-bbox-preview.tsx:50`, `readonly-audio-segments-preview.tsx:109`, `structured-task-result.tsx:593` (segments), `:621` (tracks), and the dispute and reconciliation box mappings. `firstResultConfidence` reads only the top level (`task-workspace-data.ts:310`). No aggregate. ❌ The column still shows on image tasks (finding 1) |
| 4 | People: no confidence field, new hint; the API strips top-level and per-part on draft, submission and correction | ⚠️ The fields are gone (`structured-task-result.tsx`), the hint is new (`task-item-workspace-sheet.tsx:3361`), and the API strips on create (`draft_service.py:185`), update (`:294`), submission (`:710`) and correction (`review_actions.py:703`). ❌ for boxes (finding 1) and for structured results (finding 2) |
| 5 | Unchanged: the judgement score, its adapter, a person's confidence under blind-then-reveal; `annotations.confidence` | ✅ The judgement preset (`annotation_schemas.py:176`) and adapter (`ai_preannotator.py:275`–`:293`) are unchanged. A judgement keeps the person's confidence (`test_stated_confidence.py:126`). The integer column is still `confidence=100` |
| 6 | Tests: preset score fields; adapter keeps per-part values and nulls; a person's result without confidence, a judgement with it; no answer-level confidence in list, preview and evidence note on a per-part surface | ⚠️ The adapter, person and judgement tests are good, and the route tests are real fail-before-fix tests. Gaps: the box cases test `("annotation", "image_bbox")`, which cannot exist (finding 1). The list, preview and evidence note are tested only through `submissionFieldsFromDraftData` and `hasAnswerLevelConfidence`, not as rendered components (nit 1) |

## Write paths: does every path that stores a person's result strip it?

| Path | Where | Strips? |
| --- | --- | --- |
| Draft create | `routes/drafts.py:103` → `draft_service.py:183`–`:187` | ✅ when there is a user |
| Draft update | `routes/drafts.py:265` → `draft_service.py:293`–`:296` | ✅ |
| Submission: first answer, resubmission, rework after a return or reject, re-answer after a reopen, human rework after an AI return, `dispute_return` replacement | `routes/drafts.py:351` → `_create_annotation_from_draft`, `draft_service.py:710`–`:711`, before `create_independent_replacement` (`:729`), `create_version` (`:761`) and `annotations.create` (`:781`) | ✅ one place covers them all |
| Reviewer correction, from reviewers and from experts on the same route (SCRUM-99) | `review_actions.py:701`–`:703`, before `create_version` at `:800` | ✅ |
| Dispute adjudication, reconciliation choose, settlement, expert Accept of a correction (SCRUM-124) | Choose or accept an existing annotation; none writes new result data | n/a: the correction was stripped when it was written |
| Seeds | `init_data.py` seeds human-first tasks with no results; `seed_test_projects.py` stages answers through the route functions; the protocol suggestions are judgement | ✅ through the routes |
| Dataset registration, bulk actions, import | `task_service.py:1131`–`:1138` writes only empty placeholder drafts; no other writer of `annotation_data` or `draft_data` exists | n/a |
| Blind verdicts | Their own table (`blind_verdict`), judgement only | untouched, as intended |
| **The AI's own drafts and submissions** | Created through the repository with `created_by=None` (`ai_batch_service.py:1116`, `task_service.py:922`), submitted with no user (`ai_batch_service.py:1151`, `task_service.py:941`) | ✅ kept: they bypass `create_draft`, and `created_by is None` skips the strip at `:710`. Probe: span confidence 0.8 survives in both rows |
| A person editing a copy of the AI's draft | `create_draft` writes a new row; the strip works on a deep copy (`stated_confidence.py:78`) | ✅ the AI's row is untouched |

The one gap is the surface, not the route: on `image_bbox` every row above returns early (finding 1).

## Downstream readers of confidence

Nothing on the backend reads an answer-level confidence on span, box, segment or track tasks, so nothing is silently dropped there:
- `evaluation_metrics.py:93`–`:99`, `:247`, `:260`–`:261` read the AI suggestion's confidence and the person's
  final answer on protocol rounds, which are judgement-only (`schemas/tasks.py:57`). Those are kept.
- `harness/gold.py:143`, `:173`, `:201`–`:224` read the AI's answer on classification and judgement. Those are kept.
- The export (`annotation_normalization.py:63`, `:142`, `:216`, `:246`) copies a part's confidence as before. Tracks
  are passed through, so the AI's track confidence is now exported. A person's result simply has none.
- No review policy routes by confidence (EV-081).

On the web, one reader used `item.confidence` as "this item has AI output". It now reads `"n/a"` on per-part
surfaces (finding 3).

The required-but-nullable contract holds:
- the validator refuses a missing nested key and accepts null, because a text template has no type check
  (`annotation_schemas.py:347`–`:352`, `:357`–`:358`);
- the prompt (`analyzers/base.py:208`–`:219`) says nested structure is required;
- every scripted AI answer in the casebook states `score` (EV-002, 010, 011, 081, 103, 104, 111, all classification);
- the quality tasks already required it (`harness/record.py:57`–`:61`);
- the analyzers add no confidence prompt of their own.

Existing tasks keep their old schema copy, and the adapter still reads `score` or `confidence` where a model sends one.

## Findings, most severe first

### 1. Blocking: bounding boxes exist only on judgement tasks, so the PR doesn't reach them

`image_bbox` is offered only to the judgement task class. Annotation image tasks get classification or structured
result (`annotation_types.py:39`–`:44`); judgement image tasks get `image_bbox` (`:67`–`:70`, and it is their default at
`:108`). Three things follow:

- **The API never strips a box's confidence.** `without_person_confidence` returns early for every judgement task
  (`stated_confidence.py:74`), so the `image_bbox` entry in `_PARTS_BY_SURFACE` (`:28`) is never used.
  - Probe: a person's answer on a judgement image task, sent through the routes with
    `boxes: [{…, "confidence": 0.7}]`, is stored with `confidence: 0.7`.
  - Concrete scenario: a reviewer corrects the verdict on an AI image answer. `correction_content` copies the AI's
    answer (`review_corrections.py:84`–`:98`), so the reviewer's version keeps the model's confidence on every box.
    That is the exact case criterion 4 fixes on the other surfaces.
- **The Confidence column still shows on AI-assisted image tasks.** `hasAnswerLevelConfidence` returns true for any
  judgement task (`task-format.ts:107`–`:111`). `getJudgementSignalValue` then finds no top-level confidence, so every
  row reads "n/a". On `main` that column showed the first box's number. Criterion 3 says there is no column on box tasks.
- **The tests pass on a pair that cannot exist.** Both `test_stated_confidence.py:41` and `task-format.test.ts:28`–`:37`
  test `("annotation", "image_bbox")`. The real pair, `("judgement", "image_bbox")`, is untested on either side.

**Fix:**
- In `without_person_confidence`, strip the parts on every task class, and skip only the top-level `pop` on a
  judgement task. The top-level value is the person's blind-then-reveal confidence; a box never is.
- Key `hasAnswerLevelConfidence` on the surface: `annotationType === "classification" || annotationType === "judgement"`.
- Change both tests to `("judgement", "image_bbox")`, and add one route test: a reviewer's verdict correction of an AI
  image answer is stored without box confidence.
- The box editor now carries `confidence` in its state (`task-item-workspace-sheet.tsx:642` feeds `ImageBBoxAnnotator`,
  which spreads it at `image-bbox-annotator.tsx:56`), though the editor never shows it. The read-only preview needs it,
  so drop it in `buildImageBBoxDraftPayload` (`:680`) rather than at `:642`. Then a saved box can't carry it.
- ADR 025 decisions 5 and 6, and "Unchanged on purpose" in the PR body: say that judgement-class image tasks now
  require `score` on each box too, and that a box's confidence is stripped on them.

### 2. Should fix: a structured result's `score` is asked for, then lost, and a person keeps the AI's

The preset asks for `score` at the top level, beside `result` (`annotation_schemas.py:186`). The adapter then stores the
model's whole reply under `result` (`ai_preannotator.py:376`–`:386`), so the score ends up at `draft_data.result.score`:
- It is never stored as `confidence`, so criterion 2 is not met for structured results. Nothing shows it:
  `firstResultConfidence` reads `draft_data.confidence` or `draft_data.score`, which are both absent.
- `structured_result` is not in `_PARTS_BY_SURFACE`, and the strip removes only `confidence`, never `score`. So a person
  who starts from the AI's structured result hands in the model's number. Probe: the answer is stored with
  `result.score: 0.9`.

The PR says a `confidence` among a structured result's own fields is left alone because they are the task's own. That
is a fair rule for the task's fields, but this `score` is the platform's field: the preset asks for it next to `result`,
not inside it.

**Fix: stop asking for it.** We've decided to drop `score` from the structured result preset, in both
`annotation_schemas.py` and `annotation-schema-catalog.ts`, rather than lift it into `draft_data.confidence`.
- A structured result's fields are the task's own, as the PR already says. A platform field beside `result` would
  need its own adapter path, strip rule and display for a surface where nothing shows an answer-level number.
- Lifting it and then stripping a `score` from a person's result could also remove a field a task owner defined
  in their own schema.

So:
- remove it from the preset, so it is neither required nor optional;
- update the catalogue test and the task-create form test;
- in ADR 025, say structured results state no platform confidence, and that this changes criterion 1 of SCRUM-132.

I'll change the ticket's text to match. Tasks created before this keep their schema copy, and the adapter keeps
storing whatever the model sends under `result`, as on `main`.

### 3. Should fix: "Candidates ready" reads 0 on every per-part AI task

The model-run drawer counts AI candidates as items whose `confidence` is not `"n/a"`
(`task-annotation-workspace.tsx:255`–`:257`). `firstResultConfidence` no longer takes the first part's value. So an AI
span, box, segment or track answer leaves `item.confidence` at `"n/a"`, which the web probe confirms. "Candidates ready"
and "Candidate outputs ready" (`model-run-drawer.tsx:60`, `:167`, `:308`) therefore read 0 on those tasks, however many
AI answers there are.

**Fix:** count `item.aiRunStatus === "completed"` (or `aiLabel`/`candidateOutput` present), not the confidence.

### 4. Should fix: a reviewer's verdict correction keeps the confidence of the answer it corrects

On a judgement task, `correction_content` deep-copies the answer under review and replaces only the verdict
(`review_corrections.py:84`–`:98`). So when an AI answer `{verdict: "approve", confidence: 0.85}` is corrected to
"reject", the reviewer's version is stored as `{verdict: "reject", confidence: 0.85}`. The 0.85 is the model's
confidence in "approve", and it now sits on an answer the model never gave. The same happens when a reviewer
corrects a person's judgement: the reviewer's version carries the annotator's confidence. The strip at
`review_actions.py:703` doesn't help, because `without_person_confidence` returns early on judgement.

This goes beyond the ticket's criterion 5 ("judgement unchanged"), but it is the problem this PR fixes on the other
surfaces, and the fix is small. It is safe for the evaluation: a correction is never a blind-then-reveal stage, and
the metrics read the round's `final_annotation_id`, never a correction (`evaluation_metrics.py:257`, `:394`).

**Fix:** in the judgement branch of `correction_content`, drop `confidence` from where the verdict is replaced (the top
level, or `output` / `annotation_output`), on every correction, AI or person. Add two route tests:
- a reviewer's verdict correction of an AI judgement is stored without a confidence;
- a person's judgement answer still keeps theirs (already covered by the existing guard, so make sure it still passes).

Add one line to ADR 025 as well.

### Nits

1. **The candidate summary says "Confidence n/a" on per-part AI submissions.** `candidateConfidence={review.confidence || null}`
   (`task-item-workspace-sheet.tsx:4084`) passes the string `"n/a"`, which `AnnotationOutputPreview` renders. Pass it
   only when `hasAnswerLevelConfidence(task)` and the value isn't `"n/a"`. One render test of this would also close
   criterion 6's "preview" part.
2. **No guard test for the AI's side.** Nothing pins that the AI's own submission keeps its per-part confidence. I proved
   it with a temporary test (AI draft with a span at 0.8 → `submit_draft` with no user → the annotation keeps 0.8).
   Please add it to `test_stated_confidence.py` as a Guard.
3. **One range rule for parts.** Spans, boxes and audio segments keep a confidence only from 0 to 1 (`normalizeConfidence`,
   `annotation-data.ts`). Tracks and video segments use `finiteNumber` (`task-result-mapping.ts:304`, `:231`), so 85
   shows as "Confidence 85". The API already stores none for that, so only old data is affected.
4. **`firstResultConfidence` no longer reads the first part** (`task-workspace-data.ts:310`). Rename it, for example to
   `answerConfidence`.
5. **`HEJ_MVP_AI_INTEGRATION_SUMMARY.md:126`** still says each keyframe keeps a confidence.
6. **PR body:** the Verification section has no run in the app. The Definition of Done asks for "demonstrable in the
   running app". Add what you clicked through after the reset, or say it wasn't done.

## The two questions for Jingwei

I'm not answering them here, only checking the framing. Both are accurate:
- **Question 1.** The judgement preset's `score` is optional (`annotation_schemas.py:176`). Only a number template gets a
  type check (`:357`–`:358`), so "never null" would need one, and a number template carries no description. The
  evaluation reads the AI suggestion's confidence (`evaluation_metrics.py:247`, `harness/gold.py:173`). One thing to add
  for Jingwei: the quality tasks already require it (`harness/record.py:41`).
- **Question 2.** A pair missing either side drops out of the shift (`evaluation_metrics.py:269`). The panel offers
  "Skip" (`protocol-judgement-steps.tsx:21`). There are exactly seven casebook blind steps with no confidence: EV-105,
  EV-107, EV-108 ×2, EV-109, EV-110 ×2.

Both questions are about the verdict surface. After findings 1 and 4, two things on judgement tasks change in this PR:
- judgement-class image tasks;
- a reviewer's verdict correction.

Please say that in the questions too, so Jingwei isn't surprised.

## After merge

As the PR says: reset every development database (`uv run python -X utf8 init_data.py --reset` from `apps/hej-api`), so
the seeded tasks take the new presets.

---

## Not for the PR

- **The PR is still a draft**, and CI's `postgresql` job skipped. Yi needs to mark it ready, and someone should run it on
  PostgreSQL before merging.
- **Decided by Hanchen, 2026-10-24:**
  - post as Request changes;
  - structured results drop `score` (option b, finding 2);
  - Yi fixes the verdict-correction confidence in this PR (finding 4), although it adds scope to an in-progress
    ticket. It is Hanchen's explicit call, made against the usual rule.
- **SCRUM-132's Jira text needs three edits:**
  - Schemas: "structured_result at the top level" becomes "structured_result states no platform score".
  - Display/People: boxes are stripped on judgement-class image tasks, which now require `score` per box.
  - Unchanged: add "except a reviewer's verdict correction, which drops the confidence of the answer it corrects".
- **Out of this ticket, drafted as a new ticket:** on a judgement image task the AI is asked for boxes, but the work
  panel shows the judgement layout with no box editor (`task-item-workspace-sheet.tsx:3060`, the editor only in the
  `:3229` branch) and sends only the verdict and rationale (`:2105`–`:2113`).
  Draft: `../../sandbox/W11/jira/jira-new-judgement-image-boxes-not-saved.md`.
- **Demo risk:** a missing nested `score` now fails the item's run. No recording covers llama3 on span, segment or track
  tasks, so try one live run before the demo.
- **Same pattern for labels:** `firstResultLabel` still uses the first span's or box's label as the AI answer's label in
  the lists and the evidence note. Outside SCRUM-132.
- The worktree `D:\COMP5703_Capstone\hej-review-99` is left clean at `421ae198`. The casebook report is in
  `apps/hej-api/evaluation/reports/`, which git ignores.
