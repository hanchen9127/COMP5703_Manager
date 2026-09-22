---
name: tracking-sync
description: Sync docs/shared/story_src.csv — the backlog data behind user-stories.html — with the CS-57 contribution tracker and the Jira board export, and refresh the tracker's snapshot tabs from the board. Proposes status, allocation and ticket changes by the agreed rules, flags records that disagree with each other or with git, applies them only after confirmation, and preserves the CSV's byte format and every existing Contribution Log row. - Use when the user asks to pull the latest board or tracker, has downloaded a fresh CS-57_Contribution_Tracker.xlsx or Jira.csv into docs/shared, or asks to sync, refresh or update story progress, story_src.csv, the tracker, user-stories.html or the client-facing backlog — for example "同步进度", "更新 story_src", "tracker 更新了".
---

# tracking-sync

**Inputs**, all in `docs/shared/`:
- `Jira.csv` — the board export, fetched by `download` or by hand. **Never edited**: it is only ever
  replaced whole by a fresh export. It is always the board source.
- `CS-57_Contribution_Tracker.xlsx` — the online tracker, fetched by `download` or by hand. `apply` may refresh
  its *Jira Statistics* and *Lists* snapshot parts and append log rows for merged PRs nobody logged; it
  never changes an existing Contribution Log row
- `story_src.csv` — its `status`, `allocated_to` and `scrum` columns change only through this skill's
  `apply` step; every other column is edited by Claude directly in the CSV at Hanchen's request (never
  by hand — see `docs/specs/tech-stack.md` → *Tracking data*), as a separate change, not inside a sync

**Rules** live in `docs/specs/tech-stack.md` → *Tracking data*; `scripts/sync_tracking.py` and
`scripts/tracker_xlsx.py` implement them. If a rule has to change, update the spec first, then the scripts.

**Python:** `python` is not on PATH in Git Bash. Use the hej venv — standard library only:
`D:/COMP5703_Capstone/hej/apps/hej-api/.venv/Scripts/python`, with `PYTHONIOENCODING=utf-8`.

## Steps

0. **Download** the latest board and tracker, unless the user has just downloaded them by hand.
   ```bash
   PYTHONIOENCODING=utf-8 D:/COMP5703_Capstone/hej/apps/hej-api/.venv/Scripts/python "D:/COMP5703_Capstone/.claude/skills/tracking-sync/scripts/sync_tracking.py" download
   ```
   It reads the credentials in `docs/.env`, fetches both files, checks the report can read them, and
   only then replaces the copies in `docs/shared/` — all or nothing. The replaced copies are kept in the
   temporary folder it prints. It never writes to the board or the sheet. A failure names the source and
   the HTTP status and replaces nothing; if it fails, say so and fall back to the user's own download.

   Replacing the tracker discards any `apply` changes the user has not yet copied into the online sheet.
   That loses nothing — the next report proposes them again from `Jira.csv` and git — but tell the user
   when it happens.

1. **Report.** This is read-only. `--git` checks logged PRs against `origin/main` and finds merged PRs no
   log row names; `--fetch` only updates local PR refs in `hej`.
   ```bash
   PYTHONIOENCODING=utf-8 D:/COMP5703_Capstone/hej/apps/hej-api/.venv/Scripts/python "D:/COMP5703_Capstone/.claude/skills/tracking-sync/scripts/sync_tracking.py" report --git --fetch
   ```

2. **Summarise for the user, in Chinese:**
   - download dates;
   - the proposed changes to `story_src.csv`, including ticket links added to `scrum`;
   - the proposed changes to the tracker — Jira Statistics figures and issue changes, Lists tickets and
     board status, the dropdown range, and any appended log rows;
   - record checks, grouped:
     - PRs logged but not merged;
     - stories complete in the tracker whose tickets are not Done;
     - missing reviewers and self-reviews;
     - unknown names;
     - stories or tickets that do not map.

   Present the checks as items for the weekly sync. Never resolve them by editing the records.

3. **Stop for anything the rules do not cover** — an unknown name (add it to `scripts/aliases.json`), a
   logged story missing from the CSV, or the user wanting a different outcome. Ask with
   AskUserQuestion. If the answer changes a rule, update the spec and the scripts, then rerun the
   report.

4. **Apply only after the user confirms the proposed changes.**
   ```bash
   PYTHONIOENCODING=utf-8 D:/COMP5703_Capstone/hej/apps/hej-api/.venv/Scripts/python "D:/COMP5703_Capstone/.claude/skills/tracking-sync/scripts/sync_tracking.py" apply
   ```
   `apply` refuses if `story_src.csv`, the tracker or `Jira.csv` changed since the report, and works out
   the tracker changes before writing anything. It then verifies that only the planned CSV cells and
   workbook parts changed, that every existing Contribution Log row is byte-for-byte unchanged, and that
   `Jira.csv` is untouched. If it aborts, rerun the report.

5. **Remind the user to copy the tracker changes into the online tracker** — the refreshed *Jira
   Statistics* and *Lists* tabs, and any appended log rows — before anyone logs new work; otherwise the
   next download overwrites them. An appended row still needs its member to fill in Reviewed by, Story ID,
   What changed and Story complete?.

6. **Offer to refresh the specs.** This is the user's choice.
   - Replace the epic table in `docs/specs/mission.md` → *Progress Snapshot* with the report's
     *Epic snapshot*.
   - Bring the current week's status rows in `docs/specs/roadmap.md` into line.
   - Remind the user that `user-stories.html` picks up the new CSV on its next **Connect CSV**.

## Never

- Edit `Jira.csv`. Only `download` may replace it, and only whole, with a fresh export.
- Print, `Read` or copy the values in `docs/.env`, or put them anywhere under `hej/`. Inspect it by key
  names only, and leave it out of every recursive search over `docs/`.
- Change, reorder or delete an existing Contribution Log row, or write any tracker part other than those
  listed in `docs/specs/tech-stack.md` → *Writing the tracker*.
- Fill in an appended log row beyond what git proves.
- Change `status`, `allocated_to` or `scrum` in `story_src.csv` outside `apply`, or touch any other
  column as part of a sync — story text changes are a separate edit Hanchen asks for.
- Override a tracker entry because the code disagrees — report the gap instead.
