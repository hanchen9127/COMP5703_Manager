"""Sandbox helper for the SCRUM-48 manual walkthrough (PR #35, story D8).

The web app has no work-queue screen yet (SCRUM-93) and no way to set a task's
required_annotators, and its review panel shows one submission per item. This
script fills those gaps through the API, so the walkthrough can drive the rest
from two browsers. Standard library only; the API must be running on :8000.

    python sandbox-SCRUM-48.py new [N]                   # fresh human-first task needing N (default 2)
    python sandbox-SCRUM-48.py show <task> <item>        # item status, submissions and their reviews
    python sandbox-SCRUM-48.py queue <task> <who>        # what the annotate and review queues offer <who>
    python sandbox-SCRUM-48.py peek <task> <item> <who>  # what <who> can read of other people's work
    python sandbox-SCRUM-48.py review <task> <item> <author> <accept|revise|reject> [--as <reviewer>]

<who>, <author> and <reviewer> are charlie, dana, frank, erin or alice.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request

# HEJ_SANDBOX_API points the script at another server, e.g. a throwaway one.
API = os.environ.get("HEJ_SANDBOX_API", "http://localhost:8000/api/v1")
WEB = "http://localhost:3000"
ORG_ID = 2  # TechStart Inc
PROJECT_NAME = "Draft Ownership Sandbox"
TASK_TITLE = "SCRUM-48 sandbox"
SEED_TEXT_REF = "uploads/texts/txt_8cb0cd7212f0.txt"

USERS = {
    "alice": ("alice@example.com", "SecurePass1Alice"),  # admin
    "charlie": ("charlie@example.com", "SecurePass3Charlie"),  # annotator
    "dana": ("dana@example.com", "SecurePass4Dana"),  # annotator
    "erin": ("erin@example.com", "SecurePass5Erin"),  # reviewer
    "frank": ("frank@example.com", "SecurePass6Frank"),  # annotator + reviewer
}

_tokens: dict[str, str] = {}
_ids: dict[str, int] = {}


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
        sys.exit(f"Cannot reach {API} - is the API running?  ({error.reason})")


def token(who: str) -> str:
    if who not in USERS:
        sys.exit(f"Unknown user '{who}'. Use one of: {', '.join(USERS)}")
    if who not in _tokens:
        email, password = USERS[who]
        status, body = call("POST", "/auth/login", body={"email": email, "password": password})
        if status != 200:
            sys.exit(
                f"Login failed for {who}: {status} {body}\n"
                "Missing test accounts? From apps/hej-api run:\n"
                "  .venv\\Scripts\\python ..\\..\\..\\docs\\sandbox\\tools\\seed_test_roles.py"
            )
        _tokens[who] = body["access_token"]
        _ids[who] = call("GET", "/auth/me", _tokens[who])[1]["user_id"]
    return _tokens[who]


def name_of(user_id: int | None) -> str:
    if user_id is None:
        return "AI/unowned"
    for who in USERS:
        token(who)
        if _ids[who] == user_id:
            return who
    return str(user_id)


def ensure_project(admin: str) -> str:
    status, projects = call("GET", f"/organizations/{ORG_ID}/projects", admin)
    for project in projects if status == 200 else []:
        if project.get("name") == PROJECT_NAME:
            return project["id"]
    status, project = call(
        "POST",
        f"/organizations/{ORG_ID}/projects",
        admin,
        {"name": PROJECT_NAME, "description": "Manual testing sandbox (SCRUM-25/26/28/48)"},
    )
    if status != 201:
        sys.exit(f"Could not create the sandbox project: {status} {project}")
    return project["id"]


def cmd_new(required: int) -> None:
    for who in USERS:
        token(who)  # fail early if an account is missing
    admin = token("alice")
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
            "required_annotators": required,
        },
    )
    if status != 201:
        sys.exit(f"Could not create task: {status} {task}")
    status, _ = call(
        "POST",
        f"/tasks/{task['id']}/dataset-registration",
        admin,
        {"items": [{"external_item_ref": "sandbox_scrum48_001", "location_ref": SEED_TEXT_REF,
                    "payload_preview": {"text": "sandbox"}}]},
    )
    if status != 201:
        sys.exit(f"Could not register dataset: {status}")
    item_id = call("GET", f"/tasks/{task['id']}/task-items", admin)[1][0]["id"]
    print(f"Fresh SCRUM-48 item ready (required_annotators={task['required_annotators']}).\n")
    print(f"  task      {task['id']}")
    print(f"  item      {item_id}")
    print(f"  annotate  {WEB}/tasks/{task['id']}/annotate")
    print(f"  review    {WEB}/tasks/{task['id']}/review")


def cmd_show(task_id: str, item_id: str) -> None:
    admin = token("alice")
    items = call("GET", f"/tasks/{task_id}/task-items", admin)[1]
    item = next((i for i in items if i["id"] == item_id), None)
    if item is None:
        sys.exit(f"Item {item_id} is not on task {task_id}")
    print(f"item {item_id}: status={item['status']}")
    annotations = call("GET", f"/task-items/{item_id}/annotations", admin)[1]["annotations"]
    if not annotations:
        print("  no submissions yet")
    for annotation in annotations:
        read = call(
            "GET",
            f"/tasks/{task_id}/task-items/{item_id}/adjustment?annotation_id={annotation['id']}",
            admin,
        )[1]
        print(
            f"  {annotation['id']}  by {name_of(annotation['created_by']):<8}"
            f" latest review: {read.get('review_verdict') or '-'}"
        )


def cmd_queue(task_id: str, who: str) -> None:
    user = token(who)
    for queue in ("annotate", "review"):
        status, rows = call("GET", f"/tasks/{task_id}/work-queue/{queue}", user)
        if status != 200:
            print(f"{queue:<8} {status} {rows.get('detail') if isinstance(rows, dict) else rows}")
            continue
        print(f"{queue:<8} {len(rows)} item(s)")
        for row in rows:
            extra = f" awaiting={row['awaiting_review_annotation_ids']}" if queue == "review" else ""
            print(
                f"  {row['id']}  {row['submitted_count']} of {row['required_annotators']} submitted,"
                f" {row['working_count']} working, ai={row['has_ai_annotation']}{extra}"
            )


def cmd_peek(task_id: str, item_id: str, who: str) -> None:
    user = token(who)
    me = _ids[who]
    drafts = call("GET", f"/task-items/{item_id}/drafts", user)[1]["drafts"]
    print(f"as {who}:")
    print(f"  draft list      -> {[name_of(d['created_by']) for d in drafts] or 'none'}")
    body = call("GET", f"/task-items/{item_id}/annotations", user)[1]
    visible = [name_of(a["created_by"]) for a in body["annotations"]]
    print(f"  annotation list -> sees {visible or 'none'}, total_count={body['total_count']}")
    status, read = call("GET", f"/tasks/{task_id}/task-items/{item_id}/adjustment", user)
    if status != 200:
        shown = "-"
    elif read.get("annotation_id") is None:
        shown = "no submission"
    else:
        shown = f"{name_of(read.get('annotated_by'))}'s submission"
    print(f"  review read     -> {status}, shows {shown}")
    admin_view = call("GET", f"/task-items/{item_id}/annotations", token("alice"))[1]["annotations"]
    for annotation in admin_view:
        if annotation["created_by"] not in (None, me):
            status, _ = call("GET", f"/annotations/{annotation['id']}", user)
            print(f"  GET {name_of(annotation['created_by'])}'s annotation -> {status}")


def cmd_review(task_id: str, item_id: str, author: str, action: str, reviewer: str) -> None:
    if action not in {"accept", "revise", "reject"}:
        sys.exit("action must be accept, revise or reject")
    token(author)
    annotations = call("GET", f"/task-items/{item_id}/annotations", token("alice"))[1]["annotations"]
    target = next((a for a in annotations if a["created_by"] == _ids[author]), None)
    if target is None:
        sys.exit(f"{author} has no submission on {item_id}")
    status, body = call(
        "POST",
        f"/tasks/{task_id}/task-items/{item_id}/review-actions",
        token(reviewer),
        {
            "action": action,
            "annotation_id": target["id"],
            "justification": f"Walkthrough: {action} {author}'s submission.",
            "feedback": None if action == "accept" else "Walkthrough: please revise the span.",
        },
    )
    if status != 200:
        print(f"{reviewer} {action} {author}: {status} {body}")
        return
    print(f"{reviewer} {action} {author}: next_ui_status={body['next_ui_status']}")
    cmd_show(task_id, item_id)


def main() -> None:
    args = sys.argv[1:]
    if not args or args[0] in {"-h", "--help"}:
        print(__doc__)
        return
    command, rest = args[0], args[1:]
    if command == "new":
        cmd_new(int(rest[0]) if rest else 2)
    elif command == "show" and len(rest) == 2:
        cmd_show(*rest)
    elif command == "queue" and len(rest) == 2:
        cmd_queue(*rest)
    elif command == "peek" and len(rest) == 3:
        cmd_peek(*rest)
    elif command == "review" and len(rest) >= 4:
        reviewer = rest[rest.index("--as") + 1] if "--as" in rest else "erin"
        cmd_review(*rest[:4], reviewer)
    else:
        print(__doc__)


if __name__ == "__main__":
    main()
