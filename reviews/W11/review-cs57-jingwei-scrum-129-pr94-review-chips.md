# Review — PR #94, `CS57-Jingwei` (SCRUM-129, story D3: the review chips no longer overwrite a judgement verdict)

<https://github.com/USYD-CS-Capstone/hej/pull/94> · reviewed 2026-10-22 at `f37ce09` (2 commits, base `main` at `f3dfdc1`)

**Posted 2026-10-21 14:05 UTC as Approve** on `f37ce09`. The posted body is a shorter version of the sections
below, up to "What the PR still needs". "Not raised on the PR" was not posted.

Read from GitHub first:
- **The PR is a draft.**
- It has no reviews and no comments.
- It is level with `main`: the merge base is `main`'s head, `f3dfdc1`.
- CI ran (the billing block ended on 2026-10-20). The PR's `sqlite` run succeeded at `f37ce09`, and `main` at
  `fd35571` is green on SQLite and PostgreSQL after the merge.

Prior context read: the ticket draft and its open points (`sandbox/W11/jira/jira-ui-declutter-and-verdict-chips.md`),
finding 0 and A2 of `sandbox/W11/frontend-design-review.md`, `sandbox/W11/tests/label-check-2026-10-21.md`, and
roadmap group 3 (SCRUM-32's correction path). There are no sandbox messages to Jingwei about SCRUM-129.

## Verdict: approve

The PR does what the ticket asks and nothing more.

| Ticket item | In the PR |
| --- | --- |
| 1. Remove both chip rows | Both rows are gone (`task-item-workspace-sheet.tsx`, −28 lines). Nothing else on the panel changes |
| 2. Test: only the field changes the verdict | "lets no control on the review form but the field change the verdict" |
| 3. Test: a return without an edit sends no `corrected` | "sends the verdict as it was, with no correction", on Revise and on Reject |

### Only the field writes the verdict now

After the change, `setReviewVerdict` is called from three places:
- the form's fill when the item or the chosen submission changes (`:1324`);
- Undo my edit (`:1341`);
- the Final judgement value field (`:3911`).

No other component in `apps/hej-web` has a chip row or writes `final_verdict`. On an annotation task,
`reviewVerdict` is no longer written by anything the reviewer clicks, which matches the fact that it is never sent
there.

### The tests prove what they claim

Both checks were run on the PR's head:

- **The prove test needs the fix.** With `main`'s panel restored, it fails: `Unable to find an element with the
  display value: accurate`. The two guards stay green, as guards should.
- **The guards catch an always-on correction.** With the panel changed to send `corrected: true` on every return,
  both guards fail.

The web fixture defines no labels (`textSpanLabelOptions: null`). That is the case where the backend refuses
nothing, so the web test is the only line of defence there.

### The backend part is tests only, and agrees with `main`

`13db41fe` ("hold a judgement's verdict to its task's labels") is what makes the review route refuse a correction
outside the task's labels. `review_actions.py:700` calls `assert_result_matches_task` on every correction, and the
judgement branch of `result_shape.py` checks the verdict against `defined_labels`. The new tests pin that for a
judgement on Revise and on Escalate, and that a correction to another label is saved with its rationale kept.

No backend code changes. That keeps to the ticket's "Not in this ticket: checking a corrected verdict on the
backend".

**Decision 2 (no labels, no check): agreed.** On a task that defines no labels, `reject` is a legitimate verdict.
With the chips gone, the only way to send it is to type it, which is the reviewer's own answer.

### Runs

On `D:\COMP5703_Capstone\hej-review-94` at `f37ce09`:

- Web: `npm run test:web` → `78 files, 763 tests passed`. `npm run typecheck:web` is clean. `npm run lint:web` →
  45 warnings, 0 errors, as the PR says.
- Backend, full, SQLite: `uv run pytest -q` → `2483 passed, 21 skipped, 209 subtests passed`.
- Backend mutation: with the judgement label check in `result_shape.py` switched off, both refusal tests fail (Revise and Escalate). The saved-correction guard stays green.
- `npx prettier --check` flags both web files, but it flags them on `main` too, so the PR adds nothing new.
- PostgreSQL: not run. The PR changes no schema, lock or query.

## What the PR still needs

- **Mark it ready for review.** It is a draft.
- **Merge order with SCRUM-128.** SCRUM-128 edits the same file on other lines. This PR is the smaller of the two,
  so merge it first and rebase SCRUM-128 on it.

---

## Not raised on the PR

These points are for Hanchen only. A teammate's ticket gets no new criteria while it is in progress, so none of them is added to SCRUM-129.

1. **The same kind of defect, on display only: `reviewDecision` takes priority over the annotator's verdict.**
   After a Revise, Reject or Escalate, the panel builds its optimistic item with `reviewDecision: decision`
   (`:2314`), so the field holds the action word. Three places rank `reviewDecision` above `draftVerdict` when
   choosing an item's judgement value:
   - `getJudgementDisplayValue` (`lib/task-format.ts:46`);
   - the panel's `latestJudgementOutput` (`:1698`);
   - the review form's fill (`:1321`).

   So until the item is fetched again, an item that was just returned can show `revise` as its judgement value. It
   is not sent anywhere. A returned or escalated item cannot be reviewed again in the same panel, and an Accept sets
   `canonicalVerdict`, which ranks first. This comes from code reading and has not been reproduced in the app. If it
   is worth fixing, it needs its own small ticket: drop `reviewDecision` from the three verdict chains, because it is
   a decision, not a verdict.
2. **The Judge tab's `unknown` prefill** (finding 1 of `label-check-2026-10-21.md`) is unchanged, and no ticket
   covers it yet. The Review tab's fill falls back to the same `getJudgementDisplayValue`. There it only shows
   `unknown` when the submission has no verdict, which the submit check now refuses.
3. **The prove test's form lookup** goes through the `.hej-surface-soft` class. If SCRUM-128 restyles that card, the
   lookup returns nothing and the test fails loudly rather than passing silently. So it is safe, but it is the first
   thing to check if SCRUM-128 turns this test red.
4. **SCRUM-129's board description.** The PR says Jingwei has corrected it, which closes the first open point in
   the ticket draft. Check it at the next `Jira.csv` export.
