# Review — PR #49, `CS57-KANISHKA` (SCRUM-93, D8: the available-work list, WEB)

2026-10-04. Head `21ccac3`, base `main` (`df7c05a`, the #47 merge), up to date with it. One commit;
12 files, +772 / −53.

**On GitHub (checked with `gh pr view 49`):** open, not a draft, mergeable. Review requested from Jingwei.
No reviews or comments yet. CI is green (`sqlite` and `postgresql`, push and pull_request), but CI runs the
API suite only, so the web checks below were run locally.

**Read before this review:**
- SCRUM-93's description as rewritten after #43 and #44 (`sandbox/W8/jira/jira-scrum-93-after-113-114.md`),
  and the split of 2026-09-26 (`sandbox/W8/jira/jira-split-scrum-93.md`);
- the queue-row message to Kanishka (`sandbox/W8/msg/message-kanishka-scrum-48-queue-rows.md`);
- `roadmap.md` W8 group 1 and break group 7, and `mission.md`'s D8 row (no assignment; independence is a
  property of the queue);
- the API on `main`: `task_work_queue_service.py`, the three queue routes, `draft_service.py`'s slot check,
  and `ROLE_CAPABILITIES` in `core/permissions.py`.

No PR touching the same web files is open (#39 and #48 checked).

**Recommendation: request changes — three small fixes (1–3).** The queue wiring is right and matches the
ticket nearly point by point. The three fixes are each a few lines in the two page components: the greyed-out
button can be bypassed, a rework item drops out of view after Save draft, and a role refusal reads as a load
failure.

## Verified

- **Locally, on `21ccac3`,** in a separate worktree:
  - `tsc --noEmit`: no errors;
  - `eslint` on the 8 changed source files: no findings;
  - `vitest run`: 40 files, 350 tests passed. The PR's "43 focused tests" are among them.
- **The row type is defined once.** `ApiWorkQueueItem` now lives in `lib/api/work-queues.ts` as
  `ApiTaskItem` plus the queue fields, and `task-items.ts` imports it, as the ticket asked once #44 merged.
- **The fields match the API's `WorkQueueItemRead`,** including `can_annotate`, `rework`, `submitted_by_you`
  and `awaiting_review_annotation_ids`.
- **Lists follow queue membership, not item status.** The annotate list shows only rows the queue returns
  (`include_unavailable=true`), Submitted shows only the review queue's items, and Disputed shows only the
  adjudicate queue's items. While a queue is loading or has failed, the list offers nothing, rather than
  falling back to the status-scoped inventory.
- **No annotator is named.** Neither page adds the `annotator` column. "Who is on it" comes only from
  `submitted_count` and `working_count`.
- **The queues are refreshed after every panel action** (`onItemUpdated`, `onActionComplete`), so the
  counts and `can_annotate` follow a submit or a decision.

## Scope — SCRUM-93 on the board, point by point

| # | Board description (30/09) | On `21ccac3` |
| --- | --- | --- |
| 1 | Role-filtered list from the three queue routes; an item opens directly | ✅ `listAnnotationWorkQueue`, `listReviewWorkQueue` and `listAdjudicationWorkQueue` |
| 2 | Progress as "2 of 3" (`submitted_count` of `required_annotators`) | ✅ `formatAnnotateQueueProgress` |
| 3 | Annotate greyed out wherever `can_annotate` is false, using `include_unavailable`; the row says why | 🟡 The button is greyed, but the row click still opens the Annotate tab (fix 1). The reason is missing when the viewer judged the item (nit 5) |
| 4 | How many are working it and how many have submitted | ✅ "2 of 3 · 1 working" |
| 5 | Numbers from the queue rows | ✅ |
| 6 | Who is on an item only from the numbers; no names | ✅ |
| 7 | AI-annotated instead of "0 of N" | ✅ |
| 8 | Rework marked from the row's `rework` field | ✅ A "Rework" label and Returned/Rejected tabs. Tab placement has two problems (fix 2, nit 4) |
| 9 | The review list hands the panel nothing; optionally show the number awaiting | ✅ "Awaiting" column; the panel still reads the review queue itself |
| 10 | Hide "working" on a full item | ✅ |

## Should fix before merge

**1. A greyed-out row still opens the Annotate tab.** `task-annotation-workspace.tsx`, `onItemActivate`.
The button is disabled when `can_annotate` is false, but clicking anywhere else on the row runs
`setWorkspaceTab("annotate"); setWorkspaceOpen(true)` for every row. The viewer can then type and click
Save draft. The API does not stop that: `create_draft` checks only the judge rule, and the slot check runs
at submit (`draft_service.py`, `_assert_human_submission_slot_available`). The result is a draft that can
never be submitted, and a `working_count` that goes up on an item nobody can take. *Fix:* when the row's
`can_annotate` is false, open the panel on `"details"` instead of `"annotate"`.

**2. After Save draft on a rework item, the page switches to a tab where the item is not listed.**
`handleItemUpdated` still picks the tab from the item's status: Save draft sets `in_progress`, and
`resolveStageFilterKeyForItemStatus` moves Returned or Rejected to Draft. But `rework` stays true until the
annotator resubmits, and `scopeAnnotateQueueItems` keeps rework rows out of Draft. So the active tab
becomes Draft and the item is in neither the tab shown nor the one the viewer came from. A rejected item
also moves to Returned, because its status is no longer `rejected`. The deep-link effect has the same
root cause: an item whose status is `returned` because of someone else's submission opens the Returned tab,
where it is not listed for this viewer. *Fix:* now that the queue decides the tabs, drop the status-driven
tab switch in `handleItemUpdated`, or pick the tab from the refreshed row's `rework`. A component test
for "Save draft on a returned item keeps it visible" would guard it.

**3. A role refusal (403) reads as "could not be loaded. Refresh the page".** Disputed handles 403 as
"only available to arbitrators", but the other two lists treat every failure as a load error. The pages
have no role gate, so this is easy to reach:
- a task owner without the annotator role opens Annotate (`ANNOTATE` is not among `TASK_OWNER`'s
  capabilities);
- an arbitrator without the reviewer role opens Review, where Submitted is the default tab.

Refreshing will never help either of them. *Fix:* treat `error.status === 403` as forbidden on the
annotate and review queues too, with a message naming the missing role.

## Nits

4. **Returned and Rejected are split by the item's status, which is item-wide.** Returning one annotator's
   submission sets the whole item to `returned`, as the comment in `list_review_queue` says. So a viewer
   whose own submission was rejected sees it under Returned if another submission on the item was returned
   later. The row's `rework` does not say which decision it was. Either show one tab for all rework, or
   accept the split and say so in `scopeAnnotateQueueItems`'s comment.
5. **A greyed row can give no reason.** The API also sets `can_annotate` false for someone who reviewed
   or adjudicated the item (the judge rule). That row reads "1 of 3", with a disabled button and no
   explanation. `formatAnnotateQueueProgress` works out "full" for itself. Derive it from `can_annotate`
   instead, and fall back to "Not available to you" when none of the three named reasons applies.
6. **A comment claims more than the API does.** `task-workbench.tsx` says an arbitrator sees "exactly the
   open escalations routed to them". `list_adjudication_queue` returns every open escalation on the task,
   with no per-user exclusion; that exclusion (R2-8) is SCRUM-52's. Say "the task's open escalations".
7. **Escalating from Submitted switches a plain reviewer to Disputed,** where the page says "only available
   to arbitrators". Consider staying on Submitted when the adjudicate queue is forbidden.
8. **Formatting churn.** `task-annotation-workspace-with-real-data.tsx` only loses the blank lines between
   its import groups. `task-items.ts` and `work-queues.ts` gain a double blank line, and `work-queues.ts`
   has no newline at the end. In `task-annotation-workspace.tsx`, the new `@/lib` imports sit between
   `@/components` imports.
9. **Commit and PR title.** Other PRs use `feat(SCRUM-93): … (WEB)`. A reword at merge time is enough.

## Not raised on the PR

- **Status before merge:** the board had SCRUM-93 at To Do on 30/09 (roadmap, board changes of
  2026-09-28/30). Moving it to In Review is part of the tracker sync.
- **The page header metrics still count by item status** (for example, the review desk's Submitted
  metric), so they can disagree with the queue-scoped list underneath. This predates the PR and is outside
  SCRUM-93's scope. Worth a line if a follow-up touches the header.

---

## Suggested PR comment (to post after Hanchen's edit)

```
Thanks Kanishka, the queue wiring looks right: the row type now lives once in work-queues.ts, lists follow queue membership rather than item status, no annotator is named, and the queues refresh after every panel action. tsc, eslint and the web suite (350 tests) pass locally on 21ccac3.

Three small fixes before merge, all in the two page components:

1. A greyed-out row still opens the Annotate tab. The button is disabled, but onItemActivate opens "annotate" for every row, and the API lets a draft be saved on a full item (the slot check runs only at submit). So the viewer gets a draft they can never submit, and working_count goes up. Suggest opening "details" when can_annotate is false.

2. Save draft on a returned or rejected item switches to the Draft tab, where the item isn't listed. handleItemUpdated still picks the tab from item status (Save draft sets in_progress), but rework stays true until resubmission, and scopeAnnotateQueueItems keeps rework rows out of Draft. Since the queue now decides the tabs, I'd drop the status-driven switch, or use the refreshed row's rework. The deep-link effect has the same issue.

3. A 403 on the annotate or review queue reads as "could not be loaded. Refresh the page". For example, a task owner without the annotator role, or an arbitrator without the reviewer role on Submitted. Please handle 403 as forbidden, like Disputed already does.

Nits, optional:
- Returned/Rejected are split by item status, which is item-wide, so your rejected rework can land under Returned.
- A row greyed by the judge rule gives no reason. Deriving "full" from can_annotate, with a fallback reason, would cover it.
- The comment "open escalations routed to them": the adjudicate queue returns all open escalations on the task (the per-arbitrator exclusion is SCRUM-52).
- Formatting churn in task-annotation-workspace-with-real-data.tsx, plus a double blank line and no newline at EOF in work-queues.ts.
```
