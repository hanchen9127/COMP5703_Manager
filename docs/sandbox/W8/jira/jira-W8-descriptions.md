# W8 每张票的完整描述（可直接粘贴）

2026-09-22。W8 sprint 里每张票的**整篇**描述，粘贴时整段替换原描述。

> **2026-09-22 更正（客户 9/21 答复 R1-4）：** AI 首轮标注不计入所需人工标注人数；标注人提交前不能看到别人的判断。
> 已改 SCRUM-46、SCRUM-48、SCRUM-93 三段——**SCRUM-46、93 如果已经粘贴过，需要重新粘贴**。依据：`../../specs/roadmap.md` 的 W8 一节、
`jira-W8-sprint.md`、`jira-replace-parent-tickets.md`，以及 2026-09-22 在 `origin/main`（`23e62a9`）上核对过的代码。

- 每段第一行都是 `Related to user story X`，`tracking-sync` 靠它建立映射，不能删。
- 原描述里的有效内容都保留了；已经和现状不符的说法改掉了，改动原因在每张票的"改了什么"里说明。
- **SCRUM-98、99、100 已经按 `jira-replace-parent-tickets.md` 完整粘贴过，不用再改**，这里没有重复列出。
- 编号列表用 `# `，和看板上其他票一致。

| 票 | 负责人 | 点数 | 这次要做的 |
| --- | --- | --- | --- |
| SCRUM-93 | Kanishka | 2.5 | 整篇替换（加上 S10） |
| SCRUM-86 | Parth | 1 | 整篇替换（原描述过时） |
| SCRUM-51 | Parth | 1.5 | 整篇替换（原描述只有一句） |
| **D2 新票** | Parth | 1 | **新建** |
| SCRUM-27 | Jingwei | 2 | 整篇替换（原描述还写着"等客户决定"） |
| SCRUM-3 | Michael | 1.5 | 整篇替换（保留你加的 5 个后续项） |
| SCRUM-46 | Michael | 1.5 | 整篇替换 |
| SCRUM-5 | Tim | 1 | 整篇替换 |
| SCRUM-24 | Dishank | 2.5 | 整篇替换（原描述还写着"先问客户"） |
| SCRUM-48 | Kanishka | 顺延 | **改两处**：函数名（已改）；AI 不计入人数 + 标注人提交前看不到别人的答案（2026-09-22） |
| SCRUM-90 | Tim | 顺延 | **追加一条**（被邀请人的接受界面） |
| SCRUM-50 | Jingwei | 顺延 | 不改（Jingwei 9/20 已重写） |

---

## SCRUM-93 — Work queues: available-work list, progress and submission limit (WEB)

**改了什么：** 保留原内容，加上 S10（SCRUM-26 手动测试中发现的缺陷）。

```
Related to user story D8

FRONTEND

Rescoped 2026-09-17: there is no assignment. No "assign to" controls, no assignee column, no reassignment UI. The screen shows what the viewer may take and how full an item already is.

# An available-work list, filtered to what the viewer's role allows, with an item opening directly from it.
# Progress on each item reads as, for example, 2 of 3 — how many have submitted against how many the task requires.
# Annotate is greyed out once the item has as many submissions as the task requires.
# The item shows how many people are working it and how many have submitted, so a viewer can see it is covered without opening it.
# The existing "X is annotating this item" block is removed: several annotators per item is the rule now, each with their own draft.
# Fix S10: on a returned item, Save draft must keep what the annotator typed.
# An annotator does not see other annotators' submissions on the item before submitting their own (client answer, 2026-09-21) — the screen shows only the 2-of-3 count, never the answers.

The required count is of human submissions: the AI's annotation is not one of the 3 (client answer, 2026-09-21).

S10, found in SCRUM-26's manual walkthrough: on a returned item, editing the answer and clicking Save draft reverts the editor to the previously submitted answer and saves that instead; submitting directly works. Two causes:
- selectDraftForViewer (lib/task-workspace-data.ts) prefers the viewer's submitted draft over their pending one, and after rework an item has both. Prefer the viewer's own pending draft.
- The editor's initialising effect (components/task-item-workspace-sheet.tsx) is keyed on the whole item object, so any re-render discards unsaved typing. Key it on item.id, or leave the editor alone once it is dirty.
With several annotators per item, picking the wrong draft could show another annotator's work.

Built on SCRUM-48's queue API. Blocked by SCRUM-48.

Every limit shown here is enforced in the API as well — a greyed-out button is the display of the rule, not the rule.
```

---

## SCRUM-86 — Review: Prevent self-review of own annotations

**改了什么：** 原描述说"审核人能批准自己的工作"，现在已经不对了。核对过 `main`：审核动作
（`review_actions.py:297`）和 `approve_draft`（`drafts.py:318`）都已经调用 `assert_not_self_approval`。
**剩下的只有升级和专家裁决两条路径**，这正是 roadmap 里 issue 7 还是"部分修复"的原因。

```
Related to user story D1

ONLY BACKEND

Issue 7 (Critical) is partly fixed: review actions (review_actions.py, submit_task_item_review_action) and approve_draft (drafts.py) already call assert_not_self_approval. Two paths still let a person decide on their own work:
- route_escalation — escalating an item you annotated yourself;
- decide_escalation — deciding a dispute on your own item, including as an administrator.

# Refuse escalating, or deciding a dispute on, an item whose annotation you authored — with an explanation that names the reason, not a bare 403.
# The same rule applies to administrators: there is no override (see api_surfaces.md, "no administrator or reviewer override").
# Only users holding the required capability can act at all: DISPUTE to escalate, ADJUDICATE to decide.
# A test for each path fails on the old behaviour and passes now.

Merge this in the first two days of W8: SCRUM-99 (E3, Hanchen) rewrites decide_escalation on top of it.
The D2 ticket (same file, review_actions.py) lands after this one or in the same PR.
```

---

## SCRUM-51 — Review: Independent second reviewer

**改了什么：** 原描述只有一句。按 roadmap 分成 W8 第一部分和 W9 两部分写清楚；W8 只算第一部分的 1.5 点。

```
Related to user story D7 and E1

ONLY BACKEND

This ticket runs over two weeks. Its W8 slice needs neither D8's queues nor B2's percentage, and W9's sampling builds on it, so the slice must finish in W8.

W8 — first slice (1.5 points):
# A second reviewer cannot see the first reviewer's decision until their own is submitted.
# Two distinct reviewers' verdicts on the same item are compared, and disagreement between them is flagged.
# The blind review and the disagreement flag follow B2's approvals and disagreement rule, read through SCRUM-50's resolve_for_task — not from the policy tables directly.

W9 — second slice:
# Sample items by the cross-review percentage set in B2 and place them in a second-review queue that excludes the first reviewer, on SCRUM-48's queue model.
# E1's automatic dispute (SCRUM-101) opens from the flag above.

Verdicts come from ReviewDB.verdict (PR #17).
```

---

## 新票 — D2 剩余子任务（Parth，W8，1 点）

**Summary**
```
Review: Review actions always move item status, and state cannot diverge from history
```

**Description**
```
Related to user story D2

ONLY BACKEND

SCRUM-29 closed D2's first part: the legacy review writes return 410 (PR #6). D2's subtasks 2 and 4 have no code yet, so this ticket carries them.

# Every review action moves the task item to the status it implies, in the same write — no action leaves the item where it was.
# A test proves item status and review history cannot diverge: after any sequence of review actions, the item's status matches what its latest decision implies.

Same file as SCRUM-86 (review_actions.py): land after SCRUM-86, or in the same PR.
```

---

## SCRUM-27 — Review / Annotation: Reviewer should be able to select the correct submitted annotation

**改了什么：** 原描述还写着"BLOCKED on a client decision"。客户 9/17 已答复：每个作者保留自己的版本。
真正还没定的只剩"发布时带哪个版本"（F1），而它不影响审核这部分。

```
Related to user story D4

ONLY BACKEND

On an item annotated by two people, review picks "the latest annotation" (review_actions.py, _latest_annotation), which is effectively random — a reviewer can approve the wrong person's submission with no sign anything went wrong.

No longer blocked on the review side: the client answered on 2026-09-17 that each author keeps their own version. SCRUM-26 now records draft.annotation_id, so every submission names the annotation it produced.

# Opening an item for review always shows a specific, identified annotator's submission.
# On an item annotated by two people, both submissions are individually addressable — the reviewer never gets an arbitrary one.
# The review decision is recorded against the submission the reviewer actually opened (ReviewDB.annotation_id).
# approve_draft stops falling back to the item's first "latest" annotation, which may be another author's (defect S7).
# A test on a two-annotator item returns a specific, identified submission every time.

Still open: which version a release carries — client follow-up F1, asked at the 2026-09-23 meeting. That is H4's rule (SCRUM-37), not this ticket's.
Closes issue 3. Provenance events (SCRUM-98, F1) reference the same link.
```

---

## SCRUM-3 — Task queue: Retry failed items and preserve permanent failures

**改了什么：** 保留原来的说明和你 9/21 加的 5 个后续项，补上重试本身的验收标准（原描述只有一句目标）。

```
Related to user story C2

ONLY BACKEND

One failed item must not sink a batch of a thousand. Temporary failures retry; permanent ones stay visible as failed rather than disappearing. Do not copy the MVP's TaskRunner, which prints the error and drops the item from the output.

# Classify each failure as transient (rate limit, timeout, provider 5xx) or permanent (bad schema, unsupported task, missing key), stored in ai_item_jobs.last_error_kind.
# Transient failures retry with backoff through next_attempt_at, up to max_attempts.
# Permanent failures, and items out of attempts, end as dead_letter with the real error — visible, never dropped, never silently retried.
# A batch with any dead_letter item ends as completed_with_failures, not completed.
# A test for each path.

Follow-ups from PR #22's review (2026-09-21):
# Test the lease fence's owner check: worker A records while B still holds the lease → lease_lost, job stays running under B. Today, removing lease_owner == worker_id leaves every test green.
# Take worker_id from the claim, not from item_job.lease_owner at load time (run_once / run_next_item already have it).
# Move test_ai_batch_worker.py onto conftest.py's shared empty_engine fixture (keep autoflush=False), so the claim and fenced UPDATEs run in CI on PostgreSQL.
# Add lease_expires_at < now to both UPDATEs in reclaim_expired_leases. On PostgreSQL, a sweep can otherwise erase another worker's fresh lease. Needs an interleaving test.
# When building the analyzer fails (e.g. task subtype changed after enqueue), dead-letter at once as permanent with the real error message, instead of waiting three lease expiries and recording "Abandoned after 3 attempt(s)".

Condition: until follow-ups 3 and 4 are done, do not switch on worker mode on PostgreSQL, and do not run more than one worker.
SCRUM-5 (Tim) reads the job fields this ticket changes — agree them on day one.
```

---

## SCRUM-46 — Task queue: Trigger an AI run and route completed items to review

**改了什么：** 原描述只有一行关键词。补上客户 9/17 的答复（AI 的输出是作者为 AI 的已提交结果）和 PR #22
review 里定下的范围。

```
Related to user story C2

ONLY BACKEND

Today AI annotation only runs as a side effect of dataset registration, and its output lands as an unclaimed pending draft that the first human save takes over (PR #22 keeps that behaviour). The client answered on 2026-09-17: AI output is treated as submitted, goes straight to review, and its author is the AI model.

# A task owner can start an AI run for a task at any time, not only at intake; the call returns the batch id. Enqueue is idempotent: the unique (batch_job_id, task_item_id) constraint means a repeated trigger cannot double-charge.
# A successful item becomes a submitted annotation authored by the AI, written through SCRUM-26's atomic submission path, and the item moves to review.
# The AI's annotation does not count toward the task's required annotators (client answer, 2026-09-21): that number counts human submissions only, so SCRUM-48's limit neither counts nor refuses it. One successful AI annotation per item is enough, unless the task explicitly defines a multi-model experiment.
# ai_item_jobs gains result_annotation_id, pointing at that annotation. The table already exists on every database, so this needs a migration step — agree the order with the other W8 schema changes on day one.
# Failed items stay visible as failed (SCRUM-3) and submit nothing.
```

---

## SCRUM-5 — Task queue: Display batch progress and per-item job status

**改了什么：** 原描述说"Depends on SCRUM-1 and SCRUM-2"，这两张已经合并（PR #21、#22）。改写成可验收的内容，并注明换人。

```
Related to user story C2

With a thousand items running, the project manager needs to see how much of the batch is done, in flight or stuck.

Moved from Michael to Tim on 2026-09-21. The job tables exist (PR #21) and the worker writes them (PR #22).

# An endpoint returns a batch's progress: counts per item status (queued, running, retry_wait, succeeded, skipped, dead_letter), and the batch status.
# The per-item list shows each item's status, attempt count and last error, so a stuck or failed item can be found.
# The task screen shows the progress, and a batch that ends completed_with_failures is shown as such — never as plain "completed".
# Progress is derived with GROUP BY on (batch_job_id, status), as the schema document intends — no counters to drift.

Reads the fields SCRUM-3 changes — agree them with Michael on day one.
```

---

## SCRUM-24 — Task Lifecycle: Implement valid task lifecycle transitions

**改了什么：** 原描述还写着"实现前先问客户"。客户 9/17 答复"anything reasonable, no hard requirement"，所以生命周期由我们定。
加上 issue 30。

```
Related to user story B4

ONLY BACKEND

A task stays a draft forever today, so dataset intake never closes and the states the export dashboard is built around can never occur.

The client answered on 2026-09-17: "anything reasonable, no hard requirement" — the path is ours to define and write down.

# Lifecycle: draft → active → completed, with paused reachable from active and back.
# The project manager triggers each step (MANAGE_TASK); the transitions are explicit endpoints, not a generic status write.
# A task completes only once every item is finished, using SCRUM-43's rule (assert_task_completeable / is_task_item_export_eligible) — one completion rule, not a second one.
# Dataset intake closes once a task is active.
# SCRUM-48's queues offer work only in the task states this defines.
# Document the states and transitions in workflow_states.md in the same change.

Also issue 30: deleting a task or project that has items returns 500 on a foreign-key error. Decide the policy first — is a task holding review history deletable at all? — then implement it.

Closes issue 28.
```

---

## SCRUM-48（顺延）—— 改两处

**1.** 原描述第 4 条写的是 `use SCRUM-43's is_item_finished()`，这个函数不存在。SCRUM-43（PR #26）实际提供的是
`is_task_item_export_eligible`。把那一条改成（看板上已改好）：

```
# A full item is no longer offered in the annotate queue, and a finished item is never offered at all (use is_task_item_export_eligible() from SCRUM-43, PR #26 — the same rule task completion and export use).
```

**2.**（2026-09-22 新增）客户 9/21 答复 R1-4：AI 首轮标注不计入人工标注人数，撤回我们 9/18 的决定。把第 3 条
`# A submission is refused once … — an AI submission counts as one of them. …` 整条替换为下面两条：

```
# A submission is refused once the item already has as many human submissions as its task requires. The AI's annotation is not counted and is never refused by this limit (client answer, 2026-09-21: an AI first pass is separate from the human annotator count). Drafts are not capped — anyone may start one, and each person sees only their own.
# An annotator cannot read other annotators' submissions on the item before submitting their own — enforced in the API, not only on the screen. The count (2 of 3) may be shown; the answers may not.
```

---

## SCRUM-90（顺延）—— 追加一条

原描述缺被邀请人的接受界面（roadmap 早就记着这个缺口）。在三个 `h1.` 之后追加：

```
h1. As an invitee, I can see my pending invitations and accept one — G5's missing screen, added to this ticket's scope on 2026-09-14.
```
