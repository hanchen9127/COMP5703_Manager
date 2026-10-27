# Final demo video: workflow, run-sheet and plan (26/10)

> **Long-form reference, about 28 minutes.** The unit's requirement is a 5–10 minute video, so the submission is
> the cut in [`submission-video-plan.md`](submission-video-plan.md). Use this file for click paths, fallbacks, the
> item budget and the preparation; use that one for what goes in the video and when.

The end-to-end demonstration for the final presentation (about Fri 30 Oct): the whole platform on one database,
through the four governance models, the admin and owner actions, trace and release, and the evaluation.

**Status:** plan, not yet rehearsed. Every click path below is read from the specs and the code on `main`
(`69517818`, 26/10); none has been walked in a browser. The dry run (§9) confirms or corrects each one.
**Decisions** D1–D5 (§2) are Jingwei's and still open; the plan follows each recommendation until they are made.

Built on: the K4 story (the demo works when it matters), the 21/10 client demo (`tools/demo/data/part1–3.md`), the 21/10
evaluation run-sheet (`implementation/2026-10-21-evaluation-demo-plan-and-run-sheet.md`) and its helpers in `tools/demo/`.

---

## 1. What moved since the 21/10 demo (and breaks the old material)

| Change | Effect on the demo |
| --- | --- |
| #91 (G1): an administrator oversees and releases but does not judge | Alice (admin) has no annotate/review actions. The forged-approval finding reads `'review'`, not `'approve'`. The 21/10 teleprompter says `'approve'`: change it. |
| #97 (SCRUM-128): every page tidied; role-correct views | Click paths and labels differ from the 21/10 clips. "Dual sign-off, automatic dispute" is no longer offered in New project (the backend still has it). |
| #94: review chips removed | The old warning "don't click the lowercase `accept` chip" no longer applies. |
| #95, #96 (A3): one seeded project per governance model, on real AG News / Civil Comments records | The four governance chapters run on these, not on the `Test: …` A–F projects. |
| #99 (C1): a confidence is the model's, shown where it judges | Confidence belongs to judgement tasks (the blind-then-reveal task). Don't promise it on a classification task. |
| #102 (SCRUM-134): the legacy item escalations and `expert_send_back` are gone | No behaviour change, but **a database written before it must be re-seeded** (`init_data.py --reset`). |
| #101, #103 (handover sweep), #104 (reopen history shows reason, cause, superseded answers) | Merged 25–26/10. Nothing to wait for before the freeze. |
| Casebook | 88 cases (86 on 21/10; EV-131 and EV-132 came with #91). Re-measure every count on the frozen build. |

Old recordings (`Demo Video/Blind-Then-Reveal.mp4`, `Quality-Check.mp4`) predate all of this, and Quality-Check goes
black after 1:00. Re-record both (D4).

## 2. Open decisions (Jingwei's; recommendation first)

| # | Decision | Recommendation | Alternative |
| --- | --- | --- | --- |
| D1 | Length | Full chaptered cut (~28 min) plus a ~6 min highlight cut | One ~15 min cut |
| D2 | Narration | Jingwei narrates every chapter; one teleprompter per chapter | One narrator per area |
| D3 | AI first pass (chapter 2) | Run llama3 live, with a pre-run fallback | Show only the recorded result |
| D4 | Old evaluation clips | Re-record both | Reuse and patch |
| D5 | Chapter 3: which split is settled, which routed | Ivan settles one, Julia routes the other (shows both paths) | Settle only |

## 3. The video at a glance

One continuous build on one fresh database (`hej_demo`), cut into chapters. The device that ties the four models
together: **"Bob accepts an item"**, and what happens next depends on the project's governance model.

| # | Chapter | Min | Accounts | Project / data |
| --- | --- | --- | --- | --- |
| 0 | The question and the ladder | 1:00 | slide | none |
| 1 | Govern: admin and owner | 3:30 | Alice, Kevin | Acme; a new `Demo:` project |
| 2 | Standard model, with the AI first pass | 4:00 | Kevin, Dana, Bob, Fiona | the new project; `Test: Sampled second review` |
| 3 | Dual sign-off | 3:00 | Dana, Bob, Fiona, Ivan, Julia, Hannah | `Test: Dual sign-off` |
| 4 | Expert gate | 2:30 | Dana, Bob, Hannah, Kevin | `Test: Expert-gated review` |
| 5 | Arbitration-ready | 3:30 | Dana, Bob, Fiona, Hannah, Ivan | `Test: Arbitration-ready review` |
| 6 | Trace and release | 3:30 | Kevin (Alice for one beat) | items from chapters 3–5; `Test: Single review`; `Test: Task lifecycle` |
| 7 | Evaluation | 6:00 | Charlie, Dana, Bob, Kevin + terminal | `Test: Blind-then-reveal (evaluation)` |
| 8 | Limits and close | 0:45 | none | none |

Recording order is the table's order: chapter 7's `verify` reads the work done in chapters 1–6, so it must come last.

**Highlight cut (~6 min):** ch 0 (0:30) · ch 2 AI suggestion and accept (1:00) · one contrasting moment each from ch 3, 4
and 5 (3 × 0:50) · ch 6 release and manifest (1:00) · ch 7 forged approval caught (1:00).

## 4. Cast

Seed accounts, all in Acme (password: repo `README.md` → *Local login*). Run one browser profile or window per person,
signed in beforehand, browser language English.

| Person | Login | Role | Used in |
| --- | --- | --- | --- |
| Alice Chen | `alice@example.com` | Admin | 1, 6 |
| Kevin O'Brien | `kevin@example.com` | Task owner | 1, 2, 4, 6, 7 |
| Dana Park | `dana@example.com` | Annotator | 2–5, 7 |
| Charlie Davis | `charlie@example.com` | Annotator | 7 |
| Bob Johnson | `bob@example.com` | Reviewer | 2–5, 7 |
| Fiona Garcia | `fiona@example.com` | Reviewer | 2, 3, 5 |
| Ivan Novak | `ivan@example.com` | Arbitrator and reviewer, touched nothing | 3, 5 |
| Hannah Kim | `hannah@example.com` | Arbitrator (expert) | 3, 4, 5 |
| Julia Rossi | `julia@example.com` | Dispute participant | 3 |

Independence is part of the story: nobody reviews or decides work they took part in, admins included.

## 5. Item budget

Each governance task holds 7 untouched real records. They are used once per seed, so a retake needs a restore (§8).

| Chapter | Project → task | Items used | What happens |
| --- | --- | --- | --- |
| 2 | new `Demo:` project → AI-assisted task | the 6 records of `demo-ag-news-6.jsonl` | 2–3 worked live; the rest left |
| 2 | `Test: Sampled second review` (50% sample) | `d1-sampled-awaiting-second` | blind second review as Fiona |
| 3 | `Test: Dual sign-off` → AG News topic | item A | two approvals, final |
| 3 | same | item B | Bob accepts, Fiona rejects: held; Ivan settles |
| 3 | same | item C | split; Julia routes; Hannah decides |
| 4 | `Test: Expert-gated review` → AG News topic | `ag_news:train:0129` (already waiting) | Hannah confirms |
| 4 | same | one fresh item | Dana answers, Bob accepts: waits |
| 5 | `Test: Arbitration-ready review` → AG News topic | `ag_news:train:0150` (already in a dispute) | Hannah decides |
| 5 | same | fresh item 2 | split opens a dispute at once; Ivan decides |
| 5 | same | fresh item 3 | Bob's correction; Hannah accepts it |
| 6 | `Test: Single review` | `a1-12-finalised` | Kevin reopens |
| 6 | same | the "1 submission per item: classification" task | release refused |
| 6 | `Test: Task lifecycle` | "A completed task" | release created |

**The Standard project's 10% sample can't be staged:** an answer is drawn from a hash of its own id, which doesn't exist
until it is saved, so none of the seven may be drawn. Cross-review is shown on `Test: Sampled second review` (50%).

## 6. Run-sheet, chapter by chapter

Format: **Goal** · steps as *account → path* · **Say** (the gist; the spoken lines go in per-chapter teleprompter files,
§11) · **If it goes wrong**.

### Chapter 0: the question and the ladder (1:00)

Slide, then the ladder:

| Model | Authority an item needs before it is canonical |
| --- | --- |
| Standard | one reviewer's approval (a 10% sample also gets a blind second review) |
| Dual sign-off | two independent approvals; a split is held, then settled or disputed |
| Expert gate | an independent expert's confirmation of every item |
| Arbitration-ready | if a dispute occurs, it must be closed by independent adjudication |

**Say:** the goal is not faster annotation; it is that a released dataset can answer *how did this label get here* and
refuses to release when it cannot. These four models differ only in who has to agree before an item is final.

### Chapter 1: govern (3:30)

**Goal:** an organisation, who is in it and what they may do; a project created under a governance preset; a task
configured and activated.

1. **Alice** → Dashboard → Organizations → Acme → **Admin → Members**: the member count, search, **Create user**,
   the invite dialog and pending invitations, a member's roles dialog (suspend / remove shown, not used).
2. Organisation policy defaults (the org policy section).
3. Alice opens a project: she sees the work and the releases, and is **not offered** Annotate or Review (#91,
   EV-131). *Confirm in the dry run exactly what she sees.*
4. **Kevin** → Projects → **New project**: choose the organisation, open **Policy preset**: four presets (Standard,
   Dual sign-off, Expert-gated, Arbitration-ready), the guide beside the form. Create **Demo: Walkthrough** with the
   Standard preset.
5. **Policies** page: the source reads *preset*, with its version in force.
6. **New task** → Annotation, Text, template **Text classification**, title "AG News: AI first pass", mode
   **AI-assisted** (the form's default), required annotators 1. **Upload labels JSON** (`demo-ag-news-labels.json`),
   **Create Task Draft**.
7. **Setup → Data intake → Upload files** `demo-ag-news-6.jsonl`; **Input projection → Selected fields**,
   `payload_preview.text`; **Upload and start batch**. Set the model (Ollama, `llama3`) under the task's AI model section.

**Say:** roles are capabilities, not job titles: the admin governs the organisation but doesn't judge the work; the
owner configures and releases but doesn't decide it either (ADR 023). The preset snapshot is versioned.
**If it goes wrong:** the seeded projects exist already; skip step 4–7 and use `Test: Standard review`.

### Chapter 2: the Standard model, with the AI first pass (4:00)

**Goal:** an AI suggestion, a human answer and a review stay separate; one approval makes the item final; a sample is
double-checked blind.

1. **Kevin** → the task home → **Activate task**. The AI run starts for each item; show the progress panel and the run
   status per item. (A failed item says so; no fake answer: C3.)
2. **Dana** → Annotate → take an item. The AI's suggestion is shown beside the answer field; accept or change it, add
   the rationale, **Submit annotation**.
3. **Bob** → Review → open Dana's item → **Accept**, with a justification (required for every substantive action). The
   item becomes canonical. Open **Item details**: *Governance posture: Standard*.
4. **Fiona** → `Test: Sampled second review` → `d1-sampled-awaiting-second`: Bob's verdict is hidden until she decides
   (independent second review, D7). Accept it.
5. Optional (0:30): `Test: Single review` → `a2-05-open-reconciliation`: two annotators' accepted answers; Hannah
   chooses one. Or `a1-05-awaiting-review`: Bob returns it for revision.

**Say:** the AI's answer, Dana's and Bob's are three records, never one "final answer" field. One approval is enough
here; the cost is that nobody checks the approval except the 10% sample.
**If it goes wrong:** Ollama down → open the pre-run task (§8) and say the run was recorded earlier (D3).

### Chapter 3: dual sign-off (3:00)

**Goal:** two independent approvals; a split between reviewers is held, not decided by anyone with a hammer.

1. **Dana** → `Test: Dual sign-off` → AG News task → answers item A (live); items B and C are pre-answered (§8).
2. **Bob** Accept on A: it stays in review, one approval of two. **Fiona** Accept: final.
3. Item B: **Bob** accepts, **Fiona** rejects. The case reads held: *"Reviewers disagreed on …; held for manual
   handling"*.
4. On B's case page **Bob** (or Fiona) tries to settle: refused, *"You annotated, reviewed or opened a dispute on this
   item, so you cannot settle its disagreement."*
5. **Ivan** → B's case → *Settlement decision* → **Accept this annotation**, a reason → **Settle disagreement**. The
   case now reads *Settled disagreement*, with Ivan's name and reason.
6. Item C (same split): **Julia** → **Route to dispute**. **Hannah** decides it: *Final adjudication decision* → a
   decision and reason → **Submit final decision**.

**Say:** an accept here is the deciding second approval. A peer may settle a split; where an expert must decide (Expert
gate, arbitration-ready), the same button is refused (ADR 022). The "automatic dispute" variant, where a split opens a
dispute by itself, exists in the backend: one sentence, no screen.
**If it goes wrong:** use the staged `Test: Dual sign-off, manual review` items `b1-05-held-split` and
`b1-06-held-split-routed`.

### Chapter 4: expert gate (2:30)

**Goal:** however many reviewers accept it, an item waits for an independent expert.

1. **Kevin** → `Test: Expert-gated review` → Policies: posture *Expert gate*.
2. **Dana** answers a fresh item; **Bob** Accept with a justification. Open **Item details**: *Governance posture:
   Expert gate*, and *"Under the Expert Gate, the accepted answer waits for an independent expert to confirm it."*
3. **Hannah** → **Reconciliation** tab: the held items listed as expert confirmation, `ag_news:train:0129` among them.
   Open one: three decisions, **Confirm this answer**, **Return for new annotation and review**, **Refuse this answer**.
   Choose Confirm, a reason, **Record expert decision**.
4. **Kevin** → **Finalized** tab: the item is there now, not before.

**Say:** no new queue was built: a held item is a reconciliation case with one answer, so it gets the same independence
check. And no AI answer that no person reviewed can be final under any posture (R2-7).
**If it goes wrong:** use `0129` for the whole beat; it is already waiting.

### Chapter 5: arbitration-ready (3:30)

**Goal:** a dispute is a first-class case, only independent adjudication closes it, and the disagreement stays in the
record.

1. **Hannah** → the task's **Dispute** tab → `ag_news:train:0150` (opened by the platform: Dana answered, Bob accepted,
   Fiona rejected). Show the three people's records side by side.
2. **Bob** opens the same case: refused to decide. **Hannah**: *Final adjudication decision* → **Accept this
   annotation** (the others: Reject, Return to a new annotator), a reason → **Submit final decision**.
3. Fresh item 2: Dana answers, Bob accepts, Fiona rejects. The platform opens the dispute immediately: no held state, no
   settle panel. **Ivan** decides it.
4. Fresh item 3: Dana answers; **Bob** changes the label, writes a justification, **Escalate** (a reviewer's proposed
   correction). **Hannah** → the case shows *Reviewer's proposed correction* → **Accept reviewer's correction**. The
   outcome reads *"The reviewer's correction replaced the disputed answer."*

**Say:** arbitration-ready is a guarantee, not a likelihood: a dispute is closed by an independent adjudication or not
at all. Dana's answer isn't overwritten; it stays in the record. Bob can never make his own correction the answer.
**If it goes wrong:** `0150` carries steps 1–2 alone.

### Chapter 6: trace and release (3:30)

**Goal:** "how did this label get here" is answerable for every item, a release is a fixed thing, and the gate refuses.

1. **Kevin** → `Test: Arbitration-ready review` → **Finalized** → click item 3: its production history opens as a graph
   (source registered, Dana's answer, Bob's escalation, *Expert accepted the reviewer's correction*, Dana's answer marked
   *Replaced by the accepted correction*).
2. **Reopen (D9):** `Test: Single review` → `a1-12-finalised` → the work panel → **Reopen this item** → a reason →
   **Reopen item**. Task **History** shows the reopen with its reason, cause and superseded answers (#104).
3. **Release refused:** the "1 submission per item: classification" task → **Finalized** → **Releases → Create release**:
   *"The release was refused: N item(s) failed the pre-release checks. Nothing was created."*, each with its reason
   (21/10: nine; re-count).
4. **Release created:** `Test: Task lifecycle` → "A completed task (read-only; export it)" → **Finalized → Create
   release**. It opens marked **Latest**: point at created by, task guideline and policy versions, resolutions, the
   artefact and manifest sha256, and the three checks. Open one item to see its timeline as released.
5. **Alice** (one beat): she can read the release and download it, but still can't judge.
6. Optional: archive and restore an empty project (J4), with its history.

**Say:** provenance is written when things happen, never edited. The gate runs before anything is written. The release
is frozen: change the task afterwards and its file and hash don't change; anyone can check it against the manifest
without the platform. "Export JSON" on the Finalized page is a live export, not a release: don't mix them up on screen.
**If it goes wrong:** `Test: Dual sign-off, manual review` → `b1-05-held-split` is also traceable.

### Chapter 7: evaluation (6:00)

Reuse the 21/10 structure and commands (`implementation/2026-10-21-evaluation-demo-plan-and-run-sheet.md`), with these
corrections. Re-measure every figure on the frozen build before recording.

| Part | Min | What | Update from 21/10 |
| --- | --- | --- | --- |
| 7a Casebook | 1:15 | open EV-110; `run EV-110`; `list --coverage`; `run --baseline` | 88 cases, not 86; re-read the passes, skips and "owed" counts |
| 7b Blind-then-reveal, live | 1:45 | Charlie, Dana, Bob, Kevin on `Test: Blind-then-reveal (evaluation)`; then `show_metrics.py Blind protocol` | UI changed (#97, #99); re-walk the clip steps; no chip warning needed |
| 7c Integrity checks | 1:15 | `verify` → clean; `try-delete` → refused; `forge_review.py`; `verify` → one finding | the finding reads `'review'` (#91); the "19 tasks checked" figure changes with the new work |
| 7d Agreement | 0:30 | the project Overview's Quality section (κ, α per task) | show it on `Test: Dual sign-off`, and say the n is small |
| 7e The AI on your data | 1:00 | `quality` on the llama3 and DeepSeek full recordings; the page's chart | dataset package path is on the F: OneDrive; check it is reachable |
| 7f Limits | 0:15 | scripted people, one recording per model, forgery in a permitted person's name | unchanged |

`verify` after chapters 1–6 is the real test: it reads work done by hand in the web app. A finding there is a bug in the
app or in the check, and is worth knowing before the recording, not during it.

### Chapter 8: limits and close (0:45)

What the demonstration doesn't show: the casebook's people are scripted, so the human figures prove the measures, not
behaviour; one recording is one sample of a model; a record forged in the name of someone who held the right role would
pass the integrity checks. Signed events would close that.

### Optional, if time: other annotation surfaces (0:45)

Judgement (verdict and rationale), text spans, image boxes, audio segments. The seeds stage judgement (`a3-…`) and
spans (`a4-…`); image and audio come from the New task form. *Check in the dry run that an image/audio item exists
before promising it.*

## 7. Failure and Q&A bank

- The 21/10 run-sheet's Q&A table (§4 there) still holds, apart from the changes in §1 above.
- "Who can see this?" The admin oversees (reads everything in scope) and releases; the task owner also does; neither judges.
- "What if a person is removed or suspended?" Show the Members dialogs (chapter 1), not improvised.
- If something breaks live: `specs/tools/demo/outputs/` holds the 21/10 outputs for the evaluation commands; re-save them from the frozen build.

## 8. Preparation

1. **Code:** check out `origin/main` at `69517818` or later, in a clean checkout. Record from `main`, never from a feature
   branch. Freeze on 28 Oct.
2. **Database:** PostgreSQL service running. Dot-source `specs/tools/demo/demo-env.ps1` (creates `hej_demo`, never prints
   the URL), then `cd apps/hej-api; uv run python -X utf8 init_data.py --reset`. Re-seed after #102.
3. **Servers:** `npm run dev:all` (web `:3000`, API `:8000`). **Ollama** running with `llama3` pulled.
4. **Browser:** one profile per person (§4), English, 1080p, signed in beforehand.
5. **Never** show `$env:DATABASE_URL` or `.env` on camera.
6. **Pre-stage with a script** (to write, §11): the answers and reviews that are not interesting to watch (chapter 3 items
   B and C; the answers in chapters 4 and 5; the AI run for chapter 2 as a fallback task). Same method as
   `prerun_parts_1_2.py`: real sign-in, the same routes, the same role checks.
7. **Retakes without clicking:** snapshot the database at the start of each chapter (`CREATE DATABASE … TEMPLATE
   hej_demo`) and restore it (stop the API first, as the template copy needs no open connections). Fallback: a restore
   script that replays a chapter's setup through the routes, as `rehearse_protocol.py` does for chapter 7b.
8. **Recording:** OBS or Game Bar (Win+Alt+R), 1080p, **one clip per chapter** so a bad take costs one chapter. Cut the
   waits (logins, the casebook run, the AI run). Record the evaluation chapter in its own terminal at 18 pt or more.
9. **Backup clips:** silent Playwright recordings of each chapter (`tools/demo/playwright/record.js` is the 21/10 model),
   made after the first dry run.

## 9. To verify in the dry run

Things this plan assumes and has not seen on screen:

- What Alice sees on a project page and on Members, and that none of Annotate/Review is offered.
- The AI-assisted task's model setting (Ollama + `llama3`) and that activation runs the first pass in under ~1 min for 6 items.
- Whether the AI suggestion shows on a classification item in the work panel (confidence is for judgement tasks).
- Each chapter's item budget (§5) works with the actual seed state, including that `0129` and `0150` are staged.
- The exact labels in chapters 3–5 (they come from the code: *Settle disagreement*, *Route to dispute*, *Confirm this
  answer*, *Record expert decision*, *Submit final decision*, *Accept reviewer's correction*, *Reopen this item*, *Create release*).
- The refusal messages for Bob and Fiona (chapter 3) and Bob (chapter 5).
- `verify` is clean after chapters 1–6, and the finding after the forgery reads `'review'`.
- A re-count of the nine refused items in chapter 6 step 3.

## 10. Schedule

| Day | Work |
| --- | --- |
| Mon 26 Oct | Decide D1–D5. Dry run 1 on current `main`; write the pre-stage and snapshot scripts; fix this document from what the run shows |
| Tue 27 Oct | Dry run 2 on the frozen build. Re-measure the evaluation figures. Record chapter 7 |
| Wed 28 Oct | Build freeze. Record chapters 0–6 |
| Thu 29 Oct | Edit; record narration; cut the highlight reel |
| Fri 30 Oct | Demo (the specs say mid-W12; confirm the day with Hanchen) |

If anything is found broken in the dry run: fix it on a branch before the freeze only if it is small; otherwise change the
demo to avoid it and write it down as a known limitation.

## 11. Files to create next

| File | What |
| --- | --- |
| `final demo/teleprompter-ch0-8.md` | the spoken lines per chapter, with on-screen cues, like `tools/demo/teleprompter.md` |
| `final demo/item-table.md` | the actual item ids after the first dry run |
| `tools/demo/prerun_governance.py` | pre-stage chapters 3–5 through the routes |
| `tools/demo/demo_db.py` additions | `snapshot <name>` and `restore <name>` |
| `tools/demo/playwright/` | silent backup recordings per chapter |

These helpers are demo-only and, like the rest of `tools/demo/`, not in the repo.

## 12. Risks

| Risk | Mitigation |
| --- | --- |
| Seeded items are consumed by one take | Snapshot per chapter; spare items; staged fallbacks named in each chapter |
| Ollama is slow or down | Pre-run task as fallback; D3 |
| A UI path differs from this document | Dry run 1 and 2; the "to verify" list (§9) |
| Recording from a branch that later changes | Record only from `main` at the freeze |
| Old evaluation wording/figures reused by mistake | §1 and chapter 7's update column; re-measure before recording |
| `verify` finds something real | Better found in dry run 2; fix or avoid and record as a limitation |
| Demo day or length is not what the plan assumes | Confirm with Hanchen; the highlight cut is the short answer |
