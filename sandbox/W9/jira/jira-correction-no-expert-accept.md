# No expert Accept of a reviewer's correction — ticket updates (2026-10-12)

> **VOID — do not apply.** The team decided on 2026-10-12 to build the expert route instead, with
> reconciliation taking the accepted correction in place of the original answer. See
> `jira-expert-accepts-correction.md`. Kept only as the record of the check of 2026-10-12.

**If dropped:** for time and complexity, no expert's Accept selects a reviewer's
correction. On `main` (PR #58, SCRUM-32) a correction is a proposal kept whole beside the answer; it
becomes the item's answer only when the annotator adopts it in a resubmission that is then reviewed and
approved. An escalation still carries the correction to the expert, who can read it, but the expert's
Accept (PR #48, SCRUM-99) accepts the disputed answer, and item reconciliation never offers a correction
as a candidate.

Checked against the board export of 2026-10-12 17:06. Five tickets mention corrections:

| Ticket | Status | Change |
| --- | --- | --- |
| SCRUM-37 (H4) | In Progress, Dishank | Criterion 2 — remove the expert route (below). This narrows the ticket; it adds nothing |
| SCRUM-71 (I2) | To Do, unassigned | Issue 5's regression case — remove the expert route (below) |
| SCRUM-32 (D3) | Done, Jingwei | Append a note (below); the original text stays as the record of what was agreed |
| SCRUM-98 (F1) | In Progress, Parth | None — adoption only, which the decision keeps |
| SCRUM-38 (F3) | Done | None — keeps outputs separate, says nothing of the expert route |

No ticket owned building the expert's Accept of a correction: SCRUM-99's description never named it.
It was a seam in ADR 012 and SCRUM-32's text.

---

## SCRUM-37

Replace criterion 2.

**Old:**

```
# Which version is authoritative follows the recorded decisions: the approved submission on a single-submission item; the adjudication's accepted judgement on a disputed item, which may be a reviewer's correction (SCRUM-32). A correction is never authoritative on its own: it becomes the answer through an independent expert's Accept — never the reviewer who made it — or through the annotator adopting it in a resubmission that is then approved. Record the rule in api_surfaces.md.
```

**New:**

```
# Which version is authoritative follows the recorded decisions: the approved submission on a single-submission item; the adjudication's accepted judgement on a disputed item. A reviewer's correction (SCRUM-32) is never authoritative itself, and no expert's Accept selects it (decided 2026-10-12): it becomes the answer only when the annotator adopts it in a resubmission that is then approved. Record the rule in api_surfaces.md.
```

Add at the end of the description, before the closing `{noformat}`:

```
Updated 2026-10-12: the expert route for a reviewer's correction is dropped (team decision, time and complexity), so criterion 2 no longer has a branch where an adjudication accepts a correction. Nothing is added.
```

---

## SCRUM-71

Replace the issue 5 sentence in criterion 4.

**Old:**

```
# One regression case for each Critical defect above. Issue 5's case: a reviewer's correction is kept whole beside the answer and is never counted as an answer until an expert's Accept or the annotator's adoption (PR #58, ADR 012).
```

**New:**

```
# One regression case for each Critical defect above. Issue 5's case: a reviewer's correction is kept whole beside the answer and is never counted as an answer unless the annotator adopts it in a resubmission (PR #58, ADR 012; no expert Accept of a correction, decided 2026-10-12).
```

---

## SCRUM-32

Done: leave the text as it was agreed, and append before the closing `{noformat}`:

```
Updated 2026-10-12: the expert route is dropped (team decision, time and complexity). A correction becomes the item's answer only when the annotator adopts it in a resubmission that is then approved. An escalation still carries the correction, and the expert can read it, but the expert's Accept (SCRUM-99, PR #48) accepts the disputed answer, never the correction. The "Depends on: SCRUM-99's Accept" line no longer applies.
```

---

## Not changed here

- **ADR 012** (`hej/docs/adr/adr012_a_reviewer_correction_is_a_proposal.md`) still lists "SCRUM-99's Accept
  can make one authoritative" under *Seams*, and the casebook README says a correction counts "once an
  expert's Accept makes it authoritative". Both are in `hej`, so they change through a PR.
- **`story_src.csv`** D3 criterion 3 and subtask 5, and `roadmap.md` W9 group 4 and close collaboration
  3 ↔ 4, still name the expert route.
