# Queue

Document: `queue.md`  
Status: Draft  
Scope:

Define what `queue` should and should not mean in HEJ, and prevent the term from being reused ambiguously across task pages, workload metrics, and assignment labels.

---

# 1. Definition

`Queue` is a reserved term for a future **runtime-monitoring surface** inside task scope.

If introduced as a real page later, it should mean:

* AI-assisted processing progress
* candidate-generation progress
* execution backlog
* blocked or delayed runtime work
* throughput or processing-pressure visibility

It should **not** mean the neutral task-item index.

---

# 2. What Queue Does Not Mean

`Queue` should not be used to mean:

* the task items page
* a generic count of open items
* a workstream label such as `expert-gate` or `policy-priority`

Those concepts should use clearer terms:

* `Items`
  the task-level item index
* `backlog`
  open or pending workload count
* `workstream`
  ownership or routing posture inside execution

---

# 3. Why This Needs To Be Pinned Down

Earlier implementation and docs used `queue` for multiple meanings at once:

* the task item list surface
* open workload counts
* assignment-routing labels

That made the word unstable and hard to reason about.

So the current terminology rule is:

```text
items != queue
backlog != queue
workstream != queue
```

---

# 4. Placement In The Hierarchy

If `Queue` becomes a real surface later, it belongs inside `Task workspace`:

```text
project
  -> task
    -> queue
```

But it should be read as:

* a runtime or monitoring view about one `Task`

not as:

* a replacement for the `TaskItem` list
* a separate workflow object

---

# 5. Current Guidance

For the current product and docs:

* `/tasks/{taskId}/items`
  is the authoritative task-item page
* `Items`
  is the correct label for browsing and opening task items
* `Queue`
  should only appear when explicitly discussing a future runtime-monitoring concept

---

# 6. Writing Guidance

When documents use `queue`, they should mean:

> a future task-level runtime-monitoring surface for AI-assisted processing and backlog visibility

If the document is actually describing item browsing or task-item entry, it should say:

* `items`
* `task items`
* `task-item index`

If the document is describing workload counts, it should say:

* `backlog`
* `workload`
* `processing pressure`

If the document is describing routing or ownership, it should say:

* `workstream`
* `routing`
* `assignment lane`
