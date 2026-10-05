# Board descriptions — Mid-semester Break tickets

2026-10-01. From the board export of 2026-10-01 18:56, checked against `origin/main` (`dd91758`, after #41 and
#42) and the open PRs (#39 head `ac4c57b`, #43, #44). Points are as set on the board the same day.

| Ticket | Story | Owner | Points | Verdict |
| --- | --- | --- | --- | --- |
| SCRUM-38 | F3 | Hanchen | 3 | **Replace** — the description covers only the AI author; the separation, supersession and authoritative marker are missing |
| SCRUM-52 | D8, E3 | Parth | 1 | **Replace** — one line; most of it is already on `main` |
| SCRUM-68 | I1 | Jingwei | 1.5 | **Replace** — record PR #39's state and what "done" means |
| SCRUM-69 | I1 | Hanchen | 2 | **Replace** — PR #39 already delivers part of it |
| SCRUM-70 | I2 | Hanchen | 2 | **Replace** — the gold-fixture path no longer exists; cases that cannot run yet need a rule |
| SCRUM-101 | E1 | Yi | 1.5 | **Replace** — says W9, depends on an unstarted flag, and keeps a release exclusion that moved to H3 |
| SCRUM-100 | E4 | Yi | 1.5 | **Append** two lines |
| SCRUM-99 | E3, D1 | Yi | 2.5 | **Edit** one line — PR #41 has merged |
| SCRUM-110 | D9 | Jingwei | 3 | **Edit** two lines — F1 is now W9; PR #41 has merged |
| SCRUM-116 | D1, D5, D8 | Jingwei | 1 | **Edit** one line — PR #41 has merged |
| SCRUM-117 | D8 | Hanchen | 1 | Complete. Confirm the resubmission rule at the next meeting if it has not been |
| SCRUM-86 | D1 | — | 0 | Complete (container) |

---

## SCRUM-38 — Provenance: Preserve AI, annotator, reviewer and adjudicator outputs separately

Replace the description with:

```
{noformat}Related to user story F3

BACKEND ONLY. Mid-semester break, Hanchen. Rewritten 2026-10-01.

Collapsing the AI suggestion, the human answer and the reviewer's correction into one value destroys the only evidence of what human judgement contributed. Client answer R2-2: keep the AI, annotator, reviewer and adjudicator outputs separate, mark at most one as the authoritative resolution, and keep every other version linked as provenance — "do not flatten the history into only the final answer". R2-5: the AI model is a recorded field, not a note.

Today: annotations.created_by is a foreign key to users, so an AI annotation is identified only by created_by IS NULL (MACHINE_AUTHORED, app/services/submission_rules.py:26; ai_batch_service.py:176 and :230). Every AI annotation on an item is indistinguishable from every other, and lookups keyed by (task_item_id, created_by) would update a second AI answer in place. SCRUM-46 therefore refuses a second AI annotation per item. version, base_annotation_id and is_latest exist on annotations but nothing records what superseded what, or why.

# An annotation records its author kind — a person or an AI model — and, for machine output, which model (provider, model, version), without inventing a user account. metadata.ai stays the source of truth for the run; existing rows are readable (created_by IS NULL reads as AI, model taken from metadata.ai).
# MACHINE_AUTHORED and every created_by IS NULL lookup switch to the author kind.
# Two models can annotate the same item without overwriting each other (R1-4: "unless the task explicitly defines a multi-model experiment"). SCRUM-46's one-AI-annotation-per-item refusal becomes a task-level rule, not a limit of the data model.
# Outputs stay distinct records, each with author and time: the AI suggestion, each annotator's answer, a reviewer's correction (written by SCRUM-32, W9) and the adjudicator's selected answer (SCRUM-99). Nothing overwrites another.
# Supersession: a version can name the version it supersedes and why — resubmission, reviewer correction, reopen. SCRUM-110 (D9, break) is the first writer; agree the fields with it on day one. is_latest stays consistent with the links.
# An authoritative marker: at most one version per item, enforced by the database or by one write path, never by convention. This ticket provides the field and the invariant; which version gets it is H4's rule (SCRUM-37, W9) and the adjudication's accept (SCRUM-99).
# An item's versions can be read back with author kind, model and supersession links, for F1's events (SCRUM-98, W9) and F5's timeline (SCRUM-106, W10).
# Tests, each failing on the old behaviour where there was one: two models annotate one item and both versions survive; a superseding version leaves the old one unchanged and linked; a second authoritative marker on the same item is refused; existing AI rows read back with their model.

Out of scope: which version an export carries (H4); provenance events (F1); the reviewer's correction write path (D3).

Schema change in the break, alongside SCRUM-110's: agree the order on day one. Development PostgreSQL databases are reset afterwards (SCRUM-94 rule, db_schema_strategy.md).

Collaboration:
- SCRUM-110 (D9, Jingwei): first writer of the supersession fields.
- SCRUM-99 (E3, Yi): accept selects one existing judgement through the adjudication.
- SCRUM-32 (D3) and SCRUM-37 (H4), both W9: the reviewer's correction is a version; H4 marks the authoritative one.
- SCRUM-98 (F1, W9): its events point at these records.{noformat}
```

---

## SCRUM-52 — Dispute: Adjudicator queue and authorization

Replace the description with:

```
{noformat}Related to user story D8, E3

BACKEND ONLY. Mid-semester break, Parth. Rewritten 2026-10-01.

Most of this is on main already: GET /tasks/{task_id}/work-queue/adjudication (list_adjudication_queue, app/services/task_work_queue_service.py:208) lists items with an open escalation on an active task, and the route requires ADJUDICATE (app/api/routes/tasks.py). The second-review queue's rule — a submission's second approval is never offered to its first approver — came with PR #35. What is missing is client answer R2-8: an adjudicator may not decide on work they annotated or reviewed.

# The adjudicator queue never offers an item whose disputed work the caller annotated or reviewed, administrators included — no override (api_surfaces.md).
# One helper decides independence, shared with SCRUM-99, which refuses the decision on the same rule. The queue must never offer what the decision would refuse.
# The route keeps requiring ADJUDICATE; a caller without it is refused with 403.
# The second-review exclusion (D8 part) is verified with a test, not rebuilt.
# Tests: an annotator of the item, a reviewer of it, and an administrator who annotated it are not offered it; an unrelated arbitrator is; a caller without ADJUDICATE gets 403; a submission's first approver is not offered its second approval.

Collaboration:
- SCRUM-99 (E3, Yi): the independence helper and the dispute record; agree both on day one.
- SCRUM-101 (E1, Yi): automatically opened disputes reach this queue like routed ones.
- SCRUM-103 (E6, Jingwei, W10): the screens read this queue.{noformat}
```

---

## SCRUM-68 — Evaluation1: Scenario harness that drives the workflow end to end

Replace the description with (the subtasks are kept as acceptance criteria):

```
{noformat}Related to user story I1

BACKEND (evaluation). Mid-semester break, Jingwei. Updated 2026-10-01.

Testing individual pieces says nothing about whether the workflow holds together. This is the runner and the step vocabulary it executes.

Status 2026-10-01: in review as PR #39 (head ac4c57b), no review yet. apps/hej-api/evaluation/ holds TOML cases, a harness that drives the API in process as each case's seeded users, scripted AI replies behind the text analyzer's client, and a pass/fail report naming the first failing step, with a JSON report per run. Four cases: EV-000 single accept, EV-001 dual sign-off with a refused self-approval, escalation, adjudication and export, EV-002 an AI first pass waiting for a person, EV-003 a project's dual sign-off as a floor. tests/test_evaluation_cases.py runs every case, so CI runs them on SQLite and PostgreSQL. The last merge of main (#28, #41, #42) has the driver activate each case's task, since a draft task refuses work after PR #41. The decisions are in docs/adr/adr006_evaluation_harness_drives_the_api.md.

# A harness drives a scenario end to end without manual clicking. (PR #39)
# Annotation, review, dispute and final judgement run in a single scenario (EV-001). Cross-validation — D7's second review — joins once SCRUM-51 lands; that case belongs to SCRUM-70.
# Each scenario states its expected outcome and reports pass or fail. (PR #39)
# The scenario file format: named steps plus the outcome each expects. (PR #39, documented in evaluation/README.md)
# Steps act as distinct seeded users, so role separation is exercised rather than bypassed. (PR #39)
# The loop is proved with one trivial scenario (EV-000).

Done when PR #39 is reviewed by someone other than its author and merged, CI is green on both databases, and ADR 006 is accepted with it.

Collaboration:
- SCRUM-69 and SCRUM-70 (Hanchen, break) build on this harness and its case format; agree the format before they start.{noformat}
```

---

## SCRUM-69 — Evaluation2: Repeatable runs and regression reporting

Replace the description with:

```
{noformat}Related to user story I1

BACKEND (evaluation). Mid-semester break, Hanchen. Rewritten 2026-10-01. Builds on PR #39 (SCRUM-68).

A run that cannot be repeated proves nothing, and a result nobody can compare hides regressions rather than revealing them.

Already delivered by PR #39: every case builds its own world in a fresh database (SQLite in memory or a throwaway PostgreSQL schema), so no reset between runs is needed; the AI's replies are scripted, so a case has one correct outcome; cases carry stable ids (EV-000 …); each run writes a JSON report. What is left is comparing runs.

# Running the same cases twice gives the same result per case. A test proves it, comparing only what should be stable — not ids, timestamps or database names.
# A run summary records, per case id: pass or fail, the first failing step, and the run's commit and database.
# A run can be compared with a baseline (the previous run, or a named one): newly failing, newly passing, unchanged. A newly failing case exits non-zero, so CI and the command line both show a regression.
# The human summary and the machine-readable result come from the same data.
# The README says how to keep and compare a baseline.

Out of scope: runs against a live development server — ADR 006 keeps the scripted AI inside the harness.

Feeds SCRUM-72 and 73 (I3, I4, W10), which measure on repeatable runs, and SCRUM-74 (I5, W11).{noformat}
```

---

## SCRUM-70 — Evaluation3: Casebook structure and the adversarial categories

Replace the description with:

```
{noformat}Related to user story I2

BACKEND (evaluation). Mid-semester break, Hanchen. Rewritten 2026-10-01. Builds on PR #39 (SCRUM-68).

A system demonstrated on easy items proves nothing about the ones that matter. This ticket fixes the case template and writes the brief's adversarial categories as real cases; SCRUM-71 (W10) grows the casebook to 40.

# The case template: PR #39's TOML format plus a category, a one-line purpose, the gold reference it uses (dataset and source record id) and the expected outcome.
# One case or more for each category the brief names:
#* a confidently wrong AI suggestion;
#* a genuinely ambiguous item;
#* reviewers who disagree with no guideline to resolve it;
#* a guideline changed after annotation;
#* an item with missing provenance;
#* an unreviewed item reaching a proposed release;
#* a release containing a superseded item.
# Gold data comes from Group A's delivery package (dataset/text_dataset/: Few-NERD, AG News, Civil Comments, SemEval-2010 Task 8, 200 items each with gold annotations), which is outside the hej repository. Copy only the records the cases use into apps/hej-api/evaluation/ with their source and record id. The old path labeling_ai_assistnat_mvp/app/data/text/ no longer exists.
# A category whose surface does not exist yet — guideline versions (F2), provenance events (F1) and releases (H1–H4) arrive in W9–W10 — is written now with its expected outcome and skipped with that reason until its surface lands. No case asserts today's wrong behaviour as correct.
# Every bug found in the break's scenario testing becomes a case, and its bug ticket names the case.
# By the end of the break: the template, at least one case per category, the runnable ones passing in CI.

Collaboration:
- SCRUM-68 (Jingwei): the case format.
- SCRUM-99, 101 (Yi, break): the ambiguous-item and disagreement cases run once adjudication outcomes and automatic disputes land.{noformat}
```

---

## SCRUM-101 — Dispute: Detect reviewer disagreement automatically

Replace the description with:

```
{noformat}Related to user story E1

BACKEND ONLY. Mid-semester break, Yi. Rewritten 2026-10-01 (it was planned for W9 with D7's sampling).

Disagreement between independent reviews should open a dispute without anyone reporting it. Today a dispute exists only when a person routes one (route_escalation).

Depends on SCRUM-51's first slice (Parth, carried over from W8 into the break), which compares two distinct reviewers' verdicts on the same submission and flags disagreement — not started by 1 Oct. Agree on day one: SCRUM-51 owns the comparison, as one function, and this ticket calls it. If it has not merged by the middle of the break, build the comparison here as that function and let SCRUM-51 reuse it.

# When two distinct reviewers' verdicts on the same submission disagree — the definition is SCRUM-51's: one accepts while the other returns or rejects — and the resolved policy's disagreement_handling (resolve_for_task) is open_dispute, a dispute opens automatically on the record SCRUM-99 defines.
# With manual_review, the disagreement is flagged on the item and no dispute opens.
# An automatic dispute is recorded as opened by the platform, not by a person, so history and F4 (SCRUM-40, W9) can tell them apart.
# The dispute shows both conflicting decisions, who made them and when.
# Opening is idempotent: an item has at most one open dispute (route_escalation already refuses a second with 409), and a third review does not open another.
# The dispute reaches the adjudicator queue like a routed one (SCRUM-52).
# Tests: a disagreement under open_dispute opens one dispute; under manual_review it only flags; agreement opens nothing; a repeated review opens no second dispute.

Moved out: excluding disputed items from release is H3's (SCRUM-105, W10).

Collaboration:
- SCRUM-51 (D7, Parth): the comparison.
- SCRUM-99 (E3, Yi): the dispute record — agree its shape before building.
- SCRUM-52 (Parth): the adjudicator queue.{noformat}
```

---

## SCRUM-100 — Dispute: Keep the disagreement after the dispute is resolved

Append to the description, inside the `{noformat}` block:

```
Updated 2026-10-01: builds on SCRUM-99's adjudication record and may land in the same PR. SCRUM-99's reject outcome — the dispute closed without a winner — is recorded here as its own "unresolved / ambiguous" resolution. "Contested" must be readable from the item (for example a flag or a query on its resolution records) so SCRUM-72 (I3) and SCRUM-104 (H2) can report it.
```

---

## SCRUM-99 — Dispute: Record an expert adjudication as its own decision

Replace the last collaboration line:

```
- SCRUM-24 (B4, Dishank, PR #41): adds assert_task_accepts_work to decide_escalation — adjudication only on an active task.
```

with:

```
- SCRUM-24 (B4, PR #41, merged 30 Sep): decide_escalation already calls assert_task_accepts_work, so adjudication happens only on an active task.
- SCRUM-38 (F3, Hanchen, break): accept marks the selected judgement through F3's authoritative marker; agree the field on day one.
```

**Added 2026-10-04** (Hanchen; pasted on the board by Hanchen). Append inside the `{noformat}` block:

```
Evaluation casebook (SCRUM-68, PR #39; SCRUM-70): the casebook runs in CI on both databases, so changing what an adjudication does turns EV-001 red. That is expected, and this ticket updates it in the same PR:
- The harness's adjudicate step sends the legacy decision "finalize" with no annotation_id (evaluation/harness/driver.py). Implement the step SCRUM-70 defines as planned — do = "adjudicate", outcome = "accept" | "return" | "reject", accept = "<author alias or ai>" for an Accept, reason required — against the new decision route, and move EV-001 onto it.
- Un-skip the casebook cases that wait for this ticket (EV-012, the ambiguous item resolved by Reject), with their expectations checked against the scope answer on #40.
```

---

## SCRUM-110 — Review: Project owner reopens a finalised item

Replace the provenance criterion's first sentence:

```
# Provenance: F1's event record (SCRUM-98) moved to W11 and does not exist yet.
```

with:

```
# Provenance: F1's event record (SCRUM-98) is planned for W9 and does not exist during the break.
```

and the SCRUM-24 collaboration line:

```
- SCRUM-24 (B4, Dishank, PR #41): the active-only rule and assert_task_accepts_work come from it. If #41 has not merged, build on its branch's function.
```

with:

```
- SCRUM-24 (B4, PR #41, merged 30 Sep): the active-only rule and assert_task_accepts_work come from it.
```

---

## SCRUM-116 — Review: refuse a decision on a submission that is not awaiting the reviewer

Replace the last collaboration line:

```
- SCRUM-109 (D2, Parth) and SCRUM-24 (B4, PR #41) change the same function; agree the merge order.
```

with:

```
- SCRUM-109 (D2, Parth, carried over) changes the same function; agree the merge order. SCRUM-24's changes to it (PR #41) merged on 30 Sep.
```
