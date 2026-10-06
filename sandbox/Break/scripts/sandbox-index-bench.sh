#!/bin/sh
DB=$1
for n in 1 2 3 4 5 6 7 8 9 10 11; do
  for pass in 1 2; do
    out=$( { cat /tmp/bench.sql; echo "EXPLAIN (ANALYZE, BUFFERS) :q$n;"; } | psql -U perf -d "$DB" -At 2>&1 )
  done
  t=$(echo "$out" | grep "Execution Time" | sed 's/.*: //')
  top=$(echo "$out" | grep -E "Scan|Join|Aggregate|Sort |Limit|Unique|Hash " | head -3 | sed 's/ *(cost.*//; s/^[ ->]*//' | tr '\n' '|')
  printf "q%-3s %12s  %s\n" "$n" "$t" "$top"
done
