"""Reproduce: a reopened item is flipped to expert_send_back by the next read (H2 side effect).

Path: annotate -> escalate -> expert sends back -> resubmit -> accept (finalised)
-> project owner reopens (D9) -> GET task-items. Expected `pending`; the
repair-on-read in task_item_status_resolution.py turns it into expert_send_back.

Run against a plain origin/main server on a throwaway DB seeded by sandbox-perf-seed.py:
    .venv/Scripts/python <path>/sandbox-perf-reopen-flip.py --base http://127.0.0.1:8015/api/v1 --task <t50 id>
"""

import argparse

import httpx


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://127.0.0.1:8015/api/v1")
    ap.add_argument("--task", required=True, help="a human-first task with required_annotators 1")
    args = ap.parse_args()
    base, tid = args.base, args.task

    def login(email, password):
        r = httpx.post(f"{base}/auth/login", json={"email": email, "password": password})
        return {"Authorization": f"Bearer {r.json()['access_token']}"}

    admin = login("alice@example.com", "SecurePass1Alice")
    ann = login("perf.ann1@example.com", "PerfPass1Ann")
    rev = login("perf.rev1@example.com", "PerfPass3Rev")
    arb = login("perf.arb@example.com", "PerfPass4Arb")

    def call(method, path, h, body=None):
        r = httpx.request(method, f"{base}{path}", headers=h, json=body, timeout=60)
        if r.status_code >= 400:
            raise SystemExit(f"{method} {path} -> {r.status_code}: {r.text}")
        return r.json()

    def status_of(item_id):
        return next(i["status"] for i in call("GET", f"/tasks/{tid}/task-items", admin) if i["id"] == item_id)

    item = next(i for i in call("GET", f"/tasks/{tid}/task-items", admin) if i["status"] == "pending")
    iid = item["id"]

    def submit(note):
        d = call("POST", f"/task-items/{iid}/drafts", ann, {"draft_data": {"spans": [], "note": note}})
        return call("POST", f"/drafts/{d['id']}/submit", ann, {})["annotation_id"]

    a1 = submit("first")
    call("POST", f"/tasks/{tid}/task-items/{iid}/review-actions", rev,
         {"action": "escalate", "annotation_id": a1, "justification": "unsure"})
    call("POST", f"/tasks/{tid}/task-items/{iid}/escalations/route", rev, {"target": "expert", "note": "x"})
    call("POST", f"/tasks/{tid}/task-items/{iid}/escalations/decision", arb, {"decision": "send_back", "note": "redo"})
    print("after send-back:        ", status_of(iid))
    a2 = submit("resubmitted")
    print("after resubmit:         ", status_of(iid))
    call("POST", f"/tasks/{tid}/task-items/{iid}/review-actions", rev,
         {"action": "accept", "annotation_id": a2, "justification": "ok"})
    print("after accept:           ", status_of(iid))
    r = call("POST", f"/tasks/{tid}/task-items/{iid}/reopen", admin, {"reason": "perf repro: reopen"})
    print("reopen response:        ", {k: r[k] for k in r if "status" in k} or r)
    print("first read after reopen:", status_of(iid))
    print("second read:            ", status_of(iid))


if __name__ == "__main__":
    main()
