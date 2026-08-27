# HEJ Codebase Issues — Summary

Snapshot of known defects in the current HEJ codebase, their impact, and fix priority. Includes findings from an external audit (`external_report.md`), independently verified against the current code — every claim in it checked out true.

A second verification pass (`fix-summary.md`) re-checked every row below against the codebase and confirmed all of them, then found five further defects the original audit missed: the duplicate `GET /organizations` route, the missing task-lifecycle transitions, the committed API key, the `409 → 500` conversion in dataset intake, and the impossible `"approved"` status. Those are now included in the table.

## Executive Status: Red

The most serious problems are not build/polish issues — they're incorrect authoritative data and broken access control: a finalized annotation can be silently overwritten, one user can edit another user's work, an annotator can approve their own submission, and a "finalized" item can export more than one conflicting answer. **Do not use this system for a real multi-user pilot or an authoritative export until the Critical rows below are fixed.**

## Impact Table

| Issue | Impact | Severity |
| --- | --- | --- |
| A finalized/canonicalized annotation can be silently overwritten | Submitting a new draft updates the same annotation row in place with no check that the item is already finalized — a "locked" result can change without triggering a new review. | Critical |
| Drafts have no ownership enforcement | Any active member of the org can edit, delete, or submit another user's pending draft — access checks only verify org/project membership, never who the draft belongs to. | Critical |
| Annotators can approve their own work | The review-action endpoint checks org/project access but never role or self-review — a user with only the `annotator` role can approve their own annotation and finalize the item. | Critical |
| Reviewer corrections aren't actually saved | When a reviewer submits a corrected value, it's appended as truncated text to a notes field — the stored and exported annotation stays the original, unreviewed value. | Critical |
| A second, legacy review API can rewrite approval history | A separate, older set of review-mutation endpoints lets any org member edit or delete an approved review without updating the item's real status — approval history and official state can silently diverge. | Critical |
| A finalized item can export more than one conflicting answer | Export logic tracks one annotation slot per *creator*, not one canonical value per item — if two people each annotated the same item, the export can include both as if either (or both) were authoritative. | Critical |
| A cross-project/cross-org write bypass in the task API | A duplicated, shadowed route means updating or deleting a task never verifies it belongs to the project in the URL — the same gap exists for task-item updates. In practice this lets a user with access to *any* project mutate a task or item in a project they have no access to. | High |
| Invalid task status values get saved to the database | A task-item's status field accepts any string and is committed to the database before validation runs — an invalid status can end up permanently stored. | High |
| Organization invitations are completely broken | Invitations are created as already-accepted internally while telling the user they're still pending, and the accept-invitation endpoint reads the wrong token field — every single acceptance attempt fails. | High |
| Task completion and export readiness disagree on what "done" means | A task can be marked complete from items that are merely reviewed, but the export package only counts fully canonicalized items — producing a "ready" export package that reports 0 completed items. | High |
| AI failures can produce fake annotations disguised as real ones | When the AI assist step is disabled or errors out, the code fabricates plausible-looking bounding boxes instead of reporting failure, and pads incomplete AI results with more fake boxes — stored as an ordinary draft, indistinguishable from genuine model output. | High |
| Draft submission is not one transaction, and drafts don't link to their own annotation | Draft status, the resulting annotation, and the task item's status are written in separate, non-atomic commits, and the draft's link back to "its" annotation is never actually saved — so a later review step has no reliable way to know which annotation belongs to which draft (this is the same root cause as the "reviewers can get shown the wrong annotator's work" row below, approached via a different code path). | High |
| Frontend fails typecheck (`TaskItemTable` prop mismatch + missing `judgementSignal` field) | Frontend can't be validated before merge; task workspace UI is unsafe to change. | High |
| Frontend test suite has a failing test (annotate payload drifted from its test) | `npm test` for the web app doesn't pass cleanly, same build-confidence risk as above. | High |
| Backend export tests fail to even run (missing helper function) | Export behavior is unverified — non-final tasks may be leaking into export listings. | High |
| Dispute "send back to annotator" isn't implemented | Users hit a placeholder message; disputes can only be finalized, not returned to annotators. The backend already fully supports this — it's a frontend-only gap. | High |
| Dataset registration isn't transactional | A failure partway through intake can leave partial/inconsistent data in the database, requiring manual cleanup. | High |
| `init_data.py --reset` is broken two different ways | (1) On a stock Windows terminal it crashes outright from a console-encoding bug — and its own error handler crashes too, hiding whatever really failed. (2) On any OS, running `--reset` a *second* time against an already-seeded database fails with a `FOREIGN KEY constraint failed` error partway through dropping tables — confirmed by reproduction, this doesn't fail cleanly, it leaves the schema corrupted (some tables dropped, some not), and the only recovery is deleting the database file and starting over. Blocks reliable local onboarding/demo setup. | High |
| Reviewers can get shown the wrong annotator's work | When a task item has been annotated by more than one person (the whole point of dual-review), the system can't reliably tell which annotation is "the" current one to review — the pick is effectively random. A reviewer could approve/reject the wrong person's submission with no indication anything went wrong. | High |
| Pending-invitation listing is unreachable (duplicate route) | Two routers register the same `GET /organizations` path; the organizations one wins and the "list my pending invitations" endpoint can never be called. Callers get a `200` with the wrong payload rather than an error. Combined with the broken acceptance flow below, there is no working path through invitations at all. | High |
| A task can never leave `draft`, so intake never closes | `draft → completed` is the only task-status transition the API supports — there's no activation endpoint and no `status` field on the update schema. Dataset intake stays open for a task's entire life (items can be added while others are being reviewed), and the `in_review`/`ready`/`disputed` export states can never occur. | High |
| A live API key is hardcoded in committed source | The Gemini key is a field default in `config.py`, tracked in git, so it's in every clone and fork. Because the `.env` bug below means no key can be supplied any other way, this shared, publicly-committed credential is what every developer actually spends against. | Medium |
| Lifecycle conflicts in dataset intake are reported as server errors | The registration route catches every exception, so a deliberate `409` ("intake only allowed while the task is draft or ready") reaches the client as a `500`. Clients and alerting can't tell an invalid workflow transition from an outage. | Medium |
| Audit log always shows "user" as the actor, even for system actions | Audit trail can't distinguish human actions from automated ones. | Medium |
| Escalation audit entries duplicate their own summary as a "change" | Adds noise to the history view, makes real changes harder to spot. | Medium |
| Backend `.env` config is silently broken | `.env.example` uses the wrong variable prefix, and the app never reads a `.env` file at all — copying the example file changes nothing, and settings always fall back to hardcoded defaults. | Medium |
| A frontend test doesn't actually test what its name claims | The image-annotation "hydrates from draft" test would still pass even if hydration were completely broken, so a real regression there could ship unnoticed. | Low |
| A backend test has misleading setup code | Unused mock wiring in an admin-IAM test implies the code does a DB lookup it doesn't — wastes a future developer's time understanding it. | Low |
| Export-eligibility list names a status that can't exist | `"approved"` is not a member of the task-item status enum, so the set silently behaves as if it weren't there. No behavioural bug, but a reader auditing export rules concludes there's an `approved` state and goes looking for the transition that produces it. | Low |

## Release Risk

- **Not release-ready, and not safe for a real multi-user pilot.** Beyond the frontend/backend validation gaps, there are unresolved data-integrity and access-control defects: finalized results can change without review, users can tamper with each other's work, self-review is possible, and exports can disagree with themselves about the canonical answer.
- Dispute handling and dataset intake have functional gaps that affect trust in the platform's data and workflows.
- The ambiguous "latest annotation" pick is a correctness gap in the review workflow itself, not just a data/setup issue — it can silently misdirect review decisions on any multi-annotator item, and (per the export-side finding above) can leak into what gets exported as the official answer.
- Organization invitations do not work at all in the current codebase — this blocks onboarding any real second user into an org through the normal flow. There are two independent reasons, not one: acceptance always fails on a broken token contract, *and* the endpoint that lists pending invitations is shadowed by a duplicate route and can never be called.
- The task lifecycle has no middle. A task goes `draft → completed` and nothing else, so dataset intake never closes and the workflow states the export dashboard is built around can never occur. This is a design gap rather than a defect in a single function, and it needs a product decision before it can be fixed.
- A live API key is committed to the repository and is the credential the app actually uses at runtime. Rotate it before anything else — that step doesn't depend on any of the code work above.

## Recommended Priority Order

0. **Rotate the committed API key.** Independent of every code change below and the exposure runs until it's done, so start it first even though the code fix is trivial.
1. **Protect authoritative data:** fix silent overwrite of finalized annotations, the missing canonical-output selection (both in review and in export), and reviewer corrections being discarded.
2. **Restore multi-user governance:** enforce draft ownership, and require a real reviewer role (block self-review).
3. **Close the legacy review API gap:** retire or lock down the second review-mutation endpoint so approval history can't be rewritten outside the official workflow.
4. **Fix the cross-project write bypass and the uncommitted-then-invalid task-item status** in the task API.
5. **Fix draft submission atomicity and the dead `draft → annotation` link**, which is the same root cause behind the "wrong annotator's work" review bug.
6. Fix frontend typecheck blockers and the failing frontend test.
7. Restore backend export-route tests.
8. Wire up dispute send-back (frontend-only change).
9. Make dataset registration transactional.
10. Fix organization invitations (broken creation/acceptance contract) **and the duplicate `GET /organizations` route that hides the pending-invitation listing** — neither is testable end to end without the other.
11. Align task-completion and export-readiness rules so they agree on what counts as "done."
12. Make AI-assist failures fail visibly instead of fabricating plausible output.
13. Fix audit log actor labeling and reduce noisy escalation entries.
14. Fix backend `.env` config loading and variable prefix, and both `init_data.py --reset` bugs (Windows console crash, FK-constraint-on-drop failure).
15. Strengthen the two weak test cases (vacuous frontend hydration test, misleading backend mock setup), and drop the impossible `"approved"` status from the export-eligibility set while item 11 is rewriting it.
16. **Define and enforce the task lifecycle** so a task can reach `ready`/`in_review` at all — blocked on a product decision about what the intended path is and who may trigger each step. Sequence after item 11, since "what counts as done" should be settled before adding the transitions that lead there.
17. Stop the dataset-registration route from converting deliberate `409`s into `500`s (one-line `except HTTPException: raise`).
