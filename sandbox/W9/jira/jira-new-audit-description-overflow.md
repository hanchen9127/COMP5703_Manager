# SCRUM-40 absorbs the audit-description overflow (255 characters)

2026-10-12. **Decided by Hanchen:** the bug Yi found in the review of PR #48 goes into SCRUM-40 (F4, Jingwei, W10),
not into a new ticket. The 14 Oct demo does not use Civil Comments, so the bug can wait for W10. `Jira.csv` of
2026-10-11 23:46 had no ticket for it, and SCRUM-40 was still To Do, so adding scope does not touch work in progress.

**Not reproduced** — code read only (2026-10-12). Reproduce first, on PostgreSQL.

## Board steps

| Field | Change |
| --- | --- |
| SCRUM-40 description | **Replace** with the block below (the original text is kept; the new part is subtasks 5–7 and the rule on the 255 limit) |
| Summary | Optional: `Provenance: Record correct audit actor types and keep audit descriptions within their column`. Leave it if the title must match the roadmap |
| Story points | 1 → **1.5** |
| Sprint | Stays **W10**. The old text said "W9 (moved from W10 on 2026-10-01)", but the board has W10 and so has `mission.md` ("SCRUM-40 moved to W10"); the block says W10 |
| Assignee | Jingwei stays. **Ask him first**: he carries E6 (2u) and F4 actors in W10, 3u in all (Table 17 of the progress report), so this makes 3.5u |

W10's load goes from 20.5u to 21u.

## At the next weekly sync, not now

- `roadmap.md`: SCRUM-40's row gains one line, and W10's load becomes 21u.
- The progress report (Table 16 / 17) says SCRUM-40 is 1u, Jingwei 3u in W10. If the report is submitted after this
  change, make them 1.5u and 3.5u, and W10's total 21u (Table 17's total).
- `mission.md` → defects: the bug is outside the 30 in `info/issues.md`; add it only if you want it counted.

## Open points for Hanchen

- **"Summary as description" or a plain bound?** The block does both: the intake entry writes its short summary, and
  the recorder bounds any description. Dropping `description` altogether (12 callers) is left to F1 (SCRUM-98).
- **Bound, never refuse:** an audit write must not roll back an upload. Say so if you want it to refuse.
- **If Jingwei cannot take 3.5u in W10**, the audit-description part (subtasks 5–7, 0.5u) can go to someone with
  room, as its own ticket; the first draft of that ticket is in this file's git history only if you saved it, so
  ask me and I will write it again.
