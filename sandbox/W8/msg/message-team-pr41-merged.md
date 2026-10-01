# Team message — PR #41 merged (SCRUM-24, task lifecycle)

2026-10-01. PR #41 merged at 2026-09-30 14:30 UTC (`75c27f2`, CI green). Review and browser walkthrough:
`../../../reviews/W8/review-cs57-dishank-scrum-24-task-lifecycle.md`.

Why a team-wide message: this PR changes what everyone meets in the running app and in their tests, in the
break week that is meant for scenario testing. Nearly every dev task is still `draft`, and a draft task now
refuses all work until someone activates it. Open branches that create tasks in tests or scripts will start
failing with `409` once they merge `main`.

What the message relies on (checked):
- only `admin` and `task_owner` can activate, pause, resume or complete (`MANAGE_TASK`; an annotator gets
  a `403` naming those roles);
- the backfill runs when the API starts, on PostgreSQL and SQLite: `ready` / `in_review` / `disputed` →
  `active`; `draft` stays `draft`;
- #39 on top of `main` now: 14 evaluation tests fail at step 1 with the draft refusal (41 pass on #39 alone);
- #42 conflicts in `uploads.py` and `database.py`; Dishank offered to help;
- #43 / #44 merge cleanly, but their walkthrough helpers (`seed_test_roles.py`, `sandbox-SCRUM-48.py new`)
  need an activate step — Hanchen's own to-do, not in the message.

Cut to a third of the first draft at Hanchen's request (2026-10-01). Dropped from the message and left to
the PR description: the delete policy, inline-mode timing, the notes for Michael, Kanishka and Tim, and the
annotate page's missing "not active" notice (a known gap with no owner yet).

---

## To the team channel

```
PR #41 (SCRUM-24, task lifecycle) is merged — thanks Dishank. Tasks now go draft → active → completed (pause/resume while active), and only ACTIVE tasks accept work: on a draft or paused task, drafts, reviews and disputes get 409.

To do:
1. Pull main and restart the API. Most dev tasks are still draft: an admin or task owner opens the task's Overview and presses "Activate task". Upload data first — intake closes once active.
2. AI-assisted tasks now run their AI pass on Activate, not on upload.
3. Scripts/tests: call POST /projects/{p}/tasks/{t}/activate after registering data; fixtures that insert a TaskDB need status="active".

@Jingwei #39: 14 evaluation tests fail on main until the harness activates its tasks.
@Yi #42 conflicts with main (uploads.py, database.py) — Dishank offered to help.
```

---

## As sent (2026-10-01, by Hanchen)

Hanchen's edits: opens with the approval, adds `@everyone` and "Before your next PR", and uses the chat
display names (William L for Jingwei, Ciro for Yi).

```
Thanks, Dishank. Approved and merged:
Tasks now go draft → active → completed (pause/resume while active), and only ACTIVE tasks accept work: on a draft or paused task, drafts, reviews and disputes get 409.

@everyone Before your next PR:
Pull main and restart the API. Most dev tasks are still draft: an admin or task owner opens the task's Overview and presses "Activate task". Upload data first — intake closes once active.
AI-assisted tasks now run their AI pass on Activate, not on upload.
Scripts/tests: call POST /projects/{p}/tasks/{t}/activate after registering data; fixtures that insert a TaskDB need status="active".

@William L  #39: 14 evaluation tests fail on main until the harness activates its tasks.
@Ciro  #42 conflicts with main (uploads.py, database.py)  Dishank offered to help.
```
