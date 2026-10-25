# New ticket — retire the legacy item-level escalations (2026-10-25)

**Drafted by Claude for Hanchen, 2026-10-25. Not yet created in Jira.**

**Superseded the same day:** Hanchen widened SCRUM-134 (#102) instead of filing this ticket. See
`jira-scrum-134-widened-2026-10-25.md`. Do not create it.

**Decided by Hanchen (2026-10-25):**
- **A handover ticket.** No sprint and no assignee. It starts after #102 (SCRUM-134) merges. It stays out of #102,
  which keeps its scope.
- **No legacy data.** As in SCRUM-134: development databases are reset (`init_data.py --reset`), so no row of the
  old flow survives. No migration.

**Why.** Found while answering Jingwei's review of #102. Retiring `expert_send_back` left the code that produced it.
That is the item-level escalation flow, from before the two-level disputes (#48). Nothing live writes it any more,
yet a dozen services still read its table, and about thirty test files build their scenarios through it. A
developer reading `submission_rules.py`, `release_gate.py` or the export would take it for a second, live way to
escalate.

**Checked 2026-10-25 on #102's head (`99db00ea`):**
- **One writer, and it is not a route.** The only `TaskItemEscalationDB(...)` is in `route_escalation`
  (`review_actions.py:1141`): "Unregistered compatibility helper for historical workflow tests". The routes
  `POST .../escalations/route` and `POST .../escalations/decision` answer 410. `decide_escalation` is called only by
  tests. After a reset, `task_item_escalations` is always empty, and so are the `escalation_decided` audits.
- **The live flow does not use it.** A reviewer's escalation opens an `AnnotationDisputeDB` at once (EV-130). An
  expert's Return is recorded on the dispute (`adjudicate_decision`, `adjudicate_return_target`).
  `current_expert_return_at_by_submission` reads only escalation rows and `escalation_decided` audits, so it is
  legacy as a whole.
- **The web never calls its client.** `listTaskEscalations` and `getTaskEscalationDetail` (`lib/api/review-actions.ts:398`,
  `:404`) are defined and tested, but no component imports them. The dispute desk reads the disputes.

| Where the legacy flow is read or written | What it does there |
| --- | --- |
| `routes/review_actions.py` | `route_escalation`, `decide_escalation`, the status mapping, the two 410 routes, `GET /tasks/{id}/escalations` and its detail (`:2030`) |
| `routes/tasks.py` | the export takes an approval and its approver from a resolved escalation (`:1021`–`:1350`, the query at `:1591`) |
| `services/submission_rules.py` | participation counts `routed_by` (`:163`); the judges union `legacy_adjudicators` (`:205`); open escalations hold an item (`:712`) |
| `services/release_gate.py` | an open escalation blocks a release (`:169`) |
| `services/task_item_status_resolution.py` | the whole of `current_expert_return_at(_by_submission)` and `_audit_send_back_timestamps` |
| `services/review_policy_enforcement.py` | a legacy open escalation holds the whole item (`:138`); refusals before a legacy escalation (`:228`, `:238`); `item_status_after_accept` reads the Return evidence |
| `services/independent_review_service.py`, `task_work_queue_service.py` (`:325`), `task_workflow_service.py` (`:84`), `annotation_dispute_service.py` (`:592`) | Return evidence, legacy escalation ids in the adjudication queue, the open-escalation count, the "resolve it before settling" refusal |
| `services/task_audit_log_query.py`, `task_history_recorder.py` | how an `escalation_decided` audit is shown in history |
| `models/db_models.py` (`:1166`), `schemas/review_actions.py` (`:138`–`:508`) | the table and the request/response models |
| `evaluation/harness/integrity.py` (`:99`, `:139`, `:272`, `:377`, `:515`, `:595`) | I5's checks read escalation rows and `escalation_decided` audits |
| Web: `lib/api/review-actions.ts`, `lib/api/task-history.ts:101` (`open_escalations`) | the unused client and a history count |
| API tests: 31 files, about 130 mentions (28 in `test_independent_second_review.py`) | many use the legacy flow only to set up a held or returned item for a live rule |
| Docs: ADR 010, 011, 014; `workflow_states.md`, `api_surfaces.md` | the flow as designed |

---

## Board steps

| Field | Value |
| --- | --- |
| Type | Task |
| Epic | Review, Dispute & Adjudication (SCRUM-14) |
| Sprint | **None**: handover backlog |
| Assignee | **Open** |
| Story points | **5** suggested: about 14 code files, 31 test files, and two of the rules it touches guard independence and releases |
| Linked | "is blocked by" SCRUM-134; "relates to" SCRUM-99 |

## Summary

```
Cleanup: Retire the legacy item-level escalations
```

## Description

```
{noformat}Not tied to a user story: cleanup after the two-level disputes (PR #48) and the retired expert_send_back status (PR #102).

BACKEND + WEB + EVALUATION + DOCS. Handover backlog. Added 2026-10-25 (Hanchen). Start after PR #102 has merged.

Before PR #48 an item could be escalated as a whole (TaskItemEscalationDB). Since then a reviewer's escalation opens an annotation dispute, and an expert decides that dispute. The old routes answer 410, and the only code that still writes an item escalation is route_escalation, a helper for historical tests. Development databases are reset (init_data.py --reset), so the table is always empty. Yet services still read it, and tests build their scenarios through it. Remove the flow, so there is one way to escalate.

# Reads that union the empty table drop it, one service per commit, with a test that the live source alone gives the same answer:
#* submission_rules.py: participation (routed_by), the judges (legacy_adjudicators) and the open-escalation hold. These guard independence: an adjudicator, settler or reconciler still may not judge again;
#* release_gate.py: an open escalation no longer blocks a release; open disputes still do;
#* review_policy_enforcement.py, task_work_queue_service.py, task_workflow_service.py and annotation_dispute_service.py: the item hold, the adjudication queue's legacy ids, the open-escalation count and the "resolve it before settling" refusal.
# Return evidence: current_expert_return_at, current_expert_return_at_by_submission and _audit_send_back_timestamps go. Their callers (item_status_after_accept, the blind status projection, the work queues) read only the dispute decisions.
# The export (routes/tasks.py) takes approvals only from reviews and dispute decisions.
# Routes and models: route_escalation, decide_escalation, the status mapping, GET /tasks/{id}/escalations and its detail, the two 410 routes, the Escalation* schemas and TaskItemEscalationDB. Dropping the table is a schema change: reset after pulling.
# History: task_audit_log_query.py and task_history_recorder.py stop special-casing escalation_decided.
# Evaluation: harness/integrity.py stops reading escalation rows and escalation_decided audits. The casebook result must not change.
# Web: listTaskEscalations, getTaskEscalationDetail, their types and tests; open_escalations in task-history.ts, if the API drops it.
# Tests: a test that used the legacy flow to set up a held, returned or adjudicated item builds it through the dispute desk, so the live rule it checks stays covered. A test that checked only the legacy flow goes. List both groups in the PR.
# Docs: workflow_states.md and api_surfaces.md drop the flow. ADR 010, 011 and 014 keep their text and gain a dated note.

Done when git grep for TaskItemEscalationDB, route_escalation, decide_escalation and escalation_decided on main finds only the ADR notes; the backend suite passes on SQLite and PostgreSQL; test:web, typecheck:web and lint:web pass; and the casebook passes unchanged.

Out of scope: the live reviewer escalation (it opens an annotation dispute, EV-130), the "escalated" round outcome, and the dispute desk.

Collaboration:
- SCRUM-134 (PR #102): merges first.
- SCRUM-99 (E3): the two-level disputes this finishes.
- SCRUM-74 (I5): its integrity checks change in harness/integrity.py.{noformat}
```

---

## Open points for Hanchen

- **The 410 routes.** Deleting them turns 410 into 404 for an old client. Nothing in the repo calls them, so the
  draft deletes them. Keep them if the handover should still say "retired" to an old caller.
- **How it reaches the next team.** As with SCRUM-134: with no story, it is not in `story_src.csv` or
  `user-stories.html`. The ticket map lists it once it has a number.
