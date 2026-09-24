# 给 Kanishka 的消息 —— PR #23 可以 review，S10 归 SCRUM-93

2026-09-20。PR #23（SCRUM-26）手动测试全部通过，已转为 ready for review，reviewer 是她。两件事要一起说：
她的 SCRUM-48 名额检查要落在这个 PR 改过的 `submit_draft` 里；走查中发现的前端缺陷 S10 归她的 SCRUM-93。
另外 `submit_draft` 三条拒绝的顺序她还没回复。英文写。

**依据：** `../../reviews/W7/pr-cs57-hanchen-scrum-26.md`；`../tests/manual-test-SCRUM-26.md`；
`../plans/defects-SCRUM-25.md` 的 S10；`message-kanishka-SCRUM-48-questions.md` 末尾的问题。

---

## 消息正文

```
Kanishka — PR #23 (SCRUM-26) is ready for review, and you're on it. Two things for you in it, plus
one I still need an answer on.

**Reviewing it.** It is stacked on #19, so the base is `CS57-Hanchen` and the diff shows only this
ticket. Five commits, each one reviewable on its own:
- `620e7dd` the finalised-item guard raises a domain error, mapped to 409 in the draft service;
- `5b764aa` four repository writes take `commit=False`, no behaviour change;
- `404ffda` submission becomes one transaction and records `draft.annotation_id`;
- `48fb057` docs;
- `a54a343` a D8 docs fix — `workflow_states.md` still said one annotator per item.

**What it changes for SCRUM-48.** `DraftService.submit_draft` now takes `commit` and wraps its writes
in one transaction. I left a marked place for your limit inside that transaction, before the
annotation is written:

    # SCRUM-48 (D8): the per-task submission limit goes here — inside the
    # transaction, with the task item row locked, ...

So the order is: finalised item, then "draft is pending" (both before any write), then your limit
inside the transaction with the item row locked. **Does that order work for you?** That is the one
question from last time I still don't have an answer to.

**S10, for SCRUM-93.** The manual walkthrough turned up a defect that is not mine to fix. On a
returned item, editing the answer and clicking **Save draft** reverts the editor to the previously
submitted answer and saves that instead. Submitting directly works. Two causes, both on `main` since
`d4d809c`:
- `selectDraftForViewer` (`apps/hej-web/lib/task-workspace-data.ts:373`) prefers the viewer's
  **submitted** draft over their **pending** one — after rework an item has both;
- the editor's initialising effect is keyed on the whole `item` object
  (`apps/hej-web/components/task-item-workspace-sheet.tsx:951`), so any re-render discards unsaved
  typing.

It gets worse under the client's answer: with several annotators per item, picking the wrong draft
can show another annotator's work. That is your screen in SCRUM-93, so I've recorded it there rather
than filing a ticket — same as issue 30 under B4. Fixing it means preferring the viewer's own pending
draft, and keying the effect on `item.id`.
```

---

## 发出后

1. 她确认拒绝顺序后，写进 `plan-SCRUM-28-26.md` 的 Commit 4 一节。
2. #19 合并后，把 PR #23 的 base 改成 `main`，并告诉她。
