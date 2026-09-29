# Review — PR #37, `CS57-Jingwei-scrum-50` (SCRUM-50: B2, G2, C5)

2026-09-27. Head `956e4da`, base `main`; merge-base `2fab5ec` — before #34, #33 and #35. `main` is now at
`ffaac66`. Thirteen commits, 61 files, +3543 / −604. **DIRTY** on GitHub: one conflict with `main`.

**On GitHub (checked with `gh pr view 37`):** open since 2026-09-25, no reviews, no reviewers requested, no
comments. CI green on the head (sqlite, postgresql).

**Read before this review:** SCRUM-50 on the board (rescoped 2026-09-20: the policy source, not the four
enforcements); Jingwei's plan (`sandbox/W7/2026-09-20-scrum-50-policy-enforcement-implementation-plan-from-Jingwei.md`);
the message to Jingwei on policy versions (`sandbox/W8/msg/message-client-qa-R1-corrections.md`, R1-7);
stories B2, G2, C5; client answers R2-4 (justification for accept, reject, modify, escalate — not
configurable), R2-7 (cross-review supplies; the AI is never an approval), R2-8 (postures defined by the
authority needed; explicit fields). On #35 Jingwei agreed `review_required_approvals` counts per submission
(D8 criterion 7) and said she would correct this PR's description.

**Recommendation: request changes — two small items.** The design is right and well argued in three ADRs;
every in-scope point of SCRUM-50 is met. Before merge: bring the branch up to date with `main`, and fix the
SQLite migration so existing posture rows stay valid. The rest is non-blocking.

## Verified

All on `main` (`ffaac66`) + #37, with the three adjustments Jingwei listed on #35 (the `tasks.py` imports;
a `note` on `_route_to_expert` in `test_item_completion.py`; `ai_assisted` for the AI-only item in
`test_project_policy_enforcement.py`):

- Backend SQLite **661 passed, 6 skipped**. Web: `tsc` clean, `eslint` 0 errors (32 warnings), vitest **242
  passed**. PostgreSQL not run locally; CI is green on the head (before `main` moved).
- #37 and #28 do not conflict and do not interact (checked 2026-09-27: main + #28 + #37 → 664 passed).
- The web's escalate sends the justification as the route's `note`, so the new 422 on a note-less route
  does not break the screen.

## Scope — SCRUM-50 on the board, point by point

| # | Board description | On `956e4da` + `main` |
| --- | --- | --- |
| 1 | Project policy is a third input, precedence organisation → project → task | ✅ `load_policy_inputs` → `resolve_with_inputs`; the project count is a floor a task may raise (adr002) |
| 2 | `cross_review_percentage`, `disagreement_handling`, `governance_model` on `ResolvedPolicy`; consumers never read `project_policies` | ✅ plus the two posture fields. Every resolution goes through `resolve_for_task`/`load_policy_inputs`, including `main`'s work queue |
| 3 | `review_required_approvals` sourced from project policy and enforced here | ✅ With #35 on `main`, enforced per submission and since the last submission |
| 4 | Effective-policy display labels each value enforced or recorded | ✅ one server map (`policy_enforcement`), on the resolved policy, the project policies read and the export |

G2: criterion 1 ✅; 2 and 3 recorded, labelled so, SCRUM-107 ✅; 4 ✅ (Policies page and export `policy`
block); 5 ✅ explicit fields; 7 ✅ (with R2-7's test). C5 via R2-4 ✅: accept, reject, adjust/revise and
escalate, including the route, refuse an empty justification. B2 criterion 2 (versions) is SCRUM-53, out of
scope as stated.

## Fix before merge

### 1. The branch is behind `main` and does not merge

The `tasks.py` import conflict (`Annotated, Any, Literal`), and the two test adjustments above, all from #33
and #35. Jingwei already listed them on #35.

### 2. The SQLite migration leaves existing Expert-gate and Arbitration-ready policies invalid

`migrate_db_schema` adds `expert_gate_required` and `adjudication_mandatory_on_dispute` with `DEFAULT 0`,
and `backfill_project_policies` derives them only for rows it inserts. An existing policy row keeps 0.
Probe on a pre-#37 SQLite schema with one `expert_gate` and one `arbitration_ready` project: after the
migration both rows read `(0, 0)`, and `validate_project_policy_for_governance` refuses each stored row
("expert_gate governance requires expert_gate_required to be true"). So those projects show the wrong
posture on the Policies page and in the export, and any later policy update is refused. PostgreSQL dev
databases are reset, so only SQLite is affected.

**Fix:** after adding the columns, set them from the governance model, as the backfill does —
`UPDATE project_policies SET expert_gate_required = 1 WHERE project_id IN (SELECT id FROM projects WHERE
governance_model = 'expert_gate')`, and the same for `adjudication_mandatory_on_dispute` and
`arbitration_ready` — with a migration test like `test_sqlite_migration_uses_the_catalog_default`.

## Non-blocking

- **A task's weaker bundle keeps its name.** Task `review_single_pass_v1` under a two-approval project
  resolves to `review_policy_ref=review_single_pass_v1`, `review_mode=dual_signoff`, 2 approvals, source
  `project`. The number is right; the name is the rule not in force, and it is shown on the task card and
  exported. Name the bundle in force, as an inheriting task already does (`REVIEW_REF_BY_MODE`), or refuse a
  bundle below the floor at task create/update (the card already disables it).
- **The consumer test predates the work queues.** `main`'s review queue reads `review_required_approvals`
  through `resolve_for_task` (so one implementation holds), but `test_project_policy_consumers.py` does not
  spy on it. Worth adding when the branch takes `main`.
- **Docs:** adr002's consequence "approval counts above two on items with several annotations depend on
  the review naming the annotation" is resolved (#34 merged). The PR description still says approvals count
  per unsampled item; per submission was agreed on #35.

## Comment for GitHub (ready to paste)

````markdown
Thanks @Jingwei-Lin — a clear design, and the three ADRs make the decisions easy to check. I reviewed it on `main` (`ffaac66`) + this branch, with the three adjustments you listed on #35: SQLite 661 + 6 skipped; web `tsc` clean, lint 0 errors, vitest 242. Every in-scope point of SCRUM-50 holds, including the enforced/recorded map, and G2 1, 4, 5 and 7. Your web escalate already sends the justification as the route's `note`, so the new 422 doesn't break the screen. It doesn't touch #28 (main + #28 + #37 passes).

**Two things before merge:**

1. **The branch needs `main`**: the `tasks.py` imports, the `note` on `_route_to_expert`, and `ai_assisted` for the AI-only item in `test_project_policy_enforcement.py`, as you listed on #35.
2. **The SQLite migration leaves existing Expert-gate and Arbitration-ready policies invalid.** `migrate_db_schema` adds the two posture columns with `DEFAULT 0`, and `backfill_project_policies` derives them only for rows it inserts. On a pre-#37 SQLite database with one `expert_gate` and one `arbitration_ready` project, both rows read `(0, 0)` after the migration, and `validate_project_policy_for_governance` refuses each stored row. So those projects show the wrong posture on the Policies page and in the export, and any later policy edit is refused. PostgreSQL is reset, so only SQLite is hit. A fix is to set the columns from `projects.governance_model` after adding them, the way the backfill does, and add a migration test like `test_sqlite_migration_uses_the_catalog_default`.

**Non-blocking:**
- A task's weaker bundle keeps its name. `review_single_pass_v1` under a two-approval project resolves to `review_policy_ref=review_single_pass_v1` with `dual_signoff` and 2 approvals (source `project`). The count is right, but the task card and the export name a rule that isn't in force. Either name the bundle in force, as an inheriting task already does, or refuse a bundle below the floor at task create/update. The card already disables that option.
- `main`'s review queue now reads `review_required_approvals` through `resolve_for_task`, so there is still one implementation, but `test_project_policy_consumers.py` doesn't spy on it yet. Worth adding with the merge.
- adr002's note that counts above two "depend on the review naming the annotation" is resolved now that #34 has merged, and the description's "per unsampled item" should read per submission, as agreed on #35.

Happy to approve once 1 and 2 are in.
````

## Round 2 — `944ae94` (2026-09-27)

**Posted:** the round-1 comment above as a **Request changes** review (09:40, at `956e4da`). Jingwei pushed
five commits (10:02) and replied point by point; the description now says per submission.

| Round-1 point | Commit | Checked |
| --- | --- | --- |
| 1. Take `main` | `2047cd6` | `main` (`ffaac66`) is an ancestor of the head; GitHub CLEAN; imports, the escalation `note` and the `ai_assisted` fixture as listed |
| 2. SQLite posture migration | `fda5aa8` | Round-1 probe re-run: expert-gate row `(1, 0)`, arbitration-ready `(0, 1)`, both pass `validate_project_policy_for_governance`. Sets the flags only in the run that adds each column; an arbitration-ready row recorded as `manual_review` becomes `open_dispute` (recorded, never enforced) |
| Bundle name | `9b2ed28` | Named, not refused: single pass under a two-approval project → `review_dual_signoff_v1` (source `project`); a superseded bundle → its successor; a task stricter than its project keeps its own (source `task`). The task's stored ref is unchanged |
| Consumer test | `93ce02e` | The review queue is spied and read after one of two approvals; it must still offer the item |
| Docs | `944ae94` | adr002's SCRUM-27 note and `api_surfaces.md` updated; description corrected |

**Verified** on `944ae94`: backend SQLite **663 passed, 6 skipped**; PostgreSQL 18 (Sydney session) **669
passed**; web `tsc` clean, lint 0 errors, vitest **242 passed**. CI green.

**Left, not blocking:** `REVIEW_REF_BY_MODE` has one bundle per mode, so a project count of 3 or more names
`review_dual_signoff_v1`, whose own rule says 2; the count shown beside it is right.

**Recommendation: approve.**

### Approval comment (ready to paste)

```markdown
Thanks @Jingwei-Lin — all five are in, and I re-checked each on `944ae94`: SQLite 663 + 6 skipped, PostgreSQL 669 (Sydney session), web `tsc` clean, lint 0 errors, vitest 242.

- My migration probe now passes. On a pre-#37 SQLite schema, the expert-gate row reads `(1, 0)` and the arbitration-ready row `(0, 1)`, and both pass `validate_project_policy_for_governance`.
- The resolved bundle names the rule in force. Single pass under a two-approval project gives `review_dual_signoff_v1`, a superseded bundle gives its successor, and a task stricter than its project keeps its own. Naming rather than refusing is the better call, for the reason you give.
- The review queue is in the consumer check at the point where it matters, one approval of two.

One small thing for later, not for this PR: `REVIEW_REF_BY_MODE` has one bundle per mode, so a project count of 3+ is named `review_dual_signoff_v1`, whose own rule says 2. The count shown beside it is right.

Approving.
```
