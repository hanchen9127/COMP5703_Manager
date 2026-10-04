# Reply — Yi's review of PR #47 (SCRUM-38)

2026-10-04. Yi requested changes on head `2f1512e` (2026-10-03 14:23 UTC): two points, both verified true,
and both fixed in this PR. Hanchen took the second as well (it was Yi's AI-integration scope) so that it
needs no PR of its own.

| # | Yi's point | Check | Fix |
| --- | --- | --- | --- |
| 1 | Both export formats drop superseded versions and their reviews | True. Legacy `tasks.py:1258` and normalized `:1355` kept one version per author; reviews were fetched for that one only (`:1390`). The legacy test pinned it with `(alice_answer,) = ...`. **Also a regression:** before #47 a resubmission rewrote the row, so the review that returned it stayed on the exported answer | `90d11e4` |
| 2 | `model_version` is never filled on the real AI path | True. `draft_service.py:59` reads `metadata.ai.model_version`; `_ai_metadata` in `ai_preannotator.py` wrote only `provider` and `model`. The test injected the field | `75f1062` |

## What changed (pushed to `CS57-Hanchen-scrum-38`)

**`90d11e4` fix(api): export each answer's earlier versions with their reviews**
- `tasks.py`: in both formats each current answer carries `earlier_versions`. That is the author's other
  versions on the item, oldest first, each with its content, reviews and provenance. Answers and
  `annotation_count` stay one per author; the normalized summary adds `earlier_version_count`.
- Tests:
  - Rita returns Alice's v1. Both formats must carry v1, its content and Rita's review, and every
    `derived_from_annotation_id` must resolve inside the export. **Red before** (4 failed), green after.
  - The reopen test's "round 1 is not exported" line now finds Alice's round 1 in her `earlier_versions`.
- `api_surfaces.md` and ADR 009 describe the field. Outside the repo, the spec's `requirements.md` and
  `validation.md` (criterion 5) match.

**`75f1062` fix(ai): record the model version the provider served**
- `analyzers/base.py`: `OpenAICompatibleClient.served_model` is the `model` of the provider's response,
  the model that actually answered. It is often a dated snapshot of the alias asked for. It is reset at
  the start of each call. The `JsonCompletionClient` protocol documents it as optional.
- `ai_preannotator.py`: `_ai_metadata` writes it to `metadata.ai.model_version` when it is a non-empty
  string. All four analyzers share the client, so this covers text, image, audio and video. Nothing is
  guessed, and a test double's attribute is not taken for a version.
- Tests: the client records the served model and clears it when the next response names none; a run
  writes it; the submitted AI answer (`_author_fields`) takes it from there. **Red before** (3 failed),
  green after. A guard checks that a run with no report, or with a mock client, records no version.
- ADR 009 says where the version comes from. Answers written before this commit keep none.

**Verified:** backend on SQLite, **852 passed, 8 skipped**. PostgreSQL was not run locally (no server on
5432); CI runs both.

## Reply on the PR (ready to paste)

```
Thanks Yi, both points were right, and I've fixed both here so you don't need a separate PR for the second.

1. `90d11e4`: the first was worse than it looked. Before this PR a resubmission rewrote the row, so the review that returned it stayed on the exported answer. With versions, that review sits on v1, so exporting only current versions dropped it. Now, in both formats, each current answer carries `earlier_versions`: the author's other versions on the item, oldest first, each with its content, its own reviews and provenance. So every `derived_from_annotation_id` resolves inside the export. Answers and `annotation_count` stay one per author; the normalized summary adds `earlier_version_count`. Your v1 → v2 case is now the fixture: a reviewer returns Alice's v1, and both formats must carry v1, its content and that review (red before the fix). There's also a check that every derivation link resolves in the export.

2. `75f1062`: `OpenAICompatibleClient` now keeps `served_model`, the `model` the provider reports for each response (often a dated snapshot, e.g. `gpt-4o-mini-2024-07-18`), reset on every call. `_ai_metadata` writes it to `metadata.ai.model_version`, so all four analyzers get it through the shared client. If the provider names none, nothing is recorded; nothing is guessed. The tests go from the client, through the run's metadata, to the submitted answer's `model_version`, without injecting the field. Since this is your area, please check that reading `response.model` suits the providers you've tried (Qwen, DeepSeek, Ollama all return it, as far as I know).

Backend 852 passed on SQLite locally; CI covers PostgreSQL. Could you take another look?
```

## PR description additions

Add to the commit table:

```
| `90d11e4` | Each exported answer carries its author's earlier versions, with their reviews (`earlier_versions`, both formats), so every derivation link resolves inside the export. From Yi's review |
| `75f1062` | The AI run records the model version the provider served (`response.model` → `metadata.ai.model_version` → the answer's `model_version`). From Yi's review |
```
