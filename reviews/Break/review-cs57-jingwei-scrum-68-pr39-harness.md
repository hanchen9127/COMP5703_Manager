# Review — PR #39, `CS57-Jingwei` (SCRUM-68, story I1): the evaluation harness

2026-10-04, Hanchen. PR head `ac4c57b` (draft, last updated 2026-10-01), base `main`. No comments or reviews on
GitHub before this one. Checked against the story (I1), SCRUM-68's description of 2026-10-01
(`../../sandbox/Break/jira/jira-break-descriptions.md`) and SCRUM-70's, which builds on this format.

**Verdict: approve once it is marked ready.** Nothing blocking. Four comments matter for the cases that come
next (SCRUM-70, 71, 99), and three are nits.

## What was run

| Where | Result |
| --- | --- |
| PR head `ac4c57b`, SQLite | `python -m evaluation run`: 4/4. Suite: 785 passed, 6 skipped |
| Head merged locally with `main` `df7c05a` (#43–#47) | Merges cleanly. 4/4; the 42 evaluation tests pass |
| The same merge, PostgreSQL 18 (throwaway database) | 4/4; `test_evaluation_cases.py` 5 passed; no `hej_eval_*` schema left behind |

## Against SCRUM-68's criteria

| Criterion | Met |
| --- | --- |
| A harness drives a scenario end to end without clicking | ✅ |
| Annotation, review, dispute and final judgement in one scenario | ✅ EV-001. Cross-validation is dual sign-off until SCRUM-51, as the ticket says |
| Each scenario states its expected outcome, pass or fail | ✅ Per step and per item outcome; the first failing step is named |
| The file format: named steps plus expected outcomes | ✅ TOML, validated as a whole, documented in the README |
| Distinct seeded users, so role separation is exercised | ✅ One user per role per case, real sign-in, real tokens. EV-001 checks three refusals |
| One trivial scenario proves the loop | ✅ EV-000 |

What is good: driving the API in process with real tokens is the right level (ADR 006 argues it well). A
fresh world per case, with a throwaway PostgreSQL schema, makes runs independent and safe. Scripting the AI at
`JsonCompletionClient` keeps the analyzer's own parsing and failure handling in the run. Validating the whole
file first, and refusing unknown keys, means a typo is never mistaken for a platform failure. The task fields
come from `TaskCreate` itself, so they cannot drift.

## Comments

### 1. Nothing can assert on what leaves the platform (non-blocking; affects SCRUM-70)

`_do_export` keeps the export in `driver.export`, but no expectation reads it, and `[outcome]` takes only
`status`. A case therefore cannot check which answer an item resolves to, how many answers an item exports,
or what provenance it carries. Those are the properties most of the brief's adversarial categories are about.
Issue 4 (a finalised item exporting conflicting answers) cannot be caught: EV-001 would pass with it.

SCRUM-70 needs this, so I'll add it in SCRUM-70 on top of this PR rather than ask for it here. The proposal:
- `[outcome]` items may also state `answer` (the authoritative answer's content), `answers` (how many the
  export carries for the item), and `authoritative` (the author alias, or `ai`);
- an `export` step may take `expect.items = { <alias> = { ... } }` with the same keys.

**Can you confirm** that shape before I build on it, so the format stays yours to own?

### 2. The adjudication vocabulary is the legacy one (non-blocking)

`adjudicate` takes `finalize` or `send_back`. SCRUM-99 replaces them with Accept (naming a version), Return
and Reject, and the legacy route is planned to return 410 once SCRUM-103 switches the desk. EV-001 will need
updating then; that's expected. But in the meantime, EV-001's note says "Read as mildly negative" while the
item finalises with the annotator's "positive". It asserts a resolution R2-1 wouldn't produce. Suggest a note
that doesn't contradict the answer, so the case doesn't read as approving it.

### 3. Reading an item's status can change it (non-blocking; for awareness)

`Driver.item_status` reads `GET /tasks/{id}/task-items`, which runs the send-back repair on every read, with an
`UPDATE` and a commit (perf findings, H2). So a `check` step, or an `expect.item_status`, can itself change the
item. That's today's platform, not the harness. It's exactly how SCRUM-120 surfaces: a reopened item is flipped
to `expert_send_back` by the next read. SCRUM-120 is yours too. Per the break rule, its fix should name a case,
and this harness can express it now (annotate, escalate, send back, resubmit, accept, reopen, check).

### 4. "As the web app does" is not quite true for escalation (non-blocking)

`_do_escalate` routes to `expert` by default. The work panel always sends `secondary_reviewer`
(`task-item-workspace-sheet.tsx:1947`). The target changes nothing today, so the cases are unaffected. Once the
target gets a meaning (your proposal's S7), they will diverge. Either default to what the web sends, or drop
"as the web app does" from the README and the driver comment.

### Nits

5. **Scripted AI matching.** `complete_json` picks the first item whose text appears *in* the prompt, and the
   loader only checks that texts are distinct. If one item's text is contained in another's ("good" and "very
   good"), the wrong script answers. Refuse that at load time, or match more strictly.
6. **Organisation defaults.** `build_world` copies the defaults `AdminService` writes inline
   (`admin_service.py:115`). There's nothing to call instead, so just add a comment pointing there, so a
   change there is noticed.
7. **ADR 006.** Under *Alternatives*, the shared seed is rejected partly because "cases could not run in
   parallel", but *Consequences* says cases run one at a time anyway. Reword one of them.

## Next

- Mark it ready for review.
- Merge `main` once more before merging; it merges cleanly today.
- SCRUM-69 and SCRUM-70 (Hanchen) build on the merged format; comment 1 is the extension SCRUM-70 brings.

## Comment for GitHub (ready to paste)

```
Reviewed at ac4c57b, and with main (df7c05a, #43–#47) merged in locally: it merges cleanly, 4/4 cases pass on SQLite and on PostgreSQL 18, the 42 evaluation tests pass, and no throwaway schema is left behind. Approving once it's marked ready. Nothing blocking.

Driving the API in process with real tokens is the right level, and a fresh world per case plus the scripted analyzer client make every run self-contained. Validating the whole file first, and taking the task fields from TaskCreate, are both good calls.

Four comments for what comes next:

1. **Nothing can assert on what leaves the platform.** `_do_export` keeps the export, but no expectation reads it, and `[outcome]` takes only `status`. So a case can't check which answer an item resolves to, or how many answers it exports. Issue 4 (a finalised item exporting conflicting answers) would pass EV-001. SCRUM-70 needs this, so I'll add it there on top of this PR: `[outcome]` items may also state `answer`, `answers` (the count) and `authoritative` (an author alias or `ai`), and an `export` step may take `expect.items = { <alias> = { ... } }` with the same keys. Can you confirm that shape, so the format stays consistent?
2. **Adjudication is the legacy vocabulary** (`finalize` / `send_back`). SCRUM-99 brings Accept/Return/Reject, so EV-001 will change then, which is expected. Meanwhile its note says "Read as mildly negative" while the item finalises as "positive", so it reads as approving a resolution R2-1 wouldn't produce. A neutral note would avoid that.
3. **Reading status can change the item.** `item_status` reads `GET /tasks/{id}/task-items`, which repairs send-back statuses on every read (an UPDATE and a commit). That's how SCRUM-120 shows up (a reopened item is flipped to expert_send_back by the next read), so its fix can come with a case in this harness.
4. **Escalation target.** `_do_escalate` defaults to `expert`, while the work panel sends `secondary_reviewer` (`task-item-workspace-sheet.tsx:1947`). No effect today, but either match the web or drop "as the web app does" from the README and the driver.

Nits: the scripted AI matches an item by its text appearing in the prompt, so one item's text inside another's ("good" / "very good") picks the wrong script; refuse that at load time. `build_world` copies `AdminService`'s inline organisation defaults (`admin_service.py:115`), so a pointer there would help. ADR 006 rejects the shared seed partly because cases "could not run in parallel", while the harness runs them one at a time anyway.
```
