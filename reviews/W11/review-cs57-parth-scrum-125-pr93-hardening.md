# Review — PR #93, `CS57-Parth` (SCRUM-125: hardening — H5's export-figure check, CI, compose secrets, explicit-ID locking)

<https://github.com/USYD-CS-Capstone/hej/pull/93> · reviewed 2026-10-22 at `9d4b8ac` (2 commits, base `main` at `f3dfdc1`)

**Posted 2026-10-21 15:13 UTC as Request changes** on `9d4b8ac`, before the full PostgreSQL run finished; its
result is added to the same review by editing it. The posted body is a shorter version of the sections below, up to "Runs". "Not
raised on the PR" was not posted.

Read from GitHub first:
- **The PR is a draft.**
- It has no reviews, no comments and no review requests.
- It is 3 merges behind `main` (#94 and two tracker-only merges), and GitHub reports it `MERGEABLE`.
- **CI ran on `9d4b8ac`** (run 39567157936): `sqlite` and the new `web` job succeeded, and `postgresql` was skipped,
  as designed for PRs. The billing block ended on 2026-10-20. The posted review first said CI could not run. At
  Hanchen's request it was **edited in place** (2026-10-21 ~15:40 UTC) instead of being corrected in a comment, and
  the comment was removed. The full PostgreSQL result was added to the same review the same way.

Prior context read: SCRUM-125's description and acceptance criteria (board export of 2026-10-22 01:14), the
`mission.md` notes on SCRUM-125, and the #90 review. That PR already carried `4f7c87b` under SCRUM-125's name: the
PostgreSQL job runs on `main` and on demand, not on PRs. Kanishka's PR #92 (`docs/evaluation-findings.md`, SCRUM-75)
was read too, because SCRUM-125 points its open items there. There are no sandbox messages to Parth about SCRUM-125.

## Verdict: request changes (two small ones)

Most of the work is right, and the explicit-ID part is careful.

| Criterion | In the PR | Verdict |
| --- | --- | --- |
| 1. H5 check | A route test seeds all nine statuses and compares the export, task-item and project-count reads. The check found a real defect, fixed in `summarizeExportPackages`: frozen releases were counted again as live items | ✅ |
| 2. CI | Push stays filtered to `main`, PRs still run. A Node 22 `web` job runs `npm ci`, test, typecheck and lint | ✅ Green on the PR (`sqlite`, `web`). `main` runs `postgresql` after the merge |
| 3. Compose | With `--env-file`, postgres receives only the three `POSTGRES_*` values | ⚠️ See change 1 |
| 4. Explicit IDs | Option (a): a per-sequence advisory lock replaces `LOCK TABLE`, and ids are reserved with `nextval` instead of `max(id) + 1` | ✅ |
| 5. Issue 1 rotation | Recorded as open | ⚠️ See change 2: it is in a second findings file |
| 6. Definition of Done | Tests in the change. `tech-stack.md` Testing and `api_surfaces.md` are updated | ✅ |

### What was checked

- **Explicit IDs, on PostgreSQL 18:**
  - `test_explicit_id_postgres.py` passes: 42 tests.
  - With `pg_advisory_xact_lock` replaced by a no-op, 33 of the 42 fail. So the tests prove the lock, not just the
    happy path.
  - Each flow now reserves its id first and keeps the lock to commit: registration, invitation, role grant, the
    creator's membership and role in `create_organization`, and `init_data.py`. The ORM `before_insert` hook takes
    the same lock for direct inserts, and only moves the sequence forward.
- **H5, web:** with the frozen-snapshot filter removed, 3 of the 4 new `project-overview-metrics` tests fail. The
  only caller of `summarizeExportPackages` is the project exports panel, which also feeds the overview KPIs.
- **H5, API:** the route test covers every `TaskItemStatus` value and keeps an unrelated project's item out. It
  pins agreement that already holds on `main`, which is what H5 asked for.
- **CI:** `npm run lint:web` exits 0 with 45 warnings and no errors, so the new `web` job passes as it stands.

## Changes requested

### 1. A plain `docker compose up` now gives the backend empty database credentials, silently

`backend` and `ai-worker` gained `POSTGRES_USER: ${POSTGRES_USER:-}` (and the same for `PASSWORD` and `DB`) under
`environment:`. In Compose, `environment:` wins over `env_file:`. So without `--env-file`, those three come from an
empty interpolation and replace the values `env_file` loads from `apps/hej-api/.env`.

I checked this with `docker compose config` and a dummy `apps/hej-api/.env`. It resolves the file and starts
nothing:

| | `postgres` `POSTGRES_USER` / `PASSWORD` | `backend` `POSTGRES_USER` / `PASSWORD` | `GEMINI_API_KEY` in postgres |
| --- | --- | --- | --- |
| `main`, `docker compose config` | `hej` / set | `hej` / set | **present** (the leak) |
| PR, `docker compose config` | `""` / `""` | **`""` / `""`** | absent |
| PR, `--env-file apps/hej-api/.env config` | `hej` / set | `hej` / set | absent ✅ |

`main`'s README told everyone the flag "is no longer required", so `docker compose up` is the command teammates
type. After this PR, on an existing volume, postgres still starts, because it ignores empty `POSTGRES_*` once it has
been initialised. The backend then connects as user `""` and fails, and nothing points at the missing flag.

**Suggested fix:** drop the three `POSTGRES_*` entries from `backend` and `ai-worker`. Their `env_file` already
supplies them, as on `main`, and only the `postgres` service keeps the interpolated mapping. Then:
- a forgotten flag still works on an existing volume;
- on a fresh volume, postgres refuses with its own error that the superuser password is not specified;
- postgres still never sees a provider key.

The README sentence about shell `POSTGRES_*` overriding all three services would then go back to what `main` said.

### 2. Keep SCRUM-75's findings in one record

The PR adds `docs/implementation/planning/SCRUM-75-findings.md` and a new `docs/implementation/planning/roadmap.md`.
SCRUM-75's findings record is Kanishka's `docs/evaluation-findings.md` (PR #92). It already records issue 1's
provider rotation as OPEN (§7). Two files named for SCRUM-75 will disagree as soon as one of them changes, and a
`roadmap.md` holding one ticket's follow-ups reads as the project roadmap.

Option (a) was implemented, so the ticket needs nothing recorded as a limitation. Suggested:
- remove both files;
- keep the design notes already in `db_schema_strategy.md`, `tech-stack.md` and `api_surfaces.md`;
- tell Kanishka the two results for #92, in a line each: H5 agrees after the snapshot fix, and the explicit-ID race
  is closed.

The rotation item is already there. One small error in the file that goes: it labels explicit IDs "A4 / SCRUM-75".
They belong to SCRUM-94's follow-up, while A4 is the credentials story.

## Not blocking

- **Commit 1 bundles four changes:** H5, CI, compose and docs. `tech-stack.md` asks for one reviewable unit per commit
  and a semantic headline (`fix(api): …`, `ci: …`). Splitting is optional now; worth it for the next PR.
- **A web-only change now also runs the `sqlite` job,** because both jobs share the workflow's `paths`. That is
  acceptable, but `backend-tests.yml` is no longer an accurate name.
- **Mark the PR ready for review** once the two changes are in.

## Runs

On `D:\COMP5703_Capstone\hej-review-93` at `9d4b8ac`:

- Backend, full, SQLite: `2481 passed, 63 skipped, 209 subtests passed`. The 42 extra skips are the new
  PostgreSQL-only tests.
- Backend, full, PostgreSQL 18 (a throwaway container, since removed): `2541 passed, 3 skipped, 209 subtests passed`
  (60 min). Edited into the posted review.
- `test_explicit_id_postgres.py` on PostgreSQL: 42 passed. With the advisory lock replaced by a no-op, 33 failed.
- Web: `npm run test:web` → 78 files, 763 tests passed. `typecheck:web` is clean. `lint:web` → 0 errors, 45 warnings,
  exit 0. With the snapshot filter removed, 3 of the 4 new metrics tests fail.
- Compose: `docker compose config` with and without `--env-file`, using a dummy `.env`; no container was started.

---

## Not raised on the PR

These points are for Hanchen only.

- **Organisations and organisation policies still take `max(id) + 1`** (`admin_service.py:74, 114`). They were never
  in `_add_with_explicit_id`, so they are outside SCRUM-125. On PostgreSQL, two concurrent organisation creates can
  still collide. Organisation creation is rare and admin-only, so this needs no ticket before 28 Oct.
- **SQLite's `_next_id` is still `max(id) + 1`.** Two concurrent registrations can pick the same id, and
  `UserRepository.create` then reports the `IntegrityError` as "Email … already exists". This predates the PR,
  SQLite is the fallback, and nothing new is needed.
- **Criterion 2's "both jobs green on `main`"** can be checked once the PR merges: CI runs again since 2026-10-20.

---

## Round 2 — `7ebded6` (2026-10-23)

**Posted 2026-10-23 06:30 UTC as Approve** on `7ebded6` (review 5624734463), before the full PostgreSQL run finished;
its result is edited into the same review.

Read from GitHub first: Parth merged `main` (`2a3ddf4`) and pushed `7ebded6` on 22 Oct, then commented that both
changes are done. The PR is still a draft, so CI skipped all three jobs on `7ebded6`. The branch is level with `main`
at `69ff0c3`.

| Point | At `7ebded6` |
| --- | --- |
| 1. Compose | ✅ `POSTGRES_*` removed from `backend` and `ai-worker`. `docker compose --profile ai-worker config` with a dummy `.env` and no shell `POSTGRES_*`: no flag → postgres `""`, backend/worker `hej`; with `--env-file` → all `hej`; postgres never gets the API key. Both READMEs reworded to match |
| 2. One findings record | ✅ in substance: both planning files removed; links point at `evaluation-findings.md` §12 (anchors resolve). **Not as suggested:** instead of a line to Kanishka, Parth added §12 (115 lines) to her "Final for handover" record, bumped it to v1.1, reworded its scope sentence and footer, and updated §2/§8 (needed: the PR adds the `web` job) and §7 (rotation deadline) |

**Decided by Hanchen (23 Oct): accept the §12 version and approve.** Raised as non-blocking: §12.4's "Frontend HTTP
login smoke | Failed" row (Parth's font download failed; reads as an open defect in a handover doc), tell Kanishka
about v1.1, PR description lists only the first two commits, whichever of #89/#93 merges second updates README's
check counts, mark ready for review.

### Runs

On `D:\COMP5703_Capstone\hej-review-89` checked out at `7ebded6` (detached; the old `hej-review-93` folder is no longer
a registered worktree):
- Backend, full, SQLite: `2484 passed, 63 skipped, 209 subtests passed` (matches the README table).
- PostgreSQL 18, throwaway container `pr93-pg`: `test_explicit_id_postgres.py` + `test_database.py` +
  `test_project_exports_route.py` → 80 passed. Full suite: `2544 passed, 3 skipped, 209 subtests passed` (27 min), as §12.4 records; edited into the posted review.
- Web: 78 files, 766 passed (matches README); typecheck clean; lint 0 errors, 45 warnings.
- Evaluation `--exact`: 85/85 passed, 1 skipped, 86 unchanged.
- `git diff --check origin/main HEAD`: clean.

**Merged 2026-10-23 06:54 UTC** by hanchen9127 at Hanchen's request: marked ready for review, then merged with a merge
commit (`d14de29`), `--match-head-commit 7ebded6`. First in the merge order of 23 Oct
(#93 → #89 → #91 → #95 → #96 → #97). Still to check: the `main` CI run after the merge (criterion 2), and the
non-blocking points (§12.4's "Failed" row, Kanishka, PR description) are now follow-ups for Parth.
