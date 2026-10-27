# Contribution Statement

Our group CS-57, taking project titled "Human–AI Data Annotation, Provenance, and Dataset Evaluation Platform", with group members Michael Max, Parth, Jingwei Lin, Hanchen Wang, Yi Geng, Dishank Aswal, Kanishka Kathait and Tim Chung, would like to state the contributions that each group member has made for this project during this semester:

**Michael Max (540559785):** Client liaison and minute-taker from Week 3 to Week 8: attended the first client meeting (19 August), recorded the client and team meetings, sent the Week-5 written update, arranged the first sprint check-in with the client (9 September), drafted Status Checking 1 and obtained the client's sign-off on it, and worked on the client feedback round for Status Checking 2. Designed and built the AI batch pipeline (story C2): the design documents, job tables, background worker, retry and dead-letter handling, run trigger and batch-progress view. Also replaced the fabricated AI output with an explicit failure (C3), and built versioned guidelines and policies (F2), the release gate (H3) and the release manifest (H2). Wrote ADRs 018, 020 and 021. Authored 14 merged pull requests and reviewed 4.

**Parth (550620451):** Moved the platform to PostgreSQL 18 while keeping SQLite working. Set up the two-database CI and the Docker Compose stack, and later hardened both and added the export-figure check (A4, H5). Built review justification and send-back (C5, E2), the blind independent second review with sampled cross-review, adjudicator independence (D7, D8, E3), state–history consistency (D2) and the provenance event record (F1). Wrote ADRs 010, 011 and 015. Authored 6 merged pull requests and reviewed 4, giving reproduction steps for each fault found.

**Jingwei Lin (520372766):** Set up the pull-request review workflow with Hanchen. Built role-based permissions and cross-project write guards (G1, G3), project review policies and their enforcement (B2, G2), the review target (D4), corrections (D3), reopening (D9), audit history (F4), the result shape (B3) and the production mode (C4). Evaluation work: the harness (I1), the casebook's growth to 57 cases (I2), the blind-then-reveal protocol (I4), the agreement coefficients and recorded model runs (I3) and the integrity checks (I5). Also built the dispute screens (E6), organisation identity and project archiving (J1, J4), the settlement of held disagreements, the interface clean-up and part of the handover sweep (K1). Wrote 11 of the 25 ADRs. Authored 29 merged pull requests and reviewed 27.

**Hanchen Wang (520374346):** Project manager. Wrote the backlog of user stories and the mission, tech-stack and roadmap specifications. Ran the Jira board, the contribution tracker, the weekly re-planning (including the re-plan of 1 October) and the client-facing backlog dashboard. Started the written client Q&A, presented progress and demonstrations at client meetings, and prepared Status Checking 3. Code: restored the test suites (A2), draft ownership and atomic submission (D5, D6), fixes to the work queues, the work panel and the submission chooser (D8, D4), answer versions (F3), the casebook structure and repeatable runs with a regression baseline (I2, I1), page-load performance (A6), retirement of the legacy escalation flow (A5) and the handover sweep (K1). Wrote ADR 009. Authored 16 merged pull requests and reviewed 42.

**Yi Geng (520373453):** Integrated the client's AI assistant prototype into Hej (C1), with custom task and label definitions. Raised the team's technical workflow questions with the client, took minutes, and opened the GitHub client-question issues on dispute scope and AI rework. Built per-task annotation surfaces (B8), record-based JSONL intake (B7), the dispute and adjudication record with automatic disputes (E1, E3, E4), the human fallback for a rejected AI first pass (E2), the Expert Gate and escalation postures (G2, E5), the item timeline (F5), the release screens (H6), the permission model (G1), the governance seed projects (A3) and model-stated confidence (C1). Wrote ADRs 004, 005, 013, 017, 023 and 025. Authored 14 merged pull requests and reviewed 23.

**Dishank Aswal (540870299):** Built status validation with correct conflict responses (G4, B5) and one completion rule for tasks and exports (B6). Also built the task lifecycle with its delete policy (B4), resubmission rules (D8), one authoritative answer per item (H4, which closed the last Critical inherited defect) and an expert's acceptance of a reviewer's correction (D3, E3). Authored 6 merged pull requests and reviewed 3.

**Kanishka Kathait (540870325):** Made dataset registration transactional (B5). Built the role-checked work-queue API and the available-work list (D8), the immutable release artefact (H1) and the evaluation findings record with its negative results (I5). Authored 5 merged pull requests and reviewed 3.

**Tim Chung (550512950):** Restored the organisation invitation flow (G5) and built the member-management screens with role choice at invitation and the invitee's acceptance (J3). Also built the project overview (J2) and organisation-scoped project creation (B1). Authored 5 merged pull requests and reviewed 2, including the review that found four defects in project archiving.

All group members agreed on the contributions listed on this statement by each group member.

Signatures: ______________________ (all group member signatures, either hand written or digital signatures)

# 4 Methodologies

Three conditions shaped the methods: a large scope for eight part-time members, an inherited codebase that had to be changed without breaking it, and requirements the client clarified as features reached them. Each choice below is described with what it bought and what it cost; Table 1 summarises.

## 4.1 Methods

### 4.1.1 Life cycle: Scrum in weekly sprints

The team followed Scrum (Schwaber & Sutherland, 2020), adapted to a semester. Seven sprints were run (W6–W11 and a separate sprint for the mid-semester break, 1–7 October), and each produced merged, reviewed work on `main`. From 19 September a sprint ran from Thursday to Wednesday, so that each sprint closed after the Wednesday-evening client meeting and the client's feedback could shape the next plan. The client acted, in effect, as product owner: product questions the team could not settle alone were put to him. The project manager kept the backlog and ran the weekly planning meeting, where finished tickets were checked against `main` and unfinished ones moved forward before new work came in.

Estimation used *units* rather than hours: one unit is two to three backlog subtasks, and each member carried 1.5–3.5 units a week. A unit measures work rather than a person's available time, so members with different timetables shared one scale; a check on 18 September found a median of 2.5 subtasks per planned unit, so the rule matched the estimates already made. Units are coarse, so a story needing far more subtasks than its units was treated as a sign of under-estimation. Weekly sprints limited how long a misunderstanding could last, at the price of planning overhead every week and a ten-day W7 while the sprint boundary moved.

### 4.1.2 Requirements as user stories with acceptance criteria

The agreed scope was broken down into user stories in the "As a … I want … because …" form, each with numbered acceptance criteria, subtasks, a priority (P0–P2) and the inherited defects it closes (Cohn, 2004). The backlog began with 59 stories in 11 epics (A–K) and grew to 63, because client answers in late September and a performance investigation in October added stories B7, B8, D9 and A6. Stories were delivered through Jira tickets, so one story could span several sprints and one ticket could serve several stories. From W8 each ticket's story points equalled its units. The board finished with 104 tickets, all Done.

Stories written from the users' point of view gave the client a backlog he could read and a checkable meaning of "complete", but they had to be re-scoped when an answer changed their meaning: the client's decision of 17 September that work is self-served from queues, not assigned, rewrote the work-queue story while it was being built.

### 4.1.3 Definition of Done, code review and the defect policy

A story was done only when it met five conditions:
- it could be demonstrated in the running application, not only through the API;
- new workflow logic shipped with its tests in the same change;
- any linked inherited defect had a test that fails on the old code, checked by reverting the fix;
- documentation of changed states or contracts was updated in the same change;
- it was reviewed by a member other than its author.

The third condition applies Feathers' (2004) advice for legacy code, pinning behaviour with a test before changing it, so a fix proves it closed the defect rather than moved it.

All changes went through GitHub pull requests. Of the 95 merged pull requests, 93 carry a review by a non-author: 83 as formal GitHub reviews, and the rest as the reviewer of record in the team's contribution tracker. The other two (#3 and #15) only synchronised `main` into a personal branch. Review found real faults. The work-queue API returned a server error for every non-empty queue until its review fixed it, and the authoritative-answer change and the AI-rework change went through three and five rounds of requested changes respectively. Review also spread knowledge of each change across the team, which Bacchelli and Bird (2013) found to be as important an outcome as finding defects. It had two costs: it was enforced only by agreement, since branch protection was not available on the repository's GitHub plan, and the load was uneven, with three members reviewing most pull requests.

The client set the defect policy: instead of a clean-up sprint for the 30 defects catalogued in the inherited code, a defect was fixed when the feature being built depended on it, treating technical debt as something repaid where it blocks value (Kruchten et al., 2012). Feature work started a week earlier, while some defects stayed open longer; the last Critical one, conflicting answers in an export, closed on 16 October with the story that gives each released item one authoritative answer. All 30 were closed on `main` by the end of the build.

### 4.1.4 Specifications and decision records

Work was spec-driven at two levels. Three standing specifications described the product: the *mission* (pillars, success criteria, risks), the *tech stack* (architecture, testing rules, conventions) and the *roadmap* (each sprint's tickets, owners, loads, dependencies and exit checks, with a story marked complete only when its code on `main` met the Definition of Done). Below them sat per-ticket implementation plans, review notes and board descriptions. The specifications also briefed the coding assistants members used (see Acknowledgement of AI Use), so generated work started from the agreed design.

Significant design choices were recorded as architecture decision records, short notes of context, decision, alternatives and consequences (Nygard, 2011). Twenty-five ADRs are on `main`, most written in the pull request that implements them. They gave reviewers and the client the reasons and answered the brief's request for per-member decision records, at the cost of writing time and of amending them when later decisions changed them.

### 4.1.5 Client questions and weekly re-planning

Questions the team could not settle went to the client in writing: two rounds in a shared document (answered 21 and 24 September), then, from 3 October, GitHub issues labelled QA, where the thread is the record. Answers were written into the affected stories, tickets and ADRs the same day. Written questions removed ambiguity, but waiting could hold a story (the dispute work paused for about a week, 3–9 October), so the roadmap gave each blocked group a fallback to pull forward. From 7 October the client asked the team to settle the remaining questions as its own design.

Re-planning happened every week and once in depth. On 1 October W11 became the last build sprint and the provenance record moved from W11 to W9, because the W10 release gate reads it and the earlier order could not have finished. The chain from provenance through the release gate, manifest and release screens to the integrity checks had no slack and was planned as a critical path (Kelley & Walker, 1959); the risk register in each status report named an owner and a trigger for each risk (Boehm, 1991).

### 4.1.6 Implications of the chosen methods

Table: Methods chosen, the reason for each, and their observed consequences

| Method | Why it was chosen | Consequence observed |
| --- | --- | --- |
| Weekly Scrum sprints closing after the client meeting | Requirements were partly unknown; weekly client contact | Client answers reached the backlog within a week; planning overhead every week |
| Load measured in units (two to three subtasks) | Members' available hours differed | One scale for eight people; under-estimates visible as subtask surplus |
| User stories with acceptance criteria | A backlog the client can read and check | 59 grew to 63 stories as answers arrived; stories re-scoped mid-build |
| Definition of Done with a failing test on old code | Inherited code with 30 known defects | Each fix proven, not assumed; slower first merges |
| Non-author review of every pull request | Inherited history had overwritten changes | Defects caught before `main`; review load concentrated on three members |
| Defects fixed only on the critical path | Client's direction at kick-off | Feature work started earlier; last Critical defect closed in W10 |
| Standing specifications and ADRs | Shared design for eight members and their tools | 25 recorded decisions; upkeep when decisions were amended |
| Written client questions (document, then GitHub issues) | Verbal answers were being lost | A durable record; stories occasionally paused for an answer |

## 4.2 Data Collection

**The client's dataset package.** The client supplied a package prepared by another student group (Group A): subsets of eleven public datasets in four modalities. Text has four, each of 200 items: AG News (topic classification), Civil Comments (moderation judgement), Few-NERD (named entities) and SemEval-2010 Task 8 (relation extraction). Image (BoneBreak, Retail Product Checkout), audio (LibriSpeech, MInDS-14) and video (UCF101, MOT17, UOT32) subsets hold about 200 files each, except UOT32's 32 sequences. Each dataset has `handoff` JSON files and a `source` subset whose records carry a stable reference (such as `ag_news:train:0000`), the item text and the reference labels. Text was the demonstration path agreed in Week 4; AG News and Civil Comments were used throughout.

**How records enter Hej.** The inherited platform made one item per uploaded file. Record-based intake (story B7, ADR 005) splits a JSON, JSONL or CSV file into one item per record. Before anything is saved the uploader chooses an *input projection*: the fields an annotator and the AI may see, typically the text alone. The original file is stored apart from the projected inputs, and the upload is validated and committed in one request, so a malformed file creates nothing. The projection keeps reference labels out of the annotation input, as the client required (answer R1-1); otherwise gold answers would leak to people and models and accuracy could not be measured.

**Evaluation data.** A 56-record gold subset, stratified with a fixed seed (seven per AG News class; 14 Civil Comments records with a harm label and 14 without), is committed for tests and CI. A full run reads all 400 AG News and Civil Comments records from the client's package at run time. Model output was collected by running the platform's own pre-annotator once per model and recording every reply: a local Llama 3 through Ollama (15 October) and the hosted DeepSeek Flash (19 October); only record text reached the models.

**Requirements data.** Requirements came from the brief, the scoping workshop of 26 August, minuted weekly client meetings, 7 questions answered in mid-September and 15 more in two written rounds, and three GitHub QA issues. Operational data was collected as needed: profiling a 200-item task found 404 requests and 2,969 ms per page load, which created story A6.

## 4.3 Data Analysis

The brief asks for quality, collaboration and integrity to be measured, never reduced to one unexplained score. The techniques are described here; their results are in Section 7.

**Agreement.** Reviewer agreement is Fleiss' kappa (Fleiss, 1971) over the two independent reviews of each sampled submission, on pass versus rework; with two ratings per item it equals Scott's pi, which suits reviewers who change from pair to pair. Annotator agreement is nominal Krippendorff's alpha, which allows items with different numbers of answers (Krippendorff, 2018). It counts only each annotator's first independent answer, since a rework after feedback, or an answer given after seeing the AI's or a colleague's, raises agreement for reasons that are not the annotators' own (Artstein & Poesio, 2008). The raw rate is reported beside each coefficient, and an undefined coefficient is reported as missing with its reason, never as 0 or 1 (ADR 019).

**AI suggestion quality.** Recorded replies are replayed through the platform as an AI-first task, a reviewer accepts every answer through the API, and results are joined with gold outside the platform, so gold never enters Hej. Measures are accuracy, per-class precision, recall and F1 with macro-F1, and calibration: five equal confidence bins with the expected calibration error (Guo et al., 2017) and the Brier score (Brier, 1950). Replay makes the figures repeatable, although one recording remains one sample of a model.

**Effect of AI on people.** In the blind-then-reveal protocol (story I4, ADR 016) each annotator on a judgement task records a blind verdict, sees the AI's suggestion, then submits a final answer; the stages are stored separately with times and versions. The platform computes accept, modify and override rates, review burden and time per item; against gold it computes anchoring, automation bias (a right blind verdict switched to a wrong AI), benefit (the reverse), adoption of confidently wrong suggestions and the change in correctness. With scripted casebook people these figures demonstrate the pipeline, not human behaviour.

**Integrity and regression.** `python -m evaluation verify` reads any database read-only and checks roles (each step allowed to its actor at that time, and independent of their own work), provenance (a complete event chain for every released item; Moreau & Missier, 2013) and releases (each rebuilt byte for byte from its manifest); tamper cases show it catches a deleted event, a forged approval, a self-review and a changed author. Every casebook run is compared case by case with a committed baseline, where a case that newly fails, skips or disappears is a regression.

**The team's own progress.** Each week the Jira board, the contribution tracker (one row per pull request) and `main` were reconciled, the code deciding where they disagreed. Planned against completed load, carry-over, review queues and critical-path dependencies were read from them; this analysis produced the 1 October re-plan.

## 4.4 Deployment

The client owns Hej and had not chosen a production host, so the system was not deployed to a public server. It is handed over as the `main` branch of the private repository `USYD-CS-Capstone/hej`, which the client could already access, by 1 November 2026. It runs the same way on a laptop, in containers or on any server the client chooses, following the README and the integration runbook:

- **Natively:** `npm install`, `uv sync`, a PostgreSQL 18 server, then `npm run dev:all`, which starts the web application (port 3000) and API (port 8000). SQLite can be selected explicitly with `DATABASE_URL` and needs no server.
- **Docker Compose** (2.24 or later): one command starts PostgreSQL 18, the API and the web application, with an optional AI worker profile.

Configuration lives in one file, `apps/hej-api/.env`, made from the committed `.env.example`: database credentials, the authentication secret and each AI provider's key. No credential has a default in code, and without a database setting the API stops with an error naming what to set, so nobody tests SQLite believing it is PostgreSQL. In Compose, provider keys reach only the API and worker. `init_data.py --reset` rebuilds a database with eleven named demonstration accounts covering every role and ten test projects, four of them one governance posture each on real dataset records.

PostgreSQL 18 is the default and production engine because concurrent annotators and a background AI worker need concurrent writers; the client endorsed this at the second status check and asked for the reason to be recorded. SQLite remains for quick local runs and unit tests, with write-ahead logging so the worker can share it. The application creates its schema and development databases are reset after a schema change; the absence of a migration tool is a limitation for production use (Section 9).

**Updates and fixes** follow the build process: a branch, a pull request to `main` titled with its stories, review by a non-author and CI. A defect fix carries a test, and a casebook case for workflow faults, that fails on the old code. A merge to `main` is the release; an operator pulls `main`, resets a development database when the change notes say so, and restarts.

## 4.5 Testing

The rule was that a behaviour is delivered only when an automated test shows it working through the path a user takes. Four layers apply it.

**Backend tests (pytest).** The API has 154 test files on `main`, run in parallel with a fresh database per test: in-memory SQLite by default, or a throwaway PostgreSQL schema. Because many inherited defects were authorisation faults, permission and ownership suites use real users and roles in a real database rather than mocks, and route tests call the API as a client does. Provenance suites check that each decision point writes its event in the same transaction and that events cannot be edited. On 26 October the suite reported 2,495 passed and 62 skipped (PostgreSQL-only tests) on SQLite.

**End-to-end casebook.** The harness (ADR 006) runs each case through the real HTTP API in a fresh database; every actor logs in with their own account and holds only their declared role, and the AI is scripted at the model interface so a "confidently wrong AI" is wrong the same way every time. A case is a TOML file naming its category, the defects or criteria it protects, its steps (which may require a refusal, such as an annotator approving their own work) and the expected outcome. Cases cover the brief's adversarial categories, every fixed bug adds a regression case, and a case whose surface does not exist yet states the outcome owed and is skipped rather than written to match wrong behaviour. On 26 October all 87 running cases of 88 passed.

**Web tests (Vitest).** Components and pages are tested with Vitest, jsdom and Testing Library (1,050 passing on 26 October), with type checking and ESLint. No test drives a real browser; multi-user behaviour was also checked by scripted manual walkthroughs in two browsers.

**Continuous integration.** GitHub Actions runs on every ready pull request: the backend suite and casebook on SQLite, a check that each adversarial category has a case, and the web tests, type check and lint. On each merge to `main` the backend suite and casebook also run on PostgreSQL 18 with sessions in the Australia/Sydney time zone, to expose date faults a UTC server hides. Running PostgreSQL only after merge kept feedback fast at the cost of finding PostgreSQL-only faults later. When billing blocked CI (16–20 October), authors ran both suites locally and reported the results in the pull request.

**Failing test first for defects.** Inherited defects were fixed test-first in Beck's (2003) sense: tests that prove the fix (failing before, passing after, checked by reverting) are kept apart from guards that stop it going too far. The atomic-submission fix, for example, came with five tests that fail on the previous commit. With the casebook baseline and two-database CI, every merge became a small, checked release candidate, close to continuous delivery (Humble & Farley, 2010); code review (Section 4.1.3) was the final check.

# 5 Resources

## 5.1 Hardware & Software

**Platforms.** Hej is a web application. The server side (API, database and optional AI worker) runs on any 64-bit machine that runs Python 3.14 and PostgreSQL 18: Windows, macOS and Linux natively, or any host with Docker Compose. Members developed on their own laptops, and continuous integration runs on Ubuntu Linux. Users need only a current desktop web browser. Local AI models need a machine able to run Ollama; hosted models need only network access and an API key. Table 2 lists the software stack and why each part was used.

Table: Software used to build and run Hej (versions from `package.json`, `pyproject.toml`, the Dockerfiles and `compose.yaml` on `main`)

| Layer | Technology | Why it was used |
| --- | --- | --- |
| Web application | Next.js 16 (App Router), React 19, TypeScript 5.9, Tailwind CSS 4 with shared UI primitives | Inherited stack; the UI style is a stable surface the brief protects |
| API | FastAPI on Uvicorn, Python 3.14, Pydantic 2 | Inherited; typed request and response schemas match the typed web client |
| Data access | SQLAlchemy 2, psycopg 3 | One data layer for both databases |
| Database | PostgreSQL 18 (default, CI, Compose); SQLite (explicit local option, unit tests) | Concurrent writers for multi-annotator work and the AI worker; fast local runs |
| Authentication | JWT (PyJWT) with bcrypt password hashes | Inherited; a stable surface |
| AI integration | `openai` SDK behind one `JsonCompletionClient` interface: OpenAI, DeepSeek, Qwen, Doubao, Groq, local Ollama | One typed interface; providers chosen per task without changing the workflow |
| Packaging and builds | npm workspaces with Turborepo 2; uv for Python | One repository, locked dependencies for both languages |
| Containers | Docker and Docker Compose (images `postgres:18`, `python:3.14-slim`, `node:20`) | Same stack on any host |
| Testing | pytest with pytest-xdist; Vitest 3 with jsdom and Testing Library; ESLint 9; TypeScript compiler | Parallel backend tests; component-level web tests |
| CI | GitHub Actions (Node 22, Python 3.14, PostgreSQL 18 service) | Every pull request and merge checked automatically |

**Team tooling.** The team used GitHub for code, pull requests, reviews, client-question issues and Pages (the client-facing backlog dashboard), and a Jira Scrum board with sprints and story points. A shared Google Sheet served as the contribution tracker, a shared document held the first rounds of client questions, and Zoom hosted the weekly client meetings. Members also used generative AI coding assistants under the conditions in the Acknowledgement of AI Use.

## 5.2 Materials

- **The client's brief** (Arc Intelligence), which defines the six pillars, the casebook's adversarial categories and the expected deliverables.
- **The inherited codebase.** Arc Intelligence's `hej` repository, with the `week13` branch of the previous team confirmed by the client on 26 August as the baseline and merged into `main` on 28 August, together with the client's AI annotation assistant prototype, which was integrated into Hej. The inherited code came with a catalogue of 30 defects, six of them Critical.
- **The dataset package** described in Section 4.2: eleven dataset subsets across text, image, audio and video, each with handoff JSON files and source records with reference labels.
- **Model access.** Members' own API keys for hosted providers and a local Ollama installation. Recorded model replies are committed so that evaluation reruns need no key and no cost.
- **Documentation and templates.** The inherited design documents (architecture, workflow states, domain model), the unit's report and status-check templates, and the client's answers recorded in the Q&A document and the GitHub QA issues.

## 5.3 Roles & Responsibilities

Every member was a developer who built full stories, front end and back end, and reviewed other members' work. Table 3 lists the further roles each member held over the semester and the areas they owned. The counts are pull requests merged into the repository (95 in all). A review counts if the member submitted a GitHub review or is the tracker's reviewer of record; one pull request can have several reviewers.

Table: Semester-long roles and responsibilities

| Member | Roles | Main responsibilities (stories) | PRs authored / reviewed |
| --- | --- | --- | --- |
| Michael Max | Client liaison and minute-taker (Weeks 3–8); developer | Status Checking 1 and client sign-offs; AI batch pipeline (C2), AI failure handling (C3); versioned guidelines (F2); release gate and manifest (H3, H2) | 14 / 4 |
| Parth | Infrastructure lead; developer | PostgreSQL 18, CI and Docker (A4, H5); independent second review and adjudicator independence (D7, D8, E3); state–history consistency (D2); provenance record (F1) | 6 / 4 |
| Jingwei Lin | Evaluation lead; governance developer; reviewer | Permissions and policies (G1–G3, B2); review corrections and reopening (D3, D4, D9); evaluation harness and measures (I1–I5); dispute screens (E6); projects (J1, J4) | 29 / 27 |
| Hanchen Wang | Project manager; developer; reviewer | Backlog, specifications, board, tracker, weekly re-planning, client reporting and demonstrations; drafts and submission (D5, D6, D8); answer versions (F3); casebook structure and baseline (I1, I2); performance (A6); handover (A5, K1) | 16 / 42 |
| Yi Geng | AI integration lead; dispute developer; reviewer | AI prototype integration and confidence (C1); intake and annotation surfaces (B7, B8); disputes and adjudication (E1–E5); Expert Gate and permission model (G2, G1); item timeline and release screens (F5, H6) | 14 / 23 |
| Dishank Aswal | Developer (task model and export) | Status validation (G4, B5); completion rule (B6); task lifecycle (B4); authoritative answer (H4); accepted corrections (D3) | 6 / 3 |
| Kanishka Kathait | Developer (queues and release) | Transactional registration (B5); work-queue API and list (D8); release artefact (H1); evaluation findings record (I5) | 5 / 3 |
| Tim Chung | Developer (organisations) | Invitations (G5); member management (J3); project overview (J2); organisation-scoped project creation (B1) | 5 / 2 |

# 6 Milestones / Schedule

The schedule was planned at Status Checking 1 in Week 4 as an indicative weekly plan, which the client accepted on the understanding that it would be refined. Table 4 gives the actual timeline by teaching week, with the sprint that ran, what was delivered, the reporting and client contact, and the pull requests merged. Sprints ran Thursday to Wednesday from 19 September, so from Week 8 a sprint straddles two teaching weeks; each row from then on lists the sprint that starts in that week and the client meeting that closes it, which can fall early in the next teaching week. The mid-semester break (28 September to 4 October) had its own sprint. Figure 1 sets the actual work against the Week-4 plan, and Table 5 explains each deviation.

Table: Actual milestones, tasks and reporting by teaching week (PRs = pull requests merged in the sprint)

| Week (dates) | Sprint | Tasks and milestones | Reporting and client contact | PRs |
| --- | --- | --- | --- | --- |
| 1–2 (3–16 Aug) | — | Team formed; brief studied | None | — |
| 3 (17–23 Aug) | — | Repository and dataset access; codebase study begins | First client meeting, 19 Aug (background, goals) | — |
| 4 (24–30 Aug) | — | Scope agreed (text first); `week13` baseline confirmed and merged; client's defect policy | Kick-off workshop and **Status Checking 1**, 26 Aug | — |
| 5 (31 Aug–6 Sep) | — | Backlog of 59 stories in 11 epics; Jira board and tracker; audit of 30 inherited defects; review workflow; **Proposal** | Written update by email, 6 Sep | 3 |
| 6 (7–13 Sep) | W6 Governance and data-integrity fixes | Draft ownership, roles, cross-project guards, AI failure made explicit, legacy review writes retired, invitations | Client meeting 9 Sep; weekly Wednesday meeting agreed | 6 |
| 7 (14–20 Sep) | W7 Lock down review data (14–23 Sep) | Finalised-item guard (Critical defect 2), atomic submission, AI job tables and worker, PostgreSQL 18 with two-database CI, project policy, completion rule, queue API | Client meeting 16 Sep; Q&A document started; written round 1 answered 21 Sep | 18 |
| 8 (21–27 Sep) | W8 Work reaches the right person (24–30 Sep) | Review target (D4), AI retry and trigger, task lifecycle, JSONL intake; three stories added | **Status Checking 2**, 23 Sep; written round 2 answered 24 Sep | 7 |
| Break (28 Sep–4 Oct) | Break sprint (1–7 Oct) | Scenario testing; evaluation harness and casebook structure; answer versions; reopening; blind second review; page load 2,969 to about 560 ms; **re-plan of 1 Oct** | Client questions move to GitHub issues, 3 Oct; client meeting 7 Oct (closing the break sprint) | 15 |
| 9 (5–11 Oct) | W9 Cross-validation, provenance, canonical answer (8–14 Oct) | Disputes and adjudication record, corrections, production mode, dispute screens, repeatable runs with baseline, casebook to 57 cases, AI rework to a person | **Progress Report**; client meeting 14 Oct (blind-then-reveal clarified) | 12 |
| 10 (12–18 Oct) | W10 Disputes end to end, release gate (15–21 Oct) | Provenance record, authoritative answer (last Critical defect), release artefact, versioned guidelines, release gate and manifest, release screens, agreement and calibration, blind-then-reveal, Expert Gate, item timeline, integrity checks, settlement of held splits, project archiving | CI blocked by billing 16–20 Oct (local runs reported in PRs) | 19 |
| 11 (19–25 Oct) | W11 Finish the journey (22–28 Oct) | Findings record, permission model, organisation-scoped project creation, governance seed projects, export-figure and CI hardening, interface clean-up, model-stated confidence, handover sweep; last PR merged 26 Oct | Client demonstration in three parts, 21 Oct | 15 |
| 12 (26 Oct–1 Nov) | — (build ends 28 Oct) | Demonstration video, slides, technical report; handover to the client by 1 Nov | **Status Checking 3 and demo**, 28 Oct; final presentation | — |
| 13 (2–8 Nov) | — | **Final report** | Submission | — |

![Figure: Planned (Week 4) and actual timeline. Top: the Week-4 plan by teaching week. Bottom: each epic from its first to its last merged pull request, one dot per merge (a pull request touching several epics appears in each), with non-code activities in grey; sprints are shaded and milestones dashed.](figures/B-gantt.png)

The fixed dates held: the status checks, the proposal and the progress report were delivered in their weeks, and build work ended on 28 October as re-planned. Within those dates the order of work changed, as Figure 1 shows. Core annotation and governance work started in Week 6, one to four weeks earlier than planned, and ran in parallel rather than as the planned sequence of phases. Provenance, release and evaluation were added after Week 4 and were compressed into the break and Weeks 9–11. Table 5 gives each deviation and its reason.

Table: Deviations from the Week-4 plan and their reasons

| Planned (Week 4) | Actual | Reason and effect |
| --- | --- | --- |
| Week 6: separate schema and contract validation | Replaced; each mismatch fixed inside the story that needed it | A standalone review would have found faults without the use that tests them; contract fixes shipped with their tests |
| Weeks 7–8: core backend; Weeks 9–10: review, governance, disputes | Both began in W6 and ran in parallel; disputes finished in W9–W10 | The client's defect policy put governance faults on the critical path at once; dispute work paused about a week (3–9 Oct) on an open question |
| Not planned: provenance, versioned guidelines, gated releases, evaluation | Added at Status Checking 2; built from the break to W11 | The brief and client answers confirmed them as required; they became the heaviest weeks |
| Provenance record in W11 (plan of 24 Sep) | Moved to W9 on 1 Oct; merged 16 Oct | The W10 release gate must read provenance; the earlier order could not finish |
| Evaluation harness late in the semester | Break sprint (1–7 Oct), with no other feature work planned | Status Checking 2 found evaluation at zero; the break gave it a week clear of feature work |
| Week 11: end-to-end run on the datasets as one event | Continuous: seeded projects and casebook cases on real AG News and Civil Comments records | Intake (B7) was brought forward to W8, so real records were available from October |
| Week 12: hardening, documentation, demo | W11 made the last build sprint; 29 Oct–1 Nov for reports and the demonstration | Re-plan of 1 Oct: no sprint after 28 Oct, so W11 was kept light to absorb carry-over |
| Stories K1–K4 (evidence and handover) | Set aside 14 Sep, reopened 25 Oct and completed by 26 Oct | Delivery of the platform came first; the ADRs and the findings record were written during the build, leaving the handover sweep and the demonstration |
| 59 stories at the start | 63 stories, all complete | Client answers (24 Sep) added B7, B8, D9; profiling added A6 (4 Oct) |

The sprints delivered steadily but not evenly. W8 merged only 7 pull requests while large reviews were open, and the break merged 15 as that queue cleared. Work still in review at a sprint's close counted for that sprint and merged in the next, so W9's provenance, versioning and release-artefact work appears as W10 merges in Figure 1. The last pull request merged on 26 October, two days before build work ended, so nothing was carried over.

# Acknowledgement of AI Use

The team used generative AI tools during the project, as the client's brief and the University's policy permit, under one rule: a tool may add capacity but never replaces judgement, and the member who submits AI-assisted work must be able to explain and defend every line of it without referring to the tool.

The tools used were Claude (including the Claude Code coding assistant) and ChatGPT. Members used them to clarify concepts and unfamiliar code, to suggest and check implementation and tests, and to improve the wording of documents. All code went through the same pull-request review by another member as hand-written code, and the casebook and test suites applied to it unchanged. The project manager also used Claude Code for:
- drafting and maintaining the specifications and the weekly plans;
- synchronising the board, the contribution tracker and the client-facing backlog;
- supporting code reviews by reading diffs and reproducing reported faults;
- drafting status reports and demonstration scripts.

Every output was checked against the code on `main` and edited before use.

This report was drafted with AI assistance. Drafts of its chapters were produced with Claude Code from the team's own records (code, specifications, minutes, tracker and board), and the team reviewed, corrected and approved the final text. All decisions, results and interpretations are the team's own. The University's separate AI statement form is submitted with this report.

# References (draft B)

Artstein, R., & Poesio, M. (2008). Inter-coder agreement for computational linguistics. *Computational Linguistics, 34*(4), 555–596. https://doi.org/10.1162/coli.07-034-R2

Bacchelli, A., & Bird, C. (2013). Expectations, outcomes, and challenges of modern code review. In *Proceedings of the 35th International Conference on Software Engineering (ICSE 2013)* (pp. 712–721). IEEE. https://doi.org/10.1109/ICSE.2013.6606617

Beck, K. (2003). *Test-driven development: By example*. Addison-Wesley.

Boehm, B. W. (1991). Software risk management: Principles and practices. *IEEE Software, 8*(1), 32–41. https://doi.org/10.1109/52.62930

Brier, G. W. (1950). Verification of forecasts expressed in terms of probability. *Monthly Weather Review, 78*(1), 1–3. https://doi.org/10.1175/1520-0493(1950)078<0001:VOFEIT>2.0.CO;2

Cohn, M. (2004). *User stories applied: For agile software development*. Addison-Wesley.

Feathers, M. C. (2004). *Working effectively with legacy code*. Prentice Hall.

Fleiss, J. L. (1971). Measuring nominal scale agreement among many raters. *Psychological Bulletin, 76*(5), 378–382. https://doi.org/10.1037/h0031619

Guo, C., Pleiss, G., Sun, Y., & Weinberger, K. Q. (2017). On calibration of modern neural networks. In *Proceedings of the 34th International Conference on Machine Learning* (Vol. 70, pp. 1321–1330). PMLR. https://proceedings.mlr.press/v70/guo17a.html

Humble, J., & Farley, D. (2010). *Continuous delivery: Reliable software releases through build, test, and deployment automation*. Addison-Wesley.

Kelley, J. E., & Walker, M. R. (1959). Critical-path planning and scheduling. In *Papers presented at the Eastern Joint IRE-AIEE-ACM Computer Conference* (pp. 160–173). ACM. https://doi.org/10.1145/1460299.1460318

Krippendorff, K. (2018). *Content analysis: An introduction to its methodology* (4th ed.). SAGE Publications.

Kruchten, P., Nord, R. L., & Ozkaya, I. (2012). Technical debt: From metaphor to theory and practice. *IEEE Software, 29*(6), 18–21. https://doi.org/10.1109/MS.2012.167

Moreau, L., & Missier, P. (Eds.). (2013). *PROV-DM: The PROV data model* (W3C Recommendation). World Wide Web Consortium. https://www.w3.org/TR/2013/REC-prov-dm-20130430/

Nygard, M. (2011, November 15). *Documenting architecture decisions*. Cognitect. https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions

Schwaber, K., & Sutherland, J. (2020). *The Scrum guide*. https://scrumguides.org/scrum-guide.html

<!-- NOTES

## Word counts (running text incl. tables and captions, excluding this NOTES block)
- Contribution Statement: 809 words (about 1.5 pages; trim if the CS + Abstract budget of 2 pages is tight)
- 4 Methodologies: 3,088 words incl. Table 1 (190 words in the table) - about 6 pages
  (4.1 1,330 incl. table; 4.2 380; 4.3 467; 4.4 376; 4.5 487)
- 5 Resources: 902 words incl. Tables 2 and 3 (458 in tables) - about 2.5-3 pages
- 6 Milestones / Schedule: 1,105 words incl. Tables 4 and 5 (756 in tables) + Figure 1 (Gantt, about 0.6 page) - about 3 pages
- Acknowledgement of AI Use: 230 words
- References (draft B): 16 entries
- Numbering inside this draft: Table 1 methods, Table 2 software, Table 3 roles, Table 4 milestones, Table 5 deviations, Figure 1 Gantt.

## Figures/numbers and their sources
- Test figures (Section 4.5, used for alignment by the assembler; C's re-measured figures are authoritative):
  backend 2,495 passed / 62 skipped (SQLite), casebook 88 cases with 87 running and all passing (EV-018 skipped),
  web 1,050 passed — all from roadmap.md W11 note of 26 Oct and BRIEF.md. 154 backend test files: counted by me
  with `git ls-tree -r origin/main apps/hej-api/tests | grep test_*.py` (6951781). (mission.md said 141 on 22 Oct.)
  The README "Expected state" table on main still says 2484/63 and 766 web tests (verified 23 Oct) — older.
- PR counts (Contribution Statement, Table 3): computed from `gh pr list --state merged` (95 PRs, 26 Oct).
  Login map: hanchen9127=Hanchen, Jingwei-Lin=Jingwei, mike-ad=Michael, DIQI26=Yi Geng, part0922=Parth,
  Dishankaswal=Dishank, kanishkakathait=Kanishka, aWalkingAvocado=Tim (confirmed against tracker rows and git author emails).
  Authored: Jingwei 29, Hanchen 16, Michael 14, Yi 14, Parth 6, Dishank 6, Kanishka 5, Tim 5 (= 95; includes #3 Jingwei
  and #15 Hanchen, both "merge main" syncs into personal branches).
  Reviewed = distinct PRs (not own) with a GitHub review by the member UNION tracker "Reviewed by" (reviewer of record):
  Hanchen 42, Jingwei 27, Yi 23, Michael 4, Parth 4, Dishank 3, Kanishka 3, Tim 2.
  GitHub-only reviewed counts: Hanchen 38, Jingwei 25, Yi 22, Parth 4, Michael 3, Dishank 0, Kanishka 1, Tim 1.
  Tracker-only (reviewer of record): Hanchen 35, Jingwei 25, Yi 17, Michael 4, Parth 4, Dishank 3, Kanishka 3, Tim 2.
  83 of 95 PRs have a formal non-author GitHub review; 93 have a non-author review by the union; #3, #15 have none.
- Merged-by counts (not used in text): Hanchen 40, Jingwei 25, Yi 17, Kanishka 4, Michael 4, Parth 4, Tim 1.
- Jira Done tickets by assignee (not used in text): Jingwei 28, Yi 17, Hanchen ("Jason Wang") 14, Michael 10, Parth 8,
  Dishank 7, Tim 5, Kanishka 5, unassigned 10 (total 104 Done; 11 epics To Do in the export).
- Commits on origin/main since 20 Aug, non-merge, by author name (not used; style-dependent): Jingwei 346, Yi 187,
  Hanchen 157, Michael 40, Tim 25, Dishank 23, Kanishka 20, Parth 17.
- ADR authors (from each ADR's Author line on main): Jingwei 001-003, 006-008, 012, 016, 019, 022, 024 (11);
  Yi 004, 005, 013, 017, 023, 025; Michael 018, 020, 021; Parth 010, 011, 015 (by git add author / PR);
  Hanchen 009. ADR 014 has no Author line (D2, PR #60 = Parth?) — not attributed in text.
- PRs merged per sprint (Table 4): mergedAt (UTC) + 10 h, assigned to sprint dates in roadmap.md: before W6 3, W6 6,
  W7 18, W8 7, Break 15, W9 12, W10 19, W11 15 (= 95). Cross-check: roadmap says 15 PRs merged in W11, and 22 PRs
  (#29–#57) between 23 Sep and 7 Oct (= W8 7 + Break 15). Using +10 h (AEST) for October (AEDT, +11) may misplace
  a PR merged within an hour of midnight; totals match the roadmap.
- Gantt (figures/B-gantt.png): `scratchpad/agentB/gantt.py`; epic membership from the tracker's Story ID per PR
  row, joined to GitHub mergedAt; planned bars from Status Checking 1 (W5–W13 teaching weeks; W1 = 3 Aug, break
  28 Sep–4 Oct between W8 and W9, W9 starts 5 Oct as stated in the progress report). Epic PR counts: A 9, B 9, C 13,
  D 20, E 5, F 6, G 8, H 7, I 8, J 5, K 4 (a PR can be in several epics). Non-code bars (onboarding 19 Aug–6 Sep,
  backlog set-up 26 Aug–7 Sep, reports 29 Oct–8 Nov) are approximate, from the minutes.
- 2,969 ms / 404 requests and ~560 ms: mission.md / roadmap.md (perf-findings). 56 gold records, 400 full run,
  recordings 15 Oct (Ollama llama3) and 19 Oct (DeepSeek Flash): evaluation/README.md and ADR 019 on main.
- 22 questions answered in the two written rounds: 7 in R1 (R1-1..R1-7) + 8 in R2 (R2-1..R2-8) + 7 initial
  questions answered 15–17 Sep. The progress report said "7 initial questions and 15 more in two written rounds".
  Text (4.2) now says "7 questions answered in mid-September and 15 more in two written rounds".
- 3 QA issues: #38, #40 (Yi), #72 (Hunter) — gh issue list --label QA.
- Sprint completion 77–93% (progress report) is NOT used in the text.

## Unverified / judgement claims
- 5.1 says the server side runs on "Windows, macOS and Linux natively" — based on the README's install
  instructions for each OS; only Windows (team) and Ubuntu (CI) are actually exercised. "Members developed on
  their own laptops" replaces an unconfirmed OS list.
- Michael "set up the weekly client meeting" — minutes say Michael proposed/confirmed the 9 Sep meeting; the weekly
  cadence was agreed at the 9 Sep meeting. "Obtained the client's sign-off on Status Checking 2" — W8 goals say
  Michael's goal was to obtain it; confirm it happened.
- Hanchen "started the written client Q&A" — W8 individual report says "we prepared a Google doc shared with the
  client"; client suggested it on 16 Sep. Confirm authorship (Hanchen vs Hanchen+Yi).
- Jingwei "set up the PR review workflow with Hanchen" — from progress report Table 15 (Week 5).
- Yi "took minutes" — minutes of 16 and 23 Sep list Michael and Yi as minute takers.
- 4.1.3 "three members reviewing most pull requests" — computed (Hanchen 42, Jingwei 27, Yi 23 of 95). The
  delay claim was removed. 6 says "W8 merged only 7 PRs while large reviews were open" — interpretation from the
  roadmap's carry-over list (#39, #43, #44 in review at W8's close).
- Status Checking 3 and the 21 Oct demo: demo scripts list presenters Yi (suggested), Hanchen, Jingwei (suggested).
  I only claimed Hanchen "presented progress and demonstrations at client meetings" (minutes of 9 and 16 Sep).
- Proposal due date (Week 5) and Progress Report week (Week 9) follow the template/progress report; exact
  submission dates not checked. Final presentation placed in Week 12 per Status Checking 3 ("presentation (week 12)").
- Section 4.4 claims PostgreSQL choice justification requested by client — from Status Checking 2 client feedback.
- "Dispute work paused about a week (3–9 Oct)" — roadmap: #48 paused on issue #40; mission: "disputes paused 3–9 Oct".

- Role titles in Table 3 ("Infrastructure lead" for Parth, "Evaluation lead" for Jingwei, "AI integration lead" for Yi,
  "Client liaison" for Michael) are my summaries of the work, not titles the team assigned. Confirm or replace.
- Hanchen "prepared Status Checking 3": inferred from the file in final_submit/ and the PM role; confirm.
- README on main still shows an older "Expected state" (2,484/63 backend, 766 web); my text in 4.4 no longer cites that table.

## Open questions for Hanchen
1. Each member should confirm their own paragraph in the Contribution Statement (and add non-code work I could not
   see: e.g., who wrote which parts of the proposal and progress report, who presented on 7 and 14 Oct, who
   recorded the demo video, slides authorship).
2. Michael: confirm the Status Checking 2 sign-off and whether he contributed to the proposal/progress report.
3. Kanishka, Dishank, Tim: any non-PR contributions (testing in the break sprint, reviews by comment, meeting notes)?
   Their review counts are small; if they reviewed by comment outside GitHub/tracker it is not counted.
4. Should commit counts or Jira ticket counts be added to Table 3? I left them out (style-dependent).
5. Group label: template says "CSXX-X"; I used "CS-57" (no sub-letter). Confirm.
6. AI use: each member must confirm the tools they used (Claude, ChatGPT; any others such as Copilot or Codex?)
   and how — the Acknowledgement currently reuses the progress report's statement (Claude and ChatGPT).
7. Hanchen's Jira name "Jason Wang" is not mentioned in the report; add a footnote if the marker cross-checks Jira.
-->
