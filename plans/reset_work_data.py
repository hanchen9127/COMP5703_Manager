"""Clear tasks and everything under them, keeping users, orgs, roles and projects.

`init_data.py --reset` wipes the whole database, which means re-creating the
extra annotator accounts every time and losing the sandbox project. This clears
only the work data, so charlie / dana / erin / frank / grace and their
organisation memberships survive.

Standard library only. Stop the API first if you want to be certain nothing is
mid-request; SQLite will serialise regardless.

    python reset_work_data.py              # dry run - show what would go
    python reset_work_data.py --yes        # do it (backs up first)
    python reset_work_data.py --yes --keep-audit-logs
"""

from __future__ import annotations

import shutil
import sqlite3
import sys
from datetime import datetime
from pathlib import Path

DB = Path(__file__).resolve().parents[2] / "hej" / "apps" / "hej-api" / "hej_dev.db"

# Children first: every table here is referenced by the ones above it.
WORK_TABLES = [
    "task_item_escalations",
    "reviews",
    "drafts",
    "predictions",
    "annotations",
    "task_items",
    "data_pointers",
    "tasks",
]

# Audit rows name task and item ids as plain strings, so once the tasks are gone
# they point at nothing. Cleared by default; --keep-audit-logs retains them.
AUDIT_TABLES = ["audit_logs"]

KEPT = [
    "users",
    "organizations",
    "organization_users",
    "role_assignments",
    "organization_policies",
    "projects",
]


def counts(conn: sqlite3.Connection, tables: list[str]) -> dict[str, int]:
    return {t: conn.execute(f'select count(*) from "{t}"').fetchone()[0] for t in tables}


def main() -> None:
    args = sys.argv[1:]
    if "-h" in args or "--help" in args:
        print(__doc__)
        return
    confirmed = "--yes" in args
    clear_audit = "--keep-audit-logs" not in args

    if not DB.exists():
        sys.exit(f"No database at {DB}")

    targets = WORK_TABLES + (AUDIT_TABLES if clear_audit else [])

    conn = sqlite3.connect(DB)
    try:
        before_targets = counts(conn, targets)
        before_kept = counts(conn, KEPT)

        print(f"Database: {DB}\n")
        print("Will be cleared:")
        for table, n in before_targets.items():
            print(f"  {table:24} {n:5}")
        print("\nWill be kept:")
        for table, n in before_kept.items():
            print(f"  {table:24} {n:5}")

        if not confirmed:
            print("\nDry run. Re-run with --yes to apply.")
            return

        stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        backup = DB.with_name(f"{DB.stem}.{stamp}.bak")
        shutil.copy2(DB, backup)
        print(f"\nBacked up to {backup.name}")

        conn.execute("PRAGMA foreign_keys=ON")
        with conn:
            for table in targets:
                conn.execute(f'delete from "{table}"')

        after_targets = counts(conn, targets)
        after_kept = counts(conn, KEPT)

        leftover = {t: n for t, n in after_targets.items() if n}
        lost = {t: (before_kept[t], n) for t, n in after_kept.items() if n != before_kept[t]}

        print("\nCleared." if not leftover else f"\nIncomplete: {leftover}")
        if lost:
            print(f"!! Kept tables changed unexpectedly: {lost}")
            sys.exit(1)

        print("\nStill present:")
        for table, n in after_kept.items():
            print(f"  {table:24} {n:5}")

        users = conn.execute("select email from users order by id").fetchall()
        print("\nAccounts intact:", ", ".join(e for (e,) in users))
        print("\nNext: python sandbox_scrum25.py new")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
