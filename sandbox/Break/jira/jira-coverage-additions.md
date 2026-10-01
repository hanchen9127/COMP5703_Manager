# Board additions — story and deliverable coverage

2026-10-01. From a coverage check of every story against the board export of 2026-10-01 19:55 and `origin/main`
(`dd91758`). Every story not complete has an open ticket, and no open ticket maps to no story. The gaps were
inside stories and deliverables: criteria no ticket owns, defects whose closure check no ticket owns, and the
brief's "full journey on realistic data". Decided by Hanchen the same day: write all three into the tickets
below; K1, K2 and K4 (technical report, per-member decision records, demonstration) stay set aside on the board
and are tracked outside Jira.

Each block is appended inside the ticket's `{noformat}` block, after its existing text.

| Ticket | Week | Adds |
| --- | --- | --- |
| SCRUM-37 | W9 | C5's last criterion: reasoning travels with the exported value |
| SCRUM-51 | W9 (second slice) | D7's per-task report, and R2-7's hold and "supplies, not stacks" |
| SCRUM-108 | W11 | H5's closing check |
| SCRUM-71 | W10 | Regression cases for fixed High defects; one full-journey case on a Group A record |
| SCRUM-75 | W11 | Issue 1 as a process item; the API-level limit of the end-to-end tests |

---

## SCRUM-37 — Provenance: Guarantee one canonical answer per task item

```
Added 2026-10-01 (coverage of C5): C5's last criterion has no other ticket — "carry reasoning into the export alongside the decision". The backend already refuses a decision without a justification where the policy requires one (review_policy_enforcement.py), but export-annotations carries no reasoning.
- Each exported authoritative value carries its reasoning: the annotator's rationale on a judgement, and the justification of the review or adjudication that made it authoritative.
- Superseded versions carry their own reasoning in the history.
- Test: an exported judgement carries its verdict, its rationale and the deciding justification.
```

---

## SCRUM-51 — Review: Independent second reviewer (second slice, W9)

If the second slice is split into its own ticket, append this there instead.

```
Added 2026-10-01 (coverage of D7 and the client's answer R2-7):
- Supplies, not stacks: a cross-review provides the second independent approval the policy requires; under dual sign-off with 100% cross-review that is two looks, not three.
- A gate, not an audit: a sampled submission's item does not canonicalise until its cross-review is complete; unsampled items proceed as before.
- The AI first pass is never an approval or a reviewer slot.
- A per-task report: how many submissions were sampled, how many have both reviews, and how often the two reviewers agreed. SCRUM-72 (I3, W10) reports the agreement coefficient on top of these counts.
- Tests: a sampled item stays uncanonicalised until its cross-review lands; a cross-review counts as the second approval rather than a third; the report's counts match a seeded task.
```

---

## SCRUM-108 — Release: Show real releases, policy and history on the project screens

```
Added 2026-10-01 (coverage of H5): H5's closing check has no other ticket — the export figures agree with the task screen once H1–H4 have reshaped the export path. The figures on the export list (item count, completed count) are checked against the task screen and the project overview (SCRUM-89) with one test, using is_task_item_export_eligible as the single rule.
```

---

## SCRUM-71 — Evaluation4: Grow the casebook to 40–60 cases

```
Added 2026-10-01 (coverage of defects and deliverables):
- Regression cases that double as closure checks for the fixed High defects whose closure is still pending: 10 (invalid status values saved), 15 (dispute send-back — through Return, after SCRUM-99), 16 (dataset registration not transactional), 20 (AI failures disguised as annotations), 29 (intake conflict reported as 500). A passing case closes the defect; record it on this ticket and in mission.md's defect table.
- One full-journey case on realistic data, the brief's first success criterion: a record from a Group A dataset (dataset/text_dataset/) imported through JSONL intake (B7), annotated, reviewed, cross-reviewed, disputed, adjudicated and released, with its provenance read back at the end.
```

---

## SCRUM-75 — Evaluation8: Findings record including negative results

```
Added 2026-10-01 (coverage of deliverables):
- Issue 1 (a live API key once committed to source): the key was removed from code; record whether the provider key was rotated. A process item, not code.
- Record the limits of the test suite as findings: the end-to-end tests drive the API in process, not the browser (ADR 006), so the screens are covered only by component tests and the manual walkthroughs.
```
