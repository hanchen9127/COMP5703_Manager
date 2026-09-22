# SCRUM-5 ↔ SCRUM-89 swap (2026-09-22)

Michael asked for SCRUM-5 back on Slack (08:27): he'd already planned it last night as the third of three
C2 tickets done as one piece, and its fields are still moving under his two open PRs (`retry_wait` only
became reachable yesterday; #29 changes what `total_items` means). He wants it counted as his mid-semester
break allocation, delivered this week, so he and Tim can work in parallel instead of Tim waiting on him.
Tim agreed (09:17).

**Resolved 2026-09-22 — both halves are on the board now.** SCRUM-5 is back to Michael, sprint *Mid-semester
Break*, 1.5 points. SCRUM-89 is on Tim, sprint W8, **2 points** (the board keeps its original estimate, not
the 1.5u first proposed here — `roadmap.md` follows the board). The break week's plan changed from "no new
feature" to **"minimal new feature"**, with SCRUM-5 recorded as that one exception (`roadmap.md` → Break,
group 3) — the open question below is settled by that change.

---

## New W8 ticket for Tim: SCRUM-89 (J2)

Chosen over J1 (SCRUM-88, small but risks clashing with Tim's own in-review SCRUM-90 on org routing) and H1
(SCRUM-102, self-contained but a 2-week pull-forward of "the largest greenfield build in the project" —
too much new risk for a mid-week swap). SCRUM-89's own stated blocker — "don't start before SCRUM-43
settles the counting rule" — cleared when SCRUM-43 merged as PR #26 (2026-09-20); `is_task_item_export_eligible`
is on `main`.

**Board fields — set, 2026-09-22:** Assignee Tim Chung, Sprint W8, 2 points (kept at the original estimate,
not the 1.5u first proposed here).

Whether the description append below (SCRUM-43 cleared; coordinate with Dishank's SCRUM-24) was pasted in
is not checked here — worth a glance next time the ticket is open, but not blocking:
```
Reassigned from SCRUM-5 to Tim, 2026-09-22 (Michael asked for SCRUM-5 back; see Slack, 22/09).

SCRUM-43 (the counting rule this ticket's description names as its blocker) merged 2026-09-20 as PR #26 — is_task_item_export_eligible is on main, so this can start.

Coordinate the state names with Dishank's SCRUM-24 (B4), building the same week: figures should read the states his lifecycle work defines. If SCRUM-24 lands late, scope this week to what has landed and finish the rest in W9.
```

## roadmap.md — already updated

- W8 group 6: SCRUM-5 → SCRUM-89, 1u → 2u (board's own estimate), new work note.
- Load-by-person table: Tim's row now reads SCRUM-89, 2.
- The "Tim kept below 1.5u" note marked superseded; W8 total 19u → 20.5u (also fixed in the header and the
  planned-loads line).
- Close-collaboration table: the old "5 ↔ 6" (SCRUM-5 reads Michael's job tables) row replaced with
  "6 ↔ 7" (SCRUM-89 reads SCRUM-24's states).
- Break section: goal changed to "minimal new feature"; new group 3 (SCRUM-5, Michael, 1.5u) recorded as
  the one exception; break total 5u → 6.5u; planned-loads line updated for both weeks.

## Messages

**To Tim:**
```
Hi Tim, thanks for the flexibility — SCRUM-5 goes back to Michael. In its place: SCRUM-89 (J2), the
project overview screen. Its own blocker (SCRUM-43's counting rule) cleared this week, so it's ready to
start. It reads the item-state figures Dishank's SCRUM-24 is defining in parallel — worth a quick word
with him on the state names before you build the aggregation, same as you'd have agreed fields with
Michael. 2 points.
```

**To Dishank:**
```
Hi Dishank, heads up: Tim's building SCRUM-89 (J2, project overview) this week alongside your SCRUM-24
(B4, task lifecycle). His figures read the item states your ticket defines, so agree the state names with
him early — same kind of day-one sync as the schema changes already on the list this week.
```

## Done

Board fields set, break-week policy changed, tracking-sync re-run to pick up both — all 2026-09-22.
