**Browser walkthrough before merge — all seven parts pass.** @kanishkakathait @Jingwei-Lin

Jingwei checked the multi-annotator flow through the API because the web app can't create a two-annotator task yet. I ran it in the web app on this branch (`4d3352f`; `987123b` adds docs only): a helper script creates the task with `required_annotators=2` and reads the queues, and everything else was done as charlie, dana, erin and frank in separate browsers against a reset dev database (Docker Compose). The walkthrough and its helper script are local to me; happy to share them.

| Part | What it checks in the running app | Result |
| --- | --- | --- |
| 1 | Before submitting, an annotator sees no peer's answer, only "1 of 2"; after submitting, both | ✅ |
| 2 | A third submission on a full item is refused with the API's message; the queue greys the item out | ✅ |
| 3 | One accept leaves the item open; the second submission's accept canonicalises it; a finalised item refuses new work | ✅ |
| 4 | Returned work comes back to its author only, with their feedback, as rework; the item waits for it | ✅ |
| 5 | Reject means redo, the same way | ✅ |
| 6 | Before submitting, an annotator can't read the reviewer's verdict on a peer's submission | ✅ |
| 7 | An AI-annotated item (local Ollama) goes straight to review, refuses human work, and canonicalises on its accept | ✅ |

Nothing here blocks the merge. The review history from the run shows three things the steps didn't ask about. I'd log them as follow-ups rather than hold #33:

1. **The review action accepts decisions the queue would never offer.** Erin accepted the same submission three times and Frank three more. The panel keeps offering Accept on a submission it has already approved, and under single sign-off the API refuses neither a repeat approval nor a decision on a submission that no longer awaits review. That leaves six approvals of one answer in the history. This has the same root as @DIQI26's two pre-existing points (a non-accept self-review, a review reopening a canonicalised item): the action doesn't apply the queue's rule, `awaits_review_by`. One guard, refusing a decision on a submission that isn't awaiting the caller (409), would close all three. @part0922, that sits naturally with SCRUM-86/SCRUM-109.
2. **An approved answer can be resubmitted.** On an item that was `rejected` for dana's work, charlie resubmitted his already-accepted answer. The panel offers the editor on that status to every annotator, and the API lets an existing contributor resubmit at any time. `submitted_at` handled it correctly: his old approval stopped counting and erin had to approve the new answer. Whether an approved answer should be editable at all is a separate question. The panel side is SCRUM-114.
3. **A submission sets the item to `annotated` even while another submission is back with its author.** Charlie's work was returned, then dana submitted, and the item reads `annotated`. An accept recomputes the status (`item_status_after_accept`), but a submission doesn't (`_advance_task_item_to_annotated_on_submit`). The queues are right because they read review states. The item's status, the panel's notices and SCRUM-89's figures are wrong. This is SCRUM-109's "state cannot diverge from history".

The panel showing the approved submission, and being unable to reach the other one, is SCRUM-113, as Jingwei says.

I'm not approving, since much of this branch is my #35. With Jingwei's and Yi's approvals, green CI and this run, it's ready to merge from my side. Jingwei's merge-order notes for #36 and #37 still apply.
