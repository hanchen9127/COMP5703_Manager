# #30 评审 —— 贴到 GitHub（Approve）

2026-09-23。PR #30（SCRUM-3 retry + #22 的五个后续项），以 **Approve** 提交。依据是完整评审
`../../../reviews/W8/review-cs57-michael-scrum-3-retry.md`。英文写。

**发出前确认：** 用 `gh pr view 30` 确认它仍是 OPEN、head 仍是 `a3d39d2`，而且还没有 review。
如果 head 变了，先重新评审。

---

## Review 正文

```
Approving. I re-ran it: 437 + 147 locally on SQLite, and CI's PostgreSQL job runs 441 with none skipped, so the worker tests really run on Postgres now. All five #22 follow-ups are in. I repeated the two mutation checks: removing only `lease_owner == worker_id` fails your two new tests, and removing the expiry re-check from the sweep fails the interleaving test. Once this merges, the #22 condition (no worker mode on Postgres, no second worker) is lifted.

Four non-blocking points. Fix them here or in a follow-up, whichever you prefer:

1. **Unparseable or schema-invalid output is classified `permanent`.** LLM sampling isn't deterministic, so the same prompt can succeed on a second try. Either class it as `unknown`, which `max_attempts` still bounds, or keep it and list it as a placeholder beside 3 / 30 s / 600 s. Your call; I just want it written down as a decision.

2. **`try_claim_candidate` doesn't re-check `next_attempt_at`.** With two workers, a row can go claimed → failed fast → `retry_wait` (future time) between this worker's SELECT and its UPDATE. The UPDATE then takes it early and skips the backoff. It's unlikely, but it's one condition to add to the UPDATE, and the comment saying it can't happen should change with it.

3. **An analyzer-build failure writes no draft.** The error is on the job row but not on the item, so SCRUM-30, which renders from `metadata.ai`, won't show it. Either write the failed draft as the exhausted path does, or say in the PR that it's visible only through the job status (SCRUM-5).

4. **#31's classifier.** If #31 is about to merge, it's cleaner to rebase onto it and drop `classify_provider_error` before this lands, instead of merging code that is due to be deleted. If it isn't close, your plan is fine.

**Merge order:** this one first, then #29 rebased on top. There's one cross-PR point there (a dead-lettered item can never be re-run); I'll put it on #29.
```

---

## 发出后

1. tracker 上 #30 这一行的 `Review OK?` 改成 `OK`。
2. #30 合并之后，提醒 Michael 按新顺序 rebase #29。
