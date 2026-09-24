"""Recreate the TechStart role-testing sandbox.

`init_data.py --reset` wipes everything below, so re-run this afterwards.

Usage (from apps/hej-api, with the API already running on :8000):

    .venv/Scripts/python ../../../docs/sandbox/tools/seed_test_roles.py
    .venv/Scripts/python ../../../docs/sandbox/tools/seed_test_roles.py --base http://localhost:8011/api/v1

Idempotent: users that already exist are left alone; the project/task/items are
only created if the task is missing.
"""

from __future__ import annotations

import argparse
import json
import urllib.error
import urllib.request

ORG_ID = 2  # TechStart Inc
ADMIN = ("alice@example.com", "SecurePass1Alice")

USERS = [
    ("dana@example.com", "SecurePass4Dana", "Dana", ["annotator"]),
    ("erin@example.com", "SecurePass5Erin", "Erin", ["reviewer"]),
    ("frank@example.com", "SecurePass6Frank", "Frank", ["annotator", "reviewer"]),
    ("grace@example.com", "SecurePass7Grace", "Grace", ["arbitrator"]),
]

TASK_TITLE = "Text span annotation - sandbox"

ITEMS = [
    ("sandbox_text_001", "text/item_001.json", "SCRUM-28: finalize then try to overwrite"),
    ("sandbox_text_002", "text/item_002.json", "ownerless-draft / self-approval case"),
    ("sandbox_text_003", "text/item_001.json", "SCRUM-25: draft ownership (keep clean)"),
    ("sandbox_text_004", "text/item_002.json", "self-approval with an owned draft"),
    ("sandbox_text_005", "text/item_001.json", "SCRUM-26: atomicity / spare"),
]


def call(base, method, path, token=None, body=None):
    req = urllib.request.Request(f"{base}{path}", method=method)
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    data = None
    if body is not None:
        req.add_header("Content-Type", "application/json")
        data = json.dumps(body).encode()
    try:
        with urllib.request.urlopen(req, data) as r:
            raw = r.read().decode()
            return r.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw)
        except json.JSONDecodeError:
            return e.code, raw


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://localhost:8000/api/v1")
    base = ap.parse_args().base

    status, body = call(base, "POST", "/auth/login", body={"email": ADMIN[0], "password": ADMIN[1]})
    if status != 200:
        raise SystemExit(f"login failed ({status}): {body}\nIs the API running on {base}?")
    token = body["access_token"]
    print(f"logged in as {ADMIN[0]}")

    print("\n[users]")
    for email, password, name, roles in USERS:
        status, body = call(
            base, "POST", "/admin/users", token,
            {"email": email, "password": password, "name": name,
             "organization_id": ORG_ID, "roles": roles},
        )
        if status == 201:
            print(f"  created  {email:<22} {','.join(roles)}")
        elif status == 409:
            print(f"  exists   {email:<22} {','.join(roles)}")
        else:
            print(f"  FAILED   {email:<22} {status} {body}")

    print("\n[project / task / items]")
    status, projects = call(base, "GET", f"/organizations/{ORG_ID}/projects", token)
    project = next((p for p in (projects or []) if p["name"] == "Draft Ownership Sandbox"), None)
    if project is None:
        status, project = call(
            base, "POST", f"/organizations/{ORG_ID}/projects", token,
            {"name": "Draft Ownership Sandbox",
             "description": "Fixture for SCRUM-25/26/28.",
             "governance_model": "standard"},
        )
        print(f"  created project {project['id']}")
    else:
        print(f"  exists  project {project['id']}")

    status, tasks = call(base, "GET", f"/projects/{project['id']}/tasks", token)
    task = next((t for t in (tasks or []) if t["title"] == TASK_TITLE), None)
    if task is not None:
        print(f"  exists  task    {task['id']} - items left untouched")
        return

    status, task = call(
        base, "POST", f"/projects/{project['id']}/tasks", token,
        {"title": TASK_TITLE,
         "description": "Human-first text annotation used to exercise the draft lifecycle.",
         "judgment_question": "Mark spans that support or contradict the claim.",
         "task_type": "text", "annotation_mode": "human_first",
         "label_schema_ref": "text_span_schema_v1",
         "text_span_label_options": ["supports", "contradicts", "insufficient_evidence", "ambiguous"]},
    )
    print(f"  created task    {task['id']}")

    status, body = call(
        base, "POST", f"/tasks/{task['id']}/dataset-registration", token,
        {"items": [
            {"external_item_ref": ref,
             "location_ref": f"mock://fixtures/{fixture}",
             "payload_preview": {"preview": note},
             "access_policy_ref": "access_policy_v1",
             "source_version_ref": "v1.0"}
            for ref, fixture, note in ITEMS
        ]},
    )
    for item in body["created_task_items"]:
        print(f"  created item    {item['id']}  {item['external_item_ref']}")

    print("\nNote: dataset registration auto-creates one ownerless draft per item")
    print("(created_by = NULL). That is not a bug in this script - see sandbox/W6/plans/plan-SCRUM-25-26-28.md, Commit 1.")


if __name__ == "__main__":
    main()
