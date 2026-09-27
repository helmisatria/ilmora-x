# AGENTS.md

Repository operational playbook for this project on Railway.

## Objective
- Reduce debug time for environment + DB issues.
- Keep checks deterministic and copy/pasteable.
- Avoid SSH tunnels unless explicitly needed.

## Default context for this repo
- App service: `ilmora-x`
- PostgreSQL service: `Postgres`
- Typical environments: `staging` or `production`
- Default debug email: `satriahelmi@gmail.com`

## Trello action board

- Board: [Ilmora X](https://trello.com/b/iL0ArxLw/ilmora-x). Use `To Do` for open gaps against `docs/20260419 - IlmoraX - Updated Proposal.md` and `docs/MILESTONE_CLOSEOUT.md`.
- Check existing cards before creating one. Keep each card to one outcome; write a short description with the current gap and a clear done condition.
- Add one scope label (`M1`, `M2`, `M3`, or `Release`) and one priority label: `P0` for a critical blocker, `P1` for work needed to close a milestone, or `P2` for a lower-impact follow-up. Add `Decision` or `Verification` when relevant.
- Phase 0 is complete. Referral discounts are deferred; do not add them as open gaps unless scope changes.
- Update or close cards only after checking the code and, where needed, staging behavior. A Trello card alone is not proof of deployment or acceptance.

Use [trello-cli](https://github.com/mheap/trello-cli/tree/main/packages/trello-cli) with the configured local authentication:

```bash
trello sync
trello card:list --board 'Ilmora X' --list 'To Do' --format json
trello card:create --board 'Ilmora X' --list 'To Do' \
  --name 'Short action title' \
  --description 'Current gap. Done when the expected behavior is verified.' \
  --label M2 --label P1 --format json
```

## 30-second Railway triage sequence

```bash
export ENV=${1:-staging}
export APP_SERVICE=${2:-ilmora-x}
export DB_SERVICE=${3:-Postgres}

railway environment "$ENV"
railway status
```

## Get values and DB connection fast

```bash
APP_JSON=$(railway variables --service "$APP_SERVICE" --environment "$ENV" --json)
DB_JSON=$(railway variables --service "$DB_SERVICE" --environment "$ENV" --json)

# print key app vars (replace KEY with what you need)
echo "$APP_JSON" | jq -r '.[] | select(.name=="SOME_KEY" or .name=="ANOTHER_KEY").name + \"=\" + (.value // "")'

# DB URL to use with local psql
export DATABASE_URL=$(echo "$DB_JSON" | jq -r '.[] | select(.name=="DATABASE_PUBLIC_URL" or .name=="DATABASE_URL").value // empty')
echo "DATABASE_URL=${DATABASE_URL:0:25}..."
```

## Fast DB checks template

```bash
export CHECK_SQL="$(
cat <<'SQL'
SELECT <projection>
FROM <table>
WHERE <predicate>;
SQL
)"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -P pager=off -F '|' -A -c "$CHECK_SQL"
```

## Practical examples

### 1) Find a record

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -P pager=off -F '|' -A -c "
SELECT *
FROM <table>
WHERE <predicate>
LIMIT 20;
"
```

### 2) Existence check (boolean output for quick scripts)

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -A -c "
SELECT CASE WHEN EXISTS (<subquery>) THEN 'OK' ELSE 'MISSING' END;
"
```

### 3) One-liner run-and-report helper

```bash
DEFAULT_DEBUG_EMAIL="satriahelmi@gmail.com"
EMAIL="${1:-$DEFAULT_DEBUG_EMAIL}"
TABLE="${2:-admin_members}"

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -A -c "
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM ${TABLE}
      WHERE lower(email)=lower('${EMAIL}')
        AND removed_at IS NULL
    ) THEN 'OK'
    ELSE 'MISSING_OR_INACTIVE'
  END;
"
```

## Recommended workflow (safe order)
- Confirm Railway context first (`railway environment` and `railway status`).
- Read app variables (`railway variables`).
- Query DB directly with minimal scoped SQL.
- Fix only one layer at a time (env var first, then data state).
- Re-run the check command after each change.
- Only then restart app if required by your deployment policy.

## Notes for this repo
- This repo previously had runtime `/admin` checks backed by DB state, which is why many “env var looks set” cases are false positives.
- Always query actual tables for source-of-truth before assuming config is wrong.

## Suggested snippet to keep in shell history

```bash
ENV="${1:-staging}"
APP_SERVICE="${2:-ilmora-x}"
DB_SERVICE="${3:-Postgres}"
railway environment "$ENV"
DB_URL="$(railway variables --service \"$DB_SERVICE\" --environment \"$ENV\" --json | jq -r '.[] | select(.name==\"DATABASE_PUBLIC_URL\" or .name==\"DATABASE_URL\").value // empty')"
psql \"$DB_URL\" -v ON_ERROR_STOP=1 -A -c \"SELECT now()::timestamptz;\" 
```
