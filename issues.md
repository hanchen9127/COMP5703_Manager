# HEJ Codebase Issues — Summary

Snapshot of known defects in the current HEJ codebase, their impact, and fix priority.

## Impact Table

| Issue | Impact | Severity |
| --- | --- | --- |
| Frontend fails typecheck (`TaskItemTable` prop mismatch + missing `judgementSignal` field) | Frontend can't be validated before merge; task workspace UI is unsafe to change. | High |
| Frontend test suite has a failing test (annotate payload drifted from its test) | `npm test` for the web app doesn't pass cleanly, same build-confidence risk as above. | High |
| Backend export tests fail to even run (missing helper function) | Export behavior is unverified — non-final tasks may be leaking into export listings. | High |
| Dispute "send back to annotator" isn't implemented | Users hit a placeholder message; disputes can only be finalized, not returned to annotators. | High |
| Dataset registration isn't transactional | A failure partway through intake can leave partial/inconsistent data in the database, requiring manual cleanup. | High |
| Audit log always shows "user" as the actor, even for system actions | Audit trail can't distinguish human actions from automated ones. | Medium |
| Escalation audit entries duplicate their own summary as a "change" | Adds noise to the history view, makes real changes harder to spot. | Medium |
| Backend `.env` config is silently broken | `.env.example` uses the wrong variable prefix, and the app never reads a `.env` file at all — copying the example file changes nothing, and settings always fall back to hardcoded defaults. | Medium |
| A frontend test doesn't actually test what its name claims | The image-annotation "hydrates from draft" test would still pass even if hydration were completely broken, so a real regression there could ship unnoticed. | Low |
| A backend test has misleading setup code | Unused mock wiring in an admin-IAM test implies the code does a DB lookup it doesn't — wastes a future developer's time understanding it. | Low |

## Release Risk

- **Not release-ready.** Both frontend and backend fail their own validation steps (typecheck/tests), so current behavior isn't fully verified.
- Dispute handling and dataset intake have functional gaps that affect trust in the platform's data and workflows.

## Recommended Priority Order

1. Fix frontend typecheck blockers and the failing frontend test.
2. Restore backend export-route tests.
3. Wire up dispute send-back.
4. Make dataset registration transactional.
5. Fix audit log actor labeling and reduce noisy escalation entries.
6. Fix backend `.env` config loading and variable prefix.
7. Strengthen the two weak test cases (vacuous frontend hydration test, misleading backend mock setup).
