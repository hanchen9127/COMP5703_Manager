Hi Parth, #54 (SCRUM-119) has just merged into `main` (`2343a19`). #53 now conflicts with `main` in one place: `visible_to_caller` in `annotation_service.py`.

**What changed:** the visibility rule is now a single implementation, so the per-item reads and the new batched read `GET /tasks/{id}/drafts` can't drift apart:
- `items_hiding_peers(task_id, org_id, item_ids, user)` decides on which items peers' work is hidden;
- `visible_records_by_item(task_id, org_id, {item_id: records}, user)` applies it. `visible_to_caller` is now just its one-item case.

**How to resolve:** take `main`'s `visible_to_caller`, and move your `reviewer_correction_hidden` filter into `visible_records_by_item`, so the batched read applies it too:

```python
def visible_records_by_item(self, task_id, organization_id, records_by_item, current_user):
    from app.services.independent_review_service import reviewer_correction_hidden

    hidden = self.items_hiding_peers(task_id, organization_id, records_by_item, current_user)
    return {
        item_id: [
            record
            for record in records
            if not reviewer_correction_hidden(self.db, record, current_user)
            and (item_id not in hidden or not is_peer_work(record, current_user))
        ]
        for item_id, records in records_by_item.items()
    }
```

Your change to `assert_visible_to_caller` doesn't conflict; keep it. `reviewer_correction_hidden` returns before any query for a draft (drafts have no `derivation`), so the batched read stays at a fixed number of statements; `test_task_drafts_read.py` checks that, and that both routes return the same lists.

After the merge, please run `test_task_drafts_read.py` and `test_annotation_independence_privacy.py` along with your own tests. Your new tables need no migration step, but development PostgreSQL databases need `init_data.py --reset` to get #54's indexes.
