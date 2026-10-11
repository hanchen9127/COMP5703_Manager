# Plan — SCRUM-69: Repeatable runs and regression reporting

2026-10-11. Story **I1**. Board: W9, Hanchen, 1.5u (from Yi on 2026-10-07). Ticket text:
`../jira/jira-W9-evaluation-descriptions.md` → SCRUM-69 (rewritten 2026-10-10).

## Decided by Hanchen (2026-10-11)

1. **Stacked on #51.** Branch `CS57-Hanchen-scrum-69` from `CS57-Hanchen-scrum-70` (`6e563fa`). The PR targets
   `CS57-Hanchen-scrum-70` until #51 merges, then is retargeted to `main` after merging `main` in. Never rebase.
   Changes Jingwei asks for on #51 are merged into this branch.
2. **The baseline is committed** (option B). `evaluation/baseline.json` holds only what is stable across runs, and CI
   compares every run with it on both databases, so a case that stops running fails CI as well as one that fails.
   A PR that changes a verdict on purpose regenerates the file, and the change shows in its diff. A `compare`
   command also compares any two reports, for local use. One baseline serves both databases: their verdicts must
   agree.

## What exists already (checked on `6e563fa`)

| Ticket criterion | Today |
| --- | --- |
| 1. Same cases twice → same verdict per case, proved by a test | Each case builds a fresh world and the AI is scripted, so it should hold. **No test proves it** |
| 2. A run summary per case id: verdict, first failing step, the run's commit and database | The report has `commit`, `database` and each case's `verdict` and `failure`. But `failure` is the whole message, which carries ids (`dispute_0bb70f1b2c70`) and changes between runs. **No stable summary** |
| 3. Compare with a baseline, six kinds of change | **Missing** |
| 4. Newly failing, and running → skipped, exit non-zero, in CI and the command line | **Missing.** CI fails only on a failing case |
| 5. Human summary and machine result from the same data | Holds for today's summary; the comparison must keep it |
| 6. README: keeping and comparing a baseline | **Missing** |

## Design

**The stable summary of a case** is `{"verdict": "pass" | "fail" | "skip", "failed_at": str | None}`. `failed_at`
is the part of `failure` before its first `": "`: `step 4 (adjudicate as bob)`, `outcome`, `setup` or
`harness error`. The message after it is left out, because it carries ids and API wording that may change without
the case changing. The summary of a run is `{case_id: case_summary}`, sorted by id.

**The report** gains `"summary"`: that mapping. A baseline file has the same `"summary"` and nothing else that
changes between runs (no time, commit or database), so `compare` reads either a report or a baseline.

**Comparing** baseline B with run R gives each case id one change:

| Change | B | R | Regression? |
| --- | --- | --- | --- |
| `newly_failing` | pass or skip | fail | **yes** |
| `newly_skipped` | pass or fail | skip | **yes** — a skip proves nothing, so it must not hide a regression |
| `removed` | present | absent | **yes** — deleting a case must not hide one either |
| `newly_passing` | fail | pass | no |
| `newly_running` | skip | pass | no — its surface has landed |
| `added` | absent | present | no |
| `unchanged` | same verdict, same `failed_at` | | no |

A case that fails in both at a different step is `unchanged` in verdict but reported as `failing_elsewhere`, not a
regression (it was already failing), so a reader sees it moved. **Exit status:** 1 when any regression, else 0.

**Keeping the baseline current.** A stale baseline hides regressions: if EV-012's baseline still said `skip` after
it started running, and it later went back to `skip`, the comparison would call that `unchanged`. So CI compares
**exactly**: any change, improvements included, fails with "the baseline is out of date: run with
`--update-baseline` and commit it". Locally, `--baseline` reports and fails only on regressions.
`--update-baseline` refuses to write while a case fails: a baseline describes a green casebook, which CI already
requires.

**Command line:**
- `run --baseline evaluation/baseline.json` — run, print the comparison, exit 1 on a regression.
- `run --baseline evaluation/baseline.json --exact` — the same, and exit 1 on any change (CI).
- `run --update-baseline` — write `evaluation/baseline.json` from this run.
- `compare OLD NEW` — compare two reports or baselines without running anything.

The comparison is one list of changes; the printed lines and the report's `"comparison"` are both built from it.

## Commits

| # | Commit | What changes | Tests (fail first) |
| --- | --- | --- | --- |
| 1 | `feat(eval): a run's summary keeps only what is stable across runs (SCRUM-69)` | `harness/baseline.py`: `case_summary`, `run_summary`; `write_report` adds `"summary"` | `failed_at` for a step, an outcome, setup and a harness error; a message with an id leaves the summary unchanged; the report carries the summary |
| 2 | `test(eval): the same cases run twice give the same summary (SCRUM-69)` | A test that runs the casebook twice in process and compares the summaries | Criterion 1. Proved by a mutation: a case whose step depends on run order or time would fail it (shown once, not committed) |
| 3 | `feat(eval): compare a run with a baseline, case by case (SCRUM-69)` | `compare(old, new) -> list[Change]`, `is_regression`, `comparison_lines` | One test per change kind; exact mode; summary lines and the report's comparison from the same changes |
| 4 | `feat(eval): run against a baseline, update it, and compare two reports (SCRUM-69)` | `__main__.py`: `--baseline`, `--exact`, `--update-baseline`, `compare`; the report's `"comparison"` | Exit status for each case of the table; `--update-baseline` refused while a case fails; `compare` on two files |
| 5 | `feat(eval): the casebook's first baseline (SCRUM-69)` | `evaluation/baseline.json`, generated by `--update-baseline` | Loads; equals the summary of a run |
| 6 | `ci: compare the casebook with its baseline on both databases (SCRUM-69)` | `backend-tests.yml`: `run --baseline evaluation/baseline.json --exact` in both jobs | CI green; locally, adding `skip` to EV-010 fails the step |
| 7 | `docs(eval): keeping and comparing a baseline (SCRUM-69)` | README: the summary, the change kinds, when to update the baseline; ADR 006 consequence on the committed baseline | — |

1 → 3 → 4 → 5 → 6 → 7 in order; 2 can come any time after 1.

**Changed 2026-10-11 (Hanchen), after commit 5:** commit 6 does not touch CI. Commit 5's
`test_the_committed_baseline_matches_the_casebook` already compares exactly, and CI's pytest runs it on both
databases (the harness reads `DATABASE_URL`). A workflow step would either never fail (after pytest, which stops the
job first) or hide other failures (before it). A step that uploads the report as a CI artifact belongs to SCRUM-72/73
if they need it. **Commit 6 is instead `fix(eval): the report names the database the cases ran on`:** without
`--database-url`, cases run on `DATABASE_URL` (CI's PostgreSQL) but the report said `sqlite` — criterion 2.

Done: 1 `828ebe7`, 2 `f65ac25`, 3 `7a93ca7`, 4 `32dc437`, 5 `893e345`, 6 `868320c`, 7 `8416f84`; pushed
2026-10-11 (the remote branch had been created at `7a93ca7` from Hanchen's account). Full suite on SQLite 1,521
passed, 14 skipped. **Opened as PR #62** (ready, base `CS57-Hanchen-scrum-70`, Jingwei requested, 11 files) on 2026-10-11 with the
description in `../../../reviews/W9/pr-cs57-hanchen-scrum-69-baseline.md`.

**Left:** move SCRUM-69 to In Review on the board (Hanchen); log #62 in the tracker; after #51 merges, merge
`main` into this branch and retarget #62 to `main`.

## Validation

- Full API suite on SQLite; CI on both databases.
- `run --baseline evaluation/baseline.json --exact` exits 0 on a clean tree.
- Mutations, shown and reverted: a case made to fail → `newly_failing`, exit 1; `skip` added to EV-010 →
  `newly_skipped`, exit 1; EV-013 deleted → `removed`, exit 1; a skipped case made to run (in a temp copy) →
  `newly_running`, exit 0 without `--exact` and 1 with it.

## Collaboration

- #51 (SCRUM-70, Jingwei reviewing): this branch sits on it.
- SCRUM-71 (W10): each case it un-skips or adds updates the baseline in the same PR. Add that line to SCRUM-71
  when this merges.
- SCRUM-72, 73 (W10) measure on repeatable runs; they read the report, not the baseline.
