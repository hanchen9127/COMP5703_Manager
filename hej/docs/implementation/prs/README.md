# PR Specification Map

This folder is organized by **workspace surface hierarchy**, not by implementation package or contributor preference.

The intended structure is:

```text
global/
project-portfolio/
project-workspace/
task-workspace/
task-item/
```

Interpretation:

* `global/`
  top-level surfaces such as the dashboard
* `project-portfolio/`
  project collection surfaces such as `/projects` and `/projects/new`
* `project-workspace/`
  project-scoped pages under `/projects/{projectId}`
* `task-workspace/`
  task-scoped pages under `/tasks/{taskId}`
* `task-item/`
  item-targeted execution and governance PRs opened from task-level desks
  it may also include DS-owned dataset, payload, and evaluation PRs when the work proves real execution usability rather than page composition

Boundary rule:

* `task-workspace/`
  documents whose page object is still `Task`
* `task-item/`
  documents whose primary operation target is `TaskItem`, even if entered from task-level tabs such as `Annotate`, `Judge`, `Review`, or `Dispute`

Naming rule:

* document names should match the workspace surface name as closely as possible
* avoid ambiguous names such as `page`, `surface`, or `portfolio` unless the hierarchy level is explicit

Read together with:

* `docs/design/product/workspace_surface_hierarchy.md`
