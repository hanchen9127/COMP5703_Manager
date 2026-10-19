# Review — PR #85, `CS57-Yi-scrum-106` (SCRUM-106, F5: a finalised item's production history on one screen)

<https://github.com/USYD-CS-Capstone/hej/pull/85> · reviewed 2026-10-19 at `da667b8` (7 commits; `main` at `1191dc7` merged in)

**Posted 2026-10-19 as Approve** on `da667b8` (everything from "Verdict" down, unchanged). Read from GitHub first:
open, ready, `MERGEABLE`, no reviewer requested, no comments or reviews.
#86 (SCRUM-108, H6, draft) is stacked on this branch. CI cannot run (GitHub Actions billing).

Prior context read:
- story F5 in `shared/story_src.csv`;
- client answer R2-5;
- ADR 015 (F1);
- the Expert Gate plan for Yi (`sandbox/W10/msg/2026-10-15-scrum-118-expert-gate-plan-for-Yi.md`), which said F5 would tell a
  gate confirmation from a choice.

## Verdict: approve

The graph reads only what F1 recorded and the annotation versions. It names every actor as a person, an AI model
(provider, name and version) or the platform, and draws rounds, forks, merges and the resolution in one ordered
list. It has no new backend field beyond `base_annotation_id` and no schema change. The model is a pure function
with 20 cases, and every result below passed.

**Scope, decided by Hanchen on 2026-10-19.** F5's third criterion asked that a reviewer reach the history from the
review screen before deciding. This PR shows it only for finalised items, from the Finalized page, to task owners
and admins. That narrowing is accepted as the team's design, for two reasons:
- R2-5 asks that a released item can be traced back completely, which this does.
- A reviewer must not see colleagues' verdicts while a blind round is open (D7), so a reviewer's graph would be
  thinned or would break the blind.

Story F5 in `story_src.csv` has been rewritten to match. Please update SCRUM-106's Jira text as the PR says.

## Checked

| Check | Result |
| --- | --- |
| Worktree `D:\COMP5703_Capstone\hej-review-85` at `da667b8`, current `main` (`8c0b87c`: #83, #84, #77) merged in locally, no conflicts | `main` checkout untouched |
| SQLite, full suite, on that merge | ✅ 2,260 passed, 19 skipped, 209 subtests |
| Casebook `--baseline --exact`, on that merge | ✅ 72 unchanged, no regression |
| Web tests, on that merge (`npm ci` in the worktree) | ✅ 69 files, 675 tests |
| `typecheck:web` | ✅ clean |
| PostgreSQL | Not run here. The backend change is one optional field on a read schema; the PR ran the four affected suites on PostgreSQL (107 passed) |
| Earlier rounds' resolution read from `authoritative_by/at/cause` | ✅ `clear_authoritative` (reopen, reconciliation Return) clears only `is_authoritative`, by design, so those fields survive |
| Expert Gate told apart from a choice | ✅ The reconciliation's `disputed` event carries `details.reason = trigger_type` (`item_reconciliation_service.py:249`), which the model reads |
| Times shown | ✅ Events and `authoritative_at` are UTC-aware, and the drawing formats through `parseApiUtcDatetime` |

## Nits (not blocking)

1. **The note "seeded items have no graph" is no longer true.** The seed stages its items through the API's own
   routes, which write F1's events. On 19 Oct, seeded `a3-05-finalised` read back `source_registered`,
   `item_taken`, `human_responded` and `reviewed`. Drop the note, or say which seeded items do have a graph, since
   the manual walkthrough and the demo will use them.
2. **`time()` in `lib/item-timeline.ts` uses `Date.parse`.** For an annotation's naive `created_at`, that reads
   local time. The only place it matters is `roundOfVersion`'s fallback, for a version with no submission event
   and no reopen link, so in practice only pre-F1 data. Using `parseApiUtcDatetime`, as the drawing does, would
   keep the one rule.

## Merge notes

- Merge before #86, which is stacked on it.
- No schema change and no database reset.
