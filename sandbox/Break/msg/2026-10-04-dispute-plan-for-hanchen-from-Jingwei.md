# The dispute workflow: plan, Jira gaps and what I need from you

For Hanchen, from Jingwei, 4 October 2026. Checked against `main` at `df7c05a` (#45, #46 and #47 merged), the Jira
export of 4 October, the client Q&A doc, issues #38 and #40, and #48 with your combined review.

## In short

- **Dispute is the biggest hole in the demo journey.** On `main`:
  - an escalation can be left with no dispute behind it;
  - nobody checks whether the adjudicator is independent;
  - the decision picks no answer, and send-back strands the item;
  - nothing detects disagreement;
  - the dispute and arbitration pages are `notFound()`.
- **I've planned the whole workflow** against the tickets we have: SCRUM-99, 100, 101, 51, 52, 103, 107, 118, 37
  and 105. It follows R2-1, R2-2 and R2-8, and the item-level reading the tickets and #47 are already built on.
- **Six pieces of work have no ticket.** I'd like you to create them, assigned to me (§3, with paste-ready
  descriptions in §6). If that's too much for one person, 1, 2 and 5 matter most.
- **Two ticket descriptions now contradict the plan** (SCRUM-37 and SCRUM-105), and a few others need a line added
  (§4).
- **Five design calls need your OK** before W9 starts on Thursday (§2).
- **Ownership:** SCRUM-107 and SCRUM-118 are mine on the board but unassigned in Jira. Can you assign them?

## 1. The workflow, end to end

1. **Raise.** A dispute opens three ways:
   - a reviewer escalates a submission, with a justification;
   - the platform opens one when two reviewers split on a submission (under `open_dispute`);
   - the platform opens one when an item's approved answers differ.
2. **Open, in one transaction.** The dispute records:
   - its trigger, and who opened it (a person, or the platform);
   - the exact answer versions and reviews it's about;
   - the posture in force.

   An item has at most one open dispute.
3. **Hold.** While it's open:
   - no review decisions (as since #45);
   - no resubmission of an answer that's under dispute;
   - no status PATCH out of dispute.

   Other annotators keep answering.
4. **Wait.** It can't be decided until every required answer is in (`required_annotators`). Otherwise a dispute on
   the first of three submissions would settle the item while two people are still annotating.
5. **Queue.** Only independent experts see it: nobody who annotated or reviewed the item, in any round, or who opened
   the dispute. Administrators included.
6. **Decide** (R2-1), with a reason of at most 2000 characters:
   - **Accept** one current answer: `mark_authoritative(cause=adjudication_accept)`, and the item is canonical.
   - **Return:** `reopen_task_item(cause=adjudication_return)`, and a new round starts.
   - **Reject:** the item becomes `unresolved`, a new terminal status. It counts as settled, is exported with no
     answer, and the owner can reopen it.

   The expert never writes their own answer.
7. **Record.** History, F1's events, and every dispute across rounds in the export. The item reads as contested.
8. **Release.**
   - It's refused while any dispute is open (SCRUM-105).
   - Unresolved items are listed in the manifest with no output (SCRUM-104 already says this).
   - The release output is the authoritative answer (SCRUM-37).

**Postures.**
- **Arbitration-ready:** only an independent expert settles a dispute, and nothing else takes an item out of dispute.
- **The other postures:** a dispute routed to `secondary_reviewer` may be settled by an independent reviewer. That
  gives the target field a meaning; today it means nothing.
- **Expert gate:** stays SCRUM-118. An expert's Accept counts as the confirmation.

## 2. Five calls I need you to agree

| Call | Why | Basis |
| --- | --- | --- |
| **The outcome is per item, the evidence per answer version** (option A on #40) | The dispute pins the versions and reviews that caused it, but the expert decides the item's answer. This is how Labelbox (choosing a consensus winner) and Prodigy (one final annotation per example) settle disagreement. Label Studio reviews each annotation and has no dispute record | R2-1, R2-2, R2-8; SCRUM-99; #47 |
| **Dual sign-off waits for every required review before any of them takes effect** | Since #45 the first return decides. If reviewer A returns first, reviewer B is never offered the submission, so a disagreement only exists when the accept came first | R2-8: "if those judgements disagree, the item enters dispute" |
| **Approved answers that differ open a dispute, under every posture** | Today two different approved answers finalise silently with no authoritative answer, and the export ships both (issue 4). Picking one by rule is "quietly defaulting". If the answers agree, the earliest submitted is marked | R2-1's Accept; G2 criterion 3 |
| **No decision until every required answer is in** | Accept, Return and Reject each cut off the annotators still working. Return also supersedes their drafts | Q4: N independent judgements |
| **`unresolved` is a terminal status** | #48's prototype mapped Reject to `rejected`, which strands the task forever, as your review pointed out | R2-1: "may be resolved as genuinely ambiguous/unresolved" |

**On #40: Yi's comment is the only option posted there.** Option A is on #48, in your comment, but Hunter hasn't seen
it on #40. §7 has a short comment for you (or me) to post. It asks him to confirm by Sun 11 Oct, after which we build
A, since he asked us to propose rather than wait.

## 3. New tickets (please create, assigned to me)

| # | Title | Sprint | Size | Why it isn't covered |
| --- | --- | --- | --- | --- |
| 1 | Dispute: Open a dispute in one step, record what it is about, and hold the item | **W9** | M | `api_surfaces.md` gives "one step" to SCRUM-107, but its rewritten text dropped it, and it's W11. SCRUM-52, 99 and 118 each say "one shared helper" without naming an owner. No ticket mentions the resubmission or PATCH holes |
| 2 | Dispute: Read a dispute and its evidence | W9–W10 | M | SCRUM-103 is the screens and SCRUM-99 the decision. Neither builds the backend reads the screens need |
| 3 | Dispute: Approved answers that differ open a dispute | W9–W10 | M | SCRUM-101 covers reviewers disagreeing on one submission, not annotators' answers differing |
| 4 | Review: Dual sign-off decides on the whole review panel | W9 | M | SCRUM-101 is written on #45's first-non-accept rule. It changes my ADR 007; it overlaps Parth's SCRUM-51, so either it's mine or it goes into SCRUM-51 |
| 5 | Dispute: An unresolved item settles its task and can be reopened | W9–W10 | S | SCRUM-99/100 create the outcome; nothing handles what follows. It extends my SCRUM-110 |
| 6 | Provenance: Export every dispute and decision on an item | W10 | S | The export keeps only the latest resolved escalation per item. Could go into SCRUM-100 instead |

**If that's too much alongside SCRUM-45, 68 and 103:** keep 1, 2 and 5. Ticket 1 starts the critical path, ticket 2
feeds SCRUM-103, and ticket 5 extends SCRUM-110. Ticket 4 could go to Parth and ticket 6 to Yi.

## 4. Existing tickets: what to change

| Ticket | Change |
| --- | --- |
| **SCRUM-37** (contradicts) | Its test "two approved submissions on one item export one authoritative answer and one superseded" holds only when the answers agree. If they differ, there's no authoritative answer until the dispute (ticket 3) |
| **SCRUM-105** (contradicts) | "Unreviewed = not export-eligible (canonicalized only)" would let one unresolved item block every release. `unresolved` should count as settled; SCRUM-104 already lists ambiguous items |
| SCRUM-99 (Yi) | Add: <ul><li>no outcome until every required answer is in;</li><li>drop the expert's payload override (`finalize` merges it into the item's source preview today);</li><li>`item_judge_ids_by_item` reads the new adjudication record, so the adjudicator still can't annotate after a Return;</li><li>build on ticket 1's record and helper</li></ul> |
| SCRUM-52 (Parth) | Add: waiting disputes are listed apart, with nothing to decide |
| SCRUM-101 (Yi) | Its definition of disagreement follows ticket 4 if you accept it |
| SCRUM-103 (me) | Widen to: <ul><li>escalate in one call from the work panel;</li><li>the item's Dispute section shows the real dispute (the placeholder text goes);</li><li>review buttons hidden on a disputed item;</li><li>an Unresolved filter and Reopen on the finalised desk;</li><li>the waiting state;</li><li>the majority answer pre-selected for the expert, who still decides</li></ul> |
| SCRUM-107 (me, if assigned) | Add: <ul><li>the escalation target says who may settle (a secondary reviewer only outside arbitration-ready);</li><li>label the organisation's unused dispute-gate settings as superseded;</li><li>drop "one step", which moves to ticket 1</li></ul> |
| SCRUM-32 (unassigned) | Three questions: <ul><li>does a reviewer's correction replace the original (story D3's wording) or sit beside it (the ticket and #47)?</li><li>who approves a correction? A reviewer fixing and accepting in one action would make their own answer canonical;</li><li>does a correction count when comparing answers (ticket 3)?</li></ul> |

## 5. Order, schema and the demo

- **Critical path:** ticket 1 (W9, by Sun 11 Oct) → SCRUM-99/100 (Yi, by Wed 14 Oct) → SCRUM-103 (W10) → demo.
  SCRUM-118/107 follow in W10–W11.
- **Demo minimum:** ticket 1, SCRUM-99/100, SCRUM-52 and SCRUM-103. That's the whole manual path: escalate, an
  independent expert, Accept, Return or Reject, the export.
- **Merge order on `review_actions.py`:** ticket 1, then SCRUM-99, then ticket 4 / SCRUM-101, with SCRUM-109 agreed
  alongside.
- **Schema:** ticket 1 adds columns to `task_item_escalations` and an evidence table; SCRUM-99 adds the adjudication
  table and the status. Agree the order on day one of W9 with SCRUM-98, 53, 32 and 87. PostgreSQL development
  databases need `init_data.py --reset`, and SQLite too this time (`routed_by` becomes nullable).
- **Casebook:** about 16 dispute cases for SCRUM-68/71 (split reviews, differing answers, Return then a second round,
  Reject then reopen, independence refusals, two experts at once).

## 6. Paste-ready descriptions

### New 1. Dispute: Open a dispute in one step, record what it is about, and hold the item

```text
Related to user story E3, G2 (and E1 criterion 2)

BACKEND ONLY. W9. Proposed for Jingwei.

Escalating is two calls today. The escalate review action (submit_task_item_review_action, app/api/routes/review_actions.py) sets the item disputed, and the web's second call, POST .../escalations/route, writes the escalation row. If the second call fails, or an API client skips it, the item stays disputed with no escalation: it is in no queue, and the decision returns 404. api_surfaces.md gives "one step" to SCRUM-107, which no longer lists it and is W11. The dispute also records nothing about which answers and reviews caused it. And two holes let a disputed item move under the expert: PATCH /tasks/{t}/task-items/{i} (MANAGE_TASK) can set it to pending while its escalation stays open (assert_task_item_status_update_allowed refuses workflow-owned targets but not pending), and nothing stops the author of a disputed answer resubmitting it.

# The escalate review action opens the dispute in its own transaction, under the item lock it already takes, and returns the dispute's id. The route call returns the caller's own open dispute (200) instead of refusing it, so today's web keeps working until SCRUM-103.
# A dispute records, when it opens: its trigger (a reviewer's escalation, a reviewer split, differing answers); who opened it (a person, or the platform for SCRUM-101's automatic disputes); the answer versions it is about; the item's other current answers; the reviews that caused it; and the resolved posture in force. These records are never edited. An answer submitted while the dispute is open is added to them.
# An item has at most one open dispute, held by the database as well as the route (409).
# While a dispute is open, under every posture: a status change through the PATCH is refused (409); the author of an answer in the dispute cannot resubmit it (409); another annotator's first answer is still accepted and joins the dispute.
# One independence helper decides who may settle a dispute: nobody who annotated or reviewed the item in any round, or opened the dispute; administrators included, no override (R2-8). SCRUM-52, 99 and 118 call it. It applies to today's decision route until SCRUM-99 replaces that route.
# Tests, each failing on the old behaviour: an escalate without the route call leaves an open dispute in the adjudication queue; a PATCH of a disputed item to pending is refused; the disputed answer's author cannot resubmit; the escalating reviewer who also holds arbitrator cannot decide; an administrator who annotated cannot decide; two escalations of one item at once leave one dispute (PostgreSQL).

Collaboration:
- SCRUM-99 (Yi): the decision builds on this record and helper; agree both on day one.
- SCRUM-52 (Parth): the queue uses the helper.
- SCRUM-101 (Yi): automatic disputes open through the same function.
- SCRUM-107: "one step" moves here.
- SCRUM-98, 53, 32, 87: one schema order in W9; development databases are reset.
```

### New 2. Dispute: Read a dispute and its evidence

```text
Related to user story E6, E3 (criterion 5), E1 (criteria 2-3)

BACKEND ONLY. W9-W10. Proposed for Jingwei. Feeds SCRUM-103.

The screens SCRUM-103 connects have no backend read for one dispute. GET /tasks/{task_id}/escalations lists open escalations with five fields. GET /projects/{project_id}/disputes (project_disputes_service.py) reports "severity" as the routing target, has no trigger, outcome or opener, and returns every note to any project member. Nothing reads one dispute with the answers and reviews it is about.

# GET /tasks/{task_id}/disputes and GET /projects/{project_id}/disputes list disputes with: the item, trigger, who opened it (person or platform), target, status, when it opened, outcome, when it was decided, and whether it is waiting for the item's remaining answers. Both filter by status; the project list can also show only the disputes the caller may decide.
# GET /disputes/{dispute_id} returns the dispute with its evidence: the item and its source preview; the versions it is about and the item's other current answers (author, role, content, when submitted); each version's reviews inside the dispute's window (verdict, justification, feedback); the item's earlier disputes; the adjudication, once decided; and whether the caller may decide it, with the reason if not.
# Evidence (answers, verdicts, justifications) is readable only by holders of ADJUDICATE or MANAGE_PROJECT, never by annotators (SCRUM-48's independence rule). The lists say that an item is in dispute, without the evidence.
# Tests: each list's fields on a seeded task; an annotator is refused the detail; the detail still shows exactly the recorded evidence after a later answer elsewhere on the item; a reviewer of the item sees that they may not decide, and why.

Collaboration:
- SCRUM-103 (Jingwei): the screens.
- SCRUM-99 (Yi): the adjudication's fields.
- New 1: the record this reads.
```

### New 3. Dispute: Approved answers that differ open a dispute

```text
Related to user story E1, H4, G2 (criterion 3)

BACKEND ONLY. W9-W10. Proposed for Jingwei; pairs with SCRUM-37.

On a task needing two or more annotators, each submission is reviewed on its own, and the item canonicalises once every one has its approvals (item_complete, submission_rules.py). Whether the answers agree is never compared. Two approved but different answers finalise the item with no authoritative answer, and the export ships both (issue 4). No rule can then pick one without quietly defaulting (G2 criterion 3). Client: "If those judgements disagree, the item enters dispute" (R2-8); Accept takes "one of the existing judgements as the resolved answer" (R2-1). SCRUM-101 covers reviewers disagreeing on one submission, not this.

# When an item's first pass is complete and every current submission is approved, its approved answers are compared by annotation type: the deciding fields for classification and judgement; the output fields for structured results (not rationale, confidence or notes); exact equality for spans, boxes and segments for now, a near-miss counting as different.
# If they differ, the item does not canonicalise: the platform opens a dispute about the differing answers (New 1's function), under every posture.
# If they agree, the item canonicalises and the earliest submitted answer is marked authoritative (mark_authoritative, cause canonical_rule), so a repeated export marks the same one. The others stay as agreeing versions. Agree this with SCRUM-37's owner, or take SCRUM-37 with this ticket.
# The comparison is recorded on the item, so reports can tell contested items from unanimous ones (SCRUM-100).
# Tests: two agreeing answers canonicalise with the earliest marked; two differing answers open one dispute and do not canonicalise; three answers with two agreeing still open a dispute (no majority vote); a single-annotator item is unchanged.

Collaboration:
- SCRUM-37 (H4): the marking rule and the export; its "two approved submissions" test applies to agreeing answers.
- SCRUM-101 (Yi): the other kind of disagreement.
- SCRUM-72 (I3): agreement measures, and tolerances for boxes and spans later.
```

### New 4. Review: Dual sign-off decides on the whole review panel

```text
Related to user story D7, E1

BACKEND ONLY. W9. Proposed for Jingwei (it changes review_refusal and ADR 007, from SCRUM-116); agree with Parth, or fold into SCRUM-51.

Since PR #45, the first return or reject decides a submission (review_refusal returns DECIDED). Under dual sign-off, if reviewer A returns first, reviewer B is never offered the submission, so a disagreement exists only when the accept happened to come first. SCRUM-101 is written on this rule. R2-8: "Two independent approvals are required... If those judgements disagree, the item enters dispute."

# Under a policy needing two or more approvals, and on a submission sampled for cross-review (SCRUM-51), a submission is offered to that many independent reviewers, each blind to the others' verdicts (SCRUM-51's first slice). No verdict takes effect until all have decided, unless one escalates.
# All accept: approved. All return or reject: back with its author, with every reviewer's feedback. Mixed: under open_dispute, a dispute opens (SCRUM-101); under manual_review, back with its author, and the disagreement is flagged.
# The review queue and the review action still read one rule (review_refusal). Single sign-off is unchanged.
# An ADR records what this changes in ADR 007.
# Tests: a split opens one dispute whichever reviewer goes first; unanimous returns send it back without a dispute; unanimous accepts approve; the second reviewer cannot read the first verdict before deciding.

Collaboration:
- SCRUM-51 (Parth): the blind read and the comparison.
- SCRUM-101 (Yi): its definition of disagreement follows this.
- SCRUM-109 (Parth): the same file; agree the merge order.
```

### New 5. Dispute: An unresolved item settles its task and can be reopened

```text
Related to user story E4 (criterion 4), D9, H3

BACKEND ONLY. W9-W10. Proposed for Jingwei (extends SCRUM-110).

SCRUM-99's Reject leaves the item unresolved, and SCRUM-100 records it, but nothing says what an unresolved item is afterwards. #48's prototype mapped Reject to rejected: not terminal, offered in no queue, and blocking task completion forever (a task completes only when every item is canonicalized). R2-1: "An item may be resolved as genuinely ambiguous/unresolved. The customer may later decide whether to exclude it."

# Add an unresolved item status, terminal like canonicalized: drafts, reviews and disputes on it are refused, with the finalised-item wording.
# A task completes when every item is canonicalized or unresolved.
# The project owner's reopen (SCRUM-110) accepts an unresolved item as it does a canonicalized one.
# A status change through the PATCH, to or from unresolved, is refused.
# Tests: a task with one unresolved item completes; the owner reopens an unresolved item into a new round; a draft on an unresolved item is refused.

Collaboration:
- SCRUM-99 (Yi): Reject sets the status.
- SCRUM-105 (H3): an unresolved item is not "unreviewed".
- SCRUM-104 (H2): already lists ambiguous items in the manifest.
- workflow_states.md gains UNRESOLVED.
```

### New 6. Provenance: Export every dispute and decision on an item

```text
Related to user story F1, E4 (criteria 2-3), H4

BACKEND ONLY. W10. Proposed for Jingwei, or fold into SCRUM-100 (Yi).

The normalized export carries only the latest resolved escalation per item (_latest_resolved_escalations_by_item, app/api/routes/tasks.py), so an item returned by an expert and disputed again loses its first dispute. R2-5 puts "disputes and expert/adjudication decisions" in each item's provenance; R2-2: "release provenance = complete judgement history".

# Each exported item carries every dispute, in every round: its trigger, who opened it and when, the versions and reviews it was about, and its adjudication (outcome, accepted version, reason, who, when).
# Each item carries its resolution (canonical, unresolved, in dispute or open), with the authoritative version and why it is authoritative.
# Each item says whether it was contested.
# Disputes decided before SCRUM-99 (finalize, send_back) still export, marked as legacy decisions.
# Tests: an item disputed, returned and disputed again exports both disputes; an unresolved item exports no authoritative value; a legacy decision still exports.

Collaboration:
- SCRUM-37 (H4): the authoritative value.
- SCRUM-100 (Yi): contested.
- SCRUM-104 (H2): the manifest.
```

## 7. A comment for #40 (for you or me to post)

> @hunterxu-gh, a second option for this question, so you can choose between the two. Yi's comment above sets out
> option B (a dispute is about one annotation, and differences between annotators are reconciled in a later stage).
> The tickets and #47 are currently built on option A:
>
> **A. The outcome is per item, the evidence is per annotation version.** When a dispute opens it records exactly which
> annotation versions and which reviews caused it, and the expert sees those first. The expert's decision is for the
> item, as R2-1 describes: Accept makes one of the item's current answers the resolved answer; Return reopens the item
> for new annotation and review; Reject closes the dispute without a winner and leaves the item unresolved, marked as
> such in the export, for the project owner to reopen if needed.
>
> The case that separates them: two annotators give different answers on one item, and each answer is approved by a
> reviewer. Under A this opens a dispute, and the expert's Accept picks the item's answer ("one of the existing
> judgements"). Under B it is not a dispute, and would need the reconciliation stage, which is not planned before the
> end of the project.
>
> For reference: Label Studio reviews each annotation (Accept, Fix & Accept, Reject) and keeps no dispute record.
> Tools that settle disagreement do it per item: Labelbox's consensus reviewer picks a winning label for the data row,
> and Prodigy's review produces one final annotation per example. A is the same split: review per annotation,
> adjudication per item.
>
> Three further points we would like you to confirm:
> 1. Under Dual sign-off, a submission collects both reviews before either takes effect, so a disagreement does not
>    depend on which reviewer happened to go first.
> 2. A dispute on an item that still needs answers from other annotators is decided only once all of them are in, so
>    nobody's independent judgement is cut off.
> 3. An item left unresolved by a Reject is listed in a release's manifest without an output, and the customer decides
>    whether to exclude it.
>
> Unless you prefer otherwise, we will build A from Monday 12 October.
