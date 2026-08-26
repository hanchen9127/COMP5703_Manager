# GitHub Governance Pack

This document contains the proposed GitHub governance configuration for the capstone project.

Included:

* `.github/pull_request_template.md`
* `.github/workflows/ci.yml`
* `CODEOWNERS`
* `branch protection rules`
* issue templates
* project board structure

---

## `.github/pull_request_template.md`

```md
## Summary
- What problem does this PR solve?
- Why is this change needed now?

## Scope
- Module(s) affected:
- Milestone:
- Epic / Story / Task IDs:
- Requirement IDs:

## Change Type
- [ ] Feature
- [ ] Bug fix
- [ ] Refactor
- [ ] Test
- [ ] Documentation
- [ ] CI / tooling
- [ ] Schema / migration

## Architecture Impact
- Which architecture component or module boundary does this affect?
- Does this introduce any new dependency between modules?
- [ ] No architecture impact
- [ ] Minor architecture impact
- [ ] Significant architecture impact (explain below)

Architecture notes:

## Data / Schema Impact
- [ ] No schema changes
- [ ] Schema changes included
- [ ] Migration required

If schema changed, explain:
- tables affected:
- backward compatibility impact:
- rollout / migration notes:

## API / Contract Impact
- [ ] No API changes
- [ ] Internal API changed
- [ ] External API changed
- [ ] Integration contract changed

If yes, explain:

## Testing
- What was tested?
- How was it tested?
- What was not tested?

Checklist:
- [ ] Local tests pass
- [ ] CI passes
- [ ] Demo path tested
- [ ] Edge cases considered

## AI Review
Paste or link the required AI review summary.

- Architecture review completed: [ ] Yes [ ] No
- Submission readiness review completed: [ ] Yes [ ] No
- Code quality review completed: [ ] Yes [ ] No
- Design consistency review completed: [ ] Yes [ ] No

Top AI review issues found:
1.
2.
3.

Actions taken:

## Demo Impact
- Which demo scenario does this affect?
- Can this be shown in the current milestone demo?

## Risks / Known Limitations
- What could still break?
- Any mock / temporary logic left?

## Reviewer Notes
What should reviewers pay special attention to?
```

---

## `.github/workflows/ci.yml`

```yaml
name: CI

on:
  pull_request:
    branches: [develop, main]
  push:
    branches: [develop]

jobs:
  api-python:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/hej-api
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
          pip install pytest ruff black

      - name: Lint
        run: ruff check .

      - name: Format check
        run: black --check .

      - name: Run tests
        run: pytest -q || true

  web:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/hej-web
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: package-lock.json

      - name: Install dependencies
        run: |
          npm ci || npm install

      - name: Lint
        run: |
          if [ -f package.json ]; then npm run lint --if-present; else echo "No hej-web package.json"; fi

      - name: Test
        run: |
          if [ -f package.json ]; then npm test -- --runInBand --passWithNoTests || true; else echo "No hej-web package.json"; fi

  repo-structure:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Check forbidden filenames
        shell: bash
        run: |
          forbidden=$(find . -type f \( -name 'test2.py' -o -name 'prototype_final_v3.py' -o -name 'random_script.py' \))
          if [ -n "$forbidden" ]; then
            echo "Forbidden files found:"
            echo "$forbidden"
            exit 1
          fi

      - name: Check required top-level folders
        shell: bash
        run: |
          for d in apps packages infrastructure docs; do
            if [ ! -d "$d" ]; then
              echo "Missing required directory: $d"
              exit 1
            fi
          done
```

Notes:

* The `|| true` after tests is suitable only for early capstone setup while test coverage is still being established.
* Remove those once the team has stable tests.

---

## `CODEOWNERS`

```text
# Global defaults
* @project-lead @architecture-owner-1 @architecture-owner-2

# API core
/apps/hej-api/ @cs-a @architecture-owner-1
/apps/hej-api/app/api/routes/ @cs-a @architecture-owner-1
/apps/hej-api/app/domains/ @cs-b @architecture-owner-1
/apps/hej-api/app/integrations/ @cs-b @ds-c @architecture-owner-2

# Web
/apps/hej-web/app/ @cs-c @architecture-owner-1
/apps/hej-web/components/ @cs-c @architecture-owner-1
/apps/hej-web/lib/ @cs-a @architecture-owner-1

# Shared UI
/packages/ui/ @cs-c @architecture-owner-1

# Docs and design artifacts
/docs/ @project-lead @architecture-owner-1 @architecture-owner-2

# CI and repo governance
/.github/ @project-lead @architecture-owner-1
/CODEOWNERS @project-lead @architecture-owner-1
```

Replace placeholders like `@cs-a`, `@ds-b`, `@project-lead`, and `@architecture-owner-1` with actual GitHub usernames or team aliases.

---

## Branch Protection Rules

### `main`

* Require pull request before merging
* Require 2 approvals
* Dismiss stale approvals when new commits are pushed
* Require status checks to pass before merging
* Required status checks:

  * `api-python`
  * `web`
  * `repo-structure`
* Require branches to be up to date before merging
* Restrict who can push directly: maintainers only
* No force pushes
* No deletions

### `develop`

* Require pull request before merging
* Require 1 module-owner approval + 1 architecture-owner approval
* Require status checks to pass before merging
* Required status checks:

  * `api-python`
  * `web`
  * `repo-structure`
* No direct pushes except by project lead during emergency demo recovery
* No force pushes

### Branch Naming Convention

Use:

* `feature/<short-name>`
* `fix/<short-name>`
* `refactor/<short-name>`
* `docs/<short-name>`
* `chore/<short-name>`

Examples:

* `feature/task-api`
* `feature/llm-inference`
* `fix/dispute-state-transition`

---

## Issue Templates

### `.github/ISSUE_TEMPLATE/feature_request.md`

```md
---
name: Feature request
about: Implement a feature from the approved task tree
labels: feature
---

## Title

## Milestone

## Epic / Story / Task ID

## Requirement IDs

## Problem
What capability is missing?

## Expected Behavior
What should the system do?

## Scope
What is included?
What is explicitly excluded?

## Dependencies
Blocked by:
Blocks:

## Acceptance Criteria
- [ ]
- [ ]
- [ ]

## Notes
Architecture / integration notes if any.
```

### `.github/ISSUE_TEMPLATE/bug_report.md`

```md
---
name: Bug report
about: Report a defect in the platform, AI pipeline, or integration
labels: bug
---

## Title

## Affected Area
- [ ] API
- [ ] Web
- [ ] DS / AI assets
- [ ] Integration
- [ ] CI / Tooling

## Description
What is broken?

## Steps to Reproduce
1.
2.
3.

## Expected Behavior

## Actual Behavior

## Severity
- [ ] Low
- [ ] Medium
- [ ] High
- [ ] Critical

## Blocking?
- [ ] Yes
- [ ] No

## Logs / Screenshots / Output

## Suspected Cause (optional)
```

### `.github/ISSUE_TEMPLATE/architecture_change.md`

```md
---
name: Architecture change
about: Propose a change affecting module boundaries, schema, or contracts
labels: architecture
---

## Title

## Why is this change needed?

## Affected Modules
- [ ] apps/hej-api/app/api/routes
- [ ] apps/hej-api/app/domains
- [ ] apps/hej-api/app/integrations
- [ ] apps/hej-web
- [ ] packages/ui
- [ ] integration contract
- [ ] schema

## Current Design

## Proposed Change

## Risks

## Alternative Considered

## Impact on Existing Milestones

## Requires ADR?
- [ ] Yes
- [ ] No
```

### `.github/ISSUE_TEMPLATE/tech_debt.md`

```md
---
name: Technical debt
about: Record cleanup or refactor work that should not be forgotten
labels: tech-debt
---

## Title

## Debt Description

## Why does it exist?

## Risk if left unresolved

## Suggested Fix

## Priority
- [ ] Low
- [ ] Medium
- [ ] High

## Can this wait until after current milestone?
- [ ] Yes
- [ ] No
```

---

## Project Board Structure

Use one board for the entire project, grouped by milestone and tagged by team.

### Recommended Columns

* `Backlog`
* `Ready`
* `In Progress`
* `In Review`
* `Blocked`
* `Ready for Demo`
* `Done`

### Required Labels

#### Team Labels

* `team:cs-a`
* `team:cs-b`
* `team:cs-c`
* `team:ds-a`
* `team:ds-b`
* `team:ds-c`
* `team:integration`

#### Type Labels

* `feature`
* `bug`
* `refactor`
* `docs`
* `architecture`
* `tech-debt`
* `ci`

#### Milestone Labels

* `m1`
* `m2`
* `m3`
* `m4`
* `m5`
* `m6`
* `m7`
* `m8`

#### Risk Labels

* `risk:low`
* `risk:medium`
* `risk:high`
* `risk:critical`

### Suggested Work Item Fields

Every issue should include:

* Milestone
* Epic / Story / Task ID
* Requirement IDs
* Team owner
* Blocked-by / Blocks
* Acceptance Criteria

### Board Usage Rules

1. No issue goes directly from `Backlog` to `Done`.
2. Any issue in `In Review` must have an open PR.
3. Any issue in `Blocked` must include blocker details.
4. Only demo-ready items move to `Ready for Demo`.
5. `Done` means merged to `develop`, CI passed, and acceptance criteria met.

---

## Suggested Operating Rules

### PR Rules

* Small PRs only, preferably under ~400 lines changed
* One PR should map to one story slice or small set of tightly related tasks
* Every PR must link issue IDs and milestone

### Review Rules

* At least one module owner review
* At least one architecture owner review for anything affecting structure, schema, or integration

### Freeze Rules

* 48 hours before milestone review: code freeze
* During freeze: bug fixes only

### Demo Rules

* Every milestone must have a browser-based or visible API demo
* If AI integration fails, fallback to mock predictions
* If platform integration fails, DS can still demo standalone AI output

---

## Recommended Team Placeholders

Replace these placeholders with real GitHub usernames or teams:

* `@project-lead`
* `@architecture-owner-1`
* `@architecture-owner-2`
* `@cs-a`
* `@cs-b`
* `@cs-c`
* `@ds-a`
* `@ds-b`
* `@ds-c`

---

## Adoption Order

1. Add PR template
2. Add issue templates
3. Add `ci.yml`
4. Add `CODEOWNERS`
5. Protect `main` and `develop`
6. Create project board
7. Create labels
8. Train students on workflow before first major merge
