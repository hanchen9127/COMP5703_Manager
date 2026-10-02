# F3 Requirements — The AI's suggestion, the human's answer and the reviewer's correction stay separate

**Story:** F3 · P0 · Epic F — Provenance
**Tickets:** SCRUM-38 · **Defects:** 4 and 5 (in part; see Context) · **Owners:** Hanchen
**Target week:** Mid-semester break, 1–7 Oct (`specs/roadmap.md`, "Also in the break sprint") ·
**Working branch:** `CS57-Hanchen-scrum-38`, from `main` once PR #46 (SCRUM-110) has merged. Hanchen creates it.

## Scope

**Every output is its own record, and nothing rewrites one after it is written.** The AI's output, each
annotator's answer, each resubmission, an answer given again after a reopen, and (from D3) a reviewer's
correction are separate annotation rows. Each row has its author, its time and its content, and the
content is never changed. Today a resubmission within a round rewrites the author's row in place
(`DraftService._create_annotation_from_draft`). That loses what the reviewer actually returned, while
the review still points at the row. This changes too: a resubmission becomes a new version
(story criteria 1 and 2; client answer R2-2, "do not flatten the history").

**Each version says who produced it.** It records:
- the author's role: an annotator, a reviewer or an AI model;
- for machine output, which model produced it (provider, model, version), as a recorded field rather
  than a note (R2-5).

No user account is invented for the AI. Existing rows read correctly: `created_by IS NULL` reads as the
AI, with the model taken from `annotation_data.metadata.ai`. Two models can annotate the same item
without overwriting each other.

**Supersession is visible.** A version can name the version it was derived from and why: a
resubmission, an answer given again after a reopen, or a reviewer's correction. The list of reasons
can grow. Where the reason supersedes the earlier version, the earlier one stops being current
(`is_latest`) and is otherwise left exactly as it was. PR #46's link from each annotation to the reopen
that closed its round stays as it is: that link is per round, this one is per version.

**At most one version per item is authoritative.** The database enforces this, and one write path
sets and clears the marker. This story provides the marker, the invariant and the helper. The
adjudication's Accept (SCRUM-99) is the first caller; H4 (SCRUM-37, W9) adds the rule for items
finalised without a dispute. A reopen clears the marker. An item resolved as ambiguous has none.

**An item's versions can be read back** with role, model, derivation links, round supersession and the
authoritative marker. They are read through the annotation history and an item-level read, and in the
task export. Story criterion 3 is met in this sense: the export says which version is authoritative and
what each version superseded. Choosing the released value is H4's. These reads keep the annotator
independence rule that already applies: an annotator who has not answered does not see other answers.

## Out of Scope

- **Choosing which version is authoritative** for an item finalised without a dispute, and what a release
  carries: H4 (SCRUM-37, W9). Closes issue 4.
- **Writing a reviewer's correction:** D3 (SCRUM-32, W9). This story only gives the correction a place
  to land, as a version with the reviewer role derived from the version it corrects. Closes issue 5
  with D3.
- **Provenance events** pointing at these versions: F1 (SCRUM-98, W9).
- **The item timeline screen:** F5 (SCRUM-106, W10).
- **Who may resubmit, and when:** SCRUM-117 (break, Hanchen), built on this story's resubmission path.
- **A task setting for a multi-model experiment, and blind-then-reveal:** I4 (SCRUM-73, W10). This
  includes the record of which AI output was revealed to whom and when. This story only keeps the data
  model open to them (see Decisions).
- **The audit history's actor kind:** F4 (SCRUM-40/41, W9). One set of kinds is agreed with it.
- **A new web screen.** The story is backend only. The web is checked for regressions, because
  annotation ids now change on every resubmission.

## Decisions

### Every write is a new version (Hanchen, 2026-10-02)

Resubmission within a round becomes a new row derived from the previous one, as a reopen re-answer
already is under PR #46.
- **Rejected: rewriting in place and keeping a snapshot table.** It keeps ids stable, but it gives two
  supersession mechanisms that F1 and F5 would both have to read.
- **Rejected: leaving it for later.** That would meet criterion 2 only for corrections.

Consequences:
- Approvals already belong to a row, so a new version starts with none. PR #35's "approvals since it was
  last submitted" holds by construction, and `submitted_at` stays as the submission time.
- Review targets, the review queue and `draft.annotation_id` already follow the current row.

### The author's role and model are columns; the marker is a partial unique index (Hanchen, 2026-10-02)

Each annotation records:
- `author_role`: `annotator`, `reviewer` or `ai_model`;
- the model's provider, name and version, filled for `ai_model` and backfilled from `metadata.ai`.

The model's provider, name and version are in columns so that the export and release can read them.
`metadata.ai` stays the record of the run. `created_by` stays a foreign key to `users`, NULL for machine
output. The ticket asked for an author *kind*; a role was chosen because it also tells a reviewer's
correction from an annotator's answer, which counting must exclude once D3 lands.

The authoritative marker is a boolean with a unique index on `task_item_id` limited to rows where it is
true. SQLite and PostgreSQL both support this. A marked version must be current.

Alternatives considered:
- **A separate model table, with the marker on the item.** Rejected: more schema, and the marker would
  live on the item row, which PR #46 also changes.
- **Moving AI output into the unused `ai_predictions` table.** Rejected: it reverses SCRUM-46 (the
  client's answer of 17 Sep that AI output is a submission authored by the model), and splits AI
  output across two tables.

### The data model stays open to blind-then-reveal (Hanchen, 2026-10-02)

I4's protocol needs four things, and each fits on top of this story without changing it:
- a stored AI output, identified by its model: `author_role = ai_model`;
- a blind human answer before the reveal: an annotator version;
- a revision after the reveal: a new derivation reason, such as `revised_after_reveal`, on the same link;
- a record of which output was revealed to whom and when: a new table, owned by I4.

Whether an AI row is a first-pass submission or a suggestion follows the item's production mode,
which C4 (SCRUM-87, W9) records.

### One authoritative-marker helper, called by SCRUM-99 (Hanchen, 2026-10-02)

SCRUM-99's Accept marks the version it selects through this story's helper. H4 does not set it later.
- **Rejected: H4 sets every marker in W9**, with SCRUM-99 recording only its choice.
- **Rejected: marking on canonicalisation now.** Which of several approved answers counts waits on
  issue #40.

**The helper's signature is agreed with Yi on the first working day.** Yi builds against it, and
SCRUM-99 merges after this story.

### One pull request (Hanchen, 2026-10-02)

The whole story merges as one PR. It is not split into a schema-and-helper PR and a resubmission PR.
SCRUM-99 therefore waits for all of it; see Risks.

### The one-AI-answer-per-item refusal becomes a named task-level rule

AI lookups move from `created_by IS NULL` to the role and model. SCRUM-46's refusal of a second AI
answer stays the default, now as one rule function at the task level rather than a limit of the data
model (R1-4: "unless the task explicitly defines a multi-model experiment"). The setting that would
allow more than one is I4's.

## Context

**Pillar: Provenance.** The mission's goal is that a released dataset can answer, for any item, *how did
this label get here*. Without separate, unrewritten versions that question has no evidence behind it.

What exists, checked on `origin/main` and PR #46's head `ce951c3` (2026-10-02):
- `annotations` has `version`, `base_annotation_id` (the version group's root) and `is_latest`.
  Until PR #46, nothing ever created a second version: `version` was hard-coded to 1.
- An AI answer is identified only by `created_by IS NULL`: `MACHINE_AUTHORED` in
  `app/services/submission_rules.py`, and in `ai_batch_service.py`. The model lives in
  `annotation_data.metadata.ai`.
- A resubmission rewrites the author's current row (`_create_annotation_from_draft`).
- PR #46 (SCRUM-110) adds `task_item_reopens`, `superseded_by_reopen_id` and `superseded_at`, and makes
  an answer given again after a reopen a new version (`version + 1` in the same group). ADR 008 records
  that this story builds version-level supersession and the marker on top, as agreed with Jingwei.
- `GET /annotations/{id}/history` claims to return every version, but `list_all_versions` filters on
  the row's own id, so it returns one row.
- `ai_predictions` (`AiPredictionDB`) exists but nothing reads or writes it.

**Defects.**
- **Issue 5** (reviewer corrections not saved) closes with D3. This story is the half that keeps the
  original when the correction lands.
- **Issue 4** (a finalised item exports conflicting answers) closes with H4. This story supplies the
  marker it needs.

**Depends on:**
- D4 (done, PR #34);
- PR #45 (SCRUM-116, approved) and PR #46 (SCRUM-110, changes requested on 2026-10-02). This story
  changes the same files, so it starts from `main` after #46.

**Unblocks:**
- in the break: SCRUM-99 (Accept marks the authoritative version) and SCRUM-117 (resubmission rules);
- in W9: F1 (events point at versions), D3 (corrections land as versions), H4 (selects the marker) and
  C4 (the mode is read beside the role);
- in W10: F5 (the timeline) and I4 (blind-then-reveal).

**Risks.**
- **Time.** One PR in a five-day week that starts once #46 merges, with SCRUM-99 waiting on it. If it
  is not merged by 7 Oct, W9's day-one schema order (F1, F2, D3, C4) starts without it.
- **Changing the resubmission path** touches several things built on the old behaviour:
  - PR #35's rules;
  - SCRUM-109's state/history test (Parth);
  - SCRUM-117;
  - any harness case (#39) or seed that keeps an annotation id across a resubmission.
- **PostgreSQL development databases** need `init_data.py --reset` after the merge (SCRUM-94 rule).
  Remind the team on merge day.

## Stakeholder Notes

- **Client (Arc Intelligence):** every AI output, answer and resubmission stays visible with its author
  and model. Each item carries at most one authoritative version, and the export shows it with what it
  superseded. R2-2: "release output = authoritative resolution, release provenance = complete
  judgement history".
- **Annotator:** nothing visible changes. A resubmission no longer replaces what the reviewer saw.
- **Reviewer:** reviews the current version. An approval given to an earlier version does not carry
  over to the next one, as today.
- **Expert/adjudicator:** Accept marks one existing version as authoritative (SCRUM-99).
- **Project manager:** the export now shows each version's role, model, derivation and authoritative
  marker.
- **Team:**
  - Yi agrees the helper's signature with Hanchen and builds SCRUM-99 against it;
  - Jingwei's #46 merges first;
  - Parth's SCRUM-109 and SCRUM-51 read current versions;
  - the W9 groups agree their schema order with this story's columns already in place.
