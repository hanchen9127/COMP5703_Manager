# New W9 ticket: a returned or rejected AI first pass goes to a human annotator (issue #38)

2026-10-12. **Requested by Hanchen.** The team designs #38 itself, without waiting for Hunter (since 7 Oct, the
team decides #40, #38 and blind-then-reveal; `mission.md` → Risks). No board ticket covered it: checked against
`Jira.csv` downloaded 2026-10-11 23:46 (98 issues, highest key SCRUM-121). SCRUM-117 is the resubmission rule,
SCRUM-87 is C4's mode, SCRUM-3 is generic retry.

**Design history, so nobody rebuilds a dropped version.** 2026-10-11: AI retry with the reviewer's feedback, no
limit. 2026-10-12 (earlier): fixed limit of 5 retries, then people. **2026-10-12 (final): no AI retry at all.** A
Return or Reject on an AI answer hands the item to human annotators. This is "Human Rework", the first of the three
workflows in issue #38, and it needs no new AI run.

## Board steps

| Field | Value |
| --- | --- |
| Type | Task (not a subtask: it belongs to no existing parent) |
| Summary | `Review: a returned or rejected AI first pass goes to a human annotator` |
| Sprint | **W9 Trace decisions, settle on** |
| Story | **E2** (first line of the description, so `tracking-sync` maps it) |
| Epic / parent | Review, Dispute & Adjudication (SCRUM-14), like SCRUM-117 |
| Assignee | Unassigned: the owner is picked at the 14 Oct weekly meeting |
| Story points | 1 (see *Load*) |
| Priority | Medium |

## Description (paste as is)

```
{noformat}Related to user story E2

BACKEND, with a small change to the review panel. W9. Added 2026-10-11, rewritten 2026-10-12. Our design for client issue #38.

Today a returned or rejected AI first pass strands its item. first_pass_complete (app/services/submission_rules.py) counts the AI's answer as the first pass whatever its review state, so no annotator is offered the item, a human submission is refused with 409, and the AI has no account to redo it. The item can never complete. Casebook case EV-011 waits for this.

Design (the team's, decided 2026-10-12 — not waiting for the client):
- Return or Reject on an AI answer: the item opens to human annotators. The AI is not asked again.
- The AI's answer stays as a returned or rejected version (F3), visible to reviewers. It is never deleted or rewritten.
- The reviewer's reason is kept with the decision and shown to the annotator who takes the item, as guidance. It is not part of the item's answer.
- A person's answer is reviewed like any other, under the task's review policy. The task's required human annotators count still applies; the AI's answer is not counted in it (client answer R1-4).
- The AI's answer is never canonical without a human review (client answer R2-7).

Subtasks:
1. first_pass_complete: an AI answer whose latest review is a return or a reject no longer counts as the first pass. The annotation queue offers the item, and the draft service stops refusing a person's first submission with 409.
2. The queue row says the item is open because its AI first pass was returned or rejected, and carries the reviewer's reason. The workspace panel shows it to the annotator. The annotator still never sees other people's answers before submitting their own (R1-4); decide whether the AI's returned answer is shown. Default: not shown.
3. Review panel: mark the AI's answer as returned, or rejected, and show that the item is now with annotators.
4. Tests: a return and a reject each open the item to annotators and give no 409; an AI answer that is accepted still counts as the first pass; the annotator sees the reason and no peer's answer; the item is never finalised on an unreviewed AI answer; a human answer after a returned AI answer is reviewed and can be finalised. Un-skip EV-011 in the casebook.

Collaboration:
- SCRUM-87 (C4, W9, Jingwei): changes who sees which drafts through the shared helper; agree the helper before this ticket touches it.
- SCRUM-98 (F1, W9): the hand-over is a decision point and an event. Write it through the same helper as other review actions.
- SCRUM-70 (I2): EV-011.

Definition of done: the above in the running app on an AI-assisted task, tests in the same change, docs for the changed state (workflow_states.md, api_surfaces.md), reviewed by someone other than the author.{noformat}
```

## Load

1u: 4 subtasks at 2–3 per unit, all in the queue, draft and review layers that already exist; no new job, schema
or worker path. W9 goes from 20u counted to 21u, inside the team's 12u–28u. Any member with room can take it. It
should stay in W9: W10 is already 20.5u, and EV-011 (the casebook's "AI was wrong, then a person takes over") is
the only case waiting on it.

## At the next weekly sync, not now

- `roadmap.md`: add the ticket to W9 and update W9's load.
- `tracking-sync` will map it to E2 after the ticket exists on the board. E2 is complete in the records, so it
  stays `done` ("never downgraded automatically"); decide by hand whether E2 goes back to `working`.
- Slide 10 of the client deck: replace the placeholder with "Return or Reject on an AI first pass hands the item to
  a person; the AI is not asked again". Slide 11 (risks): "Blind-then-reveal is built in W10; the AI-rework
  design is simple and ships this week". The slide's three-step AI-retry list (steps 1–3) must be replaced, not
  just the placeholder.
- After Hunter answers on #38, update this ticket the same day.

## Open points for Hanchen

- **Is the AI's returned answer shown to the annotator who takes over?** I defaulted to no: it keeps the human
  answer independent, which is the point of R1-4 and of the evaluation. The reviewer's reason is shown instead.
  If you want the AI's answer visible, it should be a deliberate mode, not the default.
- **Return and Reject now do the same thing on an AI answer.** For a person's answer they differ (Return goes back
  to the same author, Reject means redo). If you want them to differ here too, say so.
- **This is the simplest of the three workflows in #38**, so a different answer from Hunter (AI retry) would cost
  a new ticket. That risk is small and is the price of not waiting.
