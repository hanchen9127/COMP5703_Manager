# New ticket — an expert can accept a reviewer's correction (2026-10-12)

**Decision (team, 2026-10-12):** build the expert route that ADR 012 left to SCRUM-99 and nobody built. A
return with a correction goes back to the annotator, as today; an escalation with a correction goes to the
expert, who may now Accept the correction itself. On an item needing several annotators, the item
reconciliation that follows takes the accepted correction **in place of** the original answer.

Checked against `origin/CS57-Jingwei` (PR #64) on 2026-10-12. Builds on #64, which shows the correction to
the expert; starts once #64 merges.

**Not in progress tickets:** SCRUM-99 is Done and never named this; SCRUM-37 (H4, Dishank) and SCRUM-98
(F1, Parth) are In Progress and take no new scope. SCRUM-37 needs nothing: it reads the authoritative
marker, which this ticket sets.

**Before creating it:** pick the owner and week at the 14 Oct meeting. Suggested: W10, 2 points. Yi wrote
#48's disputes and reconciliation; Jingwei holds #64 and is over his range in W9.

---

## Summary

```
Dispute: An expert can accept a reviewer's correction as the answer
```

## Description

```
{noformat}Related to user story D3, E3

BACKEND AND FRONTEND. W10. Added 2026-10-12 (team decision).

A reviewer who disagrees with an answer can escalate it with a correction (SCRUM-32, PR #58). The expert sees that correction on the dispute (SCRUM-103, PR #64), but can only Accept, Return or Reject the disputed answer itself: accepting the correction was left to SCRUM-99 in ADR 012 and was never built. D3's criterion 3 needs it: "A correction becomes the item's answer only when an independent expert accepts it in a dispute — never the reviewer who made it — or when the annotator adopts it in a resubmission."

# The adjudication decision can Accept the disputed answer's current correction instead of the answer: the request names it (accept_correction, or the correction's annotation id). It is refused with 422 when the answer has no current correction, or the id names anything else. Return and Reject are unchanged.
# The dispute records which version was accepted (a new column on annotation_disputes, added to migrate_db_schema(); development PostgreSQL databases are reset after it, SCRUM-94 rule).
# On an item needing one annotator, the accepted correction becomes the item's authoritative version (mark_authoritative, cause adjudication_accept, by the expert). The original answer stays current history: corrected, not erased. apply_completed_item_resolution today marks only review submissions, which leave corrections out.
# On an item needing several annotators, the item reconciliation that follows takes the accepted correction in place of the original answer as that author's candidate. Its acceptance evidence is the dispute that accepted it: _acceptance_evidence today looks up the dispute by subject_annotation_id, which is the original answer, so it must also find the dispute that accepted the correction. The original answer is not offered.
# Independence: the reviewer who wrote the correction never decides the dispute nor the reconciliation that offers it (tested; the existing conflict rule should already refuse them as the item's reviewer).
# A reopen supersedes the correction with its round and clears the marker, as for any answer.
# The export carries the accepted correction as the item's authoritative answer, with its role (reviewer) and its link to the answer it corrects; the original answer is history.
# The case page (#64) offers "Accept the reviewer's correction" only when the dispute has a current correction the expert may see, and the line "accepting the correction itself isn't available yet" goes.
# Docs in the same change: ADR 012's Seams, api_surfaces.md (dispute decision), workflow_states.md.
# Tests, each failing on the old behaviour: single-annotator accept of a correction marks it authoritative and exports it; two-annotator item — the reconciliation candidates are the correction and the other author's answer, not the original; an accept naming no or another correction is refused; the correction's author can't decide; a reopen clears it. A casebook case for the expert route (issue 5's regression case is SCRUM-71's).

Collaboration:
- SCRUM-103 (E6, Jingwei, PR #64): the case page and the correction field this builds on. Merge #64 first.
- SCRUM-99 (E3, PR #48): resolve_annotation_dispute, apply_completed_item_resolution and open_item_reconciliation are its code.
- SCRUM-37 (H4, Dishank): reads the marker this sets; no change to SCRUM-37.
- SCRUM-98 (F1, Parth): the adjudication event should name the accepted version. If F1 has merged, add the field here; if not, agree it with Parth rather than adding it to SCRUM-98.
- SCRUM-71 (I2): the expert route's case.{noformat}
```

---

## Also to change once the ticket exists

- **PR #64** (Jingwei): P3 "Accepting it stays with SCRUM-37", the page's "isn't available yet" line and
  its comment, and `api_surfaces.md` "Accepting the correction itself is SCRUM-37's" → name this ticket.
  Can be a review comment on #64, which has no review yet.
- **SCRUM-32** (Done): its "Depends on: SCRUM-99's Accept" line → this ticket. Optional note.
- **SCRUM-37** criterion 2 says "an independent expert's Accept" without naming who builds it: still true,
  no change.
- **`story_src.csv`**: D3's `scrum` gains the ticket through `tracking-sync` once its description says
  "Related to user story D3, E3". D3 subtask 5 ("the Accept itself is E3's (SCRUM-99)") → this ticket.
