# Manual test: a task's drafts in one request (SCRUM-119, story A6)

**About 30 minutes.** This checks SCRUM-119 in the running app, on branch `CS57-Hanchen-scrum-119`:

- **one request:** opening a task's Items, Annotate or Review page reads drafts with one
  `GET /tasks/{id}/drafts`, and no `GET /task-items/{id}/drafts` per item;
- **independence:** an annotator who hasn't answered an item gets no colleague's draft for it in that
  response, and gets them once they have answered;
- **fresh data:** a draft saved on one tab is still there after switching tabs or reloading;
- **reviewers:** a reviewer's response holds every draft;
- **history:** the history drawer still loads (its query now has an index);
- **Yi's review (2026-10-06):** the batch lists an item's drafts in the per-item route's order, and an item
  registered while the batch reads can't make it fail (Part 5).

What the automated tests prove, and what this walkthrough proves:

- **Tests** prove the batch matches the per-item route item for item, for a reviewer and both annotators,
  including an answer from before a reopen; that its statement count doesn't grow with the items; and that the
  shell and both tabs send one request and apply its result as before. Since Yi's review, they also prove that
  drafts with equal times come in one order on both routes, and that an item registered just before the
  statement that reads drafts comes with its draft instead of a `500` (the test forces the timing).
- **This walkthrough** proves it in the browser: the requests the pages really send, and that the panel shows
  the same drafts it showed before. It cannot hit the intake race by hand, since the window is one statement
  wide, so Part 5 runs that test on PostgreSQL, where the race existed.

Plan: [`../plans/plan-SCRUM-119.md`](../plans/plan-SCRUM-119.md). Helper script:
[`../../W8/scripts/sandbox-SCRUM-48.py`](../../W8/scripts/sandbox-SCRUM-48.py).

---

## Setup

### 1. Switch branch

```powershell
cd D:\COMP5703_Capstone\hej
git switch CS57-Hanchen-scrum-119
```

The branch adds two indexes. `create_all` doesn't add them to an existing PostgreSQL database, and nothing
depends on them being there, so **no reset is needed** for this walkthrough.

### 2. Run the app

```powershell
docker compose up -d
docker compose restart frontend
```

Then hard-reload every browser (Ctrl+Shift+R). Turbopack doesn't see file changes on the Windows bind mount, so
the web container must restart after a branch switch. Check it compiled this branch:

```powershell
docker compose exec frontend sh -c 'grep -rl "useTaskDraftsRefresh" /workspace/apps/hej-web/.next | wc -l'   # > 0
```

### 3. Accounts and browsers

| Account | Password | Role | Browser |
| --- | --- | --- | --- |
| `charlie@example.com` | `SecurePass3Charlie` | annotator | **A** (Chrome) |
| `dana@example.com` | `SecurePass4Dana` | annotator | **B** (Edge) |
| `erin@example.com` | `SecurePass5Erin` | reviewer | **A, incognito** |

Keep **DevTools → Network** open in each, filtered to `drafts`, with "Preserve log" off.

### 4. A fresh task

From `D:\COMP5703_Capstone\docs\sandbox\W8\scripts`:

```powershell
py sandbox-SCRUM-48.py new 2      # classification task, 2 human submissions per item
```

Write down the task id as **T1** and the item id as **I1**.

---

## Part 1: one request per page

| # | Who | Do | Expect |
| --- | --- | --- | --- |
| 1.1 | charlie (A) | Open `/tasks/T1/items` | Network: **one** `drafts` request, `GET /api/v1/tasks/T1/drafts`, status 200. No `/task-items/…/drafts` |
| 1.2 | charlie | Click the **Annotate** tab | **One more** `GET /tasks/T1/drafts` (the tab's refresh). Still no `/task-items/…/drafts` |
| 1.3 | erin (A, incognito) | Open `/tasks/T1/review` | Two `GET /tasks/T1/drafts` (the shell's and the tab's refresh), no per-item ones |
| 1.4 | any | Click one `GET /tasks/T1/drafts` → **Response** | `{"task_id": "T1", "drafts_by_item": {…}}`, with **every** item of T1 as a key, `[]` for an item with no draft |

## Part 2: independence

| # | Who | Do | Expect |
| --- | --- | --- | --- |
| 2.1 | charlie (A) | `/tasks/T1/annotate`, open I1, label `charlie draft`. **Save draft** (don't submit) | Saved. Network: a `POST …/drafts` and, from the save path, one `GET /task-items/I1/drafts`. That one is expected |
| 2.2 | dana (B) | Open `/tasks/T1/annotate`. In Network, open `GET /tasks/T1/drafts` → Response → `drafts_by_item.I1` | **No draft with charlie's `created_by`**: only the unclaimed placeholder, if any |
| 2.3 | dana | Open I1 in the panel. **Look before acting** | The panel shows no trace of `charlie draft` and no "Charlie" |
| 2.4 | dana | Label `dana answer`. **Submit** | Submitted |
| 2.5 | dana | Reload the page. Open `GET /tasks/T1/drafts` → `drafts_by_item.I1` | **Now charlie's draft is listed**: dana has answered I1. (The panel still shows only her own work, as before SCRUM-119) |
| 2.6 | dana | Same response, any **other** item | No draft of charlie's on it: answering I1 opened I1 only |

## Part 3: fresh data across tabs

| # | Who | Do | Expect |
| --- | --- | --- | --- |
| 3.1 | charlie (A) | On `/tasks/T1/annotate`, open I1 | The panel shows `charlie draft` (saved in 2.1) |
| 3.2 | charlie | Change the label to `charlie draft 2`. **Save draft** | Saved |
| 3.3 | charlie | Click **Items**, then **Annotate** again, open I1 | `charlie draft 2` |
| 3.4 | charlie | Reload (F5), open I1 | `charlie draft 2` |

## Part 4: reviewers, and the history drawer

| # | Who | Do | Expect |
| --- | --- | --- | --- |
| 4.1 | erin (A, incognito) | Reload `/tasks/T1/review`. `GET /tasks/T1/drafts` → `drafts_by_item.I1` | Both charlie's and dana's drafts: a reviewer sees every draft |
| 4.2 | erin | Open I1, **Review** tab | Dana's submission is offered for review, as before |
| 4.3 | erin | Open the task's **History** drawer | It loads, newest first, with the events above (saved, submitted) |

## Part 5: Yi's review — one order, one snapshot

Added 2026-10-06 for the fixes to Yi's review of #54.

| # | Who | Do | Expect |
| --- | --- | --- | --- |
| 5.1 | erin (A, incognito) | On `/tasks/T1/review`, open I1. In Network, find a `GET /task-items/I1/drafts` (open I1 in the panel if none is listed) and the last `GET /tasks/T1/drafts`. Compare the per-item response's `drafts` with the batch's `drafts_by_item.I1` | **The same draft ids, in the same order** |
| 5.2 | erin | Same batch response | Every item of T1 is a key, `[]` for an item with no draft (as in 1.4: the read is now one join, and an item without drafts must still appear) |
| 5.3 | — | Run the two review-fix tests on PostgreSQL (below) | `2 passed` |

For 5.3, start the local PostgreSQL 18 service from an **administrator** PowerShell, then point the test
fixture at a throwaway database (never the development one, which the tests would write into):

```powershell
Start-Service postgresql-x64-18
cd D:\COMP5703_Capstone\hej\apps\hej-api
$env:DATABASE_URL = "postgresql+psycopg://<user>:<password>@localhost:5432/<throwaway_db>"
uv run pytest -q tests/test_task_drafts_read.py -k "same_moment or registered_during"
Remove-Item Env:DATABASE_URL
```

Run the whole file the same way without `-k` if time allows (`12 passed`). CI runs it on PostgreSQL on every
push as well.

## If something fails

Note the step, the request and its response body, and the console. For a wrong draft list, also run:

```powershell
py sandbox-SCRUM-48.py show T1 I1
```

so the item's real submissions can be compared with what the response holds.
