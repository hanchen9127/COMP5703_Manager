Thanks Jingwei, this is a clean, well-scoped fix. Reviewed at `3af0842`: the API suite passes (925 passed, 8 skipped, SQLite) and CI is green on both databases. It merges cleanly with today's `main` (12 commits behind) and with Parth's #53.

Moving the fix into the read is the right call: old rows read cleanly, and nothing that reads stored values changes. `_SUMMARY_FIELDS`, plus the test that every field a summary states is in it, is easy to extend. SCRUM-99's `dispute_adjudicated` will slot straight in.

## One change before merging

**The key=value check also hides notes that people write.** `_is_key_value_text` runs on every operation's description. But only one writer stores machine pairs there: `review_action` (`review_actions.py:484`, `review_status=…; next_item_status=…`). `escalation_routed` and `escalation_decided` store `payload.note`, which a reviewer or expert types, and a short note in exactly that shape is plausible:

| Note | Shown after this PR? |
| --- | --- |
| `label=negative` | no |
| `sentiment=negative; confidence=low` | no |
| `score=0.9` | no |
| `score=0.9 is too low, see the guideline` (your test) | yes |

An expert who records their decision as `label=negative` would lose it from the history view. The reason is part of the provenance record (R2-4), so the history shouldn't drop it.

**Fix:** apply the check only where the description is machine-written. For example, add `_MACHINE_DESCRIPTION_OPERATIONS = frozenset({"review_action"})` next to `_SUMMARY_FIELDS`, and use `log.operation in _MACHINE_DESCRIPTION_OPERATIONS and _is_key_value_text(detail)`. A test that `escalation_decided` with the note `label=negative` keeps it as the detail would guard it. The strict pattern can then stay as it is.

## Nit

The comment in `_detail_for_log` says the entry's changes "already say what such pairs say". For a review, `next_item_status` is in the changes, but `review_status` isn't: it is in neither `new_values` nor the summary. It follows from the action, which the summary states, so nothing is lost. The comment could say that instead.

Happy to approve once the check is scoped to the review entry.
