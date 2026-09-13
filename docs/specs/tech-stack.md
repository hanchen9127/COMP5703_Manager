# Tech Stack

Hej is a monorepo with two applications around one shared workflow core: a Next.js web app and a
FastAPI service. The stack below is the **inherited design** from Arc Intelligence's `hej` repository
and its `docs/` — we extend it, we do not replace it. Any change to a stable surface needs written
justification agreed at review first (see `mission.md`).

Authoritative detail lives in `hej/docs/design/system/architecture_overview.md`,
`hej/docs/design/system/system_design.md`, `hej/docs/governance/repo-structure.md` and `hej/AGENTS.md`.

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
    under `apps/hej-web/app/tasks/[taskId]/`. `AGENTS.md` still describes an older four-tab scope
    (Setup, Queue, Review, History)
- **Workflow state authority** is `hej/docs/design/product/workflow_states.md`. Code enums currently
  differ — task items are `pending, annotated, returned, rejected, reviewed, disputed,
  expert_send_back, canonicalized` — which is a known risk (see `mission.md`).

## Data

- **SQLite** (`apps/hej-api/hej_dev.db`) for local development, selected by `DATABASE_URL`. The design
  calls only for "a relational database"; production hosting is not decided.
- **Schema management:** `Base.metadata.create_all` at startup, plus an additive `migrate_db_schema()`
  for existing SQLite databases. There is no Alembic.
- **Seeding:** `apps/hej-api/init_data.py --reset` (re-runnable) creates demo organisations and the
  admin, reviewer and annotator accounts.
- **The dev database is shared across checkouts.** Never run `--reset` from an older commit — it
  rebuilds tables with that commit's schema.
- **Background job runner:** part of the design (batch AI import, export generation, disagreement
  scans), not implemented. The queue technology is decided in story C2.

## Testing

- **Backend: pytest**, unittest-style classes allowed. Authorization and ownership tests use a **real
  in-memory SQLite database** (`StaticPool`) with real users and roles rather than mocks. Add a
  route-level `TestClient` test when behaviour depends on routing.
- **Web: Vitest 3** with **jsdom** and **Testing Library** (react, jest-dom, user-event).
- **Static checks:** `tsc --noEmit`; **ESLint 9** via `@workspace/eslint-config`; **Prettier** with the
  Tailwind plugin.
- **One command before every PR** is `npm run check`, which runs `test:api`, `test:web`,
  `typecheck:web` and `lint:web`.
- **Evaluation harness** (I1, I2) is planned: scenario-level runs over a 40–60 case casebook, reusing
  the gold fixtures from the client's `labeling_ai_assistnat_mvp` project (SCRUM-6). That project is not
  in `hej` and not available locally yet; its location is to be confirmed.

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

From `hej/AGENTS.md`:

| If you change | Update |
| --- | --- |
| Domain ownership | `backend_module_map.md`, `repo-structure.md` |
| API resources, routes or boundaries | `api_surfaces.md`; `integration-contract.md` when DS-facing |
| Workflow states or transitions | `workflow_states.md`, `demo-scenarios.md` |
| Data model or persistence | `domain_model.md`, `domain_model_relations.md`, `db_schema_strategy.md`, `db_schema_blueprint.md` |
| Milestone scope, demo shape or order | `milestone-definition.md`, `task-tree.md`, `task-tree-general.md`, `minimal-working-slice.md` |

## Repository & Documentation Map

**`hej/` — the product repository (git, shared with the client):**

| Path | Role |
| --- | --- |
| `AGENTS.md` | Stack, core rules, Docs Sync, commit rules for agents and people |
| `docs/governance/` | `canon.md`, `requirements.md` (RQ ids), `repo-structure.md` |
| `docs/design/` | `system/` architecture, `product/` workflows and states, `backend/` API surfaces and module map, `database/` domain model and schema, `ds/` dataset matrix |
| `docs/terminology/` | Canonical vocabulary: lifecycles, queue, governance model, task schema and policy |
| `docs/implementation/planning/` | Inherited milestone definition, risk register, demo scenarios, integration contract, team allocation |
| `docs/team-discipline/` | `dev-workflow.md`, AI coding guidelines and project profile, `gov.md` templates (not yet adopted) |

**`COMP5703_Capstone/docs/` — the team's working area (not in git):**

| Path | Role |
| --- | --- |
| `specs/` | This constitution (`mission.md`, `tech-stack.md`, `roadmap.md`) and dated feature specs `YYYY-MM-DD-<story-id>-<slug>/` with `plan.md`, `requirements.md`, `validation.md` — the big picture for each story, written with the `feature-spec` skill |
| `info/` | Reference material that rarely changes: the client brief (`ProjectDescription.pdf`), the defect register (`issues.md`, 29 defects) and its fix plan (`fix-plan.md`). The story backlog itself lives in `shared/story_src.csv`; the page's **Export** can produce a Markdown copy on demand |
| `shared/` | Whole-team tracking. `CS-57_Contribution_Tracker.xlsx` and `Jira.csv` are snapshots Hanchen downloads by hand from the team's online Google Sheet and the Jira board — **read-only locally**, and possibly behind the live versions. `story_src.csv` is the backlog data behind `user-stories.html`, the client view: only Hanchen manages it, locally, and it is updated after the snapshots, so it lags them. It is the one file updated here. `README.md` explains the page and the CSV format |
| `sandbox/` | Hanchen's personal files supporting work on his own branches — never uploaded to GitHub. Development plans, manual tests, local data scripts, commit drafts and learning notes, organised by week. See [Personal sandbox](#personal-sandbox-docssandbox) |
| `reviews/` | Code reviews of team PRs (`review-<branch>-<topic>.md`), checked against the story and verified in the running code, and prepared PR descriptions (`pr-<branch>-<topic>.md`) |

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
records are the online tracker and the Jira board; `shared/` holds hand-downloaded snapshots of them,
and `story_src.csv` is updated from those snapshots later still. When current status matters, read the
board and the tracker.

**Format**
- One row per story, 14 columns: `id, epic, priority, owner, name, story, acceptance_criteria,
  related_issues, subtasks, defects, status, allocated_to, scrum, source`. Keep the header unchanged.
- `status` is blank (not started), `working`, `done` or `dropped`.
- `allocated_to` takes one name or several separated by commas, using the tracker's roster names —
  Tim Chung is `Tok Tin Chung`.
- `scrum` is generated from the board; `source` is `shipped` for the original 59 stories.
- Preserve the byte format when writing: UTF-8 with BOM, CRLF between rows, LF inside multi-line
  cells, minimal quoting. Python's `csv` writer with `QUOTE_MINIMAL` and `lineterminator='\r\n'`
  reproduces the file byte for byte.

**Update rules** (agreed 2026-09-13; applied by the `tracking-sync` skill in
`.claude/skills/tracking-sync/`)
- **Board source:** whichever download is newer — the tracker's *Jira Statistics* snapshot or
  `Jira.csv`. Where the two disagree, report it.
- **`done`** when the tracker's latest entry for the story says *Story complete? = Yes*, or every ticket
  for the story is Done on the board. Gaps found by checking the code are reported, not written into
  the CSV.
- **`working`** when a story ticket is In Progress or In Review, or the tracker's latest entry says
  *No — more work to come*.
- **Not started** (blank) when every ticket is To Do and nothing is logged, even if the CSV said
  `working`.
- **Never downgraded automatically:** `done` and `dropped`. Change these by hand after agreement.
- **`allocated_to`**, using tracker roster names (aliases in the skill's `scripts/aliases.json`):
  - in progress — board assignees plus anyone who delivered a logged PR; keep the existing value if
    both are empty;
  - completed — the allocation already recorded, plus anyone who delivered;
  - not started — the allocation already recorded, plus any board assignee.
- **Read-only:** never write to `CS-57_Contribution_Tracker.xlsx` or `Jira.csv`.
- **Who changes `story_src.csv`** (decided 2026-09-14): `status`, `allocated_to` and `scrum` change only
  through the skill's `apply` step. Every other column — story text, acceptance criteria, related
  issues, subtasks, defects, and new stories — is edited by Hanchen in `user-stories.html`. `apply`
  refuses if the file changed after its report, so finish page edits before running a report.

## What We Are Not Using

- No Alembic or other migration framework — additive SQLite migration only
- No message broker or worker yet — decided in C2
- No CI workflow, PR template, CODEOWNERS or branch protection in `hej`
- Supabase, Terraform and Kubernetes folders are placeholders, unused
- No Label Studio, no model training or fine-tuning
- No project-scoped roles in practice — `RoleScope.PROJECT` exists but is never read
