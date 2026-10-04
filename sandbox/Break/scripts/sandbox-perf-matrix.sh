#!/usr/bin/env bash
# Run every perf configuration against the same database, one server at a time.
# From a hej worktree's apps/hej-api (its .env on the throwaway DB):
#   bash <path>/sandbox-perf-matrix.sh '<seed json>' <out root> [reps]
# The database is restored from the container's seed snapshot before each run.
set -euo pipefail
TASKS="$1"; OUT="$2"; REPS="${3:-5}"
HERE="$(cd "$(dirname "$0")" && pwd)"
PY=.venv/Scripts/python

run() {  # name, experiments, frontend
  local name="$1" exp="$2" fe="$3"
  rm -rf "$OUT/$name"
  docker exec hej-perf-pg sh -c "pg_restore -U perf -d hej_perf --clean --if-exists /tmp/seed.dump" >/dev/null 2>&1 || true
  $PY "$HERE/sandbox-perf-server.py" --port 8013 --out "$OUT/$name" ${exp:+--experiment "$exp"} >/dev/null 2>&1 &
  local pid=$!
  for _ in $(seq 1 60); do curl -s -o /dev/null http://127.0.0.1:8013/docs && break; sleep 0.5; done
  $PY "$HERE/sandbox-perf-load.py" --base http://127.0.0.1:8013/api/v1 --tasks "$TASKS" \
      --reps "$REPS" --frontend "$fe" --out "$OUT/$name" >/dev/null 2>&1
  kill "$pid"; wait "$pid" 2>/dev/null || true
  echo "$name done"
}

run baseline  ""                                  main
run dedupe    ""                                  dedupe
run batch     "batch-drafts"                      batch
run norepair  "no-repair"                         main
run syncauth  "sync-auth"                         main
run all       "batch-drafts,no-repair,sync-auth"  batch
