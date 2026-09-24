# Question For Client 

**Action required:** For any important decision we make, please create an ADR (Architecture Decision Record) under `docs/adr/`, using the naming format `adr00N_short_title.md`.

**A suggestion:** Going forward, would it be better to raise product/design questions as GitHub issues in the repo, label them `QA`, and assign or tag me? I can answer there, and you can then either close the issue as a clarification, convert it into an implementation task, or link it to a PR.

## Round 2

Before the individual answers, one principle should guide several of these decisions:

**Disagreement is not merely an exception that the workflow should eliminate. It is first-class, high-value data.** Who disagreed, on what, why, under which guideline/policy, and how the disagreement was resolved—or remained unresolved—should be preserved. A canonical answer is a production outcome; the disagreement lineage is also an important research/evaluation asset. This is consistent with the project's emphasis on provenance, adjudication, and evaluation rather than collapsing everything into one final label.

1. **Dispute \- after adjudication, who reviews next?**   
   Following your answer in the W7 client meeting, an expert's adjudication sends the item back to the reviewer rather than letting the expert finalise it directly. We need three details to build that path:  
* Does the item go back to the same reviewer who reviewed it before, or into the general review queue for any reviewer?  
* Is the expert's decision binding on the reviewer (their review must follow it), or advisory (the reviewer may still decide differently)?  
* If the reviewer still disagrees after seeing the expert's decision, can they send it to adjudication again, or is the expert's decision final at that point?


Answer:

I want to correct one part of my earlier answer: an expert adjudication should not normally go back to a reviewer for another decision. The expert exists to resolve a disagreement that ordinary annotation/review could not resolve.

I would expect three expert actions:

* Accept: accept one of the existing judgements as the resolved answer.  
* Return: none of the existing judgements is satisfactory; return the item, with a reason, to the normal open workflow for new annotation/review. The previous dispute remains in its lineage.  
* Reject: reject the disputed result/dispute as a valid resolution. It does not proceed automatically to another review stage.  
  The expert's adjudication is therefore final for that dispute. Only a Return reopens the item.  
  Also, "resolved" does not necessarily mean that one answer won. An item may be resolved as genuinely ambiguous/unresolved. The customer may later decide whether to exclude it or otherwise handle it in a release.

	

2. **Release \- which version of an item does an export carry?**   
   Following your answer in the W6 client meeting, every annotator's submission is kept as its own version, not merged into one. An item can end up with several versions once review finishes: for example, 3 annotators' judgements plus 1 reviewer's correction.   
* When we build the release/export feature, what should a release contain for such an item? One version chosen as authoritative when the item is finalised, or all versions together with which annotator, model or reviewer produced each?

Answer:

Keep all versions and their provenance, but distinguish them from the authoritative released result.

A released item should identify its resolved/canonical output, if one exists, while also preserving or linking to all annotation attempts, AI first-pass outputs, reviewer corrections, disputes, and adjudication decisions.

So:

release output \= authoritative resolution,  
release provenance \= complete judgement history

Do not flatten the history into only the final answer.

3. **Review \- who may reopen a finalised item?**   
   We have built the refusal side of this already. Once an item is finalised, every new draft, edit and submission against it is rejected. We have not built a way to undo that, and need your answer about the expected behaviour:  
* Who is allowed to reopen a finalised item: any reviewer, only an administrator, or a specific role?  
* When an item is reopened, does it go back into review, or somewhere else in the workflow?  
* Is the original finalised answer kept as a superseded version, visible in the item's history, or is it replaced?

Answer:

The project owner may reopen a finalised item directly.

Annotators, reviewers, and experts may request reopening. If implementing the request workflow is too large for this iteration, it can be parked, but the permission distinction should remain clear.

A reopened item returns to the normal open workflow, rather than simply resuming at the previous review step.

The previous finalised answer must remain in history as a superseded version. It should never be overwritten.

Hanchen: 

Sure, the project owner will be able to reopen a finalised item, added into our story now. We decided to delay the request workflow from annotators, reviewers, and experts. For now, it is considered out-of-scope, may be added if we finish all existing user stories early.

	

4. **Review \- is a written justification required beyond "accept"?**   
   You told us a justification is always required when a reviewer accepts an annotation, which has been implemented. Just to confirm: we assume the same requirement applies when a reviewer rejects an annotation, modifies it, or escalates it to dispute. Is it correct?

   

Answer:

Yes.

A justification should be required for substantive reviewer actions including:

* accept  
* reject  
* modify  
* escalate to dispute  
  The reason is part of the judgement/provenance record, not merely UI commentary.

5. **Provenance \- minimum provenance that must be included for release**  
   We noticed that in the Capstone Project description (the PDF file), the project goals distinguish per-item provenance under Record from immutable releases with manifests and validation under Release.   
   Our current normalised task export includes the export requester, item references, annotation creators, AI model used(recorded as notes) and timestamps, and review decisions and justifications.

We currently assume that the following fields are required:

* guideline versions  
* earlier annotation attempts

  We are not sure whether there are more missing contents; could you clarify the minimum provenance that must be included for each released item and in the release manifest?


  Also, is the item-level drill-down from the existing Task History view sufficient? Or, would you prefer that users should be able to view the complete project-level timeline within the dashboard?


  Answer:


  At item level, I would expect enough information to reconstruct how this released judgement came to exist, including at least:

  source/item identity and source version/reference; task instructions/guideline version; policy version; annotation attempts; AI first-pass/model information where applicable; human actors and timestamps; review decisions and justifications; disputes and expert/adjudication decisions; reopen/supersession lineage; and the final resolution used by the release.

  Because the platform may not store the customer's underlying data, the source reference should be stable enough to identify the exact source/version used.

  At release level, the manifest should identify the release/version, included items, which resolution/version was selected for each item, and the relevant task/guideline/policy versions.

  The existing item-level drill-down is the important requirement. I do not require a complete chronological project-wide timeline in the dashboard. A project activity view may be useful operationally, but the essential property is that a released item can be traced backwards completely.


  

6. **Task subtype & custom subtype \- additional explanation**  
   Thank you for the clarification. I'd like to apologise that my previous description of our design was not clear enough.  
     
   Strictly speaking, most of the task settings involved in the existing task creation process support user customisation. In the current task creation flow, task owners can edit the instructions and output schema. The task class and input modality are selected from supported categories, while the subtype currently provides a starting instruction template (only a placeholder, and the user can modify it), and the only settings that are hard-coded in each subtype are task\_class, task\_type, and task\_subtype; they are used to determine the result format, which kind of result previewer & editor will be used in the draft & review page.   
   *(Screenshot of the task creation form — omitted from this export; see the online document.)*  
     
   Your question from the previous reply:  
     
   \> Can this task be expressed faithfully by instructions (prompts) \+ examples \+ output schema, with the existing annotation/review machinery unchanged?  
     
   is actually applicable to each subtype, as the AI prompts already use the user-defined task instructions and output schema (and labels with definition if user provided). We agree that a new hard-coded subtype is unnecessary when the existing processing and review machinery can faithfully handle the task.  
     
   If we could go a step further, by letting task owners select an \`annotation\_type\` from the result and editor types supported by HEJ during task creation. (The draft and annotation records already have an \`annotation\_type\` field, but it is not currently a task-level setting.) With that setting added, both the backend result mapping and the frontend editor selection could use the task's chosen type; then the subtype will no longer be necessary. Existing subtype templates could remain available as optional starting points for instructions and schemas, which users could then edit.   
     
   Then, the only limitation is the previewer and the editor \- each selected type would need a compatible output schema and result mapping, and a genuinely new interaction surface would still need to be implemented explicitly.  
     
   Would this approach match your intended distinction between flexible task definitions and supported annotation interfaces?  
     
   **Answer:**   
   Yes, this approach is much closer to what I mean.  
   If the actual task can be expressed through:  
   input data \+ instructions/examples \+ output schema  
   and the existing annotation/review machinery can handle it faithfully, then a new hard-coded task subtype is unnecessary.  
   The subtype can therefore become an optional starting template rather than part of the task ontology.  
   Using a task-level \`annotation\_type\` to select the compatible renderer/editor is reasonable. I would think of this as the human annotation surface / result representation, not as the task itself.  
   A genuinely new type only needs explicit implementation when it requires a new interaction surface or different system behaviour.  
 


7. **The cross-review questions**   
* Supplies or stacks? Currently, we set Dual sign-off to 2 approvals and 100% cross-review as the default template in policy. If those stack, that's three looks per item. If cross-review is how the second approval gets collected, it's two. **What we proposed** is that it is supplies. Marked in the doc as the answer we most want, because it changes the cost of three of the four presets.   
* Gates or audits? With 1 approval and any sampling, the first approval accepts the item, and the sampled second look lands on something already canonicalized. **What we proposed** is that a sampled item isn't accepted until its cross-review completes; unsampled items are unaffected.   
* Does an AI annotation get cross-reviewed? Round 1 answer separated AI first-pass from the human annotator count, but said nothing about review. 

	  
	**Answer:** 

**Supplies or stacks?**  
Supplies. If the policy requires two approvals and cross-review provides the second independent approval, that satisfies the two-approval requirement. It should not silently become three reviews.

**Gates or audits?**  
For sampled cross-review, treat it as a gate. A sampled item should not canonicalise until its required cross-review completes. Unsampled items proceed normally.

If you later want post-hoc auditing, that should be a separate concept rather than overloading cross-review.

**Does an AI annotation get cross-reviewed?**  
AI first-pass is not an approval or reviewer slot. It is an AI-produced candidate/first pass.

The human judgement/review that may become canonical is what the review policy governs. If that item is selected for cross-review, the human-reviewed result goes through cross-review. The AI first-pass remains part of the provenance.

Under no circumstances can the AI first pass become the canonical answer without being reviewed by humans.  
 

8. **Governance model \- Expert Gate & Arbitration Ready**  
   In the meeting, you mentioned an expert and an arbitrator are basically the same role, but their workflow should be different in different governance models. Let’s confirm our understanding:  
* In **Expert Gate**,  when a task is finalised, it requires an expert’s confirmation, whether there are disputes or not.   
  * For example, if a reviewer accepts the item, it makes the item finalised (canonicalised) in the **Standard model** (already implemented).   
  * However, **for Expert Gate**, there must be an expert to accept/confirm before the item becomes finalised and ready to be exported.  
  * With a gate on every item, **is cross-review still needed?** 1 approval \+ 100% cross-review means the item is accepted first and checked second. What we now propose is that it blocks as a gate that can't refuse isn't a gate.  
  * If the gate is one expert approval, is cross-review then 0%?  
  * Can the expert approve an item they reviewed or annotated?  
      
* In **Arbitration-ready**, we assume that there is a high probability that there will be disputes, and each dispute requires a formal arbitration, which requires an expert (arbitrator)  
  * What distinguishes it from Dual sign-off? Identical stored values. 

    **What we proposed**: it should guarantee an adjudicator is reached, not just that a dispute opens, but that needs a field. 

  * Must a dispute reach arbitration, or may it?  
  * Can an expert (arbitrator) arbitrate a dispute about work they reviewed?

    **What we proposed**: No. Without it, arbitration-ready can't claim the outcome was independently settled.

    

	**Answer:** 

I would define these by **what authority is required before an item may be resolved/canonicalised**, rather than as UI presets.

**Standard**  
A normal reviewer approval is sufficient to canonicalise an item. Disputes may still be escalated to an expert when needed.

**Dual sign-off**  
Two independent approvals are required. Cross-review can provide the second approval. If those judgements disagree, the item enters dispute.

**Expert Gate**  
Every item requires expert confirmation before it can become canonical, whether or not a dispute occurred.

A normal path might therefore be:

*annotation → review → expert gate → canonical*

If the policy is one reviewer plus one expert gate, I would normally set cross-review to 0% rather than adding a third mandatory look. Additional cross-review can still be configured deliberately.

The expert should not approve an item that they themselves annotated or reviewed.

**Arbitration-ready**  
This is **NOT** about disputes being statistically more likely. It is a governance guarantee:

**if a dispute occurs, it must reach independent adjudication.**

That is what distinguishes it from Dual sign-off. Dual sign-off specifies how ordinary agreement is established; Arbitration-ready specifies what must happen when agreement fails.

So yes, the model needs an explicit rule/field representing that adjudication is mandatory on dispute.

An arbitrator should not arbitrate a dispute involving work that they annotated or reviewed themselves.

The broader design principle behind Expert Gate and Arbitration-ready is that the platform should not merely make disagreement disappear. It should preserve the disagreement, its reasons, and the authority structure through which it was resolved.

## Round 1 (answered 21/09/2026)

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

Update:

**Yi**: Thank you for the answer. We agree that annotation input, provenance fields, and evaluation-only data should be handled separately, rather than sending the entire uploaded record to the AI. 

Currently, although the text file picker lists . jsonl, the backend treats each uploaded file as one task item.  It does not split a JSONL file into records or extract payload\_preview. text from each record.  For my local test, I had to copy the text into a separate .txt file.  Image and audio uploads currently work on a one-media-file-per-item basis. 

Should direct import of the provided jsonl datasets be in scope? Or should it be used for the task queue, one task should only process one text paragraph? Or is it acceptable for the current delivery to preprocess the data into individual input files? Or, while creating a task, the task owner should also define the input schema?

**Hunter:** Good follow-up — this is now a design question rather than just a file-upload issue. Direct import of the provided JSONL datasets should be in scope. A JSONL file should not be treated as one task item. For this kind of dataset, each record should become an item. The full record can remain associated with that item for provenance/evaluation purposes, while the annotation input is a defined projection of that record.

Preprocessing everything into individual `.txt` files is fine as a temporary local workaround, but I would not treat that as the intended platform behaviour.

I would also avoid defining this as “one task \= one text paragraph”. The more general concept is **one source record \= one item**. Text, image, audio, paired examples, etc. may have different item structures.

Whether the task owner explicitly defines the input schema, or whether supported dataset/task types provide predefined schema adapters, is something you can propose. I do not want a universal data-mapping engine, but the system should have an explicit concept of how a source record becomes the annotation input.

**Hanchen**: What about uploading the entire file, but from AI’s view, *gold\_annotations* (as all datasets share this field) are removed. Then we use a prompt to ask AI to find the field to annotate, since we should not hardcode *payload\_preview.text*. In this way, meta data such as *external\_item\_ref*, *split*, *source\_record\_id* remain attached to the item

**Hunter:** keeping metadata such as external\_item\_ref, split, and source\_record\_id attached to the item is correct. However, I would not send the entire record to the AI and ask the model to infer which field should be annotated.  
The annotation target should be determined by the task/schema, not by the AI. Otherwise, different models or prompts may interpret the same source record differently, and we can no longer guarantee that the AI and human annotators were judging the same input.  
A useful separation is:  
source record \-\> task/schema projection \-\> annotation payload  
The source record is retained for provenance; the AI and human operate on the explicitly defined annotation payload; evaluation-only fields such as gold\_annotations remain hidden during annotation.

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

Update: 

Thank you for your clarification. When reviewing the sample dataset, we found that some tasks, such as speech transcription, do not require labels, so we made an adaptation, and the current design is consistent with this requirement. If the label list is empty, the label-related statements will not be added to the prompt.

**Hunter:** Yes, that sounds correct.

Labels should be treated as task-dependent configuration rather than a mandatory platform-level concept. If a task does not use predefined labels, such as speech transcription, then label-specific instructions should simply be omitted.

Just make sure the expected output structure is still explicit for that task, even when there is no label list.

4. **Create a task \- work assignment**  
   **Human-only**: Let’s assume the task owner decides 3 human annotators to work on an item. The current design assumes that any annotators can draft the item and submit until there are 3 submissions. Is it fine? The progress will be visible to annotators, e.g. 2/3 means this item needs one more submission.   
   **AI-assistance**: Does this apply to AI-only annotation (3 different models work on the same item and then their submissions directly go to the reviewer)? Or is it enough for each item to be annotated by the selected model successfully once?

	Answer:

For human annotation, if an item requires 3 independent annotations, it is fine for annotators to claim available work rather than pre-assigning three specific people.

The important requirement is that the system collects 3 independent human judgements. Showing progress such as `2/3 completed` is fine, but annotators should not see the previous judgements before submitting their own if independence is required (and most of the time, it is required).

AI first-pass annotation is separate from the human annotator count. A configured model producing one successful first-pass annotation is sufficient unless the task explicitly defines a multi-model evaluation experiment. (low priority)

5. **Create a task \- customizable task subtype**  
   We’ve discussed the task subtypes in the meeting; as you mentioned, there may be multiple task subtypes in the future. There should be an option that allows users to customise the task, correct? Such as several text boxes that allow users to define the task objective and expected outputs. Or, should these be managed by the task owner? Or, does such a design still not meet the actual requirements?  
   	  
   Answer:  
   Do not build a generic free-form task or workflow builder.  
   Task owners should be able to configure instructions, guidelines, and task-specific options, but supported annotation/output structures should be explicitly implemented in the system.  
   A few text boxes describing an objective and expected output are not enough to define a new task type. If additional task types are required, they should be added deliberately rather than recreating a general-purpose system such as Label Studio.  
   Update:   
   Thank you for the clarification. Our current implementation provisionally allows users to select a supported task subtype, edit its pre-filled instruction template, and customize its output schema. It also includes a custom\_task option where users can define an instruction and a JSON output schema. Based on the clarification, we understand that task-specific instructions and options should remain configurable, but annotation output structures should be explicitly implemented rather than defined freely by users. Is that correct? If so, should we make the structural schema for each supported subtype fixed, while keeping its instructions editable, the current custom\_task option should be removed?  
   **Hunter:** Not necessarily. If a task can be expressed clearly through the dataset, instructions/examples, and expected output schema, and the LLM can reliably produce the intended output, it does not need to be a hard-coded task subtype.  
   So I would keep the flexibility for users to define what should be annotated and what the output should look like. A separate subtype is only needed when the task requires different system behaviour, not just a different prompt or output schema.  
   A simple test: Can this task be expressed faithfully by instructions (prompts) \+ examples \+ output schema, with the existing annotation/review machinery unchanged?  
   Especially for multimodal models, or agent harnesses (e.g. Codex with computer use), I don’t think it is necessary to have a form for user to fill to define the task type, but several fields may remain necessary such as text/image/audio/video.  
     
   **Additional comment:**   
   I would not define task types too narrowly around traditional annotation categories.  
   For the input side, a small number of modalities such as text, image, audio, and video may be enough for now. What matters more is what the task asks the annotator or agent to judge, and what output contract is expected.  
   If an LLM or agent can understand the task from the data, instructions/examples, and output schema, we do not need a separate hard-coded task type just for that case.  
   Similarly, I would avoid treating the human annotation UI as the task type itself. The annotation surface may be a selector, text editor, span tool, region tool, comparison view, etc., and in the future it could even be generated dynamically for the task.  
   So the more stable concepts are:  
   input data \+ task/judgement instruction \+ expected output \+ provenance  
   The UI used to collect the human judgement is an interaction layer on top of that, not necessarily part of the task ontology.  
   We can start with the surfaces we need now, and add new ones when a real task requires them, rather than trying to enumerate dozens of annotation types in advance.  
     
     
     
     
6. **Role & Permission \- Is project-level access isolation required?**  
   If a person is given access to one project, must they be unable to see or change anything in other projects of the same organisation? Or should the access permissions be assigned by the administrators? Currently, project-level roles are defined in the data model but never used. We have closed the bug that lets a request for one project write into another, but not per-project isolation.  
     
   Answer:  
   Yes, project-level access isolation is required.  
   A user who has access to one project should not automatically be able to read or modify another project in the same organisation unless they have an organisation-level capability that explicitly permits it.  
   Project-level permissions therefore need to be enforced on the backend for both read and write operations, not only through the UI.

Update from Hanchen:   
Thank you for the clarification\! As the project manager, I would perceive this as a nice-to-have, because the roadmap we planned is quite full until mid-W12 (should be the final demo date and W13 for the report). We want to prioritise the workflow rather than the access authority here. It will be added to our roadmap if we finish early. Hope you can understand.  
	

7. **Policy: Can Policy be edited after the project starts?**  
   E.g. we initially set the requirement of 2 reviewers to review the annotation, and some items are reviewed by 2 reviewers during the project. At this time, can we change the policy to set 3 reviewers for review?   
   Or should the policy be blocked after project creation, as there will be a conflict with previous items?   
   

	Answer:

Policies may evolve after a project starts, but previous history must not be rewritten.

For example, if policy v1 requires 2 reviewers and an item satisfies that policy, changing the requirement later to 3 reviewers should create a new policy version rather than making it appear that the earlier item was always governed by the new rule.

New work should follow the new policy version. The system should preserve which policy version applied to each item so that its annotation, review, and release history remains traceable.

Update:   
Sure, the policy will be editable.

**Comments**:

These are all important questions, and they show that you are thinking seriously about the product rather than just implementing requirements mechanically.

Some of these questions genuinely need my input because they touch the product's intended behaviour or design. Others can and should be decided through your own reasoning and design work. In those cases, please make a concrete proposal, explain the reasoning and trade-offs, and send it to me for review.

I would like you to have more product ownership and autonomy in this project, so you do not need to wait for me to make every design decision.
