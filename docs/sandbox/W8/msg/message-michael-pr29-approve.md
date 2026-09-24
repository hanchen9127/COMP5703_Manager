# #29 第二轮 —— Approve（给 Michael）

2026-09-23。回复他 `2c2bd51`（merge main）和那条 4658 字符的评论。四项全部复现验证过，依据是
`../../../reviews/W8/review-cs57-michael-scrum-46-ai-trigger.md` 的 *Re-review — `2c2bd51`* 一节。

**决定（Hanchen，2026-09-23）：approve。** 以 **Approve review** 发
（`gh pr review 29 --approve --body-file …`），这样之前那条 CHANGES_REQUESTED 会被取代。

**发出前确认：** `gh pr view 29` 确认仍是 OPEN、head 仍是 `2c2bd51`、没有新 commit。head 变了先重看。

**2026-09-23 补充：#31 已经合进 main（`dd88c68`）。** #29 的 CI 是在 `2c2bd51` 上跑的，早于 #31，所以
"#29 + #31"这个组合只有本地验证过：把最新 main 合进 #29 后 **452 passed + 147 subtests, 4 skipped**，
并用 #31 的新失败 metadata 形状（没有 `error` 键）单独探过重跑路径仍然成立。正文里因此请他再合一次 main，
让 CI 覆盖这个组合。

**结尾那节不再是问题，是提案**（Hanchen 2026-09-23 决定）：#30 留下的四条里，第 4 条（重复分类器）已由
#31 解决，剩下三条按下面的分法归位，他不反对就照办。

---

## Review 正文

```
Approving. I re-ran everything rather than reading it: 454 + 147 at `2c2bd51`, CI green on SQLite and PostgreSQL on this head, and both of your mutation claims reproduce — making `_is_unclaimed_ai_failure` return False fails the retry test, removing the `_record_ai_submission` call fails the history test, and nothing else fails either way.

**Finding 1.** I ran my original probe again on your branch: `items_needing_ai` now returns the item, the second run ends `succeeded`, there is **one** draft rather than two, the first job keeps `dead_letter` / `permanent` with its error, and its `result_draft_id` goes NULL through the FK. Replacing the stale draft was the right call — and the reason you gave is the better one: whoever opens that item next should not have to guess which of two unclaimed drafts is real.

The comment rewrite in `record_result` is the part I'd have missed. The old justification was load-bearing and became false with your fix; leaving it would have been a trap for the next person changing the retry path. `test_a_human_draft_still_stops_a_later_run` is the right guard to put beside it — the exemption is narrow and now stays narrow.

**Finding 2.** Both judgements are right, and I checked the third case you didn't mention: a worker whose lease lapsed leaves **0 history rows, 0 drafts, 0 annotations**. The history row is inside the fence with everything else, which is what makes it safe to attribute it to a person. Attributing to `requested_by` and writing nothing when there is no operator is the same principle as `created_by` staying NULL — a row SCRUM-40 can reclassify beats an actor we invented.

**Findings 3 and 4** — both in. Yes please, put the re-seed line in the team message on merge day as well; the description is where people look after the problem, not before it.

**Board, for the record:** SCRUM-46's criterion 2 now reads "an annotation submitted by the AI", with `created_by` NULL and the model in `metadata.ai` spelled out, and a sixth criterion for the dead-letter re-run. SCRUM-38 has picked up "AI as a first-class author", including the multi-model case. So neither gap lives only in a PR description now.

**Kanishka** — thanks for the precision, and you're right: the filter is `created_by IS NOT NULL` on the annotation, not on the draft's status. I've passed that on; she'd already built the count that way and is re-checking the refusal path once this merges.

## Please merge `main` once more before you land it

#31 merged after your CI ran, so `2c2bd51` was tested against a `main` that did not have it. I checked the combination locally — 452 + 147 with the latest `main` merged in, and the retry path probed against #31's new failure metadata shape, where there is no `error` key at all: `metadata.ai.status` is still `"failed"`, so `_is_unclaimed_ai_failure` holds and a dead-lettered item is still picked up by a later run. Nothing to change. I'd just rather CI said so too, so merge `main` in and land it once it's green.

## Where #30's leftovers go — a proposal, not a question

#30 merged with four non-blocking points open. #31 settled one of them by replacing `classify_provider_error` with Yi's version, so three are left, and rather than open a ticket for them I'd put each where it can actually be decided:

- **Parse and schema failures classified `permanent`**, and **`try_claim_candidate` not re-checking `next_attempt_at`** → the bounded parallel-calls ticket you offered to draft. The claim race needs two workers to exist before it can be reproduced or verified, and the classification is the same kind of question as the 3 / 30 s / 600 s placeholders: it wants real provider data, which that ticket is the first occasion to gather.
- **An analyzer failure writing no draft** → SCRUM-30 (W9). C3's close-out there already owns "a failed assist leaves no draft" and "no AI suggestion is visible" on the same screen, so the rendering decision belongs with the screen that renders it. Your #32 gives the job-status route in the meantime.

Say so if you'd rather have them as a ticket of their own — I mainly want them on the board rather than in a merged PR's comments.

Re-seed your Postgres database after pulling.
```

---

## 发出后

1. tracker 上 #29 这一行的 `Review OK?` 改成 `OK`。
2. #29 合并当天：团队消息里带上"用 PostgreSQL 的人要重建开发库"。
3. 他不反对那个分法，就把两条写进 bounded parallel-calls 票的描述（起草时），把 analyzer 那条加到
   SCRUM-30，并在 `roadmap.md` 的 C2 行记一笔。
4. 接着排 #32（SCRUM-5）的评审，C2 三个 PR 就齐了。
