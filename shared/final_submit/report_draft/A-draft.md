# Abstract

Supervised machine learning is only as trustworthy as the labels it learns from, yet most annotation tools record little more than the final label. When a dataset cannot show where an item came from, which guideline was in force, what an AI model suggested, how a person responded, and how disagreement was settled, its quality cannot be checked and its errors cannot be traced. This project, carried out by team CS-57 for Arc Intelligence, extended Hej (Human Evaluation and Judgement), the client's platform for producing labelled data, into a governed, provenance-aware human–AI annotation system. The client's goal was not faster labelling but a dataset that can answer, for every item, how its label got there, and a platform that refuses to release data when it cannot.

The team inherited a working but immature codebase whose audit found 30 defects, six of them critical, including finalised answers being overwritten and annotators approving their own work. Working in weekly Scrum sprints over one semester, the eight members organised the work around the six pillars of the client's brief: Govern, Assist, Record, Adjudicate, Release and Evaluate. Text annotation was the committed demonstration path. The resulting platform keeps each person's and each model's answer as its own version, records an unchangeable event at every decision with its actor and time, keeps a reviewer's correction as a proposal rather than an answer, and requires a formal dispute to be decided by an expert who took no part in the item. Releases are frozen and come with a manifest that anyone can check without the platform. A release gate refuses, before anything is created, any release containing unreviewed, disputed or untraceable items. AI suggestions arrive through a replaceable model interface, and a blind-then-reveal protocol measures how they change human judgement.

Evaluation was a deliverable in its own right. A casebook of 88 end-to-end cases, adversarial ones included, drives the real application programming interface (API) and is compared with a committed baseline on every change; 87 cases pass and one is deliberately skipped. Two language models, replayed from recorded runs over 400 records of the client's data, were measured for accuracy and calibration: both were fairly accurate at classifying news topics (85% and 93%) but confidently wrong on many toxic comments, which argues for keeping a person in the review loop. All 63 user stories and all 30 inherited defects were closed through 95 reviewed pull requests.

The work shows that label provenance can be enforced by a platform at the moment decisions are made, instead of documented afterwards, and that a release can be made conditional on that record. Its limits are equally clear: the people in the evaluation were scripted, so effects on real annotators remain to be studied, and the guarantees cover what is recorded, not whether a recorded judgement is correct.

# 1 Introduction

Most machine-learning systems in use today are trained and tested on data that people have labelled: a news article sorted by topic, a comment marked as abusive or not, a region of an image outlined as a vehicle. The labels are treated as the truth the model must reproduce, so their quality sets a ceiling on everything built from them. Errors in widely used benchmark test sets have been shown to be common enough to change which model appears best (Northcutt et al., 2021), and practitioners report that problems in data compound silently through later stages of a project (Sambasivan et al., 2021). Labelling is increasingly shared between people and AI models. A model proposes a label and a person accepts, edits or overrides it, which lowers cost but raises a new question: whose judgement does the final label represent?

These pressures have made the *history* of a label as important as the label itself. Researchers have proposed that every dataset be documented with how it was collected and labelled (Gebru et al., 2021), and that dataset development be held to the same accountability as software (Hutchinson et al., 2021). Regulators are moving the same way: the European Union's Artificial Intelligence Act requires providers of high-risk systems to apply data governance covering the origin of data and preparation steps such as annotation and labelling (Regulation (EU) 2024/1689, 2024, art. 10). Documentation written after the fact, however, can only be as reliable as the records it is written from. If the annotation platform never recorded who reviewed an item, or what the AI suggested before the human answered, no later report can recover it.

The client, Arc Intelligence, operates Hej (Human Evaluation and Judgement), a platform for producing labelled datasets through annotation, review and expert adjudication. Its brief describes the problem plainly: annotation tools concentrate on the act of labelling, while most of what makes a dataset defensible happens around that act, in sources, guideline versions, reviews, AI suggestions, disputes and releases. The brief set the goal not as faster annotation but as a platform where a released dataset can answer, for any item, "how did this label get here", and which refuses to release when it cannot. The team inherited a working but immature codebase: a web application and an API service with a relational database, developed by earlier teams without a consistent review process. An audit at the start of the semester catalogued 30 defects. Six were critical, and they went to the heart of trust in the data. A finalised answer could be silently overwritten, an annotator could approve their own work, a finished item could be exported with two conflicting answers, and a reviewer's correction was cut into a notes field and lost.

The problem, then, was not a missing feature but a missing guarantee. The platform could produce labels, but it could not defend them: nothing tied an exported label to the decisions behind it, and nothing stopped an indefensible export. The proposed solution was to build a governed, provenance-aware layer over the existing workflow, organised around the six pillars named in the client's brief. **Govern** sets who may do what, through roles, capabilities and versioned guidelines and policies. **Assist** delivers AI suggestions through a replaceable model interface. **Record** captures each decision as it happens. **Adjudicate** keeps an annotator's label, a reviewer's decision and an expert's resolution distinct. **Release** produces frozen datasets with manifests, behind a gate that checks recorded facts. **Evaluate** measures quality, the effect of AI on people, and the integrity of the record under repeatable conditions. Text annotation was agreed with the client as the committed path, with image, audio and video kept working but not extended.

The benefits are practical. A team using Hej can show, item by item, which version of the guideline governed an answer, whether a person followed or overrode the AI, and why a disagreement ended as it did. The release gate turns an organisational promise ("everything was reviewed") into a check that cannot be passed by assertion. The evaluation harness lets the client measure the AI's effect on human judgement before trusting it in production. For Arc Intelligence, these properties are what separate a governed human-judgement platform from a labelling tool.

The choice also has consequences that deserve stating. Recording every decision adds data, refusals and friction: some actions that users could take before are now blocked, and a release can be refused for reasons that take work to fix. A provenance record proves what happened, not that the judgement was right; a wrong label reached by a properly recorded route is still wrong, only easier to find. Not doing this work would leave the client's platform, and every dataset produced on it, exposed to precisely the failures above: labels that cannot be audited, AI influence that cannot be measured, and an export that may contain answers no reviewer approved. As the use of AI-assisted labelling grows, those failures become harder to detect and more costly to repair downstream.

The rest of this report is organised as follows. Chapter 2 reviews the literature on annotation quality, human–AI collaboration, provenance, governance and existing tools, and identifies the gap this project addresses. Chapter 3 states the project's aims, objectives, questions and scope. Chapter 4 describes the methods used to build, test and deploy the platform, Chapter 5 the resources and roles, and Chapter 6 the milestones as they happened. Chapter 7 presents the results, Chapter 8 discusses what they mean for the client and the field, and Chapter 9 sets out the limitations and future work.

# 2 Related Literature

This chapter places the project within the research and practice it builds on. Hej's requirements did not arise from the client's preferences alone: each of the six pillars answers a problem that the literature on data annotation, human–AI decision-making, provenance and access control has documented. The review below explains those problems and shows how they shaped specific design decisions in the platform.

## 2.1 Literature Review

**Why the review was needed.** The client's brief demands properties, such as provenance "captured as it happens", release gates that cannot be satisfied by assertion and measurement of anchoring and automation bias, that come from different research communities. Building them required knowing what each community had established: which agreement measures are sound, what AI assistance does to annotators, what a provenance record must contain, and what existing tools already offer. Without that grounding, design decisions would have been arbitrary or would have repeated known mistakes.

**Scope and selection.** The review covers five themes: annotation quality and agreement; AI-assisted annotation and its effect on human judgement; data provenance and dataset accountability; governance, access control and versioning; and existing annotation tools. Peer-reviewed journal and conference papers were preferred, from natural language processing (ACL Anthology), human–computer interaction (ACM CHI, CSCW, IUI), machine learning and its accountability (NeurIPS, ICML, FAccT), databases and security. A W3C standard, an EU regulation and vendor documentation were used where the topic is defined by them. Search terms included "inter-annotator agreement", "crowdsourced labels", "pre-annotation bias", "automation bias", "LLM-assisted annotation", "data provenance", "dataset documentation", "role-based access control" and "dataset version control". Foundational work on agreement coefficients, anchoring, access control and provenance dates from 1960 to 2007 and was kept because the platform implements it directly; work on annotation practice is from 2008 onward, and work on large-language-model (LLM) assistance from 2021 to 2025. Every source was checked against its publisher's record before it was cited.

### 2.1.1 Label quality is a property of the process

Early work on crowdsourcing showed that labels from non-experts can be useful if collected and combined with care. Snow et al. (2008) found that, on several language tasks, a small number of non-expert labels per item, aggregated, came close to expert quality. Sheng et al. (2008) showed that labelling the same item more than once improves both label quality and the models trained on it when individual labels are noisy, but not in every case, and that choosing which items to relabel matters. Both results point to the same conclusion: a label's reliability depends on how it was produced, how many people produced it and how their answers were combined. That information is lost once only the final label is kept. The cost of losing it is not hypothetical. Northcutt et al. (2021) estimated that test sets of ten widely used benchmarks contain on average at least 3.3% label errors, enough to reverse the ranking of some models.

Agreement between annotators is the standard evidence that a labelling scheme is reliable, and the choice of measure matters. Raw percentage agreement ignores the agreement expected by chance, which is high when one category dominates. Cohen's (1960) kappa corrects for chance between two fixed coders, and Fleiss (1971) extended the idea to many raters, assuming that raters are interchangeable. Krippendorff's alpha generalises further, handling any number of coders and items with missing answers (Hayes & Krippendorff, 2007). Artstein and Poesio (2008) surveyed these coefficients for computational linguistics and showed that they rest on different assumptions about coders and chance, so the choice must fit how the data was produced.

A second line of work questions whether disagreement should be removed at all. Aroyo and Welty (2015) argued that the belief in a single correct answer for every item is a myth, and that disagreement among annotators often signals genuine ambiguity in the item or the guideline. Plank (2022) made the same case for human label variation, arguing that treating it as noise harms both modelling and evaluation. The client adopted this view explicitly: in its answers to the team, disagreement was described as first-class data whose lineage must be kept, and an expert may resolve an item as genuinely ambiguous rather than forcing a winner.

### 2.1.2 AI assistance and its effect on human judgement

Automating part of labelling is attractive. Gilardi et al. (2023) found that a general-purpose LLM outperformed crowd workers on several text-annotation tasks at a fraction of the cost. Studies of pre-annotation, where a system proposes labels that people then correct, report time savings: Lingren et al. (2014) measured 13.9–21.5% less time per entity in clinical named-entity annotation without a significant fall in agreement, and Desmond et al. (2021) found that an AI-assisted labelling interface increased both speed and accuracy. The same literature, however, records the risk. Fort and Sagot (2010) found that pre-annotation sped up part-of-speech tagging but could introduce systematic bias, especially when the pre-annotation was good enough to be trusted.

Research on decision-making explains why. Tversky and Kahneman (1974) showed that an initial value anchors later estimates even when people know it is arbitrary. In human-factors research, Parasuraman and Manzey (2010) described automation bias: people working with an automated aid make errors of omission, missing problems the aid did not flag, and errors of commission, following its wrong advice. They also found that training does not reliably prevent these errors. Studies of AI-assisted decisions confirm the pattern. Bansal et al. (2021) found that explanations made people more likely to accept an AI's recommendation whether it was right or wrong, and Wang et al. (2024) found that LLM labels improved annotators' accuracy when correct but reduced it when wrong. Most directly relevant to this project, Schroeder et al. (2025) ran a pre-registered study of LLM-assisted annotation on subjective tasks. Suggestions did not make annotators faster but made them more confident, shifted the distribution of labels towards the model's, and inflated the model's measured performance when the assisted labels were later used as the reference.

Two consequences follow for an annotation platform. First, if AI-assisted labels are used both to build a dataset and to judge the AI, the evaluation is circular unless the platform keeps the human's independent answer separate from the AI's suggestion. Second, the order of exposure matters. Buçinca et al. (2021) tested "cognitive forcing" designs and found that one in which people made their own decision before seeing the AI's recommendation, and could then update it, reduced over-reliance compared with showing the recommendation up front. This is, in substance, the blind-then-reveal protocol the client asked for. Finally, a model's stated confidence is only useful if it is calibrated. Guo et al. (2017) showed that modern neural networks are often overconfident and popularised the expected calibration error (ECE) for measuring the gap between confidence and accuracy.

### 2.1.3 Provenance and dataset accountability

Provenance is the record of where data came from and how it was derived. In databases, Buneman et al. (2001) distinguished "why" provenance (which source records justify a result) from "where" provenance (where a value was copied from). The W3C PROV data model generalised the idea for the web as a graph of entities, the activities that used and produced them, and the agents responsible (Moreau & Missier, 2013). For an annotation platform, this vocabulary maps naturally: an item and each answer are entities; annotating, reviewing and adjudicating are activities; and people, models and the platform's own rules are agents, which must be told apart if the record is to say whether a person or a model made a decision.

In machine learning, the accountability literature has focused on documentation. Datasheets for datasets ask creators to describe motivation, composition, collection and labelling (Gebru et al., 2021), and model cards do the same for trained models (Mitchell et al., 2019). Hutchinson et al. (2021) argued that datasets should be developed with the discipline of the software lifecycle, producing documents at each stage from requirements and design to testing and maintenance, so that decisions can be audited. Surveys of data-centric AI treat data collection, cleaning and label quality as central problems of deep learning rather than preliminaries to it (Whang et al., 2023). Sambasivan et al. (2021) found that 92% of the practitioners they interviewed in high-stakes domains had experienced data cascades, compounding problems that trace back to data, and that these are often invisible until late. Regulation now asks for the same evidence: Article 10 of the EU AI Act requires data governance covering data origin and preparation operations such as annotation and labelling (Regulation (EU) 2024/1689, 2024).

The common limit of this work is that it describes what should be documented, not how the record is captured. A datasheet is written by people, usually after the dataset exists. If the platform that produced the labels did not record each decision, its author has nothing reliable to draw on. The client's brief closes this gap by requiring provenance "captured as it happens, not reconstructed afterwards".

### 2.1.4 Governance, separation of duties and immutable versions

Role-based access control (RBAC) assigns permissions to roles rather than to individuals, and supports constraints such as separation of duties, under which no single person may hold two conflicting responsibilities (Sandhu et al., 1996). Saltzer and Schroeder's (1975) design principles add least privilege (each party holds only the authority its work requires), separation of privilege, and complete mediation (every access is checked, not only the first). Applied to annotation, separation of duties is a quality control as much as a security one. A reviewer who approves their own answer, or an expert who adjudicates a dispute they took part in, defeats the independence that review and adjudication are supposed to provide, which is exactly what the inherited Hej code allowed.

Reproducibility requires that what was released stays fixed. Bhardwaj et al. (2015) proposed dataset version control modelled on source control, with history, branching and comparison of dataset versions. For a labelling platform, the same principle applies at two levels: each answer should be a version that later work supersedes but never overwrites, and each release should be a frozen artefact whose contents can be checked later against a record of what it was meant to contain.

### 2.1.5 Existing annotation tools

Mature tools exist for the labelling moment. Label Studio imports model predictions as read-only pre-annotations, which can be copied into a new annotation for the annotator to edit (Tkachenko et al., 2020–2025); its reviewer workflow and agreement reporting are part of the commercial edition (HumanSignal, n.d.). Prodigy places a model in the loop: annotators accept or reject its suggestions, and the model learns from those decisions to choose the next examples (Montani & Honnibal, 2017). CVAT pre-annotates images and video with pre-trained models, filtered by a confidence threshold (CVAT.ai Corporation, 2023), and doccano provides open-source text annotation (Nakayama et al., 2018). Amazon SageMaker Ground Truth combines several workers' answers into a single consolidated label and can label automatically the items on which its model is confident, sending the rest to people (Amazon Web Services, n.d.-a, n.d.-b).

These tools are designed to make labelling efficient, and several do so by merging human and machine contributions: consolidation turns several answers into one, and a pre-annotation copied into an annotation no longer says which parts the person changed. That is the opposite of what the client's brief required, which is that an annotator's label, a reviewer's decision and an adjudicated judgement stay distinct, and that the record says whether the human accepted, modified, rejected or replaced the AI's suggestion. In the documentation reviewed, none of these tools describes a release gate that reads recorded decisions and refuses to export unreviewed or untraceable items. Integrating Label Studio was excluded from the project's scope, and the client warned against recreating a general-purpose tool of that kind: its interest was the governed layer around annotation, not another annotation interface (Section 3.3).

### 2.1.6 Synthesis: the gap and how Hej addresses it

The literature agrees on three points. Label quality depends on process, so the process must be recorded. AI assistance changes human answers in measurable and sometimes harmful ways, so the platform must keep the human's independent judgement apart from the AI's suggestion if it is to measure that change. Documentation and regulation increasingly ask for the history of each label, yet they assume a record that tools do not keep. The gap is a platform that captures the provenance of each label at the point of decision, preserves the separate roles of model, annotator, reviewer and expert, enforces independence on the server, and makes release conditional on the record. Table 1 shows how specific findings informed the design decisions the team recorded in Hej's architecture decision records (ADRs).

Table: Findings from the literature and the Hej design decisions they informed

| Theme | Finding | Design decision in Hej (ADR) |
| --- | --- | --- |
| Agreement measures | Raw agreement is inflated by chance; coefficients differ in their assumptions (Artstein & Poesio, 2008; Hayes & Krippendorff, 2007) | Agreement is reported as a coefficient beside the raw rate: Fleiss' kappa for two independent reviews, Krippendorff's alpha over annotators' first independent answers; an undefined coefficient is shown as missing with its reason, never as 0 or 1 (ADR 019) |
| Disagreement as data | Disagreement often reflects real ambiguity (Aroyo & Welty, 2015; Plank, 2022) | Disagreements and their settlement are kept as their own records; an expert may resolve an item as ambiguous, and the release lists it as such (ADR 020, 021, 022) |
| Anchoring and automation bias | Seeing a suggestion first shifts answers and inflates measured model performance (Tversky & Kahneman, 1974; Parasuraman & Manzey, 2010; Schroeder et al., 2025) | Blind-then-reveal is an evaluation protocol: the annotator's blind verdict is recorded before the suggestion is shown; the suggestion sits in its own table that no other read can reach; no "use the AI's answer" shortcut is offered (ADR 016) |
| Decide before seeing the AI | Deciding first and then updating reduces over-reliance (Buçinca et al., 2021) | The protocol refuses a reveal before the blind verdict, and measures only first rounds, since a later round is no longer blind (ADR 016) |
| Calibration | Model confidence is often miscalibrated (Guo et al., 2017) | A model's confidence is stored as stated, or as none when absent or out of range, never as 0; calibration is reported as ECE and Brier score from recorded runs (ADR 019, 025) |
| Provenance | Provenance links results to sources, activities and agents (Buneman et al., 2001; Moreau & Missier, 2013) | An append-only event is written at each decision, naming its actor as a person, a model or the platform; the database refuses any update or deletion (ADR 015) |
| Accountability and documentation | Datasets need auditable records of how they were made (Gebru et al., 2021; Hutchinson et al., 2021) | Each release carries a manifest listing every item, its chosen answer, the versions in force and its event chain, with hashes anyone can check without the platform (ADR 021) |
| Separation of duties and least privilege | Conflicting duties must not meet in one person; each role holds only what it needs (Sandhu et al., 1996; Saltzer & Schroeder, 1975) | An expert cannot decide a dispute on an item they annotated, reviewed or opened (ADR 011); a reviewer's correction is a proposal, never an approval (ADR 012); administrators hold no judging capability (ADR 023) |
| Versioning and immutability | Datasets need version history like source code (Bhardwaj et al., 2015) | Every answer is a version and at most one is authoritative (ADR 009); guidelines and policies are versioned and each answer cites them (ADR 018); the release gate reads only recorded decisions (ADR 020) |

Two findings in the literature also mark the limits of what such a platform can claim. A provenance record shows how a label was produced, not whether it is correct; Northcutt et al. (2021) found errors in datasets produced by careful processes. And measuring the effect of AI on annotators needs real annotators: the platform can provide the protocol and the measures, but the effect itself is an empirical question. Both limits return in Chapter 9.

# 3 Project Problems

## 3.1 Project Aims & Objectives

The project's aims follow the six pillars of the client's brief, grouped by the guarantee each provides:

- **Aim 1 — A defensible dataset (Record, Release).** Every released label can be traced to the source, guideline and policy versions, AI suggestion, human response, reviews and adjudication that produced it, and a release that cannot be traced is refused.
- **Aim 2 — Trustworthy judgement (Govern, Adjudicate).** Roles carry only the authority they need, no one judges their own work, and the contributions of annotator, reviewer and expert remain distinct.
- **Aim 3 — Accountable AI assistance (Assist, Evaluate).** AI suggestions come through a replaceable interface, a failure is never disguised as a suggestion, and the effect of AI on quality and on human judgement can be measured under repeatable conditions.
- **Aim 4 — A platform that can be proven and maintained.** The inherited defects are closed, and every guarantee above is backed by automated evidence that runs on each change.

The objectives that operationalise these aims fall into two groups (Table 2). Objectives O1 to O4 are the scope agreed with the client at the first status check in week 4: the core workflow, integration of the web application with the annotation and AI services, governance, and the contracts between components. Objectives O5 to O7 were added afterwards, when a closer reading of the brief and the client's answers in weeks 6 to 8 showed that provenance, versioned and gated releases, and the evaluation harness were required rather than optional (see Chapter 6). O8 runs through both groups.

Table: Project objectives, the aims they serve and how completion is measured

| Objective | Aim | How completion is measured |
| --- | --- | --- |
| O1 Complete the core workflow: project → policy → task → items → AI first pass → human review → cross-review → dispute → adjudication → finalised item, on the provided text data | 2, 3 | End-to-end casebook cases carry a real record from the client's AG News dataset through every stage; the workflow is demonstrated on real screens |
| O2 Integrate the web application with the annotation and AI services through a typed model interface, with scripted and live models interchangeable | 3 | AI-first tasks run against live providers and against a scripted client with no change to the workflow; a failed model call is recorded as a failure, never as a suggestion |
| O3 Enforce governance on the server: roles and capabilities, configurable review policies, and independence of review and adjudication | 2 | Permission test suites and casebook cases show refusals for self-approval, self-adjudication and cross-project writes; the corresponding Critical defects are closed with regression tests |
| O4 Validate and correct the schemas and contracts between web, API and AI services | 2, 4 | Results are checked against their task's output shape on submission; web type-checking and tests pass in continuous integration (CI) |
| O5 Record provenance as it happens, with versioned sources, guidelines and policies | 1 | An event exists for every decision point; each answer cites the versions in force; an integrity check confirms the history of every released item |
| O6 Produce immutable releases with manifests, gated before they exist | 1 | The gate refuses unreviewed, disputed, untraceable or unresolved items with a reason per item and creates nothing; a release can be rebuilt and checked from its manifest alone |
| O7 Build a reusable evaluation harness and a casebook of 40–60 end-to-end cases, including adversarial ones, measuring quality, collaboration and integrity | 3, 4 | Case count and category coverage; agreement, accuracy and calibration figures from recorded model runs; blind-then-reveal measures; every run compared with a committed baseline in CI |
| O8 Close the inherited defects inside the features that depend on them | 4 | All six Critical defects closed; every other defect closed or left open with an argued decision |

## 3.2 Project Questions

The client's brief and the first meetings described symptoms: an inherited codebase with serious defects, a workflow that worked only part of the way through, and AI that provided suggestions without any measure of their effect. Those symptoms share one underlying problem. The platform produced labels but could not defend them. Nothing linked an exported label to the decisions behind it, the record that did exist could be rewritten, the people checking the work were not guaranteed to be independent of it, and nothing stood between an unchecked dataset and its release. Fixing the defects one by one would have removed the symptoms without giving the client what it needed: a platform whose output carries its own evidence.

The project therefore addressed the following questions. Chapter 7 reports the results against each, and Chapter 8 discusses the answers.

- **RQ1 — Traceability.** Can a released dataset answer, for every item it contains, how its label got there (source and guideline version, AI suggestion, the human response to it, each review, dispute and adjudication, each with an actor and a time) from a record captured at each decision rather than reconstructed afterwards?
- **RQ2 — Gated and checkable release.** Can the platform refuse to create a release when that answer cannot be given (because items are unreviewed, disputed, missing provenance or without an authoritative answer) using only recorded facts and never an operator's assertion; and can anyone check a release against its manifest without the platform?
- **RQ3 — Governed judgement.** Can the server enforce governance so that no one approves, settles or adjudicates work they took part in, so that roles carry only the authority they need, and so that the annotator's label, the reviewer's decision or correction and the adjudicated resolution remain distinct records rather than a single "final answer"?
- **RQ4 — Measured AI assistance.** Can AI suggestions be supplied through a replaceable, typed interface that never disguises a failure as a suggestion, and can both the quality of those suggestions (accuracy and calibration) and their effect on human judgement (keeping or revising one's own answer) be measured under repeatable conditions?
- **RQ5 — Proof rather than demonstration.** Can these properties be shown by repeatable, adversarial, end-to-end evidence that runs through the real API and guards against regression, while the inherited defects are closed inside the features that depend on them, within one semester?

RQ1 and RQ2 correspond to Aim 1, RQ3 to Aim 2, RQ4 to Aim 3 and RQ5 to Aim 4.

## 3.3 Project Scope

**In scope.** The project covered the six pillars as they apply to text annotation: organisation, role and permission management; versioned guidelines and project policies, with source versions recorded from the data pointer of each item; the two production annotation modes, human-only and AI-first; blind-then-reveal as an evaluation protocol, a separate task setting rather than a third production mode, as the client specified on 21 September and confirmed on 14 October; review, independent cross-review, disputes and expert adjudication; the provenance event record and item history; frozen releases with manifests and a pre-release gate; and the evaluation harness, casebook and quality, collaboration and integrity measures. Import of the client's JSON Lines (JSONL) text datasets, one source record per item, was brought into scope at the client's request in week 7.

**Modality.** Text was agreed in week 4 as the committed demonstration path, because it was the highest-value and highest-confidence route through the workflow in the time available. The item and dataset schemas were designed to admit image, audio and video, and those modalities were required to keep working, but they were not extended to the full set of guarantees and not demonstrated end to end.

**Out of scope.** The following were excluded, following the brief's explicit non-goals and the team's backlog:

- rebuilding the annotation interface, or integrating an external tool such as Label Studio;
- training or fine-tuning models, since the platform calls models through providers;
- a universal annotation ontology or a general-purpose workflow or task builder;
- every modality at once, as above;
- claims of formal privacy or legal compliance made through software features alone;
- marketplace, trust, billing and payout features, which the client treats as future extensions;
- a request workflow through which annotators, reviewers or experts ask for a finalised item to be reopened; the client allowed it to be deferred, and only the project manager reopens directly.

The client's reference ("gold") labels were also kept out of the platform. Measures that need them, such as accuracy and calibration, are computed by the evaluation harness outside the application, so that evaluation-only data never reaches annotators or models.

**Inherited defects.** At the week-4 status check the client directed the team not to spend one to two weeks clearing the 30 catalogued defects before building, but to prioritise new features and fix a defect when the feature under construction depends on it. The team adopted that policy and made it traceable: each defect was linked to the user story it belongs to and closed by that story's work, with a regression test where possible, and any defect left open had to carry an argued decision rather than be dropped silently. Closing all six Critical defects was also set as a success criterion in its own right.

**Working constraints.** The brief also fixed how the existing system could be changed. The interface style, authentication and any feature that already worked were stable by default; replacing one needed a written justification agreed at review before the change, and regenerating a working subsystem because that was faster than reading it was not accepted. Significant decisions, including the client's answers, were recorded as ADRs in the repository, which is why Table 1 can link each design choice to its record.

# References (draft A)

Amazon Web Services. (n.d.-a). *Annotation consolidation*. Amazon SageMaker AI Developer Guide. Retrieved October 26, 2026, from https://docs.aws.amazon.com/sagemaker/latest/dg/sms-annotation-consolidation.html

Amazon Web Services. (n.d.-b). *Automate data labeling*. Amazon SageMaker AI Developer Guide. Retrieved October 26, 2026, from https://docs.aws.amazon.com/sagemaker/latest/dg/sms-automated-labeling.html

Aroyo, L., & Welty, C. (2015). Truth is a lie: Crowd truth and the seven myths of human annotation. *AI Magazine, 36*(1), 15–24. https://doi.org/10.1609/aimag.v36i1.2564

Artstein, R., & Poesio, M. (2008). Inter-coder agreement for computational linguistics. *Computational Linguistics, 34*(4), 555–596. https://doi.org/10.1162/coli.07-034-R2

Bansal, G., Wu, T., Zhou, J., Fok, R., Nushi, B., Kamar, E., Ribeiro, M. T., & Weld, D. (2021). Does the whole exceed its parts? The effect of AI explanations on complementary team performance. In *Proceedings of the 2021 CHI Conference on Human Factors in Computing Systems* (pp. 1–16). ACM. https://doi.org/10.1145/3411764.3445717

Bhardwaj, A., Bhattacherjee, S., Chavan, A., Deshpande, A., Elmore, A. J., Madden, S., & Parameswaran, A. (2015). DataHub: Collaborative data science & dataset version management at scale. In *Proceedings of the 7th Biennial Conference on Innovative Data Systems Research (CIDR 2015)*. https://arxiv.org/abs/1409.0798

Buçinca, Z., Malaya, M. B., & Gajos, K. Z. (2021). To trust or to think: Cognitive forcing functions can reduce overreliance on AI in AI-assisted decision-making. *Proceedings of the ACM on Human-Computer Interaction, 5*(CSCW1), Article 188. https://doi.org/10.1145/3449287

Buneman, P., Khanna, S., & Tan, W.-C. (2001). Why and where: A characterization of data provenance. In J. Van den Bussche & V. Vianu (Eds.), *Database theory — ICDT 2001* (Lecture Notes in Computer Science, Vol. 1973, pp. 316–330). Springer. https://doi.org/10.1007/3-540-44503-X_20

Cohen, J. (1960). A coefficient of agreement for nominal scales. *Educational and Psychological Measurement, 20*(1), 37–46. https://doi.org/10.1177/001316446002000104

CVAT.ai Corporation. (2023). *Computer Vision Annotation Tool (CVAT)* (Version 2.8.1) [Computer software]. Zenodo. https://doi.org/10.5281/zenodo.10072446

Desmond, M., Muller, M., Ashktorab, Z., Dugan, C., Duesterwald, E., Brimijoin, K., Finegan-Dollak, C., Brachman, M., Sharma, A., Joshi, N. N., & Pan, Q. (2021). Increasing the speed and accuracy of data labeling through an AI assisted interface. In *Proceedings of the 26th International Conference on Intelligent User Interfaces* (pp. 392–401). ACM. https://doi.org/10.1145/3397481.3450698

Fleiss, J. L. (1971). Measuring nominal scale agreement among many raters. *Psychological Bulletin, 76*(5), 378–382. https://doi.org/10.1037/h0031619

Fort, K., & Sagot, B. (2010). Influence of pre-annotation on POS-tagged corpus development. In *Proceedings of the Fourth Linguistic Annotation Workshop* (pp. 56–63). Association for Computational Linguistics. https://aclanthology.org/W10-1807/

Gebru, T., Morgenstern, J., Vecchione, B., Vaughan, J. W., Wallach, H., Daumé III, H., & Crawford, K. (2021). Datasheets for datasets. *Communications of the ACM, 64*(12), 86–92. https://doi.org/10.1145/3458723

Gilardi, F., Alizadeh, M., & Kubli, M. (2023). ChatGPT outperforms crowd workers for text-annotation tasks. *Proceedings of the National Academy of Sciences, 120*(30), Article e2305016120. https://doi.org/10.1073/pnas.2305016120

Guo, C., Pleiss, G., Sun, Y., & Weinberger, K. Q. (2017). On calibration of modern neural networks. In *Proceedings of the 34th International Conference on Machine Learning* (Proceedings of Machine Learning Research, Vol. 70, pp. 1321–1330). https://proceedings.mlr.press/v70/guo17a.html

Hayes, A. F., & Krippendorff, K. (2007). Answering the call for a standard reliability measure for coding data. *Communication Methods and Measures, 1*(1), 77–89. https://doi.org/10.1080/19312450709336664

HumanSignal. (n.d.). *Review annotations in Label Studio*. Label Studio Documentation. Retrieved October 26, 2026, from https://docs.humansignal.com/guide/quality

Hutchinson, B., Smart, A., Hanna, A., Denton, E., Greer, C., Kjartansson, O., Barnes, P., & Mitchell, M. (2021). Towards accountability for machine learning datasets: Practices from software engineering and infrastructure. In *Proceedings of the 2021 ACM Conference on Fairness, Accountability, and Transparency* (pp. 560–575). ACM. https://doi.org/10.1145/3442188.3445918

Lingren, T., Deleger, L., Molnar, K., Zhai, H., Meinzen-Derr, J., Kaiser, M., Stoutenborough, L., Li, Q., & Solti, I. (2014). Evaluating the impact of pre-annotation on annotation speed and potential bias: Natural language processing gold standard development for clinical named entity recognition in clinical trial announcements. *Journal of the American Medical Informatics Association, 21*(3), 406–413. https://doi.org/10.1136/amiajnl-2013-001837

Mitchell, M., Wu, S., Zaldivar, A., Barnes, P., Vasserman, L., Hutchinson, B., Spitzer, E., Raji, I. D., & Gebru, T. (2019). Model cards for model reporting. In *Proceedings of the Conference on Fairness, Accountability, and Transparency* (pp. 220–229). ACM. https://doi.org/10.1145/3287560.3287596

Montani, I., & Honnibal, M. (2017, August 4). *Prodigy: A new tool for radically efficient machine teaching*. Explosion. https://explosion.ai/blog/prodigy-annotation-tool-active-learning

Moreau, L., & Missier, P. (Eds.). (2013). *PROV-DM: The PROV data model* (W3C Recommendation). World Wide Web Consortium. https://www.w3.org/TR/2013/REC-prov-dm-20130430/

Nakayama, H., Kubo, T., Kamura, J., Taniguchi, Y., & Liang, X. (2018). *doccano: Text annotation tool for human* [Computer software]. https://github.com/doccano/doccano

Northcutt, C. G., Athalye, A., & Mueller, J. (2021). Pervasive label errors in test sets destabilize machine learning benchmarks. In *Proceedings of the Neural Information Processing Systems Track on Datasets and Benchmarks* (Vol. 1). https://datasets-benchmarks-proceedings.neurips.cc/paper/2021/hash/f2217062e9a397a1dca429e7d70bc6ca-Abstract-round1.html

Parasuraman, R., & Manzey, D. H. (2010). Complacency and bias in human use of automation: An attentional integration. *Human Factors, 52*(3), 381–410. https://doi.org/10.1177/0018720810376055

Plank, B. (2022). The "problem" of human label variation: On ground truth in data, modeling and evaluation. In *Proceedings of the 2022 Conference on Empirical Methods in Natural Language Processing* (pp. 10671–10682). Association for Computational Linguistics. https://doi.org/10.18653/v1/2022.emnlp-main.731

Regulation (EU) 2024/1689 of the European Parliament and of the Council of 13 June 2024 laying down harmonised rules on artificial intelligence (Artificial Intelligence Act). (2024). *Official Journal of the European Union*, L 2024/1689. http://data.europa.eu/eli/reg/2024/1689/oj

Saltzer, J. H., & Schroeder, M. D. (1975). The protection of information in computer systems. *Proceedings of the IEEE, 63*(9), 1278–1308. https://doi.org/10.1109/PROC.1975.9939

Sambasivan, N., Kapania, S., Highfill, H., Akrong, D., Paritosh, P., & Aroyo, L. M. (2021). "Everyone wants to do the model work, not the data work": Data cascades in high-stakes AI. In *Proceedings of the 2021 CHI Conference on Human Factors in Computing Systems* (pp. 1–15). ACM. https://doi.org/10.1145/3411764.3445518

Sandhu, R. S., Coyne, E. J., Feinstein, H. L., & Youman, C. E. (1996). Role-based access control models. *Computer, 29*(2), 38–47. https://doi.org/10.1109/2.485845

Schroeder, H., Roy, D., & Kabbara, J. (2025). Just put a human in the loop? Investigating LLM-assisted annotation for subjective tasks. In *Findings of the Association for Computational Linguistics: ACL 2025* (pp. 25771–25795). Association for Computational Linguistics. https://doi.org/10.18653/v1/2025.findings-acl.1323

Sheng, V. S., Provost, F., & Ipeirotis, P. G. (2008). Get another label? Improving data quality and data mining using multiple, noisy labelers. In *Proceedings of the 14th ACM SIGKDD International Conference on Knowledge Discovery and Data Mining* (pp. 614–622). ACM. https://doi.org/10.1145/1401890.1401965

Snow, R., O'Connor, B., Jurafsky, D., & Ng, A. Y. (2008). Cheap and fast—but is it good? Evaluating non-expert annotations for natural language tasks. In *Proceedings of the 2008 Conference on Empirical Methods in Natural Language Processing* (pp. 254–263). Association for Computational Linguistics. https://aclanthology.org/D08-1027/

Tkachenko, M., Malyuk, M., Holmanyuk, A., & Liubimov, N. (2020–2025). *Label Studio: Data labeling software* [Computer software]. https://github.com/HumanSignal/label-studio

Tversky, A., & Kahneman, D. (1974). Judgment under uncertainty: Heuristics and biases. *Science, 185*(4157), 1124–1131. https://doi.org/10.1126/science.185.4157.1124

Wang, X., Kim, H., Rahman, S., Mitra, K., & Miao, Z. (2024). Human-LLM collaborative annotation through effective verification of LLM labels. In *Proceedings of the 2024 CHI Conference on Human Factors in Computing Systems* (pp. 1–21). ACM. https://doi.org/10.1145/3613904.3641960

Whang, S. E., Roh, Y., Song, H., & Lee, J.-G. (2023). Data collection and quality challenges in deep learning: A data-centric AI perspective. *The VLDB Journal, 32*(4), 791–813. https://doi.org/10.1007/s00778-022-00775-9

<!-- NOTES

WORD COUNTS (running text, tables included; references excluded)
- Abstract: ~474 (provisional; 150-600 allowed; assembler to tighten to ~350-400 once Ch. 7-9 exist)
- 1 Introduction: ~933 (about 2 pages)
- 2 Related Literature / 2.1: ~2,697, of which Table 1 ~470 (about 5.5-6 pages)
- 3 Project Problems: ~1,595, of which Table 2 ~360 (3.1 ~630, 3.2 ~415, 3.3 ~550; about 3 pages; tables may push it slightly over)
- References (draft A): 39 entries; 34 scholarly/standard/regulatory, 5 software or vendor documentation.

PROJECT QUESTIONS (also in A-research-questions.md; C answers them by number)
- RQ1 Traceability (Record, Adjudicate) - Aim 1
- RQ2 Gated and checkable release (Release) - Aim 1
- RQ3 Governed judgement (Govern, Adjudicate) - Aim 2
- RQ4 Measured AI assistance (Assist, Evaluate) - Aim 3
- RQ5 Proof rather than demonstration (Evaluate, all; defects) - Aim 4

FIGURES AND NUMBERS, WITH SOURCES
- 30 inherited defects, 6 Critical; examples (overwrite, self-approval, conflicting export, lost corrections): docs/info/issues.md rows 2, 4, 5, 7.
- "Client directed: prioritise features, fix only blocking defects": CS57_Status_Checking_1.pdf, client feedback (26 Aug).
- Text as committed path; week-4 scope list: CS57_Status_Checking_1.pdf; provenance/release/evaluation added after week 4: CS57_Status_Checking_2.pdf (Deviation from Timeline, Milestones 8-10).
- JSONL import in scope at client request: client-qa.md Round 1 Q1 (answered 21 Sep, week 7); Status Check 2 says brought forward to W8.
- Blind-then-reveal as evaluation protocol: client-qa.md R1-2 (21 Sep); confirmed 14 Oct (ADR 016, GitHub issue #72).
- Disagreement as first-class data; ambiguous resolution: client-qa.md Round 2 preamble and R2-1.
- Reopen request workflow deferred: client-qa.md R2-3 (Hanchen's reply).
- Gold labels outside the platform: ADR 019 decision 2 and R1-1.
- Abstract figures (BRIEF.md / roadmap W11; C re-measures and is authoritative): 88 casebook cases, 87 pass, 1 skipped (EV-018); 63 stories; 95 PRs merged; 30/30 defects. 88 case files confirmed on origin/main 6951781 (git ls-tree apps/hej-api/evaluation/cases).
- Model figures in Abstract: ADR 019 Consequences on origin/main - llama3 AG News 84.5%, DeepSeek Flash AG News 92.5%; Civil Comments 65.5% / 69.8%, ECE 0.27 / 0.22 ("confidently wrong on many toxic comments").
- Table 1 design decisions: ADRs 009, 011, 012, 015, 016, 018, 019, 020, 021, 022, 023, 025 on origin/main 6951781. Checked in code: provenance_events update/delete/truncate triggers (app/models/db_models.py), release_gate.py reasons incl. incomplete_provenance and no_authoritative_answer, manifest_sha256 (routes/releases.py), evaluation_protocol IN ('none','blind_then_reveal').

UNVERIFIED OR SOFT CLAIMS
- Hutchinson et al. (2021): the lifecycle stages "requirements, design ... testing and maintenance" are from memory of the paper body; the abstract (checked) only says each lifecycle stage yields documents drawing on SDLC practice. Wording kept general.
- Northcutt et al. (2021): cited as NeurIPS Datasets and Benchmarks Track Vol. 1 with the proceedings URL; no DOI exists.
- Tool descriptions (2.1.5) rest on vendor documentation fetched 26 Oct 2026 (Label Studio predictions page and review page "only available in Label Studio Enterprise Edition"; AWS Ground Truth consolidation and automated labelling pages; CVAT auto-annotation docs via search summary; Prodigy launch post). The gap statement is deliberately limited to "in the documentation reviewed".
- doccano: only its existence as an open-source text annotation tool is claimed (citation block from its PyPI/GitHub README).
- "Developed by earlier teams without a consistent review process": Status Checking 1, Obstacles & Risks.

OPEN QUESTIONS FOR HANCHEN
1. Abstract mentions "95 reviewed pull requests" and "87 of 88 pass" from BRIEF.md; replace with C's measured figures at assembly.
2. Section 3.3 lists the reopen-request workflow as out of scope (R2-3). Confirm it was never built later.
3. Should Section 3.3 mention that only organisation-scoped roles are honoured (tech-stack.md) as a scope limit, or leave it to Chapter 9?
4. The literature review uses one table (Table 1) and Section 3.1 one table (Table 2); the assembler renumbers.

REFERENCE VERIFICATION (method per item)
- Crossref API (api.crossref.org/works/<DOI>, title/authors/venue/pages checked): Aroyo & Welty 2015; Artstein & Poesio 2008 (also in progress report); Bansal et al. 2021; Buçinca et al. 2021 (+ Harvard page for venue; article 188 from PDF header via search); Buneman et al. 2001 (LNCS / ICDT 2001, ISBN 9783540414568); Cohen 1960; Desmond et al. 2021; Fleiss 1971; Gebru et al. 2021; Gilardi et al. 2023 (article e2305016120); Hayes & Krippendorff 2007; Hutchinson et al. 2021; Lingren et al. 2014; Mitchell et al. 2019; Parasuraman & Manzey 2010; Plank 2022; Saltzer & Schroeder 1975; Sambasivan et al. 2021 (six authors incl. Akrong, Aroyo); Sandhu et al. 1996 (also in progress report); Sheng et al. 2008 (pp. 614-622); Snow et al. 2008; Tversky & Kahneman 1974; Wang et al. 2024; Whang et al. 2023.
- ACL Anthology / web search: Fort & Sagot 2010 (W10-1807, pp. 56-63); Schroeder et al. 2025 (also in progress report; pp. 25771-25795, DOI from ACL Anthology listing).
- PMLR page via search: Guo et al. 2017 (PMLR 70:1321-1330).
- NeurIPS proceedings / arXiv via search: Northcutt et al. 2021.
- CIDR 2015 via MIT DSpace / author PDF: Bhardwaj et al. 2015.
- W3C: Moreau & Missier 2013 (from progress report reference list).
- EUR-Lex via search + Commission AI Act Service Desk (Article 10(2)(b)-(c) text fetched): Regulation (EU) 2024/1689.
- Software/docs fetched directly: Label Studio citation block (GitHub README, 2020-2025, four authors); HumanSignal review docs; AWS Ground Truth (two pages); Prodigy blog post (Montani & Honnibal, 4 Aug 2017); CVAT Zenodo record v2.8.1 (DOI 10.5281/zenodo.10072446); doccano citation (PyPI/GitHub).
-->

