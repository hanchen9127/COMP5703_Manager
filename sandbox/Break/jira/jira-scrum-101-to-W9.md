# SCRUM-101 moves from the break to W9

2026-10-02. **Decided by Hanchen:** SCRUM-101 (E1, automatic disputes, Yi) leaves the Mid-semester Break sprint
for W9, beside SCRUM-51's second slice (D7 sampling). This closes the risk in `roadmap.md` (W8, board changes of
2026-09-30, evening) and `mission.md` → Risks ("For SCRUM-101, Hanchen decides…").

**Why**
- **Nothing to build on yet.** SCRUM-101 opens its dispute from SCRUM-51's disagreement comparison. Neither has
  code: Parth's branch `CS57-Parth` last moved on 2026-09-20, and Yi has no branch for SCRUM-99, 100 or 101
  (checked 2026-10-02).
- **Both owners are over capacity.** Yi carries SCRUM-99 (2.5), 100 (1.5) and 101 (1.5) in the break, 5.5 points
  against a 1.5u–3.5u range. Parth carries SCRUM-51, 109 and 52, 4 points, none started.
- **Under PR #45 a disagreement is narrow.** `review_refusal` refuses any decision on a submission that is fully
  approved, decided since its last submission, or finalised. Two reviewers can therefore disagree only when the
  first approves and the second returns or rejects a submission still short of its approvals. Under single
  sign-off that happens only on submissions D7 samples for a second review, which is W9 work. Building E1
  beside D7 tests it on the case that produces most disagreements.
- **Nothing downstream moves.** E1 was planned for W9 before the board change of 2026-09-24. Its consumers,
  E6 (SCRUM-103) and H3's release exclusion (SCRUM-105), are both W10.

**What stays in the break for Yi:** SCRUM-99 and 100, the adjudication record. SCRUM-52's adjudicator queue
(break) and E6 (W10) read it, and E1 (W9) opens it.

## Board steps

| Ticket | Change |
| --- | --- |
| SCRUM-101 | Sprint: Mid-semester Break → **W9**. Assignee: Yi stays (from W9, the board's assignees stay; owners of new groups are picked at the meeting). Points unchanged (1.5). Replace the description with the block below |
| SCRUM-51 | No change of sprint. Its first slice stays break carry-over for Parth. Add one line to its description: `2026-10-02: SCRUM-101 (E1) moved to W9. The disagreement comparison is one function this ticket owns; SCRUM-101 calls it.` |

**W9's load** goes from 19.5u to 21u. That is still within the team's capacity of 12u–28u, and only 1.5u more
than W8.

**At the next weekly sync, not now** (`roadmap.md` is updated after each sync):
- `roadmap.md`, Break: remove SCRUM-101 from "Also in the break sprint on the board".
- `roadmap.md`, W9: add SCRUM-101 to group 6 with SCRUM-51's second slice, making it 3u, or give it its own
  group; update W9's load and carry-over line.
- `roadmap.md`, W8: mark the SCRUM-101 risk as decided.
- `mission.md` → Risks: mark the SCRUM-101 risk as decided.

## SCRUM-101 — new description

```
{noformat}Related to user story E1

BACKEND ONLY. W9, Yi. Moved from the mid-semester break on 2026-10-02 (Hanchen): it builds on SCRUM-51's disagreement comparison, which had no code, and W9 also holds SCRUM-51's sampling, where most second reviews come from.

Disagreement between independent reviews should open a dispute without anyone reporting it. Today a dispute exists only when a person routes one (route_escalation).

What counts as disagreement under the review rule PR #45 (SCRUM-116) put in place: review_refusal refuses any decision on a submission that is fully approved, returned/rejected/escalated since its last submission, or finalised. So two distinct reviewers disagree only when one approves a submission and the other then returns or rejects it while it is still short of its approvals — under dual sign-off, or on a submission D7 (SCRUM-51) sampled for a second review. SCRUM-51 owns the comparison as one function; this ticket calls it.

# When two distinct reviewers' verdicts on the same submission disagree (SCRUM-51's comparison) and the resolved policy's disagreement_handling (resolve_for_task) is open_dispute, a dispute opens automatically on the record SCRUM-99 defines.
# With manual_review, the disagreement is flagged on the item and no dispute opens.
# An automatic dispute is recorded as opened by the platform, not by a person, so history and F4 (SCRUM-40, W9) can tell them apart.
# The dispute shows both conflicting decisions, who made them and when.
# Opening is idempotent: an item has at most one open dispute (route_escalation already refuses a second with 409), and a third review does not open another.
# The dispute reaches the adjudicator queue like a routed one (SCRUM-52).
# Tests: a disagreement under open_dispute opens one dispute, under dual sign-off and on a sampled submission; under manual_review it only flags; agreement opens nothing; a repeated review opens no second dispute.

Moved out: excluding disputed items from release is H3's (SCRUM-105, W10).

Collaboration:
- SCRUM-51 (D7, Parth, W9): the comparison function and the sampling; agree its signature at the start of W9.
- SCRUM-99 (E3, Yi, break): the dispute record this ticket opens.
- SCRUM-52 (Parth, break): the adjudicator queue.
- SCRUM-40 (F4, W9): the platform as an actor.{noformat}
```

## To Yi and Parth (team channel)

```
@Yi @Parth: a planning change for the break. SCRUM-101 (automatic disputes) moves to W9.

It needs SCRUM-51's disagreement comparison, and neither has started, while you're both over this week's range (Yi 5.5 points, Parth 4). Since #45, a disagreement can only happen when one reviewer approves and a second then returns or rejects. Under single sign-off, that second review comes from D7's sampling, which is W9 anyway.

- Yi: the break is SCRUM-99 and 100, the adjudication record. SCRUM-52 builds on it this week, and SCRUM-101 opens it in W9.
- Parth: SCRUM-51 owns the comparison, as one function SCRUM-101 calls. Build it in whichever slice suits you; agree the signature with Yi at the start of W9.

I'll move the ticket on the board today.
```
