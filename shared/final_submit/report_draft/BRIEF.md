# CS-57 Final Report — shared brief for the drafting agents

Three agents draft the group final report in parallel, each owning some chapters. One of them later assembles
the drafts into the Word template. Read this whole file before starting.

## The deliverable

- Template: `docs/shared/final_submit/COMP5703-(GP)-Project_Final_Report_template.docx`. Its chapters, in order:
  Contribution Statement, Abstract, Table of Contents, 1 Introduction, 2 Related Literature (2.1 Literature
  Review), 3 Project Problems (3.1 Aims & Objectives, 3.2 Project Questions, 3.3 Project Scope),
  4 Methodologies (4.1 Methods, 4.2 Data Collection, 4.3 Data Analysis, 4.4 Deployment, 4.5 Testing),
  5 Resources (5.1 Hardware & Software, 5.2 Materials, 5.3 Roles & Responsibilities), 6 Milestones / Schedule,
  7 Results, 8 Discussion, 9 Limitations and Future Works, References. Read the template's guidance text
  under each heading (dump `word/document.xml`); it says what each section must contain.
- Rubric: `docs/shared/final_submit/final-report-rubric.txt`. Marks: Topic definition 8, Background 12,
  Plan 10, **Results 20, Discussion 20, Limitations & Future Works 20**, Reflective practice 10. Write to the
  "Full Marks" descriptor of each criterion.
- Hard limits: **at most 50 pages** of main body (tables and figures count; appendices do not). Turnitin
  similarity must stay **below 35%**, so never paste text from earlier submissions — rewrite in new words.
  An AI-use acknowledgement is required.
- Final output (made at assembly): `docs/shared/final_submit/CS57_Group_FinalReport.docx`, and a PDF if
  LibreOffice is available.

## Page budget (A4, template body style, figures included)

| Part | Owner | Pages |
| --- | --- | --- |
| Contribution Statement, Abstract (150–600 words) | B / A | 2 |
| 1 Introduction | A | 2 |
| 2 Related Literature | A | 5–6 |
| 3 Project Problems | A | 2–3 |
| 4 Methodologies | B | 6 |
| 5 Resources | B | 3 |
| 6 Milestones / Schedule | B | 3 |
| 7 Results | C | 10–11 |
| 8 Discussion | C | 5 |
| 9 Limitations and Future Works | C | 4–5 |

About 500 words of running text per page. Stay inside your budget; total must not pass 50.

## Sources (read what your chapters need)

- `docs/info/ProjectDescription.pdf` — the client brief.
- `docs/info/CS57_Group_Progress.pdf` — the Week-9 progress report (structure, figures, references, the
  AI-use section). Reuse ideas and verified references, **not sentences**.
- `docs/info/CS57_Status_Checking_1.pdf` (week 4: agreed scope and expected outcomes, initial milestones),
  `docs/info/CS57_Status_Checking_2.pdf` (week 8: progress, deviations, replanned milestones).
- `docs/specs/mission.md` (pillars, success criteria checked, stories set aside, progress snapshot, the 30
  defects, risks), `docs/specs/roadmap.md` (every sprint W6–W11 with tickets, owners, PRs, dates),
  `docs/specs/tech-stack.md`.
- `docs/info/client-qa.md`, `docs/info/client-question.md` — client questions and answers (R1, R2 rounds);
  later answers are in GitHub issues of `USYD-CS-Capstone/hej` labelled QA (`gh issue list -R
  USYD-CS-Capstone/hej --label QA --state all`; gh is at `/c/Program Files/GitHub CLI/gh.exe`).
- `docs/info/issues.md` (the 30 inherited defects), `docs/info/fix-plan.md`.
- `docs/shared/story_src.csv` (all 63 user stories with acceptance criteria and status),
  `docs/shared/CS-57_Contribution_Tracker.xlsx` (per-PR contribution log, reviewers, per-member stats),
  `docs/shared/Jira.csv` (board export: tickets, sprints, assignees, story points).
- `docs/sandbox/W*/` and `docs/reviews/W*/` — weekly plans, Jira drafts, team messages, PR reviews, demo
  scripts (`docs/sandbox/W10/meeting/`); `docs/sandbox/W8/CS57_Week8_Meeting_Minutes.docx`.
- The codebase `D:/COMP5703_Capstone/hej` (GitHub `USYD-CS-Capstone/hej`). The local checkout is on an old
  branch: read current code from `origin/main` (head `6951781`, 26 Oct 2026) with `git show
  origin/main:<path>` / `git ls-tree`. Key paths: `README.md`, `docs/adr/` (25 ADRs), `docs/evaluation-findings.md`,
  `docs/handover/ticket-map.md`, `apps/hej-api/evaluation/` (harness, `cases/`, `baseline.json`),
  `apps/hej-api/app/`, `apps/hej-web/`, `.github/workflows/`, `compose.yaml`.
- The provided dataset package: `D:/COMP5703_Capstone/dataset/` (README per modality).
- **Never open or grep `docs/specs/.env`** (credentials) — exclude it from every grep. Never print secrets.

## Facts everyone uses (from mission.md / roadmap.md, 26 Oct 2026)

- Client: Hunter Xu, Arc Intelligence. Platform: Hej (Human Evaluation and Judgement). Team CS-57, eight
  members (name, SID): Michael Max (540559785), Parth (550620451), Jingwei Lin (520372766), Hanchen Wang
  (520374346, project manager), Yi Geng (520373453), Dishank Aswal (540870299), Kanishka Kathait (540870325),
  Tim Chung (550512950; "Tok Tin Chung" in records before 16 Sep).
- Six pillars: Govern, Assist, Record, Adjudicate, Release, Evaluate. Text is the committed demo path agreed
  in week 4; image, audio and video were extension work.
- Week-4 scope: core workflow project → policy → task → items/dataset → AI annotation → human review →
  evaluation → dispute → submit; integrate the full-stack app with the annotation repo; governance (roles,
  permissions, review policies); review schemas and FE/BE/AI contracts. Added after week 4 because the brief
  and client answers required them: provenance, versioned guidelines and immutable gated releases with
  manifests, the evaluation harness and casebook.
- Process: weekly Scrum sprints W6–W11 plus the mid-semester break sprint (1–7 Oct); build ended 28 Oct.
  63 user stories in 11 epics (A–K), all complete; 104 Jira tickets Done; 95 PRs merged, each reviewed by a
  member other than its author; all 30 inherited defects closed, the 6 Critical included.
- Tests on `main` per roadmap.md W11: backend 2,495 passed / 62 skipped (SQLite), casebook 87 of 87 running
  cases pass (88 cases, EV-018 skipped), web 1,050 passed. Agent C re-runs them; **C's measured figures are
  authoritative** and the assembler aligns every chapter to them.
- 25 ADRs in `hej/docs/adr/`. PostgreSQL 18 in production/CI with SQLite for local development.

## Writing rules

- English, formal but plain academic register for markers and the client. Past tense for what was done.
  No marketing adjectives. Every claim about the software must be true of `origin/main`; check it.
- Readers do not know internal jargon: explain story IDs (e.g. "story D5") and use SCRUM/PR numbers
  sparingly, as evidence, not as the subject of sentences.
- Citations: APA 7th, author–date in text, e.g. (Schwaber & Sutherland, 2020). **Only cite works you have
  verified exist** (WebSearch/WebFetch, or already in the progress report's reference list). Never invent a
  reference, DOI, page or quote. Put every reference you cite in your draft's own reference list.
- Cross-reference other chapters by number ("see Section 7.3") — section numbers follow the template.
- Figures and tables: numbered within your draft as "Figure X" / "Table X"; the assembler renumbers. Save
  figures as PNG (≥150 dpi, readable at A4 width) in `report_draft/figures/` with a prefix of your letter
  (`A-`, `B-`, `C-`). Every figure and table is referred to in the text and has a caption.
- Do not commit, push, merge or open PRs. Never run `git add`, `git reset`, `git checkout`, `git stash` in
  `hej` or `docs`. Agent C may create a separate worktree (see its own instructions).

## Draft format (what each agent hands over)

`docs/shared/final_submit/report_draft/<A|B|C>-draft.md`:
- `#` for chapter titles exactly as the template names them, `##` for x.y subsections, `###` for x.y.z.
- Tables as GitHub Markdown tables, captions on the line above: `Table: <caption>`.
- Figures as `![Figure: <caption>](figures/<file>.png)`.
- Citations in the text as (Author, Year); the draft ends with `# References (draft A|B|C)` in APA 7th.
- At the very end, a `<!-- NOTES -->` block listing: unverified claims, figures/numbers and their sources,
  open questions for Hanchen, and the word count per chapter.
