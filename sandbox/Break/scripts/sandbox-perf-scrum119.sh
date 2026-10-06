#!/usr/bin/env bash
# SCRUM-119 before/after, on the A6 perf bed: current main against the branch, same seed, same machine.
# From the hej-perf worktree's apps/hej-api (its .env on the throwaway hej_perf database):
#   bash <path>/sandbox-perf-scrum119.sh <main commit> <branch commit> <out root> [reps]
# Checks each commit out detached in this worktree, restores the seed snapshot, and runs the pages.
set -euo pipefail
MAIN="$1"; BRANCH="$2"; OUT="$3"; REPS="${4:-5}"
HERE="$(cd "$(dirname "$0")" && pwd)"
PY=.venv/Scripts/python
TASKS='{"project_id": "proj_1aabf28bb6cd", "t10": "task_dcf0a3870f23", "t50": "task_791288fa1906", "t200": "task_f6d71692c0d6"}'

run() {  # name, commit, frontend
  local name="$1" commit="$2" fe="$3"
  git checkout -q --detach "$commit"
  rm -rf "$OUT/$name"
  MSYS_NO_PATHCONV=1 docker exec hej-perf-pg sh -c "pg_restore -U perf -d hej_perf --clean --if-exists /tmp/seed.dump" >/dev/null 2>&1 || true
  $PY "$HERE/sandbox-perf-server.py" --port 8013 --out "$OUT/$name" >/dev/null 2>&1 &
  local pid=$!
  for _ in $(seq 1 60); do curl -s -o /dev/null http://127.0.0.1:8013/docs && break; sleep 0.5; done
  $PY "$HERE/sandbox-perf-load.py" --base http://127.0.0.1:8013/api/v1 --tasks "$TASKS" \
      --reps "$REPS" --frontend "$fe" --out "$OUT/$name" >/dev/null 2>&1
  kill "$pid"; wait "$pid" 2>/dev/null || true
  echo "$name done ($(git log --oneline -1 | cut -c1-60))"
}

run main-now "$MAIN" main-now
run scrum119 "$BRANCH" scrum119
