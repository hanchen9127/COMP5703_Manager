# Review — PR #69, `CS57-Yi` (SCRUM-122: a returned or rejected AI first pass goes to a human annotator)

**Posted 2026-10-14 by hanchen9127 as Changes requested** (at `2e7e58b`). The body was this file from "Verdict" to
"Checked locally", with an opening line to @DIQI26 and "Decided on 2026-10-14." in place of "Hanchen decided…".
The "Not for the PR" section was not posted.

**Follow-up comment, same day** ([issuecomment-6149737385](https://github.com/USYD-CS-Capstone/hej/pull/69#issuecomment-6149737385)):
an optional idea, not a merge condition. The expert's Return gets a choice, "back to the author" or "to a new
annotator", and "to a new annotator" reuses this PR's replacement slot. Reject stays terminal. Yi chooses whether
to build it in #69 (only after the point 1 revert) or as a follow-up ticket.

**Case-plan reply (`docs/sandbox/W9/msg/case_plan_from_Yi.md`): not posted, superseded.** The draft asked for a
yes/no context and one lineage shape. Before it was sent, Yi had already built his own design (commits up to
`b6092e2`). Hanchen accepted that design on 2026-10-14:

- `return_target` is required;
- a new annotator always starts an independent v1;
- an optional context cutoff, recorded in `derived_from` as `adjudication_guided_reannotation`.

---

## Re-review at `b6092e2` (2026-10-14)

**On GitHub:** Yi replied at 06:26 UTC, point by point, and pushed `3d97b00` (merge of `main` at `78aa937`),
`ccc6a78`, `ec0d220`, `b6a9b44` and `b6092e2`. The PR now includes the expert's Return to a new annotator.

`main` has moved since then: #68 and #67 merged on 13–14 Oct. The PR merges with today's `main` without textual
conflicts, but see point C.

### The first round's points

| Point | At `b6092e2` |
| --- | --- |
| 1. Expert's Reject keeps `main`'s rule | ✅ No replacement; a single rejected subject ends `unresolved`; legacy escalation Reject maps to `unresolved` again. EV-012 passes unchanged. The co-author regression is **back** through the new Return path, though: see A |
| 2. Rebase | ✅ Merged at `78aa937`. ⚠️ Breaks the seed once today's `main` is in: see C |
| 3. EV-011 | ✅ Un-skipped; the harness claims the slot from the annotate queue; baseline updated |
| 4. Concealment by relation to the item | ✅ Checked with a probe: an Annotator + Reviewer account who hasn't judged the item now gets nothing from the adjustment read (no AI payload, justification or feedback). Not complete for the new Return path, though: see B |
| 5. Active AI-assisted task update | Accepted as explained (dev-database reset policy) |

### Design of the expert's Return: accepted

- The expert must choose `author` (human subjects only) or `new_annotator`.
- A new annotator writes an independent v1. With context, it is `derived_from` the selected cutoff version, as
  `adjudication_guided_reannotation`.
- The cutoff is checked to be a version of the disputed lineage, at or before the disputed one.
- The context read (`?provided_context=true`) is limited to an eligible new annotator, and to versions up to the
  cutoff.

The one asymmetry is accepted with the design. A reviewer's Return continues the AI lineage. An expert's
`new_annotator` starts a new v1.

### Required changes

**A. A Return to a new annotator blocks the item's other annotators again.**

On `b6092e2`, with `required=2`:

1. Alice and Bob both submit.
2. Frank returns Bob's answer in ordinary review.
3. Erin escalates Alice's answer, and the expert returns it to `new_annotator`.
4. Bob's queue row now reads `rework=True, fallback_action="dispute_return"`.
5. His own rework draft is refused with 409: *"This item requires a draft that claims its current returned or
   rejected annotation."*

The same thing happened with dispute Reject in the first round. It went away there only because human answers
stopped opening slots; the cause was never fixed:

- `_validate_replacement_source` still runs before the existing-contributor check, in `create_draft` and in
  `_assert_human_submission_slot_available`;
- the queue still attaches the fallback to the caller's own rework row.

Fix: a caller who already has a current answer on the item stays on their own rework path, in the draft service and
in the queue row. Keep this scenario as a test.

**B. "No context" doesn't hide the AI's answer.**

On `b6092e2`:

1. An AI answer is escalated.
2. The expert returns it to `new_annotator` with no context.
3. The eligible new annotator (an annotator-only account) is offered the slot.
4. `visible_to_caller` still returns the AI annotation, and `GET .../adjustment` returns its payload.

`rejected_ai_evidence_concealed` conceals only sources whose round outcome is `rejected`. An expert's Return leaves
the outcome `returned`, so a no-context Return shows the very answer the expert chose not to show.

The same gap applies to a context cutoff: the versions after the cutoff stay readable through the normal reads,
whenever the peer rules don't already hide them.

Fix: for a `dispute_return` slot, the eligible or claiming new annotator sees nothing from the source lineage
without context, and only versions up to the cutoff with it. That holds on every read: annotation list, adjustment,
drafts, history. Use the item-relation rule from point 4, and add tests for both cases.

**C. The seed fails once today's `main` is merged in.**

#67's staged test items include an expert Return with no `return_target`. On the PR merged with `main` (`59b60d1`):

- `init_data.py --reset` stops at STEP 8 with *"return_target is required for a Return decision"*;
- `tests/test_seed_test_projects.py` has 1 failure and 7 errors.

Everything else passes: 1,720 passed, 14 skipped; the casebook is 9/9 with 4 skipped, all unchanged.

The PR's own after-merge step asks everyone to run that reset, so this has to be fixed before merging. Merge `main`
again, give the seed's staged Return `return_target = "author"` (its subject is a person's answer), and run the seed
tests.

### Not blocking

- **Cases for the new feature.** Under SCRUM-71, every feature brings its own cases: an expert's Return to the
  author, to a new annotator with a context cutoff, and to a new annotator with none. #71 is changing how case ids
  and areas are assigned (its review, point 2), so add these after rebasing on #71, or in a small follow-up straight
  after.
- **Coordinate with #71.** `return_target` is now required in the harness's `adjudicate` step. #71 adds EV-061,
  which has an expert Return, and both PRs change `scenario.py` and `driver.py`. Whichever merges second adds
  `return_target` and takes the other's harness changes.

### Checked locally

Probes for A, B and the point 4 fix were written and deleted afterwards. The rest was run on `b6092e2` merged with
`origin/main` `59b60d1`: the backend suite (SQLite), the casebook against its baseline, and `init_data.py --reset`
on a scratch SQLite database. Web tests and PostgreSQL were not run.

**Verdict at `b6092e2`: Request changes (A, B, C).**

**Posted 2026-10-14 06:42 UTC by hanchen9127 as Changes requested** (second review, at `b6092e2`). The body was
this section from "The first round's points" to the verdict, with an opening line to @DIQI26.

**On GitHub (checked 2026-10-14):** open, base `main`, head `2e7e58b`, 25 commits, 57 files, +3,090. No comments
or reviews yet. **Mergeable: CONFLICTING.** It is based on `41028db` (the #48 merge), and `main` has since taken
#60, #64, #62 and #51.

**Verdict: Request changes.** The core of the ticket is accepted: a reviewer's Return or Reject on an AI first pass
goes to a person, and the AI is not retried. Three things need changing:

- **The change to the expert's dispute Reject goes back to `main`'s rule.** It is out of scope here, and it breaks
  the ambiguous end state.
- EV-011 has to be un-skipped.
- The server-side concealment has a gap for multi-role accounts.

---

## Design: what is accepted and what is not

Hanchen decided the following on 2026-10-14. Several rows differ from the ticket text on the board, which still has
the 12 Oct draft.

| Decision in the PR | Ticket text | Status |
| --- | --- | --- |
| A **reviewer's** Return and Reject on an AI answer differ. Return continues the AI lineage (v2, AI answer and feedback visible). Reject starts an independent human v1 (AI answer and feedback hidden). | Both did the same thing, and the AI answer was hidden by default | Accepted |
| AI Reject needs a justification, but feedback is optional | The reviewer's reason was always shown | Accepted |
| An AI-assisted task always has `required_annotators = 1` | "The required human annotators count still applies" | Accepted. AI-assisted means one logical submission. |
| Reject replacement has no `derived_from` link to the rejected AI answer | — | Accepted. The item and the review record keep it traceable. |
| An **expert's** dispute Reject opens an independent replacement, and only reconciliation `reject_all` gives `unresolved` | Not in the ticket | **Not accepted. Keep `main`'s rule** (ADR 013, #48, EV-012). See point 1. |

Please add a short "Departures from the ticket" paragraph to the PR description that lists the accepted rows.

---

## Required changes

### 1. Keep `main`'s rule for an expert's Reject

The two Rejects answer different questions, and the PR should keep them apart:

- **A reviewer's Reject** says "this answer is wrong; redo it". On an AI answer, that is what this ticket
  builds: a person takes the item over.
- **An expert's Reject** in a dispute says "no answer here holds under the guideline". It disqualifies the
  answer and starts nothing (client answer R2-1: Reject "does not proceed automatically to another review
  stage"). After that:
  - if no accepted candidate remains, the item ends `unresolved`, the "resolved as ambiguous" state R2-1 asks
    for;
  - if one remains, it canonicalizes;
  - if several remain, reconciliation opens.

Under the PR's rule, an item with one logical submission can never end `unresolved`. That covers every AI-assisted
task, and every human-first task with `required=1`. A genuinely ambiguous item would loop:

```text
new annotator → reviewer unsure → escalate → expert Reject → another new annotator → …
```

Every replacement must be someone who has never authored or judged the item, in any round. So each loop uses up
one annotator, and the item strands once nobody eligible is left. That is the stranded item #38 set out to fix,
moved somewhere else. EV-012 pins `main`'s behaviour, and it fails once `main` is merged into this branch (see
point 2).

What to change:

- Revert `4165d1e` ("reserve unresolved for reconciliation reject-all"):
  - `item_status_after_accept` keeps its `adjudication_rejected` branch;
  - `_map_escalation_decision_to_task_item_status` maps `reject` back to `unresolved`;
  - `_escalation_resolution_outcome` is restored.
- From `54db9af`, drop only the human-dispute part and keep the AI Reject → independent v1 part:
  - in `replacement_entitlements_by_item` (`submission_rules.py:426-431`), a human submission never opens a
    slot;
  - a machine submission opens one only after a reviewer's Return or Reject, or an expert's Return. Not after an
    expert's Reject: check `state.adjudication_decision != "reject"`;
  - the `independent_replacement` flag in `assert_submission_may_be_replaced` goes back to the old refusal.
- Turn two tests around so they expect `unresolved`, no queue offer and 409 on a draft:
  `test_rejecting_disputed_ai_opens_a_human_fallback_instead_of_terminating` and
  `test_rejecting_disputed_human_work_opens_an_independent_replacement_for_a_new_author`.
- Revert the dispute-semantics docs in `2e7e58b` and `6741945` (ADR 009, `workflow_states.md`, `api_surfaces.md`).
- Remove "Only reconciliation can close without an answer" from the PR description.

Doing this also removes a regression I reproduced on `2e7e58b`:

1. `required=2`. Alice and Bob both submit.
2. Bob's answer is returned in ordinary review.
3. The expert rejects Alice's answer in a dispute.
4. Bob's own rework draft is now refused with 409 (*"This item requires a draft that claims its current returned
   or rejected annotation"*), and he cannot claim Alice's slot either, because he authored the item.

The open replacement slot blocked everyone else on the item. On `41028db` the same steps succeed. Please keep this
scenario as a test: Bob's rework is accepted, and no slot opens.

### 2. Rebase on `main`

There are conflicts in `task-item-workspace-sheet.test.tsx`, `api_surfaces.md` and `workflow_states.md`. I merged
`main` in locally to check the backend. **1,685 passed and 2 failed** (SQLite), both on EV-012:

- `tests/test_evaluation_cases.py::test_case[EV-012]`, step 4: *expected protesters to be unresolved, but it is
  rejected*.
- `tests/test_evaluation_baseline.py::test_the_committed_baseline_matches_the_casebook`.

With point 1 done, EV-012 should pass unchanged. Please don't edit EV-012.

### 3. Un-skip EV-011 (ticket subtask 4)

The ticket's definition of done asks for EV-011 to be un-skipped. The case reaches this branch only with the
rebase.

After the merge, EV-011 run with its `skip` removed fails at step 2 with 409. The harness
(`evaluation/harness/driver.py:284`, `_do_annotate`) creates a draft without `annotation_id`.

I tried a local patch: read the item's row from `GET /tasks/{id}/work-queue/annotate` and pass its
`fallback_source_annotation_id` as the draft's `annotation_id`. With that, **EV-011 passes end to end**: reviewer
Reject → person answers → accept → `canonicalized`, authoritative `ann`. Please:

- put that change (or an equivalent) in the harness;
- remove the `skip`;
- run `uv run python -m evaluation run --update-baseline` and commit the result. EV-011 is newly running, and
  nothing else should change.

### 4. Rejected AI evidence is hidden by organisation role, not by the caller's relation to the item

`rejected_ai_evidence_concealed` (`annotation_service.py:250`) returns nothing to hide as soon as the caller holds
REVIEW, ADJUDICATE or MANAGE_PROJECT anywhere in the organisation (`:292`).

So an account that is both annotator and reviewer, and has not judged this item, is affected (DANA in the refusals
fixtures). Checked on `2e7e58b`:

- That account **is offered the Reject replacement** (`can_annotate=True, fallback_action="reject"`).
- `GET /tasks/{id}/task-items/{item}/adjustment` returns the rejected AI payload, the justification and the
  feedback.

An annotator-only account sees none of the three. I checked the adjustment, audit-logs and workflow-lineage reads.

The PR description says "Reject evidence privacy is enforced by the server", so please make it hold for
multi-role accounts too. Hide the evidence from anyone who may take or holds the replacement, meaning anyone who is
not a judge of this item, instead of anyone who lacks those roles. Please add a multi-role test.

---

## Smaller points (not blocking)

5. **Updating an existing active AI-assisted task.** `apply_ai_assisted_required_annotators`
   (`task_service.py:230`) writes `required_annotators=1` into every update of an AI-assisted task stored with a
   higher count. On an activated task, `assert_required_annotators_change_allowed` then refuses any update with
   409, even a title edit. The dev-database reset covers this. Still, normalising only when the update changes the
   mode or the count would avoid a confusing error on databases that haven't been reset.
6. **Coordinate with the open PRs on the same files.**
   - #63 (SCRUM-53, Michael) changes `annotation_versions.py`, `submission_rules.py` and `review_actions.py`.
   - #66 (SCRUM-37, Dishank) changes the export in `tasks.py`. This PR groups the export by base lineage, so please
     check #66's "one authoritative answer per item" against an AI v1 + human v2 lineage.

   Whoever merges second rebases.
7. **F1 hand-over event.** The ticket asks for the AI → human hand-over to be recorded as a provenance event.
   SCRUM-98 isn't merged yet, so please agree the event with Parth rather than add it here.

---

## Checked locally

- **PR head `2e7e58b`:** the new backend tests pass. I wrote a probe for the Bob scenario (point 1) and for the
  multi-role concealment (point 4), and deleted both afterwards.
- **`41028db`:** the Bob probe passes, so it is a regression from this PR.
- **PR merged with `origin/main`:**
  - backend (SQLite) 1,685 passed, 2 failed (EV-012), 15 skipped, 209 subtests;
  - casebook: EV-011 passes with the harness patch.
- **Not run:** the web tests on the merged tree (the conflicts are in a web test file), and PostgreSQL. I have not
  run the PR with point 1 reverted.

---

## Not for the PR (Hanchen)

- **Board and roadmap.** SCRUM-122's description on the board still has the 12 Oct design. Update it to the
  accepted rows above, and note in `roadmap.md` that an expert's Reject keeps `main`'s rule (decided 2026-10-14).
- **Removed web surfaces.** The PR removes the annotate workspace's AI candidate surfaces. SCRUM-73 (I4,
  blind-then-reveal, Jingwei, W10) needs a place to reveal the AI suggestion, so Jingwei should know before he
  starts.
- **Raise at the meeting.** Reconciliation opens even when every candidate gives the same answer, so the adjudicator
  gets cases with nothing to decide. It may be worth auto-choosing when the candidates agree. That is outside #69.

---

## Third look at `e795a18` (2026-10-14)

Yi pushed `7e3979b` ("ensure the return operation does not affect other annotators") and `e795a18` ("fix context
visibility when return"), with no comment. #71 merged at 07:20 UTC (`f6f8eb0`), so `main` now has the new
casebook harness.

| Point | At `e795a18` |
| --- | --- |
| A. A Return to a new annotator blocked the other annotators | ✅ The existing-contributor check now comes first, in `create_draft` and in `_assert_human_submission_slot_available`, and a contributor's own queue row no longer carries another submission's slot. The probe passes (Bob's rework is accepted), with a new test. The original author can't bypass the expert's choice: Alice's own rework is refused with 409 (*"must be replaced through the adjudicator's selected Return path"*) |
| B. "No context" didn't hide the AI's answer | ✅ `dispute_return_evidence_concealed` hides the whole source lineage from the eligible or claiming new annotator when there is no context, and every version after the cutoff when there is. It covers the list and drafts reads and `assert_visible_to_caller`. The probe passes: no AI payload on the adjustment read. Two tests cover the no-context and cutoff cases |
| C. The seed fails with today's `main` | ⏳ Not addressed. With `main` merged in, `test_seed_test_projects.py` still has 1 failure and 7 errors, and everything else passes (1,723 passed, 14 skipped) |

**New, small:** after an expert's Return to a new annotator, the subject's own author is still offered rework in
the annotate queue (`can_annotate=True, rework=True`), but their submit is refused with 409. The queue and the
submission guard disagree, so the author can write a draft that can never be submitted. Don't offer the row to the
subject's author when the return target is `new_annotator`, and test it.

**Rebase onto `main` with #71:** a trial merge conflicts in four files.
- `evaluation/README.md`, `EV-011`, `harness/driver.py` and `harness/scenario.py` conflict.
- Keep #71's harness: `see`, `edit_draft` / `submit_draft` / `delete_draft`, `covers`, and the id sequence.
- Keep #69's own harness changes on top: `return_target`, and the slot claim in `_do_annotate`.
- In EV-011, keep `covers = ["SCRUM-122"]` and drop `skip`.
- Add `return_target = "author"` to EV-061.
- Regenerate the baseline.
- The cases for the expert's Return (author; new annotator with a cutoff; new annotator with no context) take
  EV-102 onwards, with `covers = ["SCRUM-122"]`.

**Verdict at `e795a18`:** still Request changes, for C, the rebase and the small queue fix. All three are mechanical.
Approve once they are in.

**Update at `5152551` (before posting):** Yi merged `main` at `59b60d1` (`ff8e254`, still before #71) and fixed the
seed (`5152551`, `seed_test_projects.py`): `test_seed_test_projects.py` passes, 14 of 14. **C ✅.** The PR conflicts
with `main` again because of #71.

**Posted 2026-10-14 as a comment by hanchen9127**
([issuecomment-6163134231](https://github.com/USYD-CS-Capstone/hej/pull/69#issuecomment-6163134231)), at
`5152551`: A, B and C confirmed fixed. Two things left: the rebase onto `main` with #71, and the queue offering the
subject's author rework that the submit refuses. Approve once both are in. The earlier Request changes still stands
on GitHub until then.

---

## Fourth look at `11e9d8b` (2026-10-14)

Yi rebased onto `main` `f6f8eb0` (with #71), rewriting the branch: `9161930`, `c012f93` and `346cc97` are the
earlier `7e3979b`, `e795a18` and `5152551`. He added `1a73308` ("rebase into main") and `11e9d8b` (queue fix), with
no comment. GitHub: mergeable. CI: SQLite passed, PostgreSQL still running at the time of writing.

| Open point | At `11e9d8b` |
| --- | --- |
| Rebase onto #71 | ✅ #71's harness kept; `_do_annotate` claims the slot from the annotate queue; `adjudicate` takes `return_target` and a new `return_context = "subject"` (the subject version as cutoff); EV-011 un-skipped with its `covers`; EV-061 has `return_target = "author"`; README updated |
| New cases | ✅ EV-102 (Return to the author), EV-103 (new annotator, bounded context) and EV-104 (new annotator, no context), each `covers = ["SCRUM-122"]`; baseline regenerated |
| Queue offering the subject's author rework | ✅ For the subject's author, `rework` is false on a `dispute_return` slot. Probe: the row is gone, and their submit is still 409 |

**Checked locally at `11e9d8b`:**

- backend (SQLite): 1,799 passed, 18 skipped, 209 subtests;
- casebook against the baseline: 52/52 passed with 8 skipped, all 60 unchanged; next id EV-105;
- the earlier probes all still hold:
  - A: a co-author's rework is accepted;
  - B: nothing of the source is visible with no context;
  - point 4: no leak to a multi-role account.

**New, and blocking: a draft from the subject's author hides the slot from every new annotator.**

1. Alice's answer is escalated. While the dispute is open she saves a draft, which the held-submission rule allows.
2. The expert returns her answer to `new_annotator`.
3. Bob, an eligible annotator, now gets an **empty** annotate queue. Before Alice's draft, his row read
   `can_annotate=True, fallback_action="dispute_return"`.

The same happens if Alice creates a draft after the Return. `create_draft` lets her through, because the A fix
skips slot validation for anyone with a current answer, even though her submit is refused.

The cause is that two rules disagree about who holds the slot:

- the queue's `workers`, which counts any pending human draft on the item;
- the server's claim check, which counts only pending drafts whose `annotation_id` is the source.

Bob can still claim it through the API, but the web works from the queue, so on screen nobody can take the item.

Fix both:

- for a `dispute_return` slot, the queue counts as working only drafts that claim the source, the same predicate as
  `_validate_replacement_source`;
- `create_draft` refuses the subject's author on a `new_annotator` Return with 409, as the submit does.

Test the during-the-dispute path.

**Verdict at `11e9d8b`:** that one fix, then approve.

**Posted 2026-10-14 as a comment by hanchen9127**
([issuecomment-6163471235](https://github.com/USYD-CS-Capstone/hej/pull/69#issuecomment-6163471235)), at
`11e9d8b`: the rebase, the new cases and the queue fix confirmed. One fix left: a draft from the subject's author
hides the slot from every new annotator. Approve once it is in. The earlier Request changes still stands on GitHub.

---

## Fifth look at `6418b8a` (2026-10-14)

Yi pushed `6418b8a` ("draft visibility"), with no comment.

- `working_user_ids_by_item` takes the replacement entitlements. For a `dispute_return` slot it counts only pending
  drafts that claim the source, the same predicate as the claim at submission. The queue, the evidence concealment
  and the context read all pass it.
- `_assert_not_subject_author_of_new_annotator_return` refuses the subject's author with 409, in `create_draft` and
  in the submission guard.
- One new test: `test_subject_draft_does_not_hide_new_annotator_slot`.

**Checked locally:**

- A draft saved by Alice during the open dispute no longer hides the slot. After the Return, Bob's row reads
  `can_annotate=True, fallback_action="dispute_return"` and his claim submits. Alice's queue is empty, and her new
  draft is refused with 409.
- The earlier probes still hold:
  - A: a co-author's rework is accepted;
  - B: no source evidence with no context;
  - point 4: no leak to a multi-role account, and the reviewer-Reject slot is still offered and claimable.
- Backend (SQLite): 1,800 passed, 18 skipped, 209 subtests.
- Casebook: 52/52 passed with 8 skipped, all 60 unchanged against the baseline.
- CI on `6418b8a` (push and pull_request): SQLite and PostgreSQL both green.

**Verdict at `6418b8a`: Approve.** Every review point is closed.

**Approved on GitHub 2026-10-14 by hanchen9127 and merged 08:48 UTC (`5ef9202`, merge commit)** at `6418b8a`, after
CI passed on SQLite and PostgreSQL. After merge, every development database needs
`uv run python -X utf8 init_data.py --reset`, for the new `annotation_disputes` columns and the seed changes.
