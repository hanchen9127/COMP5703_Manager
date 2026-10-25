"""Seed the A6 perf bed for SCRUM-121 on current main, through the API.

`../../Break/scripts/sandbox-perf-seed.py`, updated for the code of 2026-10-24:
- a task owner creates the project and its tasks (permission model of 2026-10-20: an
  administrator oversees but doesn't manage projects);
- the 200-item task's Returns go through a reviewer's `revise`, because the expert
  escalation routes the old seed used answer 410 since #48.

Run against a server whose DATABASE_URL points at a throwaway database, after
`init_data.py --reset` on it:

    .venv/Scripts/python <path>/sandbox-perf-seed-a6.py --base http://127.0.0.1:8013/api/v1

Creates, in TechStart (org 2): five users, one project with eight human-first
text-span tasks (10, 50 and 200 FewNERD items, plus five of 20), all activated.
On the 200-item task: two annotators submit on every item, a reviewer accepts
120 first submissions and returns 40, and half of the returned are resubmitted.
Prints the task ids as JSON, as the load script expects.
"""

from __future__ import annotations

import argparse
import json
import urllib.error
import urllib.request
from pathlib import Path

ORG_ID = 2
ADMIN = ("alice@example.com", "SecurePass1Alice")
USERS = {
    "owner": ("perf.owner@example.com", "PerfPass5Own", ["task_owner"]),
    "ann1": ("perf.ann1@example.com", "PerfPass1Ann", ["annotator"]),
    "ann2": ("perf.ann2@example.com", "PerfPass2Ann", ["annotator"]),
    "rev1": ("perf.rev1@example.com", "PerfPass3Rev", ["reviewer"]),
}
LABELS = ["person", "location", "organization", "other"]


def find_upward(rel: str) -> Path:
    here = Path(__file__).resolve()
    for parent in here.parents:
        if (parent / rel).exists():
            return parent / rel
    raise SystemExit(f"{rel} not found above {here}")


def call(base, method, path, token=None, body=None, ok=(200, 201)):
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
            status, payload = r.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            status, payload = e.code, json.loads(raw)
        except json.JSONDecodeError:
            status, payload = e.code, raw
    if ok and status not in ok:
        raise SystemExit(f"{method} {path} -> {status}: {payload}")
    return status, payload


def login(base, email, password):
    _, body = call(base, "POST", "/auth/login", body={"email": email, "password": password})
    return body["access_token"]


def make_task(base, token, project_id, title, records, required):
    _, task = call(base, "POST", f"/projects/{project_id}/tasks", token, {
        "title": title,
        "task_instruction": "Mark named entities.",
        "task_type": "text",
        "annotation_mode": "human_first",
        "annotation_type": "text_spans",
        "label_schema_ref": "text_spans_schema_v1",
        "text_span_label_options": LABELS,
        "required_annotators": required,
    })
    call(base, "POST", f"/tasks/{task['id']}/dataset-registration", token, {"items": [
        {"external_item_ref": f"{title}:{r['external_item_ref']}",
         "location_ref": "mock://fixtures/text/item_001.json",
         "payload_preview": r["payload_preview"],
         "access_policy_ref": "access_policy_v1",
         "source_version_ref": "v1.0"}
        for r in records
    ]})
    call(base, "POST", f"/projects/{project_id}/tasks/{task['id']}/activate", token)
    _, items = call(base, "GET", f"/tasks/{task['id']}/task-items", token)
    return task["id"], items


def submit(base, token, item_id, note):
    _, draft = call(base, "POST", f"/task-items/{item_id}/drafts", token,
                    {"draft_data": {"spans": [], "note": note}})
    _, done = call(base, "POST", f"/drafts/{draft['id']}/submit", token, {})
    return done.get("annotation_id")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://127.0.0.1:8013/api/v1")
    ap.add_argument("--extra-projects", type=int, default=0,
                    help="only add this many projects (two 20-item tasks each) to a bed already seeded")
    args = ap.parse_args()
    base = args.base

    records = [json.loads(line) for line in
               find_upward("dataset/text_dataset/fewnerd/source/fewnerd_text_ner_source_subset.jsonl")
               .read_text(encoding="utf-8").splitlines() if line.strip()]

    if args.extra_projects:  # the Dashboard's scaling (SCRUM-121 commits 6-7)
        owner = login(base, *USERS["owner"][:2])
        for n in range(args.extra_projects):
            _, project = call(base, "POST", f"/organizations/{ORG_ID}/projects", owner,
                              {"name": f"Perf Extra {n:02d}", "description": "Throwaway perf data.",
                               "governance_model": "standard"})
            for t in range(2):
                make_task(base, owner, project["id"], f"extra-{n:02d}-{t}", records[t * 20:(t + 1) * 20], 1)
        print(f"added {args.extra_projects} projects", flush=True)
        return

    admin = login(base, *ADMIN)
    for email, password, roles in USERS.values():
        call(base, "POST", "/admin/users", admin,
             {"email": email, "password": password, "name": email.split("@")[0],
              "organization_id": ORG_ID, "roles": roles}, ok=(201, 409))
    tok = {k: login(base, e, p) for k, (e, p, _) in USERS.items()}
    owner = tok["owner"]

    _, project = call(base, "POST", f"/organizations/{ORG_ID}/projects", owner,
                      {"name": "Perf Investigation", "description": "Throwaway perf data.",
                       "governance_model": "standard"})
    pid = project["id"]

    tasks = {}
    tasks["t10"], _ = make_task(base, owner, pid, "perf-10", records[:10], 1)
    tasks["t50"], _ = make_task(base, owner, pid, "perf-50", records[:50], 1)
    tasks["t200"], items200 = make_task(base, owner, pid, "perf-200", records[:200], 2)
    for n in range(5):
        tasks[f"s{n}"], _ = make_task(base, owner, pid, f"perf-small-{n}", records[n * 20:(n + 1) * 20], 1)

    # History on the 200-item task.
    t200 = tasks["t200"]
    returned = []
    for i, item in enumerate(items200):
        a1 = submit(base, tok["ann1"], item["id"], "ann1")
        submit(base, tok["ann2"], item["id"], "ann2")
        if i % 5 == 4:  # 40 items: the reviewer returns ann1's answer
            call(base, "POST", f"/tasks/{t200}/task-items/{item['id']}/review-actions", tok["rev1"],
                 {"action": "revise", "annotation_id": a1, "justification": "redo", "feedback": "redo"})
            returned.append(item["id"])
        elif i % 5 != 3:  # 120 items: accept the first submission
            call(base, "POST", f"/tasks/{t200}/task-items/{item['id']}/review-actions", tok["rev1"],
                 {"action": "accept", "annotation_id": a1, "justification": "ok"})
        if i % 20 == 0:
            print(f"  history {i}/200", flush=True)
    for item_id in returned[::2]:  # half of them resubmitted
        submit(base, tok["ann1"], item_id, "ann1 resubmitted")

    tasks["project_id"] = pid
    print(json.dumps(tasks))


if __name__ == "__main__":
    main()
