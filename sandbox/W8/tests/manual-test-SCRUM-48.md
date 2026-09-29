# Manual test — work queues, independence and item completion (SCRUM-48 / story D8)

**About 50 minutes, plus 10 for the optional Part 7.** This checks D8, as fixed in PR #35, in the
running app:

- annotators work independently: before submitting, you cannot see another annotator's answer, or a
  reviewer's verdict on it — only how many have submitted;
- an item takes exactly `required_annotators` human submissions, and the annotate queue greys out an
  item you cannot take and says why;
- each submission is reviewed on its own, and one accept does not finalise the item;
- returned and rejected work comes back to its annotator, marked as rework, and holds the item open
  until it is redone;
- (optional) an item the AI annotates goes straight to review and takes no human annotation.

What the automated tests prove, and what this walkthrough proves, are split like this:

- **Tests** (608 passed on SQLite, 614 on PostgreSQL, at `5113d18`) prove the concurrency lock, the
  query counts, and every rule in isolation.
- **This walkthrough** proves the web app still works with those rules: the screens show the right
  things to the right person, and nothing the API now refuses is offered as a button that fails silently.

Branch **`main`** since 2026-09-27: #35 merged into `CS57-KANISHKA`, and #33 into `main` (`ffaac66`). The
browser run of 2026-09-27 was on `CS57-KANISHKA` at `4d3352f`. Since then `main` has taken #37 (policy) and
#36 (annotation surfaces, `judgment_question` → `task_instruction`); the helper and the seed script were
updated for #36 on 2026-09-28. Helper script:
[`../scripts/sandbox-SCRUM-48.py`](../scripts/sandbox-SCRUM-48.py).

**Dry run, 2026-09-27, on `3d4d06d`.** Parts 1–7 were run through the API on a throwaway PostgreSQL 18
database, with the helper script and a stand-in for the web app's submit; Part 7 used the local Ollama
`llama3`. Every expected result below matched. The screens were not run; that is what this walkthrough
is for. (The first dry run, 2026-09-26, was on `38e7f4f` and covered Parts 1–5 only.)

---

## Setup

### 1. Switch branch

```powershell
cd D:\COMP5703_Capstone\hej
git switch main
git pull
```

### 2. Run the app, reset the development database, recreate the test accounts

**Docker Compose (how this machine runs it).** The containers mount the source, so after the switch the
backend reloads (`HEJ_RELOAD=true`) and the web app serves the branch; nothing needs rebuilding.

**The dev database must be reset.** `main` adds `tasks.required_annotators` and `annotations.submitted_at`
(#33/#35), two policy posture columns (#37) and renames task columns (#36), and PostgreSQL has no additive migration, so an existing dev database fails
on its first task or annotation query. Resetting **wipes all dev data**:

```powershell
cd D:\COMP5703_Capstone\hej
docker compose up -d                                                     # postgres :5432, API :8000, web :3000
docker compose exec -e PYTHONIOENCODING=utf-8 backend uv run python init_data.py --reset
docker compose restart backend                                           # see note below
cd apps\hej-api
.venv\Scripts\python ..\..\..\docs\sandbox\tools\seed_test_roles.py       # charlie, dana, erin, frank, grace
```

**Restart the backend after the reset.** Against an old schema the backend's startup backfill fails and the
server exits, while the reloader keeps the port open, so every request is dropped ("Remote end closed
connection"). Found 2026-09-28; the restart picks up the new schema.

Done for the 2026-09-27 run: reset inside the container, accounts recreated, `submitted_at` present.

**Native instead** (if the stack is down): `docker compose up -d postgres`, then
`.venv\Scripts\python init_data.py --reset` and `.venv\Scripts\python main.py` in `apps\hej-api`, and
`npm run dev:web` from `hej` in a second terminal. Do not run both — they share ports 8000 and 3000.

### 3. Accounts and browsers

| Account | Password | Role | Browser |
| --- | --- | --- | --- |
| `charlie@example.com` | `SecurePass3Charlie` | annotator | **A** (Chrome) |
| `dana@example.com` | `SecurePass4Dana` | annotator | **B** (Edge) |
| `erin@example.com` | `SecurePass5Erin` | reviewer | **A, incognito** |
| `frank@example.com` | `SecurePass6Frank` | annotator + reviewer | **B, InPrivate** |

Browsers must not share a login. Two normal windows of the same browser do.

### 4. The helper script

Run it from `D:\COMP5703_Capstone\docs\sandbox\W8\scripts`, with **`py`**. `python` on this machine is
the Microsoft Store stub and does not run. The web app has no queue screen yet (SCRUM-93) and no field
for `required_annotators`, so the script supplies both:

```powershell
py sandbox-SCRUM-48.py new 2                        # fresh item needing 2 human submissions
py sandbox-SCRUM-48.py new 2 --ai                   # the same on an AI-assisted task (Part 7 only)
py sandbox-SCRUM-48.py queue <task> <who>           # what the annotate/review queues offer <who>
py sandbox-SCRUM-48.py peek <task> <item> <who>     # what <who> can read of other people's work
py sandbox-SCRUM-48.py show <task> <item>           # item status and each submission's latest review
py sandbox-SCRUM-48.py review <task> <item> <author> accept|revise|reject   # as erin; <author> may be ai
```

`new` prints the task, the item, and the annotate and review URLs to open. `queue` asks the annotate
queue for unavailable items too, as SCRUM-93's list will: each row shows `can_annotate`, `rework` and
`submitted_by_you`, and the header counts items to take and items greyed out. A queue the person's
role does not allow answers **403** — expected, not a failure (annotators have no review queue, erin
has no annotate queue).

---

## Part 1 — Independence before submitting (item 1)

```powershell
py sandbox-SCRUM-48.py new 2
```

Write down `task` and `item` as **T1** and **I1**.
- task      task_454d32e8e395
- item      item_42efb1aa7246
- annotate  http://localhost:3000/tasks/task_454d32e8e395/annotate
- review    http://localhost:3000/tasks/task_454d32e8e395/review

| # | Who | Do | Expect |
| --- | --- | --- | --- |
| 1.1 | charlie (A) | Open the annotate URL, open I1, type `charlie: supports`, **Submit** | Submitted |
| 1.2 | dana (B) | **Look before acting.** Open I1 | No "charlie is annotating this item" block. Charlie's text appears nowhere. An editor of dana's own |
| 1.3 | — | `peek T1 I1 dana` | Draft list: none. Annotation list: sees none, `total_count=1`. Review read: no submission. Charlie's annotation → **403** |
| 1.4 | — | `queue T1 dana` | Annotate: 1 to take. I1 `1 of 2 submitted`, `can_annotate=True` |
| 1.5 | — | `queue T1 charlie` | Annotate: 0 to take, 1 greyed out. I1 `can_annotate=False`, `submitted_by_you=True` |
| 1.6 | dana (B) | **Reload.** Open I1 again | Still no trace of charlie's answer |
| 1.7 | dana (B) | Type `dana: contradicts`, **Submit** | Submitted |
| 1.8 | — | `peek T1 I1 dana` | Now sees charlie's and her own; charlie's annotation → **200** |

## Part 2 — The item takes exactly two (item 1)

| # | Who | Do | Expect |
| --- | --- | --- | --- |
| 2.1 | — | `queue T1 frank` | Annotate: 0 to take, 1 greyed out — I1 `2 of 2`, `can_annotate=False`, `submitted_by_you=False` (full). Review: I1, `2 of 2`, both submissions awaiting |
| 2.2 | frank (B InPrivate) | Open I1, type an answer, **Submit** | Refused: `Human annotation submission limit reached for this item (2/2).` Nothing is shown as submitted |
| 2.3 | — | `show T1 I1` | Still two submissions: charlie and dana |

## Part 3 — Each submission is reviewed on its own (item 1)

| # | Who | Do | Expect |
| --- | --- | --- | --- |
| 3.1 | erin (A incognito) | Open the review URL, open I1. **Note whose answer the panel shows - I see Dana's dana: contradicts** | One submission, charlie's or dana's |
| 3.2 | erin | Justification `Checked`, **Accept** | Message: `Submission approved. The item stays open until every required submission is in and approved.` The item is **not** shown as approved |
| 3.3 | erin | **Reload** | I1 is still under review, not finalised |
| 3.4 | — | `show T1 I1` | Status `annotated`; one submission `accept`, the other `-` |
| 3.5 | — | `queue T1 erin` | Review: I1, awaiting **only the other** submission. It also shows `1 working`: frank's refused submission from 2.2 left a pending draft (see Observations) |
| 3.6 | — | `review T1 I1 <the other author> accept` | `next_ui_status=approved`, status **`canonicalized`** |
| 3.7 | erin | **Reload** | I1 is finalised |
| 3.8 | charlie (A) | Open I1, try to annotate again | Refused: `Task item … is finalised (canonicalized) and does not accept new annotation work.` |

Step 3.6 uses the script because the review panel shows **one** submission per item and cannot switch
to the other (see Observations).

```
PS D:\COMP5703_Capstone\docs\sandbox\W8\scripts> py sandbox-SCRUM-48.py peek task_454d32e8e395 item_42efb1aa7246 dana
as dana:
  draft list      -> none
  annotation list -> sees none, total_count=1
  review read     -> 200, shows no submission
  GET charlie's annotation -> 403
  charlie's submission has no review yet
PS D:\COMP5703_Capstone\docs\sandbox\W8\scripts> py sandbox-SCRUM-48.py queue task_454d32e8e395 dana
annotate 1 item(s) to take, 0 greyed out
  item_42efb1aa7246  1 of 2 submitted, 0 working, ai=False can_annotate=True rework=False submitted_by_you=False
review   403 You are not authorized to review in organization 2. Required active role: admin, reviewer. Your active organization roles: annotator.
PS D:\COMP5703_Capstone\docs\sandbox\W8\scripts> py sandbox-SCRUM-48.py queue task_454d32e8e395 charlie
annotate 0 item(s) to take, 1 greyed out
  item_42efb1aa7246  1 of 2 submitted, 0 working, ai=False can_annotate=False rework=False submitted_by_you=True
review   403 You are not authorized to review in organization 2. Required active role: admin, reviewer. Your active organization roles: annotator.
PS D:\COMP5703_Capstone\docs\sandbox\W8\scripts> py sandbox-SCRUM-48.py peek task_454d32e8e395 item_42efb1aa7246 dana
as dana:
  draft list      -> ['dana', 'charlie']
  annotation list -> sees ['dana', 'charlie'], total_count=2
  review read     -> 200, shows dana's submission
  GET charlie's annotation -> 200
  charlie's submission has no review yet
PS D:\COMP5703_Capstone\docs\sandbox\W8\scripts> py sandbox-SCRUM-48.py queue task_454d32e8e395 frank
annotate 0 item(s) to take, 1 greyed out
  item_42efb1aa7246  2 of 2 submitted, 0 working, ai=False can_annotate=False rework=False submitted_by_you=False
review   1 item(s)
  item_42efb1aa7246  2 of 2 submitted, 0 working, ai=False awaiting=['ann_2bba77903877', 'ann_275d75ce73e4']
PS D:\COMP5703_Capstone\docs\sandbox\W8\scripts> py sandbox-SCRUM-48.py show  task_454d32e8e395 item_42efb1aa7246
item item_42efb1aa7246: status=annotated
  ann_275d75ce73e4  by dana     latest review: accept
  ann_2bba77903877  by charlie  latest review: -
PS D:\COMP5703_Capstone\docs\sandbox\W8\scripts> py sandbox-SCRUM-48.py queue task_454d32e8e395 erin
annotate 403 You are not authorized to annotate in organization 2. Required active role: admin, annotator. Your active organization roles: reviewer.
review   1 item(s)
  item_42efb1aa7246  2 of 2 submitted, 0 working, ai=False awaiting=['ann_2bba77903877']
PS D:\COMP5703_Capstone\docs\sandbox\W8\scripts> py sandbox-SCRUM-48.py review task_454d32e8e395  item_42efb1aa7246 frank accept
frank has no submission on item_42efb1aa7246
PS D:\COMP5703_Capstone\docs\sandbox\W8\scripts> py sandbox-SCRUM-48.py queue task_454d32e8e395 erin
annotate 403 You are not authorized to annotate in organization 2. Required active role: admin, annotator. Your active organization roles: reviewer.
review   1 item(s)
  item_42efb1aa7246  2 of 2 submitted, 0 working, ai=False awaiting=['ann_2bba77903877']
PS D:\COMP5703_Capstone\docs\sandbox\W8\scripts> py sandbox-SCRUM-48.py review task_454d32e8e395  item_42efb1aa7246 ai accept
ai has no submission on item_42efb1aa7246
PS D:\COMP5703_Capstone\docs\sandbox\W8\scripts> py sandbox-SCRUM-48.py review task_454d32e8e395  item_42efb1aa7246 charlie accept
erin accept charlie: next_ui_status=approved
item item_42efb1aa7246: status=canonicalized
  ann_275d75ce73e4  by dana     latest review: accept
  ann_2bba77903877  by charlie  latest review: accept
```

## Part 4 — Returned work comes back, and holds the item (item 2)

```powershell
py sandbox-SCRUM-48.py new 2
```
- task      task_f7578b94ff61
- item      item_9c085ccfb65f
- annotate  http://localhost:3000/tasks/task_f7578b94ff61/annotate
- review    http://localhost:3000/tasks/task_f7578b94ff61/review

Write these down as **T2** and **I2**. Charlie and dana each submit an answer on I2, as in 1.1 and 1.7.

| # | Who | Do | Expect |
| --- | --- | --- | --- |
| 4.1 | — | `review T2 I2 dana revise` | `next_ui_status=returned`, status `returned` |
| 4.2 | — | `review T2 I2 charlie accept` | `awaiting_other_submissions`. Status stays **`returned`**, because dana's work is out |
| 4.3 | — | `queue T2 dana` / `queue T2 charlie` | Dana: I2 to take, `rework=True`, `submitted_by_you=True`. Charlie: I2 greyed out, `can_annotate=False`, `rework=False` |
| 4.4 | dana (B) | **Reload**, open I2 | Notice: `It was returned from review for adjustment. Open Annotate to revise and resubmit.` Reviewer note: **the feedback on dana's own** submission |
| 4.5 | charlie (A) | **Reload**, open I2 | No returned notice meant for dana, and none of her feedback |
| 4.6 | dana (B) | Edit the answer and **Submit** directly. Do not click Save draft first (S10, fixed in SCRUM-114) | Submitted |
| 4.7 | — | `queue T2 erin` | Review: I2, awaiting dana's submission only |
| 4.8 | — | `review T2 I2 dana accept` | Status **`canonicalized`** |

```
PS D:\COMP5703_Capstone\docs\sandbox\W8\scripts> py sandbox-SCRUM-48.py review task_f7578b94ff61  item_9c085ccfb65f dana revise
erin revise dana: next_ui_status=returned
item item_9c085ccfb65f: status=returned
  ann_9e85155f5d23  by charlie  latest review: -
  ann_1c92b3afed5a  by dana     latest review: revise
PS D:\COMP5703_Capstone\docs\sandbox\W8\scripts> py sandbox-SCRUM-48.py review task_f7578b94ff61  item_9c085ccfb65f charlie accept
erin accept charlie: next_ui_status=awaiting_other_submissions
item item_9c085ccfb65f: status=returned
  ann_9e85155f5d23  by charlie  latest review: accept
  ann_1c92b3afed5a  by dana     latest review: revise
PS D:\COMP5703_Capstone\docs\sandbox\W8\scripts> py sandbox-SCRUM-48.py queue task_f7578b94ff61 dana
annotate 1 item(s) to take, 0 greyed out
  item_9c085ccfb65f  2 of 2 submitted, 0 working, ai=False can_annotate=True rework=True submitted_by_you=True
review   403 You are not authorized to review in organization 2. Required active role: admin, reviewer. Your active organization roles: annotator.
PS D:\COMP5703_Capstone\docs\sandbox\W8\scripts> py sandbox-SCRUM-48.py queue task_f7578b94ff61 charlie
annotate 0 item(s) to take, 1 greyed out
  item_9c085ccfb65f  2 of 2 submitted, 0 working, ai=False can_annotate=False rework=False submitted_by_you=True
review   403 You are not authorized to review in organization 2. Required active role: admin, reviewer. Your active organization roles: annotator.
PS D:\COMP5703_Capstone\docs\sandbox\W8\scripts> py sandbox-SCRUM-48.py queue task_f7578b94ff61 erin
annotate 403 You are not authorized to annotate in organization 2. Required active role: admin, annotator. Your active organization roles: reviewer.
review   1 item(s)
  item_9c085ccfb65f  2 of 2 submitted, 0 working, ai=False awaiting=['ann_1c92b3afed5a']
PS D:\COMP5703_Capstone\docs\sandbox\W8\scripts> py sandbox-SCRUM-48.py review task_f7578b94ff61  item_9c085ccfb65f dana accept
erin accept dana: next_ui_status=approved
item item_9c085ccfb65f: status=canonicalized
  ann_9e85155f5d23  by charlie  latest review: accept
  ann_1c92b3afed5a  by dana     latest review: accept
```
## Part 5 — Reject means redo (item 3)

- task      task_a61ad520c0af
- item      item_fcaa0b965d5c
- annotate  http://localhost:3000/tasks/task_a61ad520c0af/annotate
- review    http://localhost:3000/tasks/task_a61ad520c0af/review

Repeat Part 4 on a fresh item (`new 2`, **T3/I3**), with `reject` in place of `revise` at 4.1.

- After the reject, and after charlie's accept, the status is **`rejected`**.
- Dana's browser shows `It was rejected in review. Open Annotate to revise and resubmit.`
- `queue T3 dana`: I3 to take, `rework=True`.
- After she resubmits and erin accepts, the status is **`canonicalized`**.

## Part 6 — A reviewer's verdict on a peer stays hidden too (item 4)

Added for `478f773b`: the reviews of a submission follow the same independence rule as the submission.

```powershell
py sandbox-SCRUM-48.py new 2
```
- task      task_6cece1cb3dc3
- item      item_158dfbd7fb7b
- annotate  http://localhost:3000/tasks/task_6cece1cb3dc3/annotate
- review    http://localhost:3000/tasks/task_6cece1cb3dc3/review

Write these down as **T4** and **I4**.

| # | Who | Do | Expect |
| --- | --- | --- | --- |
| 6.1 | charlie (A) | Open I4, type an answer, **Submit** | Submitted |
| 6.2 | — | `review T4 I4 charlie revise` | `next_ui_status=returned`, status `returned` |
| 6.3 | dana (B) | **Before submitting**, open I4 | No returned notice, no reviewer note, and nothing of charlie's answer |
| 6.4 | — | `peek T4 I4 dana` | Charlie's annotation → **403**; charlie's review list → **403**; charlie's review → **403** |
| 6.5 | dana (B) | Type an answer, **Submit** | Submitted |
| 6.6 | — | `peek T4 I4 dana` | The same three reads → **200** |

```
PS D:\COMP5703_Capstone\docs\sandbox\W8\scripts> py sandbox-SCRUM-48.py peek task_6cece1cb3dc3 item_158dfbd7fb7b dana
as dana:
  draft list      -> none
  annotation list -> sees none, total_count=1
  review read     -> 200, shows no submission
  GET charlie's annotation -> 403
  GET charlie's review list -> 403
  GET charlie's review -> 403
PS D:\COMP5703_Capstone\docs\sandbox\W8\scripts> py sandbox-SCRUM-48.py peek task_6cece1cb3dc3 item_158dfbd7fb7b dana
as dana:
  draft list      -> ['dana', 'charlie']
  annotation list -> sees ['dana', 'charlie'], total_count=2
  review read     -> 200, shows dana's submission
  GET charlie's annotation -> 200
  GET charlie's review list -> 200
  GET charlie's review -> 200
  ```
## Part 7 (optional) — An AI-annotated item goes straight to review (item 5)

Added for `df1893cb`: on an AI-assisted task, registration submits a successful AI result at once, in
the default inline mode. Needs Ollama running with `llama3` (`ollama list`); the `new` call waits for
the model, up to a minute. Skip this part if Ollama is not available — the automated tests cover the path.

```powershell
py sandbox-SCRUM-48.py new 2 --ai
```

- task      task_ed06e1af32b2
- item      item_3ed470d44bb7
- annotate  http://localhost:3000/tasks/task_ed06e1af32b2/annotate
- review    http://localhost:3000/tasks/task_ed06e1af32b2/review

Write these down as **T5** and **I5**. The output should say `mode=ai_assisted, item status=annotated`.
If it says `pending`, the AI call failed: check that Ollama is running, and try again.

| # | Who | Do | Expect |
| --- | --- | --- | --- |
| 7.1 | — | `show T5 I5` | Status `annotated`; one submission by `AI/unowned`, no review |
| 7.2 | — | `queue T5 charlie` | Annotate: 0 to take, 1 greyed out — I5 `0 of 2`, `ai=True`, `can_annotate=False` |
| 7.3 | charlie (A) | Open the annotate URL, open I5, type an answer, **Submit** | Refused: `The AI has already annotated this item and it is waiting for review. AI-assisted items take no human annotation.` Nothing is shown as submitted |
| 7.4 | — | `queue T5 erin` | Review: I5, awaiting the AI's submission |
| 7.5 | erin (A incognito) | Open the review URL, open I5 | The AI's answer is shown for review. (The panel names no author for any submission, so nothing says "AI" yet) |
| 7.6 | erin | Justification `Checked`, **Accept** | I5 is finalised; `show T5 I5` says **`canonicalized`** |

---

## Results

Fill in on the day. Mark each step ✅ or ❌, and give the step number and what happened for any ❌.

| Part | Result | Notes |
| --- | --- | --- |
| 1 Independence |✅| |
| 2 Limit |✅| |
| 3 Per-submission review |✅| |
| 4 Return and rework |✅| |
| 5 Reject and rework |✅| |
| 6 Peer reviews hidden |✅| |
| 7 AI-annotated item (optional) |✅ | |

## Findings from the browser run (2026-09-27, `CS57-KANISHKA` at `4d3352f`)

Every expected result held (table above). The dev database's review history shows three things the
steps did not ask about, none of which breaks a step or corrupts a result:

1. **Repeated accepts are recorded.** On I1, erin accepted dana's submission three times and frank three
   more (the panel still offers Accept after an accept, and shows the same submission, so frank could
   not reach charlie's). Under single sign-off the review action refuses neither a second approval by the
   same reviewer nor a decision on a submission that no longer awaits review, so the history holds six
   approvals of one answer. Same root as Yi's two pre-existing points on #33 (a non-accept self-review, a
   review reopening a canonicalized item): the review action does not apply the queue's rule
   (`awaits_review_by`).
2. **An approved answer can be resubmitted.** On I3, charlie resubmitted his answer 44 s after erin
   accepted it: the item was `rejected` (dana's work), and the panel offers the editor on that status to
   every annotator. The API lets an existing contributor resubmit at any time. Commit 17 handled it
   correctly — the old approval no longer counted, and erin had to approve the new answer.
3. **A submission sets the item to `annotated` even while another submission is back with its author.**
   On I4, charlie's submission was returned, dana then submitted, and the item reads `annotated`.
   `_advance_task_item_to_annotated_on_submit` ignores the other submissions; an accept recomputes the
   status (`item_status_after_accept`) but a submission does not. The queues are unaffected (they read
   review states), but the item's status, the panel's notices and SCRUM-89's figures read it.

## Observations from the dry runs (not failures of this PR)

- **The review panel cannot choose between submissions.** It shows the draft `selectDraftForViewer`
  picks, and since #34 it sends that draft's `annotation_id`, so the decision lands on what is shown.
  But the reviewer cannot move on to the other submission on the same item. The review queue already
  returns `awaiting_review_annotation_ids`; choosing among them is SCRUM-113 (break).
- **A refused submission leaves a pending draft, which counts as "working".** After 2.2, frank still
  holds a pending draft on the full item, and `working_count` counts him from then on (3.5 shows
  `1 working`). Drafts are deliberately uncapped. SCRUM-93's description already says to hide
  "working" on a full item.
- **No queue screen yet.** Every queue check here goes through the script until SCRUM-93.

## Cleanup

Nothing to undo. Each run creates its own tasks in the "Draft Ownership Sandbox" project. Deleting a
task that has items fails (issue 30), so leave them.
