# F3 Validation — The AI's suggestion, the human's answer and the reviewer's correction stay separate

## Definition of Done

All of the following must be true before the story is logged as complete in the contribution tracker.

### 1. Acceptance criteria hold in the running app

The walkthrough is in `docs/sandbox/Break/tests/manual-test-SCRUM-38.md`. Run it on a PostgreSQL
database reset at the merge commit, using two browsers for the annotator and reviewer steps.

1. **Every output is retrievable on its own (criterion 1).** On an AI-assisted task, run the AI on an
   item, then have an annotator answer on a human task item. The item-level versions read lists:
   - the AI output, with role `ai_model` and its provider, model and version;
   - each annotator answer, with role `annotator` and its author;
   - each version with its own time.
2. **A resubmission does not overwrite (criterion 2).**
   - A reviewer returns an annotator's answer with feedback, and the annotator resubmits.
   - The returned version is unchanged, is no longer current, and still carries the review that
     returned it.
   - The new version is current, with no reviews, and is derived from the returned one with reason
     `resubmission`.
   - `GET /annotations/{id}/history` on either version returns both.
3. **A re-answer after a reopen is linked.** The project owner reopens a finalised item, and an earlier
   annotator answers again. The new version is derived from their superseded one with reason
   `reanswer_after_reopen`. The superseded one still names the reopen (#46).
4. **At most one authoritative version.**
   - Marking one current version through the helper succeeds.
   - Marking a second on the same item is refused.
   - A reopen leaves the item with no authoritative version.
5. **The export shows authority and supersession (criterion 3).** The task export carries, on each
   annotation: role, model, derivation link and reason, round supersession, and the marker.
6. **Independence is kept.** An annotator who has not answered on the item is refused other people's
   versions on the history read and the item-level read.
7. **No regression in review.** In the web app:
   - the review queue offers the resubmitted version, not the returned one;
   - a reviewer's decision lands on that version;
   - the annotator's rework view still shows their latest answer.

### 2. Checks pass

```
npm run check
```

Must exit 0: backend tests, web tests, typecheck and lint. The backend suite must also pass on
PostgreSQL:

```
DATABASE_URL=postgresql+psycopg://<user>:<password>@localhost:<port>/<db> pytest -q   # from apps/hej-api
```

CI's `postgresql` and `sqlite` jobs are green on the PR.

### 3. Defects are proven fixed

Issues 4 and 5 close with H4 and D3, not with this story. This story's part is proven by tests that
fail against `main` before it:
- **Issue 5:** a resubmission leaves the earlier version unchanged and linked. A correction will land
  the same way.
- **Issue 4:** a second authoritative marker on an item is refused, on both databases.
- **Found in the backlog:** `GET /annotations/{id}/history` returns the whole chain, not a single row.

### 4. Docs updated in the same change

- `hej/docs/adr/adr009_*.md`
- `domain_model.md`, `domain_model_relations.md`, `db_schema_strategy.md`, `db_schema_blueprint.md`
- `api_surfaces.md`
- `workflow_states.md`, only if on-screen resubmission semantics change. The PR says which.

### 5. Reviewed by someone other than the author

The reviewer is named on the PR and in the contribution tracker. Yi should review, or at least comment,
because SCRUM-99 builds on the helper.

### 6. Recorded

- PR logged in the contribution tracker with *Story complete? = Yes*
- SCRUM-38 moved to Done on the board
- Merged to `origin/main`, then the story marked ✅ in `specs/roadmap.md` and `tracking-sync` run
- Merge-day reminder sent: PostgreSQL development databases need `init_data.py --reset`

## Not Required

- **Choosing the authoritative version for items finalised without a dispute, and what a release
  carries.** That is H4 (SCRUM-37, W9).
- **The reviewer's correction write path.** That is D3 (SCRUM-32, W9). This story is tested with
  annotator and AI versions, and the `reviewer` role is covered only by the model and the backfill.
- **A multi-model experiment setting and blind-then-reveal.** Those are I4 (SCRUM-73, W10).
- **New web screens.** The story is backend only, and the web is checked for regressions only (check 1.7).
- **Provenance events.** Those are F1 (SCRUM-98, W9).
