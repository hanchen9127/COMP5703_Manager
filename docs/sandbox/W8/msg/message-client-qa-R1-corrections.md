# Messages — corrections from the client's written answers (2026-09-21)

2026-09-22. Three short messages. Source: `../../../shared/client-qa.md`, R1-4 and R1-7.

---

## To Kanishka (SCRUM-48, SCRUM-93)

```
Hi Kanishka, one correction to SCRUM-48 from the client's written answers (21/09):

The AI's first pass does NOT count toward the required annotators. The number is of independent human submissions only, so the limit should count human submissions and never refuse the AI's annotation. This reverses what I told you on 18/09, sorry for the churn.

Also from the same answer: an annotator must not see other annotators' submissions on the item before submitting their own. Showing "2 of 3" is fine; showing the answers is not. Please make sure the API holds this, not only the screen.

I've updated the descriptions of SCRUM-48 and SCRUM-93 on the board.
```

---

## To Michael (SCRUM-46)

```
Hi Michael, one change to SCRUM-46 from the client's written answers (21/09):

The AI's annotation does not count toward the task's required annotators — that number is human submissions only. So the AI's submitted annotation shouldn't take a place under SCRUM-48's limit, and it shouldn't be refused by it either. One successful AI annotation per item is enough unless a task explicitly sets up a multi-model experiment.

Everything else in the ticket stays: AI as author, SCRUM-26's submit path, straight to review, result_annotation_id. I've updated the description on the board.
```

---

## To Jingwei (SCRUM-20, SCRUM-50)

```
Hi Jingwei, the client answered your §6.4 question in writing (21/09): a policy may change after a project starts, but as a new version. If v1 needs 2 reviewers and an item met it, changing to 3 creates v2; new work follows v2 and the old item keeps v1. History is never rewritten, and each item must keep the policy version that applied to it.

So "frozen per task" is not quite what the client wants — a freeze refuses the change. Before SCRUM-20 merges: is the freeze easy to keep as a first step, with versioning added later in F2 (SCRUM-53, W9)? Or would you rather design it as versioned now? Either works for W8; I just want the code not to block an edit it will later have to allow.
```
