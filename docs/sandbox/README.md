# Sandbox

Personal working files for Hanchen's branches (`CS57-Hanchen…`): plans, manual tests, local data
scripts, commit drafts and learning notes. Not part of the product, not a tracking record, and never
uploaded to GitHub. Conventions are defined in `../specs/tech-stack.md` → *Personal sandbox*.

| Folder | What goes here |
| --- | --- |
| `tools/` | Scripts reused every week |
| `learning/` | Orientation and study notes that outlive a single week |
| `W6/`, `W7/`, … | One folder per week; see its `README.md` |

## Tools

Run from `hej/apps/hej-api` with the API running on `:8000`, unless noted otherwise.

| Script | Purpose |
| --- | --- |
| `tools/seed_test_roles.py` | Recreate the TechStart role-testing accounts (charlie, dana, erin, frank, grace) and the sandbox project. Idempotent — run after `init_data.py --reset`: `.venv\Scripts\python ..\..\..\docs\sandbox\tools\seed_test_roles.py` |
| `tools/reset_work_data.py` | Clear tasks and their data while keeping users, organisations, roles and projects. Dry run by default; `--yes` backs up the database first. Can be run from any directory |

## Learning

| File | Purpose |
| --- | --- |
| `learning/tut.md` | Orientation to the inherited `hej` codebase: what it is, how to run it, how it is put together, and a trace of the draft code path |
