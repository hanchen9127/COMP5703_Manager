# hej modality check (main 6b6a3fea414735b86cc17739ec602efedcc8e870)

Stack: compose project `hejverify`, clone at scratch\modalitycheck\hej, own .env (gitignored). Backend 8000, frontend 3000, postgres internal.
Run via `docker compose -p hejverify --env-file apps/hej-api/.env ...`. Seeded with init_data.py. ffmpeg exists in the backend container (7.1.5).
All API work through scratch\modalitycheck\h.py (python requests helper) and step1..15.py scripts; media in scratch\modalitycheck\media.
Project used (Kevin = task owner): proj_4ccaf45f2aeb "Test: Dual sign-off" (2 approvals, 100% cross review, manual disagreement handling).
Users: charlie = annotator; bob + fiona = the two reviewers; kevin = owner/release.

## Table (PASS / FAIL / NOT-TESTED)

| step | text (baseline) | image | audio | video_segments | video_tracking |
|---|---|---|---|---|---|
| a create task | PASS | PASS (image_bbox exists ONLY under task_class=judgement; image classification under annotation) | PASS | PASS | PASS |
| b upload + refusal | PASS (ext check .txt/.json/.jsonl/.csv, 400) | FAIL (see F1-F4) | FAIL | FAIL | FAIL |
| c content + Range | PASS | PASS (200, bytes identical, 206 ranges); image content gives filename/mime/size = null | PASS (206); mime audio/vnd.wave; duration_seconds null | PASS (206); duration_seconds null | PASS |
| d1 valid draft->submit->2 accepts->canonicalized | PASS | PASS (bbox with verdict+rationale; plain classification also PASS) | PASS | PASS | PASS |
| d2 invalid output refused | NOT-TESTED for text (the label check's 422 was seen on audio only) | FAIL (F5) | FAIL (F5) | FAIL (F5) | FAIL (F5) |
| e reviewer correction keeps shape | PASS | FAIL for image_bbox boxes (F6); PASS for image classification | PASS | PASS | PASS |
| f complete + release + export | PASS | PASS (but see F7) | PASS | PASS | PASS |
| g AI first pass, no keys | PASS (failed draft, no annotation) | PASS | PASS | PASS | PASS |
| h surprises | see F8, F9 | | | | |

Notes on step f: each task POST /projects/{pid}/tasks/{tid}/complete -> 200 "completed"; POST /tasks/{tid}/releases -> 201; GET /releases/{id}/download (application/x-ndjson) and /releases/{id}/manifest. My own sha256 of the downloaded JSONL equals release.artefact_sha256, the X-Artefact-SHA256 header and manifest.artefact.sha256; sha256 of manifest equals release.manifest_sha256; every line_sha256 in manifest.items matches its JSONL line. 6/6 releases verify. The "Verified" text is a web-side check (no verify flag on the API read). Each JSONL line holds normalized_annotation (kind/modality/value) and raw_annotation_data in the modality shape (boxes / segments / tracks with keyframes). Normalized audio uses camelCase startTime/endTime, raw uses start_seconds/end_seconds. Lines carry external_item_ref (file name) but no media location or URL.

## Failures (exact text)

F1. Upload validation trusts the client Content-Type only, never the bytes. A text file `wrong_image.png` posted with `image/png` -> 201 (item created). Same for `wrong_audio.wav` (audio/wav) and `wrong_video.mp4` (video/mp4). A 0-byte file `empty.png` as image/png -> 201. Wrong declared types are refused with a clear 400: `{"detail":"Invalid image type: text/plain. Allowed: image/gif, image/bmp, image/png, image/webp, image/jpeg"}` (also application/pdf; audio and video have the same wording). Extension is not checked for media.
F2. Endpoint is not matched to the task modality. POST upload-audio with test.wav to the image task -> 201 and the image task now holds an audio item (content_kind "audio"); POST upload-images with test.png to the audio task -> 201 (content_kind "image"). No task_type check.
F3. Size limit is 100 MB per file (400 `File too large: 101.00MB (max: 100MB)`; 99 MB accepted 201). Whole file is read into memory. Limit is per file, not per request.
F4. GET /api/v1/tasks/storage/info -> 500 Internal Server Error. Log: `NameError: name 'ALLOWED_TEXT_TYPES' is not defined` at uploads.py line 699 (get_storage_info).
F5. No structural or range validation of non-text annotation output on submit (draft save is never checked by design). Submit returned 200 for all of these, no error: image_bbox box x=0.8,w=0.9 (outside image), x=1.5, negative width, zero-size box, pixel coordinates (5000), non-numeric x, empty boxes list, label "zebra" not in task labels; audio end<start, negative start, end 99s on a 3s file, empty segments, non-numeric start, camelCase end<start, wrong kind (image_bbox on audio task); video_segments end<start, negative start, end 99s on a 3s clip, no labels, labels ["zebra"], empty segments, wrong kind; video_tracking track with no keyframes, keyframe x=150, x+width>100, zero-size keyframe, negative frame, track with no labels, labels ["zebra"], empty tracks, wrong kind. Only refusals seen: audio segment `label` "zebra" -> 422 `Label 'zebra' is not one of this task's labels: cat, dog.`; image_bbox with no verdict -> 422 `A judgement needs a verdict.` The label check reads only a singular `label`, so video `labels` lists are never checked. The web client has its own checks (task-result-mapping.ts validateTaskResultPayload) but the API does not. Evidence tasks: xinvalid.json.
F6. image_bbox lives only in task_class=judgement, so the API demands verdict+rationale and the reviewer correction path is the judgement one: adjust with corrected=true and final_payload only -> 422 `A correction on a judgement task needs the corrected verdict (final_verdict).` With final_verdict, only `output.verdict` changes: boxes cannot be corrected, and the stored correction's `output_text` keeps the old verdict while `output.verdict` has the new one (inconsistent copy). Also the web workspace (task-item-workspace-sheet.tsx ~line 2112) sends `{verdict, rationale}` only whenever task.taskClass === "judgement", so an image_bbox task submitted from the web would drop the boxes. Using that exact payload via API, item_d6848bf5a78b (task_9e1401e35dd7) became canonicalized and the release line has `normalized_annotation.value.boxes: []` and raw `{"rationale":..., "verdict":"dog"}`. The browser agent should check whether the web box editor shows for a judgement-class image task.
F7. Same as F6, as seen in the export (item2 of task_9e1401e35dd7 holds no boxes).
F8. AI failure, no keys: no 500 and no fake AI annotation, but a human can submit the untouched failed draft (200) and it becomes an annotation with empty label/segments/tracks and the failure note in `notes`. Same for text, so not modality specific. POST /tasks/{tid}/ai-runs after failure -> 409 `No task items need AI annotation: every item is finalised, already carries annotation work, or already has an AI annotation.` (GET ai-runs returns [] because inline activation does not create run rows).
F9. Minor: HEAD on /uploads/... -> 405; media_url is absolute http://localhost:8000/...; downloads need no auth (documented); image content response has filename/mime_type/size null while audio/video fill them; duration_seconds null for audio and video.

## Other facts
- Dual sign-off: a single reviewer `adjust` leaves the item "annotated" and the annotator gets 409 `Your answer is not back with you. It is waiting for review or adjudication; rework requires unanimous redo...`; both reviewers must adjust, then the item is "returned". Resubmit needs `correction_annotation_id` of the CURRENT correction (the annotation_id inside GET .../adjustment.correction), else 422 `The correction must be a current reviewer's correction of your current answer on this item.`
- Reviewer corrections kept the full modality shape (audio segments, video segments, video tracks with keyframes, image classification) and landed in `output`/`output_text`, not in output_text only. After resubmit and two accepts all became canonicalized at version 2.
- AI tasks (step g) error classes in draft_data.metadata.ai: ollama -> `transient APIConnectionError Connection error.`; qwen -> `permanent ProviderConfigurationError No API key is configured for AI provider 'qwen'`; audio (ollama and openai) -> `unknown RuntimeError Audio transcription requires OPENAI_API_KEY, a transcript in payload_preview, or the optional faster-whisper package`. Item stays `pending` with an empty pending draft (created_by null), predictions and annotations empty. backend logs: 1 traceback total (storage/info), no other 5xx.
- Not tested: multi-label bare correction (the known open defect) for text; real AI output; web UI; worker mode; project status stays "draft" (not changed).

## IDs (project proj_4ccaf45f2aeb)
Clean tasks (all completed, one release each; items item1/item2; item[1] had a reviewer correction):
- text_cls task_dece601efd1b items item_1016a0ecc79d, item_731eed34417f; release rel_f344edbd7793
- image_bbox (judgement) task_9e1401e35dd7 items item_0d8731d3a0ce (boxes), item_d6848bf5a78b (web-style verdict only); release rel_c77b110bbe52
- image_cls task_ba268676056b items item_6e930f451f5c, item_97c23a894115; release rel_0cafb64765c1
- audio_seg task_93f64b919490 items item_9877d2d98648, item_6601c197d296; release rel_fef26e98bbfe
- video_seg task_1067a2f2c75e items item_53a8bded4c66, item_7bea73d70640; release rel_c8629caf0e1c
- video_trk task_61d55ef32ade items item_f4fe36b443a6, item_e2670a72ef87; release rel_d82b1368c1a8
Downloaded releases: scratch\modalitycheck\rel\<kind>.jsonl and .manifest.json
Validation tasks (active, polluted with wrong files, invalid-output annotations): ids_validation_tasks.json (task_6e8f9f3e6efa image_bbox, task_d9a26a4c21f9 audio, task_dd9c9162af2c video_seg, task_f68c8f818a52 video_trk, task_f67dcd6cc6be image_cls); xinvalid.json (task_61171ea8b18a image_bbox, task_7f8e93dad492 audio, task_4871ffebf822 video_seg, task_f8e141d94956 video_trk) each with one item per invalid case.
AI tasks (ai.json), all active, item pending with failed empty draft (except the ones I then submitted untouched: ai_text, ai_audio, ai_video_seg, ai_video_trk_qwen, ai_image_cls_qwen now hold a submitted empty annotation):
- ai_text task_b48a568a4e63 item_7e49a01a8094; ai_image_bbox task_8918756903c2 item_bb550858b4f5 (untouched pending); ai_image_cls_qwen task_6ceb9be78fbf item_d56b5a1c362b
- ai_audio task_503003a1e87f item_4854efd30e7d; ai_audio_openai task_956d891e60bd item_d28e3a62fe45 (untouched pending)
- ai_video_seg task_ddf7ff975a52 item_8d4f816598f2; ai_video_trk_qwen task_95bd3c305f9b item_bd7f69c1b97f
Size-limit task (draft, holds a 99 MB junk png): task_ed8e82e7243b.
Accounts: kevin/alice/charlie/dana/bob/fiona as in README (password list in README). 
