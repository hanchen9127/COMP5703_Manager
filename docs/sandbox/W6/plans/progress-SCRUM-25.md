# SCRUM-25 — Draft ownership · progress

**Owner:** Hanchen Wang · **Branch:** `CS57-Hanchen` · **Sprint:** W6 · **Updated:** 2026-09-12

| | |
| --- | --- |
| **Ticket** | SCRUM-25 — Annotation: Enforce draft ownership |
| **Story** | D6 — *"My unfinished work is mine"* |
| **Defect** | Issue #6 — Drafts have no ownership enforcement · **Critical** |
| **State** | **Complete and verified in the running app.** Backend pushed; web half committed locally. |

---

## The problem

> *As an annotator, I want my in-progress draft to be editable only by me, because right now anyone
> in the organisation can change, submit or delete my unfinished work.*

Draft access was checked against organisation and project membership only — never against who owned
the draft. One of six Critical defects in `issues.md`, and the one most visible from the annotator's
seat rather than buried in export logic.

---

## What changes for people using the platform

1. **An annotator's unfinished work is their own.** Editing, deleting or submitting is restricted to
   the author; anyone else is refused with a message saying why, not a generic access error.
2. **Reviewers are unaffected.** They can still open and approve another person's draft — that is
   their job, and it would have been easy to break.
3. **The first person to work an item claims it.** Intake leaves an empty placeholder draft owned by
   nobody; the first annotator to write to it takes ownership in that same action. No manual claiming.
4. **An item is held by one annotator at a time.** A second annotator sees the draft read-only, sees
   who holds it in a new **Annotator** column, and moves to another item.
5. **A second Critical defect closes as a side effect** — two routes to approving your own work:
   - Submitting *someone else's* draft recorded the other person as author, so the submitter could
     then approve it. Author-only submission breaks that chain.
   - Work saved through the web app often produced an annotation with **no recorded author**, and the
     self-approval guard skips an author-less candidate — so it was silently doing nothing. Ownership
     now reaches the annotation, so the guard fires.

> ⚠️ **Expected, not a regression:** a user holding both annotator and reviewer roles can no longer
> approve their own submission. That is the fix working. Please don't "fix" it back.

---

## Design decisions

| Decision | Why |
| --- | --- |
| **A separate ownership check, not tightening the shared access helper** | `fix-plan.md` §6 says to put it in the shared helper. Five routes use that helper and two — *view* and *approve* — must reach other people's drafts. Following the recipe would 403 every reviewer approval. **This is our one knowing departure from the fix plan; say so in the PR.** |
| **An unowned draft is unclaimed, not forbidden** | Intake creates an ownerless placeholder per item, so the first draft an annotator opens has no owner. Failing closed would stop all annotation. Found by experiment, not by reading code — the most surprising thing about the change. |
| **Role checked first, then ownership** | Someone failing both is told about the role: the more fundamental and more actionable message. |
| **Ownership stamped inside the existing save** | No extra write, which keeps SCRUM-26's transaction work simple. |
| **One annotator per item; no competing drafts** *(revised 2026-09-12)* | A first pass offered a "Start my own annotation" button; rejected as confusing. Two live drafts on one item is harder to reason about than a held item. Checked against the project docs — see below. |
| **Read-only is decided by ownership, not role** | A draft that isn't yours is shown read-only, full stop. That delivers "annotator drafts are read-only to reviewers" without any role-checking code. The backend 403 remains the real enforcement. |

### Does one-annotator-per-item contradict the platform's design?

Checked against canon, requirements, the schema strategy and the backlog. **It does not.**

- **"Dual" in this platform means reviewers, not annotators.** Dual sign-off is defined as *"two
  aligned approvals"*; D7 routes items to a second independent **reviewer**; I3 measures whether
  **reviewers** agree. Every cross-validation requirement sits in the review stage. Nothing asks for
  two people drafting the same item at once.
- **One requirement argues for going further, not back.** *"Annotators only see task items assigned
  to them"* (RQ-607). Read strictly, a second annotator should not see the item at all — so showing
  them the holder's draft read-only is a known gap against that requirement, not against this
  decision. It is not actionable yet: task assignment is unimplemented and task items have no
  assignee field. Once assignment lands, one-annotator-per-item follows from it rather than from a
  UI convention.
- **What the docs do require is untouched.** The schema must keep multiple annotations per item with
  full provenance — never a single mutable "latest label" row. This rule governs who may hold a
  *draft*, not how many annotations an item accumulates over its life.

*(An earlier version of this note claimed D7 assumed the opposite and would need revisiting. That was
wrong — D7 is about reviewers and does not conflict.)*

---

## What changed

Five backend files and five web files. No migration, no breaking API change.

**Backend — the rule:**

| File | Effect |
| --- | --- |
| `app/core/resource_scope.py` | The ownership rule, used only where it belongs |
| `app/api/routes/drafts.py` | Edit/delete/submit apply it; view/approve deliberately do not |
| `app/services/draft_service.py` | Records the author when an unowned draft is first written |
| `app/schemas/drafts.py` | `created_by_name`, so clients can show who holds a draft |

**Web — stop tripping the rule on an innocent user's behalf:**

| File | Effect |
| --- | --- |
| `lib/api/task-items.ts` | Saves to the viewer's own draft, not whichever came back first |
| `lib/task-workspace-data.ts` | Shows the viewer their own draft; another's is flagged read-only |
| `components/task-item-workspace-sheet.tsx` | Disables the editor and explains why |
| `components/task-item-table.tsx` | **Annotator** column between Item and Status |

**The web changes are not a security control.** All enforcement is in the backend; a user calling the
API directly is refused either way. They exist so an annotator who did nothing wrong is not blocked,
and so nobody starts from a colleague's answer.

---

## How we know it works

| Suite | Before | Now |
| --- | --- | --- |
| Backend | 149 | **163** |
| Web | 100 | **122** |
| Typecheck | clean | clean |

The Definition of Done asks for tests that fail against the old behaviour. Reverting each half in
turn: **5 backend tests red, then 5 web, then 9 web.** What stayed green is what had to survive — a
reviewer reading and approving someone else's draft, an author working on their own.

Tests use real users against a real database, because the refusal depends on how route guards, role
records and draft ownership interact — which fakes can't demonstrate.

**Verified in the running app**, twice. Charlie claims an item; Dana opens the same item and sees it
read-only, named to Charlie, with saving disabled and no second draft created; from Dana's live
session, edit/submit/delete are refused and reading still works; Charlie submits his own normally.
Repeatable in ten minutes — [`manual-test-SCRUM-25.md`](../tests/manual-test-SCRUM-25.md),
with `../scripts/sandbox-SCRUM-25.py` to build a clean item each run.

> The first walkthrough passed while a real defect was still present: it checked that Dana *could
> save*, never what her editor was pre-filled with. She was being shown Charlie's text. The manual
> test now has an explicit look-before-saving step so that gap cannot recur.

---

## Still open

- **A second annotator can still see the holder's draft**, which RQ-607 ("annotators only see task
  items assigned to them") says they should not. Blocked on task assignment existing at all — see the
  design note above.
- **One-annotator-per-item is enforced only in the UI.** The API still permits a second draft. If the
  rule matters it belongs server-side — nearest home is the one-pending-draft-per-author constraint
  already sketched as Commit 5.
- **Deleting an unowned placeholder is open to anyone.** Nothing to claim on the way to deleting, so
  this gap stays. Low impact; not closed by this ticket.
- **Pre-existing records stay ambiguous.** This stops *new* unowned annotations. Older rows keep
  their missing author until **SCRUM-27** settles which annotation is authoritative. Say so plainly
  so nobody reports D1 as fully restored.
- **D6 criterion 3, answered:** no admin or reviewer override this sprint. It would need its own
  permission and audit trail, and closing this defect does not require one. Recording the "no" is
  what satisfies the criterion.
- **A dependency worth recording:** the web half needed to know who is signed in, and the app did not
  — the session was held only in memory and lost on refresh. **Jingwei fixed that properly**
  (`/auth/me`, persisted profile, identity re-derived from the token). Without it this would have
  shipped a workaround.

---

## For the team

**Yi** — D5 (SCRUM-26, SCRUM-28) is allocated to **both of us**; only SCRUM-25 is mine alone. Worth
five minutes before either of us starts. Your `CS-57-Yi` branch also rewrites the dataset-registration
code this depends on; the behaviour survives your rewrite, but whoever merges second should re-check.

**Jingwei** — we are both editing the draft routes; this sits on top of your capability checks and
keeps them intact. I have also **cherry-picked your `fix(auth): restore user session after page
refresh`**, because the web half depended on it. It is a copy, not a merge — tell me if you amend or
rebase it before it lands on `main`.

**Anyone demoing** — use [`manual-test-SCRUM-25.md`](../tests/manual-test-SCRUM-25.md). Do not
use the old `sandbox_text_00N` items; they are spent and all finalised.

---

*Plan: [`plan-SCRUM-25-26-28.md`](./plan-SCRUM-25-26-28.md) · Manual test: [`manual-test-SCRUM-25.md`](../tests/manual-test-SCRUM-25.md) · Orientation: [`tut.md`](../../learning/tut.md)*
