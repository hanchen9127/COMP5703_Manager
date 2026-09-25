# Manual test — work queues, independence and item completion (SCRUM-48 / story D8)

**About 40 minutes.** This checks D8, as fixed in PR #35, in the running app:

- annotators work independently: before submitting, you cannot see another annotator's answer, only
  how many have submitted;
- an item takes exactly `required_annotators` human submissions;
- each submission is reviewed on its own, and one accept does not finalise the item;
- returned and rejected work comes back to its annotator and holds the item open until it is redone.

What the automated tests prove, and what this walkthrough proves, are split like this:

- **Tests** (587 on SQLite, 592 on PostgreSQL) prove the concurrency lock, the query counts, and every
  rule in isolation.
- **This walkthrough** proves the web app still works with those rules: the screens show the right
  things to the right person, and nothing the API now refuses is offered as a button that fails silently.

Branch `CS57-Hanchen-scrum-48-fixes` (PR #35). Helper script:
[`../scripts/sandbox-SCRUM-48.py`](../scripts/sandbox-SCRUM-48.py).

**Dry run, 2026-09-26.** Parts 1–4 were run through the API on a throwaway PostgreSQL database, with
the helper script and a stand-in for the web app's submit. The reject path was run on the same item
rather than a third one. Every expected result below matched. The
screens were not run; that is what this walkthrough is for.

---

## Setup

### 1. Switch branch and reset the development database

```powershell
cd D:\COMP5703_Capstone\hej
git switch CS57-Hanchen-scrum-48-fixes
git pull
```

**The dev database must be reset.** This branch adds `tasks.required_annotators`, and PostgreSQL has
no additive migration, so an existing dev database fails on its first task query. Resetting **wipes
all dev data**:

```powershell
cd apps\hej-api
$env:PYTHONIOENCODING = "utf-8"
.venv\Scripts\python init_data.py --reset
```

### 2. Start both servers, then recreate the test accounts

```powershell
cd D:\COMP5703_Capstone\hej\apps\hej-api ; .venv\Scripts\python main.py   # API :8000
cd D:\COMP5703_Capstone\hej ; npm run dev:web                             # web :3000 (second terminal)
cd D:\COMP5703_Capstone\hej\apps\hej-api
.venv\Scripts\python ..\..\..\docs\sandbox\tools\seed_test_roles.py       # dana, erin, frank, grace
```

### 3. Accounts and browsers

| Account | Password | Role | Browser |
| --- | --- | --- | --- |
| `charlie@example.com` | `SecurePass3Charlie` | annotator | **A** (Chrome) |
| `dana@example.com` | `SecurePass4Dana` | annotator | **B** (Edge) |
| `erin@example.com` | `SecurePass5Erin` | reviewer | **A, incognito** |
| `frank@example.com` | `SecurePass6Frank` | annotator + reviewer | **B, InPrivate** |

Browsers must not share a login. Two normal windows of the same browser do.

### 4. The helper script

Run it from `D:\COMP5703_Capstone\docs\sandbox\W8\scripts`. The web app has no queue screen yet
(SCRUM-93) and no field for `required_annotators`, so the script supplies both:

```powershell
python sandbox-SCRUM-48.py new 2                        # fresh item needing 2 human submissions
python sandbox-SCRUM-48.py queue <task> <who>           # what the annotate/review queues offer <who>
python sandbox-SCRUM-48.py peek <task> <item> <who>     # what <who> can read of other people's work
python sandbox-SCRUM-48.py show <task> <item>           # item status and each submission's latest review
python sandbox-SCRUM-48.py review <task> <item> <author> accept|revise|reject   # as erin
```

---

## Part 1 — Independence before submitting (item 1)

```powershell
python sandbox-SCRUM-48.py new 2
```

Write down `task` and `item` as **T1** and **I1**.

| # | Who | Do | Expect |
| --- | --- | --- | --- |
| 1.1 | charlie (A) | Open the annotate URL, open I1, type `charlie: supports`, **Submit** | Submitted |
| 1.2 | dana (B) | **Look before acting.** Open I1 | No "charlie is annotating this item" block. Charlie's text appears nowhere. An editor of dana's own |
| 1.3 | — | `peek T1 I1 dana` | Draft list: none. Annotation list: sees none, `total_count=1`. Review read: no submission. Charlie's annotation → **403** |
| 1.4 | — | `queue T1 dana` | Annotate: I1, `1 of 2 submitted` |
| 1.5 | dana (B) | **Reload.** Open I1 again | Still no trace of charlie's answer |
| 1.6 | dana (B) | Type `dana: contradicts`, **Submit** | Submitted |
| 1.7 | — | `peek T1 I1 dana` | Now sees charlie's and her own; charlie's annotation → **200** |

## Part 2 — The item takes exactly two (item 1)

| # | Who | Do | Expect |
| --- | --- | --- | --- |
| 2.1 | — | `queue T1 frank` | Annotate: **0 items** (full). Review: I1, `2 of 2`, both submissions awaiting |
| 2.2 | frank (B InPrivate) | Open I1, type an answer, **Submit** | Refused: `Human annotation submission limit reached for this item (2/2).` Nothing is shown as submitted |
| 2.3 | — | `show T1 I1` | Still two submissions: charlie and dana |

## Part 3 — Each submission is reviewed on its own (item 1)

| # | Who | Do | Expect |
| --- | --- | --- | --- |
| 3.1 | erin (A incognito) | Open the review URL, open I1. **Note whose answer the panel shows** | One submission, charlie's or dana's |
| 3.2 | erin | Justification `Checked`, **Accept** | Message: `Submission approved. The item stays open until every required submission is in and approved.` The item is **not** shown as approved |
| 3.3 | erin | **Reload** | I1 is still under review, not finalised |
| 3.4 | — | `show T1 I1` | Status `annotated`; one submission `accept`, the other `-` |
| 3.5 | — | `queue T1 erin` | Review: I1, awaiting **only the other** submission |
| 3.6 | — | `review T1 I1 <the other author> accept` | `next_ui_status=approved`, status **`canonicalized`** |
| 3.7 | erin | **Reload** | I1 is finalised |
| 3.8 | charlie (A) | Open I1, try to annotate again | Refused: `Task item … is finalised (canonicalized) and does not accept new …` |

Step 3.6 uses the script because the review panel shows **one** submission per item and cannot switch
to the other (see Observations).

## Part 4 — Returned work comes back, and holds the item (item 2)

```powershell
python sandbox-SCRUM-48.py new 2
```

Write these down as **T2** and **I2**. Charlie and dana each submit an answer on I2, as in 1.1 and 1.6.

| # | Who | Do | Expect |
| --- | --- | --- | --- |
| 4.1 | — | `review T2 I2 dana revise` | `next_ui_status=returned`, status `returned` |
| 4.2 | — | `review T2 I2 charlie accept` | `awaiting_other_submissions`. Status stays **`returned`**, because dana's work is out |
| 4.3 | — | `queue T2 dana` / `queue T2 charlie` | Dana's annotate queue has I2. Charlie's does not |
| 4.4 | dana (B) | **Reload**, open I2 | Notice: `It was returned from review for adjustment. Open Annotate to revise and resubmit.` Reviewer note: **the feedback on dana's own** submission |
| 4.5 | charlie (A) | **Reload**, open I2 | No returned notice meant for dana, and none of her feedback |
| 4.6 | dana (B) | Edit the answer and **Submit** directly. Do not click Save draft first (S10, SCRUM-93) | Submitted |
| 4.7 | — | `queue T2 erin` | Review: I2, awaiting dana's submission only |
| 4.8 | — | `review T2 I2 dana accept` | Status **`canonicalized`** |

## Part 5 — Reject means redo (item 3)

Repeat Part 4 on a fresh item (`new 2`, **T3/I3**), with `reject` in place of `revise` at 4.1.

- After the reject, and after charlie's accept, the status is **`rejected`**.
- Dana's browser shows `It was rejected in review. Open Annotate to revise and resubmit.`
- I3 is back in dana's annotate queue.
- After she resubmits and erin accepts, the status is **`canonicalized`**.

---

## Results

Fill in on the day. Mark each step ✅ or ❌, and give the step number and what happened for any ❌.

| Part | Result | Notes |
| --- | --- | --- |
| 1 Independence | | |
| 2 Limit | | |
| 3 Per-submission review | | |
| 4 Return and rework | | |
| 5 Reject and rework | | |

## Observations from the dry run (not failures of this PR)

- **The review panel cannot choose between submissions.** It shows the draft `selectDraftForViewer`
  picks, and since #34 it sends that draft's `annotation_id`, so the decision lands on what is shown.
  But the reviewer cannot move on to the other submission on the same item. The review queue already
  returns `awaiting_review_annotation_ids`, so SCRUM-93 can offer a choice.
- **A refused submission leaves a pending draft, which counts as "working".** After 2.2, frank still
  holds a pending draft on the full item, and `working_count` counts him from then on. Drafts are
  deliberately uncapped. Still, SCRUM-93 showing "1 working" on a full item is misleading. Worth
  deciding there whether to count only drafts on items with a free place.
- **No queue screen yet.** Every queue check here goes through the script until SCRUM-93.

## Cleanup

Nothing to undo. Each run creates its own tasks in the "Draft Ownership Sandbox" project. Deleting a
task that has items fails (issue 30), so leave them.
