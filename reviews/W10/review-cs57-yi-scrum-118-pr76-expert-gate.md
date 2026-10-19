# Review — PR #76, `CS57-Yi-scrum-118` (SCRUM-118, G2: the Expert Gate and the R2-7 check)

<https://github.com/USYD-CS-Capstone/hej/pull/76> · reviewed 2026-10-16 at `e3b3744` (11 commits, base `main` = `c3ac7a8`)

**Posted 2026-10-16 as Request changes** (the comment below, unchanged). Read from GitHub first: open, ready for review, no comments or reviews, CI SQLite and PostgreSQL
green at `e3b3744`, but **`CONFLICTING` / `DIRTY`**: `main` has since taken #70 (SCRUM-98, `c8d9f13`) and #73
(SCRUM-73, `6b29810`).

Prior context read: Yi's design note (`sandbox/W10/msg/SCRUM-118 Expert Gate design and SCRUM-107 questions.md`),
Hanchen's reply of 15 Oct (`2026-10-15-scrum-118-107-reply-for-Yi.md`), the rewritten ticket
(`sandbox/W10/jira/jira-scrum-118-107-rewrite.md`) and roadmap W10 group 8.

## Verdict: request changes — the merge with `main` only; the design and code are approved

The PR does what was agreed on 15 Oct, and the two additions from the reply are in:

- the R2-7 check in `mark_authoritative`, with a test that fails on `main`;
- the SQLite `migrate_db_schema()` column, with old rows read as `multiple_accepted_candidates`.

All three blocking points come from merging `main`, and Yi's own PR body already anticipates one of them.

## Checked

| Check | Result |
| --- | --- |
| Worktree `D:\COMP5703_Capstone\hej-review-76` at `e3b3744` | `main` checkout untouched |
| CI at `e3b3744` | ✅ SQLite and PostgreSQL green |
| Trial merge of `origin/main` (aborted afterwards) | Textual conflict in `evaluation/baseline.json` only |
| On the trial merge: expert gate, reconciliation, disputes, authoritative version, policy enforcement, all provenance suites | ✅ 149 passed, 3 skipped |
| On the trial merge: `python -m evaluation list` | ❌ `id EV-105 is already used by EV-105-the-expert-gate-…` — the casebook refuses to load |

## Against the agreed design (reply of 15 Oct, ticket text)

| Agreed | At `e3b3744` |
| --- | --- |
| Gate = one-candidate item reconciliation, `trigger_type` fixed at open, own CHECK | ✅ `ItemReconciliationDB.trigger_type` (no default, every opener names it); `open_item_reconciliation` needs exactly one for `expert_confirmation_required`, two or more otherwise; unknown trigger is a `ValueError` |
| `canonical_rule` held; dispute `adjudication_accept` passes; `reconciliation_choose` unchanged | ✅ `_single_or_several_accepted` (`review_policy_enforcement.py`) used at both former `canonicalized` returns. Tests: dispute Accept passes, dispute Reject of the other answer holds the remaining one, an expert's choice opens no second case |
| Confirmation derived, not stored | ✅ `SubmissionReviewState.expert_confirmed` — one named rule for SCRUM-124 to extend |
| Expert decides on the existing route with ADJUDICATE + independence | ✅ No new route; `test_nobody_who_worked_on_the_item_confirms_it` (annotator, reviewer, admin-annotator) |
| `expert_gate_required` in `ENFORCED_POLICY_VALUES` | ✅ |
| R2-7 in `mark_authoritative`: `ai_model` needs an approver or a person's decision with `actor_id` | ✅ `_a_person_has_reviewed`; 409; tests for unreviewed (refused), approved + platform rule, expert's own decision, human answer |
| SQLite migration | ✅ Additive `ALTER` with the CHECK; two tests (added, added once) |
| Front end: trigger shown, one-candidate case as Confirm / Return / Refuse, item says it waits | ✅ Desk Reason column, case page options and banner, Disputes table label, item panel note for every reader, case link only for deciders |
| Names unchanged | ✅ |
| Docs: ADR, `workflow_states`, `api_surfaces`, `db_schema_blueprint` | ✅ ADR 017 plus `governance-model.md` §7 |
| Trigger value `multiple_candidates` (ticket wording) | ➖ Uses `multiple_accepted_candidates`, the value the Disputes read model and `lib/api/disputes.ts` already carried. Better: one value, no mapping. Align the Jira text |

Two status-only callers of `item_status_after_accept` (`draft_service.py:603` on submit,
`task_item_status_resolution.py:529` on a send-back resubmission) don't open a case. Both run right after a new,
unreviewed answer, so they can't return `reviewed` for a single accepted answer. No stranded `reviewed` item without
a case.

## Fix before merge (all from merging `main`)

### 1. Casebook IDs EV-105 to EV-108 collide with #73's

`main` now has EV-105 to EV-111 (#73). This PR adds four more files with the IDs EV-105 to EV-108 under different
filenames. Git merges them silently, and the casebook then refuses to load:

```
EV-105-the-suggestion-waits-for-the-blind-verdict.toml: 1 problem(s)
  - id EV-105 is already used by EV-105-the-expert-gate-holds-an-answer-until-an-expert-confirms-it.toml
```

**Fix:** renumber this PR's four cases to **EV-112 to EV-115** (file names and `id`), resolve `baseline.json`
with both sides plus the new numbers, and re-run `--baseline evaluation/baseline.json --exact`. Update the PR
body, the casebook README and anything else that cites EV-105–108 for SCRUM-118 (`list --coverage`).

### 2. #70's reconciliation event says "accepted answers differ" for a gate case

After the merge, `open_item_reconciliation` writes #70's production event as
`event_kind="disputed", details={"reason": "accepted_answers_differ"}` for every case. On a gate case there is
one answer, so the production history states a reason that is false. The PR body already commits to this: "If #70
merges first, I'll merge `main` into this branch and change that event to read `trigger_type`".

**Fix:** write `details={"reason": trigger_type}` (or keep `reason` and add `trigger_type`; agree the key with
Parth) and add a test that a gate case's event carries `expert_confirmation_required`. Keep `event_kind`
`disputed` unless Parth prefers a new kind. A new kind would touch #70's CHECK and ADR 015, which is more than
this PR needs.

### 3. Merge `main` and re-run

Resolve `baseline.json` and confirm CI is green on both databases after the merge. Update the PR body's testing
section.

## Nits (not blocking)

- **N1.** No test runs an **AI-first** item through the gate: the AI answer is approved, a gate case opens, and an
  expert confirms it. That is the path where the gate and the R2-7 check meet (`reconciliation_choose` with the
  expert named). One test would pin it.
- **N2.** Align SCRUM-118's Jira text: `multiple_candidates` → `multiple_accepted_candidates`.
- **N3.** `ProjectDisputeCaseRead.trigger` mixes dispute and reconciliation values in one field. The Known
  limitations section already records it; fine as is.

## Comment for GitHub (ready to paste)

> Thanks, Yi. The design is exactly what we agreed on 15 Oct, and the two additions from my reply are in: the R2-7 check in `mark_authoritative`, with a test that fails on `main`, and the SQLite column. Reusing reconciliation keeps the gate small. ADJUDICATE and the independence check come for free, and `expert_confirmed` as one derived rule gives SCRUM-124 a single place to extend. CI is green at `e3b3744`.
>
> Requesting changes, only for the merge with `main` (#70 and #73 are in):
>
> 1. **Casebook IDs collide.** #73 added EV-105 to EV-111, and this PR's EV-105 to EV-108 have different file names, so git merges them silently. After a trial merge, `python -m evaluation list` refuses to load: `id EV-105 is already used by EV-105-the-expert-gate-…`. Please renumber yours to EV-112 to EV-115, resolve `baseline.json` with both sides, and re-run `--baseline --exact`.
> 2. **#70's reconciliation event.** After the merge, `open_item_reconciliation` writes `disputed` with `reason: accepted_answers_differ` for every case, a gate case included, where there is only one answer. As your PR body says, please make it read `trigger_type`, with a test that a gate case's event carries `expert_confirmation_required`. Keeping `event_kind = disputed` is fine unless Parth prefers otherwise.
> 3. **Merge `main` and re-run CI.**
>
> On the trial merge, the gate, reconciliation, dispute, authoritative and provenance suites pass (149 passed, 3 skipped). The only textual conflict is `baseline.json`.
>
> Small, not blocking: one test for an AI-first item through the gate (approved AI answer → gate case → expert confirms), where the gate and R2-7 meet. And `multiple_accepted_candidates` over the ticket's `multiple_candidates` is the right call. I'll align the Jira text.

---

## Addendum — #66 merged (2026-10-16, `9744b90`): one more merge fix

**Posted 2026-10-16 as a PR comment** (the draft from chat). #66 (Dishank, SCRUM-37 H4, authoritative export) merged after the review above. Files touched by
both PRs: `tests/test_export_provenance.py` and `api_surfaces.md`, with no textual conflict. The only textual
conflict on a trial merge with `main` is still `baseline.json`.

**Semantics: fine.** #66's export finds the reconciliation that chose the released version by
`decision == "choose_one"` and `selected_annotation_id` (`routes/tasks.py`), independent of the candidate
count. A gate confirmation (a one-candidate `choose_one`) is exported with `source = reconciliation_choose`, its
decider and time, as the PR body says.

**But two of #66's tests fail after the merge:**

```
FAILED tests/test_authoritative_export.py::test_the_resolution_names_the_decision_that_chose_the_answer[normalized]
FAILED tests/test_authoritative_export.py::test_the_resolution_names_the_decision_that_chose_the_answer[legacy]
sqlite3.IntegrityError: NOT NULL constraint failed: item_reconciliations.trigger_type
```

The test builds two `ItemReconciliationDB` rows directly (`recon_stale_reject_all`, `recon_stale_choose_bob`,
`test_authoritative_export.py:813` and `:828`), and #76 makes `trigger_type` NOT NULL with no default. A grep
of `app`, `tests`, `evaluation` and the seed finds no other direct construction without it.

**Fix (part of item 3, merging `main`):** add `trigger_type="multiple_accepted_candidates"` to both rows. With
that change, on the trial merge: expert gate, authoritative export, export provenance, review corrections,
reconciliation, authoritative version, and every provenance and dispute suite **260 passed, 3 skipped**.
Trial merge aborted, worktree clean at `e3b3744`.

---

## Round 2 — `33509cf` (2026-10-16)

**Not posted.** Yi pushed `5684fdb` (merge of `main` with #66, #70 and #73) and `33509cf` (the event reason), with
no reply comment. GitHub: `MERGEABLE` / `CLEAN`, review decision still `CHANGES_REQUESTED` (mine), CI SQLite and
PostgreSQL green at `33509cf`.

| Point | At `33509cf` |
| --- | --- |
| 1. Casebook IDs | ✅ Renumbered EV-112 to EV-115 (files and `id`); `baseline.json` keeps main's EV-105–111 and adds the four; casebook README updated. `evaluation list` loads |
| 2. #70's event reason | ✅ `details={"reason": reconciliation.trigger_type}`, `event_kind` stays `disputed`. Test pins both reasons (gate, several answers). Nothing else reads `accepted_answers_differ` (only the new test's docstring mentions it) |
| 3. Merge `main`, CI | ✅ `--remerge-diff`: the only hand resolution is `baseline.json`; CI green on both databases |
| 4. #66's two rows (addendum) | ✅ `trigger_type="multiple_accepted_candidates"` on both, in the merge commit |
| N1. AI-first through the gate | ✅ Added: `test_an_ai_first_pass_goes_through_the_gate_to_an_expert` (held, then `reconciliation_choose` by the expert, authoritative `ai_model` answer) |
| N2. Jira wording | Open, Hanchen's to do on the board |

Checked locally at `33509cf`:
- Backend, full SQLite: **2,029 passed, 21 skipped**, 209 subtests, 5 min 18 s.
- Casebook `--baseline evaluation/baseline.json --exact`: **63/63 passed, 8 skipped; 71 unchanged, no regression**.
- Web: typecheck clean; sheet, reconciliation desk, dispute case page, project disputes panel and protocol steps
  **183 passed**.

### Verdict: approve and merge

Merge with a merge commit. Afterwards: reset PostgreSQL (`init_data.py --reset`, new column); align SCRUM-118's
Jira text (`multiple_accepted_candidates`). SCRUM-124 (Dishank) should extend `SubmissionReviewState.expert_confirmed`
for an accepted correction, as the PR body says.

**Posted 2026-10-16 06:37 UTC:** Approve on `33509cf` (CI SQLite and PostgreSQL green; Yi's reply comment of 06:28
matches the checks above), then merged by hanchen9127 with a merge commit, `f88793c`. N2 done: Hanchen aligned
SCRUM-118's Jira text to `multiple_accepted_candidates`.
