# Message to Yi — the authoritative-marker helper SCRUM-99 calls (SCRUM-38)

2026-10-02. Hanchen decided the same day that SCRUM-99's Accept marks the version it selects through
SCRUM-38's helper, rather than H4 setting every marker in W9. SCRUM-38 is one PR, so SCRUM-99 merges
after it. This message agrees the helper's signature before either side builds against it
(`../plans/plan-SCRUM-38.md` → "Before the first commit").

Context checked when drafting:
- #45 and #46 are both merged (`main` `66b7ff6`), so `reopen_task_item(..., cause=ADJUDICATION_RETURN)`
  is on `main` for SCRUM-99's Return.
- `CS57-Hanchen-scrum-38` was created from `66b7ff6` and is not pushed yet. It is pushed after commit 2,
  which adds the marker and the helper.
- Yi has no SCRUM-99 branch on the remote yet.

---

## To Yi (direct message)

```
Hi Yi, for SCRUM-99's Accept: it marks the judgement it selects as the item's authoritative version, through a helper in SCRUM-38 (mine, this week). I'd like us to agree the signature before either of us builds on it. Proposal, in app/services/annotation_versions.py:

    mark_authoritative(db, annotation, *, actor_id: int, cause: str) -> None
    clear_authoritative(db, task_item_id: str) -> str | None

mark_authoritative:
- marks one version on its item. It must be current (is_latest), otherwise 409;
- if another version on the item is already marked, it refuses with 409. A unique index also enforces at most one per item at the database level;
- records who, when and why on the annotation: authoritative_by, authoritative_at, authoritative_cause. For you, cause is "adjudication_accept", exported as a constant. H4's rule uses its own cause in W9;
- writes into your transaction and never commits, like reopen_task_item. Call it after your own checks (ADJUDICATE, independence), with the item locked.

clear_authoritative:
- removes the item's marker. reopen_task_item will call it, so your Return path gets it for free;
- Reject (unresolved) marks nothing, so an ambiguous item has no authoritative version.

Order and timing:
- schema order this week: #46 (merged), then SCRUM-38, then SCRUM-99. Your adjudication table goes after my columns in migrate_db_schema();
- I'll push CS57-Hanchen-scrum-38 once the marker and helper are in, today or tomorrow. You can branch SCRUM-99 from it as a stacked PR, then retarget to main once mine merges, or build against the signature and rebase later. Your call;
- your test can simply assert the selected annotation has is_authoritative true after Accept, and that a reopen clears it.

Anything you'd change in the signature or the 409 behaviour? Easier to change now than after we both build on it.
```
