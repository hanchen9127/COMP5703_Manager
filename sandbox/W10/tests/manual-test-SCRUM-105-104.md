# Manual test — the release gate and the release manifest (SCRUM-105 / H3, SCRUM-104 / H2)

**About 40 minutes.** This checks PR #83 (the pre-release gate) and PR #84 (the manifest) in the running app,
on the PR #84 head `ea4a7b4`, which contains #83. It covers:

- **the gate (H3):** a release with unreviewed or disputed items is refused before anything exists, naming
  each item and why, and nobody can satisfy it by setting a status by hand;
- **the manifest (H2):** a release says what it contains, points each item at its provenance, and can be
  checked with SHA-256 alone;
- **after a release:** an item can still be reopened and worked again. The old release stays exactly as it
  was, and the corrected state needs a new release, version 2.

What the automated tests prove, and what this walkthrough adds:

- **Tests** (SQLite 2,159 and PostgreSQL 2,171 on the PR head) prove each refusal reason, the 409 body,
  that a refusal creates nothing, the manifest's fields, and that one changed byte fails the check. They
  write their rows straight to the tables.
- **This walkthrough** drives the same rules through the real screens and routes. The state the gate
  reads is made by people answering, reviewing, escalating, deciding and reopening.

Releases have no screen yet (H6, #82). The release side therefore goes through a helper script, which
checks a release as a client would: with Python's `hashlib`, nothing from the platform. Script:
[`../scripts/sandbox-SCRUM-105-104.py`](../scripts/sandbox-SCRUM-105-104.py). Reviews:
[`../../../reviews/W10/review-cs57-michael-scrum-105-pr83-release-gate.md`](../../../reviews/W10/review-cs57-michael-scrum-105-pr83-release-gate.md),
[`../../../reviews/W10/review-cs57-michael-scrum-104-pr84-release-manifest.md`](../../../reviews/W10/review-cs57-michael-scrum-104-pr84-release-manifest.md).

**Dry run, 19 Oct:** every step below was run once through the API in place of the browser, and every
expected result in this file was observed. The item ids, hashes and event numbers on your run will differ.

---

## Setup

### 1. The code: the PR #84 worktree

```powershell
cd D:\COMP5703_Capstone\hej
git fetch origin pull/84/head:refs/remotes/pr/84
git -C D:\COMP5703_Capstone\hej-review-84 checkout --detach pr/84   # ea4a7b4 or later
```

The worktree already exists from the review. Your own `hej` checkout is not touched.

### 2. The database: a throwaway SQLite file, not the dev PostgreSQL

#84 adds three columns to `releases`. On the shared dev PostgreSQL that needs `init_data.py --reset`, and
another reset when you switch back to `main`. A SQLite file avoids both.

```powershell
docker compose -f D:\COMP5703_Capstone\hej\compose.yaml stop backend     # frees port 8000, if it runs
cd D:\COMP5703_Capstone\hej-review-84\apps\hej-api
$env:DATABASE_URL = "sqlite:///D:/COMP5703_Capstone/manual-84.db"
uv run python -X utf8 init_data.py --reset
```

### 3. Run the API on :8000 (same PowerShell window, so `DATABASE_URL` is set)

```powershell
$env:HEJ_RELOAD = "false"
uv run python main.py
```

Leave it running. Check it at <http://localhost:8000/docs>.

### 4. Run the web app without the Docker backend

```powershell
cd D:\COMP5703_Capstone\hej
docker compose up -d --no-deps frontend
docker compose restart frontend
```

The web code comes from your `hej` checkout. #83 and #84 change no web file, so that is fine. The browser
calls the API on `localhost:8000`, which is now the PR #84 API. Hard-reload every browser (Ctrl+Shift+R).

### 5. Accounts and browsers

Passwords are in the root README, under **Local login**. The script reads them from there too.

| Account | Role | Does here | Browser |
| --- | --- | --- | --- |
| Dana | Annotator | answers a3-01, a3-02, a3-03 | Browser 1 |
| Charlie | Annotator | answers a3-05 again after the reopen | Browser 1 (after Dana logs out) |
| Bob | Reviewer | accepts three answers, escalates one | Browser 2 |
| Fiona | Reviewer | accepts Charlie's new answer | Browser 2 (after Bob) |
| Hannah | Arbitrator (expert) | decides the dispute on a3-03 | Browser 3 (incognito) |
| Kevin | Task owner | releases (via the script), reopens a3-05 | script; Browser 3 for the reopen |
| Alice | Admin | tries to set a status by hand (via the script) | script only |

### 6. The script

Open a second PowerShell window:

```powershell
cd D:\COMP5703_Capstone\docs\sandbox\W10\scripts
$env:PYTHONIOENCODING = "utf-8"
py sandbox-SCRUM-105-104.py items
```

Every command works on seeded task **A3** ("1 submission per item: judgement", project "Test: Single review":
one approval, a split is held). Its five items start as `a3-01`/`02`/`03` untouched (`pending`),
`a3-04-awaiting-review` (Charlie's answer, `annotated`) and `a3-05-finalised` (`canonicalized`). Each command
logs in afresh, so each takes a few seconds.

---

## Part 1 — The gate refuses before anything exists (H3)

| # | Do | Expect | ✓ |
| --- | --- | --- | --- |
| 1.1 | `py sandbox-SCRUM-105-104.py items` | the five items in the states above | ☐ |
| 1.2 | `py sandbox-SCRUM-105-104.py release` | `409 — refused`, "4 item(s) failed … Nothing was created". `a3-01` to `a3-04` each named with `unreviewed` and their status (`pending`, `annotated`). `a3-05` **not** named. Last line: `releases of A3 now: 0` | ☐ |
| 1.3 | `py sandbox-SCRUM-105-104.py force a3-01 canonicalized` | `409 … cannot be set directly to workflow-owned status: canonicalized`. Even an admin can't declare an item reviewed (H3 criterion 3) | ☐ |

1.2 proves criteria 1 and 2: the refusal names each item and why, and leaves no release behind. 1.3 proves
the gate can't be satisfied by assertion, because the only way to `canonicalized` is a recorded decision.

## Part 2 — Work the task in the browser

| # | Who | Do | Expect | ✓ |
| --- | --- | --- | --- | --- |
| 2.1 | Dana | Open task A3. Answer **a3-01**, **a3-02** and **a3-03**: verdict and a short rationale, submit each | each item `annotated` | ☐ |
| 2.2 | Bob | Review: **accept** a3-01, a3-02 and a3-04 (Charlie's). **Escalate** a3-03 with a justification | three `canonicalized`; a3-03 `disputed` (check with `items`) | ☐ |
| 2.3 | script | `py sandbox-SCRUM-105-104.py release` | `409`, **one** item: `a3-03` with two reasons, `unreviewed` (status `disputed`) and `disputed` "held for an expert by open annotation dispute 'dispute_…'". `releases of A3 now: 0` | ☐ |
| 2.4 | Hannah | Open a3-03's dispute case and **Reject** it: no answer holds under the guideline | a3-03 `unresolved` (an ambiguous item, R2-1) | ☐ |

## Part 3 — Release, and check it without the platform (H2)

| # | Do | Expect | ✓ |
| --- | --- | --- | --- |
| 3.1 | `release` | `201 Created: rel_…  version 1  lines 4`, both SHA-256 values, `gate warnings 0`. Four lines: a3-03 is ambiguous and has none | ☐ |
| 3.2 | `check v1` | nine `PASS` lines, then `VERIFIED: 9 of 9`. The files are saved in `%TEMP%\hej-release-check` | ☐ |
| 3.3 | `check v1 --tamper` | one bit flipped in the downloaded copy. Steps 1 and 3 for `a3-01` `FAIL`, then `NOT VERIFIED: 7 of 9` | ☐ |
| 3.4 | `manifest v1` | `item_count` 5, `resolutions` 4 authoritative and 1 ambiguous, `release.created_by` = Kevin's id, `task` guideline and policy versions. The table: a3-03 `ambiguous`, `line None`, `answer None`, `released None`; the others name a line, an answer and a `released` event id | ☐ |
| 3.5 | `trail a3-01` | its events oldest first, ending with `released` by Kevin. Its id equals a3-01's `released` id in 3.4 | ☐ |
| 3.6 | `release` again | `409`, "This state is already released as 'rel_…'; its artefact is unchanged". No duplicate | ☐ |
| 3.7 | Kevin, browser (optional) | Project "Test: Single review" → **Exports**: the release is listed and labelled frozen | ☐ |

3.2 and 3.3 are H2 criterion 3. 3.4 and 3.5 are criteria 1 and 2.

**Expected gap in 3.4:** `versions_covered.source` is `[]`. Seeded items are registered without a source
version (upload intake writes `"v1"`; `dataset-registration` writes one only if sent). This is not a
defect of the walkthrough. The review of #84 asks that each item's source version come from its answer.

## Part 4 — After a release: reopen, and a version 2

| # | Who | Do | Expect | ✓ |
| --- | --- | --- | --- | --- |
| 4.1 | Kevin | In the browser, open **a3-05** and **reopen** it, with a reason ("a correction after release") | a3-05 `pending` | ☐ |
| 4.2 | script | `check v1` | still `VERIFIED: 9 of 9`. The release did not change | ☐ |
| 4.3 | script | `release` | `409`, one item: `a3-05` `unreviewed` (status `pending`). The gate is back in force for the reopened item | ☐ |
| 4.4 | Charlie, then Fiona | Charlie answers a3-05; Fiona accepts it | a3-05 `canonicalized` | ☐ |
| 4.5 | script | `release`, then `releases` | `201 … version 2`. `releases` lists v1 and v2 with **different** artefact hashes | ☐ |
| 4.6 | script | `check v2`, then `check v1` | both `VERIFIED` | ☐ |
| 4.7 | script | `manifest v1 a3-05`, then `manifest v2 a3-05` | different `annotation_id` (Dana's original, Charlie's new) and different `released_event_id` | ☐ |
| 4.8 | script | `trail a3-05` | `released` (v1) → `item_reopened` (Kevin) → `item_taken` and `human_responded` (Charlie) → `reviewed` (Fiona) → `released` (v2) | ☐ |

Part 4 is the answer to "can a task or item change after a release?". Yes. The release is a snapshot that
never changes, a correction is published as a new version, and the item's provenance shows both.

---

## Results

| Part | Result | Notes |
| --- | --- | --- |
| 1 Gate refuses | | |
| 2 Work the task | | |
| 3 Release and manifest | | |
| 4 Reopen and v2 | | |

## Cleanup

```powershell
# Stop the API (Ctrl+C in its window), then:
Remove-Item D:\COMP5703_Capstone\manual-84.db
Remove-Item -Recurse $env:TEMP\hej-release-check
docker compose -f D:\COMP5703_Capstone\hej\compose.yaml up -d backend   # back to your usual stack
```
