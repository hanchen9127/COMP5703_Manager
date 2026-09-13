# Hej — orientation for an inherited codebase

You didn't write this system. This doc is the context you'd have gotten from the people who did, if
they were still here: what it's for, how to run it, how it's put together, and a line-by-line trace
of the one code path your sprint tickets touch.

Companion: [`plan-SCRUM-25-26-28.md`](../W6/plans/plan-SCRUM-25-26-28.md) — the commit-by-commit plan for SCRUM-25 / 26 / 28.

---

## Part 1 — What this system is

**Hej** = *Human Evaluation & Judgment infrastructure*. Client: Hunter Xu, Arc Intelligence.

The one-sentence version, from `hej/docs/governance/canon.md` (the authoritative doc — when
anything conflicts, canon wins):

> A governed human-judgment infrastructure that integrates human reasoning into AI training
> pipelines through structured review, dispute, and arbitration.

**What it is not** — and this matters, because it explains design choices that otherwise look
over-engineered: it is *not* a labeling tool, not a crowdsourcing platform, not a dataset host.

Three principles drive almost every structural decision in the code:

| Principle | Why the code looks the way it does |
| --- | --- |
| **Judgment is traceable** | Every decision records *who*, *at which stage*, *from what prior state*. Hence `AuditLogDB`, `annotation.version`, `confirmed_by`, escalation rows. |
| **Disagreement is signal, not error** | Conflicts are preserved rather than majority-voted away. Hence separate `ReviewDB`, dispute/escalation tables instead of one "final answer" column. |
| **AI and human roles stay separate** | `PredictionDB` (machine) is a different table from `AnnotationDB` (human). Never merge them. |

### The domain hierarchy

Everything hangs off this spine. It appears in the URLs, the DB foreign keys, and the permission
checks:

```
Organization  →  Project  →  Task  →  TaskItem  →  { Draft, Annotation, Review, Escalation }
```

- **Organization** — the tenant. Isolation boundary; all access control resolves to "which org".
- **Project** — groups related tasks. Carries a governance model.
- **Task** — one evaluation job. Defines *task class* (`annotation` | `judgement`), *task type*
  (`text_annotation`, `llm_answer_evaluation`, …) and *execution mode* (`human_first` |
  `ai_assisted`).
- **TaskItem** — the atomic unit of work. One image, one text passage, one answer to judge.

> ℹ️ **Task class / task subtype is design intent, not code — yet.** That description comes from
> `docs/design/database/domain_model.md`. On your branch `TaskDB` has only `task_type`
> (`image` | `text` | `audio`) and `annotation_mode`; there is no `task_class` or `task_subtype`
> column. Yi's unmerged `337ca1a` adds both. Don't go looking for them in `db_models.py` and conclude
> you're reading the wrong file.

### The work lifecycle

```
pending → annotated → reviewed → canonicalized        (happy path)
                   ↘ returned / rejected              (reviewer sends back)
                   ↘ disputed → expert_send_back      (escalation)
```

`canonicalized` is **terminal** — it's the defended, exportable answer.
Defined in one place: `app/services/task_service.py:72` — `TERMINAL_TASK_ITEM_STATUSES = {"canonicalized"}`.

**Your SCRUM-28 exists because today that terminal state isn't actually enforced.**

---

## Part 2 — Running it

Your toolchain is already installed and working: `uv 0.12.5`, Node `v22.23.2`, npm `11.19.0`,
`node_modules` present in both places, and the API imports cleanly (91 routes).

### ⚠️ Read this before you run the seed script

`init_data.py` prints emoji (`⚠️`, `✓`, `❌`). Your console codepage is **gbk** (Windows 11 Home
China), so the script **crashes on its first print** — and then its error handler crashes too while
trying to report the crash:

```
UnicodeEncodeError: 'gbk' codec can't encode character '⚠' in position 2
During handling of the above exception, another exception occurred:
UnicodeEncodeError: 'gbk' codec can't encode character '❌' in position 2
```

This is known defect **#24a**, story A3, currently assigned to Yi and **not yet fixed** — his commit
`a324b7d` fixed a different half of the same story. Until it lands, set the encoding yourself.

**PowerShell:**
```powershell
$env:PYTHONIOENCODING = "utf-8"
```

Put that in your profile and forget about it. Without it, nothing below works.

### Backend

```powershell
cd apps\hej-api
uv sync                              # first time only
uv run python init_data.py --reset   # seed / reset demo data
uv run python main.py                # serves on http://localhost:8000
```

- Swagger UI: **http://localhost:8000/docs** — the fastest way to explore the API.
- Health: `GET http://localhost:8000/api/v1/health`
- DB is SQLite at `apps/hej-api/hej_dev.db`. Safe to delete; re-seed to rebuild.

> ⚠️ **`--reset` is NOT safe to re-run on your branch.** The fix (Yi's `a324b7d`) lives on `CS-57-Yi`
> and is **not merged** — it is not an ancestor of `CS57-Hanchen`. `init_data.py` here still has the
> hand-rolled `DROP TABLE` loop, so a **second** `--reset` against an already-seeded database dies with
> `sqlite3.IntegrityError: FOREIGN KEY constraint failed` partway through, leaving the schema half
> dropped. That's defect **#24b**, still open on this branch.
>
> **Workaround until Yi's branch merges:** delete the file first, then seed.
>
> ```powershell
> Remove-Item apps\hej-api\hej_dev.db -ErrorAction SilentlyContinue
> uv run python init_data.py --reset
> ```

### Frontend

```powershell
npm install          # from repo root, first time only
npm run dev:web      # http://localhost:3000
```

The web app expects the API at `http://localhost:8000/api/v1` (`apps/hej-web/lib/api-config.ts`,
override with `NEXT_PUBLIC_HEJ_API_BASE_URL`).

### Seeded accounts

From `init_data.py`:

| Login | Password | Org | Role |
| --- | --- | --- | --- |
| `alice@example.com` | `SecurePass1Alice` | Acme **+ TechStart** | admin |
| `bob@example.com` | `SecurePass2Bob` | Acme only | reviewer |
| `charlie@example.com` | `SecurePass3Charlie` | TechStart | annotator |

Note Bob is in **Acme only**, so he cannot review Charlie's work — they share no organisation.
**Use `erin` (below) whenever you need a reviewer for Charlie's items** — she is in TechStart.

### Added test accounts (TechStart Inc, org 2)

Created for the SCRUM-25/26/28 sandbox. All password `SecurePass<N><Name>`:

| Login | Password | Roles | What it's for |
| --- | --- | --- | --- |
| `dana@example.com` | `SecurePass4Dana` | annotator | Second annotator — the clean SCRUM-25 partner for Charlie, with no admin powers to muddy the result |
| `erin@example.com` | `SecurePass5Erin` | reviewer | Pure reviewer, so review tests don't run as admin |
| `frank@example.com` | `SecurePass6Frank` | annotator + reviewer | Can annotate *and* approve — the only way to exercise the self-approval guard |
| `grace@example.com` | `SecurePass7Grace` | arbitrator | Escalation decisions (`ADJUDICATE`) for the dispute leg |

Verified capability behaviour (create a draft):

```
dana  (annotator)     201      erin  (reviewer)    403
frank (annot+rev)     201      grace (arbitrator)  403
```

**These are wiped by `init_data.py --reset`.** Re-create them with:

```powershell
.venv\Scripts\python ..\..\..\docs\sandbox\tools\seed_test_roles.py
```

The script is idempotent — safe to re-run any time.

### Sandbox fixture

Project **Draft Ownership Sandbox** (`proj_38f68ba11150`) → task `task_29dae663595b`
(text / `human_first`) → five items.

> ⚠️ **`sandbox_text_00N` are `external_item_ref` values, not item ids.** Paste one into an API URL and
> you get a 404. The real ids are in the table below.

> 🔴 **This fixture is spent — re-seed before you use it.** All five items are now `canonicalized`, so
> once Commit 2's terminal-status guard lands, **every one of them will refuse draft writes** and there
> is nothing left to exercise SCRUM-25 against by hand. `sandbox_text_003` in particular is *not* clean
> — it was consumed reproducing the D4 defect and now carries three drafts and two competing
> annotations. Build a fresh non-terminal item before the manual walkthrough. (Automated tests create
> their own rows and are unaffected.)

| Item | Id | Actual state | Originally for |
| --- | --- | --- | --- |
| `sandbox_text_001` | `item_8665e319dbe5` | canonicalized · 2 drafts (1 ownerless) · 1 annotation (Charlie) | SCRUM-28 — approved annotation to attempt overwriting |
| `sandbox_text_002` | `item_42f58cc99004` | canonicalized · 1 ownerless draft · 1 ownerless annotation | ownerless-draft case |
| `sandbox_text_003` | `item_0d3bb2fc6864` | canonicalized · **3 drafts** · **2 annotations**, both `is_latest=1` / `version=1` | was "kept clean" — now the D4 reproduction (see `plan-SCRUM-25-26-28.md`, *Known boundary*) |
| `sandbox_text_004` | `item_7aa7f610b2c5` | canonicalized · 2 drafts · 1 annotation (Frank) | self-approval with an owned draft |
| `sandbox_text_005` | `item_40344768fc7c` | canonicalized · 1 ownerless draft · 1 ownerless annotation | self-approval via an ownerless draft |

### Getting a token for manual API testing

```powershell
$body = '{"email":"charlie@example.com","password":"SecurePass3Charlie"}'
$r = Invoke-RestMethod -Uri http://localhost:8000/api/v1/auth/login -Method Post -Body $body -ContentType "application/json"
$r.access_token
```

Then pass `Authorization: Bearer <token>`. Or just use `/docs` — click **Authorize**, paste the
token, and every endpoint becomes clickable.

### Tests

```powershell
npm run test:api        # pytest — expect 163 passed, 111 subtests passed
npm run test:web        # vitest — expect 105 passed, 16 files
npm run typecheck:web   # tsc --noEmit — expect silence
npm run check           # all of the above
```

All four are green on your branch right now — verified at `63bcfab`, zero failures and zero collection
errors. **If any of them is red, it's you** — that's a useful property and worth protecting.

Use the exact counts, not "123+". A regression that drops you from 149 to 147 is invisible against a
fuzzy target, and pytest reports a silently *skipped* module as a smaller pass count, not a failure.

---

## Part 3 — How the code is laid out

```
hej/
├── apps/
│   ├── hej-api/          FastAPI + SQLAlchemy + SQLite      ← your tickets are all here
│   └── hej-web/          Next.js 16 App Router, React 19
├── packages/ui/          shared shadcn-style components
└── docs/                 canon, design, terminology, PR specs
```

### Backend layering — follow the arrow

```
app/api/routes/*.py     HTTP surface: auth, validation, status codes
        ↓
app/services/*.py       business rules and workflow semantics    ← put your logic here
        ↓
app/repositories/db_store.py   SQLAlchemy persistence
        ↓
app/models/db_models.py        ORM tables
```

Two cross-cutting modules you'll touch:

- `app/core/permissions.py` — org access + the capability system (`GovernedAction`) Jingwei added.
- `app/core/resource_scope.py` — "does this draft/annotation/review belong to something you can
  reach?" **This is where SCRUM-25 goes.**

**Rule of thumb:** guards that must hold *no matter who calls* belong in the **service** layer.
Guards about *who is asking* belong in `core/` and are called from routes. Your SCRUM-28 guard is
the first kind; SCRUM-25 is the second.

### The tables that matter for you

| Table | Meaning |
| --- | --- |
| `DraftDB` | Work in progress. `status`: `pending` → `submitted` → `approved`. Has `created_by`, and an `annotation_id` column that **is never written** (your SCRUM-26). |
| `AnnotationDB` | A submitted human answer. `created_by` = author, `confirmed_by` = approver, `version`, `is_latest`. |
| `PredictionDB` | Machine output. Deliberately separate from `AnnotationDB`. |
| `ReviewDB` | A reviewer's verdict on an annotation: `approved` / `rejected` / `needs_revision`. |
| `TaskItemDB.status` | The coarse state the UI and export read. |

The single most important thing to internalise: **four different things can each be "the answer"** —
the draft, the annotation, the review verdict, and the item status. They are written at different
times by different code. Most of the defects in this codebase, including all three of yours, are
places where those four fall out of sync.

---

## Part 4 — The code path you're changing

Trace it once end to end and your tickets stop being abstract. All paths below are in `apps/hej-api`.

### Annotator submits work

```
1. POST /api/v1/task-items/{id}/drafts
   routes/drafts.py:44  create_draft
   → DraftService.create_draft            services/draft_service.py:31
   → DraftRepository.create               repositories/db_store.py:1073
   ⇒ drafts row: status="pending", created_by=<you>

2. PATCH /api/v1/drafts/{draft_id}         routes/drafts.py:168   (edit while working)
   DELETE /api/v1/drafts/{draft_id}        routes/drafts.py:208

3. POST /api/v1/drafts/{draft_id}/submit
   routes/drafts.py:234  submit_draft
   → DraftService.submit_draft            services/draft_service.py:93
       a. drafts.update(status="submitted")            ← commit #1
       b. _create_annotation_from_draft()   :146       ← commit #2
          creates/updates AnnotationDB, created_by = draft.created_by
       c. _advance_task_item_to_annotated_on_submit()  ← commit #3
          task item → "annotated"
```

### Reviewer decides

```
4. POST /api/v1/tasks/{task_id}/task-items/{item_id}/review-actions
   routes/review_actions.py:195
   → picks the annotation via _latest_annotation()     review_actions.py:139
   → capability check (Jingwei):  APPROVE / REVIEW / DISPUTE
   → assert_not_self_approval()   services/review_policy_enforcement.py:61
   → writes ReviewDB, sets item status
   ⇒ accept → "canonicalized"   (terminal)
```

Note `_latest_annotation` orders by `version desc` — but **every annotation in the database has
`version = 1`** (`draft_service.py:177` hardcodes it; 0 of 31 rows differ). So on a double-annotated
item the tiebreak decides nothing and the pick is arbitrary. That's issue #3/#4, SCRUM-27, not yours —
but it's why step 4 can review the wrong person's work.

### Now — exactly where your three tickets sit

| Step | Defect | Ticket |
| --- | --- | --- |
| **2 and 3** | `verify_user_draft_access` (`core/resource_scope.py:49`) checks org/project scope but **never** `draft.created_by`. Anyone in the org can edit, delete or submit your draft. | **SCRUM-25** (#6) |
| **3a–3c** | Three independent commits — a failure between them leaves a submitted draft with no annotation, or an item out of sync. And `draft.annotation_id` is never written, so nothing records which annotation this submission produced. | **SCRUM-26** (#11) |
| **1 and 3** | Neither checks the *item's* status. After step 4 canonicalizes an item, a new draft can be submitted and `_create_annotation_from_draft` **updates the approved annotation in place** — a locked answer silently changes, with no new review. | **SCRUM-28** (#2) |

One trap that will bite you if you skim, spelled out in `plan-SCRUM-25-26-28.md`: `verify_user_draft_access` is
called by **five** routes, and two of them — `get_draft` (`:143`) and `approve_draft` (`:316`) —
*must not* require ownership, because reviewers legitimately read and approve other people's drafts.
Add a separate helper; don't tighten the shared one.

---

## Part 5 — Team conventions

From `hej/AGENTS.md`. (Its links point at `/Users/hunterxu/...` — dead on your machine. The real
files are under `hej/docs/`.)

**Commits** — semantic headline, then 1–3 detail lines:

```
fix(api): enforce draft ownership on write paths

Draft update, delete and submit now require the caller to be the
draft's author. Read and reviewer-approval paths are unaffected.
Closes SCRUM-25.
```

Prefixes: `feat:` `fix:` `refactor:` `docs:` `test:` `chore:`. One commit = one complete reviewable
unit — not every intermediate step.

**Docs Sync** — this repo genuinely enforces it. If you change workflow states, update
`docs/design/product/workflow_states.md`. If you change API behaviour, update
`docs/design/backend/api_surfaces.md`. That's `plan-SCRUM-25-26-28.md`'s Commit 6, and it's not optional politeness
— it's in the Definition of Done.

**Architectural guardrails:** preserve the `organization → project → task → task_item` spine; keep
annotation / review / dispute / arbitration as distinct concepts; don't invent new architecture.
When uncertain, make the small local change.

---

## Part 6 — The doc set, and which to trust

| Doc | What it's for | Trust |
| --- | --- | --- |
| `hej/docs/governance/canon.md` | Why the system exists, non-negotiables | **Authoritative** — wins all conflicts |
| `hej/docs/design/**` | Architecture, API surfaces, data model | Design intent; some marked TBD |
| `hej/docs/terminology/**` | What the words mean | Read `task-lifecycle.md` before touching statuses |
| `hej/AGENTS.md` | Stack + team rules | Rules current; **links are broken paths** |
| `docs/info/issues.md` | 29 verified defects, prioritized | Verified against code |
| `docs/info/fix-plan.md` | Per-defect fix recipes with line refs | Yours: sections 2, 6, 11. **§6 item 1 is wrong** — see below |
| `docs/shared/story_src.csv` | 59 stories, acceptance criteria, DoD | The source for "am I done?" |
| `docs/shared/Jira.csv` | Board export — ticket ↔ story ↔ issue | Sprint assignment |

**How they chain:** a Jira ticket → a story (acceptance criteria) → one or more numbered issues
(defect + fix recipe). Yours:

```
SCRUM-25 → story D6 → issue #6   → fix-plan §6
SCRUM-26 → story D5 → issue #11  → fix-plan §11
SCRUM-28 → story D5 → issue #2   → fix-plan §2
```

Read the **story**, not just the ticket — the acceptance criteria are what you'll be judged against,
and they contain requirements the one-line ticket doesn't mention (D6 criterion 3 asks whether an
admin override exists; D5 criterion 2 asks for an attributable reopen).

**But don't follow the fix recipes blindly.** Two things to know:

- **`fix-plan.md` §6 item 1 is wrong.** It says to put the ownership check inside
  `verify_user_draft_access`. That helper is also called by `approve_draft` (`drafts.py:316`), so
  following it would 403 every reviewer approval. `plan-SCRUM-25-26-28.md` deviates deliberately — say so in your PR.
- **Line numbers in the stories have drifted.** D6 subtask 1 cites `drafts.py:158`, `:192`, `:212`;
  the real call sites are `:177`, `:216`, `:250`. D5 subtask 1 cites `draft_service.py:145`; the
  function starts at `:146`. The prose is right; the numbers are stale.

**D5 is co-allocated to you and Yi Geng** (`current_user_stories.md:560`) — only D6 / SCRUM-25 is
yours alone. Settle the split before you start Commit 2.

---

## Part 7 — Honest state of the codebase

You inherited this at **Executive Status: Red** (`issues.md`). Not to alarm you — to stop you
assuming that anything surprising you find is your misunderstanding. Often it's a known defect.

- **29 verified defects**, 6 Critical. Yours are 3 of them.
- The Criticals cluster in exactly your area: finalized answers can change, users can edit each
  other's work, exports can disagree about the canonical answer.
- Some of what looks like sloppiness is deliberate scaffolding: `Mock*` type names in the frontend
  are *display types*, not fake data; several routes are honest `notFound()` stubs rather than
  half-built screens.
- Comments are mixed English/Chinese. Normal here; match the surrounding file.
- Two live decisions are **blocked on the client**, and one touches you: D5 criterion 2 (what
  "reopening a finalised item" means) is a workflow-semantics question for Hunter, not for you to
  invent. `plan-SCRUM-25-26-28.md` scopes SCRUM-28 to refusal only for that reason.

### If something looks broken, check in this order

1. `docs/info/issues.md` — is it one of the 29?
2. `git log -- <file>` — recent churn, and by whom.
3. The story in `current_user_stories.md` — is the "bug" actually unbuilt scope?
4. Ask. Four people have touched this repo this sprint alone.

---

## Your first hour

1. `$env:PYTHONIOENCODING = "utf-8"`, then delete `hej_dev.db`, seed, and start both apps.
   (Delete first — `--reset` alone is broken on this branch; see the warning in Part 2.)
2. Re-create the extra accounts: `.venv\Scripts\python ..\..\..\docs\sandbox\tools\seed_test_roles.py`.
3. Log in as **charlie** (annotator, TechStart). Open a task, annotate an item, submit it.
4. Log in as **erin** (reviewer, TechStart). Review and accept the same item — it becomes
   `canonicalized`.
   **Not bob** — he is in Acme only and cannot see Charlie's work at all; he'll 403 before you get
   anywhere near the interesting part.
5. Now log back in as **charlie** and submit again against that same finalized item. **It will
   succeed, and it will overwrite Erin's approved answer.** That's SCRUM-28, reproduced by hand in
   five minutes.
6. `npm run check` — confirm all four suites green before you write a line (149 api / 119 web).
7. Open [`plan-SCRUM-25-26-28.md`](../W6/plans/plan-SCRUM-25-26-28.md) and start at Commit 1.
