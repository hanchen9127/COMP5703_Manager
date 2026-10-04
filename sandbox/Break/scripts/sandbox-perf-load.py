"""Replay the web app's page loads against the instrumented API (perf investigation).

Sends the same requests, in the same phases, as hej-web on origin/main, with at
most 6 in flight - Chrome's limit per origin over HTTP/1.1. Each request carries
`x-perf-tag: <scenario>`, which sandbox-perf-server.py writes into its logs.

    .venv/Scripts/python <path>/sandbox-perf-load.py --tasks '<seed json>' --reps 5 --out <dir>

Writes <out>/pages.csv: scenario, rep, user, wall_ms, requests.
"""

from __future__ import annotations

import argparse
import csv
import json
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import httpx

USERS = {
    "admin": ("alice@example.com", "SecurePass1Alice"),
    "ann1": ("perf.ann1@example.com", "PerfPass1Ann"),
}


class Browser:
    def __init__(self, base: str, token: str, tag: str):
        self.client = httpx.Client(
            base_url=base,
            headers={"Authorization": f"Bearer {token}", "x-perf-tag": tag},
            limits=httpx.Limits(max_connections=6, max_keepalive_connections=6),
            timeout=120,
        )
        self.pool = ThreadPoolExecutor(6)
        self.count = 0

    def get(self, path: str):
        self.count += 1
        r = self.client.get(path)
        return r.json() if r.status_code == 200 else None

    def all(self, paths):
        return list(self.pool.map(self.get, paths))

    def close(self):
        self.pool.shutdown()
        self.client.close()


FRONTEND = "main"  # main: origin/main. dedupe: tabs reuse the shell's drafts. batch: one drafts-batch call.


def task_shell(b: Browser, task_id: str):
    """TaskWorkspaceClientShell: hydration + enrichment, started together."""
    enrichment = b.pool.submit(b.get, f"/tasks/{task_id}/setup")
    task = b.get(f"/tasks/{task_id}")
    items, _ = b.all([f"/tasks/{task_id}/task-items", f"/projects/{task['project_id']}"])
    if FRONTEND == "batch":
        b.get(f"/tasks/{task_id}/drafts-batch")
    else:
        b.all([f"/task-items/{i['id']}/drafts" for i in items])
    enrichment.result()
    return items


def tab_drafts(b: Browser, items):
    """The Annotate and Review tabs' own second fetch, gone unless FRONTEND is main."""
    if FRONTEND == "main":
        b.all([f"/task-items/{i['id']}/drafts" for i in items])


def page_items(b, task_id):
    task_shell(b, task_id)


def page_annotate(b, task_id):
    tab_drafts(b, task_shell(b, task_id))


def page_review(b, task_id):
    items = task_shell(b, task_id)
    audit = b.pool.submit(b.get, f"/tasks/{task_id}/audit-logs?limit=8")
    tab_drafts(b, items)
    audit.result()


def page_project(b, project_id):
    _, policies, _, _ = b.all([f"/projects/{project_id}", f"/projects/{project_id}/policies",
                               f"/projects/{project_id}/disputes", f"/projects/{project_id}/exports"])
    b.get("/organizations")
    tasks = (policies or {}).get("tasks") or []
    b.all([f"/tasks/{t['task']['id']}/setup" for t in tasks])


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://127.0.0.1:8011/api/v1")
    ap.add_argument("--tasks", required=True, help="the JSON line sandbox-perf-seed.py printed")
    ap.add_argument("--reps", type=int, default=5)
    ap.add_argument("--out", type=Path, required=True)
    ap.add_argument("--only", default="", help="comma-separated scenario names")
    ap.add_argument("--frontend", choices=["main", "dedupe", "batch"], default="main")
    args = ap.parse_args()
    global FRONTEND
    FRONTEND = args.frontend
    t = json.loads(args.tasks)

    tokens = {}
    for user, (email, password) in USERS.items():
        r = httpx.post(f"{args.base}/auth/login", json={"email": email, "password": password})
        tokens[user] = r.json()["access_token"]

    scenarios = []
    for user in ("ann1", "admin"):
        for size in ("t10", "t50", "t200"):
            scenarios.append((f"items-{size}-{user}", user, page_items, t[size]))
            scenarios.append((f"annotate-{size}-{user}", user, page_annotate, t[size]))
            scenarios.append((f"review-{size}-{user}", user, page_review, t[size]))
    scenarios.append(("project-8tasks-admin", "admin", page_project, t["project_id"]))
    if args.only:
        wanted = set(args.only.split(","))
        scenarios = [s for s in scenarios if s[0] in wanted]

    args.out.mkdir(parents=True, exist_ok=True)
    with open(args.out / "pages.csv", "a", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        if f.tell() == 0:
            w.writerow(["scenario", "rep", "user", "wall_ms", "requests"])
        for name, user, fn, target in scenarios:
            for rep in range(args.reps + 1):  # rep 0 is a warm-up, kept but marked
                b = Browser(args.base, tokens[user], f"{name}#{rep}")
                t0 = time.perf_counter()
                fn(b, target)
                wall = (time.perf_counter() - t0) * 1000
                b.close()
                w.writerow([name, rep, user, f"{wall:.1f}", b.count])
                f.flush()
            print(f"{name}: done", flush=True)


if __name__ == "__main__":
    main()
