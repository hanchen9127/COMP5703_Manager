# Merged PR titles: verification of the proposal (2026-10-23)

Checked against `pr-title-unification.md` / `pr-titles-proposed.json` (82 rows). Evidence came from
`gh pr view` (title, body, branch, commits, review comments), the merge-commit diffs on `origin/main`
(`git diff <merge>^1 <merge> --numstat`), `story_src.csv` (`scrum` column) and `Jira.csv` (summary,
description, assignee). Nothing on GitHub or in the repo was changed.

## Verdict

I agree with **70 of the 82 rows as proposed**. **12 need a change**: 8 are missing tickets (and stories),
because the board does have tickets for #9, #10, #11, #14, #16, #17, #27 and (probably) #31; 3 have the
wrong scope (#35, #67, #93); and 1 lists only part of a story range (#92). The markdown table and the JSON
match row for row. Every proposed title has the right shape, with no `(API)`/`(WEB)` left, no double
spaces, and stories before tickets. Separately, **#4 is not a `main`-sync merge**. It is Jingwei's
role-based permission work (SCRUM-44) and needs a row of its own, which makes 83 rows.

## Rows to change

| PR | Proposed title | Corrected title | Reason and evidence |
| --- | --- | --- | --- |
| #9 | fix(api): repair the task update route and service | fix(api): repair the task update route and service (B5, G4, SCRUM-22, SCRUM-23) | Ticket missing. The diff does exactly two things in `routes/tasks.py`: `TaskItemStatusUpdate.status: str` becomes `TaskItemStatus`, so a nonsense status is rejected (SCRUM-22 "Validate task-item status before database commit", G4, issue 10), and `register_dataset` gains `except HTTPException: raise`, so a lifecycle 409 is no longer turned into a 500 (SCRUM-23 "Preserve lifecycle conflict responses as HTTP 409", B5, issue 29). Dishank is the assignee of both tickets. Both were resolved on 14 Sep at 8:05/8:06 pm AEST, 7 minutes after #9 merged (09:58Z). |
| #10 | fix(api,seed): load .env and make init_data.py --reset re-runnable (A3, issues 23, 24a, 24b) | fix(api,seed): load .env and make init_data.py --reset re-runnable (A3, SCRUM-81) | Ticket missing. SCRUM-81 ("Schema: Fix db setup issues", A3) lists exactly *Issue 24* (`--reset` broken two ways: console encoding plus FK drop order) and *Issue 23* (`.env` ignored), the three defects #10 closes. #18, a follow-up by the same author, is already titled A3/SCRUM-81. With the ticket in place, the `issues.md` defect numbers can go: they are neither stories nor tickets, so they break the refs rule. |
| #11 | fix(api): make dataset registration transactional (issue 16) | fix(api): make dataset registration transactional (B5, SCRUM-34) | Ticket missing. SCRUM-34 has the summary "Task Lifecycle: Make dataset registration transactional" (the PR's title word for word) and the description "Story B5 … Issues 16". The assignee is Kanishka (the PR author). It was resolved on 14 Sep at 10:10 pm AEST, and #11 merged at 9:59 pm AEST. "issue 16" becomes the ticket, for the same reason as in #10. |
| #14 | *(unchanged)* fix(api): enforce project boundaries on task writes | fix(api): enforce project boundaries on task writes (G3, SCRUM-21) | Story and ticket missing. The PR body says "Implements Story **G3 — My work stays inside my project** and resolves **Issue 9**". SCRUM-21 is "Prevent cross-project task and task-item writes", with "Story G3 … Issues 9" and Jingwei (the author) as assignee. `story_src` maps G3 to SCRUM-21. |
| #16 | fix(api): restore the organisation invitation flow (G5) | fix(api): restore the organisation invitation flow (G5, SCRUM-8) | Ticket missing. `story_src` maps G5 to SCRUM-8. SCRUM-8 is "Organisation management: Invitation & acceptance", with "Story G5 … Issues 17, 18" and Tim (the author) as assignee. The PR body says "Fixes Story G5 and issues 17 and 18". |
| #17 | feat(api,web): add dispute send-back, structured review reasoning and optional Docker setup | feat(api,web): add dispute send-back, structured review reasoning and optional Docker setup (C5, E2, SCRUM-31, SCRUM-35) | Stories and tickets missing. The body has the sections "Story E2 — Send a disputed item back to the annotator" and "Story C5 — Record verdict, justification, and feedback", and "Closes #15" (issue 15). SCRUM-35 is "Implement 'Dispute & send back to annotator'" (E2, Issues 15). SCRUM-31 is "Review: Record verdict, feedback & justification" (C5), and one of the PR's commits is titled exactly that. Parth is the assignee of both. The scope stays `api,web`: the Docker files are 105 of 2,503 lines (4%), so no `db`. |
| #27 | feat(api,web): custom task and label definitions, label list upload, schema-driven AI output and label editing on the policy page | feat(api,web): custom task and label definitions, label list upload, schema-driven AI output and label editing on the policy page (SCRUM-95, SCRUM-96, SCRUM-97) | Tickets missing. Three SCRUM-6 subtasks match the PR's three headline features: SCRUM-95 "Add definition settings to labels field", SCRUM-96 "Enable label list file upload" and SCRUM-97 "enable custom task with user-defined instructions, output-type and schema". All three were created 20 Sep and resolved 21 Sep at 4:57 pm AEST, and #27 merged 21 Sep at 03:52Z (1:52 pm AEST). `story_src` maps none of them, so there is no story; C1 would come only through the parent SCRUM-6. |
| #31 | fix(api,web): add error_kind, error_code, error_type and error_message to the annotation metadata | fix(api,web): add error_kind, error_code, error_type and error_message to the annotation metadata (C2, SCRUM-3) | **Probable** ticket (Hanchen to confirm). The board has no ticket of its own for this, but the PR builds the transient/permanent/unknown failure classification that SCRUM-3's first criterion requires ("Classify each failure as transient … or permanent …, stored in ai_item_jobs.last_error_kind"). The review on #31 says "integration classifies, the queue decides … I'll delete my classifier and consume yours", and its change request cites "SCRUM-3's ticket lists 'bad schema, unsupported task' as permanent". If Hanchen does not take SCRUM-3 here, keep the proposed title without refs. |
| #35 | fix(api,web): follow-ups to #33: … (D8, SCRUM-48) | fix(api): follow-ups to #33: independence reads, AI-assisted routing, per-submission review queue, progress counts (D8, SCRUM-48) | Spurious `web`. #35's base was `CS57-KANISHKA`, which was behind `main`, and its head merged `main` twice (`53508fac`, `ea3cb71d`). Its merge diff, and GitHub's file list, therefore include #32 (SCRUM-5) and #34 (SCRUM-27), which is where the 1,196 "web" lines come from. #35's own 20 commits (`git log --no-merges <base>..<head> ^ea3cb71d^2`) total api 3,572, web 69 (one test plus a 15-line component change), db 19 and seed 11. That is 97% api. |
| #67 | feat(api,web,seed): seed a cast of named people and a test project for every feature (A3, SCRUM-123) | feat(web,seed): seed a cast of named people and a test project for every feature (A3, SCRUM-123) | Spurious `api` (a judgement call). The proposal's "api 24%" counts `tests/test_seed_test_projects.py` (338 lines, the test of `seed_test_projects.py`) and `fixtures/text/test_projects/*.json` (300 lines, the seed's data) as api. With the seed test counted as seed, api falls to 360 of 2,783 lines (13%). Without the fixtures, api app code is about 60 lines (`core/security.py`, `routes/init.py`, `core/permissions.py`), about 2%. Seed is 55% and web 32% (the organisation picker in `header-organization-actions.tsx` and others). |
| #92 | docs: record I2-I5 evaluation findings and negative results (I2, I5, SCRUM-75) | docs: record I2-I5 evaluation findings and negative results (I2, I3, I4, I5, SCRUM-75) | Partial story range. `story_src` maps SCRUM-75 to I5 only, and the "story the old title named" rule added I2, but the old title names the range I2–I5. The body says "the final evaluation findings record for stories I2–I5" and lists I2/SCRUM-71, I3/SCRUM-72, I4/SCRUM-73 and I5/SCRUM-74. Use either all four, as here, or I5 alone. I2 + I5 is neither. |
| #93 | fix(api,web): harden export checks, CI, Compose secrets and explicit-ID concurrency (A1, A4, H5, SCRUM-125) | fix(api,web,db): harden export checks, CI, Compose secrets and explicit-ID concurrency (A1, A4, H5, SCRUM-125) | Missing `db` (a judgement call, consistent with #24). Of 904 non-doc lines, the PostgreSQL work is `app/core/db_ids.py` (57 lines; its docstring is "Coordinate explicit and generated PostgreSQL IDs", using `pg_advisory_xact_lock`), `tests/test_explicit_id_postgres.py` (426), `repositories/db_store.py` (50) and `compose.yaml` (11). That is about 60%, and it is "database config / PostgreSQL support" by the vocabulary. What stays api (exports test, models, services) is about 20%, and web is 16%. CI is 34 lines (4%), so no `ci`, even though the title names it. |

### Missing row: #4

| PR | Current title | Proposed title | Reason and evidence |
| --- | --- | --- | --- |
| #4 | `Merge to main ` (trailing space; no body) | fix(api): enforce role-based permissions (G1, SCRUM-44) | It is not a sync. The head is `CS57-Jingwei` and the base is `main`. #3 is the `main` → `CS57-Jingwei` sync, and #4 is the feature going back. Its one feature commit is `55e23c9b "Fix: Role-based permission"`. It changes 1,522 lines: api 1,444 (`core/permissions.py` +177, permission checks in eight route modules, and the new `test_governed_action_permissions.py`, `test_governed_action_routes.py` and `test_role_separation_routes.py`), web 57 (4%), docs 23. SCRUM-44 is "Users can only perform actions that are permitted by their roles", with G1, "Issue 7" and assignee Jingwei. No other PR claims SCRUM-44, and `story_src` maps G1 to SCRUM-44. The type is `fix`, from the author's own commit. |

## Checked, no change recommended (for the record)

- **#24, C2 for SCRUM-94 is not a mapping error.** SCRUM-94's description starts "Related to user
  story C2. C2's job queue needs a second writer alongside the API, and SQLite serialises writers … Moving
  to PostgreSQL removes that ceiling before the 1,000-item batch". `feat(db)` is also right. By file path,
  api is 49%, but those 606 lines are `core/config.py` (the database URL), `db_store.py`, the new
  PostgreSQL/SQLite `conftest.py` fixtures and tests adapted to them. All of that is PostgreSQL support.
  CI is 5%.
- **#6, SCRUM-29 is confirmed.** The body says "Closes Story D2 … addresses Issue 8", and SCRUM-29 is "D2 …
  Issues 8".
- **Type changes.** #13 → fix (every commit is `fix(...)`), #17 → feat (all three commits are `feat:`), #43 →
  fix (its own five commits are fix/test; see the stacking note below), #65 → feat (the lead commit is
  `feat(api): freeze … immutable, hashed release`), #93 → fix (an explicit-ID concurrency bug fix and a
  frozen-release double count, plus CI/Compose tightening) and #24 → feat. I agree with all of them.
  **#60** is the one close call: the proposal infers `fix`, but the author's only commit is
  `feat(api): keep item status consistent with review history (SCRUM-109)`. The body describes
  divergence and a race condition being fixed, so `fix` is defensible. Hanchen may prefer the author's
  `feat`.
- **Scope on the 15% line, all consistent with the heuristic.** #34 has web 17% (the old title said
  API, and `api,web` is right). #75 has web 12% (the old title said API + WEB, and `api` is right). The
  other near misses stay out: #53 web 9%, #68 web 13%, #90 web 12%, #91 web 13%, #6 seed 12%.
- **Descriptions.** None drops or invents meaning. Second colons (#13, #35, #43, #68) are legal in
  Conventional Commits. "AI" as the first word (#20, #21) is an acronym, not a capital to lower.

## Rows I could not fully verify

- **#8.** It may also carry **A4/SCRUM-84**, and part of SCRUM-81. Removing Gemini deletes the committed
  Gemini API key from `app/core/config.py`, which is SCRUM-84's first criterion ("No live credential is
  readable in the source code"; assignee Yi Geng, whose commits #8 carries). The PR also contains Yi's
  commit `3b111e3a "Schema: Fix db setup issues"` (SCRUM-81's exact summary, but only 16 lines of
  `init_data.py`). The PR body claims neither, and no other PR claims SCRUM-84 (#93 only follows up the
  key rotation). I left the row as proposed. Hanchen should decide whether #8 is where SCRUM-84's code
  half landed.
- **#27, SCRUM-92** ("Update the annotation editing page so MVP output is compatible with Hej"). It was
  resolved in the same minute as SCRUM-95–97, and #27 routes custom tasks to the generic JSON editor.
  That is plausible, but the body does not name it, so I did not add it.
- **#31**: see the table. SCRUM-3 is inferred from the review thread, not stated by the author.
- **#61**: the body says "SCRUM-85, story B3, **plus story D8 subtask 2**". By the agreed rule (stories from
  the ticket mapping plus stories in the old title) D8 is not required, so I made no change. Add D8 if the
  body counts.

## Stacked PRs (affects how the line counts read; no title change)

Three PRs were merged into another feature branch, so their changes reached `main` through the parent
PR's merge commit:

- #23 (SCRUM-26) arrived through #19.
- #35 (SCRUM-48) arrived through #33.
- #44 (SCRUM-113) arrived through #43.

The parents' numstats therefore include the children's lines. In each pair the scope is the same, so no
scope changes. #43's diff on `main` does contain the SCRUM-113 work, but #44 has its own row with
SCRUM-113, so I would not add it to #43. The reverse case, a child whose numstat is inflated by `main`
merges, only happens in #35 (see the table).

## Coverage

- `gh pr list --state merged` returns 85 PRs. 85 minus #3, #4 and #15 is 82, the proposal's 82 numbers
  exactly, with no duplicates and none unmerged. The closed-unmerged PRs are #1, #5, #12 and #82, as
  stated. Open (not in scope): #95, #96, #97.
- #3 ("Merge main", `main` → `CS57-Jingwei`) and #15 ("Update progress from main", `main` →
  `CS57-Hanchen`) really are syncs. **#4 is not** (see above), and should be added.
- Every "current title" in the proposal matches GitHub, except that #73's live title has a trailing space.
  That does not matter, since the title is being replaced.
