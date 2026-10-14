# Review — PR #71, `CS57-Jingwei-scrum-71` (SCRUM-71: grow the casebook to 57 cases, with the harness steps they need)

**Posted 2026-10-14 06:36 UTC by hanchen9127 as Changes requested** (at `a36a4ee`). The body was this file from
"Verdict" to "Checked locally", with an opening line to @Jingwei-Lin. The "Not for the PR" section was not posted.

**Update at `2f2df3b` (2026-10-14 06:47 UTC, not posted).** One commit, "number new cases in sequence and list the
casebook by category". No comment from Jingwei yet.

| Point | At `2f2df3b` |
| --- | --- |
| 1. Failed reviews read passes as "sees no verdicts" | ⏳ Not addressed |
| 2. Case ids | ✅ Resolved, by a different route from the suggested `area` field (see below) |
| 3. Rename `touch_draft` | ⏳ Not addressed |
| 6. `return_target` on EV-061 | ⏳ Due when #69 or #71 merges second |

How point 2 was resolved:

- Ids are now a plain sequence: the next is the highest plus one (EV-102), never renamed or reused.
- The README says an id carries no meaning; `category` and `covers` do.
- `list --by-category` groups the cases and prints the next free id, with a test.
- No existing id changed.

That meets requirements (a) and (b). Requirement (c), a loader check against misfiled cases, no longer applies,
because an id can't be misfiled. So the extensibility problem is solved.

**Left over, not blocking:** grouping by `category` is coarser than an `area` field. `workflow` holds 20 cases,
and 23 of the 57 cases have no `covers` (11 of them in `workflow`), so those 23 map to no ticket or surface
(SCRUM-71 criterion 2). Suggest making `covers` required, with at least one entry, validated by the loader. That
maps every case to a surface without a new field.

**Verdict unchanged: Request changes** until points 1 and 3 are done. Re-review once they are pushed.

**Re-review at `d2ef27d` (2026-10-14).** Jingwei replied point by point at 07:07 UTC and pushed `e9b8c5a`,
`06a9f4f` and `d2ef27d`.

| Point | At `d2ef27d` |
| --- | --- |
| 1. `_do_see` | ✅ Only 200 (the visible list) and 403 ("none visible") count as readings. Any other status is a step problem that names it. The new runner test patches `visible_reviews` into a 500 and checks that the blind-review run fails |
| 2. Case ids | ✅ As at `2f2df3b`. No `area` field, with a reasoned reply (three requirements met once ids carry no meaning; a fourth hand-set classification would be hard to keep in step; surfaces can become `covers` targets later). Accepted |
| 3. `touch_draft` | ✅ `edit_draft`, `submit_draft`, `delete_draft`, each with an optional `owner` that defaults to the actor; EV-027, the README and both test files updated |
| 4. Bare multi-label | ✅ Noted in the `review_corrections.py` docstring |
| 5. Reconciliation id in the response | Agreed as a follow-up |
| 6. #69 | Agreed: whichever merges second does it, and Yi's new cases take the next ids |

**Checked locally at `d2ef27d`:**

- backend (SQLite): 1,762 passed, 19 skipped, 207 subtests;
- casebook: 48/48 passed with 9 skipped, all 57 unchanged against the baseline;
- `list --by-category` ends with "Next case id: EV-102".

Jingwei reports PostgreSQL green for the evaluation tests (152 passed, 9 skipped).

**Approved on GitHub 2026-10-14 07:13 UTC by hanchen9127, merged 07:20 UTC (`f6f8eb0`) after CI passed on SQLite
and PostgreSQL** (at `d2ef27d`), with the optional `covers` note and the
#69 merge-order reminder.

**Verdict: Approve.** One optional note, not a condition: 23 of 57 cases still have no `covers`. Making `covers`
required would map every case to a ticket or surface (SCRUM-71 criterion 2), which is the gap the dropped `area`
field would have closed.

**On GitHub (checked 2026-10-14):** open, base `main`, head `a36a4ee`, 15 commits, 67 files, +4,234 / −77. Review
requested from hanchen9127. No comments or reviews yet. **Mergeable**, and up to date with `main` (`59b60d1`, the #67
merge).

**Verdict: Request changes.** The content does what SCRUM-71 asks:

- 57 cases, 48 of them running. The W10 target is 40.
- A case for every defect and ticket the board lists.
- The two categories that were missing.
- A full journey on a Group A record.
- Expected outcomes that match the decisions taken since.

Three things need fixing before merge:

1. A blind-review check can pass when the read fails.
2. Case ids carry an undocumented grouping that can't grow. The casebook will keep growing past this PR, so this one
   matters most.
3. `touch_draft` doesn't say what it does.

---

## Checked against the ticket

| SCRUM-71 asks | In the PR |
| --- | --- |
| At least 40 cases by the end of W10 | ✅ 57 written, 48 running, 9 skipped, each with its reason |
| A regression case for each Critical defect (2, 4, 5, 6, 7, 8) | ✅ Defect 8 is covered by unit tests, since its legacy routes were retired in #6. That's reasonable. |
| Closure cases for High defects 10, 15, 16, 20, 29 | ✅ EV-046, EV-040/061, EV-047 plus a unit test for the mid-write rollback, EV-002, EV-048 |
| SCRUM-116, 117, 120 and #61's shape check | ✅ EV-030, EV-031, EV-043, EV-050–052/054 |
| `annotator_disagreement` (with a reconcile step) and `source_changed` | ✅ EV-019 runs. EV-018 is skipped until source versions can change. |
| Issue 5's case | ✅ EV-070 |
| Un-skip what has merged, after checking it against later decisions | ✅ EV-012/013 run. EV-011 waits for #69, and EV-069 for #66. |
| A full journey on realistic data | ✅ EV-100: JSONL intake from a Group A record through to export. Release and provenance are EV-101, skipped. |
| Weekly figure: runnable count per category | ✅ `list --coverage` gives 4 of 9 categories running, and 16 of 16 owed protections |

**Against the decisions of 14 Oct:**

- No new case has an expert's Reject on a single answer. EV-012 still covers that, unchanged.
- The expert's Return goes back to the author (EV-040, EV-061), which stays the default when #69 adds the "new
  annotator" option.
- No AI-assisted case sets `required_annotators` above 1, so nothing clashes with #69's fixed count.
- EV-068 asserts which answer is authoritative, not how many answers the export carries. So it doesn't pin defect 4,
  and it will keep passing when #66 lands.

**The platform fix** (`b1655dc`, `review_corrections.py`) is correct. `correction_content` works on a deep copy, so
the original answer is never rewritten. Both new tests fail on the old code: the label was not replaced, and a
correction outside the task's labels got through.

---

## To fix before merge

### 1. A failed reviews read passes as "sees no verdicts"

`_do_see` (`evaluation/harness/driver.py`) records the verdicts as `[]` whenever
`GET /annotations/{id}/reviews` returns anything other than 200:

```python
verdicts[submission] = (
    [... for row in reviews.json()] if reviews.status_code == 200 else []
)
```

EV-026 expects exactly `[]` at lines 56 and 97, where the second reviewer must not yet see the first verdict. So if
that read broke and returned 500 or 404, the blind-review case would still pass.

The route has two legitimate answers:
- 200 with the list filtered by `visible_reviews` (a blind reviewer);
- 403 from `assert_visible_to_caller` (an annotator who hasn't submitted).

Please:
- read 200 as the list, and 403 as "none visible";
- turn any other status into a step `problem` that names the status;
- add a runner test that fails if a 500 is read as `[]`.

### 2. Case ids: make the grouping explicit and able to grow

The new ids are grouped by tens, by area of the platform. The README says only "EV- and three digits, unique",
and SCRUM-70 reserved only EV-010–019. As I read the cases:

| Range | Appears to hold |
| --- | --- |
| 02x | who may do what, and what they see |
| 03x | review rules |
| 04x | finalised work, reopening, export, intake |
| 05x | answer shape and judgements |
| 06x | disputes and reconciliation |
| 07x | corrections |
| 08x | AI |
| 09x | ? (EV-091 is sampling, EV-092 intake) |
| 10x | full journeys |

This won't hold as the casebook grows:

- **Nothing written down says where a new case goes.** Yi has to add cases in #69: AI fallback, and the expert's
  Return to a new annotator. You will add more in W11 toward 60+. Neither of you can tell which range to use.
- **It is already inconsistent:**
  - intake sits in 04x (EV-047, 048) and 09x (EV-092);
  - sampling sits in 02x (EV-026) and 09x (EV-091);
  - EV-040, a dispute case already on `main`, sits in 04x.
- **Ten ids per area runs out.** 06x already holds six cases, and SCRUM-124 and #69 will add more dispute cases.
  When an area fills, its next case lands in an unrelated range, or the ranges get renumbered, which breaks every
  reference.
- **The grouping is invisible to the tooling.** `category` and `covers` are validated and counted. The id grouping
  is a third classification that nothing checks. SCRUM-71's second criterion, "each workflow surface maps to the
  cases it owes", can't be checked from an id.

What's needed:

- (a) where a case belongs is written down;
- (b) a new case can always get an id without renumbering anything;
- (c) the loader rejects a case that is misfiled.

**Suggested way:**

- **Ids become handles only.** From now on the next id is the highest plus one (EV-102 next), never reused, and the
  digits carry no meaning. Say so under "Write a case" in the README. **Ids already on `main` don't change**: EV-011,
  012, 040 and the rest are named in the baseline, skip reasons, tickets, the roadmap and reviews. The ids new in
  this PR can stay as they are, since gaps do no harm.
- **The grouping moves into a field.** Add a required `area` key (for example `roles_and_visibility`, `review_rules`,
  `finalised_and_reopen`, `export`, `intake`, `answer_shape`, `disputes`, `reconciliation`, `corrections`, `ai`,
  `sampling`, `journey`).
  - Validate it against a fixed list in `scenario.py`, the way `category` is.
  - Have `list` and `list --coverage` group by it: cases per area, and how many run.
  - Set it on all 57 cases.
  - Adding an area means adding it to the list, in the same PR as its first case.

If you'd rather keep ranges, the same three requirements apply:

- a range table in the README;
- the strays moved (EV-091 → 02x, EV-092 → 049);
- an overflow rule that never renumbers;
- a loader check that each id sits in its declared range.

That is more machinery for the same result, so I'd go with the field.

### 3. Rename `touch_draft`

"Touch" doesn't say what the step does: one actor edits, submits or deletes another person's saved draft. It also
reads like the Unix `touch`, which only updates a timestamp.

Suggest three steps matching `save_draft`: `edit_draft`, `submit_draft` and `delete_draft`. Each takes the `item`
and the `owner` of the draft, which is the actor's own when no owner is given. Then "bob `delete_draft`, owner
alice" reads as what it is. If you'd rather keep one step, `act_on_draft` with `owner` and `action` is the minimum.

Make the change everywhere `touch_draft` appears:

- `driver.py` and `scenario.py`;
- EV-027, the only case that uses it;
- the README step table;
- `test_evaluation_runner.py` and `test_evaluation_scenario.py`.

---

## Smaller points (not blocking)

4. **Bare multi-label answers.** The new branch replaces `label` (and `labels`) only when the answer has a `label`.
   An answer sent as `{labels: [...]}` alone, such as a multi-label Civil Comments answer, still takes the old path,
   and its correction lands in `output_text`. A one-line note in the docstring is enough for now. A fix belongs with
   whichever ticket next touches multi-label corrections.
5. **The review response doesn't name the reconciliation it opens.** `_open_reconciliation` has to find the case by
   listing as the actor, and then as any arbitrator or admin. That works, and the decision is still sent as the
   actor. But a dispute and a split come back in the review response (`annotation_dispute_id`,
   `disagreement_id`), so returning `reconciliation_id` the same way would let the harness, and the web, drop the
   lookup. That's a follow-up, not for this PR.
6. **Coordinate with #69, which now changes the harness too** (Yi's commits of 14 Oct, head `b6092e2`):
   - **EV-011.** #71 adds `covers` on the line after `skip`. #69 removes `skip`, and its `_do_annotate` claims the
     replacement slot from the annotate queue.
   - **`return_target` is now required on an expert's Return.** #69 makes it required in the API, and its
     `scenario.py` refuses an `adjudicate` step with `decision = "return"` that doesn't name `author` or
     `new_annotator`. #69 updates the Return cases already on `main` (EV-013, EV-040). EV-061 is new in #71, so it
     will fail to load once both are in, unless it gets `return_target = "author"`.
   - **The same harness files.** Both PRs change `scenario.py` (step parameters and validation) and `driver.py`.

   Whichever PR merges second:
   - takes the other's harness changes;
   - adds `return_target` to every Return step;
   - regenerates the baseline.

   #69's expert "Return to a new annotator" also owes its own cases, under the ticket's "every feature lands its own
   cases". Those cases take their ids and `area` by the rule from point 2, which is one more reason to settle that
   rule first.

---

## Checked locally (head `a36a4ee`)

- Backend (SQLite): 1,760 passed, 19 skipped, 207 subtests, the same as the PR description. PostgreSQL not run.
- Casebook against the committed baseline: 48/48 passed, 9 skipped, all 57 unchanged, no regression.
- `list --coverage` as quoted above. Nothing is written outside the ignored `evaluation/reports/`.

---

## Not for the PR (Hanchen)

- **`mission.md` defect table:** SCRUM-71 says a passing case closes a High defect, and is recorded there and on the
  ticket. Defects 10 (EV-046), 15 (EV-040, EV-061), 16 (EV-047 plus the unit test), 20 (EV-002) and 29 (EV-048) can
  be marked closed once #71 merges.
- **Board:** SCRUM-71 is unassigned in the export of 13 Oct. Assign it to Jingwei, which `tracking-sync` then
  carries into `story_src.csv`. With SCRUM-72 and 73 also his in W10, his W10 load needs a look at today's meeting.
