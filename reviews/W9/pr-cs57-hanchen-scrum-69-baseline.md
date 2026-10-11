## Summary

SCRUM-69, story I1: repeatable runs and regression reporting. A run of the casebook is now proved repeatable, summarised by what stays the same between runs, and compared case by case with a committed baseline, so a case that starts failing, **stops running** or disappears fails the build.

**Stacked on #51** (SCRUM-70), which gives each case its `verdict`. The base is `CS57-Hanchen-scrum-70`; when #51 merges, I'll merge `main` in and retarget this to `main`.

## Commits

| Commit | What it adds | Ticket |
| --- | --- | --- |
| `828ebe7` | `baseline.py`: a case's summary is its verdict and where it failed (`step 4 (adjudicate as bob)`, `outcome`, `setup` or `harness error`). The failure's message and a skip's reason are left out: one carries ids that change between runs, the other is prose that gets edited. The report carries the summary | 2 |
| `f65ac25` | A test that runs the whole casebook twice and finds the same summary and the same response at every step | 1 |
| `7a93ca7` | `compare(old, new)`: one change per case id, from eight kinds (table below); `exit_status`, with an exact mode; the printed lines and the report's comparison built from the same changes | 3, 4, 5 |
| `32dc437` | The command line: `run --baseline PATH [--exact]`, `run --update-baseline`, `compare OLD NEW` | 3, 4 |
| `893e345` | `evaluation/baseline.json`, the first baseline (7 pass, 5 skip), and a test that compares the casebook with it exactly | 4 |
| `868320c` | **Fix:** without `--database-url`, cases run on `DATABASE_URL` (CI's PostgreSQL job) but the report said `sqlite`. It now names the database the cases ran on | 2 |
| `8416f84` | README section on comparing runs; ADR 006 consequences | 6 |

## What counts as a regression

| Change | Baseline → run | Regression? |
| --- | --- | --- |
| newly failing | pass or skip → fail | **yes** |
| newly skipped | pass or fail → skip | **yes**: a skip proves nothing, so it must not hide a regression |
| removed | present → absent | **yes**: neither may deleting a case |
| failing elsewhere | fail → fail at another place | no, but reported |
| newly passing | fail → pass | no |
| newly running | skip → pass | no |
| added | absent → present | no |
| unchanged | the same | no |

## Decisions for review

- **The baseline is committed, and compared exactly.** A stale baseline hides regressions: if it still said `skip` for a case that now runs, the case sliding back to `skip` would read as unchanged. So any change fails the comparison in the test suite, and a PR that changes a verdict on purpose runs `--update-baseline` and commits the file. The change then shows in its diff. Locally, `--baseline` without `--exact` fails only on regressions.
- **No new CI step.** `test_the_committed_baseline_matches_the_casebook` runs in pytest, which CI runs on SQLite and on PostgreSQL. A separate workflow step would either never fail (after pytest, which already stops the job) or hide other failures (before it).
- **One baseline for both databases.** They must give the same verdicts; a case that differs fails one job.
- **Removed is a regression.** The ticket names newly failing and newly skipped; deleting a failing case hides it just as well.
- **`--update-baseline` is refused** while a case fails (a baseline describes a green casebook) and for chosen cases (exit 2: the next full run would find the rest added). Chosen cases are compared with their own entries only, so `run EV-012 --baseline …` doesn't report the others as removed.
- **For you, @Jingwei-Lin, as the harness's owner:** the report keeps `passed`, `failed`, `skipped` and `results` as they were; `summary` and, with a baseline, `comparison` are added.

## Testing

- On SQLite: evaluation tests 127 passed, 5 skipped; full API suite 1,521 passed, 14 skipped (9 PostgreSQL-only, 5 skipped cases). CI runs both databases.
- Each code commit's new tests fail on the commit before it: no module, missing names, unknown options, no baseline file, `sqlite` instead of `postgresql`.
- Mutations, shown and not committed:
  - EV-002's AI answering on the second run where its script says it fails: the repeatability test fails naming EV-002 at step 4;
  - the baseline hand-edited to say EV-010 is skipped: the baseline test fails with `NEWLY RUNNING  EV-010` and the command that fixes it.
- By hand: `--update-baseline`, then `run --baseline … --exact` and `compare`: `12 cases: 12 unchanged. No regression.`

## After merging

When a PR un-skips a case or adds one, it runs `uv run python -m evaluation run --update-baseline` and commits `evaluation/baseline.json`. SCRUM-71 (W10) will do this for every case it adds.
