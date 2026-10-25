# SCRUM-134 — widened to retire every legacy state (2026-10-25)

**Drafted by Claude for Hanchen, 2026-10-25. Replaces SCRUM-134's summary and description on the board.**
**Applied on the board by Hanchen, 2026-10-25, after #102 merged** (`ab45720`, 12:02, by Yi).

**Decided by Hanchen (2026-10-25):**
- **Widen SCRUM-134 instead of filing a handover ticket.** Jingwei's review of #102 showed that retiring
  `expert_send_back` left the item-level escalation flow that produced it. The draft
  `jira-new-retire-legacy-item-escalations.md` is superseded and is not created.
- **Delete everything the current workflow design does not describe.** No workflow or story behaviour may change;
  each visible API difference was decided one by one (below).
- **No migration.** A database written before #102 is reset (`init_data.py --reset`).

---

## Board steps

| Field | Value |
| --- | --- |
| Summary | Replace with the text below |
| Description | Replace with the text below |
| Story points | **3** suggested (was 1): 17 commits, about 90 files, net −3,000 lines; holds, the release gate, independence and the export were each proven unchanged |
| Sprint / assignee | Unchanged (W11, Jason Wang) |
| Linked | Remove nothing. "relates to" SCRUM-99 and SCRUM-74 (I5's integrity checks change) |

## Summary

```
Cleanup: Retire the legacy item escalations and the states they left
```

## Description

```
{noformat}Not tied to a user story: cleanup after the two-level disputes (PR #48) and A6 (PR #98). PR #102.

BACKEND + WEB + EVALUATION + DOCS. Widened on 2026-10-25 (Hanchen) after the review of PR #102: it first retired only the expert_send_back status, which left the flow that produced it.

Since PR #48 a reviewer's escalation opens an annotation dispute, and an expert decides that dispute. The older item-level escalation (TaskItemEscalationDB) had no route that reached it, and a fresh seed held none of its rows, yet holds, the release gate, the queues, independence, the export and casebook check I5 still read it. Retire it and every legacy state it left, so the code and the design describe one way to escalate. No workflow or story behaviour changes.

# The expert_send_back item status goes: an expert's Return stores returned. The web drops it from the status type, the mappings and the project overview.
# The item-level escalation flow goes as a whole: the task_item_escalations table and TaskItemEscalationDB; route_escalation, decide_escalation and their two 410 routes; GET /tasks/{id}/escalations and its detail; the Escalation* schemas; the escalation_routed and escalation_decided history wording; and every read of the table. reset_db drops the table before drop_all, so an older database can still be reset.
# An expert's Return is read only from the dispute's decision. task_item_status_resolution.py (current_expert_return_at and the legacy Return evidence) goes.
# Reviews with no verdict (legacy_approved_by, the stopped outcome, the verdict-or-status fallbacks) and submissions with no sample row (submission_is_sampled) are no longer read. A gate test first proves every submission path writes a sample row.
# The pre-B4 task status backfill (migrate_legacy_task_statuses) and the four retired review mutation routes go.
# Web: the unused escalation client and the approve/reject/escalate item helpers for routes the API never had.
# Visible API differences, each decided: the escalation list and detail answer 404; the 410 stubs answer 404 or 405; the export's always-null finalization key and the adjustment read's always-null routed_at and routed_by are removed; task history keeps its open_escalations count, which counts open annotation disputes.
# Tests: a test that checked only a removed state goes; a test that used the old flow to set up a live rule is rebuilt through the dispute flow. Each commit lists both groups.
# Docs: workflow_states.md, api_surfaces.md, db_schema_blueprint.md and the READMEs describe the dispute flow only. ADR 010, 011, 013 and 014 keep their decisions and gain a dated note.

Done when git grep for TaskItemEscalationDB, task_item_escalations, route_escalation, decide_escalation, escalation_routed, escalation_decided, current_expert_return_at, legacy_approved_by, migrate_legacy_task_statuses and LEGACY_REVIEW_MUTATION finds only the ADR notes, the README's reset paragraph and the drop in reset_db; the backend suite passes on SQLite and PostgreSQL; test:web, typecheck:web and lint:web pass; the casebook passes unchanged; and a fresh seed holds none of the legacy data.

Out of scope: the live reviewer escalation (it opens an annotation dispute), the export's format=legacy, the "legacy" annotation type, and the SQLite schema helper in database.py.

Collaboration:
- SCRUM-99 (E3): the two-level disputes this finishes.
- SCRUM-74 (I5): its integrity checks stop reading escalations; the casebook result is unchanged.{noformat}
```

---

## Not ticketed

- **Two issues found while building, outside this PR.** `decide_annotation_dispute` checks independence before
  taking any lock and locks only the dispute row, so a review committed while an expert decides may go unseen by
  the check; and the `annotation_dispute_adjudicated` history entry lists `decision` as a change although its
  summary states it. Both predate #102. **Decided 2026-10-25 (Hanchen): no ticket.** They are recorded in
  `../plans/plan-SCRUM-134.md` and in #102's "Notes for reviewers" only.
