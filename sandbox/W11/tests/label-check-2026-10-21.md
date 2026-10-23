# Does any seeded task refuse every label? — 2026-10-21

**Question (Hanchen):** is there a project whose selectable labels are broken, so that every label a person
fills in is refused?

**On `main` at `f3dfdc1c`.** The database was a throwaway SQLite one, seeded fresh by `init_data.py`. The
web ran on :3001 against an API on :8011, so the Docker stack on :8000 was left alone. The person was
Charlie, an annotator.

## Short answer

**No task's label list is broken.** For every seeded task, each label the work panel offers passes the
backend's submit check. But **every judgement task outside blind-then-reveal opens with its verdict field
pre-filled with the text `unknown`.** Anyone who types a label into that field types it after `unknown`.
The result is `unknownaccurate` or `unknownmisleading`, and it is refused. Only clicking one of the label
buttons above the field replaces the value.

## How it was checked

1. **In the running app**, three real submissions, with every request body and response recorded:

   | Task | What Charlie did | Result |
   | --- | --- | --- |
   | Test: Single review · 1 submission per item: classification (a1-01) | typed `politics`, Submit | 200, submitted |
   | Test: Single review · judgement (a3-01) | wrote a rationale only, Submit | **422**: "Verdict 'unknown' is not one of this task's labels: accurate, misleading." |
   | the same item | clicked the `accurate` button, Submit | 200, submitted |
   | Test: Single review · judgement (a3-02) | clicked into the verdict field, typed `misleading`, Submit | **422**: "Verdict 'unknownmisleading' is not one of this task's labels" |

2. **Every task, every label.** Using the payload shapes the panel actually sent, each label the panel offers
   for each seeded task was passed through the backend's own submit check,
   `result_shape.assert_result_matches_task`. **None was refused.**

## Findings

### 1. The judgement verdict field starts as `unknown` (a defect)

`task-item-workspace-sheet.tsx:1114` sets the verdict to `getJudgementDisplayValue(item)`
(`lib/task-format.ts:43`), which falls back to `item.aiLabel`. When an item has no AI label,
`formatTaskItemAiLabel` (`lib/task-workspace-data.ts:164`) supplies the *display* placeholder `"unknown"`.
That placeholder becomes the field's real value.

- **Affected:** every judgement task's Judge tab when the item has no draft, review or AI answer. In the seed,
  that is Test: Single review's judgement task. Blind-then-reveal (F1) is not affected: its protocol items
  start empty (`isProtocolItem ? draftVerdict ?? ""`).
- **What a person sees:** a 422 for any label they type, with a message that names a verdict they never
  meant.
- **Side effect worth knowing:** on an item that does have an AI label, the field starts with the AI's answer
  instead. Outside blind-then-reveal, that is a quiet anchor on the human's judgement.
- **Fix:** start the field empty unless the person's own draft holds a verdict. Never fill it from
  `aiLabel`'s display text.

### 2. The two base projects have no labels, so the panel offers the wrong ones (not a refusal)

The tasks in "Image Annotation Project" and "Text Classification Project" are seeded with no label options
and no label definitions (`init_data.py`, step 3). The backend therefore takes any label. The panel then
falls back to its generic defaults, `supports`, `contradicts`, `insufficient_evidence` and `ambiguous`
(`lib/text-span-label-options.ts`), on an image-classification task and a sentiment task. Nothing is
refused, but the labels on offer make no sense for those tasks. The test projects A–F all define their
labels, and the options match the definitions exactly.

### 3. Labels are matched case-sensitively in a free-text field

The classification label is typed, not picked: the field shows "Enter the selected class" and offers no
choices. A label must match exactly, so `Politics` or `person` (for `PERSON`) is refused. This is
consistent and the error names the allowed labels, but a picker would remove the problem. That is a scope
question, not a declutter one.

## Also found: SCRUM-129 overstated one sentence

While checking this, it turned out that a reviewer's corrected verdict *is* held to the task's labels
(`review_actions.py:700`, since #61). The chip bug in SCRUM-129 therefore gives a confusing 422 on tasks
with labels, and can make a wrong canonical answer only on a judgement task with no labels. Both the
SCRUM-129 draft and finding 0 of `../frontend-design-review.md` have been corrected. The board's
description still needs the edit; see the draft's open points.
