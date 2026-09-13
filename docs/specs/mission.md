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
- **The CS-57 team** — Hanchen Wang, Jingwei Lin, Yi Geng, Kanishka Kathait, Michael Max, Parth,
  Dishank Aswal and Tim Chung — as the shared statement of what we are building and in what order.
- **Coding agents working in `hej`**, which should load `mission.md`, `tech-stack.md` and `roadmap.md`
  before writing a feature spec or touching code.

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
- [ ] **Every Critical defect in `stories/issues.md` closed**, and every defect left unfixed carries an
  argued decision rather than silence.
- [ ] **Findings documentation, per-member decision records, a technical report, and a live or recorded
  end-to-end demonstration.** See [Risks](#risks) — these currently have no backlog owner.

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

## Progress Snapshot — W6 (2026-09-13)

**Basis:** story status from `stories/current_user_stories.md`; entries marked *verified* were checked
against `origin/main` on 2026-09-13. Jira lags the code — D6 is merged but still "In Progress" — so
**git is the source of truth for status.**

### By epic

| Epic | Stories | Complete | In progress (W6) | Not started | Discarded |
| --- | --- | --- | --- | --- | --- |
| A — Trustworthy Foundations | 5 | A2, A3, A4 | — | — | A1, A5 |
| B — Setting Up Work | 6 | B1, B3 | B5 | B2, B4, B6 | — |
| C — AI-Assisted First Pass | 5 | — | C1, C3, C5 | C2, C4 | — |
| D — Review & Cross-Validation | 8 | — | D1, D2, D5, D6 | D3, D4, D7, D8 | — |
| E — Disagreement & Dispute | 6 | — | E2 | E1, E3, E4, E5, E6 | — |
| F — Provenance & History | 5 | — | F1 | F2, F3, F4, F5 | — |
| G — Roles, Permissions & Orgs | 5 | — | G1, G3, G4, G5 | G2 | — |
| H — Release & Export | 6 | — | — | H1–H6 | — |
| I — Evaluation | 5 | — | I1 *(Jira only)* | I2–I5 | — |
| J — Organisations & Dashboard | 4 | — | — | J1–J4 | — |
| K — Evidence & Handover | 4 | — | — | — | K1–K4 |
| **Total** | **59** | **5** | **13** | **35** | **6** |

### Defects (`stories/issues.md`)

| # | Defect | Severity | Story | Status on `main` |
| --- | --- | --- | --- | --- |
| 1 | Live API key hardcoded in source | Medium | A4 | ✅ Removed from code *(verified)*; provider rotation unconfirmed |
| 2 | Finalised annotation silently overwritten | **Critical** | D5 | Open — scheduled W7 |
| 3 | Reviewer shown the wrong annotator's work | High | D4 | Open — blocked on client decision |
| 4 | Finalised item exports conflicting answers | **Critical** | H4 | Open |
| 5 | Reviewer corrections not saved | **Critical** | D3 | Open — blocked on client decision |
| 6 | Drafts have no ownership enforcement | **Critical** | D6 | ✅ Fixed *(verified)*; story awaits status update and second review |
| 7 | Annotators can approve their own work | **Critical** | D1 | Partial — approval paths guarded *(verified)*; dispute decisions are not: an admin can escalate and finalise their own work |
| 8 | Legacy review API rewrites approval history | **Critical** | D2 | Partial — `PATCH` and `DELETE /reviews/{review_id}` and `POST /reviews/{review_id}/submit` still live *(verified)* |
| 9 | Cross-project / cross-org write bypass | High | G3 | Fix in PR #14, reviewed |
| 10 | Invalid status values saved | High | G4 | Fix in PR #9; bare `str` still on `main` *(verified)* |
| 11 | Draft submission not atomic | High | D5 | Open — scheduled W7 |
| 12, 13 | Frontend typecheck and test failures | High | A2 | ✅ Closed |
| 14 | Backend export tests fail to run | High | H5 | Likely closed — verify under H5 |
| 15 | Dispute send-back not implemented | High | E2 | Open — placeholder still on `main` *(verified)* |
| 16 | Dataset registration not transactional | High | B5 | Fix in PR #11 |
| 17 | Invitations completely broken | High | G5 | Fix on branch `CS57-Tim`, no PR yet |
| 18 | Pending-invitation listing unreachable | High | G5 | Likely closed — verify under G5 |
| 19 | Completion and export disagree on "done" | High | B6 | Open |
| 20 | AI failures produce fake annotations | High | C3 | ✅ Fabrication removed *(verified)*; story tests to confirm |
| 21, 22 | Audit actor wrong; duplicated escalation entries | Medium | F4 | Open — verify #22 |
| 23, 24 | `.env` ignored; `init_data.py --reset` broken | Medium / High | A3 | ✅ Closed |
| 25, 26 | Vacuous frontend test; misleading backend mock | Low | A2 | ✅ Closed |
| 27 | Impossible `"approved"` status in export rule | Low | B6 | Open |
| 28 | Task can never leave `draft` | High | B4 | Open — blocked on client decision |
| 29 | Intake 409 reported as 500 | Medium | B5 | Open — verify whether PR #11 covers it |

**Six Critical defects: 1 fixed, 2 partial, 3 open.**

## Risks

| Risk | Why it matters | Mitigation owner |
| --- | --- | --- |
| **Required deliverables have no backlog owner.** K1 technical report, K2 per-member decision records, K3 findings including negative results, K4 end-to-end demonstration — all *Discarded* in the backlog, yet all listed as expected outcomes in the brief. | Assessed, and impossible to reconstruct honestly in the final fortnight. K2 in particular must be written when decisions are made. | Hanchen to confirm with the client and unit who owns them; not scheduled in the roadmap |
| **No enforced review or CI.** A1 is discarded; `hej` has no CI workflow, PR template, CODEOWNERS or branch protection, and `main` has taken direct commits. | "Reviewed by someone other than the author" in the Definition of Done is enforced only socially. | Team; raise at weekly sync |
| **State vocabulary drift.** A5 is discarded; the design docs say `draft/active/paused/completed/archived` and `FINALIZED`, while the code says `canonicalized` and a different task set (inherited Risks 4 and 10). | B4, B6, G4 and H5 each fix a screen disagreement; against two vocabularies the disagreement returns. | Kanishka and Dishank, who own the status stories |
| **Client decisions block P0 work.** B4 (task lifecycle path), D4 (canonical annotation versus per-annotator submissions), D3 (who authors a reviewer's correction), E3 (where an item goes after a dispute). | D4 gates F3, H4 and I4; B4 gates task activation. | Hanchen — obtain in W7 |
| **Work assignment does not exist.** Task items have no assignee field (D8). | D7, E1, the E2 return-to-queue and I3 all assume it; RQ-607 ("annotators only see items assigned to them") is unmet. | Jingwei and Parth, W8 |
| **Evaluation is a primary deliverable and is at zero.** | 40–60 cases cannot be written in one week; each story should contribute its own cases as it lands. | Michael, from W7 |
| **Release is the largest build gap.** H1–H6 depend on F1, F2, F3 and D4. | A slip in provenance or the canonical decision cascades into release. | Dishank, Kanishka and Hanchen, W9–W10 |
| **Governance gaps found in review (2026-09-13).** Project-scoped roles are defined but never honoured, so G3's "access to one project" cannot exist; an admin can escalate and self-finalise their own item. | G3 cannot close as the story reads; D1 criterion 3 is unmet. | Jingwei; product decision on project-scoped roles |
| **Parallel branches edit the same files.** PRs #9 and #14 both touch `tasks.py`; D5 and the review stories share `DraftService`. | Late merges conflict and regress each other. | Merge open PRs in W7 before new work starts |

## How We Work

- **Language.** Discussion is in **Chinese** — team chat, meetings, and working with coding agents.
  Every written artefact is in **English**: specs, docs, code and comments, commit messages, PR
  descriptions, reviews and Jira text.
- **Status comes from git.** A story is done when it is on `main` and meets the Definition of Done in
  `tech-stack.md`, not when a ticket says so. `roadmap.md` is updated after each weekly sync.
- **Client and product decisions go through Hanchen**, and are written into the `hej` docs in the same
  change that relies on them. An example is the decision that there is no admin override on draft
  writes, recorded in `api_surfaces.md`.
- **Working features are stable by default.** UI style, authentication and anything that already works
  may be changed only with written justification agreed at review. Regenerating a subsystem because
  that is faster than reading it is not acceptable.
- **AI tools are permitted, and the member stays responsible.** Whoever submits AI-assisted work must
  be able to explain and defend every line without appeal to the tool.
- **Spec-driven feature work.** For each roadmap item:
  1. Create `docs/specs/YYYY-MM-DD-<story-id>-<slug>/` containing `plan.md` (task groups),
     `requirements.md` (scope, decisions, context) and `validation.md` (success criteria and merge
     readiness).
  2. Resolve open questions *before* writing those files.
  3. Implement in small, reviewable commits.
  4. Validate against `validation.md`.
  5. Mark the item done in `roadmap.md`, then replan the following week.
