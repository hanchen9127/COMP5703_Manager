# DS Task Dataset Matrix

Document: `ds_task_dataset_matrix.md`  
Status: Draft  
Scope:

Define what kinds of datasets the DS track is expected to prepare for HEJ, what workflow modes they must support, and what runnable proof and metric obligations come with them.

---

# 1. Why This Document Exists

The DS track is not only responsible for producing model outputs.

It is responsible for proving that the platform can be **used** for real annotation and judgement work.

That means DS must align:

* datasets
* schemas
* candidate payloads
* runtime validation
* metrics

to the platform's task and task-item semantics.

This document makes that obligation explicit.

---

# 2. DS Responsibility Framing

CS proves:

```text
the platform exists
the workflow is governed
the surfaces and state transitions run
```

DS proves:

```text
the platform is usable for real annotation and judgement tasks
the schemas are meaningful
human and AI-assisted paths can run
the results are measurable
```

So DS is responsible not only for AI-assisted candidate generation, but also for runnable task assets and usable evaluation evidence.

---

# 3. Core Rule

For every supported DS task family, the intended proof shape is:

```text
dataset aligned to task items
-> schema aligned to task class
-> human-first path can run
-> ai-assisted path can run
-> review-compatible output exists
-> metrics and experiment evidence exist
```

If any of these are missing, the DS contribution is incomplete from a platform-usability perspective.

---

# 4. Annotation Dataset Families

`Annotation`-class tasks should cover modality-oriented datasets such as:

* text annotation
* image annotation
* video annotation
* audio annotation

These datasets should be aligned to:

* task-item granularity
* annotation output schema
* human-first annotation runtime
* AI-assisted annotation candidate generation
* downstream review compatibility

Typical output shapes may include:

* class labels
* spans
* region or object annotations
* timestamped segments
* structured annotation JSON

The exact schema may vary by task type, but each dataset must map cleanly to an agreed platform output schema.

---

# 5. Judgement Dataset Families

`Judgement`-class tasks should cover judgement-oriented datasets such as:

* AI-generated response evaluation
* RAG answer evaluation
* RAG test or benchmark evaluation
* claim support judgement
* paraphrase or semantic relation judgement
* reasoning quality judgement
* preference judgement
* policy decision judgement

These datasets should be aligned to:

* task-item granularity
* judgement decision schema
* human-first judgement path
* AI-assisted judgement candidate generation
* downstream review compatibility

Typical verdict vocabularies may include values such as:

* `explicit_support`
* `paraphrase`
* `inference`
* `unsupported`
* `contradiction`

or other task-type-specific verdict sets agreed in the task decision schema.

The judgement dataset must preserve enough source context for:

* verdict selection
* rationale generation
* review comparison

---

# 6. Runnable Proof Obligation

For each chosen DS task family, DS should be able to demonstrate:

## 6.1 Human-First Path

```text
task-item-aligned example
-> human annotator or judge can produce output
-> output matches platform schema
-> result can be reviewed downstream
```

## 6.2 AI-Assisted Path

```text
task-item-aligned example
-> model produces candidate output
-> candidate payload matches schema
-> confidence or rationale is attached where relevant
-> platform can ingest candidate
-> result can be reviewed downstream
```

## 6.3 Review Compatibility

```text
human or AI output exists
-> reviewer can inspect it
-> reviewer can compare it against task semantics
-> disagreement or escalation remains possible
```

This is the minimum meaning of:

```text
AI + human + review all run through the platform
```

---

# 6.4 Dataset Quality Requirement

All chosen datasets must be:

* complete enough to support one real task use case
* credible and sourceable
* high-quality enough for basic annotation or judgement work
* reasonably clean and usable without hiding major corruption or ambiguity problems

This does **not** mean every dataset must be academically perfect or highly sophisticated.

It does mean each chosen dataset must be good enough to support one defensible use case such as:

* image annotation for road-sign recognition
* image annotation for medical-image labeling
* text judgement for claim support
* RAG answer evaluation for supported vs unsupported answers

Rule:

* the dataset must be capable of supporting a basic but real task workflow for both AI-assisted and human-first execution

If a dataset cannot support a credible basic task, it should not be chosen just because it is easy to download.

---

# 6.5 Candidate Dataset Search Requirement

For each chosen task family, DS should not stop at the first dataset found.

Instead, DS should:

1. search broadly
2. identify at least `3-5` serious candidate datasets for that task family
3. compare them against platform needs
4. recommend the best-fit dataset for initial implementation and workflow demo

Each candidate dataset should include:

* source
* task-family fit
* modality or judgement-type fit
* expected schema fit
* expected human-first usability
* expected AI-assisted usability
* any obvious data-quality or licensing concerns

Each final recommendation should include explicit justification for:

* why this candidate is more suitable than the other candidates
* why it is strong enough to support a real workflow demo
* why it is a better first implementation choice rather than just the easiest dataset available

The intended behavior behind this rule is:

* DS should effectively inspect a wider pool of options before narrowing down
* dataset choice should be a reasoned selection process, not a convenience shortcut

---

# 7. Schema Obligation

Each DS task family must explicitly align to one of:

* `output schema`
  for annotation tasks
* `decision schema`
  for judgement tasks

DS should not produce payloads against an internal ad hoc format and expect CS to reinterpret them later.

At minimum, DS should be able to point to:

* the task class
* the task type
* the target schema
* the candidate payload shape
* any confidence or rationale fields

---

# 8. Metrics And Experiment Obligation

For each chosen DS task family, DS should provide metric or experiment evidence such as:

* candidate quality metrics
* agreement or disagreement rate
* review pass rate
* confidence calibration signal where available
* rationale quality signal where relevant
* human-first vs AI-assisted comparison where feasible

The exact metrics may vary by task family, but the point is stable:

DS must demonstrate that the task family is not only integrated, but also practically usable.

---

# 9. Minimum DS Deliverable Shape

For one DS-supported task family, the expected minimum deliverable is:

```text
dataset-aligned task-item fixtures
-> schema alignment note
-> human-first runtime validation
-> AI-assisted candidate payload
-> review-compatible output example
-> metrics or experiment summary
```

That is the minimum shape required for DS to say:

```text
this platform can be used for this task family
```

---

# 10. Recommended First-Cut Coverage

If scope is tight, the recommended first-cut DS coverage is:

## Annotation

* one text annotation task
* one image or audio/video annotation task if feasible

## Judgement

* one claim-support or RAG-evaluation task
* one preference or policy judgement task if feasible

This is enough to prove:

* one annotation family
* one judgement family
* one human-first path
* one AI-assisted path
* one review-compatible path

without requiring every modality to be equally mature on day one.

---

# 11. Relationship To PR Planning

This document should be read together with:

* `docs/implementation/prs/task-item/annotation-dataset-alignment.pr.md`
* `docs/implementation/prs/task-item/judgement-dataset-alignment.pr.md`
* `docs/implementation/prs/task-item/human-annotation-runtime-validation.pr.md`
* `docs/implementation/prs/task-item/human-judgement-runtime-validation.pr.md`
* `docs/implementation/prs/task-item/task-annotate-ds.pr.md`
* `docs/implementation/prs/task-item/task-judge-ds.pr.md`
* `docs/implementation/prs/task-item/annotation-metrics.pr.md`
* `docs/implementation/prs/task-item/judgement-metrics.pr.md`
* `docs/implementation/prs/task-item/candidate-payload-schema.pr.md`

Use this document as the higher-level DS planning matrix.
