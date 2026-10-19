# Review — PR #73, `CS57-Jingwei` (SCRUM-73, I4: the blind-then-reveal evaluation protocol and its measures)

**Round 1 was posted differently from this file.** This file reviewed `6d8f03e` (11 commits, base `main` = `5ef9202`). The posted Request changes review (2026-10-14 16:07 UTC) is the record: it covers `853b812`, web commits included, with three backend points (findings 1–3 here), two points on the new screen (quick verdicts, saved confidence) and three small ones. Round 2 is at the end of this file.
<https://github.com/USYD-CS-Capstone/hej/pull/73>

## Verdict: request changes

The design matches the client's issue #72 well:

- `evaluation_protocol` (`none` | `blind_then_reveal`) is a task field next to `annotation_mode`, never a third mode.
- It is accepted on human-first judgement tasks only, fixed at activation and recorded per item.
- The suggestion lives in its own table, so it is withheld by construction.
- The read sweep is the strongest privacy test in the repo: every GET route, as every role, at three moments, with inline and worker runs.

Two acceptance criteria from issue #72 and roadmap W10 group 4 are not met yet:

- the correctness change against gold;
- per-stage provenance.

One workflow gap is confirmed by a probe: an annotator can see the suggestion and then be refused an answer. All three are small to fix.

## Checked locally

| Check | Result |
| --- | --- |
| Worktree `D:\COMP5703_Capstone\hej-review-73` at `6d8f03e` | `main` checkout untouched |
| `uv run pytest -q` (SQLite) | ✅ **1,860 passed, 18 skipped**, 209 subtests, 4 min 22 s |
| Web | No web files changed, so `test:web` and `typecheck:web` weren't run |
| CI (Backend tests) | SQLite ✅ on both runs. PostgreSQL **pending** on both runs (at 2026-10-15 00:40 local) |
| Reviewer probe (temporary test, deleted afterwards) | Confirms finding 3 (output below) |

## Scope, criterion by criterion

| # | Criterion (issue #72 / roadmap W10 group 4 / mission Assist row) | At `6d8f03e` |
| --- | --- | --- |
| 1 | Judgement tasks only | ✅ `evaluation_protocol_problem` (`schemas/tasks.py`) refuses non-judgement and AI-assisted tasks, on create and on update. EV-109 |
| 2 | Separate from the production mode, never a third `annotation_mode` | ✅ Its own column and CHECK. Recorded on items with the mode (`_record_items_annotation_mode`). 409 once active |
| 3 | Pre-reveal judgement kept | ✅ `protocol_rounds.blind_verdict`, held to the judgement shape, given once (409 on a second) |
| 4 | AI suggestion kept, never an answer | ✅ `ai_suggestions`, one per item. Inline and worker paths both write there instead of a draft. Retry is frozen once a failure is revealed |
| 5 | Post-reveal judgement kept; no overwrite | ✅ The ordinary submission, linked as `final_annotation_id` (the first after the reveal). A rework is a later version, and the round keeps the first |
| 6 | Whether the answer changed | ✅ Derived in the metrics (`kept` / `switched_to_ai` / `revised_other`), not stored. Acceptable, because all three inputs are stored |
| 7 | Per-stage time / model / guideline / policy provenance | ⚠️ Time: yes (`blind_at`, `revealed_at`, `submitted_at`). Model: provider/model from the **task**, with no model version, and nothing on a failed run. A retried suggestion keeps the failure's `created_at`. Guideline/policy: **none**. **Finding 2** |
| 8 | API withholds the suggestion until the pre-reveal judgement is committed, tested at API level | ✅ `reveal` is 409 before the blind verdict and while the AI hasn't run. `test_evaluation_protocol_withheld.py` sweeps every GET route |
| 9 | Failed AI runs not counted as suggestions | ✅ `status='failed'`, `suggestion=NULL`. The reveal shows `failed`. Metrics put those rounds under `no_suggestion`. `gold.py` skips non-`completed` suggestions |
| 10 | Accept / modify / override rates, by mode | ✅ `ai_outcomes` on AI-first tasks, by the finalised answer's lineage. Per task, and a task has one mode, so per task is per mode |
| 11 | Time per item, by mode; time change between stages | ✅ Median and quartiles with n. Protocol time is split at the reveal |
| 12 | Review burden | ✅ Reviews, returned or rejected, submissions and disputes per finalised item |
| 13 | Answer-changed rate | ✅ `first_rounds` rates; later rounds reported apart (D9) |
| 14 | **Correctness delta vs gold** ("whether the change improved or reduced correctness") | ❌ Not computed. **Finding 1** |
| 15 | Confidently-wrong followed | ✅ `confidently_wrong_adopted` (protocol) and `confidently_wrong_accepted` (AI-first), threshold 0.8 |
| 16 | Anchoring / automation bias | ✅ Anchoring split by whether the AI was right; automation bias; benefit |
| 17 | Figures from harness runs, with counts | ✅ Each case's metrics read in `_read_metrics`. Run totals in `gold_totals`. Every figure carries its n and count. Labelled "pipeline demonstration" |
| DoD | Tests in the same change; red before / green after | ✅ Prove tests and guards are named. Revert checks are reported in the PR body (12 + 8 + 6 + 3) |
| DoD | Docs sync (`hej/AGENTS.md`) | ✅ ADR 016, `api_surfaces`, schema blueprint, domain model and its relations, `workflow_states`. Nit: `backend_module_map.md` not updated (N1) |
| DoD | Schema change per SCRUM-94 (no Alembic) | ✅ Additive SQLite `ALTER`s in `migrate_db_schema`. New tables via `create_all`. PR body tells the team to reset PostgreSQL |
| DoD | "Demonstrable in the running app" | ➖ No UI by design (plan E-D5: the harness drives it through the API). Accept as a decided exception; note it in the tracker |

## Privacy sweep: every read path

| Path | Result |
| --- | --- |
| Drafts (`/task-items/{id}/drafts`, `/drafts/{id}`), batched drafts | ✅ No AI draft is ever written on a protocol item (`record_result` and `_preannotate_items_inline` branch out first) |
| Task items, task history, audit logs | ✅ Nothing writes the suggestion there. Note that the blind and reveal steps write no history at all (S2) |
| Annotations, reviews, reconciliation, disputes | ✅ The suggestion is never an `AnnotationDB` |
| Exports (default, `normalized_json`, `legacy`) | ✅ Swept |
| Work queue (`include_unavailable` too) | ✅ Swept |
| AI runs (`/ai-runs/...`) | ✅ Swept with the worker path. The item job keeps only `last_error` |
| `GET /task-items/{id}/protocol` | ✅ Caller's own round only. The suggestion appears only after their reveal |
| `GET /tasks/{id}/metrics` | ✅ `MANAGE_PROJECT` only. The suggestion's verdict appears on finalised items only, never its rationale. Accepted per D5 |

## Fix before merge

### 1. The correctness change against gold isn't measured

Issue #72 lists "whether the change improved or reduced correctness". The roadmap entry for SCRUM-73 says "the measures add whether a change improved or reduced correctness against gold".

`evaluation/harness/gold.py:87` (`gold_counts`) has the pieces but never reports this:

- **benefit** counts rounds where a wrong blind verdict followed a right AI;
- **automation bias** counts rounds where a right blind verdict followed a wrong AI.

Two kinds of change are invisible today:

- a change *away* from the AI (blind wrong → final right, AI also wrong) counts nowhere;
- the same goes for a revision to a third answer.

There is also no blind-versus-final accuracy pair.

**Failure scenario:** in a run where annotators often revise to a third label, every one of those revisions falls outside `benefit_n` and `automation_bias_n`. The report can't say whether the protocol helped or hurt accuracy.

**Fix:** for first rounds with a completed suggestion and a final verdict, count:

- `blind_right`, `final_right` and n (both accuracies);
- `improved` (wrong → right) and `worsened` (right → wrong).

Add them to `gold_figures` as `correctness: {n, blind_accuracy, final_accuracy, delta, improved, worsened}`. Add a hand-counted case to `test_evaluation_gold.py`, and state it in one EV case.

### 2. Per-stage provenance is incomplete (model version, retry time, guideline and policy)

The roadmap entry asks for "time, model, guideline and policy versions per stage". Issue #72 asks for "timestamps / model / guideline / policy provenance". Three gaps:

- **Model.** `app/services/evaluation_protocol.py:111` copies `ai_provider` and `ai_model` from the task. The model version that actually answered is only inside the `suggestion` JSON (`metadata.ai`), and on a failed run that JSON is set to `NULL`. A failed suggestion keeps no record of which model failed.
- **Time.** `AiSuggestionDB` (`app/models/db_models.py:533`) has only `created_at`. When a retry replaces a failed suggestion, the row keeps the failure's timestamp. The suggestion annotators see is then dated before it existed.
- **Guideline and policy.** Neither `protocol_rounds` nor `ai_suggestions` records a guideline or policy version. Those versions don't exist on `main` yet: PR #63 (SCRUM-53, open) adds `guideline_version` and `policy_version`. Both PRs touch `db_models.py`, `database.py`, `task_service.py` and `task_item_reopen_service.py`, so whichever merges second has to connect them.

**Failure scenario:** an item's suggestion fails, a retry succeeds and the annotator reveals it. The record says the suggestion was produced at the time of the failure. The report can't say which model version produced it, or under which guideline the blind verdict was given.

**Fix in this PR:**

- add `model_version` (and keep `ai_provider`/`ai_model` from the run's `metadata.ai`, falling back to the task) on `ai_suggestions`, for failed runs too;
- add a `generated_at` that every write updates;
- state in ADR 016 that the blind verdict and the suggestion take the guideline and policy versions from SCRUM-53, and that whichever of #63 and #73 merges second adds those columns to `protocol_rounds` and `ai_suggestions`.

If #63 merges first, add the columns here.

## Should fix

### 3. An annotator can see the suggestion and then be refused an answer; the orphaned round counts as "awaiting final" for ever

Confirmed with a probe on a task with `required_annotators=1`:

```
AUTHOR blind 201, reveal 200
PEER   blind 201, reveal 200 -> suggestion {'status': 'completed', 'verdict': 'abusive', ...}
AUTHOR submits; PEER submit -> 409 "Human annotation submission limit reached for this item (1/1)."
reviewer accepts -> item canonicalized
rounds [(AUTHOR, revealed, ann_…), (PEER, revealed, None)]
metrics protocol: awaiting_final = 1   (on a finalised item)
PEER reveal after finalisation -> 200
```

The causes:

- `give_blind_verdict` (`app/api/routes/evaluation_protocol.py:100`) checks capacity by **submissions** only, so any number of annotators can open rounds before the first submit.
- `reveal_ai_suggestion` (`:135`) checks neither capacity nor whether the item still accepts work (`assert_task_item_accepts_work`).

The protocol order still holds, since every reveal follows that person's blind verdict. But:

- a person who can never answer sees the AI's verdict;
- their round stays current for ever;
- `app/services/evaluation_metrics.py:251` counts it as `awaiting_final` on a finalised item, which is not true.

**Fix:**

- In `reveal`, re-run `assert_task_item_accepts_work` and `DraftService.assert_can_take_item`. A reveal is refused once the slots are full or the item is finalised.
- In the metrics, report rounds with no final answer on a finalised item as `abandoned`, not `awaiting_final`.
- Pin both with a test, like the probe above.

Counting open rounds as held slots is the stronger option. It is a bigger change and can be a follow-up.

### 4. The protocol steps leave no task history

`record_blind_verdict` and `reveal_suggestion` write no `TaskHistoryRecorder` or audit event. A blind verdict doesn't count as taking the item (`record_item_taken` runs only on draft creation). The work queue and the history therefore can't show that someone is in their blind or reveal phase.

The rows themselves are kept, so this is not a data-loss issue. It does matter once F1 (SCRUM-98, PR #70) makes the event record the production history, because the blind stage would be missing from it.

**Fix:** record `protocol_blind_given` and `protocol_revealed` events through the recorder, or agree with Parth to add them on whichever of #70 and #73 merges second.

## Nits

- **N1.** `docs/design/backend/backend_module_map.md` describes `services/ai_batch_service` and similar modules, but not the new `services/evaluation_protocol`, `services/evaluation_metrics` and their routes (AGENTS.md Docs Sync: "if domain ownership changes").
- **N2.** `_same()` compares verdicts with `casefold` only. A model verdict like `"Abusive."` won't match the label `abusive`, so the round counts as `revised_other` instead of `switched_to_ai`. Normalising the AI verdict against the task's label options would make the classification robust.
- **N3.** `record_protocol_suggestion` can race between the inline pass and a worker run (unique `task_item_id` → IntegrityError on the second insert). It's unlikely, because inline and worker are exclusive by `ai_execution_mode`. Worth a comment.
- **N4.** On existing SQLite databases the additive `ALTER`s don't add the new CHECK constraints. That's accepted by the additive-migration rule; one line in ADR 016 would help.
- **N5.** "Demonstrable in the running app" (DoD) is waived by E-D5. Record the exception in the tracker row so the story isn't counted against the DoD later.

## Comment for GitHub (ready to paste)

> Thanks, Jingwei. This is a careful piece of work. The separate `ai_suggestions` table and the every-route read sweep make the "withheld until the blind verdict" rule hard to break. Local SQLite run: 1,860 passed, 18 skipped. PostgreSQL CI was still pending when I looked.
>
> Requesting changes for two acceptance criteria from #72 and one workflow gap:
>
> 1. **Correctness against gold.** `gold.py` reports benefit and automation bias, but not whether a change improved or reduced correctness. Please add `blind_accuracy`, `final_accuracy`, `delta`, `improved` and `worsened` over first rounds with a completed suggestion, with a hand-counted test.
> 2. **Per-stage provenance.** `ai_suggestions` takes provider and model from the task, keeps no model version, and drops all model metadata on a failed run. A retried suggestion keeps the failure's `created_at`. Please store the run's provider, model and model version, for failures too, and a `generated_at` that each write updates. Also state in ADR 016 how the blind verdict and the suggestion get guideline and policy versions from SCRUM-53 (#63), and that whichever PR merges second adds them.
> 3. **Over-subscription.** With 1 required annotator, a second annotator can give a blind verdict and reveal before the first submits. Their submit is then refused, and their round counts as `awaiting_final` on the finalised item for ever. The reveal also works after finalisation. Please re-check capacity and `accepts_work` in `reveal`, and report such rounds as abandoned.
>
> Also worth doing: the blind and reveal steps write no history event (coordinate with #70), and `backend_module_map.md` should list the new services.

## Round 2 — 853b812, 2026-10-14

**Not posted.** Reviewed at `853b812` (5 new commits since `6d8f03e`, base still `main` = `5ef9202`, merges without conflicts). The round-1 review was never posted, so the PR has no comments or reviews and Jingwei hasn't replied to any finding. The new commits add the screen and a seeded test task, and don't touch the backend logic the four findings are about.

### What changed since `6d8f03e`

| Commit | Change |
| --- | --- |
| `f568e6c` | Seed: project F, task F1 (`Test: Blind-then-reveal (evaluation)`), suggestions written before activation, Dana staged at each step |
| `50a5696` | Web: `lib/api/evaluation-protocol.ts`, `evaluationProtocol` on the task and item |
| `b7fe35c` | Web: `components/protocol-judgement-steps.tsx` (blind, reveal, final), the Judge-tab branch, confidence on the judgement draft |
| `3d3f412` | Web: panel header badge, Review-tab note |
| `853b812` | ADR 016 (the screen reverses E-D5 for this ticket), API README project F |

The PR body now also has a **"Known gap"** section: guideline and policy provenance per stage waits for #63 (SCRUM-53) and #70 (SCRUM-98), both still open.

### Checked locally

| Check | Result |
| --- | --- |
| Worktree `D:\COMP5703_Capstone\hej-review-73` moved to `853b812` | `main` checkout untouched |
| `uv run pytest -q` (SQLite) | ✅ **1,862 passed, 18 skipped**, 209 subtests, 6 min 49 s |
| `npm run typecheck:web` | ✅ clean |
| `npm run test:web` | ✅ **559 passed** (59 files) |
| CI at `853b812` (Backend tests) | ✅ SQLite and PostgreSQL green on both runs (PostgreSQL finished 14:47 UTC) |
| Reviewer probe for finding 3 (temporary test, deleted afterwards) | Still reproduces (output below) |

### Round-1 findings

| # | Finding | Status at `853b812` | Evidence |
| --- | --- | --- | --- |
| 1 | Correctness change against gold not measured | ❌ Not fixed | `evaluation/harness/gold.py:87` (`gold_counts`) unchanged: no blind/final accuracy, no `improved`/`worsened` |
| 2 | Per-stage provenance incomplete | ⚠️ Partly answered | **Guideline/policy:** the PR body now names it a known gap that waits for #63 and #70, with the follow-up steps. That is an acceptable answer while both are open, but ADR 016 doesn't say it yet. **Model version and the retry timestamp: not fixed.** `app/services/evaluation_protocol.py:111-112` still copy provider and model from the task. `ai_suggestions` still has only `created_at`, and a failed run still keeps no model record. Neither depends on #63 |
| 3 | Over-subscription; orphaned round counts as `awaiting_final`; reveal after finalisation | ❌ Not fixed, and now reachable from the screen | `reveal_ai_suggestion` (`app/api/routes/evaluation_protocol.py:135`) still checks neither capacity nor `assert_task_item_accepts_work`. `app/services/evaluation_metrics.py:139` still returns `awaiting_final`. The seeded F1 task has `required_annotators=1`, and the README invites "Charlie or Ethan" on `f1-01`. If both try, the second sees the AI's verdict and can't answer |
| 4 | Blind and reveal write no task history | ❌ Not fixed; answered in the PR body | The "Known gap" section says provenance events for the blind verdict and the reveal wait for #70. Acceptable as a cross-PR dependency, if ADR 016 records it too |
| N1 | `backend_module_map.md` misses the new services | ❌ Not fixed | `docs/design/backend/backend_module_map.md` has no `evaluation_protocol` or `evaluation_metrics` |
| N2 | `_same()` compares with casefold only | ❌ Not fixed | `evaluation_metrics.py:99` unchanged |
| N3 | Inline/worker race on the unique `task_item_id` | ❌ Not fixed (a comment only, still optional) | `record_protocol_suggestion` unchanged |
| N4 | Additive `ALTER`s don't add the CHECKs | ❌ Not fixed | ADR 016 has no line on it |
| N5 | "Demonstrable in the running app" waived | ✅ Resolved | The screen and the seeded task F1 make it demonstrable. The E-D5 exception no longer needs a tracker note |

Probe at `853b812` (`required_annotators=1`):

```
AUTHOR blind 201, reveal 200
PEER   blind 201, reveal 200 -> {'status': 'completed', 'verdict': 'abusive', ...}
AUTHOR submits; reviewer accepts -> item canonicalized
rounds [(AUTHOR, revealed, ann_…), (PEER, revealed, None)]
metrics protocol: awaiting_final = 1   (on a finalised item)
PEER reveal after finalisation -> 200
```

### New findings in the new code

**Privacy first.**

- The screen reads the suggestion only through `GET …/protocol` and `POST …/reveal`, which return the caller's own round.
- `protocol-judgement-steps.tsx:147` shows the suggestion only once `revealed_at` is set.
- On a protocol item, the Judge tab replaces the ordinary branch (the one that shows `candidateOutput`/`aiLabel`).
- The Review tab shows only a note.
- The seed writes suggestions through `record_protocol_suggestion`, and no AI draft.

I found no new leak path before the blind verdict. The new commits add no migration.

#### 5 (should fix). The blind verdict's quick buttons offer the wrong labels, and a click can't be undone

`components/task-item-workspace-sheet.tsx:2843` passes `verdictOptions={defaultTextSpanLabelOptions}`. That is `getDefaultTextSpanLabelOptions("judgement")` (`lib/text-span-label-options.ts:27`): `approve`, `revise`, `unsupported`, `ambiguous`. These are not the task's labels. The backend doesn't check a judgement verdict against the labels either: `assert_result_matches_task` only checks that a verdict and a rationale are present, then returns (`app/services/result_shape.py:122-128`).

**Failure scenario:** on the seeded F1 (labels `abusive` / `not_abusive`), Charlie clicks the `approve` quick button and commits.

- The blind verdict `approve` is kept for ever, since a second one is refused with 409.
- It can never equal the AI's verdict or the gold label, so the round counts as `revised_other` and is scored wrong against gold.
- That silently skews the anchoring and automation-bias figures this PR exists to produce.

The ordinary judgement branch (`:2872`) has the same defaults, so the pattern is inherited. Here it matters more, because the blind verdict is permanent and is itself the measure. `protocol-judgement-steps.test.tsx:58` passes the right labels straight into the component, so the sheet's wiring is untested.

**Fix:**

- pass `textSpanLabelOptions`, the task's own labels (`:992`);
- add a sheet-level test where the task's labels are `abusive` / `not_abusive` and the buttons show them;
- optionally, refuse a blind verdict that isn't one of the task's labels when the task defines labels.

#### 6 (should fix). The final answer's confidence is lost when a saved draft is reopened

- `task-item-workspace-sheet.tsx:1089` resets `judgementConfidence` to `null` whenever the item loads.
- `mapApiItemToMock` doesn't read `confidence` back from the draft.
- `buildJudgementDraftPayload` (`lib/api/task-items.ts:193`) writes `draft_data` from the form only.

**Failure scenario:** an annotator reveals, picks 80% and clicks Save draft. They close the panel, reopen it later and submit. The verdict and rationale come back, but the confidence buttons show Skip. The submission has no `confidence`, and the before/after confidence comparison (client issue #72 gap 2, done in `6d8f03e`) loses that round.

**Fix:** carry `draft_data.confidence` into the item, as `draftVerdict` is, and seed `judgementConfidence` from it. Pin it with a sheet test.

#### Nits

- **N6.** `protocol-judgement-steps.tsx:185` shows every 409 from `reveal` as "the AI's suggestion isn't ready yet, try again shortly". Today the other reveal 409s can't be reached from the screen. Once finding 3 adds capacity and `accepts_work` refusals (both 409), the annotator would be told to retry for ever. Match on the detail (or a code), not the status alone.
- **N7.** The "Try again" button (`:334`) isn't gated by `disabled`, unlike "Reveal AI suggestion" (`:346`).
- **N8.** After a reopen, the panel's verdict still holds the previous answer's draft (`task-item-workspace-sheet.tsx:1087`). The prefill effect (`protocol-judgement-steps.tsx:150`) skips when the verdict isn't empty. So the new round's final answer starts from the old answer, not the new blind verdict. Minor: the annotator sees it and can edit it.

### Verdict: request changes

None of the round-1 findings is fixed in code; the new commits add the screen.

- **Still blocking:** finding 1, and the model-version and timestamp part of finding 2. These are the acceptance-criteria gaps.
- **Should fix:** finding 3, which the seeded demo now reaches, and finding 5, which lets the new screen record unusable blind verdicts.

The screen itself is clean and doesn't leak the suggestion, and CI is green on both databases.

### Comment for GitHub (ready to paste)

> Thanks, Jingwei. The screen reads well: the suggestion only ever comes from the caller's own round, there's no "use the AI's verdict" shortcut, and the seeded F1 task makes the flow easy to try. CI is green on SQLite and PostgreSQL. Locally: SQLite 1,862 passed, 18 skipped. Web typecheck is clean and Vitest has 559 passed.
>
> Requesting changes. These three are still open on the backend:
>
> 1. **Correctness against gold.** `gold.py` reports benefit and automation bias, but not whether a change improved or reduced correctness (#72, roadmap W10). Please add `blind_accuracy`, `final_accuracy`, `delta`, `improved` and `worsened` over first rounds with a completed suggestion, with a hand-counted test.
> 2. **Model provenance on the suggestion.** `ai_suggestions` still takes provider and model from the task, has no model version, and keeps nothing on a failed run. A retried suggestion keeps the failure's `created_at`. Please store the run's provider, model and model version (for failures too), and a `generated_at` that each write updates. Your "Known gap" note on guideline and policy versions (#63) and history events (#70) is fine. Please put the same note in ADR 016 so it survives the merge.
> 3. **Over-subscription.** With 1 required annotator, a second annotator can still give a blind verdict and reveal before the first submits. Their answer is then refused, and the round counts as `awaiting_final` on the finalised item. The reveal also still works after finalisation. On F1 this happens if Charlie and Ethan both try `f1-01`. Please re-check capacity and `accepts_work` in `reveal`, and report such rounds as abandoned.
>
> And two in the new screen:
>
> 4. **Quick verdict buttons.** The blind step gets the default judgement labels (`approve`, `revise`, `unsupported`, `ambiguous`) instead of the task's labels (`abusive` / `not_abusive` on F1). One click commits a permanent blind verdict that can never match the AI or gold. Please pass `textSpanLabelOptions`, and add a sheet-level test.
> 5. **Final confidence on a saved draft.** The confidence resets to Skip when the panel reopens, so an answer that was saved and submitted later loses it. Please restore it from the draft.
>
> Small ones:
>
> - Every 409 from the reveal is shown as "not ready yet", which will be wrong once (3) adds refusals.
> - "Try again" ignores `disabled`.
> - `backend_module_map.md` still doesn't list the new services.

---

## Round 2 — `72f1055` (2026-10-15)

**Posted 2026-10-15 11:29 UTC as Approve**, with merge conditions. Jingwei answered every point in
`22b5307`, and `72f1055` fixed the `non_toxic` gold rule.

| Check | Result |
| --- | --- |
| Worktree `D:\COMP5703_Capstone\hej-review-73` at `72f1055` | `main` checkout untouched |
| `uv run pytest -q` (SQLite) | ✅ 1,873 passed, 18 skipped, 5 min 50 s |
| Web | ✅ Vitest 565 passed; typecheck clean |
| Casebook `--baseline evaluation/baseline.json` | ✅ 59/59 passed, 8 skipped; 67 unchanged, no regression |
| CI | Skipped: the PR is still a draft, and the workflow skips drafts (SCRUM-125) |

| Point | Result |
| --- | --- |
| 1. Correctness against gold | ✅ One `n`, so `delta = improved_rate − worsened_rate`; hand-counted test |
| 2. Model provenance | ✅ The run's own `metadata.ai`, failures included; the task's values as a fallback; `generated_at` moves on each write; SQLite back-fill; ADR 016 Known gap |
| 3. Over-subscription | ✅ A first reveal re-checks `accepts_work` and capacity; `abandoned` is counted over finalised items only (`evaluation_metrics.py:232`). A residual window, two people revealing before either submits, is measured as abandoned, and ADR decision 6 explains it |
| 4. Quick verdicts | ✅ |
| 5. Saved confidence | ✅ |
| Small ones | ✅ `503` + `Retry-After` (`lib/api/client.ts` has no special 5xx handling); "Try again"; `backend_module_map.md` |
| `non_toxic` | ✅ Confirmed in the client's file: 100 of 200 records are `["non_toxic"]` |

**Jingwei's question on `main`:** confirmed. `result_shape.py:122` returns for a judgement before the label
check. Hanchen chose to **put the fix in this PR**, screen and API together, including the blind verdict.

**Merge conditions in the approval:** the label fix commit; marked ready for review; SQLite and PostgreSQL
green. The next commit gets a check.

**Raised as a follow-up, not blocking:** the Known gap's "once #63 and #70 merge, each round records both"
has no owning ticket. Take it to the next sync.

---

## Round 3 — `13db41f` (2026-10-16): the merge conditions

**Not posted.** Checks the three conditions in the 2026-10-15 Approve against the head Jingwei pushed afterwards.
Read from GitHub first: PR open, not a draft, `MERGEABLE` / `CLEAN`, review decision `APPROVED`, base `main` = `c3ac7a8`
(an ancestor of the PR head, so no conflicts).

| Condition | At `13db41f` |
| --- | --- |
| Label fix, screen and API together | ✅ `assert_result_matches_task` (`result_shape.py:130`) refuses a judgement verdict outside `defined_labels(task)` with 422 and the annotation tasks' wording. Submission, blind verdict (`evaluation_protocol.py:206`) and a reviewer's correction (`review_actions.py:672`) all go through it. No labels: unchanged. Drafts are not checked. The ordinary panel's quick verdicts use `textSpanLabelOptions` |
| Marked ready for review | ✅ `isDraft: false` |
| SQLite and PostgreSQL green | ✅ Both `SUCCESS` on `13db41f` (the earlier skipped runs were the draft pass) |

Tests, as asked: submission refused / accepted within labels (`test_task_result_shape.py`), blind refused with no round written
(`test_evaluation_protocol_rounds.py`), two sheet tests (task labels shown, defaults only when none). Locally on `13db41f`:
`test_task_result_shape`, `test_evaluation_protocol_rounds`, `test_seed_test_projects`, `test_evaluation_scenario`:
**125 passed**. I did not re-run the full suite or the casebook: CI is green on both databases and the commit's only
code change is one check plus a one-line web swap. The casebook's judgement tasks (EV-050, 052, 053, 105) define no labels,
so the 67-unchanged claim is plausible by inspection.

### Findings: none blocking

- **Nit 1.** The check is an exact, case-sensitive match. Documented in the PR and the error lists the labels, so fine. A
  model verdict such as `"Abusive."` still lands in `revised_other` (N2 from round 1, unchanged).
- **Nit 2.** `validate_annotation_output` checks the AI's judgement shape only, not its labels, so a suggestion can be
  off-label while a person's answer cannot. Pre-existing and outside this PR; worth a line in SCRUM-72's gold join.
- **Note.** Behaviour change on production: an active judgement task that already has labels now refuses a free-text
  verdict at submit, and a draft saved earlier with an off-label verdict fails on submit with the list shown. The PR body
  states it; no migration needed.

### Verdict: ready to merge

All conditions met. Merge with a merge commit (not squash). Afterwards: tell Michael (#63) and Parth (#70) to merge `main`
(`db_models.py`, `domain_model.md`, `db_schema_blueprint.md`, `api_surfaces.md`), remind the team to
`init_data.py --reset` PostgreSQL, and raise the Known-gap ownership (guideline/policy provenance, now Jingwei's under
SCRUM-72, due 24 Oct) at the next sync.

---

## Round 4 — `722fab6` (2026-10-16): merge of `main` after #70

**Not posted.** #70 (SCRUM-98) merged at 03:59 UTC as `c8d9f13`; Jingwei merged it into `CS57-Jingwei` as `722fab6`.
Checked with `git show --remerge-diff 722fab6`, which shows only the hand resolution.

| File | Resolution | Check |
| --- | --- | --- |
| `db_models.py` | Imports: `DDL` (#70) and `Float` (#73) both kept | ✅ |
| `task-item-workspace-sheet.test.tsx` | Imports: both kept | ✅ |
| `task-item-workspace-sheet.tsx` | #70's `setCorrectionSource` on another item kept; #73's protocol-aware verdict, rationale and saved confidence kept | ✅ Neither side lost |
| `task-workspace-data.ts` | #73's `draftConfidence` and #70's `draftCorrectionAnnotationId` both read and returned | ✅ |
| `evaluation_metrics.py` (semantic, no textual conflict) | `time_per_item` start read from `ProvenanceEventDB` `item_taken` instead of the `draft_started` audit row | ✅ On `main` only `record_item_taken` (`drafts.py:111`, `:280`) writes the start, as a production event; the audit log only maps `item_taken` back to "draft_started" for display. Without this change every non-protocol time would have been empty |
| `test_task_metrics.py` | Times set around the immutable `item_taken` event instead of rewriting it; `_set_times` shifts every submission, keeping their order | ✅ Same hand-counted values (60/120/300, 250, 40+60) |
| `api_surfaces.md` | `time_per_item` names `item_taken` | ✅ |

Local on `722fab6`:
- API: metrics, all protocol files, result shape, seed and provenance tests: **194 passed, 3 skipped**.
- Web: typecheck clean; sheet, protocol steps and workspace data: **208 passed**.
- CI on `722fab6`: SQLite and PostgreSQL **still running** at the time of writing (`UNSTABLE` = checks pending).

Notes:
- An old database has `draft_started` audit rows but no `item_taken` events, so its times would be empty. Moot: the PR already
  says reset PostgreSQL, and #70 needs the reset too.
- **Known gap (b) is now unblocked.** #70 is in, so the blind verdict and the reveal can become provenance events. Per
  Jingwei's 15 Oct plan this goes into SCRUM-72's PR (or a small follow-up). Half (a) still waits for #63.

### Verdict: still ready to merge, once CI on `722fab6` is green

The resolution is clean and the one semantic change is correct. No new review needed.

**Posted 2026-10-16 04:53 UTC:** Approve on `722fab6` (CI SQLite and PostgreSQL green), then merged by hanchen9127 with a
merge commit, `6b29810`.
