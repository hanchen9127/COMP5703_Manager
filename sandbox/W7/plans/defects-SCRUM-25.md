# Defects — SCRUM-25 against the client's answers

**Ticket:** SCRUM-25 — Enforce draft ownership (story D6), merged in PR #13.
**Why this exists:** the client's answers of 2026-09-15 (`../../../info/client-question.md`) change the
design SCRUM-25 was built on. This file records where the merged code no longer fits, so a follow-up
fix commit can bring it in line.
**Baseline:** `origin/main` at `5070efd`. Line numbers are for that commit. PR #11 changed `task_service.py`,
so that file is cited by function only.
**Background:** [`../../W6/plans/plan-SCRUM-25-26-28.md`](../../W6/plans/plan-SCRUM-25-26-28.md) and
[`../../W6/plans/progress-SCRUM-25.md`](../../W6/plans/progress-SCRUM-25.md).

---

## What the client said that bears on SCRUM-25

| Question | Answer | What it means for draft ownership |
| --- | --- | --- |
| Q3 — whose is a reviewer's correction | "不同的 author 有不同的 version" — different authors have different versions | Ownership is per author, and one author's work never becomes another's. The AI counts as an author too — **confirmed by the client on 2026-09-17**: AI output is its own version, authored by the AI model, and goes straight to review |
| Q1 — canonical or per annotator | Partly answered through Q3: per-author versions are kept | No design may merge two authors' work into one row. Which version is authoritative is still open (follow-up F1) |
| Q4 — after adjudication | Back to the reviewer; the expert may not finalise | An adjudicated item no longer returns to the annotator, so the annotator's resubmission path changes. Related work, not SCRUM-25 — see the last section |
| F4 — one or several annotators per item | **Answered 2026-09-17:** several, the number set per task; drafts are not capped, submissions are; and there is no assignment at all | The web app's "one annotator per item" rule is wrong (S8) |

What still holds: D6 criteria 1 and 2 — another person cannot edit, delete or submit a draft someone else
owns, and is told why. Criterion 3's decision, no override, is unaffected; the Q4 answer needs none.

---

## Defects

| # | Defect | Severity against the client design | Fix in | Waits on |
| --- | --- | --- | --- | --- |
| S1 | AI output has no author: "AI-authored" and "unclaimed" are the same value | High | SCRUM-25 fix | — |
| S2 | The first human save takes over the AI draft and overwrites the AI's version | High | SCRUM-25 fix | — |
| S3 | Anyone with the annotate capability can delete an unclaimed draft, including the AI's | Medium | SCRUM-25 fix | — |
| S4 | Claiming is not atomic: two first writers both succeed, last write wins | Medium | SCRUM-25 fix | — |
| S5 | An author's annotation is overwritten in place, never versioned | High | Separate commit after SCRUM-26 | F1, SCRUM-27's direction |
| S6 | A reviewer has no way to hold a version of their own | High | SCRUM-32 (D3), with SCRUM-25's ownership rule | F1 |
| S7 | `approve_draft` can return another author's annotation | Medium | SCRUM-27 (D4) | F1 |
| S8 | "One annotator per item" is enforced only in the browser, and may be the wrong rule | Medium | SCRUM-48 (API) and SCRUM-93 (web), or SCRUM-25 fix | — (F4 answered 2026-09-17) |
| S9 | A pre-ownership submitted draft with no author is treated as the viewer's own | Low | SCRUM-25 fix | — |
| S10 | Rework loses what the annotator typed: **Save draft** writes back the previous submission | High | SCRUM-93 (web queues) | — (found 2026-09-20) |

### S1 — AI output has no author

- **Where:** `TaskService.register_dataset` creates the AI pre-annotation draft with `created_by=None`,
  recording the operator only in `draft_data.metadata.ai.triggered_by` (`_with_ai_trigger`). The empty
  human-first placeholder is created with `created_by` unset as well.
- **Why it is wrong now:** `verify_user_owns_draft` (`app/core/resource_scope.py:66`), `_claim_fields`
  (`app/services/draft_service.py:86`) and the web app's `isUnclaimed` (`apps/hej-web/lib/api/task-items.ts:159`)
  all read `created_by IS NULL` as "nobody's yet". An AI version and an empty slot cannot be told apart, so
  the AI can never be an author.
- **Needs:** an explicit author kind on drafts, and later annotations. Choosing between an additive column
  (for example `author_type`: `ai` | `human`) and a metadata convention is the first design decision of the
  fix commit.

### S2 — The first human save takes over the AI's version

- **Where:** `DraftService.update_draft` (`draft_service.py:64`) merges `_claim_fields` and replaces
  `draft_data` wholesale from `DraftUpdate` (`app/schemas/drafts.py:18`). The web payload builders,
  `buildAnnotationDraftPayload` (`task-items.ts:123`) and `buildJudgementDraftPayload` (`:138`), send no
  `metadata`.
- **Result:** the first save by an annotator
  1. makes them the author of the AI's draft,
  2. erases the AI's output, and
  3. erases `metadata.ai.triggered_by`.

  If they submit the suggestion unchanged, `_create_annotation_from_draft` (`draft_service.py:176`)
  credits the annotation to them, with no trace the content came from the AI.
- **Needs:** the AI draft stays read-only and AI-authored. A human edit starts a new human-authored
  draft, seeded from the AI output and referencing it. F1 (provenance) and F3 depend on exactly this
  separation.
- **Tests that encode today's behaviour and must change:**
  - `tests/test_ai_draft_ownership.py:174` — `test_first_annotator_claims_the_ai_draft_and_a_second_is_refused`
  - `tests/test_draft_ownership_routes.py:302` — `test_first_writer_claims_an_ownerless_placeholder_draft` (keep it for the empty placeholder; add the AI case separately)
  - `apps/hej-web/lib/task-workspace-data.test.ts:522` — "claims the unclaimed intake placeholder when the viewer has none"

### S3 — Anyone can delete an unclaimed draft

- **Where:** the delete route (`app/api/routes/drafts.py:190`) calls `verify_user_owns_draft` (`:205`),
  which returns early for a draft without an owner. `DraftService.delete_draft` (`draft_service.py:103`)
  claims nothing.
- **Why it is worse now:** `progress-SCRUM-25.md` recorded this as low impact. Under the client's answer,
  deleting an AI draft destroys the AI's version.
- **Needs:** AI drafts cannot be deleted by people. An empty placeholder is deletable only by the
  person who claims it.

### S4 — Claiming is not atomic

- **Where:** `verify_user_owns_draft` reads the row, then `_claim_fields` stamps `created_by` in a later,
  unconditional update (`update_draft`, `submit_draft` at `draft_service.py:113`).
- **Result:** two people who write to the same unclaimed draft at the same moment both pass the check,
  and both writes succeed. The later one replaces the earlier author's content and ownership. The earlier
  author's page still shows the draft as theirs.
- **Needs:** a conditional update, such as `UPDATE drafts SET created_by = :me WHERE id = :id AND
  created_by IS NULL`, and a `409` when no row changes. With S2 fixed, the only thing left to claim is the
  empty placeholder.

### S5 — An author's annotation is overwritten in place

- **Where:** `_create_annotation_from_draft` (`draft_service.py:176`) looks up the author's existing
  annotation with `find_by_item_and_creator` and updates `annotation_data` in place. `version` stays `1`,
  `is_latest` never changes, `base_annotation_id` is never set, and `confidence=90` is the only marker
  of an update.
- **Why it is wrong now:** Q3 asks for versions per author. A resubmission is a new version in that
  author's line, with the earlier one kept.
- **Fix in:** a separate commit — not SCRUM-28 (decided 2026-09-16). SCRUM-28 only refuses new work
  against a finalised item. Versioning changes which annotation review (`_latest_annotation`) and export
  pick, and that rule is SCRUM-27's (D4), still waiting on follow-up F1. Plan it once SCRUM-26 has landed
  and SCRUM-27's direction is set; see `plan-SCRUM-28-26.md` → *Not in these tickets*.

### S6 — A reviewer cannot hold a version

- **Where:** `create_draft` (`drafts.py:73`) requires `GovernedAction.ANNOTATE`, so a reviewer without
  the annotator role cannot create a draft. SCRUM-25's rule makes the annotator's draft read-only to them.
  `approve_draft` (`draft_service.py:216`) only changes the draft's status.
- **Why it is wrong now:** Q3 makes a reviewer's correction a version authored by the reviewer, so there
  must be a path to create one without touching the annotator's draft.
- **Fix in:** SCRUM-32 (D3, W9; unassigned on the board). SCRUM-25's part is to keep ownership per author, so it does not
  block that path. The capability that gates a reviewer's version — REVIEW or APPROVE, not ANNOTATE — is
  D3's decision.

### S7 — `approve_draft` can return another author's annotation

- **Where:** when `draft.annotation_id` is empty, `approve_draft` falls back to the item's first
  annotation with `is_latest == True` (`draft_service.py:243`), without filtering by `created_by`.
- **Result:** with one version line per author, it returns an arbitrary author's annotation — the same
  root cause as issue 3.
- **Fix in:** SCRUM-26 records `draft.annotation_id` this week, which removes the fallback's use for new
  drafts. The general rule is SCRUM-27 (D4).

### S8 — "One annotator per item" lives only in the browser

- **Where:** the web app shows another author's draft read-only and disables annotating:
  - `selectDraftForViewer` (`apps/hej-web/lib/task-workspace-data.ts:363`) picks the draft to show;
  - `draftIsReadOnly` (`:465`) marks another author's draft;
  - the "X is annotating this item" notice (`task-item-workspace-sheet.tsx:1286`) disables the editor.

  The API's `create_draft` accepts any number of drafts per item. The W6 plan's Commit 5, one pending draft
  per author per item, was never built. A page opened before someone else's first save still creates a
  second draft (`upsertDraft`, `task-items.ts:207`).
- **Settled by F4, 2026-09-17.** The rule was a team decision (W6 plan, *Decisions, 2026-09-12*), and the
  client has chosen a different one: several annotators per item, the number set when the task is
  created. Drafts are not capped — anyone may start one and each sees only their own — but a submission
  is refused once the item has as many as its task requires, and an AI submission counts as one of them.
  There is **no assignment**, so the earlier option of refusing drafts from anyone not assigned is gone.
- **Needs:**
  - Remove the web app's read-only block for annotators: each annotator gets their own draft
    (SCRUM-93, W8, with the 2-of-3 progress and Annotate greyed out at the limit).
  - Enforce the limit on the server, in `DraftService.submit_draft` (SCRUM-48, W7) — beside SCRUM-28's
    guard and SCRUM-26's transaction, so the three refusals need one agreed order.

### S9 — A pre-ownership submitted draft is treated as the viewer's own

- **Where:** `selectDraftForViewer` treats an unclaimed submitted draft as owned by the viewer, and the
  resubmit path creates a fresh pending draft (`RESUBMIT_STATUSES`, `task-items.ts:200`).
- **Result:** on a returned item whose draft predates ownership, any annotator can resubmit and become
  the author of the next version of someone else's work.
- **Needs:** attribute such drafts to no one, show them read-only, and leave rework to an assigned
  annotator. This affects only data written before PR #13.

### S10 — Rework loses what the annotator typed

**Found 2026-09-20**, during the SCRUM-26 manual walkthrough (`../tests/manual-test-SCRUM-26.md`, step 7).
Pre-existing on `origin/main` (`d4d809c`, 2026-09-13); nothing in SCRUM-26 touches it.

- **What happens:** on a returned item, the annotator edits the answer and clicks **Save draft**. The
  editor reverts to the previously submitted answer, and that old answer is what gets saved. Clicking
  **Submit annotation** directly works, so the walkthrough uses that.
- **Reproduced:** item `item_b9a246910d61`. After the reviewer's Adjust, `ANSWER-A2` was typed and saved;
  the draft created at 05:56:43 holds `ANSWER-A1`, and submitting it 3 s later wrote `ANSWER-A1` back
  over the annotation.
- **Where, part 1 — the wrong draft is chosen.** `selectDraftForViewer`
  (`apps/hej-web/lib/task-workspace-data.ts:373`) prefers the viewer's **submitted** draft over their
  **pending** one. After rework an item carries both, so the screen hydrates from the old submission.
- **Where, part 2 — unsaved typing is discarded.** The editor is initialised by an effect keyed on the
  whole `item` object (`components/task-item-workspace-sheet.tsx:951`,
  `setAnnotationOutput(item.draftPayloadText ?? "")`). Any re-render that hands down a new item object —
  including hydration finishing after the drawer opened — overwrites what the annotator has typed.
- **Needs:** prefer the viewer's own pending draft when one exists, and key the initialisation on
  `item.id` (or leave the editor alone once it is dirty).
- **Why SCRUM-93:** that ticket rebuilds this screen for several annotators per item — each with their
  own draft — so the draft-selection rule is already its business. Under the client's answer of
  2026-09-17, part 1 gets worse: with several drafts per item, picking the wrong one can show another
  annotator's work.
- **Not filed on Jira** (decided 2026-09-20): carried by SCRUM-93, the same way issue 30 is carried by
  B4/SCRUM-24.

---

## Proposed follow-up commits for SCRUM-25

These cover S1–S4 and S9, which wait on nothing. Write the full plan in `plan-SCRUM-25-fix.md` once the
author-kind decision is made.

| # | Commit | Covers |
| --- | --- | --- |
| 1 | `fix(api): keep AI drafts as their own author (SCRUM-25)` — author kind on drafts; AI drafts cannot be claimed, edited or deleted by people | S1, S2, S3 |
| 2 | `fix(api): claim unowned drafts atomically (SCRUM-25)` — conditional claim with `409`; a placeholder is deleted only by its claimant | S3, S4 |
| 3 | `fix(web): start a human draft from the AI suggestion (SCRUM-25)` — treat the AI draft as a read-only source, create the viewer's own draft from it, and show pre-ownership drafts read-only | S2, S9 |

Carried by other tickets: S5 → a separate commit after SCRUM-26, S6 → SCRUM-32, S7 → SCRUM-26 and SCRUM-27, S8 → SCRUM-48 and
SCRUM-93 (F4 answered 2026-09-17).

**Decisions to make before Commit 1:**
1. Author kind as an additive column or a metadata convention. A column needs a `migrate_db_schema()`
   step, which must be ordered with SCRUM-48's assignee column and SCRUM-62's event table this week.
2. How a human draft references the AI version it started from, for example `based_on_draft_id`. F1's
   provenance events (Yi, SCRUM-62) should record the same link, so agree it with Yi.

**Before starting:** `CS57-Hanchen` is 1 commit ahead of and 20 behind `origin/main`. PRs #9, #11 and #17
have merged since. Merge `main` into the branch first.

---

## Related, not SCRUM-25 — Q4's effect on the resubmission path

Recorded here because it touches the same draft code:

- `decide_escalation` in `app/api/routes/review_actions.py` offers `finalize`, which the client has ruled
  out for experts. Its `send_back` sets `expert_send_back`, which returns the item to the **annotator**;
  the client wants it returned to the **reviewer**.
- `DraftService.submit_draft` moves `expert_send_back` to `annotated`
  (`tests/test_draft_service_lifecycle.py:90`), and the web app lists `expert_send_back` among its
  resubmit statuses (`task-items.ts:200`). Both assume the annotator reworks the item after adjudication.
- **Owner:** Parth, SCRUM-52's E3 part (W10). Raise it with him now, before SCRUM-51 and SCRUM-86 build more
  on the send-back path.
