# Code review — PR #24 `infra: run on PostgreSQL while keeping SQLite working`

**PR:** #24 · **Head:** `486d4a2` · **Branch:** `CS57-Parth` → `main` ·
**Author:** Parth (`part0922`) · **Reviewed:** 2026-09-20, **re-reviewed at `486d4a2`** the same day
**Scope:** 27 files, +1311 / −347 · **Story:** C2 / SCRUM-94

---

## Summary

**Approve.** Both blocking items were fixed in `486d4a2` *(fix: add SQLite pragmas and load Compose
environment)*, which touches only `database.py`, `test_database.py`, `compose.yaml` and the two READMEs.
What remains is follow-ups and nits, none of which is worth another round.

This is the whole ticket in one PR, not the two merges planned on 2026-09-18: the driver, the UTC
session, the compose service, the shared fixture, all 10 test files and the CI workflow land together.
That is ahead of schedule rather than behind it, and the second merge planned for early W8 is no longer
needed.

The design is sound and several things that looked wrong are not. `create_db_engine()` gives the
application and the tests one code path, which is what makes the Postgres CI job meaningful.
`migrate_db_schema()` now gates on `engine.dialect.name` instead of a substring of the URL. The test
fixture isolates each test in a random Postgres schema and refuses to touch a developer's own database.
The CI job deliberately sets the Postgres role's time zone to `Australia/Sydney`, so the UTC handling is
actually exercised rather than assumed.

Two things had to change before merge, and both now have:

1. **The SQLite pragmas agreed on 2026-09-18 were missing** — `journal_mode=WAL` and an explicit
   `busy_timeout`. This is the condition on which C2's Option B was accepted, and it never made it into
   the board description. Our omission, not Parth's. **Fixed in `486d4a2`.**
2. **`docker compose up --build` from the repo root hung forever**, because the compose file passed
   `POSTGRES_*` through with no defaults and no `env_file:`. **Fixed in `486d4a2`.**

One thing the fix introduces is worth a decision but does not block: `env_file` loads the whole
`apps/hej-api/.env` into the **postgres** container, provider API keys included — see follow-up 7.

### A decision that changes the ticket, not the code

The board's item 1 (updated 2026-09-19) says the platform "falls back to SQLite only when PostgreSQL is
not available … and logs at startup which database it is running on". The PR does not do that: with no
`DATABASE_URL` and no `POSTGRES_*`, `Settings.configure_database_url()` raises and the service does not
start.

**Decided 2026-09-20: keep the PR's behaviour and change the board.** A silent fallback lets someone
believe they are running on Postgres when they are not, which is the same failure the CI job exists to
prevent. Item 1 and `roadmap.md` are being updated to say: PostgreSQL by default, SQLite only when
chosen explicitly through `DATABASE_URL`, and a missing configuration fails at startup with a message
naming what to set.

**This has a cost that has to be announced:** the day this merges, every member must add
`POSTGRES_USER`, `POSTGRES_PASSWORD` and `POSTGRES_DB` to `apps/hej-api/.env`, or set
`DATABASE_URL=sqlite:///./hej_dev.db` to stay on SQLite. Until they do, the API will not start.

### Evidence

| Check | Result |
| --- | --- |
| GitHub Actions at `486d4a2` | `sqlite` and `postgresql` jobs **both pass** (runs 35500178990, 35500181239); same at `2af030e` |
| Backend suite | Not re-run locally; the PR reports 284 passed + 2 skipped on SQLite, 286 passed on PostgreSQL, and CI agrees |
| Diff read in full | `config.py`, `database.py`, `db_store.py`, `conftest.py`, `compose.yaml`, the workflow, the 10 test files and the docs; `486d4a2` re-read in full |
| Dishank's review (2026-09-20 05:22) | `.dockerignore` finding fixed in `2af030e`; the concurrent-id finding is deferred to a new story — see finding 4 |
| Docker path | Not run; judged from `compose.yaml` and the READMEs. The `env_file` long syntax (`path`/`required`) needs Compose ≥ 2.24, which the README now states |

---

## Blocking — both resolved in `486d4a2`

### 1. The SQLite WAL and `busy_timeout` pragmas are missing — `app/core/database.py:24`

> **Resolved in `486d4a2`.** The `connect` hook now runs `foreign_keys=ON`, then `busy_timeout=5000`,
> then `journal_mode=WAL` — that order matters, because switching journal mode takes a lock and the
> timeout has to be in force first. `test_database.py` proves it rather than asserting it: on a file
> database both pragmas hold across two separate connections and survive `engine.dispose()`, and the
> WAL guarantee itself is exercised — one connection holds a read transaction while another commits an
> insert, the reader keeps its snapshot, and sees the new row only after its own rollback. The
> in-memory case asserts `journal_mode == "memory"`, since SQLite cannot put an in-memory database in
> WAL. The engine URL carries `?timeout=0.1` so a passing `busy_timeout` of 5000 can only come from the
> hook. `HEJ_AI_EXECUTION_MODE=worker` is unblocked once this merges.

The `connect` hook sets `PRAGMA foreign_keys=ON` and nothing else. `roadmap.md` records, from the review
of PR #20 on 2026-09-18, that SCRUM-94 carries `PRAGMA journal_mode=WAL` and an explicit `busy_timeout`,
and that this is the condition on which C2's Option B — a worker polling the job tables — was agreed.
Without them, Michael's worker is a second SQLite writer that fails with `database is locked` after about
five seconds, which is the exact failure SCRUM-94 exists to remove.

It is not in the board's seven items: it was written into the roadmap and never carried across. Parth had
no way to know. Two lines in the existing hook:

```python
cursor.execute("PRAGMA journal_mode=WAL")
cursor.execute("PRAGMA busy_timeout=5000")
```

WAL is a database-level setting and persists; `busy_timeout` is per connection, so it belongs in the hook
either way. In-memory SQLite ignores WAL, which is fine — nothing else changes.

### 2. `docker compose up --build` hangs with no output — `compose.yaml:5`

> **Resolved in `486d4a2`.** Both services now carry
> `env_file: [{path: ./apps/hej-api/.env, required: false}]` and the bare `POSTGRES_*` pass-throughs are
> gone, so the documented root command works again; `required: false` keeps the SQLite path usable with
> no `.env` at all. `POSTGRES_HOST` and `POSTGRES_PORT` stay in `environment:`, which outranks
> `env_file`, so the backend still reaches the service by name. Every `--env-file` in both READMEs is
> gone and the inaccurate justification with it, replaced by a note that Compose 2.24 or newer is
> required for this syntax. See follow-up 7 for what else the file now carries.

`POSTGRES_USER`, `POSTGRES_PASSWORD` and `POSTGRES_DB` are bare pass-throughs on both services, with no
default and no `env_file:`. Run the command the root README has always documented — without
`--env-file` — and all three are empty, so the postgres container aborts init with *"Database is
uninitialized and superuser password is not specified"*, the healthcheck never passes, and `backend`
waits on `depends_on: condition: service_healthy` indefinitely. There is no error on the backend side to
explain it.

The API README justifies requiring `--env-file` with "a `service.env_file` would only inject container
variables". Container variables are all these two services need: the healthcheck expands
`$$POSTGRES_USER` inside the container, and the backend reads the variables from its own environment.
Adding

```yaml
    env_file: ./apps/hej-api/.env
```

to both services makes the bare command work again and keeps `--env-file` working for anyone who prefers
it. The sentence in the README should go with it.

---

## Follow-ups (not blocking this PR)

### 3. A stale `DATABASE_URL` in `.env` silently wins — `compose.yaml:28`

The hardcoded `DATABASE_URL: sqlite:////data/hej_dev.db` became a bare pass-through. Anyone whose
`apps/hej-api/.env` still carries the old `.env.example` line `DATABASE_URL=sqlite:///./hej_dev.db` will
run the backend on SQLite while the postgres service idles beside it, with their old container database
at `/data/hej_dev.db` orphaned. The README covers choosing SQLite deliberately but warns nobody about
inheriting it by accident. One line in the upgrade note, plus the startup log below, closes it.

### 4. The table lock is wider than the race it guards, and does not close it — `app/repositories/db_store.py:37`

This is the other half of Dishank's finding, and belongs in the same new story rather than here.

`LOCK TABLE … IN SHARE ROW EXCLUSIVE MODE` conflicts with `ROW EXCLUSIVE`, so it blocks **every**
concurrent INSERT, UPDATE and DELETE on `users`, `organization_users` and `role_assignments` until the
enclosing transaction commits — not only other explicit-id inserts. While
`admin_iam_service.create_user_for_org` holds one transaction across the user, membership and role
inserts, a concurrent `POST /auth/register` stalls on `LOCK TABLE users`.

It also does not close the race: `AuthService.register` (`auth_service.py:77`) computes `max(id) + 1`
*before* calling the repository, outside the lock, so two concurrent registrations still choose the same
id. One of them then fails as `409 "Email … already exists"`, which is not what happened.

`setval` is atomic on its own, so the lock can simply go; the real fix is to allocate ids inside the
locked region, or to stop allocating them in the service layer at all.

### 5. CI runs every job twice — `.github/workflows/backend-tests.yml:4`

`on: push` with no branch filter plus `on: pull_request` means a push to a branch with an open PR runs
four jobs, two of them provisioning a Postgres service for nothing. Visible on this PR: two `sqlite` and
two `postgresql` runs for the same commit. Restrict `push` to `main`, or drop it.

### 6. Per-test `CREATE SCHEMA` / `DROP SCHEMA` on the Postgres job — `tests/conftest.py:23`

`empty_engine` is function-scoped, so all ~286 tests each create a schema, build ~25 tables with their
indexes, and drop the schema. It works and it is correctly isolated, but it is hundreds of full DDL
cycles per run. A session-scoped engine with a per-test schema, or per-test truncation, keeps the same
guarantee for much less time. Not worth doing now — worth doing before the suite doubles.

---

### 7. The postgres container now receives the provider API keys — `compose.yaml:4` (new in `486d4a2`)

`env_file` loads **all** of `apps/hej-api/.env` into both services, so `OPENAI_API_KEY`,
`DASHSCOPE_API_KEY` and `SECRET_KEY` are now in the postgres container's environment, readable by
anyone who can `docker inspect` or `exec` into it. The previous version forwarded only the three
`POSTGRES_*` values, and the README said so in as many words — that sentence was removed in this commit
and replaced with an accurate description of the new behaviour, so nothing is hidden.

Local development only, and the same developer owns both containers, so this does not block. But the
team was named by the client over defect 1 (a live API key in committed source), and the fix is cheap:
give postgres its own small env file holding only `POSTGRES_USER`, `POSTGRES_PASSWORD` and
`POSTGRES_DB`, and keep the full `.env` on the backend. Worth deciding rather than inheriting.

### 8. Finding 3 became more likely, not less

With `env_file` on the backend, a stale `DATABASE_URL=sqlite:///./hej_dev.db` left in `.env` now reaches
the container by default, not only when someone passes `--env-file`. The README tells the upgrading
developer to clear old URL overrides first, which is the documentation half. The startup log in the nits
below is the other half, and is what would make it visible when they forget.

---

## Nits

- **`tests/conftest.py:30`** — `os.environ.get("DATABASE_URL", "sqlite://")` only defaults when the
  variable is absent. An exported-but-empty `DATABASE_URL=` reaches `create_db_engine("")` and every
  fixture-using test errors with `Could not parse SQLAlchemy URL from string ''`. `test_database.py:172`
  already uses `os.environ.get("DATABASE_URL") or "sqlite://"`; use that form here too.
- **`app/core/config.py:71`** — the error names all three of `POSTGRES_USER`, `POSTGRES_PASSWORD` and
  `POSTGRES_DB` whichever one is missing, so someone who only forgot the password is told to set
  everything. The test at `test_database.py:83` passes for all three parametrisations for the same
  reason. Naming the missing variables is a one-line change.
- **Log the database at startup.** Item 1's "never silent" requirement survives the move to fail-fast in
  a cheaper form: one line at startup naming the backend and, for Postgres, host and database (never the
  password). It is what tells a developer they are on SQLite when they meant to be on Postgres — see
  finding 3.

---

## Verified, not a problem

Listed so nobody re-opens them:

- `postgres_data:/var/lib/postgresql` is the correct mount for the postgres:18 image, whose `PGDATA`
  moved under a version directory. Mounting `/var/lib/postgresql/data` would be the bug.
- `setval(pg_get_serial_sequence(...), GREATEST(:id, nextval(...)), true)` is correct: no id is reused
  and none is skipped, and `pg_get_serial_sequence` resolves through the test `search_path`.
- The SQLite-only DDL in `migrate_db_schema()` is properly gated by `engine.dialect.name`.
- The folded-scalar Python one-liner in the CI workflow parses as intended.
- The autouse fixtures do run before `unittest.setUp` in the converted test classes.
- `AuditLogRepository.create` (`db_store.py:576`) is dead code whose kwargs do not match `AuditLogDB` —
  pre-existing, outside this diff, and correctly left out of `_add_with_explicit_id`.

---

## Checking the PR description

| Claim | Verdict |
| --- | --- |
| "PostgreSQL is now the default database for native and Docker development" | Holds — and stricter than the board's wording, see the decision above |
| "SQLite can still be selected explicitly through `DATABASE_URL`" | Holds |
| "284 passed, 2 PostgreSQL-only skipped / 286 passed on PostgreSQL 18" | Consistent with the CI runs; `486d4a2` adds SQLite pragma assertions to `test_database.py`, so the counts move |
| "The GitHub Actions workflow was also statically validated. Hosted GitHub Actions itself was not triggered" | Out of date — both jobs have since run and passed on GitHub, at `2af030e` and again at `486d4a2` |
| "Docker PostgreSQL startup and persistence" validated | Was true only with `--env-file`; the documented bare command now works after `486d4a2`. The description still shows the `--env-file` command — update it before merge |
| "Documented the development schema policy: databases are reset and re-seeded rather than migrated" | Holds — `docs/design/database/db_schema_strategy.md`, which closes item 5 of the ticket |

---

## Ticket coverage (SCRUM-94, seven items)

| Item | Status |
| --- | --- |
| 1. Both databases keep working; Postgres the default | Done, minus the fallback — board being changed to match |
| 2. PostgreSQL driver as a dependency | Done (Psycopg 3) |
| 3. UTC session time zone, `UtcDateTime` left in place | Done, and proved by the `Australia/Sydney` CI role |
| 4. A setup path that does not need Docker | Done — native install documented for Windows, macOS and Linux |
| 5. Write down what happens to a schema change | Done — `db_schema_strategy.md`: dev databases are disposable, no Alembic |
| 6. Suite passes on SQLite as before | Done |
| 7. Tests reach PostgreSQL, then CI on both | Done — shared fixture, 10 files moved, both jobs green |
| *(roadmap only)* SQLite WAL + `busy_timeout` | Done in `486d4a2`, with tests that exercise the WAL guarantee — finding 1 |

---

## Before merging

1. **Announce the day it lands.** Everyone adds `POSTGRES_USER`, `POSTGRES_PASSWORD` and `POSTGRES_DB`
   to `apps/hej-api/.env`, or sets `DATABASE_URL=sqlite:///./hej_dev.db`, and clears any stale
   `DATABASE_URL` — otherwise the API does not start, or starts on the wrong database (follow-up 8).
   Anyone with an open branch merges `main` and re-runs the suite that day.
2. **Update the board and `roadmap.md`** to the fail-fast wording decided on 2026-09-20, and add the
   WAL/`busy_timeout` line to the board description, which never carried it.
3. **Michael's #22** hard-codes `DATABASE_URL: sqlite:////data/hej_dev.db` for its `ai-worker` service.
   Merged after this, the API runs on Postgres while the worker polls a SQLite file and no batch is ever
   picked up. Its new `tests/test_ai_batch_worker.py` also builds its own in-memory SQLite engine, so the
   worker is the one part of C2 the Postgres CI job does not cover. Both belong in #22, not here.
4. **File the concurrency story** Parth agreed to with Dishank, and put finding 4 (the table lock) in it.
