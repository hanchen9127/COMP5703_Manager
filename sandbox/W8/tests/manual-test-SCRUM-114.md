# Manual test — the item workspace panel: S10, no colleague's draft, refusals (SCRUM-114 / story D8)

**About 40 minutes, plus 10 for the optional Part 6.** This checks SCRUM-114 in the running app, on branch
`CS57-Hanchen-scrum-114`:

- **S10:** on a returned item, Save draft keeps what the annotator typed — across a background refresh,
  a reload, and after resubmitting;
- **independence:** someone who can both annotate and review opens an item a colleague has submitted and
  sees an empty editor of their own — no "X is annotating" notice, no colleague's answer, no reviewer
  feedback on the colleague's work — while the Review tab still shows the colleague's submission;
- **refusals:** a submission the API refuses (409) is shown in the API's own words, and the panel does not
  pretend it was submitted;
- **unsaved-changes warning:** leaving the page warns only after something was edited.

What the automated tests prove, and what this walkthrough proves:

- **Tests** (274 web tests on the branch head) prove each rule on a rendered panel with the API mocked:
  which draft is shown, that typing survives a re-render, that a colleague's draft is kept out of the
  Annotate and Details tabs (including a judgement task's verdict, which this walkthrough cannot set up),
  that no adjustment request goes out without the viewer's own annotation id, and the exact refusal text.
- **This walkthrough** proves the same against the real API and the real hydration code, on each page
  that opens the panel — `/annotate`, `/review` and `/items` reach the panel through different code
  (`task-annotation-workspace-with-real-data`, `task-workbench`, `live-task-workspace`).

Plan: [`../plans/plan-SCRUM-113-114.md`](../plans/plan-SCRUM-113-114.md). Helper script, shared with the
SCRUM-48 walkthrough: [`../scripts/sandbox-SCRUM-48.py`](../scripts/sandbox-SCRUM-48.py).

---

## Setup

### 1. Switch branch

```powershell
cd D:\COMP5703_Capstone\hej
git switch CS57-Hanchen-scrum-114
```

The branch is `main` (`e367ebd`) plus four web-only commits. The commits change no schema, **but the base
does**: `e367ebd` is the merge of PR #28 (2026-09-29 14:23), which adds `organization_users` columns such as
`invitation_expires_at`. `migrate_db_schema()` adds columns on SQLite only, so a PostgreSQL dev database
reset before #28 lacks them, and **every login fails with a 500** (`UndefinedColumn … invitation_expires_at`;
the web app shows only "login failed"). Found 2026-09-29. Reset once after switching:

```powershell
cd D:\COMP5703_Capstone\hej
docker compose up -d
docker compose exec -e PYTHONIOENCODING=utf-8 backend uv run python init_data.py --reset   # wipes all dev data
docker compose restart backend
cd apps\hej-api
.venv\Scripts\python ..\..\..\docs\sandbox\tools\seed_test_roles.py                         # charlie, dana, erin, frank, grace
```

Check with a login before opening a browser (expect `200`):

```powershell
curl.exe -s -o NUL -w "%{http_code}`n" -X POST http://localhost:8000/api/v1/auth/login -H "Content-Type: application/json" -d '{\"email\":\"charlie@example.com\",\"password\":\"SecurePass3Charlie\"}'
```

### 2. Run the app

`docker compose up -d` (step 1) runs postgres :5432, the API :8000 and the web app :3000. The web
container mounts the source, so it serves the branch without a rebuild. Hard-reload each browser once
(Ctrl+Shift+R) so no page from `main` is cached.

### 3. Accounts and browsers

| Account | Password | Role | Browser |
| --- | --- | --- | --- |
| `charlie@example.com` | `SecurePass3Charlie` | annotator | **A** (Chrome) |
| `dana@example.com` | `SecurePass4Dana` | annotator | **B** (Edge) |
| `frank@example.com` | `SecurePass6Frank` | annotator + reviewer | **B, InPrivate** |

Erin (reviewer) acts only through the helper script. Browsers must not share a login.

**Frank is the case that matters for independence.** The API hides colleagues' drafts from a plain
annotator until they submit, but shows every draft to anyone who can review — so only someone with both
roles ever received a colleague's draft in the panel.

### 4. The helper script

From `D:\COMP5703_Capstone\docs\sandbox\W8\scripts`, with **`py`**:

```powershell
py sandbox-SCRUM-48.py new 2                                     # fresh text task, 2 human submissions per item
py sandbox-SCRUM-48.py show <task> <item>                        # status, each submission and its latest review
py sandbox-SCRUM-48.py review <task> <item> <author> revise      # erin returns <author>'s submission
py sandbox-SCRUM-48.py queue <task> <who>                        # what the queues offer <who>
```

**Correction, found in the run of 2026-09-29:** `new` makes a **classification** task, not a text span task,
so the Annotate tab has a **label** field and no Notes box. Wherever a step below says "Notes", the run used
the label field instead; the checks are the same (the stored annotation is `{"kind": "classification",
"label": …}`).

**Opening an item.** There is no queue screen yet (SCRUM-93). Open the task URL the script prints, then
click the item's row: the work panel opens on the right.

---

## Part 1 — S10: rework survives Save draft, a refresh and a reload (`/annotate`)

```powershell
py sandbox-SCRUM-48.py new 2
  task      task_ae85364b3536
  item      item_5df01a386404
  annotate  http://localhost:3000/tasks/task_ae85364b3536/annotate
  review    http://localhost:3000/tasks/task_ae85364b3536/review

py sandbox-SCRUM-48.py review task_ae85364b3536 item_5df01a386404 charlie revise  
```

Write down `task` and `item` as **T1** and **I1**.

| # | Who | Do | Expect |
| --- | --- | --- | --- |
| 1.1 | charlie (A) | Open `/tasks/T1/annotate`, open **I1**. Select a word, give it a label, type `first answer` in Notes. **Submit** | "Submitted for review." The panel closes |
| 1.2 | script | `py sandbox-SCRUM-48.py review T1 I1 charlie revise` | `next_ui_status=returned` |
| 1.3 | charlie (A) | **Reload** the page, open I1 again. **Look before acting:** read the panel | Status **Returned**. A **Reviewer feedback** box: "Walkthrough: please revise the span." Notes shows `first answer` |
| 1.4 | charlie (A) | Change Notes to `rework after feedback`. **Save draft** | "Draft saved." Notes still shows `rework after feedback` — **before the fix it went back to `first answer`** After save draft, there was a green message at top shown for one frame and disappeared, I cannot even read it.|
| 1.5 | charlie (A) | Switch to **Item details** and back to **Annotate**; then **Close** the panel and open I1 again from the list, without reloading | Notes still `rework after feedback` both times — the reopened panel gets the item the save handed back to the list (confirmed) |
| 1.6 | charlie (A) | **Reload**, open I1 | Notes shows `rework after feedback` (the pending rework is newer than the returned submission, so it is the draft shown) (confirmed) |
| 1.7 | charlie (A) | Change Notes to `rework, final`. **Submit** without saving first | "Submitted for review." |
| 1.8 | charlie (A) | **Reload**, open I1 | Notes shows `rework, final` — **not** `rework after feedback`, the draft saved in 1.4 and left pending behind the resubmission (confirmed) |
| 1.9 | script | `py sandbox-SCRUM-48.py show T1 I1` | charlie's submission holds `rework, final` |

```
D:\COMP5703_Capstone\docs\sandbox\W8\scripts>py sandbox-SCRUM-48.py review task_ae85364b3536 item_5df01a386404 charlie revise
erin revise charlie: next_ui_status=returned
item item_5df01a386404: status=returned
  ann_3b71f8c9e069  by charlie  latest review: revise

D:\COMP5703_Capstone\docs\sandbox\W8\scripts>py sandbox-SCRUM-48.py show task_ae85364b3536 item_5df01a386404
item item_5df01a386404: status=annotated
  ann_3b71f8c9e069  by charlie  latest review: revise
  ```

**Known, not a failure:** step 1.7 submits a fresh draft, so the draft saved in 1.4 stays pending in the
database. `py sandbox-SCRUM-48.py queue T1 dana` may count it in `working_count`. Noted in the PR; the
resubmission rules are SCRUM-117's.

---

## Part 2 — A colleague's draft stays out of Annotate and Details (`/annotate`)

```powershell
py sandbox-SCRUM-48.py new 2
  task      task_cbd40731f8e4
  item      item_616a14d1197c
  annotate  http://localhost:3000/tasks/task_cbd40731f8e4/annotate
  review    http://localhost:3000/tasks/task_cbd40731f8e4/review
```

Write down **T2** and **I2**.

| # | Who | Do | Expect |
| --- | --- | --- | --- |
| 2.1 | dana (B) | Open `/tasks/T2/annotate`, open **I2**. Label a word, Notes `dana's answer`. **Submit** | "Submitted for review." |
| 2.2 | frank (B, InPrivate) | Open `/tasks/T2/review`, open I2, **Review** tab | Dana's submission is shown for review, with `dana's answer` — **the Review tab still shows the colleague's work** |
| 2.3 | script | `py sandbox-SCRUM-48.py review T2 I2 dana revise` | `next_ui_status=returned` — there is now reviewer feedback on dana's work that could leak |
| 2.4 | frank (B, InPrivate) | Open DevTools → **Network**, filter `adjustment`. Open `/tasks/T2/annotate`, open I2, **Annotate** tab. **Look before acting** | Notes is **empty** and editable; no span is marked. **No** "… is annotating this item" notice. **No** Reviewer feedback box. **No** request to `…/adjustment` in the Network tab |
| 2.5 | frank (B, InPrivate) | **Item details** tab | Nothing of dana's answer or notes appears |
| 2.6 | frank (B, InPrivate) | Annotate tab: label a word, Notes `frank's answer`. **Save draft** | "Draft saved." |
| 2.7 | frank (B, InPrivate) | **Reload**, open I2, Annotate tab | Notes shows `frank's answer` — his own draft, not dana's |
| 2.8 | frank (B, InPrivate) | **Submit** | "Submitted for review." (2 of 2: dana's returned submission still counts) |
| 2.9 | dana (B) | **Reload**, open I2 | Dana still sees **her own** answer and the Reviewer feedback — the guard for the viewer's own submission |

Before the fix, step 2.4 showed dana's answer read-only under "Dana is annotating this item", with Save
draft disabled, and the Reviewer feedback box showed erin's note on dana's work.

DONE

---

## Part 3 — A refused submission is shown in the API's words (`/annotate`)

I2 now holds two human submissions (dana, frank), and `required_annotators` is 2.

| # | Who | Do | Expect |
| --- | --- | --- | --- |
| 3.1 | script | `py sandbox-SCRUM-48.py queue T2 charlie` | I2 is greyed out for charlie: `can_annotate` false, 2 of 2 |
| 3.2 | charlie (A) | Open `/tasks/T2/annotate`, open I2. Label a word, Notes `charlie's answer`. **Submit** | A red alert, exactly: **"Human annotation submission limit reached for this item (2/2)."** The panel stays open; Notes still shows `charlie's answer`; no "Submitted for review." |
| 3.3 | charlie (A) | **Reload** | I2 is not shown as submitted by charlie |
| 3.4 | script | `py sandbox-SCRUM-48.py show T2 I2` | Two submissions only: dana's and frank's |

**Known, not a failure:** the refused submission leaves charlie's pending draft behind, so I2 may show
"1 working" in the queue (`working_count`). Noted in the PR.

DONE
---

## Part 4 — The same on `/review` and `/items`

Each page loads drafts through different code, so repeat the two checks most likely to regress.

```powershell
py sandbox-SCRUM-48.py new 2
  task      task_14cc178b1237
  item      item_64c082af581b
  annotate  http://localhost:3000/tasks/task_14cc178b1237/annotate
  review    http://localhost:3000/tasks/task_14cc178b1237/review
```

Write down **T3** and **I3**.

| # | Who | Do | Expect |
| --- | --- | --- | --- |
| 4.1 | dana (B) | `/tasks/T3/annotate`, I3: label a word, Notes `dana on T3`. **Submit** | Submitted |
| 4.2 | frank (B, InPrivate) | Open `/tasks/T3/items`, open I3, **Annotate** tab | Empty Notes, no notice, no Reviewer feedback — as 2.4 |
| 4.3 | frank (B, InPrivate) | Open `/tasks/T3/review`, open I3, **Annotate** tab | The same |
| 4.4 | frank (B, InPrivate) | On `/tasks/T3/review`, I3, **Review** tab | Dana's submission shown for review |
| 4.5 | script | `py sandbox-SCRUM-48.py review T3 I3 dana revise` | `returned` |
| 4.6 | dana (B) | Open `/tasks/T3/items`, open I3. Change Notes to `dana rework`. **Save draft**. Close the panel and open I3 again | Notes still `dana rework` |
| 4.7 | dana (B) | **Reload** `/tasks/T3/items`, open I3 | Notes `dana rework` |
| 4.8 | dana (B) | Open `/tasks/T3/review`, open I3, **Annotate** tab | Notes `dana rework` |

DONE
---

## Part 5 — The "leave page?" warning only after an edit

| # | Who | Do | Expect |
| --- | --- | --- | --- |
| 5.1 | charlie (A) | Open `/tasks/T1/annotate`, open I1. Change nothing. **Reload** | No "Leave site? Changes you made may not be saved" dialog — **before the fix it appeared for any opened item** |
| 5.2 | charlie (A) | Open I1, type a character in Notes. **Reload** | The dialog appears. Cancel it, clear the character |

DONE
---

## Part 6 (optional) — The AI-assisted refusal

Needs the local Ollama `llama3`; skip it if Ollama is not running.

```powershell
py sandbox-SCRUM-48.py new 2 --ai
  task      task_32e6e4d98c69
  item      item_7089b8a467c5
  annotate  http://localhost:3000/tasks/task_32e6e4d98c69/annotate
  review    http://localhost:3000/tasks/task_32e6e4d98c69/review
```

| # | Who | Do | Expect |
| --- | --- | --- | --- |
| 6.1 | script | `py sandbox-SCRUM-48.py show task_32e6e4d98c69 item_7089b8a467c5` | An AI submission, item in review |
| 6.2 | charlie (A) | Open the annotate URL, open the item. Label a word, Notes `charlie on AI item`. **Submit** | Red alert, exactly: **"The AI has already annotated this item and it is waiting for review. AI-assisted items take no human annotation."** Panel open, Notes kept |

DONE
---

## Not covered here

- **A judgement task's verdict in Item details** ("No verdict yet" instead of a colleague's verdict): the
  helper script creates text tasks only. Covered by the sheet test `keeps a colleague's verdict out of
  Item details`.
- **Choosing which submission to review** on an item with several: SCRUM-113.

## Results

| Part | Date | Run by | Result | Notes |
| --- | --- | --- | --- | --- |
| 1 — S10 | 2026-09-29 | Hanchen | Pass | Checked against the API: drafts `3f0b…` (submitted), `efc9…` (pending, 1.4), `4a13…` (resubmitted, shown in 1.8). **Found:** "Draft saved." vanished within a frame (1.4) → fixed in `0920587`, a pre-existing bug. Also seen: the resubmission rewrote `ann_3b71…` in place (history shows only v1) — #35's design, recorded in the PR's known limitations |
| 2 — Colleague's draft | 2026-09-29 | Hanchen | Pass | The flicker was seen again on 2.1 before a hard reload (the browser still ran the pre-`0920587` bundle); not seen after |
| 3 — Refusal | 2026-09-29 | Hanchen | Pass | |
| 4 — `/review`, `/items` | 2026-09-29 | Hanchen | Pass | |
| 5 — Leave-page warning | 2026-09-29 | Hanchen | Pass | |
| 6 — AI refusal (optional) | 2026-09-29 | Hanchen | Pass | charlie saw, word for word: "The AI has already annotated this item and it is waiting for review. AI-assisted items take no human annotation." |
