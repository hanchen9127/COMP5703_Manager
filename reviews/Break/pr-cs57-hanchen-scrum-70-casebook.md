## Summary

SCRUM-70, story I2: the casebook's structure and the brief's adversarial categories. **Stacked on #39** (SCRUM-68), so the base is `CS57-Jingwei`. When #39 merges, I'll merge `main` in and retarget this to `main`.

**Draft: 3 of 8 commits so far.** I'm opening it now so @Jingwei-Lin can see the format extensions while they're small, because the format is his. Each commit stands on its own, and the casebook passes after each one.

The ticket asks for every category the brief names to have a case, including categories whose surface doesn't exist yet. Those cases are written now with the outcome the platform owes, and skipped with the reason. No case asserts today's wrong behaviour as correct.

## Done so far

| Commit | What it adds |
| --- | --- |
| `712fc92` | A fixed list of categories: the brief's seven adversarial ones, plus `smoke`, `workflow`, `ai_assist`, `policy` (the categories EV-000 to EV-003 use) and `regression` (a break bug's case). An unknown category makes the case invalid. `list --coverage` counts cases per adversarial category and exits 1 while any has none |
| `96d5e70` | Gold records. An item can be `{ gold = "ag_news:train:0090" }`, and its text comes from `evaluation/gold/<dataset>.jsonl`. Those files hold only the records the cases use, copied byte for byte from Group A's delivery. The reference label stays on the scenario and never reaches the API or the AI (R1-1) |
| `4b07f31` | `skip = "what it waits for"` and planned steps. A skipped case is still loaded and validated in full, but not run: no database is built and no request is sent. The runner prints SKIP with the reason, the JSON report counts skips, pytest marks the case skipped, and the exit status ignores skips. Planned steps are `edit_guideline`, `release`, `remove_provenance_event`, and `adjudicate` with `outcome`/`accept`/`reason`. Each is checked for shape, but allowed **only in a skipped case** |

## Still to come

| # | Commit | Waits for |
| --- | --- | --- |
| 4 | Outcomes can assert on what the export carries: which answer is authoritative, its content, how many answers | **Your OK on the shape in my #39 review, comment 1** |
| 5 | A `reopen` step (`POST …/task-items/{id}/reopen`, #46) | none |
| 6 | EV-010: a confidently wrong AI answer is rejected, not finalised (runs now) | none |
| 7 | EV-011 to EV-017, one or more per category, skipped until their surfaces land | none |
| 8 | README (the template, categories, gold, the skip rule), and a short amendment to ADR 006 | your view: amendment or new ADR |

**Case ids EV-010 to EV-019 are reserved for this PR**, so new cases from you can take EV-004 onwards without colliding.

## Changes by layer

All the changes are in `apps/hej-api/evaluation/` and its tests. No product code changes.

- **`harness/scenario.py`**
  - the category list;
  - gold resolution;
  - `skip`;
  - the planned-step vocabulary and its shape checks;
  - a three-way step check: a runnable step, a planned step in a skipped case, or invalid.
- **`harness/runner.py`**: a skipped case returns before any database is built. `CaseResult.skipped` keeps the reason, the summary line reads "N/M cases passed, K skipped", and the report has `skipped`.
- **`__main__.py`**: `list --coverage`, and exit 0 when every case passed or was skipped.
- **`gold/`**: `ag_news.jsonl` (8 records), `civil_comments.jsonl` (1 record), and a README naming the source and the record ids.

## Decisions for review

- **The legacy `adjudicate` still runs.** `decision = finalize | send_back` stays valid for EV-001. The new shape (`outcome = accept | return | reject`, `accept = "<alias or ai>"`, `reason`) follows your proposed `POST /disputes/{id}/adjudication`, and is planned until SCRUM-99. SCRUM-99 implements it and moves EV-001 onto it in its own PR.
- **A skip reason names every open decision, not only the missing surface.** For example, EV-012 (Reject leaves an item unresolved) assumes option A on #40. Its reason will name both SCRUM-99 and #40. Whoever un-skips a case checks its expectation against the decision first.
- **A skip is neither a pass nor a failure.** If skips failed the run, CI would stay red until H1–H4 land, and red would start to look normal.

## Testing

- Full suite on SQLite: 803 passed, 6 skipped. All 6 skips are the PostgreSQL-only tests that were skipped before this PR.
- The casebook on PostgreSQL (`--database-url`, a throwaway schema): EV-000 to EV-003 pass.
- Manual checks of the skip path with a temporary case, removed afterwards:
  - a skipped case with a `release` step: pytest `skipped` with its reason, and the CLI prints `SKIP` and exits 0;
  - the same case without `skip`: refused as invalid, naming the planned step, exit 2.

## Notes for reviewers

- The most useful things to review now are commits 1–3: the vocabulary and the rules about what a runnable case may contain.
- Comment 1 on #39 is the blocker for commit 4.

## Known limitations

- `list --coverage` reports 0 of 7 until commits 6 and 7 add the cases.
- `remove_provenance_event` is a harness fault injection, not an API call. It gets a real definition when F1 lands.
