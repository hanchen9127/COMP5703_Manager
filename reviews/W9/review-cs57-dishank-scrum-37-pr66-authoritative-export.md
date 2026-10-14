# Review — PR #66, `CS57-Dishank-H4` (SCRUM-37, H4)

2026-10-13. Head `e56c379`, one commit, based on `main` `41028db` (now 63 commits behind, including #60 merged
today). Seven files, +1,577 / −158:
- `app/api/routes/tasks.py` (+553 / −128): the export rewritten around the authoritative marker;
- `app/services/item_reconciliation_service.py` (+35 / −2): reviewer corrections join reconciliation;
- `tests/test_authoritative_export.py` (+823, new) and edits to three existing test files;
- `docs/design/backend/api_surfaces.md` (+78): "The authoritative answer of an item (H4, SCRUM-37)".

**On GitHub (checked with `gh pr view 66`):** open. Jingwei requested changes at `e56c379` (2026-10-13 04:12)
with four points — correction candidates without acceptance evidence, `dispute.decision` that doesn't exist,
the resolution crediting the wrong decision, the legacy summary not adding up — plus six smaller ones. This
review does not repeat them; it adds what they don't cover.

**Read before this review:**
- SCRUM-37's description (board export of 2026-10-12) and SCRUM-124 (created 2026-10-12);
- Dishank's question in `../../sandbox/W9/msg/question_from_Dishank` (earliest-submitted wins?);
- the memory of the 2026-10-12 team decision and the draft `../../sandbox/W9/jira/jira-expert-accepts-correction.md`;
- the review of #48, whose "For Hanchen" section records Jingwei's 10-10 hand-off of correction acceptance to
  SCRUM-37 as scope on an in-progress ticket.

**Recommendation: request changes (agree with Jingwei).** The export side is the right shape and answers
Dishank's own question the right way: several approved answers wait for an expert's reconciliation, and the
export never picks by time or author. One change has to come out rather than be fixed: the reconciliation
service change belongs to SCRUM-124.

## Verified

- **Suites**, in the `hej-review-48` worktree:
  - at `e56c379`, the four touched test files: **321 passed** (SQLite);
  - merged with today's `origin/main` (`cbd3d92`, clean merge, includes #60): full API suite on SQLite,
    **1,685 passed, 15 skipped** (PostgreSQL not rerun; Jingwei's PG run predates #60).
- **Probe** (temporary test, deleted): two approved answers, reconciliation chooses Alice's.
  - `superseded_version_count` / `superseded_versions` is **1** unfiltered and **0** with `created_by=ALICE`,
    in both formats — point 2 below;
  - with `created_by=BOB`, the normalized authoritative answer's author comes out with no email, confirming
    Jingwei's smaller point on missing names.

## Findings

### 1. Take the reconciliation change out — it is SCRUM-124's, decided after this work started (blocking)

`_is_reconciliation_candidate` and the `apply_completed_item_resolution` change make every current correction a
reconciliation candidate. Jingwei's point 1 shows why that is wrong as built and suggests requiring the
correction's own acceptance evidence. I would go further: **remove the change from this PR.**

- On 2026-10-12 the team decided to build the expert's Accept of a correction as a **new ticket, SCRUM-124**
  (W10). Its text: on a multi-annotator item, reconciliation takes the accepted correction **in place of** the
  original answer, and "SCRUM-37 (H4, Dishank): reads the marker this sets; no change to SCRUM-37."
- This PR adds the correction **beside** the original, unaccepted — the option the team did not choose.
- It flips a guard written on purpose: `test_reviewer_correction_is_not_a_reconciliation_candidate` came from
  Yi's #48 fix `0de552d` (2026-10-09) after review, and here becomes `..._is_a_reconciliation_candidate`.
- The likely cause is not Dishank's: Jingwei's note of 10-10 handed "accepting a correction" to SCRUM-37 before
  SCRUM-124 existed. Say so on the PR so it doesn't read as a mistake.

What stays: the export's handling of a correction that *is* authoritative (legacy no-slot, item-level
`authoritative_answer`) is harmless and ready for SCRUM-124. To revert:
- `item_reconciliation_service.py` back to `main`;
- `test_independent_second_review.py` back to `main`;
- in `test_authoritative_export.py`, drop or skip-with-reason the three correction-adoption tests
  (`test_an_expert_can_adopt_...`, `test_a_correction_the_expert_did_not_choose_...`,
  `test_the_reviewer_who_corrected_...`) — they move to SCRUM-124;
- in `api_surfaces.md`, drop "The frozen candidate set may also include a current reviewer correction ..." and
  point to SCRUM-124 instead.

Jingwei's point 1 then closes with no special case.

### 2. The docs promise filter-independent summaries; the superseded count isn't (should fix)

`api_surfaces.md` says the summary counts are "computed from the item's complete annotation set, independent of
the `created_by` filter". `authoritative_item_count` is, but `superseded_version_count` (normalized) and
`superseded_versions` (legacy) add up `superseded_entries`, which skips rows outside the filter
(`tasks.py:2130`, and the legacy loop). The probe: 1 unfiltered, 0 filtered. Either count every superseded
version before filtering the list, or change the sentence to say the superseded count follows the filter.
Pairs with Jingwei's point 4 (legacy `items_total`).

### 3. The PR description claims a change it doesn't make (minor)

"Clear authoritative export state when an item is reopened": reopen already clears the marker on `main`
(`task_item_reopen_service.py:99`, from #46), and nothing in this diff touches reopen.
`test_reopening_a_finalised_item_removes_its_authoritative_export` is a guard, not a fix. Worth saying so in
the description Jingwei already asked to expand.

## Not raised on the PR

- **Dishank's question is answered by the code**, the way Hanchen's 10-03 view and the roadmap's H4 row
  (2026-10-05) put it: no "earliest wins"; several approved answers wait for reconciliation. If Hanchen never
  replied to the message, a one-line confirmation would close it.
- **SCRUM-37's test list is covered**: two approved answers → one authoritative and one superseded (via
  reconciliation), an adjudicated item, an ambiguous item, and the C5 reasoning test.
- **SCRUM-102 (Kanishka, #65)** freezes "the authoritative value SCRUM-37 selects". Once #66 merges, #65 should
  read `authoritative_answer` from this shape rather than its own query; worth a collaboration note.
- **SCRUM-105 (H3, W10)** recognises superseded versions by this rule; the `superseded` list is what it reads.


### Comment for GitHub (ready to paste)

Revised 2026-10-13: SCRUM-124 is assigned to Dishank on Jira. That doesn't change point 1: the change still
leaves #66, and moves to the SCRUM-124 branch instead of being thrown away.

```
Thanks Dishank. The export shape is right, and several approved answers waiting for an expert's reconciliation (never "earliest wins") is the rule we want, so that answers your question from last week. I'm adding to Jingwei's review rather than repeating it.

**1. Please move the reconciliation change out of this PR and into SCRUM-124.** On 12 Oct the team made accepting a reviewer's correction its own ticket, SCRUM-124 (W10), and it's now assigned to you on Jira, so this work isn't lost: it moves there. Why it still leaves #66 even though you own both:
- **It's a different rule from SCRUM-124's, not a first half of it.** In SCRUM-124 the expert first accepts the correction in the dispute (a new column records which version was accepted), and reconciliation then offers the accepted correction *in place of* the original answer, with that dispute as its acceptance evidence. This PR offers every current correction *beside* the original, with no acceptance, which is the case Jingwei's point 1 describes. `_is_reconciliation_candidate` and the skipped evidence check would be rewritten anyway.
- **Merged as it is, `main` runs the wrong rule until SCRUM-124 lands.** An unaccepted correction could be chosen in a reconciliation, while #65 (H1) and H3 next week read what #66 exports.
- **A smaller #66 merges sooner,** and #65 is waiting on it.
- It also flips `test_reviewer_correction_is_not_a_reconciliation_candidate`, a guard added in #48. This isn't on you: an earlier note on 10 Oct handed correction acceptance to SCRUM-37 before SCRUM-124 existed.

Suggested steps:
1. Before removing anything, save the current state on a local branch (e.g. `CS57-Dishank-scrum-124`).
2. In #66, put `item_reconciliation_service.py` and `test_independent_second_review.py` back to `main`, remove the three correction-adoption tests from `test_authoritative_export.py`, and in `api_surfaces.md` replace the sentence about the frozen candidate set including a correction with a pointer to SCRUM-124.
3. Keep the export's handling of an authoritative correction (no legacy slot, item-level `authoritative_answer`). SCRUM-124's export criterion needs exactly that.
4. For SCRUM-124, start from `main` once #66 merges (or stack on #66). The three saved tests are a good starting point for its list: "a two-annotator item's candidates are the correction and the other author's answer, not the original", and "the correction's author can't decide".

With this out, Jingwei's point 1 is resolved too.

**2. The superseded count follows the `created_by` filter, though the docs say it doesn't.** `api_surfaces.md` says the summary counts don't depend on the filter, but `superseded_version_count` and `superseded_versions` add up the filtered list. Two approved answers, reconciliation chooses Alice's: the count is 1 unfiltered and 0 with `created_by=<Alice>`, in both formats. Either count before filtering, or change the sentence.

**3. Small:** reopen already clears the marker on `main` (#46, `task_item_reopen_service.py`), so "Clear authoritative export state when an item is reopened" in the description is covered by a guard test here, not a change.

I merged today's `main` (now including #60) into this branch locally: it merges cleanly, and the full API suite passes on SQLite (1,685 passed, 15 skipped).
```
