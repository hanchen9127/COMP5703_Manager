## Summary

SCRUM-70, story I2: the casebook's structure and one case or more for each adversarial category the brief names. Round 2 answers @Jingwei-Lin's review of 5 Oct, makes the outcome keys real, and adapts to #48 (SCRUM-99, 100, 101), which merged first as agreed.

`list --coverage` reports **7 of 7** categories with a case, and **3 of 7 with a case that runs**: `confidently_wrong_ai` (EV-010), `ambiguous_item` (EV-012) and `reviewer_disagreement` (EV-013). The other four state the outcome the platform owes and are skipped, each naming what it waits for. No case asserts today's wrong behaviour as correct.

Base is `main` (#39 merged on 6 Oct, so the stacking is over).

## Commits

### Round 1 (5 Oct)

| Commit | What it adds |
| --- | --- |
| `712fc92` | A fixed list of categories: the brief's seven adversarial ones, `smoke`, `workflow`, `ai_assist`, `policy`, and `regression` (a bug's case). An unknown category makes the case invalid |
| `96d5e70` | Gold records: `{ gold = "ag_news:train:0090" }` takes the item's text from `evaluation/gold/`, records copied byte for byte from Group A's delivery. The reference label never reaches the API or the AI (R1-1) |
| `4b07f31` | `skip = "what it waits for"`, and planned steps: a skipped case is checked in full but never run |
| `7aa7182` | A `reopen` step (#46) |
| `2868f5c` | EV-010, runnable: a confidently wrong AI answer is rejected and not finalised |
| `664cbab` | The outcome keys `authoritative`, `answer`, `answers`, planned at first |
| `1ca1fd5` | EV-011 to EV-017, written and skipped |
| `9143da5` | README and an amendment to ADR 006 |

### Round 2 (8–11 Oct)

| Commit | What it changes | Answers |
| --- | --- | --- |
| `7119bdd` | Each case gets a `verdict`: `pass`, `fail` or `skip`. The summary and exit status read it; when nothing ran, the summary says so instead of `0/0` | Point 3 |
| `7153b23` | `list --coverage` prints each category's runnable count (`2  (1 runnable)`) and how many categories have a case that runs. The gate is unchanged (ADR 006, decision 5) | Point 4 |
| `3bf51ba` | CI's SQLite job runs `list --coverage` | Point 4 |
| `9154465` | The gold loader reads a BOM and skips blank lines; a bad line, a record without its text, or a repeated record is a case problem naming the file and line | Smaller point 1 |
| `7e931c2` | A successful reopen forgets the item's cached submissions; a refused one doesn't | Smaller point 2 |
| `c51a405` | The outcome keys become real: `[outcome]` reads the item's answers through the API as the task owner, and an `export` step states what it carries with `expect.items` | Comment 1 on #39 |
| `01ac534` | Merge of `main` with #48: `adjudicate` takes #48's shape (`submission`, `decision`, `note`), and the planned shape goes with its tests; EV-012 moves to it. R6's outcome test now expects the accepted answer to be authoritative, which #48 marks | — |
| `d7260f4` | Under `open_dispute`, the review that completes a split opens the dispute itself, and its response names it; a `review` step now keeps that id, so `adjudicate` can decide a dispute no `escalate` step opened | Point 1 |
| `97b4a4f` | EV-012 and EV-013 run (below); EV-000, 001, 003 and 010 assert `authoritative`; EV-011 and EV-017 keep only what they still wait for; EV-017's release step states the one answer it must carry | Points 1 and 2 |
| `c14ba41` | After a reopen, the export still lists the superseded answer of an author who did not answer again (marked `superseded_by_reopen_id`). That is history, not output, so `answers` no longer counts it, matching the API's read | Found un-skipping EV-017 |
| `b3b35de` | README and ADR 006: verdicts, runnable coverage, a section on outcomes and exports, disputes after #48, and Limits after #53 | Smaller point 3 |
| `6e563fa` | **Outside SCRUM-70:** two doc points left from #48's review, in `workflow_states.md` (what Accept, Return and Reject do; what the evidence view shows) and `api_surfaces.md` (review refused per disputed version, retired escalation routes, the routes that replace them) | #48's review |

## The cases

| Case | Category | Runs? | What it shows, or waits for |
| --- | --- | --- | --- |
| EV-010 | `confidently_wrong_ai` | **yes** | The rejected AI answer is never authoritative |
| EV-011 | `confidently_wrong_ai` | skip | #38: a person answering after a rejected AI pass is still refused with 409 (rechecked on 11 Oct) |
| EV-012 | `ambiguous_item` | **yes** | An escalated answer the expert Rejects leaves the item `unresolved`; the export carries it with no authoritative answer. It follows the two-level design #48 built while #40 waits for the client |
| EV-013 | `reviewer_disagreement` | **yes** | A dual sign-off project whose policy opens a dispute on a split. In both orders of verdict the round waits for both, and the split opens a dispute with no escalate step; the expert Accepts on `epa` (the annotator matches the reference) and Returns on `whale` (it doesn't) |
| EV-014 | `guideline_changed` | skip | F2 (SCRUM-53) |
| EV-015 | `missing_provenance` | skip | F1 (SCRUM-98), H1 and H3 |
| EV-016 | `unreviewed_in_release` | skip | H1 and H3 |
| EV-017 | `superseded_in_release` | skip | H1 only. With the release swapped for an export it passes today: after the reopen, the second round's answer is authoritative and the only one counted |

## Decisions for review

- **`verdict`, not `result`.** Each case is already a `CaseResult` in a list called `results`, and `result.result` reads badly. Easy to rename.
- **`answers` counts output only.** A reviewer's correction counts once it is authoritative (ADR 012), and an answer a reopen superseded never does (R2-2). Which version a *release* carries stays H4's; this is only how the casebook counts.
- **No step to open a held `manual_review` split, and none to reconcile** several accepted answers. Dispute cases use an `open_dispute` policy or an `escalate` step. Both steps are noted for SCRUM-71.
- **`6e563fa` is not SCRUM-70.** It's docs only, checked against the code on `main`, and kept as its own commit so it can be read on its own.

## Testing

- Full API suite on SQLite: 1,486 passed, 14 skipped (9 PostgreSQL-only, 5 skipped cases).
- Casebook on SQLite: 7/7 passed, 5 skipped. `list --coverage`: 7 of 7, 3 runnable.
- CI on `6e563fa`: green on SQLite and PostgreSQL.
- Each round-2 code commit's new test fails on the commit before it.
- Mutation checks:
  - EV-013 under the default `manual_review` policy fails at its first adjudication (no dispute to decide);
  - EV-013 with the expert accepting `whale` fails at that step;
  - EV-012 with an Accept fails at the decision;
  - EV-001 naming the wrong author fails its outcome;
  - EV-017 run without its skip, with the release as an export, fails on `answers = 2` before `c14ba41` and passes after.

## Notes for reviewers

- @Jingwei-Lin: every point of your review is answered above; the reply on this PR names each commit.
- Case ids EV-010 to EV-019 are this PR's; new cases can take EV-004 to EV-009, or EV-020 onwards.
- Each ticket that lands a surface un-skips its case: SCRUM-53 (EV-014), SCRUM-98 (EV-015), SCRUM-102 and 105 (EV-015 to 017), and #38's answer (EV-011).

## Known limitations

- Four of the seven categories are covered by skipped cases only, and a skip proves nothing.
- From #39, not changed here: an invalid `--database-url` reports a harness error for every case, then raises in `write_report`.
