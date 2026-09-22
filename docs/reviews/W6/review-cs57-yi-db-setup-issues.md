# Code review — `Schema: Fix db setup issues`

**Commit:** `a324b7d` · **Branch:** `CS-57-Yi` · **Author:** Yi Geng
**Scope:** 1 file, +7 / −9 (`apps/hej-api/init_data.py`) · **Ticket:** SCRUM-81 → story **A3**

---

## Summary

The change is correct and does what it claims for **one** of A3's five subtasks — `--reset` now works
repeatedly against an already-seeded database, which I verified by running it. Credit where due:
that was the hardest of the five to diagnose.

**But this does not close A3.** Two of the four acceptance criteria still fail, and I reproduced both
on a stock Windows terminal. In particular the script currently **does not run at all** on a machine
with a non-UTF-8 console codepage, which is criterion 1.

Recommend merging the fix, but keeping SCRUM-81 open — or, since the remainder is three one-line
changes, finishing them in this same PR.

---

## A3 scorecard

### Acceptance criteria

| # | Criterion | Status |
| --- | --- | --- |
| 1 | Documented setup steps produce a running platform with seeded Admin/Reviewer/Annotator accounts | ❌ crashes before seeding on a stock Windows terminal |
| 2 | Resetting demo data works repeatedly, including against an already-seeded database | ✅ **fixed by this commit** |
| 3 | Configuration supplied by a team member (ports, keys, environment) is actually picked up | ❌ untouched — issue #23 fully intact |
| 4 | A setup failure reports what went wrong instead of failing silently or crashing while reporting | ❌ the error handler itself crashes |

### Subtasks

| # | Subtask | Status |
| --- | --- | --- |
| 1 | Fix console-encoding crash in `--reset`, including the error handler that crashes while reporting (issue 24) | ❌ not touched |
| 2 | Drop tables in FK-safe order so `--reset` works repeatedly (issue 24) | ✅ **done** |
| 3 | Add `env_file` to `model_config` in `app/core/config.py:19` so `.env` is read (issue 23) | ❌ not touched |
| 4 | Correct `apps/hej-api/.env.example` from `DAP_` to `HEJ_` (issue 23) | ❌ not touched |
| 5 | Write the setup path in the README and have a second person follow it from a clean clone | ❌ not touched |

---

## What this commit fixes — verified before/after

Subtask 2 / issue #24b. The hand-rolled `DROP TABLE` loop was replaced with the existing
`reset_db()`, which uses `Base.metadata.drop_all` and therefore drops in reverse dependency order —
so `PRAGMA foreign_keys=ON` (`app/core/database.py:35`) no longer rejects the drop.

I ran `python init_data.py --reset` twice against a seeded database at both commits:

| | 1st reset | 2nd reset |
| --- | --- | --- |
| Parent `c3f79da` | ok | ❌ `sqlite3.IntegrityError: FOREIGN KEY constraint failed` |
| This commit `a324b7d` | ok | ✅ ok |

The `else: init_db()` restructure is also correct — `reset_db()` (`database.py:98`) already calls
`init_db()` internally, so tables are still recreated in reset mode. No regression there.

---

## Why A3 isn't closed

### Criterion 1 + 4 — the script doesn't run on a stock Windows terminal

Subtask 1 is untouched; all 27 emoji prints remain. On a `gbk` console (the stock codepage on
Windows 11 Home China) `--reset` dies immediately, and then the error handler dies while reporting
the error:

```
UnicodeEncodeError: 'gbk' codec can't encode character '⚠' in position 2

During handling of the above exception, another exception occurred:

  File "init_data.py", line 979, in main
    print(f"\n❌ Initialization failed: {str(e)}")
UnicodeEncodeError: 'gbk' codec can't encode character '❌' in position 2
```

It fails on the `⚠️  RESET MODE` banner (`init_data.py:923`) and the handler fails on `❌`
(`init_data.py:979`) — exactly the double-failure issue #24 describes, and precisely what criterion
4 ("crashing while reporting") was written to exclude.

**The passing reset runs in the table above were only obtainable with `PYTHONIOENCODING=utf-8`
forced.** Git Bash and the VS Code terminal are UTF-8, which is almost certainly why this looked
fine locally.

One line at the top of `main()` fixes both criterion 1 and criterion 4:

```python
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.stderr.reconfigure(encoding="utf-8", errors="replace")
```

### Criterion 3 — configuration is still ignored

Subtasks 3 and 4 are both untouched, so issue #23 is fully intact.

`app/core/config.py:19` — no `env_file`, so a `.env` file is never read:

```python
    model_config = SettingsConfigDict(
        env_prefix="HEJ_",
        case_sensitive=False,
    )
```

```suggestion
    model_config = SettingsConfigDict(
        env_prefix="HEJ_",
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )
```

And `apps/hej-api/.env.example` still ships the wrong prefix entirely — `DAP_ENVIRONMENT`,
`DAP_HOST`, `DAP_PORT`, `DAP_RELOAD`, `DAP_API_PREFIX`, `DAP_API_VERSION` — while `Settings`
expects `HEJ_`. Copying the example file still changes nothing:

```
sed -i 's/^DAP_/HEJ_/' apps/hej-api/.env.example
```

Both defects have to go for criterion 3 to pass — the story spells this out under Related issues.

---

## Review notes on the change itself

- **The "Dropped N tables" message can lie** (`init_data.py:931`). `table_names` comes from the
  inspector — every table in the file — but `drop_all` only drops tables registered in
  `Base.metadata`. A developer with a stale table from an older schema is told it was dropped when
  it wasn't. Either count what was actually dropped, or drop the number from the message.

- **No test.** Criterion 2 is correct now but unguarded, so it can regress silently. A short test
  that calls `reset_db()` twice against a temp SQLite file would pin the behaviour, and the repo's
  Definition of Done asks for a test that fails against the old behaviour — which this one would.

- **Commit message.** `AGENTS.md` asks for semantic headlines (`fix:`, `feat:`, …). More important,
  "Fix db setup issues" claims considerably more than the change delivers — someone scanning the log
  would reasonably read it as closing SCRUM-81. `fix: drop tables in dependency order on reset`
  describes it accurately.

---

## To close A3

1. `sys.stdout/stderr.reconfigure(encoding="utf-8", errors="replace")` in `init_data.py` — subtask 1,
   criteria 1 and 4.
2. `env_file=".env"` in `config.py:19` — subtask 3.
3. `DAP_` → `HEJ_` in `.env.example` — subtask 4.
4. README setup path, walked by a second person from a clean clone — subtask 5, the only item that
   needs someone other than the author.

Items 1–3 are one-liners. Worth finishing them in this PR rather than merging and leaving the ticket
open.

## Downstream note

**A4 (SCRUM-84, Gemini key rotation) is sequenced after A3** — "configuration has to load before a
key can be supplied any other way." Until subtasks 3 and 4 land, there is no way to supply the key
by environment, so the committed credential stays the one the app actually uses at runtime. That
makes these two one-liners the blocker on a Medium-severity credential exposure, which is worth
saying out loud when prioritising.
