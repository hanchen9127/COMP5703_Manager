# Code review — PR #22 `feat(SCRUM-2): run AI annotation in a worker instead of the request`

**PR:** #22 · **Head:** `37a7fc2` (was `21fe863`, before that `53e612b`) · **Branch:** `CS57-Michael-scrum-2-ai-worker` · **Base:** `main`
(was the merged #21 branch; retargeted 2026-09-21) ·
**Author:** Michael Max (`mike-ad`) · **Reviewed:** 2026-09-18 · **Re-reviewed:** 2026-09-21
**Scope:** 10 files, +1292 / −9 against `main` · **Story:** C2 / SCRUM-2 (subtask 3)

The **update for `37a7fc2`** comes first, then the **re-review of 2026-09-21** at `21fe863`. The original review of 2026-09-18, at `53e612b`, follows it
unchanged except where a line is marked *Superseded*.

---

## Update — 2026-09-21, head `37a7fc2`

One commit on top of `21fe863`: `37a7fc2 fix(SCRUM-2): run from the snapshotted schema, not just record it`
(3 files, +44 / −9), with a PR comment at 17:51 AEST. Nothing of R1–R7 below had been posted, so this
commit answers his own two open questions, not those items.

**What it does.** `load_execution_context` also overrides `label_schema_ref` and `label_schema` from the
batch, so the analyzer is built from the snapshot. `release_lease` stays, with its docstring pointing at
cancellation. `ai_batch_job_schema.md` §2.1 records that `task_subtype` is not snapshotted and what follows.

| Check | Result |
| --- | --- |
| Suite at `37a7fc2`, fresh `uv` env | **408 passed**, 4 skipped, 147 subtests — as he says; the test was widened, not added |
| Revert the two new overrides | `test_the_run_uses_what_the_batch_recorded` **fails** ✅ as he says |
| Re-validating a resolved schema is a no-op | ✅ Checked for all 11 subtypes' defaults and all 11 presets: `resolve(resolve(x)) == resolve(x)`. So the snapshot really drives the run |
| "The live task isn't consulted at all" (code comment) | ⚠️ Not quite: `resolve_annotation_schema` still validates the snapshot against the **live** `task_subtype`. His PR comment says exactly this in its next paragraph; only the code comment over-states it. Nit |
| Subtype changed after enqueue (his stated consequence) | ✅ Probe: `ValueError` on each attempt, `dead_letter` at attempt 3, batch `completed_with_failures` — but see R8 |

**Effect on the open items:**
- **R4 — done.** The run now uses the snapshotted schema.
- **R6 — resolved.** The description's "provider, model and output schema" is now true.
- **R5 — settled.** `release_lease` stays. Fine.
- **R1, R2, R3, R7 — unchanged.** Not posted, so not seen. Re-checked at `37a7fc2`: removing only
  `lease_owner == worker_id` still leaves all 16 tests green (R1); `worker_id=item_job.lease_owner` is
  still read at load time (R2); the worker tests still build their own SQLite engine (R3); the sweep's
  UPDATEs still don't re-check expiry (R7).

**R8 — a subtype change fails slowly and silently (new; follow-up, fits SCRUM-3).** His comment calls this
"failing loudly", but it isn't:
- **The real cause is lost.** The `ValueError` from `AIPreannotator.__init__` escapes `run_once` and is
  only logged. The job ends with the generic `last_error` "Abandoned after 3 attempt(s): the lease expired
  without a result", so an operator reading `ai_item_jobs` cannot tell a schema mismatch from a crashed
  worker.
- **It takes three lease periods,** about 15 minutes at 300 s, although the error is permanent and is
  raised before any model call.

**Fix:** build the analyzer inside the recorded path, and dead-letter immediately with
`last_error_kind = 'permanent'` and the exception's message when construction fails. That is SCRUM-3's
error classification, so it can go there. Not blocking.

**Decision (Hanchen, 2026-09-21): approve now, with follow-ups.** Worker mode is off by default (`HEJ_AI_EXECUTION_MODE=inline`), so merging changes nothing that runs today, and SCRUM-3, 5 and 46 build on this PR. R1, R2, R3, R7 and R8 move into **SCRUM-3**. **Condition:** until R3 and R7 are done, worker mode is not switched on for PostgreSQL and no more than one worker runs. The approve text is `sandbox/W7/msg/message-michael-pr22-round2.md`.

**Provenance of the decision — to check with Hanchen.** The comment opens *"the client resolved both"*, and
the schema point *"went the other way"* from how Hanchen scoped it. Nothing in `info/client-question.md`
records a client answer on the schema snapshot or on `release_lease`, and client decisions go through
Hanchen. The change itself is good, and matches R4 and R6 as written here. **But the record should say
who decided it, so that "the client decided" is not left on the PR without a source.**

---

## Re-review — 2026-09-21, head `21fe863`

**Recommendation (mine; Hanchen has not decided): one more short round on three small items, then
approve.** The four blocking points of the original review are fixed and I reproduced each fix. Nothing
below is a regression. But the central fix, the lease as a write permit, has a test gap and a narrow
hole, and the tests still never reach PostgreSQL.

### What is on GitHub (gh, 2026-09-21)

- **OPEN**, base **`main`**, head `21fe863`, decision still `CHANGES_REQUESTED` from 2026-09-18. Commits since
  the reviewed head: a merge of `main` at `1f0d562` (`59c4bc4`) and `21fe863 fix(SCRUM-2): only the lease
  holder may close an item out`. `origin/main` is still `1f0d562`, so the head is up to date with it.
- Posted by Hanchen: the review of 2026-09-18 and the domain-error comment of 2026-09-19. Nothing else.
- Michael replied on 2026-09-21 (17:18 AEST): all six findings addressed in `21fe863`, PR retargeted, the
  three description items added, and the `ai-worker` compose service fixed for PostgreSQL (his own find;
  he tagged Parth). **The reply has no answer yet.**
- The description now contains all three items: the SCRUM-46 sentence, the one-item-at-a-time note with
  where parallel calls go (its own ticket, which he offers to draft), and the domain-error line. Checked.
  **But it also over-claims on the schema — see R6.**

### Evidence

| Check | Result |
| --- | --- |
| Head `21fe863` contains `origin/main` (`1f0d562`) | Yes |
| Worker tests at head | **16 passed** (12 + the 4 he added) |
| Full backend suite at head, SQLite | **408 passed**, 4 skipped, 147 subtests — matches his 408 + 147 |
| Original probes 1–4 re-run against the new code | Every one now ends as it should; see the table below |
| Revert-each-fix check: max_attempts, reclaim in `try`, batch model | Each test **fails** without its fix ✅ |
| Revert-each-fix check: the lease fence | ⚠️ Removing only `lease_owner == worker_id` leaves **all 16 tests green** — see R1 |
| Not run | PostgreSQL (no Docker daemon in my environment; Michael has none either), the compose service, real model calls |
| **Second, independent pass (2026-09-21, later the same day)** | Everything above re-verified from scratch in fresh `uv` worktrees: 408 / 392 + 147; probes 1–4 fixed; `lease_owner`-only removal green (and the case it guards reproduced — R1); R2 and R3 confirmed in the code. Two items the first pass missed: **R6** and **R7** |

### The original points

| Original | At `21fe863` |
| --- | --- |
| Retarget to `main` | ✅ Base is `main` |
| 1. Stale lease overwrites a finished job | ✅ `_finish` closes an item with `UPDATE … WHERE id AND status='running' AND lease_owner=:worker_id`, and rolls the draft back when no row matches. My sequence now returns `lease_lost`; the job stays `succeeded` with the winner's draft (one draft), and for the `dead_letter` case the batch stays `completed_with_failures`. **But see R1 and R2** |
| 2. `max_attempts` never enforced | ✅ `reclaim_expired_leases` requeues under the bound and dead-letters at it. Six claim-and-reclaim cycles: sweeps `(1,0) (1,0) (0,1) (0,0)…`, `dead_letter` at attempt 3 with "Abandoned after 3 attempt(s)…", batch `completed_with_failures`. He rolls the batch up in the same transaction |
| 3. Reclaim error ends the worker | ✅ Reclaim is inside the `try`, with `db.rollback()`; my injected `OperationalError("database is locked")` on the first pass is survived and the loop comes back. `restart: unless-stopped` added |
| 4. Batch model vs worker model | ✅ `model_copy(update={ai_provider, ai_model})` from the batch: the run now uses `configured-model` after the task is edited to `changed-model`. ✅ `schema_snapshot` stores the resolved schema. ⚠️ The run still resolves the schema live — see R4 |
| 5. `release_lease` on shutdown | ✅ Branch removed; `request_stop`'s docstring says why. `release_lease` itself is now uncalled; he kept it, documented as cancellation's (SCRUM-5), and offers to delete it — see R5 |
| 6. Double sleep | ✅ One sleep left |
| The three description items | ✅ All present |
| Domain-error comment of 2026-09-19 | ✅ Done in the **final** form: `except TaskItemFinalisedError` only, the `HTTPException` import is gone, and the "#19 not merged yet" fallback wrapper is deleted. His worker test passes on `main` unchanged |
| `ai-worker` compose service pinned to a SQLite path (found 2026-09-21, after #24; **not posted**) | ✅ He found it himself. The service now mirrors `backend`: `env_file`, `depends_on: postgres` (healthy), `POSTGRES_*` and `DATABASE_URL` passthrough, and the runbook says both processes must resolve the same database. Read, not run |

### Remaining items

**R1 — the ownership half of the fence is not tested (fix before merge; one test).** The fence has two
conditions, `status == 'running'` and `lease_owner == worker_id`. His test lets B **finish** first, and
after that `status` alone stops A. Nothing pins `lease_owner`. With only that line removed, all 16 tests
still pass, and the case it protects goes wrong: A returns from its model call while **B is still
running** and A's stale result is accepted (`succeeded`, owner cleared) while B held the lease. With the
line in place the same case returns `lease_lost` and the job stays `running` under B. So the claim in his
reply that each fix was reverted to confirm its test fails holds for fixes 2–4, but for fix 1 only when
the whole conditional `UPDATE` is reverted. **Add one test:** A records while B is running → `lease_lost`,
job still `running`, owner B.

**R2 — the worker identity is read too late (fix before merge; one line).** `load_execution_context` sets
`worker_id=item_job.lease_owner`, that is, whoever owns the lease **when the context is loaded**, not
the worker that claimed. If the lease moves between the claim and the load, A's context carries B's
id and passes the fence. Followed through: A claims, its lease lapses, B claims, A loads (its context says
`worker_id='B'`). A's model call fails and is recorded as `dead_letter`; B's call succeeds and is refused
with `lease_lost`. Final state: `dead_letter`, batch `completed_with_failures`, and a good result was
discarded. The window is small (between the claim's commit and the load, against a 300 s lease), so it is
unlikely, but it is exactly what the fence exists for. **Fix:** pass the claiming worker's id in —
`Worker.run_once` has `self.worker_id` and `run_next_item` has `worker_id` — instead of re-reading it.

**R3 — the tests still build their own SQLite engine (fix before merge; mechanical).** This is the point
left over from the compose comment: `test_ai_batch_worker.py`'s `_engine()` calls
`create_engine("sqlite://")` with `StaticPool`, not SCRUM-94's shared `empty_engine` fixture in
`tests/conftest.py`. That fixture is what makes CI's PostgreSQL job run a test. So the claim `UPDATE`, the
fenced `UPDATE` above and the lease comparisons on `UtcDateTime` columns are only ever exercised on SQLite.
The fenced `UPDATE` is the mechanism the whole worker rests on. Move the `db` fixture onto `empty_engine`.
I have not tried it: some of the 16 tests may lean on SQLite behaviour, and nobody has run these on
PostgreSQL yet.

**R4 — the run still resolves the label schema live (follow-up, not blocking).** He left it open on
purpose and says he will add it if asked. I could not show the drift through a valid edit: `main` now refuses
extra fields on a fixed schema ("Fixed task schemas cannot add fields unsupported by the result editor. Select
`custom_task` for an arbitrary output schema"), so the reachable case is `custom_task`, which I did not
test. If it is added, `label_schema=batch.schema_snapshot` in the same `model_copy` is enough. The draft's
recorded `schema_ref` also comes from the live task, so both need it.

**R5 — `release_lease` is unused (nit).** Either is fine. I lean towards keeping it, since SCRUM-5 is the
next ticket and it is documented; delete it and its test if he would rather not carry it.

**R6 — the description claims more than the code does (fix before merge; one sentence or one line).**
The description says a run *"uses the provider, model **and output schema** the batch snapshotted … the
snapshot drives the run rather than merely describing it"*. The code overrides only `ai_provider` and
`ai_model` in `load_execution_context`; the schema is still resolved from the live task, as R4 says and
as his own reply admits ("the run still resolves the schema live … I've left it open deliberately"). So
either do R4 now (`label_schema=batch.schema_snapshot` in the same `model_copy`, plus the draft's
`schema_ref`), or cut "and output schema" from the description. This turns R4 from a follow-up into a
choice that has to be made before merge.

**R7 — the requeue in `reclaim_expired_leases` can erase a fresh lease on PostgreSQL (should fix; two
conditions).** The sweep reads the expired rows, then requeues them with `UPDATE … WHERE id IN (…) AND
status = 'running'`. Nothing re-checks that the lease is **still** expired. If, between that read and that
write, another sweep requeues the item and worker B claims it with a new lease, this UPDATE puts it back
to `queued` and clears B's lease. Probe (simulated in one session, head `21fe863`):
`after S1: status=queued lease_owner=None attempts=2 (B held a fresh lease)`.
- **On PostgreSQL (READ COMMITTED), now the default after #24**, the UPDATE re-evaluates its `WHERE` against
  the latest row version, so this can happen with two workers. On SQLite with WAL, the stale sweep cannot
  upgrade its read snapshot and gets `SQLITE_BUSY_SNAPSHOT`, which the loop now catches.
- **Harm, bounded by R1's fence:** B's result is later refused as `lease_lost`; the model call is wasted, an
  attempt is burned, and with `max_attempts = 3` a healthy item can be dead-lettered early. No wrong data
  is written.
- **Fix:** add `AiItemJobDB.lease_expires_at < moment` to both UPDATEs in the sweep (requeue and
  dead-letter), so each re-checks expiry at write time. One test with the interleaving above.
- The supported configuration is still one worker, where this cannot happen; it matters from the second
  worker on, which is what PostgreSQL was brought in for.

### What to do

1. Hanchen decides: another round on R1–R3, R6 and R7, or approve now with them as follow-ups. **My view:**
   R1 and R2 are a test and a line; R3 is why SCRUM-94 exists; R6 is one sentence, and a PR must not claim
   what its code does not do; R7 is two conditions and a test. All five belong before merge. R4 (unless it
   is how R6 is answered) and R5 do not.
2. Nothing here has been posted. A comment on the PR would need Hanchen's go-ahead (see *Not raised on the
   PR* at the end).
3. After the next push: rerun the four probes and the suite, and rerun the mutation with `lease_owner`
   removed, which must now fail.

---

## Original review — 2026-09-18, head `53e612b`

### Summary

**Request changes — three small fixes, each a few lines.**

> **Posted on the PR 2026-09-19 (01:02 AEST) as Request changes**, in the condensed form kept in
> `sandbox/W7/message-michael-pr22-review.md`.

> **Before merge, retarget the PR to `main`.** Its base is still `CS57-Michael-scrum-1-job-schema`,
> which #21 has already merged. Merging as it stands lands the worker on that branch, not on `main`.

The structure is right. The model call runs outside any transaction, and a test proves it. Claiming
an item is a conditional `UPDATE` settled by row count. The finalised-item guard from #19 is applied to
AI writes. The `inline` default makes the PR inert until someone switches it on. Everything the
description claims holds up: the suite count, clean merges with `main` and #19, and all three mutation
checks.

The weak point is the lease, the mechanism that makes Option B worth choosing over A:

1. **A worker whose lease has expired can still write its result**, and when it does it overwrites the
   outcome another worker already recorded. It can relabel a `dead_letter` as `skipped` and report the
   batch as `completed`, which hides the failure.
2. **`max_attempts` is never enforced.** An item that raises every time is reclaimed forever, and its
   batch never closes.
3. **A database error in lease reclaim ends the worker process.** On SQLite, `database is locked` is
   exactly the error #20 §4 predicts, and nothing restarts the worker.

Issue 1 needs two workers, and the supported configuration on SQLite is one. But SCRUM-94 exists so that
running more than one becomes possible, so these three fixes belong with the lease code now. Findings
4–6 are smaller.

One scope gap is bigger than any of these but does not block this PR. AI output still lands as an
unclaimed pending draft, while the client's answer of 2026-09-17 makes it a submitted annotation
authored by the AI. The recommendation is to give it to SCRUM-46; see *Against the client's AI
answer*.

### Evidence

| Check | Result |
| --- | --- |
| Backend suite at `53e612b` | **267 passed**, 138 subtests — matches the description |
| Merged with `origin/main` (`17673c8`) and then #19 (`origin/CS57-Hanchen`) | **No conflicts; 276 passed**, 147 subtests. With #19 merged, the `getattr` lookup finds #19's `assert_task_item_accepts_draft_writes` |
| Mutation: remove `db.flush()` in `_finish` | 4 tests fail ✅ as claimed |
| Mutation: remove the guard call in `record_result` | 1 test fails ✅ as claimed |
| Mutation: remove `status == ITEM_QUEUED` from the claim `UPDATE` | 1 test fails ✅ as claimed |
| Review probes (appendix) | All 5 reproduce findings 1–4 (probes 2 and 3: finding 1; 1: finding 2; 5: finding 3; 4: finding 4) |
| End-to-end run described in the PR | Not re-run; the probes use the PR's own test fixture |

---

## Checking the PR description

| Claim | Verdict |
| --- | --- |
| `worker` mode: registration writes one batch row and one row per item in the intake transaction, then returns | ✅ Correct: `enqueue_batch(commit=False)` sits before the single commit |
| The model call happens outside any transaction | ✅ Correct, and tested by `test_no_transaction_is_open_while_the_model_runs` |
| "The flag is the rollback"; `inline` is exactly today's behaviour | ✅ Correct: with `inline`, `enqueue_ai_batch` is `False` and the old branch runs unchanged |
| Worker applies #19's guard; falls back to the same rule on the same constant | ✅ Correct; `TERMINAL_TASK_ITEM_STATUSES` is on `main` already |
| "Leases recover a crashed worker's items" | ⚠️ Recovery works, but a stale worker is not fenced out afterwards — finding 1 |
| Delivers AC1's second half only; AC2 is SCRUM-3, AC3 is SCRUM-5 | ✅ An accurate scope statement. Finding 2 is not retry *policy*: it is an unbounded loop that this PR's reclaim path creates |
| 12 new tests; 267 + 138 | ✅ Reproduced |

---

## Findings

> **Status at `21fe863` (2026-09-21): all six are addressed** — see *The original points* in the re-review
> above. Findings 1–3 remain fixed for the reasons given there, with R1 and R2 as the loose ends of 1.

### 1. A stale worker overwrites a finished job's outcome — **fix before merge**

`record_result` and `_finish` never check that this worker still holds the lease. They load the job row
by id and write whatever this worker concluded.

Sequence: worker A claims an item, its lease lapses while the model call is still running (the lease is
300 s, and one call can take up to 60 s × 3 with the SDK's retries, longer on audio or video), the item
is reclaimed, and worker B claims it and records its result. Then A's call returns.

| B recorded | A then records | Final job row | Batch |
| --- | --- | --- | --- |
| `succeeded`, draft d1 | `skipped` — B's draft is "meaningful" | **`skipped`, `result_draft_id = NULL`** — d1 unlinked | `completed` |
| `dead_letter`, failed draft | `skipped` | **`skipped`** | **`completed`** — the failure has gone |

The second row is the case the schema doc §3 forbids: *"`dead_letter` is terminal and visible … never
collapses into 'completed'"*. Reproduced with the PR's own fixture (appendix, probes 2 and 3).

**Fix:** make closing a job conditional on still holding its lease — for example an `UPDATE … WHERE
id = :id AND status = 'running' AND lease_owner = :worker_id`, with the draft insert in the same
transaction and rolled back when no row matches. Pass `worker_id` through `ItemExecutionContext`. One
test: A's stale `record_result` changes nothing after B has finished.

### 2. `max_attempts` is never enforced, so a poison item loops forever — **fix before merge**

Every claim increments `attempt_count`, and `reclaim_expired_leases` returns an expired item to
`queued` whatever its count. Nothing reads `max_attempts`. An item whose processing raises every time is
retried every lease period for as long as the worker runs, and the batch stays `running`.

Probe 1: after six claim-raise-reclaim cycles, `attempt_count = 6`, `max_attempts = 3`, and the item is
`queued` again in a `running` batch.

One real path that raises before the model's own `try`: `AIPreannotator.__init__` calls
`resolve_annotation_schema(...)` outside the `try` that guards analyzer selection, and the task's schema
can change after enqueue (finding 4).

This is not SCRUM-3's retry policy. Backoff and telling transient errors from permanent ones stay in
SCRUM-3. This is a bound, and the column for it already exists.

**Fix:** in `reclaim_expired_leases`, move rows with `attempt_count >= max_attempts` to `dead_letter`
(`last_error_kind = 'unknown'`, a short `last_error`), and roll up their batches. One test.

### 3. A database error during reclaim ends the worker — **fix before merge**

In `Worker.run_forever`, `reclaim_expired_leases(db)` sits outside the `try` that protects `run_once`.
An `OperationalError` there leaves the loop and ends the process (probe 5). On SQLite with no WAL and a
5 s busy timeout, `database is locked` is the expected transient error (#20 §4). `compose.yaml`'s
`ai-worker` service has no `restart:` policy, so the queue would stop without anyone noticing.

**Fix:** move the reclaim inside the `try`, with `db.rollback()` in the `except`. Also consider
`restart: unless-stopped` on the compose service.

### 4. The batch records one model and the worker runs another (should fix)

`enqueue_batch` snapshots `provider` and `model`. That is the point of the snapshot, according to the
schema doc §2.1: *"Without a snapshot, a completed batch's provenance silently re-points at whatever the
task says later."* But `load_execution_context` rebuilds the task from the live row, and
`generate_for_context` builds `AIPreannotator` from it. `TaskService.update_task` lets `ai_provider`,
`ai_model`, `annotation_mode` and the label schema change at any task status.

Probe 4: enqueue, then change `ai_model`, then claim. `batch.model = "configured-model"`, but the worker
runs `"changed-model"`. The per-draft `metadata.ai` records the model that actually ran, so the batch
row is the record that is wrong.

Also, schema doc §2.1 calls `schema_snapshot` the *resolved output schema*, while `enqueue_batch` stores
`task.label_schema`, the raw value, which can be `None`.

**Fix (small):** in `load_execution_context`, run with the batch's `provider` and `model`. Overriding
them on the task object passed to `AIPreannotator` is enough. Either store the resolved schema, or change
the doc to describe what is stored. This also bears on C1's acceptance criterion, "which assistant and
version produced a suggestion is recorded", and on F1.

### 5. `release_lease` on shutdown can never run (minor)

In `run_forever`'s `finally`, `release_lease` only runs when `self._current_item_job_id` is set. But
`run_once`'s own `finally` always resets that id to `None` first, so the call can never happen. It does
no harm: SIGTERM/SIGINT only set `_stopping`, and the item in flight finishes. **Fix:** delete the branch
and say in the docstring that shutdown lets the current item finish. Alternatively, keep it and track
the id outside `run_once`.

### 6. The worker sleeps twice after an error (nit)

After an exception in `run_once`, the loop sleeps in the `except` and again in
`if status is None and not self._stopping`. Drop one of them.

---

## Against the client's AI answer — scope note, not a blocker for this PR

The worker still writes the AI's output the way the inline path always has: a **pending, unclaimed
draft** (`created_by=None`) that the first human save takes over. The client answered on 2026-09-17 that
AI output **is treated as submitted, goes straight to review, and is authored by the AI model**. Hanchen
decided on 2026-09-18 that it counts toward the task's required annotators, and told Michael and
Kanishka.

This PR moves where the model call runs and keeps parity with the inline path, which is the right scope
for a change behind a flag. The gap still has to land somewhere, and nothing names where. Until it does:

- Kanishka's SCRUM-48 submission count never sees the AI's work, so an item needing one annotator still
  waits for a human.
- The AI's output never reaches the review queue.
- The first annotator who saves takes over the AI's draft. These are defects S1 and S2 in
  `sandbox/W7/plans/defects-SCRUM-25.md`, which the same client answer confirmed.

**Decided (Hanchen, 2026-09-19):** give it to **SCRUM-46, "trigger a run and route to
review"** (W8, group 5). A successful item becomes a submitted annotation authored by the AI, written
through SCRUM-26's atomic submission path, and linked from a `result_annotation_id` column on
`ai_item_jobs`. #21 merged with `result_draft_id` only, so SCRUM-46 adds that column (see the #21 review,
*Not raised on the PR*). For this PR,
only add one sentence to the description: *"AI output still lands as an unclaimed pending draft;
submission as the AI's own version is SCRUM-46."* — **done**, the sentence is in the description.

> **Superseded 2026-09-21 — two statements above and in the posted review no longer hold.**
> 1. *"It counts toward required annotators."* The client's written answer of 2026-09-21 (R1-4 in
>    `docs/info/client-question.md`) says AI first-pass annotation is **separate from the human annotator
>    count**. Hanchen's decision of 2026-09-18 is withdrawn. The rest stands: on an AI-assisted task the
>    AI's output is a submitted version authored by the model and goes to review. SCRUM-46 must not count
>    it toward the human number, and SCRUM-48's API, built on the earlier decision, needs the same change.
> 2. *"That column needs a `migrate_db_schema()` step."* After SCRUM-94, `main`'s decision (2026-09-20) is
>    that development databases are disposable on both backends: a schema change is picked up by
>    `init_data.py --reset`, and `migrate_db_schema()` is a SQLite-only legacy helper. A new
>    `result_annotation_id` column therefore needs no migration step, but everyone must re-seed.
>
> Both sentences are still in the review posted on 2026-09-19. No correction has been posted.

Also still open from Hanchen's review of #20: **per-item concurrency.** The worker runs one item at a
time, so a 1,000-item batch is still up to ~17 h (C2 subtask 6, W8). Bounded parallel model calls belong
to SCRUM-3 or SCRUM-46. They are not blocking here, but say which in the description.

---

## For Hanchen, as #19's author

The PR suggests replacing `HTTPException(409)` with a domain error that the API layer maps to 409.
**Decided (2026-09-18): agree, and do it in SCRUM-26, not in #19**, as Hanchen already told Michael.
SCRUM-26 reworks the same submit path, and changing #19 now would restart its review. When SCRUM-26
lands, `record_result`'s `except HTTPException` switches to the domain error in the same change, or in
the first worker change after it.

> **Resolved 2026-09-21.** SCRUM-26 merged as #23 (on `main` with #19, `29d9bba`), and `21fe863` switched
> `record_result` to `except TaskItemFinalisedError`. The transitional dual catch suggested in the comment
> of 2026-09-19 was not needed: he took the final form directly.

---

## Close collaboration to flag

- **Kanishka (SCRUM-48)** and **Dishank (SCRUM-43)** both change `task_service.py`. This PR changes only
  the draft loop in `register_dataset`, and it merged cleanly with `main` today. Whoever merges second
  re-runs the suite.
- **Yi (SCRUM-62, F1).** An AI draft written by the worker is a provenance event ("AI suggested X"), and
  no history is recorded for it. The same is true of the inline path today. F1 should list it.
- **Parth (SCRUM-94).** Postgres makes a second worker possible, and findings 1 and 2 are what make it
  safe. *Update 2026-09-21:* Michael tagged Parth on the compose change and it is now Parth's to look at,
  and R3 above (the tests on the shared fixture) is the part of SCRUM-94's work that this PR does not yet
  use.

---

## Not raised on the PR

Everything in this file except the items below matches what Hanchen posted on 2026-09-19, or is in Michael's
reply. **Nothing from the re-review has been posted.** Checked with gh on 2026-09-21.

| Item | Where it stands |
| --- | --- |
| R1 — no test pins `lease_owner` | Local only. Would go to Michael as a request for one test |
| R2 — `worker_id` read at load time | Local only. One line |
| R3 — tests on their own SQLite engine, not `empty_engine` | Local only. It is on the roadmap's list of what #22 must change (W7, SCRUM-94 row) but was not in the posted review |
| R4, R5 | Local only; follow-ups |
| Two sentences in the posted review are superseded (*AI counts toward required annotators*; *needs a `migrate_db_schema()` step*) | Still on GitHub uncorrected. The first is Hanchen's own decision, withdrawn by the client on 2026-09-21. A short correction on the PR, or on SCRUM-46, is his call |
| Client answers of 2026-09-21 that reach this PR | R1-1 (only the annotation input goes to the model; `gold_annotations` must not) — the worker passes `payload_preview` on exactly as the inline path does, so this PR adds no new exposure, but the check is still open for both paths. R1-4 as above |

---

## Appendix — review probes, 2026-09-21 (head `21fe863`)

Run in a throwaway worktree of `21fe863` with the PR's own fixture. Output:

```
P1  B: succeeded  | A stale: lease_lost | job succeeded, its draft kept, batch completed, drafts 1
P1b B: dead_letter| A stale: lease_lost | job dead_letter, batch completed_with_failures, drafts 1
P2  sweeps [(1,0),(1,0),(0,1),(0,0),(0,0),(0,0)] | attempt_count 3 of 3 | "Abandoned after 3 attempt(s)…"
    | job dead_letter, batch completed_with_failures
P3  reclaim raised OperationalError once -> loop survived, reclaim called 2 times
P4  batch qwen/configured-model | run qwen/configured-model | snapshot keys [optional_fields, required_fields]
P7  A stale while B is running -> lease_lost, job running, owner B
    (the same run with ONLY the lease_owner condition removed -> succeeded, owner cleared)
P8  A's context carries worker_id 'B' although A claimed as 'A'
    A (model failed) -> dead_letter | B (model succeeded) -> lease_lost | final dead_letter, batch completed_with_failures
```

The R1 probe (P7) in full:

```python
a = claim_next_item(db, worker_id="A", lease_seconds=1)
ctx_a = load_execution_context(db, a)                      # worker_id == "A"
reclaim_expired_leases(db, now=datetime.now(UTC) + timedelta(hours=1))
claim_next_item(db, worker_id="B", lease_seconds=300)      # B is running, has not recorded
record_result(db, ctx_a, _result())                        # -> lease_lost  (succeeded without the owner clause)
```

The R2 probe (P8): the same, but `load_execution_context(db, a)` is called **after** B's claim.

Mutations run one at a time and restored: `max_attempts` ignored → its test fails; reclaim error re-raised →
its test fails; batch model not applied → its test fails; **`lease_owner` clause removed → all tests
pass** (R1).

---

## Appendix — review probes, 2026-09-18 (head `53e612b`)

Run in a throwaway worktree of `53e612b` merged with `main` and #19, using the PR's own fixture
(`tests/test_ai_batch_worker.py`). Output:

```
POISON attempt_count 6 max 3 status queued batch running
B -> succeeded;   A (stale) -> skipped   =>  job skipped, result_draft_id None, drafts 1
B -> dead_letter; A (stale) -> skipped   =>  job skipped, batch completed
SNAPSHOT batch.model configured-model | worker runs with changed-model
RECLAIM: OperationalError escaped run_forever -> worker process exits
```

Core of probe 2 (the stale write):

```python
a = claim_next_item(db, worker_id="A", lease_seconds=1)
ctx_a = load_execution_context(db, a)
reclaim_expired_leases(db, now=datetime.now(UTC) + timedelta(hours=1))  # A's lease lapses mid-call
b = claim_next_item(db, worker_id="B", lease_seconds=300)
record_result(db, load_execution_context(db, b), _result())   # -> succeeded
record_result(db, ctx_a, _result())                           # -> skipped, overwrites B
```
