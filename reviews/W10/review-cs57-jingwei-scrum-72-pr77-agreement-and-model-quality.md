# Review — PR #77, `CS57-Jingwei-scrum-72` (SCRUM-72, I3: agreement coefficients, and the AI's accuracy and calibration from a recorded model run)

**Posted 2026-10-18 12:51 UTC as Request changes** on `56cac38` (everything from "Verdict" down, unchanged). Read from GitHub first: a draft ("Draft until Sun 18 Oct"), no reviews or comments, review requested from Hanchen. CI is blocked repo-wide by GitHub Actions billing, so every result below comes from local runs.
<https://github.com/USYD-CS-Capstone/hej/pull/77>

## Verdict: request changes (two small fixes), then approve

The design is sound and well argued in ADR 019:

- Fleiss' kappa on accept/redo, so the order the two reviews landed in can't change the figure.
- Krippendorff's alpha over each annotator's first independent answer, with the blind verdict used on protocol items.
- A coefficient that isn't defined is null with its reason, never 0 or 1.
- What needs gold stays in the harness, and gold never reaches the platform (R1-1).
- One recorded live run, replayed through the platform, so the figures repeat without a model.

I checked both coefficient formulas against their definitions:

- **Fleiss' kappa** with two ratings per item reduces to Scott's pi. `expected` is the sum of squared pooled shares, as the code computes it.
- **Krippendorff's alpha** builds its coincidence matrix with weight `1/(m-1)`, then computes `1 - (n-1)·Σo/Σn_c·n_k`.

Both are correct. The reviewer pairs come from #53's own loader, so kappa and the raw rate describe the same reviews.

Two things should change before merge:

1. **The calibration finding.** Every answer lands in one bin, so "well calibrated" overstates what the figure shows.
2. **Alpha's independence rule.** It misses one path, an expert's Return with context.

Both are small.

## Checked locally

| Check | Result |
| --- | --- |
| Worktree `D:\COMP5703_Capstone\hej-review-77` at `7ae9d8c` (local merge of the PR head `56cac38` into `main` at `a58e5da`; no conflicts) | `main` checkout untouched |
| `uv run pytest -q` (SQLite) | ✅ **2,132 passed, 20 skipped**, 209 subtests, 4 min 15 s |
| PostgreSQL | Not run (no local PostgreSQL today). The PR reports 2,057 passed on its branch. The PR makes no schema change |
| Web | `typecheck:web` clean. `project-quality-section.test.tsx` and `lib/project-quality.test.ts`: 8 passed |
| `python -m evaluation gold-subset --check --package <client package>` | ✅ AG News 7 per class; Civil Comments 14 harm / 14 no harm |
| Full recording against the client package (reviewer script, below) | Accuracy reproduces: AG News 0.845, Civil Comments 0.655, 200/200 completed in each. Confirms finding 1 |
| Recordings | Only `label`/`verdict`/`score`/`confidence` are kept. All 206 rationales in the full recording are the redaction marker. `*.unredacted.jsonl` is git-ignored |
| Probe of `_independent_answers` (temporary script, not committed) | Confirms finding 2 |

## Scope, criterion by criterion

| # | Criterion (story I3 / SCRUM-72) | At `56cac38` |
| --- | --- | --- |
| I3-1 | Agreement by an established coefficient, between annotators and between reviewers | ✅ Fleiss' kappa (reviewers, D7's sampled pairs) and Krippendorff's alpha (annotators). ⚠️ Finding 2 on which answers alpha counts |
| I3-2 | Per task, comparable across tasks | ✅ `GET /tasks/{id}/metrics`, and one row per task in `GET /projects/{id}/quality`, behind `MANAGE_PROJECT` like the task metrics |
| I3-3 | AI suggestion quality and confidence calibration beside human agreement | ✅ Accuracy, per-class F1, macro-F1, ECE and Brier in the harness. ⚠️ Finding 1 on the reliability table |
| I3-4 | Accuracy against the reference, apart from agreement, for human and AI | ✅ `ai_accuracy` and `human_accuracy` in `gold.py`. Human accuracy comes from scripted cases only and is labelled E-D1 |
| T-4 | Gold from Group A's datasets through SCRUM-70's records | ✅ 56 committed records, with a seeded pick checked against the package. 400 read at run time |
| T-5 | Figures from repeatable harness runs | ✅ The committed recording replays to the same figures (`test_the_same_recording_gives_the_same_figures`) |
| #72 gap 1b | Protocol stages as provenance events | ✅ `suggestion_generated`, `blind_verdict_given`, `suggestion_revealed`: who and when, never what. Readers are the round's annotator, those who revealed the suggestion, and managers |
| #72 gap 1a | Guideline/policy version per stage | ➖ Waits on #63 (see "Merge notes") |
| DoD | Docs | ✅ ADR 019, ADR 016's gap updated, `api_surfaces.md`, `backend_module_map.md`, evaluation and gold READMEs |
| DoD | Shown in the running app | ✅ Quality section on the project Overview, hidden on 403 |

## Fix before merge

### 1. Every answer falls in one calibration bin, so "well calibrated" rests on calibration-in-the-large

`gold.py:176` bins by `min(int(confidence * 5), 4)`. llama3 only ever states 0.8, 0.9 or 1.0, and all three map to bin 4. The five-bin reliability table therefore has one populated row in both datasets. Its ECE is just |mean confidence − accuracy| over all answers. ADR 019's Consequences says the top bin holds everything, but it still reports AG News as "well calibrated on average (stated ~0.85, ECE 0.008)", and the PR body says "well calibrated on AG News".

From the committed full recording against the client package (reviewer script):

| Stated | AG News n | AG News right | Civil Comments n | Civil Comments right |
| --- | --- | --- | --- | --- |
| 0.8 | 130 | 77.7% | 62 | 46.8% |
| 0.9 | 35 | 100% | 27 | 63.0% |
| 1.0 | 35 | 94.3% | 111 | 76.6% |
| Five bins (one populated) | ECE **0.008** | | ECE 0.271 | |
| One bin per stated value | ECE **0.043** | | ECE 0.270 | |

On AG News the per-value ECE is five times the reported one. The model's 0.9 answers are more often right than its 1.0 answers, which the current table can't show. Civil Comments is unaffected, because its gap is large either way. SCRUM-75 will quote these figures to the client, so the wording should match what was measured.

**Fix.** When the answers carry fewer distinct confidences than `BINS`, bin by stated value, or report a per-stated-value table and its ECE beside the five bins. Add a test where 0.8, 0.9 and 1.0 land in separate rows. Then reword the AG News finding in ADR 019 and the PR body, for example: "average confidence matches accuracy (0.85 vs 0.845); by stated value, ECE 0.04".

### 2. Alpha counts a new annotator who was shown another's answer as independent

`_independent_answers` (`evaluation_metrics.py:347`) takes each annotator's first submission and drops it only if its lineage reaches the AI's answer. An expert's dispute Return to a new annotator (#69) can pass the earlier answer as context. `create_independent_replacement` stores that context in `derived_from_annotation_id`, and its docstring says the field "records supplied context". `_derives_from_ai` follows that pointer only to look for the AI. A human context is therefore counted as an independent answer, even though its author saw a colleague's answer first. It also arrives only after a disagreement, so it pulls alpha towards whichever side the context showed.

Probe (in-memory rows, calling `_independent_answers` directly): A answers `spam`, B answers `ham`, and C is given A's answer as context and answers `spam`. The counted answers are `['spam', 'ham', 'spam']`, where `['spam', 'ham']` is expected.

**Fix.** Leave out a first submission whose `derived_from_annotation_id` is set: it was given context, so it isn't independent. A rework already drops out, because it is never the person's first submission. Add a test for the context-given replacement beside the existing AI-derived one, and add a line to ADR 019 decision 1.

## Small

- **S1. One docstring disagrees with the code and ADR 016.** `_may_read_protocol_event` (`provenance_service.py:176`) says a stage is "the annotator's own until their work is done". The code and ADR 016 never show it to colleagues or reviewers, even after the work is done. Say "never". F5's timeline (SCRUM-106, Yi) will read this rule.
- **S2. "A missing confidence is `null` on every AI draft" claims more than the code does.** `_stated_confidence` covers judgement and classification answers. Entity and box confidences still use `_number(..., default 0.0)` (`ai_preannotator.py:483` and below). Either narrow the claim in ADR 019 decision 4 and the PR body, or extend the fix. Also note in the ADR that a stated value outside 0–1 (a model answering `85`) is now `null`, where it was `85.0` before.
- **S3. Each recording line has `model_version: "llama3"`, while the header has the digest `llama3@365c0bd3c000`.** Either fill the line's field from the header, or drop it, so the two can't be read as different models.

## Accepted as is

- The project quality route runs about 12 queries per task. The PR lists this as out of scope, and it is measured at about 0.2 s for 30 tasks.
- A non-manager's Overview makes one request that returns 403, and the section is hidden.

## Merge notes

- **Gap 1a (versions per stage) should not wait for #63.** #63 conflicts with `main` in three files, and its last push was 2026-10-13. Mark this PR ready without gap 1a, as its own body allows. Give gap 1a a follow-up after #63, or list it as a known limitation in SCRUM-75.
- **Merge before #79 (SCRUM-74).** The two conflict in `evaluation/__main__.py`, `harness/scenario.py`, `evaluation/README.md` and `backend_module_map.md`. #79's `check_roles` already maps the three new event kinds, so it expects this PR first.
- No schema change, so no database reset.
