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
| **EV-010** | `confidently_wrong_ai` | AG News, a "Business" record | The AI answers "Sports" at 0.97. A reviewer rejects it with feedback | Item `rejected`, not canonicalized; the AI's answer is not approved; nothing exported | **Yes** |
| EV-011 | `confidently_wrong_ai` | the same record | As EV-010, then an annotator answers "Business" and a reviewer accepts | Canonical; the human answer is authoritative; the AI's stays as a rejected version | Skip: #38 (rework of a rejected AI pass) and H4 |
| EV-012 | `ambiguous_item` | `civil_comments:train:0102` | A reviewer escalates; an independent expert Rejects with a reason | Item `unresolved`; exported with no output; the reasons kept | Skip: SCRUM-99 (Reject), and #40 (option A assumed) |
| EV-013 | `reviewer_disagreement` | `ag_news:train:0132` | Dual sign-off: one reviewer accepts, the other returns, with no guideline to settle it | A dispute opens automatically, whichever reviewer goes first; both verdicts kept | Skip: SCRUM-51, 101, and the review-panel decision |
| EV-014 | `guideline_changed` | AG News | An answer under guideline v1; the owner edits the guideline; a second item annotated under v2 | Each answer records the version in force; the first item still shows v1 | Skip: F2 (SCRUM-53) |
| EV-015 | `missing_provenance` | AG News | A finalised item whose provenance is incomplete (the harness removes one event, as a fault would) | The release is refused, naming the item and why | Skip: F1 (SCRUM-98), H3 (SCRUM-105) |
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
