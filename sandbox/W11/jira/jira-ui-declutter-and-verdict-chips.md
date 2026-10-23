# Two new W11 tickets — the UI declutter (Jingwei) and the verdict-chip bug (2026-10-21)

**Source:** [`../frontend-design-review.md`](../frontend-design-review.md), reviewed on `main` at `f3dfdc1c`.

**Created on the board on 2026-10-21 at 21:28.** Checked against the `Jira.csv` export of 21:31:

| | Ticket 1 | Ticket 2 |
| --- | --- | --- |
| Key | **SCRUM-128** | **SCRUM-129** |
| Summary | as drafted | "Bug: the review chips overwrite a judgement reviewer's verdict". This is the draft's heading, not its Summary block; both say the same thing |
| Type | Task | **Task** (the draft said Bug) |
| Priority | Medium | **Medium** (the draft suggested High) |
| Assignee, points, sprint | Jingwei, 2, W11 | Jingwei, 0.5, W11 |
| Description | identical to the draft | identical to the draft |
| Links, attachments | not in the CSV export, so not checked | not in the CSV export, so not checked |

On the board, W11 now holds 9.5u: Yi 3, Jingwei 2.5, Parth 2, Hanchen 1, Kanishka 1. SCRUM-129 maps to D3
through its "Related to user story D3" line. SCRUM-128 maps to no story, as intended, so `tracking-sync`
will list it as such.

**Decided by Hanchen (2026-10-21):**
- Finding 0, where the review chips overwrite a judgement verdict, gets **its own bug ticket**. The declutter
  ticket covers only style and copy.
- The declutter ticket goes to **Jingwei, 2 points, W11**. The report is a menu: **Jingwei decides which
  findings to take.**

Neither ticket touches work in progress. The open PRs (#89, #91, #92, #93) do not edit these components,
except #89 on `project-create-form.tsx`, which is a single line in finding B2.

---

## Ticket 1 — UI declutter

### Board steps

| Field | Value |
| --- | --- |
| Type | Task |
| Sprint | **W11** |
| Assignee | **Jingwei** |
| Story points | **2** |
| Attachment | `frontend-design-review.md` and the `frontend-review/` folder (5 images and `contrast-scan.js`). Jingwei cannot see `docs/sandbox`, so the report has to travel with the ticket |
| Linked | "relates to" Ticket 2 |

W11's board load goes from 7.5u to 9.5u, or 10u with Ticket 2.

### Summary

```
Web: Remove distracting UI — confusing button styles, redundant helper text and repeated panels
```

### Description

```
{noformat}FRONTEND. W11. Added 2026-10-21 (Hanchen).

The attached design review (frontend-design-review.md, on main f3dfdc1c) found UI that gets in the way: buttons whose style says the wrong thing, helper text nobody needs, information shown several times over, and a dark mode that makes most working screens unreadable. This ticket removes it before the demonstration. It is not a redesign: layout, palette, cards and tabs stay.

The report is a menu. You choose which findings to take; each gives its file and line and the change. Rough order of value, for the demo:
- D1: switch dark mode off (defaultTheme light, enableSystem false, drop the d hotkey). Three lines. In dark mode 29% of all text is below 3:1 contrast on 14 of 18 pages, the Annotate and History controls included, and an OS set to dark turns it on.
- A1: Submit becomes the primary button and Save draft the outline, in the work panel's annotate and judge tabs.
- C4: the Dashboard drops its scaffold copy, and "Canonical Decisions" is hard-coded to 0.
- B1, B2: design-brief sentences and internal words shown to users ("It should let users create a project…", "For MVP this stays a structured mock…", MVP / ToB first / Modular monolith, backend id, raw enums).
- Then A3–A9 (button variants, destructive style, toggles, icons, the Review button behind a horizontal scroll), B3–B5 (guidance boxes, button explanations, the login page's repeated text), C1–C3 and C5 (repeated counts and navigation, the always-empty Execution owners).
Finding 0 and A2 (the review chips) belong to the bug ticket linked here, not to this one.

Rules for every change:
# Remove, or swap to a variant packages/ui already has. No new component, layout or colour.
# Text that states a rule the screen enforces stays: blind-then-reveal, dispute eligibility, release notes, the justification requirements under the review fields.
# Light mode looks the same apart from what was removed.
# The PR lists the findings it takes and those it leaves, one line each on why a finding was left. mission.md requires written justification agreed at review for UI style changes; the report plus this list is that justification.

Done when:
# The chosen findings are in, each a separate commit or clearly grouped.
# The web suite passes. No test asserts the removed text; the work-panel tests find buttons by name, so variant swaps leave them green.
# If D1 is taken: with the OS set to dark, contrast-scan.js (attached) gives the light-mode figures on Task Overview, Annotate and History.
# Screenshots before and after in the PR for the pages touched.

Collaboration:
- The bug ticket (review chips) edits the same file, task-item-workspace-sheet.tsx. Merge either one first, then rebase the other; the edits do not overlap.
- PR #89 (SCRUM-91, Tim) edits project-create-form.tsx: leave B2's "Loading live organizations" line there to Tim, or do it after #89 merges.
- H6 (SCRUM-108): if its screens are still open, do not remove text from task-releases-section.tsx; the report leaves it alone.{noformat}
```

---

## Ticket 2 — Bug: the review chips overwrite a judgement reviewer's verdict

### Board steps

| Field | Value |
| --- | --- |
| Type | Bug |
| Sprint | **W11** |
| Assignee | **Not decided.** Suggested: Jingwei, who wrote the correction send path (`60be9bb`, SCRUM-32). That makes 2.5 points for Jingwei in W11 |
| Story points | **0.5** suggested |
| Priority | High: it can put a wrong value into the record that SCRUM-124 lets an expert make canonical |
| Attachment | `frontend-review/01-judgement-chip-overwrites-verdict.png` |
| Linked | "relates to" Ticket 1, SCRUM-32, SCRUM-124 |

### Summary

```
Review: The decision chips no longer overwrite a judgement reviewer's verdict
```

### Description

```
{noformat}Related to user story D3

FRONTEND. W11. Added 2026-10-21 (found in the UI design review).

In the work panel's review tab, a row of lowercase chips — accept, revise, reject, escalate on a judgement task; accept, adjust, reject, escalate on an annotation task — sits above the real Accept / Adjust / Reject / Escalate buttons. They date from the MVP integration (ce4752c, 2026-09-11) and look like the decision itself, but each chip calls setReviewVerdict(action) (task-item-workspace-sheet.tsx:3905-3916 and 4263-4274).

On a judgement task, reviewVerdict is the "Final judgement value" field under the chips, so a click replaces the annotator's verdict with the chip's word. Reproduced on main f3dfdc1c, seeded item a3-04-awaiting-review: the field held "accurate"; clicking "reject" made it "reject", and "You changed the answer… it is sent as your suggested correction" appeared. Since SCRUM-32 (60be9bb), a changed verdict on Return or Escalate is sent as the reviewer's correction (corrected: true, final_verdict). On a task that defines labels, the backend refuses it (review_actions.py, assert_result_matches_task since #61): the reviewer gets "Verdict 'reject' is not one of this task's labels" for a value they never typed. On a judgement task that defines no labels nothing refuses it, and since SCRUM-124 an expert can accept that correction as the answer, so the literal string "reject" can become the item's canonical verdict. On annotation tasks the chips write to the same state but final_verdict is not sent there, so they do nothing at all.

# Remove both chip rows. The buttons under Actions are the decision.
# Test: on a judgement review, the Final judgement value keeps the annotator's verdict until the reviewer types in it, and no control on the panel other than the field changes it.
# Test: Return without editing the verdict sends no correction (corrected absent), so an untouched verdict is never recorded as a correction.

Not in this ticket: checking a corrected verdict against the task's allowed values on the backend. If wanted, it is its own ticket.

Collaboration:
- SCRUM-32 (Jingwei): the correction send path this protects.
- SCRUM-124 (Dishank): the expert's accept of a correction, where the wrong value would become canonical.
- The UI declutter ticket edits the same file; the edits do not overlap.{noformat}
```

---

## Open points for Hanchen

- **SCRUM-129's description overstates one sentence — correct it on the board** (found 2026-10-21, after
  creation). It said the backend stores a corrected verdict unchecked. In fact, since #61 a correction is
  held to the task's labels (`review_actions.py:700`). On the seeded judgement tasks, which all define
  labels, the chip therefore produces a confusing 422, not a wrong canonical answer. The wrong-canonical
  case remains only for a judgement task with no labels. The Description block above now has the corrected
  paragraph: replace the third paragraph on the board with it. The fix itself (remove the chips) is
  unchanged.

- **The declutter ticket has no user story.** It does not serve any open story; its nearest story is K4, the
  demonstration, which is set aside and tracked outside Jira. As written, `tracking-sync` will report
  "maps to no story" for it, which is accurate. If you would rather count it somewhere, add
  `Related to user story K4` at the top. Note that K4 is `dropped` in `story_src.csv`.
- ~~**Who takes the bug, and when.**~~ Decided at creation: Jingwei, 0.5. It is small enough to merge before
  the declutter PR.
- **A backend check on corrected verdicts** (only the task's allowed values) would close the hole for any
  client, not just this panel. I left it out of both tickets. Say if you want a third.
- **Jingwei's W11 load** (checked 21:31): SCRUM-128 and 129 are Jingwei's only W11 tickets, 2.5u in all.
