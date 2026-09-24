# Sprint plan — SCRUM-25, SCRUM-26, SCRUM-28

**Owner:** Hanchen Wang · **Branch:** `CS57-Hanchen` · **Sprint:** W6
*(The Jira board records the assignee as "Jason Wang" on all three — same person, different name. Don't
be thrown when grepping `Jira.csv`.)*

| Ticket | Summary | Story | Issue | Severity |
| --- | --- | --- | --- | --- |
| SCRUM-25 | Annotation: Enforce draft ownership | D6 | #6 | Critical |
| SCRUM-26 | Annotation: Make draft submission and annotation creation atomic | D5 | #11 | High |
| SCRUM-28 | Annotation: Preventing finalized annotations from being overwritten | D5 | #2 | Critical |

All three live in the same code path — `DraftService` and the draft routes — which is why they were
grouped. Doing them in one branch is right; doing them in one commit is not.

> ⚠️ **D5 is co-allocated.** `current_user_stories.md:560` lists D5 (SCRUM-26 **and** SCRUM-28) as
> "Allocated to: Hanchen Wang, **Yi Geng**". D6 / SCRUM-25 is yours alone. Agree the split with Yi
> before Commit 2 — and see [Risks](#risks) for the collision his unmerged branch creates in
> `task_service.py`.

---

## Before you start

### ✅ Done — branch synced with `origin/main`

`origin/main` (PR #4, Jingwei's role-based permission work) is merged and the `.gitignore` typo is
fixed in `63bcfab` — that commit is Jingwei's, not yours, but either way both prerequisites are
complete. `CS57-Hanchen` is now at `63bcfab`, identical to `origin/main`.

**Your local branch is 11 commits ahead of `origin/CS57-Hanchen`.** Push before you start, so the
ticket commits land on top of a remote everyone else can see.

This mattered because Jingwei rewrote `apps/hej-api/app/api/routes/drafts.py` — every route these
three tickets touch — adding `GovernedAction.ANNOTATE` checks to `create_draft`, `update_draft`,
`delete_draft` and `submit_draft`, and `GovernedAction.APPROVE` to `approve_draft`. Starting before
that merge would have conflicted on all three tickets.

Confirm you're green before writing code:

```bash
cd apps/hej-api && .venv/Scripts/python -m pytest -q
```

**Baseline on `63bcfab`: `149 passed, 111 subtests passed`, zero failures, zero collection errors.**
Use the exact number, not "123+" — a regression that drops you to 147 is invisible against a fuzzy
target. (The suite is fully green here; the two failures you may have seen on Yi's branch are issues
14 and 22, both already fixed on `main` by `e0e642a`.)

### Line numbers below are current as of `63bcfab` (verified)

Note the anchor: the `drafts.py` numbers are the **`verify_user_draft_access` call sites**, which is
where your check goes — not the `def` lines. `tut.md`'s Part 4 trace cites the `def` lines for the
same routes (`:44`, `:168`, `:208`, `:234`, `:293`). Both are correct; don't be confused flipping
between the two docs.

| What | Where |
| --- | --- |
| `verify_user_draft_access` | `app/core/resource_scope.py:49` |
| `get_draft` (read) — call site | `app/api/routes/drafts.py:143` |
| `update_draft` / `delete_draft` / `submit_draft` (writes) — call sites | `drafts.py:177`, `:216`, `:250` |
| `approve_draft` (reviewer action) — call site | `drafts.py:316` |
| `DraftService.create_draft` / `submit_draft` | `app/services/draft_service.py:31`, `:93` |
| `_create_annotation_from_draft` | `draft_service.py:146` |
| `TERMINAL_TASK_ITEM_STATUSES = {"canonicalized"}` | `app/services/task_service.py:72` |
| `assert_task_item_status_update_allowed` (existing sibling guard) | `task_service.py:89` |
| `_commit_or_rollback` (repo commit pattern) | `app/repositories/db_store.py:19` |
| `DraftRepository.update` | `db_store.py:1094` |

---

## Order, and why

**SCRUM-25 → SCRUM-28 → SCRUM-26.** — *SCRUM-25 is done; [SCRUM-28](#commit-2--fixapi-refuse-draft-writes-against-finalized-task-items-scrum-28) is next.*

- **25 first** because it's self-contained, has no open product question, and closes a Critical hole
  on its own. Good first merge.
- **28 second** because the refusal guard is small and its test — "a finalised annotation is
  byte-for-byte unchanged after an attempted overwrite" — becomes the **safety net for the 26
  refactor**. You want that test existing *before* you restructure `submit_draft`.
- **26 last** because it's the riskiest change (transaction semantics across shared repository code)
  and benefits from both tests above already being green.

---

## Commit 1 — `fix(api): enforce draft ownership on write paths (SCRUM-25)`

> ## ✅ DONE — 2026-09-12
>
> | Commit | Contents |
> | --- | --- |
> | `a25d0ae` *(pushed)* | Backend guard — `resource_scope.py`, `drafts.py`, `draft_service.py`, `tests/test_draft_ownership_routes.py` |
> | *(local)* | Web half, 1d + [1f](#commit-1f--fixweb-show-each-annotator-their-own-draft) — selection on both the write and display paths, plus `created_by_name` on `DraftRead` |
>
> Also on the branch: `0508bc3`, Jingwei's `fix(auth): restore user session after page refresh`,
> **cherry-picked** — the web half needed a reliable signed-in user. His SCRUM-29 commit was
> deliberately left on his branch.
>
> **Suites:** backend 149 → **163**, web 100 → **122**, typecheck clean.
> **Fail-before-fix:** 5 backend, 5 web (1d), 9 web (1f).
> **Verified in the running app** — [`manual-test-SCRUM-25.md`](../tests/manual-test-SCRUM-25.md).
>
> Four things this plan did not anticipate:
>
> - **Fixing the write path was only half of it.** The editor also had to stop *displaying* someone
>   else's draft — see [Commit 1f](#commit-1f--fixweb-show-each-annotator-their-own-draft). The first
>   walkthrough passed with that defect still live, because it never checked what the second
>   annotator's editor was pre-filled with.
> - **The frontend needed no threading.** `lib/api/client.ts` already resolves the caller from storage
>   for the auth header, so the same source serves here. No payload field, no prop drilling.
> - **The ownership check runs *after* the capability check**, not immediately after
>   `verify_user_draft_access` as written below — someone failing both is told about the role, which
>   is more actionable.
> - **Claim-on-first-write lives in the service**, folded into the existing update rather than a
>   second write. Keeps Commit 4's transaction simple.

Closes issue #6, story D6 criteria 1 and 2.

### The trap — and a deliberate deviation from `fix-plan.md`

Do **not** add the ownership check inside `verify_user_draft_access`. **Five** routes call it, and only
three should be owner-restricted:

| Route | Call site | Ownership? |
| --- | --- | --- |
| `get_draft` | `:143` | ❌ no — reviewers must read others' drafts |
| `update_draft` | `:177` | ✅ yes |
| `delete_draft` | `:216` | ✅ yes |
| `submit_draft` | `:250` | ✅ yes |
| `approve_draft` | `:316` | ❌ **no** — this is a reviewer approving someone else's draft |

Putting it in the shared function breaks `approve_draft` and contradicts the self-approval guard
Jingwei just added.

> **This contradicts `fix-plan.md` §6 item 1**, which says to put the check *inside*
> `verify_user_draft_access`. That recipe is wrong: it was written believing the only read paths were
> `get`/`list` (see §6 item 2) and it never accounted for `approve_draft` calling the same helper at
> `drafts.py:316`. Following it would 403 every reviewer approval.
>
> **Say this in the PR description.** A reviewer checking your work against the fix plan will
> otherwise read the deviation as a mistake rather than a correction.

### Do this instead

Add a separate helper in `app/core/resource_scope.py`, next to the existing one:

```python
def verify_user_owns_draft(current_user: dict, draft: DraftDB) -> DraftDB:
    """Restrict draft mutation to its author. Read and review paths are unaffected."""
    if draft.created_by is not None and int(draft.created_by) != int(current_user["user_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This draft belongs to another annotator. Only its author can edit, delete or submit it.",
        )
    return draft
```

### ⚠️ Do not fail closed on `created_by IS NULL` — read this first

The obvious version of this check denies when `created_by is None`. **That would break annotation
entirely**, and it took a live experiment to find out why.

`TaskService.register_dataset` (`app/services/task_service.py:469`) **auto-creates a placeholder
draft for every task item at intake**, and on the `human_first` branch it passes no `created_by` at
all:

```python
self.db_draft_repo.create(
    draft_id=new_id("draft"),
    task_item_id=saved_item.id,
    annotation_type="bbox",                          # ← hardcoded, even for text tasks
    draft_data={"bboxes": {}, "labels": {}},
    status="pending",
)                                                    # ← no created_by → NULL
```

Verified empirically: registering 2 text items produced 2 drafts with `created_by = NULL`,
`annotation_type = "bbox"`. So on every human-first task, the draft the annotator first opens is
**ownerless by design**. Fail closed and nobody can annotate anything.

**Recommended resolution — claim-on-first-write.** An ownerless draft is unclaimed, so let the first
writer take it (hence `is not None` above), and stamp ownership in the same request:

```python
# in update_draft / submit_draft, after the ownership check passes
if draft.created_by is None:
    draft = self.db_store.drafts.update(draft.id, created_by=current_user["user_id"])
```

After that first write it is owned, and every later attempt by another user is refused. This closes
#6 without breaking intake.

**Add a test for exactly this:** Charlie writes to an ownerless placeholder draft → succeeds and
`created_by` becomes Charlie; Alice then tries → `403`.

Two follow-ups worth raising as separate tickets, not fixing here:
- `annotation_type="bbox"` is hardcoded for every task type — a text task gets a bbox placeholder.
- Auto-creating placeholder drafts at intake may not be wanted at all; `create_draft` could make one
  on demand. Behaviour change, needs a product call.

### SCRUM-25 is not backend-only — the web app picks drafts by author too

`apps/hej-web/lib/api/task-items.ts:157`:

```ts
function findPendingDraft(drafts: ApiDraft[]): ApiDraft | undefined {
  return drafts.find((draft) => draft.status === "pending")   // ← no author filter
}
```

`upsertDraft` (`:172`) calls this and **PATCHes whatever pending draft it finds, whoever owns it**.
Two consequences, both confirmed against live data:

1. **The ownerless path is the default, not an edge case.** A first-time annotator opens an item, the
   auto-created placeholder is the only `pending` draft, so the UI edits *that* — and the resulting
   annotation inherits `created_by = NULL`. Essentially every item annotated through the web app
   produces an unowned annotation, which means `assert_not_self_approval` is inert platform-wide.
   This makes claim-on-first-write **required**, not a nicety.
2. **The UI will start 403-ing once the backend is fixed.** With two annotators on one item,
   `findPendingDraft` can hand annotator B annotator A's draft; B's PATCH then correctly fails.

So Commit 1 needs a frontend half: filter to the current user's own pending draft, falling back to
create. Something like

```ts
function findPendingDraft(drafts: ApiDraft[], userId: number | null) {
  return drafts.find((d) => d.status === "pending" && (d.created_by === userId || d.created_by === null))
}
```

Keep the `null` branch so the placeholder is still claimable — it must agree with the backend rule.

**Budget more than a one-line change for this.** `task-items.ts` is a plain API module, not a React
component, so it cannot call `useAuth()`. `userId` has to be threaded in from the component layer,
which touches five places:

| File | Change |
| --- | --- |
| `lib/api/task-items.ts:157` | `findPendingDraft(drafts, userId)` |
| `lib/api/task-items.ts:172` | `upsertDraft(itemId, payload, options, userId)` |
| `lib/api/task-items.ts` — `annotateTaskItem`, `submitTaskItem` | both exported signatures gain the id |
| `lib/task-item-actions.ts:75` | passes it through (or carries it on `AnnotateActionPayload`) |
| `lib/api/task-items.test.ts` | three `submitTaskItem(...)` call sites |

The good news: **no API change is needed.** `created_by` is already on the wire — `ApiDraft.created_by`
(`task-items.ts:54`) and backend `DraftRead.created_by` (`app/schemas/drafts.py:44`) both exist and are
populated. And `useAuth()` already exposes `ApiAuthUser.user_id` (`lib/api/auth.ts:33`), so the value is
available at the component boundary — it just has to travel.

### Known boundary: this does not fix reviewer-side annotation selection

Once an item already has **both** an ownerless annotation and an owned one, `_latest_annotation`
(`review_actions.py:139`) filters `is_latest == True` and orders by `version`, which is hardcoded to
`1` everywhere — so the tiebreak is meaningless and the pick is effectively arbitrary.

Reproduced on `sandbox_text_003` (item id `item_0d3bb2fc6864`): two rows, both `is_latest=1`, both
`version=1`. The reviewer's three actions all landed on the ownerless `ann_d438897dcd9a`, while the
annotator's real submission `ann_9e9501c250aa` was never reviewed at all — and the item was
canonicalized on the strength of a review of a different annotation.

The hardcoded version is confirmed platform-wide, not just on that item: **0 of 31 annotations in the
dev database have `version ≠ 1`**, and the only write is `version=1` at `draft_service.py:177`.

That is issue #3/#4, story **D4 / SCRUM-27**, and it is not yours — the ticket is currently
**unassigned** (`To Do`, no assignee on the board), so don't assume someone is already on it. Commit 1
stops *new* ownerless annotations from being created, which removes the cause going forward;
pre-existing rows stay ambiguous until SCRUM-27 lands. Say so in the PR so nobody thinks D1 is fully
restored.

Call it at `drafts.py:177`, `:216`, `:250` only, immediately after the existing
`verify_user_draft_access(...)` returns the draft.

### Product decision — D6 criterion 3

The story asks whether an admin/reviewer override exists. **Recommendation: no override this
sprint.** Rationale to put in the PR description: an override would need to be a `GovernedAction`
capability plus an audit entry, and neither is needed to close #6. Explicitly deciding "no" satisfies
criterion 3 ("if we allow one") — just say so in writing rather than leaving it unanswered.

### Tests — `tests/test_draft_ownership_routes.py` (new)

Follow the real-SQLite pattern in Jingwei's `tests/test_governed_action_permissions.py`, not the
MagicMock pattern in `test_draft_service_lifecycle.py` — you need two real users.

1. User B `PATCH`es user A's pending draft → `403`, message names the reason.
2. User B `DELETE`s user A's pending draft → `403`.
3. User B `POST`s `/submit` on user A's pending draft → `403`.
4. User A can do all three on their own draft → success.
5. A reviewer can still `GET` and `approve` user A's draft → success (regression guard for the trap).

> ⚠️ **Re-seed the sandbox before manual testing.** `tut.md` describes `sandbox_text_003` as "kept
> clean" — it is not. All **five** `sandbox_text_00N` items are now `canonicalized`, and `003` carries
> three drafts and two competing annotations from the D4 reproduction above. Once Commit 2's guard
> lands, *every* item in that fixture will refuse draft writes, so there is nothing left to test
> SCRUM-25 against. Re-run `init_data.py --reset` plus `seed_test_roles.py` and build a fresh
> non-terminal item first. (These automated tests build their own rows, so they are unaffected — this
> only bites the by-hand walkthrough.)

### Bonus you get for free

This also closes the self-approval bypass flagged in the Jingwei review: today user A can submit
user B's draft, `_create_annotation_from_draft` stamps `created_by = B`, and A — if A also holds
`reviewer` — passes `assert_not_self_approval` and approves work A actually submitted. Once submit is
owner-only, that chain is broken. **Say this in the PR**; it's a second Critical closed by one check.

---

## Commit 1f — `fix(web): show each annotator their own draft (SCRUM-25)`

Folded into SCRUM-25 rather than shipping D6 half-done. **Done 2026-09-12.**

### The defect

Found by hand, not by tests. Charlie saved; Dana opened the same item and **her editor was pre-filled
with Charlie's text.** `applyApiDraftsToMockItem` (`lib/task-workspace-data.ts`) picked the draft to
display with no author filter:

```ts
const latestDraft =
  drafts.find((draft) => draft.status === "submitted") ??
  drafts.find((draft) => draft.status === "pending" && hasMeaningfulDraftData(draft))
```

`use-hydrated-task-items.ts` and `live-task-workspace.ts` hand it every draft on the item, and the
sheet seeds its editor from the result. Worse than "first pending wins": it prefers a **submitted**
draft, so once one annotator submits, their work appears in everyone's editor.

**Not the same bug as 1d.** 1d fixed which draft gets *written*; this is which gets *displayed*. Same
root cause — "take the first pending draft" — in two files; fixing one did not touch the other.

**Why it matters:** not a security hole (reading others' drafts is deliberately allowed, `GET` returns
200 by design). But an annotator starting from someone else's answer is not annotating independently,
which is the premise of D7's cross-validation.

### Decisions (Hanchen, 2026-09-12)

| Question | Decision |
| --- | --- |
| Scope | Fold into SCRUM-25 before pushing |
| What an annotator sees when only another's draft exists | **Show it, clearly read-only**, plus a column naming who holds the item |
| Reviewers | Annotator drafts are read-only to them; enforcement stays the backend 403, no role-aware UI gating |
| Can a second annotator start a competing draft? | **No** — one annotator per item |

Two of those needed reconciling, both settled deliberately:

- **Read-only is decided by ownership, not role.** "Show other drafts read-only" and "don't gate
  reviewers in the UI" only conflict if read as rules about roles. As a rule about ownership —
  *a draft that isn't yours is read-only, full stop* — annotators get the read-only view of a
  colleague's work and reviewers get it of the annotator's, with no role-checking code. The backend
  403 stays the real enforcement; the UI just stops inviting rejected edits.
- **One annotator per item** *(revised same day)*. A first pass added a "Start my own annotation"
  button, because a read-only editor with no alternative left the second annotator unable to record
  anything. Rejected as confusing — two live drafts on one item is harder to reason about than a held
  item. The button was removed; a second annotator moves to another item.

**One consequence carried forward, not blocking:**

- **The API still permits a second draft**, so a stale page can create one — reproduced 2026-09-12.
  The browser is the only thing enforcing one-per-item today. Fixed server-side by
  [Commit 5](#commit-5--fixapi-allow-only-one-pending-draft-per-task-item), which is no longer
  optional as a result. **Does not affect D6:** the second annotator never touches the first's draft,
  so ownership enforcement holds; what leaks is the newer one-annotator-per-item convention.
**Checked against the project docs (2026-09-12) — they support the decision.** An earlier draft of
this plan claimed D7 assumed the opposite. That was wrong, and the correction matters:

- **"Dual" here means reviewers, not annotators.** `terminology/governance-model.md:47` defines dual
  sign-off as "two aligned **approvals**". D7 routes items to "a second, independent **reviewer**"
  and I3 measures whether **reviewers** agree. Every cross-validation requirement found sits in the
  *review* stage. Nothing asks for two annotators drafting one item at once.
  (`fix-plan.md:50` calls multi-annotator items "the entire premise of the dual-sign-off policy" —
  that overstates it.)
- **One requirement argues for going further.** RQ-607, Annotator Data Isolation
  (`governance/requirements.md:1469`): *"annotators only see task items assigned to them."* Read
  strictly, a second annotator should not see the item at all — so showing them the holder's draft
  read-only is a **known gap against RQ-607**, not against this decision. Not actionable yet:
  RQ-204 task assignment is unimplemented and D8 notes task items have no assignee field. Once
  assignment lands, one-annotator-per-item stops being a UI convention and follows from assignment.
- **What the docs *do* require is unaffected.** `db_schema_strategy.md:356` and its Anti-pattern 1
  demand the schema keep multiple annotations per item with full provenance — never "a single mutable
  latest label row". This rule governs who may hold a *draft*, not how many annotations an item
  accumulates over time, so that requirement is untouched.

### What was built

| # | Change |
| --- | --- |
| 1 | `selectDraftForViewer` in `task-workspace-data.ts` — my submitted draft → my pending → unclaimed placeholder → otherwise someone else's, flagged read-only |
| 2 | Viewer id threaded through `use-hydrated-task-items.ts` and `live-task-workspace.ts`, from `getStoredAuthUser()` — the same source 1d uses |
| 3 | `annotateDisabled` in the sheet also covers "the displayed draft has an owner who isn't me", with an amber notice naming the holder. Review-side gating untouched |
| 4 | **Annotator** column between Item and Status, fed by a new `created_by_name` on `DraftRead` — populated from the `created_by_user` relationship `DraftDB` already declares. Additive, no migration |

### Tests

9 new web tests: own draft preferred over another's and over another's submitted one; falls back to
the unclaimed placeholder; someone else's surfaced but flagged; the viewer's own content is what
reaches the editor. All 9 go red when the selection rule is reverted.

Backend **163**, web **122**, typecheck clean.

### Manual test

`manual-test-SCRUM-25.md` — rewritten in Chinese as a **9-step** walkthrough (2026-09-12).
Three of those steps were added *after* this commit, each pinning a defect that had already shipped:

| Step | Pins |
| --- | --- |
| **2** — Charlie reopens the item *after* claiming it and can still edit | Step 1 passes against an unclaimed draft, so without this the "is this draft mine?" branch is never exercised at all |
| **4** — actually type into the disabled editor, don't just look at the buttons | "Read-only" was only ever applied to the buttons |
| **9** — an unowned *submitted* draft (every pre-`a25d0ae` web draft) can still be reworked | The UI refused a write the API allows |

The original look-before-saving step is now **step 3**. Its absence is why the display defect
shipped; do not remove it.

---

## Commit 2 — `fix(api): refuse draft writes against finalized task items (SCRUM-28)`

Closes issue #2, story D5 criterion 1.

### What's actually wrong

`submit_draft` (`draft_service.py:93`) checks only `draft.status != "pending"`. Nothing checks the
parent **task item's** status. `_create_annotation_from_draft` (`:146`) then calls
`annotations.update(existing.id, annotation_data=..., ...)` in place whenever that creator already has
an annotation on the item — silently rewriting an approved, canonicalized answer with no new review.

**Don't be reassured by `_TASK_ITEM_STATUSES_SKIP_ANNOTATED_ON_SUBMIT`** (`draft_service.py:16`). That
set only skips the *item status transition*. The annotation content is still overwritten. The item
stays `canonicalized` while its payload silently changes — arguably worse than a visible transition.

### Do this

Put the guard next to the existing terminal-status definition in `app/services/task_service.py:72`,
so "what counts as terminal" stays in one place.

**There is already a sibling guard in that file** — `assert_task_item_status_update_allowed`
(`task_service.py:89`) raises `409` on the same `TERMINAL_TASK_ITEM_STATUSES` set. It guards *status
transitions*, which is a genuinely different concern from *annotation content writes*, so you do need a
second function — but put yours directly beside it and match its signature shape and message style
rather than inventing a new convention:

```python
def assert_task_item_accepts_draft_writes(task_item) -> None:
    """Reject annotation writes against an item whose result is already final."""
    if str(task_item.status) in TERMINAL_TASK_ITEM_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Task item {task_item.id} is finalized ({task_item.status}) and does not accept "
                "new annotation work. It must be explicitly reopened first."
            ),
        )
```

Call it from **`DraftService.create_draft` and `DraftService.submit_draft`** — the service layer, not
the routes, so the guard holds regardless of which caller arrives.

### Tests — extend `tests/test_draft_service_lifecycle.py`

1. `create_draft` against a `canonicalized` item → `409`.
2. `submit_draft` against a `canonicalized` item → `409`.
3. **The important one:** seed a canonicalized item with an approved annotation, attempt the
   overwrite, assert `annotation_data`, `version`, `confirmed_by` and the approving `ReviewDB` row are
   *unchanged*. This is the test that fails against today's behaviour, and the one that protects
   Commit 4.
4. Non-terminal statuses (`pending`, `returned`, `expert_send_back`) still accept writes — don't
   over-block the send-back loop.

### Scope note — "finalized" has two definitions in this codebase

`TERMINAL_TASK_ITEM_STATUSES` is `{"canonicalized"}` only, so a `reviewed` item stays writable after
this guard lands. That is **correct for this ticket** — D5 subtask 1 says "refuse a draft submission
against a *canonicalized* item" in those words.

But `FINALIZED_EXPORTABLE_TASK_ITEM_STATUSES` (`task_service.py:82`) also names `reviewed` and
`approved`, so the codebase carries two different answers to "what is finalized." That gap is issue
19/27, story B6 / SCRUM-43, and not yours to close. **Put one line in the PR** saying SCRUM-28 refuses
writes to `canonicalized` only, so nobody reads it as protecting everything the export layer treats as
final.

### Deferred — D5 criterion 2 (reopen)

"Reopening a finalised item is a visible, attributable action" needs a client decision: who may
reopen, and what it does to the existing annotation (new version? supersede? audit entry?).
`issues.md` already lists this class of thing under "client decisions needed first."

**Scope this sprint to refusal only.** Raise the reopen question with Hunter in the sprint review, and
note in the PR that **this commit closes D5 criterion 1 only**. Criterion 3 (atomicity) is Commit 4;
criterion 2 (reopen) stays open. Don't invent the transition yourself — D5 subtask 4 is explicitly a
workflow-semantics decision.

---

## Commit 3 — `refactor(api): allow repository writes to defer commit`

No behaviour change. This is the enabler for Commit 4, kept separate so the reviewer can see that the
risky part is mechanical.

### Why it's needed

`submit_draft` can't just be wrapped in a transaction: every repository method calls
`_commit_or_rollback` internally (`db_store.py:19`), so each of the three writes commits on its own.

### Do this

Add an opt-in parameter — defaulting to current behaviour, so nothing else in the codebase changes:

```python
def update(self, draft_id: str, *, commit: bool = True, **kwargs) -> DraftDB:
    ...
    if commit:
        _commit_or_rollback(self.db)
        self.db.refresh(db_draft)
    else:
        self.db.flush()
    return db_draft
```

Apply to exactly the three methods `submit_draft` uses:
- `DraftRepository.update` (`db_store.py:1094`)
- `AnnotationRepository.create` (`:982`) and `.update` (`:1012`)
- `TaskItemRepository.update` (`:881`)

**Default must stay `True`.** Every other caller keeps its current semantics, so this commit should
leave the suite at **149 passed** with zero test edits — that's the proof it's safe.

---

## Commit 4 — `fix(api): make draft submission atomic and persist annotation link (SCRUM-26)`

Closes issue #11, story D5 criterion 3 — and **both** subtask 2 (one transaction) and subtask 3
(persist the link). Claim both in the PR; the two halves are one function.

### Two problems, one function

**a. Three independent commits.** `submit_draft` writes draft status, then the annotation, then the
item status — each committing separately. A failure between them leaves a submitted draft with no
annotation, or an item out of sync with its draft.

**b. `draft.annotation_id` is a dead column.** It's declared (`db_models.py:255`), read defensively
(`draft_service.py:206`), and **never written** — `submit_draft` discards
`_create_annotation_from_draft`'s return value. So that branch is permanently `None`. Confirmed in the
dev database: **0 of 33 drafts have `annotation_id` set.**

### Do this

```python
def submit_draft(self, draft_id, payload=None):
    draft = self.get_draft(draft_id)
    # ... existing status checks + assert_task_item_accepts_draft_writes from Commit 2 ...
    try:
        draft = self.db_store.drafts.update(draft_id, commit=False, **update_data)
        annotation = self._create_annotation_from_draft(draft, confirmed_by=draft.created_by, commit=False)
        self.db_store.drafts.update(draft_id, commit=False, annotation_id=annotation.id)   # (b)
        self._advance_task_item_to_annotated_on_submit(draft.task_item_id, commit=False)
        self.db.commit()
    except Exception:
        self.db.rollback()
        raise
    self.db.refresh(draft)
    return draft
```

`_create_annotation_from_draft` and `_advance_task_item_to_annotated_on_submit` both need a `commit`
parameter threaded through.

### Scope boundary — don't drift into SCRUM-27

Once `annotation_id` is populated, it's tempting to also fix `review_actions._latest_annotation`
(`review_actions.py:139`) to use it instead of the ambiguous `task_item_id` lookup. **Don't.** That's
SCRUM-27 / story D4 — currently unassigned on the board, so it is unclaimed rather than someone else's
— and it carries an unresolved client decision (one canonical annotation per item vs. per-annotator
submissions side by side).

Write the link; leave the consumer alone. Note in the PR that SCRUM-27 is now unblocked.

### Tests — `tests/test_draft_submission_atomicity.py` (new)

Mocks cannot prove rollback. Use a real in-memory SQLite session.

1. **Happy path:** submit a draft, assert `draft.annotation_id` is populated and points at the
   annotation that submission actually created.
2. **Rollback:** patch `TaskItemRepository.update` to raise mid-sequence. Assert afterwards that the
   draft is still `pending`, **no** annotation row exists for the item, and the item status is
   unchanged. This is the test that fails against today's behaviour.
3. Re-run the Commit 2 tests — they now also cover the restructured function.

---

## Commit 5 — `fix(api): allow only one pending draft per task item`

**No longer optional.** It is now the server-side half of the one-annotator-per-item rule decided in
[Commit 1f](#commit-1f--fixweb-show-each-annotator-their-own-draft), which today is enforced only in
the browser.

### Why it is needed — reproduced 2026-09-12

A stale page defeats the UI lock. No genuine race required; a tab left open is enough.

```
T0  [ (placeholder, unclaimed) ]      Dana's page renders: editable, Save enabled
T1  [ (placeholder, Charlie) ]        Charlie saves, claiming it
T2  Dana clicks Save without refreshing
T3  [ (dana's, Dana), (placeholder, Charlie) ]
```

`upsertDraft` re-fetches the draft list at save time, so Dana's click **did** see Charlie's claim and
**did** correctly refuse to write to his draft — no 403, because she never touched it. It then fell
through to its last branch, *create my own*. Both browsers then legitimately show "this item is
mine", because the item genuinely has two owners.

**The client cannot fix this.** Any client-side check is a snapshot, and the gap between render and
click is unbounded.

### Do this

`fix-plan.md` §6 item 3 proposes one pending draft per `(task_item_id, created_by)`. **That is not
enough here** — Charlie and Dana are different authors, so the pair is unique and the second draft is
still allowed. For the decision taken in 1f the rule must be:

> **At most one pending draft per task item, regardless of author.**

Refuse in `DraftService.create_draft` with **409** and a message naming the holder, so Dana's stale
save returns *"Charlie Davis is already annotating this item"* instead of silently creating a
competing draft. Application-level check is enough; a partial unique index needs migration tooling
this repo does not have.

Leave 1d's create-my-own fallback in place — under this rule it becomes reachable only when nobody
holds the item, which is exactly when it should fire.

### Tests

1. Second pending draft on a held item → `409`, message names the holder.
2. The holder can still create one when none exists, and still update their own.
3. A pending draft is allowed again once the previous one is `submitted` — submission releases the
   item; it is not permanently locked to one person.
4. **The stale-page sequence above**, end to end: the second save is refused rather than creating a
   second draft.

Test 3 is the one to get right: this rule must gate *concurrent* drafting, not stop an item ever
being annotated twice over its life. The schema is required to keep multiple annotations per item
(`db_schema_strategy.md` Anti-pattern 1), and this must not undermine that.

---

## Commit 6 — `docs: record draft lifecycle rules and decisions`

`AGENTS.md`'s Docs Sync rule: workflow-state changes require updating the docs in the same change.

All three paths exist and are the right targets (verified):

- `hej/docs/design/product/workflow_states.md` — finalized items refuse new annotation work.
- `hej/docs/design/backend/api_surfaces.md` — draft mutation is author-only; add it to the capability
  table Jingwei started.
- `hej/docs/terminology/task-lifecycle.md` — what "finalized" now guarantees, and that it currently
  means `canonicalized` only.
- Record both decisions explicitly: **no admin override on draft writes**, and **reopen deferred
  pending client input**.

One more worth fixing while you're here: **D6 subtask 1 in `current_user_stories.md` cites
`drafts.py:158`, `:192` and `:212`** — stale line numbers that match no current call site. The correct
call sites are `:177`, `:216`, `:250`. Update the story so the "am I done?" check lines up with the
code you actually changed.

> **Done 2026-09-13.** The story (now in `docs/shared/story_src.csv`) cites the ownership
> checks at `drafts.py:177`, `:205` and `:240` — where `verify_user_owns_draft` is called after the
> `main` merge. The `:216` / `:250` above were the `verify_user_draft_access` call sites at `63bcfab`.

---

## Definition of done (from the backlog)

Marked per ticket. **SCRUM-25 🟡 · SCRUM-28 ○ · SCRUM-26 ○**

- [x] *(25)* Demonstrable in the running app — the 9-step walkthrough in
      [`manual-test-SCRUM-25.md`](../tests/manual-test-SCRUM-25.md) passed 2026-09-12.
      *(Was un-ticked once: the first run passed while the display defect was still live, because it
      never checked the second annotator's editor contents.)* **Still to do:** re-run it after the
      `main` merge (`d0bdcf8`), plus one AI-assisted pre-annotation check for `871d2d1`.
- [x] *(25)* New workflow logic ships with tests in the same commit.
- [x] *(25)* Defect 6 has tests that **fail against the old behaviour** — 8 backend (5 routes,
      3 AI drafts) and 18 web (5 for 1d, 9 for 1f, 4 for the follow-up fixes), each verified red
      before its fix. The rest of the 19 backend / 26 web new tests are over-correction guards.
- [ ] *(28, 26)* Same three, for defects 2 and 11.
- [x] *(25)* Docs for changed states updated in the same change — `f7fdd8f` (`api_surfaces.md`,
      `workflow_states.md`, including the no-override decision for D6 criterion 3).
      `task-lifecycle.md` is deliberately left for SCRUM-28: it describes the task container, not
      per-item workflow.
- [ ] Reviewed by someone other than you — **outstanding for SCRUM-25.** PR description ready in
      [`pr-cs57-hanchen-scrum-25.md`](../../../reviews/pr-cs57-hanchen-scrum-25.md), to open against `main` from
      `CS57-Hanchen`.

Run before every commit:

```bash
cd apps/hej-api && .venv/Scripts/python -m pytest -q
```

---

## Risks

| Risk | Mitigation |
| --- | --- |
| Ownership check breaks `approve_draft` or `get_draft` | Separate helper, not a change to `verify_user_draft_access`. Test 5 in Commit 1 guards it. |
| `commit=False` leaks into other callers | Default `True`; Commit 3 must leave the suite green with zero test edits. |
| Terminal-status guard over-blocks the send-back loop | Test 4 in Commit 2 asserts `returned` and `expert_send_back` still accept writes. |
| Reopen decision doesn't land this sprint | Refusal is shippable alone; D5 criterion 2 carries over. Flag at sprint review, don't invent semantics. |
| Merge conflicts with in-flight work on `drafts.py` | Land Commit 1 early and tell Jingwei — you're both editing that file. |
| **Yi's `CS-57-Yi` lands on top of you** | His `337ca1a` (83 files, unmerged) rewrites the `register_dataset` block Commit 1 depends on, adds `task_class` / `task_subtype` / `ai_provider` columns to `TaskDB`, and deletes `gemini_preannotator.py`. The **behaviour** you rely on survives — the `human_first` placeholder is still `annotation_type="bbox"` with no `created_by` — but the `task_service.py:469` anchor moves. Land your commits first if you can; otherwise re-verify that one line after his merge. |
| **D5 is co-owned with Yi** | SCRUM-26 and SCRUM-28 are allocated to both of you. Agree the split before Commit 2 rather than discovering it in a merge. |

---

## ✅ Drive-by — done

`.gitignore:53` read `apps/hej-api/*.db-journa324`, a typo that came in with PR #4 and un-ignored
SQLite journal files. Fixed in `63bcfab` (Jingwei's commit) as its own change, which is exactly right
— it keeps the three ticket commits clean.

---

*Companion doc: [`tut.md`](../../learning/tut.md) — orientation for the codebase, how to run it, and a trace of
the exact code path these three tickets change.*
