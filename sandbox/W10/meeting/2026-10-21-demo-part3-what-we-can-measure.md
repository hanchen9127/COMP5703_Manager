# Client Demo, 21 October · Part 3 of 3: What we can measure

**Presenter:** Jingwei (suggested) · **Time:** 5 min · **Built by:** Jingwei (I3, I4, I5)

The demo shows only what is new on `main` since the meeting on 14 October, in three parts, each presented
from its own device on its own database, in this order:

| Part | File | Presenter |
| --- | --- | --- |
| 1. Who decides | `2026-10-21-demo-part1-who-decides.md` | Yi (suggested) |
| 2. What gets released | `2026-10-21-demo-part2-what-gets-released.md` | Hanchen |
| **3. What we can measure** | this file | Jingwei (suggested) |

Step 3.3 checks this device's database. Each part runs on its own database, so this one is given what Parts 1
and 2 write before the meeting (below), and 3.3 checks a record like tonight's, a release included. It comes
last.

## Before the meeting

**Setup** (on each presenter's device; every part runs on its own database):
1. Check out `main` at `f3dfdc1` (#80 merged) or later, and stop the API.
2. From `apps/hej-api`, run `uv run python -X utf8 init_data.py --reset`. It re-creates the seeded `Test: …`
   projects.
3. From the repo root, run `npm run dev:all`. With the Docker stack instead: `docker compose up`, run step 2 as
   `docker compose exec backend python -X utf8 init_data.py --reset`, then `docker compose restart backend`; the
   web app is then on port 3000.

**Prep for this part: Parts 1 and 2's writes.** After the setup, off-screen and in this order:
1. Part 1 steps 1.2 and 1.3, in Ivan's, Bob's and Hannah's windows, as Part 1 describes them.
2. Part 2 step 2.3, as Kevin: **Test: Task lifecycle → "A completed task (read-only; export it)" → Finalized →
   Releases → Create release.** Make it once only.

Leave the blind-then-reveal task untouched: 3.1 runs on it live.

**Prep for this part: the terminal.** Open a terminal in `apps/hej-api`. Before anyone shares a screen, load
the database URL the API uses into the shell, so the password never shows. `.env` gives it as `POSTGRES_*`
parts, not as `DATABASE_URL`, so `source .env` alone leaves `$DATABASE_URL` empty:

```bash
export DATABASE_URL="$(uv run python -c 'from app.core.database import engine; print(engine.url.render_as_string(hide_password=False))')"
```

Then:
- Run `uv run python -m evaluation verify --database-url "$DATABASE_URL"` once after the prep. If it finds
  anything, don't run it live; 3.3 then uses the casebook instead.
- Check the client's dataset folder is on the machine for 3.2's command (`D:/COMP5703_Capstone/dataset` on
  Hanchen's). If it isn't, copy it from Hanchen and change the `--package` path in 3.2 to match. It takes
  about 15 seconds.

**Rehearse 3.1 once** on a second database, or reset after: Charlie's answer on `f1-02` can't be taken back.

**Windows** (signed in beforehand; passwords in the repo README → *Seed demo accounts*):

| Window | Account | Role | Steps |
| --- | --- | --- | --- |
| Charlie | `charlie@example.com` | Annotator | 3.1 |
| Bob | `bob@example.com` | Reviewer | 3.1 (optional), and the prep |
| Kevin | `kevin@example.com` | Task owner | 3.2 (and 2.3 in the prep) |
| Ivan, Hannah | `ivan@`, `hannah@example.com` | As in Part 1 | prep only |

## The demo

**Open with:** *"Evaluation is a primary deliverable in your brief. Three new pieces: the protocol you
described in issue 72, real agreement and AI-quality figures, and checks that read the record afterwards."*

### 3.1 Blind-then-reveal (2 min) · I4, PR #73

1. **Charlie:** **Test: Blind-then-reveal (evaluation) →** the task **"Blind-then-reveal: is this comment
   abusive?"** **→ Judge**, open
   `f1-02-untouched-ai-confidently-wrong` (*"The council's parking plan is a disaster, and the mayor should
   resign over it."*).
2. Choose **not_abusive**, write a one-line rationale, set **How sure are you?**, then **Commit blind
   verdict**.
3. **Reveal AI suggestion:** the AI says abusive, at 95%, with its model.
4. Keep your own verdict, set **How sure are you now?**, **Submit for review**. The step reads **Same as your
   blind verdict**.
5. Optional: open `f1-03-untouched-ai-failed` and reveal: the screen says the AI's suggestion failed, and
   Charlie answers on his own judgement.
6. Optional, **Bob:** **Review**, open `f1-06-awaiting-review`: the review shows Dana's final answer only.

**Say:** *"As you said in issue 72: a setting on judgement tasks, not a third mode. The API itself withholds
the AI's verdict until the blind one is stored, so no screen can leak it. The blind verdict, the suggestion
and the final answer are each kept, none overwriting another. Until real annotators work here, these figures
come from scripted people and only show the pipeline works."*

### 3.2 Agreement and AI quality (1.5 min) · I3, PR #77

1. **Kevin:** open **Test: Single review → Overview** and scroll to **Quality**. On "2 submissions per item:
   classification", **Annotator α** (Krippendorff's alpha) is 0.26 over 4 items; the other tasks have no pairs,
   and say so instead of showing a number.
2. Open **Test: Sampled second review → Overview → Quality**: **Reviewer κ** (Fleiss' kappa) is −0.33 over 2
   cross-reviews, one agreed and one split. A tiny seeded sample: the point is the real coefficient, with its
   count beside it.
3. In the terminal, replay DeepSeek's recorded run over all 400 records:

   ```bash
   uv run python -m evaluation quality --recording evaluation/recordings/deepseek-deepseek-flash-2026-10-19-full.jsonl --package D:/COMP5703_Capstone/dataset
   ```

   It prints the deck's figures: AG News 185/200 = 0.925, Civil Comments 139/199 = 0.6985, ECE 0.04 and
   0.22. **Use the `-full` file with `--package`:** the file without `-full` is the 28-record gold subset,
   and its figures (0.96, 0.71) don't match the slide.

**Say:** *"A model answers your data once, its replies are recorded, and the platform replays them as an
AI-first task with a reviewer on every answer. On Civil Comments both models are about 92% sure and right
only 65 to 70% of the time, so confidence is no reason to skip a person's review."*

### 3.3 The integrity checks (1.5 min) · I5, PR #79

1. In the prepared terminal, run:

   ```bash
   uv run python -m evaluation verify --database-url "$DATABASE_URL"
   ```

2. The last line should read *"… task(s) checked (provenance, releases, roles): nothing found"*. It reads
   this database, which holds Parts 1 and 2's writes from the prep and 3.1's from just now: every step by someone allowed to take it **when they took
   it**, every released item's history complete, and every release rebuilt from its manifest.

**Say:** *"Integrity claimed isn't integrity demonstrated. This reads the record afterwards, read-only, and
anyone outside the team can run it. To prove it catches things, casebook cases tamper with the database the
way an adversary would, deleting an event or forging a review, and it names the item every time."*

**If the prep check wasn't clean,** run the tamper cases instead: `uv run python -m evaluation run EV-116
EV-117 EV-119 EV-120`. EV-116 is an honest run with nothing to find; each of the others plants one fault, and
the check names it.

**If time runs short,** drop 3.1's optional steps, then 3.2's terminal run. Keep 3.3: it closes the demo.

## After the demo

- Take Hunter's view on the three designs (deck slide *"Three design summaries"*) into the GitHub issue thread
  the same evening.
- Each demo device's database now holds decided items, and Parts 2's and 3's a release. Reset each before
  anyone uses the seed again.
