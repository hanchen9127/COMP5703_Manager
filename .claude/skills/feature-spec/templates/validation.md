# <STORY-ID> Validation — <Story name>

## Definition of Done

All of the following must be true before the story is logged as complete in the contribution tracker.

### 1. Acceptance criteria hold in the running app

<One check per acceptance criterion: who does what, and the expected result. Multi-user checks use two
browsers. Point to the manual walkthrough, e.g. `docs/sandbox/W<n>/tests/manual-test-<ticket>.md`.>

### 2. Checks pass

```
npm run check
```

Must exit 0 — backend tests, web tests, typecheck and lint.

### 3. Defects are proven fixed

<For each defect: the test that covers it, confirmed red against the old behaviour. Write "No catalogued
defects" when there are none.>

### 4. Docs updated in the same change

<The `hej/docs` files this story changes, per Docs Sync.>

### 5. Reviewed by someone other than the author

The reviewer is named on the PR and in the contribution tracker.

### 6. Recorded

- PR logged in the contribution tracker with *Story complete? = Yes*
- SCRUM tickets moved to Done on the board
- `specs/roadmap.md` row marked ✅ and `tracking-sync` run

## Not Required

- <Checks that deliberately do not apply to this story, with the reason>
