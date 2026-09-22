# Story 改写稿 —— 客户第一轮书面答复（2026-09-21）

2026-09-22。依据 `../../shared/client-qa.md` 和 `../../info/client-question.md` → Round 1（R1-2、R1-4、R1-7）。
**已于 2026-09-22 由 Claude 直接写入 `story_src.csv`**（20 个单元格，其余不变）；本文件保留作改动记录。
只列出改动的字段；没列出的字段没动。`status`、`allocated_to`、
`scrum` 三列由 `tracking-sync` 管，这里不涉及。

| Story | 原因 | 改哪些字段 |
| --- | --- | --- |
| D8 | R1-4：AI 首轮不计入人工人数；标注人提交前不能看别人的判断 | AC2、新增 AC6、related_issues 里 9/18 那段、subtask 3 |
| C4 | R1-2：只有两种生产模式；blind-then-reveal 移到 I4。R1-4：AI 不占名额 | name、story、AC、related_issues（追加）、subtasks |
| I4 | R1-2：blind-then-reveal 是评估协议，放在这里 | story、AC、related_issues、subtasks |
| B2 | R1-7：policy 可以改，但以新版本形式；不再"冻结" | AC2、related_issues（追加）、subtasks 3–4 |
| F2 | R1-7：版本化扩展到 policy；每个 item 记录适用的 policy 版本 | name、story、AC、related_issues（追加）、subtasks |

Jira 上对应的票标题也建议同步：SCRUM-87（C4）和 SCRUM-73（I4）、SCRUM-53（F2），见文末。

---

## D8

**acceptance_criteria — 第 2 条替换为：**
```
2. An item leaves the annotate queue once it has as many human submissions as its task requires, so I never start work that can no longer be submitted. The AI's first pass is not one of them.
```

**acceptance_criteria — 末尾新增第 6 条：**
```
6. Before I submit, I cannot see what other annotators submitted on the item — only how many have. This holds in the API, not only on the screen.
```

**related_issues — 把以 `**Decision, 2026-09-18**` 开头的整段替换为：**
```
**Client answer, 2026-09-21** — the required number is of independent human judgements, and an AI first pass is separate from it: one successful AI annotation is enough unless a task explicitly defines a multi-model experiment. Annotators must not see earlier judgements before submitting their own; showing progress such as 2/3 is fine. This withdraws our decision of 2026-09-18 that an AI submission counts as one of the required annotators.
```

**subtasks — 第 3 条替换为：**
```
3. Refuse a human submission once the item already has as many as its task requires — in the API, not only in the web app. The AI's annotation is neither counted nor refused.
```

---

## C4

**name：**
```
I can choose whether the AI annotates first
```

**story：**
```
As a project manager, I want to choose whether a task is annotated by people only or by the AI first with people reviewing, because the two produce different evidence at a different cost, and results from each must be told apart later.
```

**acceptance_criteria（整段）：**
```
1. I can select human-only or AI-first when setting up a task.
2. In human-only, no AI suggestion is generated or shown, and the item needs the task's required number of independent human submissions.
3. In AI-first, one successful AI annotation is recorded as the AI model's own version and goes straight to review with no human first pass. It does not count toward the task's human annotator number.
4. Which mode was in force is recorded against the item, so results from different modes can be compared later (see I4).
```

**related_issues — 第一句（"No open defects — net-new, and worth flagging…"）替换为：**
```
No open defects — net-new. Neither mode is selectable per task today.
```

**related_issues — 末尾追加：**
```
**Client answer, 2026-09-21** — human-only and AI-first are the annotation production modes. Blind-then-reveal is an evaluation protocol for human judgement, not a third mode, so it moves to **I4**. The AI's first pass is separate from the human annotator count (see **D8**).
```

**subtasks（整段）：**
```
1. Add human-only and AI-first to task setup.
2. Route AI-first items straight to review, recording the AI model as the version's author, requiring no human first pass, and outside the human annotator count — SCRUM-46 builds this path.
3. Record the mode in force against each item so results from different modes can be compared later (see I4).
4. Test that a human-only item never receives an AI suggestion, and that none appears in its API responses.
```

---

## I4

**story：**
```
As a quality lead, I want to measure what AI assistance does to human judgement — how often people accept, modify or override AI suggestions, how long they take, and whether a wrong suggestion pulls them away from what they would have decided alone — because the client's question is what AI assistance actually does to human judgement, not whether it feels faster.
```

**acceptance_criteria（整段）：**
```
1. Acceptance, modification and override rates are reported per task.
2. Time per item is reported alongside them.
3. A task can run the blind-then-reveal protocol: the annotator records an independent judgement without seeing the AI suggestion; that judgement is kept; then the suggestion is revealed and they may keep or revise their answer. Both judgements survive.
4. The suggestion is absent from the API response until the independent judgement is recorded — not merely hidden on the screen.
5. From the protocol I can see how often a correct suggestion improved an answer and how often an incorrect one changed a correct answer (anchoring and automation bias), and compare the results with C4's human-only and AI-first modes.
```

**related_issues（整段）：**
```
No open defects — net-new; depends on **C4** and **F3**, since the measurement is impossible if suggestion and decision are collapsed into one value.
**Client answer, 2026-09-21** — blind-then-reveal is an evaluation protocol for human judgement, not a production mode: the independent judgement is recorded first, then the AI suggestion is revealed and the annotator may keep or revise. It lets the platform measure whether correct suggestions help and whether incorrect ones introduce anchoring or automation bias. Judging a suggestion correct needs a reference — the dataset's evaluation-only gold labels (client answer R1-1) or the adjudicated answer.
```

**subtasks（整段）：**
```
1. Report accept, modify and override rates per task.
2. Report time per item alongside them.
3. Add blind-then-reveal as a protocol a task can run on human annotation: store the pre-reveal judgement as its own record, then reveal the suggestion and store the final one.
4. Withhold the suggestion from the API until the pre-reveal judgement is recorded, and test it.
5. Report how often answers moved toward the suggestion, split by whether the suggestion was right against the reference — anchoring and automation bias.
6. Compare results across C4's modes and the protocol.
7. Impossible unless suggestion and decision stay separate — depends on F3.
```

---

## B2

**acceptance_criteria — 第 2 条替换为：**
```
2. The settings I choose are visible on the project afterwards. Before work starts I can correct them in place; after that, a change creates a new policy version — new work follows it, and items already governed by an earlier version keep theirs.
```

**related_issues — 末尾追加：**
```
**Client answer, 2026-09-21** — a policy may change after a project starts, but history must not be rewritten: raising 2 reviewers to 3 creates a new policy version, rather than making earlier items appear to have been governed by the new rule. New work follows the new version, and each item keeps the version that applied to it. This replaces freezing the policy per task.
```

**subtasks — 第 3、4 条替换为：**
```
3. Show the policy in force on the project afterwards, with its version; correctable in place until the first task goes active.
4. After that, a change creates a new policy version instead of editing the current one; each item keeps the version that governed it (F2 records it on the item).
```

---

## F2

**name：**
```
Annotations remember which guideline and policy they followed
```

**story：**
```
As a project manager, I want to update annotation guidelines and review policies without rewriting history, because when I revise either mid-project I need to know which items were labelled or reviewed under the old one.
```

**acceptance_criteria（整段）：**
```
1. Updating a guideline, a source or a review policy creates a new version rather than replacing the current one.
2. Every annotation records the guideline and source version in force when it was made, and every item records the policy version that governed it.
3. I can see which items were annotated or reviewed under a superseded version.
```

**related_issues — 末尾追加：**
```
**Client answer, 2026-09-21** — policies may evolve after a project starts as new versions; the system must preserve which policy version applied to each item so its annotation, review and release history stays traceable. Guideline versions change instructions, not the output structure — a new structure is deliberate engineering (client answer R1-5).
```

**subtasks（整段）：**
```
1. Version guidelines, sources and review policies instead of replacing them in place — there is no versioning of any kind today.
2. Record the guideline and source version in force on every annotation, and the policy version on every item.
3. Let a manager see which items were annotated or reviewed under a superseded version.
4. Sequence before H3 — its superseded-version check cannot be built until this exists. H2's manifest cites the policy version.
```

---

## Jira 票标题（可选，同步 story 名）

| 票 | 新标题 |
| --- | --- |
| SCRUM-87 | `AI assist: Human-only and AI-first task modes` |
| SCRUM-73 | `Evaluation: Measure AI influence on human judgement, with blind-then-reveal` |
| SCRUM-53 | `Provenance: Version guidelines, sources and review policies` |
