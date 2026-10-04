"""Seed a throwaway hej database for the perf investigation, through the API.

Run against a server whose .env points at a disposable database (never the
shared dev DB), after `init_data.py --reset` on that database:

    .venv/Scripts/python <path>/sandbox-perf-seed.py --base http://127.0.0.1:8011/api/v1

Creates, in TechStart (org 2): five users, one project with eight human-first
text-span tasks (10, 50 and 200 items from the FewNERD subset, plus five of
20), every task activated. On the 200-item task: two annotators submit on
every item; a reviewer accepts most submissions, escalates some to an expert
who sends them back, and half of the sent-back items are resubmitted - the
history the task-items read path (H2) scans. Prints the task ids as JSON.
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
    "ann1": ("perf.ann1@example.com", "PerfPass1Ann", ["annotator"]),
    "ann2": ("perf.ann2@example.com", "PerfPass2Ann", ["annotator"]),
    "rev1": ("perf.rev1@example.com", "PerfPass3Rev", ["reviewer"]),
    "arb": ("perf.arb@example.com", "PerfPass4Arb", ["arbitrator"]),
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
    ap.add_argument("--base", default="http://127.0.0.1:8011/api/v1")
    base = ap.parse_args().base

    records = [json.loads(line) for line in
               find_upward("dataset/text_dataset/fewnerd/source/fewnerd_text_ner_source_subset.jsonl")
               .read_text(encoding="utf-8").splitlines() if line.strip()]

    admin = login(base, *ADMIN)
    for email, password, roles in USERS.values():
        call(base, "POST", "/admin/users", admin,
             {"email": email, "password": password, "name": email.split("@")[0],
              "organization_id": ORG_ID, "roles": roles}, ok=(201, 409))
    tok = {k: login(base, e, p) for k, (e, p, _) in USERS.items()}

    _, project = call(base, "POST", f"/organizations/{ORG_ID}/projects", admin,
                      {"name": "Perf Investigation", "description": "Throwaway perf data.",
                       "governance_model": "standard"})
    pid = project["id"]

    tasks = {}
    tasks["t10"], _ = make_task(base, admin, pid, "perf-10", records[:10], 1)
    tasks["t50"], _ = make_task(base, admin, pid, "perf-50", records[:50], 1)
    tasks["t200"], items200 = make_task(base, admin, pid, "perf-200", records[:200], 2)
    for n in range(5):
        tasks[f"s{n}"], _ = make_task(base, admin, pid, f"perf-small-{n}", records[n * 20:(n + 1) * 20], 1)

    # History on the 200-item task.
    t200 = tasks["t200"]
    sent_back = []
    for i, item in enumerate(items200):
        a1 = submit(base, tok["ann1"], item["id"], "ann1")
        submit(base, tok["ann2"], item["id"], "ann2")
        if i % 5 == 4:  # 40 items: escalate to an expert, who sends back
            call(base, "POST", f"/tasks/{t200}/task-items/{item['id']}/review-actions", tok["rev1"],
                 {"action": "escalate", "annotation_id": a1, "justification": "unsure"})
            call(base, "POST", f"/tasks/{t200}/task-items/{item['id']}/escalations/route", tok["rev1"],
                 {"target": "expert", "note": "perf"})
            call(base, "POST", f"/tasks/{t200}/task-items/{item['id']}/escalations/decision", tok["arb"],
                 {"decision": "send_back", "note": "redo"})
            sent_back.append(item["id"])
        elif i % 5 != 3:  # 120 items: accept the first submission
            call(base, "POST", f"/tasks/{t200}/task-items/{item['id']}/review-actions", tok["rev1"],
                 {"action": "accept", "annotation_id": a1, "justification": "ok"})
        if i % 20 == 0:
            print(f"  history {i}/200", flush=True)
    for item_id in sent_back[::2]:  # half of them resubmitted
        submit(base, tok["ann1"], item_id, "ann1 resubmitted")

    tasks["project_id"] = pid
    print(json.dumps(tasks))


if __name__ == "__main__":
    main()
