# Board changes — W9 to W11 replan

2026-10-01. From the board export of 2026-10-01 17:51 (`shared/Jira.csv`, 94 issues). The plan itself is in
`../../../specs/roadmap.md` → W9–W11; this file is only what to change on the board to match it.

**Decided by Hanchen (2026-10-01):**
- From W9, work is placed in **groups only**; owners are picked at each weekly meeting. Assignees already on
  the board stay; no new assignees are set here.
- **F1 (SCRUM-98) moves to W9**, ahead of the release work in W10 — the W8 meeting's action (21 Sep:
  "the provenance log needs to move ahead of the release export").
- Break tickets are planned as if they land. Whatever is still open on 7 Oct moves into W9 as carry-over,
  listed but not counted.
- **W11 is the last sprint.** Build work ends on 28 Oct; no W12 sprint is created. I5 (SCRUM-74, 75) stays
  in W11, and F5 (SCRUM-106) moves to W10 so that I5 checks a finished timeline.

Nothing here assigns a person. Points are the roadmap's units (1u = 1 point); the final points are in
`jira-Break-W11-points.md`.

**Update, later on 2026-10-01:** to lighten W10, SCRUM-37 (H4), SCRUM-40 and 41 (F4), and SCRUM-85 and 91
(B3, B1 verification) move **W10 → W9**. With the points set the same day: W9 18 on the board (19.5 with
SCRUM-51's second slice), W10 15.5, W11 7. The table below is the earlier step and does not show these moves.

**Split later on 2026-10-01:** G2's enforcement left SCRUM-107 as **SCRUM-118 (G2, W10, 2 points)**; SCRUM-107
(E5, W11) goes back to 2 points. W10 17.5, W11 7. Descriptions: `jira-W11-descriptions.md`.

## 1. Sprint and points

| Ticket | Story | Now on the board | Change |
| --- | --- | --- | --- |
| SCRUM-98 | F1 | W11, unassigned, 2 | **Sprint → W9.** Description: see §2 |
| SCRUM-87 | C4 | W10, unassigned, no points | **Sprint → W9**, points → 2. Description: see §2 |
| SCRUM-53 | F2 | W10, unassigned, no points | **Sprint → W9**, points → 2 |
| SCRUM-32 | D3 | W9, unassigned, no points | Points → 2 |
| SCRUM-49 | C5, D3, E1 | W9, unassigned, no points | No points. Description: see §2 |
| SCRUM-51 | D7, E1 | W8 sprint, Parth, 1.5 | See §3 — one choice to make |
| SCRUM-102 | H1 | W9, unassigned, 2 | No change |
| SCRUM-89 | J2 | W9, Tim, 2 | No change |
| SCRUM-37 | H4 | W10, unassigned, no points | Points → 2. Description: see §2 |
| SCRUM-104 | H2 | W10, unassigned, 2 | No change |
| SCRUM-105 | H3 | W10, unassigned, 2 | No change |
| SCRUM-103 | E6 | W10, Jingwei, 2 | No change |
| SCRUM-40 | F4 | W10, unassigned, no points | Points → 0.5 |
| SCRUM-41 | F4 | W10, unassigned, no points | Points → 0.5 |
| SCRUM-45 | J4 | W10, Jingwei, no points | Points → 1 |
| SCRUM-71 | I2 | W11, unassigned, no points | **Sprint → W10**, points → 1.5 (40 cases in W10; the top-up toward 60 in W11 rides on the same ticket as carry-over) |
| SCRUM-72 | I3 | W11, unassigned, no points | **Sprint → W10**, points → 1 |
| SCRUM-73 | I4 | W11, unassigned, no points | **Sprint → W10**, points → 2 |
| SCRUM-88 | J1 | W10, unassigned, no points | **Sprint → W11**, points → 1 |
| SCRUM-106 | F5 | W11, unassigned, 2 | **Sprint → W10.** Description: "Planned for W11" → "Planned for W10 (moved 2026-10-01: W11 is the last sprint, and I5 checks what this shows)" |
| SCRUM-107 | E5 | W11, unassigned, 2 | No change — but see §4 |
| SCRUM-108 | H6 | W11, unassigned, 2 | No change |
| SCRUM-74 | I5 | W11, unassigned, no points | Points → 1. Stays in W11, the last sprint |
| SCRUM-75 | I5 | W11, unassigned, no points | Points → 1. Stays in W11, the last sprint |
| SCRUM-85 | B3 | W10, unassigned, no points | Verify at the next meeting: the records count B3 complete. Close it if its criteria hold on `main`; otherwise **sprint → W11**, points → 1 |
| SCRUM-91 | B1 | W10, unassigned, no points | Same as SCRUM-85 (B1) |

Loads after these changes: **W9 13.5u, W10 16u, W11 8.5u** — W9 includes SCRUM-51's second slice (1.5u),
not its carried-over first slice; W11 includes I5 and would become 10.5u with a separate G2 ticket (§4).
Check the W11 sprint's end date on the board: Wednesday 28 Oct, after the client meeting.

## 2. Descriptions that are out of date

**SCRUM-98 (F1).** Replace the last line:

```
Agree the schema and migration order with the other W9 schema changes on day one — SCRUM-32 (D3), SCRUM-87 (C4) and SCRUM-53 (F2) change the annotation record in the same week. Moved from W11 to W9 on 2026-10-01 so that H2's provenance pointers and H3's provenance check (W10) read real events.
```

**SCRUM-87 (C4).** Blind-then-reveal became an evaluation protocol in I4 (client answer R1-2, 2026-09-21),
so the first two criteria name a mode this ticket no longer builds. Replace them with:

```
I can select human-only or AI-first when setting up a task.

The mode in force is recorded against the item, so results from different modes can be compared later.

Blind-then-reveal is not a production mode: it is the evaluation protocol SCRUM-73 (I4) runs (client answer R1-2, 2026-09-21).
```

Keep the line about testing that the suggestion is absent from the API response — it now applies to
human-only mode.

**SCRUM-37 (H4).** "Depends on the SCRUM-27 client decision" is answered (R2-2, 2026-09-24). Replace that
sentence with:

```
Unblocked by the client's answer R2-2 (2026-09-24): at most one authoritative value per item — none for an item resolved as ambiguous — with every other version kept as superseded provenance. Builds on F3 (SCRUM-38). Closes issue 4.
```

**SCRUM-49.** Its text is the old umbrella ("connect the Review page and API…"), and most of it landed with
SCRUM-48, 27, 113 and 114. Append:

```
2026-10-01: no own load. Its D3 part is SCRUM-32 (the adjust action persists the correction) and its E1 part is SCRUM-101 (a disagreement opens a dispute). Close it when both are Done.
```

## 3. SCRUM-51 — one ticket, two weeks

Its first slice (blind second review, disagreement flag; 1.5) was not started in W8 and is break carry-over;
SCRUM-101 (Yi, break) builds on its flag. Its second slice (sampling into SCRUM-52's second-review queue)
is W9. A Jira ticket sits in one sprint, so pick one:

- **Split the second slice into its own ticket (recommended).** SCRUM-51 → Mid-semester Break, 1.5, slice 1
  only. New ticket in W9, 1.5 points, assignee Parth (as on SCRUM-51):

  ```
  Review: Sample submissions into the second-review queue

  Related to user story D7

  Split from SCRUM-51 on 2026-10-01: its first slice (blind second review, disagreement flag) stays on SCRUM-51; this is its second slice.

  # Sample submissions by the cross-review percentage set in B2, read through resolve_for_task, and place them in the second-review queue SCRUM-52 builds.
  # A sampled submission is never offered to its first reviewer.
  # Over a seeded task, the share routed to a second reviewer matches the configured percentage.
  # Tests fail on the old behaviour and pass now.
  ```

- **Keep one ticket.** SCRUM-51 → W9 with 3 points; the first slice is tracked only in the roadmap.

## 4. Open for Hanchen

- **G2's W11 part has no ticket.** The roadmap's W11 listed "G2 — SCRUM-50 (G2 part), 2u", but SCRUM-50
  closed with PR #37. SCRUM-107 (E5) says "the enforcement itself is G2", and R2-7 / R2-8 widened it
  (expert gate and adjudication-mandatory as policy fields, no expert confirms or adjudicates their own
  work, no item finalises on AI output alone). Either fold it into SCRUM-107 (points 2 → 3) or open a G2
  ticket in W11 (2u; W11 becomes 10.5u).
- **SCRUM-69 and 70 (I1, I2) have no assignee** in the break sprint. If they are still unassigned at the
  end of the break, I3 and I4 in W10 lose the repeatable runs and casebook they measure on.
