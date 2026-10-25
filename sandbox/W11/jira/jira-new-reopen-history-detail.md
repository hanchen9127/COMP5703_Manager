# New ticket — a reopen's history entry loses its reason and superseded answers (2026-10-25)

**Drafted by Claude for Hanchen, 2026-10-25. Created in Jira by Hanchen the same day as SCRUM-139; PR #104 merged 2026-10-26, approved by Yi.**

**Decided by Hanchen (2026-10-25):** a new ticket, fixed now. Found by Yi in the review of #102 (point 2); it was
already on `main` before #102.

**Why.** Since D9's web history (`38223372`, 2026-10-01) the History tab shows a reopen through
`ReopenHistoryDetail`, which reads `reason`, `cause` and `superseded_annotation_ids` from the entry's `changes`.
The history read builds `changes` only from `_USER_VISIBLE_CHANGE_FIELDS` (`task_audit_log_query.py`), which holds
none of the three. So it has never worked end to end: the web test feeds the fields in by hand.

**Checked 2026-10-25 on `main` `ab45720`:**
- Yi reproduced it in the browser: after Kevin reopens `a1-12-finalised`, the entry reads "Reopened by the
  project owner · 0 earlier answers kept as superseded versions", with no Show button. `GET .../audit-logs`
  returns only the `status` change.
- By the same code, the owner's required reason is not shown either, and an expert's reconciliation Return reads
  as the owner's reopen in the web and as "Item reopened" in the summary.
- **The data is intact.** `task_item_reopens`, the superseded answers (`is_latest = false`,
  `superseded_by_reopen_id`) and the F1 event's details are all stored. Exports, releases and the Finalized
  traces are unaffected.
- **A dead cause.** `adjudication_return` was defined with the reopen (`8868999d`) for E3's Return, but #48 made
  the dispute Return route only its subject, without a reopen. No application code has ever written it; only tests
  do. ADR 008 and `db_schema_blueprint.md` still describe it.

---

## Board steps

| Field | Value |
| --- | --- |
| Type | Bug |
| Story | D9 |
| Sprint | W11 |
| Assignee | Jason Wang (Hanchen) |
| Story points | **1** suggested |
| Linked | "relates to" SCRUM-110 (D9) and SCRUM-134 (#102, where it was found) |

## Summary

```
Bug: A reopen's history entry loses its reason and the answers it superseded
```

## Description

```
{noformat}Story D9. Found in the review of PR #102 (Yi); already on main before it.

BACKEND + WEB + DOCS. Added 2026-10-25 (Hanchen).

The History tab shows a reopen with its reason, its cause and the answers it superseded, read from the history entry's changes. The history read keeps only a fixed list of change fields, which holds none of the three. So every reopen reads "0 earlier answers kept as superseded versions" with no way to open them, shows no reason, and an expert's reconciliation Return reads as the owner's reopen. The stored records are correct; only the history read drops them.

# The item_reopened history entry carries reason, cause and superseded_annotation_ids, and no other operation's entry changes.
# Its summary names a reconciliation Return as such; the web's reopen detail does too.
# The reopen cause adjudication_return, which no code writes (a dispute Return does not reopen the item, #48), goes from the API, the web and the docs.
# Tests: the task history read of a real reopen carries the three fields (fails on main); a reconciliation Return's entry names its cause.

Done when a reopened item's History entry shows its reason, the right cause and its superseded answers with the Show button, end to end through the API; the backend suite, the casebook and the web checks pass.

Out of scope: the item timeline (it reads the provenance events, which are correct), and the history entry of any other operation.{noformat}
```
