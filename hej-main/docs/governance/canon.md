# Project Canon / Definitive System Reference

Version: v1.1
Status: Authoritative
Last Updated: 2026-03-22

Copyright: HUNTER XU

Please note this project and associated assets belong to the intellectual property of Arc Intelligence. Redistribution is not allowed.

---

# Revision Log

* **v1.1 (2026-03-22)**
  Narrative alignment update for annotation-first, judgement-aware shared-core execution model.
* **v1.0 (2026-03-16)**
  Initial Canon extracted from conceptual discussions regarding human–AI annotation governance and data training infrastructure.

---

# 1. Project Position

> *This project builds a governed human judgment infrastructure that integrates human reasoning into AI training pipelines through structured review, dispute, and arbitration mechanisms.*

## 1.1 What This System Is

This system is a **Human Judgment Infrastructure for AI Training and Evaluation**.

It provides a structured environment where:

* AI-generated candidate outputs
* human first-pass and governance decisions
* disagreement resolution
* expert arbitration

are organized into a **traceable, governed decision pipeline**.

The system enables organizations to integrate **human reasoning and oversight** into machine learning workflows where automated models alone are insufficient or unsafe.

The system treats human judgment not as disposable labor, but as a **first-class computational component** within AI systems.

---

## 1.2 Problem Statement

Modern AI systems increasingly rely on human feedback for:

* training data refinement
* model alignment
* evaluation of model outputs
* safety review
* domain-specific reasoning

However, existing annotation platforms treat human labor as **unstructured, replaceable workforce**, lacking:

* transparent dispute mechanisms
* traceable decision provenance
* governance over human judgments
* integration between AI-generated labels and human verification
* structured arbitration for disagreement

As AI systems become more powerful, **the reliability and accountability of human judgments become critical infrastructure**.

This system addresses the absence of a **structured governance layer for human judgment in AI pipelines**.

---

## 1.3 What This System Is NOT

This system is **NOT**:

* a crowdsourcing platform for cheap labor
* a generic annotation tool
* a data labeling marketplace
* a workforce outsourcing platform
* a simple annotation UI
* a dataset hosting platform

The system does not aim to compete with traditional mass-labeling services focused on scale and low cost.

Instead, it focuses on **structured, governed human decision-making** within AI systems.

---

# 2. Core Mental Model

## 2.1 Human Judgment as System Infrastructure

The system operates under the premise that:

> Human judgment is an essential computational component in AI systems, not merely an auxiliary service.

Human input is treated as a **structured decision process**, not a raw label.

---

## 2.2 The Human–AI Judgment Pipeline

The system conceptualizes annotation and judgement as a **multi-stage governed pipeline**, consisting of distinct stages:

1. **AI Suggestion**

   AI models generate candidate labels, interpretations, verdicts, or other candidate outputs.

2. **Human First-Pass Work or Human Review**

   Human participants may either create first-pass outputs directly or verify, modify, or reject AI outputs depending on execution mode.

3. **Disagreement Detection**

   Divergent judgments between AI and humans, or among humans, are identified.

4. **Dispute Resolution**

   Conflicting interpretations are examined through structured deliberation.

5. **Expert Arbitration**

   Domain experts resolve unresolved disagreements and establish authoritative outcomes.

6. **Canonical Decision Record**

   Final decisions become part of a traceable dataset with full judgment provenance.

---

## 2.3 Distinction: Annotation vs Judgment

Traditional annotation systems treat labels as final outputs.

This system distinguishes between:

| Concept     | Meaning                              |
| ----------- | ------------------------------------ |
| Annotation  | A raw label applied to data          |
| Judgment    | A reasoned decision about data       |
| Arbitration | Resolution of conflicting judgments  |
| Provenance  | Record of how a decision was reached |

The system records **decision provenance**, not only labels.

The system therefore supports at least two first-class task categories:

* `Annotation`
  produce structured labels, spans, classifications, or multimodal markings
* `Judgment`
  evaluate an answer, output, claim, or decision and produce a verdict with reasoning

`Judgment` is not merely a later review step.
It may itself be the primary work performed by a task.

This Canon uses:

* `judgement` for task naming and configuration vocabulary
* `judgment` for broader conceptual prose where that spelling already appears

The two spellings are treated as equivalent in meaning, but implementation-facing naming should prefer the explicit task vocabulary above.

## 2.4 Task Naming Hierarchy

To avoid mixing work semantics, modality, and runtime strategy, the system uses a three-layer naming hierarchy:

* `Task Class`
  the primary kind of work:
  `annotation` or `judgement`
* `Task Type`
  the concrete use case inside that class:
  `text_annotation`, `image_annotation`, `audio_annotation`, `video_annotation`, `llm_answer_evaluation`, `claim_support_judgement`
* `Execution Mode`
  how work begins:
  `ai_assisted` or `human_first`

This means:

* `judgement` should remain a first-class task class
* `evaluation` is best modeled as a judgement task type, not as the top-level class
* `text`, `image`, `audio`, and `video` describe task type, not task class

Example valid combinations:

* `task_class=annotation`, `task_type=text_annotation`, `execution_mode=human_first`
* `task_class=judgement`, `task_type=llm_answer_evaluation`, `execution_mode=ai_assisted`

## 2.5 Judgement Task Subflow

Judgement tasks are first-class production tasks.
They do not begin at review.

The intended subflow is:

```text
Create project
  ->
Create judgement task
  ->
Choose judgement task type
  ->
Connect source data or answer/output source
  ->
Choose ai_assisted or human_first execution
  ->
Define shared judgement instructions and decision schema
  ->
Set launch and advanced options
  ->
Launch task
  ->
See task status and progress
  ->
Perform structured judgement on task items
  ->
Review
  ->
Dispute / arbitration if needed
  ->
Canonical decision with provenance
```

Typical judgement task work includes:

* evaluating an AI-produced answer
* judging whether a claim is supported
* judging whether a policy decision is acceptable
* judging reasoning quality, safety, or evidence sufficiency

In this subflow:

* the primary output is a verdict, score, rationale, or policy assessment
* review remains a downstream governance layer
* dispute remains an escalation layer

---

# 3. Non-Negotiables

The following principles are foundational and not casually revisited.

---

## 3.1 Human Judgment Must Be Traceable

Every decision must be attributable to:

* a human or machine actor
* a stage of the pipeline
* a revision history

Anonymous, untraceable labeling is incompatible with the system's philosophy.

---

## 3.2 Disagreement Is First-Class

Disagreement between human participants, or between human and AI outputs, is not considered an error but a **signal of ambiguity**.

The system must preserve disagreement information rather than collapsing it into majority voting prematurely.

---

## 3.3 AI and Human Roles Are Explicitly Separated

The system distinguishes between:

* AI-generated suggestions
* human-generated decisions

Human participants must be able to evaluate AI output without conflating the two.

---

## 3.4 Governance Over Throughput

The system prioritizes:

* decision integrity
* reproducibility
* interpretability

over:

* annotation throughput
* labor cost minimization
* mass task distribution

---

## 3.5 Human Participation Is Structured

Participants in the system may occupy distinct roles, including:

* task owner / manager
* annotator or judge
* reviewer
* dispute participant
* domain expert
* system administrator

These roles are conceptually distinct.

---

## 3.6 Data Ownership Is External

The system does not assume ownership of training data.

Organizations providing data remain the authoritative owners of that data.

The system functions as a **decision infrastructure layer**, not a dataset repository.

---

# 4. Scope of Validity

## 4.1 Assumptions

The Canon assumes:

* AI systems will increasingly require human oversight.
* Human reasoning remains necessary in complex or ambiguous domains.
* Organizations require traceable and auditable decision processes in AI training.

---

## 4.2 Intended Domains

The system is most applicable to domains where **interpretation and judgment are required**, such as:

* legal analysis
* medical review
* model alignment and RLHF
* policy moderation
* research datasets
* complex multimodal reasoning tasks

---

## 4.3 Project Maturity

At this stage, the project is in the **implementation planning and handover phase**.

The Canon defines the conceptual boundaries that upstream design, implementation planning, and PR scoping must preserve.

---

# 5. Canonical Structure

The system contains several irreducible conceptual layers.

---

## 5.1 Task Definition Layer

Defines the questions posed to human participants.

Tasks represent **judgment problems**, not merely labeling instructions.

Tasks may be configured either as:

* `annotation tasks`
  for text, image, audio, video, or other structured labeling workflows
* `judgment tasks`
  for evaluating AI-generated answers, candidate outputs, or context-answer pairs

Both remain valid shared-core task forms.

---

## 5.2 AI Suggestion Layer

Provides candidate outputs or interpretations produced by AI systems.

These suggestions are subject to human evaluation.

For judgment tasks, the AI suggestion layer may provide:

* a generated answer
* a candidate verdict
* a structured rationale

which humans then judge directly.

---

## 5.3 Human Execution and Review Layer

Human participants may either:

* create first-pass annotation or judgement outputs directly
* evaluate AI suggestions and produce reviewed outcomes

This layer represents the primary interface between human cognition and machine pipelines.

---

## 5.4 Dispute Layer

When multiple judgments conflict, disputes are created.

Disputes allow participants to compare interpretations and reasoning.

---

## 5.5 Arbitration Layer

Experts or designated authorities resolve disputes and produce canonical outcomes.

---

## 5.6 Decision Provenance Layer

All stages of the judgment process are recorded to provide traceability of decisions.

This layer preserves the history of how a final judgment emerged.

---

# 6. Open Questions

The following issues remain unresolved and require further conceptual clarification.

---

## 6.1 Identity and Trust Model

How should the system represent participant expertise and credibility?

Possible approaches include:

* institutional affiliation
* credential verification
* reputation scoring

The final model remains undefined.

---

## 6.2 Label Semantics Exposure

Should human participants see the true semantic meaning of labels, or should labels sometimes be anonymized to avoid bias?

The circumstances under which label anonymization is appropriate remain unresolved.

---

## 6.3 Dispute Resolution Structure

What mechanisms should govern dispute resolution?

Possible structures include:

* expert arbitration
* consensus mechanisms
* structured argumentation

The canonical model remains to be determined.

---

## 6.4 Integration with Existing Annotation Engines

Whether external annotation engines function as interchangeable components of the system remains an architectural decision outside the scope of this Canon.

---

## 6.5 Economic Model

The economic structure of the system (e.g., service platform, infrastructure provider, institutional collaboration) remains undefined.

---

# 7. Revision Policy

This Canon may only be revised under the following conditions:

* fundamental changes in system philosophy
* redefinition of project scope
* conceptual shifts in the understanding of human–AI collaboration

Minor architectural decisions, workflow refinements, or implementation details must be captured through:

* ADRs (Architecture Decision Records)
* RFCs (Requests for Comment)

rather than modifying the Canon itself.
