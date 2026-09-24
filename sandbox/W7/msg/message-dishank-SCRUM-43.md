# 给 Dishank 的消息 —— SCRUM-43 的 `is_item_finished()` 与 Kanishka 的队列

2026-09-19。SCRUM-43（B6）在看板上是 In Progress（W7 sprint），但 `origin/CS57-Dishank` 自 9/12 之后没有新
提交，`is_item_finished()` 也不在任何远程分支上。Kanishka 的 SCRUM-48 队列本周就要用它。W7 已改为 9/23（周三）client meeting 后结束（2026-09-19 更新，同日重查过他的分支，仍无新提交）。英文写。

**依据：** `roadmap.md` 里 W7 的 SCRUM-43 行，以及"SCRUM-43 ↔ SCRUM-48 (API)""SCRUM-43 ↔ SCRUM-62"两条协作行；
`plan-SCRUM-28-26.md` 的协调表；`message-kanishka-SCRUM-48-questions.md`。

---

## 消息正文

```
Hi Dishank — a quick sync on SCRUM-43, since other tickets now depend on it.

**1. Kanishka needs `is_item_finished()` now.** Her SCRUM-48 queues must never offer a finished
item, and she will call your function rather than write the rule again. It isn't on any remote
branch yet, so please agree the signature with her today, e.g. `is_item_finished(task_item) ->
bool` in `task_service.py`. Whoever merges first adds it. If your PR is still a few days away,
pushing just the function would unblock her.

**2. What it settles:** issue 19 (completion and export disagree on "done") and issue 27 (the
impossible `"approved"` status). One rule for task completion, export readiness and the queues.

**3. Next to my SCRUM-28 guard (PR #19):** my guard refuses new work only on `canonicalized` items.
"Finished for export" and "locked against new work" may rightly differ, so tell me if you think
they should be the same set. One of my tests asserts that a `reviewed` item still accepts work; if
your rule turns it red, let's talk rather than patch the test. We both touch `task_service.py`
(lines ~96–150), so whoever merges second merges `main` first.

**4. Status:** sprints now end on Wednesday after the client meeting, so W7 runs to Wed 23 Sep.
Where is SCRUM-43, and when do you expect a PR? If it carries into W8, just say so, since B4
(SCRUM-24) builds on your rule in W8.
```

---

## 发出后

**2026-09-19 已发送。**

1. 确认他和 Kanishka 当天定下了签名。
2. 如果 SCRUM-43 要延到 W8：在 W7 周会上按重排规则 2 处理，并提醒 B4（SCRUM-24）的承接人它依赖 B6。
