# Merged PR titles, one format (2026-10-23)

**Decided by Hanchen (2026-10-23):**
- Format: `type(scope): description (stories, tickets)`, following Conventional Commits. For example,
  `feat(api): refuse a release that fails its pre-release checks (H3, SCRUM-105)`.
- **Type:** the PR's own (`feat`, `fix`, `docs`, `test`, `refactor`, `perf`). `feat/fix` and `infra` become one
  standard type.
- **Scope:** the code area the PR changes: `api`, `web`, `evaluation`, `seed`, `db`, `ci`, `docs`. When it changes
  several, they are comma-separated with no space (`api,web`). The `(API)` / `(WEB)` / `(API + WEB)` suffixes go;
  the scope says it.
- **Refs:** the closing parentheses hold the stories first, then the tickets.
- **Which PRs:** the merged feature PRs, 83 of them. Left out: the two `main`-sync merges (#3, #15) and the four PRs
  closed without merging (#1, #5, #12, #82). #4 was first left out as a sync too. The verification found it is the
  role-permission fix (SCRUM-44), so it is in.

**Checked 2026-10-23.** Before this, 88 closed PRs used at least 8 shapes. 53 used `type(SCRUM-N): …`, and 18 named
no ticket. The check is `pr-title-check.txt` in the session scratchpad.

**Renaming changes GitHub only.** A merge commit keeps the title the PR had when it merged ("Merge pull request #93
from … / SCRUM-125: Hardening …"), so `git log` still shows the old titles. The ticket map
(`../jira/jira-new-replace-scrum-references.md`) covers them.

## How the proposals were made

- **Scope:** an area is in the scope when it holds at least 15% of the PR's changed lines, not counting docs and
  lockfiles. The lines come from GitHub's file list, or from the merge commit when GitHub lists only 100 files (#67,
  #91). #24 is `db` by meaning: it is the PostgreSQL port.
- **Stories:** from `story_src.csv` for each ticket, plus any story the old title named.
- **Description:** the author's wording, kept, with these changes:
  - a leading capital is lowered;
  - Jira-style prefixes ("Review:", "Governance:", "Dispute:", "Work queues:") are dropped;
  - the ticket and layer suffixes move into the refs;
  - a few awkward titles are reworded; their rows carry a note.
- **Tickets found for titles that had none:** #6 is SCRUM-29 and #24 is SCRUM-94. Both have exactly that summary on
  the board.

## Verification (2026-10-23)

A subagent checked all 82 first-round rows against each PR's body, commits and merge diff, against `story_src.csv`
and against `Jira.csv`. Its report: [`pr-title-verification.md`](pr-title-verification.md). It agreed with 70 rows
and corrected 12, and it found #4. Hanchen spot-checked #4 and eight of the tickets it found, then chose:
- **The found tickets go in:** #9 (SCRUM-22, 23), #10 (SCRUM-81, replacing the defect numbers), #11 (SCRUM-34),
  #14 (SCRUM-21), #16 (SCRUM-8), #17 (SCRUM-31, 35), #27 (SCRUM-95, 96, 97) and #31 (SCRUM-3, from the code and its
  review; the author named none).
- **Scope:** the subagent's corrections are taken: #35 `api`, #67 `web,seed`, #93 `api,web,db`.
- **#60 stays `feat`,** as its only commit says.
- **Added on indirect evidence:** #8 A4/SCRUM-84, #27 SCRUM-92, #61 D8.
- **Unchanged after checking:** #24's C2 is right; SCRUM-94 exists because C2's job queue needs concurrent writes.
  #6's SCRUM-29 is confirmed. The type changes on #13, #17, #43, #65 and #93 stand.
- **Long titles stay:** #48 (4 stories, 3 tickets) and #53 (6 stories) list every story, as decided.
- **Now without refs:** none. The verification found a ticket for every row that lacked one.

## The proposals

| PR | Current title | Proposed title | Note |
| --- | --- | --- | --- |
| #2 | test: Restore existing test cases (A2/SCRUM-82) | test(api,web): restore existing test cases (A2, SCRUM-82) |  |
| #4 | Merge to main | fix(api): enforce role-based permissions (G1, SCRUM-44) | verification 2026-10-23: not a main sync; "Fix: Role-based permission", 1,522 lines of api (SCRUM-44, issue 7) |
| #6 | fix(api): retire legacy review mutation endpoints | fix(api,web): retire legacy review mutation endpoints (D2, SCRUM-29) | ticket found: SCRUM-29 is this change |
| #7 | feat: surface AI run status on task items (SCRUM-30) | feat(web): surface AI run status on task items (C3, SCRUM-30) |  |
| #8 | feat: Epic C AI-provider integration (SCRUM-6, SCRUM-7) — rebased onto main | feat(api,web): integrate AI providers for epic C (A4, C1, C3, SCRUM-6, SCRUM-7, SCRUM-84) | verification 2026-10-23: removing Gemini deleted the committed API key (A4); added by Hanchen |
| #9 | Fix task update route and service | fix(api): repair the task update route and service (B5, G4, SCRUM-22, SCRUM-23) | verification 2026-10-23: TaskItemStatus check (SCRUM-22) and 409 kept as 409 (SCRUM-23) |
| #10 | fix: A3 — .env loading and a re-runnable init_data.py --reset (issues 23, 24a, 24b) | fix(api,seed): load .env and make init_data.py --reset re-runnable (A3, SCRUM-81) | verification 2026-10-23: SCRUM-81 lists issues 23 and 24 |
| #11 | Fix Issue #16: make dataset registration transactional | fix(api): make dataset registration transactional (B5, SCRUM-34) | verification 2026-10-23: SCRUM-34's summary is this title |
| #13 | feat/fix: enforce draft ownership  — an unfinished draft belongs to its author (D6/SCRUM-25) | fix(api,web): enforce draft ownership: an unfinished draft belongs to its author (D6, SCRUM-25) | type was feat/fix; #12 (closed) called it fix |
| #14 | fix(api): enforce project boundaries on task writes | fix(api): enforce project boundaries on task writes (G3, SCRUM-21) | verification 2026-10-23: the body says Story G3, issue 9 (SCRUM-21) |
| #16 | fix: restore organisation invitation flow (G5) | fix(api): restore the organisation invitation flow (G5, SCRUM-8) | verification 2026-10-23: story_src maps G5 to SCRUM-8 |
| #17 | feat/fix: Add dispute send-back, structured review reasoning, and optional Docker setup | feat(api,web): add dispute send-back, structured review reasoning and optional Docker setup (C5, E2, SCRUM-31, SCRUM-35) | verification 2026-10-23: the body's Story E2 and Story C5 sections; type was feat/fix |
| #18 | fix(A3/SCRUM-81): non-zero exit on setup failure, scope UTF-8 reconfigure to CLI, drop redundant -X utf8 | fix(seed): non-zero exit on setup failure, scope UTF-8 reconfigure to CLI, drop redundant -X utf8 (A3, SCRUM-81) |  |
| #19 | fix(api): a finalised task item refuses new annotation work (D5/SCRUM28) | fix(api): a finalised task item refuses new annotation work (D5, SCRUM-28) |  |
| #20 | docs(C2/SCRUM-1, SCRUM-2): AI batch execution options and job schema | docs: AI batch execution options and job schema (C2, SCRUM-1, SCRUM-2) |  |
| #21 | feat(SCRUM-1): AI batch job and per-item job status tables | feat(api): AI batch job and per-item job status tables (C2, SCRUM-1) |  |
| #22 | feat(SCRUM-2): run AI annotation in a worker instead of the request | feat(api): run AI annotation in a worker instead of the request (C2, SCRUM-2) |  |
| #23 | fix(api): make draft submission atomic and record its annotation (D5/SCRUM-26) | fix(api): make draft submission atomic and record its annotation (D5, SCRUM-26) |  |
| #24 | infra: run on PostgreSQL while keeping SQLite working | feat(db): run on PostgreSQL while keeping SQLite working (C2, SCRUM-94) | type was infra; ticket found: SCRUM-94 has this exact title; story C2 is story_src's |
| #25 | feat: configure project review and annotation policies (B2/SCRUM-20) | feat(api,web): configure project review and annotation policies (B2, SCRUM-20) |  |
| #26 | fix(SCRUM-43): Align task completion and export eligibility | fix(api): align task completion and export eligibility (B6, H5, SCRUM-43) |  |
| #27 | feat: Custom task & label definition & label list upload & schema driven AI output & label editing in project policy page | feat(api,web): custom task and label definitions, label list upload, schema-driven AI output and label editing on the policy page (SCRUM-92, SCRUM-95, SCRUM-96, SCRUM-97) | verification 2026-10-23: subtasks of SCRUM-6, resolved the day #27 merged; no story maps them; SCRUM-92 added by Hanchen |
| #28 | feat(SCRUM 90)- add organisation membership, invitations, and role management | feat(api,web): add organisation membership, invitations, and role management (J3, SCRUM-90) |  |
| #29 | feat(SCRUM-46): trigger an AI run and route finished items into review | feat(api): trigger an AI run and route finished items into review (C2, SCRUM-46) |  |
| #30 | feat(SCRUM-3): retry transient failures, keep permanent ones visible | feat(api): retry transient failures, keep permanent ones visible (C2, SCRUM-3) |  |
| #31 | fix: modify the annotation metadata to add more detailed error_kind, error_code, error_type and error_message | fix(api,web): add error_kind, error_code, error_type and error_message to the annotation metadata (C2, SCRUM-3) | verification 2026-10-23: SCRUM-3's failure classification; confirmed by Hanchen |
| #32 | feat(SCRUM-5): show AI batch progress and per-item job status | feat(api,web): show AI batch progress and per-item job status (C2, SCRUM-5) |  |
| #33 | feat(SCRUM-48): serve work through role-checked queues and review each submission | feat(api): serve work through role-checked queues and review each submission (D8, SCRUM-48) |  |
| #34 | fix(SCRUM-27): let a review name the annotation it acts on (API) | fix(api,web): let a review name the annotation it acts on (D4, SCRUM-27) |  |
| #35 | fix(SCRUM-48): fixes for #33 - independence reads, AI-assisted routing, per-submission review queue, progress counts | fix(api): follow-ups to #33: independence reads, AI-assisted routing, per-submission review queue, progress counts (D8, SCRUM-48) | verification 2026-10-23: its own 20 commits are 97% api; the merge diff also carries #32 and #34 |
| #36 | refactor(SCRUM-112): Refactor Task Creation Around Annotation Surfaces. Extra: Move AI Model Selection to Setup | refactor(api,web): build task creation around annotation surfaces, and move AI model selection to setup (B8, SCRUM-112) | Title Case and "Extra:" reworded |
| #37 | feat(SCRUM-50): make project policy govern review | feat(api,web): make project policy govern review (B2, G2, SCRUM-50) |  |
| #39 | test(SCRUM-68): drive the workflow end to end from evaluation cases (API) | test(evaluation): drive the workflow end to end from evaluation cases (I1, SCRUM-68) |  |
| #41 | feat(SCRUM-24): enforce task lifecycle guards and delete policy | feat(api,web): enforce task lifecycle guards and delete policy (B4, SCRUM-24) |  |
| #42 | feat(SCRUM-111): enable record-based input files | feat(api,web): enable record-based input files (B7, SCRUM-111) |  |
| #43 | feat/fix(SCRUM-114): work panel — rework keeps its edits, colleagues' drafts stay out, refusals in the API's words (WEB) | fix(web): work panel: rework keeps its edits, colleagues' drafts stay out, refusals in the API's words (D8, SCRUM-114) | type was feat/fix |
| #44 | feat(SCRUM-113): the reviewer chooses which submission to review (WEB) | feat(web): the reviewer chooses which submission to review (D4, D8, SCRUM-113) |  |
| #45 | fix(SCRUM-116): refuse a review decision the review queue would not offer (API) | fix(api): refuse a review decision the review queue would not offer (D1, D5, D8, SCRUM-116) |  |
| #46 | feat(SCRUM-110): let the project owner reopen a finalised item | feat(api,web): let the project owner reopen a finalised item (D9, SCRUM-110) |  |
| #47 | feat(SCRUM-38): every answer is a version of its own, and at most one is authoritative (API) | feat(api): every answer is a version of its own, and at most one is authoritative (F3, SCRUM-38) |  |
| #48 | feat(SCRUM-99, SCRUM-100, SCRUM-101)Annotation-level disputes, item-level candidate reconciliation and policy-aware review conflict handling | feat(api,web): annotation-level disputes, item-level candidate reconciliation and policy-aware review conflict handling (D1, E1, E3, E4, SCRUM-99, SCRUM-100, SCRUM-101) | 4 stories; 168 chars |
| #49 | feat(SCRUM-93): Work queues: available-work list, progress and submission limit (WEB) | feat(web): available-work list, progress and submission limit (D8, SCRUM-93) |  |
| #50 | fix(SCRUM-120): keep a reopened item open after the next read (API) | fix(api): keep a reopened item open after the next read (D9, SCRUM-120) |  |
| #51 | feat(SCRUM-70): casebook categories, gold records and the adversarial cases (API) | feat(evaluation): casebook categories, gold records and the adversarial cases (I2, SCRUM-70) |  |
| #52 | fix(SCRUM-117): restrict annotator resubmissions to returned work | fix(api,web): restrict annotator resubmissions to returned work (D8, SCRUM-117) |  |
| #53 | feat(SCRUM-51, SCRUM-52): Independent second review and adjudicator independence | feat(api): independent second review and adjudicator independence (D7, D8, E1, E3, E6, G1, SCRUM-51, SCRUM-52) | 6 stories |
| #54 | perf(SCRUM-119): read a task's drafts in one request, and index growing tables (API, WEB) | perf(api,web): read a task's drafts in one request, and index growing tables (A6, SCRUM-119) |  |
| #56 | feat(SCRUM 115): Invitee accepts a pending invitation; role chosen at invitation | feat(api,web): invitee accepts a pending invitation; role chosen at invitation (J3, SCRUM-115) |  |
| #57 | fix(SCRUM-41): history entries no longer repeat their own summary (API) | fix(api): history entries no longer repeat their own summary (F4, SCRUM-41) |  |
| #58 | feat(SCRUM-32): a reviewer's correction is a proposal, not a submission | feat(api,web): a reviewer's correction is a proposal, not a submission (D3, SCRUM-32) |  |
| #59 | feat(SCRUM-87): record the annotation mode each item was worked under (API) | feat(api): record the annotation mode each item was worked under (C4, SCRUM-87) |  |
| #60 | SCRUM-109: Review and submission state/history consistency | feat(api): make review and submission state and history consistent (D2, SCRUM-109) | verification 2026-10-23: feat, as its only commit says (Hanchen) |
| #61 | feat(SCRUM-85): check a task's result shape on submit, and set its annotator count in the app | feat(api,web): check a task's result shape on submit, and set its annotator count in the app (B3, D8, SCRUM-85) | verification 2026-10-23: the body names story D8 subtask 2; added by Hanchen |
| #62 | feat(SCRUM-69): repeatable runs, compared case by case with a committed baseline (API) | feat(evaluation): repeatable runs, compared case by case with a committed baseline (I1, SCRUM-69) |  |
| #63 | feat(SCRUM-53): version guidelines and project policies, and record them on every answer (API) | feat(api): version guidelines and project policies, and record them on every answer (F2, SCRUM-53) |  |
| #64 | feat(SCRUM-103): show each dispute case in its task, and list a project's real cases | feat(api,web): show each dispute case in its task, and list a project's real cases (E6, SCRUM-103) |  |
| #65 | SCRUM-102: Create immutable release artefact | feat(api): create an immutable release artefact (H1, SCRUM-102) | type inferred (title was "SCRUM-102: …") |
| #66 | fix(api): export one authoritative answer per item (SCRUM-37) | fix(api): export one authoritative answer per item (H4, SCRUM-37) |  |
| #67 | feat(SCRUM-123): seed a cast of named people and a test project for every feature | feat(web,seed): seed a cast of named people and a test project for every feature (A3, SCRUM-123) | verification 2026-10-23: the seed's own test and fixtures count as seed; api is 13% |
| #68 | feat(SCRUM-40): record who really acted in task history: a person, an AI model or the platform | feat(api): record who really acted in task history: a person, an AI model or the platform (F4, SCRUM-40) |  |
| #69 | feat(SCRUM-122): Review: a returned or rejected AI first pass goes to a human annotator | feat(api,web): a returned or rejected AI first pass goes to a human annotator (E2, SCRUM-122) |  |
| #70 | feat(provenance): record the production history of every label (SCRUM-98) | feat(api,web): record the production history of every label (F1, SCRUM-98) |  |
| #71 | feat(SCRUM-71): grow the casebook to 57 cases, with the harness steps they need | feat(evaluation): grow the casebook to 57 cases, with the harness steps they need (I2, SCRUM-71) |  |
| #73 | feat(SCRUM-73): the blind-then-reveal evaluation protocol and its measures | feat(api,web,evaluation): the blind-then-reveal evaluation protocol and its measures (I4, SCRUM-73) |  |
| #74 | feat(SCRUM-89): add project metrics and tiles to project overview page | feat(api,web): add project metrics and tiles to project overview page (J2, SCRUM-89) |  |
| #75 | fix(SCRUM-88): one stable, unambiguous organisation identity (API + WEB) | fix(api): one stable, unambiguous organisation identity (J1, SCRUM-88) |  |
| #76 | feat(SCRUM-118): Governance: the Expert Gate holds an answer until an independent expert confirms it | feat(api,web,evaluation): the Expert Gate holds an answer until an independent expert confirms it (G2, SCRUM-118) |  |
| #77 | feat(SCRUM-72): agreement coefficients, and the AI's accuracy and calibration from a recorded model run | feat(api,evaluation): agreement coefficients, and the AI's accuracy and calibration from a recorded model run (I3, SCRUM-72) | 124 chars |
| #78 | feat(SCRUM-124): allow experts to accept reviewer corrections | feat(api,web): allow experts to accept reviewer corrections (D3, E3, SCRUM-124) |  |
| #79 | feat(SCRUM-74): integrity checks on roles and provenance, as a casebook step and a command | feat(evaluation): integrity checks on roles and provenance, as a casebook step and a command (I5, SCRUM-74) |  |
| #80 | feat(SCRUM-45): update and archive a project, with its history; an archived project is read-only | feat(api,web): update and archive a project, with its history; an archived project is read-only (J4, SCRUM-45) |  |
| #81 | feat(SCRUM-107): Dispute: Make the escalation posture configurable and enforced | feat(api,web,evaluation): make the escalation posture configurable and enforced (E5, G2, SCRUM-107) |  |
| #83 | feat(SCRUM-105): refuse a release that fails its pre-release checks (API) | feat(api): refuse a release that fails its pre-release checks (H3, SCRUM-105) |  |
| #84 | feat(SCRUM-104): write a manifest with every release, checkable without the platform (API) | feat(api): write a manifest with every release, checkable without the platform (H2, SCRUM-104) |  |
| #85 | feat(SCRUM-106): trace a finalised item's production history from the Finalized page | feat(web): trace a finalised item's production history from the Finalized page (F5, SCRUM-106) |  |
| #86 | feat(SCRUM-108): show a task's releases on the Finalized page | feat(web): show a task's releases on the Finalized page (H6, SCRUM-108) |  |
| #88 | feat(SCRUM-126): an independent reviewer settles a held disagreement, except where adjudication is mandatory | feat(api,web,evaluation): an independent reviewer settles a held disagreement, except where adjudication is mandatory (E5, G2, SCRUM-126) | 137 chars |
| #89 | feat (SCRUM-91): add organization-scoped project creation | feat(api,web): add organization-scoped project creation (B1, SCRUM-91) |  |
| #90 | fix(SCRUM-104/105): the release gate's and manifest's review follow-ups | fix(api): the release gate's and manifest's review follow-ups (H2, H3, SCRUM-104, SCRUM-105) |  |
| #91 | feat(SCRUM-127): an administrator does not judge the work, and reading the work is a capability of its own | feat(api,evaluation): an administrator does not judge the work, and reading the work is a capability of its own (G1, SCRUM-127) | scope from git (api 57%, evaluation 29%, web 13%); GitHub listed only 100 files; 127 chars |
| #92 | docs(SCRUM-75): record I2-I5 evaluation findings and negative results | docs: record I2-I5 evaluation findings and negative results (I2, I3, I4, I5, SCRUM-75) | verification 2026-10-23: title and body cover I2 to I5 |
| #93 | SCRUM-125: Hardening export checks, CI, Compose secrets and explicit-ID concurrency | fix(api,web,db): harden export checks, CI, Compose secrets and explicit-ID concurrency (A1, A4, H5, SCRUM-125) | verification 2026-10-23: about 60% of the code lines are PostgreSQL work, as #24 |
| #94 | fix(SCRUM-129): remove the review chips that overwrote a judgement reviewer's verdict | fix(api,web): remove the review chips that overwrote a judgement reviewer's verdict (D3, SCRUM-129) |  |

## Applied (2026-10-23)

A subagent renamed the 83 PRs with `gh pr edit --title` only. Log: [`pr-title-apply-log.md`](pr-title-apply-log.md).
Before each edit it checked that the PR was MERGED and still had its old title: 83 renamed, 0 conflicts, 0 failures.

**Accepted by Claude on an independent re-read from GitHub:**
- all 83 titles match this table character for character;
- the 9 PRs outside the list (#1, #3, #5, #12, #15, #82, and the open #95, #96, #97) kept their titles;
- no PR body changed against the snapshot taken before the rename.

**Still to do:**
- **The three open PRs** (#95, #96, #97) still use `type(SCRUM-N): …`. Their authors should switch to this format
  before they merge.
- **`tech-stack.md`** describes the commit headline only. The PR title format could be added beside it, and the
  team told.

## The open PRs, renamed the same day

`tech-stack.md` (Branches and pull requests → PR title) now holds the format. Then the three PRs that were open
were renamed by Claude, and each was read back and matched:

| PR | New title | Scope evidence |
| --- | --- | --- |
| #95 | `feat(seed): seed one project per governance model, on real AG News and Civil Comments records (A3, SCRUM-130)` | its own 3 commits: seed 70%; the "api" lines are seed fixtures and seed-assert tests |
| #96 | `fix(seed): seeded classification answers open with their class in the work panel (A3, SCRUM-131)` | 1 commit: seed scripts and seed tests; 4 lines of `review_corrections.py`. Story from its body ("Story A3, ticket SCRUM-131") |
| #97 | `refactor(web): every page tidied for the people using it, with role-correct views and seven bugs fixed (SCRUM-128)` | 42 commits: web 97%. SCRUM-128 maps to no story, as intended |

**#95 merged before its rename,** between the base check and the edit. Its merge commit keeps the old title; only
GitHub shows the new one.
