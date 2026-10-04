#!/usr/bin/env bash
# H2 at scale: how GET task-items behaves as audit_logs grows, with and without
# an index on (task_id, operation). Uses its own database, hej_perf_scale, built
# from the seed snapshot; the measurement database is not touched.
# From a hej worktree's apps/hej-api:
#   bash <path>/sandbox-perf-audit-scale.sh '<seed json>' <out root>
set -euo pipefail
TASKS="$1"; OUT="$2"
HERE="$(cd "$(dirname "$0")" && pwd)"
PY=.venv/Scripts/python
PSQL=(docker exec -i hej-perf-pg psql -U perf -d hej_perf_scale -qtA)
T200=$($PY -c "import json,sys; print(json.loads(sys.argv[1])['t200'])" "$TASKS")

docker exec hej-perf-pg sh -c "dropdb -U perf --if-exists hej_perf_scale && createdb -U perf hej_perf_scale && pg_restore -U perf -d hej_perf_scale /tmp/seed.dump" >/dev/null 2>&1 || true

measure() {  # label
  local label="$1"
  "${PSQL[@]}" -c "ANALYZE audit_logs;"
  rm -rf "$OUT/$label"
  DATABASE_URL=postgresql://perf:perf@localhost:55432/hej_perf_scale \
    $PY "$HERE/sandbox-perf-server.py" --port 8014 --out "$OUT/$label" >/dev/null 2>&1 &
  local pid=$!
  for _ in $(seq 1 60); do curl -s -o /dev/null http://127.0.0.1:8014/docs && break; sleep 0.5; done
  $PY "$HERE/sandbox-perf-load.py" --base http://127.0.0.1:8014/api/v1 --tasks "$TASKS" --reps 5 \
      --only items-t200-admin --out "$OUT/$label" >/dev/null 2>&1
  kill "$pid"; wait "$pid" 2>/dev/null || true
  {
    echo "== $label: audit_logs rows $("${PSQL[@]}" -c 'select count(*) from audit_logs')"
    "${PSQL[@]}" -c "EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM audit_logs WHERE task_id = '$T200'
      AND operation = 'escalation_decided' AND resource_type = 'task_item' ORDER BY created_at DESC;"
  } >> "$OUT/explain.txt"
  echo "$label done"
}

# Synthetic history from 2,000 other tasks, shaped like the real rows.
grow_to() {  # total rows wanted
  local want="$1" have
  have=$("${PSQL[@]}" -c "select count(*) from audit_logs")
  [ "$have" -ge "$want" ] && return
  "${PSQL[@]}" -c "INSERT INTO audit_logs (resource_type, resource_id, operation, operator_id, new_values, description, created_at, project_id, task_id)
    SELECT 'task_item', 'item_fake_' || g,
           (ARRAY['draft_started','draft_submitted','review_action','escalation_routed','escalation_decided'])[1 + g % 5],
           1, '{\"decision\": \"send_back\"}'::jsonb, 'synthetic', now() - (g || ' seconds')::interval,
           'proj_fake_' || (g % 200), 'task_fake_' || (g % 2000)
    FROM generate_series($have + 1, $want) g;"
}

rm -f "$OUT/explain.txt"; mkdir -p "$OUT"
measure rows-seed
for n in 100000 1000000; do
  grow_to $n
  measure "rows-$n-noindex"
done
"${PSQL[@]}" -c "CREATE INDEX ix_perf_audit_task_op ON audit_logs (task_id, operation);"
measure "rows-1000000-index"
