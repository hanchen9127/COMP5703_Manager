# Non-text modality check of hej `main` (2026-10-27)

Internal working record. Not part of the handover dashboard, and not yet checked line by line with Hanchen.

- **Subject:** `main` at `6b6a3fea414735b86cc17739ec602efedcc8e870` (merge of PR #105), fresh clone, `docker compose` on PostgreSQL 18, seeded with `init_data.py`.
- **Question:** how well do image, audio and video work end to end, compared with text?
- **Method:** two verifier agents, both reading only. One drove the API (every step below), the other drove the web app in headless Chromium (Playwright). Claude re-checked three claims against the code (see "Checked against the code").
- **Setup limits:** human-first tasks in the seeded project "Test: Dual sign-off" (2 approvals, 100% cross-review). No AI provider keys, so the AI first pass was tested only for failure handling. Media was generated for the check (320x240 PNG, 3 s WAV, 3 s H.264 MP4 made with the backend container's ffmpeg).
- **Evidence:** `api-results-from-agent.md` (the API agent's table, commands and ids), `release_vtrk.jsonl` (a downloaded export), `screenshots/` (11 images, named below).

## Verdict

The platform's records and workflow behave the same for every modality: upload, serve with Range requests, draft, submit, two accepts, correction, completion, release, and sha256 verification all passed for audio, video segments, video tracking and image classification. What is weaker for non-text is what the user can see and what the server checks. Image bounding boxes cannot be created and saved in the web app today.

## API results (text is the baseline)

| Step | text | image | audio | video_segments | video_tracking |
| --- | --- | --- | --- | --- | --- |
| Create task | PASS | PASS | PASS | PASS | PASS |
| Upload and refusal of wrong files | PASS | FAIL | FAIL | FAIL | FAIL |
| Content served, Range requests (206) | PASS | PASS | PASS | PASS | PASS |
| Valid draft, submit, two accepts, canonicalized | PASS | PASS | PASS | PASS | PASS |
| Invalid output refused on submit | not tested | FAIL | FAIL | FAIL | FAIL |
| Reviewer correction keeps its shape | PASS | FAIL for `image_bbox`, PASS for image classification | PASS | PASS | PASS |
| Complete, release, export, sha256 | PASS | PASS | PASS | PASS | PASS |
| AI first pass with no keys | PASS | PASS | PASS | PASS | PASS |

- **Releases:** all six verified. The agent's own sha256 matched `artefact_sha256`, the `X-Artefact-SHA256` header, the manifest and every `line_sha256`. Each JSONL line holds the annotation in its modality shape.
- **AI first pass, no keys:** every task gets an empty pending draft whose `metadata.ai.status` is `failed`, with the error kind and message. No fake annotation, no 500.

## Web app results (headless Chromium, tasks created through the wizard)

| | media renders | editor usable | draft restores | submit | reviewer preview | correction | finalised view |
| --- | --- | --- | --- | --- | --- | --- | --- |
| image_bbox (judgement class) | FAIL | FAIL | verdict only | verdict only | FAIL | verdict only | verdict only |
| image classification | PASS | box editor drawable, boxes dropped | label only | label and rationale | image, no boxes | label | label only |
| audio_segments | PASS | PASS | PASS | PASS | PASS | PASS | labels only |
| video_segments | PASS | PASS | PASS | PASS | PASS | PASS | "Answer not shown here" |
| video_tracking | PASS | PASS | PASS | PASS | PASS | PASS | "Answer not shown here" |
| text | PASS | PASS | PASS | PASS | PASS | PASS | PASS |

- Dual sign-off worked for all six kinds: two accepts gave Canonicalized, "decided by completion rule". Review stayed blind while the round was open.
- The H.264 video plays in the browser, so video problems are not a codec problem.
- A release was made and downloaded for video tracking only (`rel_9eb6ba35ac21`, 3 items).

## Findings

### Blocking for "image annotation works"

1. **Image bounding boxes cannot be created and saved in the web app.** The only task that can be created with the `image_bbox` surface is judgement class on an image. Its workspace shows only the item's preview text ("No preview available"), no image, and no box editor; the reviewer and finalised views show the verdict only. On image classification the box editor appears and a mouse drag draws boxes, but the boxes are not part of the saved payload: after a reload none are restored, and reviewers see none (`screenshots/950186_bbox_sheet.png`, `900916_bbox_review_open_bob.png`, `639693_bbox_bob_finalized.png`, `179581_imgcls_box2.png`, `206984_imgcls_restored.png`, `919136_imgcls_review_open_bob.png`).
2. **Over the API, a reviewer cannot correct image boxes.** `image_bbox` exists only under `task_class=judgement`, so the API demands a verdict and rationale, and a correction changes only `output.verdict`. A web-style submission (verdict only) was finalised with `boxes: []` in its release line.

### Server-side checks are weak for non-text

3. **Upload validation trusts the client's `Content-Type`.** A text file named `wrong_image.png` posted as `image/png` returns 201 and creates an item; so do the audio and video equivalents and a 0-byte PNG. A wrong declared type does get a clear 400.
4. **The upload endpoint is not matched to the task's modality.** `upload-audio` on an image task returns 201.
5. **Limit is 100 MB per file** (101 MB gives a 400).
6. **`GET /api/v1/tasks/storage/info` returns 500.** `uploads.py:699` uses `ALLOWED_TEXT_TYPES`, which the file never defines. It was the only 5xx in the run.
7. **Submit accepts structurally invalid non-text output**, over the API and in the browser: boxes outside the image or with zero size; segments with end before start (API), a negative start, or an end of 99 s on a 3 s file; tracks with no keyframes or `x=150`. Unknown labels are caught only for audio's singular `label`; video `labels` and image box labels are not checked. In the browser an invalid keyframe (`x=150`) passed two reviewer accepts and sits in the release JSONL (`675675_vtrk_bad_x150.png`, `416341_audio_bad_end99.png`). The client does block empty output, a missing transcript, audio end before start, and a video segment or track without a label.

### What the user sees

8. **The finalised desk and item details do not show the canonical answer for video.** Video segments and tracking say "Answer not shown here"; audio shows labels only; the full answer exists only in the JSONL (`663414_vseg_bob_finalized.png`, `669895_vtrk_bob_finalized.png`).
9. **video_segments editor deletes a segment when Start is set above End,** with no warning; setting End first avoids it (`538778_vseg_startgtend.png`).
10. **Smaller:** audio and video labels are free text, with no list of the task's labels (a wrong label is refused on submit with a clear 422); the wizard keeps stale default labels when the modality changes; the reviewer queue shows "unknown" for a bbox item; the item-details tab shows no media for audio or image; the reviewer's audio card is headed "No preview available"; dragging a box past the image edge cancels it silently; a changed verdict is refused on "Accept" and goes through "Revise". Release lines carry an absolute `http://localhost:8000/...` media URL, and media downloads need no sign-in.
11. **Shared with text, not modality-specific:** a person can submit an untouched failed AI draft, which becomes an annotation with empty fields and the failure note.

## Not tested

- Real AI output (no provider keys), worker mode, multi-annotator flows, the bare multi-label correction defect.
- Dispute and reconciliation for non-text items (no cases exist; none were created).
- The text invalid-output check, zero-size keyframes, negative frames and `x+width>100` in the browser.
- Other releases for non-text in the browser (done over the API for all kinds).
- Dana was not used; the web runs in dev mode.

## Checked against the code

- `apps/hej-api/app/api/routes/uploads.py:699` references `ALLOWED_TEXT_TYPES`, and the name is defined nowhere in the file (finding 6).
- `apps/hej-api/app/core/annotation_types.py`: for task class judgement, an image maps to `image_bbox`; the annotation class has no box surface (finding 2).
- `apps/hej-web/components/task-item-workspace-sheet.tsx` (judgement branch, about line 3068) renders only `item.preview` as source material (finding 1). Screenshot `950186_bbox_sheet.png` shows the result.

## For the Known limitations discussion (to confirm with Hanchen)

These findings have no place in the repository yet (`docs/evaluation-findings.md` section 6 does not list them), and no new PR is planned. If the release notes list them, they become a second source. Options: list only what section 6 already records, or add these to section 6 later and let the notes point there.
