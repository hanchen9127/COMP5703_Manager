# Board descriptions — W10 tickets

2026-10-01. From the board export of 2026-10-01 19:27, checked against `origin/main` (`dd91758`) and
`info/issues.md`. Points are as set on the board the same day. W10 runs 15–21 Oct; groups only, owners picked
at the W10 meeting (`specs/roadmap.md` → W10). Every description names its related defects from
`info/issues.md`, or says there are none.

| Ticket | Story | Points | Issues | Verdict |
| --- | --- | --- | --- | --- |
| SCRUM-105 | H3 | 2 | 4, 19, 27 | **Append** — criteria are right; add the dependencies and the closure checks |
| SCRUM-104 | H2 | 2 | 4 | **Append** — add the client's minimum (R2-5) and how the check works |
| SCRUM-103 | E6 | 2 | 15 | **Append** — the desk's decision values change with SCRUM-99; the arbitration view's three outcomes are missing |
| SCRUM-73 | I4 | 3 | 20 | **Replace** — the blind-then-reveal protocol in its title is not in its criteria |
| SCRUM-71 | I2 | 2 | 2, 4, 5, 6, 7, 8 | **Replace** — add the W10 target and regression cases for the fixed Critical defects |
| SCRUM-72 | I3 | 1.5 | none | **Replace** — the fixture path and the harness have changed |
| SCRUM-45 | J4 | 1.5 | 9, 30 | **Replace** — one line, no criteria |
| SCRUM-106 | F5 | 1.5 | 21, 22 | **Edit and append** — it says W11; add what it reads |

Two findings while checking: **issue 27 looks fixed on `main`** — `EXPORT_ELIGIBLE_TASK_ITEM_STATUSES` now holds
only `canonicalized` — although `mission.md` still lists it as Open; and **issue 19**'s rule is aligned by
PR #26 with its closure check still pending. SCRUM-105 carries both closure checks.

---

## SCRUM-105 — Release: Refuse a release that fails its pre-release checks

Append to the description, inside the `{noformat}` block:

```
Updated 2026-10-01. Related issues: 4 (Critical, a finalised item exporting conflicting answers — fixed by SCRUM-37 in W9, enforced here), 19 and 27 (closure checks below).

Reads, all landing in W9: F1's events (SCRUM-98) for "incomplete provenance", F2's versions (SCRUM-53) for "superseded versions", H4's authoritative value (SCRUM-37) for which version a release carries, and H1's release record (SCRUM-102), which must not be created when a check fails. "Open disputes" is E1's release exclusion, moved here from SCRUM-101 on 2026-10-01.

- Define each check in api_surfaces.md: unreviewed = not export-eligible (is_task_item_export_eligible, canonicalized only); incomplete provenance = an item with no recorded event for a step its workflow took; superseded = the release would carry a version that is not the authoritative one; disputed = an item with an open escalation.
- The refusal is a 409 whose body lists each offending item with every reason that applies.
- Closure checks: confirm issue 19 (task completion and export readiness agree, PR #26) and issue 27 (no "approved" status in the export rule — the set now holds only canonicalized) on main, and record both on this ticket.
- Tests: one refusal per reason, each naming its items; a passing gate creates the release; a refused one creates nothing.
- Collaboration: SCRUM-104 (H2, same week) writes the manifest only after this gate passes.
```

---

## SCRUM-104 — Release: Produce a manifest for every release

Append to the description, inside the `{noformat}` block:

```
Updated 2026-10-01. Related issue: 4 (Critical) — the manifest names one resolution per item, the authoritative value SCRUM-37 (H4, W9) selects.

The client's minimum (R2-5): release id and version, the included items, the resolution selected per item, and the task, guideline and policy versions. Versions come from F2 (SCRUM-53, W9); each item's provenance pointer is its F1 event chain (SCRUM-98, W9).

- The manifest is written with the release (SCRUM-102, H1) and never changed afterwards.
- "Checked independently": the manifest carries a hash of the artefact and of each item's entry, so anyone holding both can verify the release without the platform. Document the check in the README or api_surfaces.md.
- An item resolved as ambiguous is listed with that resolution and no value.
- Tests: the manifest matches the artefact; changing a byte of the artefact fails the check; an ambiguous item appears as such.
- Collaboration: SCRUM-105 (H3, same week) — the manifest is written only after the gate passes; SCRUM-74 (I5, W11) rebuilds a release from its manifest.
```

---

## SCRUM-103 — Dispute: Connect the dispute and arbitration screens

Append to the description, inside the `{noformat}` block:

```
Updated 2026-10-01. Related issue: 15 (dispute send-back, fixed in PR #17, closure check pending). The task dispute desk (components/task-dispute-desk.tsx) still sends decision "finalize" or "send_back"; SCRUM-99 (E3, break) replaces them with accept, return and reject, each with a required reason. Close issue 15 through Return: an item returned from a dispute goes back to open work.

- The arbitration view offers the expert Accept (choosing one of the existing judgements), Return and Reject, each requiring a reason (client answer R2-1). Accept names the judgement it selects.
- The arbitration and dispute lists read the adjudicator queue (SCRUM-52), so an expert is never offered a dispute on work they annotated or reviewed (R2-8).
- Automatic disputes (SCRUM-101) appear like routed ones, marked as opened by the platform.
- Record for each of the three notFound() routes whether it was built or deleted, and why.
- Tests: each outcome changes real state and survives a refresh; Accept without a selected judgement and any outcome without a reason are refused.
```

**Added 2026-10-04** (Hanchen; pasted on the board by Hanchen). Append inside the `{noformat}` block:

```
Evaluation casebook (SCRUM-68, PR #39): the casebook runs in CI on both databases. If this ticket retires the legacy POST .../escalations/decision route (410, once the desk uses SCRUM-99's decision route), check first that no case or harness step still calls it; SCRUM-99 moves the harness's adjudicate step and EV-001 onto the new route. The harness's escalate step routes to "expert" by default while the work panel sends "secondary_reviewer": if this ticket changes what the panel sends, keep the two in line.
```

---

## SCRUM-73 — Evaluation6: Measure AI influence on human judgement, with blind-then-reveal

Replace the description with:

```
{noformat}Related to user story I4

BACKEND (evaluation and a protocol in the API). W10 (moved from W11 on 2026-10-01). Rewritten 2026-10-01.

The client's question is not whether assistance feels faster but what it does to the answers people give. Client answer R1-2 (2026-09-21): blind-then-reveal is an evaluation protocol, not a production mode — the annotator's independent judgement is recorded first, then the AI suggestion is revealed and they keep or revise.

Related issue: 20 (AI failures disguised as annotations — fixed). A failed AI pass is not a suggestion and is never counted as one, accepted or rejected.

# Rates per task: how often an AI suggestion was accepted unchanged, modified or overridden, from F3's separated AI and human versions (SCRUM-38, break).
# Time per item alongside them.
# Results grouped by the production mode recorded on each item (SCRUM-87, C4, W9): human-only against AI-first.
# Blind-then-reveal as a protocol a task can run on human annotation: the pre-reveal judgement is stored as its own record, then the suggestion is revealed and the final judgement stored.
# The API withholds the suggestion until the pre-reveal judgement exists — tested on the API, not by hiding it in the UI.
# Anchoring and automation bias: how often answers moved toward the suggestion, split by whether the suggestion was right against the gold reference — including how often a confidently wrong suggestion was accepted.
# Figures come from harness runs (SCRUM-68, 69) over the gold fixtures, so they can be repeated and compared.

Collaboration: SCRUM-72 (I3, same week) measures on the same runs; SCRUM-75 (I5, W11) reports the findings, negative results included.{noformat}
```

---

## SCRUM-71 — Evaluation4: Grow the casebook to 40–60 cases

Replace the description with:

```
{noformat}Related to user story I2

BACKEND (evaluation). W10, continuing into W11 on the same ticket. Rewritten 2026-10-01.

A standing commitment, not a block of work at the end: assembling the casebook in the final fortnight is the failure the brief warns about by name. Builds on SCRUM-70's template and adversarial categories (break).

Related issues: regression cases for the fixed Critical defects — 2 (finalised annotation overwritten), 4 (conflicting answers exported), 5 (reviewer correction lost), 6 (drafts without ownership), 7 (approving or deciding on one's own work), 8 (legacy review API rewriting history) — so a fix cannot silently regress.

# At least 40 cases by the end of W10; toward 60 in W11, adding the cases for the surfaces built that week.
# Each workflow surface maps to the cases it owes; every feature ticket from W9 lands its own cases as part of its Definition of Done.
# Backfill cases for the surfaces already built.
# One regression case for each Critical defect above.
# Every case passes in CI, or is skipped with the reason its surface is not built yet.
# The count is reviewed against the target at each weekly meeting.{noformat}
```

---

## SCRUM-72 — Evaluation5: Reviewer agreement and AI suggestion quality

Replace the description with:

```
{noformat}Related to user story I3

BACKEND (evaluation). W10 (moved from W11 on 2026-10-01). Rewritten 2026-10-01.

Raw percentage match flatters any task where one answer dominates. Report a real coefficient, and whether the assistant's stated confidence tracks whether it was right.

Related issues: none.

# Agreement by an established coefficient (for example Cohen's or Krippendorff's), not raw match, on D7's independent second reviews (SCRUM-51, W9). Name the coefficient and why in the report.
# Per task, and comparable across tasks.
# AI suggestion quality and confidence calibration alongside human agreement.
# Measured against the gold annotations in Group A's datasets (dataset/text_dataset/), through the records SCRUM-70 copies into the harness.
# Figures come from repeatable harness runs (SCRUM-68, 69).

Collaboration: SCRUM-73 (I4, same week) uses the same runs; SCRUM-100 (E4) marks which items were contested.{noformat}
```

---

## SCRUM-45 — Project lifecycle: Update and archive a project

Replace the description with:

```
{noformat}Related to user story J4

BACKEND AND FRONTEND. W10, Jingwei. Rewritten 2026-10-01.

A project can be created but not maintained. archived already exists as a project status in the model.

Related issues: 30 (a task or project with items can never be deleted) — decided in PR #41: no cascade, deleting a project that holds tasks is refused with 409. Archiving is the way to retire such a project. 9 (cross-project write bypass, fixed in PR #14) — every new update route keeps its project and organisation check.

# A project's name, description, team and storage settings can be updated by someone with MANAGE_PROJECT; its policy is updated through the policy endpoints, which version it from W9 (SCRUM-53).
# A completed project can be archived. An archived project stays viewable but is read-only: every write route under it refuses with 409 — enforced in the API, not only hidden in the UI.
# Archiving never changes a release (SCRUM-102, W9).
# Every change is recorded in the project's history.
# Tests: an update by someone without MANAGE_PROJECT is refused; a write under an archived project is refused; an archived project's releases are unchanged.{noformat}
```

---

## SCRUM-106 — Provenance: Show an item's whole timeline on one screen

Replace:

```
Replaces SCRUM-63 (deleted 2026-09-22 with its parent SCRUM-39). Planned for W11.
```

with:

```
Replaces SCRUM-63 (deleted 2026-09-22 with its parent SCRUM-39). Planned for W10 (moved 2026-10-01: W11 is the last sprint, and I5 checks what this shows).
```

and append to the description, inside the `{noformat}` block:

```
Updated 2026-10-01. Related issues: 21 and 22 (actor shown as "user" for system actions; duplicated escalation entries) — fixed in W9 by SCRUM-40 and 41. The timeline shows the actor kind they record.

- Reads F1's event read-back (SCRUM-98, W9); supersession as F3 (SCRUM-38) and H4 (SCRUM-37) record it; a reopen (SCRUM-110) starts a new round shown as such.
- Each entry names a person or an AI model, never "user" for a platform action.
- The panel it opens from is components/task-item-workspace-sheet.tsx.
- Tests: the order of events, the actor on each, and a reopened item showing both rounds.
```
