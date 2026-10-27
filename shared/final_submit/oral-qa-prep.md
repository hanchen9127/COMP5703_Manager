# CS-57 oral defence: Q&A preparation

- **For:** the 20-minute interactive oral after the final presentation. The marker picks **any member** to answer
  any question, and others may add afterwards. Q&A is worth 30 marks and project understanding and insight another 30
  (`final-presentation-rubric.txt`). Everyone should know the whole document, not just their own area.
- **Sources:** `slides-factcheck.md` (re-run figures, 26 Oct), `CS57_Group_Slides_v2.pptx` (read 26 Oct, 15:56),
  `report_draft/A-draft.md` and `B-draft.md`, `docs/specs/` (mission, roadmap, tech-stack), `docs/info/`
  (client Q&A, issues, status checks, progress report), the GitHub QA issues (#38, #40, #72), and `hej` `origin/main` at
  `6951781` (ADRs 001–025, `docs/evaluation-findings.md`, `permissions.py`, `release_gate.py`, `db_models.py`,
  `backend-tests.yml`, `project_policy_templates.py`, the casebook). I re-checked against GitHub today that 12 PRs have no
  non-author review and that `main` reports `"protected": false`.
- **How to use it:** learn the cheat sheet by heart. For each question, give the short answer first, then one piece of
  evidence (an ADR, a case ID or a PR number). Say "we", and if something is a limitation, say so plainly.
- Items marked **[unverified]** could not be confirmed from the sources. Do not state them as fact.

---

## Part 1: Core facts every member must know

### The project in one breath

Hej (Human Evaluation and Judgement) is the platform Arc Intelligence uses to produce labelled datasets. The client is
**Hunter Xu**. We inherited a working but immature Next.js + FastAPI codebase and extended it into a governed,
provenance-aware human–AI annotation system. **The goal is not faster labelling.** A released dataset must be able to
answer, for every item, *"how did this label get here?"*, and the platform must **refuse to release** when it cannot.

### Numbers (as of `main` `6951781`, 26 Oct 2026)

| What | Figure | Nuance to say if pressed |
| --- | --- | --- |
| User stories | **63 in 11 epics (A–K), all complete** | Started with 59; B7, B8, D9 (client answers, 24 Sep) and A6 (performance, 4 Oct) were added |
| Jira tickets | **104, all Done** | |
| Merged PRs | **95, none open**; last one #104 on 26 Oct | 15 merged in W11 |
| Review | **83 of 95** have a formal GitHub review by a non-author; **93** if we count the tracker's reviewer of record; the other 2 (#3, #15) only merged `main` into a personal branch | **12 PRs have no GitHub review by a non-author:** #2, 3, 4, 6, 7, 9, 15, 20, 21, 23, 26, 59. Nine of them went into `main`, the last of those on 10 Oct. Every PR after 10 Oct has a GitHub review. `main` is **not branch-protected**: the repository's GitHub plan does not offer it |
| Review load | Hanchen 42, Jingwei 27, Yi 23 (reviews, counting both sources) | Three members did most of the reviewing; we name this ourselves as a weakness |
| Backend tests | **2,495 passed, 62 skipped** on SQLite (154 test files) | The skipped tests are PostgreSQL-only. The last recorded PostgreSQL full run (23 Oct) gave 2,544 passed, 3 skipped |
| Web tests | **1,050 passed in 110 files** (Vitest) | No test drives a real browser |
| Casebook | **88 cases; 87 of 87 running cases pass; 1 skipped (EV-018); no regression against the committed baseline** | The brief asked for 40–60 |
| Adversarial coverage | **9 of 9 categories have a case; 8 of 9 have one that runs; 16 of 16 owed protections covered** | The ninth category, `source_changed`, has only EV-018, which is skipped |
| ADRs | **25** (`hej/docs/adr/`, 001–025) | 023, 024 and 025 are the newest |
| Inherited defects | **30 in our audit:** 6 critical, 15 high, 6 medium, 3 low. **All 6 critical are fixed, each pinned by a case or a test** | **All 30 closed** (re-checked 26 Oct). **Defect 1:** the committed Gemini key was removed from the code in September; on 26 Oct the Gemini API refused it (HTTP 401), so it no longer grants access, though it stays in git history. **Defects 25 and 26** (two weak tests) were fixed on 3 Sep by `e0e642ac` (A2, PR #2) and their tests pass on `main`. **Defect 30** is closed by policy: deleting a task or project that holds items returns 409, and you archive it instead. The findings record is being corrected to match (branch `CS57-Hanchen-findings-defect-register`) |
| Dataset | 11 subsets in 4 modalities; text: AG News, Few-NERD, SemEval-2010 T8, Civil Comments, **200 records each** | About **0.7 GB on disk** (724 MB), **not** 4 GB; UOT32 has 32 sequences, not 200 items |
| Model runs | 400 records (200 AG News + 200 Civil Comments) per model, plus a committed 56-record gold subset | |

### Names and dates

- **Team:** Hanchen Wang (project manager), Jingwei Lin, Yi Geng, Kanishka Kathait, Michael Max (client liaison
  Weeks 3–8), Parth, Dishank Aswal and Tim Chung.
- **Client contact:** first meeting 19 Aug; kick-off and **Status Checking 1** on 26 Aug, which fixed scope (text
  first) and the defect policy; inherited `week13` baseline merged 28 Aug; client meetings every Wednesday at 7 pm;
  **no item assignment** decided 17 Sep; written Q&A Round 1 answered 21 Sep; **Status Checking 2** on 23 Sep; Round 2
  answered 24 Sep; questions moved to GitHub QA issues from 3 Oct; from 7 Oct the client asked us to settle open
  questions as our own design; blind-then-reveal clarified on 14 Oct (issue #72); **Status Checking 3** and demo on
  28 Oct; handover by **1 Nov**.
- **Sprints:** weekly Scrum, seven sprints: **W6** 7–13 Sep · **W7** 14–23 Sep · **W8** 24–30 Sep · **Break** 1–7 Oct ·
  **W9** 8–14 Oct · **W10** 15–21 Oct · **W11** 22–28 Oct. From 19 Sep each sprint ran Thursday to Wednesday. **Build
  work ended on 28 Oct** (re-plan of 1 Oct).
- **Key merges:** #24 PostgreSQL 18 (20 Sep) · #48 disputes and adjudication (11 Oct) · #70 F1 provenance events and #66
  H4 one authoritative answer, the last critical defect (both **16 Oct**) · #73 blind-then-reveal (16 Oct) · #83 H3
  release gate, #84 H2 manifest and #77 I3 agreement and model runs (19 Oct) · #79 I5 integrity checks and #86 release
  screens (20 Oct) · #92 findings record (22 Oct) · #91 permission model, under which an admin does not judge (23 Oct) ·
  #104, the last (26 Oct). CI was blocked by a billing problem **16–20 Oct**.

### The six pillars (from the client's brief)

**Govern** (organisations, roles, permissions, versioned guidelines) · **Assist** (AI suggestions behind one replaceable
model interface) · **Record** (who did what, when, under which guideline) · **Adjudicate** (review, disagreement and expert
rulings kept as distinct facts) · **Release** (immutable releases, refused when history is incomplete) · **Evaluate**
(repeatable measurement of quality, collaboration and integrity).

### The eight workflow steps (slide 9)

1. **Set up the organisation** (admin): each invitation carries its roles.
2. **Configure the project** (task owner): approvals, cross-review sample and posture, saved as a policy version.
3. **Create the task and import** (task owner): labels, editor and a JSONL import; gold labels stay hidden; activation
   puts items in the queues.
4. **AI first pass** (on AI-assisted tasks): a suggestion with its confidence, or a recorded failure.
5. **Annotate:** self-served from role-checked queues; nobody sees a colleague's answer first.
6. **Review:** accept, adjust, reject or escalate one *named* submission, always with a reason.
7. **Adjudicate:** an independent expert decides Accept, Return or Reject. A held split under Standard or Dual sign-off
   may instead be **settled by an independent reviewer** (ADR 022).
8. **Release:** the gate checks every item's recorded history, then builds a frozen release and its manifest.

### The six roles and what each may do (`permissions.py`, ADR 023)

| Role | Capabilities | May not |
| --- | --- | --- |
| `admin` | manage organisation, project and task; oversee; release | annotate, review, dispute or adjudicate (since #91, 23 Oct) |
| `task_owner` | manage project and task; oversee; release; reopen an item | judge the work; manage the organisation |
| `annotator` | annotate | see a peer's answer before answering; touch another person's draft |
| `reviewer` | review (approval and settlement included); dispute | review an item they answered |
| `arbitrator` (the expert) | adjudicate: disputes, reconciliations, Expert Gate confirmation | decide an item they annotated, reviewed, routed or settled |
| `dispute_participant` | dispute (route a held split to an expert) | decide the dispute |

These rules apply to everyone, admins included: a draft belongs to its author, a finalised item takes no new work, and
nobody reviews, settles or adjudicates their own work. The **quality lead** on slide 4 is a **user type, not a platform
role**. Their reads come through `OVERSEE`.

### The four governance postures (`project_policy_templates.py`)

| Posture | Stored values | What it guarantees |
| --- | --- | --- |
| **Standard** | 1 approval; 10% cross-review sample | One reviewer is enough. A split in the sample can be settled by an independent reviewer |
| **Dual sign-off** (v2) | 2 approvals; 100%; split held for manual handling | Two independent approvals. A split is settled by an independent reviewer or opened as a dispute (ADR 022). v1, "automatic dispute", is still selectable |
| **Arbitration-ready** (v2) | 2 approvals; 100%; `adjudication_mandatory_on_dispute = true` | **If a dispute happens, an independent expert must decide it.** No peer settlement (EV-124, EV-127) |
| **Expert Gate** (v2) | 1 approval; 0%; `expert_gate_required = true` | **An expert confirms every item** before it becomes canonical (ADR 017, EV-112 to EV-115) |

The client's distinction (R2-8): Dual sign-off says how ordinary agreement is reached; Arbitration-ready says what must
happen when agreement fails.

### AI providers and evaluation results

- **Providers:** OpenAI, Qwen, DeepSeek, Doubao, Groq and local Ollama, all through one `JsonCompletionClient` interface
  (`app/integrations/analyzers/base.py`). Every answer records the provider, model and the version the provider served.
  The casebook replaces the model with a scripted client at that same interface.
- **Results** from recorded runs replayed through the platform (ADR 019; `evaluation-findings.md` §3.2):

| Model | AG News accuracy | Civil Comments accuracy | Toxic-class recall | ECE (5 bins) on Civil Comments | AG News ECE |
| --- | --- | --- | --- | --- | --- |
| llama3 (local, Ollama) | **84.5%** | **65.5%** | **35%** | **0.27** | 0.008 in five bins; **0.043** by stated value |
| DeepSeek Flash (hosted) | **92.5%** | **69.8%** of 199 answered | **47%** | **0.22** | 0.040 |

- **The headline finding:** both models are good on news topics but miss most toxic comments **while still sounding
  confident**. On toxicity, a model's confidence is no reason to skip human review.
- One DeepSeek reply was not valid JSON. It was **counted as an AI failure, not an answer**, which is why that row
  says "of 199".
- llama3 only ever states a confidence of 0.8, 0.9 or 1.0, so its five-bin ECE on AG News flatters it.

### Main known limitations (say them before you are asked)

1. **Every person in the evaluation is scripted.** We have no user study, so anchoring, agreement and human-accuracy
   figures show that the pipeline and the arithmetic work, not how real people behave.
2. **Each model was recorded once,** so each set of figures is one sample. Re-recording 56 records changed 10 answers.
3. **Source versioning is not built:** EV-018 is skipped.
4. **No browser end-to-end tests,** and no performance or load tests.
5. **Roles apply to the whole organisation only.** The client said project-level isolation is required (R1-6); we
   deferred it.
6. **No migration tool.** Development databases are reset after a schema change.
7. **Work from before 16 Oct is exempt from the provenance check** (ADR 020), and releases made before manifests cannot
   be rebuilt from one.
8. **Image, audio and video were only kept working.** One known gap: a judgement image task asks the AI for boxes but
   offers a person only a verdict.
9. **`main` is unprotected,** so review before merge is enforced by team rule only.
10. **Defect 1:** the leaked key no longer works (the Gemini API refused it on 26 Oct), but it stays in git history; we did not rewrite history.

---

## Part 2: Likely questions and model answers

### A. Motivation and scope

**Q1. What problem does your project solve, in one minute?**

Datasets built with AI help usually keep only the final label, so nobody can say who labelled an item, under which
guideline, what the AI suggested or how a disagreement was settled. Errors in data carry downstream (Sambasivan et al.,
2021), and annotation quality is poorly reported even in published datasets (Klie et al., 2024). We extended the
client's platform so that every decision is recorded as it is made. A release is refused when that record is
incomplete, and the AI's influence on people can be measured.
- *Follow-up: who benefits?* Task owners, who can trust the numbers and defend a dataset item by item, and the client,
  for whom this is what separates a governed judgement platform from a labelling tool.

**Q2. Why "not faster labelling"? Isn't speed the point of AI assistance?**

That was the client's explicit framing. The brief lists faster labelling and model training as non-goals
(`mission.md`, Non-Goals). The literature also suggests speed is not the risk: Schroeder et al. (2025) found LLM
suggestions made annotators more confident but not faster, and shifted their labels towards the model's. Our value is
defensibility: we can show which version of a guideline governed an answer and whether the person followed the AI.
- *Follow-up: does all this governance slow people down?* Yes, it adds refusals and friction. We accept that as the
  price of a defensible record, and the report says so (A-draft, Introduction).

**Q3. What were your objectives and project questions?**

The deck uses the two questions from our proposal. Q1: how can a platform integrate human–AI annotation while keeping
decisions transparent and governed? Q2: how can automated validation and evaluation ensure quality, integrity and
reproducibility? The report refines them into five research questions: RQ1 traceability, RQ2 gated and checkable
release, RQ3 governed judgement, RQ4 measured AI assistance, and RQ5 proof rather than demonstration. Our answers: treat
the AI as one more author whose suggestion is recorded and reviewed, with every rule enforced on the server. Then gate
each release on the recorded history and re-test the whole workflow with a repeatable casebook.
- *Follow-up: why do the deck and the report differ?* The report's five RQs refine the proposal's two. RQ1–RQ2 map to
  Q2's integrity side, RQ3–RQ4 to Q1, and RQ5 to reproducibility. **[unverified: the proposal itself was not available
  to check the exact Q1/Q2 wording.]**

**Q4. What was in scope and what was out?**

In scope: the full workflow, governance, provenance, versioned guidelines and policies, gated releases with manifests,
and the evaluation harness with 40–60 cases. Out of scope: faster labelling, training or fine-tuning models, rebuilding
the annotation UI or integrating Label Studio, a generic workflow builder, legal compliance claims, and marketplace or
billing features. Provenance, releases and evaluation were added after Week 4, once the brief and the client's answers
showed they were required (Status Checking 2). JSONL intake came into scope at the client's request in Week 7 (R1-1).
- *Follow-up: what did you leave out that the client wanted?* Project-level access isolation (R1-6) and the workflow for
  annotators, reviewers or experts to request a reopen (R2-3, deferred with the client's agreement).

**Q5. Why only text?**

At Status Checking 1 (26 Aug) we agreed with the client that text is the committed demo path. It was the highest-value,
highest-confidence route through the workflow in roughly eight weeks of build time, and we chose depth over breadth.
The item and dataset schemas admit image, audio and video, and those must keep working, but they did not get the full
set of guarantees. We demonstrate on AG News and Civil Comments because they are the two most different text tasks:
topic classification and a toxicity judgement.
- *Follow-up: does anything break on other modalities?* They still work, but one gap is on record: a judgement image
  task asks the AI for bounding boxes while the work panel offers a person only a verdict (found in review on 24 Oct;
  Status Checking 3).

**Q6. Tell us about the dataset.**

The client supplied subsets of eleven public datasets in four modalities, prepared by another student group (Group A).
The four text subsets have 200 records each, as JSONL with a stable reference (such as `ag_news:train:0000`), the
text, and a gold label. On disk the package is about 0.7 GB, mostly video. We collected no new data. Record-based intake
(B7, ADR 005) makes one item per record. Before upload, the task owner chooses which fields annotators and the AI may
see, so the gold label never reaches them (client answer R1-1).
- *Follow-up: where are the gold labels used?* Only in the evaluation harness, outside the platform, to score the AI
  (ADR 019, decision 2).

### B. Related work

**Q7. What does the literature say, and what gap do you fill?**

Each problem is well studied on its own. Cheap labels work if quality is checked (Snow et al., 2008). Disagreement
carries information (Plank, 2022). Agreement should be chance-corrected (Artstein & Poesio, 2008). PROV-DM models
entities, activities and agents (Moreau & Missier, 2013), datasheets document datasets (Gebru et al., 2021), and RBAC
with separation of duty defines who may act (Sandhu et al., 1996). The gap is that documentation frameworks describe
*what* to record, but in the work we reviewed nothing **enforces** it inside the workflow, at the moment of decision.
Our contribution is one platform that enforces the workflow, records provenance as it happens, and refuses a release it
cannot trace.
- *Follow-up: isn't that just good engineering, not research?* The insight is to treat provenance as a precondition
  for release rather than an afterthought. RQ2's gate cannot be satisfied by anyone asserting that review happened.

**Q8. Why not use Label Studio, Prodigy or Argilla?**

The brief asked us to extend the client's own platform, and integrating Label Studio was an explicit non-goal. The
client also warned against recreating a general-purpose tool (R1-5). In the documentation we reviewed, those tools
optimise the labelling moment. Several merge human and machine contributions, for example by copying a pre-annotation
into the annotator's answer or consolidating several answers into one label. That is the opposite of what the brief
needs: the annotator's label, the reviewer's decision and the expert's resolution must stay distinct. We found no
release gate there that reads recorded decisions (A-draft §2.1.5).
- *Follow-up: are you sure they lack this?* We only claim it "in the documentation we reviewed" on 26 Oct. Label
  Studio's reviewer workflow is in its commercial edition.

**Q9. How did the literature change a design decision?** *(Pick one, show the chain.)*

Schroeder et al. (2025) and Parasuraman & Manzey (2010) show that seeing a suggestion first anchors people and inflates
the model's measured performance. That is why blind-then-reveal records the person's verdict *before* the suggestion
can be read anywhere. The suggestion sits in its own table, and there is deliberately no "use the AI's answer" button
(ADR 016). A second example: Artstein & Poesio's point that coefficients rest on different assumptions led us to Fleiss'
kappa for reviewers who change from pair to pair, and Krippendorff's alpha for annotators with uneven numbers of
answers (ADR 019).
- *Follow-up: PROV-DM?* Each provenance event has an entity (the record it concerns), an activity (the event kind) and
  an agent: a `user`, an `ai_model` or the `platform` (ADR 015).

### C. Architecture and technology choices

**Q10. Walk us through the architecture.**

The architecture has three layers: a Next.js 16 / React 19 web app, a FastAPI service with SQLAlchemy domain services,
and PostgreSQL 18. The web app holds no rules and only offers what the login's capability list allows (ADR 024). The
API enforces every governed action and the independence rules. An optional separate AI worker process runs batches
outside database transactions, so a slow model never holds a lock. Follow one click: a reviewer presses Accept, the API
checks they hold `REVIEW` and did not author the item, the review service records the decision, and a provenance event
is written in the same transaction.
- *Follow-up: is the worker always used?* No. The default `HEJ_AI_EXECUTION_MODE` is `inline`; `worker` mode is
  opt-in (`config.py`).

**Q11. Why both PostgreSQL and SQLite?** *(Hard.)*

PostgreSQL 18 is the default and production engine because concurrent annotators and a background AI worker need
concurrent writers. Parth migrated us in PR #24 (20 Sep). We kept SQLite because it needs no server, which makes local
runs and the test suite fast. Each test gets a fresh in-memory database, which is what lets 2,495 tests run in
parallel. The cost is two databases to test. CI runs SQLite and the web checks on every ready PR, and the PostgreSQL
suite runs on every merge to `main` and on manual runs, with sessions in the Australia/Sydney time zone to expose date
bugs (`backend-tests.yml`). The client endorsed the choice at Status Checking 2 and asked us to justify it in the
report, which we did (B-draft §4.4).
- *Follow-up: so a PostgreSQL-only bug can reach `main`?* Yes. It would be caught on the merge run, not before. We
  traded that for fast PR feedback. During the 16–20 Oct billing block, authors ran both suites locally and reported
  the results in the PR.
- *Follow-up: don't the two diverge?* One committed casebook baseline covers both, so a verdict that differs between
  them fails CI. PostgreSQL-only tests (for example the 42 concurrency cases in #93) are skipped on SQLite.

**Q12. How are permissions enforced?**

Roles grant capabilities, and routes check capabilities, never role names (`ROLE_CAPABILITIES` in `permissions.py`,
nine capabilities in five groups: govern, configure, oversee, release and judge). Reads are a separate tier:
`OVERSEE`, or reads named for the work, so a capability to manage something never grants a read (ADR 023, decision 4).
Ownership and independence are checked against the resource on top of the capability. For example, holding `REVIEW`
does not let you review your own answer (EV-021, EV-023). The web reads the actions the login lists (ADR 024), but the
API decides either way. A hidden button is not a permission.
- *Follow-up: "checks the capability on every request"?* Strictly, on every governed action. Reads go through read
  tiers and membership.

**Q13. Why can't an administrator review or adjudicate?**

At a client demo, the client said an administrator may not have the domain expertise to judge the work. We therefore
separated governance from judgement (ADR 023, PR #91, merged 23 Oct). Admin keeps organisation, project and task
management, oversight and release, but not annotate, review, dispute or adjudicate. EV-131 pins it: an admin sees every
answer and can release, but is refused when trying to judge. The cost is more roles to assign in each organisation.
- *Follow-up: can an admin give themselves the reviewer role?* An admin manages roles, so yes, they could hold both
  roles. The independence rules still apply whatever roles someone holds, so they still cannot review their own work.

**Q14. Why OpenAI-compatible providers, and why these six?**

One OpenAI-compatible client behind the `JsonCompletionClient` protocol means a task can switch model or provider
without touching the workflow. The client asked for replaceable, typed model access, with mock and live models
interchangeable. All six providers speak the same API shape, including local Ollama for work with no key. The analyzers
validate the model's output against the task's schema and record a failure if it does not fit.
- *Follow-up: why these particular six?* **[unverified: the sources record which providers exist, not why each was
  chosen.]** Safe answer: OpenAI-compatible APIs let one code path cover them all, and a local model removes cost and
  key dependence.

**Q15. How did you handle the inherited code without breaking it?**

We treated working features as stable by default. UI style, authentication and anything that already worked could
only change with a written justification agreed at review. Regenerating a subsystem because it was faster than reading
it was not allowed. Each defect fix came with a test that fails on the old code, checked by reverting the fix
(Feathers, 2004). Technical debt was repaid where it blocked value (Kruchten et al., 2012).
- *Follow-up: give an example.* Atomic draft submission (defect 11, PR #23) came with five tests that fail on the
  previous commit.

### D. Workflow and governance

**Q16. Why no item assignment, and how is independence guaranteed without it?** *(Hard.)*

The client decided on 17 Sep that task owners do not hand items to named people. Work is self-served from role-checked
queues, and the task's required-annotator count limits how many people may submit (R1-4). Without an assignee to encode
independence, independence has to live **in the queue query and in the decision path, using one shared rule**. The
review queue never offers an item to someone who annotated it, and never offers a second approval to the first
approver. The adjudication queue omits items the expert annotated, reviewed, routed or settled. The decision
endpoints re-check the same rule before any write and return 403 (ADR 007, ADR 011). EV-021, EV-022, EV-023, EV-063 and
EV-115 pin these rules.
- *Follow-up: what if someone calls the API directly and skips the queue?* The decision endpoint applies the same
  helper (`adjudication_conflict_item_ids`, the review independence checks), so the queue is a convenience, not the
  guard.
- *Follow-up: can annotators see each other's answers?* Not before submitting their own (EV-025). Reviewers in an open
  second review are blind to the first verdict (ADR 010, EV-026).

**Q17. What exactly happens when two reviewers disagree?**

Under Dual sign-off v2 and Standard's cross-review sample, the split is **held**. Two things can then happen, whichever
comes first. An independent reviewer can settle it (accept, return or reject, with a reason; ADR 022, EV-125, EV-129),
or a dispute participant can open it as a dispute for an expert. Under Arbitration-ready and the Expert Gate, settlement
is refused and an expert must decide (EV-127, EV-128). A reviewer's explicit Escalate always goes to an expert and is
never settled by a peer (EV-130). Nothing disappears: the disagreement row stays, and the settlement is its own
append-only record with a provenance event.
- *Follow-up: why allow settlement at all?* At first every split went to an expert, so Dual sign-off and
  Arbitration-ready behaved the same. That was our misreading of R2-8, and settlement is what makes the postures differ
  (ADR 022, context).

**Q18. What can the expert decide, and is it final?**

On a dispute the expert can **Accept** the disputed answer or the reviewer's current correction, **Return** it to the
open workflow (to the author, or to a new annotator with an optional cut-off on what context they see), or **Reject**
it. The ruling is final for that dispute, and only Return reopens the item (client R2-1). "Resolved" can mean genuinely
ambiguous: a Reject on a single answer leaves the item `unresolved`, and a release lists it as ambiguous with no value
(EV-012, ADR 021). When several accepted answers compete, reconciliation offers `choose_one`, `reject_all` or `return`.
- *Follow-up: who decides when two annotators disagree?* That is item-level reconciliation by an expert, separate from
  an annotation-level dispute (issue #40's two-level design, ADR 013, EV-019).

**Q19. Why is a reviewer's correction only a proposal?**

If an Accept with an edit made the reviewer's text the answer, nobody else would ever have looked at it, which is
self-approval (defect 7). If a correction counted as an answer, it would need a reviewer of its own, who could correct
it in turn, with no end. So a correction is stored whole as a reviewer-authored version beside the answer. It becomes
the answer only if the annotator adopts it in a resubmission, which is reviewed as usual, or an independent expert
accepts it in a dispute (ADR 012, EV-070, EV-073). This also fixed critical defect 5, where corrections were cut into a
500-character notes field and lost.
- *Follow-up: can a reviewer accept and correct at once?* No. That is refused with 422 (EV-072).

**Q20. How do the four postures differ in practice?**

They differ in **what authority an item needs before it can become canonical**, which is the client's own definition
(R2-8). Standard: one approval, with a 10% sample cross-reviewed. Dual sign-off: two independent approvals, where the
cross-review supplies the second approval rather than adding a third look. Arbitration-ready: two approvals, and any
dispute must reach an independent expert (`adjudication_mandatory_on_dispute`). Expert Gate: one approval, then an
expert confirms every item (ADR 017). The rules read the policy's stored values, not the posture's name, so a custom
policy with the same values behaves the same (ADR 022, decision 4).
- *Follow-up: what does sampling mean, a gate or an audit?* A gate. A sampled item does not become canonical until its
  cross-review completes (client R2-7, ADR 010).

**Q21. What happens if a policy or guideline changes mid-project?**

A change creates a new version. It never rewrites history (client R1-7, ADR 018). Every answer records the guideline,
policy and source version in force when it was given, and new work follows the new version. EV-014 shows a guideline
change applies from then on and does not rewrite finalised answers. At release, an answer made under a superseded
guideline only produces a **warning**, not a refusal (ADR 020, decision 2).
- *Follow-up: why not refuse it?* It is still the item's resolution. Refusing would block every task whose guideline
  changed after work began. The warning travels with the release response, and the manifest lists the versions used.

**Q22. Who can reopen a finalised item, and what happens to the old answer?**

The project owner, which is `MANAGE_TASK` (task owner or admin), may reopen directly (client R2-3, ADR 023, decision 3).
The item returns to the normal open workflow, the old answer stays as a superseded version, and the authoritative
marker is cleared until the new round ends (ADR 008, ADR 009). EV-042 and EV-044 pin this.
- *Follow-up: can annotators request a reopen?* Not built. The client allowed us to defer the request workflow.

### E. AI assistance and evaluation

**Q23. How does the AI fit into the workflow?**

There are two production modes: human-first (`human_first`) and AI-assisted (`ai_assisted`, the client's "AI-first").
On an AI-assisted task, activation runs the first pass. The AI's answer is an `ai_model`-authored version that goes to
review like anyone's. It contributes no approval, and it can never become canonical without a person (client R2-7). A
guard in `mark_authoritative`, the single write path that marks an answer authoritative, refuses (409) an AI answer
with no human approver (ADR 017, decision 6). A
reviewer's Return or Reject of an AI first pass sends the item to a human annotator, with no AI retry (E2, #69; team
design agreed in issue #38).
- *Follow-up: low-confidence AI answers?* They wait for review like any other (EV-081). Confidence never decides
  anything on its own.

**Q24. What happens when the model call fails?**

The inherited code fabricated plausible bounding boxes and saved them as a real draft (defect 20). We removed that. A
failure is now recorded as a failure, and the person's answer stays the item's only one (EV-002, EV-107). In worker
mode, transient errors are retried with jittered backoff and permanent ones are set aside in a dead-letter state. A
reply that is not valid JSON counts as an AI failure, which is why DeepSeek has 199 answers on Civil Comments. A missing
confidence is stored as null, never 0, because 0 would read as "0% sure" (ADR 019, decision 4; ADR 025).
- *Follow-up: can a person tell an AI answer from a human one?* Yes. Every version carries its author role and, for AI,
  the provider, model and served version (ADR 009).

**Q25. What is blind-then-reveal, and why is it an evaluation protocol rather than a production mode?** *(Hard.)*

The annotator commits a blind verdict first. Then they reveal the AI's suggestion and give a final answer, which goes
to review like any answer. The client defined it as an **evaluation protocol for measuring how AI changes human
judgement** (R1-2, 21 Sep; confirmed in issue #72, 14 Oct), not a third way of producing labels. Its purpose is to keep
the pre-reveal judgement, the suggestion and the post-reveal judgement as separate stages, so we can measure anchoring
and automation bias. So it is a separate task field, `evaluation_protocol`, set beside the production mode and only on
human-first judgement tasks. It is set through the API for evaluation tasks, never offered in the production task form
(ADR 016, decision 1). The suggestion lives in its own table that no other read touches, so it cannot leak through any
other route (EV-105, EV-108).
- *Follow-up: why not on AI-first tasks?* There the AI's answer *is* the submission, so there is nothing to keep blind.
- *Follow-up: what does it measure?* Accept, modify and override rates; anchoring; automation bias, where a right blind
  verdict is switched to a wrong AI answer; the reverse benefit; adoption of confidently wrong suggestions; and time and
  confidence shifts at the reveal. Only first rounds count, because a round after a reopen is no longer blind.

**Q26. What did you find about AI accuracy?**

From recorded runs over all 400 records (ADR 019): DeepSeek Flash scored 92.5% on AG News and llama3 84.5%. On Civil
Comments, DeepSeek scored 69.8% of the 199 it answered and llama3 65.5%. The important part is the toxic class: recall
was 47% for DeepSeek and 35% for llama3, yet stated confidence stayed high, giving an ECE of 0.22 and 0.27 on Civil
Comments. So on toxicity, the model's confidence is no reason to skip human review. That supports keeping a person in
the loop (cf. Felkner et al., 2024).
- *Follow-up: is DeepSeek better calibrated on AG News?* Its five-bin ECE is 0.040 against llama3's 0.008, but llama3
  states only 0.8, 0.9 or 1.0, so all its answers fall into one bin. By stated value, llama3 is 0.043, about the same as
  DeepSeek.

**Q27. Explain ECE and calibration.**

A model is calibrated when answers it gives at 80% confidence are right about 80% of the time. Expected calibration
error (Guo et al., 2017) bins the answers by stated confidence. For each bin it takes the gap between mean confidence
and accuracy, weights it by the bin's share of answers, and sums. Zero is perfect. We use five equal bins because 28 to
200 answers per task would leave ten bins mostly empty. We also report the Brier score, which needs no bins, and a
per-stated-value table when a model states 10 or fewer distinct values (ADR 019, decision 5).
- *Follow-up: what is the weakness?* Coarse confidences make the bins degenerate. That is the "coarse confidence
  flatters calibration" limitation on slide 16. Below 0.8 we cannot measure llama3's calibration at all.

**Q28. How do you handle a confidently wrong AI?** *(Hard.)*

Three things protect against it. First, a confident answer is never canonical without human review, under every
posture (R2-7). EV-010 has a reviewer reject a confidently wrong AI answer, and EV-011 makes a person's answer the
output instead. Second, under blind-then-reveal, EV-110 shows that a confidently wrong suggestion adopted over a correct
blind verdict is caught in ordinary review. Third, the measures count how often confidently wrong suggestions are
adopted or accepted. The residual risk, which is on record: nothing forces an *extra* review step on tasks where we know
the model is confidently wrong, so a rubber-stamped single review is still possible (`evaluation-findings.md` §6, item
5).
- *Follow-up: what would you add?* A policy rule that sends AI answers on a known-hard task to dual sign-off or the
  Expert Gate. Today a task owner can choose that posture by hand.

**Q29. Why record the model's replies once and replay them, instead of calling the model each run?**

Calling a live model every run is slow, not repeatable, depends on the model being up, and would need a key or a GPU in
CI. So `evaluation record` calls the platform's own pre-annotator once and keeps every reply. `evaluation quality`
replays the recording through the platform as an AI-first task: a reviewer accepts every answer through the API, the
metrics are read, and the result is joined with gold outside the platform. The figures are about a real model and
repeat exactly, and the scoring still goes through the real pipeline (ADR 019, decision 3).
- *Follow-up: can I reproduce your headline figures?* The full 400-record figures need the client's package, which we
  never commit. A committed 56-record gold subset replays the whole pipeline from a fresh clone, with different figures
  by design (`evaluation-findings.md` §11).

**Q30. Explain chance-corrected agreement. What do your I3 figures show?** *(Hard.)*

Raw agreement is inflated by chance, especially when one category dominates, so we report a coefficient **beside** the
raw rate, never instead of it. For reviewers we use **Fleiss' kappa** over the two independent reviews of each sampled
submission, on accept versus redo. With two ratings per item it equals Scott's pi, which suits reviewers who change from
pair to pair. We first used Cohen's kappa but dropped it: it treats first and second reviewer as fixed raters, so
reordering the same verdicts changed the result (ADR 019, alternatives). For annotators we use nominal **Krippendorff's
alpha**, which handles items with different numbers of answers. It counts only each annotator's first independent
answer: reworks, AI-derived answers and answers given after seeing a colleague's would inflate agreement for the wrong
reasons. An undefined coefficient is reported as null with a reason, never as 0 or 1.
- *Follow-up: what values did you get?* Honestly, **no agreement figure about real people exists**, because every
  annotator and reviewer in the casebook is scripted, so I3's agreement numbers prove the arithmetic, not anything about
  annotators (ADR 019, consequences). ADR 019 gives one illustration from the seeded sampled-review project: a 50% raw
  rate gave kappa −0.33 over just 2 pairs, which is below chance, because 3 of the 4 verdicts were accepts. That is why
  raw agreement alone misleads. The real-actor findings are the model accuracy and calibration figures.

**Q31. Why scripted participants rather than a user study?** *(Hard.)*

A user study needs real annotators, ethics consent and time, and our brief's evaluation deliverable was a repeatable
harness and casebook. A repeatable baseline cannot depend on people behaving the same way twice. Scripted people give
deterministic runs that are compared exactly with a committed baseline on every change. So our human figures are
pipeline demonstrations, and we say so in ADR 019, the findings record (§9), the UI's Quality section and slide 16. The
repository holds no evidence of a human-participant study, and any claim about real annotators would need one. That is
our first next step on slide 18.
- *Follow-up: then what does the harness prove?* That the platform behaves correctly under adversarial conditions
  through its real API, and that the measures are computed correctly. It does not show how people respond to AI.

### F. Provenance and release

**Q32. What does provenance store, concretely?** *(Hard.)*

`provenance_events` is an append-only table, separate from the audit log (ADR 015). Each row has the task and item, an
event kind, the time, the actor's kind (`user`, `ai_model` or `platform`), the person's id (only for users; we never
invent an account for a model), snapshots of the actor's name and the model's provider, name and version, and the
record the decision produced. Event kinds include `source_registered`, `item_taken`, `ai_suggested`, `human_responded`,
`reviewed`, `correction_proposed`, `disagreement_held`, `disputed`, `adjudicated`, `item_reopened`, `released`, the
settlement event, and the blind-then-reveal stages. Each answer separately records its guideline, policy and source
version (ADR 018). Events are written by the decision path, in the same transaction, and roll back with it.
- *Follow-up: what does an event say about the content?* For the protocol stages, it says who and when, never what was
  answered. The content stays in its own record, under that record's visibility rules (ADR 016).

**Q33. How is immutability enforced?** *(Hard.)*

It is enforced in the database, not only in the code. On SQLite, triggers reject UPDATE, DELETE and a replacing INSERT
on `provenance_events`. On PostgreSQL, a `BEFORE UPDATE OR DELETE` trigger and a `BEFORE TRUNCATE` trigger call
`refuse_provenance_mutation()` (`db_models.py`). This holds even for raw SQL and bulk statements. Foreign keys have no
cascade deletes, and answers are versions that are never rewritten (ADR 009). EV-118 shows that an ordinary attempt to
delete an event is refused.
- *Follow-up: can the database owner bypass it?* Yes, an owner can drop a trigger. That is why `evaluation verify`
  exists: EV-117 and EV-123 delete events with owner rights, and the verifier finds the gap. It cannot detect a whole
  fabricated database. It answers "is this record lawful and complete?", not "did this really happen?"
  (`evaluation-findings.md` §3.4).

**Q34. How is a release refused, and why can't someone just assert that review happened?** *(Hard.)*

The gate runs first in `create_release`, inside one transaction, before any artefact exists. It reads recorded facts
and gives five refusal reasons. **Unreviewed:** the item is not export-eligible. **Disputed:** an open dispute or
reconciliation, or an unsettled held split. **Superseded:** the release would carry an answer that is not the
authoritative one. **No authoritative answer:** a finalised item has no marked answer. **Incomplete provenance:** a
workflow step has no event. A refusal is a 409 that creates nothing and lists each failing item with every reason (ADR
020, EV-015, EV-016). There is no "mark as reviewed" switch to flip: eligibility comes from review rows, authoritative
markers (protected by a unique index) and immutable events, all written by the decision paths themselves.
- *Follow-up: could someone reopen an item while the gate runs?* No. The task's items are locked from the gate to the
  commit (ADR 020, consequences).
- *Follow-up: so an answer under an old guideline is refused?* No. That only warns. "Superseded" in the refusal list
  means a superseded *answer* (ADR 020, decision 2).

**Q35. Why is work from before 16 October exempt from the release check?** *(Hard.)*

Provenance events only exist since F1 (#70) merged on 16 Oct. A literal "every step must have an event" rule would make
every older task unreleasable for a reason nobody can fix, and back-filling events would mean fabricating them. So the
team decided on 18 Oct (ADR 020, decision 3) that work is exempt when it is older than the **item's own first event**,
not older than a fixed date. Every item registered since F1 gets its registration event in the same transaction, so an
item with no event at all is wholly pre-F1. A fixed cut-over date was rejected because development databases are reset
often and a date in code would be wrong in each of them.
- *Follow-up: isn't that a hole?* It is a deliberate, documented limit. Old work is verified on weaker evidence (ADR
  020, consequences; findings §4, item 7). Every record written after an item's first event is checked.

**Q36. What is in the manifest, and how would an outsider check a release?**

The manifest is canonical JSON written once with the release, in the same transaction after the gate passes, and never
changed. It lists every item of the task as `authoritative`, with one answer and one artefact line, or as `ambiguous`,
with no value. It records the guideline and policy versions, each item's provenance event chain by id, and SHA-256
hashes of the artefact and of every line (ADR 021). Anyone holding the two files can check them with standard tools,
without the platform. EV-122 rebuilds a release from its manifest byte for byte, and `evaluation verify` re-checks
every release.
- *Follow-up: why hashes, not signatures?* No key management exists, and the requirement was an independent check of
  contents. A signature can be added over `manifest_sha256` later without changing the format.

**Q37. What does "one authoritative answer per item" mean, and why was it critical?**

Inherited defect 4: the export kept one slot per *creator*, so an item with two annotators could export two conflicting
"final" answers. Now at most one version per item is marked authoritative, enforced by a partial unique index in the
database. It is marked only through `mark_authoritative`, which records who, when and why (H4, #66, 16 Oct; ADR 009).
Every other version stays as history in the release's provenance, matching the client's rule: "release output =
authoritative resolution, release provenance = complete judgement history" (R2-2). EV-068 and EV-069 pin it.
- *Follow-up: and an ambiguous item?* It has no marker. The manifest lists it as ambiguous with no value, and the
  customer decides what to do with it.

### G. Testing and quality

**Q38. How did you test, and why should we trust it?**

We used four layers. First, pytest: 2,495 backend tests on SQLite, with permission and ownership suites that use real
users and roles in a real database rather than mocks. Second, the casebook: 88 end-to-end cases through the real API.
Third, 1,050 Vitest component tests with type checking and lint. Fourth, CI on every ready PR, plus PostgreSQL on every
merge to `main`. For defects, a test that fails on the old code was part of the Definition of Done, checked by
reverting the fix. Our evidence is committed and re-runnable: the figures in the deck were re-run on 26 Oct from a
clean copy of `6951781`.
- *Follow-up: what is not tested?* Browser-level end-to-end behaviour (multi-user flows were checked by scripted manual
  walkthroughs in two browsers), performance and load, the live provider path in CI, and real users.

**Q39. Why does the harness drive the real API instead of unit-testing services?**

A passing case should prove what a user can actually do. Each step is an HTTP request made with the acting user's own
token from a real login, so routing, authentication, role checks and independence rules all run as they do for the web
app (ADR 006). Each case gets a fresh database, the actors hold exactly their declared roles, and the AI is scripted at
the model interface, so a "confidently wrong AI" is wrong the same way every time and no case can reach a real
provider. A refusal is something a case can require: for example, EV-021 expects 403 when someone who annotated an
item tries to review it, then has another reviewer decide.
- *Follow-up: limits?* It runs in process, so it cannot drive a deployed server. Cases run one at a time, and one
  baseline covers both databases.

**Q40. How do you know the casebook cases themselves are right?**

Cases name what they protect, a defect number or a story criterion, and `evaluation list --coverage` fails CI if an
adversarial category has no case or an owed protection has no running case. Every run is compared exactly with the
committed baseline. A new failure, a pass turning into a skip, or a missing case all count as regressions, and a
deliberate change must regenerate the baseline so it shows in the PR diff. A case written before its feature exists
states the outcome we owe and is skipped. **We never write a case to match today's wrong behaviour** (ADR 006
amendment). Skips get retired: EV-014 and EV-069 were un-skipped when their features landed.
- *Follow-up: what is EV-018?* "A new source version does not rewrite or reopen a finalised answer." Answers record
  their source version, but nothing can register a new version yet, so the case waits for source versioning. It is
  skipped, not failing.

**Q41. What did the evaluation itself find wrong in your code?**

Plenty, and we recorded it (`evaluation-findings.md` §3). A label correction rewrote a neighbouring field. The replay
joined replies by text, so duplicate Civil Comments texts crossed records. Annotator alpha counted non-independent
answers. A missing confidence was stored as 0.0. The DeepSeek configuration named a retired model. A first reveal made
no fresh checks and could leak a suggestion. Civil Comments scoring counted `non_toxic` as harm. All of these were
fixed before merge, each with its commit, and the record keeps negative results beside positive ones.
- *Follow-up: why record failures?* It is part of the brief, and K3 asks that "what didn't work is recorded as carefully
  as what did".

**Q42. Tell us about the 30 inherited defects and the client's no-clean-up-sprint direction.** *(Hard.)*

Our audit catalogued 30 defects: 6 critical, 15 high, 6 medium and 3 low. Examples: a finalised answer could be
silently overwritten, annotators could approve their own work, corrections were lost, and failed AI calls were saved as
fake annotations. At Status Checking 1 the client told us not to spend one to two weeks clearing them first. Instead we
were to build features and fix a defect when the feature under construction depended on it. We made that traceable:
each defect was linked to its story, closed by that story's work with a test that fails on the old code, and a defect
left open needed an argued decision. Feature work started earlier as a result. The last critical defect (4) closed on
16 Oct with H4. **All six critical defects are fixed and pinned** (slide 22: EV-041, EV-068/069, EV-070, EV-027,
EV-001/021–023/063/115/124, and unit tests for defect 8).
- *Follow-up: are all 30 closed?* Yes. Defect 30 is closed by a deliberate 409 policy (archive instead of delete).
  Defect 1, the committed Gemini key, was removed from the code in September, and on 26 Oct we tested it against the
  Gemini API: it was refused with HTTP 401, so it no longer grants access. It remains in git history, which we did not
  rewrite. Defects 25 and 26, two weak tests, were fixed on 3 Sep in A2 (`e0e642ac`, PR #2); we re-ran both tests on
  26 Oct and they pass. Our findings record had listed them as unverified, and we corrected it.

**Q43. Did CI ever fail you?**

GitHub Actions was blocked by account billing from 16 to 20 Oct, which was our heaviest merge week (W10). Every author
merged `main` into their branch and ran the backend suite and casebook locally on both databases before review, and
reported the results in the PR. Reviewers ran PostgreSQL through the Compose backend container. CI ran again from 20 Oct,
and `main` has been green since.
- *Follow-up: lesson?* Treat CI as infrastructure with an owner, and keep the local route documented. We had both.

### H. Process, teamwork and client management

**Q44. How did you organise eight people?**

We ran weekly Scrum sprints closing after the Wednesday client meeting, so feedback shaped the next plan. Requirements
were user stories with numbered acceptance criteria (Cohn, 2004), on a Jira board and a contribution tracker with one
row per PR. Load was measured in *units*, where one unit is two to three subtasks, at 1.5–3.5 units per person per week,
so members with different timetables shared one scale. We had a five-point Definition of Done and 25 ADRs for design
decisions. The project manager reconciled the board, the tracker and `main` weekly, with the code deciding where they
disagreed.
- *Follow-up: "one spec per story"?* No. Stories carry acceptance criteria. Three standing specifications (mission, tech
  stack, roadmap) plus per-ticket plans and ADRs did the design work. Only one formal feature spec was written.

**Q45. Twelve PRs have no GitHub review and `main` is unprotected. How can you claim independent review?** *(Hard.)*

We do not claim it for every PR on GitHub. 83 of 95 merged PRs have a formal GitHub review by someone other than the
author, and every PR after 10 Oct does. Of the 12 without one, 10 have a non-author reviewer of record in our
contribution tracker, and 2 (#3, #15) only merged `main` into a personal branch. Nine of the 12 went into `main`, all in
the first five weeks while the review workflow was settling. Branch protection is not available on the repository's
GitHub plan, so review was enforced by team rule, and `main` also took at least one direct commit (`d4d809c`, 13 Sep).
We list this as a weakness in `mission.md` Risks, in Status Checking 3 and in the report.
- *Follow-up: what would you do differently?* Turn on protection or a required-review check from day one where the plan
  allows it, or else add a CI check that fails a merge without an approving review.
- *Follow-up: were those 10 reviewed in person?* GitHub records no review. **[unverified: whether review happened in
  chat or in person.]**

**Q46. How did you manage the client and unclear requirements?**

We put questions in writing: two rounds in a shared document (answered 21 and 24 Sep), then GitHub issues labelled QA
from 3 Oct, where the thread is the record. Answers went into the affected stories, tickets and ADRs the same day. Some
answers changed scope mid-build, such as no assignment (17 Sep), and one corrected the client's own earlier answer on
adjudication (R2-1). From 7 Oct the client asked us to settle remaining questions as our own design and send them for
review. For example, our two-level dispute design (#40) and human rework after an AI rejection (#38) were both accepted
("I agree with the current design").
- *Follow-up: did waiting cost you?* The dispute work paused about a week (3–9 Oct) on issue #40. Every blocked group
  in the roadmap had a fallback to pull forward.

**Q47. How did the plan change over the semester?**

The Week-4 plan was indicative. Core governance work started in W6, earlier than planned, because the defect policy put
governance faults on the critical path. Provenance, gated release and evaluation were added after Status Checking 2.
Evaluation was "at zero" then, so the mid-semester break became a week clear of feature work to build the harness. On 1
Oct we re-planned: W11 became the last build sprint, and provenance (F1) moved from W11 to W9, because the W10 release
gate reads it. The chain from provenance through the gate, manifest and release screens to the integrity checks had no
slack, so we managed it as a critical path. The last PR merged on 26 Oct, two days before build work ended.
- *Follow-up: what slipped?* The provenance record merged on 16 Oct, later than its planned W9 sprint, and W8 merged
  only 7 PRs while large reviews were open.

**Q48. How was work divided, and was it even?**

Every member was a developer who built full stories, front end and back end. Areas were owned roughly as follows:
governance, review policy and evaluation (Jingwei); AI integration, disputes, Expert Gate and the permission model (Yi);
AI batch worker, versioned guidelines, release gate and manifest (Michael); PostgreSQL, CI, blind second review and
provenance (Parth); task lifecycle and the authoritative answer (Dishank); work queues and the release artefact
(Kanishka); invitations, members and the project overview (Tim); drafts, answer versions, casebook structure,
performance and project management (Hanchen). Authored PRs ranged from 29 to 5, and three members did most of the
reviewing. We present this honestly: the contribution statement lists each member's stories and counts.
- *Follow-up: how did parallel work avoid collisions?* Not always well. Three tickets added refusals to
  `submit_draft`, and their order decided which message a user saw. We agreed one order in PR #35 and recorded it in
  `api_surfaces.md`.

### I. Results, limitations and future work

**Q49. Did you meet the brief? Be honest.**

All four Week-4 outcomes and the three added after Week 4 are met. The full journey runs on real AG News records:
EV-101 takes a real record from intake to a release whose provenance reads back every stage, and the seeded governance
projects run on real AG News and Civil Comments records. Releases are gated and immutable with manifests, the AI sits
behind one typed interface that never disguises a failure, and the casebook has 88 cases against the 40–60 asked for.
The honest qualifications: EV-100 and EV-101 use a human-first task, so the AI first pass and a release are shown in
different cases and in the demo rather than in one casebook case. Source versioning is not built. Our human figures are
scripted.
- *Follow-up: is "full journey on realistic data" really met?* On 22 Oct `mission.md` left it unchecked for exactly that
  reason. Status Checking 3 names the journey on the seeded governance projects as the demo, so name the demo when you
  claim it.

**Q50. What are the main limitations?**

Ten, from the findings record and slide 16. All people in the evaluation are scripted, and there is no user study. Each
model run is one sample. Coarse confidences flatter calibration. Source versioning is not built (EV-018). There are no
browser or load tests. Roles are organisation-wide only, though the client asked for project-level isolation (R1-6).
There is no migration tool, so databases are reset after a schema change. Pre-F1 work and pre-manifest releases are
verified on weaker evidence. Non-text modalities are only kept working. `main` is unprotected. And the guarantees cover
what is recorded, not whether a recorded judgement is correct: a wrong label reached by a properly recorded route is
still wrong, only easier to find.
- *Follow-up: which one worries you most?* Project-level isolation, for a real multi-team pilot. The permission check
  already takes the resource, so project-scoped assignments can be added without changing the rules (ADR 023,
  consequences).

**Q51. The client said project-level access isolation is required. Why didn't you build it?**

In Round 1 (R1-6) the client said a user with access to one project must not read or modify another project unless an
organisation-level capability permits it. Our project manager replied that, with the roadmap full, we would prioritise
the end-to-end workflow and add isolation if time allowed. It was not reached. What we did fix: the cross-project
*write* bypass (defect 9, #14). Roles honour organisation scope only (`tech-stack.md`). ADR 023 kept the check
resource-aware so a future story can add project-scoped roles.
- *Follow-up: did the client agree?* The client did not object in the record. The reply is in `client-qa.md`, Round 1
  Q6. **[unverified: an explicit client acceptance of the deferral.]**

**Q52. What are the next steps you'd hand to the client?**

Three come straight from our limitations (slide 18). First, extend the full guarantees to image, audio and video,
starting with the judgement-image gap. Second, build source versioning, which un-skips EV-018; the case already records
the decision it assumes, that the owner decides whether an item is answered again. Third, run a study with real
annotators of how AI suggestions sway them, using the blind-then-reveal protocol and measures we built. Behind those:
project-level roles, a migration tool before production, browser end-to-end tests, signing manifests, and a secret
scan in CI so a credential like defect 1's cannot be committed again.
- *Follow-up: is it deployable?* It is handed over as `main` of the private repository by 1 Nov. It runs natively or
  with Docker Compose. It was not deployed to a public host, because the client has not chosen one.

**Q53. Performance: anything measured?**

Yes, one thing. Profiling a 200-item task found the Annotate page sent 404 requests and ran 6,882 SQL statements,
taking 2,969 ms, with no single statement slow. That created story A6. The page load fell to about 560 ms (break
sprint, extended in W11 by #98). There is no load or concurrency benchmark on record beyond the PostgreSQL concurrency
regression tests in #93.
- *Follow-up: what was the cause?* Many small reads per item rather than one slow query, so the fix was batching reads.
  **[unverified: the detailed fix; only the before and after figures are in the specs.]**

### J. Reflection and AI use

**Q54. What would you do differently?** *(Hard.)*

Four things, each with a cause:
1. **Start evaluation earlier.** Status Checking 2 found it at zero, and the break had to recover it. Writing cases with
   each story from W6 would have spread the load.
2. **Protect `main` and make review a gate.** Twelve early PRs have no GitHub review, and three members carried most
   reviews. A required check and a review rota would fix both.
3. **Keep one source of truth for status.** Our records sometimes marked a story complete ahead of its code, and our
   own two defect records disagreed on defects 1, 25 and 26 until we re-checked them against the code on 26 Oct.
   Reconciling against `main` weekly helped, but late.
4. **Agree merge order when parallel branches touch the same files.** Several branches changed the same files, as in
   `submit_draft`'s refusals.
- *Follow-up: what worked?* Weekly sprints closing on client feedback, ADRs written in the PR that implements them, the
  casebook as a regression net, and written client questions.

**Q55. How did you use AI tools?** *(Hard; answer plainly.)*

We used Claude (including the Claude Code coding assistant) and ChatGPT, as the brief and University policy permit,
under one rule: the member who submits AI-assisted work must be able to explain and defend every line of it without the
tool. Members used them to understand unfamiliar inherited code and concepts, to suggest and check implementations and
tests, and to improve wording. The project manager also used Claude Code to draft and maintain the specifications and
weekly plans, sync the board and tracker, support code reviews by reading diffs and reproducing faults, and draft
reports. AI-assisted code went through the same non-author review, test suites and casebook as hand-written code. Our
specifications briefed the tools, so generated work started from the agreed design. The report was drafted with AI
assistance from our own records and checked against `main`. The AI statement form is submitted with the slides.
- *Follow-up: give a case where AI got it wrong.* Answer from your own experience. A shared example from the records:
  every figure the tools drafted was re-checked against `main`, and our fact-check of the deck found stale casebook
  counts and an overstated review claim, which we corrected. **[unverified: each member's individual tools; the
  report's open question 6 asks members to confirm.]**

**Q56. What did you personally learn?** *(Each member prepares one sentence of their own.)*

Use one concrete lesson tied to your stories, with a cause and a fix. Examples of the form: "a hidden button is not a
permission, so every rule must be on the server", "a skip is honest and a passing case written to match a bug is not",
"a refusal must name its reason", "independence has to live in the query when nobody is assigned".
- *Follow-up: what decision of yours would you defend?* Name your ADR or PR and its rejected alternative.

**Q57. What is your single most important insight from this project?**

Provenance has to be enforced at the moment of decision, not documented afterwards. If the platform does not write the
record when the reviewer clicks, no datasheet written later can recover it. Once the record exists, release becomes a
check rather than a promise: the gate reads recorded facts and refuses before anything is created. And disagreement is
data, not noise to remove: we keep who disagreed, why, and how it was settled (client, Round 2 preamble; Plank, 2022).
- *Follow-up: the limit of that insight?* A perfect record proves how a label was produced, not that it is right
  (Northcutt et al., 2021).

---

## Part 3: Answers to avoid

These claims are wrong or overstated. Some phrasings still appear in `CS57_Group_Slides_v2.pptx` as read on 26 Oct at
15:56. If a marker quotes one, give the accurate version and do not defend the slide wording.

| Do not say | Say instead | Why |
| --- | --- | --- |
| "Every PR was independently reviewed" / "Independent review on every pull request" | "83 of 95 PRs have a GitHub review by a non-author, every PR after 10 Oct; review was a team rule because `main` is unprotected" | 12 PRs have no non-author GitHub review (#2, 3, 4, 6, 7, 9, 15, 20, 21, 23, 26, 59) |
| "Defect 1 was rotated by us" / "the key was purged" | "The key no longer works: the Gemini API refused it on 26 Oct; it stays in git history" | We tested that it is refused; we have no record of who revoked it or when, and history was not rewritten |
| "Each defect is proven by a test that fails on the old code" (slide 4) | "Each fix is pinned by a test or a casebook case" | Defect 1 is closed by a provider check, not a test; defect 30 by a 409 policy |
| "Client dataset files are never copied in" / "referenced by pointer only" (slides 6, 8) | "Uploaded once to private file storage; items keep the source's and input's SHA-256" | Intake stores the file in `uploads/private_sources/` and projected inputs in `uploads/texts/` (ADR 005) |
| "About 4 GB" / "~200 items each" (slide 6) | "About 0.7 GB; 200 records per text subset; UOT32 has 32 sequences" | `du` of the package: 724 MB |
| "One spec per story" (slide 18) | "63 user stories with acceptance criteria, three standing specs, 25 ADRs" | Only one feature spec was ever written |
| "An answer under an old guideline is refused at release" | "A superseded guideline or policy only warns; a superseded *answer* is refused" | ADR 020, decision 2 |
| "The admin can review" / "Alice (admin) accepted it" (slide 13) | "Since #91 an admin oversees and releases but cannot judge" | ADR 023, EV-131. Slide 13 now shows a re-run of 26 Oct in which Bob (reviewer) accepts; the earlier 22 Oct export, made before #91, showed Alice, the seeded admin |
| "Seven roles" (slide 4) | "Six platform roles; the quality lead is a user type who reads results" | `ROLE_CAPABILITIES` has six roles |
| "CI tests both databases on every PR" (slide 8) | "Every ready PR runs SQLite plus the web checks; PostgreSQL runs on every merge to `main` and on demand" | `backend-tests.yml`, `if: github.event_name != 'pull_request'` |
| "The web tests aren't in CI" | "A web job (tests, typecheck, lint) runs on every ready PR since #93, 23 Oct" | `mission.md` is stale on this |
| "The API checks the capability on every request" | "On every governed action; reads go through read tiers and membership" | ADR 023, decision 4 |
| "The AI always runs in a separate worker" | "Inline by default; worker mode is opt-in for batches" | `ai_execution_mode = "inline"` |
| "Blind-then-reveal is a third annotation mode" / "a production setting" | "An evaluation protocol on human-first judgement tasks, set through the API" | Client R1-2 and #72; ADR 016 |
| "Provenance can never be altered by anyone" | "Triggers refuse updates and deletes on both databases; a database owner could drop a trigger, and `evaluation verify` finds the resulting gap (EV-117, EV-123)" | It cannot detect wholesale fabrication |
| "Our agreement figures show annotators agree well" / any claim about human behaviour | "Figures about people come from scripted participants; they prove the pipeline, not behaviour" | ADR 019; findings §9 |
| "DeepSeek is better calibrated than llama3" (in general) | "On AG News they are alike by stated value (0.040 vs 0.043); both are overconfident on Civil Comments (0.22 vs 0.27)" | llama3's five-bin 0.008 is an artefact of coarse confidence |
| "Toxic recall 47% and 35%" without the model names | "DeepSeek Flash 47%, llama3 35%" | The slide's chart legend lists llama3 first |
| "Every item's full history is checked at release" (without qualification) | "Everything since the item's first event; pre-F1 work is exempt by ADR 020" | ADR 020, decision 3 |
| "The full journey runs in one casebook case, AI included" | "EV-101 is intake to verified release on a human-first task; the AI path is covered by EV-002/010/011/081/103/104/111 and the 400-record replay; the demo joins them" | `mission.md`, 22 Oct |
| "Every story had a test written first" / "TDD throughout" | "Defect fixes were test-first; new workflow logic shipped with its tests in the same change" | Definition of Done wording |
| "Project-level access isolation is enforced" | "Roles are organisation-wide; cross-project writes are blocked (defect 9); per-project isolation was deferred" | R1-6; `tech-stack.md` |
| "The inherited code had no code review at all" (slide 4) | "It had no consistent review process, and uncoordinated changes overwrote each other" | Comes from story A1's wording and Status Checking 1, not from git evidence |
| "The system is deployed" | "Handed over as `main` with Compose and runbooks; not hosted publicly, since the client has not chosen a host" | B-draft §4.4 |
| Exact UniKeys, "team lead" titles or role titles as if officially assigned | Use the slide 2 role lines | Role titles are summaries of the work, not appointed titles |

---

## Could not verify

- **Project questions Q1 and Q2:** the proposal was not available, and the report uses RQ1–RQ5.
- **The source of "about 4 GB":** it comes from progress report §1.7. The only local package measures 0.7 GB.
- **Defects 25 and 26:** resolved on 26 Oct: both fixed by `e0e642ac` (A2, PR #2), tests re-run and passing. *(Earlier note, superseded:)* `mission.md` marks them closed under A2. The findings record found no fix, and I found none in
  the git log.
- **The 10 PRs reviewed only in the tracker:** whether review discussion took place outside GitHub.
- **When the client said an admin should not judge:** ADR 023 (dated 20 Oct) cites "the demo", but B-draft dates the
  client demo 21 Oct.
- **Why these six AI providers were chosen.**
- **Client acceptance of deferring project-level isolation (R1-6):** only the team's reply is on record.
- **Each member's AI tools:** B-draft's open question 6 asks members to confirm them.
- **Slide 13's export:** resolved. Slide 13 was re-run on 26 Oct on `main` `6951781` (local SQLite, seeded "Test: Standard review" project): AG News record 1 from the client's file, an AI-assisted task replaying DeepSeek Flash's recorded reply (Business, 0.99), accepted by Bob, finalised, exported and released (`rel_04cccad3788a`, manifest `84b808d5…`). The reply is replayed, not a live call; this run is a local artefact, not a committed casebook case.
- **The A6 fix details:** only the before and after timings are in the specs.
- **The ADR 019 kappa example** (−0.33 over 2 pairs): taken from the ADR text, not re-run on the current seed.
