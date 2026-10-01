# Board descriptions — W9 tickets

2026-10-01. From the board export of 2026-10-01 19:11, checked against `origin/main` (`dd91758`, after #41 and
#42). Points are as set on the board the same day. W9 runs 8–14 Oct; groups only, owners picked at the W9
meeting (`specs/roadmap.md` → W9).

| Ticket | Story | Points | Verdict |
| --- | --- | --- | --- |
| SCRUM-98 | F1 | 3 | **Append** collaboration lines — the body is current (updated 2026-10-01) |
| SCRUM-53 | F2 | 3 | **Replace** — one line, no criteria |
| SCRUM-32 | D3 | 2.5 | **Replace** — still "depends on the client decision", no criteria |
| SCRUM-37 | H4 | 2.5 | **Replace** — still "depends on the SCRUM-27 client decision", no criteria |
| SCRUM-102 | H1 | 2 | **Append** — criteria are right; add scope and collaboration |
| SCRUM-40 | F4 | 1 | **Replace** — the text describes issue 5 (D3's truncated correction), not issue 21 |
| SCRUM-41 | F4 | 0.5 | **Replace** — no criteria |
| SCRUM-89 | J2 | 1.5 | **Edit** — the "don't start before SCRUM-43" warning is resolved |
| SCRUM-87 | C4 | 1 | **Replace** — names three modes (R1-2 moved blind-then-reveal to I4); wrapped in `{code:sql}` |
| SCRUM-85 | B3 | 0.5 | **Replace** — verify first; most of it is on `main` |
| SCRUM-91 | B1 | 0.5 | **Append** — verify first |
| SCRUM-49 | C5, D3, E1 | 0 | Complete (umbrella, updated by Hanchen) |
| SCRUM-51 | D7, E1 | 1.5 | Its second slice is already described on the ticket. If split, the new ticket's text is in `jira-W9-W11-replan.md` §3 |

All four schema-changing tickets of the week — SCRUM-98, 53, 32 and 87 — carry the same line: agree one schema
order on day one, and reset development PostgreSQL databases after it (SCRUM-94 rule).

---

## SCRUM-98 — Provenance: Record the production history of every label

Append to the description, inside the `{noformat}` block:

```
Collaboration (added 2026-10-01):
- SCRUM-38 (F3, break): events refer to the separated outputs and supersession links F3 records.
- SCRUM-40 (F4, W9): one set of actor kinds — a person, an AI model, the platform — for events and the audit history.
- SCRUM-110 (D9, break): its item_reopened history row (written through one helper, like record_item_taken) moves onto this record.
- SCRUM-32 (D3), SCRUM-53 (F2), SCRUM-87 (C4), all W9: one schema order, agreed on day one; development PostgreSQL databases are reset afterwards (SCRUM-94 rule).
- SCRUM-102 (H1, W9): "released" is the last event kind, written when a release is created.
- Read by SCRUM-104 and 105 (H2, H3, W10), SCRUM-106 (F5, W10) and SCRUM-74 (I5, W11).
```

---

## SCRUM-53 — Provenance: Version guidelines, sources and review policies

Replace the description with:

```
{noformat}Related to user story F2

BACKEND ONLY. W9. Rewritten 2026-10-01.

Nothing is versioned today. The guideline is the task's task_instruction, edited in place; project and organisation policies (ProjectPolicyDB, OrganizationPolicyDB) are edited in place with an updated_by; a data pointer carries source_version_ref (a real source hash since PR #42). An annotation records none of them, so no one can tell which guideline or policy an item was produced under.

Client answer R1-7: policies may change after a project starts, but history must not be rewritten — an edit creates a new version, new work follows it, and each item keeps the version that governed it.

# Editing a task's guideline creates a new version; earlier versions stay readable and are never changed.
# Editing a project's review policy creates a new version in the same way. resolve_for_task (SCRUM-50) resolves the version in force, and every caller keeps reading through it.
# Every annotation records the guideline version and the source version in force when it was submitted, and every item the policy version that governs it.
# A project manager can list the items annotated or reviewed under a superseded guideline or policy version.
# Decide in the PR, and record in an ADR: what counts as the guideline — task_instruction alone, or with the label definitions (PR #27) — and whether an item keeps its first policy version or moves to the new one for work not yet done. R1-7 says "new work follows the new policy version".
# Tests: an edit leaves the earlier version unchanged; an annotation made before an edit still cites the earlier version; the superseded-version list finds it.

Read by SCRUM-104 (H2, the manifest's versions) and SCRUM-105 (H3, refusing superseded versions), both W10.

Collaboration:
- SCRUM-98 (F1), SCRUM-32 (D3), SCRUM-87 (C4), all W9: one schema order, agreed on day one; development PostgreSQL databases are reset afterwards (SCRUM-94 rule).
- SCRUM-51 (D7): sampling reads the cross-review percentage of the policy version in force.{noformat}
```

---

## SCRUM-32 — Review: Persist reviewer corrections as structured data

Replace the description with:

```
{noformat}Related to user story D3

BACKEND, with the review panel's existing correction field. W9. Rewritten 2026-10-01.

A reviewer can correct an answer and find the correction nowhere in the result. Any review action may carry final_payload or final_verdict (TaskItemReviewActionRequest), and the web panel sends final_payload, but _legacy_review_notes_projection (app/api/routes/review_actions.py:315) keeps only its first 500 characters inside review_notes. Issue 5 (Critical).

Unblocked 2026-09-15: a reviewer's correction is a version authored by the reviewer, kept alongside the annotator's rather than replacing it.

# A decision that carries a correction — a final_payload or final_verdict that differs from the submission — creates a version authored by the reviewer, linked to the submission it corrects, with the reason "correction" (F3's supersession fields, SCRUM-38).
# The annotator's submission is unchanged and stays visible in the item's history.
# The correction is stored whole, never truncated; review_notes no longer carries it.
# Reopening the item shows the correction, marked as the reviewer's, beside the original.
# The export carries the corrected value where it is the authoritative one; which version is authoritative is H4's rule (SCRUM-37, same week).
# The review read returns the correction to the next reviewer only under the same independence rules as any decision (SCRUM-51's blind second review).
# Tests, each failing on the old behaviour: a correction longer than 500 characters survives whole; the original submission is unchanged; the corrected version names the reviewer as author and links to the original.

SCRUM-49 is the umbrella for review transitions; this is its D3 part.

Collaboration:
- SCRUM-38 (F3, break): the version and supersession model.
- SCRUM-37 (H4, W9): whether a correction is authoritative.
- SCRUM-98 (F1, W9): a correction is an event.
- SCRUM-53 (F2), SCRUM-87 (C4), W9: one schema order, agreed on day one; development PostgreSQL databases are reset afterwards (SCRUM-94 rule).{noformat}
```

---

## SCRUM-37 — Provenance: Guarantee one canonical answer per task item

Replace the description with:

```
{noformat}Related to user story H4

BACKEND ONLY. W9 (moved from W10 on 2026-10-01). Rewritten 2026-10-01.

An export carrying two conflicting "final" answers for the same item is unusable for training and indefensible to an auditor. GET /tasks/{task_id}/export-annotations (app/api/routes/tasks.py) groups annotations by created_by and exports the latest of each author: one slot per annotator, not one answer per item. Issue 4 (Critical).

Unblocked by the client's answer R2-2 (2026-09-24): one authoritative output plus the complete history.

# Each item carries at most one authoritative value, set through F3's authoritative marker (SCRUM-38). An item resolved as genuinely ambiguous (SCRUM-99's reject, SCRUM-100) carries none and says so.
# Which version is authoritative follows the recorded decisions: the approved submission on a single-submission item; the adjudication's accepted judgement on a disputed one; a reviewer's correction where the reviewer corrected the approved answer (agree with SCRUM-32). Record the rule in api_surfaces.md.
# The export carries the authoritative value once per item, with every other version as superseded history — never as a competing answer.
# An item whose required submissions are not all approved (the multi-annotator rule of PR #35) has no authoritative value yet and is not exported as final.
# Tests, each failing on the old behaviour: two approved submissions on one item export one authoritative answer and one superseded; an adjudicated item exports the accepted judgement; an ambiguous item exports no authoritative value.

Collaboration:
- SCRUM-38 (F3, break): the marker and its at-most-one invariant.
- SCRUM-32 (D3, W9): corrections.
- SCRUM-102 (H1, W9): a release pins the authoritative value.
- SCRUM-105 (H3, W10): the gate refuses superseded versions by this rule.{noformat}
```

---

## SCRUM-102 — Release: Create an immutable release artefact

Append to the description, inside the `{noformat}` block:

```
Scope (added 2026-10-01):
- A release belongs to a task, is created by a person with the export capability, and records who created it and when.
- It freezes, per item, the authoritative value SCRUM-37 (H4, same week) selects, and nothing for an item without one.
- The artefact (JSONL, as the export list promises today) is written once and served by the release's id; downloading it twice returns the same bytes, checked by a stored hash.
- The project export list (ProjectExportsService) lists real releases alongside today's derived packages; the screens are H6's (SCRUM-108, W11).
- Tests: editing an item after a release leaves the release's artefact and hash unchanged; two releases of the same task have different ids.

Collaboration: SCRUM-37 (H4) for the value per item; SCRUM-98 (F1) writes the "released" event; SCRUM-104 and 105 (H2, H3, W10) build on this record — the manifest and the gate that runs before a release exists.
```

---

## SCRUM-40 — Provenance: Record correct audit actor types

Replace the description with:

```
{noformat}Related to user story F4

BACKEND ONLY. W9 (moved from W10 on 2026-10-01). Rewritten 2026-10-01 — the earlier text described issue 5, which is SCRUM-32's.

History must tell what a person did from what the platform did by itself. task_audit_log_query.py:263 sets actor_kind = "user" for every entry, even where the actor shown is System, so an automated step reads as a person's decision. Issue 21.

# actor_kind is taken from what actually happened: a person, an AI model, or the platform (for example an automatic dispute from SCRUM-101, or the AI worker's output).
# An item's history can be filtered to human decisions only.
# The actor kinds match those of F1's provenance events (SCRUM-98, same week) — one set for both.
# Tests: a system-generated entry is never attributed to a person; an AI-authored step reads as the model; the human-only filter leaves out both.

Pairs with SCRUM-41.{noformat}
```

---

## SCRUM-41 — Provenance: Remove duplicate escalation audit changes

Replace the description with:

```
{noformat}Related to user story F4

BACKEND ONLY. W9 (moved from W10 on 2026-10-01). Rewritten 2026-10-01.

Escalation entries repeat their own summary as a change, which adds noise and hides real changes. Issue 22.

# An escalation's history entry lists only what changed — status, routing, decision — not its own summary again.
# Escalations routed and decided before this change still read correctly.
# Test: routing and deciding an escalation produce entries with no duplicated summary change.

Pairs with SCRUM-40.{noformat}
```

---

## SCRUM-89 — Project: Overview of status and progress

Replace the last paragraph:

```
The one that will actually take effort is criterion 2: the figures have to reconcile with SCRUM-43 (B6/H5, aligning task completion and export readiness). Don't start this before SCRUM-43 settles the counting rule, or you'll implement it twice.
```

with:

```
The one that takes effort is criterion 2: the figures reconcile with the task and export screens. Both rules it needs are on main: SCRUM-43's counting rule (PR #26, is_task_item_export_eligible) and the task states draft, active, paused, completed (SCRUM-24, PR #41). Build on the existing project page (apps/hej-web/app/projects/[projectId]/page.tsx) rather than a new screen. W9, Tim (updated 2026-10-01).
```

---

## SCRUM-87 — AI assist: Human-only and AI-first task modes

Replace the description with (note the `{noformat}` wrapper, not `{code:sql}`):

```
{noformat}Related to user story C4

BACKEND ONLY. W9 (moved from W10 on 2026-10-01). Rewritten 2026-10-01.

Seeing the machine's answer first changes the answer people give, so the mode an answer was made under must be on record. Both production modes exist: a task's annotation_mode is human_first or ai_assisted (set from the project policy's default_annotation_mode), and SCRUM-46 built the AI-first path — the AI's first pass goes to review, authored by the model, outside the human annotator count. Blind-then-reveal is not a mode: since the client's answer R1-2 (2026-09-21) it is the evaluation protocol SCRUM-73 (I4) runs.

# The mode in force is recorded on every item when its work starts, and does not change if the task's mode is edited later.
# Results can be grouped by that mode, so SCRUM-73 (I4, W10) can compare them.
# A human-only item never carries an AI suggestion: none is generated for it, and none appears in any of its API responses — tested on the API, not by hiding it in the UI.
# Tests: an item's recorded mode survives a later change of the task's mode; a human-only item's reads contain no AI output.

Collaboration:
- SCRUM-73 (I4, W10): reads the recorded mode.
- SCRUM-98 (F1), SCRUM-53 (F2), SCRUM-32 (D3), W9: one schema order, agreed on day one; development PostgreSQL databases are reset afterwards (SCRUM-94 rule).{noformat}
```

---

## SCRUM-85 — Task lifecycle: Create annotation and judgement tasks with a result shape

Replace the description with:

```
{noformat}Related to user story B3

W9 (moved from W10 on 2026-10-01). Rewritten 2026-10-01: verify first, then close or build the gap.

The records count B3 complete, while this ticket stayed To Do. Most of it is on main: tasks carry task_class (annotation or judgement) and annotation_type, which picks the annotation surface (SCRUM-112, PR #36), and labels can be defined per task (PR #27).

# Check each criterion on main and record the result on this ticket:
#* I can create a task under a project, choosing annotation or judgement and the task type;
#* the task records what a finished result looks like — labels for annotation, a verdict plus reasoning for judgement;
#* text tasks work end to end, and image and video tasks can be created without breaking.
# If all hold, close the ticket.
# If not, build only the gap. The likely one: label_schema_ref is still a string that only the AI batch reads (ai_batch_service.py), so a finished result is not checked against a shape. Then: a judgement task rejects a result with no verdict, and an annotation task one whose labels are not in its definitions — with a test each.{noformat}
```

---

## SCRUM-91 — Project lifecycle: Create a project scoped to an organisation

Append to the description, inside the `{noformat}` block:

```
Updated 2026-10-01: W9 (moved from W10), 0.5 points. Verify first: the records count B1 complete. Check each criterion on main, record the result here, and close the ticket if all hold. Otherwise build only the gap — most likely the cross-organisation test (a project in org A is invisible to a member of org B) and the create form showing the API's validation errors.
```
