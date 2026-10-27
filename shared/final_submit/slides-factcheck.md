# Fact-check: CS57_Group_Slides.pptx (final presentation)

- **Deck checked:** `docs/shared/final_submit/CS57_Group_Slides.pptx` as saved 2026-10-26 15:39 (22 slides). The
  parallel copy `CS57_Group_Slides_v2.pptx` was not read.
- **Code checked:** `hej` `origin/main` at `6951781` (merge of PR #104, 26 Oct 2026; `git ls-remote` confirms it is
  the current remote `main`).
- **Checked on:** 2026-10-26.
- **Re-run today:** I re-ran the test figures on a `git archive` copy of `6951781` in a scratch folder. I did not
  check anything out in the repository.
  - `DATABASE_URL=sqlite:// uv run --locked pytest -q -n auto` gives **2,495 passed, 62 skipped** (188 subtests).
  - `uv run python -m evaluation run --baseline evaluation/baseline.json --exact` gives **87/87 cases passed, 1
    skipped; 88 cases: 88 unchanged. No regression.**
  - `uv run python -m evaluation list --coverage` gives **9 of 9 adversarial categories covered, 8 of 9 have a case
    that runs, 16 of 16 owed protections covered.**
  - `npm ci && npm run test:web` gives **1,050 passed, 110 files**.
- **Verdicts:**
  - **Correct:** matches the evidence.
  - **Stale:** was true at an earlier date and has since changed.
  - **Wrong:** contradicted by the evidence.
  - **Overstated:** true in part, but claims more than the evidence supports.
  - **Unverifiable:** no source available to me can confirm or refute it.

## Prioritised summary of fixes

**Must fix: a marker could catch these, or they contradict another slide.**

1. **Casebook figures are stale on slides 8, 14 and 17.**
   - Replace "86 cases" and "85 of 86 / 85 pass" with **88 cases; 87 of 87 running cases pass; 1 skipped
     (EV-018)**.
   - Keep the three slides identical, as the slide 17 note asks.
2. **"30/30 inherited defects closed" (slides 14, 17) is contradicted by our own findings record on `main`.**
   - `docs/evaluation-findings.md` §4 item 8 and §6 record **defect 1 (key rotation) as OPEN** and **defects 25
     and 26 as "not re-verified ... no fix found"**.
   - `mission.md` closes defect 1 by Hanchen's decision (14 Oct) and lists 25–26 as closed. The two records
     disagree, and a marker can open the one in the repository.
   - Safe wording: **"All 6 critical defects closed, each pinned by a test or case; 27 of 30 closed with code
     evidence"**. Alternatively, align the findings record before the deck goes in.
3. **"Independent review on every pull request" (slide 18) is false on GitHub.**
   - `gh pr list --state merged` shows **12 of 95 merged PRs have no review from anyone but their author**:
     #2, 3, 4, 6, 7, 9, 15, 20, 21, 23, 26 and 59. Nine of them merged into `main`, all by 10 Oct.
   - `main` is not branch-protected (`gh api repos/.../branches/main` returns `"protected": false`).
   - Replace with **"Peer review on 83 of 95 PRs, and on every PR after 10 Oct"**, or **"Review by team rule (main
     is unprotected on our plan)"**.
4. **"22 decision records" (slide 18) and the ADR index (slide 21) are stale.**
   - `main` has **25 ADRs**: 023 capabilities by authority, 024 the web offers what the login lists, 025 a
     confidence is the model's statement.
   - Add the three to slide 21 and change slide 18 to "25 decision records".
5. **Slide 8: "Client dataset files: referenced by pointer and hash; never copied in" is wrong.**
   - Intake stores the uploaded source file in `uploads/private_sources/` and each projected input in
     `uploads/texts/` (`text_intake_service.py:255–277`; ADR 005, "Source storage and access boundary").
   - Replace with **"Uploaded once to private file storage; items reference the stored file by path and SHA-256,
     never copied into database rows."**
6. **Slide 13 shows "Alice Chen: accept", but Alice is the seeded Administrator** (README seed table).
   - Since #91 (merged 23 Oct; ADR 023) an administrator cannot review. That contradicts slide 16, "Admin
     oversees, does not judge", and EV-131.
   - Re-run the export with a reviewer (Bob, Fiona or Ethan) and fill in the three `[TBD]` cards.
7. **Slide 6: "About 4 GB" is not borne out.**
   - The client package in `D:/COMP5703_Capstone/dataset/` measures **724 MB on disk (711 MB apparent)**: video
     615 MB, audio 75 MB, image 34 MB, text 0.8 MB.
   - The 4 GB figure comes from our progress report §1.7. Use **"About 0.7 GB"**, or drop the size.
   - "~200 items each" is not true of UOT32, which has 32 sequences.
8. **Slide 18: "One spec per story (Cohn, 2004)" is wrong.**
   - Only one feature spec was ever written (`specs/2026-10-02-F3-separate-versioned-outputs/`, in the docs repo
     history), and it is no longer in the tree.
   - Replace with **"63 user stories with acceptance criteria (Cohn, 2004); 25 decision records"**.
9. **Slide 12's gate wording needs a fix.**
   - "Refuses ... superseded versions" invites the question "so an answer under an old guideline is refused?"
     It is not: that only warns (ADR 020, decision 2).
   - Replace with **"Refuses unreviewed, disputed or superseded answers, and incomplete history; an old guideline
     only warns"**.
10. **Slide 14's example case asserts something no case asserts.**
    - "the provenance record must be unchanged" is not checked: EV-021 checks the refusal (403) and that a
      different reviewer then decides.
    - Reword to EV-021's real assertions (see row 14.6).

**Should fix: accuracy and consistency.**

- **Slide 4 "seven user types, each with checked roles":** the code has **six roles** (`ROLE_CAPABILITIES`,
  `permissions.py`). The quality lead holds no platform role (progress report Table 2: "may not hold an account").
- **Slide 8 "CI tests both":** PostgreSQL runs only on pushes to `main` and manual runs; pull requests run SQLite
  and the web job (`backend-tests.yml:83`).
- **Slide 8 "checks the role's capability on every request":** this holds for governed actions; reads are checked
  by read tiers and membership (ADR 023, decision 4).
- **Slide 9:** step 6 "disagreement → dispute" and step 7 "→ Item finalised and locked" omit settlement (ADR 022)
  and Return (R2-1).
- **Slide 15:** the recall order (47%, 35%) runs opposite to the chart legend (llama3 first). Name the models.
- **Slide 2:** Michael's role line says "provenance events" (F1 is Parth's; Michael's is F2, versions). Tim's
  UniKey still has placeholder brackets.
- **Slide 17:** the Evidence column is `[TBD]` in four rows. "Full journey runs on realistic data: Met" was
  unchecked in `mission.md` on 22 Oct ("Not yet in one run"). Back it with the recorded demo, or show it as Met
  with the evidence named.
- **Rubric:** 16 main slides is correct. Every member must present **at least two** slides, so 16 slides for 8
  people means exactly two each. Most notes still read "Presenter: [TBD]".

## Slide-by-slide

### Slide 2: Information page

| # | Claim | Verdict | Evidence | Suggested replacement |
| --- | --- | --- | --- | --- |
| 2.1 | Eight members listed with UniKeys; "Tim Chung (UniKey: [tchu0487])" | Unverifiable (format Stale) | No source holds UniKeys. Tim's entry keeps the template brackets and a different format from the others | "Tim Chung (tchu0487)" |
| 2.2 | Hanchen: "Project manager and client liaison; review integrity, work queues, evaluation harness, performance" | Correct | `story_src.csv` allocates A2, A5, A6, D4–D6, D8, D9, F3, I1, I2 and K1 to him; `mission.md` names him project manager | none |
| 2.3 | Jingwei: "Review policy and cross-validation; permissions; agreement and evaluation measures; organisations; redesign UI" | Correct | B2, D1–D5, G1–G3, I3–I5, J1, J4 and K4 (SCRUM-128, #97, the UI declutter) | none |
| 2.4 | Yi: "AI provider; disputes and adjudication; Expert Gate and roles; history and release screens" | Correct | C1, E1–E5, G1, G2, F5 and H6 | none |
| 2.5 | Kanishka: "Work queues; dataset intake; release artefact; findings record" | Correct | D8, B5, H1 and I5 (SCRUM-75, #92) | none |
| 2.6 | Michael: "Team lead and client liaison; AI first-pass worker; provenance events; export policy and release gate" | Overstated | C2 and C3 are correct. **F1 (provenance events) is Parth's**; Michael's is **F2** (guideline and policy versions, SCRUM-53). H2 is the manifest and H3 the gate (ADR 020's author). Nothing in the records says "team lead" | "AI batch worker and failures; guideline and policy versions; release gate and manifest" |
| 2.7 | Parth: "PostgreSQL migration and CI; blind second review; provenance capture; disputes; export checks" | Correct | SCRUM-94 / PR #24; D7; F1 (#70); E1–E3, E6; H5 (#93) | none |
| 2.8 | Dishank: "Task lifecycle and completion; status validation; reviewer corrections; canonical export" | Correct | B4, B6, G4, D3 and H4 (#66) | none |
| 2.9 | Tim: "Project setup; invitations; organisation roles and permission governance and dashboard" | Correct | B1, G5, J2 and J3 | Optional: "Project setup; invitations; team management; project dashboard" |

### Slide 3: The problem

| # | Claim | Verdict | Evidence | Suggested replacement |
| --- | --- | --- | --- | --- |
| 3.1 | "Errors made while collecting and labelling data carry into the AI systems built on it (Sambasivan et al., 2021)" | Correct | Data cascades, CHI 2021 | none |
| 3.2 | "How labels were checked is poorly managed and reported, even in published datasets (Klie et al., 2024)" | Correct | Computational Linguistics 50(3):817–866 (ACL Anthology 2024.cl-3.1) | none |
| 3.3 | "LLM suggestions changed annotators' decisions and raised their confidence (Schroeder et al., 2025)" | Correct | Findings of ACL 2025: suggestions raised self-reported confidence and annotators followed them; there was no speed gain | none |
| 3.4 | Question box ("who labelled it ... and refuse to release when it can't") | Correct | Client brief, "Project Overview" (`ProjectDescription.pdf`) | none |
| 3.5 | Provenance definition (source, guideline version, AI suggestion, human response, reviews, adjudication, actor and time) | Correct | `mission.md` "What Success Looks Like"; client R2-5 | none |

### Slide 4: Hej, the platform

| # | Claim | Verdict | Evidence | Suggested replacement |
| --- | --- | --- | --- | --- |
| 4.1 | "seven user types, each with checked roles" | Overstated | `permissions.py` `ROLE_CAPABILITIES` defines **six** roles: admin, task_owner, annotator, reviewer, arbitrator and dispute_participant. The quality lead has no role and "may not hold an account" (progress report §1.3, Table 2) | "Six platform roles, plus the quality lead who reads the results" |
| 4.2 | Administrator: "Invites members and assigns their roles" | Correct | `MANAGE_ORGANIZATION` (ADR 023) | none |
| 4.3 | Task owner: "Sets up projects, policies and datasets; releases data" | Correct | task_owner holds `MANAGE_PROJECT`, `MANAGE_TASK`, `OVERSEE` and `RELEASE` | none |
| 4.4 | Annotator: "Labels items, independently of colleagues" | Correct | EV-025; client R1-4 | none |
| 4.5 | Reviewer: "Accepts, corrects or rejects work, with a reason" | Correct | ADR 003; R2-4 | none |
| 4.6 | Dispute participant: "Escalates a disagreement to an expert" | Correct | `DISPUTE` capability; reviewers hold it too | none |
| 4.7 | Expert: "Rules on disputes independently" | Correct | ADR 011; EV-063. The expert also confirms items at the Expert Gate (ADR 017) | Optional: "Rules on disputes and confirms gated items, independently" |
| 4.8 | Quality lead: "Assesses released data and evaluation results" | Overstated (as a platform role) | No role in the code; reads come through `OVERSEE`, which admin and task owner hold | Keep it, but outside the role list |
| 4.9 | "Next.js web app and FastAPI service: working, but immature" | Correct | Inherited stack; `issues.md` "Executive Status: Red" | none |
| 4.10 | "30 defects in our audit, 6 critical, e.g. finalised answers silently overwritten" | Correct | `info/issues.md`, defects 1–30; critical: 2, 4, 5, 6, 7 and 8 | none |
| 4.11 | "Failed AI calls saved as fake annotations" | Correct | Defect 20 | none |
| 4.12 | "No code review; changes overwrote each other" | Unverifiable | The source is story A1's wording ("the previous team's uncoordinated changes overwrote each other", progress report Appendix D). The inherited history cannot show it | "No review gate; uncoordinated changes overwrote each other" |
| 4.13 | "fixing each defect inside the feature that needed it, proven by a test that fails on the old code" | Overstated | Agreed with the client on 26 Aug (progress report §2.1, O1). But defect 1 (key rotation) has no test, and defects 25–26 were not re-verified (`evaluation-findings.md` §6) | "...each fix pinned by a test or casebook case" |
| 4.14 | Kruchten et al., 2012; Feathers, 2004 | Correct | References verified (slide 20) | none |

### Slide 5: Objectives and scope

| # | Claim | Verdict | Evidence | Suggested replacement |
| --- | --- | --- | --- | --- |
| 5.1 | Six pillars: Govern, Assist, Record, Adjudicate, Release, Evaluate, with their one-line meanings | Correct | Brief, "Project Goals"; `mission.md` "What We Do" | none |
| 5.2 | Project questions Q1 and Q2 "from our proposal" | Unverifiable | The proposal is not in the sources. The report draft uses **RQ1–RQ5** (`report_draft/A-research-questions.md`), so the deck and the report will not match | Align with the report's RQs, or say in the oral that the report refines Q1–Q2 into five RQs |
| 5.3 | In scope: "the full workflow, governance, provenance, release, and 40–60 evaluation cases" | Correct | Brief, "Evaluation Harness and Casebook" | Optional: "...40–60 cases (we delivered 88)" |
| 5.4 | Out of scope: "faster labelling; training or fine-tuning models" | Correct | Brief, Overview and Non-Goals; `mission.md` Non-Goals | none |
| 5.5 | "Text is the committed demo path; image, audio and video keep working" | Correct | Status check 1; `mission.md` Non-Goals | none |

### Slide 6: The client's dataset

| # | Claim | Verdict | Evidence | Suggested replacement |
| --- | --- | --- | --- | --- |
| 6.1 | "About 4 GB across four modalities" | Wrong (against the package on disk) | `du -sh dataset` = **724M** (`--apparent-size` 711M): video 615M, audio 75M, image 34M, text 800K. The 4 GB comes from progress report §1.7, which I could not trace to a source | "About 0.7 GB across four modalities" |
| 6.2 | "~200 items each" | Overstated | Dataset README index: 200 for nine subsets, UCF101 202, MOT17 "200 tracking items from 3 FRCNN train sequences", **UOT32 "32 underwater tracking sequences"**. The text JSONL files have 200 lines each (`wc -l`) | "200 items each (UOT32: 32 sequences)" |
| 6.3 | Datasets and tasks per modality (AG News topic, Few-NERD entities, SemEval-2010 T8 relations, Civil Comments toxicity, BoneBreak, Retail Product Checkout, LibriSpeech, MInDS-14, UCF101, MOT17, UOT32) | Correct | `dataset/README.md`, "Dataset Index": 11 datasets | none |
| 6.4 | Text: "Structured JSONL; one item per record"; image and audio: "one item per file" | Correct | ADR 005; B7 (SCRUM-111); client R1-1 | none |
| 6.5 | "Each subset has a source folder (records or media) and a handoff folder (task and label list)" | Correct | `dataset/README.md`, "Package Structure" | none |
| 6.6 | "Items point to the client's files and record their hash" | Overstated | Intake stores a copy of the uploaded file (`uploads/private_sources/`) and records `source_sha256` and `input_sha256` (`text_intake_service.py:255–309`) | "Each item keeps its source file's and input's SHA-256" |
| 6.7 | "We demo on AG News (Zhang et al., 2015) and Civil Comments (Borkan et al., 2019)" | Correct | The seeded governance projects use AG News and Civil Comments (README seed section; #95) | none |
| 6.8 | Raw record: `ag_news:train:0000`, the text, gold label "Business" | Correct | Line 1 of `text_dataset/ag_news/source/ag_news_text_classification_source_subset.jsonl` | none |
| 6.9 | File name "test-ag-news-text.jsonl, record 1" | Unverifiable | No file of that name exists in the dataset, docs or `hej`. It was probably a one-record upload (see 13.4). The client's file is `ag_news_text_classification_source_subset.jsonl` | "ag_news_text_classification_source_subset.jsonl, record 1" |
| 6.10 | "Hidden gold label; used only to score the AI"; classes World, Sports, Business, Sci/Tech | Correct | Client R1-1; ADR 005 projection; ADR 019 decision 2; `demo-ag-news-labels.json` | none |

### Slide 7: Related work and the gap

| # | Claim | Verdict | Evidence | Suggested replacement |
| --- | --- | --- | --- | --- |
| 7.1 | "Cheap labels work if quality is checked (Snow et al., 2008)" | Correct | EMNLP 2008, pp. 254–263 | none |
| 7.2 | "LLMs can't replace annotators (Felkner et al., 2024)" | Overstated | The paper argues this for **fairness benchmark construction** (ACL 2024, pp. 14104–14115) | "GPT is not a substitute for human annotators of fairness benchmarks (Felkner et al., 2024)" |
| 7.3 | "...their suggestions sway them (Schroeder et al., 2025)" | Correct | As 3.3 | none |
| 7.4 | "Disagreement carries information (Plank, 2022)" | Correct | EMNLP 2022, pp. 10671–10682 | none |
| 7.5 | "agreement should be chance-corrected (Artstein & Poesio, 2008)" | Correct | CL 34(4):555–596 | none |
| 7.6 | "quality is poorly reported (Klie et al., 2024)" | Correct | As 3.2 | none |
| 7.7 | "PROV-DM models entities, activities and agents (Moreau & Missier, 2013)" | Correct | W3C Recommendation, 30 Apr 2013 | none |
| 7.8 | "applied to annotated corpora (Lek et al., 2020)" | Correct | LAW XIV (2020), pp. 13–23; nanopublications for event-annotated corpora | none |
| 7.9 | "datasheets document a dataset (Gebru et al., 2021)" | Correct | CACM 64(12):86–92 | none |
| 7.10 | "Role-based access control and separation of duty define who may act (Sandhu et al., 1996)" | Correct | Computer 29(2):38–47; RBAC constraints cover separation of duty | none |
| 7.11 | Gap column ("rarely kept", "nothing enforces it inside the workflow", "no tool enforces them together") | Unverifiable | Positioning claims. No survey of Label Studio, Prodigy or Argilla is in our sources; the slide 7 note already warns about this | Say "in the work we reviewed" |

### Slide 8: System architecture

| # | Claim | Verdict | Evidence | Suggested replacement |
| --- | --- | --- | --- | --- |
| 8.1 | "Next.js 16 + React 19" | Correct | `apps/hej-web/package.json`: next 16.1.6, react ^19.2.4 | none |
| 8.2 | API: "FastAPI; checks the role's capability on every request" | Overstated | Capabilities guard governed actions (`GovernedAction`); reads go through read tiers (ADR 023, decision 4) | "Checks the caller's capability on every governed action" |
| 8.3 | Services: SQLAlchemy; "Queues, review, disputes, release gate" | Correct | `app/services/` (`task_work_queue_service.py`, `release_gate.py`, ...) | none |
| 8.4 | "AI worker, separate process; runs AI batches outside DB transactions" | Correct | `app/worker.py` docstring; `ai_batch_service.py:664` | none |
| 8.5 | "PostgreSQL 18" | Correct | `compose.yaml` `image: postgres:18`; CI service `postgres:18`; README | none |
| 8.6 | "SQLite kept for fast local development; CI tests both" | Overstated | Pull requests run SQLite and web only; PostgreSQL runs on pushes to `main` and manual dispatch (`backend-tests.yml:83`; findings §2) | "...CI runs SQLite on every PR, PostgreSQL on every merge to main" |
| 8.7 | "Every answer is kept as its own version" | Correct | ADR 009 | none |
| 8.8 | "provenance events are locked by a database trigger, so history can be added to but never rewritten" | Correct | `db_models.py` (~lines 70–115): SQLite `BEFORE UPDATE`, `BEFORE DELETE` and replace-insert triggers; PostgreSQL `BEFORE UPDATE OR DELETE` and `BEFORE TRUNCATE` call `refuse_provenance_mutation()`. Caveat: the database owner can drop a trigger; EV-117 and EV-123 show `evaluation verify` finds such a deletion | none |
| 8.9 | "86 cases log in as real roles and call the same API" | Stale | 88 case files; `baseline.json` 88 entries (87 pass, 1 skip); run today | "88 cases log in as real roles..." |
| 8.10 | LLM providers "OpenAI, Qwen, DeepSeek, Doubao, Groq, or local Ollama, through one typed client" | Correct | `app/integrations/analyzers/base.py:50–107` (`resolve_provider_config`); `JsonCompletionClient` protocol | none |
| 8.11 | Client dataset files "Referenced by pointer and hash; never copied in" | Wrong | Intake writes the source to `uploads/private_sources/` and projected text to `uploads/texts/` (`text_intake_service.py:255–277`; ADR 005) | "Stored once in private file storage; referenced by path and SHA-256" |

### Slide 9: End-to-end workflow

| # | Claim | Verdict | Evidence | Suggested replacement |
| --- | --- | --- | --- | --- |
| 9.1 | Eight steps, each recorded with who acted, when, and under which guideline | Correct | `mission.md` journey (project → policy → task → items → AI → review → cross-validation → dispute → adjudication → release); F1 events and F2 versions | none |
| 9.2 | Step 1: every invitation carries its roles; the invitee gets exactly those roles | Correct | G5 (#16, #28, #56); `invitations.py:72–87` | none |
| 9.3 | Step 2: review policy (approvals, cross-review sample, governance posture); "Policy saved as a version" | Correct | ADR 018; `project_policy_templates.py` | none |
| 9.4 | Step 3: chooses labels and editor, imports JSONL, gold hidden; "Task activated; items enter queues" | Correct | ADR 004, ADR 005; B4 activation (#41). Activation also starts the AI first pass (`tasks.py:876`) | none |
| 9.5 | Step 4: "On AI-assisted tasks the model suggests a label and confidence, or records a failure" → "goes to review, marked AI" | Correct | EV-002, EV-107; ADR 025 (confidence may be null, never 0) | none |
| 9.6 | Step 5: role-checked queues; can't see colleagues' answers | Correct | D8; EV-025 | none |
| 9.7 | Step 6: "Accepts, adjusts, rejects or escalates one named submission, always with a reason"; "Approved → final; disagreement → dispute" | Overstated | A review names its submission (#34) and needs a reason (ADR 003). A held split under Standard or Dual sign-off may be **settled by an independent reviewer** without a dispute (ADR 022; EV-125, EV-129) | "...disagreement → settled by an independent reviewer or sent to dispute" |
| 9.8 | Step 7: "An expert who never touched the item rules: accept, return or reject" → "Item finalised and locked" | Overstated | Return sends the item back to the open workflow (R2-1; EV-040, EV-102–104). Expert Gate confirmation is also an expert step (EV-112) | "→ Accept finalises; Return reopens; Reject closes the dispute" |
| 9.9 | Step 8: "The gate checks every item's history, then builds an immutable release and manifest" → "Anyone can verify it from the manifest" | Correct | ADR 020, ADR 021; EV-122. An admin may also release (`RELEASE`) | Optional: "Task owner or admin" |

### Slide 10: AI assistance

| # | Claim | Verdict | Evidence | Suggested replacement |
| --- | --- | --- | --- | --- |
| 10.1 | "One interface, six providers; swapping the model never touches the workflow; a mock stands in for tests" | Correct | `JsonCompletionClient`; casebook AI scripted at the model interface (ADR 006). `mission.md`: "no runtime mock switch", which is fine since it is swapped at the interface | "...a scripted model stands in for tests" |
| 10.2 | "Its answer is reviewed like anyone's, never treated as ground truth (Felkner et al., 2024)" | Correct | Client R2-7: "AI first pass cannot become canonical without human review"; ADR 010; EV-002 | none |
| 10.3 | "The inherited code saved failed calls as fake annotations; transient errors now retry, permanent ones are set aside" | Correct | Defect 20; `ai_batch_service.py` (`retry_wait`, `dead_letter`, `ERROR_KIND_TRANSIENT`/`PERMANENT`, jittered backoff ~line 736) | none |
| 10.4 | "Blind-then-reveal: the annotator answers first, then sees the suggestion and may revise" | Correct, but leaves out the scope | ADR 016: an **evaluation protocol on human-first judgement tasks**, not a production mode (client 7 Oct and 14 Oct; issue #72) | "Blind-then-reveal (an evaluation protocol, judgement tasks): ..." |
| 10.5 | "One typed client records provider and model on every answer; batch jobs run in the AI worker" | Correct | `provenance_events.model_provider`, `model_name`, `model_version` (`db_models.py:49–51`); `served_model` (base.py) | none |
| 10.6 | "Outcome: a suggestion with its confidence, or an explicit AI failure" | Correct | ADR 016 decision 2; ADR 025 | none |

### Slide 11: Review and adjudication

| # | Claim | Verdict | Evidence | Suggested replacement |
| --- | --- | --- | --- | --- |
| 11.1 | "No one reviews or adjudicates their own work (separation of duty; Sandhu et al., 1996)" | Correct | EV-021, EV-022, EV-023, EV-063, EV-115; ADR 011 | none |
| 11.2 | "A second review never returns to the first reviewer, and is blind to the first decision" | Correct | ADR 010; EV-026, EV-091 | none |
| 11.3 | "A reviewer's correction is a proposal, not the answer" | Correct | ADR 012; EV-070–073 | none |
| 11.4 | "An expert's ruling is final: accept, return or reject" | Correct | Client R2-1; `annotation_dispute_service.py:389`. Reconciliation uses choose_one, reject_all or return (`item_reconciliation_service.py:29`) | none |
| 11.5 | Standard: "One approval; 10% sampled for cross-review" | Correct | `project_policy_standard_v1`: `review_required_approvals=1`, `cross_review_percentage=10` | none |
| 11.6 | Dual sign-off: "Two independent approvals on every item" | Correct | `project_policy_dual_signoff_v2`: 2 approvals, 100% | none |
| 11.7 | Arbitration-ready: "A dispute closes only by an independent expert" | Correct | `..._arbitration_ready_v2`: `adjudication_mandatory_on_dispute=True`, 2 approvals; EV-124, EV-127 | Optional: "Two approvals; a dispute closes only by an independent expert" |
| 11.8 | Expert Gate: "An expert confirms every item before it is final" | Correct | `..._expert_gate_v2`: `expert_gate_required=True`, 1 approval, 0% sample; EV-112–115. The UI label is "Expert-gated review" | none |

### Slide 12: Provenance and release

| # | Claim | Verdict | Evidence | Suggested replacement |
| --- | --- | --- | --- | --- |
| 12.1 | "Every write is a version, with actor, time and guideline version" | Correct | ADR 009, ADR 018; F1 events | none |
| 12.2 | Gate "Refuses unreviewed items, incomplete history or superseded versions" | Overstated / ambiguous | Five refusals: unreviewed, disputed, superseded **answer**, no authoritative answer, incomplete provenance. A superseded **guideline or policy version only warns** (`release_gate.py` docstring; ADR 020 decisions 1–2) | "Refuses unreviewed, disputed or superseded answers and incomplete history" |
| 12.3 | "Immutable release: a frozen snapshot of one authoritative answer per item" | Correct | H1 (#65), H4 (#66); ambiguous items are listed with no value (ADR 021 decision 2) | none |
| 12.4 | "Manifest lets anyone rebuild and check the release independently" | Correct | ADR 021 (SHA-256 of the artefact and each line); EV-122 | none |
| 12.5 | History holds source and hash, guideline version, AI suggestion, human response, reviews, adjudication, "after PROV-DM" | Correct | `mission.md` success criterion 2; F1 event kinds | none |
| 12.6 | "The gate reads what was recorded. It can never be satisfied by someone asserting that review happened." | Correct | `release_gate.py` module docstring; brief | none |

### Slide 13: Full workflow on real data

| # | Claim | Verdict | Evidence | Suggested replacement |
| --- | --- | --- | --- | --- |
| 13.1 | Raw record and "Gold label hidden from the AI and reviewer" | Correct | As 6.8 and 6.10 | none |
| 13.2 | "task export (normalized JSON), 22 Oct 2026" | Unverifiable | No export file in `docs/` or `hej` | Keep the export file with the presentation materials |
| 13.3 | "Source and hash: sha256 44d6f516… · record 1" | Correct (consistent) | `sha256(json.dumps(record 1))` = `44d6f516…`. Intake hashes the **whole uploaded file** (`text_intake_service.py:255`), so the upload was a one-record file | none (say "hash of the uploaded file" if asked) |
| 13.4 | "Guideline version v1 · policy v1 (standard)" | Unverifiable | Export not available | none |
| 13.5 | "AI suggestion deepseek-flash · Business, 0.98" | Unverifiable (alias Correct) | `deepseek-flash` is the configured alias (ADR 019 decision 3; findings `0f0aadcf`) | none |
| 13.6 | "Reviews: Alice Chen: accept, 'Correct'" | Stale / inconsistent | Alice is the seeded **Admin** (README seed table). Since #91 (merged 23 Oct 08:23 UTC) an admin cannot review (ADR 023; EV-131). This contradicts slide 16 | Re-run with Bob Johnson (reviewer) and a fuller reason |
| 13.7 | "Adjudication: none needed: 1 approval met policy" | Correct | Standard, one approval, unless sampled | none |
| 13.8 | Three `[TBD]` cards (items run, completion date, releases built) | Unverifiable (placeholder) | Placeholders | Fill in from the recorded demo run |

### Slide 14: Evaluation casebook

| # | Claim | Verdict | Evidence | Suggested replacement |
| --- | --- | --- | --- | --- |
| 14.1 | Title "85 of 86 end-to-end cases pass through the real API, with none failing" | Stale | Run today: 87/87 passed, 1 skipped, 88 unchanged | "87 of 88 cases pass through the real API; none fail" |
| 14.2 | "86 cases in the casebook" | Stale | 88 (EV-131 and EV-132 added by #91) | "88" |
| 14.3 | "85 pass on main; one skipped, none failing" | Stale | As 14.1 | "87 pass on main; one skipped, none failing" |
| 14.4 | "8/9 adversarial categories with a running case" | Correct | `evaluation list --coverage`; `ADVERSARIAL_CATEGORIES` (`harness/scenario.py:83`) | none |
| 14.5 | "30/30 inherited defects closed, including all 6 critical" | Overstated | 6 critical closed: Correct (`evaluation-findings.md` §6). Defect 1 is OPEN and 25 and 26 are not re-verified in that record (§4 item 8). `mission.md` says 30/30 | "6/6 critical defects closed" (card), with "27 of 30 closed with code evidence" in the notes |
| 14.6 | Example: "A scripted reviewer tries to approve their own annotation. The API must refuse it, and the provenance record must be unchanged." | Overstated | EV-021 asserts `refused = 403`, then a different reviewer accepts and the item canonicalises; no step checks the provenance. EV-120 (the forged self-review is found by `verify`) is the record-side case | "EV-021: someone who annotated an item tries to approve it. The API must refuse (403) and another reviewer decides. If it doesn't, the case fails." |
| 14.7 | "Each case builds a fresh database and a scripted AI, so every run is compared with a committed baseline" | Correct | ADR 006; `tests/test_evaluation_baseline.py`, `test_evaluation_repeatable_runs.py` | none |
| 14.8 | "Not yet covered: a changed source file (EV-018), written but skipped until source versioning exists" | Correct | `EV-018` skip reason; findings §10 | none |

### Slide 15: AI accuracy against gold labels

| # | Claim | Verdict | Evidence | Suggested replacement |
| --- | --- | --- | --- | --- |
| 15.1 | Chart: llama3 84.5 / 65.5; DeepSeek Flash 92.5 / 69.8 | Correct | ADR 019, Consequences; findings §3.2 table | none |
| 15.2 | "full recorded runs of 200 records per dataset (ADR 019); DeepSeek Flash answered 199 on Civil Comments" | Correct | 400 records over the two datasets, 200 each (JSONL line counts); one non-JSON reply | none |
| 15.3 | "Recall on the toxic class 47% and 35%" | Correct, but the order is confusing | DeepSeek 47%, llama3 35% (ADR 019). The chart legend lists llama3 first | "Toxic-class recall: DeepSeek 47%, llama3 35%" |
| 15.4 | "ECE 0.22 and 0.27" | Correct | DeepSeek 0.22, llama3 0.27 | "ECE: DeepSeek 0.22, llama3 0.27" |
| 15.5 | "One malformed reply was counted as an AI failure, not an answer" | Correct | Findings §3.2, §4 item 1 | none |
| 15.6 | ECE definition; Guo et al., 2017 | Correct | Five equal bins (ADR 019 decision 5) | none |
| 15.7 | "on toxicity, a model's confidence is no reason to skip human review" | Correct | ADR 019, "Across the two models" | none |

### Slide 16: Design decisions and trade-offs

| # | Claim | Verdict | Evidence | Suggested replacement |
| --- | --- | --- | --- | --- |
| 16.1 | "No item assignment: client decision; work is self-served from role-checked queues"; "Independence must live in the queue query" | Correct | Client R1-4 (21 Sep; decision recorded 17 Sep in `mission.md` Risks) | none |
| 16.2 | "PostgreSQL by default, SQLite kept: concurrency; fast local development; two databases to test; CI runs both" | Correct (CI as in 8.6) | SCRUM-94 / PR #24; status check 2 client note | "...CI runs SQLite per PR and both on main" |
| 16.3 | "A correction is a proposal; an expert or the author must adopt it" | Correct | ADR 012; D3; SCRUM-124 (expert Accept of a correction) | none |
| 16.4 | "Admin oversees, does not judge" | Correct | ADR 023 (#91, 23 Oct); EV-131 | none |
| 16.5 | "Text is the committed demo path" | Correct | As 5.5 | none |
| 16.6 | Limitations: scripted participants; coarse confidence flatters calibration; source versioning not built (EV-018) | Correct | Findings §4 items 2, 4 and 5 | none |

### Slide 17: Outcomes against the brief

| # | Claim | Verdict | Evidence | Suggested replacement |
| --- | --- | --- | --- | --- |
| 17.1 | "Full journey runs on realistic data: Met" | Unverifiable (Evidence `[TBD]`) | `mission.md` on 22 Oct left it unchecked ("Not yet in one run": EV-100 and EV-101 are human-first; the AI cases do not reach a release). Status check 3 claims it is achieved on the seeded governance projects | Name the recorded demo run, or "Met: EV-100/101 + recorded demo" |
| 17.2 | "End-to-end provenance for every released item: Met" | Correct | F1 (#70), F2 (#63), F5 (#85), EV-101, `evaluation verify` (I5). Pre-16 Oct work is exempt (ADR 020 decision 3) | Evidence: "F1 events; EV-101; verify" |
| 17.3 | "Immutable releases with manifests, gated before they exist: Met" | Correct | H1–H4; ADR 020, ADR 021; EV-015, EV-016, EV-122 | Evidence: "ADR 020/021; EV-016, EV-122" |
| 17.4 | "AI behind a typed interface; failure never disguised: Met" | Correct | `JsonCompletionClient`; EV-002, EV-107 | Evidence: "6 providers; EV-002, EV-107" |
| 17.5 | "Exceeded: 86 cases, 85 pass, none failing (22 Oct)" | Stale | 88 cases; 87 of 87 running pass (26 Oct) | "88 cases, 87 pass, 1 skipped (26 Oct)" |
| 17.6 | "Met: 30/30 defects closed, all 6 critical (22 Oct)" | Overstated | As 14.5 | "All 6 critical closed; defect 1 key rotation by decision" |

### Slide 18: Reflection and next steps

| # | Claim | Verdict | Evidence | Suggested replacement |
| --- | --- | --- | --- | --- |
| 18.1 | "Weekly sprints, one definition of done (Schwaber & Sutherland, 2020)" | Correct | `roadmap.md` W6–W11 weekly sprints; `validation.md` DoD practice | none |
| 18.2 | "One spec per story (Cohn, 2004)" | Wrong | Only one feature spec was ever written (`specs/2026-10-02-F3-separate-versioned-outputs/`, docs repo history), and it is no longer in the tree. 63 stories carry acceptance criteria in `story_src.csv` | "63 user stories with acceptance criteria (Cohn, 2004)" |
| 18.3 | "22 decision records" | Stale | 25 ADRs in `docs/adr/` on `main` | "25 decision records" |
| 18.4 | "Independent review on every pull request" | Overstated | 12 of 95 merged PRs have no non-author review on GitHub (#2, 3, 4, 6, 7, 9, 15, 20, 21, 23, 26, 59); `main` is unprotected; direct commit `d4d809c` (13 Sep) per `mission.md` Risks | "Peer review on every PR since 10 Oct (83 of 95 overall)" |
| 18.5 | "The casebook as a regression net" | Correct | Exact baseline comparison in CI | none |
| 18.6 | "Records drifted ahead of the code"; "Parallel branches changed the same files" | Correct | `mission.md` Risks ("Records can mark a story complete ahead of its code"; "Parallel branches edit the same files") | none |
| 18.7 | `[TBD: one lesson per member]` | Unverifiable (placeholder) | Placeholder | Fill in |
| 18.8 | Next steps: other modalities; source versioning (EV-018); a study with real annotators | Correct | Findings §4 items 4–5, §6 open items | none |
| 18.9 | Notes: "CI was blocked by billing for four days (16–20 Oct)" | Correct | `mission.md` Risks (closed 20 Oct) | none |

### Slide 20: References

All 19 listed references exist, and their authors, years, venues and pages match. Every entry is cited on at least
one slide, and every slide citation is in the list:

- Sambasivan, Klie, Schroeder (3); Kruchten, Feathers (4); Zhang, Borkan (6); Snow, Felkner, Plank, Artstein &
  Poesio, Moreau & Missier, Lek, Gebru, Sandhu (7); Parasuraman & Manzey (10); Guo (15); Schwaber & Sutherland,
  Cohn (18).
- No orphan in either direction.

| # | Reference | Verdict | Evidence / note |
| --- | --- | --- | --- |
| 20.1 | Artstein & Poesio (2008), CL 34(4), 555–596 | Correct | Standard citation |
| 20.2 | Borkan et al. (2019), Companion Proc. WWW 2019, 491–500 | Correct | DBLP; DOI 10.1145/3308560.3317593 |
| 20.3 | Cohn (2004), Addison-Wesley | Correct | none |
| 20.4 | Feathers (2004), Prentice Hall | Correct | none |
| 20.5 | Felkner, Thompson & May (2024), ACL 2024, 14104–14115 | Correct | ACL Anthology 2024.acl-long.760 |
| 20.6 | Gebru et al. (2021), CACM 64(12), 86–92 | Correct | none |
| 20.7 | Guo et al. (2017), ICML, PMLR 70, 1321–1330 | Correct | none |
| 20.8 | Klie, Eckart de Castilho & Gurevych (2024), CL 50(3), 817–866 | Correct | ACL Anthology 2024.cl-3.1 |
| 20.9 | Kruchten, Nord & Ozkaya (2012), IEEE Software 29(6), 18–21 | Correct | none |
| 20.10 | Lek, de Groot, Kuhn & Morante (2020), LAW XIV, 13–23 | Correct | ACL Anthology 2020.law-1.2 |
| 20.11 | Moreau & Missier (Eds.) (2013), PROV-DM, W3C Recommendation | Correct | none |
| 20.12 | Parasuraman & Manzey (2010), Human Factors 52(3), 381–410 | Correct | none |
| 20.13 | Plank (2022), EMNLP 2022, 10671–10682 | Correct (title shortened) | Full title adds ": On ground truth in data, modeling and evaluation" |
| 20.14 | Sambasivan et al. (2021), CHI 2021, 1–15 | Correct | Article 39 |
| 20.15 | Sandhu et al. (1996), Computer 29(2), 38–47 | Correct | none |
| 20.16 | Schroeder, Roy & Kabbara (2025), Findings of ACL 2025, 25771–25795 | Correct | ACL Anthology 2025.findings-acl.1323 |
| 20.17 | Schwaber & Sutherland (2020), The Scrum Guide | Correct | none |
| 20.18 | Snow et al. (2008), EMNLP 2008, 254–263 | Correct (title shortened) | Full title adds "Evaluating non-expert annotations for natural language tasks" |
| 20.19 | Zhang, Zhao & LeCun (2015), NeurIPS 28, 649–657 | Correct | none |

Not cited, but likely to come up in the oral: Krippendorff's alpha and Fleiss' kappa (ADR 019). Both are fine to
explain verbally, and Artstein & Poesio (2008) covers both.

### Slide 21: Architecture decision records

| # | Claim | Verdict | Evidence | Suggested replacement |
| --- | --- | --- | --- | --- |
| 21.1 | Index lists ADR 001–022 | Stale | `docs/adr/` on `main` holds 25 files | Add "023 Capabilities follow authority; reads are a tier", "024 The web offers what the login lists", "025 A confidence is the model's statement" |
| 21.2 | Short titles of 001–022 | Correct | Match the ADR headings (abbreviated) | none |

### Slide 22: Q&A backup

| # | Claim | Verdict | Evidence | Suggested replacement |
| --- | --- | --- | --- | --- |
| 22.1 | `[TBD] Backup material` | Unverifiable (placeholder) | Placeholder | Fill in from `oral-qa-prep.md`, or delete the slide |

## Rubric structure check

| Requirement (`final-presentation-rubric.txt`) | Status | Note |
| --- | --- | --- |
| 15–16 pages excluding the title and information pages | Met | Slides 3–18 = 16 main slides; 19–22 are appendix (allowed as extra slides) |
| Motivation / objective | Met | Slides 3–6 |
| Related work / background | Met | Slide 7 |
| Own approach / method | Met | Slides 8–12 |
| Main results | Met | Slides 13–15 (13 still has placeholders) |
| Discussion / evaluation | Met | Slide 16 |
| Conclusion and reflection | Met | Slides 17–18 (`[TBD]` on both) |
| Information page with each member's name and role(s) | Met, with fixes | Slide 2; fix Tim's UniKey brackets and Michael's role line |
| Every member presents at least two slides | Open | 16 slides for 8 members means exactly two each; presenters are `[TBD]` on 12 slides |
| AI statement submitted with the slides | Not in the deck | Separate form required by the rubric |
| File name "CSXX-X_Group_Slides" | Check | Current name `CS57_Group_Slides.pptx`; the template example uses a hyphenated group id |

## Verdict counts

Counted over the 139 rows in the slide tables above (references included):

| Verdict | Count |
| --- | --- |
| Correct | 101 |
| Overstated | 18 |
| Stale | 9 |
| Wrong | 3 |
| Unverifiable | 8 |
| **Total** | **139** |

## Could not verify

- **UniKeys** and **"team lead"** on slide 2: no source holds them.
- **Q1/Q2 wording** from the proposal: the proposal is not in `docs/`. The report draft uses RQ1–RQ5.
- **The 22 Oct export behind slide 13** (guideline v1, policy v1, deepseek-flash 0.98): the export file is not
  stored. The hash is consistent with a one-record upload of AG News record 1.
- **"About 4 GB":** the only local package is 0.7 GB. If the client's original download was larger, keep the
  source of that figure to hand.
- **"No code review" in the inherited repository:** this comes from the A1 story text, not from git evidence.
- **Whether the 12 PRs without a GitHub review were reviewed in person or in chat:** GitHub records no review.
