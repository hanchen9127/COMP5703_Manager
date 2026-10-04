# Client questions on #40 and #38 — comments to post before waiting for Hunter

2026-10-03. **Decided by Hanchen:**
- ask the client before PR #48 builds on either reading
  (`../../../reviews/Break/review-cs57-yi-scrum-99-pr48-disputes.md`);
- **no new issue**: make Yi's #40 and #38 complete where they are, label both `QA`, and wait for Hunter's
  answers there. There is no Round 3: Hunter answers in the issue, and that thread is the record;
- if there is no answer by the client meeting on Wed 7 Oct, raise both there.

Why each issue needed a comment first (2026-10-03):
- **#40** asks only about scope. The open question that blocks H4 (SCRUM-37, W9) and issue 4 (Critical) is
  what happens when **approved answers differ**. That is Q24, Q25, Q27, Q37 and Q40 in
  `../../W8/msg/questions_from_Yi.md`, left for the client on 2026-09-28. Also, #40's newest comment is Yi's
  annotation-scope proposal "after team discussion", so the client would see only Option B, without its
  consequence.
- **#38**'s background says a returned AI first pass goes to a human annotator. On `main` (`66b7ff6`) it
  is stranded instead: `first_pass_complete` (`app/services/submission_rules.py:226`) counts the AI answer
  as the first pass whatever its review state, so the annotation queue offers the item to no one, and
  the AI has no account to rework it. (Hanchen noted the same on PR #35, 2026-09-27; it was never posted
  on #38.)

**Before posting, check:** Option B's description is fair to Yi's design (send it to Yi first if useful). The
"our proposal" lines restate the 2026-09-28 proposals. Change them if the team now prefers B.

## Commands

Save each comment block below to a file first (`qa-40-comment.md`, `qa-38-comment.md`).

```
GH="/c/Program Files/GitHub CLI/gh.exe"
"$GH" issue comment 40 --repo USYD-CS-Capstone/hej --body-file qa-40-comment.md
"$GH" issue edit 40 --repo USYD-CS-Capstone/hej --add-label QA
"$GH" issue comment 38 --repo USYD-CS-Capstone/hej --body-file qa-38-comment.md
"$GH" issue edit 38 --repo USYD-CS-Capstone/hej --add-label QA
```

Once Hunter has answered, update the tickets the answers change: SCRUM-99, SCRUM-37 (H4) and SCRUM-103 (E6)
for #40; SCRUM-117 and the AI-assisted rework path for #38.

## Comment on #40

Shortened and edited in place on 2026-10-03 (13:41 UTC), before any reply; the first, longer version is in the comment's edit history.

```
@hunterxu-gh, two questions so we can finish adjudication (your R2-1) and the single authoritative output (R2-2).

**1. When reviewers disagree on one annotator's answer, is the dispute about the item or about that answer?**
- **A, the item** (our reading of R2-1 and R2-8): the expert sees every answer on the item. Accept picks one as the item's answer, Return reopens the item, and Reject leaves it unresolved.
- **B, that answer** (Yi's proposal above): the expert judges only that answer. The item's single output is chosen later, in a separate step.

Either way, the dispute records the exact answer version and the reviews that triggered it.

**2. Several annotators' answers on an item are all approved but differ. What happens?**
Our proposal: the item goes to dispute. If the answers agree, the earliest one is authoritative. "Differ" means not equal after normalising. An item is never final without one output unless it is resolved as ambiguous.

Questions 4 and 5 above are already settled by R2-1.
```

## Comment on #38

```
@hunterxu-gh, Yi's question above is ready for your answer. One correction to its background first: on `main` today, a returned or rejected AI first pass is **not** sent to a human annotator. On an AI-assisted task the AI's answer counts as the item's first pass whatever its review says, so no annotator is offered the item, and the AI cannot redo it either. The item stays stuck until this is decided.

So the "Human Rework" workflow describes a proposal, not current behaviour. Please choose among the three workflows in the issue (human rework, AI retry with reviewer feedback, or a policy choice between them), and say whether a bounded AI retry needs a human fallback.
```

**Posted 2026-10-03** (Hanchen's account, via gh): both comments, plus the `QA` label on #38 and #40. The label was created then, since the repo had none.

**Deleted 2026-10-03 by Hanchen:** the comment on #40, which he judged unnecessary. #40 goes to Hunter as Yi wrote it, with Yi's own comment and the `QA` label. The #40 comment block above is kept only as a record. Q2 (approved answers that differ) is therefore not asked on GitHub.

**Q2, Hanchen's view (2026-10-03):** taking the earliest answer as authoritative is wrong. When several accepted answers differ, either an expert selects the authoritative version, or someone handles the disagreement by merging them. Not yet asked or decided.
