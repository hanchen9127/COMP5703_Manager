"""Summarise one perf run directory (pages.csv, requests.csv, statements.jsonl).

    .venv/Scripts/python <path>/sandbox-perf-report.py <run dir> [--top 15]

Warm-up reps (#0) are excluded. Prints: page wall time (median of reps), the
cost per route, and the SQL statements ranked by total time.
"""

from __future__ import annotations

import argparse
import csv
import json
import statistics
from collections import defaultdict
from pathlib import Path


def median(xs):
    return statistics.median(xs) if xs else 0.0


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("run", type=Path)
    ap.add_argument("--top", type=int, default=15)
    ap.add_argument("--scenario", default="", help="restrict route/SQL tables to tags starting with this")
    args = ap.parse_args()

    pages = defaultdict(list)
    reqs_per_page = {}
    with open(args.run / "pages.csv", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if row["rep"] == "0":
                continue
            pages[row["scenario"]].append(float(row["wall_ms"]))
            reqs_per_page[row["scenario"]] = int(row["requests"])

    per_tag = defaultdict(lambda: {"sql": 0, "sql_ms": 0.0, "srv_ms": 0.0, "writes": 0})
    routes = defaultdict(lambda: {"n": 0, "ms": [], "sql": [], "sql_ms": [], "writes": 0})
    with open(args.run / "requests.csv", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            tag = row["tag"]
            if not tag or tag.endswith("#0"):
                continue
            t = per_tag[tag]
            t["sql"] += int(row["sql_count"])
            t["sql_ms"] += float(row["sql_ms"])
            t["srv_ms"] += float(row["total_ms"])
            t["writes"] += int(row["writes"])
            if args.scenario and not tag.startswith(args.scenario):
                continue
            r = routes[f"{row['method']} {row['route']}"]
            r["n"] += 1
            r["ms"].append(float(row["total_ms"]))
            r["sql"].append(int(row["sql_count"]))
            r["sql_ms"].append(float(row["sql_ms"]))
            r["writes"] += int(row["writes"])

    print("## Pages (median of reps; server and SQL totals are per page load)\n")
    print("| Scenario | Wall ms | Requests | SQL stmts | SQL ms | Server ms (sum) | Writing GETs |")
    print("| --- | ---: | ---: | ---: | ---: | ---: | ---: |")
    for name, walls in pages.items():
        tags = [k for k in per_tag if k.split("#")[0] == name]
        n = max(len(tags), 1)
        sql = sum(per_tag[k]["sql"] for k in tags) / n
        sql_ms = sum(per_tag[k]["sql_ms"] for k in tags) / n
        srv = sum(per_tag[k]["srv_ms"] for k in tags) / n
        wr = sum(per_tag[k]["writes"] for k in tags) / n
        print(f"| {name} | {median(walls):.0f} | {reqs_per_page[name]} | {sql:.0f} | {sql_ms:.0f} | {srv:.0f} | {wr:.0f} |")

    print("\n## Routes\n")
    print("| Route | Calls | Median ms | p95 ms | SQL/call | SQL ms/call | Writing calls |")
    print("| --- | ---: | ---: | ---: | ---: | ---: | ---: |")
    for name, r in sorted(routes.items(), key=lambda kv: -sum(kv[1]["ms"])):
        ms = sorted(r["ms"])
        p95 = ms[min(len(ms) - 1, int(len(ms) * 0.95))]
        print(f"| {name} | {r['n']} | {median(ms):.1f} | {p95:.1f} | {median(r['sql']):.0f} | {median(r['sql_ms']):.1f} | {r['writes']} |")

    stmts = defaultdict(lambda: {"n": 0, "ms": [], "routes": set()})
    with open(args.run / "statements.jsonl", encoding="utf-8") as f:
        for line in f:
            s = json.loads(line)
            if not s["tag"] or s["tag"].endswith("#0"):
                continue
            if args.scenario and not s["tag"].startswith(args.scenario):
                continue
            st = stmts[s["sql"]]
            st["n"] += 1
            st["ms"].append(s["ms"])
            st["routes"].add(s["route"])
    total = sum(sum(v["ms"]) for v in stmts.values()) or 1
    print(f"\n## SQL statements by total time (top {args.top}; all statements {total:.0f} ms)\n")
    print("| # | Total ms | Share | Calls | Mean ms | Max ms | Routes | Statement |")
    print("| ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |")
    ranked = sorted(stmts.items(), key=lambda kv: -sum(kv[1]["ms"]))
    for i, (sql, v) in enumerate(ranked[: args.top], 1):
        tot = sum(v["ms"])
        short = sql[:160].replace("|", "\\|")
        print(f"| {i} | {tot:.0f} | {tot / total:.0%} | {v['n']} | {tot / v['n']:.2f} | {max(v['ms']):.1f} | "
              f"{len(v['routes'])} | `{short}` |")
    slowest = sorted(((max(v["ms"]), sql) for sql, v in stmts.items()), reverse=True)[:5]
    print("\n## Slowest single executions\n")
    for ms, sql in slowest:
        print(f"- {ms:.1f} ms: `{sql[:200]}`")


if __name__ == "__main__":
    main()
