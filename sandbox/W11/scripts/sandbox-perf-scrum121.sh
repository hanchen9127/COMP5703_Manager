#!/usr/bin/env bash
# SCRUM-121 before/after on the A6 perf bed: main against the branch, same seed, same machine.
# From the hej-perf worktree's apps/hej-api, with the throwaway hej-perf-pg container up and its
# /tmp/seed.dump made by sandbox-perf-seed-a6.py:
#   bash <path>/sandbox-perf-scrum121.sh <main commit> <branch commit> <out root> '<seed json>' [reps]
# Checks each commit out detached in this worktree, restores the seed snapshot, and runs the pages.
set -euo pipefail
MAIN="$1"; BRANCH="$2"; OUT="$3"; TASKS="$4"; REPS="${5:-5}"
BREAK="$(cd "$(dirname "$0")/../../Break/scripts" && pwd)"
PY=.venv/Scripts/python
export DATABASE_URL=postgresql://perf:perf@127.0.0.1:55432/hej_perf

run() {  # name, commit, frontend
  local name="$1" commit="$2" fe="$3"
  git checkout -q --detach "$commit"
  rm -rf "$OUT/$name"
  MSYS_NO_PATHCONV=1 docker exec hej-perf-pg sh -c "pg_restore -U perf -d hej_perf --clean --if-exists /tmp/seed.dump" >/dev/null 2>&1 || true
  $PY "$BREAK/sandbox-perf-server.py" --port 8013 --out "$OUT/$name" >/dev/null 2>&1 &
  local pid=$!
  for _ in $(seq 1 60); do curl -s -o /dev/null http://127.0.0.1:8013/docs && break; sleep 0.5; done
  $PY "$BREAK/sandbox-perf-load.py" --base http://127.0.0.1:8013/api/v1 --tasks "$TASKS" \
      --reps "$REPS" --frontend "$fe" --out "$OUT/$name" >/dev/null 2>&1
  kill "$pid"; wait "$pid" 2>/dev/null || true
  echo "$name done ($(git log --oneline -1 | cut -c1-60))"
}

run main "$MAIN" a6-main
run scrum121 "$BRANCH" scrum121
