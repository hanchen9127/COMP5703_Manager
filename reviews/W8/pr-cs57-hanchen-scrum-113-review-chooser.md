**Title:** `SCRUM-113: the reviewer chooses which submission to review (WEB)`

**Base:** `CS57-Hanchen-scrum-114` (#43), retargeted to `main` once #43 merges · **Head:** `CS57-Hanchen-scrum-113` ·
**Reviewers:** @kanishkakathait, @Jingwei-Lin

---

## Summary

SCRUM-113 (stories D8, D4). **Stacked on #43** (SCRUM-114), because it edits the same work panel: this PR's diff
is its own five commits only. Web only: no API, state or schema change.

Since #35 an item holds one submission per annotator, each reviewed on its own, and the review queue knows which
of an item's submissions await the caller (`awaiting_review_annotation_ids`). The work panel's Review tab never
used that: it showed whichever draft hydration happened to hold, and a reviewer could not reach the others on the
same item. Hydration got that draft through a fallback to a colleague's draft, which also leaked a colleague's
name and answer into the item lists for anyone who can both annotate and review.

| Commit | What |
| --- | --- |
| `508d0c5` | `getAwaitingReviewAnnotationIds`: an item's submissions awaiting the caller, from the review queue |
| `b03f056` | Refactor: one function reads a submission's payload, for hydration and the Review tab alike |
| `6ec8854` | The Review tab: choose a submission, see its own answer, decide on it; the states where nothing can be decided |
| `a5413c2` | After a decision, move to the next awaiting submission instead of closing |
| `29ac0f0` | Drop hydration's fallback to a colleague's draft |

## Changes by layer

**`lib/api/task-items.ts`**
- `ApiWorkQueueItem` (the `WorkQueueItemRead` fields the panel reads) and `getAwaitingReviewAnnotationIds(taskId,
  itemId)`: reads `GET /tasks/{task_id}/work-queue/review`, returns the item's row's ids, `[]` when the queue
  leaves the item out, and **a failed read as a failure** — a caller without the review capability gets 403,
  which the panel must not show as "nothing awaits you". The type moves to SCRUM-93's `work-queues.ts` when
  that lands.

**`lib/task-workspace-data.ts`**
- `submissionFieldsFromDraftData(draftData, task, revisionNotes?)`: what `applyApiDraftsToMockItem` did after
  choosing a draft (answer, verdict, rationale, notes, AI candidate fields, AI run outcome). A submission's
  `annotation_data` is its draft's `draft_data`, copied at submit, and the adjustment read returns it as
  `last_submitted_payload` (checked on real data: identical), so the Review tab reads a submission exactly as
  hydration reads a draft. Pure refactor: the existing hydration tests are unchanged and pass.
- `selectDraftForViewer` returns only the viewer's own draft or an unclaimed one — never a colleague's — and
  `applyApiDraftsToMockItem` no longer marks anything read-only.

**`components/task-item-workspace-sheet.tsx`**, Review tab
- When it opens, it reads the queue and each awaiting submission's adjustment read (author, payload). The queue
  applies every rule about who may review what; the panel decides nothing itself.
- A row of buttons named by author chooses the submission (`aria-pressed`); the first is chosen by default.
- Everything the tab shows comes from the chosen submission (`reviewItem`): the answer, the proposed verdict,
  the payload preview and its invalid-JSON warning, the viewport. With none chosen it carries no submission.
- The decision is sent with the chosen submission's `annotation_id`.
- **Nothing to decide:** loading; the queue's error in the API's words; "No submission on this item awaits your
  review." (a disputed item: "decided from the dispute desk"); decision buttons disabled.
- **After a decision** the queue is read again: another awaiting submission → the panel moves to it ("Accepted.
  Next: Bob Brown's submission — 1 left to review on this item.") and stays open; none → as before. The one just
  decided is left out even if the queue still lists it.
- The Review form is filled when the item or the chosen submission changes, not on every new object for the
  same item, so a half-typed justification survives.
- The Annotate and Details tabs read the item itself again (SCRUM-114's viewer view is folded back); reviewer
  feedback there is still read only with the viewer's own annotation id.

**`lib/domain/task-types.ts`**: `draftIsReadOnly` removed; the draft fields' comment says what fills them.

## Decisions for review

- **The queue is the only source of "what may I review".** No rule is repeated in the panel. Until SCRUM-116 the
  API does not refuse a decision the queue would not offer, so the disabled buttons are the guard; **both Escalate
  buttons had no guard at all** and now do.
- **One data path for the Review tab.** The twelve existing Review tab tests were migrated to offer their
  submission through the (mocked) queue rather than keeping a fallback to the hydrated item.
- **Escalation does not move on:** an escalated item leaves the queue, so it finishes as before.

## Behaviour changes

- A disputed or approved item's Review tab offers no decision where the panel used to act on it: a disputed item
  belongs to the dispute desk, and on a finalised item this closes in the UI what SCRUM-116 closes in the API (a
  reject on an approved submission reopening the item).
- For a reviewer, the item lists' annotator column reads **"Unassigned"** on items only colleagues have drafts on,
  and the value column no longer shows a colleague's answer. That was the leak; the column meant "who holds the
  draft shown", and nobody else's draft is shown now.
- Choosing another submission refills the Review form: the form belongs to the submission on screen.

## Testing

- `npm run check` on the final tree: backend **678 passed, 6 skipped** (unchanged, web-only PR); web **299 passed**
  (34 files); `tsc` clean; eslint **0 errors** — the 3 warnings in `task-item-workspace-sheet.tsx` are
  pre-existing.
- Web tests: new ones for the queue read, the payload refactor (hydration puts exactly these fields on the item,
  for five payload shapes), the chooser (nine), moving on, and hydration without the fallback. Each feature
  commit's new tests fail on the commit before it; guards pass both ways.
- **Manual walkthrough done** (`docs/sandbox/W8/tests/manual-test-SCRUM-113.md`, two browsers, erin as reviewer):
  erin chooses between Charlie's and Dana's submissions, returns one and is moved to the other, and each decision
  lands on its own submission (checked through the API); the disputed and 403 states; frank no longer sees Dana's
  name or answer in the list; the same from `/items`.

## Notes for reviewers

- **Web container on Windows: restart it after every code change or branch switch** (`docker compose restart
  frontend`). It runs `next dev --turbopack`, and Turbopack does not see file changes on a Windows bind mount
  (`WATCHPACK_POLLING` only affects webpack), so a browser hard-reload keeps getting the old build. Found in this
  walkthrough. PostgreSQL dev databases still need the reset since #28.
- For SCRUM-93 (@kanishkakathait): the list can hand the panel nothing new; the Review tab reads the queue itself.
  When `work-queues.ts` lands, `ApiWorkQueueItem` should move there.

## Known limitations

- The annotator column's "Unassigned" wording (above) is the list's, not changed here; with several annotators per
  item it needs rethinking in SCRUM-93's list.
- Each awaiting submission costs one adjustment read when the Review tab opens. Items take a handful of
  submissions, so this is kept simple.

---

## Review round 1 — 2026-10-01

**On GitHub:** Kanishka requested changes (04:31 UTC); no other review yet. #44's base is still
`CS57-Hanchen-scrum-114` (#43, approved by Jingwei, not merged). Head now `76398ea`; once #43 merges, retarget #44
to `main`.

### Kanishka's point — a failed submission read was shown as an empty submission

`readAwaitingReview()` read the queue, then each submission's adjustment. A failed read still produced a submission
with `payload: null`, rendered through `payload ?? {}` as an empty form with Accept enabled — a decision could be
recorded against a real submission the reviewer never saw.

- **Decided (Hanchen):** the whole read fails, through the existing error box, rather than disabling only the
  failed submission; and a read that succeeds with `last_submitted_payload: null` counts as a failure too.
- **Fixed in `35f2da8`:** ready only when every offered submission is read with its answer; otherwise
  "Submission N of M: <API message>" or "Submission N of M has no submitted answer to show." `payload` is no longer
  nullable, so the `?? {}` fallback is gone. Two tests (a 404 read, a null payload) fail before the fix.
- Reply posted on the PR (06:35 UTC; the placeholder `<commit>` replaced with `35f2da8` at 06:40 UTC).

### From Jingwei's review of #43 — the Review tab hid work by item status

Checking Jingwei's point 2 on #44 (probe, not committed): a colleague's hydrated verdict no longer reaches the
Review tab at any status. But the probe found the reverse gap: the queue excludes only `canonicalized` and
`disputed`, and returning or rejecting one submission sets the whole item to `returned` / `rejected` while others
still await review — the tab then hid the chooser and disabled decisions while still showing the answer.

- **Fixed in `76398ea`:** `reviewDisabled` is true only when the item's status is not reviewable **and** the queue
  has come back empty. The queue decides what may be reviewed; the status only explains an empty queue. While
  the queue loads or fails, that is shown instead of the status notice. Tests: a `returned` and a `rejected` item
  with a submission on offer can be decided; a `returned` item with nothing on offer still shows its notice.
- Whether someone who reviewed an item may then annotate it (client Q4) stays with the API — said in the reply to
  Jingwei on #43.

### Merge of #43's fix into this branch — `77c0296`

#43 gained `ba0cc0f` (a real "unknown" verdict no longer shown as "No verdict yet", Jingwei's point 1). Merging
`CS57-Hanchen-scrum-114` into this branch needed three resolutions, two of which git did not flag:
- the judgement destructuring (this branch removed `viewerItem`, #43 removed `judgementValue`) — kept both removals;
- `latestJudgementOutput` came in as `viewer.*`, which no longer exists here — changed to `item.*` (found by `tsc`);
- #43's new test set `draftIsReadOnly`, removed from `MockTaskItem` on this branch — dropped (found by `tsc`).

### State after the round

- Web **305 passed** (34 files), `tsc` clean, eslint 0 errors (3 pre-existing warnings). Backend unchanged.
- Pushed: `35f2da8`, `77c0296`, `76398ea`. Awaiting Kanishka's re-review.
- Known limitation updated: one failed adjustment read now blocks the item's other submissions until the tab is
  reopened (the accepted cost of failing the whole read).
