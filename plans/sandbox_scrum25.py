"""Sandbox helper for manually testing draft ownership (SCRUM-25 / story D6).

Creates a disposable human-first task with one fresh item in the Draft Ownership
Sandbox project, so every manual run starts from a clean, non-terminal item with
an unclaimed placeholder draft. The original sandbox_text_00N fixture is spent —
all five items are canonicalized — which is why this builds its own each time.

Standard library only. Requires the API running on localhost:8000.

    python sandbox_scrum25.py new            # create a fresh item, print the URL
    python sandbox_scrum25.py check <item>   # show who owns which draft
    python sandbox_scrum25.py clean --yes    # delete tasks this script created
"""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request

API = "http://localhost:8000/api/v1"
WEB = "http://localhost:3000"
ORG_ID = 2  # TechStart Inc — charlie and dana are both members
PROJECT_NAME = "Draft Ownership Sandbox"
TASK_TITLE = "SCRUM-25 sandbox"
SEED_TEXT_REF = "uploads/texts/txt_8cb0cd7212f0.txt"

ADMIN = ("alice@example.com", "SecurePass1Alice")
ANNOTATORS = [
    ("charlie", "charlie@example.com", "SecurePass3Charlie"),
    ("dana", "dana@example.com", "SecurePass4Dana"),
]


def call(method: str, path: str, token: str | None = None, body: dict | None = None):
    request = urllib.request.Request(API + path, method=method)
    request.add_header("Content-Type", "application/json")
    if token:
        request.add_header("Authorization", f"Bearer {token}")
    data = json.dumps(body).encode() if body is not None else None
    try:
        with urllib.request.urlopen(request, data, timeout=20) as response:
            return response.status, json.loads(response.read() or b"null")
    except urllib.error.HTTPError as error:
        raw = error.read()
        try:
            return error.code, json.loads(raw or b"null")
        except json.JSONDecodeError:
            return error.code, raw.decode(errors="replace")
    except urllib.error.URLError as error:
        sys.exit(f"Cannot reach {API} — is the API running?  ({error.reason})")


def login(email: str, password: str) -> str:
    status, body = call("POST", "/auth/login", body={"email": email, "password": password})
    if status != 200:
        sys.exit(f"Login failed for {email}: {status} {body}")
    return body["access_token"]


def require_annotators() -> None:
    """The extra annotator accounts are wiped by init_data.py --reset."""
    missing = [
        name
        for name, email, password in ANNOTATORS
        if call("POST", "/auth/login", body={"email": email, "password": password})[0] != 200
    ]
    if missing:
        sys.exit(
            f"Missing annotator account(s): {', '.join(missing)}.\n"
            "Re-create them first:\n"
            "  cd apps/hej-api\n"
            "  .venv\\Scripts\\python ..\\..\\..\\docs\\plans\\seed_test_roles.py"
        )


def ensure_project(admin: str) -> str:
    """Find the sandbox project, creating it if the database was reset.

    It is not part of `init_data.py`, so `--reset` wipes it. Recreating it here
    keeps this script working after a reset instead of failing on a stale id.
    """
    status, projects = call("GET", f"/organizations/{ORG_ID}/projects", admin)
    if status == 200 and isinstance(projects, list):
        for project in projects:
            if project.get("name") == PROJECT_NAME:
                return project["id"]

    status, project = call(
        "POST",
        f"/organizations/{ORG_ID}/projects",
        admin,
        {"name": PROJECT_NAME, "description": "Manual testing for draft ownership (SCRUM-25)"},
    )
    if status != 201:
        sys.exit(f"Could not create the sandbox project: {status} {project}")
    print(f"Created project {PROJECT_NAME} ({project['id']}) — database looks freshly seeded.\n")
    return project["id"]


def cmd_new() -> None:
    require_annotators()
    admin = login(*ADMIN)
    project_id = ensure_project(admin)

    status, task = call(
        "POST",
        f"/projects/{project_id}/tasks",
        admin,
        {
            "title": TASK_TITLE,
            "judgment_question": "Annotate the passage.",
            "task_type": "text",
            "annotation_mode": "human_first",
            "label_schema_ref": "default",
        },
    )
    if status != 201:
        sys.exit(f"Could not create task: {status} {task}")
    task_id = task["id"]

    status, _ = call(
        "POST",
        f"/tasks/{task_id}/dataset-registration",
        admin,
        {
            "items": [
                {
                    "external_item_ref": "sandbox_ownership_001",
                    "location_ref": SEED_TEXT_REF,
                    "payload_preview": {"text": "sandbox"},
                }
            ]
        },
    )
    if status != 201:
        sys.exit(f"Could not register dataset: {status}")

    _, items = call("GET", f"/tasks/{task_id}/task-items", admin)
    item_id = items[0]["id"]

    print("Fresh sandbox item ready.\n")
    print(f"  task   {task_id}")
    print(f"  item   {item_id}")
    print(f"  open   {WEB}/tasks/{task_id}/annotate\n")
    show_drafts(item_id, admin)
    print("\nNow follow sandbox_scrum25_manual_test.md.")
    print(f"Check ownership at any point with:  python sandbox_scrum25.py check {item_id}")


def show_drafts(item_id: str, token: str) -> None:
    status, body = call("GET", f"/task-items/{item_id}/drafts", token)
    if status != 200:
        sys.exit(f"Could not list drafts: {status} {body}")
    drafts = body["drafts"]
    if not drafts:
        print("  drafts: none")
        return
    names = {3: "charlie", 4: "dana"}
    print(f"  drafts ({len(drafts)}):")
    for draft in drafts:
        owner = draft["created_by"]
        who = "UNCLAIMED" if owner is None else f"{owner} ({names.get(owner, '?')})"
        print(f"    {draft['id']}  {draft['status']:<10} owner={who}")


def cmd_check(item_id: str) -> None:
    show_drafts(item_id, login(*ADMIN))


def cmd_clean(confirmed: bool) -> None:
    admin = login(*ADMIN)
    project_id = ensure_project(admin)
    status, tasks = call("GET", f"/projects/{project_id}/tasks", admin)
    if status != 200:
        sys.exit(f"Could not list tasks: {status} {tasks}")
    mine = [t for t in tasks if t.get("title") == TASK_TITLE]
    if not mine:
        print("Nothing to clean.")
        return
    print(f"{len(mine)} sandbox task(s) created by this script:")
    for task in mine:
        print(f"  {task['id']}")
    if not confirmed:
        print("\nRe-run with --yes to delete them.")
        return
    for task in mine:
        code, _ = call("DELETE", f"/projects/{project_id}/tasks/{task['id']}", admin)
        print(f"  deleted {task['id']} -> {code}")


def main() -> None:
    args = sys.argv[1:]
    if not args or args[0] in {"-h", "--help"}:
        print(__doc__)
        return
    if args[0] == "new":
        cmd_new()
    elif args[0] == "check" and len(args) > 1:
        cmd_check(args[1])
    elif args[0] == "clean":
        cmd_clean("--yes" in args)
    else:
        print(__doc__)


if __name__ == "__main__":
    main()
