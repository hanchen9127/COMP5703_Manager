# Review — PR #84, `CS57-Michael-scrum-104-release-manifest` (SCRUM-104, H2: the release manifest)

<https://github.com/USYD-CS-Capstone/hej/pull/84> · reviewed 2026-10-19 at `ea4a7b4` (4 commits, base `CS57-Michael-scrum-105-release-gate` = #83 at `c2b3a18`)

**Posted 2026-10-19 06:07 UTC as Approve** on `ea4a7b4` (everything from "Verdict" down, unchanged). Read from
GitHub first: open, ready for review, review requested from Hanchen, no comments or reviews, `MERGEABLE` against its
base. Stacked on #83; Michael retargets it to `main` once #83 merges. CI cannot run
(GitHub Actions billing).

Prior context read: roadmap W10 group 2 (H2), client answers R2-2 and R2-5 (`info/client-question.md`,
`info/client-qa.md`), ADR 021, and the review of #83 (`review-cs57-michael-scrum-105-pr83-release-gate.md`).

## Verdict: approve, merged after #83

The manifest meets the client's release-level minimum in R2-5. It also does what H2 adds: it is written only once
the gate has passed, in the same transaction as the release, and it can be checked without the platform. The
self-review found and fixed a real bug (U+2028 inside an answer broke release creation). The points below do not
block the merge.

## Checked

| Check | Result |
| --- | --- |
| Worktree `D:\COMP5703_Capstone\hej-review-84` at `ea4a7b4` | `main` checkout untouched |
| SQLite, full suite | ✅ 2,159 passed, 18 skipped, 209 subtests (matches the PR) |
| Casebook, `--baseline --exact` | ✅ 66/66 passed, 5 skipped, 71 unchanged |
| PostgreSQL, manifest, release, gate, route, delete-policy and withheld-route suites | ✅ 80 passed |
| PostgreSQL, full suite (in the compose `backend` container, worktree mounted) | ✅ 2,171 passed, 6 skipped, 209 subtests |
| Review-only scenario: an expert accepts a reviewer's correction (SCRUM-124), then a release | ✅ The manifest's item names the correction; the hashed line carries `authoritative_cause = adjudication_accept`; `verify()` returns no problem |
| Review-only scenario: Expert Gate, the expert confirms, then a release | ✅ `version` 1; `verify()` passes; one changed byte in the artefact fails it |
| Artefact split `artefact_text.split("\n")[:-1]` | ✅ Safe: every line is written with a trailing `\n`, so the last element is always empty |
| Lock order: items (#83), then the task row for the version | ✅ The only other writer that locks the task row, a guideline edit, takes no item lock afterwards, so the two orders cannot deadlock |

The two review-only scenarios were a scratch test file in the worktree, not committed.

## Against R2-5 (release level) and H2

| Asked | At `ea4a7b4` |
| --- | --- |
| Release id and version | ✅ `release.id`, and a per-task `version` (1, 2, 3…) with a unique key |
| Included items | ✅ Every item of the task, in dataset order, with counts by resolution |
| The resolution selected for each item | ✅ `authoritative` with `annotation_id` and `annotation_version`, or `ambiguous` with no value; the way it became authoritative is in the hashed line |
| Task, guideline and policy versions | ✅ In force at release (`task`), and those the answers followed (`versions_covered`, per item) |
| Producer, counts, per-item provenance pointers (H2) | ✅ `created_by`, `item_count`, `resolutions`, each item's F1 event ids and its `released` event |
| Written only after the gate passes; never changed | ✅ Built after `record_release`, in the same transaction; no update path |
| Checkable without the platform | ✅ The five-step recipe in `api_surfaces.md`, and `release_manifest.verify()` as the same steps in code |

It also persists the gate's warnings (`gate_warnings`). #83 returns them only on the 201, so the manifest is
where a release keeps them.

## Should fix (not blocking)

### 1. Coordinate EV-101 with #79 (Jingwei, SCRUM-74)

This PR changes EV-101's skip reason to "waits for a casebook step to read an item's provenance back". #79 adds
that step (`verify`), and #79's EV-101 already ends with it. Same as for #83: whichever of #79 and this PR merges
second enables EV-101, and regenerates the baseline with `--update-baseline`.

### 2. Take each item's source version from its answer, not from the data pointer

H2's first criterion asks for "the guideline and source versions covered". Each item's `guideline_version` and
`policy_version` come from the authoritative answer, which records what it followed (#63). Its
`source_version_ref` comes from the item's data pointer, which is the version now. Once a source changes after
annotation (EV-018), the manifest would name the new source version for an answer made against the old one.
`AnnotationDB.source_version_ref` already holds the version the answer followed. Use it for an `authoritative`
item, and keep the pointer's value for an `ambiguous` one, which has no answer.

Found in the dry run of the manual walkthrough (19 Oct, seeded task A3). There, `versions_covered.source` is `[]`,
because `dataset-registration` writes a source version only when the request sends one, and the seed sends none.
Upload intake writes `"v1"`. That is expected, not a defect, but it is why the walkthrough could not show this
criterion with real values.

## Nits

- **Name the cause in the manifest, not only in the line.** `authoritative_cause` (`canonical_rule`,
  `adjudication_accept`, `reconciliation_choose`) is inside the hashed artefact line, so it can be checked. Copying
  it into each manifest item would let someone reading only the manifest see how each answer was chosen. R2-5 asks
  for "which resolution/version was selected for each item".
- **`db.rollback()` inside `create_release`.** The service otherwise never ends the caller's transaction. Here the
  rollback on a version collision (SQLite only) is harmless, because nothing else was written in the request, but a
  comment saying so would stop someone copying the pattern into a route that writes more first.
