# CS-57 Progress Report: 23 September to 7 October 2026

Covers W8 (24–30 Sep) and the mid-semester break (1–7 Oct). Prepared for the client meeting on 7 October.

## At a glance

- **22 pull requests merged into `main`** since the last meeting, from #29 to #57.
- **Tests on `main`: 1,277 backend and 379 frontend**, up from 439 and 205 on 23 September. On 7 October
  the backend suite ran on SQLite: 1,268 passed, 9 skipped, none failed. Counted as test functions, the
  backend went from 382 to 946; much of the rest comes from parameterised tests.
- **All three stories added by your Round 2 answers (24 Sep) are built and merged:** reopening a finalised
  item (D9), record-based dataset import (B7) and a per-task annotation surface (B8).
- **The evaluation harness exists.** Each case is written as a file and runs through the real API as real
  users, each in a fresh database, and writes a pass/fail report.
- **From 3 October your answers come through GitHub issues labelled `QA`**, not through the shared document.
  Two of these issues need your answer (see *Decisions we need from you*).

## What is new, by pillar

**Govern**
- Organisation membership, invitations and role management (SCRUM-90, #28). The invitee's acceptance
  screen is in review (SCRUM-115, #56).
- Project policy now governs review. Rules resolve in the order organisation → project → task, and the
  policy screen labels each value as enforced or only recorded (SCRUM-50, #37).
- Task lifecycle: draft → active → paused → completed, with guards on each step. A task that has items
  can't be deleted (SCRUM-24, #41).

**Intake and task setup**
- JSON, JSONL and CSV files import as one item per record. For each file, the uploader chooses which
  fields the annotator sees, so reference answers can stay out of the annotation input (SCRUM-111, #42;
  your answer R1-1).
- Each task picks its annotation surface (`annotation_type`), and the AI model is chosen at setup
  (SCRUM-112, #36; R2-6).

**Assist**
- A project manager starts an AI run. Each successful AI answer goes straight to review, recorded as the
  model's own answer (SCRUM-46, #29). Batch progress and each item's job status are visible (SCRUM-5, #32).

**Adjudicate: work and review**
- Work is offered through role-checked queues. Several annotators can work one item independently, and
  nobody sees a colleague's answer before submitting their own (SCRUM-48, #33/#35; SCRUM-114, #43).
- An available-work list for each role. It shows each item's progress, such as "2 of 3 · 1 working", and why
  an item is unavailable: full, AI-annotated, already submitted by you, or returned for rework
  (SCRUM-93, #49).
- Each submission is reviewed on its own, and the reviewer chooses which submission to open
  (SCRUM-27, #34; SCRUM-113, #44).
- Independent second review: a second reviewer can't see the first decision until they have made their own.
  An adjudicator can't be anyone who annotated or reviewed the item (SCRUM-51/52, #53; R2-8).
- A project owner can reopen a finalised item. The old answer is kept as a superseded version
  (SCRUM-110, #46; R2-3).
- Workflow guards found by our own scenario testing:
  - a review decision is accepted only on a submission waiting for that reviewer (SCRUM-116, #45);
  - an annotator can resubmit only work that was returned to them (SCRUM-117, #52);
  - a reopened item stays open (SCRUM-120, #50).

**Record**
- Every answer is now a version of its own, whether the AI's, an annotator's or a reviewer's. Each version
  records its author's role and what it was derived from, and at most one version is authoritative. The export
  carries all versions (SCRUM-38, #47). This is the base for R2-2: what a release outputs, versus the
  provenance behind it.
- Item history is easier to read: entries no longer repeat their own summary (SCRUM-41, #57).

**Evaluate**
- Evaluation harness with four cases on `main` (SCRUM-68, #39). The casebook's categories and the
  brief's adversarial cases are in a draft PR (SCRUM-70, #51).

**Performance**
- Opening a 200-item Annotate page took 404 requests and 2,969 ms. It now takes 6–8 requests and about
  560 ms (SCRUM-119, #54).

## Against the plan

The break was planned as scenario testing, bug fixes and the evaluation harness, with as few new features
as possible.

| Planned | Outcome |
| --- | --- |
| Scenario testing; each bug gets its own ticket | Three bugs found and fixed (SCRUM-116, 117, 120), plus the performance fix |
| Evaluation harness (I1) | Merged. Repeatable runs and regression reporting (SCRUM-69) move to W9 |
| Casebook structure (I2) | In progress, draft PR #51 |
| Disputes as their own record (E3/E4) | Paused: waiting on your answer in issue #40 |
| W8 carry-over | Merged: queues and the available-work list, independent second review, lifecycle. In review: invitation acceptance (#56), state/history consistency (#60) |

**Replan of 1 October.** The provenance event record (F1) moves from W11 to W9, so the release work in W10
builds on it. W11 (22–28 Oct) is the last build sprint.

## Next: W9 (8–14 October)

- **Provenance:**
  - an event record written at every decision point (F1, SCRUM-98);
  - versioned guidelines, sources and review policies (F2, SCRUM-53).
- **Answers:**
  - a reviewer's correction is stored whole as a proposal (D3, SCRUM-32, #58);
  - at most one authoritative answer per item (H4, SCRUM-37).
- **Release:** an immutable release artefact (H1, SCRUM-102).
- **Review:**
  - cross-review sampling by policy percentage (D7, SCRUM-51);
  - automatic disputes when reviewers disagree (E1, SCRUM-101).
- **Modes:** the annotation mode is recorded on every item (C4, SCRUM-87, #59).
- **Evaluation:** repeatable runs (I1, SCRUM-69) and the casebook (I2, SCRUM-70).

**W10 preview:** release manifest and gate, dispute screens, the Expert Gate, an item's full timeline,
the casebook grown to 40 cases, and measuring AI influence on human judgement, including blind-then-reveal
(I4, SCRUM-73).

## Decisions we need from you

1. **Issue #40: dispute scope.** Jingwei's latest comment proposes two levels:
   - a dispute about one answer;
   - then, if the approved answers still differ, a dispute about the item, with your three outcomes.

   It asks four questions. Disputes (SCRUM-99/100, PR #48) and the test of differing approved answers for
   H4 wait on this.
2. **Issue #38: a returned AI first pass.** Should it go to a human annotator, back to the AI with the
   reviewer's feedback, or should the task policy choose? Today such an item gets stuck: no annotator is
   offered it, and the AI can't redo it.
3. **Blind-then-reveal: a mode or a protocol?** The project description lists it as one of "the three
   annotation modes". Your answer R1-2 (21 Sep) calls it an evaluation protocol for human judgement, and our
   plan follows that (I4, W10). Please confirm which to build. If it is a protocol, should a task switch it
   on as a setting, and is it for evaluation runs only or for live tasks too?

## Risks

- **Disputes are blocked on #40.** E1's automatic disputes (W9) and the dispute screens (W10) build on the
  same record.
- **W9 is the heaviest week (about 21.5 units).** The provenance event record is on the critical path to
  W10's release gate.
- **Several W9 tickets change the database schema.** They follow one agreed order, and development
  databases are reset afterwards.
