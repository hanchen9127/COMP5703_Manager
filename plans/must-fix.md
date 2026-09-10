# Must-Fix Issues — Blocking the Roadmap Must-Haves

`issues.md` lists 29 known defects. This is not "fix everything on that list" — it's the subset (18 of 29) that directly blocks one of the four roadmap Must-Haves. The other 11 are real but deferrable; they're listed at the bottom so nothing is silently dropped.

**Rule used:** an issue is "must-fix" only if a Must-Have cannot be demonstrated, trusted, or safely built on top of while it's open.

---

## 1. Core end-to-end workflow (Project → Policy → Task → Ingestion → AI/mock annotation → Human review → Cross-validation → Dispute resolution → Final judgement)

The workflow cannot be run start-to-finish, or its output cannot be trusted, until these are fixed:

| Issue | Severity | Breaks |
|---|---|---|
| Task can never leave `draft` | High | No path to `ready` / `in_review` / `disputed` — most of the workflow literally cannot occur |
| Dispute "send back to annotator" not implemented | High | Dispute resolution step is half-missing |
| Finalized/canonicalized annotation can be silently overwritten | Critical | "Final judgement" isn't final |
| A finalized item can export conflicting answers | Critical | Cross-validation → final export produces no single canonical answer |
| Reviewers shown wrong annotator's work | High | Cross-validation step picks the wrong submission to review |
| Draft submission not atomic / draft never links to its annotation | High | Same root cause as above — annotation → review handoff is broken |
| Reviewer corrections aren't actually saved | Critical | Human review step's output is discarded |
| Task completion and export readiness disagree on "done" | High | Review → final judgement handoff produces contradictory state |
| AI failures produce fake annotations | High | AI/mock annotation step can silently feed fabricated data into everything downstream |
| Dataset registration isn't transactional | High | Ingestion step can leave partial/corrupt state |

**Bottom line:** without these, the workflow can't be run end-to-end even for a demo, and its output can't be trusted if it is.

---

## 2. Integrate full-stack app with annotation repo for annotation + human-review (P1)

All of the annotation/review rows above apply here directly, plus the defects that mean the "integrated" system doesn't actually own its own data:

| Issue | Severity | Breaks |
|---|---|---|
| Drafts have no ownership enforcement | Critical | Any org member can edit/delete/submit another user's draft |
| A second, legacy review API can rewrite approval history | Critical | An uncontrolled second write path bypasses the review workflow entirely |
| Cross-project/cross-org write bypass in the task API | High | A duplicated route skips project-scoping checks on task/item writes |

**Bottom line:** integration isn't safe to build on while a shadow API and an ownerless-draft model can silently corrupt what the "real" workflow just produced.

---

## 3. Review/validate schema & contracts (frontend ↔ backend ↔ annotation/AI) (P2)

These are exactly what this review is supposed to catch — leaving them open means the audit's own conclusions can't be trusted or built on:

| Issue | Severity | Breaks |
|---|---|---|
| Frontend fails typecheck (`TaskItemTable` prop mismatch, missing field) | High | Frontend can't be safely changed at all right now |
| Frontend test suite has a failing test | High | No working regression signal on the annotation payload contract |
| Backend export tests fail to even run | High | Export contract is completely unverified |
| Invalid task-item status values get saved to the DB | High | The status enum contract isn't actually enforced at write time |

**Bottom line:** you can't certify "contracts are validated" while the validation tooling itself is broken/red.

---

## 4. Governance framework: roles, permissions, review policies (P3)

This Must-Have is not "add a nice-to-have feature" — it's closing a gap that's already causing incorrect outcomes today:

| Issue | Severity | Breaks |
|---|---|---|
| Annotators can approve their own work | Critical | No role or self-review check exists — this *is* the missing governance framework, made concrete |
| Drafts have no ownership enforcement | Critical | No permission model beyond "member of the org" |
| Legacy review API can rewrite approval history | Critical | Review policy has no teeth — a second path bypasses it |
| Cross-project/cross-org write bypass | High | Scoping/permission enforcement gap at the route level |

**Bottom line:** there is currently no enforced role-based access control in the system (`annotator`/`reviewer`/`admin` are stored labels only) — this Must-Have is asking the team to build the thing that's currently missing, not polish an existing one.

---

## Explicitly NOT in scope here (deferred, still tracked in `issues.md`)

These don't block any of the four Must-Haves above — safe to leave for later:

- Organization invitations broken + duplicate `GET /organizations` route — onboarding-only, not in the demoed workflow
- Live API key hardcoded in source — security hygiene, rotate independently, not a workflow blocker
- `409 → 500` conversion in dataset intake — cosmetic error-handling, not a data-integrity issue
- Audit log always shows "user" as actor — observability polish
- Escalation audit entries duplicate their summary — noise, not correctness
- Backend `.env` config silently broken — dev environment convenience
- `init_data.py --reset` broken (two ways) — local tooling, not product behavior
- Vacuous frontend hydration test / misleading backend test mock — test-quality debt
- Export-eligibility list names an impossible `"approved"` status — dead code, no behavioral effect

---

## Recommendation

Fix the 18 issues above, in roughly this order: **workflow lifecycle gaps → data-integrity/governance (self-review, draft ownership, legacy API) → contract/test red state → export/AI-assist correctness.** Everything else in `issues.md` can wait for a later pass without putting any Must-Have at risk.
