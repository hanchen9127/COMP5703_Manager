# Discord, 19 Oct: open PRs affected by today's merges

Two messages, each under Discord's 2,000-character limit. Checked by merging the current `main` (`606e2a1`)
into each open PR locally, then running the backend suite and the casebook. Web tests were not run.

---

**Message 1**

📦 **Merged into `main` today:** #63 versioned guidelines and policies (F2) · #81 escalation posture (E5) · #83 release gate (H3) · #84 release manifest (H2)

**Everyone**
• Pull `main`. Your **dev PostgreSQL needs a reset**: `uv run python -X utf8 init_data.py --reset`. #63 and #84 add tables and columns. SQLite migrates on start.
• CI is still blocked (Actions billing). After you merge `main` into your branch, run the backend suite and `python -m evaluation run --baseline evaluation/baseline.json --exact` locally, and put the result in the PR.

I merged `main` into every open PR locally to check:

⚠️ **#79 I5 integrity checks (@Jingwei): 4 conflicts**
• `tests/test_evaluation_protocol_withheld.py`: keep `main`'s `UNFILLED_ROUTES`. It already lists the release routes, including the new `/manifest`.
• `EV-016`: keep `main`'s. It runs now, refused by the gate.
• `EV-015`: the gate exists now, so your `tamper` step can enable it. Delete an event, release, expect the 409 that names the item.
• `EV-101`: your `verify` step is the "read provenance back" step it waited for, so enable it.
• Then regenerate with `--update-baseline`. Don't hand-merge `baseline.json`.

---

**Message 2**

✅ **Merge cleanly, and backend tests + casebook pass after merging `main`.** Just merge `main` and re-run:
• #75 J1 organisation identity (@Jingwei): 17 commits behind
• #77 I3 agreement & AI quality (@Jingwei): 17 behind. I'll re-review after you merge `main`, including `0096d6e`
• #80 J4 update & archive (@Jingwei): 17 behind
• #85 F5 item timeline (@Yi): 9 behind

🔓 **#86 H6 release screens (@Yi, draft): now unblocked.** Merges cleanly. The three parts it waited for are in `main`:
• manifest: `GET /releases/{id}/manifest`, plus `version` and `manifest_sha256` on `ReleaseRead`
• gate refusals: a 409 whose `detail.items[].reasons` name each item and why. Warnings come as `gate_warnings` on the 201
• policy version in force (#63)
Your "Release vs export" table needs one update: a release is now **refused** unless every item is `canonicalized`, or `unresolved` by an expert. Ambiguous items appear in the manifest with no line.

🧹 **@Michael (follow-up to #83):** change ADR 020's "Decided by the client" to "Decided by the team". You can also delete `CS57-Michael-scrum-105-release-gate` now.

Shout if a merge goes wrong 🙏
