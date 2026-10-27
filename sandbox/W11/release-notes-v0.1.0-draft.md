<!--
Status (2026-10-27): local draft only. No tag, no GitHub Release, no LICENSE file.
Decided by Hanchen: not published for now. The handover material waits for the client meeting on
Wednesday 28 Oct, which decides whether it goes into handover-dashboard.html.
If it is published later: tag v0.1.0 on origin/main 6b6a3fea, mark as pre-release, paste everything below this comment.
-->

# hej v0.1.0: development-stage record

**This release only records where development stood at the end of the COMP5703 capstone. It is not meant to be deployed or put into production, and nothing in it is supported as a running service.**

- Tag: `v0.1.0`, on `main` at `6b6a3fea` (merge of PR #105, 26 October 2026)
- Mark it as a pre-release on GitHub.

## What this is

hej is a platform for human evaluation and judgement of AI output. A project holds tasks, a task holds items, and each item goes through annotation, review, dispute and reconciliation until it is finalised. Finalised items are released as a versioned export with a manifest.

- **Workflow:** organisation → project → task → task item, with roles per organisation, review postures (Standard, Dual sign-off, Expert Gate), independent and sampled second review, disputes, adjudication and reconciliation.
- **Provenance:** every decision point writes a provenance event; releases carry a manifest and checksums that the app can re-verify.
- **AI first pass:** runs inline in the request, or on a separate worker (`HEJ_AI_EXECUTION_MODE`).
- **Stack:** Next.js 16 web app (`apps/hej-web`), FastAPI and SQLAlchemy API (`apps/hej-api`), SQLite for local work, PostgreSQL 18 with Docker Compose.

## State at this tag

- All 63 backlog stories are complete, and no pull request is open (100 in total, 96 merged).
- The findings record (`docs/evaluation-findings.md`) closes all 30 defects found in the first evaluation. The limitations that remain are listed in its section 6.
- 25 architecture decisions are recorded in `docs/adr/`.
- The docs were checked against the code at this commit. `docs/README.md` is the map; `docs/handover/ticket-map.md` links each story to its tickets and pull requests; `docs/archive/` holds the plan-era documents, kept as they were except one runbook.

## How it was checked

GitHub Actions could not run for the last two merges because of an account billing block, so the checks for this tag were run locally on `6b6a3fea`:

| Check | Result |
| --- | --- |
| Backend tests, SQLite | 2,495 passed, 62 skipped |
| Backend tests, PostgreSQL 18 | 2,554 passed, 3 skipped |
| Evaluation casebook coverage | 16 of 16 owed protections covered |
| Web tests | 110 files, 1,051 passed |
| Web typecheck, lint | clean; 0 lint errors |
| Web production build | succeeds |
| Fresh clone, `docker compose` build and start on PostgreSQL 18, seed, sign in, API reads | works as the READMEs describe |
| Browser walk-through: annotate, review, release, dispute, reconciliation, admin | completed |

## Running it locally

Follow the root `README.md` (local development, or Docker development) and `apps/hej-api/README.md` for the environment settings. Copy `apps/hej-api/.env.example` to `.env` first.

## Not in this release

No deployment, hosting or operations support. Work that was not built is listed in section 6 of `docs/evaluation-findings.md`.
