# Review — PR #42, `CS57-Yi-SCRUM-111` (SCRUM-111, B7)

2026-09-30. Head `7dbfd59`, base `main`; merge-base `c5b428b` (#36). `main` is at `e367ebd` (#28); GitHub
reports **MERGEABLE / CLEAN**. Three commits, 21 files, +1927 / −253.

**On GitHub (checked with `gh pr view 42`):** open since 2026-09-29, no reviews, no comments, no inline
comments. CI green on the head (SQLite and PostgreSQL). Board: SCRUM-111 *In Review*, Yi Geng.

**Read before this review:** SCRUM-111 on the board (8 criteria, "ADR first"); story B7; client answer R1-1
and its follow-up in `info/client-question.md` (source record → task/schema projection → annotation payload;
`gold_annotations` "should not normally be exposed"; nothing hard-coded to `payload_preview.text`); the
client's "Action required" for ADRs in `docs/adr/`. Earlier messages to Yi in `sandbox/W8/msg/` are about
SCRUM-62 and the dispute questions, not this ticket. Yi's previous PR (#36) was approved once adr004 landed.

**Decided by Hanchen for this review (2026-09-30):** selecting `gold_annotations` or `full_record` is the
uploader's responsibility for now, and generated `file#N` item refs are acceptable. Neither blocks; both
go into the ADR as recorded departures from the ticket.

**Recommendation: request changes — three items.** The intake is solid: all-or-nothing across files and
records, failures remove written files, the server re-parses everything rather than trusting the browser,
and `source_version_ref` is now a real version (`sha256:…#record:N#input_sha256:…`) instead of `"v1"`.
Before merge: the ADR; stop handing every item the URL of the whole source file (gold included, no
authentication needed); and record the PostgreSQL migration rule change in `db_schema_strategy.md`.

## Verified

- PR head: backend (in-memory SQLite) **682 passed, 7 skipped**; web vitest **252 passed**, `tsc` clean.
  Matches the description.
- Probes on the PR head (`scratchpad/wt-pr42/apps/hej-api/tests/test_zz_probe_pr42.py`, not in the PR),
  with a real `register_dataset` and FewNERD-shaped records:
  - 5 records → 5 items, `fewnerd.jsonl#1`…`#5`; the audit row holds all five names as a JSON object.
  - AI-assisted task, first model call fails → **0 items and 0 files left**. Atomicity holds end to end.
  - `GET /api/v1/uploads/texts/source_….jsonl` with **no Authorization header → 200**, body contains
    `gold_annotations` (finding 2).
  - A JSONL string holding a raw U+2028 is **rejected** by the API as "invalid JSON on line 1"; the browser
    parser accepts it (finding 5).
  - Two files both named `a.jsonl` in one submission → four items with refs `a.jsonl#1`, `a.jsonl#1`,
    `a.jsonl#2`, `a.jsonl#2` (finding 6).

## Scope — SCRUM-111 on the board, point by point

| # | Board description | On `7dbfd59` |
| --- | --- | --- |
| 1 | First, an ADR in `docs/adr/`: owner names the payload field in the task configuration, or supported types ship a fixed adapter | ❌ **No ADR.** The PR chose a third option — the uploader picks fields per file, at upload time — which is not recorded anywhere but the PR description |
| 2 | `.jsonl` → one item per record; a malformed line fails the whole upload with its line number; all-or-nothing through `register_dataset` | ✅ Also JSON arrays and CSV. `register_dataset(commit=False)` + one commit in the service; files cleaned up on failure |
| 3 | Full source record kept; `external_item_ref`, `split`, `source_record_id` stay attached; ref from the record | ⚠️ Source file kept once, plus record number and both hashes per item — enough to recover the exact record. Record fields not attached; ref is `file#N`. **Accepted (Hanchen), ADR records it** |
| 4 | Payload is only the projection — never the whole record | ⚠️ `full_record` mode sends the whole record. **Accepted (Hanchen), ADR records it** |
| 5 | `gold_annotations` stored, never shown, never sent to the AI; available to the harness | ❌ Selectable by design (accepted, ADR) — but also **reachable from every item even when not selected**: finding 2 |
| 6 | Real source version instead of `"v1"` | ✅ `sha256:<file>#record:N#input_sha256:<input>` |
| 7 | Plain `.txt` keeps working: one file, one item | ✅ `whole_file` |
| 8 | Tests with the FewNERD sample: N records → N items; `payload_preview.text` is the payload; gold never reaches the AI prompt or the annotator; malformed line leaves nothing | ⚠️ FewNERD-shaped records, malformed line and cleanup are tested. No test that gold stays out of the item/AI input; `test_selected_fields_projection_allows_evaluation_fields` pins the opposite. The service tests mock `register_dataset`, and there is no route-level test of the multipart form |

**Beyond the ticket:** the whole browser workflow (select, append, configure, preview, remove), JSON and CSV
record files, and the audit JSONB change. The JSONB change is **needed by this PR**, not incidental: the
intake audit row stores every item name, and on PostgreSQL `String(4000)` is enforced, so an upload of a
couple of hundred records would fail. On `main` it never did only because a file was one item.

## Fix before merge

### 1. The ADR (`docs/adr/adr005_…`)

Ticket criterion 1 and the client's standing request. It should record:
- **the decision taken:** projection is chosen per file at upload time and recorded per item
  (`projection_mode`, `selected_fields`), not stored on the task; with the trade-off against the ticket's
  two options — later uploads to the same task may project differently, and the task itself does not say
  what its input is;
- **the departures Hanchen accepted:** `full_record` and selecting evaluation-only fields are allowed, and
  keeping gold out is the uploader's responsibility (the client said "should not normally be exposed";
  a task-level exclusion list is the follow-up); items are named `file#N`, and the record's own
  `external_item_ref` / `split` / `source_record_id` are recovered from the stored source by record number;
- how the harness (I1) finds an item's gold: `source_location_ref` + `source_record_number`, checked by
  `source_sha256`.

### 2. Every item carries an unauthenticated link to the whole source file

`import_files` puts `source_location_ref` (`uploads/texts/source_….jsonl`) into each item's
`payload_preview` (`text_intake_service.py:283`). `payload_preview` is returned by `TaskItemRead` and the
review reads, so every annotator and reviewer on the task receives it. `download_file`
(`uploads.py:571`) serves anything under `uploads/texts/` with no authentication — the random file name is
its only protection, and here we hand the name out. The source holds **every** record's
`gold_annotations`, so even an uploader who selects only `payload_preview.text` exposes the gold set.
Confirmed by probe: 200 with no token, body contains `gold_annotations`.

This is independent of the decision above: it defeats the careful uploader, not only the careless one.
Two ways out, either is fine:
- store sources outside the served directory (e.g. `mydata/uploads/sources/`, which the download route's
  `^(images|texts|audio|videos)$` pattern does not serve) and keep the reference; or
- keep `source_location_ref` out of `payload_preview` (on the data pointer, or a column not returned by
  item and review reads).

Add a test that the source file cannot be fetched through `/uploads/…` without `MANAGE_DATASET`, or is not
under a served path.

### 3. Record the PostgreSQL migration rule change

`_migrate_postgresql_audit_values_to_jsonb` runs at startup on PostgreSQL. `db_schema_strategy.md`
(lines 904–915, the SCRUM-94 decision) still says development PostgreSQL databases are disposable and
`migrate_db_schema()` is SQLite-only. The migration itself is reasonable (idempotent, legacy strings read
back), but the rule it changes is a team decision: update `db_schema_strategy.md` in this PR (Docs Sync),
or drop the migration and tell everyone to reset. Also note in `api_surfaces.md` that `AuditLogRead`'s
`old_values` / `new_values` changed from JSON strings to objects — no web code reads them (checked), but
it is a contract change.

## Not blocking

4. **Inline AI runs one model call per record inside the upload request.** The default
   `HEJ_AI_EXECUTION_MODE` is `inline`. A file was one item before; now the 200-record FewNERD subset on
   an AI-assisted task is 200 sequential calls in one HTTP request, holding the transaction open, and one
   failure rolls all 200 back. Worth one line in the ADR or the panel: use `worker` mode for record files
   on AI-assisted tasks.
5. **JSONL line splitting differs between browser and API.** `text.splitlines()`
   (`text_intake_service.py:89`) also splits on U+2028, U+2029, U+0085, `\x0b`, `\x0c`, `\x1c`–`\x1e`,
   which JSON allows raw inside strings; the browser splits on `\r?\n`. A file previews fine, then the
   submit fails with a misleading line number. `text.split("\n")` plus stripping a trailing `\r` matches
   the browser.
6. **Duplicate item refs.** Two files with the same name in one submission (or the same file uploaded
   twice) produce identical `external_item_ref`s. `_external_ref`'s `[:255]` can also cut off the `#N` for
   very long names. Refuse duplicate file names in one submission at least.
7. **Non-leaf selections are accepted by the API.** The description says they are rejected; selecting
   `payload_preview` returns the whole sub-object. Either reject in `project_record` or correct the
   description.
8. **Default projection.** The first field alphabetically is preselected (`text-intake.ts:199`); for
   FewNERD that is `external_item_ref`, so the default annotation input is `"fewnerd:train:0"`. Preselecting
   nothing and requiring a choice is safer.
9. **Tests.** One `TestClient` test of `POST /upload-texts` (multipart + `projections`, and a bad
   projection → 400); one that, with `payload_preview.text` selected, neither the item's input file nor the
   AI's `location_ref` content contains `gold_annotations`.

## Not checked

- The browser workflow in the running app (Definition of Done: demonstrable in the running app). The
  panel's tests pass; I did not click through it.
- The PostgreSQL JSONB migration against a real legacy database (the PR's PostgreSQL test is skipped
  without PostgreSQL; CI's PostgreSQL job ran it).

---

## Comment to post on the PR (condensed)

> Thanks @DIQI26 — the intake is solid: all-or-nothing across files and records, written files removed on
> failure, the server re-parses everything instead of trusting the browser, and `source_version_ref` is a
> real version now. On the head (`7dbfd59`): backend 682 passed + 7 skipped, vitest 252, `tsc` clean.
> I also ran it with a real `register_dataset`: 5 FewNERD records → 5 items, and an AI failure on an
> AI-assisted task leaves no items and no files behind.
>
> **Three things before merge:**
>
> 1. **ADR first** (SCRUM-111 criterion 1, and the client's request). `docs/adr/adr005_…` should record the
>    decision: projection is chosen per file at upload and recorded per item, not stored on the task, with
>    the trade-off against the ticket's two options. It should also record two departures from the ticket
>    that are fine for now: `full_record` / selecting `gold_annotations` is the uploader's responsibility
>    (a task-level exclusion list is a follow-up), and items are `file#N`, with the record's own
>    `external_item_ref` / `split` / `source_record_id` recovered from the stored source by record number.
>    Say there how the harness (I1) finds an item's gold.
>
> 2. **Every item carries an unauthenticated link to the whole source file.** `source_location_ref` goes
>    into each item's `payload_preview` (`text_intake_service.py:283`), which `TaskItemRead` and the review
>    reads return to annotators and reviewers. `/uploads/texts/…` needs no token. So even an uploader who
>    selects only `payload_preview.text` exposes every record's `gold_annotations`: I fetched
>    `/api/v1/uploads/texts/source_….jsonl` without a token and got 200 with the gold in it. Either store
>    sources outside the served directory, or keep the reference out of `payload_preview`, plus a test.
>
> 3. **The PostgreSQL startup migration changes a team rule.** `db_schema_strategy.md` (SCRUM-94) still
>    says development PostgreSQL databases are disposable and `migrate_db_schema()` is SQLite-only. Update
>    it in this PR, or drop the migration. The JSONB change itself is needed, since the intake audit row
>    lists every item name and `String(4000)` is enforced on PostgreSQL. Please also note in
>    `api_surfaces.md` that `AuditLogRead.old_values/new_values` are objects now.
>
> **Not blocking:**
> - With the default `inline` mode, an AI-assisted task makes one model call per record inside the upload
>   request (200 for the FewNERD subset), and one failure rolls them all back. Worth a line recommending
>   `worker` mode for record files.
> - `text.splitlines()` (`:89`) also splits on U+2028 and other separators that JSON allows inside strings.
>   The browser splits on `\r?\n`, so a file previews fine and then fails on submit. `split("\n")` matches it.
> - Two files with the same name in one submission give duplicate refs (`a.jsonl#1` twice). The `[:255]`
>   cut can also drop the `#N`.
> - The API accepts non-leaf selections (`payload_preview` → the whole sub-object), although the
>   description says they are rejected.
> - The default projection is the first field alphabetically. For FewNERD that is `external_item_ref`,
>   so preselecting nothing may be safer.
> - Tests: one `TestClient` test of the multipart route, and one that with `payload_preview.text` selected
>   no item input contains `gold_annotations`.
