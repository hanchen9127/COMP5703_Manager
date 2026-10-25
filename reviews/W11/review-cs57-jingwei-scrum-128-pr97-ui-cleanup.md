# Review — PR #97, `CS57-Jingwei` (SCRUM-128: the UI cleanup, role-correct views and the bugs found on the way)

<https://github.com/USYD-CS-Capstone/hej/pull/97> · reviewed 2026-10-23 at `458aae1e` (52 commits, base `main` at `efb5900`) · reviewer Hanchen Wang

The first pass was at `de06a867`. This version is updated to `458aae1e`, Jingwei's answer to DIQI26 (Yi).

**Not posted yet.** The body at the end is the version to post. "Not raised on the PR" is for Hanchen only.

Read from GitHub first:
- **The PR is a draft.** GitHub reports it `MERGEABLE` / `CLEAN`; it has no review requests.
- **It is level with `main`, not behind it.** The merge base is `main`'s head `efb5900` (#96), and
  `git rev-list HEAD..origin/main` is empty. The "about 42 behind" in the brief is out of date: Jingwei merged
  `main` in twice (`25e9981`, `b23b830`).
- **CI did not run:** all three jobs (`sqlite`, `postgresql`, `web`) report `skipping`.
- **Reviews and comments:**
  - DIQI26 (Yi) reviewed `6a7da1e` with `CHANGES_REQUESTED` at 10:22 UTC.
  - Jingwei answered in a PR comment at 12:04 UTC, saying all five points are fixed on `458aae1`.
  - There are no inline comments.
  - Seven commits came after Yi's review: `b6c2c0a`, `ad75d42`, `5f7e400`, `36e5e66`, `fb3e54c`, `de06a86` and
    `458aae1`.

Prior context read:
- the SCRUM-128 ticket draft (`sandbox/W11/jira/jira-ui-declutter-and-verdict-chips.md`, confirmed as SCRUM-128's);
- `sandbox/W11/frontend-design-review.md`;
- `specs/tech-stack.md` (the PR title rule of 2026-10-23), `mission.md` ("UI style ... only with written
  justification agreed at review") and roadmap W11;
- `sandbox/W11/plans/plan-SCRUM-121.md`, which reuses this PR's count endpoint;
- our review of #94.

No sandbox message to Jingwei is about SCRUM-128.

## Verdict: request changes (smaller than at `de06a867`)

`458aae1` fixes the blocking point (a gated read now asks again when the roles refresh), as well as Yi's points
2, 4 and 5. The API parts are sound, and the count endpoint is safe for SCRUM-121 to reuse.

What is left:
- the Setup tab still offers two management actions that the API refuses (finding 1);
- the ticket's own paperwork for a UI change, and the title (finding 2);
- a small regression from `458aae1`: on a full page load, every gated read is sent twice (finding 3).

If Hanchen accepts finding 1 as a follow-up, the rest is small enough to approve once finding 2 is done.

## Runs

On `D:\COMP5703_Capstone\hej-review-97`, detached at `458aae1e`. `npm ci` was run at the first pass, and the
lockfile is unchanged since.

| Check | At `458aae1e` | At `de06a867` (first pass) |
| --- | --- | --- |
| Web, `npm run test:web` | **108 files, 1006 tests passed** | 108 files, 1001 |
| Typecheck, `npx tsc --noEmit` in `apps/hej-web` | **0 errors** (the worktree has no `.next`, so nothing was excluded) | 0 errors |
| Lint, `npm run lint:web` | **0 errors, 38 warnings** | same |
| API, `uv run pytest -q -n auto -p no:cacheprovider` | not re-run: `458aae1` changes no API file | 2539 passed, 63 skipped, 204 subtests |
| Casebook, `uv run python -m evaluation run` | not re-run, same reason | 87/87 passed, 1 skipped |
| `git merge-tree --write-tree origin/main HEAD` | exit 0, no conflicts | same |

Each check below was undone in the worktree, run, and restored. `git status` was clean after each one.

| Fix | What was undone | Result |
| --- | --- | --- |
| Revoke checks (`b6c2c0a`) | The member check and the 409 in `admin_service.py:890-904` | `test_role_revoke.py`: **2 failed**, 3 passed (first pass) |
| Create-project listener (`ad75d42`) | The `ORGANIZATION_CONTEXTS_CHANGED` listener | `use-can-create-project.test.tsx`: **1 failed** (first pass) |
| Annotate badge (`5f7e400`) | The `can_annotate` filter (`live-task-workspace.ts:141`) | `live-task-workspace.test.ts`: **1 failed** (first pass) |
| Review queue re-reads (`458aae1`) | `contextsVersion` from `task-workbench.tsx:153` | `task-workbench.test.tsx`: **1 failed** ("asks again when the reviewer role is granted") |
| Continue on a finalised item (`458aae1`) | `finalised` forced to `false` (`last-task-card.tsx:184`) | `last-task-card.test.tsx`: **2 failed** |
| No finalised read on held items (`458aae1`) | The `rawStatus` branch (`task-item-workspace-sheet.tsx:1544`) | `task-item-workspace-sheet.test.tsx`: **1 failed** |
| The other seven re-reads (`458aae1`) | `contextsVersion` removed at once from `task-workbench.tsx:182`, `task-annotation-workspace.tsx:131`, `project-quality-section.tsx:116`, `project-overview-sections.tsx:71`, `use-project-disputes.ts:124` and `:139`, `last-task-card.tsx:155` | **The whole web suite still passes (1006).** These seven are untested (finding 5) |

Also run: a throw-away hydration probe, `hooks/zz-scratch-hydration.test.tsx`, deleted afterwards. It
server-renders a component that uses `useOrganizationContextsVersion()` with an effect on it, stores a login, then
hydrates. The effect ran **twice**, first with `""` and then with the stored login (finding 3).

Not run:
- **PostgreSQL.** The PR changes no schema, and the new query is a plain `GROUP BY`. Yi ran the new API test files
  on PostgreSQL at `3022c2d`, and Jingwei's comment reports 81 passing on `458aae1`.
- **A browser walkthrough.** Yi walked every role through the whole workflow at `6a7da1e`, and Jingwei reports a
  browser check of Yi's steps at `458aae1`. My findings come from code reading and unit runs.

## The ticket, item by item

SCRUM-128 was written as a declutter: "It is not a redesign: layout, palette, cards and tabs stay". The report it
came with is a menu.

| Ticket item | At `458aae1e` | |
| --- | --- | --- |
| Rule 1: remove, or swap to an existing `packages/ui` variant. No new component, layout or colour | New components:<br>- `packages/ui` `Dialog` and `SuggestInput`<br>- `SubmissionReviewHistory`, `ProjectOverviewSections`<br>- the header's organisation button<br><br>New layouts: Projects in rows of three, New project with a side guide, a two-column Overview.<br><br>A new warm gradient card (`project-overview-sections.tsx:42`). | ⚠️ Exceeded by design. See finding 2 |
| Rule 2: text that states an enforced rule stays | Spot-checked:<br>- blind-then-reveal (`protocol-judgement-steps.tsx`, dark classes only);<br>- the routing and settlement justifications;<br>- the dispute eligibility line on project Disputes.<br><br>All kept. Not checked exhaustively across 212 files. | ✅ where checked |
| Rule 3: light mode looks the same apart from removals | Not the case: pages were re-laid out | ⚠️ See finding 2 |
| Rule 4: the PR lists the findings it takes and those it leaves, one line each on why | The body lists decisions Q3–Q5 and eight bugs. It does not list the report's findings (0, A1–A9, B1–B5, C1–C5, D1). D1 (switch dark mode off) was not taken: `theme-provider.tsx:13-14` still says `defaultTheme="system"` and `enableSystem`. Dark mode was restyled page by page instead, and the PR does not say why D1 was left | ❌ |
| Done 1: findings in, one commit each or grouped | Grouped by page, one commit per review stop | ✅ |
| Done 2: the web suite passes, no test asserts removed text | 1006 passed | ✅ |
| Done 3: contrast scan, if D1 is taken | D1 not taken, so it does not apply. The PR's dark-mode claim comes from Jingwei's own scripts, not from `contrast-scan.js` | — |
| Done 4: before and after screenshots in the PR | Still "can be attached on request". The folders are not in git | ❌ |
| Collaboration with SCRUM-129, #89, H6 | #94 and #89 merged first, and this branch merged them in. H6 (#86) merged on 2026-10-20, so its text freeze has lapsed | ✅ |

The scope grew well past the ticket: about +12,700/−8,450 lines, a role audit, two new API reads and two API fixes.
The PR says Jingwei approved pages 1–16 stop by stop. Pages 17–19 were built "from the plan while Jingwei was
away". `mission.md` requires that a UI style change be agreed at review, and this review is where that happens.
**That decision is Hanchen's** (see "Not raised on the PR").

## What `458aae1` fixed: the first pass's finding 1, which was Yi's point 1

Every effect I listed now has the stored login in its dependencies, through the new
`useOrganizationContextsVersion()`:

| Where | At `458aae1e` |
| --- | --- |
| Review queue | `task-workbench.tsx:153`: deps include `contextsVersion`. ✅ Tested |
| Adjudication queue | `task-workbench.tsx:182` ✅ (untested) |
| Annotate queue | `task-annotation-workspace.tsx:131` ✅ (untested) |
| Your work | `project-overview-sections.tsx:71`: `contextsVersion` is part of the key ✅ (untested) |
| Project quality | `project-quality-section.tsx:116` ✅ (untested) |
| Dispute list and summary | `use-project-disputes.ts:124` and `:139`: the `useCallback` deps, so `useFreshFetch`'s effect runs again ✅ (untested) |
| Pick up where you left off | `last-task-card.tsx:155`, which was `[]` before ✅ (untested) |
| Breadcrumb name | `use-organization-route-name.ts:12-19` now also listens to `ORGANIZATION_CONTEXTS_CHANGED` ✅ |

**The new hook** (`hooks/use-known-to-lack-actions.ts:40-60`) is correct:
- The snapshot is the stored JSON text, a primitive, so `useSyncExternalStore` stays stable and does not loop.
- It subscribes to `storage` (other tabs) and to `ORGANIZATION_CONTEXTS_CHANGED` (this tab). Every write and clear
  in `auth-organization-context.ts` sends that event (`announceChange`, `:17-23`, `:67`, `:79`).
- The cleanup removes both listeners.
- It reads `localStorage`, then `sessionStorage`, the same order `setStoredOrganizationContexts` writes them in.
- It has no closures of its own, so nothing can go stale. Each `useCallback` and effect lists `contextsVersion`.

Two small points about it:
- It hard-codes `"hej.auth.organization_contexts"` (`:43-44`) rather than using `ORGANIZATION_CONTEXTS_KEY`
  (`lib/auth-organization-context.ts:9`, not exported). If the key is ever renamed, the version never changes and
  this fix fails silently. Export the constant and use it.
- The version is the whole stored text, so any change to it re-runs every gated read on the page. That includes
  `members_count`, which changes whenever anyone joins the organisation. This is harmless, just broader than
  "roles changed".

Other `readIf` reads still keep their first answer, but they are snapshots that reload with the workspace, so
this is acceptable:
- the task badges (`live-task-workspace.ts:89`, `:95`);
- the project page's oversee read (`project-data.ts:501`).

## Findings at `458aae1e`, most severe first

### 1. [Should fix] Setup still offers "Save model" and the dataset intake to every role; the API refuses both without MANAGE_TASK

`458aae1` does not touch this, so it still holds. The role audit says that "each role is offered only what it may
do". The Setup tab is visible to everyone (`task-workspace-client-shell.tsx:175`), and it renders both of these
with no role gate:
- `TaskAiModelConfiguration` (`task-setup-read-panel.tsx:155`): a model select and **Save model**
  (`task-ai-model-configuration.tsx:183-190`). It calls `PUT /projects/{p}/tasks/{t}`, which requires
  `MANAGE_TASK` (`routes/tasks.py:191`, check at `:204-209`).
- `TaskDatasetRegistrationPanel` on a draft task (`task-setup-read-panel.tsx:167-176`): Register pointers and
  upload. These call `POST /tasks/{id}/dataset-registration`, which requires `MANAGE_TASK` (`routes/tasks.py:553`
  and following).

**Failure scenario:** Charlie (annotator) opens an AI-assisted task, goes to Setup, picks another model and presses
Save model. The API answers 403, and the panel shows it as an error. The same happens for a reviewer, an
arbitrator or a dispute participant.

This gap was already on `main`, but it is what the audit set out to remove, and Pause/Complete are already gated
this way.

**Fix:** pass `useHasGovernedAction(project.organizationId, "manage_task")` into both. Without it, show the model
read-only and hide the intake.

**Verified:** by code reading against `permissions.py` and `routes/tasks.py`.

### 2. [Should fix before merge] The ticket's paperwork for a UI change, and the title

`458aae1` does not touch these, and the PR body is unchanged on them.
- **The findings list** (ticket rule 4): list the report's findings taken and left, one line each, including why
  D1 (dark mode off) was left.
- **Before and after screenshots** (Done 4).
- **The title still says "seven bugs fixed".** The body says "eight bugs" and its table has eight rows. A merge
  commit keeps the PR's title (`tech-stack.md`), so set it before merging. Otherwise the title follows the rule:
  `refactor(web)`, and the API is about 3% of the changed lines.
- **The scope beyond the ticket** (rules 1 and 3) needs Hanchen's written agreement here.

### 3. [Should fix, new in `458aae1`] On a full page load, every gated read is sent twice

`useOrganizationContextsVersion()` returns `""` on the server and while hydrating (`use-known-to-lack-actions.ts:59`),
then the stored text. So on a server-rendered load, each effect that lists it:
1. runs once with `""`. That run sends the request, because `readIf` reads storage itself and not the version;
2. runs again with the real version, which ignores the first answer and sends the request again.

The probe above shows the effect running twice (`["empty","stored"]`). Before `458aae1` these effects had no such
dependency and ran once.

**Effect:** opening `/tasks/{id}/review` directly, or reloading it, sends `GET /work-queue/review` and
`/work-queue/adjudicate` twice each. The project Overview's Your work sends 4 × (active tasks) queue reads instead
of 2 ×. The Dashboard's last-task card runs its whole chain twice (`getTask`, `getProject`, the whole item list,
two queues). Client-side navigation is not affected.

**Fix:** have the server snapshot return `null`, and skip the gated effects while the version is `null`. Then a
hydrating page waits one render and asks once.

**Verified:** with the hydration probe (React's own `renderToString` and `hydrateRoot` in jsdom). Duplicate
requests in a real browser were not observed directly.

### 4. [Minor, new in `458aae1`] A just-accepted item keeps its old `rawStatus`, so reopening it shows no final answer until a reload

`finalisedItemId` now trusts `item.rawStatus` whenever the item has one (`task-item-workspace-sheet.tsx:1542-1548`).
After an Accept, the panel's optimistic item only changes `status` (`applyTaskItemTransition`,
`lib/task-format.ts:371-372`). `rawStatus` stays, for example `"submitted"`, and `onItemUpdated` puts that item
back into the list.

**Failure scenario:**
1. On Items, Bob accepts a single-review item, which becomes `canonicalized`.
2. The panel closes, and Bob opens the item again from the list before any reload.
3. Item details no longer asks for the final answer or the releases, because the stale `rawStatus` is truthy and
   not `canonicalized`. Before `458aae1`, it did ask.

**Fix:** set `rawStatus` with the transition. Or, when a `status` and its `rawStatus` disagree, fall back to the
mapped status.

**Verified:** by code reading only.

### 5. [Non-blocking] Seven of the eight re-reads have no test

Jingwei's comment says "every fix has a test that fails without it". For point 1, only the Review queue's does.
Removing `contextsVersion` from the other seven places at once leaves all 1006 tests green (see Runs). Since they
share one pattern, one or two more tests would do: the Annotate queue, and `useProjectDisputePage`.

### 6. [Minor] A held split shows the wrong words to someone who cannot route it

Unchanged:
- `dispute-case-detail.tsx:466` tells a reader who can't route (an admin or task owner) "...or it can be routed to
  a dispute below", with nothing below.
- `task-dispute-desk.tsx:78` offers "Settle or route" to anyone with DISPUTE, but settling needs REVIEW
  (`review_actions.py:1662`).

### 7. [Non-blocking] New per-task reads, and dead code

Unchanged:
- "Your work" makes two queue reads per active task (`project-overview-sections.tsx:77-82`).
- The last-task card reads the whole item list to find one item (`last-task-card.tsx:99`).
- `components/entity-filters.tsx` is imported nowhere.

## The count endpoint, for SCRUM-121's reuse

Unchanged by `458aae1`. `GET /organizations/{org_id}/task-item-counts` (`routes/organizations.py:342-372`) and
`loadTaskItemCounts` (`lib/project-data.ts:152-160`) are **safe to reuse** in `getProjectWorkspaceView`:

| Question | Answer |
| --- | --- |
| Does it equal setup's `data_plane.item_count`? | **Yes.** Setup counts `TaskService.list_task_items(task_id)` (`task_setup_service.py:85-93`), which is every `TaskItemDB` row with that `task_id`, with no status filter (`db_store.py:1478-1486`). The send-back resolution after it rewrites statuses but never drops items. The endpoint is `COUNT(TaskItemDB.id)` grouped by task, with the same filter. Neither tasks nor items have a soft delete |
| A task with no items | Listed at 0 (`outerjoin`), and the test pins it. On the web, `get()` returns 0 and `??` keeps it |
| An organisation with many tasks | One `GROUP BY` query, no pagination, one row per task in the organisation. The project page takes its own tasks, so it is still one request |
| A member without project access | There is no project-level access. Listing tasks (`verify_user_project_access`) and this endpoint (`verify_user_org_access`) both check organisation membership. Project-scoped roles grant nothing either way |
| A removed member | 403. The token's organisations are checked, then a live membership in the database (`permissions.py:184-216`). No test covers the removed case, but it is the shared check `list_projects` uses |
| A failed read | `null` if any organisation's read fails. Each task then falls back to `resolveTaskBacklogCount`, so it fails safe. A task the map lacks falls back on its own |
| Side effects | None. The setup read runs the expert send-back repair (a write); the count read doesn't. That is what A6 wants |

For commit 5 of SCRUM-121:
- Both current callers start the count read **after** their task lists (`project-data.ts:353`,
  `organization-page-client.tsx:142`).
- No test pins parity with setup's `item_count`. A short API test in SCRUM-121 would make the reuse explicit.

## The other API changes (unchanged since the first pass)

- **`GET /auth/me/organizations`** (`auth.py:127-138`): returns login's own list (`load_org_contexts`). Read-only,
  no token. Correct.
- **Revoke** (`admin_service.py:886-925`, `db_store.py:590-609`):
  - It now saves the revocation, in one commit with the audit row.
  - It refuses another member's role (404) or an already-revoked one (409).
  - The tests fail without these checks.
- **Finalised items** (`review_actions.py:2246-2331`):
  - `final_answer` and `decided_by` come from the item's one authoritative annotation (unique index
    `uq_annotations_one_authoritative_per_item`), read in one query.
  - `lib/decided-by.ts` names all four `AUTHORITATIVE_CAUSES`.
- **Correction of a bare `{label}`** (`review_corrections.py:110-131`): a canonical object with a `kind` is read
  first, and a plain label still replaces the label. Correct.

## DIQI26's (Yi's) points

| # | Point | At `de06a867` | At `458aae1e` |
| --- | --- | --- | --- |
| 1 | A skipped read doesn't retry after a role grant | Open (only `useCanCreateProject` fixed) | **Fixed** in every place listed above. The Review queue's test fails without it; the other seven are untested (finding 5). A double request on hydration is new (finding 3) |
| 2 | Continue opens nothing when the last item is finalised | Open | **Fixed.** When the item is `canonicalized` or `unresolved`, Continue goes to the first next item, or to the page (`last-task-card.tsx:184-186`). Two tests fail without it |
| 3 | The Annotate badge counts rows not open to the viewer | Fixed in `5f7e400` | Fixed. Its test fails without it |
| 4 | The panel asks for a finalised outcome on held items | Open | **Fixed** for items read from the API: only `rawStatus` `canonicalized`/`unresolved` asks (`task-item-workspace-sheet.tsx:1542-1548`). Its test fails without it. Stale after an optimistic Accept (finding 4) |
| 5 | `app-shell.test.tsx` calls the real API | Open | **Fixed:** `getMyOrganizations` is mocked (`app-shell.test.tsx:25-32`), and a new test asserts the mock is called |

## Merge conflicts with `main`

None. The branch contains `main` at `efb5900`, and `git merge-tree` exits 0.

The open SCRUM-121 branch overlaps in two places:
- `review_actions.py`, in different functions;
- `lib/project-data.ts`, whose commit 5 waits for this PR.

---

## Ready-to-post GitHub review (Request changes)

**Posted 2026-10-23 12:28 UTC as a Comment review, not Request changes (Hanchen's choice), at head `458aae1e`:**
https://github.com/USYD-CS-Capstone/hej/pull/97#pullrequestreview-5628209148. Two sentences were changed before
posting so they make no commitment for Hanchen: "I will confirm the scope separately" became "the scope needs
agreeing separately", and "I'll pick these up in the performance ticket" became "Both could go to a later
performance follow-up". Paragraphs were unwrapped for GitHub. The text below is the draft before those changes.

> Thanks, Jingwei. This is a big, careful piece of work, and `458aae1` closes Yi's points well. I took each new fix
> out one at a time, and each made its test fail:
> - the Review queue re-reading after a role grant;
> - Continue on a finalised item;
> - no finalised read on held items;
> - and, from the earlier commits, the revoke checks, the create-project listener and the Annotate badge.
>
> The new `useOrganizationContextsVersion` is sound. It subscribes to both events, cleans up both, and keeps a
> stable string snapshot.
>
> **Ran at `458aae1`** (fresh worktree): web 108 files and 1006 tests, `tsc` clean, lint 0 errors and 38
> warnings. At `de06a86`, the API was 2539 passed and 63 skipped, and the casebook 87/87. `458aae1` changes no API
> file. It merges cleanly with `main` at `efb5900`. CI skipped all three jobs.
>
> **Before approval**
>
> 1. **Setup still offers two actions the API refuses without MANAGE_TASK:**
>    - **Save model** (`task-ai-model-configuration.tsx:183`, `PUT /projects/{p}/tasks/{t}`);
>    - the dataset intake on a draft task (`task-setup-read-panel.tsx:168`, `POST .../dataset-registration`).
>
>    Setup is visible to every role, so an annotator can press Save model and get a 403. It was like this on `main`
>    too, but it is what the role audit set out to remove. Gating both with
>    `useHasGovernedAction(..., "manage_task")`, as Pause/Complete already are, would fix it.
> 2. **The ticket's paperwork:**
>    - the list of the design review's findings taken and left, one line each, including why D1 (dark mode off)
>      was left;
>    - before and after screenshots for the pages touched;
>    - the title: it says "seven bugs", the body says eight. The merge commit keeps the title, so please set it
>      before merging.
>
>    Because the PR goes beyond the ticket (new components and layouts), I will confirm the scope separately.
> 3. **Every gated read is now sent twice on a full page load.** `useOrganizationContextsVersion()` is `""` while
>    hydrating and the stored login just after. Each effect that lists it runs twice, and `readIf` sends the
>    request both times. A small hydration test (server render, then `hydrateRoot`) shows the effect running with
>    `""` and then with the login. On a reload of Review, that is two `/work-queue/review` and two
>    `/work-queue/adjudicate`; Your work doubles to four reads per active task. A `null` server snapshot, with
>    the effects waiting while it is `null`, would make it one.
>
> **Smaller, non-blocking**
>
> - After an Accept, the panel's item keeps its old `rawStatus` (`applyTaskItemTransition` changes only `status`).
>   So an item that just became canonical, opened again before a reload, no longer loads its final answer
>   (`task-item-workspace-sheet.tsx:1544`).
> - Only the Review queue's re-read has a test. With `contextsVersion` removed from the other seven places, the
>   suite still passes. One test for the Annotate queue and one for `useProjectDisputePage` would cover the
>   pattern.
> - `use-known-to-lack-actions.ts:43` hard-codes the storage key. Exporting `ORGANIZATION_CONTEXTS_KEY` keeps the
>   two from drifting.
> - On a held split, someone who can't route reads "...or it can be routed to a dispute below" with nothing below
>   (`dispute-case-detail.tsx:466`). A dispute participant is offered "Settle or route"
>   (`task-dispute-desk.tsx:78`), but settling needs REVIEW.
> - `components/entity-filters.tsx` is no longer imported anywhere.
> - "Your work" makes two queue reads per active task, and the last-task card reads the whole item list for one
>   item. I'll pick these up in the performance ticket.
>
> The new `task-item-counts` endpoint is good. It counts exactly what setup's `item_count` counts, a task with no
> items comes back as 0, and it follows the same membership rule as listing the tasks. I'll reuse it for the
> project page in SCRUM-121 once this merges.

---

## Not raised on the PR

For Hanchen only.

**Decided by Hanchen, 2026-10-23: the scope beyond SCRUM-128 is accepted.** Said on the PR by editing the posted
review: "the scope needs agreeing separately" became "I accept that wider scope for SCRUM-128; the findings list and
the screenshots above are its written record."

1. **Scope decision.** SCRUM-128 was a 2-point declutter: "not a redesign ... no new component, layout or colour".
   The PR is a page-by-page redesign with a role audit. The code is sound and Yi walked every role through it, so
   the question is whether to accept the scope as is (with the findings list and screenshots as the written
   justification `mission.md` asks for), or to ask for anything to be split out. The 2u estimate no longer
   matches the size, which matters for the tracker.
2. **Refreshed roles versus the token.** `GET /auth/me/organizations` reads memberships from the database. The API's
   tenant scope is the token's organisations (`get_current_user` reads `orgs` from the JWT, and `/auth/refresh`
   keeps them). Suppose someone joins an organisation without this browser replacing its token, for example by
   accepting an invitation in another browser. The refresh then stores that organisation and the web offers its
   actions, while every route answers 403 until the next sign-in. In-app acceptance replaces the token, so this is
   an edge case.
3. **`load_org_contexts` reads four whole tables** (`security.py:113-133`). The web now calls it on every app load
   and on focus, at most every 30 s per tab. That is fine at demo scale and belongs with the performance ticket.
4. **Finding 1 is pre-existing.** If you would rather not hold #97 for it, it can be a follow-up ticket. Findings
   2 and 3 are the ones I would still hold the merge for.

The worktree `D:\COMP5703_Capstone\hej-review-97` is left in place, detached at `458aae1e`, with a clean
`git status`. `node_modules` came from `npm ci` at the first pass, and the casebook report from the first pass is
in the ignored `evaluation/reports/`.
