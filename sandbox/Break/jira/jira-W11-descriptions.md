# Board descriptions — W11 tickets

2026-10-01. From the board export of 2026-10-01 19:35, checked against `origin/main` (`dd91758`),
`info/issues.md` and `info/client-question.md`. Points are as set on the board the same day. W11 runs 22–28 Oct
and is **the last sprint**: build work ends on 28 Oct (`specs/roadmap.md` → W11). Every description names its
related defects from `info/issues.md`, or says there are none.

| Ticket | Story | Points | Issues | Verdict |
| --- | --- | --- | --- | --- |
| SCRUM-118 | G2 | 2 (W10) | 7 | **Replace** — new ticket, split from SCRUM-107; set its parent epic |
| SCRUM-107 | E5 | 3 → **2** | 7 | **Replace** — still the folded text; points back to 2 |
| SCRUM-108 | H6 | 2 | 14, 19 | **Append** — what "real" means per screen, and the overlap with E6's `/exports/[id]` |
| SCRUM-74 | I5 | 1.5 | 4, 7, 9, 21, 22 | **Replace** — the checks need their inputs and their pass rule |
| SCRUM-75 | I5 | 1 | every defect left open | **Replace** — add the unfixed-defect decisions the brief's success criteria ask for |
| SCRUM-88 | J1 | 0.5 | none | **Replace** — verify first; `slug` and a stable numeric id exist |

## G2 and SCRUM-107 — split (decided by Hanchen, 2026-10-01)

The fields already exist: `ProjectPolicyDB` stores `governance_model` (standard, dual_signoff, expert_gate,
arbitration_ready), `expert_gate_required` and `adjudication_mandatory_on_dispute`, and `resolve_for_task`
(SCRUM-50) resolves them. Nothing enforces them — the only reader shows them (`tasks.py:835`). G2's remainder
(decided 2026-09-24 from R2-7 and R2-8) and E5 make those flags govern the canonicalisation path.

Hanchen chose to split them across two weeks: **SCRUM-118 (G2, W10, 2 points)** enforces the Expert Gate and the
AI invariant in the backend; **SCRUM-107 (E5, W11, 2 points)** builds Arbitration-ready and the screens on it a
week later. Being a week apart, they can have different owners. W10 17.5u, W11 7u.

On the board (export of 2026-10-01 19:48):
- SCRUM-118 exists in W10 with 2 points but **no parent epic** — set it to *Project, Policy & Task Lifecycle*
  (10039), where SCRUM-50 (G2's first ticket) sits. Replace its description with the one below.
- SCRUM-107 still carries the folded text and 3 points: **points → 2**, and replace its description with the
  one below. The current text also ends with `{noformat}{noformat}` — three markers, so Jira renders the
  block wrongly; the replacement fixes it.

---

## SCRUM-118 — Governance: Make the project's governance posture govern canonicalisation

Parent: *Project, Policy & Task Lifecycle* (10039). W10, 2 points. Replace the description with:

```
{noformat}Related to user story G2

BACKEND ONLY. W10. Split from SCRUM-107 on 2026-10-01: G2's remainder from the client's answers R2-7 and R2-8, folded into G2's criteria on 2026-09-24. SCRUM-107 (E5, W11) builds on this a week later.

ProjectPolicyDB stores governance_model (standard, dual_signoff, expert_gate, arbitration_ready), expert_gate_required and adjudication_mandatory_on_dispute; resolve_for_task (SCRUM-50) returns them; nothing enforces them — the only reader displays them (app/api/routes/tasks.py:835). Read them through resolve_for_task, never from the tables.

Client answer R2-8, Expert Gate: "Every item requires expert confirmation before it can become canonical, whether or not a dispute occurred" — annotation → review → expert gate → canonical. "The expert should not approve an item that they themselves annotated or reviewed." R2-7: "Under no circumstances can the AI first pass become the canonical answer without being reviewed by humans."

Related issue: 7 (approving or deciding on one's own work) — the expert step extends D1's self-review rule.

# Where expert_gate_required is set, an item whose review requirements are met is held — not canonicalised — until an expert confirms it. The confirmation is its own record, with who and when.
# An expert confirms through an API action that requires the capability adjudication uses (ADJUDICATE), unless the PR argues for a separate one. Items awaiting confirmation are listed for experts — the adjudicator queue (SCRUM-52) or a sibling — under the same independence rule.
# No expert confirms work they annotated or reviewed, administrators included, no override. Use the independence helper SCRUM-52 and 99 share.
# No item canonicalises on AI output alone, under any posture: checked in the backend at the point of canonicalisation, not only by the current workflow's shape.
# Without expert_gate_required, canonicalisation is unchanged.
# Tests, each failing on the old behaviour: an expert-gate item stays uncanonicalised after its approvals until an expert confirms; its annotator, its reviewer and an administrator who annotated it are each refused; an unrelated expert's confirmation canonicalises it; an item with only an AI annotation never canonicalises; a standard-posture item canonicalises as before.

Collaboration:
- SCRUM-52, 99 (break): the independence helper and the adjudicator queue.
- SCRUM-103 (E6, same week): the expert's screens; the confirmation screen itself is SCRUM-107's.
- SCRUM-105 (H3, same week): an item held at the gate is not canonical, so the release gate refuses it as unreviewed.
- SCRUM-98 (F1, W9): the confirmation is an event.
- SCRUM-107 (E5, W11): Arbitration-ready and the posture's screens build on this.
- SCRUM-71 (I2): a case for the Expert Gate and one for the AI invariant.{noformat}
```

---

## SCRUM-107 — Dispute: Make the escalation posture configurable and enforced

W11, points 3 → **2**. Replace the description with:

```
{noformat}Related to user story E5

BACKEND AND FRONTEND. W11, the last sprint. Rewritten 2026-10-01: the Expert Gate and the AI invariant moved to SCRUM-118 (G2, W10); this ticket builds on it.

The posture is stored and resolved (governance_model, expert_gate_required, adjudication_mandatory_on_dispute on ProjectPolicyDB, through resolve_for_task) but, until SCRUM-118, never enforced. Read it through resolve_for_task, never from the tables.

Client answer R2-8, Arbitration-ready: "if a dispute occurs, it must reach independent adjudication" — "the model needs an explicit rule/field representing that adjudication is mandatory on dispute." "An arbitrator should not arbitrate a dispute involving work that they annotated or reviewed themselves."

Related issue: 7 (deciding on one's own work).

# Where adjudication_mandatory_on_dispute is set, a disputed item can be resolved only by an independent adjudication (SCRUM-99); no other path — a reviewer's decision, an owner's action — closes the dispute.
# The posture can be chosen when configuring a project, and a task shows the posture it inherits. Verify first what the project policy screen (PR #25, #37) already offers, and build only the gap.
# The expert's confirmation screen for SCRUM-118's Expert Gate: items awaiting confirmation, the answer to confirm, and a confirm action. Reuse the arbitration view (SCRUM-103).
# The posture in force is visible on the project and on each item, including whether an item is waiting at the Expert Gate.
# Tests: under arbitration-ready a dispute cannot be closed except by an adjudication, and the arbitrator cannot be someone who annotated or reviewed the item; a web test shows an item waiting at the gate and confirms it.

Collaboration:
- SCRUM-118 (G2, W10): the Expert Gate and the independence helper it uses.
- SCRUM-99, 103: adjudication and its screens.
- SCRUM-108 (H6, same week): the policy screen shows the posture.
- SCRUM-71 (I2): one case per posture.{noformat}
```

---

## SCRUM-108 — Release: Show real releases, policy and history on the project screens

Append to the description, inside the `{noformat}` block:

```
Updated 2026-10-01. W11, the last sprint. Related issues: 14 (export tests not running — closed), 19 (task completion and export readiness disagreeing — its closure check is in SCRUM-105). The figures here must agree with the same rule.

- Export list and view: real releases from SCRUM-102 (H1) with their manifest from SCRUM-104 (H2) — id, created by and when, item count, the hash, and a download that returns the same bytes. A refused release (SCRUM-105) is not listed as a release.
- /exports/[id]: SCRUM-103 (E6, W10) records whether that route is built or deleted; build on its decision.
- Policy screen: the policy version in force (SCRUM-53, F2) and the governance posture (SCRUM-107, same week).
- History: verify rather than rebuild; it shows the actor kinds SCRUM-40 records.
- Tests: the export list shows a created release and not a refused one; the policy screen shows the version in force after an edit.
```

---

## SCRUM-74 — Evaluation7: Integrity checks on provenance, roles and releases

Replace the description with:

```
{noformat}Related to user story I5

BACKEND (evaluation). W11, the last sprint. Rewritten 2026-10-01.

Integrity claimed is not integrity demonstrated. These checks let someone outside the team verify a release rather than take it on trust.

Related issues: 4 (one authoritative answer per released item), 7 and 9 (governed actions only by the right role, in the right project), 21 and 22 (the actor recorded correctly) — the checks prove these fixes hold on real releases.

# Every released item has complete provenance: its F1 event chain (SCRUM-98) covers each step its workflow took, with an actor and a time on each.
# Every governed action — submit, review, route, adjudicate, confirm, release — was performed by a user holding the right capability in that project, and never on their own work where the rule forbids it.
# A release is rebuilt from its manifest (SCRUM-104) and compared byte for byte with the original artefact (SCRUM-102).
# Each check fails loudly — a non-zero exit and a named item — rather than warning.
# The checks run as harness cases (SCRUM-68, 69), so CI runs them on both databases.

Starts once SCRUM-108 and 107 have merged in the same week; the last build work of the project.{noformat}
```

---

## SCRUM-75 — Evaluation8: Findings record including negative results

Replace the description with:

```
{noformat}Related to user story I5

DOCUMENT. W11, the last sprint. Rewritten 2026-10-01.

Negative findings tell the client more about the platform's real limits than a list of features that worked, and the brief gives them equal weight.

Related issues: every defect in info/issues.md still open at the end of W11. The brief's success criteria ask that each unfixed defect carry an argued decision rather than silence.

# Record the findings from I2–I4 (SCRUM-71, 72, 73) and I5's checks (SCRUM-74), including what failed and why.
# Trace each finding to a case so a reader can re-run it.
# Report negative results rather than filtering them out.
# List each defect left open with the decision and its reason.
# Store it in the repository's docs, so it is handed over with the code.{noformat}
```

---

## SCRUM-88 — Organisation Management: Stable organisation identifier and URL

Replace the description with:

```
{noformat}Related to user story J1

W11, the last sprint; the first to drop if the week is full. Rewritten 2026-10-01: verify first.

The client's one concrete requirement here is to refer to an organisation unambiguously. Organisations already have a numeric id and a unique slug (OrganizationDB), and the web routes use the id (/organizations/[organizationId]).

Related issues: none.

# Check on main and record on this ticket: each organisation has an identifier and URL that never change, including after a rename; one organisation holds several members (SCRUM-90, PR #28) and several projects.
# If all hold, close the ticket.
# If not, build only the gap — for example a rename that would change the slug or the URL.{noformat}
```
