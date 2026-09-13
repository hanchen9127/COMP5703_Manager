# W6 — 7–13 Sep 2026

**Branches:** `CS57-Hanchen`, `CS57-Hanchen-ai-integration`

| Ticket | Story | State at end of week |
| --- | --- | --- |
| SCRUM-25 — Enforce draft ownership | D6 | Complete — merged through PRs #12 and #13 |
| SCRUM-28 — Prevent finalised annotations being overwritten | D5 | Planned, not started — carried to W7 |
| SCRUM-26 — Make draft submission atomic | D5 | Planned, not started — carried to W7 |

## Files

| File | Purpose |
| --- | --- |
| `plans/plan-SCRUM-25-26-28.md` | Commit-by-commit plan for all three tickets, with the Definition of Done checklist. Commit 2 onward is still ahead |
| `plans/progress-SCRUM-25.md` | SCRUM-25 progress report: decisions, what changed, how it was verified, what remains open |
| `tests/manual-test-SCRUM-25.md` | Nine-step two-browser walkthrough proving draft ownership in the running app |
| `scripts/sandbox-SCRUM-25.py` | Builds a fresh item for that walkthrough, checks draft owners, cleans up. Run from `W6/scripts/` with the API on `:8000` |
| `commits/commits-SCRUM-25.md` | Commands used to make the three web and docs commits |
| `commits/commit-SCRUM-25-*.txt` | The three commit messages, passed to `git commit -F` |

## Related

- Code review and PR description: `../../reviews/review-cs57-hanchen-scrum-25.md`,
  `../../reviews/pr-cs57-hanchen-scrum-25.md`
- Shared tools and orientation: `../tools/`, `../learning/tut.md`
- Team schedule: `../../specs/roadmap.md` → W6
