# Jira 改写草稿 —— SCRUM-48 / SCRUM-93（D8 范围变化）

2026-09-17。两张票的描述现在整篇是指派，而指派已经取消。下面是可直接粘贴的替换文本。
改完在看板上重新下载 `Jira.csv` 到 `../../shared/`，然后跑 `tracking-sync`。

格式沿用看板现状：首行 `Related to user story D8`（`tracking-sync` 靠这行做映射，**不能动**），
然后 `ONLY BACKEND` / `FRONTEND`，然后 `# ` 开头的自动编号列表，最后是背景段落。

---

## SCRUM-48（API，本周，Kanishka，In Progress）

### Summary —— 改

```
Work queues: role-checked queues, annotator count and submission limit (API)
```

> 原标题是 `Review: Assign or claim work and provide role queues (API)`。
> "Assign or claim" 里的 assign 已经不存在了，claim 也不再需要——没有认领动作，看到就能做。

### Description —— 整篇替换

```
Related to user story D8

ONLY BACKEND

Rescoped 2026-09-17: there is no assignment. A task owner does not hand items to named
annotator accounts, so this ticket has no assignee field, no individual or bulk assignment
endpoints, and no reassignment. Work is self-served from role-checked queues.

# Queue endpoints return what the caller may actually take, by role: annotation work, review work, adjudication work.
# A task carries a required-annotators count, chosen at creation.
# A submission is refused once that many people have already submitted on the item. Drafts are not capped — anyone may start one, and each person sees only their own.
# A full item is no longer offered in the annotate queue, and a finished item is never offered at all (use SCRUM-43's is_item_finished()).
# The queues carry independence: a reviewer is never offered an item they annotated themselves, and a second review is never offered to the first reviewer.
# Taking and submitting an item are recorded against the person in the item's history, even though nobody handed it to them.

The submission limit belongs in DraftService.submit_draft, where SCRUM-28 and SCRUM-26 are
also adding refusals this week. Agree the order and the merge sequence with Hanchen before
either lands.

Independence is a condition in the queue query, not a property of an assignee, because there
is no assignee. D7 (SCRUM-51) samples into that same query in W9, so agree its shape with Parth.

No open defects catalogued, because the concept is absent rather than broken: there is no queue
of any kind, so an annotator has no way to find work except by scrolling the item list.
```

---

## SCRUM-93（前端，W8，Kanishka，To Do）

### Summary —— 改

```
Work queues: available-work list, progress and submission limit (WEB)
```

### Description —— 整篇替换

```
Related to user story D8

FRONTEND

Rescoped 2026-09-17: there is no assignment. No "assign to" controls, no assignee column, no
reassignment UI. The screen shows what the viewer may take and how full an item already is.

# An available-work list, filtered to what the viewer's role allows, with an item opening directly from it.
# Progress on each item reads as, for example, 2 of 3 — how many have submitted against how many the task requires.
# Annotate is greyed out once the item has as many submissions as the task requires.
# The item shows how many people are working it and how many have submitted, so a viewer can see it is covered without opening it.
# The existing "X is annotating this item" block is removed: several annotators per item is the rule now, each with their own draft.

Built on SCRUM-48's queue API from W7. Blocked by SCRUM-48.

Every limit shown here is enforced in the API as well — a greyed-out button is the display of
the rule, not the rule.
```

---

## 还要看一眼的第三张票

**SCRUM-52**（Parth，To Do，关联 D8/E3/E6/G1）描述写的是：

> Show *assigned* disputes, verify adjudicator role, open real cases and allow an authorized decision

"assigned disputes" 同样不成立了。建议改成：

```
Show the adjudication queue filtered by role, open real cases and allow an authorized decision
```

**SCRUM-51**（Parth，In Progress）的描述没有指派措辞，不用改。

---

## 改完之后

1. 在看板上重新下载 `Jira.csv` 到 `../../shared/`。
2. 跑 `tracking-sync`：它会按 `Related to user story D8` 重新映射，并刷新 tracker 的快照页。
3. `story_src.csv` 的 `scrum` 列不用手动改——`tracking-sync` 只增不减，两张票本来就已经挂在 D8 上。

## 一处要你定的

新标题用了 `Work queues:` 这个前缀，看板上现有的前缀是 `Review:`、`Annotation:`、`Dispute:`、
`Release & Export:`。D8 的队列同时覆盖标注、审核、仲裁三种角色，归到 `Review:` 下面会名不副实，
所以我新起了一个。你要是想保持前缀集合不变，改成 `Review:` 也行，只是标题会略微失准。
