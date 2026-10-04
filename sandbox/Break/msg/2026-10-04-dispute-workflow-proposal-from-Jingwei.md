# Dispute workflow: full proposal

**Date:** 4 October 2026 · **By:** Jingwei Lin (drafted with Claude) · **Status:** proposal. Confirm decisions D1–D16,
then take it to Hanchen, Yi and Parth.
**Revised 04/10, same day:** D8 now holds *every* outcome, not only Accept, until each required answer is in. Jingwei's
point: a dispute on the first of three submissions must not settle the item while two annotators are still answering.
§0, §4.2, §7, §9.3, §12 and §14 follow.
**Checked again 04/10, after the discussion that followed:**
- D1 gains how other platforms handle it, and the "both kinds" alternative;
- D4 says why the earliest of several agreeing answers is marked, and that answer disagreement needs two or more
  annotators;
- D8 notes reviewer corrections;
- §9.3 pre-selects the majority answer;
- EV-D05, §14, §16 and Appendix A follow.
**Checked against:** `origin/main` @ `df7c05a` (#45, #46 and #47 merged); the Jira export of 04/10; the client Q&A doc
(re-read 04/10, unchanged since Round 2); issues #38 and #40; PR #48 at `fbbba0c` with Hanchen's combined review of
03/10; the story board (identical to `UserStory/` on 04/10); my phone conversation of 04/10, where it helps.
**Builds on:** [dispute workflow assessment, 28/09](../analysis/2026-09-28-dispute-workflow-assessment.md) (gaps
G1–G13) · [report for Yi, 02/10](../analysis/2026-10-02-yi-dispute-kickoff-issue-40.md) ·
[#48 review draft, 03/10](../review/2026-10-03-scrum-99-pr48-comment.md).
**Stories:** E1, E3, E4, E5, E6 and G2, with D7, D9, H3 and H4.
**Tickets:** SCRUM-99, 100 and 101 (Yi); 51 and 52 (Parth); 103 (me); 107 and 118 (the board says me, Jira says
unassigned); 37, 40 and 105 (unassigned); 98 (Hanchen).
**Companion:** [feature and commit breakdown](2026-10-04-dispute-workflow-feature-and-commit-breakdown.md).

---

## 0. In short

- **The gap.** On `main` a dispute is a status plus a two-button desk.
  - Nothing detects disagreement, and an escalation can be orphaned.
  - Anyone holding ADJUDICATE can decide, including someone who reviewed the item.
  - A decision records no chosen answer. Send-back strands the item, and Reject doesn't exist.
  - Export keeps only the latest decision, and the dispute and arbitration pages are `notFound()`.
- **The model: four records, which are the four entities `docs/` already names.**
  - A **disagreement** is detected.
  - A **dispute** is raised, by a reviewer or by the platform.
  - An **adjudication** decides it.
  - The item's **authoritative version** (#47) is the result.
- **Outcome per item, evidence per version** (option A on #40).
  - The dispute pins the exact versions and reviews that caused it.
  - The expert decides for the item:
    - **Accept** picks one current version as the resolved answer.
    - **Return** reopens the item through #46's `reopen_task_item`.
    - **Reject** closes it as **unresolved**: a new terminal status, exported as such, and the owner can reopen it.
  - **No outcome before every required answer is in.** A dispute opened on the first of three submissions waits,
    while the other two annotators keep annotating (D8).
- **Two review-side rules make disagreement real.**
  - **The review panel:** under dual sign-off, a submission collects all its blind reviews before any of them takes
    effect. Today the first return wins, so a split is only seen when the accept happened to come first.
  - **Answer disagreement:** two approved but different answers on one item open a dispute under every posture,
    because they can't both be the authoritative answer.
- **Independence is one helper**, used by the decision, the queue and the Expert Gate. Nobody adjudicates an item they
  annotated, reviewed or sent to dispute, in any round, administrators included.
- **The posture gets teeth.** Under arbitration-ready, only an independent expert settles a dispute, and nothing else
  takes an item out of dispute. Under the other postures, a dispute routed to a secondary reviewer may be settled by an
  independent reviewer.
- **Two holes to close first:**
  - escalating and routing are two calls, so a dispute can be orphaned;
  - a task owner's status PATCH can move a disputed item to `pending` while its dispute stays open.
- **Delivery:** nine slices over W9–W11. The critical path is:
  1. S1, open a dispute properly (W9);
  2. S2, decide it (SCRUM-99/100, W9);
  3. S6, the screens (SCRUM-103, W10);
  4. S7, the posture (SCRUM-118/107, W10–W11);
  5. the casebook (W11);
  6. the demo, mid-W12 (about Fri 30 Oct).
- **For the client:** #40 shows only Yi's option B. Option A is on #48, but it has never been posted on #40. A draft
  is in Appendix A. I recommend building A unless Hunter objects by the end of Sun 11 Oct.
- **For Hanchen:** owners for S1, S5 (answer disagreement with SCRUM-37), SCRUM-107 and SCRUM-118.

---

## 1. Why this matters

Adjudicate is one of the brief's six pillars, and the brief says what it's judged on: "the distinction between an
annotator's label, a reviewer's decision, and an adjudicated canonical judgment preserved rather than collapsed into
one 'final answer' field". The client's Round 2 principle goes further: "Disagreement is not merely an exception that
the workflow should eliminate. It is first-class, high-value data. Who disagreed, on what, why, under which
guideline/policy, and how the disagreement was resolved—or remained unresolved—should be preserved."

Two of the four postures are defined by what happens when agreement fails. Today nothing enforces either, and the demo
journey (annotate → review → dispute → arbitration → finalise → export) breaks in its middle.

---

## 2. What `main` does today (`df7c05a`)

### 2.1 The path

1. **Raise.** A reviewer presses *Escalate* in the work panel, with a justification. The web makes two calls:
   - the review action `escalate`, which writes a review (verdict `escalate`) and sets the item `disputed`;
   - `POST …/escalations/route`, which opens an escalation row. The web always sends target `secondary_reviewer`.
2. **Hold.** While an escalation is open, every review decision on the item is refused with 409 (#45), and the review
   queue skips the item.
3. **Find.**
   - The per-task adjudication queue checks only the role.
   - The task's Dispute desk lists open escalations.
   - The project's Disputes page is a table whose "severity" is just the target.
4. **Decide.** Anyone holding ADJUDICATE picks `finalize` or `send_back`, with an optional note.
   - `finalize` sets the item `canonicalized`, marks no answer, and merges any payload override into
     `task_items.payload_preview`.
   - `send_back` sets `expert_send_back`, which no queue offers to anyone.

### 2.2 Gaps: the 28/09 list, updated, plus what I found today

| # | Gap | On `df7c05a` | Closed by |
| --- | --- | --- | --- |
| G1 | An escalation that's never routed can't be decided (two calls, not atomic) | open | S1 |
| G2 | Nobody checks the adjudicator's independence (R2-8) | open | S1 (helper), S2 (decision), S3 (queue) |
| G3 | A dispute decision needs no reason (R2-4) | open | S2 |
| G4 | Escalation targets and the organisation's dispute gate mean nothing | open | S7 |
| G5 | Expert gate and arbitration-ready are recorded, not enforced | open | S7 (S4 and S5 for the automatic opening) |
| G6 | Only `finalize`/`send_back`; R2-1 wants Accept, Return and Reject | open | S2 |
| G7 | `send_back` strands the item | open | S2 (Return reopens through #46) |
| G8 | Resolving a dispute doesn't keep the disagreement as data | open | S2 (record), S4/S5 (disagreement rows) |
| G9 | Nothing detects disagreement | open | S4 (reviewer split), S5 (answer disagreement) |
| G10 | Self-review on the escalation paths | **routing half closed by #45**; deciding half open | S2 |
| G11 | The owner can't reopen a resolved item | **closed by #46** for `canonicalized` | S2 extends it to `unresolved` |
| G12 | The dispute and arbitration screens are stubs or mocks | open | S6 |
| G13 | Which answer a disputed item releases | #47 added the marker; nothing sets it | S2 (Accept marks it), S5 (SCRUM-37's rule) |
| **G14** | **Status PATCH bypass.** `PATCH /tasks/{t}/task-items/{i}` (MANAGE_TASK) refuses workflow-owned targets but not `pending`, and doesn't check for an open escalation. So a disputed item can be set to `pending` while its escalation stays open. Found by reading `assert_task_item_status_update_allowed`, not probed | **new** | S1 |
| **G15** | **A split sign-off depends on who reviewed first.** The first non-accept decides the submission (`review_refusal` → DECIDED). If reviewer A returns first, reviewer B is never offered it. A disagreement exists only when the accept came first. The second reviewer can also see the first verdict (SCRUM-51, slice 1) | **new** | S4 |
| **G16** | **Two approved, different answers canonicalise silently.** `item_complete` counts approvals only. No rule picks the authoritative answer, and export ships both (issue 4) | **new** | S5 |
| **G17** | Export carries only the latest resolved escalation per item (`_latest_resolved_escalations_by_item`). An item that was returned and disputed again loses the first dispute | **new** | S2 |
| **G18** | `finalize` merges the expert's payload into `task_items.payload_preview`, the *source* preview: an answer is written into source data | **new** | S2 (drop it) |
| **G19** | **The hold leaks.** The annotate queue skips only finalised items, so a disputed item that's short of submissions is still offered. That's fine for new annotators, but nothing in the draft path stops the author of a disputed version resubmitting it. Found by reading the code | **new** | S1 |
| **G20** | The project dispute list is cosmetic: no trigger, no outcome, no opener kind, and any project member reads every note | **new** | S2 (read), S6 (screen) |
| **G21** | The work panel's Dispute section says "Resolution details will appear here once the dispute process is implemented" | **new** | S6 |

---

## 3. Vocabulary

The client uses *judgement* for an annotator's answer (Q4: "3 independent human judgements") and for a reviewer's
decision (R2-8, dual sign-off: "if those judgements disagree"). This proposal says **answer** (an annotation version)
and **verdict** (a review decision), so the two can't be confused.

| Term | Meaning | Record |
| --- | --- | --- |
| **Disagreement** | A detected state: two judgements on an item conflict. **K1 reviewer split:** distinct reviewers' verdicts on one submission are mixed (an accept, and a return or reject). **K2 answer disagreement:** an item's approved submissions give different answers | `task_item_disagreements` (new); `docs/` calls it *Disagreement* |
| **Dispute** | A raised case about one item. It holds the item for adjudication, and its evidence is pinned when it opens | `task_item_escalations`, extended; `docs/` calls it *DisputeCase* |
| **Trigger** | Why the dispute opened. `reviewer_escalation` (**K3**): a reviewer judges a submission wrong in a way a return can't fix, or finds the guideline doesn't settle it. `reviewer_disagreement` (K1). `answer_disagreement` (K2) | on the dispute |
| **Subject** | The version or versions the dispute is about | evidence |
| **Candidate** | A current version the expert may Accept: the subjects plus the item's other current versions | evidence |
| **Triggering review** | A review that caused the dispute | evidence |
| **Adjudication** | The decision on a dispute: Accept, Return or Reject, with a reason | `task_item_adjudications` (new); `docs/` calls it *ArbitrationDecision* |
| **Authority** | Who settled it: `expert` (ADJUDICATE) or `secondary_reviewer` (S7) | on the adjudication |
| **Resolved answer** | The item's authoritative version | `annotations.is_authoritative` (#47); `docs/` calls it *CanonicalJudgment* |
| **Unresolved** | An item closed by Reject, with no authoritative answer | `task_items.status = 'unresolved'` (new) |
| **Contested** | An item that has had a disagreement or a dispute, in any round | derived (D16) |
| **Expert confirmation** | The Expert Gate's sign-off (SCRUM-118). Not a dispute, but it shares the independence helper and the screens | SCRUM-118's record |

---

## 4. The workflow, end to end

### 4.1 Overview

```text
 annotate: each answer is a version (#47)        review: each submission on its own
 item ──▶ submissions v1 … vN ─────────────────▶ panel of N blind reviews (D3)
                                                        │
        ┌───────────────────────────────────────────────┼─────────────────────────────┐
        │ all accept                                    │ mixed (K1)                  │ a reviewer escalates (K3)
        ▼                                               ▼                             ▼
 submission approved                           disagreement row                dispute opened (person)
        │                                     open_dispute ──▶ dispute opened (platform)
        │                                     manual_review ─▶ flagged; the non-accept applies (rework)
        ▼
 every submission approved ──▶ answers agree? ── yes ──▶ canonicalized; H4's rule marks one ──▶ export
                                     │ no (K2)
                                     ▼
                            disagreement row ──▶ dispute opened (platform), under every posture

 dispute open: item held ──▶ adjudication queue (independent experts only)
        ├─ Accept v_k ─▶ v_k authoritative, item canonicalized ──▶ export, contested
        ├─ Return ─────▶ reopen_task_item: round superseded, item pending ──▶ a new round
        └─ Reject ─────▶ item unresolved (terminal) ──▶ export marks it; the owner may reopen
```

### 4.2 Stage by stage

**1. Detect or raise.** A dispute has three ways in:

- **K3, manual escalation.** A reviewer (DISPUTE) escalates a submission the review queue offers them, under #45's
  rule, with a justification (R2-4). The target is optional and defaults to `expert`.
- **K1, the platform.** A submission's review panel completes with mixed verdicts, and the policy's
  `disagreement_handling` is `open_dispute`.
- **K2, the platform.** Every submission on the item is approved, but the answers differ.

These are not ways in:
- **Annotators** don't hold DISPUTE. The docs say a dispute "should not primarily be a self-service complaint button
  for the first annotator", and R2-3 parks requests to reopen.
- **The project owner** has no DISPUTE capability. They reopen finalised items instead (R2-3).

**2. Open.** One transaction, with the item locked:
- check the item isn't finalised and has no open dispute (a partial unique index backs this);
- write the dispute: trigger, opener (person or platform), target, and a snapshot of the posture in force;
- pin the evidence;
- set the item `disputed`;
- write a `dispute_opened` history row.

For K3, this is the same transaction as the escalate review (G1).

**3. Hold.** While the dispute is open:
- review decisions on the item are refused (#45, unchanged);
- the author of a current version may not resubmit it (409, new: G19);
- the status PATCH is refused (G14);
- the task can't complete.

First-pass annotation by other annotators continues while the first pass is incomplete, and each submission made
during the dispute is added as a candidate. Until every required answer is in, the dispute **waits**: it's on the
record and holds the item, but nobody can decide it (D8).

**4. Queue.** Experts self-serve; nobody is assigned (as decided for annotation on 17/09).
- Open disputes are listed per task and per project, oldest first.
- Each row shows the trigger and the age.
- A waiting dispute is listed apart, as "waiting for N of M answers", with no decision form. It joins the queue when
  the last required answer arrives.
- A caller sees only what the independence helper lets them decide (S3).
- Under a non-mandatory posture, a dispute routed to `secondary_reviewer` also appears to independent reviewers (S7).

**5. Adjudicate.** The expert opens the dispute view, chooses Accept (picking a candidate), Return or Reject, and gives
a reason of up to 2000 characters. The server then:
1. locks the item;
2. re-reads the dispute by its id, so a stale decision gets 409;
3. checks independence (403);
4. checks the outcome's preconditions;
5. writes the adjudication (one per dispute) and applies it.

**6. Apply.**
- **Accept:** `mark_authoritative(version, cause=adjudication_accept)` and the item becomes `canonicalized`.
  - The adjudicator is an independent expert, so this also satisfies the Expert Gate.
  - The other current versions stay as non-authoritative history.
- **Return:** `reopen_task_item(cause=adjudication_return)`.
  - The round is superseded, the marker cleared and the drafts superseded, and the item becomes `pending`.
  - Earlier annotators may answer again. Judges (its reviewers, the opener and the adjudicator) may not annotate it.
- **Reject:** the item becomes `unresolved`, with no marker. Nothing follows automatically.

**7. Record.**
- history rows;
- F1's events (SCRUM-98);
- the export lists every dispute with its evidence and decision, across rounds;
- the item reads as *contested*.

**8. Release.**
- H3 (SCRUM-105) refuses a release while any dispute is open.
- An unresolved item is listed in the manifest with no output; the customer decides what to do with it (R2-1).
- The release output is the authoritative version (H4).

### 4.3 Item status

| From | Event | To | Today |
| --- | --- | --- | --- |
| `annotated` / `returned` / `rejected` | escalate (K3) | `disputed`, with a dispute | `disputed`; the row exists only if the web's second call succeeds |
| `annotated` | panel completes mixed, `open_dispute` (K1) | `disputed` | not detected (G15) |
| `annotated`, all approved | answers differ (K2) | `disputed` | `canonicalized` (G16) |
| `disputed` | Accept | `canonicalized` | `finalize` → `canonicalized`, no answer chosen |
| `disputed` | Return | `pending`, round superseded | `send_back` → `expert_send_back`, stranded |
| `disputed` | Reject | **`unresolved`** (new, terminal) | — |
| `unresolved` | owner's reopen | `pending`, round superseded | — |
| `disputed` | status PATCH | refused, 409 | allowed to `pending` (G14) |
| `canonicalized` | escalate or route | refused, 409 | refused since #45 |

Mapping to `workflow_states.md`:
- `disputed` is the doc's DISPUTED/IN_ARBITRATION;
- `canonicalized` is FINALIZED;
- `pending` is READY;
- `unresolved` needs a new **UNRESOLVED**. The doc's CLOSED means "no further workflow" after FINALIZED, and reusing it
  for "no answer" would blur the two.

### 4.4 Dispute status

`open → resolved`, and the adjudication carries the outcome. The doc's other states stay unshipped, marked as future
the way the task's ARCHIVED is:
- **UNDER_DISCUSSION:** discussion threads are out of scope (§15).
- **ESCALATED:** every dispute goes straight to an adjudicator, so there's no separate step.
- **CLOSED:** a resolved dispute already takes no further change.

Legacy rows resolved with `finalize` or `send_back` stay readable (D15).

### 4.5 Worked examples

**(a) Dual sign-off, one annotator, the reviewers split (K1).**
1. Alice submits v1. Rita accepts it, blind. Sam returns it with feedback.
2. The panel is complete (2 of 2) and mixed, so the platform writes a disagreement row (K1: subject v1, Rita's accept,
   Sam's return) and opens a dispute (target `expert`). The item is `disputed`.
3. Eve, an independent arbitrator, sees v1 and both verdicts with their justifications, and Accepts v1 with a reason.
4. v1 becomes authoritative, the item `canonicalized`, and contested. The export carries v1 as the output, with both
   reviews and the adjudication in its provenance.

*Today:* Sam's return sends v1 back to Alice, and nothing records the disagreement. Had Sam reviewed first, Rita would
never have been offered it.

**(b) Two annotators disagree (K2), standard posture.**
1. `required_annotators = 2`. Alice answers "positive", Bob "negative", and Rita approves both (single sign-off).
2. Everything is approved, but the answers differ: a K2 dispute opens, with both answers as subjects.
3. Eve Accepts Bob's answer. It becomes authoritative; Alice's stays as a non-authoritative version.

*Today:* the item is `canonicalized` with no authoritative answer, and the export ships both (issue 4).

**(c) A confidently wrong AI first pass, a Return, and a second round.**
1. AI-assisted task. The AI answers "positive" at 0.97 confidence.
2. Rita escalates: "sarcastic; guideline 1.2 doesn't cover sarcasm" (K3).
3. Eve Returns: "re-annotate with the sarcasm note added to the guideline".
4. The reopen supersedes the AI's answer, and the item is `pending` and offered to annotators. The AI isn't rerun (#46's
   rule; #38 is still open with the client).
5. Carl annotates round 2, and a reviewer other than Carl approves it.
6. The item is canonical, contested, and its export shows both rounds.

**(d) A genuinely ambiguous item: Reject, then a reopen later.**
1. Eve Rejects: "the text supports both labels, and the guideline doesn't settle it".
2. The item is `unresolved`. Its export says so, with no output, and keeps both answers and every reason in its
   provenance.
3. The task can still complete, and a release lists the item as unresolved.
4. Weeks later the owner issues guideline 1.3 and reopens the item with a reason. It's `pending` again, for a new round.

---

## 5. Decisions

### D1. Scope: outcome per item, evidence per version

**Recommend option A** (as on #48, and in my report for Yi).
- The dispute pins the subject versions and triggering reviews.
- The desk shows those first.
- The expert decides for the item.

**Basis.**
- R2-1: Accept takes "one of the existing judgements as the resolved answer", and Return sends back "the item".
- R2-8: "the item enters dispute".
- R2-2: one authoritative resolution per item.
- SCRUM-99's text, and #47's contract.

**Option B** (Yi's #40 comment and #48) disputes one annotation, and reconciles candidates later.
- K2 has nowhere to go: the reconciliation stage has no ticket before 1 Nov.
- It contradicts R2-8 for dual sign-off.

**If Hunter picks B anyway:** the evidence table already stores subjects separately (D6), so Accept narrows to the
subjects and Return to their authors. That's a rule change, not a schema change.

**How other platforms do it** (checked 04/10). They split the question in two:
- **"Is this person's work acceptable?" is per annotation.** That's review. Label Studio Enterprise offers Accept,
  Fix & Accept or Reject on each annotation. Per-annotation disputes appear only where the annotation is paid work: a
  Toloka worker can appeal a rejected task within 7 days.
- **"What is the item's answer?" is per item.** Wherever disagreement is settled, it's settled here:
  - Labelbox's consensus reviewer chooses a winner label for the data row;
  - Prodigy's `review` recipe has one adjudicator make a single final annotation per example;
  - SageMaker Ground Truth consolidates workers' annotations into one label per data object.

HEJ already has the per-annotation level (review per submission, #45). Paid-work appeals are the marketplace
extension AGENTS.md defers. The dispute is the per-item level.

Sources:
[Label Studio quality](https://docs.humansignal.com/guide/quality) ·
[Labelbox release notes](https://docs.labelbox.com/changelog#september-2-2025) ·
[Prodigy review](https://prodi.gy/docs/review) ·
[Ground Truth consolidation](https://docs.aws.amazon.com/sagemaker/latest/dg/sms-annotation-consolidation.html) ·
[Toloka terms](https://toloka.ai/tolokers/legal/terms).

**Considered and not recommended: both kinds**, an annotation dispute and an item dispute as separate workflows.
- R2-8 sends a reviewer split, exactly where an annotation dispute would come from, to "the item".
- Accept, Return and Reject would each mean two different things.
- The expert could have to decide the same item twice.
- It roughly doubles S2, the critical path.

The annotation level survives as data: the trigger, the pinned subject version, and the submission's own escalated
review state. If the client picks B, or per-annotator accountability arrives with the marketplace, add a `scope` to
the same dispute record rather than a second status machine.

**Action:**
- Post A on #40 (Appendix A), since #40 currently carries only B.
- Build A if there's no objection by the end of Sun 11 Oct. The client asked us to "make a concrete proposal … you do
  not need to wait for me".

### D2. What opens a dispute

- **K3, manual escalation:** always available to reviewers. Under Standard, "disputes may still be escalated to an
  expert when needed" (R2-8).
- **K1, reviewer split:** the platform opens a dispute under `open_dispute`. Under `manual_review`, it only flags the
  disagreement, and the non-accept applies.
- **K2, answer disagreement:** the platform opens a dispute under every posture (D4).
- **Annotators contesting a verdict: no.** The docs (`task-schema-and-policy.md` §7, `task-dispute.pr.md`) say the
  same, and R2-3 parks requests to reopen. Revisit after the demo as a reopen request (R2-3).

`disagreement_handling` therefore governs K1 only. Say so in the terminology docs.

### D3. Dual sign-off decides on the whole review panel

**Options.**
1. **Keep #45's rule.** The first non-accept decides, and SCRUM-101 can only catch an accept followed by a non-accept.
2. **A review panel.** A submission that needs N ≥ 2 approvals is offered to N independent reviewers, each blind to
   the others (SCRUM-51, slice 1). Nothing applies until all N have decided, unless someone escalates.

**Recommend option 2.** R2-8 says "Two independent approvals are required … If those judgements disagree, the item
enters dispute." A rule where the order of reviews decides whether a disagreement exists can't claim that. The phone
conversation reached the same rule independently: follow unanimous decisions, and dispute only a split.

| Panel state (N required) | `review_refusal` for an uninvolved reviewer | Submission |
| --- | --- | --- |
| fewer than N reviews, none escalate | `None`: offered | awaiting review |
| a reviewer escalates | DECIDED | dispute opened (K3) |
| N reviews, all accept | FULLY_APPROVED | approved |
| N reviews, all return or reject | DECIDED | back with its author, with every reviewer's feedback |
| N reviews, at least one accept and at least one return or reject | DECIDED | `open_dispute`: dispute (K1); `manual_review`: back with its author, flagged |

- Single sign-off (N = 1) is unchanged.
- A sampled cross-review (SCRUM-51, slice 2) is a panel of two on that submission.
- The queue and the action still read one rule (ADR 007's point).

**Cost.**
- The author waits for the second review even when the first found an obvious slip.
- `review_refusal` changes (ADR 007, mine): a non-accept no longer decides until the panel completes.
- It needs a new ADR that supersedes that part of 007.

**Owner.** SCRUM-51 (Parth) owns the rule and the comparison; SCRUM-101 (Yi) opens the dispute.

**Fallback if W9 can't fit it:** keep option 1. Record the asymmetry as a known limitation, and keep a casebook case
that shows it.

### D4. Answer disagreement opens a dispute, under every posture

**The rule.** Suppose `item_complete` holds (the first pass is done and every current submission is approved) and the
item has two or more approved submissions.
- **The answers differ:** the item doesn't canonicalise. The platform opens a dispute (K2) with the differing
  submissions as subjects.
- **They agree:** there's no dispute. H4's `canonical_rule` marks the **earliest submitted** (submission time, then
  id: the order the API already lists answers in). The platform is recorded as the marker.
  - The answers are equal on what counts, so the choice only decides whose rationale and confidence go with the
    output.
  - It must be deterministic, so an export or release can be reproduced.
  - Unlike "the last one approved", it doesn't depend on reviewer timing.
  - The other answers stay as agreeing versions with their reviews. The item isn't contested, and its agreement (for
    example 3 of 3) is data for SCRUM-72.

K2 applies only where a task requires two or more annotators. `required_annotators` defaults to 1. The client's Q4
answer made several annotators a task setting ("if an item requires 3 independent annotations"), not a rule. A single
approved answer, human or a reviewed AI first pass, is simply the one marked.

**Why under every posture.**
- Unlike K1, no review rule settles K2. Two approved answers can't both be the authoritative one (R2-2).
- Picking one of several *differing* answers by rule is the "quietly defaulting" that G2's criterion 3 forbids.
- R2-1's Accept, "one of the existing judgements", is exactly this decision.

**Rejected alternatives.**
- *Majority vote:* needs three or more answers, hides the minority, and names no authority. The client asked us to
  preserve "the authority structure through which it was resolved". What we keep from it, as Prodigy does: the
  dispute view pre-selects the majority answer, and a person still decides (§9.3).
- *Merging answers:* produces an answer nobody gave.
- *Exporting all of them:* issue 4.
- *B's candidate reconciliation:* no ticket.

**The comparator**, `answers_agree(task, annotations)`, in `submission_rules.py`:
- `classification`, `judgement`: the decisive fields (label, labels or verdict), normalised.
- `structured_result`: canonical JSON of the output fields, ignoring rationale, notes, confidence and metadata.
- `text_spans`, `image_bbox`, audio and video segments: exact equality of (label, extent) sets in v1. Near-misses
  count as disagreement. Overlap and IoU tolerances come later, with SCRUM-72's agreement measures.
- **When in doubt, disagree.** A false positive costs an expert's look; a false negative is a silent pick.

**Owner.** It goes with SCRUM-37 (H4, unassigned, W9), because H4's rule needs it. Ask Hanchen whether that's one
ticket or two.

### D5. One dispute record: extend `task_item_escalations`

**Recommend extending the existing table** over adding a new `disputes` one. The queues, #45's hold rule,
`item_judge_ids`, the export, the history and the project list already read it. A new table means migrating every
reader, in files three people are editing this week.

- Call it *dispute* in the API, the UI and the docs. The docs map DisputeCase to `task_item_escalations`.
- `routed_by` becomes nullable, for the platform.
- Development databases need a reset: PostgreSQL as always, and SQLite too, since SQLite can't relax NOT NULL in place.
- Fields: §6.1.

### D6. The evidence is pinned when the dispute opens

`task_item_dispute_evidence` is append-only: rows are added, never edited.

| Role | K3 | K1 | K2 |
| --- | --- | --- | --- |
| subject | the escalated version | the split version | the differing approved versions |
| candidate | every other current version of the item when it opens: human, AI, and a reviewer's correction once SCRUM-32 lands | same | same |
| triggering review | the escalate review | the panel's reviews | the subjects' approvals |

- A review counts as evidence inside #48's window: `version.submitted_at ≤ review.created_at ≤ dispute.opened_at`.
- A first-pass submission made while the dispute is open is added as a candidate, with its own `added_at`.

**Why.** Pinning is the strongest part of Yi's design, and R2-5 puts disputes in each item's provenance. The record
then says exactly what the expert was shown, even after later versions appear.

### D7. The adjudication is its own record, final, one per dispute

- `task_item_adjudications`, with a unique `dispute_id`: the database backs finality.
- It records the outcome, the accepted version, the reason, the decider, the authority, the time and, for a Return,
  the reopen.
- The dispute row gets `status = resolved` and `closed_at`. New rows never write the legacy decision columns.

Basis: SCRUM-99, criterion 1.

### D8. When a dispute can be decided, and the three outcomes

**No outcome until every required answer is in** (revised 04/10). A dispute is *ready* once the item's first pass is
complete: `required_annotators` people have submitted, or the AI has on an AI-assisted task. Until then it *waits*,
and all three outcomes are refused with 409, naming how many answers are missing.

- **Why all three, not only Accept.** Each would take the item away from people the task says should judge it (client
  Q4: N independent judgements):
  - Accept would settle the item without them.
  - Return would supersede the drafts they're writing: `reopen_task_item` retires the round's drafts.
  - Reject would make the item terminal, so they could never submit.
- **While it waits:**
  - the other annotators keep annotating, and each new answer joins the dispute as a candidate (D6);
  - review stays held for the whole item (#45), so these answers reach the expert unreviewed. The expert's decision
    is the higher authority.
- **The alternative:** also wait until each of those answers has finished its ordinary review. That's fairer to the
  answers, but:
  - the dispute could wait through review and rework cycles;
  - #45's hold would have to narrow to the disputed submission while it waits.

  Not recommended for the time left; the option stays open.
- **Not covered:** an item that can't be annotated at all, such as a broken source. The other annotators still spend
  time on it before the expert can Reject it. It's rare, and excluding an item would be a separate feature.

**Accept.**
- `accepted_annotation_id` must be a candidate and still current.
- It marks the version authoritative, and the item becomes `canonicalized`.
- An AI version may be accepted. The expert's Accept is a human review; R2-7 rules out *unreviewed* AI output.
- **The expert doesn't author a new answer.** R2-1 offers Return for when no answer is satisfactory.
  - An answer the expert wrote would also become the item's answer with nobody independent reviewing it.
  - The payload override goes (G18).
  - A *reviewer* may correct an answer: a new version authored by the reviewer, beside the original (SCRUM-32, D3;
    decided 15/09). That correction is a candidate the expert can Accept.

**Return.** A reason, then `reopen_task_item(cause=adjudication_return)`.

**Reject.** A reason; the item becomes `unresolved`, with no marker.

**Every outcome.** The reason is required and at most 2000 characters (422 otherwise). It goes into `new_values`, and
the history description is a short fixed text. The reason is not the description (the 255-character lesson from #46
and the upload bug).

### D9. Independence: one helper

`adjudication_refusal(db, item, dispute, caller_id) -> Refusal | None` sits next to `review_refusal` in
`submission_rules.py`. It refuses (403, in #45's wording) anyone who, in any round:
- annotated the item (`item_author_ids`);
- reviewed it (any review, a correction included);
- or opened the dispute.

There's no administrator override. An earlier adjudicator of the item may decide again: a ruling isn't their own work.

**Used by:**
- the decision (403);
- the queue (filter);
- the Expert Gate's confirmation (SCRUM-118);
- a secondary reviewer's settlement (S7).

`item_judge_ids_by_item` also learns to read the adjudication table, so an adjudicator stays barred from annotating the
reopened item.

It lands in S1, so S2, S3 and SCRUM-118 all consume one function. That settles who owns it, the question the 30/09
tickets left open.

### D10. Who may settle a dispute: the target

| Target | Who settles it | When |
| --- | --- | --- |
| `expert` | ADJUDICATE holders, and the helper must accept them | always |
| `secondary_reviewer` | also REVIEW holders the helper accepts (S7) | only where `adjudication_mandatory_on_dispute` is false |

- **Under arbitration-ready**, routing to `secondary_reviewer` is refused (422), and automatic disputes always target
  `expert`.
- The adjudication records its authority.

**Why.**
- It gives G4's `target` a meaning.
- It gives arbitration-ready a difference beyond `open_dispute`. R2-8: "if a dispute occurs, it must reach
  independent adjudication".
- Until S7 lands, every dispute is decided under ADJUDICATE, as today, and the web sends `expert`.

**Related, low priority (S7).** Retire the organisation's `dispute_escalation_gate`, threshold and auto-escalate flag.
They're never read, and the project's posture fields supersede them. Keep them stored, and label them superseded on
the organisation policy screen.

### D11. No other way out

- **G14: refuse the status PATCH on an item with an open dispute (409), and to or from `unresolved`, under every
  posture.** It isn't a posture rule; it's a hole that leaves a dispute open on a `pending` item.
- **Withdraw: considered, and deferred.** Letting the owner withdraw a dispute would make "may reach an expert"
  literal. But review state would have to ignore the withdrawn escalation, and a withdrawn K2 dispute has no sensible
  item state. D10's secondary reviewer gives the non-mandatory postures their difference more cheaply.

### D12. Opening is atomic, and the route call stays compatible

**The escalate action** opens the dispute in its own transaction (G1).
- It returns `dispute_id`.
- It accepts an optional `escalation_target`.

**`POST …/escalations/route`:**
- If the item's open dispute was opened by the caller, it returns 200 with that dispute and changes nothing. Today's
  web, which calls it second, keeps working.
- Otherwise it opens a dispute as today, now with evidence and the item lock (it doesn't lock today).

SCRUM-103 stops the web calling it, and it's deprecated after the demo.

### D13. Unresolved is a terminal outcome

`TaskItemStatus.UNRESOLVED`:
- **Terminal**, like `canonicalized`: drafts, reviews and disputes are refused.
- **Task completion counts it as settled.** Split `ITEM_SETTLED_STATUSES = {canonicalized, unresolved}` (completion)
  from `EXPORT_ELIGIBLE_TASK_ITEM_STATUSES`.
- **The owner's reopen accepts it.** #46's route checks for `canonicalized` today.
- **Export** lists it with `resolution.status = unresolved` and no output.
- **Release** lists it in the manifest with no output; the customer decides.

**Why.**
- R2-1: "An item may be resolved as genuinely ambiguous/unresolved. The customer may later decide whether to exclude
  it."
- #48's prototype mapped Reject to `rejected`, which strands the task (Hanchen's review, point 2).

### D14. Who sees what

| What | Who |
| --- | --- |
| That an item is in dispute, the trigger, the age, the outcome | any project member (the item status shows it anyway) |
| The evidence: answers, verdicts, justifications | ADJUDICATE or MANAGE_PROJECT holders |
| The decision form | callers the helper accepts; everyone else sees why not |

- Annotators never see the evidence: that's the SCRUM-48 independence rule.
- Reviewers read their own work through the work panel, under #45's and SCRUM-51's rules, not through this read.

### D15. Legacy data and vocabulary

**Old rows** keep `finalize`/`send_back` on the escalation row. One reader helper normalises them: `finalize` reads as
an Accept with no chosen version, `send_back` as a Return.

**`expert_send_back`** gets no new writes. The repair helpers stay for legacy rows until after the demo.

**`POST …/escalations/decision`** keeps working until SCRUM-103 switches the desk, then returns 410:
- `finalize` maps to Accept when there's exactly one candidate. Otherwise 409, naming `accepted_annotation_id`.
- `send_back` maps to Return, with the reason required.

This answers point 7 of the #48 review.

### D16. "Contested" is readable

An item is contested if it has a disagreement row or a dispute, in any round. It's exposed on item reads, in the
export and in reports (SCRUM-100, criterion 3; SCRUM-72 and 104).

The adjudication records also feed evaluation:
- each reviewer's overturn rate: an Accept against their verdict, or a Return after their accept;
- the dispute rate per task;
- the time to a decision.

---

## 6. Data model

### 6.1 `task_item_escalations`, the dispute (extended)

| Column | Change | Note |
| --- | --- | --- |
| `routed_by` | now **nullable** | NULL exactly when the platform opened it |
| `opened_by_kind` | new, `String(20)`, not null, default `person` | `person` or `platform`, using F4's actor kinds |
| `trigger` | new, `String(30)`, not null, default `reviewer_escalation` | `reviewer_escalation`, `reviewer_disagreement`, `answer_disagreement` |
| `opening_review_id` | new, FK `reviews`, nullable | the escalate review (K3), or the review that completed a split panel (K1) |
| `disagreement_id` | new, FK `task_item_disagreements`, nullable | K1 and K2 |
| `policy_snapshot` | new, JSON, nullable | the resolved posture when it opened: governance model, approvals, disagreement handling, the two posture fields, `review_policy_ref`. Until SCRUM-53 versions policies |
| `closed_at` | new, `UtcDateTime`, nullable | set together with `status = resolved` |
| `decision`, `decision_note`, `decided_by`, `decided_at`, `payload_preview_snap` | unchanged, **legacy** | new decisions don't write them |

- **Index:** unique on `task_item_id` where `status = 'open'`: at most one open dispute per item, in both dialects, as
  #47's authoritative index does.
- **Check:** `opened_by_kind = 'platform'` exactly when `routed_by IS NULL`.

### 6.2 `task_item_dispute_evidence` (new)

- **Columns:** `id`; `dispute_id` (FK); `annotation_id` (FK, nullable); `review_id` (FK, nullable); `role`
  (`subject`, `candidate`, `triggering_review`); `added_at`.
- **Unique:** (`dispute_id`, `role`, `annotation_id`, `review_id`).
- **Check:** a version role names an annotation; `triggering_review` names a review.
- Append-only.

### 6.3 `task_item_adjudications` (new)

- **Columns:**
  - `id`; `dispute_id` (FK, **unique**); `task_item_id`; `task_id`;
  - `outcome` (`accept`, `return`, `reject`);
  - `accepted_annotation_id` (FK, nullable); `reason` (`String(2000)`, not null);
  - `decided_by` (FK users, not null); `authority` (`expert` or `secondary_reviewer`, default `expert`);
  - `reopen_id` (FK `task_item_reopens`, nullable); `decided_at`.
- **Checks:** `accept` exactly when `accepted_annotation_id` is set; `return` exactly when `reopen_id` is set.
- Never edited or deleted.

### 6.4 `task_item_disagreements` (new; S4 and S5)

- **Columns:**
  - `id`; `task_item_id`; `task_id`;
  - `kind` (`reviewer_disagreement`, `answer_disagreement`);
  - `annotation_id` (K1's subject, nullable);
  - `detail` (JSON: the review ids and verdicts, or the differing annotation ids and the values compared);
  - `handling` (`open_dispute` or `flagged`); `dispute_id` (FK, nullable); `detected_at`.
- Append-only. It's the `disagreements` table family `db_schema_blueprint.md` already lists.

### 6.5 Existing tables

- `task_items.status` gains `unresolved`.
- `annotations`: unchanged. Accept uses #47's `adjudication_accept`, and SCRUM-118 adds `expert_confirmation` to
  `AUTHORITATIVE_CAUSES`.
- `task_item_reopens`: unchanged; `adjudication_return` already exists.
- `reviews`: unchanged.

### 6.6 Migration

There's no Alembic.
- **PostgreSQL** development databases need `init_data.py --reset`.
- **SQLite:** `migrate_db_schema()` adds the new columns, but `routed_by`'s NOT NULL needs a reset too.
- **Order:** after #47 (done), and agreed on day one of W9 with the other W9 schema changes (SCRUM-98, 53, 32 and 87).
  SCRUM-98's own text asks for this.

---

## 7. API

Disputes become a resource of their own, addressed by id. That's what `api_surfaces.md` already lists as
`dispute_cases`, and it's what lets `/disputes/[id]` be built. The lists stay scoped to a task or a project.

| Method and path | Who | Body | Result | Refusals | Slice |
| --- | --- | --- | --- | --- | --- |
| `POST /tasks/{t}/task-items/{i}/review-actions`, `action=escalate` | DISPUTE | adds `escalation_target?` | the review **and** the dispute; the response adds `dispute_id` | 403 author or not independent; 409 finalised, not offered, or already in dispute; 422 no justification, or `secondary_reviewer` under arbitration-ready (S7) | S1 |
| `POST /tasks/{t}/task-items/{i}/escalations/route` | DISPUTE | `{target, note, annotation_id?}` | 200 with the caller's own open dispute; otherwise opens one | as today; it now locks | S1 |
| `GET /tasks/{t}/disputes?status=open\|resolved\|all` | task access | — | rows: id, item, trigger, opener kind and name, target, status, opened, outcome, decided, `awaiting_submissions` | 403 | S2 |
| `GET /projects/{p}/disputes?status=&awaiting=me` | project access | — | the same rows across tasks; `awaiting=me` applies the helper | 403 | S2 |
| `GET /disputes/{d}` | ADJUDICATE or MANAGE_PROJECT | — | the item, its source preview, trigger, opener, posture snapshot; subjects and candidates (version, author, role, payload, `submitted_at`, reviews in the window); triggering reviews; the item's earlier disputes; the adjudication; `can_decide`, and the refusal if not | 403, 404 | S2 |
| `POST /disputes/{d}/adjudication` | ADJUDICATE (S7: or REVIEW, for a `secondary_reviewer` target) | `{outcome, accepted_annotation_id?, reason}` | the adjudication, the item's status, the reopen id | 403 not independent; 404; 409 already resolved, still waiting for answers (D8), not current, or task not active; 422 reason missing or too long, Accept without a version, or a version that's not a candidate | S2 |
| `POST /tasks/{t}/task-items/{i}/escalations/decision` | ADJUDICATE | legacy | mapped as in D15 | — | S2; 410 in S6 |
| `GET /tasks/{t}/work-queue/adjudicate` | ADJUDICATE | — | filtered by the helper | 403 | S3 |
| `POST /tasks/{t}/task-items/{i}/reopen` | MANAGE_PROJECT | `{reason}` | also from `unresolved` | as today | S2 |
| `PATCH /tasks/{t}/task-items/{i}` | MANAGE_TASK | `{status}` | — | 409 if a dispute is open, or to or from `unresolved` | S1 |
| `GET /tasks/{t}/export-annotations` | as today | — | per item: `resolution`, `contested`, `disagreements[]`, `disputes[]` | — | S2 (S5 adds K2) |

---

## 8. Rules by posture

| | Standard | Dual sign-off | Expert gate | Arbitration-ready |
| --- | --- | --- | --- | --- |
| Approvals per submission | 1 | 2 | 1 | 2 |
| Review panel (D3) | only on a sampled cross-review | yes | only on a sampled cross-review | yes |
| Reviewer split (K1) | on a sampled cross-review, by `disagreement_handling` | dispute (preset `open_dispute`) | as Standard | dispute, always (`open_dispute` is required, ADR 001) |
| Answer disagreement (K2) | dispute | dispute | dispute | dispute |
| Manual escalation (K3) | yes | yes | yes | yes |
| Who settles a dispute | an independent expert, or an independent secondary reviewer if routed so (S7) | same | same | **an independent expert only** |
| Before canonical | the approvals | the approvals | the approvals **and** an expert's confirmation (SCRUM-118); an Accept counts as the confirmation | the approvals |
| Other ways out of a dispute | none: the status PATCH is refused under every posture | none | none | none |
| AI output alone becomes canonical | never | never | never | never (SCRUM-118's invariant) |

---

## 9. Screens

All built from `packages/ui` primitives (card, badge, tabs, table, sheet, textarea, button, select). There's no dialog
primitive, so the confirm step is inline, or adds the shadcn Dialog to `packages/ui`: a real gap, which AGENTS.md
allows.

**9.1 Reviewer work panel** (`task-item-workspace-sheet.tsx`). S6, with S7 for the target.
- **Escalate** becomes one call, with a required justification and a target choice: expert or secondary reviewer, and
  the choice is hidden under arbitration-ready. Afterwards the panel shows "In dispute — awaiting adjudication", with a
  link.
- The **Dispute section** replaces its placeholder (G21) with the trigger, when it opened, its status, the outcome and
  a link.
- **Review actions are hidden** on a disputed item (Hanchen's note on #45).

**9.2 Task Dispute desk** (`/tasks/[taskId]/dispute`). S6.
- The task's disputes, open first and then resolved, with filters by trigger and status.
- Badges for opened by the platform, awaiting submissions, and contested.
- Each row opens the dispute view. The inline finalize/send_back form goes.

**9.3 Dispute view** (`/disputes/[disputeId]`, built). S6.
- **Header:** the item, task and project; the trigger; who opened it (person or platform) and when; the posture in
  force; the status.
- **Evidence:**
  - the source preview;
  - the subject versions side by side, each with its author, role and version;
  - each version's reviews (verdict, justification, feedback);
  - the other candidates, collapsed;
  - the item's earlier disputes;
  - a link to the item's timeline (SCRUM-106);
  - a diff against a version's earlier versions, which is nice to have.
- **Decision panel**, shown when `can_decide`:
  - the outcome: Accept, Return or Reject;
  - a candidate picker for Accept, with the majority answer pre-selected when there is one (D4); the expert still
    decides and gives the reason;
  - a reason box with a 2000-character counter;
  - one line on each outcome's consequence, and a confirm step.
- **While the dispute waits:** the decision panel is replaced by "waiting for N of M answers" (D8).
- **After a decision:** a read-only adjudication card.
- **When the caller may not decide:** the API's reason.

**9.4 `/arbitration/[arbitrationId]`: deleted**, and SCRUM-103 asks to record why.
- An adjudication has no life before its decision, and a second URL for one case splits the expert's context.
- The decision panel lives on the dispute view and reuses `arbitration-decision-panel.tsx`'s layout.
- `dispute-case-board.tsx` is unused too: reuse it for the project board, or delete it.

**9.5 Project Disputes** (`/projects/[projectId]/disputes`). S6.
- A real table: item, task, trigger, opened by, status, outcome, age.
- An "awaiting my decision" filter.
- The fake severity column goes.

**9.6 Finalised desk.** S6.
- An Unresolved filter.
- Reopen for the owner, on canonicalised and unresolved items alike.
- Fix "use the `finalize` decision" (`task-finalized-desk.tsx:147`).

**9.7 Expert Gate confirmation** (SCRUM-107, built on SCRUM-118). S7. The dispute view's layout: the answer to confirm
and its reviews, with Confirm or Return.

**9.8 Posture visibility** (SCRUM-107). S7. A badge on the project overview and on each item. Under arbitration-ready
it reads "disputes are settled by an independent expert only".

**`/exports/[id]`** is also in SCRUM-103's list, but it's a release page (H6, SCRUM-108), not a dispute screen.

---

## 10. Provenance, history, export and release

**History** (audit log, `TaskHistoryRecorder`):
- `dispute_opened`: the trigger, target, subjects, triggering reviews and note, all in `new_values`.
- `dispute_adjudicated`: the outcome, the accepted version, the authority and the reason.
- `item_reopened`, which exists, with cause `adjudication_return`.
- `disagreement_detected`, whether flagged or opened.

**Coordination point:** `audit_logs.operator_id` is NOT NULL, so a platform-opened dispute can't record "no person".
That's SCRUM-40's actor kinds (F4, W9): agree a nullable operator plus an actor kind before S4. Until then, record the
reviewer whose review completed the panel as the operator, with `actor_kind: platform` in `new_values`, and say so
in the PR.

**F1 events** (SCRUM-98, Hanchen, W9): the `disputed` and `adjudicated` kinds, written at the same points.

**Export** (`normalized_json`), per item:

```text
resolution:    { status: canonical | unresolved | in_dispute | open_work,
                 authoritative_annotation_id, cause, decided_by, decided_at }
contested:     bool
disagreements: [ { kind, detected_at, handling, detail } ]
disputes:      [ { id, trigger, opened_by { kind, user }, opened_at, target, policy_snapshot,
                   subjects[], candidates[], triggering_reviews[],
                   adjudication { outcome, accepted_annotation_id, reason, decided_by, authority,
                                  decided_at, reopen_id }   # or legacy_decision for old rows
               } ]   # every round, not the latest only (G17)
```

**Release** (SCRUM-102, 104 and 105):
- refuse a release while a dispute is open (already in SCRUM-105's text);
- list unresolved items in the manifest with no output, by default, and let the releaser exclude them;
- count contested items in the manifest;
- the output is the authoritative version only (H4).

---

## 11. Concurrency and failure

- **Opening:** inside the review action's item lock, which already exists. The route call takes the lock too; it
  doesn't today. The partial unique index is the backstop, and gives 409.
- **Deciding:**
  - lock the item `FOR UPDATE` and re-read the dispute by id; it must still be the item's open one;
  - `unique(dispute_id)` and #47's one-marker-per-item index are the backstops;
  - of two experts deciding at once, one gets 200 and the other 409;
  - a PostgreSQL two-thread test, after `test_review_lock_postgres.py`.
- **Automatic opening** happens inside the review's own transaction: K1 when the panel completes, K2 when the item
  would complete. If it fails, the review rolls back with it, so there's never a review without its dispute.
- **Lengths:** the reason and the note get `Field(max_length=2000)` plus the same check inside the service function.
  The history description is fixed text under 255 characters.
- **Inactive task:** opening and deciding are refused (`assert_task_accepts_work`, which exists).
- **Repeats:**
  - escalating twice: the second is refused by #45 (DECIDED);
  - route after escalate: 200, with the same dispute;
  - deciding twice: 409.

---

## 12. Evaluation cases

These go to SCRUM-68/70/71: about sixteen cases toward the brief's 40–60. The harness needs an arbitrator actor (the
role exists), steps to adjudicate and reopen, and assertions on the dispute, the evidence and the export.

| Case | What happens | Brief's category | Posture | Expect |
| --- | --- | --- | --- | --- |
| EV-D01 | A reviewer escalates; the expert Accepts | genuinely ambiguous item | standard | canonical with the chosen version, contested |
| EV-D02 | The reviewers split | annotators who disagree, guideline doesn't settle it | dual | the platform opens a dispute; both verdicts are in the evidence |
| EV-D03 | The return comes first, then the accept | same | dual | same as EV-D02: order doesn't matter (D3) |
| EV-D04 | Two annotators disagree; the expert Accepts one | annotators who disagree | standard | one authoritative answer; the other kept |
| EV-D05 | Three annotators agree, all approved | — | standard | canonical, not contested, no dispute; the earliest submitted answer is marked (`canonical_rule`), and the same run twice marks the same one |
| EV-D06 | A confidently wrong AI answer is escalated, Returned, and answered again | confidently wrong AI suggestion | AI-assisted | round superseded; the new answer is canonical; both rounds exported |
| EV-D07 | Reject; the task completes; the export marks it; the owner reopens | genuinely ambiguous item | any | `unresolved`, then `pending` |
| EV-D08 | The annotator, a reviewer, the opener, and an admin who annotated each try to decide | permission correctness | any | each refused 403; an unrelated expert succeeds |
| EV-D09 | Compare the queue with the decision | permission correctness | any | the queue never offers what the decision refuses |
| EV-D10 | Two experts decide at once (PostgreSQL) | workflow correctness | any | one adjudication |
| EV-D11 | A secondary reviewer tries to settle; the owner tries to PATCH the item out of dispute | posture | arbitration-ready | both refused |
| EV-D12 | A dispute opens on the first of three answers; the expert tries each outcome; then the other two annotators answer | workflow correctness | `required_annotators = 3` | all three outcomes 409 while 1 of 3 answers is in; the other two can still annotate; afterwards the dispute is decidable and shows all three answers |
| EV-D13 | A release with an open dispute, and one with an unresolved item | unreviewed items reaching a release | any | refused; then the unresolved item is listed, not output |
| EV-D14 | An item disputed, Returned, then disputed again | broken or absent provenance | any | the export carries both disputes |
| EV-D15 | Escalate without the route call | workflow correctness | any | the dispute exists and is in the queue (G1) |
| EV-D16 | A sampled cross-review splits under `manual_review` | — | standard | flagged, sent back for rework, no dispute |

---

## 13. Delivery plan

Weeks run Thursday to Wednesday: W9 is Thu 8 – Wed 14 Oct, W10 Thu 15 – Wed 21, W11 Thu 22 – Wed 28, and W12 Thu
29 Oct – Sun 1 Nov, with the demo about Fri 30 Oct.

| Slice | What | Tickets | Proposed owner | When | Needs |
| --- | --- | --- | --- | --- | --- |
| **S1** | **Open a dispute properly:** atomic open, the dispute columns, evidence pinning, one open dispute per item, the hold (no resubmission, G14), the independence helper, the route compatibility | SCRUM-107's slice 1, pulled forward (or folded into SCRUM-99) | **me**, if Hanchen agrees | W9, Thu 8 – Sun 11 Oct | — |
| **S2** | **Decide a dispute:** the adjudication record; Accept, Return and Reject; `unresolved`; the lock and finality; the list and detail reads; `disputes[]` in the export; the legacy mapping; reopening from `unresolved` | SCRUM-99, 100 | Yi | W9, by Wed 14 Oct | S1; #40 or the 11 Oct deadline, for Accept and Return |
| S3 | The queue's independence | SCRUM-52 | Parth | W9 | S1's helper |
| S4 | The review panel, K1 detection, disagreement rows | SCRUM-51, 101 | Parth, Yi | W9–W10 | S1's opening service; D3 agreed |
| S5 | Answer disagreement (K2) and the authoritative rule | SCRUM-37, plus a new ticket? | unassigned: ask Hanchen | W9–W10 | S1, S2 |
| **S6** | **The screens** (§9.1–9.6) | SCRUM-103 | **me** | W10 | S2 |
| S7 | The posture: Expert Gate, target authority, arbitration-ready, posture shown, the confirmation screen, retiring the organisation gate | SCRUM-118, 107 | me, if assigned | W10–W11 | S1–S3, S6 |
| S8 | The consumers: H3 refuses open disputes, the manifest lists unresolved items; F1 events; the timeline; actor kinds | SCRUM-105, 104, 98, 106, 40 | various | W9–W11 | S2 |
| S9 | The dispute cases in the casebook (§12) | SCRUM-68, 70, 71 | me and Hanchen | W10–W11 | S2 onwards |

- **Critical path:** S1 → S2 → S6 → the demo.
- **Merge order on `review_actions.py`:** S1 → S2 → S4, with SCRUM-109 agreed alongside.
- **The minimum for the demo** is S1, S2, S3 and S6: the whole manual path, from escalate to an independent expert to
  Accept, Return or Reject, to the export. S4 and S5 automate detection; S7 adds the posture.
- **If time runs short, cut in this order:** S7's secondary reviewer and the organisation gate first, then the version
  diff on the dispute view, then K2's tolerances. Never independence or the hold.

---

## 14. Risks and open questions

| Risk | Effect | Mitigation |
| --- | --- | --- |
| #40 stays unanswered, or the client picks B | Accept's and Return's rules change | The model holds both readings (D1, D6); the 11 Oct deadline |
| Yi's #48 is built for B | rework, friction | Agree the S1/S2 split early. Keep their pinning, review window and desk; reuse their detail read |
| D3 changes ADR 007 | Parth's SCRUM-51 grows | Fallback: option 1 with the asymmetry documented |
| Six schema changes in W9 (S1, S2, S4, SCRUM-98, 53, 32/87) | merge pain, resets | One schema order, agreed on day one of W9 |
| K2's comparator flags near-misses on spatial types | experts flooded | The demo data is text classification; tolerances later |
| A dispute waits on a slow annotator (D8) | the item stays disputed longer | The queue says what it waits for; any item short of answers waits the same way today |
| The platform as actor (`audit_logs.operator_id` NOT NULL) | a person credited with the platform's act | SCRUM-40's actor kinds, agreed in W9 |
| My load: SCRUM-45, 68, 103, plus S1, plus 107/118 | slippage | Ask Hanchen to rebalance; S1 is small |
| Four weeks left | — | The demo minimum is defined (§13) |

**Open questions.**
- **For the client (#40):**
  - scope A or B?
  - should an unresolved item be left out of a release's output by default, and listed in the manifest?
- **For Hanchen:**
  - owners for S1, S5, SCRUM-107 and SCRUM-118;
  - a ticket for K2, or fold it into SCRUM-37?
  - D3 into SCRUM-51?
  - **Reviewer corrections (SCRUM-32/37):**
    - Story D3 says a correction "replaces the stored answer", while the ticket and #47's code keep it beside the
      original. The ticket fits "never overwrite".
    - Who approves a correction? Fix-and-accept by the same reviewer would make their own answer canonical with nobody
      else checking it (issue 7).
    - Does a correction count as a submission in D4's comparison?
- **For Parth and Yi:** D3's rule, the helper's signature, the merge order.
- **#38** (who reworks a returned AI first pass) touches Return on AI-assisted items. Until Hunter answers, Return
  reopens the item to people, which is today's rule.

---

## 15. Out of scope, with reasons

| Out | Why |
| --- | --- |
| An annotator contesting a verdict (an appeal) | The docs say a dispute is not a complaint button; R2-3 parks requests to reopen; annotators hold ANNOTATE only. After the demo, as R2-3's reopen request |
| Discussion threads on a dispute (the doc's UNDER_DISCUSSION) | Time. The justifications on the reviews and the adjudication carry the argument |
| Timeouts, SLAs, auto-escalation on age, notifications | No scheduler and no notification system. The queue shows the age |
| Assigning a dispute to a named expert | Self-served queue (17/09). `assignee_ref` stays recorded |
| Majority vote, merged answers, answers written by the expert | D4, D8 |
| Withdrawing a dispute | D11 |
| Policy versioning | SCRUM-53. The dispute stores a posture snapshot meanwhile |
| Project-level read isolation (Q6) | Deferred by Hanchen to after mid-W12 |

---

## 16. From the phone conversation

**Taken:**
- blind second review (D3; SCRUM-51, slice 1);
- a dispute only when verdicts conflict, with unanimous decisions simply applied (D3);
- pin the version, so any later work is a new one (D6; #47 already does it);
- the ruling is final, with no appeal (D7);
- the dispute's evidence is a submission, while the final answer belongs to the item (D1);
- adjudications feed reviewer-overturn figures (D16);
- a compare view between versions (§9.3, nice to have).

**Not taken, because they contradict the client's answers or the docs:**
- the annotator opening the dispute (§15);
- the adjudicator editing and approving (R2-1: accept an existing answer, or Return);
- majority vote and merging (D4);
- a discussion step, timeouts and notifications (§15);
- a cap on rework rounds: the client didn't ask for one. History shows the rounds, and the casebook can measure them.

Its description of Label Studio was checked on 04/10 against Label Studio's own docs: per-annotation review with Fix &
Accept, and no dispute record. D1's comparison uses the docs, not the chat.

---

## 17. Docs Sync and ADRs

**Docs Sync, by slice:**
- `workflow_states.md`: the task item's UNRESOLVED and its transitions; which dispute states ship; the panel rule (S1,
  S2, S4).
- `api_surfaces.md`: *Disputes and Arbitration* (S1, S2, S3, S7), the escalate action (S1), queue independence (S3).
- `domain_model.md`, `domain_model_relations.md`, `db_schema_blueprint.md`, `db_schema_strategy.md`: the disagreement,
  evidence and adjudication tables and the dispute's new columns (S1, S2, S4).
- `demo-scenarios.md`: the dispute demo (S6).
- Also check the terminology (`governance-model.md`, `task-schema-and-policy.md` §7): `disagreement_handling` governs
  K1, and K2 always opens a dispute (S4, S5). It isn't a named Docs Sync trigger, but it describes dispute policy.

**ADRs.** Yi takes 010 for SCRUM-99, so check `origin/main` for the next free number before each one.
- A dispute is decided per item, with its evidence pinned per version (S2, Yi's 010).
- Reject leaves the item unresolved (S2).
- Opening a dispute is atomic, and adjudication is the only way out (S1).
- Dual sign-off decides on the whole review panel (S4; supersedes part of 007).
- Answer disagreement opens a dispute under every posture (S5).
- Who may settle a dispute: the target, and arbitration-ready (S7).

---

## Appendix A. Draft comment for #40 (to Hunter)

Not posted. Posting is Jingwei's call. It doesn't mention `specs/`.

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

---

## Appendix B. Code anchors (`df7c05a`)

**Backend** (`apps/hej-api/app/…`):
- `api/routes/review_actions.py`: `submit_task_item_review_action` (escalate sets `disputed`, with no row);
  `route_escalation` (no lock); `decide_escalation` (no lock, no independence, optional note, payload override);
  `_map_escalation_decision_to_task_item_status`; `reopen_finalised_item` (`canonicalized` only).
- `services/review_policy_enforcement.py`: `assert_may_decide` (the hold on an open escalation); `assert_may_route_dispute`;
  `assert_escalation_allowed` (a no-op).
- `services/submission_rules.py`: `review_refusal`; `item_complete` (approvals only, no answer comparison);
  `item_judge_ids_by_item` (reads `task_item_escalations.decided_by`); `open_escalation_item_ids`.
- `services/annotation_versions.py`: `mark_authoritative`, `ADJUDICATION_ACCEPT`, `AUTHORITATIVE_CAUSES`.
- `services/task_item_reopen_service.py`: `reopen_task_item`, `ADJUDICATION_RETURN`.
- `services/task_service.py`: `TERMINAL_TASK_ITEM_STATUSES`, `EXPORT_ELIGIBLE_TASK_ITEM_STATUSES`,
  `assert_task_item_status_update_allowed` (G14).
- `api/routes/tasks.py`: `update_task_item` (the PATCH); `_latest_resolved_escalations_by_item` (G17).
- `services/task_work_queue_service.py`: `list_adjudication_queue` (role only); the annotate queue skips only
  finalised items (G19).
- `services/project_disputes_service.py`: severity is the target (G20).
- `services/task_item_status_resolution.py`: the `expert_send_back` repair helpers (legacy, D15).

**Web** (`apps/hej-web/…`):
- `components/task-dispute-desk.tsx`: `finalize`/`send_back`.
- `components/task-item-workspace-sheet.tsx`: the escalate-then-route calls (~line 1945); the placeholder (~line 2313).
- `components/arbitration-decision-panel.tsx` and `dispute-case-board.tsx`: mocks, unused.
- `components/project-disputes-read-panel.tsx`, `project-dispute-table.tsx`, `task-finalized-desk.tsx`.
- `app/disputes/[disputeId]/page.tsx` and `app/arbitration/[arbitrationId]/page.tsx`: `notFound()`.
