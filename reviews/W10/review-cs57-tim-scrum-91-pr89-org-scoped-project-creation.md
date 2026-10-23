# Review — PR #89, `CS57-Tim` (SCRUM-91, story B1: organisation-scoped project creation)

<https://github.com/USYD-CS-Capstone/hej/pull/89> · reviewed 2026-10-20 at `8e3fabc` (3 commits, base `main` at `17469db`)

**Posted 2026-10-20 12:35 UTC as Request changes** on `8e3fabc`. The posted text is a condensed version of this file,
written to Tim, Yi and Jingwei. **A checklist comment followed at 12:37 UTC**: Yi's review, Jingwei's correction and
this review as one list for Tim, with Jingwei's version marked as the team's decision.

Read from GitHub first:
- **The PR is a draft** (it was open for review when Yi reviewed it).
- **Yi requested changes** at `8e3fabc` (06:06 UTC). There have been no commits since, so this review reads the same
  code.
- **Jingwei commented at 09:35 UTC**, correcting Yi's first finding.
- The PR is 57 commits behind `main`, and the textual merge is clean. CI cannot run (GitHub Actions billing).

Prior context read:
- the SCRUM-91 ticket as of 12 Oct (`sandbox/W9/jira/jira-scrum-91-org-selector.md`) and its 20 Oct correction
  (`sandbox/W10/jira/jira-scrum-91-who-may-create.md`);
- roadmap W9 group 8;
- the review of Tim's #74 (`review-cs57-tim-scrum-89-pr74-project-overview.md`).

There are no sandbox messages to Tim for W10.

**Decided 2026-10-20 (Hanchen), siding with Jingwei's comment:**
- creating a project needs `manage_project`, which `admin` and `task_owner` both hold;
- `create_project` keeps that check;
- the "administrator" wording in the ticket's 12 Oct update is withdrawn.

So Yi's first finding is replaced by point 1 below. Yi's second finding stands as point 2.

**Merge order:** #79 → #80 → #89 → #91. #80 also touches `organizations.py`, `test_project_policy_updates.py` and
`api_surfaces.md`. The text merges cleanly in either order, but #89 should re-run its suites after #80 merges.

## Verdict: request changes

The picker works:
- it creates the project in the chosen organisation;
- a lookup that comes back after the selection has changed is ignored;
- a failed policy lookup no longer leaves the form stuck.

The cross-organisation tests cover what the ticket's verification asked for. Three things to fix: who is offered an
organisation (point 1, the team's decision), the policy switch (Yi's point 2), and a load failure that reads as a
permission problem (point 3).

## Must fix

### 1. Offer every organisation where the caller holds `manage_project`, not only those where they are `admin`

This replaces Yi's first finding, following the 20 Oct decision.

**The problem:**
- `list_organizations` computes `current_user_is_admin` by matching the role name `admin`
  (`organizations.py`, around line 137).
- The form offers only those organisations.
- A task owner, who may create projects on `main` and under the decision, is shown "You must be an organization
  administrator to create a project" and can't use the form.

**Required:**
- **Backend:**
  - leave `create_project` on `MANAGE_PROJECT`;
  - compute the field from the capability, not the role name: `user_has_governed_action(current_user, org.id,
    GovernedAction.MANAGE_PROJECT, db)`. That function already applies the live-membership and current-role rules
    the create route uses, so the form and the API can't drift apart;
  - rename the field to say what it answers, for example `current_user_can_create_projects`. The admin-only filter
    on the old name would otherwise read as intended.
- **Form:**
  - filter on the new field;
  - make the empty-state line say what is missing, for example "You need project-management rights in an
    organisation to create a project."
- **Tests:**
  - **API:** a task owner who is not an administrator gets `true` for that organisation, and `create_project`
    succeeds there;
  - **API:** a plain member gets `false`, and is refused with 403, as `test_member_cannot_create_project` already
    checks;
  - **Form:** an organisation where the caller is not an administrator but may create projects is offered.
- **Docs and description:**
  - in `api_surfaces.md`, describe the field by the capability;
  - "Create or manage projects" stays `admin`, `task_owner`;
  - in the PR description, "enforced the organisation administrator check" becomes "the caller needs
    project-management rights in that organisation".

`MANAGE_PROJECT` keeps its name and its holders in #91 under the same decision, so this check survives the
permission rework.

### 2. Switching the organisation discards the policy the user chose (Yi's point 2)

Confirmed by reading the code. The Select's `onValueChange` sets `policyChosenRef.current = false` on every
organisation change, so the next lookup applies the new organisation's default over a preset or custom values the
user chose. The ticket says to reload "unless the user has already chosen a policy preset".

Required:
- leave `policyChosenRef` alone on an organisation change;
- add the two tests Yi listed: a chosen preset survives a switch, and custom values survive a switch.

### 3. A failed organisations request is reported as a missing role

In `loadOrganizations`, a failed `listOrganizations()` (`result.ok === false`) becomes `eligible = []`. The form then
says "You must be an organization administrator to create a project". So an API or network error tells the user they
lack a role, which sends them to the wrong person.

On `main`, the same case read "Live organization is required…", which was vague but not wrong. The ticket's scope note
asks the form to surface real errors rather than a generic failure.

Required:
- keep the request's failure apart from "no eligible organisation";
- show the failure's message (`result.error.message`) with `role="alert"`;
- add a test with `listOrganizations` failing.

## Nits (non-blocking)

- **Prettier** (Yi's point 3): run `npx prettier --write` on the two form files. For example,
  `onValueChange={(value) =>{` and the indentation of the new `role="alert"` paragraph.
- **Duplicate imports.** `test_project_policy_updates.py` lines 14–15 already import `update_project_in_org`,
  `update_project` and `update_project_policy`; the new block (lines 45–55) imports them again. Keep one block.
- **A listing check inside another test** (Yi's point 4). The `list_user_projects` assertion sits between
  `test_user_from_another_organization_cannot_update_project_policy`'s `pytest.raises` block and its own assertions.
  Move it into its own test, beside `test_user_cannot_read_project_from_another_organization`.
- **Mark the PR ready for review** when the fixes are in. It is a draft now.

## Verification

Run on a local merge with `main` at `17469db`, without committing (detached worktree
`D:\COMP5703_Capstone\hej-review-89` at the merge commit `fa440e6`):

- Backend, full, SQLite: `uv run pytest -q` → `2338 passed, 20 skipped, 209 subtests passed`.
- Web: `npm run test:web` → `76 files, 748 tests passed`; `npm run typecheck:web` clean.
- `npx prettier --check` on the two form files: both flagged.
- PostgreSQL: not run (no locking, JSONB or timestamp change in this PR).

---

## Round 2 — `e2043b9` (2026-10-23)

**Posted 2026-10-23 06:05 UTC as Request changes** on `e2043b9` (condensed version of this section).

**Must-fix 1 fixed by us (Hanchen, 23 Oct), not left to Tim.** Branch `pr89-switch-tests` in the worktree, on top of
`e2043b9`; only `project-create-form.test.tsx` changes. A helper `waitForOrganizationPolicy(8)` waits for the lookup
to settle, then both tests assert directly. With the fix: 17 passed. With the reset put back: both switch tests fail.
Web full: 69 files, 681 passed (branch, not merged with `main`); typecheck clean; Prettier clean. Commit message:
`../plans/commits/pr89-test-switch-keeps-policy.txt`.

**Then everything else, pushed to `CS57-Tim` on 23 Oct (`e2043b9..4046cd2`):**
- `9fbebf0` the switch tests (above);
- `b37f42f` the list error renders as `role="alert"`; the capability test opens the select and checks that the
  `false` organisation is not offered (each test fails with its change undone);
- `4046cd2` merge of `main` at `69ff0c3`, clean.

PR description edited ("administrator rights" → "project-management rights (`MANAGE_PROJECT`)", plus a follow-ups
section), and a comment posted for Tim:
<https://github.com/USYD-CS-Capstone/hej/pull/89#issuecomment-6358769255>. At `4046cd2`: web 78 files, 769 passed;
typecheck, Prettier, `git diff --check` clean; backend full, SQLite: 2489 passed, 21 skipped, 209 subtests (comment edited with it).

Read from GitHub first: Tim pushed one commit, `e2043b9`, on 22 Oct 23:17 UTC and commented on 23 Oct 00:12 UTC
that every checklist item is done, `main` is merged and both suites pass. The PR is no longer a draft. Review
decision: `CHANGES_REQUESTED` (Yi's and mine, both at `8e3fabc`). No other review since.

**The `main` merge was not pushed.** The branch head is `e2043b9`, whose parent is `8e3fabc`. It is still based on
`e95a3a7` and is 120 commits behind `main` (#75, #79, #80, #88, #90, #92, #94 not in it). I merged it locally instead
(below); it is clean.

### Checklist, item by item

| Item | At `e2043b9` |
| --- | --- |
| `create_project` stays on `MANAGE_PROJECT` | ✅ Unchanged |
| List field from the capability, renamed | ✅ `current_user_can_create_projects = user_has_governed_action(current_user, org.id, GovernedAction.MANAGE_PROJECT, db)`; schema, `ApiOrganization` and fixtures renamed. No open branch (#91, #93, #95–#97) uses the old name |
| Form offers every org with the field `true` | ✅ Both filters use the new field |
| API tests: task owner `true` and can create; member `false` and 403 | ✅ `test_invitations.py` adds a task owner of org 11 (`{11: True}`) and keeps the member at `False`; `test_task_owner_can_create_project` creates through the route; `test_member_cannot_create_project` stays |
| Form test: a non-admin who may create projects is offered | ✅ `offers organizations with project-creation capability`. Weak: it never checks that the `false` organisation is left out (see nits) |
| Policy survives an org switch | ✅ Code: `policyChosenRef.current = false` removed from `onValueChange`. ❌ **Tests don't pin it** (see below) |
| List failure shows its error | ✅ `organizationListError` replaces the helper line; test `shows the organization-list error` (by reading: `8e3fabc` showed the "administrator" line instead, which the test also rules out). Shown as grey helper text, not `role="alert"` (nit) |
| Empty-state line | ✅ "You need project-management rights to create a project." |
| `api_surfaces.md` | ✅ Describes the field by `MANAGE_PROJECT`, "admins and task owners"; capability table untouched |
| PR description | ❌ Still says "The API checks that they have administrator rights in that organization" |
| Prettier | ✅ Clean (`--end-of-line auto`; a plain `--check` on this Windows CRLF checkout flags every file, `main`'s too) |
| Duplicate imports, listing check in its own test | ✅ Lines 14–15 removed; `test_user_from_another_organization_cannot_list_project` |
| Merge `main`, re-run | ⚠️ Run locally by Tim, not pushed |

### The two policy-switch tests pass with the bug put back

Probe: re-add `policyChosenRef.current = false` in the organisation `onValueChange` and run
`project-create-form.test.tsx`. **All 17 tests pass**, including *keeps a chosen preset when switching
organizations* and *keeps custom policy values when switching organizations*.

Cause: both tests switch to TechStart and then `waitFor` the expected values. `waitFor` returns at the first passing
check, which is the render right after the switch, before TechStart's mocked `getOrganizationDetail` resolves. The
default that would overwrite the choice arrives after the assertion.

With two lines added to each test after the switch, waiting for the lookup to settle:

```ts
await waitFor(() => expect(mockedGetOrganizationDetail).toHaveBeenCalledWith(8))
await waitFor(() => expect(screen.getByRole("button", { name: "Create project" })).toBeEnabled())
```

- with the fix: both pass;
- with the bug put back: both fail (preset text, and approvals value).

The probe edits were reverted; the worktree is clean.

### Overlap with #97 and #91

- **#97** (Jingwei, SCRUM-128) "bug 7" adds its own organisation choice to `project-create-form.tsx`, from the
  login's `actions` (`knownToLackActions(..., ["manage_project"])`). A trial merge with #89 conflicts in four hunks of
  that file. #97's description already says "whichever PR merges second keeps one choice".
- **#91** (Yi, SCRUM-127): one-line conflict in `organizations.py`'s import (`user_has_governed_action` against
  `user_manages_any_organization`); keep both.
- The agreed order (#79 → #80 → #89 → #91) puts #89 next, so #97 and #91 resolve against it.

### Not raised (checked, fine)

- `user_has_governed_action` also needs the organisation in the JWT's contexts. Someone who joins an organisation
  after logging in sees it listed with `false` until they log in again; `create_project` refuses them the same way, so
  the form and the API agree.
- In `loadOrganizationDefault`, a rejected request after a policy is chosen would leave the policy spinner on. The
  API client never rejects (errors come back as `ApiResult`), so it can't happen.

### Verification

Local merge of `e2043b9` with `main` at `69ff0c3`, not pushed (worktree `D:\COMP5703_Capstone\hej-review-89`,
merge commit `d7119e4`): clean.

- Backend, full, SQLite: `uv run pytest -q` → `2489 passed, 21 skipped, 209 subtests passed`.
- Web: `npm run test:web` → `78 files, 769 tests passed`; `npm run typecheck:web` clean.
- `npx prettier --check --end-of-line auto` on the form, its test and `organizations.ts`: clean.
- `git diff --check origin/main...e2043b9`: clean.
- PostgreSQL: not run (no locking, JSONB or timestamp change).

### Verdict: request changes (small)

The code is done; every point of the checklist is fixed in the code. Two things are left before approval:
1. the two policy-switch tests wait for the lookup, so they fail without the fix;
2. the PR description drops "administrator rights".

Pushing the `main` merge is also asked for, so the PR shows what was tested.

Next (Hanchen, 23 Oct): wait for Yi to approve before approving or merging #89.
