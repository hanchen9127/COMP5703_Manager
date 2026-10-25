#!/usr/bin/env bash
# The Dashboard at two portfolio sizes, main against SCRUM-121's commits 6-7 (2026-10-24).
# From the hej-perf worktree's apps/hej-api, with hej-perf-pg up holding /tmp/seed.dump (11 projects)
# and /tmp/seed51.dump (the same plus 40, from sandbox-perf-seed-a6.py --extra-projects 40):
#   bash <path>/sandbox-perf-home.sh <main commit> <branch commit> <out root> [reps]
set -euo pipefail
MAIN="$1"; BRANCH="$2"; OUT="$3"; REPS="${4:-5}"
BREAK="$(cd "$(dirname "$0")/../../Break/scripts" && pwd)"
PY=.venv/Scripts/python
TASKS='{"t10": "x", "t50": "x", "t200": "x", "project_id": "x"}'
export DATABASE_URL=postgresql://perf:perf@127.0.0.1:55432/hej_perf

run() {  # dump, name, commit, frontend
  local dump="$1" name="$2" commit="$3" fe="$4"
  git checkout -q --detach "$commit"
  MSYS_NO_PATHCONV=1 docker exec hej-perf-pg sh -c "pg_restore -U perf -d hej_perf --clean --if-exists /tmp/$dump.dump" >/dev/null 2>&1 || true
  $PY "$BREAK/sandbox-perf-server.py" --port 8013 --out "$OUT/$name" >/dev/null 2>&1 &
  local pid=$!
  for _ in $(seq 1 60); do curl -s -o /dev/null http://127.0.0.1:8013/docs && break; sleep 0.5; done
  $PY "$BREAK/sandbox-perf-load.py" --base http://127.0.0.1:8013/api/v1 --tasks "$TASKS" --reps "$REPS" \
      --frontend "$fe" --only home-admin,home-ann1 --out "$OUT/$name" >/dev/null 2>&1
  kill "$pid"; wait "$pid" 2>/dev/null || true
  echo "$name done ($(git log --oneline -1 | cut -c1-60))"
}

run seed p11-main "$MAIN" a6-main
run seed p11-branch "$BRANCH" org-batch
run seed51 p51-main "$MAIN" a6-main
run seed51 p51-branch "$BRANCH" org-batch
