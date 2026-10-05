# SCRUM-32: how reviewer corrections will work, and what it changes for your tickets

For Hanchen, from Jingwei, 5 October 2026. Checked against `main` at `df7c05a` (#47 merged) and the Jira export of
5 October.

## In short

- **SCRUM-32 isn't blocked.** It builds only on #47 (versions, the `reviewer` author role, `reviewer_correction`,
  `create_version`). It needs no schema change and touches no open PR. I start in W9.
- **A correction will be a proposal, not a submission.** It's a reviewer-authored version, linked to the answer it
  corrects and stored whole. Nobody reviews or approves a correction itself. It becomes the item's answer only if the
  annotator adopts it in a resubmission, or an expert accepts it in a dispute.
- **That differs from story D3's wording and from one line of SCRUM-37.** I'd like you to update both; suggested text
  is in §5.
- **SCRUM-32's scope grows slightly,** to backend plus a minimal web part, so that annotators can actually see a
  correction (§5, third block).

## 1. Why a proposal, and not "replaces the stored answer"

D3 says "a corrected value submitted with a review replaces the stored answer". ADR 009 (15/09) already keeps the
correction *beside* the answer. That leaves the question of who approves the correction:

- **If another reviewer must approve it,** they could correct it again, and so on: a loop. It also makes every
  correction wait for a second reviewer.
- **If the correcting reviewer's accept makes it the answer** (Label Studio's "Fix & Accept"), the reviewer approves
  their own answer. Issue 7 and story D1 rule that out, and R2-7 says the review policy governs any human judgement
  that may become canonical.
- **If corrections are dropped,** we lose what D3 and R2-2 ("reviewer corrections" in release provenance) ask for.

A proposal avoids all three: someone *else* always decides what becomes the answer. Corrections have several uses
(guidance for the annotator, a candidate for the adjudicator, and more later), and none of them needs the correction
reviewed in its own right.

There's also a reason not to wait and see. In the current code, only submission *counting* filters by author role.
The review states, the review target and the legacy export treat every current version as a submission. So the first
correction written would sit as an unapproved submission and hold its item open. SCRUM-32 has to settle this either
way.

## 2. The decisions

| # | Decision | Why |
| --- | --- | --- |
| D1 | A correction is a proposal: never counted, reviewed, approved or waited for | §1 |
| D2 | Returns (adjust, revise, reject) and escalations carry a correction. An accept that changes the answer gets 422: "return it with your correction or escalate it" | An accept approves the answer as submitted |
| D3 | It's seen by the corrected answer's author, the item's reviewers and adjudicators, and the project owner. Never by the item's other annotators | Seeing peers' answers after submitting is the independence rule; a reviewer's proposed answer isn't covered by it |
| D4 | When the author resubmits, the correction becomes history with the answer it corrected. While a dispute holds the answer, it stays current, so an expert can accept it | So it can't turn up beside a later answer it never saw |
| D5 | The panel sends an explicit `corrected` flag | The panel pre-fills a *projection* of the answer (whole data, its output field, or an empty template), so comparing content on the server would misfire |
| D6 | Same shape as the answer: its data is copied, with only the part the panel showed replaced | Exports, dispute candidates and an Accept all see one shape, and rationale and model fields survive |
| D7 | No new column: the correction's `derived_from` and the review's history row link them | No schema change in a week when SCRUM-53, 87 and 98 all change the schema |
| D8 | Backend plus minimal web: the flag, an edited accept stopped in the panel, and the annotator seeing "Reviewer's suggested correction". The correction rides on the adjustment read | Annotators can only use a correction they can see. No new per-item request (your SCRUM-119) |

## 3. What it changes for other tickets

- **SCRUM-37 (H4):** a correction is authoritative only through an adjudication's Accept, never on its own. Its line
  "a reviewer's correction where the reviewer corrected the approved answer" no longer fits.
- **SCRUM-99 / SCRUM-103 (disputes):** an escalation can carry a correction, and it's a candidate the expert can Accept
  (the same `mark_authoritative`). Nothing more is needed from Yi or me.
- **SCRUM-51 (Parth):** the blind second review must also hide a first reviewer's correction from a second reviewer who
  hasn't decided yet.
- **SCRUM-119 (yours):** no extra per-item fetch; the correction comes with the read the panel already makes.
- **#38 (AI rework):** a correction on a returned AI answer is guidance for whoever reworks it, whichever way Hunter
  answers.

## 4. SCRUM-32's criteria

| Criterion | How |
| --- | --- |
| A decision that carries a correction creates a reviewer-authored version, linked, reason "correction" | On returns and escalations, when the panel flags it (D2, D5) |
| The annotator's submission is unchanged and visible | Yes; ADR 009 already guarantees it |
| Stored whole, never truncated; `review_notes` no longer carries it | Yes (issue 5) |
| Reopening the item shows the correction, marked as the reviewer's | In item details, and on the annotator's returned work (D8) |
| The export carries the corrected value where it's authoritative | It's exported as a version with role and link. It becomes authoritative only through an adjudication's Accept (D1), which is SCRUM-37's and SCRUM-99's part |
| The review read follows the same independence rules | D3; SCRUM-51 extends its blind rule |

**Delivery:** eight commits in one PR (five API, two web, an ADR), with you as reviewer, starting Thu 8 Oct. The ADR
takes the next free number after Yi's 010.

## 5. What I need from you

1. **Agree the model** (D1–D8), or tell me what to change before Thursday.
2. **Story D3:** suggested criteria, replacing the current four.
3. **SCRUM-37:** one line.
4. **SCRUM-32:** a scope note.

```text
Story D3, acceptance criteria:
1. A correction a reviewer makes when returning or escalating an annotation is kept as its own version, authored by the reviewer, linked to the answer it corrects, and stored whole.
2. The annotator whose answer was corrected sees the correction on the returned work; the item's reviewers, adjudicators and project owner see it too; the item's other annotators never do.
3. A correction becomes the item's answer only when the annotator adopts it in a resubmission, which is reviewed as usual, or an expert accepts it in a dispute; the exported dataset then carries it.
4. The original annotation is still visible in the item's history: corrected, not erased.
```

```text
SCRUM-37, replace "a reviewer's correction where the reviewer corrected the approved answer (agree with SCRUM-32)" with:
the adjudication's accepted judgement on a disputed item, which may be a reviewer's correction (SCRUM-32). A correction is never authoritative on its own: it becomes the answer through an expert's Accept, or through the annotator adopting it in a resubmission that is then approved.
```

```text
SCRUM-32, add under the description:
Scope agreed 2026-10-05 (Jingwei): a correction is a proposal, not a submission. Returns (adjust, revise, reject) and escalations carry it when the panel sends corrected=true; an accept that changes the answer is refused with 422. It is never counted, reviewed or approved itself; it is seen by the corrected answer's author, the item's judges and the project owner; it becomes history when its answer is resubmitted. BACKEND AND FRONTEND: the panel sends the flag and shows the annotator the reviewer's suggested correction. No schema change. ADR to follow in the PR.
```
