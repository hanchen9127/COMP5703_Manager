# New W11 ticket — the repository names stories and PRs, not Jira tickets (2026-10-23)

**Decided by Hanchen (2026-10-23):**
- Every `SCRUM-N` in code and docs becomes the **story id and the PR number**, written `#N`, with **no commit SHA**.
  The repository gains a SCRUM → story → PR table, because commit messages and PR titles keep their `SCRUM-N` and
  can't be rewritten.
- **The stories themselves are handed over as Hanchen's `user-stories.html` and `story_src.csv`**, not copied into
  the repository. The table points there.
- Text a platform user reads names no id. **Text developers read** (CLI help, harness errors, the baseline note)
  **may use the story id.**
- **All of it waits until the open PRs have merged** (#89, #91, #95, #96, #97), in one change.
- The casebook's `covers` uses **story ids or story criteria** (`H3`, `H3.2`) in place of tickets.
- **W11, assignee left open.**

**Why.** The team that takes over will most likely not get our Jira board. It will keep using the story ids, which
can be extended (A1–K4, then new ones). Today a `SCRUM-N` in the code points at nothing they can open.

**Checked 2026-10-23 on `main` `d14de29`** (after #93). Working files:
`C:\Users\WHC\AppData\Local\Temp\claude\d--COMP5703-Capstone\c8774de6-8527-4ee6-9c28-6ecb54da5e0b\scratchpad\scrum-classification.txt`
and `...\scrum-to-pr-story-map.txt`.

| What holds a `SCRUM-N` | Occurrences |
| --- | --- |
| Code comments | 515 |
| Docstrings | 477 |
| Markdown docs (ADRs 165, `docs/design` 212, `evaluation-findings.md` 46, …) | 468 |
| Casebook `covers` (data the harness checks) | 54 |
| Web test names (`describe` / `it`) | 41 |
| String literals (an API error, an OpenAPI description, CLI help, …) | 28 |
| Workflow comment, `baseline.json` note | 2 |
| **Total** (379 files, 72 tickets) | **1585** |

The open PRs will add more; the ticket counts again when it starts.

- **Ticket → PR:**
  - 58 of the 72 tickets name exactly one merged PR.
  - 4 name several: SCRUM-1 (#20, #21), SCRUM-2 (#20, #22), SCRUM-48 (#33, #35), SCRUM-104 (#84, #90).
  - 10 have no PR: the epic SCRUM-80; SCRUM-28, 29, 84, 86 and 94; and SCRUM-36, 39, 58 and 62, which are not in
    `Jira.csv`.
- **Ticket → story:** 67 of the 72 have a story. SCRUM-80, 36, 39, 58 and 62 don't.
- **User-visible:** two references reach users. `release_gate.py:232` puts "SCRUM-37" in an API refusal. The
  `review_actions.py:41` field description puts "SCRUM-32" in the OpenAPI docs.
- **Casebook:**
  - `scenario.py`'s `COVERS` pattern accepts `defect N`, `SCRUM-N` and `[A-J]n.n`;
  - `REQUIRED_COVERAGE` keys four tickets (SCRUM-85, 116, 117, 120);
  - `baseline.json` stores verdicts only, so no verdict changes.
- **The story ids are not in the repository.** 52 files already say "story X1", but no file in `hej` defines one.
  `docs/governance/requirements.md` is the client's own requirements. The handed-over backlog defines them.
- **PR numbers repeat in `main`'s history.** It holds 53 merges of `arcintelligence` PRs as well as our 83, and at
  least 30 numbers between #13 and #72 occur in both. The table's header says `#N` means
  `USYD-CS-Capstone/hej`.

---

## Board steps

| Field | Value |
| --- | --- |
| Type | Task |
| Sprint | **W11** |
| Assignee | **Open** |
| Story points | **3** suggested: one sweep of about 400 files, a rule per reference, and a harness change |
| Linked | "is blocked by" SCRUM-91 (#89), SCRUM-127 (#91), SCRUM-130 (#95), SCRUM-131 (#96), SCRUM-128 (#97) |

## Summary

```
Handover: Name stories and PRs instead of Jira tickets in code and docs
```

## Description

```
{noformat}Not tied to one user story: it makes every story's references readable without our Jira board.

BACKEND + WEB + DOCS. W11. Added 2026-10-23 (Hanchen).

The team that takes over will most likely not get our Jira board, and will keep using the story ids (A1–K4 and on). On main at d14de29 the code and docs name Jira tickets 1585 times (379 files, 72 tickets): comments 515, docstrings 477, markdown 468, casebook covers 54, web test names 41, string literals 28. Replace each with the story and the PR that built it. Start only when #89, #91, #95, #96 and #97 have merged (or closed), so no open PR has to resolve the sweep; count again then.

# One new file, docs/handover/ticket-map.md: one row per SCRUM ticket ever named in the repository, commit messages and PR titles included: ticket, title, story, PR(s). Its header says the story ids and their criteria (H3.2) are defined in the backlog handed over with the project (user-stories.html and story_src.csv), and that #N means a pull request on USYD-CS-Capstone/hej; main's history also holds arcintelligence PR merges with the same numbers.
# The rule, everywhere else: SCRUM-N becomes its story and PR, e.g. (H3, #83). A ticket with several PRs names each (#84, #90). A ticket with no PR names its story alone. A ticket with no story (SCRUM-80, 36, 39, 58, 62) is rewritten to say what it means. Where the line already names the story ("SCRUM-45, J4 criterion 2"), only the ticket goes ("#80, J4 criterion 2").
# Text a user reads names no ticket and no PR: release_gate.py's refusal (SCRUM-37) and the review_actions.py field description (SCRUM-32) say what they mean without an id. The evaluation CLI help and the baseline note may use the story id.
# Casebook: COVERS accepts a story (H3) and a story criterion (H3.2), A to K, and no longer SCRUM-N. Each covers entry becomes the criterion its ticket implements, or the story where no single criterion fits. REQUIRED_COVERAGE's SCRUM-85, 116, 117 and 120 become their criteria. Update evaluation/README.md, `evaluation list --coverage` and test_evaluation_runner.py with them. baseline.json keeps every verdict; only its note changes.
# Comments, docstrings, ADRs, design docs, evaluation-findings.md and test names (pytest docstrings, Vitest describe/it) follow the rule. ADR files keep their names and numbers.

Done when `git grep -E 'SCRUM-[0-9]+'` on main finds only docs/handover/ticket-map.md; the full backend suite (SQLite and PostgreSQL), test:web and typecheck pass; `python -m evaluation run --baseline evaluation/baseline.json --exact` reports every verdict unchanged; and `evaluation list --coverage` lists the same protections as before, under their story names.

Collaboration:
- Every open PR's owner: merge first; this change then touches your files after you.
- SCRUM-75 (I5, Kanishka): evaluation-findings.md is her record; the sweep changes its references only.{noformat}
```

---

## Open points for Hanchen

- **Decide on 27 Oct: the fallback if a PR is still open.** W11 ends 28 Oct. If #97 or the #95/#96 stack hasn't
  merged by 27 Oct, either start anyway and leave their files to their owners, or move the ticket past W11.
- **The handover package** must then carry `user-stories.html` and `story_src.csv`, since the repository's story
  ids point there. That belongs to the handover itself, not to this ticket.
