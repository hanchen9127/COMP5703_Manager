# SCRUM-117 handover — Hanchen to Dishank or Jingwei

2026-10-03. **Decided by Hanchen:** SCRUM-117 (D8, 1 point, break, To Do, not started) leaves Hanchen. He
keeps SCRUM-69 and SCRUM-70 (I1, I2), doing 70 first, and takes F1 (SCRUM-98) in W9. The new owner is
Dishank or Jingwei, picked at the break meeting:

- **Dishank** has no break ticket since #41 merged, and knows the item-state logic the rule reads.
- **Jingwei** wrote #45's review rule (`review_refusal`), which this ticket mirrors on the annotator's
  side.

**Before building: confirm the rule at the meeting.** The ticket has said so since 2026-10-01. The
proposed rule: an annotator may resubmit their own answer while it awaits its first review, or once a
reviewer has returned or rejected it. Once it is approved, its author does not change it.

## Board steps

| Ticket | Change |
| --- | --- |
| SCRUM-117 | Assignee: Dishank or Jingwei. Sprint unchanged (Mid-semester Break). Points 1 → **1.5**, as `jira-Break-W11-points.md` proposed (back end and web). **Append** the block below to the description; keep everything already there |

## Appended to SCRUM-117's description

```
{noformat}
Updated 2026-10-03, after SCRUM-38 (PR #47).

A resubmission is now a new version, never a rewrite (ADR 009): _create_annotation_from_draft (app/services/draft_service.py) writes it with annotation_versions.create_version(..., derivation="resubmission"), and the earlier version keeps its content and reviews. So an approved answer is no longer overwritten when its author submits again: it is superseded, and the approval stays on the old version. This ticket still decides whether that resubmission is allowed at all.

Where the pieces are:
- Refusal: in DraftService.submit_draft, before any write, with the other submission refusals (the finalised-item guard, _assert_not_a_judge_of_item, _assert_human_submission_slot_available). Read the author's current version's review state from submission_rules.submission_review_states_by_item: approved_by, decided_since_submission, back_with_author. Allowed: no current answer yet; no review since it was submitted; back_with_author (returned or rejected). Refused with 409 otherwise, in words the annotator can act on. An AI submission (no user) is not this ticket's.
- Panel: the annotate queue row already says what the viewer may do: can_annotate, rework, submitted_by_you (WorkQueueItemRead, app/schemas/tasks.py). Offer the editor from those, not from the item's status. The panel is components/task-item-workspace-sheet.tsx, as #43/#44 left it.
- Tests: the refusals and the allowed cases, and a web test. Use the version the latest submission returned (draft.annotation_id): an annotation id changes with every resubmission.

Collaboration: Hanchen reviews (SCRUM-114/113 panel, SCRUM-38 versions).
{noformat}
```

## Message to the new owner (team chat, Chinese)

Replace `<name>`.

```
@<name> SCRUM-117 想交给你，1.5 点，break 的 ticket，周会上可以先把规则定下来 🙏

要解决的问题：现在不是自己的工作也能重交，已经被批准的答案作者还能再改。
规则（待确认）：作者的答案在等待第一次 review 时可以重交，被退回或拒绝后可以重交；被批准后不能再改。

我的 SCRUM-38（PR #47）合并以后，重交会新建版本，不会覆盖旧答案，所以这里只要加一道"允许不允许"的检查：
- 后端：在 submit_draft 里、写入之前，用 submission_review_states_by_item 读出作者当前版本的 review 状态，按规则返回 409
- 前端：annotate 队列每一行已经带了 can_annotate / rework / submitted_by_you，面板按这三个字段决定是否显示编辑器，不要看 item 状态
- 注意：每次重交 annotation id 都会变，测试里要用最新一次提交返回的 id

ticket 描述里补了具体位置。PR 我来 review，有问题随时问我～
```
