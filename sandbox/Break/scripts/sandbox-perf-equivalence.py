"""Check that the perf prototypes return exactly what origin/main returns.

Compares a plain server (--base, origin/main behaviour) with one running the
experiments (--exp), on the same database:
- every item's GET /task-items/{id}/drafts against drafts-batch[id];
- GET /tasks/{id}/task-items and /setup item statuses, with and without repair.
For admin (reviewer view), ann1 (answered every 200-task item) and ann3, a
fresh annotator who answered nothing - the case where peers' drafts are hidden.

    .venv/Scripts/python <path>/sandbox-perf-equivalence.py --tasks '<seed json>'
"""

from __future__ import annotations

import argparse
import json

import httpx

ADMIN = ("alice@example.com", "SecurePass1Alice")
USERS = {
    "admin": ADMIN,
    "ann1": ("perf.ann1@example.com", "PerfPass1Ann"),
    "ann3": ("perf.ann3@example.com", "PerfPass5Ann"),
}


def login(base, email, password):
    return httpx.post(f"{base}/auth/login", json={"email": email, "password": password}).json()["access_token"]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://127.0.0.1:8011/api/v1")
    ap.add_argument("--exp", default="http://127.0.0.1:8012/api/v1")
    ap.add_argument("--tasks", required=True)
    args = ap.parse_args()
    t = json.loads(args.tasks)

    admin = login(args.base, *ADMIN)
    httpx.post(f"{args.base}/admin/users", headers={"Authorization": f"Bearer {admin}"},
               json={"email": USERS["ann3"][0], "password": USERS["ann3"][1], "name": "perf.ann3",
                     "organization_id": 2, "roles": ["annotator"]})

    failures = 0
    for user, (email, password) in USERS.items():
        h = {"Authorization": f"Bearer {login(args.base, email, password)}"}
        for size in ("t10", "t50", "t200"):
            tid = t[size]
            items = httpx.get(f"{args.base}/tasks/{tid}/task-items", headers=h).json()
            batch = httpx.get(f"{args.exp}/tasks/{tid}/drafts-batch", headers=h, timeout=60).json()
            hidden_somewhere = False
            for it in items:
                one = httpx.get(f"{args.base}/task-items/{it['id']}/drafts", headers=h).json()["drafts"]
                if one != batch.get(it["id"]):
                    failures += 1
                    print(f"  DRAFTS DIFFER {user} {size} {it['id']}")
                if len(one) < 3 and size == "t200":
                    hidden_somewhere = True
            items_exp = httpx.get(f"{args.exp}/tasks/{tid}/task-items", headers=h).json()
            if items != items_exp:
                failures += 1
                print(f"  TASK-ITEMS DIFFER {user} {size}")
            setup = httpx.get(f"{args.base}/tasks/{tid}/setup", headers=h).json()
            setup_exp = httpx.get(f"{args.exp}/tasks/{tid}/setup", headers=h).json()
            if setup != setup_exp:
                failures += 1
                print(f"  SETUP DIFFERS {user} {size}")
            n = sum(len(v) for v in batch.values())
            print(f"{user:5} {size:4}: {len(items)} items, {n} drafts visible"
                  + (" (peers hidden on some items)" if hidden_somewhere else ""))
    print("EQUIVALENT" if failures == 0 else f"{failures} DIFFERENCES")


if __name__ == "__main__":
    main()
