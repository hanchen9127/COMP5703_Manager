# Final demo video: the 5–10 minute submission (plan, 26/10)

**The requirement (Canvas, Project Demo Submission, by group):**
- a pre-recorded video of **5–10 minutes** demonstrating the complete project;
- **due Sunday 1 Nov, 11:59 pm**;
- filename `CSXX-X_final_demo_video.mp4`;
- if the file is too large to upload, submit a **PDF containing a shared download link** to it;
- **no video means a fail grade for the unit.**

This plan replaces the length of [`final-demo-workflow.md`](final-demo-workflow.md) (about 28 minutes). That file stays as the
long-form run-sheet: every click path and fallback in it still applies, and this plan cuts from it. **Status: plan, not
rehearsed.** Click paths are unverified until the first dry run.

---

## 1. Rules for this video

1. **Hard cap 10:00; aim for 9:30.** The export is checked against the cap, not the edit's feel. Over 10:00 risks the submission
   itself, so any overrun is cut, never squeezed.
2. **Complete project, not one feature.** The brief's six pillars each get screen time (§3), with the evaluation, which the
   brief calls a primary deliverable, getting the most.
3. **Record silent, narrate after.** Screen takes are made without talking, then the voice-over is recorded against the cut. That's
   the only way to land the timings exactly, and a bad take of the voice doesn't cost a screen recording.
4. **No waiting on screen.** Logins, uploads, the AI run and the casebook run are sped up (2–4×) or cut. State is pre-staged by script,
   so every shot starts at the interesting moment (long plan §8).
5. **Always say who is acting.** A lower-third on every shot names the person and role ("Bob · reviewer"). With 9 people in the cast,
   a viewer can't follow the independence rules without it.
6. **A safe version exists by Friday.** A complete, in-limit, correctly named file is uploaded early. A better cut can replace it.

## 2. Submission mechanics

| Item | Plan |
| --- | --- |
| Filename | `CSXX-X_final_demo_video.mp4`: **needs the group's exact code** (the repository is `CS57`; the group letter/number isn't in our files: ask Hanchen or check Canvas) |
| Who submits | One group member, through *Project Demo Submission (Submit based on Group)*; agree who, and that they have submit rights, by Wednesday |
| Format | MP4, H.264 + AAC, 1920×1080, 30 fps, ~6–8 Mbps: a 10-minute file is then ~450–600 MB. If Canvas refuses it, use the PDF fallback |
| Fallback | Upload to a share that works for the marker without sign-in, set to "anyone with the link", paste the link in a one-page PDF, test it in a private window. Prepare it Thursday even if not needed |
| Check before upload | Plays start to end; audio level steady; duration under 10:00 in the file's properties; filename exact; the link (if used) opens logged out |
| Deadline | Sun 1 Nov 11:59 pm. **Target: submitted Fri 30 Oct, Saturday is the buffer** |

## 3. The shape: nine sections, 9:40

Every section maps to a pillar of the brief ("Govern, Assist, Record, Adjudicate, Release, Evaluate", `mission.md`).

| Time | Section | Pillar | Screen | Words |
| --- | --- | --- | --- | --- |
| 0:00–0:30 | **What HEJ is.** Title; the one sentence; the four-model ladder | all | slide | 65 |
| 0:30–1:30 | **Govern.** Alice: members and roles. Kevin: a new project from the preset picker; the policy snapshot; a task set to AI-assisted | Govern | browser | 130 |
| 1:30–2:45 | **Assist and the Standard model.** The AI run; Dana sees the suggestion and answers; Bob accepts with a justification; the item is canonical | Assist, Record | browser | 160 |
| 2:45–3:30 | **Dual sign-off.** Bob accepts, Fiona rejects: the split is held. Bob is refused if he tries to settle it. Ivan settles with a reason | Adjudicate | browser | 100 |
| 3:30–4:10 | **Expert gate.** Bob's accept waits; Hannah confirms; the item shows in Finalized only now | Adjudicate | browser | 90 |
| 4:10–4:50 | **Arbitration-ready.** The split opened a dispute by itself; Hannah decides, or accepts Bob's proposed correction; Dana's answer stays in the record | Adjudicate | browser | 90 |
| 4:50–6:00 | **Trace and release.** An item's production-history graph; a release refused with named reasons; a release created, its manifest and its three checks | Record, Release | browser | 160 |
| 6:00–9:00 | **Evaluation** (breakdown below) | Evaluate | browser + terminal | 400 |
| 9:00–9:40 | **Limits and close.** What the demonstration doesn't show; credits | | slide | 90 |

**Evaluation, 3:00** (the 21/10 material, cut to a third):

| Time | Beat | Source |
| --- | --- | --- |
| 6:00–6:45 | The casebook: open EV-110, run it, the coverage count, the baseline "no regression" | long plan ch 7a |
| 6:45–7:35 | Blind-then-reveal, shortened: Charlie commits his verdict, the AI's suggestion is revealed, he keeps his; then the figures from `show_metrics` | ch 7b |
| 7:35–8:20 | Integrity: `verify` clean, then a forged approval, then the one finding that names the item, the event and the person | ch 7c |
| 8:20–9:00 | The AI on the client's data: the llama3 run, and the chart showing it is overconfident on Civil Comments | ch 7e |

Narration is ~1,285 words at ~135 words a minute. If the first read-through runs long, cut words before speeding up the voice.

**The through-line of sections 3–6** is one sentence repeated: "Bob accepts an item", and what happens next differs by model. A small
caption names the model on each (*Dual sign-off*, *Expert gate*, *Arbitration-ready*), so the four ladder rungs of the intro land on
screen as they are demonstrated.

## 4. What is cut (and where it goes instead)

These are in the long plan and are **not** in the 10 minutes. They belong in the report, or in the Q&A if the marker asks:

- the 10% and 50% blind second review; reconciliation of two annotators; return for revision;
- Julia routing a split to a dispute (Ivan's settlement shows the held-split design);
- reopen a finalised item; project update and archive; organisation policy defaults; invitations;
- the DeepSeek comparison, and the agreement coefficients on the Overview (κ, α);
- the other annotation surfaces (spans, image, audio).

If section 2 has room (it won't, but if the cut happens to run under 9:30): reopen is the best 15 seconds to add, since it shows the
record growing rather than being edited.

## 5. If the cut runs long

Drop in this order until under 9:40: the invitations in section 2 → the correction path in arbitration-ready (keep the dispute decision)
→ the 4×-sped AI run, shown as its result only → the DeepSeek line → the casebook's baseline step (keep the EV-110 run and the coverage).
Never cut the integrity check or the release: they are the brief's two sharpest tests.

## 6. Production plan

| Day | Work | Output |
| --- | --- | --- |
| Mon 26 | Decide D1–D3 (§7). Dry run 1 on the frozen-candidate `main`; write the pre-stage script and the database snapshot/restore; note what differs from the long plan | corrected shot list |
| Tue 27 | Dry run 2 on the same build. Re-measure the evaluation figures. **Record the evaluation screens** (section 8's four beats) | clips, silent |
| Wed 28 | Build freeze. **Record sections 1–7 screens** | clips, silent |
| Thu 29 | Assemble the cut; speed-ups; lower-thirds; record the voice-over; timing check ≤10:00; export; build the PDF-link fallback | draft 1 |
| Fri 30 | Team watches draft 1; fix; export; **submit** | submitted file |
| Sat 31 | Buffer only: a re-record, a re-export, or a better cut | |
| Sun 1 Nov | Do not plan work. If the Friday upload is good, leave it | |

The 30 Oct client demo, if there is still a live one, uses the same screens: the video is the safe fallback for it too (K4: a
recorded fallback exists).

## 7. Decisions (yours; recommendation first)

| # | Decision | Recommendation | Alternative |
| --- | --- | --- | --- |
| D1 | **Group code for the filename** | find out today; nothing else is blocked on it | none: a wrong filename is the one avoidable fail |
| D2 | **One voice or several** | one narrator (you), credits on the end slide: three days left, and one voice avoids matching audio levels, accents and timings across recordings | each teammate narrates their own section: more authentic, but needs their recordings by Thursday morning and tighter section timings |
| D3 | **Live AI run or a pre-recorded one in section 3** | pre-run the task and show its result, with a short sped-up clip of the progress panel: Ollama's speed can't be trusted inside a 10-minute budget | live: only if the dry run shows it finishing in under ~30 seconds |
| D4 | **Re-record the evaluation clips** (21/10) | yes: the UI, the roles and the figures changed, and one clip goes black at 1:00 | patch and reuse |
| D5 | **Highlight cut / extended version** | none: the submission is one video; the long run-sheet becomes the report's appendix and the live Q&A | |

## 8. Recording specifications

- 1920×1080, browser zoom ~125%, bookmarks bar hidden, notifications off, one window per person, English, one theme (light or dark) for the
  whole video.
- Cursor highlight on, no hover tooltips lingering, no fast scrolling: pause on the result for ~2 seconds so it can be read after the cut.
- Terminal at 18 pt or larger, cleared before each take. **Never show `DATABASE_URL`, `.env` or a password.**
- Use the editor's own screen recorder or OBS; export from the editor at the specifications in §2.
- Each section is recorded as its own clip(s), so a bad take costs one section.

## 9. To verify in dry run 1

- The seeded states each section starts from exist (the dual-sign-off split, `0129` at the gate, `0150` in a dispute) and the pre-stage
  script reaches them. Any state that can't be reached is replaced, not improvised on camera.
- Every UI label and refusal message quoted in the long plan is as written.
- `verify` is clean after sections 1–7, with the finding after the forgery reading `'review'`.
- A run of the whole cut with the timer on: **the screen footage plus its speed-ups totals ≤ 9:40 before any narration.**
- Playback and size of a test export, and the share link opened in a private window.

## 10. Risks

| Risk | Mitigation |
| --- | --- |
| Over 10:00 | Word budgets (§3); drop order (§5); the export duration is checked against the cap |
| Wrong filename or wrong submitter | D1 settled today; one named submitter confirmed on Wednesday |
| Upload refused (size or type) | The PDF-link fallback prepared on Thursday |
| A live thing breaks while recording | Everything is pre-staged and snapshotted; fallbacks named in the long plan |
| Late bug found in the dry run | Change the shot, record the limit; not a fix, unless tiny and before the 28 Oct freeze |
| Fatigue on the last two days | Submission on Friday; Saturday is a buffer; Sunday is not part of the plan |
