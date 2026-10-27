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
| **Assist** | AI suggestions behind a replaceable, typed model interface; human-only and AI-first modes, with blind-then-reveal as an evaluation protocol for judgement tasks (client answer, 2026-09-21; clarified in GitHub issue #72, 2026-10-14: production mode and evaluation protocol are separate settings, and the pre-reveal judgement, AI suggestion and post-reveal judgement are kept as distinct stages) | OpenAI-compatible multi-provider client merged; AI failure is now explicit; no queue; two modes; the blind-then-reveal protocol is not built — SCRUM-73 (W10) builds it in full, decided 2026-10-14 rather than parking it as the client allowed |
| **Record** | Source and guideline version, annotation attempts, and what the human did with the AI's suggestion — captured as it happens | Generic activity log only; reviewer corrections are not persisted |
| **Adjudicate** | Review, disagreement and adjudication, keeping annotator label, reviewer decision and canonical judgement distinct | Draft ownership and approval self-checks in place; a fix for overwritable finalised results is in review; no work queue of any kind — and by the client's decision of 2026-09-17, no assignment either; dispute send-back merged. **Client answer R2-1 (2026-09-24):** an expert's adjudication is final — Accept, Return to the open workflow, or Reject — and an item may be resolved as ambiguous |
| **Release** | Immutable releases with manifests, gated *before* the release exists | Export is a status computed on the fly; no artefact, manifest or gate |
| **Evaluate** | Human-only versus AI-assisted annotation under repeatable conditions | Does not exist yet |

## Who We Serve

- **The client — Arc Intelligence (Hunter Xu).** Owns the platform, sets the brief, and decides product
  questions the team must not settle alone.
- **Project managers (task owners)** — configure projects, policies and tasks, and need to trust every
  number the platform shows them. One person under one name in these specs and the stories (decided
  2026-10-20): the code's role is `task_owner`, and the client's "project owner" (R2-3) means them too.
- **Annotators** — do first-pass work and need their unfinished work to stay theirs.
- **Reviewers** — accept, correct or reject work, and need to know whose work they are judging.
- **Experts (arbitrators)** — settle disputes, and need their decision recorded as its own fact. One person
  under one name (decided 2026-10-20): the code's role is `arbitrator`, which holds `adjudicate`, and both
  the Expert Gate's confirmation and a dispute's decision need it. The "adjudicator" of the adjudicator queue
  is the same person. "Expert gate" stays the name of the posture.
- **Organisation administrators** — manage members and roles, and need roles to actually govern.
- **Quality leads** — run evaluation and need evidence, not a single unexplained score.

## Target Audience

These specs are written for:

- **Hanchen Wang, project manager.** The purpose of this folder is to track the *whole team's*
  progress against the brief — every pillar, story and defect — not only the tickets allocated to one
  person.
- **The client (Arc Intelligence)**, who is shown progress through `shared/handover-dashboard.html` (the GitHub Pages
  site; it replaced `shared/user-stories.html` on 2026-10-26) — a view Hanchen curates locally and updates
  after the team's records, so it deliberately lags Jira and the tracker.
- **The CS-57 team** — Hanchen Wang, Jingwei Lin, Yi Geng, Kanishka Kathait, Michael Max, Parth,
  Dishank Aswal and Tim Chung (Tok Tin Chung in records before 2026-09-16) — as the shared statement of what we are building and in what order.
- **Coding agents working in `hej`**, which should load `mission.md`, `tech-stack.md` and `roadmap.md`
  before writing a feature spec or touching code. These files sit outside the repository, at
  `../docs/specs/` relative to `hej`, so an agent started inside `hej` must be pointed at them.

## What Success Looks Like

The brief's expected outcomes, stated as things we can check. **Checked on 2026-10-22 against `origin/main`
at `fd35571`**, where the casebook passes 85 of 85 running cases (1 skipped) and CI is green on SQLite and
PostgreSQL:

- [ ] **The full journey runs on realistic data** — project → policy → task → items → AI first pass →
  review → cross-validation → dispute → adjudication → release. **Not yet in one run.** EV-100 and EV-101
  carry a real Group A AG News record from intake through review, cross-review, dispute and adjudication
  to an export and to a release whose provenance reads back every stage, but their task is human-first.
  The AI first pass is covered apart: seven AI-assisted cases (EV-002, 010, 011, 081, 103, 104, 111) and
  I3's replay of 400 recorded model replies through the platform, none of which goes on to a release.
  Nothing yet joins the two; K4's demonstration on real screens is planned after W11.
- [x] **End-to-end provenance** — any released item shows its source, guideline version, AI suggestion,
  human response, reviews and adjudication, each with an actor and a time. F1 (#70) writes an immutable
  event at each decision point — source registered, AI suggested, human responded, reviewed, disputed,
  adjudicated, released, and the settlement and blind-then-reveal stages — with its actor and time; F2
  (#63) records the guideline and source version on each answer; F5 (#85) shows a finalised item's history
  as a graph to task owners and admins. EV-101 reads every stage back from a release, and
  `evaluation verify` checks every released item's history (I5, #79). Work from before F1 (16 Oct) has no
  events and is exempt from the release check by team decision (ADR 020).
- [x] **Immutable releases with export manifests**, refused before they exist when items are unreviewed,
  provenance is incomplete, or versions are superseded — never satisfiable by someone asserting that
  review happened. H1 (#65) freezes a release; H4 (#66) gives it one authoritative answer per item; H3
  (#83) refuses for five reasons, each read from a recorded fact, with a 409 that creates nothing; H2
  (#84) writes a manifest from which anyone can rebuild the release byte for byte (ADR 021, EV-122); H6
  (#86) shows a task's releases. "Superseded" is H4's reading: an answer under a superseded guideline or
  policy gives a warning, not a refusal (ADR 020).
- [x] **AI assistance behind a typed interface**, with mock and live modes interchangeable, and a
  failure never disguised as a suggestion. Every provider and analyzer goes through the
  `JsonCompletionClient` protocol (`app/integrations/analyzers/base.py`): six OpenAI-compatible providers
  live, a scripted client in the casebook and recorded replies in I3, swapped at that interface with no
  change to the workflow; there is no runtime mock switch. A failed call is recorded as an AI failure,
  never as a suggestion (defect 20; EV-002, EV-107).
- [x] **A reusable evaluation harness and a casebook of 40–60 end-to-end cases**, including adversarial
  ones, measuring quality, collaboration and integrity. 86 cases, above the brief's range: 85 run and
  pass, 1 is skipped (EV-018, until source versions exist); all 9 adversarial categories have a case and
  8 have one that runs; 16 of 16 owed protections are covered. Quality is I3 (#77: agreement coefficients
  and two recorded models against gold), collaboration I4 (#73: the blind-then-reveal measures) and
  integrity I5 (#79: `evaluation verify` and its tamper cases). CI compares every run with the committed
  baseline.
- [x] **Automated, integration, permission, provenance and end-to-end tests.** 141 backend test files,
  among them permission suites (`test_governed_action_permissions.py`, `test_permissions_scope.py`) and
  provenance suites (`test_provenance_*.py`); the 86 casebook cases run end to end through the real API
  with real logins and roles; 78 web test files. CI runs the backend suite and the casebook on SQLite for
  every non-draft PR, and on SQLite and PostgreSQL for every merge to `main`. Not covered: the web tests
  are not in CI, and no test drives a browser.
- [x] **Every Critical defect in `info/issues.md` closed**, and every defect left unfixed carries an
  argued decision rather than silence. All 30 numbered defects are closed on `main`, the six Critical
  ones included — #4, the last, by PR #66 on 16 Oct — so none is left needing an argued decision. See
  [Defects](#defects-infoissuesmd-code-view).
- [ ] **Findings documentation, per-member decision records, a technical report, and a live or recorded
  end-to-end demonstration.** Their stories (K1–K4) were set aside on 2026-09-14 and reopened on 2026-10-25 — see
  [Stories Set Aside](#stories-set-aside). The findings record is SCRUM-75 (PR #92, merged 22 Oct), and #105 (K1, no ticket) closed defects 1, 25 and 26 in it
  and brought the live docs in line with `main`; 25
  ADRs are on `main`, 20 of them naming an author, but there is no per-member decision record yet (K2);
  the technical report (K1) and the demonstration (K4) are written between 29 Oct and 1 Nov.

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

Four stories (K1–K4) were *Discarded* in the backlog and had no Jira ticket. **By decision on 2026-09-14 they
were set aside:** not scheduled in `roadmap.md`, not given feature specs, and not counted in
roadmap coverage.

**Hanchen reopened all four on 2026-10-25.** K3 is `working`: I5's findings record produces much of it. K1 is `working` through
the handover sweep (the tickets that replace Jira tickets with stories and PRs in the docs, the backend and the web). K2 is
complete: its record is the 25 ADRs in `docs/adr` and the oral defence presentation. K4 is complete: the full journey runs and the team
is recording the demonstration; it also holds the removal of distracting UI before the demonstration.

**All four are complete since 2026-10-26.** K1 by its tickets, SCRUM-133, 135 and 136 (#100, #103, #101), all Done;
K3 by Hanchen's decision, on I5's findings record (SCRUM-75, #92). K2 and K3 have no ticket, so the tracker counts them
done from `story_src.csv` (`tech-stack.md`, eighth hand change).

**A1 and A5 were set aside with them and reopened as complete on the same day.** Both describe how the
team works, and by then it had worked that way for weeks. Their text in `story_src.csv` now states what the team
did and nothing more. The Risks table keeps the A1 gap: `main` is not protected.

| Story | Title | Where it stands |
| --- | --- | --- |
| K1 | A reader can understand the system without us | No ticket. Tracked outside Jira since 2026-10-01; written in the days after build work ends (29 Oct–1 Nov) |
| K2 | Each of us can defend our own design decisions | No ticket. Tracked outside Jira since 2026-10-01, one slice per member |
| K3 | What didn't work is recorded as carefully as what did | I5's findings record (SCRUM-75, W11) produces much of this content |
| K4 | The end-to-end demonstration works when it matters | No ticket. Tracked outside Jira since 2026-10-01; the full journey runs on real screens after W11, and SCRUM-71's full-journey case runs it on realistic data through the API |

The brief still lists findings, decision records, a technical report and a demonstration among its
expected outcomes, so these appear under [Risks](#risks).

## Progress Snapshot — W11 (2026-10-26)

**Basis.** Two views are kept apart (decided 2026-09-14):
- **By epic follows `shared/story_src.csv`**, Hanchen's local, client-facing copy of the team's
  records. It is updated from downloaded snapshots of the Jira board and the tracker, so it lags
  both. A story the records mark complete is counted complete here even where the code does not bear
  it out.
- **The defect table and `roadmap.md`'s marks follow the code on `origin/main`.** Entries marked
  *verified* were checked between 2026-09-13 and 2026-09-30.

Where the two views disagree, both are shown and the gap is listed under [Risks](#risks).

### By epic (records view)

| Epic | Stories | Complete | In progress | Not started | Discarded |
| --- | --- | --- | --- | --- | --- |
| A — Trustworthy Foundations | 6 | A1, A2, A3, A4, A5, A6 | — | — | — |
| B — Setting Up Work | 8 | B1, B2, B3, B4, B5, B6, B7, B8 | — | — | — |
| C — AI-Assisted First Pass | 5 | C1, C2, C3, C4, C5 | — | — | — |
| D — Review & Cross-Validation | 9 | D1, D2, D3, D4, D5, D6, D7, D8, D9 | — | — | — |
| E — Disagreement & Dispute | 6 | E1, E2, E3, E4, E5, E6 | — | — | — |
| F — Provenance & History | 5 | F1, F2, F3, F4, F5 | — | — | — |
| G — Roles, Permissions & Organisations | 5 | G1, G2, G3, G4, G5 | — | — | — |
| H — Release & Export | 6 | H1, H2, H3, H4, H5, H6 | — | — | — |
| I — Evaluation | 5 | I1, I2, I3, I4, I5 | — | — | — |
| J — Organisations & Dashboard | 4 | J1, J2, J3, J4 | — | — | — |
| K — Evidence & Handover | 4 | K1, K2, K3, K4 | — | — | — |
| **Total** | **63** | **63** | **0** | **0** | **0** |

**Every story is complete (2026-10-26).** Hanchen marked K3 complete: I5's findings record (SCRUM-75, #92) is merged.
K2 and K3 have no ticket, so the tracker's *Lists* now reads a story with no ticket as Done when `story_src.csv`
marks it `done` (rule in `tech-stack.md`, eighth hand change); the tracker's P1 row reads 23 of 23. Its Dashboard
and Client Report now count distinct merged PRs (93 logged; GitHub has 95, with #3 and #15 merged into another PR's
branch) and stories done on the same basis (ninth hand change). The GitHub Pages site opens
`shared/handover-dashboard.html`, which replaced `shared/user-stories.html` and its Connect CSV editor the same day.

**Synced again on 2026-10-26** (board export of 03:37): the counts are unchanged. #104 (SCRUM-139, D9's reopen history
entry) merged on 26 Oct, approved by Yi, so every pull request is merged and none is open. D9 is allocated to Jingwei and
Hanchen. The board still links SCRUM-139 to no story; `docs/handover/ticket-map.md` maps it to D9.

**After #105 (merged 26 Oct, 12:40 UTC, `6b6a3fea`):** the counts are unchanged, 63 of 63. #105 (K1, Hanchen, no ticket;
Yi approved it at `5a97ba55` and merged it) is the last pull request and, like #104, leaves none open; GitHub then shows 100 pull requests, 96 of them merged.
- **Findings record.** Defects 1, 25 and 26 are closed in `evaluation-findings.md` v1.2. The Gemini API refused the
  committed key with HTTP 401 on 26 Oct, so the incident is closed (§7); the check does not show when or by whom the
  key was revoked, and the key stays in git history. Defects 25 and 26 were fixed by A2's `e0e642ac` (#2).
- **Docs.** The docs nobody maintained (the client's March brief, the plan-era planning and PR specifications, the
  process maps, the architecture overview and `design/ds/`: 81 files) moved unchanged into `hej/docs/archive/`. The live
  design docs, terminology, `AGENTS.md` and the three READMEs (root, API, web) were checked against `main`, and
  `hej/docs/README.md` maps them. `tech-stack.md` follows (hand change, 2026-10-26: its Docs Sync table, repository map
  and the architecture-overview references).
- **One web string, found in the demonstration recording (Jingwei).** The review panel said "Dual sign-off complete
  (2/2)" in a Standard project too, whenever an answer drawn for a blind second review got its second approval (D7).
  It now says "All required approvals received (2/2)", with a test. The other three findings of that recording are not
  built: a release shows "Created by user #N" because the release read carries no name; the Exports tab lists a task's
  live export beside each frozen release by design; and the seeded `d1-extra` item row in the API README was corrected.
- **Tests on `main` after #105:** backend 2,495 passed and 62 skipped on SQLite (two comments and `.env.example` changed, no behaviour), web 1,051
  passed in 110 files (one more than before, the banner test), casebook unchanged at 87 of 87 running cases. GitHub did
  not run them (see the CI row under Risks), so Hanchen ran the three CI jobs on `6b6a3fea` on 26 Oct: SQLite as above,
  PostgreSQL 18 in a Docker container 2,554 passed and 3 skipped, the case-coverage check 16 of 16 owed protections,
  typecheck clean, lint 0 errors and 38 warnings. One full web run exited 1 with all 1,051 tests passing: a timer in
  `RefreshButton` fired after `task-finalized-desk.test.tsx` had torn down (`window is not defined`); a rerun and three
  runs of that file alone were clean, so it is a race, not a failing test.
- **Left for the weekly sync:** #105 has no Contribution Log row yet; `story_src.csv`'s A5 criterion 4 now cites the
  integration contract at its new path (`docs/design/backend/integration_contract.md`).

**Synced on 2026-10-26** (board export of 00:11): every ticket on the board is Done, so K1, whose tickets are the handover
sweep's SCRUM-133, 135 and 136, is complete by the rule (Hanchen, 2026-10-26); K3 is the one story in progress.
SCRUM-139 is Done on the board while #104 is still a draft.

**Synced again on 2026-10-25** (board export of 23:57 on 25 Oct): the counts are unchanged. A5's ticket SCRUM-134 (#102,
widened to retire the legacy item escalations) is Done, and A5 is allocated to Hanchen; K4 now links SCRUM-128 (#97, the UI
declutter), as the board does, and is allocated to Jingwei. SCRUM-139 (#104, draft) fixes D9's reopen history
entry; D9 stays complete. SCRUM-136 (#101) and SCRUM-135 (#103) merged the same evening, though the export still shows them In Review
and In Progress; #104 is the last open pull request.

**Synced on 2026-10-25** (board export of 23:37 on 24 Oct): I5 (SCRUM-75, #92) and A6 (SCRUM-121, #98, merged 24 Oct) are
complete, and A1 and A5 were reopened as complete by decision (Hanchen). K1–K4 were reopened the same day: K1 and K3 are in
progress (K1 through the handover sweep tickets SCRUM-133, 135 and 136). K2 and K4 were then marked complete on 2026-10-25 (Hanchen): K2 on the 25 ADRs and the oral defence presentation, K4 because the team is recording the demonstration. The notes below are as of 22 Oct.

**Synced on 2026-10-22** (board export of 01:14). **Four stories became complete**, and none is left unstarted:
- **19 Oct:** F5, SCRUM-106, PR #85 (`e95a3a7`), a finalised item's history as a graph.
- **20 Oct:**
  - H6, SCRUM-108, PR #86 (`bb45fe1`), a task's releases on the Finalized page;
  - J1, SCRUM-88, PR #75 (`17469db`), one stable organisation identity.
- **21 Oct:** J4, SCRUM-45, PR #80 (`f3dfdc1`), updating and archiving a project.

Also merged, in stories already complete or still in progress: I3's coefficients (SCRUM-72, #77, 19 Oct), the
settlement of a held disagreement (SCRUM-126, #88, 20 Oct; G2 and E5), the release review follow-ups (SCRUM-104/105,
#90, 20 Oct), I5's integrity checks (SCRUM-74, #79, 20 Oct) and the review-chip fix (SCRUM-129, #94, 22 Oct; D3).

**In progress:**
- I5's findings record (SCRUM-75, Kanishka, PR #92, in review);
- A6, whose SCRUM-121 is back on the board (Hanchen, 1 point, W11, in progress).

**Notes:**
- **ADR 020's three choices are the team's design** (Hanchen, 2026-10-19), not a client answer:
  - an answer under a superseded guideline or policy version gives a warning, not a refusal;
  - work from before F1 is exempt from the provenance check;
  - a finalised item with no authoritative answer is refused until it is reopened.
- **Every development PostgreSQL database needs `init_data.py --reset`**, because #63 and #84 add tables and
  columns.
- **On the board, SCRUM-73 now names stories A1 and H5 as well as I4**, so their ticket lists gained SCRUM-73.
  Check this with Jingwei. SCRUM-125 (Parth) also names A1 and H5, which is why H5's board status reads in
  progress.
- **PRs #65 and #78** are merged but still await their review record in the tracker.
- **Later on 19 Oct:**
  - #77 (I3) and #85 (F5) merged. F5 was narrowed by team decision to finalised items, for project managers (task owners) and
    admins, with its story rewritten in `story_src.csv`.
  - **SCRUM-126** (Jingwei; G2 criterion 3, E5) was added to make the postures differ as R2-8 asks. A reviewers'
    split held under Standard or dual sign-off may be settled by an independent reviewer. Arbitration-ready and
    the Expert Gate still go to an expert, and an escalation is never settled. It is the team's design, ADR 022.
    It reopens G2 and E5 in the records until it merges, planned for 20 Oct.
  - **Synced again** (board export after 20:02). I3 is complete. G2 and E5 gained SCRUM-126, and A4 gained
    SCRUM-125. G2 and E5 stay complete in `story_src.csv`, which never downgrades a `done` automatically. The
    board shows them in progress until SCRUM-126 is Done.
  - **SCRUM-73's description was restored.** On 2026-10-14 at 23:38, SCRUM-125's text had been pasted over it by
    mistake, and that is why A1 and H5 picked up SCRUM-73. It was restored from the issue's history on 19 Oct, and
    the two wrong links were removed from `story_src.csv`.

**Synced again on 2026-10-14** (board export of 20:02). **SCRUM-122 (E2) is Done:** PR #69 merged at 08:48 UTC (`5ef9202`), approved by Hanchen after five review rounds; every development database needs `init_data.py --reset`. **SCRUM-118 (G2, the Expert Gate) is now Yi's.** SCRUM-107 (E5, Yi) is To Do: on `main` a dispute already closes only by an independent adjudication under every posture, and the posture can be chosen when creating a project, but nothing enforces `expert_gate_required` yet, so its confirmation screen and the item's "waiting at the gate" state wait for SCRUM-118. No change to the epic table.

**Synced on 2026-10-14** (board export of 18:45). F4 and I2 became complete: SCRUM-40 is Done after PR #68 (2026-10-13) and SCRUM-71 after PR #71 (2026-10-14, `f6f8eb0`, approved by Hanchen; 57 cases, 48 running); I2 is now Hanchen's and Jingwei's. SCRUM-123 (A3) merged as PR #67 (2026-10-14) but is still In Review on the board. SCRUM-98 (F1, Parth) is In Review as PR #70. SCRUM-45 (J4) and SCRUM-73 (I4) lost their assignee (Jingwei) and are unassigned for W10. The W10 sprint is named "W10 Gate releases, prove them". **SCRUM-122 (E2, Yi, PR #69):** the team decided on 2026-10-14 that a reviewer's Return or Reject on an AI first pass goes to a person (no AI retry), that an expert's dispute Reject keeps `main`'s rule (no replacement; a single answer ends `unresolved`), that AI-assisted tasks have exactly one annotator, and that an expert's Return goes to the author or to a new annotator with an optional context cutoff; #69 is in its fourth review round, one fix left. E2 stays complete in the records while SCRUM-122 is open.

**Synced on 2026-10-13** (board export of 22:48). C5, D1, D2, E1, E6 and I1 became complete: SCRUM-49 and SCRUM-86 are Done, SCRUM-109 after PR #60 (2026-10-13), SCRUM-103 after PR #64 (2026-10-12), and SCRUM-69 and 70 after PRs #62 and #51 (2026-10-12). SCRUM-37 (H4, PR #66), SCRUM-102 (H1, PR #65) and SCRUM-123 (A3, PR #67) are In Review; SCRUM-91 (B1) is In Progress. **SCRUM-124 was added** (D3 and E3, Dishank, W10): an expert can accept a reviewer's correction, the team's decision of 2026-10-12; E3 stays complete in the records, while its board status is in progress again. **SCRUM-123** (A3, Jingwei, PR #67) seeds the named test cast; A3 likewise stays complete. SCRUM-122 (E2, Yi) moved to W9 and is In Progress. The board's sprints were set to where the work was done (deliberate): SCRUM-32, 41, 87, 99 and 100 sit in the break sprint, SCRUM-68 in W8, SCRUM-27 in W7. SCRUM-72 (I3) went to Jingwei. SCRUM-74, 75, 88, 107 and 108 moved from W11 to W10 on the board.

**Synced on 2026-10-12** (board export of 00:41). C4, E3 and E4 became complete: SCRUM-87 (PR #59, 2026-10-10)
and SCRUM-99, 100 and 101 (PR #48, 2026-10-11) are Done, and SCRUM-52, shared with E3, already was. F1 and F2 are
in progress: SCRUM-98 In Progress, SCRUM-53 In Review as PR #63. SCRUM-32 (D3) is Done after PR #58 (2026-10-09), yet
D3 stays in progress in the records because its tracker row still awaits its review record. SCRUM-103 (E6) moved to
W9 and is In Review. **SCRUM-122 was added** (E2, Yi, W10, 1.5 points): a returned or rejected AI first pass goes to a
human annotator, the team's own design for issue #38 with no AI retry; E2 stays complete in the records, since a
complete story is never downgraded automatically, so whether it goes back to working is Hanchen's call. **SCRUM-91
(B1) grew to 1 point and SCRUM-40 (F4) to 1.5**: the Create project form offers only the first organisation, and the
intake's audit description overflows its 255-character column on PostgreSQL (found by Yi in PR #48). B1 is likewise
complete in the records while SCRUM-91 is To Do. SCRUM-121 (A6) has no assignee since Hanchen released it.

**Synced on 2026-10-09** (board export of 01:03). SCRUM-85 is Done after PR #61 merged (`891fc4b`): B3's
result-shape check on submit, and D8 subtask 2's web half, the required-annotators count. B3 was already
complete in the records, so only its `allocated_to` changed: Jingwei was added beside Yi, the ticket's earlier
assignee. H1 and H4 are in progress: SCRUM-102 and SCRUM-37 moved to In Progress. On the board, F5 went to Yi
and I4 to Jingwei, and SCRUM-99 and 100 moved from the break sprint to W9.

**Synced on 2026-10-07** (board export of 23:35). D7, D8 and J3 became complete: SCRUM-51, 52, 93 and 115 are
Done after PRs #53, #49 and #56 merged. J3 is complete by the board rule although #56's tracker row still awaits its
review record. C4 is in progress (SCRUM-87 in review as #59). A6 gained SCRUM-121, its W10 remainder. On the board
F1 (SCRUM-98) moved from Hanchen to Parth and I1's SCRUM-69 from Yi to Hanchen; F1's `allocated_to` became Parth
alone by a hand change (`tech-stack.md` → *Tracking data*).

**Synced on 2026-10-06** (board export of 21:24; the tracker as corrected the same day). A6, F4 and J2 are in
progress: SCRUM-119 in review as PR #54, SCRUM-41 as PR #57 and SCRUM-89 In Progress. Both PRs merged later that
day (#54 at 09:52 UTC, #57 at 11:05 UTC), after the export, so the next sync moves their tickets on. The tracker's
Contribution Log was corrected by hand: missing *Defects closed*, *What changed* and *Story complete?* entries
filled in, and *Story complete?* now marks the PR that finished each story's last ticket. The tracker had
marked D8 complete with SCRUM-117; it no longer does, since SCRUM-52 and SCRUM-93 are still in review. The Client Report's per-member *Stories involved*
counts every story a member logged a PR on, not only the ones they finished, and every story range now
reaches B7, B8, D9 and A6.

**Synced again on 2026-10-05.** D9 became complete when SCRUM-120 reached Done (PR #50, after SCRUM-110's
PR #46); D3 is in progress since SCRUM-32 moved to In Progress, with its scope agreed the same day: a reviewer's
correction is a proposal kept beside the answer, which becomes the item's answer only through an independent
expert's Accept or the annotator adopting it (story D3 rewritten). The W9 owners are on the board, and
`allocated_to` was brought in line with the board's assignees by a one-off hand change (`tech-stack.md` →
*Tracking data*).

**Synced on 2026-10-04.** D4, D5 and F3 became complete when SCRUM-113, 114, 116 and 38 reached Done (PRs
#43, #44, #45, #47); D1, E3, E4, E6 and I2 are in progress. **A6 was added on 2026-10-04** (Hanchen's decision):
the performance investigation measured that a 200-item Annotate page sends 404 requests and runs 6,882 SQL
statements (2,969 ms) — no single statement is slow — and A6 makes a dataset-sized task open without a wait.
Its first ticket is SCRUM-119 (W9); SCRUM-120 (break, D9) fixes a reopened item being flipped to expert
send-back by the next read, found by the same investigation.

Synced from the Jira board and the tracker on 2026-10-01. B4 and B7 became complete when PR #41 (2026-09-30)
and PR #42 (2026-10-01) merged; D7 and E1 are in progress since SCRUM-51 moved to In Progress. **G2 went back
to working by hand on 2026-10-01** (`tech-stack.md`): its enforcement was split from SCRUM-107 into SCRUM-118
(W10). B1 and B3 are complete in the records while SCRUM-91 and SCRUM-85 are To Do — both are verification
tickets in W9; G1 is complete in the tracker while SCRUM-52, which it shares with D8, E3 and E6, is To Do.

**W9–W11 replanned on 2026-10-01** (`roadmap.md`): W11 is the last sprint and build work ends on 28 Oct; F1
moved to W9 ahead of the release work; story points set from subtasks, complexity and risk. Loads: the
break 19.5, W9 18 on the board, W10 17.5, W11 7.

**Merged on `main` since the 2026-10-06 sync** (checked on GitHub and `origin/main` `1dcbcdf`, 2026-10-07; the
table above reflects them since the sync of 2026-10-07):
- #53 (D7, E1, D8, E3 — SCRUM-51 and 52) on 2026-10-06, approved by Jingwei, Yi and Hanchen. It carries
  SCRUM-51's whole scope: the blind second review, the disagreement comparison and its stored flag, and the W9
  slice as well — sampling by B2's cross-review percentage and `GET /tasks/{id}/cross-review-report`. SCRUM-52's
  adjudicator independence guards both the adjudication queue and `decide_escalation`.
- #49 (D8, SCRUM-93) and #56 (J3, SCRUM-115) on 2026-10-07, both approved by Jingwei.

With these, every ticket of D8 and J3 is on `main`.

**In review** (on GitHub, 2026-10-07): PR #58 (D3, SCRUM-32), #59 (C4, SCRUM-87) and #60 (D2, SCRUM-109), none
reviewed yet; #51 (I2, SCRUM-70) is a draft. #48 (E3/E4, SCRUM-99/100) is a draft, still waiting on issue #40, and
Jingwei requested changes on 2026-10-07 (six points, among them an expert's Accept refused on an item with two
answers). Merged before the sync: #52 (D8, SCRUM-117) on 2026-10-05; #39 (I1, SCRUM-68), #54 (A6) and #57 (F4) on
2026-10-06. #39 and #57 still have no reviewer in the tracker — a record check for the weekly sync.

### Defects (`info/issues.md`, code view)

| # | Defect | Severity | Story | Status on `main` |
| --- | --- | --- | --- | --- |
| 1 | Live API key hardcoded in source | Medium | A4 | ✅ Closed — removed from code *(verified; every provider key in `config.py` defaults to `None`)*. The Gemini key was treated as revoked at the provider on 2026-10-14 (Hanchen's decision); on 2026-10-26 the Gemini API refused it with HTTP 401, so it grants no access, and the findings record (`evaluation-findings.md` §7, #105) closes the incident on that check. The check does not show when or by whom the key was revoked; the key stays in git history and must never be reused. SCRUM-55 replaced the Gemini call, so the key is no longer used |
| 2 | Finalised annotation silently overwritten | **Critical** | D5 | ✅ Fixed *(verified 2026-09-20)* — PR #19 merged (`29d9bba`). The guard refuses draft create, update and submit on a `canonicalized` item; refused in the running app on a stale page, and `ANSWER-B-sneaky` reached neither the drafts nor the annotations table |
| 3 | Reviewer shown the wrong annotator's work | High | D4 | ✅ Fixed *(verified 2026-09-26)* — PR #34 merged (`7c84ce9`): a review names the submission it acts on, and is refused (`409`) on an item with several when none is named; the review read names whose submission it shows and returns that submission's own review; the web panel sends the submission it shows. Which version a release carries is H4's rule (R2-2) |
| 4 | Finalised item exports conflicting answers | **Critical** | H4 | ✅ Fixed *(verified 2026-10-22 on `fd35571`: casebook 85/85 running cases pass)* — PR #66 (SCRUM-37) merged 2026-10-16 (`9744b90`), approved by Jingwei after three rounds of requested changes. The export carries one authoritative answer per item, none for an item resolved as ambiguous, and keeps every other version as history; the per-creator export slot (`latest_annotations_by_item_and_creator`) is gone. Closed by EV-068 (one authoritative answer, and only after a choice) and EV-069 (the export carries only the chosen answer). Since #83 the release gate also refuses a finalised item with no authoritative answer (ADR 020) |
| 5 | Reviewer corrections not saved | **Critical** | D3 | ✅ Fixed *(verified 2026-10-14 on `5ef9202`: casebook 52/52 running cases pass)* — PR #58 (SCRUM-32, 2026-10-09) keeps a correction whole beside the answer, never counted as one; regression case EV-070 (PR #71). An expert accepting a correction is SCRUM-124 (W10) |
| 6 | Drafts have no ownership enforcement | **Critical** | D6 | ✅ Fixed *(verified)*; story complete |
| 7 | Annotators can approve their own work | **Critical** | D1 | ✅ Fixed *(verified 2026-10-14 on `5ef9202`: casebook 52/52 running cases pass)* — regression cases EV-001, EV-021, EV-022, EV-023 and EV-063 (PR #71), the last for #48's adjudication record. *(Earlier, verified 2026-10-07 on `1dcbcdf`:)* Approval paths were already guarded. Both dispute paths are guarded now: `route_escalation` refuses anyone who annotated the item (SCRUM-116, PR #45), and `decide_escalation` refuses anyone who annotated, reviewed or routed it, administrators included, with `403` before any write (SCRUM-52, PR #53, `adjudication_conflict_item_ids`). The deciding half came from SCRUM-52, not SCRUM-99 as planned on 2026-09-30. SCRUM-86, the container, still closes only when SCRUM-116 and SCRUM-99 are Done; the closure check also asks whether #48's adjudication record calls the same rule |
| 8 | Legacy review API rewrites approval history | **Critical** | D2 | ✅ Fixed *(verified 2026-09-14)* — all four legacy review writes return `410 Gone` (PR #6). D2 is not finished: subtasks 2 and 4 (item state always moves with the decision; a test that state and history cannot diverge) have no code or test |
| 9 | Cross-project / cross-org write bypass | High | G3 | ✅ Fixed *(verified 2026-09-14)* — PR #14 merged with cross-project write guards and tests; reviewed by Michael |
| 10 | Invalid status values saved | High | G4 | ✅ Fixed *(verified 2026-10-14 on `5ef9202`: casebook 52/52 running cases pass)* — PR #9 (2026-09-14); closed by EV-046 (PR #71) |
| 11 | Draft submission not atomic | High | D5 | ✅ Fixed *(verified 2026-09-20)* — PR #23 merged, on `main` through PR #19. Submission is one transaction and records `draft.annotation_id`; five tests fail on the previous commit and pass now |
| 12, 13 | Frontend typecheck and test failures | High | A2 | ✅ Closed |
| 14 | Backend export tests fail to run | High | H5 | ✅ Closed *(verified)* — `test_project_exports_route.py` collects and passes since A2 (`e0e642a`); H5's figure check remains |
| 15 | Dispute send-back not implemented | High | E2 | ✅ Fixed *(verified 2026-10-14 on `5ef9202`: casebook 52/52 running cases pass)* — PR #17 (2026-09-14), then the expert's Return in #48; closed by EV-040 and EV-061 (PR #71). Since #69 the expert returns to the author or to a new annotator |
| 16 | Dataset registration not transactional | High | B5 | ✅ Fixed *(verified 2026-10-14 on `5ef9202`: casebook 52/52 running cases pass)* — PR #11 (2026-09-16); closed by EV-047 and a unit test that injects a mid-write failure (PR #71) |
| 17 | Invitations completely broken | High | G5 | ✅ Fixed *(verified 2026-09-18)* — PR #16 merged (`8f1a7a0`); the invitation lifecycle is restored and completed in `bfa239e` and `041ffca` |
| 18 | Pending-invitation listing unreachable | High | G5 | ✅ Fixed *(verified 2026-09-18)* — PR #16 moved the listing to its own router at `/invitations`; `members.py` no longer registers `GET ""` under `/organizations`, so nothing shadows it |
| 19 | Completion and export disagree on "done" | High | B6 | ✅ Fixed *(code checked 2026-10-14 on `5ef9202`)* — SCRUM-43: `complete_task` refuses until every item passes `is_task_item_export_eligible`, the same predicate the export package counts (`task_service.py`, `project_exports_service.py`). H5's check that the export figures match the task screens remains: SCRUM-125 (W10, added 2026-10-14) |
| 20 | AI failures produce fake annotations | High | C3 | ✅ Fixed *(verified 2026-10-14 on `5ef9202`: casebook 52/52 running cases pass)* — fabrication removed; closed by EV-002 (PR #71): a failed run leaves the person's answer as the item's only one |
| 21, 22 | Audit actor wrong; duplicated escalation entries | Medium | F4 | ✅ Fixed *(code checked 2026-10-14 on `5ef9202`; tests not re-run)* — #22 by SCRUM-41 (PR #57, 2026-10-06), pinned by `test_history_without_repeats.py`; #21 by SCRUM-40 (PR #68, 2026-10-13): history reads each entry's stored `actor_kind` and filters to people (`task_audit_log_query.py`), pinned by `test_history_actor_kinds.py` |
| 23, 24 | `.env` ignored; `init_data.py --reset` broken | Medium / High | A3 | ✅ Closed |
| 25, 26 | Vacuous frontend test; misleading backend mock | Low | A2 | ✅ Closed — fixed by A2's `e0e642ac` (#2); the findings record (`evaluation-findings.md`, #105) closes both, with their tests passing on `main` |
| 27 | Impossible `"approved"` status in export rule | Low | B6 | Fixed on `main` *(verified 2026-10-01)* — `EXPORT_ELIGIBLE_TASK_ITEM_STATUSES` holds only `canonicalized`; closure check with SCRUM-105 (H3, W10) |
| 28 | Task can never leave `draft` | High | B4 | ✅ Fixed *(verified 2026-10-01)* — PR #41 merged (`75c27f2`): `draft → active → completed` with `paused`, each step a `MANAGE_TASK` endpoint (`activate`, `pause`, `resume`, `complete`); intake closes once a task is active, and the AI first pass runs on activation |
| 29 | Intake 409 reported as 500 | Medium | B5 | ✅ Fixed *(verified 2026-10-14 on `5ef9202`: casebook 52/52 running cases pass)* — PR #9 (2026-09-14); closed by EV-048 (PR #71) |
| 30 | Task or project with items can never be deleted | Medium | B4 | ✅ Fixed *(verified 2026-10-01)* — PR #41 merged: no cascade; a task holding items, or a project holding tasks, is refused with a message naming why (`task_service.py`, `project_service.py`), never a `500`. Archiving (J4, SCRUM-45, W10) is the way to retire such a project |

**Six Critical defects: all 6 fixed (2, 4, 5, 6, 7, 8).** *(Updated 2026-10-22: #4 closed by PR #66, verified on `fd35571`.)* *(Corrected 2026-10-14: #5 and #7 were verified on `5ef9202` the same day.)* Every other numbered defect is closed on `main`, so all 30 are.

PR numbers here and in `roadmap.md` refer to `USYD-CS-Capstone/hej`. `main`'s history also carries
merge commits from the inherited Arc Intelligence repository numbered #12–#72; those are different
pull requests.

## Risks

| Risk | Why it matters | Mitigation owner |
| --- | --- | --- |
| **Review before merge is held only by agreement.** The brief expects findings, decision records, a technical report and a demonstration (K1–K4); all four are complete in the records since 2026-10-26. A1 and A5 were reopened as complete on 2026-10-25, but A1 describes a practice, not a control: `main` is not protected (branch protection is not available on this repository's GitHub plan) and has taken direct commits, such as `d4d809c` on 2026-09-13. | Brief deliverables are assessed, and K2 in particular is hard to reconstruct later. The Definition of Done's independent review is enforced only socially. | K1–K4 were set aside on the board by decision (2026-09-14) and reopened on 2026-10-25. **2026-10-01:** K1, K2 and K4 — technical report, per-member decision records, demonstration — are tracked outside Jira in the team's own documents (Hanchen); build work ends on 28 Oct, leaving 29 Oct–1 Nov for them. K3's content comes from I5's findings record (SCRUM-75). **2026-10-26:** K1–K4 complete (K1 by its tickets, K3 by decision). See [Stories Set Aside](#stories-set-aside) |
| **Build work ends with W11 on 28 Oct, and nothing follows it.** W11 is the last sprint (decided 2026-10-01); the days to the project's end on 1 Nov carry no sprint. The mid-semester break is a separate week between W8 and W9, with minimal feature work. Each person carries 1.5u–3.5u a week, with no cap on the team's total, and close-out of the previous week's review queue is not counted (decided 2026-09-14). Replanned on 2026-10-01: F1 moved to W9 so the W10 release work reads its events, H4 and F4 to W9, F5 to W10; loads are W9 23.5u (owners set 2026-10-05, with SCRUM-101, 119 and 69 added and SCRUM-40 moved to W10), W10 18.5u (with G2's enforcement, SCRUM-118, split from E5) and W11 7.5u including the I5 integrity check. P0 H6 still lands only in W11 because it sits on W9–W10 work. | Carry-over beyond W11's free capacity, or a late client decision, is not built at all. | Replanning rule 2 at every weekly meeting; H6 first in W11; J1 is the first to drop |
| ~~**One client decision still blocks P0 work.**~~ **Closed 2026-09-24:** the client's Round 2 answered F1 (R2-2: one authoritative output plus the complete history), F2, F3 and F5, so no P0 work waits on the client; D4, F3 and H4 lose their ⏳. *Kept for the record:* B4, D3 and E3 were all answered between 2026-09-15 and 2026-09-17. What remained was follow-up **F1**: with every author keeping their own version, which version does a release carry? | F1 gates D4 (SCRUM-27), F3 (SCRUM-38) and H4 (SCRUM-37) — 6u of P0 work across W8–W10 — and I4 behind them. The separable halves can still be built: per-author versions, keeping each actor's output distinct, and review addressing a named submission. Only "which one is authoritative" waits. Question 6, project-level access isolation, also remains open but blocks nothing scheduled. | Hanchen — ask F1 at the next client meeting, with F2, F3 and F5. Every blocked group in `roadmap.md` names a fallback, so a late answer does not leave a group idle |
| **There is no work queue of any kind (D8).** By the client's decision of 2026-09-17 there is also **no assignment**: a project manager (task owner) does not hand items to named accounts. Work is self-served from role-checked queues, and the per-task annotator count limits how many people may submit on an item. | D7's sampling, E1, the E2 return-to-queue and I3 all need a queue to put work into. Independence — a reviewer never seeing their own work, a second review never returning to the first reviewer — now has to be a property of the queue query, because there is no assignee to encode it. RQ-607 ("annotators only see the minimum they need") is reinterpreted, not met by assignment. | SCRUM-48, the queue API, in W7 and SCRUM-93, the screens, in W8 — both Kanishka; the role-checked reviewer and adjudicator queues (SCRUM-52) in W9. The rescope reached Kanishka on 2026-09-17, mid-ticket. **2026-09-26:** the queue API is in review — PR #33 with Hanchen's fixes in PR #35 — and not yet on `main`. The review queue decides per submission: it never offers an item to someone who annotated it, and never offers a submission's second approval to its first approver. D7's sampling builds on that query. **2026-10-07: every D8 ticket is on `main`** — the queue API (#33, #35), the panel and the review chooser (#43, #44), resubmission rules (#52), the available-work list (#49), and the second-review and adjudicator queues (#53) |
| ~~**Evaluation is a primary deliverable and is at zero.**~~ **Mitigated 2026-10-14:** the casebook holds 60 cases on `main`, 52 running (PRs #51, #62, #71, #69); every adversarial category has a case and 4 of 9 run; all 16 protections SCRUM-71 owes are covered. What remains is measurement: I3 and I4 in W10. | 40–60 cases cannot be written in one week; each story should contribute its own cases as it lands. | The mid-semester break sprint (1–7 Oct) has no feature work and builds the harness and casebook (SCRUM-68 to 70); its scenario tests are the first cases, and every group adds cases for its own tickets |
| **Release is the largest build gap.** H1–H6 depend on F1, F2, F3 and D4. | A slip in provenance or the canonical decision cascades into release. | The release groups, W9–W10: SCRUM-102 (H1, PR #65) and SCRUM-37 (H4, PR #66) in review on 2026-10-14; SCRUM-105 (H3) and 104 (H2) in W10; SCRUM-108 (H6) in W11. SCRUM-64 to 66 were replaced by 102, 104 and 105 on 2026-09-22. **2026-10-19: mostly closed.** H1, H2, H3 and H4 are on `main` (#65, #84, #83, #66), so a release is gated, frozen and comes with a manifest that can be checked independently. H6's screens (SCRUM-108, Yi) are a draft, PR #86. **2026-10-22: closed.** H6 merged on 20 Oct (#86, `bb45fe1`), so H1–H6 are all on `main` |
| **CI cannot run again (since 25 Oct).** The last run that executed is #103's merge to `main` (25 Oct, 13:02 UTC). The merge of #104 (14:01 UTC) and #105's pull request run and merge (26 Oct, 12:40 UTC) were refused with "recent account payments have failed". | #104 and #105 reached `main` with no SQLite, PostgreSQL or web run on GitHub. | Hanchen ran all three jobs locally on `main` at `6b6a3fea` (results under "Tests on `main` after #105"). The billing block is an account matter, outside the code |
| ~~**CI cannot run (since 2026-10-16).**~~ **Closed 2026-10-20:** the billing block ended between 19 Oct 22:56 and 20 Oct 02:16 UTC (the last refused run is Tim's #89, "recent account payments have failed"). Every run since has executed, and `main` at `fd35571` is green on SQLite and PostgreSQL. GitHub Actions was blocked repo-wide by billing, so no PR gets the SQLite and PostgreSQL runs SCRUM-94 set up. | A merge that breaks the other database, or that only breaks together with another merge, reaches `main` unseen. That risk is highest in W11, when most open PRs merge. | Every author merges `main` into their branch and runs the backend suite and the casebook locally before review, and says so in the PR. Reviewers run PostgreSQL through the compose `backend` container. Hanchen did this for #83 and #84. The billing block is an account matter, outside the code; SCRUM-125 (Parth) carries the CI workflow's own follow-ups |
| **Governance gaps found in review (2026-09-13).** Project-scoped roles are defined but never honoured, so G3's "access to one project" cannot exist; an admin can escalate and self-finalise their own item. | G3 cannot close as the story reads; D1 criterion 3 is unmet. | D1's two dispute guards in the break — SCRUM-116 (routing) and SCRUM-99 (deciding), which absorbed SCRUM-86 on 2026-09-30. **2026-10-07:** both guards are on `main`, the deciding one from SCRUM-52 (PR #53) — see issue 7. D2's remaining subtasks (SCRUM-109) merged as PR #60 on 2026-10-13; product decision on project-scoped roles through Hanchen |
| **Parallel branches edit the same files.** B6 and SCRUM-48's API both change `task_service.py`. `DraftService.submit_draft` gains three refusals from three tickets — a finalised item (SCRUM-28), atomic submission (SCRUM-26) and the per-task submission limit (SCRUM-48) — and their order decides which message a user sees. In W8 and W9 several groups change the schema. | Late merges conflict and regress each other, and refusals landed in the wrong order give the wrong reason. | Hanchen and Kanishka agree the order of the `submit_draft` refusals and who merges first. **Settled in PR #35 (2026-09-26):** a finalised item, then a draft that is not pending — both before any write — then, with the item row locked, the AI-assisted first pass and the human limit; recorded in `api_surfaces.md`. Weeks with several schema changes agree one migration path on day one — which path depends on SCRUM-94's decision (see below) |
| **The break stacks the review path, and one of its tickets waits on unstarted work (2026-09-30).** SCRUM-116 and SCRUM-110 (Jingwei), SCRUM-99 (Yi), SCRUM-109 (Parth, carried over) and PR #41 (Dishank) all change `submit_task_item_review_action`, the escalation routes or the item-status computation in the same week. SCRUM-101 (E1, Yi) opens its dispute from SCRUM-51's disagreement flag, and SCRUM-51 (Parth) was not started in W8. | Late merges regress each other's refusals; SCRUM-101 has nothing to build on, in a week meant for scenario testing. | Agree the merge order on the break's first day — SCRUM-116 before SCRUM-110, SCRUM-110's reopen function before SCRUM-99's Return. **Decided 2026-10-02:** SCRUM-101 moved to W9 beside SCRUM-51's sampling; SCRUM-51 owns the disagreement comparison as one function SCRUM-101 calls (`../sandbox/Break/jira/jira-scrum-101-to-W9.md`). SCRUM-116 and 110 merged (PRs #45, #46) |
| **The database changes under everyone this week (SCRUM-94).** Parth moves the platform onto PostgreSQL while keeping SQLite, in W7's last days, days before W8's four schema changes. Its scope grew on 2026-09-18: the 10 test files that touch a database all hard-code in-memory SQLite, so CI could not reach Postgres until they are moved onto a shared fixture. | If the first merge slips past the weekend, it waits for the W9 boundary and W8's schema changes land on SQLite alone, to be redone after. Until the tests reach Postgres, nothing verifies it — including SCRUM-2's worker, which its author cannot run on Postgres locally. | Parth, on SCRUM-94 alone this week (SCRUM-51 moved to W8). Two merges: `database.py`, the fixture, CI and the schema-change decision before W8; moving the old tests early in W8. Everyone merges `main` and reruns the suite the day the first lands |
| **Records can mark a story complete ahead of its code.** D2 is marked complete while its subtasks 2 and 4 remain, and the board shows SCRUM-54 Done while no `AnnotationAssistant` interface exists on any branch *(2026-10-14: the typed model interface does exist on `main`, under another name — the `JsonCompletionClient` protocol in `app/integrations/analyzers/base.py`, which every provider and analyzer goes through; whether that satisfies SCRUM-54 is a records check, not a code gap)*. `story_src.csv` follows the tracker by decision. *Not* a case of this: a Contribution Log row logged for an unmerged PR. The tracker logs a PR when it is opened and leaves *Review OK?* blank until review passes (recorded 2026-09-18) — PRs #19–22 on 2026-09-18 were exactly that, and earlier reports that read them as "logged as merged" were wrong. | The tracker's Client Report is built from these records and can overstate progress; `user-stories.html` inherits the same gaps whenever `story_src.csv` is synced. | `tracking-sync` counts a story complete only when its row's *Review OK?* is `OK` — this kept D5, whose row is still pending review, out of the client view on 2026-09-18 — and flags only a reviewed row git shows unmerged. Beyond that, Hanchen reconciles tracker, board and `main` at each weekly sync, with the report as the checkpoint before the client view changes |

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
    snapshots as well. The handover dashboard presents it to the client. It is a presentation, not the
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
