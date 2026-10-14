# Review — PR #65, `CS57-KANISHKA` (SCRUM-102, H1: create an immutable release artefact)

**Posted 2026-10-14 by hanchen9127 as a comment, not a review**
([issuecomment-6163362452](https://github.com/USYD-CS-Capstone/hej/pull/65#issuecomment-6163362452)), at
`d862476`. Hanchen decided that **Jingwei is the formal reviewer**: he requests changes, approves and merges. The
posted text is this file from "Verdict" to "Checked locally", with two changes: "Verdict: Request changes" became
"A comment, not a formal review: @Jingwei-Lin is reviewing this PR and decides…", and "need fixing" became "I'd
fix". The "Not for the PR" section was not posted.

**On GitHub (checked 2026-10-14):** open, base `main`, head `d862476`, 3 commits, 11 files, +778. Review requested
from hanchen9127. No comments or reviews yet. Mergeable. Its last merge of `main` is `41028db` (#48, 12 Oct); a
trial merge with today's `main` (`f6f8eb0`, after #71) is clean.

**Verdict: Request changes.** The core is right and small:

- one `releases` row per release;
- only versions marked `is_authoritative` are frozen;
- the JSONL is written once, with its SHA-256;
- downloads return the stored bytes;
- creation and download are gated on `RELEASE`, like the export route.

Three things need fixing before merge:

1. A release can be deleted with its task.
2. The project Exports screen labels a release as a draft export.
3. The casebook case waiting for H1 (EV-017) isn't run.

---

## Checked against the ticket

| SCRUM-102 asks | In the PR |
| --- | --- |
| A release belongs to a task, created by someone with the export capability, recording who and when | ✅ `POST /tasks/{id}/releases` on `RELEASE`; `created_by` and `created_at` |
| Freezes, per item, the authoritative value SCRUM-37 selects, and nothing for an item without one | ✅ It reads the `is_authoritative` marker, which is H4's interface, without re-deriving it. An unresolved item contributes no line |
| JSONL written once, served by id, the same bytes twice, checked by a stored hash | ✅ `artefact_jsonl` and `artefact_sha256`; the download sends `X-Artefact-SHA256`; sorted keys and compact separators make the bytes deterministic |
| The project export list shows real releases beside the derived packages | ✅ in the API. ⚠️ On screen, see point 2 |
| Tests: an edit after a release changes nothing; two releases have different ids | ✅ Both, plus repeated downloads, an empty release, 404, and the export list |
| F1's "released" event | Left as a marked seam in `create_release`, in the same transaction, for SCRUM-98. Correct, since F1 isn't merged |
| The gate (H3) and the manifest (H2) | Out of scope, as the description says. A zero-line release is allowed until H3 |

---

## Required changes

### 1. A release must not be deleted with its task

`TaskDB.releases` is declared with `cascade="all, delete-orphan"`, so deleting a task deletes its releases.
`delete_task` refuses a task that has items, but not a task that has releases, and nothing stops a release on a
task with no items.

Checked with a probe:

1. Create a draft task with no items.
2. Create a release on it (a zero-line release).
3. `TaskService.delete_task` returns `True`.
4. The release row is gone.

An immutable release should only ever go by an explicit decision, if at all. Please:

- drop the cascade from the relationship;
- have `delete_task` refuse a task that has releases with 409, the same way it refuses a task with items;
- add a test.

That also keeps SCRUM-45 (J4, W10) safe: "archiving a project never changes a release".

### 2. The project Exports screen shows a release as a draft export

`ProjectExportsService` now returns releases with `status="released"`, `export_scope="frozen_snapshot"` and
`destination="release://<id>"`. The web hasn't been told about them:

- `ApiExportPackage.export_scope` in `apps/hej-web/lib/api/exports.ts` allows only
  `"current_finalized" | "full_project"`;
- `exportScopeLabel` in `project-export-table.tsx` falls through to **"Draft task export"**;
- every row says **"Staged task export package"**.

So once a release exists, the Exports tab shows the frozen release as a draft export: exactly what it isn't.

The release screens are H6's (SCRUM-108), but this list is already on screen. Please:

- add `"frozen_snapshot"` to the type;
- give it its own label and sub-label, for example "Release" and "Frozen release, N items";
- give `released` a status colour;
- add a test for the row.

Hiding releases from this list until H6 would also do, but labelling them is the smaller change.

### 3. Run EV-017: H1's case in the casebook

EV-017 ("After a reopen, a release carries only the item's current answer, the old one as history") is skipped with
"Waits for releases, H1 (SCRUM-102)". Its `release` step is already declared in the harness as a planned step.

With #71 merged, SCRUM-71's rule applies: every W9 feature ticket lands its own cases as part of its Definition of
Done. Please:

- implement `_do_release` in `evaluation/harness/driver.py`:
  - create the release as the step's actor;
  - download it;
  - read each JSONL line as an item that is authoritative, with its `value` as the answer, so the case's
    `expect.items` and `[outcome]` read as they do for `export`;
- remove `release` from the planned steps;
- un-skip EV-017;
- regenerate the baseline.

Jingwei owns the harness and knows the export step it mirrors. Ask him if the step's shape isn't obvious.

---

## Smaller points (not blocking)

4. **Agreement with H4's export.** Reading the `is_authoritative` marker directly is the right interface, and it
   keeps #65 independent of #66. Once #66 merges, a test that a release's `value` for an item equals the
   export's authoritative answer would catch the two drifting apart.
5. **Releasing a draft or paused task.** Creation doesn't look at task state, so a draft task can be released, with
   zero lines. That belongs to H3's gate (SCRUM-105), and is fine to leave there. Mention it on SCRUM-105 so it
   isn't lost.

---

## Checked locally (head `d862476`)

- **Trial merge with `origin/main` `f6f8eb0`:** clean. Backend (SQLite) 1,775 passed, 19 skipped, 207 subtests.
- **Probe for point 1:** written and deleted afterwards.
- **Not run:** PostgreSQL; the web suite (the PR changes no web files).

---

## Not for the PR (Hanchen)

- In the #66 review I said #65 should read `authoritative_answer` from #66's export shape. On reading #65, the
  marker is the better interface (point 4), so drop that suggestion. A cross-check test after #66 merges is enough.
- W9 board: SCRUM-102 is In Review. If this round takes more than a day, it's W9 carry-over.
