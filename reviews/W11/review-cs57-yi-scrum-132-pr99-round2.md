# Review, round 2 — PR #99, `CS57-Yi-scrum-132` (SCRUM-132, C1: a confidence is the model's, asked for and shown where it judges)

<https://github.com/USYD-CS-Capstone/hej/pull/99> · reviewed 2026-10-24 at `e97560c4` (10 commits, 34 files, +934/−130 against `main`; five new commits since round 1's `421ae198`) · `main` still at `ffc42abd`, which is an ancestor of the head, so there is nothing to merge in · reviewer Hanchen Wang

Round 1: Request changes, posted 2026-10-23T15:21:49Z UTC on `421ae198` (`review-cs57-yi-scrum-132-pr99-model-confidence.md`). Nothing from this file is posted yet. Everything from "Verdict" down to the horizontal rule is meant for the PR. "Not for the PR" is for Hanchen only.

Read from GitHub first:
- **The PR is still a draft**, `OPEN`. Review state: only my round-1 `CHANGES_REQUESTED`.
- **CI at `e97560c4`: `sqlite`, `web`, `postgresql` all skipped.** A draft does not run them, so no CI result exists for either head.
- **Yi's reply** (comment, 2026-10-24T01:32:03Z) answers findings 1–4, nits 1–5 and the Jingwei note, and reports numbers on `e97560c`.
- **The PR description was not edited.** It still describes the round-1 design (details under "New findings").

Prior context read: the round-1 review; Yi's reply; the five new commits (`32fe281`, `72d0f42`, `7b6cd3c`, `674e8e5`, `e97560c`); ADR 025 at the new head, ADR 019 decision 4 and ADR 024's header; `tech-stack.md` Definition of Done and the testing-discipline rule; the draft ticket `sandbox/W11/jira/jira-new-judgement-image-boxes-not-saved.md`.

## Verdict: Approve with nits (no blocking)

Thanks, Yi. Every blocking and should-fix point from round 1 is fixed in the code, and I checked each one by running it, not only by reading the diff. Box confidence is now stripped on judgement-class image tasks through the real routes. The Confidence column and "Candidates ready" follow the surface and the run. A verdict correction drops the confidence of the answer it corrects. Structured results state no platform score, in both catalogues. The new tests are real: they fail when I revert the fix.

What is left is small:
1. **The PR description was stale** (the shared record): it still had the round-1 design and round-1 numbers. **Fixed:** I edited it to match the final design and your comment's numbers, so you have nothing left to do there.
2. **No run in the app is recorded** (round-1 nit 6). **Decided: a follow-up, not part of this PR.** The description now says so. The click-through is picked up after merge.
3. Two web changes have no test that fails without them, and two ADR wording nits (nits 1–4 below). None blocks the merge; take them in the follow-up.

I'm marking the PR ready so CI runs on the head before it merges.

## Round 1 findings, one by one

| Round 1 | Fixed? | Evidence at `e97560c4` |
| --- | --- | --- |
| **1 (blocking).** Boxes live only on judgement-class image tasks; API never stripped them, column still showed, tests used an impossible pair | ✅ | API: `stated_confidence.py:76`–`:80` strips the parts on every task class and skips only the top-level pop on a judgement (`_strip(..., top_level=...)`, `:40`–`:44`). Probe through the route functions on a `("judgement","image_bbox")` task: draft create, draft update and submit all store the box with no `confidence`, and keep the top-level `0.6`. Same result for the `output` wrapper and the `output_text` copy. Web: `hasAnswerLevelConfidence` keys on the surface, `classification` or `judgement` (`task-format.ts:108`–`:112`); tests use the real pair (`test_stated_confidence.py:52`, `task-format.test.ts:45`). The saved box drops it in `buildImageBBoxDraftPayload` (`task-item-workspace-sheet.tsx:692`, whitelist of `id, label, x, y, width, height`, which is every field of `ImageBBox`), while the read-only preview still reads the model's (`readonly-image-bbox-preview.tsx:50`). Route test for a reviewer's verdict correction of an AI image answer: `test_review_corrections.py:605`. ADR 025 decisions 1, 4, 5 and the PR comment say judgement-class image tasks now need a box `score` and lose a person's box confidence |
| **2.** Structured result `score` asked for but lost | ✅ | Dropped from the preset in both catalogues: `annotation_schemas.py:186`–`:190`, `annotation-schema-catalog.ts:145`–`:151`. Tests follow (`test_ai_preannotator.py` ×2, `task-create-form.test.tsx`). A person's structured result is left alone, including a `result.score` and a top-level `confidence` (probe). An old task keeps its schema copy, and the adapter still stores the whole reply under `result` (`ai_preannotator.py:378`–`:386`), so a reply that still carries `score` works. ADR 025 decision 1 says it |
| **3.** "Candidates ready" read 0 on per-part tasks | ✅ | `countAiCandidates` counts `aiRunStatus === "completed"` (`task-format.ts:120`), used at `task-annotation-workspace.tsx:256` and fed to both drawer figures (`model-run-drawer.tsx:60`, `:167`, `:308`). No `confidence !== "n/a"` count is left anywhere in the web. Unit test at `task-format.test.ts:69` |
| **4.** Verdict correction kept the corrected answer's confidence | ✅ | `review_corrections.py:89`–`:102` drops `confidence` where the verdict is replaced: top level, `output` / `annotation_output`, or the added top-level verdict. Probe on the routes: a correction of an AI judgement and of a person's judgement are both stored as `{verdict, rationale}`. The person's own answer still keeps `0.8` (guard `test_stated_confidence.py:159`). Tests `test_review_corrections.py:592`, `:605`. ADR 025 decision 5 |
| Nit 1: "Confidence n/a" in the candidate summary | ✅ | `getAnswerConfidence` (`task-format.ts:125`–`:131`), used at `task-item-workspace-sheet.tsx:4094`. Two render tests (`annotation-output-preview.test.tsx:11`–`:36`) |
| Nit 2: guard for the AI's own submission | ✅ | `test_stated_confidence.py:142` (AI draft, span at 0.8, `submit_draft` with no user: draft and answer keep 0.8). Green with or without the fix, as a guard should be |
| Nit 3: one 0..1 rule for segments and tracks | ✅ in code, ⚠️ untested | `probability()` at `task-result-mapping.ts:141`, used at `:237`, `:310`. No test covers it (nit 2 below) |
| Nit 4: rename `firstResultConfidence` | ✅ | `answerConfidence`, `task-workspace-data.ts:310` |
| Nit 5: `HEJ_MVP_AI_INTEGRATION_SUMMARY.md:126` | ✅ | Now says the track keeps the confidence, the keyframes none |
| Nit 6: no run in the app in the PR body | ➡️ follow-up | Not done in this PR. Decided at merge to take it as a follow-up; the description now says it was not run in the app |
| Jingwei note | ✅ | Comment point 7 states both changes on judgement-class tasks. The body's own "Questions for Jingwei" section does not (see finding 1 below) |

## Checked

| Check | Result |
| --- | --- |
| Worktree `D:\COMP5703_Capstone\hej-review-99` at `origin/pr-99` = `e97560c4`; `origin/main` (`ffc42abd`) is an ancestor | ✅ Nothing to merge. Main checkout untouched |
| Backend, SQLite, `uv run python -X utf8 -m pytest -q -n 6`, explicit `DATABASE_URL=sqlite:///…` | ✅ 2,556 passed, 63 skipped, 204 subtests (1 min 42 s). Same as the PR |
| Casebook, `uv run python -X utf8 -m evaluation run --baseline evaluation/baseline.json --exact` | ✅ 87/87 passed, 1 skipped; 88 unchanged, no regression |
| Web, `npm run test:web` | ✅ 109 files, 1,024 tests |
| `npm run typecheck:web` / `npm run lint:web` | ✅ clean / 0 errors, 38 warnings (same count as round 1) |
| `git diff --check origin/main HEAD` | ✅ clean |
| PostgreSQL | **Not run.** Docker Desktop's engine is not running here, and CI skipped the job because the PR is a draft. The PR's 2,616 passed / 3 skipped is Yi's claim, not checked by me |
| Fail before fix: `stated_confidence.py` and `review_corrections.py` put back to `421ae198`, new test files kept | ✅ 3 fail, 136 pass: `test_a_box_loses_its_confidence_on_the_judgement_task_that_holds_it`, `test_a_verdict_correction_carries_no_confidence`, `test_a_verdict_correction_of_an_image_answer_keeps_no_box_confidence`. Per file: with only `stated_confidence.py` reverted, the box test and the image-correction test fail; with only `review_corrections.py` reverted, the AI-judgement correction test fails. All restored afterwards (139 pass) |
| Guards (green both ways) | `test_the_ais_own_submission_keeps_each_parts_confidence`, `test_a_judgement_answer_keeps_the_persons_confidence`, and the structured / judgement "keep their confidence" cases |
| Fail before fix, web: `task-item-workspace-sheet.tsx` put back to `421ae198` | Nothing fails (179 pass in the sheet and preview tests). The saved-box drop and the `getAnswerConfidence` call site are not pinned (nit 1) |
| Fail before fix, web: `task-result-mapping.ts` put back to `421ae198` | Nothing fails (370 pass). The 0..1 rule for segments and tracks is not pinned (nit 2) |
| Running API (SQLite DB in the worktree's scratch folder, `init_data.py --reset`, `main.py`, over HTTP as the seeded people) | ✅ Dana's text-span draft with a span `0.92` and a top-level `0.5` is stored without both, and so is the submitted answer. Dana's judgement draft keeps `0.8`. The server was stopped afterwards. **This is the API only. I did not click through the web UI.** An AI result on a span task needs a configured model, which the seed does not have |
| Catalogue parity, `annotation_schemas.py` against `annotation-schema-catalog.ts` | ✅ Same `score` placement on every surface: classification, spans, boxes, audio and video segments, tracks. None on structured result. Judgement unchanged |
| Downstream readers | ✅ Unchanged from round 1. The evaluation (`evaluation_metrics.py`, `harness/gold.py`, `harness/record.py`) reads only classification and judgement confidence. The export (`annotation_normalization.py:63`, `:142`, `:216`, `:246`) never read a keyframe confidence. Nothing in `init_data.py`, `seed_*.py` or the casebook depends on a structured `score` or a box confidence |
| Commits, PR title | ✅ Each new commit is one unit, `type(scope): … (SCRUM-132)`. Title is still in the 2026-10-23 format |
| ADR 025 | ✅ with one wording nit below. Header matches ADR 024's fields. Every decision is true at the head. No conflict with ADR 019 (it amends decision 4) or ADR 004 |

The temporary probe test was deleted. `git status` in the worktree is clean at `e97560c4`.

## New findings

### 1. The PR description was stale — fixed

The description is the shared record, and CI will not read your comment. It still said (I have rewritten it to match the final design, your point 7 and your Verification table):
- **"What the model is asked for"**: the table row "classification, structured result | top level (moved from `optional_fields`)". Structured results no longer ask for `score`.
- **"What a person's result carries"** and **"Unchanged on purpose"**: nothing about judgement-class image tasks (a box now needs a `score` and loses a person's box confidence) or about a verdict correction dropping the confidence. These are the two changes comment point 7 tells Jingwei about.
- **"Questions for Jingwei"**: no mention of those two changes. Move your point 7 into the description.
- **"Tests"**: "the three route tests fail without the write-point checks", and the web list stops at round 1.
- **"Verification"**: 2552 / 2612 / 1019. Your comment has 2,556 / 2,616 / 1,024.

### 2. No run in the app (round 1, nit 6) — a follow-up, not this PR

The Definition of Done says "Demonstrable in the running app, not just the API". Nothing in the PR records a click-through. We take it as a follow-up after merge rather than hold this PR for it: a short click-through, for example a classification task shows its Confidence column, a span task shows none, and an AI span result shows each span's confidence. The description now says plainly that it was not run in the app.

## Nits

1. **The saved box drop has no test** (`task-item-workspace-sheet.tsx:692`). With the change reverted, the whole sheet suite passes, because the hydrated box in the fixtures has no `confidence`. Add a box with `confidence: 0.7` to a fixture and assert the saved `payloadText` boxes have none. The same goes for the call site of `getAnswerConfidence` (`:4094`): the helper and `AnnotationOutputPreview` are tested, the wiring is not.
2. **The 0..1 rule for video segments and tracks has no test** (`task-result-mapping.ts:141`, `:237`, `:310`). With it reverted, all 370 `lib` and structured-result tests pass. One case with `confidence: 85` on a segment and a track, expecting none, closes it.
3. **ADR 025 decision 6** says "only a correction replaces it". A correction drops it (decision 5). Say "drops".
4. **ADR 025 `Status` line** reads "Proposed — accepted when the SCRUM-132 pull request merges". ADR 024 writes "Proposed. Accepted when the SCRUM-128 pull request (#97) merges." Name #99 the same way.

---

## Not for the PR

- **Decision made on this review:** Approve with nits. Nothing blocks the code. On 2026-10-24 Hanchen had the PR description rewritten (by me, in the shared record), moved the app run to a follow-up, marked the PR ready and asked for the merge. The posted Approve and the round-1 nit 6 were edited to say so.
- **Before and after merge:**
  - CI had run on neither `421ae198` nor `e97560c4` while the PR was a draft. Marked ready, so `sqlite` and `web` run on the head; `postgresql` runs only after the merge to `main`. Docker was not available to me, so the PostgreSQL result is Yi's claim until `main`'s run.
  - Then reset every development database (`init_data.py --reset`), as the PR says.
  - Follow-up for Yi or the next owner: the click-through in the running app, the tests for nits 1 and 2, and the two ADR 025 wording nits (3 and 4). Not on the board yet.
- **Interaction with the new ticket** (`jira-new-judgement-image-boxes-not-saved.md`), stated as fact only:
  - On the web, a person on a judgement-class image task is offered no box editor (round 1: `task-item-workspace-sheet.tsx` `:3060` and the editor only in the `:3229` branch). So the box stripping, added here, is only reachable through API clients and through a reviewer's verdict correction of an AI answer.
  - When that ticket adds a box editor for people, the web side is already right: `buildImageBBoxDraftPayload` drops the model's confidence, the Confidence column is off for the surface, and the API strips boxes on that task class.
  - The AI is asked for a required `score` per box on those tasks as of this PR. If a model omits it, the item's run fails.
- **Demo risk, unchanged from round 1 and now wider:** a missing nested `score` fails the item's run. No recording covers llama3 on span, segment, track or judgement-class image tasks. Do one live run on each before the demo.
- **Same pattern for labels:** `firstResultLabel` still uses the first span's or box's label as the AI answer's label in the lists and the evidence note. Outside SCRUM-132.
- **Edge not raised:** a legacy judgement shape with the verdict under `output` leaves the `output_text` copy (old verdict and confidence) and a top-level `confidence` as they were. The web never writes that shape for a judgement, so it is reachable only by an API client. Not worth the PR's time.
- **Reports:** the casebook report is in `apps/hej-api/evaluation/reports/`, which git ignores. The worktree `D:\COMP5703_Capstone\hej-review-99` is clean at `e97560c4`. The scratch SQLite database and logs are in the session scratchpad, outside the repository.
