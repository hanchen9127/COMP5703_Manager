# Question For Client 

# 21/09/2026 Round 1

- [ ] Hunter \- as GH admin \- can you enable branch protection | A1 P0 "no change reaches the main branch without an approving review from someone other than its author"

1. **Task item setup \- upload**  
   In the example dataset, the text source file is in .jsonl format, with each element having multiple fields. Should the input use a specific field, such as plain text, or include all fields? For example, only payload\_review should be parsed to the AI annotator   
   {"external\_item\_ref": "fewnerd:train:1",   
   "split": "train",   
   "source\_record\_id": "1",   
   **"payload\_preview"**: {  
   "text": "It starred Hicks 's wife , Ellaline Terriss and Edmund Payne ."},   
   "gold\_annotations": \[{"text": "Hicks", "label": "person"}, {"text": "Ellaline Terriss", "label": "person"}, {"text": "Edmund Payne", "label": "person"}\]}

	Answer:

The uploaded record may contain metadata, annotation input, and evaluation-only fields. These should not all be passed to the annotator or AI model.

For the example dataset, `payload_preview.text` is the annotation input. Fields such as `external_item_ref`, `split`, and `source_record_id` should remain attached to the item for provenance and traceability. `gold_annotations` is evaluation/reference data and should not normally be exposed during annotation.

Do not hard-code the platform specifically to `payload_preview.text`; different supported task types may use different input structures.

2. **Assist \- AI-generated suggestions** (to be confirmed in next client meeting)  
   About blind-then-reveal mode – how should it work, which step in the workflow does it belong to? Does it belong to the stage where human-only or AI-assisted is selected?

	  
	Answer:

AI-first and human-only are annotation production modes.

Blind-then-reveal is better treated as an evaluation protocol for human judgement. The annotator first makes an independent judgement without seeing the AI suggestion. That judgement is recorded, then the AI suggestion is revealed, and the annotator may keep or revise their answer.

This allows the platform to measure how AI assistance affects human judgement, including whether correct suggestions help and whether incorrect suggestions introduce anchoring or automation bias.

3. **Create a task \- Add a label**  
   A unified label definition management system is only necessary in tasks that require labels; some tasks do not require a label list (such as audio speech transcription), so it should be customizable, right?  
   

Answer:

Labels should be optional and task-dependent. Some annotation tasks require a predefined label set, while others may produce text, ratings, preferences, spans, or other structured outputs.

Do not assume that every task must have labels. You should design an appropriate abstraction for task outputs and justify the choice.

4. **Create a task \- work assignment**  
   **Human-only**: Let’s assume the task owner decides 3 human annotators to work on an item. The current design assumes that any annotators can draft the item and submit until there are 3 submissions. Is it fine? The progress will be visible to annotators, e.g. 2/3 means this item needs one more submission.   
   **AI-assistance**: Does this apply to AI-only annotation (3 different models work on the same item and then their submissions directly go to the reviewer)? Or is it enough for each item to be annotated by the selected model successfully once?

	Answer:

For human annotation, if an item requires 3 independent annotations, it is fine for annotators to claim available work rather than pre-assigning three specific people.

The important requirement is that the system collects 3 independent human judgements. Showing progress such as `2/3 completed` is fine, but annotators should not see the previous judgements before submitting their own if independence is required (and most of the time, it is required).

AI first-pass annotation is separate from the human annotator count. A configured model producing one successful first-pass annotation is sufficient unless the task explicitly defines a multi-model evaluation experiment.

5. **Create a task \- customizable task subtype**  
   We’ve discussed the task subtypes in the meeting; as you mentioned, there may be multiple task subtypes in the future. There should be an option that allows users to customise the task, correct? Such as several text boxes that allow users to define the task objective and expected outputs. Or, should these be managed by the task owner? Or, does such a design still not meet the actual requirements?  
   	  
   Answer:  
   Do not build a generic free-form task or workflow builder.  
   Task owners should be able to configure instructions, guidelines, and task-specific options, but supported annotation/output structures should be explicitly implemented in the system.  
   A few text boxes describing an objective and expected output are not enough to define a new task type. If additional task types are required, they should be added deliberately rather than recreating a general-purpose system such as Label Studio.  
     
     
6. **Role & Permission \- Is project-level access isolation required?**  
   If a person is given access to one project, must they be unable to see or change anything in other projects of the same organisation? Or should the access permissions be assigned by the administrators? Currently, project-level roles are defined in the data model but never used. We have closed the bug that lets a request for one project write into another, but not per-project isolation.  
     
   Answer:  
   Yes, project-level access isolation is required.  
   A user who has access to one project should not automatically be able to read or modify another project in the same organisation unless they have an organisation-level capability that explicitly permits it.  
   Project-level permissions therefore need to be enforced on the backend for both read and write operations, not only through the UI.  
 


7. **Policy: Can Policy be edited after the project starts?**  
   E.g. we initially set the requirement of 2 reviewers to review the annotation, and some items are reviewed by 2 reviewers during the project. At this time, can we change the policy to set 3 reviewers for review?   
   Or should the policy be blocked after project creation, as there will be a conflict with previous items?   
   

	Answer:

Policies may evolve after a project starts, but previous history must not be rewritten.

For example, if policy v1 requires 2 reviewers and an item satisfies that policy, changing the requirement later to 3 reviewers should create a new policy version rather than making it appear that the earlier item was always governed by the new rule.

New work should follow the new policy version. The system should preserve which policy version applied to each item so that its annotation, review, and release history remains traceable.

**Comments**:

These are all important questions, and they show that you are thinking seriously about the product rather than just implementing requirements mechanically.

Some of these questions genuinely need my input because they touch the product's intended behaviour or design. Others can and should be decided through your own reasoning and design work. In those cases, please make a concrete proposal, explain the reasoning and trade-offs, and send it to me for review.

I would like you to have more product ownership and autonomy in this project, so you do not need to wait for me to make every design decision.

