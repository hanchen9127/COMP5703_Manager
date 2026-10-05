# Re: SCRUM-32 — how reviewer corrections will work

For Jingwei, from Hanchen, 5 October 2026. Reply to `2026-10-05-scrum-32-corrections-for-hanchen-from-Jingwei.md`,
checked against `main` at `bbb93cb`.

## In short

- **Agreed: D1–D8, as you clarified them.** A correction can become the item's answer, but only through
  someone independent: an expert's Accept in a dispute, never the reviewer who made it. The other route
  is the annotator adopting it in a resubmission that is reviewed as usual. That fits R2-1 (Accept picks
  an existing judgement), R2-7 (review policy governs any human judgement that may become canonical) and
  R2-8 (no expert decides on work they took part in). I'll mention it to Hunter on Wednesday; it doesn't
  need to wait for an answer. Please record it in your ADR.
- **Story D3 is updated** (title, story, criteria, subtasks) in the client backlog. Your four criteria are
  used, with criterion 3 naming the independent expert.
- **Nine points below**, mostly scope notes and collaboration lines. None of them changes the model.

## What I checked, and it holds

- A correction would hold its item open today. `submission_review_states_by_item` and
  `_current_annotations` filter by `is_latest` only, not by author role, and ADR 009 keeps the corrected
  answer current beside the correction.
- No schema change: ADR 009 already names your seam,
  `create_version(..., derivation="reviewer_correction", author_role="reviewer")`.
- D2: `adjust` and `revise` are already returns. An accept carrying `final_payload` today approves the
  original and keeps 500 characters of the correction in `review_notes` — issue 5 itself.
- D5: the panel sends `final_payload` on every non-judgement decision (`task-item-workspace-sheet.tsx:1879`),
  so the server can't tell an edit from the pre-fill without a flag.
- The harness and casebook (`main`, #39, #51) never send `final_payload`, so no casebook case changes.

## Points to add or change

**The expert route**

1. **It depends on SCRUM-99's Accept, which is paused on #40.** What Accept selects is one of the parts
   Yi paused until Hunter answers the scope question. SCRUM-32 can store corrections and make them
   dispute candidates in W9. The end-to-end test, expert Accept making the correction authoritative,
   lands with or after SCRUM-99. Please list it as a dependency rather than a W9 criterion.
2. **Keep confirming a correction apart from real disagreement.** If every correction that should stand
   goes through a dispute, E1's automatic disputes and I3's agreement figures will count typo fixes as
   disputes. Record the escalation's reason as `correction` (a value, not a column) so they can be told
   apart.
3. **The confirmation is the dispute, not the Expert Gate.** SCRUM-118 (G2, W10) confirms an item after
   its approvals; choosing between candidates is adjudication. Using the dispute keeps SCRUM-99's record,
   independence check and audit trail. Add a test that the reviewer who wrote a correction is refused as
   its adjudicator (SCRUM-52's helper should already exclude them, because the correction rides on their
   review).

**Overlap with open work**

4. **"Touches no open PR" doesn't hold.** Yi's #48 (paused) changes `api/routes/review_actions.py`,
   `schemas/review_actions.py` and `task_item_status_resolution.py`. SCRUM-32 will change the first two
   (the flag, the 422, removing the legacy projection). Whichever merges second rebases; please add a
   collaboration line for #48.
5. **D3's visibility must cover every read that returns versions.** Today an annotator sees peers'
   answers once they have submitted; "other annotators never see a correction" is stricter. Check at
   least the adjustment read, #47's version-history read (`979a406`) and the annotation list
   (`visible_to_caller`). My SCRUM-119 commit 1 splits `should_hide_other_annotators` and keeps
   `visible_to_caller`'s signature. If you change that function, tell me first and we'll agree the order.

**Scope**

6. **Record adoption.** When an annotator resubmits, the new version's `derived_from` points at their own
   earlier version, so a released answer can't show it came from a reviewer's correction (R2-5: a released
   judgement can be traced backwards completely). Suggest a "Use the reviewer's correction" button that
   pre-fills the editor, with the correction's id kept in the new version's metadata. No schema change.
7. **Judgement tasks.** The panel sends `final_payload: null` for judgement tasks and never sends
   `final_verdict`. Either state "the web part covers annotation tasks only" in the scope note, or add the
   verdict correction too.
8. **D4's wording.** "While a dispute holds the answer" reads as annotation-scoped, which is exactly what
   #40 asks Hunter. Please word it so it holds under either scope.
9. **SCRUM-51.** I'll add the line to Parth's ticket myself: a second reviewer who hasn't decided yet must
   not see a first reviewer's correction.

## Board text

I'll put these on the board once you agree.

```text
SCRUM-37, replace "a reviewer's correction where the reviewer corrected the approved answer (agree with SCRUM-32)" with:
the adjudication's accepted judgement on a disputed item, which may be a reviewer's correction (SCRUM-32). A correction is never authoritative on its own: it becomes the answer through an independent expert's Accept — never the reviewer who made it — or through the annotator adopting it in a resubmission that is then approved.
```

```text
SCRUM-32, add under the description:
Scope agreed 2026-10-05 (Jingwei, Hanchen): a correction is a proposal, not a submission. Returns (adjust, revise, reject) and escalations carry it when the panel sends corrected=true; an accept that changes the answer is refused with 422. It is never counted, reviewed or approved itself; it is seen by the corrected answer's author, the item's reviewers and adjudicators and the project owner, never by the item's other annotators; it becomes history when its answer is resubmitted. It becomes the item's answer only through an independent expert's Accept in a dispute (escalation reason "correction"), or when the annotator adopts it in a resubmission, recorded on the new version. BACKEND AND FRONTEND: the panel sends the flag, stops an edited accept, and shows the annotator the reviewer's suggested correction (annotation tasks). No schema change. ADR in the PR.

Depends on: SCRUM-99's Accept (paused on issue #40) for the expert route's end-to-end test.

Collaboration:
- PR #48 (Yi, SCRUM-99/100): both change review_actions.py and its schema; whichever merges second rebases.
- SCRUM-119 (Hanchen, W9): agree the order before changing visible_to_caller.
- SCRUM-51 (Parth): its blind second review hides a first reviewer's correction.
- SCRUM-52 (Parth): the reviewer who wrote a correction is never its adjudicator.
```

```text
SCRUM-51, add:
2026-10-05 (SCRUM-32): the blind second review also hides a first reviewer's correction from a second reviewer who has not decided yet.
```
