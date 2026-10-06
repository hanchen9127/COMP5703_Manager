Thanks both. Everything is pushed in three commits after `b744243`; the description is updated to match.

**Yi** (`1aa076e`)
1. **Concurrent registration.** Items and drafts now come from one outer join, so they are read from one snapshot. A test registers an item and its placeholder draft just before the statement that reads drafts: it raised the `KeyError` before the fix and passes now. With one statement there is no window left between two reads, so this stands in for a concurrency test.
2. **Equal timestamps.** Both routes now break ties on `DraftDB.id.desc()`. A test gives one item's drafts equal times and checks that both routes list them in the same order.

**Jingwei** (`c0cd1c4`, `f5fa1ea`)
1. **One visibility rule.** `items_hiding_peers` decides, for one item or a whole task, where peers' work is hidden: the role checks once and one "has answered" query. `visible_records_by_item` applies it. The batched read calls it for every item, and `visible_to_caller`, `should_hide_other_annotators` and `assert_visible_to_caller` call it for one. `item_ids_answered_by` is the rule's only reading of "has answered". It stays task-wide rather than limited to the ids given: one query either way, and no `IN` list that grows with the task. A new test changes the rule in one place and checks that both routes follow it.
2. **A failed batch read.** The items are kept and the view is marked `draftsUnavailable`. The shell then shows "Saved drafts couldn't be loaded. Items are shown without them." with a retry. Tests cover the mark and the banner.

Smaller points:
- **Indexes on PostgreSQL:** the description now says a dev or demo database gets them only on a reset.
- **The tabs' re-read:** left as it is for now, and listed under Known limitations. A page stays within 10 requests. Reading only when the item ids change needs its own check that a save on one tab still shows on the other.
- **300 ms vs 1 s:** story A6 already says under 1 s. It is SCRUM-119's criterion that still said 300 ms, and I've aligned it on the board.
- **10 and 200 items:** the statement-count test now uses those sizes: 10 statements for an annotator and 7 for a reviewer, for both.

API 887 passed on SQLite, web 344, typecheck and eslint clean. CI covers PostgreSQL. Could you both take another look?
