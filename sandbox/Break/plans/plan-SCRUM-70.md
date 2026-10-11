# Plan — SCRUM-70: Casebook structure and the adversarial categories

2026-10-04. Story **I2**. Board: Mid-semester Break, 2 points, unassigned (Hanchen keeps it, SCRUM-117
handover; done before SCRUM-69). Ticket text: `../jira/jira-break-descriptions.md` → SCRUM-70.

**Stacked on PR #39** (SCRUM-68, Jingwei), decided by Hanchen 2026-10-04: #39 merges cleanly with `main` and
passes on both databases (`../../../reviews/Break/review-cs57-jingwei-scrum-68-pr39-harness.md`). Branch
`CS57-Hanchen-scrum-70` from `origin/CS57-Jingwei` (`ac4c57b`). The PR targets `CS57-Jingwei` until #39 merges, then
is retargeted to `main` after merging `main` in. Never rebase (shared branch).

**Before commit 4:** Jingwei confirms the outcome-assertion shape (review comment 1).

## What the ticket asks

1. The case template: #39's TOML plus a category, a one-line purpose, the gold reference it uses, and the
   expected outcome.
2. One case or more per category the brief names (seven, below).
3. Gold data from `dataset/text_dataset/` (outside `hej`): copy only the records the cases use, with their source
   and record id.
4. A category whose surface doesn't exist yet is written now with its expected outcome and **skipped with that
   reason**. No case asserts today's wrong behaviour as correct.
5. Every bug found in the break's scenario testing becomes a case, and its bug ticket names it.
6. By the end of the break: the template, one case or more per category, and the runnable ones passing in CI.

## What `main` can and cannot show today (checked on `df7c05a`)

| Fact | Consequence |
| --- | --- |
| The export carries only `canonicalized` items; each answer has `is_authoritative` and its cause (#47) | Outcomes can be read from the export |
| Nothing calls `mark_authoritative` yet. SCRUM-99's Accept and H4's rule (SCRUM-37, W9) will | "Which answer is the item's output" can't be asserted until then |
| On an AI-assisted task, once the AI has answered, a human submission is refused, so a rejected AI pass is stranded (#38, open with the client) | "The AI was wrong, then a person takes over" can't run yet |
| No Reject/unresolved, no automatic dispute, no guideline versions, no provenance events, no release | Those categories are written and skipped |
| D9's owner reopen exists (#46) | A `reopen` step can be real now |

## Format extensions (in #39's files)

| Extension | Shape | Rule |
| --- | --- | --- |
| **Categories** | `category` from a fixed list: `workflow`, `regression` (a bug's case), and the seven adversarial ones below | Unknown category → invalid case. `list --coverage` prints cases per category, skipped ones counted apart |
| **Gold items** | `[items] i1 = { gold = "ag_news:train:0042" }` beside today's `i1 = "text"` | The text comes from `evaluation/gold/<dataset>.jsonl`, holding only the records the cases use, copied verbatim (source fields and `gold_annotations` kept). An unknown reference → invalid case. The gold label is never sent to the AI or the API (R1-1) |
| **Skip** | top-level `skip = "why, and what it waits for"` | A skipped case is still loaded and validated in full, so it can't rot. The runner reports SKIP (not PASS or FAIL); pytest marks it skipped with the reason. The exit status ignores skips |
| **Planned steps** | `edit_guideline` (F2), `release` (H1–H3), `adjudicate` with `outcome` (SCRUM-99) | Allowed by name and shape **only in a skipped case**. A runnable case using one is invalid. Each becomes a real step when its surface lands |
| **The new adjudicate step** (planned until SCRUM-99) | `do = "adjudicate"`, `outcome = "accept" \| "return" \| "reject"`, `accept = "<author alias or ai>"` (Accept only), `reason` (required, at most 2000 characters) | Matches Jingwei's proposed `POST /disputes/{id}/adjudication`. Today's `decision = "finalize" \| "send_back"` stays valid for EV-001 until SCRUM-99, which implements the new shape and moves EV-001 onto it in its own PR (line added to SCRUM-99 and 103 on 2026-10-04) |
| **Outcome assertions** | `[outcome] i1 = { status, approved = ["ann"], authoritative = "ann", answer = { label = "Business" }, exported = true }` | `approved`: whose current answers are approved; `authoritative` and `answer`: the item's authoritative version (needs SCRUM-99/H4); `exported`: whether the export carries the item. Read from the normalized export as the task owner; keys needing an unbuilt surface appear only in skipped cases until it lands |
| **`reopen` step** | `do = "reopen"`, `item`, `reason` | `POST …/task-items/{id}/reopen` (#46) |

## The cases

IDs **EV-010 to EV-019** are reserved for SCRUM-70, so Jingwei's EV-004 onwards don't collide (tell him).

| Id | Category | Gold | What happens | Expected | Runs now? |
| --- | --- | --- | --- | --- | --- |
| **EV-010** | `confidently_wrong_ai` | `ag_news:train:0090`, gold "Sports" (an Olympics story under an Athens Reuters dateline) | The AI answers "World" at 0.97. A reviewer rejects it with feedback | Item `rejected`, not canonicalized; the AI's answer is not approved; nothing exported (the last two once commit 4 lands) | **Yes** |
| EV-011 | `confidently_wrong_ai` | the same record | As EV-010, then an annotator answers "Business" and a reviewer accepts | Canonical; the human answer is authoritative; the AI's stays as a rejected version | Skip: #38 (rework of a rejected AI pass) and H4 |
| EV-012 | `ambiguous_item` | `civil_comments:train:0102` | A reviewer escalates; an independent expert Rejects with a reason | Item `unresolved`; exported with no output; the reasons kept | Skip: SCRUM-99 (Reject), and #40 (option A assumed) |
| EV-013 | `reviewer_disagreement` | `ag_news:train:0132` and `0074` (added 2026-10-05, one per order) | Dual sign-off: one reviewer accepts, the other returns, with no guideline to settle it; accept first on one item, return first on the other | A dispute opens automatically, whichever reviewer goes first; both verdicts kept | Skip: SCRUM-51, 101, and the review-panel decision |
| EV-014 | `guideline_changed` | AG News | An answer under guideline v1; the owner edits the guideline; a second item annotated under v2 | Each answer records the version in force; the first item still shows v1 | Skip: F2 (SCRUM-53) |
| EV-015 | `missing_provenance` | AG News | A finalised item whose provenance is incomplete (the harness removes one event, as a fault would) | The release is refused, naming the item and why | Skip: F1 (SCRUM-98), H1 and H3 (SCRUM-102, 105) |
| EV-016 | `unreviewed_in_release` | AG News, two records | One item canonical, one still unreviewed; the owner proposes a release | Refused before it exists, naming the unreviewed item | Skip: H1, H3 (SCRUM-102, 105) |
| EV-017 | `superseded_in_release` | AG News | Canonical; the owner reopens (real step); a new round is accepted; the owner releases | The release carries only the new authoritative answer; the superseded one is history | Skip: H4 (SCRUM-37), H1 |

**Skip reasons name every decision still open, not only the missing surface** (2026-10-04). EV-012's
expectation (Reject leaves the item unresolved) is option A on #40; EV-013's (a split opens a dispute whichever
reviewer goes first) needs the review-panel rule (D3 in Jingwei's proposal) as well as SCRUM-51/101. So:
- EV-012: `skip = "Waits for SCRUM-99 (Reject) and the scope answer on #40; under option B the outcome differs."`
- EV-013: `skip = "Waits for SCRUM-51 and 101, and for the review-panel decision; today the first return decides."`

When the decision lands, whoever un-skips the case checks its expectation against it first.

**Existing cases when disputes land** (checked 2026-10-04): EV-000, 002 and 003 use nothing that changes. EV-001's
adjudicate step calls the legacy decision route with `finalize` and no `annotation_id`; PR #48 as it stands
would refuse that (409/400), and the route is planned to return 410 after SCRUM-103. SCRUM-99 owns the update.

**Why EV-016 is skipped rather than run at export level:** the export already leaves unreviewed items out, but
silently. H3 asks for a refusal naming the item, and asserting silent exclusion would assert what H3 replaces.

**Bug cases:** SCRUM-117 (Dishank) and SCRUM-120 (Jingwei) are the break's bug tickets. Their owners add
`regression` cases with their fixes; the README states the rule. SCRUM-120 can be written in this format now
(review comment 3).

## Commits

1. `feat(eval): a fixed set of case categories, with the brief's adversarial ones (SCRUM-70)`
   `scenario.py`: the category list; `__main__.py`: `list --coverage`. Tests in `test_evaluation_scenario.py`:
   an unknown category is invalid; coverage counts per category.
2. `feat(eval): take an item's text from a gold record (SCRUM-70)`
   `evaluation/gold/ag_news.jsonl` and `civil_comments.jsonl`, only the records used, verbatim; `gold/README.md`
   names the source (Group A's delivery, `dataset/text_dataset/`), the files and the record ids. The loader
   resolves `{ gold = … }` to the text. Tests: an unknown reference is invalid; the gold label never reaches the
   API (the registration payload holds only the text).
3. `feat(eval): skip a case with its reason, and planned steps (SCRUM-70)`
   Loader, runner (SKIP), pytest (`pytest.skip(reason)`), summary and JSON report. Tests: a skipped case is still
   validated; a runnable case using a planned step is invalid; a skip doesn't change the exit status.
4. `feat(eval): outcomes assert approval, authority and export (SCRUM-70)` *(after Jingwei's OK)*
   Runner reads the normalized export as the task owner at the end of a case. Tests: each key, pass and fail.
5. `feat(eval): a reopen step (SCRUM-70)` — driver, vocabulary, a test.
6. `test(eval): EV-010, a confidently wrong AI answer is not finalised (SCRUM-70)` — runnable.
7. `test(eval): the adversarial categories, written and skipped until their surfaces land (SCRUM-70)` — EV-011 to EV-017.
8. `docs(eval): the case template, categories, gold records and the skip rule (SCRUM-70)` — README, plus ADR 006
   gains a short *Amendment* for skips and planned steps (or a new ADR if Jingwei prefers).

## Validation

- `uv run python -m evaluation run`: EV-000–003 and EV-010 pass, EV-011–017 skip with reasons. On SQLite and on
  PostgreSQL (the `hej_eval` database in `hej-perf-pg`).
- `list --coverage` shows every category with one case or more.
- Full suite on both databases; `npm run check` before the PR.
- Mutation checks: change EV-010's expectation and see it fail at the right step; remove `skip` from EV-012 and see
  it refused for a planned step.
- No `.env`, report or local database committed (`evaluation/reports/` is ignored).

## PR

- Base `CS57-Jingwei` while #39 is open; reviewer Jingwei (the format's owner). Description per `tech-stack.md`,
  with the category table above and what each skipped case waits for.
- When a surface lands (SCRUM-99, 101, 37, 53, 98, 102, 105), its ticket un-skips its case. Add that line to
  those tickets at the W9 meeting.

## Time

Break ends Wed 7 Oct. Commits 1–3 and 5 don't wait on anyone; 4 waits on Jingwei's reply, so send the review
comment first. Then SCRUM-119 (`plan-SCRUM-119.md`).

---

# Round 2 — from draft to ready for review (2026-10-08, W9)

SCRUM-70 is W9 carry-over on the board (In Progress, Hanchen), outside W9's load. PR #51 is still a draft at
`a05d147`, base `main` (#39 merged on 2026-10-06, so the stacking above is over). CI green on both databases.

**Jingwei's review (COMMENTED, 2026-10-05, at `a05d147`)** confirmed the planned outcome keys and the ADR
amendment, and will approve once four points and three smaller ones are in. He also answered comment 1 on #39:
- `answers` counts the answers an item carries as **output**, not its history (R2-2);
- `[outcome]` reads the item's state **through the API**, meaning its authoritative version (#47);
- what an export or release carries goes on **that step's** `expect.items = { <alias> = { ... } }`.

**Checked on 2026-10-07 against `origin/main` `1dcbcdf` (40 commits ahead of the branch):**
- `main` merges in cleanly and touches nothing under `evaluation/`. On the trial merge, the casebook gives 5/5
  passed and 7 skipped, and `list --coverage` reports 7 of 7.
- **#53 (SCRUM-51) changed EV-013's position.** Under Jingwei's dual sign-off project, EV-013 passes as written in
  both orders: the split is now shown as `disputed`. But nothing opens a dispute. Only `route_escalation` writes a
  `TaskItemEscalationDB`, and an expert's adjudication step then gets **404 "No open escalation"**, which was
  reproduced. So the case stays skipped, waiting on SCRUM-101 alone, and it needs an adjudication step, or it
  would pass on a status with no dispute behind it.

**Decided by Hanchen (2026-10-08):**
- the outcome keys become real in this PR (commit 4 of round 1, as the PR description promised);
- CI runs `list --coverage`.

## Before the first commit

- `git switch CS57-Hanchen-scrum-70`, `git pull`, then `git merge origin/main` (clean). Also pull local `main`,
  which is at `053c541`, behind `origin/main`.
- Rerun `uv run python -m evaluation run` to confirm the trial result before changing anything.

## Commits

*Superseded in part on 2026-10-10: R6–R8 are revised under "Update — 2026-10-10" at the end of this file.*

| # | Commit | Answers | What changes | Tests |
| --- | --- | --- | --- | --- |
| R1 | `fix(eval): report a skipped case as skipped, not as failed (SCRUM-70)` | Point 3; the "0/0" limitation | `runner.py`: each case's `result` is `pass`, `fail` or `skip`. The report carries `result` and keeps `passed` for one release. `__main__.py` reads `result`, not a special case. When nothing ran, the summary reads `no case ran, 7 skipped` | The report's `result` for each kind; the exit status unchanged. **SCRUM-69 builds its run comparison on this field** |
| R2 | `feat(eval): coverage shows how many of each category's cases run (SCRUM-70)` | Point 4, first half | `list --coverage` prints `confidently_wrong_ai  2 (1 runs)`. The exit rule stays "a written case per category", as ADR 006 decision 5 says | Counts with skipped and runnable cases mixed; exit 1 when a category has none |
| R3 | `ci: check the casebook's category coverage (SCRUM-70)` | Point 4, second half | `.github/workflows/backend-tests.yml`, SQLite job only: `uv run --locked python -m evaluation list --coverage`. It needs no database | CI green; locally, deleting EV-012 makes the step fail. Do not commit that |
| R4 | `fix(eval): a gold file with a blank line, a BOM or a repeated record is reported, not a crash (SCRUM-70)` | Smaller point 1 | Gold loader: read `utf-8-sig`, skip blank lines, and report a bad line (`file:line`) or a duplicate `external_item_ref` as a case problem, exit 2 | One test each: blank line, BOM, bad JSON, duplicate |
| R5 | `fix(eval): a reopen forgets the item's earlier submissions (SCRUM-70)` | Smaller point 2 | `_do_reopen` drops the item's cached submissions, so naming a superseded author gives the driver's own "has not submitted" message, not a 404 | Reopen, then review `submission = "alice"` before she resubmits |
| R6 | `feat(eval): outcomes and the export step assert the item's authoritative answer (SCRUM-70)` | Comment 1 on #39 | **`[outcome]`:** `authoritative` (an alias, `"ai"` or `false`) and `answer` become real. They are read as the task owner through `GET /task-items/{id}/annotations`, which carries `is_authoritative`, `author_role` and `created_by` (#47). An alias maps to its actor's user id; `"ai"` means `author_role = ai_model`. **`expect.items`** on the `export` step becomes real (`authoritative`, `answer`, `answers`) and reads the export body. On `release` it stays planned. The report records expected against actual for each key | Pass and fail for each key and each value kind. Nothing on `main` marks an answer authoritative until SCRUM-99 or H4, so the unit tests mark one with F3's helper directly. Runnable cases can only state `authoritative = false` today |
| R7 | `test(eval): EV-013 and EV-017 follow the review, and EV-001's comment catches up with #53 (SCRUM-70)` | Points 1 and 2 | **EV-013:** the dual sign-off project, as EV-003 does; an `expert` actor and an adjudication step after each split; skip becomes *"Waits for SCRUM-101: since #53 a split is shown as disputed but opens no dispute, so the expert's adjudication is refused (404)."* SCRUM-51 and the review-panel decision leave the reason, because the order rule holds on `main` in both orders. **EV-017:** the release step gains `expect.items = { bears = { authoritative = "ann", answer = { label = "Business" }, answers = 1 } }`. **EV-001:** its header says sampled cross-review exists since #53, and the case stays on dual sign-off | Mutation: EV-013 without its skip fails at the adjudication step with 404, which proves the reason. EV-017 still loads |
| R8 | `docs(eval): the result field, runnable coverage, and limits after #53 (SCRUM-70)` | Smaller point 3 | README: drop "release means the normalized export" and "cross-validation means dual sign-off until SCRUM-51"; `result`; the coverage output; the outcome keys move out of the planned table, and `expect.items` is described. ADR 006: the same two consequences updated; the amendment says the outcome keys are real | — |

R1, R2, R4 and R5 are independent of each other. R6 comes before R7, which uses its keys, and R8 comes last.

## Out of this PR

- Moving EV-001 onto SCRUM-99's adjudication shape: SCRUM-99's.
- New cases for sampled cross-review, and the regression cases for SCRUM-117 and 120: SCRUM-71 (W10) and the
  bugs' owners.
- Run comparison and baselines: SCRUM-69 (W9, Hanchen), on R1's `result`.

## Validation

- Full API suite on SQLite and on PostgreSQL (`hej_eval` in `hej-perf-pg`).
- Casebook on both: 5/5 passed, 7 skipped.
- `list --coverage`: 7 of 7, with the runnable counts.
- `npm run check` exits 0.
- Mutation checks:
  - each R6 key with a wrong value fails, naming the item and the key;
  - EV-013 without its skip fails at the adjudication with 404;
  - deleting EV-012 fails the coverage step.

## Making it ready

1. Rewrite the PR description from `../../../reviews/Break/pr-cs57-hanchen-scrum-70-casebook.md`:
   - drop the stacking on #39 and the "waits for comment 1" lines;
   - add R1–R8;
   - add a table mapping each of Jingwei's points to its commit;
   - add the new test counts;
   - add the #53 finding on EV-013.
2. Reply to Jingwei's review point by point, naming each commit.
3. **Mark #51 ready for review and re-request Jingwei.** Both are outward-facing: Hanchen does them, or confirms
   before they are done.
4. Move SCRUM-70 to In Review on the board. The tracker row stays pending until Jingwei passes it.

---

## Update — 2026-10-10: `main` moved, and #48 lands first

**Where things stand.** R1 is written and tested (runner 16 passed; 6 of them fail on the old code) but not
committed yet. The branch merged `main` at `831e463` on 2026-10-07 and is not pushed.

**Merged to `main` since then:**
- #61 (SCRUM-85, result shape checked on submit);
- #58 (SCRUM-32, a reviewer's correction is a proposal, ADR 012).

On a trial merge with `origin/main` `b9aa4f6`, the branch merges cleanly and the casebook still gives 5/5 passed
and 7 skipped (65 evaluation tests pass). Neither PR touches `evaluation/`.

**#48 changes the harness itself.** It is Yi's SCRUM-99, 100 and 101, out of draft, approved by Jingwei on
2026-10-09, not merged. In `driver.py`, `scenario.py`, the README and EV-001:
- `escalate` opens an annotation-level dispute directly. There is no routing step any more, and `target` is
  gone.
- `adjudicate` is real, with a shape different from this PR's planned one: `item`, `submission`,
  `decision = accept | return | reject`, and `note`. It posts to
  `/tasks/{id}/annotation-disputes/{dispute_id}/decision`. EV-001 is moved onto it.
- The driver knows a dispute only from the `escalate` step that opened it (`annotation_disputes`).
- `#51 + #48` conflict in `scenario.py` and the README; `driver.py` and the tests auto-merge.

**Probed on a trial merge of #48 with `main`, 2026-10-10:**
- An expert's **Reject** leaves the item **`inconclusive`**, a new terminal status. It is not `unresolved`,
  which is what EV-012 expects.
- Under the dual sign-off project, a split (accept, then revise) leaves the item `disputed`. **#48 now opens a
  real annotation dispute** for it (`REVIEWER_VERDICT_CONFLICT`, opened by the platform, when the policy says
  `open_dispute`). But the harness can't adjudicate it, because no `escalate` step recorded its id.
  `GET /tasks/{id}/annotation-disputes` lists them.
- #48 also adds item-level reconciliation (`/tasks/{id}/item-reconciliations/{id}/decision`), with no harness
  step. No case in this PR needs it: every item has one annotator.

**#58's effect on R6.** A correction is stored as a version with `author_role = "reviewer"` (ADR 012), and
`GET /task-items/{id}/annotations` returns it beside the answers. So `answers` must not count it, and an alias
must not resolve to it.

**Decided by Hanchen (2026-10-10):**
- **#48 merges first.** #51 then merges `main` and adapts to #48.
- **EV-012 and EV-013 are un-skipped in #51.** #48 can't see them, so the PR that merges second does it, as the
  README's rule intends.

### Revised commits

R1–R5 stay as planned and don't depend on #48 (R1 is ready to commit). From R6:

| # | Commit | When | What changes | Tests |
| --- | --- | --- | --- | --- |
| R6 | `feat(eval): outcomes and the export step assert the item's authoritative answer (SCRUM-70)` | Before or after #48 | As planned, plus: `answers` counts only output answers, never an `author_role = "reviewer"` correction (ADR 012); an alias never resolves to one. `authoritative = false` covers an `inconclusive` item | As planned, plus a correction present beside the answer leaves `answers = 1` |
| M | Merge `main` once #48 is in | After #48 | Resolve `scenario.py` and the README toward #48. Its `adjudicate` (`submission`, `decision`, `note`) and `escalate` (no `target`) replace this PR's planned adjudicate shape (`outcome`, `accept`, `reason`), which goes with its shape check and its tests. `adjudicate` leaves the planned table | The evaluation suite and the casebook after the merge, before R7 |
| R7 | `feat(eval): adjudicate a dispute the platform opened (SCRUM-70)` | After M | `_do_adjudicate`: when no `escalate` step recorded the submission's dispute, read `GET /tasks/{id}/annotation-disputes` as the actor and take the open dispute for that submission. None found is a problem that names the submission. `_do_reopen` also drops the item's cached disputes (extends R5) | A dispute opened by a reviewer split is found and decided; no dispute gives the named problem |
| R8 | `test(eval): EV-012 and EV-013 run now that disputes land, and EV-017 checks its release (SCRUM-70)` | After R7 | **EV-012**, un-skipped: #48's shape (escalate, then `decision = "reject"` on the submission), with the end status `inconclusive` and `authoritative = false`. Its comment says it follows the two-level design #48 built while #40 is unanswered. **EV-013**, un-skipped: the dual sign-off project, and an expert adjudicates the dispute each split opened. **EV-017**: `expect.items` on its release step (Jingwei point 2); still skipped. **EV-001**: its header notes that sampled cross-review exists since #53 | Casebook 7 runnable, 5 skipped. Mutations: EV-013 without the dual sign-off project fails at the split (no dispute under `manual_review`); EV-012 expecting `canonicalized` fails at the decision |
| R9 | `docs(eval): verdicts, runnable coverage, disputes after #48, and the limits after #53 (SCRUM-70)` | Last | The old R8, plus: the `adjudicate` row describes #48's step and the automatically opened dispute; `inconclusive` appears where outcomes are described; Limits says there is no reconciliation step yet. ADR 006's amendment drops the planned adjudicate shape | — |

**Coverage after R8:** 3 of the 7 adversarial categories have a runnable case: `confidently_wrong_ai`,
`ambiguous_item` and `reviewer_disagreement`.

**If #48 is still open when R1–R6 are done,** push R1–R6, reply to Jingwei on the points they close, and leave
#51 as a draft until #48 merges. Then do M, R7–R9 and mark it ready.

### Progress — 2026-10-10 (R1–R6 done and pushed)

| # | Commit | Note |
| --- | --- | --- |
| R1 | `7119bdd` | The verdict is named `verdict`, not Jingwei's `result`: every case is already a `CaseResult` in a list called `results`, so `result.result` would read badly. Say so in the reply |
| R2 | `7153b23` | The per-category line reads `2  (1 runnable)`, with a second summary line `N of 7 have a case that runs` |
| R3 | `3bf51ba` | SQLite job only, before pytest |
| R4 | `9154465` | Also reports a record missing `external_item_ref` or `payload_preview.text`, which was a `KeyError`. `gold_record()` folded into `_gold_item` |
| R5 | `7e931c2` | Drops the cache only when the reopen succeeds: a refused reopen supersedes nothing |
| R6 | `c51a405` | See the corrections below |

**R6, as built: two corrections to the table above.**
- **A correction can be the authoritative answer.** ADR 012 lets an expert's Accept make a reviewer's
  correction the item's answer. So `answers` counts a `reviewer`-role version only once it is authoritative,
  and `authoritative` may then name that reviewer. It was never "an alias never resolves to a correction".
- **`expect.items` is checked in `read()`, after every step.** `_step` and `_expectation`'s signatures stay as
  they were, because #48 edits the lines just above them (escalate's `target`, adjudicate's `decision`).
  Checked against #48 after each file: `runner.py`, `driver.py` and the three test files merge cleanly, and
  `scenario.py` still has only the two known conflicts.

**Found while building R6:**
- **The driver's `Answer`** gives the API read (`annotation_data`, `created_by` as an id) and the export
  (`raw_annotation_data`, `created_by` as an object) one shape. Only fields that exist both before and after
  #48 are read; #48's `resolution` and `canonical_result` are not used.
- **A model's answer is stored in the platform's normalised form.** The script's `score` is stored as
  `confidence`, beside `labels` and `metadata`. So `answer` compares only the keys a case states. R9's README
  says so.
- **An export with no finalised item is refused with 403** ("no export-eligible task items"), rather than
  returning an empty export. EV-016's release step and any export case need a finalised item beside the one
  under test. R9's README says so.
- Nothing on this branch marks an answer authoritative or writes a correction. So the comparison rules are
  unit-tested on `Answer` values, and the API and export plumbing is tested on real runs.

**Next:** reply to Jingwei on #51 (draft:
`../../../reviews/Break/reply-cs57-hanchen-scrum-70-jingwei-review.md`), and keep #51 a draft until #48 merges.
Then do M, R7, R8 and R9.

### Update — 2026-10-11: #48 merged, M starts

**#48 merged at 02:37 UTC (`41028db`)**, before Yi's three doc fixes. `main` is 86 commits ahead of `c51a405`; the
branch is clean and level with its remote.

**Trial merge (in `hej-review-48`, aborted afterwards):** conflicts only in `evaluation/harness/scenario.py` (two
hunks) and `evaluation/README.md` (the steps table), as predicted. But a merge commit must leave the suite green, so
**M resolves four files**, not two:

| File | Resolution |
| --- | --- |
| `harness/scenario.py` | Take `main`'s `ADJUDICATION_DECISIONS = accept / return / reject` and its `adjudicate` (`item`, `submission`, `decision`, `note`). Delete `ADJUDICATION_OUTCOMES`, `ADJUDICATION_REASON_MAX`, `ESCALATION_TARGETS`, `PLANNED_ADJUDICATION_PARAMETERS`, `new_adjudication` and `_new_adjudication`. Keep #51's `reopen` reason check |
| `README.md` | `main`'s `escalate` and `adjudicate` rows; keep #51's `reopen` row |
| `tests/test_evaluation_scenario.py` | Drop `NEW_ADJUDICATION` and its uses (the planned-step test keeps `GUIDELINE_EDIT`; the shape test loses its three adjudication messages) and `test_the_legacy_adjudication_still_runs_until_scrum_99` (`finalize` is no longer a decision) |
| `cases/EV-012-…toml` | Its two `adjudicate` steps move to #48's shape (`submission = "ann"`, `decision = "reject"`, `note`). **Still skipped** in M; R8 un-skips it |

**`c196b98` renamed `inconclusive` to `unresolved`.** So EV-012 keeps `unresolved` (the 10-10 table's
`inconclusive` in R6 and R8 is superseded), and R9's README says `unresolved`.

**Order (one file per turn):** Hanchen runs `git merge origin/main` in `hej` → `scenario.py` → `README.md` → the test
file → EV-012 → evaluation tests and casebook → Hanchen commits the merge. Then R7, R8, R9.

**Progress:** merge started 2026-10-11 (Claude ran `git merge origin/main` at Hanchen's request); `scenario.py`
resolved — the scenario tests then give 35 passed, 4 failed, all expected (three old-shape tests, and the casebook
check failing on EV-012).

**M committed 2026-10-11: `01ac534`** (parents `c51a405`, `41028db`), not pushed. Five files resolved: the four above,
plus `test_evaluation_runner.py` — R6's outcome test had pinned `authoritative = false` on a canonicalized item, true
only while nothing marked authority; since #48 it is `"alice"`. Checked: evaluation tests 88 passed, 7 skipped; casebook
5/5 passed, 7 skipped; coverage 7 of 7, 1 runnable; full API suite on SQLite 1,482 passed, 16 skipped.

**What #48 changes in R7–R9 (checked on the merge, decided by Hanchen 2026-10-11):**
- **R7 is simpler.** The review action's response carries `annotation_dispute_id` when the deciding verdict opened a
  dispute under `open_dispute` (`review_actions.py:841`), so the driver's `review` step records it as `escalate` does.
  No `GET …/annotation-disputes` lookup. Under `manual_review` a split stays `pending_route` until someone posts
  `…/open` with a justification; the harness gets no step for that here (SCRUM-71).
- **R8:**
  - EV-012 keeps `unresolved`. An `unresolved` item is export-eligible now, so it gains an `export` step with
    `expect.items = { protesters = { authoritative = false } }`. The #40 part of its skip becomes a comment (#48
    proceeds on the two-level design, decision of 10-09).
  - EV-013: all three reasons in its skip are gone (SCRUM-51 in #53, SCRUM-101 in #48, the review-panel rule of
    10-05 on `main`). Dual sign-off with `policy = { disagreement_handling = "open_dispute" }`, an `expert`, and an
    adjudication after each split.
  - EV-011 and EV-017 stay skipped, with their H4 part removed: #48 marks a single accepted answer authoritative.
    EV-011 waits for #38 only, EV-017 for H1 only. Before trimming EV-017, check that the first round's answer loses
    its mark once the second round is accepted.
  - **Added:** the runnable cases EV-000, 001, 003 and 010 assert `authoritative` where they end, so R6's keys run
    against real authority for the first time.
- **R9** also covers: `adjudicate` as a real step, the planned adjudication gone from the planned table and from ADR
  006's amendment, `unresolved` in the outcomes, `reviewed` shown as Reconciliation, and no `reconcile` step yet
  (Limits, SCRUM-71).

**Progress (2026-10-11):** R7 `d7260f4` (pushed with M); R8 `97b4a4f` (not pushed): EV-012 and EV-013 run,
EV-000/001/003/010 assert `authoritative`, EV-011 waits for #38 only (still 409), EV-017 for H1 only. Casebook 7/7
passed, 5 skipped; 3 of 7 categories run. The `reopen` cache for disputes (planned in R7) was left out: a reopen
only follows a decided dispute, so a stale id gets an honest 409, not a misleading 404.

**Found while un-skipping EV-017:** after a reopen, the normalized export lists the superseded first-round answer
as its own entry (`superseded_by_reopen_id` set, not authoritative), because it lists the latest answer per
author. `exported_answers` counts it, so an export step's `answers` is 2 where the API read gives 1. Authority is
right on both. Not yet fixed — Hanchen to decide (R6 follow-up in this PR, or leave with EV-017 skipped on H1).

**Done and pushed (2026-10-11, head `6e563fa`):** R6 follow-up `c14ba41` (an answer a reopen superseded is history;
decided by Hanchen: fix in #51), R9 `b3b35de` (README, ADR 006, EV-001's header), and `6e563fa`, the two in-repo doc
points left from #48's review (`workflow_states.md` §4, `api_surfaces.md` on retired routes and per-version refusal),
at Hanchen's request. #48's third point was its PR description, which is not in the repository.

**Posted 2026-10-11 with gh, at Hanchen's request:** #51's description rewritten
(`../../../reviews/W9/pr-cs57-hanchen-scrum-70-casebook-round2.md`) and the reply to Jingwei
(`../../../reviews/W9/reply-cs57-hanchen-scrum-70-jingwei-review-round2.md`,
[comment](https://github.com/USYD-CS-Capstone/hej/pull/51#issuecomment-6106308803)). CI green on both databases at
`6e563fa`; full suite on SQLite 1,486 passed, 14 skipped.

#51 marked ready and Jingwei re-requested the same day (head `6e563fa`).

**Left:** Hanchen moves SCRUM-70 to In Review on the board; the tracker row stays pending until Jingwei passes it.

### For SCRUM-71 (W10), not this PR

- A `reconcile` step for #48's item-level reconciliation. Cases with several annotators per item need it, and
  so do H4's (SCRUM-37) differing approved answers.
- A case where a reviewer's correction stays a proposal and isn't counted (#58, issue 5's regression case).
- A case where an answer of the wrong shape is refused on submit (#61).
- The regression cases for SCRUM-117 and 120.
