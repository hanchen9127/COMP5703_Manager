# PR — SCRUM-25: draft ownership

**Base:** `main` ← **Compare:** `CS57-Hanchen-ai-integration` · **Reviewer:** Jingwei

## Title

```
SCRUM-25: draft ownership — an unfinished draft belongs to its author
```

## Description

```markdown
Closes SCRUM-25 (story D6, issue #6).

## Problem
Any active org member could edit, delete or submit another annotator's unfinished
draft. Draft access checked org/project membership, never authorship.

## Changes
- **Backend:** `update`, `delete` and `submit` require the caller to be the draft's
  author (`verify_user_owns_draft`). `get_draft` and `approve_draft` are unchanged,
  since reviewers work on other people's drafts.
- **Claim on first write:** drafts with no author (the intake placeholder, AI
  pre-annotations) are claimed by whoever writes to them first. This also gives the
  resulting annotation a real author. Before, it was `NULL`, so
  `assert_not_self_approval` never matched anyone.
- **AI drafts (`871d2d1`):** PR #8 created AI drafts owned by the operator who ran
  intake, which would have locked annotators out of AI-assisted items. They are now
  unowned; the operator is kept in `metadata.ai.triggered_by`.
- **Frontend:** the annotate and review pages pick the viewer's own draft, then an
  unclaimed one. Anyone else's draft is shown read-only, with its author named, and
  all annotate-tab editors are disabled. `viewerId` is a required argument.
- **Docs:** `api_surfaces.md` and `workflow_states.md`.

## Decision
No admin or reviewer override on draft edits (D6 criterion 3). Adding one later
would need its own capability and an audit entry.

## Known limitations
- Drafts created before this change have no author, so two annotators can both see
  one as claimable. The API still refuses whoever writes second.
- Items that already have both an ownerless and an owned annotation are still
  ambiguous for review (issue #3/#4, SCRUM-27).

## Testing
- Backend 206 passed, including 12 draft-ownership and 7 AI-draft tests.
  3 of the AI-draft tests fail on the old code.
- Web 150 passed; `tsc` clean; `next build` succeeds.
- Manually verified with two annotators.

## Notes for review
- Merges `main` (PR #8, PR #10). Conflicts were in hej-web only; both sides kept.
  The merge commit lists how each was resolved.
- `0508bc3` is identical to main's `0d34ff6` and adds no net diff.
- `use-hydrated-task-items.ts` is unused but kept on purpose as a ready hook.
```
