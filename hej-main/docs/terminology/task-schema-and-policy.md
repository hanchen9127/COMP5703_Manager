# Task Schema And Policy

Document: `task-schema-and-policy.md`  
Status: Draft  
Scope:

Define the task-level meaning of `output schema`, `decision schema`, `workflow policy`, `review policy`, and `dispute policy`, and pin where each concept belongs in HEJ.

---

# 1. Why This Document Exists

Task execution documents often use:

* schema
* policy
* review rules
* dispute rules

as if they were interchangeable.

They are not interchangeable.

This document fixes the hierarchy so setup, DS payloads, review, and dispute can all target the same semantics.

---

# 2. Output Schema

`Output schema` is the structured definition of what a first-pass task result should look like.

It belongs at:

* `Task` setup

It answers:

* what fields must an annotation output contain
* what labels or structured values are valid
* what shape DS candidate payloads must follow for annotation tasks

Typical examples:

* label set
* span structure
* classification output fields
* structured annotation JSON shape

Use `output schema` when the task is fundamentally producing an annotation-style output.

---

# 3. Decision Schema

`Decision schema` is the structured definition of what a judgement result should look like.

It belongs at:

* `Task` setup

It answers:

* what verdicts are allowed
* whether rationale is required
* what structured fields a judgement candidate or final judgement must contain

Typical examples:

* verdict set such as `approve / revise / unsupported / ambiguous`
* rationale requirement
* preference-judgement output shape

Use `decision schema` when the task is fundamentally producing a governed judgement rather than a plain annotation artifact.

---

# 4. Relationship Between Output Schema And Decision Schema

Rule:

* `output schema`
  annotation-oriented result shape
* `decision schema`
  judgement-oriented result shape

Both are task-level setup concepts.

They should be chosen or attached in `Task Setup`, then consumed by:

* human-first execution
* DS candidate payload generation
* review
* downstream canonicalization

They should not be re-authored inside annotate, judge, review, or dispute pages.

---

# 5. Workflow Policy

`Workflow policy` is the umbrella term for the task-level governance rules that shape downstream execution after setup.

It belongs at:

* `Task` setup as task-specific rule visibility
* `Project` scope as policy context visibility

It may include:

* review expectations
* disagreement routing expectations
* export readiness expectations
* fallback posture when AI-assisted execution is unavailable

`Workflow policy` is the broad container term.
It is not the most precise term for downstream review or dispute logic.

---

# 6. Review Policy

`Review policy` is the task-level rule set that governs how first-pass outputs are reviewed.

It belongs at:

* defined or attached in `Task Setup`
* consumed in `Task Review`

It answers:

* what items must be reviewed
* who can review
* what review actions are available
* whether one or multiple approvals are needed
* whether AI-assisted outputs require stronger review

Review policy is downstream of first-pass execution.
It should not be confused with the schema of the output itself.

---

# 7. Dispute Policy

`Dispute policy` is the task-level rule set that governs when disagreement becomes dispute posture.

It belongs at:

* defined or attached in `Task Setup`
* consumed in `Task Review` and `Task Dispute`

It answers:

* when disagreement should be auto-detected
* whether sampled or cross-validated items are required
* what percentage of items receive second-pass validation
* what mismatch conditions escalate into dispute
* whether unresolved items route onward to arbitration

For the current intended design:

* dispute should default to auto-detected disagreement
* dispute should not primarily be a self-service complaint button for the first annotator

---

# 8. Placement Summary

```text
Task Setup
  -> output schema or decision schema
  -> workflow policy
  -> review policy
  -> dispute policy

Annotate / Judge
  -> consume schema

Review
  -> consume review policy
  -> may trigger dispute posture

Dispute
  -> consume dispute policy

DS Integration
  -> must emit payloads matching output schema or decision schema
```

---

# 9. Writing Guidance

When documents use these terms, they should mean:

* `output schema`
  annotation result shape
* `decision schema`
  judgement result shape
* `workflow policy`
  umbrella task-level governance rules
* `review policy`
  downstream review rules
* `dispute policy`
  disagreement-to-dispute routing rules

Avoid:

* calling every task configuration field `policy`
* calling schema and policy the same thing
* redefining schema in execution surfaces
