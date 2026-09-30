**Title:** `SCRUM-114: work panel — rework keeps its edits, colleagues' drafts stay out, refusals in the API's words (WEB)`

**Base:** `main` · **Head:** `CS57-Hanchen-scrum-114` · **Reviewers:** @kanishkakathait (SCRUM-93 opens items in this panel), @Jingwei-Lin (reviewed #35, which this builds on)

---

## Summary

SCRUM-114 (story D8), the item workspace panel's half of the old SCRUM-93, split on 26/09 so it and
Kanishka's available-work list do not touch the same files. Built on #35 (independence on reads, refusals on
submit). Web only: no API, state or schema change.

With several annotators per item (#33/#35), the panel still behaved as if one person worked an item:

- **S10.** On a returned item, Save draft reverted the editor to the returned answer and saved that. Found in
  SCRUM-26's walkthrough; it had two causes, fixed separately.
- **A colleague's draft.** Someone who can both annotate and review (the API shows them every draft) opened an
  item a colleague had submitted and got the colleague's answer read-only under "X is annotating this item",
  with annotation blocked, the colleague's verdict in Item details, and the reviewer feedback on the
  colleague's work. Annotators must not see each other's answers (client answer, 21/09).
- **Refusals.** The API refuses a submission on a full item, or a person's submission on an item the AI has
  annotated (409). The panel already showed the reason and did not report the item submitted, but nothing
  held it there.

Five commits, each one change, with its tests:

| Commit | What |
| --- | --- |
| `c07a171` | S10, cause 1: among the viewer's own drafts, show the one they last acted on |
| `1f80a25` | S10, cause 2: a re-render of the same item keeps unsaved typing; plus a truthful "unsaved" signal |
| `585be0b` | A colleague's draft stays out of the Annotate and Details tabs; the notice goes |
| `1850564` | Tests: the API's refusals are shown word for word and nothing is reported submitted |
| `0920587` | "Draft saved." no longer disappears within a frame (found in this PR's walkthrough) |

## Changes by layer

**`lib/task-workspace-data.ts`**
- `selectDraftForViewer`: among the viewer's own drafts, the one they last acted on wins — a submitted draft by
  `submitted_at`, a pending one (with content) by `updated_at`; on a tie the submitted one, as before. Status
  alone cannot decide: resubmitting a returned item creates and submits a fresh draft, so a draft saved before
  it stays pending behind the newer submission.
- The comment on its third level (someone else's draft) now says it serves the Review tab only.

**`components/task-item-workspace-sheet.tsx`**
- **The editor is re-filled only for another item, or while nothing is unsaved.** The parent hands the panel a
  new object for the same item whenever drafts hydrate, the list is patched or an action completes, and the
  initialising effect used to re-fill on every one. Keying on `item.id` alone would miss drafts that arrive
  after the panel opens, so two refs track the item last filled and whether the editor is dirty.
- **The "unsaved" baseline is read back from the editor.** It was rebuilt from the item in a shape the editor
  never produced (no `spans` key, no default audio segment), so every opened item counted as unsaved. It is
  now taken from the editor on the render after filling; `buildAnnotationSignatureFromItem` is removed.
- **A viewer's view of the item.** `withoutColleaguesDraft` clears a colleague's draft fields (and the
  candidate fields hydration derives from the same draft). The Annotate and Details tabs read that view; only
  the Review tab reads the item as hydrated, since a reviewer is judging that submission. Judgement display
  values are derived twice for the same reason.
- The "X is annotating this item" notice is removed; only the item's status blocks annotation.
- Reviewer feedback in the Annotate tab is read only with the viewer's own annotation id. Without one, the
  adjustment read returns the latest annotation the caller may see — a colleague's, for anyone who can review.
- Item details shows **"No verdict yet"** where the judgement fell through to the `"unknown"` placeholder.
- The `nextItem` handed back after a save is built on the viewer's view, so the colleague's read-only mark and
  annotation id do not ride along.
- The panel's message is cleared only when another item opens.

**`lib/domain/task-types.ts`**: the comment on `draftIsReadOnly`.

**Tests**: `task-item-workspace-sheet.test.tsx`, `task-workspace-data.test.ts`, and a new `lib/api/client.test.ts`
(`parseApiErrorMessage` had none).

## Decisions for review

- **The Review tab keeps today's data path for now.** A reviewer needs the colleague's submission there, and the
  panel still gets it through hydration's fallback. SCRUM-113 (stacked on this branch) moves the Review tab onto
  the submission it names (`GET …/adjustment?annotation_id=`), lets the reviewer choose among several, and
  removes the fallback.
- **Recency decides between a viewer's own drafts**, not status (above).
- **"No verdict yet"** replaces `unknown` in Item details when there is no verdict of any kind; a real AI label
  still shows.

## Behaviour changes

- Leaving the page no longer warns after merely opening an item; it warns once something is edited.
- A colleague's draft no longer blocks annotation: the viewer starts from an empty editor and saves into a
  draft of their own. The API already allowed this (one draft per annotator); the panel had not caught up.

## Testing

- `npm run check` on the branch: backend **678 passed, 6 skipped**; web **276 passed** (34 files); `tsc` clean;
  eslint **0 errors** — the 3 warnings in `task-item-workspace-sheet.tsx` are pre-existing.
- Each fix commit's new tests were run against the previous commit and fail there; the rest are guards that pass
  both ways. The commit messages say which.
- The refusal tests (`1850564`) pass on the unchanged panel — the behaviour was right, only unpinned — so they
  were checked by breaking the panel: they fail when the reason is paraphrased, and when the code carries on
  after the error.
- **Manual walkthrough done** (`docs/sandbox/W8/tests/manual-test-SCRUM-114.md`, two browsers, reloads, on
  `/annotate`, `/review` and `/items`): S10 across Save draft, reopen, reload and resubmission; an
  annotator-reviewer sees an empty editor and no feedback on a colleague's work while the Review tab still shows
  it; the 409 limit refusal word for word; the leave-page warning only after an edit; the AI-assisted refusal word for word. It found the vanishing
  "Draft saved.", fixed in `0920587`.
- Existing tests changed: the `read-only draft held by another annotator` block is replaced, because it pinned
  the notice and the read-only editor this PR removes. Its two status guards are kept.

## Notes for reviewers

- Read it commit by commit; each message says what was wrong and which tests fail before it.
- **PostgreSQL dev databases need `init_data.py --reset`** since #28 (`organization_users.invitation_expires_at`);
  without it every login is a 500. Not this PR's change, but you will hit it running this branch.
- For SCRUM-93: opening an item from the list needs nothing new — the panel takes the item as before.

## Known limitations

- **A resubmission leaves a pending draft behind.** Submitting on a returned item creates and submits a fresh
  draft (`forceCreatePending`), so a draft saved before it stays pending; so does the draft of a refused
  submission. `working_count` counts both. The panel no longer shows them. Who may resubmit is SCRUM-117's.
- **`aiLabel` and `confidence`** can still come from a colleague's draft when that draft carries AI metadata:
  hydration overwrites them before the panel sees the item. Removing the fallback in SCRUM-113 removes this.
- **Drafts submitted before SCRUM-26** have no `annotation_id`, so their authors no longer see reviewer feedback
  in the Annotate tab (the panel will not ask without an id).
- **A resubmission rewrites its annotation in place** (by design since #35), so the returned version survives
  only in the draft table, and the review that returned it now points at the new content. Seen in the
  walkthrough; a provenance question for F1/SCRUM-98 rather than this PR.
- `components/use-hydrated-task-items.ts` is imported nowhere. Left alone here.
