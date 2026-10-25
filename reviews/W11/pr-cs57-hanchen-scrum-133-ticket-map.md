## Summary

SCRUM-133, part 1 of 3 of the handover sweep. Not tied to one story: the team that takes over will not have our Jira board, so a `SCRUM-N` in the repository points at nothing they can open. This part covers the docs and the evaluation casebook. SCRUM-135 (backend) and SCRUM-136 (web) start after it merges.

- **A ticket map.** `docs/handover/ticket-map.md` has one row per ticket ever named in the tree, in commit messages or in merged PR titles (102). Each row gives the title, the stories it served and the merged PRs that built it. Commit messages and PR titles keep their `SCRUM-N`; this table is how to read them.
- **The docs and the casebook name stories and PRs.** `SCRUM-N` becomes `(H3, #83)`. About 700 references are replaced: in the ADRs, the design docs, terminology, the runbook, `evaluation-findings.md`, the root README, the workflow comment, the evaluation harness, its cases and its tests.
- **A case covers a story criterion, not a ticket.** `covers` accepts `H3` and `H3.2` (A to K) and refuses `SCRUM-N`. Every case now names the criterion it protects.

## Commits

| Commit | What it does |
| --- | --- |
| `24567568` | `docs/handover/ticket-map.md`: 102 tickets. The header says where the stories are defined (the handed-over backlog), and that `#N` is a PR here, not an `arcintelligence` merge of the same number |
| `af3b6ac7` | `covers` also accepts a story and A–K criteria. The coverage listing sorts defects, then stories and criteria (a story before its criteria), then tickets. The old key put stories before defects, against its docstring |
| `720cd2fc` | The ADRs (24 files, 155 references; ADR 014 waits for #98). ADR 004's "the SCRUM-36 pull request" was PR #36 (B8) and now says so |
| `182dc5df` | **The casebook change.** 56 `covers` entries name a criterion, or a story where no single criterion fits. `REQUIRED_COVERAGE` keys become B3.2, D8.3, D8.8 and D9.2. `covers` refuses `SCRUM-N` |
| `23a1219e` | Design docs, terminology, runbook, root README, workflow comment (129 references), and the informal "Scrum 20" / "Scrum 50" that the search misses |
| `2f25f580` | `evaluation-findings.md` (46 references, nothing else), and `tech-stack.md`, whose link follows §12's new heading |
| `65a9fe37` | The harness, cases, READMEs, CLI help, baseline note and evaluation tests (287 references). Folded into one commit because the tests assert strings in `evaluation/` |
| `785931a1` | A plan's numbered decision says so: `(I3, #77, D8)` → `(I3, #77, decision D8)`. Since the sweep put story ids beside them, D1–D9 decisions read as stories |

## Decisions for review

- **The story a line is about.** 11 tickets served several stories (e.g. SCRUM-126: E5 and G2). A reference names the one its line is about: settling a held split is E5, the expert gate is G2. Only a line about the whole ticket names all of them. `ticket-map.md` lists all of them.
- **Deleted tickets keep their stories.** SCRUM-36, 39, 58 and 62 were deleted from the board on 2026-09-22 and replaced. The board's last text gives their stories, so they name the story; they had no PR.
- **What a case covers.** Each `covers` entry was mapped from the case's purpose and steps to the story's criteria, not from the ticket. A few cases protect another story's criterion: EV-017 the release's one current answer (H4.2), EV-040 the Return to the author (E2.2), EV-120 the self-review refusal (D1.1). The full table is below.
- **Coverage is checked by cases.** Every case listed before is listed after, and 16 of 16 owed protections are covered. Tickets that served one criterion now share a row (E2.2, G2.2, G2.3, H4.2). One ticket's cases spread over the criteria they test (SCRUM-74 → I5, I5.1, I5.2, I5.3).
- **The owed protections keep their meaning.** #61's answer shape is B3.2 (EV-050–052). EV-054, the fixed answer count, is B3, not B3.2. The decided-submission fix is D8.3 (EV-030). EV-120 is D1.1.
- **One `SCRUM-120` stays.** `test_evaluation_scenario.py` proves that `covers` refuses a ticket, so its data is a ticket. Every Done search may find `ticket-map.md` and that line.
- **Ticket criteria are not story criteria.** "SCRUM-74, criterion 4" (a non-zero exit) is not I5.4 (the findings record), so it names the PR. A ticket's subtasks name the story.
- **Developer text names the story alone:** CLI help, skip reasons and the baseline note. A skip waits for work that isn't built, so it names no PR.
- **Only the references change.** Claims that went stale before this PR are left as they were: the runbook's "no progress endpoint yet" (#32 added one); `workspace_surface_hierarchy.md`'s "until releases exist"; the "undecided" worker in `ai_batch_job_schema.md`; `domain_model.md`'s "no release entity".

<details><summary>Every covers mapping</summary>

| Case | Was | Now |
| --- | --- | --- |
| EV-011, 102, 103, 104 | SCRUM-122 | E2.2 |
| EV-013 | SCRUM-101 | E1.1 |
| EV-014 | SCRUM-53 | F2.2 |
| EV-015 | SCRUM-98, 105, 74 | F1.3, H3.3, I5.1 |
| EV-016 | SCRUM-105 | H3.2 |
| EV-017 | SCRUM-102 | H4.2 |
| EV-030 | SCRUM-116 | D8.3 |
| EV-031 | SCRUM-117 | D8.8 |
| EV-040 | SCRUM-103 | E2.2 |
| EV-042 / 044 | SCRUM-110 | D9.3 / D9.4 |
| EV-043 | SCRUM-120 | D9.2 |
| EV-050, 051, 052 | SCRUM-85 | B3.2 |
| EV-054 | SCRUM-85 | B3 |
| EV-069 | SCRUM-37 | H4.2 |
| EV-080 | SCRUM-87 | C4.2 |
| EV-105, 108 | SCRUM-73 | I4.4 |
| EV-106, 107, 109 | SCRUM-73 | I4.3 |
| EV-110 / 111 | SCRUM-73 | I4.5 / I4 |
| EV-112, 113, 114 | SCRUM-118 | G2.2 |
| EV-115 | SCRUM-118 | G2.6 |
| EV-116 | SCRUM-74 | I5 |
| EV-117, 121, 123 | SCRUM-74 | I5.1 |
| EV-118 | SCRUM-74, 98 | I5.1, F1.3 |
| EV-119 | SCRUM-74 | I5.2 |
| EV-120 | SCRUM-74, 116 | I5.2, D1.1 |
| EV-122 | SCRUM-74, 104 | I5.3, H2.3 |
| EV-124 | SCRUM-107 | G2.3 |
| EV-125 | SCRUM-126 | G2.1 |
| EV-126, 129, 130 | SCRUM-126 | G2 |
| EV-127 | SCRUM-126, 107 | G2.3 |
| EV-128 | SCRUM-126, 118 | G2.2 |
| EV-131, 132 | SCRUM-127 | G1.1 |

</details>

## Testing

- **Backend suite, SQLite:** 2557 passed, 63 skipped at `785931a1`. PostgreSQL runs in CI after the merge; this PR changes no schema or query.
- **Evaluation tests:** 428 passed, 2 skipped at each casebook commit.
- **Casebook:** `run --baseline evaluation/baseline.json --exact`: 87/87, 1 skipped, "88 unchanged. No regression", at each casebook commit. `baseline.json` changes its note only.
- **Coverage:** `list --coverage` lists the same 65 cases before and after; 16 of 16 owed protections covered.
- **The new tests fail without the change:** a story and a K criterion are refused, and the listing's order fails, on `main`.
- **References checked by script:** for each diff hunk, the PRs and stories written against the tickets removed, per `ticket-map.md`. Each exception was read: story-only lines, deleted tickets, ADR 004's #36.
- **The Done search:** `git grep -E 'SCRUM-[0-9]+' -- apps/hej-api/evaluation docs .github README.md 'apps/hej-api/tests/test_evaluation_*.py' ':!docs/design/backend/api_surfaces.md' ':!docs/design/product/workflow_states.md'` finds `ticket-map.md`, the refusal test's line and ADR 014 (below).

## Notes for reviewers

- The diff is wide (about 230 files) but shallow. The commits that change behaviour are `af3b6ac7` and `182dc5df`; the rest are references.
- @kanishkakathait: `evaluation-findings.md` is in its own commit (`2f25f580`), references only. Its provider-rotation item, "to be recorded on SCRUM-84", now stays open under A4.
- `apps/hej-api/tests/test_evaluation_*.py` moved from SCRUM-135 to this ticket: they test the casebook, and #98 touches none of them.
- For SCRUM-135 and 136: start from `ticket-map.md`; add any ticket it lacks.

## Known limitations

- **ADR 014 still names tickets.** #98 edits it, so it follows after #98 merges.
- `api_surfaces.md` and `workflow_states.md` are SCRUM-135's; `apps/hej-api` outside the casebook is SCRUM-135's; the web is SCRUM-136's.
- The plans of #77, #79 and #88 that number their decisions are not in the repository; only #73's description lists its decisions.
