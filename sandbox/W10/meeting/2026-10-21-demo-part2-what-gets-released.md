# Client Demo, 21 October · Part 2 of 3: What gets released

**Presenter:** Hanchen · **Time:** 5 min · **Built by:** Yi (F5, H6), Michael (H3, H2), Dishank (H4), H1's and
F1's authors

The demo shows only what is new on `main` since the meeting on 14 October, in three parts, each presented
from its own device on its own database, in this order:

| Part | File | Presenter |
| --- | --- | --- |
| 1. Who decides | `2026-10-21-demo-part1-who-decides.md` | Yi (suggested) |
| **2. What gets released** | this file | Hanchen |
| 3. What we can measure | `2026-10-21-demo-part3-what-we-can-measure.md` | Jingwei (suggested) |

**This part starts from the state Part 1 leaves:** step 2.1 traces `b1-05-held-split`, which Part 1 step 1.2
settles, and the optional step traces `a1-05-awaiting-review`, which step 1.3 decides. This device's database
gets that state before the meeting (below). Part 3 checks a release made on its own database, not this one.

## Before the meeting

**Setup** (on each presenter's device; every part runs on its own database):
1. Check out `main` at `f3dfdc1` (#80 merged) or later, and stop the API.
2. From `apps/hej-api`, run `uv run python -X utf8 init_data.py --reset`. It re-creates the seeded `Test: …`
   projects.
3. From the repo root, run `npm run dev:all`. With the Docker stack instead: `docker compose up`, run step 2 as
   `docker compose exec backend python -X utf8 init_data.py --reset`, then `docker compose restart backend`; the
   web app is then on port 3000.

**Prep for this part: Part 1's decisions.** After the setup, do Part 1 steps 1.2 and 1.3 off-screen, in Ivan's,
Bob's and Hannah's windows, as Part 1 describes them. `b1-05-held-split` and `a1-05-awaiting-review` are then
finalised.
- **Rehearse 2.2 and 2.3** on a second database, or reset after and redo the prep. A release can't be undone,
  and the live 2.3 is refused if this state is already released: *"This state is already released as …"*.
- **Checked on a replay of `f3dfdc1` with the prep done:** 2.2 refuses nine items as written, and 2.3 creates
  release version 1. On the seed without the prep, 2.2 refuses ten, `a1-05-awaiting-review` among them.

**Window** (signed in beforehand; password in the repo README → *Seed demo accounts*):

| Window | Account | Role | Steps |
| --- | --- | --- | --- |
| Kevin | `kevin@example.com` | Task owner | all |
| Ivan, Bob, Hannah | `ivan@`, `bob@`, `hannah@example.com` | As in Part 1 | prep only |

## The demo

**Open with:** *"Every link from a single label to a released dataset is now on main. Let's trace the items
we just decided, and then release a task."*

### 2.1 An item's timeline (1.5 min) · F5, PR #85

1. **Test: Dual sign-off, manual review →** the task **"1 submission per item"** **→ Finalized.** Click `b1-05-held-split`: its production
   history opens as a graph.
2. Walk it top to bottom: the source registered, Dana takes the item and answers, Bob's and Fiona's reviews,
   then *"Reviewers disagreed on …; held for manual handling"* (by the Platform) and *"Disagreement settled:
   accepted …"* by Ivan. Each event names its actor: a person, the Platform or a model.
3. Optional: **Test: Single review →** **"1 submission per item: classification"** **→ Finalized**, click `a1-05-awaiting-review`: *"Expert accepted
   the reviewer's correction"*, with Dana's answer marked *Replaced by the accepted correction*.

**Say:** *"This is built from the provenance events: every answer, review and decision is written when it
happens, with who did it, and never edited. It's on the Finalized page for project managers only, so a blind
review stays blind."*

**If the prep didn't finalise `b1-05`,** trace `b1-07-finalised-after-two-approvals` instead: two approvals,
by Bob and Fiona.

### 2.2 The release gate refuses (1 min) · H3, PR #83

1. Still on **"1 submission per item: classification"** **→ Finalized**, scroll to **Releases** and click **Create release**.
2. It's refused: *"The release was not created: The release was refused: 9 item(s) failed the pre-release
   checks. Nothing was created."*, then each of the nine with its reason: **Not finalised**, and for
   `a1-09-open-dispute` also **Held in a dispute, disagreement or reconciliation**.

**Say:** *"The gate runs before anything is written. A release with unreviewed, held, disputed or superseded
items is never made, and it names each one."*

### 2.3 A release and its manifest (2 min) · H1, H2, PRs #65, #84

1. **Test: Task lifecycle → "A completed task (read-only; export it)" → Finalized.** All three items are
   finalised.
2. **Releases → Create release.** The new release opens, marked **Latest**.
3. Point at the manifest fields: **Created by**, **Task guideline version**, **Task policy version**,
   **Resolutions**, the versions covered, **Artefact sha256** and **Manifest sha256**.
4. Point at the three checks: *"Verified: the artefact hashes to its recorded sha256"*, the same for the
   manifest, and *"The artefact agrees with its manifest, line by line"*.
5. Open one item under the release's items to show its timeline *as released*.

**Say:** *"Your R2-5 minimum is in the manifest: the items, the resolution chosen for each, and the guideline,
policy and source versions its answer followed. The release is frozen: change the task afterwards and this
file and its hash never change. Anyone can check it against the manifest without the platform."*

### 2.4 Releases on the Finalized page (0.5 min) · H6, PR #86

Point at the **Releases** list, newest first: these are the task's real releases, not sample data.

**Hand over to Part 3:** *"Jingwei will now show what we can measure, and check a record like tonight's, a
release included."*

**If time runs short,** drop 2.4, then 2.1's optional step. Keep 2.3.

## Not in this part

- **Export JSON** on the Finalized page is a live export, recomputed each time; it isn't a release. Don't mix
  the two up on screen.
- A project in its organisation (#89) is still in review: it merges as W11 opens and is demoed at the W11
  client meeting.
