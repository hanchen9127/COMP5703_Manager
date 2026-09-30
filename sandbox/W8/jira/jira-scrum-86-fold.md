# SCRUM-86 folded into SCRUM-116 and SCRUM-99

2026-09-30. **Decided by Hanchen:** SCRUM-86 (D1, issue 7: self-decision on the dispute endpoints; Parth, never
started) is folded into two break tickets that already change the same code:

- **SCRUM-116** (Jingwei) already refuses self-review for every review action, including the `escalate` action.
  It now also takes `route_escalation`, the separate routing endpoint.
- **SCRUM-99** (Yi) rewrites `decide_escalation`, and already carries the broader rule R2-8: an adjudicator may
  not have annotated *or* reviewed the work. It now owns the self-decision guard on that path.

Checked on `main` `e367ebd`: `route_escalation` (`review_actions.py:579`) checks only `DISPUTE`, and
`decide_escalation` (`:658`) checks only `ADJUDICATE`. Neither has any self-decision check, so issue 7 is still
open on both. Board text from a live export taken the same evening.

**Board steps**

| Ticket | Change |
| --- | --- |
| SCRUM-86 | Replace the description (block 1). **Points 1 → 0; remove it from the W8 sprint; leave it To Do.** The board has no "Won't Do" status, so it becomes a container like SCRUM-36 and SCRUM-42 (2026-09-21 rule): no points, no sprint, and moved to Done once SCRUM-116 and SCRUM-99 are both Done. That way `tracking-sync` does not count D1 finished early |
| SCRUM-116 | Replace the description (block 2). **Points 1 → 1.5 is your call:** the routing check is small but has its own tests. At 1.5, Jingwei's break is 2 (SCRUM-110) + 1.5 = 3.5u, the top of the range |
| SCRUM-99 | Replace the description (block 3). The first line becomes `Related to user story E3, D1`, so `tracking-sync` maps it to D1 too. Stale details also fixed: the line numbers, SCRUM-101 is in the break, SCRUM-103 is Jingwei's, and SCRUM-110's shared function, SCRUM-52 and PR #41 are added. Points unchanged |

**Not changed here:** `roadmap.md` (W8 group 2 and the issue 7 row) and `mission.md` still name SCRUM-86 as the
fix for issue 7. They change at the next weekly sync, with the carry-over.

---

## 1. SCRUM-86 — Review: Prevent self-review of own annotations

```
{noformat}Related to user story D1

CONTAINER — no work here. Folded into SCRUM-116 and SCRUM-99 on 2026-09-30 (Hanchen). Close this ticket once both are Done.

Issue 7 (Critical) is partly fixed: review actions (submit_task_item_review_action) and approve_draft already call assert_not_self_approval, for accept. Two dispute paths still let a person decide on their own work, and neither checks it on main (e367ebd):
- route_escalation — sending an item you annotated yourself to dispute: now SCRUM-116, which already refuses self-review for every review action, including the escalate action.
- decide_escalation — deciding a dispute on your own item, including as an administrator: now SCRUM-99, which rewrites decide_escalation and carries the broader rule (client answer R2-8: an adjudicator may not have annotated or reviewed the disputed work).

The requirements stand, split between the two: the refusal names its reason rather than a bare 403; administrators have no override (api_surfaces.md, "no administrator or reviewer override"); only DISPUTE may route and only ADJUDICATE may decide; and each path has a test that fails on the old behaviour.

Issue 7 closes when both tickets are Done.
{noformat}
```

---

## 2. SCRUM-116 — Review: refuse a decision on a submission that is not awaiting the reviewer

```
{noformat}Related to user story D1, D5, D8

ONLY BACKEND

Found in the D8 browser walkthrough on CS57-KANISHKA (2026-09-27) and in Yi's review of PR #33. The review queue offers a reviewer only the submissions that await them (awaits_review_by: not their own, not already decided since it was last submitted, short of the policy's approvals, and not already reviewed by them since then). The review action does not apply that rule, so it accepts decisions the queue would never offer:
- the same reviewer accepts the same submission again under single sign-off (six approvals of one answer in the walkthrough);
- a reviewer decides on a submission that already has its approvals;
- a person returns, rejects or escalates their own submission (only accept checks self-review; Yi);
- a reject on a canonicalized item's approved submission reopens the item (Yi, related to SCRUM-110).

Updated 2026-09-30: SCRUM-86 (D1, issue 7) is folded into this ticket and SCRUM-99. This ticket takes the routing half: a person may not send their own work to dispute, by the review action or by the routing endpoint. SCRUM-99 takes the deciding half.

# submit_task_item_review_action refuses, with 409 and a message that says why, a decision on a submission that does not await the caller, using the same rule as the queue (awaits_review_by), after the item lock.
# Self-review is refused for every action — accept, reject, adjust, revise and escalate — not only accept (403, as today for accept).
# route_escalation (POST /tasks/{task_id}/task-items/{task_item_id}/escalations/route, app/api/routes/review_actions.py:579) refuses routing a dispute on an item where the caller authored a current submission: 403 with a message that names the reason. Today it checks only the DISPUTE capability. (From SCRUM-86.)
# No override: both rules apply to administrators too (api_surfaces.md, "no administrator or reviewer override").
# A finalised item's submissions are refused this way; reopening stays SCRUM-110's owner-only path.
# A reviewer who returned a submission may still review its resubmission, and an earlier approver may approve a resubmission (approvals count since the last submission, PR #35).
# Tests, each failing on the old behaviour:
#* a repeat accept under single sign-off, a decision on a fully approved submission, a self-return, a self-escalate and a reject after canonicalisation are each refused;
#* an annotator who routes a dispute on their own item is refused, and so is an administrator who annotated it; a reviewer routing someone else's item still succeeds.

Issue 7 (Critical) closes when this ticket and SCRUM-99 are both done.

Collaboration:
- SCRUM-110 (D9, Jingwei): lands after this one — this ticket closes the accidental reopen, SCRUM-110 adds the owner's.
- SCRUM-99 (E3, Yi): the deciding half of issue 7, on decide_escalation. Use the same wording for the refusal.
- SCRUM-109 (D2, Parth) and SCRUM-24 (B4, PR #41) change the same function; agree the merge order.
{noformat}
```

---

## 3. SCRUM-99 — Dispute: Record an expert adjudication as its own decision

```
{noformat}Related to user story E3, D1

ONLY BACKEND

Replaces SCRUM-58 (deleted 2026-09-22 with its parent SCRUM-36). Moved forward from W10 to W8 on 2026-09-21, then to the mid-semester break, Yi (board, 2026-09-28/30). Updated 2026-09-30: SCRUM-86's deciding half (D1, issue 7) is folded in here; line numbers are on main e367ebd.

Rescoped 2026-09-24 by the client's answer R2-1, which corrects the answer of 2026-09-17: an adjudication does NOT go back to a reviewer. It is final for that dispute.

Client answer: "I would expect three expert actions: Accept: accept one of the existing judgements as the resolved answer. Return: none of the existing judgements is satisfactory; return the item, with a reason, to the normal open workflow for new annotation/review. The previous dispute remains in its lineage. Reject: reject the disputed result/dispute as a valid resolution. It does not proceed automatically to another review stage. The expert's adjudication is therefore final for that dispute. Only a Return reopens the item. Also, 'resolved' does not necessarily mean that one answer won. An item may be resolved as genuinely ambiguous/unresolved."

# An adjudication is its own record, separate from the escalation that requested it. Today decide_escalation (app/api/routes/review_actions.py:658) writes the decision onto the escalation row itself (decision, decision_note, decided_by, decided_at).
# It references the task item, the dispute (escalation) and the conflicting decisions it resolves, with who decided and when.
# The outcome is one of accept, return or reject. It replaces decision: Literal["finalize", "send_back"] (app/schemas/review_actions.py:89) and _map_escalation_decision_to_task_item_status (review_actions.py:137).
#* accept — names one of the existing judgements (an annotation id) as the resolved answer. The item is canonicalized through the adjudication, and the adjudication records which judgement it selected.
#* return — the item goes back to the normal open workflow for new annotation and review: not to the previous reviewer, and not only to the original annotator. The dispute stays in the item's lineage. Until SCRUM-110 (D9, the owner's reopen) lands, set the item back to open work directly; once it lands, call its reopen function.
#* reject — the dispute is closed without a winner. The item is left unresolved and nothing follows automatically. SCRUM-100 records this as its own "unresolved / ambiguous" outcome.
# A reason is required for every outcome (client answer R2-4: the reason is part of the provenance record). note is optional today.
# The adjudication is final: an item whose dispute has been adjudicated cannot be sent to adjudication again for that dispute. Only a return reopens the item.
# The adjudicator may not have annotated or reviewed the disputed work (client answer R2-8), administrators included — no override (api_surfaces.md). Refused with 403 and a message that names the reason. This is also D1's criterion 3 on this path (issue 7): decide_escalation checks only ADJUDICATE today, and SCRUM-86 was folded into this ticket and SCRUM-116 on 2026-09-30.
# expert_send_back: decide whether the status is still reached now that send_back becomes return, and update or remove ensure_expert_send_back_status (task_item_status_resolution.py) and its callers accordingly. Record the decision in the PR.
# Tests, each failing on the old behaviour where there was one: each outcome produces its record and item status; an outcome without a reason is refused; an adjudicator who annotated the item is refused, and so is one who reviewed it, and so is an administrator who annotated it; a second adjudication of the same dispute is refused; the conflicting decisions are still readable afterwards.

Issue 7 (Critical) closes when this ticket and SCRUM-116 are both done.

Collaboration:
- SCRUM-100 (E4, Yi, same week): the resolution adds and never overwrites; the reject outcome is its "unresolved" case. Can land in the same PR.
- SCRUM-110 (D9, Jingwei): one reopen function, e.g. reopen_task_item(db, item, *, actor_id, reason, cause), with no permission check inside; Return calls it once it lands. Agree the signature on day one.
- SCRUM-116 (Jingwei): the routing half of issue 7. Use the same wording for the refusal.
- SCRUM-101 (E1, Yi, break): opens this same dispute record automatically — agree its shape first.
- SCRUM-52 (D8/E3, Parth, break): the adjudicator queue reads this record and must apply the same independence rule, so it never offers a dispute to someone who annotated or reviewed the work.
- SCRUM-103 (E6, Jingwei, W10): the dispute desk (components/task-dispute-desk.tsx) still sends finalize / send_back and must switch to accept / return / reject with a required reason. Change the API and the desk in step, or keep the old values accepted until E6 lands.
- SCRUM-24 (B4, Dishank, PR #41): adds assert_task_accepts_work to decide_escalation — adjudication only on an active task.
{noformat}
```
