# Plan — SCRUM-114 (item workspace panel) and SCRUM-113 (choose which submission to review)

2026-09-29. Both tickets are Hanchen's, both in the **W8** sprint on the board (SCRUM-113 moved in from
the break on 2026-09-28), 1.5 + 1 points. W8 ends after the Wednesday 2026-09-30 client meeting: both
PRs must be **open for review by then** to count as W8 work (roadmap → Week boundaries).

- Story: D8 (both), D4 (SCRUM-113). No D8 feature spec exists; the big picture is
  `../../../specs/roadmap.md` → W8 group 1 and Break group 7, and the ticket texts in
  `../jira/jira-split-scrum-93.md` (B) and `../jira/jira-new-review-choose-submission.md`.
- Base: `origin/main` `e367ebd` — PR #33, #34 and #35 are merged, so the API side is complete.
- Neighbour: SCRUM-93 (Kanishka, the available-work list) has no code pushed yet. It owns the new
  `lib/api/work-queues.ts`; these two tickets own `components/task-item-workspace-sheet.tsx`,
  `lib/task-workspace-data.ts` and `lib/api/task-items.ts`.

## Decisions (2026-09-29, Hanchen)

| # | Decision |
| --- | --- |
| 1 | **Two stacked PRs.** `CS57-Hanchen-scrum-114` from `main`; `CS57-Hanchen-scrum-113` branched from it, PR based on the 114 branch and retargeted to `main` once #114 merges |
| 2 | **SCRUM-113 reads the review queue itself.** The panel calls `GET /tasks/{task_id}/work-queue/review` and takes its item's row, through a helper in `lib/api/task-items.ts`. No wait on SCRUM-93; once the list lands it may pass the ids in instead |
| 3 | **The review-data switch is split across the tickets.** SCRUM-114 keeps peers' drafts out of the **Annotate** tab only; the Review tab keeps today's data path. SCRUM-113 moves the Review tab onto the adjustment read, then deletes the "someone else's draft" fallback |

## What the code does today (checked on `e367ebd`)

- `selectDraftForViewer` (`lib/task-workspace-data.ts`): mine submitted → mine pending → unclaimed →
  **someone else's**, the last marked `draftIsReadOnly`. The Review tab depends on that fallback:
  `reviewPayloadText` and `buildReviewFinalPayload` read `item.draftPayloadText`.
- Who gets peers' drafts from the API (`AnnotationService.should_hide_other_annotators`): anyone with
  `GovernedAction.REVIEW` sees them all; an annotator without it sees none until they have submitted.
  So the fallback reaches the Annotate tab only for someone who can both review and annotate — an
  admin, or a reviewer who also annotates. That is the case SCRUM-114 bullet 3 closes.
- Machine output and unclaimed placeholders are not peer work (`is_peer_work`); an AI draft
  (`created_by` NULL) is taken as unclaimed, so "own". PR #35 routes an AI-annotated item to review and
  refuses a person's submission on it (409), so the panel's job there is only to show the refusal.
- **S10, cause 1:** the "mine" branch prefers the viewer's submitted draft over their pending one.
- **S10, cause 2:** the editor's initialising effect (`task-item-workspace-sheet.tsx`, the effect over
  `[item, isTextSpanWorkspace]`) re-runs on every new `item` object. `task-workbench.tsx` hydrates drafts
  **asynchronously** and replaces each item with a new object of the same id, and `onItemUpdated`
  replaces it again after a save. **Keying the effect on `item.id` alone would miss drafts that
  arrive after the panel opens.** Re-initialise when the id changes, or when the editor has no unsaved
  changes (`hasUnsavedChanges` already exists).
- Refusals: `submitTaskItem` returns the submit error, `parseApiErrorMessage` (`lib/api/client.ts`)
  surfaces FastAPI's `detail`, and the sheet shows `result.error.message` without transitioning. Likely
  already correct — needs a test, not necessarily code.
- Four places hydrate drafts through `applyApiDraftsToMockItem`: `task-workbench.tsx`,
  `task-annotation-workspace-with-real-data.tsx`, `use-hydrated-task-items.ts`, `live-task-workspace.ts`.
  Changing the function changes all four — intended.

---

## SCRUM-114 — branch `CS57-Hanchen-scrum-114` (from `main`)

### Commit 1 — `fix(web): prefer the viewer's pending draft on rework (SCRUM-114)`

- `lib/task-workspace-data.ts` → `selectDraftForViewer`: among the viewer's own drafts, a pending draft
  with meaningful data wins over a submitted one. On a returned or rejected item the viewer has both,
  and the pending one is the rework in progress.
- Tests, `lib/task-workspace-data.test.ts`:
  - **proves the fix (red before):** own submitted + own pending (meaningful) → the pending one is
    selected, and `draftPayloadText` is the pending text;
  - **guard (green both ways):** own submitted + own empty pending placeholder → still the submitted one.

### Commit 2 — `fix(web): keep unsaved typing when the item re-renders (SCRUM-114)`

- `components/task-item-workspace-sheet.tsx`: the initialising effect resets the editor only when
  `item.id` changes, or when the editor is not dirty. Track the last initialised id in a ref and read
  dirtiness from the baseline signature, so the async hydration still fills an untouched editor.
- Tests, `components/task-item-workspace-sheet.test.tsx`:
  - **proves the fix:** type in the editor, rerender with a new item object of the same id → the typed
    text stays; click Save draft → the request carries the typed text (the S10 symptom);
  - **guard:** rerender with a hydrated item before any typing → the editor shows the hydrated draft;
    switch to another item id → the editor resets.

### Commit 3 — `feat(web): an annotator never sees a peer's draft in the Annotate tab (SCRUM-114)`

- `components/task-item-workspace-sheet.tsx`:
  - remove the "X is annotating this item" block and `draftBelongsToSomeoneElse` from
    `annotateDisabled` — several annotators per item is the rule;
  - when the hydrated draft is not the viewer's (`draftIsReadOnly`), the Annotate editor starts
    empty. Every initialiser — output text, notes, text spans, image boxes, audio segments — reads
    from one annotate source (the item with its draft fields cleared) so none of them leaks the peer's
    answer.
- `lib/task-workspace-data.ts`: keep the fallback for now (decision 3); update its comment to say it
  feeds the Review tab only and goes in SCRUM-113.
- `lib/domain/task-types.ts`: the comment on `draftIsReadOnly` only, if the meaning changes. That file
  is outside the ticket's three files but not SCRUM-93's either.
- Tests: rewrite the `read-only draft held by another annotator` block — a viewer holding no draft on an
  item with a colleague's submission sees an empty, editable editor and no banner; Save draft creates
  the viewer's own draft (`POST /task-items/{id}/drafts`), never a PATCH of the colleague's.

### Commit 4 — `test(web): show the API's refusals on submit in its own words (SCRUM-114)`

- `lib/api/task-items.test.ts` and the sheet test: a 409 on `POST /drafts/{id}/submit` with the full-item
  detail ("Human annotation submission limit reached for this item (2/2).") and with the AI-assisted
  refusal → the feedback shows the detail word for word; `onItemUpdated` and `onActionComplete` are
  not called; the item does not become `submitted`.
- If the test shows a gap, fix it in `task-items.ts` / the sheet in the same commit and retitle it
  `fix(web): …`. Known effect, not a bug: the refused submit leaves the viewer's pending draft behind
  (`working_count` counts it) — say so in the PR's known limitations.

### Then

- `npm run check` (all of `test:api`, `test:web`, `typecheck:web`, `lint:web`).
- `../tests/manual-test-SCRUM-114.md` — two browsers; set up a 2-annotator item with
  `../scripts/sandbox-SCRUM-48.py`. Parts: S10 with a **reload** step (return an item, edit, Save draft,
  reload, the edit is there, submit); a reviewer-annotator opens an item a colleague submitted and sees
  an empty editor; a third submission on a full item shows the 409 text and stays unsubmitted.
- PR into `main`; log it in the tracker when opened; SCRUM-114 → In Review.

---

## SCRUM-113 — branch `CS57-Hanchen-scrum-113` (from `CS57-Hanchen-scrum-114`)

**Check first:** the adjustment read's `last_submitted_payload` is `annotation_data` as a preview dict,
while the Review tab today starts from the draft's `output_text`. Compare the two shapes for a text,
a text-span and a judgement item before commit 2, so `reviewPayload` starts from the same text as now.

### Commit 1 — `feat(web): read an item's submissions awaiting review (SCRUM-113)`

- `lib/api/task-items.ts`: `ApiWorkQueueItem` (the `WorkQueueItemRead` fields the panel needs) and
  `getAwaitingReviewAnnotationIds(taskId, itemId)` → `GET /tasks/{task_id}/work-queue/review`, the
  row whose `id` is the item, its `awaiting_review_annotation_ids`; an absent row gives `[]`. Once
  SCRUM-93's `work-queues.ts` lands, move the type there instead of keeping two.
- Test in `lib/api/task-items.test.ts`: finds the right row; no row → `[]`; an API error stays an error.

### Commit 2 — `feat(web): the reviewer chooses which submission to review (SCRUM-113)`

- `components/task-item-workspace-sheet.tsx`, Review tab:
  - load the awaiting ids when the Review tab opens; selected id = the hydrated `draftAnnotationId`
    when it is awaiting, else the first;
  - load the selected submission with `getTaskItemAdjustment(task.id, item.id, selectedId)` and start
    `reviewPayload` / `reviewVerdict` from its `last_submitted_payload`, showing `annotated_by_name` and
    its own latest review;
  - a chooser (the `packages/ui` Select or Tabs primitive, no hand-rolled control) when there are two or
    more, labelled by author, and fetching each label from the adjustment read is fine at this size;
  - the decision sends the selected id as `annotation_id` instead of `item.draftAnnotationId`;
  - an empty awaiting list: the Review tab says nothing awaits this reviewer, and the decision buttons
    are disabled — the API refuses anyway (PR #35, and SCRUM-116 in the break).
- The Annotate tab's own adjustment effect (reviewer feedback on the annotator's submission) is not
  changed.

### Commit 3 — `feat(web): move to the next awaiting submission after a decision (SCRUM-113)`

- After a successful decision, reload the awaiting ids: another one left → select it, reset the review
  form, say which submission is next; none left → today's behaviour (`completeAction`, or the
  `awaiting_other_submissions` message).
- The ticket's web test: an item with two awaiting submissions; the reviewer selects the second and
  accepts → the `review-actions` request carries the second id; then the panel shows the first.

### Commit 4 — `refactor(web): drop the fallback to someone else's draft (SCRUM-113)`

- `lib/task-workspace-data.ts`: `selectDraftForViewer` returns only the viewer's own or an unclaimed
  draft; remove `draftIsReadOnly` and its uses. Update the tests that expected the fallback.
- Check `task-item-table.tsx`, which shows `draftOwnerName` in the list: after this, a reviewer's list
  no longer names the annotator from the fallback. Keep that change out of this PR if it would touch
  SCRUM-93's screen; record it for Kanishka instead.

### Then

- `npm run check`; `../tests/manual-test-SCRUM-113.md` — a 2-annotator item, both submitted; the reviewer
  picks the second submission, returns it, is moved to the first and accepts it; **reload** and check
  each decision landed on its own submission (the helper script shows reviews per submission).
- PR based on `CS57-Hanchen-scrum-114`, retargeted to `main` after #114 merges; log it; SCRUM-113 →
  In Review.

## Docs sync

Front end only, no API, state or schema change, so no `hej/docs` update is needed. If commit 2 relies
on an adjustment-read detail that `api_surfaces.md` does not state, add it there in the same commit.

## Not in these tickets

- The available-work list, progress and rework marking — SCRUM-93 (Kanishka).
- Refusing a decision on a submission not awaiting the caller — SCRUM-116 (break, Hanchen), API side.
- Who may resubmit — SCRUM-117 (break, Hanchen).
