# Code review — PR #20 `docs(C2/SCRUM-1, SCRUM-2): AI batch execution options and job schema`

**PR:** #20 · **Head:** `e7f4d03` (6 commits) · **Branch:** `CS57-Michael-c2-batch-docs` ·
**Author:** Michael Max (`mike-ad`) · **Reviewed:** 2026-09-18
**Scope:** 2 files, +788 / −0, docs only · **Story:** C2 / SCRUM-1, SCRUM-2 (subtask 1)
**Companions:** #21 (SCRUM-1 tables), #22 (SCRUM-2 worker) — merge order #20 → #21 → #22

> **Merged 2026-09-18** (`d087e11`) at `e7f4d03`, unchanged. The only comment posted on the PR is
> Hanchen's agreement to Option B with the WAL/`busy_timeout` condition (2026-09-18). This review was
> not posted. None of it was applied before merge, so it carries over as a follow-up docs change.

---

## Summary

**Approve, with a follow-up: §9 to record the decision as it was actually taken, and the description
and status headers to be brought up to date.**

The two documents are the strongest design writing on the board so far. The execution document
states today's path accurately, measures the SQLite constraint rather than asserting it, and keeps the
persistence question apart from the queue question. The schema document gives a reason for every
column and every delete rule. Both are complete enough to serve as K2 decision records, as they
claim.

Two things need changing (see *Decisions*, settled by Hanchen on 2026-09-18):

- **§9 contradicts the answers it was given.** It says durability across a restart "is a
  requirement", and that the decision was taken on Discord with no objections. Hanchen's reply of
  2026-09-18 (`sandbox/W7/message-michael-c2-review.md`) said the opposite: durability is not a C2
  requirement, and the state must survive. Hanchen's follow-up (`message-michael-c2-followup.md`)
  agreed Option B **on a condition**: WAL and an explicit `busy_timeout` on SQLite.
- **That condition has no owner.** #22 adopts Option B and sets neither pragma, and SCRUM-94 does not
  list them either.

Hanchen's first-round points on #20 (the same message) are only partly addressed:

| Point from the 2026-09-18 reply | Status at `e7f4d03` |
| --- | --- |
| §6 needs updating now that Postgres is decided (SCRUM-94) | ✅ §9 point 2 does this |
| Transition plan for the inline path | ✅ Answered by #22's `HEJ_AI_EXECUTION_MODE` flag, with `inline` as the default |
| Per-item concurrency — 1,000 items in W8 needs bounded parallel model calls | ❌ Not discussed. #22's worker is strictly sequential, so the ~17 h worst case still stands |
| Options costed against W8's 2u for C2 | ❌ Not discussed |

### Evidence

| Check | Result |
| --- | --- |
| Line references in §2 (`tasks.py:294`, `task_service.py:88, 587, 593, 604, 610, 657, 674, 676–677`, `database.py:18–20, 37, 72`, `ai_preannotator.py:89`) | ✅ All correct at `17673c8` |
| `docs/backend-governance-guards.md`, cited in the schema doc §1.1 | ✅ Exists on `main` |
| Schema doc against #21's models | ✅ Columns, delete rules, defaults and named indexes match. One gap: the ORM's status comment omits `skipped`; see the #21 review |
| Schema doc §2.1 `schema_snapshot` "resolved output schema" against #22 | ⚠️ #22 stores the task's raw `label_schema`, which is not the resolved output schema; see the #22 review |
| Merge into `origin/main` | Docs only, no conflicts |

---

## Checking the PR description

| Claim | Verdict |
| --- | --- |
| "Two proposal docs … No code" | ✅ Correct |
| "The execution doc makes no recommendation" | ❌ **Stale.** Since `3b01dc2`, §9 records the decision: Option B |
| "It is here so the team can decide SCRUM-2" | ❌ Stale for the same reason. The decision was taken on Discord before review, and #22 already implements it |
| "The schema doc does not depend on that decision" | ✅ Correct, and the schema is written to hold that way: no column encodes a broker or a process model |
| Today's path: inline, one transaction, no trigger, ~17 h at 1,000 items | ✅ Correct: 1,000 × 60 s timeout, without the SDK's two retries |
| SQLite: rollback journal, 5 s busy timeout, `database is locked` after ~5 s | ✅ Consistent with `database.py`, which sets only `foreign_keys`. Not re-measured here |
| "Postgres is not proposed" | ⚠️ True of §6, but §9 now relies on SCRUM-94 for the move. The description should say so |

---

## Decisions (settled by Hanchen, 2026-09-18)

### 1. §9 must record the decision as it was taken

§9: *"Decided by mike-ad on 2026-09-17 … circulated to the team on Discord … No objections were
raised"*, and *"Durability across an API restart is a requirement, not a preference. … This eliminates
Option A."*

Both statements conflict with the written record:

- Hanchen answered the durability question on 2026-09-18: **not a C2 requirement**. The *state* must
  survive a restart, and the SCRUM-1 tables provide that. Option A stayed admissible, with a
  resume-on-start step.
- Hanchen then **agreed Option B, with a condition**: SQLite stays supported, and there a separate
  worker is the second writer that hits `database is locked`, so B needs WAL and an explicit
  `busy_timeout`.

Option B still stands. It survives restarts at no extra cost now that Postgres is in scope, and C and D
cost more. But a K2 record whose main reason contradicts the answer given is the one thing a K2 record
must not be.

**Decided:** keep Option B. Rewrite §9 so that it:

- states the answer to question 1 as given, and chooses B on cost and robustness rather than as a
  requirement;
- records Hanchen's agreement of 2026-09-18 and its WAL/`busy_timeout` condition, with a pointer to
  decision 2;
- replaces the Discord line with *"Confirmed at review of PR #20 by Hanchen Wang, 2026-09-18."*

Then correct the PR description.

### 2. Who turns on WAL and `busy_timeout`?

§6 lists the first condition that forces the persistence question:

> Choosing any option without first setting WAL and an explicit `busy_timeout`. Every option adds a
> long-running writer alongside requests. On `journal_mode=delete` that is the measured failure above;
> it will appear as intermittent 500s under load, not as a clean error.

#22 implements Option B on SQLite and changes neither setting. §6 treats the change as small and
independent, but keeps it out of this decision because it touches shared infrastructure. SCRUM-94's
scope is Postgres, UTC and the test fixture, and says nothing about SQLite's pragmas. As things stand,
nobody owns this change.

Hanchen's follow-up asked Michael and Parth to agree which PR carries the change, and nothing records
that they did.

**Decided:** `PRAGMA journal_mode=WAL` and an explicit `busy_timeout` go into **SCRUM-94's first
merge**. It already changes `core/database.py` and the `connect` hook these pragmas belong in, and
everyone re-runs the suite that day anyway. Until it lands, `HEJ_AI_EXECUTION_MODE` stays `inline`, as
it is by default. `roadmap.md` records this.

---

## Findings

### 3. The status headers contradict §9 (minor)

- `ai_batch_job_schema.md` still reads *Status: Proposal — for review*, and its governance block calls
  the companion *"(SCRUM-2, undecided)"*.
- Its §7 says SCRUM-1 "should not be padded with a half-worker". That is right, but #22 is now the
  worker, so the sentence reads as if nothing follows.

**Suggested fix:** set the schema doc's status to *Agreed*, with the date of this review, and change the
companion reference to *"(SCRUM-2, decided — §9)"*.

### 4. The Docker and firewall constraint belongs to one environment (minor)

§5 C and §9 give "Docker is unusable here and `registry-1.docker.io` is not on the firewall allowlist"
as a reason against Redis. That is true of the author's development container. It is not a property of
the project, and a reader of the K2 record will take it as one. The conclusion does not depend on it:
C still adds a second source of truth, and SCRUM-94 is already writing a setup path without Docker for
the whole team.

**Suggested fix:** say whose environment it is — "the author's development container" — and keep the
second-source-of-truth argument as the main reason.

### 5. Retry history: confirm latest attempt only (question, not blocking)

The schema doc §8.3 asks this directly. Keeping only the latest attempt is enough for SCRUM-3 and
SCRUM-5. I4 (W10) measures AI-assisted annotation, but from drafts and reviews, not from job rows, so it
needs no attempt history. **Recommendation:** confirm latest attempt only. An `ai_item_job_attempts`
table can be added later without changing anything existing.

### 6. The schema doc's §8.1 predates the client's AI answer (should fix)

§8.1 frames `result_draft_id` around a race between the worker and an annotator claiming the AI's
draft. On 2026-09-17 the client answered that AI output **is treated as submitted, goes straight to the
reviewer, and is authored by the AI model**. Hanchen then decided that it counts toward the task's
required annotators. Under that answer nobody claims the AI's work, and a run's result is a submitted
annotation, not a draft. **Fix:** rewrite §8.1 against the answer, and record the column decision taken
in the #21 review.

---

## Close collaboration to flag

- **SCRUM-62 (F1, Yi).** Schema doc §5 says anything that belongs in provenance goes through
  `TaskHistoryRecorder`, and it is right to keep job rows out of provenance. But "the AI suggested X
  for this item" *is* a provenance event under the brief's Record pillar, and neither the worker (#22)
  nor today's inline path records one. Yi should include it among F1's decision points.
- **SCRUM-94 (Parth).** §6's UTC paragraph is what SCRUM-94 implements. The roadmap already says the
  session-level UTC fix goes in **alongside** `UtcDateTime`, not instead of it.
