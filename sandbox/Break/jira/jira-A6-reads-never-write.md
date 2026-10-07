# New ticket — A6's remainder: reads never write, and the project page counts once

2026-10-06. **Decided by Hanchen:** A6 stays `working` until its criteria 3 and 4 are delivered. SCRUM-119 (PR #54,
merged 2026-10-06) delivered criteria 1, 2 and 5 for the drafts read, and left A6 subtasks 3 and 4 out of scope
(`jira-perf-investigation.md`). This ticket takes them, so A6 has a ticket for everything it promises.

Placement notes:
- **Subtask 4 is not added to SCRUM-89 (J2, Tim).** The perf plan put it "with SCRUM-89" in W9, but SCRUM-89 is In
  Progress and its description never took it. This ticket owns it, with a collaboration line.
- **Subtask 3 waits for SCRUM-99.** SCRUM-99 decides whether `expert_send_back` survives once `send_back` becomes
  Return. If it doesn't, the read-path repair is deleted rather than moved.

## Board steps

| Field | Value |
| --- | --- |
| Type | Task |
| Summary | `Performance: Reads never write, and the project page counts its tasks once` |
| Sprint | W10. Fallback W11, if SCRUM-99 has not merged by the W10 meeting |
| Points | 2 (five subtasks; risk: it moves status writes that SCRUM-99 also changes) |
| Assignee | Picked at the W10 meeting |
| Parent / links | Epic: Trustworthy Foundations (A). "Is blocked by" SCRUM-99; "relates to" SCRUM-89 and SCRUM-119 |

After creating it: add the ticket to A6's `scrum` column through the next tracking-sync, and to `roadmap.md` W10.

## Description

```
{noformat}
Related to user story A6

BACKEND AND FRONTEND. W10, after SCRUM-99. A6's remainder: its criteria 3 (reading never writes) and 4 (the project page does not repeat per-task work). SCRUM-119 (PR #54) delivered the drafts read and left these two out of scope.

Measured on the A6 perf bed (docs: perf-findings.md, origin/main df7c05a):
- GET /tasks/{id}/task-items repairs send-back statuses on every read: 235 statements and 176 ms per call on a 200-item task with history, against 6 statements and 11 ms without the repair, and a write on every read. GET /tasks/{id}/setup goes through the same path. The repair is what flipped a reopened item back to expert send-back (SCRUM-120).
- The project page calls getTaskSetup once per task to count the backlog (apps/hej-web/lib/project-data.ts:139), so it pays that repair once per task: 245 ms → 109 ms (−55%) with the repair removed.

Where the repair is: list_task_items_with_send_back_resolution (app/services/task_item_status_resolution.py:357) runs reconcile_resubmitted_send_back_items and repair_expert_send_back_for_task, then reads the statuses back. task_service.py:854 calls it for every task-items read.

# GET /tasks/{id}/task-items and GET /tasks/{id}/setup return stored statuses and issue no INSERT, UPDATE or DELETE. A route test counts the statements each runs and fails on any write.
# The status repairs happen in the writes that cause them, not in reads:
#* first, decide with SCRUM-99's owner whether expert_send_back survives once send_back becomes Return. If it doesn't, delete the repair instead of moving it, and record that in the PR;
#* otherwise, a resubmission after an expert send-back sets the item's status in the submission transaction (today reconcile_resubmitted_send_back_items does it on the next read), and a send-back decision sets its status where it is decided (decide_escalation already calls ensure_expert_send_back_status, review_actions.py:715);
#* SCRUM-120's reopen cutoff (PR #50) still holds: a send-back decided before the item's latest reopen never sets its status;
#* each of those writes records its history row, as status changes do today.
# Existing rows are repaired once, not on every read: an idempotent one-off repair, run by migrate_db_schema() on SQLite and documented for PostgreSQL dev databases (reset, SCRUM-94 rule). A second run changes nothing.
# The project page gets every task's backlog counts in one request with the project's task list, instead of one getTaskSetup per task. The counts use the same rule as SCRUM-89's project overview (SCRUM-43's is_task_item_export_eligible and SCRUM-24's task states), so the two screens agree.
# Delete the unused apps/hej-web/components/use-hydrated-task-items.ts (left over from A6 subtask 2).
# Target, on the same perf bed, reported before and after in the PR (A6 criterion 5): task-items on the 200-item task with history at most 20 ms and 0 writes; the project page with 8 tasks at least 50% faster than main.
# Tests, each failing on the old behaviour where there was one: task-items and setup issue no write; a resubmission after an expert send-back shows its new status on the very next read; a send-back decided before a reopen does not come back; the one-off repair is idempotent; the project page sends one request for its counts, whatever the number of tasks.

Out of scope: the annotate work queue request (about 520 ms on a 200-item task, #52), which now decides the Annotate page's load time; other indexes.

Collaboration:
- SCRUM-99 (E3, Yi): decides expert_send_back's fate and changes the same functions in task_item_status_resolution.py. This ticket starts after it merges.
- SCRUM-89 (J2, Tim): the project overview's counts. Agree one counting function, so the project page and the overview never disagree.
- SCRUM-120 (D9, Done): the reopen cutoff this ticket keeps.
- Evaluation harness (SCRUM-68/69): its item_status step reads GET task-items, which repairs today. The casebook must still pass once reads stop repairing; a case that relied on the read-time repair names the write that should have set the status.
{noformat}
```
