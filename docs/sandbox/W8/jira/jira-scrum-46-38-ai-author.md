# 看板改动 —— SCRUM-46 第 2 条验收标准、SCRUM-38 接下 AI 作者

2026-09-23，来自 PR #29 的评审（`../../../reviews/W8/review-cs57-michael-scrum-46-ai-trigger.md`）。

**为什么改：** SCRUM-46 原来的第 2 条写的是"a submitted annotation **authored by the AI**"，来自客户
2026-09-17 的答复（版本作者是 AI 模型）。#29 的实现把 `created_by` 留成 NULL，因为它是 `users` 表的外键，
编一个用户 id 会让 provenance 记录失真；模型本身记在 `annotation_data.metadata.ai` 的 `provider` / `model` 里。
**Hanchen 2026-09-23 决定：接受这个中间状态**，但要求两件事同时发生——SCRUM-46 的验收标准改成实现真正做到的
事，"AI 作为正式作者"由 SCRUM-38 接下，不能只留在 PR 描述里。

同时给 SCRUM-46 补一条验收标准：**失败的 item 必须能被新的 run 重跑**。这是评审第 1 项，#29 合并前要修。

| 票 | 怎么改 |
| --- | --- |
| SCRUM-46 | 整篇替换（改第 2 条，新增第 6 条） |
| SCRUM-38 | 在现有描述后面**追加**两段，其余不动 |

---

## SCRUM-46 — Task queue: Trigger an AI run and route completed items to review

**改了什么：**
- 第 2 条：`authored by the AI` → `submitted by the AI`，并写明作者位如何记录、为什么。
- 新增第 6 条：dead-letter 的 item 可以被新的 run 重跑（评审第 1 项）。
- 其余原文保留。

```
Related to user story C2

ONLY BACKEND

Today AI annotation only runs as a side effect of dataset registration, and its output lands as an unclaimed pending draft that the first human save takes over (PR #22 keeps that behaviour). The client answered on 2026-09-17: AI output is treated as submitted, goes straight to review, and its author is the AI model.

# A task owner can start an AI run for a task at any time, not only at intake; the call returns the batch id. Enqueue is idempotent: the unique (batch_job_id, task_item_id) constraint means a repeated trigger cannot double-charge.
# A successful item becomes an annotation submitted by the AI, written through SCRUM-26's atomic submission path, and the item moves to review. The annotation's created_by stays NULL, because it is a foreign key to users and inventing a user would falsify the provenance record; the model that produced it is recorded in annotation_data.metadata.ai (provider, model) and the operator who triggered the run in metadata.ai.triggered_by. Giving the AI an author identity of its own is SCRUM-38 (decided 2026-09-23). Until it exists, an AI annotation is identified by created_by IS NULL, and two models cannot both annotate one item.
# The AI's annotation does not count toward the task's required annotators (client answer, 2026-09-21): that number counts human submissions only, so SCRUM-48's limit neither counts nor refuses it. One successful AI annotation per item is enough, unless the task explicitly defines a multi-model experiment.
# ai_item_jobs gains result_annotation_id, pointing at that annotation. The table already exists on every database, so this needs a migration step - agree the order with the other W8 schema changes on day one.
# Failed items stay visible as failed (SCRUM-3) and submit nothing.
# A dead-lettered item can be picked up by a later run. Its failed draft is unclaimed machine output, not annotation work, so it must not make the item look already annotated - otherwise a batch that hit a provider outage can never be retried and only a human claiming the failed draft moves the item on. A test: dead-letter an item, trigger a run, the item is covered and ends succeeded.
```

---

## SCRUM-38 — Provenance: Preserve AI, annotator, reviewer and adjudicator outputs separately

**改了什么：** 原描述只有两句，全部保留，后面追加"AI 作者"这一段和两条验收标准。粘贴时在现有内容**后面**接上，
不要替换 `Story *F3*` / `Issues *4*, *5*` 两行（`tracking-sync` 靠它们建立映射）。

```
Added 2026-09-23, from the review of PR #29 (SCRUM-46).

The AI is an author in its own right (client answer, 2026-09-17), but annotations.created_by is a foreign key to users, so SCRUM-46 leaves an AI annotation unauthored and identifies it by created_by IS NULL. That works for one model and nothing else: every AI annotation on an item is indistinguishable from every other, annotation lookup is keyed by (task_item_id, created_by), and a second AI submission would update the first in place - no new version, no history, under a reviewer who may already have acted on it. SCRUM-46 refuses to write it. This ticket is where the AI gets an identity instead.

# An annotation records what kind of author produced it and, for machine output, which model - without inventing a user account. Whatever shape is chosen, keep the model already recorded in metadata.ai as the source of truth for the run, so existing rows stay readable.
# Two models can annotate the same item without overwriting each other, which is what the client's "unless the task explicitly defines a multi-model experiment" (R1-4) assumes. SCRUM-46's one-AI-annotation-per-item refusal is then a task-level rule rather than a limitation of the data model.
```

---

## 发出后

- SCRUM-46 粘贴完再通知 Michael，避免他按旧的第 2 条去改代码。
- `roadmap.md` 的 W8 第 5 组不用改：那里写的是"AI output as a submitted annotation authored by the AI"，
  在下次周会后的更新里一并改成与看板一致。
