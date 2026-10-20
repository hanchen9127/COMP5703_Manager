# SCRUM-91: who may create a project — a project manager (task owner) as well as an administrator

2026-10-20. **Decided by Hanchen**, following Jingwei's comment on PR #89 and review of PR #91: the task owner keeps
`manage_project`, as the client's design docs say (`system_design.md` §9.1 "Task owner creates Project"; the
workflows doc §2, the Task Owner / Manager "configures projects"; story B1's "As a project manager"). The phrase
"those where they are an administrator", added in this ticket's 12 Oct update (`../../W9/jira/jira-scrum-91-org-selector.md`),
was ours, not the client's, and is withdrawn. Yi's finding 1 on #89 (move `create_project` to
`MANAGE_ORGANIZATION`) is superseded; finding 2 (an organisation switch discards the chosen policy) stands.

Based on the board export of 2026-10-19 18:13 (`../../../shared/Jira.csv`, updated 18 Oct). If the description on the
board has changed since, keep its later text and apply only the changes listed below.

## Board steps

| Field | Change |
| --- | --- |
| SCRUM-91 description | **Replace** with the block below. What changes: the fourth criterion, build steps 2 and 5, and a new *Updated 2026-10-20* paragraph at the end |
| Story points, sprint, assignee | Unchanged: 1 point, W10, Tim |
| PR #89 | Tell Tim on the PR (or in Discord) that the ticket changed, pointing to Jingwei's comment |

## The new description

```
Related to user story B1

Projects hold related work — the client's example is an "Autonomous Driving"
project carrying several annotation and evaluation tasks. The capability
largely exists; what is missing is the organisation scoping and the proof of it.

I can create a project and see it listed in my organisation.

A project belongs to exactly one organisation and is visible only to that organisation's members.

I can open a project and see the tasks inside it.

When I may create projects in several organisations, I choose which one owns the new project.

Scope note worth putting on the ticket: this is hardening, not net-new. The work is confirming POST /organizations/{org_id}/projects scopes to the caller's org, a test that a project in org A is invisible to org B, and making project-create-form.tsx surface real validation errors. Pairs with SCRUM-45, which does update/archive on the same object.

Updated 2026-10-01: W9 (moved from W10), 0.5 points. Verify first: the records count B1 complete. Check each criterion on main, record the result here, and close the ticket if all hold. Otherwise build only the gap — most likely the cross-organisation test (a project in org A is invisible to a member of org B) and the create form showing the API's validation errors.

Updated 2026-10-12, 1 point. Found by reading the form, not yet run in the app: the Create project form cannot choose the owning organisation. project-create-form.tsx takes organizations[0] as primaryOrganization (line 94) and shows it as read-only text under "Owning organization"; the project is created in that organisation only (line 260), the organisation's default review policy is read from it alone (line 175), and the line "Only one eligible organization is available." is fixed text, shown whatever the number of organisations. The seed makes alice an administrator of both acme-corp and techstart-inc (init_data.py), so she can only ever create projects in whichever comes first, "Acme Corporation".

Build the gap:
# Reproduce it first, in the running app, as alice, and check what GET /organizations returns for her. If the API returns only one organisation, the gap is in the API, not the form — record that here and fix there.
# "Owning organization" is a Select (the one in packages/ui) listing the organisations the caller may create projects in, that is, those where they hold manage_project: an administrator or a project manager (task owner). Decide it from the capability, not the role name, so the form and the API cannot drift apart. The first is selected by default, so a single-organisation user sees no change.
# Choosing another organisation creates the project there, and the form reloads that organisation's default review policy (adr002) unless the user has already chosen a policy preset. The "Only one eligible organization is available." line shows only when there is exactly one.
# The API refuses a create in an organisation where the caller lacks the right, with 403, whatever the form offered: the list is a convenience, not the guard (SCRUM-91's first check).
# Tests: a caller who may create projects in two organisations can create a project in the second, and it is listed there and not in the first; the policy default follows the selected organisation, and a preset or custom values the user chose survive a switch; a project manager (task owner) who is not an administrator is offered the organisation and can create a project in it; a caller who is only a member of an organisation is not offered it and is refused by the API.

Updated 2026-10-20, team decision (Hanchen). Creating a project needs manage_project, which an administrator and a project manager (task owner) both hold; create_project keeps that check. "Those where they are an administrator" in the 12 Oct update is withdrawn: the client's design docs give project creation to the task owner (system_design.md §9.1; the workflows doc §2), and story B1's persona is the project manager. The permission rework (SCRUM-127, PR #91) keeps this rule.
```

## At the next weekly sync, not now

- `roadmap.md`, W9 group 8: SCRUM-91's row says "verify B1"; add that creation is open to whoever holds
  `manage_project` (2026-10-20).
- `story_src.csv`, B1: no change needed. Its story and criteria already say "project manager", now written
  "project manager (task owner)" (terminology unified 2026-10-20).
