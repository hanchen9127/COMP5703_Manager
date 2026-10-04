"""Sandbox helper for the SCRUM-38 manual walkthrough (story F3: every answer is a version).

Drives what the web app has no screen for: an active task, the version reads, the export, and the two
writes that have no route yet (an AI answer from a named model, and the authoritative marker, which
SCRUM-99 will call). Standard library only. API commands need the API on :8000; `ai-answer` and `mark`
run inside the backend container, so they need `docker compose up -d` in D:\\COMP5703_Capstone\\hej.

    py sandbox-SCRUM-38.py new [N]                                   # active text task, one item, N human submissions
    py sandbox-SCRUM-38.py submit <task> <item> <who> <label>        # <who> answers through the API
    py sandbox-SCRUM-38.py review <task> <item> <author> <accept|revise|reject> [--as <reviewer>]
    py sandbox-SCRUM-38.py versions <item> [--all] [--as <who>]      # the list read; --all adds superseded versions
    py sandbox-SCRUM-38.py history <annotation> [--as <who>]         # the author's whole chain
    py sandbox-SCRUM-38.py reopen <task> <item>                      # alice (admin) reopens a finalised item
    py sandbox-SCRUM-38.py export <task>                             # provenance in both export formats
    py sandbox-SCRUM-38.py ai-answer <item> <provider> <model> <label>   # an AI answer, through the real submit path
    py sandbox-SCRUM-38.py mark <annotation>                         # mark it authoritative (as SCRUM-99's Accept will)

<who> and <reviewer> are alice, charlie, dana, erin or frank (default reviewer erin, default reader alice).
<author> is a person, or ai:<model> for a model's answer. Use `py`, not `python`.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import urllib.error
import urllib.request

API = os.environ.get("HEJ_SANDBOX_API", "http://localhost:8000/api/v1")
WEB = "http://localhost:3000"
HEJ = r"D:\COMP5703_Capstone\hej"
ORG_ID = 2  # TechStart Inc
PROJECT_NAME = "Draft Ownership Sandbox"
SEED_TEXT_REF = "mock://fixtures/text/item_001.json"
USERS = {
    "alice": ("alice@example.com", "SecurePass1Alice"),  # admin
    "charlie": ("charlie@example.com", "SecurePass3Charlie"),  # annotator
    "dana": ("dana@example.com", "SecurePass4Dana"),  # annotator
    "erin": ("erin@example.com", "SecurePass5Erin"),  # reviewer
    "frank": ("frank@example.com", "SecurePass6Frank"),  # annotator + reviewer
}
_tokens: dict[str, str] = {}
_ids: dict[str, int] = {}


def call(method: str, path: str, who: str | None = None, body: dict | None = None, timeout: int = 30):
    request = urllib.request.Request(API + path, method=method)
    request.add_header("Content-Type", "application/json")
    if who:
        request.add_header("Authorization", f"Bearer {token(who)}")
    data = json.dumps(body).encode() if body is not None else None
    try:
        with urllib.request.urlopen(request, data, timeout=timeout) as response:
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
            sys.exit(f"Login failed for {who}: {status} {body}\nRun docs/sandbox/tools/seed_test_roles.py first.")
        _tokens[who] = body["access_token"]
        _ids[who] = call("GET", "/auth/me", who)[1]["user_id"]
    return _tokens[who]


def name_of(user_id: int | None) -> str:
    for who in USERS:
        token(who)
        if _ids[who] == user_id:
            return who
    return "-" if user_id is None else str(user_id)


def flag(args: list[str], name: str, default: str) -> str:
    return args[args.index(name) + 1] if name in args else default


def describe(a: dict) -> str:
    author = f"ai:{a['model_name']}" if a["author_role"] == "ai_model" else name_of(a["created_by"])
    link = f"<- {a['derived_from_annotation_id']} ({a['derivation']})" if a["derived_from_annotation_id"] else ""
    marks = []
    if not a["is_latest"]:
        marks.append("superseded" + (f" by reopen {a['superseded_by_reopen_id']}" if a["superseded_by_reopen_id"] else ""))
    if a["is_authoritative"]:
        marks.append(f"AUTHORITATIVE ({a['authoritative_cause']})")
    # The web app stores a classification under output.label; the API and AI paths here write label.
    data = a.get("annotation_data") or {}
    label = data.get("label") or (data.get("output") or {}).get("label")
    return (f"  {a['id']}  v{a['version']}  {a['author_role']:<9} {author:<16} label={label!r:<20}"
            f" {link}  {'; '.join(marks)}").rstrip()


# -- commands -------------------------------------------------------------------------------------

def cmd_new(required: int) -> None:
    status, projects = call("GET", f"/organizations/{ORG_ID}/projects", "alice")
    project_id = next((p["id"] for p in projects if p.get("name") == PROJECT_NAME), None) if status == 200 else None
    if project_id is None:
        status, project = call("POST", f"/organizations/{ORG_ID}/projects", "alice",
                               {"name": PROJECT_NAME, "description": "Manual testing sandbox"})
        if status != 201:
            sys.exit(f"Could not create the sandbox project: {status} {project}")
        project_id = project["id"]
    status, task = call("POST", f"/projects/{project_id}/tasks", "alice", {
        "title": "SCRUM-38 sandbox", "task_instruction": "Label the passage.", "task_type": "text",
        "annotation_mode": "human_first", "label_schema_ref": "default", "required_annotators": required,
    })
    if status != 201:
        sys.exit(f"Could not create task: {status} {task}")
    status, body = call("POST", f"/tasks/{task['id']}/dataset-registration", "alice", {"items": [{
        "external_item_ref": "sandbox_scrum38_001", "location_ref": SEED_TEXT_REF,
        "payload_preview": {"text": "sandbox"}}]})
    if status != 201:
        sys.exit(f"Could not register dataset: {status} {body}")
    # Since PR #41 a task starts as draft and accepts no work until it is activated.
    status, body = call("POST", f"/projects/{project_id}/tasks/{task['id']}/activate", "alice")
    if status != 200:
        sys.exit(f"Could not activate task: {status} {body}")
    item = call("GET", f"/tasks/{task['id']}/task-items", "alice")[1][0]
    print(f"Active task, required_annotators={required}.\n  task      {task['id']}\n  item      {item['id']}")
    print(f"  annotate  {WEB}/tasks/{task['id']}/annotate\n  review    {WEB}/tasks/{task['id']}/review")


def cmd_submit(task_id: str, item_id: str, who: str, label: str) -> None:
    status, draft = call("POST", f"/task-items/{item_id}/drafts", who, {"draft_data": {"label": label}})
    if status != 201:
        sys.exit(f"{who} could not create a draft: {status} {draft}")
    status, body = call("POST", f"/drafts/{draft['id']}/submit", who, {})
    print(f"{who} submitted: {status} annotation_id={body.get('annotation_id') if isinstance(body, dict) else body}")


def cmd_review(task_id: str, item_id: str, author: str, action: str, reviewer: str) -> None:
    current = call("GET", f"/task-items/{item_id}/annotations", "alice")[1]["annotations"]
    if author.startswith("ai:"):
        target = next((a for a in current if a["author_role"] == "ai_model" and a["model_name"] == author[3:]), None)
    else:
        token(author)
        target = next((a for a in current if a["created_by"] == _ids[author]), None)
    if target is None:
        sys.exit(f"{author} has no current submission on {item_id}")
    status, body = call("POST", f"/tasks/{task_id}/task-items/{item_id}/review-actions", reviewer, {
        "action": action, "annotation_id": target["id"],
        "justification": f"Walkthrough: {action} {author}'s answer.",
        "feedback": None if action == "accept" else "Walkthrough: please redo the label.",
    })
    outcome = body.get("next_ui_status") if status == 200 else body
    print(f"{reviewer} {action} {author} on {target['id']}: {status} {outcome}")


def cmd_versions(item_id: str, include_all: bool, who: str) -> None:
    query = "?include_superseded=true" if include_all else ""
    status, body = call("GET", f"/task-items/{item_id}/annotations{query}", who)
    if status != 200:
        sys.exit(f"{status} {body}")
    print(f"{item_id} as {who}{' (with superseded)' if include_all else ''}: "
          f"{len(body['annotations'])} shown, total_count={body['total_count']}")
    for annotation in sorted(body["annotations"], key=lambda a: a["created_at"]):
        print(describe(annotation))


def cmd_history(annotation_id: str, who: str) -> None:
    status, body = call("GET", f"/annotations/{annotation_id}/history", who)
    if status != 200:
        print(f"{status} {body}")
        return
    print(f"history of {annotation_id} as {who}: {body['total_versions']} versions")
    for version in body["versions"]:
        print(describe(version))


def cmd_reopen(task_id: str, item_id: str) -> None:
    status, body = call("POST", f"/tasks/{task_id}/task-items/{item_id}/reopen", "alice",
                        {"reason": "Walkthrough: the guideline changed."})
    print(f"reopen: {status} {body.get('status') if status == 200 else body}")


def cmd_export(task_id: str) -> None:
    status, body = call("GET", f"/tasks/{task_id}/export-annotations?format=normalized_json", "alice")
    if status != 200:
        sys.exit(f"normalized export: {status} {body}")
    print("normalized export, every answer:")
    found: list[dict] = []

    def walk(node) -> None:
        if isinstance(node, dict):
            if "annotation_id" in node and "author_role" in node:
                found.append(node)
            for value in node.values():
                walk(value)
        elif isinstance(node, list):
            for value in node:
                walk(value)

    walk(body)
    for entry in found:
        marker = entry["authoritative_cause"] if entry["is_authoritative"] else "-"
        print(f"  {entry['annotation_id']}  v{entry['version']}  {entry['author_role']:<9}"
              f" model={entry['model_provider']}/{entry['model_name']}"
              f"  from={entry['derived_from_annotation_id']} ({entry['derivation']})  authoritative={marker}")
    status, legacy = call("GET", f"/tasks/{task_id}/export-annotations", "alice")
    if status != 200:
        sys.exit(f"legacy export: {status} {legacy}")
    for item in legacy["items"]:
        print(f"legacy export, {item['item_id']}: keys {sorted(item['annotations_by_creator'])}")
        for key, entry in item["annotations_by_creator"].items():
            print(f"  {key:<28} creator_name={entry['creator_name']}")


def in_backend(code: str) -> None:
    """Run Python against the database the API uses: inside the backend container by default.

    HEJ_SANDBOX_DB_URL runs it with the local venv against that database instead, for an API
    started outside docker (how this script was checked, on a throwaway database).
    """
    db_url = os.environ.get("HEJ_SANDBOX_DB_URL")
    if db_url:
        api_dir = os.path.join(HEJ, "apps", "hej-api")
        command = [os.path.join(api_dir, ".venv", "Scripts", "python.exe"), "-"]
        result = subprocess.run(command, input=code, text=True, capture_output=True, cwd=api_dir,
                                env={**os.environ, "DATABASE_URL": db_url})
    else:
        result = subprocess.run(["docker", "compose", "exec", "-T", "backend", "uv", "run", "python", "-"],
                                input=code, text=True, capture_output=True, cwd=HEJ)
    print((result.stdout or "").strip() or (result.stderr or "").strip()[-800:])


PRELUDE = """
from app.core.database import SessionLocal
from app.models.db_models import AnnotationDB
db = SessionLocal()
"""


def cmd_ai_answer(item_id: str, provider: str, model: str, label: str) -> None:
    in_backend(PRELUDE + f"""
from app.repositories.db_store import DBStore
from app.services.draft_service import DraftService
from app.services.id_service import new_id
draft = DBStore(db).drafts.create(
    draft_id=new_id("draft"), task_item_id={item_id!r}, annotation_type="classification", status="pending",
    draft_data={{"label": {label!r}, "metadata": {{"ai": {{"status": "succeeded",
        "provider": {provider!r}, "model": {model!r}}}}}}}, created_by=None)
submitted = DraftService(db).submit_draft(draft.id, user_id=None)
print("ai answer:", submitted.annotation_id)
""")


def cmd_mark(annotation_id: str) -> None:
    token("alice")
    in_backend(PRELUDE + f"""
from fastapi import HTTPException
from app.services.annotation_versions import ADJUDICATION_ACCEPT, mark_authoritative
try:
    mark_authoritative(db, db.get(AnnotationDB, {annotation_id!r}), actor_id={_ids['alice']},
                       cause=ADJUDICATION_ACCEPT)
    db.commit()
    print("marked {annotation_id} authoritative")
except HTTPException as refused:
    db.rollback()
    print("refused:", refused.status_code, refused.detail)
""")


def main() -> None:
    args = sys.argv[1:]
    if not args or args[0] in {"-h", "--help"}:
        print(__doc__)
        return
    command, rest = args[0], [a for a in args[1:]]
    who = flag(rest, "--as", "alice")
    positional = [a for i, a in enumerate(rest) if a not in {"--all", "--as"} and (i == 0 or rest[i - 1] != "--as")]
    if command == "new":
        cmd_new(int(positional[0]) if positional else 2)
    elif command == "submit" and len(positional) == 4:
        cmd_submit(*positional)
    elif command == "review" and len(positional) == 4:
        cmd_review(*positional, flag(rest, "--as", "erin"))
    elif command == "versions" and len(positional) == 1:
        cmd_versions(positional[0], "--all" in rest, who)
    elif command == "history" and len(positional) == 1:
        cmd_history(positional[0], who)
    elif command == "reopen" and len(positional) == 2:
        cmd_reopen(*positional)
    elif command == "export" and len(positional) == 1:
        cmd_export(positional[0])
    elif command == "ai-answer" and len(positional) == 4:
        cmd_ai_answer(*positional)
    elif command == "mark" and len(positional) == 1:
        cmd_mark(positional[0])
    else:
        print(__doc__)


if __name__ == "__main__":
    main()
