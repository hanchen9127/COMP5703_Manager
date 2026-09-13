---
name: tracking-sync
description: Sync docs/shared/story_src.csv — the backlog data behind user-stories.html — with the CS-57 contribution tracker and the Jira board export. Proposes status and allocation changes by the agreed rules, flags records that disagree with each other or with git, applies them only after confirmation, and preserves the CSV's exact byte format.
when_to_use: Use when the user has downloaded a fresh CS-57_Contribution_Tracker.xlsx or Jira.csv into docs/shared, or asks to sync, refresh or update story progress, story_src.csv, user-stories.html or the client-facing backlog — for example "同步进度", "更新 story_src", "tracker 更新了".
---

# tracking-sync

**Inputs**, all in `docs/shared/`:
- `CS-57_Contribution_Tracker.xlsx` and `Jira.csv` — downloaded by the user, **read-only**
- `story_src.csv` — changed only through this skill's `apply` step

**Rules** live in `docs/specs/tech-stack.md` → *Tracking data*; `scripts/sync_tracking.py` implements
them. If a rule has to change, update the spec first, then the script.

**Python:** `python` is not on PATH in Git Bash. Use the hej venv — standard library only:
`D:/COMP5703_Capstone/hej/apps/hej-api/.venv/Scripts/python`, with `PYTHONIOENCODING=utf-8`.

## Steps

1. **Report.** This is read-only; `--fetch` only updates local PR refs in `hej`.
   ```bash
   PYTHONIOENCODING=utf-8 D:/COMP5703_Capstone/hej/apps/hej-api/.venv/Scripts/python "${CLAUDE_SKILL_DIR}/scripts/sync_tracking.py" report --git --fetch
   ```

2. **Summarise for the user, in Chinese:**
   - download dates, and which board source was used;
   - the proposed changes table;
   - record checks, grouped:
     - PRs logged but not merged;
     - stories complete in the tracker whose tickets are not Done;
     - the two board sources disagreeing;
     - missing reviewers and self-reviews;
     - unknown names;
     - stories or tickets that do not map.

   Present the checks as items for the weekly sync. Never resolve them by editing the records.

3. **Stop for anything the rules do not cover** — an unknown name (add it to `scripts/aliases.json`), a
   logged story missing from the CSV, or the user wanting a different outcome. Ask with
   AskUserQuestion. If the answer changes a rule, update the spec and the script, then rerun the
   report.

4. **Apply only after the user confirms the proposed changes.**
   ```bash
   PYTHONIOENCODING=utf-8 D:/COMP5703_Capstone/hej/apps/hej-api/.venv/Scripts/python "${CLAUDE_SKILL_DIR}/scripts/sync_tracking.py" apply
   ```
   `apply` refuses if `story_src.csv` changed since the report or any old value differs. It then
   verifies that only the planned cells changed and the read-only inputs are untouched. If it aborts,
   rerun the report.

5. **Offer to refresh the specs.** This is the user's choice.
   - Replace the epic table in `docs/specs/mission.md` → *Progress Snapshot* with the report's
     *Epic snapshot*.
   - Bring the current week's status rows in `docs/specs/roadmap.md` into line.
   - Remind the user that `user-stories.html` picks up the new CSV on its next **Connect CSV**.

## Never

- Write to the tracker or `Jira.csv`.
- Edit `story_src.csv` by hand or outside `apply`.
- Override a tracker entry because the code disagrees — report the gap instead.
