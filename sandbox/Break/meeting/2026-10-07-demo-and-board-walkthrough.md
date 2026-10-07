# Client Meeting, 7 October: Demo and Board Walkthrough

How to run tonight's meeting: the agenda, the live demo step by step, and what to show on the Jira board and
the user-story board. The report itself is `2026-10-07-client-progress-report.md`, in this folder.

## Agenda (about 35 minutes)

| # | Part | Time | Material |
| --- | --- | --- | --- |
| 1 | Progress summary | 4 min | The deck, slides 1–8 (https://claude.ai/artifact/XcYcSaxrExYEdB2QJsRfSp) |
| 2 | Live demo | 13 min | Below. One person shares their screen; each ticket's owner speaks to their own step |
| 3 | Jira board | 3 min | Below |
| 4 | User-story board | 2 min | Below |
| 5 | Decisions: issues #40 and #38, then blind-then-reveal | 10 min | Deck slides 9–10; open both issues on screen |
| 6 | Next week and close | 1 min | The report's *Next: W9* |

## Before the meeting (start 90 minutes ahead)

**Everything in the demo is done in the web app; no scripts.** One task, **Task A**, is created live in
step 2 and carries the whole journey through step 5. Only two tasks are prepared beforehand, both in the
web app:

| Task | Made | Used in | State at the start of the demo |
| --- | --- | --- | --- |
| **A**: AG News, live | Live, step 2 | Steps 2–5 | Doesn't exist yet |
| **D**: AG News, AI-assisted | Prep 4 | Step 6 | Items uploaded, not yet activated |
| **S**: AG News, 200 items | Prep 5 | Step 8 (optional) | Active, 200 items |

**Status on 7 October, 19:05:** Prep 1–5 are done on Hanchen's machine:
- Task D is `task_b7649938d9ed`;
- Task S is `task_ec2701537721`.

The project also lists **"zz Provider check (not for the demo)"**: the one-item task that tested the model.
Ignore it. Start from Prep 6. If the database is reset again, redo Prep 3–5 in the web app as written.

All of them go in the seeded **Text Classification Project** (organisation Acme). It runs dual sign-off:
- two approvals per submission;
- 100% cross-review;
- disagreements open a dispute.

Step 4 relies on that.

**One annotator per item.** The task form has no field for the number of required annotators, so every task
made in the web app requires one. The demo uses that limit: two annotators work the same item, the first to
submit fills it, and the platform refuses the second.

Files in this folder:
- `demo-ag-news-6.jsonl`: six AG News records from the client's handoff;
- `demo-ag-news-200.jsonl`: all 200 records;
- `demo-ag-news-labels.json`: the four labels with their definitions.

**Prep 1: code and database.**
1. Check out `main` at `053c541` (#49 merged) or later, and stop the API.
2. From `apps/hej-api`, run `uv run python -X utf8 init_data.py --reset`. #47, #53 and #54 changed the schema.
3. From the repo root, run `npm run dev:all`. The API is on port 8000. The web app is on
   **http://localhost:3001** on Hanchen's machine, because Docker Desktop holds port 3000. The API accepts
   requests from both ports.

**Prep 2: AI provider.** The app has no mock provider; only the harness does. The catalog's default text
model is **`ollama/llama3`**, which runs locally (Ollama on port 11434), so no paid key is needed. It is
tested: it labelled a headline Business, recorded as `author_role: ai_model`, `model_name: llama3`.
- **Warm it up** about five minutes before step 6 with `ollama run llama3 "ready"`. Ollama unloads an idle
  model, and the first call after that is slow.
- Without a working model, step 6 falls back to its harness case.

**Prep 3: second annotator.** Sign in as `alice@example.com` (Administrator).
1. Open **Admin → Acme → Organization members**.
2. On **Test Dispute Participant**, open **Edit roles**, add **Annotator**, then **Save roles**.

Step 3 needs this account as annotator B.

**Prep 4: Task D, AI-assisted, not activated.** As `owner.test@example.com`:
1. **New task** in the project, choosing **AI-assisted** at the form's **Execution mode** step. Upload the
   labels as in step 2.
2. On Setup, pick the model in the **AI model** card and click **Save model**.
3. Upload `demo-ag-news-6.jsonl` as in step 2. **Don't activate:** activation starts the AI run, live in
   step 6.

Test the provider first with a throwaway AI-assisted task of one item.

**Prep 5 (optional): Task S, 200 items.** Make a human-first task, upload `demo-ag-news-200.jsonl` the same
way, and activate it.

**Prep 6: rehearse steps 2–5 once** on a throwaway task, end to end. The finalised item and its export in
step 5 come from the live run, so every click has to work. Delete nothing afterwards; the rehearsal task
simply stays in the list.

**Prep 7: browser windows.** Open one signed-in window per account, in separate profiles or private windows,
so nobody logs in during the demo. Passwords are in the repo README → *Seed demo accounts*.

| Window | Account | Role | Steps |
| --- | --- | --- | --- |
| Admin | `alice@example.com` | Administrator | 1 |
| Owner | `owner.test@example.com` | Task Owner | 1, 2, 5, 6, 8 |
| Annotator A | `annotator.test@example.com` | Annotator | 3 |
| Annotator B | `dispute.test@example.com` | Annotator, from Prep 3 | 3, 4 |
| Reviewer 1 | `bob@example.com` | Reviewer | 4, 6 |
| Reviewer 2 | `reviewer2.test@example.com` | Reviewer | 4 |

Also open a terminal in `apps/hej-api` for step 7.

**Prep 8: boards.** Update the live Jira board; see *Jira board* below.

## Live demo (about 13 minutes)

**Open with one line:** *"We'll follow one headline through the platform: set-up, two annotators, two
independent reviewers, then its history and export. Every answer you'll see is kept as a version of its
own."*

The item used in steps 3–5 is item 3 of the file: **ag_news:train:0002, "Oil and Economy Cloud Stocks'
Outlook"**. Its reference label is Business. It's plausible as World too, which gives the reviewer
something to return.

---

### Step 1: Govern (1.5 min) · Tim, Jingwei

**Goal:** roles are explicit, and the policy is enforced, not just configured.

1. **Admin window:** open **Admin → Acme → Organization members**.
   - Point at the **Roles** column: Test Dispute Participant now holds **Annotator**.
   - Open **Edit roles** on that row to show the dialog, then **Cancel**.
2. **Owner window:** open **Projects → Text Classification Project → Policies**. In the **Project policy**
   card, point at:
   - **Required approvals:** 2;
   - **Independent cross-review:** 100%;
   - **When reviewers disagree:** Open a dispute;
   - **Default annotation mode:** Human-first.
3. Point at the enforced or recorded tag beside each value.

**Say:** *"Rules resolve organisation, then project, then task. Each value says whether the platform
enforces it or only records it. In this project every answer needs two independent approvals."*

**If asked about invitations:** an invitee accepting with the role chosen at invitation is SCRUM-115, in
review as #56.

---

### Step 2: Intake and task set-up (2 min) · Yi, Dishank

**Goal:** a task is defined explicitly, and only the chosen field reaches annotators.

1. **Owner window:** **Text Classification Project → Tasks → New task**. The form has four steps:
   - **Task class:** Annotation.
   - **Execution mode:** Human-first.
   - **Task definition:**
     - title "AG News - live";
     - task type Text, starting template **Text classification**;
     - a short instruction;
     - **Upload labels JSON** → `demo-ag-news-labels.json`. The four labels and their definitions appear.
   - **Launch options:** read the summary line, then **Create Task Draft**.
2. On the task's **Setup** page: **Data intake → Upload files → Choose files** → `demo-ag-news-6.jsonl`.
3. Under **Input projection**, choose **Selected fields** and type `payload_preview.text`. Click **Preview**:
   only the headline text is there, with no `gold_annotations`.
4. Click **Upload and start batch**, then **Open Items**: six items, one per record.
5. On the task home, click **Activate task**. Point at **Pause task** and **Complete task**, but don't click
   them.

**Say:** *"Your answer R1-1: annotators see only the annotation input. The reference labels stay attached to
the record for evaluation, and nothing is hard-coded to one field. The task is a draft until it's activated;
intake happens in draft."*

**If the upload fails:** switch to the rehearsal task from Prep 6 and carry on from step 3 there.

---

### Step 3: Two annotators, one slot (2 min) · Kanishka, Hanchen

**Goal:** annotators serve themselves from a role-checked list, never see each other's work, and the platform
enforces the task's limit, saying why.

Use **Task A**.

1. **Annotator A:** open the **Annotate** tab, the available-work list (#49).
   - Item 3's **Progress** reads **0 of 1**.
   - Open item 3, choose **Business**, then **Save draft**. Don't submit.
2. **Annotator B:** open **Annotate**. Item 3 now reads **0 of 1 · 1 working**: someone is on it, with no
   name.
   - Open item 3. The editor is empty: no sign of A's draft or label.
   - Choose **World**, then **Submit annotation**. The toast says *Submitted for review.*
3. **Annotator A:** refresh **Annotate**. Item 3 reads **1 of 1 submitted**, and its Annotate action is
   greyed out.
   - Open item 3 anyway and click **Submit annotation**. The API refuses, in its own words: *"Human
     annotation submission limit reached for this item (1/1)."*

**Say:** *"Nobody assigns work: people take it from a list filtered by their role, as you decided. Until
you've submitted, you can't see anyone else's answer. This task needs one answer per item, so the first
submission fills it, and the platform refuses the second, and says why."*

**If asked about several answers per item:** the platform enforces any number from 1 to 10, and the list
shows it as "2 of 3". Today it is set only when a task is created through the API. The task form doesn't have
the field yet, and that's the next step.

---

### Step 4: Two independent reviewers (3 min) · Hanchen, Dishank, Parth

**Goal:** a returned answer goes back to its own author to rework, and the second reviewer decides blind.

1. **Reviewer 1 (Bob):** open the **Review** tab. Item 3 reads **1 awaiting review**.
   - Open it. Under **Submissions awaiting your review**, **Choose a submission** lists B's answer. With
     several annotators, each answer is listed here.
2. Click **Adjust**, with the justification *"Oil prices and stock markets: this is Business."* The toast says
   *Returned for adjustment.*
3. **Annotator B:** **Annotate** shows item 3 marked **Rework**. Open it: the panel shows
   **Reviewer feedback** with Bob's note.
   - Change to **Business** and click **Save draft**, then close and reopen the item. The edit is still
     there.
   - Click **Submit annotation**.
4. **Reviewer 1 (Bob):** open item 3 again and **Accept** the resubmission with a one-line justification.
5. **Reviewer 2:** **Review**, open item 3 and choose the submission.
   - Point at **Review history**: Bob's decisions aren't shown.
   - Click **Accept** with a justification. Now Bob's decisions appear.
   - That is the second approval, and item 3 is finalised.

**Say:**
- *"Adjust sends the answer back to its own author, and only that author can redo it."*
- *"The second reviewer can't see the first decision until they've made their own: that's the blind second
  review, and here it is also the second approval this project requires."*
- *"Every decision needs a reason, as you asked in R2-4."*

---

### Step 5: History and versions (1.5 min) · Hanchen, Jingwei

**Goal:** nothing is overwritten, and the record shows how the label got here.

Still **Task A**, owner window.

1. **Finalized** tab: item 3 is there. Click **Export JSON** and open the file. For item 3, point at:
   - `author_role` ("annotator");
   - `is_authoritative: true` on the resubmission;
   - `derivation` and `derived_from_annotation_id`, linking it to B's first answer;
   - `earlier_versions`, holding that first answer, World.
2. Open item 3 and click **Reopen**. Under **Reason for reopening**, type *"Re-check against the updated
   guideline"*, then click **Reopen item**.
3. **History** tab: find the entry **Reopened by the project owner**, with its **Reason:**. Click
   **Show the superseded answers**: the finalised answer is still there, marked **Superseded**.

**Say:** *"B's first answer wasn't overwritten when they redid it: it's an earlier version, linked to the new
one. Your answer R2-3: the project owner reopens, the item goes back to open work, and the finalised answer
is kept as a superseded version."*

---

### Step 6: Assist (1.5 min) · Michael

**Goal:** the AI's first pass goes straight to review as the model's own answer.

Use **Task D**, owner window.

1. On the task home, click **Activate task**. Activation calls llama3 for each of the six items before the
   page returns, so expect a short wait; time it in rehearsal and say it out loud. Fill the wait with the
   "Say" line below.
2. Open **Items**: the six items now read *annotated*. A failed call would show as a failure, never as an
   answer.
3. **Reviewer 1 window: Review** on Task D. Items read **1 awaiting review**.
   - Open one: the answer is the model's.
   - There was no human first pass.
4. In an annotator's **Annotate** list, the same items read **AI-annotated**.

**Don't show the AI run progress panel.** The API runs in its default inline mode, where activation calls the
model directly and creates no batch record, so the panel stays empty. That panel (SCRUM-5) fills in worker
mode only, which needs `HEJ_AI_EXECUTION_MODE=worker` and a separate worker process. That is more moving
parts than tonight is worth. If asked, say batch runs with per-item status and retries exist for large jobs
and run through a background worker.

**Say:** *"Mock and live models are interchangeable behind one typed interface; this is a live one. The answer
is recorded as the model's, with its name and version, and doesn't count toward the human annotators."*

**If there's no provider:** say so, and in step 7 run `uv run python -m evaluation run EV-002` ("AI first pass
waits for a person") instead.

---

### Step 7: Evaluate (1 min) · Jingwei, Hanchen

**Goal:** the workflow is tested end to end, repeatably.

1. In the `apps/hej-api` terminal, run `uv run python -m evaluation list`: four cases, EV-000 to EV-003.
2. Run `uv run python -m evaluation run`: one line per case, all pass.
3. Open the newest JSON report in `evaluation/reports/`: every request each case made is in it.

**Say:** *"Each case runs through the real API as real users, in a fresh database. Next week runs can be
compared against a baseline, and the casebook grows toward 40 cases with your adversarial categories."*

---

### Step 8: Speed (optional, 0.5 min) · Hanchen

Open **Task S**'s **Annotate** tab with DevTools → **Network** open.

Point at a handful of requests and about half a second, against 404 requests and three seconds before #54.
#49 adds the work-list request, so recount the requests in rehearsal and quote what you see.

---

**If time runs short,** drop step 8, then step 6. Keep steps 3–5: they are one item's whole journey.

**Don't demo:**
- disputes and adjudication (paused on #40);
- invitation acceptance (#56), still in review.

If asked, name it as *in review*.

## Jira board (3 minutes)

**Before the meeting:** the export of 6 October is behind `main`. On the live board, move these to Done:

| Ticket | Merged as |
| --- | --- |
| SCRUM-51, SCRUM-52 | #53 |
| SCRUM-119 | #54 |
| SCRUM-41 | #57 |
| SCRUM-93 | #49, merged 7 Oct |

Then check that SCRUM-115, 109, 32 and 87 show In Review where their PRs (#56, #60, #58, #59) are open.

**Show, in this order:**
1. **Mid-semester Break sprint.**
   - Done: SCRUM-5, 38, 68, 110, 116, 117, 120.
   - In progress: SCRUM-99/100 (Yi), paused on #40. Say so plainly and link the issue.
   - Close the sprint after the meeting. Sprints run Thursday to Wednesday evening.
2. **W9 sprint (8–14 Oct).** Show owners and points. The sprint goal is provenance, the canonical answer and
   the release artefact. F1 (SCRUM-98) is the critical path: it was moved forward from W11 so the release
   work in W10 builds on it.
3. **W10 and W11 in the backlog.**
   - Release manifest and gate: SCRUM-104, 105.
   - Expert Gate: SCRUM-118.
   - Item timeline: SCRUM-106.
   - Evaluation measurements: SCRUM-71, 72, 73.

   W11 (22–28 Oct) is the last build sprint.
4. **One ticket opened, as an example: SCRUM-73.** It shows how a client answer becomes a ticket: R1-2 is
   quoted, and blind-then-reveal is stated as an evaluation protocol, not a mode.

## User-story board (2 minutes)

Open `docs/shared/user-stories.html` in Chrome or Edge. Viewing needs no *Connect CSV*. `story_src.csv` was
last synced on 6 October, 22:20.

**Show, in this order:**
1. **The top summary.** 59 stories:
   - 25 done, 17 in progress, 15 not started;
   - 6 set aside (A1, A5, K1–K4).
2. **Stories finished in this period:**
   - B2 project policy, B4 task lifecycle, C2 AI batches, D4 per-submission review, F3 separate versions;
   - B7, B8, D9: the three stories your Round 2 answers added.
3. **Epic I, evaluation.** I1 and I2 are in progress; I3–I5 are planned for W10–W11. Evaluation is a primary
   deliverable in the brief.
4. **C4 and I4.** C4 holds two production modes, and I4 runs blind-then-reveal as an evaluation protocol
   (R1-2). The client sees their own answer recorded in the story.

Don't edit anything on the page during the meeting.

## Decisions (10 minutes)

Open each issue on screen and take the answer in the thread, or write it there straight after the meeting
(the thread is the record).

- **#40: dispute scope.** Walk through Jingwei's two-level diagram, then the four questions in order. If
  Hunter answers only question 1, Yi can restart PR #48 on that alone.
- **#38: a returned AI first pass.** Three options: human rework, AI retry with the reviewer's feedback, or a
  task-policy choice. Stress that such an item is stuck on `main` today.

- **Blind-then-reveal (I4, W10): a mode or a protocol?** Deck slide 10. The project description calls it
  one of three annotation modes, but R1-2 calls it an evaluation protocol, and the plan follows R1-2. Ask
  Hunter to confirm which. If he picks the protocol, also ask:
  - Is it switched on per task?
  - Is it for evaluation runs only, or for live tasks too?

  Neither production mode can host it today: human-first never generates a suggestion, and AI-first has
  no human first pass. There is no GitHub issue for this yet, so open one labelled `QA` after the meeting
  and record the answer there.

## After the meeting

- Write each answer from #40 and #38 into the affected tickets the same day.
- Close the break sprint and start W9.
- Send the minutes with the report attached.
