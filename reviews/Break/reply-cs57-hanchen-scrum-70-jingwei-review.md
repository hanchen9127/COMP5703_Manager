# Reply — Jingwei's review of PR #51 (SCRUM-70)

2026-10-10. Jingwei commented on head `a05d147` (2026-10-05 10:06 UTC): four points and three smaller ones.
He said he would approve once they are in, and he confirmed the outcome keys in his answer to comment 1 on
#39.

Six commits deal with them, and are pushed to `CS57-Hanchen-scrum-70` (head `c51a405`, after merging `main`
at `831e463`). Points 1 and 2, and the README line, wait for #48. That is decided: #48 merges first, and #51
adapts to it.

| # | Jingwei's point | Check | Fix |
| --- | --- | --- | --- |
| 1 | EV-013 runs under the default project (`manual_review`), so `disputed` can't follow | True. **And since #53 there is more:** under the dual sign-off project EV-013 passes as written, but its `disputed` is a computed status with no dispute behind it. An expert's adjudication step gets 404 "No open escalation" (reproduced 2026-10-07). #48's SCRUM-101 opens a real dispute, but the harness only knows a dispute from an `escalate` step | After #48: R7 (the driver finds a dispute the platform opened) and R8 (EV-013 un-skipped, with the dual sign-off project and an expert adjudicating) |
| 2 | EV-017 can't catch a release carrying both rounds | True | After #48: R8 adds `expect.items` on its release step. The key it uses is real since `c51a405` |
| 3 | A skip reads as `passed: false` in the report | True | `7119bdd` |
| 4 | Coverage counts skipped cases without distinction; nothing in CI checks it | True | `7153b23` (runnable count per category), `3bf51ba` (CI step) |
| s1 | Gold loader crashes on a blank line or BOM; a duplicate silently replaces | True, all three reproduced. A record missing its text also crashed (`KeyError`) | `9154465` |
| s2 | `_do_reopen` keeps the item's cached submissions, so a superseded alias gets a 404 | True, reproduced | `7e931c2` |
| s3 | README and ADR 006 still say release means the normalized export | True, and "cross-validation means dual sign-off until SCRUM-51" is stale since #53 | After #48: R9, with the rest of the docs |
| #39 c1 | `authoritative`, `answer`, `answers`: `[outcome]` reads through the API; what an export or release carries goes on the step's `expect.items` | Agreed | `c51a405` |

## What changed

**`7119bdd` fix(eval): report a skipped case as skipped, not as failed**
- Each case has a **`verdict`**: `pass`, `fail` or `skip`. It is derived from `passed` and `skipped`, so it
  can't disagree with them. The report puts it first on each case and adds a `failed` count; `passed` stays.
- The summary and the exit status read it. When no case ran, the summary says so instead of `0/0`.
- **Named `verdict`, not `result`:** each case is already a `CaseResult` in a list called `results`, and
  `result.result` reads badly. Easy to rename if you'd rather.

**`7153b23` feat(eval): coverage shows how many of each category's cases run**
- Each line reads `confidently_wrong_ai  2  (1 runnable)`, and a second summary line says `1 of 7 have a case
  that runs`.
- The gate is unchanged. A written case still covers its category (ADR 006, decision 5), so a category waiting
  for its surface doesn't fail CI.

**`3bf51ba` ci: check the casebook's category coverage**
- The SQLite job runs `python -m evaluation list --coverage` before the tests. It reads the case files only, so
  it runs once, not on both databases.
- Removing EV-012 makes it fail (checked locally).

**`9154465` fix(eval): a gold file with a blank line, a BOM or a repeated record is reported, not a crash**
- The loader reads `utf-8-sig` and skips blank lines.
- A line that isn't JSON, a record without `external_item_ref` or `payload_preview.text`, and a repeated record
  are each a problem of every case that uses the file. Each names the file and the line, so `list` exits 2.

**`7e931c2` fix(eval): a reopen forgets the item's earlier submissions**
- Only a reopen that succeeds drops the item's cached submissions. A refused one supersedes nothing.

**`c51a405` feat(eval): outcomes and the export step assert the item's authoritative answer**
- `[outcome]` reads the item's current answers through the API, as the task owner.
- An `export` step can state `expect.items = { <alias> = { authoritative, answer, answers } }`. On `release`
  the key is checked for shape only until H1.
- `authoritative` is an actor's alias, `"ai"`, or `false`. `answer` compares only the keys the case states:
  the platform stores a model's answer normalised, so the script's `score` comes back as `confidence`.
- `answers` counts output only, as you said. **A reviewer's correction is a proposal (ADR 012)**, so it counts
  only once an expert's Accept makes it authoritative.
- An item the export left out reads as "was not exported", not as an item with no answers.
- The driver turns both sources into one `Answer`. It reads only fields that exist before and after #48;
  #48's new `resolution` and `canonical_result` are not used.
- Nothing on this branch marks an answer authoritative or writes a correction yet. So the comparison rules are
  unit-tested on `Answer` values, and the API and export reads are tested on real runs.
- Found on the way: an export with no finalised item is refused with 403 rather than returning empty, so an
  export case needs one finalised item beside the one under test.

Each commit's new tests fail on the code before it and pass after. Each commit also says which tests prove
the fix and which are guards.

**Verified (2026-10-10, `c51a405`):**
- backend on SQLite: **1,327 passed, 16 skipped**;
- casebook: 5/5 passed, 7 skipped;
- coverage: 7 of 7, 1 of 7 runnable;
- CI's `sqlite` job is green; `postgresql` was still running when this was written.

**#48.** Trial merges after every file: `runner.py`, `driver.py` and the evaluation tests merge cleanly with
`CS57-Yi` (`9935028`). `scenario.py` and the README conflict only where #51's planned adjudicate shape meets
#48's real one; #51 takes #48's.

## Still to come (after #48 merges)

- **M** — merge `main`. #48's `adjudicate` (`submission`, `decision`) replaces #51's planned shape, which goes.
- **R7** — the driver finds a dispute the platform opened (`GET /tasks/{id}/annotation-disputes`).
- **R8** — EV-012 and EV-013 un-skipped:
  - EV-012 ends `inconclusive` under #48;
  - EV-013 uses the dual sign-off project, and an expert decides the dispute each split opens;
  - EV-017 gains `expect.items` on its release step.
- **R9** — README and ADR 006.

Coverage then has 3 of the 7 categories runnable.

## Reply on the PR (ready to paste)

> Thanks Jingwei. Six commits are in for your review, pushed at `c51a405`:
>
> - **3, skips in the report** — `7119bdd`. Each case has a `verdict` of `pass`, `fail` or `skip`, derived
>   from `passed` and `skipped`. It comes first in the report, and the report counts `failed` too. I called it
>   `verdict` rather than `result`, since each case is already a `CaseResult` in `results` and `result.result`
>   reads badly. Happy to rename.
> - **4, honest coverage** — `7153b23` prints the runnable count per category (`2  (1 runnable)`) and
>   `1 of 7 have a case that runs`; the gate itself is unchanged. `3bf51ba` runs `list --coverage` in the SQLite
>   job.
> - **Gold loader** — `9154465`. Blank lines and a BOM load. A bad line, a record without its text, or a
>   repeated record is a case problem naming the file and line, so `list` exits 2.
> - **`_do_reopen`** — `7e931c2`. A successful reopen forgets the item's submissions; a refused one doesn't.
> - **Outcome keys (your comment 1 on #39)** — `c51a405`.
>   - `[outcome]` reads `authoritative`, `answer` and `answers` through the API as the task owner.
>   - An `export` step takes `expect.items`; on `release` it stays shape-only until H1.
>   - `answer` compares only the keys a case states, because a model's answer is stored normalised (`score`
>     comes back as `confidence`).
>   - `answers` counts output only. A reviewer's correction counts once it is authoritative (ADR 012).
>   - An item missing from the export fails as "not exported".
>
> **Points 1 and 2 and the README line wait for #48**, which merges first. On point 1 there's more since #53.
> Under the dual sign-off project EV-013 passes as written, but its `disputed` has no dispute behind it: an
> expert's adjudication gets 404 "No open escalation". #48's SCRUM-101 opens a real dispute, so after #48:
> 1. the driver finds a dispute the platform opened (`GET /tasks/{id}/annotation-disputes`);
> 2. EV-013 runs with the dual sign-off project and an expert deciding it;
> 3. EV-012 runs (ending `inconclusive`);
> 4. EV-017 gets `expect.items` on its release step;
> 5. the README and ADR 006 catch up.
>
> #51 stays a draft until then. `runner.py`, `driver.py` and the tests merge cleanly with #48 as it stands;
> only `scenario.py` and the README conflict, where #51's planned adjudicate meets Yi's real one, and I'll take #48's.
>
> SQLite: 1,327 passed, 16 skipped; casebook 5/5 passed, 7 skipped.
