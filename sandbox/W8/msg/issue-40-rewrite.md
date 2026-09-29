# Issue #40 的新标题和正文

2026-09-28。Hanchen 直接修改 Yi 的 issue #40：范围只保留 canonicalization 冲突；加一条临时约束，先不指派。
Yi 原来的 6 个问题已经在 `questions_from_Yi.md` 里逐条回答，原文保留在 GitHub 的编辑历史里。代码位置按 `origin/main`
`c5b428b` 核对过。

更新命令（先把下面的正文存成 `issue-40-body.md`）：

```
gh issue edit 40 --title "<title>" --body-file issue-40-body.md
```

## Title

```
Canonicalization - An item whose approved answers differ becomes canonical with no answer selected
```

## Body

```
This is a product and data-model decision. It blocks treating canonicalization, disputes and export as final, and it is the root of issue 4 (a finalised item exports conflicting answers).

### Problem

An item may have several independent submissions, one per annotator, each reviewed on its own. Once every required submission has its approvals, `item_complete` (`apps/hej-api/app/services/submission_rules.py:367`) treats the item as complete, and `item_status_after_accept` (`apps/hej-api/app/services/review_policy_enforcement.py:138`) sets it to `canonicalized`. Nothing compares the outputs, and nothing records which submission is the authoritative one:

    Annotation A → approved → label X
    Annotation B → approved → label Y
    Annotation C → approved → label Z
    Item → canonicalized
    Canonical result → not identified

The client requires the opposite (R2-2): "A released item should identify its resolved/canonical output, if one exists", with the full history kept as provenance.

### Already settled

- A dispute is scoped to the task item. It can be triggered by two reviewers disagreeing on one submission (D7 / E1), but it holds and resolves the whole item: one open escalation per item, and while it is open no ordinary review can finalise the item.
- The expert's decision is final for that dispute and is one of three (R2-1): Accept names one existing submission as the answer; Return sends the whole item back to the open workflow; Reject closes the dispute without a winner and leaves the item unresolved. Only a Return reopens the item; anything else goes through the project owner's reopen (R2-3, SCRUM-110).
- The adjudication is its own record and references the submissions and reviews it resolves (SCRUM-99).
- An item resolved as ambiguous has no canonical output, and the customer decides at release whether to include it (R2-1, R2-2).

### Open — Hanchen will ask the client

1. When the approved answers on an item differ, must the item enter dispute, or may it be finalised some other way?
2. When they agree, which submission is the canonical one? (Our proposal: the earliest submitted, with the others recorded as agreeing.)
3. How are structured outputs (NER spans, bounding boxes, audio segments, JSON) compared? (Our proposal: exact equality after normalisation first, with per-annotation-type rules later.)

### Constraint until then

An item must not become `canonicalized` unless one canonical result is recorded for it. Who implements this is decided with H4 once the client answers. Until then, new work should not rely on `canonicalized` alone meaning "has one answer".

### Related

- SCRUM-99 (E3): the adjudication record, where Accept names the canonical submission
- SCRUM-101 (E1): automatic disputes from reviewer disagreement
- H4 / issue 4: what an export carries as the answer

The six questions this issue first asked were answered directly to Yi (Hanchen, 2026-09-28); the original text is in this issue's edit history.
```
