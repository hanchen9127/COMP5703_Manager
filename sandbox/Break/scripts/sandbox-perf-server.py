"""Run hej-api with per-request SQL instrumentation (perf investigation, local only).

Product code is not touched: this script imports the app, hooks SQLAlchemy's
cursor events on the app's engine, and wraps the ASGI app in a timing layer.

Usage (from a hej worktree's apps/hej-api, whose .env points at a throwaway DB):

    .venv/Scripts/python <path>/sandbox-perf-server.py --port 8011 --out <dir>

Writes into --out:
    requests.csv      one row per request: method, route, path, status, total_ms,
                      sql_count, sql_ms, writes (1 if any INSERT/UPDATE/DELETE ran)
    statements.jsonl  one row per SQL statement: request id, route, normalised SQL, ms
"""

from __future__ import annotations

import argparse
import contextvars
import csv
import itertools
import json
import os
import re
import sys
import time
from pathlib import Path

sys.path.insert(0, os.getcwd())

from sqlalchemy import event  # noqa: E402

from app.core.database import engine  # noqa: E402
from app.main import app as hej_app  # noqa: E402

_current = contextvars.ContextVar("perf_request", default=None)
_ids = itertools.count(1)
_IN_LIST = re.compile(r"IN \((?:%\([^)]+\)s(?:, )?)+\)")
_POSTCOMPILE = re.compile(r"\(__\[POSTCOMPILE_[^\]]+\]\)")


def normalise(sql: str) -> str:
    sql = " ".join(sql.split())
    sql = _IN_LIST.sub("IN (...)", sql)
    return _POSTCOMPILE.sub("(...)", sql)


@event.listens_for(engine, "before_cursor_execute")
def _before(conn, cursor, statement, parameters, context, executemany):
    conn.info.setdefault("perf_t0", []).append(time.perf_counter())


@event.listens_for(engine, "after_cursor_execute")
def _after(conn, cursor, statement, parameters, context, executemany):
    t0 = conn.info["perf_t0"].pop()
    rec = _current.get()
    if rec is None:
        return
    ms = (time.perf_counter() - t0) * 1000
    rec["sql_count"] += 1
    rec["sql_ms"] += ms
    head = statement.lstrip()[:6].upper()
    if head in ("INSERT", "UPDATE", "DELETE"):
        rec["writes"] = 1
    rec["statements"].append((normalise(statement), ms))


class Instrumented:
    def __init__(self, app, out: Path):
        self.app = app
        out.mkdir(parents=True, exist_ok=True)
        self.req_file = open(out / "requests.csv", "a", newline="", encoding="utf-8")
        self.req_csv = csv.writer(self.req_file)
        if self.req_file.tell() == 0:
            self.req_csv.writerow(
                ["id", "tag", "method", "route", "path", "status", "total_ms", "sql_count", "sql_ms", "writes"]
            )
        self.stmt_file = open(out / "statements.jsonl", "a", encoding="utf-8")

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http" or scope["method"] == "OPTIONS":
            await self.app(scope, receive, send)
            return
        rec = {"id": next(_ids), "sql_count": 0, "sql_ms": 0.0, "writes": 0, "statements": [], "status": 0,
               "tag": dict(scope["headers"]).get(b"x-perf-tag", b"").decode()}
        token = _current.set(rec)

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                rec["status"] = message["status"]
            await send(message)

        t0 = time.perf_counter()
        try:
            await self.app(scope, receive, send_wrapper)
        finally:
            total = (time.perf_counter() - t0) * 1000
            _current.reset(token)
            route = getattr(scope.get("route"), "path", scope["path"])
            self.req_csv.writerow(
                [rec["id"], rec["tag"], scope["method"], route, scope["path"], rec["status"],
                 f"{total:.2f}", rec["sql_count"], f"{rec['sql_ms']:.2f}", rec["writes"]]
            )
            self.req_file.flush()
            for sql, ms in rec["statements"]:
                self.stmt_file.write(json.dumps({"id": rec["id"], "tag": rec["tag"], "route": route, "sql": sql, "ms": round(ms, 3)}) + "\n")
            self.stmt_file.flush()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8011)
    ap.add_argument("--out", type=Path, required=True)
    ap.add_argument("--experiment", default="", help="comma-separated names from sandbox-perf-experiments.py")
    args = ap.parse_args()

    # Sync routes run in the threadpool; copy_context in Starlette carries the
    # contextvar into the worker thread, so statements land on the right request.
    if args.experiment:
        import importlib.util

        spec = importlib.util.spec_from_file_location("perf_exp", Path(__file__).with_name("sandbox-perf-experiments.py"))
        exp = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(exp)
        exp.apply(hej_app, set(args.experiment.split(",")))
        print(f"experiments: {args.experiment}", flush=True)

    import uvicorn

    uvicorn.run(Instrumented(hej_app, args.out), host="127.0.0.1", port=args.port, log_level="warning")


if __name__ == "__main__":
    main()
