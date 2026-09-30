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
| 3 | **The review-data switch is split across the tickets.** SCRUM-114 keeps peers' drafts out of the **Annotate and Details** tabs; the Review tab keeps today's data path. SCRUM-113 moves the Review tab onto the adjustment read, then deletes the "someone else's draft" fallback |
| 4 | **SCRUM-114 comes first.** If SCRUM-113 cannot be opened for review by the Wednesday meeting, it goes back to the break and only SCRUM-114 counts for W8 |
| 5 | **The screens as drawn** on the design canvas (<https://claude.ai/artifact/JrTWfhAmAyRJKUEwJsveYP>, confirmed 2026-09-29): a viewer with no verdict of their own sees **"No verdict yet"** as the Details tab's "Latest output" (today's fallback would print `unknown`); SCRUM-113's chooser is a **row of buttons labelled by author** above the two Review columns, not a Select. The empty-state, disputed and error copy is as drawn, the 403 text being the API's own. An empty "Judgement lineage" keeps today's behaviour (no rows, no copy) |

**Board follow-up for decision 2:** SCRUM-113's description still says "Blocked by SCRUM-93", and the board
still links it as blocked by SCRUM-93. Change the line to "Reads the review queue itself; SCRUM-93's list may
pass the ids in later", and remove the link. The link to SCRUM-114 stays.

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
- **The fallback reaches more than the editor.** When the hydrated draft is a peer's, the colleague's work
  shows in at least five places outside the Review tab:
  - the Annotate tab's adjustment effect (the effect over `[task.id, item]`) reads
    `getTaskItemAdjustment(…, item.draftAnnotationId)`, which is then the **peer's** annotation, and shows its
    `reviewer_note` in the "Reviewer feedback" box, so the viewer sees the review of a colleague's work;
  - the Details tab's `judgementStages` show `item.draftVerdict` / `draftRationale` as "Draft verdict";
  - the Details tab's "Latest output" (`:1826`) shows `judgementValue` on a judgement item that is not
    approved. `getJudgementDisplayValue` (`lib/task-format.ts:43`) falls back canonicalVerdict →
    reviewDecision → **draftVerdict**, so with no review yet it is the colleague's verdict;
  - the Details tab's rationale (`:1915`) shows `judgementRationale`, and `getJudgementRationale`
    (`lib/task-format.ts:59`) falls back to **draftRationale**;
  - `judgementValue`, `judgementSignal` and `judgementRationale` are derived once from `item` (`:1196`) and
    used in two tabs: Details (`:1826`–`:1835`, `:1915`) and the Annotate tab's confidence line (`:2157`),
    but also the **Review** tab's "Proposed verdict" (`:2868`–`:2873`, inside the Review `TabsContent`,
    `:2776`–`:3473`). There a reviewer is meant to see the colleague's verdict — it is what they review.
- **Dropping the fallback alone does not stop the "Reviewer feedback" leak.** With no draft of their own, a
  viewer's `draftAnnotationId` is undefined, and the effect sends `annotation_id=null`. The adjustment read
  then shows the most recent annotation the caller may see (`visible[0]`, `review_actions.py:527`–`:534`).
  Someone with `REVIEW` may see every submission, so that is the colleague's again.
- The same initialising effect also resets the **Review** form (`reviewVerdict`, `reviewPayload`,
  `reviewJustification`, `reviewFeedback`). `hasUnsavedChanges` only measures the Annotate editor, so a
  reviewer's half-typed justification is lost on the same re-renders. Not part of S10; SCRUM-113 fixes it.
- `findPendingDraft` (`lib/api/task-items.ts`) saves into the viewer's own pending draft, else **claims the
  unclaimed placeholder** that dataset intake creates per item, else creates one.
- Refusals: `submitTaskItem` returns the submit error, `parseApiErrorMessage` (`lib/api/client.ts`)
  surfaces FastAPI's `detail`, and the sheet shows `result.error.message` without transitioning. Likely
  already correct — needs a test, not necessarily code.
- **Who calls the two lib files** (checked 2026-09-29). `selectDraftForViewer` has no caller outside its
  file; it acts only through `applyApiDraftsToMockItem`, which four places call:

  | Caller | Reaches |
  | --- | --- |
  | `components/task-workbench.tsx` | `/tasks/[taskId]/review` |
  | `components/task-annotation-workspace-with-real-data.tsx` | `/tasks/[taskId]/annotate` |
  | `lib/live-task-workspace.ts` | the whole task workspace: `app/tasks/[taskId]/layout.tsx` → `use-live-task-workspace` → `task-workspace-client-shell`, including `/items` (`task-items-board`) |
  | `components/use-hydrated-task-items.ts` | nothing — no file imports it (dead code; mention in the PR, do not delete here) |

  So a change to draft selection reaches the panel on the **annotate, review and items** pages — intended,
  and each manual test covers all three. `lib/api/task-items.ts`: `saveDraft` and `submitTaskItem` are
  called only through `lib/task-item-actions.ts`, from the sheet alone. (Corrected at commit 4:
  `hooks/use-task-item-workspace-sync.ts` imports only a type from it; it handles the panel's
  `onItemUpdated` / `onActionComplete` after a success, so a refusal must fire neither.)
  `review-actions.ts` and `status-mapping.ts` import only its types; `project-data.ts` only `listTaskItems`.
- **Resubmitting a returned item leaves a pending draft behind.** Save draft on a returned item creates a
  pending draft; Submit then passes `forceCreatePending` (`RESUBMIT_STATUSES` in `task-items.ts`), creates
  **another** draft and submits that. The saved one stays pending with content, and `working_count` counts
  it. Not fixed here (known limitation in the PR; the resubmission rules are SCRUM-117's); commit 1's rule
  must not show it.

---

## SCRUM-114 — branch `CS57-Hanchen-scrum-114` (from `main`)

### Commit 1 — `fix(web): show the viewer's latest own draft on rework (SCRUM-114)` — done 2026-09-29

- `lib/task-workspace-data.ts` → `selectDraftForViewer`: among the viewer's own drafts, the one they
  **last acted on** wins — a submitted draft by `submitted_at`, a pending one (with meaningful data) by
  `updated_at`, falling back to `created_at`; on a tie the submitted one, as before. New helpers
  `draftActivityTime` and `latestOwnDraft`.
- **Changed from the first version of this plan** ("a pending draft always wins"): that would show the
  pending draft left behind by a resubmission (above) instead of the newer submission, and drop its
  `annotation_id`. Pending uses `updated_at`, not `created_at`, because Save draft reuses the viewer's own
  pending draft, which can predate the latest submission.
- Tests, `lib/task-workspace-data.test.ts`, block `selectDraftForViewer keeps the viewer's rework in
  progress (S10)`:
  - **proves the fix (red before, 3):** the rework is selected over the earlier submission; hydration puts
    the rework's text in `draftPayloadText`; a pending draft edited after a later submission wins;
  - **guards (green both ways, 2):** the resubmission wins over the pending draft saved before it; an empty
    pending placeholder newer than the submission does not count.
- Result: 38/38 in the file, 255/255 web tests, `tsc --noEmit` and eslint clean.

### Commit 2 — `fix(web): keep the annotator's unsaved typing when the panel re-renders (SCRUM-114)` — done 2026-09-29 (`1f80a25`)

**As built.** Two refs, `initialisedItemIdRef` and `hasUnsavedChangesRef`; the initialising effect returns
early for the same item while it is dirty. The ref is synced by a small effect declared **after** the
initialising one, so that effect reads the dirtiness from before the new item object arrived.

**Found while building, and fixed in the same commit:** `hasUnsavedChanges` was always true. The baseline
was rebuilt from the item (`buildAnnotationSignatureFromItem`) in a shape the editor never produced — no
`spans` key, no default audio segment — so every opened item counted as unsaved. Visible before this
ticket as a `beforeunload` "leave page?" warning after merely opening an item; with the new guard it
would also have blocked late drafts. The baseline is now read back from the editor on the render after it
is filled (`baselinePending`, set during render — React's pattern for adjusting state from the previous
render), and the item-based builder is deleted. **Behaviour change for the PR:** opening an item without
editing no longer warns on leaving the page.

Tests: 4 in `keeps unsaved typing across re-renders (S10)` plus 2 on `beforeunload` — 3 red on the old
sheet (typing survives a re-render; Save draft sends it; an opened item is not unsaved), 3 guards (a late
draft still fills an untouched editor; another item resets it; typing still warns). Checked by putting
`HEAD`'s sheet back temporarily. 41/41 in the file, 261/261 web.

*Original plan:*
- `components/task-item-workspace-sheet.tsx`: the initialising effect resets the editor only when
  `item.id` changes, or when the editor is not dirty. Track the last initialised id in a ref and read
  dirtiness from the baseline signature, so the async hydration still fills an untouched editor.
- Tests, `components/task-item-workspace-sheet.test.tsx`:
  - **proves the fix:** type in the editor, rerender with a new item object of the same id → the typed
    text stays; click Save draft → the request carries the typed text (the S10 symptom);
  - **guard:** rerender with a hydrated item before any typing → the editor shows the hydrated draft;
    switch to another item id → the editor resets.
- The Review form is still reset by the same effect. Leave it: SCRUM-113 commit 2 gives the Review form its
  own initialisation.

### Commit 3 — `fix(web): keep a colleague's draft out of the Annotate and Details tabs (SCRUM-114)` — done 2026-09-29 (`585be0b`)

**As built**, four files. `withoutColleaguesDraft(item)` (module level) clears every `draft*` field plus
`candidateOutput` and `candidateRationale` — hydration derives those from the same draft when it carries
AI metadata. The component keeps `viewerItem` (memo) and a non-null `viewer`; the Annotate and Details
tabs read only those, the Review tab reads `item`. Judgement display values are derived twice
(`judgementValue`… from the viewer, `reviewJudgement` from the item). The adjustment effect runs only with
`ownAnnotationId`. Beyond the plan: **the `nextItem` handed to `onItemUpdated` after a save is built on
`viewer`**, otherwise the colleague's `draftIsReadOnly` and `annotation_id` ride along and the next re-fill
would clear what was just saved. Comments updated in `lib/task-workspace-data.ts` (level 3 of
`selectDraftForViewer` serves the Review tab only) and `lib/domain/task-types.ts` (`draftIsReadOnly`).

Tests: the `read-only draft held by another annotator` block replaced by `keeps a colleague's draft out of
Annotate and Details` — 6 red before (empty editable editor, no notice; Save draft sends the viewer's
answer; no adjustment request with the colleague's id; none with no id; the judge editor and Item details
free of the colleague's verdict, "No verdict yet"), 5 guards (Review tab still shows the colleague's
verdict; own feedback still read with `ann_mine`; no status block; the two kept from the old block).
Save draft never writing a colleague's draft is already covered by five tests in `lib/api/task-items.test.ts`.
47/47 in the file, 267/267 web.

**Left for SCRUM-113 commit 4 (known limitation in the PR):** when the colleague's draft carries AI
metadata, hydration has already overwritten `aiLabel` and `confidence` from it, and the panel cannot
restore them. Removing the fallback removes this.

*Original plan:*

- `components/task-item-workspace-sheet.tsx`:
  - remove the "X is annotating this item" block and `draftBelongsToSomeoneElse` from
    `annotateDisabled` — several annotators per item is the rule;
  - **one viewer's item instead of a guard per read.** Compute, in one place, `viewerItem`: the item
    itself when the draft is the viewer's, and the item with every draft-derived field cleared when
    `draftIsReadOnly` (`draftPayloadText`, `draftAnnotationData`, `draftVerdict`, `draftRationale`,
    `draftNotes`, `draftAnnotationId`, `draftOwnerName`). The **Annotate and Details tabs read only
    `viewerItem`**: every editor initialiser (output text, notes, text spans, image boxes, audio
    segments), `judgementStages`, "Latest output" and the rationale. **Only the Review tab reads `item`.**
    A read added later to Annotate or Details cannot leak without going out of its way;
  - derive the judgement display values **twice**: once from `viewerItem` for Details and Annotate, once
    from `item` for the Review tab's "Proposed verdict" (`:2868`–`:2873`). Deriving them only from
    `viewerItem` would blank the verdict a reviewer is reviewing on a judgement task;
  - the Annotate tab's adjustment effect reads `viewerItem` and **runs only when it carries a
    `draftAnnotationId`**, meaning a submission of the viewer's own (or an unclaimed one). Never with
    `annotation_id=null`, which returns a colleague's annotation to a reviewer (see above);
  - "Latest output" in Details shows **"No verdict yet"** when the viewer item has no verdict at all
    (decision 5), instead of the `aiLabel` fallback's `unknown`. An AI candidate or a review decision
    still shows as today;
  - with these, ticket bullet 3 ("must not show another person's draft, read-only or otherwise") holds
    everywhere except the Review tab, where a reviewer is meant to see it until SCRUM-113 replaces the
    source.
- `lib/task-workspace-data.ts`: keep the fallback for now (decision 3); update its comment to say it
  feeds the Review tab only and goes in SCRUM-113.
- `lib/domain/task-types.ts`: the comment on `draftIsReadOnly` only, if the meaning changes. That file
  is outside the ticket's three files but not SCRUM-93's either.
- Tests: rewrite the `read-only draft held by another annotator` block — a viewer holding no draft on an
  item with a colleague's submission:
  - sees an empty, editable editor and no banner;
  - sees no "Reviewer feedback", and **no adjustment request goes out at all** from the Annotate tab
    (neither with the colleague's annotation id nor with none);
  - on a judgement task with no review yet, the colleague's verdict and rationale appear nowhere in the
    Details or Annotate tab: not as "Draft verdict", "Latest output" or the rationale. Assert on the
    colleague's text being absent from both tabs, not on each element, so a new element is covered too;
    "Latest output" reads "No verdict yet";
  - the Review tab still shows the colleague's submission (decision 3) — on a judgement task, its
    "Proposed verdict" and rationale are the colleague's (guard, green both ways);
  - Save draft never PATCHes the colleague's draft. Without an unclaimed placeholder in the fixture it is a
    `POST /task-items/{id}/drafts`; with one, PATCHing the placeholder is correct (`findPendingDraft`).
    Test both.

### Commit 4 — `test(web): show the API's refusals on submit in its own words (SCRUM-114)`

- `lib/api/task-items.test.ts` and the sheet test: a 409 on `POST /drafts/{id}/submit` with the full-item
  detail ("Human annotation submission limit reached for this item (2/2).") and with the AI-assisted
  refusal → the feedback shows the detail word for word; `onItemUpdated` and `onActionComplete` are
  not called; the item does not become `submitted`.
- If the test shows a gap, fix it in `task-items.ts` / the sheet in the same commit and retitle it
  `fix(web): …`. Known effect, not a bug: the refused submit leaves the viewer's pending draft behind
  (`working_count` counts it) — say so in the PR's known limitations.
- **Done 2026-09-29 (`1850564`).** As predicted, test-only: the sheet tests pass on the unchanged panel, so
  they were checked by breaking it (a paraphrased reason; carrying on after the error) — both fail. Plus a new
  `lib/api/client.test.ts`: `parseApiErrorMessage` had no tests (detail verbatim, validation list, plain
  text, empty body, a 409 through `apiClient`). 274 web.

### Commit 5 — `fix(web): keep the panel's message while the same item re-renders (SCRUM-114)` — done 2026-09-29 (`0920587`)

Not in the first plan; found in the walkthrough, step 1.4: "Draft saved." showed for one frame. After a
save the list hands back the same item as a new object and the initialising effect cleared the message on
every one (pre-existing; commit 2 did not cause it). Now only another item's opening clears it. Tests: one
red before (the message survives the hand-back), one guard (another item clears it). A repro mounting the
real `TaskAnnotationWorkspace` through the cache patch and re-hydration confirmed the fix on the annotate
page; the flicker seen again on step 2.1 was a stale browser bundle. 276 web.

### Then — done 2026-09-29

`npm run check`: backend 678 passed, 6 skipped; web 276; `tsc` clean; eslint 0 errors. Walkthrough Parts 1–6
passed (`../tests/manual-test-SCRUM-114.md` → Results). PR description:
`../../../reviews/W8/pr-cs57-hanchen-scrum-114-panel.md`. **Opened as PR #43** (2026-09-29), reviewers Kanishka and Jingwei.

*Original list:*

- `npm run check` (all of `test:api`, `test:web`, `typecheck:web`, `lint:web`).
- `../tests/manual-test-SCRUM-114.md` — two browsers; set up a 2-annotator item with
  `../scripts/sandbox-SCRUM-48.py`. Parts: S10 with a **reload** step (return an item, edit, Save draft,
  reload, the edit is there, submit); a reviewer-annotator opens an item a colleague submitted and sees
  an empty editor, no "Reviewer feedback" (return the colleague's submission first, so there is some to
  leak) and, on a judgement task, the colleague's verdict and rationale nowhere in Details or Annotate
  (only in Review); a third submission on a full item shows the 409 text and stays unsubmitted.
  Open the panel from **each page that hydrates drafts** — `/annotate`, `/review` and `/items` — at least
  for the S10 and no-peer parts, since all three go through `applyApiDraftsToMockItem` by different code.
- PR into `main`; log it in the tracker when opened; SCRUM-114 → In Review. PR notes: the pending draft a
  resubmission leaves behind, legacy drafts without `annotation_id` losing reviewer feedback,
  `use-hydrated-task-items.ts` being unused, `aiLabel`/`confidence` from a colleague's AI-edited draft
  (until SCRUM-113 commit 4), and — as a behaviour change, not a limitation — no "leave page?" warning
  after only opening an item.

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
  - load the selected submission with `getTaskItemAdjustment(task.id, item.id, selectedId)`, showing
    `annotated_by_name` and its own latest review;
  - **every** Review-tab read of the item's draft moves to the selected submission, not only the form:
    `reviewPayloadText` and its invalid-JSON check, the payload preview's `payloadText` and `notes` props,
    and `buildReviewFinalPayload`. Otherwise commit 4 leaves them empty for a reviewer with no draft of
    their own. Grep the Review tab for `draftPayloadText`, `draftNotes`, `draftVerdict` and
    `draftRationale` before commit 4; none should remain;
  - move the Review form's initialisation (`reviewVerdict`, `reviewPayload`, `reviewJustification`,
    `reviewFeedback`) out of the shared initialising effect into its own, keyed on `item.id` and the
    selected annotation id, so async hydration no longer wipes a half-typed justification. Test it: type a
    justification, rerender with a new item object of the same id → the text stays;
  - a chooser above the two Review columns (decision 5, canvas board "113 · Review — choose a
    submission"): "Submissions awaiting your review", the count on this item, and one button per awaiting
    submission labelled by its author, the selected one pressed (`aria-pressed`). Use the `packages/ui`
    `Button`, not a hand-rolled control. Fetching each label from the adjustment read is fine at this size.
    Show it with one submission too, so the reviewer sees whose work it is;
  - the decision sends the selected id as `annotation_id` instead of `item.draftAnnotationId`;
  - a failed queue read is not an empty list: `work-queue/review` requires `REVIEW`, so a viewer without
    it gets 403. Show the API's error in the Review tab (commit 1 keeps it as an error) and disable the
    decision buttons; do not say "nothing awaits you". Test both cases;
  - an empty awaiting list: the Review tab says nothing awaits this reviewer, and the decision buttons
    are disabled. Until SCRUM-116 (break) lands, these disabled buttons are the only guard: today's API
    does not refuse a decision on a submission that is not awaiting the caller.
  - Behaviour change for the PR description: the Review tab acts only on what the review queue offers.
    `REVIEW_ALLOWED` is `submitted`, `disputed` and `approved`, and the review queue leaves out
    `disputed` and `canonicalized` items (`approved` in the UI), so on both the decision buttons are now
    disabled, where today's panel still acts on them. Both are intended: a disputed item belongs to the
    dispute desk, and on a canonicalized item it closes in the UI what SCRUM-116 closes in the API (a
    reject on a finalised item's approved submission reopens the item).
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
  draft; remove `draftIsReadOnly` and its uses. `viewerItem` then equals `item`, so the clearing can go,
  but **keep the adjustment effect's condition** (run only with a `draftAnnotationId`): without the
  fallback, a reviewer with no draft of their own has no id, and a request with `annotation_id=null`
  would show them the colleague's latest review again. Keep SCRUM-114's leak tests; they must stay green.
  Update the tests that expected the fallback.
- Check `task-item-table.tsx`, which shows `draftOwnerName` in the list: after this, a reviewer's list
  no longer names the annotator from the fallback. Keep that change out of this PR if it would touch
  SCRUM-93's screen; record it for Kanishka instead.

### Then

- `npm run check`; `../tests/manual-test-SCRUM-113.md` — a 2-annotator item, both submitted; the reviewer
  picks the second submission, returns it, is moved to the first and accepts it; **reload** and check
  each decision landed on its own submission (the helper script shows reviews per submission). Also from
  `/items`, not only `/review`, and the empty, disputed and 403 states against the canvas.
- PR based on `CS57-Hanchen-scrum-114`, retargeted to `main` after #114 merges; log it; SCRUM-113 →
  In Review.

## Docs sync

Front end only, no API, state or schema change, so no `hej/docs` update is needed. If commit 2 relies
on an adjustment-read detail that `api_surfaces.md` does not state, add it there in the same commit.

## Not in these tickets

- The available-work list, progress and rework marking — SCRUM-93 (Kanishka).
- Refusing a decision on a submission not awaiting the caller — SCRUM-116 (break, Hanchen), API side.
- Who may resubmit — SCRUM-117 (break, Hanchen).
