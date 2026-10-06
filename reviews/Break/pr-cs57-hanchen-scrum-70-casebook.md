## Summary

SCRUM-70, story I2: the casebook's structure and one case or more for each adversarial category the brief names. **Stacked on #39** (SCRUM-68), so the base is `CS57-Jingwei`. When #39 merges, I'll retarget this to `main`.

**Ready for review, except commit 4 of the plan:** outcomes that read the export wait for @Jingwei-Lin's OK on the shape in my #39 review, comment 1, and will come as one more commit here. Everything else is in.

`list --coverage` now reports **7 of 7** categories covered. That counts **written** cases, not passing ones. EV-010 runs today. EV-011 to EV-017 state the outcome the platform owes and are skipped until their surfaces land, each naming what it waits for. No case asserts today's wrong behaviour as correct.

## Commits

| Commit | What it adds |
| --- | --- |
| `712fc92` | A fixed list of categories: the brief's seven adversarial ones, `smoke`, `workflow`, `ai_assist`, `policy` (the categories EV-000 to EV-003 use), and `regression` (a bug's case). An unknown category makes the case invalid. `list --coverage` counts cases per adversarial category and exits 1 while any has none |
| `96d5e70` | Gold records. An item can be `{ gold = "ag_news:train:0090" }`, and its text comes from `evaluation/gold/<dataset>.jsonl`. Those files hold only the records the cases use, copied byte for byte from Group A's delivery. The reference label never reaches the API or the AI (R1-1) |
| `4b07f31` | `skip = "what it waits for"`, and planned steps. A skipped case is still checked in full but never run. It is reported as SKIP, pytest marks it skipped, and the exit status ignores it. Planned steps are checked for shape and allowed only in a skipped case |
| `7aa7182` | A `reopen` step (`POST …/task-items/{id}/reopen`, #46). The test drives a reviewer's refused reopen (403), the owner's reopen, and a second round |
| `2868f5c` | **EV-010**, runnable: the AI says World at 0.97 on an Olympics story (gold: Sports); a reviewer rejects it; the item is not finalised |
| `664cbab` | Planned outcome keys `authoritative`, `answer` and `answers` (see "Decisions for review") |
| `1ca1fd5` | **EV-011 to EV-017**, skipped (table below), plus AG News record 0074 for EV-013 |
| `9143da5` | README (categories, gold, the skip rule, planned steps and keys) and an amendment to ADR 006 |

`a0b2007` and `a05d147` merge `main` and then `CS57-Jingwei` back in. The second merge changes no file, and it leaves this PR one merge base with #39, so the diff shows only this PR's 21 files.

## The cases

| Case | Category | Runs now? | Waits for |
| --- | --- | --- | --- |
| EV-010 | `confidently_wrong_ai` | **yes** | |
| EV-011 | `confidently_wrong_ai` | skip | #38 (a person answering after a rejected AI pass is refused with 409 today), H4 |
| EV-012 | `ambiguous_item` | skip | SCRUM-99 (Reject) and the scope answer on #40; it assumes option A |
| EV-013 | `reviewer_disagreement` | skip | SCRUM-51, 101, and the review-panel rule (D3 in your proposal) |
| EV-014 | `guideline_changed` | skip | F2 (SCRUM-53) |
| EV-015 | `missing_provenance` | skip | F1 (SCRUM-98), H1 and H3 |
| EV-016 | `unreviewed_in_release` | skip | H1 and H3 |
| EV-017 | `superseded_in_release` | skip | H4 (SCRUM-37) and H1 |

**Where a skipped case's steps run today, its skip reason was checked by running them without the skip:**
- EV-011: the annotation is refused with 409 at step 2.
- EV-013: in both orders, the first return decides; the item is `returned`, not `disputed`.
- EV-014 and EV-017: everything except the planned parts passes today.
- EV-016: today's export succeeds and leaves the unreviewed item out, silently.

## Changes by layer

All the changes are in `apps/hej-api/evaluation/`, its tests and ADR 006. No product code changes.

- **`harness/scenario.py`**
  - the category list;
  - gold resolution;
  - `skip`;
  - the planned steps and planned outcome keys, with their shape checks;
  - `reopen` in the step vocabulary.
- **`harness/runner.py`**: a skipped case returns before any database is built. The summary reads "N/M cases passed, K skipped", and the report has `skipped`.
- **`harness/driver.py`**: `_do_reopen`.
- **`__main__.py`**: `list --coverage`, and exit 0 when every case passed or was skipped.
- **`gold/`**: `ag_news.jsonl` (9 records), `civil_comments.jsonl` (1), and a README naming the source and the ids.

## Decisions for review

- **Planned outcome keys, ahead of your OK on comment 1.** EV-011, 012, 014 and 017 needed to say which answer an item resolves to. The keys use the names proposed on #39: `authoritative`, `answer`, `answers`. They are **planned only**: checked for shape and allowed in skipped cases. The runner doesn't read the export yet, and nothing that runs uses them. If you want a different shape, renaming them touches only the loader, four case files and a test. Commit 4 makes them real once you agree.
- **One addition to the proposal: `authoritative = false`.** It means the item has no authoritative answer, which is what an expert's Reject leaves (EV-012). I used a boolean rather than a reserved string like `"none"`, because aliases may be any lower_snake_case word.
- **`answers` is stated in no case yet.** Whether a rejected or superseded version counts in the export depends on #47's rules and H4, so I left it out rather than guess.
- **409 for a refused release** (EV-015, 016) is provisional. It matches how the API refuses a request the item's state forbids, and H3 settles it.
- **The legacy `adjudicate` still runs.** EV-001 uses `decision = finalize | send_back`. The new shape (`outcome = accept | return | reject`, `accept`, `reason`) follows your `POST /disputes/{id}/adjudication` and stays planned until SCRUM-99 moves EV-001 onto it.
- **ADR 006 gets an amendment (decisions 5–8), not a new ADR.** It's your ADR, so tell me if you'd rather have a separate one. Its consequences say plainly that coverage counts written cases, not passing ones, and that a skip proves nothing.

## Testing

- Full suite on SQLite: 921 passed, 15 skipped. 8 of the skips are PostgreSQL-only tests, and 7 are EV-011 to EV-017.
- The casebook on SQLite and on PostgreSQL (`--database-url`, a throwaway schema): 5/5 passed, 7 skipped.
- `list --coverage`: 7 of 7, exit 0.
- Mutation checks:
  - EV-010 with an accept instead of a reject fails at step 2;
  - EV-010 expecting the AI's answer finalised on arrival fails at step 1;
  - EV-012 without its skip is refused, naming its two planned steps and its planned key;
  - the reopen test with the route path broken fails on 404 rather than passing as a 403.

## Notes for reviewers

- @Jingwei-Lin: comment 1 on #39 is the one thing this PR waits for.
- Case ids EV-010 to EV-019 are this PR's. New cases can take EV-004 to EV-009, or EV-020 onwards.
- Bug fixes bring a `regression` case, and the bug's ticket names it (README, "Categories"). SCRUM-120's fix (#50) could add one now.

## Known limitations

- Coverage counts written cases. Six of the seven categories are covered by skipped cases only.
- A case's guideline version, a release's refusal naming its items, and an unresolved item's kept reasons can't be stated yet. Each case's comment says what its surface's ticket should add.
- When only skipped cases run, the summary reads `0/0 cases passed, 7 skipped`. It's accurate, but awkward to read.
- From #39, not changed here: an invalid `--database-url` reports a harness error for every case, then raises in `write_report`.
