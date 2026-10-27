# Final demo video: script and on-screen captions (26/10)

The words to say and the text to show for the 5–10 minute submission in [`submission-video-plan.md`](submission-video-plan.md). Shot detail and
click paths are in [`final-demo-workflow.md`](final-demo-workflow.md).

**How to use it**
- Record the screen silent, cut the video, then record this script against the cut (plan §1, rule 3).
- The **spoken text is the quoted blocks** (`>`). Text in **[square brackets inside a quote]** is optional: cut it first if a section runs over its slot.
- **Figures marked ⟦like this⟧ are placeholders** to re-measure on the frozen build and type in. They are listed in §11. Don't read a ⟦number⟧ aloud until it is filled in.
- Pace: about 135 words a minute, steady, with a short pause where the screen changes. Read each section aloud with a stopwatch against its slot before recording.
- **Status:** a draft. Click paths and the exact on-screen wording are unverified until dry run 1; update the captions that quote the UI after it.

## 1. Caption system

Five kinds of caption, so the video looks consistent. Keep every one short enough to read in two seconds.

| Kind | Where | Style | Used for |
| --- | --- | --- | --- |
| **Title card** | full screen, 2 s | white on dark, large | each section's opening |
| **Who chip** | lower-left, stays while that person acts | name · role | every shot with a person (rule 5) |
| **Callout** | beside the thing it names, 2–3 s | accent colour, 3–7 words | what to look at |
| **Result line** | lower-centre, 3 s | bold | the outcome of a step, a refusal, a figure |
| **Model tag** | top-right, stays through the section | the governance model's name | sections 3–6 |

Who chips, used throughout (same wording every time):

| Chip | |
| --- | --- |
| Alice Chen · Administrator | Kevin O'Brien · Task owner |
| Dana Park · Annotator | Charlie Davis · Annotator |
| Bob Johnson · Reviewer | Fiona Garcia · Reviewer |
| Ivan Novak · Independent reviewer | Hannah Kim · Expert (arbitrator) |

---

## 2. Section 0 · What HEJ is (0:00–0:30)

**Screen:** title slide, then the four-rung ladder building one rung at a time as I name each model.

**Captions**
- 0:00 Title card: **HEJ** / *Governed human–AI annotation, provenance and release*
- 0:03 Small line: *CS57 · COMP5703 Capstone · University of Sydney · for Arc Intelligence*
- 0:12 Callout on the first line of the slide: **How did this label get here?**
- 0:20–0:30 The ladder, a rung per name: **Standard** · **Dual sign-off** · **Expert gate** · **Arbitration-ready**, with beneath each: *one approval* · *two independent approvals* · *an expert confirms* · *independent adjudication guaranteed*

**Script**
> I'm Jingwei, and this is HEJ, our capstone platform for Arc Intelligence.
> Annotation platforms are built around the moment of labelling. HEJ is built around everything after it, so that a released dataset can
> answer, for any item, how did this label get here, and refuses to release when it can't.
> Four governance models decide who has to agree before an item is final: Standard, Dual sign-off, Expert gate, and Arbitration-ready.

## 3. Section 1 · Govern (0:30–1:30)

**Screen:** Alice on Admin → Members, the roles dialog; Kevin on New project with the preset picker open; the Policies page; the new AI-assisted task and its upload.

**Captions**
- 0:30 Title card: **1 · Govern**
- 0:33 Who chip: *Alice Chen · Administrator*
- 0:38 Callout on the member list: **Roles, per person**
- 0:48 Result line: **An administrator manages the organisation. She does not judge the work.**
- 0:52 Who chip: *Kevin O'Brien · Task owner*
- 0:56 Callout on the preset picker: **Four presets = four governance models**
- 1:06 Callout on the Policies page: **Policy source: preset · version in force**
- 1:15 Callout on the task form's mode: **AI-assisted**
- 1:22 Callout on the upload: **Real AG News records**

**Script**
> Everything starts with who may do what. Alice is the organisation's administrator. She manages members and their roles, but she
> doesn't annotate, review or decide, because an administrator may not have the expertise to judge the work.
> Kevin is a task owner. He creates a project and picks a policy preset, which stores a versioned snapshot of the rules: how many
> approvals an item needs, how much is cross-checked, and what happens when reviewers disagree.
> He creates a task, uploads real records, and sets it to AI-assisted, so a model, here llama3, makes a first pass.
> [Roles are capabilities, not job titles: the same registry decides what each screen offers and what the API allows.]

## 4. Section 2 · Assist, and the Standard model (1:30–2:45)

**Screen:** the AI run's progress panel (sped up, then its result); Dana's work panel with the suggestion; Bob's review and Accept; the item's details.

**Captions**
- 1:30 Title card: **2 · Assist and review** · Model tag (top-right): **Standard**
- 1:34 Callout on the progress panel, with *4× speed* in the corner: **The AI's first pass, item by item**
- 1:44 Callout on a failed item, if one shows: **A failure is shown, never faked**
- 1:50 Who chip: *Dana Park · Annotator*
- 1:54 Callout on the AI suggestion: **AI suggestion**
- 2:02 Callout on Dana's own answer field: **Dana's own answer**
- 2:10 Who chip: *Bob Johnson · Reviewer*
- 2:15 Callout on the justification box: **A reason is required**
- 2:25 Result line: **One approval → canonical**
- 2:32 Callout on Item details: **Governance posture: Standard**

**Script**
> The AI has made its first pass, and for every item it records a suggestion, or says plainly that it failed. It never fakes an answer.
> Dana is an annotator. She sees the suggestion, but the answer she submits is her own, with her reason.
> So there are three separate records, the AI's, Dana's, and the reviewer's, never one final answer field.
> Bob is a reviewer. He opens Dana's submission and accepts it, and has to write a justification, because every substantive review
> action needs one.
> Under the Standard model, one approval is enough, so the item is now canonical.
> That is the baseline. The next three models ask for more.

## 5. Section 3 · Dual sign-off (2:45–3:30)

**Screen:** two reviewers' decisions on one item; the held case; Bob's refused settle; Ivan's settlement.

**Captions**
- 2:45 Title card: **3 · Dual sign-off** · Model tag: **Dual sign-off**
- 2:49 Who chip: *Bob Johnson · Reviewer*; callout: **Accept**
- 2:54 Who chip: *Fiona Garcia · Reviewer*; callout: **Reject**
- 3:00 Result line: **The split is held. Nobody decides it by default.**
- 3:06 Who chip: *Bob Johnson · Reviewer*; result line (red): **Refused: you reviewed this item**
- 3:12 Who chip: *Ivan Novak · Independent reviewer*; callout: **Touched nothing**
- 3:20 Callout on the reason box: **Accept, with a reason**
- 3:26 Result line: **Settled disagreement · Ivan · reason recorded**

**Script**
> Dual sign-off needs two independent approvals. Here Bob accepts an item and Fiona rejects it. The platform doesn't guess: it holds
> the split.
> Bob tries to settle it himself and is refused, because he reviewed the item.
> Ivan touched nothing, so he can. He accepts Dana's annotation and writes a reason. That accept is the deciding second approval, and the
> settlement, with his name and his reason, becomes part of the record.

## 6. Section 4 · Expert gate (3:30–4:10)

**Screen:** Bob's accept and the item's details; Hannah's Reconciliation tab and the three options; Kevin's Finalized tab.

**Captions**
- 3:30 Title card: **4 · Expert gate** · Model tag: **Expert gate**
- 3:34 Who chip: *Bob Johnson · Reviewer*; callout: **Accepted…**
- 3:40 Callout on the details line: **…but not final: it waits for an expert**
- 3:48 Who chip: *Hannah Kim · Expert*; callout on the case: **One accepted answer, awaiting confirmation**
- 3:55 Callout on the options: **Confirm · Return · Refuse**
- 4:00 Result line: **Answer confirmed**
- 4:04 Who chip: *Kevin O'Brien · Task owner*; callout on Finalized: **Final only now**

**Script**
> The Expert gate asks for more still. Bob accepts this item, but the page says the accepted answer waits for an independent expert. It
> isn't final.
> Bob can't confirm it himself. Hannah, the expert, can. She sees the one accepted answer, chooses Confirm, and records her reason.
> Only now does the item appear in Finalized.
> However many reviewers accept an item, it waits for an expert. And no answer that only the AI produced can ever become final, under any
> model.

## 7. Section 5 · Arbitration-ready (4:10–4:50)

**Screen:** the dispute opened by the platform; the three records; Hannah's decision; [the proposed correction accepted].

**Captions**
- 4:10 Title card: **5 · Arbitration-ready** · Model tag: **Arbitration-ready**
- 4:14 Callout on the case's origin: **Opened by the platform, not by a person**
- 4:20 Callout on the three records: **Dana's answer · Bob accepted · Fiona rejected**
- 4:26 Callout where "Settle" would be: **No settle path here**
- 4:30 Who chip: *Hannah Kim · Expert*; callout: **Independent adjudication**
- 4:38 Result line: **Decision recorded. The disagreement stays in the record.**
- 4:44 [Callout: **Reviewer's proposed correction** → result line: **The correction replaced the disputed answer**]

**Script**
> Arbitration-ready is a guarantee. If reviewers disagree, the case can only be closed by an independent adjudication.
> Dana answered, Bob accepted, Fiona rejected, and the platform opened the dispute itself. There is no settle button here.
> Hannah opens the case, sees all three records side by side, and decides, with a reason.
> [Where a reviewer proposed a correction, only an independent expert can make it the answer. Hannah accepts it, and Dana's original
> answer stays in the record, marked as replaced.]

## 8. Section 6 · Trace and release (4:50–6:00)

**Screen:** Kevin on Finalized; an item's production-history graph; Create release refused; Create release on the completed task; the manifest and the three checks.

**Captions**
- 4:50 Title card: **6 · Trace and release**
- 4:54 Who chip: *Kevin O'Brien · Task owner*
- 4:58 Callout on the graph's top event: **Source registered**
- 5:06 Callout down the graph: **Every event names its actor**
- 5:14 Callout on a person's event and on a model's: **A person · the platform · a model**
- 5:20 Result line: **Written when it happened. Never edited.**
- 5:26 Callout on Create release: **Release gate**
- 5:30 Result line (red): **Refused: ⟦9⟧ items failed the pre-release checks. Nothing was created.**
- 5:38 Callout on a reason: **Not finalised · Held in a dispute**
- 5:44 Callout on the new release: **Release v1 · Latest**
- 5:48 Callout on the manifest: **Guideline version · Policy version · Resolution per item**
- 5:54 Callout on the checks: **Artefact hash ✓ · Manifest hash ✓ · Line by line ✓**

**Script**
> The point of all this is the record. From the Finalized page, Kevin opens an item and sees its whole production history: the source
> registered, the AI's suggestion, each person's answer, each review, a dispute and its decision. Every event names its actor, and was
> written when it happened, never edited.
> Now the release. Kevin tries to create one from a task that isn't ready, and the gate refuses before anything is written, naming each
> item and why.
> On a completed task the release is created. Its manifest records who made it, the guideline and policy versions in force, the
> resolution for every item, and the checksums. Three checks confirm the file matches its hash, the manifest matches its hash, and the
> two agree line by line.
> The release is frozen: change the task afterwards and this file never changes.

## 9. Section 7 · Evaluation (6:00–9:00)

### 7a · The casebook (6:00–6:45)

**Screen:** EV-110 in the editor, then the terminal: the run, the coverage list, the baseline.

**Captions**
- 6:00 Title card: **7 · Evaluation: proving it, not demonstrating it**
- 6:04 Callout on the actors block: **Each person is a fresh user, with only their roles**
- 6:09 Callout on the AI block: **A confidently wrong AI, 0.97, on a real Civil Comments record**
- 6:17 Result line: **PASS EV-110**
- 6:22 Callout on the coverage: **⟦9 of 9⟧ adversarial categories covered**
- 6:32 Result line: **⟦88⟧ cases · ⟦87⟧ pass · ⟦1⟧ skipped · no regression**

**Script**
> The brief asks us to prove the system, not just demonstrate it.
> A case is a piece of work told end to end: who takes part, what each does, and how it must end. This one is a confidently wrong AI on a
> real Civil Comments record. The harness signs in as each person and drives the same API the web app uses, and it passes.
> The casebook has ⟦88⟧ cases covering every adversarial category in the brief, and a baseline counts any case that newly fails, is
> skipped or is deleted as a regression. There is none.

### 7b · Blind-then-reveal (6:45–7:35)

**Screen:** Charlie on the Judge tab (his blind verdict, Reveal, his final answer); the figures in the terminal.

**Captions**
- 6:45 Who chip: *Charlie Davis · Annotator*; callout: **1 · His verdict, before the AI's**
- 6:53 Callout: **AI suggestion hidden until he commits**
- 7:00 Result line: **Committed · can't be changed**
- 7:04 Callout on the revealed suggestion: **AI: abusive · 95% · wrong**
- 7:12 Result line: **Same as his blind verdict**
- 7:18 Callout on the terminal: **From the platform's own metrics**
- 7:24 Result lines: **⟦n⟧ first rounds · kept ⟦x⟧ · switched to the AI ⟦y⟧** / **Confidence ⟦0.73 → 0.83⟧**
- 7:30 Small line: *The people here are scripted: this proves the measures work.*

**Script**
> Next, what AI assistance does to a person's judgement. In blind-then-reveal, Charlie records his verdict before the AI's suggestion is
> shown, and commits it. Only then is the suggestion revealed: abusive, ninety-five percent sure, and wrong. Charlie keeps his answer.
> [In another run, Dana follows the AI's wrong suggestion. That is automation bias.]
> Both judgements are kept as separate stages, and only the final answer goes to review.
> The platform measures it: how often people kept or changed their answer, their confidence before and after, and the time on each side of
> the reveal. These people are scripted, so this shows the measures work, not how annotators behave.

### 7c · The integrity check (7:35–8:20)

**Screen:** the terminal: `verify` clean, the forge script, `verify` again.

**Captions**
- 7:35 Callout: **Routes refuse the wrong person. Does the record prove it afterwards?**
- 7:42 Result line: **⟦19⟧ tasks checked · nothing found**
- 7:50 Callout on the forge command: **An approval written straight into the database, past the API**
- 7:56 Callout: **In the name of Charlie, who is only an annotator**
- 8:03 Callout: **The record looks complete**
- 8:08 Result line (red): **1 finding: held no role granting 'review' when they acted**
- 8:15 Callout on the finding: **Task · item · event · person · why**

**Script**
> The routes refuse the wrong person. But can the record prove, afterwards, that every step was allowed?
> This check reads the database and says whether each step was taken by someone holding the right role, including everything you have
> just watched. Nothing found.
> Now I write an approval straight into the database, past the API, in the name of Charlie, who is only an annotator. The review and its
> event are both there. The record looks complete.
> Run the check again: one finding. It names the task, the item, the event, the person, and why.

### 7d · The AI on the client's data (8:20–9:00)

**Screen:** the terminal's quality output for the llama3 recording; then the chart.

**Captions**
- 8:20 Callout: **llama3, recorded once, exact version noted**
- 8:26 Callout: **Gold labels joined outside the platform: gold never enters it**
- 8:32 Result lines: **AG News · 84.5% · calibration error 0.008** / **Civil Comments · 65.5% · calibration error 0.27**
- 8:40 Callout on the chart: **On Civil Comments it says "certain" on ⟦111 of 200⟧**
- 8:48 Result line: **…and is right ⟦about three times in four⟧**
- 8:54 Callout: **High confidence is not a reason to accept**

**Script**
> Finally, how good is the AI on the client's own data? A llama3 run was recorded once, with its exact version, and scored against the
> client's gold labels outside the platform.
> On AG News it is eighty-five percent accurate and looks well calibrated, but only because it always says eighty percent or more.
> On Civil Comments it is sixty-five percent accurate, and says it is certain on ⟦111 of 200⟧ comments while being right on about three
> in four. High confidence on that task is not a reason to accept.

## 10. Section 8 · Limits and close (9:00–9:40)

**Screen:** a plain slide with three lines, then the end card.

**Captions**
- 9:00 Title card: **What this doesn't show**
- 9:04 Slide, three lines, one per sentence of the script:
  - **Scripted people prove the measures, not behaviour**
  - **One recording is one sample of a model**
  - **A forgery in a permitted person's name would pass the integrity check**
- 9:20 Slide: **Govern · Assist · Record · Adjudicate · Release · Evaluate**
- 9:30 End card, 10 s, no narration (over the final word): **HEJ**, then the team, one name per line, then *Client: Arc Intelligence*

**End-card names** (as in `working-agreements.md` §11; **confirm the spelling and add the areas with the team**): Hanchen Wang · Yi Geng ·
Michael · Parth · Dishank Aswal · Kanishka Kathait · Tim Chung · Jingwei Lin.

**Script**
> What this doesn't show. The casebook's people are scripted, so the human figures prove the measures, not behaviour. One recording is
> one sample of a model. And the integrity check finds steps nobody was allowed to take, but a record forged in the name of someone who
> held the right role would pass. Signed events would close that.
> HEJ is the layer above annotation: govern, assist, record, adjudicate, release and evaluate, so that every label in a released dataset can
> say how it got there. Thank you.

---

## 11. Figures to re-measure on the frozen build

None of these may be spoken or shown until it has been read off the real run.

| Placeholder | Where | Command or place | Last known (21/10 or earlier) |
| --- | --- | --- | --- |
| ⟦88⟧ cases, ⟦87⟧ pass, ⟦1⟧ skipped | 7a | `uv run python -m evaluation run --baseline evaluation/baseline.json` | 86 cases, 85 pass, 1 skipped (21/10); the casebook has 88 cases now |
| ⟦9 of 9⟧ categories | 7a | `uv run python -m evaluation list --coverage` | 9 of 9 covered, 8 of 9 runnable |
| ⟦n⟧, ⟦x⟧, ⟦y⟧, confidence | 7b | `show_metrics.py "Blind protocol"` (`tools/demo/`) | n 3, kept 2, switched 1; confidence 0.7333 → 0.8333 (the scripted trio) |
| ⟦19⟧ tasks checked | 7c | `uv run python -m evaluation verify --database-url …` | 19 on the seed; it changes with the work done in sections 1–6 |
| `'review'` in the finding | 7c | the output after `forge_review.py` | `'approve'` before #91 |
| ⟦9⟧ refused items | 6 | the refusal text on Create release | nine (21/10); re-count |
| 84.5% / 0.0075, 65.5% / 0.2695, ⟦111 of 200⟧, ⟦76.6%⟧ | 7d | `evaluation quality --recording …ollama-llama3-2026-10-15-full.jsonl` | AG News 169/200, ECE 0.0075; Civil Comments 131/200, ECE 0.2695; stated 1.0 on 111, right 76.6% |

The script says "eighty-five percent" for 84.5 and "sixty-five percent" for 65.5 and "0.008" and "0.27": the captions carry the exact figures
so the voice doesn't have to.

## 12. Word budget (counted 26/10)

The quoted script only (titles, captions and ⟦placeholders⟧ counted as one word each). Pace is words ÷ slot; the target is about 120–135 words a minute.

| Section | Slot | Words | Pace (wpm) |
| --- | --- | --- | --- |
| 0 What HEJ is | 0:30 | 71 | 142 (fast: trim a clause if the slide is slow to build) |
| 1 Govern | 1:00 | 115 (96 without the bracket) | 115 |
| 2 Assist and Standard | 1:15 | 111 | 89 (room for the sped-up AI run to play with no voice) |
| 3 Dual sign-off | 0:45 | 72 | 96 (room to add a sentence on why Bob is refused) |
| 4 Expert gate | 0:40 | 81 | 121 |
| 5 Arbitration-ready | 0:40 | 81 (incl. the bracket) | 121 |
| 6 Trace and release | 1:10 | 140 | 120 |
| 7a Casebook | 0:45 | 98 | 131 |
| 7b Blind-then-reveal | 0:50 | 108 (95 without the bracket) | 130 |
| 7c Integrity | 0:45 | 95 | 127 |
| 7d AI on the data | 0:40 | 90 | 135 |
| 8 Limits and close | 0:40 | 87 | 130 |
| **Total** | **9:40** | **1,149** | **119 on average** |

The total leaves about 40 seconds of silence for screen changes and the sped-up clips. If your first timed read of a section runs over its slot,
cut the bracketed sentence, then the words, not the shot.

Recount after any edit:

```bash
awk '/^> /{sub(/^> /,""); n+=NF} END{print n}' "specs/final demo/script-and-captions.md"
```
