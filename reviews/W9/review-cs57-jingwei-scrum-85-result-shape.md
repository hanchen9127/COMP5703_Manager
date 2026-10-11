# Review — PR #61, `CS57-Jingwei-scrum-85` (SCRUM-85, B3; D8 subtask 2)

2026-10-09. Head `162dd44`, base `main` (`1dcbcdf`). Six commits, 15 files, +937 / −4. **CLEAN** on GitHub,
CI green (SQLite and PostgreSQL).

**On GitHub (checked with `gh pr view 61`):** open, no reviews, no comments. #59 (SCRUM-87, same author) is
still open; both add a "fixed once activated" check at the top of `update_task`, as the description notes.

**Read before this review:** SCRUM-85's scope, plan and commit breakdown in `sandbox/W9/Jingwei's plan/`
(2026-10-08, decisions S1–S4); the roadmap's B3 and D8 rows; client answers R1-3 (labels optional and
task-dependent) and R1-4 / 17 Sep ("the number of annotators an item needs is chosen when the task is
created"). There are no earlier messages to Jingwei about this ticket.

**Recommendation: approve after one small fix.** The PR does what the ticket and the agreed scope ask. The
judgement rule, the label rule, the submit-only timing, the AI exemption and the count's draft-only edit all
match S1–S4, and the tests prove each rule fails without its fix. One branch of the label reading disagrees with
the export, which the description says can't happen (finding 1).

## Verified

- PR head, API on SQLite: **1,319 passed, 9 skipped**, which matches the description. The new file alone has
  36 passed. I didn't re-run PostgreSQL locally; CI's PostgreSQL job is green.
- Web suite and `tsc` not re-run locally (CI covers the API only). The diff was read in full.
- AI submissions skip the check correctly. Both AI call sites (`ai_batch_service.py:1077` and
  `task_service.py:774`) call `submit_draft` without `user_id`, so `effective_author` is `None`.

## Walkthrough — part B in the running app (2026-10-09)

The PR head ran in Docker as its own compose project (`hej-pr61`) on a fresh PostgreSQL volume, seeded with
`init_data.py --reset` and `seed_test_roles.py`. I was signed in as Alice (TechStart admin).

| Step | Result |
| --- | --- |
| Create form, step 3: count set to 11, Next | ✅ Stays on step 3: "Required annotators must be a whole number from 1 to 10." |
| Count set to 2, task created (Human-first) | ✅ Summary reads "2 annotators per item"; database `required_annotators = 2`, `draft` |
| Project → Policies, the task's card | ✅ "2 per item"; editable in Edit policy |
| Changed to 3 while a draft, saved | ✅ Card reads "3 per item"; database 3 |
| One item registered, task activated from Overview | ✅ "Task activated." |
| Policies card after activation | ✅ "3 per item" with "Fixed once the task is activated…"; in Edit policy the field is disabled (typing does nothing) and saving gives no error |
| API `PUT` on the active task: 3 / 4 / 11 | ✅ 200 / 409 with the plan's message / 422 (`le=10`); database still 3 |

**Where the count is shown.** The card the PR calls "task Setup" is `TaskPolicyCard`. It is only rendered on
the **project's Policies tab** (`project-policies-read-panel.tsx`). The task's own Setup page
(`/tasks/<id>/setup`) never mentions the count. The only route from that page is its "Project policies"
link. Step 4 of the create form doesn't show the count in its summary tiles either; only the "Current draft"
line underneath does. Both are non-blocking (see below).

## Scope — SCRUM-85 plus part B, point by point

| # | Criterion | On `162dd44` |
| --- | --- | --- |
| 1 | Create a task under a project, choosing class and type | ✅ Pinned for every class × type with its default surface |
| 2 | The task records a finished result, and (the gap) a person's result is held to it | ✅ Judgement: verdict and rationale, 422. Annotation: labels within the task's list, 422 naming both. Submit only; saving a draft is free. ⚠️ See finding 1 |
| 3 | Text end to end; image and video creatable | ✅ Pinned |
| B1 | Web create form: required annotators 1–10, default 1, sent | ✅ Checked on Next, sent, shown in the summary |
| B2 | API edit while a draft; 409 after activation; same value accepted; range checked | ✅ Both `update_task` branches; `Field(ge=1, le=10)` |
| B3 | Web Setup: shown; editable as a draft; read-only with the reason afterwards | ✅ The API's 409 message is shown if it comes back. Seen in the app, but on the project's Policies tab, not the task's Setup page (walkthrough) |
| B4 | `api_surfaces.md` | ✅ The submit refusal and the update contract |

## Fix before merge

### 1. A classification typed as plain text passes the check but exports without its label

`labels_used("classification", …)` has an extra branch: when `output` is a string, the string is the label.
`_normalize_classification_annotation` has no such branch. It reads `label` / `verdict` only from a dict
`output`. Probe on the PR head, with the task's labels being `positive, negative`:

- answer `{"output": "positive", "output_text": "positive", "notes": ""}`;
- the check reads `['positive']`, so the submission is **accepted**;
- the export gives `label: None, labels: []`, so **the label the check approved is gone**.

The web never sends this shape (`WEB_ANSWERS["classification"]` is a dict with `label`), so only an API client
can reach it. But the PR adds the branch on purpose and pins it
(`test_a_plain_answer_typed_into_a_classification_box_is_checked_as_the_label`). The description also says
"the label check reads the same keys as its normalizers". The guard test
`test_the_check_reads_a_classification_s_labels_where_the_export_does` only covers the dict shape, so it
doesn't catch this.

**Fix, either way:**
- **(a)** Teach `_normalize_classification_annotation` the same rule: a string `output` is the label. Then
  extend the guard test to the plain-string answer.
- **(b)** Do what the plan's commit 3 said and let the export read labels through `labels_used`, so there is
  one reader. The description says the export was left unchanged on purpose, so (a) is the smaller change.

## Non-blocking

- **A video answer in the other video shape skips the label check.** The check picks parts by the task's
  surface (`video_segments` reads `segments`). The export picks by the payload: with `tracks` and no
  `segments` it exports as `video_tracking`. Probe: a `video_segments` task, answer
  `{"output": {"kind": "video_tracking", "tracks": [{"label": "neutral"}]}}`. The check reads no labels and
  passes, and the export shows a track labelled `neutral`. The web only sends `segments` on that surface, so
  this is API-only. A fix: read both `segments` and `tracks` for either video surface.
- **A change to the count isn't in task history.** `required_annotators` isn't in
  `TASK_DEFINITION_AUDIT_FIELDS`, so a draft-time change from 1 to 3 leaves no `task_updated` row.
  `annotation_mode` is recorded. Adding the field is one line.
- **The count isn't on the task's own Setup page.** It's shown and edited only on the project's Policies tab.
  **Hanchen's decision (2026-10-09): not needed.** The Policies tab shows it, so it isn't raised with Jingwei.
- **Re-export only for the test.** `task-create-form.tsx` re-exports `parseRequiredAnnotators` so its test can
  import it from there. The test could import from `@/lib/required-annotators` directly.

## After merge (ours)

- SCRUM-85 to Done; story B3 complete; D8 subtask 2 done. Part B still has to be added to the SCRUM-85
  description on the board (agreed 08/10), if it isn't there yet.
- #59: whoever merges second resolves the `update_task` conflict and keeps both checks.

## Comment for GitHub (ready to paste)

````markdown
Thanks @Jingwei-Lin, this is a clean one. It follows S1–S4, every rule has a test that fails without it, and the AI path is correctly left alone: both AI call sites submit without a `user_id`, so `effective_author` is `None`. Re-checked on `162dd44`: SQLite 1,319 passed and 9 skipped. CI is green on both databases.

**One thing before merge:**

**A plain-text classification answer passes the check but exports without its label.** `labels_used("classification", …)` treats a string `output` as the label, but `_normalize_classification_annotation` only reads `label` / `verdict` from a dict `output`. On a task with labels `positive, negative`:
- `{"output": "positive", "output_text": "positive", "notes": ""}` is accepted, because the check reads `['positive']`;
- the export of that annotation gives `label: None, labels: []`.

The web never sends this shape, so only an API client can hit it. But the branch is deliberate and pinned by `test_a_plain_answer_typed_into_a_classification_box_is_checked_as_the_label`, and the description says the check reads the same keys as the normalizers. The smallest fix is to give `_normalize_classification_annotation` the same rule (a string `output` is the label), and to extend `test_the_check_reads_a_classification_s_labels_where_the_export_does` to the plain-string answer.

**Non-blocking:**
- A `video_segments` task answered with `tracks` (no `segments`) skips the label check: the check reads `segments` by surface, while the export switches to `video_tracking` and shows the track labels. The web doesn't send it. Reading both keys for either video surface would close it.
- `required_annotators` isn't in `TASK_DEFINITION_AUDIT_FIELDS`, so a draft-time change of the count leaves no `task_updated` row, although `annotation_mode` does. It's a one-line addition.
- `task-create-form.tsx` re-exports `parseRequiredAnnotators` only for its test, which could import it from `@/lib/required-annotators`.
````

## Round 2 — `167be43` (2026-10-09)

**Posted:** the round-1 comment above, as a **Request changes** review (2026-10-08 13:31 UTC, at `162dd44`),
before the walkthrough. Jingwei pushed `3636936` and `167be43` eleven minutes later. There was no written
reply; the commit messages give the reasons.

| Round-1 point | Checked on `167be43` |
| --- | --- |
| 1. A plain-text classification answer exports without its label (blocking) | ✅ `_normalize_classification_annotation` now reads a string `output` as the label. The guard test is parametrized over the editor JSON and the plain answer. Probe: check `['positive']`, export `['positive']` |
| A `video_segments` task answered with `tracks` skips the check | ✅ Either video surface reads both `segments` and `tracks`. New prove test (`neutral` in tracks on a segments task → 422). Probe: the check now reads `['neutral']` |
| A count change isn't in task history | ✅ `required_annotators` is in `TASK_DEFINITION_AUDIT_FIELDS`. New test: one `task_updated` row, 1 → 2 |
| The test-only re-export | ✅ Removed; the test imports from `@/lib/required-annotators` |

**Verified** on `167be43`: API on SQLite **1,322 passed, 9 skipped** (+3 new tests). Web changes in round 2 are
only the import line. The walkthrough above ran on `162dd44`; nothing in part B changed since.

**Not raised:** the count shown only on the project's Policies tab (Hanchen, 2026-10-09: not needed).

**Recommendation: approve.**

### Approval comment (ready to paste)

```markdown
Thanks @Jingwei-Lin, all four are in. Re-checked on `167be43`: SQLite 1,322 passed and 9 skipped (three new tests).

- **Plain classification answer:** the export now reads a string `output` as the label, and the parametrized guard covers both shapes. My probe gives `['positive']` from both the check and the export.
- **Video tracks on a segments task:** either video surface reads both `segments` and `tracks`, and the new test refuses `neutral` in tracks.
- **History:** a draft-time count change now writes a `task_updated` row (1 → 2).
- **Re-export:** gone, and the test imports from `@/lib/required-annotators`.

I also walked part B through in the running app, on a fresh PostgreSQL database. 11 is refused on the create form. 2 is saved and shows on the Policies card. It changes to 3 while a draft. After activation the field is disabled with the reason, and the API returns 200 / 409 / 422 for 3 / 4 / 11.

Approving.
```

## Merged (2026-10-09)

Approved and merged by Hanchen at 13:59 UTC on 2026-10-08 (2026-10-09 in Sydney). Merge commit `891fc4b`,
not squashed, as the plan asked; head `167be43`; CI green on SQLite and PostgreSQL. The branch
`CS57-Jingwei-scrum-85` was left in place.

**Still to do:** SCRUM-85 to Done on the board; the tracker row; story B3 complete and D8 subtask 2 done
(`tracking-sync`). #59 (SCRUM-87) now carries the `update_task` conflict and must keep both "fixed once
activated" checks.
