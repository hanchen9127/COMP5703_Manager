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
| **Assist** | AI suggestions behind a replaceable, typed model interface; human-only and AI-first modes, with blind-then-reveal as an evaluation protocol (client answer, 2026-09-21) | OpenAI-compatible multi-provider client merged; AI failure is now explicit; no queue; two modes, and the blind-then-reveal protocol is not built |
| **Record** | Source and guideline version, annotation attempts, and what the human did with the AI's suggestion — captured as it happens | Generic activity log only; reviewer corrections are not persisted |
| **Adjudicate** | Review, disagreement and adjudication, keeping annotator label, reviewer decision and canonical judgement distinct | Draft ownership and approval self-checks in place; a fix for overwritable finalised results is in review; no work queue of any kind — and by the client's decision of 2026-09-17, no assignment either; dispute send-back merged |
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
  Dishank Aswal and Tim Chung (Tok Tin Chung in records before 2026-09-16) — as the shared statement of what we are building and in what order.
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
- A separate cleanup phase for the 30 defects — each is closed by the story it belongs to

## Stories Set Aside

Six stories are *Discarded* in the backlog and have no Jira ticket. **By decision on 2026-09-14 they
are set aside for now:** not scheduled in `roadmap.md`, not given feature specs, and not counted in
roadmap coverage. They stay `dropped` in `story_src.csv`. Only Hanchen reopens them.

| Story | Title | What stays true while it is set aside |
| --- | --- | --- |
| A1 | Changes are reviewed before they reach the platform | **One piece reopened on 2026-09-18:** SCRUM-94 adds a CI workflow running the backend suite on SQLite and on PostgreSQL, because supporting two databases with no automated check lets either break silently. The rest stays set aside — no PR template, CODEOWNERS or branch protection, and review before merge is a team habit, not enforced |
| A5 | A status means the same thing wherever I see it | Design docs and code use different state vocabularies; B4, B6 and G4 each fix one disagreement |
| K1 | A reader can understand the system without us | No technical report is planned |
| K2 | Each of us can defend our own design decisions | No per-member decision records are planned |
| K3 | What didn't work is recorded as carefully as what did | I5's findings record (SCRUM-75, W12) produces much of this content |
| K4 | The end-to-end demonstration works when it matters | No demonstration is planned; the full journey first runs on real screens after W11 |

The brief still lists findings, decision records, a technical report and a demonstration among its
expected outcomes, so these appear under [Risks](#risks).

## Progress Snapshot — W7 (2026-09-18)

**Basis.** Two views are kept apart (decided 2026-09-14):
- **By epic follows `shared/story_src.csv`**, Hanchen's local, client-facing copy of the team's
  records. It is updated from downloaded snapshots of the Jira board and the tracker, so it lags
  both. A story the records mark complete is counted complete here even where the code does not bear
  it out.
- **The defect table and `roadmap.md`'s marks follow the code on `origin/main`.** Entries marked
  *verified* were checked between 2026-09-13 and 2026-09-18.

Where the two views disagree, both are shown and the gap is listed under [Risks](#risks).

### By epic (records view)

| Epic | Stories | Complete | In progress | Not started | Discarded |
| --- | --- | --- | --- | --- | --- |
| A — Trustworthy Foundations | 5 | A2, A3, A4 | — | — | A1, A5 |
| B — Setting Up Work | 6 | B1, B3, B5 | B2, B6 | B4 | — |
| C — AI-Assisted First Pass | 5 | C3, C5 | C1, C2 | C4 | — |
| D — Review & Cross-Validation | 8 | D2, D6 | D1, D5, D7, D8 | D3, D4 | — |
| E — Disagreement & Dispute | 6 | E2 | E1 | E3, E4, E5, E6 | — |
| F — Provenance & History | 5 | — | F1, F5 | F2, F3, F4 | — |
| G — Roles, Permissions & Organisations | 5 | G1, G3, G4, G5 | G2 | — | — |
| H — Release & Export | 6 | — | H5 | H1, H2, H3, H4, H6 | — |
| I — Evaluation | 5 | — | — | I1, I2, I3, I4, I5 | — |
| J — Organisations & Dashboard | 4 | — | J3 | J1, J2, J4 | — |
| K — Evidence & Handover | 4 | — | — | — | K1, K2, K3, K4 |
| **Total** | **59** | **15** | **14** | **24** | **6** |

Synced from the Jira board and the tracker on 2026-09-18. *In progress* follows the board: E1, F5, G2 and
H5 count as in progress because a ticket they share with another story is — SCRUM-51, 39, 50 and 43 —
while `roadmap.md` schedules their own work for W9–W11. They return to *not started* once those tickets
are split by story on the board. B1 and B3 are complete in the records, but their tickets, SCRUM-91 and
SCRUM-85, are still To Do.

G5 moved to complete on 2026-09-18: SCRUM-8 is Done on the board and PR #16 is merged.

**D5's two tickets both merged on 2026-09-20** — SCRUM-28 through PR #19, reviewed by Dishank, and
SCRUM-26 through PR #23, which Kanishka merged with a comment rather than a formal Approve. Critical
issue 2 and High issue 11 are closed. **The story is not complete:** criterion 2, reopening a finalised
item, waits on client follow-up F5, so D5 stays `working` until that is answered and built. The epic
table above still follows the records and moves at the next `tracking-sync`.

### Defects (`info/issues.md`, code view)

| # | Defect | Severity | Story | Status on `main` |
| --- | --- | --- | --- | --- |
| 1 | Live API key hardcoded in source | Medium | A4 | ✅ Removed from code *(verified)*; provider rotation unconfirmed |
| 2 | Finalised annotation silently overwritten | **Critical** | D5 | ✅ Fixed *(verified 2026-09-20)* — PR #19 merged (`29d9bba`). The guard refuses draft create, update and submit on a `canonicalized` item; refused in the running app on a stale page, and `ANSWER-B-sneaky` reached neither the drafts nor the annotations table |
| 3 | Reviewer shown the wrong annotator's work | High | D4 | Open. No longer wholly blocked: per-author versions are settled, so review of a named submission can be built; only which version a release carries waits on follow-up F1 |
| 4 | Finalised item exports conflicting answers | **Critical** | H4 | Open |
| 5 | Reviewer corrections not saved | **Critical** | D3 | Open — unblocked 2026-09-15: a reviewer's correction is a version authored by the reviewer, kept beside the annotator's. D3 in W9 |
| 6 | Drafts have no ownership enforcement | **Critical** | D6 | ✅ Fixed *(verified)*; story complete |
| 7 | Annotators can approve their own work | **Critical** | D1 | Partial — approval paths guarded *(verified)*; dispute decisions are not: an admin can escalate and finalise their own work. The fix, SCRUM-86, moved from W7 to W8 on 2026-09-18 |
| 8 | Legacy review API rewrites approval history | **Critical** | D2 | ✅ Fixed *(verified 2026-09-14)* — all four legacy review writes return `410 Gone` (PR #6). D2 is not finished: subtasks 2 and 4 (item state always moves with the decision; a test that state and history cannot diverge) have no code or test |
| 9 | Cross-project / cross-org write bypass | High | G3 | ✅ Fixed *(verified 2026-09-14)* — PR #14 merged with cross-project write guards and tests; reviewed by Michael |
| 10 | Invalid status values saved | High | G4 | Fix merged in PR #9 on 2026-09-14 *(merge verified)*; closure check pending |
| 11 | Draft submission not atomic | High | D5 | ✅ Fixed *(verified 2026-09-20)* — PR #23 merged, on `main` through PR #19. Submission is one transaction and records `draft.annotation_id`; five tests fail on the previous commit and pass now |
| 12, 13 | Frontend typecheck and test failures | High | A2 | ✅ Closed |
| 14 | Backend export tests fail to run | High | H5 | ✅ Closed *(verified)* — `test_project_exports_route.py` collects and passes since A2 (`e0e642a`); H5's figure check remains |
| 15 | Dispute send-back not implemented | High | E2 | Fix merged in PR #17 on 2026-09-14 *(merge verified)*; closure check pending |
| 16 | Dataset registration not transactional | High | B5 | Fix merged in PR #11 *(merge verified on `origin/main`, 2026-09-16)*; closure check pending |
| 17 | Invitations completely broken | High | G5 | ✅ Fixed *(verified 2026-09-18)* — PR #16 merged (`8f1a7a0`); the invitation lifecycle is restored and completed in `bfa239e` and `041ffca` |
| 18 | Pending-invitation listing unreachable | High | G5 | ✅ Fixed *(verified 2026-09-18)* — PR #16 moved the listing to its own router at `/invitations`; `members.py` no longer registers `GET ""` under `/organizations`, so nothing shadows it |
| 19 | Completion and export disagree on "done" | High | B6 | Open |
| 20 | AI failures produce fake annotations | High | C3 | ✅ Fabrication removed *(verified)*; close-out tests in W9 |
| 21, 22 | Audit actor wrong; duplicated escalation entries | Medium | F4 | Open — verify #22 |
| 23, 24 | `.env` ignored; `init_data.py --reset` broken | Medium / High | A3 | ✅ Closed |
| 25, 26 | Vacuous frontend test; misleading backend mock | Low | A2 | ✅ Closed |
| 27 | Impossible `"approved"` status in export rule | Low | B6 | Open |
| 28 | Task can never leave `draft` | High | B4 | Open — unblocked 2026-09-17: the client left the lifecycle to us ("anything reasonable"). B4 in W8 |
| 29 | Intake 409 reported as 500 | Medium | B5 | Fix merged in PR #9 on 2026-09-14 *(merge verified)*; closure check pending |
| 30 | Task or project with items can never be deleted | Medium | B4 | Open *(reproduced 2026-09-17 on `17673c8`)* — both delete routes return `500` on a foreign-key error, for any task that has items, annotated or not. Found by Michael; not from the original audit. Needs the policy decision first: is a task holding review history deletable at all? |

**Six Critical defects: 3 fixed (2, 6, 8), 1 partial (7), 2 open (4, 5).**

PR numbers here and in `roadmap.md` refer to `USYD-CS-Capstone/hej`. `main`'s history also carries
merge commits from the inherited Arc Intelligence repository numbered #12–#72; those are different
pull requests.

## Risks

| Risk | Why it matters | Mitigation owner |
| --- | --- | --- |
| **Stories set aside (A1, A5, K1–K4).** The brief expects findings, decision records, a technical report and a demonstration (K1–K4); review is not enforced by CI or branch protection and `main` has taken direct commits, such as `d4d809c` on 2026-09-13 (A1); design docs and code use different state vocabularies (A5). | Brief deliverables are assessed, and K2 in particular is hard to reconstruct later. Without A1, the Definition of Done's independent review is enforced only socially; without A5, fixes in B4, B6, G4 and H5 can drift apart. | None for now, by decision (2026-09-14) — Hanchen revisits; see [Stories Set Aside](#stories-set-aside) |
| **The plan runs to W12 (ending 1 Nov) with less than one week of slack.** Since sprints end on Wednesday (2026-09-19), W12 is only four days, 29 Oct–1 Nov. The mid-semester break is a separate week between W8 and W9, with no feature work. Each person carries 1.5u–3.5u a week, with no cap on the team's total, and close-out of the previous week's review queue is not counted (decided 2026-09-14). W11 is planned at 13.5u, and W12 holds only 3u — J4 and the I5 integrity check — so most of that week absorbs carry-over. P0 H6 still lands only in W11 because it sits on W9–W10 work. | Carry-over beyond W12's free capacity, or a late client decision, pushes stories past the plan. | Replanning rule 2 at every weekly meeting; H6 first in W11 |
| **One client decision still blocks P0 work.** B4, D3 and E3 were all answered between 2026-09-15 and 2026-09-17. What remains is follow-up **F1**: with every author keeping their own version, which version does a release carry? | F1 gates D4 (SCRUM-27), F3 (SCRUM-38) and H4 (SCRUM-37) — 6u of P0 work across W8–W10 — and I4 behind them. The separable halves can still be built: per-author versions, keeping each actor's output distinct, and review addressing a named submission. Only "which one is authoritative" waits. Question 6, project-level access isolation, also remains open but blocks nothing scheduled. | Hanchen — ask F1 at the next client meeting, with F2, F3 and F5. Every blocked group in `roadmap.md` names a fallback, so a late answer does not leave a group idle |
| **There is no work queue of any kind (D8).** By the client's decision of 2026-09-17 there is also **no assignment**: a task owner does not hand items to named accounts. Work is self-served from role-checked queues, and the per-task annotator count limits how many people may submit on an item. | D7's sampling, E1, the E2 return-to-queue and I3 all need a queue to put work into. Independence — a reviewer never seeing their own work, a second review never returning to the first reviewer — now has to be a property of the queue query, because there is no assignee to encode it. RQ-607 ("annotators only see the minimum they need") is reinterpreted, not met by assignment. | SCRUM-48, the queue API, in W7 and SCRUM-93, the screens, in W8 — both Kanishka; the role-checked reviewer and adjudicator queues (SCRUM-52) in W9. The rescope reached Kanishka on 2026-09-17, mid-ticket |
| **Evaluation is a primary deliverable and is at zero.** | 40–60 cases cannot be written in one week; each story should contribute its own cases as it lands. | The mid-semester break sprint (1–7 Oct) has no feature work and builds the harness and casebook (SCRUM-68 to 70); its scenario tests are the first cases, and every group adds cases for its own tickets |
| **Release is the largest build gap.** H1–H6 depend on F1, F2, F3 and D4. | A slip in provenance or the canonical decision cascades into release. | The release groups, W9–W10 (SCRUM-64 to SCRUM-66, SCRUM-37) |
| **Governance gaps found in review (2026-09-13).** Project-scoped roles are defined but never honoured, so G3's "access to one project" cannot exist; an admin can escalate and self-finalise their own item. | G3 cannot close as the story reads; D1 criterion 3 is unmet. | D1 in W8 (SCRUM-86, moved from W7 on 2026-09-18); D2's remaining subtasks in W8 (SCRUM-29); product decision on project-scoped roles through Hanchen |
| **Parallel branches edit the same files.** B6 and SCRUM-48's API both change `task_service.py`. `DraftService.submit_draft` gains three refusals from three tickets — a finalised item (SCRUM-28), atomic submission (SCRUM-26) and the per-task submission limit (SCRUM-48) — and their order decides which message a user sees. In W8 and W9 several groups change the schema. | Late merges conflict and regress each other, and refusals landed in the wrong order give the wrong reason. | Hanchen and Kanishka agree the order of the `submit_draft` refusals and who merges first. Weeks with several schema changes agree one migration path on day one — which path depends on SCRUM-94's decision (see below) |
| **The database changes under everyone this week (SCRUM-94).** Parth moves the platform onto PostgreSQL while keeping SQLite, in W7's last days, days before W8's four schema changes. Its scope grew on 2026-09-18: the 10 test files that touch a database all hard-code in-memory SQLite, so CI could not reach Postgres until they are moved onto a shared fixture. | If the first merge slips past the weekend, it waits for the W9 boundary and W8's schema changes land on SQLite alone, to be redone after. Until the tests reach Postgres, nothing verifies it — including SCRUM-2's worker, which its author cannot run on Postgres locally. | Parth, on SCRUM-94 alone this week (SCRUM-51 moved to W8). Two merges: `database.py`, the fixture, CI and the schema-change decision before W8; moving the old tests early in W8. Everyone merges `main` and reruns the suite the day the first lands |
| **Records can mark a story complete ahead of its code.** D2 is marked complete while its subtasks 2 and 4 remain, and the board shows SCRUM-54 Done while no `AnnotationAssistant` interface exists on any branch. `story_src.csv` follows the tracker by decision. *Not* a case of this: a Contribution Log row logged for an unmerged PR. The tracker logs a PR when it is opened and leaves *Review OK?* blank until review passes (recorded 2026-09-18) — PRs #19–22 on 2026-09-18 were exactly that, and earlier reports that read them as "logged as merged" were wrong. | The tracker's Client Report is built from these records and can overstate progress; `user-stories.html` inherits the same gaps whenever `story_src.csv` is synced. | `tracking-sync` counts a story complete only when its row's *Review OK?* is `OK` — this kept D5, whose row is still pending review, out of the client view on 2026-09-18 — and flags only a reviewed row git shows unmerged. Beyond that, Hanchen reconciles tracker, board and `main` at each weekly sync, with the report as the checkpoint before the client view changes |

## How We Work

- **Language.** Discussion is in **Chinese** — team chat, meetings, and working with coding agents.
  Every written artefact is in **English**: specs, docs, code and comments, commit messages, PR
  descriptions, reviews and Jira text.
- **Status comes from the team's records; code is checked against them.**
  - **Live records.** Members log each PR in the contribution tracker, a shared online Google Sheet,
    **when it is opened**, and mark *Review OK?* once a reviewer passes it; until then the row is pending
    and the PR unmerged. They move tickets on the Jira board.
  - **Local snapshots.** `tracking-sync download` fetches both into `shared/` (since 2026-09-18; by hand
    before that). The copies can be behind the live sheet and board. `Jira.csv` is never edited;
    `tracking-sync` refreshes the tracker's snapshot tabs from it and may append log rows, which Hanchen
    copies back into the online sheet.
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
