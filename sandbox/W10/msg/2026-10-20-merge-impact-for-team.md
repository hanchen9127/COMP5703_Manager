# Discord, 20 Oct: today's merges, and PostgreSQL CI now runs on main only

One message, under Discord's 2,000-character limit. Open PRs checked with `git merge-tree` against `main` at
`fbcff2e` (conflicts only; the suites were not run on them). #79 already carries #88 and has EV-015 and EV-101
enabled, so it needs no casebook work beyond a re-run.

---

📦 **Merged into `main` today:** #86 H6 release screens · #88 settling a held split (SCRUM-126) · #90 release gate & manifest review follow-ups (SCRUM-104/105)

**Everyone**
• Pull `main`. **Reset your dev PostgreSQL**: `uv run python -X utf8 init_data.py --reset`. #88 adds the `disagreement_settlements` table. SQLite migrates on start.
• ⚙️ **CI change (in #90):** pull requests now run the **SQLite job only**. PostgreSQL runs on every merge to `main`, and on demand: Actions tab → *Backend tests* → *Run workflow* → pick your branch. If your PR touches locking, JSONB or timestamps, run it on PostgreSQL (on demand or locally) before asking for review. Actions billing is still blocked, so for now keep putting local results in the PR.
• Reason codes, if you read the gate's 409: a finalised item with no marked answer is now `no_authoritative_answer`, not `superseded`. A held split and the Expert Gate are named under `disputed`.

✅ **All open PRs merge cleanly with `main`.** Merge `main`, re-run the backend suite and `python -m evaluation run --baseline evaluation/baseline.json --exact`:
• #79 I5 integrity checks (@Jingwei): 7 behind. EV-015/EV-101 already enabled 👍. If the gate's new wording changes a verdict, regenerate with `--update-baseline`
• #80 J4 update & archive (@Jingwei): 7 behind
• #75 J1 organisation identity (@Jingwei): 104 behind
• #89 organisation-scoped project creation (@Tim): 47 behind

🧹 **@Michael:** #90 is merged with three commits I added on your branch: the merge with #88, a gate fix (a *settled* split no longer counts as holding the item), and the CI change. Pull before you reuse the branch, or just delete `CS57-Michael-release-review-followups`.

Shout if a merge goes wrong 🙏
