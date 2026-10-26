# Tech Stack

Hej is a monorepo with two applications around one shared workflow core: a Next.js web app and a
FastAPI service. The stack below is the **inherited design** from Arc Intelligence's `hej` repository
and its `docs/` — we extend it, we do not replace it. Any change to a stable surface needs written
justification agreed at review first (see `mission.md`).

Authoritative detail lives in `hej/docs/design/system/system_design.md`, `hej/docs/design/backend/backend_module_map.md`
and `hej/AGENTS.md`; `hej/docs/README.md` maps the rest. The architecture overview and the planned repository layout
moved into `hej/docs/archive/` with #105 (K1).

## Core

| Layer | Choice | Rationale |
| --- | --- | --- |
| Monorepo | **npm workspaces** (`npm@10.9.0`) + **Turborepo 2** | One repo, shared UI and config packages; top level is `apps/`, `packages/`, `infrastructure/`, `supabase/`, `docs/` |
| Runtime (web) | **Node.js ≥ 20** (team develops on 22) | Required by the Next.js toolchain |
| Web framework | **Next.js 16** App Router, Turbopack in dev | Routes mirror the `organization → project → task` scope |
| UI language | **React 19**, **TypeScript 5.9** | Typed end to end with the API client in `apps/hej-web/lib/api/` |
| Styling & components | **Tailwind CSS 4** + shadcn-style primitives in `packages/ui` (Radix UI, class-variance-authority, tailwind-merge, lucide-react, next-themes, zod) | Use existing primitives — tabs, sheet, table, badge, button, card, input, select, textarea — instead of hand-rolling controls |
| API framework | **FastAPI** on **Uvicorn**, **Python 3.14**, managed by **uv** | Modular monolith in `apps/hej-api` |
| Validation & settings | **Pydantic 2** + **pydantic-settings**, `.env` via python-dotenv | Settings use the `HEJ_` prefix (`DATABASE_URL` accepted as-is) |
| Persistence | **SQLAlchemy 2** | Repository layer in `app/repositories/db_store.py` |
| Authentication | **JWT** (PyJWT, HS256) + **bcrypt**; session restored through `/auth/me` | Authentication is a stable surface by client rule |
| Authorization | Capability policy (`GovernedAction`) resolved from current database role assignments | Roles grant capabilities; resources are checked for ownership separately. Only organisation-scoped roles are honoured today |
| AI integration | **OpenAI-compatible client** (`openai` SDK) behind a `JsonCompletionClient` protocol; per-modality analyzers for text, image, audio and video | One code path for OpenAI, Qwen (DashScope), DeepSeek, Doubao (Ark), Groq and local Ollama; `whisper-1` for audio transcription |

## Architecture

- **One core, two operating models.** The shared core is `organization → project → task → task_item`
  with review, disagreement, dispute, arbitration, canonical judgement, provenance and export.
  Marketplace, trust, billing and payout are future extensions and must not become prerequisites.
- **`TaskItem` is the atomic workflow unit.** Annotation is distinct from review, disagreement from
  dispute, and candidate annotation from canonical judgement. Do not collapse these in code.
- **Data sovereignty.** Raw client data stays external and is reached through data pointers
  (`location_ref`). In local development, uploads land in `apps/hej-api/mydata/`.
- **Backend layering today:** `app/api/routes` → `app/services` → `app/repositories` →
  `app/models` + `app/schemas`, with external boundaries in `app/integrations`. The target is
  domain-owned modules under `app/domain/`: identity, organizations, projects, tasks, data_access,
  annotation, review, disputes, arbitration, provenance, exports, integrations.
- **Frontend information architecture:**
  - Global: Dashboard, Organizations, Projects, Admin
  - Project: Overview, Tasks, Disputes, Exports, Policies
  - Task: Overview, Setup, Items, Annotate / Judge, Review, Dispute, History, Finalized — the routes
    under `apps/hej-web/app/tasks/[taskId]/`. Since #105 (K1) `AGENTS.md` and
    `hej/docs/design/product/workspace_surface_hierarchy.md` describe the pages and tabs as built
- **Workflow state authority** is `hej/docs/design/product/workflow_states.md`. Code enums currently
  differ — task items are `pending, annotated, returned, rejected, reviewed, disputed,
  expert_send_back, canonicalized` — which is a known risk (see `mission.md`).

## Data

- **PostgreSQL is the default everywhere** since SCRUM-94 (PR #24, 2026-09-20): the URL is built from
  `POSTGRES_USER`, `POSTGRES_PASSWORD` and `POSTGRES_DB` in `apps/hej-api/.env`, and with neither those
  nor a `DATABASE_URL` startup stops with an error. **SQLite** (`apps/hej-api/hej_dev.db`) is still
  supported, selected explicitly with `DATABASE_URL=sqlite:///./hej_dev.db`, which always wins. The design
  calls only for "a relational database"; production hosting is not decided. *(Updated 2026-10-14; this
  line said SQLite was the local default.)*
- **Schema management:** `Base.metadata.create_all` at startup, plus an additive `migrate_db_schema()`
  that runs only on SQLite (`core/database.py`): PostgreSQL development databases are disposable and are
  reset after a model change. There is no Alembic.
- **Seeding:** `apps/hej-api/init_data.py --reset` (re-runnable) creates demo organisations and the
  admin, reviewer and annotator accounts.
- **The dev database is shared across checkouts.** Never run `--reset` from an older commit — it
  rebuilds tables with that commit's schema.
- **Background job runner:** built for the AI first pass only (C2, SCRUM-1 and 2): `app/worker.py`
  (`python -m app.worker`) polls the job tables and claims one item at a time under a lease — Option B,
  confirmed at review of PR #20. `HEJ_AI_EXECUTION_MODE` selects `inline` (default) or `worker`. Export
  generation and disagreement scans do not use it. *(Updated 2026-10-14; this line said it was not
  implemented.)*

## Testing

- **Backend: pytest**, unittest-style classes allowed. Authorization and ownership tests use a **real
  database** with real users and roles rather than mocks: the shared `empty_engine` fixture in
  `tests/conftest.py` takes the engine from `DATABASE_URL` — in-memory SQLite by default, or a random,
  per-test schema on PostgreSQL. Add a
  route-level `TestClient` test when behaviour depends on routing.
- **Web: Vitest 3** with **jsdom** and **Testing Library** (react, jest-dom, user-event).
- **Static checks:** `tsc --noEmit`; **ESLint 9** via `@workspace/eslint-config`; **Prettier** with the
  Tailwind plugin.
- **One command before every PR** is `npm run check`, which runs `test:api`, `test:web`,
  `typecheck:web` and `lint:web`.
- **CI** (`.github/workflows/backend-tests.yml`, SCRUM-94) runs the backend suite on SQLite and on a
  PostgreSQL 18 service, plus the casebook coverage listing, on every push and pull request. **The web
  checks are not in CI**: `test:web`, `typecheck:web` and `lint:web` run only when a member runs
  `npm run check` locally. SCRUM-125 (W10) adds a web job.
- **Evaluation harness** (I1, I2) is built in `apps/hej-api/evaluation/` (SCRUM-68, 69, 70 and 71):
  scenario-level runs over the casebook (`cases/`), gold fixtures (`gold/`), a stored `baseline.json`
  for comparing runs, and reports; run with `uv run python -m evaluation`. On 2026-10-14 the casebook
  holds 60 cases, 52 of them running. *(Updated 2026-10-14; this line said the harness was planned.)*

## Tooling

- `uv run` for Python, `npm` for JavaScript, `turbo` for workspace tasks
- Claude Code project skills in `.claude/skills/`: `tracking-sync` refreshes `shared/story_src.csv`, and
  `feature-spec` writes and closes out feature specs
- Local servers: `npm run dev:api` (port 8000) and `npm run dev:web` (port 3000)
- Git hosting: GitHub `USYD-CS-Capstone/hej`; work tracking on the Jira board (project `SCRUM`) and in
  the CS-57 Contribution Tracker (Google Sheet)

## Quality Baseline

### Definition of Done

From the backlog:

- Demonstrable **in the running app**, not just the API
- New workflow logic ships **with tests in the same change**
- Any listed defect has a test that **fails against the old behaviour** — verify by reverting the fix
- Docs for changed states or contracts updated **in the same change**
- Reviewed by someone **other than the author**

### Testing discipline

- Separate the tests that prove the fix (red before, green after) from the guards that stop it going
  too far (green both ways), and say which is which.
- For multi-user behaviour, keep a manual walkthrough in the week's `tests/` folder under
  `docs/sandbox/`, for example `W6/tests/manual-test-SCRUM-25.md`:
  - use two different browsers;
  - include a **reload** step and a **look-before-acting** step;
  - use only state the script creates, not spent fixtures.

### Commits

- **One coherent, reviewable unit per commit.** Split unrelated changes, even inside one story.
- **Headline:** semantic type with optional scope and the story or ticket, for example
  `fix(api): enforce draft ownership on draft write paths (SCRUM-25)`.
- **Body:** a few short paragraphs, first what was wrong, then what changed, ending with the issue or
  story reference.
- **No AI attribution trailers** — the team's history carries none.

### Branches and pull requests

- **Branch naming:** personal branches `CS57-<Name>`, with an optional topic suffix such as
  `CS57-Hanchen-ai-integration`.
- **Pull requests** go into `main`. There is no `develop` branch, despite `dev-workflow.md`.
- **PR title** (decided 2026-10-23): `type(scope): description (stories, tickets)`, following Conventional
  Commits. For example, `feat(api): refuse a release that fails its pre-release checks (H3, SCRUM-105)`.
  - **type:** `feat`, `fix`, `docs`, `test`, `refactor` or `perf` (`chore` and `ci` where apt). Never a
    compound such as `feat/fix`.
  - **scope:** the code areas changed:
    - `api`: `apps/hej-api` code and tests;
    - `web`: `apps/hej-web` and `packages/`;
    - `evaluation`: the harness, its cases and its tests;
    - `seed`: `init_data.py`, the seed scripts and their tests;
    - `db`: PostgreSQL support and Compose;
    - `ci`: `.github/`;
    - `docs`: docs only.

    Several areas are comma-separated with no space (`api,web`). An area counts when it holds a real share of
    the change, about 15% of the changed lines or more. A docs-only PR is `docs:` with no scope. No `(API)` /
    `(WEB)` suffix: the scope says it.
  - **description:** lower case, saying what the PR does. No Jira prefix such as "Review:".
  - **refs:** every story the PR implements, then every ticket, in the closing parentheses.
  - A merge commit keeps the title the PR had when it merged, so set the title before merging. The 83 merged
    PRs were renamed to this format on 2026-10-23 (`../sandbox/W11/pr-titles/pr-title-unification.md`); their
    merge commits keep the old titles.
- **Syncing:** merge `main` into your branch; do not rebase shared branches.
- **Testing older code:** never use `reset --hard` over unpushed commits. Use
  `git switch --detach <commit>` or a worktree instead.
- **PR description:**
  - summary with story and issue
  - changes by layer
  - decisions for review
  - testing, including what was run manually
  - notes for reviewers
  - known limitations
- **Merging:** PRs are merged with a merge commit, never squashed (decided 2026-09-14). Branches are
  merged into one another, so squashing would duplicate that history and discard the reviewable
  commits described above.
- **Reviews** happen on the GitHub PR, which is the shared record. Detailed reviews are also kept in
  `docs/reviews/`, which is local and not in git.

### Docs Sync

The table lives in `hej/AGENTS.md` (Docs Sync) and is no longer copied here, because the planning documents it
named moved to `hej/docs/archive/` with #105 (K1). In outline:

| If you change | Update |
| --- | --- |
| Domain ownership | `backend_module_map.md`, `repo_module_blueprint.md` |
| API resources, routes or boundaries | `api_surfaces.md`; `integration_contract.md` when DS-facing |
| Workflow states or transitions | `workflow_states.md`, `task-lifecycle.md`, and the evaluation casebook where a case exercises them |
| Data model or persistence | `domain_model.md`, `domain_model_relations.md`, `db_schema_strategy.md`, `db_schema_blueprint.md` |

Two rules came with #105: an architecture decision gets an ADR, and a change that adds, moves or retires a doc
updates `hej/docs/README.md`.

## Repository & Documentation Map

**`hej/` — the product repository (git, shared with the client):**

| Path | Role |
| --- | --- |
| `AGENTS.md` | Stack, core rules, Docs Sync, commit rules for agents and people |
| `README.md`, `apps/hej-api/README.md`, `apps/hej-web/README.md` | One README per app: the root one gives the overview, the pages, the quick start and the checks (since #105, K1) |
| `docs/README.md` | The map of the docs; a change that adds, moves or retires a doc updates it (since #105, K1) |
| `docs/handover/` | `ticket-map.md`: each Jira ticket, its story and its pull request |
| `docs/adr/` | The 25 architecture decision records, one decision each |
| `docs/evaluation-findings.md` | The findings record of I2–I5, with the negative results and the defect register |
| `docs/design/` | `system/` system design, `product/` workflows and states, `backend/` API surfaces, module map, AI integration and the integration contract, `database/` domain model and schema |
| `docs/terminology/` | Canonical vocabulary: the governance model, the task lifecycle, task schema and policy |
| `docs/archive/` | The client's March brief (`governance/`, `team-discipline/`), the plan-era `implementation/` planning and PR specifications, `design/processes/`, the architecture overview and `design/ds/`, kept unchanged since #105 (K1); its README says where each subject lives now |

**`COMP5703_Capstone/docs/` — the team's working area: Hanchen's own git repository (`hanchen9127/COMP5703_MyRepo`, since 2026-10-14), separate from the product repo `hej`; `.env` is ignored:**

| Path | Role |
| --- | --- |
| `specs/` | This constitution (`mission.md`, `tech-stack.md`, `roadmap.md`) and dated feature specs `YYYY-MM-DD-<story-id>-<slug>/` with `plan.md`, `requirements.md`, `validation.md` — the big picture for each story, written with the `feature-spec` skill |
| `info/` | Reference material that rarely changes: the client brief (`ProjectDescription.pdf`), the defect register (`issues.md`, 30 defects) and its fix plan (`fix-plan.md`), the client Q&A (`client-question.md`, with the client's own Round 1 and 2 answers exported in `client-qa.md`), and the course's progress submissions (`CS57_Group_Progress.pdf`, `CS57_Status_Checking_1.pdf`, `CS57_Status_Checking_2.pdf`). The story backlog itself lives in `shared/story_src.csv`; the page's **Export** can produce a Markdown copy on demand |
| `shared/` | Whole-team tracking. `CS-57_Contribution_Tracker.xlsx` and `Jira.csv` are snapshots of the team's online Google Sheet and the Jira board, fetched by `tracking-sync download` or downloaded by hand, and possibly behind the live versions. `Jira.csv` is never edited, only replaced whole by a fresh export; `tracking-sync` refreshes the tracker's snapshot tabs and may append log rows, which Hanchen copies back into the online sheet (see *Tracking data*). `story_src.csv` is the backlog data behind `handover-dashboard.html`, the client view (`user-stories.html` until 2026-10-26, now a redirect to it): only Hanchen manages it, locally, and it is updated after the snapshots, so it lags them. It is the one file updated here. `README.md` explains the page and the CSV format |
| `sandbox/` | Hanchen's personal files supporting work on his own branches — never pushed to the team's `hej` repository. Development plans, manual tests, local data scripts, commit drafts and learning notes, organised by week. See [Personal sandbox](#personal-sandbox-docssandbox) |
| `reviews/` | Code reviews of team PRs (`review-<branch>-<topic>.md`), checked against the story and verified in the running code, and prepared PR descriptions (`pr-<branch>-<topic>.md`). `reviews/plans/` keeps the early plans and commit drafts that lived in `docs/plans/` until 2026-10-14 |

### Personal sandbox: `docs/sandbox/`

Supporting material for Hanchen's own branches (`CS57-Hanchen…`): planning, testing, learning and
other working files. It is not part of the product, not a tracking record, and never goes to GitHub.

```text
sandbox/
  README.md             layout and conventions
  tools/                scripts reused every week (seed and reset local test data)
  learning/             orientation and study notes that outlive a single week
  W6/, W7/, …           one folder per week, holding only that week's material
    README.md           week index: tickets, status, what each file is for
    plans/              plan-<ticket>.md (how to implement it, commit by commit), progress-<ticket>.md
    tests/              manual-test-<ticket>.md walkthroughs
    scripts/            ticket-specific helpers, e.g. sandbox-<ticket>.py
    commits/            commits-<ticket>.md index and commit-<ticket>-<n>-<slug>.txt drafts
```

**Conventions**
- **Naming:** a ticket-specific file is named `<type>-<ticket>`, for example `plan-SCRUM-25-26-28.md`,
  `manual-test-SCRUM-25.md`. Files in `tools/` and `learning/` keep descriptive names.
- **Where a file goes:** anything used across weeks lives in `tools/` or `learning/`. A plan that
  continues into the next week stays in the week it was written, and the next week's `README.md`
  links back to it — never copy it.
- **Specs versus sandbox:** the story's feature spec in `docs/specs/` states the big picture; a sandbox
  plan describes how Hanchen implements one ticket that week. Each links to the other instead of
  restating it.
- **Create a week's subfolders only when needed.**
- **Scripts must not depend on their folder depth.** Locate the `hej` repo by searching upward
  (see `tools/reset_work_data.py`), and write run instructions with paths that survive a move.
- **No secrets and no database copies in `sandbox/`.** The dev database stays in
  `hej/apps/hej-api/`; scripts that change it back it up first.

### Tracking data: `shared/story_src.csv`

`story_src.csv` is Hanchen's local, client-facing view of the backlog, not a team record. The live
records are the online tracker and the Jira board; `shared/` holds downloaded snapshots of them,
and `story_src.csv` is updated from those snapshots later still. When current status matters, read the
board and the tracker.

**Format**
- One row per story, 14 columns: `id, epic, priority, owner, name, story, acceptance_criteria,
  related_issues, subtasks, defects, status, allocated_to, scrum, source`. Keep the header unchanged.
- `status` is blank (not started), `working`, `done` or `dropped`.
- `allocated_to` takes one name or several separated by commas, using the tracker's roster names —
  Tim Chung, whom records before 2026-09-16 call `Tok Tin Chung` (the skill's alias maps it).
- `scrum` is generated from the board; `source` is `shipped` for the original 59 stories.
- Preserve the byte format when writing: UTF-8 with BOM, CRLF between rows, LF inside multi-line
  cells, minimal quoting. Python's `csv` writer with `QUOTE_MINIMAL` and `lineterminator='\r\n'`
  reproduces the file byte for byte.

**Update rules** (agreed 2026-09-13; applied by the `tracking-sync` skill in
`.claude/skills/tracking-sync/`)
- **Board source:** always `Jira.csv` (decided 2026-09-16). The tracker's *Jira Statistics* tab is a
  snapshot of it that the skill refreshes, so the tracker's download date says nothing about which is newer.
- **Pending rows** (the tracker's own convention, recorded 2026-09-18). A Contribution Log row is written
  when a pull request is **opened**, not when it merges. Until a reviewer passes it, *Review OK?* is
  blank: the row records a PR awaiting review, and that PR is not merged. So the log's first column on a
  pending row is the date it was logged. That column was headed *Date merged* until the online sheet
  renamed it *Date* (seen 2026-09-21); the scripts accept either heading. A pending row is not a discrepancy — the report lists it as awaiting
  review. *Review OK?* takes four values: blank (pending), `IN-PROCESS` (also pending: the review is under
  way; first seen in the online sheet on 2026-09-30, and counted as pending by Hanchen's decision the same
  day), `OK` (reviewed and passed) and `SELF-REVIEW` (reviewed by its own author, which the Definition of
  Done does not accept).
- **`done`** when the tracker's latest entry for the story says *Story complete? = Yes* **and its
  *Review OK?* is `OK`**, or every ticket for the story is Done on the board. A *Yes* on a pending row
  means the work is in review, not finished; a *Yes* on a `SELF-REVIEW` row fails the Definition of
  Done's review by someone other than the author. Either counts as `working`. Gaps found by checking
  the code are reported, not written into the CSV.
- **`working`** when a story ticket is In Progress or In Review, the tracker's latest entry says
  *No — more work to come*, or its latest *Yes* is pending or self-reviewed.
- **Checking rows against git.** Only a reviewed row makes a claim git can contradict: an `OK` row whose
  PR is not merged into `origin/main` is flagged. So is the reverse — a pending row whose PR git shows
  already merged, meaning the review happened, or was skipped, without the row being updated.
- **Not started** (blank) when every ticket is To Do and nothing is logged, even if the CSV said
  `working`.
- **Never downgraded automatically:** `done` and `dropped`. Change these by hand after agreement.
  **Hand change, 2026-10-01** (approved by Hanchen): G2 `done` → `working` — SCRUM-118 was split from
  SCRUM-107 for G2's enforcement (R2-7, R2-8), so G2 has open work again. No tracker row marks G2
  complete, so no rule flips it back; it becomes `done` by the board rule once SCRUM-50, 107 and 118
  are all Done.
- **`allocated_to`**, using tracker roster names (aliases in the skill's `scripts/aliases.json`):
  - in progress — board assignees plus anyone who delivered a logged PR; keep the existing value if
    both are empty;
  - completed — the allocation already recorded, plus anyone who delivered;
  - not started — the allocation already recorded, plus any board assignee.

  **Hand change, 2026-10-05** (approved by Hanchen), to bring allocations in line with the board's
  assignees after the W9 assignments. The rules above only add names, so names whose tickets moved on
  stay, and a completed story never takes the assignee of a verification ticket. Removed the people who
  hold no ticket for the story and delivered none of it: D9 (Hanchen — SCRUM-110 moved to Jingwei on
  2026-09-30), E5 (Jingwei — SCRUM-107 is unassigned), F1 (Yi — SCRUM-39/62 were replaced by SCRUM-98,
  now Hanchen's), F5 (Yi — SCRUM-106 is unassigned). Added the assignees of the W9 verification tickets
  on completed stories: B1 (Tim, SCRUM-91), B3 (Yi, SCRUM-85). Kept, although they hold no ticket: A3
  and C1 (Michael), who delivered logged PRs. Not added: Parth to G1 — SCRUM-52's G1 part was already
  complete, and his open work on it is D8 and E3.

  **Hand change, 2026-10-07** (approved by Hanchen), by the same reasoning: F1 `Hanchen Wang, Parth` → `Parth`.
  The board moved SCRUM-98 from Hanchen to Parth that day, and Hanchen holds no F1 ticket and delivered none of
  it. Only that cell changed, checked against a copy taken first.
- **`scrum`** (decided 2026-09-16): add a board ticket when its `Jira.csv` description links the story —
  "Related to user story X" or "Story \*X\*". Additions only: a ticket is never removed automatically,
  because the CSV also carries links the board descriptions do not state (SCRUM-81, 82 and 84 for A2–A4,
  for example). Subtasks are not listed; they inherit their parent's stories. Status and allocation are
  worked out from the extended list. A board ticket that maps to no story is reported.
- **Read-only:** never edit `Jira.csv`. It is only ever replaced whole by a fresh board export — by
  hand, or by `download`, which produces the same file.
- **Downloading the snapshots** (decided 2026-09-18). `tracking-sync download` fetches both snapshots
  before a report, so they no longer depend on a manual download:
  - **"Update `Jira.csv`" means running `download`** (recorded 2026-10-23). It fetches the board through the
    links and credentials in `docs/specs/.env`; Hanchen does not export by hand unless `download` fails.
  - **Credentials** live in `docs/specs/.env` (moved from `docs/.env` on 2026-10-22; `download` still reads
    `docs/.env` when the first is missing) — `JIRA_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `TRACKER_URL`, and
    also `CLIENT_QA_URL` and `CS57_Group_Slides` (Google Docs links) —
    outside every git repository. They are never printed, never copied into `hej/`, and the Jira token
    should carry read-only scopes, so a mistake cannot change the board.
  - **Download only.** The file's first line says so: those links may only be downloaded from, and their
    content is never changed online (the Jira board, the Google Sheet, the Google Slides).
  - **Jira** comes from the same all-fields CSV export the board's *Export* button produces, ordered by
    `created DESC` with a byte-order mark added, which makes it byte-identical to a manual download
    (verified 2026-09-18).
  - **The tracker** comes from the sheet's xlsx export. The sheet is viewable by link, so no Google
    credential is needed, and the link itself is therefore a secret.
  - **All or nothing.** Both files are fetched and checked first — the Jira header must match, the
    workbook must hold its six tabs — and only then replace the copies in `shared/`. The replaced copies
    are kept in a temporary folder whose path is printed.
  - **Read-only against the live records.** `download` never writes to the board or the sheet. Copying
    `apply`'s tracker changes back to the online sheet stays manual.
- **Writing the tracker** (decided 2026-09-16). `apply` may write the downloaded
  `CS-57_Contribution_Tracker.xlsx`, and only these parts:
  - *Jira Statistics* — the snapshot cells regenerated from `Jira.csv`: the headline counts, workload by
    person, waiting and dropped stories, and every row of *Every issue on the board*. A story is waiting for a
    ticket when it has none and is neither `dropped` nor `done` in `story_src.csv` (decided 2026-10-26). The
    nine Owner cells and every formula are left alone. The *IN SPRINT* figure and each person's in-sprint
    count match a sprint whose name **begins with** the week token: the board renames sprints as it goes —
    `W7` became `W7 Lock down review data` — and an exact match silently counts zero (decided 2026-09-18).
    The week token `Break` matches the board's `Mid-semester Break` sprint (decided 2026-09-19);
  - *Lists* — each story's tickets (column P, the same as `story_src.csv`'s `scrum`), its board status
    (column Y: `Dropped`; with no ticket, `Done` when `story_src.csv` marks the story `done` and otherwise
    `Not on board` — decided 2026-10-26, because a story such as K2 or K3 is finished with no board work;
    `Done` when every ticket is Done; `In progress` when any ticket has left To Do; otherwise `To Do`), and
    the ticket list behind the log's dropdown (column Z);
  - *Contribution Log* — an existing row is never changed, reordered or deleted, and `apply` checks every
    one is byte-for-byte identical afterwards. With `--git`, it appends a row for each PR merged into
    `origin/main` that no row logs, filling only what git proves — date merged, member (the PR head
    commit's author, left blank when not on the roster), PR number and link — for the member to
    complete. The ticket dropdown covers `Lists!$Z$2:$Z$200`. **Hand change, 2026-09-27** (approved by
    Hanchen, not by `apply`): every blank *What changed* was filled in (rows 7, 18, 28–30, 32, 34–37), and
    *Story complete?* was set so that `Yes` sits only on the merged PR that completed its story — earlier
    rows of that story and rows of unmerged PRs say `No`. D2 (SCRUM-109 open) and C5 (completed by PR #37,
    unmerged) went from `Yes` to `No`; G1 stays `Yes`. Rows 6 and 10 had placeholder *What changed*
    text ("With SCRUM-7; ...") — rewritten, with the extra ticket moved to *Notes*. Row 28 (PR #28) named
    SCRUM-20 and no story — corrected to SCRUM-90 and J3. `story_src.csv`'s C5 and D2 went `done` →
    `working` by hand the same day, and D5 on 2026-09-27 (SCRUM-116: a reject could reopen a finalised
    item). No other cell changed. **Second hand change, 2026-09-30** (approved by Hanchen): every empty cell was
    filled except *Reviewed by*, *Review OK?* (blank means pending, so it stays blank) and *Notes / evidence* —
    28 cells in rows 2, 17, 29–32, 35, 36, 38, 40 and 41. Not-story rows (2, 17, 31) got `-` for ticket, epic,
    priority and defects; story rows with no listed defect got `-` in *Defects closed*; row 36 (PR #36,
    SCRUM-112) its work type, area, story B8 and its title, epic and priority; rows 38, 40 and 41 (PR #39, #43,
    #44) their *What changed* and *Story complete? = No*; row 41 its PR number and link. Only empty cells were
    written, as inline strings, and every other cell and workbook part was checked byte-for-byte unchanged
    against a copy taken first. **Third hand change, 2026-09-30** (approved by Hanchen): the stories added on
    2026-09-24 — B7, B8, D9 — were never in *Lists*' story table (rows 2–61), so the log's *Story ID* dropdown
    marked B8 invalid and its title/epic/priority lookups found nothing. *Lists* rows 62–64 now hold them (story
    ID, epic, priority, role, title, tickets, work bundle, board status; the work bundle is a judgement call),
    and in the *Contribution Log* the dropdown (`Lists!$K$2:$K$64`) and all 1,772 lookup ranges
    (`Lists!$K$2:$O$64`) end at row 64; row 36's title, epic and priority, typed as text earlier that day, are
    the lookup formula again. **Not changed, by choice** (on 2026-09-30): *Jira Statistics*, *Dashboard* and
    *Client Report* counted stories over `Lists!…$3:…$61`, so they left out B7, B8 and D9. They were extended in
    the online sheet, not here: the workbook downloaded before 2026-10-25 already ended every such range at
    `$65` (179 in *Jira Statistics*, 11 in *Dashboard*, 18 in *Client Report*), so B7, B8, D9 and A6 are counted
    (found on 2026-10-25, see the seventh hand change). Checked against a copy taken first: only those cells and
    rows changed. **Fourth hand change, 2026-10-04** (approved by Hanchen): A6, added to `story_src.csv` the same
    day, is *Lists* row 65 (story ID, epic, priority, role, title, ticket SCRUM-119, work bundle *Annotation page
    & judgement*, board status), as inline strings before the existing Z65; the log's story dropdown and all 1,775
    lookup ranges now end at row 65. *Jira Statistics*, *Dashboard* and *Client Report* again unchanged, by the
    same choice. Checked against a copy taken first: only *Lists* row 65 and those range ends changed. **Fifth hand
    change, 2026-10-22** (asked for by Hanchen): 48 empty Log cells in rows 69, 70, 73, 75, 77, 80–84 and 86–91 were
    filled, as inline strings in the styles of row 85. *Defects closed* got `-` where the PR closes no listed defect;
    #83's issues 19 and 27 were already logged by PR #26. Rows 86–91 (PRs #89–#94) got their missing ticket, link, work
    type, area, story, *What changed* and *Story complete?*. That is `No` for each one: four are unmerged, and #90 and
    #94 follow stories (H2, D3) that earlier PRs completed. As before, *Reviewed by*, *Notes / evidence* and the
    formula columns (*Week*, *Review OK?*, title, epic, priority) were left alone. Checked against a copy taken first:
    only those cells changed. **Sixth hand change, 2026-10-25** (asked for by Hanchen): rows 92–99 (PRs #95–#102) had
    only their date, week and PR number, or nothing, so each got its member, reviewer, ticket, link, work type,
    area, story, *Defects closed* (`-`), *What changed* and *Story complete?* from GitHub: author and reviews of the
    PR, its title, changed files and merge date. Rows 95–97 got the merge date; rows 98 and 99 (#101, #102, open
    drafts) the date they were opened. Row 100 was added for #103 (SCRUM-135, K1, an open draft) the same way. Every
    row from 2 to 100 was then checked so that columns A–Q hold no empty cell: *Reviewed by* was filled in rows 86,
    88 and 90 (#89, #91, #93, merged and reviewed) and, for the open drafts in rows 98–100, with the reviewer GitHub
    lists as requested (Yi Geng); row 90 got the title, epic and priority lookup formulas it lacked. *Story complete?*
    was recomputed for every row by one rule: `Yes` only on the last merged PR of a story that is complete in
    `story_src.csv`; every other row of that story, every row of an unfinished story and every unmerged PR says `No`,
    and a row with no story says `N/A`. That moved 26 existing rows (`Yes` off the earlier PRs of a story, onto the
    last one) and replaces the 'every merged PR of a finished story' reading used for rows 92–96 earlier that
    day. The cached values of the *Week*, *Review OK?*, title, epic and priority formula cells in the rows filled
    were set to what the formulas give, so a reader without a calculation engine sees them. *Notes* got one entry
    (row 94, co-reviewer). In *Lists*, K2 and K4 (no ticket) read `Done` in column Y, because Hanchen marked them complete on
    2026-10-25; `apply` would write `Not on board` again for a story with no ticket. Checked against copies taken
    first: only those cells changed. **Seventh hand change, 2026-10-25** (asked for by Hanchen): the sheets other
    than the Log were audited against `Jira.csv` (the board export of 2026-10-25 00:36, so slightly older than the
    latest board edits), `story_src.csv`, Log rows 2–100 and git. Eight static cells changed, as inline strings: in
    *Lists* the story titles (column O) of C4, D3, D8, F2 and D9 and the role (N) of D3, copied from `story_src.csv`,
    which was edited after the table was filled; in *Jira Statistics*, B3 `59 committed backlog stories` → `63`;
    in *Start Here*, the example row's reviewer (E38) `Tok Tin Chung` → `Tim Chung`, the roster name. No range
    needed extending: every `Lists!` range outside the Log already ended at row 65, and no Log range ends before
    row 100 (they end at 599, or 596 for *Jira Statistics*' ticket counts). *Jira Statistics* and *Lists* P and Z
    already matched what `apply` would write. Left alone on purpose: every formula and its cached value (so the
    cached Dashboard and Client Report numbers are stale until the workbook is recalculated on open), the Owner
    cells, the Log, *Lists* Y of A5 (`In progress`, because SCRUM-134 is In Progress in the export, though A5 is
    done in the CSV) and K3, and the wording and layout questions listed in Hanchen's report. Checked against a
    copy taken first: only those cells changed, and the Log part is byte-identical. **Eighth hand change,
    2026-10-26** (asked for by Hanchen): the tracker downloaded that day had K2 back at `Not on board` in *Lists*
    column Y, so *Jira Statistics* read P1 21 of 23 done and all stories 61 of 63. Hanchen marked K3 complete,
    and `story_src.csv`'s K3 `status` went `working` → `done` by hand, the only cell changed (`done` is never set
    automatically for a story with no ticket). The *Lists* rule then changed (see above): a story with no ticket
    reads `Done` when `story_src.csv` marks it `done`, and is no longer waiting for a ticket. `apply` wrote *Lists*
    Y59 (K2) and Y60 (K3) `Not on board` → `Done`, and *Jira Statistics* B36 `2` → `None` and C36 `Committed
    stories with nothing on the board: K2 K3` → `Every committed story that is not dropped or done has at least
    one ticket on the board.` By hand, as inline strings in the cells' own styles, in *Jira Statistics*: H21
    `... A story with no ticket cannot be done.` → `Done counts what the board says is done. A story with no
    ticket counts as done only when the story records mark it complete.`, and B3's `docs/Jira.csv` →
    `docs/shared/Jira.csv`. The cached values of the nine formula cells that read the two changed *Lists* cells
    were set to what the formulas give, formulas unchanged: G19 2 → 0 and I19 18 → 20 (*Unallocated*, the
    bundle of K2 and K3), D24 and F24 21 → 23, G24 0.913 → 1, D26 and F26 61 → 63, G26 0.968 → 1, and K33 (epic
    K) 2 → 4. Every other formula on the tab was evaluated and its cache already matched. Checked against a copy
    taken first: only those cells changed, and the Log part is byte-identical. **Ninth hand change, 2026-10-26**
    (asked for by Hanchen): before submission, the PR and story counts on *Dashboard* and *Client Report* were made to
    say what they count, the first hand change to those two tabs (`apply` still never writes them). They counted Log
    rows, one per story a PR touched (#9 and #53 have two, #17 and #48 three), #1 (closed, not merged) included, so
    PRS MERGED read 100 for 93 merged PRs. Formulas, each cached value set to what it gives: *Dashboard* B6
    `COUNTA('Contribution Log'!$C$2:$C$599)` 100 → `ROUND(SUMPRODUCT((E="OK")/(COUNTIFS(G,G,E,"OK")+(E<>"OK"))),0)`
    over the Log's `$E$2:$E$599` and `$G$2:$G$599`, the distinct PR numbers on rows reviewed by a second person, 93;
    *Client Report* C9 `COUNTIFS` of the rows dated in the period 100 → the same distinct count, bounded by the period
    (`$C$5`–`$C$6`), 93. Every PR the Log shows reviewed by a second person is merged; GitHub's other two merged PRs,
    #3 and #15, merged into another PR's branch and reached main through it. *Dashboard* H6 (STORIES COMPLETE) counted
    stories with a `Yes - story complete` row, 59 → `COUNTIF(Lists!$Y$3:$Y$65,"Done")`, 63, the basis of *Jira
    Statistics*; A1 and A4 have no Log row of their own and K2 and K3 needed no PR. Labels, as inline strings in the
    cells' own styles: *Dashboard* B3 `Everything here is calculated from the Contribution Log. Nothing on this tab
    needs to be typed.` → `Everything here is calculated from the Contribution Log, except STORIES COMPLETE, which
    counts the stories Lists marks Done, as Jira Statistics does. Nothing on this tab needs to be typed.`, C10 `PRs
    merged` → `PR rows logged`, D10 `PRs reviewed` → `PR rows reviewed`, K10 `Share of PRs` → `Share of PR rows`, B22
    `PRs merged per week` → `PR rows logged per week`, C39 and F39 `PRs` → `PR rows`, H40 `PRs with a named reviewer`
    → `PR rows with a second reviewer`, H41 `PRs reviewed by their own author` → `PR rows reviewed by their own
    author`; *Client Report* F9 and C19 `PRs` → `PR rows`, D19 `Reviews given` → `PR rows reviewed`, B11 `Stories
    completed` → `Stories completed by a logged PR` (C11 stays bounded by the Log's dates, 59), B12 `Defect-fix PRs` →
    `Defect-fix PR rows`, B13 `Feature PRs` → `Feature PR rows`, B14 `PRs reviewed by a second person` → `PR rows with
    a second reviewer`. Notes in empty cells, in the style of the existing notes: *Dashboard* B7 `PRS MERGED counts
    distinct PRs in the Log reviewed by a second person, all of them merged. GitHub shows 95 merged: #3 and #15 merged
    into another PR's branch and reached main through it, so they have no row of their own.`, B8 `A PR row is one Log
    row: a PR that touched several stories has a row per story, and #1 (closed, not merged) has one.`, B21 `Stories
    completed counts only stories whose completing PR is logged against them, so TOTAL is below STORIES COMPLETE: A1
    and A4 have no Log row of their own, and K2 and K3 needed no PR.`; *Client Report* B28 and B29, the same two notes
    for the period, B29 adding that *Stories completed* and *Stories done* count only stories whose completing PR is
    logged in the period. Left alone: the per-member *Stories completed* formulas, *Members who merged*, and the row
    counts behind the relabelled figures. In the *Contribution Log*, as Hanchen approved: Q98 `... instead of Jira
    tickets (in progress).` → `The web app's code and comments now name stories and pull requests instead of Jira
    tickets.`; Q99 `A second status for an expert's Return is removed: ... (in progress).` → `The old item-level
    escalation flow, left from before two-level disputes, is removed with every status it used; an expert's Return and
    a reviewer's return now both show as Returned.`; Q100 its ` (in progress)` removed; Q101 `A reopen's history entry
    loses its reason ...` → `A reopened item's History entry now shows its reason, who sent it back and the answers it
    replaced, to every reader allowed to see them.`; O47 (PR #50, D9) `Yes - story complete` → `No - more work to
    come`, because D9's last merged PR is now #104 (row 101). *Story complete?* was then recomputed for every row by
    the sixth hand change's rule and no other row disagrees. That moved *Dashboard* H13's cache (Jingwei Lin's
    *Stories completed*) 17 → 16. In workbook.xml `<calcPr/>` → `<calcPr fullCalcOnLoad="1"/>`. *Jira Statistics* I156
    (`D9`) and J156 (`description`), typed online for SCRUM-139, were left alone: the board's description reads `Story
    D9.`, which the rule does not match, so `report` proposes `D9` → `-` until the description reads `Story *D9*`.
    Checked against a copy taken first: only those cells and workbook.xml changed, the Log part only in its five
    cells, and every formula on *Dashboard* (252) and *Client Report* (65) evaluates to its cached value;
  - the workbook's *Jira Statistics* filter range, and recalculation on open.

  *Start Here*, *Dashboard* and *Client Report* are never written. Text goes in as inline strings, so the
  shared-string table is untouched.
- **Week calendar** (decided 2026-09-19). The tracker's weeks follow the board and `roadmap.md`: the
  mid-semester break is its own week, `Break`, between W8 and W9, and W12 ends on 1 Nov with the
  project. **Since 2026-09-19 weeks run Thursday to Wednesday**, closing after the Wednesday client
  meeting: W7 is 14–23 Sep, `Break` is 1–7 Oct and W12 is 29 Oct–1 Nov; weeks before W7 keep their
  Monday–Sunday dates. The week table in *Lists* (columns T–V) is the only source of week labels:
  the Contribution Log's *Week* column looks the date up in it, and the Dashboard's per-week rows count
  its labels. This was a one-time change, made by hand with Hanchen's approval rather than by `apply`:
  the week table was relabelled, every *Week* formula in the Log was rewritten to the lookup, and the
  Dashboard's per-week rows were relabelled. The *Week* value of every existing row was checked to be
  unchanged. **Second hand change, 2026-09-19** (approved by Hanchen): the week table's dates were moved to
  Thursday–Wednesday from W7 on, and its headers became *Starts* / *Ends*. Only the *Lists* part changed,
  and none of the 21 logged rows changed week. **Third hand change, 2026-09-21** (approved by Hanchen): *Story complete?* on six Log rows — PRs #19, #22,
  #23, #24, #25 and #27 — set to `No - more work to come`, because their stories (D5, C2, B2, C1) were not
  finished; #22's was blank. Each cell was copied from an existing `No` cell so the text matches the dropdown;
  only those six cells changed. D5 and C1 still became `done` by the board rule (every ticket Done), which
  Hanchen accepted.
- **The online tracker stays the record.** After `apply` writes the tracker, Hanchen copies the refreshed
  *Jira Statistics* and *Lists* tabs, and any appended log rows, into the online sheet before anyone logs
  new work; otherwise the next download overwrites them.
- **Who changes `story_src.csv`** (decided 2026-09-14): `status`, `allocated_to` and `scrum` change only
  through the skill's `apply` step. Every other column — story text, acceptance criteria, related
  issues, subtasks, defects, and new stories — is edited by Claude directly in `story_src.csv`, on
  Hanchen's decision and never by hand (changed 2026-09-22; it was Hanchen, in `user-stories.html`). The
  page reads the CSV at runtime, so it needs no edit; its `SEED` is the original text and stays unchanged.
  Writes use the same format as `apply` (UTF-8 with BOM, CRLF, minimal quoting). `apply` refuses if the file
  changed after its report, so finish story edits before running a report.

## What We Are Not Using

- No Alembic or other migration framework — additive SQLite migration only
- No message broker or worker yet — decided in C2
- No CI workflow, PR template, CODEOWNERS or branch protection in `hej`
- Supabase, Terraform and Kubernetes folders are placeholders, unused
- No Label Studio, no model training or fine-tuning
- No project-scoped roles in practice — `RoleScope.PROJECT` exists but is never read
