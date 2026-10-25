# New ticket — retire the `expert_send_back` item status (2026-10-23)

**Created in Jira by Hanchen, 2026-10-23 22:43, as SCRUM-134** (To Do, no sprint; `Jira.csv` of 23:44).

**Decided by Hanchen (2026-10-23):**
- **Only the status value goes.** The item-level escalation records (`TaskItemEscalationDB`), their read routes
  and the Return evidence functions stay.
- **No user story.** It is cleanup under the epic Review, Dispute & Adjudication.
- **Left for the team that takes over:** no sprint, no assignee. It starts after SCRUM-121 merges.
- **Development databases are reset** (`init_data.py --reset`, the project's rule since SCRUM-94). No migration.

**Why.** Found while building SCRUM-121 (A6, plan `../plans/plan-SCRUM-121.md`). Nothing in the app can produce
`expert_send_back` any more. The web already shows it as `returned`. The value is a third name for one state, and
a developer reading the status enum, the filters or the docs would take it for a live workflow.

**Checked 2026-10-23 on `main` `efb5900`:**
- **Today's expert Return stores `returned`.** Since #48 (SCRUM-99), an expert decides a dispute over one answer
  (`AnnotationDisputeDB`). The decision records `adjudicate_decision = "return"`, then sets the item's status from
  `item_status_after_accept` (`annotation_dispute_service.py:542`). The answer is back with its author, so the
  aggregate is `returned`, as after a reviewer's return. SCRUM-121's
  `test_an_expert_return_and_its_resubmission_show_on_the_next_read` pins it.
- **The only producers are legacy:**
  - `item_status_after_accept` returns `expert_send_back` (`review_policy_enforcement.py:431`) only when
    `current_expert_send_back_at_by_submission` finds Return evidence. It reads only item-level escalation rows,
    `escalation_decided` audits and legacy `adjust` rows;
  - `decide_escalation` writes it directly (`review_actions.py:1985-1986`, mapping at `:246`).

  Both writers of that evidence are retired. `POST .../escalations/route` (`retired_route_escalation`, `:1065`) and
  `POST .../escalations/decision` (`retired_decide_escalation`, `:1805`) answer 410. Only tests call
  `route_escalation` and `decide_escalation`.
- **The web already treats it as history.** `lib/api/status-mapping.ts:9`: "Historical `expert_send_back` records
  are shown as `returned` for legacy reads". It maps it to `returned` (`:36`).
- **Who returned an answer is not lost.** The dispute keeps `adjudicate_decision` and `adjudicate_return_target`,
  and provenance records an `adjudicated` event.
- **The seed holds none.** A fresh `init_data.py --reset` has no item in `expert_send_back`, no escalation row and no
  `escalation_decided` audit.

| Where `expert_send_back` appears on `efb5900` | Files |
| --- | --- |
| API code: `domain.py:75` (the enum), `db_models.py:544` (comment), `task_service.py:317` (`WORKFLOW_OWNED_TASK_ITEM_STATUSES`), `review_policy_enforcement.py:431`, `review_actions.py:246`, `:1986`, `task_item_status_resolution.py` (the constant, and `:318` in the legacy `adjust` check) | 6 |
| API tests (34 of the mentions in `test_independent_second_review.py`; SCRUM-121 removes some) | 12 |
| Web code: `status-mapping.ts`, `task-items.ts:31`, `:272`, `task-workspace-data.ts:115`, `project-workspace-overview.tsx:47` (the "Expert send-back" filter), `task-annotation-workspace.tsx:51` (its initial filter) | 5 |
| Web tests | 7 |
| Docs: `workflow_states.md`, ADR 010, ADR 014, `ai_batch_job_schema.md` | 4 |
| Casebook | 0 |

#97 (SCRUM-128) rewrites `project-workspace-overview.tsx`, `task-annotation-workspace.tsx` and
`task-workspace-data.ts`, so find those lines again when the ticket starts.

---

## Board steps

| Field | Value |
| --- | --- |
| Type | Task |
| Epic | Review, Dispute & Adjudication (SCRUM-14) |
| Sprint | **None**: handover backlog |
| Assignee | **Open** |
| Story points | **2** suggested: about 34 files, mostly mechanical; one aggregate rule changes |
| Linked | "is blocked by" SCRUM-121; "relates to" SCRUM-99 |

## Summary

```
Cleanup: Retire the expert_send_back item status
```

## Description

```
{noformat}Not tied to a user story: cleanup after the two-level disputes (PR #48).

BACKEND + WEB + DOCS. Handover backlog. Added 2026-10-23 (Hanchen). Start after SCRUM-121 (the A6 reads PR) has merged: it deletes the read-time repair, which is most of what still uses this status.

Since PR #48, an expert's Return stores the item as "returned", as a reviewer's return does. "expert_send_back" can now come only from item-level escalations, whose routing and decision routes answer 410. The web already shows it as "returned" (status-mapping.ts). Remove the value, so the statuses say one thing.

# TaskItemStatus has no EXPERT_SEND_BACK (models/domain.py), and nothing writes or matches the string: the task_items.status comment in db_models.py, WORKFLOW_OWNED_TASK_ITEM_STATUSES in task_service.py, and the constant in task_item_status_resolution.py.
# What wrote it writes "returned" instead, because the answer is back with its author:
#* item_status_after_accept (review_policy_enforcement.py), where held rounds are released by Return evidence. Update its docstring;
#* decide_escalation's Return branch and _map_escalation_decision_to_task_item_status (review_actions.py). The function is no longer a route, but tests build legacy escalations with it, so it stays.
# What matched it matches "returned": the legacy adjust check in current_expert_send_back_at_by_submission (it accepts annotated or expert_send_back today). Every Return evidence test must still pass.
# Web: the status type (lib/api/task-items.ts), RESUBMIT_STATUSES, status-mapping.ts and its comment, task-workspace-data.ts, the "Expert send-back" filter on the project overview and the Annotate page's expert_send_back initial filter. Each screen still lists the same items: they were already shown as returned.
# Docs: workflow_states.md and ai_batch_job_schema.md drop the status. ADR 010 and ADR 014 keep their text and gain a dated note that the status was retired.
# Tests: the API and web tests that set or expect expert_send_back expect returned, or go where they tested only the old value. Add one test that an expert's Return through a legacy escalation now stores returned.
# Existing data: development databases are reset (init_data.py --reset). No migration. Say so in the PR.

Done when `git grep expert_send_back` on main finds only the ADR notes; the backend suite passes on SQLite and PostgreSQL; test:web, typecheck:web and lint:web pass; and the casebook passes unchanged.

Out of scope: the item-level escalation records (TaskItemEscalationDB), GET /tasks/{id}/escalations and its web client, route_escalation and decide_escalation, and the legacy evidence branches in current_expert_send_back_at_by_submission.

Collaboration:
- SCRUM-121 (A6): merges first.
- SCRUM-99 (E3): the two-level disputes this finishes; its tests in test_independent_second_review.py change.{noformat}
```

---

## Open point for Hanchen

- **How it reaches the next team.** With no story, it isn't in `story_src.csv` or `user-stories.html`, which carry
  the handover backlog. Without our board, the team would have to find it elsewhere, for example in the handover
  notes.
