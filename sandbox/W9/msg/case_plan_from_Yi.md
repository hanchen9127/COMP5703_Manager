|case|action|
|--|--|
|AI-reviewer return|AI base, history given, human v2|
|AI-reviewer reject|new human base, history hidden, human v1, `derived_from_annotation_id = null`|
|AI-reviewer return-human-reviewer return/reject|AI base, history given, human v3|
|AI-reviewer reject-human-reviewer return/reject|human base, history given, human v2|
|AI-reviewer escalate-return to new annotator(specific context given)|new human base, human v1, `derived_from_annotation_id = latest provided context version`; show that source lineage only through the selected version|
|AI-reviewer escalate-return to new annotator(no context)|new human base, history hidden, human v1, `derived_from_annotation_id = null`|
|AI-reviewer escalate-reject|no replacement; subject disqualified; recompute item status|
|AI-reviewer return-human-reviewer escalate-return to author|AI base, history given, human v3|
|AI-reviewer return-human-reviewer escalate-return to new annotator(specific context given)|new human base, human v1, `derived_from_annotation_id = latest provided context version`; show that source lineage only through the selected version|
|AI-reviewer return-human-reviewer escalate-return to new annotator(no context)|new human base, history not given, human v1, `derived_from_annotation_id = null`|
|AI-reviewer reject-human-reviewer escalate-return to author|human base, history given, human v2|
|AI-reviewer reject-human-reviewer escalate-return to new annotator(specific context given)|new human base, human v1, `derived_from_annotation_id = latest provided context version`; show that source lineage only through the selected version|
|AI-reviewer reject-human-reviewer escalate-return to new annotator(no context)|new human base, history not given, human v1, `derived_from_annotation_id = null`|
|AI-reviewer return/reject-human-reviewer escalate-reject|no replacement; subject disqualified; recompute item status|

`selected context` is read-only reference evidence and is not the new annotation's version history. It must be a continuous prefix of one source base. `derived_from_annotation_id` identifies the latest provided source version and acts as the context cutoff: the new annotator may see that version and the earlier versions in the same base, but no later version. No-context paths leave `derived_from_annotation_id` null.
