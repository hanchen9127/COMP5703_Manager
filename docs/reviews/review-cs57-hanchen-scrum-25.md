# Code review — `CS57-Hanchen` evaluated against SCRUM-25

**Branch:** `CS57-Hanchen` · **Author:** Hanchen Wang · **Reviewed:** 2026-09-12
**Commits reviewed:**

| Commit | Date | Scope |
| --- | --- | --- |
| `469f850` — *fix: show and write only the signed-in annotator's own draft (D6)* | 2026-09-12 | 12 files, +462 / −66 — the frontend half |
| `a25d0ae` — *fix(api): enforce draft ownership on draft write paths (SCRUM-25)* | 2026-09-11 | 4 files, +447 / −18 — the backend guard |

**Evaluated against:** SCRUM-25 (story **D6** — "My unfinished work is mine"), defect **#6**
**Plan under review:** [`../plans/plan.md`](../plans/plan.md) Commits 1 / 1d / 1f

---

## Verdict

**Not fully complete.** The backend half is solid and closes D6 criteria 1–2. The frontend half has
the right design, but **is not wired into the two pages that actually run it** — so on the live
annotate page the fix is inverted: it locks annotators out of their *own* drafts. Criterion 3 and the
Docs Sync obligation (plan Commit 6) are also still open.

Recommend: fix the wiring before calling D6 done — it is a two-line change plus one type change, and
without it the story's user-visible behaviour is worse than before the commit.

### Test evidence (verified by re-running, not taken from the commit message)

| Check | Result |
| --- | --- |
| `apps/hej-api` — `.venv/Scripts/python -m pytest -q` | **163 passed**, 111 subtests, 0 failures |
| `apps/hej-web` — `npx vitest run` | **122 passed** / 16 files |
| `apps/hej-web` — `npx tsc --noEmit` | clean, exit 0 |
| Working tree / remote | clean; level with `origin/CS57-Hanchen` |

The claimed numbers are accurate. The suites are green *and* the bug below is live — see
[Why the tests and the walkthrough didn't catch it](#why-the-tests-and-the-walkthrough-didnt-catch-it).

---

## Blocking — the fix does not reach the live annotate and review pages

`applyApiDraftsToMockItem` gained a `viewerId` parameter **with a default of `null`**, and only two of
its four call sites were updated. The two that were missed are the reachable ones:

| Call site | Rendered by |
| --- | --- |
| `apps/hej-web/components/task-annotation-workspace-with-real-data.tsx:47` | `app/tasks/[taskId]/annotate/page.tsx` |
| `apps/hej-web/components/task-workbench.tsx:99` | `app/tasks/[taskId]/review/page.tsx` |

Both call it with three arguments, so `viewerId` falls back to `null`. With a null viewer,
`selectDraftForViewer` skips the `mine` branch entirely and falls through to the `other` branch — the
commit's own test pins exactly this behaviour:

> *"treats every draft as someone else's when the viewer is unknown"* — `lib/task-workspace-data.test.ts`

So **every claimed draft, including the signed-in annotator's own, is flagged
`draftIsReadOnly: true`.**

Worse, both components re-hydrate on mount *over* the items already hydrated correctly by
`fetchLiveTaskWorkspace` (which **was** updated), so the correct flags are computed and then
overwritten by the wrong ones.

**Verified directly** with a throwaway test calling it the way those two files do:

```ts
applyApiDraftsToMockItem(item, [aliceDraft /* created_by: ALICE */], "text")
// → draftIsReadOnly === true, draftOwnerName === "Alice Smith"   ✓ passed
```

**User-visible symptom:** Charlie saves a draft, reloads `/tasks/X/annotate`, and is met with
*"Read-only: Charlie Davis is annotating this item"* with **Save draft** and **Submit** both disabled.
The core annotate loop is dead from the second visit onward.

### Two contributing causes, both worth fixing with it

1. **`viewerId: number | null = null` should be required.** The default parameter is the only reason
   this typechecks. Drop it and `tsc` names both call sites immediately.
2. **The one hook that *was* threaded through is dead code.** `components/use-hydrated-task-items.ts`
   is imported nowhere — `grep` across the app returns no hits. Of the three hydration sites touched
   by the commit, one is unreachable and the two reachable ones were missed.

---

## "Read-only" is not actually read-only

`components/task-item-workspace-sheet.tsx` disables the action buttons and the structured annotators
(`TextSpanAnnotator` `:1928`, audio `:1946`) — but **not the plain text fields**:

| Field | Line |
| --- | --- |
| Verdict `Input` | `:1815` |
| Rationale `Textarea` | `:1819` |
| Notes `Textarea` | `:2041`, `:2104`, `:2163` |
| Image annotation output `Textarea` | `:2118` |

None of them take `disabled` or `readOnly`. A second annotator can type a full rationale into a held
item and only discover it is refused when both buttons turn out to be dead — the exact "inviting an
edit that will be rejected" the commit message says it removes.

`../plans/sandbox_scrum25_manual_test.md`'s look-before-saving step asserts the editor is **not
editable**. The code does not do this; the walkthrough passes because the tester only checks the
buttons.

---

## The disabled banner now blames the wrong thing

`task-item-workspace-sheet.tsx:1687` renders on `annotateDisabled`, which the commit widened to cover
ownership as well as status. On a `pending` item held by someone else it now reads:

> **This item cannot be annotated right now.** Current status: Pending.

None of its `submitted` / `approved` / `disputed` explanations apply, and it offers no action button.
The real reason sits in a separate amber note further down the panel.

**Fix:** gate that banner on `!canAnnotate(normalizedStatus)` alone and let the ownership note carry
the ownership case.

---

## Two selection rules that can disagree

The "which draft is mine" rule now exists twice, with different semantics:

| | Location | Meaningfulness filter |
| --- | --- | --- |
| Write path | `lib/api/task-items.ts:179` `findPendingDraft` | none |
| Display path | `lib/task-workspace-data.ts:291` `selectDraftForViewer` | requires `hasMeaningfulDraftData` |

If you own an *empty* pending draft while a colleague owns one with content, the display path flags
the item held and locks you out, while the write path would have PATCHed your own draft happily.

Having this rule in two modules is precisely why Commit 1d and Commit 1f were two separate bugs with
one root cause. Worth collapsing to a single exported predicate before the next person edits one of
them.

**Minor, same file:** `meaningful()` at `task-workspace-data.ts:294` tests `status === "submitted"`,
but its only call site has already filtered to `pending` — dead branch.

---

## Smaller notes

- **N+1 on draft listing.** `_to_draft_read` resolves the `created_by_user` relationship per draft
  with no eager load, and the web app already calls `listDraftsForTaskItem` once per item. Fine at
  project scale; worth knowing before the item counts grow.
- **Name disclosure widened.** `list_drafts` now returns colleague display names to any org member.
  Deliberate — the docstring says so — but it widens what an annotator can see, and bears on RQ-607
  (annotator data isolation), which `plan.md` already flags as a known gap.
- **Annotator column is on by default.** It went into `TaskItemTable`'s default column list, so all
  three consumers (`task-annotation-workspace`, `task-items-board`, `task-workbench`) get it. With
  `table-fixed`, the declared widths now total ~65rem — check it at narrow viewport widths.

---

## What is genuinely good here

- **The backend guard is the right shape.** `verify_user_owns_draft` is a *separate* helper rather
  than a change to `verify_user_draft_access`, so `get_draft` and `approve_draft` keep working on
  another member's draft by design — and there are explicit regression tests for both.
- **Claim-on-first-write is correctly placed** in the service, folded into the existing update rather
  than issued as a second write. That keeps the later atomicity work (SCRUM-26) simple, and it fixes
  a real second bug: without it, `_create_annotation_from_draft` stamps `created_by = NULL` and
  `assert_not_self_approval` is inert platform-wide.
- **Ordering the ownership check after the capability check** is the more actionable failure — a user
  failing both is told about the role.
- **Test quality.** 12 backend tests over real SQLite with three real users, covering refusal on all
  three write paths, the author's own success path, the reviewer read/approve regression, and the
  claim rules. Plus 14 new web tests. Each half was verified to fail before the fix.

---

## Ticket status against the story

| D6 item | State |
| --- | --- |
| Criterion 1 — only the author can edit / delete / submit | ✅ backend — `drafts.py:177`, `:205`, `:240` |
| Criterion 2 — refused with a clear message | ✅ 403 with a reason string naming the rule |
| Criterion 3 — admin override decision recorded | ⚠️ decided ("no override this sprint") **only in `../plans/plan.md`**, a personal sprint doc. `grep` for draft ownership across `hej/docs/` returns zero hits |
| Subtask 4 — a second member cannot submit another's draft | ✅ `test_another_member_cannot_submit_a_pending_draft` |
| Frontend behaviour in the running app | ❌ inverted on `/annotate` and `/review` — see [Blocking](#blocking--the-fix-does-not-reach-the-live-annotate-and-review-pages) |
| Plan Commit 6 — Docs Sync | ❌ outstanding. `hej/AGENTS.md:130` requires `api_surfaces.md` when routes or boundaries change — this changed authorization on three routes **and** added `created_by_name` to `DraftRead`. Also `workflow_states.md`, `task-lifecycle.md` |
| Story doc bookkeeping | ❌ `docs/current_user_stories.md:582` still "○ Working", all four subtasks unchecked; subtask 1 still cites the stale `drafts.py:158` / `:192` / `:212` (now `:177` / `:205` / `:240`) |
| Reviewed by someone other than the author | ⚠️ this document is the first pass; still wants a teammate |

---

## Why the tests and the walkthrough didn't catch it

Worth recording, because the same gap will swallow the next fix of this shape.

- **The unit tests test the function, not the call sites.** `selectDraftForViewer` is tested
  thoroughly and correctly. Nothing asserts that the components which render the annotate page pass
  it a viewer. The default parameter turned a missing argument into a silent, valid one.
- **The walkthrough's step 1 runs while the draft is still unclaimed.** Charlie saves against the
  intake placeholder, which takes the `unclaimed` branch and returns `isOwnedByViewer: true` — so it
  works. There is no step where **Charlie reopens the item after claiming it**, which is the exact
  state that breaks.

**Add that step to `sandbox_scrum25_manual_test.md`**, next to the look-before-saving step added for
the 1f defect. The pattern is the same both times: the walkthrough checked the second annotator and
never re-checked the first.

---

## Shortest path to done

1. Pass `currentUserId()` at `task-annotation-workspace-with-real-data.tsx:47` and
   `task-workbench.tsx:99`, and **make `viewerId` required** so the compiler enforces it. *(This
   alone is the difference between D6 working and D6 being backwards in the app.)*
2. Either delete `components/use-hydrated-task-items.ts` or wire it up — it is dead either way today.
3. Disable the text inputs listed above under `annotateDisabled`, so "read-only" means it.
4. Narrow the `:1687` banner to `!canAnnotate(normalizedStatus)`.
5. Add "Charlie reopens his own claimed item and can still edit" to the manual walkthrough.
6. Land plan Commit 6 — with the **no admin override** decision written into the product docs, which
   is what actually closes criterion 3.

---

# Addendum — follow-up review, 2026-09-12

**Scope:** uncommitted working-tree changes on `CS57-Hanchen` at `469f850`, 4 files, +23 / −5

| File | Change |
| --- | --- |
| `apps/hej-web/lib/task-workspace-data.ts` | `viewerId` made a **required** parameter, with a comment explaining why |
| `apps/hej-web/components/task-annotation-workspace-with-real-data.tsx` | passes `currentUserId()` |
| `apps/hej-web/components/task-workbench.tsx` | passes `currentUserId()` |
| `apps/hej-web/lib/task-workspace-data.test.ts` | three existing call sites pass `null` explicitly |

## The blocking finding is fixed

Minimal and correct. Making `viewerId` required is the right call — it is what stops this class of
bug recurring, and the comment says *why* rather than *what*.

| Check | Result |
| --- | --- |
| All 4 production call sites pass a real viewer | ✅ `task-annotation-workspace-with-real-data.tsx:48`, `task-workbench.tsx:100`, `live-task-workspace.ts:85`, `use-hydrated-task-items.ts:35` |
| `npx tsc --noEmit` | ✅ clean, exit 0 |
| `npx vitest run` | ✅ 122 passed / 16 files |
| `npx eslint` on the three changed files | ✅ 0 errors (1 pre-existing unused-`router` warning at `task-workbench.tsx:139`) |
| `getStoredAuthUser` timing | ✅ synchronous storage read inside a post-mount effect in a `"use client"` component — no race with auth hydration |

The three test call sites updated to `null` are not papering over anything: all three fixtures carry
`created_by: null`, so they still exercise a real path (unclaimed draft, unknown viewer).

## New finding — an unclaimed *submitted* draft is flagged read-only

`selectDraftForViewer`'s unclaimed branch matches only `status === "pending"`:

```ts
const unclaimed = drafts.find(
  (draft) => isUnclaimedDraft(draft) && draft.status === "pending" && hasMeaningfulDraftData(draft)
)
```

An unclaimed **submitted** draft falls past it into the `other` branch and is marked
`isOwnedByViewer: false`. Verified:

```ts
applyApiDraftsToMockItem(item /* status: "returned" */, [unclaimedSubmittedDraft], "text", ALICE)
// → draftIsReadOnly === true, draftOwnerName === undefined   ✓ passed
```

**Why it matters.** `returned` and `rejected` are both in `ANNOTATE_ALLOWED`
(`lib/task-item-actions.ts:52`), and the rework path runs through `shouldForceCreatePendingDraft` →
`forceCreatePending`, which **creates a new draft** rather than writing to the old one. The API allows
this — `verify_user_owns_draft` returns early on `created_by is None`, and a fresh draft has no
ownership conflict at all. The UI now blocks it, showing *"Read-only: another annotator is annotating
this item"* while naming nobody, because nobody owns it.

Not hypothetical for this project's data: `plan.md` records that before `a25d0ae`, *"essentially every
item annotated through the web app produces an unowned annotation"*. Every previously-annotated item
in the dev database therefore carries an unclaimed submitted draft. Until this fix those pages were
read-only for a different reason; this is the one remaining case.

It is also the inverse of the stated design principle — the UI is meant to stop inviting edits the API
will reject, not to reject edits the API allows.

**Smallest fix,** mirroring the ordering already used in the owned branch:

```ts
const unclaimed =
  drafts.find((d) => isUnclaimedDraft(d) && d.status === "submitted") ??
  drafts.find((d) => isUnclaimedDraft(d) && d.status === "pending" && hasMeaningfulDraftData(d))
```

An unclaimed draft belongs to nobody, so it should never be flagged as belonging to someone else.

## Still open from the main review

Confirmed unchanged in the working tree:

1. `components/use-hydrated-task-items.ts` is still imported nowhere — delete it or wire it up.
2. "Read-only" still is not read-only — Verdict `:1815`, Rationale `:1819`, Notes `:2041` / `:2104` /
   `:2163`, image output `:2118` still lack `disabled` / `readOnly`.
3. The `:1687` banner still fires on ownership and still reports the status as the reason.
4. `findPendingDraft` and `selectDraftForViewer` still diverge on the meaningfulness filter.
5. Docs Sync (plan Commit 6), criterion 3, and the story-doc bookkeeping are untouched.

---

# Fix log — 2026-09-12, after the addendum

Everything below was addressed in the working tree after this review. Where a finding above says
"still open", read this section instead.

## Fixed

| Finding | Fix |
| --- | --- |
| **Blocking** — `viewerId` missing at the two live call sites | `currentUserId()` passed in `task-annotation-workspace-with-real-data.tsx` and `task-workbench.tsx`; the parameter is now **required**, so the compiler names any future omission |
| **A1** — unclaimed *submitted* draft flagged read-only (addendum) | `selectDraftForViewer`'s unclaimed branch now matches submitted before pending, the same order the owned branch uses |
| **A2** — "read-only" was not read-only | 7 controls gated on `annotateDisabled \|\| annotateActionPending`: Verdict, Rationale, three Notes editors, the image annotation output, plus **Quick verdicts** and **Format JSON** — the last two found while fixing, both of which bypassed read-only on their own |
| **B1** — the banner blamed status for an ownership block | The status banner is now gated on `!canAnnotate(status)` alone; a held item gets its own banner naming the holder. The two are mutually exclusive, and the duplicated amber note in both Actions blocks is deleted |

**Tests:** web 122 → **131**, backend 163 unchanged, `tsc --noEmit` clean, eslint 0 errors (6
warnings, identical to the `git stash` baseline).

**Fail-before-fix verified** for all three: reverting each change turns exactly the intended new
assertions red — 3 for A1+A2, 1 for B1. The remaining new tests are over-correction guards (another
annotator's submitted draft stays read-only; a status-blocked item still explains itself by status)
and are green against both old and new implementations, as they should be.

**Manual test** — `../plans/sandbox_scrum25_manual_test.md` rewritten in Chinese as 9 steps, with
the three missing checks added at the points where they belong rather than appended: step 2 (reopen
after claiming), step 4 (actually type into the disabled editor), step 9 (rework an unowned
submitted draft).

## Still open

- **B2** — `findPendingDraft` and `selectDraftForViewer` still diverge on the meaningfulness filter.
- **B3** — `components/use-hydrated-task-items.ts` is still dead code.
- **B4** — no regression test pins the call sites to a real viewer.
- **C1–C5** — Docs Sync (plan Commit 6), criterion 3 recorded in the product docs, the story-doc
  status and stale line numbers, a second reviewer, and the commit itself: all six files are still
  uncommitted.
