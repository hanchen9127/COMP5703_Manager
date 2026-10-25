# Plan — SCRUM-133: Name stories and PRs instead of Jira tickets in docs

2026-10-24. Not tied to one story: part 1 of 3 of the handover sweep (part 2 SCRUM-135, backend; part 3 SCRUM-136,
web). Board: W11, Jason Wang (Hanchen), To Do. Ticket text: `../jira/jira-new-replace-scrum-references.md`.

**Branch:** `CS57-Hanchen-scrum-133`, worktree `D:\COMP5703_Capstone\hej-133`, from `origin/main` at `835b9d33`
(#99 merged; #97 merged; #98 open). The upstream is unset, so the first push needs `-u origin CS57-Hanchen-scrum-133`.

**Who does what:** each commit is made by a subagent in the worktree, which edits and runs the checks but never
stages, commits or pushes. Claude checks the result against this plan and writes the commit message to
`commits/scrum-133-<n>-<slug>.txt`. Hanchen commits by hand, and the next commit starts after that.

**Data:** `scrum-133-data/ticket-map-draft.tsv` (83 tickets on `main`: references in the tree, in this ticket's
scope, in casebook `covers`, in commit messages; story from `story_src.csv`, or from the PR title where the CSV
predates the ticket; PRs whose title names the ticket; Jira status and title). Built by
`../scripts/scrum-133-buildmap.py`. `scrum-133-data/coverage-before.txt` is `evaluation list --coverage` on
`835b9d33`.

## Scope on `835b9d33`

| Area | Lines | Files |
| --- | --- | --- |
| `docs/adr` (ADR 014 last, see commit 9) | 134 | 25 |
| `apps/hej-api/evaluation/cases` (56 `covers` entries, the rest comments) | 129 | 63 |
| `docs/design/database` | 81 | 5 |
| `apps/hej-api/evaluation/harness` | 70 | 10 |
| `apps/hej-api/tests/test_evaluation_*.py` (**added by Hanchen, 2026-10-24**) | ≈107 | 24 |
| `docs/evaluation-findings.md` (Kanishka's record, I5) | 39 | 1 |
| `apps/hej-api/evaluation/README.md`, `__main__.py`, `gold/README.md`, `baseline.json`, `__init__.py` | 41 | 5 |
| `docs/design/backend` (not `api_surfaces.md`) | 20 | 2 |
| `docs/terminology`, `docs/design/product` (not `workflow_states.md`), `docs/design/system`, the runbook | 13 | 4 |
| root `README.md`, `.github/workflows/backend-tests.yml` | 2 | 2 |

About 717 occurrences. 208 are a bare `(SCRUM-N)`, 25 are `(X1, SCRUM-N)` with the story beside it; the rest sit in
sentences and are rewritten by hand.

## Decisions

| Decision | Who, when | Why |
| --- | --- | --- |
| **A ticket with several stories names the story the line is about**, e.g. SCRUM-126 on settling a held split → `(E5, #88)`, on the expert gate → `(G2, #88)`. All of them only where the line is about the whole ticket. `ticket-map.md` lists every story | Hanchen, 2026-10-24 | Reads true at each place; 11 tickets have several stories (SCRUM-43, 50, 51, 52, 99, 107, 113, 116, 124, 125, 126) |
| **`apps/hej-api/tests/test_evaluation_*.py` move from SCRUM-135 to this ticket** | Hanchen, 2026-10-24 | They test the casebook; the `covers` change already edits `test_evaluation_runner.py` and `test_evaluation_scenario.py`; #98 touches none of them. Board text below |
| **"Lists the same protections as before" is checked by cases**: every case listed before is listed after, and every owed protection is still covered. Two tickets that become one criterion may share a row; the PR lists each merge | Hanchen, 2026-10-24 | Keeping names one-to-one would force some entries back to the story level only to avoid a clash |
| **The refusal test keeps its `"SCRUM-120"`** (`test_evaluation_scenario.py:692`), as a recorded exception: every Done grep may find `ticket-map.md` and that one line | Hanchen, 2026-10-24 | It is test data, not a reference: it proves `covers` refuses a ticket. Building the string to dodge the grep would bend the test to the check |
| **Decision ids that read as stories get a prefix**, in this ticket, no follow-up ticket: "(I3, #77, D8)" → "(I3, #77, decision D8)" | Hanchen, 2026-10-24 | Plans' numbered decisions (D1–D18, D4') sit beside story ids since the sweep, and D1–D9 are also stories. Only #73's description lists its decisions |
| Only merged PRs count. A closed PR (#12, #82) is not named | Claude | It built nothing on `main` |
| The map lists every ticket on `main` (83) and in a merged PR title (15 more), plus SCRUM-121 (A6, #98, open), and this sweep's SCRUM-133, 135 and 136, whose PR titles will name them | Claude | "Every SCRUM ticket ever named in the repository, commit messages and PR titles included" |
| Commit messages of this branch keep the ticket: `docs(adr): ... (SCRUM-133)` | Claude | Commit messages and PR titles keep their `SCRUM-N`; the map is how they are read |

## The rule (all three tickets)

- `SCRUM-N` → its story and PR: `(H3, #83)`. Several PRs: `(H2, #84, #90)`. No PR: the story alone, `(D1)`.
- No PR, because the ticket was deleted from the board on 2026-09-22 (commit 1 found their stories): SCRUM-36
  (E1, E3, E4, E5, E6), SCRUM-39 (F1, F5), SCRUM-58 (E3), SCRUM-62 (F1). Name the story the line is about. Where the
  line is about the replaced ticket's work, the replacement's PR may be named (SCRUM-58 → SCRUM-99, #48; SCRUM-62
  → SCRUM-98, #70).
- **ADR 004's "the SCRUM-36 pull request" is PR #36** (B8, SCRUM-112), not the ticket: commit 6 writes `#36`.
- No story (SCRUM-80, 128, 133, 135, 136): say what it means. SCRUM-80 is the evaluation epic: "the evaluation
  harness and casebook (I1–I5)".
- Where the line already names the story, only the ticket goes: "SCRUM-45, J4 criterion 2" → "#80, J4 criterion 2".
- Where the sentence uses the ticket as a noun ("what SCRUM-71 owes", "since SCRUM-73"), rewrite it around the story
  or the PR ("what I2 owes", "since #73"). Don't leave "the ticket" where a reader can't tell which.
- Text a user reads names no ticket and no PR. Developer text (CLI help, harness errors, the baseline note) may name
  the story.
- Don't change meaning, wording beyond the reference, line wrapping of untouched lines, or anything that isn't a
  reference. ADR files keep their names and numbers.

## Commits

### 1. `docs(handover): a ticket map from each Jira ticket to its story and PR (SCRUM-133)`

One new file, `docs/handover/ticket-map.md`.
- Header: why it exists (the next team has no Jira board); the story ids and their criteria (`H3.2` = story H3,
  criterion 2) are defined in the backlog handed over with the project, `user-stories.html` and `story_src.csv`;
  `#N` is a pull request on `USYD-CS-Capstone/hej`, and `main`'s history also holds `arcintelligence` PR merges
  with the same numbers; commit messages and PR titles keep their `SCRUM-N`, and this table is how to read them.
- One row per ticket, by number: ticket, title (the board's summary without its "Task:" prefix), story or stories,
  merged PR(s). A ticket with no story says what it was; a ticket with no PR says "—".
- Source: the draft TSV, checked against `gh pr view` for the 10 multi-PR tickets and the six with no PR.

**Check:** 87 rows; every ticket `git grep` and `git log` find on `main` has one; no closed PR named; spot-check 10
rows against the PR titles.

**Review (2026-10-24, Claude):** the 87 rows passed `../scripts/scrum-133-check-map.py`. Changed:
- **102 rows.** GitHub's merge commits carry no PR title, so 15 tickets named only in merged PR titles were
  missing (SCRUM-8, 21, 22, 23, 31, 34, 35, 44, 82, 90, 92, 95, 96, 97, 115). SCRUM-92, 95, 96 and 97 are subtasks
  of SCRUM-6, so their story is C1;
- SCRUM-36, 39, 58, 62 carry the stories the board gave them before they were deleted;
- SCRUM-80's story column lists I1–I5;
- the ADR 004 sentence left the map (see the rule above).

### 2. `feat(evaluation): a case may cover a story or a story criterion, A to K (SCRUM-133)`

Additive only, so every case still loads. `harness/scenario.py`: `COVERS` accepts `[A-K]n` and `[A-K]n.n` beside
`defect N` and `SCRUM-N`; the comment above it and the `covers` error message say so. `__main__.py`'s sort
(`_by_kind_and_number`) orders defects, then stories and criteria by letter and number, then tickets.

**Tests:** `test_evaluation_scenario.py` loads `"H3"`, `"H3.2"`, `"K4.1"`, refuses `"L1"` and `"H3."`;
`test_evaluation_runner.py`'s listing test orders a story before its criteria.

### 3. `refactor(evaluation): each case covers the criterion its ticket built, not the ticket (SCRUM-133)`

- **Before editing, a table** in the subagent's report: every `covers` entry naming a ticket (56, in 49 cases) →
  the criterion it protects, from the case's `purpose` and the story's criteria (`story_src.csv`), or the story
  where no single criterion fits, with a reason per line. Starting points, to be decided per case:

  | Ticket | Story | Likely criteria |
  | --- | --- | --- |
  | SCRUM-74 (9) | I5 | I5.1 provenance, I5.2 roles, I5.3 rebuild |
  | SCRUM-73 (7) | I4 | I4.3, I4.4, I4.5 |
  | SCRUM-126 (6), 107 (2) | E5 / G2 | G2.2, G2.3, E5.2 |
  | SCRUM-118 (5) | G2 | G2.2 |
  | SCRUM-85 (4) | B3 | B3.2; EV-054 (fixed annotator count) may be B3 |
  | SCRUM-122 (4) | E2 | E2.2 |
  | SCRUM-98, 127, 110, 105, 116 (2 each) | F1, G1, D9, H3, D1/D8 | per case |
  | SCRUM-87, 53, 37, 120, 117, 104, 103, 102, 101 (1 each) | C4, F2, H4, D9, D8, H2, E6, H1, E1 | C4.3, F2.2, H4.1, D9.2, D8.8, H2.3, E6.3, H1.2, E1.1 |

- `REQUIRED_COVERAGE`: SCRUM-85, 116, 117 and 120 become the criteria their cases now name; the comment above it
  ("What SCRUM-71 says the casebook owes") names I2.
- `COVERS` drops `SCRUM-N`. The `covers` error example, `evaluation/README.md`'s `covers` lines (`:41`, `:52`, `:169`)
  and the listing header ("What the cases protect (SCRUM-71):") follow.
- Tests that state `SCRUM-N` as a `covers` value (`test_evaluation_runner.py:241`–`:262`,
  `test_evaluation_scenario.py:672`–`:674`) use criteria; one new assertion that `"SCRUM-120"` is refused.

**Check (Claude):** `evaluation list --coverage` against `coverage-before.txt`: the same case ids appear, every
owed protection is covered ("16 of 16", or fewer rows if two merged, each named in the report); `evaluation run
--baseline evaluation/baseline.json --exact` unchanged; `pytest tests/test_evaluation_*.py` passes.

### 4. `docs(evaluation): the harness and casebook name stories and PRs (SCRUM-133)`

The rest of `apps/hej-api/evaluation`: case comments, `harness/*.py`, `__main__.py` help strings and docstrings,
`__init__.py` (the epic SCRUM-80), `README.md`, `gold/README.md`, `baseline.json`'s note and the note
`__main__.py` writes into a new baseline (`:401`, same text). `baseline.json` keeps every verdict.

**Check:** `git grep -E 'SCRUM-[0-9]+' -- apps/hej-api/evaluation` finds nothing; casebook `--exact` unchanged;
evaluation tests pass.

### 5. `test(evaluation): the evaluation tests name stories and PRs (SCRUM-133)`

`apps/hej-api/tests/test_evaluation_*.py`: docstrings, comments, test data that isn't a `covers` value. A skip
reason in test data (`"Waits for SCRUM-99 (Reject)."`, `SKIP_REASON`) names the story, and its assertion follows.

**Check:** `git grep -E 'SCRUM-[0-9]+' -- 'apps/hej-api/tests/test_evaluation_*.py'` finds nothing; those tests
pass.

### 6. `docs(adr): the ADRs name stories and PRs (SCRUM-133)`

`docs/adr/*` except `adr014_review_and_submission_state_history.md` (#98 edits it). 24 files, 124 lines.

### 7. `docs: the design docs, terminology and runbook name stories and PRs (SCRUM-133)`

`docs/design/database`, `docs/design/backend` (not `api_surfaces.md`), `docs/design/product` (not
`workflow_states.md`), `docs/design/system`, `docs/terminology`, `docs/fe-be-local-integration-runbook.md`, the
root `README.md` (`:444`, SCRUM-123 → A3, #67) and the backend-tests workflow comment (`:61`, SCRUM-70).

### 8. `docs: the evaluation findings name stories and PRs (SCRUM-133)`

`docs/evaluation-findings.md` only, its references and nothing else: it is Kanishka's record (I5, #92). Its own
commit, so she can check it alone.

### 9. `docs(adr): ADR 014 names stories and PRs (SCRUM-133)`

**After #98 merges**: merge `main` into the branch first. #98 adds one reference there. If #98 is still open when
the rest is ready, open the PR without this commit and add it after.

## As built (2026-10-24)

Since 2026-10-24 Claude commits and pushes each commit once it has checked it (Hanchen: "帮我commit push然后直接启动下一个commit的subagent直到完成这个ticket").

| # | Commit | Notes from review |
| --- | --- | --- |
| 1 | `24567568` | 102 rows; see "Review" under commit 1 |
| 2 | `af3b6ac7` | The old sort put stories before defects, against its docstring; fixed with the new key |
| 3 | `182dc5df` | Claude changed two of the subagent's mappings: EV-054 → B3 (the answer count, not the result's shape) and EV-120 → D1.1 (the self-review refusal). Under the decision by cases, owed B3.2 keeps EV-050–052 and D8.3 keeps EV-030. Rows that merged: E2.2, G2.2, G2.3, H4.2 |
| 6 | `720cd2fc` | Claude reworded five lines: #62's "ticket", ADR 010's Story line, the unmerged commit "(D8, #49)", "#81, for E5", and ADR 006's "seven evaluation tickets" |
| 7 | `23a1219e` | The informal "Scrum 20" / "Scrum 50" (ADR 001, 002, terminology, domain relations, `docs/implementation/prs`) → B2 (#25), #37; the SCRUM-N grep doesn't find them. "Implements **#20, #21**" → "Designs the job tables #20 and #21 built" |
| 8 | `2f25f580` | `tech-stack.md` is in this commit: its link follows §12's new heading. "Record on SCRUM-84" → "open under A4" |
| 4+5 | — | **Merged into one commit**: tests assert strings in `evaluation/` (skip reasons, the baseline note), so a commit 4 alone would fail |

**PR #100, draft, opened 2026-10-24** (Hanchen asked for a draft) with commits 1–8 and 10; description
`../../../reviews/W11/pr-cs57-hanchen-scrum-133-ticket-map.md`. CI's sqlite job is skipped on draft PRs. **With commit
9, after #98 merges:** `ticket-map.md` gives SCRUM-133 its PR (#100), and SCRUM-121's `#98 (open)` loses "(open)",
together with its header sentence. The board renamed four tickets after commit 1 (`Jira.csv` of 2026-10-24 19:27):
SCRUM-121 "Performance: Reads never write, and the project and overview pages read once per organisation", and
SCRUM-133, 135, 136 "Handover1:", "Handover2:", "Handover3:" — the map's titles follow.

**For the PR description, claims found stale and left alone** (references only): the runbook's "no progress endpoint
yet" (#32 added one); `workspace_surface_hierarchy.md:677` "until releases exist"; `ai_batch_job_schema.md:16`
"undecided" worker; `ai_batch_execution_architecture.md` "#24 being answered"; `domain_model.md:341` "no release
entity".

**For SCRUM-135 and SCRUM-136:** "Scrum 20" in `tests/test_project_policy_read_contract.py:126` (135); the web test
`project-policy-section.test.tsx:235` checks that "Scrum 50" is *not* shown, which is not a reference (136, leave).

## Validation

1. The Done grep, on the branch:
   `git grep -E 'SCRUM-[0-9]+' -- apps/hej-api/evaluation docs .github README.md 'apps/hej-api/tests/test_evaluation_*.py' ':!docs/design/backend/api_surfaces.md' ':!docs/design/product/workflow_states.md'`
   finds only `docs/handover/ticket-map.md` and the refusal test's `"SCRUM-120"` (`test_evaluation_scenario.py`,
   decision above).
2. `uv run python -m evaluation run --baseline evaluation/baseline.json --exact`: every verdict unchanged.
3. `evaluation list --coverage` against `coverage-before.txt`, by cases (decision above).
4. The backend suite on SQLite; PostgreSQL through CI.
5. Every story or PR written in a replacement agrees with `ticket-map.md` (Claude, by script over the diff:
   each removed `SCRUM-N` on a line, and the `#N` and story added on the same line).

## Board steps

- **SCRUM-133:** in the description's Casebook item, after "Update evaluation/README.md, `evaluation list
  --coverage` and test_evaluation_runner.py with them", add: "The evaluation tests (apps/hej-api/tests/
  test_evaluation_*.py) are in this ticket too (moved from SCRUM-135, 2026-10-24)." In Done, add
  `'apps/hej-api/tests/test_evaluation_*.py'` to the grep's paths.
- **SCRUM-133, 135 and 136, the "merges last" check:** `git grep -E 'SCRUM-[0-9]+'` on main finds only
  docs/handover/ticket-map.md and the refusal test's "SCRUM-120" in apps/hej-api/tests/test_evaluation_scenario.py,
  which proves covers refuses a ticket.
- **SCRUM-135:** Scope becomes "apps/hej-api except evaluation/ and tests/test_evaluation_*.py, which SCRUM-133
  takes (...)"; in Done, add `':!apps/hej-api/tests/test_evaluation_*.py'` to the grep.

## PR

- Title: `docs: name stories and PRs instead of Jira tickets in docs and the casebook (SCRUM-133)`.
- Into `main`, merge commit. Description per `tech-stack.md`; it lists the `covers` table from commit 3 and any rows
  of `list --coverage` that merged.
