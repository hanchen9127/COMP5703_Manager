# Board descriptions — the evaluation tickets, after the break

2026-10-10. Checked against:
- the board export of 2026-10-09 (`shared/Jira.csv`);
- `origin/main` `b9aa4f6` (#58 and #61 merged);
- PR #51 at `c51a405`;
- PR #48 at `9935028` (approved, not merged).

Story text for I2, I3 and I4 was aligned with the brief on 2026-10-10 (`shared/story_src.csv`). The tickets
follow it here.

**Each block below replaces the ticket's whole description.** Paste it inside the `{noformat}` block. Every
description keeps its first line, `Related to user story X`, which `tracking-sync` maps.

| Ticket | Story | Status | Verdict | Why |
| --- | --- | --- | --- | --- |
| SCRUM-69 | I1 | To Do, Hanchen, W9 | **Replace** | Still says "Mid-semester break". Each case's result is now pass, fail or skip (#51's `verdict`), and a case moving between skip and run has to be reported as its own change |
| SCRUM-70 | I2 | In Progress, Hanchen, carried into W9 | **Replace** | "By the end of the break" has passed. Jingwei's review and #48 added work. EV-012 and EV-013 are un-skipped by #51 after #48, not by SCRUM-99 or 101 |
| SCRUM-71 | I2 | To Do, W10 | **Replace** | Gains the two cases the story added on 2026-10-10 (annotators who disagree; a source version change), a `reconcile` step for #48, cases for #58 and #61, the break's bug cases, and the runnable count as the weekly figure |
| SCRUM-72 | I3 | To Do, W10 | **Replace** | Gains agreement between annotators and accuracy against the reference (I3, 2026-10-10). SCRUM-51 is done, so it reads #53's disagreement records and report rather than recomputing them |
| SCRUM-73 | I4 | To Do, Jingwei, W10 | **Replace** | Gains review burden (I4, 2026-10-10). C4 is in review (#59) |
| SCRUM-74 | I5 | To Do, W11 | **No change** | Still accurate |
| SCRUM-75 | I5 | To Do, W11 | **Replace** | Adds two limits of the harness itself as findings |

**Left as they are, by decision (2026-10-10):**
- **SCRUM-99** (Yi, In Progress). Its description still asks for #51's planned adjudicate shape and for EV-012
  to be un-skipped, but #48 built another shape and EV-012 isn't on `main`. It is updated after #48 merges.
- **SCRUM-37 and SCRUM-102** (in progress) get no casebook line. Hanchen updates their cases after they
  merge. SCRUM-71 below names that work.
- **SCRUM-53, 98, 105 and 103** wait until #48 has merged.

**Not changed here, and still open:** SCRUM-72 and 73 keep "Figures come from harness runs". A harness case
scripts every person in it, so its figures show that the protocol and the computation are right. They do not
measure real people. Where the human data comes from is a decision for before W10. When it is taken, both
tickets change.

---

## SCRUM-69 — Evaluation2: Repeatable runs and regression reporting

```
Related to user story I1

BACKEND (evaluation). W9, Hanchen. Rewritten 2026-10-01; updated 2026-10-10 (moved from the break to W9 on 2026-10-05; each case's result is now pass, fail or skip). Builds on PR #39 (SCRUM-68, merged) and on PR #51 (SCRUM-70), whose report gives each case a verdict.

A run that cannot be repeated proves nothing, and a result nobody can compare hides regressions rather than revealing them.

Already delivered:
- by PR #39: every case builds its own world in a fresh database (SQLite in memory or a throwaway PostgreSQL schema), so no reset between runs is needed; the AI's replies are scripted, so a case has one correct outcome; cases carry stable ids (EV-000 …); each run writes a JSON report.
- by PR #51: each case's verdict is pass, fail or skip, with the skip's reason, and the report counts each.

What is left is comparing runs.

# Running the same cases twice gives the same verdict per case. A test proves it, comparing only what should be stable — not ids, timestamps or database names.
# A run summary records, per case id: its verdict, the first failing step, and the run's commit and database.
# A run can be compared with a baseline (the previous run, or a named one). Each case is reported as one of:
#* newly failing;
#* newly passing;
#* newly running (skipped before, runs now: its surface has landed);
#* newly skipped;
#* new or removed;
#* unchanged.
# A newly failing case exits non-zero, so CI and the command line both show a regression. So does a case that was running and is now skipped: a skip proves nothing, so it must not hide a regression.
# The human summary and the machine-readable result come from the same data.
# The README says how to keep and compare a baseline.

Out of scope: runs against a live development server — ADR 006 keeps the scripted AI inside the harness.

Feeds SCRUM-72 and 73 (I3, I4, W10), which measure on repeatable runs, and SCRUM-74 (I5, W11).
```

---

## SCRUM-70 — Evaluation3: Casebook structure and the adversarial categories

```
Related to user story I2

BACKEND (evaluation). Hanchen. Planned for the mid-semester break, carried into W9 (PR #51). Rewritten 2026-10-01; updated 2026-10-10. Builds on PR #39 (SCRUM-68).

A system demonstrated on easy items proves nothing about the ones that matter. This ticket fixes the case template and writes the brief's adversarial categories as real cases; SCRUM-71 (W10) grows the casebook to 40.

# The case template: PR #39's TOML format plus a category from a fixed list, a one-line purpose, the gold reference it uses (dataset and source record id) and the expected outcome.
# One case or more for each category the brief names:
#* a confidently wrong AI suggestion;
#* a genuinely ambiguous item;
#* reviewers who disagree with no guideline to resolve it;
#* a guideline changed after annotation;
#* an item with missing provenance;
#* an unreviewed item reaching a proposed release;
#* a release containing a superseded item.
# Gold data comes from Group A's delivery package (dataset/text_dataset/), outside the hej repository. Copy only the records the cases use into apps/hej-api/evaluation/gold/, unchanged, with their source and record id. The reference label is never sent to the API or the AI (R1-1).
# A category whose surface does not exist yet is written now with its expected outcome and skipped with that reason until its surface lands. No case asserts today's wrong behaviour as correct.
# Every bug found in the break's scenario testing becomes a case, and its bug ticket names the case. Bugs found later are SCRUM-71's.
# An outcome can state which answer is authoritative, what it says and how many answers the item carries, read through the API; an export step can state what it carries per item.
# The runnable cases pass in CI on both databases, and CI fails if an adversarial category is left with no case.

Carried into W9 (2026-10-10):
- Jingwei's review of PR #51: a skip reported as a skip, not a failure; coverage showing how many of each category's cases run; the coverage check in CI; a gold file with a blank line, a BOM or a repeated record reported rather than crashing; a reopen forgetting the item's earlier submissions; the outcome keys made real. Done in PR #51.
- After PR #48 (SCRUM-99, 100, 101) merges, PR #51 merges main and adapts:
#* the harness's adjudicate step is #48's (submission, decision = accept | return | reject); #51's planned shape goes;
#* the driver finds a dispute the platform opened itself, which no escalate step recorded;
#* EV-012 (an expert's Reject leaves the item inconclusive) and EV-013 (a split between two reviewers opens a dispute, under the dual sign-off project) are un-skipped;
#* EV-017 states what its release must carry.
PR #48 can't un-skip them, because they are not on main. Three of the seven categories then have a case that runs.

Collaboration:
- SCRUM-68 (Jingwei): the case format; Jingwei reviews PR #51.
- PR #48 (Yi): merges first; PR #51 takes its adjudicate step.
```

---

## SCRUM-71 — Evaluation4: Grow the casebook to 40–60 cases

```
Related to user story I2

BACKEND (evaluation). W10, continuing into W11 on the same ticket. Rewritten 2026-10-01; updated 2026-10-10 (story I2 aligned with the brief).

A standing commitment, not a block of work at the end: assembling the casebook in the final fortnight is the failure the brief warns about by name. Builds on SCRUM-70's template and adversarial categories (PR #51).

Related issues: regression cases for the fixed Critical defects — 2 (finalised annotation overwritten), 4 (conflicting answers exported), 5 (reviewer correction lost), 6 (drafts without ownership), 7 (approving or deciding on one's own work), 8 (legacy review API rewriting history) — so a fix cannot silently regress.

# At least 40 cases by the end of W10; toward 60 in W11, adding the cases for the surfaces built that week.
# Each workflow surface maps to the cases it owes; every feature ticket from W9 lands its own cases as part of its Definition of Done.
# Backfill cases for the surfaces already built.
# One regression case for each Critical defect above. Issue 5's case: a reviewer's correction is kept whole beside the answer and is never counted as an answer until an expert's Accept or the annotator's adoption (PR #58, ADR 012).
# The two categories the brief names that SCRUM-70's list left out (story I2, 2026-10-10):
#* annotators who disagree, with no guideline to settle it. Their answers are settled by item-level reconciliation (PR #48), so the harness first gains a reconcile step;
#* a source version that changes after annotation, beside SCRUM-70's guideline case. It needs F2's source versions (SCRUM-53).
# Every case passes in CI, or is skipped with the reason its surface is not built yet.
# Un-skip each case whose surface has merged, after checking its expected outcome against the decisions taken since it was written. That includes the cases waiting for tickets that were already in progress when the cases were written: EV-011 and EV-017 (SCRUM-37), and EV-015 to EV-017 (SCRUM-102, 105).
# The weekly figure is the runnable count per category ("N of 7 have a case that runs", from list --coverage), not only the written count. It is reviewed against the target at each weekly meeting.

Added 2026-10-01 (coverage of defects and deliverables):
- Regression cases that double as closure checks for the fixed High defects whose closure is still pending: 10 (invalid status values saved), 15 (dispute send-back — through Return, after SCRUM-99), 16 (dataset registration not transactional), 20 (AI failures disguised as annotations), 29 (intake conflict reported as 500). A passing case closes the defect; record it on this ticket and in mission.md's defect table.
- One full-journey case on realistic data, the brief's first success criterion. A record from a Group A dataset (dataset/text_dataset/) is imported through JSONL intake (B7), then annotated, reviewed, cross-reviewed (SCRUM-51's sampling), disputed, adjudicated and released, and its provenance is read back at the end.

Added 2026-10-10:
- A case for each bug ticket of the break whose fix has merged without one: SCRUM-116, 117 and 120. Their category is regression.
- A case where an answer of the wrong shape for its task is refused on submit (PR #61, SCRUM-85).
- Notes for writing cases:
#* an export with no finalised item is refused (403), so an export case needs one finalised item beside the one under test;
#* a model's answer is stored in the platform's normalised form, so an outcome's answer states only the keys that matter.
```

---

## SCRUM-72 — Evaluation5: Reviewer agreement and AI suggestion quality

```
Related to user story I3

BACKEND (evaluation). W10 (moved from W11 on 2026-10-01). Rewritten 2026-10-01; updated 2026-10-10 (story I3 aligned with the brief: agreement between annotators, and accuracy, are added).

Raw percentage match flatters any task where one answer dominates. Report a real coefficient, keep accuracy apart from agreement, and show whether the assistant's stated confidence tracks whether it was right. The brief: dataset quality must not be reduced to a single unexplained score.

Related issues: none.

# Agreement by an established coefficient (for example Cohen's or Krippendorff's), not raw match. Name the coefficient and why in the report. It is measured:
#* between reviewers, on D7's independent second reviews (SCRUM-51, done in PR #53);
#* between annotators, on items with several independent annotations (the task's required annotator count, D8).
# Per task, and comparable across tasks.
# Annotation accuracy against the reference labels, for human and AI answers, reported apart from agreement.
# AI suggestion quality and confidence calibration alongside human agreement.
# Measured against the gold annotations in Group A's datasets (dataset/text_dataset/), through the records SCRUM-70 copies into the harness (evaluation/gold/).
# Read the cross-review data PR #53 already keeps rather than recomputing it. It keeps the sampled submissions (cross_review_samples), each disagreement between reviewers (review_disagreements, with both verdicts) and GET /tasks/{id}/cross-review-report (pairs, agreements, disagreements, raw agreement rate). The coefficient goes beside that raw rate, not in place of it.
# Figures come from repeatable harness runs (SCRUM-68, 69).

Collaboration: SCRUM-73 (I4, same week) uses the same runs; SCRUM-100 (E4) marks which items were contested; Parth (SCRUM-51) on what the cross-review records mean.
```

---

## SCRUM-73 — Evaluation6: Measure AI influence on human judgement, with blind-then-reveal

```
Related to user story I4

BACKEND (evaluation and a protocol in the API). W10 (moved from W11 on 2026-10-01). Rewritten 2026-10-01; updated 2026-10-10 (story I4 aligned with the brief: review burden is added).

The client's question is not whether assistance feels faster but what it does to the answers people give. Client answer R1-2 (2026-09-21): blind-then-reveal is an evaluation protocol, not a production mode — the annotator's independent judgement is recorded first, then the AI suggestion is revealed and they keep or revise.

Related issue: 20 (AI failures disguised as annotations — fixed). A failed AI pass is not a suggestion and is never counted as one, accepted or rejected.

# Rates per task: how often an AI suggestion was accepted unchanged, modified or overridden, from F3's separated AI and human versions (SCRUM-38, done).
# Time per item, and review burden, alongside them. Review burden is measured by review rounds per item, returns and rejections, and reviews per finalised item. It shows whether assistance moves work from the annotator to the reviewer.
# Results grouped by the production mode recorded on each item (SCRUM-87, C4, in review as PR #59): human-only against AI-first.
# Blind-then-reveal as a protocol a task can run on human annotation: the pre-reveal judgement is stored as its own record, then the suggestion is revealed and the final judgement stored.
# The API withholds the suggestion until the pre-reveal judgement exists — tested on the API, not by hiding it in the UI.
# Anchoring and automation bias: how often answers moved toward the suggestion, split by whether the suggestion was right against the gold reference — including how often a confidently wrong suggestion was accepted.
# Figures come from harness runs (SCRUM-68, 69) over the gold fixtures, so they can be repeated and compared.

Collaboration: SCRUM-72 (I3, same week) measures on the same runs; SCRUM-75 (I5, W11) reports the findings, negative results included.
```

---

## SCRUM-75 — Evaluation8: Findings record including negative results

```
Related to user story I5

DOCUMENT. W11, the last sprint. Rewritten 2026-10-01; updated 2026-10-10.

Negative findings tell the client more about the platform's real limits than a list of features that worked, and the brief gives them equal weight.

Related issues: every defect in info/issues.md still open at the end of W11. The brief's success criteria ask that each unfixed defect carry an argued decision rather than silence.

# Record the findings from I2–I4 (SCRUM-71, 72, 73) and I5's checks (SCRUM-74), including what failed and why.
# Trace each finding to a case so a reader can re-run it.
# Report negative results rather than filtering them out.
# List each defect left open with the decision and its reason.
# Store it in the repository's docs, so it is handed over with the code.


Added 2026-10-01 (coverage of deliverables):
- Issue 1 (a live API key once committed to source): the key was removed from code; record whether the provider key was rotated. A process item, not code.
- Record the limits of the test suite as findings: the end-to-end tests drive the API in process, not the browser (ADR 006), so the screens are covered only by component tests and the manual walkthroughs.

Added 2026-10-10 (limits of the harness itself, from SCRUM-70):
- A skipped case never ran, so it proves nothing. The casebook counts written cases per category; record how many of each category ran at the end of W11, and which stayed skipped and why.
- A harness case scripts every person in it. Its figures show that a protocol and its computation are right, not how real people behave. Say which figures came from scripted runs and which, if any, from people.
```
