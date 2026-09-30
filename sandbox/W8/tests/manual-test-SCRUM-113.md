# Manual test — the reviewer chooses which submission to review (SCRUM-113 / stories D8, D4)

**About 35 minutes.** This checks SCRUM-113 in the running app, on branch `CS57-Hanchen-scrum-113` (stacked on
`CS57-Hanchen-scrum-114`, PR #43):

- **choosing:** on an item with several submissions, the Review tab lists the ones awaiting the reviewer,
  named by author; the reviewer picks one, sees its own answer, and the decision lands on it;
- **moving on:** after a decision the panel moves to the next awaiting submission instead of closing;
- **nothing to decide:** with nothing awaiting (all decided, disputed, or no review rights) the tab says so
  and offers no decision — the 403 in the API's own words, not as an empty queue;
- **independence, finished:** hydration no longer falls back to a colleague's draft, so an annotator who can
  also review no longer sees a colleague's name or answer in the **list** either (SCRUM-114 fixed the panel).

What the automated tests prove, and what this walkthrough proves:

- **Tests** (299 web tests on the branch head) prove the chooser, the chosen payload, the decision's
  `annotation_id`, moving on, the three unavailable states and the half-typed justification, against a mocked
  queue and adjustment read; and that hydration returns only the viewer's own or an unclaimed draft.
- **This walkthrough** proves it against the real review queue, whose rules (never your own work, never a
  decision you already made, never a disputed item) the panel relies on but does not repeat.

Screens: the design canvas, row "SCRUM-113" (<https://claude.ai/artifact/JrTWfhAmAyRJKUEwJsveYP>). Plan:
[`../plans/plan-SCRUM-113-114.md`](../plans/plan-SCRUM-113-114.md). Helper script:
[`../scripts/sandbox-SCRUM-48.py`](../scripts/sandbox-SCRUM-48.py).

---

## Setup

### 1. Switch branch

```powershell
cd D:\COMP5703_Capstone\hej
git switch CS57-Hanchen-scrum-113
```

Web-only commits on top of SCRUM-114; no schema change. The dev database needs the reset since PR #28 (see
[`manual-test-SCRUM-114.md`](manual-test-SCRUM-114.md) → Setup → 1); if logins work, it has had it.

### 2. Run the app

`docker compose up -d`, then **restart the web container after every branch switch or code change**:

```powershell
docker compose restart frontend
```

and hard-reload every browser (Ctrl+Shift+R). **A hard reload alone is not enough.** The web container runs
`next dev --turbopack`, and Turbopack does not see file changes on a Windows bind mount (`WATCHPACK_POLLING`
only affects webpack), so it keeps serving what it compiled when it started. Found 2026-09-29 at step 1.4: the
container's `.next` held no trace of the chooser and still had the "is annotating this item" notice removed in
SCRUM-114; after the restart it compiled the current files. Check before a run:

```powershell
docker compose exec frontend sh -c 'grep -rl "Submissions awaiting your review" /workspace/apps/hej-web/.next | wc -l'   # > 0
```

### 3. Accounts and browsers

| Account | Password | Name shown | Role | Browser |
| --- | --- | --- | --- | --- |
| `charlie@example.com` | `SecurePass3Charlie` | Charlie Davis | annotator | **A** (Chrome) |
| `dana@example.com` | `SecurePass4Dana` | Dana | annotator | **B** (Edge) |
| `erin@example.com` | `SecurePass5Erin` | Erin | reviewer | **A, incognito** |
| `frank@example.com` | `SecurePass6Frank` | Frank | annotator + reviewer | **B, InPrivate** |

Browsers must not share a login.

### 4. The helper script

From `D:\COMP5703_Capstone\docs\sandbox\W8\scripts`, with **`py`**. Replace `<task>` and `<item>` with the ids
`new` prints — not the letters T1/I1.

```powershell
py sandbox-SCRUM-48.py new 2                          # fresh classification task, 2 human submissions per item
py sandbox-SCRUM-48.py show <task> <item>             # status, each submission and its latest review
py sandbox-SCRUM-48.py queue <task> <who>             # what the queues offer <who>
```

The task's Annotate tab has a **label** field (a classification task).

---

## Part 1 — Choose a submission, decide, move on (`/review`)

```powershell
py sandbox-SCRUM-48.py new 2
  task      task_8698e41dd4b1
  item      item_b574046dba7e
  annotate  http://localhost:3000/tasks/task_8698e41dd4b1/annotate
  review    http://localhost:3000/tasks/task_8698e41dd4b1/review
```

Write down the ids as **T1** and **I1**.

| # | Who | Do | Expect |
| --- | --- | --- | --- |
| 1.1 | charlie (A) | `/tasks/T1/annotate`, open I1, label `charlie answer`. **Submit** | Submitted |
| 1.2 | dana (B) | `/tasks/T1/annotate`, open I1, label `dana answer`. **Submit** | Submitted |
| 1.3 | script | `py sandbox-SCRUM-48.py queue task_8698e41dd4b1 erin annotate 403 You are not authorized to annotate in organization 2. Required active role: admin, annotator. Your active organization roles: reviewer. review   1 item(s) item_b574046dba7e  2 of 2 submitted, 0 working, ai=False awaiting=['ann_78d6bba2841c', 'ann_609a2dd12b55']` | The review row for I1 prints `awaiting=[…]` with **two** annotation ids |
| 1.4 | erin (A, incognito) | `/tasks/T1/review`, open I1, **Review** tab. **Look before acting** | "Submissions awaiting your review — 2 on this item", buttons **Charlie Davis** and **Dana**; the first is pressed and its answer is under "Submitted annotation" and in "Final annotation payload" |
| 1.5 | erin | Click the other button | Its answer replaces the first everywhere on the tab; nothing of the first remains |
| 1.6 | erin | With **Dana** chosen: Justification `Too negative`, Feedback `Relabel as mixed`. **Adjust** | Green: **"Returned for adjustment. Next: Charlie Davis's submission — 1 left to review on this item."** The panel stays open; **Charlie Davis** is the only button and pressed; Justification and Feedback are empty; the answer shown is `charlie answer` |
| 1.7 | erin | Justification `Fits`. **Accept** | "Submission approved. The item stays open until every required submission is in and approved." (Dana's is back with her) |
| 1.8 | script | `py sandbox-SCRUM-48.py show T1 I1` | Dana's submission: its latest review is the return (the verdict the script prints, not `accept`); Charlie's: `accept` — **each decision on its own submission** |
| 1.9 | erin | **Reload**, open I1, Review tab | The item is `returned` (Dana's is back with her), so the existing notice: "This item cannot be reviewed right now … It was returned from review for adjustment." The decision buttons are disabled |
| 1.10 | script | `py sandbox-SCRUM-48.py queue T1 erin` | No `awaiting` ids for I1: nothing awaits erin until Dana resubmits |

```
PS D:\COMP5703_Capstone\docs\sandbox\W8\scripts> py sandbox-SCRUM-48.py show task_8698e41dd4b1 item_b574046dba7e
item item_b574046dba7e: status=returned
  ann_609a2dd12b55  by dana     latest review: adjust
  ann_78d6bba2841c  by charlie  latest review: accept
PS D:\COMP5703_Capstone\docs\sandbox\W8\scripts> py sandbox-SCRUM-48.py queue task_8698e41dd4b1 erin
annotate 403 You are not authorized to annotate in organization 2. Required active role: admin, annotator. Your active organization roles: reviewer.
review   0 item(s)
PS D:\COMP5703_Caps
```
## Part 2 — Nothing to decide: disputed, and no review rights

```powershell
py sandbox-SCRUM-48.py new 2

  task      task_d3aa12244a13
  item      item_c29b27541995
  annotate  http://localhost:3000/tasks/task_d3aa12244a13/annotate
  review    http://localhost:3000/tasks/task_d3aa12244a13/review

```

Write down **T2** and **I2**.

| # | Who | Do | Expect |
| --- | --- | --- | --- |
| 2.1 | dana (B) | `/tasks/T2/annotate`, open I2, label `dana on T2`. **Submit** | Submitted |
| 2.2 | erin | `/tasks/T2/review`, open I2, Review tab. Justification `Ambiguous`. **Escalate** | "Escalated to dispute." |
| 2.3 | erin | **Reload**, open I2, Review tab | "No submission on this item awaits your review." and **"It is under dispute, so it is decided from the dispute desk, not here."** with **Go to Item details**; decision buttons disabled |
| 2.4 | charlie (A) | `/tasks/T2/items`, open I2, **Review** tab | A red box: "Could not load the submissions awaiting your review." and the API's own message beneath it (403 — charlie has no review rights). **Not** "No submission … awaits your review." Buttons disabled (TRUE) |

## Part 3 — Independence in the list (hydration without the fallback)

```powershell
py sandbox-SCRUM-48.py new 2

Fresh SCRUM-48 item ready (required_annotators=2, mode=human_first, item status=pending).

  task      task_0e74c967e61b
  item      item_ee766e225fb5
  annotate  http://localhost:3000/tasks/task_0e74c967e61b/annotate
  review    http://localhost:3000/tasks/task_0e74c967e61b/review
```

Write down **T3** and **I3**.

| # | Who | Do | Expect |
| --- | --- | --- | --- |
| 3.1 | dana (B) | `/tasks/T3/annotate`, open I3, label `dana on T3`. **Submit** | Submitted |
| 3.2 | frank (B, InPrivate) | `/tasks/T3/annotate`. **Look at the list before opening anything** | I3's annotator column says **Unassigned** and its value column does **not** show `dana on T3` — before this commit it showed "Dana" and her answer to frank |
| 3.3 | frank | Open I3, **Annotate** tab | Empty label field, no Reviewer feedback |
| 3.4 | frank | **Review** tab | Dana's submission offered (one button, **Dana**), her answer shown |
| 3.5 | dana (B) | **Reload** `/tasks/T3/annotate` | Her own row shows **Dana** and `dana on T3` (TRUE) |

## Part 4 — The same from `/items`

| # | Who | Do | Expect |
| --- | --- | --- | --- |
| 4.1 | frank | `/tasks/T3/items`, open I3, **Review** tab | As 3.4 |
| 4.2 | frank | With Dana chosen, Justification `Fits`. **Accept** | "Submission approved. The item stays open until every required submission is in and approved." (one of two required submissions) — no "Next:", since nothing else awaits frank (TRUE)|

---

## Known, not failures

- **Switching submissions refills the Review form.** Typing a justification for one submission and then choosing
  another discards it: the form belongs to the submission on screen.
- **The list's annotator column says "Unassigned"** for items whose only drafts are colleagues' — the column
  meant "who holds the draft shown", and a reviewer is now shown none. Noted in the PR.
- **A resubmission leaves a pending draft behind** (SCRUM-114's known limitation), unchanged here.

## Results

| Part | Date | Run by | Result | Notes |
| --- | --- | --- | --- | --- |
| 1 — Choose, decide, move on | 2026-09-30 | Hanchen | Pass | First attempt stopped at 1.4: the web container served a build from before SCRUM-113 (Turbopack misses changes on the Windows bind mount); passed after `docker compose restart frontend`. API side checked directly: erin's review queue offered both submissions |
| 2 — Disputed, no review rights | 2026-09-30 | Hanchen | Pass | |
| 3 — Independence in the list | 2026-09-30 | Hanchen | Pass | |
| 4 — From `/items` | 2026-09-30 | Hanchen | Pass | |
