# Client Demo, 21 October · Part 1 of 3: Who decides

**Presenter:** Yi (suggested) · **Time:** 7 min · **Built by:** Yi (G2, E5), Jingwei (SCRUM-126, J4), Dishank
(D3, E3)

The demo shows only what is new on `main` since the meeting on 14 October, in three parts, each presented
from its own device on its own database, in this order:

| Part | File | Presenter |
| --- | --- | --- |
| **1. Who decides** | this file | Yi (suggested) |
| 2. What gets released | `2026-10-21-demo-part2-what-gets-released.md` | Hanchen |
| 3. What we can measure | `2026-10-21-demo-part3-what-we-can-measure.md` | Jingwei (suggested) |

Part 2 traces the items this part decides, and Part 3 checks a record that holds them. Each part runs on its
own database, so **Hanchen and Jingwei each do steps 1.2 and 1.3 off-screen on theirs before the meeting**;
here they run live.

## Before the meeting

**Setup** (on each presenter's device; every part runs on its own database):
1. Check out `main` at `f3dfdc1` (#80 merged) or later, and stop the API.
2. From `apps/hej-api`, run `uv run python -X utf8 init_data.py --reset`. It re-creates the seeded `Test: …`
   projects.
3. From the repo root, run `npm run dev:all`. With the Docker stack instead: `docker compose up`, run step 2 as
   `docker compose exec backend python -X utf8 init_data.py --reset`, then `docker compose restart backend`; the
   web app is then on port 3000.

**Prep for this part: the Expert Gate project.** The seed has none, so make one in the web app, as Kevin. The
two files it uploads are in Hanchen's `docs` folder, not in the repo: get them from Hanchen first.
1. **Projects → New project:** name it **Demo: Expert Gate**. Keep **Use preset** and choose **Expert-gated
   review**. Create it.
2. In it, **New task**: Annotation, Human-first, task type Text, template **Text classification**, title
   "AG News: Expert Gate". **Upload labels JSON** → `docs/sandbox/W10/meeting/data/demo-ag-news-labels.json`.
   **Create Task Draft.**
3. **Setup → Data intake → Upload files** → `docs/sandbox/W10/meeting/data/demo-ag-news-6.jsonl`. Under
   **Input projection**, choose **Selected fields**, type `payload_preview.text`, then **Upload and start
   batch**. On the task home, **Activate task**.
4. As **Dana**: **Annotate**, answer items 1 and 2 (any label), **Submit annotation** on each. Item 1 is for
   the demo, item 2 the backup.

**Prep for step 1.4: an empty project.** As Kevin, **Projects → New project**, name it **Demo: Archive**, any
preset, and create no task in it: a project archives only once every task is completed, or it has none.

**Rehearse once.** The steps below change seeded items for good; if you rehearse on the demo database, redo
the setup and this prep afterwards.

**Windows** (signed in beforehand; passwords in the repo README → *Seed demo accounts*):

| Window | Account | Role | Steps |
| --- | --- | --- | --- |
| Kevin | `kevin@example.com` | Task owner | 1.1, 1.4 |
| Bob | `bob@example.com` | Reviewer | 1.1, 1.3 |
| Hannah | `hannah@example.com` | Arbitrator (expert) | 1.1, 1.3 |
| Ivan | `ivan@example.com` | Arbitrator and reviewer, touched nothing | 1.2 |

## The demo

**Open with:** *"Three new designs from your R2-8: an expert confirms first, a peer may settle a split, and an
expert may accept a reviewer's correction."*

### 1.1 The Expert Gate (2.5 min) · G2, PR #76

**Goal:** under the Expert Gate, a reviewer's approval doesn't make an item final; an independent expert does.

1. **Kevin:** open **Demo: Expert Gate → Policies**. Point at the posture **Expert gate** and the policy
   version in force.
   - Optional: open **Projects → New project**, open **Policy preset** to show the five presets (Standard
     review; Dual sign-off; Dual sign-off, automatic dispute; Expert-gated review; Arbitration-ready review),
     then leave the form.
2. **Bob:** **AG News: Expert Gate → Review**, open item 1, **Accept** with a one-line justification.
3. Open **Item details**. Point at **Governance posture: Expert gate** and the line *"Under the Expert Gate,
   the accepted answer waits for an independent expert to confirm it."*
4. **Hannah:** the task's **Reconciliation** tab. The item is listed as **expert confirmation**: *1 accepted
   answer awaiting expert confirmation*.
5. Open it, choose **Confirm this answer**, write a reason, **Record expert decision**.
6. **Kevin:** **Finalized** tab: the item is there now, not before.

**Say:** *"However many reviewers accept it, the item waits for an expert. We didn't build a new queue: a held
item is a reconciliation case with one answer, so it gets the same independence check. And no AI answer that
no person reviewed can ever be final, under any posture: that's R2-7."*

**If item 1 goes wrong,** use item 2.

### 1.2 A peer settles a split (2 min) · SCRUM-126, PR #88

**Goal:** under dual sign-off, a split can be settled by an independent reviewer, with a reason, and is
recorded; where an expert must decide, it can't.

1. **Ivan:** open **Test: Dual sign-off, manual review →** the task **"1 submission per item"** **→ Dispute**. `b1-05-held-split` reads
   **Settle or route**: Bob accepted it, Fiona rejected it. (Bob or Fiona would be refused: *"You annotated,
   reviewed or opened a dispute on this item, so you cannot settle its disagreement."*)
2. Open it. Read the policy line: *"This disagreement is held under the manual-review policy. An independent
   reviewer can settle it, or routing opens a formal dispute for independent adjudication."*
3. Under **Settlement decision**, choose **Accept this annotation**, write a reason, **Settle disagreement**.
   The case now reads **Settled disagreement**, with Ivan's name and reason.

**Say:** *"An accept here is the deciding second approval. Under arbitration-ready or the Expert Gate the
same button is refused, because there an expert must decide, and a reviewer's escalation is never settled by
a peer. This is the design we most want your view on."*

**If asked to see the refusal:** don't improvise it. It needs a split under a stricter posture, which no seeded
project has.

### 1.3 An expert accepts a reviewer's correction (1.5 min) · D3, E3, PR #78

**Goal:** a reviewer's correction becomes the answer only when an independent expert accepts it.

1. **Bob:** **Test: Single review →** **"1 submission per item: classification"** **→ Review**, open `a1-05-awaiting-review`
   (*"Start-up raises funding for crop-monitoring drones"*; Dana answered **business**). Change the label to
   **science**, so it is Bob's correction, write a justification, and click **Escalate**.
2. **Hannah:** the task's **Dispute** tab, open the new case. Point at **Reviewer's proposed correction**
   beside the disputed answer.
3. Under the final adjudication decision, choose **Accept reviewer's correction**, write the reason, **Submit
   final decision**. The outcome reads *"The reviewer's correction replaced the disputed answer."*

**Say:** *"The correction is now the answer in force, and Bob stays its author. Dana's answer isn't
overwritten: it stays in the record. Bob could never make his own correction the answer; only an independent
expert can."*

### 1.4 Update and archive a project (1 min) · J4, PR #80

**Goal:** every change to a project is recorded, and an archived project can be read but not changed.

1. **Kevin:** open **Test: Task lifecycle → Project settings → Archive project → Archive**. It's refused: *"A
   project is archived once its work is done; these tasks aren't completed: …"*, naming the draft and paused
   tasks.
2. Open **Demo: Archive → Project settings**. Change the description, **Save changes**. Under **History**,
   the change shows its old and new value.
3. **Archive project → Archive.** The project header now shows **Archived**, and the sheet reads *"This
   project is archived: it can be read, not changed. Restore it to change it."* Every field is disabled.
   Optional: try **New task** in it; the API refuses with the same sentence.
4. **Restore project.** History records the archive and the restore, each with who did it.

**Say:** *"No one's work is cut off: a project archives only once every task is done. Once archived, the API
refuses every write under it, and a test sends every write route, 41 today, so a route added later is covered
too. Archiving never touches a release."*

**Hand over to Part 2:** *"Hanchen will now trace the items we just decided, and release a task."*

## Not in this part

The organisation work, a project in its organisation (#89) and the permission rework (#91), is still in
review: it merges as W11 opens and is demoed at the W11 client meeting. If asked, name it as *in review*.

**If time runs short,** drop 1.4, then 1.1's optional step.
