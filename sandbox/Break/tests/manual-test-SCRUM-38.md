# Manual test — every answer is a version, and at most one is authoritative (SCRUM-38 / story F3)

**About 40 minutes.** This checks SCRUM-38 in the running app, on branch `CS57-Hanchen-scrum-38`
(`f089ebb`, all nine commits). It covers `validation.md` §1 of the spec
([`../../../specs/2026-10-02-F3-separate-versioned-outputs/validation.md`](../../../specs/2026-10-02-F3-separate-versioned-outputs/validation.md)):

| Spec check | What it checks | Where |
| --- | --- | --- |
| 1.1 | each output retrievable with role and model | Part 4 |
| 1.2 | a resubmission does not overwrite | Part 1 |
| 1.3 | a re-answer after a reopen is linked | Part 3 |
| 1.4 | at most one authoritative version | Part 2 |
| 1.5 | the export shows authority and supersession | Parts 2 and 4 |
| 1.6 | independence is kept | Part 3 |
| 1.7 | no regression in review, in the web app | Part 1 |

What each kind of check proves:

- **The automated tests** (SQLite 844 passed, PostgreSQL 852, web 327) prove each rule on its own. They
  run against an in-memory or throwaway database, with the API called as functions.
- **This walkthrough** proves the same rules over HTTP, with real logins, on a PostgreSQL database
  migrated by the app. It also proves that the web review panel and queue follow the new version after
  a resubmission (1.7), which no automated test covers.

**Dry run, 2026-10-02.** Every helper command and every expected output below was run once against the
branch, on a throwaway PostgreSQL with an API on :8011. The outputs quoted here are from that run. The
browser steps were stood in for by `submit` there, and are for you to do.

Plan: [`../plans/plan-SCRUM-38.md`](../plans/plan-SCRUM-38.md). Helper:
[`../scripts/sandbox-SCRUM-38.py`](../scripts/sandbox-SCRUM-38.py).

---

## Setup

### 1. Switch branch and reset

```powershell
cd D:\COMP5703_Capstone\hej
git switch CS57-Hanchen-scrum-38
docker compose up -d
docker compose exec -e PYTHONIOENCODING=utf-8 backend uv run python init_data.py --reset   # wipes all dev data
docker compose restart backend
cd apps\hej-api
.venv\Scripts\python ..\..\..\docs\sandbox\tools\seed_test_roles.py                         # charlie, dana, erin, frank, grace
```

**The reset is required.** PRs #46 and SCRUM-38 change the `annotations` schema, and PostgreSQL dev
databases do not migrate. Without the reset, the first submission fails with an `UndefinedColumn` error,
and the web app shows only "Failed to fetch". If that happens, read `docker compose logs backend` first.

Check with a login before opening a browser (expect `200`):

```powershell
curl.exe -s -o NUL -w "%{http_code}`n" -X POST http://localhost:8000/api/v1/auth/login -H "Content-Type: application/json" -d '{\"email\":\"charlie@example.com\",\"password\":\"SecurePass3Charlie\"}'
```

### 2. Accounts and browsers

| Account | Password | Role | Where |
| --- | --- | --- | --- |
| `charlie@example.com` | `SecurePass3Charlie` | annotator | Browser **A** (Chrome) |
| `dana@example.com` | `SecurePass4Dana` | annotator | Browser **B** (Edge) |
| `frank@example.com` | `SecurePass6Frank` | annotator + reviewer | Browser **B, InPrivate** |
| `erin`, `alice` | — | reviewer, admin | helper script only |

Hard-reload each browser once (Ctrl+Shift+R), so that no page from an older branch is cached.

### 3. The helper script

Run it from `D:\COMP5703_Capstone\docs\sandbox\Break\scripts`, with **`py`**:

```powershell
py sandbox-SCRUM-38.py new 2                       # an ACTIVE text task, one item, 2 human submissions
py sandbox-SCRUM-38.py versions <item> [--all] [--as <who>]
py sandbox-SCRUM-38.py history <annotation> [--as <who>]
py sandbox-SCRUM-38.py review <task> <item> <author> <accept|revise|reject> [--as <reviewer>]
py sandbox-SCRUM-38.py reopen <task> <item>
py sandbox-SCRUM-38.py export <task>
py sandbox-SCRUM-38.py mark <annotation>           # inside the backend container: no route until SCRUM-99
py sandbox-SCRUM-38.py ai-answer <item> <provider> <model> <label>   # inside the container: the real submit path
```

`new` activates the task. Since PR #41 a task starts as `draft` and refuses every submission, which is why
the SCRUM-48 helper no longer works for this. `versions` prints one line per version, in this format:

```
  <annotation id>  v<n>  <role>  <author or ai:model>  label=...  <- <derived from> (<why>)  superseded / AUTHORITATIVE
```

---

## Part 1 — a resubmission keeps the returned answer (1.2, 1.7)

```powershell
py sandbox-SCRUM-38.py new 2

Active task, required_annotators=2.
  task      task_26b09979cb45
  item      item_111cc3f9ce7c
  annotate  http://localhost:3000/tasks/task_26b09979cb45/annotate
  review    http://localhost:3000/tasks/task_26b09979cb45/review
```

Write down `task` and `item` as **T1** and **I1**. Open the `annotate` URL the script prints.

| # | Who | Do | Expect |
| --- | --- | --- | --- |
| 1.1 | charlie (A) | Open I1 on `/tasks/T1/annotate`. Label it `sarcastic`. **Submit** | "Submitted for review." |
| 1.2 | dana (B) | Same item: label `sincere`. **Submit** | "Submitted for review." |
| 1.3 | script | `review T1 I1 charlie revise` | `erin revise charlie on ann_…: 200 returned`. Write down that id as **C1** |
| 1.4 | charlie (A) | Reload, open I1 | Status **Returned**, with a **Reviewer feedback** box: "Walkthrough: please redo the label." |
| 1.5 | charlie (A) | Change the label to `sarcastic, mildly`. **Submit** | "Submitted for review." |
| 1.6 | script | `versions I1 --all` | Three lines: C1 `v1 … superseded`, label `sarcastic`; dana's `v1`; charlie's **`v2`**, label `sarcastic, mildly`, `<- C1 (resubmission) ann_9c24fb81805b`. `total_count=2`. Write down v2's id as **C2** ann_28243db0bf96 |
| 1.7 | script | `history C1` | `2 versions`: C1 `v1 … superseded`, then C2 `v2 <- C1 (resubmission)` |
| 1.8 | frank (B InPrivate) | Open `/tasks/T1/review`, open I1, choose **charlie's** submission | It shows **`sarcastic, mildly`**, not `sarcastic`. The returned answer is not offered |
| 1.9 | frank | **Accept** charlie's, with a justification; then choose **dana's** and **Accept** | The item reaches **Approved** / finalised after the second |
| 1.10 | script | `versions I1` | Two lines, C2 and dana's. The accept landed on C2: no refusal and no 404 in 1.9 |

Dry run, steps 1.3–1.7:

```
erin revise charlie on ann_470f6fb7cd60: 200 returned
charlie submitted: 200 annotation_id=ann_b74a002abbd5
item_7ee837ea1fd1 as alice (with superseded): 3 shown, total_count=2
  ann_470f6fb7cd60  v1  annotator charlie          label='sarcastic'            superseded
  ann_6c19441945ba  v1  annotator dana             label='sincere'
  ann_b74a002abbd5  v2  annotator charlie          label='sarcastic, mildly'  <- ann_470f6fb7cd60 (resubmission)
history of ann_470f6fb7cd60 as alice: 2 versions
```

```
DONE 

D:\COMP5703_Capstone\docs\sandbox\Break\scripts>py sandbox-SCRUM-38.py review task_26b09979cb45 item_111cc3f9ce7c charlie revise
erin revise charlie on ann_9c24fb81805b: 200 returned

D:\COMP5703_Capstone\docs\sandbox\Break\scripts>py sandbox-SCRUM-38.py versions item_111cc3f9ce7c --all
item_111cc3f9ce7c as alice (with superseded): 3 shown, total_count=2
  ann_9c24fb81805b  v1  annotator charlie          label=None                   superseded
  ann_1e98fd0995fc  v1  annotator dana             label=None
  ann_28243db0bf96  v2  annotator charlie          label=None                 <- ann_9c24fb81805b (resubmission)

D:\COMP5703_Capstone\docs\sandbox\Break\scripts>py sandbox-SCRUM-38.py history ann_9c24fb81805b
history of ann_9c24fb81805b as alice: 2 versions
  ann_9c24fb81805b  v1  annotator charlie          label=None                   superseded
  ann_28243db0bf96  v2  annotator charlie          label=None                 <- ann_9c24fb81805b (resubmission)

D:\COMP5703_Capstone\docs\sandbox\Break\scripts>py sandbox-SCRUM-38.py versions item_111cc3f9ce7c
item_111cc3f9ce7c as alice: 2 shown, total_count=2
  ann_1e98fd0995fc  v1  annotator dana             label=None
  ann_28243db0bf96  v2  annotator charlie          label=None                 <- ann_9c24fb81805b (resubmission)
```


**What it shows:**
- **1.6 is the defect fixed.** Before SCRUM-38, C1 was rewritten in place to `sarcastic, mildly`, and
  erin's "redo" review pointed at an answer she never saw.
- **1.8 is the regression check.** It shows that the review panel and queue follow the new id.

## Part 2 — one authoritative version, and the export (1.4, 1.5)

Continue on T1 / I1, which is finalised after 1.9. Write down dana's id as **D1**.

| # | Who | Do | Expect |
| --- | --- | --- | --- |
| 2.1 | script | `export T1` | Normalized: C2 `from=C1 (resubmission) authoritative=-`; dana's `from=None`. Legacy: keys are the two user ids, with real names |
| 2.2 | script | `mark C2` | `marked C2 authoritative` |
| 2.3 | script | `mark D1` | `refused: 409 Task item … already has an authoritative version (C2); an item has at most one.` |
| 2.4 | script | `mark C1` | `refused: 409 Annotation C1 has been superseded, so it cannot be the item's authoritative answer…` |
| 2.5 | script | `versions I1` | C2's line ends `AUTHORITATIVE (adjudication_accept)` |
| 2.6 | script | `export T1` | C2 now `authoritative=adjudication_accept` |

Dry run, 2.2–2.5:

```
marked ann_b74a002abbd5 authoritative
refused: 409 Task item item_7ee837ea1fd1 already has an authoritative version (ann_b74a002abbd5); an item has at most one.
refused: 409 Annotation ann_470f6fb7cd60 has been superseded, so it cannot be the item's authoritative answer; only a current version can.
  ann_b74a002abbd5  v2  annotator charlie   label='sarcastic, mildly'  <- ann_470f6fb7cd60 (resubmission)  AUTHORITATIVE (adjudication_accept)
```

```
DONE

D:\COMP5703_Capstone\docs\sandbox\Break\scripts>py sandbox-SCRUM-38.py export task_26b09979cb45
normalized export, every answer:
  ann_28243db0bf96  v2  annotator model=None/None  from=ann_9c24fb81805b (resubmission)  authoritative=-
  ann_1e98fd0995fc  v1  annotator model=None/None  from=None (None)  authoritative=-
legacy export, item_111cc3f9ce7c: keys ['3', '9']
  3                            creator_name=Charlie Davis
  9                            creator_name=Dana

D:\COMP5703_Capstone\docs\sandbox\Break\scripts>py sandbox-SCRUM-38.py mark ann_28243db0bf96
marked ann_28243db0bf96 authoritative

D:\COMP5703_Capstone\docs\sandbox\Break\scripts>py sandbox-SCRUM-38.py mark ann_1e98fd0995fc
refused: 409 Task item item_111cc3f9ce7c already has an authoritative version (ann_28243db0bf96); an item has at most one.

D:\COMP5703_Capstone\docs\sandbox\Break\scripts>py sandbox-SCRUM-38.py mark ann_9c24fb81805b
refused: 409 Annotation ann_9c24fb81805b has been superseded, so it cannot be the item's authoritative answer; only a current version can.

D:\COMP5703_Capstone\docs\sandbox\Break\scripts>py sandbox-SCRUM-38.py versions item_111cc3f9ce7c
item_111cc3f9ce7c as alice: 2 shown, total_count=2
  ann_1e98fd0995fc  v1  annotator dana             label=None
  ann_28243db0bf96  v2  annotator charlie          label=None                 <- ann_9c24fb81805b (resubmission)  AUTHORITATIVE (adjudication_accept)

D:\COMP5703_Capstone\docs\sandbox\Break\scripts>py sandbox-SCRUM-38.py export task_26b09979cb45
normalized export, every answer:
  ann_28243db0bf96  v2  annotator model=None/None  from=ann_9c24fb81805b (resubmission)  authoritative=adjudication_accept
  ann_1e98fd0995fc  v1  annotator model=None/None  from=None (None)  authoritative=-
legacy export, item_111cc3f9ce7c: keys ['3', '9']
  3                            creator_name=Charlie Davis
  9                            creator_name=Dana
```

`mark` stands in for SCRUM-99's Accept, which will call the same helper. The database's own refusal of
a second marker, written around the helper, is covered by an automated test on both databases.

## Part 3 — reopen, re-answer, and independence (1.3, 1.6)

| # | Who | Do | Expect |
| --- | --- | --- | --- |
| 3.1 | script | `reopen T1 I1` | `reopen: 200 pending` |
| 3.2 | script | `versions I1 --all` | Dana's v1 and C2: `superseded by reopen reopen_…`. **No `AUTHORITATIVE` left.** `total_count=0` |
| 3.3 | charlie (A) | Reload, open I1. Label `sincere after all`. **Submit** | "Submitted for review." |
| 3.4 | script | `versions I1 --all` | A **`v3`** for charlie, `<- C2 (reanswer_after_reopen)`. C2 is unchanged and still names the reopen. `total_count=1` |
| 3.5 | script | `versions I1 --all --as dana` | **Only dana's own** superseded v1. Charlie's versions are hidden: dana has not answered the new round |
| 3.6 | script | `history C2 --as dana` | `403 … Other annotators' answers are hidden until you submit your own annotation for this item.` |
| 3.7 | dana (B) | Reload, open I1 | An empty editor of her own. No charlie answer anywhere in the panel (confirmed True, note that in current frontend, dana will have to click on the either Items or Review tab, then only ACTIONsS Review button is available for this item, then click on the Annotate in the work panel) |

Dry run, 3.4–3.6:

```
  ann_b74a002abbd5  v2  annotator charlie  label='sarcastic, mildly'  <- ann_470f6fb7cd60 (resubmission)  superseded by reopen reopen_0a2b2c76f972
  ann_6a51a9ce64b5  v3  annotator charlie  label='sincere after all'  <- ann_b74a002abbd5 (reanswer_after_reopen)
item_7ee837ea1fd1 as dana (with superseded): 1 shown, total_count=1
  ann_6c19441945ba  v1  annotator dana     label='sincere'            superseded by reopen reopen_0a2b2c76f972
403 {'detail': "Other annotators' answers are hidden until you submit your own annotation for this item."}
```

```
DONE

D:\COMP5703_Capstone\docs\sandbox\Break\scripts>py sandbox-SCRUM-38.py reopen task_26b09979cb45 item_111cc3f9ce7c
reopen: 200 pending

D:\COMP5703_Capstone\docs\sandbox\Break\scripts>py sandbox-SCRUM-38.py versions item_111cc3f9ce7c --all
item_111cc3f9ce7c as alice (with superseded): 3 shown, total_count=0
  ann_9c24fb81805b  v1  annotator charlie          label=None                   superseded
  ann_1e98fd0995fc  v1  annotator dana             label=None                   superseded by reopen reopen_5541ec9eb721
  ann_28243db0bf96  v2  annotator charlie          label=None                 <- ann_9c24fb81805b (resubmission)  superseded by reopen reopen_5541ec9eb721

D:\COMP5703_Capstone\docs\sandbox\Break\scripts>py sandbox-SCRUM-38.py versions item_111cc3f9ce7c --all
item_111cc3f9ce7c as alice (with superseded): 4 shown, total_count=1
  ann_9c24fb81805b  v1  annotator charlie          label=None                   superseded
  ann_1e98fd0995fc  v1  annotator dana             label=None                   superseded by reopen reopen_5541ec9eb721
  ann_28243db0bf96  v2  annotator charlie          label=None                 <- ann_9c24fb81805b (resubmission)  superseded by reopen reopen_5541ec9eb721
  ann_d5207ed59d02  v3  annotator charlie          label=None                 <- ann_28243db0bf96 (reanswer_after_reopen)

D:\COMP5703_Capstone\docs\sandbox\Break\scripts>py sandbox-SCRUM-38.py versions item_111cc3f9ce7c --all --as dana
item_111cc3f9ce7c as dana (with superseded): 1 shown, total_count=1
  ann_1e98fd0995fc  v1  annotator dana             label=None                   superseded by reopen reopen_5541ec9eb721

D:\COMP5703_Capstone\docs\sandbox\Break\scripts>py sandbox-SCRUM-38.py history ann_28243db0bf96 --as dana
403 {'detail': "Other annotators' answers are hidden until you submit your own annotation for this item."}
```

## Part 4 — two models answer one item (1.1, 1.5)

```powershell
py sandbox-SCRUM-38.py new 1

Active task, required_annotators=1.
  task      task_09a2d51cfbd4
  item      item_65d449ae1f1b
  annotate  http://localhost:3000/tasks/task_09a2d51cfbd4/annotate
  review    http://localhost:3000/tasks/task_09a2d51cfbd4/review
```

Write down **T2** and **I2**.

| # | Who | Do | Expect |
| --- | --- | --- | --- |
| 4.1 | script | `ai-answer I2 openai gpt-4o-mini sarcastic`, then `ai-answer I2 anthropic claude-haiku sincere` | Two different `ai answer: ann_…` ids. Before SCRUM-38 the second rewrote the first |
| 4.2 | charlie (A) | Open I2 on `/tasks/T2/annotate`, label `sarcastic`, **Submit** | "Submitted for review." |
| 4.3 | script | `versions I2` | Three v1 lines: `ai_model ai:gpt-4o-mini`, `ai_model ai:claude-haiku`, `annotator charlie` |
| 4.4 | script | `review T2 I2 ai:gpt-4o-mini accept --as frank`, the same for `ai:claude-haiku`, then `review T2 I2 charlie accept --as frank` | The last answer gives `approved` |
| 4.5 | script | `export T2` | Normalized: each AI answer with its own `model=provider/name`. Legacy keys: the user id for charlie, plus `ai:anthropic/claude-haiku` and `ai:openai/gpt-4o-mini`, each with `creator_name` = the model. Before SCRUM-38 the legacy export had one `None` key |

Dry run, 4.5:

```
  ann_f3014227e588  v1  ai_model  model=anthropic/claude-haiku  from=None (None)  authoritative=-
  ann_46532ec083b9  v1  ai_model  model=openai/gpt-4o-mini  from=None (None)  authoritative=-
legacy export, item_b7f518888ac0: keys ['3', 'ai:anthropic/claude-haiku', 'ai:openai/gpt-4o-mini']
  ai:openai/gpt-4o-mini        creator_name=openai/gpt-4o-mini
```

```
DONE

D:\COMP5703_Capstone\docs\sandbox\Break\scripts>py sandbox-SCRUM-38.py export task_09a2d51cfbd4
normalized export, every answer:
  ann_4f91082a112c  v1  annotator model=None/None  from=None (None)  authoritative=-
  ann_429a4f5c3b7b  v1  ai_model  model=anthropic/claude-haiku  from=None (None)  authoritative=-
  ann_acdadf5788b0  v1  ai_model  model=openai/gpt-4o-mini  from=None (None)  authoritative=-
legacy export, item_65d449ae1f1b: keys ['3', 'ai:anthropic/claude-haiku', 'ai:openai/gpt-4o-mini']
  3                            creator_name=Charlie Davis
  ai:openai/gpt-4o-mini        creator_name=openai/gpt-4o-mini
  ai:anthropic/claude-haiku    creator_name=anthropic/claude-haiku
```

`ai-answer` writes through `DraftService.submit_draft`, the path the AI batch uses (SCRUM-46), without
calling a model. The batch itself still lets only one model answer an item (`ai_answers_allowed_per_item`
is 1), which is why this is a helper command and not an AI run. A second model running for real is I4's.

---

## Result — passed, 2026-10-03 (Hanchen; checked by Claude)

**Every part passed on the reset PostgreSQL dev database**, at branch head `2f1512e`.

**One display artefact, not a defect.** The helper printed `label=None` for answers submitted in the
browser. The web app stores a classification under `output.label`, and the helper read only a top-level
`label`. This is fixed in the helper. To confirm 1.2 on the stored data, the version chain of
`ann_9c24fb81805b` was read through the API:

```
ann_9c24fb81805b v1 latest=False label='charlie sarcastic'           from=None
ann_28243db0bf96 v2 latest=False label='charlie sarcastic, mildly'   from=ann_9c24fb81805b (resubmission)          reopen=reopen_5541ec9eb721
ann_d5207ed59d02 v3 latest=True  label='charlie sincere after all'   from=ann_28243db0bf96 (reanswer_after_reopen)
reviews on v1: [('revise', 'Walkthrough: please redo the label.')]
```

What this shows:
- The returned answer is unchanged, and the review that returned it is still on it.
- v2's marker was cleared by the reopen.
- v1 carries no reopen link, which is right: it was no longer current when the item was reopened.

The Part 4 export shows that the browser stores `output.label` and the AI path stores `label`. Both are
exported as stored.

**Observation, outside SCRUM-38 (3.7).** On a reopened item, dana could not reach the annotate panel
from `/annotate`. She had to open the item from the Items or Review tab, then choose Annotate in the work
panel. This is the web's available-work entry point, not the versions this PR adds. Raise it with
SCRUM-93 (Kanishka).

## Afterwards

- Note any step that did not match, with its output, under the step.
- Leave the database as it is, or reset it before the next branch. The schema matches `main` once
  SCRUM-38 merges.
- **Wording to correct before the PR:** `total_count` counts current versions, one per author, people
  and models alike. In 4.3 it is 3. `api_surfaces.md` and the list route's comment say "people"; they
  should say "authors".
