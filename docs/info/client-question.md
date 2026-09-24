# Client Questions / 客户待确认问题

Recorded 2026-09-14 by Hanchen. Answers are written back here and into the `hej` docs in the same change;
the affected rows in `../specs/roadmap.md` lose their ⏳ once an answer arrives.

2026-09-14 由 Hanchen 记录。客户答复后写回本文件，并同步写入 `hej` 文档；`../specs/roadmap.md` 中相关行在得到答复后去掉 ⏳。

**Status as of 2026-09-24 / 截至 2026-09-24 的状态:** **every question is answered.** Questions 1–7 are
answered; question 6 in the written Round 1 of 2026-09-21, which also answered seven further questions.
**The written Round 2 of 2026-09-24 answered F1, F2, F3 and F5 and four new questions** — and **corrected
question 4**: an expert's adjudication no longer goes back to a reviewer (R2-1). See the "Round 1" and
"Round 2" sections at the end of this file (source: `../shared/client-qa.md`). Roadmap and mission were
updated for Round 1 on 2026-09-22 and for Round 2 on 2026-09-24, together with `../shared/story_src.csv` (new stories B7, B8, D9).

**所有问题都已答复。**问题 1–7 已答复；问题 6 在 2026-09-21 的书面第一轮中答复，该轮还回答了另外七个问题。
**2026-09-24 的书面第二轮答复了 F1、F2、F3、F5 和四个新问题**——并**修正了问题 4**：专家裁决不再退回 reviewer
（R2-1）。见本文件末尾的“第一轮”和“第二轮”两节（来源：`../shared/client-qa.md`）。roadmap 和 mission 已于
2026-09-22 按第一轮、2026-09-24 按第二轮更新，`../shared/story_src.csv` 同步更新（新增 story B7、B8、D9）。

| # | Topic / 主题 | Priority / 优先级 | Needed by / 最晚答复 | Blocks / 阻塞 | Answer / 答复 |
| --- | --- | --- | --- | --- | --- |
| 1 | Canonical vs per-annotator annotations / 权威标注还是各自保留 | Must ask / 必须问 | End of W7 (20 Sep) | D4, D3, F3, H4, I4 — SCRUM-27, 32, 37, 38, 73 | **Answered** — per-author versions are kept, the annotator count is set per task (2026-09-17, also answering F4), and the AI is an author; a release carries one authoritative output plus the full history (F1, answered 2026-09-24 as R2-2) / **已答复**：按作者保留各自版本，标注人数按任务配置（2026-09-17，同时答复 F4），AI 也是作者；发布携带一个权威输出加完整历史（F1，2026-09-24 以 R2-2 答复） |
| 2 | Task lifecycle / 任务状态流转 | Must ask / 必须问 | End of W7 (20 Sep) | B4 — SCRUM-24 | **Answered** — "anything reasonable, no hard requirement"; we decide and write it down / **已答复**：合理即可，没有硬性要求，由我们决定并写入文档 |
| 3 | Who authors a reviewer's correction / 审核修改算谁的 | Must ask / 必须问 | End of W8 (27 Sep) | D3 — SCRUM-32 | **Answered** — each author has their own version / **已答复**：不同作者有各自的版本 |
| 4 | What happens after adjudication / 裁决之后怎么处理 | Must ask / 必须问 | End of W9 (4 Oct) | E3 — SCRUM-52 (E3 part), SCRUM-58 | **Corrected 2026-09-24 (R2-1)** — the expert's adjudication is final: Accept, Return to the open workflow, or Reject; it does not go back to a reviewer. *Superseded:* "back to the reviewer; the expert may not finalise" / **2026-09-24 修正（R2-1）**：专家裁决即终局——接受、退回正常流程或驳回，不再回到 reviewer。*已作废：*“退回 reviewer，专家不能直接定稿” |
| 5 | Default role for invited members / 被邀请成员的默认角色 | Confirm / 建议确认 | This week (W7) | J3 — SCRUM-90 | **Answered** — role chosen at invitation; no default / **已答复**：邀请时必须分配角色，不设默认角色 |
| 6 | Project-level access isolation / 项目级权限隔离 | Confirm / 建议确认 | Before W8 (21 Sep) | G3 scope | **Answered 2026-09-21** — yes, required, enforced in the backend for reads and writes; see R1-6 / **已答复**：需要，后端对读和写都要执行，见 R1-6 |
| 7 | Justification on accept / 接受时是否必须填写理由 | Confirm / 建议确认 | Next weekly meeting | C5 default — SCRUM-31 | **Answered** — always required on accept / **已答复**：接受时无论如何都必须填写理由 |

Ask 1 and 3 together — they are the same data-model question. Question 1 goes first: on its own it
blocks four P0 stories.

问题 1 和 3 一起问，它们是同一个数据模型问题。问题 1 最先问：它一个决定就挡住 4 个 P0 story。

---

## 1. One authoritative annotation, or each annotator's submission kept? / 只保留一个权威标注，还是每人的提交各自保留？

**English**

When two or more people annotate the same item, should the platform:

- **A.** keep **one canonical annotation** per item, which later work replaces; or
- **B.** keep **each annotator's submission separately**, side by side, with none of them "the" answer; or
- **C.** keep each submission separately for review, **and** select or produce one authoritative value
  when the item is finalised?

*Why we ask.* Today the platform cannot tell which of two submissions is current, so a reviewer may be
shown the wrong person's work (issue 3), and an export can contain two conflicting "final" answers for
one item (issue 4). Review, provenance and export all need one defined rule.

*Our suggestion.* **C** — reviewers can address each person's work, and every released item still has
exactly one answer.

**中文**

同一个 item 由两人或多人标注时，平台应该：

- **A.** 每个 item 只保留**一个权威标注**，后续修改覆盖它；
- **B.** **每个标注人的提交各自保留**、并列存放，没有哪一个是"最终答案"；
- **C.** 审核时每份提交各自保留，**并在 item 定稿时**选出或生成一个权威值。

*为什么要问。* 现在平台分不清两份提交哪份是当前的：审核人可能看到另一个人的标注（issue 3），导出里一个
item 可能出现两个互相冲突的"最终答案"（issue 4）。审核、provenance 和导出都需要一条明确的规则。

*我们的建议。* **C**：审核人能分别看到每个人的标注，发布出去的每个 item 仍然只有一个答案。

**Client answer / 客户答复:** partly through question 3 (2026-09-15), then extended on 2026-09-17 /
先通过问题 3 部分答复（2026-09-15），2026-09-17 补充。

> 当task在创建时可选择多少human annotators来完成这个item，
> 每个annotator可创建他们自己的draft且前端只能看见和操作自己的draft.
> 比如设置了需要3人，2个annotator已经创建了他们的draft时item显示2/3.已经存在3个draft后显示3/3 annotate button变暗。
> 当前前端一个item应该只能固定1人submit。
>
> 另外如果使用ai标注的话，直接视为submitted让reviewer review，版本author为ai model，无需human annotator参与。

**Correction, same day / 同日修订:**

> 需要修改：创建draft不限，每个人都能创建他们自己的draft，但是如果已经有3人提交后就会提交失败，然后annotate
> button仍然变暗

- *English:* a task chooses, when it is created, how many human annotators an item needs. **Creating a
  draft is not capped** — anyone may create their own, and sees only their own. **The cap is on
  submission:** once the required number of people have submitted, a further submission fails and the
  Annotate button greys out. Progress reads 2/3, then 3/3. On an AI-assisted task the AI's output goes
  straight to `submitted` for review, the version's author is the AI model, and no human annotator is
  involved.
- *Settled / 已确定:*
  1. Option **A is ruled out** — each author keeps their own version. / 排除选项 A：每个作者保留自己的版本。
  2. **Several annotators per item, the number configured per task.** This also answers follow-up F4. /
     一个 item 可以有多个标注人，人数按任务配置。这同时答复了追问 F4。
  3. **Drafts are unlimited; submissions are what the count limits.** The correction replaces the first
     reading of the answer: an item does not stop at N drafts, it stops at N submissions, and the
     (N+1)-th submission is refused. / **草稿不限，受人数限制的是提交。** 修订取代了最初的理解：item 不是
     在 N 份草稿处停止，而是在 N 次提交处停止，第 N+1 次提交被拒绝。
  4. **Each annotator submits their own version** — the correction speaks of "3 人提交", so this also
     answers follow-up F6, and supersedes the earlier "一个 item 只能固定 1 人 submit". /
     **每个标注人各自提交自己的版本** —— 修订说的是“3 人提交”，因此也答复了追问 F6，并取代了前面那句
     “一个 item 只能固定 1 人 submit”。
  5. **An annotator sees only their own draft.** / 标注人只能看到自己的草稿。
  6. **The AI is an author in its own right**, and its output is reviewed without a human first pass. /
     AI 是独立的作者，其输出无需人工初稿即可进入审核。
- *Still open / 仍需确认:*
  - **F1** — which version is released for an item. Several authors keeping versions does not say which
    one an export carries. / F1：一个 item 发布哪个版本。多作者各自保留版本，并没有说明导出带哪一个。
- *Effect / 影响:*
  - **D8 (SCRUM-48, Kanishka, this week)** — a task item cannot carry a single assignee; assignment must
    hold several annotators, and the task needs a "required annotators" setting. The queue and the limit
    count **submissions, not drafts**. **Tell her before the data model is merged.** / D8：task item 不能
    只有一个 assignee，分配要支持多个标注人，任务上还需要一个“所需标注人数”的设置。队列和上限计的是
    **提交数，不是草稿数**。**在数据模型合并前告诉她。**
  - **The refusal is server-side, not only a greyed-out button.** The (N+1)-th submission has to fail in
    the API, which means a new refusal in `DraftService.submit_draft` — the same function SCRUM-28 and
    SCRUM-26 change this week. / **拒绝要发生在服务端，不只是按钮置灰。** 第 N+1 次提交必须在 API 层失败，
    也就是要在 `DraftService.submit_draft` 里加一条新的拒绝——正是 SCRUM-28 和 SCRUM-26 本周改的那个函数。
  - **D8 (SCRUM-93, W8)** — the 2/3 progress display and greying out Annotate belong to this story. /
    D8：2/3 进度显示和置灰 Annotate 属于这张票。
  - **D4 (SCRUM-27)** — review must address each author's submission separately, which is what this story
    exists for. / D4：审核要能分别处理每个作者的提交，这正是这个 story 的目的。
  - **D6 / SCRUM-25 follow-ups** — confirms the recorded defects that AI output has no author and that the
    first human save takes over the AI's draft. Unlimited drafts also means the web app must stop treating
    one draft per item as the rule. / D6：证实了已记录的缺陷——AI 输出没有作者、第一个人类保存会顶掉 AI 的
    草稿。草稿不限也意味着网页端不能再把“一个 item 一份草稿”当作规则。
  - **Superseded 2026-09-21 by the client's answer R1-4 (below): an AI first pass is separate from the human
    annotator count, and the required count is of independent human judgements.** The original entry is kept
    for the record. / **已被 2026-09-21 客户答复 R1-4（见下文）取代：AI 首轮标注与人工标注人数无关，所需人数计的是
    相互独立的人工判断。** 原条目保留备查。
  - ~~**Our decision, 2026-09-18: an AI submission counts toward the required number of annotators.**~~ The client did
    not say so directly, but it is the reading that makes "no human annotator involved" hold — with one
    required, the AI's submission fills the item; with three, the AI takes one place and two people the rest.
    A failed AI run submits nothing, so its place stays open for a person. / **我们的决定（2026-09-18）：AI 的提交
    计入所需标注人数。** 客户没有直说，但这是让“无需人工标注人参与”成立的唯一读法——要求 1 人时，AI 一交就满；
    要求 3 人时，AI 占一个位置、另外两人占其余。AI 运行失败则不提交，位置留给人。
  - **C4 (SCRUM-87)** — "AI-first" now has a defined meaning: straight to review, no human first pass. /
    C4：“AI 优先”现在有了明确含义——直接进入审核，没有人工初稿。

---

## 2. How does a task move through its states, and who moves it? / 任务状态怎么流转，每一步谁来触发？

**English**

1. What is the intended path? For example `draft → active → completed`, with or without `paused`, and
   whether `in_review` / `disputed` are task states or only item states.
2. Who may trigger each step — the project manager, an administrator, or the system automatically
   (for example completing a task once every item is finished)?
3. Once a task is active, may new items still be added to it?

*Why we ask.* A task currently stays `draft` forever (issue 28), so dataset intake never closes and the
states the export screen is built around never occur.

*Our suggestion.* `draft → active → completed`, with `paused` available from `active`. The project
manager activates, pauses and completes. A task can be completed only when all its items are finished,
and no items can be added once it is active.

**中文**

1. 预期的状态路径是什么？例如 `draft → active → completed`，要不要 `paused`；`in_review` / `disputed`
   是任务的状态，还是只是 item 的状态。
2. 每一步由谁触发：项目经理、管理员，还是系统自动（例如所有 item 完成后任务自动完成）？
3. 任务开始后，还能不能继续往里加 item？

*为什么要问。* 现在任务永远停在 `draft`（issue 28），数据集导入永远不会关闭，导出页依赖的几个状态也永远
不会出现。

*我们的建议。* `draft → active → completed`，`active` 状态下可以 `paused`。由项目经理开始、暂停和完成任务。
所有 item 都完成后才能完成任务；任务开始后不能再加 item。

**Client answer / 客户答复:**

> 合理即可没有硬性要求

- *English:* anything reasonable; no hard requirement.
- *Reading / 解读:* the client is not dictating a path, so **our suggestion stands as the decision**:
  `draft → active → completed`, with `paused` reachable from `active`; the project manager activates,
  pauses and completes; a task completes only when its items are finished; no new items once active.
  Because it is now our decision rather than theirs, it has to be **written into the workflow docs** with
  the same weight as a client instruction — otherwise the next person will reopen it. / 客户没有指定路径，
  所以**我们的建议即为决定**：`draft → active → completed`，`active` 可进入 `paused`；由项目经理开始、暂停、
  完成；所有 item 完成后任务才能完成；任务开始后不再加 item。因为这变成了我们自己的决定而非客户指令，**必须
  写进 workflow 文档**，否则下一个人还会把它重新提出来。
- *Effect / 影响:* **B4 (SCRUM-24) is unblocked.** W8's group 7 loses its ⏳ and no longer needs its
  fallback (F2 / SCRUM-53 pulled forward from W9). Issue 28 can be fixed as planned. Issue 30 — deleting a
  task that has items — also belongs to B4, because whether a task holding review history may be deleted
  is part of the lifecycle we now own. / **B4（SCRUM-24）解除阻塞。** W8 第 7 组去掉 ⏳，不再需要它的 fallback
  （从 W9 提前的 F2 / SCRUM-53）。issue 28 可以按计划修。issue 30（删除有 items 的任务）同样属于 B4——
  有审核历史的任务能不能删，属于我们现在自己拥有的生命周期定义。

---

## 3. When a reviewer corrects an answer, whose answer is it? / 审核人修改了答案，这个修改算谁的？

**English**

When a reviewer submits a corrected value, should it be stored as:

- **A.** a **new version authored by the reviewer** that supersedes the annotator's version; or
- **B.** the **reviewer's own submission**, kept alongside the annotator's, with neither superseding
  the other?

Either way the annotator's original stays visible in the item's history — that part is settled.

*Why we ask.* A reviewer's correction is currently appended as truncated text to a notes field, and the
item finalises with the original, uncorrected value (issue 5). The answer depends on question 1.

*Our suggestion.* **A** — the correction becomes the answer, credited to the reviewer, and the original
is preserved as superseded.

**中文**

审核人提交修改后的值时，应该存为：

- **A.** 一个**由审核人署名的新版本**，取代标注人的版本；
- **B.** **审核人自己的一份提交**，和标注人的提交并列，谁也不取代谁。

无论选哪个，标注人的原始答案都保留在 item 的历史里，这一点已经确定。

*为什么要问。* 现在审核人的修改只是被截断后追加到备注字段里，item 仍然以未修改的原值定稿（issue 5）。
这个问题的答案取决于问题 1。

*我们的建议。* **A**：修改后的值成为答案，记在审核人名下，原答案以"已被取代"的形式保留。

**Client answer / 客户答复:**

> 不同的 author 有不同的 version.

- *English:* Different authors have different versions.
- *Reading / 解读:* closest to **B**. A reviewer's correction is a version authored by the reviewer; the
  annotator's version stays their own and is not overwritten. The same applies to the AI: its suggestion is
  a version authored by the AI, separate from the human's. / 最接近 **B**：审核人的修改是审核人署名的版本；
  标注人的版本仍归标注人，不被覆盖。AI 同理：AI 的建议是 AI 署名的版本，与人的版本分开。
- *Effect / 影响:* D3 (SCRUM-32), F3 (SCRUM-38) and D6's draft ownership (SCRUM-25) must keep one version
  line per author. Which version is authoritative is follow-up F1. / D3（SCRUM-32）、F3（SCRUM-38）和 D6 的
  draft 所有权（SCRUM-25）都要按作者各自保留版本。哪个版本是权威版本见追问 F1。

---

## 4. After an expert adjudicates a dispute, what happens to the item? / 专家裁决之后，item 怎么处理？

> **Corrected by the client on 2026-09-24 — see R2-1.** The answer recorded below (back to the reviewer) is
> superseded: the expert Accepts, Returns or Rejects, and that is final for the dispute. / **客户已于
> 2026-09-24 修正——见 R2-1。**下面记录的答复（退回 reviewer）已作废：专家接受、退回或驳回，对该争议即为终局。

**English**

After an expert settles a dispute, should the item:

- **A.** become **final** with the expert's decision as the authoritative answer; or
- **B.** go **back to the original annotator** to redo it with the expert's guidance; or
- **C.** go through **another round of review**; or
- **D.** follow whichever of these **the expert chooses** for that case?

In every case the annotator's label, the reviewers' decisions and the adjudication stay individually
visible.

*Why we ask.* This decides the workflow after a dispute and what the adjudicator's screen offers.

*Our suggestion.* **D**, limited to A or B — the platform already supports "finalise" and "send back
to annotator" as adjudication outcomes.

**中文**

专家裁决争议之后，item 应该：

- **A.** 直接**定稿**，以专家的决定作为权威答案；
- **B.** **退回原标注人**，按专家的意见重做；
- **C.** **再审一轮**；
- **D.** 由**专家针对每个案例自己选择**以上哪种。

无论选哪个，标注人的标签、审核人的决定和专家的裁决都会分别保留、可以查看。

*为什么要问。* 这决定了争议之后的流程，以及裁决页面提供哪些操作。

*我们的建议。* **D**，但只在 A 和 B 之间选：平台已经支持"定稿"和"退回标注人"两种裁决结果。

**Client answer / 客户答复:**

> 退回给 reviewer, 不允许由arbitrator(expert)直接finalise.

- *English:* The item goes back to the reviewer; the arbitrator (expert) may not finalise directly.
- *Reading / 解读:* closest to **C**, and our suggestion is rejected. The expert's decision does not end the
  dispute; a reviewer finalises. / 最接近 **C**，我们的建议被否决。专家的决定不结束争议，由 reviewer 定稿。
- *Effect / 影响:* the adjudication outcomes on `main` — `finalize` and `send_back` to the annotator
  (`review_actions.py`, `decide_escalation`) — no longer match. E3 (SCRUM-52 E3 part, SCRUM-58) is no longer
  blocked, but its design changes. Details are follow-up F2. / `main` 上的裁决结果（`review_actions.py` 的
  `decide_escalation`：`finalize`，以及 `send_back` 退回标注人）不再符合要求。E3（SCRUM-52 的 E3 部分、
  SCRUM-58）不再被阻塞，但设计要改。细节见追问 F2。

---

## 5. What role does an invited member get? / 被邀请的成员默认拿到什么角色？

**English**

When someone accepts an invitation to an organisation, should they:

- **A.** get a **default role** automatically (for example annotator); or
- **B.** get **no role** until an administrator assigns one; or
- **C.** get the role the **administrator chose when sending the invitation**?

*Why we ask.* Every action now requires an explicit role, so a member who joins through an invitation can
currently do nothing at all. The invitation screens are being built this week.

*Our suggestion.* **C**, with annotator preselected on the invitation form.

**中文**

有人接受组织邀请后，应该：

- **A.** 自动获得一个**默认角色**（例如 annotator）；
- **B.** **没有任何角色**，等管理员分配；
- **C.** 获得**管理员发邀请时选定的角色**。

*为什么要问。* 现在每个操作都要求明确的角色，所以通过邀请加入的成员目前什么都做不了。邀请相关的页面本周
正在开发。

*我们的建议。* **C**，邀请表单默认选中 annotator。

**Client answer / 客户答复:**

> 邀请时就需要角色分配，不能设置默认角色

- *English:* A role must be assigned when inviting; there must be no default role.
- *Reading / 解读:* **C** without a preselected role — the administrator must choose one, and an invitation
  cannot be sent without it. / **C**，但表单不预选角色：管理员必须主动选择，不选角色就不能发出邀请。
- *Effect / 影响:* Tim's SCRUM-90 (W7): the invitation form requires a role, and accepting grants that role.
  The invitation API from SCRUM-8 takes no role yet. / Tim 本周的 SCRUM-90：邀请表单必须选角色，接受邀请即获得
  该角色。SCRUM-8 的邀请接口目前还不接收角色参数。

---

## 6. Must access be limited to individual projects? / 是否需要项目级别的权限隔离？

**English**

If a person is given access to one project, must they be unable to see or change anything in other
projects of the same organisation? Or is it acceptable for roles to apply across the whole organisation?

*Why we ask.* Roles currently apply organisation-wide; project-level roles are defined in the data model
but never used. We have closed the bug that let a request for one project write into another, but not
per-project isolation. If per-project isolation is required, it becomes a separate piece of work.

*Our suggestion.* Organisation-wide roles for this semester, with project-level roles recorded as a
follow-up — unless the client's pilot needs one person restricted to a single project.

**中文**

如果某人只被授权访问一个项目，是否必须保证他看不到、也改不了同一组织下其他项目的任何内容？还是角色在
整个组织范围内生效就可以接受？

*为什么要问。* 现在所有角色都是组织范围的；数据模型里定义了项目级角色，但代码从没用上。我们已经修复了
"对一个项目的请求能写入另一个项目"的漏洞，但没有做到项目级隔离。如果必须做到项目级隔离，需要单独安排
开发。

*我们的建议。* 本学期采用组织范围的角色，项目级角色记为后续工作。除非客户的试点确实需要把某人限制在单个
项目内。

**Client answer / 客户答复:** answered 2026-09-21 — **yes, isolation is required**. The full answer and its
effect are in R1-6 at the end of this file. / 2026-09-21 已答复：**需要隔离**。完整答复和影响见本文件末尾的 R1-6。

---

## 7. Must a reviewer justify an "accept"? / 审核人选择"接受"时也必须填写理由吗？

**English**

Should a written justification be required:

- **A.** on **every** decision, including accept; or
- **B.** only on **reject, modify and dispute**; or
- **C.** **never** required, only optional?

*Why we ask.* The brief says the purpose of human judgement is capturing how people reason. The platform
now lets an organisation or task choose any of the three; we need the client's preferred default.

*Our suggestion.* **A** as the default, since reasoning is the point of judgement tasks, with B available
for high-volume, low-risk labelling.

**中文**

书面理由应该在什么时候必须填写：

- **A.** **每个**决定都要填，包括接受；
- **B.** 只有**拒绝、修改和发起争议**时要填；
- **C.** **从不强制**，只作为可选项。

*为什么要问。* 项目要求指出，收集人工判断的目的是记录人的推理过程。平台现在允许组织或任务在这三种里任选
一种；我们需要客户确定默认值。

*我们的建议。* 默认 **A**，因为判断类任务的核心就是推理过程；对量大、风险低的标注任务可以改用 B。

**Client answer / 客户答复:**

> 无论什么情况，接受时必须有理由

- *English:* A justification is required on accept, in every case.
- *Reading / 解读:* **A**, and not configurable for accept. B and C are not allowed, because both let an
  accept go without a reason. / **A**，而且接受时不可配置。B 和 C 都不允许，因为两者都会让"接受"不填理由。
- *Effect / 影响:* PR #17 (merged) added `required_for_non_accept` and `optional` justification settings;
  both conflict with this answer and need removing or constraining. / 已合并的 PR #17 加了
  `required_for_non_accept` 和 `optional` 两种设置，都与这个答复冲突，需要删除或加以限制。

---

## Follow-up questions / 追问

Raised by the answers above, or by work that reached a decision only the client can make (F5). Ask at
the next client meeting.

由上面的答复引出，或由开发中遇到、只能由客户决定的问题引出（F5）。在下次客户会议上问。

| # | From / 来源 | Question (English) | 问题（中文） |
| --- | --- | --- | --- |
| F1 | Q1, Q3 | ✅ **Answered 2026-09-24 (R2-2):** release output = the authoritative resolution; release provenance = the complete judgement history. | ✅ **2026-09-24 答复（R2-2）：**发布输出＝权威结论；发布溯源＝完整判断历史。 |
| F2 | Q4 | ✅ **Answered 2026-09-24 (R2-1), correcting Q4:** the expert Accepts, Returns (to the open workflow) or Rejects; final for the dispute; no second review. | ✅ **2026-09-24 答复（R2-1），修正 Q4：**专家接受、退回（正常流程）或驳回；对该争议为终局；不再二次审核。 |
| F3 | Q7 | ✅ **Answered 2026-09-24 (R2-4):** required on accept, reject, modify and escalate — not configurable. | ✅ **2026-09-24 答复（R2-4）：**接受、拒绝、修改、升级都必须填写——不可配置。 |
| F4 | Q3 | ✅ **Answered 2026-09-17** through question 1: several annotators per item, the number set per task. | ✅ **2026-09-17 通过问题 1 答复**：一个 item 可以多个标注人，人数按任务配置。 |
| F5 | D5 (SCRUM-28) | ✅ **Answered 2026-09-24 (R2-3):** the project owner reopens directly; other roles may request (can be parked); the item returns to the open workflow; the finalised answer stays as a superseded version. | ✅ **2026-09-24 答复（R2-3）：**项目负责人可直接重开；其他角色可申请（可暂缓）；item 回到正常流程；原定稿答案保留为被取代版本。 |
| F6 | Q1 (2026-09-17) | ✅ **Answered the same day** by the client's own correction: each annotator submits their own version, and the (N+1)-th submission is refused. | ✅ **同日由客户的修订答复**：每个标注人各自提交自己的版本，第 N+1 次提交被拒绝。 |

All six follow-ups are answered. The F4 section below is kept and records what the answers mean for the
work. F1, F2, F3 and F5 were sent as Round 2 (drafted in `../sandbox/W8/msg/client-qa-round2.md`, 2026-09-22)
and answered on 2026-09-24 — see the "Round 2" section at the end of this file.

六个追问都已答复。下面的 F4 一节保留，记录这些答复对开发意味着什么。F1、F2、F3、F5 作为第二轮发出（草稿见
`../sandbox/W8/msg/client-qa-round2.md`，2026-09-22），于 2026-09-24 得到答复——见本文件末尾的“第二轮”一节。

---

## F4. May more than one annotator work on the same item? / 同一个 item 能否由多个标注人标注？

Recorded 2026-09-16. Needed by the end of W7 (20 Sep). Blocks D8 (SCRUM-48, SCRUM-93) and D4 (SCRUM-27).

2026-09-16 记录。最晚 W7 结束（9 月 20 日）前答复。阻塞 D8（SCRUM-48、SCRUM-93）和 D4（SCRUM-27）。

**English**

When items are given out for first-pass annotation, should the platform:

- **A.** give each item to **one annotator** only; or
- **B.** let **several annotators** annotate every item independently, each keeping their own version, with
  the number of annotators set per task; or
- **C.** give each item to one annotator, and send **a set share of items to a second, independent
  annotator** as well?

If B or C:

1. May an annotator see another annotator's work on the item before submitting their own?
2. When two annotators' answers differ, is that a disagreement that opens a dispute automatically, as
   with two reviewers?

*Why we ask.* The platform does not agree with itself today:
- **The API** accepts any number of annotators on an item, and keeps one version per author.
- **The web app** blocks a second annotator. It shows the item as "being annotated" by whoever saved first,
  read-only.
- **The design notes** set one annotator at a time as a team rule; it was never your decision.

Your answer to question 3 allows several authors per item, but does not say whether they may all be
annotators. Assignment is being built this week and must know whether an item has one assignee or several.
Review must know how many submissions it has to show separately.

*Our suggestion.* **A**. Independent checking already happens at review: a set share of items goes to a
second, independent reviewer (story D7). Every author still keeps their own version, so **C** can be added
later without changing how data is stored.

**中文**

分发 item 做初次标注时，平台应该：

- **A.** 每个 item 只分配给**一个标注人**；
- **B.** 每个 item 都由**多个标注人**各自独立标注，每人保留自己的版本，标注人数按任务设置；
- **C.** 每个 item 分配给一个标注人，另外按设定比例把**一部分 item 再交给第二位独立标注人**标注。

如果选 B 或 C：

1. 标注人提交之前，能否看到其他标注人对这个 item 的标注？
2. 两个标注人的答案不同时，是否和两位审核人意见不一致一样，自动发起争议？

*为什么要问。* 平台现在自相矛盾：
- **API** 允许任意多个标注人标注同一个 item，每个作者保留一个版本。
- **网页端** 拦住第二个标注人：谁先保存，item 就显示为谁"正在标注"，其他人只能只读查看。
- **设计文档** 把"同一时间只有一个标注人"写成了团队规则，这从来不是客户的决定。

问题 3 的答复允许一个 item 有多个作者，但没有说明这些作者能否都是标注人。分配功能本周正在开发，需要知道一个
item 是分配给一个人还是多个人；审核也需要知道要分别展示几份提交。

*我们的建议。* **A**。独立复核已经在审核环节进行：按设定比例把一部分 item 交给第二位独立审核人（story D7）。
每个作者仍然保留各自的版本，所以以后需要时可以再加上 **C**，不用改变数据的存储方式。

**Client answer / 客户答复:** **B**, answered 2026-09-17 through question 1 / **B**，2026-09-17 通过问题 1
答复。

The full quotation and its reading are in [question 1](#1-one-authoritative-annotation-or-each-annotators-submission-kept--只保留一个权威标注还是每人的提交各自保留).
完整原文和解读见问题 1。

- *Settled / 已确定:* several annotators per item, **the number chosen per task at creation**. Each keeps
  their own draft and sees only their own. **Creating a draft is not capped — submitting is:** once that
  many people have submitted, the next submission is refused and Annotate greys out. / 一个 item 多个
  标注人，**人数在创建任务时选定**。每人各持自己的草稿、只能看到自己的。**创建草稿不限，受限的是提交**：
  达到人数后，下一次提交被拒绝，Annotate 置灰。
- *Also settled / 同时确定:* each annotator submits their own version (F6). / 每个标注人各自提交自己的
  版本（F6）。
- *Effect / 影响:*
  - The web app's current rule — "one annotator works an item at a time", enforced only in the browser —
    is **wrong** and must be replaced by the per-task count. / 网页端现在的规则"一个 item 同时只有一个标注人"
    （而且只在浏览器里执行）**是错的**，要改成按任务配置的人数。
  - **SCRUM-48 (this week)** must model several annotators per item plus the task-level required count,
    counting **submissions**; **SCRUM-93 (W8)** shows 2/3 and greys out Annotate at the limit. /
    **SCRUM-48（本周）**要支持一个 item 多个标注人，外加任务级的所需人数，计的是**提交数**；
    **SCRUM-93（W8）**负责 2/3 显示和到达上限后置灰 Annotate。
  - The limit has to be enforced in the API, in `DraftService.submit_draft`. A greyed-out button is not
    the rule; it is the display of the rule. / 上限必须在 API 层、在 `DraftService.submit_draft` 里执行。
    置灰的按钮不是规则本身，只是规则的展示。
  - Defect S8 — the one-annotator rule living only in the browser — is resolved by the client choosing a
    different rule, not by enforcing the old one. / 缺陷 S8（一个标注人的规则只活在浏览器里）的结局是客户
    换了一条规则，而不是把旧规则落实到服务端。

---

## Round 1 of 2026-09-21 — the client's written answers / 2026-09-21 第一轮：客户的书面答复

Source: `../shared/client-qa.md`, exported on 2026-09-21 from the client's Q&A document (the link is in
`docs/.env` as `CLIENT_QA_URL`; never copy it into the repository). The document numbers its questions 1–7
again, so they are **R1-1 to R1-7** here to avoid colliding with the questions above. **R1-6 is question 6
above**, asked again and now answered. The quotations are the client's own words; *Reading* and *Effect*
are ours.

来源：`../shared/client-qa.md`，2026-09-21 从客户的问答文档导出（链接在 `docs/.env` 的 `CLIENT_QA_URL`，
不得复制进仓库）。该文档的问题又从 1 到 7 编号，这里记为 **R1-1 至 R1-7**，以免与上文的问题混淆。
**R1-6 就是上文的问题 6**，重新提出，现已答复。引文是客户的原话；*解读*和*影响*是我们的。

| # | Topic / 主题 | Answer in one line / 一句话答复 | Touches / 涉及 |
| --- | --- | --- | --- |
| R1-1 | Which uploaded fields reach the annotator / 上传记录里哪些字段给标注人 | Only the annotation input; provenance fields stay attached; gold labels stay hidden; nothing hard-coded to one field / 只给标注输入；溯源字段保留；gold 不外露；不要写死字段 | B5 intake, C1 (SCRUM-92), C2, I1 |
| R1-2 | Where blind-then-reveal belongs / blind-then-reveal 属于哪一层 | An evaluation protocol, not a production mode / 是评估协议，不是生产模式 | C4 (SCRUM-87), I4 (SCRUM-73) |
| R1-3 | Are labels mandatory / 标签是否必须 | No — optional and task-dependent; design and justify an output abstraction / 否，可选、随任务而定；自行设计并论证任务输出的抽象 | B3 (SCRUM-85), task schema |
| R1-4 | Annotator count and AI / 标注人数与 AI | Claim, not pre-assign; independent; **AI first pass is separate from the human count** / 自取而非预分配；须独立；**AI 首轮标注与人工人数无关** | D8 (SCRUM-48, 93), C4 |
| R1-5 | Customisable task types / 可自定义的任务类型 | No generic builder; explicit, deliberately added types / 不做通用构建器；类型显式、有意添加 | constraint on B3, F2 |
| R1-6 | Project-level access isolation / 项目级权限隔离 | **Yes — required**, enforced in the backend for reads and writes / **需要**，后端对读写都要执行 | G3, G1, J3 — **out of scope for now** (2026-09-22) |
| R1-7 | Editing a policy after the project starts / 项目开始后修改 policy | Allowed, as a **new version**; history is never rewritten / 允许，以**新版本**形式；历史不被改写 | B2 (SCRUM-20), F2, H2 |

### R1-1. Which fields of an uploaded record reach the annotator or the AI? / 上传记录的哪些字段交给标注人或 AI？

Asked with the FewNERD `.jsonl` example: each record carries `external_item_ref`, `split`,
`source_record_id`, `payload_preview.text` and `gold_annotations`.

**Client answer / 客户答复:**

> The uploaded record may contain metadata, annotation input, and evaluation-only fields. These should not
> all be passed to the annotator or AI model.
>
> For the example dataset, `payload_preview.text` is the annotation input. Fields such as
> `external_item_ref`, `split`, and `source_record_id` should remain attached to the item for provenance
> and traceability. `gold_annotations` is evaluation/reference data and should not normally be exposed
> during annotation.
>
> Do not hard-code the platform specifically to `payload_preview.text`; different supported task types may
> use different input structures.

- *Reading / 解读:* a record has three kinds of field — **input** (shown and sent to the AI), **metadata**
  (kept for provenance, not shown as the thing to annotate) and **evaluation-only** (never shown while
  annotating). Which field is the input is a per-task setting, not a constant. / 一条记录有三类字段：
  **输入**（展示并发给 AI）、**元数据**（保留用于溯源）、**仅评估用**（标注时不展示）。哪个字段是输入是任务级
  配置，不是常量。
- *Effect / 影响:*
  - Intake (B5) and the AI call (C1's SCRUM-92 output fit, C2's worker) must choose the input field from
    task configuration rather than a fixed key. **To check in the code:** whether today's intake or AI
    prompt sends the whole record, `gold_annotations` included. / 导入（B5）和 AI 调用（C1 的 SCRUM-92、
    C2 的 worker）要从任务配置里选输入字段，而不是写死。**要在代码里核实：**现在的导入或 AI prompt 是否把整条
    记录（含 `gold_annotations`）都发出去了。
  - `gold_annotations` is exactly the reference data I1 (the evaluation harness) and SCRUM-6's gold fixtures
    need, so it must be stored but kept out of annotator and AI views. / `gold_annotations` 正是 I1 评估框架和
    SCRUM-6 的 gold fixtures 需要的参考数据，所以要存下来，但不进入标注人和 AI 的视图。

### R1-2. How does blind-then-reveal work, and where does it sit? / blind-then-reveal 怎么运作、属于哪一层？

Marked in the client document as *to be confirmed in the next client meeting*; it was answered in writing
all the same.

**Client answer / 客户答复:**

> AI-first and human-only are annotation production modes.
>
> Blind-then-reveal is better treated as an evaluation protocol for human judgement. The annotator first
> makes an independent judgement without seeing the AI suggestion. That judgement is recorded, then the AI
> suggestion is revealed, and the annotator may keep or revise their answer.
>
> This allows the platform to measure how AI assistance affects human judgement, including whether correct
> suggestions help and whether incorrect suggestions introduce anchoring or automation bias.

- *Reading / 解读:* there are **two production modes** (human-only, AI-first) and **one protocol** that runs
  on top of a human judgement. The protocol records **two** judgements from the same annotator — before and
  after seeing the AI — and both must survive, because the difference between them is the measurement. /
  **两种生产模式**（human-only、AI-first）加上**一个协议**，协议叠加在人工判断之上。它会记录同一个标注人的
  **两次**判断——看到 AI 前和看到 AI 后——两次都必须保留，因为两者的差异就是测量对象。
- *Effect / 影响:*
  - **C4 (SCRUM-87)** is currently written as three peer modes with "mode recorded per item". It needs
    redefining: two modes, plus a protocol whose pre-reveal judgement is stored as its own record. The
    story text should be corrected before W9 builds it. / C4 现在写成三个并列模式、“每个 item 记录模式”。
    需要重新定义：两种模式加一个协议，揭示前的判断单独存一条记录。W9 开工前要先改 story 文字。
  - **I4 (SCRUM-73)** measures accept, modify and override rates by C4 mode. With this answer it can also
    measure anchoring — did the annotator move toward a wrong suggestion — which is only possible if the
    pre-reveal judgement is kept. / I4 按 C4 模式统计接受、修改、覆盖比例。有了这个答复，它还能衡量锚定效应
    ——标注人是否被错误建议带偏——前提是保留了揭示前的判断。
  - Not yet confirmed with the client in person; ask it again at the meeting, as the document itself notes. /
    尚未当面向客户确认；如文档所注，在会议上再问一次。

### R1-3. Must every task have labels? / 每个任务都必须有标签吗？

**Client answer / 客户答复:**

> Labels should be optional and task-dependent. Some annotation tasks require a predefined label set,
> while others may produce text, ratings, preferences, spans, or other structured outputs.
>
> Do not assume that every task must have labels. You should design an appropriate abstraction for task
> outputs and justify the choice.

- *Reading / 解读:* the client is asking **us** for a design, not for a decision — the same posture as the
  document's closing comment (below). Deliverable: a proposal for how a task declares its output structure,
  with the trade-offs. / 客户要的是**我们的设计**，而不是替我们做决定，这与文档结尾的评语一致。交付物：一份
  “任务如何声明其输出结构”的方案，附权衡。
- *Effect / 影响:* the natural home is **B3 (SCRUM-85)**, the annotation-versus-judgement result shape, which
  is still To Do on the board and marked complete in the records. It should be reopened and given this
  scope. / 最自然的落点是 **B3（SCRUM-85）**——标注与判断结果的形状——它在看板上仍是 To Do，记录里却已标为
  完成。应重开并纳入这个范围。

### R1-4. How many annotators, and does the AI count among them? / 需要多少标注人，AI 算不算其中一个？

Asked as: with three human annotators required, is claiming work rather than pre-assignment fine; and for
AI assistance, is it enough for the chosen model to annotate once?

**Client answer / 客户答复:**

> For human annotation, if an item requires 3 independent annotations, it is fine for annotators to claim
> available work rather than pre-assigning three specific people.
>
> The important requirement is that the system collects 3 independent human judgements. Showing progress
> such as `2/3 completed` is fine, but annotators should not see the previous judgements before submitting
> their own if independence is required (and most of the time, it is required).
>
> AI first-pass annotation is separate from the human annotator count. A configured model producing one
> successful first-pass annotation is sufficient unless the task explicitly defines a multi-model
> evaluation experiment.

- *Reading / 解读:* claiming, the `2/3` display and "an annotator sees only their own draft" all confirm
  what is already built or planned. What is new: **the required count is a count of independent human
  judgements**, and the AI's first pass sits outside it. / 自取、`2/3` 显示、“标注人只能看到自己的草稿”都印证了
  已有或已计划的做法。新的是：**所需人数计的是相互独立的人工判断**，AI 首轮标注在它之外。
- *Effect / 影响:*
  - **This contradicts our decision of 2026-09-18** — "an AI submission counts toward the required number of
    annotators" (question 1 above). The client's wording governs; that decision is withdrawn (2026-09-22). The
    2026-09-17 answer still stands — on an AI-assisted task the AI's output goes to review with the model as
    author — but the AI no longer fills one of the N human places. / **这与我们 2026-09-18 的决定相冲突**——
    “AI 的提交计入所需标注人数”（见上文问题 1）。以客户的原话为准，该决定已撤回（2026-09-22）。2026-09-17 的答复仍然有效
    ——AI 辅助任务里 AI 的输出以模型为作者进入审核——但 AI 不再占用 N 个人工名额之一。
  - **SCRUM-48's API (Kanishka, W7) was built on the 2026-09-18 decision** and counts an AI submission toward
    the limit. It must count human submissions only. **Tell Kanishka before it merges**; SCRUM-93's `2/3`
    display follows the same rule. / **SCRUM-48 的 API（Kanishka，W7）是按 2026-09-18 的决定做的**，把 AI 提交
    也计入上限。必须改成只计人工提交。**合并前告诉 Kanishka**；SCRUM-93 的 `2/3` 显示遵循同一规则。
  - A multi-model experiment (several models on one item) is allowed only when a task **explicitly defines
    it** — not a default, and not needed for the demo path. / 多模型实验（同一 item 多个模型）只有任务**明确
    定义**时才允许——不是默认，演示路径也不需要。
  - Independence is now stated as a requirement, not a preference: it must hold in the API, not only on the
    screen. / 独立性现在是明确要求而不是偏好：必须在 API 层成立，不能只靠界面。
  - **Confirmed 2026-09-22 (Hanchen):** on an AI-first task, one successful AI annotation sends the item
    straight to review; no human submission is needed first. The human count applies to human-only tasks.
    This is what C4 is written to. / **2026-09-22 确认（Hanchen）：**AI-first 任务的 item 由 AI 成功标注一次后
    直接进入审核，不需要先有人工提交。人工人数只适用于 human-only 任务。C4 按此撰写。

### R1-5. May task owners define their own task types? / 任务负责人能自定义任务类型吗？

**Client answer / 客户答复:**

> Do not build a generic free-form task or workflow builder.
>
> Task owners should be able to configure instructions, guidelines, and task-specific options, but
> supported annotation/output structures should be explicitly implemented in the system.
>
> A few text boxes describing an objective and expected output are not enough to define a new task type.
> If additional task types are required, they should be added deliberately rather than recreating a
> general-purpose system such as Label Studio.

- *Reading / 解读:* confirms the brief's non-goals (`mission.md` → Non-Goals). A task owner configures
  instructions, guidelines and options **within** a supported output structure; a new structure is a piece
  of engineering. / 印证项目要求的非目标（`mission.md` → Non-Goals）。任务负责人在**已支持的**输出结构之内
  配置说明、指南和选项；新增结构属于开发工作。
- *Effect / 影响:* no story changes. It bounds R1-3's abstraction — a fixed, explicit set of output
  structures, not a schema editor — and F2's guideline versions. / 不改变任何 story。它限定了 R1-3 的抽象——
  一组固定、显式的输出结构，而不是 schema 编辑器——也限定了 F2 的指南版本。
- **Our decision, 2026-09-22: keep the current design, cut nothing.** The existing `custom_task` subtype
  (`annotation_schemas.py`) accepts a task-owner-supplied output schema, which sits close to the builder the
  client rules out. It stays as it is; no new configurable structures are added on top of it, and if the
  client objects when R1-3's proposal is sent, it is the first thing to revisit. / **我们的决定（2026-09-22）：
  保留现有设计，不删减。** 现有的 `custom_task` 子类型接受任务负责人提供的输出 schema，离客户否定的“通用构建器”
  很近。维持现状，不在其上继续扩展可配置结构；如果发送 R1-3 方案时客户提出异议，它是第一个要重新审视的地方。

### R1-6. Is project-level access isolation required? / 是否需要项目级权限隔离？

This is question 6 above, asked again.

**Client answer / 客户答复:**

> Yes, project-level access isolation is required.
>
> A user who has access to one project should not automatically be able to read or modify another project
> in the same organisation unless they have an organisation-level capability that explicitly permits it.
>
> Project-level permissions therefore need to be enforced on the backend for both read and write
> operations, not only through the UI.

- *Reading / 解读:* our suggestion — organisation-wide roles this semester, project-level as a follow-up —
  is **rejected**. A project-scoped role must actually limit what its holder can read and write, and an
  organisation-level capability is the explicit way to reach across projects. / 我们的建议——本学期用组织范围的
  角色、项目级作为后续工作——被**否决**。项目级角色必须真正限制持有人能读、能写的内容；跨项目访问要靠显式的
  组织级能力。
- *Effect / 影响:*
  - Today `RoleScope.PROJECT` exists and is never read, and only organisation-scoped roles are honoured
    (`tech-stack.md`). The G3 criterion "access to one project" therefore **still cannot be met**, even with
    the cross-project write guard of PR #14 — that closed issue 9 (a write bypass), not isolation. / 现在
    `RoleScope.PROJECT` 存在但从未被读取，只认组织范围的角色（`tech-stack.md`）。因此 G3 的“只访问一个项目”
    **仍然无法满足**，PR #14 的跨项目写入保护关闭的是 issue 9（写入绕过），不是隔离。
  - **This is unscheduled work.** The mission's risk table listed it as blocking nothing scheduled; it now
    needs a ticket and a place in the plan. It touches G1's capability resolution, every read route (list
    and get, not only writes), the queues of D8 and J3's member screens, which must let an administrator
    grant a project-scoped role. **Proposal for the next weekly meeting**, not decided here. / **这是尚未排入
    计划的工作。** mission 的风险表曾说它不阻塞任何已排的工作；现在它需要一张 ticket 和排期。涉及 G1 的能力
    解析、所有读取路由（列表和详情，不只是写入）、D8 的队列，以及 J3 的成员页面（要能授予项目级角色）。
    **留到下次周会提案**，此处不做决定。
  - `mission.md` → Risks and `tech-stack.md` → What We Are Not Using both say project-scoped roles are not
    honoured; both change when this is scheduled. / `mission.md` 的风险和 `tech-stack.md` 的“我们不用什么”
    都写着项目级角色不被使用；排期时两处都要改。
- **Update 2026-09-22 (Hanchen):** a further reply was received; project-level isolation is **out of scope
  for now**. It is not scheduled, and the two spec entries above stay as they are. G3's "access to one
  project" criterion therefore remains unmet by design, not by omission. / **2026-09-22 更新（Hanchen）：**已收到
  进一步答复，项目级隔离**暂时视为 out-of-scope**。不排期，上面两处 spec 维持原样。因此 G3 的“只访问一个项目”
  是有意不满足，而不是遗漏。

### R1-7. Can a policy be edited after the project starts? / 项目开始后能修改 policy 吗？

Asked as: two reviewers required at the start, some items already reviewed by two — may the policy change
to three?

**Client answer / 客户答复:**

> Policies may evolve after a project starts, but previous history must not be rewritten.
>
> For example, if policy v1 requires 2 reviewers and an item satisfies that policy, changing the
> requirement later to 3 reviewers should create a new policy version rather than making it appear that
> the earlier item was always governed by the new rule.
>
> New work should follow the new policy version. The system should preserve which policy version applied to
> each item so that its annotation, review, and release history remains traceable.

- *Reading / 解读:* a policy is **versioned**. Editing creates version n+1; an item keeps the version it was
  governed by; new work follows the latest. This is the same idea as F2's guideline versions, applied to
  policy. / policy 是**有版本的**。修改产生第 n+1 版；item 保留它当时适用的版本；新工作按最新版本。这与 F2 的
  指南版本是同一个思路，只是用在 policy 上。
- *Effect / 影响:*
  - **B2 (SCRUM-20) freezes a task's policy** — approvals, cross-review percentage and disagreement rule
    "frozen per task". That design is an alternative the client did not choose: a freeze blocks the edit,
    while the client wants the edit with a new version. SCRUM-20 is In Review, so **tell Jingwei before it
    merges** whether the freeze is kept as the first step (later edits create versions) or replaced. / B2
    （SCRUM-20）把任务的 policy “按任务冻结”。这是客户没有选的方案：冻结是禁止修改，客户要的是允许修改并生成
    新版本。SCRUM-20 正在 In Review，**合并前告诉 Jingwei**：冻结是保留作为第一步（之后的修改生成新版本），
    还是替换掉。
  - Each item must record the policy version that governed it; F1, F3 and H2's manifest then have it to
    cite. D7's cross-review sampling reads the percentage of the policy version in force. / 每个 item 要记录
    适用的 policy 版本；F1、F3 和 H2 的 manifest 才有东西可以引用。D7 的交叉复核抽样读取当前生效版本的比例。
  - It adds a schema change to W8's list of migrations if it lands there; agree the order on day one. /
    如果排在 W8，它会给 W8 的迁移清单再加一项；第一天就要约定顺序。

### Client's closing comment / 客户的结语

> These are all important questions, and they show that you are thinking seriously about the product rather
> than just implementing requirements mechanically.
>
> Some of these questions genuinely need my input because they touch the product's intended behaviour or
> design. Others can and should be decided through your own reasoning and design work. In those cases,
> please make a concrete proposal, explain the reasoning and trade-offs, and send it to me for review.
>
> I would like you to have more product ownership and autonomy in this project, so you do not need to wait
> for me to make every design decision.

- *Reading / 解读:* the client wants **proposals, not waiting**. R1-3 asks for one explicitly. The open
  follow-ups F1, F2, F3 and F5 can be sent the same way — our recommendation, the reasoning, the trade-off
  — and treated as decided unless the client objects. F1's fallback rows in `roadmap.md` exist because we
  waited for an answer; this changes that. / 客户要的是**方案，而不是等待**。R1-3 明确要求一份方案。仍未答复的
  F1、F2、F3、F5 也可以这样发：我们的建议、理由、权衡，客户不反对即视为定案。`roadmap.md` 里 F1 的 fallback
  行是因为我们在等答复才存在的；这一点现在变了。

### An open request to the client / 向客户提出的未决请求

The document opens with an unchecked item to Hunter, the GitHub admin: *enable branch protection* — A1's
"no change reaches the main branch without an approving review from someone other than its author". It has
no answer. A1 is set aside (`mission.md` → Stories Set Aside), with one piece reopened by SCRUM-94, so this
is recorded, not scheduled. / 文档开头有一条未勾选的事项，写给 GitHub 管理员 Hunter：*启用 branch
protection*——即 A1 的“没有他人的批准审核，任何改动都不能进入 main 分支”。目前没有回复。A1 已被搁置
（`mission.md` → Stories Set Aside），仅由 SCRUM-94 重开了一部分，所以这里只记录，不排期。

### What this round did not answer / 这一轮没有回答的问题

*(Superseded 2026-09-24: all four were answered in Round 2 below.)* **F1, F2, F3 and F5 are unchanged and still open.** F5 — who may reopen a finalised item — is the one D5
waits on. **Drafted as Round 2 on 2026-09-22** for the 2026-09-23 meeting — see the Follow-up questions
section above and `../sandbox/W8/msg/client-qa-round2.md`. / **F1、F2、F3、F5 没有变化，仍未答复。** D5 在等的
是 F5——谁能重开已定稿的 item。**已于 2026-09-22 拟成第二轮**，用于 2026-09-23 的会议——见上文“追问”一节和
`../sandbox/W8/msg/client-qa-round2.md`。

---

## Round 2 of 2026-09-24 — the client's written answers / 2026-09-24 第二轮：客户的书面答复

Source: `../shared/client-qa.md`, exported on 2026-09-24 from the same online document (the link is in
`docs/.env` as `CLIENT_QA_URL`). Round 2 was drafted on 2026-09-22 (`../sandbox/W8/msg/client-qa-round2.md`)
and extended with questions 5–8 before it was sent. Questions are numbered **R2-1 to R2-8**. **R2-1 to R2-4
are follow-ups F2, F1, F5 and F3** — all four are now answered. The quotations are the client's own words;
*Reading* and *Effect* are ours.

来源：`../shared/client-qa.md`，2026-09-24 从同一份在线文档导出（链接在 `docs/.env` 的 `CLIENT_QA_URL`）。
第二轮于 2026-09-22 拟稿（`../sandbox/W8/msg/client-qa-round2.md`），发送前又加了第 5–8 题。问题记为
**R2-1 至 R2-8**。**R2-1 至 R2-4 就是追问 F2、F1、F5、F3**——四个现在都已答复。引文是客户原话；*解读*和
*影响*是我们的。

| # | Topic / 主题 | Answer in one line / 一句话答复 | Touches / 涉及 |
| --- | --- | --- | --- |
| R2-1 (F2) | After adjudication / 裁决之后 | **Corrects question 4:** the expert's decision is final for the dispute — Accept, Return or Reject; it does not go back to a reviewer / **修正问题 4：**专家裁决对该争议是终局——接受、退回或驳回；不再回到 reviewer | E3, E4, E6 — W8 group 8 |
| R2-2 (F1) | What a release carries / 发布包含什么 | Output = the authoritative resolution; provenance = the complete judgement history / 输出是权威结论；溯源是完整判断历史 | H1, H2, H4, F3 |
| R2-3 (F5) | Reopening a finalised item / 重开已定稿 item | Project owner reopens directly; others may request; back to the open workflow; old answer kept as superseded / 项目负责人可直接重开；其他人只能申请；回到正常流程；原答案保留为被取代版本 | D5, F4, H4 |
| R2-4 (F3) | Justification beyond accept / 接受以外的理由 | **Yes** — accept, reject, modify and escalate all require one / **需要**——接受、拒绝、修改、升级都必须填 | C5, D3, E2 |
| R2-5 | Minimum provenance / 最低溯源要求 | An item-level list and a manifest-level list; item drill-down is enough, no project-wide timeline / 给出 item 级和 manifest 级清单；item 下钻足够，不需要全项目时间线 | F1, F2, F3, F5, H2 |
| R2-6 | Subtype vs `annotation_type` / subtype 与 `annotation_type` | Agreed: subtype becomes an optional template; a task-level `annotation_type` picks the editor / 同意：subtype 变为可选模板；由任务级 `annotation_type` 选编辑器 | B3 (follow-on work) |
| R2-7 | Cross-review / 交叉复核 | **Supplies**, not stacks; sampled review is a **gate**; the AI first pass is never an approval, and never canonical unreviewed / **补足**而非叠加；抽样复核是**关卡**；AI 首轮不算批准，未经人工审核绝不成为定稿 | D7, G2, B2, C4 |
| R2-8 | Governance models / 治理模式 | Defined by the authority needed to canonicalise; Expert Gate on every item; Arbitration-ready = a dispute **must** reach independent adjudication (needs a field); no self-adjudication / 按定稿所需权限定义；Expert Gate 每个 item 都要专家确认；Arbitration-ready＝争议**必须**进入独立裁决（需要字段）；不得裁决自己经手的工作 | G2, E5, B2, E3 |

### Two requests at the top of the document / 文档开头的两条要求

> **Action required:** For any important decision we make, please create an ADR (Architecture Decision
> Record) under `docs/adr/`, using the naming format `adr00N_short_title.md`.
>
> **A suggestion:** Going forward, would it be better to raise product/design questions as GitHub issues in
> the repo, label them `QA`, and assign or tag me? I can answer there, and you can then either close the
> issue as a clarification, convert it into an implementation task, or link it to a PR.

- *Reading / 解读:* the ADR is a **requirement**; `docs/adr/` means the `hej` repository. The first
  candidates are decisions this round settles or asks us to own: the adjudication outcomes (R2-1), release
  output vs provenance (R2-2), `annotation_type` replacing subtype (R2-6), the governance models (R2-8),
  policy versions (R1-7) and the source-record projection (R1-1). The GitHub-issue route is a question to
  answer — adopting it would move Q&A out of the Google Doc and this file's export step. / ADR 是**要求**；
  `docs/adr/` 指 `hej` 仓库。第一批候选是本轮定下或要求我们自己决定的事项：裁决结果（R2-1）、发布输出与溯源
  （R2-2）、`annotation_type` 替代 subtype（R2-6）、治理模式（R2-8）、policy 版本（R1-7）、源记录投影（R1-1）。
  GitHub issue 的方式是一个需要回复的问题——采用后问答会从 Google Doc 和本文件的导出步骤中移走。

### The principle stated before the answers / 答复前先说明的原则

> **Disagreement is not merely an exception that the workflow should eliminate. It is first-class,
> high-value data.** Who disagreed, on what, why, under which guideline/policy, and how the disagreement was
> resolved—or remained unresolved—should be preserved. A canonical answer is a production outcome; the
> disagreement lineage is also an important research/evaluation asset.

- *Reading / 解读:* this is E4's story ("Resolving a dispute doesn't erase the disagreement") promoted to a
  product principle. It also makes **"resolved as ambiguous"** a legitimate end state (R2-1). / 这是把 E4
  （“解决争议不会抹掉分歧”）上升为产品原则。它也让**“以歧义结案”**成为合法的终态（R2-1）。

### R2-1. After adjudication, who reviews next? (F2) / 裁决之后由谁审核？（F2）

**Client answer / 客户答复:**

> I want to correct one part of my earlier answer: an expert adjudication should not normally go back to a
> reviewer for another decision. The expert exists to resolve a disagreement that ordinary
> annotation/review could not resolve.
>
> I would expect three expert actions:
>
> - Accept: accept one of the existing judgements as the resolved answer.
> - Return: none of the existing judgements is satisfactory; return the item, with a reason, to the normal
>   open workflow for new annotation/review. The previous dispute remains in its lineage.
> - Reject: reject the disputed result/dispute as a valid resolution. It does not proceed automatically to
>   another review stage.
>
> The expert's adjudication is therefore final for that dispute. Only a Return reopens the item.
> Also, "resolved" does not necessarily mean that one answer won. An item may be resolved as genuinely
> ambiguous/unresolved. The customer may later decide whether to exclude it or otherwise handle it in a
> release.

- *Reading / 解读:* **question 4's answer ("back to the reviewer; the expert may not finalise") is
  withdrawn.** An adjudication has one of three outcomes, each final for that dispute: **Accept** picks an
  existing judgement; **Return** sends the item, with a reason, to the open workflow (new annotation and
  review) and keeps the dispute in its lineage; **Reject** closes the dispute without a winner and starts
  nothing. A dispute may also end as **ambiguous/unresolved**, which release (H3/H4) must be able to exclude
  or carry. *Our reading, to confirm in the ADR:* Reject leaves the item unresolved — the "ambiguous" end
  state — and the project owner decides what happens next (for example through R2-3's reopen). /
  **问题 4 的答复（“退回 reviewer，专家不能直接定稿”）作废。**裁决有三种结果，对该争议都是终局：**Accept**
  选定一个已有判断；**Return** 带理由把 item 退回正常流程（重新标注和审核），争议留在其沿袭中；**Reject** 结束
  争议、不选胜者，也不触发下一步。争议还可以以**歧义/未解决**结案，发布（H3/H4）要能排除或携带它。*我们的理解，
  在 ADR 中确认：*Reject 让 item 停在未解决——即“歧义”终态——由项目负责人决定下一步（例如通过 R2-3 的重开）。
- *Effect / 影响:*
  - **W8 group 8 (Hanchen, E3/E4) changes scope mid-week.** "The expert no longer finalising" and the exit
    check "sends the item back to the reviewer" are both wrong now. The adjudication record needs an
    outcome (accept / return / reject), the selected judgement for Accept, and a required reason; Accept
    canonicalises through the adjudication, and Return reuses R2-3's reopen path. / **W8 第 8 组（Hanchen，
    E3/E4）本周中途改范围。**“专家不再定稿”和 exit check“退回 reviewer”现在都不对了。裁决记录需要结果
    （accept / return / reject）、Accept 时选定的判断、必填理由；Accept 通过裁决定稿，Return 复用 R2-3 的重开路径。
  - `mission.md` (the Adjudicate row), `roadmap.md` and the E3, E4 and E6 text in `story_src.csv` state the
    old rule and need rewriting. / `mission.md`（Adjudicate 一行）、`roadmap.md` 和 `story_src.csv` 里 E3、
    E4、E6 的文字写的是旧规则，需要改写。

### R2-2. Which version of an item does a release carry? (F1) / 发布携带 item 的哪个版本？（F1）

**Client answer / 客户答复:**

> Keep all versions and their provenance, but distinguish them from the authoritative released result.
>
> A released item should identify its resolved/canonical output, if one exists, while also preserving or
> linking to all annotation attempts, AI first-pass outputs, reviewer corrections, disputes, and
> adjudication decisions.
>
> So:
>
> release output = authoritative resolution,
> release provenance = complete judgement history
>
> Do not flatten the history into only the final answer.

- *Reading / 解读:* both of our options, in two layers. Each released item has **at most one** authoritative
  output ("if one exists" — an ambiguous item from R2-1 may have none), plus a link to every version and
  decision behind it. / 两个选项都要，分两层。每个发布的 item **至多一个**权威输出（“如果存在”——R2-1 的歧义
  item 可能没有），外加指向其背后所有版本和决定的链接。
- *Effect / 影响:* F1 no longer blocks anything. **H4 (SCRUM-37)** can start: one canonical value per item,
  the rest kept and shown as superseded — its ⏳ and every F1 fallback row in `roadmap.md` go. H1/H2 carry
  the output and link the provenance. / F1 不再阻塞任何工作。**H4（SCRUM-37）**可以开始：每个 item 一个权威值，
  其余保留并显示为被取代——`roadmap.md` 里它的 ⏳ 和所有 F1 fallback 行都去掉。H1/H2 携带输出并链接溯源。

### R2-3. Who may reopen a finalised item? (F5) / 谁能重开已定稿的 item？（F5）

**Client answer / 客户答复:**

> The project owner may reopen a finalised item directly.
>
> Annotators, reviewers, and experts may request reopening. If implementing the request workflow is too
> large for this iteration, it can be parked, but the permission distinction should remain clear.
>
> A reopened item returns to the normal open workflow, rather than simply resuming at the previous review
> step.
>
> The previous finalised answer must remain in history as a superseded version. It should never be
> overwritten.

- *Reading / 解读:* **reopen** is a project-owner capability; **request reopen** belongs to the other roles
  and may be parked. A reopen does not resume review — the item goes back to open work. / **重开**是项目
  负责人的权限；**申请重开**属于其他角色，可以暂缓。重开不是恢复审核——item 回到开放的标注工作。
- *Effect / 影响:* D5's refusal logic (SCRUM-28, done) stays. The missing half is a reopen action gated on
  the project-owner capability, which marks the finalised answer superseded (F4 and H4 read that) and puts
  the item back in the available-work list (D8). R2-1's Return uses the same path, so it is built once.
  **Decided 2026-09-24:** a new story, **D9** (SCRUM-110), in the mid-semester break; requests from other roles are out of scope (Hanchen's reply in the online document). / D5 的拒绝逻辑
  （SCRUM-28，已完成）保留。缺的一半是受项目负责人权限控制的重开操作：把定稿答案标为被取代（F4、H4 读取），并把
  item 放回可领取工作列表（D8）。R2-1 的 Return 走同一路径，只建一次。**2026-09-24 决定：**新建 story **D9**（SCRUM-110），排在期中假期；其他角色的申请不在范围内（Hanchen 在在线文档中的回复）。

### R2-4. Is a justification required beyond "accept"? (F3) / 接受以外是否也必须填写理由？（F3）

**Client answer / 客户答复:**

> Yes.
>
> A justification should be required for substantive reviewer actions including:
>
> - accept
> - reject
> - modify
> - escalate to dispute
>
> The reason is part of the judgement/provenance record, not merely UI commentary.

- *Reading / 解读:* not configurable — every substantive reviewer action requires a reason, stored as part
  of the record. / 不可配置——每个实质性审核操作都要理由，理由作为记录的一部分保存。
- *Effect / 影响:* C5 (done) enforces it on accept. **To check in the code:** whether reject, modify (D3)
  and escalate already refuse an empty justification on the backend; any that do not are a defect against
  C5. / C5（已完成）在 accept 上强制。**要在代码里核实：**reject、modify（D3）和 escalate 是否已在后端拒绝空理由；
  没有的，算 C5 的缺陷。

### R2-5. Minimum provenance for a released item / 发布 item 的最低溯源要求

Asked as: our export already carries the requester, item references, annotation creators, the AI model (as
notes), timestamps, and review decisions with justifications; we assumed guideline versions and earlier
attempts were missing. Is Task History's item-level drill-down enough?

**Client answer / 客户答复:**

> At item level, I would expect enough information to reconstruct how this released judgement came to
> exist, including at least:
>
> source/item identity and source version/reference; task instructions/guideline version; policy version;
> annotation attempts; AI first-pass/model information where applicable; human actors and timestamps;
> review decisions and justifications; disputes and expert/adjudication decisions; reopen/supersession
> lineage; and the final resolution used by the release.
>
> Because the platform may not store the customer's underlying data, the source reference should be stable
> enough to identify the exact source/version used.
>
> At release level, the manifest should identify the release/version, included items, which
> resolution/version was selected for each item, and the relevant task/guideline/policy versions.
>
> The existing item-level drill-down is the important requirement. I do not require a complete
> chronological project-wide timeline in the dashboard. A project activity view may be useful
> operationally, but the essential property is that a released item can be traced backwards completely.

- *Reading / 解读:* a checklist. **Item level (10):** source identity and version; guideline version;
  policy version; annotation attempts; AI first pass and model; human actors and timestamps; review
  decisions and justifications; disputes and adjudications; reopen/supersession lineage; the selected
  resolution. **Manifest level (4):** release id/version; included items; the resolution selected per item;
  task, guideline and policy versions. / 一份清单。**item 级（10 项）：**源标识及版本；指南版本；policy 版本；
  标注尝试；AI 首轮及模型；人员及时间；审核决定及理由；争议及裁决；重开/取代沿袭；所选结论。**manifest 级（4 项）：**
  发布 id/版本；包含的 item；每个 item 所选结论；任务、指南和 policy 版本。
- *Effect / 影响:*
  - This becomes the acceptance criteria of **F1** (events), **F2** (guideline and policy version on each
    annotation) and **H2** (manifest). The AI model moves from free-text notes to a recorded field (F3). /
    这成为 **F1**（事件）、**F2**（每条标注的指南和 policy 版本）和 **H2**（manifest）的验收标准。AI 模型从
    自由文本备注改为记录字段（F3）。
  - "A stable source reference" means B5 intake keeps a source version, not just a path. / “稳定的源引用”
    意味着 B5 导入要保留源版本，而不只是路径。
  - **A project-wide timeline is not required** — F5 (SCRUM-106) stays an item-level screen; a project
    activity view is optional. / **不需要全项目时间线**——F5（SCRUM-106）保持为 item 级页面；项目活动视图可选。

### R2-6. Task subtype and `annotation_type` / 任务 subtype 与 `annotation_type`

Asked as: our proposal to add a task-level `annotation_type`, chosen from the editors Hej supports, so that
backend result mapping and the frontend editor both read it and the subtype is only a starting template.

**Client answer / 客户答复:**

> Yes, this approach is much closer to what I mean.
> If the actual task can be expressed through:
> input data + instructions/examples + output schema
> and the existing annotation/review machinery can handle it faithfully, then a new hard-coded task subtype
> is unnecessary.
> The subtype can therefore become an optional starting template rather than part of the task ontology.
> Using a task-level `annotation_type` to select the compatible renderer/editor is reasonable. I would think
> of this as the human annotation surface / result representation, not as the task itself.
> A genuinely new type only needs explicit implementation when it requires a new interaction surface or
> different system behaviour.

- *Reading / 解读:* the proposal is accepted. `annotation_type` is the **annotation surface**, not the
  task's identity; the subtype becomes a template. / 方案被接受。`annotation_type` 是**标注界面**，不是任务的
  身份；subtype 变为模板。
- *Effect / 影响:* follow-on work to B3 (done): make `annotation_type` a task-level setting read by result
  mapping and the editor choice, and demote `task_subtype`. Now story **B8** (SCRUM-112, mid-semester break); needs an ADR and a ticket. /
  B3（已完成）的后续：把 `annotation_type` 设为任务级设置，供结果映射和编辑器选择读取，降级 `task_subtype`。
  现为 story **B8**（SCRUM-112，期中假期）；需要一份 ADR 和一张票。

### R2-7. Cross-review: supplies or stacks, gate or audit, and the AI / 交叉复核：补足还是叠加、关卡还是审计、AI

**Client answer / 客户答复:**

> **Supplies or stacks?**
> Supplies. If the policy requires two approvals and cross-review provides the second independent approval,
> that satisfies the two-approval requirement. It should not silently become three reviews.
>
> **Gates or audits?**
> For sampled cross-review, treat it as a gate. A sampled item should not canonicalise until its required
> cross-review completes. Unsampled items proceed normally.
>
> If you later want post-hoc auditing, that should be a separate concept rather than overloading
> cross-review.
>
> **Does an AI annotation get cross-reviewed?**
> AI first-pass is not an approval or reviewer slot. It is an AI-produced candidate/first pass.
>
> The human judgement/review that may become canonical is what the review policy governs. If that item is
> selected for cross-review, the human-reviewed result goes through cross-review. The AI first-pass remains
> part of the provenance.
>
> Under no circumstances can the AI first pass become the canonical answer without being reviewed by humans.

- *Reading / 解读:* all three of our proposals accepted. Cross-review **counts toward** the approvals
  required; a sampled item is **held** until its cross-review completes; the AI never fills an approval
  slot, and **no item canonicalises on AI output alone** — a hard invariant. / 我们的三条提议全部被接受。
  交叉复核**计入**所需批准数；被抽中的 item 在复核完成前**不能定稿**；AI 不占批准名额，**任何 item 都不能只凭
  AI 输出定稿**——这是硬性不变量。
- *Effect / 影响:* D7 (SCRUM-51) and G2 (SCRUM-50) build the gate and the counting this way; the Dual
  sign-off default (2 approvals + 100% cross-review) costs two looks, not three. The AI invariant needs a
  backend check and a test (C4, and I2's break cases). / D7（SCRUM-51）和 G2（SCRUM-50）按此实现关卡和计数；
  Dual sign-off 默认值（2 次批准 + 100% 复核）是两次审核，不是三次。AI 不变量需要后端检查和测试（C4，以及 I2 的
  破坏性用例）。

### R2-8. Governance models: Expert Gate and Arbitration-ready / 治理模式：Expert Gate 与 Arbitration-ready

**Client answer / 客户答复:**

> I would define these by **what authority is required before an item may be resolved/canonicalised**,
> rather than as UI presets.
>
> **Standard**
> A normal reviewer approval is sufficient to canonicalise an item. Disputes may still be escalated to an
> expert when needed.
>
> **Dual sign-off**
> Two independent approvals are required. Cross-review can provide the second approval. If those judgements
> disagree, the item enters dispute.
>
> **Expert Gate**
> Every item requires expert confirmation before it can become canonical, whether or not a dispute occurred.
>
> A normal path might therefore be:
>
> *annotation → review → expert gate → canonical*
>
> If the policy is one reviewer plus one expert gate, I would normally set cross-review to 0% rather than
> adding a third mandatory look. Additional cross-review can still be configured deliberately.
>
> The expert should not approve an item that they themselves annotated or reviewed.
>
> **Arbitration-ready**
> This is **NOT** about disputes being statistically more likely. It is a governance guarantee:
>
> **if a dispute occurs, it must reach independent adjudication.**
>
> That is what distinguishes it from Dual sign-off. Dual sign-off specifies how ordinary agreement is
> established; Arbitration-ready specifies what must happen when agreement fails.
>
> So yes, the model needs an explicit rule/field representing that adjudication is mandatory on dispute.
>
> An arbitrator should not arbitrate a dispute involving work that they annotated or reviewed themselves.
>
> The broader design principle behind Expert Gate and Arbitration-ready is that the platform should not
> merely make disagreement disappear. It should preserve the disagreement, its reasons, and the authority
> structure through which it was resolved.

- *Reading / 解读:* the four presets are **policies over authority**, not labels. Two need new stored
  values: an **expert-gate** requirement (every item) and an **adjudication-mandatory-on-dispute** rule. One
  independence rule covers both expert roles: **no expert confirms or adjudicates work they annotated or
  reviewed** — an extension of D1's self-approval guard. Expert Gate's default cross-review is 0%. / 四个
  预设是**关于权限的策略**，不是标签。需要两个新的存储值：**专家关卡**要求（每个 item）和**争议必须裁决**规则。
  一条独立性规则覆盖两类专家角色：**专家不得确认或裁决自己标注或审核过的工作**——是 D1 自审保护的扩展。
  Expert Gate 默认交叉复核为 0%。
- *Effect / 影响:* G2 (SCRUM-50) and B2's `ResolvedPolicy` gain the two fields; E5 (SCRUM-107, "escalation
  matches the assurance my project needs") is where the Arbitration-ready guarantee is enforced; E3's
  adjudicator check and the Expert Gate step both apply the independence rule. Expert Gate adds a workflow
  step (review → expert confirmation → canonical) — **decided 2026-09-24:** folded into G2's criteria rather than a new story. / G2（SCRUM-50）和 B2 的 `ResolvedPolicy` 增加这两个字段；E5（SCRUM-107）负责执行 Arbitration-ready
  的保证；E3 的裁决人检查和 Expert Gate 步骤都适用独立性规则。Expert Gate 新增一个工作流步骤（审核 → 专家确认
  → 定稿），——**2026-09-24 决定：**并入 G2 的验收标准，不新建 story。

### Later additions to Round 1 in the online document / 在线文档中对第一轮的后续补充

Found in the 2026-09-24 export under Round 1's questions; they refine the answers recorded above. /
2026-09-24 导出时在第一轮各题下发现的补充，细化了上文记录的答复。

- **R1-1 — JSONL import is in scope.** Yi reported that intake treats a whole `.jsonl` file as one item.
  Hunter: *"Direct import of the provided JSONL datasets should be in scope… each record should become an
  item"*; the concept is **one source record = one item**, not "one task = one paragraph", and
  preprocessing into `.txt` files is only a local workaround. On Hanchen's proposal to let the AI find the
  field: *"The annotation target should be determined by the task/schema, not by the AI"* — **source record
  → task/schema projection → annotation payload**. No universal mapping engine; whether the owner defines
  the input schema or supported types ship adapters is ours to propose. **Effect:** B5 intake needs a
  record-splitting import and an explicit projection per task — now story **B7** (SCRUM-111, W8), with an ADR first. / **R1-1——JSONL 直接导入在范围内。**Yi 报告导入把整个 `.jsonl` 当成一个 item。Hunter：每条记录
  应成为一个 item；概念是**一条源记录＝一个 item**，预处理成 `.txt` 只是本地权宜之计。对 Hanchen 让 AI 自行找
  字段的提议：标注目标由任务/schema 决定，不由 AI 决定——**源记录 → 任务/schema 投影 → 标注内容**。不做通用映射
  引擎；由任务负责人定义输入 schema 还是由支持的类型提供适配器，由我们提议。**影响：**B5 导入需要按记录拆分，并为
  每个任务显式定义投影——现为 story **B7**（SCRUM-111，W8），先写 ADR。
- **R1-3 — confirmed.** With an empty label list, label instructions are omitted, but *"make sure the
  expected output structure is still explicit for that task."* / **R1-3——已确认。**标签列表为空时省略标签说明，
  但该任务的预期输出结构仍须明确。
- **R1-5 — relaxed, then settled by R2-6.** A separate subtype is needed only for *different system
  behaviour*; the test is *"Can this task be expressed faithfully by instructions (prompts) + examples +
  output schema, with the existing annotation/review machinery unchanged?"* The stable concepts are *input
  data + task/judgement instruction + expected output + provenance*; the annotation UI is an interaction
  layer, not the task ontology. / **R1-5——放宽，并由 R2-6 定案。**只有需要不同系统行为时才需要独立 subtype；
  稳定概念是输入数据＋任务/判断说明＋预期输出＋溯源；标注界面是交互层，不是任务本体。
- **R1-6 — our reply sent.** Hanchen answered that isolation is treated as nice-to-have because the roadmap
  is full until mid-W12 (final demo; W13 report), matching the decision of 2026-09-22. No client response
  yet. / **R1-6——我们的回复已发出。**Hanchen 回复：因 roadmap 排满到 W12 中（最终演示；W13 报告），隔离作为
  nice-to-have，与 2026-09-22 的决定一致。客户尚未回应。
- **R1-7 — our reply sent:** *"Sure, the policy will be editable."* / **R1-7——我们的回复已发出：**policy 将可编辑。
- The **branch-protection** request is no longer in the document: rulesets on a private repository need the
  organisation on GitHub Team, which Hunter cannot arrange (2026-09-23). A1 stays set aside. / **branch
  protection** 请求已不在文档中：私有仓库要启用规则集，组织需要升级到 GitHub Team，Hunter 无法办理（2026-09-23）。
  A1 仍搁置。

### What is still open / 仍未决的事项

**No client question is open.** The GitHub-issue suggestion is accepted: Hanchen replied on 2026-09-24 that
**from Round 3, questions go to the client as GitHub issues labelled `QA`** in the `hej` repository, not in
the Google Doc. What remains ours is the ADRs the client asked for. / **没有未答复的客户问题。**已接受 GitHub
issue 的建议：Hanchen 于 2026-09-24 回复，**从第三轮起，问题以带 `QA` 标签的 GitHub issue 发给客户**（在 `hej`
仓库），不再用 Google Doc。剩下要我们做的是客户要求的 ADR。
