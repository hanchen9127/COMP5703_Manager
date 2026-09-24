# SCRUM-99 的新描述（客户 R2-1 之后）

2026-09-24。客户在第二轮答复 R2-1 中修正了 2026-09-17 的答复：专家裁决**不再**退回 reviewer，对该争议即为终局，
只有 Accept、Return、Reject 三种结果。SCRUM-99 原描述第 3 条（"the item returns to the reviewer"）和最后一行
（"Open: client follow-up F2"）已经不对。依据：`../../../info/client-question.md` → R2-1、R2-4、R2-8；代码在
`origin/main` `fd273b9` 上核对过。

**粘贴方法：**整段替换原描述。下面的文本**不带** `{noformat}`，粘贴进 Jira 的 noformat 块里，和原描述的包法一样。
SCRUM-110/111/112 这次出现了 `{noformat}{noformat}` 和 `{code:sql}{noformat}` 两层包裹，就是因为把带 `{noformat}`
的文本又贴进了 noformat/code 块——那三张也需要把多出来的一层删掉。

第一行 `Replace subtask 58` 是原描述在 noformat 块外的一行，保留不动。

```
Related to user story E3

ONLY BACKEND

Replaces SCRUM-58 (deleted 2026-09-22 with its parent SCRUM-36). Moved forward from W10 to W8 on 2026-09-21.

Rescoped 2026-09-24 by the client's answer R2-1, which corrects the answer of 2026-09-17: an adjudication does NOT go back to a reviewer. It is final for that dispute.

Client answer: "I would expect three expert actions: Accept: accept one of the existing judgements as the resolved answer. Return: none of the existing judgements is satisfactory; return the item, with a reason, to the normal open workflow for new annotation/review. The previous dispute remains in its lineage. Reject: reject the disputed result/dispute as a valid resolution. It does not proceed automatically to another review stage. The expert's adjudication is therefore final for that dispute. Only a Return reopens the item. Also, 'resolved' does not necessarily mean that one answer won. An item may be resolved as genuinely ambiguous/unresolved."

# An adjudication is its own record, separate from the escalation that requested it. Today decide_escalation (app/api/routes/review_actions.py:497) writes the decision onto the escalation row itself (decision, decision_note, decided_by, decided_at).
# It references the task item, the dispute (escalation) and the conflicting decisions it resolves, with who decided and when.
# The outcome is one of accept, return or reject. It replaces decision: Literal["finalize", "send_back"] (app/schemas/review_actions.py:71) and _map_escalation_decision_to_task_item_status (review_actions.py:128).
#* accept — names one of the existing judgements (an annotation id) as the resolved answer. The item is canonicalized through the adjudication, and the adjudication records which judgement it selected.
#* return — the item goes back to the normal open workflow for new annotation and review: not to the previous reviewer, and not only to the original annotator. The dispute stays in the item's lineage. Until SCRUM-110 (D9, the owner's reopen) lands, set the item back to open work directly; once it lands, call D9's path.
#* reject — the dispute is closed without a winner. The item is left unresolved and nothing follows automatically. SCRUM-100 records this as its own "unresolved / ambiguous" outcome.
# A reason is required for every outcome (client answer R2-4: the reason is part of the provenance record). note is optional today.
# The adjudication is final: an item whose dispute has been adjudicated cannot be sent to adjudication again for that dispute. Only a return reopens the item.
# The adjudicator may not have annotated or reviewed the disputed work (client answer R2-8). This extends the self-decision guard from SCRUM-86 (D1, issue 7), which stays in force on this path.
# expert_send_back: decide whether the status is still reached now that send_back becomes return, and update or remove ensure_expert_send_back_status (task_item_status_resolution.py) and its callers accordingly. Record the decision in the PR.
# Tests: each outcome produces its record and item status; an outcome without a reason is refused; an adjudicator who reviewed the item is refused; a second adjudication of the same dispute is refused; the conflicting decisions are still readable afterwards.

Collaboration:
- SCRUM-100 (E4, same week): the resolution adds and never overwrites; the reject outcome is its "unresolved" case. Can land in the same PR.
- SCRUM-110 (D9): return adopts the reopen path once it exists — agree the function.
- SCRUM-101 (E1, Yi, W8): opens this same dispute record automatically — agree its shape before W8 ends.
- SCRUM-103 (E6, Parth): the dispute desk (components/task-dispute-desk.tsx) still sends finalize / send_back and must switch to accept / return / reject with a required reason. Change the API and the desk in step, or keep the old values accepted until E6 lands.
```
