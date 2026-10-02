# F3 Plan — The AI's suggestion, the human's answer and the reviewer's correction stay separate

This is the story-level plan: what has to be true, in what order, and which roadmap group covers each
part. Every group is SCRUM-38, which the board places in the Mid-semester Break sprint for Hanchen
(`specs/roadmap.md`, "Also in the break sprint on the board"). It is one PR, on `CS57-Hanchen-scrum-38`,
started from `main` once PR #46 has merged. The commit-by-commit implementation goes in
[`docs/sandbox/Break/plans/plan-SCRUM-38.md`](../../sandbox/Break/plans/plan-SCRUM-38.md), which links back here.

**Before any code, on the first working day:**
- agree the authoritative-marker helper's signature with Yi (SCRUM-99);
- agree the schema order for the break: #46, then this story, then SCRUM-99.

## Group 1 — Data model and migration

1. Annotations gain:
   - the author's role: `annotator`, `reviewer` or `ai_model`;
   - the model's provider, name and version;
   - a link to the version this one was derived from, with the reason (`resubmission`,
     `reanswer_after_reopen`, `reviewer_correction`), from a list that can grow;
   - the authoritative marker, with a unique index per item limited to rows where it is true.
2. Existing SQLite databases gain the columns and the index through `migrate_db_schema()`, and existing
   rows are backfilled:
   - `created_by IS NULL` becomes the `ai_model` role, with the model taken from `metadata.ai`;
   - every other row becomes `annotator`;
   - PR #46's re-answers get their derivation link.

   PostgreSQL development databases are reset after the merge.

## Group 2 — One write path for versions

3. One module creates every version and maintains the links and `is_latest` together:
   - a superseding reason makes the earlier version not current;
   - a correction leaves it current;
   - nothing rewrites a version's content after it is written.
4. A resubmission within a round becomes a new version derived from the author's current one. A
   re-answer after a reopen (#46) goes through the same path, with its own reason.
5. The AI submission path (SCRUM-46) writes the role and the model. The one-AI-answer-per-item refusal
   becomes a named task-level rule. The data model accepts versions from two models.
6. The authoritative-marker helper:
   - marks one current version on an item;
   - refuses a second marker;
   - clears the marker when a reopen supersedes the round (#46's `reopen_task_item`).

   SCRUM-99's Accept calls it.

## Group 3 — Readers follow the role, not `created_by IS NULL`

7. `MACHINE_AUTHORED`, the human-submitter counts, the first-pass check, the AI batch lookups and the
   review queue's facts read the author's role. Once D3 lands, a reviewer's correction never counts as a
   submission.
8. The review states, approvals and rework marking are checked against the new resubmission path. A new
   version starts with no reviews, and the returned version keeps the review that returned it.

## Group 4 — API reads and export

9. `GET /annotations/{id}/history` returns the whole version chain, which today it does not. An
   item-level read returns every version, current or superseded. Both show role, model, derivation,
   round supersession (#46) and the marker, under the existing annotator independence rule.
10. The task export carries the same fields on every annotation it emits. Choosing the released value
    stays H4's.

## Group 5 — Seams for the stories that build on this

11. **SCRUM-99 (break):** Accept marks through the helper, and SCRUM-99 merges after this story.
12. **D3 (SCRUM-32, W9):** a correction is a `reviewer`-role version derived from the corrected one, with
    the `reviewer_correction` reason.
13. **H4 (SCRUM-37, W9):** selects the authoritative version through the same helper.
14. **F1 (SCRUM-98, W9):** its events point at version ids.
15. **F4 (SCRUM-40, W9):** shares one set of actor kinds.
16. **I4 (SCRUM-73, W10):** adds `revised_after_reveal` and its own record of what was revealed.
17. Each of these seams is written into ADR 009 and the design docs, so the W9 owners build on it rather
    than rediscover it.

## Group 6 — Tests

18. Each test below fails on the old behaviour where there is one:
    - two models annotate one item, and both versions survive;
    - a resubmission creates a new version derived from the returned one, which keeps its content and
      its review;
    - a re-answer after a reopen is linked with its reason;
    - a second authoritative marker on an item is refused by the database, on SQLite and PostgreSQL;
    - a reopen clears the marker;
    - existing AI rows read back with their model after the backfill;
    - the history read returns the whole chain;
    - an annotator who has not answered cannot read others' versions;
    - the SQLite migration adds the columns and the index and backfills the rows.
19. The existing suites for the review queue, approvals since submission, rework and the AI batch still
    pass, adjusted only where a test pinned an annotation id across a resubmission. Each adjustment is
    named in its commit.

## Group 7 — Docs Sync

20. **ADR 009:** every write is a version; author role and model; the derivation link and its reasons;
    the authoritative marker; the seams in Group 5. It builds on ADR 008.
21. **Data model docs:** `domain_model.md`, `domain_model_relations.md`, `db_schema_strategy.md` and
    `db_schema_blueprint.md`. The data model changes.
22. **`api_surfaces.md`:** the history read, the item versions read and the export fields.
23. **`workflow_states.md`:** only if what resubmission means changes on screen. Check, and record the
    answer in the PR.

## Group 8 — Verify

24. The backend suite passes on SQLite and on PostgreSQL. `npm run check` exits 0.
25. Walk through `validation.md` in the running app, on a reset PostgreSQL database.
26. Put the merge-day reset reminder and the helper's final signature in the PR description, for Yi and
    the W9 groups.
