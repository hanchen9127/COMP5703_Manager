# #40 — Options A and B for Hunter (draft, not posted)

2026-10-04. **Decided by Hanchen:** set out Jingwei's option A and Yi's option B side by side, improved, as one
comment on #40, and wait for Hunter's answer there. Sources: Yi's comment on #40 (2026-10-03), Jingwei's
`2026-10-04-dispute-workflow-proposal-from-Jingwei.md` and `2026-10-04-dispute-plan-for-hanchen-from-Jingwei.md`.

**Improvements over both originals:**
- **Both options:** while a dispute is open, only the disputed answer is held. The item's other answers are still
  reviewed as usual (Yi's narrower hold, and Hanchen's call for A on 2026-10-04). Jingwei's draft said new answers
  would reach the expert unreviewed; Jingwei confirmed on 2026-10-04 that this was a mistake, and that A intends
  them to be reviewed first.
- **A:** the expert decides once every answer the item requires is in *and reviewed*, so nobody's independent
  judgement is cut off and nothing reaches the expert unreviewed.
- **The differing-answers question is asked openly** (pick one, or also allow a merge). Hanchen's view of
  2026-10-03 allows either. Jingwei's "earliest agreeing answer" rule is left out.
- No build deadline: the answer is awaited on #40, and raised at the Wednesday meeting if still open.
- No internal ticket numbers, file paths or `specs/`.

**Before posting:** send to Yi and Jingwei, so each confirms their option is described fairly (Hanchen,
2026-10-04). The comment stays neutral: no team recommendation, since the team is split (Hanchen, 2026-10-04).

Message to send (team chat, with the Comment block below pasted after it):

```
@Yi @Jingwei 我把 #40 的两个方案（Jingwei 的 A、Yi 的 B）整理成了一条给 Hunter 的评论，下面是草稿 🙏
麻烦各自看一下自己那个方案有没有描述错、或者漏了关键点，周一（10/5）晚上 8 点前回我就行，没问题的话我就发到 #40。
几点说明：
1. 两边共用的部分按 Yi 的做法：dispute 打开时只冻结被争议的那份答案，同一个 item 的其他答案照常评审（A 也这样改了）。
2. A 里专家要等这个 item 需要的答案都交齐、并且都评审完才能裁决。
3. 答案不同的时候「专家选一个」还是「也允许合并」，直接交给 Hunter 选；评论里不写团队倾向哪个方案。
4. 不写截止日期，周三还没回复就在会上提。
```

## Command

```
GH="/c/Program Files/GitHub CLI/gh.exe"
"$GH" issue comment 40 --repo USYD-CS-Capstone/hej --body-file qa-40-comment-AB.md
```

(`qa-40-comment-AB.md` holds the block below, without the fence.)

## Comment

```
@hunterxu-gh, the team has two readings of your R2-1 and R2-8 for disputes. Yi's comment above sets out option B; Jingwei has worked out option A. Both are below, side by side, so you can choose.

**What both options share**
- A dispute records exactly which answer versions and which reviews caused it, and who opened it and when, and it never changes afterwards.
- While a dispute is open, the disputed answer is held: no further review decisions or resubmission on it. The item's other answers are still reviewed as usual.
- The expert's decision is final, needs a reason, and is recorded as its own fact. Nobody who annotated or reviewed the item, or opened the dispute, may decide it.
- When reviewers agree, their decision simply applies. A split between reviewers on an answer, or an escalation, can open a dispute.

**A. The dispute settles the item.** The evidence is the disputed answer, and the expert also sees the item's other current answers.
- Accept: one of the item's answers becomes its resolved answer, and the item is final.
- Return: the item goes back to the open workflow for a new round of annotation and review.
- Reject: no answer is chosen. The item is marked unresolved, released without an output, and the project owner can reopen it.
- Two annotators' answers that are both approved but differ also open a dispute, and the expert's Accept picks one.
- The expert decides once every answer the item requires is in and reviewed.

**B. The dispute settles one answer.** The expert judges only the disputed answer.
- Accept: that answer counts as approved.
- Return: it goes back to its author for a revision, with guidance.
- Reject: it is rejected, and the dispute closes.
- Approved answers that differ are not a dispute. A separate later stage reconciles them (select, vote or merge) into the item's one output. That stage is not planned before the end of the project.

**The case that separates them.** Two annotators give different answers on one item, and a reviewer approves each. Under A, the expert picks the item's answer. Under B, the item holds two approved answers until reconciliation exists, so it has no single output to release.

**What we need from you**
1. A or B?
2. When approved answers differ, should an expert pick one of them, or may they also be merged into a new answer?
3. Under Dual sign-off, both reviews are collected before either takes effect, so whether a disagreement is seen does not depend on which reviewer went first. Is that right?
4. An item left with no chosen answer is listed in a release without an output, and you decide whether to exclude it. Is that right?

If this is still open on Wednesday, we will bring it to the meeting.
```
