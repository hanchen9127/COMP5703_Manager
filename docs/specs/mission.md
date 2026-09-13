# Mission

Annotation platforms are usually built around the moment of labelling. Serious dataset production is
mostly everything else: where the source came from, which guideline was in force, who annotated and
who reviewed, what the AI suggested and whether the human took it, how disagreement was settled, and
what finally entered a release. When that record is missing, a dataset cannot be defended — only
shipped.

Hej is Arc Intelligence's governed human-judgement platform. Team CS-57 is building the layer above
its existing workflow: a provenance-aware human–AI data production system in which every accepted
label can be traced back through the reviews, suggestions, corrections and guideline versions that
produced it.

**The goal is not faster annotation.** The goal is that a released dataset can answer, for any item in
it, *how did this label get here* — and that the platform refuses to release when it cannot.

## What We Do

The client brief defines one coherent journey through six pillars. Every story in the backlog serves
one of them.

| Pillar | What it means | Where the platform stands (2026-09-13) |
| --- | --- | --- |
| **Govern** | Organisations, projects, roles, capability-based permissions, versioned guidelines | Capability checks exist for governed actions; roles are organisation-wide only; no guideline versioning |
| **Assist** | AI suggestions behind a replaceable, typed model interface; human-only, AI-first and blind-then-reveal modes | OpenAI-compatible multi-provider client merged; AI failure is now explicit; no queue; two of three modes |
| **Record** | Source and guideline version, annotation attempts, and what the human did with the AI's suggestion — captured as it happens | Generic activity log only; reviewer corrections are not persisted |
| **Adjudicate** | Review, disagreement and adjudication, keeping annotator label, reviewer decision and canonical judgement distinct | Draft ownership and approval self-checks in place; finalised results still overwritable; no assignment; dispute send-back is a placeholder |
| **Release** | Immutable releases with manifests, gated *before* the release exists | Export is a status computed on the fly; no artefact, manifest or gate |
| **Evaluate** | Human-only versus AI-assisted annotation under repeatable conditions | Does not exist yet |

## Who We Serve

- **The client — Arc Intelligence (Hunter Xu).** Owns the platform, sets the brief, and decides product
  questions the team must not settle alone.
- **Project managers / task owners** — configure projects, policies and tasks, and need to trust every
  number the platform shows them.
- **Annotators** — do first-pass work and need their unfinished work to stay theirs.
- **Reviewers** — accept, correct or reject work, and need to know whose work they are judging.
- **Experts / arbitrators** — settle disputes, and need their decision recorded as its own fact.
- **Organisation administrators** — manage members and roles, and need roles to actually govern.
- **Quality leads** — run evaluation and need evidence, not a single unexplained score.

## Target Audience

These specs are written for:

- **Hanchen Wang, project manager.** The purpose of this folder is to track the *whole team's*
  progress against the brief — every pillar, story and defect — not only the tickets allocated to one
  person.
- **The client (Arc Intelligence)**, who is shown progress through `shared/user-stories.html` — a view
  Hanchen curates locally and updates after the team's records, so it deliberately lags Jira and the
  tracker.
- **The CS-57 team** — Hanchen Wang, Jingwei Lin, Yi Geng, Kanishka Kathait, Michael Max, Parth,
  Dishank Aswal and Tim Chung (Tok Tin Chung in the tracker) — as the shared statement of what we are building and in what order.
- **Coding agents working in `hej`**, which should load `mission.md`, `tech-stack.md` and `roadmap.md`
  before writing a feature spec or touching code. These files sit outside the repository, at
  `../docs/specs/` relative to `hej`, so an agent started inside `hej` must be pointed at them.

## What Success Looks Like

The brief's expected outcomes, stated as things we can check:

- [ ] **The full journey runs on realistic data** — project → policy → task → items → AI first pass →
  review → cross-validation → dispute → adjudication → release.
- [ ] **End-to-end provenance** — any released item shows its source, guideline version, AI suggestion,
  human response, reviews and adjudication, each with an actor and a time.
- [ ] **Immutable releases with export manifests**, refused before they exist when items are unreviewed,
  provenance is incomplete, or versions are superseded — never satisfiable by someone asserting that
  review happened.
- [ ] **AI assistance behind a typed interface**, with mock and live modes interchangeable, and a
  failure never disguised as a suggestion.
- [ ] **A reusable evaluation harness and a casebook of 40–60 end-to-end cases**, including adversarial
  ones, measuring quality, collaboration and integrity.
- [ ] **Automated, integration, permission, provenance and end-to-end tests.**
- [ ] **Every Critical defect in `info/issues.md` closed**, and every defect left unfixed carries an
  argued decision rather than silence.
- [ ] **Findings documentation, per-member decision records, a technical report, and a live or recorded
  end-to-end demonstration.** Their stories (K1–K4) are set aside for now — see
  [Stories Set Aside](#stories-set-aside).

Dataset quality must never be reduced to a single unexplained score.

## Non-Goals

From the brief and the backlog's out-of-scope list:

- Rebuilding the annotation interface, or integrating Label Studio
- Training or fine-tuning models
- A universal annotation ontology or a generic workflow engine
- Every modality at once — **text is the committed demo path**; image, audio and video must not break
- Formal privacy or legal compliance claims made through software features
- Marketplace, trust, billing or payout — future extensions around the shared core, not part of it
- A separate cleanup phase for the 29 defects — each is closed by the story it belongs to

## Stories Set Aside

Six stories are *Discarded* in the backlog and have no Jira ticket. **By decision on 2026-09-14 they
are set aside for now:** not scheduled in `roadmap.md`, not given feature specs, and not counted in
roadmap coverage. They stay `dropped` in `story_src.csv`. Only Hanchen reopens them.

| Story | Title | What stays true while it is set aside |
| --- | --- | --- |
| A1 | Changes are reviewed before they reach the platform | `hej` has no CI, PR template, CODEOWNERS or branch protection; review before merge is a team habit, not enforced |
| A5 | A status means the same thing wherever I see it | Design docs and code use different state vocabularies; B4, B6 and G4 each fix one disagreement |
| K1 | A reader can understand the system without us | No technical report is planned |
| K2 | Each of us can defend our own design decisions | No per-member decision records are planned |
| K3 | What didn't work is recorded as carefully as what did | I5's findings record (SCRUM-75, W12) produces much of this content |
| K4 | The end-to-end demonstration works when it matters | No demonstration is planned; the full journey first runs on real screens after W11 |

The brief still lists findings, decision records, a technical report and a demonstration among its
expected outcomes, so these appear under [Risks](#risks).

## Progress Snapshot — W6 (2026-09-13)

**Basis.** Two views are kept apart (decided 2026-09-14):
- **By epic follows `shared/story_src.csv`**, Hanchen's local, client-facing copy of the team's
  records. It is updated from hand-downloaded snapshots of the Jira board and the tracker, so it lags
  both. A story the records mark complete is counted complete here even where the code does not bear
  it out.
- **The defect table and `roadmap.md`'s marks follow the code on `origin/main`.** Entries marked
  *verified* were checked on 2026-09-13 or 2026-09-14.

Where the two views disagree, both are shown and the gap is listed under [Risks](#risks).

### By epic (records view)

| Epic | Stories | Complete | In progress (W6) | Not started | Discarded |
| --- | --- | --- | --- | --- | --- |
| A — Trustworthy Foundations | 5 | A2, A3, A4 | — | — | A1, A5 |
| B — Setting Up Work | 6 | B1, B3 | B5 | B2, B4, B6 | — |
| C — AI-Assisted First Pass | 5 | C3 | C1, C5 | C2, C4 | — |
| D — Review & Cross-Validation | 8 | D2, D6 | D5 | D1, D3, D4, D7, D8 | — |
| E — Disagreement & Dispute | 6 | — | E2 | E1, E3, E4, E5, E6 | — |
| F — Provenance & History | 5 | — | — | F1–F5 | — |
| G — Roles, Permissions & Orgs | 5 | G1, G3 | G4, G5 | G2 | — |
| H — Release & Export | 6 | — | — | H1–H6 | — |
| I — Evaluation | 5 | — | I1 | I2–I5 | — |
| J — Organisations & Dashboard | 4 | — | — | J1–J4 | — |
| K — Evidence & Handover | 4 | — | — | — | K1–K4 |
| **Total** | **59** | **10** | **8** | **35** | **6** |

### Defects (`info/issues.md`, code view)

| # | Defect | Severity | Story | Status on `main` |
| --- | --- | --- | --- | --- |
| 1 | Live API key hardcoded in source | Medium | A4 | ✅ Removed from code *(verified)*; provider rotation unconfirmed |
| 2 | Finalised annotation silently overwritten | **Critical** | D5 | Open — scheduled W7 |
| 3 | Reviewer shown the wrong annotator's work | High | D4 | Open — blocked on client decision |
| 4 | Finalised item exports conflicting answers | **Critical** | H4 | Open |
| 5 | Reviewer corrections not saved | **Critical** | D3 | Open — blocked on client decision |
| 6 | Drafts have no ownership enforcement | **Critical** | D6 | ✅ Fixed *(verified)*; story complete |
| 7 | Annotators can approve their own work | **Critical** | D1 | Partial — approval paths guarded *(verified)*; dispute decisions are not: an admin can escalate and finalise their own work |
| 8 | Legacy review API rewrites approval history | **Critical** | D2 | ✅ Fixed *(verified 2026-09-14)* — all four legacy review writes return `410 Gone` (PR #6). D2 is not finished: subtasks 2 and 4 (item state always moves with the decision; a test that state and history cannot diverge) have no code or test |
| 9 | Cross-project / cross-org write bypass | High | G3 | Fix in PR #14 — logged complete in the tracker, but not merged and no reviewer recorded *(verified)* |
| 10 | Invalid status values saved | High | G4 | Fix in PR #9, logged but not merged; bare `str` still on `main` *(verified)* |
| 11 | Draft submission not atomic | High | D5 | Open — scheduled W7 |
| 12, 13 | Frontend typecheck and test failures | High | A2 | ✅ Closed |
| 14 | Backend export tests fail to run | High | H5 | ✅ Closed *(verified)* — `test_project_exports_route.py` collects and passes since A2 (`e0e642a`); H5's figure check remains |
| 15 | Dispute send-back not implemented | High | E2 | Open — placeholder still on `main` *(verified)* |
| 16 | Dataset registration not transactional | High | B5 | Fix in PR #11, logged but not merged *(verified)* |
| 17 | Invitations completely broken | High | G5 | Fix on branch `CS57-Tim`, no PR yet |
| 18 | Pending-invitation listing unreachable | High | G5 | Open *(verified 2026-09-14)* — `members.py` still registers `GET ""` under `/organizations`, shadowed by the same route in `organizations.py` |
| 19 | Completion and export disagree on "done" | High | B6 | Open |
| 20 | AI failures produce fake annotations | High | C3 | ✅ Fabrication removed *(verified)*; story tests to confirm |
| 21, 22 | Audit actor wrong; duplicated escalation entries | Medium | F4 | Open — verify #22 |
| 23, 24 | `.env` ignored; `init_data.py --reset` broken | Medium / High | A3 | ✅ Closed |
| 25, 26 | Vacuous frontend test; misleading backend mock | Low | A2 | ✅ Closed |
| 27 | Impossible `"approved"` status in export rule | Low | B6 | Open |
| 28 | Task can never leave `draft` | High | B4 | Open — blocked on client decision |
| 29 | Intake 409 reported as 500 | Medium | B5 | Fix in PR #9 per the tracker, not merged *(verified)* |

**Six Critical defects: 2 fixed (6, 8), 1 partial (7), 3 open (2, 4, 5).**

PR numbers here and in `roadmap.md` refer to `USYD-CS-Capstone/hej`. `main`'s history also carries
merge commits from the inherited Arc Intelligence repository numbered #12–#72; those are different
pull requests.

## Risks

| Risk | Why it matters | Mitigation owner |
| --- | --- | --- |
| **Stories set aside (A1, A5, K1–K4).** The brief expects findings, decision records, a technical report and a demonstration (K1–K4); review is not enforced by CI or branch protection and `main` has taken direct commits, such as `d4d809c` on 2026-09-13 (A1); design docs and code use different state vocabularies (A5). | Brief deliverables are assessed, and K2 in particular is hard to reconstruct later. Without A1, the Definition of Done's independent review is enforced only socially; without A5, fixes in B4, B6, G4 and H5 can drift apart. | None for now, by decision (2026-09-14) — Hanchen revisits; see [Stories Set Aside](#stories-set-aside) |
| **The plan now runs to W12.** Capping every week at 16u (decided 2026-09-14) moved 6u of W7–W9 work into W11 and trimmed 1u by re-estimating; W12 was added for the P2 stories and I5. W11 (13.5u) and W12 (8u) leave 10.5u of slack between them, but P0 H6 still lands only in W11 because it sits on W9–W10 work. | Carry-over beyond that slack, or a late client decision, pushes stories past W12. | Replanning rule 2 at every weekly meeting; H6 first in W11 |
| **Client decisions block P0 work.** B4 (task lifecycle path), D4 (canonical annotation versus per-annotator submissions), D3 (who authors a reviewer's correction), E3 (where an item goes after a dispute). | D4's decision alone gates D4, D3, F3 and H4 — 8u of P0 work across W8–W10 — and also I4. B4 gates task activation. | Hanchen — obtain in W7, D4 first. Every blocked group in `roadmap.md` names a fallback, so a late decision does not leave a group idle |
| **Work assignment does not exist.** Task items have no assignee field (D8). | D7, E1, the E2 return-to-queue and I3 all assume it; RQ-607 ("annotators only see items assigned to them") is unmet. | The W8 groups for SCRUM-48 |
| **Evaluation is a primary deliverable and is at zero.** | 40–60 cases cannot be written in one week; each story should contribute its own cases as it lands. | The evaluation groups from W7 (SCRUM-68 onward); every group adds cases for its own tickets |
| **Release is the largest build gap.** H1–H6 depend on F1, F2, F3 and D4. | A slip in provenance or the canonical decision cascades into release. | The release groups, W9–W10 (SCRUM-64 to SCRUM-66, SCRUM-37) |
| **Governance gaps found in review (2026-09-13).** Project-scoped roles are defined but never honoured, so G3's "access to one project" cannot exist; an admin can escalate and self-finalise their own item. | G3 cannot close as the story reads; D1 criterion 3 is unmet. | The W7 review group (SCRUM-86); D2's remaining subtasks in W11 (SCRUM-29); product decision on project-scoped roles through Hanchen |
| **Parallel branches edit the same files.** PRs #9 and #14 both touch `tasks.py`; D5 and the review stories share `DraftService`; in W8 five groups change the schema, with only an additive `migrate_db_schema()` to reconcile them. | Late merges conflict and regress each other. | W7 group 8 runs a merge train — PR #14 first, then #9 and #11. Weeks with several schema changes agree one migration order on day one |
| **Tracking records run ahead of the code.** On 2026-09-13 the tracker logs PRs #9, #11 and #14 as merged when none is on `main`, and marks D2 and G3 complete while verified gaps remain — D2's subtasks 2 and 4, and G3's unmerged PR. `story_src.csv` follows the tracker by decision. | The tracker's Client Report is built from these records and can overstate progress; `user-stories.html` inherits the same gaps whenever `story_src.csv` is synced. | Hanchen — reconcile tracker, board and `main` at each weekly sync. The `tracking-sync` report, which lists code gaps before anything is applied, is the checkpoint before the client view changes |

## How We Work

- **Language.** Discussion is in **Chinese** — team chat, meetings, and working with coding agents.
  Every written artefact is in **English**: specs, docs, code and comments, commit messages, PR
  descriptions, reviews and Jira text.
- **Status comes from the team's records; code is checked against them.**
  - **Live records.** Members log each merged PR in the contribution tracker, a shared online Google
    Sheet, and move tickets on the Jira board.
  - **Local snapshots.** Hanchen downloads both into `shared/` by hand, periodically. The copies are
    read-only and can be behind the live sheet and board.
  - **Client view.** `shared/story_src.csv` is managed only by Hanchen, locally. It is updated from the
    snapshots with the `tracking-sync` skill, following the rules in `tech-stack.md`, so it lags the
    snapshots as well. `user-stories.html` presents it to the client. It is a presentation, not the
    team's source of truth: for current status, read the board and the tracker.
  - Where the records disagree with `origin/main`, `story_src.csv` keeps the record and the
    discrepancy is raised at the weekly sync rather than silently corrected. `roadmap.md`'s marks
    follow the verified code instead, and note the record where it differs.
  - `roadmap.md` is updated after each weekly sync.
- **Client and product decisions go through Hanchen**, and are written into the `hej` docs in the same
  change that relies on them. An example is the decision that there is no admin override on draft
  writes, recorded in `api_surfaces.md`.
- **Working features are stable by default.** UI style, authentication and anything that already works
  may be changed only with written justification agreed at review. Regenerating a subsystem because
  that is faster than reading it is not acceptable.
- **AI tools are permitted, and the member stays responsible.** Whoever submits AI-assisted work must
  be able to explain and defend every line without appeal to the tool.
- **Spec-driven feature work, at two levels kept apart.**
  - **The feature spec is the big picture**, one per story, written with the `feature-spec` skill in
    `docs/specs/YYYY-MM-DD-<story-id>-<slug>/`:
    - `requirements.md` — scope, out of scope, decisions, context, stakeholders
    - `plan.md` — numbered task groups by ticket and layer, mapped to the roadmap's weekly groups
    - `validation.md` — the Definition of Done as checks

    Open questions are resolved before the files are written.
  - **The sandbox is the week-by-week implementation** of Hanchen's own tickets:
    `docs/sandbox/W<n>/plans/plan-<ticket>.md` holds the commit-by-commit detail and links back to the
    spec.
  - Implement in small, reviewable commits and validate against `validation.md`. Then:
    1. once it is merged to `origin/main` and meets the Definition of Done, mark the story ✅ in
       `roadmap.md` — before that it is 🟡;
    2. log it in the tracker;
    3. run `tracking-sync`;
    4. replan the following week.
