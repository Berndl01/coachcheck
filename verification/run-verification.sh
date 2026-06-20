#!/usr/bin/env bash
# Reproduzierbare DB-Verifikation gegen echtes PostgreSQL.
# Voraussetzung: laufendes PG-Cluster, Rolle postgres erreichbar (su postgres).
set -e
DB=ccverify
su postgres -c "psql -tAc 'drop database if exists $DB;'"
su postgres -c "psql -tAc 'create database $DB;'"
su postgres -c "psql -q -d $DB -f $(pwd)/verification/harness.sql"
echo "== Migrationen 01→43 =="
for f in $(ls supabase/migrations/*.sql | sort); do
  su postgres -c "psql -v ON_ERROR_STOP=1 -q -d $DB -f $(pwd)/$f" >/dev/null && echo "OK $(basename $f)"
done
echo "== Abläufe + Feedbacks =="
su postgres -c "psql -v ON_ERROR_STOP=1 -d $DB -f $(pwd)/verification/flow_a.sql" 2>&1 | grep -E 'PASS|FAIL'
su postgres -c "psql -d $DB -f $(pwd)/verification/flow_b.sql" 2>&1 | grep -E 'PASS|FAIL'
su postgres -c "psql -d $DB -f $(pwd)/verification/flow_c.sql" 2>&1 | grep -E 'PASS|FAIL'
