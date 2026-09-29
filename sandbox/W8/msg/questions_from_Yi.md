# 回复 Yi：Dispute 与 canonicalization 的 73 个问题

Hanchen，2026-09-28

Yi，谢谢你把这些问题整理出来。末尾 "Current Implementation Conflict" 指出的问题是真的：三份 annotation 都被批准、
答案各不相同时，item 仍会变成 `canonicalized`，却没有记录哪一份是正式答案。这和 issue 4（导出冲突答案，Critical）
是同一个根源。

大部分问题已经有答案了：有的来自客户第二轮答复（R2-x，见 `docs/info/client-question.md`），有的是团队已经定下的
决定，有的已经写在 ticket 里。每个问题下面都标了类别和出处。**需要问客户的只剩一组**（第 24、25、39、40 题一带），
我会合并成一个问题发给客户，你不用单独发。其余的由各 ticket 的负责人内部决定，或者写进 ADR。

## 标记说明

| 标记 | 含义 | 数量 |
|---|---|---|
| **【已答复】** | 客户已经回答，写明出处（含"已答复一半"） | 20 |
| **【已定】** | 团队决定或 ticket 里已经写明，写明出处（含"已定一半"） | 26 |
| **【内部定】** | 实现层面的问题，不需要问客户，写明由谁定 | 17 |
| **【待问客户】** | 真正开放，由 Hanchen 合并成一个问题问客户 | 10 |

团队决定的出处：
- **决定 B/C**（2026-09-25）：每份 submission 单独审核；同一位 reviewer 可以审一个 item 上的所有 submission，只要
  这个 item 不是他标的。
- **决定 D**（2026-09-25）：accept 只完成被审的那一份 submission；所有要求的 submission 都提交并批准后，item 才定稿。
- **决定 E**（2026-09-26）：reviewer 的 reject 和 return 一样，意思是"重做"。
- **PR #35**：批准数按每份 submission 计算（和 Jingwei 在 PR 里确认过）；item 有 open escalation 时整个 item 被挡住，
  审核队列跳过它。

---

## Dispute Scope

1. Is a dispute scoped to one annotation, one task item, or either depending on the disagreement?

   **【已定】整个 item。** 一个 item 同时只能有一个 open escalation（`route_escalation` 对第二个返回 409）；有 open
   escalation 时整个 item 都被挡住（PR #35）。R2-8 的原话也是 "the item enters dispute"。每个 item 最多一个权威输出
   （R2-2），所以争议必须在 item 层面解决。注意区分：**触发条件**可以是同一份 annotation 上的 reviewer 分歧
   （D7/E1），但**争议范围**是 item。

2. Can a dispute contain exactly one annotation with conflicting reviewer verdicts?

   **【已定】可以。** 这就是 D7（SCRUM-51）标记、E1（SCRUM-101）自动开争议的情况。争议范围仍然是整个 item。

3. Can a dispute contain multiple annotations whose outputs conflict with each other?

   **【待问客户】** 就是第 24、25 题。现在 reviewer 可以手动 escalate 任何 item，所以手动开的争议已经可能涉及多份
   annotation；会不会**自动**开争议，要等客户答复。

4. In the client's R2-1 response, does "existing judgements" mean annotation submissions, reviewer verdicts,
   reviewer corrections, or any of these?

   **【已定】annotation submission。** Accept 选出的是 "the resolved answer"，而 reviewer 的 verdict 不是答案。
   SCRUM-99 写的是 "names one of the existing judgements (an annotation id)"。reviewer 的修正算不算候选，见第 51 题。

5. Should every dispute explicitly record the annotation IDs and review IDs that caused it?

   **【已定】要。** SCRUM-99 第 2 条："It references the task item, the dispute (escalation) and the conflicting
   decisions it resolves"。`fbbba0c` 还没做这一条。

6. Should the dispute show only the annotations and reviews directly involved, or every current annotation and
   review on the item?

   **【内部定，E3/E6】建议两者都显示，但分开标出。** 争议范围是 item，专家需要完整的上下文（E4、R2-2：分歧本身是
   有价值的数据）。同时要按第 5 题的记录，标出哪几份是引起争议的。

7. Can one item have multiple disputes concerning different annotations?

   **【已定】不能同时有。** 同一时间只能有一个 open escalation（409）。前后可以有多个：比如 Return 之后重新标注，
   又产生了新的争议。

8. Can two open disputes reference overlapping annotations or reviews?

   **【已定】不会发生。** 理由同第 7 题。

9. Is a dispute tied to a specific immutable annotation version, or to the annotation's latest version?

   **【内部定，E3/E4】建议绑定开争议时的版本。** 现在重新提交会在原地覆盖 annotation，裁决时看到的证据以后就找不到了。
   R2-1 要求 "The previous dispute remains in its lineage"，R2-5 要求溯源里有 "disputes and expert/adjudication
   decisions"。要么把证据快照存进裁决记录，要么让重新提交生成新版本。

10. If an annotation is resubmitted after `Return`, is that a continuation of the previous dispute or a new
    potential dispute?

    **【已答复】是新的。** R2-1："The expert's adjudication is therefore final for that dispute"。旧争议已经结案，
    留在 lineage 里；重新标注和审核后如果又有分歧，就是一个新的争议。

## Review Semantics

11. Does `review_required_approvals` apply independently to every annotation, as currently implemented, or to the
    item as a whole?

    **【已定】每份 annotation 各自计算。** PR #35 上和 Jingwei 确认过，D8 第 7 条验收标准也是这样写的。

12. Does the required approval count also define how many reviewers must submit a verdict, or does it count only
    positive approvals?

    **【已定】只计批准。** `approvers_of` 只数 `approved`，而且只数最近一次提交之后的批准。reject、return 和
    escalate 会让这份 submission 退出审核。

13. Are multiple reviewers expected to review the same annotation concurrently, sequentially, or either?

    **【已定】都可以。** 队列把 submission 提供给任何符合条件的 reviewer；review action 会锁住 item 行，避免并发
    问题。D7 的盲审（第二位 reviewer 提交前看不到第一位的结论）由 SCRUM-51 实现。

14. If the first reviewer rejects or returns an annotation, should the system immediately send it for rework, or
    wait for the remaining required reviewers?

    **【已定】立即返工。** 决定 E：reject 和 return 都是"重做"；`decided_since_submission` 让这份 submission 立刻
    退出审核。

15. If a rejection immediately removes the annotation from review, how can conflicting reviewer verdicts on the
    same annotation normally occur?

    **【内部定，SCRUM-51/SCRUM-101，也就是你的票】观察得对。** 按现在的规则，同一份 submission 上的分歧只可能是
    "先批准、后 reject/return/escalate"，也就是 dual sign-off 下的第二次审核。这正是 D7 要标记的情况。

16. When one reviewer accepts and another rejects the same annotation, should the annotation enter dispute
    instead of immediately returning to its annotator?

    **【内部定，SCRUM-51/SCRUM-101】建议进入争议。** D7 负责比较两位 reviewer 的结论并标记分歧，E1 根据标记自动开争议；
    `disagreement_handling = open_dispute` 时，这种情况应该开争议，而不是按决定 E 退回。请你在 SCRUM-101 里写明，
    并和 SCRUM-51 的负责人对齐。

17. Must the reviewers assigned to different annotations on the same item be the same people?

    **【已定】不需要。** 决定 B/C。另外，客户 2026-09-17 决定不做分配，所以没有"被分配的 reviewer"，只有队列。

18. Is one reviewer allowed to review every annotation on an item, provided they did not annotate the item
    themselves?

    **【已定】允许。** 决定 B/C。

19. Does reviewer independence apply per annotation or across the whole item?

    **【已定】两层。** item 层：标注过这个 item 的人，不能审这个 item 的任何 submission。submission 层：同一次提交，
    一个人只能审一次，dual sign-off 下的第二次批准不能是同一个人。

20. If a reviewer reviewed one annotation on an item, may they review another annotation on that item?

    **【已定】可以。** `awaits_review_by` 按 submission 判断（PR #35 已合并到 `main`）。

21. Should second-review blinding apply separately to each annotation?

    **【内部定，SCRUM-51】** review 本来就是按 submission 记录的，所以盲审自然也是按 submission。由 SCRUM-51 实现。

22. Is `cross_review_percentage` calculated per item, per annotation, or per submitted review?

    **【内部定，SCRUM-51】建议按 item 抽样。** SCRUM-51 写的是 "Sample items by the cross-review percentage"，
    R2-7 说的是 "A sampled item should not canonicalise until its required cross-review completes"。抽中之后，
    item 上每一份 submission 是否都要交叉复核，由 SCRUM-51 决定并写明。

## Disagreement Detection

23. Should disagreement be detected between reviewer verdicts on the same annotation?

    **【已定】要。** D7（SCRUM-51）标记，E1（SCRUM-101）自动开争议。

24. Should disagreement also be detected between different annotations submitted for the same item?

    **【待问客户】** 第一轮就问过（`client-question.md` 第 450 行，第 2 个子问题），客户没有回答。由 Hanchen 合并问题
    重新问。

25. If two annotations are both approved but contain different outputs, must the item enter dispute?

    **【待问客户】** 同第 24 题。这也是文末那个冲突的核心。

26. If one annotation is approved and another is rejected, is that a dispute or ordinary annotation rework?

    **【已定】普通返工。** 决定 E：reject 是"重做"。按决定 D，item 要等被 reject 的那份重新提交并获得批准，才能定稿。

27. Should the system wait until all required annotations and reviews are complete before comparing candidate
    outputs?

    **【待问客户】** 跟第 24 题一起问。建议：等所有要求的 submission 都提交并批准后再比较，也就是现在 `item_complete`
    判断完成的那一刻。

28. Can an item enter dispute while other required annotations or reviews are still incomplete?

    **【已定】手动可以，自动的等第 24 题。** reviewer 可以随时 escalate。已知副作用：进入争议后，item 上其他
    submission 的审核也会被挡住（PR #35）。

29. Does disagreement include differences between AI and human annotations, or is AI-versus-human comparison
    evaluation-only?

    **【已答复】工作流里不比较。** AI 首轮成功的 AI-assisted 任务不需要人工标注（客户 2026-09-17、R1-4），所以没有
    AI 和人工两份答案并存的情况。R2-7："AI first-pass is not an approval or reviewer slot"，它是溯源的一部分。
    AI 和人工的对比属于评估（Epic I）。

30. Does `disagreement_handling = open_dispute` apply to reviewer-verdict conflicts, annotation-output conflicts,
    or both?

    **【内部定，SCRUM-50/51/101】** 对 reviewer 分歧肯定适用。对输出分歧是否适用，取决于第 24 题的答复。

31. Under `manual_review`, who decides whether conflicting annotations should become a dispute?

    **【已定】reviewer。** 用 escalate 操作手动开争议，按 R2-4 必须写理由。另外，arbitration-ready 的项目会从
    `manual_review` 迁移成 `open_dispute`（Jingwei 的 SCRUM-50）。

32. How should the system compare structured outputs such as NER spans, bounding boxes, audio segments, or
    free-form JSON?

    **【待问客户】由我们先提方案，再请客户确认。** 建议第一版把输出规范化之后做完全相等比较（比如 span 和 bbox 排序、
    去掉无关字段），按 `annotation_type` 可以扩展。bbox 的 IoU 阈值之类的规则放到以后再做。

33. Is exact JSON equality sufficient, or does disagreement detection require task-specific comparison rules?

    **【待问客户】** 同第 32 题。

34. If generic automatic comparison is unreliable, who may manually flag the disagreement?

    **【已定】reviewer。** 用 escalate，要写理由（R2-4）。这个功能现在就有。

## Canonicalization

35. Does a canonicalized item always have exactly one canonical output?

    **【已答复】是。** R2-2："A released item should identify its resolved/canonical output, if one exists"。
    定稿的 item 恰好有一个输出；以歧义结案的 item 没有输出（第 59 题）。

36. Must the canonical output be one existing annotation, or may it be a separate canonical judgment derived from
    multiple annotations and reviews?

    **【已答复一半】** 走专家裁决时，只能是已有的 annotation（R2-1 的 Accept）。不经过争议的定稿走哪条路，要看第 24、
    25 题的答复。reviewer 的修正见第 51 题。

37. If multiple annotations have identical outputs, should one annotation still be selected as canonical?

    **【待问客户】** 跟第 24 题一起问。建议：选出一份，同时记下其他相同的几份作为佐证。

38. If one existing annotation must be selected, what deterministic rule selects it when several approved
    annotations agree?

    **【内部定，ADR】** 建议取最早提交的那一份，并写进 ADR。

39. If all required annotations receive the required approvals but their outputs differ, should the item remain
    unresolved rather than becoming `canonicalized`?

    **【待问客户】** 第 25 题的另一种问法。无论客户怎么答，都不能在没有选出正式答案的情况下变成 `canonicalized`，
    见第 49 题。

40. Is expert adjudication always required to select the canonical result when approved annotations disagree?

    **【待问客户】** 跟第 25 题一起问。Standard 模式下，是否允许 reviewer 自己选，也在这个问题里。

41. Can an ordinary reviewer select the canonical annotation, or is that authority limited to an expert, project
    owner, or governance policy?

    **【已答复】看治理模式。** R2-8：Standard 模式下 "A normal reviewer approval is sufficient to canonicalise an item"；
    Expert Gate 要专家确认；Arbitration-ready 有争议就必须由专家裁决。"几份答案不同时由谁挑选"是第 40 题。

42. Should `expert_gate` require an expert decision even when all annotations and reviews agree?

    **【已答复】要。** R2-8："Every item requires expert confirmation before it can become canonical, whether or not
    a dispute occurred"。已经并入 G2（SCRUM-50）的验收标准。

43. Should `arbitration_ready` require expert intervention only after a dispute is created?

    **【已答复】是。** R2-8："if a dispute occurs, it must reach independent adjudication"。由 E5（SCRUM-107）执行。

44. At what exact point should canonicalization occur: after one annotation is approved, after every required
    annotation is reviewed, after agreement is detected, or after an explicit resolution decision?

    **【已定一半】** 决定 D：所有要求的 submission 都提交并批准之后，而不是批准一份就定稿。之后还要不要检查答案一致，
    是第 25 题。

45. Does accepting an annotation complete only that annotation's review, or can it also make the item canonical?

    **【已定】** 决定 D：accept 完成的是那一份 submission；如果它是最后一份缺的批准，item 同时定稿
    （`item_status_after_accept`）。

46. If two annotations are approved and a third is returned for rework, must canonicalization wait for the third
    submission?

    **【已定】要等。** 决定 D，以及 `item_complete`。

47. If the returned annotation is later resubmitted with a different result, must all candidate outputs be
    compared again?

    **【待问客户】** 跟第 24 题一起问。如果客户要求比较输出，答案是要重新比较。

48. Should `TaskItemDB` store an explicit `canonical_annotation_id` or `canonical_judgment_id`?

    **【内部定，ADR】建议要存。** R2-5 的 manifest 要求 "which resolution/version was selected for each item"；
    H4（issue 4）的导出也需要它。具体字段名和放在哪一层，由 E3 和 H4 一起定。

49. Should the system refuse to set item status to `canonicalized` unless exactly one canonical result has been
    recorded?

    **【内部定，ADR】建议拒绝。** 这是修掉文末那个冲突和 issue 4 的约束。

50. Should the canonical result reference the annotation version, the reviews supporting it, the dispute, and the
    adjudication decision?

    **【已答复】要。** R2-5 列出的 item 级最低溯源包括：annotation attempts、review decisions and justifications、
    disputes and adjudications、reopen/supersession lineage，以及 the final resolution used by the release。

51. If a reviewer or expert produces a corrected result, is that correction a new annotation candidate or a
    separate canonical judgment?

    **【内部定，ADR，D3】** 专家不能修正（第 52 题）。reviewer 的 modify（D3）在 R2-2 里列为 "reviewer corrections"，
    属于溯源。它能不能成为正式答案，要和 D3 的负责人一起定，写进 ADR。

52. May an expert create or edit a canonical result, or may they only select an existing annotation?

    **【已答复】只能选已有的。** R2-1 的 Accept 是 "accept one of the existing judgements"；已有的都不行时用 Return。

## Expert Adjudication

53. For a dispute containing one annotation, should `Accept` automatically refer to that annotation without
    showing an annotation selector?

    **【内部定，E6】UI 细节。** 后端在只有一个候选时已经允许不传 `annotation_id`（`_resolve_review_target`）；前端可以
    预先选好。

54. For a dispute containing multiple annotations, should `Accept` require the expert to select one annotation?

    **【已定】要。** SCRUM-99 第 3 条，你的 `fbbba0c` 已经实现。

55. Does `Reject` mean rejecting one annotation, rejecting every candidate annotation, rejecting the escalation as
    unnecessary, or closing the item without a valid answer?

    **【已答复】结束争议，不选胜者。** R2-1："reject the disputed result/dispute as a valid resolution. It does not
    proceed automatically to another review stage"。我们的理解（在 ADR 中确认）：item 停在未解决、也就是"歧义"的
    终态，下一步由项目负责人决定（例如用 R2-3 的重开）。所以 Reject 不能用 `rejected` 状态，因为 `rejected` 在
    决定 E 里的意思是"重做"。

56. Is `Return` a separate expert outcome, or is it the workflow consequence of rejecting an annotation and
    requesting rework?

    **【已答复】是单独的结果。** R2-1 列出了三种专家操作；"Only a Return reopens the item"。

57. When an expert returns an item, are all annotations reopened or only the annotations involved in the dispute?

    **【已答复一半】退回的是整个 item。** R2-1："return the item … to the normal open workflow for new
    annotation/review"。原来那几份 annotation 怎么处理（作废、保留为候选，还是允许原作者修改）属于【内部定】，
    要和 D9（SCRUM-110）的重开路径一起定。R2-3 也说重开的 item "returns to the normal open workflow"。

58. Does `Return` reset all prior review approvals or only approvals associated with the returned annotation
    version?

    **【内部定，ADR，D9】建议全部作废。** 退回的是整个 item，所以以前的批准不能再用来定稿。按 R2-1 和 R2-5，这些批准
    保留在 lineage 里。

59. If the expert resolves the item as ambiguous or unresolved, should the item have no canonical result?

    **【已答复】没有。** R2-1："An item may be resolved as genuinely ambiguous/unresolved"；R2-2 说 "if one exists"。

60. What terminal item status represents a resolved dispute with no canonical result?

    **【内部定，E3/E4】** 不能用 `rejected`（原因见第 55 题）。建议新增一个状态，例如 `unresolved`；同时它要算作
    "已结案"，否则 task 永远无法完成。

61. May an unresolved item be included in a release, or must it always be excluded?

    **【已答复】由客户在发布时决定。** R2-1："The customer may later decide whether to exclude it or otherwise
    handle it in a release"。H3/H4 两种都要支持。

62. Can an expert who annotated or reviewed an unrelated annotation on the same item adjudicate the dispute?

    **【内部定，E3】建议不可以。** R2-8："An arbitrator should not arbitrate a dispute involving work that they
    annotated or reviewed themselves"。争议范围是整个 item，按 item 检查更简单，也更稳妥。

63. Is expert independence checked against only the disputed evidence or against all work on the item?

    **【内部定，E3】** 同第 62 题，建议按整个 item 检查。

64. Can a resolved dispute be adjudicated again, or must the item first be formally reopened?

    **【已答复】必须先重开。** R2-1 说裁决是终局的；R2-3 规定由项目负责人重开，也就是 D9（SCRUM-110）。

## Provenance and Release

65. Must the dispute preserve the exact annotation versions, reviewer verdicts, justifications, policy version,
    guideline version, and schema that were in force when it opened?

    **【已答复】要。** R2-5 的 item 级清单包括 guideline version、policy version、annotation attempts、review
    decisions and justifications，以及 disputes。实现方式见第 9 题。

66. Should later annotation or policy changes alter the evidence displayed for an existing dispute?

    **【已答复】不应该。** 溯源要能 "reconstruct how this released judgement came to exist"（R2-5）。

67. Should the adjudication record be separate from the escalation record?

    **【已定】要。** SCRUM-99 第 1 条。

68. Should the adjudication explicitly reference every conflicting review and candidate annotation it resolved?

    **【已定】要。** SCRUM-99 第 2 条。

69. If canonicalization occurs without a dispute, what decision record explains why that annotation became
    canonical?

    **【内部定，ADR】** 按 R2-5，要能追溯到 "the final resolution used by the release"。建议定稿时记录选中的 annotation
    和支撑它的那几次批准。和第 48 题一起定。

70. If canonicalization follows expert adjudication, should the canonical result reference the adjudication rather
    than relying only on item status?

    **【已定】要。** SCRUM-99："The item is canonicalized through the adjudication, and the adjudication records
    which judgement it selected"。

71. Should normalized export contain one explicit canonical result in addition to all annotation attempts and
    reviews?

    **【已答复】要。** R2-2："release output = authoritative resolution, release provenance = complete judgement
    history. Do not flatten the history into only the final answer"。

72. How should export represent an item that was resolved as ambiguous or unresolved and therefore has no
    canonical output?

    **【已答复一半】** R2-2 规定输出为空（"if one exists"），溯源照常保留；R2-1 规定是否纳入由客户决定。具体的导出格式
    由 H4 定。

73. After a finalized item is reopened and processed again, does it receive a new canonical result while the
    previous canonical result remains as a superseded version?

    **【已答复】是。** R2-3："The previous finalised answer must remain in history as a superseded version. It
    should never be overwritten"。

## Current Implementation Conflict

> The current implementation considers an item complete when its first pass is complete and every current
> annotation has the required approvals. It can then set the item status to `canonicalized`, but it does not
> select or store one authoritative annotation.

**确认属实。** `item_complete` 只检查每份 submission 的批准数，不比较内容，也不选出正式答案。这和 issue 4（导出冲突
答案）是同一个根源，归 H4。

接下来的处理：
- **Hanchen**：把第 24、25、27、32、33、37、39、40、47 题合并成一个问题问客户：答案都被批准但彼此不同时怎么办；
  答案相同时以哪份为准；输出按什么规则比较。
- **ADR**：第 38、48、49、51、58、60、69 题。等客户答复以后，和 E3/E4/H4 一起写一份。
- **你（SCRUM-101）**：在 ticket 里写明第 15、16 题的处理方式，并和 SCRUM-51 对齐。
- **Issue #40**：建议改成只讲这个冲突。#40 原来的第 1–6 题，答案分别见本文件第 1、4、53、56、5、1 题。

## 总结

1. **73 个问题里，46 个已经有答案**（20 个客户已答复，26 个团队已定或写在 ticket 里），17 个是实现层面的问题，
   各 ticket 内部定即可。**真正需要问客户的只有 10 个，归结起来是一个问题**：同一个 item 的几份答案都被批准、
   但彼此不同时，要不要进入争议，以哪份为准，输出按什么规则比较。
2. **争议的范围是整个 item。** 触发条件可以是同一份 annotation 上两位 reviewer 的分歧（D7/E1），但争议挡住的、
   专家裁决的都是整个 item，因为每个 item 最多只有一个权威输出（R2-2）。
3. **专家裁决的三种结果都已经由 R2-1 定义清楚。** Accept 从已有的 annotation 里选一份；Return 把整个 item 退回
   正常流程；Reject 结束争议、不选胜者，item 停在未解决状态，并且不能用表示"重做"的 `rejected` 状态。
   裁决是终局的，要再处理只能由项目负责人重开（R2-3，D9）。
4. **你指出的冲突是真问题，而且要先修。** 在客户答复之前，item 不能在没有记录正式答案的情况下变成
   `canonicalized`。修好它，issue 4（导出冲突答案）也就一起解决了。
5. **你手上要做的：** 在 SCRUM-101 里写明第 15、16 题的处理方式（dual sign-off 下两位 reviewer 结论冲突时怎么办），
   和 SCRUM-51 对齐；把 issue #40 改成只讲这个冲突。其余问题不用单独发给客户。
